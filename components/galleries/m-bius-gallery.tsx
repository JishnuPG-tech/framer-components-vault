import * as React from "react"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
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
 * Möbius Gallery
 *
 * Images ride a strip with a half twist. The strip is an infinity loop or a
 * ring, drawn in WebGL with real perspective. Because of the twist, a card
 * comes back around on the "other" side, and only returns to where it started
 * after two laps.
 *
 * How it works
 * - The loop is sampled once into an arc-length table. Every frame, each card
 *   is rebuilt as a short ribbon (24 slices) along that table: cheap on the CPU,
 *   one draw call per card.
 * - Focus field: a density curve along the loop decides how much of the path
 *   each card gets. Cards in the focus zone (nearest the camera, under the
 *   pointer or at a fixed spot) grow longer and wider; the rest shrink to make
 *   room. Card proportions stay the same.
 * - Keep upright: each card checks how it lands on screen and cross-fades to a
 *   flipped or mirrored copy so photos never read upside down or backwards.
 * - React renders only on UI changes (play, view, focused card). Motion,
 *   ticker and minimap are written straight to the DOM once per frame.
 * - The loop stops off screen and in hidden tabs. Reduced motion starts paused.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */

// ---------- Types and defaults ----------

type Item = { image?: any; title?: string; meta?: string }
type View = "front" | "lean" | "above" | "low" | "orbit"
type Shape = "infinity" | "ring"

const PICSUM = (id: number, w: number, h: number) =>
    `https://picsum.photos/id/${id}/${w}/${h}`

const DEMO: { id: number; title: string; meta: string }[] = [
    { id: 1015, title: "Fjord from the ledge", meta: "Water · Frame 01" },
    { id: 1018, title: "The road below the ridge", meta: "Road · Frame 02" },
    { id: 1022, title: "Aurora over one pine", meta: "Sky · Frame 03" },
    { id: 204, title: "Rails across the trestle", meta: "Rail · Frame 04" },
    { id: 1050, title: "Sea stacks at low swell", meta: "Coast · Frame 05" },
    { id: 1016, title: "Red rock at dusk", meta: "Rock · Frame 06" },
    { id: 229, title: "Trail into the fog", meta: "Forest · Frame 07" },
    { id: 1036, title: "Tents in fresh snow", meta: "Snow · Frame 08" },
    { id: 1052, title: "Black sand, white surf", meta: "Coast · Frame 09" },
    { id: 177, title: "Hiker at first light", meta: "Ridge · Frame 10" },
    { id: 1039, title: "Falls in the green bowl", meta: "Water · Frame 11" },
    { id: 254, title: "Tunnel of trees", meta: "Forest · Frame 12" },
    { id: 1043, title: "Granite walls, pine shore", meta: "Rock · Frame 13" },
    { id: 155, title: "Rails along the shore", meta: "Rail · Frame 14" },
    { id: 1044, title: "Wading the cold river", meta: "Water · Frame 15" },
    { id: 1057, title: "Hillside above the sea", meta: "Coast · Frame 16" },
]

const MOTION_D = {
    autoplay: true,
    speed: 0.35,
    direction: "forward",
    hoverSpeed: 0.25,
    drag: true,
    inertia: 0.6,
    scrollBoost: 0.6,
    hold: 2.5,
}
const STRIP_D = {
    shape: "infinity" as Shape,
    cards: 18,
    aspect: 1.45,
    gap: 0.08,
    radius: 0.06,
    halfTwists: 1,
    twistStyle: "gathered",
    twistAt: "auto",
    depth: 0.5,
}
// Where a gathered twist sits, as a position along the loop
const TWIST_AT: Record<string, number> = { right: 0, front: 0.25, left: 0.5, back: 0.75 }
const CAMERA_D = {
    view: "lean" as View,
    perspective: 0.55,
    parallax: 0.35,
    padding: 0.1,
}
const FOCUS_D = {
    mode: "depth",
    strength: 0.9,
    falloff: 1.6,
    position: 0.25,
    dimFar: 0.35,
    upright: "keep",
}
const LOOK_D = {
    background: "#F2F0EB",
    placeholder: "#DAD6CD",
    edge: "rgba(0,0,0,0.10)",
    backShade: 0.12,
    depthShade: 0,
    occlusion: 0,
    shadow: true,
    theme: "light",
    accent: "#4B3BFF",
    // Colours for the other theme, used by the theme switch
    altBackground: "#111113",
    altPlaceholder: "#26262A",
    altEdge: "rgba(255,255,255,0.10)",
    altAccent: "#8C80FF",
}
const UI_D = {
    controls: true,
    caption: true,
    ticker: true,
    minimap: true,
    lightbox: true,
    click: "focus",
    views: true,
    themeSwitch: false,
}

const VIEWS: Record<Exclude<View, "orbit">, [number, number]> = {
    front: [0, 0],
    lean: [-28, 16],
    above: [0, 52],
    low: [14, -20],
}
const SPEEDS = [0.5, 1, 2, 4]
const SEG = 24 // slices per card
const LUT = 720 // arc-length samples along the loop
const GRID = 240 // focus-field samples
const OCC = 96 // occluder samples for ambient occlusion
const STRIDE = 7 // x y z a b shade fog

// ---------- Small math helpers ----------

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const damp = (a: number, b: number, rate: number, dt: number) =>
    lerp(a, b, 1 - Math.exp(-rate * dt))
const smooth = (a: number, b: number, x: number) => {
    const t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}
const fract = (x: number) => x - Math.floor(x)
const wrapNear = (x: number, period: number) =>
    x - Math.round(x / period) * period
const mod = (x: number, m: number) => ((x % m) + m) % m

function imgSrc(image: any): string | undefined {
    if (!image) return undefined
    if (typeof image === "string") return image
    return image.src || undefined
}

function parseColor(c: string | undefined, fallback: number[]): number[] {
    if (!c || typeof document === "undefined") return fallback
    let s = c.trim()
    const v = s.match(/^var\([^,]+,\s*(.+)\)$/)
    if (v) s = v[1]
    try {
        const cv = document.createElement("canvas")
        cv.width = cv.height = 1
        const g = cv.getContext("2d")!
        g.fillStyle = "#000"
        g.fillStyle = s
        g.fillRect(0, 0, 1, 1)
        const d = g.getImageData(0, 0, 1, 1).data
        return [d[0] / 255, d[1] / 255, d[2] / 255, d[3] / 255]
    } catch {
        return fallback
    }
}

// ---------- Loop geometry (arc-length table) ----------

type Path = {
    pos: Float32Array // LUT * 3
    tan: Float32Array
    n0: Float32Array
    b0: Float32Array
    curv: Float32Array // radius of curvature per sample
    theta0: number
    gather: number
    length: number
    sig: string
}

function buildPath(shape: Shape, depth: number, halfW: number): Path {
    const N = 2048
    const raw = new Float64Array(N * 3)
    const D = Math.max(0.12 + depth * 0.6, halfW * 1.35)
    for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2
        let x: number, y: number, z: number
        if (shape === "ring") {
            x = Math.cos(t)
            y = 0
            z = Math.sin(t)
        } else {
            x = Math.cos(t) * 1.25
            y = Math.sin(2 * t) * 0.42
            z = Math.sin(t) * D
        }
        raw[i * 3] = x
        raw[i * 3 + 1] = y
        raw[i * 3 + 2] = z
    }
    // cumulative arc length
    const cum = new Float64Array(N + 1)
    for (let i = 1; i <= N; i++) {
        const a = (i - 1) * 3
        const b = (i % N) * 3
        cum[i] =
            cum[i - 1] +
            Math.hypot(raw[b] - raw[a], raw[b + 1] - raw[a + 1], raw[b + 2] - raw[a + 2])
    }
    const total = cum[N]
    const pos = new Float32Array(LUT * 3)
    let j = 0
    for (let k = 0; k < LUT; k++) {
        const target = (k / LUT) * total
        while (cum[j + 1] < target) j++
        const f = (target - cum[j]) / (cum[j + 1] - cum[j] || 1)
        const a = j * 3
        const b = ((j + 1) % N) * 3
        for (let c = 0; c < 3; c++) pos[k * 3 + c] = lerp(raw[a + c], raw[b + c], f)
    }
    const tan = new Float32Array(LUT * 3)
    const n0 = new Float32Array(LUT * 3)
    const b0 = new Float32Array(LUT * 3)
    const axis = shape === "ring" ? [0, 1, 0] : [0, 0, 1]
    for (let k = 0; k < LUT; k++) {
        const p = ((k - 1 + LUT) % LUT) * 3
        const n = ((k + 1) % LUT) * 3
        let tx = pos[n] - pos[p],
            ty = pos[n + 1] - pos[p + 1],
            tz = pos[n + 2] - pos[p + 2]
        const tl = Math.hypot(tx, ty, tz) || 1
        tx /= tl
        ty /= tl
        tz /= tl
        // n0 = T x axis (in-plane normal)
        let nx = ty * axis[2] - tz * axis[1],
            ny = tz * axis[0] - tx * axis[2],
            nz = tx * axis[1] - ty * axis[0]
        const nl = Math.hypot(nx, ny, nz) || 1
        nx /= nl
        ny /= nl
        nz /= nl
        // b0 = n0 x T
        const bx = ny * tz - nz * ty,
            by = nz * tx - nx * tz,
            bz = nx * ty - ny * tx
        tan.set([tx, ty, tz], k * 3)
        n0.set([nx, ny, nz], k * 3)
        b0.set([bx, by, bz], k * 3)
    }
    const curv = new Float32Array(LUT)
    const ds = total / LUT
    for (let k = 0; k < LUT; k++) {
        const p = ((k - 1 + LUT) % LUT) * 3
        const n = ((k + 1) % LUT) * 3
        const d = Math.hypot(tan[n] - tan[p], tan[n + 1] - tan[p + 1], tan[n + 2] - tan[p + 2])
        curv[k] = d > 1e-6 ? (2 * ds) / d : 1e3
    }
    // smooth a little so the width limit has no kinks
    const cs = new Float32Array(LUT)
    for (let k = 0; k < LUT; k++) {
        let m = 1e9
        for (let o = -12; o <= 12; o++) m = Math.min(m, curv[(k + o + LUT) % LUT])
        cs[k] = m
    }
    return {
        pos,
        tan,
        n0,
        b0,
        curv: cs,
        theta0: shape === "ring" ? Math.PI / 2 : 0,
        gather: shape === "ring" ? 0.75 : 0.25,
        length: total,
        sig: "",
    }
}

// ---------- WebGL ----------

const VS = `
attribute vec3 aPos; attribute vec2 aUv; attribute vec2 aSF;
uniform mat4 uMVP;
varying vec2 vUv; varying vec2 vSF;
void main(){ vUv = aUv; vSF = aSF; gl_Position = uMVP * vec4(aPos, 1.0); }`

const FS = (deriv: boolean) => `
${deriv ? "#extension GL_OES_standard_derivatives : enable" : ""}
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uCover; uniform vec2 uFlip;
uniform float uHasTex; uniform float uAspect; uniform float uRadius;
uniform float uHover; uniform float uBack; uniform float uFade;
uniform vec3 uFog; uniform vec3 uPlace; uniform vec4 uEdge;
varying vec2 vUv; varying vec2 vSF;
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec3 samp(vec2 uv){ return texture2D(uTex, (uv - 0.5) * uCover + 0.5).rgb; }
void main(){
  vec2 uv = vUv;
  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
  float d = sdRound(p, vec2(0.5 * uAspect, 0.5), uRadius);
  float aa = ${deriv ? "max(fwidth(d), 0.0008)" : "0.006"};
  float alpha = 1.0 - smoothstep(-aa, aa, d);
  if (alpha < 0.01) discard;
  vec3 col;
  if (uHasTex > 0.5) {
    vec3 c0 = samp(uv);
    vec3 c1 = samp(vec2(1.0 - uv.x, uv.y));
    vec3 c2 = samp(vec2(uv.x, 1.0 - uv.y));
    vec3 c3 = samp(1.0 - uv);
    col = mix(mix(c0, c1, uFlip.x), mix(c2, c3, uFlip.x), uFlip.y);
    col = mix(uPlace, col, uFade);
  } else {
    col = uPlace * (0.94 + 0.06 * uv.y);
  }
  col *= vSF.x;
  if (!gl_FrontFacing) col *= 1.0 - uBack;
  col = mix(col, vec3(1.0), uHover * 0.08);
  float edge = 1.0 - smoothstep(0.0, aa * 1.5 + 0.004, -d);
  col = mix(col, uEdge.rgb, uEdge.a * edge);
  col = mix(col, uFog, vSF.y);
  gl_FragColor = vec4(col * alpha, alpha);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[Möbius Gallery]", gl.getShaderInfoLog(s))
    }
    return s
}

type Tex = {
    src: string
    tex: WebGLTexture | null
    aspect: number
    ready: boolean
    fade: number
    failed: boolean
}

// ---------- Icons ----------

const I = {
    play: <path d="M7 5.5v13l11-6.5z" fill="currentColor" />,
    pause: (
        <g fill="currentColor">
            <rect x="6.5" y="5.5" width="4" height="13" rx="1" />
            <rect x="13.5" y="5.5" width="4" height="13" rx="1" />
        </g>
    ),
    prev: <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    next: <path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    reverse: (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9h13l-3-3" />
            <path d="M20 15H7l3 3" />
        </g>
    ),
    sun: (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </g>
    ),
    sliders: (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
            <circle cx="15" cy="7" r="2" />
            <circle cx="9" cy="17" r="2" />
        </g>
    ),
    moon: (
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    ),
    full: (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </g>
    ),
    close: <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    inf: <path d="M12 12c-2-2.6-3.6-4-5.5-4a4 4 0 000 8c1.9 0 3.5-1.4 5.5-4s3.6-4 5.5-4a4 4 0 010 8c-1.9 0-3.5-1.4-5.5-4z" fill="none" stroke="currentColor" strokeWidth="1.8" />,
    ring: <ellipse cx="12" cy="12" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="1.8" />,
}
const Icon = ({ k, size = 18 }: { k: keyof typeof I; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        {I[k]}
    </svg>
)

// ---------- Component ----------

const NO_ITEMS: Item[] = []

type Entry = { src: string; thumb: string; alt: string; title: string; meta: string }
// Field-by-field comparison, linear in the number of images
function sameGallery(a: Entry[], b: Entry[]) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        const x = a[i],
            y = b[i]
        if (x.src !== y.src || x.thumb !== y.thumb || x.alt !== y.alt || x.title !== y.title || x.meta !== y.meta) return false
    }
    return true
}

export default function MobiusGallery(props: any) {
    const items: Item[] = props.items && props.items.length ? props.items : NO_ITEMS
    const motionP = { ...MOTION_D, ...props.motion }
    const strip = { ...STRIP_D, ...props.strip }
    const camera = { ...CAMERA_D, ...props.camera }
    const focus = { ...FOCUS_D, ...props.focus }
    const lookBase = { ...LOOK_D, ...props.look }
    const ui = { ...UI_D, ...props.ui }
    const font = props.font || {}

    // Canvas, export and thumbnails: draw one still frame, no animation or input
    const isStatic = useIsStaticRenderer()

    // Resolved gallery list. Rebuilt when the items array changes; if the content
    // is the same, the previous list is kept so the engine sees no change.
    const built = useMemo(() => {
        const list = items
            .map((it, i) => ({
                src: imgSrc(it.image),
                thumb: imgSrc(it.image),
                alt: (it.image && it.image.alt) || it.title || `Image ${i + 1}`,
                title: it.title || "",
                meta: it.meta || "",
            }))
            .filter((g) => !!g.src) as {
            src: string
            thumb: string
            alt: string
            title: string
            meta: string
        }[]
        if (list.length) return list
        return DEMO.map((d) => ({
            src: PICSUM(d.id, 1200, 800),
            thumb: PICSUM(d.id, 240, 160),
            alt: d.title,
            title: d.title,
            meta: d.meta,
        }))
    }, [items])
    const galleryRef = useRef(built)
    if (galleryRef.current !== built && !sameGallery(galleryRef.current, built)) galleryRef.current = built
    const gallery = galleryRef.current

    // ---- UI state (changes rarely) ----
    const reduced =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const [playing, setPlaying] = useState(motionP.autoplay && !reduced)
    const [view, setView] = useState<View>(camera.view)
    const [shape, setShape] = useState<Shape>(strip.shape)
    const [speedIdx, setSpeedIdx] = useState(1)
    const [reverse, setReverse] = useState(motionP.direction === "backward")
    const [active, setActive] = useState(0) // focused image index
    const [side, setSide] = useState(0)
    const [lightbox, setLightbox] = useState<number | null>(null)
    const [compact, setCompact] = useState(false)
    // Narrow layouts move View and Shape into a panel above the bar
    const [moreOpen, setMoreOpen] = useState(false)
    useEffect(() => {
        if (!compact) setMoreOpen(false)
    }, [compact])
    const [glFailed, setGlFailed] = useState(false)
    // Bumped when the browser restores a lost WebGL context; remounts the canvas
    const [glEpoch, setGlEpoch] = useState(0)
    // Theme switch: flips between the Look colours and the "other theme" colours
    const [flip, setFlip] = useState(false)
    useEffect(() => setFlip(false), [lookBase.theme])
    const look = flip
        ? {
              ...lookBase,
              theme: lookBase.theme === "dark" ? "light" : "dark",
              background: lookBase.altBackground,
              placeholder: lookBase.altPlaceholder,
              edge: lookBase.altEdge,
              accent: lookBase.altAccent,
          }
        : lookBase

    // Sync with prop changes (Framer canvas edits, demo playground)
    useEffect(() => setPlaying(motionP.autoplay && !reduced), [motionP.autoplay])
    useEffect(() => setView(camera.view), [camera.view])
    useEffect(() => setShape(strip.shape), [strip.shape])
    useEffect(() => setReverse(motionP.direction === "backward"), [motionP.direction])

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const tickerRef = useRef<HTMLDivElement>(null)
    const miniDotsRef = useRef<SVGGElement>(null)
    const miniFocusRef = useRef<SVGCircleElement>(null)

    // Everything the frame loop reads, refreshed every render
    const live = useRef<any>({})
    live.current = {
        gallery,
        motion: motionP,
        strip: { ...strip, shape },
        camera: { ...camera, view },
        focus,
        look,
        ui,
        playing: playing && lightbox === null,
        speedMul: SPEEDS[speedIdx],
        dir: reverse ? -1 : 1,
        reduced,
        isStatic,
    }

    // Commands the UI sends to the engine
    const cmd = useRef<{
        nav?: (delta: number) => void
        goImage?: (img: number) => void
        render?: () => void
    }>({})

    // ---------- Engine ----------
    useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root) return
        const gl = canvas.getContext("webgl", {
            antialias: true,
            alpha: true,
            premultipliedAlpha: true,
        }) as WebGLRenderingContext | null
        if (!gl) {
            setGlFailed(true)
            return
        }
        const deriv = !!gl.getExtension("OES_standard_derivatives")
        const aniso =
            gl.getExtension("EXT_texture_filter_anisotropic") ||
            gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic")

        const prog = gl.createProgram()!
        gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS))
        gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS(deriv)))
        gl.linkProgram(prog)
        gl.useProgram(prog)
        const loc = (n: string) => gl.getUniformLocation(prog, n)
        const U = {
            mvp: loc("uMVP"),
            tex: loc("uTex"),
            cover: loc("uCover"),
            flip: loc("uFlip"),
            hasTex: loc("uHasTex"),
            aspect: loc("uAspect"),
            radius: loc("uRadius"),
            hover: loc("uHover"),
            back: loc("uBack"),
            fade: loc("uFade"),
            fog: loc("uFog"),
            place: loc("uPlace"),
            edge: loc("uEdge"),
        }
        const aPos = gl.getAttribLocation(prog, "aPos")
        const aUv = gl.getAttribLocation(prog, "aUv")
        const aSF = gl.getAttribLocation(prog, "aSF")
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.enableVertexAttribArray(aPos)
        gl.enableVertexAttribArray(aUv)
        gl.enableVertexAttribArray(aSF)
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, STRIDE * 4, 0)
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, STRIDE * 4, 12)
        gl.vertexAttribPointer(aSF, 2, gl.FLOAT, false, STRIDE * 4, 20)
        gl.uniform1i(U.tex, 0)
        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.disable(gl.CULL_FACE)

        // ---- Textures ----
        const texCache = new Map<string, Tex>()
        const getTex = (src: string): Tex => {
            let t = texCache.get(src)
            if (t) return t
            t = { src, tex: null, aspect: 1.5, ready: false, fade: 0, failed: false }
            texCache.set(src, t)
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            img.onload = () => {
                if (disposed) return
                const tt = t!
                tt.aspect = img.naturalWidth / img.naturalHeight || 1.5
                // Power-of-two copy so far-away cards can use mipmaps
                const w = 1024
                let h = 1024
                const want = 1024 / tt.aspect
                h = want > 768 ? 1024 : want > 384 ? 512 : 256
                const cv = document.createElement("canvas")
                cv.width = w
                cv.height = h
                const g = cv.getContext("2d")!
                g.imageSmoothingQuality = "high"
                try {
                    g.drawImage(img, 0, 0, w, h)
                    const tex = gl.createTexture()
                    gl.bindTexture(gl.TEXTURE_2D, tex)
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv)
                    gl.generateMipmap(gl.TEXTURE_2D)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                    if (aniso) {
                        const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
                        gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max))
                    }
                    tt.tex = tex
                    tt.ready = true
                } catch {
                    tt.failed = true // tainted canvas (no CORS)
                }
                kick()
            }
            img.onerror = () => {
                t!.failed = true
            }
            img.src = src
            return t
        }

        // ---- Engine state ----
        let disposed = false
        let raf = 0
        let running = false
        let visible = true
        let last = performance.now()
        let time = 0
        let W = 1,
            H = 1,
            dpr = 1
        let O = 0 // strip offset, in cards
        let vel = 0 // drag / inertia velocity (cards/s)
        let boost = 0 // scroll boost (cards/s)
        let hoverF = 1
        let snap: number | null = null
        let snapCard = 0
        let holdUntil = 0
        let yaw = VIEWS.lean[0],
            pitch = VIEWS.lean[1]
        let dist = 6
        let fov = 40
        let shiftY = 0 // clip-space shift so the loop sits above the controls
        let path: Path | null = null
        let C = 0
        let verts = new Float32Array(0)
        let flipA = new Float32Array(0)
        let flipB = new Float32Array(0)
        let hoverAmt = new Float32Array(0)
        let cardAsp = new Float32Array(0)
        const rho = new Float32Array(GRID).fill(1)
        const rhoT = new Float32Array(GRID)
        const cdf = new Float32Array(GRID + 1)
        const near = new Float32Array(GRID)
        let Z = 1
        let dMin = 0,
            dMax = 1
        let uStar = 0.25
        let qFocus = 0.25
        const mvp = new Float32Array(16)
        const occP = new Float32Array(OCC * 3)
        // projected card data for picking
        let scr = new Float32Array(0) // per vertex: sx, sy, depth
        let centers = new Float32Array(0) // per card: q, depth, sx, sy
        let order: number[] = []
        let hovered = -1
        let focused = 0
        const pointer = { x: 0, y: 0, inside: false, nx: 0, ny: 0, sx: 0, sy: 0 }
        let lastActive = -1,
            lastSide = -1

        const kick = () => {
            if (!running && !disposed) {
                running = true
                last = performance.now()
                raf = requestAnimationFrame(loop)
            }
        }

        // ---- Path sampling ----
        const sample = (u: number, out: Float32Array, o: number, arr: Float32Array) => {
            const f = mod(u, 1) * LUT
            const i = Math.floor(f) % LUT
            const j = (i + 1) % LUT
            const t = f - Math.floor(f)
            out[o] = lerp(arr[i * 3], arr[j * 3], t)
            out[o + 1] = lerp(arr[i * 3 + 1], arr[j * 3 + 1], t)
            out[o + 2] = lerp(arr[i * 3 + 2], arr[j * 3 + 2], t)
        }
        const P = new Float32Array(3),
            T = new Float32Array(3),
            N0 = new Float32Array(3),
            B0 = new Float32Array(3)

        const rhoAt = (u: number) => {
            const f = mod(u, 1) * GRID
            const i = Math.floor(f) % GRID
            return lerp(rho[i], rho[(i + 1) % GRID], f - Math.floor(f))
        }
        const curvAt = (u: number, arr: Float32Array) => {
            const f = mod(u, 1) * LUT
            const i = Math.floor(f) % LUT
            return lerp(arr[i], arr[(i + 1) % LUT], f - Math.floor(f))
        }
        const nearAt = (u: number) => {
            const f = mod(u, 1) * GRID
            const i = Math.floor(f) % GRID
            return lerp(near[i], near[(i + 1) % GRID], f - Math.floor(f))
        }
        const invCdf = (q: number) => {
            let lo = 0,
                hi = GRID
            while (hi - lo > 1) {
                const m = (lo + hi) >> 1
                if (cdf[m] <= q) lo = m
                else hi = m
            }
            const span = cdf[hi] - cdf[lo] || 1
            return (lo + (q - cdf[lo]) / span) / GRID
        }
        const cdfAt = (u: number) => {
            const f = mod(u, 1) * GRID
            const i = Math.floor(f)
            return lerp(cdf[i], cdf[Math.min(i + 1, GRID)], f - i)
        }
        const twistF = (Uc: number, style: string, gather: number) => {
            if (style !== "gathered") return Uc
            const V = Uc - gather + 0.5
            const n = Math.floor(V)
            return n + smooth(0.38, 0.62, V - n)
        }

        // ---- Matrices ----
        const rot = new Float32Array(9)
        const setRot = (yawD: number, pitchD: number) => {
            const y = (yawD * Math.PI) / 180,
                p = (pitchD * Math.PI) / 180
            const cy = Math.cos(y),
                sy = Math.sin(y),
                cp = Math.cos(p),
                sp = Math.sin(p)
            // R = Rx(p) * Ry(y)
            rot[0] = cy; rot[1] = 0; rot[2] = sy
            rot[3] = sp * sy; rot[4] = cp; rot[5] = -sp * cy
            rot[6] = -cp * sy; rot[7] = sp; rot[8] = cp * cy
        }
        const buildMVP = () => {
            const f = 1 / Math.tan((fov * Math.PI) / 360)
            const a = W / H
            const n = 0.05,
                fa = 100
            // projection * translate(0,0,-dist) * R  (column-major)
            const p00 = f / a,
                p11 = f,
                p22 = (fa + n) / (n - fa),
                p32 = (2 * fa * n) / (n - fa)
            const r = rot
            // view = [R | (0,0,-dist)]
            // column j of view: (r[0+j], r[3+j], r[6+j]) ; translation column (0,0,-dist)
            for (let j = 0; j < 3; j++) {
                const vx = r[j],
                    vy = r[3 + j],
                    vz = r[6 + j]
                mvp[j * 4 + 0] = p00 * vx
                mvp[j * 4 + 1] = p11 * vy
                mvp[j * 4 + 2] = p22 * vz
                mvp[j * 4 + 3] = -vz
            }
            mvp[12] = 0
            mvp[13] = 0
            mvp[14] = p22 * -dist + p32
            mvp[15] = dist
            if (shiftY) for (let c = 0; c < 4; c++) mvp[c * 4 + 1] += shiftY * mvp[c * 4 + 3]
        }
        // project world point -> screen px + view depth
        const proj = (x: number, y: number, z: number, out: Float32Array, o: number) => {
            const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12]
            const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13]
            const cw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15]
            const iw = 1 / Math.max(cw, 1e-4)
            out[o] = (cx * iw * 0.5 + 0.5) * W
            out[o + 1] = (0.5 - cy * iw * 0.5) * H
            out[o + 2] = cw
        }

        // ---- Resize ----
        const resize = () => {
            const r = root.getBoundingClientRect()
            W = Math.max(1, r.width)
            H = Math.max(1, r.height)
            dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.round(W * dpr)
            canvas.height = Math.round(H * dpr)
            setCompact(W < 680)
            kick()
        }
        const ro = new ResizeObserver(resize)
        ro.observe(root)
        resize()

        // ---- Visibility ----
        const io = new IntersectionObserver(
            (e) => {
                visible = e[0].isIntersecting
                if (visible) kick()
            },
            { threshold: 0 }
        )
        io.observe(root)
        const onVis = () => {
            if (!document.hidden) kick()
        }
        document.addEventListener("visibilitychange", onVis)

        // ---- Commands ----
        const targetFor = (card: number) =>
            O + wrapNear(qFocus * C - (card + O + 0.5), C)
        cmd.current.nav = (delta: number) => {
            if (!C) return
            const L = live.current
            const base = snap !== null ? snapCard : focused
            snapCard = mod(base + delta * -L.dir, C)
            snap = targetFor(snapCard)
            vel = 0
            holdUntil = time + (L.motion.hold ?? 2.5)
            kick()
        }
        cmd.current.goImage = (img: number) => {
            if (!C) return
            const n = live.current.gallery.length
            // nearest card showing this image
            let best = 0,
                bestD = 1e9
            for (let k = 0; k < C; k++) {
                if (k % n !== img) continue
                const d = Math.abs(wrapNear(qFocus * C - (k + O + 0.5), C))
                if (d < bestD) {
                    bestD = d
                    best = k
                }
            }
            snapCard = best
            snap = targetFor(best)
            vel = 0
            holdUntil = time + (live.current.motion.hold ?? 2.5)
            kick()
        }
        cmd.current.render = kick

        // ---- Pointer ----
        let down: null | { x: number; y: number; t: number; O: number; moved: boolean; k: number; sign: number; pxPerCard: number } = null
        let samples: { t: number; O: number }[] = []
        const local = (e: PointerEvent | WheelEvent) => {
            const r = canvas.getBoundingClientRect()
            return [e.clientX - r.left, e.clientY - r.top]
        }
        const pick = (x: number, y: number) => {
            let best = -1,
                bestD = 1e9
            const per = (SEG + 1) * 2
            for (let k = 0; k < C; k++) {
                const base = k * per
                for (let s = 0; s < SEG; s++) {
                    const i0 = (base + s * 2) * 3
                    // quad: v0(s,b0) v1(s,b1) v2(s+1,b0) v3(s+1,b1)
                    const ax = scr[i0], ay = scr[i0 + 1]
                    const bx = scr[i0 + 3], by = scr[i0 + 4]
                    const cx = scr[i0 + 6], cy = scr[i0 + 7]
                    const dx = scr[i0 + 9], dy = scr[i0 + 10]
                    if (inTri(x, y, ax, ay, bx, by, cx, cy) || inTri(x, y, bx, by, dx, dy, cx, cy)) {
                        const d = scr[i0 + 2]
                        if (d < bestD) {
                            bestD = d
                            best = k
                        }
                        break
                    }
                }
            }
            return best
        }
        const inTri = (px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
            const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
            const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
            const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
            const neg = d1 < 0 || d2 < 0 || d3 < 0
            const pos = d1 > 0 || d2 > 0 || d3 > 0
            return !(neg && pos)
        }
        // screen direction + length of a card (for drag mapping)
        const cardScreen = (k: number) => {
            const per = (SEG + 1) * 2
            const a = (k * per) * 3
            const b = (k * per + SEG * 2) * 3
            const dx = scr[b] - scr[a],
                dy = scr[b + 1] - scr[a + 1]
            return { dx, dy, len: Math.hypot(dx, dy) || 1 }
        }
        const onDown = (e: PointerEvent) => {
            if (e.button > 0) return
            const [x, y] = local(e)
            const k = pick(x, y)
            const ref = k >= 0 ? k : focused
            const cs = cardScreen(ref)
            // Drag follows the card's on-screen direction
            const horiz = Math.abs(cs.dx) >= Math.abs(cs.dy)
            const sign = horiz ? Math.sign(cs.dx) || 1 : Math.sign(cs.dy) || 1
            down = { x, y, t: time, O, moved: false, k, sign: horiz ? sign : sign * 2, pxPerCard: Math.max(40, cs.len / (1 - live.current.strip.gap)) }
            samples = [{ t: performance.now(), O }]
            snap = null
            kick()
        }
        const onMove = (e: PointerEvent) => {
            const [x, y] = local(e)
            pointer.x = x
            pointer.y = y
            pointer.inside = true
            pointer.nx = (x / W) * 2 - 1
            pointer.ny = (y / H) * 2 - 1
            if (down) {
                const dx = x - down.x
                const dy = y - down.y
                if (!down.moved && Math.hypot(dx, dy) > 6) {
                    down.moved = true
                    canvas.setPointerCapture(e.pointerId)
                }
                if (down.moved && live.current.motion.drag) {
                    const horiz = Math.abs(down.sign) === 1
                    const s = horiz ? down.sign : down.sign / 2
                    O = down.O + ((horiz ? dx : dy) * s) / down.pxPerCard
                    const now = performance.now()
                    samples.push({ t: now, O })
                    while (samples.length > 6) samples.shift()
                }
            }
            kick()
        }
        const onUp = (e: PointerEvent) => {
            if (!down) return
            const L = live.current
            if (down.moved) {
                const a = samples[0],
                    b = samples[samples.length - 1]
                const dt = (b.t - a.t) / 1000
                if (dt > 0 && performance.now() - b.t < 120) {
                    vel = clamp((b.O - a.O) / dt, -30, 30) * L.motion.inertia
                }
                holdUntil = time + 0.6
            } else if (down.k >= 0 && L.ui.click !== "none") {
                const k = down.k
                const img = k % L.gallery.length
                if (L.ui.click === "open" || k === focused) {
                    if (L.ui.lightbox) setLightbox(img)
                } else {
                    snapCard = k
                    snap = targetFor(k)
                    vel = 0
                    holdUntil = time + (L.motion.hold ?? 2.5)
                }
            }
            down = null
            kick()
        }
        const onLeave = () => {
            pointer.inside = false
            hovered = -1
            canvas.style.cursor = ""
            kick()
        }
        const onWheel = (e: WheelEvent) => {
            // Horizontal swipes (trackpad, shift + wheel) scrub the strip.
            // Vertical wheel is left to the page.
            const dx = e.shiftKey ? e.deltaY : e.deltaX
            if (Math.abs(dx) < 1 || Math.abs(dx) < Math.abs(e.shiftKey ? 0 : e.deltaY)) return
            e.preventDefault()
            const cs = cardScreen(focused)
            O -= (dx * (Math.sign(cs.dx) || 1)) / Math.max(60, cs.len)
            snap = null
            holdUntil = time + 0.8
            kick()
        }
        if (!isStatic) {
            canvas.addEventListener("pointerdown", onDown)
            canvas.addEventListener("pointermove", onMove)
            canvas.addEventListener("pointerup", onUp)
            canvas.addEventListener("pointercancel", onUp)
            canvas.addEventListener("pointerleave", onLeave)
            canvas.addEventListener("wheel", onWheel, { passive: false })
        }

        let lastScroll = window.scrollY
        const onScroll = () => {
            const dy = window.scrollY - lastScroll
            lastScroll = window.scrollY
            const L = live.current
            if (L.reduced || !L.motion.scrollBoost) return
            boost = clamp(boost + Math.abs(dy) * 0.02 * L.motion.scrollBoost, 0, 6)
            kick()
        }
        if (!isStatic) window.addEventListener("scroll", onScroll, { passive: true })

        // ---- Frame ----
        let pathSig = ""
        const fogCol = [0.95, 0.94, 0.92]
        let colSig = ""
        let placeCol = [0.85, 0.84, 0.8]
        let edgeCol = [0, 0, 0, 0.1]

        function loop(now: number) {
            raf = 0
            if (disposed) return
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            time += dt
            const busy = frame(dt)
            const L = live.current
            if (visible && !document.hidden && (busy || !L.isStatic)) {
                raf = requestAnimationFrame(loop)
            } else {
                running = false
            }
        }

        function frame(dt: number): boolean {
            const L = live.current
            const g = L.gallery
            const n = g.length
            const st = L.strip
            const fo = L.focus
            const ca = L.camera
            const lk = L.look

            // Card count: at least the requested count, and a whole number of image sets
            const want = Math.max(4, Math.round(st.cards))
            const reps = Math.max(1, Math.round(want / n))
            const newC = Math.max(n * reps, 4)
            if (newC !== C) {
                C = newC
                verts = new Float32Array(C * (SEG + 1) * 2 * STRIDE)
                scr = new Float32Array(C * (SEG + 1) * 2 * 3)
                centers = new Float32Array(C * 4)
                flipA = new Float32Array(C)
                flipB = new Float32Array(C)
                hoverAmt = new Float32Array(C)
                cardAsp = new Float32Array(C)
                order = Array.from({ length: C }, (_, i) => i)
                O = mod(O, 2 * C)
            }

            // Card size on the base loop
            const gap = clamp(st.gap, 0, 0.6)
            const pathLenGuess = path ? path.length : 6
            const cardLen = (pathLenGuess / C) * (1 - gap)
            const halfW0 = cardLen / clamp(st.aspect, 0.3, 4) / 2

            const sig = `${st.shape}|${st.depth}|${halfW0.toFixed(3)}`
            if (sig !== pathSig) {
                path = buildPath(st.shape, st.depth, halfW0 * 1.6)
                pathSig = sig
            }
            const pa = path!

            const cs = `${lk.background}|${lk.placeholder}|${lk.edge}`
            if (cs !== colSig) {
                colSig = cs
                const bg = parseColor(lk.background, [0.95, 0.94, 0.92, 1])
                fogCol[0] = bg[0]
                fogCol[1] = bg[1]
                fogCol[2] = bg[2]
                placeCol = parseColor(lk.placeholder, [0.85, 0.84, 0.8, 1])
                edgeCol = parseColor(lk.edge, [0, 0, 0, 0.1])
            }

            // ---- Motion ----
            let busy = false
            const hoverTarget = pointer.inside && hovered >= 0 ? clamp(L.motion.hoverSpeed, 0, 1) : 1
            hoverF = damp(hoverF, hoverTarget, 4, dt)
            if (down && down.moved) {
                busy = true
            } else if (snap !== null) {
                const before = O
                O = damp(O, snap, 5.5, dt)
                if (Math.abs(snap - O) < 0.0005) {
                    O = snap
                    snap = null
                }
                busy = busy || before !== O
            } else {
                const auto = L.playing && !L.isStatic && time > holdUntil ? L.motion.speed * L.speedMul * L.dir * hoverF : 0
                O += (auto + vel + boost * L.dir) * dt
                vel *= Math.exp(-dt * 2.2)
                if (Math.abs(vel) < 0.001) vel = 0
                busy = busy || auto !== 0 || vel !== 0
            }
            boost *= Math.exp(-dt * 2.5)
            if (boost < 0.001) boost = 0
            else busy = true
            // keep O bounded (twist repeats every two laps)
            if (O > 4 * C || O < -2 * C) {
                const s = Math.floor(O / (2 * C)) * 2 * C
                O -= s
                if (snap !== null) snap -= s
            }

            // ---- Camera ----
            let ty: number, tp: number
            if (ca.view === "orbit" && !L.reduced && !L.isStatic) {
                ty = Math.sin(time * 0.16) * 34
                tp = 14 + Math.sin(time * 0.11) * 10
                busy = true
            } else {
                const v = VIEWS[(ca.view as Exclude<View, "orbit">)] || VIEWS.lean
                ty = v[0]
                tp = v[1]
            }
            if (pointer.inside && !L.isStatic) {
                ty += pointer.nx * ca.parallax * 16
                tp += pointer.ny * ca.parallax * 9
            }
            const ny = L.isStatic ? ty : damp(yaw, ty, 3, dt)
            const np = L.isStatic ? tp : damp(pitch, tp, 3, dt)
            if (Math.abs(ny - ty) > 0.01 || Math.abs(np - tp) > 0.01) busy = true
            yaw = ny
            pitch = np
            setRot(yaw, pitch)
            fov = lerp(14, 64, clamp(ca.perspective, 0, 1))
            // Fit: closest camera distance where the whole loop stays in frame
            // Leave room for the interface: fit the loop into the free band
            const resB = (L.ui.controls ? 64 : 0) + (L.ui.ticker ? 64 : 0) + 16
            const resT = L.ui.caption || L.ui.minimap ? Math.min(96, H * 0.12) : 16
            const freeH = Math.max(H * 0.4, H - resB - resT)
            shiftY = (resB - resT) / H
            const tH0 = Math.tan((fov * Math.PI) / 360)
            const tH = tH0 * (freeH / H)
            const asp = (W / H) * (H / freeH)
            const pad = 1 + clamp(ca.padding, 0, 0.6)
            const maxRho = 1 + Math.max(0, fo.mode === "off" ? 0 : fo.strength)
            const m = halfW0 * Math.min(maxRho, 2.4) * 1.1
            let need = 0
            for (let k = 0; k < LUT; k += 6) {
                const x = pa.pos[k * 3], y = pa.pos[k * 3 + 1], z = pa.pos[k * 3 + 2]
                const rx = rot[0] * x + rot[1] * y + rot[2] * z
                const ry = rot[3] * x + rot[4] * y + rot[5] * z
                const rz = rot[6] * x + rot[7] * y + rot[8] * z
                need = Math.max(need, rz + ((Math.abs(rx) + m) * pad) / (tH * asp), rz + ((Math.abs(ry) + m) * pad) / tH)
            }
            const nd = L.isStatic || dist === 6 ? need : damp(dist, need, 4, dt)
            if (Math.abs(nd - need) > 0.001) busy = true
            dist = nd
            buildMVP()

            // ---- Focus field ----
            const mode = fo.strength > 0 ? fo.mode : "off"
            const tmp = new Float32Array(3)
            dMin = 1e9
            dMax = -1e9
            const depths = rhoT // reuse as temp
            for (let i = 0; i < GRID; i++) {
                sample(i / GRID, P, 0, pa.pos)
                proj(P[0], P[1], P[2], tmp, 0)
                depths[i] = tmp[2]
                if (tmp[2] < dMin) dMin = tmp[2]
                if (tmp[2] > dMax) dMax = tmp[2]
                near[i] = 0
                // stash screen pos for pointer mode in centers? compute below
                if (mode === "pointer") {
                    const ddx = tmp[0] - pointer.x, ddy = tmp[1] - pointer.y
                    near[i] = Math.hypot(ddx, ddy) // temp: distance in px
                }
            }
            const span = dMax - dMin || 1
            let bestW = -1
            const fall = clamp(fo.falloff, 0.3, 6)
            const radPx = Math.min(W, H) * 0.32 / Math.sqrt(fall)
            for (let i = 0; i < GRID; i++) {
                const nr = (dMax - depths[i]) / span // 1 = nearest
                let w: number
                if (mode === "pointer" && pointer.inside) {
                    const d = near[i] / radPx
                    w = Math.exp(-d * d)
                } else if (mode === "fixed") {
                    const d = wrapNear(i / GRID - fo.position, 1) / (0.16 / Math.sqrt(fall))
                    w = Math.exp(-d * d)
                } else {
                    w = Math.pow(nr, fall * 2)
                }
                near[i] = nr
                if (w > bestW) {
                    bestW = w
                    uStar = i / GRID
                }
                const target = mode === "off" ? 1 : 1 + fo.strength * w
                rho[i] = L.isStatic ? target : damp(rho[i], target, 6, dt)
                if (Math.abs(rho[i] - target) > 0.002) busy = true
            }
            // cdf of 1/rho: cards get path length proportional to rho
            cdf[0] = 0
            for (let i = 0; i < GRID; i++) cdf[i + 1] = cdf[i] + 1 / rho[i]
            Z = cdf[GRID] / GRID
            const tot = cdf[GRID]
            for (let i = 0; i <= GRID; i++) cdf[i] /= tot
            qFocus = cdfAt(uStar)

            // ---- Build card ribbons ----
            const h = Math.round(st.halfTwists)
            const style = st.twistStyle
            const gather = TWIST_AT[st.twistAt] ?? pa.gather
            const dimFar = clamp(fo.dimFar, 0, 1)
            // Depth shade and ambient occlusion
            const depthK = clamp(lk.depthShade ?? 0, 0, 1)
            const occK = clamp(lk.occlusion ?? 0, 0, 1)
            if (occK > 0) {
                for (let j = 0; j < OCC; j++) sample(j / OCC, occP, j * 3, pa.pos)
            }
            const camW = [rot[6] * dist, rot[7] * dist, rot[8] * dist]
            const occR = Math.max(halfW0 * 4.5, 0.12)
            const occR2 = 1 / (occR * occR)
            const occWin = Math.max(0.05, 1.6 / C)
            // light in view space -> world: L_world = R^T * L_view
            const lv = [0.35, 0.55, 0.76]
            const lw = [
                rot[0] * lv[0] + rot[3] * lv[1] + rot[6] * lv[2],
                rot[1] * lv[0] + rot[4] * lv[1] + rot[7] * lv[2],
                rot[2] * lv[0] + rot[5] * lv[1] + rot[8] * lv[2],
            ]
            let vi = 0,
                si = 0
            const tmp2 = new Float32Array(3)
            let px0 = 0, py0 = 0, pz0 = 0
            for (let k = 0; k < C; k++) {
                const base = k + O
                let lenW = 0
                let hwMid = 0
                for (let s = 0; s <= SEG; s++) {
                    const a = s / SEG
                    const cs2 = base + gap / 2 + a * (1 - gap)
                    const lap = Math.floor(cs2 / C)
                    const q = cs2 / C - lap
                    const u = invCdf(q)
                    sample(u, P, 0, pa.pos)
                    sample(u, T, 0, pa.tan)
                    sample(u, N0, 0, pa.n0)
                    sample(u, B0, 0, pa.b0)
                    const th = pa.theta0 + Math.PI * h * twistF(lap + u, style, gather)
                    const c = Math.cos(th), sn = Math.sin(th)
                    const wx = c * N0[0] + sn * B0[0]
                    const wy = c * N0[1] + sn * B0[1]
                    const wz = c * N0[2] + sn * B0[2]
                    // Focus grows cards more in length than in width,
                    // and width never exceeds what the curve can hold without folding
                    let hw = halfW0 * Math.pow(Z * rhoAt(u), 0.7)
                    const lim = (0.82 * curvAt(u, pa.curv)) / Math.max(Math.abs(c), 0.05)
                    if (hw > lim) hw = lim
                    if (s > 0) lenW += Math.hypot(P[0] - px0, P[1] - py0, P[2] - pz0)
                    px0 = P[0]; py0 = P[1]; pz0 = P[2]
                    if (s === SEG / 2) hwMid = hw
                    // normal = T x W
                    const nx = T[1] * wz - T[2] * wy
                    const ny2 = T[2] * wx - T[0] * wz
                    const nz = T[0] * wy - T[1] * wx
                    const lam = Math.abs(nx * lw[0] + ny2 * lw[1] + nz * lw[2])
                    const shade = 0.74 + 0.26 * lam
                    const nr = nearAt(u)
                    const fog = dimFar * Math.pow(1 - nr, 1.4) * 0.85
                    for (let b = 0; b < 2; b++) {
                        const sgn = b === 0 ? -1 : 1
                        const x = P[0] + wx * hw * sgn
                        const y = P[1] + wy * hw * sgn
                        const z = P[2] + wz * hw * sgn
                        proj(x, y, z, scr, si)
                        let sh = shade
                        if (depthK > 0) {
                            const dn = clamp((scr[si + 2] - dMin) / span, 0, 1)
                            sh *= 1 - depthK * 0.55 * Math.pow(dn, 1.2)
                        }
                        if (occK > 0) {
                            // Normal on the side the camera sees
                            let ox = nx, oy = ny2, oz = nz
                            const ol = Math.hypot(ox, oy, oz) || 1
                            ox /= ol; oy /= ol; oz /= ol
                            if (ox * (camW[0] - x) + oy * (camW[1] - y) + oz * (camW[2] - z) < 0) {
                                ox = -ox; oy = -oy; oz = -oz
                            }
                            let sum = 0
                            for (let j = 0; j < OCC; j++) {
                                if (Math.abs(wrapNear(j / OCC - u, 1)) < occWin) continue
                                const dx = occP[j * 3] - x, dy = occP[j * 3 + 1] - y, dz = occP[j * 3 + 2] - z
                                const d2 = dx * dx + dy * dy + dz * dz
                                const fall = Math.exp(-d2 * occR2)
                                if (fall < 0.01) continue
                                const cosw = (ox * dx + oy * dy + oz * dz) / (Math.sqrt(d2) || 1)
                                sum += fall * (0.2 + 0.8 * Math.max(0, cosw))
                            }
                            sh *= 1 - occK * 0.7 * Math.min(1, sum * 0.35)
                        }
                        verts[vi++] = x
                        verts[vi++] = y
                        verts[vi++] = z
                        verts[vi++] = a
                        verts[vi++] = b
                        verts[vi++] = sh
                        verts[vi++] = fog
                        si += 3
                    }
                }
                cardAsp[k] = clamp(lenW / (2 * hwMid || 1), 0.2, 8)
                // card center
                const mid = (k * (SEG + 1) * 2 + SEG) * 3 // vertex index of slice SEG/2, b=0
                const midB = mid + 3
                const cq = fract((base + 0.5) / C)
                centers[k * 4] = cq
                centers[k * 4 + 1] = (scr[mid + 2] + scr[midB + 2]) / 2
                centers[k * 4 + 2] = (scr[mid] + scr[midB]) / 2
                centers[k * 4 + 3] = (scr[mid + 1] + scr[midB + 1]) / 2

                // Keep upright: which way the card lands on screen
                if (L.focus.upright === "keep") {
                    const s0 = (k * (SEG + 1) * 2) * 3
                    const s1 = (k * (SEG + 1) * 2 + SEG * 2) * 3
                    const lx = scr[s1] - scr[s0], ly = scr[s1 + 1] - scr[s0 + 1]
                    const ll = Math.hypot(lx, ly) || 1
                    const wxs = scr[midB] - scr[mid], wys = scr[midB + 1] - scr[mid + 1]
                    const wl = Math.hypot(wxs, wys) || 1
                    let ta = flipA[k] > 0.5 ? 1 : 0
                    let tb = flipB[k] > 0.5 ? 1 : 0
                    // Pick the reading that matches the dominant screen axes
                    if (Math.abs(lx / ll) >= Math.abs(ly / ll)) {
                        if (lx / ll < -0.3) ta = 1
                        else if (lx / ll > 0.3) ta = 0
                        if (wys / wl < -0.3) tb = 1
                        else if (wys / wl > 0.3) tb = 0
                    } else {
                        // card runs vertically: keep the image's top toward screen top
                        if (wys / wl < -0.3) tb = 1
                        else if (wys / wl > 0.3) tb = 0
                    }
                    const fa = L.isStatic ? ta : damp(flipA[k], ta, 9, dt)
                    const fb = L.isStatic ? tb : damp(flipB[k], tb, 9, dt)
                    if (Math.abs(fa - ta) > 0.003 || Math.abs(fb - tb) > 0.003) busy = true
                    flipA[k] = fa
                    flipB[k] = fb
                } else {
                    flipA[k] = 0
                    flipB[k] = 0
                }
            }

            // Focused card: closest center to the focus point
            let fBest = 0,
                fD = 1e9
            for (let k = 0; k < C; k++) {
                const d = Math.abs(wrapNear(centers[k * 4] - qFocus, 1))
                if (d < fD) {
                    fD = d
                    fBest = k
                }
            }
            focused = fBest

            // Hover
            if (pointer.inside && !down && !L.isStatic) {
                hovered = pick(pointer.x, pointer.y)
                canvas.style.cursor = hovered >= 0 && L.ui.click !== "none" ? "pointer" : L.motion.drag ? "grab" : ""
            } else if (down && down.moved) {
                canvas.style.cursor = "grabbing"
            }
            for (let k = 0; k < C; k++) {
                const t = k === hovered ? 1 : 0
                hoverAmt[k] = damp(hoverAmt[k], t, 10, dt)
                if (Math.abs(hoverAmt[k] - t) > 0.01) busy = true
            }

            // ---- Draw ----
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.useProgram(prog)
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW)
            gl.uniformMatrix4fv(U.mvp, false, mvp)
            gl.uniform1f(U.radius, clamp(st.radius, 0, 0.5))
            gl.uniform1f(U.back, clamp(lk.backShade, 0, 1))
            gl.uniform3f(U.fog, fogCol[0], fogCol[1], fogCol[2])
            gl.uniform3f(U.place, placeCol[0], placeCol[1], placeCol[2])
            gl.uniform4f(U.edge, edgeCol[0], edgeCol[1], edgeCol[2], edgeCol[3])
            gl.activeTexture(gl.TEXTURE0)
            // back to front
            order.sort((a, b) => centers[b * 4 + 1] - centers[a * 4 + 1])
            const per = (SEG + 1) * 2
            for (const k of order) {
                const item = g[k % n]
                const tx = getTex(item.src)
                if (tx.ready) {
                    if (tx.fade < 1) {
                        tx.fade = L.isStatic ? 1 : Math.min(1, tx.fade + dt * 2.5)
                        busy = true
                    }
                    gl.bindTexture(gl.TEXTURE_2D, tx.tex)
                    const ia = tx.aspect
                    const ac = cardAsp[k]
                    if (ia > ac) gl.uniform2f(U.cover, ac / ia, 1)
                    else gl.uniform2f(U.cover, 1, ia / ac)
                    gl.uniform1f(U.hasTex, 1)
                    gl.uniform1f(U.fade, tx.fade)
                } else {
                    gl.uniform1f(U.hasTex, 0)
                    gl.uniform1f(U.fade, 0)
                }
                gl.uniform1f(U.aspect, cardAsp[k])
                gl.uniform2f(U.flip, flipA[k], flipB[k])
                gl.uniform1f(U.hover, hoverAmt[k])
                gl.drawArrays(gl.TRIANGLE_STRIP, k * per, per)
            }

            // ---- DOM sync: ticker, minimap, focused caption ----
            const img = focused % n
            const fCard = qFocus * C - O - 0.5 // fractional card index at focus
            const imgF = mod(fCard, n)
            const tk = tickerRef.current
            if (tk) {
                const step = parseFloat(tk.dataset.step || "72")
                const cw = tk.parentElement ? tk.parentElement.clientWidth : W
                tk.style.transform = `translate3d(${cw / 2 - (imgF + n) * step - 32}px,0,0)`
                const kids = tk.children
                for (let i = 0; i < kids.length; i++) {
                    const on = i % n === img
                    const el = kids[i] as HTMLElement
                    if ((el.dataset.on === "1") !== on) el.dataset.on = on ? "1" : "0"
                }
            }
            const md = miniDotsRef.current
            if (md) {
                const kids = md.children
                for (let k = 0; k < kids.length && k < C; k++) {
                    const u = invCdf(centers[k * 4])
                    const [mx, my] = miniXY(st.shape, u)
                    const el = kids[k] as SVGCircleElement
                    el.setAttribute("cx", mx.toFixed(1))
                    el.setAttribute("cy", my.toFixed(1))
                    el.setAttribute("r", (1.2 + Math.min(2.6, rhoAt(u) * 1.1)).toFixed(2))
                    el.setAttribute("data-on", k === focused ? "1" : "0")
                }
            }
            const mf = miniFocusRef.current
            if (mf) {
                const [mx, my] = miniXY(st.shape, uStar)
                mf.setAttribute("cx", mx.toFixed(1))
                mf.setAttribute("cy", my.toFixed(1))
            }
            if (img !== lastActive) {
                lastActive = img
                setActive(img)
            }
            const lapNow = mod(Math.floor((focused + O + 0.5) / C), 2)
            if (lapNow !== lastSide) {
                lastSide = lapNow
                setSide(lapNow)
            }
            return busy
        }

        // Lost GPU context (tab in background on mobile, driver reset): stop, then rebuild on restore
        let wasLost = false
        const onLost = (e: Event) => {
            e.preventDefault()
            wasLost = true
            disposed = true
            cancelAnimationFrame(raf)
        }
        const onRestored = () => setGlEpoch((v) => v + 1)
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        kick()

        return () => {
            disposed = true
            cancelAnimationFrame(raf)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            window.removeEventListener("scroll", onScroll)
            canvas.removeEventListener("pointerdown", onDown)
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerup", onUp)
            canvas.removeEventListener("pointercancel", onUp)
            canvas.removeEventListener("pointerleave", onLeave)
            canvas.removeEventListener("wheel", onWheel)
            // After a loss, old GPU objects are already gone and must not be deleted
            if (!wasLost && !gl.isContextLost()) {
                texCache.forEach((t) => t.tex && gl.deleteTexture(t.tex))
                gl.deleteBuffer(buf)
                gl.deleteProgram(prog)
                // Free the GPU context now; browsers cap how many can be open at once
                gl.getExtension("WEBGL_lose_context")?.loseContext()
            }
            cmd.current = {}
        }
    }, [glEpoch, isStatic])

    // Re-render a frame whenever props or UI state change (needed when the loop is idle)
    useEffect(() => {
        cmd.current.render && cmd.current.render()
    })

    // ---------- Keyboard ----------
    const onKey = useCallback(
        (e: React.KeyboardEvent) => {
            // The lightbox handles its own keys; nothing reacts in a static render
            if (lightbox !== null || isStatic) return
            if (e.key === "Escape" && moreOpen) {
                setMoreOpen(false)
                e.preventDefault()
                return
            }
            if (e.key === "ArrowRight") cmd.current.nav?.(1)
            else if (e.key === "ArrowLeft") cmd.current.nav?.(-1)
            else if (e.key === " ") setPlaying((p) => !p)
            else if (e.key === "Enter" && ui.lightbox) setLightbox(active)
            else return
            e.preventDefault()
        },
        [lightbox, active, ui.lightbox, moreOpen, isStatic]
    )

    // ---------- Lightbox focus ----------
    // Focus moves into the dialog on open, stays inside while open,
    // and returns to whatever opened it on close.
    const lbRef = useRef<HTMLDivElement>(null)
    const lbCloseRef = useRef<HTMLButtonElement>(null)
    const lbReturnRef = useRef<HTMLElement | null>(null)
    const lbOpen = lightbox !== null
    useEffect(() => {
        if (!lbOpen) return
        const prev = document.activeElement as HTMLElement | null
        lbReturnRef.current = prev && prev !== document.body ? prev : rootRef.current
        lbCloseRef.current?.focus()
        return () => {
            const back = lbReturnRef.current
            lbReturnRef.current = null
            const target = back && back.isConnected ? back : rootRef.current
            target?.focus({ preventScroll: true })
        }
    }, [lbOpen])
    const onLightboxKey = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            e.stopPropagation()
            if (e.key === "Escape") setLightbox(null)
            else if (e.key === "ArrowRight") setLightbox((i) => mod((i ?? 0) + 1, gallery.length))
            else if (e.key === "ArrowLeft") setLightbox((i) => mod((i ?? 0) - 1, gallery.length))
            else if (e.key === "Tab") {
                const box = lbRef.current
                if (!box) return
                const items = Array.from(box.querySelectorAll<HTMLElement>("button:not([disabled])"))
                if (!items.length) return
                const first = items[0],
                    last = items[items.length - 1]
                const at = document.activeElement
                if (e.shiftKey && (at === first || !box.contains(at))) last.focus()
                else if (!e.shiftKey && (at === last || !box.contains(at))) first.focus()
                else return
            } else return
            e.preventDefault()
        },
        [gallery.length]
    )

    // ---------- Theme ----------
    const dark = look.theme === "dark"
    const ink = dark ? "#F4F3EF" : "#141414"
    const sub = dark ? "rgba(244,243,239,0.6)" : "rgba(20,20,20,0.56)"
    const glass = dark ? "rgba(24,24,26,0.62)" : "rgba(255,255,255,0.66)"
    const line = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
    const accent = look.accent
    const fontFamily = font.fontFamily || `"Inter Display", "Inter", system-ui, sans-serif`
    const cur = gallery[active] || gallery[0]
    const n = gallery.length
    const pad2 = (v: number) => String(v).padStart(2, "0")
    const odd = Math.round(strip.halfTwists) % 2 === 1

    const btn: React.CSSProperties = {
        all: "unset",
        boxSizing: "border-box",
        width: compact ? 32 : 36,
        height: compact ? 32 : 36,
        borderRadius: 18,
        flex: "none",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        color: ink,
        transition: "background .25s ease, transform .25s ease",
    }
    const seg = (on: boolean): React.CSSProperties => ({
        all: "unset",
        boxSizing: "border-box",
        height: 30,
        padding: compact ? "0 8px" : "0 11px",
        borderRadius: 15,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: 0.1,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        color: on ? (dark ? "#141414" : "#fff") : ink,
        background: on ? (dark ? "#F4F3EF" : "#141414") : "transparent",
        transition: "background .3s ease, color .3s ease",
    })
    const divider: React.CSSProperties = { width: 1, height: 20, flex: "none", background: line, margin: compact ? "0 2px" : "0 4px" }
    // Camera view and strip shape: inline in the bar when wide, in the panel when narrow
    const viewShape = (
        <>
            <div role="group" aria-label="Camera view" style={{ display: "flex", gap: 2 }}>
                {(["front", "lean", "above", "orbit"] as View[]).map((v) => (
                    <button key={v} className="mg-seg" style={seg(view === v)} aria-pressed={view === v} onClick={() => setView(v)}>
                        {v[0].toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>
            <span style={divider} />
            <div role="group" aria-label="Strip shape" style={{ display: "flex", gap: 2 }}>
                <button className="mg-seg" style={{ ...seg(shape === "infinity"), padding: compact ? "0 7px" : "0 9px" }} aria-label="Infinity loop" aria-pressed={shape === "infinity"} onClick={() => setShape("infinity")}>
                    <Icon k="inf" size={17} />
                </button>
                <button className="mg-seg" style={{ ...seg(shape === "ring"), padding: compact ? "0 7px" : "0 9px" }} aria-label="Ring" aria-pressed={shape === "ring"} onClick={() => setShape("ring")}>
                    <Icon k="ring" size={17} />
                </button>
            </div>
        </>
    )

    const miniPath = useMemo(() => {
        let d = ""
        for (let i = 0; i <= 120; i++) {
            const [x, y] = miniXY(shape, i / 120)
            d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
        }
        return d + "Z"
    }, [shape])

    const cardsOnLoop = Math.max(n * Math.max(1, Math.round(Math.max(4, Math.round(strip.cards)) / n)), 4)

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label={props.label || "Möbius gallery"}
            tabIndex={0}
            onKeyDown={onKey}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: look.background,
                transition: "background-color .5s ease, color .5s ease",
                fontFamily,
                color: ink,
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                isolation: "isolate",
            }}
        >
            <style>{`
                .mg-btn:hover{background:${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}}
                .mg-btn:active{transform:scale(.94)}
                .mg-btn:focus-visible,.mg-seg:focus-visible,.mg-th:focus-visible{outline:2px solid ${accent};outline-offset:2px}
                .mg-th{transition:transform .45s cubic-bezier(.2,.7,.2,1),opacity .45s ease,box-shadow .45s ease}
                .mg-th[data-on="1"]{transform:translateY(-4px) scale(1.12);opacity:1!important;box-shadow:0 0 0 2px ${accent},0 8px 18px rgba(0,0,0,.18)}
                .mg-dot{transition:fill .3s ease}
                .mg-dot[data-on="1"]{fill:${accent}}
                .mg-cap{animation:mgIn .6s cubic-bezier(.2,.7,.2,1) both}
                @keyframes mgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
                .mg-lb{animation:mgFade .35s ease both}
                @keyframes mgFade{from{opacity:0}to{opacity:1}}
                .mg-lbimg{animation:mgZoom .5s cubic-bezier(.2,.7,.2,1) both}
                @keyframes mgZoom{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
                @media (prefers-reduced-motion: reduce){.mg-cap,.mg-lb,.mg-lbimg{animation:none}}
            `}</style>

            {look.shadow && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "12%",
                        right: "12%",
                        bottom: ui.ticker ? "17%" : "9%",
                        height: "12%",
                        borderRadius: "50%",
                        background: dark ? "rgba(0,0,0,0.55)" : "rgba(40,30,10,0.16)",
                        filter: "blur(40px)",
                        pointerEvents: "none",
                    }}
                />
            )}

            <canvas
                key={glEpoch}
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: "pan-y",
                }}
            />

            {glFailed && (
                <div style={{ position: "absolute", inset: 0, display: "flex", gap: 12, alignItems: "center", overflowX: "auto", padding: 24 }}>
                    {gallery.map((g, i) => (
                        <img key={i} src={g.src} alt={g.alt} style={{ height: "60%", borderRadius: 12, flex: "none" }} />
                    ))}
                </div>
            )}

            {/* Caption */}
            {ui.caption && cur && (
                <div
                    aria-live="polite"
                    style={{
                        position: "absolute",
                        left: compact ? 18 : 32,
                        top: compact ? 18 : 28,
                        maxWidth: "52%",
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ fontSize: compact ? 28 : 40, fontWeight: 600, letterSpacing: -1.2, lineHeight: 1 }}>
                            {pad2(active + 1)}
                        </span>
                        <span style={{ fontSize: 13, color: sub, fontWeight: 500 }}>/ {pad2(n)}</span>
                    </div>
                    <div key={active} className="mg-cap" style={{ marginTop: 10 }}>
                        <div style={{ fontSize: compact ? 15 : 19, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.2 }}>
                            {cur.title}
                        </div>
                        {cur.meta && (
                            <div style={{ fontSize: 11, marginTop: 6, color: sub, textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 500 }}>
                                {cur.meta}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Minimap */}
            {ui.minimap && !compact && (
                <div
                    style={{
                        position: "absolute",
                        right: 28,
                        top: 24,
                        padding: "10px 12px 8px",
                        borderRadius: 16,
                        background: glass,
                        border: `1px solid ${line}`,
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        pointerEvents: "none",
                    }}
                >
                    <svg width="132" height="58" viewBox="0 0 132 58" aria-hidden="true">
                        <path d={miniPath} fill="none" stroke={sub} strokeOpacity={0.45} strokeWidth="1.2" />
                        <circle ref={miniFocusRef} r="9" fill={accent} fillOpacity={0.14} />
                        <g ref={miniDotsRef}>
                            {Array.from({ length: cardsOnLoop }).map((_, i) => (
                                <circle key={i} className="mg-dot" r="2" fill={ink} fillOpacity={0.75} />
                            ))}
                        </g>
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: 0.9, textTransform: "uppercase", color: sub, fontWeight: 500, marginTop: 2 }}>
                        <span>Focus</span>
                        {odd ? (
                            <span title="A Möbius strip has one side. A card needs two laps to come home.">
                                Lap {side === 0 ? "A" : "B"}
                            </span>
                        ) : (
                            <span>{cardsOnLoop} cards</span>
                        )}
                    </div>
                </div>
            )}

            {/* Ticker + controls */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                    paddingBottom: compact ? 14 : 22,
                    pointerEvents: "none",
                }}
            >
                {ui.controls && ui.views && compact && moreOpen && (
                    <div
                        id="mg-more"
                        role="group"
                        aria-label="View and shape"
                        style={{
                            pointerEvents: "auto",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 2,
                            padding: 4,
                            maxWidth: "calc(100% - 16px)",
                            borderRadius: 20,
                            background: glass,
                            border: `1px solid ${line}`,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            boxShadow: dark ? "none" : "0 10px 30px rgba(20,16,8,0.08)",
                        }}
                    >
                        {viewShape}
                    </div>
                )}
                {ui.controls && (
                    <div
                        style={{
                            pointerEvents: "auto",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            alignItems: "center",
                            maxWidth: "calc(100% - 16px)",
                            gap: compact ? 2 : 4,
                            padding: 4,
                            borderRadius: 24,
                            background: glass,
                            border: `1px solid ${line}`,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            boxShadow: dark ? "none" : "0 10px 30px rgba(20,16,8,0.08)",
                        }}
                    >
                        <button className="mg-btn" style={btn} aria-label="Previous image" onClick={() => cmd.current.nav?.(-1)}>
                            <Icon k="prev" />
                        </button>
                        <button
                            className="mg-btn"
                            style={{ ...btn, background: accent, color: "#fff" }}
                            aria-label={playing ? "Pause" : "Play"}
                            onClick={() => setPlaying((p) => !p)}
                        >
                            <Icon k={playing ? "pause" : "play"} />
                        </button>
                        <button className="mg-btn" style={btn} aria-label="Next image" onClick={() => cmd.current.nav?.(1)}>
                            <Icon k="next" />
                        </button>
                        <span style={divider} />
                        <button
                            className="mg-btn"
                            style={{ ...btn, width: compact ? 40 : 46, fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                            aria-label={`Speed ${SPEEDS[speedIdx]}x. Change speed`}
                            onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
                        >
                            {SPEEDS[speedIdx]}×
                        </button>
                        <button
                            className="mg-btn"
                            style={{ ...btn, color: reverse ? accent : ink }}
                            aria-label="Reverse direction"
                            aria-pressed={reverse}
                            onClick={() => setReverse((r) => !r)}
                        >
                            <Icon k="reverse" />
                        </button>
                        {ui.views && !compact && (
                            <>
                                <span style={divider} />
                                {viewShape}
                            </>
                        )}
                        {ui.views && compact && (
                            <button
                                className="mg-btn"
                                style={{ ...btn, color: moreOpen ? accent : ink }}
                                aria-label="View and shape"
                                aria-expanded={moreOpen}
                                aria-controls="mg-more"
                                onClick={() => setMoreOpen((o) => !o)}
                            >
                                <Icon k="sliders" />
                            </button>
                        )}
                        <span style={divider} />
                        {ui.themeSwitch && (
                            <button
                                className="mg-btn"
                                style={btn}
                                aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                                onClick={() => setFlip((f) => !f)}
                            >
                                <Icon k={dark ? "sun" : "moon"} />
                            </button>
                        )}
                        <button
                            className="mg-btn"
                            style={btn}
                            aria-label="Full screen"
                            onClick={() => {
                                const el = rootRef.current
                                if (!el) return
                                if (document.fullscreenElement) document.exitFullscreen?.()
                                else el.requestFullscreen?.()
                            }}
                        >
                            <Icon k="full" />
                        </button>
                    </div>
                )}

                {ui.ticker && (
                    <div
                        style={{
                            pointerEvents: "auto",
                            width: "100%",
                            overflow: "hidden",
                            padding: "8px 0 4px",
                            maskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)",
                            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)",
                        }}
                    >
                        <div ref={tickerRef} data-step="72" style={{ display: "flex", gap: 8, willChange: "transform", width: "max-content" }}>
                            {[0, 1, 2].flatMap((rep) =>
                                gallery.map((g, i) => (
                                    <button
                                        key={rep + "-" + i}
                                        className="mg-th"
                                        aria-label={`Show ${g.title || "image " + (i + 1)}`}
                                        tabIndex={rep === 1 ? 0 : -1}
                                        onClick={() => cmd.current.goImage?.(i)}
                                        style={{
                                            all: "unset",
                                            boxSizing: "border-box",
                                            width: 64,
                                            height: 42,
                                            borderRadius: 8,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            flex: "none",
                                            opacity: 0.55,
                                            background: look.placeholder,
                                        }}
                                    >
                                        <img src={g.thumb} alt="" draggable={false} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox !== null && gallery[lightbox] && (
                <div
                    ref={lbRef}
                    className="mg-lb"
                    role="dialog"
                    aria-modal="true"
                    aria-label={gallery[lightbox].title || "Image"}
                    tabIndex={-1}
                    onKeyDown={onLightboxKey}
                    onClick={() => setLightbox(null)}
                    style={{
                        outline: "none",
                        position: "absolute",
                        inset: 0,
                        zIndex: 5,
                        background: dark ? "rgba(10,10,12,0.9)" : "rgba(242,240,235,0.9)",
                        backdropFilter: "blur(18px)",
                        WebkitBackdropFilter: "blur(18px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 18,
                        padding: compact ? 16 : 40,
                    }}
                >
                    <img
                        key={lightbox}
                        className="mg-lbimg"
                        src={gallery[lightbox].src}
                        alt={gallery[lightbox].alt}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: "100%", maxHeight: "72%", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.25)", objectFit: "contain" }}
                    />
                    <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: sub, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
                            {pad2(lightbox + 1)} / {pad2(n)}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6, letterSpacing: -0.3 }}>{gallery[lightbox].title}</div>
                        {gallery[lightbox].meta && (
                            <div style={{ fontSize: 11, color: sub, marginTop: 6, textTransform: "uppercase", letterSpacing: 1.1 }}>{gallery[lightbox].meta}</div>
                        )}
                    </div>
                    <button ref={lbCloseRef} className="mg-btn" aria-label="Close" style={{ ...btn, position: "absolute", top: 18, right: 18, background: glass }} onClick={() => setLightbox(null)}>
                        <Icon k="close" />
                    </button>
                    <button
                        className="mg-btn"
                        aria-label="Previous image"
                        style={{ ...btn, position: "absolute", left: 18, top: "50%", background: glass, width: 44, height: 44, borderRadius: 22 }}
                        onClick={(e) => {
                            e.stopPropagation()
                            setLightbox((i) => mod((i ?? 0) - 1, n))
                        }}
                    >
                        <Icon k="prev" />
                    </button>
                    <button
                        className="mg-btn"
                        aria-label="Next image"
                        style={{ ...btn, position: "absolute", right: 18, top: "50%", background: glass, width: 44, height: 44, borderRadius: 22 }}
                        onClick={(e) => {
                            e.stopPropagation()
                            setLightbox((i) => mod((i ?? 0) + 1, n))
                        }}
                    >
                        <Icon k="next" />
                    </button>
                </div>
            )}
        </div>
    )
}

// Minimap projection of the loop (front view)
function miniXY(shape: Shape, u: number): [number, number] {
    const t = u * Math.PI * 2
    if (shape === "ring") return [66 + Math.cos(t) * 56, 29 + Math.sin(t) * 22]
    // Arc length and curve parameter differ slightly; close enough for a minimap
    return [66 + Math.cos(t) * 56, 29 + Math.sin(2 * t) * 22]
}

MobiusGallery.displayName = "Möbius Gallery"

// ---------- Property controls ----------

addPropertyControls(MobiusGallery, {
    items: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Untitled" },
                meta: { type: ControlType.String, title: "Meta", defaultValue: "" },
            },
        },
        description: "Leave empty to see the demo set.",
    },
    strip: {
        type: ControlType.Object,
        title: "Strip",
        controls: {
            shape: { type: ControlType.Enum, title: "Shape", options: ["infinity", "ring"], optionTitles: ["Infinity", "Ring"], defaultValue: STRIP_D.shape, displaySegmentedControl: true },
            cards: { type: ControlType.Number, title: "Cards", min: 4, max: 48, step: 1, defaultValue: STRIP_D.cards, description: "Rounded to whole sets of images." },
            aspect: { type: ControlType.Number, title: "Card Ratio", min: 0.6, max: 2.4, step: 0.05, defaultValue: STRIP_D.aspect },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 0.4, step: 0.01, defaultValue: STRIP_D.gap },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 0.3, step: 0.01, defaultValue: STRIP_D.radius },
            halfTwists: { type: ControlType.Number, title: "Half Twists", min: 0, max: 5, step: 1, defaultValue: STRIP_D.halfTwists, description: "Odd numbers make a Möbius strip." },
            twistStyle: { type: ControlType.Enum, title: "Twist", options: ["gathered", "even"], optionTitles: ["Gathered", "Even"], defaultValue: STRIP_D.twistStyle, displaySegmentedControl: true },
            twistAt: { type: ControlType.Enum, title: "Twist At", options: ["auto", "front", "back", "left", "right"], optionTitles: ["Auto", "Front", "Back", "Left", "Right"], defaultValue: STRIP_D.twistAt, description: "Where a gathered twist sits. Back tucks it behind the crossing." },
            depth: { type: ControlType.Number, title: "Depth", min: 0, max: 1, step: 0.05, defaultValue: STRIP_D.depth },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: true },
            speed: { type: ControlType.Number, title: "Speed", min: 0, max: 3, step: 0.05, defaultValue: MOTION_D.speed, unit: " c/s" },
            direction: { type: ControlType.Enum, title: "Direction", options: ["forward", "backward"], optionTitles: ["Forward", "Backward"], defaultValue: "forward", displaySegmentedControl: true },
            hoverSpeed: { type: ControlType.Number, title: "On Hover", min: 0, max: 1, step: 0.05, defaultValue: MOTION_D.hoverSpeed, description: "Speed while a card is hovered. 0 stops." },
            drag: { type: ControlType.Boolean, title: "Drag", defaultValue: true },
            inertia: { type: ControlType.Number, title: "Inertia", min: 0, max: 1, step: 0.05, defaultValue: MOTION_D.inertia },
            scrollBoost: { type: ControlType.Number, title: "Scroll Boost", min: 0, max: 2, step: 0.1, defaultValue: MOTION_D.scrollBoost },
            hold: { type: ControlType.Number, title: "Hold", min: 0, max: 8, step: 0.5, defaultValue: MOTION_D.hold, unit: "s", description: "Pause after prev / next before autoplay resumes." },
        },
    },
    camera: {
        type: ControlType.Object,
        title: "Camera",
        controls: {
            view: { type: ControlType.Enum, title: "View", options: ["front", "lean", "above", "low", "orbit"], optionTitles: ["Front", "Lean", "Above", "Low", "Orbit"], defaultValue: CAMERA_D.view },
            perspective: { type: ControlType.Number, title: "Perspective", min: 0, max: 1, step: 0.05, defaultValue: CAMERA_D.perspective },
            parallax: { type: ControlType.Number, title: "Parallax", min: 0, max: 1, step: 0.05, defaultValue: CAMERA_D.parallax },
            padding: { type: ControlType.Number, title: "Padding", min: 0, max: 0.6, step: 0.02, defaultValue: CAMERA_D.padding },
        },
    },
    focus: {
        type: ControlType.Object,
        title: "Focus",
        controls: {
            mode: { type: ControlType.Enum, title: "Focus On", options: ["depth", "pointer", "fixed", "off"], optionTitles: ["Nearest", "Pointer", "Fixed", "Off"], defaultValue: FOCUS_D.mode },
            strength: { type: ControlType.Number, title: "Strength", min: 0, max: 3, step: 0.05, defaultValue: FOCUS_D.strength },
            falloff: { type: ControlType.Number, title: "Falloff", min: 0.3, max: 5, step: 0.1, defaultValue: FOCUS_D.falloff },
            position: { type: ControlType.Number, title: "Position", min: 0, max: 1, step: 0.01, defaultValue: FOCUS_D.position, hidden: (p: any) => p.mode !== "fixed" },
            dimFar: { type: ControlType.Number, title: "Dim Far", min: 0, max: 1, step: 0.05, defaultValue: FOCUS_D.dimFar },
            upright: { type: ControlType.Enum, title: "Images", options: ["keep", "follow"], optionTitles: ["Upright", "Follow"], defaultValue: FOCUS_D.upright, displaySegmentedControl: true },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        controls: {
            theme: { type: ControlType.Enum, title: "UI", options: ["light", "dark"], optionTitles: ["Light", "Dark"], defaultValue: "light", displaySegmentedControl: true },
            background: { type: ControlType.Color, title: "Background", defaultValue: LOOK_D.background },
            accent: { type: ControlType.Color, title: "Accent", defaultValue: LOOK_D.accent },
            placeholder: { type: ControlType.Color, title: "Placeholder", defaultValue: LOOK_D.placeholder },
            edge: { type: ControlType.Color, title: "Edge", defaultValue: LOOK_D.edge },
            backShade: { type: ControlType.Number, title: "Back Shade", min: 0, max: 0.6, step: 0.02, defaultValue: LOOK_D.backShade },
            depthShade: { type: ControlType.Number, title: "Depth Shade", min: 0, max: 1, step: 0.05, defaultValue: LOOK_D.depthShade, description: "Darkens the parts of the strip farther from the camera." },
            occlusion: { type: ControlType.Number, title: "Occlusion", min: 0, max: 1, step: 0.05, defaultValue: LOOK_D.occlusion, description: "Soft shadow where the strip passes over itself and in tight curves." },
            shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true },
            altBackground: { type: ControlType.Color, title: "Alt Background", defaultValue: LOOK_D.altBackground, description: "Other-theme colours, used by Interface › Theme Switch." },
            altAccent: { type: ControlType.Color, title: "Alt Accent", defaultValue: LOOK_D.altAccent },
            altPlaceholder: { type: ControlType.Color, title: "Alt Placeholder", defaultValue: LOOK_D.altPlaceholder },
            altEdge: { type: ControlType.Color, title: "Alt Edge", defaultValue: LOOK_D.altEdge },
        },
    },
    ui: {
        type: ControlType.Object,
        title: "Interface",
        controls: {
            controls: { type: ControlType.Boolean, title: "Controls", defaultValue: true },
            views: { type: ControlType.Boolean, title: "View Switch", defaultValue: true },
            caption: { type: ControlType.Boolean, title: "Caption", defaultValue: true },
            minimap: { type: ControlType.Boolean, title: "Minimap", defaultValue: true },
            ticker: { type: ControlType.Boolean, title: "Ticker", defaultValue: true },
            lightbox: { type: ControlType.Boolean, title: "Lightbox", defaultValue: true },
            click: { type: ControlType.Enum, title: "Click", options: ["focus", "open", "none"], optionTitles: ["Focus, then open", "Open", "None"], defaultValue: "focus" },
            themeSwitch: { type: ControlType.Boolean, title: "Theme Switch", defaultValue: false, description: "Sun / moon button that swaps to the Alt colours." },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        description: "Created by [*Jeeth*](https://www.framer.com/%40jeeth/)",
    } as any,
})
