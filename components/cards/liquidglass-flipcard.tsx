// Liquid Glass Flip Card
// A thick slab of liquid glass that turns in real 3D. Mid-turn the lensing swells, a band of light
// travels across the surface, the glass edge flashes like a prism at 90° and the card lands on a
// soft, gel-like spring. Flip by click, tap, keyboard, hover or by dragging/swiping with momentum.

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

import {
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useSpring,
    useTransform,
    useVelocity,
    type MotionValue,
    type Transition,
} from "framer-motion"

type Side = "front" | "back"
type Axis = "horizontal" | "vertical"

interface OpticsSettings {
    blur?: number
    depth?: number
    refraction?: number
    dispersion?: number
    light?: number
}

interface LiquidGlassFlipCardProps {
    frontEyebrow?: string
    frontTitle?: string
    frontText?: string
    frontLayer?: React.ReactNode
    backEyebrow?: string
    backTitle?: string
    backText?: string
    buttonLabel?: string
    link?: string
    newTab?: boolean
    linkArea?: "card" | "button"
    backLayer?: React.ReactNode
    startSide?: Side
    trigger?: "click" | "hover"
    drag?: boolean
    axis?: Axis
    flipTransition?: Transition
    liquidity?: number
    tilt?: number
    flipButton?: boolean
    surface?: "light" | "dark"
    material?: "clear" | "frosted" | "tinted"
    tint?: string
    textColor?: string
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    radius?: string | number
    padding?: string | number
    optics?: OpticsSettings
    shadow?: "none" | "soft" | "prism"
    onFlip?: () => void
    onButtonTap?: () => void
    focusColor?: string
    style?: React.CSSProperties
}

const DEFAULT_TRANSITION: Transition = { type: "spring", stiffness: 70, damping: 13, mass: 1.1 }
const RAD = Math.PI / 180

const clamp = (value: number, min: number, max: number) => (value < min ? min : value > max ? max : value)
const clamp01 = (value: number) => clamp(value, 0, 1)
const smooth = (edge0: number, edge1: number, value: number) => {
    const t = clamp01((value - edge0) / (edge1 - edge0))
    return t * t * (3 - 2 * t)
}
const num = (value: unknown, fallback: number) => {
    const n = typeof value === "number" ? value : Number(value)
    return Number.isFinite(n) ? n : fallback
}
/** Signed angle of the visible half-turn in [-90, 90]. The card is never seen from behind. */
const halfTurn = (turn: number) => turn - 180 * Math.round(turn / 180)
const sideOf = (turn: number): Side => (Math.abs(Math.round(turn / 180)) % 2 === 0 ? "front" : "back")
const edgeOf = (turn: number) => Math.abs(Math.sin(halfTurn(turn) * RAD))

/** CSS box shorthand (1–4 values) → [top, right, bottom, left]. */
function boxSides(value: string | number | undefined, fallback: string): [string, string, string, string] {
    const raw = typeof value === "number" ? `${value}px` : String(value ?? "").trim() || fallback
    const parts = raw.split(/\s+/).filter(Boolean)
    const [top, right = top, bottom = top, left = right] = parts
    return [top, right, bottom, left]
}

function supportsBackdropRefraction(): boolean {
    if (typeof navigator === "undefined") return false
    const ua = navigator.userAgent
    const touchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
    if (/iPhone|iPad|iPod/.test(ua) || touchMac || /Firefox\//.test(ua)) return false
    return /(?:Chrome|Chromium|Edg)\//.test(ua)
}

interface GlassMaps {
    field: string
    light: string
    width: number
    height: number
}

/**
 * Procedural optics for a rounded glass slab, generated once per size/radius/depth.
 * field: R/G = refraction offset (neutral 128).
 * light: static specular lobes (key light from the upper left) as white/black alpha.
 * The bezel follows a convex squircle profile: steep at the rim, flat towards the centre.
 */
function makeGlassMaps(
    width: number,
    height: number,
    corners: readonly [number, number, number, number],
    depth: number
): GlassMaps | null {
    if (typeof document === "undefined") return null
    const w = Math.max(1, width)
    const h = Math.max(1, height)
    let [tl, tr, br, bl] = corners.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0))
    const fit = Math.min(
        1,
        w / Math.max(1e-6, tl + tr),
        w / Math.max(1e-6, bl + br),
        h / Math.max(1e-6, tl + bl),
        h / Math.max(1e-6, tr + br)
    )
    tl *= fit
    tr *= fit
    br *= fit
    bl *= fit
    const bezel = Math.max(2, Math.min(depth, w / 2, h / 2))
    const density = Math.min(1.25, Math.sqrt(210_000 / (w * h)), 900 / w, 900 / h)
    const mapW = Math.max(2, Math.round(w * density))
    const mapH = Math.max(2, Math.round(h * density))
    const stepX = w / mapW
    const stepY = h / mapH
    const footprint = Math.max(stepX, stepY)
    const halfW = w / 2
    const halfH = h / 2
    const lightX = -0.5547
    const lightY = -0.83205

    const canvas = document.createElement("canvas")
    canvas.width = mapW
    canvas.height = mapH
    const context = canvas.getContext("2d")
    if (!context) return null
    const fieldData = context.createImageData(mapW, mapH)
    const lightData = context.createImageData(mapW, mapH)
    const f = fieldData.data
    const l = lightData.data
    const rampEnd = Math.min(0.5, (footprint * 1.5) / bezel)

    for (let y = 0; y < mapH; y++) {
        const py = (y + 0.5) * stepY - halfH
        for (let x = 0; x < mapW; x++) {
            const px = (x + 0.5) * stepX - halfW
            const i = (y * mapW + x) * 4
            f[i] = 128
            f[i + 1] = 128
            f[i + 2] = 128
            f[i + 3] = 255
            const r = px < 0 ? (py < 0 ? tl : bl) : py < 0 ? tr : br
            const qx = Math.abs(px) - (halfW - r)
            const qy = Math.abs(py) - (halfH - r)
            const ox = Math.max(qx, 0)
            const oy = Math.max(qy, 0)
            const outer = Math.hypot(ox, oy)
            const inward = -(outer + Math.min(Math.max(qx, qy), 0) - r)
            if (inward <= 0) continue
            if (inward >= bezel) continue

            const sx = px < 0 ? -1 : 1
            const sy = py < 0 ? -1 : 1
            let nx: number
            let ny: number
            if (outer > 1e-6) {
                nx = (ox / outer) * sx
                ny = (oy / outer) * sy
            } else if (qx > qy) {
                nx = sx
                ny = 0
            } else if (qy > qx) {
                nx = 0
                ny = sy
            } else {
                nx = sx * Math.SQRT1_2
                ny = sy * Math.SQRT1_2
            }

            const u = inward / bezel
            const magnitude = Math.pow(1 - u, 2.2) * smooth(0, rampEnd, u)
            f[i] = Math.round(127.5 - 127.5 * nx * magnitude)
            f[i + 1] = Math.round(127.5 - 127.5 * ny * magnitude)
            f[i + 2] = 128

            const facing = nx * lightX + ny * lightY
            const bright = Math.pow(Math.max(0, facing), 1.6)
            const dark = Math.pow(Math.max(0, -facing), 1.5)
            const narrow = Math.exp(-Math.pow((u - 0.1) / 0.14, 2))
            const soft = Math.exp(-Math.pow((u - 0.32) / 0.3, 2))
            const coverage = clamp01(inward / footprint + 0.5)
            const signed = (0.85 * bright * narrow - 0.16 * dark * soft) * Math.pow(1 - u, 1.1)
            const tone = signed >= 0 ? 255 : 0
            l[i] = tone
            l[i + 1] = tone
            l[i + 2] = tone
            l[i + 3] = Math.round(255 * Math.min(1, Math.abs(signed)) * coverage)
        }
    }

    context.putImageData(fieldData, 0, 0)
    const field = canvas.toDataURL("image/png")
    context.putImageData(lightData, 0, 0)
    const light = canvas.toDataURL("image/png")
    canvas.width = 1
    canvas.height = 1
    return { field, light, width: w, height: h }
}

const styles = `
.lgf{position:relative;box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.lgf *,.lgf *::before,.lgf *::after{box-sizing:border-box}
.lgf *{-webkit-user-select:none;user-select:none}
.lgf a,.lgf img{-webkit-user-drag:none}
.lgf-stage{position:relative;display:grid;width:100%;height:100%}
.lgf-card{position:relative;display:grid;grid-template:minmax(0,1fr)/minmax(0,1fr);width:100%;height:100%;border-radius:var(--lgf-radius);color:var(--lgf-text);transform-origin:50% 50%;-webkit-tap-highlight-color:transparent;touch-action:pan-y;outline:none}
.lgf[data-axis=vertical] .lgf-card{touch-action:pan-x}
.lgf[data-live=true][data-trigger=click] .lgf-card{cursor:pointer}
.lgf[data-live=true][data-dragging=true] .lgf-card{cursor:grabbing}
.lgf-body{position:absolute;inset:0;border-radius:inherit;pointer-events:none}
.lgf[data-shadow=soft] .lgf-body,.lgf[data-shadow=prism] .lgf-body{box-shadow:0 1px 2px rgba(0,0,0,.12),0 18px 34px -20px rgba(0,0,0,.42),0 46px 76px -46px rgba(0,0,0,.46)}
.lgf-surface{position:absolute;inset:0;overflow:hidden;border-radius:inherit;background:linear-gradient(150deg,rgba(255,255,255,.22),rgba(255,255,255,.05) 46%,rgba(255,255,255,.13))}
.lgf[data-surface=dark] .lgf-surface{background:linear-gradient(155deg,rgba(255,255,255,.13),rgba(255,255,255,.025) 48%,rgba(255,255,255,.075))}
.lgf-layer{position:absolute;inset:0;border-radius:inherit;pointer-events:none}
.lgf-tint{background:var(--lgf-tint);opacity:var(--lgf-tint-alpha)}
.lgf-shoulder{box-shadow:inset 0 1px 1px rgba(255,255,255,.78),inset 0 -1px 1px rgba(255,255,255,.3),inset 1px 0 1px rgba(255,255,255,.34),inset -1px 0 1px rgba(255,255,255,.2),inset 0 26px 40px -34px rgba(255,255,255,.62),inset 0 -30px 44px -36px rgba(0,0,0,.28)}
.lgf[data-surface=dark] .lgf-shoulder{box-shadow:inset 0 1px 1px rgba(255,255,255,.58),inset 0 -1px 1px rgba(255,255,255,.2),inset 1px 0 1px rgba(255,255,255,.24),inset -1px 0 1px rgba(255,255,255,.12),inset 0 26px 40px -34px rgba(255,255,255,.42),inset 0 -30px 44px -36px rgba(0,0,0,.46)}
.lgf-lightmap{position:absolute;inset:0;width:100%;height:100%;opacity:.92;pointer-events:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none}
.lgf-band{position:absolute;top:-35%;bottom:-35%;left:-60%;width:220%;pointer-events:none;background:linear-gradient(104deg,rgba(255,255,255,0) 36%,rgba(255,255,255,.05) 41%,rgba(255,255,255,.3) 46.5%,rgba(255,255,255,.56) 48.6%,rgba(255,255,255,.16) 52%,rgba(255,255,255,0) 58%)}
.lgf-fresnel{background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,255,255,.2) 52%,rgba(255,255,255,.4))}
.lgf-rim{position:absolute;inset:0;border-radius:inherit;padding:1.25px;pointer-events:none;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude}
.lgf-face{grid-area:1/1;position:relative;display:flex;flex-direction:column;min-width:0;min-height:0;padding:var(--lgf-padding);border-radius:inherit}
.lgf-face[data-active=false]{pointer-events:none}
a.lgf-face{color:inherit;text-decoration:none;outline:none;-webkit-user-drag:none}
.lgf[data-live=true] a.lgf-face{cursor:pointer}
a.lgf-face:focus-visible{outline:2px solid var(--lgf-focus);outline-offset:4px}
.lgf[data-reduced=true] .lgf-face{transition:opacity .32s ease}
.lgf-top{display:flex;align-items:center;min-width:0;min-height:40px;padding-right:52px}
.lgf-main{display:flex;flex-direction:column;align-items:flex-start;gap:12px;min-width:0;margin-top:auto;padding-top:28px}
.lgf-eyebrow{display:inline-flex;align-items:center;max-width:100%;height:28px;padding:0 12px;overflow:hidden;border-radius:999px;font-size:12px;line-height:1;font-weight:500;letter-spacing:.01em;white-space:nowrap;text-overflow:ellipsis;color:var(--lgf-soft);background:var(--lgf-chip);box-shadow:inset 0 1px 0 var(--lgf-chip-hi),inset 0 -1px 0 var(--lgf-chip-lo)}
.lgf-title{margin:0;max-width:100%;white-space:pre-line;overflow-wrap:break-word;text-wrap:balance;color:var(--lgf-text);text-shadow:var(--lgf-text-shadow)}
.lgf-text{margin:0;max-width:100%;white-space:pre-line;overflow-wrap:break-word;text-wrap:pretty;color:var(--lgf-soft);text-shadow:var(--lgf-text-shadow)}
.lgf-cta-line{display:flex;max-width:100%}
.lgf-cta{position:relative;display:inline-flex;align-items:center;gap:10px;max-width:100%;height:44px;margin:4px 0 0;padding:0 16px 0 20px;border:0;border-radius:999px;font:inherit;font-weight:500;line-height:1;letter-spacing:-.005em;white-space:nowrap;color:var(--lgf-text);text-decoration:none;background:var(--lgf-chip);box-shadow:inset 0 1px 0 var(--lgf-chip-hi),inset 0 -1px 0 var(--lgf-chip-lo),0 10px 22px -12px rgba(0,0,0,.45);-webkit-tap-highlight-color:transparent;transition:background-color .25s ease}
.lgf-cta-label{overflow:hidden;text-overflow:ellipsis}
.lgf-cta[data-kind=link],.lgf-cta[data-kind=button]{cursor:pointer}
.lgf-cta[data-kind=none],.lgf-cta[data-kind=card]{cursor:inherit}
.lgf-cta:focus-visible{outline:2px solid var(--lgf-focus);outline-offset:3px}
.lgf-cta-icon{display:block;flex-shrink:0;width:16px;height:16px;transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.lgf-flip{position:absolute;z-index:2;top:var(--lgf-pt);right:var(--lgf-pr);display:grid;place-items:center;width:40px;height:40px;margin:0;padding:0;border:0;border-radius:999px;font:inherit;color:var(--lgf-text);background:var(--lgf-chip);box-shadow:inset 0 1px 0 var(--lgf-chip-hi),inset 0 -1px 0 var(--lgf-chip-lo),0 6px 16px -8px rgba(0,0,0,.4);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:background-color .25s ease,opacity .25s ease}
.lgf-flip svg{display:block;width:18px;height:18px;pointer-events:none}
.lgf-flip:focus-visible{outline:2px solid var(--lgf-focus);outline-offset:3px}
.lgf[data-flip-button=false] .lgf-flip{opacity:0}
.lgf[data-flip-button=false] .lgf-flip:focus-visible{opacity:1}
.lgf[data-live=false] .lgf-flip{cursor:default}
@media (hover:hover) and (pointer:fine){.lgf[data-live=true] .lgf-flip:hover,.lgf-cta[data-kind=link]:hover,.lgf-cta[data-kind=button]:hover,.lgf[data-live=true] a.lgf-face:hover .lgf-cta{background:var(--lgf-chip-hover)}.lgf-cta[data-kind=link]:hover .lgf-cta-icon,.lgf-cta[data-kind=button]:hover .lgf-cta-icon,.lgf[data-live=true] a.lgf-face:hover .lgf-cta-icon{transform:translateX(3px)}}
.lgf-slot{position:relative;display:flex;flex:1;min-width:0;min-height:0}
.lgf-slot>*{flex:1;min-width:0;min-height:0}
.lgf-deco{position:absolute;left:50%;top:50%;pointer-events:none;-webkit-user-select:none;user-select:none}
.lgf[data-live=true] .lgf-deco{will-change:transform,opacity}
.lgf-edge{opacity:0;border-radius:999px;overflow:hidden;-webkit-mask:linear-gradient(180deg,transparent,#000 14%,#000 86%,transparent);mask:linear-gradient(180deg,transparent,#000 14%,#000 86%,transparent);background:linear-gradient(90deg,rgba(255,255,255,.62),rgba(255,255,255,.14) 30%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.2) 70%,rgba(255,255,255,.7))}
.lgf-edge-spectrum{position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,70,130,0),rgba(255,122,84,.92) 17%,rgba(255,232,128,.92) 33%,#fff 50%,rgba(96,222,255,.92) 67%,rgba(142,112,255,.92) 83%,rgba(170,92,255,0))}
.lgf[data-axis=vertical] .lgf-edge{-webkit-mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);background:linear-gradient(180deg,rgba(255,255,255,.62),rgba(255,255,255,.14) 30%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.2) 70%,rgba(255,255,255,.7))}
.lgf[data-axis=vertical] .lgf-edge-spectrum{background:linear-gradient(180deg,rgba(255,70,130,0),rgba(255,122,84,.92) 17%,rgba(255,232,128,.92) 33%,#fff 50%,rgba(96,222,255,.92) 67%,rgba(142,112,255,.92) 83%,rgba(170,92,255,0))}
.lgf-flare{opacity:0;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(120,200,255,.22) 28%,rgba(255,255,255,.8) 50%,rgba(255,150,200,.22) 72%,rgba(255,255,255,0));-webkit-mask:linear-gradient(180deg,transparent,#000 22%,#000 78%,transparent);mask:linear-gradient(180deg,transparent,#000 22%,#000 78%,transparent)}
.lgf[data-axis=vertical] .lgf-flare{background:linear-gradient(180deg,rgba(255,255,255,0),rgba(120,200,255,.22) 28%,rgba(255,255,255,.8) 50%,rgba(255,150,200,.22) 72%,rgba(255,255,255,0));-webkit-mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)}
.lgf-ground{top:100%}
.lgf-shadow{background:radial-gradient(closest-side,rgba(0,0,0,.36),rgba(0,0,0,.14) 55%,rgba(0,0,0,0))}
.lgf-caustic{background:linear-gradient(90deg,rgba(255,80,120,0) 4%,rgba(255,110,90,.75) 20%,rgba(255,214,102,.8) 36%,rgba(120,240,170,.75) 52%,rgba(80,200,255,.8) 68%,rgba(150,110,255,.75) 84%,rgba(190,90,255,0) 96%);-webkit-mask:radial-gradient(closest-side,#000 0%,rgba(0,0,0,.55) 45%,transparent 100%);mask:radial-gradient(closest-side,#000 0%,rgba(0,0,0,.55) 45%,transparent 100%)}
@media (prefers-reduced-transparency:reduce){.lgf .lgf-surface{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:#e4e6eb!important}.lgf[data-surface=dark] .lgf-surface{background:#2a2c33!important}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.lgf .lgf-surface{background:#e4e6eb}.lgf[data-surface=dark] .lgf-surface{background:#2a2c33}}
@media (forced-colors:active){.lgf-card{border:2px solid CanvasText}.lgf-body,.lgf-deco{display:none}.lgf-flip,.lgf-cta{border:1px solid ButtonText}}
`

type Reveal = { opacity: MotionValue<number>; y: MotionValue<number> }

function useReveal(presence: MotionValue<number>, index: number, staged: boolean): Reveal {
    const opacity = useTransform(presence, (p) => (staged ? smooth(0, 1, (p - 0.18 - 0.12 * index) / 0.46) : 1))
    const y = useTransform(opacity, (o) => (staged ? (1 - o) * 10 : 0))
    return { opacity, y }
}

function SlotFill({ node }: { node: React.ReactNode }) {
    const child = React.Children.toArray(node)[0]
    if (!React.isValidElement(child)) return null
    const element = child as React.ReactElement<{ style?: React.CSSProperties }>
    return React.cloneElement(element, {
        style: { ...(element.props.style || {}), width: "100%", height: "100%" },
    })
}

const FlipIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M19.5 10.5A7.6 7.6 0 0 0 6.1 6.6L4.5 8.2" />
        <path d="M4.5 3.9v4.3h4.3" />
        <path d="M4.5 13.5a7.6 7.6 0 0 0 13.4 3.9l1.6-1.6" />
        <path d="M19.5 20.1v-4.3h-4.3" />
    </svg>
)

const ArrowIcon = () => (
    <svg className="lgf-cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
)

const STATIC_RIM =
    "conic-gradient(from 205deg at 50% 50%, rgba(255,255,255,.95) 0deg, rgba(255,255,255,.42) 34deg, rgba(255,255,255,.05) 70deg, rgba(0,0,0,.14) 115deg, rgba(255,255,255,.1) 160deg, rgba(255,255,255,.92) 192deg, rgba(255,255,255,.55) 220deg, rgba(255,255,255,.05) 258deg, rgba(0,0,0,.08) 300deg, rgba(255,255,255,.12) 336deg, rgba(255,255,255,.95) 360deg)"
const STATIC_SPECTRUM = "conic-gradient(from 253deg at 50% 50%, #ff5f6d, #ffc371, #f4f86f, #58e8a2, #47c7ff, #8a7dff, #ff6fd8, #ff5f6d)"

/**
 * Canvas, thumbnails and export: a plain, static card on its start side. No motion values, springs,
 * observers, timers, canvas work or SVG filters — only markup and CSS (frosted glass via a plain blur).
 */
function StaticFlipCard(props: LiquidGlassFlipCardProps) {
    const {
        frontEyebrow = "01 — Vision",
        frontTitle = "Crafted\nwith light",
        frontText = "",
        frontLayer,
        backEyebrow = "01 — Vision",
        backTitle = "",
        backText = "Every edge bends the scene behind it. Every turn sends a band of light across the glass.",
        buttonLabel = "Learn more",
        backLayer,
        startSide = "front",
        trigger = "hover",
        axis = "horizontal",
        flipButton = true,
        surface = "light",
        material = "clear",
        tint = "#FFFFFF",
        textColor,
        titleFont = {},
        bodyFont = {},
        radius = "32px",
        padding = "28px",
        optics = {},
        shadow = "prism",
        focusColor = "#8FB4FF",
        style,
    } = props

    const dark = surface === "dark"
    const blur = clamp(num(optics.blur, 8), 0, 40) + (material === "frosted" ? 10 : 0)
    const dispersion = clamp01(num(optics.dispersion, 55) / 100)
    const tintAlpha = material === "tinted" ? 0.3 : material === "frosted" ? 0.16 : dark ? 0.04 : 0.06
    const radiusCSS = typeof radius === "number" ? `${Math.max(0, radius)}px` : String(radius || "32px")
    const paddingCSS = typeof padding === "number" ? `${Math.max(0, padding)}px` : String(padding || "28px")
    const [padTop, padRight] = boxSides(paddingCSS, "28px")
    const rootStyle = {
        width: "100%",
        height: "100%",
        ...style,
        "--lgf-radius": radiusCSS,
        "--lgf-padding": paddingCSS,
        "--lgf-pt": padTop,
        "--lgf-pr": padRight,
        "--lgf-text": textColor || (dark ? "#FFFFFF" : "#15171C"),
        "--lgf-soft": textColor ? `color-mix(in srgb, ${textColor} 72%, transparent)` : dark ? "rgba(255,255,255,.74)" : "rgba(21,23,28,.66)",
        "--lgf-chip": dark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.36)",
        "--lgf-chip-hover": dark ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.54)",
        "--lgf-chip-hi": dark ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.88)",
        "--lgf-chip-lo": dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.28)",
        "--lgf-text-shadow": dark ? "0 1px 2px rgba(0,0,0,.28)" : "0 1px 1px rgba(255,255,255,.35)",
        "--lgf-tint": tint,
        "--lgf-tint-alpha": tintAlpha,
        "--lgf-focus": focusColor,
    } as React.CSSProperties
    const surfaceFilter = `blur(${blur}px) saturate(1.45) brightness(1.02)`
    const titleStyle: React.CSSProperties = { fontSize: 34, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.05, ...titleFont }
    const bodyStyle: React.CSSProperties = { fontSize: 15, fontWeight: 400, letterSpacing: "-0.005em", lineHeight: 1.5, ...bodyFont }

    const back = startSide === "back"
    const eyebrow = (back ? backEyebrow : frontEyebrow)?.trim() || ""
    const title = back ? backTitle : frontTitle
    const text = back ? backText : frontText
    const layer = back ? backLayer : frontLayer
    const label = buttonLabel?.trim() || ""
    const cardLabel = (frontTitle || "").split("\n").join(" ").trim() || "Flip card"

    return (
        <div
            className="lgf"
            style={rootStyle}
            role="group"
            aria-roledescription="flip card"
            aria-label={cardLabel}
            data-axis={axis}
            data-surface={surface}
            data-shadow={shadow}
            data-trigger={trigger}
            data-live={false}
            data-static={true}
            data-flip-button={flipButton}
        >
            <style>{styles}</style>
            <div className="lgf-stage">
                {shadow !== "none" ? (
                    <div className="lgf-deco lgf-ground lgf-shadow" aria-hidden="true" style={{ width: "78%", height: 44, transform: "translateX(-50%)" }} />
                ) : null}
                <div className="lgf-card">
                    <div className="lgf-body" aria-hidden="true">
                        <div className="lgf-surface" style={{ backdropFilter: surfaceFilter, WebkitBackdropFilter: surfaceFilter }}>
                            <div className="lgf-layer lgf-tint" />
                            <div className="lgf-layer lgf-shoulder" />
                        </div>
                        <div className="lgf-rim" style={{ background: STATIC_RIM }} />
                        {dispersion > 0 ? <div className="lgf-rim" style={{ background: STATIC_SPECTRUM, opacity: dispersion * 0.084 }} /> : null}
                    </div>
                    <div className="lgf-flip" aria-hidden="true">
                        <span style={{ display: "grid" }}>
                            <FlipIcon />
                        </span>
                    </div>
                    <div className="lgf-face" data-active="true">
                        {React.Children.count(layer) > 0 ? (
                            <div className="lgf-slot">
                                <SlotFill node={layer} />
                            </div>
                        ) : (
                            <>
                                <div className="lgf-top" style={{ fontFamily: bodyStyle.fontFamily }}>
                                    {eyebrow ? <span className="lgf-eyebrow">{eyebrow}</span> : null}
                                </div>
                                <div className="lgf-main">
                                    {title?.trim() ? (
                                        <p className="lgf-title" style={titleStyle}>
                                            {title}
                                        </p>
                                    ) : null}
                                    {text?.trim() ? (
                                        <p className="lgf-text" style={bodyStyle}>
                                            {text}
                                        </p>
                                    ) : null}
                                    {back && label ? (
                                        <div className="lgf-cta-line" style={bodyStyle}>
                                            <span className="lgf-cta" data-kind="none">
                                                <span className="lgf-cta-label">{label}</span>
                                                <ArrowIcon />
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 460
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function LiquidGlassFlipCard(props: LiquidGlassFlipCardProps) {
    // Static renderer check: on the canvas, in thumbnails and in exports the card is a plain static
    // element. Animations, springs, observers and the SVG refraction only run in Preview / on the site.
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticFlipCard {...props} />
    return <LiquidGlassFlipCardLive {...props} />
}

function LiquidGlassFlipCardLive(props: LiquidGlassFlipCardProps) {
    const {
        frontEyebrow = "01 — Vision",
        frontTitle = "Crafted\nwith light",
        frontText = "",
        frontLayer,
        backEyebrow = "01 — Vision",
        backTitle = "",
        backText = "Every edge bends the scene behind it. Every turn sends a band of light across the glass.",
        buttonLabel = "Learn more",
        link = "",
        newTab = false,
        linkArea = "card",
        backLayer,
        startSide = "front",
        trigger = "hover",
        drag = true,
        axis = "horizontal",
        flipTransition = DEFAULT_TRANSITION,
        liquidity = 45,
        tilt = 60,
        flipButton = true,
        surface = "light",
        material = "clear",
        tint = "#FFFFFF",
        textColor,
        titleFont = {},
        bodyFont = {},
        radius = "32px",
        padding = "28px",
        optics = {},
        shadow = "prism",
        onFlip,
        onButtonTap,
        focusColor = "#8FB4FF",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const reduced = !!prefersReduced
    const live = !isStatic
    const vertical = axis === "vertical"
    const hoverMode = trigger === "hover"
    // Mouse drag only in Click mode; touch can always swipe (hover does not exist there).
    const dragAllowed = (pointerType: string) => live && drag && (!hoverMode || pointerType !== "mouse")
    const trimmedLink = typeof link === "string" ? link.trim() : ""
    // In Hover mode the whole card can be the link: hover turns it, a click opens the destination.
    const cardLink = !!trimmedLink && hoverMode && linkArea !== "button"

    const blur = clamp(num(optics.blur, 8), 0, 40) + (material === "frosted" ? 10 : 0)
    const depth = clamp(num(optics.depth, 30), 6, 60)
    const refraction = clamp01(num(optics.refraction, 80) / 100)
    const dispersion = clamp01(num(optics.dispersion, 55) / 100)
    const light = clamp01(num(optics.light, 80) / 100)
    const tiltMax = 9 * clamp01(num(tilt, 60) / 100)
    const gel = clamp01(num(liquidity, 45) / 100)
    const thickness = clamp(Math.round(depth * 0.4), 6, 20)
    const transition = (flipTransition as Transition) || DEFAULT_TRANSITION

    const radiusCSS = typeof radius === "number" ? `${Math.max(0, radius)}px` : String(radius || "32px")
    const paddingCSS = typeof padding === "number" ? `${Math.max(0, padding)}px` : String(padding || "28px")
    const [padTop, padRight] = boxSides(paddingCSS, "28px")

    // ── Flip state ────────────────────────────────────────────────────────────
    const startTurn = startSide === "back" ? 180 : 0
    const turn = useMotionValue(startTurn)
    const homeRef = React.useRef(startTurn)
    const targetRef = React.useRef(startTurn)
    const animationRef = React.useRef<{ stop: () => void } | null>(null)
    const [side, setSide] = React.useState<Side>(startSide)
    const sideRef = React.useRef<Side>(startSide)
    const [dragging, setDragging] = React.useState(false)

    React.useEffect(() => {
        animationRef.current?.stop()
        turn.jump(startTurn)
        homeRef.current = startTurn
        targetRef.current = startTurn
        sideRef.current = startSide
        setSide(startSide)
    }, [startTurn])

    React.useEffect(() => () => animationRef.current?.stop(), [])

    useMotionValueEvent(turn, "change", (value) => {
        const next = sideOf(value)
        if (next !== sideRef.current) {
            sideRef.current = next
            setSide(next)
        }
    })

    const settle = React.useCallback((target: number) => {
        // Keep the accumulated angle small without a visible change.
        if (Math.abs(target) >= 3600) {
            const wrapped = target % 360
            turn.jump(wrapped)
            targetRef.current = wrapped
            homeRef.current = ((homeRef.current % 360) + 360) % 360
        }
    }, [])

    const runTo = React.useCallback(
        (target: number, velocity?: number) => {
            animationRef.current?.stop()
            if (!live || reduced) {
                turn.jump(target)
                settle(target)
                return
            }
            const options = { ...(transition as object) } as Transition & { velocity?: number }
            if (typeof velocity === "number" && Number.isFinite(velocity)) options.velocity = velocity
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            animationRef.current = animate(turn, target, { ...options, onComplete: () => settle(target) } as any)
        },
        [live, reduced, transition, settle]
    )

    const flip = React.useCallback(
        (direction: 1 | -1) => {
            const next = targetRef.current + 180 * direction
            targetRef.current = next
            runTo(next)
            onFlip?.()
        },
        [runTo, onFlip]
    )

    // ── Geometry ──────────────────────────────────────────────────────────────
    const stageRef = React.useRef<HTMLDivElement | null>(null)
    const cardRef = React.useRef<HTMLDivElement | null>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })
    const span = vertical ? size.h : size.w
    const perspective = clamp((span || 360) * 3.1, 900, 2600)
    const geometry = React.useRef({ w: 360, h: 460, perspective: 1100 })
    geometry.current = { w: size.w || 360, h: size.h || 460, perspective }

    React.useEffect(() => {
        const element = cardRef.current
        if (!element) return
        let frame = 0
        const measure = () => {
            const w = element.offsetWidth
            const h = element.offsetHeight
            if (!w || !h) return
            setSize((previous) => (previous.w === w && previous.h === h ? previous : { w, h }))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(measure)
        })
        observer.observe(element)
        return () => {
            observer.disconnect()
            cancelAnimationFrame(frame)
        }
    }, [])

    // ── Optics (Chromium: real refraction through an SVG backdrop filter) ─────
    const [refractionSupported, setRefractionSupported] = React.useState(false)
    const [maps, setMaps] = React.useState<GlassMaps | null>(null)
    const [cornerRadius, setCornerRadius] = React.useState(32)
    const rawId = React.useId()
    const filterId = `lgf-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`

    React.useEffect(() => {
        setRefractionSupported(supportsBackdropRefraction())
    }, [])

    React.useEffect(() => {
        const element = cardRef.current
        if (!element || !size.w || !size.h) return
        const computed = window.getComputedStyle(element)
        const values = [
            computed.borderTopLeftRadius,
            computed.borderTopRightRadius,
            computed.borderBottomRightRadius,
            computed.borderBottomLeftRadius,
        ]
        if (values.some((value) => value.includes("%") || value.trim().includes(" "))) {
            setMaps(null)
            return
        }
        const corners = values.map((value) => Math.max(0, parseFloat(value) || 0)) as [number, number, number, number]
        setCornerRadius(Math.min(Math.max(...corners), size.w / 2, size.h / 2))
        const timer = window.setTimeout(() => {
            try {
                setMaps(makeGlassMaps(size.w, size.h, corners, depth))
            } catch {
                setMaps(null)
            }
        }, 60)
        return () => window.clearTimeout(timer)
    }, [size.w, size.h, radiusCSS, depth])

    const refractionOn = !!maps && refractionSupported && refraction > 0
    const baseScale = 2 * depth * 0.92 * refraction
    const displacementRefs = [
        React.useRef<SVGFEDisplacementMapElement | null>(null),
        React.useRef<SVGFEDisplacementMapElement | null>(null),
        React.useRef<SVGFEDisplacementMapElement | null>(null),
    ]
    const scaleFor = (edge: number) => {
        const main = baseScale * (1 + 1.25 * edge)
        const spread = dispersion * 0.22 * (0.35 + 0.65 * edge)
        return [main, main * (1 + spread), main * (1 + 2 * spread)]
    }

    // ── Motion graph ──────────────────────────────────────────────────────────
    const half = useTransform(turn, halfTurn)
    const edge = useTransform(turn, edgeOf)
    const velocity = useVelocity(turn)
    const squashTarget = useTransform(velocity, (v) => clamp(Math.abs(v) / 1100, 0, 1))
    const squash = useSpring(squashTarget, { stiffness: 320, damping: 15, mass: 0.7 })
    const press = useSpring(0, { stiffness: 520, damping: 34, mass: 0.6 })
    const rawX = useMotionValue(0)
    const rawY = useMotionValue(0)
    const px = useSpring(rawX, { stiffness: 190, damping: 24, mass: 0.6 })
    const py = useSpring(rawY, { stiffness: 190, damping: 24, mass: 0.6 })
    const engage = useSpring(0, { stiffness: 150, damping: 22, mass: 0.7 })

    useMotionValueEvent(edge, "change", (value) => {
        if (!refractionOn) return
        const scales = scaleFor(value)
        displacementRefs.forEach((ref, index) => ref.current?.setAttribute("scale", scales[index].toFixed(2)))
    })

    const cardTransform = useTransform(
        [half, edge, px, py, engage, squash, press] as MotionValue<number>[],
        ([d, e, x, y, h, q, p]: number[]) => {
            const face = 1 - e
            const tx = -y * h * tiltMax * face
            const ty = x * h * tiltMax * face
            const lift = h * face * 10
            const along = 1 + 0.05 * gel * q - 0.012 * p
            const across = 1 - 0.022 * gel * q - 0.012 * p
            // Perspective lives in the transform itself (not on the parent): Firefox only keeps the
            // backdrop blur of a 3D-turned element that way.
            const depth = `perspective(${geometry.current.perspective.toFixed(1)}px)`
            return vertical
                ? `${depth} translateZ(${lift.toFixed(2)}px) rotateX(${(-d + tx).toFixed(3)}deg) rotateY(${ty.toFixed(3)}deg) scale(${along.toFixed(4)}, ${across.toFixed(4)})`
                : `${depth} translateZ(${lift.toFixed(2)}px) rotateX(${tx.toFixed(3)}deg) rotateY(${(d + ty).toFixed(3)}deg) scale(${across.toFixed(4)}, ${along.toFixed(4)})`
        }
    )

    // The glass edge, drawn in screen space at the projected leading edge of the slab.
    const edgeTransform = useTransform([half, squash] as MotionValue<number>[], ([d, q]: number[]) => {
        const { w, h, perspective: p } = geometry.current
        const s = Math.abs(Math.sin(d * RAD))
        const c = Math.cos(d * RAD)
        const extent = vertical ? h : w
        const k = p / Math.max(1, p - (extent / 2) * s)
        const offset = -Math.sign(d) * (extent / 2) * c * k
        const along = (1 + 0.05 * gel * q) * k
        const width = Math.max(0.001, s * k)
        return vertical
            ? `translate3d(0px, ${offset.toFixed(2)}px, 0px) scale(${along.toFixed(4)}, ${width.toFixed(4)})`
            : `translate3d(${offset.toFixed(2)}px, 0px, 0px) scale(${width.toFixed(4)}, ${along.toFixed(4)})`
    })
    const flareTransform = useTransform([half, squash] as MotionValue<number>[], ([d, q]: number[]) => {
        const { w, h, perspective: p } = geometry.current
        const s = Math.abs(Math.sin(d * RAD))
        const c = Math.cos(d * RAD)
        const extent = vertical ? h : w
        const k = p / Math.max(1, p - (extent / 2) * s)
        const offset = -Math.sign(d) * (extent / 2) * c * k
        const along = (1 + 0.05 * gel * q) * k
        return vertical
            ? `translate3d(0px, ${offset.toFixed(2)}px, 0px) scale(${along.toFixed(4)}, 1)`
            : `translate3d(${offset.toFixed(2)}px, 0px, 0px) scale(1, ${along.toFixed(4)})`
    })
    // The slab's side only shows up close to edge-on, where it reads as the glass edge, never as a bar.
    const edgeOpacity = useTransform(edge, (e) => smooth(0.8, 0.97, e))
    const spectrumOpacity = useTransform(edge, (e) => (0.25 + 0.75 * dispersion) * smooth(0.9, 0.995, e))
    const flareOpacity = useTransform(edge, (e) => Math.min(1, light * 1.15) * smooth(0.92, 0.997, e))
    // Thickness while turning: light gathers inside the glass along the leading edge.
    const leadingEdgeLight = useTransform(half, (d) => {
        const a = smooth(0.12, 0.8, Math.abs(Math.sin(d * RAD))) * light
        if (a < 0.003) return "none"
        const direction = vertical ? (d > 0 ? "to bottom" : "to top") : d > 0 ? "to right" : "to left"
        return `linear-gradient(${direction}, rgba(255,255,255,${(0.5 * a).toFixed(3)}) 0px, rgba(255,255,255,${(0.2 * a).toFixed(3)}) 3px, rgba(255,255,255,${(0.07 * a).toFixed(3)}) 14px, rgba(255,255,255,0) 40px)`
    })

    const groundTransform = useTransform(half, (d) => {
        const c = Math.abs(Math.cos(d * RAD))
        return vertical ? `translateX(-50%) scale(1, ${(0.55 + 0.45 * c).toFixed(4)})` : `translateX(-50%) scale(${(0.28 + 0.72 * c).toFixed(4)}, 1)`
    })
    // The prism light stays on the ground under the turned card: centred on the projected bottom
    // edge, so it follows the card through the whole turn instead of drifting out to one side.
    const causticTransform = useTransform(half, (d) => {
        const { w, perspective: p } = geometry.current
        const s = Math.sin(d * RAD)
        const c = Math.abs(Math.cos(d * RAD))
        let shift = 0
        if (!vertical) {
            const right = 1 / Math.max(0.05, 1 + ((w / 2) * s) / p)
            const left = 1 / Math.max(0.05, 1 - ((w / 2) * s) / p)
            shift = ((w / 2) * c * (right - left)) / 2
        }
        return `translate(calc(-50% + ${shift.toFixed(2)}px), 0px) scale(${(0.55 + 0.45 * c).toFixed(4)}, 1)`
    })
    const shadowOpacity = useTransform(edge, (e) => 0.6 + 0.4 * (1 - e))
    // One smooth pulse per flip, strongest while the edge faces the viewer. It stays dark while the
    // card lands, so the gel overshoot does not make the light blink again.
    const causticOpacity = useTransform(edge, (e) => light * dispersion * 0.9 * smooth(0.2, 0.95, e))

    // Follows the full turn (2° per degree = one full circle per flip), so the rim light never jumps at 90°.
    const lightAngle = useTransform([turn, px, engage] as MotionValue<number>[], ([t, x, h]: number[]) => 205 + t * 2 + x * h * 22)
    const rimBackground = useMotionTemplate`conic-gradient(from ${lightAngle}deg at 50% 50%, rgba(255,255,255,.95) 0deg, rgba(255,255,255,.42) 34deg, rgba(255,255,255,.05) 70deg, rgba(0,0,0,.14) 115deg, rgba(255,255,255,.1) 160deg, rgba(255,255,255,.92) 192deg, rgba(255,255,255,.55) 220deg, rgba(255,255,255,.05) 258deg, rgba(0,0,0,.08) 300deg, rgba(255,255,255,.12) 336deg, rgba(255,255,255,.95) 360deg)`
    const spectrumAngle = useTransform(lightAngle, (a) => a + 48)
    const spectrumBackground = useMotionTemplate`conic-gradient(from ${spectrumAngle}deg at 50% 50%, #ff5f6d, #ffc371, #f4f86f, #58e8a2, #47c7ff, #8a7dff, #ff6fd8, #ff5f6d)`
    const rimSpectrumOpacity = useTransform(edge, (e) => dispersion * (0.12 + 0.88 * Math.pow(e, 0.8)) * 0.7)

    // A fixed key light: its reflection sweeps across each face once per half-turn.
    const bandX = useTransform([half, px, engage] as MotionValue<number>[], ([d, x, h]: number[]) => {
        const sweep = d === 0 ? -1.4 : clamp((d - 45 * Math.sign(d)) / 34, -1.4, 1.4)
        return `${(sweep * 46 + x * h * 5).toFixed(3)}%`
    })
    const bandOpacity = useTransform([edge, engage] as MotionValue<number>[], ([e, h]: number[]) => light * (0.12 * h + 0.85 * smooth(0.05, 0.45, e)))
    const fresnelOpacity = useTransform(edge, (e) => light * 0.5 * Math.pow(e, 2.4))

    const lightX = useTransform(px, (x) => 50 + x * 42)
    const lightY = useTransform(py, (y) => 50 + y * 40)
    const pointerLight = useMotionTemplate`radial-gradient(ellipse 62% 46% at ${lightX}% ${lightY}%, rgba(255,255,255,.22), rgba(255,255,255,.07) 42%, rgba(255,255,255,0) 74%)`
    const pointerOpacity = useTransform([engage, edge] as MotionValue<number>[], ([h, e]: number[]) => h * (1 - e) * light)

    const rippleX = useMotionValue(50)
    const rippleY = useMotionValue(50)
    const ripple = useMotionValue(1)
    const rippleInner = useTransform(ripple, (r) => 6 + r * 40)
    const rippleOuter = useTransform(ripple, (r) => 18 + r * 95)
    const rippleBackground = useMotionTemplate`radial-gradient(circle at ${rippleX}% ${rippleY}%, rgba(255,255,255,.46) 0%, rgba(255,255,255,.16) ${rippleInner}%, rgba(255,255,255,0) ${rippleOuter}%)`
    const rippleOpacity = useTransform(ripple, (r) => light * Math.pow(1 - r, 1.3))

    const iconRotate = useTransform(turn, (t) => t)

    const staged = live && !reduced
    const frontPresence = useTransform(turn, (t) => (sideOf(t) === "front" ? 1 - edgeOf(t) : 0))
    const backPresence = useTransform(turn, (t) => (sideOf(t) === "back" ? 1 - edgeOf(t) : 0))
    const front = [useReveal(frontPresence, 0, staged), useReveal(frontPresence, 1, staged), useReveal(frontPresence, 2, staged), useReveal(frontPresence, 3, staged)]
    const back = [useReveal(backPresence, 0, staged), useReveal(backPresence, 1, staged), useReveal(backPresence, 2, staged), useReveal(backPresence, 3, staged)]

    // ── Pointer & drag ────────────────────────────────────────────────────────
    const pointer = React.useRef<{
        id: number
        x: number
        y: number
        start: number
        active: boolean
        moved: boolean
        rect: DOMRect
        type: string
    } | null>(null)

    const stageRect = () => stageRef.current?.getBoundingClientRect() ?? null
    const trackPointer = (clientX: number, clientY: number, rect: DOMRect) => {
        rawX.set(clamp(((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1, -1, 1))
        rawY.set(clamp(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1, -1, 1))
    }
    const pushDirection = (clientX: number, clientY: number, rect: DOMRect): 1 | -1 =>
        vertical ? (clientY >= rect.top + rect.height / 2 ? 1 : -1) : clientX >= rect.left + rect.width / 2 ? 1 : -1

    // The face itself may be the card link; everything else that is interactive keeps its own click.
    const isInteractiveTarget = (target: EventTarget | null) =>
        target instanceof Element && !!target.closest("a:not(.lgf-face),button,input,textarea,select,[data-lgf-interactive]")

    // A drag or a reveal tap must not also open the card link.
    const suppressClickUntil = React.useRef(0)
    const suppressNextClick = () => {
        suppressClickUntil.current = performance.now() + 450
    }
    const onFaceClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (performance.now() < suppressClickUntil.current) {
            suppressClickUntil.current = 0
            event.preventDefault()
        }
    }

    // Hover mode: pointer in → turn to the other side, pointer out → turn back the way it came.
    // A short intent delay keeps the card calm when the cursor only passes over it.
    const hoverTimer = React.useRef<number | undefined>(undefined)
    const hoverDirection = React.useRef<1 | -1>(1)
    const hovering = React.useRef(false)
    React.useEffect(() => () => window.clearTimeout(hoverTimer.current), [])

    const onPointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!live || event.pointerType !== "mouse") return
        const rect = stageRect()
        if (!rect) return
        trackPointer(event.clientX, event.clientY, rect)
        if (!reduced) engage.set(1)
        if (!hoverMode) return
        hovering.current = true
        const direction = -pushDirection(event.clientX, event.clientY, rect) as 1 | -1
        window.clearTimeout(hoverTimer.current)
        hoverTimer.current = window.setTimeout(() => {
            if (!hovering.current || sideOf(targetRef.current) !== startSide) return
            hoverDirection.current = direction
            const next = targetRef.current + 180 * direction
            targetRef.current = next
            runTo(next)
            onFlip?.()
        }, 70)
    }

    const onPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!live || event.pointerType !== "mouse") return
        engage.set(0)
        // Released outside the card: forget the press so the glass does not stay pushed in.
        if (pointer.current && !pointer.current.active) {
            pointer.current = null
            press.set(0)
        }
        if (!hoverMode) return
        hovering.current = false
        window.clearTimeout(hoverTimer.current)
        if (sideOf(targetRef.current) === startSide) return
        const next = targetRef.current - 180 * hoverDirection.current
        targetRef.current = next
        runTo(next)
        onFlip?.()
    }

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!live || event.button !== 0 || isInteractiveTarget(event.target)) return
        const rect = stageRect()
        if (!rect) return
        suppressClickUntil.current = 0
        pointer.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            start: turn.get(),
            active: false,
            moved: false,
            rect,
            type: event.pointerType,
        }
        if (!reduced) {
            press.set(1)
            rippleX.set(clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100))
            rippleY.set(clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100))
            ripple.jump(0)
            animate(ripple, 1, { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] })
        }
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!live) return
        const state = pointer.current
        if (event.pointerType === "mouse" && !(state && state.active)) {
            const rect = stageRect()
            if (rect) trackPointer(event.clientX, event.clientY, rect)
        }
        if (!state || state.id !== event.pointerId) return
        const dx = event.clientX - state.x
        const dy = event.clientY - state.y
        const along = vertical ? dy : dx
        const across = vertical ? dx : dy
        if (!state.active) {
            // A pointer that travelled is a gesture, not a click.
            if (!state.moved && dx * dx + dy * dy > 100) state.moved = true
            if (!dragAllowed(state.type) || Math.abs(along) < 8 || Math.abs(along) < Math.abs(across) * 1.2) return
            state.active = true
            animationRef.current?.stop()
            state.start = turn.get()
            state.x = event.clientX
            state.y = event.clientY
            setDragging(true)
            engage.set(0)
            press.set(0)
            try {
                event.currentTarget.setPointerCapture(event.pointerId)
            } catch {}
            return
        }
        const extent = vertical ? state.rect.height : state.rect.width
        const delta = vertical ? event.clientY - state.y : event.clientX - state.x
        turn.set(state.start + (delta / Math.max(120, extent * 0.9)) * 180)
    }

    const finishDrag = (cancelled: boolean) => {
        suppressNextClick()
        const base = targetRef.current
        const current = turn.get()
        const speed = turn.getVelocity()
        const projected = cancelled ? current : current + speed * 0.16
        const next = clamp(Math.round(projected / 180) * 180, base - 180, base + 180)
        targetRef.current = next
        runTo(next, speed)
        if (next !== base) onFlip?.()
    }

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointer.current
        if (!state || state.id !== event.pointerId) return
        pointer.current = null
        press.set(0)
        if (state.active) {
            setDragging(false)
            finishDrag(false)
            return
        }
        if (state.moved) {
            suppressNextClick()
            return
        }
        if (cardLink) {
            // Mouse: the click opens the link right away. Touch has no hover, so the first tap
            // reveals the other side and the next tap opens the link.
            if (state.type !== "mouse" && sideOf(targetRef.current) === startSide) {
                suppressNextClick()
                flip(pushDirection(event.clientX, event.clientY, state.rect))
            }
            return
        }
        if (!hoverMode || state.type !== "mouse") flip(pushDirection(event.clientX, event.clientY, state.rect))
    }

    const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointer.current
        if (!state || state.id !== event.pointerId) return
        pointer.current = null
        press.set(0)
        if (state.active) {
            setDragging(false)
            finishDrag(true)
        }
    }

    // Hidden faces leave the accessibility tree and the tab order.
    const frontRef = React.useRef<HTMLElement | null>(null)
    const backRef = React.useRef<HTMLElement | null>(null)
    const setFrontRef = React.useCallback((element: HTMLElement | null) => {
        frontRef.current = element
    }, [])
    const setBackRef = React.useCallback((element: HTMLElement | null) => {
        backRef.current = element
    }, [])
    React.useEffect(() => {
        frontRef.current?.toggleAttribute("inert", side !== "front")
        backRef.current?.toggleAttribute("inert", side !== "back")
    }, [side, cardLink])

    // ── Render ────────────────────────────────────────────────────────────────
    const dark = surface === "dark"
    const tintAlpha = material === "tinted" ? 0.3 : material === "frosted" ? 0.16 : dark ? 0.04 : 0.06
    const rootStyle = {
        width: "100%",
        height: "100%",
        ...style,
        "--lgf-radius": radiusCSS,
        "--lgf-padding": paddingCSS,
        "--lgf-pt": padTop,
        "--lgf-pr": padRight,
        "--lgf-text": textColor || (dark ? "#FFFFFF" : "#15171C"),
        "--lgf-soft": textColor ? `color-mix(in srgb, ${textColor} 72%, transparent)` : dark ? "rgba(255,255,255,.74)" : "rgba(21,23,28,.66)",
        "--lgf-chip": dark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.36)",
        "--lgf-chip-hover": dark ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.54)",
        "--lgf-chip-hi": dark ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.88)",
        "--lgf-chip-lo": dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.28)",
        "--lgf-text-shadow": dark ? "0 1px 2px rgba(0,0,0,.28)" : "0 1px 1px rgba(255,255,255,.35)",
        "--lgf-tint": tint,
        "--lgf-tint-alpha": tintAlpha,
        "--lgf-focus": focusColor,
    } as React.CSSProperties

    const surfaceFilter = refractionOn ? `blur(${blur}px) url(#${filterId}) saturate(1.45) brightness(1.02)` : `blur(${blur}px) saturate(1.45) brightness(1.02)`
    const initialScales = scaleFor(edge.get())
    const titleStyle: React.CSSProperties = { fontSize: 34, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.05, ...titleFont }
    const bodyStyle: React.CSSProperties = { fontSize: 15, fontWeight: 400, letterSpacing: "-0.005em", lineHeight: 1.5, ...bodyFont }
    const eyebrowStyle: React.CSSProperties = { fontFamily: bodyStyle.fontFamily }

    const ctaKind: "card" | "link" | "button" | "none" = cardLink ? "card" : trimmedLink ? "link" : typeof onButtonTap === "function" ? "button" : "none"
    const label = buttonLabel?.trim() || ""
    const ctaContent = (
        <>
            <span className="lgf-cta-label">{label}</span>
            <ArrowIcon />
        </>
    )
    let cta: React.ReactNode = null
    if (label) {
        if (ctaKind === "link") {
            cta = (
                <a className="lgf-cta" data-kind="link" href={trimmedLink} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} draggable={false}>
                    {ctaContent}
                </a>
            )
        } else if (ctaKind === "button") {
            cta = (
                <button className="lgf-cta" data-kind="button" type="button" onClick={() => onButtonTap?.()}>
                    {ctaContent}
                </button>
            )
        } else {
            // "card": the whole face is the link, the button is its visual cue.
            cta = (
                <span className="lgf-cta" data-kind={ctaKind}>
                    {ctaContent}
                </span>
            )
        }
    }

    const hasFrontLayer = React.Children.count(frontLayer) > 0
    const hasBackLayer = React.Children.count(backLayer) > 0
    const faceOpacity = (target: Side) => (staged ? 1 : side === target ? 1 : 0)
    const cardLabel = (frontTitle || "").split("\n").join(" ").trim() || "Flip card"
    const causticVisible = shadow === "prism"
    // Only the straight part of the slab's side is drawn; the rounded corners stay inside the silhouette.
    const edgeSpan = Math.max(0, (vertical ? size.w || 360 : size.h || 460) - 2 * cornerRadius)
    const shadowVisible = shadow !== "none"

    // Each face is a plain block, or — with a card link — the link itself (no nested interactive elements).
    const renderFace = (target: Side, children: React.ReactNode) => {
        const shared = {
            ref: target === "front" ? setFrontRef : setBackRef,
            className: "lgf-face",
            "data-active": side === target,
            "aria-hidden": side !== target,
            style: { opacity: faceOpacity(target) },
        }
        if (!cardLink) return <div {...shared}>{children}</div>
        return (
            <a
                {...shared}
                data-link="true"
                href={trimmedLink}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                draggable={false}
                onClick={onFaceClick}
            >
                {children}
            </a>
        )
    }

    return (
        <div
            className="lgf"
            style={rootStyle}
            role="group"
            aria-roledescription="flip card"
            aria-label={cardLabel}
            data-axis={axis}
            data-surface={surface}
            data-shadow={shadow}
            data-trigger={trigger}
            data-live={live}
            data-reduced={reduced}
            data-dragging={dragging}
            data-flip-button={flipButton}
        >
            <style>{styles}</style>
            {refractionOn && maps ? (
                <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
                    <defs>
                        <filter id={filterId} x="0" y="0" width={maps.width} height={maps.height} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feImage href={maps.field} x="0" y="0" width={maps.width} height={maps.height} preserveAspectRatio="none" result="field" />
                            {dispersion > 0 ? (
                                <>
                                    <feDisplacementMap ref={displacementRefs[0]} in="SourceGraphic" in2="field" scale={initialScales[0]} xChannelSelector="R" yChannelSelector="G" result="bentR" />
                                    <feColorMatrix in="bentR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
                                    <feDisplacementMap ref={displacementRefs[1]} in="SourceGraphic" in2="field" scale={initialScales[1]} xChannelSelector="R" yChannelSelector="G" result="bentG" />
                                    <feColorMatrix in="bentG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
                                    <feDisplacementMap ref={displacementRefs[2]} in="SourceGraphic" in2="field" scale={initialScales[2]} xChannelSelector="R" yChannelSelector="G" result="bentB" />
                                    <feColorMatrix in="bentB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
                                    <feComposite in="red" in2="green" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="redGreen" />
                                    <feComposite in="redGreen" in2="blue" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                                </>
                            ) : (
                                <feDisplacementMap ref={displacementRefs[0]} in="SourceGraphic" in2="field" scale={initialScales[0]} xChannelSelector="R" yChannelSelector="G" />
                            )}
                        </filter>
                    </defs>
                </svg>
            ) : null}

            <div
                ref={stageRef}
                className="lgf-stage"
                onPointerEnter={onPointerEnter}
                onPointerLeave={onPointerLeave}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                {shadowVisible ? (
                    <motion.div
                        className="lgf-deco lgf-ground lgf-shadow"
                        aria-hidden="true"
                        style={{ width: "78%", height: 44, marginTop: 0, transform: live ? groundTransform : "translateX(-50%)", opacity: live ? shadowOpacity : 1 }}
                    />
                ) : null}
                {causticVisible ? (
                    <motion.div
                        className="lgf-deco lgf-ground lgf-caustic"
                        aria-hidden="true"
                        style={{ width: "64%", height: 30, marginTop: 10, transform: live ? causticTransform : "translate(-50%, 0px)", opacity: live ? causticOpacity : 0 }}
                    />
                ) : null}

                <motion.div
                    ref={cardRef}
                    className="lgf-card"
                    style={{ transform: cardTransform, willChange: live ? "transform" : undefined }}
                >
                    <div className="lgf-body" aria-hidden="true">
                        <div className="lgf-surface" style={{ backdropFilter: surfaceFilter, WebkitBackdropFilter: surfaceFilter }}>
                            <div className="lgf-layer lgf-tint" />
                            <div className="lgf-layer lgf-shoulder" />
                            {maps ? <img className="lgf-lightmap" src={maps.light} alt="" draggable={false} /> : null}
                            <motion.div className="lgf-band" style={{ x: bandX, opacity: bandOpacity }} />
                            <motion.div className="lgf-layer lgf-fresnel" style={{ opacity: fresnelOpacity }} />
                            {live ? <motion.div className="lgf-layer" style={{ background: leadingEdgeLight }} /> : null}
                            <motion.div className="lgf-layer" style={{ background: pointerLight, opacity: pointerOpacity }} />
                            <motion.div className="lgf-layer" style={{ background: rippleBackground, opacity: rippleOpacity }} />
                        </div>
                        <motion.div className="lgf-rim" style={{ background: rimBackground }} />
                        {dispersion > 0 ? <motion.div className="lgf-rim" style={{ background: spectrumBackground, opacity: rimSpectrumOpacity }} /> : null}
                    </div>

                    <button
                        type="button"
                        className="lgf-flip"
                        aria-label={side === "front" ? "Show back" : "Show front"}
                        tabIndex={live ? 0 : -1}
                        onClick={(event) => {
                            event.stopPropagation()
                            if (live) flip(1)
                        }}
                    >
                        <motion.span style={{ display: "grid", rotate: live && !reduced ? iconRotate : 0 }}>
                            <FlipIcon />
                        </motion.span>
                    </button>

                    {renderFace("front", hasFrontLayer ? (
                            <div className="lgf-slot">
                                <SlotFill node={frontLayer} />
                            </div>
                        ) : (
                            <>
                                <motion.div className="lgf-top" style={{ ...eyebrowStyle, opacity: front[0].opacity, y: front[0].y }}>
                                    {frontEyebrow?.trim() ? <span className="lgf-eyebrow">{frontEyebrow}</span> : null}
                                </motion.div>
                                <div className="lgf-main">
                                    {frontTitle?.trim() ? (
                                        <motion.p className="lgf-title" style={{ ...titleStyle, opacity: front[1].opacity, y: front[1].y }}>
                                            {frontTitle}
                                        </motion.p>
                                    ) : null}
                                    {frontText?.trim() ? (
                                        <motion.p className="lgf-text" style={{ ...bodyStyle, opacity: front[2].opacity, y: front[2].y }}>
                                            {frontText}
                                        </motion.p>
                                    ) : null}
                                </div>
                            </>
                        ))}

                    {renderFace("back", hasBackLayer ? (
                            <div className="lgf-slot">
                                <SlotFill node={backLayer} />
                            </div>
                        ) : (
                            <>
                                <motion.div className="lgf-top" style={{ ...eyebrowStyle, opacity: back[0].opacity, y: back[0].y }}>
                                    {backEyebrow?.trim() ? <span className="lgf-eyebrow">{backEyebrow}</span> : null}
                                </motion.div>
                                <div className="lgf-main">
                                    {backTitle?.trim() ? (
                                        <motion.p className="lgf-title" style={{ ...titleStyle, opacity: back[1].opacity, y: back[1].y }}>
                                            {backTitle}
                                        </motion.p>
                                    ) : null}
                                    {backText?.trim() ? (
                                        <motion.p className="lgf-text" style={{ ...bodyStyle, opacity: back[2].opacity, y: back[2].y }}>
                                            {backText}
                                        </motion.p>
                                    ) : null}
                                    {cta ? (
                                        <motion.div className="lgf-cta-line" style={{ ...bodyStyle, opacity: back[3].opacity, y: back[3].y }}>
                                            {cta}
                                        </motion.div>
                                    ) : null}
                                </div>
                            </>
                        ))}

                </motion.div>

                <motion.div
                    className="lgf-deco lgf-edge"
                    aria-hidden="true"
                    style={{
                        width: vertical ? edgeSpan : thickness,
                        height: vertical ? thickness : edgeSpan,
                        marginLeft: -(vertical ? edgeSpan : thickness) / 2,
                        marginTop: -(vertical ? thickness : edgeSpan) / 2,
                        transform: edgeTransform,
                        opacity: live ? edgeOpacity : 0,
                    }}
                >
                    <motion.div className="lgf-edge-spectrum" style={{ opacity: spectrumOpacity }} />
                </motion.div>
                <motion.div
                    className="lgf-deco lgf-flare"
                    aria-hidden="true"
                    style={{
                        width: vertical ? edgeSpan : 88,
                        height: vertical ? 88 : edgeSpan,
                        marginLeft: -(vertical ? edgeSpan : 88) / 2,
                        marginTop: -(vertical ? 88 : edgeSpan) / 2,
                        transform: flareTransform,
                        opacity: live ? flareOpacity : 0,
                    }}
                />
            </div>
        </div>
    )
}

LiquidGlassFlipCard.displayName = "Liquid Glass Flip Card"

addPropertyControls(LiquidGlassFlipCard, {
    frontEyebrow: { type: ControlType.String, title: "Front Label", defaultValue: "01 — Vision" },
    frontTitle: { type: ControlType.String, title: "Front Title", defaultValue: "Crafted\nwith light", displayTextArea: true },
    frontText: { type: ControlType.String, title: "Front Text", defaultValue: "", displayTextArea: true, placeholder: "Optional" },
    frontLayer: { type: ControlType.Slot, title: "Front Layer", maxCount: 1, description: "Optional. Connect a layer to replace the built-in front content." },
    backEyebrow: { type: ControlType.String, title: "Back Label", defaultValue: "01 — Vision" },
    backTitle: { type: ControlType.String, title: "Back Title", defaultValue: "", displayTextArea: true, placeholder: "Optional" },
    backText: {
        type: ControlType.String,
        title: "Back Text",
        defaultValue: "Every edge bends the scene behind it. Every turn sends a band of light across the glass.",
        displayTextArea: true,
    },
    buttonLabel: { type: ControlType.String, title: "Button", defaultValue: "Learn more", placeholder: "Hidden when empty" },
    link: { type: ControlType.Link, title: "Destination", defaultValue: "" },
    newTab: { type: ControlType.Boolean, title: "Open in New Tab", defaultValue: false },
    linkArea: {
        type: ControlType.Enum,
        title: "Link On",
        options: ["card", "button"],
        optionTitles: ["Whole Card", "Button"],
        defaultValue: "card",
        displaySegmentedControl: true,
        description: "Whole Card: hover turns it, a click opens the link. On touch the first tap turns it.",
        hidden: (props: LiquidGlassFlipCardProps) => !(typeof props.link === "string" && props.link.trim()) || props.trigger === "click",
    },
    backLayer: { type: ControlType.Slot, title: "Back Layer", maxCount: 1, description: "Optional. Connect a layer to replace the built-in back content." },
    startSide: { type: ControlType.Enum, title: "Start Side", options: ["front", "back"], optionTitles: ["Front", "Back"], defaultValue: "front", displaySegmentedControl: true },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        defaultValue: "hover",
        displaySegmentedControl: true,
        description: "Hover turns the card while the pointer is on it. Touch devices flip on tap. The flip button always works.",
    },
    drag: { type: ControlType.Boolean, title: "Drag to Flip", defaultValue: true, description: "Swipe on touch devices. In Click mode also drag with the mouse." },
    axis: { type: ControlType.Enum, title: "Axis", options: ["horizontal", "vertical"], optionTitles: ["Horizontal", "Vertical"], defaultValue: "horizontal", displaySegmentedControl: true },
    flipTransition: { type: ControlType.Transition, title: "Transition", defaultValue: DEFAULT_TRANSITION },
    liquidity: { type: ControlType.Number, title: "Liquidity", min: 0, max: 100, step: 1, unit: "%", defaultValue: 45, description: "Gel-like stretch while turning and on landing." },
    tilt: { type: ControlType.Number, title: "Hover Tilt", min: 0, max: 100, step: 1, unit: "%", defaultValue: 60 },
    flipButton: { type: ControlType.Boolean, title: "Flip Button", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide", description: "When hidden it still appears on keyboard focus." },
    surface: { type: ControlType.Enum, title: "Surface", options: ["light", "dark"], optionTitles: ["On Light", "On Dark"], defaultValue: "light", displaySegmentedControl: true, description: "Match the background behind the card." },
    material: { type: ControlType.Enum, title: "Material", options: ["clear", "frosted", "tinted"], optionTitles: ["Clear", "Frosted", "Tinted"], defaultValue: "clear" },
    tint: { type: ControlType.Color, title: "Glass Tint", defaultValue: "#FFFFFF" },
    textColor: { type: ControlType.Color, title: "Text Color", optional: true },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "34px", variant: "Medium", letterSpacing: "-0.035em", lineHeight: "1.05em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Regular", letterSpacing: "-0.005em", lineHeight: "1.5em" },
    },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "32px" },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "28px" },
    optics: {
        type: ControlType.Object,
        title: "Optics",
        icon: "effect",
        controls: {
            blur: { type: ControlType.Number, title: "Frost", min: 0, max: 40, step: 0.5, unit: "px", defaultValue: 8, description: "Frosted material adds 10 px." },
            depth: { type: ControlType.Number, title: "Glass Depth", min: 6, max: 60, step: 1, unit: "px", defaultValue: 30 },
            refraction: { type: ControlType.Number, title: "Refraction", min: 0, max: 100, step: 1, unit: "%", defaultValue: 80, description: "Real edge refraction in Chromium browsers. Safari and Firefox use the polished glass fallback." },
            dispersion: { type: ControlType.Number, title: "Prism", min: 0, max: 100, step: 1, unit: "%", defaultValue: 55, description: "Spectral fringes on the rim and edge while turning." },
            light: { type: ControlType.Number, title: "Light", min: 0, max: 100, step: 1, unit: "%", defaultValue: 80 },
        },
        defaultValue: { blur: 8, depth: 30, refraction: 80, dispersion: 55, light: 80 },
    },
    shadow: { type: ControlType.Enum, title: "Shadow", options: ["prism", "soft", "none"], optionTitles: ["Soft + Prism Light", "Soft", "None"], defaultValue: "prism", description: "Prism Light casts a faint spectrum below the card while it turns." },
    onFlip: { type: ControlType.EventHandler, title: "On Flip" },
    onButtonTap: { type: ControlType.EventHandler, title: "On Button Tap" },
    focusColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#8FB4FF",
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
