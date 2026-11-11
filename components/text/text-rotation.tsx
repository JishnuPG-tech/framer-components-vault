import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Props = {
    staticText: string
    phrases: string[]
    interval: number
    animationMode: "phrase" | "word" | "character"
    animationStyle: "slideUp" | "slideDown" | "fade"
    loop: boolean
    pauseOnHover: boolean
    font: any
    staticColor: string
    color: string
}

export default function TextRotation(props: Props) {
    const {
        staticText,
        phrases,
        interval,
        animationMode,
        animationStyle,
        loop,
        pauseOnHover,
        font,
        staticColor,
        color,
    } = props

    const safePhrases = phrases.length > 0 ? phrases : ["Text"]
    const [index, setIndex] = React.useState(0)
    const [paused, setPaused] = React.useState(false)

    React.useEffect(() => {
        if (paused) return
        if (!loop && index === safePhrases.length - 1) return

        const id = setTimeout(() => {
            setIndex((i) => (i + 1) % safePhrases.length)
        }, interval)

        return () => clearTimeout(id)
    }, [index, interval, loop, paused, safePhrases.length])

    const text = safePhrases[index]

    const units =
        animationMode === "character"
            ? Array.from(text)
            : animationMode === "word"
              ? text
                    .split(" ")
                    .map((w, i, arr) => (i < arr.length - 1 ? w + " " : w))
              : [text]

    const motionVariants = {
        slideUp: {
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -16 },
        },
        slideDown: {
            initial: { opacity: 0, y: -16 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 16 },
        },
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
        },
    }

    const fontStyle = {
        ...font,
        fontFeatureSettings: font?.fontFeatureSettings,
        fontVariationSettings: font?.fontVariationSettings,
        fontOpticalSizing: font?.fontOpticalSizing,
    }

    return (
        <div
            aria-live="polite"
            onMouseEnter={() => pauseOnHover && setPaused(true)}
            onMouseLeave={() => pauseOnHover && setPaused(false)}
            style={{
                ...fontStyle,
                display: "inline-flex",
                alignItems: "center",
            }}
        >
            {staticText && (
                <span
                    style={{
                        ...fontStyle,
                        marginRight: 6,
                        color: staticColor,
                        whiteSpace: "pre",
                    }}
                >
                    {staticText}
                </span>
            )}

            {/* Mask container */}
            <span
                style={{
                    position: "relative",
                    display: "inline-block",
                    overflow: "hidden",
                    lineHeight: 1.25,
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={text + index}
                        {...motionVariants[animationStyle]}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{
                            ...fontStyle,
                            display: "inline-block",
                            whiteSpace: "nowrap",
                            color,
                        }}
                    >
                        {units.map((unit, i) => (
                            <motion.span
                                key={i}
                                initial={
                                    animationMode === "phrase"
                                        ? false
                                        : { opacity: 0, y: 8 }
                                }
                                animate={
                                    animationMode === "phrase"
                                        ? {}
                                        : { opacity: 1, y: 0 }
                                }
                                transition={{
                                    delay:
                                        animationMode === "phrase"
                                            ? 0
                                            : i * 0.04,
                                }}
                                style={{
                                    ...fontStyle,
                                    display: "inline-block",
                                    whiteSpace: "pre",
                                }}
                            >
                                {unit}
                            </motion.span>
                        ))}
                    </motion.span>
                </AnimatePresence>
            </span>
        </div>
    )
}

TextRotation.defaultProps = {
    staticText: "I like",
    phrases: ["apples", "mangoes", "oranges"],
    interval: 2000,
    animationMode: "phrase",
    animationStyle: "slideUp",
    loop: true,
    pauseOnHover: false,
    staticColor: "#666",
    color: "#000",
}

addPropertyControls(TextRotation, {
    staticText: {
        type: ControlType.String,
        title: "Static Text",
    },
    phrases: {
        type: ControlType.Array,
        title: "Rotating Text",
        control: { type: ControlType.String },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        min: 500,
        max: 8000,
        unit: "ms",
    },
    animationMode: {
        type: ControlType.Enum,
        title: "Animate By",
        options: ["phrase", "word", "character"],
    },
    animationStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["slideUp", "slideDown", "fade"],
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
    },
    staticColor: {
        type: ControlType.Color,
        title: "Static Color",
    },
    color: {
        type: ControlType.Color,
        title: "Rotate Color",
    },
})
