// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import React, { useRef, useState, type CSSProperties } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type IconType =
    | "arrow-right"
    | "arrow-up-right"
    | "chevron-right"
    | "plus"
    | "sparkle"
type IconAnimation = "slide" | "bounce" | "rotate" | "none"

interface StateStyle {
    backgroundColor: string
    textColor: string
    scale: number
}

interface Props {
    // Content
    label: string
    ariaLabel?: string

    // Link
    link?: any
    linkTarget?: "_self" | "_blank"

    // State
    disabled?: boolean

    // Typography
    font: CSSProperties

    // Appearance
    backgroundColor: string
    textColor: string
    borderRadius: number
    padding: string

    // Border
    borderWidth: number
    borderColor: string
    borderStyle: "solid" | "dashed" | "dotted" | "double" | "none"

    // Shadow
    boxShadow: string

    // Grouped interaction states
    hover: StateStyle
    pressed: StateStyle

    // Icon
    showIcon: boolean
    icon: IconType
    iconSize: number
    iconGap: number
    iconAnimation: IconAnimation

    // Magnet / spring physics
    magnetStrength: number
    stiffness: number
    damping: number

    // Events
    onClick?: () => void

    style?: CSSProperties
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS: Record<IconType, React.ReactElement> = {
    "arrow-right": (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    ),
    "arrow-up-right": (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 17L17 7M7 7h10v10" />
        </svg>
    ),
    "chevron-right": (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    ),
    plus: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    ),
    sparkle: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
        </svg>
    ),
}

function getIconHoverStyle(animation: IconAnimation, icon: IconType) {
    if (animation === "none") return {}
    if (animation === "bounce") return { scale: 1.3 }
    if (animation === "rotate")
        return { rotate: icon === "arrow-up-right" ? -30 : 90 }
    if (animation === "slide") {
        if (icon === "arrow-up-right") return { x: 3, y: -3 }
        if (icon === "sparkle") return { y: -3 }
        return { x: 5 }
    }
    return {}
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MagneticButton
 *
 * A fully accessible magnetic button with spring physics, 3D rotation,
 * hover/press colour states, icon with animated hover, link support,
 * and a disabled state. The x/y translation is applied directly to the
 * button element so Framer's selection box always matches the visual.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MagneticButton(props: Props) {
    const {
        label,
        ariaLabel,
        link,
        linkTarget = "_self",
        disabled = false,
        font,
        backgroundColor,
        textColor,
        borderRadius,
        padding,
        borderWidth,
        borderColor,
        borderStyle,
        boxShadow,
        hover,
        pressed,
        showIcon,
        icon,
        iconSize,
        iconGap,
        iconAnimation,
        magnetStrength,
        stiffness,
        damping,
        onClick,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null)

    const [isHovered, setIsHovered] = useState(false)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { stiffness, damping }
    const x = useSpring(mouseX, springConfig)
    const y = useSpring(mouseY, springConfig)

    const rotateX = useTransform(y, [-magnetStrength, magnetStrength], [8, -8])
    const rotateY = useTransform(x, [-magnetStrength, magnetStrength], [-8, 8])

    const handleMouseMove = (e: React.MouseEvent) => {
        if (disabled || isCanvas) return
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        mouseX.set(e.clientX - (rect.x + rect.width / 2))
        mouseY.set(e.clientY - (rect.y + rect.height / 2))
    }

    const handleMouseLeave = () => {
        mouseX.set(0)
        mouseY.set(0)
        setIsHovered(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick?.()
        }
    }

    const iconHoverStyle = getIconHoverStyle(iconAnimation, icon)

    const Component = link ? motion.a : motion.button

    const linkProps = link
        ? {
              href: link,
              target: linkTarget,
              rel: linkTarget === "_blank" ? "noopener noreferrer" : undefined,
          }
        : { disabled }

    return (
        // Wrapper receives Framer's frame styles and provides padding so the
        // magnetic movement never clips against the component boundary.
        <div
            style={{
                ...style,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: magnetStrength,
            }}
        >
            <Component
                ref={ref as any}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onHoverStart={() =>
                    !disabled && !isCanvas && setIsHovered(true)
                }
                onHoverEnd={() => setIsHovered(false)}
                onClick={() => !disabled && onClick?.()}
                onKeyDown={handleKeyDown}
                aria-label={ariaLabel || label}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                {...linkProps}
                style={{
                    x,
                    y,
                    rotateX: isCanvas ? 0 : rotateX,
                    rotateY: isCanvas ? 0 : rotateY,
                    backgroundColor,
                    color: textColor,
                    borderRadius,
                    padding,
                    borderWidth,
                    borderColor,
                    borderStyle,
                    boxShadow,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    outline: "none",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: showIcon ? iconGap : 0,
                    width: "max-content",
                    border: borderStyle === "none" ? "none" : undefined,
                    ...font,
                }}
                whileHover={
                    disabled || isCanvas
                        ? {}
                        : {
                              scale: hover.scale,
                              backgroundColor: hover.backgroundColor,
                              color: hover.textColor,
                          }
                }
                whileTap={
                    disabled || isCanvas
                        ? {}
                        : {
                              scale: pressed.scale,
                              backgroundColor: pressed.backgroundColor,
                              color: pressed.textColor,
                          }
                }
                whileFocus={{
                    boxShadow: `0 0 0 3px ${textColor}40`,
                }}
                transition={{
                    type: "spring",
                    stiffness,
                    damping,
                }}
            >
                <span style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
                    {label}
                </span>

                {showIcon && (
                    <motion.span
                        animate={
                            isHovered && !isCanvas
                                ? iconHoverStyle
                                : { x: 0, y: 0, scale: 1, rotate: 0 }
                        }
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                        }}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: iconSize,
                            height: iconSize,
                            flexShrink: 0,
                            pointerEvents: "none",
                        }}
                    >
                        {ICONS[icon]}
                    </motion.span>
                )}
            </Component>
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

MagneticButton.defaultProps = {
    label: "Get started",
    ariaLabel: "",
    disabled: false,
    font: {
        fontSize: "15px",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: "1em",
        fontFamily: "inherit",
    },
    backgroundColor: "#0f0f0f",
    textColor: "#ffffff",
    borderRadius: 100,
    padding: "16px 32px",
    borderWidth: 0,
    borderColor: "#0f0f0f",
    borderStyle: "none",
    boxShadow: "none",
    hover: {
        backgroundColor: "#333333",
        textColor: "#ffffff",
        scale: 1.08,
    },
    pressed: {
        backgroundColor: "#000000",
        textColor: "#ffffff",
        scale: 0.95,
    },
    showIcon: true,
    icon: "arrow-right",
    iconSize: 16,
    iconGap: 8,
    iconAnimation: "slide",
    magnetStrength: 20,
    stiffness: 150,
    damping: 15,
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(MagneticButton, {
    // ── Content ───────────────────────────────────────────────────────────────
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get started",
        placeholder: "Button text",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    linkTarget: {
        type: ControlType.Enum,
        title: "Target",
        defaultValue: "_self",
        options: ["_self", "_blank"],
        optionTitles: ["Same Tab", "New Tab"],
        displaySegmentedControl: true,
        hidden: (props: Props) => !props.link,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "",
        placeholder: "Accessible label",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    // ── Appearance ────────────────────────────────────────────────────────────
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0f0f0f",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 100,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "16px 32px",
    },

    // ── Border ────────────────────────────────────────────────────────────────
    borderStyle: {
        type: ControlType.Enum,
        title: "Border",
        defaultValue: "none",
        options: ["none", "solid", "dashed", "dotted", "double"],
        optionTitles: ["None", "Solid", "Dashed", "Dotted", "Double"],
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#0f0f0f",
        hidden: (props: Props) => props.borderStyle === "none",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1.5,
        min: 0.5,
        max: 8,
        step: 0.5,
        unit: "px",
        hidden: (props: Props) => props.borderStyle === "none",
    },

    // ── Shadow ────────────────────────────────────────────────────────────────
    boxShadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
    },

    // ── Hover state ───────────────────────────────────────────────────────────
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#333333",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#ffffff",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 1.08,
                min: 0.8,
                max: 1.5,
                step: 0.01,
            },
        },
    },

    // ── Press state ───────────────────────────────────────────────────────────
    pressed: {
        type: ControlType.Object,
        title: "Pressed",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000000",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#ffffff",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 0.95,
                min: 0.8,
                max: 1.2,
                step: 0.01,
            },
        },
    },

    // ── Typography ────────────────────────────────────────────────────────────
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "SemiBold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },

    // ── Icon ──────────────────────────────────────────────────────────────────
    showIcon: {
        type: ControlType.Boolean,
        title: "Icon",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    icon: {
        type: ControlType.Enum,
        title: "Style",
        defaultValue: "arrow-right",
        options: [
            "arrow-right",
            "arrow-up-right",
            "chevron-right",
            "plus",
            "sparkle",
        ],
        optionTitles: [
            "Arrow Right",
            "Arrow Up-Right",
            "Chevron",
            "Plus",
            "Sparkle",
        ],
        hidden: (props: Props) => !props.showIcon,
    },
    iconAnimation: {
        type: ControlType.Enum,
        title: "On Hover",
        defaultValue: "slide",
        options: ["slide", "bounce", "rotate", "none"],
        optionTitles: ["Slide", "Bounce", "Rotate", "None"],
        hidden: (props: Props) => !props.showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 16,
        min: 10,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (props: Props) => !props.showIcon,
    },
    iconGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        hidden: (props: Props) => !props.showIcon,
    },

    // ── Magnet / Spring ───────────────────────────────────────────────────────
    magnetStrength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 1,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 150,
        min: 50,
        max: 500,
        step: 10,
        description: "Higher = snappier return.",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 15,
        min: 5,
        max: 50,
        step: 1,
        description: "Higher = less bounce.",
    },

    // ── Events ────────────────────────────────────────────────────────────────
    onClick: {
        type: ControlType.EventHandler,
    },
})
