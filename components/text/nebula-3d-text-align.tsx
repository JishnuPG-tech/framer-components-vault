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


type Trigger = "viewport" | "hover" | "loop" | "static"

interface Props {
    text: string
    font: any
    textColor: string
    texture?: string
    textureScale: "cover" | "contain" | "auto"
    strokeColor: string
    strokeWidth: number
    extrusionColor: string
    extrusionDepth: number
    shadowBlur: number
    glowColor: string
    glowSize: number
    backgroundColor: string
    backgroundImage?: string
    backgroundScale: "cover" | "contain" | "auto"
    perspective: number
    rotateX: number
    rotateY: number
    rotateZ: number
    tiltedScale: number
    trigger: Trigger
    duration: number
    delay: number
    hold: number
    easing: string
    align: "left" | "center" | "right"
    padding: number
    responsive: boolean
    minSize: number
    advanced: boolean
    style?: React.CSSProperties
}

const DEFAULT_STAR_IMAGE = "https://s.cdpn.io/31787/stars.jpg"

function buildExtrusion(color: string, depth: number, blur: number) {
    const layers: string[] = []
    const safeDepth = Math.max(0, Math.round(depth))
    for (let i = 1; i <= safeDepth; i++) {
        layers.push(`${i}px ${i}px 0 ${color}`)
    }
    layers.push(
        `${safeDepth + 2}px ${safeDepth + 2}px ${Math.max(0, blur)}px rgba(0,0,0,.5)`
    )
    return layers.join(", ")
}

export default function NebulaAlign(props: Props) {
    const {
        text,
        font,
        textColor,
        texture,
        textureScale,
        strokeColor,
        strokeWidth,
        extrusionColor,
        extrusionDepth,
        shadowBlur,
        glowColor,
        glowSize,
        backgroundColor,
        backgroundImage,
        backgroundScale,
        perspective,
        rotateX,
        rotateY,
        rotateZ,
        tiltedScale,
        trigger,
        duration,
        delay,
        hold,
        easing,
        align,
        padding,
        responsive,
        minSize,
        style,
    } = props

    const [hovered, setHovered] = React.useState(false)
    const [inView, setInView] = React.useState(false)
    const [responsiveSize, setResponsiveSize] = React.useState<
        number | undefined
    >()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const measureRef = React.useRef<HTMLSpanElement>(null)
    const isStatic = useIsStaticRenderer()

    React.useEffect(() => {
        const node = containerRef.current
        if (!node || isStatic || (trigger !== "viewport" && trigger !== "loop"))
            return

        let timer = 0
        const observer = new IntersectionObserver(
            ([entry]) => {
                window.clearTimeout(timer)
                if (entry.isIntersecting && trigger === "viewport") {
                    setInView(false)
                    timer = window.setTimeout(() => setInView(true), 20)
                } else {
                    setInView(entry.isIntersecting)
                }
            },
            { threshold: 0.18 }
        )
        observer.observe(node)
        return () => {
            window.clearTimeout(timer)
            observer.disconnect()
        }
    }, [isStatic, trigger])

    React.useLayoutEffect(() => {
        if (!responsive) {
            setResponsiveSize(undefined)
            return
        }

        const container = containerRef.current
        const measure = measureRef.current
        if (!container || !measure) return

        const update = () => {
            const maxSize = Math.max(
                minSize,
                Number.parseFloat(String(font?.fontSize)) || 200
            )
            const availableWidth = Math.max(
                1,
                container.clientWidth - padding * 2 - extrusionDepth - 4
            )
            const availableHeight = Math.max(
                1,
                container.clientHeight - padding * 2 - extrusionDepth - 4
            )
            const naturalWidth = Math.max(1, measure.scrollWidth)
            const naturalHeight = Math.max(1, measure.scrollHeight)
            const scale = Math.min(
                1,
                availableWidth / naturalWidth,
                availableHeight / naturalHeight
            )
            setResponsiveSize(Math.max(minSize, Math.floor(maxSize * scale)))
        }

        const observer = new ResizeObserver(update)
        observer.observe(container)
        update()
        document.fonts?.ready.then(update)
        return () => observer.disconnect()
    }, [responsive, text, font, minSize, padding, extrusionDepth])

    const aligned =
        isStatic || trigger === "static"
            ? false
            : trigger === "hover"
              ? hovered
              : trigger === "viewport"
                ? inView
                : false

    const className = `nebula-text ${trigger === "loop" && !isStatic && inView ? "nebula-loop" : ""}`
    const image = texture || backgroundImage || DEFAULT_STAR_IMAGE
    const depthShadow = buildExtrusion(
        extrusionColor,
        extrusionDepth,
        shadowBlur
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
                backgroundColor,
                backgroundImage: backgroundImage
                    ? `url(${backgroundImage})`
                    : undefined,
                backgroundSize: backgroundScale,
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent:
                    align === "left"
                        ? "flex-start"
                        : align === "right"
                          ? "flex-end"
                          : "center",
                padding,
                perspective: `${perspective}px`,
                containerType: "inline-size",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <style>{`
                @keyframes nebula-align-loop {
                    0%, 18% { transform: rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${tiltedScale}); }
                    45%, 68% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1); }
                    95%, 100% { transform: rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${tiltedScale}); }
                }
                .nebula-loop {
                    animation: nebula-align-loop ${Math.max(0.2, duration * 2 + hold * 2)}s ${easing} ${Math.max(0, delay)}s infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .nebula-text { animation: none !important; transition-duration: .01ms !important; }
                }
            `}</style>
            {responsive && (
                <span
                    ref={measureRef}
                    aria-hidden="true"
                    style={{
                        ...font,
                        position: "absolute",
                        visibility: "hidden",
                        pointerEvents: "none",
                        width: "max-content",
                        maxWidth: "none",
                        whiteSpace: "pre",
                        fontSize: Math.max(
                            minSize,
                            Number.parseFloat(String(font?.fontSize)) || 200
                        ),
                        lineHeight: font?.lineHeight || 0.88,
                        letterSpacing: font?.letterSpacing,
                        textTransform: "uppercase",
                    }}
                >
                    {text}
                </span>
            )}
            <div
                className={className}
                aria-label={text}
                style={{
                    ...font,
                    fontSize: responsive ? responsiveSize : font?.fontSize,
                    position: "relative",
                    display: "inline-block",
                    maxWidth: "100%",
                    textAlign: align,
                    whiteSpace: responsive ? "pre" : "pre-wrap",
                    overflowWrap: responsive ? "normal" : "anywhere",
                    lineHeight: font?.lineHeight || 0.88,
                    letterSpacing: font?.letterSpacing,
                    textTransform: "uppercase",
                    transformOrigin:
                        align === "left"
                            ? "left center"
                            : align === "right"
                              ? "right center"
                              : "center",
                    transform: aligned
                        ? "rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)"
                        : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${tiltedScale})`,
                    transition: isStatic
                        ? "none"
                        : `transform ${Math.max(0, duration)}s ${easing} ${trigger === "hover" ? 0 : Math.max(0, delay)}s`,
                    willChange: "transform",
                }}
            >
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 0,
                        color: "transparent",
                        WebkitTextFillColor: "transparent",
                        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
                        textShadow: depthShadow,
                        pointerEvents: "none",
                    }}
                >
                    {text}
                </span>
                <span
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "block",
                        color: textColor,
                        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        backgroundImage: `url(${image})`,
                        backgroundSize: textureScale,
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        WebkitTextFillColor: "transparent",
                        textShadow: `0 0 ${glowSize}px ${glowColor}`,
                    }}
                >
                    {text}
                </span>
            </div>
        </div>
    )
}

NebulaAlign.defaultProps = {
    text: "Framer",
    font: {
        fontFamily: "Open Sans, sans-serif",
        fontSize: "clamp(64px, 16vw, 230px)",
        fontWeight: 800,
        lineHeight: 0.88,
        letterSpacing: "-0.06em",
    },
    textColor: "#FFFFFF",
    texture: DEFAULT_STAR_IMAGE,
    textureScale: "cover",
    strokeColor: "#FFFFFF",
    strokeWidth: 1.5,
    extrusionColor: "#000645",
    extrusionDepth: 13,
    shadowBlur: 18,
    glowColor: "rgba(61, 47, 255, .55)",
    glowSize: 55,
    backgroundColor: "#02020B",
    backgroundImage: DEFAULT_STAR_IMAGE,
    backgroundScale: "cover",
    perspective: 700,
    rotateX: 45,
    rotateY: 5,
    rotateZ: 45,
    tiltedScale: 0.8,
    trigger: "viewport",
    duration: 1.1,
    delay: 0,
    hold: 1.2,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    align: "center",
    padding: 32,
    responsive: true,
    minSize: 24,
    advanced: false,
}

addPropertyControls(NebulaAlign, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Framer",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    responsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
    },
    minSize: {
        type: ControlType.Number,
        title: "Min Size",
        min: 8,
        max: 160,
        step: 1,
        unit: "px",
        hidden: ({ responsive, advanced }: Props) => !responsive || !advanced,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: ({ advanced }: Props) => !advanced,
    },
    texture: { type: ControlType.Image, title: "Text Image" },
    textureScale: {
        type: ControlType.Enum,
        title: "Text Fit",
        options: ["cover", "contain", "auto"],
        optionTitles: ["Cover", "Contain", "Original"],
        hidden: ({ advanced }: Props) => !advanced,
    },
    textColor: {
        type: ControlType.Color,
        title: "Fallback",
        hidden: ({ advanced }: Props) => !advanced,
    },
    strokeColor: { type: ControlType.Color, title: "Stroke" },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Size",
        min: 0,
        max: 10,
        step: 0.1,
        unit: "px",
    },
    extrusionColor: { type: ControlType.Color, title: "Depth Color" },
    extrusionDepth: {
        type: ControlType.Number,
        title: "Depth",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ advanced }: Props) => !advanced,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        hidden: ({ advanced }: Props) => !advanced,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
        hidden: ({ advanced }: Props) => !advanced,
    },
    backgroundColor: { type: ControlType.Color, title: "Background" },
    backgroundImage: { type: ControlType.Image, title: "BG Image" },
    backgroundScale: {
        type: ControlType.Enum,
        title: "BG Fit",
        options: ["cover", "contain", "auto"],
        optionTitles: ["Cover", "Contain", "Original"],
        hidden: ({ advanced }: Props) => !advanced,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 100,
        max: 2000,
        step: 10,
        hidden: ({ advanced }: Props) => !advanced,
    },
    rotateX: {
        type: ControlType.Number,
        title: "Rotate X",
        min: -90,
        max: 90,
        step: 1,
        unit: "°",
        hidden: ({ advanced }: Props) => !advanced,
    },
    rotateY: {
        type: ControlType.Number,
        title: "Rotate Y",
        min: -90,
        max: 90,
        step: 1,
        unit: "°",
        hidden: ({ advanced }: Props) => !advanced,
    },
    rotateZ: {
        type: ControlType.Number,
        title: "Rotate Z",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
        hidden: ({ advanced }: Props) => !advanced,
    },
    tiltedScale: {
        type: ControlType.Number,
        title: "Start Scale",
        min: 0.2,
        max: 2,
        step: 0.01,
        hidden: ({ advanced }: Props) => !advanced,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Animate",
        options: ["viewport", "hover", "loop", "static"],
        optionTitles: ["In View", "On Hover", "Loop", "Off"],
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 8,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 8,
        step: 0.1,
        unit: "s",
        hidden: ({ advanced, trigger }: Props) =>
            !advanced || trigger === "hover" || trigger === "static",
    },
    hold: {
        type: ControlType.Number,
        title: "Loop Hold",
        min: 0,
        max: 8,
        step: 0.1,
        unit: "s",
        hidden: ({ trigger, advanced }: Props) =>
            trigger !== "loop" || !advanced,
    },
    easing: {
        type: ControlType.String,
        title: "Easing",
        hidden: ({ advanced }: Props) => !advanced,
    },
    advanced: {
        type: ControlType.Boolean,
        title: "Advanced",
        defaultValue: false,
    },
})
