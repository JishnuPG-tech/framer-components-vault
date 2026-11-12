// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, type Variants } from "framer-motion"
import { type CSSProperties, useMemo } from "react"

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LiquidWaveText(props) {
    const {
        text,
        font,
        color1,
        color2,
        color3,
        waveSpeed,
        waveIntensity,
        isLooping,
        alignment,
        baseColor,
    } = props

    const backgroundSize = `${200 + (100 - waveIntensity)}% 100%`

    const gradientStyle: CSSProperties = {
        backgroundImage: `linear-gradient(
            90deg, 
            ${baseColor} 0%, 
            ${baseColor} 40%, 
            ${color1} 45%, 
            ${color2} 50%, 
            ${color3} 55%, 
            ${baseColor} 60%, 
            ${baseColor} 100%
        )`,
        backgroundSize: backgroundSize,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        width: "100%",
        textAlign: alignment,
        ...font,
    }

    // Animation variants
    const waveVariants: Variants = {
        animate: {
            backgroundPosition: ["100% 0%", "0% 0%"],
            transition: {
                duration: 10 / waveSpeed,
                ease: "linear",
                repeat: isLooping ? Infinity : 0,
                repeatType: "loop",
            },
        },
        static: {
            backgroundPosition: "100% 0%",
        },
    }

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems:
                    alignment === "center"
                        ? "center"
                        : alignment === "right"
                          ? "flex-end"
                          : "flex-start",
                overflow: "hidden",
            }}
        >
            <motion.h1
                style={{
                    margin: 0,
                    padding: 0,
                    ...gradientStyle,
                }}
                variants={waveVariants}
                animate={isCanvas ? "static" : "animate"}
                initial="static"
            >
                {text}
            </motion.h1>
        </div>
    )
}

addPropertyControls(LiquidWaveText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Liquid Wave",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 64,
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            textAlign: "center",
        },
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#333333",
    },
    color1: {
        type: ControlType.Color,
        title: "Wave Color 1",
        defaultValue: "#0099FF",
    },
    color2: {
        type: ControlType.Color,
        title: "Wave Color 2",
        defaultValue: "#8855FF",
    },
    color3: {
        type: ControlType.Color,
        title: "Wave Color 3",
        defaultValue: "#FF5588",
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        displayStepper: true,
    },
    waveIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 50,
        min: 0,
        max: 100,
        unit: "%",
    },
    isLooping: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
