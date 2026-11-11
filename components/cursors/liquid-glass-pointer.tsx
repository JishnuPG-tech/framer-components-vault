// Liquid Glass Cursor
// A custom pointer rendered as a physically-modelled glass lens: edge refraction
// (Snell's law over a convex squircle bezel), chromatic dispersion, specular rim
// lighting that reacts to motion, and gel-like spring motion.
//
// Full refraction runs in Chromium browsers (Chrome, Edge, Arc, Brave, Opera),
// which support SVG filters inside backdrop-filter. Safari and Firefox get a
// frosted-glass fallback with the same rim lighting, fill, shadow and motion.
//
// Scope: by default the pointer (and the hidden system cursor) is confined to
// this component's own area. "Entire Page" is an explicit opt-in that replaces
// the cursor site-wide. Neither mode touches the Framer editor or canvas.
import * as React from "react"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Shape = "arrow" | "circle" | "square"
type RenderMode = "auto" | "refraction" | "frosted"
type Scope = "component" | "page"

interface GlassOptions {
    thickness: number
    bezel: number
    ior: number
    magnify: number
    dispersion: number
    frost: number
    saturation: number
    brightness: number
}

interface LightOptions {
    intensity: number
    angle: number
    rim: number
    sharpness: number
    dynamic: boolean
}

interface ShadowOptions {
    opacity: number
    blur: number
    offsetY: number
}

interface MotionOptions {
    follow: number
    bounce: number
    stretch: number
    pressScale: number
    hoverScale: number
}

interface LiquidGlassCursorProps {
    scope: Scope
    content?: React.ReactNode
    shape: Shape
    size: number
    radius: number
    fill: string
    outline: string
    outlineWidth: number
    glass: Partial<GlassOptions>
    light: Partial<LightOptions>
    shadow: Partial<ShadowOptions>
    motion: Partial<MotionOptions>
    mode: RenderMode
    hideCursor: boolean
    nativeOnText: boolean
    disableOnTouch: boolean
    style?: CSSProperties
}

const GLASS: GlassOptions = {
    thickness: 18,
    bezel: 9,
    ior: 1.5,
    magnify: 0.12,
    dispersion: 0.15,
    frost: 0.4,
    saturation: 1.5,
    brightness: 1.06,
}

const FILL = "rgba(255, 255, 255, 0.06)"
const OUTLINE = "rgba(0, 0, 0, 0.3)"
const OUTLINE_WIDTH = 1

const LIGHT: LightOptions = {
    intensity: 1,
    angle: -40,
    rim: 2.5,
    sharpness: 2,
    dynamic: true,
}

const SHADOW: ShadowOptions = {
    opacity: 0.3,
    blur: 3,
    offsetY: 1.5,
}

const MOTION: MotionOptions = {
    follow: 12,
    bounce: 0.35,
    stretch: 40,
    pressScale: 1.2,
    hoverScale: 1.15,
}

// Text fields keep the native text cursor (caret placement needs it).
const TEXT_FIELDS = "input, textarea, select, [contenteditable='true'], [contenteditable='']"
const NOT_TEXT_FIELD = ":not(input):not(textarea):not(select):not([contenteditable='true']):not([contenteditable=''])"

const INTERACTIVE =
    "a, button, [role='button'], [role='link'], input, select, textarea, label, summary, [tabindex]:not([tabindex='-1'])"

// ─── Geometry ────────────────────────────────────────────────────────────────

interface Geometry {
    w: number
    h: number
    hotX: number
    hotY: number
    cx: number
    cy: number
    sdf: (x: number, y: number) => number
}

// Classic pointer outline, tip at the origin (unit grid).
const ARROW: [number, number][] = [
    [0, 0],
    [0, 15.6],
    [3.9, 12.1],
    [6.2, 17.6],
    [9.3, 16.3],
    [7.0, 10.9],
    [11.8, 10.9],
]

function sdPolygon(px: number, py: number, v: [number, number][]): number {
    let d = (px - v[0][0]) ** 2 + (py - v[0][1]) ** 2
    let s = 1
    for (let i = 0, j = v.length - 1; i < v.length; j = i, i++) {
        const ex = v[j][0] - v[i][0]
        const ey = v[j][1] - v[i][1]
        const wx = px - v[i][0]
        const wy = py - v[i][1]
        const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)))
        const bx = wx - ex * t
        const by = wy - ey * t
        d = Math.min(d, bx * bx + by * by)
        const c1 = py >= v[i][1]
        const c2 = py < v[j][1]
        const c3 = ex * wy > ey * wx
        if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s
    }
    return s * Math.sqrt(d)
}

function makeGeometry(shape: Shape, size: number, radius: number): Geometry {
    if (shape === "circle") {
        const r = size / 2
        return { w: size, h: size, hotX: r, hotY: r, cx: r, cy: r, sdf: (x, y) => Math.hypot(x - r, y - r) - r }
    }
    if (shape === "square") {
        const hs = size / 2
        const rr = Math.max(0, Math.min(radius, hs))
        return {
            w: size,
            h: size,
            hotX: hs,
            hotY: hs,
            cx: hs,
            cy: hs,
            sdf: (x, y) => {
                const qx = Math.abs(x - hs) - hs + rr
                const qy = Math.abs(y - hs) - hs + rr
                return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr
            },
        }
    }
    const round = 1.1
    const k = size / (17.6 + round * 2)
    const r = round * k
    const pts = ARROW.map(([x, y]) => [(x + round) * k, (y + round) * k] as [number, number])
    return {
        w: (11.8 + round * 2) * k,
        h: size,
        hotX: pts[0][0] - r * 0.35,
        hotY: pts[0][1] - r * 0.8,
        cx: (4.6 + round) * k,
        cy: (10 + round) * k,
        sdf: (x, y) => sdPolygon(x, y, pts) - r,
    }
}

// ─── Optics ──────────────────────────────────────────────────────────────────

// Convex squircle bezel profile — the same continuous-curvature surface Apple
// uses, which keeps the centre flat and concentrates bending at the rim.
function height(t: number): number {
    return Math.pow(1 - Math.pow(1 - t, 4), 0.25)
}

function heightSlope(t: number): number {
    const u = 1 - t
    return (u * u * u) / Math.pow(Math.max(1e-6, 1 - u * u * u * u), 0.75)
}

interface SpecData {
    pw: number
    ph: number
    cov: Float32Array
    nx: Float32Array
    ny: Float32Array
    depth: Float32Array
}

interface Maps {
    W: number
    H: number
    pad: number
    disp: string
    mask: string
    scale: number
    spec: SpecData
    shadow: { url: string; x: number; y: number; w: number; h: number } | null
}

function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v
}

function buildMaps(geo: Geometry, g: GlassOptions, sh: ShadowOptions, dpr: number): Maps {
    const pad = 4
    const W = Math.ceil(geo.w + pad * 2)
    const H = Math.ceil(geo.h + pad * 2)

    // Displacement + mask at 2x.
    const q = 2
    const mw = W * q
    const mh = H * q
    const dispCanvas = document.createElement("canvas")
    const maskCanvas = document.createElement("canvas")
    dispCanvas.width = maskCanvas.width = mw
    dispCanvas.height = maskCanvas.height = mh
    const dctx = dispCanvas.getContext("2d") as CanvasRenderingContext2D
    const mctx = maskCanvas.getContext("2d") as CanvasRenderingContext2D
    const dImg = dctx.createImageData(mw, mh)
    const mImg = mctx.createImageData(mw, mh)
    const dxs = new Float32Array(mw * mh)
    const dys = new Float32Array(mw * mh)

    const e = 0.35
    const eta = 1 / Math.max(1.0001, g.ior)

    // Thin shapes (like the arrow's tail) can't hold a full bezel. Fit the bezel
    // to the shape's deepest interior point so the centre stays clear. Thickness
    // shrinks with it, but not below half, so small cursors still bend light.
    let maxDepth = 0
    for (let y = 0; y < geo.h; y += 0.5) {
        for (let x = 0; x < geo.w; x += 0.5) maxDepth = Math.max(maxDepth, -geo.sdf(x, y))
    }
    const bezel = Math.max(0.5, Math.min(g.bezel, maxDepth * 0.7))
    const thickness = g.thickness * Math.max(0.5, bezel / Math.max(0.5, g.bezel))
    let maxAbs = 0.001

    for (let j = 0; j < mh; j++) {
        for (let i = 0; i < mw; i++) {
            const idx = j * mw + i
            const x = (i + 0.5) / q - pad
            const y = (j + 0.5) / q - pad
            const sd = geo.sdf(x, y)
            const cov = clamp01(0.5 - sd * q)
            mImg.data[idx * 4] = 255
            mImg.data[idx * 4 + 1] = 255
            mImg.data[idx * 4 + 2] = 255
            mImg.data[idx * 4 + 3] = Math.round(cov * 255)
            if (cov <= 0) continue

            let gx = geo.sdf(x + e, y) - geo.sdf(x - e, y)
            let gy = geo.sdf(x, y + e) - geo.sdf(x, y - e)
            const gl = Math.hypot(gx, gy) || 1
            gx /= gl
            gy /= gl

            // Refract a straight-down view ray through the bezel surface.
            const t = Math.min(Math.max(0, -sd) / bezel, 1)
            const slope = t >= 1 ? 0 : Math.min(heightSlope(t), 8) * (thickness / bezel)
            const nl = Math.hypot(slope, 1)
            const Nx = -slope / nl
            const Ny = 1 / nl
            const k = 1 - eta * eta * (1 - Ny * Ny)
            const coef = eta * Ny - Math.sqrt(Math.max(0, k))
            const Tx = coef * Nx
            const Ty = -eta + coef * Ny
            const off = (Tx / Math.max(0.05, -Ty)) * thickness * (height(t) + 0.15)

            const ddx = -gx * off + (geo.cx - x) * g.magnify
            const ddy = -gy * off + (geo.cy - y) * g.magnify
            dxs[idx] = ddx
            dys[idx] = ddy
            maxAbs = Math.max(maxAbs, Math.abs(ddx), Math.abs(ddy))
        }
    }

    const scale = maxAbs * 2
    for (let idx = 0; idx < mw * mh; idx++) {
        dImg.data[idx * 4] = Math.round(clamp01(0.5 + dxs[idx] / scale) * 255)
        dImg.data[idx * 4 + 1] = Math.round(clamp01(0.5 + dys[idx] / scale) * 255)
        dImg.data[idx * 4 + 2] = 128
        dImg.data[idx * 4 + 3] = 255
    }
    dctx.putImageData(dImg, 0, 0)
    mctx.putImageData(mImg, 0, 0)

    // Surface normals for the specular pass, at device resolution.
    const pw = Math.ceil(W * dpr)
    const ph = Math.ceil(H * dpr)
    const cov = new Float32Array(pw * ph)
    const nx = new Float32Array(pw * ph)
    const ny = new Float32Array(pw * ph)
    const depth = new Float32Array(pw * ph)
    for (let j = 0; j < ph; j++) {
        for (let i = 0; i < pw; i++) {
            const idx = j * pw + i
            const x = (i + 0.5) / dpr - pad
            const y = (j + 0.5) / dpr - pad
            const sd = geo.sdf(x, y)
            const c = clamp01(0.5 - sd * dpr)
            if (c <= 0) continue
            let gx = geo.sdf(x + e, y) - geo.sdf(x - e, y)
            let gy = geo.sdf(x, y + e) - geo.sdf(x, y - e)
            const gl = Math.hypot(gx, gy) || 1
            gx /= gl
            gy /= gl
            cov[idx] = c
            nx[idx] = gx
            ny[idx] = gy
            depth[idx] = Math.max(0, -sd)
        }
    }

    // Hollow contact shadow — hollow so it never darkens the glass itself.
    let shadow: Maps["shadow"] = null
    if (sh.opacity > 0) {
        const sp = Math.ceil(sh.blur * 1.6 + Math.abs(sh.offsetY))
        const sw = W + sp * 2
        const shh = H + sp * 2
        const sc = document.createElement("canvas")
        sc.width = sw
        sc.height = shh
        const sctx = sc.getContext("2d") as CanvasRenderingContext2D
        const sImg = sctx.createImageData(sw, shh)
        const sigma = Math.max(0.5, sh.blur / 2)
        for (let j = 0; j < shh; j++) {
            for (let i = 0; i < sw; i++) {
                const x = i + 0.5 - sp - pad
                const y = j + 0.5 - sp - pad
                const inside = clamp01(0.5 - geo.sdf(x, y))
                if (inside >= 1) continue
                const s = geo.sdf(x, y - sh.offsetY) + sh.blur * 0.15
                const a = s <= 0 ? 1 : Math.exp(-(s * s) / (2 * sigma * sigma))
                sImg.data[(j * sw + i) * 4 + 3] = Math.round(sh.opacity * a * (1 - inside) * 255)
            }
        }
        sctx.putImageData(sImg, 0, 0)
        shadow = { url: sc.toDataURL(), x: -sp, y: -sp, w: sw, h: shh }
    }

    return {
        W,
        H,
        pad,
        disp: dispCanvas.toDataURL(),
        mask: maskCanvas.toDataURL(),
        scale,
        spec: { pw, ph, cov, nx, ny, depth },
        shadow,
    }
}

interface Outline {
    r: number
    g: number
    b: number
    a: number
    width: number
}

// Resolve any CSS colour (hex, rgb[a], hsl[a], named) to RGBA via the canvas parser.
const colorCache = new Map<string, [number, number, number, number]>()
function parseColor(css: string): [number, number, number, number] {
    const hit = colorCache.get(css)
    if (hit) return hit
    let out: [number, number, number, number] = [0, 0, 0, 0]
    if (typeof document !== "undefined") {
        const c = document.createElement("canvas")
        c.width = c.height = 1
        const ctx = c.getContext("2d")
        if (ctx) {
            ctx.clearRect(0, 0, 1, 1)
            ctx.fillStyle = "rgba(0,0,0,0)"
            ctx.fillStyle = css
            ctx.fillRect(0, 0, 1, 1)
            const d = ctx.getImageData(0, 0, 1, 1).data
            out = [d[0], d[1], d[2], d[3] / 255]
        }
    }
    colorCache.set(css, out)
    return out
}

function makeOutline(color: string, width: number): Outline {
    const [r, g, b, a] = parseColor(color)
    return { r, g, b, a, width: Math.max(0, width) }
}

function drawSpecular(
    canvas: HTMLCanvasElement | null,
    spec: SpecData,
    l: LightOptions,
    angle: number,
    boost: number,
    outline: Outline
) {
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (canvas.width !== spec.pw || canvas.height !== spec.ph) {
        canvas.width = spec.pw
        canvas.height = spec.ph
    }
    const img = ctx.createImageData(spec.pw, spec.ph)
    const a = (angle * Math.PI) / 180
    const lx = Math.sin(a)
    const ly = -Math.cos(a)
    const rim = Math.max(0.5, l.rim)
    const sharp = Math.max(0.5, l.sharpness)
    const intensity = l.intensity * boost
    const { cov, nx, ny, depth } = spec
    for (let idx = 0; idx < cov.length; idx++) {
        const c = cov[idx]
        if (c <= 0) continue
        const f = Math.max(0, 1 - depth[idx] / rim)
        const band = f * f
        const line = Math.max(0, 1 - depth[idx] / 1.1)
        const d = nx[idx] * lx + ny[idx] * ly
        const key = Math.pow(Math.max(d, 0), sharp)
        const fill = Math.pow(Math.max(-d, 0), sharp) * 0.5
        const v = intensity * (band * (key * 0.9 + fill) + line * (0.3 + key * 0.5))
        const p = idx * 4
        // Inner outline stroke on top of the specular highlight: the outermost
        // edge stays crisp and dark (legible on light backgrounds) with the
        // bright rim just inside it.
        const sa = clamp01(v) * c
        const oa = outline.width > 0 && outline.a > 0 ? clamp01(outline.width - depth[idx] + 0.5) * c * outline.a : 0
        const a = oa + sa * (1 - oa)
        if (a <= 0) continue
        const ow = oa / a
        const sw = (sa * (1 - oa)) / a
        img.data[p] = Math.round(255 * sw + outline.r * ow)
        img.data[p + 1] = Math.round(255 * sw + outline.g * ow)
        img.data[p + 2] = Math.round(255 * sw + outline.b * ow)
        img.data[p + 3] = Math.round(a * 255)
    }
    ctx.putImageData(img, 0, 0)
}

function detectChromium(): boolean {
    if (typeof navigator === "undefined") return false
    const uad = (navigator as any).userAgentData
    if (uad && Array.isArray(uad.brands) && uad.brands.some((b: any) => /Chromium/.test(b.brand))) return true
    const ua = navigator.userAgent
    return /Chrome\/|Chromium\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

// ─── Glass body ──────────────────────────────────────────────────────────────

interface GlassBodyProps {
    maps: Maps
    filterId: string
    refraction: boolean
    glass: GlassOptions
    fill: string
    specRef: React.RefObject<HTMLCanvasElement>
    dispRefs: React.MutableRefObject<(SVGFEDisplacementMapElement | null)[]>
}

function GlassBody({ maps, filterId, refraction, glass, fill, specRef, dispRefs }: GlassBodyProps) {
    const { W, H, scale } = maps
    const d = Math.max(0, Math.min(1, glass.dispersion))
    const maskStyle: CSSProperties = {
        maskImage: `url(${maps.mask})`,
        WebkitMaskImage: `url(${maps.mask})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
    }
    const backdrop = refraction
        ? `url(#${filterId})`
        : `blur(${4 + glass.frost * 2}px) saturate(${glass.saturation}) brightness(${glass.brightness})`
    // Keep one colour channel (plus alpha) so R, G and B can refract by different amounts.
    const channel = (c: number) =>
        [0, 1, 2].map((row) => [0, 1, 2, 3, 4].map((col) => (row === c && col === c ? 1 : 0)).join(" ")).join(" ") + " 0 0 0 1 0"
    dispRefs.current = []

    return (
        <div style={{ position: "relative", width: W, height: H, pointerEvents: "none" }}>
            {refraction && (
                <svg width="0" height="0" style={{ position: "absolute", overflow: "hidden" }} aria-hidden="true">
                    <filter
                        id={filterId}
                        x="0"
                        y="0"
                        width={W}
                        height={H}
                        filterUnits="userSpaceOnUse"
                        primitiveUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feGaussianBlur in="SourceGraphic" stdDeviation={glass.frost} result="blur" />
                        <feImage href={maps.disp} x="0" y="0" width={W} height={H} preserveAspectRatio="none" result="map" />
                        {d > 0 ? (
                            <>
                                {[0, 1, 2].map((c) => (
                                    <feDisplacementMap
                                        key={"d" + c}
                                        ref={(el) => {
                                            dispRefs.current[c] = el
                                        }}
                                        data-base={scale * (1 + d * 0.5 * (1 - c))}
                                        in="blur"
                                        in2="map"
                                        scale={scale * (1 + d * 0.5 * (1 - c))}
                                        xChannelSelector="R"
                                        yChannelSelector="G"
                                        result={"d" + c}
                                    />
                                ))}
                                {[0, 1, 2].map((c) => (
                                    <feColorMatrix key={"c" + c} in={"d" + c} type="matrix" values={channel(c)} result={"c" + c} />
                                ))}
                                <feBlend in="c0" in2="c1" mode="screen" result="c01" />
                                <feBlend in="c01" in2="c2" mode="screen" result="refr" />
                            </>
                        ) : (
                            <feDisplacementMap
                                ref={(el) => {
                                    dispRefs.current[0] = el
                                }}
                                data-base={scale}
                                in="blur"
                                in2="map"
                                scale={scale}
                                xChannelSelector="R"
                                yChannelSelector="G"
                                result="refr"
                            />
                        )}
                        <feColorMatrix in="refr" type="saturate" values={String(glass.saturation)} result="sat" />
                        <feComponentTransfer in="sat" result="lit">
                            <feFuncR type="linear" slope={glass.brightness} />
                            <feFuncG type="linear" slope={glass.brightness} />
                            <feFuncB type="linear" slope={glass.brightness} />
                        </feComponentTransfer>
                        <feImage href={maps.mask} x="0" y="0" width={W} height={H} preserveAspectRatio="none" result="mask" />
                        <feComposite in="lit" in2="mask" operator="in" />
                    </filter>
                </svg>
            )}
            {maps.shadow && (
                <img
                    alt=""
                    src={maps.shadow.url}
                    draggable={false}
                    style={{
                        position: "absolute",
                        left: maps.shadow.x,
                        top: maps.shadow.y,
                        width: maps.shadow.w,
                        height: maps.shadow.h,
                        maxWidth: "none",
                        pointerEvents: "none",
                    }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backdropFilter: backdrop,
                    WebkitBackdropFilter: backdrop,
                    background: fill,
                    ...maskStyle,
                }}
            />
            <canvas
                ref={specRef}
                style={{ position: "absolute", left: 0, top: 0, width: W, height: H, pointerEvents: "none" }}
            />
        </div>
    )
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Liquid Glass Pointer
 *
 * Area → Component: the glass pointer appears only while hovering this
 * component (size it over a region, or put content in its Content slot).
 * Area → Entire Page: replaces the cursor across the whole site. Either way it
 * only runs in Preview and on the published site — the canvas shows a static
 * preview and the editor is never affected.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LiquidGlassCursor(props: LiquidGlassCursorProps) {
    const {
        scope = "component",
        content,
        shape = "arrow",
        size = 22,
        radius = 14,
        fill = FILL,
        outline = OUTLINE,
        outlineWidth = OUTLINE_WIDTH,
        mode = "auto",
        hideCursor = true,
        nativeOnText = true,
        disableOnTouch = true,
    } = props
    const glass: GlassOptions = { ...GLASS, ...props.glass }
    const light: LightOptions = { ...LIGHT, ...props.light }
    const shadow: ShadowOptions = { ...SHADOW, ...props.shadow }
    const motion: MotionOptions = { ...MOTION, ...props.motion }

    const isStatic = useIsStaticRenderer()
    // Only Preview and the published site are "live"; the editor canvas,
    // thumbnails and exports always get the static preview.
    const target = RenderTarget.current()
    const isEditor = isStatic || target === RenderTarget.canvas || target === RenderTarget.thumbnail || target === RenderTarget.export
    const [mounted, setMounted] = useState(false)
    const [enabled, setEnabled] = useState(false)
    const [chromium, setChromium] = useState(false)
    const reactId = React.useId()

    useEffect(() => {
        setMounted(true)
        setChromium(detectChromium())
        if (!isEditor) {
            const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
            setEnabled(!disableOnTouch || fine)
        }
    }, [isEditor, disableOnTouch])

    const geo = useMemo(() => makeGeometry(shape, size, radius), [shape, size, radius])
    const dpr = typeof window !== "undefined" ? Math.min(3, Math.max(1, window.devicePixelRatio || 1)) : 2
    const maps = useMemo(
        () => (mounted ? buildMaps(geo, glass, shadow, dpr) : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [mounted, geo, dpr, glass.thickness, glass.bezel, glass.ior, glass.magnify, shadow.opacity, shadow.blur, shadow.offsetY]
    )

    const version = useRef(0)
    const filterId = useMemo(() => {
        version.current++
        return "lgc" + reactId.replace(/[^a-zA-Z0-9_-]/g, "") + "v" + version.current
    }, [maps, glass.dispersion, glass.frost, glass.saturation, glass.brightness])

    const refraction = mode === "refraction" || (mode === "auto" && chromium)

    const rootRef = useRef<HTMLDivElement>(null)
    const specRef = useRef<HTMLCanvasElement>(null)
    const dispRefs = useRef<(SVGFEDisplacementMapElement | null)[]>([])
    const areaRef = useRef<HTMLDivElement>(null)
    const areaId = "lgp" + reactId.replace(/[^a-zA-Z0-9_-]/g, "")
    const outlineSpec = useMemo(() => (mounted ? makeOutline(outline, outlineWidth) : null), [mounted, outline, outlineWidth])
    const lightRef = useRef(light)
    const motionRef = useRef(motion)
    const scopeRef = useRef({ scope, nativeOnText })
    const outlineRef = useRef(outlineSpec)
    lightRef.current = light
    motionRef.current = motion
    scopeRef.current = { scope, nativeOnText }
    outlineRef.current = outlineSpec
    const sim = useRef({
        seen: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        tx: 0,
        ty: 0,
        ptx: 0,
        pty: 0,
        pvx: 0,
        pvy: 0,
        dirX: 1,
        dirY: 0,
        stretch: 0,
        stretchV: 0,
        scale: 1,
        scaleV: 0,
        opacity: 0,
        visible: false,
        pressed: false,
        hovering: false,
        drawnAngle: NaN,
        drawnBoost: NaN,
        lightAngle: light.angle,
    })

    // Static specular draw (canvas preview, and whenever lighting props change).
    useEffect(() => {
        if (!maps || !outlineSpec) return
        drawSpecular(specRef.current, maps.spec, light, light.angle, 1, outlineSpec)
        sim.current.drawnAngle = light.angle
        sim.current.drawnBoost = 1
    }, [maps, outlineSpec, light.intensity, light.angle, light.rim, light.sharpness, mounted, enabled, filterId])

    // Hide the system cursor only where the glass pointer is shown:
    //  • Component — this component's own wrapper and its content, nothing else.
    //  • Entire Page — an explicit opt-in, keyed to an attribute this component
    //    sets on <html> and removes on unmount, so turning it off (or deleting
    //    the component) restores the normal cursor immediately.
    // Text fields keep the native text cursor unless "Text Fields" is turned off.
    // Never applied in the editor, canvas, thumbnails or exports.
    useEffect(() => {
        if (isEditor || !enabled || !hideCursor) return
        const notText = nativeOnText ? NOT_TEXT_FIELD : ""
        const html = document.documentElement
        let selector: string
        if (scope === "page") {
            html.setAttribute("data-lgp-page", areaId)
            const sel = `html[data-lgp-page="${areaId}"]`
            selector = `${sel}, ${sel} *${notText}`
        } else {
            const sel = `[data-lgp-area="${areaId}"]`
            selector = `${sel}, ${sel} *${notText}`
        }
        const el = document.createElement("style")
        el.setAttribute("data-lgp-style", areaId)
        el.textContent = `${selector} { cursor: none !important; }`
        document.head.appendChild(el)
        return () => {
            el.remove()
            if (html.getAttribute("data-lgp-page") === areaId) html.removeAttribute("data-lgp-page")
        }
    }, [isEditor, enabled, hideCursor, scope, nativeOnText, areaId])

    // Pointer tracking + spring simulation.
    useEffect(() => {
        if (isEditor || !enabled || !maps) return
        const root = rootRef.current
        if (!root) return
        const s = sim.current
        const originX = maps.pad + geo.hotX
        const originY = maps.pad + geo.hotY
        root.style.transformOrigin = `${originX}px ${originY}px`

        // Is the glass pointer shown for this target? In Component scope only
        // inside our own wrapper; in both scopes, not over text fields (which
        // keep the native caret cursor).
        const shownFor = (t: Element | null) => {
            const { scope: sc, nativeOnText: nt } = scopeRef.current
            const inArea = sc === "page" || !!(t && areaRef.current && areaRef.current.contains(t))
            const onText = nt && !!(t && typeof t.closest === "function" && t.closest(TEXT_FIELDS))
            return inArea && !onText
        }
        const evaluate = (target: EventTarget | null) => {
            const t = target && (target as Node).nodeType === 1 ? (target as Element) : null
            const visible = shownFor(t)
            const hovering = visible && !!(t && typeof t.closest === "function" && t.closest(INTERACTIVE))
            if (visible !== s.visible || hovering !== s.hovering) {
                s.visible = visible
                s.hovering = hovering
                start()
            }
        }

        const onMove = (e: PointerEvent) => {
            if (e.pointerType === "touch" && disableOnTouch) return
            s.tx = e.clientX
            s.ty = e.clientY
            if (!s.seen) {
                s.seen = true
                s.x = s.ptx = s.tx
                s.y = s.pty = s.ty
            }
            evaluate(e.target)
            // A pointer event means the cursor is inside the viewport again.
            offscreen = false
            start()
        }
        const onDown = (e: PointerEvent) => {
            if (e.button === 0) s.pressed = true
            onMove(e)
        }
        const onUp = () => {
            s.pressed = false
            start()
        }
        const onOver = (e: Event) => evaluate(e.target)
        const onOut = (e: MouseEvent) => {
            if (!e.relatedTarget) {
                s.visible = false
                start()
            }
        }
        const onBlur = () => {
            s.pressed = false
            s.visible = false
            start()
        }

        // The loop only runs when there is something to animate and the cursor can
        // actually be seen: it stops when the page is hidden, when the cursor
        // leaves the viewport, and whenever every spring has settled. Pointer
        // events and the observers below restart it.
        let raf = 0
        let last = performance.now()
        let offscreen = false
        let pageHidden = typeof document !== "undefined" && document.hidden

        const start = () => {
            if (raf || offscreen || pageHidden) return
            last = performance.now()
            raf = requestAnimationFrame(tick)
        }
        const stop = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
        }

        const onVisibility = () => {
            pageHidden = document.hidden
            if (pageHidden) stop()
            else start()
        }
        document.addEventListener("visibilitychange", onVisibility)

        // Pause when the cursor itself is outside the viewport. This only ever
        // pauses — waking is handled by pointer events, so the cursor can never
        // be stuck offscreen waiting for an observer callback.
        let observer: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    const visible = entries[entries.length - 1].isIntersecting
                    offscreen = !visible
                    if (offscreen) stop()
                    else start()
                },
                { threshold: 0 }
            )
            observer.observe(root)
        }

        window.addEventListener("pointermove", onMove, { passive: true })
        window.addEventListener("pointerdown", onDown, { passive: true })
        window.addEventListener("pointerup", onUp, { passive: true })
        window.addEventListener("blur", onBlur)
        document.addEventListener("pointerover", onOver, { passive: true })
        document.addEventListener("mouseout", onOut)

        const spring = (x: number, v: number, target: number, k: number, zeta: number, dt: number) => {
            const c = 2 * zeta * Math.sqrt(k)
            const steps = 3
            const h = dt / steps
            for (let i = 0; i < steps; i++) {
                v += (k * (target - x) - c * v) * h
                x += v * h
            }
            return [x, v]
        }

        // Defined before `start()` runs; the observers below only fire asynchronously.
        const tick = (now: number) => {
            raf = 0
            const dt = Math.min(Math.max((now - last) / 1000, 1 / 240), 1 / 30)
            last = now
            const m = motionRef.current
            const l = lightRef.current

            // Pointer velocity (smoothed).
            const ivx = (s.tx - s.ptx) / dt
            const ivy = (s.ty - s.pty) / dt
            s.ptx = s.tx
            s.pty = s.ty
            s.pvx += (ivx - s.pvx) * 0.35
            s.pvy += (ivy - s.pvy) * 0.35

            // Follow.
            let vx: number
            let vy: number
            if (m.follow <= 0) {
                s.x = s.tx
                s.y = s.ty
                vx = s.pvx
                vy = s.pvy
            } else {
                const k = 1600 - Math.min(100, m.follow) * 14.5
                const zeta = 1 - Math.max(0, Math.min(1, m.bounce)) * 0.75
                ;[s.x, s.vx] = spring(s.x, s.vx, s.tx, k, zeta, dt)
                ;[s.y, s.vy] = spring(s.y, s.vy, s.ty, k, zeta, dt)
                vx = s.vx
                vy = s.vy
            }

            // Gel stretch along the direction of travel.
            const speed = Math.hypot(vx, vy)
            if (speed > 40) {
                s.dirX += (vx / speed - s.dirX) * 0.25
                s.dirY += (vy / speed - s.dirY) * 0.25
                const dl = Math.hypot(s.dirX, s.dirY) || 1
                s.dirX /= dl
                s.dirY /= dl
            }
            const stretchTarget = (Math.max(0, m.stretch) / 100) * 0.45 * (1 - Math.exp(-speed / 1400))
            ;[s.stretch, s.stretchV] = spring(s.stretch, s.stretchV, stretchTarget, 320, 0.32, dt)

            // Press / hover scale with a bouncy spring.
            const scaleTarget = (s.pressed ? m.pressScale : 1) * (s.hovering ? m.hoverScale : 1)
            ;[s.scale, s.scaleV] = spring(s.scale, s.scaleV, scaleTarget, 520, 0.42, dt)

            const opacityTarget = s.visible ? 1 : 0
            s.opacity += (opacityTarget - s.opacity) * (1 - Math.exp(-dt * 16))

            // The highlight swings with horizontal motion.
            const targetAngle = l.angle + (l.dynamic ? Math.max(-35, Math.min(35, s.pvx * 0.02)) : 0)
            s.lightAngle += (targetAngle - s.lightAngle) * (1 - Math.exp(-dt * 10))

            // Once every spring is within an imperceptible distance of its
            // resting value, snap to it and idle until the next pointer event —
            // a still cursor should cost nothing.
            const settled =
                Math.abs(s.tx - s.x) < 0.05 &&
                Math.abs(s.ty - s.y) < 0.05 &&
                Math.abs(s.vx) < 1 &&
                Math.abs(s.vy) < 1 &&
                Math.abs(s.stretch) < 0.002 &&
                Math.abs(s.stretchV) < 0.02 &&
                Math.abs(s.scale - scaleTarget) < 0.002 &&
                Math.abs(s.scaleV) < 0.02 &&
                Math.abs(s.opacity - opacityTarget) < 0.004 &&
                Math.abs(s.lightAngle - targetAngle) < 0.5
            if (settled) {
                s.x = s.tx
                s.y = s.ty
                s.vx = s.vy = 0
                s.pvx = s.pvy = 0
                s.stretch = s.stretchV = 0
                s.scale = scaleTarget
                s.scaleV = 0
                s.opacity = opacityTarget
                s.lightAngle = targetAngle
            }

            const st = settled ? 0 : Math.max(-0.4, s.stretch)
            const ang = Math.atan2(s.dirY, s.dirX)
            root.style.opacity = s.opacity.toFixed(3)
            root.style.transform =
                `translate3d(${(s.x - originX).toFixed(2)}px, ${(s.y - originY).toFixed(2)}px, 0) ` +
                `rotate(${ang.toFixed(4)}rad) scale(${(1 + st).toFixed(4)}, ${(1 / (1 + st)).toFixed(4)}) ` +
                `rotate(${(-ang).toFixed(4)}rad) scale(${s.scale.toFixed(4)})`

            // Liquify on press: bend light a little harder while scaled up.
            const lift = Math.max(0, s.scale - 1)
            for (const el of dispRefs.current) {
                if (!el) continue
                const base = Number(el.getAttribute("data-base")) || 0
                const next = (base * (1 + lift * 0.8)).toFixed(2)
                if (el.getAttribute("scale") !== next) el.setAttribute("scale", next)
            }

            const boost = 1 + lift * 1.5
            if (Math.abs(s.lightAngle - s.drawnAngle) > (settled ? 0.05 : 1) || Math.abs(boost - s.drawnBoost) > 0.03) {
                if (outlineRef.current) drawSpecular(specRef.current, maps.spec, l, s.lightAngle, boost, outlineRef.current)
                s.drawnAngle = s.lightAngle
                s.drawnBoost = boost
            }

            if (!settled) raf = requestAnimationFrame(tick)
        }
        start()

        return () => {
            stop()
            if (observer) observer.disconnect()
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("blur", onBlur)
            document.removeEventListener("pointerover", onOver)
            document.removeEventListener("mouseout", onOut)
        }
    }, [isEditor, enabled, maps, geo, disableOnTouch, filterId])

    const body = maps ? (
        <GlassBody
            maps={maps}
            filterId={filterId}
            refraction={refraction}
            glass={glass}
            fill={fill}
            specRef={specRef}
            dispRefs={dispRefs}
        />
    ) : null

    // Optional content placed inside the component (Component scope). It fills
    // the component so the glass pointer covers exactly that content.
    const slot = React.Children.toArray(content)[0]
    const slotEl = React.isValidElement(slot)
        ? React.cloneElement(slot as React.ReactElement<any>, {
              style: { ...((slot as React.ReactElement<any>).props.style || {}), width: "100%", height: "100%" },
          })
        : null
    const isComponentScope = scope !== "page"

    if (isEditor) {
        // Static preview for the canvas — no listeners, no global styles.
        return (
            <div
                style={{
                    ...props.style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    pointerEvents: isComponentScope ? undefined : "none",
                }}
            >
                {isComponentScope && slotEl}
                {isComponentScope && !slotEl && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            border: "1px dashed rgba(136, 136, 136, 0.5)",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            padding: 12,
                            boxSizing: "border-box",
                            color: "rgba(136, 136, 136, 0.9)",
                            font: "500 12px/1.3 Inter, system-ui, sans-serif",
                            textAlign: "center",
                        }}
                    >
                        Glass pointer area — resize to cover a region, or add content in the Content slot
                    </div>
                )}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    {body}
                </div>
            </div>
        )
    }

    const portal =
        mounted && enabled && body
            ? createPortal(
                  <div
                      ref={rootRef}
                      aria-hidden="true"
                      style={{
                          position: "fixed",
                          left: 0,
                          top: 0,
                          zIndex: 2147483647,
                          pointerEvents: "none",
                          opacity: 0,
                          willChange: "transform",
                      }}
                  >
                      {body}
                  </div>,
                  document.body
              )
            : null

    if (isComponentScope) {
        // The pointer is confined to this wrapper; nothing outside it changes.
        return (
            <div
                ref={areaRef}
                data-lgp-area={areaId}
                style={{ ...props.style, position: "relative", width: "100%", height: "100%" }}
            >
                {slotEl}
                {portal}
            </div>
        )
    }

    return (
        <div style={{ ...props.style, position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
            {portal}
        </div>
    )
}

LiquidGlassCursor.displayName = "Liquid Glass Pointer"

addPropertyControls(LiquidGlassCursor, {
    scope: {
        type: ControlType.Enum,
        title: "Area",
        options: ["component", "page"],
        optionTitles: ["Component", "Entire Page"],
        defaultValue: "component",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        description:
            "Component: only while hovering this component. Entire Page: replaces the cursor site-wide. Only runs in Preview and on the published site.",
    },
    content: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 1,
        hidden: (p: any) => p.scope === "page",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["arrow", "circle", "square"],
        optionTitles: ["Arrow", "Circle", "Square"],
        defaultValue: "arrow",
        displaySegmentedControl: true,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 22,
        min: 12,
        max: 240,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 14,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        hidden: (p: any) => p.shape !== "square",
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: FILL,
        description: "Tint inside the glass. Use a darker or more opaque fill on light backgrounds.",
    },
    outline: {
        type: ControlType.Color,
        title: "Outline",
        defaultValue: OUTLINE,
    },
    outlineWidth: {
        type: ControlType.Number,
        title: "Outline Width",
        defaultValue: OUTLINE_WIDTH,
        min: 0,
        max: 6,
        step: 0.25,
        unit: "px",
    },
    glass: {
        type: ControlType.Object,
        title: "Glass",
        icon: "effect",
        controls: {
            thickness: { type: ControlType.Number, title: "Thickness", defaultValue: GLASS.thickness, min: 0, max: 80, step: 0.5, unit: "px" },
            bezel: { type: ControlType.Number, title: "Bezel", defaultValue: GLASS.bezel, min: 1, max: 60, step: 0.5, unit: "px" },
            ior: { type: ControlType.Number, title: "Refr. Index", defaultValue: GLASS.ior, min: 1, max: 3, step: 0.01 },
            magnify: { type: ControlType.Number, title: "Magnify", defaultValue: GLASS.magnify, min: -0.5, max: 0.8, step: 0.01 },
            dispersion: { type: ControlType.Number, title: "Dispersion", defaultValue: GLASS.dispersion, min: 0, max: 1, step: 0.01 },
            frost: { type: ControlType.Number, title: "Frost", defaultValue: GLASS.frost, min: 0, max: 12, step: 0.1, unit: "px" },
            saturation: { type: ControlType.Number, title: "Saturation", defaultValue: GLASS.saturation, min: 0, max: 3, step: 0.01 },
            brightness: { type: ControlType.Number, title: "Brightness", defaultValue: GLASS.brightness, min: 0.5, max: 1.6, step: 0.01 },
        },
    },
    light: {
        type: ControlType.Object,
        title: "Light",
        icon: "effect",
        controls: {
            intensity: { type: ControlType.Number, title: "Intensity", defaultValue: LIGHT.intensity, min: 0, max: 2, step: 0.01 },
            angle: { type: ControlType.Number, title: "Angle", defaultValue: LIGHT.angle, min: -180, max: 180, step: 1, unit: "°" },
            rim: { type: ControlType.Number, title: "Rim Width", defaultValue: LIGHT.rim, min: 0.5, max: 30, step: 0.5, unit: "px" },
            sharpness: { type: ControlType.Number, title: "Sharpness", defaultValue: LIGHT.sharpness, min: 0.5, max: 10, step: 0.1 },
            dynamic: { type: ControlType.Boolean, title: "Reactive", defaultValue: LIGHT.dynamic },
        },
    },
    shadow: {
        type: ControlType.Object,
        title: "Shadow",
        icon: "effect",
        controls: {
            opacity: { type: ControlType.Number, title: "Opacity", defaultValue: SHADOW.opacity, min: 0, max: 1, step: 0.01 },
            blur: { type: ControlType.Number, title: "Blur", defaultValue: SHADOW.blur, min: 0, max: 40, step: 0.5, unit: "px" },
            offsetY: { type: ControlType.Number, title: "Offset Y", defaultValue: SHADOW.offsetY, min: -20, max: 20, step: 0.5, unit: "px" },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        controls: {
            follow: { type: ControlType.Number, title: "Follow Lag", defaultValue: MOTION.follow, min: 0, max: 100, step: 1 },
            bounce: { type: ControlType.Number, title: "Bounce", defaultValue: MOTION.bounce, min: 0, max: 1, step: 0.01 },
            stretch: { type: ControlType.Number, title: "Stretch", defaultValue: MOTION.stretch, min: 0, max: 100, step: 1 },
            pressScale: { type: ControlType.Number, title: "Press Scale", defaultValue: MOTION.pressScale, min: 0.5, max: 2, step: 0.01 },
            hoverScale: { type: ControlType.Number, title: "Hover Scale", defaultValue: MOTION.hoverScale, min: 0.5, max: 2, step: 0.01 },
        },
    },
    mode: {
        type: ControlType.Enum,
        title: "Render",
        options: ["auto", "refraction", "frosted"],
        optionTitles: ["Auto", "Refraction", "Frosted"],
        defaultValue: "auto",
        description: "Auto uses true refraction in Chromium browsers and frosted glass in Safari/Firefox.",
    },
    hideCursor: {
        type: ControlType.Boolean,
        title: "Hide System",
        defaultValue: true,
        description: "Hides the native cursor only where the glass pointer is shown.",
    },
    nativeOnText: {
        type: ControlType.Boolean,
        title: "Text Fields",
        enabledTitle: "Native",
        disabledTitle: "Glass",
        defaultValue: true,
    },
    disableOnTouch: {
        type: ControlType.Boolean,
        title: "Touch Off",
        defaultValue: true,
    },
})
