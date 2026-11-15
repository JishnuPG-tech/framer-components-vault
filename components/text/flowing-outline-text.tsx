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


/**
 * Flowing Outline Text
 * Animated multi-colour segments travel along the real SVG text outline.
 * No runtime dependencies beyond React and Framer.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Direction = "forward" | "reverse"

interface FlowingOutlineTextProps {
    text: string
    font: React.CSSProperties
    tracking: number
    colors: string[]
    fill: string
    track: string
    strokeWidth: number
    segmentLength: number
    gap: number
    speed: number
    direction: Direction
    background: string
    style?: React.CSSProperties
}

const DEFAULT_COLORS = ["#52D6C8", "#3AA6C8", "#F3F7E8", "#FFAD00", "#FF2E63"]

const useSafeLayoutEffect =
    typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function cssSafeId(value: string) {
    return `flow-${value.replace(/[^a-zA-Z0-9_-]/g, "")}`
}

export default function FlowingOutlineText(props: FlowingOutlineTextProps) {
    const {
        text = "CODE",
        font = {},
        tracking = -0.04,
        colors = DEFAULT_COLORS,
        fill = "rgba(255,255,255,0)",
        track = "rgba(255,255,255,0)",
        strokeWidth = 5,
        segmentLength = 44,
        gap = 12,
        speed = 3.5,
        direction = "forward",
        background = "#111111",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reactId = React.useId()
    const id = React.useMemo(() => cssSafeId(reactId), [reactId])
    const glyphId = `${id}-glyphs`
    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const measureRef = React.useRef<SVGUseElement>(null)
    const [isInView, setIsInView] = React.useState(false)
    const [isPageVisible, setIsPageVisible] = React.useState(true)

    const lines = React.useMemo(() => {
        const result = String(text ?? "").split(/\r?\n/)
        return result.length ? result : [""]
    }, [text])

    const longestLine = Math.max(1, ...lines.map((line) => line.length))
    const fallbackViewBox = React.useMemo(
        () => ({
            x: -10,
            y: -92,
            width: Math.max(120, longestLine * 68) + 20,
            height: Math.max(112, lines.length * 112) + 20,
        }),
        [lines.length, longestLine]
    )
    const [viewBox, setViewBox] = React.useState(fallbackViewBox)

    const usableColors = colors.length > 0 ? colors : DEFAULT_COLORS
    const safeStroke = Math.max(0.5, strokeWidth)
    const safeSegment = Math.max(1, segmentLength)
    const safeGap = Math.max(0, gap)
    const step = safeSegment + safeGap
    const loopLength = Math.max(1, step * usableColors.length)
    const safeSpeed = Math.max(0.1, speed)
    const motionSign = direction === "reverse" ? 1 : -1

    // Font size is intentionally normalised. The measured SVG viewBox makes the
    // typography fit the Framer layer without stretching the glyphs.
    const sharedTextStyle: React.CSSProperties = {
        ...(font || {}),
        fontSize: 100,
        lineHeight: 1,
        letterSpacing: `${tracking}em`,
    }
    const fontSignature = JSON.stringify(font || {})

    const measure = React.useCallback(() => {
        const node = measureRef.current
        if (!node) return

        try {
            const box = node.getBBox()
            if (!Number.isFinite(box.width) || !Number.isFinite(box.height))
                return

            const padding = Math.max(8, safeStroke * 2.5)
            const next = {
                x: box.x - padding,
                y: box.y - padding,
                width: Math.max(1, box.width + padding * 2),
                height: Math.max(1, box.height + padding * 2),
            }
            setViewBox((current) => {
                const unchanged =
                    Math.abs(current.x - next.x) < 0.01 &&
                    Math.abs(current.y - next.y) < 0.01 &&
                    Math.abs(current.width - next.width) < 0.01 &&
                    Math.abs(current.height - next.height) < 0.01
                return unchanged ? current : next
            })
        } catch {
            // Some static renderers do not expose getBBox. The deterministic
            // fallback above keeps the component renderable there.
        }
    }, [safeStroke, text, fontSignature, tracking])

    useSafeLayoutEffect(() => {
        measure()

        if (typeof document === "undefined" || !document.fonts) return
        let cancelled = false
        document.fonts.ready.then(() => {
            if (!cancelled) measure()
        })

        return () => {
            cancelled = true
        }
    }, [measure])

    React.useEffect(() => {
        if (isStatic) {
            setIsInView(false)
            return
        }

        const node = wrapperRef.current
        if (!node) return

        if (typeof IntersectionObserver === "undefined") {
            // Old browsers get the functional fallback instead of a permanently
            // frozen component.
            setIsInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting && entry.intersectionRatio > 0)
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0.01,
            }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [isStatic])

    React.useEffect(() => {
        if (typeof document === "undefined") return

        const updateVisibility = () => {
            setIsPageVisible(document.visibilityState !== "hidden")
        }

        updateVisibility()
        document.addEventListener("visibilitychange", updateVisibility)
        return () =>
            document.removeEventListener("visibilitychange", updateVisibility)
    }, [])

    const shouldAnimate = !isStatic && isInView && isPageVisible

    const animationCss = React.useMemo(() => {
        if (isStatic) return ""

        const rules = usableColors.map((_, index) => {
            const start = index * step
            const end = start + motionSign * loopLength
            return `
@keyframes ${id}-move-${index} {
    from { stroke-dashoffset: ${start}; }
    to { stroke-dashoffset: ${end}; }
}
.${id}-segment-${index} {
    animation: ${id}-move-${index} ${safeSpeed}s linear infinite;
}`
        })

        return `${rules.join("\n")}
@media (prefers-reduced-motion: reduce) {
    .${id}-segment { animation: none !important; }
}`
    }, [id, isStatic, loopLength, motionSign, safeSpeed, step, usableColors])

    return (
        <div
            ref={wrapperRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
            }}
        >
            {animationCss && <style>{animationCss}</style>}

            <svg
                width="100%"
                height="100%"
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={text}
                style={{ display: "block", overflow: "visible" }}
            >
                <defs>
                    <g id={glyphId}>
                        {lines.map((line, index) => (
                            <text
                                key={`${index}-${line}`}
                                x={0}
                                y={index * 112}
                                style={sharedTextStyle}
                            >
                                {line || " "}
                            </text>
                        ))}
                    </g>
                </defs>

                <use
                    ref={measureRef}
                    href={`#${glyphId}`}
                    fill={fill}
                    stroke={track}
                    strokeWidth={safeStroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    paintOrder="stroke fill"
                />

                {usableColors.map((color, index) => {
                    const staticOffset = index * step
                    return (
                        <use
                            key={`${color}-${index}`}
                            href={`#${glyphId}`}
                            className={`${id}-segment ${id}-segment-${index}`}
                            fill="none"
                            stroke={color}
                            strokeWidth={safeStroke}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={`${safeSegment} ${Math.max(
                                1,
                                loopLength - safeSegment
                            )}`}
                            strokeDashoffset={staticOffset}
                            pointerEvents="none"
                            style={{
                                animationPlayState: shouldAnimate
                                    ? "running"
                                    : "paused",
                            }}
                        />
                    )
                })}
            </svg>
        </div>
    )
}

FlowingOutlineText.defaultProps = {
    width: 1000,
    height: 320,
}

addPropertyControls(FlowingOutlineText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "CODE",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
        },
    },
    tracking: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: -0.04,
        min: -0.15,
        max: 0.3,
        step: 0.01,
    },
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
        defaultValue: DEFAULT_COLORS,
        maxCount: 8,
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "rgba(255,255,255,0)",
    },
    track: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "rgba(255,255,255,0)",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke",
        defaultValue: 5,
        min: 0.5,
        max: 20,
        step: 0.5,
    },
    segmentLength: {
        type: ControlType.Number,
        title: "Segment",
        defaultValue: 44,
        min: 2,
        max: 160,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 3.5,
        min: 0.2,
        max: 20,
        step: 0.1,
        unit: "s",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        displaySegmentedControl: true,
        defaultValue: "forward",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
})
