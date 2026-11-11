// Slick scroll icon with animated bounce effect
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

interface ScrollIconProps {
    iconColor: string
    backgroundColor: string
    borderColor: string
    borderWidth: number
    borderRadius: number
    animationSpeed: number
    pauseDuration: number
    mouseWidth: number
    mouseHeight: number
    dotSize: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScrollCue(props: ScrollIconProps) {
    const {
        iconColor,
        backgroundColor,
        borderColor,
        borderWidth,
        borderRadius,
        animationSpeed,
        pauseDuration,
        mouseWidth,
        mouseHeight,
        dotSize,
        style,
    } = props

    const size = Math.min(mouseWidth, mouseHeight)
    const animationDistance = size * 0.25

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
            }}
        >
            <div
                style={{
                    width: mouseWidth,
                    height: mouseHeight,
                    border: `${borderWidth}px solid ${borderColor}`,
                    borderRadius: borderRadius,
                    backgroundColor: backgroundColor,
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: size * 0.25,
                }}
            >
                <motion.div
                    style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: "50%",
                        backgroundColor: iconColor,
                    }}
                    animate={{
                        y: [0, animationDistance, 0],
                    }}
                    transition={{
                        duration: animationSpeed,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: pauseDuration,
                    }}
                />
            </div>
        </div>
    )
}

addPropertyControls(ScrollCue, {
    mouseWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 1,
    },
    mouseHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 50,
        min: 20,
        max: 150,
        step: 1,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Circle Size",
        defaultValue: 6,
        min: 2,
        max: 20,
        step: 1,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 1,
        max: 5,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1.5,
        min: 0.5,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    pauseDuration: {
        type: ControlType.Number,
        title: "Pause Duration",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.1,
        unit: "s",
    },
})