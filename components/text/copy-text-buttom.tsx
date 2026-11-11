// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useLayoutEffect, useEffect } from "react"

// Hook that fetches an SVG file URL and returns its markup as a string.
// Replaces hardcoded fill/stroke with currentColor so CSS color applies.
function useSvgContent(
    url: string | null | undefined,
    size: number
): string | null {
    const [content, setContent] = useState<string | null>(null)
    useEffect(() => {
        if (!url) {
            setContent(null)
            return
        }
        fetch(url)
            .then((r) => r.text())
            .then((text) => {
                let svg = text
                    .replace(/\bfill="(?!none\b)[^"]*"/g, 'fill="currentColor"')
                    .replace(
                        /\bstroke="(?!none\b)[^"]*"/g,
                        'stroke="currentColor"'
                    )

                svg = svg.replace(
                    /(<svg\b)([^>]*)(>)/,
                    (_, open, attrs, close) => {
                        // Extract original width/height before stripping, to derive viewBox if needed
                        const wMatch = attrs.match(/\bwidth="([^"]*)"/)
                        const hMatch = attrs.match(/\bheight="([^"]*)"/)
                        const hasViewBox = /\bviewBox="[^"]*"/.test(attrs)

                        let cleaned = attrs
                            .replace(/\s*\bwidth="[^"]*"/g, "")
                            .replace(/\s*\bheight="[^"]*"/g, "")

                        // If no viewBox exists, derive one from the original width/height
                        if (!hasViewBox && wMatch && hMatch) {
                            const w = parseFloat(wMatch[1])
                            const h = parseFloat(hMatch[1])
                            if (!isNaN(w) && !isNaN(h)) {
                                cleaned += ` viewBox="0 0 ${w} ${h}"`
                            }
                        }

                        return `${open}${cleaned} width="${size}" height="${size}"${close}`
                    }
                )

                setContent(svg)
            })
            .catch(() => setContent(null))
    }, [url, size])
    return content
}

const DEFAULT_COPY_ICON = (size, color) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
)

const DEFAULT_COPIED_ICON = (size, color) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

export default function CopyButton(props) {
    const {
        displayText,
        copyText,
        copiedText,
        textStyle,
        textColor,
        fillColor,
        border,
        borderRadius,
        hover,
        success: successStyle,
        trackingId,
        icon: iconGroup,
        padding,
        style,
    } = props

    const [copied, setCopied] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [minWidth, setMinWidth] = useState<number | undefined>(undefined)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const track = useTracking()
    const {
        customIcon,
        customCopiedIcon,
        iconSize,
        iconPosition,
        iconSpacing,
    } = iconGroup ?? {}

    // Fetch and inline custom SVG files so currentColor applies
    const customIconSvg = useSvgContent(customIcon, iconSize)
    const customCopiedIconSvg = useSvgContent(customCopiedIcon, iconSize)

    // Measure the natural width in the normal (non-copied) state and lock it as minWidth
    useLayoutEffect(() => {
        if (buttonRef.current && !copied) {
            setMinWidth(buttonRef.current.offsetWidth)
        }
    }, [displayText, textStyle, padding, iconSize, iconSpacing, customIcon])

    const handleCopy = () => {
        const text = copyText && copyText.trim() !== "" ? copyText : displayText
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            if (trackingId) track(trackingId)
            setTimeout(() => setCopied(false), 2200)
        })
    }

    // Resolve active state values
    const activeTextColor = copied
        ? successStyle.textColor
        : hovered
          ? hover.textColor
          : textColor

    const activeFill = copied
        ? successStyle.fillColor
        : hovered
          ? hover.fillColor
          : fillColor

    // ControlType.Border outputs { borderWidth, borderStyle, borderColor }
    // or per-side variants. We spread it directly as a style object.
    const activeBorder = copied
        ? successStyle.border
        : hovered
          ? hover.border
          : border

    const iconEl = (() => {
        if (copied) {
            if (customCopiedIconSvg) {
                return (
                    <span
                        style={{
                            display: "inline-flex",
                            flexShrink: 0,
                            color: activeTextColor,
                        }}
                        dangerouslySetInnerHTML={{
                            __html: customCopiedIconSvg,
                        }}
                    />
                )
            }
            return DEFAULT_COPIED_ICON(iconSize, activeTextColor)
        }
        if (customIconSvg) {
            return (
                <span
                    style={{
                        display: "inline-flex",
                        flexShrink: 0,
                        color: activeTextColor,
                    }}
                    dangerouslySetInnerHTML={{ __html: customIconSvg }}
                />
            )
        }
        return DEFAULT_COPY_ICON(iconSize, activeTextColor)
    })()

    const iconWrapper = (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
            }}
        >
            {iconEl}
        </span>
    )

    const textEl = (
        <span
            style={{
                ...textStyle,
                color: activeTextColor,
                lineHeight: 1,
                whiteSpace: "nowrap",
                flex: 1,
                transition: "color 0.18s ease",
            }}
        >
            {copied ? copiedText : displayText}
        </span>
    )

    // Inner row: icon and text sit side by side with iconSpacing as the gap
    const inner = (
        <span
            style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: iconSpacing,
                flexDirection: iconPosition === "after" ? "row" : "row-reverse",
            }}
        >
            {textEl}
            {iconWrapper}
        </span>
    )

    return (
        <button
            ref={buttonRef}
            onClick={handleCopy}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                outline: "none",
                boxSizing: "border-box",
                minWidth,
                ...activeBorder,
                background: activeFill,
                padding,
                transition:
                    "background 0.18s ease, border-color 0.18s ease, border-width 0.18s ease",
                WebkitFontSmoothing: "antialiased",
                userSelect: "none",
                ...style,
                borderRadius,
            }}
        >
            {inner}
        </button>
    )
}

CopyButton.defaultProps = {
    displayText: "Copy",
    copyText: "",
    copiedText: "Copied!",
    trackingId: "",
    textStyle: {
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: 0,
    },
    textColor: "#1a1a1a",
    fillColor: "rgb(255, 255, 255)",
    border: {
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgb(153, 153, 153)",
    },
    borderRadius: "4px",
    hover: {
        textColor: "#1a1a1a",
        fillColor: "#f5f5f5",
        border: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(0,0,0,0.3)",
        },
    },
    success: {
        textColor: "#0a7c55",
        fillColor: "#e6f7f1",
        border: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#0a7c55",
        },
    },
    icon: {
        customIcon: null,
        customCopiedIcon: null,
        iconSize: 15,
        iconPosition: "before",
        iconSpacing: 7,
    },
    padding: "12px",
}

addPropertyControls(CopyButton, {
    // Content
    displayText: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Copy",
        description: "Text shown on the button",
    },
    copyText: {
        type: ControlType.String,
        title: "Copy text",
        defaultValue: "",
        placeholder: "Defaults to label if empty",
        displayTextArea: true,
        description: "Text written to clipboard. Uses label if blank.",
    },
    copiedText: {
        type: ControlType.String,
        title: "Success label",
        defaultValue: "Copied!",
    },
    trackingId: {
        type: ControlType.TrackingId,
        title: "Tracking ID",
    },

    // Text style
    textStyle: {
        type: ControlType.Font,
        title: "Text style",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: 0,
        },
    },

    // Normal state
    textColor: {
        type: ControlType.Color,
        title: "Text & icon",
        defaultValue: "#1a1a1a",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "rgb(255, 255, 255)",
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgb(153, 153, 153)",
        },
    },
    // Hover state — grouped with ControlType.Object
    hover: {
        type: ControlType.Object,
        title: "Hover",
        icon: "interact",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text & icon",
                defaultValue: "#1a1a1a",
            },
            fillColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#f5f5f5",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "rgba(0,0,0,0.3)",
                },
            },
        },
    },

    // Copied state — grouped with ControlType.Object
    success: {
        type: ControlType.Object,
        title: "Success",
        icon: "effect",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text & icon",
                defaultValue: "#0a7c55",
            },
            fillColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#e6f7f1",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#0a7c55",
                },
            },
        },
    },

    // Icon group
    icon: {
        type: ControlType.Object,
        title: "Icon",
        icon: "boolean",
        controls: {
            customIcon: {
                type: ControlType.File,
                title: "Default icon",
                allowedFileTypes: ["svg"],
                description: "Custom SVG. Falls back to a copy icon if empty.",
            },
            customCopiedIcon: {
                type: ControlType.File,
                title: "Success icon",
                allowedFileTypes: ["svg"],
                description: "Custom SVG. Falls back to a check icon if empty.",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 15,
                min: 8,
                max: 48,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            iconPosition: {
                type: ControlType.Enum,
                title: "Position",
                defaultValue: "before",
                options: ["before", "after"],
                optionTitles: ["Before text", "After text"],
                displaySegmentedControl: true,
            },
            iconSpacing: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 7,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
        },
    },

    // Padding
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "12px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "4px",
        description:
            "Made by Hugo Marques @ [seiikudesign.com](https://seiikudesign.com?utm_source=framerComponent&utm_content=copyButton)",
    },
})
