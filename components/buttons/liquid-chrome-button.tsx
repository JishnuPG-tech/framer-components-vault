/**
 * Liquid Chrome Button — Framer code component
 *
 * A crisp mono-type button wrapped in a living "liquid chrome" border: a noise
 * field flows around the edge, mapped through a color ramp (silver on dark,
 * ink on light), with a tiny chromatic split (blue / orange fringes) wherever
 * the field turns sharp, like light dispersing on polished metal. Hover rolls
 * the label up like a slot machine and speeds the border up.
 *
 * How it works: the border is computed on the CPU, not WebGL. The noise is
 * sampled once per pixel along the perimeter (a 1D strip, three channels with
 * a slight offset for the fringe) and written only to the ring pixels of a
 * small canvas. No GL contexts, no shaders to compile, works everywhere.
 *
 * - Pauses when off-screen / tab hidden. Hover speed-up is smoothed.
 * - `useIsStaticRenderer`: canvas / thumbnails / exports get one frozen frame
 *   (no loop, no observers).
 * - Colors: variant presets, or your own color ramp (2 to 6 colors).
 * - Fully typed props, sanitized control data, safe links, real <a>/<button>.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 48
 * @framerDisableUnlink
 */
import * as React from "react"
import { memo, useEffect, useId, useMemo, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/** The subset of CSS the Framer Font control produces. */
export type FontValue = Pick<
    React.CSSProperties,
    | "fontFamily"
    | "fontSize"
    | "fontWeight"
    | "fontStyle"
    | "letterSpacing"
    | "lineHeight"
    | "textTransform"
    | "textDecoration"
    | "fontFeatureSettings"
    | "fontVariationSettings"
>

export type Variant = "dark" | "light"

export interface LiquidChromeButtonProps {
    label?: string
    link?: string
    linkTarget?: "_self" | "_blank"
    variant?: Variant

    // Colors
    fillColor?: string
    textColor?: string
    useCustomColors?: boolean
    colors?: string[]

    // Shape
    radius?: number
    borderWidth?: number
    paddingX?: number
    shadow?: number

    // Border shader
    animateBorder?: boolean
    borderSpeed?: number
    detail?: number
    contrast?: number
    fringe?: number
    hoverSpeed?: number
    maxDpr?: number
    respectReducedMotion?: boolean

    // Text
    font?: FontValue
    uppercase?: boolean
    rollOnHover?: boolean
    rollDuration?: number
    rollStagger?: number

    // Behavior
    press?: number
    disabled?: boolean
    onClick?: () => void

    width?: number | string
    height?: number | string
    style?: React.CSSProperties
}

/* ----------------------------------------------------------------------------
 * Presets + sanitizers
 * ------------------------------------------------------------------------- */

interface Palette {
    fill: string
    text: string
    ramp: string[]
    shadow: (k: number) => string
}

const PALETTES: Record<Variant, Palette> = {
    dark: {
        fill: "#0b0908",
        text: "#f4f1ee",
        ramp: ["#34343a", "#8d8d97", "#ffffff"],
        shadow: (k) =>
            `0 1px 2px rgba(0,0,0,${0.28 * k}), 0 8px 20px -10px rgba(0,0,0,${0.5 * k})`,
    },
    light: {
        fill: "#f6f6f7",
        text: "#0c0c10",
        ramp: ["#dcdce2", "#7a7a86", "#07070c"],
        shadow: (k) =>
            `0 1px 2px rgba(0,0,0,${0.08 * k}), 0 10px 22px -10px rgba(0,0,0,${0.22 * k})`,
    },
}

const CUSTOM_DEFAULT = ["#0a0a0a", "#8b5cf6", "#22d3ee", "#ffffff"]

const DEFAULT_FONT: FontValue = {
    fontFamily:
        '"Geist Mono", "JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
    fontSize: "14px",
    fontWeight: 500,
    letterSpacing: "0.08em",
    lineHeight: 1.2,
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null
const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))
const num = (v: unknown, fallback: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? clamp(v, min, max) : fallback
const bool = (v: unknown, fallback: boolean) =>
    typeof v === "boolean" ? v : fallback
const color = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v : fallback

/** Only allow normal navigation targets (no `javascript:` etc.) */
const safeLink = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined
    const link = v.trim()
    if (!link) return undefined
    if (/^(https?:|mailto:|tel:|\/|\.|#)/i.test(link)) return link
    if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return undefined
    return link
}

function sanitizeColors(raw: unknown): string[] | null {
    if (!Array.isArray(raw)) return null
    const out = (raw as unknown[])
        .filter(
            (c): c is string => typeof c === "string" && c.trim().length > 0
        )
        .slice(0, 6)
    return out.length >= 2 ? out : null
}

/* ----------------------------------------------------------------------------
 * Color resolution (handles hex, rgb(), hsl(), oklch(), Framer var(--token))
 * ------------------------------------------------------------------------- */

let probe: CanvasRenderingContext2D | null = null
function getProbe(): CanvasRenderingContext2D | null {
    if (probe) return probe
    if (typeof document === "undefined") return null
    const c = document.createElement("canvas")
    c.width = c.height = 1
    probe = c.getContext("2d", { willReadFrequently: true })
    return probe
}

function resolveRGB(
    value: string,
    host: HTMLElement
): [number, number, number] {
    let css = value
    if (/var\(/.test(value)) {
        const span = document.createElement("span")
        span.style.color = value
        host.appendChild(span)
        css = getComputedStyle(span).color || value
        host.removeChild(span)
    }
    const ctx = getProbe()
    if (!ctx) return [255, 255, 255]
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = "#000"
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2]]
}

/** 256-step lookup table interpolated through evenly spaced stops */
function buildRamp(stops: [number, number, number][]): Uint8ClampedArray {
    const out = new Uint8ClampedArray(256 * 3)
    const n = stops.length - 1
    for (let i = 0; i < 256; i++) {
        const p = (i / 255) * n
        const k = Math.min(n - 1, Math.floor(p))
        const t = p - k
        for (let c = 0; c < 3; c++)
            out[i * 3 + c] = stops[k][c] + (stops[k + 1][c] - stops[k][c]) * t
    }
    return out
}

/* ----------------------------------------------------------------------------
 * Noise
 * ------------------------------------------------------------------------- */

function hash(ix: number, iy: number, seed: number): number {
    let h =
        Math.imul(ix, 374761393) ^
        Math.imul(iy, 668265263) ^
        Math.imul(seed, 2147483647)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** Value noise, periodic along x (period = `cells`) so the loop around the border is seamless */
function noise(x: number, y: number, cells: number, seed: number): number {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const u = fx * fx * (3 - 2 * fx)
    const v = fy * fy * (3 - 2 * fy)
    const x0 = ((xi % cells) + cells) % cells
    const x1 = (x0 + 1) % cells
    const a = hash(x0, yi, seed)
    const b = hash(x1, yi, seed)
    const c = hash(x0, yi + 1, seed)
    const d = hash(x1, yi + 1, seed)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/* ----------------------------------------------------------------------------
 * BorderRenderer — computes the ring once, then repaints only the ring pixels
 * ------------------------------------------------------------------------- */

interface ShaderParams {
    ramp: Uint8ClampedArray
    detail: number // 0.4 .. 3  (features per length)
    contrast: number // 0 .. 1
    fringe: number // 0 .. 1
}

class BorderRenderer {
    private ctx: CanvasRenderingContext2D
    private img: ImageData | null = null
    private ringIdx = new Int32Array(0)
    private ringS = new Float32Array(0)
    private ringA = new Uint8ClampedArray(0)
    private pCss = 1
    private L = 64
    private lutR = new Float32Array(64)
    private lutG = new Float32Array(64)
    private lutB = new Float32Array(64)
    private seed: number

    constructor(
        private canvas: HTMLCanvasElement,
        seed: number
    ) {
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("2D canvas unavailable")
        this.ctx = ctx
        this.seed = seed | 0
    }

    setSize(
        cssW: number,
        cssH: number,
        radius: number,
        borderWidth: number,
        dpr: number
    ) {
        const W = Math.max(2, Math.round(cssW * dpr))
        const H = Math.max(2, Math.round(cssH * dpr))
        this.canvas.width = W
        this.canvas.height = H
        this.img = this.ctx.createImageData(W, H)

        const hx = W / 2
        const hy = H / 2
        const r = Math.max(0.01, Math.min(radius * dpr, hx, hy))
        const bw = borderWidth * dpr
        const Lx = 2 * (hx - r)
        const Ly = 2 * (hy - r)
        const P = 2 * Lx + 2 * Ly + 2 * Math.PI * r
        const HP = Math.PI / 2

        const idx: number[] = []
        const sv: number[] = []
        const av: number[] = []
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const px = x + 0.5 - hx
                const py = y + 0.5 - hy
                const qx = Math.abs(px) - (hx - r)
                const qy = Math.abs(py) - (hy - r)
                const sd =
                    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
                    Math.min(Math.max(qx, qy), 0) -
                    r
                if (sd < -bw - 1) continue
                const a = clamp(0.5 + (bw / 2 - Math.abs(sd + bw / 2)), 0, 1)
                if (a <= 0.01) continue

                // distance travelled clockwise from the start of the top edge
                let s: number
                if (qx > 0 && qy > 0) {
                    if (px > 0 && py < 0) s = Lx + r * Math.atan2(qx, qy)
                    else if (px > 0)
                        s = Lx + HP * r + Ly + r * Math.atan2(qy, qx)
                    else if (py >= 0)
                        s = 2 * Lx + Math.PI * r + Ly + r * Math.atan2(qx, qy)
                    else
                        s =
                            2 * Lx +
                            2 * Ly +
                            3 * HP * r +
                            r * Math.atan2(qy, qx)
                } else if (qx > qy) {
                    s =
                        px > 0
                            ? Lx + HP * r + (py + (hy - r))
                            : 2 * Lx + 3 * HP * r + Ly + (hy - r - py)
                } else {
                    s =
                        py < 0
                            ? px + (hx - r)
                            : Lx + Math.PI * r + Ly + (hx - r - px)
                }
                idx.push(y * W + x)
                sv.push((((s % P) + P) % P) / P)
                av.push(Math.round(a * 255))
            }
        }
        this.ringIdx = Int32Array.from(idx)
        this.ringS = Float32Array.from(sv)
        this.ringA = Uint8ClampedArray.from(av)
        this.pCss = P / dpr
        this.L = clamp(Math.round(this.pCss), 64, 4096)
        this.lutR = new Float32Array(this.L)
        this.lutG = new Float32Array(this.L)
        this.lutB = new Float32Array(this.L)
    }

    /** Layered periodic noise, shaped into chrome-like bands */
    private field(s: number, time: number, cells1: number, k: number): number {
        const P = this.pCss
        const c2 = Math.round(cells1 * 2.4)
        const c3 = Math.round(cells1 * 5.1)
        const n1 = noise(
            (s / P) * cells1 + time * cells1 * 0.045,
            time * 0.7,
            cells1,
            this.seed
        )
        const n2 = noise(
            (s / P) * c2 - time * c2 * 0.03,
            time * 1.2 + 17,
            c2,
            this.seed + 7
        )
        const n3 = noise(
            (s / P) * c3 + time * c3 * 0.04,
            time * 1.9 + 41,
            c3,
            this.seed + 13
        )
        const n = n1 * 0.42 + n2 * 0.36 + n3 * 0.22
        // bias below 0.5 so most of the edge reads as bright metal with dark gaps
        return 1 / (1 + Math.exp(-(n - 0.2) * k))
    }

    draw(time: number, p: ShaderParams) {
        const img = this.img
        if (!img) return
        const L = this.L
        const cells1 = Math.max(3, Math.round((this.pCss / 62) * p.detail))
        const k = 12 + p.contrast * 42
        const delta = p.fringe * 2.4 // css px between the R and B samples
        for (let i = 0; i < L; i++) {
            const s = (i / L) * this.pCss
            this.lutG[i] = this.field(s, time, cells1, k)
            this.lutR[i] = delta
                ? this.field(s + delta, time, cells1, k)
                : this.lutG[i]
            this.lutB[i] = delta
                ? this.field(s - delta, time, cells1, k)
                : this.lutG[i]
        }
        const data = img.data
        const ramp = p.ramp
        const { ringIdx, ringS, ringA, lutR, lutG, lutB } = this
        for (let j = 0; j < ringIdx.length; j++) {
            const f = ringS[j] * L
            const i0 = f | 0
            const t = f - i0
            const i1 = i0 + 1 >= L ? 0 : i0 + 1
            const vr = lutR[i0] + (lutR[i1] - lutR[i0]) * t
            const vg = lutG[i0] + (lutG[i1] - lutG[i0]) * t
            const vb = lutB[i0] + (lutB[i1] - lutB[i0]) * t
            const o = ringIdx[j] * 4
            data[o] = ramp[((vr * 255 + 0.5) | 0) * 3]
            data[o + 1] = ramp[((vg * 255 + 0.5) | 0) * 3 + 1]
            data[o + 2] = ramp[((vb * 255 + 0.5) | 0) * 3 + 2]
            data[o + 3] = ringA[j]
        }
        this.ctx.putImageData(img, 0, 0)
    }
}

/* ----------------------------------------------------------------------------
 * Shared off-screen observer (one for every button on the page)
 * ------------------------------------------------------------------------- */

const visibilityCallbacks = new WeakMap<Element, (visible: boolean) => void>()
let sharedIO: IntersectionObserver | null = null
function observeVisibility(
    el: Element,
    cb: (visible: boolean) => void
): () => void {
    if (typeof IntersectionObserver === "undefined") return () => {}
    if (!sharedIO) {
        sharedIO = new IntersectionObserver((entries) => {
            for (const e of entries)
                visibilityCallbacks.get(e.target)?.(e.isIntersecting)
        })
    }
    visibilityCallbacks.set(el, cb)
    sharedIO.observe(el)
    return () => {
        visibilityCallbacks.delete(el)
        sharedIO?.unobserve(el)
    }
}

/* ----------------------------------------------------------------------------
 * Rolling label (two identical lines; CSS swaps them on hover)
 * ------------------------------------------------------------------------- */

const Letters = memo(function Letters({ text }: { text: string }) {
    const chars = useMemo(() => Array.from(text), [text])
    return (
        <>
            {chars.map((c, i) => (
                <span
                    key={i}
                    className="ch"
                    style={{ ["--i" as string]: i } as React.CSSProperties}
                >
                    {c === " " ? " " : c}
                </span>
            ))}
        </>
    )
})

/* ----------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

const STATIC_TIME = 4.2

export default function LiquidChromeButton(props: LiquidChromeButtonProps) {
    const isStatic = useIsStaticRenderer()
    const reactId = useId()
    const uid = "lcb" + reactId.replace(/[^a-zA-Z0-9]/g, "")
    const elRef = useRef<HTMLElement>(null)
    const cvRef = useRef<HTMLCanvasElement>(null)

    /* ---- sanitized props ---- */
    const label = typeof props.label === "string" ? props.label : "Get started"
    const link = safeLink(props.link)
    const linkTarget = props.linkTarget === "_blank" ? "_blank" : "_self"
    const variant: Variant = props.variant === "light" ? "light" : "dark"
    const pal = PALETTES[variant]
    const fill = color(props.fillColor, pal.fill)
    const text = color(props.textColor, pal.text)
    const custom = bool(props.useCustomColors, false)
        ? sanitizeColors(props.colors)
        : null
    const rampColors = custom ?? pal.ramp
    const rampKey = rampColors.join("|")
    const radius = num(props.radius, 6, 0, 80)
    const bw = num(props.borderWidth, 1.5, 0.5, 6)
    const paddingX = num(props.paddingX, 24, 0, 120)
    const shadow = num(props.shadow, 1, 0, 2)
    const animate = bool(props.animateBorder, true)
    const speed = num(props.borderSpeed, 1, 0.1, 6)
    const detail = num(props.detail, 1, 0.4, 3)
    const contrast = num(props.contrast, 0.6, 0, 1)
    const fringe = num(props.fringe, 0.8, 0, 1)
    const hoverSpeed = num(props.hoverSpeed, 2.5, 1, 6)
    const maxDpr = num(props.maxDpr, 2, 1, 3)
    const respectRM = bool(props.respectReducedMotion, false)
    const font: FontValue = isRecord(props.font)
        ? { ...DEFAULT_FONT, ...props.font }
        : DEFAULT_FONT
    const uppercase = bool(props.uppercase, true)
    const roll = bool(props.rollOnHover, true)
    const rollDuration = num(props.rollDuration, 0.45, 0.1, 1.5)
    const rollStagger = num(props.rollStagger, 0.014, 0, 0.08)
    const press = num(props.press, 0.98, 0.85, 1)
    const disabled = bool(props.disabled, false)

    // distinct noise per button instance
    const seed = useMemo(() => {
        let h = 7
        for (let i = 0; i < reactId.length; i++)
            h = (Math.imul(h, 31) + reactId.charCodeAt(i)) | 0
        return h
    }, [reactId])

    /* ---- border shader: sizing, loop, hover speed-up, visibility ---- */
    const paramsRef = useRef({ detail, contrast, fringe, speed, hoverSpeed })
    paramsRef.current = { detail, contrast, fringe, speed, hoverSpeed }

    useEffect(() => {
        const el = elRef.current
        const cv = cvRef.current
        if (!el || !cv) return
        let renderer: BorderRenderer
        try {
            renderer = new BorderRenderer(cv, seed)
        } catch {
            return // no 2D canvas: the CSS fallback outline stays
        }

        const ramp = buildRamp(rampColors.map((c) => resolveRGB(c, el)))
        const reducedMq =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        const frozen = () =>
            isStatic || !animate || (respectRM && !!reducedMq?.matches)

        let time = STATIC_TIME + ((seed >>> 0) % 1000) / 50
        let rate = 1
        let target = 1
        let last = 0
        let raf = 0
        let visible = true

        const paint = () => {
            const p = paramsRef.current
            renderer.draw(time, {
                ramp,
                detail: p.detail,
                contrast: p.contrast,
                fringe: p.fringe,
            })
        }
        const schedule = () => {
            if (!raf && visible && !document.hidden && !frozen()) {
                last = performance.now()
                raf = requestAnimationFrame(frame)
            }
        }
        const frame = (now: number) => {
            raf = 0
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            rate += (target - rate) * (1 - Math.exp(-dt * 6))
            time += dt * rate * paramsRef.current.speed
            paint()
            schedule()
        }
        const resize = () => {
            const r = el.getBoundingClientRect()
            if (r.width < 2 || r.height < 2) return
            const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
            renderer.setSize(r.width, r.height, radius, bw, dpr)
            paint()
            el.setAttribute("data-ready", "")
        }
        resize()

        if (frozen()) return undefined

        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(resize)
                : null
        ro?.observe(el)
        const stopVis = observeVisibility(el, (v) => {
            visible = v
            if (v) schedule()
        })
        const onEnter = () => {
            target = paramsRef.current.hoverSpeed
        }
        const onLeave = () => {
            target = 1
        }
        const onVisibility = () => schedule()
        el.addEventListener("pointerenter", onEnter)
        el.addEventListener("pointerleave", onLeave)
        el.addEventListener("focus", onEnter)
        el.addEventListener("blur", onLeave)
        document.addEventListener("visibilitychange", onVisibility)
        schedule()

        return () => {
            if (raf) cancelAnimationFrame(raf)
            ro?.disconnect()
            stopVis()
            el.removeEventListener("pointerenter", onEnter)
            el.removeEventListener("pointerleave", onLeave)
            el.removeEventListener("focus", onEnter)
            el.removeEventListener("blur", onLeave)
            document.removeEventListener("visibilitychange", onVisibility)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, animate, respectRM, radius, bw, maxDpr, rampKey, seed])

    /* ---- scoped CSS ---- */
    const css = useMemo(() => {
        const sh = shadow > 0 ? pal.shadow(shadow) : "none"
        return `
.${uid}{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;
min-height:${Math.round(bw * 2 + 10)}px;padding:0 ${paddingX}px;border-radius:${radius}px;background:${fill};color:${text};cursor:${disabled ? "not-allowed" : "pointer"};
box-shadow:${sh};text-decoration:none;white-space:nowrap;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;
transition:transform .18s cubic-bezier(.22,1,.36,1);${disabled ? "opacity:.5;pointer-events:none;" : ""}}
.${uid}:active{transform:scale(${press})}
.${uid}:focus-visible{outline:2px solid ${variant === "dark" ? "#fff" : "#000"};outline-offset:3px}
.${uid} .fb{position:absolute;inset:0;border-radius:inherit;border:${bw}px solid ${variant === "dark" ? "rgba(255,255,255,.35)" : "rgba(10,10,20,.25)"};pointer-events:none}
.${uid}[data-ready] .fb{display:none}
.${uid} .cv{position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;pointer-events:none}
.${uid} .lbl{position:relative;display:grid;overflow:hidden;line-height:1.25;text-transform:${uppercase ? "uppercase" : "none"};padding:0.06em 0}
.${uid} .ln{grid-area:1/1;display:flex;justify-content:center}
.${uid} .ch{display:inline-block;transition:transform ${rollDuration}s cubic-bezier(.76,0,.24,1);transition-delay:calc(var(--i) * ${rollStagger}s)}
.${uid} .l2 .ch{transform:translateY(115%)}
${
    roll
        ? `.${uid}:focus-visible .l1 .ch{transform:translateY(-115%)}
.${uid}:focus-visible .l2 .ch{transform:translateY(0)}
@media (hover:hover){.${uid}:hover .l1 .ch{transform:translateY(-115%)}.${uid}:hover .l2 .ch{transform:translateY(0)}}`
        : ""
}
@media (prefers-reduced-motion:reduce){.${uid} .ch{transition:none}}
`
    }, [
        uid,
        shadow,
        pal,
        fill,
        text,
        radius,
        bw,
        paddingX,
        disabled,
        press,
        variant,
        uppercase,
        roll,
        rollDuration,
        rollStagger,
    ])

    const inner = (
        <>
            <style>{css}</style>
            <span className="fb" aria-hidden />
            <canvas ref={cvRef} className="cv" aria-hidden />
            <span className="lbl" style={font} aria-hidden>
                <span className="ln l1">
                    <Letters text={label} />
                </span>
                {roll && (
                    <span className="ln l2">
                        <Letters text={label} />
                    </span>
                )}
            </span>
        </>
    )

    const common = {
        className: uid,
        "aria-label": label || undefined,
        "aria-disabled": disabled || undefined,
        style: props.style,
    }

    if (link && !disabled) {
        return (
            <a
                {...common}
                ref={elRef as React.Ref<HTMLAnchorElement>}
                href={isStatic ? undefined : link}
                target={linkTarget}
                rel={
                    linkTarget === "_blank" ? "noopener noreferrer" : undefined
                }
                onClick={props.onClick}
            >
                {inner}
            </a>
        )
    }
    return (
        <button
            {...common}
            ref={elRef as React.Ref<HTMLButtonElement>}
            type="button"
            disabled={disabled}
            onClick={props.onClick}
        >
            {inner}
        </button>
    )
}

LiquidChromeButton.defaultProps = {
    width: 220,
    height: 48,
    label: "Get started",
    linkTarget: "_self",
    variant: "dark",
    useCustomColors: false,
    colors: CUSTOM_DEFAULT,
    radius: 6,
    borderWidth: 1.5,
    paddingX: 24,
    shadow: 1,
    animateBorder: true,
    borderSpeed: 1,
    detail: 1,
    contrast: 0.6,
    fringe: 0.8,
    hoverSpeed: 2.5,
    maxDpr: 2,
    respectReducedMotion: false,
    font: DEFAULT_FONT,
    uppercase: true,
    rollOnHover: true,
    rollDuration: 0.45,
    rollStagger: 0.014,
    press: 0.98,
    disabled: false,
}

/* ----------------------------------------------------------------------------
 * Property Controls
 * ------------------------------------------------------------------------- */

const noAnim = (p: LiquidChromeButtonProps) => p.animateBorder === false
const noRoll = (p: LiquidChromeButtonProps) => p.rollOnHover === false

addPropertyControls(LiquidChromeButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get started",
    },
    link: { type: ControlType.Link, title: "Link" },
    linkTarget: {
        type: ControlType.Enum,
        title: "Target",
        options: ["_self", "_blank"],
        optionTitles: ["Same tab", "New tab"],
        displaySegmentedControl: true,
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        displaySegmentedControl: true,
    },

    // Colors
    fillColor: { type: ControlType.Color, title: "Fill", optional: true },
    textColor: { type: ControlType.Color, title: "Text", optional: true },
    useCustomColors: {
        type: ControlType.Boolean,
        title: "Custom border",
        description:
            "Off = silver (dark) / ink (light). On = your own color ramp",
    },
    colors: {
        type: ControlType.Array,
        title: "Border colors",
        maxCount: 6,
        control: { type: ControlType.Color },
        defaultValue: CUSTOM_DEFAULT,
        description:
            "Dark to bright, 2 to 6 colors. The border field is mapped through them",
        hidden: (p: LiquidChromeButtonProps) => p.useCustomColors !== true,
    },

    // Shape
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        min: 0.5,
        max: 6,
        step: 0.5,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 120,
        unit: "px",
    },
    shadow: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 2,
        step: 0.1,
        description: "0 = none, 1 = default, 2 = strong",
    },

    // Border shader
    animateBorder: { type: ControlType.Boolean, title: "Animate border" },
    borderSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 6,
        step: 0.1,
        unit: "×",
        hidden: noAnim,
    },
    detail: {
        type: ControlType.Number,
        title: "Detail",
        min: 0.4,
        max: 3,
        step: 0.1,
        description: "More = more bands and glints around the edge",
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: 0,
        max: 1,
        step: 0.05,
        description: "Higher = harder black / white transitions",
    },
    fringe: {
        type: ControlType.Number,
        title: "Fringe",
        min: 0,
        max: 1,
        step: 0.05,
        description: "Blue / orange color split on sharp edges (0 = none)",
    },
    hoverSpeed: {
        type: ControlType.Number,
        title: "Hover speed",
        min: 1,
        max: 6,
        step: 0.1,
        unit: "×",
        description: "How much the border speeds up on hover (1 = no change)",
        hidden: noAnim,
    },
    maxDpr: {
        type: ControlType.Number,
        title: "Max sharpness",
        min: 1,
        max: 3,
        step: 0.5,
        description: "Pixel ratio cap. Lower = lighter on weak devices",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduce motion",
        description:
            "Freeze the border when the visitor's system asks for reduced motion",
        hidden: noAnim,
    },

    // Text
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultFontSize: "14px",
    },
    uppercase: { type: ControlType.Boolean, title: "Uppercase" },
    rollOnHover: { type: ControlType.Boolean, title: "Roll on hover" },
    rollDuration: {
        type: ControlType.Number,
        title: "Roll time",
        min: 0.1,
        max: 1.5,
        step: 0.05,
        unit: "s",
        hidden: noRoll,
    },
    rollStagger: {
        type: ControlType.Number,
        title: "Letter stagger",
        min: 0,
        max: 0.08,
        step: 0.002,
        unit: "s",
        description: "0 = whole line rolls together",
        hidden: noRoll,
    },

    // Behavior
    press: {
        type: ControlType.Number,
        title: "Press scale",
        min: 0.85,
        max: 1,
        step: 0.01,
    },
    disabled: { type: ControlType.Boolean, title: "Disabled" },
    onClick: { type: ControlType.EventHandler },
})
