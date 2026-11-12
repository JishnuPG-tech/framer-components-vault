// @framerDisableUnlink
/**
 * Dive Field — BuiltByKern Marketplace
 * Virtual-scroll typographic depth field: Canvas2D sections become WebGL
 * textures stacked in Z. Damped wheel/drag advances the camera through fog,
 * RGB dissolve, and pointer sway.
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

import { useEffect, useRef, useState, type CSSProperties } from "react"

type FramerFont = CSSProperties & {
    fontFamily?: string
    fontWeight?: number | string
    fontSize?: string | number
    letterSpacing?: string | number
    lineHeight?: string | number
    fontStyle?: string
}

interface LayerItem {
    body: string
}

interface ContentCtrl {
    layers: LayerItem[]
    uppercase: boolean
    sideMargin: number
    bodyFont: FramerFont
}

interface CameraCtrl {
    fov: number
    layerGap: number
    fill: number
    scatter: number
    tilt: number
    sway: number
    warp: number
}

interface MotionCtrl {
    scrollSpeed: number
    damping: number
    autoScroll: number
    infinite: boolean
    respectReducedMotion: boolean
}

interface LookCtrl {
    fogNear: number
    fogFar: number
    dissolveStart: number
    depthTint: number
    rgbShift: number
    rgbShiftVel: number
    rgbWarmth: number
    wobble: number
    textColor: string
    /** Accent used for depth tint and fringe. */
    accent: string
}

/** Dive Field accent — chromatic green for depth tint and RGB fringe. */
const PRODUCT_ACCENT = "#6FFF8A"

interface DiveFieldProps {
    content: ContentCtrl
    camera: CameraCtrl
    motion: MotionCtrl
    look: LookCtrl
    style?: CSSProperties
}

type Section = { body: string[] }

type Layer = {
    tex: WebGLTexture
    w: number
    h: number
    hRatio: number
    offX: number
    offY: number
    rot: number
    seed: number
}

type TextUniforms = {
    uTex: WebGLUniformLocation | null
    uScale: WebGLUniformLocation | null
    uPlanePos: WebGLUniformLocation | null
    uRot: WebGLUniformLocation | null
    uAspect: WebGLUniformLocation | null
    uFov: WebGLUniformLocation | null
    uCam: WebGLUniformLocation | null
    uTime: WebGLUniformLocation | null
    uVel: WebGLUniformLocation | null
    uFog: WebGLUniformLocation | null
    uDiss: WebGLUniformLocation | null
    uAct: WebGLUniformLocation | null
    uFar: WebGLUniformLocation | null
    uSeed: WebGLUniformLocation | null
    uRgbShift: WebGLUniformLocation | null
    uRgbShiftVel: WebGLUniformLocation | null
    uWarmth: WebGLUniformLocation | null
    uWobble: WebGLUniformLocation | null
    uDepthTint: WebGLUniformLocation | null
    uTextColor: WebGLUniformLocation | null
    uHeadingColor: WebGLUniformLocation | null
}

type Engine = {
    gl: WebGLRenderingContext
    textProg: WebGLProgram
    uniforms: TextUniforms
    aPos: number
    quad: WebGLBuffer
    layers: Layer[]
    dispose: () => void
}

const TEX_W = 2048
const TEX_MAX_H = 4096
const DPR_CAP = 1.5

const DEFAULT_LAYERS: LayerItem[] = [
    {
        body: "Depth is the material. Stack the line and let weight arrive.",
    },
    {
        body: "Wheel. Drag. Arrow. The field answers feel — not another prompt.",
    },
    {
        body: "Chromatic edges are instruments. Tune until the composition breathes.",
    },
    {
        body: "Hold. Approach. Dissolve. Settle. Continue.",
    },
    {
        body: "Full-bleed. Your words. Your damping. BuiltByKern.",
    },
]

/** Fallback when the Font control has no family yet. */
const FALLBACK_FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif"

/** Framer Font may inject Placeholder families — Canvas2D cannot draw them. */
function canvasFontFamily(family: string | undefined): string {
    const raw = (family || "").trim()
    if (!raw) return FALLBACK_FONT_FAMILY
    if (/placeholder/i.test(raw)) return FALLBACK_FONT_FAMILY
    return raw
}

/** Default display type for Dive Field layers. */
const DEFAULT_BODY_FONT: FramerFont = {
    fontWeight: 900,
    fontSize: "104px",
    letterSpacing: "-0.075em",
    lineHeight: "0.86em",
}

const DEFAULT_CONTENT: ContentCtrl = {
    layers: DEFAULT_LAYERS,
    uppercase: false,
    sideMargin: 0.1,
    bodyFont: DEFAULT_BODY_FONT,
}

const DEFAULT_CAMERA: CameraCtrl = {
    fov: 78,
    layerGap: 13.5,
    fill: 0.84,
    scatter: 0.12,
    tilt: 0.04,
    sway: 0.2,
    warp: 5.5,
}

const DEFAULT_MOTION: MotionCtrl = {
    scrollSpeed: 1.05,
    damping: 0.48,
    autoScroll: 0.018,
    infinite: true,
    respectReducedMotion: true,
}

const DEFAULT_LOOK: LookCtrl = {
    fogNear: 1.05,
    fogFar: 2.35,
    dissolveStart: 1.05,
    depthTint: 0.42,
    rgbShift: 0.0035,
    rgbShiftVel: 0.016,
    rgbWarmth: 0.32,
    wobble: 0.004,
    textColor: "#FFFFFF",
    accent: PRODUCT_ACCENT,
}

const TEXT_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
uniform vec2 uScale;
uniform vec3 uPlanePos;
uniform float uRot;
uniform float uAspect;
uniform float uFov;
uniform vec3 uCam;

void main() {
  // aPos is NDC quad [-1,1]; map to local plane + UVs
  vUv = aPos * 0.5 + 0.5;
  float c = cos(uRot);
  float s = sin(uRot);
  vec2 local = aPos * 0.5 * uScale;
  vec2 spun = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
  vec3 world = vec3(spun.x + uPlanePos.x, spun.y + uPlanePos.y, uPlanePos.z);
  vec3 view = world - uCam;
  float f = 1.0 / tan(uFov * 0.01745329251 * 0.5);
  float z = max(-view.z, 0.05);
  vec2 clip = vec2(view.x * f / (z * uAspect), view.y * f / z);
  float depth = clamp((z - 0.05) / 80.0, 0.0, 1.0);
  gl_Position = vec4(clip, depth * 2.0 - 1.0, 1.0);
}
`

const TEXT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uTime;
uniform float uVel;
uniform float uFog;
uniform float uDiss;
uniform float uAct;
uniform float uFar;
uniform float uSeed;
uniform float uRgbShift;
uniform float uRgbShiftVel;
uniform float uWarmth;
uniform float uWobble;
uniform float uDepthTint;
uniform vec3 uTextColor;
uniform vec3 uHeadingColor;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  float wobX = sin(vUv.y * 15.0 + uTime * 1.4) * uWobble;
  float wobY = sin(vUv.x * 21.0 - uTime * 1.1) * uWobble * 0.7;
  vec2 uv = vec2(vUv.x + wobX, 1.0 - (vUv.y + wobY));
  float shift = uRgbShift + abs(uVel) * uRgbShiftVel + uDiss * 0.012 + uAct * 0.004;
  vec2 off = (uv - 0.5) * shift;
  vec4 sR = texture2D(uTex, uv + off);
  vec4 sG = texture2D(uTex, uv + off * uWarmth);
  vec4 sB = texture2D(uTex, uv - off);

  float n = noise(uv * vec2(9.0, 5.0) + uSeed) * 0.65
    + noise(uv * vec2(27.0, 15.0) + uSeed) * 0.35;
  float edge0 = uDiss * 1.15 - 0.1;
  float keep = smoothstep(edge0, edge0 + 0.09, n);
  float rim = smoothstep(edge0, edge0 + 0.16, n)
    * (1.0 - smoothstep(edge0 + 0.16, edge0 + 0.34, n));

  vec3 rgb = vec3(
    uTextColor.r * sR.r + uHeadingColor.r * sR.g,
    uTextColor.g * sG.r + uHeadingColor.g * sG.g,
    uTextColor.b * sB.r + uHeadingColor.b * sB.g
  );
  float alpha = max(sG.r, sG.g);
  rgb = mix(rgb, uHeadingColor * 0.55 * alpha, uFar * uDepthTint);
  rgb *= keep * uFog;
  vec3 rimCol = mix(uHeadingColor, vec3(1.0, 0.95, 0.9), 0.35);
  rgb += rimCol * rim * alpha * uAct * uFog;
  float a = alpha * keep * uFog;
  if (a < 0.01) discard;
  gl_FragColor = vec4(rgb, a);
}
`

function clamp(n: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, n))
}

function hash(n: number) {
    const t = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return t - Math.floor(t)
}

function parseHex(color: string): [number, number, number] {
    const c = color.trim()
    const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length === 3)
            h = h
                .split("")
                .map((ch) => ch + ch)
                .join("")
        return [
            parseInt(h.slice(0, 2), 16) / 255,
            parseInt(h.slice(2, 4), 16) / 255,
            parseInt(h.slice(4, 6), 16) / 255,
        ]
    }
    const rgb = c.match(
        /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i
    )
    if (rgb) {
        return [
            clamp(parseFloat(rgb[1]) / 255, 0, 1),
            clamp(parseFloat(rgb[2]) / 255, 0, 1),
            clamp(parseFloat(rgb[3]) / 255, 0, 1),
        ]
    }
    return [1, 1, 1]
}

function cacheTextUniforms(
    gl: WebGLRenderingContext,
    prog: WebGLProgram
): TextUniforms {
    const u = (name: string) => gl.getUniformLocation(prog, name)
    return {
        uTex: u("uTex"),
        uScale: u("uScale"),
        uPlanePos: u("uPlanePos"),
        uRot: u("uRot"),
        uAspect: u("uAspect"),
        uFov: u("uFov"),
        uCam: u("uCam"),
        uTime: u("uTime"),
        uVel: u("uVel"),
        uFog: u("uFog"),
        uDiss: u("uDiss"),
        uAct: u("uAct"),
        uFar: u("uFar"),
        uSeed: u("uSeed"),
        uRgbShift: u("uRgbShift"),
        uRgbShiftVel: u("uRgbShiftVel"),
        uWarmth: u("uWarmth"),
        uWobble: u("uWobble"),
        uDepthTint: u("uDepthTint"),
        uTextColor: u("uTextColor"),
        uHeadingColor: u("uHeadingColor"),
    }
}

function resolveLayers(layers: LayerItem[] | undefined): Section[] {
    const source =
        Array.isArray(layers) && layers.length > 0 ? layers : DEFAULT_LAYERS
    const out: Section[] = []
    for (const item of source) {
        const body = (item?.body ?? "").trim()
        if (!body) continue
        out.push({ body: [body] })
    }
    return out.length ? out : [{ body: ["Add a layer to begin."] }]
}

function parseCssSize(
    value: string | number | undefined,
    fallback: number
): number {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
        const n = parseFloat(value)
        if (Number.isFinite(n)) return n
    }
    return fallback
}

function parseLineHeightRatio(
    value: string | number | undefined,
    fontSize: number,
    fallback: number
): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value > 4 ? value / fontSize : value
    }
    if (typeof value === "string") {
        const trimmed = value.trim()
        if (trimmed.endsWith("%")) {
            const n = parseFloat(trimmed)
            return Number.isFinite(n) ? n / 100 : fallback
        }
        if (trimmed.endsWith("em")) {
            const n = parseFloat(trimmed)
            return Number.isFinite(n) ? n : fallback
        }
        const n = parseFloat(trimmed)
        if (Number.isFinite(n)) return n > 4 ? n / fontSize : n
    }
    return fallback
}

function parseTrackingEm(
    value: string | number | undefined,
    fontSize: number,
    fallback: number
): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.abs(value) > 1 ? value / fontSize : value
    }
    if (typeof value === "string") {
        const trimmed = value.trim()
        if (trimmed.endsWith("em")) {
            const n = parseFloat(trimmed)
            return Number.isFinite(n) ? n : fallback
        }
        const n = parseFloat(trimmed)
        if (Number.isFinite(n)) return Math.abs(n) > 1 ? n / fontSize : n
    }
    return fallback
}

function resolveWeight(font: FramerFont, fallback: number): number {
    const w = font.fontWeight
    if (typeof w === "number" && Number.isFinite(w)) return w
    if (typeof w === "string") {
        const n = parseInt(w, 10)
        if (Number.isFinite(n)) return n
    }
    return fallback
}

function rasterizeSection(
    section: Section,
    content: ContentCtrl,
    colors: { body: string; plate?: string } = {
        body: "#ff0000",
        plate: "#000000",
    }
): HTMLCanvasElement {
    const bodyFont = { ...DEFAULT_BODY_FONT, ...content.bodyFont }
    const scale = TEX_W / 1000
    const bodySize = parseCssSize(bodyFont.fontSize, 104) * scale
    const lineRatio = parseLineHeightRatio(
        bodyFont.lineHeight,
        bodySize / scale,
        0.86
    )
    const lineH = bodySize * lineRatio
    const bodyTrack = parseTrackingEm(
        bodyFont.letterSpacing,
        bodySize / scale,
        -0.075
    )
    const bodyFamily = canvasFontFamily(bodyFont.fontFamily)
    const bodyWeight = resolveWeight(bodyFont, 900)
    const bodyStyle = bodyFont.fontStyle === "italic" ? "italic " : ""
    const maxW = TEX_W - TEX_W * content.sideMargin * 2

    const canvas = document.createElement("canvas")
    canvas.width = TEX_W
    canvas.height = 256
    const ctx = canvas.getContext("2d")
    if (!ctx) return canvas

    const setBody = () => {
        ctx.font = `${bodyStyle}${bodyWeight} ${bodySize}px ${bodyFamily}`
        ;(
            ctx as CanvasRenderingContext2D & { letterSpacing?: string }
        ).letterSpacing = `${bodyTrack * bodySize}px`
    }

    setBody()
    const spaceW = ctx.measureText(" ").width
    type Line = { words: string[]; widths: number[]; sum: number }
    const lines: Line[] = []
    const paraEnds: boolean[] = []

    for (const para of section.body) {
        const words = (content.uppercase ? para.toUpperCase() : para).split(
            /\s+/
        )
        const start = lines.length
        let cur: Line = { words: [], widths: [], sum: 0 }
        const flush = () => {
            if (!cur.words.length) return
            lines.push(cur)
            paraEnds.push(false)
            cur = { words: [], widths: [], sum: 0 }
        }
        for (const word of words) {
            const w = ctx.measureText(word).width
            if (
                cur.words.length > 0 &&
                cur.sum + w + spaceW * cur.words.length > maxW
            ) {
                flush()
            }
            cur.words.push(word)
            cur.widths.push(w)
            cur.sum += w
        }
        flush()
        if (lines.length > start) paraEnds[lines.length - 1] = true
        const last = lines.length - 1
        if (last > start) {
            const a = lines[last]
            const b = lines[last - 1]
            const lastW = b.widths[b.widths.length - 1]
            if (
                a.words.length === 1 &&
                b.words.length >= 3 &&
                lastW + spaceW + a.sum <= maxW
            ) {
                const moved = b.words.pop()!
                b.widths.pop()
                b.sum -= lastW
                a.words.unshift(moved)
                a.widths.unshift(lastW)
                a.sum += lastW
            }
        }
    }

    const paraGap = lineH * 0.55
    let height = bodySize * 0.8 * 2
    for (let i = 0; i < lines.length; i++) {
        height += lineH
        if (paraEnds[i] && i < lines.length - 1) height += paraGap
    }
    canvas.height = Math.min(TEX_MAX_H, Math.max(128, Math.ceil(height)))
    if (colors.plate) {
        ctx.fillStyle = colors.plate
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    ctx.textBaseline = "alphabetic"

    setBody()
    ctx.fillStyle = colors.body
    let y = bodySize * 0.8 * 2
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const width = line.sum + spaceW * (line.words.length - 1)
        ctx.fillText(line.words.join(" "), (TEX_W - width) / 2, y)
        y += lineH
        if (paraEnds[i]) y += paraGap
    }
    return canvas
}

/** Canvas/Export only — Look colors, never R/G shader encoding. */
function rasterizeSectionDisplay(
    section: Section,
    content: ContentCtrl,
    textColor: string
): HTMLCanvasElement {
    return rasterizeSection(section, content, {
        body: textColor,
        plate: undefined,
    })
}

function compile(
    gl: WebGLRenderingContext,
    type: number,
    src: string
): WebGLShader | null {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh)
        return null
    }
    return sh
}

function linkProgram(
    gl: WebGLRenderingContext,
    vsSrc: string,
    fsSrc: string
): WebGLProgram | null {
    const vs = compile(gl, gl.VERTEX_SHADER, vsSrc)
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc)
    if (!vs || !fs) return null
    const prog = gl.createProgram()
    if (!prog) return null
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.deleteProgram(prog)
        return null
    }
    return prog
}

function createTextureFromCanvas(
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement
): WebGLTexture | null {
    const tex = gl.createTexture()
    if (!tex) return null
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
    return tex
}

function setVec3(
    gl: WebGLRenderingContext,
    loc: WebGLUniformLocation | null,
    rgb: [number, number, number]
) {
    if (loc) gl.uniform3f(loc, rgb[0], rgb[1], rgb[2])
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function DiveField(props: DiveFieldProps) {
    const content = {
        ...DEFAULT_CONTENT,
        ...props.content,
        layers:
            Array.isArray(props.content?.layers) &&
            props.content.layers.length > 0
                ? props.content.layers
                : DEFAULT_LAYERS,
        bodyFont: { ...DEFAULT_BODY_FONT, ...props.content?.bodyFont },
    }
    const camera = { ...DEFAULT_CAMERA, ...props.camera }
    const motion = { ...DEFAULT_MOTION, ...props.motion }
    const look = { ...DEFAULT_LOOK, ...props.look }
    const style = props.style

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const contentRef = useRef(content)
    const cameraRef = useRef(camera)
    const motionRef = useRef(motion)
    const lookRef = useRef(look)
    contentRef.current = content
    cameraRef.current = camera
    motionRef.current = motion
    lookRef.current = look

    const [glFailed, setGlFailed] = useState(false)
    const [reduced, setReduced] = useState(false)

    const engineApiRef = useRef<{
        markLayersDirty: () => void
        kick: () => void
    } | null>(null)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])

    // Rebuild textures only when content changes — not every rAF
    useEffect(() => {
        engineApiRef.current?.markLayersDirty()
        engineApiRef.current?.kick()
    }, [
        content.layers,
        content.uppercase,
        content.sideMargin,
        content.bodyFont,
    ])

    // Look / camera / motion prop edits need a frame while idle
    useEffect(() => {
        engineApiRef.current?.kick()
    }, [look, camera, motion, reduced])

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas || typeof window === "undefined") return
        if (isStatic) return

        let dead = false
        let engine: Engine | null = null
        let raf = 0
        let rebuilding = false
        let layersDirty = true
        let target = 0
        let current = 0
        let vel = 0
        let last = performance.now()
        let pointerX = 0
        let pointerY = 0
        let camX = 0
        let camY = 0
        let dragging = false
        let dragY = 0
        let inView = true
        let texKey = ""
        let textColorKey = ""
        let textRgbCached: [number, number, number] = [1, 1, 1]
        let accentKey = ""
        let accentRgbCached: [number, number, number] = [1, 1, 1]

        const size = { w: 1, h: 1 }
        const IDLE_POS = 0.0008
        const IDLE_VEL = 0.03
        const IDLE_CAM = 0.002

        const rebuildLayers = async (eng: Engine) => {
            const c = contentRef.current
            const key = JSON.stringify([
                c.layers,
                c.uppercase,
                c.sideMargin,
                c.bodyFont,
            ])
            if (key === texKey) return
            texKey = key
            try {
                const family = canvasFontFamily(c.bodyFont.fontFamily)
                const weight = resolveWeight(c.bodyFont, 900)
                await document.fonts.load(`${weight} 20px ${family}`)
                await document.fonts.ready
            } catch {
                /* fonts optional */
            }
            if (dead) return
            for (const layer of eng.layers) eng.gl.deleteTexture(layer.tex)
            eng.layers = []
            const sections = resolveLayers(c.layers)
            for (let i = 0; i < sections.length; i++) {
                const bmp = rasterizeSection(sections[i], c)
                const tex = createTextureFromCanvas(eng.gl, bmp)
                if (!tex) continue
                eng.layers.push({
                    tex,
                    w: bmp.width,
                    h: bmp.height,
                    hRatio: bmp.height / bmp.width,
                    offX: 0,
                    offY: 0,
                    rot: 0,
                    seed: hash(i * 3.1 + 0.7) * 37,
                })
            }
            if (!motionRef.current.infinite) {
                target = clamp(target, 0, Math.max(0, eng.layers.length - 1))
            }
        }

        const needsFrame = () => {
            if (!inView) return false
            if (layersDirty || rebuilding) return true
            if (dragging) return true
            const mot = motionRef.current
            const reduce = reduced && mot.respectReducedMotion
            const auto = reduce ? 0 : mot.autoScroll
            if (auto > 1e-6) return true
            if (Math.abs(target - current) > IDLE_POS) return true
            if (Math.abs(vel) > IDLE_VEL) return true
            if (Math.abs(pointerX - camX) > IDLE_CAM) return true
            if (Math.abs(pointerY - camY) > IDLE_CAM) return true
            return false
        }

        const kick = () => {
            if (dead || raf !== 0) return
            last = performance.now()
            raf = requestAnimationFrame(loop)
        }

        const resize = () => {
            size.w = root.clientWidth || 1
            size.h = root.clientHeight || 1
            const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
            canvas.width = Math.max(1, Math.floor(size.w * dpr))
            canvas.height = Math.max(1, Math.floor(size.h * dpr))
            canvas.style.width = "100%"
            canvas.style.height = "100%"
            if (engine) {
                engine.gl.viewport(0, 0, canvas.width, canvas.height)
            }
            kick()
        }

        /** Loop Off at first/last plane: let page scroll continue in that direction. */
        const shouldHandoffPage = (delta: number): boolean => {
            if (motionRef.current.infinite || !engine) return false
            const max = Math.max(0, engine.layers.length - 1)
            if (delta > 0 && target >= max - 1e-4) return true
            if (delta < 0 && target <= 1e-4) return true
            return false
        }

        const onWheel = (e: WheelEvent) => {
            if (shouldHandoffPage(e.deltaY)) return
            e.preventDefault()
            const speed = motionRef.current.scrollSpeed
            target += (e.deltaY / size.h) * speed * 1.4
            if (!motionRef.current.infinite && engine) {
                target = clamp(target, 0, Math.max(0, engine.layers.length - 1))
            }
            kick()
        }

        const onPointerDown = (e: PointerEvent) => {
            dragging = true
            dragY = e.clientY
            root.setPointerCapture(e.pointerId)
            root.style.cursor = "grabbing"
            kick()
        }
        const onPointerMove = (e: PointerEvent) => {
            pointerX = (e.clientX / size.w - 0.5) * 2
            pointerY = (e.clientY / size.h - 0.5) * 2
            if (dragging) {
                const dy = e.clientY - dragY
                dragY = e.clientY
                target -= (dy / size.h) * motionRef.current.scrollSpeed * 2
                if (!motionRef.current.infinite && engine) {
                    target = clamp(
                        target,
                        0,
                        Math.max(0, engine.layers.length - 1)
                    )
                }
            }
            kick()
        }
        const onPointerUp = () => {
            dragging = false
            root.style.cursor = "grab"
            kick()
        }

        const onKey = (e: KeyboardEvent) => {
            const active = document.activeElement
            if (!active || !root.contains(active)) return
            const t = e.target as HTMLElement | null
            if (
                t &&
                (t.tagName === "INPUT" ||
                    t.tagName === "TEXTAREA" ||
                    t.isContentEditable)
            ) {
                return
            }
            let delta = 0
            if (e.code === "ArrowDown" || e.code === "PageDown") {
                delta = 0.5
            } else if (e.code === "ArrowUp" || e.code === "PageUp") {
                delta = -0.5
            } else if (e.code === "Space" && !e.repeat) {
                delta = e.shiftKey ? -1 : 1
            } else {
                return
            }
            if (shouldHandoffPage(delta)) return
            e.preventDefault()
            if (e.code === "Space") {
                target = Math.round(current) + delta
            } else {
                target += delta
            }
            if (!motionRef.current.infinite && engine) {
                target = clamp(target, 0, Math.max(0, engine.layers.length - 1))
            }
            kick()
        }

        const draw = (eng: Engine, dt: number) => {
            const gl = eng.gl
            const cam = cameraRef.current
            const mot = motionRef.current
            const lk = lookRef.current
            const reduce = reduced && mot.respectReducedMotion

            if (!reduce && !dragging && inView) {
                target += mot.autoScroll * dt
                if (!mot.infinite) {
                    target = clamp(
                        target,
                        0,
                        Math.max(0, eng.layers.length - 1)
                    )
                }
            }

            const damp = 1 - Math.pow(1 - Math.min(0.99, mot.damping), dt * 60)
            const prev = current
            current += (target - current) * damp
            const instantVel = (current - prev) / Math.max(dt, 1e-4)
            vel += (instantVel - vel) * Math.min(1, dt * 8)
            const speed = Math.min(Math.abs(vel), 3)

            camX += (pointerX - camX) * Math.min(1, dt * 3)
            camY += (pointerY - camY) * Math.min(1, dt * 3)

            const aspect = size.w / size.h
            const fov = cam.fov + (reduce ? 0 : speed * cam.warp)
            const time = performance.now() / 1000

            gl.disable(gl.DEPTH_TEST)
            gl.disable(gl.CULL_FACE)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE)
            gl.useProgram(eng.textProg)
            const U = eng.uniforms
            gl.bindBuffer(gl.ARRAY_BUFFER, eng.quad)
            gl.enableVertexAttribArray(eng.aPos)
            gl.vertexAttribPointer(eng.aPos, 2, gl.FLOAT, false, 0, 0)

            const tc = lk.textColor
            if (tc !== textColorKey) {
                textColorKey = tc
                textRgbCached = parseHex(tc)
            }
            const ac = lk.accent || PRODUCT_ACCENT
            if (ac !== accentKey) {
                accentKey = ac
                accentRgbCached = parseHex(ac)
            }

            const count = eng.layers.length
            const nearClip = -0.75
            const sway = reduce ? 0 : cam.sway
            const camPos: [number, number, number] = [
                camX * sway,
                -camY * sway * 0.6,
                0,
            ]

            for (let t = 0; t < count; t++) {
                const layer = eng.layers[t]
                let rel = t - current
                if (mot.infinite && count > 0) {
                    const wraps = Math.ceil((nearClip - rel) / count)
                    rel = rel + count * wraps
                }
                const visible = rel > nearClip - 0.05 && rel < lk.fogFar + 0.3
                if (!visible) continue

                const absIndex = mot.infinite
                    ? t + count * Math.ceil((nearClip - (t - current)) / count)
                    : t
                layer.offX = (hash(absIndex * 13.7 + 1.3) - 0.5) * 2
                layer.offY = (hash(absIndex * 27.9 + 5.1) - 0.5) * 2
                layer.rot = (hash(absIndex * 7.3 + 9.7) - 0.5) * 2
                layer.seed = hash(absIndex * 3.1 + 0.7) * 37

                const planeZ = -rel * cam.layerGap
                const fillW =
                    2 *
                    cam.layerGap *
                    Math.tan((cam.fov * Math.PI) / 360) *
                    aspect *
                    cam.fill
                const maxH =
                    2 *
                    cam.layerGap *
                    Math.tan((cam.fov * Math.PI) / 360) *
                    0.86
                let w = fillW
                if (w * layer.hRatio > maxH) w = maxH / layer.hRatio
                const h = w * layer.hRatio

                const fog =
                    1 -
                    clamp(
                        (rel - lk.fogNear) /
                            Math.max(lk.fogFar - lk.fogNear, 0.01),
                        0,
                        1
                    )
                const fog3 = fog * fog * fog
                const diss =
                    1 -
                    clamp(
                        (rel - nearClip) /
                            Math.max(lk.dissolveStart - nearClip, 0.01),
                        0,
                        1
                    )
                const act =
                    diss *
                    (1 - diss) *
                    4 *
                    (0.75 + 0.25 * Math.sin(time * 13 + t * 5))
                const far = clamp(
                    (rel - 1) / Math.max(lk.fogFar - 1, 0.01),
                    0,
                    1
                )

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, layer.tex)
                gl.uniform1i(U.uTex, 0)
                gl.uniform2f(U.uScale, w, h)
                gl.uniform3f(
                    U.uPlanePos,
                    layer.offX * cam.scatter * fillW * 0.35,
                    layer.offY * cam.scatter * fillW * 0.16,
                    planeZ
                )
                gl.uniform1f(
                    U.uRot,
                    layer.rot * cam.tilt * (Math.PI / 180) +
                        Math.sin(time * 0.3 + t * 2.1) * 0.015
                )
                gl.uniform1f(U.uAspect, aspect)
                gl.uniform1f(U.uFov, fov)
                gl.uniform3f(U.uCam, camPos[0], camPos[1], camPos[2])
                gl.uniform1f(U.uTime, time)
                gl.uniform1f(U.uVel, vel)
                gl.uniform1f(U.uFog, fog3)
                gl.uniform1f(U.uDiss, diss)
                gl.uniform1f(U.uAct, act)
                gl.uniform1f(U.uFar, far)
                gl.uniform1f(U.uSeed, layer.seed)
                gl.uniform1f(U.uRgbShift, lk.rgbShift)
                gl.uniform1f(U.uRgbShiftVel, lk.rgbShiftVel)
                gl.uniform1f(U.uWarmth, lk.rgbWarmth)
                gl.uniform1f(U.uWobble, lk.wobble)
                gl.uniform1f(U.uDepthTint, lk.depthTint)
                setVec3(gl, U.uTextColor, textRgbCached)
                setVec3(gl, U.uHeadingColor, accentRgbCached)
                gl.drawArrays(gl.TRIANGLES, 0, 6)
            }
            gl.disable(gl.BLEND)
        }

        const loop = (now: number) => {
            if (dead || !engine) {
                raf = 0
                return
            }
            raf = 0
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now

            if (layersDirty && !rebuilding) {
                layersDirty = false
                rebuilding = true
                void rebuildLayers(engine)
                    .catch(() => {})
                    .finally(() => {
                        rebuilding = false
                        if (!dead) kick()
                    })
            }

            // Always paint when the loop runs — gating on inView skipped the
            // first frame when IO fired non-intersecting during async rebuild.
            draw(engine, dt)

            if (needsFrame()) {
                raf = requestAnimationFrame(loop)
            }
        }

        const boot = async () => {
            const gl = canvas.getContext("webgl", {
                alpha: true,
                antialias: false,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
            })
            if (!gl) {
                setGlFailed(true)
                return
            }
            const textProg = linkProgram(gl, TEXT_VERT, TEXT_FRAG)
            if (!textProg) {
                setGlFailed(true)
                return
            }
            const quad = gl.createBuffer()
            if (!quad) {
                setGlFailed(true)
                return
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, quad)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW
            )

            const uniforms = cacheTextUniforms(gl, textProg)
            const aPos = gl.getAttribLocation(textProg, "aPos")

            engine = {
                gl,
                textProg,
                uniforms,
                aPos,
                quad,
                layers: [],
                dispose: () => {
                    for (const layer of engine?.layers ?? []) {
                        gl.deleteTexture(layer.tex)
                    }
                    gl.deleteBuffer(quad)
                    gl.deleteProgram(textProg)
                },
            }

            resize()
            layersDirty = true
            kick()
        }

        engineApiRef.current = {
            markLayersDirty: () => {
                layersDirty = true
            },
            kick,
        }

        void boot()

        root.style.cursor = "grab"
        root.addEventListener("wheel", onWheel, { passive: false })
        root.addEventListener("pointerdown", onPointerDown)
        root.addEventListener("pointermove", onPointerMove)
        root.addEventListener("pointerup", onPointerUp)
        root.addEventListener("pointercancel", onPointerUp)
        window.addEventListener("keydown", onKey)
        const ro = new ResizeObserver(() => resize())
        ro.observe(root)
        const io = new IntersectionObserver(([entry]) => {
            inView = entry?.isIntersecting ?? true
            if (inView) kick()
            else if (raf !== 0) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        })
        io.observe(root)

        return () => {
            dead = true
            engineApiRef.current = null
            cancelAnimationFrame(raf)
            raf = 0
            root.removeEventListener("wheel", onWheel)
            root.removeEventListener("pointerdown", onPointerDown)
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerup", onPointerUp)
            root.removeEventListener("pointercancel", onPointerUp)
            window.removeEventListener("keydown", onKey)
            ro.disconnect()
            io.disconnect()
            engine?.dispose()
            engine = null
        }
    }, [isStatic, reduced])

    // Static / canvas export: transparent depth stack (never R/G encoding)
    useEffect(() => {
        if (!isStatic) return
        const canvas = canvasRef.current
        if (!canvas || typeof document === "undefined") return
        const sections = resolveLayers(content.layers)
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const w = rootRef.current?.clientWidth || 1200
        const h = rootRef.current?.clientHeight || 800
        canvas.width = w
        canvas.height = h
        ctx.clearRect(0, 0, w, h)

        const accent = look.accent || PRODUCT_ACCENT
        const stack = sections.slice(0, Math.min(3, sections.length))
        // Back → front: accent ghosts, then hero text
        for (let i = stack.length - 1; i >= 0; i--) {
            const isFront = i === 0
            const bmp = rasterizeSectionDisplay(
                stack[i] ?? { body: [""] },
                content,
                isFront ? look.textColor : accent
            )
            const scaleMul = 0.9 - i * 0.13
            const scale = Math.min(w / bmp.width, h / bmp.height) * scaleMul
            const dw = bmp.width * scale
            const dh = bmp.height * scale
            const yOff = i * h * 0.035
            ctx.save()
            ctx.globalAlpha = isFront ? 1 : 0.28 + (stack.length - 1 - i) * 0.06
            ctx.drawImage(bmp, (w - dw) / 2, (h - dh) / 2 + yOff, dw, dh)
            ctx.restore()
        }
    }, [isStatic, content, look.textColor, look.accent])

    const focusRingColor = look.accent || PRODUCT_ACCENT

    return (
        <div
            ref={rootRef}
            data-kern-dive-field
            role="region"
            aria-label="Dive Field"
            tabIndex={isStatic ? undefined : 0}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: "transparent",
                userSelect: "none",
                outline: "none",
            }}
        >
            {!isStatic && (
                <style>{`
                    [data-kern-dive-field]:focus-visible {
                        outline: 2px solid ${focusRingColor};
                        outline-offset: 4px;
                    }
                `}</style>
            )}
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    touchAction: "none",
                    backgroundColor: "transparent",
                }}
            />
            {glFailed && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        color: look.textColor,
                        fontFamily: canvasFontFamily(
                            content.bodyFont.fontFamily
                        ),
                        fontSize: 14,
                        opacity: 0.7,
                        padding: 24,
                        textAlign: "center",
                    }}
                >
                    WebGL unavailable — Dive Field needs a GPU canvas.
                </div>
            )}
        </div>
    )
}

addPropertyControls(DiveField, {
    content: {
        type: ControlType.Object,
        title: "Content",
        description: "Type on each depth plane.",
        controls: {
            layers: {
                type: ControlType.Array,
                title: "Layers",
                maxCount: 12,
                defaultValue: DEFAULT_LAYERS,
                description: "Order is front → back as you dive. Max 12.",
                control: {
                    type: ControlType.Object,
                    controls: {
                        body: {
                            type: ControlType.String,
                            title: "Copy",
                            displayTextArea: true,
                            defaultValue: "Add copy for this depth plane.",
                            description: "Text drawn on this plane.",
                        },
                    },
                },
            },
            bodyFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayTextAlignment: false,
                description: "One typeface for every layer. Always centered.",
                defaultValue: {
                    fontSize: "104px",
                    variant: "Black",
                    letterSpacing: "-0.075em",
                    lineHeight: "0.86em",
                },
            },
            uppercase: {
                type: ControlType.Boolean,
                title: "Uppercase",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Force every layer to caps.",
            },
            sideMargin: {
                type: ControlType.Number,
                title: "Inset",
                min: 0.02,
                max: 0.25,
                step: 0.01,
                defaultValue: 0.1,
                description: "Horizontal padding inside each plane.",
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        description: "Color and depth atmosphere. Background stays transparent.",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Type Color",
                defaultValue: "#FFFFFF",
                description: "Color of type on the near plane.",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: PRODUCT_ACCENT,
                description: "Far-plane tint and chromatic fringe.",
            },
            fogNear: {
                type: ControlType.Number,
                title: "Fog Near",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: 1.05,
                description: "Where depth haze starts to build.",
            },
            fogFar: {
                type: ControlType.Number,
                title: "Fog Far",
                min: 1,
                max: 5,
                step: 0.05,
                defaultValue: 2.35,
                description: "Where layers fully fade into fog.",
            },
            dissolveStart: {
                type: ControlType.Number,
                title: "Dissolve",
                min: 0.4,
                max: 2.5,
                step: 0.05,
                defaultValue: 1.05,
                description: "Where type starts to break apart in depth.",
            },
            depthTint: {
                type: ControlType.Number,
                title: "Depth Tint",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.42,
                description: "Accent wash on far planes. 0 = off.",
            },
            rgbShift: {
                type: ControlType.Number,
                title: "RGB Shift",
                min: 0,
                max: 0.02,
                step: 0.0005,
                defaultValue: 0.0035,
                description: "Chromatic fringe at rest.",
            },
            rgbShiftVel: {
                type: ControlType.Number,
                title: "RGB Speed",
                min: 0,
                max: 0.05,
                step: 0.001,
                defaultValue: 0.016,
                description: "Extra fringe while diving fast.",
            },
            rgbWarmth: {
                type: ControlType.Number,
                title: "RGB Warmth",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.32,
                description: "Cool ↔ warm balance of the fringe.",
            },
            wobble: {
                type: ControlType.Number,
                title: "Wobble",
                min: 0,
                max: 0.02,
                step: 0.0005,
                defaultValue: 0.004,
                description: "Subtle surface shimmer. 0 = off.",
            },
        },
    },
    camera: {
        type: ControlType.Object,
        title: "Camera",
        description: "Space between planes and how the lens sits.",
        controls: {
            fov: {
                type: ControlType.Number,
                title: "FOV",
                min: 40,
                max: 120,
                step: 1,
                defaultValue: 78,
                unit: "°",
                description: "Field of view. Wider = more space around type.",
            },
            layerGap: {
                type: ControlType.Number,
                title: "Gap",
                min: 6,
                max: 30,
                step: 0.5,
                defaultValue: 13.5,
                description: "Distance between planes. Higher = clearer stack.",
            },
            fill: {
                type: ControlType.Number,
                title: "Fill",
                min: 0.4,
                max: 1.1,
                step: 0.01,
                defaultValue: 0.84,
                description: "How large each plane sits in the frame.",
            },
            scatter: {
                type: ControlType.Number,
                title: "Scatter",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.12,
                description: "Random XY offset per plane. 0 = aligned.",
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: 0,
                max: 18,
                step: 0.01,
                defaultValue: 0.04,
                unit: "°",
                description: "Rotation range per plane.",
            },
            sway: {
                type: ControlType.Number,
                title: "Sway",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 0.2,
                description: "Pointer parallax. 0 = off.",
            },
            warp: {
                type: ControlType.Number,
                title: "Warp",
                min: 0,
                max: 16,
                step: 0.5,
                defaultValue: 5.5,
                description: "FOV stretch while diving. 0 = flat.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description:
            "How the dive responds to input.\n\nBuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
        controls: {
            scrollSpeed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: 1.05,
                description: "Wheel, drag, and key sensitivity.",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                min: 0.05,
                max: 0.95,
                step: 0.01,
                defaultValue: 0.48,
                description: "Higher = snappier settle. Lower = floatier.",
            },
            autoScroll: {
                type: ControlType.Number,
                title: "Auto",
                min: 0,
                max: 0.2,
                step: 0.005,
                defaultValue: 0.018,
                description: "Idle dive speed. 0 = only move on input.",
            },
            infinite: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Repeat forever, or stop at first/last plane — then page scroll can continue.",
            },
            respectReducedMotion: {
                type: ControlType.Boolean,
                title: "Reduce Motion",
                defaultValue: true,
                enabledTitle: "Respect",
                disabledTitle: "Ignore",
                description:
                    "Ease decorative motion when the OS asks for less.",
            },
        },
    },
})

