// Create a comprehensive loader component with multiple animation variants
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
import type { CSSProperties } from "react"

interface LoaderProps {
    variant:
        | "circular"
        | "classic"
        | "pulse"
        | "pulse-dot"
        | "dots"
        | "typing"
        | "wave"
        | "bars"
        | "terminal"
        | "text-blink"
        | "text-shimmer"
        | "loading-dots"
    color: string
    size: number
    speed: number
    text: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Loader(props: LoaderProps) {
    const { variant = "circular", color = "#000000", size = 40, speed = 1, text = "Loading..." } = props

    const duration = 1 / speed

    if (variant === "circular") {
        return (
            <motion.div
                style={{
                    width: size,
                    height: size,
                    border: `${size / 10}px solid rgba(0,0,0,0.1)`,
                    borderTop: `${size / 10}px solid ${color}`,
                    borderRadius: "50%",
                }}
                animate={{ rotate: 360 }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        )
    }

    if (variant === "classic") {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    position: "relative",
                }}
            >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: "absolute",
                            width: size / 8,
                            height: size / 3,
                            backgroundColor: color,
                            borderRadius: size / 16,
                            top: "50%",
                            left: "50%",
                            transformOrigin: `center ${-size / 6}px`,
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                        }}
                        animate={{
                            opacity: [0.1, 1, 0.1],
                        }}
                        transition={{
                            duration: duration * 0.8,
                            repeat: Infinity,
                            ease: "linear",
                            delay: (i * duration * 0.8) / 8,
                        }}
                    />
                ))}
            </div>
        )
    }

    if (variant === "pulse") {
        return (
            <motion.div
                style={{
                    width: size,
                    height: size,
                    border: `${size / 10}px solid ${color}`,
                    borderRadius: "50%",
                }}
                animate={{
                    opacity: [1, 0.3, 1],
                }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        )
    }

    if (variant === "pulse-dot") {
        return (
            <motion.div
                style={{
                    width: size / 2,
                    height: size / 2,
                    backgroundColor: color,
                    borderRadius: "50%",
                }}
                animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                }}
                transition={{
                    duration: duration * 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        )
    }

    if (variant === "dots") {
        const dotSize = size / 4
        return (
            <div style={{ display: "flex", gap: size / 8, alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            width: dotSize,
                            height: dotSize,
                            backgroundColor: color,
                            borderRadius: "50%",
                        }}
                        animate={{
                            y: [0, -size / 3, 0],
                        }}
                        transition={{
                            duration: duration * 0.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.15,
                        }}
                    />
                ))}
            </div>
        )
    }

    if (variant === "typing") {
        const dotSize = size / 5
        return (
            <div style={{ display: "flex", gap: size / 10, alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            width: dotSize,
                            height: dotSize,
                            backgroundColor: color,
                            borderRadius: "50%",
                        }}
                        animate={{
                            opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </div>
        )
    }

    if (variant === "wave") {
        const barWidth = size / 8
        return (
            <div style={{ display: "flex", gap: size / 16, alignItems: "center", height: size }}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            width: barWidth,
                            backgroundColor: color,
                            borderRadius: barWidth / 2,
                        }}
                        animate={{
                            height: [size / 3, size, size / 3],
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1,
                        }}
                    />
                ))}
            </div>
        )
    }

    if (variant === "bars") {
        const barWidth = size / 6
        return (
            <div style={{ display: "flex", gap: size / 12, alignItems: "flex-end", height: size }}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            width: barWidth,
                            backgroundColor: color,
                            borderRadius: barWidth / 4,
                        }}
                        animate={{
                            height: [size / 4, size, size / 4],
                        }}
                        transition={{
                            duration: duration * 0.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.15,
                        }}
                    />
                ))}
            </div>
        )
    }

    if (variant === "terminal") {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: size / 8,
                    fontFamily: "monospace",
                    fontSize: size / 2,
                    color: color,
                }}
            >
                <span>&gt;</span>
                <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{
                        duration: duration * 0.8,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    _
                </motion.span>
            </div>
        )
    }

    if (variant === "text-blink") {
        return (
            <motion.div
                style={{
                    fontSize: size / 2.5,
                    fontWeight: 500,
                    color: color,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {text}
            </motion.div>
        )
    }

    if (variant === "text-shimmer") {
        return (
            <div
                style={{
                    position: "relative",
                    fontSize: size / 2.5,
                    fontWeight: 500,
                    color: color,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    overflow: "hidden",
                }}
            >
                {text}
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)`,
                        pointerEvents: "none",
                    }}
                    animate={{
                        x: ["-100%", "200%"],
                    }}
                    transition={{
                        duration: duration * 2,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>
        )
    }

    if (variant === "loading-dots") {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: size / 16,
                    fontSize: size / 2.5,
                    fontWeight: 500,
                    color: color,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                <span>{text}</span>
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                            duration: duration * 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2,
                        }}
                    >
                        .
                    </motion.span>
                ))}
            </div>
        )
    }

    return null
}

addPropertyControls(Loader, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: [
            "circular",
            "classic",
            "pulse",
            "pulse-dot",
            "dots",
            "typing",
            "wave",
            "bars",
            "terminal",
            "text-blink",
            "text-shimmer",
            "loading-dots",
        ],
        optionTitles: [
            "Circular",
            "Classic",
            "Pulse",
            "Pulse Dot",
            "Dots",
            "Typing",
            "Wave",
            "Bars",
            "Terminal",
            "Text Blink",
            "Text Shimmer",
            "Loading Dots",
        ],
        defaultValue: "circular",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 40,
        min: 20,
        max: 100,
        step: 1,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Loading...",
        hidden: (props) =>
            props.variant !== "text-blink" && props.variant !== "text-shimmer" && props.variant !== "loading-dots",
    },
})