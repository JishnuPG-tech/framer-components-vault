import * as React from "react"
import * as FramerAPI from "framer"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// useIsStaticRenderer exists only in newer Framer runtimes and a direct named
// import breaks older ones, so it is read from the module when it is there and
// otherwise static contexts are detected with RenderTarget.
const useIsStaticRendererSafe: () => boolean =
    typeof (FramerAPI as any).useIsStaticRenderer === "function"
        ? (FramerAPI as any).useIsStaticRenderer
        : () => {
              const t = RenderTarget.current()
              return t === RenderTarget.export || t === RenderTarget.thumbnail
          }

interface Colors {
    color1?: string | null
    amount1: number
    color2?: string | null
    amount2: number
    color3?: string | null
    amount3: number
    white?: string | null
    whiteAmount: number
}

interface Gradient {
    size: number
    softness: number
    waviness: number
    streaks: number
    spots: number
    evenness: number
    stretch: number
}

interface Fade {
    top: number
    bottom: number
    left: number
    right: number
}

interface Blinds {
    density: number
    glass: number
    shine: number
}

interface Props {
    background: string
    angle: number
    direction: "up" | "down"
    colors: Colors
    gradient: Gradient
    fade: Fade
    blinds: Blinds
    glow: number
    highlights: number
    speed: number
    composition: number
    blur: number
    style?: React.CSSProperties
}

const VERT =
    "attribute vec2 a_pos; varying vec2 v_uv; void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }"

const FRAG =
    "varying HP vec2 v_uv;\nuniform HP vec2 u_res;\nuniform HP float u_time;\nuniform HP float u_travel, u_phase, u_spots;\nuniform vec3 u_bg;\nuniform vec3 u_c0, u_c1, u_c2, u_c3;\nuniform vec4 u_w;\nuniform HP float u_flowAngle, u_bAngle, u_density, u_glass, u_glow, u_highlights, u_size, u_soft, u_wave, u_streaks, u_speed, u_seed, u_haze, u_dispersion, u_whiteOn, u_even, u_stretch;\n#define TAU 6.28318530718\n// Integer-exact lattice hash (permutation polynomial mod 289): every step stays an exact whole number,\n// so neighbouring noise cells always agree, whatever the GPU's rounding or fast-math does\nHP float perm(HP float x) { return mod((x * 34.0 + 1.0) * x, 289.0); }\nHP float hash(HP vec3 p) {\n  p = mod(p, 289.0);\n  return fract(perm(perm(perm(p.x) + p.y) + p.z) / 41.0);\n}\nHP float vnoise(HP vec3 p) {\n  HP vec3 i = floor(p); HP vec3 f = fract(p);\n  HP vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);\n  return mix(\n    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), u.x), mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),\n    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x), mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),\n    u.z);\n}\nHP float fbm(HP vec3 p) {\n  HP float s = 0.0; HP float a = 0.5;\n  mat2 R = mat2(0.8, 0.6, -0.6, 0.8);\n  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = vec3(R * p.xy * 2.02, p.z * 1.3 + 3.1); a *= 0.5; }\n  return s / 0.875;\n}\n// Colour bands in a fixed order: color 1, color 2, color 3, white. Each takes a share proportional to its amount.\nvec3 palette(HP float k, HP float fw) {\n  HP vec4 sz = u_w / max(u_w.x + u_w.y + u_w.z + u_w.w, 0.0001);\n  HP vec4 mid = vec4(0.0, sz.x, sz.x + sz.y, sz.x + sz.y + sz.z) + sz * 0.5;\n  k = fract(k);\n  vec3 acc = vec3(0.0);\n  HP float ws = 0.0;\n  for (int i = 0; i < 4; i++) {\n    HP float s = sz[i];\n    vec3 c = i == 0 ? u_c0 : (i == 1 ? u_c1 : (i == 2 ? u_c2 : u_c3));\n    HP float h = s * 0.5;\n    HP float b = mix(max(0.006, fw * 1.5), max(0.04, h * 0.95), u_soft);\n    HP float d = abs(fract(k - mid[i] + 0.5) - 0.5);\n    HP float win = s > 0.001 ? 1.0 - smoothstep(h - b, h + b, d) : 0.0;\n    acc += c * win;\n    ws += win;\n  }\n  return acc / max(ws, 0.0001);\n}\nvec3 tone(vec3 c) {\n  float k = mix(0.5, 0.8, u_highlights);\n  float m = mix(0.86, 1.0, u_highlights) - k;\n  vec3 o = max(c - k, 0.0);\n  return min(c, k) + m * (1.0 - exp(-o / m));\n}\n// Light streaks travel with the colours along the flow, so the motion stays readable\nHP float streakAt(HP vec2 q, HP vec2 fdir, HP float warp, HP float travel, HP float t) {\n  HP vec3 sp = vec3((dot(q, fdir) + warp - travel) / max(u_stretch, 0.2), dot(q, vec2(-fdir.y, fdir.x)) * 2.4, t * 0.05 + u_seed); HP float n = fbm(sp) + u_even * (0.05 - 0.5714 * (vnoise(sp) - 0.5));\n  // Shadows sets how dark the gaps get (0 none, 1 black); where the gaps fall stays the same\n  // Spots sets how much of the area turns into dark spots; Shadows sets how dark they get\n  HP float lo = mix(0.12, 0.5, u_spots);\n  return mix(1.0, smoothstep(lo, lo + 0.38, n), u_streaks);\n}\nvoid main() {\n  HP float aspect = u_res.x / u_res.y;\n  HP vec2 p = (v_uv - 0.5) * vec2(aspect, 1.0);\n  HP float t = u_time;\n  HP float travel = u_travel + u_phase;\n  HP float fa = radians(u_flowAngle);\n  HP vec2 fdir = vec2(cos(fa), sin(fa));\n  // static glass panel in screen space; phase matches the CSS repeating-linear-gradient overlay\n  HP float ba = radians(u_bAngle);\n  HP vec2 bn = vec2(-sin(ba), cos(ba));\n  HP float x = dot(p, bn) * u_density + (aspect * abs(sin(ba)) + abs(cos(ba))) * u_density * 0.5;\n#ifdef HAS_DERIV\n  HP float pxs = max(length(vec2(dFdx(x), dFdy(x))), 0.0001);\n#else\n  HP float pxs = 1.4 * u_density / u_res.y;\n#endif\n  HP float fadeR = 1.0 - smoothstep(0.08, 0.25, pxs);\n  HP float sr = fract(x);\n  HP float w = clamp(3.0 * pxs, 0.06, 0.5);\n  HP float S = sr - 0.5 - smoothstep(1.0 - w, 1.0, sr) * sr;\n  HP vec2 off = bn * S / max(u_density, 0.1) * u_glass * 0.9 * fadeR;\n  HP vec2 pg = p + off;\n  HP vec2 dsp = off * u_dispersion * 0.12;\n  // gentle liquid wobble of the bands (Waviness)\n  HP float warp = (fbm(vec3(pg * 1.1, t * 0.03 + 5.0 + u_phase * 0.5)) - 0.5) * u_wave * 0.8;\n  HP float Ig = streakAt(pg, fdir, warp, travel, t);\n  HP float Ir = streakAt(pg + dsp, fdir, warp, travel, t);\n  HP float Ib = streakAt(pg - dsp, fdir, warp, travel, t);\n  HP float k = (dot(pg, fdir) + warp - travel) / max(u_size, 0.05);\n#ifdef HAS_DERIV\n  HP float fwk = fwidth(k);\n#else\n  HP float fwk = 0.01;\n#endif\n  vec3 pal = palette(k, fwk);\n  HP float hz = fbm(vec3(p * vec2(0.6, 1.2) + 9.0, t * 0.02 + 9.0));\n  vec3 col = u_bg * (0.85 + 0.3 * hz) + vec3(0.06) * smoothstep(0.4, 0.85, hz) * u_haze;\n  vec3 L = vec3(Ir, Ig, Ib);\n  vec3 light = pal * L * u_glow;\n  light = mix(light, u_c3 * u_glow, smoothstep(1.0, 1.7, Ig * u_glow) * 0.5 * u_highlights * u_whiteOn);\n  col = col * (1.0 - smoothstep(0.0, 0.5, Ig) * 0.85) + light;\n  gl_FragColor = vec4(clamp(tone(col), 0.0, 1.0), 1.0);\n}\n"

// Tuned values without a control
const FIXED: Record<string, number> = { seed: 36, haze: 0, dispersion: 1 }
// Canvas pixels per device pixel, before adaptive scaling
const QUALITY = 0.6
const MAX_PIXELS = 2200000
const FPS = 30

const DEFAULTS: Props = {
    background: "#000000",
    angle: 143,
    direction: "up",
    colors: {
        color1: "#8FA6BD",
        amount1: 1.1,
        color2: "#D8C3A5",
        amount2: 0.9,
        color3: null,
        amount3: 0.8,
        white: "#F4F7FA",
        whiteAmount: 0.7,
    },
    gradient: {
        size: 120,
        softness: 173,
        waviness: 18,
        streaks: 95,
        spots: 70,
        evenness: 65,
        stretch: 100,
    },
    fade: { top: 0, bottom: 0, left: 0, right: 0 },
    blinds: { density: 8, glass: 1.4, shine: 1.2 },
    glow: 1.55,
    highlights: 1,
    speed: 0.45,
    composition: 38,
    blur: 9,
}

const NUMBER_UNIFORMS = [
    "flowAngle",
    "bAngle",
    "density",
    "glass",
    "glow",
    "highlights",
    "size",
    "soft",
    "wave",
    "streaks",
    "speed",
    "whiteOn",
    "phase",
    "spots",
    "even",
    "stretch",
    ...Object.keys(FIXED),
]

// Colour styles arrive as var(--token-id, fallback): read the live value from the page so the style drives the shader
const tokenCache: Record<string, string> = {}
const tokenLast: Record<string, string> = {}
let tokenCacheAt = 0
// The element whose styles hold the tokens: in the editor canvas they live on an inner wrapper, not on body
let tokenScope: Element | null = null
function resolveVar(value: string): string {
    const m = value.match(/^var\(\s*(--[^,\s)]+)\s*(?:,\s*(.*))?\)$/)
    if (!m) return value
    const now = typeof performance !== "undefined" ? performance.now() : 0
    if (now - tokenCacheAt > 1000) {
        for (const k in tokenCache) delete tokenCache[k]
        tokenCacheAt = now
    }
    if (!(m[1] in tokenCache)) {
        let live = ""
        try {
            if (typeof document !== "undefined") {
                const els = [
                    tokenScope,
                    document.body,
                    document.documentElement,
                ]
                for (const el of els) {
                    if (!el) continue
                    live = getComputedStyle(el).getPropertyValue(m[1]).trim()
                    if (live) break
                }
            }
        } catch {}
        tokenCache[m[1]] = live
    }
    if (tokenCache[m[1]]) tokenLast[m[1]] = tokenCache[m[1]]
    return tokenCache[m[1]] || tokenLast[m[1]] || (m[2] || "").trim()
}

function parseColor(
    value: string | null | undefined
): [number, number, number] | null {
    if (typeof value !== "string") return null
    const v = resolveVar(value.trim())
    const hex = v.match(/^#([0-9a-f]{6})$/i)
    if (hex) {
        const n = parseInt(hex[1], 16)
        return [
            ((n >> 16) & 255) / 255,
            ((n >> 8) & 255) / 255,
            (n & 255) / 255,
        ]
    }
    const rgb = v.match(/rgba?\(([^)]+)\)/i)
    if (rgb) {
        const [r, g, b] = rgb[1].split(",").map((x) => parseFloat(x))
        return [r / 255, g / 255, b / 255]
    }
    return null
}

const num = (v: unknown, d: number) =>
    typeof v === "number" && isFinite(v) ? v : d

function resolve(p: Partial<Props>) {
    const colors = { ...DEFAULTS.colors, ...(p.colors || {}) }
    const gradient = { ...DEFAULTS.gradient, ...(p.gradient || {}) }
    const blinds = { ...DEFAULTS.blinds, ...(p.blinds || {}) }
    // Bands run in this order: color 1, color 2, color 3, white. A removed colour gets no share.
    const slots: [string | null | undefined, number][] = [
        [colors.color1, colors.amount1],
        [colors.color2, colors.amount2],
        [colors.color3, colors.amount3],
        [colors.white, colors.whiteAmount],
    ]
    // If a colour style cannot be read yet, fall back to the template colours instead of going black
    const FALLBACK: ([number, number, number] | null)[] = [
        [143 / 255, 166 / 255, 189 / 255],
        [216 / 255, 195 / 255, 165 / 255],
        null,
        [244 / 255, 247 / 255, 250 / 255],
    ]
    const rgb = slots.map(
        ([c], i) =>
            parseColor(c) ||
            (typeof c === "string" && c.trim().startsWith("var(")
                ? FALLBACK[i]
                : null)
    )
    const weights = slots.map(([, a], i) =>
        rgb[i] ? Math.max(0, num(a, 0)) : 0
    )
    // The gradient always flows along the blinds; Direction picks up or down along them
    const angle = num(p.angle, DEFAULTS.angle)
    const rad = (angle * Math.PI) / 180
    const upward =
        Math.sin(rad) > 1e-6 ||
        (Math.abs(Math.sin(rad)) <= 1e-6 && Math.cos(rad) > 0)
    const nums: Record<string, number> = {
        ...FIXED,
        flowAngle:
            angle +
            (((p.direction ?? DEFAULTS.direction) === "down") === upward
                ? 180
                : 0),
        bAngle: angle,
        density: Math.max(num(blinds.density, 10), 0.1),
        glass: num(blinds.glass, 1),
        glow: num(p.glow, DEFAULTS.glow),
        highlights: num(p.highlights, DEFAULTS.highlights),
        size: Math.max(num(gradient.size, 120), 5) / 100,
        soft: num(gradient.softness, 50) / 100,
        wave: num(gradient.waviness, 30) / 100,
        streaks: num(gradient.streaks, 75) / 100,
        spots: num(gradient.spots, 50) / 100,
        even: num(gradient.evenness, 100) / 100,
        stretch: num(gradient.stretch, 100) / 100,
        speed: num(p.speed, DEFAULTS.speed),
        // Composition scrubs through the pattern (where light and dark land) without changing the pace
        phase: num(p.composition, 0) * 0.2,
        whiteOn: weights[3] > 0 ? 1 : 0,
    }
    return { nums, rgb: rgb.map((c) => c || [0, 0, 0]), weights, blinds }
}

// Smooth (eased) fade from transparent at the edge to opaque after `size` percent
function edgeFade(direction: string, size: number) {
    const s = Math.min(Math.max(size, 0), 100)
    const at = (f: number) => (s * f).toFixed(2) + "%"
    return (
        "linear-gradient(" +
        direction +
        ", rgba(0,0,0,0) 0%, rgba(0,0,0,0.16) " +
        at(0.25) +
        ", rgba(0,0,0,0.5) " +
        at(0.5) +
        ", rgba(0,0,0,0.84) " +
        at(0.75) +
        ", #000 " +
        at(1) +
        ")"
    )
}

function fadeMask(p: Partial<Props>): string[] {
    const f = { ...DEFAULTS.fade, ...(p.fade || {}) }
    const layers: string[] = []
    if (num(f.top, 0) > 0) layers.push(edgeFade("to bottom", num(f.top, 0)))
    if (num(f.bottom, 0) > 0) layers.push(edgeFade("to top", num(f.bottom, 0)))
    if (num(f.left, 0) > 0) layers.push(edgeFade("to right", num(f.left, 0)))
    if (num(f.right, 0) > 0) layers.push(edgeFade("to left", num(f.right, 0)))
    return layers
}

function header(derivatives: boolean) {
    return (
        (derivatives
            ? "#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIV 1\n"
            : "") +
        "#ifdef GL_FRAGMENT_PRECISION_HIGH\n#define HP highp\n#else\n#define HP mediump\n#endif\nprecision HP float;\n"
    )
}

/**
 * Prism Glass Flow: colour bands that flow along fluted glass, with edge fades.
 * The shader only draws smooth light; the sharp rib lines are a CSS gradient the browser renders at native resolution.
 *
 * @framerIntrinsicWidth 1400
 * @framerIntrinsicHeight 900
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PrismGlassFlow(props: Props) {
    const {
        background = DEFAULTS.background,
        blur = DEFAULTS.blur,
        style,
    } = props
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const paramsRef = React.useRef(props)
    paramsRef.current = props
    const [height, setHeight] = React.useState(0)
    const target = RenderTarget.current()
    // Static contexts (image exports, thumbnails, static previews) get one still
    // frame and no animation loop
    const isStatic = useIsStaticRendererSafe()
    const still =
        isStatic ||
        target === RenderTarget.export ||
        target === RenderTarget.thumbnail
    // Fade in only on the live site; in the editor and in exports the picture shows at once
    const fadeIn = target === RenderTarget.preview && !still
    // Bumped when the browser gives back a lost WebGL context (e.g. iOS after switching apps), so the effect rebuilds the shader
    const [glVersion, setGlVersion] = React.useState(0)

    React.useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        setHeight(el.clientHeight)
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => setHeight(el.clientHeight))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            antialias: false,
            alpha: false,
            depth: false,
            stencil: false,
            powerPreference: "low-power",
            preserveDrawingBuffer: still,
        })
        if (!gl) return

        const compile = (type: number, source: string) => {
            const sh = gl.createShader(type)!
            gl.shaderSource(sh, source)
            gl.compileShader(sh)
            return sh
        }
        const build = (fragSource: string) => {
            const pr = gl.createProgram()!
            gl.attachShader(pr, compile(gl.VERTEX_SHADER, VERT))
            gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, fragSource))
            gl.linkProgram(pr)
            if (gl.getProgramParameter(pr, gl.LINK_STATUS)) return pr
            gl.deleteProgram(pr)
            return null
        }
        const derivatives = !!gl.getExtension("OES_standard_derivatives")
        const prog =
            (derivatives && build(header(true) + FRAG)) ||
            build(header(false) + FRAG)
        if (!prog) return
        gl.useProgram(prog)
        const onLost = (e: Event) => e.preventDefault()
        const onRestored = () => setGlVersion((v) => v + 1)
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        )
        const loc = gl.getAttribLocation(prog, "a_pos")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        const locs = Object.fromEntries(
            NUMBER_UNIFORMS.map((n) => [
                n,
                gl.getUniformLocation(prog, "u_" + n),
            ])
        )
        const colorLocs = [0, 1, 2, 3].map((i) =>
            gl.getUniformLocation(prog, "u_c" + i)
        )
        const uW = gl.getUniformLocation(prog, "u_w")
        const uRes = gl.getUniformLocation(prog, "u_res")
        const uTime = gl.getUniformLocation(prog, "u_time")
        const uTravel = gl.getUniformLocation(prog, "u_travel")
        const uBg = gl.getUniformLocation(prog, "u_bg")

        let raf = 0
        let last = 0
        let travel = 0
        let lastSec = 0
        let adapt = 1
        let slowFrames = 0
        let prevTick = 0
        let visible = true
        let disposed = false
        const start = performance.now()
        const frozen =
            still ||
            (typeof window !== "undefined" &&
                !!window.matchMedia?.("(prefers-reduced-motion: reduce)")
                    .matches)

        const draw = (now: number) => {
            if (disposed) return
            const p = paramsRef.current
            tokenScope = canvas
            // Match the real on-screen size (retina and editor zoom), lower it on blur or slow devices
            const cw = canvas.clientWidth
            const ch = canvas.clientHeight
            const zoom = cw > 0 ? canvas.getBoundingClientRect().width / cw : 1
            const dpr = Math.min(
                (window.devicePixelRatio || 1) * (zoom || 1),
                3
            )
            let scale = Math.min(
                Math.max(
                    QUALITY * dpr * adapt * (num(p.blur, 0) >= 2 ? 0.6 : 1),
                    0.5
                ),
                1.5
            )
            scale = Math.min(
                scale,
                Math.sqrt(MAX_PIXELS / Math.max(1, cw * ch))
            )
            const w = Math.max(1, Math.round(cw * scale))
            const h = Math.max(1, Math.round(ch * scale))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            gl.viewport(0, 0, w, h)
            gl.uniform2f(uRes, w, h)
            gl.uniform1f(uTime, frozen ? 0 : (now - start) / 1000)
            const { nums, rgb, weights } = resolve(p)
            for (const n of NUMBER_UNIFORMS) gl.uniform1f(locs[n], nums[n])
            // Integrate the flow so changing Speed only changes the pace and never jumps the pattern
            const sec = frozen ? 0 : (now - start) / 1000
            travel +=
                Math.min(Math.max(sec - lastSec, 0), 0.1) * nums.speed * 0.3
            lastSec = sec
            gl.uniform1f(uTravel, travel)
            rgb.forEach((c, i) => gl.uniform3f(colorLocs[i], c[0], c[1], c[2]))
            gl.uniform4f(uW, weights[0], weights[1], weights[2], weights[3])
            const bg = parseColor(p.background ?? DEFAULTS.background) || [
                0, 0, 0,
            ]
            gl.uniform3f(uBg, bg[0], bg[1], bg[2])
            gl.drawArrays(gl.TRIANGLES, 0, 6)
            canvas.style.opacity = "1"
        }

        const loop = (now: number) => {
            if (disposed) return
            if (visible && prevTick) {
                // Frames arriving much slower than the target mean the GPU is struggling
                slowFrames =
                    now - prevTick > 1000 / FPS + 12
                        ? slowFrames + 1
                        : Math.max(0, slowFrames - 1)
                if (slowFrames > 30 && adapt > 0.8) {
                    adapt *= 0.85
                    slowFrames = 0
                }
            }
            prevTick = visible ? now : 0
            if (visible && now - last >= 1000 / FPS - 1) {
                last = now
                draw(now)
            }
            if (!frozen) raf = requestAnimationFrame(loop)
        }
        // One frame always; the animation loop only where motion can be shown
        draw(start)
        if (!frozen) raf = requestAnimationFrame(loop)

        const io =
            !frozen && typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(([e]) => {
                      visible = e.isIntersecting
                  })
                : null
        io?.observe(canvas)
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => draw(performance.now()))
                : null
        ro?.observe(canvas)

        return () => {
            disposed = true
            cancelAnimationFrame(raf)
            io?.disconnect()
            ro?.disconnect()
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            gl.deleteBuffer(buf)
            gl.deleteProgram(prog)
        }
    }, [glVersion, still])

    // Rib lines: vector gradient with the same geometry and period as the shader's glass, so edges stay crisp at any zoom
    const { blinds } = resolve(props)
    const period = height / Math.max(num(blinds.density, 10), 0.1)
    const shine = num(blinds.shine, 1)
    const alpha = (v: number) => Math.min(1, v * shine).toFixed(3)
    const stops =
        "rgba(0,0,0," +
        alpha(0.55) +
        ") 0px, rgba(0,0,0,0) " +
        (period * 0.3).toFixed(2) +
        "px, rgba(255,255,255,0) " +
        (period * 0.55).toFixed(2) +
        "px, rgba(255,255,255," +
        alpha(0.3) +
        ") " +
        (period - 3).toFixed(2) +
        "px, rgba(255,255,255," +
        alpha(0.85) +
        ") " +
        (period - 1.5).toFixed(2) +
        "px, rgba(0,0,0," +
        alpha(0.55) +
        ") " +
        period.toFixed(2) +
        "px"
    const ribs =
        period > 6 && shine > 0
            ? "repeating-linear-gradient(" +
              -num(props.angle, DEFAULTS.angle) +
              "deg, " +
              stops +
              ")"
            : "none"
    const mask = fadeMask(props)
    const maskStyle: React.CSSProperties = mask.length
        ? ({
              WebkitMaskImage: mask.join(", "),
              maskImage: mask.join(", "),
              WebkitMaskComposite: mask.map(() => "source-in").join(", "),
              maskComposite: mask.map(() => "intersect").join(", "),
          } as React.CSSProperties)
        : {}

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                ...style,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    isolation: "isolate",
                    ...maskStyle,
                }}
            >
                <canvas
                    ref={canvasRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                        opacity: fadeIn ? 0 : 1,
                        transition: fadeIn ? "opacity 0.8s ease" : "none",
                        filter: blur > 0 ? "blur(" + blur + "px)" : undefined,
                        transform:
                            blur > 0
                                ? "scale(" +
                                  (1 + Math.min(blur, 40) / 200) +
                                  ")"
                                : undefined,
                    }}
                />
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        mixBlendMode: "overlay",
                        backgroundImage: ribs,
                    }}
                />
            </div>
        </div>
    )
}

addPropertyControls(PrismGlassFlow, {
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: DEFAULTS.background,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: 143,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        defaultValue: "up",
        displaySegmentedControl: true,
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            color1: {
                type: ControlType.Color,
                title: "Color 1",
                defaultValue: "#8FA6BD",
                optional: true,
            },
            amount1: {
                type: ControlType.Number,
                title: "Amount 1",
                defaultValue: 1.1,
                min: 0,
                max: 2,
                step: 0.05,
            },
            color2: {
                type: ControlType.Color,
                title: "Color 2",
                defaultValue: "#D8C3A5",
                optional: true,
            },
            amount2: {
                type: ControlType.Number,
                title: "Amount 2",
                defaultValue: 0.9,
                min: 0,
                max: 2,
                step: 0.05,
            },
            color3: {
                type: ControlType.Color,
                title: "Color 3",
                optional: true,
            },
            amount3: {
                type: ControlType.Number,
                title: "Amount 3",
                defaultValue: 0.8,
                min: 0,
                max: 2,
                step: 0.05,
                hidden: (colors: any) => !colors || !colors.color3,
            },
            white: {
                type: ControlType.Color,
                title: "White",
                defaultValue: "#F4F7FA",
                optional: true,
            },
            whiteAmount: {
                type: ControlType.Number,
                title: "White Amount",
                defaultValue: 0.7,
                min: 0,
                max: 2,
                step: 0.05,
            },
        },
    },
    gradient: {
        type: ControlType.Object,
        title: "Gradient",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 120,
                min: 20,
                max: 400,
                step: 5,
                unit: "%",
                description: "Length of one full colour cycle.",
            },
            softness: {
                type: ControlType.Number,
                title: "Softness",
                defaultValue: 173,
                min: 0,
                max: 300,
                step: 1,
                unit: "%",
                description: "Sharp colour bands or soft blends.",
            },
            waviness: {
                type: ControlType.Number,
                title: "Waviness",
                defaultValue: 18,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            streaks: {
                type: ControlType.Number,
                title: "Shadows",
                defaultValue: 95,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "How deep the dark gaps get: 0 none, 100 black.",
            },
            spots: {
                type: ControlType.Number,
                title: "Spots",
                defaultValue: 70,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "How many dark spots: 0 few, 100 many.",
            },
            evenness: {
                type: ControlType.Number,
                title: "Evenness",
                defaultValue: 65,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Keeps light across the frame. Lower it to allow large dark moments.",
            },
            stretch: {
                type: ControlType.Number,
                title: "Stretch",
                defaultValue: 100,
                min: 50,
                max: 500,
                step: 5,
                unit: "%",
                description:
                    "Length of the light and dark streaks along the blinds.",
            },
        },
    },
    fade: {
        type: ControlType.Object,
        title: "Fade",
        controls: {
            top: {
                type: ControlType.Number,
                title: "Top",
                defaultValue: 0,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            bottom: {
                type: ControlType.Number,
                title: "Bottom",
                defaultValue: 0,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            left: {
                type: ControlType.Number,
                title: "Left",
                defaultValue: 0,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            right: {
                type: ControlType.Number,
                title: "Right",
                defaultValue: 0,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
        },
    },
    blinds: {
        type: ControlType.Object,
        title: "Blinds",
        controls: {
            density: {
                type: ControlType.Number,
                title: "Density",
                defaultValue: 8,
                min: 2,
                max: 30,
                step: 0.5,
            },
            glass: {
                type: ControlType.Number,
                title: "Glass",
                defaultValue: 1.4,
                min: 0,
                max: 3,
                step: 0.05,
            },
            shine: {
                type: ControlType.Number,
                title: "Shine",
                defaultValue: 1.2,
                min: 0,
                max: 1.5,
                step: 0.05,
            },
        },
    },
    glow: {
        type: ControlType.Number,
        title: "Brightness",
        defaultValue: 1.55,
        min: 0,
        max: 3,
        step: 0.05,
    },
    highlights: {
        type: ControlType.Number,
        title: "Highlights",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.45,
        min: 0,
        max: 1,
        step: 0.01,
    },
    composition: {
        type: ControlType.Number,
        title: "Composition",
        defaultValue: 38,
        min: 0,
        max: 100,
        step: 0.1,
        description: "Slide to pick a different arrangement of light and dark.",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 9,
        min: 0,
        max: 40,
        step: 0.5,
        unit: "px",
    },
})
