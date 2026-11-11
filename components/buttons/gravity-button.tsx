// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    CSSProperties,
} from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

// ============================================================================
// TYPES
// ============================================================================

interface ColorsConfig {
    background: string
    border: string
    text: string
    glow: string
}

interface EffectsConfig {
    magneticStrength: number
    shimmerSpeed: number
    textReveal: boolean
}

interface SizingConfig {
    paddingX: number
    paddingY: number
    borderRadius: number
    fontSize: number
}

interface Props {
    text: string
    link: string
    openInNewTab: boolean
    preset: "aurora" | "ember" | "frost" | "midnight" | "custom"
    icon:
        | "none"
        | "arrow-right"
        | "arrow-up-right"
        | "chevron-right"
        | "plus"
        | "sparkle"
        | "lightning"
        | "star"
    iconPosition: "left" | "right"
    colors: ColorsConfig
    effects: EffectsConfig
    sizing: SizingConfig
    fontFamily?: { fontFamily?: string; fontWeight?: number | string }
    style?: CSSProperties
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRESETS: Record<
    string,
    {
        bg: string
        border1: string
        border2: string
        text: string
        glow: string
    }
> = {
    aurora: {
        bg: "rgba(139, 92, 246, 0.15)",
        border1: "#8B5CF6",
        border2: "#06B6D4",
        text: "#FFFFFF",
        glow: "rgba(139, 92, 246, 0.4)",
    },
    ember: {
        bg: "rgba(249, 115, 22, 0.15)",
        border1: "#F97316",
        border2: "#EF4444",
        text: "#FFFFFF",
        glow: "rgba(249, 115, 22, 0.4)",
    },
    frost: {
        bg: "rgba(56, 189, 248, 0.12)",
        border1: "#38BDF8",
        border2: "#E0F2FE",
        text: "#FFFFFF",
        glow: "rgba(56, 189, 248, 0.35)",
    },
    midnight: {
        bg: "rgba(99, 102, 241, 0.12)",
        border1: "#6366F1",
        border2: "#312E81",
        text: "#FFFFFF",
        glow: "rgba(99, 102, 241, 0.3)",
    },
}

// ============================================================================
// ICONS
// ============================================================================

function IconSVG({
    name,
    size = 16,
    color = "currentColor",
}: {
    name: string
    size?: number
    color?: string
}) {
    const s = {
        width: size,
        height: size,
        display: "block" as const,
        flexShrink: 0,
    }
    switch (name) {
        case "arrow-right":
            return (
                <svg
                    style={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                </svg>
            )
        case "arrow-up-right":
            return (
                <svg
                    style={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                </svg>
            )
        case "chevron-right":
            return (
                <svg
                    style={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            )
        case "plus":
            return (
                <svg
                    style={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            )
        case "sparkle":
            return (
                <svg style={s} viewBox="0 0 24 24" fill={color}>
                    <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
                </svg>
            )
        case "lightning":
            return (
                <svg style={s} viewBox="0 0 24 24" fill={color}>
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                </svg>
            )
        case "star":
            return (
                <svg style={s} viewBox="0 0 24 24" fill={color}>
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
            )
        default:
            return null
    }
}

// ============================================================================
// ROLLING TEXT COMPONENT
// ============================================================================

function RollingText({
    text,
    isHovered,
    enabled,
    fontSize,
}: {
    text: string
    isHovered: boolean
    enabled: boolean
    fontSize: number
}) {
    if (!enabled) {
        return <span>{text}</span>
    }

    const chars = text.split("")
    const lineHeight = fontSize * 1.4

    return (
        <span
            style={{
                display: "inline-flex",
                overflow: "hidden",
                height: lineHeight,
                lineHeight: `${lineHeight}px`,
            }}
        >
            {chars.map((char, i) => (
                <span
                    key={`${i}-${char}`}
                    style={{
                        display: "inline-block",
                        position: "relative" as const,
                        width: char === " " ? fontSize * 0.3 : "auto",
                        transition: `transform 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.025}s`,
                        transform: isHovered
                            ? `translateY(-${lineHeight}px)`
                            : "translateY(0)",
                    }}
                >
                    <span
                        style={{
                            display: "block",
                            height: lineHeight,
                        }}
                    >
                        {char === " " ? "\u00A0" : char}
                    </span>
                    <span
                        style={{
                            display: "block",
                            height: lineHeight,
                        }}
                    >
                        {char === " " ? "\u00A0" : char}
                    </span>
                </span>
            ))}
        </span>
    )
}

// ============================================================================
// CURSOR-FOLLOW LIGHT
// ============================================================================

function CursorLight({
    glowColor,
    isHovered,
}: {
    glowColor: string
    isHovered: boolean
}) {
    return (
        <div
            data-cursor-light="true"
            style={{
                position: "absolute",
                inset: 0,
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.4s ease",
                background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 60%)`,
                pointerEvents: "none",
            }}
        />
    )
}

// ============================================================================
// CANVAS PREVIEW
// ============================================================================

function CanvasPreview({
    style,
    text,
    preset,
    colors,
    sizing,
    fontFamily,
    fontWeight,
    icon,
    iconPosition,
}: {
    style?: CSSProperties
    text: string
    preset: string
    colors: ColorsConfig
    sizing: SizingConfig
    fontFamily: string
    fontWeight: number | string
    icon: string
    iconPosition: string
}) {
    const p = preset === "custom" ? null : PRESETS[preset]
    const borderColor1 = p ? p.border1 : colors.border || "#8B5CF6"
    const borderColor2 = p ? p.border2 : colors.glow || "#06B6D4"
    const bgColor = p ? p.bg : colors.background || "rgba(139, 92, 246, 0.15)"
    const textColor = p ? p.text : colors.text || "#FFFFFF"
    const borderRadius = sizing.borderRadius ?? 12

    return (
        <div
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                borderRadius,
                overflow: "hidden",
                isolation: "isolate",
            }}
        >
            {/* Gradient border */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius,
                    padding: 1.5,
                    background: `linear-gradient(135deg, ${borderColor1}, ${borderColor2}, ${borderColor1})`,
                    WebkitMask:
                        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                }}
            />
            {/* Background */}
            <div
                style={{
                    position: "absolute",
                    inset: 1.5,
                    borderRadius: borderRadius - 1.5,
                    background: bgColor,
                    backdropFilter: "blur(20px)",
                }}
            />
            {/* Content */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily,
                    fontWeight: fontWeight || 500,
                    fontSize: sizing.fontSize ?? 15,
                    color: textColor,
                    letterSpacing: "0.01em",
                    padding: `${sizing.paddingY ?? 14}px ${sizing.paddingX ?? 28}px`,
                }}
            >
                {icon !== "none" && iconPosition === "left" && (
                    <IconSVG
                        name={icon}
                        size={(sizing.fontSize ?? 15) + 1}
                        color={textColor}
                    />
                )}
                {text}
                {icon !== "none" && iconPosition === "right" && (
                    <IconSVG
                        name={icon}
                        size={(sizing.fontSize ?? 15) + 1}
                        color={textColor}
                    />
                )}
            </div>
        </div>
    )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 52
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GravityButton(props: Props) {
    const {
        text = "Get Started",
        link = "",
        openInNewTab = false,
        preset = "aurora",
        icon = "none",
        iconPosition = "right",
        colors = {} as ColorsConfig,
        effects = {} as EffectsConfig,
        sizing = {} as SizingConfig,
        fontFamily: fontFamilyProp,
        style,
    } = props

    // ── Resolve preset colors ──
    const p = preset === "custom" ? null : PRESETS[preset]
    const bgColor = p ? p.bg : colors.background || "rgba(139, 92, 246, 0.15)"
    const borderColor1 = p ? p.border1 : colors.border || "#8B5CF6"
    const borderColor2 = p ? p.border2 : colors.glow || "#06B6D4"
    const textColor = p ? p.text : colors.text || "#FFFFFF"
    const glowColor = p ? p.glow : colors.glow || "rgba(139, 92, 246, 0.4)"

    // ── Extract effects ──
    const magneticStrength = effects.magneticStrength ?? 0.3
    const shimmerSpeed = effects.shimmerSpeed ?? 3
    const textRevealEnabled = effects.textReveal ?? true

    // ── Extract sizing ──
    const paddingX = sizing.paddingX ?? 28
    const paddingY = sizing.paddingY ?? 14
    const borderRadius = sizing.borderRadius ?? 12
    const fontSize = sizing.fontSize ?? 15

    // ── Font ──
    const fontFamily = fontFamilyProp?.fontFamily
        ? `${fontFamilyProp.fontFamily}, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
        : "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"
    const fontWeight = fontFamilyProp?.fontWeight || 500

    // ── State ──
    const [isHovered, setIsHovered] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // ── Magnetic motion values ──
    const magnetX = useMotionValue(0)
    const magnetY = useMotionValue(0)
    const springX = useSpring(magnetX, {
        stiffness: 150,
        damping: 15,
        mass: 0.5,
    })
    const springY = useSpring(magnetY, {
        stiffness: 150,
        damping: 15,
        mass: 0.5,
    })

    // ── Unique IDs for CSS keyframes ──
    const shimmerKeyframes = useMemo(
        () => `shimmer_${Math.random().toString(36).substr(2, 9)}`,
        []
    )
    const glowPulseKeyframes = useMemo(
        () => `glowpulse_${Math.random().toString(36).substr(2, 9)}`,
        []
    )

    // ── Mouse tracking for magnetic effect + cursor-follow light ──
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const dx = e.clientX - cx
            const dy = e.clientY - cy
            magnetX.set(dx * magneticStrength)
            magnetY.set(dy * magneticStrength)

            // Update cursor-follow light via DOM
            const lightEl = el.querySelector(
                "[data-cursor-light]"
            ) as HTMLElement
            if (lightEl) {
                const px = ((e.clientX - rect.left) / rect.width) * 100
                const py = ((e.clientY - rect.top) / rect.height) * 100
                lightEl.style.background = `radial-gradient(circle at ${px}% ${py}%, ${glowColor} 0%, transparent 60%)`
            }
        },
        [magneticStrength, magnetX, magnetY, glowColor]
    )

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)
        magnetX.set(0)
        magnetY.set(0)
    }, [magnetX, magnetY])

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true)
    }, [])

    // ── Click handler (link navigation) ──
    const handleClick = useCallback(() => {
        if (link) {
            if (openInNewTab) {
                window.open(link, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = link
            }
        }
    }, [link, openInNewTab])

    // ── Canvas preview ──
    if (RenderTarget.current() === RenderTarget.canvas) {
        return (
            <CanvasPreview
                style={style}
                text={text}
                preset={preset}
                colors={colors}
                sizing={sizing}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                icon={icon}
                iconPosition={iconPosition}
            />
        )
    }

    // ── CSS keyframes ──
    const shimmerDuration = Math.max(1, 6 - shimmerSpeed)
    const styleTag = `
        @keyframes ${shimmerKeyframes} {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes ${glowPulseKeyframes} {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
    `

    return (
        <motion.div
            ref={containerRef}
            style={{
                ...style,
                x: springX,
                y: springY,
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius,
                overflow: "visible",
                isolation: "isolate",
                zIndex: 0,
                WebkitTapHighlightColor: "transparent",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
        >
            <style>{styleTag}</style>

            {/* ── Glow layer ── */}
            <div
                style={{
                    position: "absolute",
                    inset: -8,
                    borderRadius: borderRadius + 8,
                    background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
                    opacity: isHovered ? 0.8 : 0.3,
                    transition: "opacity 0.4s ease",
                    pointerEvents: "none",
                    animation: `${glowPulseKeyframes} ${shimmerDuration * 1.5}s ease-in-out infinite`,
                    filter: "blur(8px)",
                    zIndex: -2,
                }}
            />

            {/* ── Spinning gradient border ── */}
            <div
                style={{
                    position: "absolute",
                    inset: -1.5,
                    borderRadius: borderRadius + 1.5,
                    overflow: "hidden",
                    pointerEvents: "none",
                    zIndex: -1,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: "-50%",
                        background: `conic-gradient(from 0deg, ${borderColor1}, ${borderColor2}, ${borderColor1}, transparent, ${borderColor1})`,
                        animation: `${shimmerKeyframes} ${shimmerDuration}s linear infinite`,
                        willChange: "transform",
                    }}
                />
            </div>

            {/* ── Inner background ── */}
            <div
                style={{
                    position: "absolute",
                    inset: 1.5,
                    borderRadius: borderRadius - 1.5,
                    overflow: "hidden",
                    pointerEvents: "none",
                    zIndex: -1,
                }}
            >
                {/* Base background */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: bgColor,
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                    }}
                />
                {/* Cursor-follow light */}
                <CursorLight glowColor={glowColor} isHovered={isHovered} />
            </div>

            {/* ── Content ── */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: `${paddingY}px ${paddingX}px`,
                    fontFamily,
                    fontWeight: fontWeight as any,
                    fontSize,
                    color: textColor,
                    letterSpacing: "0.01em",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
            >
                {icon !== "none" && iconPosition === "left" && (
                    <motion.span
                        style={{ display: "flex" }}
                        animate={{ x: isHovered ? -2 : 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                        }}
                    >
                        <IconSVG
                            name={icon}
                            size={fontSize + 1}
                            color={textColor}
                        />
                    </motion.span>
                )}
                <RollingText
                    text={text}
                    isHovered={isHovered}
                    enabled={textRevealEnabled}
                    fontSize={fontSize}
                />
                {icon !== "none" && iconPosition === "right" && (
                    <motion.span
                        style={{ display: "flex" }}
                        animate={{ x: isHovered ? 3 : 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                        }}
                    >
                        <IconSVG
                            name={icon}
                            size={fontSize + 1}
                            color={textColor}
                        />
                    </motion.span>
                )}
            </div>
        </motion.div>
    )
}

// ============================================================================
// DEFAULT PROPS
// ============================================================================

GravityButton.defaultProps = {
    text: "Get Started",
    link: "",
    openInNewTab: false,
    preset: "aurora",
    icon: "arrow-right",
    iconPosition: "right",
    colors: {
        background: "rgba(139, 92, 246, 0.15)",
        border: "#8B5CF6",
        text: "#FFFFFF",
        glow: "rgba(139, 92, 246, 0.4)",
    },
    effects: {
        magneticStrength: 0.3,
        shimmerSpeed: 3,
        textReveal: true,
    },
    sizing: {
        paddingX: 28,
        paddingY: 14,
        borderRadius: 12,
        fontSize: 15,
    },
}

// ============================================================================
// PROPERTY CONTROLS
// ============================================================================

addPropertyControls(GravityButton, {
    // ═════════════════════════════════════════════════════════════════════════
    // ESSENTIAL (Always Visible)
    // ═════════════════════════════════════════════════════════════════════════
    text: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get Started",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props: any) => !props.link,
    },
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["aurora", "ember", "frost", "midnight", "custom"],
        optionTitles: ["Aurora", "Ember", "Frost", "Midnight", "Custom"],
        defaultValue: "aurora",
        description: " ",
    },
    icon: {
        type: ControlType.Enum,
        title: "Icon",
        options: [
            "none",
            "arrow-right",
            "arrow-up-right",
            "chevron-right",
            "plus",
            "sparkle",
            "lightning",
            "star",
        ],
        optionTitles: [
            "None",
            "Arrow Right",
            "Arrow Diagonal",
            "Chevron",
            "Plus",
            "Sparkle",
            "Lightning",
            "Star",
        ],
        defaultValue: "arrow-right",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
        hidden: (props: any) => props.icon === "none",
        description: " ",
    },

    // ═════════════════════════════════════════════════════════════════════════
    // CUSTOM COLORS (Only for Custom preset)
    // ═════════════════════════════════════════════════════════════════════════
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(139, 92, 246, 0.15)",
            },
            border: {
                type: ControlType.Color,
                title: "Border Start",
                defaultValue: "#8B5CF6",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
            },
            glow: {
                type: ControlType.Color,
                title: "Glow / Border End",
                defaultValue: "rgba(139, 92, 246, 0.4)",
            },
        },
        hidden: (props: any) => props.preset !== "custom",
    },

    // ═════════════════════════════════════════════════════════════════════════
    // EFFECTS
    // ═════════════════════════════════════════════════════════════════════════
    effects: {
        type: ControlType.Object,
        title: "Effects",
        icon: "effect",
        controls: {
            magneticStrength: {
                type: ControlType.Number,
                title: "Magnetic Pull",
                min: 0,
                max: 0.8,
                step: 0.05,
                defaultValue: 0.3,
                description: "How strongly the button follows the cursor",
            },
            shimmerSpeed: {
                type: ControlType.Number,
                title: "Shimmer Speed",
                min: 1,
                max: 5,
                step: 0.5,
                defaultValue: 3,
                description: "Speed of border gradient rotation",
            },
            textReveal: {
                type: ControlType.Boolean,
                title: "Text Reveal",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Rolling text reveal on hover",
            },
        },
    },

    // ═════════════════════════════════════════════════════════════════════════
    // SIZING
    // ═════════════════════════════════════════════════════════════════════════
    sizing: {
        type: ControlType.Object,
        title: "Sizing",
        icon: "object",
        controls: {
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                min: 12,
                max: 60,
                step: 2,
                defaultValue: 28,
                unit: "px",
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                min: 6,
                max: 30,
                step: 2,
                defaultValue: 14,
                unit: "px",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 50,
                step: 1,
                defaultValue: 12,
                unit: "px",
            },
            fontSize: {
                type: ControlType.Number,
                title: "Font Size",
                min: 11,
                max: 24,
                step: 1,
                defaultValue: 15,
                unit: "px",
            },
        },
        description: " ",
    },

    // ═════════════════════════════════════════════════════════════════════════
    // FONT
    // ═════════════════════════════════════════════════════════════════════════
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
})
