// text animation that cycles through different text values
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TextItem {
    text: string
    color: string
}

interface AnimatedTextProps {
    textItems: TextItem[]
    duration: number
    animationType: "fade" | "slide" | "scale" | "rotate"
    font: CSSProperties
    loop: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth
 * @framerSupportedLayoutHeight
 */
export default function AnimatedText(props: AnimatedTextProps) {
    const {
        textItems = [
            { text: "Amazing", color: "#FF5588" },
            { text: "Beautiful", color: "#8855FF" },
            { text: "Stunning", color: "#0099FF" },
            { text: "Incredible", color: "#22CC66" },
        ],
        duration = 2000,
        animationType = "fade",
        font,
        loop = true,
        style,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (textItems.length <= 1) return
        if (isStatic) return

        const interval = setInterval(() => {
            startTransition(() => {
                setCurrentIndex((prev) => {
                    const next = prev + 1
                    if (next >= textItems.length) {
                        return loop ? 0 : prev
                    }
                    return next
                })
            })
        }, duration)

        return () => clearInterval(interval)
    }, [textItems.length, duration, loop, isStatic])

    const variants = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
        },
        slide: {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
        },
        scale: {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 1.2 },
        },
        rotate: {
            initial: { opacity: 0, rotateX: 90 },
            animate: { opacity: 1, rotateX: 0 },
            exit: { opacity: 0, rotateX: -90 },
        },
    }

    const currentVariant = variants[animationType]

    const currentItem = textItems[currentIndex] || {
        text: "Text",
        color: "#000000",
    }

    // Show static text on canvas
    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                }}
            >
                <span
                    style={{
                        display: "inline-block",
                        color: currentItem.color,
                        whiteSpace: "nowrap",
                        ...font,
                    }}
                >
                    {currentItem.text}
                </span>
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
            }}
        >
            <AnimatePresence mode="wait">
                <motion.span
                    key={currentIndex}
                    initial={currentVariant.initial}
                    animate={currentVariant.animate}
                    exit={currentVariant.exit}
                    transition={{
                        duration: 0.5,
                        ease: "easeInOut",
                    }}
                    style={{
                        display: "inline-block",
                        color: currentItem.color,
                        whiteSpace: "nowrap",
                        ...font,
                    }}
                >
                    {currentItem.text}
                </motion.span>
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(AnimatedText, {
    textItems: {
        type: ControlType.Array,
        title: "Text Items",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Text",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#000000",
                },
            },
        },
        defaultValue: [
            { text: "Amazing", color: "#FF5588" },
            { text: "Beautiful", color: "#8855FF" },
            { text: "Stunning", color: "#0099FF" },
            { text: "Incredible", color: "#22CC66" },
        ],
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2000,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["fade", "slide", "scale", "rotate"],
        optionTitles: ["Fade", "Slide", "Scale", "Rotate"],
        defaultValue: "fade",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
