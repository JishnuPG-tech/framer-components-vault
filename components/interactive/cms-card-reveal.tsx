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
    Children,
    cloneElement,
    isValidElement,
    useEffect,
    useRef,
    useState,
} from "react"
import type { CSSProperties } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ImageValue = { src?: string; srcSet?: string; alt?: string }

type BlogCard = {
    category?: string
    readTime?: string
    title?: string
    date?: string
    image?: ImageValue
    link?: string
}

type FontValue = CSSProperties

type Effect = "burn" | "pixel"

type Origin =
    | "scatter"
    | "cursor"
    | "center"
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight"
    | "top"
    | "bottom"
    | "left"
    | "right"

interface Props {
    content?: any
    fillContent: boolean
    contentPadding: string
    heading: string
    showHeading: boolean
    showCoverTitle: boolean
    coverTitle: string
    showHint: boolean
    hintDesktop: string
    hintMobile: string
    hintGap: number
    coverTitleFont: FontValue
    hintFont: FontValue
    hintColor: string
    hintSize: number
    hintWeight: number
    coverImage?: ImageValue
    pixelated: boolean
    cards: BlogCard[]
    thumbCount: number
    effect: Effect
    duration: number
    origin: Origin
    pixelSize: number
    edgeWidth: number
    ember: number
    charColor: string
    emberColor: string
    seed: number
    canvasPreview: "covered" | "revealed"
    radius: string
    padding: string
    columns: number
    minCardWidth: number
    gap: number
    headerGap: number
    background: string
    cardBackground: string
    cardBorder: string
    cardRadius: number
    cardPadding: number
    showThumbnails: boolean
    thumbnailRatio: number
    headingFont: FontValue
    headingColor: string
    coverTitleColor: string
    titleFont: FontValue
    textColor: string
    metaFont: FontValue
    mutedColor: string
    style?: CSSProperties
}

type Engine = {
    raw: number
    target: number
    raf: number
    last: number
    W: number
    H: number
    dpr: number
    ctx: CanvasRenderingContext2D | null
    img: HTMLImageElement | null
    imgState: "none" | "loading" | "ready"
    drawn: boolean
    reduce: boolean
    touch: boolean
    pt: { x: number; y: number }
    cell: number
    gw: number
    gh: number
    noise: Float32Array | null
    tmap: Float32Array | null
    mcan: HTMLCanvasElement | null
    mctx: CanvasRenderingContext2D | null
    mimg: ImageData | null
    ecan: HTMLCanvasElement | null
    ectx: CanvasRenderingContext2D | null
    eimg: ImageData | null
    charRGB: [number, number, number]
    emberRGB: [number, number, number]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERIF = '"Instrument Serif", "Iowan Old Style", Georgia, serif'
const MONO = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace'

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
    (v) => (v + 0.5) / 16
)

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

const smooth = (a: number, b: number, x: number) => {
    const t = clamp01((x - a) / (b - a))
    return t * t * (3 - 2 * t)
}

const easeInOut = (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

function toPx(v: unknown, fallback: number): number {
    if (typeof v === "number" && isFinite(v)) return v
    if (typeof v === "string") {
        const n = parseFloat(v)
        if (!isNaN(n))
            return v.trim().endsWith("rem") || v.trim().endsWith("em")
                ? n * 16
                : n
    }
    return fallback
}

function parseBox(v: unknown, fb: number): [number, number, number, number] {
    if (typeof v === "number") return [v, v, v, v]
    if (typeof v !== "string" || !v.trim()) return [fb, fb, fb, fb]
    const p = v
        .trim()
        .split(/\s+/)
        .map((s) => parseFloat(s) || 0)
    if (p.length === 1) return [p[0], p[0], p[0], p[0]]
    if (p.length === 2) return [p[0], p[1], p[0], p[1]]
    if (p.length === 3) return [p[0], p[1], p[2], p[1]]
    return [p[0], p[1], p[2], p[3]]
}

function hash(x: number, y: number, s: number): number {
    let h =
        Math.imul(x | 0, 374761393) ^
        Math.imul(y | 0, 668265263) ^
        Math.imul(s | 0, 1274126177)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
}

function valueNoise(x: number, y: number, s: number): number {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    const a = hash(xi, yi, s)
    const b = hash(xi + 1, yi, s)
    const c = hash(xi, yi + 1, s)
    const d = hash(xi + 1, yi + 1, s)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, y: number, s: number): number {
    let sum = 0
    let amp = 0.5
    let freq = 1
    let norm = 0
    for (let o = 0; o < 5; o++) {
        sum += amp * valueNoise(x * freq, y * freq, s + o * 131)
        norm += amp
        amp *= 0.5
        freq *= 2.03
    }
    return sum / norm
}

function normalize(arr: Float32Array) {
    let lo = Infinity
    let hi = -Infinity
    for (let k = 0; k < arr.length; k++) {
        if (arr[k] < lo) lo = arr[k]
        if (arr[k] > hi) hi = arr[k]
    }
    const range = hi - lo || 1
    for (let k = 0; k < arr.length; k++) arr[k] = (arr[k] - lo) / range
}

function scatterSeeds(seed: number): [number, number][] {
    const base: [number, number][] = [
        [0.12, 0.84],
        [0.88, 0.16],
        [0.56, 0.6],
        [0.24, 0.22],
        [0.86, 0.86],
    ]
    return base.map(([x, y], i) => [
        x + (hash(i, 1, seed) - 0.5) * 0.18,
        y + (hash(i, 2, seed) - 0.5) * 0.18,
    ])
}

/** Organic (burn) or blocky (pixel) noise field, cached per size/seed/effect. */
function buildNoise(
    gw: number,
    gh: number,
    cell: number,
    minDim: number,
    effect: Effect,
    seed: number
): Float32Array {
    const out = new Float32Array(gw * gh)
    for (let j = 0; j < gh; j++) {
        for (let i = 0; i < gw; i++) {
            const x = ((i + 0.5) * cell) / minDim
            const y = ((j + 0.5) * cell) / minDim
            let n: number
            if (effect === "pixel") {
                n =
                    0.12 * (fbm(x * 2.2, y * 2.2, seed) - 0.5) * 2 +
                    0.1 * (hash(i, j, seed + 7) - 0.5) * 2
            } else {
                n =
                    0.34 * (fbm(x * 3, y * 3, seed) - 0.5) * 2 +
                    0.05 * (valueNoise(x * 16, y * 16, seed + 3) - 0.5) * 2
            }
            out[j * gw + i] = n
        }
    }
    return out
}

/** Threshold map: 0 = burns first, 1 = burns last. */
function buildThresholds(
    gw: number,
    gh: number,
    cell: number,
    W: number,
    H: number,
    origin: Origin,
    pt: { x: number; y: number },
    seed: number,
    noise: Float32Array
): Float32Array {
    const base = new Float32Array(gw * gh)
    const seeds = scatterSeeds(seed).map(([x, y]) => [x * W, y * H])
    const dist = (ox: number, oy: number, x: number, y: number) =>
        Math.hypot(x - ox, y - oy)

    for (let j = 0; j < gh; j++) {
        for (let i = 0; i < gw; i++) {
            const x = (i + 0.5) * cell
            const y = (j + 0.5) * cell
            let b = 0
            switch (origin) {
                case "cursor":
                    b = dist(pt.x * W, pt.y * H, x, y)
                    break
                case "center":
                    b = dist(W / 2, H / 2, x, y)
                    break
                case "topLeft":
                    b = dist(0, 0, x, y)
                    break
                case "topRight":
                    b = dist(W, 0, x, y)
                    break
                case "bottomLeft":
                    b = dist(0, H, x, y)
                    break
                case "bottomRight":
                    b = dist(W, H, x, y)
                    break
                case "top":
                    b = y
                    break
                case "bottom":
                    b = H - y
                    break
                case "left":
                    b = x
                    break
                case "right":
                    b = W - x
                    break
                default: {
                    let m = Infinity
                    for (const [sx, sy] of seeds)
                        m = Math.min(m, dist(sx, sy, x, y))
                    b = m
                }
            }
            base[j * gw + i] = b
        }
    }
    normalize(base)
    for (let k = 0; k < base.length; k++) base[k] += noise[k]
    normalize(base)
    return base
}

function colorToRGB(
    color: string,
    fallback: [number, number, number]
): [number, number, number] {
    if (typeof document === "undefined") return fallback
    try {
        const c = document.createElement("canvas")
        c.width = c.height = 1
        const x = c.getContext("2d")
        if (!x) return fallback
        x.fillStyle = "#000"
        x.fillStyle = color
        x.fillRect(0, 0, 1, 1)
        const d = x.getImageData(0, 0, 1, 1).data
        return [d[0], d[1], d[2]]
    } catch {
        return fallback
    }
}

function fontParts(font: FontValue | undefined, family: string, size: number) {
    const f = font || {}
    return {
        family: (f.fontFamily as string) || family,
        weight: (f.fontWeight as string | number) || 400,
        style: (f.fontStyle as string) || "normal",
        size: toPx(f.fontSize, size),
        letterSpacing: f.letterSpacing,
    }
}

function setLetterSpacing(
    ctx: CanvasRenderingContext2D,
    ls: unknown,
    size: number
) {
    const anyCtx = ctx as any
    if (!("letterSpacing" in anyCtx)) return
    anyCtx.letterSpacing =
        typeof ls === "number"
            ? `${ls}px`
            : typeof ls === "string" && ls.endsWith("em")
              ? `${parseFloat(ls) * size}px`
              : typeof ls === "string" && ls
                ? ls
                : "0px"
}

function createEngine(): Engine {
    return {
        raw: 0,
        target: 0,
        raf: 0,
        last: 0,
        W: 0,
        H: 0,
        dpr: 1,
        ctx: null,
        img: null,
        imgState: "none",
        drawn: false,
        reduce: false,
        touch: false,
        pt: { x: 0.5, y: 0.5 },
        cell: 4,
        gw: 0,
        gh: 0,
        noise: null,
        tmap: null,
        mcan: null,
        mctx: null,
        mimg: null,
        ecan: null,
        ectx: null,
        eimg: null,
        charRGB: [43, 26, 16],
        emberRGB: [255, 159, 67],
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 680
 */
export default function BlogCoverReveal(props: Props) {
    const {
        content,
        fillContent = true,
        contentPadding = "0px",
        heading = "Blog",
        showHeading = true,
        showCoverTitle = true,
        coverTitle = "Blog",
        showHint = true,
        hintDesktop = "Hover to read",
        hintMobile = "Touch to view blogs",
        hintGap = 14,
        coverTitleFont,
        hintFont,
        hintColor = "#FFFFFF",
        hintSize = 20,
        hintWeight = 600,
        coverImage,
        cards = [],
        thumbCount = 2,
        effect = "burn",
        canvasPreview = "covered",
        radius = "20px",
        padding = "32px",
        columns = 2,
        minCardWidth = 220,
        gap = 12,
        headerGap = 28,
        background = "#F6F2EA",
        cardBackground = "#FBF8F2",
        cardBorder = "rgba(60, 40, 20, 0.08)",
        cardRadius = 14,
        cardPadding = 16,
        showThumbnails = true,
        thumbnailRatio = 1.9,
        headingFont,
        headingColor = "#1F1A14",
        coverTitleColor = "#FFFFFF",
        titleFont,
        textColor = "#1F1A14",
        metaFont,
        mutedColor = "rgba(31, 26, 20, 0.55)",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const hovering = useRef(false)
    const lastPointer = useRef<string>("")
    const eng = useRef<Engine>(createEngine())
    const propsRef = useRef<Props>(props)
    propsRef.current = props

    const [open, setOpen] = useState(false)
    const [ready, setReady] = useState(false)
    const [cols, setCols] = useState(Math.max(1, Math.round(columns)))
    const [isTouch, setIsTouch] = useState(false)

    const pad = parseBox(padding, 32)
    const hFont = fontParts(headingFont, SERIF, 40)
    const ctFont = fontParts(coverTitleFont, SERIF, 72)
    const hiFont = {
        ...fontParts(hintFont, MONO, 20),
        size: hintSize,
        weight: hintWeight,
    }

    // ---------------- engine functions (read refs only) ----------------

    const computeCols = () => {
        const root = rootRef.current
        if (!root) return
        const P = propsRef.current
        const p = parseBox(P.padding ?? "32px", 32)
        const inner = root.clientWidth - p[1] - p[3]
        const g = P.gap ?? 12
        const maxCols = Math.max(1, Math.round(P.columns ?? 2))
        const fit = Math.floor((inner + g) / ((P.minCardWidth ?? 220) + g))
        setCols(Math.max(1, Math.min(maxCols, fit || 1)))
    }

    const rebuildNoise = () => {
        const e = eng.current
        const P = propsRef.current
        if (!e.W || !e.H || typeof document === "undefined") return
        const fx: Effect = P.effect === "pixel" ? "pixel" : "burn"
        const cell =
            fx === "pixel" ? Math.max(4, Math.round(P.pixelSize ?? 16)) : 4
        e.cell = cell
        e.gw = Math.ceil(e.W / cell)
        e.gh = Math.ceil(e.H / cell)
        e.noise = buildNoise(
            e.gw,
            e.gh,
            cell,
            Math.min(e.W, e.H),
            fx,
            Math.round(P.seed ?? 7)
        )

        if (!e.mcan) e.mcan = document.createElement("canvas")
        if (!e.ecan) e.ecan = document.createElement("canvas")
        e.mcan.width = e.ecan.width = e.gw
        e.mcan.height = e.ecan.height = e.gh
        e.mctx = e.mcan.getContext("2d")
        e.ectx = e.ecan.getContext("2d")
        e.mimg = e.mctx ? e.mctx.createImageData(e.gw, e.gh) : null
        e.eimg = e.ectx ? e.ectx.createImageData(e.gw, e.gh) : null
    }

    const rebuildMap = () => {
        const e = eng.current
        const P = propsRef.current
        if (!e.noise || !e.W || !e.H) return
        e.tmap = buildThresholds(
            e.gw,
            e.gh,
            e.cell,
            e.W,
            e.H,
            P.origin ?? "scatter",
            e.pt,
            Math.round(P.seed ?? 7),
            e.noise
        )
    }

    const paintCover = (ctx: CanvasRenderingContext2D, e: Engine, P: Props) => {
        const { W, H } = e
        if (e.img && e.imgState === "ready" && e.img.naturalWidth) {
            const iw = e.img.naturalWidth
            const ih = e.img.naturalHeight
            const s = Math.max(W / iw, H / ih)
            const dw = iw * s
            const dh = ih * s
            ctx.imageSmoothingEnabled = !P.pixelated
            ctx.imageSmoothingQuality = "high"
            ctx.drawImage(e.img, (W - dw) / 2, (H - dh) / 2, dw, dh)
        } else {
            const g = ctx.createLinearGradient(0, 0, W, H)
            g.addColorStop(0, "#2B1D14")
            g.addColorStop(1, "#7A4E2B")
            ctx.fillStyle = g
            ctx.fillRect(0, 0, W, H)
        }

        const title = (P.showCoverTitle ?? true) ? (P.coverTitle ?? "Blog") : ""
        const hint =
            (P.showHint ?? true)
                ? e.touch
                    ? (P.hintMobile ?? "Touch to view blogs")
                    : (P.hintDesktop ?? "Hover to read")
                : ""
        if (!title && !hint) return

        const tf = fontParts(P.coverTitleFont, SERIF, 72)
        const hf = {
            ...fontParts(P.hintFont, MONO, 20),
            size: P.hintSize ?? 20,
            weight: P.hintWeight ?? 600,
        }
        const maxW = W * 0.86
        ctx.textAlign = "center"
        ctx.textBaseline = "alphabetic"

        // Title: scale down to fit narrow (phone) widths
        let tSize = tf.size
        let tAsc = 0
        let tDesc = 0
        if (title) {
            ctx.font = `${tf.style} ${tf.weight} ${tSize}px ${tf.family}`
            setLetterSpacing(ctx, tf.letterSpacing, tSize)
            const w = ctx.measureText(title).width
            if (w > maxW) {
                tSize = tSize * (maxW / w)
                ctx.font = `${tf.style} ${tf.weight} ${tSize}px ${tf.family}`
                setLetterSpacing(ctx, tf.letterSpacing, tSize)
            }
            const m = ctx.measureText(title)
            tAsc = (m as any).actualBoundingBoxAscent ?? tSize * 0.72
            tDesc = (m as any).actualBoundingBoxDescent ?? tSize * 0.2
        }

        let hSize = hf.size
        let hAsc = 0
        let hDesc = 0
        if (hint) {
            ctx.font = `${hf.style} ${hf.weight} ${hSize}px ${hf.family}`
            setLetterSpacing(ctx, hf.letterSpacing, hSize)
            const w = ctx.measureText(hint).width
            if (w > maxW) {
                hSize = hSize * (maxW / w)
                ctx.font = `${hf.style} ${hf.weight} ${hSize}px ${hf.family}`
                setLetterSpacing(ctx, hf.letterSpacing, hSize)
            }
            const m = ctx.measureText(hint)
            hAsc = (m as any).actualBoundingBoxAscent ?? hSize * 0.72
            hDesc = (m as any).actualBoundingBoxDescent ?? hSize * 0.2
        }

        const gapY = title && hint ? (P.hintGap ?? 14) : 0
        const block = tAsc + tDesc + gapY + hAsc + hDesc
        const top = (H - block) / 2
        const cx = W / 2

        ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
        ctx.shadowBlur = 18
        ctx.shadowOffsetY = 1

        if (title) {
            ctx.font = `${tf.style} ${tf.weight} ${tSize}px ${tf.family}`
            setLetterSpacing(ctx, tf.letterSpacing, tSize)
            ctx.fillStyle = P.coverTitleColor ?? "#FFFFFF"
            ctx.fillText(title, cx, top + tAsc)
        }
        if (hint) {
            ctx.font = `${hf.style} ${hf.weight} ${hSize}px ${hf.family}`
            setLetterSpacing(ctx, hf.letterSpacing, hSize)
            ctx.fillStyle = P.hintColor ?? "#FFFFFF"
            const hy = top + tAsc + tDesc + gapY + hAsc
            ctx.shadowColor = "rgba(0, 0, 0, 0.75)"
            ctx.shadowBlur = 12
            ctx.shadowOffsetY = 1
            ctx.fillText(hint, cx, hy)
            ctx.shadowBlur = 4
            ctx.fillText(hint, cx, hy)
        }

        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
        ctx.textAlign = "left"
        setLetterSpacing(ctx, 0, 1)
    }

    const paintMask = (
        ctx: CanvasRenderingContext2D,
        e: Engine,
        P: Props,
        p: number
    ) => {
        const { gw, gh, cell, tmap, mcan, mctx, mimg } = e
        if (!tmap || !mcan || !mctx || !mimg) return
        const md = mimg.data
        const n = gw * gh

        if (P.effect === "pixel") {
            const soft = 0.22
            const T = -soft + p * (1 + soft)
            for (let j = 0; j < gh; j++) {
                for (let i = 0; i < gw; i++) {
                    const k = j * gw + i
                    const val = (tmap[k] - T) / soft
                    md[k * 4 + 3] =
                        val > BAYER[((j & 3) << 2) | (i & 3)] ? 255 : 0
                }
            }
            mctx.putImageData(mimg, 0, 0)
            ctx.imageSmoothingEnabled = false
            ctx.globalCompositeOperation = "destination-in"
            ctx.drawImage(mcan, 0, 0, gw * cell, gh * cell)
            return
        }

        const { ecan, ectx, eimg } = e
        if (!ecan || !ectx || !eimg) return
        const ed = eimg.data
        const band = 0.01 + clamp01((P.edgeWidth ?? 45) / 100) * 0.12
        const soft = 0.012
        const T = -band + p * (1 + band)
        const emberAmt = clamp01((P.ember ?? 35) / 100)
        const fadeIn = Math.min(1, p * 12)
        const [cr, cg, cb] = e.charRGB
        const [er, eg, eb] = e.emberRGB

        for (let k = 0; k < n; k++) {
            const t = tmap[k]
            const k4 = k * 4
            md[k4 + 3] = (smooth(T, T + soft, t) * 255) | 0
            const d = (t - T) / band
            if (d > 0 && d < 1) {
                const w = (1 - smooth(0, 0.4, d)) * emberAmt
                const a = Math.pow(1 - d, 1.6) * 0.92 * fadeIn
                ed[k4] = cr + (er - cr) * w
                ed[k4 + 1] = cg + (eg - cg) * w
                ed[k4 + 2] = cb + (eb - cb) * w
                ed[k4 + 3] = a * 255
            } else {
                ed[k4 + 3] = 0
            }
        }
        mctx.putImageData(mimg, 0, 0)
        ectx.putImageData(eimg, 0, 0)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.globalCompositeOperation = "source-atop"
        ctx.drawImage(ecan, 0, 0, gw * cell, gh * cell)
        ctx.globalCompositeOperation = "destination-in"
        ctx.drawImage(mcan, 0, 0, gw * cell, gh * cell)
    }

    const draw = () => {
        const e = eng.current
        const c = canvasRef.current
        const ctx = e.ctx
        if (!c || !ctx || !e.W || !e.H) return
        const P = propsRef.current
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalCompositeOperation = "source-over"
        ctx.clearRect(0, 0, c.width, c.height)
        const p = easeInOut(e.raw)
        if (p < 0.9999) {
            ctx.setTransform(e.dpr, 0, 0, e.dpr, 0, 0)
            paintCover(ctx, e, P)
            if (p > 0.0001) paintMask(ctx, e, P, p)
            ctx.globalCompositeOperation = "source-over"
            ctx.setTransform(1, 0, 0, 1, 0, 0)
        }
        if (!e.drawn && e.imgState !== "loading") {
            e.drawn = true
            setReady(true)
        }
    }

    const tick = (now: number) => {
        const e = eng.current
        const P = propsRef.current
        const dt = e.last ? Math.min(0.1, (now - e.last) / 1000) : 1 / 60
        e.last = now
        const dur = e.reduce ? 0.12 : Math.max(0.1, P.duration ?? 1.2)
        const step = dt / dur
        e.raw =
            e.target > e.raw
                ? Math.min(e.target, e.raw + step)
                : Math.max(e.target, e.raw - step)
        draw()
        if (e.raw !== e.target) {
            e.raf = requestAnimationFrame(tick)
        } else {
            e.raf = 0
            e.last = 0
        }
    }

    const kick = () => {
        const e = eng.current
        if (isStatic || e.raf || typeof window === "undefined") return
        e.last = 0
        e.raf = requestAnimationFrame(tick)
    }

    const setTarget = (v: 0 | 1) => {
        const e = eng.current
        if (e.target === v) return
        e.target = v
        setOpen(v === 1)
        kick()
    }

    const setOriginFrom = (clientX: number, clientY: number) => {
        const e = eng.current
        const root = rootRef.current
        if (!root || propsRef.current.origin !== "cursor" || e.raw > 0.02)
            return
        const r = root.getBoundingClientRect()
        e.pt = {
            x: clamp01((clientX - r.left) / (r.width || 1)),
            y: clamp01((clientY - r.top) / (r.height || 1)),
        }
        rebuildMap()
    }

    // ---------------- effects ----------------

    // Size + responsive columns
    useEffect(() => {
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return
        const onResize = () => {
            computeCols()
            if (isStatic) return
            const e = eng.current
            const c = canvasRef.current
            if (!c) return
            const W = root.clientWidth
            const H = root.clientHeight
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            if (W === e.W && H === e.H && dpr === e.dpr && e.ctx) return
            e.W = W
            e.H = H
            e.dpr = dpr
            c.width = Math.max(1, Math.round(W * dpr))
            c.height = Math.max(1, Math.round(H * dpr))
            e.ctx = c.getContext("2d")
            rebuildNoise()
            rebuildMap()
            draw()
        }
        const ro = new ResizeObserver(onResize)
        ro.observe(root)
        onResize()
        return () => ro.disconnect()
    }, [isStatic])

    useEffect(() => {
        computeCols()
    }, [columns, minCardWidth, gap, padding])

    // Reduced motion + cleanup
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)")
        const e = eng.current
        e.reduce = !!mq?.matches
        const onChange = () => (e.reduce = !!mq?.matches)
        mq?.addEventListener?.("change", onChange)
        return () => {
            mq?.removeEventListener?.("change", onChange)
            if (e.raf) cancelAnimationFrame(e.raf)
            e.raf = 0
        }
    }, [])

    // Cover image
    const coverSrc = coverImage?.src
    useEffect(() => {
        if (isStatic) return
        const e = eng.current
        if (!coverSrc) {
            e.img = null
            e.imgState = "none"
            draw()
            return
        }
        const img = new Image()
        img.decoding = "async"
        e.img = img
        e.imgState = "loading"
        img.onload = () => {
            if (e.img !== img) return
            e.imgState = "ready"
            draw()
        }
        img.onerror = () => {
            if (e.img !== img) return
            e.imgState = "none"
            draw()
        }
        img.src = coverSrc
        return () => {
            img.onload = null
            img.onerror = null
        }
    }, [coverSrc, isStatic])

    // Pattern rebuild
    useEffect(() => {
        if (isStatic) return
        rebuildNoise()
        rebuildMap()
        draw()
    }, [props.effect, props.pixelSize, props.seed, props.origin, isStatic])

    // Edge colors
    useEffect(() => {
        if (isStatic) return
        const e = eng.current
        e.charRGB = colorToRGB(props.charColor ?? "#2B1A10", [43, 26, 16])
        e.emberRGB = colorToRGB(props.emberColor ?? "#FF9F43", [255, 159, 67])
        draw()
    }, [props.charColor, props.emberColor, isStatic])

    // Touch devices get the mobile hint
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(hover: none), (pointer: coarse)")
        const update = () => {
            eng.current.touch = mq.matches
            setIsTouch(mq.matches)
            if (!isStatic) draw()
        }
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [isStatic])

    // Web fonts for the canvas title and hint
    useEffect(() => {
        if (
            isStatic ||
            typeof document === "undefined" ||
            !(document as any).fonts
        )
            return
        let alive = true
        const fonts = (document as any).fonts
        const specs = [
            `${ctFont.style} ${ctFont.weight} ${ctFont.size}px ${ctFont.family}`,
            `${hiFont.style} ${hiFont.weight} ${hiFont.size}px ${hiFont.family}`,
        ]
        Promise.all(
            specs.map((sp) => Promise.resolve(fonts.load(sp)).catch(() => null))
        ).then(() => alive && draw())
        Promise.resolve(fonts.ready).then(() => alive && draw())
        return () => {
            alive = false
        }
    }, [
        ctFont.family,
        ctFont.weight,
        ctFont.size,
        ctFont.style,
        hiFont.family,
        hiFont.weight,
        hiFont.size,
        hiFont.style,
        isStatic,
    ])

    // Redraw on any prop change (title text, colors, padding...)
    useEffect(() => {
        if (!isStatic) draw()
    })

    // ---------------- render ----------------

    const staticRevealed = isStatic && canvasPreview === "revealed"
    const cardsInteractive = isStatic ? staticRevealed : open
    const showDomCover = isStatic ? !staticRevealed : !ready

    const headingStyle: CSSProperties = {
        margin: 0,
        fontWeight: 400,
        letterSpacing: "-0.02em",
        ...headingFont,
        fontFamily: hFont.family,
        fontSize: hFont.size,
        lineHeight: 1,
        color: headingColor,
        whiteSpace: "nowrap",
    }

    const coverTitleStyle: CSSProperties = {
        margin: 0,
        fontWeight: 400,
        ...coverTitleFont,
        fontFamily: ctFont.family,
        fontSize: `min(${ctFont.size}px, 16vw)`,
        lineHeight: 1,
        color: coverTitleColor,
        textAlign: "center",
        whiteSpace: "nowrap",
        textShadow: "0 1px 18px rgba(0, 0, 0, 0.4)",
    }

    const hintStyle: CSSProperties = {
        margin: 0,
        letterSpacing: "0.06em",
        ...hintFont,
        fontFamily: hiFont.family,
        fontSize: hiFont.size,
        fontWeight: hiFont.weight,
        lineHeight: 1.2,
        color: hintColor,
        textAlign: "center",
        whiteSpace: "nowrap",
        textShadow:
            "0 1px 4px rgba(0, 0, 0, 0.75), 0 1px 12px rgba(0, 0, 0, 0.75)",
    }

    const slotEl = Children.toArray(content).find((c) =>
        isValidElement(c)
    ) as any
    const hasSlot = !!slotEl
    const slotNode = hasSlot
        ? fillContent
            ? cloneElement(slotEl, {
                  style: {
                      ...(slotEl.props?.style || {}),
                      width: "100%",
                      height: "100%",
                  },
              })
            : slotEl
        : null
    const slotPad = parseBox(contentPadding, 0)
    const layerPad = hasSlot ? slotPad : pad

    const titleStyle: CSSProperties = {
        margin: 0,
        fontWeight: 400,
        fontSize: 20,
        lineHeight: 1.25,
        letterSpacing: "-0.01em",
        ...titleFont,
        fontFamily: (titleFont?.fontFamily as string) || SERIF,
        color: textColor,
    }

    const metaStyle: CSSProperties = {
        margin: 0,
        fontWeight: 400,
        fontSize: 11,
        letterSpacing: "0.04em",
        lineHeight: 1.4,
        ...metaFont,
        fontFamily: (metaFont?.fontFamily as string) || MONO,
        color: mutedColor,
    }

    return (
        <div
            ref={rootRef}
            role="region"
            aria-label={heading || coverTitle || "Blog"}
            tabIndex={0}
            onPointerDown={(ev) => {
                lastPointer.current = ev.pointerType
            }}
            onPointerEnter={(ev) => {
                if (isStatic || ev.pointerType !== "mouse") return
                hovering.current = true
                setOriginFrom(ev.clientX, ev.clientY)
                setTarget(1)
            }}
            onPointerLeave={(ev) => {
                if (isStatic || ev.pointerType !== "mouse") return
                hovering.current = false
                const active =
                    typeof document !== "undefined"
                        ? document.activeElement
                        : null
                const keyboardFocusInside =
                    !!active &&
                    !!rootRef.current?.contains(active) &&
                    !!(active as HTMLElement).matches?.(":focus-visible")
                if (!keyboardFocusInside) setTarget(0)
            }}
            onClick={(ev) => {
                if (isStatic) return
                if (lastPointer.current === "mouse" || ev.detail === 0) return
                const e = eng.current
                const inLink = (ev.target as HTMLElement).closest?.("a")
                if (e.target === 1 && inLink) return
                if (e.target === 0) setOriginFrom(ev.clientX, ev.clientY)
                setTarget(e.target === 1 ? 0 : 1)
            }}
            onFocus={(ev) => {
                if (isStatic) return
                if ((ev.target as HTMLElement).matches?.(":focus-visible"))
                    setTarget(1)
            }}
            onBlur={(ev) => {
                if (isStatic) return
                const next = ev.relatedTarget as Node | null
                if (next && rootRef.current?.contains(next)) return
                if (!hovering.current) setTarget(0)
            }}
            onKeyDown={(ev) => {
                if (isStatic || ev.target !== ev.currentTarget) return
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault()
                    setTarget(eng.current.target === 1 ? 0 : 1)
                }
            }}
            style={{
                position: "relative",
                boxSizing: "border-box",
                overflow: "hidden",
                borderRadius: radius,
                clipPath: `inset(0 round ${radius})`,
                isolation: "isolate",
                background,
                outline: "none",
                cursor: open ? "default" : "pointer",
                WebkitTapHighlightColor: "transparent",
                ...style,
            }}
        >
            {/* Layer 1: blog cards */}
            <div
                style={{
                    position: "relative",
                    boxSizing: "border-box",
                    minHeight: "100%",
                    height: hasSlot && fillContent ? "100%" : undefined,
                    padding: `${layerPad[0]}px ${layerPad[1]}px ${layerPad[2]}px ${layerPad[3]}px`,
                    display: "flex",
                    flexDirection: "column",
                    gap: headerGap,
                    pointerEvents: cardsInteractive ? "auto" : "none",
                }}
            >
                {showHeading && heading && (
                    <h2 style={headingStyle}>{heading}</h2>
                )}
                {hasSlot ? (
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            minWidth: 0,
                            flex: fillContent ? "1 1 auto" : undefined,
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {slotNode}
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            gap,
                        }}
                    >
                        {cards.map((card, i) => {
                            const Tag: any = card.link ? "a" : "div"
                            const meta = [card.category, card.readTime]
                                .filter(Boolean)
                                .join("  ·  ")
                            return (
                                <Tag
                                    key={i}
                                    href={card.link || undefined}
                                    tabIndex={cardsInteractive ? undefined : -1}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                        padding: cardPadding,
                                        background: cardBackground,
                                        border: `1px solid ${cardBorder}`,
                                        borderRadius: cardRadius,
                                        textDecoration: "none",
                                        color: "inherit",
                                        minWidth: 0,
                                    }}
                                >
                                    {showThumbnails &&
                                        i < thumbCount &&
                                        card.image?.src && (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    aspectRatio: String(
                                                        thumbnailRatio || 1.9
                                                    ),
                                                    overflow: "hidden",
                                                    borderRadius: Math.max(
                                                        0,
                                                        cardRadius -
                                                            cardPadding / 2
                                                    ),
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <img
                                                    src={card.image.src}
                                                    srcSet={card.image.srcSet}
                                                    alt={card.image.alt || ""}
                                                    loading="lazy"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        display: "block",
                                                    }}
                                                />
                                            </div>
                                        )}
                                    {meta && <p style={metaStyle}>{meta}</p>}
                                    {card.title && (
                                        <h3 style={titleStyle}>{card.title}</h3>
                                    )}
                                    {card.date && (
                                        <p style={metaStyle}>{card.date}</p>
                                    )}
                                </Tag>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Layer 2: the cover (canvas, stays fixed; only its mask changes) */}
            {!isStatic && (
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={coverImage?.alt || "Blog cover illustration"}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                        pointerEvents: "none",
                        visibility: ready ? "visible" : "hidden",
                    }}
                />
            )}

            {/* Static cover for the Framer canvas, SSR and first paint */}
            {showDomCover && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: "linear-gradient(135deg, #2B1D14, #7A4E2B)",
                    }}
                >
                    {coverImage?.src && (
                        <img
                            src={coverImage.src}
                            srcSet={coverImage.srcSet}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                imageRendering: props.pixelated
                                    ? "pixelated"
                                    : "auto",
                            }}
                        />
                    )}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: hintGap,
                            padding: 16,
                        }}
                    >
                        {showCoverTitle && coverTitle && (
                            <div style={coverTitleStyle}>{coverTitle}</div>
                        )}
                        {showHint && (
                            <div style={hintStyle}>
                                {isTouch ? hintMobile : hintDesktop}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Defaults + Property Controls
// ---------------------------------------------------------------------------

const DEFAULT_CARDS: BlogCard[] = [
    {
        category: "Design",
        readTime: "6 min",
        title: "Designing interfaces that feel alive",
        date: "Sep 18, 2026",
    },
    {
        category: "Process",
        readTime: "4 min",
        title: "The hidden value of tiny interactions",
        date: "Sep 11, 2026",
    },
    {
        category: "Visual",
        readTime: "8 min",
        title: "Why pixel art still works on the web",
        date: "Aug 29, 2026",
    },
    {
        category: "Notes",
        readTime: "3 min",
        title: "Building a visual language from constraints",
        date: "Aug 17, 2026",
    },
]

BlogCoverReveal.defaultProps = {
    fillContent: true,
    contentPadding: "0px",
    heading: "Blog",
    showHeading: true,
    showCoverTitle: true,
    coverTitle: "Blog",
    showHint: true,
    hintDesktop: "Hover to read",
    hintMobile: "Touch to view blogs",
    hintGap: 14,
    hintColor: "#FFFFFF",
    hintSize: 20,
    hintWeight: 600,
    thumbCount: 2,
    pixelated: false,
    cards: DEFAULT_CARDS,
    effect: "burn",
    duration: 1.2,
    origin: "scatter",
    pixelSize: 16,
    edgeWidth: 45,
    ember: 35,
    charColor: "#2B1A10",
    emberColor: "#FF9F43",
    seed: 7,
    canvasPreview: "covered",
    radius: "20px",
    padding: "32px",
    columns: 2,
    minCardWidth: 220,
    gap: 12,
    headerGap: 28,
    background: "#F6F2EA",
    cardBackground: "#FBF8F2",
    cardBorder: "rgba(60, 40, 20, 0.08)",
    cardRadius: 14,
    cardPadding: 16,
    showThumbnails: true,
    thumbnailRatio: 1.9,
    headingColor: "#1F1A14",
    coverTitleColor: "#FFFFFF",
    textColor: "#1F1A14",
    mutedColor: "rgba(31, 26, 20, 0.55)",
}

addPropertyControls(BlogCoverReveal, {
    // Content (CMS)
    content: {
        type: ControlType.ComponentInstance,
        title: "Content",
        description:
            "Connect a frame holding your CMS Collection List. It replaces the built-in cards below.",
    },
    fillContent: {
        type: ControlType.Boolean,
        title: "Content Size",
        defaultValue: true,
        enabledTitle: "Fill",
        disabledTitle: "Own",
        description:
            "Fill stretches the connected layer to the component width and height.",
    },
    contentPadding: {
        type: ControlType.Padding,
        title: "Content Padding",
        defaultValue: "0px",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Blog",
    },
    showHeading: {
        type: ControlType.Boolean,
        title: "Show Heading",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // Cover
    showCoverTitle: {
        type: ControlType.Boolean,
        title: "Cover Title",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    coverTitle: {
        type: ControlType.String,
        title: "Cover Text",
        defaultValue: "Blog",
        hidden: (p: Props) => p.showCoverTitle === false,
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Hint",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    hintDesktop: {
        type: ControlType.String,
        title: "Hint Desktop",
        defaultValue: "Hover to read",
        hidden: (p: Props) => p.showHint === false,
    },
    hintMobile: {
        type: ControlType.String,
        title: "Hint Mobile",
        defaultValue: "Touch to view blogs",
        hidden: (p: Props) => p.showHint === false,
    },
    hintGap: {
        type: ControlType.Number,
        title: "Hint Gap",
        defaultValue: 14,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (p: Props) => p.showHint === false,
    },
    coverImage: { type: ControlType.ResponsiveImage, title: "Cover Image" },
    pixelated: {
        type: ControlType.Boolean,
        title: "Cover Scaling",
        defaultValue: false,
        enabledTitle: "Crisp",
        disabledTitle: "Smooth",
    },
    cards: {
        type: ControlType.Array,
        title: "Blog Cards",
        description: "Used only when Content is not connected.",
        maxCount: 12,
        defaultValue: DEFAULT_CARDS,
        control: {
            type: ControlType.Object,
            controls: {
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Design",
                },
                readTime: {
                    type: ControlType.String,
                    title: "Read Time",
                    defaultValue: "5 min",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Article title",
                    displayTextArea: true,
                },
                date: {
                    type: ControlType.String,
                    title: "Date",
                    defaultValue: "Sep 1, 2026",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Thumbnail",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },

    thumbCount: {
        type: ControlType.Number,
        title: "Cards w/ Thumb",
        defaultValue: 2,
        min: 0,
        max: 12,
        step: 1,
        displayStepper: true,
        description:
            "First N built-in cards show thumbnails. The rest are headings only.",
    },

    // Reveal
    effect: {
        type: ControlType.Enum,
        title: "Animation",
        defaultValue: "burn",
        options: ["burn", "pixel"],
        optionTitles: ["Burn", "Pixel"],
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.2,
        min: 0.2,
        max: 4,
        step: 0.1,
        unit: "s",
    },
    origin: {
        type: ControlType.Enum,
        title: "Origin",
        defaultValue: "scatter",
        options: [
            "scatter",
            "cursor",
            "center",
            "topLeft",
            "topRight",
            "bottomLeft",
            "bottomRight",
            "top",
            "bottom",
            "left",
            "right",
        ],
        optionTitles: [
            "Multiple Spots",
            "Cursor Entry",
            "Center",
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
            "Top",
            "Bottom",
            "Left",
            "Right",
        ],
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 16,
        min: 4,
        max: 48,
        step: 1,
        unit: "px",
        hidden: (p: Props) => p.effect !== "pixel",
    },
    edgeWidth: {
        type: ControlType.Number,
        title: "Char Width",
        defaultValue: 45,
        min: 0,
        max: 100,
        step: 1,
        hidden: (p: Props) => p.effect === "pixel",
    },
    ember: {
        type: ControlType.Number,
        title: "Ember Glow",
        defaultValue: 35,
        min: 0,
        max: 100,
        step: 1,
        hidden: (p: Props) => p.effect === "pixel",
    },
    charColor: {
        type: ControlType.Color,
        title: "Char Color",
        defaultValue: "#2B1A10",
        hidden: (p: Props) => p.effect === "pixel",
    },
    emberColor: {
        type: ControlType.Color,
        title: "Ember Color",
        defaultValue: "#FF9F43",
        hidden: (p: Props) => p.effect === "pixel",
    },
    seed: {
        type: ControlType.Number,
        title: "Pattern Seed",
        defaultValue: 7,
        min: 1,
        max: 999,
        step: 1,
        displayStepper: true,
    },
    canvasPreview: {
        type: ControlType.Enum,
        title: "Canvas Preview",
        defaultValue: "covered",
        options: ["covered", "revealed"],
        optionTitles: ["Covered", "Revealed"],
        displaySegmentedControl: true,
        description: "Editor only. Live site always starts covered.",
    },

    // Layout
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "20px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "32px",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    minCardWidth: {
        type: ControlType.Number,
        title: "Min Card Width",
        defaultValue: 220,
        min: 120,
        max: 600,
        step: 10,
        unit: "px",
        description:
            "Columns drop automatically when cards get narrower than this.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    headerGap: {
        type: ControlType.Number,
        title: "Header Gap",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },

    // Colors + cards
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F6F2EA",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Fill",
        defaultValue: "#FBF8F2",
    },
    cardBorder: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "rgba(60, 40, 20, 0.08)",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    showThumbnails: {
        type: ControlType.Boolean,
        title: "Thumbnails",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    thumbnailRatio: {
        type: ControlType.Number,
        title: "Thumb Ratio",
        defaultValue: 1.9,
        min: 0.5,
        max: 3,
        step: 0.05,
        hidden: (p: Props) => !p.showThumbnails,
    },

    // Typography
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#1F1A14",
    },
    coverTitleFont: {
        type: ControlType.Font,
        title: "Cover Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "72px",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    coverTitleColor: {
        type: ControlType.Color,
        title: "Cover Title Color",
        defaultValue: "#FFFFFF",
    },
    hintFont: {
        type: ControlType.Font,
        title: "Hint Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "13px",
            letterSpacing: "0.06em",
            lineHeight: "1.2em",
        },
    },
    hintColor: {
        type: ControlType.Color,
        title: "Hint Color",
        defaultValue: "#FFFFFF",
    },
    hintSize: {
        type: ControlType.Number,
        title: "Hint Size",
        defaultValue: 20,
        min: 10,
        max: 48,
        step: 1,
        unit: "px",
    },
    hintWeight: {
        type: ControlType.Number,
        title: "Hint Weight",
        defaultValue: 600,
        min: 100,
        max: 900,
        step: 100,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Card Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            letterSpacing: "-0.01em",
            lineHeight: "1.25em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#1F1A14",
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "11px",
            letterSpacing: "0.04em",
            lineHeight: "1.4em",
        },
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Meta Color",
        defaultValue: "rgba(31, 26, 20, 0.55)",
    },
})
