// a simple copyright text that automatically updates the current year, property control on the right
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

type CopyrightTextProps = {
    prefix: string
    owner: string
    suffix: string
    color: string
    font: any
    align: "left" | "center" | "right"
    useCopyrightSymbol: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CopyrightText(props: CopyrightTextProps) {
    const {
        prefix,
        owner,
        suffix,
        color,
        font,
        align,
        useCopyrightSymbol,
        style,
    } = props

    const year = useMemo(() => {
        if (typeof Date === "undefined") return "2026"
        return String(new Date().getFullYear())
    }, [])

    const text = useMemo(() => {
        const parts = [
            prefix?.trim(),
            useCopyrightSymbol ? "©" : "(c)",
            year,
            owner?.trim(),
            suffix?.trim(),
        ].filter(Boolean)
        return parts.join(" ").replace(/\s+/g, " ").trim()
    }, [prefix, owner, suffix, useCopyrightSymbol, year])

    return (
        <span
            style={{
                position: "relative",
                display: "inline-block",
                width: "max-content",
                minWidth: "max-content",
                color,
                textAlign: align,
                ...font,
                ...style,
            }}
        >
            {text}
        </span>
    )
}

addPropertyControls(CopyrightText, {
    owner: {
        type: ControlType.String,
        title: "Owner",
        defaultValue: "Your Company",
        placeholder: "Company name…",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    useCopyrightSymbol: {
        type: ControlType.Boolean,
        title: "Symbol",
        defaultValue: true,
        enabledTitle: "©",
        disabledTitle: "(c)",
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "Copyright",
        placeholder: "Optional…",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "All rights reserved.",
        placeholder: "Optional…",
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
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
            textAlign: "right",
        },
    },
})