// Scroll appear animation for video and image: fades in on scroll, fades out when scrolling stops
import { useEffect, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ScrollAppearProps {
    image: { src: string; alt: string }
    videoFile: string
    showImage: boolean
    fadeInDuration: number
    fadeOutDuration: number
    blur: number
    style?: React.CSSProperties
}

/**
 * ScrollFade
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollFade(props: ScrollAppearProps) {
    const { image = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" }, videoFile = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4", showImage, fadeInDuration, fadeOutDuration, blur = 0, style } = props
    const [visible, setVisible] = useState(false)
    const [opacity, setOpacity] = useState(0)
    const [maxScroll, setMaxScroll] = useState(0)
    const scrollTimeout = useRef<number | null>(null)
    const animationFrame = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()

    // Smooth fade logic
    useEffect(() => {
        if (isStatic) {
            startTransition(() => setVisible(true))
            setOpacity(1)
            return
        }
        function onScroll() {
            startTransition(() => setVisible(true))
            // Track max scroll distance in session
            if (typeof window !== "undefined") {
                const scrollTop = window.scrollY || window.pageYOffset || 0
                setMaxScroll((prev) => (scrollTop > prev ? scrollTop : prev))
            }
            if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current)
            scrollTimeout.current = window.setTimeout(() => {
                startTransition(() => setVisible(false))
            }, 300)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", onScroll)
            if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current)
            if (animationFrame.current) cancelAnimationFrame(animationFrame.current)
        }
    }, [isStatic])

    // Animate opacity for smoother fade
    useEffect(() => {
        if (isStatic) return
        let raf: number
        let start: number | null = null
        const duration = visible ? fadeInDuration : fadeOutDuration
        const from = opacity
        // Fade strength based on maxScroll: more scroll = higher fade in, less = lower
        let fadeTarget = visible ? 1 : 0
        if (visible) {
            // If maxScroll is small (<200px), fade in only to 0.5, else up to 1
            if (maxScroll < 200) fadeTarget = 0.5 + 0.5 * (maxScroll / 200)
            else fadeTarget = 1
        }
        const to = fadeTarget
        if (from === to) return
        function animate(ts: number) {
            if (start === null) start = ts
            const elapsed = ts - start
            const progress = Math.min(elapsed / duration, 1)
            const value = from + (to - from) * progress
            setOpacity(value)
            if (progress < 1) {
                raf = requestAnimationFrame(animate)
                animationFrame.current = raf
            } else {
                setOpacity(to)
            }
        }
        raf = requestAnimationFrame(animate)
        animationFrame.current = raf
        return () => {
            if (raf) cancelAnimationFrame(raf)
        }
    }, [visible, fadeInDuration, fadeOutDuration, maxScroll])

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {showImage ? (
                <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: opacity,
                        transition: "none",
                        pointerEvents: "none",
                        userSelect: "none",
                        filter: blur > 0 ? `blur(${blur}px)` : undefined,
                    }}
                />
            ) : (
                <video
                    src={videoFile}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: opacity,
                        transition: "none",
                        pointerEvents: "none",
                        userSelect: "none",
                        filter: blur > 0 ? `blur(${blur}px)` : undefined,
                    }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-label="Scroll video"
                />
            )}
        </div>
    )
}

addPropertyControls(ScrollFade, {
    showImage: {
        type: ControlType.Boolean,
        title: "Show Image",
        defaultValue: true,
        enabledTitle: "Image",
        disabledTitle: "Video",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    videoFile: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    fadeInDuration: {
        type: ControlType.Number,
        title: "Fade In Duration",
        defaultValue: 400,
        min: 100,
        max: 2000,
        unit: "ms",
        step: 50,
    },
    fadeOutDuration: {
        type: ControlType.Number,
        title: "Fade Out Duration",
        defaultValue: 400,
        min: 100,
        max: 2000,
        unit: "ms",
        step: 50,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
})