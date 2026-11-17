import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Img = { src?: string; srcSet?: string; alt?: string; positionX?: string; positionY?: string }
type Icon = "arrow-up-right" | "arrow-right" | "plus" | "none"

interface ButtonProps {
    show?: boolean
    label?: string
    icon?: Icon
    font?: React.CSSProperties
    fill?: string
    color?: string
    fillHover?: string
    colorHover?: string
    border?: string
    blur?: number
    height?: number
    padding?: number
    radius?: number
    expand?: number
    fullWidth?: boolean
}
interface CardProps {
    surface?: string
    shadow?: string
    border?: string
    borderHover?: string
    radius?: number
    padding?: number
    textWidth?: number
    dim?: number
    zoom?: number
    compact?: number
}
interface TextProps {
    titleFont?: React.CSSProperties
    titleColor?: string
    bodyFont?: React.CSSProperties
    bodyColor?: string
    labelFont?: React.CSSProperties
    labelColor?: string
}
interface DotProps {
    tint?: "image" | "solid"
    color?: string
    accent?: string
    size?: number
    spacing?: number
    deploy?: number
    organic?: number
    twinkle?: number
    floor?: number
    glow?: number
    lift?: number
    idle?: number
}
interface Props {
    preview?: "rest" | "hover"
    image?: Img
    label?: string
    title?: string
    description?: string
    link?: string
    newTab?: boolean
    button?: ButtonProps
    card?: CardProps
    text?: TextProps
    dots?: DotProps
    onClick?: () => void
    style?: React.CSSProperties
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const FADE_MASK = "linear-gradient(0deg, rgba(0,0,0,0) 6%, rgba(0,0,0,1) 60%)"
const LEVELS = 14
const TAU = Math.PI * 2
const ICONS: Record<Exclude<Icon, "none">, { d: string; hover: string }> = {
    "arrow-up-right": { d: "M7 17L17 7M8 7h9v9", hover: "rotate(45deg)" },
    "arrow-right": { d: "M5 12h14M13 6l6 6-6 6", hover: "translateX(3px)" },
    plus: { d: "M12 5v14M5 12h14", hover: "rotate(90deg)" },
}
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const pct = (v: string | undefined) => {
    const n = parseFloat(v || "50")
    return isNaN(n) ? 0.5 : clamp01(n / 100)
}
const px = (v: any, fallback: number) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? ""))
    return isNaN(n) ? fallback : n
}

function hash(ix: number, iy: number) {
    const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453
    return s - Math.floor(s)
}

// Smooth 2D value noise: gives the deploy front its organic, clumpy edge
function noise(x: number, y: number) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const ux = fx * fx * (3 - 2 * fx)
    const uy = fy * fy * (3 - 2 * fy)
    const a = hash(ix, iy)
    const b = hash(ix + 1, iy)
    const c = hash(ix, iy + 1)
    const d = hash(ix + 1, iy + 1)
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

function sdRound(x: number, y: number, hw: number, hh: number, r: number) {
    const qx = Math.abs(x - hw) - (hw - r)
    const qy = Math.abs(y - hh) - (hh - r)
    return Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - r
}

const DEFAULT_IMAGE: Img = { src: "https://framerusercontent.com/images/3WP6dlwJIuh7UKn6nonXKyALpxE.png", alt: "A white car parked under a dark red evening sky" }

const SERIF_CSS = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
const SERIF_FAMILY = '"Instrument Serif", "Instrument Serif Placeholder", serif'

// The title font defaults to Instrument Serif. When the editor resolves that default to its Noto Serif fallback, keep Instrument Serif.
function titleFamily(font?: React.CSSProperties): string {
    const family = font && (font as any).fontFamily
    return !family || /^\s*"?Noto Serif"?\s*(,|$)/.test(String(family)) ? SERIF_FAMILY : String(family)
}

// Loads Instrument Serif once per page so the title renders the same in any project
function useSerifFont(enabled: boolean) {
    useEffect(() => {
        if (!enabled || typeof document === "undefined") return
        if (document.getElementById("instrument-serif-font")) return
        const link = document.createElement("link")
        link.id = "instrument-serif-font"
        link.rel = "stylesheet"
        link.href = SERIF_CSS
        document.head.appendChild(link)
    }, [enabled])
}

/**
 * Matrix Card — a full-bleed link card. On hover, an organic dot matrix spreads across the card from the cursor.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 628
 * @framerIntrinsicHeight 522
 */
export default function MatrixCard(props: Props) {
    const {
        preview = "hover",
        image: imageProp,
        label = "2024",
        title = "Afterglow in motion",
        description = "Watch the Afterglow prototype on its first long run, filmed in one take from the studio to the open road.",
        link = "",
        newTab = false,
        onClick,
        style,
    } = props
    const image: Img | undefined = imageProp && imageProp.src ? imageProp : DEFAULT_IMAGE
    const b0 = props.button || {}
    const k0 = props.card || {}
    const t0 = props.text || {}
    const d0 = props.dots || {}
    const titleFamilyValue = titleFamily(t0.titleFont)
    const serifTitle = /Instrument Serif/.test(titleFamilyValue)
    useSerifFont(serifTitle)

    const btn = {
        show: b0.show !== false,
        label: b0.label ?? "See video",
        icon: (b0.icon || "none") as Icon,
        fill: b0.fill || "rgb(23, 23, 23)",
        color: b0.color || "rgb(255, 255, 255)",
        fillHover: b0.fillHover || "rgb(255, 255, 255)",
        colorHover: b0.colorHover || "rgb(23, 23, 23)",
        border: b0.border || "rgba(0, 0, 0, 0)",
        blur: Math.max(0, b0.blur ?? 0),
        height: Math.max(24, b0.height ?? 48),
        padding: Math.max(0, b0.padding ?? 22),
        radius: Math.max(0, b0.radius ?? 999),
        expand: Math.max(0, b0.expand ?? 2),
        fullWidth: b0.fullWidth !== false,
    }
    const card = {
        surface: k0.surface || "rgb(230, 230, 230)",
        border: k0.border || "rgba(255, 255, 255, 0)",
        borderHover: k0.borderHover || "rgba(255, 255, 255, 0)",
        shadow: k0.shadow || "",
        radius: Math.max(0, k0.radius ?? 20),
        padding: Math.max(0, k0.padding ?? 36),
        textWidth: Math.max(200, k0.textWidth ?? 560),
        dim: clamp01((k0.dim ?? 0) / 100),
        zoom: Math.max(0, k0.zoom ?? 3) / 100,
        compact: Math.max(0, k0.compact ?? 520),
    }
    const txt = {
        titleColor: t0.titleColor || "rgb(23, 23, 23)",
        bodyColor: t0.bodyColor || "rgba(23, 23, 23, 0.7)",
        labelColor: t0.labelColor || "rgba(255, 255, 255, 0)",
    }

    const rt = RenderTarget.current()
    const isCanvas = rt === RenderTarget.canvas || rt === RenderTarget.export || rt === RenderTarget.thumbnail
    const src = (image && image.src) || ""

    const dp = {
        tint: d0.tint === "solid" ? "solid" : "image",
        color: d0.color || "rgb(23, 23, 23)",
        accent: d0.accent || "rgb(84, 84, 84)",
        size: Math.max(0.4, d0.size ?? 1.6),
        spacing: Math.max(3, d0.spacing ?? 7),
        deploy: Math.max(0.1, d0.deploy ?? 1.1),
        organic: clamp01((d0.organic ?? 45) / 100),
        twinkle: clamp01((d0.twinkle ?? 70) / 100),
        floor: clamp01((d0.floor ?? 37) / 100),
        glow: Math.max(0, d0.glow ?? 180),
        lift: clamp01((d0.lift ?? 22) / 100),
        idle: clamp01((d0.idle ?? 0) / 100),
        R: card.radius,
        posX: pct(image && image.positionX),
        posY: pct(image && image.positionY),
    }
    const params = useRef(dp)
    params.current = dp
    const previewRef = useRef(preview)
    previewRef.current = preview

    const rootRef = useRef<HTMLElement | null>(null)
    const cvRef = useRef<HTMLCanvasElement>(null)
    const imgRef = useRef<HTMLImageElement | null>(null)
    const [active, setActive] = useState(false)
    const [width, setWidth] = useState(1200)
    const S = useRef({ hover: false, focus: false, ox: 0, oy: 0, px: -9999, py: -9999, fx: 0, fy: 0, flashAt: 0, kick: () => {} })
    const lit = isCanvas ? preview === "hover" : active
    const compact = width < card.compact

    // Load the image for tinting the dots (drawing only, never read back)
    useEffect(() => {
        if (!src || typeof window === "undefined") {
            imgRef.current = null
            S.current.kick()
            return
        }
        const im = new Image()
        im.decoding = "async"
        im.onload = () => {
            imgRef.current = im
            S.current.kick()
        }
        im.src = src
        return () => {
            im.onload = null
        }
    }, [src])

    // Container width drives the compact layout
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => setWidth(el.offsetWidth))
        ro.observe(el)
        setWidth(el.offsetWidth)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        const root = rootRef.current
        const cv = cvRef.current
        if (!root || !cv || typeof window === "undefined") return
        const ctx = cv.getContext("2d")
        if (!ctx) return
        const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)

        let N = 0
        let X = new Float32Array(0)
        let Y = new Float32Array(0)
        let FY = new Float32Array(0)
        let NZ = new Float32Array(0)
        let RATE = new Float32Array(0)
        let P1 = new Float32Array(0)
        let P2 = new Float32Array(0)
        let F1 = new Float32Array(0)
        let F2 = new Float32Array(0)
        let A = new Float32Array(0)
        let key = ""

        // Every grid point inside the card's rounded surface
        const build = (w: number, h: number, P: typeof dp) => {
            const sp = P.spacing
            const cols = Math.max(1, Math.floor(w / sp))
            const rows = Math.max(1, Math.floor(h / sp))
            const ox = (w - (cols - 1) * sp) / 2
            const oy = (h - (rows - 1) * sp) / 2
            const m = sp * 0.5
            const hw = w / 2
            const hh = h / 2
            const rr = Math.min(P.R, hw, hh)
            const xs: number[] = []
            const ys: number[] = []
            for (let j = 0; j < rows; j++) {
                const y = oy + j * sp
                for (let i = 0; i < cols; i++) {
                    const x = ox + i * sp
                    if (sdRound(x, y, hw, hh, rr) > -m) continue
                    xs.push(x)
                    ys.push(y)
                }
            }
            N = xs.length
            X = new Float32Array(xs)
            Y = new Float32Array(ys)
            FY = new Float32Array(N)
            NZ = new Float32Array(N)
            RATE = new Float32Array(N)
            P1 = new Float32Array(N)
            P2 = new Float32Array(N)
            F1 = new Float32Array(N)
            F2 = new Float32Array(N)
            A = new Float32Array(N)
            for (let k = 0; k < N; k++) {
                const f = clamp01((0.96 - Y[k] / h) / 0.5)
                FY[k] = 0.32 + 0.68 * f * f * (3 - 2 * f)
                NZ[k] = noise(X[k] / 64, Y[k] / 64) * 0.62 + noise(X[k] / 18, Y[k] / 18) * 0.22 + Math.random() * 0.16
                RATE[k] = 3 + Math.random() * 7
                P1[k] = Math.random() * TAU
                P2[k] = Math.random() * TAU
                F1[k] = 0.6 + Math.random() * 1.8
                F2[k] = 0.25 + Math.random() * 0.9
            }
        }

        let raf = 0
        let last = 0
        let raw = 0
        let glowAmt = 0
        let inView = true
        let disposed = false

        const frame = (ms: number) => {
            raf = 0
            if (disposed) return
            const P = params.current
            const st = S.current
            const now = ms / 1000
            const dt = last ? Math.min(1 / 20, Math.max(0, now - last)) : 1 / 60
            last = now
            const w = root.offsetWidth
            const h = root.offsetHeight
            if (w < 2 || h < 2) return
            const k2 = w + "|" + h + "|" + P.spacing + "|" + P.R
            if (k2 !== key) {
                key = k2
                build(w, h, P)
            }
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            const bw = Math.max(1, Math.round(w * dpr))
            const bh = Math.max(1, Math.round(h * dpr))
            if (cv.width !== bw || cv.height !== bh) {
                cv.width = bw
                cv.height = bh
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.globalCompositeOperation = "source-over"
            ctx.clearRect(0, 0, w, h)

            const still = isCanvas
            const on = still ? previewRef.current === "hover" : st.hover || st.focus
            if (still || reduce) raw = on ? 1 : 0
            else raw = clamp01(raw + ((on ? 1 : -1) * dt) / (on ? P.deploy : P.deploy * 0.8))
            const front = (1 - (1 - raw) * (1 - raw)) * 1.08
            glowAmt += ((st.hover && !still ? 1 : 0) - glowAmt) * Math.min(1, dt * 6)

            const ox = st.ox
            const oy = st.oy
            const maxD = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy)) || 1
            const J = P.organic
            const flashAge = st.flashAt ? (ms - st.flashAt) / 1000 : 99
            const flashOn = !still && flashAge >= 0 && flashAge < 1.2
            const ringR = flashAge * 900
            const paths: (Path2D | null)[] = []
            const hotPaths: (Path2D | null)[] = []
            let visible = false

            for (let k = 0; k < N; k++) {
                const x = X[k]
                const y = Y[k]
                const t = (Math.hypot(x - ox, y - oy) / maxD) * (1 - J) + NZ[k] * J
                let target = clamp01((front - t) * 12)
                if (target < P.idle) target = P.idle
                let a = A[k]
                if (still || reduce) a = target
                else a += (target - a) * Math.min(1, dt * RATE[k] * (target > a ? 1.5 : 0.7))
                A[k] = a

                let ring = 0
                if (flashOn) {
                    const dd = Math.abs(Math.hypot(x - st.fx, y - st.fy) - ringR)
                    if (dd < 40) ring = (1 - dd / 40) * (1 - flashAge / 1.2)
                }
                if (a < 0.01 && ring < 0.02) continue
                visible = true

                let b: number
                if (still) b = 0.35 + 0.65 * NZ[k]
                else if (reduce) b = 0.5
                else {
                    const n = 0.6 * Math.sin(now * F1[k] + P1[k]) + 0.4 * Math.sin(now * F2[k] + P2[k] + (x + y) * 0.008 - now * 0.9)
                    b = 0.5 + 0.5 * n
                }
                b = b * b
                const lvl = P.floor + (1 - P.floor) * (P.twinkle * b + (1 - P.twinkle) * 0.35)

                let g = 0
                if (glowAmt > 0.01 && P.glow > 0) {
                    const gd = Math.hypot(x - st.px, y - st.py)
                    if (gd < P.glow) {
                        g = 1 - gd / P.glow
                        g = g * g * glowAmt
                    }
                }
                const crest = target > a ? clamp01((target - a) * 2.2) : 0
                const hot = Math.max(crest * 0.85, ring)
                const alphaDraw = a * Math.min(1, lvl + g * 0.8) * Math.max(FY[k], g)
                let r = (P.size / 2) * (0.75 + 0.5 * b + g * 1.2)
                if (hot > 0.12) {
                    const lv = Math.round(Math.max(alphaDraw, hot * Math.max(a, ring) * FY[k]) * LEVELS)
                    if (lv <= 0) continue
                    r *= 1 + hot * 0.5
                    const p = hotPaths[lv] || (hotPaths[lv] = new Path2D())
                    p.moveTo(x + r, y)
                    p.arc(x, y, r, 0, TAU)
                    continue
                }
                const lv = Math.round(alphaDraw * LEVELS)
                if (lv <= 0) continue
                const p = paths[lv] || (paths[lv] = new Path2D())
                p.moveTo(x + r, y)
                p.arc(x, y, r, 0, TAU)
            }

            // Base matrix
            let any = false
            ctx.fillStyle = P.color
            for (let lv = 1; lv <= LEVELS; lv++) {
                const p = paths[lv]
                if (!p) continue
                any = true
                ctx.globalAlpha = lv / LEVELS
                ctx.fill(p)
            }
            // Tint the dots with the image underneath, then lift them so dark areas stay readable
            const im = imgRef.current
            if (any && P.tint === "image" && im && im.naturalWidth) {
                const iw = im.naturalWidth
                const ih = im.naturalHeight
                const s = Math.max(w / iw, h / ih)
                const dw = iw * s
                const dh = ih * s
                ctx.globalAlpha = 1
                ctx.globalCompositeOperation = "source-in"
                const anyCtx = ctx as any
                if ("filter" in anyCtx) anyCtx.filter = "brightness(1.8) saturate(1.35)"
                ctx.drawImage(im, (w - dw) * P.posX, (h - dh) * P.posY, dw, dh)
                if ("filter" in anyCtx) anyCtx.filter = "none"
                ctx.globalCompositeOperation = "source-over"
                if (P.lift > 0) {
                    ctx.fillStyle = P.color
                    for (let lv = 1; lv <= LEVELS; lv++) {
                        const p = paths[lv]
                        if (!p) continue
                        ctx.globalAlpha = (lv / LEVELS) * P.lift
                        ctx.fill(p)
                    }
                }
            }
            // Wave crest and click ripple
            ctx.fillStyle = P.accent
            for (let lv = 1; lv <= LEVELS; lv++) {
                const p = hotPaths[lv]
                if (!p) continue
                ctx.globalAlpha = lv / LEVELS
                ctx.fill(p)
            }
            ctx.globalAlpha = 1

            const needs = !still && inView && (on || raw > 0 || visible || flashOn || glowAmt > 0.01 || (P.idle > 0 && P.twinkle > 0 && !reduce))
            if (needs) raf = window.requestAnimationFrame(frame)
        }

        const start = () => {
            if (!raf && !disposed) {
                last = 0
                raf = window.requestAnimationFrame(frame)
            }
        }
        S.current.kick = start

        const io =
            !isCanvas && typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver((entries) => {
                      inView = entries.some((e) => e.isIntersecting)
                      if (inView) start()
                  })
                : null
        if (io) io.observe(root)
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => start()) : null
        if (ro) ro.observe(root)
        start()

        return () => {
            disposed = true
            if (raf) window.cancelAnimationFrame(raf)
            if (io) io.disconnect()
            if (ro) ro.disconnect()
            S.current.kick = () => {}
        }
    }, [isCanvas])

    const canvasKey = isCanvas ? preview + JSON.stringify(dp) : ""
    useEffect(() => {
        if (isCanvas) S.current.kick()
    }, [canvasKey])

    const local = (e: React.PointerEvent | React.MouseEvent) => {
        const el = rootRef.current
        if (!el) return [0, 0]
        const b = el.getBoundingClientRect()
        const sc = b.width / (el.offsetWidth || 1) || 1
        return [(e.clientX - b.left) / sc, (e.clientY - b.top) / sc]
    }
    const sync = () => {
        const st = S.current
        setActive(st.hover || st.focus)
        st.kick()
    }

    const handlers = isCanvas
        ? {}
        : {
              onPointerEnter: (e: React.PointerEvent) => {
                  const [x, y] = local(e)
                  const st = S.current
                  if (!st.hover && !st.focus) {
                      st.ox = x
                      st.oy = y
                  }
                  st.px = x
                  st.py = y
                  st.hover = true
                  sync()
              },
              onPointerMove: (e: React.PointerEvent) => {
                  const [x, y] = local(e)
                  const st = S.current
                  st.px = x
                  st.py = y
                  if (!st.hover) {
                      st.ox = x
                      st.oy = y
                      st.hover = true
                      sync()
                  }
              },
              onPointerLeave: (e: React.PointerEvent) => {
                  const [x, y] = local(e)
                  const st = S.current
                  st.hover = false
                  if (!st.focus) {
                      st.ox = x
                      st.oy = y
                  }
                  sync()
              },
              onPointerDown: (e: React.PointerEvent) => {
                  const [x, y] = local(e)
                  const st = S.current
                  if (!st.hover) {
                      st.ox = x
                      st.oy = y
                      st.hover = true
                  }
                  st.fx = x
                  st.fy = y
                  st.flashAt = performance.now()
                  sync()
              },
              onFocus: (e: React.FocusEvent) => {
                  const el = e.currentTarget as HTMLElement
                  let visible = true
                  try {
                      visible = el.matches(":focus-visible")
                  } catch (err) {}
                  if (!visible) return
                  const st = S.current
                  if (!st.hover) {
                      st.ox = 0
                      st.oy = el.offsetHeight
                  }
                  st.focus = true
                  sync()
              },
              onBlur: () => {
                  S.current.focus = false
                  sync()
              },
              onClick: (e: React.MouseEvent) => {
                  if (e.detail === 0) {
                      const el = rootRef.current
                      const st = S.current
                      st.fx = el ? el.offsetWidth / 2 : 0
                      st.fy = el ? el.offsetHeight / 2 : 0
                      st.flashAt = performance.now()
                      st.kick()
                  }
                  if (onClick) onClick()
              },
          }

    const Tag: any = link ? "a" : "div"
    const linkProps = link ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined } : { tabIndex: 0 }
    const pad = compact ? Math.min(card.padding, 20) : card.padding
    const titleFont: React.CSSProperties = { fontSize: 34, fontWeight: 400, letterSpacing: "-0.03em", lineHeight: "1.1em", ...t0.titleFont, fontFamily: titleFamilyValue, ...(serifTitle ? { fontWeight: 400 } : null) }
    if (compact) titleFont.fontSize = Math.round(px(titleFont.fontSize, 34) * 0.7) + "px"
    const fontFamily = (t0.bodyFont && (t0.bodyFont as any).fontFamily) || '"Inter", "Inter Placeholder", sans-serif'
    const icon = btn.icon !== "none" ? ICONS[btn.icon] : null
    const stretch = compact && btn.fullWidth
    const grow = lit && !stretch ? btn.expand : 0

    return (
        <Tag
            ref={rootRef}
            {...linkProps}
            {...handlers}
            style={{
                width: "100%",
                height: "100%",
                minHeight: 320,
                ...style,
                position: "relative",
                display: "block",
                boxSizing: "border-box",
                borderRadius: card.radius,
                background: card.surface,
                boxShadow: card.shadow || "none",
                overflow: "hidden",
                isolation: "isolate",
                color: txt.titleColor,
                fontFamily,
                textDecoration: "none",
                cursor: "pointer",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}>
                {src ? (
                    <img
                        src={src}
                        srcSet={image && image.srcSet}
                        alt=""
                        draggable={false}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: dp.posX * 100 + "% " + dp.posY * 100 + "%",
                            transform: "scale(" + (lit && !isCanvas ? 1 + card.zoom : 1) + ")",
                            filter: "brightness(" + (lit ? 1 - card.dim : 1) + ")",
                            transition: "transform 1400ms " + EASE + ", filter 800ms " + EASE,
                        }}
                    />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #1C1C1C 0%, #0F0F0F 100%)" }} />
                )}
            </div>
            <canvas ref={cvRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none", zIndex: 1 }} />
            <div
                style={{
                    position: "absolute",
                    left: pad,
                    right: pad,
                    bottom: pad,
                    zIndex: 2,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: compact ? 20 : 32,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "1 1 320px", maxWidth: card.textWidth, minWidth: 0 }}>
                    {label ? (
                        <span style={{ fontSize: 12, fontWeight: 500, lineHeight: "1.3em", ...t0.labelFont, color: txt.labelColor, fontVariantNumeric: "tabular-nums" }}>{label}</span>
                    ) : null}
                    <h3 style={{ margin: 0, ...titleFont, color: txt.titleColor, ...({ textWrap: "balance" } as any) }}>{title}</h3>
                    {description ? (
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 500, lineHeight: "1.5em", ...t0.bodyFont, color: txt.bodyColor, ...({ textWrap: "pretty" } as any) }}>{description}</p>
                    ) : null}
                </div>
                {btn.show && (btn.label || icon) ? (
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: stretch ? "space-between" : "center",
                            gap: 10,
                            flex: stretch ? "1 1 100%" : "0 0 auto",
                            boxSizing: "border-box",
                            height: btn.height,
                            minWidth: btn.height,
                            paddingLeft: btn.label ? btn.padding + grow : 0,
                            paddingRight: btn.label ? (icon ? Math.max(0, btn.padding - 4) : btn.padding) + grow : 0,
                            borderRadius: btn.radius,
                            background: lit ? btn.fillHover : btn.fill,
                            color: lit ? btn.colorHover : btn.color,
                            boxShadow: "inset 0 0 0 1px " + btn.border,
                            backdropFilter: btn.blur ? "blur(" + btn.blur + "px)" : undefined,
                            WebkitBackdropFilter: btn.blur ? "blur(" + btn.blur + "px)" : undefined,
                            fontSize: 14,
                            fontWeight: 600,
                            lineHeight: "1em",
                            letterSpacing: "-0.01em",
                            whiteSpace: "nowrap",
                            ...b0.font,
                            transition: "padding 450ms " + EASE + ", background-color 450ms " + EASE + ", color 450ms " + EASE,
                        }}
                    >
                        {btn.label ? <span>{btn.label}</span> : null}
                        {icon ? (
                            <svg
                                width={16}
                                height={16}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden
                                style={{ display: "block", flexShrink: 0, transform: lit ? icon.hover : "none", transition: "transform 600ms " + EASE }}
                            >
                                <path d={icon.d} />
                            </svg>
                        ) : null}
                    </span>
                ) : null}
            </div>
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 3,
                    borderRadius: card.radius,
                    border: "1px solid " + (lit ? card.borderHover : card.border),
                    pointerEvents: "none",
                    transition: "border-color 600ms " + EASE,
                }}
            />
        </Tag>
    )
}

MatrixCard.displayName = "Matrix Card"

addPropertyControls(MatrixCard, {
    preview: {
        type: ControlType.Enum,
        title: "Preview",
        options: ["rest", "hover"],
        optionTitles: ["Rest", "Hover"],
        displaySegmentedControl: true,
        defaultValue: "hover",
        description: "Canvas only. The live card reacts to hover.",
    },
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    label: { type: ControlType.String, title: "Label", defaultValue: "2024" },
    title: { type: ControlType.String, title: "Title", defaultValue: "Afterglow in motion" },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Watch the Afterglow prototype on its first long run, filmed in one take from the studio to the open road.",
        displayTextArea: true,
    },
    link: { type: ControlType.Link, title: "Link" },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, hidden: (p: any) => !p.link },
    button: {
        type: ControlType.Object,
        title: "Button",
        buttonTitle: "Style",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true },
            label: { type: ControlType.String, title: "Label", defaultValue: "See video", hidden: (b: any) => b.show === false },
            icon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["arrow-up-right", "arrow-right", "plus", "none"],
                optionTitles: ["Arrow Up Right", "Arrow Right", "Plus", "None"],
                defaultValue: "none",
                hidden: (b: any) => b.show === false,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 14, variant: "Semibold", letterSpacing: "-0.01em", lineHeight: "1em" },
                hidden: (b: any) => b.show === false,
            },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "rgb(23, 23, 23)", hidden: (b: any) => b.show === false },
            color: { type: ControlType.Color, title: "Text", defaultValue: "rgb(255, 255, 255)", hidden: (b: any) => b.show === false },
            fillHover: { type: ControlType.Color, title: "Hover Fill", defaultValue: "rgb(255, 255, 255)", hidden: (b: any) => b.show === false },
            colorHover: { type: ControlType.Color, title: "Hover Text", defaultValue: "rgb(23, 23, 23)", hidden: (b: any) => b.show === false },
            border: { type: ControlType.Color, title: "Border", defaultValue: "rgba(0, 0, 0, 0)", hidden: (b: any) => b.show === false },
            blur: { type: ControlType.Number, title: "Blur", defaultValue: 0, min: 0, max: 40, step: 1, unit: "px", hidden: (b: any) => b.show === false },
            height: { type: ControlType.Number, title: "Height", defaultValue: 48, min: 28, max: 80, step: 1, unit: "px", hidden: (b: any) => b.show === false },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: 22, min: 8, max: 48, step: 1, unit: "px", hidden: (b: any) => b.show === false },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 999, min: 0, max: 999, step: 1, unit: "px", hidden: (b: any) => b.show === false },
            expand: { type: ControlType.Number, title: "Hover Expand", defaultValue: 2, min: 0, max: 24, step: 1, unit: "px", hidden: (b: any) => b.show === false },
            fullWidth: { type: ControlType.Boolean, title: "Mobile Full", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No", hidden: (b: any) => b.show === false },
        },
    },
    card: {
        type: ControlType.Object,
        title: "Card",
        buttonTitle: "Style",
        controls: {
            surface: { type: ControlType.Color, title: "Surface", defaultValue: "rgb(230, 230, 230)" },
            border: { type: ControlType.Color, title: "Border", defaultValue: "rgba(255, 255, 255, 0)" },
            borderHover: { type: ControlType.Color, title: "Hover Border", defaultValue: "rgba(255, 255, 255, 0)" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 64, step: 1, unit: "px" },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: 36, min: 12, max: 80, step: 1, unit: "px" },
            textWidth: { type: ControlType.Number, title: "Text Width", defaultValue: 560, min: 240, max: 1000, step: 10, unit: "px" },
            dim: { type: ControlType.Number, title: "Hover Dim", defaultValue: 0, min: 0, max: 90, step: 1, unit: "%" },
            zoom: { type: ControlType.Number, title: "Hover Zoom", defaultValue: 3, min: 0, max: 15, step: 0.5, unit: "%" },
            compact: { type: ControlType.Number, title: "Compact Below", defaultValue: 520, min: 0, max: 1200, step: 10, unit: "px" },
        },
    },
    text: {
        type: ControlType.Object,
        title: "Text",
        buttonTitle: "Fonts",
        controls: {
            titleFont: { type: ControlType.Font, title: "Title", controls: "extended", defaultFontType: "serif" as any, defaultValue: { fontSelector: "GF;Instrument Serif-regular", fontSize: 34, letterSpacing: "-0.03em", lineHeight: "1.1em" } as any },
            titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: "rgb(23, 23, 23)" },
            bodyFont: { type: ControlType.Font, title: "Description", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 16, variant: "Medium", lineHeight: "1.5em" } },
            bodyColor: { type: ControlType.Color, title: "Desc. Color", defaultValue: "rgba(23, 23, 23, 0.7)" },
            labelFont: { type: ControlType.Font, title: "Label", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 12, variant: "Medium", lineHeight: "1.3em" } },
            labelColor: { type: ControlType.Color, title: "Label Color", defaultValue: "rgba(255, 255, 255, 0)" },
        },
    },
    dots: {
        type: ControlType.Object,
        title: "Dots",
        buttonTitle: "Effect",
        controls: {
            tint: { type: ControlType.Enum, title: "Color", options: ["image", "solid"], optionTitles: ["Image", "Solid"], displaySegmentedControl: true, defaultValue: "image" },
            color: { type: ControlType.Color, title: "Dots", defaultValue: "rgb(23, 23, 23)" },
            accent: { type: ControlType.Color, title: "Wave", defaultValue: "rgb(84, 84, 84)" },
            size: { type: ControlType.Number, title: "Size", defaultValue: 1.6, min: 0.6, max: 6, step: 0.1, unit: "px" },
            spacing: { type: ControlType.Number, title: "Spacing", defaultValue: 7, min: 3, max: 24, step: 0.5, unit: "px" },
            deploy: { type: ControlType.Number, title: "Deploy", defaultValue: 1.1, min: 0.2, max: 3, step: 0.05, unit: "s" },
            organic: { type: ControlType.Number, title: "Organic", defaultValue: 45, min: 0, max: 100, step: 1, unit: "%" },
            twinkle: { type: ControlType.Number, title: "Twinkle", defaultValue: 70, min: 0, max: 100, step: 1, unit: "%" },
            floor: { type: ControlType.Number, title: "Min Bright", defaultValue: 37, min: 0, max: 100, step: 1, unit: "%" },
            glow: { type: ControlType.Number, title: "Cursor Lens", defaultValue: 180, min: 0, max: 400, step: 1, unit: "px" },
            lift: { type: ControlType.Number, title: "White Lift", defaultValue: 22, min: 0, max: 100, step: 1, unit: "%", hidden: (d: any) => d.tint === "solid" },
            idle: { type: ControlType.Number, title: "Idle", defaultValue: 0, min: 0, max: 100, step: 1, unit: "%" },
        },
    },
    onClick: { type: ControlType.EventHandler },
})
