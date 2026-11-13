/**
 * Riso Halftone — animated screen-print / risograph halftone background.
 * A single-file Framer code component. WebGL, no dependencies.
 */
import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------------------------------------------------------------------------
// Props & Types
// ---------------------------------------------------------------------------

type Shape = "circle" | "diamond" | "square" | "line"
type Quality = "low" | "standard" | "high"
type Mode = "flow" | "ripple" | "wave" | "pulse"
type Driver = "time" | "scroll" | "both"
type AudioStyle = "jitter" | "breathe" | "ripple"

interface AudioBus {
    level: number
    bass: number
    playing: boolean
    source: string
    beat?: number
    beatStrength?: number
}

// 🟢 显式声明 window 类型，去掉 any
declare global {
    interface Window {
        __risoAudio?: AudioBus
    }
}

const PRESETS: Record<
    string,
    { label: string; paper: string; ink: string; ink2?: string }
> = {
    "soft-rose": {
        label: "Soft · Rose + Cream",
        paper: "#B0677F",
        ink: "#E3C1A6",
    },
    "soft-sky": {
        label: "Soft · Sky + Pink + Plum",
        paper: "#8AC6F2",
        ink: "#F4C4DC",
        ink2: "#B872F0",
    },
    "soft-seafoam": {
        label: "Soft · Seafoam + Tangerine",
        paper: "#A3D2C3",
        ink: "#F2A27C",
        ink2: "#F6E8CB",
    },
    "soft-lime": {
        label: "Soft · Lime + Periwinkle",
        paper: "#C6DEA2",
        ink: "#6672D2",
    },
    "soft-mustard": {
        label: "Soft · Mustard + Moss",
        paper: "#D2C672",
        ink: "#97A46A",
        ink2: "#EFEDC4",
    },
    "fluo-blue-pink": {
        label: "Fluoro · Blue + Fluo Pink",
        paper: "#F4EFE6",
        ink: "#0078BF",
        ink2: "#FF48B0",
    },
    "fluo-teal-orange": {
        label: "Fluoro · Teal + Orange",
        paper: "#F4EFE6",
        ink: "#00838A",
        ink2: "#FF6C2F",
    },
    "fluo-black-red": {
        label: "Fluoro · Black + Bright Red",
        paper: "#F4EFE6",
        ink: "#000000",
        ink2: "#F15060",
    },
}
const PRESET_KEYS = ["custom", ...Object.keys(PRESETS)]

interface Props {
    preset: string
    paperOverride?: string
    inkOverride?: string
    ink2Override?: string
    paper: string
    ink: string
    shape: Shape
    cellSize: number
    angle: number
    dotSize: number
    scale: number
    density: number
    contrast: number
    speed: number
    drift: number
    direction: number
    seed: number
    mode: Mode
    frequency: number
    wobble: number
    originX: number
    originY: number
    driver: Driver
    scrollAmount: number
    secondInk: boolean
    ink2: string
    angle2: number
    offsetX: number
    offsetY: number
    variation: number
    overprint: boolean
    grain: number
    interactive: boolean
    mouseRadius: number
    mouseStrength: number
    audioReact: boolean
    audioStyle: AudioStyle
    audioAmount: number
    audioMotion: number
    animateOnCanvas: boolean
    quality: Quality
    style?: React.CSSProperties
}

const SHAPES: Shape[] = ["circle", "diamond", "square", "line"]
const MODES: Mode[] = ["flow", "ripple", "wave", "pulse"]
const DPR_CAP: Record<Quality, number> = { low: 1, standard: 1.5, high: 2 }

const TONE_LO = -0.25
const TONE_SPAN = 1.5
const TONE_MAX_TEXELS = 1024

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------
const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG_TONE = `
precision highp float;
uniform vec2  uRes;
uniform vec2  uToneRes;
uniform float uTime;
uniform float uScale;
uniform float uDensity;
uniform float uContrast;
uniform float uDrift;
uniform vec2  uDir;
uniform float uMode;
uniform float uFreq;
uniform float uWobble;
uniform vec2  uOrigin;
uniform float uSeed;
uniform float uLayer2;
uniform float uVariation;
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j  = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x  = x_ * ns.x + ns.yyyy;
    vec4 y  = y_ * ns.x + ns.yyyy;
    vec4 h  = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
        s += a * snoise(p);
        p = p * 2.03 + 17.1;
        a *= 0.5;
    }
    return s / 0.875;
}
float field(vec2 px, float z) {
    float unit = max(uRes.x, uRes.y);
    vec2 p = px / unit * uScale;
    p -= uDir * uTime * 0.4 * uDrift;
    float n = fbm(vec3(p + uSeed * 7.31, uTime * 0.6 + z));
    float f = n;
    vec2 q = px / unit;
    float TAU = 6.28318;
    if (uMode > 0.5 && uMode < 1.5) {
        vec2 o = uOrigin * uRes / unit;
        f = 0.55 * sin((length(q - o) + n * uWobble * 0.35 / uFreq) * uFreq * TAU - uTime * 3.0);
        f = mix(f, n, uWobble * 0.35);
    } else if (uMode > 1.5 && uMode < 2.5) {
        f = 0.55 * sin((dot(q, uDir) + n * uWobble * 0.35 / uFreq) * uFreq * TAU - uTime * 3.0);
        f = mix(f, n, uWobble * 0.35);
    } else if (uMode > 2.5) {
        f = n + 0.3 * sin(uTime * 2.0);
    }
    return (f * 0.5) * uContrast + 0.5 + (uDensity - 0.5) * 1.2;
}
float encode(float t) { return clamp((t - (${TONE_LO.toFixed(2)})) / ${TONE_SPAN.toFixed(2)}, 0.0, 1.0); }
void main() {
    vec2 px = gl_FragCoord.xy * (uRes / uToneRes);
    float t1 = field(px, 0.0);
    float t2 = uLayer2 > 0.5 ? field(px, uVariation * 4.0) : 0.0;
    gl_FragColor = vec4(encode(t1), encode(t2), 0.0, 1.0);
}
`

const FRAG_PRINT = `
precision highp float;
uniform sampler2D uTone;
uniform vec2  uRes;
uniform float uDpr;
uniform vec3  uPaper;
uniform vec3  uInk1;
uniform vec3  uInk2;
uniform float uCell;
uniform float uAngle1;
uniform float uAngle2;
uniform float uShape;
uniform float uDotMax;
uniform float uLayer2;
uniform float uOverprint;
uniform vec2  uOffset2;
uniform float uGrain;
uniform vec2  uMouse;
uniform float uMouseR;
uniform float uMouseS;
uniform float uSwell;
uniform vec4  uRingAge;
uniform vec4  uRingAmp;
uniform vec2  uOrigin;
uniform vec2  uJitter;
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
float ring(float d, float age, float amp) {
    float R = age * 0.8;
    float w = 0.045 + age * 0.05;
    float x = (d - R) / w;
    return amp * exp(-x * x) * exp(-age * 1.3);
}
float toneAt(vec2 cpx, float layer) {
    vec4 s = texture2D(uTone, cpx / uRes);
    float t = (layer < 0.5 ? s.r : s.g) * ${TONE_SPAN.toFixed(2)} + (${TONE_LO.toFixed(2)});
    vec2 d = cpx - uMouse;
    float r = uMouseR * uDpr;
    t += uMouseS * exp(-dot(d, d) / (r * r));
    t = clamp(t, 0.0, 1.0);
    float unit = max(uRes.x, uRes.y);
    float dist = length(cpx / unit - uOrigin * uRes / unit);
    float rg = ring(dist, uRingAge.x, uRingAmp.x) + ring(dist, uRingAge.y, uRingAmp.y)
             + ring(dist, uRingAge.z, uRingAmp.z) + ring(dist, uRingAge.w, uRingAmp.w);
    float grow = 1.0 + uSwell + rg;
    t = t * grow * grow + rg * 0.12;
    return clamp(t, 0.0, 1.0);
}
float screen(vec2 px, float ang, float layer) {
    float cell = uCell * uDpr;
    float c = cos(ang);
    float s = sin(ang);
    vec2 q = vec2(c * px.x + s * px.y, -s * px.x + c * px.y);
    vec2 g = q / cell;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 cq = (id + 0.5) * cell;
    vec2 cpx = vec2(c * cq.x - s * cq.y, s * cq.x + c * cq.y);
    float v = toneAt(cpx, layer);
    float r = sqrt(v) * uDotMax;
    float d;
    if (uShape < 0.5)      d = length(f);
    else if (uShape < 1.5) d = (abs(f.x) + abs(f.y)) * 0.7071;
    else if (uShape < 2.5) d = max(abs(f.x), abs(f.y)) * 0.886;
    else {
        d = abs(f.y);
        r = v * uDotMax * 0.8;
    }
    float aa = 0.8 / cell;
    return 1.0 - smoothstep(r - aa, r + aa, d);
}
void main() {
    vec2 px = gl_FragCoord.xy;
    float speck = hash(floor(px / max(uDpr, 1.0)));
    float inkLoss = 1.0 - uGrain * 0.35 * step(0.82, speck);
    vec2 j1 = uLayer2 > 0.5 ? vec2(0.0) : uJitter;
    float a1 = screen(px - j1 * uDpr, uAngle1, 0.0) * inkLoss;
    vec3 col = uPaper;
    if (uLayer2 > 0.5) {
        float a2 = screen(px - (uOffset2 + uJitter) * uDpr, uAngle2, 1.0) * inkLoss;
        col = mix(col, uInk2, a2);
        col = mix(col, uInk1, a1);
        col = mix(col, uInk1 * uInk2, a1 * a2 * uOverprint);
    } else {
        col = mix(col, uInk1, a1);
    }
    float g = hash(floor(px / max(uDpr, 1.0)) + 3.17) - 0.5;
    col += g * uGrain * 0.12;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

// ---------------------------------------------------------------------------
// Color parsing
// ---------------------------------------------------------------------------
type RGB = [number, number, number]
let colorCtx: CanvasRenderingContext2D | null = null
const rgbCache = new Map<string, RGB>()

function resolveVar(value: string, el: Element | null): string {
    const m = value.match(/^var\(\s*(--[^,\s)]+)\s*(?:,\s*(.+))?\)$/)
    if (!m) return value
    if (el) {
        const v = getComputedStyle(el).getPropertyValue(m[1]).trim()
        if (v) return resolveVar(v, el)
    }
    return m[2] ? resolveVar(m[2].trim(), el) : "#000"
}

function parseRGB(value: string): RGB {
    const hit = rgbCache.get(value)
    if (hit) return hit
    if (typeof document === "undefined") return [0, 0, 0]
    if (!colorCtx) {
        const c = document.createElement("canvas")
        c.width = c.height = 1
        colorCtx = c.getContext("2d", { willReadFrequently: true })
    }
    if (!colorCtx) return [0, 0, 0]
    colorCtx.clearRect(0, 0, 1, 1)
    colorCtx.fillStyle = "#000"
    colorCtx.fillStyle = value || "#000"
    colorCtx.fillRect(0, 0, 1, 1)
    const d = colorCtx.getImageData(0, 0, 1, 1).data
    const rgb: RGB = [d[0] / 255, d[1] / 255, d[2] / 255]
    if (rgbCache.size > 256) rgbCache.clear()
    rgbCache.set(value, rgb)
    return rgb
}

const TOKEN_TTL = 500
function makeColorReader(el: Element) {
    const tokens = new Map<string, { rgb: RGB; at: number }>()
    return (value: string): RGB => {
        const v = value || "#000"
        if (!v.startsWith("var(")) return parseRGB(v)
        const now = performance.now()
        const hit = tokens.get(v)
        if (hit && now - hit.at < TOKEN_TTL) return hit.rgb
        const rgb = parseRGB(resolveVar(v, el))
        tokens.set(v, { rgb, at: now })
        return rgb
    }
}

// ---------------------------------------------------------------------------
// Audio bus
// ---------------------------------------------------------------------------
// 🟢 修复 2：直接使用 window.__risoAudio，无 any，享受完整的 TypeScript 提示
function readBus(): AudioBus | undefined {
    if (typeof window === "undefined") return undefined
    return window.__risoAudio
}

// ---------------------------------------------------------------------------
// WebGL helpers
// ---------------------------------------------------------------------------
interface Pass {
    prog: WebGLProgram
    loc: Record<string, WebGLUniformLocation | null>
    aPos: number
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("[RisoHalftone] shader error:", gl.getShaderInfoLog(sh))
        gl.deleteShader(sh)
        return null
    }
    return sh
}

function makePass(
    gl: WebGLRenderingContext,
    frag: string,
    uniforms: readonly string[]
): Pass | null {
    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, frag)
    if (!vs || !fs) return null
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn("[RisoHalftone] link error:", gl.getProgramInfoLog(prog))
        return null
    }
    const loc: Record<string, WebGLUniformLocation | null> = {}
    for (const u of uniforms) loc[u] = gl.getUniformLocation(prog, u)
    return { prog, loc, aPos: gl.getAttribLocation(prog, "aPos") }
}

const TONE_UNIFORMS = [
    "uRes",
    "uToneRes",
    "uTime",
    "uScale",
    "uDensity",
    "uContrast",
    "uDrift",
    "uDir",
    "uMode",
    "uFreq",
    "uWobble",
    "uOrigin",
    "uSeed",
    "uLayer2",
    "uVariation",
] as const

const PRINT_UNIFORMS = [
    "uTone",
    "uRes",
    "uDpr",
    "uPaper",
    "uInk1",
    "uInk2",
    "uCell",
    "uAngle1",
    "uAngle2",
    "uShape",
    "uDotMax",
    "uLayer2",
    "uOverprint",
    "uOffset2",
    "uGrain",
    "uMouse",
    "uMouseR",
    "uMouseS",
    "uSwell",
    "uRingAge",
    "uRingAmp",
    "uOrigin",
    "uJitter",
] as const

const DEFAULTS: Omit<Props, "style"> = {
    preset: "custom",
    paper: "#FF8C47",
    ink: "#5B6EE8",
    shape: "circle" as Shape,
    cellSize: 12,
    angle: 0,
    dotSize: 0.62,
    scale: 1.5,
    density: 0.42,
    contrast: 3.2,
    speed: 0.25,
    drift: 0.3,
    direction: 330,
    seed: 1,
    mode: "flow" as Mode,
    frequency: 4,
    wobble: 0.4,
    originX: 50,
    originY: 50,
    driver: "time" as Driver,
    scrollAmount: 1.5,
    secondInk: false,
    ink2: "#FF4FA3",
    angle2: 45,
    offsetX: 3,
    offsetY: 2,
    variation: 0,
    overprint: true,
    grain: 0.25,
    interactive: true,
    mouseRadius: 160,
    mouseStrength: 0.6,
    audioReact: true,
    audioStyle: "jitter" as AudioStyle,
    audioAmount: 0.5,
    audioMotion: 0.5,
    animateOnCanvas: false,
    quality: "standard" as Quality,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function RisoHalftone(props: Props) {
    const p = { ...DEFAULTS, ...props } as Props
    const pr = PRESETS[p.preset]
    if (pr) {
        p.paper = p.paperOverride || pr.paper
        p.ink = p.inkOverride || pr.ink
        const ink2 = p.ink2Override || pr.ink2
        p.secondInk = !!ink2
        if (ink2) p.ink2 = ink2
    }
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const propsRef = useRef(p)
    propsRef.current = p

    const redrawRef = useRef<() => void>(() => {})
    useEffect(() => {
        redrawRef.current()
    })

    // 🟢 修复 1：依然保留 useIsStaticRenderer
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return

        const gl = canvas.getContext("webgl", {
            antialias: false,
            alpha: true,
            preserveDrawingBuffer: isCanvas || isStatic,
        }) as WebGLRenderingContext | null
        if (!gl) {
            setError("WebGL is not available")
            return
        }

        const color = makeColorReader(wrap)

        let tonePass: Pass | null = null
        let printPass: Pass | null = null
        let quad: WebGLBuffer | null = null
        let toneTex: WebGLTexture | null = null
        let toneFbo: WebGLFramebuffer | null = null
        let toneW = 0
        let toneH = 0

        const setup = () => {
            tonePass = makePass(gl, FRAG_TONE, TONE_UNIFORMS)
            printPass = makePass(gl, FRAG_PRINT, PRINT_UNIFORMS)
            if (!tonePass || !printPass) {
                setError("Shader failed to compile")
                return
            }
            quad = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, quad)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 3, -1, -1, 3]),
                gl.STATIC_DRAW
            )
            toneTex = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, toneTex)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            toneFbo = gl.createFramebuffer()
            toneW = toneH = 0
            setError(null)
        }
        setup()

        const sizeTone = () => {
            const spacing = Math.max(
                2,
                Math.max(2, propsRef.current.cellSize) * dpr * 0.5
            )
            const w = Math.min(
                TONE_MAX_TEXELS,
                Math.max(1, Math.ceil(width / spacing))
            )
            const h = Math.min(
                TONE_MAX_TEXELS,
                Math.max(1, Math.ceil(height / spacing))
            )
            if (w === toneW && h === toneH) return
            toneW = w
            toneH = h
            gl.bindTexture(gl.TEXTURE_2D, toneTex)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                w,
                h,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null
            )
            gl.bindFramebuffer(gl.FRAMEBUFFER, toneFbo)
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                toneTex,
                0
            )
            if (
                gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
                gl.FRAMEBUFFER_COMPLETE
            ) {
                setError("Tone buffer unsupported")
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        }

        let raf = 0
        let last = performance.now()
        let time = 0
        let visible = true
        let width = 0
        let height = 0
        let dpr = 1
        const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, on: 0, target: 0 }
        const scroll = { v: 0, target: 0 }
        const audio = {
            level: 0,
            swell: 0,
            prevPulse: 0,
            lastBeat: -1,
            beatSeen: -1,
        }
        const rings = [0, 0, 0, 0].map(() => ({ age: 99, amp: 0 }))
        const jit = { x: 0, y: 0, vx: 0, vy: 0 }

        const reduceMotion =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        const resize = () => {
            const rect = wrap.getBoundingClientRect()
            dpr = Math.min(
                window.devicePixelRatio || 1,
                DPR_CAP[propsRef.current.quality] ?? 1.5
            )
            width = Math.max(1, Math.round(rect.width * dpr))
            height = Math.max(1, Math.round(rect.height * dpr))
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
            }
        }

        const bindQuad = (pass: Pass) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, quad)
            gl.enableVertexAttribArray(pass.aPos)
            gl.vertexAttribPointer(pass.aPos, 2, gl.FLOAT, false, 0, 0)
        }

        const draw = () => {
            if (!tonePass || !printPass) return
            const q = propsRef.current
            const rad = Math.PI / 180
            const t = time + scroll.v
            sizeTone()

            const a = tonePass
            gl.bindTexture(gl.TEXTURE_2D, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, toneFbo)
            gl.viewport(0, 0, toneW, toneH)
            gl.useProgram(a.prog)
            bindQuad(a)
            gl.uniform2f(a.loc.uRes, width, height)
            gl.uniform2f(a.loc.uToneRes, toneW, toneH)
            gl.uniform1f(a.loc.uTime, t)
            gl.uniform1f(a.loc.uScale, q.scale)
            gl.uniform1f(a.loc.uDensity, q.density)
            gl.uniform1f(a.loc.uContrast, q.contrast)
            gl.uniform1f(a.loc.uDrift, q.drift)
            gl.uniform2f(
                a.loc.uDir,
                Math.cos(q.direction * rad),
                -Math.sin(q.direction * rad)
            )
            gl.uniform1f(a.loc.uMode, Math.max(0, MODES.indexOf(q.mode)))
            gl.uniform1f(a.loc.uFreq, q.frequency)
            gl.uniform1f(a.loc.uWobble, q.wobble)
            gl.uniform2f(a.loc.uOrigin, q.originX / 100, 1 - q.originY / 100)
            gl.uniform1f(a.loc.uSeed, q.seed)
            gl.uniform1f(a.loc.uLayer2, q.secondInk ? 1 : 0)
            gl.uniform1f(a.loc.uVariation, q.variation)
            gl.drawArrays(gl.TRIANGLES, 0, 3)

            const b = printPass
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0, 0, width, height)
            gl.useProgram(b.prog)
            bindQuad(b)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, toneTex)
            gl.uniform1i(b.loc.uTone, 0)
            gl.uniform2f(b.loc.uRes, width, height)
            gl.uniform1f(b.loc.uDpr, dpr)
            gl.uniform3fv(b.loc.uPaper, color(q.paper))
            gl.uniform3fv(b.loc.uInk1, color(q.ink))
            gl.uniform3fv(b.loc.uInk2, color(q.ink2))
            gl.uniform1f(b.loc.uCell, Math.max(2, q.cellSize))
            gl.uniform1f(b.loc.uAngle1, q.angle * rad)
            gl.uniform1f(b.loc.uAngle2, q.angle2 * rad)
            gl.uniform1f(b.loc.uShape, Math.max(0, SHAPES.indexOf(q.shape)))
            gl.uniform1f(b.loc.uDotMax, q.dotSize)
            gl.uniform1f(b.loc.uLayer2, q.secondInk ? 1 : 0)
            gl.uniform1f(b.loc.uOverprint, q.overprint ? 1 : 0)
            gl.uniform2f(b.loc.uOffset2, q.offsetX, -q.offsetY)
            gl.uniform1f(b.loc.uGrain, q.grain)
            gl.uniform2f(b.loc.uMouse, mouse.x, mouse.y)
            gl.uniform1f(b.loc.uMouseR, Math.max(1, q.mouseRadius))
            gl.uniform1f(
                b.loc.uMouseS,
                q.interactive ? q.mouseStrength * mouse.on : 0
            )
            const music = q.audioReact ? q.audioAmount : 0
            const style = styleOf(q)
            const breathe = style === "breathe" ? 1 : 0
            const ripple = style === "ripple" ? 1 : 0
            gl.uniform1f(b.loc.uSwell, music * breathe * audio.swell * 0.8)
            gl.uniform2f(b.loc.uJitter, jit.x, -jit.y)
            gl.uniform4f(
                b.loc.uRingAge,
                rings[0].age,
                rings[1].age,
                rings[2].age,
                rings[3].age
            )
            gl.uniform4f(
                b.loc.uRingAmp,
                rings[0].amp * music * ripple * 1.6,
                rings[1].amp * music * ripple * 1.6,
                rings[2].amp * music * ripple * 1.6,
                rings[3].amp * music * ripple * 1.6
            )
            gl.uniform2f(b.loc.uOrigin, q.originX / 100, 1 - q.originY / 100)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const styleOf = (q: Props): AudioStyle =>
            q.audioStyle === "breathe" || q.audioStyle === "ripple"
                ? q.audioStyle
                : "jitter"

        const audioOn = () => {
            const q = propsRef.current
            return q.audioReact && !reduceMotion && !isCanvas
        }

        const settling = () =>
            Math.abs(scroll.target - scroll.v) > 1e-4 ||
            Math.abs(mouse.target - mouse.on) > 1e-3 ||
            (mouse.on > 1e-3 &&
                Math.abs(mouse.tx - mouse.x) + Math.abs(mouse.ty - mouse.y) >
                    0.5) ||
            audio.level > 1e-3 ||
            audio.swell > 1e-3 ||
            Math.abs(jit.x) +
                Math.abs(jit.y) +
                Math.abs(jit.vx) +
                Math.abs(jit.vy) >
                0.02 ||
            rings.some((r) => r.amp > 0 && r.age < 4)

        const shouldAnimate = () => {
            const q = propsRef.current
            if (reduceMotion) return false
            if (isCanvas && !q.animateOnCanvas) return false
            const clock = q.driver !== "scroll" && q.speed > 0
            const music = audioOn() && !!readBus()?.playing
            return clock || music || settling()
        }

        const follow = (
            v: number,
            target: number,
            dt: number,
            rise: number,
            fall: number
        ) => {
            const tau = target > v ? rise : fall
            return v + (target - v) * (1 - Math.exp(-dt / tau))
        }

        const frame = (now: number) => {
            raf = 0
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const q = propsRef.current

            let hit = 0
            if (audioOn()) {
                const bus = readBus()
                const on = !!bus?.playing
                audio.level = follow(
                    audio.level,
                    on ? bus!.level : 0,
                    dt,
                    1.0,
                    1.6
                )

                if (bus && typeof bus.beat === "number") {
                    if (
                        audio.beatSeen >= 0 &&
                        bus.beat !== audio.beatSeen &&
                        on
                    ) {
                        hit = Math.max(0.35, Math.min(1, bus.beatStrength ?? 1))
                    }
                    audio.beatSeen = bus.beat
                } else {
                    const pulse = on ? bus!.bass : 0
                    const t = now / 1000
                    if (
                        on &&
                        pulse > 0.55 &&
                        audio.prevPulse < 0.4 &&
                        t - audio.lastBeat > 0.24
                    ) {
                        audio.lastBeat = t
                        hit = Math.min(1, pulse)
                    }
                    audio.prevPulse = pulse
                }
            } else {
                audio.level = audio.prevPulse = 0
            }

            if (hit > 0) {
                const style = styleOf(propsRef.current)
                if (style === "jitter") {
                    const mag = (2 + propsRef.current.audioAmount * 14) * hit
                    const ang = Math.random() * Math.PI * 2
                    jit.x = Math.cos(ang) * mag
                    jit.y = Math.sin(ang) * mag
                    jit.vx = jit.vy = 0
                } else if (style === "breathe") {
                    audio.swell = Math.max(audio.swell, hit)
                } else {
                    rings.shift()
                    rings.push({ age: 0, amp: 0.55 + 0.45 * hit })
                }
            }

            audio.swell *= Math.exp(-dt / 0.28)
            for (const r of rings) r.age = Math.min(99, r.age + dt)
            {
                const k = Math.pow(2 * Math.PI * 7, 2)
                const c = 2 * 0.32 * Math.sqrt(k)
                const n = 4
                const h = dt / n
                for (let i = 0; i < n; i++) {
                    jit.vx += (-k * jit.x - c * jit.vx) * h
                    jit.vy += (-k * jit.y - c * jit.vy) * h
                    jit.x += jit.vx * h
                    jit.y += jit.vy * h
                }
                if (
                    Math.abs(jit.x) +
                        Math.abs(jit.y) +
                        Math.abs(jit.vx) +
                        Math.abs(jit.vy) <
                    0.02
                ) {
                    jit.x = jit.y = jit.vx = jit.vy = 0
                }
            }

            if (!reduceMotion && q.driver !== "scroll") {
                const boost =
                    1 + (q.audioReact ? q.audioMotion * audio.level : 0)
                time += dt * q.speed * boost
            }

            const ks = 1 - Math.pow(0.0005, dt)
            scroll.v += (scroll.target - scroll.v) * ks

            const k = 1 - Math.pow(0.001, dt)
            mouse.x += (mouse.tx - mouse.x) * k
            mouse.y += (mouse.ty - mouse.y) * k
            mouse.on += (mouse.target - mouse.on) * k

            draw()
            if (visible && shouldAnimate()) raf = requestAnimationFrame(frame)
        }

        const kick = () => {
            if (raf) return
            draw()
            if (visible && shouldAnimate()) {
                last = performance.now()
                raf = requestAnimationFrame(frame)
            }
        }

        redrawRef.current = () => {
            resize()
            kick()
        }

        if (isStatic) {
            redrawRef.current = () => {
                resize()
                draw()
            }
            resize()
            draw()
            return () => {
                if (gl) {
                    if (quad) gl.deleteBuffer(quad)
                    if (toneTex) gl.deleteTexture(toneTex)
                    if (toneFbo) gl.deleteFramebuffer(toneFbo)
                }
                redrawRef.current = () => {}
            }
        }

        const ro = new ResizeObserver(() => {
            resize()
            kick()
        })
        ro.observe(wrap)

        const io =
            !isCanvas && typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(([entry]) => {
                      visible = entry.isIntersecting
                      if (visible) kick()
                  })
                : null
        io?.observe(wrap)

        const onMove = (e: PointerEvent) => {
            if (!propsRef.current.interactive || isCanvas) return
            const r = wrap.getBoundingClientRect()
            const x = e.clientX - r.left
            const y = e.clientY - r.top
            const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height
            mouse.tx = x * dpr
            mouse.ty = (r.height - y) * dpr
            if (mouse.on < 0.01) {
                mouse.x = mouse.tx
                mouse.y = mouse.ty
            }
            mouse.target = inside ? 1 : 0
            kick()
        }
        const onScroll = (e: Event) => {
            const q = propsRef.current
            if (isCanvas || q.driver === "time") return
            const t = e.target as Element | Document
            const y =
                t && (t as Element).scrollTop !== undefined && t !== document
                    ? (t as Element).scrollTop
                    : window.scrollY || document.documentElement.scrollTop
            scroll.target = (y / 1000) * q.scrollAmount
            kick()
        }
        window.addEventListener("scroll", onScroll, {
            passive: true,
            capture: true,
        })

        const onLeave = () => {
            mouse.target = 0
            kick()
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        document.documentElement.addEventListener("pointerleave", onLeave)

        const onAudio = () => kick()
        window.addEventListener("riso-audio", onAudio)

        const onLost = (e: Event) => {
            e.preventDefault()
            cancelAnimationFrame(raf)
            raf = 0
        }
        const onRestored = () => {
            setup()
            kick()
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        resize()
        kick()

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            io?.disconnect()
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("scroll", onScroll, {
                capture: true,
            } as EventListenerOptions)
            window.removeEventListener("riso-audio", onAudio)
            document.documentElement.removeEventListener(
                "pointerleave",
                onLeave
            )
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            redrawRef.current = () => {}
        }
    }, [isCanvas, isStatic])

    return (
        <div
            ref={wrapRef}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 20,
                minHeight: 20,
                overflow: "hidden",
                backgroundColor: p.paper,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
            {error && isCanvas && (
                <div
                    style={{
                        position: "absolute",
                        left: 12,
                        bottom: 12,
                        padding: "6px 10px",
                        borderRadius: 6,
                        font: "12px/1.3 system-ui, sans-serif",
                        color: "#fff",
                        background: "rgba(0,0,0,0.6)",
                    }}
                >
                    Riso Halftone: {error}
                </div>
            )}
        </div>
    )
}

RisoHalftone.displayName = "Riso Halftone"

// ---------------------------------------------------------------------------
// Property controls
// ---------------------------------------------------------------------------

addPropertyControls(RisoHalftone, {
    // Colours
    preset: {
        type: ControlType.Enum,
        defaultValue: "custom",
        title: "Start From",
        options: PRESET_KEYS,
        optionTitles: PRESET_KEYS.map((k) =>
            k === "custom" ? "Custom" : PRESETS[k].label
        ),
        description:
            "Pick a palette, then use the overrides to swap any single colour. Custom: set every colour yourself.",
    },
    paperOverride: {
        type: ControlType.Color,
        title: "Paper Override",
        optional: true,
        hidden: (q: Props) => !PRESETS[q.preset],
    },
    inkOverride: {
        type: ControlType.Color,
        title: "Ink Override",
        optional: true,
        hidden: (q: Props) => !PRESETS[q.preset],
    },
    ink2Override: {
        type: ControlType.Color,
        title: "Ink 2 Override",
        optional: true,
        description: "Leave empty to keep the palette's colours.",
        hidden: (q: Props) => !PRESETS[q.preset],
    },
    paper: {
        type: ControlType.Color,
        defaultValue: "#FF8C47",
        title: "Paper",
        hidden: (q: Props) => !!PRESETS[q.preset],
    },
    ink: {
        type: ControlType.Color,
        defaultValue: "#5B6EE8",
        title: "Ink",
        hidden: (q: Props) => !!PRESETS[q.preset],
    },

    // Screen
    shape: {
        type: ControlType.Enum,
        defaultValue: "circle",
        title: "Dot",
        options: SHAPES,
        optionTitles: ["Circle", "Diamond", "Square", "Line"],
        displaySegmentedControl: true,
    },
    cellSize: {
        type: ControlType.Number,
        defaultValue: 12,
        title: "Cell",
        min: 3,
        max: 80,
        step: 1,
        unit: "px",
    },
    angle: {
        type: ControlType.Number,
        defaultValue: 0,
        title: "Angle",
        min: 0,
        max: 90,
        step: 1,
        unit: "°",
    },
    dotSize: {
        type: ControlType.Number,
        defaultValue: 0.62,
        title: "Dot Max",
        min: 0.2,
        max: 0.75,
        step: 0.01,
        description: "Above 0.5 dots merge into solid ink.",
    },

    // Pattern
    scale: {
        type: ControlType.Number,
        defaultValue: 1.5,
        title: "Blob Scale",
        min: 0.3,
        max: 8,
        step: 0.1,
    },
    density: {
        type: ControlType.Number,
        defaultValue: 0.42,
        title: "Density",
        min: 0,
        max: 1,
        step: 0.01,
    },
    contrast: {
        type: ControlType.Number,
        defaultValue: 3.2,
        title: "Contrast",
        min: 0.5,
        max: 6,
        step: 0.1,
    },
    speed: {
        type: ControlType.Number,
        defaultValue: 0.25,
        title: "Speed",
        min: 0,
        max: 2,
        step: 0.01,
    },
    drift: {
        type: ControlType.Number,
        defaultValue: 0.3,
        title: "Drift",
        min: 0,
        max: 2,
        step: 0.01,
    },
    direction: {
        type: ControlType.Number,
        defaultValue: 330,
        title: "Direction",
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
        description: "0° right, 90° down. Also steers Wave.",
    },
    seed: {
        type: ControlType.Number,
        defaultValue: 1,
        title: "Seed",
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },

    // Motion
    mode: {
        type: ControlType.Enum,
        defaultValue: "flow",
        title: "Motion",
        options: MODES,
        optionTitles: ["Flow", "Ripple", "Wave", "Pulse"],
    },
    frequency: {
        type: ControlType.Number,
        defaultValue: 4,
        title: "Frequency",
        min: 0.5,
        max: 20,
        step: 0.1,
        hidden: (q: Props) => q.mode !== "ripple" && q.mode !== "wave",
    },
    wobble: {
        type: ControlType.Number,
        defaultValue: 0.4,
        title: "Wobble",
        min: 0,
        max: 1,
        step: 0.01,
        description: "Bends rings and bands with organic noise.",
        hidden: (q: Props) => q.mode !== "ripple" && q.mode !== "wave",
    },
    originX: {
        type: ControlType.Number,
        defaultValue: 50,
        title: "Origin X",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description: "Centre of Ripple motion and of beat ripples.",
        hidden: (q: Props) =>
            q.mode !== "ripple" && !(q.audioReact && q.audioStyle === "ripple"),
    },
    originY: {
        type: ControlType.Number,
        defaultValue: 50,
        title: "Origin Y",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (q: Props) =>
            q.mode !== "ripple" && !(q.audioReact && q.audioStyle === "ripple"),
    },
    driver: {
        type: ControlType.Enum,
        defaultValue: "time",
        title: "Driven By",
        options: ["time", "scroll", "both"],
        optionTitles: ["Time", "Scroll", "Both"],
        displaySegmentedControl: true,
        description: "Scroll moves the print as the page scrolls.",
    },
    scrollAmount: {
        type: ControlType.Number,
        defaultValue: 1.5,
        title: "Scroll Amt",
        min: 0.1,
        max: 6,
        step: 0.1,
        hidden: (q: Props) => q.driver === "time",
    },

    // Second ink
    secondInk: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "2nd Ink",
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (q: Props) => !!PRESETS[q.preset],
    },
    ink2: {
        type: ControlType.Color,
        defaultValue: "#FF4FA3",
        title: "Ink 2",
        hidden: (q: Props) => !!PRESETS[q.preset] || !q.secondInk,
    },
    angle2: {
        type: ControlType.Number,
        defaultValue: 45,
        title: "Angle 2",
        min: 0,
        max: 90,
        step: 1,
        unit: "°",
        hidden: (q: Props) =>
            !(PRESETS[q.preset]
                ? !!(PRESETS[q.preset].ink2 || q.ink2Override)
                : q.secondInk),
    },
    offsetX: {
        type: ControlType.Number,
        defaultValue: 3,
        title: "Misreg X",
        min: -20,
        max: 20,
        step: 0.5,
        unit: "px",
        hidden: (q: Props) =>
            !(PRESETS[q.preset]
                ? !!(PRESETS[q.preset].ink2 || q.ink2Override)
                : q.secondInk),
    },
    offsetY: {
        type: ControlType.Number,
        defaultValue: 2,
        title: "Misreg Y",
        min: -20,
        max: 20,
        step: 0.5,
        unit: "px",
        hidden: (q: Props) =>
            !(PRESETS[q.preset]
                ? !!(PRESETS[q.preset].ink2 || q.ink2Override)
                : q.secondInk),
    },
    variation: {
        type: ControlType.Number,
        defaultValue: 0,
        title: "Variation",
        min: 0,
        max: 1,
        step: 0.01,
        description: "0 = both inks print the same image.",
        hidden: (q: Props) =>
            !(PRESETS[q.preset]
                ? !!(PRESETS[q.preset].ink2 || q.ink2Override)
                : q.secondInk),
    },
    overprint: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Overprint",
        enabledTitle: "Multiply",
        disabledTitle: "Off",
        hidden: (q: Props) =>
            !(PRESETS[q.preset]
                ? !!(PRESETS[q.preset].ink2 || q.ink2Override)
                : q.secondInk),
    },

    // Texture
    grain: {
        type: ControlType.Number,
        defaultValue: 0.25,
        title: "Grain",
        min: 0,
        max: 1,
        step: 0.01,
    },

    // Interaction
    interactive: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Cursor",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    mouseRadius: {
        type: ControlType.Number,
        defaultValue: 160,
        title: "Radius",
        min: 20,
        max: 600,
        step: 5,
        unit: "px",
        hidden: (q: Props) => !q.interactive,
    },
    mouseStrength: {
        type: ControlType.Number,
        defaultValue: 0.6,
        title: "Strength",
        min: -1,
        max: 1,
        step: 0.01,
        description: "Negative values clear ink away from the cursor.",
        hidden: (q: Props) => !q.interactive,
    },

    // Music
    audioReact: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Music",
        enabledTitle: "React",
        disabledTitle: "Off",
        description:
            "Follows any Riso Player on the page. No player, no effect.",
    },
    audioStyle: {
        type: ControlType.Enum,
        defaultValue: "jitter",
        title: "Reaction",
        options: ["jitter", "breathe", "ripple"],
        optionTitles: ["Jitter", "Breathe", "Ripple"],
        displaySegmentedControl: true,
        description:
            "Jitter: the print slips out of register on each beat (best with 2nd Ink). Breathe: dots swell. Ripple: rings spread from Origin.",
        hidden: (q: Props) => !q.audioReact,
    },
    audioAmount: {
        type: ControlType.Number,
        defaultValue: 0.5,
        title: "Strength",
        min: 0,
        max: 1,
        step: 0.01,
        description: "How strongly the print reacts to each beat.",
        hidden: (q: Props) => !q.audioReact,
    },
    audioMotion: {
        type: ControlType.Number,
        defaultValue: 0.5,
        title: "Flow Push",
        min: 0,
        max: 2,
        step: 0.05,
        description: "Louder passages flow faster (eased).",
        hidden: (q: Props) => !q.audioReact,
    },

    // Performance
    animateOnCanvas: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "Canvas Preview",
        enabledTitle: "Animate",
        disabledTitle: "Still",
    },
    quality: {
        type: ControlType.Enum,
        defaultValue: "standard",
        title: "Quality",
        options: ["low", "standard", "high"],
        optionTitles: ["Low", "Standard", "High"],
        displaySegmentedControl: true,
        description: "Caps pixel density. Low is kindest to phones.",
    },
})
