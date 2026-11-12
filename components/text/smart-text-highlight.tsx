// Text component with customizable font for highlighted words
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, useState, startTransition, type CSSProperties } from "react"

interface HighlightWord {
    word: string
    font: any
    color: string
    occurrences: string
    backgroundColor: string
    textDecoration: "none" | "underline" | "line-through"
    link: string
    hoverScale: boolean
    wholeWordMatch: boolean
}

interface SmartTextHighlightProps {
    text: string
    highlightWords: HighlightWord[]
    defaultFont: any
    defaultColor: string
    style?: CSSProperties
}

/**
 * Smart Text Highlight
 *
 * A flexible text component that allows you to highlight specific words with custom fonts,
 * colors, backgrounds, decorations, and links. Perfect for emphasizing key terms or creating
 * interactive text elements.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SmartTextHighlight(props: SmartTextHighlightProps) {
    const {
        text = "This is a sample text with highlighted words",
        highlightWords = [
            {
                word: "sample",
                font: {
                    fontSize: "15px",
                    variant: "Bold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
                color: "#0099FF",
                occurrences: "0",
                backgroundColor: "transparent",
                textDecoration: "none",
                link: "",
                hoverScale: false,
                wholeWordMatch: false,
            },
            {
                word: "highlighted",
                font: {
                    fontSize: "15px",
                    variant: "Bold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
                color: "#0099FF",
                occurrences: "0",
                backgroundColor: "transparent",
                textDecoration: "none",
                link: "",
                hoverScale: false,
                wholeWordMatch: false,
            },
        ],
        defaultFont,
        defaultColor = "#000000",
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const processedText = useMemo(() => {
        if (!text || highlightWords.length === 0) {
            return [
                {
                    text,
                    isHighlighted: false,
                    font: null,
                    color: null,
                    backgroundColor: null,
                    textDecoration: null,
                    link: null,
                    hoverScale: false,
                },
            ]
        }

        const pattern = highlightWords
            .filter((item) => item.word && item.word.trim().length > 0)
            .map((item) => {
                const escapedWord = item.word.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )
                return item.wholeWordMatch
                    ? `\\b${escapedWord}\\b`
                    : escapedWord
            })
            .join("|")

        if (!pattern) {
            return [
                {
                    text,
                    isHighlighted: false,
                    font: null,
                    color: null,
                    backgroundColor: null,
                    textDecoration: null,
                    link: null,
                    hoverScale: false,
                },
            ]
        }

        const regex = new RegExp(`(${pattern})`, "gi")
        const parts = text.split(regex)

        const occurrenceCountPerItem: Record<number, number> = {}

        return parts.map((part) => {
            const matchingItems = highlightWords
                .map((item, itemIndex) => ({ item, itemIndex }))
                .filter(
                    ({ item }) => item.word.toLowerCase() === part.toLowerCase()
                )

            if (matchingItems.length > 0) {
                for (const { item, itemIndex } of matchingItems) {
                    if (occurrenceCountPerItem[itemIndex] === undefined) {
                        occurrenceCountPerItem[itemIndex] = 0
                    }

                    occurrenceCountPerItem[itemIndex]++

                    const occurrenceNumbers = item.occurrences
                        .split(",")
                        .map((n) => parseInt(n.trim()))
                        .filter((n) => !isNaN(n))

                    const shouldHighlight =
                        occurrenceNumbers.includes(0) ||
                        occurrenceNumbers.includes(
                            occurrenceCountPerItem[itemIndex]
                        )

                    if (shouldHighlight) {
                        return {
                            text: part,
                            isHighlighted: true,
                            font: item.font,
                            color: item.color,
                            backgroundColor: item.backgroundColor,
                            textDecoration: item.textDecoration,
                            link: item.link,
                            hoverScale: item.hoverScale,
                        }
                    }
                }
            }

            return {
                text: part,
                isHighlighted: false,
                font: null,
                color: null,
                backgroundColor: null,
                textDecoration: null,
                link: null,
                hoverScale: false,
            }
        })
    }, [text, highlightWords])

    const isFixedWidth = props?.style && props.style.width === "100%"
    const isFixedHeight = props?.style && props.style.height === "100%"

    const highlightedCount = processedText.filter(
        (part) => part.isHighlighted
    ).length

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                display: "inline-block",
                ...(isFixedWidth ? {} : { width: "max-content" }),
                ...(isFixedHeight ? {} : { height: "auto" }),
            }}
            role="region"
            aria-label={
                highlightedCount > 0
                    ? `Text with ${highlightedCount} highlighted word${highlightedCount > 1 ? "s" : ""}`
                    : "Text content"
            }
        >
            <p
                style={{
                    margin: 0,
                    padding: 0,
                    width: isFixedWidth ? "100%" : "max-content",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                }}
            >
                {processedText.map((part, index) => {
                    const isHovered = hoveredIndex === index

                    const spanStyle = {
                        ...(part.isHighlighted ? part.font : defaultFont),
                        color: part.isHighlighted ? part.color : defaultColor,
                        backgroundColor: part.isHighlighted
                            ? part.backgroundColor
                            : "transparent",
                        textDecoration: part.isHighlighted
                            ? part.textDecoration
                            : "none",
                        padding:
                            part.isHighlighted &&
                            part.backgroundColor !== "transparent"
                                ? "2px 4px"
                                : "0",
                        borderRadius:
                            part.isHighlighted &&
                            part.backgroundColor !== "transparent"
                                ? "3px"
                                : "0",
                        transition: "transform 0.2s ease",
                        display: "inline-block",
                        transform:
                            part.hoverScale && isHovered
                                ? "scale(1.1)"
                                : "scale(1)",
                    }

                    const hasLink = part.link && part.link.trim() !== ""

                    if (hasLink) {
                        return (
                            <a
                                key={index}
                                href={part.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: "none",
                                    color: "inherit",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={() =>
                                    part.hoverScale &&
                                    startTransition(() =>
                                        setHoveredIndex(index)
                                    )
                                }
                                onMouseLeave={() =>
                                    part.hoverScale &&
                                    startTransition(() => setHoveredIndex(null))
                                }
                                aria-label={`${part.text} (highlighted, opens in new tab)`}
                            >
                                <span
                                    style={spanStyle}
                                    role="mark"
                                    aria-label={`highlighted text: ${part.text}`}
                                >
                                    {part.text}
                                </span>
                            </a>
                        )
                    }

                    if (part.isHighlighted) {
                        return (
                            <span
                                key={index}
                                style={{
                                    ...spanStyle,
                                    cursor: "inherit",
                                }}
                                onMouseEnter={() =>
                                    part.hoverScale &&
                                    startTransition(() =>
                                        setHoveredIndex(index)
                                    )
                                }
                                onMouseLeave={() =>
                                    part.hoverScale &&
                                    startTransition(() => setHoveredIndex(null))
                                }
                                role="mark"
                                aria-label={`highlighted text: ${part.text}`}
                            >
                                {part.text}
                            </span>
                        )
                    }

                    return (
                        <span
                            key={index}
                            style={{
                                ...spanStyle,
                                cursor: "inherit",
                            }}
                        >
                            {part.text}
                        </span>
                    )
                })}
            </p>
        </div>
    )
}

addPropertyControls(SmartTextHighlight, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Crafting digital experiences that inspire & perform",
        displayTextArea: true,
        description: "The main text content to display",
    },
    highlightWords: {
        type: ControlType.Array,
        title: "Highlight Words",
        description: "Define words to highlight with custom styling",
        control: {
            type: ControlType.Object,
            controls: {
                word: {
                    type: ControlType.String,
                    title: "Word",
                    defaultValue: "word",
                    description: "The word to highlight in the text",
                },
                occurrences: {
                    type: ControlType.String,
                    title: "Occurrences",
                    defaultValue: "0",
                    placeholder: "0 (all) or 1,3,5",
                    description:
                        "Which instances to highlight for this array item. Use 0 for all occurrences, or comma-separated numbers (e.g., '1,3' for 1st and 3rd). Each array item tracks independently, so you can add the same word multiple times with different occurrence settings.",
                },
                font: {
                    type: ControlType.Font,
                    title: "Font",
                    defaultValue: {
                        fontSize: "15px",
                        variant: "Bold",
                        letterSpacing: "-0.01em",
                        lineHeight: "1.3em",
                    },
                    controls: "extended",
                    defaultFontType: "sans-serif",
                    description: "Custom font styling for this word",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#0099FF",
                    description: "Text color for highlighted word",
                },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#FFFFFF00",
                    description: "Background color (marker effect)",
                },
                textDecoration: {
                    type: ControlType.Enum,
                    title: "Decoration",
                    options: ["none", "underline", "line-through"],
                    optionTitles: ["None", "Underline", "Strikethrough"],
                    defaultValue: "none",
                    description: "Text decoration style",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                    placeholder: "https://example.com",
                    description: "Optional URL to make word clickable",
                },
                hoverScale: {
                    type: ControlType.Boolean,
                    title: "Hover Scale",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    description: "Scale up slightly on hover",
                },
                wholeWordMatch: {
                    type: ControlType.Boolean,
                    title: "Whole Word",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    description:
                        "Match whole words only (e.g., 'cat' won't match 'category')",
                },
            },
        },
        defaultValue: [
            {
                word: "Inspire",
                occurrences: "0",
                font: {
                    fontSize: "15px",
                    variant: "Bold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
                color: "#0099FF",
                backgroundColor: "#FFFFFF00",
                textDecoration: "none",
                link: "",
                hoverScale: false,
                wholeWordMatch: false,
            },
        ],
        maxCount: 20,
    },
    defaultFont: {
        type: ControlType.Font,
        title: "Default Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        description: "Font for non-highlighted text",
    },
    defaultColor: {
        type: ControlType.Color,
        title: "Default Color",
        defaultValue: "#000000",
        description: "Color for non-highlighted text",
    },
})

SmartTextHighlight.displayName = "Smart Text Highlight"
