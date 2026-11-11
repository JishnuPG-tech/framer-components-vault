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

interface AuroraBackgroundProps {
    color1: string
    color2: string
    color3: string
    blurAmount: number
    animationSpeed: number
    waveHeight: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

export default function AuroraEffect(props: AuroraBackgroundProps) {
    const { color1, color2, color3, blurAmount, animationSpeed, waveHeight } =
        props

    const duration = 12 / animationSpeed

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    bottom: `${-25 * waveHeight}%`,
                    left: "5%",
                    width: "40%",
                    height: `${50 * waveHeight}%`,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center bottom, ${color1} 0%, transparent 70%)`,
                    filter: `blur(${blurAmount}px)`,
                    opacity: 0.7,
                }}
            />

            <motion.div
                animate={{
                    x: [0, -50, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    bottom: `${-25 * waveHeight}%`,
                    right: "5%",
                    width: "40%",
                    height: `${50 * waveHeight}%`,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center bottom, ${color1} 0%, transparent 70%)`,
                    filter: `blur(${blurAmount}px)`,
                    opacity: 0.7,
                }}
            />

            <motion.div
                animate={{
                    x: [0, -40, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: duration * 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    bottom: `${-30 * waveHeight}%`,
                    left: "25%",
                    width: "45%",
                    height: `${55 * waveHeight}%`,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center bottom, ${color3} 0%, transparent 70%)`,
                    filter: `blur(${blurAmount}px)`,
                    opacity: 0.6,
                }}
            />

            <motion.div
                animate={{
                    x: [0, 40, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: duration * 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    bottom: `${-30 * waveHeight}%`,
                    right: "25%",
                    width: "45%",
                    height: `${55 * waveHeight}%`,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center bottom, ${color3} 0%, transparent 70%)`,
                    filter: `blur(${blurAmount}px)`,
                    opacity: 0.6,
                }}
            />

            <motion.div
                animate={{
                    x: [0, -30, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: duration * 1.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    bottom: `${-20 * waveHeight}%`,
                    left: "-10%",
                    width: "42%",
                    height: `${52 * waveHeight}%`,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center bottom, ${color2} 0%, transparent 70%)`,
                    filter: `blur(${blurAmount}px)`,
                    opacity: 0.5,
                }}
            />

            <motion.div
                animate={{
                    x: [0, 30, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: duration * 1.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    bottom: `${-20 * waveHeight}%`,
                    right: "-10%",
                    width: "42%",
                    height: `${52 * waveHeight}%`,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center bottom, ${color2} 0%, transparent 70%)`,
                    filter: `blur(${blurAmount}px)`,
                    opacity: 0.5,
                }}
            />
        </div>
    )
}

addPropertyControls(AuroraEffect, {
    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#8b5cf6",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#ec4899",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#3b82f6",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 120,
        min: 50,
        max: 200,
        step: 10,
        unit: "px",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    waveHeight: {
        type: ControlType.Number,
        title: "Wave Height",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.1,
    },
})
