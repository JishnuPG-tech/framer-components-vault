// Animated line that moves from left to right when in view
// Configurable thickness, color, duration, delay, ratio, and direction
import { motion, useInView } from "framer-motion"
import { useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AnimatedLineProps {
    thickness: number
    color: string
    duration: number
    delay: number
    ratio: number
    direction: "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top"
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 5
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AnimatedLine(props: AnimatedLineProps) {
    const {
        thickness = 4,
        color = "#0099FF",
        duration = 1.5,
        delay = 0,
        ratio = 1,
        direction = "left-to-right",
    } = props

    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })
    const isStatic = useIsStaticRenderer()

    const isHorizontal = direction === "left-to-right" || direction === "right-to-left"
    const isReverse = direction === "right-to-left" || direction === "bottom-to-top"

    const getInitialScale = () => {
        if (isHorizontal) {
            return { scaleX: 0, scaleY: 1 }
        }
        return { scaleX: 1, scaleY: 0 }
    }

    const getAnimateScale = () => {
        if (isHorizontal) {
            return { scaleX: ratio, scaleY: 1 }
        }
        return { scaleX: 1, scaleY: ratio }
    }

    const getTransformOrigin = () => {
        switch (direction) {
            case "left-to-right":
                return "left center"
            case "right-to-left":
                return "right center"
            case "top-to-bottom":
                return "center top"
            case "bottom-to-top":
                return "center bottom"
            default:
                return "left center"
        }
    }

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
            }}
        >
            <motion.div
                initial={isStatic ? getAnimateScale() : getInitialScale()}
                animate={isStatic || isInView ? getAnimateScale() : getInitialScale()}
                transition={{
                    duration: duration,
                    delay: delay,
                    ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{
                    width: isHorizontal ? "100%" : `${thickness}px`,
                    height: isHorizontal ? `${thickness}px` : "100%",
                    backgroundColor: color,
                    transformOrigin: getTransformOrigin(),
                    willChange: "transform",
                }}
            />
        </div>
    )
}

addPropertyControls(AnimatedLine, {
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 4,
        min: 1,
        max: 50,
        step: 1,
        unit: "px",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0099FF",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.5,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    ratio: {
        type: ControlType.Number,
        title: "Length Ratio",
        defaultValue: 1,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left-to-right", "right-to-left", "top-to-bottom", "bottom-to-top"],
        optionTitles: ["Left to Right", "Right to Left", "Top to Bottom", "Bottom to Top"],
        defaultValue: "left-to-right",
    },
})