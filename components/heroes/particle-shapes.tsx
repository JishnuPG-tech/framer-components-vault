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


/* ============================================================================
 * ParticleShapes — particle-based shapes with pointer interaction
 * ----------------------------------------------------------------------------
 * Thousands of GPU point-sprites are sampled onto a shape (heart, star,
 * galaxy spiral, wave, text, …) and held there by a spring. The pointer
 * pushes, pulls or swirls them — including the velocity of your stroke —
 * and they flow back home when you leave.
 *
 * Performance rules:
 *   • Physics runs on flat Float32Arrays (zero per-frame allocation); one
 *     interleaved dynamic buffer is streamed to the GPU per frame.
 *   • A single gl.POINTS draw call renders every particle.
 *   • Particle count and pixel ratio are capped by the Quality control.
 *   • The loop stops off-screen, in hidden tabs, and when Animate is off.
 *   • `useIsStaticRenderer()` → no WebGL, no listeners, no rAF: a static
 *     inline-SVG dot field (or your own image) is painted instead.
 * ========================================================================== */

/* --------------------------------------------------------------------------- */
/* Types & defaults                                                            */
/* --------------------------------------------------------------------------- */

type ShapeName =
    | "disk"
    | "ring"
    | "heart"
    | "star"
    | "galaxy"
    | "wave"
    | "triangle"
    | "square"
    | "infinity"
    | "text"

type InteractMode = "repel" | "attract" | "swirl" | "off"
type BlendMode = "add" | "normal"
type StaticMode = "auto" | "canvas" | "always"

export interface Props {
    shape: ShapeName
    text: string
    count: number
    size: number
    sizeVariance: number
    shapeScale: number
    rotation: number
    offsetX: number
    offsetY: number
    jitter: number
    colorA: string
    colorB: string
    opacity: number
    blend: BlendMode
    background: "transparent" | "dim" | "solid"
    backgroundColor: string
    radius: number
    interact: InteractMode
    interactRadius: number
    interactStrength: number
    stiffness: number
    damping: number
    drift: number
    twinkle: boolean
    touchCapture: boolean
    animate: boolean
    speed: number
    quality: "auto" | "high" | "balanced" | "fast" | "ultra"
    staticMode: StaticMode
    fallbackImage: string | { src: string } | null
    width: number
    height: number
    style?: React.CSSProperties
    className?: string
    id?: string
}

export const defaultProps: Props = {
    shape: "heart",
    text: "HELLO",
    count: 2600,
    size: 3.2,
    sizeVariance: 0.6,
    shapeScale: 0.72,
    rotation: 0,
    offsetX: 50,
    offsetY: 50,
    jitter: 0.05,
    colorA: "#45E3FF",
    colorB: "#B44CFF",
    opacity: 100,
    blend: "add",
    background: "transparent",
    backgroundColor: "#05060F",
    radius: 0,
    interact: "repel",
    interactRadius: 0.38,
    interactStrength: 3.2,
    stiffness: 26,
    damping: 5.5,
    drift: 0.14,
    twinkle: true,
    touchCapture: false,
    animate: true,
    speed: 1,
    quality: "auto",
    staticMode: "auto",
    fallbackImage: null,
    width: 480,
    height: 320,
}

export const framerSupportedLayoutWidth = "fixed"
export const framerSupportedLayoutHeight = "fixed"

const QUALITY = {
    ultra: { dprCap: 2.5, maxParticles: 12000 },
    high: { dprCap: 2, maxParticles: 7000 },
    balanced: { dprCap: 1.5, maxParticles: 4000 },
    fast: { dprCap: 1, maxParticles: 1800 },
} as const
type QualityKey = keyof typeof QUALITY

function resolveQuality(q: Props["quality"]): QualityKey {
    if (q !== "auto") return q
    if (typeof navigator === "undefined") return "balanced"
    const cores = (navigator as any).hardwareConcurrency || 4
    const small =
        Math.min(window.innerWidth || 1280, window.innerHeight || 800) < 700
    if (small || cores <= 4) return "balanced"
    return "high"
}

/* --------------------------------------------------------------------------- */
/* Small math + colour helpers                                                 */
/* --------------------------------------------------------------------------- */

const TAU = Math.PI * 2

/** Deterministic PRNG so canvas, export and SVG fallback all agree. */
function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function hexToRgb01(hex: string): [number, number, number] {
    let h = (hex || "#000000").trim().replace("#", "")
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    if (h.length === 8) h = h.slice(0, 6)
    const int = parseInt(h || "000000", 16)
    if (Number.isNaN(int)) return [0, 0, 0]
    return [
        ((int >> 16) & 255) / 255,
        ((int >> 8) & 255) / 255,
        (int & 255) / 255,
    ]
}

function hexToCss(hex: string) {
    const [r, g, b] = hexToRgb01(hex)
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

/** Parse rgb()/rgba()/hsl() style strings produced by computed styles. */
function parseCssRgb(str: string): [number, number, number] | null {
    const m = /rgba?\(([^)]+)\)/i.exec(str)
    if (!m) return null
    const parts = m[1]
        .split(/[\s,\/]+/)
        .filter(Boolean)
        .map(parseFloat)
    if (parts.length < 3 || parts.some(Number.isNaN)) return null
    /* computed style never returns percentages, but be safe */
    const norm = (v: number, i: number) =>
        i < 3 && v <= 1 && str.indexOf("%") === -1 && v !== 0 && v !== 1
            ? v
            : v / 255
    return [
        Math.min(Math.max(norm(parts[0], 0), 0), 1),
        Math.min(Math.max(norm(parts[1], 1), 0), 1),
        Math.min(Math.max(norm(parts[2], 2), 0), 1),
    ]
}

type ColorInput =
    | string
    | { r: number; g: number; b: number; a?: number }
    | null
    | undefined

/** Immediate best-effort parse (no DOM): hex, rgb()/rgba()/hsl() numbers, objects. */
function quickColor(value: ColorInput): [number, number, number] {
    if (!value) return [0, 0, 0]
    if (typeof value === "object") {
        const max = Math.max(value.r, value.g, value.b)
        const d = max > 1 ? 255 : 1
        return [value.r / d, value.g / d, value.b / d]
    }
    const str = String(value).trim()
    if (str.startsWith("#")) return hexToRgb01(str)
    const css = parseCssRgb(str)
    if (css) return css
    const nums = str.match(/-?\d*\.?\d+/g)
    if (nums && nums.length >= 3) {
        const [r, g, b] = nums.map(Number)
        const d = Math.max(r, g, b) > 1 ? 255 : 1
        return [r / d, g / d, b / d]
    }
    return [0, 0, 0]
}

function mixRgb(
    A: [number, number, number],
    B: [number, number, number],
    t: number
) {
    const c = A.map((v, i) => Math.round((v + (B[i] - v) * t) * 255))
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

function hexToRgba(hex: string, alpha: number) {
    const [r, g, b] = hexToRgb01(hex)
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`
}

/* --------------------------------------------------------------------------- */
/* Shape samplers — n points in normalised space (y up, x ∈ [-1.25, 1.25])     */
/* --------------------------------------------------------------------------- */

interface Sampled {
    home: Float32Array // x,y pairs
    mix: Float32Array // per-particle colour mix 0..1
    phase: Float32Array // per-particle random phase
    base: Float32Array // per-particle size factor
}

const textCache = new Map<string, Float32Array>()

function sampleTextPixels(text: string): Float32Array | null {
    const key = text.slice(0, 64)
    const cached = textCache.get(key)
    if (cached) return cached
    if (typeof document === "undefined") return null
    try {
        const canvas = document.createElement("canvas")
        const W = 320
        const H = 160
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return null
        ctx.fillStyle = "#fff"
        ctx.font =
            "900 96px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(key || "A", W / 2, H / 2 + 6)
        const data = ctx.getImageData(0, 0, W, H).data
        const pts: number[] = []
        for (let y = 0; y < H; y += 2) {
            for (let x = 0; x < W; x += 2) {
                if (data[(y * W + x) * 4 + 3] > 110) pts.push(x, y)
            }
        }
        if (pts.length < 8) return null
        const out = new Float32Array(pts)
        textCache.set(key, out)
        return out
    } catch {
        return null
    }
}

export function sampleShape(
    shape: ShapeName,
    n: number,
    text: string,
    jitter: number,
    sizeVar: number,
    seed: number
): Sampled {
    const rnd = mulberry32(seed)
    const home = new Float32Array(n * 2)
    const mix = new Float32Array(n)
    const phase = new Float32Array(n)
    const base = new Float32Array(n)
    const gauss = () => rnd() + rnd() + rnd() - 1.5

    /* polygon perimeter helper */
    const poly = (verts: number[][], fillRatio: number) => {
        const lens: number[] = []
        let total = 0
        for (let i = 0; i < verts.length; i++) {
            const a = verts[i]
            const b = verts[(i + 1) % verts.length]
            const l = Math.hypot(b[0] - a[0], b[1] - a[1])
            lens.push(l)
            total += l
        }
        return () => {
            if (rnd() < fillRatio) {
                /* random point inside via fan from centroid */
                const i = Math.floor(rnd() * verts.length)
                const a = verts[i]
                const b = verts[(i + 1) % verts.length]
                let u = rnd()
                let v = rnd()
                if (u + v > 1) {
                    u = 1 - u
                    v = 1 - v
                }
                return [a[0] * u + b[0] * v, a[1] * u + b[1] * v]
            }
            let d = rnd() * total
            let i = 0
            while (d > lens[i]) {
                d -= lens[i]
                i = (i + 1) % verts.length
            }
            const t = d / lens[i]
            const a = verts[i]
            const b = verts[(i + 1) % verts.length]
            return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
        }
    }

    const starVerts = (() => {
        const v: number[][] = []
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? 1.0 : 0.46
            const a = Math.PI / 2 + (i * Math.PI) / 5
            v.push([Math.cos(a) * r, Math.sin(a) * r])
        }
        return v
    })()

    const triVerts = (() => {
        const v: number[][] = []
        for (let i = 0; i < 3; i++) {
            const a = Math.PI / 2 + (i * TAU) / 3
            v.push([Math.cos(a) * 1.05, Math.sin(a) * 1.05])
        }
        return v
    })()

    const sqVerts = [
        [-0.9, -0.9],
        [0.9, -0.9],
        [0.9, 0.9],
        [-0.9, 0.9],
    ]

    const triSampler = poly(triVerts, 0.3)
    const sqSampler = poly(sqVerts, 0.25)
    const starSampler = poly(starVerts, 0.3)
    const textPts = shape === "text" ? sampleTextPixels(text) : null

    for (let i = 0; i < n; i++) {
        let x = 0
        let y = 0
        let m = rnd()
        const u = rnd()
        const u2 = rnd()
        switch (shape) {
            case "disk": {
                const r = Math.sqrt(u) * 0.92
                const a = u2 * TAU
                x = Math.cos(a) * r
                y = Math.sin(a) * r
                m = r
                break
            }
            case "ring": {
                const r = 0.82 + gauss() * 0.055
                const a = u2 * TAU
                x = Math.cos(a) * r
                y = Math.sin(a) * r
                m = (a / TAU + 1) % 1
                break
            }
            case "heart": {
                const t = u * TAU
                const hx = 16 * Math.pow(Math.sin(t), 3)
                const hy =
                    13 * Math.cos(t) -
                    5 * Math.cos(2 * t) -
                    2 * Math.cos(3 * t) -
                    Math.cos(4 * t)
                const s = u2 < 0.6 ? 1 : Math.sqrt(rnd()) * 0.92
                x = (hx / 16.5) * s
                y = (hy / 16.5) * s + 0.05
                m = (t / TAU + 0.5) % 1
                break
            }
            case "star": {
                const p = starSampler()
                x = p[0]
                y = p[1]
                m = Math.hypot(x, y)
                break
            }
            case "galaxy": {
                if (u < 0.18) {
                    const r = Math.abs(gauss()) * 0.16
                    const a = u2 * TAU
                    x = Math.cos(a) * r
                    y = Math.sin(a) * r * 0.7
                } else {
                    const arm = i % 3
                    const t = Math.pow(rnd(), 0.72)
                    const r = 0.12 + t * 0.95
                    const a =
                        t * 4.6 +
                        (arm * TAU) / 3 +
                        gauss() * 0.22 * (1.1 - t * 0.7)
                    x = Math.cos(a) * r
                    y = Math.sin(a) * r * 0.62
                }
                m = Math.min(Math.hypot(x, y), 1)
                break
            }
            case "wave": {
                const band = Math.floor(u2 * 3)
                x = (u * 2 - 1) * 1.22
                y =
                    Math.sin(x * 2.7 + (band * TAU) / 3) * 0.34 +
                    gauss() * 0.045
                m = (x + 1.25) / 2.5
                break
            }
            case "triangle": {
                const p = triSampler()
                x = p[0]
                y = p[1]
                m = (y + 1) / 2
                break
            }
            case "square": {
                const p = sqSampler()
                x = p[0]
                y = p[1]
                m = (x + 1) / 2
                break
            }
            case "infinity": {
                const t = u * TAU
                x = Math.cos(t) * 1.12
                y = Math.sin(t) * Math.cos(t) * 1.15 + gauss() * 0.03
                m = (t / TAU + 1) % 1
                break
            }
            case "text": {
                if (textPts && textPts.length >= 4) {
                    const k = Math.floor(rnd() * (textPts.length / 2)) * 2
                    x = (textPts[k] / 320) * 2.4 - 1.2 + gauss() * 0.008
                    y = 0.5 - textPts[k + 1] / 160 + gauss() * 0.008
                } else {
                    const r = Math.sqrt(u) * 0.9
                    const a = u2 * TAU
                    x = Math.cos(a) * r
                    y = Math.sin(a) * r
                }
                m = (x + 1.25) / 2.5
                break
            }
        }
        x += gauss() * jitter
        y += gauss() * jitter
        home[i * 2] = x
        home[i * 2 + 1] = y
        mix[i] = Math.min(Math.max(m, 0), 1)
        phase[i] = rnd() * TAU
        base[i] = 1 + (rnd() * 2 - 1) * sizeVar
    }
    return { home, mix, phase, base }
}

/* --------------------------------------------------------------------------- */
/* Shaders                                                                     */
/* --------------------------------------------------------------------------- */

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_data;   // point size (px), brightness
attribute float a_mix;
uniform float u_aspect;
uniform float u_pointScale;
varying float v_b;
varying float v_mix;
void main() {
    gl_Position = vec4(a_pos.x / u_aspect, a_pos.y, 0.0, 1.0);
    gl_PointSize = max(a_data.x * u_pointScale, 1.0);
    v_b = a_data.y;
    v_mix = a_mix;
}
`

const FRAG = `
precision mediump float;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_opacity;
varying float v_b;
varying float v_mix;
void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.06, d);
    a *= a;
    vec3 col = mix(u_colorA, u_colorB, v_mix) * v_b;
    float alpha = a * u_opacity;
    gl_FragColor = vec4(col * alpha, alpha);  /* premultiplied */
}
`

/* --------------------------------------------------------------------------- */
/* Static fallback — deterministic inline SVG dot field (no timers, no WebGL)  */
/* --------------------------------------------------------------------------- */

const StaticParticles: React.FC<{
    props: Props
    resA: [number, number, number]
    resB: [number, number, number]
}> = ({ props, resA, resB }) => {
    const {
        shape,
        text,
        backgroundColor,
        background,
        radius,
        offsetX,
        offsetY,
        shapeScale,
        rotation,
        opacity,
        size,
        jitter,
    } = props

    const imageSrc =
        typeof props.fallbackImage === "string"
            ? props.fallbackImage
            : props.fallbackImage?.src

    const dots = React.useMemo(() => {
        const n = 420
        const s = sampleShape(shape, n, text, jitter, 0.5, 1337)
        const out: { x: number; y: number; r: number; c: string; o: number }[] =
            []
        const rnd = mulberry32(9001)
        for (let i = 0; i < n; i++) {
            const x = s.home[i * 2]
            const y = s.home[i * 2 + 1]
            out.push({
                x: x * 34 + 50,
                y: 50 - y * 34,
                r: 0.35 + rnd() * 0.5 + size * 0.06,
                c: mixRgb(resA, resB, s.mix[i]),
                o: 0.35 + rnd() * 0.55,
            })
        }
        return out
    }, [shape, text, jitter, size, resA, resB])

    const bg =
        background === "transparent"
            ? "transparent"
            : background === "dim"
              ? hexToRgba(backgroundColor, 0.55)
              : backgroundColor

    return (
        <div
            data-particleshapes-static=""
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: radius,
                background: bg,
                contain: "strict",
            }}
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            ) : (
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: `${offsetX}%`,
                        top: `${offsetY}%`,
                        width: `${shapeScale * 130}%`,
                        height: `${shapeScale * 130}%`,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        opacity: opacity / 100,
                    }}
                >
                    {dots.map((d, i) => (
                        <circle
                            key={i}
                            cx={d.x}
                            cy={d.y}
                            r={d.r}
                            fill={d.c}
                            opacity={d.o}
                        />
                    ))}
                </svg>
            )}
        </div>
    )
}

/* --------------------------------------------------------------------------- */
/* Engine                                                                      */
/* --------------------------------------------------------------------------- */

interface Params {
    enabled: boolean
    animate: boolean
    scale: number
    rot: number
    cx: number
    cy: number
    mode: InteractMode
    radius: number
    strength: number
    k: number
    damp: number
    drift: number
    twinkle: boolean
    speed: number
    size: number
    blend: BlendMode
    opacity: number
    colorA: [number, number, number]
    colorB: [number, number, number]
    dprCap: number
}

interface Engine {
    gl: WebGLRenderingContext
    program: WebGLProgram
    dyn: WebGLBuffer
    stat: WebGLBuffer
    loc: Record<string, WebGLUniformLocation | null>
    attr: Record<string, number>
    count: number
    home: Float32Array
    px: Float32Array
    py: Float32Array
    vx: Float32Array
    vy: Float32Array
    phase: Float32Array
    base: Float32Array
    stream: Float32Array
    aspect: number
    bufW: number
    bufH: number
}

function makeEngine(canvas: HTMLCanvasElement): Engine | null {
    const gl = (canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        desynchronized: true,
    }) ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    if (!gl) return null

    const compile = (type: number, src: string) => {
        const sh = gl.createShader(type)!
        gl.shaderSource(sh, src)
        gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            throw new Error(`ParticleShapes shader: ${gl.getShaderInfoLog(sh)}`)
        }
        return sh
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`ParticleShapes link: ${gl.getProgramInfoLog(program)}`)
    }

    const loc: Record<string, WebGLUniformLocation | null> = {}
    for (const n of [
        "u_aspect",
        "u_pointScale",
        "u_colorA",
        "u_colorB",
        "u_opacity",
    ]) {
        loc[n] = gl.getUniformLocation(program, n)
    }
    const attr: Record<string, number> = {
        a_pos: gl.getAttribLocation(program, "a_pos"),
        a_data: gl.getAttribLocation(program, "a_data"),
        a_mix: gl.getAttribLocation(program, "a_mix"),
    }

    const dyn = gl.createBuffer()!
    const stat = gl.createBuffer()!
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.clearColor(0, 0, 0, 0)

    return {
        gl,
        program,
        dyn,
        stat,
        loc,
        attr,
        count: 0,
        home: new Float32Array(0),
        px: new Float32Array(0),
        py: new Float32Array(0),
        vx: new Float32Array(0),
        vy: new Float32Array(0),
        phase: new Float32Array(0),
        base: new Float32Array(0),
        stream: new Float32Array(0),
        aspect: 1,
        bufW: 0,
        bufH: 0,
    }
}

/* --------------------------------------------------------------------------- */
/* Component                                                                   */
/* --------------------------------------------------------------------------- */

export default function ParticleShapes(props: Props) {
    const p = { ...defaultProps, ...props }
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const wrapRef = React.useRef<HTMLDivElement | null>(null)
    const engineRef = React.useRef<Engine | null>(null)
    const [failed, setFailed] = React.useState(false)

    const isStaticRenderer = useIsStaticRenderer()
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        if (mq.addEventListener) mq.addEventListener("change", update)
        else mq.addListener(update)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", update)
            else mq.removeListener(update)
        }
    }, [])

    const quality = resolveQuality(p.quality)
    const useStatic =
        p.staticMode === "canvas"
            ? true
            : p.staticMode === "always"
              ? false
              : isStaticRenderer
    const animate =
        p.animate && !useStatic && !(reduced && p.quality === "auto")
    const count = Math.max(50, Math.min(p.count, QUALITY[quality].maxParticles))

    const apiRef = React.useRef<{
        syncSize: () => void
        syncLoop: () => void
        renderOnce: () => void
    } | null>(null)
    const touchRef = React.useRef(p.touchCapture)
    touchRef.current = p.touchCapture

    /* Framer can hand us hex, rgb(), rgba(), hsl(), or a CSS-variable token.
     * Resolve through computed style on a hidden probe that lives inside the
     * layer, so site colour tokens resolve too. */
    const probeRef = React.useRef<HTMLSpanElement | null>(null)
    const [resolved, setResolved] = React.useState<{
        a: [number, number, number]
        b: [number, number, number]
    }>(() => ({ a: quickColor(p.colorA), b: quickColor(p.colorB) }))
    React.useLayoutEffect(() => {
        const el = probeRef.current
        if (!el) return
        const read = (value: ColorInput): [number, number, number] => {
            if (typeof value !== "string") return quickColor(value)
            const str = value.trim()
            if (str.startsWith("#")) return hexToRgb01(str)
            /* rgb()/rgba()/hsl()/named/var() tokens: ask the browser */
            if (
                typeof CSS !== "undefined" &&
                CSS.supports &&
                !CSS.supports("color", str)
            ) {
                return quickColor(str)
            }
            el.style.color = str
            const css = getComputedStyle(el).color
            return parseCssRgb(css) ?? quickColor(str)
        }
        const a = read(p.colorA)
        const b = read(p.colorB)
        setResolved((prev) =>
            prev.a[0] === a[0] &&
            prev.a[1] === a[1] &&
            prev.a[2] === a[2] &&
            prev.b[0] === b[0] &&
            prev.b[1] === b[1] &&
            prev.b[2] === b[2]
                ? prev
                : { a, b }
        )
    }, [p.colorA, p.colorB])

    const paramsRef = React.useRef<Params>(null as unknown as Params)
    paramsRef.current = {
        enabled: !useStatic,
        animate,
        scale: p.shapeScale,
        rot: (p.rotation * Math.PI) / 180,
        cx: (p.offsetX - 50) / 50,
        cy: -((p.offsetY - 50) / 50),
        mode: p.interact,
        radius: p.interactRadius,
        strength: p.interactStrength,
        k: p.stiffness,
        damp: p.damping,
        drift: p.drift,
        twinkle: p.twinkle,
        speed: p.speed,
        size: p.size,
        blend: p.blend,
        opacity: p.opacity / 100,
        colorA: resolved.a,
        colorB: resolved.b,
        dprCap: QUALITY[quality].dprCap,
    }

    const pointerRef = React.useRef({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        active: false,
        last: 0,
    })

    /* ---- engine lifecycle ---- */
    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || useStatic) return
        let engine: Engine | null = null
        try {
            engine = makeEngine(canvas)
        } catch (err) {
            console.warn("[ParticleShapes]", err)
        }
        if (!engine) {
            setFailed(true)
            return
        }
        engineRef.current = engine

        const g = engine.gl
        let raf = 0
        let running = false
        let visible = true
        let disposed = false
        let time = 0
        let last = performance.now()

        const syncSize = () => {
            const rect = canvas.getBoundingClientRect()
            const cssW = Math.max(1, Math.round(rect.width))
            const cssH = Math.max(1, Math.round(rect.height))
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                paramsRef.current.dprCap
            )
            const w = Math.max(1, Math.round(cssW * dpr))
            const h = Math.max(1, Math.round(cssH * dpr))
            if (w === engine!.bufW && h === engine!.bufH) return
            engine!.bufW = w
            engine!.bufH = h
            canvas.width = w
            canvas.height = h
            engine!.aspect = w / h
            g.viewport(0, 0, w, h)
        }

        const draw = () => {
            const e = engine!
            const pr = paramsRef.current
            g.useProgram(e.program)
            g.blendFunc(
                g.ONE,
                pr.blend === "add" ? g.ONE : g.ONE_MINUS_SRC_ALPHA
            )
            g.uniform1f(e.loc.u_aspect, e.aspect)
            g.uniform1f(
                e.loc.u_pointScale,
                Math.min(window.devicePixelRatio || 1, pr.dprCap)
            )
            g.uniform3f(
                e.loc.u_colorA,
                pr.colorA[0],
                pr.colorA[1],
                pr.colorA[2]
            )
            g.uniform3f(
                e.loc.u_colorB,
                pr.colorB[0],
                pr.colorB[1],
                pr.colorB[2]
            )
            g.uniform1f(e.loc.u_opacity, pr.opacity)

            g.bindBuffer(g.ARRAY_BUFFER, e.dyn)
            g.bufferSubData(g.ARRAY_BUFFER, 0, e.stream)
            g.enableVertexAttribArray(e.attr.a_pos)
            g.vertexAttribPointer(e.attr.a_pos, 2, g.FLOAT, false, 16, 0)
            g.enableVertexAttribArray(e.attr.a_data)
            g.vertexAttribPointer(e.attr.a_data, 2, g.FLOAT, false, 16, 8)
            g.bindBuffer(g.ARRAY_BUFFER, e.stat)
            g.enableVertexAttribArray(e.attr.a_mix)
            g.vertexAttribPointer(e.attr.a_mix, 1, g.FLOAT, false, 4, 0)

            g.clear(g.COLOR_BUFFER_BIT)
            g.drawArrays(g.POINTS, 0, e.count)
        }

        const step = (dt: number) => {
            const e = engine!
            const pr = paramsRef.current
            const n = e.count
            const cosR = Math.cos(pr.rot) * pr.scale
            const sinR = Math.sin(pr.rot) * pr.scale
            const cx = pr.cx * e.aspect
            const cy = pr.cy
            const ptr = pointerRef.current
            const mActive = ptr.active && pr.mode !== "off"
            const R = pr.radius
            const R2 = R * R
            const mvx = ptr.vx
            const mvy = ptr.vy
            const dampF = Math.exp(-pr.damp * dt)
            const t = time

            for (let i = 0; i < n; i++) {
                const hx0 = e.home[i * 2]
                const hy0 = e.home[i * 2 + 1]
                const hx = hx0 * cosR - hy0 * sinR + cx
                const hy = hx0 * sinR + hy0 * cosR + cy
                let x = e.px[i]
                let y = e.py[i]
                let ax = (hx - x) * pr.k
                let ay = (hy - y) * pr.k

                if (pr.drift > 0) {
                    const ph = e.phase[i]
                    ax += pr.drift * Math.sin(y * 3.1 + t * 1.15 + ph)
                    ay += pr.drift * Math.cos(x * 2.7 - t * 0.95 + ph * 1.3)
                }

                if (mActive) {
                    const dx = x - ptr.x
                    const dy = y - ptr.y
                    const d2 = dx * dx + dy * dy
                    if (d2 < R2) {
                        const d = Math.sqrt(d2) + 1e-4
                        const fall = 1 - d / R
                        const f = pr.strength * fall * fall
                        const ux = dx / d
                        const uy = dy / d
                        if (pr.mode === "repel") {
                            ax += ux * f
                            ay += uy * f
                        } else if (pr.mode === "attract") {
                            ax -= ux * f * 0.85
                            ay -= uy * f * 0.85
                        } else {
                            ax += -uy * f + ux * f * 0.18
                            ay += ux * f + uy * f * 0.18
                        }
                        ax += mvx * f * 0.32
                        ay += mvy * f * 0.32
                    }
                }

                let vx = (e.vx[i] + ax * dt) * dampF
                let vy = (e.vy[i] + ay * dt) * dampF
                x += vx * dt
                y += vy * dt
                e.px[i] = x
                e.py[i] = y
                e.vx[i] = vx
                e.vy[i] = vy

                const sp = Math.sqrt(vx * vx + vy * vy)
                let b = 0.5 + Math.min(sp * 0.5, 1.3)
                let sz = pr.size * e.base[i]
                if (pr.twinkle) {
                    const tw = Math.sin(t * 2.3 + e.phase[i] * 3.1)
                    sz *= 1 + tw * 0.22
                    b *= 1 + tw * 0.16
                }
                const o = i * 4
                e.stream[o] = x
                e.stream[o + 1] = y
                e.stream[o + 2] = sz
                e.stream[o + 3] = Math.min(b, 2.4)
            }
        }

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)
            const dt = Math.min((now - last) / 1000, 0.033)
            last = now
            if (disposed || document.hidden || !visible) return
            const pr = paramsRef.current
            if (!pr.enabled) return
            /* decay pointer velocity so strokes fade out */
            const ptr = pointerRef.current
            ptr.vx *= Math.exp(-4 * dt)
            ptr.vy *= Math.exp(-4 * dt)
            time += dt * pr.speed
            syncSize()
            step(dt * pr.speed)
            draw()
        }

        const start = () => {
            if (running || disposed) return
            running = true
            last = performance.now()
            raf = requestAnimationFrame(frame)
        }
        const stop = () => {
            if (!running) return
            running = false
            cancelAnimationFrame(raf)
        }
        const syncLoop = () => {
            const pr = paramsRef.current
            if (
                pr.enabled &&
                pr.animate &&
                visible &&
                !document.hidden &&
                !disposed
            )
                start()
            else stop()
        }
        const renderOnce = () => {
            if (disposed) return
            syncSize()
            step(0.0001)
            draw()
        }

        apiRef.current = { syncSize, syncLoop, renderOnce }

        /* pointer tracking */
        const toWorld = (clientX: number, clientY: number) => {
            const rect = canvas.getBoundingClientRect()
            const e = engine!
            const nx = ((clientX - rect.left) / rect.width) * 2 - 1
            const ny = 1 - ((clientY - rect.top) / rect.height) * 2
            return [nx * e.aspect, ny] as const
        }
        const onMove = (ev: PointerEvent) => {
            if (ev.pointerType === "touch" && !touchRef.current) return
            const ptr = pointerRef.current
            const [x, y] = toWorld(ev.clientX, ev.clientY)
            const now = performance.now()
            const dt = Math.max((now - ptr.last) / 1000, 1e-3)
            if (ptr.active) {
                ptr.vx = ptr.vx * 0.6 + ((x - ptr.x) / dt) * 0.4
                ptr.vy = ptr.vy * 0.6 + ((y - ptr.y) / dt) * 0.4
                const vmax = 6
                ptr.vx = Math.max(-vmax, Math.min(vmax, ptr.vx))
                ptr.vy = Math.max(-vmax, Math.min(vmax, ptr.vy))
            }
            ptr.x = x
            ptr.y = y
            ptr.last = now
            ptr.active = true
        }
        const onLeave = () => {
            pointerRef.current.active = false
            pointerRef.current.vx = 0
            pointerRef.current.vy = 0
        }
        canvas.addEventListener("pointermove", onMove, { passive: true })
        canvas.addEventListener("pointerdown", onMove, { passive: true })
        canvas.addEventListener("pointerleave", onLeave)
        canvas.addEventListener("pointercancel", onLeave)

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    visible = entries.some((en) => en.isIntersecting)
                    syncLoop()
                    if (visible && !paramsRef.current.animate) renderOnce()
                },
                { threshold: 0 }
            )
            io.observe(canvas)
        }
        const onVisibility = () => {
            syncLoop()
            if (!document.hidden && !paramsRef.current.animate) renderOnce()
        }
        document.addEventListener("visibilitychange", onVisibility)

        let resizeRaf = 0
        const onResize = () => {
            cancelAnimationFrame(resizeRaf)
            resizeRaf = requestAnimationFrame(() => {
                syncSize()
                if (!running) renderOnce()
            })
        }
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(onResize)
            ro.observe(canvas)
        } else window.addEventListener("resize", onResize)

        const onLost = (ev: Event) => ev.preventDefault()
        canvas.addEventListener("webglcontextlost", onLost, false)

        renderOnce()
        syncLoop()

        return () => {
            disposed = true
            apiRef.current = null
            stop()
            cancelAnimationFrame(resizeRaf)
            io?.disconnect()
            ro?.disconnect()
            window.removeEventListener("resize", onResize)
            document.removeEventListener("visibilitychange", onVisibility)
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerdown", onMove)
            canvas.removeEventListener("pointerleave", onLeave)
            canvas.removeEventListener("pointercancel", onLeave)
            canvas.removeEventListener("webglcontextlost", onLost)
            g.deleteBuffer(engine.dyn)
            g.deleteBuffer(engine.stat)
            g.deleteProgram(engine.program)
            g.getExtension("WEBGL_lose_context")?.loseContext()
            engineRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useStatic, failed])

    /* ---- (re)sample the shape ---- */
    React.useEffect(() => {
        const e = engineRef.current
        if (!e || useStatic) return
        const s = sampleShape(
            p.shape,
            count,
            p.text,
            p.jitter,
            p.sizeVariance,
            20260911
        )
        e.count = count
        e.home = s.home
        e.phase = s.phase
        e.base = s.base
        e.px = new Float32Array(count)
        e.py = new Float32Array(count)
        e.vx = new Float32Array(count)
        e.vy = new Float32Array(count)
        e.stream = new Float32Array(count * 4)
        const rnd = mulberry32(7)
        for (let i = 0; i < count; i++) {
            /* start slightly scattered so the shape "assembles" on load */
            e.px[i] = s.home[i * 2] + (rnd() * 2 - 1) * 0.6
            e.py[i] = s.home[i * 2 + 1] + (rnd() * 2 - 1) * 0.6
        }
        const g = e.gl
        g.bindBuffer(g.ARRAY_BUFFER, e.stat)
        g.bufferData(g.ARRAY_BUFFER, s.mix, g.STATIC_DRAW)
        g.bindBuffer(g.ARRAY_BUFFER, e.dyn)
        g.bufferData(
            g.ARRAY_BUFFER,
            e.stream,
            g.DYNAMIC_DRAW
        ) /* allocate once per resize of count */
        const api = apiRef.current
        if (api) {
            if (paramsRef.current.animate) api.syncLoop()
            else api.renderOnce()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.shape, p.text, count, p.jitter, useStatic])

    /* ---- prop changes while paused → repaint one frame ---- */
    const specMemo = React.useMemo(
        () => ({
            animate,
            scale: p.shapeScale,
            rot: p.rotation,
            cx: p.offsetX,
            cy: p.offsetY,
            size: p.size,
            blend: p.blend,
            opacity: p.opacity,
            a: p.colorA,
            b: p.colorB,
            twinkle: p.twinkle,
            drift: p.drift,
            quality,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            animate,
            p.shapeScale,
            p.rotation,
            p.offsetX,
            p.offsetY,
            p.size,
            p.blend,
            p.opacity,
            p.colorA,
            p.colorB,
            p.twinkle,
            p.drift,
            quality,
        ]
    )
    React.useEffect(() => {
        const api = apiRef.current
        if (!api || useStatic || failed) return
        api.syncLoop()
        if (!animate) {
            const id = requestAnimationFrame(() => api.renderOnce())
            return () => cancelAnimationFrame(id)
        }
        return
    }, [specMemo, useStatic, failed, animate])

    const showStatic = useStatic || failed
    const bg =
        p.background === "transparent"
            ? "transparent"
            : p.background === "dim"
              ? hexToRgba(p.backgroundColor, 0.55)
              : p.backgroundColor

    return (
        <div
            id={p.id}
            className={p.className}
            ref={wrapRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: p.radius,
                background: bg,
                contain: "strict",
                ...p.style,
            }}
        >
            <span
                ref={probeRef}
                aria-hidden="true"
                style={{ display: "none" }}
            />
            {showStatic ? (
                <StaticParticles
                    props={p}
                    resA={resolved.a}
                    resB={resolved.b}
                />
            ) : (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "auto",
                        touchAction: p.touchCapture ? "none" : "auto",
                        cursor: p.interact === "off" ? "default" : "crosshair",
                    }}
                />
            )}
        </div>
    )
}

/* --------------------------------------------------------------------------- */
/* Property controls                                                           */
/* --------------------------------------------------------------------------- */

const SHAPES: { title: string; value: ShapeName }[] = [
    { title: "Heart", value: "heart" },
    { title: "Star", value: "star" },
    { title: "Disk", value: "disk" },
    { title: "Ring", value: "ring" },
    { title: "Galaxy", value: "galaxy" },
    { title: "Wave", value: "wave" },
    { title: "Infinity", value: "infinity" },
    { title: "Triangle", value: "triangle" },
    { title: "Square", value: "square" },
    { title: "Text", value: "text" },
]

/* test hook (tree-shaken by Framer's bundler? no — but harmless & tiny) */
export const __test = { quickColor, parseCssRgb, sampleShape }

addPropertyControls(ParticleShapes, {
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: SHAPES.map((s) => s.value),
        optionTitles: SHAPES.map((s) => s.title),
        defaultValue: defaultProps.shape,
        description: "The form the particle field assembles into.",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: defaultProps.text,
        description:
            "Only used when **Shape = Text**. Keep it short — particles sample the glyph pixels.",
        hidden: (props: Props) => props.shape !== "text",
    },
    count: {
        type: ControlType.Number,
        title: "Particles",
        min: 100,
        max: 12000,
        step: 100,
        displayStepper: true,
        defaultValue: defaultProps.count,
        description: "Capped automatically by **Quality** on weaker devices.",
    },
    size: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 1,
        max: 12,
        step: 0.1,
        defaultValue: defaultProps.size,
    },
    sizeVariance: {
        type: ControlType.Number,
        title: "Size Variance",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: defaultProps.sizeVariance,
    },
    shapeScale: {
        type: ControlType.Number,
        title: "Shape Scale",
        min: 0.1,
        max: 1.4,
        step: 0.01,
        defaultValue: defaultProps.shapeScale,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
        defaultValue: defaultProps.rotation,
    },
    offsetX: {
        type: ControlType.Number,
        title: "Position X",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: defaultProps.offsetX,
    },
    offsetY: {
        type: ControlType.Number,
        title: "Position Y",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: defaultProps.offsetY,
    },
    jitter: {
        type: ControlType.Number,
        title: "Fuzz",
        min: 0,
        max: 0.3,
        step: 0.005,
        defaultValue: defaultProps.jitter,
        description: "Random offset per particle — softens hard outlines.",
    },
    colorA: {
        type: ControlType.Color,
        title: "Color A",
        defaultValue: defaultProps.colorA,
    },
    colorB: {
        type: ControlType.Color,
        title: "Color B",
        defaultValue: defaultProps.colorB,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: defaultProps.opacity,
    },
    blend: {
        type: ControlType.SegmentedEnum,
        title: "Blend",
        options: ["add", "normal"],
        optionTitles: ["Glow (Add)", "Normal"],
        defaultValue: defaultProps.blend,
        description:
            "**Glow** stacks light additively — best on dark backgrounds.",
    },
    background: {
        type: ControlType.SegmentedEnum,
        title: "Backdrop",
        options: ["transparent", "dim", "solid"],
        optionTitles: ["None", "Dim", "Solid"],
        defaultValue: defaultProps.background,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Backdrop Color",
        defaultValue: defaultProps.backgroundColor,
        hidden: (props: Props) => props.background === "transparent",
    },
    radius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.radius,
    },

    interact: {
        type: ControlType.SegmentedEnum,
        title: "Pointer",
        options: ["repel", "attract", "swirl", "off"],
        optionTitles: ["Repel", "Attract", "Swirl", "Off"],
        defaultValue: defaultProps.interact,
        description:
            "How particles react to the cursor. **Repel** parts around it, **Attract** gathers to it, **Swirl** vortices around it. Stroke velocity is injected too — fast flicks throw the field.",
    },
    interactRadius: {
        type: ControlType.Number,
        title: "Pointer Radius",
        min: 0.05,
        max: 1.2,
        step: 0.01,
        defaultValue: defaultProps.interactRadius,
        hidden: (props: Props) => props.interact === "off",
    },
    interactStrength: {
        type: ControlType.Number,
        title: "Pointer Force",
        min: 0,
        max: 12,
        step: 0.1,
        defaultValue: defaultProps.interactStrength,
        hidden: (props: Props) => props.interact === "off",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Return Spring",
        min: 2,
        max: 90,
        step: 1,
        defaultValue: defaultProps.stiffness,
        description: "How firmly particles snap back to the shape.",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 0.5,
        max: 14,
        step: 0.1,
        defaultValue: defaultProps.damping,
        description: "Friction. Low values = floaty, high = tight.",
    },
    drift: {
        type: ControlType.Number,
        title: "Idle Drift",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: defaultProps.drift,
        description: "Ambient noise motion so the field feels alive at rest.",
    },
    twinkle: {
        type: ControlType.Boolean,
        title: "Twinkle",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: defaultProps.twinkle,
    },
    touchCapture: {
        type: ControlType.Boolean,
        title: "Touch Drag",
        enabledTitle: "Capture",
        disabledTitle: "Scroll",
        defaultValue: defaultProps.touchCapture,
        description:
            "*Capture* lets touch drags stir the particles but blocks page scrolling over the layer.",
    },

    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: defaultProps.animate,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 3,
        step: 0.05,
        defaultValue: defaultProps.speed,
        hidden: (props: Props) => !props.animate,
    },
    quality: {
        type: ControlType.SegmentedEnum,
        title: "Quality",
        options: ["auto", "high", "balanced", "fast", "ultra"],
        optionTitles: ["Auto", "High", "Balanced", "Fast", "Ultra"],
        defaultValue: defaultProps.quality,
        description:
            "Caps particle count and pixel ratio. **Auto** detects the device.",
    },
    staticMode: {
        type: ControlType.SegmentedEnum,
        title: "Static Mode",
        options: ["auto", "canvas", "always"],
        optionTitles: ["Auto", "SVG", "Live"],
        defaultValue: defaultProps.staticMode,
        description:
            "**Auto** follows `useIsStaticRenderer()` — a still SVG dot field on the Framer canvas and in exports, live particles on the published site. **SVG** forces the still everywhere; **Live** always runs WebGL.",
    },
    fallbackImage: {
        type: ControlType.Image,
        title: "Static Image",
        description:
            "Optional still shown instead of the SVG dot field while static.",
        hidden: (props: Props) => props.staticMode === "always",
    },
})
