// Responsive Call Button component for Framer
// Features: tel: link, icon, label, customizable color, radius, icon size, padding, font
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, type CSSProperties, useState } from "react"

interface CallButtonProps {
    phoneNumber: string
    label: string
    showIcon: boolean
    font: any
    fontColor: string
    bgColor: string
    radius: number
    padding: {
        top: number
        bottom: number
        left: number
        right: number
    }
    iconSize: number
    iconPosition: "left" | "right"
    border?: {
        borderWidth?: number
        borderColor?: string
        borderStyle?: "solid" | "dashed" | "dotted" | "double"
    }
    selectIcon?: "phone" | "call" | "support"
    customIconFile?: string
    customIconImage?: string
    iconRadius?: number
    style?: CSSProperties
}

/**
 * Responsive Call Button
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CallButton(props: CallButtonProps) {
    const {
        phoneNumber,
        label,
        showIcon,
        font,
        fontColor,
        bgColor,
        radius,
        padding = { top: 12, bottom: 12, left: 24, right: 24 },
        iconSize,
        iconPosition,
        border = { borderWidth: 0, borderColor: "#0099FF", borderStyle: "solid" },
        selectIcon = "phone",
        customIconFile,
        customIconImage,
        iconRadius,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const focusStyle = isFocused
        ? {
              outline: `2px solid ${border.borderColor || '#222'}`,
              boxShadow: `0 0 0 4px rgba(0,153,255,0.18)`
          }
        : {
              outline: "none"
          }

    const telHref = useMemo(() => {
        const num = phoneNumber.replace(/[^+\d]/g, "")
        return `tel:${num || ""}`
    }, [phoneNumber])

    const iconSvg = useMemo(() => {
        const borderRadius = props.iconRadius !== undefined ? props.iconRadius : iconSize / 2
        if (props.customIconFile && props.customIconFile.trim()) {
            return (
                <img src={props.customIconFile} width={iconSize} height={iconSize} style={{ display: "block", borderRadius }} alt="icon" />
            )
        }
        if (props.customIconImage && props.customIconImage.trim()) {
            return (
                <img src={props.customIconImage} width={iconSize} height={iconSize} style={{ display: "block", borderRadius }} alt="icon" />
            )
        }
        // Default icons
        // Feather phone icon as default
        if (selectIcon === "phone") {
            return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ display: "block", borderRadius }} aria-hidden="true">
                    <rect width="24" height="24" fill="none" />
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3.09 4.18 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.72c.13 1.13.37 2.23.72 3.28a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.59 6.59l1.27-1.27a2 2 0 0 1 2.11-.45c1.05.35 2.15.59 3.28.72A2 2 0 0 1 22 16.92z" stroke={fontColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            )
        }
        if (selectIcon === "call") {
            // Feather phone-call icon
            return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ display: "block", borderRadius }} aria-hidden="true">
                    <rect width="24" height="24" fill="none" />
                    <path d="M15.05 5.05a7 7 0 0 1 3.95 3.95m0 0a7 7 0 0 1 0 6.01m0 0a7 7 0 0 1-3.95 3.95m-2.12-2.12a5 5 0 0 0 2.83-2.83m0 0a5 5 0 0 0 0-4.24m0 0a5 5 0 0 0-2.83-2.83m-2.12 2.12a3 3 0 0 1 1.41 1.41m0 0a3 3 0 0 1 0 2.12m0 0a3 3 0 0 1-1.41 1.41m-2.12-2.12a1 1 0 0 0 .29.71m0 0a1 1 0 0 0 .71.29m0 0a1 1 0 0 0 .71-.29m0 0a1 1 0 0 0 .29-.71" stroke={fontColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            )
        }
        if (selectIcon === "support") {
            // Feather info icon
            return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ display: "block", borderRadius }} aria-hidden="true">
                    <rect width="24" height="24" fill="none" />
                    <circle cx="12" cy="12" r="10" stroke={fontColor} strokeWidth="2" fill="none" />
                    <line x1="12" y1="16" x2="12" y2="12" stroke={fontColor} strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="8" r="1" fill={fontColor} />
                </svg>
            )
        }
        return null
    }, [iconSize, fontColor, selectIcon, props.customIconFile, props.customIconImage, props.iconRadius])

    const content = (
        <>
            {showIcon && iconPosition === "left" && (
                <span style={{ display: "flex", alignItems: "center", marginRight: label ? 8 : 0 }}>
                    {iconSvg}
                </span>
            )}
            {label && (
                <span
                    style={{
                        color: fontColor,
                        ...font,
                        fontFamily: font?.fontFamily,
                        fontSize: font?.fontSize,
                        fontWeight: font?.fontWeight,
                        letterSpacing: font?.letterSpacing,
                        lineHeight: font?.lineHeight,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                    }}
                >
                    {label}
                </span>
            )}
            {showIcon && iconPosition === "right" && (
                <span style={{ display: "flex", alignItems: "center", marginLeft: label ? 8 : 0 }}>
                    {iconSvg}
                </span>
            )}
        </>
    )

    return (
        <a
            href={telHref}
            style={{
                ...style,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: isPressed
                    ? darken(bgColor, 0.08)
                    : isHovered
                    ? darken(bgColor, 0.04)
                    : bgColor,
                border: border.borderWidth && border.borderWidth > 0 ? `${border.borderWidth}px ${border.borderStyle || "solid"} ${border.borderColor || "#0099FF"}` : "none",
                borderRadius: radius,
                padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
                minHeight: 44,
                minWidth: 44,
                cursor: "pointer",
                textDecoration: "none",
                boxShadow: isPressed
                    ? "0 2px 8px rgba(0,0,0,0.10)"
                    : isHovered
                    ? "0 2px 8px rgba(0,0,0,0.12)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                transition:
                    "background 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s cubic-bezier(.4,0,.2,1), border-color 0.18s cubic-bezier(.4,0,.2,1), outline-color 0.18s cubic-bezier(.4,0,.2,1)",
                gap: 0,
                userSelect: "none",
                outline: isFocused ? `2px solid ${border.borderColor || '#222'}` : focusStyle.outline,
                outlineOffset: 2,
                ...focusStyle,
            }}
            aria-label={label || phoneNumber}
            rel="noopener noreferrer"
            tabIndex={0}
            role="button"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                setIsPressed(false)
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            {content}
        </a>
    )
}

// Utility: darken color by percent (0.0-1.0)
function darken(color: string, amount: number) {
    // Accepts hex or rgb(a)
    let c = color.trim()
    if (c.startsWith("#")) {
        let hex = c.replace("#", "")
        if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("")
        const num = parseInt(hex, 16)
        let r = (num >> 16) & 0xff
        let g = (num >> 8) & 0xff
        let b = num & 0xff
        r = Math.max(0, Math.min(255, Math.round(r * (1 - amount))))
        g = Math.max(0, Math.min(255, Math.round(g * (1 - amount))))
        b = Math.max(0, Math.min(255, Math.round(b * (1 - amount))))
        return `rgb(${r},${g},${b})`
    } else if (c.startsWith("rgb")) {
        const vals = c.match(/\d+/g)
        if (!vals) return c
        let [r, g, b] = vals.map(Number)
        r = Math.max(0, Math.min(255, Math.round(r * (1 - amount))))
        g = Math.max(0, Math.min(255, Math.round(g * (1 - amount))))
        b = Math.max(0, Math.min(255, Math.round(b * (1 - amount))))
        return `rgb(${r},${g},${b})`
    }
    return c
}

addPropertyControls(CallButton, {
    phoneNumber: {
        type: ControlType.String,
        title: "Phone Number",
        defaultValue: "+1234567890",
        placeholder: "+1234567890",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Call Now",
        placeholder: "Call Now",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: ({ showIcon }) => !showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 20,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
        hidden: ({ showIcon }) => !showIcon,
    },
    iconRadius: {
        type: ControlType.Number,
        title: "Icon Radius",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ showIcon }) => !showIcon,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    fontColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0099FF",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Object,
        title: "Padding",
        controls: {
            top: {
                type: ControlType.Number,
                title: "Top",
                defaultValue: 12,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
            bottom: {
                type: ControlType.Number,
                title: "Bottom",
                defaultValue: 12,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
            left: {
                type: ControlType.Number,
                title: "Left",
                defaultValue: 24,
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
            },
            right: {
                type: ControlType.Number,
                title: "Right",
                defaultValue: 24,
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            top: 12,
            bottom: 12,
            left: 24,
            right: 24,
        },
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            borderWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 0,
                min: 0,
                max: 8,
                step: 1,
                unit: "px",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#0099FF",
            },
            borderStyle: {
                type: ControlType.Enum,
                title: "Style",
                options: ["solid", "dashed", "dotted", "double"],
                optionTitles: ["Solid", "Dashed", "Dotted", "Double"],
                defaultValue: "solid",
            },
        },
        defaultValue: {
            borderWidth: 0,
            borderColor: "#0099FF",
            borderStyle: "solid",
        },
    },
    selectIcon: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["phone", "call", "support"],
        optionTitles: ["Phone", "Call", "Support"],
        defaultValue: "phone",
        hidden: ({ showIcon, customIconFile, customIconImage }) => !showIcon || !!(customIconFile || customIconImage),
    },
    customIconFile: {
        type: ControlType.File,
        allowedFileTypes: ["svg"],
        title: "Custom SVG File",
        hidden: ({ showIcon, customIconImage }) => !showIcon || !!customIconImage,
    },
    customIconImage: {
        type: ControlType.File,
        allowedFileTypes: ["png", "jpg", "jpeg"],
        title: "Custom Image (PNG/JPG)",
        hidden: ({ showIcon, customIconFile }) => !showIcon || !!customIconFile,
    },
})
