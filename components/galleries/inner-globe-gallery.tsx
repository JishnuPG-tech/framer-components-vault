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


/* ────────────────────────────────────────────────────────────────────────
   InnerGlobeGallery

   The viewer stands at the centre of a slowly turning globe whose inside
   is tiled with cards. Every card is bent onto the sphere, so cards near
   the edges of the frame curve around the viewer. The globe spins left,
   right, up or down on its own, can be dragged and thrown along that
   same direction, and reacts to the cursor with a choice of hover
   presets. Cards hold an image or a video, a title, a background with
   padding, and an optional link.

   Rendering is WebGL: each card is a curved grid mesh, and its texture
   is the whole card (background, media, title) painted into a 2D canvas.
   Static images are painted once; video cards are repainted when the
   video shows a new frame. Hit testing is exact and cheap: the camera
   sits at the sphere's centre, so the ray under the cursor meets the
   sphere at its own direction, which converts straight into the card
   grid's angles.
   ──────────────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────────
   GUIDE FOR EDITING THIS FILE (people and AI coding agents)

   A Framer code component: one file, one default export, imports only
   from "react", "react-dom", "framer" and "framer-motion".

   ## Map
   1. Types and DEFAULT_* objects (one per control group)
   2. framerAsset() — media allowlist
   3. Font and size helpers, paintCard() — draws one card into a canvas
   4. buildLayout() — rows of cards on the sphere (shared by WebGL, hit
      testing and the static fallback)
   5. Shaders
   6. InnerGlobeGallery component
        a. props merged with defaults, settings ref
        b. WebGL engine effect: context, textures, loop, input
        c. static fallback: flat CSS 3D cards (Framer canvas / no WebGL)
   7. addPropertyControls

   ## Geometry
   Cards live on a sphere of radius R (Globe Size, px), and the camera sits
   View Distance px from the front surface (cam = D − R on the z axis), so
   every row is seen from its own angle, as from inside a real globe. A
   at the centre of the view is drawn W px wide. A card is a rectangle in
   two angles: a runs along the spin direction (longitude) and b
   across it (latitude). For left/right spin, a → screen x; for up/down
   spin the x and y axes are swapped, so a → screen y. Spin only adds to
   a, so spinning never needs a matrix.

   ## Rules
   - Keep control keys stable; renaming one resets it on placed instances.
   - useIsStaticRenderer() is true on the Framer canvas and in export:
     draw the static CSS fallback, no WebGL, no loop, no listeners.
   - Media must come from Framer-managed assets: every image and video URL
     goes through framerAsset(); never add free-form URL fields.
   - Respect prefers-reduced-motion: no auto spin (dragging still works).
   - No template literals in this file (keeps it easy to paste into tools
     that wrap code in backticks).

   ## Common changes
   - New hover preset: add an option to hover.effect and a branch in
     hoverUniforms().
   - New card field: add it to ItemProp, the items control, cardKey() and
     paintCard(), and to StaticCard for the canvas preview.
   ──────────────────────────────────────────────────────────────────────── */

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}
interface ItemProp {
    image?: ImageValue
    video?: string
    title?: string
    link?: string
    newTab?: boolean
}
type Direction = "left" | "right" | "up" | "down"
type HoverEffect = "scale" | "dimOthers" | "fadeOthers" | "dim" | "fade" | "none"
interface Props {
    style?: React.CSSProperties
    items: ItemProp[]
    card: { width: number; height: number; padding: number; background: string; radius: number; mediaRadius: number; fit: "cover" | "contain"; mediaFill: string }
    caption: { position: "below" | "above" | "overlay" | "none"; font: any; color: string; gap: number; align: "left" | "center" | "right" }
    globe: { autoRows: boolean; rows: number; gapX: number; gapY: number; fov: number; radius: number; distance: number; tilt: number; stagger: boolean }
    spin: { direction: Direction; speed: number; hoverSpeed: number; drag: boolean; dragPower: number; inertia: number; smoothing: number; scroll: "off" | "spin"; scrollPower: number }
    hover: { effect: HoverEffect; amount: number; scale: number; duration: number }
    look: { background: string; edgeFade: number; fadeColor: string }
    onCardClick?: () => void
}

const DEFAULT_CARD = { width: 240, height: 300, padding: 0, background: "rgba(0, 0, 0, 0)", radius: 12, mediaRadius: 12, fit: "cover" as const, mediaFill: "#1C1C1C" }
const DEFAULT_CAPTION = {
    position: "below" as const,
    font: { fontSize: "14px", fontWeight: 500, lineHeight: "1.3em", letterSpacing: "-0.01em" },
    color: "rgba(255, 255, 255, 0.6)",
    gap: 12,
    align: "left" as const,
}
const DEFAULT_GLOBE = { autoRows: true, rows: 3, gapX: 64, gapY: 56, fov: 65, radius: 900, distance: 520, tilt: 0, stagger: true }
const DEFAULT_SPIN = { direction: "left" as const, speed: 4, hoverSpeed: 0.2, drag: true, dragPower: 1, inertia: 1.2, smoothing: 0.18, scroll: "off" as const, scrollPower: 1 }
const DEFAULT_HOVER = { effect: "dimOthers" as const, amount: 0.55, scale: 1.08, duration: 0.45 }
const DEFAULT_LOOK = { background: "#0E0E0E", edgeFade: 0.55, fadeColor: "#0E0E0E" }

const DEG = Math.PI / 180
const MAX_LAT = 72 * DEG

/* Media is only loaded from Framer-managed assets (https on
   framerusercontent.com), so visitors' browsers never contact other hosts. */
const FRAMER_ASSET_HOST = "framerusercontent.com"
function framerAsset(src: string | undefined | null): string {
    if (!src || typeof src !== "string") return ""
    try {
        const url = new URL(src)
        if (url.protocol !== "https:") return ""
        const host = url.hostname.toLowerCase()
        return host === FRAMER_ASSET_HOST || host.endsWith("." + FRAMER_ASSET_HOST) ? url.href : ""
    } catch {
        return ""
    }
}
/* Ask Framer's image service for a copy no bigger than the card needs. */
function sizedImage(src: string, px: number): string {
    const safe = framerAsset(src)
    if (!safe || safe.indexOf("/images/") < 0) return safe
    try {
        const url = new URL(safe)
        url.searchParams.delete("scale-down-to")
        const steps = [512, 1024, 2048, 4096]
        let size = steps[steps.length - 1]
        for (const s of steps) {
            if (s >= px) {
                size = s
                break
            }
        }
        url.searchParams.set("scale-down-to", String(size))
        return url.href
    } catch {
        return safe
    }
}

/* ── Font and size helpers ─────────────────────────────────────────────── */

function toPx(value: any, base: number, fallback: number): number {
    if (typeof value === "number" && isFinite(value)) return value
    if (typeof value !== "string") return fallback
    const n = parseFloat(value)
    if (!isFinite(n)) return fallback
    if (value.indexOf("em") > 0) return n * base
    if (value.indexOf("%") > 0) return (n / 100) * base
    return n
}
function lineHeightPx(value: any, size: number): number {
    if (typeof value === "number") return value <= 4 ? value * size : value
    if (typeof value === "string" && /^[\d.]+$/.test(value.trim())) {
        const n = parseFloat(value)
        return n <= 4 ? n * size : n
    }
    return toPx(value, size, size * 1.3)
}
interface FontSpec {
    css: string
    size: number
    line: number
    spacing: number
    family: string
    weight: any
    style: string
}
function fontSpec(font: any): FontSpec {
    const f = font || {}
    const size = toPx(f.fontSize, 16, 14)
    const family = f.fontFamily || "Inter, system-ui, -apple-system, sans-serif"
    const weight = f.fontWeight || 500
    const style = f.fontStyle || "normal"
    return {
        css: style + " " + weight + " " + size + "px " + family,
        size,
        line: lineHeightPx(f.lineHeight, size),
        spacing: toPx(f.letterSpacing, size, 0),
        family,
        weight,
        style,
    }
}

/* Height taken by the caption band (0 for overlay / none). */
function captionBand(caption: Props["caption"], font: FontSpec): number {
    return caption.position === "below" || caption.position === "above" ? font.line + caption.gap : 0
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2))
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.lineTo(x + w - rr, y)
    ctx.arcTo(x + w, y, x + w, y + rr, rr)
    ctx.lineTo(x + w, y + h - rr)
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr)
    ctx.lineTo(x + rr, y + h)
    ctx.arcTo(x, y + h, x, y + h - rr, rr)
    ctx.lineTo(x, y + rr)
    ctx.arcTo(x, y, x + rr, y, rr)
    ctx.closePath()
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number): string {
    if (ctx.measureText(text).width <= max) return text
    let lo = 0
    let hi = text.length
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if (ctx.measureText(text.slice(0, mid) + "…").width <= max) lo = mid
        else hi = mid - 1
    }
    return text.slice(0, lo).trimEnd() + "…"
}

/* Paints one whole card (background, media, caption) at scale px per
   CSS px. media is an <img>, <video> or null while loading. */
function paintCard(
    ctx: CanvasRenderingContext2D,
    scale: number,
    card: Props["card"],
    caption: Props["caption"],
    font: FontSpec,
    title: string,
    media: HTMLImageElement | HTMLVideoElement | null
) {
    const W = card.width
    const H = card.height
    const cnv = ctx.canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cnv.width, cnv.height)
    ctx.setTransform(scale, 0, 0, scale, 0, 0)

    roundRectPath(ctx, 0, 0, W, H, card.radius)
    ctx.fillStyle = card.background
    ctx.fill()

    const pad = Math.max(0, Math.min(card.padding, W / 2 - 1, H / 2 - 1))
    const band = captionBand(caption, font)
    const mx = pad
    const my = pad + (caption.position === "above" ? band : 0)
    const mw = Math.max(1, W - pad * 2)
    const mh = Math.max(1, H - pad * 2 - band)
    const mr = Math.min(card.mediaRadius, card.radius)

    ctx.save()
    roundRectPath(ctx, mx, my, mw, mh, pad > 0 ? card.mediaRadius : mr)
    ctx.clip()
    ctx.fillStyle = card.mediaFill
    ctx.fillRect(mx, my, mw, mh)
    if (media) {
        const iw = (media as HTMLVideoElement).videoWidth || (media as HTMLImageElement).naturalWidth || 0
        const ih = (media as HTMLVideoElement).videoHeight || (media as HTMLImageElement).naturalHeight || 0
        if (iw > 0 && ih > 0) {
            const k = card.fit === "contain" ? Math.min(mw / iw, mh / ih) : Math.max(mw / iw, mh / ih)
            const dw = iw * k
            const dh = ih * k
            try {
                ctx.drawImage(media, mx + (mw - dw) / 2, my + (mh - dh) / 2, dw, dh)
            } catch {
                /* a video frame that isn't decodable yet */
            }
        }
    }
    if (caption.position === "overlay" && title) {
        const g = ctx.createLinearGradient(0, my + mh * 0.55, 0, my + mh)
        g.addColorStop(0, "rgba(0,0,0,0)")
        g.addColorStop(1, "rgba(0,0,0,0.55)")
        ctx.fillStyle = g
        ctx.fillRect(mx, my, mw, mh)
    }
    ctx.restore()

    if (caption.position !== "none" && title) {
        ctx.font = font.css
        try {
            ;(ctx as any).letterSpacing = font.spacing + "px"
        } catch {
            /* older browsers: no letter spacing */
        }
        ctx.fillStyle = caption.color
        ctx.textBaseline = "middle"
        const inset = caption.position === "overlay" ? Math.max(12, caption.gap) : 0
        const maxW = mw - inset * 2
        const text = fitText(ctx, title, maxW)
        const tw = ctx.measureText(text).width
        let x = mx + inset
        if (caption.align === "center") x = mx + (mw - tw) / 2
        else if (caption.align === "right") x = mx + mw - inset - tw
        let y = 0
        if (caption.position === "below") y = my + mh + caption.gap + font.line / 2
        else if (caption.position === "above") y = pad + font.line / 2
        else y = my + mh - inset - font.line / 2
        ctx.fillText(text, x, y)
    }
}

/* ── Layout ─────────────────────────────────────────────────────────────── */

interface Row {
    b: number
    count: number
    step: number
    offset: number
    extA: number
    /** Item index shown by each card in the row. */
    items: number[]
}
interface Layout {
    R: number
    /** Camera z in view space: negative = moved from the centre toward the front wall. */
    cam: number
    /** Projection focal length in px (from the field of view and frame height). */
    focal: number
    /** Distance from the camera to the front surface, px. */
    dist: number
    rows: Row[]
    extB: number
    horizontal: boolean
    tanHalf: number
    aspect: number
}

function buildLayout(width: number, height: number, card: Props["card"], globe: Props["globe"], direction: Direction, itemCount: number): Layout {
    const fov = Math.max(20, Math.min(150, globe.fov)) * DEG
    const tanHalf = Math.tan(fov / 2)
    /* A card on the front surface is drawn at focal / distance of its px
       size: moving the camera closer makes the globe look bigger. The camera
       always stays inside the globe. */
    const focal = Math.max(50, height / 2 / tanHalf)
    const R = Math.max(150, globe.radius || DEFAULT_GLOBE.radius)
    const dist = Math.max(30, Math.min(1.9 * R, globe.distance || DEFAULT_GLOBE.distance))
    const cam = dist - R
    const aspect = width / Math.max(1, height)
    const horizontal = direction === "left" || direction === "right"
    const along = horizontal ? card.width : card.height
    const across = horizontal ? card.height : card.width
    const gapAlong = horizontal ? globe.gapX : globe.gapY
    const gapAcross = horizontal ? globe.gapY : globe.gapX
    const rowStep = (across + gapAcross) / R
    const extB = across / R

    let n = Math.max(1, Math.round(globe.rows))
    if (globe.autoRows) {
        /* Enough rows to cover the frame across the spin: find the latitude
           where the frame's edge ray meets the sphere (plus the tilt). */
        const phi = Math.min(1.5, (horizontal ? Math.atan(tanHalf) : Math.atan(tanHalf * aspect)) + Math.abs(globe.tilt) * DEG)
        const od = -cam * Math.cos(phi)
        const hitT = -od + Math.sqrt(Math.max(0, od * od - cam * cam + R * R))
        const half = Math.asin(Math.max(-1, Math.min(1, (hitT * Math.sin(phi)) / R)))
        const k = Math.ceil((half + extB / 2) / rowStep) + 1
        n = 2 * k + 1
    }
    const maxK = Math.floor(MAX_LAT / rowStep)
    n = Math.min(n, 2 * maxK + 1)
    n = Math.max(1, n)

    const rows: Row[] = []
    for (let r = 0; r < n; r++) {
        const b = (r - (n - 1) / 2) * rowStep
        if (Math.abs(b) > MAX_LAT + 1e-6) continue
        const cosB = Math.max(0.2, Math.cos(b))
        const circumference = 2 * Math.PI * R * cosB
        const count = Math.max(1, Math.floor(circumference / (along + gapAlong)))
        const step = (2 * Math.PI) / count
        const extA = Math.min(step * 0.98, along / (R * cosB))
        rows.push({ b, count, step, offset: globe.stagger && r % 2 === 1 ? step / 2 : 0, extA, items: [] })
    }
    assignItems(rows, itemCount)
    return { R, cam, focal, dist, rows, extB, horizontal, tanHalf, aspect }
}

/* Deals items to cards in order, skipping any item that would sit close to
   itself: the two cards to the left (and, where the row closes its loop,
   the first two), plus the nearest cards in the two rows before. With few
   items it relaxes the rule step by step instead of failing. */
function assignItems(rows: Row[], n: number) {
    let counter = 0
    const near = (row: Row, a: number, reach: number) => {
        const rel = (a - row.offset) / row.step
        const lo = Math.floor(rel)
        const out: number[] = []
        for (let j = lo - reach + 1; j <= lo + reach; j++) out.push(row.items[((j % row.count) + row.count) % row.count])
        return out
    }
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r]
        row.items = []
        for (let c = 0; c < row.count; c++) {
            if (n <= 0) {
                row.items.push(0)
                continue
            }
            const a = row.offset + c * row.step
            /* strongest rule first; later ones are dropped if n is small */
            const rules: number[][] = [[], [], []]
            if (c > 0) rules[0].push(row.items[c - 1])
            if (c === row.count - 1 && c > 0) rules[0].push(row.items[0])
            if (r > 0 && rows[r - 1].items.length) rules[0].push(...near(rows[r - 1], a, 1))
            if (c > 1) rules[1].push(row.items[c - 2])
            if (c >= row.count - 2 && row.count > 3) rules[1].push(row.items[1], row.items[0])
            if (r > 0 && rows[r - 1].items.length) rules[1].push(...near(rows[r - 1], a, 2))
            if (r > 1 && rows[r - 2].items.length) rules[2].push(...near(rows[r - 2], a, 1))
            let chosen = -1
            for (let level = rules.length; level >= 1 && chosen < 0; level--) {
                const avoid = ([] as number[]).concat(...rules.slice(0, level))
                for (let k = 0; k < n; k++) {
                    const item = (counter + k) % n
                    if (avoid.indexOf(item) < 0) {
                        chosen = item
                        counter += k
                        break
                    }
                }
            }
            if (chosen < 0) chosen = counter % n
            row.items.push(chosen)
            counter++
        }
    }
}

/* Canonical sphere point for angles (a, b), before the up/down swap. */
function spherePoint(a: number, b: number, R: number): [number, number, number] {
    const cb = Math.cos(b)
    return [R * Math.sin(a) * cb, R * Math.sin(b), -R * Math.cos(a) * cb]
}

const wrap = (x: number) => {
    const t = Math.PI * 2
    return x - t * Math.floor((x + Math.PI) / t)
}

/* ── Shaders ────────────────────────────────────────────────────────────── */

const VERT = [
    "attribute vec2 aUV;",
    "uniform vec4 uCard;", // a0 (incl. spin), b0, extent along a, extent along b
    "uniform float uR;",
    "uniform float uCam;",
    "uniform float uVertical;",
    "uniform float uScale;",
    "uniform vec2 uTilt;", // cos, sin
    "uniform vec2 uProj;", // focal x, focal y (NDC)
    "varying vec2 vUV;",
    "void main() {",
    "  vec2 q = (aUV - 0.5) * uScale;",
    "  float a = uCard.x + (uVertical > 0.5 ? q.y : q.x) * uCard.z;",
    "  float b = uCard.y + (uVertical > 0.5 ? q.x : q.y) * uCard.w;",
    "  float cb = cos(b);",
    "  vec3 p = vec3(sin(a) * cb, sin(b), -cos(a) * cb) * uR;",
    "  if (uVertical > 0.5) p = vec3(p.y, p.x, p.z);",
    "  vec3 v = vec3(p.x, p.y * uTilt.x - p.z * uTilt.y, p.y * uTilt.y + p.z * uTilt.x);",
    "  v.z -= uCam;",
    "  float near = 1.0;",
    "  float far = uR * 4.0 + uCam;",
    "  float zc = (-(far + near) / (far - near)) * v.z - (2.0 * far * near) / (far - near);",
    "  gl_Position = vec4(v.x * uProj.x, v.y * uProj.y, zc, -v.z);",
    "  vUV = vec2(aUV.x, 1.0 - aUV.y);",
    "}",
].join("\n")

const FRAG = [
    "precision mediump float;",
    "uniform sampler2D uTex;",
    "uniform float uOpacity;",
    "uniform float uDim;",
    "varying vec2 vUV;",
    "void main() {",
    "  vec4 c = texture2D(uTex, vUV);",
    "  c.rgb *= 1.0 - uDim;",
    "  gl_FragColor = c * uOpacity;",
    "}",
].join("\n")

/* Per-card hover uniforms from the eased hover amounts. */
function hoverUniforms(effect: HoverEffect, amount: number, scale: number, self: number, others: number) {
    let s = 1
    let dim = 0
    let opacity = 1
    if (effect === "scale") s = 1 + (scale - 1) * self
    else if (effect === "dimOthers") dim = amount * others
    else if (effect === "fadeOthers") opacity = 1 - amount * others
    else if (effect === "dim") dim = amount * self
    else if (effect === "fade") opacity = 1 - amount * self
    return { s, dim, opacity }
}

/* ── Component ──────────────────────────────────────────────────────────── */

interface Engine {
    refreshCards: () => void
    wake: () => void
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */
export default function InnerGlobeGallery(props: Props) {
    const isStatic = useIsStaticRenderer()
    const card = { ...DEFAULT_CARD, ...props.card }
    const caption = { ...DEFAULT_CAPTION, ...props.caption }
    const globe = { ...DEFAULT_GLOBE, ...props.globe }
    const spin = { ...DEFAULT_SPIN, ...props.spin }
    const hover = { ...DEFAULT_HOVER, ...props.hover }
    const look = { ...DEFAULT_LOOK, ...props.look }

    const items = React.useMemo(
        () =>
            (props.items || []).map((it) => ({
                src: framerAsset(it?.image?.src),
                video: framerAsset(it?.video),
                alt: it?.image?.alt || it?.title || "",
                title: it?.title || "",
                link: it?.link || "",
                newTab: !!it?.newTab,
            })),
        [props.items]
    )

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const engineRef = React.useRef<Engine | null>(null)
    const [glFailed, setGlFailed] = React.useState(false)
    const [size, setSize] = React.useState({ w: 1200, h: 720 })

    const settings = { items, card, caption, globe, spin, hover, look, onCardClick: props.onCardClick }
    const settingsRef = React.useRef(settings)
    settingsRef.current = settings

    /* Repaint card textures when anything drawn into them changes. */
    const cardKey = JSON.stringify([items, card, caption])
    React.useEffect(() => {
        engineRef.current?.refreshCards()
    }, [cardKey])
    React.useEffect(() => {
        engineRef.current?.wake()
    })

    const useWebGL = !isStatic && !glFailed

    React.useEffect(() => {
        if (!useWebGL) return
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return
        const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true, depth: false }) as WebGLRenderingContext | null
        if (!gl) {
            setGlFailed(true)
            return
        }

        /* ── Program ── */
        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)!
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(String(gl.getShaderInfoLog(sh)))
            return sh
        }
        let program: WebGLProgram
        try {
            program = gl.createProgram()!
            gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
            gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG))
            gl.linkProgram(program)
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(String(gl.getProgramInfoLog(program)))
        } catch {
            setGlFailed(true)
            return
        }
        gl.useProgram(program)
        const U = (n: string) => gl.getUniformLocation(program, n)
        const uCard = U("uCard")
        const uR = U("uR")
        const uCam = U("uCam")
        const uVertical = U("uVertical")
        const uScale = U("uScale")
        const uTilt = U("uTilt")
        const uProj = U("uProj")
        const uOpacity = U("uOpacity")
        const uDim = U("uDim")
        gl.uniform1i(U("uTex"), 0)

        /* One shared curved grid; each card bends it with its uniforms. */
        const SX = 24
        const SY = 16
        const verts: number[] = []
        for (let j = 0; j <= SY; j++) for (let i = 0; i <= SX; i++) verts.push(i / SX, j / SY)
        const idx: number[] = []
        for (let j = 0; j < SY; j++)
            for (let i = 0; i < SX; i++) {
                const k = j * (SX + 1) + i
                idx.push(k, k + 1, k + SX + 1, k + 1, k + SX + 2, k + SX + 1)
            }
        const vbo = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
        const ibo = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW)
        const aUV = gl.getAttribLocation(program, "aUV")
        gl.enableVertexAttribArray(aUV)
        gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)

        /* ── Card textures (one per item) ── */
        interface Tex {
            tex: WebGLTexture
            canvas: HTMLCanvasElement
            ctx: CanvasRenderingContext2D
            media: HTMLImageElement | HTMLVideoElement | null
            video: HTMLVideoElement | null
            ready: boolean
            fade: number
            fresh: boolean
            dead: boolean
            title: string
            dispose: () => void
        }
        let texes: Tex[] = []
        let dirty = true
        let visible = true
        let raf = 0
        let disposed = false
        const reducedQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null

        const textureScale = () => {
            const s = settingsRef.current
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            const want = dpr * 1.5
            const maxSide = Math.max(s.card.width, s.card.height)
            return Math.max(0.5, Math.min(want, 1600 / Math.max(1, maxSide)))
        }
        const upload = (t: Tex) => {
            gl.bindTexture(gl.TEXTURE_2D, t.tex)
            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t.canvas)
            } catch {
                /* tainted canvas: leave the last good frame */
            }
            dirty = true
            /* media can land while the loop sleeps (speed 0): wake it to draw */
            if (!disposed) wake()
        }
        const repaint = (t: Tex) => {
            const s = settingsRef.current
            const sc = textureScale()
            const w = Math.max(2, Math.round(s.card.width * sc))
            const h = Math.max(2, Math.round(s.card.height * sc))
            if (t.canvas.width !== w || t.canvas.height !== h) {
                t.canvas.width = w
                t.canvas.height = h
            }
            paintCard(t.ctx, w / s.card.width, s.card, s.caption, fontSpec(s.caption.font), t.title, t.media)
            upload(t)
        }
        const playAllowed = () => visible && !document.hidden

        const makeTex = (item: (typeof items)[number], longSide: number): Tex => {
            const c = document.createElement("canvas")
            const ctx = c.getContext("2d")!
            const tex = gl.createTexture()!
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            const t: Tex = { tex, canvas: c, ctx, media: null, video: null, ready: false, fade: 0, fresh: false, dead: false, title: item.title, dispose: () => {} }
            const fallbackImage = () => {
                if (!item.src) {
                    t.ready = true
                    repaint(t)
                    return
                }
                const img = new Image()
                img.crossOrigin = "anonymous"
                img.decoding = "async"
                img.onload = () => {
                    if (t.dead) return
                    if (!t.video || !t.video.videoWidth) t.media = img
                    t.ready = true
                    repaint(t)
                }
                img.onerror = () => {
                    if (t.dead) return
                    t.ready = true
                    repaint(t)
                }
                img.src = sizedImage(item.src, longSide)
            }
            if (item.video) {
                const v = document.createElement("video")
                v.crossOrigin = "anonymous"
                v.muted = true
                v.loop = true
                v.playsInline = true
                v.setAttribute("playsinline", "")
                v.preload = "auto"
                t.video = v
                v.addEventListener("loadeddata", () => {
                    if (t.dead) return
                    t.media = v
                    t.ready = true
                    t.fresh = true
                    repaint(t)
                    if (playAllowed()) v.play().catch(() => {})
                })
                v.addEventListener("error", () => {
                    if (!t.dead && !t.ready) fallbackImage()
                })
                const rvfc = (v as any).requestVideoFrameCallback?.bind(v)
                if (rvfc) {
                    const tick = () => {
                        t.fresh = true
                        if (!t.dead) rvfc(tick)
                    }
                    rvfc(tick)
                }
                v.src = item.video
                /* Show the poster image while the video loads. */
                if (item.src) {
                    const poster = new Image()
                    poster.crossOrigin = "anonymous"
                    poster.onload = () => {
                        if (t.dead || t.media) return
                        t.media = poster
                        t.ready = true
                        repaint(t)
                    }
                    poster.src = sizedImage(item.src, longSide)
                }
            } else fallbackImage()
            t.dispose = () => {
                t.dead = true
                if (t.video) {
                    t.video.pause()
                    t.video.removeAttribute("src")
                    t.video.load()
                }
                gl.deleteTexture(t.tex)
            }
            /* Paint the empty card right away so it can fade in once media lands. */
            repaint(t)
            return t
        }

        let lastItemsKey = ""
        const refreshCards = () => {
            const s = settingsRef.current
            const itemsKey = JSON.stringify(s.items.map((i) => [i.src, i.video]))
            const longSide = Math.max(s.card.width, s.card.height) * textureScale()
            if (itemsKey !== lastItemsKey) {
                texes.forEach((t) => t.dispose())
                texes = s.items.map((it) => makeTex(it, longSide))
                lastItemsKey = itemsKey
            } else {
                texes.forEach((t, i) => {
                    t.title = s.items[i]?.title || ""
                    repaint(t)
                })
            }
            dirty = true
            wake()
        }
        /* Repaint once web fonts arrive, so captions use the chosen face. */
        const onFonts = () => texes.forEach(repaint)
        const fonts: any = (document as any).fonts
        fonts?.addEventListener?.("loadingdone", onFonts)
        const loadFont = () => {
            try {
                fonts?.load?.(fontSpec(settingsRef.current.caption.font).css).then(onFonts, () => {})
            } catch {
                /* ignore */
            }
        }

        /* ── Size ── */
        let W = 1
        let H = 1
        let dpr = 1
        const resize = () => {
            const r = container.getBoundingClientRect()
            W = Math.max(1, r.width)
            H = Math.max(1, r.height)
            dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.round(W * dpr)
            canvas.height = Math.round(H * dpr)
            dirty = true
            wake()
        }

        /* ── Motion state ── */
        /* Smooth-follow motion: input moves "target", the drawn angle
           "spinAngle" eases after it, so drags, throws and scroll glide. */
        let spinAngle = 0
        let target = 0
        let autoVel = 0 // rad/s, eases between full and hover speed
        let momentum = 0 // rad/s, from throws and keys, decays with Glide
        let lastScroll = typeof window !== "undefined" ? window.scrollY : 0
        let dragging = false
        let dragMoved = false
        let lastPointer = { x: 0, y: 0, t: 0 }
        let downPointer = { x: 0, y: 0 }
        let dragVel = 0
        let pointerInside = false
        let mouse = { x: -1, y: -1 }
        let hovered = -1 // card slot index
        let hoveredItem = -1
        let anyHover = 0
        const hoverAmt = new Map<number, number>()
        let layout: Layout = buildLayout(W, H, settingsRef.current.card, settingsRef.current.globe, settingsRef.current.spin.direction, settingsRef.current.items.length)
        let lastT = performance.now()

        const dirSign = (d: Direction) => (d === "left" || d === "down" ? -1 : 1)

        /* Card under a pointer position (container px) → slot + item, or -1. */
        const pick = (px: number, py: number): { slot: number; item: number } => {
            const s = settingsRef.current
            if (!texes.length || px < 0 || py < 0 || px > W || py > H) return { slot: -1, item: -1 }
            const L = layout
            const nx = (2 * px) / W - 1
            const ny = 1 - (2 * py) / H
            /* ray from the camera (0, 0, cam) in view space, then undo the
               tilt (view = Tilt(world)) for both origin and direction */
            const t = s.globe.tilt * DEG
            const c = Math.cos(t)
            const sn = Math.sin(t)
            const untilt = (x: number, y: number, z: number): [number, number, number] => [x, y * c + z * sn, -y * sn + z * c]
            const o = untilt(0, 0, L.cam)
            const dRaw = untilt(nx * L.tanHalf * L.aspect, ny * L.tanHalf, -1)
            const dl = Math.hypot(dRaw[0], dRaw[1], dRaw[2])
            const d = [dRaw[0] / dl, dRaw[1] / dl, dRaw[2] / dl]
            const od = o[0] * d[0] + o[1] * d[1] + o[2] * d[2]
            const oo = o[0] * o[0] + o[1] * o[1] + o[2] * o[2]
            const hitT = -od + Math.sqrt(Math.max(0, od * od - oo + L.R * L.R))
            let px3 = o[0] + d[0] * hitT
            let py3 = o[1] + d[1] * hitT
            const pz3 = o[2] + d[2] * hitT
            if (!L.horizontal) {
                const tmp = px3
                px3 = py3
                py3 = tmp
            }
            const b = Math.asin(Math.max(-1, Math.min(1, py3 / L.R)))
            const a = Math.atan2(px3, -pz3)
            let slot = 0
            for (let r = 0; r < L.rows.length; r++) {
                const row = L.rows[r]
                if (Math.abs(b - row.b) <= L.extB / 2) {
                    const rel = wrap(a - spinAngle - row.offset)
                    const j = Math.round(rel / row.step)
                    if (Math.abs(rel - j * row.step) <= row.extA / 2) {
                        const col = ((j % row.count) + row.count) % row.count
                        return { slot: slot + col, item: row.items[col] }
                    }
                    return { slot: -1, item: -1 }
                }
                slot += row.count
            }
            return { slot: -1, item: -1 }
        }

        const updateCursor = () => {
            const s = settingsRef.current
            const it = hoveredItem >= 0 ? s.items[hoveredItem] : null
            container.style.cursor = dragging && dragMoved ? "grabbing" : it && (it.link || s.onCardClick) ? "pointer" : s.spin.drag ? "grab" : "default"
        }

        /* ── Frame ── */
        const frame = (now: number) => {
            raf = 0
            if (disposed) return
            const s = settingsRef.current
            const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000))
            lastT = now
            const reduced = !!reducedQuery?.matches
            layout = buildLayout(W, H, s.card, s.globe, s.spin.direction, s.items.length)

            /* spin */
            const sign = dirSign(s.spin.direction)
            const auto = reduced ? 0 : sign * s.spin.speed * DEG * (hovered >= 0 ? s.spin.hoverSpeed : 1)
            autoVel += (auto - autoVel) * (1 - Math.exp(-dt / 0.6))
            if (!dragging) {
                momentum *= Math.exp(-dt / Math.max(0.05, s.spin.inertia))
                if (Math.abs(momentum) < 1e-4) momentum = 0
                target += (autoVel + momentum) * dt
            }
            const smooth = Math.max(0, s.spin.smoothing)
            if (smooth <= 0.001) spinAngle = target
            else spinAngle += (target - spinAngle) * (1 - Math.exp(-dt / smooth))
            const gap = target - spinAngle
            if (Math.abs(gap) < 1e-5) spinAngle = target
            /* keep the numbers small without a visible jump */
            if (Math.abs(spinAngle) > 1000) {
                const k = Math.round(spinAngle / (Math.PI * 2)) * Math.PI * 2
                spinAngle -= k
                target -= k
            }
            const moving = dragging || Math.abs(autoVel) > 1e-5 || Math.abs(auto) > 1e-5 || momentum !== 0 || spinAngle !== target

            /* hover pick (the globe moves under a still cursor) */
            if (pointerInside && !dragging) {
                const p = pick(mouse.x, mouse.y)
                if (p.slot !== hovered) {
                    hovered = p.slot
                    hoveredItem = p.item
                    updateCursor()
                }
            }
            const k = 1 - Math.exp(-dt / Math.max(0.02, s.hover.duration / 3))
            let animating = false
            anyHover += ((hovered >= 0 ? 1 : 0) - anyHover) * k
            if (Math.abs(anyHover - (hovered >= 0 ? 1 : 0)) > 0.002) animating = true
            hoverAmt.forEach((v, key) => {
                const target = key === hovered ? 1 : 0
                const nv = v + (target - v) * k
                if (Math.abs(nv - target) < 0.002) {
                    if (target === 0) hoverAmt.delete(key)
                    else hoverAmt.set(key, 1)
                } else {
                    hoverAmt.set(key, nv)
                    animating = true
                }
            })
            if (hovered >= 0 && !hoverAmt.has(hovered)) {
                hoverAmt.set(hovered, 0)
                animating = true
            }

            /* textures: fade-ins and video frames */
            let videos = false
            for (const t of texes) {
                if (t.ready && t.fade < 1) {
                    t.fade = Math.min(1, t.fade + dt / 0.6)
                    animating = true
                }
                if (t.video && t.media === t.video) {
                    videos = true
                    if (t.fresh || !(t.video as any).requestVideoFrameCallback) {
                        t.fresh = false
                        repaint(t)
                    }
                }
            }

            if (dirty || moving || animating || videos || dragging) {
                draw()
                dirty = false
            }
            if (visible && !document.hidden && (moving || animating || videos || dragging || pointerInside)) raf = requestAnimationFrame(frame)
        }

        const draw = () => {
            const s = settingsRef.current
            const L = layout
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            if (!texes.length) return
            gl.uniform1f(uR, L.R)
            gl.uniform1f(uCam, L.cam)
            gl.uniform1f(uVertical, L.horizontal ? 0 : 1)
            const t = s.globe.tilt * DEG
            gl.uniform2f(uTilt, Math.cos(t), Math.sin(t))
            gl.uniform2f(uProj, 1 / (L.tanHalf * L.aspect), 1 / L.tanHalf)
            let slot = 0
            const later: [number, number, number, number, number][] = []
            const drawCard = (a: number, b: number, extA: number, texIndex: number, key: number) => {
                const tx = texes[texIndex]
                if (!tx || tx.fade <= 0) return
                const self = hoverAmt.get(key) || 0
                const others = Math.max(0, anyHover - self)
                const h = hoverUniforms(s.hover.effect, s.hover.amount, s.hover.scale, self, others)
                gl.uniform4f(uCard, a, b, extA, L.extB)
                gl.uniform1f(uScale, h.s)
                gl.uniform1f(uOpacity, h.opacity * tx.fade)
                gl.uniform1f(uDim, h.dim)
                gl.bindTexture(gl.TEXTURE_2D, tx.tex)
                gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0)
            }
            for (let r = 0; r < L.rows.length; r++) {
                const row = L.rows[r]
                for (let c = 0; c < row.count; c++) {
                    const key = slot + c
                    const a = row.offset + c * row.step + spinAngle
                    const item = row.items[c]
                    if (hoverAmt.has(key)) later.push([a, row.b, row.extA, item, key])
                    else drawCard(a, row.b, row.extA, item, key)
                }
                slot += row.count
            }
            /* Hovered cards draw last (most hovered on top) so a scaled card sits above its neighbours. */
            later.sort((x, y) => (hoverAmt.get(x[4]) || 0) - (hoverAmt.get(y[4]) || 0))
            for (const c of later) drawCard(c[0], c[1], c[2], c[3], c[4])
        }

        const wake = () => {
            if (!raf && !disposed) {
                lastT = performance.now()
                raf = requestAnimationFrame(frame)
            }
        }

        /* ── Input ── */
        const local = (e: PointerEvent) => {
            const r = container.getBoundingClientRect()
            return { x: e.clientX - r.left, y: e.clientY - r.top }
        }
        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return
            const p = local(e)
            downPointer = p
            lastPointer = { x: p.x, y: p.y, t: performance.now() }
            dragMoved = false
            dragVel = 0
            if (settingsRef.current.spin.drag) {
                dragging = true
                momentum = 0
                try {
                    container.setPointerCapture(e.pointerId)
                } catch {
                    /* ignore */
                }
            }
            wake()
        }
        const onPointerMove = (e: PointerEvent) => {
            const p = local(e)
            mouse = p
            if (e.pointerType === "mouse") pointerInside = true
            if (dragging) {
                const s = settingsRef.current
                const horizontal = s.spin.direction === "left" || s.spin.direction === "right"
                const delta = horizontal ? p.x - lastPointer.x : -(p.y - lastPointer.y)
                if (!dragMoved && Math.hypot(p.x - downPointer.x, p.y - downPointer.y) > 6) {
                    dragMoved = true
                    hovered = -1
                    hoveredItem = -1
                    updateCursor()
                }
                const now = performance.now()
                const d = ((delta * layout.dist) / (layout.focal * layout.R)) * s.spin.dragPower
                target += d
                const dtp = Math.max(1, now - lastPointer.t) / 1000
                dragVel = dragVel * 0.6 + (d / dtp) * 0.4
                lastPointer = { x: p.x, y: p.y, t: now }
                dirty = true
            }
            wake()
        }
        const endDrag = (e: PointerEvent, click: boolean) => {
            const s = settingsRef.current
            if (dragging) {
                dragging = false
                if (performance.now() - lastPointer.t > 80) dragVel = 0
                /* hand the throw over seamlessly: auto spin + momentum = release speed */
                momentum = Math.max(-12, Math.min(12, dragVel)) - autoVel
            }
            if (click && !dragMoved) {
                const p = local(e)
                const hit = pick(p.x, p.y)
                if (hit.item >= 0) {
                    const it = s.items[hit.item]
                    s.onCardClick?.()
                    if (it && it.link) {
                        if (it.newTab) window.open(it.link, "_blank", "noopener,noreferrer")
                        else window.location.href = it.link
                    }
                }
            }
            dragMoved = false
            if (e.pointerType !== "mouse") {
                pointerInside = false
                hovered = -1
                hoveredItem = -1
            }
            updateCursor()
            wake()
        }
        const onPointerUp = (e: PointerEvent) => endDrag(e, true)
        const onPointerCancel = (e: PointerEvent) => endDrag(e, false)
        const onPointerLeave = () => {
            pointerInside = false
            if (!dragging) {
                hovered = -1
                hoveredItem = -1
            }
            wake()
        }
        const onKeyDown = (e: KeyboardEvent) => {
            const s = settingsRef.current
            const horizontal = s.spin.direction === "left" || s.spin.direction === "right"
            const keys = horizontal ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowDown: -1, ArrowUp: 1 }
            const k = (keys as any)[e.key]
            if (!k) return
            e.preventDefault()
            momentum += k * 1.2
            wake()
        }
        const onScroll = () => {
            const y = window.scrollY
            const dy = y - lastScroll
            lastScroll = y
            const s = settingsRef.current
            if (s.spin.scroll !== "spin" || !visible || !dy) return
            target += (dirSign(s.spin.direction) * dy * s.spin.scrollPower * layout.dist) / (layout.focal * layout.R)
            wake()
        }
        const onVisibility = () => {
            texes.forEach((t) => {
                if (!t.video) return
                if (playAllowed()) t.video.play().catch(() => {})
                else t.video.pause()
            })
            wake()
        }

        container.addEventListener("pointerdown", onPointerDown)
        container.addEventListener("pointermove", onPointerMove)
        container.addEventListener("pointerup", onPointerUp)
        container.addEventListener("pointercancel", onPointerCancel)
        container.addEventListener("pointerleave", onPointerLeave)
        container.addEventListener("keydown", onKeyDown)
        document.addEventListener("visibilitychange", onVisibility)
        window.addEventListener("scroll", onScroll, { passive: true })
        const onLost = (e: Event) => {
            e.preventDefault()
            setGlFailed(true)
        }
        canvas.addEventListener("webglcontextlost", onLost)
        const ro = new ResizeObserver(resize)
        ro.observe(container)
        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
            onVisibility()
        })
        io.observe(container)

        engineRef.current = {
            refreshCards: () => {
                loadFont()
                refreshCards()
            },
            wake: () => {
                dirty = true
                updateCursor()
                wake()
            },
        }
        resize()
        loadFont()
        refreshCards()
        updateCursor()

        return () => {
            disposed = true
            if (raf) cancelAnimationFrame(raf)
            engineRef.current = null
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointercancel", onPointerCancel)
            container.removeEventListener("pointerleave", onPointerLeave)
            container.removeEventListener("keydown", onKeyDown)
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("scroll", onScroll)
            canvas.removeEventListener("webglcontextlost", onLost)
            fonts?.removeEventListener?.("loadingdone", onFonts)
            ro.disconnect()
            io.disconnect()
            texes.forEach((t) => t.dispose())
            texes = []
            gl.deleteBuffer(vbo)
            gl.deleteBuffer(ibo)
            gl.deleteProgram(program)
        }
    }, [useWebGL])

    /* Static fallback measures its frame so the layout matches the live one. */
    React.useLayoutEffect(() => {
        if (useWebGL) return
        const el = containerRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.width && r.height) setSize({ w: r.width, h: r.height })
    }, [useWebGL])

    const fadeStops = look.edgeFade > 0
    const linked = items.filter((it) => it.link)

    return (
        <div
            ref={containerRef}
            role="region"
            aria-roledescription="gallery"
            aria-label={items.length ? "Card globe, " + items.length + " cards" : "Card globe"}
            tabIndex={useWebGL ? 0 : undefined}
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
                background: look.background,
                touchAction: spin.drag ? (spin.direction === "left" || spin.direction === "right" ? "pan-y" : "pan-x") : "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
                outline: "none",
            }}
        >
            {useWebGL ? (
                <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
            ) : (
                <StaticGlobe items={items} card={card} caption={caption} globe={globe} direction={spin.direction} width={size.w} height={size.h} />
            )}
            {fadeStops && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                            "radial-gradient(ellipse at center, rgba(0,0,0,0) " +
                            Math.round((1 - look.edgeFade) * 70) +
                            "%, " +
                            look.fadeColor +
                            " 100%)",
                    }}
                />
            )}
            {items.length === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        padding: 24,
                        textAlign: "center",
                        font: "500 14px/1.5 system-ui, sans-serif",
                        color: "rgba(255, 255, 255, 0.6)",
                    }}
                >
                    Add cards in the properties panel: Cards → +
                </div>
            )}
            {linked.length > 0 && (
                <ul style={SR_ONLY}>
                    {linked.map((it, i) => (
                        <li key={i}>
                            <a href={it.link} target={it.newTab ? "_blank" : undefined} rel={it.newTab ? "noopener noreferrer" : undefined}>
                                {it.title || it.alt || "Card " + (i + 1)}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

const SR_ONLY: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
    listStyle: "none",
}

/* ── Static fallback ────────────────────────────────────────────────────
   Flat cards placed tangent to the sphere with CSS 3D. Used on the Framer
   canvas (no effects run there) and if WebGL is unavailable. */
function StaticGlobe({
    items,
    card,
    caption,
    globe,
    direction,
    width,
    height,
}: {
    items: { src: string; video: string; alt: string; title: string }[]
    card: Props["card"]
    caption: Props["caption"]
    globe: Props["globe"]
    direction: Direction
    width: number
    height: number
}) {
    if (!items.length) return null
    const L = buildLayout(width, height, card, globe, direction, items.length)
    const t = globe.tilt * DEG
    const ct = Math.cos(t)
    const st = Math.sin(t)
    const tilt = (v: [number, number, number]): [number, number, number] => [v[0], v[1] * ct - v[2] * st, v[1] * st + v[2] * ct]
    const swap = (v: [number, number, number]): [number, number, number] => (L.horizontal ? v : [v[1], v[0], v[2]])
    const font = fontSpec(caption.font)
    const cards: React.ReactNode[] = []
    const halfX = Math.atan(L.tanHalf * L.aspect) + 0.35
    const halfY = Math.atan(L.tanHalf) + 0.35
    L.rows.forEach((row, r) => {
        for (let c = 0; c < row.count; c++) {
            const a = wrap(row.offset + c * row.step)
            const b = row.b
            const C = tilt(swap(spherePoint(a, b, L.R)))
            C[2] -= L.cam
            /* skip cards behind or far outside the view */
            if (C[2] > -20) continue
            if (Math.abs(Math.atan2(C[0], -C[2])) > halfX || Math.abs(Math.atan2(C[1], -C[2])) > halfY) continue
            const Ta: [number, number, number] = [Math.cos(a), 0, Math.sin(a)]
            const Tb: [number, number, number] = [-Math.sin(a) * Math.sin(b), Math.cos(b), Math.cos(a) * Math.sin(b)]
            const right = tilt(L.horizontal ? Ta : swap(Tb))
            const up = tilt(L.horizontal ? Tb : swap(Ta))
            const S = tilt(swap(spherePoint(a, b, 1)))
            const nrm: [number, number, number] = [-S[0], -S[1], -S[2]]
            /* CSS: y is down, the camera sits at z = +R looking at z = 0. */
            const m = [
                right[0], -right[1], right[2], 0,
                -up[0], up[1], -up[2], 0,
                nrm[0], -nrm[1], nrm[2], 0,
                C[0], -C[1], C[2] + L.focal, 1,
            ].map((v) => Math.round(v * 10000) / 10000)
            const item = items[row.items[c]]
            cards.push(
                <div
                    key={r + "-" + c}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: card.width,
                        height: card.height,
                        marginLeft: -card.width / 2,
                        marginTop: -card.height / 2,
                        transform: "matrix3d(" + m.join(",") + ")",
                    }}
                >
                    <StaticCard item={item} card={card} caption={caption} font={font} />
                </div>
            )
        }
    })
    return (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, perspective: L.focal, perspectiveOrigin: "50% 50%" }}>
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>{cards}</div>
        </div>
    )
}

function StaticCard({ item, card, caption, font }: { item: { src: string; alt: string; title: string }; card: Props["card"]; caption: Props["caption"]; font: FontSpec }) {
    const band = captionBand(caption, font)
    const pad = Math.max(0, card.padding)
    const titleStyle: React.CSSProperties = {
        position: "absolute",
        left: pad + (caption.position === "overlay" ? Math.max(12, caption.gap) : 0),
        right: pad + (caption.position === "overlay" ? Math.max(12, caption.gap) : 0),
        height: font.line,
        lineHeight: font.line + "px",
        font: font.style + " " + font.weight + " " + font.size + "px " + font.family,
        letterSpacing: font.spacing,
        color: caption.color,
        textAlign: caption.align,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        margin: 0,
    }
    if (caption.position === "below") titleStyle.bottom = pad
    else if (caption.position === "above") titleStyle.top = pad
    else titleStyle.bottom = pad + Math.max(12, caption.gap)
    return (
        <div style={{ position: "absolute", inset: 0, background: card.background, borderRadius: card.radius, overflow: "hidden" }}>
            <div
                style={{
                    position: "absolute",
                    left: pad,
                    right: pad,
                    top: pad + (caption.position === "above" ? band : 0),
                    bottom: pad + (caption.position === "below" ? band : 0),
                    borderRadius: card.mediaRadius,
                    overflow: "hidden",
                    background: card.mediaFill,
                }}
            >
                {item.src && <img src={sizedImage(item.src, Math.max(card.width, card.height) * 2)} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: card.fit, display: "block" }} />}
                {caption.position === "overlay" && item.title && (
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
                )}
            </div>
            {caption.position !== "none" && item.title && <p style={titleStyle}>{item.title}</p>}
        </div>
    )
}

/* ── Controls ──────────────────────────────────────────────────────────── */

InnerGlobeGallery.displayName = "Inner Globe Gallery"

addPropertyControls(InnerGlobeGallery, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: {
                    type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"],
                    description: "Optional. Plays muted on the card instead of the image; the image shows while it loads.",
                },
                title: { type: ControlType.String, title: "Title", defaultValue: "" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, hidden: (p: any) => !p.link },
            },
        },
        defaultValue: [],
        description: "Cards repeat around the globe until every row is full.",
    },
    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            width: { type: ControlType.Number, title: "Width", defaultValue: DEFAULT_CARD.width, min: 60, max: 900, step: 1, unit: "px" },
            height: { type: ControlType.Number, title: "Height", defaultValue: DEFAULT_CARD.height, min: 60, max: 900, step: 1, unit: "px", description: "Whole card, including the title." },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: DEFAULT_CARD.padding, min: 0, max: 120, step: 1, unit: "px", description: "Space between the card's edge and its media and title." },
            background: { type: ControlType.Color, title: "Background", defaultValue: DEFAULT_CARD.background },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: DEFAULT_CARD.radius, min: 0, max: 200, step: 1, unit: "px" },
            mediaRadius: { type: ControlType.Number, title: "Media Radius", defaultValue: DEFAULT_CARD.mediaRadius, min: 0, max: 200, step: 1, unit: "px" },
            fit: { type: ControlType.Enum, title: "Media Fit", options: ["cover", "contain"], optionTitles: ["Fill", "Fit"], defaultValue: DEFAULT_CARD.fit, displaySegmentedControl: true },
            mediaFill: { type: ControlType.Color, title: "Media Fill", defaultValue: DEFAULT_CARD.mediaFill, description: "Shown behind the media while it loads or around a fitted image." },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Title",
        controls: {
            position: {
                type: ControlType.Enum, title: "Position", options: ["below", "above", "overlay", "none"], optionTitles: ["Below", "Above", "Overlay", "None"],
                defaultValue: DEFAULT_CAPTION.position,
            },
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: DEFAULT_CAPTION.font, hidden: (p: any) => p.position === "none" },
            color: { type: ControlType.Color, title: "Color", defaultValue: DEFAULT_CAPTION.color, hidden: (p: any) => p.position === "none" },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: DEFAULT_CAPTION.gap, min: 0, max: 80, step: 1, unit: "px", hidden: (p: any) => p.position === "none", description: "Space between the media and the title (inset for Overlay)." },
            align: { type: ControlType.Enum, title: "Align", options: ["left", "center", "right"], optionTitles: ["Left", "Center", "Right"], defaultValue: DEFAULT_CAPTION.align, displaySegmentedControl: true, hidden: (p: any) => p.position === "none" },
        },
    },
    globe: {
        type: ControlType.Object,
        title: "Globe",
        controls: {
            autoRows: {
                type: ControlType.Boolean, title: "Rows", defaultValue: DEFAULT_GLOBE.autoRows, enabledTitle: "Auto", disabledTitle: "Set",
                description: "Auto adds rows until the frame is covered at any size.",
            },
            rows: { type: ControlType.Number, title: "Count", defaultValue: DEFAULT_GLOBE.rows, min: 1, max: 15, step: 1, displayStepper: true, hidden: (p: any) => p.autoRows !== false },
            gapX: { type: ControlType.Number, title: "Gap X", defaultValue: DEFAULT_GLOBE.gapX, min: 0, max: 400, step: 1, unit: "px" },
            gapY: { type: ControlType.Number, title: "Gap Y", defaultValue: DEFAULT_GLOBE.gapY, min: 0, max: 400, step: 1, unit: "px" },
            fov: {
                type: ControlType.Number, title: "Field of View", defaultValue: DEFAULT_GLOBE.fov, min: 30, max: 130, step: 1, unit: "°",
                description: "Like a camera lens: wider shows more of the globe and stretches the edges.",
            },
            radius: {
                type: ControlType.Number, title: "Globe Size", defaultValue: DEFAULT_GLOBE.radius, min: 300, max: 6000, step: 10, unit: "px",
                description: "Radius of the globe. Smaller curves the rows and cards more; bigger flattens them out.",
            },
            distance: {
                type: ControlType.Number, title: "View Distance", defaultValue: DEFAULT_GLOBE.distance, min: 50, max: 6000, step: 10, unit: "px",
                description: "How far the camera is from the cards in front. Closer makes the globe look bigger and the rows above and below lean away; further pulls back toward the centre. Capped just inside the far wall.",
            },
            tilt: { type: ControlType.Number, title: "Tilt", defaultValue: DEFAULT_GLOBE.tilt, min: -45, max: 45, step: 1, unit: "°", description: "Looks up or down inside the globe." },
            stagger: { type: ControlType.Boolean, title: "Stagger", defaultValue: DEFAULT_GLOBE.stagger, description: "Offsets every other row by half a card, like brickwork." },
        },
    },
    spin: {
        type: ControlType.Object,
        title: "Spin",
        controls: {
            direction: {
                type: ControlType.Enum, title: "Direction", options: ["left", "right", "up", "down"], optionTitles: ["Left", "Right", "Up", "Down"],
                defaultValue: DEFAULT_SPIN.direction, displaySegmentedControl: true,
            },
            speed: { type: ControlType.Number, title: "Speed", defaultValue: DEFAULT_SPIN.speed, min: 0, max: 60, step: 0.5, unit: "°/s", description: "0 keeps the globe still until it's dragged." },
            hoverSpeed: { type: ControlType.Number, title: "On Hover", defaultValue: DEFAULT_SPIN.hoverSpeed, min: 0, max: 1, step: 0.05, description: "Share of the speed while a card is hovered. 0 stops it." },
            drag: { type: ControlType.Boolean, title: "Drag", defaultValue: DEFAULT_SPIN.drag, description: "Drag or swipe to spin the globe along its direction." },
            dragPower: { type: ControlType.Number, title: "Drag Power", defaultValue: DEFAULT_SPIN.dragPower, min: 0.1, max: 4, step: 0.05, hidden: (p: any) => !p.drag, description: "1 keeps cards under the cursor." },
            inertia: { type: ControlType.Number, title: "Glide", defaultValue: DEFAULT_SPIN.inertia, min: 0.05, max: 4, step: 0.05, unit: "s", description: "How long a throw keeps gliding before easing back to the spin speed." },
            smoothing: {
                type: ControlType.Number, title: "Smoothing", defaultValue: DEFAULT_SPIN.smoothing, min: 0, max: 1.5, step: 0.01, unit: "s",
                description: "The globe eases after the cursor and scroll instead of snapping to them. 0 follows instantly; higher feels heavier and silkier.",
            },
            scroll: {
                type: ControlType.Enum, title: "Page Scroll", options: ["off", "spin"], optionTitles: ["Off", "Spins Globe"], defaultValue: DEFAULT_SPIN.scroll, displaySegmentedControl: true,
                description: "Scrolling the page turns the globe: down spins it in its direction, up spins it back.",
            },
            scrollPower: { type: ControlType.Number, title: "Scroll Power", defaultValue: DEFAULT_SPIN.scrollPower, min: 0.1, max: 5, step: 0.05, hidden: (p: any) => p.scroll !== "spin", description: "1 moves the cards as far as the page scrolls." },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            effect: {
                type: ControlType.Enum, title: "Effect",
                options: ["dimOthers", "fadeOthers", "scale", "dim", "fade", "none"],
                optionTitles: ["Dim Others", "Fade Others", "Scale Up", "Dim Card", "Fade Card", "None"],
                defaultValue: DEFAULT_HOVER.effect,
            },
            amount: {
                type: ControlType.Number, title: "Amount", defaultValue: DEFAULT_HOVER.amount, min: 0, max: 1, step: 0.01,
                hidden: (p: any) => p.effect === "scale" || p.effect === "none",
            },
            scale: { type: ControlType.Number, title: "Scale", defaultValue: DEFAULT_HOVER.scale, min: 0.5, max: 2, step: 0.01, hidden: (p: any) => p.effect !== "scale" },
            duration: { type: ControlType.Number, title: "Duration", defaultValue: DEFAULT_HOVER.duration, min: 0.05, max: 2, step: 0.05, unit: "s", hidden: (p: any) => p.effect === "none" },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: DEFAULT_LOOK.background },
            edgeFade: { type: ControlType.Number, title: "Edge Fade", defaultValue: DEFAULT_LOOK.edgeFade, min: 0, max: 1, step: 0.01, description: "Fades the edges of the frame into the fade colour. 0 turns it off." },
            fadeColor: { type: ControlType.Color, title: "Fade Color", defaultValue: DEFAULT_LOOK.fadeColor, hidden: (p: any) => !p.edgeFade },
        },
    },
    onCardClick: { type: ControlType.EventHandler, title: "On Card Click" },
})
