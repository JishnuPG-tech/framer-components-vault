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


/**
 * WAVE TEXT COMPONENT
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 100
 */

export default function WaveText(props) {
    const { text, amplitude, speed, stagger, typography } = props

    const {
        fontFamily,
        fontWeight,
        fontSize,
        letterSpacing,
        lineHeight,
        textAlign,
        color,
    } = typography

    const letters = Array.from(text)

    const alignMap = {
        left: "flex-start",
        center: "center",
        right: "flex-end",
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: alignMap[textAlign] || "center",
                alignItems: "center",
                overflow: "hidden",
                paddingTop: amplitude + 10,
                width: "100%",

                // Typography
                fontFamily,
                fontWeight,
                fontSize,
                letterSpacing,
                lineHeight,
                color,
            }}
        >
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    style={{
                        display: "inline-block",
                        whiteSpace: "pre",
                    }}
                    animate={{
                        y: [0, -amplitude, 0],
                    }}
                    transition={{
                        duration: speed,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * stagger,
                    }}
                >
                    {letter}
                </motion.span>
            ))}
        </div>
    )
}

/* ───────────────────────────────────────────── */
/* PROPERTY CONTROLS                             */
/* ───────────────────────────────────────────── */

addPropertyControls(WaveText, {
    // CONTENT
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "WAVE",
        displayTextArea: true,
    },

    // TYPOGRAPHY (NOW INCLUDES COLOR)
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            fontFamily: {
                type: ControlType.String,
                title: "Font",
                defaultValue: "Inter",
                placeholder: "Inter, sans-serif",
            },
            fontWeight: {
                type: ControlType.Enum,
                title: "Weight",
                defaultValue: 700,
                options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
                optionTitles: [
                    "Thin",
                    "Extra Light",
                    "Light",
                    "Regular",
                    "Medium",
                    "Semi Bold",
                    "Bold",
                    "Extra Bold",
                    "Black",
                ],
            },
            fontSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 64,
                min: 10,
                max: 200,
                step: 1,
            },
            letterSpacing: {
                type: ControlType.Number,
                title: "Letter",
                defaultValue: 0,
                min: -20,
                max: 50,
                step: 0.1,
                displayStepper: true,
            },
            lineHeight: {
                type: ControlType.Number,
                title: "Line",
                defaultValue: 1.2,
                min: 0.5,
                max: 3,
                step: 0.1,
                displayStepper: true,
            },
            textAlign: {
                type: ControlType.Enum,
                title: "Align",
                defaultValue: "center",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#333333",
            },
        },
    },

    // ANIMATION
    amplitude: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 20,
        min: 0,
        max: 100,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
