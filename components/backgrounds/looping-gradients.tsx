// /code/AnimatedLoopingGradients.tsx
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

import { motion } from "framer-motion"

// --- Component Types ---
type AnimationMode = "liquid" | "cloud" | "aurora"

type AnimatedLoopingGradientsProps = {
    mode?: AnimationMode
    speed?: number
    seed?: number
    loopSeconds?: number
    blend?: number

    /** Exactly 3 colors (Marketplace clarity) */
    colors?: string[]

    cornerRadius?: number

    /** Manual preview toggle (the only animation toggle exposed) */
    preview?: boolean

    /** Sharpness vs speed (maps to DPR cap; also influences shader detail) */
    quality?: number

    /** Auto quality drop when frames get slow */
    autoDownscale?: boolean

    style?: React.CSSProperties
    className?: string
    width?: number | string
    height?: number | string

    [key: string]: any
}

type AnimatedLoopingGradientsInnerProps = {
    mode: AnimationMode
    speed: number
    seed: number
    loopSeconds: number
    blend: number

    color1: string
    color2: string
    color3: string

    /** already resolved "should animate" */
    preview: boolean

    /** DPR cap */
    quality: number

    /** shader complexity derived from quality */
    octaves: 2 | 4

    /** Auto-downscale */
    autoDownscale: boolean
}

// ----------------------
// Extra TS types
// ----------------------
interface WebGLContextAttributesWithPowerPreference
    extends WebGLContextAttributes {
    powerPreference?: "default" | "high-performance" | "low-power"
}

interface WindowWithResizeObserver extends Window {
    ResizeObserver?: typeof ResizeObserver
}

interface MediaQueryListWithLegacy extends MediaQueryList {
    addListener?(
        listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void
    ): void
    removeListener?(
        listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void
    ): void
}

// ----------------------
// Vertex Shader
// ----------------------
const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

// ----------------------
// Fragment Shader factory
// - Compiles TWO variants for real perf gains:
//   OCTAVES=4 (high), OCTAVES=2 (performance)
// ----------------------
const createFragmentShaderSource = (precision: string, octaves: 2 | 4) => `
precision ${precision} float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_seed;
uniform float u_loopSeconds;
uniform float u_blend;
uniform float u_mode; // 0=liquid, 1=cloud, 2=aurora

uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

#define OCTAVES ${octaves}

// ---- value noise ----
float hash(vec2 p) {
  p += vec2(u_seed * 13.17, u_seed * 7.31);
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x)
       + (c - a) * u.y * (1.0 - u.x)
       + (d - b) * u.x * u.y;
}

// ---- FBM (constant loop count via OCTAVES) ----
float fbm(vec2 p) {
  float f = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < OCTAVES; i++) {
    f += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return f;
}

// ---- Liquid Mode helpers ----
vec2 warpField(vec2 p, vec2 offset) {
  float n1 = noise(p * 1.3 + offset * 0.7);
  float n2 = noise(p * 1.7 - offset * 1.1);
  return vec2(n1 - 0.5, n2 - 0.5);
}

vec3 liquidMode(vec2 p, float phase, float amp) {
  vec2 off1 = vec2(u_seed, u_seed * 1.37);
  vec2 off2 = vec2(u_seed + 10.0, -u_seed * 0.73);

  vec2 q1 = p + warpField(p, off1) * amp;
  vec2 q2 = p + warpField(p, off2) * amp;

  float f1a = noise(q1 * 1.7 + vec2(3.1, -1.7));
  float f1b = noise(q2 * 1.9 + vec2(-2.3, 0.8));
  float f2a = noise(q1 * 2.1 + vec2(-1.5, 2.2));
  float f2b = noise(q2 * 1.6 + vec2(0.9, -3.3));
  float f3a = noise(q1 * 1.3 + vec2(1.7, 2.9));
  float f3b = noise(q2 * 2.4 + vec2(-2.7, -1.1));

  float s = 0.5 - 0.5 * cos(phase * 6.28318);

  float f1 = mix(f1a, f1b, s);
  float f2 = mix(f2a, f2b, s);
  float f3 = mix(f3a, f3b, s);

  return vec3(f1, f2, f3);
}

// ---- Cloud Mode helpers ----
vec2 rotate(vec2 p, float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p;
}

vec3 cloudMode(vec2 p, float t, float amp) {
  float baseSpeed = mix(0.2, 0.8, clamp(amp, 0.0, 1.0));

  float time1 = t * baseSpeed;
  float time2 = t * baseSpeed * 0.7;
  float time3 = t * baseSpeed * 1.3;

  vec2 p1 = rotate(p * 0.9,  time1 * 0.3);
  vec2 p2 = rotate(p * 1.1, -time2 * 0.25);
  vec2 p3 = rotate(p * 1.4,  time3 * 0.2);

  float f1 = fbm(p1 * 1.3 + vec2(time1 * 0.15, -time1 * 0.05));
  float f2 = fbm(p2 * 1.6 + vec2(-time2 * 0.10,  time2 * 0.12));
  float f3 = fbm(p3 * 1.9 + vec2(time3 * 0.07,  time3 * 0.09));

  return vec3(f1, f2, f3);
}

// ---- Aurora Mode helpers ----
vec3 auroraMode(vec2 p, float t, float amp) {
  vec2 p0 = p;
  p0.x *= 2.0;

  float noise1 = fbm(p0 * vec2(1.0, 0.1) + t * vec2(0.0, 0.1) * amp) * 2.0;
  float noise2 = fbm(p0 * vec2(0.8, 0.05) + t * vec2(0.0, 0.2) * amp) * 2.0;
  float noise3 = fbm(p0 * vec2(1.2, 0.15) + t * vec2(0.0, 0.05) * amp) * 2.0;

  float f1 = noise1;
  float f2 = noise2;
  float f3 = noise3;

  float expVal = 5.0;
  float minBase = 0.01;
  f1 = max(minBase, pow(clamp(f1, 0.0, 1.0), expVal));
  f2 = max(minBase, pow(clamp(f2, 0.0, 1.0), expVal));
  f3 = max(minBase, pow(clamp(f3, 0.0, 1.0), expVal));

  return vec3(f1, f2, f3);
}

// ---- Dithering helper ----
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = v_uv;
  vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float loopSec = max(u_loopSeconds, 0.1);

  float speedFactor = clamp(u_speed, 0.0, 2.0);
  float effectiveSpeed = mix(0.0, 2.0, speedFactor);
  float rawT = u_time * effectiveSpeed;

  float phase = mod(rawT, loopSec) / loopSec;
  float amp = mix(0.15, 1.2, speedFactor);

  vec3 features;
  if (u_mode < 0.5) {
    features = liquidMode(p, phase, amp);
  } else if (u_mode < 1.5) {
    features = cloudMode(p, rawT, amp);
  } else {
    features = auroraMode(p, rawT, amp);
  }

  float f1 = features.x;
  float f2 = features.y;
  float f3 = features.z;

  float blendAmount = clamp(u_blend, 0.0, 1.0);
  float expVal = mix(3.0, 1.0, blendAmount);

  float w1 = pow(clamp(f1, 0.0, 1.0), expVal);
  float w2 = pow(clamp(f2, 0.0, 1.0), expVal);
  float w3 = pow(clamp(f3, 0.0, 1.0), expVal);

  float minBase = 0.16;
  w1 = max(w1, minBase);
  w2 = max(w2, minBase);
  w3 = max(w3, minBase);

  float sumW = w1 + w2 + w3 + 1e-6;
  w1 /= sumW;
  w2 /= sumW;
  w3 /= sumW;

  vec3 grad = u_color1 * w1 + u_color2 * w2 + u_color3 * w3;

  float ditherStrength = 1.0 / 255.0;
  float dither = (rand(gl_FragCoord.xy + u_time) - 0.5) * ditherStrength;
  grad += vec3(dither);
  grad = clamp(grad, 0.0, 1.0);

  gl_FragColor = vec4(grad, 1.0);
}
`

// --------- WebGL helpers ---------
function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) || "unknown error"
        console.warn("AnimatedLoopingGradients shader compile error:", info)
        gl.deleteShader(shader)
        return null
    }
    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vs: string,
    fs: string
): { program: WebGLProgram; v: WebGLShader; f: WebGLShader } | null {
    const v = createShader(gl, gl.VERTEX_SHADER, vs)
    const f = createShader(gl, gl.FRAGMENT_SHADER, fs)
    if (!v || !f) {
        if (v) gl.deleteShader(v)
        if (f) gl.deleteShader(f)
        return null
    }

    const program = gl.createProgram()
    if (!program) {
        gl.deleteShader(v)
        gl.deleteShader(f)
        return null
    }

    gl.attachShader(program, v)
    gl.attachShader(program, f)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program) || "unknown error"
        console.warn("AnimatedLoopingGradients program link error:", info)
        gl.deleteShader(v)
        gl.deleteShader(f)
        gl.deleteProgram(program)
        return null
    }

    return { program, v, f }
}

// -------- Robust color parser --------
const colorCache = new Map<string, [number, number, number]>()

function parseHexColor(hex: string): [number, number, number] | null {
    const match = hex.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    if (!match) return null
    let h = match[1]
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    const r = parseInt(h.slice(0, 2), 16) / 255
    const g = parseInt(h.slice(2, 4), 16) / 255
    const b = parseInt(h.slice(4, 6), 16) / 255
    return [r, g, b]
}

function parseColorToRGB(
    input: string | null | undefined,
    helperDiv: HTMLDivElement | null
): [number, number, number] | null {
    if (typeof input !== "string" || input.trim() === "") return null
    const normalized = input.trim()

    const cached = colorCache.get(normalized)
    if (cached) return cached

    const hexParsed = parseHexColor(normalized)
    if (hexParsed) {
        colorCache.set(normalized, hexParsed)
        return hexParsed
    }

    const direct = normalized.match(
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i
    )
    if (direct) {
        const r = Math.min(255, parseInt(direct[1], 10)) / 255
        const g = Math.min(255, parseInt(direct[2], 10)) / 255
        const b = Math.min(255, parseInt(direct[3], 10)) / 255
        const result: [number, number, number] = [r, g, b]
        colorCache.set(normalized, result)
        return result
    }

    if (typeof window === "undefined" || typeof document === "undefined")
        return null
    if (!helperDiv) return null

    try {
        helperDiv.style.color = normalized
        const computed = window.getComputedStyle(helperDiv).color
        const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
        if (!match) return null
        const r = parseInt(match[1], 10) / 255
        const g = parseInt(match[2], 10) / 255
        const b = parseInt(match[3], 10) / 255
        const result: [number, number, number] = [r, g, b]
        colorCache.set(normalized, result)
        return result
    } catch {
        return null
    }
}

// -----------------------
// Custom hook: media listener
// -----------------------
function useMediaListener(query: string): boolean {
    const getInitial = () => {
        if (typeof window === "undefined") return false
        return window.matchMedia(query).matches
    }

    const [matches, setMatches] = React.useState<boolean>(getInitial)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const rawMq = window.matchMedia(query)
        const mq = rawMq as MediaQueryListWithLegacy

        const handleChange = (event: MediaQueryListEvent) =>
            setMatches(event.matches)
        setMatches(mq.matches)

        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", handleChange)
            return () => mq.removeEventListener("change", handleChange)
        } else if (typeof mq.addListener === "function") {
            mq.addListener(handleChange)
            return () => mq.removeListener(handleChange)
        }
    }, [query])

    return matches
}

// -----------------------
// Auto power preference
// -----------------------
function getAutoPowerPreference(reducedMotion: boolean) {
    const navAny = typeof navigator !== "undefined" ? (navigator as any) : null
    const saveData = Boolean(navAny?.connection?.saveData)
    if (reducedMotion || saveData) return "low-power"
    return "default"
}

// -----------------------
// Inner WebGL renderer
// -----------------------
type ShaderSettings = {
    mode: number
    speed: number
    seed: number
    loopSeconds: number
    blend: number
    c1: [number, number, number]
    c2: [number, number, number]
    c3: [number, number, number]
}

type Uniforms = {
    uRes: WebGLUniformLocation | null
    uTime: WebGLUniformLocation | null
    uSpeed: WebGLUniformLocation | null
    uSeed: WebGLUniformLocation | null
    uLoopSeconds: WebGLUniformLocation | null
    uBlend: WebGLUniformLocation | null
    uMode: WebGLUniformLocation | null
    uColor1: WebGLUniformLocation | null
    uColor2: WebGLUniformLocation | null
    uColor3: WebGLUniformLocation | null
}

type ProgramBundle = {
    gl: WebGLRenderingContext
    program: WebGLProgram
    v: WebGLShader
    f: WebGLShader
    buffer: WebGLBuffer
    posLoc: number
    uniforms: Uniforms
    precision: "highp" | "mediump"
}

function destroyBundle(b: ProgramBundle | null) {
    if (!b) return
    const { gl, program, v, f, buffer } = b
    gl.deleteBuffer(buffer)
    gl.deleteShader(v)
    gl.deleteShader(f)
    gl.deleteProgram(program)
}

function makeBundle(
    gl: WebGLRenderingContext,
    precision: "highp" | "mediump",
    octaves: 2 | 4
): ProgramBundle | null {
    const fs = createFragmentShaderSource(precision, octaves)
    const programInfo = createProgram(gl, vertexShaderSource, fs)
    if (!programInfo) return null

    const { program, v, f } = programInfo
    gl.useProgram(program)

    const posLoc = gl.getAttribLocation(program, "a_position")
    const buffer = gl.createBuffer()
    if (!buffer) {
        gl.deleteShader(v)
        gl.deleteShader(f)
        gl.deleteProgram(program)
        return null
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
    )
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uniforms: Uniforms = {
        uRes: gl.getUniformLocation(program, "u_resolution"),
        uTime: gl.getUniformLocation(program, "u_time"),
        uSpeed: gl.getUniformLocation(program, "u_speed"),
        uSeed: gl.getUniformLocation(program, "u_seed"),
        uLoopSeconds: gl.getUniformLocation(program, "u_loopSeconds"),
        uBlend: gl.getUniformLocation(program, "u_blend"),
        uMode: gl.getUniformLocation(program, "u_mode"),
        uColor1: gl.getUniformLocation(program, "u_color1"),
        uColor2: gl.getUniformLocation(program, "u_color2"),
        uColor3: gl.getUniformLocation(program, "u_color3"),
    }

    return { gl, program, v, f, buffer, posLoc, uniforms, precision }
}

const AnimatedLoopingGradientsInner: React.FC<
    AnimatedLoopingGradientsInnerProps
> = ({
    mode,
    speed,
    seed,
    loopSeconds,
    blend,
    color1,
    color2,
    color3,
    preview,
    quality,
    octaves,
    autoDownscale,
}) => {
    const wrapRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const rafIdRef = React.useRef<number | null>(null)
    const renderRef = React.useRef<((now: number) => void) | null>(null)

    const settingsRef = React.useRef<ShaderSettings | null>(null)
    const bundleRef = React.useRef<ProgramBundle | null>(null)

    const visibleRef = React.useRef(true)
    const onScreenRef = React.useRef(true)

    const elapsedRef = React.useRef(0)
    const lastNowRef = React.useRef<number | null>(null)

    const [hasWebGL, setHasWebGL] = React.useState(true)
    const [reinitTick, setReinitTick] = React.useState(0)

    // helper div for CSS color parsing (per instance, cleaned up)
    const colorDivRef = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
        if (typeof document === "undefined") return
        const div = document.createElement("div")
        div.style.position = "absolute"
        div.style.left = "-9999px"
        div.style.top = "-9999px"
        div.style.visibility = "hidden"
        document.body.appendChild(div)
        colorDivRef.current = div
        return () => {
            if (div.parentNode) div.parentNode.removeChild(div)
            if (colorDivRef.current === div) colorDivRef.current = null
        }
    }, [])

    const previewRef = React.useRef(preview)
    React.useEffect(() => {
        previewRef.current = preview
    }, [preview])

    const prefersReducedMotion = useMediaListener(
        "(prefers-reduced-motion: reduce)"
    )
    const reducedRef = React.useRef(prefersReducedMotion)
    React.useEffect(() => {
        reducedRef.current = prefersReducedMotion
    }, [prefersReducedMotion])

    // 60fps standard (not exposed)
    const MAX_FPS = 60
    const minFrameMsRef = React.useRef(1000 / MAX_FPS)

    // DPR cap (exposed as Quality)
    const dprCapRef = React.useRef(Math.max(0.75, Math.min(quality, 2)))
    React.useEffect(() => {
        dprCapRef.current = Math.max(0.75, Math.min(quality, 2))
    }, [quality])

    // Always-on best practices (not exposed)
    const PAUSE_WHEN_OFFSCREEN = true
    const PAUSE_WHEN_HIDDEN = true

    function shouldAnimate() {
        if (!previewRef.current) return false
        if (reducedRef.current) return false
        if (PAUSE_WHEN_HIDDEN && !visibleRef.current) return false
        if (PAUSE_WHEN_OFFSCREEN && !onScreenRef.current) return false
        return true
    }

    function cancelRAF() {
        if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
    }

    function scheduleRAF() {
        if (typeof window === "undefined") return
        if (!renderRef.current) return
        if (rafIdRef.current != null) return
        lastNowRef.current = performance.now()
        rafIdRef.current = requestAnimationFrame(renderRef.current)
    }

    function stopLoop() {
        cancelRAF()
        lastNowRef.current = null
    }

    function maybeStart() {
        if (!shouldAnimate()) return
        scheduleRAF()
    }

    // Tab visibility pause (always on)
    React.useEffect(() => {
        if (typeof document === "undefined") return

        const onVis = () => {
            visibleRef.current = !document.hidden
            if (!visibleRef.current) stopLoop()
            else maybeStart()
        }
        onVis()
        document.addEventListener("visibilitychange", onVis)
        return () => document.removeEventListener("visibilitychange", onVis)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Keep settings updated (with safer color fallback)
    const parsedColors = React.useMemo(() => {
        const p1 = parseColorToRGB(color1, colorDivRef.current)
        const p2 = parseColorToRGB(color2, colorDivRef.current)
        const p3 = parseColorToRGB(color3, colorDivRef.current)

        const safe1 = p1 ?? [0.043, 0.063, 0.145] // ~#0b1025
        const safe2 = p2 ?? p1 ?? [0.188, 0.271, 1.0] // ~#3045ff
        const safe3 = p3 ?? p2 ?? p1 ?? [0.976, 0.451, 0.086] // ~#f97316

        return {
            c1: safe1 as [number, number, number],
            c2: safe2 as [number, number, number],
            c3: safe3 as [number, number, number],
        }
    }, [color1, color2, color3])

    const modeToNum = React.useMemo(() => {
        switch (mode) {
            case "cloud":
                return 1
            case "aurora":
                return 2
            case "liquid":
            default:
                return 0
        }
    }, [mode])

    React.useEffect(() => {
        settingsRef.current = {
            mode: modeToNum,
            speed,
            seed,
            loopSeconds,
            blend,
            c1: parsedColors.c1,
            c2: parsedColors.c2,
            c3: parsedColors.c3,
        }
    }, [modeToNum, speed, seed, loopSeconds, blend, parsedColors])

    React.useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return
        if (typeof window === "undefined") return

        // IntersectionObserver pause (always on)
        let io: IntersectionObserver | null = null
        if ("IntersectionObserver" in window) {
            io = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0]
                    onScreenRef.current = Boolean(entry?.isIntersecting)
                    if (!onScreenRef.current) stopLoop()
                    else maybeStart()
                },
                { threshold: 0.01 }
            )
            io.observe(wrap)
        } else {
            onScreenRef.current = true
        }

        const baseDpr = window.devicePixelRatio || 1
        const getFinalDpr = () => Math.min(baseDpr, dprCapRef.current)

        const contextAttributes: WebGLContextAttributesWithPowerPreference = {
            antialias: false,
            alpha: true,
            depth: false,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: getAutoPowerPreference(reducedRef.current),
        }

        const gl = canvas.getContext(
            "webgl",
            contextAttributes
        ) as WebGLRenderingContext | null

        // Context loss/restore handling
        const onContextLost = (e: Event) => {
            ;(e as WebGLContextEvent).preventDefault?.()
            stopLoop()
            setHasWebGL(false)
        }
        const onContextRestored = () => {
            setHasWebGL(true)
            setReinitTick((t) => t + 1)
        }

        canvas.addEventListener("webglcontextlost", onContextLost as any, false)
        canvas.addEventListener(
            "webglcontextrestored",
            onContextRestored as any,
            false
        )

        if (!gl) {
            setHasWebGL(false)
            return () => {
                canvas.removeEventListener(
                    "webglcontextlost",
                    onContextLost as any
                )
                canvas.removeEventListener(
                    "webglcontextrestored",
                    onContextRestored as any
                )
                if (io) io.disconnect()
            }
        }
        setHasWebGL(true)

        // precision choose
        const highpSupport = gl.getShaderPrecisionFormat(
            gl.FRAGMENT_SHADER,
            gl.HIGH_FLOAT
        )
        const precision =
            highpSupport && highpSupport.precision > 0 ? "highp" : "mediump"

        // build program based on octaves derived from Quality
        const bundle = makeBundle(gl, precision, octaves)
        if (!bundle) {
            setHasWebGL(false)
            return () => {
                canvas.removeEventListener(
                    "webglcontextlost",
                    onContextLost as any
                )
                canvas.removeEventListener(
                    "webglcontextrestored",
                    onContextRestored as any
                )
                if (io) io.disconnect()
            }
        }

        // destroy any previous bundle
        destroyBundle(bundleRef.current)
        bundleRef.current = bundle

        const uniforms = bundle.uniforms

        // Resize behavior (observe wrapper)
        let lastWidth = 0
        let lastHeight = 0
        let resizeScheduled = false

        const doResize = () => {
            const cssWidth = wrap.clientWidth || 0
            const cssHeight = wrap.clientHeight || 0
            const dpr = getFinalDpr()
            if (cssWidth < 2 || cssHeight < 2) return

            // sane caps
            const maxW = 1600
            const maxH = 900
            const scale = Math.min(1, maxW / cssWidth, maxH / cssHeight)

            const displayWidth = Math.max(1, Math.floor(cssWidth * scale * dpr))
            const displayHeight = Math.max(
                1,
                Math.floor(cssHeight * scale * dpr)
            )

            if (displayWidth === lastWidth && displayHeight === lastHeight)
                return

            canvas.width = displayWidth
            canvas.height = displayHeight
            lastWidth = displayWidth
            lastHeight = displayHeight

            gl.viewport(0, 0, displayWidth, displayHeight)
            if (uniforms.uRes)
                gl.uniform2f(uniforms.uRes, displayWidth, displayHeight)
        }

        const resize = () => {
            if (resizeScheduled) return
            resizeScheduled = true
            requestAnimationFrame(() => {
                resizeScheduled = false
                doResize()
                renderRef.current?.(performance.now())
            })
        }

        let ro: ResizeObserver | null = null
        const ResizeObs = (window as WindowWithResizeObserver).ResizeObserver
        if (ResizeObs) {
            ro = new ResizeObs(resize)
            ro.observe(wrap)
        } else {
            window.addEventListener("resize", resize)
        }

        // Initial sizing
        doResize()

        // Uniform change tracking
        const prev = {
            mode: NaN,
            speed: NaN,
            seed: NaN,
            loopSeconds: NaN,
            blend: NaN,
            c1: [-1, -1, -1] as [number, number, number],
            c2: [-1, -1, -1] as [number, number, number],
            c3: [-1, -1, -1] as [number, number, number],
        }

        // Auto-downscale tracking
        let slowFrameCount = 0

        const render = (now: number) => {
            rafIdRef.current = null

            const s = settingsRef.current
            const b = bundleRef.current
            if (!s || !b) return

            if (lastNowRef.current == null) lastNowRef.current = now
            const deltaMs = now - lastNowRef.current

            // 60fps limiter
            if (deltaMs < minFrameMsRef.current) {
                if (shouldAnimate())
                    rafIdRef.current = requestAnimationFrame(render)
                return
            }

            const anim = shouldAnimate()
            if (anim) elapsedRef.current += deltaMs
            lastNowRef.current = now

            const t = elapsedRef.current / 1000

            if (uniforms.uTime) gl.uniform1f(uniforms.uTime, t)

            if (s.mode !== prev.mode) {
                prev.mode = s.mode
                if (uniforms.uMode) gl.uniform1f(uniforms.uMode, s.mode)
            }
            if (s.speed !== prev.speed) {
                prev.speed = s.speed
                if (uniforms.uSpeed) gl.uniform1f(uniforms.uSpeed, s.speed)
            }
            if (s.seed !== prev.seed) {
                prev.seed = s.seed
                if (uniforms.uSeed) gl.uniform1f(uniforms.uSeed, s.seed)
            }
            if (s.loopSeconds !== prev.loopSeconds) {
                prev.loopSeconds = s.loopSeconds
                if (uniforms.uLoopSeconds)
                    gl.uniform1f(uniforms.uLoopSeconds, s.loopSeconds)
            }
            if (s.blend !== prev.blend) {
                prev.blend = s.blend
                if (uniforms.uBlend) gl.uniform1f(uniforms.uBlend, s.blend)
            }

            const { c1, c2, c3 } = s

            if (
                c1[0] !== prev.c1[0] ||
                c1[1] !== prev.c1[1] ||
                c1[2] !== prev.c1[2]
            ) {
                prev.c1 = c1
                if (uniforms.uColor1)
                    gl.uniform3f(uniforms.uColor1, c1[0], c1[1], c1[2])
            }
            if (
                c2[0] !== prev.c2[0] ||
                c2[1] !== prev.c2[1] ||
                c2[2] !== prev.c2[2]
            ) {
                prev.c2 = c2
                if (uniforms.uColor2)
                    gl.uniform3f(uniforms.uColor2, c2[0], c2[1], c2[2])
            }
            if (
                c3[0] !== prev.c3[0] ||
                c3[1] !== prev.c3[1] ||
                c3[2] !== prev.c3[2]
            ) {
                prev.c3 = c3
                if (uniforms.uColor3)
                    gl.uniform3f(uniforms.uColor3, c3[0], c3[1], c3[2])
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            if (autoDownscale && anim) {
                if (deltaMs > 24) slowFrameCount++
                else slowFrameCount = Math.max(0, slowFrameCount - 1)

                if (slowFrameCount > 60) {
                    slowFrameCount = 0
                    dprCapRef.current = Math.max(0.75, dprCapRef.current - 0.25)
                    resize()
                }
            }

            if (anim) rafIdRef.current = requestAnimationFrame(render)
        }

        renderRef.current = render

        // Seed initial uniforms once
        const s0 = settingsRef.current
        if (s0) {
            if (uniforms.uMode) gl.uniform1f(uniforms.uMode, s0.mode)
            if (uniforms.uSpeed) gl.uniform1f(uniforms.uSpeed, s0.speed)
            if (uniforms.uSeed) gl.uniform1f(uniforms.uSeed, s0.seed)
            if (uniforms.uLoopSeconds)
                gl.uniform1f(uniforms.uLoopSeconds, s0.loopSeconds)
            if (uniforms.uBlend) gl.uniform1f(uniforms.uBlend, s0.blend)
            if (uniforms.uColor1)
                gl.uniform3f(uniforms.uColor1, s0.c1[0], s0.c1[1], s0.c1[2])
            if (uniforms.uColor2)
                gl.uniform3f(uniforms.uColor2, s0.c2[0], s0.c2[1], s0.c2[2])
            if (uniforms.uColor3)
                gl.uniform3f(uniforms.uColor3, s0.c3[0], s0.c3[1], s0.c3[2])

            prev.mode = s0.mode
            prev.speed = s0.speed
            prev.seed = s0.seed
            prev.loopSeconds = s0.loopSeconds
            prev.blend = s0.blend
            prev.c1 = s0.c1
            prev.c2 = s0.c2
            prev.c3 = s0.c3
        }

        // draw one frame immediately
        const now = performance.now()
        lastNowRef.current = now
        render(now)

        // start loop if allowed
        if (shouldAnimate()) maybeStart()

        return () => {
            stopLoop()
            renderRef.current = null

            canvas.removeEventListener("webglcontextlost", onContextLost as any)
            canvas.removeEventListener(
                "webglcontextrestored",
                onContextRestored as any
            )

            if (io) io.disconnect()

            if (ro) ro.disconnect()
            else window.removeEventListener("resize", resize)

            destroyBundle(bundleRef.current)
            bundleRef.current = null

            canvas.width = 0
            canvas.height = 0
        }
        // Rebuild when shader detail changes or context restored
    }, [octaves, reinitTick, autoDownscale])

    React.useEffect(() => {
        // respond immediately to preview toggles
        if (!preview) {
            stopLoop()
            if (renderRef.current) renderRef.current(performance.now())
        } else {
            maybeStart()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preview])

    React.useEffect(() => {
        if (prefersReducedMotion) stopLoop()
        else maybeStart()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefersReducedMotion])

    const fallbackBackground = `radial-gradient(circle at 10% 20%, ${color2} 0, ${color1} 40%, ${color3} 100%)`

    return (
        <div
            ref={wrapRef}
            aria-hidden="true"
            role="presentation"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                borderRadius: "inherit",
                overflow: "hidden",
                pointerEvents: "none",
                background: hasWebGL ? "transparent" : fallbackBackground,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                role="presentation"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    borderRadius: "inherit",
                    pointerEvents: "none",
                    opacity: hasWebGL ? 1 : 0,
                }}
            />
        </div>
    )
}

// ----------------------
// Main exported component
// ----------------------
export default function AnimatedLoopingGradients({
    mode = "liquid",
    speed = 0.35,
    seed = 1.0,
    loopSeconds = 10,
    blend = 1.0,

    colors = ["#0b1025", "#3045ff", "#f97316"],

    cornerRadius = 0,

    preview = false,

    quality = 1.5,
    autoDownscale = false,

    style,
    className,
    width,
    height,

    ...rest
}: AnimatedLoopingGradientsProps) {
    // Exactly 3 colors (no confusion)
    const c1 = colors?.[0] ?? "#0b1025"
    const c2 = colors?.[1] ?? "#3045ff"
    const c3 = colors?.[2] ?? "#f97316"

    const clampedLoop = Math.max(5, Math.min(loopSeconds, 30))
    const clampedQuality = Math.max(0.75, Math.min(quality, 2))

    // Small but real perf win: use fewer FBM octaves at lower quality.
    const octaves: 2 | 4 = clampedQuality <= 1.0 ? 2 : 4

    // Preview behavior:
    // - Your Preview toggle controls animation everywhere EXCEPT export.
    // - Export always renders a static poster frame.
    const effectivePreview = React.useMemo(() => {
        let target: RenderTarget | null = null
        try {
            target = RenderTarget.current()
        } catch {
            // ignore
        }

        // Static poster for exports no matter what
        if (target === RenderTarget.export) return false

        // In the editor (Canvas + Thumbnails), respect the user's toggle
        if (
            target === RenderTarget.canvas ||
            target === RenderTarget.thumbnail
        ) {
            return preview
        }

        // In Preview + Live site, ALWAYS animate (component should “work” even if toggle is off)
        return true
    }, [preview])

    return (
        <motion.div
            {...rest}
            className={className}
            style={{
                width: width ?? 600,
                height: height ?? 400,
                borderRadius: cornerRadius,
                overflow: "hidden",
                background: "transparent",
                ...style,
            }}
        >
            <AnimatedLoopingGradientsInner
                mode={mode}
                speed={speed}
                seed={seed}
                loopSeconds={clampedLoop}
                blend={blend}
                color1={c1}
                color2={c2}
                color3={c3}
                preview={effectivePreview}
                quality={clampedQuality}
                octaves={octaves}
                autoDownscale={autoDownscale}
            />
        </motion.div>
    )
}

// Default size for marketplace usage
AnimatedLoopingGradients.defaultProps = {
    width: 600,
    height: 400,
}

// ----------------------
// Framer controls (LEAN)
// ----------------------
//
// Note: Framer currently renders `description` under controls (no reliable “hover title tooltip”
// API in addPropertyControls). To keep the panel tight, we omit descriptions entirely.
//
addPropertyControls(AnimatedLoopingGradients, {
    preview: {
        type: ControlType.Boolean,
        title: "Preview Animation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    colors: {
        type: ControlType.Array,
        title: "Colors",
        defaultValue: ["#0b1025", "#3045ff", "#f97316"],
        maxCount: 3,
        propertyControl: { type: ControlType.Color },
    },

    speed: {
        type: ControlType.Number,
        title: "Movement Speed",
        defaultValue: 0.35,
        min: 0,
        max: 2,
        step: 0.05,
    },

    seed: {
        type: ControlType.Number,
        title: "Seed",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 0.1,
    },

    blend: {
        type: ControlType.Number,
        title: "Color Blend",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },

    loopSeconds: {
        type: ControlType.Number,
        title: "Loop Duration (s)",
        defaultValue: 10,
        min: 5,
        max: 30,
        step: 1,
    },

    mode: {
        type: ControlType.Enum,
        title: "Animation Mode",
        defaultValue: "liquid",
        options: ["liquid", "cloud", "aurora"],
        optionTitles: ["Liquid", "Cloud", "Aurora"],
    },

    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
    },

    autoDownscale: {
        type: ControlType.Boolean,
        title: "Dynamic Quality",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Automatically reduces rendering quality if performance drops.",
    },
})
