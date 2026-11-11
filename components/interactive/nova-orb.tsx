import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Shape = "sphere" | "ring" | "torus" | "disc"
type Gradient = "vertical" | "horizontal" | "depth" | "around"
type Blend = "glow" | "solid"
type Interaction = "flare" | "attract" | "off"
type Quality = "low" | "high"

const DEFAULT_COLORS = ["#3D7BFF", "#A56BFF", "#FF4D5E", "#FF9A3D"]
const DEFAULT_FORM = { particles: 30000, size: 0.72, thickness: 0.05, seed: 7 }
const DEFAULT_LOOK = { particleSize: 1.6, softness: 3.5, brightness: 1, edgeGlow: 2.6, halo: 0.35, haloSize: 5 }
const DEFAULT_MOTION = { noise: 0.12, detail: 2.6, flow: 0.35, breathe: 0.035, breatheSpeed: 0.8, rotate: 0.25, spin: 0, tilt: 12 }
const DEFAULT_CURSOR = { mode: "flare" as Interaction, strength: 0.35, radius: 0.35 }

const FOCAL = 1 / Math.tan((30 * Math.PI) / 360)
const DEPTH = 4
const STRIDE = 8 // position (3) + displacement normal (3) + seed (2)

interface Props {
    shape?: Shape
    colors?: string[]
    gradient?: Gradient
    background?: string
    blend?: Blend
    form?: Partial<typeof DEFAULT_FORM>
    look?: Partial<typeof DEFAULT_LOOK>
    motion?: Partial<typeof DEFAULT_MOTION>
    cursor?: Partial<typeof DEFAULT_CURSOR>
    quality?: Quality
    pauseOffscreen?: boolean
    label?: string
    style?: React.CSSProperties
}

// ---------- Shaders ----------
const NOISE = [
    "vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}",
    "vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}",
    "float snoise(vec3 v){",
    "  const vec2 C=vec2(1.0/6.0,1.0/3.0);",
    "  const vec4 D=vec4(0.0,0.5,1.0,2.0);",
    "  vec3 i=floor(v+dot(v,C.yyy));",
    "  vec3 x0=v-i+dot(i,C.xxx);",
    "  vec3 g=step(x0.yzx,x0.xyz);",
    "  vec3 l=1.0-g;",
    "  vec3 i1=min(g.xyz,l.zxy);",
    "  vec3 i2=max(g.xyz,l.zxy);",
    "  vec3 x1=x0-i1+C.xxx;",
    "  vec3 x2=x0-i2+C.yyy;",
    "  vec3 x3=x0-D.yyy;",
    "  i=mod289(i);",
    "  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));",
    "  float n_=0.142857142857;",
    "  vec3 ns=n_*D.wyz-D.xzx;",
    "  vec4 j=p-49.0*floor(p*ns.z*ns.z);",
    "  vec4 x_=floor(j*ns.z);",
    "  vec4 y_=floor(j-7.0*x_);",
    "  vec4 x=x_*ns.x+ns.yyyy;",
    "  vec4 y=y_*ns.x+ns.yyyy;",
    "  vec4 h=1.0-abs(x)-abs(y);",
    "  vec4 b0=vec4(x.xy,y.xy);",
    "  vec4 b1=vec4(x.zw,y.zw);",
    "  vec4 s0=floor(b0)*2.0+1.0;",
    "  vec4 s1=floor(b1)*2.0+1.0;",
    "  vec4 sh=-step(h,vec4(0.0));",
    "  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;",
    "  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;",
    "  vec3 p0=vec3(a0.xy,h.x);",
    "  vec3 p1=vec3(a0.zw,h.y);",
    "  vec3 p2=vec3(a1.xy,h.z);",
    "  vec3 p3=vec3(a1.zw,h.w);",
    "  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));",
    "  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;",
    "  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);",
    "  m=m*m;",
    "  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));",
    "}",
].join("\n")

const VERTEX = [
    "#version 300 es",
    "precision highp float;",
    "in vec3 aPos;",
    "in vec3 aNormal;",
    "in vec2 aSeed;",
    "uniform float uTime, uNoiseAmp, uNoiseFreq, uNoiseSpeed, uBreath, uBreathSpeed;",
    "uniform float uRotY, uSpin, uTilt, uHover, uCursorStrength, uCursorRadius;",
    "uniform float uPointSize, uDpr, uRim, uScale, uAspect, uFocal, uDepth;",
    "uniform vec2 uMouse;",
    "uniform vec3 uColors[4];",
    "uniform int uColorCount;",
    "uniform int uGradient;",
    "out vec3 vColor;",
    "out float vAlpha;",
    NOISE,
    "mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.0,0.0,0.0,0.0,c,s,0.0,-s,c);}",
    "mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.0,-s,0.0,1.0,0.0,s,0.0,c);}",
    "mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.0,-s,c,0.0,0.0,0.0,1.0);}",
    "vec4 project(vec3 p){return vec4(p.x*uFocal/uAspect,p.y*uFocal,0.0,uDepth-p.z);}",
    "vec3 palette(float t){",
    "  int n=max(uColorCount,1);",
    "  if(n==1) return uColors[0];",
    "  float x=clamp(t,0.0,1.0)*float(n-1);",
    "  int i=clamp(int(floor(x)),0,n-2);",
    "  float f=smoothstep(0.0,1.0,x-float(i));",
    "  return mix(uColors[i],uColors[i+1],f);",
    "}",
    "void main(){",
    "  float n1=snoise(aNormal*uNoiseFreq+vec3(0.0,0.0,uTime*uNoiseSpeed));",
    "  float n2=snoise(aNormal*uNoiseFreq*2.3+vec3(uTime*uNoiseSpeed*0.7));",
    "  float breath=1.0+uBreath*sin(uTime*uBreathSpeed);",
    "  vec3 p=aPos*breath+aNormal*(n1*uNoiseAmp+n2*uNoiseAmp*0.35);",
    "  mat3 R=rotX(uTilt)*rotY(uRotY)*rotZ(uSpin);",
    "  vec3 wp=R*p*uScale;",
    "  vec3 wn=normalize(R*aNormal);",
    "  vec4 clip=project(wp);",
    "  vec2 ndc=clip.xy/clip.w;",
    "  vec2 dm=ndc-uMouse;",
    "  dm.x*=uAspect;",
    "  float r=max(uCursorRadius,0.001);",
    "  float f=exp(-dot(dm,dm)/(r*r))*uHover;",
    "  float flicker=0.6+0.4*sin(uTime*2.0+aSeed.x*6.2831);",
    "  wp+=wn*f*uCursorStrength*uScale*flicker;",
    "  clip=project(wp);",
    "  gl_Position=clip;",
    "  float persp=uDepth/max(clip.w,0.001);",
    "  gl_PointSize=uPointSize*uDpr*(0.6+aSeed.y*0.8)*persp*(1.0+f*0.8);",
    "  vec3 lp=wp/max(uScale,0.0001);",
    "  float t=lp.y*0.5+0.5;",
    "  if(uGradient==1) t=lp.x*0.5+0.5;",
    "  else if(uGradient==2) t=lp.z*0.5+0.5;",
    "  else if(uGradient==3) t=abs(atan(lp.y,lp.x))/3.1415927;",
    "  vColor=palette(t);",
    "  vec3 viewDir=normalize(vec3(0.0,0.0,uDepth)-wp);",
    "  float facing=abs(dot(wn,viewDir));",
    "  float rim=pow(clamp(1.0-facing,0.0,1.0)+0.02,uRim);",
    "  float depthFade=smoothstep(-1.4,1.0,lp.z);",
    "  vAlpha=max(rim,0.04)*(0.35+0.65*depthFade)*(1.0+f*1.5);",
    "}",
].join("\n")

const FRAGMENT = [
    "#version 300 es",
    "precision highp float;",
    "in vec3 vColor;",
    "in float vAlpha;",
    "uniform float uBrightness;",
    "uniform float uSoftness;",
    "out vec4 outColor;",
    "void main(){",
    "  vec2 c=gl_PointCoord*2.0-1.0;",
    "  float d=dot(c,c);",
    "  if(d>1.0) discard;",
    "  float a=clamp(exp(-d*uSoftness)*vAlpha*uBrightness,0.0,1.0);",
    "  outColor=vec4(vColor*a,a);",
    "}",
].join("\n")

const UNIFORMS = ["uTime", "uNoiseAmp", "uNoiseFreq", "uNoiseSpeed", "uBreath", "uBreathSpeed", "uRotY", "uSpin", "uTilt", "uHover", "uCursorStrength", "uCursorRadius", "uPointSize", "uDpr", "uRim", "uScale", "uAspect", "uFocal", "uDepth", "uMouse", "uColors", "uColorCount", "uGradient", "uBrightness", "uSoftness"] as const
type UniformName = (typeof UNIFORMS)[number]

// ---------- Helpers ----------
function parseColor(input: string): [number, number, number] {
    const s = (input || "").trim()
    const rgb = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
    if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255]
    const hex = s.match(/#([0-9a-f]{3,8})\b/i)
    if (hex) {
        let h = hex[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
        const n = parseInt(h.slice(0, 6), 16)
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }
    return [1, 1, 1]
}

function mulberry32(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function gauss(rand: () => number): number {
    const u = Math.max(1e-6, rand())
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}

// Base positions, displacement normals and per-particle seeds for each shape
function buildGeometry(shape: Shape, count: number, thickness: number, seed: number): Float32Array {
    const rand = mulberry32(seed)
    const data = new Float32Array(count * STRIDE)
    for (let k = 0; k < count; k++) {
        let px = 0, py = 0, pz = 0, nx = 0, ny = 0, nz = 1
        if (shape === "sphere") {
            const z = rand() * 2 - 1
            const phi = rand() * Math.PI * 2
            const r = Math.sqrt(1 - z * z)
            nx = r * Math.cos(phi); ny = r * Math.sin(phi); nz = z
            const radius = 1 + gauss(rand) * thickness * 0.5
            px = nx * radius; py = ny * radius; pz = nz * radius
        } else if (shape === "ring") {
            const theta = rand() * Math.PI * 2
            nx = Math.cos(theta); ny = Math.sin(theta); nz = 0
            const radius = 1 + gauss(rand) * thickness
            px = nx * radius; py = ny * radius; pz = gauss(rand) * thickness * 0.6
        } else if (shape === "torus") {
            const theta = rand() * Math.PI * 2
            const phi = rand() * Math.PI * 2
            const tube = 0.32 + thickness
            nx = Math.cos(phi) * Math.cos(theta); ny = Math.cos(phi) * Math.sin(theta); nz = Math.sin(phi)
            const ring = 1 - tube * 0.5
            px = (ring + tube * Math.cos(phi)) * Math.cos(theta)
            py = (ring + tube * Math.cos(phi)) * Math.sin(theta)
            pz = tube * Math.sin(phi)
        } else {
            const theta = rand() * Math.PI * 2
            const radius = Math.sqrt(rand())
            px = Math.cos(theta) * radius; py = Math.sin(theta) * radius; pz = gauss(rand) * thickness * 0.5
            nx = 0; ny = 0; nz = 1
        }
        const o = k * STRIDE
        data[o] = px; data[o + 1] = py; data[o + 2] = pz
        data[o + 3] = nx; data[o + 4] = ny; data[o + 5] = nz
        data[o + 6] = rand(); data[o + 7] = rand()
    }
    return data
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const shader = gl.createShader(type)
    if (!shader) throw new Error("Could not create shader")
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        throw new Error("Shader compile failed: " + log)
    }
    return shader
}

interface GLState {
    gl: WebGL2RenderingContext
    program: WebGLProgram
    vao: WebGLVertexArrayObject
    buffer: WebGLBuffer
    uniforms: Record<UniformName, WebGLUniformLocation | null>
    count: number
}

function setup(canvas: HTMLCanvasElement): GLState | null {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false })
    if (!gl) return null
    const program = gl.createProgram()
    const vao = gl.createVertexArray()
    const buffer = gl.createBuffer()
    if (!program || !vao || !buffer) return null
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program link failed: " + gl.getProgramInfoLog(program))
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    const bytes = STRIDE * 4
    const attrib = (name: string, size: number, offset: number) => {
        const loc = gl.getAttribLocation(program, name)
        if (loc < 0) return
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, bytes, offset * 4)
    }
    attrib("aPos", 3, 0)
    attrib("aNormal", 3, 3)
    attrib("aSeed", 2, 6)
    gl.bindVertexArray(null)
    const uniforms = {} as Record<UniformName, WebGLUniformLocation | null>
    for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name)
    return { gl, program, vao, buffer, uniforms, count: 0 }
}

/**
 * Nova Orb — a living WebGL particle orb
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NovaOrb(props: Props) {
    const {
        shape = "sphere",
        gradient = "vertical",
        background = "rgba(0, 0, 0, 0)",
        blend = "glow",
        quality = "high",
        pauseOffscreen = true,
        label = "Animated particle orb",
        style,
    } = props
    const colors = Array.isArray(props.colors) && props.colors.length ? props.colors.slice(0, 4) : DEFAULT_COLORS
    const form = { ...DEFAULT_FORM, ...props.form }
    const look = { ...DEFAULT_LOOK, ...props.look }
    const motion = { ...DEFAULT_MOTION, ...props.motion }
    const cursor = { ...DEFAULT_CURSOR, ...props.cursor }

    const isStatic = useIsStaticRenderer()
    const [reduceMotion, setReduceMotion] = useState(false)
    const [failed, setFailed] = useState(false)
    const frozen = isStatic || reduceMotion

    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const stateRef = useRef<GLState | null>(null)
    const drawRef = useRef<() => void>(() => {})

    const palette = useMemo(() => {
        const out = new Float32Array(12)
        colors.forEach((c, i) => out.set(parseColor(c), i * 3))
        return out
    }, [colors.join("|")])

    // Latest settings, read by the render loop without restarting it
    const live = useRef({ form, look, motion, cursor, gradient, blend, quality, palette, colorCount: colors.length, frozen, pauseOffscreen })
    live.current = { form, look, motion, cursor, gradient, blend, quality, palette, colorCount: colors.length, frozen, pauseOffscreen }

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduceMotion(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])

    // WebGL setup, render loop, resize, visibility and pointer tracking
    useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return
        let state: GLState | null = null
        try {
            state = setup(canvas)
        } catch (e) {
            state = null
        }
        if (!state) {
            setFailed(true)
            return
        }
        stateRef.current = state
        const s = state
        const gl = s.gl

        let raf = 0
        let time = 1.6
        let last = performance.now()
        let visible = true
        let width = 0
        let height = 0
        let dpr = 1
        const mouse = { x: 0, y: 0, tx: 0, ty: 0, hover: 0, target: 0 }

        const resize = () => {
            const q = live.current.quality === "low" ? 1 : 2
            dpr = Math.min(window.devicePixelRatio || 1, q)
            width = Math.max(1, Math.round(wrap.clientWidth * dpr))
            height = Math.max(1, Math.round(wrap.clientHeight * dpr))
            if (canvas.width !== width) canvas.width = width
            if (canvas.height !== height) canvas.height = height
        }

        const draw = () => {
            if (!width || !height || !s.count) return
            const L = live.current
            const u = s.uniforms
            const aspect = width / height
            gl.viewport(0, 0, width, height)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.enable(gl.BLEND)
            if (L.blend === "glow") gl.blendFunc(gl.ONE, gl.ONE)
            else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            gl.useProgram(s.program)
            gl.bindVertexArray(s.vao)
            const scale = (Math.max(0.05, L.form.size) * DEPTH) / FOCAL * Math.min(1, aspect)
            const strength = L.cursor.mode === "off" ? 0 : L.cursor.mode === "attract" ? -L.cursor.strength : L.cursor.strength
            gl.uniform1f(u.uTime, time)
            gl.uniform1f(u.uNoiseAmp, L.motion.noise)
            gl.uniform1f(u.uNoiseFreq, L.motion.detail)
            gl.uniform1f(u.uNoiseSpeed, L.frozen ? 0 : L.motion.flow)
            gl.uniform1f(u.uBreath, L.motion.breathe)
            gl.uniform1f(u.uBreathSpeed, L.motion.breatheSpeed)
            gl.uniform1f(u.uRotY, time * L.motion.rotate)
            gl.uniform1f(u.uSpin, time * L.motion.spin)
            gl.uniform1f(u.uTilt, (L.motion.tilt * Math.PI) / 180)
            gl.uniform1f(u.uHover, mouse.hover)
            gl.uniform1f(u.uCursorStrength, strength)
            gl.uniform1f(u.uCursorRadius, L.cursor.radius)
            gl.uniform1f(u.uPointSize, L.look.particleSize)
            gl.uniform1f(u.uDpr, dpr)
            gl.uniform1f(u.uRim, L.look.edgeGlow)
            gl.uniform1f(u.uScale, scale)
            gl.uniform1f(u.uAspect, aspect)
            gl.uniform1f(u.uFocal, FOCAL)
            gl.uniform1f(u.uDepth, DEPTH)
            gl.uniform2f(u.uMouse, mouse.x, mouse.y)
            gl.uniform3fv(u.uColors, L.palette)
            gl.uniform1i(u.uColorCount, L.colorCount)
            gl.uniform1i(u.uGradient, L.gradient === "horizontal" ? 1 : L.gradient === "depth" ? 2 : L.gradient === "around" ? 3 : 0)
            gl.uniform1f(u.uBrightness, L.look.brightness)
            gl.uniform1f(u.uSoftness, L.look.softness)
            gl.drawArrays(gl.POINTS, 0, s.count)
            if (L.look.halo > 0.001) {
                gl.blendFunc(gl.ONE, gl.ONE)
                gl.uniform1f(u.uPointSize, L.look.particleSize * Math.max(1, L.look.haloSize))
                gl.uniform1f(u.uSoftness, 2.2)
                gl.uniform1f(u.uBrightness, L.look.brightness * L.look.halo * 0.12)
                gl.drawArrays(gl.POINTS, 0, s.count)
            }
            gl.bindVertexArray(null)
        }
        drawRef.current = () => {
            resize()
            draw()
        }

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const L = live.current
            if (L.frozen || (L.pauseOffscreen && !visible)) return
            time += dt
            const ease = Math.min(1, dt * 6)
            mouse.x += (mouse.tx - mouse.x) * ease
            mouse.y += (mouse.ty - mouse.y) * ease
            mouse.hover += (mouse.target - mouse.hover) * Math.min(1, dt * 4)
            draw()
        }

        const onPointer = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
            mouse.tx = x
            mouse.ty = y
            mouse.target = Math.abs(x) < 1.1 && Math.abs(y) < 1.1 ? 1 : 0
        }
        const onLeave = () => {
            mouse.target = 0
        }
        const onLost = (e: Event) => {
            e.preventDefault()
            cancelAnimationFrame(raf)
            setFailed(true)
        }

        resize()
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { resize(); draw() }) : null
        if (ro) ro.observe(wrap)
        const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => { visible = entries.some((en) => en.isIntersecting) }) : null
        if (io) io.observe(wrap)
        window.addEventListener("pointermove", onPointer, { passive: true })
        document.addEventListener("pointerleave", onLeave)
        canvas.addEventListener("webglcontextlost", onLost)
        raf = requestAnimationFrame(frame)

        return () => {
            cancelAnimationFrame(raf)
            if (ro) ro.disconnect()
            if (io) io.disconnect()
            window.removeEventListener("pointermove", onPointer)
            document.removeEventListener("pointerleave", onLeave)
            canvas.removeEventListener("webglcontextlost", onLost)
            gl.deleteBuffer(s.buffer)
            gl.deleteVertexArray(s.vao)
            gl.deleteProgram(s.program)
            stateRef.current = null
            drawRef.current = () => {}
        }
    }, [])

    // Rebuild the particle cloud when its form changes
    useEffect(() => {
        const s = stateRef.current
        if (!s) return
        const count = Math.max(500, Math.min(150000, Math.round(form.particles)))
        const data = buildGeometry(shape, count, Math.max(0, form.thickness), Math.round(form.seed))
        s.gl.bindBuffer(s.gl.ARRAY_BUFFER, s.buffer)
        s.gl.bufferData(s.gl.ARRAY_BUFFER, data, s.gl.STATIC_DRAW)
        s.count = count
        drawRef.current()
    }, [shape, form.particles, form.thickness, form.seed, failed])

    // Static renderers and reduced motion: draw a single still frame whenever settings change
    useEffect(() => {
        if (frozen) drawRef.current()
    })

    const fallback = failed ? (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: (form.size * 100) + "%", aspectRatio: "1 / 1", borderRadius: "50%", background: "radial-gradient(circle, transparent 58%, " + colors[0] + " 66%, transparent 72%)", boxShadow: "0 0 80px " + colors[colors.length - 1], opacity: 0.85 }} />
        </div>
    ) : null

    return (
        <div ref={wrapRef} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} style={{ ...style, position: "relative", overflow: "hidden", background }}>
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: failed ? "none" : "block" }} />
            {fallback}
        </div>
    )
}

NovaOrb.displayName = "Nova Orb"

// Typed wrapper for the values Framer passes to a control's hidden callback
const hiddenFor =
    <T,>(test: (values: Partial<T>) => boolean) =>
    (values: unknown): boolean =>
        test((values ?? {}) as Partial<T>)

addPropertyControls(NovaOrb, {
    shape: { type: ControlType.Enum, title: "Shape", options: ["sphere", "ring", "torus", "disc"], optionTitles: ["Sphere", "Ring", "Torus", "Disc"], defaultValue: "sphere" },
    colors: { type: ControlType.Array, title: "Colors", maxCount: 4, control: { type: ControlType.Color }, defaultValue: DEFAULT_COLORS },
    gradient: { type: ControlType.Enum, title: "Gradient", options: ["vertical", "horizontal", "depth", "around"], optionTitles: ["Vertical", "Horizontal", "Depth", "Around"], defaultValue: "vertical" },
    blend: { type: ControlType.Enum, title: "Blend", options: ["glow", "solid"], optionTitles: ["Glow", "Solid"], defaultValue: "glow", displaySegmentedControl: true },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    form: {
        type: ControlType.Object, title: "Form",
        controls: {
            particles: { type: ControlType.Number, title: "Particles", defaultValue: DEFAULT_FORM.particles, min: 1000, max: 120000, step: 1000 },
            size: { type: ControlType.Number, title: "Size", defaultValue: DEFAULT_FORM.size, min: 0.1, max: 1.4, step: 0.01 },
            thickness: { type: ControlType.Number, title: "Thickness", defaultValue: DEFAULT_FORM.thickness, min: 0, max: 0.6, step: 0.01 },
            seed: { type: ControlType.Number, title: "Seed", defaultValue: DEFAULT_FORM.seed, min: 0, max: 999, step: 1 },
        },
    },
    look: {
        type: ControlType.Object, title: "Look",
        controls: {
            particleSize: { type: ControlType.Number, title: "Dot Size", defaultValue: DEFAULT_LOOK.particleSize, min: 0.4, max: 10, step: 0.1, unit: "px" },
            softness: { type: ControlType.Number, title: "Softness", defaultValue: DEFAULT_LOOK.softness, min: 0.5, max: 10, step: 0.1 },
            brightness: { type: ControlType.Number, title: "Brightness", defaultValue: DEFAULT_LOOK.brightness, min: 0.05, max: 4, step: 0.05 },
            edgeGlow: { type: ControlType.Number, title: "Edge Glow", defaultValue: DEFAULT_LOOK.edgeGlow, min: 0, max: 8, step: 0.1 },
            halo: { type: ControlType.Number, title: "Halo", defaultValue: DEFAULT_LOOK.halo, min: 0, max: 2, step: 0.01 },
            haloSize: { type: ControlType.Number, title: "Halo Size", defaultValue: DEFAULT_LOOK.haloSize, min: 1, max: 12, step: 0.1, hidden: hiddenFor<typeof DEFAULT_LOOK>((p) => (p.halo ?? DEFAULT_LOOK.halo) <= 0) },
        },
    },
    motion: {
        type: ControlType.Object, title: "Motion",
        controls: {
            noise: { type: ControlType.Number, title: "Turbulence", defaultValue: DEFAULT_MOTION.noise, min: 0, max: 0.8, step: 0.01 },
            detail: { type: ControlType.Number, title: "Detail", defaultValue: DEFAULT_MOTION.detail, min: 0.2, max: 10, step: 0.1 },
            flow: { type: ControlType.Number, title: "Flow Speed", defaultValue: DEFAULT_MOTION.flow, min: 0, max: 3, step: 0.01 },
            breathe: { type: ControlType.Number, title: "Breathe", defaultValue: DEFAULT_MOTION.breathe, min: 0, max: 0.3, step: 0.005 },
            breatheSpeed: { type: ControlType.Number, title: "Breathe Speed", defaultValue: DEFAULT_MOTION.breatheSpeed, min: 0, max: 4, step: 0.05 },
            rotate: { type: ControlType.Number, title: "Rotate", defaultValue: DEFAULT_MOTION.rotate, min: -2, max: 2, step: 0.01 },
            spin: { type: ControlType.Number, title: "Spin", defaultValue: DEFAULT_MOTION.spin, min: -2, max: 2, step: 0.01 },
            tilt: { type: ControlType.Number, title: "Tilt", defaultValue: DEFAULT_MOTION.tilt, min: -90, max: 90, step: 1, unit: "°" },
        },
    },
    cursor: {
        type: ControlType.Object, title: "Cursor",
        controls: {
            mode: { type: ControlType.Enum, title: "Mode", options: ["flare", "attract", "off"], optionTitles: ["Flare", "Attract", "Off"], defaultValue: DEFAULT_CURSOR.mode, displaySegmentedControl: true },
            strength: { type: ControlType.Number, title: "Strength", defaultValue: DEFAULT_CURSOR.strength, min: 0, max: 1.5, step: 0.01, hidden: hiddenFor<typeof DEFAULT_CURSOR>((p) => p.mode === "off") },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: DEFAULT_CURSOR.radius, min: 0.05, max: 1.5, step: 0.01, hidden: hiddenFor<typeof DEFAULT_CURSOR>((p) => p.mode === "off") },
        },
    },
    quality: { type: ControlType.Enum, title: "Quality", options: ["high", "low"], optionTitles: ["High", "Low"], defaultValue: "high", displaySegmentedControl: true },
    pauseOffscreen: { type: ControlType.Boolean, title: "Pause Offscreen", defaultValue: true },
    label: { type: ControlType.String, title: "Label", defaultValue: "Animated particle orb", placeholder: "Empty = decorative" },
})
