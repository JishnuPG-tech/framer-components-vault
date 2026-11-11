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


/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 260
 */

// ── Constants ─────────────────────────────────────────────
const MAX_SUFFIX_LENGTH = 8

const BASE_SEQUENCE = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
]

const UI = {
    // Base surfaces
    panelBackground:
        "linear-gradient(180deg, rgba(16,16,18,0.98) 0%, rgba(10,10,12,0.99) 100%)",
    panelBorder: "1px solid rgba(255,255,255,0.06)",
    cardBackground: "rgba(255,255,255,0.035)",
    cardBorder: "1px solid rgba(255,255,255,0.035)",
    trackBackground: "rgba(255,255,255,0.055)",

    // Typography
    textPrimary: "rgba(255,255,255,0.96)",
    textSecondary: "rgba(255,255,255,0.84)",
    textMuted: "rgba(255,255,255,0.42)",
    textInactive: "rgba(255,255,255,0.58)",

    // Accent states
    statusListeningText: "#C9D7FF",
    statusListeningBackground: "rgba(90,120,200,0.22)",

    statusMatchedText: "#86EFAC",
    statusMatchedBackground: "rgba(34,197,94,0.22)",

    statusRevealedText: "#D8B4FE",
    statusRevealedBackground: "rgba(168,85,247,0.22)",

    statusWarningText: "#FBBF24",
    statusWarningBackground: "rgba(251,191,36,0.18)",

    statusInactiveBackground: "rgba(255,255,255,0.08)",

    // Progress states
    progressListening: "#AEBFFF",
    progressMatched: "#22C55E",
    progressRevealed: "#A855F7",
}

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"])

// ── Helpers ───────────────────────────────────────────────
function sanitizeLetters(value: string) {
    return String(value || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, MAX_SUFFIX_LENGTH)
}

function getNormalizedKey(key: string) {
    return key.length === 1 ? key.toUpperCase() : key
}

function shouldIgnoreTarget(target: EventTarget | null) {
    const element = target as HTMLElement | null
    if (!element) return false

    const tagName = element.tagName?.toLowerCase?.() || ""
    if (element.isContentEditable) return true

    return tagName === "input" || tagName === "textarea" || tagName === "select"
}

function isExactMatch(buffer: string[], sequence: string[]) {
    if (buffer.length !== sequence.length) return false

    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== sequence[i]) return false
    }

    return true
}

function getNextBuffer(
    currentBuffer: string[],
    nextKey: string,
    targetSequence: string[]
) {
    const candidate = [...currentBuffer, nextKey]

    for (let start = 0; start < candidate.length; start++) {
        const suffix = candidate.slice(start)
        let valid = true

        for (let i = 0; i < suffix.length; i++) {
            if (suffix[i] !== targetSequence[i]) {
                valid = false
                break
            }
        }

        if (valid) return suffix
    }

    return []
}

function keyToVisual(key: string) {
    if (key === "ArrowUp") return "↑"
    if (key === "ArrowDown") return "↓"
    if (key === "ArrowLeft") return "←"
    if (key === "ArrowRight") return "→"
    return key
}

function getStatusUI(params: {
    matchedPulse: boolean
    missingHiddenContent: boolean
    revealed: boolean
    isPreviewActive: boolean
    active: boolean
}) {
    if (params.matchedPulse) {
        return {
            label: "Matched",
            background: UI.statusMatchedBackground,
            color: UI.statusMatchedText,
        }
    }

    if (params.missingHiddenContent) {
        return {
            label: "No Content",
            background: UI.statusWarningBackground,
            color: UI.statusWarningText,
        }
    }

    if (params.revealed) {
        return {
            label: "Revealed",
            background: UI.statusRevealedBackground,
            color: UI.statusRevealedText,
        }
    }

    if (params.isPreviewActive) {
        return {
            label: "Preview",
            background: UI.statusRevealedBackground,
            color: UI.statusRevealedText,
        }
    }

    if (params.active) {
        return {
            label: "Listening",
            background: UI.statusListeningBackground,
            color: UI.statusListeningText,
        }
    }

    return {
        label: "Inactive",
        background: UI.statusInactiveBackground,
        color: UI.textInactive,
    }
}

function getProgressFillColor(params: {
    matchedPulse: boolean
    revealed: boolean
}) {
    if (params.matchedPulse) return UI.progressMatched
    if (params.revealed) return UI.progressRevealed
    return UI.progressListening
}

// ── Types ─────────────────────────────────────────────────
type KonamiProps = {
    active: boolean
    showDebug: boolean
    endLetters: string
    action: "redirect" | "reveal"
    previewOverlay: boolean
    redirectUrl: string
    hiddenContent?: React.ReactNode
    onMatch?: () => void
    style?: React.CSSProperties
}

// ── Sub-components ────────────────────────────────────────
function InfoCard(props: { label: string; value: string }) {
    return (
        <div
            style={{
                padding: 16,
                borderRadius: 24,
                background: UI.cardBackground,
                border: UI.cardBorder,

                minHeight: 96,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    lineHeight: 1.3,
                    color: UI.textMuted,
                    marginBottom: 8,
                }}
            >
                {props.label}
            </div>
            <div
                style={{
                    fontSize: 18,
                    lineHeight: 1.2,
                    color: UI.textPrimary,
                    fontWeight: 700,
                    letterSpacing: -0.2,
                    wordBreak: "break-word",
                    fontVariantNumeric: "tabular-nums",
                    fontFeatureSettings: '"tnum" 1',
                }}
            >
                {props.value}
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────
export default function Konami(props: KonamiProps) {
    const {
        active = true,
        showDebug = true,
        endLetters = "BA",
        action = "redirect",
        previewOverlay = false,
        redirectUrl = "",
        hiddenContent,
        onMatch,
        style,
    } = props

    const [progress, setProgress] = React.useState(0)
    const [revealed, setRevealed] = React.useState(false)
    const [matchedPulse, setMatchedPulse] = React.useState(false)
    const [previewDismissed, setPreviewDismissed] = React.useState(false)

    const bufferRef = React.useRef<string[]>([])
    const pulseTimeoutRef = React.useRef<number | null>(null)
    const redirectTimeoutRef = React.useRef<number | null>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const sanitizedLetters = React.useMemo(
        () => sanitizeLetters(endLetters),
        [endLetters]
    )

    const fullSequence = React.useMemo(
        () => [...BASE_SEQUENCE, ...sanitizedLetters.split("")],
        [sanitizedLetters]
    )

    const visualSequence = React.useMemo(
        () => fullSequence.map(keyToVisual),
        [fullSequence]
    )

    const isPreviewActive = previewOverlay && !previewDismissed
    const revealActive = action === "reveal" && (revealed || isPreviewActive)

    const hasContent =
        hiddenContent != null &&
        (!Array.isArray(hiddenContent) || hiddenContent.length > 0)

    const showRevealContent = revealActive && hasContent
    const missingHiddenContent = action === "reveal" && !hasContent

    const clearPulseTimeout = React.useCallback(() => {
        if (typeof window === "undefined") return

        if (pulseTimeoutRef.current) {
            window.clearTimeout(pulseTimeoutRef.current)
            pulseTimeoutRef.current = null
        }
    }, [])

    const clearRedirectTimeout = React.useCallback(() => {
        if (typeof window === "undefined") return

        if (redirectTimeoutRef.current) {
            window.clearTimeout(redirectTimeoutRef.current)
            redirectTimeoutRef.current = null
        }
    }, [])

    const resetInputState = React.useCallback(() => {
        bufferRef.current = []
        setProgress(0)
        setMatchedPulse(false)
        clearPulseTimeout()
    }, [clearPulseTimeout])

    const closeRevealState = React.useCallback(() => {
        if (revealed) setRevealed(false)
        if (isPreviewActive) setPreviewDismissed(true)
        resetInputState()
    }, [revealed, isPreviewActive, resetInputState])

    const statusUI = React.useMemo(
        () =>
            getStatusUI({
                matchedPulse,
                missingHiddenContent,
                revealed,
                isPreviewActive,
                active,
            }),
        [matchedPulse, missingHiddenContent, revealed, isPreviewActive, active]
    )

    const progressFillColor = React.useMemo(
        () =>
            getProgressFillColor({
                matchedPulse,
                revealed,
            }),
        [matchedPulse, revealed]
    )

    const footerText =
        action === "reveal"
            ? hasContent
                ? "Press Esc or click outside to close the overlay."
                : "Connect a frame to Hidden Content."
            : redirectUrl
              ? "Redirect runs after the full code matches."
              : "Set a Redirect URL to get started."

    React.useEffect(() => {
        resetInputState()
        setRevealed(false)
    }, [active, sanitizedLetters, action, resetInputState])

    React.useEffect(() => {
        setPreviewDismissed(false)
    }, [previewOverlay])

    React.useEffect(() => {
        if (!active || isCanvas) return
        if (typeof window === "undefined") return

        function handleKeyDown(e: KeyboardEvent) {
            if (MODIFIER_KEYS.has(e.key)) return

            if (e.key === "Escape" && showRevealContent) {
                closeRevealState()
                return
            }

            if (shouldIgnoreTarget(e.target)) return

            const key = getNormalizedKey(e.key)
            const nextBuffer = getNextBuffer(
                bufferRef.current,
                key,
                fullSequence
            )

            bufferRef.current = nextBuffer
            setProgress(nextBuffer.length)

            if (isExactMatch(nextBuffer, fullSequence)) {
                setMatchedPulse(true)
                clearPulseTimeout()
                pulseTimeoutRef.current = window.setTimeout(
                    () => setMatchedPulse(false),
                    1000
                )

                onMatch?.()

                if (action === "reveal" && hasContent) {
                    setRevealed(true)
                }

                if (
                    action === "redirect" &&
                    redirectUrl &&
                    redirectUrl.trim()
                ) {
                    clearRedirectTimeout()
                    redirectTimeoutRef.current = window.setTimeout(() => {
                        let url = redirectUrl.trim()

                        if (
                            !url.startsWith("/") &&
                            !url.startsWith("#") &&
                            !url.startsWith("mailto:") &&
                            !url.startsWith("tel:") &&
                            !url.includes("://")
                        ) {
                            url = "https://" + url
                        }

                        window.location.href = url
                    }, 120)
                }

                bufferRef.current = []
                setProgress(0)
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            clearPulseTimeout()
            clearRedirectTimeout()
        }
    }, [
        active,
        action,
        redirectUrl,
        fullSequence,
        isCanvas,
        onMatch,
        showRevealContent,
        hasContent,
        closeRevealState,
        clearPulseTimeout,
        clearRedirectTimeout,
    ])

    React.useEffect(() => {
        if (!showRevealContent) return
        if (typeof window === "undefined") return

        function handleClick(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                closeRevealState()
            }
        }

        const id = window.setTimeout(
            () => window.addEventListener("click", handleClick),
            0
        )

        return () => {
            window.clearTimeout(id)
            window.removeEventListener("click", handleClick)
        }
    }, [showRevealContent, closeRevealState])

    if (showRevealContent) {
        return (
            <div
                ref={containerRef}
                role="region"
                aria-label="Hidden content"
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {hiddenContent}
            </div>
        )
    }

    if (showDebug) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    minWidth: 360,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 32,
                    background: UI.panelBackground,
                    border: UI.panelBorder,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    pointerEvents: "none",
                    fontFamily:
                        "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                }}
            >
                <div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 16,
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                lineHeight: 1,
                                color: UI.textPrimary,
                                letterSpacing: -0.4,
                                minHeight: 32,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            Konami Code
                        </div>
                        <div
                            style={{
                                padding: "8px 16px",
                                borderRadius: 999,
                                background: statusUI.background,
                                color: statusUI.color,
                                fontSize: 11,
                                fontWeight: 700,
                                lineHeight: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {statusUI.label}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: 4,
                            marginBottom: 16,
                        }}
                    >
                        {visualSequence.map((item, index) => (
                            <span
                                key={`${item}-${index}`}
                                style={{
                                    height: 24,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 15,
                                    lineHeight: 1,
                                    color:
                                        index < progress
                                            ? UI.progressListening
                                            : UI.textSecondary,
                                    fontWeight: 600,
                                    transition: "color 0.16s ease",
                                }}
                            >
                                {item}
                            </span>
                        ))}
                    </div>

                    <div
                        style={{
                            height: 8,
                            width: "100%",
                            borderRadius: 999,
                            overflow: "hidden",
                            background: UI.trackBackground,
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${(progress / Math.max(fullSequence.length, 1)) * 100}%`,
                                borderRadius: 999,
                                background: progressFillColor,
                                transition:
                                    "width 0.16s ease, background 0.2s ease",
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                        }}
                    >
                        <InfoCard
                            label="Suffix"
                            value={sanitizedLetters || "—"}
                        />
                        <InfoCard
                            label="Progress"
                            value={`${progress}/${fullSequence.length}`}
                        />
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 16,
                        fontSize: 12,
                        lineHeight: 1.45,
                        color: UI.textMuted,
                    }}
                >
                    {footerText}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                background: "transparent",
                pointerEvents: "none",
            }}
        />
    )
}

// ── Property Controls ─────────────────────────────────────
addPropertyControls(Konami, {
    active: {
        type: ControlType.Boolean,
        title: "Active",
        defaultValue: true,
        description: "Keyboard only — no mobile support.",
    },
    showDebug: {
        type: ControlType.Boolean,
        title: "Debug Preview",
        defaultValue: true,
    },
    endLetters: {
        type: ControlType.String,
        title: "End Letters",
        defaultValue: "BA",
        placeholder: "BA",
        maxLength: MAX_SUFFIX_LENGTH,
        description: `A–Z only, max ${MAX_SUFFIX_LENGTH} characters.`,
    },
    action: {
        type: ControlType.Enum,
        title: "Action",
        options: ["redirect", "reveal"],
        optionTitles: ["Redirect", "Reveal"],
        defaultValue: "redirect",
        displaySegmentedControl: true,
    },
    previewOverlay: {
        type: ControlType.Boolean,
        title: "Preview Overlay",
        defaultValue: false,
        hidden(props) {
            return props.action !== "reveal"
        },
    },
    redirectUrl: {
        type: ControlType.Link,
        title: "Redirect URL",
        hidden(props) {
            return props.action !== "redirect"
        },
    },
    hiddenContent: {
        type: ControlType.ComponentInstance,
        title: "Hidden Content",
        description: "Press Esc or click outside to close.",
        hidden(props) {
            return props.action !== "reveal"
        },
    },
    onMatch: {
        type: ControlType.EventHandler,
    },
})
