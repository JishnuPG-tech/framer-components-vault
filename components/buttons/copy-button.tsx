import {
    useState,
    useRef,
    useEffect,
    useCallback,
    startTransition,
    type CSSProperties,
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


interface CopyButtonProps {
    source: "custom" | "pageUrl"
    value: string
    label: string
    copiedLabel: string
    resetAfterMs: number
    showCopyIcon: boolean
    showCheckIcon: boolean
    transition: "none" | "fade"
    fadeDurationMs: number

    padding: number
    align: "left" | "center" | "right"
    radius: number

    font: any

    textColor: string
    bgColor: string
    borderColor: string
    borderWidth: number

    hoverTextColor: string
    hoverBgColor: string
    hoverBorderColor: string

    activeTextColor: string
    activeBgColor: string
    activeBorderColor: string

    style?: CSSProperties
}

export default function CopyButton(props: CopyButtonProps) {
    const {
        source,
        value,
        label,
        copiedLabel,
        resetAfterMs,
        showCopyIcon,
        showCheckIcon,
        transition,
        fadeDurationMs,

        padding,
        align,
        radius,

        font,

        textColor,
        bgColor,
        borderColor,
        borderWidth,

        hoverTextColor,
        hoverBgColor,
        hoverBorderColor,

        activeTextColor,
        activeBgColor,
        activeBorderColor,

        style,
    } = props

    type UIState = "idle" | "hover" | "active"
    const [state, setState] = useState<UIState>("idle")
    const resetTimeout = useRef<number | null>(null)

    const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const fading = transition === "fade" && !reduceMotion

    useEffect(() => {
        return () => {
            if (resetTimeout.current) window.clearTimeout(resetTimeout.current)
        }
    }, [])

    useEffect(() => {
        if (state !== "active" || resetAfterMs <= 0) return
        if (resetTimeout.current) window.clearTimeout(resetTimeout.current)
        resetTimeout.current = window.setTimeout(() => {
            startTransition(() => setState("idle"))
        }, resetAfterMs)
        return () => {
            if (resetTimeout.current) window.clearTimeout(resetTimeout.current)
        }
    }, [state, resetAfterMs])

    const resolveTextToCopy = () => {
        if (source === "pageUrl") {
            return typeof window !== "undefined" ? window.location.href : ""
        }
        return value ?? ""
    }

    const copyWithFallback = async (text: string) => {
        if (!text) return false
        try {
            if (
                typeof navigator !== "undefined" &&
                "clipboard" in navigator &&
                (window as any).isSecureContext
            ) {
                await navigator.clipboard.writeText(text)
                return true
            }
        } catch {}
        try {
            if (typeof document === "undefined") return false
            const ta = document.createElement("textarea")
            ta.value = text
            ta.setAttribute("readonly", "")
            ta.style.position = "fixed"
            ta.style.opacity = "0"
            ta.style.pointerEvents = "none"
            document.body.appendChild(ta)
            ta.select()
            const ok = document.execCommand("copy")
            document.body.removeChild(ta)
            return ok
        } catch {
            return false
        }
    }

    const handleCopy = useCallback(async () => {
        if (state === "active") return
        const text = resolveTextToCopy()
        const ok = await copyWithFallback(text)
        if (ok) startTransition(() => setState("active"))
    }, [state, source, value])

    const handleMouseEnter = () => {
        if (state === "idle") startTransition(() => setState("hover"))
    }
    const handleMouseLeave = () => {
        if (state === "hover") startTransition(() => setState("idle"))
    }
    const handleFocus = () => {
        if (state === "idle") startTransition(() => setState("hover"))
    }
    const handleBlur = () => {
        if (state === "hover") startTransition(() => setState("idle"))
    }

    const justifyItems =
        align === "left" ? "start" : align === "right" ? "end" : "center"

    const isActive = state === "active"
    const isHover = state === "hover"

    const palette = isActive
        ? {
              color: activeTextColor,
              bg: activeBgColor,
              border: activeBorderColor,
          }
        : isHover
          ? {
                color: hoverTextColor,
                bg: hoverBgColor,
                border: hoverBorderColor,
            }
          : { color: textColor, bg: bgColor, border: borderColor }

    const fontSize = parseFloat(font?.fontSize ?? "14") || 14
    const lineHeight = (() => {
        const lh = font?.lineHeight
        if (typeof lh === "number") return lh
        if (typeof lh === "string") {
            const n = parseFloat(lh)
            if (!isNaN(n)) return n
        }
        return 1.5
    })()
    const minContentHeight = Math.max(32, fontSize * lineHeight)

    const btnStyle: CSSProperties = {
        ...style,
        display: "inline-grid", // <— Grid statt Flex; erlaubt Hug/Fit
        gridAutoFlow: "row",
        placeItems: `center ${justifyItems}`,
        position: "relative",
        padding: `${padding}px`,
        borderRadius: radius,
        border: `${borderWidth}px solid ${palette.border}`,
        backgroundColor: palette.bg,
        color: palette.color,
        cursor: isActive ? "default" : "pointer",
        userSelect: "none",
        outline: "none",
        minHeight: minContentHeight, // verhindert „zu dünn“
        ...font,
        transition: fading
            ? `background-color ${fadeDurationMs}ms, color ${fadeDurationMs}ms, border-color ${fadeDurationMs}ms`
            : undefined,
    }

    const layerCommon: CSSProperties = {
        gridArea: "1 / 1 / 2 / 2", // beide Layer übereinander
        display: "inline-flex",
        alignItems: "center",
        pointerEvents: "none",
    }

    const idleLayer: CSSProperties = fading
        ? {
              ...layerCommon,
              opacity: isActive ? 0 : 1,
              transition: `opacity ${fadeDurationMs}ms`,
          }
        : { ...layerCommon, display: isActive ? "none" : "inline-flex" }

    const activeLayer: CSSProperties = fading
        ? {
              ...layerCommon,
              opacity: isActive ? 1 : 0,
              transition: `opacity ${fadeDurationMs}ms`,
          }
        : { ...layerCommon, display: isActive ? "inline-flex" : "none" }

    if (RenderTarget.current() === RenderTarget.thumbnail) return null

    return (
        <button
            type="button"
            aria-label={isActive ? props.copiedLabel : props.label}
            style={btnStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleCopy}
            disabled={isActive}
        >
            <span style={idleLayer} aria-hidden>
                {props.showCopyIcon && (
                    <span style={{ marginRight: 8, display: "inline-flex" }}>
                        <svg
                            width="1em"
                            height="1em"
                            viewBox="0 0 20 20"
                            fill="none"
                            aria-hidden="true"
                            style={{ display: "block" }}
                        >
                            <rect
                                x="7"
                                y="7"
                                width="9"
                                height="9"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <rect
                                x="4"
                                y="4"
                                width="9"
                                height="9"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                opacity="0.5"
                            />
                        </svg>
                    </span>
                )}
                <span>{props.label}</span>
            </span>

            <span style={activeLayer} aria-hidden>
                {props.showCheckIcon && (
                    <span style={{ marginRight: 8, display: "inline-flex" }}>
                        <svg
                            width="1em"
                            height="1em"
                            viewBox="0 0 20 20"
                            fill="none"
                            aria-hidden="true"
                            style={{ display: "block" }}
                        >
                            <path
                                d="M5 10.5L9 14.5L15 7.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                )}
                <span>{props.copiedLabel}</span>
            </span>

            {/* Screenreader feedback */}
            <span
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    margin: -1,
                    padding: 0,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {isActive ? props.copiedLabel : props.label}
            </span>
        </button>
    )
}

addPropertyControls(CopyButton, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["custom", "pageUrl"],
        optionTitles: ["Custom", "Page URL"],
        defaultValue: "custom",
    },
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "",
        placeholder: "Text to copy…",
        hidden: ({ source }) => source !== "custom",
        description: "The text to be copied.",
    },

    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Copy",
    },
    copiedLabel: {
        type: ControlType.String,
        title: "Copied Label",
        defaultValue: "Copied!",
    },
    resetAfterMs: {
        type: ControlType.Number,
        title: "Delay (ms)",
        defaultValue: 1600,
        min: 0,
        max: 10000,
        step: 100,
        displayStepper: true,
        description: "The delay after which the button returns to idle state.",
    },
    showCopyIcon: {
        type: ControlType.Boolean,
        title: "Copy Icon",
        defaultValue: true,
    },
    showCheckIcon: {
        type: ControlType.Boolean,
        title: "Check Icon",
        defaultValue: true,
    },

    transition: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["none", "fade"],
        optionTitles: ["None", "Fade"],
        defaultValue: "fade",
        description: "Set a transition between the button states.",
    },
    fadeDurationMs: {
        type: ControlType.Number,
        title: "Fade Duration (ms)",
        defaultValue: 180,
        min: 60,
        max: 1000,
        step: 10,
        displayStepper: true,
        hidden: ({ transition }) => transition !== "fade",
    },

    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 0,
        max: 128,
        step: 1,
        displayStepper: true,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 128,
        step: 1,
        displayStepper: true,
    },

    // Typography via Font control (inherits by default)
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            lineHeight: "1.5em",
            letterSpacing: "0em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },

    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 8,
        step: 1,
        displayStepper: true,
    },

    // Colors & borders
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#111827",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F3F4F6",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E5E7EB",
        description: "Customize idle state.",
    },

    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#1F2937",
    },
    hoverBgColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#E5E7EB",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: "#D1D5DB",
        description: "Customize hover state.",
    },

    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text",
        defaultValue: "#FFFFFF",
    },
    activeBgColor: {
        type: ControlType.Color,
        title: "Active BG",
        defaultValue: "#10B981",
    },
    activeBorderColor: {
        type: ControlType.Color,
        title: "Active Border",
        defaultValue: "#10B981",
        description: "Customize copied state.",
    },
})
