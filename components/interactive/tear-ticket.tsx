// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    animate,
    useMotionValue,
    useMotionTemplate,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// ─────────────────────────────────────────────────────────────
// Motion presets: card stock is light but stiff. Nothing bounces.
// ─────────────────────────────────────────────────────────────

const HEAVY = { type: "spring", stiffness: 260, damping: 32, mass: 1.2 } as const
const SETTLE = { type: "spring", stiffness: 190, damping: 27, mass: 1 } as const
const FALL = { duration: 0.85, ease: [0.55, 0, 0.85, 0.4] } as const
const QUICK = { duration: 0.2, ease: "easeOut" } as const

// Foil presets. Highlights stop short of pure white, darks short of black.
const FOILS: Record<string, string> = {
    gold: "linear-gradient(100deg, #6b4d1e 0%, #a8813a 12%, #e9cf86 24%, #fbf0c8 31%, #c39a45 40%, #7a5822 52%, #b88f3e 62%, #f3dd9a 72%, #fdf3d2 77%, #b38a3c 87%, #6e5020 100%)",
    silver: "linear-gradient(100deg, #5d6168 0%, #8f959d 12%, #d5d9de 24%, #f3f4f6 31%, #aab0b8 40%, #666b72 52%, #9aa0a8 62%, #e1e4e8 72%, #f5f6f7 77%, #9ca2aa 87%, #5f636a 100%)",
    rose: "linear-gradient(100deg, #7c4237 0%, #b26f60 12%, #e8b3a2 24%, #fbe3d8 31%, #c88676 40%, #84493d 52%, #b97a6a 62%, #f0c5b5 72%, #fde9df 77%, #b47567 87%, #7a4136 100%)",
    pumpkin: "linear-gradient(100deg, #b8400a 0%, #e0601a 12%, #ff9a4d 24%, #ffd2a6 31%, #f07424 40%, #c04a0e 52%, #ec6c20 62%, #ffad6b 72%, #ffdcbc 77%, #e86a1e 87%, #b8400a 100%)",
    copper: "linear-gradient(100deg, #5e2f16 0%, #94522a 12%, #d9915c 24%, #f6c99d 31%, #b06a37 40%, #6a3519 52%, #a65f31 62%, #e8a875 72%, #f9d7b4 77%, #a35d30 87%, #5c2e15 100%)",
}

// Tiled SVG noise as data URIs: fine grain + long paper fibers.
const GRAIN_TILE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`
const FIBER_TILE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.38' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>")`
// Worn ink mask for the stamp, so it reads as pressed rather than printed by a machine.
const WORN_MASK = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='w'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.4 2.05'/></filter><rect width='100%' height='100%' filter='url(%23w)'/></svg>")`

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function mix(color: string, pct: number, other = "transparent") {
    return `color-mix(in srgb, ${color} ${pct}%, ${other})`
}

function seeded(seed: number) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function hashString(s: string) {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

function parseBox(v: any, fb: number): [number, number, number, number] {
    if (typeof v === "number" && isFinite(v)) return [v, v, v, v]
    const n = String(v ?? "")
        .trim()
        .split(/\s+/)
        .map((p) => parseFloat(p))
        .filter((x) => !isNaN(x))
    if (n.length === 0) return [fb, fb, fb, fb]
    if (n.length === 1) return [n[0], n[0], n[0], n[0]]
    if (n.length === 2) return [n[0], n[1], n[0], n[1]]
    if (n.length === 3) return [n[0], n[1], n[2], n[1]]
    return [n[0], n[1], n[2], n[3]]
}

// Framer injects font color both as `color` and `--framer-font-color`. Strip both, set ours.
// `scale` shrinks the font for narrow frames, never below `min` of its size.
function fontWith(font: any, color: string, scale = 1, min = 0) {
    const { color: _c, ["--framer-font-color"]: _v, ...rest } = font || {}
    const out: any = { ...rest, color, ["--framer-font-color"]: color }
    if (scale !== 1) {
        const px = typeof rest.fontSize === "number" ? rest.fontSize : parseFloat(rest.fontSize)
        if (isFinite(px)) out.fontSize = Math.max(min, px * scale) + "px"
    }
    return out
}

function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v))
}

// Perforated edge mask: two corner notches + half-holes along the tear line.
// Each piece carries half of every hole, so joined they read as full punches
// and once torn each edge is properly scalloped.
function perfMask(side: "left" | "right", notch: number, hole: number, spacing: number) {
    const x = side === "right" ? "100%" : "0%"
    const toward = side === "right" ? "to left" : "to right"
    const n = Math.max(0, notch)
    const h = Math.max(0.5, hole)
    const s = Math.max(h * 2 + 2, spacing)
    const images = [
        `radial-gradient(circle at ${x} 0%, transparent ${n}px, #000 ${n + 0.6}px)`,
        `radial-gradient(circle at ${x} 100%, transparent ${n}px, #000 ${n + 0.6}px)`,
        `radial-gradient(circle at ${x} 50%, transparent ${h}px, #000 ${h + 0.6}px)`,
        `linear-gradient(${toward}, transparent ${h * 2}px, #000 ${h * 2}px)`,
    ].join(", ")
    const sizes = `100% 100%, 100% 100%, ${h * 2}px ${s}px, 100% 100%`
    const positions = `0 0, 0 0, ${x} 50%, 0 0`
    const repeats = "no-repeat, no-repeat, repeat-y, no-repeat"
    return {
        WebkitMaskImage: images,
        maskImage: images,
        WebkitMaskSize: sizes,
        maskSize: sizes,
        WebkitMaskPosition: positions,
        maskPosition: positions,
        WebkitMaskRepeat: repeats,
        maskRepeat: repeats,
        WebkitMaskComposite: "source-in, source-in, source-over, source-over",
        maskComposite: "intersect, intersect, add, add",
    } as any
}

// ── Sound: synthesized paper, no audio files ──
let audioCtx: AudioContext | null = null
function getAudio(): AudioContext | null {
    try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AC) return null
        if (!audioCtx) audioCtx = new AC()
        if (audioCtx!.state === "suspended") audioCtx!.resume()
        return audioCtx
    } catch {
        return null
    }
}
function noiseBurst(ctx: AudioContext, dur: number, f0: number, f1: number, gain: number, q = 1.2) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
        // Crackly: sparse impulses over a thin bed of noise, like fibres giving way.
        const r = Math.random()
        d[i] = (r > 0.82 ? (Math.random() * 2 - 1) : (Math.random() * 2 - 1) * 0.25) * Math.pow(1 - i / len, 1.6)
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = "bandpass"
    bp.Q.value = q
    const t = ctx.currentTime
    bp.frequency.setValueAtTime(f0, t)
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur)
    const g = ctx.createGain()
    g.gain.value = gain
    src.connect(bp)
    bp.connect(g)
    g.connect(ctx.destination)
    src.start()
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

// Torn paper fibers. Plain divs, revealed top to bottom as the tear runs.
function Fibers({ side, seed, inset, reach, core, alt, reveal, notch = 0 }: any) {
    const strands = useMemo(() => {
        const rand = seeded(seed)
        const out: any[] = []
        const count = 90
        for (let i = 0; i < count; i++) {
            out.push({
                y: ((i + rand()) / count) * 100,
                x: rand() * inset,
                len: 1.5 + rand() * reach,
                angle: (rand() - 0.5) * 70,
                w: 0.4 + rand() * 0.6,
                o: 0.45 + rand() * 0.5,
                alt: rand() > 0.72,
            })
        }
        return out
    }, [seed, inset, reach])

    const mask = useTransform(reveal, (v: number) => {
        const p = v * 100
        return `linear-gradient(to bottom, #000 ${p - 3}%, transparent ${p + 1}%)`
    })

    const width = inset + reach + 2
    const flip = side === "left"

    return (
        <motion.div
            aria-hidden
            style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width,
                left: flip ? undefined : "100%",
                right: flip ? "100%" : undefined,
                marginLeft: flip ? 0 : -inset,
                marginRight: flip ? -inset : 0,
                scaleX: flip ? -1 : 1,
                pointerEvents: "none",
                WebkitMaskImage: mask,
                maskImage: mask,
            }}
        >
            {/* The notches are cut out, not torn: no fibres where the half-circles are. */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    ...(notch > 0
                        ? {
                              WebkitMaskImage: `linear-gradient(to bottom, transparent ${notch + 1}px, #000 ${notch + 4}px, #000 calc(100% - ${notch + 4}px), transparent calc(100% - ${notch + 1}px))`,
                              maskImage: `linear-gradient(to bottom, transparent ${notch + 1}px, #000 ${notch + 4}px, #000 calc(100% - ${notch + 4}px), transparent calc(100% - ${notch + 1}px))`,
                          }
                        : null),
                }}
            >
            {strands.map((f, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        top: `${f.y}%`,
                        left: f.x,
                        width: f.len,
                        height: f.w,
                        borderRadius: f.w,
                        background: f.alt ? alt : core,
                        opacity: f.o,
                        transformOrigin: "0% 50%",
                        transform: `rotate(${f.angle}deg)`,
                    }}
                />
            ))}
            </div>
        </motion.div>
    )
}

function Foil({ children, font, foil, position }: any) {
    return (
        // Deboss lives on the wrapper: light from top left, so pressed-in foil
        // gets a shadow on the upper edge and a highlight on the lower.
        <span
            style={{
                display: "inline-block",
                filter: "drop-shadow(0.5px 1px 0 rgba(255,255,255,0.35)) drop-shadow(0 -0.5px 0 rgba(0,0,0,0.3))",
            }}
        >
            <motion.span
                style={{
                    ...fontWith(font, "transparent"),
                    display: "inline-block",
                    // background-clip: text only paints inside the box. Pad it so
                    // descenders, overshoots and tracking never get cut, then pull
                    // the layout back with negative margins.
                    padding: "0.18em 0.12em 0.24em 0.06em",
                    margin: "-0.18em -0.12em -0.24em -0.06em",
                    backgroundImage: foil,
                    backgroundSize: "260% 100%",
                    backgroundPosition: position,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
            >
                {children}
            </motion.span>
        </span>
    )
}

function HoloStrip({ width, intensity, side, offset, hx, hy, gx, gy, microtext, microFont, radius }: any) {
    const position = useMotionTemplate`0% 0%, ${hx}% ${hy}%, 0% 0%`
    const glare = useMotionTemplate`radial-gradient(120px 90px at ${gx}% ${gy}%, rgba(255,252,240,0.55), transparent 70%)`
    const micro = useMemo(() => Array(16).fill(microtext || "").join("  ·  "), [microtext])
    const { fontSize: _fs, lineHeight: _lh, letterSpacing: _ls, ...microBase } = fontWith(microFont, "rgba(40,36,70,0.38)")

    return (
        <motion.div
            aria-hidden
            style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                [side]: offset,
                width,
                opacity: intensity / 100,
                overflow: "hidden",
                borderRadius: radius,
                backgroundImage: [
                    "repeating-linear-gradient(72deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 0.6px, transparent 0.6px, transparent 2.4px)",
                    // Mostly silver with a narrow, low-saturation iridescent band,
                    // closer to a real security foil than a rainbow sticker.
                    "linear-gradient(135deg, #d9dcdf 0%, #d9dcdf 30%, #e3d7df 38%, #d6e0dd 46%, #d5dbe6 54%, #e2ddce 62%, #d9dcdf 70%, #d9dcdf 100%)",
                    "linear-gradient(180deg, #e4e6e8 0%, #a9aeb4 50%, #e8e9eb 100%)",
                ].join(", "),
                backgroundSize: "100% 100%, 300% 300%, 100% 100%",
                backgroundPosition: position,
                backgroundBlendMode: "overlay, multiply, normal",
                boxShadow: "inset 0 0 0 0.5px rgba(30,24,40,0.16), inset 1px 0 0 rgba(255,255,255,0.4)",
                pointerEvents: "none",
            }}
        >
            <motion.div style={{ position: "absolute", inset: 0, background: glare, mixBlendMode: "screen" }} />
            {/* Microtext: only visible when you lean in. */}
            <div
                style={{
                    ...microBase,
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    writingMode: "vertical-rl",
                    whiteSpace: "nowrap",
                    fontSize: 4.5,
                    lineHeight: 1,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    userSelect: "none",
                }}
            >
                {micro}
            </div>
        </motion.div>
    )
}

function Barcode({ value, color, height }: any) {
    const { bars, total } = useMemo(() => {
        const rand = seeded(hashString(value || "0"))
        const widths = [0.7, 1, 1.6, 2.2]
        let x = 0
        const out: { x: number; w: number }[] = []
        for (let i = 0; i < 52; i++) {
            const w = widths[Math.floor(rand() * widths.length)]
            if (i % 2 === 0) out.push({ x, w })
            x += w
        }
        return { bars: out, total: x }
    }, [value])

    return (
        <svg aria-hidden viewBox={`0 0 ${total} 10`} preserveAspectRatio="none" width="100%" height={height} style={{ display: "block", opacity: 0.86 }}>
            {bars.map((b, i) => (
                <rect key={i} x={b.x} y={0} width={b.w} height={10} fill={color} />
            ))}
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────

const DEFAULTS = {
    event: {
        edition: "07",
        kicker: "Halden Quartet · Winter tour",
        name: "Low Light",
        tagline: "Slow piano and strings, played in the round. One night only.",
        dateLabel: "When",
        date: "Fri 14.11",
        timeLabel: "Doors",
        time: "19:30",
        venueLabel: "Where",
        venue: "Kesselhaus, Berlin",
    },
    stub: {
        entry: "214",
        admit: "Admit one",
        seatLabel: "Row F",
        seat: "Seat 12",
        number: "No. 0214 / 1200",
        hint: "Tear to enter",
        torn: "Enjoy the show",
    },
    layout: {
        padding: "28px 32px 28px 32px",
        stubSide: "right",
        stubWidth: 168,
        radius: "14px 14px 14px 14px",
        notch: 12,
        hole: 2.5,
        spacing: 11,
    },
    // Light palette (kept under the original "appearance" key so saved values carry over)
    appearance: {
        paper: "rgb(243, 242, 237)",
        ink: "rgb(24, 24, 22)",
        muted: "rgb(120, 119, 114)",
        stubFill: "rgb(37, 37, 36)",
        stubInk: "rgb(236, 235, 230)",
        edge: "rgb(214, 212, 205)",
        shadow: "rgb(28, 28, 30)",
        stamp: "rgb(36, 36, 34)",
    },
    // Dark swaps the two stocks: graphite body, paper stub.
    dark: {
        paper: "rgb(37, 37, 36)",
        ink: "rgb(236, 235, 230)",
        muted: "rgb(142, 141, 135)",
        stubFill: "rgb(238, 236, 230)",
        stubInk: "rgb(24, 24, 22)",
        edge: "rgb(12, 12, 12)",
        shadow: "rgb(0, 0, 0)",
        stamp: "rgb(236, 235, 230)",
    },
    finish: {
        foil: "silver",
        holo: true,
        holoWidth: 18,
        holoIntensity: 85,
        grain: 7,
    },
    typography: {
        title: { textAlign: "left" as const, fontSize: 44, letterSpacing: "-0.035em", lineHeight: 1, variant: "Semibold" as const },
        body: { textAlign: "left" as const, fontSize: 14, letterSpacing: "-0.005em", lineHeight: 1.4, variant: "Medium" as const },
        label: { textAlign: "left" as const, fontSize: 11, letterSpacing: "0.01em", lineHeight: 1.2, variant: "Medium" as const },
    },
    behavior: {
        tearDistance: 140,
        tilt: 5,
        afterTear: "keep",
        autoReset: false,
        resetDelay: 4,
        canvasState: "intact",
        sound: true,
        haptics: true,
    },
}

type Palette = typeof DEFAULTS.appearance

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 280
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TearTicket(props: any) {
    const { style } = props
    const ev = { ...DEFAULTS.event, ...props.event }
    const st = { ...DEFAULTS.stub, ...props.stub }
    const lay = { ...DEFAULTS.layout, ...props.layout }
    const light: Palette = { ...DEFAULTS.appearance, ...props.appearance }
    const darkPal: Palette = { ...DEFAULTS.dark, ...props.dark }
    // Older instances kept finish settings under "appearance"; read those as a fallback.
    const fin = { ...DEFAULTS.finish, ...pickFinish(props.appearance), ...props.finish }
    const ty = { ...DEFAULTS.typography, ...props.typography }
    const beh = { ...DEFAULTS.behavior, ...props.behavior }
    const theme: string = props.theme || "light"

    const isOnCanvas = useIsOnFramerCanvas()
    const isStatic = useIsStaticRenderer()
    const still = isOnCanvas || isStatic
    const reduced = !!useReducedMotion()

    // Theme
    const [prefersDark, setPrefersDark] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const on = () => setPrefersDark(mq.matches)
        on()
        mq.addEventListener("change", on)
        return () => mq.removeEventListener("change", on)
    }, [])
    const isDark = theme === "dark" || (theme === "auto" && prefersDark)
    const ap: Palette = isDark ? darkPal : light

    // Size: everything scales from the 640px design width so phones never overflow.
    const rootRef = useRef<HTMLDivElement>(null)
    const [w, setW] = useState(640)
    useIsoLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const ow = el.offsetWidth
            if (ow) setW((p) => (Math.abs(p - ow) < 1 ? p : ow))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const k = clamp(w / 640, 0.6, 1)
    const compact = w < 480

    const sign = lay.stubSide === "left" ? -1 : 1
    const mainEdge = sign === 1 ? "right" : "left"
    const stubEdge = sign === 1 ? "left" : "right"

    const initialTorn = isOnCanvas && beh.canvasState === "torn"
    const [torn, setTorn] = useState(initialTorn)
    const [focused, setFocused] = useState(false)
    const [hover, setHover] = useState(false)
    const [dragging, setDragging] = useState(false)

    // Refs keep the latest values available inside timers and pointer handlers.
    const tornRef = useRef(initialTorn)
    const maxRef = useRef(initialTorn ? 1 : 0)
    const drag = useRef({ active: false, id: -1, sx: 0, sy: 0, p: 0, ticked: 0 })
    const behRef = useRef(beh)
    behRef.current = beh
    const propsRef = useRef(props)
    propsRef.current = props
    const signRef = useRef(sign)
    signRef.current = sign
    const reducedRef = useRef(reduced)
    reducedRef.current = reduced

    // ── Pointer light (mouse only) ──
    const px = useMotionValue(0.5)
    const py = useMotionValue(0.5)
    const spx = useSpring(px, HEAVY)
    const spy = useSpring(py, HEAVY)

    const tiltAmt = still || reduced ? 0 : beh.tilt
    const rotateX = useTransform(spy, (v: number) => (0.5 - v) * 2 * tiltAmt)
    const rotateY = useTransform(spx, (v: number) => (v - 0.5) * 2 * tiltAmt)

    // Reflections move opposite to the tilt.
    const foilPos = useTransform(spx, (v: number) => `${(1 - v) * 100}% 50%`)
    const hx = useTransform(spx, (v: number) => 20 + (1 - v) * 60)
    const hy = useTransform(spy, (v: number) => (1 - v) * 100)
    const gx = useTransform(spx, (v: number) => (1 - v) * 100)
    const gy = useTransform(spy, (v: number) => (1 - v) * 100)

    // ── Tear state ──
    const restX = 28 * k
    const stubX = useMotionValue(initialTorn ? sign * restX : 0)
    const stubY = useMotionValue(initialTorn ? 6 : 0)
    const stubRot = useMotionValue(initialTorn ? sign * 5 : 0)
    const stubOpacity = useMotionValue(1)
    const mainX = useMotionValue(0)
    const pull = useMotionValue(0)
    const tear = useMotionValue(initialTorn ? 1 : 0)
    const hintFade = useTransform(pull, [0, 0.25], [1, 0])

    const run = (mv: any, to: number, transition: any) => animate(mv, to, reducedRef.current ? QUICK : transition)

    const buzz = (ms: number) => {
        if (!behRef.current.haptics) return
        try {
            ;(navigator as any).vibrate && (navigator as any).vibrate(ms)
        } catch (_) {}
    }

    // Canvas preview state, so designers can lay out either pose.
    useEffect(() => {
        if (!isOnCanvas) return
        const t = beh.canvasState === "torn"
        tornRef.current = t
        maxRef.current = t ? 1 : 0
        setTorn(t)
        stubX.set(t ? sign * restX : 0)
        stubY.set(t ? 6 : 0)
        stubRot.set(t ? sign * 5 : 0)
        stubOpacity.set(1)
        tear.set(t ? 1 : 0)
        mainX.set(0)
        pull.set(0)
    }, [isOnCanvas, beh.canvasState, sign, restX])

    const completeTear = () => {
        if (tornRef.current) return
        const s = signRef.current
        tornRef.current = true
        maxRef.current = 1
        setTorn(true)
        setDragging(false)
        animate(tear, 1, { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] })
        animate(pull, 0, QUICK)
        run(mainX, 0, SETTLE)
        if (behRef.current.afterTear === "drop") {
            run(stubX, s * 36, FALL)
            run(stubY, 220, FALL)
            run(stubRot, s * 24, FALL)
            run(stubOpacity, 0, { duration: 0.8, ease: [0.7, 0, 1, 0.6] })
        } else {
            run(stubX, s * restX, HEAVY)
            run(stubY, 6, HEAVY)
            run(stubRot, s * 5, HEAVY)
        }
        if (behRef.current.sound) {
            const ctx = getAudio()
            if (ctx) noiseBurst(ctx, 0.17, 1800, 5200, 0.55, 0.9)
        }
        buzz(10)
        propsRef.current.onTear && propsRef.current.onTear()
    }

    const reattach = () => {
        if (!tornRef.current) return
        tornRef.current = false
        maxRef.current = 0
        setTorn(false)
        animate(tear, 0, { duration: 0.35, ease: "easeOut" })
        if (behRef.current.afterTear === "drop") {
            stubX.set(0)
            stubY.set(-10)
            stubRot.set(0)
            stubOpacity.set(0)
            run(stubY, 0, HEAVY)
            run(stubOpacity, 1, { duration: 0.5, ease: "easeOut" })
        } else {
            run(stubX, 0, HEAVY)
            run(stubY, 0, HEAVY)
            run(stubRot, 0, HEAVY)
        }
        propsRef.current.onReattach && propsRef.current.onReattach()
    }

    // Auto reset: a timer, so it never runs in the editor.
    useEffect(() => {
        if (still || !torn || !beh.autoReset) return
        const t = setTimeout(reattach, Math.max(0.5, beh.resetDelay) * 1000)
        return () => clearTimeout(t)
    }, [still, torn, beh.autoReset, beh.resetDelay])

    // ── Handlers ──
    const onRootMove = (e: any) => {
        // Tilt follows a mouse only. Touch never tilts, and nothing tilts mid-tear.
        if (still || reduced || e.pointerType !== "mouse" || drag.current.active) return
        const r = e.currentTarget.getBoundingClientRect()
        if (!r.width || !r.height) return
        px.set(clamp((e.clientX - r.left) / r.width, 0, 1))
        py.set(clamp((e.clientY - r.top) / r.height, 0, 1))
    }
    const onRootLeave = () => {
        px.set(0.5)
        py.set(0.5)
    }

    const onStubDown = (e: any) => {
        if (still || tornRef.current) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch (_) {}
        if (behRef.current.sound) getAudio()
        drag.current = { active: true, id: e.pointerId, sx: e.clientX, sy: e.clientY, p: 0, ticked: maxRef.current }
        setDragging(true)
        // Level the ticket while tearing, so the hand and the paper agree.
        px.set(0.5)
        py.set(0.5)
    }

    const onStubMove = (e: any) => {
        const d = drag.current
        if (!d.active || e.pointerId !== d.id) return
        const s = signRef.current
        // Pulling outward tears; pulling down helps a little, like a real stub.
        const proj = (e.clientX - d.sx) * s + Math.max(0, e.clientY - d.sy) * 0.35
        const p = clamp(proj / Math.max(40, behRef.current.tearDistance * k), 0, 1)
        if (p >= 1) {
            d.active = false
            try {
                e.currentTarget.releasePointerCapture(e.pointerId)
            } catch (_) {}
            completeTear()
            return
        }
        d.p = p
        pull.set(p)
        stubRot.set(s * Math.max(p * 9, maxRef.current * 1.2))
        stubX.set(s * p * 4)
        mainX.set(s * p * 1.5)
        // Paper stretches first, then the tear starts running down the perforation.
        const r = Math.max(0, (p - 0.12) / 0.88)
        if (r > maxRef.current) {
            maxRef.current = r
            tear.set(r)
            // Fibres give way in small steps: a soft crackle and a tiny tick per step.
            if (r - d.ticked > 0.07) {
                d.ticked = r
                if (behRef.current.sound) {
                    const ctx = getAudio()
                    if (ctx) noiseBurst(ctx, 0.028, 2600 + Math.random() * 1600, 4200, 0.16, 1.6)
                }
                buzz(4)
            }
        }
    }

    const onStubUp = (e: any) => {
        const d = drag.current
        if (!d.active || e.pointerId !== d.id) return
        d.active = false
        setDragging(false)
        if (d.p >= 0.86) {
            completeTear()
            return
        }
        // A partial tear stays partial: the stub settles back with a slight droop.
        const s = signRef.current
        run(stubRot, s * maxRef.current * 1.2, SETTLE)
        run(stubX, 0, SETTLE)
        run(stubY, 0, SETTLE)
        run(mainX, 0, SETTLE)
        run(pull, 0, SETTLE)
    }

    const onStubKey = (e: any) => {
        if (still) return
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (tornRef.current) reattach()
            else completeTear()
        }
    }

    // ── Derived styling ──
    const [tl, tr, br, bl] = parseBox(lay.radius, 14)
    const leftRadius = `${tl}px 0px 0px ${bl}px`
    const rightRadius = `0px ${tr}px ${br}px 0px`
    const mainRadius = sign === 1 ? leftRadius : rightRadius
    const stubRadius = sign === 1 ? rightRadius : leftRadius

    const hole = Math.max(0.5, lay.hole)
    const showHolo = fin.holo && !compact
    const holoW = fin.holoWidth * k
    const holoSpace = showHolo ? holoW + 24 * k : 8
    const [pt0, pr0, pb0, pl0] = parseBox(lay.padding, 28)
    const pt = pt0 * k, pr = pr0 * k, pb = pb0 * k, pl = pl0 * k
    const perfSidePad = 16 * k + hole * 2 + holoSpace
    const mainPad = sign === 1 ? `${pt}px ${perfSidePad}px ${pb}px ${pl}px` : `${pt}px ${pr}px ${pb}px ${perfSidePad}px`
    const sp = Math.min(pl, pr, 22 * k)
    const stubPad = sign === 1 ? `${pt}px ${sp}px ${pb}px ${sp + hole * 2 + 4}px` : `${pt}px ${sp + hole * 2 + 4}px ${pb}px ${sp}px`
    // On phones the stub keeps enough room for the seat line on one row.
    const stubW = Math.max(compact ? 132 : 96, lay.stubWidth * Math.max(k, 0.7))

    const tint = ap.shadow

    // Flat stock with only a whisper of falloff. Print, not render.
    const fill = (c: string) => `linear-gradient(170deg, ${mix(c, 97, "#ffffff")} 0%, ${c} 50%, ${mix(c, 97, "#000000")} 100%)`
    const paperFill = fill(ap.paper)
    const stubFill = fill(ap.stubFill)

    const surface = (edge: "left" | "right", radius: string, bg: string, stock: string) => ({
        position: "absolute" as const,
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        background: bg,
        boxShadow: `inset 0 1px 0 ${mix(stock, 82, "#ffffff")}, inset 0 -1px 0 ${mix(tint, 10)}`,
        ...perfMask(edge, lay.notch, hole, lay.spacing),
    })

    // Light from top left: every shadow falls down and slightly right.
    const pieceShadow = [
        `drop-shadow(1px 1px 1px ${mix(tint, isDark ? 60 : 32)})`,
        `drop-shadow(3px 6px 8px ${mix(tint, isDark ? 36 : 16)})`,
        `drop-shadow(8px 20px 24px ${mix(tint, isDark ? 32 : 12)})`,
    ].join(" ")

    // Card thickness along the bottom, drawn behind each piece. Its notches and holes are cut a little
    // larger than the face, so no sliver of edge colour shows inside the cut-outs on dark pages.
    const edgeLayer = (edge: "left" | "right", radius: string, color: string) => (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                transform: "translateY(1.5px)",
                borderRadius: radius,
                background: color,
                pointerEvents: "none",
                ...perfMask(edge, lay.notch > 0 ? lay.notch + 2.5 : 0, hole + 0.75, lay.spacing),
            }}
        />
    )

    const grainLayer = fin.grain > 0 && (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `${GRAIN_TILE}, ${FIBER_TILE}`,
                backgroundSize: "160px 160px, 320px 320px",
                mixBlendMode: "multiply",
                // Grain belongs to light stock; on dark card it stays a whisper.
                opacity: (fin.grain / 100) * (isDark ? 0.35 : 1),
                pointerEvents: "none",
            }}
        />
    )

    // Ambient occlusion where the paper is scored along the perforation.
    const occlusion = (edge: "left" | "right") => (
        <div
            aria-hidden
            style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                [edge]: 0,
                width: 18,
                background: `linear-gradient(${edge === "right" ? "to left" : "to right"}, ${mix(tint, isDark ? 22 : 7)}, transparent)`,
                pointerEvents: "none",
            }}
        />
    )

    // Torn fibres show the core of each stock: lighter than the face on dark card.
    const fibre = (c: string) => mix(c, 78, "#ffffff")
    const fibreAlt = (c: string) => mix(c, 86, "#9a9890")
    const fiberCore = fibre(ap.paper)
    const fiberAlt = fibreAlt(ap.paper)
    const stubFiberCore = fibre(ap.stubFill)
    const stubFiberAlt = fibreAlt(ap.stubFill)
    const foil = FOILS[fin.foil] || FOILS.silver
    const foilPosition = reduced || still ? "35% 50%" : foilPos

    const tk = k // title scale
    const bk = Math.max(k, 0.86)
    const lk = Math.max(k, 0.9)
    const label = { ...fontWith(ty.label, ap.muted, lk, 9), margin: 0 }
    const body = { ...fontWith(ty.body, ap.muted, bk, 12), margin: 0 }
    const value = { ...fontWith(ty.body, ap.ink, bk, 12), margin: 0, fontVariantNumeric: "tabular-nums" as const }
    // Stub is printed in a solid spot color, so its type uses the stub ink.
    const stubLabelColor = mix(ap.stubInk, 68, ap.stubFill)
    const stubLabel = { ...label, color: stubLabelColor, ["--framer-font-color" as any]: stubLabelColor }
    const stubValue = { ...value, color: ap.stubInk, ["--framer-font-color" as any]: ap.stubInk }

    const meta = [
        [ev.dateLabel, ev.date],
        [ev.timeLabel, ev.time],
        [ev.venueLabel, ev.venue],
    ].filter(([, v]) => v)

    const interactive = !still && !torn

    // Logo: any image, printed in the ink colour through a mask.
    const logoSrc: string = typeof ev.logo === "string" ? ev.logo : ev.logo?.src || ""
    const logoAlt: string = (typeof ev.logo === "object" && ev.logo?.alt) || "Logo"
    const logoRatio = clamp(Number(ev.logoRatio) || 1, 0.25, 6)

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                overflow: "visible",
                fontSize: 0,
                lineHeight: 0,
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
            onPointerMove={onRootMove}
            onPointerLeave={onRootLeave}
        >
            <motion.div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: sign === 1 ? "row" : "row-reverse",
                    rotateX,
                    rotateY,
                    transformPerspective: 1100,
                }}
            >
                {/* ── Main body ── */}
                <motion.div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", x: mainX, filter: pieceShadow }}>
                                        {edgeLayer(mainEdge, mainRadius, ap.edge)}
                    <div style={surface(mainEdge, mainRadius, paperFill, ap.paper)}>
                        {ev.edition && (
                            <div
                                aria-hidden
                                style={{
                                    ...fontWith(ty.title, mix(ap.ink, isDark ? 7 : 5), 1),
                                    position: "absolute",
                                    [mainEdge]: hole * 2 + holoSpace + 4 * k,
                                    bottom: 0,
                                    fontSize: 205 * k,
                                    fontWeight: 300,
                                    lineHeight: 0.74,
                                    letterSpacing: "-0.06em",
                                    fontVariantNumeric: "tabular-nums",
                                    whiteSpace: "nowrap",
                                    pointerEvents: "none",
                                    // a faint deboss so the numeral reads as pressed into the card
                                    textShadow: `0 1px 0 ${mix("#ffffff", isDark ? 4 : 55)}, 0 -1px 0 ${mix(tint, isDark ? 30 : 6)}`,
                                }}
                            >
                                {ev.edition}
                            </div>
                        )}
                        {grainLayer}
                        {occlusion(mainEdge)}
                        {showHolo && (
                            <HoloStrip
                                width={holoW}
                                intensity={fin.holoIntensity}
                                side={mainEdge}
                                offset={hole * 2 + 12 * k}
                                hx={hx}
                                hy={hy}
                                gx={gx}
                                gy={gy}
                                microtext={st.number}
                                microFont={ty.label}
                                radius={1}
                            />
                        )}
                    </div>

                    <Fibers side={mainEdge} seed={11} inset={hole * 1.6} reach={6} core={fiberCore} alt={fiberAlt} reveal={tear} notch={lay.notch} />

                    <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: mainPad }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 * k }}>
                            {(logoSrc || ev.kicker) && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 * k, minWidth: 0 }}>
                                    {logoSrc && (
                                        <div
                                            role="img"
                                            aria-label={logoAlt}
                                            style={{
                                                height: Math.round(16 * lk),
                                                aspectRatio: logoRatio,
                                                flexShrink: 0,
                                                background: ap.ink,
                                                WebkitMaskImage: `url("${logoSrc}")`,
                                                maskImage: `url("${logoSrc}")`,
                                                WebkitMaskSize: "contain",
                                                maskSize: "contain",
                                                WebkitMaskRepeat: "no-repeat",
                                                maskRepeat: "no-repeat",
                                                WebkitMaskPosition: "left center",
                                                maskPosition: "left center",
                                            }}
                                        />
                                    )}
                                    {ev.kicker && <p style={label}>{ev.kicker}</p>}
                                </div>
                            )}
                            {st.number && !compact && <p style={{ ...label, whiteSpace: "nowrap" }}>{st.number}</p>}
                        </div>

                        {ev.name && (
                            <div style={{ marginTop: 14 * k }}>
                                <Foil font={fontWith(ty.title, "transparent", tk, 24)} foil={foil} position={foilPosition}>
                                    {ev.name}
                                </Foil>
                            </div>
                        )}

                        {ev.tagline && <p style={{ ...body, marginTop: 10 * k, maxWidth: "36ch", textWrap: "balance" as any }}>{ev.tagline}</p>}

                        {meta.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: `${12 * k}px ${28 * k}px`, marginTop: "auto", paddingTop: 20 * k }}>
                                {meta.map(([l, v], i) => (
                                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {l && <p style={label}>{l}</p>}
                                        <p style={value}>{v}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stamp, pressed in once the stub is gone */}
                    {st.torn && (
                        <motion.div
                            aria-hidden={!torn}
                            initial={false}
                            animate={{ opacity: torn ? 0.9 : 0, scale: torn ? 1 : 1.14 }}
                            transition={reduced ? QUICK : { ...HEAVY, delay: torn ? 0.15 : 0 }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                [mainEdge]: hole * 2 + holoSpace + 10 * k,
                                y: "-50%",
                                rotate: -9,
                                pointerEvents: "none",
                                mixBlendMode: isDark ? "screen" : "multiply",
                                WebkitMaskImage: WORN_MASK,
                                maskImage: WORN_MASK,
                                WebkitMaskSize: "140px 140px",
                                maskSize: "140px 140px",
                            }}
                        >
                            <div
                                style={{
                                    ...fontWith(ty.body, ap.stamp, bk, 12),
                                    margin: 0,
                                    padding: `${7 * k}px ${13 * k}px`,
                                    whiteSpace: "nowrap",
                                    letterSpacing: "0.02em",
                                    border: `1.5px solid ${ap.stamp}`,
                                    borderRadius: 4,
                                    boxShadow: `inset 0 0 0 2.5px ${ap.paper}, inset 0 0 0 3.5px ${ap.stamp}`,
                                }}
                            >
                                {st.torn}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* ── Stub ── */}
                <motion.div
                    role="button"
                    tabIndex={still ? -1 : 0}
                    aria-label={torn ? `${st.torn || "Torn"}. Press Enter to reattach the stub` : `${st.hint || "Tear"}: ${ev.name}`}
                    aria-pressed={torn}
                    onPointerDown={onStubDown}
                    onPointerMove={onStubMove}
                    onPointerUp={onStubUp}
                    onPointerCancel={onStubUp}
                    onPointerEnter={(e: any) => e.pointerType === "mouse" && setHover(true)}
                    onPointerLeave={() => setHover(false)}
                    onKeyDown={onStubKey}
                    onFocus={(e: any) => {
                        try {
                            setFocused(e.currentTarget.matches(":focus-visible"))
                        } catch (_) {
                            setFocused(true)
                        }
                    }}
                    onBlur={() => setFocused(false)}
                    style={{
                        position: "relative",
                        width: stubW,
                        flexShrink: 0,
                        display: "flex",
                        x: stubX,
                        y: stubY,
                        rotate: stubRot,
                        opacity: stubOpacity,
                        originX: sign === 1 ? 0 : 1,
                        originY: 1,
                        filter: pieceShadow,
                        cursor: !interactive ? "default" : dragging ? "grabbing" : "grab",
                        touchAction: "pan-y",
                        outline: focused ? `2px solid ${mix(ap.ink, 40)}` : "none",
                        outlineOffset: 4,
                        borderRadius: stubRadius,
                    }}
                >
                                        {edgeLayer(stubEdge, stubRadius, mix(ap.stubFill, 82, "#000000"))}
                    <div style={surface(stubEdge, stubRadius, stubFill, ap.stubFill)}>
                        {grainLayer}
                        {occlusion(stubEdge)}
                    </div>

                    <Fibers side={stubEdge} seed={29} inset={hole * 1.6} reach={6} core={stubFiberCore} alt={stubFiberAlt} reveal={tear} notch={lay.notch} />

                    <div
                        style={{
                            position: "relative",
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: 14 * k,
                            padding: stubPad,
                        }}
                    >
                        {st.admit && <p style={stubLabel}>{st.admit}</p>}

                        <div style={{ display: "flex", flexDirection: "column", gap: 6 * k }}>
                            {st.entry && (
                                <div>
                                    <Foil
                                        font={{ ...fontWith(ty.title, "transparent", 1), fontSize: Math.max(34, 60 * k) + "px", fontWeight: 300, letterSpacing: "-0.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
                                        foil={foil}
                                        position={foilPosition}
                                    >
                                        {st.entry}
                                    </Foil>
                                </div>
                            )}
                            {(st.seatLabel || st.seat) && (
                                <p style={{ ...stubValue, color: stubLabelColor, ["--framer-font-color" as any]: stubLabelColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {[st.seatLabel, st.seat].filter(Boolean).join(" · ")}
                                </p>
                            )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <Barcode value={st.number || ev.name} color={mix(ap.stubInk, 80)} height={Math.round(22 * Math.max(k, 0.75))} />
                            {st.hint && (
                                <motion.div style={{ opacity: hintFade }}>
                                    <motion.div
                                        initial={false}
                                        animate={{ opacity: torn ? 0 : 1 }}
                                        transition={QUICK}
                                        style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: sign === 1 ? "row" : "row-reverse", justifyContent: "flex-start" }}
                                    >
                                        <p style={{ ...stubLabel, whiteSpace: "nowrap" }}>{st.hint}</p>
                                        {/* The arrow leans toward the pull only while a mouse rests on the stub. Nothing moves on its own. */}
                                        <motion.svg
                                            aria-hidden
                                            width={12}
                                            height={10}
                                            viewBox="0 0 12 10"
                                            initial={false}
                                            animate={{ x: hover && interactive && !reduced ? sign * 3 : 0 }}
                                            transition={HEAVY}
                                            style={{ flexShrink: 0, scaleX: sign }}
                                        >
                                            <path d="M1 5h9.5M6.5 1.5 10.5 5l-4 3.5" fill="none" stroke={stubLabelColor} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
                                        </motion.svg>
                                    </motion.div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

TearTicket.displayName = "Tear Ticket"

function pickFinish(a: any) {
    if (!a) return {}
    const out: any = {}
    for (const key of ["foil", "holo", "holoWidth", "holoIntensity", "grain"]) if (a[key] !== undefined) out[key] = a[key]
    return out
}

// ─────────────────────────────────────────────────────────────
// Controls
// ─────────────────────────────────────────────────────────────

const colorControls = (d: Palette): any => ({
    paper: { type: ControlType.Color, title: "Paper", defaultValue: d.paper, description: "Card stock colour. Fibres at the tear are derived from it." },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: d.ink, description: "Values and barcode." },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: d.muted, description: "Labels and tagline on the main body." },
    stubFill: { type: ControlType.Color, title: "Stub", defaultValue: d.stubFill, description: "Spot colour the stub is printed in. Set it to the paper colour for a single-tone ticket." },
    stubInk: { type: ControlType.Color, title: "Stub ink", defaultValue: d.stubInk, description: "Text and barcode on the stub. Labels use a tint of it." },
    edge: { type: ControlType.Color, title: "Edge", defaultValue: d.edge, description: "Visible thickness of the card stock along the bottom." },
    shadow: { type: ControlType.Color, title: "Shadow", defaultValue: d.shadow, description: "Tint for every shadow layer. Match it to the surface the ticket sits on." },
    stamp: { type: ControlType.Color, title: "Stamp", defaultValue: d.stamp, description: "Ink colour of the stamp after tearing." },
})

addPropertyControls(TearTicket, {
    event: {
        type: ControlType.Object,
        title: "Event",
        buttonTitle: "Event details",
        description: "Everything printed on the main body of the ticket.",
        controls: {
            edition: { type: ControlType.String, title: "Edition", defaultValue: DEFAULTS.event.edition, description: "Oversized number pressed into the card. Leave empty to hide." },
            logo: { type: ControlType.ResponsiveImage, title: "Logo", description: "Small mark before the kicker, printed in the ink colour. SVG or transparent PNG works best." },
            logoRatio: { type: ControlType.Number, title: "Logo ratio", defaultValue: 1, min: 0.25, max: 6, step: 0.05, description: "Width divided by height of the logo.", hidden: (p: any) => !p.event?.logo },
            kicker: { type: ControlType.String, title: "Kicker", defaultValue: DEFAULTS.event.kicker, description: "Small label above the title. Leave empty to hide." },
            name: { type: ControlType.String, title: "Title", defaultValue: DEFAULTS.event.name, description: "Event name, foil stamped." },
            tagline: { type: ControlType.String, title: "Tagline", displayTextArea: true, defaultValue: DEFAULTS.event.tagline, description: "One line under the title. Leave empty to hide." },
            dateLabel: { type: ControlType.String, title: "Date label", defaultValue: DEFAULTS.event.dateLabel },
            date: { type: ControlType.String, title: "Date", defaultValue: DEFAULTS.event.date, description: "Leave empty to hide the date column." },
            timeLabel: { type: ControlType.String, title: "Time label", defaultValue: DEFAULTS.event.timeLabel },
            time: { type: ControlType.String, title: "Time", defaultValue: DEFAULTS.event.time, description: "Leave empty to hide the time column." },
            venueLabel: { type: ControlType.String, title: "Venue label", defaultValue: DEFAULTS.event.venueLabel },
            venue: { type: ControlType.String, title: "Venue", defaultValue: DEFAULTS.event.venue, description: "Leave empty to hide the venue column." },
        },
    },
    stub: {
        type: ControlType.Object,
        title: "Stub",
        buttonTitle: "Stub details",
        description: "The tear-off part and the stamp left behind.",
        controls: {
            entry: { type: ControlType.String, title: "Entry", defaultValue: DEFAULTS.stub.entry, description: "Big foil number on the stub. Leave empty to hide." },
            admit: { type: ControlType.String, title: "Admit", defaultValue: DEFAULTS.stub.admit, description: "Small label at the top of the stub." },
            seatLabel: { type: ControlType.String, title: "Seat label", defaultValue: DEFAULTS.stub.seatLabel },
            seat: { type: ControlType.String, title: "Seat", defaultValue: DEFAULTS.stub.seat, description: "Seat, row or ticket tier." },
            number: { type: ControlType.String, title: "Number", defaultValue: DEFAULTS.stub.number, description: "Ticket number. Also seeds the barcode and the microtext in the holographic strip." },
            hint: { type: ControlType.String, title: "Hint", defaultValue: DEFAULTS.stub.hint, description: "Instruction on the stub. Fades out as you pull." },
            torn: { type: ControlType.String, title: "Stamp", defaultValue: DEFAULTS.stub.torn, description: "Ink stamp pressed onto the ticket after tearing. Leave empty for no stamp." },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        buttonTitle: "Shape & spacing",
        description: "Proportions, perforation and padding. Everything scales down with the frame on narrow screens.",
        controls: {
            padding: { type: ControlType.Padding, title: "Padding", defaultValue: DEFAULTS.layout.padding, description: "Inner spacing of the main body. The stub uses the top and bottom values." },
            stubSide: { type: ControlType.Enum, title: "Side", options: ["left", "right"], optionTitles: ["Left", "Right"], displaySegmentedControl: true, defaultValue: DEFAULTS.layout.stubSide },
            stubWidth: { type: ControlType.Number, title: "Stub", defaultValue: DEFAULTS.layout.stubWidth, min: 100, max: 320, step: 1, unit: "px", description: "Width of the tear-off stub." },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: DEFAULTS.layout.radius },
            notch: { type: ControlType.Number, title: "Notch", defaultValue: DEFAULTS.layout.notch, min: 0, max: 32, step: 0.5, unit: "px", description: "Half-circle cutouts at both ends of the perforation." },
            hole: { type: ControlType.Number, title: "Holes", defaultValue: DEFAULTS.layout.hole, min: 0.5, max: 6, step: 0.25, unit: "px", description: "Radius of each perforation hole." },
            spacing: { type: ControlType.Number, title: "Spacing", defaultValue: DEFAULTS.layout.spacing, min: 4, max: 30, step: 0.5, unit: "px", description: "Distance between perforation holes, centre to centre." },
        },
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "auto"],
        optionTitles: ["Light", "Dark", "Auto"],
        displaySegmentedControl: true,
        defaultValue: "light",
        description: "Auto follows the visitor's system setting.",
    },
    appearance: { type: ControlType.Object, title: "Light", buttonTitle: "Colours", controls: colorControls(DEFAULTS.appearance) },
    dark: { type: ControlType.Object, title: "Dark", buttonTitle: "Colours", controls: colorControls(DEFAULTS.dark) },
    finish: {
        type: ControlType.Object,
        title: "Finish",
        buttonTitle: "Foil, holo, grain",
        controls: {
            foil: {
                type: ControlType.Enum,
                title: "Foil",
                options: ["gold", "silver", "rose", "copper", "pumpkin"],
                optionTitles: ["Gold", "Silver", "Rose", "Copper", "Pumpkin"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                defaultValue: DEFAULTS.finish.foil,
                description: "Foil stamping on the title and the entry number.",
            },
            holo: { type: ControlType.Boolean, title: "Holo", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: DEFAULTS.finish.holo, description: "Holographic security strip next to the perforation. Hidden on narrow frames." },
            holoWidth: { type: ControlType.Number, title: "Width", defaultValue: DEFAULTS.finish.holoWidth, min: 6, max: 48, step: 1, unit: "px", hidden: (p: any) => p.finish?.holo === false },
            holoIntensity: { type: ControlType.Number, title: "Intensity", defaultValue: DEFAULTS.finish.holoIntensity, min: 0, max: 100, step: 1, unit: "%", hidden: (p: any) => p.finish?.holo === false },
            grain: { type: ControlType.Number, title: "Grain", defaultValue: DEFAULTS.finish.grain, min: 0, max: 20, step: 0.5, unit: "%", description: "Paper grain and fibre texture. 4 to 8 works best. Softened automatically on dark stock." },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        buttonTitle: "Fonts",
        description: "Three text roles used across the ticket.",
        controls: {
            title: { type: ControlType.Font, title: "Title", defaultValue: DEFAULTS.typography.title, defaultFontType: "sans-serif", displayFontSize: true, displayTextAlignment: true, controls: "extended", description: "Foil-stamped event name." },
            body: { type: ControlType.Font, title: "Body", defaultValue: DEFAULTS.typography.body, defaultFontType: "sans-serif", displayFontSize: true, displayTextAlignment: true, controls: "extended", description: "Tagline, values, seat and stamp." },
            label: { type: ControlType.Font, title: "Label", defaultValue: DEFAULTS.typography.label, defaultFontType: "sans-serif", displayFontSize: true, displayTextAlignment: true, controls: "extended", description: "Small labels, ticket number and hint." },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        buttonTitle: "Tear & motion",
        description: "How the stub tears and how the ticket reacts to the cursor.",
        controls: {
            tearDistance: { type: ControlType.Number, title: "Distance", defaultValue: DEFAULTS.behavior.tearDistance, min: 60, max: 400, step: 5, unit: "px", description: "How far you drag before the stub comes free. Higher feels like thicker stock." },
            tilt: { type: ControlType.Number, title: "Tilt", defaultValue: DEFAULTS.behavior.tilt, min: 0, max: 8, step: 0.5, unit: "°", description: "Tilt toward the mouse. Foil and holo reflections shift with it. Never on touch or with reduced motion." },
            afterTear: { type: ControlType.Enum, title: "After", options: ["keep", "drop"], optionTitles: ["Keep", "Drop"], displaySegmentedControl: true, defaultValue: DEFAULTS.behavior.afterTear, description: "Keep leaves the torn stub resting beside the ticket. Drop lets it fall away." },
            autoReset: { type: ControlType.Boolean, title: "Reset", enabledTitle: "Auto", disabledTitle: "Off", defaultValue: DEFAULTS.behavior.autoReset, description: "Reattach the stub after a delay. Keyboard users can always press Enter on the stub to reattach." },
            resetDelay: { type: ControlType.Number, title: "Delay", defaultValue: DEFAULTS.behavior.resetDelay, min: 0.5, max: 30, step: 0.5, unit: "s", hidden: (p: any) => !p.behavior?.autoReset },
            canvasState: { type: ControlType.Enum, title: "Canvas", options: ["intact", "torn"], optionTitles: ["Intact", "Torn"], displaySegmentedControl: true, defaultValue: DEFAULTS.behavior.canvasState, description: "Which pose to show in the editor. Preview and live always start intact." },
            sound: { type: ControlType.Boolean, title: "Sound", defaultValue: DEFAULTS.behavior.sound, description: "A soft paper crackle while tearing and a short rip when it comes free." },
            haptics: { type: ControlType.Boolean, title: "Haptics", defaultValue: DEFAULTS.behavior.haptics },
        },
    },
    onTear: { type: ControlType.EventHandler, title: "On tear" },
    onReattach: { type: ControlType.EventHandler, title: "On reattach" },
})
