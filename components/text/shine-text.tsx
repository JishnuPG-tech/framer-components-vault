// Shine Text Component — responsive with full Framer layout support
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useMemo, type CSSProperties } from "react"

interface ShineTextProps {
    text: string
    font: CSSProperties
    baseColor: string
    shineColor: string
    accentColor: string
    animationDuration: number
    animationDelay: number
    easingFunction: string
    textEffect: string
    animationDirection: string
    textAlign: "left" | "center" | "right"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed, fill, hug
 * @framerSupportedLayoutHeight fixed, fill, hug
 */
export default function ShineText(props: ShineTextProps) {
    const {
        text,
        font,
        baseColor,
        shineColor,
        accentColor,
        animationDuration,
        animationDelay,
        easingFunction,
        textEffect,
        animationDirection,
        textAlign,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const gradient = useMemo(
        () =>
            `linear-gradient(90deg, ${baseColor} 0%, ${shineColor} 33%, ${accentColor} 66%, ${baseColor} 100%)`,
        [baseColor, shineColor, accentColor]
    )

    const getEasingValue = () => {
        switch (easingFunction) {
            case "linear":
                return [0, 0, 1, 1]
            case "easeIn":
                return [0.42, 0, 1, 1]
            case "easeOut":
                return [0, 0, 0.58, 1]
            case "easeInOut":
                return [0.42, 0, 0.58, 1]
            case "circIn":
                return [0.55, 0, 1, 0.45]
            case "circOut":
                return [0, 0.55, 0.45, 1]
            case "circInOut":
                return [0.85, 0, 0.15, 1]
            case "backIn":
                return [0.36, 0, 0.66, -0.56]
            case "backOut":
                return [0.34, 1.56, 0.64, 1]
            case "backInOut":
                return [0.68, -0.6, 0.32, 1.6]
            default:
                return [0.42, 0, 0.58, 1]
        }
    }

    const getEffectAnimation = () => {
        const backgroundPositionStart =
            animationDirection === "leftToRight" ? "200% 0%" : "0% 0%"
        const backgroundPositionEnd =
            animationDirection === "leftToRight" ? "0% 0%" : "200% 0%"

        const baseAnimation = isStatic
            ? { backgroundPosition: "50% 0%" }
            : {
                  backgroundPosition: [
                      backgroundPositionStart,
                      backgroundPositionEnd,
                  ],
              }

        switch (textEffect) {
            case "blur":
                return isStatic
                    ? { ...baseAnimation, filter: "blur(0px)" }
                    : {
                          ...baseAnimation,
                          filter: [
                              "blur(0px)",
                              "blur(2px)",
                              "blur(4px)",
                              "blur(2px)",
                              "blur(0px)",
                          ],
                      }
            case "wave":
                return isStatic
                    ? { ...baseAnimation, y: 0 }
                    : {
                          ...baseAnimation,
                          y: [0, -4, -8, -4, 0, 4, 8, 4, 0],
                      }
            case "ripple":
                return isStatic
                    ? { ...baseAnimation, scale: 1 }
                    : {
                          ...baseAnimation,
                          scale: [1, 1.02, 1.05, 1.02, 1],
                      }
            default:
                return baseAnimation
        }
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "flex",
                justifyContent:
                    textAlign === "center"
                        ? "center"
                        : textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
                alignItems: "center",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                wordWrap: "break-word",
                whiteSpace: "normal",
            }}
        >
            <motion.span
                key={`${baseColor}-${shineColor}-${accentColor}-${textEffect}-${animationDirection}`}
                style={{
                    ...font,
                    background: gradient,
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    display: "inline-block",
                    overflow: "visible",
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                    maxWidth: "100%",
                    textAlign,
                }}
                animate={getEffectAnimation()}
                transition={{
                    duration: animationDuration,
                    delay: animationDelay,
                    repeat: isStatic ? 0 : Infinity,
                    ease: getEasingValue(),
                    repeatType: "loop",
                }}
            >
                {text}
            </motion.span>
        </div>
    )
}

addPropertyControls(ShineText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Shine Text",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#000000",
    },
    shineColor: {
        type: ControlType.Color,
        title: "Shine Color",
        defaultValue: "#FFFFFF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#888888",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    animationDelay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    easingFunction: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "linear",
            "easeIn",
            "easeOut",
            "easeInOut",
            "circIn",
            "circOut",
            "circInOut",
            "backIn",
            "backOut",
            "backInOut",
        ],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Circ In",
            "Circ Out",
            "Circ In Out",
            "Back In",
            "Back Out",
            "Back In Out",
        ],
        defaultValue: "linear",
    },
    textEffect: {
        type: ControlType.Enum,
        title: "Text Effect",
        options: ["none", "blur", "wave", "ripple"],
        optionTitles: ["None", "Blur", "Wave", "Ripple"],
        defaultValue: "none",
    },
    animationDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["rightToLeft", "leftToRight"],
        optionTitles: ["Right to Left", "Left to Right"],
        defaultValue: "rightToLeft",
        displaySegmentedControl: true,
    },
    textAlign: {
        type: ControlType.SegmentedEnum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
    },
})
