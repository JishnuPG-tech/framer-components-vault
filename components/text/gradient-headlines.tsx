// Headline component with gradient highlight for selected words, tag selection, full font controls, and reusable text via prop
import { useMemo, type CSSProperties, createElement } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const tagOptions = ["h1", "h2", "h3", "h4", "h5", "h6", "p"]

interface GradientHeadlineProps {
    text: string
    tag: string
    highlightWords: string | string[]
    gradientFrom: string
    gradientTo: string
    gradientAngle: number
    font: any
    textColor: string
    style?: CSSProperties
}

/**
 * Headline with Gradient Highlight
 *
 * - Select tag (h1-h6, p)
 * - Full font controls
 * - Highlight single/multiple words with gradient
 * - Text is reusable via prop
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function GradientHeadline(props: GradientHeadlineProps) {
    const {
        text,
        tag,
        highlightWords,
        gradientFrom,
        gradientTo,
        gradientAngle,
        font,
        style,
        textColor,
    } = props

    // Parse highlightWords (comma-separated or array)
    const highlightList = useMemo(() => {
        if (!highlightWords) return []
        if (Array.isArray(highlightWords)) return highlightWords
        return highlightWords
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean)
    }, [highlightWords])

    // Split text into words, preserving spaces
    const wordRegex = /\S+|\s+/g
    const words = useMemo(() => {
        if (!text) return []
        return text.match(wordRegex) || []
    }, [text])

    // Render with highlights
    const renderWords = () => {
        if (!highlightList.length)
            return words.map((word, i) => <span key={i}>{word}</span>)
        // Join all words into a string, find all highlight substrings, and split accordingly
        let result = []
        let str = text
        let lastIndex = 0
        // Build a regex to match any of the highlight phrases (escape special chars)
        const highlightRegex = new RegExp(
            highlightList
                .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                .join("|"),
            "gi"
        )
        let match
        let idx = 0
        while ((match = highlightRegex.exec(str)) !== null) {
            if (match.index > lastIndex) {
                result.push(
                    <span key={idx++}>{str.slice(lastIndex, match.index)}</span>
                )
            }
            result.push(
                <span
                    key={idx++}
                    style={{
                        backgroundImage: `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        color: undefined,
                        fontWeight: font?.variant?.includes("Bold")
                            ? "bold"
                            : undefined,
                    }}
                >
                    {match[0]}
                </span>
            )
            lastIndex = match.index + match[0].length
        }
        if (lastIndex < str.length) {
            result.push(<span key={idx++}>{str.slice(lastIndex)}</span>)
        }
        return result
    }

    const Tag = tagOptions.includes(tag) ? tag : "h1"

    // Check if width is set to 100% (fill mode) or auto (fit content mode)
    const isFixedWidth = style?.width === "100%"
    
    const elementStyle = {
        ...style,
        ...font,
        margin: 0,
        width: isFixedWidth ? "100%" : "max-content",
        minWidth: isFixedWidth ? undefined : "max-content",
        display: isFixedWidth ? "block" : "inline-block",
        color: textColor,
    }

    return createElement(Tag, { style: elementStyle }, renderWords())
}

addPropertyControls(GradientHeadline, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "This is a gradient headline",
        displayTextArea: true,
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: tagOptions,
        optionTitles: tagOptions.map((t) => t.toUpperCase()),
        defaultValue: "h1",
    },
    highlightWords: {
        type: ControlType.String,
        title: "Highlight Words",
        placeholder: "word1, word2",
        defaultValue: "gradient",
        description: "Comma-separated words to highlight",
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient From",
        defaultValue: "#0099FF",
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient To",
        defaultValue: "#FF5588",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 90,
        min: 0,
        max: 360,
        unit: "deg",
        step: 1,
        displayStepper: true,
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
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
})