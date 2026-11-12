// Highlighting Text Component - Allows users to emphasize specific words or phrases within a sentence using customizable background highlights

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

import { useMemo, type CSSProperties } from "react"

interface HighlightTextProps {
    text: string
    highlightWords: string
    highlightColor: string
    textColor: string
    highlightTextColor: string
    font: CSSProperties
    padding: string
    backgroundColor: string
    borderRadius: number
    highlightBorderRadius: number
    enableAnimation: boolean
    animationType: "fade" | "slide"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HighlightText(props: HighlightTextProps) {
    const {
        text,
        highlightWords,
        highlightColor,
        textColor,
        highlightTextColor,
        font,
        padding,
        backgroundColor,
        borderRadius,
        highlightBorderRadius,
        enableAnimation,
        animationType,
        style,
    } = props

    const wordsToHighlight = useMemo(() => {
        if (!highlightWords.trim()) return []
        return highlightWords
            .split(",")
            .map((word) => word.trim().toLowerCase())
            .filter((word) => word.length > 0)
    }, [highlightWords])

    const processedText = useMemo(() => {
        if (wordsToHighlight.length === 0) {
            return [{ text, isHighlighted: false }]
        }

        const parts: Array<{ text: string; isHighlighted: boolean }> = []
        let currentIndex = 0

        while (currentIndex < text.length) {
            let foundMatch = false
            let earliestMatch = {
                index: text.length,
                word: "",
                length: 0,
            }

            // Find the earliest match from current position
            for (const word of wordsToHighlight) {
                const index = text.toLowerCase().indexOf(word, currentIndex)
                if (index !== -1 && index < earliestMatch.index) {
                    earliestMatch = {
                        index,
                        word: text.substring(index, index + word.length),
                        length: word.length,
                    }
                    foundMatch = true
                }
            }

            if (foundMatch) {
                // Add non-highlighted text before the match
                if (earliestMatch.index > currentIndex) {
                    parts.push({
                        text: text.substring(currentIndex, earliestMatch.index),
                        isHighlighted: false,
                    })
                }

                // Add highlighted text
                parts.push({
                    text: earliestMatch.word,
                    isHighlighted: true,
                })

                currentIndex = earliestMatch.index + earliestMatch.length
            } else {
                // No more matches, add remaining text
                parts.push({
                    text: text.substring(currentIndex),
                    isHighlighted: false,
                })
                break
            }
        }

        return parts
    }, [text, wordsToHighlight])

    const animationVariants = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.5 },
        },
        slide: {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5 },
        },
    }

    const selectedAnimation = animationVariants[animationType]

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                padding,
                backgroundColor,
                borderRadius,
                boxSizing: "border-box",
                ...font,
                color: textColor,
            }}
        >
            <p
                style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    width: "100%",
                }}
            >
                {processedText.map((part, index) => {
                    if (part.isHighlighted) {
                        if (enableAnimation) {
                            return (
                                <motion.span
                                    key={index}
                                    initial={selectedAnimation.initial}
                                    whileInView={selectedAnimation.animate}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={selectedAnimation.transition}
                                    style={{
                                        backgroundColor: highlightColor,
                                        color: highlightTextColor,
                                        borderRadius: highlightBorderRadius,
                                        padding: "2px 4px",
                                        display: "inline",
                                        boxDecorationBreak: "clone",
                                        WebkitBoxDecorationBreak: "clone",
                                    }}
                                >
                                    {part.text}
                                </motion.span>
                            )
                        }
                        return (
                            <span
                                key={index}
                                style={{
                                    backgroundColor: highlightColor,
                                    color: highlightTextColor,
                                    borderRadius: highlightBorderRadius,
                                    padding: "2px 4px",
                                    boxDecorationBreak: "clone",
                                    WebkitBoxDecorationBreak: "clone",
                                }}
                            >
                                {part.text}
                            </span>
                        )
                    }
                    return <span key={index}>{part.text}</span>
                })}
            </p>
        </div>
    )
}

addPropertyControls(HighlightText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "The simplicity of this tool has given me real confidence in managing SEO for my clients, and it's an absolute steal vs other platforms on the market.",
        displayTextArea: true,
    },
    highlightWords: {
        type: ControlType.String,
        title: "Highlight Words",
        defaultValue: "simplicity, real confidence, absolute steal",
        placeholder: "word1, word2, phrase",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#FFBB00",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    highlightTextColor: {
        type: ControlType.Color,
        title: "Highlight Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "20px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(255, 255, 255, 0)",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Container Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    highlightBorderRadius: {
        type: ControlType.Number,
        title: "Highlight Radius",
        defaultValue: 4,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    enableAnimation: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation Type",
        options: ["fade", "slide"],
        optionTitles: ["Fade In", "Slide Up"],
        defaultValue: "fade",
        displaySegmentedControl: true,
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
})