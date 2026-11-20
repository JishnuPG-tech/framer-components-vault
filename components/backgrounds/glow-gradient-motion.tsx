// GlowGradient — slow-moving mesh of soft colour glows over a dark base.
// Drop it into a frame (Fill / Fill) behind your content.

import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Glow = { color: string; size: number; x: number; y: number }

interface Props {
    background: string
    glows: Glow[]
    speed: number
    motion: number
    spread: number
    softness: number
    darkness: number
    warp: number
    grain: number
    noise: boolean
    noiseAmount: number
    noiseSize: number
    noiseAnimated: boolean
    noiseFps: number
    seed: number
    animateInCanvas: boolean
    style?: CSSProperties
}

const MAX_GLOWS = 8

const DEFAULT_GLOWS: Glow[] = [
    { color: "#D1023A", size: 1, x: -4, y: -6 },
    { color: "#F2471A", size: 0.9, x: 104, y: 106 },
    { color: "#240158", size: 1.7, x: 22, y: 104 },
    { color: "#4A0132", size: 1.5, x: -6, y: 50 },
    { color: "#6E0816", size: 1, x: 100, y: 62 },
]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 * @framerDisableUnlink
 */
export default function GlowGradient(props: Props) {
    const { background = "#04011C", style, animateInCanvas = false } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props
    const drawRef = useRef<(() => void) | null>(null)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const shouldAnimate = !isCanvas || animateInCanvas

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            antialias: false,
            alpha: false,
            powerPreference: "low-power",
        })
        if (!gl) return
        const program = createProgram(gl, VERT, FRAG)
        if (!program) return
        gl.useProgram(program)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const aPos = gl.getAttribLocation(program, "aPos")
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

        const u = (n: string) => gl.getUniformLocation(program, n)
        const U = {
            res: u("uRes"),
            time: u("uTime"),
            bg: u("uBg"),
            count: u("uCount"),
            colors: u("uCol"),
            glows: u("uGlow"),
            motion: u("uMotion"),
            spread: u("uSpread"),
            soft: u("uSoft"),
            dark: u("uDark"),
            warp: u("uWarp"),
            grain: u("uGrain"),
            noise: u("uNoise"),
            noiseSize: u("uNoiseSize"),
            noiseT: u("uNoiseT"),
            seed: u("uSeed"),
        }

        let time = 0
        let noiseClock = 0 // runs on real time, independent of gradient Speed
        let last = performance.now()
        let raf = 0
        let visible = true
        const reduceMotion =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        let dpr = 1
        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            gl.viewport(0, 0, w, h)
        }

        const draw = () => {
            const p = propsRef.current
            resize()
            const items = (
                p.glows && p.glows.length ? p.glows : DEFAULT_GLOWS
            ).slice(0, MAX_GLOWS)
            const cols = new Float32Array(MAX_GLOWS * 3)
            const glows = new Float32Array(MAX_GLOWS * 3) // x, y, size
            items.forEach((g, i) => {
                cols.set(parseColor(g.color), i * 3)
                glows.set(
                    [
                        (g.x ?? 50) / 100,
                        (g.y ?? 50) / 100,
                        Math.max(0.05, g.size ?? 1),
                    ],
                    i * 3
                )
            })
            gl.uniform2f(U.res, canvas.width, canvas.height)
            gl.uniform1f(U.time, time)
            gl.uniform3fv(U.bg, parseColor(p.background ?? "#04011C"))
            gl.uniform1i(U.count, items.length)
            gl.uniform3fv(U.colors, cols)
            gl.uniform3fv(U.glows, glows)
            gl.uniform1f(U.motion, p.motion ?? 1)
            gl.uniform1f(U.spread, p.spread ?? 1)
            gl.uniform1f(U.soft, p.softness ?? 0.6)
            gl.uniform1f(U.dark, p.darkness ?? 0.8)
            gl.uniform1f(U.warp, p.warp ?? 1)
            gl.uniform1f(U.grain, p.grain ?? 0.12)
            gl.uniform1f(U.noise, p.noise ? (p.noiseAmount ?? 0.15) : 0)
            gl.uniform1f(U.noiseSize, Math.max(1, (p.noiseSize ?? 1) * dpr))
            const animatedNoise = p.noiseAnimated ?? true
            gl.uniform1f(
                U.noiseT,
                animatedNoise
                    ? Math.floor(noiseClock * (p.noiseFps ?? 24)) % 997
                    : 0
            )
            gl.uniform1f(U.seed, p.seed ?? 0)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }
        drawRef.current = draw

        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1)
            last = now
            if (visible) {
                time += dt * (propsRef.current.speed ?? 2)
                noiseClock += dt
                draw()
            }
            raf = requestAnimationFrame(loop)
        }

        const ro = new ResizeObserver(() => draw())
        ro.observe(canvas)
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting
        })
        io.observe(canvas)

        if (shouldAnimate && !reduceMotion) raf = requestAnimationFrame(loop)
        else draw()

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            drawRef.current = null
            gl.deleteBuffer(buf)
            gl.deleteProgram(program)
        }
    }, [shouldAnimate])

    useEffect(() => {
        if (!shouldAnimate) drawRef.current?.()
    })

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

// ---------- helpers ----------

let colorCtx: CanvasRenderingContext2D | null = null

function parseColor(input: string): [number, number, number] {
    let c = input || "#000"
    const m = c.match(/var\([^,]+,\s*(.+)\)\s*$/) // Framer colour tokens
    if (m) c = m[1]
    if (!colorCtx) colorCtx = document.createElement("canvas").getContext("2d")
    if (!colorCtx) return [0, 0, 0]
    colorCtx.fillStyle = "#000"
    colorCtx.fillStyle = c
    const v = String(colorCtx.fillStyle)
    if (v.startsWith("#")) {
        const n = parseInt(v.slice(1, 7), 16)
        return [
            ((n >> 16) & 255) / 255,
            ((n >> 8) & 255) / 255,
            (n & 255) / 255,
        ]
    }
    const nums = v.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]
    return [nums[0] / 255, nums[1] / 255, nums[2] / 255]
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
    const compile = (type: number, src: string) => {
        const s = gl.createShader(type)!
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(s))
            return null
        }
        return s
    }
    const v = compile(gl.VERTEX_SHADER, vs)
    const f = compile(gl.FRAGMENT_SHADER, fs)
    if (!v || !f) return null
    const p = gl.createProgram()!
    gl.attachShader(p, v)
    gl.attachShader(p, f)
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p))
        return null
    }
    return p
}

// ---------- shaders ----------

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uMotion, uSpread, uSoft, uDark, uWarp, uGrain, uSeed;
uniform float uNoise, uNoiseSize, uNoiseT;
uniform vec3 uBg;
uniform int uCount;
uniform vec3 uCol[${MAX_GLOWS}];
uniform vec3 uGlow[${MAX_GLOWS}];

vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
// stable hash for the static texture (no sin precision patterns)
float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c){ return pow(max(c, 0.0), vec3(1.0/2.2)); }

void main(){
  float aspect = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = 1.0 - uv.y;                              // y down, like the x/y controls
  vec2 q = vec2(uv.x * aspect, uv.y);
  float t = uTime * 0.12;

  // gentle organic distortion so glows read as flowing bands, not circles
  vec2 nq = q * 1.3 + uSeed * 1.7;
  q += uWarp * 0.10 * vec2(snoise(nq + vec2(t, 0.0)), snoise(nq + vec2(4.1, -t)));

  vec3 acc = toLin(uBg) * uDark;
  float wsum = uDark;
  float k = mix(3.0, 1.1, clamp(uSoft, 0.0, 1.0));  // falloff sharpness

  for (int i = 0; i < ${MAX_GLOWS}; i++) {
    if (i >= uCount) break;
    float fi = float(i);
    vec2 anchor = vec2(uGlow[i].x * aspect, uGlow[i].y);
    vec2 drift = vec2(
      sin(t * (0.9 + 0.17 * fi) + fi * 1.9 + uSeed),
      cos(t * (0.7 + 0.13 * fi) + fi * 2.7 + uSeed * 1.3)
    ) * 0.28 * uMotion;
    vec2 d = q - (anchor + drift);
    // each glow is a slowly turning ellipse
    float a = fi * 1.1 + uSeed + t * 0.35;
    d = mat2(cos(a), -sin(a), sin(a), cos(a)) * d;
    d.x *= 0.72;
    float r = 0.30 * uSpread * uGlow[i].z;
    float w = exp(-dot(d, d) / (r * r) * k);
    acc += toLin(uCol[i]) * w;
    wsum += w;
  }

  vec3 col = toSrgb(acc / max(wsum, 1e-4));
  float g = hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5;
  col += g * (uGrain * 0.10 + 0.004);             // grain + dither against banding

  // optional TV-static / film-noise texture, refreshed at its own frame rate
  if (uNoise > 0.0) {
    vec2 cell = floor(gl_FragCoord.xy / uNoiseSize);
    float n = hash12(cell + vec2(uNoiseT * 37.0, uNoiseT * 17.0));
    col += (n - 0.5) * uNoise * 0.45;
  }
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

// ---------- property controls ----------

addPropertyControls(GlowGradient, {
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#04011C",
    },
    glows: {
        type: ControlType.Array,
        title: "Glows",
        maxCount: MAX_GLOWS,
        defaultValue: DEFAULT_GLOWS,
        control: {
            type: ControlType.Object,
            controls: {
                color: { type: ControlType.Color, defaultValue: "#D1023A" },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    defaultValue: 1,
                    min: 0.1,
                    max: 3,
                    step: 0.05,
                },
                x: {
                    type: ControlType.Number,
                    title: "X",
                    defaultValue: 50,
                    min: -20,
                    max: 120,
                    step: 1,
                    unit: "%",
                },
                y: {
                    type: ControlType.Number,
                    title: "Y",
                    defaultValue: 50,
                    min: -20,
                    max: 120,
                    step: 1,
                    unit: "%",
                },
            },
        },
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 2,
        min: 0,
        max: 6,
        step: 0.05,
    },
    motion: {
        type: ControlType.Number,
        title: "Motion",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
        description: "How far each glow drifts from its spot.",
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.05,
    },
    softness: {
        type: ControlType.Number,
        title: "Softness",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
    },
    darkness: {
        type: ControlType.Number,
        title: "Darkness",
        defaultValue: 0.8,
        min: 0,
        max: 3,
        step: 0.01,
        description: "How much background shows between glows.",
    },
    warp: {
        type: ControlType.Number,
        title: "Warp",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
    },
    grain: {
        type: ControlType.Number,
        title: "Grain",
        defaultValue: 0.12,
        min: 0,
        max: 1,
        step: 0.01,
    },
    noise: {
        type: ControlType.Boolean,
        title: "Noise",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    noiseAmount: {
        type: ControlType.Number,
        title: "Noise Amount",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.noise,
    },
    noiseSize: {
        type: ControlType.Number,
        title: "Noise Size",
        defaultValue: 1,
        min: 1,
        max: 8,
        step: 0.5,
        unit: "px",
        hidden: (p) => !p.noise,
    },
    noiseAnimated: {
        type: ControlType.Boolean,
        title: "Noise Motion",
        defaultValue: true,
        enabledTitle: "Animated",
        disabledTitle: "Still",
        hidden: (p) => !p.noise,
    },
    noiseFps: {
        type: ControlType.Number,
        title: "Noise FPS",
        defaultValue: 24,
        min: 1,
        max: 60,
        step: 1,
        hidden: (p) => !p.noise || p.noiseAnimated === false,
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    animateInCanvas: {
        type: ControlType.Boolean,
        title: "Canvas Preview",
        defaultValue: false,
        enabledTitle: "Animate",
        disabledTitle: "Static",
    },
})
