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


const { useEffect, useRef, useState } = React

type Fit = "cover" | "contain"
type Mode = "inside" | "outside"
type Kind = "image" | "video"

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface Switcher {
    imageLabel: string
    videoLabel: string
    offset: number
    track: string
    knob: string
    label: string
    activeLabel: string
}

interface Props {
    media: Kind
    showToggle: boolean
    toggle: Switcher
    image?: ImageValue
    imageUrl: string
    video?: string
    videoUrl: string
    poster?: ImageValue
    fit: Fit
    mode: Mode
    zoneSize: number
    dotSize: number
    matrix: "2" | "4" | "8"
    flow: number
    stretch: number
    trail: number
    streaks: number
    reach: number
    drift: boolean
    contrast: number
    brightness: number
    ink: string
    paper: string
    background: string
    radius: number
    style?: React.CSSProperties
}

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&q=80"

const SWITCHER_DEFAULTS: Switcher = {
    imageLabel: "Image",
    videoLabel: "Video",
    offset: 20,
    track: "rgba(16,16,16,0.72)",
    knob: "#FFFFFF",
    label: "rgba(255,255,255,0.72)",
    activeLabel: "#0E0E0E",
}

function pickSources(p: Props) {
    const imageSrc = (p.image && p.image.src) || p.imageUrl || ""
    const videoSrc = p.video || p.videoUrl || ""
    const posterSrc = (p.poster && p.poster.src) || ""
    return { imageSrc, videoSrc, posterSrc }
}

/* ------------------------------------------------------------------ */
/* On-canvas media switch                                              */
/* ------------------------------------------------------------------ */

const PILL_W = 94
const PILL_H = 40
const PILL_PAD = 5
const PILL_FONT = 14

function MediaSwitch(props: {
    kind: Kind
    look?: Partial<Switcher>
    onPick: (k: Kind) => void
}) {
    const look = { ...SWITCHER_DEFAULTS, ...(props.look || {}) }
    const options: { k: Kind; text: string }[] = [
        { k: "image", text: look.imageLabel },
        { k: "video", text: look.videoLabel },
    ]
    const at = props.kind === "video" ? 1 : 0
    const [hoverAt, setHoverAt] = useState<number>(-1)
    const [pressAt, setPressAt] = useState<number>(-1)
    const [overPill, setOverPill] = useState(false)
    const stop = (e: React.SyntheticEvent) => e.stopPropagation()
    const ghostVisible = hoverAt !== -1 && hoverAt !== at
    const spring = "cubic-bezier(0.34, 1.4, 0.5, 1)"
    return (
        <div
            role="tablist"
            onPointerEnter={(e) => {
                stop(e)
                setOverPill(true)
            }}
            onPointerLeave={() => {
                setOverPill(false)
                setHoverAt(-1)
                setPressAt(-1)
            }}
            onPointerMove={stop}
            onPointerDown={stop}
            style={{
                position: "absolute",
                top: look.offset,
                left: look.offset,
                zIndex: 3,
                display: "flex",
                padding: PILL_PAD,
                borderRadius: 999,
                background: look.track,
                backdropFilter: "blur(16px) saturate(1.5)",
                WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                boxShadow: overPill
                    ? "0 14px 36px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.14)"
                    : "0 6px 22px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.08)",
                transform: overPill ? "translateY(-1px) scale(1.025)" : "none",
                transformOrigin: "top left",
                transition: `transform 420ms ${spring}, box-shadow 320ms ease`,
            }}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: PILL_PAD,
                    left: PILL_PAD,
                    width: PILL_W,
                    height: PILL_H,
                    borderRadius: 999,
                    background: look.knob,
                    opacity: ghostVisible ? 0.16 : 0,
                    transform: `translateX(${(ghostVisible ? hoverAt : at) * PILL_W}px) scale(${ghostVisible ? 1 : 0.86})`,
                    transition: `transform 380ms ${spring}, opacity 240ms ease`,
                    pointerEvents: "none",
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: PILL_PAD,
                    left: PILL_PAD,
                    width: PILL_W,
                    height: PILL_H,
                    borderRadius: 999,
                    background: look.knob,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
                    transform: `translateX(${at * PILL_W + (ghostVisible ? (hoverAt - at) * 6 : 0)}px) scale(${pressAt === at ? 0.94 : 1})`,
                    transition: `transform 560ms ${spring}`,
                    pointerEvents: "none",
                }}
            />
            {options.map((o, i) => {
                const on = i === at
                const hot = hoverAt === i
                return (
                    <button
                        key={o.k}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onPointerEnter={() => setHoverAt(i)}
                        onPointerDown={() => setPressAt(i)}
                        onPointerUp={() => setPressAt(-1)}
                        onClick={() => {
                            setHoverAt(-1)
                            props.onPick(o.k)
                        }}
                        style={{
                            position: "relative",
                            width: PILL_W,
                            height: PILL_H,
                            border: "none",
                            margin: 0,
                            padding: 0,
                            background: "transparent",
                            borderRadius: 999,
                            cursor: on ? "default" : "pointer",
                            color: on ? look.activeLabel : look.label,
                            opacity: on || hot ? 1 : 0.82,
                            fontFamily: "Inter, system-ui, sans-serif",
                            fontSize: PILL_FONT,
                            fontWeight: 500,
                            letterSpacing: 0.1,
                            outline: "none",
                            transform:
                                pressAt === i
                                    ? "scale(0.94)"
                                    : hot && !on
                                      ? "scale(1.04)"
                                      : "none",
                            transition: `color 320ms ease, opacity 240ms ease, transform 360ms ${spring}`,
                        }}
                    >
                        {o.text}
                    </button>
                )
            })}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Mezzotint(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillPlate {...props} />
    return <LiveLens {...props} />
}

/* ------------------------------------------------------------------ */
/* Static branch — plain markup only                                   */
/* ------------------------------------------------------------------ */

function StillSwitch(props: { kind: Kind; look?: Partial<Switcher> }) {
    const look = { ...SWITCHER_DEFAULTS, ...(props.look || {}) }
    const at = props.kind === "video" ? 1 : 0
    const chip = (text: string, on: boolean) => (
        <div
            style={{
                position: "relative",
                width: PILL_W,
                height: PILL_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: on ? look.activeLabel : look.label,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: PILL_FONT,
                fontWeight: 500,
                letterSpacing: 0.1,
            }}
        >
            {text}
        </div>
    )
    return (
        <div
            style={{
                position: "absolute",
                top: look.offset,
                left: look.offset,
                zIndex: 3,
                display: "flex",
                padding: PILL_PAD,
                borderRadius: 999,
                background: look.track,
                boxShadow:
                    "0 6px 22px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: PILL_PAD,
                    left: PILL_PAD + at * PILL_W,
                    width: PILL_W,
                    height: PILL_H,
                    borderRadius: 999,
                    background: look.knob,
                }}
            />
            {chip(look.imageLabel, at === 0)}
            {chip(look.videoLabel, at === 1)}
        </div>
    )
}

function StillPlate(p: Props) {
    const { imageSrc, videoSrc: anyVideo, posterSrc } = pickSources(p)
    const videoSrc = p.media === "video" ? anyVideo : ""
    const fill: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: p.fit,
        objectPosition: "center",
        display: "block",
    }
    let body: React.ReactNode
    if (videoSrc) {
        body = posterSrc ? (
            <img src={posterSrc} alt="" draggable={false} style={fill} />
        ) : (
            <video
                src={videoSrc}
                muted
                playsInline
                autoPlay={false}
                preload="metadata"
                style={fill}
            />
        )
    } else if (imageSrc) {
        body = (
            <img
                src={imageSrc}
                alt={(p.image && p.image.alt) || ""}
                draggable={false}
                style={fill}
            />
        )
    } else {
        body = (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 14,
                }}
            >
                {p.media === "video" ? "Add a video" : "Add an image"}
            </div>
        )
    }
    return (
        <div
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: p.radius,
                background: p.background,
            }}
        >
            {body}
            {p.showToggle && <StillSwitch kind={p.media} look={p.toggle} />}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BIN_COUNT = 240
const EDGE_JITTER = 0.14
const TAU = Math.PI * 2

function seeded(seed: number) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function cellNoise(x: number, y: number) {
    let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
    n = Math.imul(n ^ (n >>> 13), 1274126177)
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}

interface Rays {
    jitter: Float32Array
    length: Float32Array
    phase: Float32Array
}

function castRays(density: number): Rays {
    const rnd = seeded(0x51ed27)
    const jitter = new Float32Array(BIN_COUNT)
    const length = new Float32Array(BIN_COUNT)
    const phase = new Float32Array(BIN_COUNT)
    for (let i = 0; i < BIN_COUNT; i++) jitter[i] = rnd() * EDGE_JITTER
    // soften the rim jitter so the edge undulates instead of chattering
    const soft = new Float32Array(BIN_COUNT)
    for (let i = 0; i < BIN_COUNT; i++) {
        const a = jitter[(i - 1 + BIN_COUNT) % BIN_COUNT]
        const b = jitter[(i + 1) % BIN_COUNT]
        soft[i] = jitter[i] * 0.5 + (a + b) * 0.25
    }
    let i = 0
    const chance = density * 0.45
    while (i < BIN_COUNT) {
        if (rnd() < chance) {
            const span = 1 + Math.floor(rnd() * 3)
            const reachPart = 0.2 + 0.8 * Math.pow(rnd(), 0.6)
            const ph = rnd()
            for (let k = 0; k < span && i < BIN_COUNT; k++, i++) {
                const taper =
                    k === 0 || k === span - 1 ? 0.75 + 0.25 * rnd() : 1
                length[i] = reachPart * taper
                phase[i] = ph
            }
        } else {
            i++
        }
    }
    return { jitter: soft, length, phase }
}

function thresholdTable(n: number): Float32Array {
    let grid: number[][] = [[0]]
    let size = 1
    while (size < n) {
        const next: number[][] = []
        const s2 = size * 2
        for (let r = 0; r < s2; r++) {
            next.push(new Array(s2).fill(0))
            for (let c = 0; c < s2; c++) {
                const base = grid[r % size][c % size]
                const quad = (r < size ? 0 : 2) + (c < size ? 0 : 1)
                next[r][c] = base * 4 + [0, 2, 3, 1][quad]
            }
        }
        grid = next
        size = s2
    }
    const out = new Float32Array(n * n)
    const area = n * n
    for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) out[r * n + c] = (grid[r][c] + 0.5) / area
    return out
}

let swatchCtx: CanvasRenderingContext2D | null = null
function toRGBA(color: string): [number, number, number, number] {
    if (!swatchCtx) {
        const c = document.createElement("canvas")
        c.width = c.height = 1
        swatchCtx = c.getContext("2d", { willReadFrequently: true })
    }
    if (!swatchCtx) return [0, 0, 0, 255]
    swatchCtx.clearRect(0, 0, 1, 1)
    swatchCtx.fillStyle = "#000"
    swatchCtx.fillStyle = color
    swatchCtx.fillRect(0, 0, 1, 1)
    const d = swatchCtx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2], d[3]]
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(mq.matches)
        sync()
        if (mq.addEventListener) mq.addEventListener("change", sync)
        else mq.addListener(sync)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", sync)
            else mq.removeListener(sync)
        }
    }, [])
    return reduced
}

/* ------------------------------------------------------------------ */
/* Live branch                                                         */
/* ------------------------------------------------------------------ */

interface Box {
    c0: number
    c1: number
    r0: number
    r1: number
}

interface LensState {
    picture: HTMLImageElement | null
    film: HTMLVideoElement | null
    useFilm: boolean
    filmTime: number
    blocked: boolean
    readable: boolean
    w: number
    h: number
    dpr: number
    cell: number
    cols: number
    rows: number
    tone: Float32Array | null
    cover: Uint8Array | null
    heat: Float32Array | null
    scratch: HTMLCanvasElement | null
    scratchCtx: CanvasRenderingContext2D | null
    plate: HTMLCanvasElement | null
    plateCtx: CanvasRenderingContext2D | null
    pixels: ImageData | null
    trailBox: Box | null
    trailAlive: boolean
    aimX: number
    aimY: number
    x: number
    y: number
    vx: number
    vy: number
    dirX: number
    dirY: number
    pull: number
    inside: boolean
    presence: number
    presenceV: number
    seen: boolean
    tabOn: boolean
    reduced: boolean
    frame: number
    lastAt: number
    clock: number
    rays: Rays | null
    raysFor: number
    table: Float32Array | null
    tableFor: number
    inkFor: string
    inkRGBA: [number, number, number, number]
    paperFor: string
    paperRGBA: [number, number, number, number]
}

function LiveLens(p: Props) {
    const shellRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const filmRef = useRef<HTMLVideoElement>(null)
    const propsRef = useRef(p)
    propsRef.current = p
    const reduced = useReducedMotion()

    const [s] = useState<LensState>(() => ({
        picture: null,
        film: null,
        useFilm: false,
        filmTime: -1,
        blocked: false,
        readable: false,
        w: 0,
        h: 0,
        dpr: 1,
        cell: 0,
        cols: 0,
        rows: 0,
        tone: null,
        cover: null,
        heat: null,
        scratch: null,
        scratchCtx: null,
        plate: null,
        plateCtx: null,
        pixels: null,
        trailBox: null,
        trailAlive: false,
        aimX: 0,
        aimY: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        dirX: 1,
        dirY: 0,
        pull: 0,
        inside: false,
        presence: 0,
        presenceV: 0,
        seen: typeof IntersectionObserver === "undefined",
        tabOn: true,
        reduced: false,
        frame: 0,
        lastAt: 0,
        clock: 0,
        rays: null,
        raysFor: -1,
        table: null,
        tableFor: 0,
        inkFor: "",
        inkRGBA: [0, 0, 0, 255],
        paperFor: "",
        paperRGBA: [255, 255, 255, 255],
    }))
    s.reduced = reduced

    const [kind, setKind] = useState<Kind>(p.media)
    useEffect(() => setKind(p.media), [p.media])

    const { imageSrc, videoSrc, posterSrc } = pickSources(p)
    const wantsFilm = kind === "video"
    const showFilm = wantsFilm && !!videoSrc

    const engine = useRef<{
        wake: () => void
        layout: () => void
        capture: () => void
        playback: () => void
    } | null>(null)

    if (!engine.current) {
        /* ---------- grid + frame capture ---------- */

        const capture = () => {
            if (s.blocked || !s.scratchCtx || !s.tone || !s.cover) return
            const P = propsRef.current
            let source: CanvasImageSource | null = null
            let iw = 0
            let ih = 0
            if (s.useFilm) {
                const v = s.film
                if (!v || v.readyState < 2 || !v.videoWidth) return
                source = v
                iw = v.videoWidth
                ih = v.videoHeight
            } else {
                const img = s.picture
                if (!img || !img.naturalWidth) return
                source = img
                iw = img.naturalWidth
                ih = img.naturalHeight
            }
            const cell = s.cell
            const scale =
                P.fit === "contain"
                    ? Math.min(s.w / iw, s.h / ih)
                    : Math.max(s.w / iw, s.h / ih)
            const dw = iw * scale
            const dh = ih * scale
            const ox = (s.w - dw) / 2
            const oy = (s.h - dh) / 2
            const ctx = s.scratchCtx
            ctx.clearRect(0, 0, s.cols, s.rows)
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.drawImage(source, ox / cell, oy / cell, dw / cell, dh / cell)
            let raw: Uint8ClampedArray
            try {
                raw = ctx.getImageData(0, 0, s.cols, s.rows).data
            } catch (e) {
                s.blocked = true
                s.readable = false
                return
            }
            const tone = s.tone
            const cover = s.cover
            for (let i = 0, o = 0; i < tone.length; i++, o += 4) {
                tone[i] =
                    (0.2126 * raw[o] +
                        0.7152 * raw[o + 1] +
                        0.0722 * raw[o + 2]) /
                    255
                cover[i] = raw[o + 3]
            }
            s.readable = true
        }

        const layout = () => {
            s.readable = false
            if (s.w < 1 || s.h < 1) return
            const P = propsRef.current
            const cell = Math.max(1, Math.min(16, Math.round(P.dotSize)))
            const cols = Math.ceil(s.w / cell)
            const rows = Math.ceil(s.h / cell)
            const scratch = document.createElement("canvas")
            scratch.width = cols
            scratch.height = rows
            const plate = document.createElement("canvas")
            plate.width = cols
            plate.height = rows
            const scratchCtx = scratch.getContext("2d", {
                willReadFrequently: true,
            })
            const plateCtx = plate.getContext("2d")
            if (!scratchCtx || !plateCtx) return
            s.cell = cell
            s.cols = cols
            s.rows = rows
            s.scratch = scratch
            s.scratchCtx = scratchCtx
            s.plate = plate
            s.plateCtx = plateCtx
            s.pixels = plateCtx.createImageData(cols, rows)
            s.tone = new Float32Array(cols * rows)
            s.cover = new Uint8Array(cols * rows)
            s.heat = new Float32Array(cols * rows)
            s.trailBox = null
            s.trailAlive = false
            s.filmTime = -1
            capture()
        }

        /* ---------- painting ---------- */

        const paint = (dt: number) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            if (
                !s.readable ||
                !s.tone ||
                !s.cover ||
                !s.heat ||
                !s.pixels ||
                !s.plateCtx
            )
                return

            const P = propsRef.current
            const outside = P.mode === "outside"
            const calm = s.reduced
            const lensOn = s.presence > 0.002
            if (!outside && !lensOn && !s.trailAlive) return

            const n = parseInt(P.matrix, 10) || 8
            if (!s.table || s.tableFor !== n) {
                s.table = thresholdTable(n)
                s.tableFor = n
            }
            const density = Math.max(0, Math.min(100, P.streaks)) / 100
            if (!s.rays || s.raysFor !== density) {
                s.rays = castRays(density)
                s.raysFor = density
            }
            if (s.inkFor !== P.ink) {
                s.inkRGBA = toRGBA(P.ink)
                s.inkFor = P.ink
            }
            if (s.paperFor !== P.paper) {
                s.paperRGBA = toRGBA(P.paper)
                s.paperFor = P.paper
            }

            const table = s.table
            const { jitter, length, phase } = s.rays
            const ink = s.inkRGBA
            const paper = s.paperRGBA
            const data = s.pixels.data
            data.fill(0)

            const cell = s.cell
            const cols = s.cols
            const rows = s.rows
            const tone = s.tone
            const cover = s.cover
            const heat = s.heat

            const size = Math.max(0, s.presence)
            const half = (Math.max(60, P.zoneSize) / 2) * size
            const extra = half * (Math.max(0, P.reach) / 100)
            const pull = calm ? 0 : s.pull
            const ux = s.dirX
            const uy = s.dirY
            const longAxis = 1 + pull
            const shortAxis = 1 / (1 + pull * 0.45)
            const tailBoost = pull * 2.6
            const coreSafe = half * (1 - EDGE_JITTER) * shortAxis
            const reachMax = (half + extra) * longAxis * (1 + tailBoost)
            const gapPitch = Math.max(cell * 4, 14)
            const sway = P.drift && !calm
            const t = s.clock
            const spin = sway ? t * 0.035 : 0

            const trailOn = !calm && P.trail > 0
            const halfLife = (P.trail / 100) * 1.1
            const fade = trailOn
                ? Math.pow(0.5, dt / Math.max(0.02, halfLife))
                : 0

            const c = P.contrast
            const gain = c >= 0 ? 1 + c / 50 : 1 + c / 100
            const lift = P.brightness / 200

            // iteration window
            let c0 = 0
            let c1 = cols - 1
            let r0 = 0
            let r1 = rows - 1
            let lensBox: Box | null = null
            if (lensOn) {
                const span = reachMax + cell
                lensBox = {
                    c0: Math.max(0, Math.floor((s.x - span) / cell)),
                    c1: Math.min(cols - 1, Math.ceil((s.x + span) / cell)),
                    r0: Math.max(0, Math.floor((s.y - span) / cell)),
                    r1: Math.min(rows - 1, Math.ceil((s.y + span) / cell)),
                }
            }
            if (!outside) {
                let b: Box | null = lensBox
                if (s.trailAlive && s.trailBox) {
                    const tb = s.trailBox
                    b = b
                        ? {
                              c0: Math.min(b.c0, tb.c0),
                              c1: Math.max(b.c1, tb.c1),
                              r0: Math.min(b.r0, tb.r0),
                              r1: Math.max(b.r1, tb.r1),
                          }
                        : tb
                }
                if (!b) return
                c0 = b.c0
                c1 = b.c1
                r0 = b.r0
                r1 = b.r1
            }
            if (trailOn && lensBox) {
                const tb = s.trailBox
                s.trailBox = tb
                    ? {
                          c0: Math.min(tb.c0, lensBox.c0),
                          c1: Math.max(tb.c1, lensBox.c1),
                          r0: Math.min(tb.r0, lensBox.r0),
                          r1: Math.max(tb.r1, lensBox.r1),
                      }
                    : lensBox
            }

            let hottest = 0
            for (let r = r0; r <= r1; r++) {
                const dy = (r + 0.5) * cell - s.y
                const rowBase = r * cols
                const tRow = (r % n) * n
                for (let col = c0; col <= c1; col++) {
                    const idx = rowBase + col
                    const dx = (col + 0.5) * cell - s.x

                    // ---- lens membership (stretched along motion, comet tail behind)
                    let inLens = false
                    if (lensOn) {
                        const along = dx * ux + dy * uy
                        const across = -dx * uy + dy * ux
                        const ea = along / longAxis
                        const ec = across / shortAxis
                        const d = Math.sqrt(ea * ea + ec * ec)
                        if (d <= coreSafe) {
                            inLens = true
                        } else if (d <= reachMax) {
                            let a = Math.atan2(dy, dx) / TAU + spin
                            a -= Math.floor(a)
                            const bin = Math.min(
                                BIN_COUNT - 1,
                                (a * BIN_COUNT) | 0
                            )
                            const rim = half * (1 - jitter[bin])
                            if (d <= rim) {
                                inLens = true
                            } else {
                                const raw = Math.sqrt(dx * dx + dy * dy) || 1
                                const behind = Math.max(0, -along / raw)
                                let len =
                                    length[bin] *
                                    extra *
                                    (1 + behind * tailBoost)
                                if (len > 0 && sway)
                                    len *=
                                        0.7 +
                                        0.3 *
                                            Math.sin(t * 1.1 + phase[bin] * TAU)
                                if (len > 0 && d <= rim + len) {
                                    const k = (d - rim) / len
                                    const g =
                                        (d - rim) / gapPitch +
                                        phase[bin] * 3 -
                                        t * 0.6 * (sway ? 1 : 0)
                                    const inGap =
                                        g - Math.floor(g) < 0.26 && k > 0.18
                                    if (
                                        !inGap &&
                                        cellNoise(col, r) >
                                            Math.pow(k, 0.85) * 0.96
                                    )
                                        inLens = true
                                }
                            }
                        }
                    }

                    // ---- trailing ink memory
                    let lit = inLens
                    if (trailOn) {
                        let hv = heat[idx] * fade
                        if (inLens) hv = 1
                        heat[idx] = hv
                        if (hv > hottest) hottest = hv
                        lit =
                            hv >
                            0.08 + cellNoise(col * 7 + 3, r * 13 + 1) * 0.86
                    }

                    if (lit === outside) continue
                    if (cover[idx] < 8) continue

                    const l = (tone[idx] - 0.5) * gain + 0.5 + lift
                    const tint = l > table[tRow + (col % n)] ? paper : ink
                    const o = idx * 4
                    data[o] = tint[0]
                    data[o + 1] = tint[1]
                    data[o + 2] = tint[2]
                    data[o + 3] = tint[3]
                }
            }

            if (trailOn) {
                s.trailAlive = hottest > 0.09
                if (!s.trailAlive && !lensOn) {
                    s.trailBox = null
                    heat.fill(0)
                }
            } else if (s.trailAlive) {
                s.trailAlive = false
                s.trailBox = null
                heat.fill(0)
            }

            s.plateCtx.putImageData(s.pixels, 0, 0)
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(
                s.plate as HTMLCanvasElement,
                0,
                0,
                cols * cell * s.dpr,
                rows * cell * s.dpr
            )
        }

        /* ---------- motion ---------- */

        const step = (now: number) => {
            s.frame = 0
            if (!(s.seen && s.tabOn)) return
            const P = propsRef.current
            const dt = Math.min(
                0.05,
                Math.max(0.001, (now - s.lastAt) / 1000 || 0.016)
            )
            s.lastAt = now
            s.clock += dt
            const calm = s.reduced

            // cursor follow: soft spring, slightly under-damped for a fluid swing
            if (calm) {
                s.x = s.aimX
                s.y = s.aimY
                s.vx = s.vy = 0
            } else {
                const f = Math.max(0, Math.min(100, P.flow)) / 100
                const k = 520 - f * 470
                const damp = 2 * Math.sqrt(k) * 0.86
                const sub = 3
                const h = dt / sub
                for (let i = 0; i < sub; i++) {
                    s.vx += ((s.aimX - s.x) * k - s.vx * damp) * h
                    s.vy += ((s.aimY - s.y) * k - s.vy * damp) * h
                    s.x += s.vx * h
                    s.y += s.vy * h
                }
                if (
                    Math.abs(s.aimX - s.x) < 0.05 &&
                    Math.abs(s.aimY - s.y) < 0.05 &&
                    Math.abs(s.vx) < 0.5 &&
                    Math.abs(s.vy) < 0.5
                ) {
                    s.x = s.aimX
                    s.y = s.aimY
                    s.vx = s.vy = 0
                }
            }

            // stretch along travel direction
            const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy)
            if (speed > 1) {
                const blend = 1 - Math.pow(0.001, dt)
                s.dirX += (s.vx / speed - s.dirX) * blend
                s.dirY += (s.vy / speed - s.dirY) * blend
                const m = Math.sqrt(s.dirX * s.dirX + s.dirY * s.dirY) || 1
                s.dirX /= m
                s.dirY /= m
            }
            const amount = Math.max(0, Math.min(100, P.stretch)) / 100
            const goalPull = calm
                ? 0
                : Math.min(0.75, (speed / 2200) * amount * 1.4)
            s.pull += (goalPull - s.pull) * (1 - Math.pow(0.0005, dt))
            if (s.pull < 0.001 && goalPull === 0) s.pull = 0

            // zone bloom: spring with a gentle overshoot
            const goal = s.inside ? 1 : 0
            if (calm) {
                s.presence = goal
                s.presenceV = 0
            } else {
                const k = 150
                const damp = 2 * Math.sqrt(k) * (s.inside ? 0.6 : 0.95)
                s.presenceV +=
                    ((goal - s.presence) * k - s.presenceV * damp) * dt
                s.presence += s.presenceV * dt
                if (
                    Math.abs(goal - s.presence) < 0.0015 &&
                    Math.abs(s.presenceV) < 0.01
                ) {
                    s.presence = goal
                    s.presenceV = 0
                }
            }

            // fresh video frame?
            let filmMoving = false
            if (s.useFilm && s.film && !s.blocked) {
                const v = s.film
                filmMoving = !v.paused && !v.ended
                if (v.currentTime !== s.filmTime && v.readyState >= 2) {
                    s.filmTime = v.currentTime
                    capture()
                }
            }

            paint(dt)

            const outside = P.mode === "outside"
            const lensSettled =
                s.x === s.aimX &&
                s.y === s.aimY &&
                s.presence === goal &&
                s.presenceV === 0 &&
                s.pull === 0
            const drifting =
                P.drift &&
                !calm &&
                s.presence > 0.002 &&
                P.reach > 0 &&
                P.streaks > 0
            const filmNeedsFrames =
                filmMoving && (outside || s.presence > 0.002 || s.trailAlive)
            const busy =
                !lensSettled || drifting || s.trailAlive || filmNeedsFrames
            if (busy) s.frame = requestAnimationFrame(step)
        }

        const wake = () => {
            if (s.frame || !(s.seen && s.tabOn)) return
            if (typeof requestAnimationFrame === "undefined") return
            s.lastAt = performance.now()
            s.frame = requestAnimationFrame(step)
        }

        const playback = () => {
            const v = s.film
            if (!v || !s.useFilm) return
            if (s.seen && s.tabOn) {
                const go = v.play()
                if (go && typeof go.catch === "function") go.catch(() => {})
            } else {
                v.pause()
            }
        }

        engine.current = { wake, layout, capture, playback }
    }

    // Image source.
    useEffect(() => {
        s.picture = null
        if (wantsFilm || !imageSrc) {
            s.readable = false
            engine.current!.wake()
            return
        }
        s.useFilm = false
        s.blocked = false
        s.readable = false
        let cancelled = false
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
            if (cancelled) return
            s.picture = img
            engine.current!.layout()
            engine.current!.wake()
        }
        img.src = imageSrc
        return () => {
            cancelled = true
            img.onload = null
        }
    }, [imageSrc, wantsFilm])

    // Video source.
    useEffect(() => {
        const v = filmRef.current
        if (!showFilm || !v) {
            s.film = null
            s.useFilm = false
            return
        }
        s.film = v
        s.useFilm = true
        s.blocked = false
        s.readable = false
        s.filmTime = -1
        const ready = () => {
            engine.current!.layout()
            engine.current!.playback()
            engine.current!.wake()
        }
        const resume = () => engine.current!.wake()
        v.addEventListener("loadeddata", ready)
        v.addEventListener("play", resume)
        v.addEventListener("seeked", resume)
        if (v.readyState >= 2) ready()
        else engine.current!.playback()
        return () => {
            v.removeEventListener("loadeddata", ready)
            v.removeEventListener("play", resume)
            v.removeEventListener("seeked", resume)
            v.pause()
        }
    }, [videoSrc, showFilm])

    // Size tracking.
    useEffect(() => {
        const shell = shellRef.current
        const canvas = canvasRef.current
        if (!shell || !canvas) return
        const measure = () => {
            const w = shell.clientWidth
            const h = shell.clientHeight
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            if (w === s.w && h === s.h && dpr === s.dpr) return
            s.w = w
            s.h = h
            s.dpr = dpr
            canvas.width = Math.max(1, Math.round(w * dpr))
            canvas.height = Math.max(1, Math.round(h * dpr))
            engine.current!.layout()
            engine.current!.wake()
        }
        measure()
        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(measure)
            ro.observe(shell)
            return () => ro.disconnect()
        }
        window.addEventListener("resize", measure)
        return () => window.removeEventListener("resize", measure)
    }, [])

    // Visibility gating: viewport + tab.
    useEffect(() => {
        const shell = shellRef.current
        const park = () => {
            if (s.frame) cancelAnimationFrame(s.frame)
            s.frame = 0
            s.inside = false
            s.presence = 0
            s.presenceV = 0
            s.x = s.aimX
            s.y = s.aimY
            s.vx = s.vy = 0
            s.pull = 0
            s.trailAlive = false
            s.trailBox = null
            if (s.heat) s.heat.fill(0)
            engine.current!.playback()
        }
        const resume = () => {
            engine.current!.playback()
            engine.current!.wake()
        }
        const onTab = () => {
            s.tabOn = document.visibilityState !== "hidden"
            if (s.tabOn) resume()
            else park()
        }
        onTab()
        document.addEventListener("visibilitychange", onTab)

        let io: IntersectionObserver | null = null
        if (shell && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    const hit = entries.some((e) => e.isIntersecting)
                    s.seen = hit
                    if (hit) resume()
                    else park()
                },
                { threshold: 0 }
            )
            io.observe(shell)
        } else {
            s.seen = true
            resume()
        }
        return () => {
            document.removeEventListener("visibilitychange", onTab)
            if (io) io.disconnect()
            s.seen = false
            park()
        }
    }, [])

    // Grid-affecting props.
    useEffect(() => {
        engine.current!.layout()
        engine.current!.wake()
    }, [p.dotSize, p.fit])

    // Any other visual prop.
    useEffect(() => {
        engine.current!.wake()
    }, [
        p.mode,
        p.zoneSize,
        p.matrix,
        p.flow,
        p.stretch,
        p.trail,
        p.streaks,
        p.reach,
        p.drift,
        p.contrast,
        p.brightness,
        p.ink,
        p.paper,
        reduced,
    ])

    const locate = (e: React.PointerEvent<HTMLDivElement>) => {
        const shell = shellRef.current
        if (!shell) return
        const rect = shell.getBoundingClientRect()
        const kx = rect.width ? s.w / rect.width : 1
        const ky = rect.height ? s.h / rect.height : 1
        s.aimX = (e.clientX - rect.left) * kx
        s.aimY = (e.clientY - rect.top) * ky
        if (!s.inside && s.presence < 0.01) {
            s.x = s.aimX
            s.y = s.aimY
            s.vx = s.vy = 0
        }
        s.inside = true
        engine.current!.wake()
    }
    const release = () => {
        s.inside = false
        engine.current!.wake()
    }

    const fill: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: p.fit,
        objectPosition: "center",
        display: "block",
        pointerEvents: "none",
    }

    return (
        <div
            ref={shellRef}
            onPointerEnter={locate}
            onPointerMove={locate}
            onPointerDown={locate}
            onPointerLeave={release}
            onPointerCancel={release}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: p.radius,
                background: p.background,
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            {showFilm ? (
                <video
                    key={videoSrc}
                    ref={filmRef}
                    src={videoSrc}
                    poster={posterSrc || undefined}
                    crossOrigin="anonymous"
                    muted
                    loop
                    playsInline
                    preload="auto"
                    style={fill}
                />
            ) : !wantsFilm && imageSrc ? (
                <img
                    src={imageSrc}
                    srcSet={
                        p.image && p.image.src === imageSrc
                            ? p.image.srcSet
                            : undefined
                    }
                    alt={(p.image && p.image.alt) || ""}
                    draggable={false}
                    style={fill}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.55)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 14,
                    }}
                >
                    {wantsFilm ? "Add a video" : "Add an image"}
                </div>
            )}
            <canvas
                ref={canvasRef}
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                    imageRendering: "pixelated",
                }}
            />
            {p.showToggle && (
                <MediaSwitch
                    kind={kind}
                    look={p.toggle}
                    onPick={(k) => {
                        if (k === kind) return
                        s.inside = false
                        setKind(k)
                    }}
                />
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

Mezzotint.defaultProps = {
    media: "image",
    showToggle: true,
    toggle: SWITCHER_DEFAULTS,
    imageUrl: FALLBACK_IMAGE,
    videoUrl: "",
    fit: "cover",
    mode: "inside",
    zoneSize: 240,
    dotSize: 3,
    matrix: "8",
    flow: 60,
    stretch: 60,
    trail: 45,
    streaks: 55,
    reach: 70,
    drift: true,
    contrast: 20,
    brightness: 0,
    ink: "#000000",
    paper: "#FFFFFF",
    background: "#0E0E0E",
    radius: 0,
}

addPropertyControls(Mezzotint, {
    media: {
        type: ControlType.Enum,
        title: "Start With",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    showToggle: {
        type: ControlType.Boolean,
        title: "Canvas Toggle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    toggle: {
        type: ControlType.Object,
        title: "Toggle Style",
        hidden: (props: Props) => !props.showToggle,
        controls: {
            imageLabel: {
                type: ControlType.String,
                title: "Image Label",
                defaultValue: SWITCHER_DEFAULTS.imageLabel,
            },
            videoLabel: {
                type: ControlType.String,
                title: "Video Label",
                defaultValue: SWITCHER_DEFAULTS.videoLabel,
            },
            offset: {
                type: ControlType.Number,
                title: "Corner Offset",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: SWITCHER_DEFAULTS.offset,
            },
            track: {
                type: ControlType.Color,
                title: "Track",
                defaultValue: SWITCHER_DEFAULTS.track,
            },
            knob: {
                type: ControlType.Color,
                title: "Knob",
                defaultValue: SWITCHER_DEFAULTS.knob,
            },
            label: {
                type: ControlType.Color,
                title: "Label",
                defaultValue: SWITCHER_DEFAULTS.label,
            },
            activeLabel: {
                type: ControlType.Color,
                title: "Active Label",
                defaultValue: SWITCHER_DEFAULTS.activeLabel,
            },
        },
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    imageUrl: {
        type: ControlType.String,
        title: "Image URL",
        defaultValue: FALLBACK_IMAGE,
        description: "Used when no image is picked.",
    },
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        defaultValue: "",
        description:
            "Used when no video is uploaded. The host must allow cross-origin access.",
    },
    poster: {
        type: ControlType.ResponsiveImage,
        title: "Poster",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    mode: {
        type: ControlType.Enum,
        title: "Dither",
        options: ["inside", "outside"],
        optionTitles: ["In Zone", "Around Zone"],
        defaultValue: "inside",
        displaySegmentedControl: true,
    },
    zoneSize: {
        type: ControlType.Number,
        title: "Zone Size",
        min: 60,
        max: 500,
        step: 1,
        unit: "px",
        defaultValue: 240,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 1,
        max: 16,
        step: 1,
        unit: "px",
        defaultValue: 3,
    },
    matrix: {
        type: ControlType.Enum,
        title: "Matrix",
        options: ["2", "4", "8"],
        optionTitles: ["2×2", "4×4", "8×8"],
        defaultValue: "8",
        displaySegmentedControl: true,
    },
    flow: {
        type: ControlType.Number,
        title: "Flow",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 60,
        description: "How softly the zone glides after the cursor.",
    },
    stretch: {
        type: ControlType.Number,
        title: "Stretch",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 60,
        description: "Zone elongates with speed and streaks sweep behind it.",
    },
    trail: {
        type: ControlType.Number,
        title: "Trail",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 45,
        description:
            "How long the dither lingers and dissolves behind the cursor.",
    },
    streaks: {
        type: ControlType.Number,
        title: "Streaks",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 55,
    },
    reach: {
        type: ControlType.Number,
        title: "Streak Reach",
        min: 0,
        max: 150,
        step: 1,
        unit: "%",
        defaultValue: 70,
    },
    drift: {
        type: ControlType.Boolean,
        title: "Streak Drift",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 20,
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
    },
    ink: {
        type: ControlType.Color,
        title: "Ink",
        defaultValue: "#000000",
    },
    paper: {
        type: ControlType.Color,
        title: "Paper",
        defaultValue: "#FFFFFF",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0E0E0E",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
})
