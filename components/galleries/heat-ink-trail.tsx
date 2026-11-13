// HeatInkCursorTrail.tsx
// Thermochromic ink overlay. The pointer deposits heat into a double-buffered
// canvas field: new marks are dark, swollen and mottled; every frame the field
// is copied forward through a small blur at a time-based retention factor, so
// marks bleed outward and cool on a long exponential tail. Slow movement lays
// down wide, saturated ink; fast movement thins and lightens it. Dwelling or
// holding the button blooms extra heat at one spot. Nothing here is a DOM
// particle or an SVG path — it is three canvases, eight pre-baked brush
// sprites, and one requestAnimationFrame loop that stops when the surface is
// cold.
// v1.0.0

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


// ---------------------------------------------------------------- types

type BlendMode = "normal" | "multiply" | "screen"
type TouchBehavior = "bloom" | "draw" | "off"
type ReducedMotion = "off" | "bloom" | "full"
type Quality = "low" | "medium" | "high"

interface InkProps {
    color: string
    opacity: number
    blendMode: BlendMode
    haloEnabled: boolean
    haloColor: string
    haloStrength: number
    haloSpread: number
}

interface BrushProps {
    minSize: number
    maxSize: number
    speedRange: number
    irregularity: number
}

interface HeatProps {
    fadeMs: number
    diffusion: number
    holdStrength: number
}

interface InputProps {
    touchBehavior: TouchBehavior
    reducedMotion: ReducedMotion
}

interface AdvancedProps {
    quality: Quality
    dprMax: number
    canvasPreview: boolean
    clear: boolean
}

interface Props {
    ink: InkProps
    brush: BrushProps
    heat: HeatProps
    input: InputProps
    advanced: AdvancedProps
    style?: React.CSSProperties
}

/** One quadratic segment queued by a pointer event, drained inside the frame. */
interface Segment {
    ax: number
    ay: number
    cx: number
    cy: number
    bx: number
    by: number
    r0: number
    r1: number
    a0: number
    a1: number
}

interface Bloom {
    x: number
    y: number
    t: number
    life: number
}

// ---------------------------------------------------------------- constants

const SPRITE_COUNT = 8
const SPRITE_STRIDE = 3 // coprime with SPRITE_COUNT — walks the whole set
/**
 * Cooling runs on a tick, not every frame. A canvas alpha channel is 8-bit, so
 * a per-frame retention of exp(-16.7/5200) = 0.9968 rounds straight back to
 * the value it started from for any alpha below ~156 — the field would stall
 * and leave a permanent ghost. Batching the multiply into ~120ms steps makes
 * each one large enough to actually move the value, and costs two full-canvas
 * operations eight times a second instead of sixty.
 */
const COOL_TICK_MS = 120
/**
 * As the field cools the tick lengthens, which keeps the quantization floor at
 * roughly a quarter of whatever the current peak is — so the peak keeps
 * falling instead of freezing. At the low alphas where the long ticks kick in,
 * each step is a couple of levels and cannot be seen.
 */
const COOL_TICK_MAX = 900
const STOP_ALPHA = 3 // probe reading below which the surface counts as cold
const ERASE_DENSITY = 0.02 // fraction of pixels one dither mask removes
const ERASE_MASKS = 4
const MASK_SIZE = 256
const SPACING = 0.2 // stamp gap as a fraction of brush radius
const MAX_STEPS = 240 // stamps per segment, guards against huge pointer jumps
const MAX_QUEUE = 96
const HOLD_RAMP_MS = 420
const DWELL_SPEED = 0.035 // px/ms below which the pointer counts as resting
const DWELL_CAP = 1.1 // total extra alpha one dwell episode may deposit
const DWELL_RATE = 2.2 // deposit per second, as a multiple of max opacity
const DWELL_TIMEOUT = 6000
const SEGMENT_BREAK_MS = 250 // gap after which a stroke restarts instead of bridging
const IDLE_BEFORE_PROBE = 400
const PROBE_INTERVAL = 250
const MAX_FIELD_PIXELS = 4.5e6

const Q_FACTOR: Record<Quality, number> = { low: 0.4, medium: 0.62, high: 1 }

const DEFAULT_INK: InkProps = {
    color: "#141414",
    opacity: 0.26,
    blendMode: "multiply",
    haloEnabled: false,
    haloColor: "#8A4B2F",
    haloStrength: 0.32,
    haloSpread: 1.8,
}
const DEFAULT_BRUSH: BrushProps = {
    minSize: 6,
    maxSize: 26,
    speedRange: 1.5,
    irregularity: 0.55,
}
const DEFAULT_HEAT: HeatProps = {
    fadeMs: 5200,
    diffusion: 0.9,
    holdStrength: 0.7,
}
const DEFAULT_INPUT: InputProps = {
    touchBehavior: "bloom",
    reducedMotion: "off",
}
const DEFAULT_ADVANCED: AdvancedProps = {
    quality: "medium",
    dprMax: 2,
    canvasPreview: true,
    clear: false,
}

// ---------------------------------------------------------------- helpers

const clamp = (v: number, lo: number, hi: number) =>
    v < lo ? lo : v > hi ? hi : v

/** Deterministic PRNG — the irregularity must be repeatable, never flickery. */
function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/**
 * Canvas normalises fillStyle to "#rrggbb" or "rgba(r, g, b, a)", which makes
 * it an exact parser for any CSS colour Framer hands us — no pixel readback,
 * no rounding.
 */
function parseColor(css: string): {
    r: number
    g: number
    b: number
    a: number
} {
    const fallback = { r: 20, g: 20, b: 20, a: 1 }
    if (typeof document === "undefined") return fallback
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return fallback
    ctx.fillStyle = "#000000"
    try {
        ctx.fillStyle = css
    } catch {
        return fallback
    }
    const norm = String(ctx.fillStyle)
    if (norm[0] === "#") {
        const hex = norm.slice(1)
        const n = parseInt(
            hex.length === 3
                ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
                : hex.slice(0, 6),
            16
        )
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 }
    }
    const m = norm.match(/rgba?\(([^)]+)\)/)
    if (!m) return fallback
    const parts = m[1].split(",").map((s) => parseFloat(s))
    return {
        r: parts[0] || 0,
        g: parts[1] || 0,
        b: parts[2] || 0,
        a: parts.length > 3 && isFinite(parts[3]) ? parts[3] : 1,
    }
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
    const c = document.createElement("canvas")
    c.width = Math.max(1, w)
    c.height = Math.max(1, h)
    return c
}

/** Frees the backing store immediately rather than waiting on GC. */
function releaseCanvas(c: HTMLCanvasElement | null) {
    if (!c) return
    c.width = 0
    c.height = 0
}

// ---------------------------------------------------------------- brushes

/**
 * Builds SPRITE_COUNT irregular ink stamps once. Each is a soft radial
 * falloff, plus low-frequency lobes that push the outline out of round, plus
 * fine mottling that survives as fibre inside the stroke. Rotation variance is
 * baked in by generating each variant from its own seed — cheaper than
 * rotating at stamp time, and visually equivalent since the noise is random.
 */
function buildBrushes(
    size: number,
    irregularity: number,
    color: { r: number; g: number; b: number; a: number },
    seed: number
): HTMLCanvasElement[] {
    const sprites: HTMLCanvasElement[] = []
    const irr = clamp(irregularity, 0, 1)

    for (let v = 0; v < SPRITE_COUNT; v++) {
        const c = makeCanvas(size, size)
        const g = c.getContext("2d")
        if (!g) continue
        const rnd = mulberry32(seed + v * 7919)
        const R = size / 2
        const cx = R
        const cy = R

        // 1 — soft radial body. Meaty core, long tail to a clean zero edge.
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, R)
        grad.addColorStop(0, "rgba(255,255,255,1)")
        grad.addColorStop(0.35, "rgba(255,255,255,0.98)")
        grad.addColorStop(0.55, "rgba(255,255,255,0.75)")
        grad.addColorStop(0.72, "rgba(255,255,255,0.38)")
        grad.addColorStop(0.86, "rgba(255,255,255,0.12)")
        grad.addColorStop(1, "rgba(255,255,255,0)")
        g.fillStyle = grad
        g.fillRect(0, 0, size, size)

        const softDot = (
            x: number,
            y: number,
            r: number,
            alpha: number,
            mode: GlobalCompositeOperation
        ) => {
            if (r <= 0.2 || alpha <= 0.001) return
            const gr = g.createRadialGradient(x, y, 0, x, y, r)
            gr.addColorStop(0, `rgba(255,255,255,${alpha})`)
            gr.addColorStop(0.6, `rgba(255,255,255,${alpha * 0.55})`)
            gr.addColorStop(1, "rgba(255,255,255,0)")
            g.globalCompositeOperation = mode
            g.fillStyle = gr
            g.beginPath()
            g.arc(x, y, r, 0, Math.PI * 2)
            g.fill()
        }

        // 2 — low-frequency edge variation: a handful of lobes swelling the
        //     outline outward, plus a couple of bites taken out of the rim.
        const lobes = 7 + Math.floor(rnd() * 4)
        for (let i = 0; i < lobes; i++) {
            const ang = (i / lobes) * Math.PI * 2 + rnd() * 0.9
            const dist = (0.26 + rnd() * 0.3) * R
            softDot(
                cx + Math.cos(ang) * dist,
                cy + Math.sin(ang) * dist,
                (0.3 + rnd() * 0.28) * R,
                0.34 * irr,
                "lighter"
            )
        }
        const bites = 2 + Math.floor(rnd() * 3)
        for (let i = 0; i < bites; i++) {
            const ang = rnd() * Math.PI * 2
            const dist = (0.62 + rnd() * 0.3) * R
            softDot(
                cx + Math.cos(ang) * dist,
                cy + Math.sin(ang) * dist,
                (0.2 + rnd() * 0.24) * R,
                0.3 * irr,
                "destination-out"
            )
        }

        // 3 — internal mottling: paper fibre. Half adds, half subtracts.
        const specks = 24
        for (let i = 0; i < specks; i++) {
            const ang = rnd() * Math.PI * 2
            const dist = Math.sqrt(rnd()) * 0.74 * R
            const x = cx + Math.cos(ang) * dist
            const y = cy + Math.sin(ang) * dist
            const r = (0.05 + rnd() * 0.11) * R
            if (i % 2 === 0) softDot(x, y, r, 0.12 * irr, "lighter")
            else softDot(x, y, r, 0.14 * irr, "destination-out")
        }

        // 4 — tint: keep the alpha we just sculpted, replace RGB with the ink.
        g.globalCompositeOperation = "source-in"
        g.fillStyle = `rgb(${color.r},${color.g},${color.b})`
        g.fillRect(0, 0, size, size)
        g.globalCompositeOperation = "source-over"

        sprites.push(c)
    }
    return sprites
}

/**
 * Paper grain, anchored to canvas space and applied when the field is drawn to
 * the visible canvas. Per-stamp noise cannot produce this: ten overlapping
 * stamps average their own noise into a smooth tube. Real fibre does not move
 * with the brush, so neither does this — it is sampled at a fixed position, so
 * the mottling stays put and reads as ink sitting in paper.
 */
function buildGrain(seed: number): HTMLCanvasElement {
    const out = makeCanvas(MASK_SIZE, MASK_SIZE)
    const og = out.getContext("2d")
    if (!og) return out
    og.imageSmoothingEnabled = true
    // Two octaves: coarse clumps carry the fibre, a finer layer keeps it from
    // looking like blur. Both upscaled, so the texture is soft, not static.
    const octaves: Array<[number, number, GlobalCompositeOperation]> = [
        [40, 1, "source-over"],
        [80, 0.3, "lighter"],
    ]
    for (let o = 0; o < octaves.length; o++) {
        const [n, weight, mode] = octaves[o]
        const src = makeCanvas(n, n)
        const sg = src.getContext("2d")
        if (!sg) continue
        const img = sg.createImageData(n, n)
        const rnd = mulberry32(seed + o * 31337)
        for (let i = 0; i < n * n; i++) {
            // Biased low so the grain mostly thins the ink slightly, with
            // occasional brighter fibres running through it.
            img.data[i * 4 + 3] = Math.round(
                Math.pow(rnd(), 1.6) * 255 * weight
            )
        }
        sg.putImageData(img, 0, 0)
        og.globalCompositeOperation = mode
        og.drawImage(src, 0, 0, MASK_SIZE, MASK_SIZE)
        releaseCanvas(src)
    }
    og.globalCompositeOperation = "source-over"
    return out
}

/**
 * Dither masks for the extinction pass. A multiply can never take an 8-bit
 * alpha to zero — 3 * 0.97 rounds back to 3 forever. These erase a small
 * random fraction of pixels outright, which is absolute rather than
 * proportional, so the field is guaranteed to reach zero. The diffusion blur
 * smooths the holes back out, so it reads as ink drying, not as speckle.
 */
function buildEraseMasks(seed: number): HTMLCanvasElement[] {
    const masks: HTMLCanvasElement[] = []
    for (let m = 0; m < ERASE_MASKS; m++) {
        const c = makeCanvas(MASK_SIZE, MASK_SIZE)
        const g = c.getContext("2d")
        if (!g) continue
        const img = g.createImageData(MASK_SIZE, MASK_SIZE)
        const rnd = mulberry32(seed + m * 104729)
        const d = img.data
        for (let i = 0; i < MASK_SIZE * MASK_SIZE; i++) {
            if (rnd() < ERASE_DENSITY) d[i * 4 + 3] = 255
        }
        g.putImageData(img, 0, 0)
        masks.push(c)
    }
    return masks
}

// ---------------------------------------------------------------- component

/**
 * HEAT INK CURSOR TRAIL
 * A transparent overlay that reacts to the pointer like thermochromic ink.
 * Marks arrive dark and swollen, bleed outward, and cool away over several
 * seconds; overlapping strokes accumulate density and last longer. Sits above
 * existing Framer content without blocking a single link.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
export default function HeatInkCursorTrail(props: Props) {
    const ink = { ...DEFAULT_INK, ...props.ink }
    const brush = { ...DEFAULT_BRUSH, ...props.brush }
    const heat = { ...DEFAULT_HEAT, ...props.heat }
    const input = { ...DEFAULT_INPUT, ...props.input }
    const advanced = { ...DEFAULT_ADVANCED, ...props.advanced }
    const { style } = props

    const isStatic = useIsStaticRenderer()

    const rootRef = React.useRef<HTMLDivElement>(null)
    const viewRef = React.useRef<HTMLCanvasElement>(null)

    // Every mutable drawing value lives in refs. Pointer movement must never
    // trigger a React render.
    const cfgRef = React.useRef({ ink, brush, heat, input, advanced })
    const spritesRef = React.useRef<{
        ink: HTMLCanvasElement[]
        halo: HTMLCanvasElement[] | null
        size: number
    } | null>(null)
    const clearRequestRef = React.useRef<(() => void) | null>(null)

    const [reducedMotion, setReducedMotion] = React.useState(false)
    const [coarsePointer, setCoarsePointer] = React.useState(false)

    // Keep live tunables current without tearing down the loop.
    cfgRef.current = { ink, brush, heat, input, advanced }

    // ------------------------------------------------------ media queries

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
        const coarse = window.matchMedia("(pointer: coarse)")
        setReducedMotion(motion.matches)
        setCoarsePointer(coarse.matches)
        const onMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
        const onCoarse = (e: MediaQueryListEvent) => setCoarsePointer(e.matches)
        motion.addEventListener?.("change", onMotion)
        coarse.addEventListener?.("change", onCoarse)
        return () => {
            motion.removeEventListener?.("change", onMotion)
            coarse.removeEventListener?.("change", onCoarse)
        }
    }, [])

    // What the visitor's motion preference leaves us allowed to do.
    const motionMode: "full" | "bloom" | "off" = reducedMotion
        ? input.reducedMotion === "full"
            ? "full"
            : input.reducedMotion === "bloom"
              ? "bloom"
              : "off"
        : "full"

    // ------------------------------------------------------ sprite cache

    const spriteKey = [
        ink.color,
        ink.haloEnabled ? ink.haloColor : "",
        ink.haloEnabled ? 1 : 0,
        brush.irregularity,
        brush.maxSize,
        advanced.quality,
        advanced.dprMax,
    ].join("|")

    React.useEffect(() => {
        if (typeof document === "undefined") return
        const dpr =
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const cap = coarsePointer
            ? Math.min(advanced.dprMax, 1.5)
            : advanced.dprMax
        const scaleMax = clamp(
            Q_FACTOR[advanced.quality] * Math.min(dpr, cap),
            0.3,
            2
        )
        // Dwell can push a stamp to 1.7x max radius; size the sprite for it.
        const size = clamp(
            Math.ceil(brush.maxSize * 1.7 * 2 * scaleMax),
            96,
            256
        )
        const inkColor = parseColor(ink.color)
        const built = {
            ink: buildBrushes(size, brush.irregularity, inkColor, 1337),
            halo: ink.haloEnabled
                ? buildBrushes(
                      size,
                      brush.irregularity * 0.6,
                      parseColor(ink.haloColor),
                      24601
                  )
                : null,
            size,
        }
        spritesRef.current = built
        return () => {
            if (spritesRef.current === built) spritesRef.current = null
            built.ink.forEach(releaseCanvas)
            built.halo?.forEach(releaseCanvas)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spriteKey, coarsePointer])

    // ------------------------------------------------------ engine

    React.useEffect(() => {
        const root = rootRef.current
        const view = viewRef.current
        if (!root || !view) return
        if (typeof window === "undefined") return

        const vctx = view.getContext("2d")
        if (!vctx) return

        const active = !isStatic && motionMode !== "off"

        // ---- field buffers ------------------------------------------------

        let heatBuf: HTMLCanvasElement | null = null
        let scratchBuf: HTMLCanvasElement | null = null
        let hctx: CanvasRenderingContext2D | null = null
        let sctx: CanvasRenderingContext2D | null = null
        let probe: HTMLCanvasElement | null = null
        let pctx: CanvasRenderingContext2D | null = null
        let fw = 0
        let fh = 0
        let scale = 1 // field pixels per CSS pixel
        let cssW = 0
        let cssH = 0

        // `ctx.filter` is the fast diffusion path. Where it is missing we fall
        // back to five `lighter` taps, which is exact linear compositing on
        // premultiplied alpha — a real box blur, just more blits.
        let filterOK = false
        {
            const t = document.createElement("canvas").getContext("2d")
            if (t) {
                try {
                    t.filter = "blur(1px)"
                    filterOK = t.filter === "blur(1px)"
                } catch {
                    filterOK = false
                }
            }
        }

        const layout = () => {
            const w = root.clientWidth || 1
            const h = root.clientHeight || 1
            const dpr = window.devicePixelRatio || 1
            const cfg = cfgRef.current
            const cap = coarsePointer
                ? Math.min(cfg.advanced.dprMax, 1.5)
                : cfg.advanced.dprMax
            let s = clamp(
                Q_FACTOR[cfg.advanced.quality] * Math.min(dpr, cap),
                0.3,
                2
            )
            // Safety valve for full-viewport overlays on dense screens.
            const px = w * h * s * s
            if (px > MAX_FIELD_PIXELS) s *= Math.sqrt(MAX_FIELD_PIXELS / px)

            const nw = Math.max(1, Math.round(w * s))
            const nh = Math.max(1, Math.round(h * s))
            if (nw === fw && nh === fh && Math.abs(s - scale) < 1e-4) {
                cssW = w
                cssH = h
                return
            }

            const oldHeat = heatBuf
            const sameScale = Math.abs(s - scale) < 1e-4

            const nextHeat = makeCanvas(nw, nh)
            const nextScratch = makeCanvas(nw, nh)
            const nh2 = nextHeat.getContext("2d")
            const ns2 = nextScratch.getContext("2d")
            if (!nh2 || !ns2) return

            // Preserve existing heat only when the field scale is unchanged —
            // rescaling the buffer smears the marks out of alignment.
            if (oldHeat && sameScale && oldHeat.width > 0) {
                nh2.drawImage(oldHeat, 0, 0)
            }

            releaseCanvas(oldHeat)
            releaseCanvas(scratchBuf)
            heatBuf = nextHeat
            scratchBuf = nextScratch
            hctx = nh2
            sctx = ns2
            fw = nw
            fh = nh
            scale = s
            cssW = w
            cssH = h

            view.width = nw
            view.height = nh
            grainPattern = null // resizing resets the context's pattern state

            const pw = Math.max(8, Math.min(256, nw))
            const ph = Math.max(
                8,
                Math.min(192, Math.round((pw * nh) / nw) || 8)
            )
            if (!probe || probe.width !== pw || probe.height !== ph) {
                releaseCanvas(probe)
                probe = makeCanvas(pw, ph)
                pctx = probe.getContext("2d", { willReadFrequently: true })
            }
            present()
        }

        const grain = buildGrain(7717)
        let grainPattern: CanvasPattern | null = null

        const present = () => {
            if (!heatBuf || fw === 0) return
            vctx.setTransform(1, 0, 0, 1, 0, 0)
            vctx.globalAlpha = 1
            vctx.globalCompositeOperation = "source-over"
            vctx.clearRect(0, 0, fw, fh)
            vctx.drawImage(heatBuf, 0, 0)
            const g = cfgRef.current.brush.irregularity * 0.34
            if (g > 0.005) {
                if (!grainPattern)
                    grainPattern = vctx.createPattern(grain, "repeat")
                if (grainPattern) {
                    vctx.globalCompositeOperation = "destination-out"
                    vctx.globalAlpha = g
                    vctx.fillStyle = grainPattern
                    vctx.fillRect(0, 0, fw, fh)
                    vctx.globalAlpha = 1
                    vctx.globalCompositeOperation = "source-over"
                }
            }
        }

        const wipe = () => {
            if (hctx) hctx.clearRect(0, 0, fw, fh)
            if (sctx) sctx.clearRect(0, 0, fw, fh)
            queue.length = 0
            blooms.length = 0
            dwell.accum = 0
            dwell.t = 0
            present()
        }
        clearRequestRef.current = wipe

        // ---- pointer model -------------------------------------------------

        const pointer = {
            has: false,
            inside: false,
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            hasPrev: false,
            ctrlX: 0,
            ctrlY: 0,
            hasCtrl: false,
            lastT: 0,
            lastMoveT: 0,
            speed: 0,
            down: false,
            downT: 0,
            pressure: 0,
            type: "mouse" as string,
            lastR: 0,
            lastA: 0,
            touchDraw: false,
            touchStartX: 0,
            touchStartY: 0,
        }
        const dwell = { t: 0, accum: 0 }
        const queue: Segment[] = []
        const blooms: Bloom[] = []
        const rnd = mulberry32(90210)

        let rect: DOMRect | null = null
        const readRect = () => {
            rect = root.getBoundingClientRect()
            return rect
        }
        const invalidateRect = () => {
            rect = null
        }

        // ---- deposition ----------------------------------------------------

        let spriteIdx = 0
        const nextSprite = () => {
            spriteIdx = (spriteIdx + SPRITE_STRIDE) % SPRITE_COUNT
            return spriteIdx
        }

        /** x, y, r are CSS pixels; converted to field pixels here. */
        const stamp = (
            x: number,
            y: number,
            r: number,
            a: number,
            jitter: number
        ) => {
            const set = spritesRef.current
            if (!set || !hctx) return
            const cfg = cfgRef.current
            const i = nextSprite()
            // Wobble radius and position a little per stamp. Without this the
            // union of many overlapping stamps is a mechanically smooth tube;
            // both offsets scale with radius, so thin fast strokes stay tight.
            const irr = cfg.brush.irregularity
            const j = jitter + irr * 0.09
            const jx = j ? (rnd() * 2 - 1) * r * j : 0
            const jy = j ? (rnd() * 2 - 1) * r * j : 0
            r = r * (1 + (rnd() * 2 - 1) * 0.2 * irr)
            const px = (x + jx) * scale
            const py = (y + jy) * scale
            const pr = Math.max(0.5, r * scale)

            if (set.halo && cfg.ink.haloEnabled) {
                // destination-over keeps the halo strictly underneath ink that
                // is already down, so it rings the mark instead of tinting the
                // core the way a plain source-over pass would.
                const hr = pr * cfg.ink.haloSpread
                hctx.globalCompositeOperation = "destination-over"
                hctx.globalAlpha = clamp(a * cfg.ink.haloStrength, 0, 1)
                hctx.drawImage(set.halo[i], px - hr, py - hr, hr * 2, hr * 2)
                hctx.globalCompositeOperation = "source-over"
            }
            hctx.globalAlpha = clamp(a, 0, 1)
            hctx.drawImage(set.ink[i], px - pr, py - pr, pr * 2, pr * 2)
            hctx.globalAlpha = 1
        }

        /** Speed (px/ms) and pressure to brush radius and per-stamp density. */
        const brushFor = (speed: number, pressure: number, isPen = false) => {
            const cfg = cfgRef.current
            const range = Math.max(0.05, cfg.brush.speedRange)
            const e = Math.pow(clamp(speed / range, 0, 1), 0.7)
            const maxR = Math.max(cfg.brush.minSize, cfg.brush.maxSize)
            const minR = Math.min(cfg.brush.minSize, cfg.brush.maxSize)
            const hold = cfg.heat.holdStrength
            const inkA = parseAlphaCache(cfg.ink.color)
            let r = maxR + (minR - maxR) * e
            let a = cfg.ink.opacity * (1 - 0.75 * e) * inkA
            if (isPen) {
                // A stylus reports real force, so it gets range on both sides
                // of neutral — a feather touch must actually be feint.
                const p = clamp(pressure, 0, 1)
                r *= 0.5 + 0.85 * p
                a *= 0.35 + 0.9 * p
            } else {
                // A mouse has no force; holding the button stands in for it.
                r *= 1 + 0.45 * pressure * hold
                a *= 1 + 0.55 * pressure * hold
            }
            return { r: Math.min(r, maxR * 1.7), a: clamp(a, 0, 1) }
        }

        // The ink colour's own alpha folds into deposit strength. Cached so we
        // are not re-parsing a colour string per stamp.
        let alphaCacheKey = ""
        let alphaCacheVal = 1
        function parseAlphaCache(css: string) {
            if (css !== alphaCacheKey) {
                alphaCacheKey = css
                alphaCacheVal = parseColor(css).a
            }
            return alphaCacheVal
        }

        /**
         * Walks the segment by arc length and stamps every `spacing` pixels,
         * carrying the remainder across segments. Without the carry, a slow
         * stroke on a high-polling-rate mouse would stamp once per event —
         * many times denser than intended, and different on every device.
         */
        let carry = 0
        const drainSegment = (seg: Segment) => {
            const chord = Math.hypot(seg.bx - seg.ax, seg.by - seg.ay)
            const poly =
                Math.hypot(seg.cx - seg.ax, seg.cy - seg.ay) +
                Math.hypot(seg.bx - seg.cx, seg.by - seg.cy)
            const len = (chord + poly) * 0.5
            if (len <= 0) return
            const rAvg = (seg.r0 + seg.r1) * 0.5
            const spacing = Math.max(0.6, rAvg * SPACING)
            // Sample fine enough that no stamp position is off by more than a
            // third of the spacing.
            const sub = clamp(Math.ceil(len / (spacing * 0.34)), 2, MAX_STEPS)
            let px = seg.ax
            let py = seg.ay
            for (let i = 1; i <= sub; i++) {
                const t = i / sub
                const mt = 1 - t
                const x =
                    mt * mt * seg.ax + 2 * mt * t * seg.cx + t * t * seg.bx
                const y =
                    mt * mt * seg.ay + 2 * mt * t * seg.cy + t * t * seg.by
                carry += Math.hypot(x - px, y - py)
                px = x
                py = y
                let guard = 0
                while (carry >= spacing && guard++ < 8) {
                    carry -= spacing
                    stamp(
                        x,
                        y,
                        seg.r0 + (seg.r1 - seg.r0) * t,
                        seg.a0 + (seg.a1 - seg.a0) * t,
                        0
                    )
                }
                if (carry > spacing) carry = spacing
            }
        }

        /** Records one raw pointer sample and queues the smoothed segment. */
        const sample = (x: number, y: number, t: number, pressure: number) => {
            let dt = t - pointer.lastT
            if (!(dt > 0)) dt = 8
            const broke = !pointer.hasPrev || dt > SEGMENT_BREAK_MS
            pointer.lastT = t

            if (broke) {
                pointer.prevX = x
                pointer.prevY = y
                pointer.hasPrev = true
                pointer.hasCtrl = false
                pointer.speed = 0
                const b = brushFor(0, pressure, pointer.type === "pen")
                pointer.lastR = b.r
                pointer.lastA = b.a
                dwell.t = 0
                dwell.accum = 0
                // Prime the carry so the first flick of a new stroke marks
                // immediately instead of waiting a full spacing.
                carry = pointer.lastR * SPACING
                return
            }

            const dist = Math.hypot(x - pointer.prevX, y - pointer.prevY)
            const raw = dist / Math.min(dt, 100)
            // Frame-rate independent EMA — width must not jitter with the
            // browser's event cadence.
            const k = 1 - Math.exp(-Math.min(dt, 100) / 60)
            pointer.speed += (raw - pointer.speed) * k
            if (dist > 0.35) {
                dwell.t = 0
                dwell.accum = 0
            }

            const b = brushFor(pointer.speed, pressure, pointer.type === "pen")

            // Quadratic through midpoints: control point is the previous raw
            // sample, endpoints are the midpoints on either side of it.
            let ax: number, ay: number, cx: number, cy: number
            const mx = (pointer.prevX + x) * 0.5
            const my = (pointer.prevY + y) * 0.5
            if (pointer.hasCtrl) {
                ax = (pointer.ctrlX + pointer.prevX) * 0.5
                ay = (pointer.ctrlY + pointer.prevY) * 0.5
                cx = pointer.prevX
                cy = pointer.prevY
            } else {
                ax = pointer.prevX
                ay = pointer.prevY
                cx = (pointer.prevX + mx) * 0.5
                cy = (pointer.prevY + my) * 0.5
            }

            if (queue.length < MAX_QUEUE) {
                queue.push({
                    ax,
                    ay,
                    cx,
                    cy,
                    bx: mx,
                    by: my,
                    r0: pointer.lastR || b.r,
                    r1: b.r,
                    a0: pointer.lastA || b.a,
                    a1: b.a,
                })
            }

            pointer.ctrlX = pointer.prevX
            pointer.ctrlY = pointer.prevY
            pointer.hasCtrl = true
            pointer.prevX = x
            pointer.prevY = y
            pointer.lastR = b.r
            pointer.lastA = b.a
            pointer.x = x
            pointer.y = y
        }

        // ---- frame ---------------------------------------------------------

        let raf = 0
        let running = false
        let lastTime = 0
        let lastProbe = 0
        let lastActivity = 0
        let probeMax = 255 // starts hot so the first ticks are short

        const start = () => {
            if (running || !active || document.hidden) return
            running = true
            lastTime = 0
            probeMax = Math.max(probeMax, 64)
            raf = requestAnimationFrame(frame)
        }
        const stop = () => {
            running = false
            if (raf) cancelAnimationFrame(raf)
            raf = 0
        }

        const eraseMasks = buildEraseMasks(5150)
        let eraseAcc = 0
        let eraseIdx = 0

        const coolInto = (retention: number, blurPx: number) => {
            if (!sctx || !heatBuf) return
            sctx.setTransform(1, 0, 0, 1, 0, 0)
            sctx.globalCompositeOperation = "source-over"
            sctx.globalAlpha = 1
            sctx.clearRect(0, 0, fw, fh)
            if (filterOK) {
                sctx.globalAlpha = retention
                if (blurPx > 0.01) sctx.filter = `blur(${blurPx}px)`
                sctx.drawImage(heatBuf, 0, 0)
                sctx.filter = "none"
            } else {
                // `lighter` adds premultiplied alpha linearly, so five taps at
                // weights summing to `retention` are an exact box blur.
                const g = Math.max(0.5, blurPx)
                sctx.globalCompositeOperation = "lighter"
                sctx.globalAlpha = retention * 0.44
                sctx.drawImage(heatBuf, 0, 0)
                sctx.globalAlpha = retention * 0.14
                sctx.drawImage(heatBuf, g, 0)
                sctx.drawImage(heatBuf, -g, 0)
                sctx.drawImage(heatBuf, 0, g)
                sctx.drawImage(heatBuf, 0, -g)
                sctx.globalCompositeOperation = "source-over"
            }
            sctx.globalAlpha = 1
            // Swap: scratch becomes the live field.
            const tmpC = heatBuf
            heatBuf = scratchBuf
            scratchBuf = tmpC
            const tmpX = hctx
            hctx = sctx
            sctx = tmpX
        }

        /** Absolute extinction pass — see buildEraseMasks. */
        const erasePass = (amount: number) => {
            if (!hctx) return
            eraseAcc += amount
            if (eraseAcc < ERASE_DENSITY) return
            eraseAcc -= ERASE_DENSITY
            // Built per call: hctx alternates between the two buffers and is
            // replaced on resize, so a cached pattern would go stale.
            const mask = eraseMasks[eraseIdx++ % eraseMasks.length]
            if (!mask) return
            const pat = hctx.createPattern(mask, "repeat")
            if (!pat) return
            const ox = Math.floor(rnd() * MASK_SIZE)
            const oy = Math.floor(rnd() * MASK_SIZE)
            hctx.save()
            hctx.globalCompositeOperation = "destination-out"
            hctx.translate(ox, oy)
            hctx.fillStyle = pat
            hctx.fillRect(-ox, -oy, fw, fh)
            hctx.restore()
            hctx.globalCompositeOperation = "source-over"
        }

        const runDwell = (now: number, dt: number) => {
            const cfg = cfgRef.current
            if (motionMode !== "full") return false
            if (cfg.heat.holdStrength <= 0) return false
            if (!pointer.has || !pointer.inside) return false
            if (pointer.type === "pen" && !pointer.down) return false
            if (pointer.type === "touch" && !pointer.touchDraw) return false
            if (now - pointer.lastMoveT > DWELL_TIMEOUT) return false
            if (pointer.speed > DWELL_SPEED) return false
            if (dwell.accum >= DWELL_CAP) return false

            dwell.t += dt
            const ramp = clamp(dwell.t / 1400, 0, 1)
            const pressure = pointer.pressure
            const base = brushFor(
                pointer.speed,
                pressure,
                pointer.type === "pen"
            )
            const r = Math.min(
                base.r * (1 + 0.5 * ramp * cfg.heat.holdStrength),
                Math.max(cfg.brush.minSize, cfg.brush.maxSize) * 1.7
            )
            // Tuned so a resting cursor slightly outpaces cooling and the mark
            // swells, while a held button builds visibly faster.
            const rate =
                cfg.ink.opacity *
                DWELL_RATE *
                cfg.heat.holdStrength *
                (0.45 + 0.55 * pressure) *
                parseAlphaCache(cfg.ink.color)
            let add = rate * (dt / 1000)
            add = Math.min(add, DWELL_CAP - dwell.accum)
            if (add <= 0.0002) return false
            dwell.accum += add
            // Jittered so the bloom stays a soft mass, not a growing disc.
            stamp(pointer.x, pointer.y, r, add, 0.18)
            return true
        }

        const runBlooms = (dt: number) => {
            if (!blooms.length) return false
            const cfg = cfgRef.current
            const maxR = Math.max(cfg.brush.minSize, cfg.brush.maxSize)
            for (let i = blooms.length - 1; i >= 0; i--) {
                const b = blooms[i]
                b.t += dt
                const p = clamp(b.t / b.life, 0, 1)
                const r = maxR * (0.5 + 0.75 * p)
                const a =
                    cfg.ink.opacity *
                    1.1 *
                    (1 - p * 0.55) *
                    (dt / 1000) *
                    parseAlphaCache(cfg.ink.color) *
                    3
                stamp(b.x, b.y, r, a, 0.2)
                if (p >= 1) blooms.splice(i, 1)
            }
            return true
        }

        let coolAcc = 0

        const frame = (now: number) => {
            if (!running) return
            raf = requestAnimationFrame(frame)
            if (!heatBuf || !hctx || fw === 0) return

            let dt = lastTime ? now - lastTime : 16.7
            lastTime = now
            if (!(dt > 0)) dt = 16.7
            if (dt > 80) dt = 80 // a throttled tab must not wipe the field

            const cfg = cfgRef.current
            const fade = Math.max(200, cfg.heat.fadeMs)

            // Cooling on a tick — see COOL_TICK_MS. Deposits and presentation
            // still happen every frame, so drawing stays continuous.
            const tick = clamp(
                (2 * fade) / Math.max(1, probeMax),
                COOL_TICK_MS,
                COOL_TICK_MAX
            )
            let dirty = false
            coolAcc += dt
            if (coolAcc >= tick) {
                const cd = coolAcc
                coolAcc = 0
                dirty = true
                // Gaussian variance adds linearly, so the radius for one tick
                // scales with the square root of the elapsed time it covers.
                const blurPx =
                    Math.max(0.35, cfg.heat.diffusion) * Math.sqrt(cd / 16.6667)
                coolInto(Math.exp(-cd / fade), blurPx)
                erasePass(cd / (fade * 2.2))
            }

            let busy = false
            if (queue.length) {
                for (let i = 0; i < queue.length; i++) drainSegment(queue[i])
                queue.length = 0
                busy = true
            }
            if (runBlooms(dt)) busy = true
            if (runDwell(now, dt)) busy = true
            if (busy) lastActivity = now

            // Between cool ticks with no new ink the field is unchanged, so
            // there is nothing to blit — an idle trail costs almost nothing.
            if (dirty || busy) present()

            // The probe drives both the adaptive tick and the idle shutdown.
            // A downsampled read costs well under a millisecond four times a
            // second, and is the only honest way to know the surface is cold.
            if (now - lastProbe > PROBE_INTERVAL && pctx && probe) {
                lastProbe = now
                pctx.clearRect(0, 0, probe.width, probe.height)
                pctx.drawImage(heatBuf, 0, 0, probe.width, probe.height)
                const data = pctx.getImageData(
                    0,
                    0,
                    probe.width,
                    probe.height
                ).data
                let max = 0
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] > max) max = data[i]
                }
                probeMax = max
                if (
                    max <= STOP_ALPHA &&
                    now - lastActivity > IDLE_BEFORE_PROBE
                ) {
                    stop()
                    if (hctx) hctx.clearRect(0, 0, fw, fh)
                    if (sctx) sctx.clearRect(0, 0, fw, fh)
                    present()
                }
            }
        }

        // ---- input ---------------------------------------------------------

        const paintAllowed = (type: string, down: boolean) => {
            const cfg = cfgRef.current
            if (motionMode === "bloom") return false
            if (type === "pen") return down // stylus paints only in contact
            if (type === "touch")
                return cfg.input.touchBehavior === "draw" && down
            return true // mouse paints on hover
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!active) return
            const r = rect || readRect()
            const x = e.clientX - r.left
            const y = e.clientY - r.top
            const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height

            // Reconcile a mouse-up we never saw (alt-tab, context menu).
            if (pointer.type === "mouse" && pointer.down && e.buttons === 0) {
                pointer.down = false
                pointer.pressure = 0
            }

            pointer.type = e.pointerType || "mouse"
            pointer.has = true
            pointer.x = x
            pointer.y = y

            // A touch that travels is a scroll, not a tap — drop the bloom.
            if (
                pointer.type === "touch" &&
                blooms.length &&
                Math.hypot(
                    e.clientX - pointer.touchStartX,
                    e.clientY - pointer.touchStartY
                ) > 14
            ) {
                blooms.length = 0
            }

            if (!inside) {
                // Leaving the bounds ends the stroke; existing marks keep cooling.
                pointer.inside = false
                pointer.hasPrev = false
                pointer.hasCtrl = false
                dwell.t = 0
                dwell.accum = 0
                return
            }
            if (!pointer.inside) {
                // Re-entering starts a fresh stroke rather than bridging.
                pointer.hasPrev = false
                pointer.hasCtrl = false
            }
            pointer.inside = true

            if (!paintAllowed(pointer.type, pointer.down)) return

            if (pointer.type === "pen") {
                pointer.pressure = e.pressure > 0 ? e.pressure : 0.5
            } else if (pointer.down) {
                pointer.pressure = clamp(
                    (e.timeStamp - pointer.downT) / HOLD_RAMP_MS,
                    0,
                    1
                )
            } else {
                pointer.pressure = 0
            }

            // Coalesced events give the full input trace between frames, which
            // is what keeps a fast sweep continuous.
            const list =
                typeof e.getCoalescedEvents === "function"
                    ? e.getCoalescedEvents()
                    : null
            if (list && list.length > 1) {
                for (let i = 0; i < list.length; i++) {
                    const c = list[i]
                    sample(
                        c.clientX - r.left,
                        c.clientY - r.top,
                        c.timeStamp || e.timeStamp,
                        pointer.pressure
                    )
                }
            } else {
                sample(x, y, e.timeStamp, pointer.pressure)
            }
            lastActivity = performance.now()
            pointer.lastMoveT = lastActivity
            start()
        }

        const onPointerDown = (e: PointerEvent) => {
            if (!active) return
            const r = rect || readRect()
            const x = e.clientX - r.left
            const y = e.clientY - r.top
            if (x < 0 || y < 0 || x > r.width || y > r.height) return
            const cfg = cfgRef.current
            pointer.type = e.pointerType || "mouse"
            pointer.has = true
            pointer.inside = true
            pointer.x = x
            pointer.y = y
            pointer.down = true
            pointer.downT = e.timeStamp
            pointer.hasPrev = false
            pointer.hasCtrl = false
            dwell.t = 0
            dwell.accum = 0

            if (pointer.type === "touch") {
                pointer.touchStartX = e.clientX
                pointer.touchStartY = e.clientY
                if (cfg.input.touchBehavior === "off") return
                if (
                    cfg.input.touchBehavior === "draw" &&
                    motionMode === "full"
                ) {
                    pointer.touchDraw = true
                    pointer.pressure = e.pressure > 0 ? e.pressure : 0.6
                    sample(x, y, e.timeStamp, pointer.pressure)
                } else {
                    // Tap Bloom: one soft swell, and the page still scrolls.
                    blooms.push({ x, y, t: 0, life: 520 })
                }
                lastActivity = performance.now()
                pointer.lastMoveT = lastActivity
                start()
                return
            }

            if (pointer.type === "pen") {
                pointer.pressure = e.pressure > 0 ? e.pressure : 0.5
                sample(x, y, e.timeStamp, pointer.pressure)
            } else {
                pointer.pressure = 0
                if (motionMode === "bloom")
                    blooms.push({ x, y, t: 0, life: 520 })
            }
            lastActivity = performance.now()
            pointer.lastMoveT = lastActivity
            start()
        }

        const endPointer = () => {
            pointer.down = false
            pointer.pressure = 0
            pointer.touchDraw = false
            dwell.t = 0
            dwell.accum = 0
        }
        const onPointerUp = () => endPointer()
        const onPointerCancel = () => {
            endPointer()
            pointer.hasPrev = false
            pointer.hasCtrl = false
        }
        const onBlur = () => {
            endPointer()
            pointer.has = false
            pointer.inside = false
            pointer.hasPrev = false
            pointer.hasCtrl = false
        }
        const onPointerOut = (e: PointerEvent) => {
            // relatedTarget null means the pointer left the window entirely.
            if (e.relatedTarget === null) onBlur()
        }

        // Draw mode suppresses page scrolling only for gestures that begin
        // inside this component — the overlay itself stays click-through.
        const onTouchMove = (e: TouchEvent) => {
            if (!pointer.touchDraw) return
            if (cfgRef.current.input.touchBehavior !== "draw") return
            if (e.cancelable) e.preventDefault()
        }
        const onTouchEnd = () => {
            pointer.touchDraw = false
        }

        const onVisibility = () => {
            if (document.hidden) stop()
            else {
                lastTime = 0
                lastActivity = performance.now()
                start()
            }
        }

        // ---- static / reduced-motion preview --------------------------------

        /**
         * The Framer editor and the export thumbnail get one still frame drawn
         * through the same pipeline: deposit a chunk of a figure-eight, cool
         * it, repeat — so the tail reads exactly as it does at runtime. Never
         * shown to a live visitor; a reduced-motion visitor who asked for no
         * ink gets an empty overlay.
         */
        const renderStill = () => {
            if (!hctx || !heatBuf || fw === 0) return
            const cfg = cfgRef.current
            hctx.clearRect(0, 0, fw, fh)
            const cx = cssW * 0.5
            const cy = cssH * 0.5
            const ax = Math.min(cssW * 0.34, 320)
            const ay = Math.min(cssH * 0.2, 150)
            const CHUNKS = 26
            const PER = 14
            const px = (t: number) => cx + ax * Math.sin(Math.PI * 2 * t)
            const py = (t: number) => cy + ay * Math.sin(Math.PI * 4 * t + 0.6)
            let prevX = px(0)
            let prevY = py(0)
            for (let c = 0; c < CHUNKS; c++) {
                for (let i = 1; i <= PER; i++) {
                    const t = (c + i / PER) / CHUNKS
                    const x = px(t)
                    const y = py(t)
                    const seg = Math.hypot(x - prevX, y - prevY)
                    // Treat arc length per step as a stand-in for speed.
                    const b = brushFor(seg / 9, 0)
                    const steps = Math.max(
                        1,
                        Math.ceil(seg / Math.max(0.8, b.r * SPACING))
                    )
                    for (let k = 1; k <= steps; k++) {
                        const u = k / steps
                        stamp(
                            prevX + (x - prevX) * u,
                            prevY + (y - prevY) * u,
                            b.r,
                            b.a,
                            0
                        )
                    }
                    prevX = x
                    prevY = y
                }
                const dtEq = cfg.heat.fadeMs * 0.05
                coolInto(
                    Math.exp(-dtEq / Math.max(200, cfg.heat.fadeMs)),
                    cfg.heat.diffusion * 1.6
                )
            }
            present()
        }

        // ---- wiring ---------------------------------------------------------

        const showStill = isStatic && cfgRef.current.advanced.canvasPreview

        const ro = new ResizeObserver(() => {
            invalidateRect()
            layout()
            if (showStill) renderStill()
        })
        ro.observe(root)
        layout()

        if (!active) {
            // Static renderer, export, or reduced motion with the trail off.
            if (showStill) renderStill()
            return () => {
                ro.disconnect()
                clearRequestRef.current = null
                releaseCanvas(heatBuf)
                releaseCanvas(scratchBuf)
                releaseCanvas(probe)
                heatBuf = scratchBuf = probe = null
            }
        }

        window.addEventListener("pointermove", onPointerMove, { passive: true })
        window.addEventListener("pointerdown", onPointerDown, { passive: true })
        window.addEventListener("pointerup", onPointerUp, { passive: true })
        window.addEventListener("pointercancel", onPointerCancel, {
            passive: true,
        })
        window.addEventListener("pointerout", onPointerOut, { passive: true })
        window.addEventListener("touchmove", onTouchMove, { passive: false })
        window.addEventListener("touchend", onTouchEnd, { passive: true })
        window.addEventListener("touchcancel", onTouchEnd, { passive: true })
        window.addEventListener("blur", onBlur)
        window.addEventListener("scroll", invalidateRect, {
            passive: true,
            capture: true,
        })
        window.addEventListener("resize", invalidateRect, { passive: true })
        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            stop()
            ro.disconnect()
            clearRequestRef.current = null
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("pointercancel", onPointerCancel)
            window.removeEventListener("pointerout", onPointerOut)
            window.removeEventListener("touchmove", onTouchMove)
            window.removeEventListener("touchend", onTouchEnd)
            window.removeEventListener("touchcancel", onTouchEnd)
            window.removeEventListener("blur", onBlur)
            window.removeEventListener("scroll", invalidateRect, true)
            window.removeEventListener("resize", invalidateRect)
            document.removeEventListener("visibilitychange", onVisibility)
            releaseCanvas(heatBuf)
            releaseCanvas(scratchBuf)
            releaseCanvas(probe)
            heatBuf = scratchBuf = probe = null
            hctx = sctx = pctx = null
        }
        // Only the things that require a full rebuild belong here; live
        // tunables (colour, fade, sizes) reach the loop through cfgRef, so
        // editing them never tears down listeners or wipes accumulated heat.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, motionMode, coarsePointer, advanced.quality, advanced.dprMax])

    // Clear/Reset — toggling the control either way wipes the surface. The
    // first run is skipped so it cannot erase the canvas preview on mount.
    const clearReadyRef = React.useRef(false)
    React.useEffect(() => {
        if (!clearReadyRef.current) {
            clearReadyRef.current = true
            return
        }
        clearRequestRef.current?.()
    }, [advanced.clear])

    return (
        <div
            ref={rootRef}
            aria-hidden="true"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                ...style,
                pointerEvents: "none",
                overflow: "hidden",
                mixBlendMode: ink.blendMode,
            }}
        >
            <canvas
                ref={viewRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

HeatInkCursorTrail.defaultProps = {
    ink: DEFAULT_INK,
    brush: DEFAULT_BRUSH,
    heat: DEFAULT_HEAT,
    input: DEFAULT_INPUT,
    advanced: DEFAULT_ADVANCED,
}

// ---------------------------------------------------------------- controls

addPropertyControls(HeatInkCursorTrail, {
    ink: {
        type: ControlType.Object,
        title: "Ink",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Colour",
                defaultValue: DEFAULT_INK.color,
            },
            opacity: {
                type: ControlType.Number,
                title: "Max opacity",
                min: 0.02,
                max: 0.5,
                step: 0.01,
                defaultValue: DEFAULT_INK.opacity,
                description: "Density per stamp; marks darken by overlapping",
            },
            blendMode: {
                type: ControlType.Enum,
                title: "Blend",
                options: ["normal", "multiply", "screen"],
                optionTitles: ["Normal", "Multiply", "Screen"],
                defaultValue: DEFAULT_INK.blendMode,
                description: "Multiply for dark ink on light backgrounds",
            },
            haloEnabled: {
                type: ControlType.Boolean,
                title: "Halo",
                defaultValue: DEFAULT_INK.haloEnabled,
            },
            haloColor: {
                type: ControlType.Color,
                title: "Halo colour",
                defaultValue: DEFAULT_INK.haloColor,
                hidden: (p: InkProps) => !p.haloEnabled,
            },
            haloStrength: {
                type: ControlType.Number,
                title: "Halo strength",
                min: 0,
                max: 1,
                step: 0.02,
                defaultValue: DEFAULT_INK.haloStrength,
                description: "Warmth bleeding out around each mark",
                hidden: (p: InkProps) => !p.haloEnabled,
            },
            haloSpread: {
                type: ControlType.Number,
                title: "Halo spread",
                min: 1,
                max: 3,
                step: 0.1,
                defaultValue: DEFAULT_INK.haloSpread,
                description: "Halo width as a multiple of the brush",
                hidden: (p: InkProps) => !p.haloEnabled,
            },
        },
    },
    brush: {
        type: ControlType.Object,
        title: "Brush",
        controls: {
            minSize: {
                type: ControlType.Number,
                title: "Min radius",
                unit: "px",
                min: 2,
                max: 24,
                step: 1,
                defaultValue: DEFAULT_BRUSH.minSize,
                description: "Radius reached at full speed",
            },
            maxSize: {
                type: ControlType.Number,
                title: "Max radius",
                unit: "px",
                min: 8,
                max: 60,
                step: 1,
                defaultValue: DEFAULT_BRUSH.maxSize,
                description: "Radius when the pointer barely moves",
            },
            speedRange: {
                type: ControlType.Number,
                title: "Speed range",
                min: 0.4,
                max: 3,
                step: 0.05,
                defaultValue: DEFAULT_BRUSH.speedRange,
                description: "Speed in px per ms that thins the stroke fully",
            },
            irregularity: {
                type: ControlType.Number,
                title: "Irregularity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: DEFAULT_BRUSH.irregularity,
                description: "0 = smooth stamps, 1 = ragged fibrous edges",
            },
        },
    },
    heat: {
        type: ControlType.Object,
        title: "Heat",
        controls: {
            fadeMs: {
                type: ControlType.Number,
                title: "Fade",
                unit: "ms",
                min: 1000,
                max: 15000,
                step: 100,
                defaultValue: DEFAULT_HEAT.fadeMs,
                description: "Cooling time constant; dense marks outlast it",
            },
            diffusion: {
                type: ControlType.Number,
                title: "Diffusion",
                unit: "px",
                min: 0.4,
                max: 2.5,
                step: 0.05,
                defaultValue: DEFAULT_HEAT.diffusion,
                description: "How fast marks bleed outward and thin away",
            },
            holdStrength: {
                type: ControlType.Number,
                title: "Hold",
                min: 0,
                max: 1.5,
                step: 0.05,
                defaultValue: DEFAULT_HEAT.holdStrength,
                description: "Extra heat while dwelling or holding the button",
            },
        },
    },
    input: {
        type: ControlType.Object,
        title: "Input",
        controls: {
            touchBehavior: {
                type: ControlType.Enum,
                title: "Touch",
                options: ["bloom", "draw", "off"],
                optionTitles: ["Tap bloom", "Draw", "Disabled"],
                defaultValue: DEFAULT_INPUT.touchBehavior,
                description: "Draw suppresses page scrolling inside the frame",
            },
            reducedMotion: {
                type: ControlType.Enum,
                title: "Reduced motion",
                options: ["off", "bloom", "full"],
                optionTitles: ["No ink", "Single bloom", "Full trail"],
                defaultValue: DEFAULT_INPUT.reducedMotion,
                description: "What visitors who reduce motion get instead",
            },
        },
    },
    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        controls: {
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                options: ["low", "medium", "high"],
                optionTitles: ["Low", "Medium", "High"],
                defaultValue: DEFAULT_ADVANCED.quality,
                description:
                    "Resolution of the heat field; drop it for full pages",
            },
            dprMax: {
                type: ControlType.Number,
                title: "Max DPR",
                min: 1,
                max: 3,
                step: 0.5,
                defaultValue: DEFAULT_ADVANCED.dprMax,
                description: "Caps backing resolution on dense screens",
            },
            canvasPreview: {
                type: ControlType.Boolean,
                title: "Canvas preview",
                defaultValue: DEFAULT_ADVANCED.canvasPreview,
                description: "Draws a sample stroke in the Framer editor",
            },
            clear: {
                type: ControlType.Boolean,
                title: "Clear ink",
                defaultValue: DEFAULT_ADVANCED.clear,
                description: "Toggle either way to wipe the surface",
            },
        },
        description:
            "More components at [Kullen Jahnke](https://framer.link/uqyd85k)",
    },
})
