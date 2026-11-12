// Adjustable word spacing text field
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

interface WordSpacingProps {
    value: string
    wordSpacing: number
    color: string
    font: any
    style?: CSSProperties
}

/**
 * Word Spacing
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function WordSpacing(props: WordSpacingProps) {
    const { value, wordSpacing, color, font, style } = props
    return (
        <span
            style={{
                ...style,
                color,
                wordSpacing: `${wordSpacing}px`,
                ...font,
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                display: "block",
            }}
        >
            {value}
        </span>
    )
}

addPropertyControls(WordSpacing, {
    value: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Adjust word spacing here",
    },
    wordSpacing: {
        type: ControlType.Number,
        title: "Word Spacing",
        defaultValue: 0,
        min: -10,
        max: 50,
        step: 1,
        unit: "px",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
})