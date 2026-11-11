import { useState, useEffect, type CSSProperties } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface FlipTextButtonProps {
    text: string
    hoverText: string
    textColor: string
    hoverTextColor: string
    font: any
    rotationDirection: "up" | "down" | "left" | "right"
    staggerDelay: number
    rotationDuration: number
    letterSpacing: number
    link: string
    style?: CSSProperties
}

/**
 * Slot Machine Text
 *
 * A text component that cycles through words like a slot machine on hover.
 *
 * @framerIntrinsicWidth 150
 * @framerIntrinsicHeight 30
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FlipTextButton(props: FlipTextButtonProps) {
    const {
        text = "Hover",
        hoverText = "Click",
        textColor = "#000000",
        hoverTextColor = "#000000",
        font,
        rotationDirection = "up",
        staggerDelay = 0.05,
        rotationDuration = 0.4,
        letterSpacing = 0,
        link = "",
    } = props

    const [isHovered, setIsHovered] = useState(false)

    const containerStyle: CSSProperties = {
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        overflow: "hidden",
        minWidth: "max-content",
        backgroundColor: "transparent",
    }

    const textStyle: CSSProperties = {
        fontFamily: font?.fontFamily,
        fontSize: font?.fontSize,
        fontWeight: font?.fontWeight,
        fontStyle: font?.fontStyle,
        letterSpacing: `${letterSpacing}em`,
        lineHeight: font?.lineHeight,
        textAlign: font?.textAlign || "center",
    }

    const getRotationValues = () => {
        switch (rotationDirection) {
            case "up": return { rotateX: 90, rotateY: 0, y: -20 }
            case "down": return { rotateX: -90, rotateY: 0, y: 20 }
            case "left": return { rotateX: 0, rotateY: -90, x: -20 }
            case "right": return { rotateX: 0, rotateY: 90, x: 20 }
            default: return { rotateX: 90, rotateY: 0, y: -20 }
        }
    }

    const rotation = getRotationValues()

    // Pad the shorter text with spaces
    const maxLength = Math.max(text.length, hoverText.length)
    const paddedText = text.padEnd(maxLength, " ")
    const paddedHoverText = hoverText.padEnd(maxLength, " ")

    const content = (
        <motion.div
            style={containerStyle}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: "1000px",
                }}
            >
                {Array.from({ length: maxLength }).map((_, index) => {
                    const defaultChar = paddedText[index]
                    const hoverChar = paddedHoverText[index]
                    const delay = index * staggerDelay

                    return (
                        <div
                            key={index}
                            style={{
                                position: "relative",
                                width: "auto",
                                height: textStyle.fontSize || "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {/* Default text */}
                            <motion.span
                                style={{
                                    ...textStyle,
                                    color: textColor,
                                    position: "relative",
                                    transformStyle: "preserve-3d",
                                    backfaceVisibility: "hidden",
                                }}
                                initial={{ opacity: 1, rotateX: 0, rotateY: 0, x: 0, y: 0 }}
                                animate={isHovered ? {
                                    opacity: 0,
                                    rotateX: rotation.rotateX,
                                    rotateY: rotation.rotateY,
                                    x: rotation.x || 0,
                                    y: rotation.y || 0,
                                } : {
                                    opacity: 1,
                                    rotateX: 0,
                                    rotateY: 0,
                                    x: 0,
                                    y: 0,
                                }}
                                transition={{
                                    duration: rotationDuration,
                                    delay: isHovered ? delay : (maxLength - 1 - index) * staggerDelay,
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                            >
                                {defaultChar}
                            </motion.span>

                            {/* Hover text */}
                            <motion.span
                                style={{
                                    ...textStyle,
                                    color: hoverTextColor,
                                    position: "absolute",
                                    transformStyle: "preserve-3d",
                                    backfaceVisibility: "hidden",
                                }}
                                initial={{
                                    opacity: 0,
                                    rotateX: -rotation.rotateX,
                                    rotateY: -rotation.rotateY,
                                    x: rotation.x ? -rotation.x : 0,
                                    y: rotation.y ? -rotation.y : 0,
                                }}
                                animate={isHovered ? {
                                    opacity: 1,
                                    rotateX: 0,
                                    rotateY: 0,
                                    x: 0,
                                    y: 0,
                                } : {
                                    opacity: 0,
                                    rotateX: -rotation.rotateX,
                                    rotateY: -rotation.rotateY,
                                    x: rotation.x ? -rotation.x : 0,
                                    y: rotation.y ? -rotation.y : 0,
                                }}
                                transition={{
                                    duration: rotationDuration,
                                    delay: isHovered ? delay : (maxLength - 1 - index) * staggerDelay,
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                            >
                                {hoverChar}
                            </motion.span>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    )

    if (link) {
        return (
            <a href={link} style={{ textDecoration: "none", display: "inline-block" }}>
                {content}
            </a>
        )
    }

    return content
}

addPropertyControls(FlipTextButton, {
    text: {
        type: ControlType.String,
        title: "Default Text",
        defaultValue: "Hover",
    },
    hoverText: {
        type: ControlType.String,
        title: "Hover Text",
        defaultValue: "Click",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#000000",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -0.5,
        max: 10,
        step: 0.05,
        unit: "em",
    },
    rotationDirection: {
        type: ControlType.Enum,
        title: "Rotation",
        options: ["up", "down", "left", "right"],
        optionTitles: ["Up", "Down", "Left", "Right"],
        defaultValue: "up",
        displaySegmentedControl: true,
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Letter Delay",
        defaultValue: 0.05,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    rotationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.4,
        min: 0.1,
        max: 1,
        step: 0.05,
        unit: "s",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
    },
})