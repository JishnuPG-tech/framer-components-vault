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
 * Horizontal Text Scroll
 * ----------------------
 * A pinned, 100vh section. As the page scrolls, one line of text travels
 * horizontally. Letters entering from the right edge are randomly lifted,
 * dropped, tilted and scaled, then settle flat as they glide toward the
 * middle. When the text reaches its end position the section un-pins and the
 * page continues scrolling normally.
 *
 * HOW TO USE
 * 1. Add the component to a page and set its Height to "Fit" (Width: Fill).
 *    The component sizes itself to 100vh + Scroll Length.
 * 2. Make sure no parent frame has Overflow: Hidden / Scroll (it breaks pinning).
 *    Width can be Fill or Fit. With Fit it never collapses to 0: it falls
 *    back to the full viewport width (1440px on the canvas).
 * 3. Open Preview to scroll. On the canvas, use "Preview Progress" to scrub.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */

type Look = {
    font: React.CSSProperties
    color: string
    background: string
}

type Motion = {
    enabled: boolean
    falloff: number
    lift: number
    tilt: number
    scale: number
}

type Setup = {
    scrollLength: number
    smoothness: number
    startPosition: number
    endPosition: number
    verticalPosition: number
}

type Props = {
    text: string
    look: Look
    motion: Motion
    setup: Setup
    lengthUnit: "vh" | "px"
    speed: number
    canvasProgress: number
    style?: React.CSSProperties
}

const DEFAULT_LOOK: Look = {
    font: {
        fontSize: "120px",
        letterSpacing: "-0.03em",
        lineHeight: "1.1em",
    },
    color: "#1D1B1B",
    background: "#F0E2D8",
}

const DEFAULT_MOTION: Motion = {
    enabled: true,
    falloff: 0.5,
    lift: 1.7,
    tilt: 0.8,
    scale: 0.75,
}

const DEFAULT_SETUP: Setup = {
    scrollLength: 600,
    smoothness: 0.7,
    startPosition: 50,
    endPosition: 0,
    verticalPosition: 50,
}

// Fixed values (no longer exposed as controls)
const EFFECT_START = 70 // % of width where letters become perfectly flat
const SEED = 4 // random shuffle of letter motion

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

// Small deterministic hash -> [0, 1). Same seed + index = same letter motion.
function rng(n: number) {
    let t = (n + 0x6d2b79f5) | 0
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const visuallyHidden: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
}

export default function HorizontalTextScroll(props: Props) {
    const { text, lengthUnit, speed, canvasProgress, style } = props

    const setup = { ...DEFAULT_SETUP, ...(props.setup || {}) }
    const {
        scrollLength,
        smoothness,
        startPosition,
        endPosition,
        verticalPosition,
    } = setup

    const look = { ...DEFAULT_LOOK, ...(props.look || {}) }
    const motion = { ...DEFAULT_MOTION, ...(props.motion || {}) }
    const { font, color, background } = look
    const effect = motion.enabled
    const effectCurve = motion.falloff
    const offsetY = motion.lift
    const rotation = motion.tilt
    const scaleBoost = motion.scale
    const effectStart = EFFECT_START
    const seed = SEED

    const target = RenderTarget.current()
    const isStatic =
        target === RenderTarget.canvas || target === RenderTarget.thumbnail

    const outerRef = React.useRef<HTMLDivElement>(null)
    const stageRef = React.useRef<HTMLDivElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const charRefs = React.useRef<(HTMLSpanElement | null)[]>([])

    const chars = React.useMemo(
        () => Array.from((text || "").replace(/\s*\n\s*/g, " ")),
        [text]
    )

    // Per-letter random values (y: -1..1, r: -1..1, s: 0..1)
    const randoms = React.useMemo(
        () =>
            chars.map((_, i) => ({
                y: rng(seed * 7919 + i * 3) * 2 - 1,
                r: rng(seed * 7919 + i * 3 + 1) * 2 - 1,
                s: rng(seed * 7919 + i * 3 + 2),
            })),
        [chars, seed]
    )

    // Always-fresh props for the animation loop (no re-subscribing needed)
    const live = React.useRef({
        chars,
        randoms,
        startPosition,
        endPosition,
        speed,
        smoothness,
        effect,
        effectStart,
        effectCurve,
        offsetY,
        rotation,
        scaleBoost,
        isStatic,
        canvasProgress,
    })
    live.current = {
        chars,
        randoms,
        startPosition,
        endPosition,
        speed,
        smoothness,
        effect,
        effectStart,
        effectCurve,
        offsetY,
        rotation,
        scaleBoost,
        isStatic,
        canvasProgress,
    }

    const m = React.useRef({
        stageW: 0,
        stageH: 0,
        trackW: 0,
        centers: [] as number[],
        target: 0,
        current: 0,
        raf: 0,
        last: 0,
        reduced: false,
        lastT: [] as number[],
    })

    const apply = React.useCallback((p: number) => {
        const L = live.current
        const s = m.current
        const track = trackRef.current
        if (!track) return

        const startX = (s.stageW * L.startPosition) / 100
        const endRight = (s.stageW * L.endPosition) / 100
        const travel = Math.max(0, startX + s.trackW - endRight)
        const dx = -p * travel
        track.style.transform = `translate3d(${dx.toFixed(2)}px,-50%,0)`

        const doEffect = L.effect && !s.reduced
        const zero = (s.stageW * L.effectStart) / 100
        const span = Math.max(1, s.stageW - zero)

        for (let i = 0; i < L.chars.length; i++) {
            const el = charRefs.current[i]
            if (!el || L.chars[i].trim() === "") continue
            let t = 0
            if (doEffect) {
                const cx = startX + dx + (s.centers[i] || 0)
                t = Math.pow(clamp((cx - zero) / span), L.effectCurve)
            }
            if (t === 0 && s.lastT[i] === 0) continue
            s.lastT[i] = t
            if (t === 0) {
                el.style.transform = ""
                continue
            }
            const r = L.randoms[i]
            el.style.transform = `translate3d(0,${(r.y * L.offsetY * t).toFixed(
                4
            )}em,0) rotate(${(r.r * L.rotation * t).toFixed(3)}deg) scale(${(
                1 +
                r.s * L.scaleBoost * t
            ).toFixed(4)})`
        }
    }, [])

    const measure = React.useCallback(() => {
        const stage = stageRef.current
        const track = trackRef.current
        if (!stage || !track) return
        const s = m.current
        s.stageW = stage.clientWidth
        s.stageH = stage.clientHeight
        s.trackW = track.offsetWidth
        s.centers = charRefs.current.map((el) =>
            el ? el.offsetLeft + el.offsetWidth / 2 : 0
        )
        s.lastT = []
    }, [])

    const readTarget = React.useCallback(() => {
        const outer = outerRef.current
        if (!outer) return 0
        const s = m.current
        const rect = outer.getBoundingClientRect()
        const range = outer.offsetHeight - s.stageH
        if (range <= 0) return 0
        const raw = clamp(-rect.top / range)
        return clamp(raw * live.current.speed)
    }, [])

    const tick = React.useCallback(
        (now: number) => {
            const s = m.current
            const L = live.current
            const dt = Math.min(0.05, (now - s.last) / 1000 || 0.016)
            s.last = now

            const smooth = s.reduced ? 0 : L.smoothness
            if (smooth <= 0) {
                s.current = s.target
            } else {
                // Frame-rate independent damping (lower smoothness = snappier)
                const k = 1.5 + Math.pow(1 - clamp(smooth), 2) * 38
                s.current += (s.target - s.current) * (1 - Math.exp(-k * dt))
            }
            apply(s.current)

            if (Math.abs(s.target - s.current) > 0.00002) {
                s.raf = requestAnimationFrame(tick)
            } else {
                s.current = s.target
                apply(s.current)
                s.raf = 0
            }
        },
        [apply]
    )

    const kick = React.useCallback(() => {
        const s = m.current
        s.target = readTarget()
        if (!s.raf) {
            s.last = performance.now()
            s.raf = requestAnimationFrame(tick)
        }
    }, [readTarget, tick])

    // Live page: listen to scroll / resize / font load
    React.useEffect(() => {
        if (isStatic) return
        const s = m.current
        s.reduced =
            typeof window !== "undefined" &&
            !!window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        measure()
        s.target = readTarget()
        s.current = s.target
        apply(s.current)

        const onResize = () => {
            measure()
            s.target = readTarget()
            s.current = s.target
            apply(s.current)
        }
        window.addEventListener("scroll", kick, { passive: true })
        window.addEventListener("resize", onResize)

        let ro: ResizeObserver | undefined
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(onResize)
            if (stageRef.current) ro.observe(stageRef.current)
            if (trackRef.current) ro.observe(trackRef.current)
        }
        const fonts = (document as any).fonts
        if (fonts && fonts.ready) fonts.ready.then(onResize)

        return () => {
            window.removeEventListener("scroll", kick)
            window.removeEventListener("resize", onResize)
            ro && ro.disconnect()
            if (s.raf) cancelAnimationFrame(s.raf)
            s.raf = 0
        }
    }, [isStatic, measure, readTarget, apply, kick])

    // Re-measure + re-apply whenever any control changes
    const fontKey = JSON.stringify(font)
    React.useEffect(() => {
        measure()
        if (isStatic) {
            apply(clamp(canvasProgress / 100))
        } else {
            const s = m.current
            s.target = readTarget()
            s.current = s.target
            apply(s.current)
        }
    }, [
        isStatic,
        measure,
        readTarget,
        apply,
        text,
        fontKey,
        startPosition,
        endPosition,
        scrollLength,
        lengthUnit,
        speed,
        effect,
        effectStart,
        effectCurve,
        offsetY,
        rotation,
        scaleBoost,
        seed,
        canvasProgress,
        verticalPosition,
    ])

    const outerHeight = isStatic
        ? "100vh"
        : `calc(100vh + ${scrollLength}${lengthUnit})`

    return (
        <div
            ref={outerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: outerHeight,
                background,
            }}
        >
            <div
                ref={stageRef}
                style={{
                    position: isStatic ? "relative" : "sticky",
                    top: 0,
                    width: "100%",
                    height: "100vh",
                    overflow: "hidden",
                    background,
                }}
            >
                {/* In-flow sizer so "Fit" width never collapses to 0 */}
                <div
                    aria-hidden="true"
                    style={{
                        width: isStatic ? 1440 : "100vw",
                        maxWidth: "100%",
                        height: 0,
                        pointerEvents: "none",
                    }}
                />
                <span style={visuallyHidden}>{text}</span>
                <div
                    ref={trackRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: `${startPosition}%`,
                        top: `${verticalPosition}%`,
                        transform: "translate3d(0,-50%,0)",
                        whiteSpace: "pre",
                        willChange: "transform",
                        color,
                        fontFamily:
                            '"Inter", "Helvetica Neue", Arial, sans-serif',
                        fontWeight: 600,
                        fontSize: 120,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        userSelect: "none",
                        ...font,
                    }}
                >
                    {chars.map((c, i) => (
                        <span
                            key={i}
                            ref={(el) => {
                                charRefs.current[i] = el
                            }}
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre",
                                transformOrigin: "50% 60%",
                                willChange: "transform",
                            }}
                        >
                            {c}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

HorizontalTextScroll.defaultProps = {
    text: "Scroll through words that drift, tilt and settle into place.",
    look: DEFAULT_LOOK,
    motion: DEFAULT_MOTION,
    setup: DEFAULT_SETUP,
    lengthUnit: "vh",
    speed: 0.85,
    canvasProgress: 35,
}

addPropertyControls(HorizontalTextScroll, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "Scroll through words that drift, tilt and settle into place.",
        displayTextArea: true,
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        buttonTitle: "Font, Colors",
        defaultValue: DEFAULT_LOOK as any,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultFontSize: "120px",
                defaultValue: DEFAULT_LOOK.font as any,
            },
            color: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#1D1B1B",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#F0E2D8",
            },
        },
    },

    // ---- Scroll & position (single grouped control) ----
    setup: {
        type: ControlType.Object,
        title: "Scroll & Position",
        buttonTitle: "Edit Setup",
        defaultValue: DEFAULT_SETUP as any,
        controls: {
            scrollLength: {
                type: ControlType.Number,
                title: "Scroll Length",
                description: "How long the section stays pinned.",
                defaultValue: 600,
                min: 0,
                max: 5000,
                step: 10,
                displayStepper: true,
            },
            smoothness: {
                type: ControlType.Number,
                title: "Smoothness",
                defaultValue: 0.7,
                min: 0,
                max: 1,
                step: 0.01,
                displaySlider: true,
            },
            startPosition: {
                type: ControlType.Number,
                title: "Start X",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                displaySlider: true,
            },
            endPosition: {
                type: ControlType.Number,
                title: "End X",
                defaultValue: 0,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                displaySlider: true,
            },
            verticalPosition: {
                type: ControlType.Number,
                title: "Vertical",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                displaySlider: true,
            },
        },
    },
    lengthUnit: {
        type: ControlType.Enum,
        title: "Length Unit",
        options: ["vh", "px"],
        optionTitles: ["Viewport", "Pixels"],
        defaultValue: "vh",
        displaySegmentedControl: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description: "1 = text ends as the pin ends.",
        defaultValue: 0.85,
        min: 0.1,
        max: 3,
        step: 0.05,
        displaySlider: true,
    },

    // ---- Letter motion (single grouped control) ----
    motion: {
        type: ControlType.Object,
        title: "Letter Motion",
        buttonTitle: "Edit Motion",
        defaultValue: DEFAULT_MOTION as any,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            falloff: {
                type: ControlType.Number,
                title: "Falloff",
                defaultValue: 0.5,
                min: 0.1,
                max: 4,
                step: 0.05,
                displaySlider: true,
                hidden: (p: Motion) => !p.enabled,
            },
            lift: {
                type: ControlType.Number,
                title: "Lift / Drop",
                defaultValue: 1.7,
                min: 0,
                max: 3,
                step: 0.05,
                displaySlider: true,
                hidden: (p: Motion) => !p.enabled,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                defaultValue: 0.8,
                min: 0,
                max: 45,
                step: 0.1,
                unit: "°",
                displaySlider: true,
                hidden: (p: Motion) => !p.enabled,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale Boost",
                defaultValue: 0.75,
                min: 0,
                max: 2,
                step: 0.01,
                displaySlider: true,
                hidden: (p: Motion) => !p.enabled,
            },
        },
    },

    // ---- Canvas only ----
    canvasProgress: {
        type: ControlType.Number,
        title: "Preview Progress",
        description: "Canvas only. Scrub the animation.",
        defaultValue: 35,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        displaySlider: true,
    },
})
