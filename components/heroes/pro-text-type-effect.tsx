// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import { motion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 120
 */
export default function ProTextTypeEffect(props) {
    const {
        text,
        as: asTag,
        typingSpeed,
        initialDelay,
        pauseDuration,
        deletingSpeed,
        loop,
        className,
        showCursor,
        hideCursorWhileTyping,
        cursorMode,
        cursorCharacterPreset,
        customCursorCharacter,
        cursorClassName,
        cursorBlinkDuration,
        textColors,
        cursorColorMode,
        cursorCustomColor,
        variableSpeed,
        startOnVisible,
        reverseMode,
        sizingMode,
        minFont,
        maxFont,
        fluidVw,
        style,
        ...rest
    } = props

    // Accept single string or array
    const textArray = React.useMemo(
        () => (Array.isArray(text) ? text : [text ?? ""]),
        [text]
    )

    // Cursor character resolution
    const cursorChar =
        cursorMode === "custom"
            ? customCursorCharacter?.length
                ? customCursorCharacter
                : "|"
            : cursorCharacterPreset

    const [displayedText, setDisplayedText] = React.useState("")
    const [currentCharIndex, setCurrentCharIndex] = React.useState(0)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [currentTextIndex, setCurrentTextIndex] = React.useState(0)
    const [isVisible, setIsVisible] = React.useState(!startOnVisible)

    // Colors
    const firstColor = (textColors && textColors[0]) || "#000000"
    const resolvedCursorColor =
        cursorColorMode === "custom" && cursorCustomColor
            ? cursorCustomColor
            : firstColor

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const As: any = asTag || "div"

    // Variable typing speed
    const getRandomSpeed = React.useCallback(() => {
        if (!variableSpeed) return typingSpeed
        const { min, max } = variableSpeed
        const lo = Math.max(0, Number(min) || 0)
        const hi = Math.max(lo, Number(max) || lo)
        return Math.random() * (hi - lo) + lo
    }, [variableSpeed, typingSpeed])

    const getCurrentTextColor = React.useCallback(() => {
        if (!textColors || textColors.length === 0) return "#000000"
        return textColors[currentTextIndex % textColors.length]
    }, [textColors, currentTextIndex])

    // Start on visible
    React.useEffect(() => {
        if (!startOnVisible || !containerRef.current) return
        const el = containerRef.current
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setIsVisible(true)
                })
            },
            { threshold: 0.1 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [startOnVisible])

    // Typing loop
    React.useEffect(() => {
        if (!isVisible) return
        let timeout: ReturnType<typeof setTimeout> | undefined

        const currentText = textArray[currentTextIndex] ?? ""
        const processed = reverseMode
            ? currentText.split("").reverse().join("")
            : currentText

        const run = () => {
            if (isDeleting) {
                if (displayedText.length === 0) {
                    setIsDeleting(false)
                    if (currentTextIndex === textArray.length - 1 && !loop)
                        return
                    setCurrentTextIndex((i) => (i + 1) % textArray.length)
                    setCurrentCharIndex(0)
                    timeout = setTimeout(() => {}, pauseDuration)
                } else {
                    timeout = setTimeout(() => {
                        setDisplayedText((prev) => prev.slice(0, -1))
                    }, deletingSpeed)
                }
            } else {
                if (currentCharIndex < processed.length) {
                    timeout = setTimeout(
                        () => {
                            setDisplayedText(
                                (prev) => prev + processed[currentCharIndex]
                            )
                            setCurrentCharIndex((i) => i + 1)
                        },
                        variableSpeed ? getRandomSpeed() : typingSpeed
                    )
                } else {
                    if (
                        textArray.length > 1 &&
                        (loop || currentTextIndex < textArray.length - 1)
                    ) {
                        timeout = setTimeout(
                            () => setIsDeleting(true),
                            pauseDuration
                        )
                    } else {
                        // stop on last sentence; keep cursor blinking
                    }
                }
            }
        }

        if (currentCharIndex === 0 && !isDeleting && displayedText === "") {
            timeout = setTimeout(run, initialDelay)
        } else {
            run()
        }

        return () => timeout && clearTimeout(timeout)
    }, [
        isVisible,
        textArray,
        currentTextIndex,
        loop,
        currentCharIndex,
        displayedText,
        isDeleting,
        typingSpeed,
        deletingSpeed,
        pauseDuration,
        initialDelay,
        reverseMode,
        variableSpeed,
        getRandomSpeed,
    ])

    // Fluid font style via CSS clamp
    const fluidStyle: React.CSSProperties =
        sizingMode === "fluid"
            ? { fontSize: `clamp(${minFont}px, ${fluidVw}vw, ${maxFont}px)` }
            : {}

    // Base container style
    const { clipOverflow = false } = props

    const baseStyle: React.CSSProperties = {
        display: "block",
        width: "100%",
        height: "100%",
        whiteSpace: "pre-wrap",
        overflow: clipOverflow ? "hidden" : "visible",
        textAlign: props.textAlign,
        ...style,
    }

    const shouldHideCursor =
        hideCursorWhileTyping &&
        (currentCharIndex < (textArray[currentTextIndex] ?? "").length ||
            isDeleting)

    return (
        <As
            ref={containerRef}
            className={`text-type ${className || ""}`}
            style={baseStyle}
            {...rest}
        >
            <span
                className="text-type__content"
                style={{
                    all: "unset",
                    display: "inline",
                    color: getCurrentTextColor(),
                    ...props.font,
                    ...fluidStyle,
                }}
            >
                {displayedText}
            </span>

            {showCursor && !shouldHideCursor && (
                <motion.span
                    className={`text-type__cursor ${cursorClassName || ""}`}
                    style={{
                        marginLeft: "0.25rem",
                        display: "inline-block",
                        color: resolvedCursorColor,
                        ...props.font,
                        ...fluidStyle,
                    }}
                    animate={{ opacity: [1, 0] }}
                    transition={{
                        duration: cursorBlinkDuration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                >
                    {cursorChar}
                </motion.span>
            )}
        </As>
    )
}

ProTextTypeEffect.displayName = "Pro Text Type Effect"

addPropertyControls(ProTextTypeEffect, {
    text: {
        type: ControlType.Array,
        title: "Text",
        defaultValue: [
            "Hello, Framer folks!",
            "This is the ultimate typing text component",
            "Checkout what all you can do from the panel on the right →",
        ],
        control: {
            type: ControlType.String,
            displayTextArea: true,
            defaultValue: "",
        },
    },
    font: {
        type: "font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            lineHeight: 1.2,
        },
    },
    sizingMode: {
        type: ControlType.Enum,
        title: "Sizing",
        options: ["fixed", "fluid"],
        optionTitles: ["Fixed", "Fluid (clamp)"],
        defaultValue: "fluid",
        description: "Choose how the text scales",
    },
    minFont: {
        type: ControlType.Number,
        title: "Min px",
        defaultValue: 18,
        min: 8,
        max: 200,
        hidden: (p) => p.sizingMode !== "fluid",
        description: "Smallest allowed font size",
    },
    maxFont: {
        type: ControlType.Number,
        title: "Max px",
        defaultValue: 64,
        min: 8,
        max: 200,
        hidden: (p) => p.sizingMode !== "fluid",
        description: "Largest allowed font size",
    },
    fluidVw: {
        type: ControlType.Number,
        title: "Scale (vw)",
        defaultValue: 6,
        min: 0.1,
        max: 20,
        step: 0.1,
        hidden: (p) => p.sizingMode !== "fluid",
        description: "How quickly the font grows as the screen width increases",
    },
    textColors: {
        type: ControlType.Array,
        title: "Text Colors",
        control: { type: ControlType.Color, defaultValue: "#000000" },
        defaultValue: ["#000000"],
        description: "Cycles through colors per sentence",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right", "justify"],
        optionTitles: ["Left", "Center", "Right", "Justify"],
        defaultValue: "left",
    },
    as: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["div", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6"],
        optionTitles: ["div", "p", "span", "H1", "H2", "H3", "H4", "H5", "H6"],
        defaultValue: "p",
    },
    typingSpeed: {
        type: ControlType.Number,
        title: "Type (ms)",
        min: 1,
        max: 500,
        step: 1,
        defaultValue: 50,
        description: "Time between charachters",
    },
    deletingSpeed: {
        type: ControlType.Number,
        title: "Delete (ms)",
        min: 1,
        max: 500,
        step: 1,
        defaultValue: 30,
        description: "Time between deletions",
    },
    initialDelay: {
        type: ControlType.Number,
        title: "Delay (ms)",
        min: 0,
        max: 5000,
        step: 10,
        defaultValue: 0,
        description: "Waiting time before starting",
    },
    pauseDuration: {
        type: ControlType.Number,
        title: "Pause (ms)",
        min: 0,
        max: 10000,
        step: 50,
        defaultValue: 2000,
        description: "Waiting time before deleting/next",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    reverseMode: {
        type: ControlType.Boolean,
        title: "Reverse text",
        defaultValue: false,
    },
    startOnVisible: {
        type: ControlType.Boolean,
        title: "Start on visible",
        defaultValue: false,
        description: "Begin typing only when in view",
    },
    showCursor: {
        type: ControlType.Boolean,
        title: "Show cursor",
        defaultValue: true,
    },
    cursorMode: {
        type: ControlType.Enum,
        title: "Cursor",
        options: ["preset", "custom"],
        optionTitles: ["Preset", "Custom"],
        defaultValue: "preset",
        hidden: (p) => !p.showCursor,
    },
    cursorCharacterPreset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["|", "_", "‖", "❚", "▋", "▌", "█"],
        optionTitles: [
            "Pipe |",
            "Underscore _",
            "Double Bar ‖",
            "Block ❚",
            "Left Half ▋",
            "Right Half ▌",
            "Full Block █",
        ],
        defaultValue: "|",
        hidden: (p) => !p.showCursor || p.cursorMode !== "preset",
    },
    customCursorCharacter: {
        type: ControlType.String,
        title: "Custom char",
        placeholder: "Any character(s)",
        defaultValue: "|",
        hidden: (p) => !p.showCursor || p.cursorMode !== "custom",
    },
    cursorColorMode: {
        type: ControlType.Enum,
        title: "Cursor color",
        options: ["matchFirst", "custom"],
        optionTitles: ["Match first color", "Custom"],
        defaultValue: "matchFirst",
        hidden: (p) => !p.showCursor,
    },
    cursorCustomColor: {
        type: ControlType.Color,
        title: "Custom color",
        optional: true,
        hidden: (p) => !p.showCursor || p.cursorColorMode !== "custom",
    },
    cursorBlinkDuration: {
        type: ControlType.Number,
        title: "Blink (s)",
        min: 0.05,
        max: 2,
        step: 0.05,
        defaultValue: 0.5,
        hidden: (p) => !p.showCursor,
    },
    hideCursorWhileTyping: {
        type: ControlType.Boolean,
        title: "Hide while typing",
        defaultValue: false,
        hidden: (p) => !p.showCursor,
    },
    variableSpeed: {
        type: ControlType.Object,
        title: "Variable speed",
        optional: true,
        controls: {
            min: {
                type: ControlType.Number,
                title: "Min (ms)",
                min: 1,
                max: 500,
                step: 1,
                defaultValue: 30,
            },
            max: {
                type: ControlType.Number,
                title: "Max (ms)",
                min: 1,
                max: 500,
                step: 1,
                defaultValue: 80,
            },
        },
        description:
            "Random delay between characters\n\nComponent crafted by [Vaibhav](https://contra.com/vaibhav_khulbe)",
    },
})
