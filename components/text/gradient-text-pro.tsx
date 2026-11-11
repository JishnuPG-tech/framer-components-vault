// Gradient text animation component with cycling colors and customizable properties
import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation } from "framer-motion"

interface GradientTextProps {
    text: string
    font: any
    animationType: "hover" | "infinite" | "static"
    speed: number
    direction: "leftToRight" | "rightToLeft"
    gradientDirection: number
    color1: string
    color2: string
    color3: string
    useThreeColors: boolean
    overflowVisible: boolean
    style?: CSSProperties
}

/**
 * Gradient Text Animation
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function GradientText(props: GradientTextProps) {
    const {
        text = "Gradient Text",
        font,
        animationType = "infinite",
        speed = 4,
        direction = "rightToLeft",
        gradientDirection = 45,
        color1 = "#FF6B6B",
        color2 = "#4ECDC4",
        color3 = "#45B7D1",
        useThreeColors = false,
        overflowVisible = true,
    } = props

    const [currentGradient, setCurrentGradient] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()
    const controls = useAnimation()

    // Create gradient combinations
    const gradients = useThreeColors
        ? [
              `linear-gradient(${gradientDirection}deg, ${color1}, ${color2})`,
              `linear-gradient(${gradientDirection}deg, ${color2}, ${color3})`,
              `linear-gradient(${gradientDirection}deg, ${color3}, ${color1})`,
          ]
        : [
              `linear-gradient(${gradientDirection}deg, ${color1}, ${color2})`,
              `linear-gradient(${gradientDirection}deg, ${color2}, ${color1})`,
          ]

    // Handle infinite animation
    useEffect(() => {
        if (isStatic) return

        // For infinite type, always animate
        if (animationType !== "infinite") return

        const interval = setInterval(() => {
            startTransition(() => {
                setCurrentGradient((prev) => (prev + 1) % gradients.length)
            })
        }, speed * 1000)

        return () => clearInterval(interval)
    }, [animationType, speed, gradients.length, isStatic])

    // Determine which gradient to show
    const getActiveGradient = () => {
        if (animationType === "static") {
            return gradients[0]
        }
        if (animationType === "hover") {
            return gradients[0]
        }
        return gradients[currentGradient]
    }

    const isFixedWidth = props?.style && props.style.width === "100%"

    // For animated gradients, create a larger gradient that moves
    const getAnimatedGradient = () => {
        if (
            (animationType === "infinite" || animationType === "hover") &&
            !isStatic
        ) {
            const colors = useThreeColors
                ? [color1, color2, color3]
                : [color1, color2]
            // Create a gradient that extends beyond the visible area for smooth looping
            return `linear-gradient(${gradientDirection}deg, transparent, ${colors.join(", ")}, transparent)`
        }
        return getActiveGradient()
    }

    // Get animation positions based on direction
    const getAnimationPositions = () => {
        if (direction === "leftToRight") {
            return ["-300% 50%", "100% 50%"]
        } else {
            return ["100% 50%", "-300% 50%"]
        }
    }

    // Handle hover animation control
    useEffect(() => {
        if (isStatic || animationType !== "hover") return

        const positions = getAnimationPositions()

        if (isHovered) {
            // Start the animation loop when hovered
            controls.start({
                backgroundPosition: positions,
                transition: {
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                },
            })
        } else {
            // Stop and reset when not hovered
            controls.stop()
            controls.set({ backgroundPosition: positions[0] })
        }
    }, [isHovered, animationType, speed, direction, isStatic])

    // Determine which animation to use
    const getAnimationProps = () => {
        if (isStatic) return {}

        if (animationType === "infinite") {
            return {
                animate: { backgroundPosition: getAnimationPositions() },
                transition: {
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop" as const,
                },
            }
        }

        if (animationType === "hover") {
            return {
                animate: controls,
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false),
                initial: { backgroundPosition: getAnimationPositions()[0] },
            }
        }

        return {}
    }

    const shouldAnimate =
        animationType === "infinite" || animationType === "hover"

    return (
        <motion.div
            style={{
                ...props.style,
                ...(isFixedWidth
                    ? { ...props?.style }
                    : { width: "max-content" }),
                background: getAnimatedGradient(),
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize:
                    shouldAnimate && !isStatic ? "400% 100%" : "100% 100%",
                display: "inline-block",
                cursor: animationType === "hover" ? "pointer" : "default",
                overflow: overflowVisible ? "visible" : "hidden",
                height: "auto",
                minHeight: "max-content",
                lineHeight: font?.lineHeight || "1.2em",
                position: "relative",
                padding: overflowVisible ? "0.1em 0" : "0",
                ...font,
            }}
            {...getAnimationProps()}
        >
            <span
                style={{
                    display: "block",
                    overflow: overflowVisible ? "visible" : "hidden",
                    lineHeight: "inherit",
                }}
            >
                {text}
            </span>
        </motion.div>
    )
}

addPropertyControls(GradientText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Gradient Text",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        displayTextAlignment: true,
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["static", "hover", "infinite"],
        optionTitles: ["Static", "On Hover", "Infinite Loop"],
        defaultValue: "infinite",
        displaySegmentedControl: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["leftToRight", "rightToLeft"],
        optionTitles: ["LEFT", "RIGHT"],
        defaultValue: "rightToLeft",
        displaySegmentedControl: true,
        hidden: ({ animationType }) => animationType === "static",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 8,
        min: 2,
        max: 30,
        step: 1,
        unit: "s",
        hidden: ({ animationType }) => animationType === "static",
    },
    gradientDirection: {
        type: ControlType.Number,
        title: "Direction",
        defaultValue: 45,
        min: 0,
        max: 360,
        step: 15,
        unit: "°",
    },
    useThreeColors: {
        type: ControlType.Boolean,
        title: "Colors",
        defaultValue: false,
        enabledTitle: "Three",
        disabledTitle: "Two",
    },
    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#FF6B6B",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#4ECDC4",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#45B7D1",
        hidden: ({ useThreeColors }) => !useThreeColors,
    },
    overflowVisible: {
        type: ControlType.Boolean,
        title: "Overflow Visible",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
})
