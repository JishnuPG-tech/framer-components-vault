import { useRef, useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function StickyBlurReveal(props) {
    const {
        text = "",
        color,
        font,
        fontSize,
        lineHeight,
        fullRevealDistance,
        initialBlur,
        initialOpacity,
        letterSpacing,
    } = props

    const containerRef = useRef(null)
    const words = (text || "").split(" ")
    const [scrollProgress, setScrollProgress] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    useEffect(() => {
        if (isCanvas) return

        let startPosition = 0
        let endPosition = 0
        let containerHeight = 0

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    const rect = entry.boundingClientRect
                    startPosition = window.scrollY + rect.top
                    containerHeight = rect.height
                    endPosition = startPosition + fullRevealDistance
                    handleScroll()
                } else {
                    setIsVisible(false)
                }
            },
            { threshold: [0] }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        const handleScroll = () => {
            if (!isVisible) return

            const currentScroll = window.scrollY
            const elementTop = startPosition - currentScroll
            const visibleHeight = window.innerHeight - elementTop

            const progress =
                (visibleHeight - containerHeight) /
                (fullRevealDistance - containerHeight)
            setScrollProgress(Math.max(0, Math.min(1, progress)))
        }

        window.addEventListener("scroll", handleScroll, { passive: true })

        return () => {
            window.removeEventListener("scroll", handleScroll)
            if (containerRef.current) {
                observer.unobserve(containerRef.current)
            }
        }
    }, [fullRevealDistance, isCanvas, isVisible])

    return (
        <div
            ref={containerRef}
            style={{
                position: "sticky",
                top: 0,
                width: "100%", // ✅ full width
                color: color,
                fontFamily: font?.fontFamily,
                fontWeight: font?.fontWeight,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                opacity: isVisible || isCanvas ? 1 : 0,
                letterSpacing: `${letterSpacing}px`,
                textAlign: "center", // ✅ centered text
                boxSizing: "border-box",
                padding: 0, // ✅ no padding
                margin: 0, // ✅ no margin
            }}
        >
            {words.map((word, index) => {
                const wordProgress = isCanvas
                    ? 1
                    : (scrollProgress - index / words.length) * words.length
                const progress = Math.max(0, Math.min(1, wordProgress))
                const blurAmount = initialBlur * (1 - progress)
                const opacity = initialOpacity + (1 - initialOpacity) * progress
                return (
                    <span
                        key={index}
                        style={{
                            display: "inline-block",
                            marginRight: "0.25em",
                            filter: `blur(${blurAmount}px)`,
                            opacity: opacity,
                            transition:
                                "filter 0.2s ease-out, opacity 0.2s ease-out",
                        }}
                    >
                        {word}
                    </span>
                )
            })}
        </div>
    )
}

StickyBlurReveal.defaultProps = {
    text: "This text unblurs and fades in word by word as you scroll",
    color: "#000000",
    font: {
        fontFamily: "Inter",
        fontWeight: 400,
    },
    fontSize: 24,
    lineHeight: 1.5,
    fullRevealDistance: 1000,
    initialBlur: 3,
    initialOpacity: 0.1,
    letterSpacing: 0,
}

addPropertyControls(StickyBlurReveal, {
    text: { type: ControlType.String, title: "Text" },
    color: { type: ControlType.Color, title: "Color" },
    font: { type: ControlType.Font, title: "Font" },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 1,
        max: 100,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    fullRevealDistance: {
        type: ControlType.Number,
        title: "Full Reveal Distance",
        min: 100,
        max: 5000,
        step: 10,
    },
    initialBlur: {
        type: ControlType.Number,
        title: "Initial Blur",
        min: 0,
        max: 10,
        step: 0.5,
    },
    initialOpacity: {
        type: ControlType.Number,
        title: "Initial Opacity",
        min: 0,
        max: 1,
        step: 0.05,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        min: -5,
        max: 20,
        step: 0.1,
        defaultValue: 0,
    },
})
