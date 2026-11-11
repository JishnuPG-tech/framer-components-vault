// Shine slide effect overlay component to be placed in absolute position over other components
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ShineSlideFXProps {
    shineColor: string
    shineWidth: number
    duration: number
    delay: number
    loop: boolean
    angle: number
    opacity: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ShineSlideFX(props: ShineSlideFXProps) {
    const {
        shineColor = "#FFFFFF",
        shineWidth = 100,
        duration = 2,
        delay = 0,
        loop = true,
        angle = 45,
        opacity = 0.5,
    } = props

    const x = useMotionValue(-shineWidth)

    useEffect(() => {
        const controls = animate(x, [-(shineWidth * 2), window.innerWidth + shineWidth], {
            duration,
            delay,
            repeat: loop ? Infinity : 0,
            repeatDelay: delay,
            ease: "easeInOut",
        })

        return () => controls.stop()
    }, [x, shineWidth, duration, delay, loop])

    const gradientX = useTransform(x, (value) => `${value}px`)

    return (
        <motion.div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: gradientX,
                    width: `${shineWidth}px`,
                    height: "100%",
                    background: `linear-gradient(${angle}deg, transparent 0%, ${shineColor} 50%, transparent 100%)`,
                    opacity,
                    transform: `skewX(${angle - 90}deg)`,
                }}
            />
        </motion.div>
    )
}

addPropertyControls(ShineSlideFX, {
    shineColor: {
        type: ControlType.Color,
        title: "Shine Color",
        defaultValue: "#FFFFFF",
    },
    shineWidth: {
        type: ControlType.Number,
        title: "Shine Width",
        defaultValue: 100,
        min: 20,
        max: 300,
        step: 10,
        unit: "px",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: 45,
        min: 0,
        max: 360,
        step: 15,
        unit: "deg",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.5,
        unit: "s",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})