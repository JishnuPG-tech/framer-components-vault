import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { animate, cubicBezier, motion, useMotionValue, useReducedMotion, useScroll, useSpring } from "framer-motion"
import type { MotionValue } from "framer-motion"
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
 * Product X-Ray — Exploded Reality
 * Layered-image exploded view: parts separate, rotate and return on hover, focus, tap and scroll.
 * Layers are CSS 3D transforms (2.5D), not real 3D geometry.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 540
 * @framerDisableUnlink
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const EASES: Record<string, [number, number, number, number]> = {
    smooth: [0.65, 0, 0.35, 1],
    out: [0.16, 1, 0.3, 1],
    inOut: [0.76, 0, 0.24, 1],
    soft: [0.4, 0, 0.2, 1],
    overshoot: [0.34, 1.4, 0.64, 1],
    linear: [0, 0, 1, 1],
}
const LINEAR = (t: number) => t

const RATIOS: Record<string, number> = {
    "4:3": 4 / 3, "1:1": 1, "3:2": 3 / 2, "16:9": 16 / 9, "3:4": 3 / 4, "4:5": 4 / 5, "16:10": 16 / 10,
}

type ImageSource = { src?: string; srcSet?: string; alt?: string }
type Stoppable = { stop: () => void }

type Layer = {
    name?: string
    image?: ImageSource
    alt?: string
    x?: number
    y?: number
    rotate?: number
    scale?: number
    opacity?: number
    offsetX?: number
    offsetY?: number
    depth?: number
    rotateX?: number
    rotateY?: number
    rotateZ?: number
    explodedScale?: number
    explodedOpacity?: number
    delay?: number
    label?: string
    labelSide?: "right" | "left"
    labelX?: number
    labelY?: number
    art?: string
    imageUrl?: string
}

// A layer after defaults are applied (what the renderer reads).
type ResolvedLayer = {
    name: string; image?: ImageSource; alt?: string; art?: string
    x: number; y: number; rotate: number; scale: number; opacity: number
    offsetX: number; offsetY: number; depth: number
    rotateX: number; rotateY: number; rotateZ: number
    explodedScale: number; explodedOpacity: number; startAt: number
    label?: string; labelSide: "right" | "left"; labelX: number; labelY: number
}

type LayerCtx = {
    ease: (t: number) => number; maxDelay: number; width: number; decorative: boolean
    move: number; rot: number; lift: number; dim: number; key: string; precise: boolean
}

type OpaqueBox = { x: number; y: number; w: number; h: number; nw: number; nh: number }

// ---------- built-in sample products (inline SVG, so the component works with no assets) ----------

const A = "var(--xr-accent)"

const ART: Record<string, React.ReactNode> = {
    phoneBack: (
        <>
            <rect x="360" y="95" width="280" height="560" rx="46" fill="#17181c" stroke="#2c2e35" strokeWidth="2" />
            <rect x="388" y="122" width="82" height="82" rx="24" fill="#0f1013" stroke="#2c2e35" strokeWidth="2" />
            <circle cx="415" cy="149" r="14" fill="#08090b" stroke={A} strokeWidth="2" opacity="0.85" />
            <circle cx="445" cy="177" r="14" fill="#08090b" stroke="#3a3d46" strokeWidth="2" />
            <circle cx="500" cy="375" r="22" fill="none" stroke="#2c2e35" strokeWidth="2" />
        </>
    ),
    phoneBattery: (
        <>
            <rect x="384" y="196" width="232" height="340" rx="26" fill="#23252b" stroke="#3a3d46" strokeWidth="2" />
            <rect x="404" y="220" width="192" height="292" rx="16" fill="none" stroke="#3a3d46" strokeWidth="2" />
            <path d="M404 318H596M404 416H596" stroke="#3a3d46" strokeWidth="2" />
            <rect x="470" y="188" width="60" height="16" rx="5" fill={A} opacity="0.9" />
        </>
    ),
    phoneBoard: (
        <>
            <rect x="378" y="118" width="244" height="300" rx="22" fill="#1b2a2a" stroke="#34504d" strokeWidth="2" />
            <path d="M400 150H470V200H560M400 250H520V330M440 380H590" fill="none" stroke="#34504d" strokeWidth="3" strokeLinecap="round" />
            <rect x="410" y="168" width="64" height="64" rx="8" fill="#0d1414" stroke={A} strokeWidth="2" />
            <rect x="520" y="156" width="70" height="40" rx="6" fill="#0d1414" stroke="#34504d" strokeWidth="2" />
            <rect x="500" y="260" width="56" height="56" rx="8" fill="#0d1414" stroke="#34504d" strokeWidth="2" />
            <circle cx="420" cy="350" r="9" fill="#34504d" />
            <circle cx="460" cy="350" r="9" fill="#34504d" />
        </>
    ),
    phoneDisplay: (
        <>
            <defs>
                <linearGradient id="xrScreen" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#1a1d27" />
                    <stop offset="1" stopColor="#07080b" />
                </linearGradient>
            </defs>
            <rect x="368" y="104" width="264" height="548" rx="40" fill="url(#xrScreen)" stroke="#2c2e35" strokeWidth="2" />
            <rect x="394" y="168" width="212" height="112" rx="20" fill={A} opacity="0.9" />
            <rect x="394" y="298" width="100" height="90" rx="16" fill="#232632" />
            <rect x="506" y="298" width="100" height="90" rx="16" fill="#232632" />
            <rect x="394" y="406" width="212" height="14" rx="7" fill="#232632" />
            <rect x="394" y="434" width="150" height="14" rx="7" fill="#232632" />
            <rect x="394" y="462" width="180" height="14" rx="7" fill="#232632" />
        </>
    ),
    phoneGlass: (
        <>
            <rect x="360" y="95" width="280" height="560" rx="46" fill="rgba(140,150,175,0.14)" stroke="rgba(150,160,185,0.8)" strokeWidth="2" />
            <rect x="454" y="116" width="92" height="26" rx="13" fill="#050506" />
            <path d="M360 330L560 95H600L360 380Z" fill="rgba(255,255,255,0.08)" />
        </>
    ),
    hpBand: (
        <>
            <path d="M286 430C286 200 360 92 500 92C640 92 714 200 714 430" fill="none" stroke="#2b2e35" strokeWidth="40" strokeLinecap="round" />
            <path d="M322 360C328 220 392 138 500 138C608 138 672 220 678 360" fill="none" stroke={A} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        </>
    ),
    hpCupL: <rect x="196" y="320" width="150" height="260" rx="62" fill="#343740" stroke="#4a4e59" strokeWidth="2" />,
    hpCushL: <rect x="338" y="352" width="46" height="196" rx="22" fill="#17181b" stroke="#2c2e35" strokeWidth="2" />,
    hpCupR: <rect x="654" y="320" width="150" height="260" rx="62" fill="#343740" stroke="#4a4e59" strokeWidth="2" />,
    hpCushR: <rect x="616" y="352" width="46" height="196" rx="22" fill="#17181b" stroke="#2c2e35" strokeWidth="2" />,
    hpDriverL: (
        <>
            <circle cx="271" cy="450" r="44" fill="#0e0f12" stroke={A} strokeWidth="3" />
            <circle cx="271" cy="450" r="16" fill={A} opacity="0.9" />
        </>
    ),
    hpDriverR: (
        <>
            <circle cx="729" cy="450" r="44" fill="#0e0f12" stroke={A} strokeWidth="3" />
            <circle cx="729" cy="450" r="16" fill={A} opacity="0.9" />
        </>
    ),
}

const PRESETS: Record<string, { layers: Layer[]; tilt0: number[]; tilt1: number[] }> = {
    phone: {
        tilt0: [0, 0, 0],
        tilt1: [52, 0, -36],
        layers: [
            { name: "Back glass", offsetX: -10, offsetY: 12, art: "phoneBack", depth: 0, label: "Back glass", labelX: 64, labelY: 70 },
            { name: "Battery", offsetX: -10, offsetY: 12, art: "phoneBattery", depth: 8, label: "Battery", labelX: 62, labelY: 60 },
            { name: "Logic board", offsetX: -10, offsetY: 12, art: "phoneBoard", depth: 16, label: "Logic board", labelSide: "left", labelX: 37, labelY: 42 },
            { name: "Display", offsetX: -10, offsetY: 12, art: "phoneDisplay", depth: 24, label: "Display", labelX: 64, labelY: 50 },
            { name: "Cover glass", offsetX: -10, offsetY: 12, art: "phoneGlass", depth: 32, label: "Cover glass", labelX: 64, labelY: 40 },
        ],
    },
    phonePhoto: {
        tilt0: [0, 0, 0],
        tilt1: [50, 0, -34],
        layers: [
            { name: "Back glass", imageUrl: "https://framerusercontent.com/images/zUOwTJQZzumzEL7sWPilRvWwa6Q.webp", depth: 0, offsetY: 27, offsetX: -9, label: "Back glass", labelSide: "right", labelX: 63, labelY: 82 },
            { name: "Camera", imageUrl: "https://framerusercontent.com/images/sTS6DjYTRoVXcWBrs6xr7DGRDsM.webp", depth: 5, offsetY: 27, offsetX: -33, label: "Camera", labelSide: "left", labelX: 50, labelY: 50 },
            { name: "Side buttons", imageUrl: "https://framerusercontent.com/images/Qk2QtYyXec526Tz1qQ3SvOQI7Y.webp", depth: 10, offsetY: 27, offsetX: 22, label: "Side buttons", labelSide: "right", labelX: 62, labelY: 50 },
            { name: "Mid frame", imageUrl: "https://framerusercontent.com/images/qUkNexSDhD2aa8T47FgRIHqBo.webp", depth: 15, offsetY: 27, offsetX: -9, label: "Mid frame", labelSide: "right", labelX: 63, labelY: 72 },
            { name: "Battery", imageUrl: "https://framerusercontent.com/images/W53OPcPvfpeXFIxyPotKnlhKH0.webp", depth: 20, offsetY: 27, offsetX: -9, label: "Battery", labelSide: "right", labelX: 63, labelY: 63 },
            { name: "Logic board", imageUrl: "https://framerusercontent.com/images/y3zEDC1iGHKV8rAUt3wnOZVQEQ.webp", depth: 25, offsetY: 27, offsetX: -9, label: "Logic board", labelSide: "left", labelX: 40, labelY: 55 },
            { name: "Display frame", imageUrl: "https://framerusercontent.com/images/w4AQDwtc9uJB3xq6t1pIuniJI.webp", depth: 30, offsetY: 27, offsetX: -9, label: "Display frame", labelSide: "right", labelX: 63, labelY: 47 },
            { name: "Display", imageUrl: "https://framerusercontent.com/images/nLoCQmr6NWuXaQKT7oRmrr2KQKs.webp", depth: 35, offsetY: 27, offsetX: -9, label: "Display", labelSide: "right", labelX: 63, labelY: 39 },
            { name: "Cover glass", imageUrl: "https://framerusercontent.com/images/3fQpqfkqEqomAk5ccpNBaqWVzc.webp", depth: 40, offsetY: 27, offsetX: -9, label: "Cover glass", labelSide: "right", labelX: 63, labelY: 31 },
        ],
    },
    headphones: {
        tilt0: [0, 0, 0],
        tilt1: [4, -14, 0],
        layers: [
            { name: "Headband", art: "hpBand", offsetY: -9, depth: 10, label: "Headband", labelX: 62, labelY: 22 },
            { name: "Left cup", art: "hpCupL", offsetX: -11, label: "Earcup", labelSide: "left", labelX: 20, labelY: 48 },
            { name: "Left cushion", art: "hpCushL", offsetX: -5, depth: 12, label: "Cushion", labelSide: "left", labelX: 35, labelY: 68 },
            { name: "Right cup", art: "hpCupR", offsetX: 11, label: "Earcup", labelX: 80, labelY: 48 },
            { name: "Right cushion", art: "hpCushR", offsetX: 5, depth: 12 },
            { name: "Left driver", art: "hpDriverL", offsetX: -11, depth: 16 },
            { name: "Right driver", art: "hpDriverR", offsetX: 11, depth: 16, label: "Driver", labelX: 74, labelY: 62 },
        ],
    },
}

// ---------- hooks ----------

// A motion value that recomputes from `source` without re-rendering React on every tick.
function useDerived<T>(source: MotionValue<number>, fn: (p: number) => T, key: string) {
    const fnRef = useRef(fn)
    fnRef.current = fn
    const mv = useMotionValue<T>(fn(source.get()))
    const seeded = useRef(false)
    if (!seeded.current) {
        mv.set(fn(source.get()))
        seeded.current = true
    }
    useEffect(() => {
        const update = () => mv.set(fnRef.current(source.get()))
        update()
        return source.on("change", update)
    }, [source, key])
    return mv
}

// Finds where the opaque part of an image sits, so hovering the empty corners of a full-canvas PNG does not count.
// The scan runs once per image URL (shared by every instance), off the main task, and is skipped on low-power devices.
const boxCache = new Map<string, OpaqueBox | null>()
const boxPending = new Map<string, Promise<OpaqueBox | null>>()

function lowPower(): boolean {
    if (typeof navigator === "undefined") return true
    const n = navigator as Navigator & { deviceMemory?: number }
    return (n.hardwareConcurrency ?? 8) <= 2 || (n.deviceMemory ?? 8) <= 2
}

function scanOpaque(src: string): Promise<OpaqueBox | null> {
    const hit = boxPending.get(src)
    if (hit) return hit
    const p = new Promise<OpaqueBox | null>((resolve) => {
        const im = new Image()
        im.crossOrigin = "anonymous"
        im.onerror = () => resolve(null)
        im.onload = () => {
            const run = () => {
                try {
                    const w = 96, h = Math.max(1, Math.round((w * im.naturalHeight) / im.naturalWidth))
                    const c = document.createElement("canvas")
                    c.width = w; c.height = h
                    const g = c.getContext("2d")
                    if (!g) return resolve(null)
                    g.drawImage(im, 0, 0, w, h)
                    const d = g.getImageData(0, 0, w, h).data
                    let x0 = w, y0 = h, x1 = -1, y1 = -1
                    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
                    resolve(x1 >= 0 ? { x: x0 / w, y: y0 / h, w: (x1 + 1 - x0) / w, h: (y1 + 1 - y0) / h, nw: im.naturalWidth, nh: im.naturalHeight } : null)
                } catch (_) { resolve(null) } // image host without CORS: no precise hover area
            }
            const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
            if (ric) ric(run)
            else setTimeout(run, 0)
        }
        im.src = src
    }).then((b) => { boxCache.set(src, b); boxPending.delete(src); return b })
    boxPending.set(src, p)
    return p
}

function useOpaqueBox(src: string | undefined, on: boolean): OpaqueBox | null {
    const [b, setB] = useState<OpaqueBox | null>(() => (src ? boxCache.get(src) ?? null : null))
    useEffect(() => {
        if (!src || !on || lowPower()) { setB(null); return }
        if (boxCache.has(src)) { setB(boxCache.get(src) ?? null); return }
        let dead = false
        scanOpaque(src).then((r) => { if (!dead) setB(r) })
        return () => { dead = true }
    }, [src, on])
    return b
}

// ---------- layer ----------

type XRayLayerProps = {
    layer: ResolvedLayer; index: number; final: MotionValue<number>; ctx: LayerCtx; objectFit: "cover" | "contain"
    shadow: number; showNames: boolean; accent: string; setAnchor: (idx: number, el: HTMLElement | null) => void
    hot: number; onHot: (i: number) => void; stageW: number; stageH: number; fxOn: boolean
}

function XRayLayer({ layer, index, final, ctx, objectFit, shadow, showNames, accent, setAnchor, hot, onHot, stageW, stageH, fxOn }: XRayLayerProps) {
    const key = [
        layer.x, layer.y, layer.offsetX, layer.offsetY, layer.depth, layer.scale, layer.explodedScale,
        layer.rotate, layer.rotateX, layer.rotateY, layer.rotateZ, layer.opacity, layer.explodedOpacity, layer.startAt, ctx.key,
    ].join("|")
    const active = hot === index
    const dimmed = hot >= 0 && hot !== index
    const hv = useMotionValue(0)
    const dv = useMotionValue(0)
    useEffect(() => {
        const a = animate(hv, active ? 1 : 0, { duration: 0.28, ease: "easeOut" })
        const b = animate(dv, dimmed ? 1 : 0, { duration: 0.28, ease: "easeOut" })
        return () => { a.stop(); b.stop() }
    }, [active, dimmed, hv, dv])
    const hoverT = useDerived(hv, (v) => `translateZ(${v * ctx.lift * (ctx.width / 100)}px) scale(${1 + v * ctx.lift * 0.004})`, String(ctx.lift) + ctx.width)
    const hoverO = useDerived(dv, (v) => 1 - v * ctx.dim, String(ctx.dim))
    const over = fxOn ? { onPointerOver: (e: React.PointerEvent) => { if (e.pointerType !== "touch") onHot(index) }, onPointerOut: () => onHot(-1) } : {}
    const [failedSrc, setFailed] = useState<string | undefined>(undefined)
    const box = useOpaqueBox(layer.image?.src, fxOn && ctx.precise && failedSrc !== layer.image?.src)
    const transform = useDerived(
        final,
        (p) => {
            const e = layerEase(p, layer, ctx)
            const m = ctx.move
            const x = lerp(layer.x, layer.x + layer.offsetX * m, e)
            const y = lerp(layer.y, layer.y + layer.offsetY * m, e)
            const z = layer.depth * m * e * (ctx.width / 100)
            const r = ctx.rot
            const s = lerp(layer.scale, layer.explodedScale, e)
            return `translate3d(${x}%, ${y}%, ${z}px) rotateX(${layer.rotateX * r * e}deg) rotateY(${layer.rotateY * r * e}deg) rotateZ(${layer.rotate + layer.rotateZ * r * e}deg) scale(${s})`
        },
        key
    )
    const opacity = useDerived(
        final,
        (p) => clamp(lerp(layer.opacity, layer.explodedOpacity, layerEase(p, layer, ctx))),
        key
    )

    const src = layer.image?.src
    const failed = !!src && failedSrc === src
    const alt = ctx.decorative ? "" : layer.alt || layer.image?.alt || layer.name || ""
    const filter = shadow > 0 ? `drop-shadow(0 ${shadow * 14}px ${shadow * 22}px rgba(0,0,0,${0.15 + shadow * 0.45}))` : undefined
    const fill: React.CSSProperties = { width: "100%", height: "100%", display: "block", filter }

    // A layer image that cannot load falls back to the dashed placeholder with the layer name, never an empty hole.
    let content: React.ReactNode
    if (src && !failed) {
        content = <img src={src} srcSet={layer.image?.srcSet} alt={alt} draggable={false} decoding="async" onError={() => setFailed(src)} style={{ ...fill, objectFit }} />
    } else if (!src && layer.art && ART[layer.art]) {
        content = (
            <svg viewBox="0 0 1000 750" preserveAspectRatio="xMidYMid meet" {...(ctx.decorative ? { "aria-hidden": true } : { role: "img", "aria-label": alt })} style={{ ...fill, pointerEvents: "none" }}>
                <g style={{ pointerEvents: fxOn ? "visiblePainted" : "none" }} {...over}>{ART[layer.art]}</g>
            </svg>
        )
    } else {
        const inset = 12 + index * 2.5
        content = (
            <div style={{ position: "absolute", inset: `${inset}%`, borderRadius: 18, border: `1.5px dashed ${accent}`, background: "rgba(127,127,127,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: accent, font: "500 13px/1.2 system-ui, sans-serif", textAlign: "center", padding: 8, pointerEvents: fxOn ? "auto" : "none" }} {...(ctx.decorative ? { "aria-hidden": true } : { role: "img", "aria-label": alt })} {...over}>
                {showNames || failed ? layer.name : ""}
            </div>
        )
    }

    return (
        <motion.div style={{ position: "absolute", inset: 0, transform, opacity, willChange: "transform, opacity", pointerEvents: "none", transformStyle: "preserve-3d" }}>
            <motion.div style={{ position: "absolute", inset: 0, transform: hoverT, opacity: hoverO, transformStyle: "preserve-3d", pointerEvents: "none" }}>
                {content}
                {src && !failed && box && stageW > 0 && (() => {
                    const sc = (objectFit === "cover" ? Math.max : Math.min)(stageW / box.nw, stageH / box.nh)
                    const dw = box.nw * sc, dh = box.nh * sc, ox = (stageW - dw) / 2, oy = (stageH - dh) / 2
                    const l = Math.max(0, ox + box.x * dw), t = Math.max(0, oy + box.y * dh)
                    const r = Math.min(stageW, ox + (box.x + box.w) * dw), b = Math.min(stageH, oy + (box.y + box.h) * dh)
                    return <div aria-hidden {...over} style={{ position: "absolute", left: l, top: t, width: Math.max(0, r - l), height: Math.max(0, b - t), pointerEvents: "auto" }} />
                })()}
                {layer.label && (
                    <span ref={(el) => setAnchor(index, el)} aria-hidden style={{ position: "absolute", left: `${layer.labelX}%`, top: `${layer.labelY}%`, width: 1, height: 1 }} />
                )}
            </motion.div>
        </motion.div>
    )
}

function layerEase(p: number, layer: ResolvedLayer, ctx: LayerCtx) {
    const d = clamp((p - layer.startAt) / (1 - ctx.maxDelay || 1))
    return ctx.ease(d)
}

// ---------- component ----------

type XRayProps = {
    preset: string; layers?: Layer[]; sampleLayers?: Layer[]; objectFit: "cover" | "contain"; aspectRatio: string; productName?: string
    showLayerNames: boolean; canvasPreview: number; interaction: string; hoverBlend: string; hoverBoost: number
    scrollMode: string; playDelay: number; startZoom: number; layerHover: string; hoverLift: number; dimAmount: number
    keyboardFocus: boolean; tapToggle: boolean; scrollStart: number; scrollEnd: number; reverseScroll: boolean
    returnOutside: boolean; initialState: string; resetButton: boolean; amount: number; duration: number; easing: string
    stagger: number; perspective: number; originX: number; originY: number; rotationIntensity: number; movementIntensity: number
    background: string; labelBackground: string; borderColor: string; borderWidth: number; radius: number; shadow: string
    layerShadow: number; contactShadow: boolean; glow: number; overflow: string; labels: string
    labelFont?: React.CSSProperties; textColor: string; accentColor: string
    tabletAmount: number; mobileAmount: number; mobileZoom: number; mobileLabels: boolean; mobileInteraction: string
    mobilePerspective: number; lightMobile: boolean; minHeight: number; respectReducedMotion: boolean; reducedBehavior: string
    disableHoverTouch: boolean; decorative: boolean; tiltX: number; tiltY: number; tiltZ: number; style?: React.CSSProperties
}

export default function ProductXRay(props: XRayProps) {
    const {
        preset, layers, sampleLayers, objectFit, aspectRatio, productName, showLayerNames, canvasPreview,
        interaction, hoverBlend, hoverBoost, scrollMode, playDelay, startZoom, layerHover, hoverLift, dimAmount, keyboardFocus, tapToggle, scrollStart, scrollEnd,
        reverseScroll, returnOutside, initialState, resetButton,
        amount, duration, easing, stagger, perspective, originX, originY, rotationIntensity, movementIntensity,
        background, labelBackground, borderColor, borderWidth, radius, shadow, layerShadow, contactShadow, glow, overflow,
        labels, labelFont, textColor, accentColor,
        tabletAmount, mobileAmount, mobileZoom, mobileLabels, mobileInteraction, mobilePerspective, lightMobile, minHeight,
        respectReducedMotion, reducedBehavior, disableHoverTouch, decorative,
        style,
    } = props

    const target = RenderTarget.current()
    const staticRenderer = useIsStaticRenderer()
    const isStatic = staticRenderer || target === RenderTarget.canvas
    const prefersReduced = !!useReducedMotion() && respectReducedMotion
    const snap = prefersReduced && reducedBehavior === "snap"

    const outerRef = useRef<HTMLDivElement>(null)
    const anchors = useRef<(HTMLElement | null)[]>([])
    const labelEls = useRef<(HTMLDivElement | null)[]>([])
    const [coarse, setCoarse] = useState(false)
    const [vw, setVw] = useState(1440)
    const [box, setBox] = useState({ w: 0, h: 0 })
    const [toggled, setToggled] = useState(initialState === "exploded")

    const { scrollY } = useScroll()
    const scrollRaw = useMotionValue(0)
    // wheel steps jump in big chunks; the spring turns them into a smooth glide
    const scroll = useSpring(scrollRaw, { stiffness: 130, damping: 26, mass: 0.7, restDelta: 0.0005 })
    const hover = useMotionValue(0)
    const click = useMotionValue(initialState === "exploded" ? 1 : 0)
    const final = useMotionValue(isStatic ? clamp(canvasPreview) : 0)
    const hoverAnim = useRef<Stoppable | null>(null)
    const clickAnim = useRef<Stoppable | null>(null)
    const maxScroll = useRef(0)

    // effective interaction (touch devices have no hover)
    const mode = useMemo(() => {
        if (!coarse) return interaction
        if (mobileInteraction === "scroll") return "scroll"
        if (mobileInteraction === "tap") return "click"
        if (interaction === "hover") return "click"
        if (interaction === "hoverScroll") return "scroll"
        return interaction
    }, [coarse, interaction, mobileInteraction])
    const clickOn = mode === "click" || tapToggle || (coarse && mobileInteraction === "tap")

    const device = vw < 810 ? "mobile" : vw < 1200 ? "tablet" : "desktop"
    const deviceAmount = device === "mobile" ? mobileAmount : device === "tablet" ? tabletAmount : 1
    const persp = device === "mobile" ? mobilePerspective : perspective
    const light = device === "mobile" && lightMobile

    const base = PRESETS[preset]
    const norm = useMemo(() => {
        const src: Layer[] = base ? base.layers : layers || []
        const n = src.length
        const maxDelay = clamp(stagger) * 0.5
        const list = src.map((l: Layer, i: number) => {
            const own = clamp(l.delay ?? 0) * 0.3
            return {
                name: l.name || `Layer ${i + 1}`, image: base ? sampleLayers?.[i]?.image || (l.imageUrl ? { src: l.imageUrl } : undefined) : l.image, alt: (base ? sampleLayers?.[i]?.alt : undefined) || l.alt, art: l.art,
                x: l.x ?? 0, y: l.y ?? 0, rotate: l.rotate ?? 0, scale: l.scale ?? 1, opacity: l.opacity ?? 1,
                offsetX: l.offsetX ?? 0, offsetY: l.offsetY ?? 0, depth: l.depth ?? 0,
                rotateX: l.rotateX ?? 0, rotateY: l.rotateY ?? 0, rotateZ: l.rotateZ ?? 0,
                explodedScale: l.explodedScale ?? 1, explodedOpacity: l.explodedOpacity ?? 1,
                startAt: (n > 1 ? (maxDelay * i) / (n - 1) : 0) + own,
                label: l.label, labelSide: l.labelSide || "right", labelX: l.labelX ?? 50, labelY: l.labelY ?? 50,
            }
        })
        const maxStart = list.reduce((m, l) => Math.max(m, l.startAt), 0)
        return { list, maxStart }
    }, [preset, layers, sampleLayers, stagger, base])

    const ease = useMemo(() => {
        const b = EASES[easing] || EASES.smooth
        return cubicBezier(b[0], b[1], b[2], b[3])
    }, [easing])

    const reduceScale = prefersReduced && !snap ? 0.35 : 1
    const ctx = useMemo(() => {
        const width = box.w || 800
        const mult = amount * deviceAmount * reduceScale
        return {
            ease, maxDelay: norm.maxStart, width, decorative, precise: norm.list.length <= 12,
            move: mult * movementIntensity, rot: mult * rotationIntensity,
            lift: layerHover === "lift" || layerHover === "liftFocus" ? hoverLift : 0,
            dim: layerHover === "focus" || layerHover === "liftFocus" ? dimAmount : 0,
            key: [easing, norm.maxStart, width, mult, movementIntensity, rotationIntensity, decorative].join("|"),
        }
    }, [layerHover, hoverLift, dimAmount, ease, norm, box.w, amount, deviceAmount, reduceScale, movementIntensity, rotationIntensity, decorative, easing])

    // hovering one layer after the explosion: lift it, dim the rest, highlight its label
    const [hot, setHot] = useState(-1)
    const hotRef = useRef(-1)
    hotRef.current = hot
    const fxOn = layerHover !== "off" && !isStatic && !prefersReduced && !coarse
    const onHot = useCallback((i: number) => {
        if (i >= 0 && final.get() < 0.45) return
        setHot((h) => (h === i ? h : i))
    }, [final])
    useEffect(() => final.on("change", (p: number) => { if (p < 0.4) setHot((h) => (h === -1 ? h : -1)) }), [final])

    // latest settings for the progress combiner, so listeners never go stale
    const live = useRef<{ mode: string; hoverBlend: string; hoverBoost: number; clickOn: boolean; snap: boolean; isStatic: boolean; canvasPreview: number }>({ mode, hoverBlend, hoverBoost, clickOn, snap, isStatic, canvasPreview })
    live.current = { mode, hoverBlend, hoverBoost, clickOn, snap, isStatic, canvasPreview }
    const compute = useCallback(() => {
        const c = live.current
        if (c.isStatic) {
            final.set(clamp(c.canvasPreview))
            return
        }
        const s = scroll.get(), h = hover.get(), k = click.get()
        let p = 0
        if (c.mode === "hover") p = Math.max(h, k)
        else if (c.mode === "scroll") p = c.clickOn ? Math.max(s, k) : s
        else if (c.mode === "click") p = k
        else {
            const add = Math.max(h, c.clickOn ? k : 0) * c.hoverBoost
            p = c.hoverBlend === "max" ? Math.max(s, add) : s + add
        }
        p = clamp(p)
        final.set(c.snap ? (p > 0.5 ? 1 : 0) : p)
    }, [final, scroll, hover, click])

    useEffect(() => {
        compute()
        const offs = [scroll.on("change", compute), hover.on("change", compute), click.on("change", compute)]
        return () => offs.forEach((o) => o())
    }, [compute, scroll, hover, click])
    useEffect(compute, [mode, hoverBlend, hoverBoost, clickOn, snap, isStatic, canvasPreview, compute])

    // touch detection + viewport width
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(hover: none)")
        const sync = () => {
            setCoarse(mq.matches)
            setVw(window.innerWidth)
        }
        sync()
        mq.addEventListener?.("change", sync)
        window.addEventListener("resize", sync)
        return () => {
            mq.removeEventListener?.("change", sync)
            window.removeEventListener("resize", sync)
        }
    }, [])

    // stage size (aspect ratio fitted inside the component)
    useEffect(() => {
        const el = outerRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => {
            const r = el.getBoundingClientRect()
            const ar = RATIOS[aspectRatio] || 4 / 3
            const fitW = r.height * ar
            const w = objectFit === "cover" ? Math.max(r.width, fitW) : Math.min(r.width, fitW)
            setBox({ w: Math.round(w), h: Math.round(w / ar) })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [aspectRatio, objectFit])

    // scroll progress: one listener per component, active only while near the viewport
    useEffect(() => {
        const el = outerRef.current
        if (isStatic || !el || typeof window === "undefined") return
        if (mode !== "scroll" && mode !== "hoverScroll") {
            scroll.set(0)
            return
        }
        let visible = true
        let raf = 0
        let target = -1
        let timer: ReturnType<typeof setTimeout> | 0 = 0
        let playAnim: Stoppable | null = null
        const run = () => {
            raf = 0
            if (!visible) return
            const vh = window.innerHeight
            const rect = el.getBoundingClientRect()
            if (scrollMode === "play") {
                // show the product as it is, then play the explosion once it is fully on screen
                const ratio = (Math.min(rect.bottom, vh) - Math.max(rect.top, 0)) / (rect.height || 1)
                const go = (to: number, delay: number, secs: number) => {
                    if (target === to) return
                    target = to
                    if (timer) clearTimeout(timer)
                    timer = setTimeout(() => {
                        playAnim?.stop()
                        playAnim = animate(scrollRaw, to, { duration: prefersReduced ? 0.01 : secs, ease: [0.45, 0, 0.2, 1] })
                    }, delay * 1000)
                }
                // a card taller than the window (small preview frames) counts as seen once most of the window shows it
                const need = Math.min(0.94, (vh * 0.85) / (rect.height || 1))
                if (ratio >= need) go(1, playDelay, Math.max(0.3, duration * 1.5))
                else if (ratio < need * 0.48 && reverseScroll) go(0, 0, Math.max(0.3, duration))
                return
            }
            const mid = rect.top + rect.height / 2 // centre of the component
            const endY = (vh * scrollEnd) / 100 // centre position where it is fully open
            // start when the bottom edge reaches Scroll Start (100% = whole card on screen); tall cards still get a run
            const startY = Math.max((vh * scrollStart) / 100 - rect.height / 2, endY + 160)
            const t = (startY - mid) / (startY - endY)
            let p = clamp(t)
            if (returnOutside && t > 1) p = 1 - clamp((t - 1) / 0.5)
            if (!reverseScroll) {
                maxScroll.current = Math.max(maxScroll.current, p)
                p = maxScroll.current
            }
            scrollRaw.set(p)
        }
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(run)
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting
                if (visible) onScroll()
            },
            { rootMargin: "300px 0px 300px 0px" }
        )
        io.observe(el)
        const offScroll = scrollY.on("change", onScroll)
        window.addEventListener("resize", onScroll)
        run()
        return () => {
            io.disconnect()
            offScroll()
            window.removeEventListener("resize", onScroll)
            if (raf) cancelAnimationFrame(raf)
            if (timer) clearTimeout(timer)
            playAnim?.stop()
        }
    }, [mode, scrollMode, playDelay, duration, prefersReduced, scrollStart, scrollEnd, reverseScroll, returnOutside, isStatic, scrollRaw, scrollY])

    // ---- pointer / keyboard ----
    const dur = prefersReduced ? 0.01 : Math.max(0.01, duration)
    const to = (mv: MotionValue<number>, ref: React.MutableRefObject<Stoppable | null>, value: number) => {
        ref.current?.stop()
        ref.current = animate(mv, value, { duration: dur * Math.abs(value - mv.get()) + 0.001, ease: "linear" })
    }
    useEffect(() => () => { hoverAnim.current?.stop(); clickAnim.current?.stop() }, [])

    const setHover = (v: number) => to(hover, hoverAnim, v)
    const setClick = (v: number) => {
        setToggled(v > 0)
        to(click, clickAnim, v)
    }
    const interactive = !isStatic && (clickOn || keyboardFocus)

    const onEnter = (e: React.PointerEvent) => {
        if (isStatic || (e.pointerType === "touch" && disableHoverTouch)) return
        if (mode === "hover" || mode === "hoverScroll") setHover(1)
    }
    const onLeave = (e: React.PointerEvent) => {
        setHot(-1)
        if (isStatic || e.pointerType === "touch") return
        setHover(0)
    }
    const onFocus = (e: React.FocusEvent) => {
        if (!keyboardFocus) return
        let vis = true
        try { vis = (e.currentTarget as HTMLElement).matches(":focus-visible") } catch (_) {}
        if (vis && (mode === "hover" || mode === "hoverScroll")) setHover(1)
    }
    const onBlur = () => setHover(0)
    const onClick = () => {
        if (isStatic || !clickOn) return
        setClick(click.get() > 0.5 ? 0 : 1)
    }
    const onKey = (e: React.KeyboardEvent) => {
        if (!clickOn) return
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick()
        } else if (e.key === "Escape") setClick(0)
    }
    const reset = (e: React.MouseEvent) => {
        e.stopPropagation()
        setClick(0)
        setHover(0)
    }

    // ---- labels follow the projected anchor of each layer ----
    const showLabels = labels !== "off" && !isStatic && (device !== "mobile" || mobileLabels)
    useEffect(() => {
        const outer = outerRef.current
        if (!showLabels || !outer) return
        let raf = 0
        const place = () => {
            raf = 0
            const o = outer.getBoundingClientRect()
            const p = final.get()
            const vis = labels === "always" ? 1 : clamp((p - 0.3) / 0.4)
            norm.list.forEach((l, i) => {
                const a = anchors.current[i], el = labelEls.current[i]
                if (!a || !el) return
                const r = a.getBoundingClientRect()
                // keep the whole label inside the card
                const lw = el.offsetWidth, lh = el.offsetHeight
                const left = l.labelSide === "left"
                const x = left ? Math.max(lw + 8, Math.min(o.width - 8, r.left - o.left)) : Math.max(8, Math.min(o.width - lw - 8, r.left - o.left))
                const y = Math.max(lh / 2 + 6, Math.min(o.height - lh / 2 - 6, r.top - o.top))
                el.style.transform = `translate(${x}px, ${y}px) translate(${left ? "-100%" : "0"}, -50%)`
                el.style.opacity = String(vis * (hotRef.current < 0 || hotRef.current === i ? 1 : 0.3))
            })
        }
        const sched = () => { if (!raf) raf = requestAnimationFrame(place) }
        const off = final.on("change", sched)
        const ro = new ResizeObserver(sched)
        ro.observe(outer)
        sched()
        return () => { off(); ro.disconnect(); if (raf) cancelAnimationFrame(raf) }
    }, [showLabels, labels, norm, final, box.w, hot])

    // ---- scene tilt ----
    // phones: the card is narrow, so the product starts bigger and ends a little bigger than on desktop
    const z0 = device === "mobile" ? startZoom * mobileZoom : startZoom
    const z1 = device === "mobile" ? 1 + (mobileZoom - 1) * 0.3 : 1
    const tilt0 = base ? base.tilt0 : [0, 0, 0]
    const tilt1 = base ? base.tilt1 : [50, 0, -34] // own layers need a tilt or the stack separates flat and unseen
    const sceneKey = [tilt0, tilt1, props.tiltX, props.tiltY, props.tiltZ, easing, z0, z1, amount * deviceAmount * reduceScale].join("|")
    const scene = useDerived(
        final,
        (p) => {
            const e = ease(clamp(p))
            const k = clamp(amount * deviceAmount * reduceScale, 0, 1.5)
            const a = (i: number, t: number) => lerp(tilt0[i], tilt1[i] * k, e) + t
            return `scale(${lerp(z0, z1, e)}) rotateX(${a(0, props.tiltX)}deg) rotateY(${a(1, props.tiltY)}deg) rotateZ(${a(2, props.tiltZ)}deg)`
        },
        sceneKey
    )
    const shadowMv = useDerived(final, (p) => 1 - ease(clamp(p)) * 0.55, easing)
    const glowMv = useDerived(final, (p) => ease(clamp(p)) * glow, easing + glow)

    const stageW = box.w || undefined
    const stageH = box.h || undefined
    const fallback = !box.w
    const empty = !base && !norm.list.some((l) => l.image?.src)
    const parts = norm.list.map((l) => l.label).filter(Boolean).join(", ")
    const label = `${productName || "Product"} exploded view${parts && !decorative ? `: ${parts}` : ""}`
    const aria = interactive
        ? clickOn
            ? `${label}. ${toggled ? "Exploded" : "Assembled"}. Press to ${toggled ? "assemble" : "explode"}.`
            : `${label}. Focus to explode.`
        : label

    return (
        <div
            ref={outerRef}
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            style={{
                ...style, position: "relative", width: "100%", height: "100%", minHeight, boxSizing: "border-box",
                background, borderRadius: radius, overflow: overflow === "hidden" ? "hidden" : "visible",
                border: borderWidth ? `${borderWidth}px solid ${borderColor}` : "none", boxShadow: shadow,
                color: textColor, ["--xr-accent" as string]: accentColor,
                touchAction: "pan-y",
            }}
        >
            <style>{`.xr-int{outline:none}.xr-int:focus-visible{outline:2px solid var(--xr-accent);outline-offset:-4px;border-radius:inherit}`}</style>
            {glow > 0 && (
                <motion.div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: glowMv, background: `radial-gradient(60% 55% at 50% 52%, ${accentColor}55, transparent 70%)` }} />
            )}
            <div
                className="xr-int"
                role={clickOn && !isStatic ? "button" : "group"}
                aria-label={aria}
                aria-pressed={clickOn && !isStatic ? toggled : undefined}
                tabIndex={interactive ? 0 : undefined}
                onFocus={onFocus}
                onBlur={onBlur}
                onClick={onClick}
                onKeyDown={onKey}
                style={{ position: "absolute", inset: 0, cursor: clickOn ? "pointer" : "default", borderRadius: "inherit" }}
            >
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", perspective: persp, perspectiveOrigin: `${originX}% ${originY}%`, transformStyle: "preserve-3d" }}>
                    <div style={{ position: "relative", width: fallback ? "100%" : stageW, height: fallback ? "100%" : stageH, transformStyle: "preserve-3d", flex: "none" }}>
                        {contactShadow && (
                            <motion.div aria-hidden style={{ position: "absolute", left: "22%", right: "22%", bottom: "6%", height: "9%", opacity: shadowMv, scale: shadowMv, background: "radial-gradient(closest-side, rgba(0,0,0,0.5), transparent)", pointerEvents: "none" }} />
                        )}
                        <motion.div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: scene }}>
                            {norm.list.map((l, i) => (
                                <XRayLayer
                                    key={i}
                                    layer={l}
                                    index={i}
                                    final={final}
                                    ctx={ctx}
                                    objectFit={objectFit}
                                    shadow={light ? 0 : layerShadow}
                                    showNames={showLayerNames}
                                    accent={accentColor}
                                    setAnchor={(idx: number, el: HTMLElement | null) => { anchors.current[idx] = el }}
                                    hot={hot}
                                    onHot={onHot}
                                    fxOn={fxOn}
                                    stageW={fallback ? 0 : stageW ?? 0}
                                    stageH={fallback ? 0 : stageH ?? 0}
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
            {empty && target === RenderTarget.canvas && (
                <div aria-hidden style={{ position: "absolute", left: 12, right: 12, bottom: 12, textAlign: "center", font: "500 12px/1.4 system-ui, sans-serif", color: textColor, opacity: 0.7, pointerEvents: "none" }}>
                    Add an image to each layer in the Properties panel
                </div>
            )}
            {showLabels && (
                <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: "inherit" }}>
                    {norm.list.map((l, i) =>
                        l.label ? (
                            <div
                                key={i}
                                ref={(el) => { labelEls.current[i] = el }}
                                style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", flexDirection: l.labelSide === "left" ? "row-reverse" : "row", gap: 0, opacity: 0, color: textColor, whiteSpace: "nowrap", fontSize: 13, fontWeight: 500, ...labelFont }}
                            >
                                <span style={{ width: 7, height: 7, borderRadius: 7, background: accentColor, flex: "none" }} />
                                <span style={{ width: 34, height: 1, background: textColor, opacity: 0.45, flex: "none" }} />
                                <span style={{ margin: l.labelSide === "left" ? "0 6px 0 0" : "0 0 0 6px", padding: "5px 11px", borderRadius: 999, background: labelBackground, boxShadow: hot === i ? `0 0 0 1.5px ${accentColor}` : "none", transition: "box-shadow .2s", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>{l.label}</span>
                            </div>
                        ) : null
                    )}
                </div>
            )}
            {resetButton && toggled && !isStatic && (
                <button
                    type="button"
                    onClick={reset}
                    aria-label="Reset to assembled"
                    style={{ position: "absolute", right: 14, bottom: 14, padding: "7px 14px", borderRadius: 999, border: `1px solid ${textColor}55`, background: "transparent", color: textColor, cursor: "pointer", font: "500 12px/1 system-ui, sans-serif" }}
                >
                    Reset
                </button>
            )}
        </div>
    )
}

const DEFAULTS: Partial<XRayProps> = {
    preset: "phone", layers: [], sampleLayers: [], objectFit: "contain", aspectRatio: "4:3", productName: "Product", showLayerNames: true, canvasPreview: 0.7,
    interaction: "hoverScroll", hoverBlend: "add", hoverBoost: 0.5, scrollMode: "play", playDelay: 0.5, startZoom: 1.25, layerHover: "liftFocus", hoverLift: 7, dimAmount: 0.5, keyboardFocus: true, tapToggle: true,
    scrollStart: 88, scrollEnd: 33, reverseScroll: true, returnOutside: false, initialState: "assembled", resetButton: false,
    amount: 1, duration: 0.8, easing: "smooth", stagger: 0.35, perspective: 1400, originX: 50, originY: 50,
    rotationIntensity: 1, movementIntensity: 1, tiltX: 0, tiltY: 0, tiltZ: 0,
    background: "rgba(0,0,0,0)", labelBackground: "rgba(14,15,18,0.78)", borderColor: "rgba(255,255,255,0.08)", borderWidth: 0, radius: 24, shadow: "none",
    layerShadow: 0.35, contactShadow: true, glow: 0.35, overflow: "hidden", labels: "explode", textColor: "#E8E9EC", accentColor: "#7C9CFF",
    tabletAmount: 0.85, mobileAmount: 0.65, mobileZoom: 1.5, mobileLabels: false, mobileInteraction: "scroll", mobilePerspective: 900, lightMobile: true, minHeight: 280,
    respectReducedMotion: true, reducedBehavior: "gentle", disableHoverTouch: true, decorative: false,
}
ProductXRay.defaultProps = DEFAULTS as XRayProps

const isCustom = (p: { preset?: string }) => p.preset !== "custom"
type SampleOpts = { defaultValue?: number; min?: number; max?: number; step?: number; unit?: string; description?: string; displayStepper?: boolean; hidden?: (p: Partial<XRayProps>) => boolean }
const sample = (title: string, rest: SampleOpts = {}) => ({ type: ControlType.Number as typeof ControlType.Number, title, ...rest })

addPropertyControls(ProductXRay, {
    // Content
    preset: {
        type: ControlType.Enum, title: "Product",
        options: ["phone", "headphones", "phonePhoto", "custom"],
        optionTitles: ["Sample: Smartphone", "Sample: Headphones", "Photo: Smartphone", "My own layers"],
        defaultValue: "phone",
    },
    sampleLayers: {
        type: ControlType.Array, title: "Replace Images", maxCount: 7, hidden: (p: Partial<XRayProps>) => p.preset === "custom",
        description: "Swap the drawn parts for your own images. Item 1 replaces the back layer, then going forward. Phone: Back glass, Battery, Logic board, Display, Cover glass. Headphones: Headband, Left cup, Left cushion, Right cup, Right cushion, Left driver, Right driver. Leave an item empty to keep the drawing. Use transparent PNGs with the same canvas size (4:3).",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: { type: ControlType.String, title: "Alt Text", defaultValue: "" },
            },
        },
        defaultValue: [],
    },
    layers: {
        type: ControlType.Array, title: "Layers", maxCount: 10, hidden: isCustom,
        defaultValue: [
            { name: "Back", depth: 0, label: "Back" },
            { name: "Layer 2", depth: 10, label: "Layer 2" },
            { name: "Layer 3", depth: 20, label: "Layer 3" },
            { name: "Layer 4", depth: 30, label: "Layer 4" },
            { name: "Front", depth: 40, label: "Front" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Layer" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: { type: ControlType.String, title: "Alt Text" },
                x: sample("Start X %", { defaultValue: 0, min: -100, max: 100, step: 0.5 }),
                y: sample("Start Y %", { defaultValue: 0, min: -100, max: 100, step: 0.5 }),
                rotate: sample("Start Rotate", { defaultValue: 0, min: -180, max: 180, unit: "°" }),
                scale: sample("Start Scale", { defaultValue: 1, min: 0.1, max: 3, step: 0.05 }),
                opacity: sample("Start Opacity", { defaultValue: 1, min: 0, max: 1, step: 0.05 }),
                offsetX: sample("Move X %", { defaultValue: 0, min: -100, max: 100, step: 0.5 }),
                offsetY: sample("Move Y %", { defaultValue: 0, min: -100, max: 100, step: 0.5 }),
                depth: sample("Depth", { defaultValue: 0, min: -80, max: 80, step: 0.5 }),
                rotateX: sample("Tilt X", { defaultValue: 0, min: -180, max: 180, unit: "°" }),
                rotateY: sample("Tilt Y", { defaultValue: 0, min: -180, max: 180, unit: "°" }),
                rotateZ: sample("Spin", { defaultValue: 0, min: -180, max: 180, unit: "°" }),
                explodedScale: sample("End Scale", { defaultValue: 1, min: 0.1, max: 3, step: 0.05 }),
                explodedOpacity: sample("End Opacity", { defaultValue: 1, min: 0, max: 1, step: 0.05 }),
                delay: sample("Extra Delay", { defaultValue: 0, min: 0, max: 1, step: 0.05 }),
                label: { type: ControlType.String, title: "Label" },
                labelSide: { type: ControlType.Enum, title: "Label Side", options: ["right", "left"], optionTitles: ["Right", "Left"], defaultValue: "right", displaySegmentedControl: true },
                labelX: sample("Label Anchor X", { defaultValue: 50, min: 0, max: 100, unit: "%" }),
                labelY: sample("Label Anchor Y", { defaultValue: 50, min: 0, max: 100, unit: "%" }),
            },
        },
    },
    productName: { type: ControlType.String, title: "Product Name", defaultValue: "Product" },
    aspectRatio: { type: ControlType.Enum, title: "Aspect Ratio", options: Object.keys(RATIOS), defaultValue: "4:3" },
    objectFit: { type: ControlType.Enum, title: "Image Fit", options: ["contain", "cover"], optionTitles: ["Contain", "Cover"], defaultValue: "contain", displaySegmentedControl: true },
    showLayerNames: { type: ControlType.Boolean, title: "Names On Empty", defaultValue: true, hidden: isCustom },
    canvasPreview: sample("Canvas State", { defaultValue: 0.7, min: 0, max: 1, step: 0.05 }),

    // Interaction
    interaction: {
        type: ControlType.Enum, title: "Interaction",
        options: ["hoverScroll", "hover", "scroll", "click"],
        optionTitles: ["Hover + Scroll", "Hover", "Scroll", "Click to Toggle"],
        defaultValue: "hoverScroll",
    },
    hoverBlend: { type: ControlType.Enum, title: "Hover Blend", options: ["add", "max"], optionTitles: ["Add to scroll", "Maximum"], defaultValue: "add", hidden: (p: Partial<XRayProps>) => p.interaction !== "hoverScroll" },
    hoverBoost: sample("Hover Boost", { defaultValue: 0.5, min: 0, max: 1, step: 0.05, hidden: (p: Partial<XRayProps>) => p.interaction !== "hoverScroll" }),
    tapToggle: { type: ControlType.Boolean, title: "Click / Tap Toggle", defaultValue: true, hidden: (p: Partial<XRayProps>) => p.interaction === "click" },
    layerHover: { type: ControlType.Enum, title: "Layer Hover", options: ["liftFocus", "lift", "focus", "off"], optionTitles: ["Lift + focus", "Lift", "Focus (dim others)", "Off"], defaultValue: "liftFocus" },
    hoverLift: sample("Hover Lift", { defaultValue: 7, min: 0, max: 20, step: 0.5, hidden: (p: Partial<XRayProps>) => p.layerHover === "off" || p.layerHover === "focus" }),
    dimAmount: sample("Dim Others", { defaultValue: 0.5, min: 0, max: 0.9, step: 0.05, hidden: (p: Partial<XRayProps>) => p.layerHover === "off" || p.layerHover === "lift" }),
    keyboardFocus: { type: ControlType.Boolean, title: "Keyboard Focus", defaultValue: true },
    scrollMode: { type: ControlType.Enum, title: "Scroll Mode", options: ["play", "scrub"], optionTitles: ["Play when visible", "Follow scroll"], defaultValue: "play", hidden: (p: Partial<XRayProps>) => p.interaction === "hover" || p.interaction === "click" },
    playDelay: sample("Play Delay", { defaultValue: 0.5, min: 0, max: 3, step: 0.1, unit: "s", hidden: (p: Partial<XRayProps>) => p.interaction === "hover" || p.interaction === "click" || p.scrollMode !== "play" }),
    scrollStart: sample("Scroll Start", { defaultValue: 88, min: 0, max: 100, unit: "%", hidden: (p: Partial<XRayProps>) => p.interaction === "hover" || p.interaction === "click" || p.scrollMode === "play" }),
    scrollEnd: sample("Scroll End", { defaultValue: 33, min: 0, max: 100, unit: "%", hidden: (p: Partial<XRayProps>) => p.interaction === "hover" || p.interaction === "click" || p.scrollMode === "play" }),
    reverseScroll: { type: ControlType.Boolean, title: "Reverse on Scroll Up", defaultValue: true, hidden: (p: Partial<XRayProps>) => p.interaction === "hover" || p.interaction === "click" },
    returnOutside: { type: ControlType.Boolean, title: "Return After Range", defaultValue: false, hidden: (p: Partial<XRayProps>) => p.interaction === "hover" || p.interaction === "click" },
    initialState: { type: ControlType.Enum, title: "Initial State", options: ["assembled", "exploded"], optionTitles: ["Assembled", "Exploded"], defaultValue: "assembled", displaySegmentedControl: true },
    resetButton: { type: ControlType.Boolean, title: "Reset Button", defaultValue: false },

    // Motion
    amount: sample("Explosion", { defaultValue: 1, min: 0, max: 2, step: 0.05 }),
    movementIntensity: sample("Movement", { defaultValue: 1, min: 0, max: 2, step: 0.05 }),
    rotationIntensity: sample("Rotation", { defaultValue: 1, min: 0, max: 2, step: 0.05 }),
    duration: sample("Duration", { defaultValue: 0.8, min: 0.1, max: 3, step: 0.1, unit: "s" }),
    easing: { type: ControlType.Enum, title: "Easing", options: Object.keys(EASES), optionTitles: ["Smooth", "Ease Out", "Strong In-Out", "Soft", "Overshoot", "Linear"], defaultValue: "smooth" },
    stagger: sample("Layer Stagger", { defaultValue: 0.35, min: 0, max: 1, step: 0.05 }),
    startZoom: sample("Start Zoom", { defaultValue: 1.25, min: 0.6, max: 2, step: 0.05, description: "Size of the assembled product; it eases back to 1 as it opens, so the closed product fills the card." }),
    perspective: sample("Perspective", { defaultValue: 1400, min: 300, max: 4000, step: 50, unit: "px" }),
    originX: sample("Origin X", { defaultValue: 50, min: 0, max: 100, unit: "%" }),
    originY: sample("Origin Y", { defaultValue: 50, min: 0, max: 100, unit: "%" }),
    tiltX: sample("Scene Tilt X", { defaultValue: 0, min: -90, max: 90, unit: "°" }),
    tiltY: sample("Scene Tilt Y", { defaultValue: 0, min: -90, max: 90, unit: "°" }),
    tiltZ: sample("Scene Tilt Z", { defaultValue: 0, min: -90, max: 90, unit: "°" }),

    // Appearance
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0,0,0,0)" },
    labelBackground: { type: ControlType.Color, title: "Label Chip", defaultValue: "rgba(14,15,18,0.78)", hidden: (p: Partial<XRayProps>) => p.labels === "off" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#7C9CFF" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#E8E9EC" },
    radius: sample("Radius", { defaultValue: 24, min: 0, max: 80, unit: "px" }),
    borderWidth: sample("Border", { defaultValue: 0, min: 0, max: 8, unit: "px" }),
    borderColor: { type: ControlType.Color, title: "Border Color", defaultValue: "rgba(255,255,255,0.08)", hidden: (p: Partial<XRayProps>) => !p.borderWidth },
    shadow: { type: ControlType.BoxShadow, title: "Shadow" },
    layerShadow: sample("Layer Shadow", { defaultValue: 0.35, min: 0, max: 1, step: 0.05 }),
    contactShadow: { type: ControlType.Boolean, title: "Floor Shadow", defaultValue: true },
    glow: sample("Glow", { defaultValue: 0.35, min: 0, max: 1, step: 0.05 }),
    overflow: { type: ControlType.Enum, title: "Overflow", options: ["hidden", "visible"], optionTitles: ["Clip", "Visible"], defaultValue: "hidden", displaySegmentedControl: true },
    labels: { type: ControlType.Enum, title: "Labels", options: ["explode", "always", "off"], optionTitles: ["When exploded", "Always", "Off"], defaultValue: "explode" },
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "basic", defaultFontType: "sans-serif", hidden: (p: Partial<XRayProps>) => p.labels === "off" },

    // Responsive
    tabletAmount: sample("Tablet Explosion", { defaultValue: 0.85, min: 0, max: 1.5, step: 0.05 }),
    mobileAmount: sample("Mobile Explosion", { defaultValue: 0.65, min: 0, max: 1.5, step: 0.05 }),
    mobileZoom: sample("Mobile Zoom", { defaultValue: 1.5, min: 0.8, max: 2.5, step: 0.05, description: "Makes the product bigger on phones, where the card is narrow." }),
    mobileLabels: { type: ControlType.Boolean, title: "Mobile Labels", defaultValue: false },
    mobileInteraction: { type: ControlType.Enum, title: "Touch Interaction", options: ["tap", "scroll", "same"], optionTitles: ["Tap to toggle only", "Play on scroll (tap also works)", "Same as desktop"], defaultValue: "scroll" },
    mobilePerspective: sample("Mobile Perspective", { defaultValue: 900, min: 300, max: 4000, step: 50, unit: "px" }),
    lightMobile: { type: ControlType.Boolean, title: "Lighter on Mobile", defaultValue: true },
    minHeight: sample("Min Height", { defaultValue: 280, min: 0, max: 1200, unit: "px" }),

    // Accessibility
    respectReducedMotion: { type: ControlType.Boolean, title: "Reduced Motion", defaultValue: true },
    reducedBehavior: { type: ControlType.Enum, title: "When Reduced", options: ["gentle", "snap"], optionTitles: ["Small movement", "Switch states"], defaultValue: "gentle", displaySegmentedControl: true, hidden: (p: Partial<XRayProps>) => !p.respectReducedMotion },
    disableHoverTouch: { type: ControlType.Boolean, title: "No Hover on Touch", defaultValue: true },
    decorative: { type: ControlType.Boolean, title: "Decorative Images", defaultValue: false },
})
