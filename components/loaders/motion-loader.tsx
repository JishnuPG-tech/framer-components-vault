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

import { motion, useInView } from "framer-motion"

// User request: Create a separate LoadingOverlay component with terminal-style full-screen loader behavior, responsive status/percentage/message layout, editable controls, timed progress to 100%, fade-out, and pointer-events disabled after dismissal over underlying children content.

interface LoaderFont {
    fontFamily?: string
    fontSize?: string | number
    letterSpacing?: string | number
    lineHeight?: string | number
    fontWeight?: number | string
    fontStyle?: "normal" | "italic"
    textAlign?: "left" | "center" | "right"
}

interface MyComponentProps {
    backgroundColor: string
    textColor: string
    accentColor: string
    loaderDuration: number
    fadeDuration: number
    statusLines: string[]
    message: string
    showPercentage: boolean
    reducedMotion: boolean
    soundEnabled: boolean
    soundVolume: number
    soundInterval: number
    textAnimationSpeed: number
    loaderFont: LoaderFont
    children?: React.ReactNode
    ariaLabel: string
    style?: React.CSSProperties
}

const defaultStatusLines = [
    "INITIALIZING CORE...",
    "HANDSHAKING NETWORK...",
    "VERIFYING ASSETS...",
    "MOUNTING INTERFACE...",
    "RESOLVING DEPENDENCIES...",
    "FINALIZING SESSION...",
]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LoadingOverlay(props: MyComponentProps) {
    const {
        backgroundColor = "#5525B8",
        textColor = "#FFFFFF",
        accentColor = "#A7FF7A",
        loaderDuration = 3200,
        fadeDuration = 700,
        statusLines = defaultStatusLines,
        message = "WELCOME TO\nTHE EXPERIENCE",
        showPercentage = true,
        reducedMotion = false,
        soundEnabled = false,
        soundVolume = 0.15,
        soundInterval = 120,
        textAnimationSpeed = 24,
        loaderFont = {
            fontSize: "15px",
            letterSpacing: "0.04em",
            lineHeight: "1.5em",
        } as LoaderFont,
        children,
        ariaLabel = "Loading overlay",
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const inView = useInView(rootRef, { amount: 0.2 })
    const isStaticRenderer = useIsStaticRenderer()
    const [containerWidth, setContainerWidth] = React.useState(1200)
    const [progress, setProgress] = React.useState(isStaticRenderer ? 73 : 0)
    const [isComplete, setIsComplete] = React.useState(false)
    const [isDismissed, setIsDismissed] = React.useState(false)
    const audioContextRef = React.useRef<AudioContext | null>(null)
    const lastSoundTimeRef = React.useRef(0)
    const previousRevealRef = React.useRef(0)

    const systemReducedMotion = React.useMemo(() => {
        if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        }
        return false
    }, [])
    const effectiveReducedMotion = reducedMotion || systemReducedMotion
    const safeLoaderDuration = React.useMemo(() => Math.max(100, loaderDuration), [loaderDuration])
    const safeFadeDuration = React.useMemo(() => Math.max(0, fadeDuration), [fadeDuration])
    const safeSoundVolume = React.useMemo(() => Math.min(1, Math.max(0, soundVolume)), [soundVolume])
    const safeSoundInterval = React.useMemo(() => Math.max(16, soundInterval), [soundInterval])
    const safeTextAnimationSpeed = React.useMemo(() => Math.max(8, textAnimationSpeed), [textAnimationSpeed])
    const safeStatusLines = React.useMemo(() => {
        const lines = statusLines.filter((line) => line && line.trim().length > 0)
        return lines.length > 0 ? lines : defaultStatusLines
    }, [statusLines])

    const totalCharacterCount = React.useMemo(() => {
        return safeStatusLines.reduce((total, line) => total + line.length, 0)
    }, [safeStatusLines])

    const revealedCharacterCount = React.useMemo(() => {
        if (effectiveReducedMotion || isStaticRenderer) return totalCharacterCount
        const elapsedMs = (Math.min(100, Math.max(0, progress)) / 100) * safeLoaderDuration
        return Math.min(totalCharacterCount, Math.floor(elapsedMs / safeTextAnimationSpeed))
    }, [
        effectiveReducedMotion,
        isStaticRenderer,
        progress,
        safeLoaderDuration,
        safeTextAnimationSpeed,
        totalCharacterCount,
    ])

    const lineRevealData = React.useMemo(() => {
        let remaining = revealedCharacterCount
        let firstUnfinishedIndex = safeStatusLines.length - 1

        const items = safeStatusLines.map((line, index) => {
            const visibleChars = Math.max(0, Math.min(line.length, remaining))
            remaining -= visibleChars
            const isCompleteLine = visibleChars >= line.length

            if (!isCompleteLine && firstUnfinishedIndex === safeStatusLines.length - 1) {
                firstUnfinishedIndex = index
            }

            return {
                shownText: line.slice(0, visibleChars),
                isCompleteLine,
            }
        })

        const activeLineIndex =
            revealedCharacterCount >= totalCharacterCount
                ? safeStatusLines.length - 1
                : Math.max(0, firstUnfinishedIndex)

        return { items, activeLineIndex }
    }, [revealedCharacterCount, safeStatusLines, totalCharacterCount])

    const isNarrow = containerWidth < 760
    const isMedium = containerWidth >= 760 && containerWidth < 980

    React.useEffect(() => {
        if (isStaticRenderer) return
        if (!rootRef.current) return
        if (typeof window === "undefined") return

        const node = rootRef.current
        const updateWidth = () => {
            React.startTransition(() => {
                setContainerWidth(node.clientWidth || 1200)
            })
        }

        updateWidth()
        if (typeof window.ResizeObserver !== "undefined") {
            const observer = new window.ResizeObserver(updateWidth)
            observer.observe(node)
            return () => observer.disconnect()
        }

        window.addEventListener("resize", updateWidth)
        return () => window.removeEventListener("resize", updateWidth)
    }, [isStaticRenderer])

    const dismissLoader = React.useCallback(() => {
        React.startTransition(() => {
            setIsDismissed(true)
        })
    }, [])

    const playTerminalTick = React.useCallback(() => {
        if (typeof window === "undefined") return

        try {
            const Ctx =
                window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

            if (!Ctx) return

            if (!audioContextRef.current) {
                audioContextRef.current = new Ctx()
            }

            const audioContext = audioContextRef.current
            if (!audioContext || audioContext.state !== "running") return

            const now = audioContext.currentTime
            const oscillator = audioContext.createOscillator()
            const gain = audioContext.createGain()

            oscillator.type = "square"
            oscillator.frequency.setValueAtTime(1020 + Math.random() * 120, now)
            gain.gain.setValueAtTime(Math.max(0.0001, safeSoundVolume), now)
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)

            oscillator.connect(gain)
            gain.connect(audioContext.destination)
            oscillator.start(now)
            oscillator.stop(now + 0.05)
        } catch (_error) {
            // Graceful no-op for autoplay restrictions or unsupported environments.
        }
    }, [safeSoundVolume])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStaticRenderer || effectiveReducedMotion || !soundEnabled || isDismissed) return

        const unlock = () => {
            try {
                const Ctx =
                    window.AudioContext ||
                    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
                if (!Ctx) return

                if (!audioContextRef.current) {
                    audioContextRef.current = new Ctx()
                }

                const context = audioContextRef.current
                if (context && context.state === "suspended") {
                    void context.resume()
                }
            } catch (_error) {
                // Ignore if browser blocks audio context creation.
            }
        }

        window.addEventListener("pointerdown", unlock, { passive: true })
        window.addEventListener("keydown", unlock)

        return () => {
            window.removeEventListener("pointerdown", unlock)
            window.removeEventListener("keydown", unlock)
        }
    }, [effectiveReducedMotion, isDismissed, isStaticRenderer, soundEnabled])

    React.useEffect(() => {
        if (isStaticRenderer || effectiveReducedMotion || !soundEnabled || isDismissed || !inView) return
        if (revealedCharacterCount <= previousRevealRef.current) return

        const now = Date.now()
        if (now - lastSoundTimeRef.current >= safeSoundInterval) {
            lastSoundTimeRef.current = now
            playTerminalTick()
        }
        previousRevealRef.current = revealedCharacterCount
    }, [
        effectiveReducedMotion,
        inView,
        isDismissed,
        isStaticRenderer,
        playTerminalTick,
        revealedCharacterCount,
        safeSoundInterval,
        soundEnabled,
    ])

    React.useEffect(() => {
        if (isStaticRenderer || isDismissed || !inView) return

        const start = Date.now()
        const intervalId = window.setInterval(() => {
            const elapsed = Date.now() - start
            const nextProgress = Math.min(100, Math.round((elapsed / safeLoaderDuration) * 100))

            React.startTransition(() => {
                setProgress(nextProgress)
            })

            if (nextProgress >= 100) {
                window.clearInterval(intervalId)
                React.startTransition(() => {
                    setIsComplete(true)
                })
            }
        }, 50)

        return () => window.clearInterval(intervalId)
    }, [inView, isDismissed, isStaticRenderer, safeLoaderDuration])

    React.useEffect(() => {
        if (isStaticRenderer || !isComplete || isDismissed) return
        if (effectiveReducedMotion || safeFadeDuration === 0) {
            dismissLoader()
            return
        }

        const timeout = window.setTimeout(() => {
            dismissLoader()
        }, 120)

        return () => window.clearTimeout(timeout)
    }, [dismissLoader, effectiveReducedMotion, isComplete, isDismissed, isStaticRenderer, safeFadeDuration])

    const overlayTransition = React.useMemo(() => {
        return {
            duration: isStaticRenderer || effectiveReducedMotion ? 0 : safeFadeDuration / 1000,
            ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
        }
    }, [effectiveReducedMotion, isStaticRenderer, safeFadeDuration])

    return (
        <div
            ref={rootRef}
            role="region"
            aria-label={ariaLabel}
            aria-busy={!isDismissed}
            style={{
                ...style,
                position: "relative",
                width: style?.width ?? "100%",
                height: style?.height ?? "100%",
                minHeight: 1,
                overflow: "hidden",
                background: "transparent",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                }}
            >
                {children}
            </div>

            <motion.div
                role="status"
                aria-live="polite"
                aria-hidden={isDismissed}
                initial={false}
                animate={{
                    opacity: isDismissed ? 0 : 1,
                    y: isDismissed ? "-100%" : "0%",
                }}
                transition={overlayTransition}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 20,
                    pointerEvents: isDismissed ? "none" : "auto",
                    backgroundColor,
                    color: textColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: isNarrow ? 22 : 40,
                    willChange: "transform, opacity",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: isNarrow
                            ? "1fr"
                            : isMedium
                              ? "minmax(180px,1fr) auto"
                              : "minmax(260px,1.25fr) auto minmax(210px,1fr)",
                        gridTemplateAreas: isNarrow
                            ? `"left" "center" "right"`
                            : isMedium
                              ? `"left center" "right right"`
                              : `"left center right"`,
                        alignItems: "center",
                        gap: isNarrow ? 24 : 36,
                        fontFamily: loaderFont.fontFamily,
                        fontSize: loaderFont.fontSize,
                        letterSpacing: loaderFont.letterSpacing,
                        lineHeight: loaderFont.lineHeight,
                        fontWeight: loaderFont.fontWeight,
                        fontStyle: loaderFont.fontStyle,
                        textTransform: "uppercase",
                    }}
                >
                    <ul
                        aria-label="Loading status list"
                        style={{
                            gridArea: "left",
                            listStyle: "none",
                            margin: 0,
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            justifySelf: "start",
                            minWidth: 0,
                        }}
                    >
                        {safeStatusLines.map((line, index) => {
                            const isActive = index === lineRevealData.activeLineIndex
                            const shownText = lineRevealData.items[index]?.shownText ?? line
                            const lineText = effectiveReducedMotion || isStaticRenderer ? line : shownText || " "
                            return (
                                <li
                                    key={`${line}-${index}`}
                                    style={{
                                        color: isActive ? accentColor : textColor,
                                        opacity: isActive ? 1 : 0.74,
                                        fontWeight: isActive ? 700 : loaderFont.fontWeight,
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                    }}
                                >
                                    {lineText}
                                </li>
                            )
                        })}
                    </ul>

                    <div
                        style={{
                            gridArea: "center",
                            justifySelf: "center",
                            textAlign: "center",
                            minWidth: "max-content",
                            color: accentColor,
                            fontSize: isNarrow ? "clamp(28px, 12vw, 44px)" : "clamp(30px, 5vw, 66px)",
                            letterSpacing: "0.08em",
                            lineHeight: "1em",
                            fontWeight: 700,
                        }}
                    >
                        {showPercentage ? `( ${String(progress).padStart(2, " ")}% )` : "( READY )"}
                    </div>

                    <div
                        style={{
                            gridArea: "right",
                            justifySelf: isNarrow ? "start" : "end",
                            textAlign: isNarrow ? "left" : "right",
                            whiteSpace: "pre-line",
                            maxWidth: isNarrow ? "100%" : 280,
                            opacity: 0.95,
                        }}
                    >
                        {message}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(LoadingOverlay, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#5525B8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#A7FF7A",
    },
    loaderDuration: {
        type: ControlType.Number,
        title: "Load (ms)",
        defaultValue: 3200,
        min: 100,
        max: 20000,
        step: 100,
        unit: "ms",
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade (ms)",
        defaultValue: 700,
        min: 0,
        max: 5000,
        step: 50,
        unit: "ms",
    },
    statusLines: {
        type: ControlType.Array,
        title: "Status",
        control: {
            type: ControlType.String,
            placeholder: "STATUS LINE",
        },
        defaultValue: defaultStatusLines,
        maxCount: 12,
    },
    message: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "WELCOME TO\nTHE EXPERIENCE",
        displayTextArea: true,
    },
    showPercentage: {
        type: ControlType.Boolean,
        title: "Percentage",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    reducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    soundEnabled: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    soundVolume: {
        type: ControlType.Number,
        title: "Volume",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.01,
        hidden(props) {
            return !props.soundEnabled
        },
    },
    soundInterval: {
        type: ControlType.Number,
        title: "Tick (ms)",
        defaultValue: 120,
        min: 16,
        max: 1500,
        step: 1,
        unit: "ms",
        hidden(props) {
            return !props.soundEnabled
        },
    },
    textAnimationSpeed: {
        type: ControlType.Number,
        title: "Type (ms)",
        defaultValue: 24,
        min: 8,
        max: 200,
        step: 1,
        unit: "ms",
    },
    loaderFont: {
        type: ControlType.Font,
        title: "Loader Font",
        defaultValue: {
            fontSize: "15px",
            letterSpacing: "0.04em",
            lineHeight: "1.5em",
        },
        controls: "extended",
        defaultFontType: "monospace",
    },
    children: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 1,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Loading overlay",
    },
})