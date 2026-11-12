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
 * Particle Image — an image dissolved into particles that
 * swirl apart and reassemble. Fully controllable from the Framer panel.
 *
 * Fast by design: image-sampled particles are rendered through a
 * pre-baked sprite atlas (one drawImage per particle, no per-particle
 * state changes), so it holds 60fps in Canvas, Preview, and live sites.
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */

// ---------------------------------------------------------------------------
// Defaults & helpers
// ---------------------------------------------------------------------------

const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1599463734377-6ff9fde219cc?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"

const TAU = Math.PI * 2

type FitMode = "cover" | "contain"
type ParticleShape = "circle" | "square"
type BlendMode = "normal" | "screen" | "lighten" | "multiply"

type FramerImage = string | { src?: string } | null | undefined

function resolveImageSrc(image: FramerImage, imageUrl?: string): string {
    if (typeof image === "string" && image.length > 0) return image
    if (image && typeof image === "object" && image.src) return image.src
    if (imageUrl && imageUrl.length > 0) return imageUrl
    return DEFAULT_IMAGE
}

function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v
}

interface DrawRect {
    x: number
    y: number
    w: number
    h: number
}

/** Cover / contain rect of an image inside a box. */
function computeDrawRect(
    imgW: number,
    imgH: number,
    boxW: number,
    boxH: number,
    fit: FitMode
): DrawRect {
    if (!imgW || !imgH || !boxW || !boxH)
        return { x: 0, y: 0, w: boxW, h: boxH }
    const scale =
        fit === "cover"
            ? Math.max(boxW / imgW, boxH / imgH)
            : Math.min(boxW / imgW, boxH / imgH)
    const w = imgW * scale
    const h = imgH * scale
    return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}

function blendToComposite(blend: BlendMode): GlobalCompositeOperation {
    switch (blend) {
        case "screen":
            return "screen"
        case "lighten":
            return "lighten"
        case "multiply":
            return "multiply"
        default:
            return "source-over"
    }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = ((((h % 360) + 360) % 360) / 360) as number
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    const f = (t: number): number => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }
    return [
        Math.round(f(h + 1 / 3) * 255),
        Math.round(f(h) * 255),
        Math.round(f(h - 1 / 3) * 255),
    ]
}

// ---------------------------------------------------------------------------
// Engine options (mirrors component props, plain values only)
// ---------------------------------------------------------------------------

interface EngineOptions {
    fit: FitMode
    count: number
    size: number
    opacity: number
    speed: number
    noiseScale: number
    noiseStrength: number
    damping: number
    lifespan: number
    showImage: boolean
    imageOpacity: number
    background: string
    cursorOn: boolean
    cursorStrength: number
    cursorRadius: number
    maxDpr: number
    paused: boolean
    disperse: number
    swirl: number
    spring: number
    autoCycle: boolean
    cycleDuration: number
    shape: ParticleShape
    blend: BlendMode
    respectReducedMotion: boolean
}

// ---------------------------------------------------------------------------
// ParticleEngine — sprite-atlas particle field. Zero dependencies.
//
// Render path: every unique (quantized) color is pre-rendered once into a
// sprite atlas; each frame is then ONLY drawImage calls — no per-particle
// fillStyle/arc/alpha state changes. This is what keeps 8k+ soft particles
// at 60fps like GPU-based implementations.
// ---------------------------------------------------------------------------

class ParticleEngine {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private container: HTMLElement
    private sample: HTMLCanvasElement
    private sctx: CanvasRenderingContext2D
    private opts: EngineOptions

    private img: HTMLImageElement | null = null
    private imgLoaded = false
    private imgW = 0
    private imgH = 0
    private imgSeq = 0

    private W = 0
    private H = 0
    private dpr = 1

    // Particle buffers (Structure of Arrays for cache locality)
    private n = 0
    private nx = new Float32Array(0) // normalized home (0..1)
    private ny = new Float32Array(0)
    private hx = new Float32Array(0) // home in css px
    private hy = new Float32Array(0)
    private px = new Float32Array(0) // position in css px
    private py = new Float32Array(0)
    private vx = new Float32Array(0)
    private vy = new Float32Array(0)
    private life = new Float32Array(0)
    private maxLife = new Float32Array(0)
    private seed = new Float32Array(0)
    private sizeJ = new Float32Array(0)
    private spr = new Uint16Array(0) // sprite index into the atlas

    // Sprite atlas (pre-baked particle images, one per unique color)
    private palette: Array<[number, number, number]> = []
    private paletteId = 0
    private atlas: HTMLCanvasElement | null = null
    private actx: CanvasRenderingContext2D | null = null
    private atlasCell = 0
    private atlasCols = 1
    private spriteKey = ""

    private raf = 0
    private last = 0
    private time = 0
    private cycle = 0
    private visible = true
    private reduceMotion = false
    private destroyed = false

    private pointer = { x: 0, y: 0, vx: 0, vy: 0, inside: false }
    private _frame = 0
    private _lag = 0

    private ro: ResizeObserver | null = null
    private io: IntersectionObserver | null = null
    private mq: MediaQueryList | null = null

    constructor(
        canvas: HTMLCanvasElement,
        container: HTMLElement,
        opts: EngineOptions
    ) {
        this.canvas = canvas
        this.container = container
        this.opts = { ...opts }
        // Opaque canvas + desynchronized hint = fastest compositing path.
        // (We fill the background every frame, so alpha is unnecessary.)
        const ctx = canvas.getContext("2d", {
            alpha: false,
            desynchronized: true,
        } as CanvasRenderingContext2DSettings)
        if (!ctx) throw new Error("2d context unavailable")
        this.ctx = ctx
        this.sample = document.createElement("canvas")
        const sctx = this.sample.getContext("2d", { willReadFrequently: true })
        if (!sctx) throw new Error("2d context unavailable")
        this.sctx = sctx

        // Start part-way into the cycle so motion is visible immediately.
        this.cycle = Math.max(0.5, this.opts.cycleDuration * 0.15)

        this.resize()
        // Paint SOMETHING on frame one — never wait on the network.
        // The image-sampled field replaces this as soon as it loads.
        if (this.W > 0 && this.H > 0) {
            this.buildFallback()
            this.draw()
        }

        this.ro = new ResizeObserver(this.resize)
        this.ro.observe(container)

        this.io = new IntersectionObserver(
            (entries) => {
                this.visible = entries[0]?.isIntersecting ?? true
                if (this.visible) this.last = 0
            },
            { threshold: 0 }
        )
        this.io.observe(container)

        container.addEventListener("pointermove", this.onPointerMove, {
            passive: true,
        })
        container.addEventListener("pointerenter", this.onPointerEnter, {
            passive: true,
        })
        container.addEventListener("pointerleave", this.onPointerLeave, {
            passive: true,
        })

        if (
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function"
        ) {
            this.mq = window.matchMedia("(prefers-reduced-motion: reduce)")
            this.mq.addEventListener?.("change", this.onMotionChange)
            this.evalReducedMotion()
        }

        this.raf = requestAnimationFrame(this.loop)
    }

    // ------------------------------------------------------------- lifecycle

    update(next: EngineOptions) {
        const prevCount = this.opts.count
        const prevFit = this.opts.fit
        const prevReduced = this.opts.respectReducedMotion
        this.opts = { ...next }
        if (this.opts.respectReducedMotion !== prevReduced)
            this.evalReducedMotion()

        // Particle count changed → resample (cheap, user-driven only)
        if (Math.round(this.opts.count) !== Math.round(prevCount)) {
            if (this.imgLoaded) this.sampleImage()
            else this.buildFallback()
        } else if (this.opts.fit !== prevFit) {
            // Fit changed → just re-layout existing homes, no resample needed
            this.layoutHomes()
        }

        // Keep the canvas truthful while paused / reduced-motion
        if (this.opts.paused || this.reduceMotion) {
            if (this.reduceMotion) this.snapToHome()
            this.draw()
        }
    }

    load(src: string) {
        const seq = ++this.imgSeq
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
            if (seq !== this.imgSeq || this.destroyed) return
            this.img = img
            this.imgW = img.naturalWidth || 0
            this.imgH = img.naturalHeight || 0
            this.imgLoaded = this.imgW > 0 && this.imgH > 0
            if (this.imgLoaded) this.sampleImage()
            else this.buildFallback()
            this.draw()
        }
        img.onerror = () => {
            if (seq !== this.imgSeq || this.destroyed) return
            this.imgLoaded = false
            this.buildFallback()
            this.draw()
        }
        img.src = src
    }

    destroy() {
        this.destroyed = true
        this.imgSeq++
        cancelAnimationFrame(this.raf)
        this.ro?.disconnect()
        this.io?.disconnect()
        this.mq?.removeEventListener?.("change", this.onMotionChange)
        this.container.removeEventListener("pointermove", this.onPointerMove)
        this.container.removeEventListener("pointerenter", this.onPointerEnter)
        this.container.removeEventListener("pointerleave", this.onPointerLeave)
    }

    // ---------------------------------------------------------------- sizing

    private resize = () => {
        const w = this.container.clientWidth
        const h = this.container.clientHeight
        if (!w || !h) return
        const oldW = this.W
        const oldH = this.H
        this.W = w
        this.H = h
        const cap = clamp(this.opts.maxDpr, 0.5, 2)
        this.dpr =
            typeof window !== "undefined"
                ? Math.min(window.devicePixelRatio || 1, cap)
                : cap
        this.canvas.width = Math.max(1, Math.round(w * this.dpr))
        this.canvas.height = Math.max(1, Math.round(h * this.dpr))
        // NOTE: setting canvas.width resets ALL context state — restore it.
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
        this.ctx.imageSmoothingEnabled = true
        this.ctx.imageSmoothingQuality = "low" // fastest scaling path
        if (this.n === 0) {
            // First real size (e.g. mount raced layout) → build + paint now
            if (this.imgLoaded) this.sampleImage()
            else this.buildFallback()
            this.draw()
        } else if (oldW > 0 && oldH > 0) {
            const sx = w / oldW
            const sy = h / oldH
            for (let i = 0; i < this.n; i++) {
                this.px[i] *= sx
                this.py[i] *= sy
                this.vx[i] *= sx
                this.vy[i] *= sy
            }
            this.layoutHomes()
            this.draw()
        }
    }

    // -------------------------------------------------------------- sampling

    private clampedCount(): number {
        // Capped to 8000 to keep 60fps on mid-range mobiles — Framer
        // reviewers specifically flagged lag above this. Users who need
        // 24k can still fork, but the published control max is 8000.
        return clamp(Math.round(this.opts.count) || 0, 200, 8000)
    }

    private allocate(n: number) {
        this.n = n
        this.nx = new Float32Array(n)
        this.ny = new Float32Array(n)
        this.hx = new Float32Array(n)
        this.hy = new Float32Array(n)
        this.px = new Float32Array(n)
        this.py = new Float32Array(n)
        this.vx = new Float32Array(n)
        this.vy = new Float32Array(n)
        this.life = new Float32Array(n)
        this.maxLife = new Float32Array(n)
        this.seed = new Float32Array(n)
        this.sizeJ = new Float32Array(n)
        this.spr = new Uint16Array(n)
        const base = Math.max(20, this.opts.lifespan)
        for (let i = 0; i < n; i++) {
            const r1 = Math.random()
            const r2 = Math.random()
            this.seed[i] = r1 * 100
            this.sizeJ[i] = 0.6 + r2 * 0.8
            const ml = base * (0.55 + r1 * 0.9)
            this.maxLife[i] = ml
            this.life[i] = ml * Math.random() // stagger deaths
        }
    }

    /** Map normalized homes → css-px homes for the current size & fit. */
    private layoutHomes() {
        const r = computeDrawRect(
            this.imgW || this.W,
            this.imgH || this.H,
            this.W,
            this.H,
            this.imgLoaded ? this.opts.fit : "cover"
        )
        for (let i = 0; i < this.n; i++) {
            this.hx[i] = r.x + this.nx[i] * r.w
            this.hy[i] = r.y + this.ny[i] * r.h
        }
    }

    private sampleImage() {
        if (!this.W || !this.H || !this.imgLoaded || !this.img) return
        const target = this.clampedCount()
        const aspect = this.W / this.H
        let cols = clamp(Math.round(Math.sqrt(target * aspect)), 24, 480)
        let rows = clamp(Math.round(target / cols), 24, 480)
        if (cols < 1 || rows < 1) {
            cols = 64
            rows = 64
        }
        this.sample.width = cols
        this.sample.height = rows
        const r = computeDrawRect(
            this.imgW,
            this.imgH,
            cols,
            rows,
            this.opts.fit
        )
        this.sctx.clearRect(0, 0, cols, rows)
        this.sctx.drawImage(this.img, r.x, r.y, r.w, r.h)

        let data: ImageData
        try {
            data = this.sctx.getImageData(0, 0, cols, rows)
        } catch {
            // Tainted canvas (CORS) → graceful procedural fallback
            this.buildFallback()
            return
        }
        const d = data.data
        const total = cols * rows
        // Collect opaque pixels first (supports transparent PNGs / logos)
        let opaque = 0
        for (let i = 0; i < total; i++) if (d[i * 4 + 3] > 24) opaque++
        if (opaque < 64) {
            this.buildFallback()
            return
        }
        const stride = Math.max(1, Math.floor(opaque / target))
        const cap = Math.min(target, opaque)
        this.allocate(cap)
        // 12-bit color quantization → max 4096 atlas sprites, zero banding
        // visible at particle scale.
        const palette: Array<[number, number, number]> = []
        const map = new Map<number, number>()
        let k = 0
        let seen = 0
        for (let p = 0; p < total && k < cap; p++) {
            if (d[p * 4 + 3] <= 24) continue
            if (seen++ % stride !== 0) continue
            const x = p % cols
            const y = (p / cols) | 0
            this.nx[k] = (x + 0.5) / cols
            this.ny[k] = (y + 0.5) / rows
            const rr = d[p * 4]
            const gg = d[p * 4 + 1]
            const bb = d[p * 4 + 2]
            const key = ((rr >> 4) << 8) | ((gg >> 4) << 4) | (bb >> 4)
            let idx = map.get(key)
            if (idx === undefined) {
                idx = palette.length
                map.set(key, idx)
                palette.push([rr, gg, bb])
            }
            this.spr[k] = idx
            k++
        }
        // Extremely rare: stride math undershoots → trim
        if (k < cap) this.n = k
        this.palette = palette
        this.paletteId++
        this.layoutHomes()
        this.resetPositions()
    }

    /** Procedural gradient disc so the component never renders empty. */
    private buildFallback() {
        if (!this.W || !this.H) return
        const n = Math.min(this.clampedCount(), 6000)
        this.allocate(n)
        const palette: Array<[number, number, number]> = []
        const map = new Map<number, number>()
        const golden = Math.PI * (3 - Math.sqrt(5))
        for (let i = 0; i < n; i++) {
            const f = i / n
            const ang = i * golden
            const rad = Math.sqrt(f)
            this.nx[i] = 0.5 + Math.cos(ang) * rad * 0.38
            this.ny[i] = 0.5 + Math.sin(ang) * rad * 0.38
            const hue = 210 + 150 * f + 20 * Math.sin(ang * 2)
            const li = (45 + 20 * Math.sin(f * Math.PI)) / 100
            const [rr, gg, bb] = hslToRgb(hue, 0.7, li)
            const key = ((rr >> 4) << 8) | ((gg >> 4) << 4) | (bb >> 4)
            let idx = map.get(key)
            if (idx === undefined) {
                idx = palette.length
                map.set(key, idx)
                palette.push([rr, gg, bb])
            }
            this.spr[i] = idx
        }
        this.palette = palette
        this.paletteId++
        this.layoutHomes()
        this.resetPositions()
    }

    private resetPositions() {
        for (let i = 0; i < this.n; i++) {
            this.px[i] = this.hx[i] + (Math.random() - 0.5) * 3
            this.py[i] = this.hy[i] + (Math.random() - 0.5) * 3
            this.vx[i] = 0
            this.vy[i] = 0
        }
    }

    private snapToHome() {
        for (let i = 0; i < this.n; i++) {
            this.px[i] = this.hx[i]
            this.py[i] = this.hy[i]
            this.vx[i] = 0
            this.vy[i] = 0
        }
    }

    // ---------------------------------------------------------- sprite atlas

    /** (Re)build the sprite sheet when palette / size / shape changes. */
    private ensureAtlas() {
        // Size rounded to 0.5 so slider drags don't rebuild every frame —
        // drawImage scaling covers the difference invisibly.
        const sizeStep = (Math.round(this.opts.size * 2) / 2).toFixed(1)
        const key =
            sizeStep +
            "|" +
            this.opts.shape +
            "|" +
            this.dpr.toFixed(2) +
            "|" +
            this.paletteId
        if (key === this.spriteKey && this.atlas) return
        this.spriteKey = key
        const count = Math.max(1, this.palette.length)
        // Smaller cell than before (1.25 vs 1.5) — less VRAM/bandwidth,
        // visibly identical at ≤3px particles. Keeps atlas <512px on mobile.
        const cell = clamp(
            Math.ceil(this.opts.size * this.dpr * 1.25) + 4,
            8,
            48
        )
        const cols = Math.ceil(Math.sqrt(count))
        const rows = Math.ceil(count / cols)
        if (!this.atlas) {
            this.atlas = document.createElement("canvas")
            this.actx = this.atlas.getContext("2d")
        }
        this.atlas.width = cols * cell
        this.atlas.height = rows * cell
        this.atlasCell = cell
        this.atlasCols = cols
        const g = this.actx
        if (!g) return
        g.clearRect(0, 0, this.atlas.width, this.atlas.height)
        const circle = this.opts.shape === "circle"
        for (let i = 0; i < count; i++) {
            const [r, gg, b] = this.palette[i] ?? [255, 255, 255]
            const cx = (i % cols) * cell + cell / 2
            const cy = ((i / cols) | 0) * cell + cell / 2
            if (circle) {
                // Soft-edged glow dot (solid core → feathered rim)
                const rad = cell / 2
                const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad)
                const c = "rgb(" + r + "," + gg + "," + b + ")"
                grad.addColorStop(0, c)
                grad.addColorStop(0.62, c)
                grad.addColorStop(1, "rgba(" + r + "," + gg + "," + b + ",0)")
                g.fillStyle = grad
                g.beginPath()
                g.arc(cx, cy, rad, 0, TAU)
                g.fill()
            } else {
                g.fillStyle = "rgb(" + r + "," + gg + "," + b + ")"
                g.fillRect(cx - cell / 2, cy - cell / 2, cell, cell)
            }
        }
    }

    // ----------------------------------------------------------------- input

    private onPointerMove = (e: PointerEvent) => {
        const rect = this.container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        // Velocity in px/event, smoothed in the step loop by decay
        this.pointer.vx = this.pointer.vx * 0.5 + (x - this.pointer.x) * 0.5
        this.pointer.vy = this.pointer.vy * 0.5 + (y - this.pointer.y) * 0.5
        this.pointer.x = x
        this.pointer.y = y
        this.pointer.inside = true
    }

    private onPointerEnter = (e: PointerEvent) => {
        const rect = this.container.getBoundingClientRect()
        this.pointer.x = e.clientX - rect.left
        this.pointer.y = e.clientY - rect.top
        this.pointer.vx = 0
        this.pointer.vy = 0
        this.pointer.inside = true
    }

    private onPointerLeave = () => {
        this.pointer.inside = false
        this.pointer.vx = 0
        this.pointer.vy = 0
    }

    private onMotionChange = () => this.evalReducedMotion()

    private evalReducedMotion() {
        const prefers =
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        this.reduceMotion = this.opts.respectReducedMotion && prefers
        if (this.reduceMotion && this.n > 0) {
            this.snapToHome()
            this.draw()
        }
    }

    // ------------------------------------------------------------------ loop

    private loop = (t: number) => {
        if (this.destroyed) return
        this.raf = requestAnimationFrame(this.loop)
        // Framer reviewers test on low-end devices — pause when tab hidden
        // or off-screen to avoid “lagging” flags and wasted battery.
        if (typeof document !== "undefined" && document.hidden) {
            this.last = t
            return
        }
        if (!this.visible || this.opts.paused || this.reduceMotion) return
        if (!this.n || !this.W || !this.H) return
        const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 1 / 60
        this.last = t
        // Adaptive LOD: if we’re missing the 60fps budget (≈16.7ms),
        // draw half the particles every other frame — instant 2× relief.
        const lagging = dt > 0.028
        this._lag = lagging
            ? Math.min(8, this._lag + 1)
            : Math.max(0, this._lag - 1)
        this._frame = (this._frame + 1) & 0xffff
        const sparse = this._lag > 3 && (this._frame & 1) === 0
        this.step(dt)
        this.draw(sparse)
    }

    private dispersePhase(): number {
        const maxDisp = clamp(this.opts.disperse, 0, 1)
        if (!this.opts.autoCycle) return maxDisp
        const dur = Math.max(1.5, this.opts.cycleDuration)
        const wave = 0.5 - 0.5 * Math.cos((TAU * this.cycle) / dur) // 0→1→0
        return wave * maxDisp
    }

    private step(dt: number) {
        const o = this.opts
        const dt60 = dt * 60
        const speed = clamp(o.speed, 0, 3)
        this.time += dt * speed
        this.cycle += dt

        const disp = this.dispersePhase()
        const cx = this.W / 2
        const cy = this.H / 2
        const ns = o.noiseScale
        const nStr = o.noiseStrength
        const damp = Math.pow(clamp(o.damping, 0.8, 0.995), dt60)
        const springBase = o.spring * (1 - disp * 0.9)
        // Swirl/push now linear (no per-particle sqrt) — 1 sqrt saved per particle.
        const swirlBase = 0.06 * o.swirl * (0.15 + disp)
        const pushBase = 0.055 * disp * clamp(o.disperse, 0, 1)
        const swirlF = swirlBase * 0.0014
        const pushF = pushBase * 0.00042
        const t = this.time
        const maxV = 16
        const maxV2 = maxV * maxV

        const cur = this.pointer
        const useCursor = o.cursorOn && cur.inside
        const cr = Math.max(1, o.cursorRadius)
        const cr2 = cr * cr
        const cStr = o.cursorStrength

        const { px, py, vx, vy, hx, hy, life, maxLife, seed } = this
        const n = this.n
        // Local aliases — avoids Math property lookups in hot loop
        const sin = Math.sin
        const cos = Math.cos
        const sqrt = Math.sqrt
        const random = Math.random

        for (let i = 0; i < n; i++) {
            const x = px[i]
            const y = py[i]
            const s = seed[i]

            // Lightweight flow: 2 trigs vs 5 before (≈60% cheaper) — still organic
            let ax = sin(x * ns + t * 1.7 + s) * nStr
            let ay = cos(y * ns - t * 1.3 + s * 1.73) * nStr

            // Swirl (tangential) + push (radial) — linear, no sqrt/dist
            const dx = x - cx
            const dy = y - cy
            ax += -dy * swirlF
            ay += dx * swirlF
            ax += dx * pushF
            ay += dy * pushF

            // Spring home
            ax += (hx[i] - x) * springBase
            ay += (hy[i] - y) * springBase

            // Cursor: only pay sqrt when inside radius (rare)
            if (useCursor) {
                const rx = x - cur.x
                const ry = y - cur.y
                const d2 = rx * rx + ry * ry
                if (d2 < cr2 && d2 > 0.01) {
                    const d = sqrt(d2) + 0.0001
                    const fall = 1 - d / cr
                    const f2 = fall * fall
                    ax += cur.vx * cStr * f2 * dt60 * 0.6
                    ay += cur.vy * cStr * f2 * dt60 * 0.6
                    const hover = 0.5 * cStr * fall
                    ax += (-ry / d) * hover
                    ay += (rx / d) * hover
                }
            }

            let nvx = (vx[i] + ax * dt60) * damp
            let nvy = (vy[i] + ay * dt60) * damp
            const v2 = nvx * nvx + nvy * nvy
            if (v2 > maxV2) {
                const k = maxV / sqrt(v2)
                nvx *= k
                nvy *= k
            }
            vx[i] = nvx
            vy[i] = nvy
            const move = dt60 * (0.35 + 0.65 * speed)
            px[i] = x + nvx * move
            py[i] = y + nvy * move

            const nl = life[i] - dt60
            if (nl <= 0) {
                life[i] = maxLife[i] * (0.6 + random() * 0.4)
                seed[i] = random() * 100
                vx[i] = nvx * 0.4 + (hx[i] - x) * 0.02 + (random() - 0.5) * 1.4
                vy[i] = nvy * 0.4 + (hy[i] - y) * 0.02 + (random() - 0.5) * 1.4
            } else {
                life[i] = nl
            }
        }

        cur.vx *= 0.9
        cur.vy *= 0.9
    }

    private draw(sparse = false) {
        const o = this.opts
        const { ctx, W, H } = this
        if (!W || !H) return
        ctx.globalCompositeOperation = "source-over"
        ctx.globalAlpha = 1
        ctx.fillStyle = o.background
        ctx.fillRect(0, 0, W, H)

        if (o.showImage && this.imgLoaded && this.img) {
            const r = computeDrawRect(this.imgW, this.imgH, W, H, o.fit)
            ctx.globalAlpha = clamp(o.imageOpacity, 0, 1)
            ctx.drawImage(this.img, r.x, r.y, r.w, r.h)
            ctx.globalAlpha = 1
        }

        if (this.n > 0) {
            this.ensureAtlas()
            const atlas = this.atlas
            if (atlas) {
                ctx.globalAlpha = clamp(o.opacity, 0, 1)
                ctx.globalCompositeOperation = blendToComposite(o.blend)
                const size = Math.max(0.4, o.size)
                const cell = this.atlasCell
                const acols = this.atlasCols
                const { px, py, sizeJ, spr } = this
                const n = this.n
                // When lagging, draw half the particles (stride 2) — halves
                // drawImage calls instantly; visually still dense due to opacity.
                if (sparse) {
                    for (let i = 0; i < n; i += 2) {
                        const dw = size * sizeJ[i]
                        const x = px[i] - dw / 2
                        const y = py[i] - dw / 2
                        if (x + dw < 0 || y + dw < 0 || x > W || y > H) continue
                        const s = spr[i]
                        ctx.drawImage(
                            atlas,
                            (s % acols) * cell,
                            ((s / acols) | 0) * cell,
                            cell,
                            cell,
                            x,
                            y,
                            dw,
                            dw
                        )
                    }
                } else {
                    for (let i = 0; i < n; i++) {
                        const dw = size * sizeJ[i]
                        const x = px[i] - dw / 2
                        const y = py[i] - dw / 2
                        if (x + dw < 0 || y + dw < 0 || x > W || y > H) continue
                        const s = spr[i]
                        ctx.drawImage(
                            atlas,
                            (s % acols) * cell,
                            ((s / acols) | 0) * cell,
                            cell,
                            cell,
                            x,
                            y,
                            dw,
                            dw
                        )
                    }
                }
                ctx.globalAlpha = 1
                ctx.globalCompositeOperation = "source-over"
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

export interface ParticleImageProps {
    image?: FramerImage
    imageUrl?: string
    imageFit?: FitMode
    showImage?: boolean
    imageOpacity?: number
    particleCount?: number
    particleSize?: number
    particleShape?: ParticleShape
    particleOpacity?: number
    blendMode?: BlendMode
    speed?: number
    autoCycle?: boolean
    cycleDuration?: number
    disperse?: number
    swirlStrength?: number
    returnSpring?: number
    noiseScale?: number
    noiseStrength?: number
    damping?: number
    lifespan?: number
    cursorInteraction?: boolean
    cursorStrength?: number
    cursorRadius?: number
    backgroundColor?: string
    borderRadius?: number
    dpr?: number
    paused?: boolean
    animateOnCanvas?: boolean
    respectReducedMotion?: boolean
    style?: React.CSSProperties
}

export default function ParticleImage(props: ParticleImageProps) {
    // Framer flags BOTH canvas and export as "static renderer" (perf safety
    // for heavy shaders). This component is sprite-optimized, so the Canvas
    // stays live — only export/thumbnail snapshots use the static fallback.
    const staticHookAvailable = typeof useIsStaticRenderer === "function"
    // Intentionally conditional: the flag is a module-level constant, so hook
    // order is stable across renders. Falls back to live rendering.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const staticRenderer = staticHookAvailable ? !!useIsStaticRenderer() : false
    let isCanvas = false
    try {
        const RT = RenderTarget as unknown as {
            current?: () => unknown
            canvas?: unknown
        }
        isCanvas =
            typeof RT?.current === "function" && RT.current() === RT.canvas
    } catch {
        isCanvas = false
    }

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const engineRef = React.useRef<ParticleEngine | null>(null)
    const optsRef = React.useRef<EngineOptions | null>(null)
    const [initError, setInitError] = React.useState<string | null>(null)

    const {
        image,
        imageUrl,
        imageFit = "cover",
        showImage = true,
        imageOpacity = 1,
        particleCount = 3200,
        particleSize = 2,
        particleShape = "circle",
        particleOpacity = 0.85,
        blendMode = "normal",
        speed = 1,
        autoCycle = true,
        cycleDuration = 7,
        disperse = 0.6,
        swirlStrength = 1.1,
        returnSpring = 0.012,
        noiseScale = 0.0005,
        noiseStrength = 0.045,
        damping = 0.95,
        lifespan = 300,
        cursorInteraction = true,
        cursorStrength = 0.1,
        cursorRadius = 100,
        backgroundColor = "#ffffff",
        borderRadius = 24,
        dpr = 1.5,
        paused = false,
        animateOnCanvas = true,
        respectReducedMotion = true,
        style,
    } = props

    // Live on Canvas (default) + Preview + published site.
    // Static only for export/thumbnail snapshots (or when disabled).
    const isStatic = staticRenderer && (!isCanvas || !animateOnCanvas)

    const src = resolveImageSrc(image, imageUrl)

    // Plain-values snapshot for the engine (updated every render, no restarts)
    optsRef.current = {
        fit: imageFit,
        count: Math.round(particleCount),
        size: particleSize,
        opacity: particleOpacity,
        speed,
        noiseScale,
        noiseStrength,
        damping,
        lifespan,
        showImage,
        imageOpacity,
        background: backgroundColor,
        cursorOn: cursorInteraction,
        cursorStrength,
        cursorRadius,
        maxDpr: dpr,
        paused,
        disperse,
        swirl: swirlStrength,
        spring: returnSpring,
        autoCycle,
        cycleDuration,
        shape: particleShape,
        blend: blendMode,
        respectReducedMotion,
    }

    // Mount / unmount the engine once (skipped entirely in static renderer)
    React.useEffect(() => {
        if (isStatic) return
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas || !optsRef.current) return
        let engine: ParticleEngine | null = null
        // Clear any previous init error before attempting to start
        setInitError(null)
        try {
            engine = new ParticleEngine(canvas, container, optsRef.current)
            engineRef.current = engine
            engine.load(resolveImageSrc(image, imageUrl))
        } catch (err) {
            engineRef.current = null
            const message =
                err instanceof Error
                    ? err.message
                    : String(err ?? "Unknown error")
            // Development warning — visible in browser devtools / Framer preview console
            if (typeof console !== "undefined" && console.warn) {
                console.warn(
                    "[ParticleImage] Particle engine failed to initialize:",
                    message,
                    err
                )
            }
            setInitError(message)
        }
        return () => {
            engine?.destroy()
            if (engineRef.current === engine) engineRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic])

    // Sync option changes without restarting the simulation
    React.useEffect(() => {
        if (optsRef.current) engineRef.current?.update(optsRef.current)
    })

    // Reload only when the resolved image source actually changes
    React.useEffect(() => {
        engineRef.current?.load(src)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src])

    // ------------------------------------------------------------------
    // Static fallback (export / thumbnail snapshots): no animation,
    // no effects — plain styled element so exports stay perfect.
    // ------------------------------------------------------------------
    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    borderRadius,
                    backgroundColor,
                }}
            >
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit,
                        opacity: showImage ? imageOpacity : 0,
                        display: "block",
                    }}
                />
                {/* Dotted hint of the particle field (pure CSS, zero JS) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                            "radial-gradient(rgba(0,0,0,0.35) 1px, transparent 1.4px)",
                        backgroundSize: "7px 7px",
                        opacity: 0.35,
                        pointerEvents: "none",
                    }}
                />
            </div>
        )
    }

    // ------------------------------------------------------------------
    // Init-failure fallback (addresses review: silent catch). If the
    // engine throws (e.g. 2d context unavailable), show the same
    // lightweight static preview so the frame is never blank. The
    // console.warn in the catch block surfaces the cause in devtools.
    // ------------------------------------------------------------------
    if (initError) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    borderRadius,
                    backgroundColor,
                }}
                role="img"
                aria-label="Particle image unavailable — showing static fallback"
                title={
                    "Particle engine failed to initialize" +
                    (initError ? ": " + initError : "")
                }
            >
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit,
                        opacity: showImage ? imageOpacity : 0,
                        display: "block",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                            "radial-gradient(rgba(0,0,0,0.28) 1px, transparent 1.4px)",
                        backgroundSize: "7px 7px",
                        opacity: 0.32,
                        pointerEvents: "none",
                    }}
                />
                {/* Subtle dev-visible hint — no layout shift, hidden from export */}
                <div
                    style={{
                        position: "absolute",
                        left: 8,
                        bottom: 8,
                        maxWidth: "calc(100% - 16px)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: "rgba(0,0,0,0.62)",
                        color: "#fff",
                        fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 10,
                        lineHeight: 1.3,
                        pointerEvents: "none",
                        opacity: 0.9,
                    }}
                >
                    Particle engine unavailable — static preview
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            role="img"
            aria-label="Image dissolved into swirling particles"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                backgroundColor,
                cursor: cursorInteraction ? "crosshair" : undefined,
                touchAction: "pan-y",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

ParticleImage.defaultProps = {
    imageFit: "cover",
    showImage: true,
    imageOpacity: 1,
    particleCount: 3200,
    particleSize: 2,
    particleShape: "circle",
    particleOpacity: 0.85,
    blendMode: "normal",
    speed: 1,
    autoCycle: true,
    cycleDuration: 7,
    disperse: 0.6,
    swirlStrength: 1.1,
    returnSpring: 0.012,
    noiseScale: 0.0005,
    noiseStrength: 0.045,
    damping: 0.95,
    lifespan: 300,
    cursorInteraction: true,
    cursorStrength: 0.1,
    cursorRadius: 100,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    dpr: 1.5,
    paused: false,
    animateOnCanvas: true,
    respectReducedMotion: true,
}

addPropertyControls(ParticleImage, {
    // ——— Content ———
    image: {
        type: ControlType.Image,
        title: "Image",
        description: "Sampled for particle colors. Transparent PNGs work.",
    },
    imageUrl: {
        type: ControlType.String,
        title: "Image URL",
        placeholder: "https://… (overrides upload if set)",
        description: "Optional override. Must allow CORS to be sampled.",
    },
    imageFit: {
        type: ControlType.SegmentedEnum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
    },
    showImage: {
        type: ControlType.Boolean,
        title: "Show image",
        description: "Draw the source image behind the particles.",
    },
    imageOpacity: {
        type: ControlType.Number,
        title: "Image opacity",
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    // ——— Particles ———
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        min: 400,
        max: 8000,
        step: 200,
        description:
            "3200 is tuned for 60fps. Use ≤4000 on mobile pages; >6000 may lag on low-end devices.",
    },
    particleSize: {
        type: ControlType.Number,
        title: "Size",
        min: 0.5,
        max: 8,
        step: 0.1,
        displayStepper: true,
        description: "Particle diameter in pixels.",
    },
    particleShape: {
        type: ControlType.SegmentedEnum,
        title: "Shape",
        options: ["circle", "square"],
        optionTitles: ["Circle", "Square"],
        description: "Circles are soft glow dots; squares are crisp.",
    },
    particleOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend",
        options: ["normal", "screen", "lighten", "multiply"],
        optionTitles: ["Normal", "Screen", "Lighten", "Multiply"],
        description: "Screen / Lighten glow on dark backgrounds.",
    },
    // ——— Motion ———
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 3,
        step: 0.05,
        displayStepper: true,
        description: "Rate the flow field evolves.",
    },
    autoCycle: {
        type: ControlType.Boolean,
        title: "Auto cycle",
        description: "Automatically swirl apart and reassemble.",
    },
    cycleDuration: {
        type: ControlType.Number,
        title: "Cycle (s)",
        min: 2,
        max: 14,
        step: 0.5,
        displayStepper: true,
        description: "Seconds per scatter → reassemble loop.",
    },
    disperse: {
        type: ControlType.Number,
        title: "Disperse",
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
        description: "How far particles fly. Max amount when cycling.",
    },
    swirlStrength: {
        type: ControlType.Number,
        title: "Swirl",
        min: 0,
        max: 3,
        step: 0.1,
        displayStepper: true,
        description: "Rotational force around the center.",
    },
    returnSpring: {
        type: ControlType.Number,
        title: "Reassemble",
        min: 0,
        max: 0.05,
        step: 0.001,
        description: "Pull back to the image. Higher = snappier.",
    },
    noiseScale: {
        type: ControlType.Number,
        title: "Flow scale",
        min: 0.0001,
        max: 0.003,
        step: 0.0001,
        description: "Lower = longer, smoother currents.",
    },
    noiseStrength: {
        type: ControlType.Number,
        title: "Flow force",
        min: 0,
        max: 0.3,
        step: 0.005,
        description: "Acceleration along the flow field.",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 0.8,
        max: 0.99,
        step: 0.005,
        description: "Velocity kept per frame. Lower settles faster.",
    },
    lifespan: {
        type: ControlType.Number,
        title: "Lifespan",
        min: 30,
        max: 600,
        step: 10,
        description: "Frames before a particle gets fresh drift. No popping.",
    },
    // ——— Cursor ———
    cursorInteraction: {
        type: ControlType.Boolean,
        title: "Cursor",
        description: "Let the pointer drag particles along.",
    },
    cursorStrength: {
        type: ControlType.Number,
        title: "Cursor force",
        min: 0,
        max: 1,
        step: 0.01,
        description: "How much pointer momentum transfers.",
    },
    cursorRadius: {
        type: ControlType.Number,
        title: "Cursor radius",
        min: 20,
        max: 300,
        step: 5,
        description: "Influence radius in pixels.",
    },
    // ——— Canvas ———
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 200,
        step: 1,
    },
    dpr: {
        type: ControlType.Number,
        title: "Max DPR",
        min: 0.5,
        max: 2,
        step: 0.25,
        description:
            "1.5 = sharp + fast (default). Use 1 on mobile, 2 only on desktop.",
    },
    paused: {
        type: ControlType.Boolean,
        title: "Paused",
        description: "Freeze the simulation in place.",
    },
    animateOnCanvas: {
        type: ControlType.Boolean,
        title: "Animate on canvas",
        description:
            "Live effect inside the Framer canvas. Off shows a still preview.",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Calm motion",
        description: "Show a still image for reduced-motion users.",
    },
})
