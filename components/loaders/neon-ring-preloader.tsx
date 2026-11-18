import { useEffect, useId, useRef, useState } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimationControls } from "framer-motion"

/**
 * PRELOADER  — Neon Ring
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const EXIT_EASE = "cubic-bezier(0.76, 0, 0.24, 1)"
const SESSION_KEY = "pl-neon-ring"
const TICKS = 60
const R = 70
const C = 2 * Math.PI * R

const DEFAULT_COLORS = {
    background: "#07080C",
    accent: "#3DF2C5",
    accentEnd: "#7A5CFF",
    track: "#2A2E3B",
    text: "#E8F7F3",
}

const DEFAULT_TIMING = {
    minDuration: 1600,
    hold: 300,
    exit: 800,
}

const DEFAULT_FONT = { fontSize: "40px", fontWeight: 500 }

if (
    typeof document !== "undefined" &&
    RenderTarget.current() !== RenderTarget.canvas
) {
    try {
        document.documentElement.style.overflowY = "scroll"
    } catch (e) {}
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduced(mq.matches)
        const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
        mq.addEventListener?.("change", onChange)
        return () => mq.removeEventListener?.("change", onChange)
    }, [])
    return reduced
}

type Props = {
    colors: typeof DEFAULT_COLORS
    font: CSSProperties
    timing: typeof DEFAULT_TIMING
    showOnce: boolean
    previewPercent: number
    style?: CSSProperties
}

export default function NeonRing(props: Props) {
    const { font, showOnce, previewPercent, style } = props
    const colors = { ...DEFAULT_COLORS, ...props.colors }
    const timing = { ...DEFAULT_TIMING, ...props.timing }
    const { background, accent, accentEnd, track, text } = colors
    const { minDuration, hold: holdMs, exit: exitDuration } = timing

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const uid = useId().replace(/:/g, "")

    const gatedRef = useRef<boolean | null>(null)
    if (gatedRef.current === null) {
        if (typeof window !== "undefined" && showOnce) {
            try {
                gatedRef.current = sessionStorage.getItem(SESSION_KEY) !== null
            } catch (e) {
                gatedRef.current = false
            }
        } else {
            gatedRef.current = false
        }
    }
    const gated = gatedRef.current === true

    const [phase, setPhase] = useState<"load" | "exit" | "done">("load")
    const [pct, setPct] = useState(0)
    const [lit, setLit] = useState(0)
    const [visible, setVisible] = useState(true)

    const rootRef = useRef<HTMLDivElement>(null)
    const ringRef = useRef<SVGCircleElement>(null)
    const displayedRef = useRef(0)
    const spinControls = useAnimationControls()

    const gone = !isStatic && (reducedMotion || gated || phase === "done")
    const active = !isStatic && !reducedMotion && !gated && phase !== "done"

    useEffect(() => {
        if (!active || phase !== "load") return
        let raf: number | null = null
        let holdTimer: any = null
        let pageLoaded = document.readyState === "complete"
        const onLoad = () => {
            pageLoaded = true
        }
        window.addEventListener("load", onLoad)

        const t0 = performance.now()
        let last = t0
        const tick = () => {
            const now = performance.now()
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const ready = pageLoaded && now - t0 >= minDuration
            const target = ready ? 100 : 90
            const tau = ready ? 0.25 : 0.55
            const cur = displayedRef.current
            const next = cur + (target - cur) * (1 - Math.exp(-dt / tau))
            displayedRef.current = next

            ringRef.current?.setAttribute(
                "stroke-dashoffset",
                String(C * (1 - next / 100))
            )
            const rounded = Math.min(100, Math.round(next))
            setPct((prev) => (prev === rounded ? prev : rounded))
            const litNow = Math.min(TICKS, Math.floor((next / 100) * TICKS))
            setLit((prev) => (prev === litNow ? prev : litNow))

            if (ready && next >= 99.6) {
                displayedRef.current = 100
                ringRef.current?.setAttribute("stroke-dashoffset", "0")
                setPct(100)
                setLit(TICKS)
                holdTimer = setTimeout(() => setPhase("exit"), holdMs)
                return
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        return () => {
            window.removeEventListener("load", onLoad)
            if (raf !== null) cancelAnimationFrame(raf)
            clearTimeout(holdTimer)
        }
    }, [active, phase, minDuration, holdMs])

    useEffect(() => {
        if (phase !== "exit") return
        try {
            if (showOnce) sessionStorage.setItem(SESSION_KEY, "1")
        } catch (e) {}
        const id = setTimeout(() => setPhase("done"), exitDuration + 160)
        return () => clearTimeout(id)
    }, [phase, exitDuration, showOnce])

    useEffect(() => {
        if (typeof document === "undefined" || !active) return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = prev
        }
    }, [active])

    useEffect(() => {
        if (isStatic || gone) return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.1 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, gone])

    useEffect(() => {
        if (isStatic || gone) return
        if (visible) {
            spinControls.start({
                rotate: 360,
                transition: { duration: 24, repeat: Infinity, ease: "linear" },
            })
        } else {
            spinControls.stop()
        }
    }, [visible, isStatic, gone])

    useEffect(() => {
        if (!gone) return
        const wrapper = rootRef.current?.parentElement
        if (wrapper) {
            wrapper.style.pointerEvents = "none"
            wrapper.style.display = "none"
        }
    }, [gone])

    if (gone) return <div ref={rootRef} style={{ display: "none" }} />

    const exiting = phase === "exit"
    const shownPct = isStatic ? previewPercent : pct
    const litCount = isStatic ? Math.floor((previewPercent / 100) * TICKS) : lit
    const initialOffset = isStatic ? C * (1 - previewPercent / 100) : C

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: isStatic ? "relative" : "fixed",
                inset: 0,
                width: isStatic ? style?.width : undefined,
                height: isStatic ? style?.height : undefined,
                zIndex: 9999,
                overflow: "hidden",
                background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: exiting ? 0 : 1,
                transition: isStatic
                    ? "none"
                    : `opacity ${exitDuration}ms ${EXIT_EASE} 100ms`,
                pointerEvents: exiting ? "none" : "auto",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "min(70vmin, 420px)",
                    aspectRatio: "1 / 1",
                    transform: exiting ? "scale(1.5)" : "scale(1)",
                    transition: isStatic
                        ? "none"
                        : `transform ${exitDuration}ms ${EXIT_EASE}`,
                }}
            >
                <svg
                    viewBox="0 0 200 200"
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "visible",
                    }}
                >
                    <defs>
                        <linearGradient
                            id={`g${uid}`}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                        >
                            <stop offset="0%" stopColor={accent} />
                            <stop offset="100%" stopColor={accentEnd} />
                        </linearGradient>
                        <filter
                            id={`f${uid}`}
                            x="-30%"
                            y="-30%"
                            width="160%"
                            height="160%"
                        >
                            <feGaussianBlur stdDeviation="3" result="b" />
                            <feMerge>
                                <feMergeNode in="b" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <motion.g
                        animate={spinControls}
                        style={{
                            transformOrigin: "center",
                            transformBox: "fill-box",
                        }}
                    >
                        <circle
                            cx="100"
                            cy="100"
                            r="97"
                            fill="none"
                            stroke={track}
                            strokeWidth="1"
                            strokeDasharray="2 6"
                        />
                    </motion.g>

                    {Array.from({ length: TICKS }).map((_, i) => {
                        const on = i < litCount
                        return (
                            <line
                                key={i}
                                x1="100"
                                y1="10"
                                x2="100"
                                y2={on ? 22 : 18}
                                transform={`rotate(${i * 6} 100 100)`}
                                stroke={on ? accent : track}
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                filter={on ? `url(#f${uid})` : undefined}
                                style={{ transition: "stroke 0.2s" }}
                            />
                        )
                    })}

                    <circle
                        cx="100"
                        cy="100"
                        r={R}
                        fill="none"
                        stroke={track}
                        strokeWidth="2"
                        opacity="0.5"
                    />
                    <circle
                        ref={ringRef}
                        cx="100"
                        cy="100"
                        r={R}
                        fill="none"
                        stroke={`url(#g${uid})`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={C}
                        strokeDashoffset={initialOffset}
                        transform="rotate(-90 100 100)"
                        filter={`url(#f${uid})`}
                    />
                </svg>

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: text,
                        fontVariantNumeric: "tabular-nums",
                        ...font,
                    }}
                >
                    {shownPct}%
                </div>
            </div>
        </div>
    )
}

NeonRing.defaultProps = {
    colors: DEFAULT_COLORS,
    font: DEFAULT_FONT,
    timing: DEFAULT_TIMING,
    showOnce: false,
    previewPercent: 72,
}

addPropertyControls(NeonRing, {
    // — Appearance —
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        defaultValue: DEFAULT_COLORS,
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_COLORS.background,
            },
            accent: {
                type: ControlType.Color,
                title: "Accent Start",
                defaultValue: DEFAULT_COLORS.accent,
            },
            accentEnd: {
                type: ControlType.Color,
                title: "Accent End",
                defaultValue: DEFAULT_COLORS.accentEnd,
            },
            track: {
                type: ControlType.Color,
                title: "Track",
                defaultValue: DEFAULT_COLORS.track,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: DEFAULT_COLORS.text,
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULT_FONT,
    },

    // — Timing —
    timing: {
        type: ControlType.Object,
        title: "Timing",
        defaultValue: DEFAULT_TIMING,
        controls: {
            minDuration: {
                type: ControlType.Number,
                title: "Min Time",
                min: 400,
                max: 5000,
                step: 100,
                unit: "ms",
                defaultValue: DEFAULT_TIMING.minDuration,
                description: "Floor so the preloader always registers.",
            },
            hold: {
                type: ControlType.Number,
                title: "Hold",
                min: 0,
                max: 1500,
                step: 50,
                unit: "ms",
                defaultValue: DEFAULT_TIMING.hold,
                description: "Pause at 100% before the exit.",
            },
            exit: {
                type: ControlType.Number,
                title: "Exit",
                min: 300,
                max: 1600,
                step: 50,
                unit: "ms",
                defaultValue: DEFAULT_TIMING.exit,
                description: "Duration of the zoom and fade-out.",
            },
        },
    },

    // — Behavior —
    showOnce: {
        type: ControlType.Boolean,
        title: "Frequency",
        enabledTitle: "Once",
        disabledTitle: "Always",
        defaultValue: false,
        description: "Once per session, or on every load.",
    },

    // — Canvas only —
    previewPercent: {
        type: ControlType.Number,
        title: "Preview",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 72,
        description: "Progress shown on the canvas only.",
    },
})
