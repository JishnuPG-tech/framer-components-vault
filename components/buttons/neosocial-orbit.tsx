// User instructions: Create a premium neumorphic social media navigation component with a sleek floating pill-shaped container centered on a dark background; soft inner/outer shadows, subtle highlights and glass-like surface; four icons (Instagram, X/Twitter, TikTok, Facebook) evenly spaced; smooth hover lift/glow/scale with spring micro-interactions; 8px spacing system, pixel-perfect alignment, responsive sizing, customizable colors, modern high-end.

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

type IconName = "instagram" | "x" | "tiktok" | "facebook"

type ResponsiveIcon = {
    name: IconName
    label: string
    url: string
}

type Props = {
    backgroundColor: string
    pillColor: string
    pillBorderColor: string
    iconColor: string
    glowColor: string
    hoverBgColor: string
    hoverBgOpacity: number

    widthMode: "auto" | "fill"
    pillWidth: number
    pillHeight: number

    iconButtonSize: number
    iconSize: number

    paddingX: number
    paddingY: number
    gap: number
    radius: number

    outerShadowStrength: number
    innerShadowStrength: number
    highlightStrength: number

    lift: number
    hoverScale: number
    glowBlur: number

    openInNewTab: boolean
    showBackground: boolean

    instagramUrl: string
    xUrl: string
    tiktokUrl: string
    facebookUrl: string

    style?: React.CSSProperties
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function rgba(hexOrRgba: string, alpha: number) {
    // If already rgba/hsla, return as-is (cannot reliably change alpha).
    if (/^(rgba|hsla)\(/i.test(hexOrRgba)) return hexOrRgba

    // Supports #RGB, #RRGGBB
    let hex = hexOrRgba.replace("#", "").trim()
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("")
    if (hex.length !== 6) return hexOrRgba

    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const a = clamp(alpha, 0, 1)
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

function Icon({ name, color }: { name: IconName; color: string }) {
    // 20px base icon; scales with CSS.
    const common = {
        width: "100%",
        height: "100%",
        display: "block",
    } as const

    switch (name) {
        case "instagram":
            return (
                <svg viewBox="0 0 24 24" style={common} aria-hidden="true" focusable="false">
                    <path
                        fill={color}
                        d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.75-2.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
                    />
                </svg>
            )
        case "x":
            return (
                <svg viewBox="0 0 24 24" style={common} aria-hidden="true" focusable="false">
                    <path
                        fill={color}
                        d="M18.9 2H22l-6.78 7.75L23.25 22h-6.5l-5.1-6.66L5.8 22H2.7l7.25-8.3L1 2h6.67l4.61 6.06L18.9 2Zm-1.14 18h1.72L6.74 3.9H4.9l12.86 16.1Z"
                    />
                </svg>
            )
        case "tiktok":
            return (
                <svg viewBox="0 0 24 24" style={common} aria-hidden="true" focusable="false">
                    <path
                        fill={color}
                        d="M16.7 2c.3 2.6 1.8 4.2 4.3 4.4v3.1c-1.6.1-3.1-.4-4.3-1.3v7.1c0 3.7-3 6.7-6.7 6.7S3.3 19 3.3 15.3s3-6.7 6.7-6.7c.3 0 .7 0 1 .1v3.4c-.3-.1-.7-.2-1-.2-1.8 0-3.3 1.5-3.3 3.3S8.2 18.6 10 18.6s3.4-1.4 3.4-3.5V2h3.3Z"
                    />
                </svg>
            )
        case "facebook":
            return (
                <svg viewBox="0 0 24 24" style={common} aria-hidden="true" focusable="false">
                    <path
                        fill={color}
                        d="M13.5 22v-8h2.7l.4-3H13.5V9.1c0-.9.3-1.6 1.7-1.6h1.4V4.8c-.7-.1-1.6-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.6V11H7.1v3h2.5v8h3.9Z"
                    />
                </svg>
            )
        default:
            return null
    }
}

function makeIcons(props: Props): ResponsiveIcon[] {
    return [
        { name: "instagram", label: "Instagram", url: props.instagramUrl },
        { name: "x", label: "X", url: props.xUrl },
        { name: "tiktok", label: "TikTok", url: props.tiktokUrl },
        { name: "facebook", label: "Facebook", url: props.facebookUrl },
    ]
}

/**
 * Premium Neumorphic Social Nav
 *
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 240
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PremiumNeumorphicSocialNav(props: Props) {
    const {
        backgroundColor,
        pillColor,
        pillBorderColor,
        iconColor,
        glowColor,
        hoverBgColor,
        hoverBgOpacity,
        widthMode,
        pillWidth,
        pillHeight,
        iconButtonSize,
        iconSize,
        paddingX,
        paddingY,
        gap,
        radius,
        outerShadowStrength,
        innerShadowStrength,
        highlightStrength,
        lift,
        hoverScale,
        glowBlur,
        openInNewTab,
        showBackground,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const icons = React.useMemo(() => makeIcons(props), [
        props.instagramUrl,
        props.xUrl,
        props.tiktokUrl,
        props.facebookUrl,
    ])

    const target = openInNewTab ? "_blank" : undefined
    const rel = openInNewTab ? "noopener noreferrer" : undefined

    const pillOuterShadow = React.useMemo(() => {
        // Neumorphic: one darker shadow + one lighter highlight.
        const s = clamp(outerShadowStrength, 0, 1)
        const dark = rgba("#000000", 0.45 * s)
        const light = rgba("#FFFFFF", 0.14 * s)
        // offsets are in an 8px system, but kept subtle for premium feel.
        return `0px 14px 36px ${dark}, 0px 1px 0px ${rgba("#FFFFFF", 0.08 * s)}, 0px -10px 28px ${light}`
    }, [outerShadowStrength])

    const pillInnerShadows = React.useMemo(() => {
        const s = clamp(innerShadowStrength, 0, 1)
        const innerDark = rgba("#000000", 0.35 * s)
        const innerLight = rgba("#FFFFFF", 0.12 * s)
        return `inset 0px 1px 0px ${rgba("#FFFFFF", 0.12 * s)}, inset 0px -1px 0px ${rgba(
            "#000000",
            0.28 * s
        )}, inset 0px 12px 24px ${rgba("#000000", 0.28 * s)}, inset 0px -12px 24px ${rgba(
            "#FFFFFF",
            0.06 * s
        )}`
    }, [innerShadowStrength])

    const edgeHighlights = React.useMemo(() => {
        const s = clamp(highlightStrength, 0, 1)
        return {
            border: `1px solid ${rgba(pillBorderColor, 0.55 * s)}`,
            backgroundImage: `linear-gradient(180deg, ${rgba("#FFFFFF", 0.12 * s)} 0%, rgba(255,255,255,0) 42%, ${rgba(
                "#000000",
                0.22 * s
            )} 100%)`,
        }
    }, [highlightStrength, pillBorderColor])

    const containerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: showBackground ? backgroundColor : "transparent",
        overflow: "hidden",
        ...style,
    }

    const pillStyle: React.CSSProperties = {
        position: "relative",
        height: pillHeight,
        width: widthMode === "fill" ? "min(92%, 720px)" : pillWidth,
        borderRadius: radius,
        background: rgba(pillColor, 0.72),
        boxShadow: `${pillOuterShadow}, ${pillInnerShadows}`,
        WebkitBackdropFilter: "blur(14px)",
        backdropFilter: "blur(14px)",
        ...edgeHighlights,
        overflow: "hidden",
    }

    const contentStyle: React.CSSProperties = {
        position: "relative",
        height: "100%",
        width: "100%",
        padding: `${paddingY}px ${paddingX}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap,
    }

    const iconButtonBase: React.CSSProperties = {
        appearance: "none",
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        width: iconButtonSize,
        height: iconButtonSize,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
    }

    const iconWrapStyle: React.CSSProperties = {
        width: iconSize,
        height: iconSize,
    }

    return (
        <div style={containerStyle} aria-label="Social navigation" role="navigation">
            <div style={pillStyle}>
                {/* subtle edge glow */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: -1,
                        borderRadius: radius,
                        background:
                            "radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%)",
                        opacity: clamp(highlightStrength, 0, 1),
                        pointerEvents: "none",
                        mixBlendMode: "screen",
                    }}
                />

                <div style={contentStyle}>
                    {icons.map((item) => {
                        const node = (
                            <a
                                href={item.url}
                                aria-label={item.label}
                                target={target}
                                rel={rel}
                                style={{
                                    textDecoration: "none",
                                    color: "inherit",
                                    display: "inline-flex",
                                }}
                            >
                                {isStatic ? (
                                    <span style={iconButtonBase} role="link" aria-label={item.label}>
                                        <span style={iconWrapStyle}>
                                            <Icon name={item.name} color={iconColor} />
                                        </span>
                                    </span>
                                ) : (
                                    <motion.span
                                        style={iconButtonBase}
                                        role="link"
                                        aria-label={item.label}
                                        initial={false}
                                        whileHover={{
                                            y: -lift,
                                            scale: hoverScale,
                                            boxShadow: `0px 0px ${glowBlur}px ${rgba(glowColor, 0.55)}, 0px 10px 24px ${rgba(
                                                "#000000",
                                                0.35
                                            )}`,
                                            backgroundColor: rgba(hoverBgColor, hoverBgOpacity),
                                        }}
                                        whileTap={{ scale: Math.max(0.92, hoverScale - 0.08), y: -Math.max(0, lift - 1) }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 520,
                                            damping: 34,
                                            mass: 0.7,
                                        }}
                                    >
                                        <span style={iconWrapStyle}>
                                            <Icon name={item.name} color={iconColor} />
                                        </span>
                                    </motion.span>
                                )}
                            </a>
                        )

                        return (
                            <div
                                key={item.name}
                                style={{
                                    position: "relative",
                                    flex: "1 1 0",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                {node}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(PremiumNeumorphicSocialNav, {
    showBackground: {
        type: ControlType.Boolean,
        title: "Show BG",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    pillColor: {
        type: ControlType.Color,
        title: "Pill",
        defaultValue: "#111111",
    },
    pillBorderColor: {
        type: ControlType.Color,
        title: "Edge Tint",
        defaultValue: "#FFFFFF",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "#CCCCCC",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#FFFFFF",
    },
    hoverBgColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#FFFFFF",
    },
    hoverBgOpacity: {
        type: ControlType.Number,
        title: "Hover Op",
        defaultValue: 0.06,
        min: 0,
        max: 0.3,
        step: 0.01,
    },

    widthMode: {
        type: ControlType.Enum,
        title: "Width",
        options: ["auto", "fill"],
        optionTitles: ["Fixed", "Responsive"],
        defaultValue: "fill",
        displaySegmentedControl: true,
    },
    pillWidth: {
        type: ControlType.Number,
        title: "Pill W",
        defaultValue: 440,
        min: 240,
        max: 900,
        step: 8,
        unit: "px",
        hidden: ({ widthMode }) => widthMode !== "auto",
    },
    pillHeight: {
        type: ControlType.Number,
        title: "Pill H",
        defaultValue: 72,
        min: 56,
        max: 104,
        step: 8,
        unit: "px",
    },
    iconButtonSize: {
        type: ControlType.Number,
        title: "Btn Size",
        defaultValue: 32,
        min: 24,
        max: 56,
        step: 8,
        unit: "px",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 18,
        min: 12,
        max: 28,
        step: 1,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Pad X",
        defaultValue: 24,
        min: 8,
        max: 64,
        step: 8,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Pad Y",
        defaultValue: 16,
        min: 8,
        max: 40,
        step: 8,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 24,
        min: 8,
        max: 64,
        step: 8,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 16,
        max: 999,
        step: 1,
        unit: "px",
    },

    outerShadowStrength: {
        type: ControlType.Number,
        title: "Outer Sh",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    innerShadowStrength: {
        type: ControlType.Number,
        title: "Inner Sh",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    highlightStrength: {
        type: ControlType.Number,
        title: "Highlight",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },

    lift: {
        type: ControlType.Number,
        title: "Lift",
        defaultValue: 4,
        min: 0,
        max: 16,
        step: 1,
        unit: "px",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1.06,
        min: 1,
        max: 1.25,
        step: 0.01,
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },

    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    instagramUrl: {
        type: ControlType.Link,
        title: "Instagram",
        defaultValue: "https://instagram.com",
    },
    xUrl: {
        type: ControlType.Link,
        title: "X",
        defaultValue: "https://x.com",
    },
    tiktokUrl: {
        type: ControlType.Link,
        title: "TikTok",
        defaultValue: "https://tiktok.com",
    },
    facebookUrl: {
        type: ControlType.Link,
        title: "Facebook",
        defaultValue: "https://facebook.com",
    },
})
