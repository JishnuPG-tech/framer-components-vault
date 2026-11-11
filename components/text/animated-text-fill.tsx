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


type Direction = "left" | "right" | "top" | "bottom"
type Trigger = "loop" | "inView" | "hover"
type TextCase = "none" | "uppercase" | "lowercase"

interface Props {
    text: string
    font: React.CSSProperties
    fontSize: number
    lineHeight: number
    letterSpacing: number
    textCase: TextCase
    colors: string[]
    direction: Direction
    trigger: Trigger
    replay: boolean
    threshold: number
    duration: number
    delay: number
    easing: string
    shadow: boolean
    shadowColor: string
    shadowOpacity: number
    shadowX: number
    shadowY: number
    padding: number
    style?: React.CSSProperties
}

interface Bounds {
    x: number
    y: number
    width: number
    height: number
}

const DEFAULT_BOUNDS: Bounds = {
    x: 0,
    y: -160,
    width: 600,
    height: 200,
}

function transformText(text: string, textCase: TextCase) {
    if (textCase === "uppercase") return text.toUpperCase()
    if (textCase === "lowercase") return text.toLowerCase()
    return text
}

function panelGeometry(
    bounds: Bounds,
    index: number,
    count: number,
    direction: Direction
) {
    const fraction = (count - index) / count

    if (direction === "left" || direction === "right") {
        const width = bounds.width * fraction
        return {
            x:
                direction === "right"
                    ? bounds.x + bounds.width - width
                    : bounds.x,
            y: bounds.y,
            width,
            height: bounds.height,
        }
    }

    const height = bounds.height * fraction
    return {
        x: bounds.x,
        y:
            direction === "bottom"
                ? bounds.y + bounds.height - height
                : bounds.y,
        width: bounds.width,
        height,
    }
}

function AnimatedTextFill(props: Props) {
    const {
        text,
        font,
        fontSize,
        lineHeight,
        letterSpacing,
        textCase,
        colors,
        direction,
        trigger,
        replay,
        threshold,
        duration,
        delay,
        easing,
        shadow,
        shadowColor,
        shadowOpacity,
        shadowX,
        shadowY,
        padding,
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)
    const measureRef = React.useRef<SVGTextElement>(null)
    const isStatic = useIsStaticRenderer()
    const reactId = React.useId()
    const id = React.useMemo(
        () => `animated-text-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
        [reactId]
    )
    const clipId = `${id}-clip`
    const animationName = `${id}-reveal`

    const [bounds, setBounds] = React.useState<Bounds>(DEFAULT_BOUNDS)
    const [measured, setMeasured] = React.useState(false)
    const [inView, setInView] = React.useState(false)
    const [hasPlayed, setHasPlayed] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)

    const displayText = transformText(text || "Text", textCase)
    const lines = displayText.split("\n")
    const palette = colors?.length ? colors.slice(0, 8) : ["#F26444"]

    const measure = React.useCallback(() => {
        const node = measureRef.current
        if (!node) return

        try {
            const next = node.getBBox()
            if (next.width > 0 && next.height > 0) {
                setBounds({
                    x: next.x,
                    y: next.y,
                    width: next.width,
                    height: next.height,
                })
                setMeasured(true)
            }
        } catch {
            // getBBox may be temporarily unavailable while Framer is mounting.
        }
    }, [])

    React.useLayoutEffect(() => {
        measure()
        const frame = requestAnimationFrame(measure)
        const fonts = document.fonts
        fonts?.ready.then(measure).catch(() => undefined)

        return () => cancelAnimationFrame(frame)
    }, [displayText, font, fontSize, lineHeight, letterSpacing, measure])

    React.useEffect(() => {
        if (trigger !== "inView" || isStatic) return
        const node = rootRef.current
        if (!node || typeof IntersectionObserver === "undefined") {
            setInView(true)
            setHasPlayed(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting
                setInView(visible)
                if (visible) setHasPlayed(true)
            },
            { threshold }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [trigger, threshold, isStatic])

    const active =
        isStatic ||
        trigger === "loop" ||
        (trigger === "hover" && hovered) ||
        (trigger === "inView" && (replay ? inView : hasPlayed))

    const axis = direction === "left" || direction === "right" ? "X" : "Y"
    const origin =
        direction === "left"
            ? "left center"
            : direction === "right"
              ? "right center"
              : direction === "top"
                ? "center top"
                : "center bottom"

    const extra = Math.max(0, (bounds.height * padding) / 100)
    const minX = bounds.x - extra + Math.min(0, shadow ? shadowX : 0)
    const minY = bounds.y - extra + Math.min(0, shadow ? shadowY : 0)
    const maxX =
        bounds.x + bounds.width + extra + Math.max(0, shadow ? shadowX : 0)
    const maxY =
        bounds.y + bounds.height + extra + Math.max(0, shadow ? shadowY : 0)
    const viewBox = `${minX} ${minY} ${Math.max(1, maxX - minX)} ${Math.max(
        1,
        maxY - minY
    )}`

    const textStyle: React.CSSProperties = {
        ...font,
        fontSize,
        lineHeight: 1,
        letterSpacing,
        whiteSpace: "pre",
    }

    const animationStyle: React.CSSProperties = isStatic
        ? {
              transform: `scale${axis}(1)`,
          }
        : active
          ? {
                animationName,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                animationTimingFunction: easing,
                animationIterationCount: trigger === "loop" ? "infinite" : 1,
                animationDirection: trigger === "loop" ? "alternate" : "normal",
                animationFillMode: "both",
            }
          : {
                transform: `scale${axis}(0)`,
            }

    const renderText = (
        className?: string,
        ref?: React.Ref<SVGTextElement>
    ) => (
        <text
            ref={ref}
            className={className}
            x={0}
            y={0}
            style={textStyle}
            textAnchor="start"
        >
            {lines.map((line, index) => (
                <tspan
                    key={`${index}-${line}`}
                    x={0}
                    dy={index === 0 ? 0 : fontSize * lineHeight}
                >
                    {line || " "}
                </tspan>
            ))}
        </text>
    )

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "visible",
                cursor: trigger === "hover" ? "pointer" : "default",
                ...style,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <style>{`
                @keyframes ${animationName} {
                    from { transform: scale${axis}(0); }
                    to { transform: scale${axis}(1); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .${id}-panel {
                        animation: none !important;
                        transform: scale${axis}(1) !important;
                    }
                }
            `}</style>

            <svg
                width="100%"
                height="100%"
                viewBox={viewBox}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={displayText.replace(/\n/g, " ")}
                style={{
                    display: "block",
                    overflow: "visible",
                    opacity: isStatic || measured ? 1 : 0,
                }}
            >
                <defs>
                    <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                        {renderText()}
                    </clipPath>
                </defs>

                {shadow && (
                    <g
                        clipPath={`url(#${clipId})`}
                        transform={`translate(${shadowX} ${shadowY})`}
                        opacity={shadowOpacity}
                        aria-hidden="true"
                    >
                        <rect
                            className={`${id}-panel`}
                            x={bounds.x}
                            y={bounds.y}
                            width={bounds.width}
                            height={bounds.height}
                            fill={shadowColor}
                            style={{
                                ...animationStyle,
                                transformBox: "fill-box",
                                transformOrigin: origin,
                            }}
                        />
                    </g>
                )}

                <g clipPath={`url(#${clipId})`} aria-hidden="true">
                    {palette.map((color, index) => {
                        const geometry = panelGeometry(
                            bounds,
                            index,
                            palette.length,
                            direction
                        )

                        return (
                            <rect
                                key={`${color}-${index}`}
                                className={`${id}-panel`}
                                {...geometry}
                                fill={color}
                                style={{
                                    ...animationStyle,
                                    transformBox: "fill-box",
                                    transformOrigin: origin,
                                }}
                            />
                        )
                    })}
                </g>

                {renderText(`${id}-selectable`, measureRef)}
            </svg>

            <style>{`
                .${id}-selectable {
                    fill: transparent;
                    user-select: text;
                    -webkit-user-select: text;
                }
            `}</style>
        </div>
    )
}

AnimatedTextFill.defaultProps = {
    width: 800,
    height: 320,
    text: "Framer",
    font: {
        fontFamily: "Inter, sans-serif",
        fontWeight: 800,
    },
    fontSize: 220,
    lineHeight: 0.9,
    letterSpacing: -8,
    textCase: "uppercase",
    colors: ["#0E1826", "#166973", "#65BFA6", "#F2CD5C", "#F26444"],
    direction: "left",
    trigger: "loop",
    replay: true,
    threshold: 0.35,
    duration: 2.2,
    delay: 0,
    easing: "cubic-bezier(0.76, 0, 0.24, 1)",
    shadow: true,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowX: 10,
    shadowY: 10,
    padding: 8,
}

addPropertyControls(AnimatedTextFill, {
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
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: "800",
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 220,
        min: 24,
        max: 600,
        step: 1,
        displayStepper: true,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 0.9,
        min: 0.6,
        max: 2,
        step: 0.05,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: -8,
        min: -40,
        max: 80,
        step: 1,
        unit: "px",
    },
    textCase: {
        type: ControlType.Enum,
        title: "Case",
        options: ["none", "uppercase", "lowercase"],
        optionTitles: ["As Typed", "Uppercase", "Lowercase"],
        defaultValue: "uppercase",
        displaySegmentedControl: true,
    },
    colors: {
        type: ControlType.Array,
        title: "Panels",
        maxCount: 8,
        defaultValue: ["#0E1826", "#166973", "#65BFA6", "#F2CD5C", "#F26444"],
        control: {
            type: ControlType.Color,
        },
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right", "top", "bottom"],
        optionTitles: ["Left", "Right", "Top", "Bottom"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["loop", "inView", "hover"],
        optionTitles: ["Loop", "In View", "Hover"],
        defaultValue: "loop",
        displaySegmentedControl: true,
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: true,
        enabledTitle: "Every Time",
        disabledTitle: "Once",
        hidden: (props) => props.trigger !== "inView",
    },
    threshold: {
        type: ControlType.Number,
        title: "Visible",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props) => props.trigger !== "inView",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2.2,
        min: 0.1,
        max: 15,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "linear",
            "ease",
            "ease-in-out",
            "cubic-bezier(0.76, 0, 0.24, 1)",
            "cubic-bezier(0.16, 1, 0.3, 1)",
        ],
        optionTitles: ["Linear", "Ease", "Soft", "Strong", "Expo"],
        defaultValue: "cubic-bezier(0.76, 0, 0.24, 1)",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
        hidden: (props) => !props.shadow,
    },
    shadowOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.18,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => !props.shadow,
    },
    shadowX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 10,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        hidden: (props) => !props.shadow,
    },
    shadowY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 10,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        hidden: (props) => !props.shadow,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
    },
})

export default AnimatedTextFill
