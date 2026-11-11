/*
 * Dotmark v1.0.2, a Framer code component by KOJA Studios.
 *
 * A wordmark set in halftone dots: the dot size follows the letters, the dots spring out of the pointer's way and a
 * swirl stirs the grid. WebGL with a 2D fallback, a still picture for the server, the editor and static export.
 */
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useRef, useState } from "react"
import type { CSSProperties } from "react"

// ------------------------------------------------------------------ types and defaults

type Mode = "always" | "hold" | "off"
type Shape = "dots" | "lines"
type FontValue = { fontFamily?: string; fontWeight?: number | string; fontStyle?: string; letterSpacing?: string | number } | null | undefined
type SwirlGroup = { mode?: Mode; strength?: number }

interface Props {
    word?: string
    fonts?: { font?: FontValue }
    colors?: { dots?: string }
    dots?: { size?: number; spacing?: number }
    swirl?: SwirlGroup
    advanced?: { shape?: Shape; angle?: number; fade?: number; radius?: number }
    /** Layout from Framer (size, position). Passed to the root unchanged, never read for design. */
    style?: CSSProperties
}

/** everything the drawing needs, cleaned up; compared field by field when a prop changes */
interface Look {
    word: string
    family: string
    weight: string
    italic: string
    track: string
    ink: string
    dot: number
    gap: number
    mode: Mode
    strength: number
    shape: Shape
    angle: number
    fade: number
    radius: number
}

const D = { word: "KOJA", ink: "#000000", size: 6, spacing: 1, mode: "always" as Mode, strength: 80, shape: "dots" as Shape, angle: 0, fade: 0, radius: 90 }
const SYSTEM_FONT = `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
const MAX_CHARS = 40
/** a swirl every 110 ms while held or (Always) while the pointer is over the mark, like fast clicking */
const HOLD_MS = 110
/** the chosen font gets 3 s, then the fallback font (FP-4) */
const FONT_MS = 3000
const FONT_RETRY_MS = 250
const RESIZE_MS = 150
const MAX_DOTS = 40000
/** read by screen readers, invisible on the page */
const SR_ONLY: CSSProperties = { position: "absolute", width: 1, height: 1, margin: -1, padding: 0, border: 0, overflow: "hidden", clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap", pointerEvents: "none" }
/** the word reads bottom to top once the area is this much taller than wide */
const TURN_RATIO = 1.5
/** Size is an upper limit: at least this many rows of dots across the letters, so small marks stay readable */
const MIN_ROWS = 12
/** the 2D fallback moves up to this many dots, above it draws one still frame */
const MAX_DOTS_2D = 8000
/** drift on touch screens: starts 2.5 s after the last touch, pauses 20 s after it */
const DRIFT_AFTER = 2500
const DRIFT_UNTIL = 20000
/** evasion: every dot is a damped spring (frequency in Hz, damping ratio), pushed by a field around the pointer */
const EVADE_HZ = 2
const EVADE_DAMPING = 0.4
/** push at the centre of the field and pull along the pointer's way, per frame at 60 Hz */
const EVADE_PUSH = 2.2
const EVADE_PULL = 0.16
/** the fixed grain of the ink, as a share of full brightness */
const GRAIN = 0.055
/** room around the mark where swirling dots may go (the canvas reaches this far beyond the frame) */
const BLEED = 72
/** a dot moves freely up to this share of its room towards an edge, then eases out and never reaches it */
const EASE_FROM = 0.6

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const ease = (t: number) => t * t * (3 - 2 * t)
/** an offset towards an edge with this much room: unchanged up to EASE_FROM of the room, then eased, never reaching it */
function easeOut(v: number, room: number): number {
    const a = Math.abs(v)
    const k = room * EASE_FROM
    if (a <= k) return v
    if (room <= 0.01) return 0
    const out = k + (room - k) * Math.tanh((a - k) / (room - k))
    return v < 0 ? -out : out
}
const num = (v: unknown, min: number, max: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? clamp(v, min, max) : d)
const message = (e: unknown) => (e instanceof Error ? e.message : String(e))
const pick = <T extends string>(v: unknown, options: readonly T[], d: T): T => (options.includes(v as T) ? (v as T) : d)

/** trimmed, line breaks to spaces, at most 40 characters cut at a word end (a CMS field may bring anything) */
function cleanWord(w: unknown): string {
    if (typeof w !== "string") return ""
    const chars = Array.from(w.replace(/\s+/g, " ").trim())
    if (chars.length <= MAX_CHARS) return chars.join("")
    // too long: cut at the last word end that fits, a single long word at 40 characters
    const cut = chars.slice(0, MAX_CHARS + 1).lastIndexOf(" ")
    return chars.slice(0, cut > 0 ? cut : MAX_CHARS).join("").trim()
}

function toLook(p: Props): Look {
    const font = p.fonts && typeof p.fonts === "object" ? p.fonts.font : undefined
    const family = font && typeof font.fontFamily === "string" ? font.fontFamily.trim() : ""
    const w = font ? font.fontWeight : undefined
    const weight = typeof w === "number" && Number.isFinite(w) ? String(clamp(Math.round(w), 1, 1000)) : typeof w === "string" && /^(\d{3}|normal|bold)$/.test(w) ? w : family ? "400" : "800"
    const italic = font && typeof font.fontStyle === "string" && /italic|oblique/i.test(font.fontStyle) ? "italic" : "normal"
    const ls = font ? font.letterSpacing : undefined
    const track = typeof ls === "number" && Number.isFinite(ls) ? `${ls}px` : typeof ls === "string" && /^-?\d*\.?\d+(px|em)$/.test(ls.trim()) ? ls.trim() : ""
    const c = p.colors && typeof p.colors === "object" ? p.colors.dots : undefined
    const dots = p.dots && typeof p.dots === "object" ? p.dots : {}
    const sw = p.swirl && typeof p.swirl === "object" ? p.swirl : {}
    const adv = p.advanced && typeof p.advanced === "object" ? p.advanced : {}
    return {
        word: cleanWord(p.word === undefined ? D.word : p.word),
        family: family || SYSTEM_FONT,
        weight,
        italic,
        track,
        ink: typeof c === "string" && c.trim() ? c.trim() : D.ink,
        dot: Math.round(num(dots.size, 2, 16, D.size)),
        gap: Math.round(num(dots.spacing, 0, 10, D.spacing)),
        mode: pick(sw.mode, ["always", "hold", "off"] as const, D.mode),
        strength: num(sw.strength, 5, 100, D.strength) / 100,
        shape: pick(adv.shape, ["dots", "lines"] as const, D.shape),
        angle: num(adv.angle, 0, 90, D.angle),
        fade: num(adv.fade, 0, 100, D.fade) / 100,
        radius: num(adv.radius, 40, 200, D.radius),
    }
}

// ------------------------------------------------------------------ color

type RGBA = [number, number, number, number]

/**
 * Any CSS color from Framer's Color control (also a color style as var(--token-…), with alpha, oklch or Display P3) as
 * sRGB: the browser resolves the variable on a hidden element, a 1 × 1 canvas brings the color to sRGB. Unknown: black.
 */
function resolveInk(input: string, host: HTMLElement): RGBA {
    const probe = document.createElement("span")
    probe.style.color = input
    if (!probe.style.color) return [0, 0, 0, 1]
    probe.style.display = "none"
    host.appendChild(probe)
    const css = window.getComputedStyle(probe).color
    probe.remove()
    const c = document.createElement("canvas")
    c.width = 1
    c.height = 1
    const x = c.getContext("2d", { willReadFrequently: true })
    if (!x) return [0, 0, 0, 1]
    x.fillStyle = "#000"
    x.fillStyle = css
    x.fillRect(0, 0, 1, 1)
    const d = x.getImageData(0, 0, 1, 1).data
    return [d[0] / 255, d[1] / 255, d[2] / 255, d[3] / 255]
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
/** the ink goes to the shader in OKLab */
function oklab(r: number, g: number, b: number): [number, number, number] {
    r = toLinear(r)
    g = toLinear(g)
    b = toLinear(b)
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}

// ------------------------------------------------------------------ shaders

const VS = `
precision highp float;
attribute vec3 aHome;
attribute vec2 aOff;
attribute vec3 aForm;
uniform vec2 uView;
uniform vec2 uOrigin;
uniform float uSprite;
uniform float uDpr;
varying float vSize;
varying vec2 vStretch;
void main() {
  vec2 p = aHome.xy + aOff + uOrigin;
  vec2 c = p / uView * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
  gl_PointSize = uSprite * uDpr;
  vSize = aHome.z * aForm.z;
  vStretch = aForm.xy;
}`

const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying float vSize;
varying vec2 vStretch;
uniform float uSprite;
uniform float uDpr;
uniform float uPitch;
uniform vec2 uRot;
uniform float uShape;
uniform vec3 uInk;
uniform float uAlpha;
uniform float uGrain;
vec3 labToLinear(vec3 c) {
  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  float l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 toSrgb(vec3 x) { x = clamp(x, 0.0, 1.0); return mix(12.92 * x, 1.055 * pow(x, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, x)); }
// grain: two steps along irrational directions, folded into each other (uniform, no visible pattern at pixel scale)
float grain(vec2 p) {
  float a = fract(dot(p, vec2(0.7548777, 0.5698403)));
  float b = fract(dot(p.yx + a, vec2(0.4142136, 0.7320508)) * 13.0);
  return fract(a * 31.17 + b * b * 47.53);
}
void main() {
  if (vSize < 0.05) discard;
  vec2 q = (gl_PointCoord - 0.5) * uSprite;
  float d;
  if (uShape < 0.5) {
    float s = length(vStretch);
    if (s > 0.02) {
      vec2 dir = vStretch / s;
      float r = vSize / sqrt(1.0 + s * 0.9);
      float L = r * s * 0.9;
      float t = clamp(dot(q, dir), -L, L);
      d = length(q - dir * t) - r;
    } else d = length(q) - vSize;
  } else {
    vec2 g = vec2(uRot.x * q.x + uRot.y * q.y, -uRot.y * q.x + uRot.x * q.y);
    d = max(abs(g.y) - vSize, abs(g.x) - uPitch * 0.5 - 0.35);
  }
  float aa = 0.75 / uDpr;
  float a = (1.0 - smoothstep(-aa, aa, d)) * uAlpha;
  if (a <= 0.004) discard;
  vec3 col = toSrgb(labToLinear(uInk));
  float n = grain(floor(gl_FragCoord.xy / max(1.0, uDpr * 0.75))) - 0.5;
  col = clamp(col + n * uGrain, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`

// ------------------------------------------------------------------ engine

interface Hooks {
    /** true once the live picture stands (the still goes), false while it cannot (context lost) */
    drawn: (on: boolean) => void
    /** an unexpected error: visitors keep the still, the editor canvas names the reason (FP-8) */
    fault: (reason: string) => void
}

interface Gl {
    gl: WebGLRenderingContext
    prog: WebGLProgram
    u: Record<string, WebGLUniformLocation | null>
    aHome: number
    aOff: number
    aForm: number
    bHome: WebGLBuffer
    bOff: WebGLBuffer
    bForm: WebGLBuffer
    maxPoint: number
}

type Stir = { x: number; y: number; t: number; dir: number }
type Source = [number, number, number, number, number, number]

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s
    gl.deleteShader(s)
    return null
}

/** the program and buffers on a context; null when the device rejects a shader (then the 2D fallback draws) */
function makeGl(gl: WebGLRenderingContext): Gl | null {
    const vs = compile(gl, gl.VERTEX_SHADER, VS)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS)
    const prog = gl.createProgram()
    if (!vs || !fs || !prog) return null
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
    const u: Record<string, WebGLUniformLocation | null> = {}
    const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(prog, i)
        if (info) u[info.name] = gl.getUniformLocation(prog, info.name)
    }
    const bHome = gl.createBuffer()
    const bOff = gl.createBuffer()
    const bForm = gl.createBuffer()
    if (!bHome || !bOff || !bForm) return null
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null
    return {
        gl,
        prog,
        u,
        aHome: gl.getAttribLocation(prog, "aHome"),
        aOff: gl.getAttribLocation(prog, "aOff"),
        aForm: gl.getAttribLocation(prog, "aForm"),
        bHome,
        bOff,
        bForm,
        maxPoint: range && range[1] > 1 ? range[1] : 64,
    }
}

/**
 * One mark: measures the word into a grid of dots, moves them (pointer, swirl, drift) and draws them with WebGL,
 * or with a 2D canvas where WebGL is missing and in the editor. Exactly one animation loop: while a frame runs, only
 * the frame itself asks for the next one.
 */
class Mark {
    private root: HTMLElement
    private layer: HTMLElement
    private o: Look
    private editor: boolean
    private hooks: Hooks
    private canvas: HTMLCanvasElement
    private g3: Gl | null = null
    private ctx: CanvasRenderingContext2D | null = null
    private maskCanvas: HTMLCanvasElement | null = null
    private dead = false
    private lost = false
    private shown = false
    private measured = false

    private W = 0
    private H = 0
    private dpr = 1
    private vertical = false
    private g = 7
    private dot = 6
    private n = 0
    private box: [number, number, number, number] = [0, 0, 1, 1]
    private rot: [number, number] = [1, 0]
    private home = new Float32Array(0)
    private ox = new Float32Array(0)
    private oy = new Float32Array(0)
    private vx = new Float32Array(0)
    private vy = new Float32Array(0)
    private wx = new Float32Array(0)
    private wy = new Float32Array(0)
    private wvx = new Float32Array(0)
    private wvy = new Float32Array(0)
    private sx = new Float32Array(0)
    private sy = new Float32Array(0)
    private off = new Float32Array(0)
    private form = new Float32Array(0)

    /** overhang of the canvas, and per dot the room to the nearest clip edge on each side (left, right, top, bottom) */
    private bleed = 0
    private room = new Float32Array(0)
    private ink: RGBA = [0, 0, 0, 1]
    private inkLab: [number, number, number] = [0, 0, 0]

    private raf = 0
    private inFrame = false
    private dirty = false
    private last = 0
    private inView = false
    private seen = false
    private ptr = { x: 0, y: 0, vx: 0, vy: 0, t: 0, on: false }
    private down: { x: number; y: number; t: number; moved: boolean; held: boolean } | null = null
    private holding = false
    private lastHold = 0
    private lastAuto = 0
    private lastReal = 0
    private lastTouch = -1e9
    private stirs: Stir[] = []
    private drift = { on: 0, t: 0, px: NaN, py: NaN }

    private fontToken = 0
    private fontDone = 0
    private fontLimit = 0
    private fontRetry = 0
    private resizeT = 0
    private idleT = 0
    private longT = 0

    private ro: ResizeObserver | null = null
    private io: IntersectionObserver | null = null
    private mqReduce: MediaQueryList | null = null
    private mqHover: MediaQueryList | null = null
    private mqScheme: MediaQueryList | null = null

    constructor(root: HTMLElement, layer: HTMLElement, look: Look, editor: boolean, hooks: Hooks) {
        this.root = root
        this.layer = layer
        this.o = look
        this.editor = editor
        this.hooks = hooks
        this.drift.t = 7
        // the editor holds still: no overhang there
        this.bleed = editor ? 0 : BLEED
        this.canvas = this.makeCanvas()
        if (!editor) this.startGl()
        if (!this.g3) this.start2d()
        this.readInk()
        this.bind()
        this.loadFont()
    }

    // ------------------------------------------------------------ setup

    private makeCanvas(): HTMLCanvasElement {
        const c = document.createElement("canvas")
        c.setAttribute("aria-hidden", "true")
        // placed with its overhang from the start: moving it later would count as a layout shift
        const B = this.bleed
        Object.assign(c.style, { position: "absolute", left: `${-B}px`, top: `${-B}px`, width: `calc(100% + ${2 * B}px)`, height: `calc(100% + ${2 * B}px)`, display: "block", pointerEvents: "none" })
        this.layer.appendChild(c)
        return c
    }

    private startGl(): void {
        const gl = this.canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false })
        if (!gl) return
        const g3 = makeGl(gl)
        if (g3) {
            this.g3 = g3
            this.canvas.addEventListener("webglcontextlost", this.onLost)
            this.canvas.addEventListener("webglcontextrestored", this.onRestored)
            return
        }
        // a shader the device rejects: this canvas is bound to WebGL now, so the 2D fallback gets a fresh one
        gl.getExtension("WEBGL_lose_context")?.loseContext()
        this.canvas.remove()
        this.canvas = this.makeCanvas()
    }

    private start2d(): void {
        this.ctx = this.canvas.getContext("2d")
        if (!this.ctx) this.report("no 2D canvas")
    }

    private onLost = (e: Event) => {
        // the browser may give the context back; until then the still stands
        e.preventDefault()
        this.lost = true
        cancelAnimationFrame(this.raf)
        this.raf = 0
        this.show(false)
    }

    private onRestored = () => {
        if (this.dead || !this.g3) return
        const g3 = makeGl(this.g3.gl)
        if (!g3) {
            this.report("WebGL came back without its shader")
            return
        }
        this.g3 = g3
        this.lost = false
        this.upload()
        this.wake(true)
    }

    private report(reason: string): void {
        if (this.dead) return
        this.stop()
        this.hooks.fault(reason)
    }

    private show(on: boolean): void {
        if (this.shown === on) return
        this.shown = on
        this.hooks.drawn(on)
    }

    private get calm(): boolean {
        return !!this.mqReduce && this.mqReduce.matches
    }

    // ------------------------------------------------------------ settings

    set(next: Look): void {
        const prev = this.o
        this.o = next
        if (this.dead) return
        const font = prev.word !== next.word || prev.family !== next.family || prev.weight !== next.weight || prev.italic !== next.italic || prev.track !== next.track
        const geo = prev.dot !== next.dot || prev.gap !== next.gap || prev.shape !== next.shape || prev.angle !== next.angle || prev.fade !== next.fade
        if (prev.ink !== next.ink) this.readInk()
        if (prev.mode !== next.mode) {
            this.stirs = []
            this.holding = false
        }
        if (font) this.loadFont()
        else if (geo) this.measure()
        else this.wake(true)
    }

    private readInk(): void {
        const c = resolveInk(this.o.ink, this.root)
        this.ink = c
        this.inkLab = oklab(c[0], c[1], c[2])
    }

    private fontAt(px: number): string {
        const o = this.o
        return `${o.italic} ${o.weight} ${px}px ${o.family}`
    }

    private trackAt(x: CanvasRenderingContext2D, px: number): void {
        const t = this.o.track
        if (!t || !("letterSpacing" in x)) return
        const v = parseFloat(t)
        const spacing = t.endsWith("em") ? v * px : v
        ;(x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Number.isFinite(spacing) ? spacing : 0}px`
    }

    /**
     * Measures as soon as the chosen font is there, at most after 3 s (then the fallback font, FP-4). The promise keeps
     * running: a font that comes later is measured once more, no listener. An empty answer means a system font or a
     * font not announced yet (right after choosing it in the editor): measured at once, then asked again every 250 ms
     * until the time limit.
     */
    private loadFont(): void {
        const token = ++this.fontToken
        clearTimeout(this.fontLimit)
        clearTimeout(this.fontRetry)
        const fonts = typeof document !== "undefined" ? document.fonts : undefined
        if (!this.o.word || !fonts || typeof fonts.load !== "function") {
            this.measure()
            this.fontDone = token
            return
        }
        const spec = this.fontAt(100)
        const text = this.o.word
        const until = performance.now() + FONT_MS
        const first = () => {
            if (token !== this.fontToken || this.dead || this.fontDone === token) return
            this.fontDone = token
            this.measure()
        }
        const ask = () => {
            if (token !== this.fontToken || this.dead) return
            fonts.load(spec, text).then(
                (faces) => {
                    if (token !== this.fontToken || this.dead) return
                    if (faces.length > 0) {
                        clearTimeout(this.fontLimit)
                        clearTimeout(this.fontRetry)
                        this.fontDone = token
                        this.measure()
                        return
                    }
                    first()
                    if (performance.now() < until) this.fontRetry = window.setTimeout(ask, FONT_RETRY_MS)
                },
                (e: unknown) => {
                    if (token !== this.fontToken || this.dead) return
                    // a font string the browser cannot read is expected (fallback font); anything else is reported
                    if (!(e instanceof DOMException || e instanceof TypeError)) {
                        this.report(message(e))
                        return
                    }
                    first()
                },
            )
        }
        this.fontLimit = window.setTimeout(first, FONT_MS)
        ask()
    }

    // ------------------------------------------------------------ measuring the word into dots

    private measure(): void {
        if (this.dead) return
        try {
            this.layout()
        } catch (e) {
            this.report(message(e))
        }
    }

    private layout(): void {
        const root = this.root
        const W = (this.W = Math.max(1, Math.round(root.offsetWidth)))
        const H = (this.H = Math.max(1, Math.round(root.offsetHeight)))
        // vertical only when clearly taller than wide, so a height kept from desktop does not turn the word on phones
        this.vertical = H > W * TURN_RATIO
        this.dpr = Math.min(window.devicePixelRatio || 1, 2)
        const B = this.bleed
        const cw = Math.max(1, Math.round((W + 2 * B) * this.dpr))
        const ch = Math.max(1, Math.round((H + 2 * B) * this.dpr))
        if (this.canvas.width !== cw) this.canvas.width = cw
        if (this.canvas.height !== ch) this.canvas.height = ch
        this.measured = true
        const o = this.o
        let dot = o.dot
        let g = Math.max(2.5, o.dot + o.gap)
        const m = o.word ? this.mask(W, H, g) : null
        let home: number[] = []
        if (m) {
            this.box = m.box
            // small marks: dot size and spacing shrink together until the letters hold 12 rows (Size is the upper limit)
            const cap = Math.max(2.5, m.thick / MIN_ROWS)
            if (g > cap) {
                dot *= cap / g
                g = cap
            }
            // more than 40,000 dots: size and spacing grow together, the look stays
            const est = m.area / (g * g)
            if (est > MAX_DOTS * 0.9) {
                const f = Math.sqrt(est / (MAX_DOTS * 0.9))
                dot *= f
                g = Math.max(2.5, g * f)
            }
            home = this.grid(m, dot, g)
            if (home.length / 3 > MAX_DOTS) {
                const f = Math.sqrt(home.length / 3 / MAX_DOTS) * 1.03
                dot *= f
                g *= f
                home = this.grid(m, dot, g)
            }
        } else this.box = [0, 0, W, H]
        this.g = g
        this.dot = dot
        const n = (this.n = home.length / 3)
        this.home = new Float32Array(home)
        this.ox = new Float32Array(n)
        this.oy = new Float32Array(n)
        this.vx = new Float32Array(n)
        this.vy = new Float32Array(n)
        this.wx = new Float32Array(n)
        this.wy = new Float32Array(n)
        this.wvx = new Float32Array(n)
        this.wvy = new Float32Array(n)
        this.sx = new Float32Array(n)
        this.sy = new Float32Array(n)
        this.off = new Float32Array(n * 2)
        this.form = new Float32Array(n * 3)
        for (let i = 0; i < n; i++) this.form[i * 3 + 2] = 1
        this.room = new Float32Array(n * 4)
        this.updateClip()
        this.stirs = []
        this.upload()
        this.wake(true)
    }

    /** the word in black on a mask the size of the area (half resolution above 2 million pixels) */
    private mask(W: number, H: number, g: number): { a: Uint8Array; mw: number; mh: number; s: number; box: [number, number, number, number]; area: number; thick: number } | null {
        const s = W * H > 2e6 ? 0.5 : 1
        const mw = Math.max(1, Math.round(W * s))
        const mh = Math.max(1, Math.round(H * s))
        const c = this.maskCanvas || (this.maskCanvas = document.createElement("canvas"))
        c.width = mw
        c.height = mh
        const x = c.getContext("2d", { willReadFrequently: true })
        if (!x) {
            this.report("no 2D canvas")
            return null
        }
        const o = this.o
        const vertical = this.vertical
        // along the word: length; across: thickness. Vertical reads bottom to top.
        const Lw = vertical ? H : W
        const Lh = vertical ? W : H
        const air = clamp(Lw * 0.05, 16, 48)
        const pad = Math.max(8, g * 1.5)
        const availW = Math.max(4, Lw - 2 * air)
        const availH = Math.max(4, Lh - 2 * pad)
        x.setTransform(s, 0, 0, s, 0, 0)
        if (vertical) {
            x.translate(W / 2, H / 2)
            x.rotate(-Math.PI / 2)
            x.translate(-Lw / 2, -Lh / 2)
        }
        x.font = this.fontAt(100)
        this.trackAt(x, 100)
        const t = x.measureText(o.word)
        const left = t.actualBoundingBoxLeft || 0
        const right = t.actualBoundingBoxRight || t.width
        const inkW = Math.max(1, left + right)
        // ink box with ascenders and descenders: g, j, p, y and accents stay whole
        const asc = t.actualBoundingBoxAscent || 72
        const desc = t.actualBoundingBoxDescent || 0
        const inkH = Math.max(1, asc + desc)
        const k = Math.min(availW / inkW, availH / inkH)
        x.font = this.fontAt(100 * k)
        this.trackAt(x, 100 * k)
        x.fillStyle = "#000"
        x.textBaseline = "alphabetic"
        x.fillText(o.word, (Lw - inkW * k) / 2 + left * k, (Lh - inkH * k) / 2 + asc * k)
        const d = x.getImageData(0, 0, mw, mh).data
        const a = new Uint8Array(mw * mh)
        for (let i = 3, j = 0; j < a.length; i += 4, j++) a[j] = d[i]
        let x0 = mw
        let x1 = -1
        let y0 = mh
        let y1 = -1
        let sum = 0
        for (let y = 0; y < mh; y += 2) {
            const row = y * mw
            for (let xx = 0; xx < mw; xx += 2) {
                const v = a[row + xx]
                if (v > 8) {
                    sum += v
                    if (xx < x0) x0 = xx
                    if (xx > x1) x1 = xx
                    if (y < y0) y0 = y
                    if (y > y1) y1 = y
                }
            }
        }
        if (x1 < 0) return null
        const box: [number, number, number, number] = [x0 / s, y0 / s, (x1 + 1) / s, (y1 + 1) / s]
        return { a, mw, mh, s, box, area: (sum / 255) * (4 / (s * s)), thick: inkH * k }
    }

    /** dots on a grid turned by Angle: coverage per cell, the square root of it as the radius (lines: the coverage) */
    private grid(m: { a: Uint8Array; mw: number; mh: number; s: number; box: [number, number, number, number] }, dot: number, g: number): number[] {
        const o = this.o
        const { a, mw, mh, s } = m
        const ang = (o.angle * Math.PI) / 180
        const c = Math.cos(ang)
        const sn = Math.sin(ang)
        this.rot = [c, sn]
        const home: number[] = []
        const x0 = m.box[0] - g
        const x1 = m.box[2] + g
        const y0 = m.box[1] - g
        const y1 = m.box[3] + g
        const ox = this.W / 2
        const oy = this.H
        let iMin = Infinity
        let iMax = -Infinity
        let jMin = Infinity
        let jMax = -Infinity
        for (const [px, py] of [
            [x0, y0],
            [x1, y0],
            [x0, y1],
            [x1, y1],
        ]) {
            const dx = px - ox
            const dy = py - oy
            const i = (dx * c + dy * sn) / g
            const j = (-dx * sn + dy * c) / g
            iMin = Math.min(iMin, i)
            iMax = Math.max(iMax, i)
            jMin = Math.min(jMin, j)
            jMax = Math.max(jMax, j)
        }
        const SS = 4
        const top = m.box[1]
        const span = Math.max(1, m.box[3] - top)
        for (let j = Math.floor(jMin) - 1; j <= Math.ceil(jMax) + 1; j++) {
            for (let i = Math.floor(iMin) - 1; i <= Math.ceil(iMax) + 1; i++) {
                const px = ox + (i + 0.5) * g * c - (j + 0.5) * g * sn
                const py = oy + (i + 0.5) * g * sn + (j + 0.5) * g * c
                if (px < x0 || px > x1 || py < y0 || py > y1) continue
                let sum = 0
                for (let sy = 0; sy < SS; sy++) {
                    const fv = ((sy + 0.5) / SS - 0.5) * g
                    for (let sx = 0; sx < SS; sx++) {
                        const fu = ((sx + 0.5) / SS - 0.5) * g
                        const qx = ((px + fu * c - fv * sn) * s) | 0
                        const qy = ((py + fu * sn + fv * c) * s) | 0
                        if (qx >= 0 && qy >= 0 && qx < mw && qy < mh) sum += a[qy * mw + qx]
                    }
                }
                const cov = sum / (SS * SS * 255)
                if (cov < 0.04) continue
                const yN = clamp((py - top) / span, 0, 1)
                const tone = cov * (1 - o.fade * Math.pow(1 - yN, 1.15))
                if (tone < 0.035) continue
                // dot: full diameter = Size; line: full thickness = Size
                home.push(px, py, o.shape === "lines" ? (tone * dot) / 2 : (Math.sqrt(tone) * dot) / 2)
            }
        }
        return home
    }

    /**
     * Where dots may go: the canvas with its overhang, cut down to every frame around the mark that clips (overflow other
     * than visible, or paint containment), such as a buyer's frame with Clip on. Per dot the room to that edge on each
     * side, minus the dot's own reach, so no dot is ever cut. Read when measuring and when motion starts from rest.
     */
    private updateClip(): void {
        const W = this.W
        const H = this.H
        const B = this.bleed
        let l = -B
        let t = -B
        let r = W + B
        let b = H + B
        if (B > 0) {
            const box = this.root.getBoundingClientRect()
            const sx = box.width > 0 ? W / box.width : 1
            const sy = box.height > 0 ? H / box.height : 1
            for (let el = this.root.parentElement; el; el = el.parentElement) {
                const cs = window.getComputedStyle(el)
                const paint = /paint|strict|content/.test(cs.contain || "")
                const cx = paint || cs.overflowX !== "visible"
                const cy = paint || cs.overflowY !== "visible"
                if (!cx && !cy) continue
                const e = el.getBoundingClientRect()
                if (cx) {
                    l = Math.max(l, (e.left - box.left) * sx)
                    r = Math.min(r, (e.right - box.left) * sx)
                }
                if (cy) {
                    t = Math.max(t, (e.top - box.top) * sy)
                    b = Math.min(b, (e.bottom - box.top) * sy)
                }
            }
        }
        const H3 = this.home
        const R = this.room
        const lines = this.o.shape === "lines"
        for (let i = 0; i < this.n; i++) {
            const size = H3[i * 3 + 2]
            // how far the drawn dot reaches beyond its centre: a stretched capsule, or half a line, plus the soft edge
            const reach = (lines ? Math.max(this.g * 0.5 + 0.35, size) : size * 1.35) + 1
            const hx = H3[i * 3]
            const hy = H3[i * 3 + 1]
            R[i * 4] = Math.max(0, hx - reach - l)
            R[i * 4 + 1] = Math.max(0, r - reach - hx)
            R[i * 4 + 2] = Math.max(0, hy - reach - t)
            R[i * 4 + 3] = Math.max(0, b - reach - hy)
        }
    }

    private upload(): void {
        const g3 = this.g3
        if (!g3 || this.lost) return
        const gl = g3.gl
        gl.bindBuffer(gl.ARRAY_BUFFER, g3.bHome)
        gl.bufferData(gl.ARRAY_BUFFER, this.home, gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, g3.bOff)
        gl.bufferData(gl.ARRAY_BUFFER, this.off, gl.DYNAMIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, g3.bForm)
        gl.bufferData(gl.ARRAY_BUFFER, this.form, gl.DYNAMIC_DRAW)
    }

    // ------------------------------------------------------------ input

    private bind(): void {
        const root = this.root
        if (typeof ResizeObserver !== "undefined") {
            this.ro = new ResizeObserver(this.onResize)
            this.ro.observe(root)
        }
        // the editor canvas gets one still frame and follows the size, nothing else
        if (this.editor) {
            this.inView = true
            return
        }
        // two system settings, read only: calm mode, and color styles with a dark value (they fire only when a setting
        // changes)
        this.mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)")
        this.mqHover = window.matchMedia("(hover: none)")
        this.mqScheme = window.matchMedia("(prefers-color-scheme: dark)")
        this.mqReduce.addEventListener("change", this.onReduce)
        this.mqScheme.addEventListener("change", this.onScheme)
        // the pointer listeners sit on the mark itself and only read (the context menu after a long press is the mark's
        // own); nothing on window or document. The swirl is decoration without a function: no button, no role, no tab stop.
        root.addEventListener("pointermove", this.onMove, { passive: true })
        root.addEventListener("pointerleave", this.onLeave, { passive: true })
        root.addEventListener("pointerdown", this.onDown, { passive: true })
        root.addEventListener("pointerup", this.onUp, { passive: true })
        root.addEventListener("pointercancel", this.onCancel, { passive: true })
        root.addEventListener("contextmenu", this.onMenu)
        if (typeof IntersectionObserver !== "undefined") {
            this.io = new IntersectionObserver(this.onIntersect)
            this.io.observe(root)
        } else this.enterView(true)
    }

    private onIntersect = (entries: IntersectionObserverEntry[]) => {
        const e = entries[entries.length - 1]
        this.enterView(e ? e.isIntersecting : true)
    }

    private enterView(on: boolean): void {
        this.inView = on
        if (on) {
            // the drift clock starts when the mark is first seen, not at page load (a footer comes late)
            if (!this.seen) {
                this.seen = true
                this.lastReal = performance.now()
            }
            // mounted hidden (display: none) and shown now: measure at once instead of after the resize pause
            if (this.measured && (Math.round(this.root.offsetWidth) !== this.W || Math.round(this.root.offsetHeight) !== this.H)) {
                clearTimeout(this.resizeT)
                this.measure()
            }
            this.wake(true)
        } else {
            cancelAnimationFrame(this.raf)
            this.raf = 0
            this.endPress()
            this.ptr.on = false
        }
    }

    private onResize = () => {
        if (!this.measured || this.dead) return
        const W = Math.round(this.root.offsetWidth)
        const H = Math.round(this.root.offsetHeight)
        if (W === this.W && H === this.H) return
        // measured once the size rests; until then the last picture stretches
        clearTimeout(this.resizeT)
        this.resizeT = window.setTimeout(() => this.measure(), RESIZE_MS)
    }

    private onReduce = () => {
        // calm on: everything goes home at once; calm off: dots back to full size
        const n = this.n
        this.ox.fill(0)
        this.oy.fill(0)
        this.vx.fill(0)
        this.vy.fill(0)
        this.wx.fill(0)
        this.wy.fill(0)
        this.wvx.fill(0)
        this.wvy.fill(0)
        this.sx.fill(0)
        this.sy.fill(0)
        this.off.fill(0)
        for (let i = 0; i < n; i++) {
            this.form[i * 3] = 0
            this.form[i * 3 + 1] = 0
            this.form[i * 3 + 2] = 1
        }
        this.stirs = []
        this.holding = false
        this.wake(true)
    }

    private onScheme = () => {
        // a color style with a dark value changes with the system
        this.readInk()
        this.wake(true)
    }

    private local(e: PointerEvent): [number, number] {
        const r = this.root.getBoundingClientRect()
        const sx = r.width > 0 ? this.W / r.width : 1
        const sy = r.height > 0 ? this.H / r.height : 1
        return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy]
    }

    /** inside a link a click navigates and stirs nothing; the dots still move out of the way */
    private linked(): boolean {
        return !!this.root.closest("a, button")
    }

    private onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch" && !this.down) return
        // the release got lost (focus left the window while pressed): no button down means no hold
        if (e.pointerType === "mouse" && e.buttons === 0 && this.holding) this.endPress()
        const [x, y] = this.local(e)
        const p = this.ptr
        const t = performance.now()
        if (p.on) {
            const dtp = Math.max(8, t - (p.t || t))
            p.vx = p.vx * 0.5 + ((x - p.x) / dtp) * 16.67 * 0.5
            p.vy = p.vy * 0.5 + ((y - p.y) / dtp) * 16.67 * 0.5
        } else {
            p.vx = 0
            p.vy = 0
        }
        p.t = t
        p.x = x
        p.y = y
        p.on = true
        if (this.down && Math.hypot(x - this.down.x, y - this.down.y) > 12) this.down.moved = true
        this.lastReal = t
        if (e.pointerType === "touch") this.lastTouch = t
        this.wake()
    }

    private onLeave = (e: PointerEvent) => {
        if (e.pointerType === "touch" && this.down) return
        // a mouse or pen hold ends at the edge: the release outside the mark is not ours to hear
        if (e.pointerType !== "touch") this.endPress()
        this.ptr.on = false
        this.wake()
    }

    private onMenu = (e: Event) => {
        // a long press that swirls would open the menu as well; with Off, in calm mode and inside the buyer's link it stays
        if (performance.now() - this.lastTouch < 1500 && this.o.mode !== "off" && !this.calm && !this.linked()) e.preventDefault()
    }

    private onDown = (e: PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return
        const t = performance.now()
        this.lastReal = t
        const [x, y] = this.local(e)
        const canStir = this.o.mode !== "off" && !this.calm && !this.linked()
        if (e.pointerType === "touch") {
            this.lastTouch = t
            this.down = { x, y, t, moved: false, held: false }
            const p = this.ptr
            p.x = x
            p.y = y
            p.vx = 0
            p.vy = 0
            p.t = t
            p.on = true
            clearTimeout(this.longT)
            // a long press repeats the swirl, like fast tapping
            if (canStir)
                this.longT = window.setTimeout(() => {
                    if (!this.down || this.down.moved) return
                    this.down.held = true
                    this.holding = true
                    this.lastHold = performance.now()
                    this.wake()
                }, 280)
            this.wake()
            return
        }
        if (!canStir) return
        this.stir(x, y, t)
        this.holding = true
        this.lastHold = t
        this.wake()
    }

    private onUp = (e: PointerEvent) => {
        const d = this.down
        this.endPress()
        if (!d || e.pointerType !== "touch") return
        const t = performance.now()
        this.lastTouch = t
        // a tap counts on release: short and without travel
        if (!d.moved && !d.held && t - d.t < 320 && !this.linked()) {
            const [x, y] = this.local(e)
            this.stir(x, y, t)
        }
        this.ptr.on = false
        this.wake()
    }

    private onCancel = (e: PointerEvent) => {
        this.endPress()
        if (e.pointerType === "touch") this.ptr.on = false
        this.wake()
    }

    private endPress(): void {
        clearTimeout(this.longT)
        this.holding = false
        this.down = null
    }

    private stir(x: number, y: number, now: number): void {
        if (this.o.mode === "off" || this.calm) return
        // the turn alternates, at most three swirls at once
        this.stirs.push({ x, y, t: now, dir: this.stirs.length % 2 ? -1 : 1 })
        if (this.stirs.length > 3) this.stirs.shift()
        this.lastReal = now
        this.wake()
    }

    // ------------------------------------------------------------ loop

    private tick = (t: number) => this.frame(t)

    private wake(redraw = false): void {
        if (this.dead || this.lost) return
        if (redraw) this.dirty = true
        if (this.editor) {
            // one frame, no loop
            if (this.dirty && this.measured) {
                this.dirty = false
                this.draw()
            }
            return
        }
        // a hidden tab needs no check: the browser holds animation frames there and lets them run again on return
        if (this.raf || this.inFrame || !this.inView || !this.measured) return
        // no dots, or the 2D fallback above 8,000 dots (holds still): a frame only to draw
        if ((this.n === 0 || (this.ctx && this.n > MAX_DOTS_2D)) && !this.dirty) return
        // motion starts from rest: frames around the mark may have changed since the last look
        if (!this.dirty) this.updateClip()
        this.last = performance.now()
        this.raf = requestAnimationFrame(this.tick)
    }

    private driftOn(now: number): boolean {
        const since = now - this.lastReal
        return this.o.mode === "always" && !this.calm && !!this.mqHover && this.mqHover.matches && since > DRIFT_AFTER && since < DRIFT_UNTIL
    }

    /** at rest: a timer only while a drift is still due on a touch screen, otherwise nothing */
    private idleWake(): void {
        clearTimeout(this.idleT)
        if (this.o.mode !== "always" || this.calm || !this.mqHover || !this.mqHover.matches) return
        const since = performance.now() - this.lastReal
        if (since >= DRIFT_UNTIL) return
        this.idleT = window.setTimeout(() => this.wake(), Math.max(60, DRIFT_AFTER - since + 60))
    }

    private frame(now: number): void {
        this.raf = 0
        if (this.dead || this.lost) return
        this.inFrame = true
        let active = false
        try {
            const dt = clamp(now - this.last, 1, 100)
            this.last = now
            // the 2D fallback holds still above 8,000 dots
            const moves = this.n > 0 && !(this.ctx && this.n > MAX_DOTS_2D)
            active = moves && this.step(dt, now)
            if (active || this.dirty) this.draw()
        } catch (e) {
            this.inFrame = false
            this.report(message(e))
            return
        }
        this.inFrame = false
        this.dirty = false
        if (active && this.inView) {
            if (!this.raf) this.raf = requestAnimationFrame(this.tick)
        } else this.idleWake()
    }

    /** one step, normalised to 60 Hz; true while anything moves */
    private step(dt: number, now: number): boolean {
        const o = this.o
        const n = this.n
        const calm = this.calm
        const st = clamp(dt / 16.667, 0.25, 2.5)
        const H = this.home
        const OX = this.ox
        const OY = this.oy
        const VX = this.vx
        const VY = this.vy
        const SX = this.sx
        const SY = this.sy
        const OFF = this.off
        const F = this.form
        const ROOM = this.room
        const g = this.g
        const p = this.ptr
        const R = o.radius
        const src: Source[] = []
        // the pointer, raw, with its speed (fades while it rests)
        if (p.on) {
            src.push([p.x, p.y, R, 1, p.vx, p.vy])
            const k = Math.pow(0.85, st)
            p.vx *= k
            p.vy *= k
        }
        const over = p.on && p.x >= 0 && p.y >= 0 && p.x <= this.W && p.y <= this.H
        const stirring = over && !calm && o.mode !== "off"
        if (stirring && o.mode === "always" && now - this.lastAuto >= HOLD_MS) {
            this.lastAuto = now
            this.stir(p.x, p.y, now)
        }
        if (stirring && this.holding && now - this.lastHold >= HOLD_MS) {
            this.lastHold = now
            this.stir(p.x, p.y, now)
        }
        // drift on touch screens: a slow, quiet hand through the word
        const dr = this.drift
        dr.on = clamp(dr.on + ((this.driftOn(now) && !p.on ? 1 : -1) * dt) / 1200, 0, 1)
        if (dr.on > 0) {
            dr.t += dt / 1000
            const b = this.box
            const along = 0.5 + 0.46 * Math.sin(dr.t * 0.21)
            const across = 0.5 + 0.2 * Math.sin(dr.t * 0.37 + 1)
            const x = this.vertical ? b[0] + (b[2] - b[0]) * across : b[0] + (b[2] - b[0]) * along
            const y = this.vertical ? b[1] + (b[3] - b[1]) * along : b[1] + (b[3] - b[1]) * across
            const e = ease(dr.on)
            const dvx = Number.isNaN(dr.px) ? 0 : (x - dr.px) / st
            const dvy = Number.isNaN(dr.py) ? 0 : (y - dr.py) / st
            dr.px = x
            dr.py = y
            src.push([x, y, R * 0.9, 0.2 * e, dvx * e, dvy * e])
        } else {
            dr.px = NaN
            dr.py = NaN
        }
        // swirls rise in 0.2 s and fade out by 1.6 s
        this.stirs = this.stirs.filter((s) => now - s.t < 1600)
        const b = this.box
        const thick = this.vertical ? b[2] - b[0] : b[3] - b[1]
        const RW = clamp(thick * 0.3, 34, 120) * 0.85
        const amp = 7.5 * o.strength
        const stirs = this.stirs.map((s) => {
            const t = (now - s.t) / 1000
            return [s.x, s.y, RW, s.dir * amp * (t / 0.2) * Math.exp(1 - t / 0.2)]
        })
        const OWX = this.wx
        const OWY = this.wy
        const WVX = this.wvx
        const WVY = this.wvy
        const ws = 0.1
        const wkS = ws * ws * st
        const wdS = 2 * ws * st
        // evasion as a damped spring, in frames at 60 Hz: stiffness w0^2, damping 2 zeta w0
        const w0 = (2 * Math.PI * EVADE_HZ) / 60
        const kS = w0 * w0
        const cS = 2 * EVADE_DAMPING * w0
        let moving = false
        for (let i = 0; i < n; i++) {
            const i3 = i * 3
            const hx = H[i3]
            const hy = H[i3 + 1]
            if (calm) {
                // calm: nothing moves, under the pointer the dots only get smaller (to 45 %)
                let sh = 0
                for (const S of src) {
                    const d = Math.hypot(hx - S[0], hy - S[1])
                    if (d < S[2]) sh = Math.max(sh, (1 - d / S[2]) * S[3])
                }
                const target = 1 - 0.55 * ease(sh)
                const sc = F[i3 + 2] + (target - F[i3 + 2]) * 0.2
                if (Math.abs(sc - target) > 0.002) {
                    F[i3 + 2] = sc
                    moving = true
                } else F[i3 + 2] = target
                continue
            }
            let x = OX[i]
            let y = OY[i]
            let vx = VX[i]
            let vy = VY[i]
            // the swirl as a flow on the current position, with its own spring
            let wx = OWX[i]
            let wy = OWY[i]
            let wvx = WVX[i]
            let wvy = WVY[i]
            let fx = 0
            let fy = 0
            if (stirs.length) {
                const px = hx + x + wx
                const py = hy + y + wy
                for (const S of stirs) {
                    const rx = px - S[0]
                    const ry = py - S[1]
                    const d = Math.sqrt(rx * rx + ry * ry) + 0.001
                    const q = d / S[2]
                    if (q > 3) continue
                    const v = S[3] * q * Math.exp(0.5 * (1 - q * q))
                    fx += (-ry / d) * v
                    fy += (rx / d) * v
                }
            }
            wvx += -wx * wkS - wvx * wdS
            wvy += -wy * wkS - wvy * wdS
            const wmx = fx + wvx
            const wmy = fy + wvy
            wx += wmx * st
            wy += wmy * st
            // the pointer: its field pushes away (strongest at the centre, fading to zero at the rim) and pulls along its
            // way; the spring brings the dot home
            const qx = hx + x
            const qy = hy + y
            let accX = -kS * x - cS * vx
            let accY = -kS * y - cS * vy
            let pushed = false
            for (const S of src) {
                const dx = qx - S[0]
                const dy = qy - S[1]
                const d = Math.hypot(dx, dy)
                const q = d / S[2]
                if (q >= 1) continue
                const w = 1 - q
                const away = d > 1e-4 ? (w * EVADE_PUSH * S[3]) / d : 0
                accX += dx * away + S[4] * w * EVADE_PULL
                accY += dy * away + S[5] * w * EVADE_PULL
                pushed = true
            }
            vx += accX * st
            vy += accY * st
            x += vx * st
            y += vy * st
            // fast dots stretch along their way (capsules of the same area)
            const mx = vx + wmx
            const my = vy + wmy
            const sp = Math.sqrt(mx * mx + my * my)
            const amt = clamp(sp / (g * 0.9), 0, 0.9)
            const ax = sp > 0.01 ? (mx / sp) * amt : 0
            const ay = sp > 0.01 ? (my / sp) * amt : 0
            SX[i] += (ax - SX[i]) * 0.35
            SY[i] += (ay - SY[i]) * 0.35
            if (Math.abs(wx) + Math.abs(wy) + Math.abs(wvx) + Math.abs(wvy) + Math.abs(fx) + Math.abs(fy) < 0.02) {
                wx = 0
                wy = 0
                wvx = 0
                wvy = 0
            } else moving = true
            const slow = Math.abs(vx) + Math.abs(vy) < 0.01 && Math.abs(SX[i]) + Math.abs(SY[i]) < 0.01
            if (slow && Math.abs(x) + Math.abs(y) < 0.04) {
                x = 0
                y = 0
                vx = 0
                vy = 0
                SX[i] = 0
                SY[i] = 0
            } else if (!(slow && pushed)) moving = true
            OWX[i] = wx
            OWY[i] = wy
            WVX[i] = wvx
            WVY[i] = wvy
            OX[i] = x
            OY[i] = y
            VX[i] = vx
            VY[i] = vy
            // eased towards the clip edge: free up to 60 % of the room, then slower, never beyond it
            const tx = x + wx
            const ty = y + wy
            OFF[i * 2] = easeOut(tx, tx > 0 ? ROOM[i * 4 + 1] : ROOM[i * 4])
            OFF[i * 2 + 1] = easeOut(ty, ty > 0 ? ROOM[i * 4 + 3] : ROOM[i * 4 + 2])
            F[i3] = SX[i]
            F[i3 + 1] = SY[i]
        }
        const pointerMoves = p.on && Math.abs(p.vx) + Math.abs(p.vy) > 0.01
        return moving || this.stirs.length > 0|| pointerMoves || dr.on > 0 || (stirring && (o.mode === "always" || this.holding))
    }

    // ------------------------------------------------------------ drawing

    private draw(): void {
        if (this.g3) this.drawGl(this.g3)
        else this.draw2d()
        // a word without dots (area 0, also when hidden again) keeps or brings back the still
        this.show(this.n > 0 || !this.o.word)
    }

    private drawGl(g3: Gl): void {
        const gl = g3.gl
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        if (!this.n || this.ink[3] <= 0) return
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.useProgram(g3.prog)
        const u = g3.u
        const sprite = Math.min(Math.max(this.dot * 2.2, this.g * 1.5) + 2, g3.maxPoint / this.dpr)
        gl.uniform2f(u.uView, this.W + 2 * this.bleed, this.H + 2 * this.bleed)
        gl.uniform2f(u.uOrigin, this.bleed, this.bleed)
        gl.uniform1f(u.uSprite, sprite)
        gl.uniform1f(u.uDpr, this.dpr)
        gl.uniform1f(u.uPitch, this.g)
        gl.uniform2f(u.uRot, this.rot[0], this.rot[1])
        gl.uniform1f(u.uShape, this.o.shape === "lines" ? 1 : 0)
        gl.uniform3f(u.uInk, this.inkLab[0], this.inkLab[1], this.inkLab[2])
        gl.uniform1f(u.uAlpha, this.ink[3])
        gl.uniform1f(u.uGrain, GRAIN)
        const attr = (loc: number, buf: WebGLBuffer, data: Float32Array | null, size: number) => {
            if (loc < 0) return
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            if (data) gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
            gl.enableVertexAttribArray(loc)
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
        }
        attr(g3.aHome, g3.bHome, null, 3)
        attr(g3.aOff, g3.bOff, this.off, 2)
        attr(g3.aForm, g3.bForm, this.form, 3)
        gl.drawArrays(gl.POINTS, 0, this.n)
    }

    /** the 2D fallback and the editor frame: the same grid, dots or lines, without capsules and grain */
    private draw2d(): void {
        const x = this.ctx
        if (!x) return
        const dpr = this.dpr
        const B = this.bleed
        x.setTransform(dpr, 0, 0, dpr, B * dpr, B * dpr)
        x.clearRect(-B, -B, this.W + 2 * B, this.H + 2 * B)
        const n = this.n
        const c = this.ink
        if (!n || c[3] <= 0) return
        x.fillStyle = `rgba(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)}, ${c[3]})`
        const H = this.home
        const OFF = this.off
        const F = this.form
        x.beginPath()
        if (this.o.shape === "lines") {
            const [rc, rs] = this.rot
            const hl = this.g * 0.5 + 0.35
            const ax = rc * hl
            const ay = rs * hl
            for (let i = 0; i < n; i++) {
                const r = H[i * 3 + 2] * F[i * 3 + 2]
                if (r < 0.05) continue
                const px = H[i * 3] + OFF[i * 2]
                const py = H[i * 3 + 1] + OFF[i * 2 + 1]
                const bx = -rs * r
                const by = rc * r
                x.moveTo(px - ax - bx, py - ay - by)
                x.lineTo(px + ax - bx, py + ay - by)
                x.lineTo(px + ax + bx, py + ay + by)
                x.lineTo(px - ax + bx, py - ay + by)
                x.closePath()
            }
        } else {
            for (let i = 0; i < n; i++) {
                const r = H[i * 3 + 2] * F[i * 3 + 2]
                if (r < 0.05) continue
                const px = H[i * 3] + OFF[i * 2]
                const py = H[i * 3 + 1] + OFF[i * 2 + 1]
                x.moveTo(px + r, py)
                x.arc(px, py, r, 0, Math.PI * 2)
            }
        }
        x.fill()
    }

    // ------------------------------------------------------------ teardown

    private stop(): void {
        cancelAnimationFrame(this.raf)
        this.raf = 0
        clearTimeout(this.fontLimit)
        clearTimeout(this.fontRetry)
        clearTimeout(this.resizeT)
        clearTimeout(this.idleT)
        clearTimeout(this.longT)
        this.fontToken++
        this.dead = true
    }

    destroy(): void {
        this.stop()
        const root = this.root
        root.removeEventListener("pointermove", this.onMove)
        root.removeEventListener("pointerleave", this.onLeave)
        root.removeEventListener("pointerdown", this.onDown)
        root.removeEventListener("pointerup", this.onUp)
        root.removeEventListener("pointercancel", this.onCancel)
        root.removeEventListener("contextmenu", this.onMenu)
        this.mqReduce?.removeEventListener("change", this.onReduce)
        this.mqScheme?.removeEventListener("change", this.onScheme)
        this.ro?.disconnect()
        this.io?.disconnect()
        this.canvas.removeEventListener("webglcontextlost", this.onLost)
        this.canvas.removeEventListener("webglcontextrestored", this.onRestored)
        this.g3?.gl.getExtension("WEBGL_lose_context")?.loseContext()
        this.g3 = null
        this.ctx = null
        this.canvas.width = 0
        this.canvas.height = 0
        this.canvas.remove()
        if (this.maskCanvas) {
            this.maskCanvas.width = 0
            this.maskCanvas.height = 0
        }
    }
}

// ------------------------------------------------------------------ still picture

/**
 * A rough ink box of the word in em for a bold sans (the still only; the live picture measures the real font): width,
 * height and how far the baseline sits below the ink centre.
 */
function wordEm(word: string, track: string): { w: number; h: number; dy: number } {
    let w = 0
    for (const ch of Array.from(word)) {
        if (ch === " ") w += 0.26
        else if (/[MWmw@]/.test(ch)) w += 0.88
        else if (/[iljI1.,:;!'|]/.test(ch)) w += 0.3
        else if (/[ftr]/.test(ch)) w += 0.4
        else if (/[a-z]/.test(ch)) w += 0.56
        else w += 0.66
    }
    const t = parseFloat(track)
    if (Number.isFinite(t) && track.endsWith("em")) w += t * Math.max(0, Array.from(word).length - 1)
    // above the baseline: accents on capitals, capitals and ascenders, or x-height only; below: g, j, p, q, y
    const top = /[À-ÖØ-Þ]/.test(word) ? 0.9 : /[^a-z\s]|[bdfhklt]/.test(word) ? 0.72 : 0.52
    const desc = /[gjpqy]/.test(word) ? 0.2 : 0
    const r2 = (v: number) => Math.round(v * 100) / 100
    return { w: Math.max(0.5, r2(w)), h: r2(top + desc), dy: r2((top - desc) / 2) }
}

// ------------------------------------------------------------------ component

/**
 * A wordmark of halftone dots. The dots move out of the pointer's way and spring back; a swirl stirs the grid.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 330
 * @framerDisableUnlink
 */
export default function Dotmark(props: Props) {
    const { style } = props
    const look = toLook(props)
    const { word, family, weight, italic, track, ink, dot, gap, mode, strength, shape, angle, fade, radius } = look
    const isStatic = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.thumbnail
    const inCanvas = isStatic && RenderTarget.current() === RenderTarget.canvas
    const [mounted, setMounted] = useState(false)
    const [drawn, setDrawn] = useState(false)
    const [fault, setFault] = useState<string | null>(null)
    const uid = `dm${useId().replace(/[^a-zA-Z0-9]/g, "")}`
    const rootRef = useRef<HTMLDivElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<Mark | null>(null)
    const lookRef = useRef<Look>(look)
    const run = mounted && (!isStatic || inCanvas) && fault === null

    useEffect(() => setMounted(true), [])

    // the newest settings for the engine, plain values field by field; a new setting also gives a failed start another
    // chance
    useEffect(() => {
        const next: Look = { word, family, weight, italic, track, ink, dot, gap, mode, strength, shape, angle, fade, radius }
        lookRef.current = next
        engineRef.current?.set(next)
        setFault(null)
    }, [word, family, weight, italic, track, ink, dot, gap, mode, strength, shape, angle, fade, radius])

    useEffect(() => {
        if (!run) return
        const root = rootRef.current
        const layer = layerRef.current
        if (!root || !layer) return
        let engine: Mark
        try {
            engine = new Mark(root, layer, lookRef.current, inCanvas, { drawn: setDrawn, fault: setFault })
        } catch (e) {
            setFault(message(e))
            return
        }
        engineRef.current = engine
        return () => {
            engine.destroy()
            engineRef.current = null
            setDrawn(false)
        }
    }, [run, inCanvas])

    const pitch = Math.max(2.5, look.dot + look.gap)
    const pad = Math.max(8, pitch * 1.5)
    const em = wordEm(word, look.track)
    const along = (len: string, thick: string) => `min(calc((${len} - 2 * clamp(16px, 5${len === "100cqw" ? "cqw" : "cqh"}, 48px)) / ${em.w}), calc((${thick} - ${2 * pad}px) / ${em.h}))`
    // no quotes in this sheet (they would be escaped on the server); a tall area turns the whole SVG like the live
    // picture (a turn inside the SVG has a different pivot in WebKit)
    const css = `.${uid}c{position:absolute;inset:0;container-type:size;overflow:hidden;pointer-events:none}.${uid}v{position:absolute;left:50%;top:50%;width:100cqw;height:100cqh;overflow:visible;transform:translate(-50%,-50%)}.${uid}s{font-size:${along("100cqw", "100cqh")};white-space:pre}@container not (min-aspect-ratio: 2/3){.${uid}v{width:100cqh;height:100cqw;transform:translate(-50%,-50%) rotate(-90deg)}.${uid}s{font-size:${along("100cqh", "100cqw")}}}`
    const fill = { fill: look.ink }

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                // swirling dots may paint beyond the frame; as paint only, without adding scrollbars to the page
                contain: "layout",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                touchAction: "pan-y pinch-zoom",
                WebkitTapHighlightColor: "transparent",
                ...style,
            }}>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            {/* the word as plain text for assistive tech; the pictures below are hidden from it */}
            {word ? <span style={SR_ONLY}>{word}</span> : null}
            {/* the still: server, static export, thumbnail, and until the live picture stands (no fade) */}
            <div className={`${uid}c`} data-dm-still="" aria-hidden="true" style={{ visibility: drawn ? "hidden" : undefined }}>
                {word ? (
                    // SVG text: a font that arrives late does not shift it (layout shift 0, unlike HTML text)
                    <svg className={`${uid}v`}>
                        <defs>
                            <pattern id={`${uid}p`} patternUnits="userSpaceOnUse" width={pitch} height={pitch} patternTransform={look.angle ? `rotate(${look.angle})` : undefined}>
                                {look.shape === "lines" ? <rect x={0} y={(pitch - look.dot) / 2} width={pitch} height={look.dot} style={fill} /> : <circle cx={pitch / 2} cy={pitch / 2} r={look.dot / 2} style={fill} />}
                            </pattern>
                        </defs>
                        <text
                            className={`${uid}s`}
                            x="50%"
                            y="50%"
                            dy={`${em.dy}em`}
                            textAnchor="middle"
                            fill={`url(#${uid}p)`}
                            style={{ fontFamily: look.family, fontWeight: look.weight as CSSProperties["fontWeight"], fontStyle: look.italic, letterSpacing: look.track || undefined }}>
                            {word}
                        </text>
                    </svg>
                ) : null}
            </div>
            <div ref={layerRef} data-dm-live="" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
            {inCanvas && (fault || !word) ? (
                // editor canvas only; visitors see the still picture, or nothing without a word
                <div aria-hidden="true" style={{ position: "absolute", left: 8, bottom: 8, maxWidth: "calc(100% - 16px)", padding: "6px 10px", borderRadius: 4, background: "rgba(255, 255, 255, 0.94)", color: "rgb(28, 27, 25)", boxShadow: "0 0 0 1px rgba(28, 27, 25, 0.16)", font: "13px/18px system-ui, sans-serif", pointerEvents: "none" }}>
                    {fault ? `Live drawing could not start (${fault}). Visitors see the still picture.` : "Add a word"}
                </div>
            ) : null}
        </div>
    )
}

// ------------------------------------------------------------------ panel (Framer)

addPropertyControls(Dotmark, {
    // flat: CMS
    word: {
        type: ControlType.String,
        title: "Word",
        defaultValue: D.word,
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "basic",
                displayFontSize: false,
                displayTextAlignment: false,
                defaultFontType: "sans-serif",
                defaultValue: { variant: "Extra Bold" },
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            dots: { type: ControlType.Color, title: "Dots", defaultValue: D.ink },
        },
    },
    dots: {
        type: ControlType.Object,
        title: "Dots",
        controls: {
            size: { type: ControlType.Number, title: "Size", min: 2, max: 16, step: 1, unit: "px", defaultValue: D.size, description: "Largest dot size. Small marks use smaller dots so the word stays readable." },
            spacing: { type: ControlType.Number, title: "Spacing", min: 0, max: 10, step: 1, unit: "px", defaultValue: D.spacing },
        },
    },
    swirl: {
        type: ControlType.Object,
        title: "Swirl",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["always", "hold", "off"],
                optionTitles: ["Always", "Hold", "Off"],
                defaultValue: D.mode,
                description: "Always: while the pointer is over the mark, on touch screens also on its own. Hold: on click and while pressed. Off: dots only move aside.",
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                min: 5,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: D.strength,
                hidden: (p: SwirlGroup) => p.mode === "off",
            },
        },
    },
    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        controls: {
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["dots", "lines"],
                optionTitles: ["Dots", "Lines"],
                displaySegmentedControl: true,
                defaultValue: D.shape,
            },
            angle: { type: ControlType.Number, title: "Angle", min: 0, max: 90, step: 15, unit: "°", defaultValue: D.angle, description: "Turns the grid, not the word." },
            fade: { type: ControlType.Number, title: "Fade", min: 0, max: 100, step: 5, unit: "%", defaultValue: D.fade, description: "Dots get smaller towards the top." },
            radius: { type: ControlType.Number, title: "Radius", min: 40, max: 200, step: 10, unit: "px", defaultValue: D.radius, description: "Area around the pointer where dots move away." },
        },
    },
})
