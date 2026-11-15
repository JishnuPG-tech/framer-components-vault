import * as React from "react"
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


interface Props {
    color: string
    size: number
    signals: number
    interval: number
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 20
 * @framerIntrinsicHeight 20
 */
export default function SignalDot(props: Props) {
    const { color, size, signals, interval, style } = props

    const safeInterval = Math.min(10, Math.max(1, interval))
    const safeSignals = Math.min(6, Math.max(1, signals))
    const containerSize = size * 4

    const delayPerSignal = safeInterval / safeSignals

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: containerSize,
                height: containerSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Core dot with gentle breathing */}
            <motion.div
                style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    backgroundColor: color,
                    boxShadow: `0 0 ${size * 0.8}px ${color}bb`,
                }}
                animate={{
                    scale: [1, 1.04, 1],
                    opacity: [1, 0.96, 1],
                }}
                transition={{
                    duration: safeInterval * 0.85,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Wave-smooth signal rings */}
            {Array.from({ length: safeSignals }).map((_, index) => (
                <motion.div
                    key={index}
                    style={{
                        position: "absolute",
                        width: size,
                        height: size,
                        borderRadius: "50%",
                        border: `2px solid ${color}`,
                        boxSizing: "border-box",
                        filter: "blur(1px)",
                    }}
                    initial={{
                        scale: 0.8,
                        opacity: 0,
                    }}
                    animate={{
                        scale: [0.8, 1.4, 2.0, 2.8, 3.5],
                        opacity: [0, 0.75, 0.6, 0.35, 0],
                    }}
                    transition={{
                        duration: safeInterval,
                        repeat: Infinity,
                        delay: index * delayPerSignal,
                        ease: "linear",
                        times: [0, 0.2, 0.4, 0.7, 1],
                    }}
                />
            ))}
        </div>
    )
}

SignalDot.defaultProps = {
    color: "#0099FF",
    size: 20,
    signals: 3,
    interval: 3,
}

addPropertyControls(SignalDot, {
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0099FF",
    },
    size: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 8,
        max: 100,
        step: 2,
        unit: "px",
        defaultValue: 20,
    },
    signals: {
        type: ControlType.Number,
        title: "Signals",
        description: "Number of pulse rings",
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        defaultValue: 3,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        description: "Time for one complete cycle",
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
        displayStepper: true,
        defaultValue: 3,
    },
    bottomEdgeColor: {
        type: ControlType.Color,
        title: "Bottom Edge Color",
        defaultValue: "#141001",
        description:
            "Follow [Rayan Yasser](https://x.com/rayanyasserouan) for more components",
    },
})
