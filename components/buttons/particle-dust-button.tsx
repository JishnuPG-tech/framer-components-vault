// Particle Dust Button – a pill CTA that dissolves into particles from the click point,
// scatters, then gathers back into the button. Hovering lifts a little dust under the pointer.
// The button itself is plain DOM/CSS (crisp, identical on the canvas); a 2D canvas only draws the flying particles.
// © Matthias Ölschlegel
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


const CREDIT = "Built by Design Bites 💪  \n[Explore more components](https://dub.sh/dsw13)"

// ─── Looks ────────────────────────────────────────────────────────────────────
type Look = { key: string; title: string; top: string; bottom: string; dust: string; dust2: string; text: string }
const LOOKS: Look[] = [
    { key: "nebula", title: "Nebula", top: "#5B4BF5", bottom: "#2A1798", dust: "#7CF3FF", dust2: "#FF7ADB", text: "#FFFFFF" },
    { key: "onyx", title: "Onyx", top: "#2C2A27", bottom: "#0B0A09", dust: "#FFD98A", dust2: "#FF9A52", text: "#FFFFFF" },
    { key: "ember", title: "Ember", top: "#FF7A45", bottom: "#E2401C", dust: "#FFD08A", dust2: "#FFF3D6", text: "#FFFFFF" },
    { key: "mint", title: "Mint", top: "#22D39A", bottom: "#0B946A", dust: "#C8FFE8", dust2: "#6FE8FF", text: "#FFFFFF" },
    { key: "pearl", title: "Pearl", top: "#FFFFFF", bottom: "#E7E3DC", dust: "#8F8779", dust2: "#C9A76A", text: "#1B1A18" },
]
const LOOK_BY_KEY: Record<string, Look> = Object.fromEntries(LOOKS.map((l) => [l.key, l]))

// ─── Props ────────────────────────────────────────────────────────────────────
type ColorsProps = { custom?: boolean; top?: string; bottom?: string; dust?: string; dust2?: string }
type DustProps = {
    size?: number
    amount?: number
    shape?: "round" | "square"
    spread?: number
    duration?: number
    gravity?: number
    swirl?: number
    glow?: number
}
type TextProps = { font?: React.CSSProperties; colorAuto?: boolean; color?: string; textCase?: "none" | "upper" }
type BorderProps = { width?: number; color?: string }
type HoverProps = { radius?: number; force?: number; wind?: number; dust?: number; press?: number; focus?: string }
type Props = {
    title?: string
    link?: string
    newTab?: boolean
    linkDelay?: number
    look?: string
    colors?: ColorsProps
    dust?: DustProps
    text?: TextProps
    border?: BorderProps
    padding?: string
    radius?: string
    shadowAuto?: boolean
    shadow?: string | string[]
    hover?: HoverProps
    onClick?: (e: React.MouseEvent) => void
    label?: string
    style?: React.CSSProperties
}

const DEF = {
    title: "Get Started",
    padding: "22px 46px 22px 46px",
    radius: "999px",
    shadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 16px 36px -14px rgba(120, 40, 10, 0.55)",
    fontSize: 17,
    linkDelay: 0.5,
}

// ─── Colour helpers (no DOM, SSR-safe) ───────────────────────────────────────
type RGB = [number, number, number]
function parseColor(input: string | undefined): RGB {
    const s = (input ?? "").trim().toLowerCase()
    let m = s.match(/^#([0-9a-f]{3,8})$/)
    if (m) {
        let h = m[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((ch) => ch + ch).join("")
        const n = parseInt(h.slice(0, 6), 16)
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }
    m = s.match(/^rgba?\(([^)]+)\)$/)
    if (m) {
        const parts = m[1].split(/[\s,\/]+/).filter(Boolean)
        const v = parts.slice(0, 3).map((x) => (x.endsWith("%") ? parseFloat(x) * 2.55 : parseFloat(x)) / 255)
        if (v.every((x) => isFinite(x))) return [v[0], v[1], v[2]]
    }
    m = s.match(/^hsla?\(([^)]+)\)$/)
    if (m) {
        const [hh, ss, ll] = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat)
        const h = (((hh % 360) + 360) % 360) / 360, sat = ss / 100, l = ll / 100
        const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p = 2 * l - q
        const f = (t: number) => {
            t = (t + 1) % 1
            return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
        }
        return [f(h + 1 / 3), f(h), f(h - 1 / 3)]
    }
    return [0.5, 0.5, 0.5]
}
const luminance = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOut = (u: number) => 1 - (1 - u) * (1 - u) * (1 - u)
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)

type Palette = { top: string; bottom: string; dust: string; dust2: string; text: string }
function palette(p: Props): Palette {
    const base = LOOK_BY_KEY[p.look ?? "nebula"] ?? LOOKS[0]
    const c = p.colors ?? {}
    const pal: Palette = c.custom
        ? { top: c.top ?? base.top, bottom: c.bottom ?? base.bottom, dust: c.dust ?? base.dust, dust2: c.dust2 ?? c.dust ?? base.dust2, text: base.text }
        : { ...base }
    const t = p.text ?? {}
    if (t.colorAuto === false && t.color) pal.text = t.color
    else if (c.custom) {
        const a = parseColor(pal.top), b = parseColor(pal.bottom)
        pal.text = (luminance(a) + luminance(b)) / 2 > 0.6 ? "#1B1A18" : "#FFFFFF"
    }
    return pal
}

// ─── Shell (shared by live and static) ───────────────────────────────────────
type Shell = {
    props: Props
    pal: Palette
    uid: string
    rootRef?: React.Ref<HTMLElement>
    wrapRef?: React.Ref<HTMLSpanElement>
    shadowRef?: React.Ref<HTMLSpanElement>
    labelRef?: React.Ref<HTMLSpanElement>
    pressed?: boolean
    events?: Record<string, unknown>
    onClick?: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

function renderShell({ props, pal, uid, rootRef, wrapRef, shadowRef, labelRef, pressed, events, onClick, children }: Shell) {
    const { title = DEF.title, link, newTab, text = {}, border = {}, hover = {}, padding = DEF.padding, radius = DEF.radius, shadow = DEF.shadow, label, style } = props
    const font = text.font ?? {}
    const hasLink = typeof link === "string" && link.trim() !== ""
    const pressScale = (hover.press ?? 97) / 100
    const bw = border.width ?? 1
    const focus = hover.focus ?? "#4D8DFF"
    const light = (luminance(parseColor(pal.top)) + luminance(parseColor(pal.bottom))) / 2 > 0.6
    const Tag = (hasLink ? "a" : "button") as "a"
    const linkAttrs = hasLink
        ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined }
        : { type: "button" as const }
    const bc = parseColor(pal.bottom)
    const tint = `${Math.round(bc[0] * 150)}, ${Math.round(bc[1] * 150)}, ${Math.round(bc[2] * 150)}`
    const boxShadow =
        props.shadowAuto !== false
            ? `0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 16px 36px -14px rgba(${tint}, ${light ? 0.35 : 0.6})`
            : (Array.isArray(shadow) ? shadow.join(", ") : shadow) || undefined
    return (
        <Tag
            ref={rootRef as React.Ref<HTMLAnchorElement>}
            className={uid}
            aria-label={label || undefined}
            onClick={onClick ?? props.onClick}
            {...linkAttrs}
            {...(events as object)}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "stretch",
                justifyContent: "center",
                boxSizing: "border-box",
                padding: 0,
                margin: 0,
                border: "none",
                background: "none",
                borderRadius: radius,
                font: "inherit",
                textDecoration: "none",
                cursor: "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "manipulation",
                overflow: "visible",
                transform: pressed ? `scale(${pressScale})` : "scale(1)",
                transition: "transform 0.28s cubic-bezier(0.3, 1.4, 0.5, 1)",
                ...style,
            }}
        >
            <style>{`.${uid}:focus-visible{outline:2px solid ${focus};outline-offset:3px}.${uid}{-webkit-tap-highlight-color:transparent}`}</style>
            <span
                ref={shadowRef}
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow, pointerEvents: "none", zIndex: 0 }}
            />
            <span
                ref={wrapRef}
                style={{
                    position: "relative",
                    zIndex: 1,
                    flex: "1 1 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    padding,
                    borderRadius: "inherit",
                    overflow: "hidden",
                    isolation: "isolate",
                    background: `linear-gradient(180deg, ${pal.top} 0%, ${pal.bottom} 100%)`,
                }}
            >
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "inherit",
                        pointerEvents: "none",
                        background: light
                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 55%)"
                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 44%, rgba(255, 255, 255, 0) 54%)",
                    }}
                />
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "inherit",
                        pointerEvents: "none",
                        boxShadow: [
                            bw > 0 ? `inset 0 0 0 ${bw}px ${border.color ?? (light ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.14)")}` : "",
                            light ? "inset 0 1px 0 rgba(255, 255, 255, 1)" : "inset 0 1px 0 rgba(255, 255, 255, 0.36)",
                            light ? "inset 0 -1px 0 rgba(0, 0, 0, 0.08)" : "inset 0 -1px 0 rgba(0, 0, 0, 0.22)",
                            light ? "inset 0 -12px 18px -14px rgba(0, 0, 0, 0.14)" : "inset 0 -14px 22px -14px rgba(0, 0, 0, 0.42)",
                        ]
                            .filter(Boolean)
                            .join(", "),
                    }}
                />
                <span
                    ref={labelRef}
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        color: pal.text,
                        fontSize: DEF.fontSize,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        lineHeight: "1.2em",
                        ...font,
                        textTransform: (text.textCase ?? "none") === "upper" ? "uppercase" : "none",
                        textShadow: luminance(parseColor(pal.text)) > 0.5 ? "0 1px 1px rgba(0, 0, 0, 0.2)" : "0 1px 0 rgba(255, 255, 255, 0.6)",
                    }}
                >
                    {title}
                </span>
            </span>
            {children}
        </Tag>
    )
}

function useUid() {
    const id = (React as unknown as { useId?: () => string }).useId?.() ?? "x"
    return "pdb-" + id.replace(/[^a-zA-Z0-9_-]/g, "")
}

// ─── Static (canvas, thumbnails): the resting button is pure CSS, so it is identical ─────
function StaticButton(props: Props) {
    return renderShell({ props, pal: palette(props), uid: useUid() })
}

// ─── Live ─────────────────────────────────────────────────────────────────────
type Cells = {
    n: number
    s: number
    hx: Float32Array
    hy: Float32Array
    d: Float32Array
    dx: Float32Array
    dy: Float32Array
    travel: Float32Array
    r1: Float32Array // random 0..1
    r2: Float32Array
    col: Uint8Array // rgb
    order: Uint32Array
    ox: Float32Array // hover field: offset from home + velocity
    oy: Float32Array
    vx: Float32Array
    vy: Float32Array
}
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; c: string }

function LiveButton(props: Props) {
    const pal = palette(props)
    const uid = useUid()
    const rootRef = React.useRef<HTMLElement>(null)
    const wrapRef = React.useRef<HTMLSpanElement>(null)
    const shadowRef = React.useRef<HTMLSpanElement>(null)
    const labelRef = React.useRef<HTMLSpanElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [pressed, setPressed] = React.useState(false)
    const navTimer = React.useRef(0)

    const live = React.useRef({ pal, dust: props.dust ?? {}, hover: props.hover ?? {}, radius: props.radius ?? DEF.radius, start: (_x: number | null, _y: number | null) => {} })
    live.current.pal = pal
    live.current.dust = props.dust ?? {}
    live.current.hover = props.hover ?? {}
    live.current.radius = props.radius ?? DEF.radius

    React.useEffect(() => {
        const root = rootRef.current, wrap = wrapRef.current, canvas = canvasRef.current, labelEl = labelRef.current
        if (!root || !wrap || !canvas || !labelEl) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const L = live.current
        const reduce = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
        let w = 0, h = 0, pad = 0, dpr = 1
        let cells: Cells | null = null
        let active = false, t = 0, ox = 0, oy = 0, maxD = 1, D = 1.6
        const sparks: Spark[] = []
        let raf = 0, last = 0, onScreen = true, disposed = false, emitAcc = 0
        let px = 0, py = 0, hovering = false
        // hover field: the pointer parts the button like sand
        let field: Cells | null = null
        let sx = 0, sy = 0, pvx = 0, pvy = 0, hr = 0, fieldMoving = false

        const layout = () => {
            w = root.offsetWidth
            h = root.offsetHeight
            const spread = L.dust.spread ?? 70
            pad = Math.ceil(spread * 1.5 + 28)
            dpr = Math.min(2, window.devicePixelRatio || 1)
            const cw = Math.round((w + pad * 2) * dpr), ch = Math.round((h + pad * 2) * dpr)
            if (canvas.width !== cw || canvas.height !== ch) {
                canvas.width = cw
                canvas.height = ch
            }
            canvas.style.left = canvas.style.top = `${-pad}px`
            canvas.style.width = `${w + pad * 2}px`
            canvas.style.height = `${h + pad * 2}px`
        }

        const build = (): Cells => {
            const S = L.dust
            const maxCount = 600 + (S.amount ?? 60) * 54
            const s = Math.max(clamp(S.size ?? 3, 1, 12), Math.sqrt((w * h) / maxCount))
            const cols = Math.ceil(w / s), rows = Math.ceil(h / s)
            // where the label is, particles take the text colour
            let textMask: Uint8ClampedArray | null = null
            try {
                const off = document.createElement("canvas")
                off.width = cols
                off.height = rows
                const o = off.getContext("2d", { willReadFrequently: true } as CanvasRenderingContext2DSettings)
                if (o) {
                    const cs = getComputedStyle(labelEl)
                    o.setTransform(1 / s, 0, 0, 1 / s, 0, 0)
                    o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
                    if ("letterSpacing" in o && cs.letterSpacing !== "normal") (o as unknown as { letterSpacing: string }).letterSpacing = cs.letterSpacing
                    o.textAlign = "center"
                    o.textBaseline = "middle"
                    o.fillStyle = "#000"
                    const txt = labelEl.textContent ?? ""
                    o.fillText(cs.textTransform === "uppercase" ? txt.toUpperCase() : txt, labelEl.offsetLeft + labelEl.offsetWidth / 2, labelEl.offsetTop + labelEl.offsetHeight / 2 + 1)
                    textMask = o.getImageData(0, 0, cols, rows).data
                }
            } catch {
                textMask = null
            }
            const rr = Math.min(String(L.radius).includes("%") ? 9999 : parseFloat(String(L.radius)) || 0, h / 2, w / 2)
            const top = parseColor(L.pal.top), bottom = parseColor(L.pal.bottom), tc = parseColor(L.pal.text)
            const max = cols * rows
            const c: Cells = {
                n: 0,
                s,
                hx: new Float32Array(max),
                hy: new Float32Array(max),
                d: new Float32Array(max),
                dx: new Float32Array(max),
                dy: new Float32Array(max),
                travel: new Float32Array(max),
                r1: new Float32Array(max),
                r2: new Float32Array(max),
                col: new Uint8Array(max * 3),
                order: new Uint32Array(0),
                ox: new Float32Array(max),
                oy: new Float32Array(max),
                vx: new Float32Array(max),
                vy: new Float32Array(max),
            }
            maxD = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy), 1)
            const spread = S.spread ?? 70
            let n = 0
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) {
                    const x = (i + 0.5) * s, y = (j + 0.5) * s
                    const qx = Math.abs(x - w / 2) - (w / 2 - rr), qy = Math.abs(y - h / 2) - (h / 2 - rr)
                    const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr
                    if (sd > 0) continue
                    const a = Math.random(), b = Math.random()
                    let vx = x - ox, vy = y - oy
                    const dist = Math.hypot(vx, vy)
                    if (dist < 0.001) {
                        vx = Math.cos(a * 6.283)
                        vy = Math.sin(a * 6.283)
                    } else {
                        vx /= dist
                        vy /= dist
                    }
                    const ang = (a - 0.5) * 2.6
                    const ca = Math.cos(ang), sa = Math.sin(ang)
                    c.hx[n] = x
                    c.hy[n] = y
                    c.d[n] = dist
                    c.dx[n] = vx * ca - vy * sa
                    c.dy[n] = vx * sa + vy * ca
                    c.travel[n] = spread * (0.06 + 0.94 * Math.pow(Math.random(), 1.7))
                    c.r1[n] = a
                    c.r2[n] = b
                    const isText = textMask ? textMask[(j * cols + i) * 4 + 3] > 90 : false
                    const k = y / h
                    const col = isText ? tc : [top[0] + (bottom[0] - top[0]) * k, top[1] + (bottom[1] - top[1]) * k, top[2] + (bottom[2] - top[2]) * k]
                    c.col[n * 3] = col[0] * 255
                    c.col[n * 3 + 1] = col[1] * 255
                    c.col[n * 3 + 2] = col[2] * 255
                    n++
                }
            }
            c.n = n
            return c
        }

        const setMask = (m: string) => {
            wrap.style.setProperty("-webkit-mask-image", m)
            wrap.style.setProperty("mask-image", m)
        }
        const clearMask = () => {
            wrap.style.removeProperty("-webkit-mask-image")
            wrap.style.removeProperty("mask-image")
            if (shadowRef.current) shadowRef.current.style.opacity = ""
        }

        const drawCells = () => {
            const c = cells
            if (!c) return
            const S = L.dust
            const tSpread = 0.26 * D, tOut = 0.34 * D, T1 = 0.5 * D, tBackSpread = 0.19 * D, tBack = 0.29 * D, jit = 0.03 * D, jitB = 0.008 * D
            const r1 = (t / tSpread) * maxD
            const r2 = Math.max(0, ((t - T1 - tBack - jitB) / tBackSpread) * maxD)
            const grav = ((S.gravity ?? 20) / 100) * 0.9
            const swirl = ((S.swirl ?? 40) / 100) * 14
            const glow = (S.glow ?? 60) / 100
            const round = (S.shape ?? "round") === "round"
            const dust = parseColor(L.pal.dust), dustB = parseColor(L.pal.dust2)
            const s = c.s
            // feather: where the front passes, the real button and its particles blend instead of switching
            const FE = clamp(maxD * 0.1, 5, 16)
            const LAND = 0.66
            // radius up to which grains have reached LAND of their way back
            const r2b = ((t - T1 - LAND * tBack) / tBackSpread) * maxD
            let away = 0
            for (let i = 0; i < c.n; i++) {
                const d = c.d[i]
                if (d > r1 + s || d < r2 - s) continue
                const k = d / maxD
                const rel = k * tSpread + c.r1[i] * jit
                const u = clamp01((t - rel) / tOut)
                const ret = T1 + k * tBackSpread + c.r2[i] * jitB
                const v = clamp01((t - ret) / tBack)
                let x = c.hx[i], y = c.hy[i], sz = s + 0.6, alpha = 1, mix = 0, out2 = 0
                let fa = 1
                if (u <= 0) fa = clamp01((r1 - d) / FE)
                else if (v > LAND) {
                    // landing: the grain melts into the real button, which fades in over the same stretch
                    const q = clamp01((v - LAND) / (1 - LAND))
                    fa = 1 - q * q * (3 - 2 * q)
                }
                if (fa <= 0.01) continue
                if (u > 0 && v < 1) {
                    away++
                    const e = easeOut(u), ev = easeInOut(v), out = e * (1 - ev)
                    out2 = out
                    const tr = c.travel[i]
                    const wob = Math.sin(c.r1[i] * 40 + t * (2 + c.r2[i] * 3))
                    x += (c.dx[i] * tr + -c.dy[i] * wob * swirl) * out
                    y += (c.dy[i] * tr + c.dx[i] * wob * swirl + grav * tr * u * u) * out
                    sz = s * (1 - (1 - (0.6 + 0.5 * c.r2[i])) * Math.min(1, out * 1.6)) + 0.6 * (1 - out)
                    alpha = 1 - 0.22 * out * (0.5 + 0.5 * Math.sin(c.r2[i] * 50 + t * 9))
                    mix = glow * Math.min(1, out * 1.5) * (0.35 + 0.65 * c.r1[i])
                }
                const o = i * 3
                const q = c.r2[i]
                const dr = (dust[0] + (dustB[0] - dust[0]) * q) * 255, dg = (dust[1] + (dustB[1] - dust[1]) * q) * 255, db = (dust[2] + (dustB[2] - dust[2]) * q) * 255
                const r = c.col[o] + (dr - c.col[o]) * mix, g = c.col[o + 1] + (dg - c.col[o + 1]) * mix, b = c.col[o + 2] + (db - c.col[o + 2]) * mix
                ctx.globalAlpha = alpha * fa
                ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
                if (round && out2 > 0.2) {
                    ctx.beginPath()
                    ctx.arc(x, y, sz * 0.56, 0, 6.2832)
                    ctx.fill()
                } else ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz)
            }
            ctx.globalAlpha = 1
            const b = Math.max(r1, r2b + 0.01, 0.01)
            let inner = ""
            if (r2b > 0) {
                // solid where grains have landed (r2), fading out to where they are still LAND of the way (r2b)
                const r2raw = ((t - T1 - tBack - jitB) / tBackSpread) * maxD
                const a0 = clamp01(r2b / Math.max(0.01, r2b - r2raw))
                inner = r2 > 0 ? `#000 ${r2.toFixed(1)}px, transparent ${r2b.toFixed(1)}px, ` : `rgba(0, 0, 0, ${a0.toFixed(3)}) 0px, transparent ${r2b.toFixed(1)}px, `
            }
            setMask(`radial-gradient(circle at ${ox.toFixed(1)}px ${oy.toFixed(1)}px, ${inner}transparent ${Math.max(r2b, b - FE, 0).toFixed(1)}px, #000 ${b.toFixed(1)}px)`)
            if (shadowRef.current) shadowRef.current.style.opacity = String(1 - Math.min(1, (away / Math.max(1, c.n)) * 1.5))
        }

        const stepField = (dt: number) => {
            const c = field
            if (!c) return
            const H = L.hover
            const R = ((H.radius ?? 46) / 100) * h
            const target = hovering && !active && !reduce?.matches ? R : 0
            hr += (target - hr) * Math.min(1, dt * (target > hr ? 9 : 6))
            const nx = sx + (px - sx) * Math.min(1, dt * 16), ny = sy + (py - sy) * Math.min(1, dt * 16)
            const ivx = (nx - sx) / Math.max(dt, 0.001), ivy = (ny - sy) / Math.max(dt, 0.001)
            pvx += (ivx - pvx) * Math.min(1, dt * 10)
            pvy += (ivy - pvy) * Math.min(1, dt * 10)
            sx = nx
            sy = ny
            const Rf = Math.max(1, hr * 1.35)
            const F = 5200 * ((H.force ?? 60) / 100) * (hr / Math.max(1, R || 1))
            const wind = ((H.wind ?? 50) / 100) * 3.2
            const swirl = ((L.dust.swirl ?? 40) / 100) * 0.9
            const K = 46, damp = Math.exp(-7.5 * dt)
            let moving = false
            for (let i = 0; i < c.n; i++) {
                let ax = -K * c.ox[i], ay = -K * c.oy[i]
                const dx = c.hx[i] + c.ox[i] - sx, dy = c.hy[i] + c.oy[i] - sy
                const d = Math.hypot(dx, dy)
                if (d < Rf && hr > 0.5) {
                    const k = 1 - d / Rf
                    // a few grains resist and drift inside the opening, so it reads as dust, not as a clean hole
                    const f = F * k * k * (c.r1[i] < 0.16 ? 0.13 : 0.55 + 0.9 * c.r1[i])
                    let ux = dx / (d || 1), uy = dy / (d || 1)
                    if (d < 0.01) {
                        ux = Math.cos(c.r1[i] * 6.283)
                        uy = Math.sin(c.r1[i] * 6.283)
                    }
                    const sw = swirl * (c.r2[i] - 0.5) * 2
                    ax += (ux - uy * sw) * f + pvx * wind * k
                    ay += (uy + ux * sw) * f + pvy * wind * k
                }
                c.vx[i] = (c.vx[i] + ax * dt) * damp
                c.vy[i] = (c.vy[i] + ay * dt) * damp
                c.ox[i] += c.vx[i] * dt
                c.oy[i] += c.vy[i] * dt
                if (!moving && (Math.abs(c.ox[i]) > 0.25 || Math.abs(c.oy[i]) > 0.25 || Math.abs(c.vx[i]) > 3 || Math.abs(c.vy[i]) > 3)) moving = true
            }
            fieldMoving = moving
        }

        const drawField = () => {
            const c = field
            if (!c) return
            if (hr < 0.4 && !fieldMoving) {
                if (!active) clearMask()
                if (!hovering) field = null
                return
            }
            const S = L.dust
            const glow = (S.glow ?? 60) / 100
            const round = (S.shape ?? "round") === "round"
            const dust = parseColor(L.pal.dust), dustB = parseColor(L.pal.dust2)
            const s = c.s
            const R = Math.max(1, ((L.hover.radius ?? 46) / 100) * h)
            const edge = hr * 1.08, band = Math.max(3, hr * 0.3)
            ctx.globalCompositeOperation = "source-over"
            for (let pass = 0; pass < 2; pass++) {
                // pass 0: the particles themselves, pass 1: a soft additive glint on the fastest ones
                if (pass === 1) {
                    if (glow <= 0) break
                    ctx.globalCompositeOperation = "lighter"
                }
                for (let i = 0; i < c.n; i++) {
                    const off = Math.hypot(c.ox[i], c.oy[i])
                    const dh = Math.hypot(c.hx[i] - sx, c.hy[i] - sy)
                    const inHole = dh < edge + s
                    if (!inHole && off < 0.6) continue
                    const m = Math.min(1, off / (R * 0.55))
                    const x = c.hx[i] + c.ox[i], y = c.hy[i] + c.oy[i]
                    const q = c.r2[i]
                    const dr = (dust[0] + (dustB[0] - dust[0]) * q) * 255, dg = (dust[1] + (dustB[1] - dust[1]) * q) * 255, db = (dust[2] + (dustB[2] - dust[2]) * q) * 255
                    if (pass === 1) {
                        if (m < 0.45 || c.r1[i] < 0.72) continue
                        ctx.globalAlpha = 0.16 * glow * m
                        ctx.fillStyle = `rgb(${dr | 0},${dg | 0},${db | 0})`
                        ctx.beginPath()
                        ctx.arc(x, y, s * (1.6 + 1.6 * c.r1[i]), 0, 6.2832)
                        ctx.fill()
                        continue
                    }
                    const mix = glow * m * (0.45 + 0.55 * c.r1[i])
                    const o = i * 3
                    const r = c.col[o] + (dr - c.col[o]) * mix, g = c.col[o + 1] + (dg - c.col[o + 1]) * mix, b = c.col[o + 2] + (db - c.col[o + 2]) * mix
                    const sz = s * (1 - 0.5 * m * (0.4 + 0.6 * q)) + 0.6 * (1 - m)
                    // grains still at home fade in exactly where the real button fades out
                    const still = clamp01((edge - dh) / band)
                    const moved = clamp01((off - 0.6) / 3)
                    ctx.globalAlpha = Math.max(inHole ? still : 0, moved)
                    ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
                    if (round && m > 0.04) {
                        ctx.beginPath()
                        ctx.arc(x, y, sz * 0.56, 0, 6.2832)
                        ctx.fill()
                    } else ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz)
                }
            }
            ctx.globalCompositeOperation = "source-over"
            ctx.globalAlpha = 1
            if (hr > 0.4) setMask(`radial-gradient(circle at ${sx.toFixed(1)}px ${sy.toFixed(1)}px, transparent ${Math.max(0, edge - band).toFixed(1)}px, #000 ${edge.toFixed(1)}px)`)
            else if (!active) clearMask()
        }

        const drawSparks = (dt: number) => {
            const grav = ((L.dust.gravity ?? 20) / 100) * 60
            for (let i = sparks.length - 1; i >= 0; i--) {
                const p = sparks[i]
                p.life += dt
                if (p.life >= p.max) {
                    sparks.splice(i, 1)
                    continue
                }
                p.vy += grav * dt
                p.x += p.vx * dt
                p.y += p.vy * dt
                const k = p.life / p.max
                ctx.globalAlpha = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * 0.9
                ctx.fillStyle = p.c
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size * (1 - 0.5 * k), 0, 6.2832)
                ctx.fill()
            }
            ctx.globalAlpha = 1
        }

        const emit = (count: number) => {
            const P = L.pal
            const light = luminance(parseColor(P.top)) > 0.75
            for (let i = 0; i < count && sparks.length < 180; i++) {
                // dust leaves from the edge nearest to the pointer, so it is seen against the page
                const up = Math.random() < (py < h / 2 ? 0.8 : 0.2)
                const a = (up ? -Math.PI / 2 : Math.PI / 2) + (Math.random() - 0.5) * 1.5, sp = 16 + Math.random() * 38
                sparks.push({
                    x: clamp(px + (Math.random() - 0.5) * 70, h * 0.3, w - h * 0.3),
                    y: up ? 1 : h - 1,
                    vx: Math.cos(a) * sp,
                    vy: Math.sin(a) * sp,
                    life: 0,
                    max: 0.6 + Math.random() * 0.7,
                    size: 0.9 + Math.random() * 1.3,
                    c: light || Math.random() < 0.4 ? P.dust : P.top,
                })
            }
        }

        const frame = (now: number) => {
            raf = 0
            if (disposed || !onScreen || document.hidden) return
            const dt = clamp((now - (last || now)) / 1000, 0, 0.05)
            last = now
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr)
            if (active) {
                t += dt
                if (t >= D) {
                    active = false
                    cells = null
                    clearMask()
                } else drawCells()
            } else if (field) {
                stepField(dt)
                drawField()
            }
            const hv = (L.hover.dust ?? 30) / 100
            if (hovering && !active && hv > 0 && !reduce?.matches) {
                emitAcc += dt * 9 * hv
                const n = Math.floor(emitAcc)
                if (n > 0) {
                    emitAcc -= n
                    emit(n)
                }
            }
            drawSparks(dt)
            if (active || field || sparks.length > 0 || (hovering && hv > 0 && !reduce?.matches)) raf = requestAnimationFrame(frame)
            else last = 0
        }
        const kick = () => {
            if (disposed || raf || !onScreen || document.hidden) return
            last = 0
            raf = requestAnimationFrame(frame)
        }

        const local = (cx: number, cy: number) => {
            const r = root.getBoundingClientRect()
            return [((cx - r.left) / (r.width || 1)) * w, ((cy - r.top) / (r.height || 1)) * h]
        }
        const start = (cx: number | null, cy: number | null) => {
            if (active || reduce?.matches) return
            layout()
            if (w < 2 || h < 2) return
            if (cx === null || cy === null) {
                ox = w / 2
                oy = h / 2
            } else {
                const p = local(cx, cy)
                ox = clamp(p[0], 0, w)
                oy = clamp(p[1], 0, h)
            }
            D = clamp(L.dust.duration ?? 1.6, 0.4, 6)
            field = null
            hr = 0
            cells = build()
            t = 0
            active = true
            kick()
        }
        L.start = start

        const onDown = (e: PointerEvent) => {
            if (e.pointerType === "mouse" && e.button === 0) start(e.clientX, e.clientY)
        }
        const onClick = (e: MouseEvent) => {
            if (e.detail === 0) start(null, null)
            else start(e.clientX, e.clientY)
        }
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            const p0 = local(e.clientX, e.clientY)
            if (!hovering) {
                layout()
                hovering = true
                if (!field) {
                    sx = p0[0]
                    sy = p0[1]
                    pvx = pvy = 0
                }
            }
            if (!field && !active && !reduce?.matches && (L.hover.radius ?? 46) > 0 && w > 2 && h > 2) {
                ox = w / 2
                oy = h / 2
                field = build()
                kick()
            }
            const p = p0
            const dist = Math.hypot(p[0] - px, p[1] - py)
            px = p[0]
            py = p[1]
            const hv = (L.hover.dust ?? 30) / 100
            if (hv > 0 && !active && !reduce?.matches) {
                emitAcc += Math.min(dist, 40) * 0.14 * hv
                kick()
            }
        }
        const onLeave = () => {
            hovering = false
            kick()
        }
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("click", onClick)
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerleave", onLeave)

        const io =
            typeof IntersectionObserver === "function"
                ? new IntersectionObserver((en) => {
                      onScreen = en[en.length - 1].isIntersecting
                      if (onScreen) kick()
                  })
                : null
        io?.observe(root)
        const onVis = () => {
            if (!document.hidden && (active || field || sparks.length)) kick()
        }
        document.addEventListener("visibilitychange", onVis)
        const ro =
            typeof ResizeObserver === "function"
                ? new ResizeObserver(() => {
                      // a resize mid-effect would misplace every particle: end it cleanly
                      if ((active || field) && (root.offsetWidth !== w || root.offsetHeight !== h)) {
                          active = false
                          cells = null
                          field = null
                          hr = 0
                          clearMask()
                      }
                  })
                : null
        ro?.observe(root)
        const onReduce = () => {
            if (reduce?.matches) {
                active = false
                cells = null
                field = null
                hr = 0
                sparks.length = 0
                clearMask()
                ctx.setTransform(1, 0, 0, 1, 0, 0)
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
        }
        reduce?.addEventListener?.("change", onReduce)

        return () => {
            disposed = true
            if (raf) cancelAnimationFrame(raf)
            L.start = () => {}
            clearMask()
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("click", onClick)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            io?.disconnect()
            ro?.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            reduce?.removeEventListener?.("change", onReduce)
        }
    }, [])

    React.useEffect(() => () => window.clearTimeout(navTimer.current), [])

    const hasLink = typeof props.link === "string" && props.link.trim() !== ""
    const delay = props.linkDelay ?? DEF.linkDelay
    const onClick = (e: React.MouseEvent) => {
        props.onClick?.(e)
        if (!hasLink || props.newTab || delay <= 0 || e.defaultPrevented) return
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return
        // same tab: let the dissolve play first, then follow the link
        const href = (e.currentTarget as HTMLAnchorElement).href
        e.preventDefault()
        if (navTimer.current) return
        navTimer.current = window.setTimeout(() => {
            navTimer.current = 0
            window.location.assign(href)
        }, delay * 1000)
    }

    const events = {
        onPointerDown: () => setPressed(true),
        onPointerUp: () => setPressed(false),
        onPointerLeave: () => setPressed(false),
        onPointerCancel: () => setPressed(false),
    }

    return renderShell({
        props,
        pal,
        uid,
        rootRef,
        wrapRef,
        shadowRef,
        labelRef,
        pressed,
        events,
        onClick,
        children: <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, pointerEvents: "none", zIndex: 2 }} />,
    })
}

/**
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-auto
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 64
 * @framerDisableUnlink
 */
export default function ParticleDustButton(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticButton {...props} />
    return <LiveButton {...props} />
}

ParticleDustButton.displayName = "Particle Dust Button"

const notCustom = (c: ColorsProps) => c.custom !== true

addPropertyControls(ParticleDustButton, {
    title: { type: ControlType.String, title: "Title", defaultValue: DEF.title },
    link: { type: ControlType.Link, title: "Link", defaultValue: "" },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    linkDelay: {
        type: ControlType.Number,
        title: "Link Delay",
        defaultValue: DEF.linkDelay,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
        displayStepper: true,
        description: "Same-tab links wait this long so the dissolve is seen. 0 = follow at once.",
        hidden: (p: Props) => !p.link || p.newTab === true,
    },
    look: {
        type: ControlType.Enum,
        title: "Look",
        options: LOOKS.map((l) => l.key),
        optionTitles: LOOKS.map((l) => l.title),
        defaultValue: "nebula",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            custom: { type: ControlType.Boolean, title: "Mode", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Look" },
            top: { type: ControlType.Color, title: "Top", defaultValue: LOOKS[0].top, hidden: notCustom },
            bottom: { type: ControlType.Color, title: "Bottom", defaultValue: LOOKS[0].bottom, hidden: notCustom },
            dust: { type: ControlType.Color, title: "Dust", defaultValue: LOOKS[0].dust, hidden: notCustom, description: "Particles shift to these two colours in flight (see Particles › Glow)." },
            dust2: { type: ControlType.Color, title: "Dust 2", defaultValue: LOOKS[0].dust2, hidden: notCustom },
        },
    },
    dust: {
        type: ControlType.Object,
        title: "Particles",
        controls: {
            size: { type: ControlType.Number, title: "Size", defaultValue: 3, min: 1, max: 10, step: 0.5, unit: "px" },
            amount: { type: ControlType.Number, title: "Amount", defaultValue: 60, min: 10, max: 100, step: 1, unit: "%", description: "Large buttons use bigger particles to stay within this budget." },
            shape: { type: ControlType.Enum, title: "Shape", options: ["round", "square"], optionTitles: ["Round", "Square"], displaySegmentedControl: true, defaultValue: "round" },
            spread: { type: ControlType.Number, title: "Spread", defaultValue: 70, min: 10, max: 240, step: 2, unit: "px", description: "How far particles fly." },
            duration: { type: ControlType.Number, title: "Duration", defaultValue: 1.6, min: 0.6, max: 5, step: 0.1, unit: "s", description: "Dissolve, scatter and gather." },
            gravity: { type: ControlType.Number, title: "Gravity", defaultValue: 20, min: -100, max: 100, step: 5, unit: "%", description: "Negative values let the dust rise." },
            swirl: { type: ControlType.Number, title: "Swirl", defaultValue: 40, min: 0, max: 100, step: 5, unit: "%" },
            glow: { type: ControlType.Number, title: "Glow", defaultValue: 60, min: 0, max: 100, step: 5, unit: "%", description: "How much flying particles take the dust colour." },
        },
    },
    text: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: DEF.fontSize, variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.2em" },
            },
            textCase: { type: ControlType.Enum, title: "Case", options: ["none", "upper"], optionTitles: ["As Typed", "Uppercase"], displaySegmentedControl: true, defaultValue: "none" },
            colorAuto: { type: ControlType.Boolean, title: "Color", defaultValue: true, enabledTitle: "Auto", disabledTitle: "Custom", description: "Auto follows the look." },
            color: { type: ControlType.Color, title: " ", defaultValue: "#FFFFFF", hidden: (t: TextProps) => t.colorAuto !== false },
        },
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            width: { type: ControlType.Number, title: "Width", defaultValue: 1, min: 0, max: 8, step: 0.5, unit: "px" },
            color: { type: ControlType.Color, title: "Color", defaultValue: "rgba(255, 255, 255, 0.14)", hidden: (b: BorderProps) => b.width === 0 },
        },
    },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: DEF.padding },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: DEF.radius },
    shadowAuto: { type: ControlType.Boolean, title: "Shadow", defaultValue: true, enabledTitle: "Auto", disabledTitle: "Custom", description: "Auto: a soft drop shadow tinted by the button colour." },
    shadow: { type: ControlType.BoxShadow, title: " ", defaultValue: DEF.shadow, hidden: (p: Props) => p.shadowAuto !== false },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            radius: { type: ControlType.Number, title: "Part Radius", defaultValue: 46, min: 0, max: 200, step: 5, unit: "%", description: "The pointer parts the button like sand: size of the opening in % of the height. 0 = off." },
            force: { type: ControlType.Number, title: "Part Force", defaultValue: 60, min: 0, max: 100, step: 5, unit: "%", description: "How far the particles are pushed aside." },
            wind: { type: ControlType.Number, title: "Wind", defaultValue: 50, min: 0, max: 100, step: 5, unit: "%", description: "Particles are dragged along with the pointer." },
            dust: { type: ControlType.Number, title: "Dust", defaultValue: 30, min: 0, max: 100, step: 5, unit: "%", description: "Fine dust lifts off under the pointer. 0 = off." },
            press: { type: ControlType.Number, title: "Press Scale", defaultValue: 97, min: 85, max: 100, step: 1, unit: "%" },
            focus: { type: ControlType.Color, title: "Focus Ring", defaultValue: "#4D8DFF" },
        },
    },
    onClick: { type: ControlType.EventHandler },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "Accessible name (optional)",
        description: CREDIT,
    },
})
