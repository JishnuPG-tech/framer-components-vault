// Text component with indentation, text balance, and rich text support
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties, useMemo } from "react"

interface RichTextComponentProps {
    text: string
    font: any
    textColor: string
    highlightText: string
    highlightColor: string
    highlightPosition: "start" | "end"
    textIndent: number
    useTextBalance: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RichTextComponent(props: RichTextComponentProps) {
    const {
        text,
        font,
        textColor,
        highlightText,
        highlightColor,
        highlightPosition,
        textIndent,
        useTextBalance,
    } = props

    const processedText = useMemo(() => {
        if (!highlightText || highlightText.trim() === "") {
            return text
        }

        const highlightStyle = `color: ${highlightColor};`
        const regex = new RegExp(`(${highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        
        // Check if highlight text exists in main text
        if (text.toLowerCase().includes(highlightText.toLowerCase())) {
            return text.replace(regex, `<span style="${highlightStyle}">$1</span>`)
        } else {
            // If highlight text doesn't exist in main text, add it based on position
            const highlightSpan = `<span style="${highlightStyle}">${highlightText}</span>`
            if (highlightPosition === "start") {
                return `${highlightSpan} ${text}`
            } else {
                return `${text} ${highlightSpan}`
            }
        }
    }, [text, highlightText, highlightColor, highlightPosition])

    return (
        <div
            style={{
                display: "block",
                width: "100%",
                height: "100%",
                color: textColor,
                textIndent: `${textIndent}px`,
                ...(useTextBalance && { textWrap: "balance" as any }),
                ...font,
            }}
            dangerouslySetInnerHTML={{ __html: processedText }}
        />
    )
}

addPropertyControls(RichTextComponent, {
    highlightText: {
        type: ControlType.String,
        title: "Key Text",
        defaultValue: "sample",
        placeholder: "Text to highlight...",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FF6B35",
    },
    highlightPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["start", "end"],
        optionTitles: ["Beginning", "End"],
        defaultValue: "end",
        displaySegmentedControl: true,
    },
    text: {
        type: ControlType.String,
        title: "Main Text",
        defaultValue: "This is a sample text with rich formatting support. You can style different words with different colors and weights.",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.4em",
            textAlign: "left",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    textIndent: {
        type: ControlType.Number,
        title: "Indentation",
        defaultValue: 100,
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
    },
    useTextBalance: {
        type: ControlType.Boolean,
        title: "Text Balance",
        defaultValue: false,
        enabledTitle: "Balanced",
        disabledTitle: "Normal",
    },
})