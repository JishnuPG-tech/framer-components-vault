// Advanced Close X Component
// Optimized quick component for closing overlays, modals, drawers, and lightboxes
// Designer-friendly, fully accessible, theme-aware with polished micro-interactions
// Author: madhoundes - https://contra.com/madhoundes

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useReducedMotion } from "framer-motion"
import {
    useEffect,
    useRef,
    useState,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"

type Size = "S" | "M" | "L"
type Variant = "subtle" | "ghost" | "solid"
type IconWeight = "light" | "regular" | "bold"
type CornerPlacement = "top-right" | "top-left" | "bottom-right" | "bottom-left"

interface Offset {
    x: number
    y: number
}

interface CloseButtonProps {
    size: Size
    variant: Variant
    ariaLabel: string
    closeOnEscape: boolean
    hotkey: string
    iconWeight: IconWeight
    cornerPlacement: CornerPlacement
    offsetX: number
    offsetY: number
    showTooltip: boolean
    zIndex: number
    disabled: boolean
    onClick?: () => void
    onClose?: () => void
    onCloseStart?: () => void
    onCloseEnd?: () => void
    accentColor: string
    iconColor: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CloseButton(props: CloseButtonProps) {
    const {
        size = "M",
        variant = "subtle",
        ariaLabel = "Close",
        closeOnEscape = true,
        hotkey = "Esc",
        iconWeight = "regular",
        cornerPlacement = "top-right",
        offsetX = 12,
        offsetY = 12,
        showTooltip = true,
        zIndex = 9999,
        disabled = false,
        onClick,
        onClose,
        onCloseStart,
        onCloseEnd,
        accentColor = "#FFD800",
        iconColor = "#FFFFFF",
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [showTooltipState, setShowTooltipState] = useState(false)
    const [isRTL, setIsRTL] = useState(false)

    const buttonRef = useRef<HTMLButtonElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const tooltipTimeoutRef = useRef<number | null>(null)
    const shouldReduceMotion = useReducedMotion()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Detect RTL
    useEffect(() => {
        if (typeof window !== "undefined") {
            const dir = window.getComputedStyle(
                document.documentElement
            ).direction
            startTransition(() => setIsRTL(dir === "rtl"))
        }
    }, [])

    // Size configurations
    const sizeConfig = {
        S: {
            box: 32,
            icon: 14,
            stroke:
                iconWeight === "light" ? 1.5 : iconWeight === "bold" ? 2.5 : 2,
        },
        M: {
            box: 40,
            icon: 18,
            stroke:
                iconWeight === "light" ? 1.5 : iconWeight === "bold" ? 2.5 : 2,
        },
        L: {
            box: 48,
            icon: 22,
            stroke:
                iconWeight === "light" ? 1.5 : iconWeight === "bold" ? 2.5 : 2,
        },
    }

    const config = sizeConfig[size]

    // Calculate position based on corner placement and RTL
    const getPositionStyles = (): CSSProperties => {
        const safeAreaPadding = 12
        const totalOffsetX = offsetX + safeAreaPadding
        const totalOffsetY = offsetY + safeAreaPadding

        let placement = cornerPlacement
        if (isRTL) {
            if (placement === "top-right") placement = "top-left"
            else if (placement === "top-left") placement = "top-right"
            else if (placement === "bottom-right") placement = "bottom-left"
            else if (placement === "bottom-left") placement = "bottom-right"
        }

        const positions: Record<CornerPlacement, CSSProperties> = {
            "top-right": { top: totalOffsetY, right: totalOffsetX },
            "top-left": { top: totalOffsetY, left: totalOffsetX },
            "bottom-right": { bottom: totalOffsetY, right: totalOffsetX },
            "bottom-left": { bottom: totalOffsetY, left: totalOffsetX },
        }

        return positions[placement]
    }

    // Handle close action
    const handleClose = useCallback(() => {
        if (disabled || isClosing) return

        startTransition(() => setIsClosing(true))
        onCloseStart?.()

        if (onClick) {
            onClick()
        }

        if (onClose) {
            onClose()
        }

        setTimeout(
            () => {
                onCloseEnd?.()
                startTransition(() => setIsClosing(false))
            },
            shouldReduceMotion ? 0 : 240
        )
    }, [
        disabled,
        isClosing,
        onClick,
        onClose,
        onCloseStart,
        onCloseEnd,
        shouldReduceMotion,
    ])

    // Keyboard handling
    useEffect(() => {
        if (!closeOnEscape || disabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                handleClose()
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }
    }, [closeOnEscape, disabled, handleClose])

    // Tooltip hover delay
    useEffect(() => {
        if (
            isHovered &&
            showTooltip &&
            !disabled &&
            typeof window !== "undefined" &&
            window.matchMedia("(hover: hover)").matches
        ) {
            tooltipTimeoutRef.current = window.setTimeout(() => {
                startTransition(() => setShowTooltipState(true))
            }, 300)
        } else {
            if (tooltipTimeoutRef.current) {
                window.clearTimeout(tooltipTimeoutRef.current)
            }
            startTransition(() => setShowTooltipState(false))
        }

        return () => {
            if (tooltipTimeoutRef.current) {
                window.clearTimeout(tooltipTimeoutRef.current)
            }
        }
    }, [isHovered, showTooltip, disabled])

    // Focus management
    useEffect(() => {
        if (typeof document !== "undefined") {
            previousFocusRef.current = document.activeElement as HTMLElement
        }

        return () => {
            if (
                previousFocusRef.current &&
                typeof previousFocusRef.current.focus === "function"
            ) {
                previousFocusRef.current.focus()
            }
        }
    }, [])

    // Tooltip positioning
    const getTooltipPosition = (): CSSProperties => {
        const placement = isRTL
            ? cornerPlacement.includes("right")
                ? cornerPlacement.replace("right", "left")
                : cornerPlacement.replace("left", "right")
            : cornerPlacement

        if (placement.includes("top")) {
            return { top: "100%", marginTop: 8 }
        }
        return { bottom: "100%", marginBottom: 8 }
    }

    // Variant styles
    const getVariantStyles = () => {
        const baseStyles: CSSProperties = {
            borderRadius: "50%",
            transition: shouldReduceMotion ? "none" : "all 120ms ease-in-out",
        }

        if (variant === "subtle") {
            return {
                ...baseStyles,
                backgroundColor: isPressed
                    ? "rgba(255, 255, 255, 0.15)"
                    : isHovered
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent",
            }
        }

        if (variant === "ghost") {
            return {
                ...baseStyles,
                backgroundColor: isPressed
                    ? "rgba(255, 255, 255, 0.2)"
                    : isHovered
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(255, 255, 255, 0.08)",
            }
        }

        // solid
        return {
            ...baseStyles,
            backgroundColor: isPressed
                ? accentColor
                : isHovered
                  ? accentColor
                  : accentColor,
            opacity: isPressed ? 0.9 : isHovered ? 0.95 : 1,
        }
    }

    const iconStrokeColor = variant === "solid" ? "#000000" : iconColor

    // Animation variants
    const containerVariants = {
        initial: shouldReduceMotion
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.95, rotate: 45 },
    }

    const buttonVariants = {
        default: { scale: 1, rotate: 0 },
        hover: shouldReduceMotion
            ? { scale: 1, rotate: 0 }
            : { scale: 1.05, rotate: 0 },
        press: shouldReduceMotion
            ? { scale: 1, rotate: 0 }
            : { scale: 0.88, rotate: 90 },
    }

    return (
        <motion.div
            initial="initial"
            animate={isClosing ? "exit" : "animate"}
            variants={containerVariants}
            transition={
                shouldReduceMotion
                    ? { duration: 0 }
                    : {
                          duration: isClosing ? 0.24 : 0.16,
                          ease: isClosing ? "easeOut" : "easeOut",
                      }
            }
            style={{
                position: isCanvas ? "absolute" : "fixed",
                ...getPositionStyles(),
                zIndex,
                pointerEvents: disabled ? "none" : "auto",
            }}
        >
            <motion.button
                ref={buttonRef}
                type="button"
                aria-label={ariaLabel}
                disabled={disabled}
                variants={buttonVariants}
                animate={isPressed ? "press" : isHovered ? "hover" : "default"}
                transition={
                    shouldReduceMotion
                        ? { duration: 0 }
                        : {
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                              mass: 0.5,
                          }
                }
                onClick={handleClose}
                onMouseEnter={() => {
                    if (!disabled) {
                        startTransition(() => {
                            setIsHovered(true)
                        })
                    }
                }}
                onMouseLeave={() => {
                    startTransition(() => {
                        setIsHovered(false)
                        setShowTooltipState(false)
                    })
                }}
                onMouseDown={() => {
                    if (!disabled) {
                        startTransition(() => {
                            setIsPressed(true)
                            setShowTooltipState(false)
                        })
                    }
                }}
                onMouseUp={() => startTransition(() => setIsPressed(false))}
                onFocus={() =>
                    !disabled && startTransition(() => setIsFocused(true))
                }
                onBlur={() => startTransition(() => setIsFocused(false))}
                style={{
                    width: config.box,
                    height: config.box,
                    minWidth: 44,
                    minHeight: 44,
                    padding: 0,
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.4 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    outline: "none",
                    ...getVariantStyles(),
                    boxShadow:
                        isFocused && !disabled
                            ? `0 0 0 2px ${variant === "solid" ? "#000000" : accentColor}`
                            : isPressed && !shouldReduceMotion
                              ? "0 1px 3px rgba(0, 0, 0, 0.2)"
                              : "none",
                }}
            >
                <svg
                    width={config.icon}
                    height={config.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={iconStrokeColor}
                    strokeWidth={config.stroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transition: shouldReduceMotion
                            ? "none"
                            : "stroke-width 120ms ease-in-out",
                    }}
                >
                    <title>{ariaLabel}</title>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>

                {showTooltip && showTooltipState && !disabled && isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                        style={{
                            position: "absolute",
                            ...getTooltipPosition(),
                            backgroundColor: "rgba(0, 0, 0, 0.9)",
                            color: "#FFFFFF",
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                            zIndex: 1,
                        }}
                    >
                        {ariaLabel} {hotkey && `(${hotkey})`}
                    </motion.div>
                )}
            </motion.button>
        </motion.div>
    )
}

addPropertyControls(CloseButton, {
    onClose: {
        type: ControlType.EventHandler,
        title: "On Close",
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["S", "M", "L"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "M",
        displaySegmentedControl: true,
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["subtle", "ghost", "solid"],
        optionTitles: ["Subtle", "Ghost", "Solid"],
        defaultValue: "subtle",
        displaySegmentedControl: true,
    },
    cornerPlacement: {
        type: ControlType.Enum,
        title: "Placement",
        options: ["top-right", "top-left", "bottom-right", "bottom-left"],
        optionTitles: ["Top Right", "Top Left", "Bottom Right", "Bottom Left"],
        defaultValue: "top-right",
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 12,
        min: -300,
        max: 300,
        step: 1,
        unit: "px",
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 12,
        min: -300,
        max: 300,
        step: 1,
        unit: "px",
    },
    iconWeight: {
        type: ControlType.Enum,
        title: "Icon Weight",
        options: ["light", "regular", "bold"],
        optionTitles: ["Light", "Regular", "Bold"],
        defaultValue: "regular",
        displaySegmentedControl: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#FFD800",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFFFFF",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Close",
    },
    hotkey: {
        type: ControlType.String,
        title: "Hotkey Display",
        defaultValue: "Esc",
    },
    closeOnEscape: {
        type: ControlType.Boolean,
        title: "Close on Escape",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    showTooltip: {
        type: ControlType.Boolean,
        title: "Show Tooltip",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 9999,
        min: 0,
        max: 99999,
        step: 1,
    },
})

CloseButton.displayName = "CloseButton Overlay"
