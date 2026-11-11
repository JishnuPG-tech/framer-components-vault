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

import { useEffect, useMemo, useState } from "react"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

/* ---------------- Animation Presets ---------------- */

const ANIMATIONS = {
    fade: {
        initial: { opacity: 0, y: "0.15em", filter: "blur(4px)" },
        animate: { opacity: 1, y: "0em", filter: "blur(0px)" },
        exit: { opacity: 0, y: "-0.15em", filter: "blur(4px)" },
    },
    scale: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    },
    flip: {
        initial: { opacity: 0, rotateX: 90 },
        animate: { opacity: 1, rotateX: 0 },
        exit: { opacity: 0, rotateX: -90 },
    },
    slide: {
        initial: { opacity: 0, x: "-40%" },
        animate: { opacity: 1, x: "0%" },
        exit: { opacity: 0, x: "40%" },
    },
}

/* ---------------- Alignment Map ---------------- */

const JUSTIFY_MAP = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
}

export default function InlineVisualWord(props) {
    const {
        text,
        items,
        font,
        interval,
        align,
        textColor,
        animationType,
        style,
    } = props

    const [showImage, setShowImage] = useState(false)

    /* ---------------- Timer ---------------- */

    useEffect(() => {
        if (RenderTarget.current() === RenderTarget.canvas) return

        const timer = setInterval(
            () => setShowImage((prev) => !prev),
            interval * 1000
        )

        return () => clearInterval(timer)
    }, [interval])

    /* ---------------- Animation Selection ---------------- */

    const motionPreset = ANIMATIONS[animationType] ?? ANIMATIONS.fade

    /* ---------------- Normalize Animated Words ---------------- */

    const itemMap = useMemo(() => {
        if (!Array.isArray(items)) return {}

        return items.reduce((acc, item) => {
            if (item?.word) {
                acc[item.word.toLowerCase()] = item
            }
            return acc
        }, {})
    }, [items])

    /* ---------------- Tokenize Text ---------------- */

    const tokens = useMemo(() => {
        if (typeof text !== "string") return []
        return text.split(/(\s+)/)
    }, [text])

    /* ---------------- Render ---------------- */

    return (
        <div
            style={{
                ...style,
                ...font,
                display: "inline-block",
                whiteSpace: "normal",
                textAlign: align,
                color: textColor,
            }}
        >
            {tokens.map((token, index) => {
                const key = token.trim().toLowerCase()
                const item = itemMap[key]

                if (!item) {
                    return <span key={index}>{token}</span>
                }

                return (
                    <span
                        key={index}
                        style={{
                            display: "inline-block",
                            position: "relative",
                            verticalAlign: "baseline",
                        }}
                    >
                        {/* Width keeper */}
                        <span
                            style={{
                                visibility: "hidden",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {token}
                        </span>

                        {/* Animated layer */}
                        <span
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent:
                                    JUSTIFY_MAP[item.imageAlign] ?? "center",
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {!showImage && (
                                    <motion.span
                                        key="text"
                                        {...motionPreset}
                                        transition={{
                                            duration: 0.45,
                                            ease: "easeOut",
                                        }}
                                        style={{
                                            whiteSpace: "nowrap",
                                            color: item.color ?? textColor,
                                        }}
                                    >
                                        {token}
                                    </motion.span>
                                )}

                                {showImage && item.image?.src && (
                                    <motion.img
                                        key="image"
                                        src={item.image.src}
                                        alt={item.image.alt}
                                        {...motionPreset}
                                        transition={{
                                            duration: 0.45,
                                            ease: "easeOut",
                                        }}
                                        style={{
                                            height: "1em",
                                            width: "auto",
                                            display: "block",
                                            userSelect: "none",
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </span>
                    </span>
                )
            })}
        </div>
    )
}

/* ---------------- Defaults ---------------- */

InlineVisualWord.defaultProps = {
    text: "Use Framer to build and ship",
    interval: 2.5,
    align: "left",
    textColor: "#000000",
    animationType: "fade",
    items: [],
    font: {
        family: "Inter",
        size: 48,
        weight: "Bold",
        lineHeight: 1.2,
    },
}

/* ---------------- Controls ---------------- */

addPropertyControls(InlineVisualWord, {
    text: {
        type: ControlType.String,
        title: "Text",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["fade", "scale", "flip", "slide"],
        optionTitles: ["Fade", "Scale", "Flip", "Slide"],
        defaultValue: "fade",
    },
    items: {
        type: ControlType.Array,
        title: "Animated Words",
        control: {
            type: ControlType.Object,
            controls: {
                word: {
                    type: ControlType.String,
                    title: "Word",
                },
                color: {
                    type: ControlType.Color,
                    title: "Override Color",
                },
                imageAlign: {
                    type: ControlType.Enum,
                    title: "Image Align",
                    options: ["left", "center", "right"],
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
    },
    align: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        defaultValue: "left",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        title: "Typography",
    },
    interval: {
        type: ControlType.Number,
        title: "Switch Interval",
        min: 0.8,
        max: 6,
        step: 0.1,
        unit: "s",
    },
})
