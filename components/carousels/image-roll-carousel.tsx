import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// User request: Create a new Framer code component named CurvedImageLine ("Curved Image Line") with an infinite auto-scrolling 3D curved image strip, modular seamless looping, IntersectionObserver pausing, reduced-motion static fallback, and the requested property controls/sizing.

interface MyComponentProps {
    images: Array<{ src?: string; srcSet?: string; alt?: string }>
    speed: number
    direction: "left" | "right"
    curvature: number
    perspective: number
    cardWidth: number
    cardHeight: number
    spacing: number
    cornerRadius: number
    edgeFade: boolean
    backgroundColor: string
}

const defaultImages = [
    {
        src: "https://images.unsplash.com/photo-1773126314916-ba015ecc9d5b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
        alt: "Placeholder image 1",
    },
    {
        src: "https://images.unsplash.com/photo-1532423529482-f814a2231379?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
        alt: "Placeholder image 2",
    },
    {
        src: "https://images.unsplash.com/photo-1760727466322-c50882c9e578?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
        alt: "Placeholder image 3",
    },
    {
        src: "https://images.unsplash.com/photo-1690723357931-25f11fa74dfe?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
        alt: "Placeholder image 4",
    },
    {
        src: "https://images.unsplash.com/photo-1604092040269-f9a7eab2a813?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
        alt: "Placeholder image 5",
    },
    {
        src: "https://images.unsplash.com/photo-1651127695838-bcfe17e23fff?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
        alt: "Placeholder image 6",
    },
    {
        src: "https://images.unsplash.com/photo-1648155230974-d3ddac2f7e3c?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
        alt: "Placeholder image 7",
    },
    {
        src: "https://images.unsplash.com/photo-1561465071-811d8efb8c11?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
        alt: "Placeholder image 8",
    },
]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CurvedImageLine(props: MyComponentProps) {
    const {
        images = defaultImages,
        speed = 60,
        direction = "left",
        curvature = 280,
        perspective = 1200,
        cardWidth = 220,
        cardHeight = 300,
        spacing = 28,
        cornerRadius = 20,
        edgeFade = true,
        backgroundColor = "rgba(0,0,0,0)",
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const frameRef = React.useRef<number | null>(null)
    const lastTimeRef = React.useRef<number | null>(null)
    const offsetRef = React.useRef(0)
    const [offset, setOffset] = React.useState(0)
    const [isInView, setIsInView] = React.useState(true)
    const [reducedMotion, setReducedMotion] = React.useState(false)

    const preparedImages = React.useMemo(() => {
        const valid = (images || []).filter((img) => Boolean(img?.src))
        return valid.length > 0 ? valid : defaultImages
    }, [images])

    const step = React.useMemo(() => Math.max(1, cardWidth + spacing), [cardWidth, spacing])
    const cycleLength = React.useMemo(
        () => Math.max(step, preparedImages.length * step),
        [preparedImages.length, step]
    )

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const media = window.matchMedia("(prefers-reduced-motion: reduce)")
            React.startTransition(() => setReducedMotion(media.matches))
            const handler = (event: MediaQueryListEvent) => {
                React.startTransition(() => setReducedMotion(event.matches))
            }
            if (media.addEventListener) media.addEventListener("change", handler)
            else media.addListener(handler)
            return () => {
                if (media.removeEventListener) media.removeEventListener("change", handler)
                else media.removeListener(handler)
            }
        } else {
            React.startTransition(() => setReducedMotion(false))
        }
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                React.startTransition(() => setIsInView(Boolean(entry?.isIntersecting)))
            },
            { threshold: 0.01 }
        )
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const animate = React.useCallback(
        (time: number) => {
            if (lastTimeRef.current === null) lastTimeRef.current = time
            const dt = (time - lastTimeRef.current) / 1000
            lastTimeRef.current = time
            const dir = direction === "left" ? -1 : 1
            offsetRef.current += dir * speed * dt
            offsetRef.current =
                ((offsetRef.current % cycleLength) + cycleLength) % cycleLength
            React.startTransition(() => setOffset(offsetRef.current))
            frameRef.current = window.requestAnimationFrame(animate)
        },
        [cycleLength, direction, speed]
    )

    React.useEffect(() => {
        const canAnimate = !isStaticRenderer && !reducedMotion && isInView
        if (typeof window === "undefined" || !canAnimate) {
            if (frameRef.current !== null && typeof window !== "undefined") {
                window.cancelAnimationFrame(frameRef.current)
            }
            frameRef.current = null
            lastTimeRef.current = null
            return
        }
        frameRef.current = window.requestAnimationFrame(animate)
        return () => {
            if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
            frameRef.current = null
            lastTimeRef.current = null
        }
    }, [animate, isInView, isStaticRenderer, reducedMotion])

    const activeOffset = !isStaticRenderer && !reducedMotion ? offset : 0
    const halfSpan = cycleLength / 2

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                perspective: `${perspective}px`,
                transformStyle: "preserve-3d",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                }}
            >
                {preparedImages.map((image, i) => {
                    let x = i * step - activeOffset
                    x = ((x % cycleLength) + cycleLength) % cycleLength
                    if (x > halfSpan) x -= cycleLength

                    const distance = Math.min(1, Math.abs(x) / Math.max(1, halfSpan))
                    const side = x < 0 ? 1 : -1
                    const rotateY = side * distance * 56
                    const z = -curvature * distance * distance
                    const scale = 1 - distance * 0.13
                    const opacity = edgeFade ? 1 - distance * 0.45 : 1

                    return (
                        <div
                            key={`${i}-${image.src || "image"}`}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: `${cardWidth}px`,
                                height: `${cardHeight}px`,
                                borderRadius: `${cornerRadius}px`,
                                overflow: "hidden",
                                transformStyle: "preserve-3d",
                                transform: `translate3d(calc(-50% + ${x}px), -50%, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                                opacity,
                                willChange: "transform, opacity",
                                backfaceVisibility: "hidden",
                            }}
                        >
                            <img
                                {...image}
                                alt={image.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

CurvedImageLine.displayName = "Curved Image Line"

addPropertyControls(CurvedImageLine, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        defaultValue: defaultImages,
        maxCount: 20,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 60,
        min: 0,
        max: 400,
        step: 1,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    curvature: {
        type: ControlType.Number,
        title: "Curvature",
        defaultValue: 280,
        min: 0,
        max: 800,
        step: 1,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 200,
        max: 3000,
        step: 10,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card W",
        defaultValue: 220,
        min: 80,
        max: 600,
        step: 1,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card H",
        defaultValue: 300,
        min: 100,
        max: 800,
        step: 1,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 28,
        min: 0,
        max: 300,
        step: 1,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 120,
        step: 1,
    },
    edgeFade: {
        type: ControlType.Boolean,
        title: "Edge Fade",
        defaultValue: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },
})