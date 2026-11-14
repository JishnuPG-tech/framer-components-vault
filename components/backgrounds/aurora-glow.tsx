// @framerDisableUnlink
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
 * AisolAuroraBg
 * Soft, drifting gradient blobs over a dark base — a calm hero backdrop.
 * Drawn on one 2D canvas (resolution capped by Max DPR). The loop stops when the
 * component is off screen, when the tab is hidden and when the visitor asks for
 * reduced motion (a still frame is drawn instead). Without a 2D canvas, and in the
 * static renderer, the same blobs render as plain CSS gradients.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 480
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

interface Props {
    baseColor: string
    colorA: string
    colorB: string
    colorC: string
    speed: number
    blur: number
    intensity: number
    radius: number
    grain: boolean
    animateReduced: boolean
    maxDpr: number
    style?: React.CSSProperties
}

type XY = { x: number; y: number }
type Blob = { size: number; initial: XY; keys: XY[] }

// Positions are percentages of the blob's own box (same geometry as the original motion.div version).
const BLOBS: Blob[] = [
    { size: 0.7, initial: { x: -20, y: -15 }, keys: [{ x: -20, y: -15 }, { x: 30, y: 20 }, { x: -10, y: -5 }] },
    { size: 0.65, initial: { x: 40, y: 20 }, keys: [{ x: 40, y: 20 }, { x: 0, y: -10 }, { x: 50, y: 30 }] },
    { size: 0.6, initial: { x: 10, y: 50 }, keys: [{ x: 10, y: 50 }, { x: 45, y: 10 }, { x: 5, y: 45 }] },
]

const GRAIN =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"

const REDUCED_Q = "(prefers-reduced-motion: reduce)"
const SCHEME_Q = "(prefers-color-scheme: dark)"

/** Unwrap a Framer color token `var(--token-x, <fallback>)` to its fallback color. */
function tok(v: string | undefined, fallback: string): string {
    if (!v) return fallback
    const s = v.trim()
    if (!s.startsWith("var(")) return s
    const comma = s.indexOf(",")
    const end = s.lastIndexOf(")")
    if (comma < 0 || end <= comma) return fallback
    const inner = s.slice(comma + 1, end).trim()
    return inner ? tok(inner, fallback) : fallback
}

/** cubic-bezier(0.42, 0, 0.58, 1) — the "easeInOut" the original animation used. */
function easeInOut(x: number): number {
    if (x <= 0) return 0
    if (x >= 1) return 1
    const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * 0.42 + 3 * (1 - t) * t * t * 0.58 + t * t * t
    const by = (t: number) => 3 * (1 - t) * t * t + t * t * t
    let lo = 0
    let hi = 1
    let t = x
    for (let i = 0; i < 20; i++) {
        t = (lo + hi) / 2
        if (bx(t) < x) lo = t
        else hi = t
    }
    return by(t)
}

function cycleSeconds(speed: number, i: number): number {
    const dur = Math.max(4, 40 / Math.max(1, speed || 1))
    return dur * (1 + i * 0.25)
}

/** Blob offset (percent of its own box) at time t — 3 keyframes, eased per segment, mirrored repeat. */
function blobAt(b: Blob, i: number, t: number, speed: number): XY {
    const d = cycleSeconds(speed, i)
    let p = (t / d) % 2
    if (p > 1) p = 2 - p
    const q = p * (b.keys.length - 1)
    const seg = Math.min(b.keys.length - 2, Math.floor(q))
    const e = easeInOut(q - seg)
    const a = b.keys[seg]
    const c = b.keys[seg + 1]
    return { x: a.x + (c.x - a.x) * e, y: a.y + (c.y - a.y) * e }
}

function layerStyle(blur: number, intensity: number): React.CSSProperties {
    return {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        opacity: intensity,
        pointerEvents: "none",
    }
}

/** CSS-gradient blobs at their start positions: static renderer, SSR, and the no-canvas fallback. */
function CssBlobs(props: { colors: string[]; blur: number; intensity: number }) {
    return (
        <div className="aag-css" aria-hidden="true" style={layerStyle(props.blur, props.intensity)}>
            {BLOBS.map((b, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: `${b.size * 100}%`,
                        height: `${b.size * 100}%`,
                        borderRadius: "50%",
                        transform: `translate(${b.initial.x}%, ${b.initial.y}%)`,
                        background: `radial-gradient(circle, ${props.colors[i]} 0%, transparent 68%)`,
                        mixBlendMode: "screen",
                    }}
                />
            ))}
        </div>
    )
}

function Grain() {
    return (
        <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none", backgroundImage: GRAIN }}
        />
    )
}

function rootStyle(p: Props): React.CSSProperties {
    const vars: Record<string, string> = {
        "--aag-a": p.colorA,
        "--aag-b": p.colorB,
        "--aag-c": p.colorC,
    }
    return {
        position: "relative",
        width: "100%",
        height: "100%",
        // Only used when the height is auto (Fit Content): keeps the 800×480 shape instead of collapsing to 0.
        aspectRatio: "5 / 3",
        borderRadius: p.radius,
        overflow: "hidden",
        background: p.baseColor,
        ...vars,
        ...p.style,
    }
}

type Rgba = [number, number, number, number]

function LiveAurora(p: Props) {
    const rootRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [ready, setReady] = React.useState(false)
    const propsRef = React.useRef(p)
    propsRef.current = p
    const kickRef = React.useRef<() => void>(() => {})

    React.useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return
        let ctx: CanvasRenderingContext2D | null = null
        try {
            ctx = canvas.getContext("2d")
        } catch {
            ctx = null
        }
        if (!ctx) return // CSS-gradient fallback stays on screen
        const g = ctx

        let disposed = false
        let lost = false
        let onScreen = false // set by the first IntersectionObserver callback
        let tabVisible = typeof document === "undefined" || document.visibilityState !== "hidden"
        const mqReduced = typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_Q) : null
        const mqScheme = typeof window.matchMedia === "function" ? window.matchMedia(SCHEME_Q) : null
        let reduced = !!mqReduced && mqReduced.matches
        let raf = 0
        let last = -1
        let time = 0
        let W = 0
        let H = 0
        let colors: Rgba[] = []
        let drewOnce = false

        const parse = (c: string, fallback: string): Rgba => {
            g.fillStyle = "#000000"
            g.fillStyle = c
            const a = String(g.fillStyle)
            g.fillStyle = "#ffffff"
            g.fillStyle = c
            const b = String(g.fillStyle)
            const norm = a === b ? a : fallback
            if (norm.startsWith("#")) {
                const n = parseInt(norm.slice(1, 7), 16)
                return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
            }
            const m = norm.match(/[\d.]+/g)
            if (!m || m.length < 3) return [0, 0, 0, 1]
            return [+m[0], +m[1], +m[2], m.length > 3 ? +m[3] : 1]
        }
        const resolveColors = () => {
            const cs = getComputedStyle(root)
            const q = propsRef.current
            const src: [string, string, string][] = [
                ["--aag-a", q.colorA, "#6D5EF6"],
                ["--aag-b", q.colorB, "#2DD4BF"],
                ["--aag-c", q.colorC, "#E879F9"],
            ]
            colors = src.map(([v, raw, fb]) => {
                const live = cs.getPropertyValue(v).trim()
                const c = live && live.indexOf("var(") < 0 ? live : tok(raw, fb)
                return parse(c, fb)
            })
        }

        const animating = () => !reduced || propsRef.current.animateReduced
        const shouldRun = () => !disposed && !lost && onScreen && tabVisible && W > 0 && H > 0 && animating()

        const draw = () => {
            const cw = canvas.width
            const ch = canvas.height
            g.setTransform(1, 0, 0, 1, 0, 0)
            g.globalCompositeOperation = "source-over"
            g.clearRect(0, 0, cw, ch)
            if (!cw || !ch) return
            const t = animating() ? time : 0
            const speed = propsRef.current.speed
            g.globalCompositeOperation = "screen"
            for (let i = 0; i < BLOBS.length; i++) {
                const b = BLOBS[i]
                const pos = blobAt(b, i, t, speed)
                const w = b.size * cw
                const h = b.size * ch
                const cx = (pos.x / 100) * w + w / 2
                const cy = (pos.y / 100) * h + h / 2
                const R = Math.sqrt((w / 2) * (w / 2) + (h / 2) * (h / 2))
                const [r, gg, bb, a] = colors[i] || [0, 0, 0, 0]
                const grad = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(0.001, R))
                grad.addColorStop(0, `rgba(${r},${gg},${bb},${a})`)
                grad.addColorStop(0.68, `rgba(${r},${gg},${bb},0)`)
                g.save()
                g.beginPath()
                g.ellipse(cx, cy, Math.max(0.001, w / 2), Math.max(0.001, h / 2), 0, 0, Math.PI * 2)
                g.clip()
                g.fillStyle = grad
                g.fillRect(cx - w / 2, cy - h / 2, w, h)
                g.restore()
            }
            g.globalCompositeOperation = "source-over"
            if (!drewOnce) {
                drewOnce = true
                setReady(true)
            }
        }

        const frame = (now: number) => {
            raf = 0
            if (last >= 0) time += Math.min(0.1, Math.max(0, (now - last) / 1000))
            last = now
            draw()
            if (shouldRun()) raf = requestAnimationFrame(frame)
            else last = -1
        }
        const update = () => {
            const run = shouldRun()
            if (run && !raf) {
                last = -1
                raf = requestAnimationFrame(frame)
            } else if (!run && raf) {
                cancelAnimationFrame(raf)
                raf = 0
                last = -1
            }
        }
        const resize = () => {
            W = root.clientWidth
            H = root.clientHeight
            const cap = Math.max(0.25, Math.min(3, propsRef.current.maxDpr || 1))
            const dpr = Math.min(window.devicePixelRatio || 1, cap)
            const cw = Math.max(1, Math.round(W * dpr))
            const ch = Math.max(1, Math.round(H * dpr))
            if (canvas.width !== cw) canvas.width = cw
            if (canvas.height !== ch) canvas.height = ch
            if (!lost) draw()
            update()
        }

        const io = new IntersectionObserver((entries) => {
            const e = entries[entries.length - 1]
            onScreen = !!e && e.isIntersecting
            update()
        })
        io.observe(root)
        const ro = new ResizeObserver(() => resize())
        ro.observe(root)
        const onVis = () => {
            tabVisible = document.visibilityState !== "hidden"
            update()
        }
        document.addEventListener("visibilitychange", onVis)
        const onReduced = () => {
            reduced = !!mqReduced && mqReduced.matches
            if (!lost) draw()
            update()
        }
        const onScheme = () => {
            resolveColors()
            if (!lost) draw()
        }
        mqReduced?.addEventListener("change", onReduced)
        mqScheme?.addEventListener("change", onScheme)
        const onLost = (e: Event) => {
            e.preventDefault()
            lost = true
            drewOnce = false
            setReady(false)
            update()
        }
        const onRestored = () => {
            lost = false
            resolveColors()
            draw()
            update()
        }
        canvas.addEventListener("contextlost", onLost)
        canvas.addEventListener("contextrestored", onRestored)

        kickRef.current = () => {
            resolveColors()
            resize()
        }
        resolveColors()
        resize()

        return () => {
            disposed = true
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            io.disconnect()
            ro.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            mqReduced?.removeEventListener("change", onReduced)
            mqScheme?.removeEventListener("change", onScheme)
            canvas.removeEventListener("contextlost", onLost)
            canvas.removeEventListener("contextrestored", onRestored)
            kickRef.current = () => {}
        }
    }, [])

    // Settings changed → re-resolve colors, resize for a new DPR cap, redraw, re-evaluate the loop.
    React.useEffect(() => {
        kickRef.current()
    }, [p.colorA, p.colorB, p.colorC, p.speed, p.maxDpr, p.animateReduced])

    const cssColors = [p.colorA, p.colorB, p.colorC]
    return (
        <div ref={rootRef} className={ready ? "aag-root aag-canvas" : "aag-root aag-fallback"} aria-hidden="true" style={rootStyle(p)}>
            {!ready && <CssBlobs colors={cssColors} blur={p.blur} intensity={p.intensity} />}
            <canvas
                ref={canvasRef}
                className="aag-cv"
                aria-hidden="true"
                style={{ ...layerStyle(p.blur, p.intensity), display: "block", opacity: ready ? p.intensity : 0 }}
            />
            {p.grain && <Grain />}
        </div>
    )
}

function StaticAurora(p: Props) {
    return (
        <div className="aag-root aag-static" aria-hidden="true" style={rootStyle(p)}>
            <CssBlobs colors={[p.colorA, p.colorB, p.colorC]} blur={p.blur} intensity={p.intensity} />
            {p.grain && <Grain />}
        </div>
    )
}

export default function AisolAuroraBg(props: Partial<Props>) {
    const p: Props = {
        baseColor: props.baseColor ?? "#08080C",
        colorA: props.colorA ?? "#6D5EF6",
        colorB: props.colorB ?? "#2DD4BF",
        colorC: props.colorC ?? "#E879F9",
        speed: props.speed ?? 4,
        blur: props.blur ?? 70,
        intensity: props.intensity ?? 0.8,
        radius: props.radius ?? 0,
        grain: props.grain ?? true,
        animateReduced: props.animateReduced ?? false,
        maxDpr: props.maxDpr ?? 1,
        style: props.style,
    }
    const isStatic = useIsStaticRenderer()
    return isStatic ? <StaticAurora {...p} /> : <LiveAurora {...p} />
}

addPropertyControls(AisolAuroraBg, {
    baseColor: {
        type: ControlType.Color,
        title: "Base",
        defaultValue: "#08080C",
        description: "Background color behind the glow.",
    },
    colorA: {
        type: ControlType.Color,
        title: "Aurora 1",
        defaultValue: "#6D5EF6",
        description: "Largest blob, starts top left.",
    },
    colorB: {
        type: ControlType.Color,
        title: "Aurora 2",
        defaultValue: "#2DD4BF",
        description: "Middle blob, starts right.",
    },
    colorC: {
        type: ControlType.Color,
        title: "Aurora 3",
        defaultValue: "#E879F9",
        description: "Smallest blob, starts bottom.",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 0.5,
        description: "Drift speed. 4 = one sweep in about 10 s.",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 70,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        description: "Softness of the blobs.",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Glow opacity over the base color.",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        description: "Corner radius of the frame.",
    },
    grain: {
        type: ControlType.Boolean,
        title: "Grain",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Static film-grain texture on top (6% opacity).",
    },
    animateReduced: {
        type: ControlType.Boolean,
        title: "Animate anyway",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Off: visitors with reduced motion see a still frame. On: keep drifting for them too.",
    },
    maxDpr: {
        type: ControlType.Number,
        title: "Max DPR",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.25,
        description: "Caps canvas pixel density. The glow is blurred, so 1 is usually enough; higher draws more pixels.",
    },
})
