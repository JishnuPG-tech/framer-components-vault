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


type HoverEffectType =
    | "none"
    | "speed"
    | "expand"
    | "shrink"
    | "color"
    | "pause"

type HoverEffectSettings = {
    type: HoverEffectType

    // Speed
    speedMode: "faster" | "slower"
    speedValue: number

    // Expand / Shrink
    scale: number

    // Color
    color: string

    transitionSpeed: number
}

type MotionSettings = {
    radius: number
    startAngle: number
    rotateSpeed: number
}

type Props = {
    text: string
    color: string
    direction: "clockwise" | "anticlockwise"
    font: any

    motion: MotionSettings

    hoverEffect: HoverEffectSettings
}
/** @framerDisableUnlink
 *
 * */
export default function CircularText(props: Partial<Props>) {
    const {
        text = "FRAMER CIRCULAR TEXT • ",
        color = "#111",
        direction = "clockwise",
        motion = {
            radius: 90,
            startAngle: -90,
            rotateSpeed: 6,
        },
        font = {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: 0,
        },
        hoverEffect = {
            type: "none",
            speedMode: "faster",
            speedValue: 2,
            scale: 1.1,
            color: color,
            transitionSpeed: 0.25,
        },
    } = props

    const radius = motion?.radius ?? 90
    const startAngle = motion?.startAngle ?? -90
    const rotateSpeed = motion?.rotateSpeed ?? 6

    const [isHovered, setIsHovered] = React.useState(false)

    const effectiveRotateSpeed =
        hoverEffect.type === "speed" && isHovered
            ? hoverEffect.speedMode === "faster"
                ? rotateSpeed / hoverEffect.speedValue
                : rotateSpeed * hoverEffect.speedValue
            : rotateSpeed

    const resolvedFont = React.useMemo(() => {
        const f: any = font || {}

        const normalizeUnit = (v: any, unit: string) => {
            if (v === undefined || v === null || v === "") return undefined
            if (typeof v === "number") return `${v}${unit}`
            return v
        }

        return {
            ...f,
            // Framer sometimes returns number values; CSS needs units for these.
            fontSize: normalizeUnit(f.fontSize, "px"),
            // Framer Font control uses pixel-based tracking; keep it in px
            letterSpacing: normalizeUnit(f.letterSpacing, "px"),
            lineHeight:
                typeof f.lineHeight === "number"
                    ? `${f.lineHeight}em`
                    : f.lineHeight,
        }
    }, [font])

    const safeText = (text?.length ? text : " ").toString()

    const repeatedText =
        safeText.length < 14 ? safeText.repeat(4) : safeText.repeat(2)

    const chars = Array.from(repeatedText)

    // Angular letter spacing (mapped from Font → letterSpacing)
    // Treat letterSpacing as a percentage-based angular multiplier
    const rawLetterSpacing =
        typeof font?.letterSpacing === "number" ? font.letterSpacing : 0

    // Normalize: 0 = normal, positive = more spacing, negative = tighter
    const spacingMultiplier = Math.max(0.1, 1 + rawLetterSpacing / 100)

    const step = (360 / chars.length) * spacingMultiplier
    const angles = chars.map((_, i) => startAngle + i * step)

    const clockwise = direction === "clockwise"

    const hoverTransform =
        isHovered &&
        (hoverEffect.type === "expand" || hoverEffect.type === "shrink")
            ? hoverEffect.type === "expand"
                ? `scale(${hoverEffect.scale})`
                : `scale(${Math.max(0.01, 2 - hoverEffect.scale)})`
            : "scale(1)"

    const rotateKeyframesName =
        direction === "clockwise"
            ? "circularTextRotateCW"
            : "circularTextRotateCCW"

    return (
        <div
            style={{
                width: radius * 2 + "px",
                height: radius * 2 + "px",
                display: "flex",
                alignItems: "center",
                position: "relative",
                overflow: "visible",
            }}
        >
            <style>{`
  @keyframes circularTextRotateCW {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes circularTextRotateCCW {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }
`}</style>
            <div
                style={{
                    width: radius * 2 + "px",
                    height: radius * 2 + "px",
                    position: "relative",
                    transition: `transform ${hoverEffect.transitionSpeed}s ease`,
                    transform: `${hoverTransform}`,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        borderRadius: "50%",
                        transformOrigin: "50% 50%",
                        WebkitTransformOrigin: "50% 50%",
                        animationName: rotateKeyframesName,
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                        animationDuration: `${Math.max(0.05, effectiveRotateSpeed)}s`,
                        animationPlayState:
                            hoverEffect.type === "pause" && isHovered
                                ? "paused"
                                : "running",
                        willChange: "transform",
                    }}
                >
                    {chars.map((char, i) => {
                        const angle = angles[i]
                        return (
                            <span
                                key={i}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    transformOrigin: "50% 50%",
                                    WebkitTransformOrigin: "50% 50%",
                                    // Reference-like circular placement
                                    transform: `rotateZ(${angle}deg) translate3d(0, -${radius}px, 0)`,
                                    WebkitTransform: `rotateZ(${angle}deg) translate3d(0, -${radius}px, 0)`,
                                    ...resolvedFont,
                                    color:
                                        hoverEffect.type === "color" &&
                                        isHovered
                                            ? hoverEffect.color
                                            : color,
                                    transition: `color ${hoverEffect.transitionSpeed}s ease`,
                                    whiteSpace: "pre",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </span>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

/* ===========================
   Framer Property Controls
   =========================== */

addPropertyControls(CircularText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "FRAMER CIRCULAR TEXT • ",
        description: "Type any text. Short text auto-repeats.",
    },

    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 90,
                min: 30,
                max: 400,
                step: 1,
            },
            startAngle: {
                type: ControlType.Number,
                title: "Start Angle",
                defaultValue: -90,
                min: -360,
                max: 360,
                step: 1,
            },
            rotateSpeed: {
                type: ControlType.Number,
                title: "Speed (s)",
                defaultValue: 6,
                min: 0.1,
                max: 60,
                step: 0.1,
                description: "Lower = faster rotation",
            },
        },
    },

    hoverEffect: {
        type: ControlType.Object,
        title: "Hover Effect",
        controls: {
            type: {
                type: ControlType.Enum,
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                title: "Effect",
                options: [
                    "none",
                    "speed",
                    "expand",
                    "shrink",
                    "color",
                    "pause",
                ],
                optionTitles: [
                    "None",
                    "Speed",
                    "Expand",
                    "Shrink",
                    "Color",
                    "Pause",
                ],
                defaultValue: "none",
            },

            speedMode: {
                type: ControlType.Enum,
                title: "Speed Mode",
                options: ["faster", "slower"],
                optionTitles: ["Increase", "Decrease"],
                hidden: (props) => props.type !== "speed",
            },

            speedValue: {
                type: ControlType.Number,
                title: "Speed Factor",
                defaultValue: 2,
                min: 1.1,
                max: 10,
                step: 0.1,
                hidden: (props) => props.type !== "speed",
            },

            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 1.1,
                min: 0.8,
                max: 2,
                step: 0.01,
                hidden: (props) => !["expand", "shrink"].includes(props.type),
            },

            color: {
                type: ControlType.Color,
                title: "Hover Color",
                defaultValue: "#000000",
                hidden: (props) => props.type !== "color",
            },

            transitionSpeed: {
                type: ControlType.Number,
                title: "Transition Speed (s)",
                defaultValue: 0.25,
                min: 0.05,
                max: 2,
                step: 0.05,
                hidden: (props) => props.type === "none",
            },
        },
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "clockwise",
        options: ["clockwise", "anticlockwise"],
        optionTitles: ["Clockwise", "Anti-clockwise"],
    },

    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: 0,
        },
    },
})
