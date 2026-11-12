import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

//@framerDisableUnlink
export default function TypingEffect(props) {
    const {
        texts,
        typingSpeed,
        deleteSpeed,
        pauseDuration,
        transitionDuration,
        loop,
        cursorStyle,
        cursorBlink,
        color,
        cursorColor,
        fontSize,
        style,
        animationType,
        highlightColor,
        highlightLength,
        fontFamily,
        textAlign,
        customCursor,
        letterSpacing,
        lineHeight,
    } = props

    const isStatic = useIsStaticRenderer()

    const [currentTextIndex, setCurrentTextIndex] = React.useState(0)
    const [currentText, setCurrentText] = React.useState("")
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(true)

    const isTypingMode = animationType === "Typing"
    const isSlideUp = animationType === "Slide Up"

    React.useEffect(() => {
        if (isStatic) return
        if (!texts || texts.length === 0) return

        const fullText = texts[currentTextIndex]
        if (fullText === undefined) {
            setCurrentTextIndex(0)
            if (isTypingMode) setCurrentText("")
            setIsDeleting(false)
            setIsVisible(true)
            return
        }

        let timeout

        if (isTypingMode) {
            if (isDeleting) {
                timeout = setTimeout(() => {
                    setCurrentText(
                        fullText.substring(0, currentText.length - 1)
                    )
                    if (currentText.length <= 1) {
                        setIsDeleting(false)
                        setCurrentTextIndex((prev) => (prev + 1) % texts.length)
                    }
                }, deleteSpeed)
            } else {
                if (currentText === fullText) {
                    if (!loop && currentTextIndex === texts.length - 1) return
                    timeout = setTimeout(() => {
                        setIsDeleting(true)
                    }, pauseDuration)
                } else {
                    timeout = setTimeout(() => {
                        setCurrentText(
                            fullText.substring(0, currentText.length + 1)
                        )
                    }, typingSpeed)
                }
            }
        } else {
            if (isVisible) {
                if (!loop && currentTextIndex === texts.length - 1) return
                timeout = setTimeout(() => {
                    setIsVisible(false)
                }, pauseDuration)
            } else {
                timeout = setTimeout(() => {
                    setCurrentTextIndex((prev) => (prev + 1) % texts.length)
                    setIsVisible(true)
                }, transitionDuration)
            }
        }

        return () => clearTimeout(timeout)
    }, [
        isStatic,
        currentText,
        isDeleting,
        currentTextIndex,
        texts,
        typingSpeed,
        deleteSpeed,
        pauseDuration,
        transitionDuration,
        loop,
        animationType,
        isVisible,
    ])

    const cursorChar =
        customCursor !== "" ? customCursor : cursorStyle === "Block" ? "█" : "|"

    const alignMap = {
        left: "flex-start",
        center: "center",
        right: "flex-end",
    }

    const containerStyle = {
        ...defaultContainerStyle,
        ...style,
        color,
        fontSize,
        fontFamily: fontFamily === "inherit" ? "inherit" : fontFamily,
        letterSpacing: `${letterSpacing}px`,
        lineHeight: lineHeight,
        justifyContent: alignMap[textAlign] || "flex-start",
        textAlign: textAlign,
    }

    const firstText = texts && texts.length > 0 ? texts[0] : ""

    // Static fallback
    if (isStatic) {
        return (
            <div style={containerStyle}>
                <span style={{ whiteSpace: "pre-wrap" }}>{firstText}</span>
                <span
                    style={{
                        color: cursorColor,
                        display: "inline-block",
                        marginLeft:
                            cursorStyle === "Block" && !customCursor
                                ? "4px"
                                : "2px",
                    }}
                >
                    {cursorChar}
                </span>
            </div>
        )
    }

    let normalText = currentText
    let highlightedText = ""

    if (
        isTypingMode &&
        highlightColor &&
        highlightColor !== "" &&
        highlightLength > 0 &&
        currentText.length > 0
    ) {
        const splitIndex = Math.max(0, currentText.length - highlightLength)
        normalText = currentText.substring(0, splitIndex)
        highlightedText = currentText.substring(splitIndex)
    }

    return (
        <div style={containerStyle}>
            {isTypingMode ? (
                <span style={{ whiteSpace: "pre-wrap" }}>
                    <span style={{ color: "inherit" }}>{normalText}</span>
                    {highlightColor && highlightLength > 0 && (
                        <span style={{ color: highlightColor }}>
                            {highlightedText}
                        </span>
                    )}
                </span>
            ) : (
                <AnimatePresence mode="wait">
                    {isVisible && (
                        <motion.span
                            key={currentTextIndex}
                            initial={{ opacity: 0, y: isSlideUp ? 20 : 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: isSlideUp ? -20 : 0 }}
                            transition={{ duration: transitionDuration / 1000 }}
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {texts[currentTextIndex]}
                        </motion.span>
                    )}
                </AnimatePresence>
            )}

            <motion.span
                animate={{ opacity: cursorBlink ? [1, 1, 0, 0] : 1 }}
                transition={{
                    repeat: Infinity,
                    duration: 1,
                    times: [0, 0.5, 0.5, 1],
                }}
                style={{
                    color: cursorColor,
                    display: "inline-block",
                    marginLeft:
                        cursorStyle === "Block" && !customCursor
                            ? "4px"
                            : "2px",
                }}
            >
                {cursorChar}
            </motion.span>
        </div>
    )
}

const defaultContainerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    fontFamily: "monospace",
    width: "100%",
    height: "100%",
    overflow: "hidden",
}

TypingEffect.defaultProps = {
    texts: ["Hello, World!", "Welcome to Framer.", "Build something great."],
    typingSpeed: 80,
    deleteSpeed: 40,
    pauseDuration: 2000,
    transitionDuration: 600,
    loop: true,
    cursorStyle: "Line",
    cursorBlink: true,
    color: "#e8e8f0",
    cursorColor: "#5c5cf0",
    fontSize: 32,
    animationType: "Typing",
    highlightColor: "",
    highlightLength: 1,
    fontFamily: "monospace",
    textAlign: "left",
    customCursor: "",
    letterSpacing: 0,
    lineHeight: 1.2,
}

addPropertyControls(TypingEffect, {
    texts: {
        type: ControlType.Array,
        control: { type: ControlType.String },
        defaultValue: [
            "Hello, World!",
            "Welcome to Framer.",
            "Build something great.",
        ],
        title: "Texts",
    },
    animationType: {
        type: ControlType.Enum,
        options: ["Typing", "Fade", "Slide Up"],
        defaultValue: "Typing",
        title: "Animation",
    },
    typingSpeed: {
        type: ControlType.Number,
        defaultValue: 80,
        min: 10,
        max: 500,
        unit: "ms",
        title: "Typing Speed",
        hidden(props) {
            return props.animationType !== "Typing"
        },
    },
    deleteSpeed: {
        type: ControlType.Number,
        defaultValue: 40,
        min: 10,
        max: 500,
        unit: "ms",
        title: "Delete Speed",
        hidden(props) {
            return props.animationType !== "Typing"
        },
    },
    pauseDuration: {
        type: ControlType.Number,
        defaultValue: 2000,
        max: 10000,
        unit: "ms",
        title: "Pause Duration",
    },
    transitionDuration: {
        type: ControlType.Number,
        defaultValue: 600,
        min: 100,
        max: 3000,
        unit: "ms",
        title: "Trans Duration",
        hidden(props) {
            return props.animationType === "Typing"
        },
    },
    loop: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Loop",
    },
    highlightColor: {
        type: ControlType.Color,
        defaultValue: "",
        title: "Highlight Color",
        hidden(props) {
            return props.animationType !== "Typing"
        },
    },
    highlightLength: {
        type: ControlType.Number,
        defaultValue: 1,
        title: "Highlight Len",
        hidden(props) {
            return props.animationType !== "Typing"
        },
    },
    cursorStyle: {
        type: ControlType.Enum,
        options: ["Line", "Block"],
        defaultValue: "Line",
        title: "Cursor Style",
        hidden(props) {
            return props.customCursor !== ""
        },
    },
    customCursor: {
        type: ControlType.String,
        defaultValue: "",
        title: "Custom Cursor",
    },
    cursorBlink: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Cursor Blink",
    },
    color: {
        type: ControlType.Color,
        defaultValue: "#e8e8f0",
        title: "Color",
    },
    cursorColor: {
        type: ControlType.Color,
        defaultValue: "#5c5cf0",
        title: "Cursor Color",
    },
    fontSize: {
        type: ControlType.Number,
        defaultValue: 32,
        unit: "px",
        title: "Font Size",
    },
    fontFamily: {
        type: ControlType.Enum,
        options: ["monospace", "sans-serif", "serif", "inherit"],
        defaultValue: "monospace",
        title: "Font Family",
    },
    textAlign: {
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        defaultValue: "left",
        title: "Align",
    },
    letterSpacing: {
        type: ControlType.Number,
        defaultValue: 0,
        unit: "px",
        title: "Letter Spacing",
    },
    lineHeight: {
        type: ControlType.Number,
        defaultValue: 1.2,
        step: 0.1,
        title: "Line Height",
    },
})

TypingEffect.framerSupportedLayoutWidth = "any"
TypingEffect.framerSupportedLayoutHeight = "auto"
TypingEffect.framerIntrinsicWidth = 300
TypingEffect.framerIntrinsicHeight = 60
