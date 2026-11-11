import { useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    prefix?: string
    suffix?: string
    font: any
    textColor: string
    style?: React.CSSProperties
    useDateRange: boolean
    startYear?: number
    name?: string
    statement?: string
    symbolType:
        | "copyright"
        | "registered"
        | "trademark"
        | "servicemark"
        | "none"
        | "custom"
    showLink: boolean
    linkText?: string
    linkUrl?: string
    linkStyle: "underline" | "bold" | "italic" | "none"
    openInNewTab: boolean
    alignment: "left" | "center" | "right"
    blockLayout: boolean
}

/**
 * Copyright Notice
 *
 * Auto-updating footer copyright component with customizable symbol, date range, and optional link.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function CopyrightNotice({
    prefix,
    suffix,
    font,
    textColor,
    style,
    useDateRange,
    startYear,
    name,
    statement,
    symbolType,
    showLink,
    linkText,
    linkUrl,
    linkStyle,
    openInNewTab,
    alignment,
    blockLayout,
}: Props) {
    const [currentYear, setCurrentYear] = useState<string>("")

    useEffect(() => {
        if (typeof window !== "undefined") {
            const year = new Date().getFullYear().toString()
            startTransition(() => setCurrentYear(year))
        }
    }, [])

    const yearText =
        useDateRange && startYear ? `${startYear}–${currentYear}` : currentYear

    const getSymbol = () => {
        switch (symbolType) {
            case "copyright":
                return "©"
            case "registered":
                return "®"
            case "trademark":
                return "™"
            case "servicemark":
                return "℠"
            case "none":
                return ""
            default:
                return ""
        }
    }

    return (
        <div
            style={{
                display: blockLayout ? "flex" : "inline-flex",
                justifyContent:
                    alignment === "center"
                        ? "center"
                        : alignment === "right"
                          ? "flex-end"
                          : "flex-start",
                alignItems: "center",
                color: textColor,
                width: blockLayout ? "100%" : "auto",
                ...font,
                ...style,
            }}
            aria-label={`Copyright ${yearText} ${name || ""}`}
        >
            <div
                style={{
                    display: "inline",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    flexShrink: 1,
                }}
            >
                <span>
                    {symbolType === "custom" ? prefix : getSymbol()} {yearText}{" "}
                    {name} {statement} {suffix}
                </span>

                {showLink && (
                    <a
                        href={linkUrl}
                        target={openInNewTab ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        style={{
                            color: textColor,
                            textDecoration:
                                linkStyle === "underline"
                                    ? "underline"
                                    : "none",
                            fontWeight:
                                linkStyle === "bold" ? "bold" : "inherit",
                            fontStyle:
                                linkStyle === "italic" ? "italic" : "normal",
                            marginLeft: "4px",
                            ...font,
                        }}
                    >
                        {linkText}
                    </a>
                )}
            </div>
        </div>
    )
}

// Framer Property Controls
addPropertyControls(CopyrightNotice, {
    symbolType: {
        type: ControlType.Enum,
        title: "Symbol",
        defaultValue: "copyright",
        options: [
            "copyright",
            "registered",
            "trademark",
            "servicemark",
            "none",
            "custom",
        ],
        optionTitles: ["©", "®", "™", "℠", "None", "Custom"],
    },
    prefix: {
        type: ControlType.String,
        title: "Custom Prefix",
        defaultValue: "",
        hidden: ({ symbolType }) => symbolType !== "custom",
    },
    useDateRange: {
        type: ControlType.Boolean,
        title: "Date Range",
        defaultValue: false,
    },
    startYear: {
        type: ControlType.Number,
        title: "Start Year",
        defaultValue: 2024,
        min: 1900,
        max: new Date().getFullYear(),
        step: 1,
        displayStepper: true,
        hidden: ({ useDateRange }) => !useDateRange,
    },
    name: {
        type: ControlType.String,
        title: "Name",
        placeholder: "Your Site or Company",
        defaultValue: "",
    },
    statement: {
        type: ControlType.String,
        title: "Statement",
        placeholder: "All rights reserved.",
        defaultValue: "All rights reserved.",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "1.5em",
        },
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
    },
    blockLayout: {
        type: ControlType.Boolean,
        title: "Fill Width",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Enable if using Fill or placing inside layout slot",
    },
    showLink: {
        type: ControlType.Boolean,
        title: "Link",
        defaultValue: false,
    },
    linkText: {
        type: ControlType.String,
        title: "Link Text",
        placeholder: "Privacy Policy",
        defaultValue: "",
        hidden: ({ showLink }) => !showLink,
    },
    linkUrl: {
        type: ControlType.Link,
        title: "Link URL",
        placeholder: "https://example.com",
        defaultValue: "",
        hidden: ({ showLink }) => !showLink,
    },
    linkStyle: {
        type: ControlType.Enum,
        title: "Link Style",
        defaultValue: "underline",
        options: ["underline", "bold", "italic", "none"],
        optionTitles: ["Underline", "Bold", "Italic", "None"],
        hidden: ({ showLink }) => !showLink,
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        hidden: ({ showLink }) => !showLink,
    },
})
