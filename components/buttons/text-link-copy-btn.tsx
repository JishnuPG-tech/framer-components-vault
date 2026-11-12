import {
    useState,
    useCallback,
    useEffect,
    useRef,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface CopyButtonProps {
    text: string
    buttonText: string
    copiedText: string
    backgroundColor: string
    textColor: string
    copiedBackgroundColor: string
    copiedTextColor: string
    borderRadius: number
    buttonFont: CSSProperties
    copiedFont: CSSProperties
    style?: CSSProperties
    hapticFeedback?: boolean
    successDuration?: number
    disabled?: boolean
    ariaLabel?: string
    showIcon?: boolean
    iconSize?: number
    iconGap?: number
    iconPosition?: "left" | "right"
    reduceMotion?: "auto" | "always" | "never"
    onCopy?: () => void
}

type Phase = "idle" | "checkmark" | "copied"

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */

const TIMINGS = {
    CHECKMARK: 720,
    MIN_COPIED_VISIBLE: 800,
    DEFAULT_SUCCESS: 2200,
} as const

// Effective minimum for successDuration (was letting "Copied!" flash for 80ms)
const MIN_SUCCESS_TOTAL = TIMINGS.CHECKMARK + TIMINGS.MIN_COPIED_VISIBLE // 1520ms

const STYLE_ID = "framer-copy-button-keyframes-v3"

const EASING = {
    spring: "cubic-bezier(.34, 1.56, .64, 1)",
    smoothOut: "cubic-bezier(.16, 1, .3, 1)",
    smoothInOut: "cubic-bezier(.65, 0, .35, 1)",
} as const

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

const withAlpha = (color: string, alpha: number): string => {
    if (!color || typeof color !== "string") return "transparent"

    const hex6 = color.match(/^#([0-9a-fA-F]{6})$/)
    if (hex6) {
        const a = Math.round(alpha * 255)
            .toString(16)
            .padStart(2, "0")
        return `#${hex6[1]}${a}`
    }
    const hex3 = color.match(/^#([0-9a-fA-F]{3})$/)
    if (hex3) {
        const [r, g, b] = hex3[1].split("")
        const a = Math.round(alpha * 255)
            .toString(16)
            .padStart(2, "0")
        return `#${r}${r}${g}${g}${b}${b}${a}`
    }
    const rgb = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgb) {
        return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})`
    }
    if (
        typeof CSS !== "undefined" &&
        typeof CSS.supports === "function" &&
        CSS.supports("color", "color-mix(in srgb, red 50%, transparent)")
    ) {
        return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
    }
    return color
}

const triggerHaptics = (type: "success" | "error", enabled: boolean): void => {
    if (!enabled || typeof navigator === "undefined") return
    if (typeof navigator.vibrate !== "function") return
    try {
        navigator.vibrate(type === "success" ? 18 : [14, 45, 14])
    } catch {
        /* no-op */
    }
}

const fallbackCopy = (value: string): boolean => {
    try {
        const activeEl = document.activeElement as HTMLElement | null
        const ta = document.createElement("textarea")
        ta.value = value
        ta.setAttribute("readonly", "")
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        ta.style.pointerEvents = "none"
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(ta)
        // Restore focus so the button doesn't lose keyboard focus
        if (activeEl && typeof activeEl.focus === "function") {
            activeEl.focus({ preventScroll: true })
        }
        return ok
    } catch {
        return false
    }
}

/* ═══════════════════════════════════════════════════════════════════════
   KEYFRAMES
   ═══════════════════════════════════════════════════════════════════════ */

const KEYFRAMES_CSS = `
@keyframes fcbFadeIn {
    0%   { opacity: 0; }
    100% { opacity: 1; }
}
@keyframes fcbContentIn {
    0%   { opacity: 0; transform: scale(.92) translateY(4px); filter: blur(6px); }
    100% { opacity: 1; transform: scale(1)  translateY(0);   filter: blur(0); }
}
@keyframes fcbCirclePop {
    0%   { transform: scale(.4);   opacity: 0; }
    60%  { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
}
@keyframes fcbCheck {
    0%   { stroke-dashoffset: 1; opacity: 0; }
    25%  { opacity: 1; }
    100% { stroke-dashoffset: 0; opacity: 1; }
}
@keyframes fcbPulse {
    0%   { transform: scale(.7);   opacity: .5; }
    100% { transform: scale(1.55); opacity: 0; }
}
@keyframes fcbTextIn {
    0%   { opacity: 0; transform: translateY(6px) scale(.95); filter: blur(6px); }
    100% { opacity: 1; transform: translateY(0)   scale(1);   filter: blur(0); }
}
@keyframes fcbRipple {
    0%   { transform: scale(0);   opacity: .55; }
    100% { transform: scale(2.2); opacity: 0; }
}

/* ─────────────────────────────────────────────────────────────────────
   Static-renderer safety net.
   When rendered as a Framer thumbnail / export, we add the fcb-static
   class to the root <button>. The rule below forcibly freezes every
   CSS animation and transition inside the subtree so the captured
   frame is deterministic and fully settled — regardless of whether
   inline animation styles were successfully suppressed.
   The !important flag (plus animation shorthand reset) guarantees
   this overrides both the button's inline transition and any
   animation inline declarations on descendants.
   ───────────────────────────────────────────────────────────────────── */
.fcb-static,
.fcb-static * {
    animation: none !important;
    transition: none !important;
}
`

/* ═══════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════ */

const useKeyframes = (): void => {
    useEffect(() => {
        if (typeof document === "undefined") return
        if (document.getElementById(STYLE_ID)) return
        const style = document.createElement("style")
        style.id = STYLE_ID
        style.textContent = KEYFRAMES_CSS
        document.head.appendChild(style)
    }, [])
}

const usePrefersReducedMotion = (): boolean => {
    const [reduced, setReduced] = useState<boolean>(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            return false
        }
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    })

    useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            return
        }
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
        setReduced(mq.matches)

        // Safari < 14 uses addListener
        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", handler)
            return () => mq.removeEventListener("change", handler)
        }
        // @ts-ignore — legacy Safari MediaQueryList API
        mq.addListener(handler)
        // @ts-ignore
        return () => mq.removeListener(handler)
    }, [])

    return reduced
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function CopyButton(props: CopyButtonProps) {
    useKeyframes()

    // Framer static renderer detection — thumbnails / exports.
    // Hook is unconditional per Rules of Hooks.
    const isStatic = useIsStaticRenderer()

    const {
        text,
        buttonText,
        copiedText,
        backgroundColor,
        textColor,
        copiedBackgroundColor,
        copiedTextColor,
        borderRadius,
        buttonFont,
        copiedFont,
        hapticFeedback = true,
        successDuration = TIMINGS.DEFAULT_SUCCESS,
        disabled = false,
        ariaLabel,
        showIcon = true,
        iconSize = 16,
        iconGap = 8,
        iconPosition = "left",
        reduceMotion = "auto",
        onCopy,
    } = props

    const systemReduced = usePrefersReducedMotion()
    const shouldReduceMotion =
        reduceMotion === "always" || (reduceMotion === "auto" && systemReduced)

    const [phase, setPhase] = useState<Phase>("idle")
    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    const [isFocusVisible, setIsFocusVisible] = useState(false)
    const [ripple, setRipple] = useState<{
        x: number
        y: number
        key: number
    } | null>(null)

    const isMounted = useRef(true)
    const timeouts = useRef<number[]>([])
    const rippleKey = useRef(0)

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
            timeouts.current.forEach(clearTimeout)
            timeouts.current = []
        }
    }, [])

    const clearTimers = useCallback(() => {
        timeouts.current.forEach(clearTimeout)
        timeouts.current = []
    }, [])

    const schedule = useCallback((fn: () => void, ms: number): number => {
        const id = window.setTimeout(() => {
            if (isMounted.current) fn()
            timeouts.current = timeouts.current.filter((t) => t !== id)
        }, ms)
        timeouts.current.push(id)
        return id
    }, [])

    const reset = useCallback(() => {
        if (isMounted.current) setPhase("idle")
    }, [])

    const handleCopy = useCallback(async () => {
        // ── Static guard: static rendering must not initiate any
        //    clipboard, state, timer, or haptic side effects.
        //    This runs before any browser-API access.
        if (isStatic) return
        if (disabled || phase !== "idle" || !text) return

        let copied = false
        if (
            typeof navigator !== "undefined" &&
            navigator.clipboard?.writeText
        ) {
            try {
                await navigator.clipboard.writeText(text)
                copied = true
            } catch {
                copied = false
            }
        }
        if (!copied) copied = fallbackCopy(text)
        if (!copied) {
            triggerHaptics("error", hapticFeedback && !isStatic)
            return
        }

        triggerHaptics("success", hapticFeedback && !isStatic)
        onCopy?.()

        clearTimers()
        setPhase("checkmark")
        schedule(() => setPhase("copied"), TIMINGS.CHECKMARK)
        schedule(reset, Math.max(successDuration, MIN_SUCCESS_TOTAL))
    }, [
        text,
        disabled,
        phase,
        hapticFeedback,
        successDuration,
        isStatic,
        onCopy,
        clearTimers,
        schedule,
        reset,
    ])

    const handlePress = useCallback(
        (e: ReactMouseEvent<HTMLButtonElement>) => {
            // ── Static guard: no ripple, no state updates, no handlers.
            if (isStatic) return
            // Re-entry guard — button stays focusable during animation
            if (disabled || phase !== "idle") return

            // Ripple is purely decorative; never attach one in static mode.
            if (!shouldReduceMotion) {
                const rect = e.currentTarget.getBoundingClientRect()
                // e.detail === 0 is the standard signal for
                // keyboard/programmatic activation
                const isKeyboard = e.detail === 0
                const x = isKeyboard ? rect.width / 2 : e.clientX - rect.left
                const y = isKeyboard ? rect.height / 2 : e.clientY - rect.top
                rippleKey.current += 1
                setRipple({ x, y, key: rippleKey.current })
            }

            handleCopy()
        },
        [disabled, phase, shouldReduceMotion, isStatic, handleCopy]
    )

    const handleRippleEnd = useCallback(() => {
        if (isMounted.current) setRipple(null)
    }, [])

    /* ─── Derived values ─── */

    const isActive = phase !== "idle"
    const bg = isActive ? copiedBackgroundColor : backgroundColor
    const fg = isActive ? copiedTextColor : textColor
    const font = isActive ? copiedFont : buttonFont
    const cursor = disabled ? "not-allowed" : isActive ? "default" : "pointer"

    // Static rendering must not depend on interaction state for layout.
    const scale = isStatic
        ? 1
        : shouldReduceMotion
          ? 1
          : isPressed
            ? 0.97
            : isHovered && !disabled && !isActive
              ? 1.02
              : isActive
                ? 1.015
                : 1

    const boxShadow = isStatic
        ? `0 2px 8px rgba(0,0,0,.08), 0 0 0 1px rgba(255,255,255,.04) inset`
        : shouldReduceMotion
          ? isActive
              ? "0 4px 12px rgba(0,0,0,.15)"
              : isHovered && !disabled
                ? "0 2px 8px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)"
                : "0 1px 3px rgba(0,0,0,.08)"
          : isActive
            ? `0 12px 32px ${withAlpha(copiedBackgroundColor, 0.32)}, 0 0 0 1px rgba(255,255,255,.1) inset`
            : isHovered && !disabled
              ? `0 8px 24px rgba(0,0,0,.15), 0 0 0 1px rgba(255,255,255,.08) inset`
              : `0 2px 8px rgba(0,0,0,.08), 0 0 0 1px rgba(255,255,255,.04) inset`

    const transition = isStatic
        ? "none"
        : shouldReduceMotion
          ? "background-color 120ms ease, color 120ms ease, opacity 120ms ease"
          : `background-color 320ms ${EASING.smoothOut}, color 280ms ${EASING.smoothOut}, transform 420ms ${EASING.spring}, box-shadow 320ms ${EASING.smoothOut}, opacity 200ms ease`

    const external = props.style || {}
    const iconFirst = iconPosition === "left"

    /* ─── Content ─── */

    const visibleContent =
        phase === "checkmark" ? (
            <CheckmarkIcon
                color={fg}
                reducedMotion={shouldReduceMotion}
                isStatic={isStatic}
            />
        ) : phase === "copied" ? (
            <AnimatedText
                text={copiedText}
                reducedMotion={shouldReduceMotion}
                isStatic={isStatic}
            />
        ) : (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: showIcon ? iconGap : 0,
                    minWidth: 0,
                    maxWidth: "100%",
                }}
            >
                {showIcon && iconFirst && (
                    <CopyIcon color={fg} size={iconSize} />
                )}
                <AnimatedText
                    text={buttonText}
                    reducedMotion={shouldReduceMotion}
                    isStatic={isStatic}
                />
                {showIcon && !iconFirst && (
                    <CopyIcon color={fg} size={iconSize} />
                )}
            </span>
        )

    return (
        <button
            type="button"
            onClick={handlePress}
            disabled={disabled}
            aria-disabled={disabled || phase !== "idle"}
            aria-label={
                ariaLabel ||
                (isActive ? "Copied to clipboard" : "Copy to clipboard")
            }
            aria-busy={phase === "checkmark"}
            className={isStatic ? "fcb-static" : undefined}
            onMouseEnter={() => {
                if (!isStatic) setIsHovered(true)
            }}
            onMouseLeave={() => {
                if (!isStatic) {
                    setIsHovered(false)
                    setIsPressed(false)
                }
            }}
            onMouseDown={() => {
                if (!isStatic) setIsPressed(true)
            }}
            onMouseUp={() => {
                if (!isStatic) setIsPressed(false)
            }}
            onFocus={(e) => {
                if (isStatic) return
                if ((e.target as HTMLElement).matches(":focus-visible")) {
                    setIsFocusVisible(true)
                }
            }}
            onBlur={() => {
                if (!isStatic) setIsFocusVisible(false)
            }}
            style={{
                position: "relative",
                display: "grid",
                placeItems: "center",
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                backgroundColor: bg,
                color: fg,
                border: "none",
                borderRadius,
                cursor,
                opacity: disabled ? 0.55 : 1,
                transition,
                transform: `scale(${scale})`,
                boxShadow,
                padding: "14px 28px",
                outline: isFocusVisible ? `2px solid ${fg}` : "none",
                outlineOffset: 3,
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
                ...font,
                ...external,
            }}
        >
            {!isStatic && !shouldReduceMotion && ripple && (
                <RippleLayer
                    key={ripple.key}
                    x={ripple.x}
                    y={ripple.y}
                    color={fg}
                    onEnd={handleRippleEnd}
                />
            )}

            {/* Invisible sizer — locks width across phases */}
            <span
                aria-hidden="true"
                style={{
                    gridArea: "1 / 1",
                    display: "grid",
                    placeItems: "center",
                    visibility: "hidden",
                    pointerEvents: "none",
                    minWidth: 0,
                }}
            >
                <span
                    style={{
                        gridArea: "1 / 1",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: showIcon ? iconGap : 0,
                        whiteSpace: "nowrap",
                        ...buttonFont,
                    }}
                >
                    {showIcon && iconFirst && (
                        <CopyIcon color="transparent" size={iconSize} />
                    )}
                    {buttonText || " "}
                    {showIcon && !iconFirst && (
                        <CopyIcon color="transparent" size={iconSize} />
                    )}
                </span>
                <span
                    style={{
                        gridArea: "1 / 1",
                        whiteSpace: "nowrap",
                        ...copiedFont,
                    }}
                >
                    {copiedText || " "}
                </span>
                <span
                    style={{
                        gridArea: "1 / 1",
                        width: 24,
                        height: 24,
                    }}
                />
            </span>

            {/* Visible content */}
            <span
                style={{
                    gridArea: "1 / 1",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 0,
                    maxWidth: "100%",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {visibleContent}
            </span>

            {/* Screen-reader live region for success announcement */}
            <span
                role="status"
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {phase === "copied" ? copiedText : ""}
            </span>
        </button>
    )
}

/* ═══════════════════════════════════════════════════════════════════════
   SUBCOMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

const CopyIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0, display: "block" }}
    >
        <rect
            x="9"
            y="9"
            width="13"
            height="13"
            rx="2.5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const CheckmarkIcon = ({
    color,
    reducedMotion,
    isStatic,
}: {
    color: string
    reducedMotion: boolean
    isStatic: boolean
}) => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: isStatic
                ? undefined
                : reducedMotion
                  ? "fcbFadeIn .15s ease-out forwards"
                  : `fcbContentIn .44s ${EASING.smoothOut} forwards`,
        }}
    >
        <div
            style={{
                position: "relative",
                width: 24,
                height: 24,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation:
                    isStatic || reducedMotion
                        ? undefined
                        : `fcbCirclePop .48s ${EASING.spring} forwards`,
            }}
        >
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: withAlpha(color, 0.18),
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                }}
            />
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    border: `1px solid ${withAlpha(color, 0.3)}`,
                }}
            />
            {!reducedMotion && !isStatic && (
                <span
                    style={{
                        position: "absolute",
                        inset: -4,
                        borderRadius: 999,
                        border: `1px solid ${withAlpha(color, 0.4)}`,
                        animation: `fcbPulse 1s ${EASING.smoothOut} forwards`,
                    }}
                />
            )}
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                    overflow: "visible",
                    position: "relative",
                }}
            >
                <path
                    d="M4 12L10 18L20 6"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={reducedMotion || isStatic ? undefined : 1}
                    style={
                        reducedMotion || isStatic
                            ? undefined
                            : {
                                  strokeDasharray: 1,
                                  strokeDashoffset: 1,
                                  animation: `fcbCheck .4s ${EASING.smoothInOut} .08s forwards`,
                              }
                    }
                />
            </svg>
        </div>
    </div>
)

const AnimatedText = ({
    text,
    reducedMotion,
    isStatic,
}: {
    text: string
    reducedMotion: boolean
    isStatic: boolean
}) => (
    <span
        key={text}
        style={{
            display: "inline-block",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            animation: isStatic
                ? undefined
                : reducedMotion
                  ? "fcbFadeIn .15s ease-out forwards"
                  : `fcbTextIn .42s ${EASING.spring} .04s both`,
        }}
    >
        {text}
    </span>
)

const RippleLayer = ({
    x,
    y,
    color,
    onEnd,
}: {
    x: number
    y: number
    color: string
    onEnd: () => void
}) => (
    <span
        aria-hidden="true"
        style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
        }}
    >
        <span
            onAnimationEnd={onEnd}
            style={{
                position: "absolute",
                left: x - 12,
                top: y - 12,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: withAlpha(color, 0.3),
                animation: `fcbRipple 620ms ${EASING.smoothOut} forwards`,
            }}
        />
    </span>
)

/* ═══════════════════════════════════════════════════════════════════════
   PROPERTY CONTROLS
   ═══════════════════════════════════════════════════════════════════════ */

addPropertyControls(CopyButton, {
    text: {
        type: ControlType.String,
        title: "Text to Copy",
        defaultValue: "https://framer.com",
        displayTextArea: true,
    },
    buttonText: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Copy",
    },
    copiedText: {
        type: ControlType.String,
        title: "Copied Label",
        defaultValue: "Copied!",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    copiedBackgroundColor: {
        type: ControlType.Color,
        title: "Success BG",
        defaultValue: "#22CC66",
    },
    copiedTextColor: {
        type: ControlType.Color,
        title: "Success Text",
        defaultValue: "#FFFFFF",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    copiedFont: {
        type: ControlType.Font,
        title: "Success Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Icon",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 16,
        min: 10,
        max: 32,
        step: 1,
        unit: "px",
        hidden: (p: CopyButtonProps) => !p.showIcon,
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon Gap",
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        hidden: (p: CopyButtonProps) => !p.showIcon,
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: (p: CopyButtonProps) => !p.showIcon,
    },
    hapticFeedback: {
        type: ControlType.Boolean,
        title: "Haptics",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    successDuration: {
        type: ControlType.Number,
        title: "Success Duration",
        defaultValue: 2200,
        min: 1600,
        max: 4000,
        step: 100,
        unit: "ms",
        description:
            "How long the success state stays visible before resetting.",
    },
    reduceMotion: {
        type: ControlType.Enum,
        title: "Reduce Motion",
        options: ["auto", "always", "never"],
        optionTitles: ["Auto", "Always", "Never"],
        defaultValue: "auto",
        displaySegmentedControl: true,
        description: "Auto respects the user's system preference.",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "",
        placeholder: "Copy to clipboard",
    },
    onCopy: {
        type: ControlType.EventHandler,
        title: "On Copy",
    },
})
