import { useRef, useEffect } from "react"
import { motion, useInView } from "framer-motion"
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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Dir = "top" | "bottom" | "left" | "right" | "center"

export default function TextClipPathReveal(props) {
    const {
        text = "Transform your content\nwith stunning animations\nthat captivate your audience.",
        font,
        textColor = "#000000",
        backgroundColor = "transparent",
        revealDirection = "bottom",
        staggerDelay = 0.15,
        duration = 0.8,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.3, once: false })

    const getAnim = (d: Dir) => {
        switch (d) {
            case "top":
                return { clipPath: "inset(100% 0% 0% 0%)", y: -40 }
            case "bottom":
                return { clipPath: "inset(0% 0% 100% 0%)", y: 40 }
            case "left":
                return { clipPath: "inset(0% 100% 0% 0%)", x: -40 }
            case "right":
                return { clipPath: "inset(0% 0% 0% 100%)", x: 40 }
            case "center":
                return { clipPath: "inset(50% 50% 50% 50%)", scale: 0.8 }
            default:
                return { clipPath: "inset(0% 0% 100% 0%)", y: 40 }
        }
    }

    // Split text by lines
    const lines = text.split("\n").filter((line) => line.length > 0)

    return (
        <motion.div
            ref={containerRef}
            initial="visible"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
                hidden: {},
            }}
            style={{
                ...font,
                color: textColor,
                backgroundColor,
                width: "100%",
                height: "100%",
            }}
        >
            {lines.map((line, i) => (
                <motion.div
                    key={i}
                    variants={{
                        hidden: getAnim(revealDirection),
                        visible: {
                            clipPath: "inset(0% 0% 0% 0%)",
                            y: 0,
                            x: 0,
                            scale: 1,
                            transition: {
                                duration,
                                ease: [0.2, 0.65, 0.3, 0.9],
                            },
                        },
                    }}
                >
                    {line}
                </motion.div>
            ))}
        </motion.div>
    )
}

addPropertyControls(TextClipPathReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "Transform your content\nwith stunning animations\nthat captivate your audience.",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    revealDirection: {
        type: ControlType.Enum,
        title: "Reveal Direction",
        options: ["top", "bottom", "left", "right", "center"],
        optionTitles: ["Top", "Bottom", "Left", "Right", "Center"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.8,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
        displayStepper: true,
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "s",
        displayStepper: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
})
