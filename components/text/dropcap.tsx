// Dropcap component that capitalizes the first letter with configurable line height
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

interface DropcapProps {
    text: string
    lines: 2 | 3 | 4 | 5
    mainFont: any
    dropcapFont: any
    textColor: string
    dropcapColor: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Dropcap(props: DropcapProps) {
    const {
        text,
        lines,
        mainFont,
        dropcapFont,
        textColor,
        dropcapColor,
    } = props

    const { firstLetter, restOfText } = useMemo(() => {
        if (!text || text.length === 0) {
            return { firstLetter: "", restOfText: "" }
        }
        return {
            firstLetter: text.charAt(0).toUpperCase(),
            restOfText: text.slice(1)
        }
    }, [text])

    const dropcapSize = useMemo(() => {
        const baseFontSize = parseFloat(mainFont.fontSize) || 16
        const lineHeight = parseFloat(mainFont.lineHeight) || 1.3
        // Calculate the actual line height in pixels
        const lineHeightPx = baseFontSize * lineHeight
        // Dropcap should be exactly the height of the specified number of lines
        // Increased size for better visual impact
        return lineHeightPx * lines * 1.1
    }, [mainFont.fontSize, mainFont.lineHeight, lines])

    const dropcapMarginRight = useMemo(() => {
        return lines === 2 ? "4px" : "8px"
    }, [lines])

    const isFixedWidth = props?.style && props.style.width === "100%"

    if (!text || text.length === 0) {
        return (
            <div
                style={{
                    ...props.style,
                    position: "relative",
                    display: "block",
                }}
            >
                <span
                    style={{
                        float: "left",
                        fontSize: `${dropcapSize}px`,
                        lineHeight: 0.8,
                        marginTop: "4px",
                        marginRight: dropcapMarginRight,
                        color: dropcapColor,
                        fontFamily: dropcapFont.fontFamily,
                        fontWeight: dropcapFont.fontWeight,
                        fontStyle: dropcapFont.fontStyle,
                        letterSpacing: dropcapFont.letterSpacing,
                        opacity: 0.5,
                    }}
                >
                    O
                </span>
                <span
                    style={{
                        color: textColor,
                        fontSize: mainFont.fontSize,
                        fontFamily: mainFont.fontFamily,
                        fontWeight: mainFont.fontWeight,
                        fontStyle: mainFont.fontStyle,
                        lineHeight: mainFont.lineHeight,
                        letterSpacing: mainFont.letterSpacing,
                        textAlign: mainFont.textAlign,
                        opacity: 0.5,
                    }}
                >
                    nce upon a time, a bold letter in Framer grew big, proud, and stylish. Here, the mighty dropcap made every story start with flair and confidence.
                </span>
            </div>
        )
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                display: "block",
            }}
        >
            <span
                style={{
                    float: "left",
                    fontSize: `${dropcapSize}px`,
                    lineHeight: 0.8, // Adjusted for better baseline alignment
                    marginTop: "4px", // Small positive margin for cap height alignment
                    marginRight: dropcapMarginRight,
                    color: dropcapColor,
                    fontFamily: dropcapFont.fontFamily,
                    fontWeight: dropcapFont.fontWeight,
                    fontStyle: dropcapFont.fontStyle,
                    letterSpacing: dropcapFont.letterSpacing,
                }}
            >
                {firstLetter}
            </span>
            <span
                style={{
                    color: textColor,
                    fontSize: mainFont.fontSize,
                    fontFamily: mainFont.fontFamily,
                    fontWeight: mainFont.fontWeight,
                    fontStyle: mainFont.fontStyle,
                    lineHeight: mainFont.lineHeight,
                    letterSpacing: mainFont.letterSpacing,
                    textAlign: mainFont.textAlign,
                }}
            >
                {restOfText}
            </span>
        </div>
    )
}

addPropertyControls(Dropcap, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        displayTextArea: true,
    },
    lines: {
        type: ControlType.Enum,
        title: "Dropcap Lines",
        options: [2, 3],
        optionTitles: ["2 Lines", "3 Lines"],
        defaultValue: 2,
        displaySegmentedControl: true,
    },
    mainFont: {
        type: ControlType.Font,
        title: "Main Text Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    dropcapFont: {
        type: ControlType.Font,
        title: "Dropcap Font",
        defaultValue: {
            variant: "Bold",
            letterSpacing: "-0.02em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    dropcapColor: {
        type: ControlType.Color,
        title: "Dropcap Color",
        defaultValue: "#000000",
    },
})