// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useCallback, useRef, useEffect } from "react"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 40
 */
export default function CopyButton({
    textToCopy = "Hello, World!",
    idleText = "Copy",
    copiedText = "Copied",
    errorText = "Failed",
    showIcon = true,
    size = "medium",
    style = "filled",
    idleBg = "#262626",
    idleTextColor = "#ffffff",
    copiedBg = "#22c55e",
    copiedTextColor = "#ffffff",
    errorBg = "#ef4444",
    borderRadius = 8,
    resetDelay = 2000,
    enableHaptics = true,
}: {
    textToCopy?: string
    idleText?: string
    copiedText?: string
    errorText?: string
    showIcon?: boolean
    size?: "small" | "medium" | "large"
    style?: "filled" | "outline" | "ghost"
    idleBg?: string
    idleTextColor?: string
    copiedBg?: string
    copiedTextColor?: string
    errorBg?: string
    borderRadius?: number
    resetDelay?: number
    enableHaptics?: boolean
}) {
    // FIX #1: Use status instead of boolean — supports error state
    const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")
    const [pressed, setPressed] = useState(false)

    // FIX #2: Store timeout ID to prevent race conditions
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const sizes = {
        small: { px: 10, py: 6, font: 12, icon: 14, gap: 5 },
        medium: { px: 14, py: 8, font: 14, icon: 16, gap: 6 },
        large: { px: 18, py: 10, font: 16, icon: 18, gap: 7 },
    }

    const s = sizes[size]

    // FIX #3: Clipboard fallback for older browsers / restricted contexts
    const copyToClipboard = async (text: string): Promise<boolean> => {
        // Try modern API first
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text)
                return true
            } catch {
                // Fall through to legacy method
            }
        }

        // Legacy fallback: textarea + execCommand
        try {
            const textarea = document.createElement("textarea")
            textarea.value = text
            textarea.style.position = "fixed"
            textarea.style.left = "-9999px"
            textarea.style.top = "-9999px"
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select()
            const success = document.execCommand("copy")
            document.body.removeChild(textarea)
            return success
        } catch {
            return false
        }
    }

    const handleCopy = useCallback(async () => {
        // FIX #2: Clear any existing timeout before starting new one
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        const success = await copyToClipboard(textToCopy)

        if (success) {
            setStatus("copied")

            // FIX #4: Haptic feedback on mobile
            if (enableHaptics && navigator.vibrate) {
                navigator.vibrate(10)
            }
        } else {
            setStatus("error")
        }

        // Reset after delay
        timeoutRef.current = setTimeout(() => {
            setStatus("idle")
            timeoutRef.current = null
        }, resetDelay)
    }, [textToCopy, resetDelay, enableHaptics])

    // FIX #5: Consolidated style calculations (cleaner than 3 separate functions)
    const getStyles = () => {
        const isActive = status !== "idle"
        const isError = status === "error"
        const activeColor = isError ? errorBg : copiedBg

        if (style === "ghost") {
            return {
                bg: "transparent",
                border: "none",
                color: isActive ? activeColor : idleBg,
            }
        }
        if (style === "outline") {
            return {
                bg: "transparent",
                border: `1px solid ${isActive ? activeColor : idleBg}`,
                color: isActive ? activeColor : idleBg,
            }
        }
        // filled
        return {
            bg: isActive ? activeColor : idleBg,
            border: "none",
            color: isActive ? copiedTextColor : idleTextColor,
        }
    }

    const styles = getStyles()

    // Icon based on status
    const renderIcon = () => {
        if (!showIcon) return null

        const iconSize = s.icon
        const strokeColor = styles.color

        if (status === "copied") {
            // Checkmark
            return (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )
        }

        if (status === "error") {
            // X mark
            return (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            )
        }

        // Copy icon (idle)
        return (
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke={strokeColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
        )
    }

    // Get current label
    const getLabel = () => {
        if (status === "copied") return copiedText
        if (status === "error") return errorText
        return idleText
    }

    // Find longest label for fixed-width (prevents layout shift)
    const longestLabel = [idleText, copiedText, errorText].reduce((a, b) =>
        a.length >= b.length ? a : b
    )

    return (
        <button
            type="button" // FIX #6: Prevent form submission
            onClick={handleCopy}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            // FIX #7: Keyboard support for pressed state
            onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                    setPressed(true)
                }
            }}
            onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") {
                    setPressed(false)
                }
            }}
            // FIX #8: Accessibility — announce status changes
            aria-label={`Copy to clipboard: ${textToCopy}`}
            aria-live="polite"
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: s.gap,
                padding: `${s.py}px ${s.px}px`,
                fontSize: s.font,
                fontWeight: 500,
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: styles.bg,
                color: styles.color,
                border: styles.border,
                borderRadius,
                cursor: "pointer",
                transition: "all 0.15s ease",
                transform: pressed ? "scale(0.95)" : "scale(1)",
                // FIX #9: Visible focus ring (don't just remove outline)
                outline: "none",
                boxShadow: "none",
                WebkitTapHighlightColor: "transparent",
            }}
            // FIX #9 continued: focus-visible via CSS-in-JS workaround
            onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px ${
                    status === "error"
                        ? errorBg
                        : status === "copied"
                          ? copiedBg
                          : idleBg
                }40`
            }}
            onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none"
            }}
        >
            {renderIcon()}

            {/* FIX #10: Ghost text prevents layout shift */}
            <span
                style={{
                    position: "relative",
                    display: "inline-block",
                }}
            >
                {/* Invisible longest label sets width */}
                <span
                    style={{
                        visibility: "hidden",
                        display: "block",
                    }}
                    aria-hidden="true"
                >
                    {longestLabel}
                </span>

                {/* Actual visible label, absolutely positioned */}
                <span
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        textAlign: "center",
                    }}
                >
                    {getLabel()}
                </span>
            </span>
        </button>
    )
}

addPropertyControls(CopyButton, {
    textToCopy: {
        title: "Text to Copy",
        type: ControlType.String,
        defaultValue: "Hello, World!",
        displayTextArea: true,
    },
    idleText: {
        title: "Idle Label",
        type: ControlType.String,
        defaultValue: "Copy",
    },
    copiedText: {
        title: "Copied Label",
        type: ControlType.String,
        defaultValue: "Copied",
    },
    errorText: {
        title: "Error Label",
        type: ControlType.String,
        defaultValue: "Failed",
    },
    showIcon: {
        title: "Show Icon",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    size: {
        title: "Size",
        type: ControlType.Enum,
        options: ["small", "medium", "large"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "medium",
    },
    style: {
        title: "Style",
        type: ControlType.Enum,
        options: ["filled", "outline", "ghost"],
        optionTitles: ["Filled", "Outline", "Ghost"],
        defaultValue: "filled",
    },
    idleBg: {
        title: "Idle Color",
        type: ControlType.Color,
        defaultValue: "#262626",
    },
    idleTextColor: {
        title: "Idle Text",
        type: ControlType.Color,
        defaultValue: "#ffffff",
        hidden: (props) => props.style !== "filled",
    },
    copiedBg: {
        title: "Copied Color",
        type: ControlType.Color,
        defaultValue: "#22c55e",
    },
    copiedTextColor: {
        title: "Copied Text",
        type: ControlType.Color,
        defaultValue: "#ffffff",
        hidden: (props) => props.style !== "filled",
    },
    errorBg: {
        title: "Error Color",
        type: ControlType.Color,
        defaultValue: "#ef4444",
    },
    borderRadius: {
        title: "Radius",
        type: ControlType.Number,
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 1,
    },
    resetDelay: {
        title: "Reset Delay",
        type: ControlType.Number,
        defaultValue: 2000,
        min: 500,
        max: 5000,
        step: 100,
        unit: "ms",
    },
    enableHaptics: {
        title: "Haptics",
        type: ControlType.Boolean,
        defaultValue: true,
        description: "Vibrate on mobile when copied",
    },
})
