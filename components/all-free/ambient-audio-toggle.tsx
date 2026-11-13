// AudioWave — Framer Marketplace Component
// Ambient audio player with SVG wave / bars animation
// Tap to toggle · Persists across Framer page navigation · Pauses on tab/app hide
//
// USAGE NOTES:
//   • Recommended audio format: MP3, 128 kbps or lower (smaller bundle size)
//   • Autoplay is blocked by browsers until the user has interacted with the page.
//     The component will not play on first load — this is expected browser behaviour.
//   • Multiple instances with different audio files are fully supported; each URL
//     maintains its own independent audio element and playback state.
//   • Loop can be toggled via the "Loop" property control.

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
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


// ─── Safe unique-ID hook ──────────────────────────────────────────────────────
// useId is React 18+; fall back to a stable counter for React 17 environments.
// Counter is seeded from a random base to survive HMR reloads in dev without
// producing confusing sequential IDs in the Framer canvas.

let _idCounter = Math.floor(Math.random() * 10_000)
function useSafeId(): string {
    const ref = useRef<string | null>(null)
    if (ref.current === null) {
        ref.current = `aw-${++_idCounter}`
    }
    return ref.current
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    audioUrl: string
    volume: number
    loop: boolean
    animation: "wave" | "bars"
    animationSpeed: number
    intensity: number
    barCount: number
    color: string
    restingColor: string
    strokeWidth: number
    endCap: "round" | "square"
    svgWidth: number
    svgHeight: number
    transitionSpeed: number
    restingLevel: number
    showLabel: boolean
    labelOnText: string
    labelOffText: string
    labelFont: any
    labelOnColor: string
    labelOffColor: string
    labelPosition: "left" | "right" | "top" | "bottom"
    labelGap: number
    style?: CSSProperties
}

// ─── Per-URL audio singleton map ──────────────────────────────────────────────
// Keyed by URL so multiple instances with different audio files never collide.
// Each entry tracks its own audio element, mount count, and inter-mount state.

interface AudioEntry {
    audio: HTMLAudioElement
    mounts: number
    wasPlaying: boolean
    resumeImmediate: boolean
    globalPhase: number
    releaseTimer: number | null
}

const _audioMap = new Map<string, AudioEntry>()

function acquireAudio(url: string): AudioEntry | null {
    if (typeof window === "undefined") return null

    let entry = _audioMap.get(url)

    if (!entry) {
        const audio = new Audio()
        audio.loop = true
        audio.preload = "auto"
        audio.src = url
        entry = {
            audio,
            mounts: 0,
            wasPlaying: false,
            resumeImmediate: false,
            globalPhase: 0,
            releaseTimer: null,
        }
        _audioMap.set(url, entry)
    }

    // Cancel any pending debounced pause
    if (entry.releaseTimer !== null) {
        window.clearTimeout(entry.releaseTimer)
        entry.releaseTimer = null
    }

    entry.mounts++

    // Resume playback across remounts
    if (entry.wasPlaying && entry.audio.paused) {
        entry.audio.play().catch(() => {})
        entry.wasPlaying = false
        entry.resumeImmediate = true
    }

    return entry
}

function releaseAudio(url: string): void {
    const entry = _audioMap.get(url)
    if (!entry) return

    entry.mounts = Math.max(0, entry.mounts - 1)

    if (entry.mounts === 0) {
        entry.wasPlaying = !entry.audio.paused
        if (typeof window !== "undefined") {
            if (entry.releaseTimer !== null)
                window.clearTimeout(entry.releaseTimer)
            // Debounced pause — avoids micro-pauses during Framer page transitions
            entry.releaseTimer = window.setTimeout(() => {
                entry!.releaseTimer = null
                if (entry!.mounts === 0) entry!.audio.pause()
            }, 250)
        } else {
            entry.audio.pause()
        }
    }
}

// ─── useRaf ───────────────────────────────────────────────────────────────────
// RAF loop that runs while `active` is true. Callback always reads the latest
// closure values via a ref — no need to restart the loop on prop changes.

function useRaf(active: boolean, cb: (dt: number) => void) {
    const cbRef = useRef(cb)
    cbRef.current = cb
    const rafRef = useRef<number | null>(null)
    const lastRef = useRef<number | null>(null)

    useEffect(() => {
        if (!active) {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            lastRef.current = null
            return
        }
        const tick = (t: number) => {
            const dt =
                lastRef.current === null ? 0 : (t - lastRef.current) / 1000
            lastRef.current = t
            cbRef.current(dt)
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            lastRef.current = null
        }
    }, [active])
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const easeInOutCubic = (x: number) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2

const env = (x: number) => Math.sin(x * Math.PI)

// ─── charClipStyle — module-level constant ────────────────────────────────────
// Defined once at module scope so it is never re-created inside a .map() call
// on every animation frame.

const CHAR_CLIP_STYLE: CSSProperties = {
    display: "inline-block",
    overflow: "hidden",
    paddingTop: "0.35em",
    paddingBottom: "0.35em",
    marginTop: "-0.35em",
    marginBottom: "-0.35em",
    verticalAlign: "middle",
}

function charInnerStyle(
    active: boolean,
    fromBelow: boolean,
    i: number,
    speed: number
): CSSProperties {
    const dur = Math.max(0.1, speed) * 0.75
    const delay = i * 0.028
    return {
        display: "inline-block",
        transform: active
            ? "translateY(0%)"
            : `translateY(${fromBelow ? "110%" : "-110%"})`,
        opacity: active ? 1 : 0,
        transition: [
            `transform ${dur}s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
            `opacity ${dur * 0.55}s ease ${delay}s`,
        ].join(", "),
        willChange: "transform, opacity",
    }
}

// ─── Safe font prop subset ────────────────────────────────────────────────────
// Framer's font object can contain non-CSS props that trigger console warnings
// when spread directly onto a DOM element. Extract only valid CSS properties.

function safeFontStyle(font: any): CSSProperties {
    if (!font || typeof font !== "object") return {}
    const {
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacing,
        lineHeight,
        textTransform,
        textDecoration,
    } = font
    return Object.fromEntries(
        Object.entries({
            fontSize,
            fontFamily,
            fontWeight,
            fontStyle,
            letterSpacing,
            lineHeight,
            textTransform,
            textDecoration,
        }).filter(([, v]) => v !== undefined)
    )
}

// ─── Focus ring style ─────────────────────────────────────────────────────────
// Injected once as a module-level constant — never re-evaluated during RAF.
// Each instance uses its own unique class (from useSafeId) to avoid conflicts.

const FOCUS_STYLE_BASE = `
    :focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(0,0,0,0.2); border-radius: 6px; }
    :focus:not(:focus-visible) { outline: none; box-shadow: none; }
`

function buildFocusStyle(cls: string): string {
    return FOCUS_STYLE_BASE.replace(
        /:focus-visible/g,
        `.${cls}:focus-visible`
    ).replace(
        /:focus:not\(:focus-visible\)/g,
        `.${cls}:focus:not(:focus-visible)`
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AudioWave(props: Props) {
    const {
        audioUrl = "",
        volume = 80,
        loop = true,
        animation = "wave",
        animationSpeed = 1,
        intensity = 1,
        barCount = 26,
        color = "#0099FF",
        restingColor = "#CCCCCC",
        strokeWidth = 3,
        endCap = "round",
        svgWidth = 240,
        svgHeight = 80,
        transitionSpeed = 0.8,
        restingLevel = 0.35,
        showLabel = true,
        labelOnText = "Sound On",
        labelOffText = "Sound Off",
        labelFont,
        labelOnColor = "#000000",
        labelOffColor = "#888888",
        labelPosition = "right",
        labelGap = 12,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    // Unique class per instance — scopes the focus ring CSS
    const focusClass = useSafeId()

    const strokeLinecap: "round" | "butt" =
        endCap === "round" ? "round" : "butt"
    const w = Math.max(16, svgWidth)
    const h = Math.max(16, svgHeight)

    // Minimum 44×44px tap target — WCAG 2.5.5
    const tapW = Math.max(w, 44)
    const tapH = Math.max(h, 44)

    // Allow full 0–1 range for restingLevel
    const resting = Math.max(0, Math.min(1, restingLevel))

    // ── State ────────────────────────────────────────────────────────────────

    const [isPlaying, setIsPlaying] = useState(false)
    const [playAmount, setPlayAmount] = useState(resting)
    const [phase, setPhase] = useState(0)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const entryRef = useRef<AudioEntry | null>(null)
    const playAmountRef = useRef(resting)
    const phaseRef = useRef(0)
    const rafTransRef = useRef<number | null>(null)
    const resumeWasPlayingRef = useRef(false)
    const desiredPlayingRef = useRef(false)
    const lastPointerWasTouchRef = useRef(false)

    // ── Audio lifecycle ──────────────────────────────────────────────────────

    useEffect(() => {
        if (isStatic || !audioUrl) return

        const entry = acquireAudio(audioUrl)
        if (!entry) return

        entryRef.current = entry
        const audio = entry.audio
        audioRef.current = audio

        // Sync loop prop
        audio.loop = loop

        // Apply volume immediately
        audio.volume = Math.max(0, Math.min(1, volume / 100))

        // Restore continuous phase from the entry
        phaseRef.current = entry.globalPhase
        setPhase(entry.globalPhase)

        // Re-read resting from the current render so stale values never stick
        const currentResting = Math.max(0, Math.min(1, restingLevel))

        const onPlay = () => setIsPlaying(true)
        const onPause = () => setIsPlaying(false)
        audio.addEventListener("play", onPlay)
        audio.addEventListener("pause", onPause)

        if (!audio.paused) {
            setIsPlaying(true)
            playAmountRef.current = 1
            setPlayAmount(1)
        } else if (entry.resumeImmediate) {
            entry.resumeImmediate = false
            playAmountRef.current = 1
            setPlayAmount(1)
        } else {
            playAmountRef.current = currentResting
            setPlayAmount(currentResting)
        }

        return () => {
            audio.removeEventListener("play", onPlay)
            audio.removeEventListener("pause", onPause)
            // Persist phase before unmount
            if (entryRef.current) {
                entryRef.current.globalPhase = phaseRef.current
            }
            releaseAudio(audioUrl)
        }
        // restingLevel intentionally included so a prop change on remount is caught
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, isStatic, restingLevel])

    // ── Volume ───────────────────────────────────────────────────────────────

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = Math.max(0, Math.min(1, volume / 100))
        }
    }, [volume])

    // ── Loop ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.loop = loop
        }
    }, [loop])

    // ── Pause on tab / app hide ───────────────────────────────────────────────
    // Covers: visibilitychange, blur/focus, pagehide/pageshow,
    // Page Lifecycle API freeze/resume (Chromium), iOS Safari bfcache.

    useEffect(() => {
        if (isStatic || typeof document === "undefined") return

        const pause = () => {
            const a = audioRef.current
            if (!a || a.paused) return
            resumeWasPlayingRef.current = desiredPlayingRef.current
            a.pause()
        }
        const resume = () => {
            if (!desiredPlayingRef.current && !resumeWasPlayingRef.current)
                return
            if (document.hidden) return
            const a = audioRef.current
            if (!a) return
            resumeWasPlayingRef.current = false
            a.play().catch(() => {
                resumeWasPlayingRef.current = true
            })
        }
        const onVisibility = () =>
            document.hidden ? pause() : setTimeout(resume, 0)
        const onFocus = () => setTimeout(resume, 0)
        const onPageShow = () => setTimeout(resume, 0)

        document.addEventListener("visibilitychange", onVisibility)
        window.addEventListener("blur", pause)
        window.addEventListener("focus", onFocus)
        window.addEventListener("pagehide", pause)
        window.addEventListener("pageshow", onPageShow)
        window.addEventListener("freeze", pause as EventListener)
        window.addEventListener("resume", resume as EventListener)

        return () => {
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("blur", pause)
            window.removeEventListener("focus", onFocus)
            window.removeEventListener("pagehide", pause)
            window.removeEventListener("pageshow", onPageShow)
            window.removeEventListener("freeze", pause as EventListener)
            window.removeEventListener("resume", resume as EventListener)
        }
    }, [isStatic])

    // ── Click handler ────────────────────────────────────────────────────────

    const handleClick = useCallback(() => {
        if (isStatic) return
        const a = audioRef.current
        if (!a) return
        if (a.paused) {
            desiredPlayingRef.current = true
            a.play().catch(() => {})
        } else {
            desiredPlayingRef.current = false
            a.pause()
        }
    }, [isStatic])

    // ── playAmount transition ─────────────────────────────────────────────────

    useEffect(() => {
        if (typeof window === "undefined") {
            const v = isPlaying ? 1 : resting
            playAmountRef.current = v
            setPlayAmount(v)
            return
        }
        const from = playAmountRef.current
        const to = isPlaying ? 1 : resting
        if (from === to) return
        const dur = Math.max(60, transitionSpeed * 1000)
        const t0 = performance.now()
        const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / dur)
            const v = from + (to - from) * easeInOutCubic(p)
            playAmountRef.current = v
            setPlayAmount(v)
            if (p < 1) rafTransRef.current = requestAnimationFrame(tick)
        }
        if (rafTransRef.current !== null)
            cancelAnimationFrame(rafTransRef.current)
        rafTransRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafTransRef.current !== null) {
                cancelAnimationFrame(rafTransRef.current)
                rafTransRef.current = null
            }
        }
    }, [isPlaying, transitionSpeed, resting])

    // ── Phase loop ───────────────────────────────────────────────────────────

    useRaf(!isStatic && isPlaying, (dt) => {
        phaseRef.current +=
            dt * Math.PI * 2 * Math.max(0.01, animationSpeed) * 0.6
        if (entryRef.current) {
            entryRef.current.globalPhase = phaseRef.current
        }
        setPhase(phaseRef.current)
    })

    // ── SVG geometry ─────────────────────────────────────────────────────────

    const computed = useMemo(() => {
        const a = Math.max(0, Math.min(1, playAmount))
        const ph = phase
        const upx = 100 / w
        const upy = 100 / h
        const capPx = endCap === "round" ? Math.max(1, strokeWidth / 2) : 0
        const px = Math.min(12, capPx * upx)
        const py = Math.min(12, capPx * upy)
        const cy = (y: number) => Math.max(py, Math.min(100 - py, y))

        const path = (fn: (x: number) => number) => {
            const pts: string[] = []
            for (let i = 0; i <= 120; i++) {
                const x01 = i / 120
                pts.push(
                    `${(px + x01 * (100 - px * 2)).toFixed(2)},${fn(x01).toFixed(2)}`
                )
            }
            return `M ${pts.join(" L ")}`
        }

        if (animation === "wave") {
            return {
                kind: "path" as const,
                d:
                    a <= 0.0001
                        ? path(() => 50)
                        : path((x) =>
                              cy(
                                  50 +
                                      Math.sin(x * Math.PI * 6 + ph * 1.05) *
                                          env(x) *
                                          18 *
                                          intensity *
                                          a
                              )
                          ),
            }
        }

        // Bars
        const count = Math.max(2, Math.round(barCount))
        const restHalf = endCap === "round" ? 0 : (strokeWidth * upy) / 2
        const barPad = Math.min(6, Math.max(0.5, (strokeWidth / 2) * upx))
        const bars = Array.from({ length: count }, (_, i) => {
            const x01 = count <= 1 ? 0.5 : i / (count - 1)
            const edgeEnv = 0.3 + 0.7 * Math.pow(Math.sin(x01 * Math.PI), 0.5)
            const lfo =
                0.35 +
                0.65 *
                    (0.5 +
                        0.5 *
                            Math.sin(
                                ph * (1.15 + i * 0.015) +
                                    i * 0.9 +
                                    Math.sin(ph * 0.4 + i * 0.2) * 0.6
                            ))
            const target = (6 + 38 * lfo) * edgeEnv * intensity
            return Math.max(0, restHalf + (Math.min(46, target) - restHalf) * a)
        })
        return { kind: "bars" as const, bars, count, barPad }
    }, [
        animation,
        intensity,
        playAmount,
        phase,
        barCount,
        strokeWidth,
        endCap,
        w,
        h,
    ])

    // ── Derived ──────────────────────────────────────────────────────────────

    const flexDir: CSSProperties["flexDirection"] =
        labelPosition === "top"
            ? "column-reverse"
            : labelPosition === "bottom"
              ? "column"
              : labelPosition === "left"
                ? "row-reverse"
                : "row"

    const onChars = useMemo(() => labelOnText.split(""), [labelOnText])
    const offChars = useMemo(() => labelOffText.split(""), [labelOffText])
    const fontStyle = useMemo(() => safeFontStyle(labelFont), [labelFont])
    // Only build + inject focus style in non-static renders
    const focusStyle = useMemo(
        () => (!isStatic ? buildFocusStyle(focusClass) : ""),
        [focusClass, isStatic]
    )

    // ── Canvas empty-state ───────────────────────────────────────────────────
    // Show a helpful placeholder when no audio file has been selected yet.

    if (isStatic && !audioUrl) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: 0.4,
                    userSelect: "none",
                }}
            >
                <svg
                    viewBox="0 0 100 40"
                    style={{ width: 80, height: 32 }}
                    aria-hidden
                >
                    <path
                        d="M5,20 Q10,10 15,20 Q20,30 25,20 Q30,10 35,20 Q40,30 45,20 Q50,10 55,20 Q60,30 65,20 Q70,10 75,20 Q80,30 85,20 Q90,10 95,20"
                        stroke={restingColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>
                <span
                    style={{
                        fontSize: 13,
                        color: restingColor,
                        fontFamily: "sans-serif",
                    }}
                >
                    No audio file
                </span>
            </div>
        )
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            {/* Focus ring — only injected in live (non-static) renders */}
            {!isStatic && <style>{focusStyle}</style>}
            <div
                className={isStatic ? undefined : focusClass}
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    minWidth: tapW,
                    minHeight: tapH,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isStatic ? "default" : "pointer",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    outline: "none",
                }}
                role="button"
                aria-label={
                    isPlaying ? "Pause ambient audio" : "Play ambient audio"
                }
                aria-pressed={isPlaying}
                tabIndex={isStatic ? -1 : 0}
                onClick={
                    isStatic
                        ? undefined
                        : () => {
                              if (lastPointerWasTouchRef.current) {
                                  lastPointerWasTouchRef.current = false
                                  return
                              }
                              handleClick()
                          }
                }
                onPointerUp={
                    isStatic
                        ? undefined
                        : (e) => {
                              if (e.pointerType !== "mouse") {
                                  e.preventDefault()
                                  lastPointerWasTouchRef.current = true
                                  handleClick()
                              }
                          }
                }
                onKeyDown={
                    isStatic
                        ? undefined
                        : (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  handleClick()
                              }
                          }
                }
            >
                {/* ── Inner flex row/column ── */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: flexDir,
                        alignItems: "center",
                        justifyContent: "center",
                        gap: labelGap,
                    }}
                >
                    {/* ── SVG waveform ── */}
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{
                            display: "block",
                            overflow: "visible",
                            flexShrink: 0,
                            alignSelf: "center",
                            width: w,
                            height: h,
                        }}
                        focusable={"false" as any}
                        aria-hidden={true}
                    >
                        {computed.kind === "path" ? (
                            <path
                                d={computed.d}
                                stroke={isPlaying ? color : restingColor}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeLinecap={strokeLinecap}
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        ) : (
                            <g>
                                {computed.bars.map((half, i) => {
                                    const x =
                                        computed.count <= 1
                                            ? 50
                                            : computed.barPad +
                                              (i / (computed.count - 1)) *
                                                  (100 - computed.barPad * 2)
                                    return (
                                        <line
                                            key={i}
                                            x1={x}
                                            y1={50 - half}
                                            x2={x}
                                            y2={50 + half}
                                            stroke={
                                                isPlaying ? color : restingColor
                                            }
                                            strokeWidth={strokeWidth}
                                            strokeLinecap={strokeLinecap}
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    )
                                })}
                            </g>
                        )}
                    </svg>

                    {/* ── Label ── */}
                    {showLabel && (
                        <div
                            style={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                                alignSelf: "center",
                            }}
                        >
                            {/* Playing label — chars slide in from below */}
                            <span
                                aria-hidden={!isPlaying}
                                style={{
                                    ...fontStyle,
                                    color: labelOnColor,
                                    whiteSpace: "nowrap",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    pointerEvents: "none",
                                }}
                            >
                                {onChars.map((c, i) => (
                                    <span key={i} style={CHAR_CLIP_STYLE}>
                                        <span
                                            style={charInnerStyle(
                                                isPlaying,
                                                true,
                                                i,
                                                transitionSpeed
                                            )}
                                        >
                                            {c === " " ? "\u00A0" : c}
                                        </span>
                                    </span>
                                ))}
                            </span>

                            {/* Paused label — in flow to size container */}
                            <span
                                aria-hidden={isPlaying}
                                style={{
                                    ...fontStyle,
                                    color: labelOffColor,
                                    whiteSpace: "nowrap",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    pointerEvents: "none",
                                    visibility: isPlaying
                                        ? "hidden"
                                        : "visible",
                                }}
                            >
                                {offChars.map((c, i) => (
                                    <span key={i} style={CHAR_CLIP_STYLE}>
                                        <span
                                            style={charInnerStyle(
                                                !isPlaying,
                                                false,
                                                i,
                                                transitionSpeed
                                            )}
                                        >
                                            {c === " " ? "\u00A0" : c}
                                        </span>
                                    </span>
                                ))}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(AudioWave, {
    // ── Audio ────────────────────────────────────────────────────────────────
    audioUrl: {
        type: ControlType.File,
        title: "Audio File",
        allowedFileTypes: ["mp3", "wav", "ogg", "m4a"],
    },
    volume: {
        type: ControlType.Number,
        title: "Volume",
        defaultValue: 80,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // ── Animation ────────────────────────────────────────────────────────────
    animation: {
        type: ControlType.Enum,
        title: "Style",
        options: ["wave", "bars"],
        optionTitles: ["Wave", "Bars"],
        defaultValue: "wave",
        displaySegmentedControl: true,
    },
    barCount: {
        type: ControlType.Number,
        title: "Bar Count",
        defaultValue: 26,
        min: 4,
        max: 80,
        step: 1,
        hidden: (p) => p.animation !== "bars",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.2,
        max: 4,
        step: 0.1,
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 1,
        min: 0.2,
        max: 2.5,
        step: 0.1,
        description: "Peak amplitude of the animation. Higher = more dramatic.",
    },
    transitionSpeed: {
        type: ControlType.Number,
        title: "Transition Speed",
        defaultValue: 0.8,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
        description: "How long the play/pause animation transition takes.",
    },
    restingLevel: {
        type: ControlType.Number,
        title: "Paused Height",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        description:
            "Animation height when paused. 0 = flat line, 1 = full height.",
    },

    // ── Appearance ───────────────────────────────────────────────────────────
    color: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#0099FF",
    },
    restingColor: {
        type: ControlType.Color,
        title: "Inactive Color",
        defaultValue: "#CCCCCC",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Line Weight",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    endCap: {
        type: ControlType.Enum,
        title: "Line Cap",
        options: ["round", "square"],
        optionTitles: ["Rounded", "Square"],
        defaultValue: "round",
        displaySegmentedControl: true,
    },
    svgWidth: {
        type: ControlType.Number,
        title: "Waveform Width",
        defaultValue: 240,
        min: 16,
        max: 800,
        step: 4,
        unit: "px",
    },
    svgHeight: {
        type: ControlType.Number,
        title: "Waveform Height",
        defaultValue: 80,
        min: 16,
        max: 400,
        step: 4,
        unit: "px",
    },

    // ── Label ────────────────────────────────────────────────────────────────
    showLabel: {
        type: ControlType.Boolean,
        title: "Label",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    labelOnText: {
        type: ControlType.String,
        title: "Playing Text",
        defaultValue: "Sound On",
        hidden: (p) => p.showLabel === false,
    },
    labelOffText: {
        type: ControlType.String,
        title: "Paused Text",
        defaultValue: "Sound Off",
        hidden: (p) => p.showLabel === false,
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["left", "right", "top", "bottom"],
        optionTitles: ["Left", "Right", "Top", "Bottom"],
        defaultValue: "right",
        hidden: (p) => p.showLabel === false,
    },
    labelGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 48,
        step: 2,
        unit: "px",
        hidden: (p) => p.showLabel === false,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: 1,
        },
        hidden: (p) => p.showLabel === false,
    },
    labelOnColor: {
        type: ControlType.Color,
        title: "Playing Text Color",
        defaultValue: "#000000",
        hidden: (p) => p.showLabel === false,
    },
    labelOffColor: {
        type: ControlType.Color,
        title: "Paused Text Color",
        defaultValue: "#888888",
        hidden: (p) => p.showLabel === false,
    },
})
