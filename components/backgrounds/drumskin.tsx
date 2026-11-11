// Drumskin v1.0 (KOJA Studios, 9.11.2026). A quiet dot grid for the background of a hero or section that answers
// like a stretched skin: barely there at rest, the pointer opens the net and lights it up, a click or tap sends one
// clean wave through it that bounces off the edges.
// The server HTML, the editor, the static export and reduced motion show a still grid drawn in CSS. On the page one
// WebGL canvas per instance takes over in the same frame, once it has drawn a picture identical to that still grid.
// Own code from our feel probe (6.11.2026). Behaviour reference "Membrane" (motionin.design) looked at only, nothing
// taken over.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, ReactElement, ReactNode } from "react"

// ------------------------------------------------------------------ props

type Theme = "dark" | "light"

interface Props {
    content?: ReactNode
    look?: { theme?: Theme; calm?: boolean }
    colors?: { backdrop?: string; grid?: string; glow?: string }
    waves?: { strength?: number; speed?: number }
    pointer?: { opening?: number }
    motion?: { intro?: boolean; breathing?: boolean; scroll?: boolean }
    /** Set by Framer: the size and position of the instance. Passed to the root unchanged. */
    style?: CSSProperties
}

/** Everything the motion needs from the panel, as plain values. */
interface Opts {
    theme: Theme
    calm: boolean
    strength: number
    speed: number
    opening: number
    intro: boolean
    breathing: boolean
    scroll: boolean
    /** the three colors as given (raw CSS text); a change means they are read again */
    backdrop: string
    grid: string
    glow: string
    ownGlow: boolean
}

const THEMES = {
    dark: { backdrop: "#0B0B0D", grid: "rgb(168, 162, 154)", glow: "rgb(240, 235, 226)", hot: [255, 248, 236] as RGB },
    light: { backdrop: "#F2F0EB", grid: "rgb(92, 86, 80)", glow: "rgb(24, 22, 26)", hot: [8, 8, 10] as RGB },
}

// ------------------------------------------------------------------ the look (values of the approved feel probe)

const LOOK = {
    // dots: base size, growth under light, in a wave and on the rim of the opening
    dot: 0.72,
    dotLight: 0.3,
    dotGrow: 1.2,
    dotRim: 0.6,
    // opacity: rest, light, wave, rim of the opening (dots and lines)
    restDot: 0.1,
    lightDot: 0.42,
    waveDot: 0.7,
    rimDot: 0.4,
    restLine: 0.026,
    lightLine: 0.11,
    waveLine: 0.15,
    // pointer light: smallest radius in px, share of the wide halo
    lightR: 150,
    halo: 0.3,
    // breathing and scroll: slope as light, lift, shift
    light: 1.1,
    tilt: 0.9,
    shift: 0.8,
    // wave: shift from the slope of the velocity, soft cap in grid steps
    waveShift: 0.55,
    waveCap: 0.3,
    // strike: width of the mallet in px, duration in s
    strikeSigma: 30,
    strikeTime: 0.1,
    // wave speed at full Speed, damping, how much the calm zone quiets
    speed: 760,
    damp: 1.8,
    quiet: 0.55,
}
/** fixed physics step (120 Hz) */
const DT = 1 / 120
/** strike force at full Strength: mouse and pen, touch */
const J_MOUSE = 2100
const J_TOUCH = 2300
/** the intro strike lands behind the content, where the grid is quieter: twice as strong (at most full Strength) */
const INTRO = 2
/** at most this many WebGL contexts per page; more instances fall back to the still grid */
const MAX_CONTEXTS = 8
/** largest drawing buffer: a side and the area in device pixels */
const MAX_SIDE = 8192
const MAX_AREA = 16777216
const GL_ATTRS: WebGLContextAttributes = { antialias: true, premultipliedAlpha: true, alpha: true, failIfMajorPerformanceCaveat: true }
/** a click or tap on these inside the content does what it does and sends no wave */
const NO_STRIKE = "a, button, input, select, textarea, label, [role=button], [data-no-strike]"
const NAME = "Drumskin"

// ------------------------------------------------------------------ small helpers

type RGB = [number, number, number]
type RGBA = [number, number, number, number]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)
const smooth = (a: number, b: number, x: number) => {
    if (b <= a) return x >= b ? 1 : 0
    const t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect
/** grid step by width: one boundary for the canvas and the CSS still grid */
const spacingFor = (w: number) => (w >= 3841 ? 32 : w >= 2561 ? 26 : 20)
/** smaller surfaces get a softer strike and a shorter ring */
const sizeFactor = (w: number, h: number) => clamp(Math.sqrt(w * h) / 1100, 0.55, 1)
/** radius of the pointer light, never smaller than the opening */
const lightRadius = (w: number, h: number, opening: number) => Math.max(LOOK.lightR * (0.75 + 0.25 * sizeFactor(w, h)), 1.4 * opening)

/** First element of a slot value: Framer passes an array (empty when nothing is connected). It fills the surface. */
function slotNode(v: unknown): ReactNode | null {
    const first = Array.isArray(v) ? v[0] : v
    if (!isValidElement(first)) return null
    const el = first as ReactElement<{ style?: CSSProperties }>
    return cloneElement(el, { style: { ...(el.props.style || {}), width: "100%", height: "100%", position: "relative" } })
}

// ------------------------------------------------------------------ colors

const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminance = (c: RGBA | RGB) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
const contrastOf = (a: RGBA, b: RGBA) => {
    const la = luminance(a), lb = luminance(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
function parseRgb(s: string): RGBA | null {
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/i.exec(s.trim())
    if (!m) return null
    const a = m[4] === undefined ? 1 : Number(m[4]) / (m[5] ? 100 : 1)
    const out: RGBA = [Number(m[1]), Number(m[2]), Number(m[3]), clamp(a, 0, 1)]
    return out.every((x) => Number.isFinite(x)) ? out : null
}
/** One 1 x 1 drawing for colors the browser keeps in another space (oklch, display-p3): it hands back sRGB. */
let pad: CanvasRenderingContext2D | null | undefined
function viaPad(doc: Document, s: string): RGBA | null {
    try {
        if (pad === undefined) {
            const c = doc.createElement("canvas")
            c.width = 1
            c.height = 1
            pad = c.getContext("2d", { willReadFrequently: true })
        }
        if (!pad) return null
        pad.clearRect(0, 0, 1, 1)
        pad.fillStyle = "rgba(0, 0, 0, 0)"
        pad.fillStyle = s
        pad.fillRect(0, 0, 1, 1)
        const d = pad.getImageData(0, 0, 1, 1).data
        return [d[0], d[1], d[2], d[3] / 255]
    } catch {
        // a browser that refuses the drawing (blocked canvas, security error): the color counts as unreadable and
        // the theme color is used instead, as for an invalid color
        pad = null
        return null
    }
}
/** the probe wrapper carries this color: a child that still shows it holds a color the browser could not resolve */
const SENTINEL = "rgb(1, 2, 3)"
function readColor(el: Element | null | undefined): RGBA | null {
    if (!el) return null
    const v = getComputedStyle(el).color
    if (!v || v === SENTINEL) return null
    return parseRgb(v) || viaPad(el.ownerDocument, v)
}

interface Palette {
    rest: RGB
    lit: RGB
    hot: RGB
    aRest: number
    aLit: number
    /** dark ground: lines add up, slopes light up instead of shading */
    dark: boolean
    additive: boolean
    /** grid and backdrop too close to see the grid (opaque backdrop only) */
    faint: boolean
}
function paletteOf(probe: HTMLElement | null, o: Opts): Palette {
    const th = THEMES[o.theme]
    const kids = probe ? probe.children : null
    const bd = readColor(kids?.[0]) || parseRgb("rgb(" + (o.theme === "dark" ? "11, 11, 13" : "242, 240, 235") + ")")!
    const gr = readColor(kids?.[1]) || parseRgb(th.grid)!
    const gl = readColor(kids?.[2]) || parseRgb(th.glow)!
    const opaque = bd[3] >= 0.999
    const dark = opaque ? luminance(bd) < 0.2 : o.theme === "dark"
    let hot: RGB = th.hot
    if (o.ownGlow) hot = dark ? [gl[0] + (255 - gl[0]) * 0.6, gl[1] + (255 - gl[1]) * 0.6, gl[2] + (255 - gl[2]) * 0.6] : [gl[0] * 0.36, gl[1] * 0.36, gl[2] * 0.36]
    return {
        rest: [gr[0], gr[1], gr[2]],
        lit: [gl[0], gl[1], gl[2]],
        hot,
        aRest: gr[3],
        aLit: gl[3],
        dark,
        additive: dark && opaque,
        faint: opaque && contrastOf(gr, bd) < 1.5,
    }
}

// ------------------------------------------------------------------ WebGL

const VS_DOT = `attribute vec2 aPos; attribute float aSize; attribute vec4 aCol;
uniform vec2 uRes; uniform float uDpr;
varying vec4 vCol;
void main() {
  vec2 c = aPos / uRes * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
  gl_PointSize = (aSize * 2.0 + 1.5) * uDpr;
  vCol = aCol;
}`
const FS_DOT = `precision mediump float;
varying vec4 vCol;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float a = vCol.a * (1.0 - smoothstep(0.62, 1.0, length(p)));
  gl_FragColor = vec4(vCol.rgb * a, a);
}`
const VS_LINE = `attribute vec2 aPos; attribute vec4 aCol; uniform vec2 uRes; varying vec4 vCol;
void main() { vec2 c = aPos / uRes * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); vCol = aCol; }`
const FS_LINE = `precision mediump float; varying vec4 vCol;
void main() { gl_FragColor = vec4(vCol.rgb * vCol.a, vCol.a); }`

interface Programs {
    dot: WebGLProgram
    line: WebGLProgram
    bufDot: WebGLBuffer
    bufLine: WebGLBuffer
    dPos: number
    dSize: number
    dCol: number
    dRes: WebGLUniformLocation | null
    dDpr: WebGLUniformLocation | null
    lPos: number
    lCol: number
    lRes: WebGLUniformLocation | null
}
/** Both programs and buffers, or null when a shader does not compile or link (expected on some drivers). */
function buildPrograms(gl: WebGLRenderingContext): Programs | null {
    const made: WebGLShader[] = []
    const compile = (vs: string, fs: string): WebGLProgram | null => {
        const p = gl.createProgram()
        if (!p) return null
        for (const [type, src] of [
            [gl.VERTEX_SHADER, vs],
            [gl.FRAGMENT_SHADER, fs],
        ] as const) {
            const s = gl.createShader(type)
            if (!s) return null
            made.push(s)
            gl.shaderSource(s, src)
            gl.compileShader(s)
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null
            gl.attachShader(p, s)
        }
        gl.linkProgram(p)
        return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null
    }
    const dot = compile(VS_DOT, FS_DOT)
    const line = dot ? compile(VS_LINE, FS_LINE) : null
    for (const s of made) gl.deleteShader(s)
    const bufDot = gl.createBuffer()
    const bufLine = gl.createBuffer()
    if (!dot || !line || !bufDot || !bufLine) return null
    return {
        dot,
        line,
        bufDot,
        bufLine,
        dPos: gl.getAttribLocation(dot, "aPos"),
        dSize: gl.getAttribLocation(dot, "aSize"),
        dCol: gl.getAttribLocation(dot, "aCol"),
        dRes: gl.getUniformLocation(dot, "uRes"),
        dDpr: gl.getUniformLocation(dot, "uDpr"),
        lPos: gl.getAttribLocation(line, "aPos"),
        lCol: gl.getAttribLocation(line, "aCol"),
        lRes: gl.getUniformLocation(line, "uRes"),
    }
}
function loseContext(gl: WebGLRenderingContext) {
    const ext = gl.getExtension("WEBGL_lose_context")
    if (ext) ext.loseContext()
}

/** In the editor nothing runs WebGL. Once per page the first instance checks whether it would work on the page, so
 * the canvas can name why visitors of this browser would only get the still grid. Not done in the static export. */
let capability: "ok" | "no-webgl" | "shader" | null = null
function checkCapability(doc: Document) {
    if (capability) return capability
    const c = doc.createElement("canvas")
    c.width = 4
    c.height = 4
    let gl: WebGLRenderingContext | null = null
    try {
        gl = c.getContext("webgl", GL_ATTRS) as WebGLRenderingContext | null
    } catch {
        // a browser that throws instead of returning null: same answer, and the editor names it below
        gl = null
    }
    if (!gl || gl.isContextLost()) capability = "no-webgl"
    else {
        const p = buildPrograms(gl)
        capability = p ? "ok" : "shader"
        loseContext(gl)
    }
    return capability
}

// ------------------------------------------------------------------ page-wide bookkeeping

/** instances holding a WebGL context (at most MAX_CONTEXTS) and those waiting for one */
const holders: Membrane[] = []
const waiting = new Set<Membrane>()
function handOutContexts() {
    for (const m of Array.from(waiting)) {
        if (holders.length >= MAX_CONTEXTS) break
        m.retry()
    }
}

/** One passive, read-only scroll listener per window for all instances with Scroll on, attached only while at least
 * one of them is in view and running. It wakes their loops; each loop reads its own position (FP-16: global listeners
 * only read and only where needed; capture also hears scrolling inside Framer's scroll frames). */
const scrollers = new Map<Window, Set<Membrane>>()
const onScroll = (e: Event) => {
    const win = (e.currentTarget as Window | null) || null
    const set = win ? scrollers.get(win) : null
    if (set) for (const m of set) m.wake()
}
function watchScroll(win: Window, m: Membrane, on: boolean) {
    let set = scrollers.get(win)
    if (on) {
        if (!set) {
            set = new Set()
            scrollers.set(win, set)
            win.addEventListener("scroll", onScroll, { passive: true, capture: true })
        }
        set.add(m)
    } else if (set) {
        set.delete(m)
        if (!set.size) {
            scrollers.delete(win)
            win.removeEventListener("scroll", onScroll, { capture: true })
        }
    }
}

/** one stylesheet per page (FP-21): the server HTML, the static export and the first render carry each instance's own
 * copy. Once mounted, only the first instance keeps it (inside its own element, FP-16), the others drop theirs before
 * the first paint, and when the first one leaves, the next takes it over. */
const sheetHolders = new Map<Document, Array<(own: boolean) => void>>()
function useSharedSheet(ref: { current: HTMLElement | null }) {
    const [own, setOwn] = useState(true)
    useBrowserLayoutEffect(() => {
        const doc = ref.current?.ownerDocument
        if (!doc) return
        const list = sheetHolders.get(doc) ?? []
        sheetHolders.set(doc, list)
        list.push(setOwn)
        setOwn(list[0] === setOwn)
        return () => {
            const i = list.indexOf(setOwn)
            if (i >= 0) list.splice(i, 1)
            if (i === 0 && list.length) list[0](true)
            if (!list.length) sheetHolders.delete(doc)
        }
    }, [ref])
    return own
}

// ------------------------------------------------------------------ the membrane (page only)

type Reason = "no-webgl" | "lost" | "shader" | "limit" | "error"
interface Strike {
    x: number
    y: number
    j: number
    age: number
}

/**
 * The moving grid: a height field on a square grid, a wave equation in fixed time steps, excited only by strikes.
 * The wave moves dots only along its running front (the slope of the velocity), never by the dent a 2D wave leaves
 * in the middle, so lines cannot fold. Under the pointer the grid opens into a ring by an area-preserving radial
 * map (r to the square root of r² + R²): the order of the dots stays, nothing bunches up.
 * It writes only to its own elements: its canvas, the opacity of the still grid and data-ds-* on the root.
 */
class Membrane {
    root: HTMLElement
    host: HTMLElement
    still: HTMLElement | null
    probe: HTMLElement | null
    win: Window
    o: Opts
    pal: Palette
    // drawing
    canvas: HTMLCanvasElement | null = null
    gl: WebGLRenderingContext | null = null
    pg: Programs | null = null
    shown = false
    broken: Reason | null = null
    // size
    W = 0
    H = 0
    k = 1
    pr = 1
    /** pixel ratio of the canvas, at most pr (see sizeCanvas) */
    prGl = 1
    s = 20
    cols = 0
    rows = 0
    n = 0
    ox = 0
    oy = 0
    rx = new Float32Array(0)
    ry = new Float32Array(0)
    zS = new Float32Array(0)
    vS = new Float32Array(0)
    aS = new Float32Array(0)
    fS = new Float32Array(0)
    edge = new Float32Array(0)
    fade = new Float32Array(0)
    quietM = new Float32Array(0)
    sx = new Float32Array(0)
    sy = new Float32Array(0)
    hg = new Float32Array(0)
    sh = new Float32Array(0)
    en = new Float32Array(0)
    lt = new Float32Array(0)
    vis = new Float32Array(0)
    rim = new Float32Array(0)
    dotData = new Float32Array(0)
    lineData = new Float32Array(0)
    // motion
    t = 0
    t0 = -1
    acc = 0
    last = 0
    raf = 0
    fieldZero = true
    strikes: Strike[] = []
    ptr = { x: 0, y: 0, sx: 0, sy: 0, in: false, amt: 0 }
    pulse = { x: 0, y: 0, age: 99 }
    touch: { cx: number; cy: number; x: number; y: number; t: number } | null = null
    introDone = false
    introAt = -1
    prevTop: number | null = null
    prevAt = 0
    scrollVel = 0
    L = 0
    Lv = 0
    // page
    visible = false
    hiddenAt = 0
    reduced = false
    threshold = 0.35
    ro: ResizeObserver
    io: IntersectionObserver | null = null
    mqMotion: MediaQueryList
    mqScheme: MediaQueryList
    mqRes: MediaQueryList | null = null
    dead = false

    constructor(root: HTMLElement, host: HTMLElement, still: HTMLElement | null, probe: HTMLElement | null, o: Opts) {
        this.root = root
        this.host = host
        this.still = still
        this.probe = probe
        this.win = root.ownerDocument.defaultView || window
        this.o = o
        this.pal = paletteOf(null, o)
        this.mqMotion = this.win.matchMedia("(prefers-reduced-motion: reduce)")
        this.mqScheme = this.win.matchMedia("(prefers-color-scheme: dark)")
        this.ro = new ResizeObserver(this.onResize)
    }

    /** Everything that measures, observes or listens; run through guard() by the component, so a failure here also
     * ends on the still grid with a reason. The three matchMedia listeners only read (reduced motion, color scheme for
     * color styles with a dark value, pixel ratio) and are removed in destroy() (FP-16). */
    start = this.guard(() => {
        const root = this.root
        this.pal = paletteOf(this.probe, this.o)
        this.reduced = this.mqMotion.matches
        if (this.reduced) this.introDone = true
        this.mqMotion.addEventListener("change", this.onMotion)
        this.mqScheme.addEventListener("change", this.onScheme)
        this.watchResolution()
        this.measure()
        this.build()
        this.ro.observe(root)
        this.observe()
        root.addEventListener("pointermove", this.onMove, { passive: true })
        root.addEventListener("pointerdown", this.onDown, { passive: true })
        root.addEventListener("pointerup", this.onUp, { passive: true })
        root.addEventListener("pointerleave", this.onLeave, { passive: true })
        root.addEventListener("pointercancel", this.onCancel, { passive: true })
    })

    /** Runs a callback; anything unexpected stops the motion, shows the still grid and names the reason on the root. */
    guard<A extends unknown[]>(fn: (...a: A) => void) {
        return (...a: A) => {
            if (this.dead) return
            try {
                fn(...a)
            } catch (e) {
                this.fail("error", e instanceof Error ? e.message : String(e))
            }
        }
    }

    // ---- options

    set = this.guard((o: Opts) => {
        const prev = this.o
        this.o = o
        if (o.theme !== prev.theme || o.backdrop !== prev.backdrop || o.grid !== prev.grid || o.glow !== prev.glow || o.ownGlow !== prev.ownGlow) this.pal = paletteOf(this.probe, o)
        if (o.calm !== prev.calm) this.weights()
        if (o.scroll !== prev.scroll) {
            this.prevTop = null
            this.syncScroll()
        }
        if (!o.intro && this.introAt >= 0) this.introAt = -1
        this.wake()
        if (this.gl && this.shown && !this.raf) this.draw()
    })

    onScheme = this.guard(() => {
        // a color style can carry its own value for dark mode
        this.pal = paletteOf(this.probe, this.o)
        this.wake()
    })

    onMotion = this.guard(() => {
        this.reduced = this.mqMotion.matches
        if (this.reduced) {
            // no frozen ring: field, strikes, light and scroll go, the context is released, the still grid shows
            this.introDone = true
            this.introAt = -1
            this.strikes.length = 0
            this.pulse.age = 99
            this.ptr.amt = 0
            this.ptr.in = false
            this.L = 0
            this.Lv = 0
            this.scrollVel = 0
            this.release()
        } else if (this.visible) this.retry()
    })

    watchResolution() {
        if (this.mqRes) this.mqRes.removeEventListener("change", this.onResolution)
        this.mqRes = this.win.matchMedia(`(resolution: ${this.win.devicePixelRatio || 1}dppx)`)
        this.mqRes.addEventListener("change", this.onResolution)
    }
    onResolution = this.guard(() => {
        this.watchResolution()
        this.measure()
        this.sizeCanvas()
        if (this.gl && this.shown) this.draw()
    })

    // ---- size

    /** layout size (not transformed), the scale of ancestors and the pixel ratio of the canvas */
    measure(w?: number, h?: number) {
        const r = this.root.getBoundingClientRect()
        const ow = this.root.offsetWidth
        this.W = Math.max(1, w ?? ow)
        this.H = Math.max(1, h ?? this.root.offsetHeight)
        this.k = ow > 0 && r.width > 0 ? r.width / ow : 1
        this.pr = clamp(Math.min(2, this.win.devicePixelRatio || 1) * this.k, 0.5, 2)
    }

    onResize = this.guard((es: ResizeObserverEntry[]) => {
        const e = es[es.length - 1]
        const w = e ? e.contentRect.width : undefined
        const h = e ? e.contentRect.height : undefined
        const sameSize = Math.abs((w ?? 0) - this.W) < 0.01 && Math.abs((h ?? 0) - this.H) < 0.01
        this.measure(w || undefined, h || undefined)
        if (!sameSize || !this.n) this.build()
        this.sizeCanvas()
        if (!this.introDone) this.observe()
        if (this.visible && !this.gl) this.retry()
        if (this.gl && this.shown) this.draw()
    })

    /** the grid: one dot exactly in the middle, at least one step beyond every edge */
    build() {
        const W = this.W, H = this.H
        const s = spacingFor(W)
        const kx = Math.ceil(W / (2 * s)) + 1
        const ky = Math.ceil(H / (2 * s)) + 1
        const cols = 2 * kx + 1, rows = 2 * ky + 1, n = cols * rows
        this.s = s
        this.cols = cols
        this.rows = rows
        this.n = n
        this.ox = W / 2 - kx * s
        this.oy = H / 2 - ky * s
        const F = () => new Float32Array(n)
        this.rx = F()
        this.ry = F()
        this.zS = F()
        this.vS = F()
        this.aS = F()
        this.fS = F()
        this.edge = F()
        this.fade = F()
        this.quietM = F()
        this.sx = F()
        this.sy = F()
        this.hg = F()
        this.sh = F()
        this.en = F()
        this.lt = F()
        this.vis = F()
        this.rim = F()
        this.dotData = new Float32Array(n * 7)
        this.lineData = new Float32Array(n * 2 * 2 * 6)
        this.strikes.length = 0
        this.fieldZero = true
        const f = (d: number) => 0.55 + 0.45 * Math.min(1, Math.max(0, d) / 80)
        for (let j = 0; j < rows; j++)
            for (let i = 0; i < cols; i++) {
                const k = j * cols + i
                const x = this.ox + i * s, y = this.oy + j * s
                this.rx[k] = x
                this.ry[k] = y
                this.edge[k] = Math.min(1, Math.min(i, j, cols - 1 - i, rows - 1 - j) / 2.5)
                // fade towards the edges as the product of all four sides, like the CSS mask of the still grid
                this.fade[k] = f(x) * f(W - x) * f(y) * f(H - y)
            }
        this.weights()
        this.prevTop = null
    }

    /** quieter grid behind the middle (Calm Zone) times the edge fade */
    weights() {
        const W = this.W, H = this.H
        const qw = W < 700 ? 0.5 : 0.34
        for (let k = 0; k < this.n; k++) {
            let q = 1
            if (this.o.calm) {
                const ux = (this.rx[k] - W / 2) / (W * qw), uy = (this.ry[k] - H / 2) / (H * 0.26)
                q = 1 - LOOK.quiet * Math.exp(-(ux * ux + uy * uy) * 1.6)
            }
            this.quietM[k] = q * this.fade[k]
        }
    }

    /** Browsers shrink a drawing buffer that is too large without a word (Chromium by area, WebKit at 16384 px a
     * side), which would shift and stretch the picture on very tall surfaces: the canvas stays at most 8192 px a side
     * and 16.7 million pixels, by lowering its pixel ratio (not below 0.1, so beyond about 80000 px of height the
     * canvas grows again, still within the 16384 px browsers allow). */
    sizeCanvas() {
        const c = this.canvas
        if (!c) return
        this.prGl = Math.max(0.1, Math.min(this.pr, MAX_SIDE / this.W, MAX_SIDE / this.H, Math.sqrt(MAX_AREA / (this.W * this.H))))
        const w = Math.max(1, Math.round(this.W * this.prGl)), h = Math.max(1, Math.round(this.H * this.prGl))
        if (c.width !== w) c.width = w
        if (c.height !== h) c.height = h
    }

    // ---- visibility and the intro

    /** thresholds 0 and t: t is 35 % of the surface, or half the window height for surfaces taller than the window */
    observe() {
        const F = this.win.innerHeight || this.H
        const t = clamp(Math.min(0.35, (0.5 * F) / this.H), 0.01, 0.35)
        if (this.io && Math.abs(t - this.threshold) <= 0.01) return
        this.threshold = t
        if (this.io) this.io.disconnect()
        this.io = new IntersectionObserver(this.guard(this.onIntersect), { threshold: [0, t] })
        this.io.observe(this.root)
    }

    onIntersect = (es: IntersectionObserverEntry[]) => {
        const e = es[es.length - 1]
        if (!e) return
        const was = this.visible
        this.visible = e.isIntersecting
        if (this.visible && !was) {
            // a surface coming into view starts calm: no old position, speed or swing from before it left
            this.prevTop = null
            this.scrollVel = 0
            this.L = 0
            this.Lv = 0
            this.retry()
        }
        if (!this.visible && was) {
            this.hiddenAt = performance.now()
            if (this.raf) cancelAnimationFrame(this.raf)
            this.raf = 0
        }
        if (this.visible && !this.introDone && this.o.intro && e.intersectionRatio >= this.threshold - 0.001) {
            this.introDone = true
            this.introAt = this.t + 0.5
        }
        if (!this.introDone && !this.o.intro) this.introDone = true
        this.syncScroll()
        this.wake()
    }

    /** where the intro strikes: the middle, or for surfaces taller than the window the middle of the part in view */
    introPoint() {
        const F = this.win.innerHeight || this.H
        if (this.H * this.k <= F) return { x: this.W / 2, y: this.H / 2 }
        const r = this.root.getBoundingClientRect()
        const top = Math.max(r.top, 0), bottom = Math.min(r.bottom, F)
        return { x: this.W / 2, y: bottom > top ? ((top + bottom) / 2 - r.top) / this.k : this.H / 2 }
    }

    syncScroll() {
        watchScroll(this.win, this, !this.dead && this.visible && !!this.pg && this.o.scroll && !this.reduced)
    }

    // ---- the WebGL context

    /** asks for a context when in view; frees the longest hidden one when all are taken */
    retry = this.guard(() => {
        if (this.dead || this.reduced || this.gl || !this.visible) return
        if (this.broken && this.broken !== "limit") return
        // a surface without size (a hidden breakpoint, a collapsed frame) takes no context
        if (!this.root.offsetWidth || !this.root.offsetHeight) return
        if (!holders.includes(this) && holders.length >= MAX_CONTEXTS) {
            let victim: Membrane | null = null
            for (const m of holders) if (!m.visible && (!victim || m.hiddenAt < victim.hiddenAt)) victim = m
            if (!victim) {
                waiting.add(this)
                this.mark("limit")
                return
            }
            victim.release(false)
        }
        waiting.delete(this)
        this.startGl()
    })

    startGl() {
        const doc = this.root.ownerDocument
        const c = doc.createElement("canvas")
        c.setAttribute("aria-hidden", "true")
        c.className = "ds-canvas"
        const gl = c.getContext("webgl", GL_ATTRS) as WebGLRenderingContext | null
        if (!gl) return this.fail("no-webgl")
        if (gl.isContextLost()) return this.fail("lost")
        const pg = buildPrograms(gl)
        if (!pg) {
            loseContext(gl)
            return this.fail("shader")
        }
        this.canvas = c
        this.gl = gl
        this.pg = pg
        this.shown = false
        holders.push(this)
        this.mark(null)
        c.addEventListener("webglcontextlost", this.onLost)
        c.addEventListener("webglcontextrestored", this.onRestored)
        this.host.appendChild(c)
        this.sizeCanvas()
        this.t0 = -1
        this.prevTop = null
        this.syncScroll()
        this.wake()
    }

    /** back to the still grid; the context goes back to the page */
    release(handOut = true) {
        if (this.raf) cancelAnimationFrame(this.raf)
        this.raf = 0
        const i = holders.indexOf(this)
        if (i >= 0) holders.splice(i, 1)
        const gl = this.gl, c = this.canvas, pg = this.pg
        this.gl = null
        this.canvas = null
        this.pg = null
        this.shown = false
        if (c) {
            c.removeEventListener("webglcontextlost", this.onLost)
            c.removeEventListener("webglcontextrestored", this.onRestored)
        }
        if (gl && pg && !gl.isContextLost()) {
            gl.deleteBuffer(pg.bufDot)
            gl.deleteBuffer(pg.bufLine)
            gl.deleteProgram(pg.dot)
            gl.deleteProgram(pg.line)
        }
        if (gl) loseContext(gl)
        if (c) c.remove()
        if (this.still) this.still.style.opacity = ""
        this.syncScroll()
        if (handOut) handOutContexts()
    }

    /** the context of our own canvas was lost: preventDefault (our own canvas only, no effect on the page) lets the
     * browser hand it back; until then the still grid shows */
    onLost = (e: Event) => {
        e.preventDefault()
        if (this.raf) cancelAnimationFrame(this.raf)
        this.raf = 0
        this.pg = null
        this.shown = false
        if (this.still) this.still.style.opacity = ""
        if (this.canvas) this.canvas.style.opacity = "0"
        this.mark("lost")
        this.syncScroll()
    }
    onRestored = this.guard(() => {
        const gl = this.gl
        if (!gl) return
        const pg = buildPrograms(gl)
        if (!pg) return this.fail("shader")
        this.pg = pg
        this.mark(null)
        this.build()
        this.t0 = -1
        this.syncScroll()
        this.wake()
    })

    mark(reason: Reason | null, detail?: string) {
        if (reason) this.root.setAttribute("data-ds-reason", reason)
        else this.root.removeAttribute("data-ds-reason")
        if (detail) this.root.setAttribute("data-ds-detail", detail.slice(0, 200))
        else this.root.removeAttribute("data-ds-detail")
    }

    fail(reason: Reason, detail?: string) {
        this.broken = reason
        this.mark(reason, detail)
        this.release()
    }

    // ---- input (own element only, passive, never preventDefault)

    local(e: PointerEvent) {
        const r = this.root.getBoundingClientRect()
        const ow = this.root.offsetWidth
        if (ow > 0 && r.width > 0) this.k = r.width / ow
        return { x: (e.clientX - r.left) / this.k, y: (e.clientY - r.top) / this.k }
    }
    onMove = this.guard((e: PointerEvent) => {
        if (e.pointerType === "touch") {
            if (this.touch && Math.hypot(e.clientX - this.touch.cx, e.clientY - this.touch.cy) > 10) this.touch = null
            return
        }
        const p = this.local(e)
        if (!this.ptr.in) {
            this.ptr.sx = p.x
            this.ptr.sy = p.y
        }
        this.ptr.x = p.x
        this.ptr.y = p.y
        this.ptr.in = true
        this.wake()
    })
    onDown = this.guard((e: PointerEvent) => {
        if (e.button !== 0) return
        const t = e.target as Element | null
        if (t && typeof t.closest === "function" && t.closest(NO_STRIKE)) return
        const p = this.local(e)
        if (e.pointerType === "touch") {
            this.touch = { cx: e.clientX, cy: e.clientY, x: p.x, y: p.y, t: performance.now() }
            return
        }
        this.hit(p.x, p.y, J_MOUSE, false)
        this.wake()
    })
    onUp = this.guard((e: PointerEvent) => {
        if (e.pointerType !== "touch") return
        const tc = this.touch
        this.touch = null
        // a tap: short and still; anything longer or further is scrolling
        if (tc && performance.now() - tc.t < 600 && Math.hypot(e.clientX - tc.cx, e.clientY - tc.cy) <= 10) {
            this.hit(tc.x, tc.y, J_TOUCH, true)
            this.wake()
        }
    })
    onLeave = (e: PointerEvent) => {
        if (e.pointerType === "touch") return
        this.ptr.in = false
        this.wake()
    }
    onCancel = () => {
        this.touch = null
    }

    /** a strike with the set Strength; light: a short glow at the spot (taps) */
    hit(x: number, y: number, j: number, light: boolean, boost = 1) {
        if (this.reduced) return
        const s = clamp(this.o.strength * boost, 0, 1)
        if (s > 0) {
            this.strikes.push({ x, y, j: j * s * sizeFactor(this.W, this.H), age: 0 })
            this.fieldZero = false
        }
        if (light) {
            this.pulse.x = x
            this.pulse.y = y
            this.pulse.age = 0
        }
    }

    // ---- the loop

    wake() {
        if (this.dead || this.raf || !this.visible || !this.gl || !this.pg || this.reduced) return
        this.last = 0
        this.raf = requestAnimationFrame(this.frame)
    }

    frame = this.guard((now: number) => {
        this.raf = 0
        if (!this.gl || !this.pg || !this.visible || this.reduced) return
        const dt = this.last === 0 ? 1 / 60 : Math.min(0.1, (now - this.last) / 1000)
        this.last = now
        this.advance(dt, now)
        this.draw()
        if (this.awake()) this.raf = requestAnimationFrame(this.frame)
    })

    advance(dt: number, now: number) {
        const o = this.o
        this.t += dt
        this.pulse.age += dt
        const p = this.ptr
        const kp = 1 - Math.exp(-dt / 0.07)
        p.sx += (p.x - p.sx) * kp
        p.sy += (p.y - p.sy) * kp
        p.amt += ((p.in ? 1 : 0) - p.amt) * (1 - Math.exp(-dt / (p.in ? 0.18 : 0.45)))
        if (this.introAt >= 0 && this.t >= this.introAt) {
            this.introAt = -1
            const at = this.introPoint()
            this.hit(at.x, at.y, J_MOUSE, false, INTRO)
        }
        // scroll: the skin lags behind fast scrolling and swings out
        // A position older than 100 ms (the loop slept, or the surface just came into view) is dropped, so the first
        // picture after it has no speed; the speed comes from the real time between two readings.
        if (o.scroll) {
            const top = this.root.getBoundingClientRect().top / this.k
            if (this.prevTop !== null && now > this.prevAt && now - this.prevAt < 100) {
                const vel = (top - this.prevTop) / ((now - this.prevAt) / 1000)
                this.scrollVel += (vel - this.scrollVel) * (1 - Math.exp(-dt / 0.06))
            }
            this.prevTop = top
            this.prevAt = now
        } else {
            this.prevTop = null
            this.scrollVel = 0
        }
        const target = o.scroll ? clamp(-this.scrollVel * 0.014, -26, 26) : 0
        const w = Math.PI * 2 * 1.7, z = 0.16
        this.Lv += (w * w * (target - this.L) - 2 * z * w * this.Lv) * dt
        this.L += this.Lv * dt
        // the wave in fixed steps; while field and strikes rest only the time step is kept
        this.acc += dt
        let steps = 0
        while (this.acc >= DT && steps < 6) {
            if (!this.fieldZero) this.step(DT)
            this.acc -= DT
            steps++
        }
        if (steps === 6) this.acc = 0
    }

    /** the loop sleeps when nothing lives: breathing off, no wave, no pointer, no tap light, no scroll swing */
    awake() {
        if (this.reduced || !this.visible) return false
        if (this.o.breathing || this.introAt >= 0 || !this.fieldZero || this.strikes.length) return true
        if (this.ptr.in || this.ptr.amt >= 0.002 || this.pulse.age < 4) return true
        return Math.abs(this.L) >= 0.05 || Math.abs(this.Lv) >= 0.05 || Math.abs(this.scrollVel) >= 0.05
    }

    waveSpeed() {
        return LOOK.speed * (0.3 + 0.7 * clamp(this.o.speed, 0, 1))
    }

    step(dt: number) {
        const { cols, rows, s, zS, vS, aS, fS } = this
        const speed = this.waveSpeed()
        const C2 = (speed / s) ** 2
        const NU = 0.9
        // a strike acts softly over strikeTime (sin² profile), like a felt mallet rather than a hard knock
        fS.fill(0)
        const T = LOOK.strikeTime
        const share = (x: number) => x / T - Math.sin((2 * Math.PI * x) / T) / (2 * Math.PI)
        for (let q = this.strikes.length - 1; q >= 0; q--) {
            const st = this.strikes[q]
            const a0 = st.age, a1 = Math.min(T, st.age + dt)
            const part = share(a1) - share(a0)
            st.age += dt
            if (part > 0) {
                const sig = LOOK.strikeSigma / s, R = Math.ceil(sig * 3.2)
                const gx = (st.x - this.ox) / s, gy = (st.y - this.oy) / s
                const ci = Math.round(gx), cj = Math.round(gy)
                for (let j = Math.max(1, cj - R); j <= Math.min(rows - 2, cj + R); j++)
                    for (let i = Math.max(1, ci - R); i <= Math.min(cols - 2, ci + R); i++) {
                        const dx = i - gx, dy = j - gy
                        fS[j * cols + i] -= (st.j * part * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig))) / dt
                    }
            }
            if (st.age >= T) this.strikes.splice(q, 1)
        }
        // small surfaces throw the wave back sooner: a shorter ring there; slower waves fade slower to still cross
        const g = sizeFactor(this.W, this.H)
        const damp = LOOK.damp * (1 + 0.8 * (1 - g)) * Math.pow(speed / LOOK.speed, 0.6)
        for (let j = 1; j < rows - 1; j++) {
            const o = j * cols
            for (let i = 1; i < cols - 1; i++) {
                const k = o + i
                // isotropic 9-point Laplacian: rings stay round
                const lz = (4 * (zS[k - 1] + zS[k + 1] + zS[k - cols] + zS[k + cols]) + zS[k - cols - 1] + zS[k - cols + 1] + zS[k + cols - 1] + zS[k + cols + 1] - 20 * zS[k]) / 6
                const lv = (4 * (vS[k - 1] + vS[k + 1] + vS[k - cols] + vS[k + cols]) + vS[k - cols - 1] + vS[k - cols + 1] + vS[k + cols - 1] + vS[k + cols + 1] - 20 * vS[k]) / 6
                aS[k] = C2 * lz - 1.5 * zS[k] - damp * vS[k] + NU * lv + fS[k]
            }
        }
        let maxV = 0
        for (let j = 1; j < rows - 1; j++) {
            const o = j * cols
            for (let i = 1; i < cols - 1; i++) {
                const k = o + i
                vS[k] += aS[k] * dt
                zS[k] += vS[k] * dt
                const av = Math.abs(vS[k])
                if (av > maxV) maxV = av
            }
        }
        // the wave has faded: the field rests (no steps until the next strike)
        if (!this.strikes.length && maxV < 0.5) {
            zS.fill(0)
            vS.fill(0)
            this.fieldZero = true
        }
    }

    breath(x: number, y: number) {
        const W = this.W, H = this.H, t = this.t
        const lam = Math.max(W, H) * 1.3
        const ph = ((x * 0.8 + y * 0.6) / lam) * Math.PI * 2 - t * ((Math.PI * 2) / 9)
        const ph2 = ((x * -0.5 + y * 0.86) / (lam * 0.7)) * Math.PI * 2 - t * ((Math.PI * 2) / 13)
        return 3.0 * Math.sin(ph) + 1.5 * Math.sin(ph2)
    }

    pulseAmt() {
        const a = this.pulse.age
        if (a > 4) return 0
        return a < 0.12 ? a / 0.12 : Math.exp(-(a - 0.12) / 0.75)
    }

    /** where every dot sits this frame */
    layout() {
        const { n, cols, rows, s, rx, ry, hg, sh, sx, sy, vis, rim, vS, edge } = this
        const o = this.o
        const L = o.scroll ? this.L : 0
        const lx = -0.55, ly = -0.65
        const cap = LOOK.waveCap * s, G = LOOK.waveShift * 0.05
        const spanX = (cols - 1) * s, spanY = (rows - 1) * s
        const mode = (k: number) => Math.sin((Math.PI * (rx[k] - this.ox)) / spanX) * Math.sin((Math.PI * (ry[k] - this.oy)) / spanY)
        // breathing grows in over 1.5 s after the first picture, which matches the still grid
        if (this.t0 < 0) this.t0 = this.t
        const hub = o.breathing ? smooth(0, 1, (this.t - this.t0) / 1.5) : 0
        // the opening: Rc is the radius of the map, about 1.15 Rc are visibly free
        const a = this.ptr.amt
        const Rfull = Math.max(0, o.opening) / 1.15
        const Rc = Rfull * a * a * (3 - 2 * a)
        const w0 = 2.2 * Rfull, w1 = 4.5 * Rfull
        const psx = this.ptr.sx, psy = this.ptr.sy
        for (let k = 0; k < n; k++) hg[k] = (hub > 0 ? hub * this.breath(rx[k], ry[k]) : 0) + (L !== 0 ? L * 0.7 * mode(k) : 0)
        for (let j = 0; j < rows; j++)
            for (let i = 0; i < cols; i++) {
                const k = j * cols + i
                const kl = i > 0 ? k - 1 : k, kr = i < cols - 1 ? k + 1 : k, ku = j > 0 ? k - cols : k, kd = j < rows - 1 ? k + cols : k
                const hx = kr - kl || 1, hy = (kd - ku) / cols || 1
                // breathing and scroll: a soft shift and lift, the slope as light
                const gX = (hg[kr] - hg[kl]) / hx / s, gY = (hg[kd] - hg[ku]) / hy / s
                let ux = -gX * s * LOOK.shift
                let uy = -gY * s * LOOK.shift + (L !== 0 ? L * mode(k) : 0) - LOOK.tilt * hg[k]
                sh[k] = -(gX * lx + gY * ly) * 9 * LOOK.light
                // the wave: only the running front moves dots, softly capped
                let wx = (-(vS[kr] - vS[kl]) / hx) * G, wy = (-(vS[kd] - vS[ku]) / hy) * G
                const wm = Math.hypot(wx, wy)
                if (wm > 0.001) {
                    const f = (cap * Math.tanh(wm / cap)) / wm
                    wx *= f
                    wy *= f
                }
                ux = (ux + wx) * edge[k]
                uy = (uy + wy) * edge[k]
                let px = rx[k] + ux, py = ry[k] + uy
                // the opening under the pointer: area-preserving outwards, softly faded far out
                let v = 1, rk = 0
                if (Rc > 0.5) {
                    const dx = px - psx, dy = py - psy
                    const r = Math.hypot(dx, dy)
                    if (r < w1) {
                        const f = Math.sqrt(r * r + Rc * Rc)
                        const d = (f - r) * (1 - smooth(w0, w1, r))
                        if (r > 0.001) {
                            px += (dx / r) * d
                            py += (dy / r) * d
                        }
                        // dots near the middle fade out instead of jumping onto the ring
                        v = smooth(0.35 * Rc, 0.9 * Rc, r)
                        rk = smooth(0.25, 0.45, d / Rc) * v
                    }
                }
                sx[k] = px
                sy[k] = py
                vis[k] = v
                rim[k] = rk
            }
    }

    draw() {
        const gl = this.gl, pg = this.pg, c = this.canvas
        if (!gl || !pg || !c || !this.n) return
        if (gl.isContextLost()) return
        this.layout()
        const { n, cols, rows, rx, ry, en, lt, vis, rim, quietM, sh, sx, sy, vS, dotData, lineData } = this
        const P = this.pal
        const o = this.o
        // the buffer the browser really gave us (it can still be smaller than asked for)
        const bw = gl.drawingBufferWidth || c.width, bh = gl.drawingBufferHeight || c.height
        gl.viewport(0, 0, bw, bh)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.enable(gl.BLEND)
        // light: the pointer and the tap glow, a core plus a wide halo
        const R = lightRadius(this.W, this.H, o.opening)
        const i1 = -1 / (2 * R * R), i2 = -1 / (2 * (2.4 * R) ** 2)
        const pA = this.ptr.amt, qA = this.pulseAmt()
        const halo = LOOK.halo
        for (let k = 0; k < n; k++) {
            en[k] = Math.min(1.6, Math.abs(vS[k]) * 0.016)
            let l = 0
            if (pA > 0.002) {
                const dx = rx[k] - this.ptr.sx, dy = ry[k] - this.ptr.sy, d2 = dx * dx + dy * dy
                l += pA * ((1 - halo) * Math.exp(d2 * i1) + halo * Math.exp(d2 * i2))
            }
            if (qA > 0.002) {
                const dx = rx[k] - this.pulse.x, dy = ry[k] - this.pulse.y, d2 = dx * dx + dy * dy
                l = Math.max(l, qA * ((1 - halo) * Math.exp(d2 * i1) + halo * Math.exp(d2 * i2)))
            }
            lt[k] = l
        }
        const rest = P.rest, lit = P.lit, hot = P.hot, aR = P.aRest, aL = P.aLit
        let dots = 0
        for (let k = 0; k < n; k++) {
            if (vis[k] < 0.004) continue
            const e = Math.min(1, en[k]) * (0.35 + 0.65 * quietM[k])
            const l = Math.min(1, lt[k])
            const rk = rim[k] * quietM[k]
            const shade = clamp(sh[k], -1, 1)
            const size = LOOK.dot * (1 + LOOK.dotLight * l) * (1 + LOOK.dotGrow * e) * (1 + LOOK.dotRim * rk) * (1 + 0.14 * shade)
            const level = LOOK.restDot + LOOK.lightDot * l + LOOK.waveDot * e + LOOK.rimDot * rk
            const m = Math.min(1, Math.max(l, e * 0.85, rk))
            const h = e * 0.45
            const colA = aR + (aL - aR) * m
            let a = level * (P.dark ? 1 + 0.4 * shade : 1 - 0.4 * shade)
            a = clamp(a * quietM[k] * vis[k], 0, 1) * (colA + (aL - colA) * h)
            const di = dots * 7
            dotData[di] = sx[k]
            dotData[di + 1] = sy[k]
            dotData[di + 2] = size
            for (let ch = 0; ch < 3; ch++) {
                const base = rest[ch] + (lit[ch] - rest[ch]) * m
                dotData[di + 3 + ch] = (base + (hot[ch] - base) * h) / 255
            }
            dotData[di + 6] = a
            dots++
        }
        let li = 0
        const seg = (k1: number, k2: number) => {
            const vv = Math.min(vis[k1], vis[k2])
            if (vv < 0.004) return
            const q = (quietM[k1] + quietM[k2]) * 0.5
            const l = Math.min(1, (lt[k1] + lt[k2]) * 0.5)
            const e = Math.min(1, (en[k1] + en[k2]) * 0.5)
            const m = Math.min(1, Math.max(l, e * 0.85))
            let a = (LOOK.restLine + LOOK.lightLine * l + LOOK.waveLine * e) * q * vv * (aR + (aL - aR) * m)
            if (a < 0.004) return
            a = Math.min(1, a)
            const r = (rest[0] + (lit[0] - rest[0]) * m) / 255, g = (rest[1] + (lit[1] - rest[1]) * m) / 255, b = (rest[2] + (lit[2] - rest[2]) * m) / 255
            lineData[li++] = sx[k1]
            lineData[li++] = sy[k1]
            lineData[li++] = r
            lineData[li++] = g
            lineData[li++] = b
            lineData[li++] = a
            lineData[li++] = sx[k2]
            lineData[li++] = sy[k2]
            lineData[li++] = r
            lineData[li++] = g
            lineData[li++] = b
            lineData[li++] = a
        }
        for (let j = 0; j < rows; j++)
            for (let i = 0; i < cols; i++) {
                const k = j * cols + i
                if (i < cols - 1) seg(k, k + 1)
                if (j < rows - 1) seg(k, k + cols)
            }
        if (li > 0) {
            gl.useProgram(pg.line)
            // on a dark, opaque ground lines add up like light; otherwise they mix normally
            gl.blendFunc(gl.ONE, P.additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA)
            gl.bindBuffer(gl.ARRAY_BUFFER, pg.bufLine)
            gl.bufferData(gl.ARRAY_BUFFER, lineData.subarray(0, li), gl.DYNAMIC_DRAW)
            gl.uniform2f(pg.lRes, this.W, this.H)
            gl.enableVertexAttribArray(pg.lPos)
            gl.vertexAttribPointer(pg.lPos, 2, gl.FLOAT, false, 24, 0)
            gl.enableVertexAttribArray(pg.lCol)
            gl.vertexAttribPointer(pg.lCol, 4, gl.FLOAT, false, 24, 8)
            gl.drawArrays(gl.LINES, 0, li / 6)
            gl.disableVertexAttribArray(pg.lPos)
            gl.disableVertexAttribArray(pg.lCol)
        }
        if (dots > 0) {
            gl.useProgram(pg.dot)
            gl.bindBuffer(gl.ARRAY_BUFFER, pg.bufDot)
            gl.bufferData(gl.ARRAY_BUFFER, dotData.subarray(0, dots * 7), gl.DYNAMIC_DRAW)
            gl.uniform2f(pg.dRes, this.W, this.H)
            gl.uniform1f(pg.dDpr, (this.prGl * bw) / Math.max(1, c.width))
            gl.enableVertexAttribArray(pg.dPos)
            gl.vertexAttribPointer(pg.dPos, 2, gl.FLOAT, false, 28, 0)
            gl.enableVertexAttribArray(pg.dSize)
            gl.vertexAttribPointer(pg.dSize, 1, gl.FLOAT, false, 28, 8)
            gl.enableVertexAttribArray(pg.dCol)
            gl.vertexAttribPointer(pg.dCol, 4, gl.FLOAT, false, 28, 12)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            gl.drawArrays(gl.POINTS, 0, dots)
            gl.disableVertexAttribArray(pg.dPos)
            gl.disableVertexAttribArray(pg.dSize)
            gl.disableVertexAttribArray(pg.dCol)
        }
        // the first picture is drawn: canvas in, still grid out, in the same frame (no crossfade, never both)
        if (!this.shown) {
            this.shown = true
            c.style.opacity = "1"
            if (this.still) this.still.style.opacity = "0"
        }
    }

    destroy() {
        if (this.dead) return
        this.release(false)
        this.dead = true
        waiting.delete(this)
        this.ro.disconnect()
        if (this.io) this.io.disconnect()
        this.mqMotion.removeEventListener("change", this.onMotion)
        this.mqScheme.removeEventListener("change", this.onScheme)
        if (this.mqRes) this.mqRes.removeEventListener("change", this.onResolution)
        watchScroll(this.win, this, false)
        const r = this.root
        r.removeEventListener("pointermove", this.onMove)
        r.removeEventListener("pointerdown", this.onDown)
        r.removeEventListener("pointerup", this.onUp)
        r.removeEventListener("pointerleave", this.onLeave)
        r.removeEventListener("pointercancel", this.onCancel)
        handOutContexts()
    }
}

// ------------------------------------------------------------------ stylesheet (static, FP-20)

// The still grid: dots and hairlines as tiled gradients, centred like the canvas grid, so the first WebGL picture
// lands exactly on it. Two nested masks multiply: the edge fade (product of four sides) and the calm zone. In the
// editor and the static export a light layer in Glow and a free circle show the pointer in the middle.
const SHEET = `.ds-root{position:relative;overflow:hidden;isolation:isolate;touch-action:manipulation;-webkit-tap-highlight-color:transparent;background:var(--ds-backdrop)}
.ds-still{position:absolute;inset:0;container-type:size;pointer-events:none;--ds-dot:color-mix(in srgb,var(--ds-grid) 10%,transparent);--ds-line:color-mix(in srgb,var(--ds-grid) 2.6%,transparent)}
.ds-edge,.ds-calm,.ds-hole,.ds-light,.ds-dots,.ds-lines{position:absolute;inset:0}
.ds-edge{--ds-s:20px;-webkit-mask-image:linear-gradient(to right,rgba(0,0,0,.55),#000 80px),linear-gradient(to left,rgba(0,0,0,.55),#000 80px),linear-gradient(to bottom,rgba(0,0,0,.55),#000 80px),linear-gradient(to top,rgba(0,0,0,.55),#000 80px);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,rgba(0,0,0,.55),#000 80px),linear-gradient(to left,rgba(0,0,0,.55),#000 80px),linear-gradient(to bottom,rgba(0,0,0,.55),#000 80px),linear-gradient(to top,rgba(0,0,0,.55),#000 80px);mask-composite:intersect}
@container (min-width:2561px){.ds-edge{--ds-s:26px}}
@container (min-width:3841px){.ds-edge{--ds-s:32px}}
.ds-calm.is-on{-webkit-mask-image:radial-gradient(34% 26% at 50% 50%,rgba(0,0,0,.45) 0%,rgba(0,0,0,.5023) 25%,rgba(0,0,0,.6313) 50%,rgba(0,0,0,.7764) 75%,rgba(0,0,0,.889) 100%,rgba(0,0,0,.9549) 125%,rgba(0,0,0,.985) 150%,rgba(0,0,0,.9977) 185%,#000 240%);mask-image:radial-gradient(34% 26% at 50% 50%,rgba(0,0,0,.45) 0%,rgba(0,0,0,.5023) 25%,rgba(0,0,0,.6313) 50%,rgba(0,0,0,.7764) 75%,rgba(0,0,0,.889) 100%,rgba(0,0,0,.9549) 125%,rgba(0,0,0,.985) 150%,rgba(0,0,0,.9977) 185%,#000 240%)}
@container (width < 700px){.ds-calm.is-on{-webkit-mask-image:radial-gradient(50% 26% at 50% 50%,rgba(0,0,0,.45) 0%,rgba(0,0,0,.5023) 25%,rgba(0,0,0,.6313) 50%,rgba(0,0,0,.7764) 75%,rgba(0,0,0,.889) 100%,rgba(0,0,0,.9549) 125%,rgba(0,0,0,.985) 150%,rgba(0,0,0,.9977) 185%,#000 240%);mask-image:radial-gradient(50% 26% at 50% 50%,rgba(0,0,0,.45) 0%,rgba(0,0,0,.5023) 25%,rgba(0,0,0,.6313) 50%,rgba(0,0,0,.7764) 75%,rgba(0,0,0,.889) 100%,rgba(0,0,0,.9549) 125%,rgba(0,0,0,.985) 150%,rgba(0,0,0,.9977) 185%,#000 240%)}}
.ds-dots{background-image:radial-gradient(circle,var(--ds-dot) .91px,transparent 1.47px);background-size:var(--ds-s) var(--ds-s);background-position:center}
.ds-lines{background-image:linear-gradient(to right,transparent calc(50% - .5px),var(--ds-line) calc(50% - .5px),var(--ds-line) calc(50% + .5px),transparent calc(50% + .5px)),linear-gradient(to bottom,transparent calc(50% - .5px),var(--ds-line) calc(50% - .5px),var(--ds-line) calc(50% + .5px),transparent calc(50% + .5px));background-size:var(--ds-s) var(--ds-s);background-position:center}
@media (min-resolution:2dppx){.ds-still{--ds-line:color-mix(in srgb,var(--ds-grid) 1.3%,transparent)}}
.ds-light{--ds-dot:color-mix(in srgb,var(--ds-glow) 52%,transparent);--ds-line:color-mix(in srgb,var(--ds-glow) 13.6%,transparent);-webkit-mask-image:radial-gradient(circle calc(var(--ds-light-r) * 7) at 50% 50%,#000 0%,rgba(0,0,0,.942) 5.71%,rgba(0,0,0,.7921) 11.43%,rgba(0,0,0,.6055) 17.14%,rgba(0,0,0,.4348) 22.86%,rgba(0,0,0,.3067) 28.57%,rgba(0,0,0,.1907) 37.14%,rgba(0,0,0,.1121) 48.57%,rgba(0,0,0,.0478) 65.71%,transparent 100%);mask-image:radial-gradient(circle calc(var(--ds-light-r) * 7) at 50% 50%,#000 0%,rgba(0,0,0,.942) 5.71%,rgba(0,0,0,.7921) 11.43%,rgba(0,0,0,.6055) 17.14%,rgba(0,0,0,.4348) 22.86%,rgba(0,0,0,.3067) 28.57%,rgba(0,0,0,.1907) 37.14%,rgba(0,0,0,.1121) 48.57%,rgba(0,0,0,.0478) 65.71%,transparent 100%)}
@media (min-resolution:2dppx){.ds-light{--ds-line:color-mix(in srgb,var(--ds-glow) 6.8%,transparent)}}
.ds-hole{-webkit-mask-image:radial-gradient(circle calc(var(--ds-rv) * 1.35) at 50% 50%,transparent 78.5%,#000 100%);mask-image:radial-gradient(circle calc(var(--ds-rv) * 1.35) at 50% 50%,transparent 78.5%,#000 100%)}
.ds-gl{position:absolute;inset:0;pointer-events:none}
.ds-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0}
.ds-content{position:absolute;inset:0;z-index:1;-webkit-tap-highlight-color:initial}
.ds-probe{position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;color:rgb(1, 2, 3)}
.ds-probe>:nth-child(1){color:var(--ds-raw-backdrop)}
.ds-probe>:nth-child(2){color:var(--ds-raw-grid)}
.ds-probe>:nth-child(3){color:var(--ds-raw-glow)}
.ds-note{position:absolute;left:8px;bottom:8px;z-index:2;max-width:calc(100% - 16px);padding:6px 10px;border-radius:4px;background:rgba(255,255,255,.94);color:#1c1b19;box-shadow:0 0 0 1px rgba(28,27,25,.16);font:13px/18px system-ui,sans-serif;pointer-events:none}
`

// ------------------------------------------------------------------ component

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 * @framerDisableUnlink
 */
export default function Drumskin(props: Props) {
    const { content, look, colors, waves, pointer, motion, style } = props
    const isStatic = useIsStaticRenderer()
    // the switch for motion is useIsStaticRenderer(); RenderTarget only tells the editor canvas (hints) from the export
    const inCanvas = RenderTarget.current() === RenderTarget.canvas
    const rootRef = useRef<HTMLDivElement>(null)
    const stillRef = useRef<HTMLDivElement>(null)
    const glRef = useRef<HTMLDivElement>(null)
    const probeRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const memRef = useRef<Membrane | null>(null)
    const ownSheet = useSharedSheet(rootRef)
    const [size, setSize] = useState<{ w: number; h: number } | null>(null)
    const [note, setNote] = useState<string | null>(null)

    const lk = look && typeof look === "object" ? look : {}
    const cl = colors && typeof colors === "object" ? colors : {}
    const wv = waves && typeof waves === "object" ? waves : {}
    const pt = pointer && typeof pointer === "object" ? pointer : {}
    const mo = motion && typeof motion === "object" ? motion : {}
    const theme: Theme = lk.theme === "light" ? "light" : "dark"
    const calm = lk.calm !== false
    const th = THEMES[theme]
    const ownBackdrop = str(cl.backdrop), ownGrid = str(cl.grid), ownGlow = str(cl.glow)
    const backdrop = ownBackdrop || th.backdrop, grid = ownGrid || th.grid, glow = ownGlow || th.glow
    // an own color the browser cannot resolve (invalid, or a color style that is gone) falls back to the theme; found
    // after mounting through the probes, which carry the raw values
    const [unresolved, setUnresolved] = useState("")
    const strength = clamp(num(wv.strength, 75), 0, 100) / 100
    const speed = clamp(num(wv.speed, 40), 0, 100) / 100
    const opening = clamp(num(pt.opening, 70), 0, 160)
    const intro = mo.intro !== false
    const breathing = mo.breathing !== false
    const scroll = mo.scroll !== false
    const hasOwnGlow = !!ownGlow

    const opts: Opts = { theme, calm, strength, speed, opening, intro, breathing, scroll, backdrop, grid, glow, ownGlow: hasOwnGlow }
    const optsRef = useRef(opts)
    optsRef.current = opts

    // ---- the page: one membrane per mount, props go in through set()
    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current, host = glRef.current
        if (!root || !host) return
        const m = new Membrane(root, host, stillRef.current, probeRef.current, optsRef.current)
        memRef.current = m
        m.start()
        return () => {
            m.destroy()
            memRef.current = null
        }
    }, [isStatic])
    useEffect(() => {
        memRef.current?.set({ theme, calm, strength, speed, opening, intro, breathing, scroll, backdrop, grid, glow, ownGlow: hasOwnGlow })
    }, [theme, calm, strength, speed, opening, intro, breathing, scroll, backdrop, grid, glow, hasOwnGlow])

    useBrowserLayoutEffect(() => {
        const kids = probeRef.current?.children
        if (!kids) return
        const bad = [ownBackdrop && !readColor(kids[0]) ? "b" : "", ownGrid && !readColor(kids[1]) ? "g" : "", ownGlow && !readColor(kids[2]) ? "l" : ""].join("")
        setUnresolved((u) => (u === bad ? u : bad))
    }, [ownBackdrop, ownGrid, ownGlow])

    // ---- editor and export: the size sets the light radius; the editor names what keeps the grid from showing
    useEffect(() => {
        const root = rootRef.current
        if (!isStatic || !root) return
        const ro = new ResizeObserver((es) => {
            const r = es[es.length - 1]?.contentRect
            if (r) setSize((s) => (s && Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5 ? s : { w: r.width, h: r.height }))
        })
        ro.observe(root)
        return () => ro.disconnect()
    }, [isStatic])
    const slot = slotNode(content)
    useBrowserLayoutEffect(() => {
        if (!inCanvas) return
        const root = rootRef.current
        if (!root) return
        const cap = checkCapability(root.ownerDocument)
        let next: string | null = null
        if (cap === "no-webgl") next = "WebGL is off in this browser."
        else if (cap === "shader") next = "The grid shader did not compile."
        else if (paletteOf(probeRef.current, optsRef.current).faint) next = "Grid and Backdrop are too close to see the grid."
        else {
            const ct = contentRef.current
            if (ct && ct.scrollHeight > ct.clientHeight + 1) next = `Content is taller than ${NAME}. Raise the height on this breakpoint.`
        }
        setNote((p) => (p === next ? p : next))
    })

    const R = size ? lightRadius(size.w, size.h, opening) : Math.max(LOOK.lightR, 1.4 * opening)
    const vars = {
        "--ds-backdrop": unresolved.includes("b") ? th.backdrop : backdrop,
        "--ds-grid": unresolved.includes("g") ? th.grid : grid,
        "--ds-glow": unresolved.includes("l") ? th.glow : glow,
        "--ds-raw-backdrop": backdrop,
        "--ds-raw-grid": grid,
        "--ds-raw-glow": glow,
        "--ds-light-r": `${Math.round(R * 10) / 10}px`,
        "--ds-rv": `${Math.round((opening / 1.15) * 10) / 10}px`,
    } as CSSProperties

    return (
        <div ref={rootRef} className="ds-root" style={{ ...style, ...vars }}>
            {/* static stylesheet: a module constant, no props or CMS values (colors come in as CSS variables) */}
            {ownSheet ? <style dangerouslySetInnerHTML={{ __html: SHEET }} /> : null}
            <div ref={stillRef} className="ds-still" aria-hidden="true">
                <div className="ds-edge">
                    <div className={calm ? "ds-calm is-on" : "ds-calm"}>
                        {isStatic && opening > 0 ? (
                            <div className="ds-hole">
                                <div className="ds-lines" />
                                <div className="ds-dots" />
                                <div className="ds-light">
                                    <div className="ds-lines" />
                                    <div className="ds-dots" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="ds-lines" />
                                <div className="ds-dots" />
                                {isStatic ? (
                                    <div className="ds-light">
                                        <div className="ds-lines" />
                                        <div className="ds-dots" />
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div ref={glRef} className="ds-gl" aria-hidden="true" />
            {slot ? (
                <div ref={contentRef} className="ds-content">
                    {slot}
                </div>
            ) : null}
            <div ref={probeRef} className="ds-probe" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>
            {inCanvas && note ? (
                <div className="ds-note" aria-hidden="true">
                    {note}
                </div>
            ) : null}
        </div>
    )
}

Drumskin.displayName = NAME

// ------------------------------------------------------------------ panel (Framer)

addPropertyControls(Drumskin, {
    content: { type: ControlType.Slot, title: "Content", maxCount: 1, description: "Fills the whole surface, so align inside it and leave it without a fill. The grid still opens under the pointer." },
    look: {
        type: ControlType.Object,
        title: "Look",
        buttonTitle: "Theme",
        controls: {
            theme: { type: ControlType.Enum, title: "Theme", options: ["dark", "light"], optionTitles: ["Dark", "Light"], displaySegmentedControl: true, defaultValue: "dark", description: "Sets the colors you leave empty under Colors." },
            calm: { type: ControlType.Boolean, title: "Calm Zone", defaultValue: true, description: "Quieter grid behind the middle, for a headline." },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        buttonTitle: "Custom",
        controls: {
            backdrop: { type: ControlType.Color, title: "Backdrop", optional: true },
            grid: { type: ControlType.Color, title: "Grid", optional: true },
            glow: { type: ControlType.Color, title: "Glow", optional: true, description: "Color of the grid under the pointer and in a wave." },
        },
    },
    waves: {
        type: ControlType.Object,
        title: "Waves",
        buttonTitle: "Strength & Speed",
        controls: {
            strength: { type: ControlType.Number, title: "Strength", min: 0, max: 100, step: 5, unit: "%", defaultValue: 75, description: "0 turns waves off." },
            speed: { type: ControlType.Number, title: "Speed", min: 0, max: 100, step: 5, unit: "%", defaultValue: 40 },
        },
    },
    pointer: {
        type: ControlType.Object,
        title: "Pointer",
        buttonTitle: "Opening",
        controls: {
            opening: { type: ControlType.Number, title: "Opening", min: 0, max: 160, step: 5, unit: "px", defaultValue: 70, description: "Free space under the pointer. 0 for none." },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        buttonTitle: "Intro & More",
        controls: {
            intro: { type: ControlType.Boolean, title: "Intro", defaultValue: true, description: "One wave from the middle the first time it comes into view." },
            breathing: { type: ControlType.Boolean, title: "Breathing", defaultValue: true, description: "A slow swell while nothing happens." },
            scroll: { type: ControlType.Boolean, title: "Scroll", defaultValue: true, description: "Lags behind fast scrolling and swings out." },
        },
    },
})
