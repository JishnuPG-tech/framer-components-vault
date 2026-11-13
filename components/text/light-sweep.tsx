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


type Direction = "leftToRight" | "rightToLeft"

type ShineTextProps = {
    text: string
    font: React.CSSProperties
    textColor: string

    shineColor: string
    shineOpacity: number
    shineWidth: number
    shineSoftness: number
    shineAngle: number

    sweepDuration: number
    interval: number
    direction: Direction

    style?: React.CSSProperties
}

const DEFAULT_PROPS = {
    text: "Shine Text",
    font: {
        fontFamily: "Oswald",
        fontSize: 113,
        fontWeight: 700,
        lineHeight: "1.1em",
        letterSpacing: "-0.03em",
        textAlign: "left",
    },
    textColor: "#111111",

    shineColor: "#FFFFFF",
    shineOpacity: 0.85,
    shineWidth: 16,
    shineSoftness: 8,
    shineAngle: 105,

    sweepDuration: 1.2,
    interval: 2.6,
    direction: "leftToRight" as const,
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function createSafeId(value: string) {
    return value.replace(/[^a-zA-Z0-9_-]/g, "_")
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ShineText(props: ShineTextProps) {
    const {
        text,
        font,
        textColor,
        shineColor,
        shineOpacity,
        shineWidth,
        shineSoftness,
        shineAngle,
        sweepDuration,
        interval,
        direction,
        style,
    } = props

    const instanceId = React.useId().replace(/:/g, "")

    const safeSweepDuration = Math.max(0.2, sweepDuration)
    const safeInterval = Math.max(0, interval)
    const totalDuration = safeSweepDuration + safeInterval

    const sweepEndPercent = clamp(
        (safeSweepDuration / totalDuration) * 100,
        1,
        100
    )

    const safeShineWidth = clamp(shineWidth, 4, 80)
    const safeShineSoftness = clamp(shineSoftness, 0, 40)
    const safeShineOpacity = clamp(shineOpacity, 0, 1)
    const safeShineAngle = clamp(shineAngle, 0, 180)

    const startPosition = direction === "leftToRight" ? "220%" : "-120%"
    const endPosition = direction === "leftToRight" ? "-120%" : "220%"

    const halfWidth = safeShineWidth / 2

    const animationSignature = createSafeId(
        [
            safeSweepDuration,
            safeInterval,
            safeShineWidth,
            safeShineSoftness,
            safeShineAngle,
            direction,
        ].join("_")
    )

    const rootClassName = `shineText_${instanceId}`
    const animationName = `shineTextSweep_${instanceId}_${animationSignature}`

    const shineGradient = `linear-gradient(
        ${safeShineAngle}deg,
        transparent 0%,
        transparent ${clamp(50 - halfWidth - safeShineSoftness, 0, 100)}%,
        rgba(0, 0, 0, 0.25) ${clamp(50 - halfWidth, 0, 100)}%,
        rgba(0, 0, 0, 1) 50%,
        rgba(0, 0, 0, 0.25) ${clamp(50 + halfWidth, 0, 100)}%,
        transparent ${clamp(50 + halfWidth + safeShineSoftness, 0, 100)}%,
        transparent 100%
    )`

    const textLayerStyle: React.CSSProperties = {
        ...font,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        margin: 0,
    }

    const shineLayerStyle: React.CSSProperties = {
        ...textLayerStyle,
        position: "absolute",
        inset: 0,
        display: "block",
        color: shineColor,
        opacity: safeShineOpacity,
        pointerEvents: "none",

        WebkitMaskImage: shineGradient,
        maskImage: shineGradient,
        WebkitMaskSize: "260% 100%",
        maskSize: "260% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",

        animationName,
        animationDuration: `${totalDuration}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationFillMode: "both",

        willChange: "mask-position, -webkit-mask-position",
    }

    return (
        <div
            className={rootClassName}
            style={{
                ...style,
                position: "relative",
                display: "block",
                width: "100%",
                overflow: "hidden",
                color: textColor,
            }}
        >
            <style>{`
                @keyframes ${animationName} {
                    0% {
                        -webkit-mask-position: ${startPosition} 0;
                        mask-position: ${startPosition} 0;
                    }

                    ${sweepEndPercent}% {
                        -webkit-mask-position: ${endPosition} 0;
                        mask-position: ${endPosition} 0;
                    }

                    100% {
                        -webkit-mask-position: ${endPosition} 0;
                        mask-position: ${endPosition} 0;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .${rootClassName} .shine-text-highlight {
                        animation: none !important;
                        opacity: 0 !important;
                    }
                }
            `}</style>

            <span
                style={{
                    ...textLayerStyle,
                    position: "relative",
                    display: "block",
                    color: textColor,
                }}
            >
                {text}
            </span>

            <span
                key={animationName}
                aria-hidden="true"
                className="shine-text-highlight"
                style={shineLayerStyle}
            >
                {text}
            </span>
        </div>
    )
}

ShineText.defaultProps = DEFAULT_PROPS

addPropertyControls(ShineText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: DEFAULT_PROPS.text,
        displayTextArea: true,
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: DEFAULT_PROPS.font,
        controls: "extended",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: DEFAULT_PROPS.textColor,
    },

    shineColor: {
        type: ControlType.Color,
        title: "Shine",
        defaultValue: DEFAULT_PROPS.shineColor,
    },

    shineOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: DEFAULT_PROPS.shineOpacity,
        min: 0,
        max: 1,
        step: 0.05,
    },

    shineWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: DEFAULT_PROPS.shineWidth,
        min: 4,
        max: 80,
        step: 1,
        unit: "%",
    },

    shineSoftness: {
        type: ControlType.Number,
        title: "Softness",
        defaultValue: DEFAULT_PROPS.shineSoftness,
        min: 0,
        max: 40,
        step: 1,
        unit: "%",
    },

    shineAngle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: DEFAULT_PROPS.shineAngle,
        min: 0,
        max: 180,
        step: 1,
        unit: "°",
    },

    sweepDuration: {
        type: ControlType.Number,
        title: "Sweep",
        defaultValue: DEFAULT_PROPS.sweepDuration,
        min: 0.2,
        max: 8,
        step: 0.1,
        unit: "s",
    },

    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: DEFAULT_PROPS.interval,
        min: 0,
        max: 12,
        step: 0.1,
        unit: "s",
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: DEFAULT_PROPS.direction,
        options: ["leftToRight", "rightToLeft"],
        optionTitles: ["Left → Right", "Right → Left"],
    },
})
