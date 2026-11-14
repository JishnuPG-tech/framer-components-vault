// Cursor Frame Button – a CTA with a viewfinder frame.
// Four corner brackets follow the pointer near the button, get pulled in and lock onto its corners.
// A click fires the shutter: the frame squeezes, a light sweeps across the button, then the link opens.
// The button leans toward the pointer, lights up under it, and the corners click in one after another.
// DOM only (no WebGL), own spring animation, sleeps at rest.
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


const CREDIT = "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"

// ─── Looks ────────────────────────────────────────────────────────────────────
type Look = { key: string; title: string; fill: string; text: string; frame: string; lock: string }
const LOOKS: Look[] = [
    { key: "onyx", title: "Onyx", fill: "#0D0E10", text: "#FFFFFF", frame: "#9A9FA6", lock: "#0D0E10" },
    { key: "paper", title: "Paper", fill: "#F6F5F1", text: "#0D0E10", frame: "#8A8F98", lock: "#FFFFFF" },
    { key: "signal", title: "Signal", fill: "#0D0E10", text: "#FFFFFF", frame: "#8A8F98", lock: "#1FCB6B" },
    { key: "amber", title: "Amber", fill: "#16130D", text: "#FFF6E2", frame: "#8F8878", lock: "#F5A51B" },
    { key: "cobalt", title: "Cobalt", fill: "#2450FF", text: "#FFFFFF", frame: "#8A8F98", lock: "#2450FF" },
]
const LOOK_BY_KEY: Record<string, Look> = Object.fromEntries(LOOKS.map((l) => [l.key, l]))

// ─── Props ────────────────────────────────────────────────────────────────────
type ColorsProps = { custom?: boolean; fill?: string; text?: string; frame?: string; lock?: string }
type FrameProps = {
    idle?: "docked" | "hidden"
    idleOpacity?: number
    range?: number
    size?: number
    corner?: number
    stroke?: number
    cornerRadius?: number
    gap?: number
    glow?: number
    ticks?: boolean
    reticle?: boolean
    canvas?: "button" | "rest" | "locked"
}
type MotionProps = { magnet?: number; stiffness?: number; damping?: number; squeeze?: number; flash?: number; linkDelay?: number; tilt?: number; textPull?: number; shock?: number }
type TextProps = { font?: React.CSSProperties; textCase?: "none" | "upper" }
type BorderProps = { width?: number; colorAuto?: boolean; color?: string }
type HoverProps = { press?: number; focus?: string; spot?: number }
type Props = {
    title?: string
    link?: string
    newTab?: boolean
    look?: string
    colors?: ColorsProps
    frame?: FrameProps
    motion?: MotionProps
    text?: TextProps
    border?: BorderProps
    padding?: string
    radius?: string
    shadow?: string | string[]
    hover?: HoverProps
    onClick?: (e: React.MouseEvent) => void
    label?: string
    style?: React.CSSProperties
}

const DEF = {
    title: "Get Started",
    padding: "22px 46px 22px 46px",
    radius: "16px",
    shadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.2), 0px 6px 14px -6px rgba(0, 0, 0, 0.3), 0px 26px 48px -20px rgba(0, 0, 0, 0.55)",
    fontSize: 17,
    idleOpacity: 70,
    range: 140,
    size: 44,
    corner: 18,
    stroke: 2,
    cornerRadius: 7,
    gap: 12,
    glow: 50,
    magnet: 60,
    stiffness: 260,
    damping: 20,
    squeeze: 6,
    flash: 60,
    linkDelay: 0.3,
    tilt: 5,
    textPull: 3,
    shock: 60,
    spot: 60,
    press: 97,
}

type Palette = { fill: string; text: string; frame: string; lock: string }
function palette(p: Props): Palette {
    const base = LOOK_BY_KEY[p.look ?? "onyx"] ?? LOOKS[0]
    const c = p.colors ?? {}
    if (!c.custom) return { fill: base.fill, text: base.text, frame: base.frame, lock: base.lock }
    return { fill: c.fill ?? base.fill, text: c.text ?? base.text, frame: c.frame ?? base.frame, lock: c.lock ?? base.lock }
}

// ─── Colour helpers (no DOM, SSR-safe) ───────────────────────────────────────
type RGBA = [number, number, number, number]
function parseColor(input: string | undefined): RGBA {
    const s = (input ?? "").trim().toLowerCase()
    let m = s.match(/^#([0-9a-f]{3,8})$/)
    if (m) {
        let h = m[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((ch) => ch + ch).join("")
        const n = parseInt(h.slice(0, 6), 16)
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
    }
    m = s.match(/^rgba?\(([^)]+)\)$/)
    if (m) {
        const parts = m[1].split(/[\s,\/]+/).filter(Boolean)
        const v = parts.slice(0, 3).map((x) => (x.endsWith("%") ? parseFloat(x) * 2.55 : parseFloat(x)))
        const a = parts[3] !== undefined ? (parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])) : 1
        if (v.every((x) => isFinite(x))) return [v[0], v[1], v[2], isFinite(a) ? a : 1]
    }
    m = s.match(/^hsla?\(([^)]+)\)$/)
    if (m) {
        const parts = m[1].split(/[\s,\/]+/).filter(Boolean)
        const [hh, ss, ll] = parts.map(parseFloat)
        const h = (((hh % 360) + 360) % 360) / 360, sat = ss / 100, l = ll / 100
        const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p = 2 * l - q
        const f = (t: number) => {
            t = (t + 1) % 1
            return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
        }
        return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255, parts[3] !== undefined ? parseFloat(parts[3]) : 1]
    }
    return [128, 128, 128, 1]
}
const luminance = (c: RGBA) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255
const rgba = (c: RGBA, alpha = 1) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${+(c[3] * alpha).toFixed(3)})`
const mix = (a: RGBA, b: RGBA, t: number): RGBA => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// ─── Shell ────────────────────────────────────────────────────────────────────
type FrameCfg = { gap: number; corner: number; stroke: number; cornerRadius: number; glow: number; idleOpacity: number; idle: "docked" | "hidden" }
function frameCfg(p: Props): FrameCfg {
    const f = p.frame ?? {}
    return {
        gap: f.gap ?? DEF.gap,
        corner: f.corner ?? DEF.corner,
        stroke: f.stroke ?? DEF.stroke,
        cornerRadius: f.cornerRadius ?? DEF.cornerRadius,
        glow: f.glow ?? DEF.glow,
        idleOpacity: (f.idleOpacity ?? DEF.idleOpacity) / 100,
        idle: f.idle ?? "docked",
    }
}

const CORNERS = ["tl", "tr", "bl", "br"] as const
type CornerKey = (typeof CORNERS)[number]

function cornerStyle(k: CornerKey, cfg: FrameCfg, color: string): React.CSSProperties {
    const top = k[0] === "t", left = k[1] === "l"
    const line = `${cfg.stroke}px solid ${color}`
    const r = Math.min(cfg.cornerRadius, cfg.corner)
    return {
        position: "absolute",
        width: cfg.corner,
        height: cfg.corner,
        boxSizing: "border-box",
        [top ? "top" : "bottom"]: -cfg.gap,
        [left ? "left" : "right"]: -cfg.gap,
        [top ? "borderTop" : "borderBottom"]: line,
        [left ? "borderLeft" : "borderRight"]: line,
        [`border${top ? "Top" : "Bottom"}${left ? "Left" : "Right"}Radius`]: r,
        willChange: "transform",
    } as React.CSSProperties
}

type Shell = {
    props: Props
    pal: Palette
    uid: string
    locked: boolean // static: frame drawn locked
    noFrame?: boolean // static: button only
    rootRef?: React.Ref<HTMLElement>
    overlayRef?: React.Ref<HTMLSpanElement>
    cornerRefs?: React.MutableRefObject<Record<CornerKey, HTMLSpanElement | null>>
    pulseRef?: React.Ref<HTMLSpanElement>
    scanRef?: React.Ref<HTMLSpanElement>
    spotRef?: React.Ref<HTMLSpanElement>
    flashRef?: React.Ref<HTMLSpanElement>
    labelRef?: React.Ref<HTMLSpanElement>
    shockRef?: React.Ref<HTMLSpanElement>
    reticleRef?: React.Ref<HTMLSpanElement>
    tickRefs?: React.MutableRefObject<(HTMLSpanElement | null)[]>
    events?: Record<string, unknown>
}

const TICK = 7
// keeps only the four corners of a box (used by the click ring, so it never reads as a plain rectangle)
const CORNER_MASK = ["left top", "right top", "left bottom", "right bottom"].map((p) => `linear-gradient(#000, #000) ${p} / 26% 42% no-repeat`).join(", ")
function tickStyle(i: number, cfg: FrameCfg, color: string, on: boolean): React.CSSProperties {
    // 0 top, 1 right, 2 bottom, 3 left: short marks at the middle of each side of the locked frame
    const horiz = i === 0 || i === 2
    const st: React.CSSProperties = { position: "absolute", background: color, borderRadius: cfg.stroke, opacity: on ? 0.9 : 0, willChange: "transform, opacity" }
    if (horiz) Object.assign(st, { left: "50%", marginLeft: -cfg.stroke / 2, width: cfg.stroke, height: TICK, [i === 0 ? "top" : "bottom"]: -cfg.gap - TICK / 2 + cfg.stroke / 2 })
    else Object.assign(st, { top: "50%", marginTop: -cfg.stroke / 2, height: cfg.stroke, width: TICK, [i === 3 ? "left" : "right"]: -cfg.gap - TICK / 2 + cfg.stroke / 2 })
    return st
}

function renderShell({ props, pal, uid, locked, noFrame, rootRef, overlayRef, cornerRefs, pulseRef, scanRef, spotRef, flashRef, labelRef, shockRef, reticleRef, tickRefs, events }: Shell) {
    const { title = DEF.title, link, newTab, text = {}, border = {}, hover = {}, padding = DEF.padding, radius = DEF.radius, shadow = DEF.shadow, label, style } = props
    const font = text.font ?? {}
    const cfg = frameCfg(props)
    const hasLink = typeof link === "string" && link.trim() !== ""
    const bw = border.width ?? 1
    const focus = hover.focus ?? "#4D8DFF"
    const fillC = parseColor(pal.fill)
    const lightFill = luminance(fillC) > 0.6
    const lockC = parseColor(pal.lock), frameC = parseColor(pal.frame)
    const color = locked ? rgba(lockC) : rgba(frameC)
    const glowPx = (cfg.glow / 100) * 10
    const Tag = (hasLink ? "a" : "button") as "a"
    const linkAttrs = hasLink
        ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined }
        : { type: "button" as const }
    const hidden = !locked && cfg.idle === "hidden"
    const white: RGBA = [255, 255, 255, fillC[3]], black: RGBA = [0, 0, 0, fillC[3]]
    const surface = `linear-gradient(180deg, ${rgba(mix(fillC, white, lightFill ? 0.6 : 0.13))} 0%, ${rgba(fillC)} 52%, ${rgba(mix(fillC, black, lightFill ? 0.07 : 0.32))} 100%)`
    const showTicks = props.frame?.ticks !== false
    const showReticle = props.frame?.reticle !== false
    return (
        <Tag
            ref={rootRef as React.Ref<HTMLAnchorElement>}
            className={uid}
            aria-label={label || undefined}
            {...linkAttrs}
            {...(events as object)}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                padding,
                borderRadius: radius,
                border: "none",
                margin: 0,
                font: "inherit",
                textDecoration: "none",
                cursor: "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "manipulation",
                background: surface,
                boxShadow: (Array.isArray(shadow) ? shadow.join(", ") : shadow) || undefined,
                willChange: "transform",
                ...style,
            }}
        >
            <style>{`.${uid}:focus-visible{outline:2px solid ${focus};outline-offset:${cfg.gap + cfg.stroke + 4}px}.${uid}{-webkit-tap-highlight-color:transparent}`}</style>
            {/* surface: edge light + the click sweep, clipped to the button */}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    overflow: "hidden",
                    pointerEvents: "none",
                    boxShadow: [
                        bw > 0 ? `inset 0 0 0 ${bw}px ${border.colorAuto === false && border.color ? border.color : lightFill ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)"}` : "",
                        lightFill ? "inset 0 1px 0 rgba(255, 255, 255, 0.95)" : "inset 0 1px 0 rgba(255, 255, 255, 0.22)",
                        lightFill ? "inset 0 -1px 0 rgba(0, 0, 0, 0.06)" : "inset 0 -1px 0 rgba(0, 0, 0, 0.5)",
                        lightFill ? "inset 0 -10px 16px -12px rgba(0, 0, 0, 0.08)" : "inset 0 -12px 20px -12px rgba(0, 0, 0, 0.6)",
                    ]
                        .filter(Boolean)
                        .join(", "),
                }}
            >
                {/* soft dome sheen */}
                <span
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: lightFill
                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 48%)"
                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.025) 46%, rgba(255, 255, 255, 0) 52%)",
                    }}
                />
                {/* light under the pointer */}
                <span
                    ref={spotRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        background: lightFill
                            ? "radial-gradient(circle 130px at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%)"
                            : "radial-gradient(circle 130px at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.06) 45%, rgba(255, 255, 255, 0) 72%)",
                        willChange: "opacity",
                    }}
                />
                {/* shutter flash */}
                <span ref={flashRef} style={{ position: "absolute", inset: 0, opacity: 0, background: lightFill ? "#000000" : "#FFFFFF", willChange: "opacity" }} />
                <span
                    ref={scanRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: "46%",
                        opacity: 0,
                        transform: "translateX(-110%) skewX(-16deg)",
                        background: lightFill
                            ? "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.10) 50%, rgba(0, 0, 0, 0) 100%)"
                            : "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.30) 50%, rgba(255, 255, 255, 0) 100%)",
                        willChange: "transform, opacity",
                    }}
                />
            </span>
            <span
                ref={labelRef}
                style={{
                    position: "relative",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    willChange: "transform",
                    color: pal.text,
                    fontSize: DEF.fontSize,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                    ...font,
                    textTransform: (text.textCase ?? "none") === "upper" ? "uppercase" : "none",
                }}
            >
                {title}
            </span>
            {/* the viewfinder frame: never blocks clicks, never changes layout */}
            <span
                ref={overlayRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    opacity: noFrame ? 0 : locked ? 1 : hidden ? 0 : cfg.idleOpacity,
                    filter: locked && glowPx > 0 ? `drop-shadow(0 0 ${glowPx}px ${rgba(lockC, 0.55)})` : undefined,
                    willChange: "opacity, filter",
                }}
            >
                {CORNERS.map((k) => (
                    <span
                        key={k}
                        ref={
                            cornerRefs
                                ? (el) => {
                                      cornerRefs.current[k] = el
                                  }
                                : undefined
                        }
                        style={cornerStyle(k, cfg, color)}
                    />
                ))}
                {showTicks &&
                    [0, 1, 2, 3].map((i) => (
                        <span
                            key={"t" + i}
                            ref={
                                tickRefs
                                    ? (el) => {
                                          tickRefs.current[i] = el
                                      }
                                    : undefined
                            }
                            style={tickStyle(i, cfg, color, locked)}
                        />
                    ))}
                {showReticle && (
                    <span
                        ref={reticleRef}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: 11,
                            height: 11,
                            margin: "-5.5px 0 0 -5.5px",
                            opacity: 0,
                            background: `linear-gradient(${rgba(frameC)}, ${rgba(frameC)}) center / 100% 1.5px no-repeat, linear-gradient(${rgba(frameC)}, ${rgba(frameC)}) center / 1.5px 100% no-repeat`,
                            willChange: "transform, opacity",
                        }}
                    />
                )}
                <span
                    ref={shockRef}
                    style={{
                        position: "absolute",
                        inset: -cfg.gap,
                        boxSizing: "border-box",
                        border: `1.5px solid ${rgba(lockC)}`,
                        borderRadius: Math.min(cfg.cornerRadius, cfg.corner) + 2,
                        WebkitMask: CORNER_MASK,
                        mask: CORNER_MASK,
                        opacity: 0,
                        willChange: "transform, opacity",
                    }}
                />
            </span>
        </Tag>
    )
}

function useUid() {
    const id = (React as unknown as { useId?: () => string }).useId?.() ?? "x"
    return "cfb-" + id.replace(/[^a-zA-Z0-9_-]/g, "")
}

// ─── Static (canvas, thumbnails) ──────────────────────────────────────────────
function StaticButton(props: Props) {
    // the canvas shows only the button by default; "On Canvas" can show the frame at rest or locked
    const mode = props.frame?.canvas ?? "button"
    return renderShell({ props, pal: palette(props), uid: useUid(), locked: mode === "locked", noFrame: mode === "button" })
}

// ─── Live ─────────────────────────────────────────────────────────────────────
type Spring = { x: number; v: number; t: number }
const spring = (x: number): Spring => ({ x, v: 0, t: x })

function LiveButton(props: Props) {
    const pal = palette(props)
    const uid = useUid()
    const rootRef = React.useRef<HTMLElement>(null)
    const overlayRef = React.useRef<HTMLSpanElement>(null)
    const pulseRef = React.useRef<HTMLSpanElement>(null)
    const scanRef = React.useRef<HTMLSpanElement>(null)
    const cornerRefs = React.useRef<Record<CornerKey, HTMLSpanElement | null>>({ tl: null, tr: null, bl: null, br: null })
    const spotRef = React.useRef<HTMLSpanElement>(null)
    const flashRef = React.useRef<HTMLSpanElement>(null)
    const labelRef = React.useRef<HTMLSpanElement>(null)
    const shockRef = React.useRef<HTMLSpanElement>(null)
    const reticleRef = React.useRef<HTMLSpanElement>(null)
    const tickRefs = React.useRef<(HTMLSpanElement | null)[]>([null, null, null, null])

    // everything the loop reads lives in a ref, so prop changes never restart it
    const live = React.useRef({
        pal,
        cfg: frameCfg(props),
        frame: props.frame ?? {},
        motion: props.motion ?? {},
        hover: props.hover ?? {},
        link: props.link,
        newTab: props.newTab,
        kick: () => {},
        shutter: () => {},
    })
    live.current.pal = pal
    live.current.cfg = frameCfg(props)
    live.current.frame = props.frame ?? {}
    live.current.motion = props.motion ?? {}
    live.current.hover = props.hover ?? {}
    live.current.link = props.link
    live.current.newTab = props.newTab

    React.useEffect(() => {
        live.current.kick()
    }, [pal.fill, pal.frame, pal.lock, JSON.stringify(props.frame ?? {}), JSON.stringify(props.motion ?? {}), JSON.stringify(props.hover ?? {}), props.padding, props.radius])

    React.useEffect(() => {
        const root = rootRef.current, overlay = overlayRef.current
        if (!root || !overlay) return
        const L = live.current
        const reduce = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
        const canHover = typeof matchMedia === "function" ? matchMedia("(hover: hover) and (pointer: fine)").matches : true

        let W = root.offsetWidth, H = root.offsetHeight
        const g0 = L.cfg.gap
        // frame rectangle (button-local px) + lock amount + opacity
        const S = {
            cx: spring(W / 2),
            cy: spring(H / 2),
            w: spring(W + 2 * g0),
            h: spring(H + 2 * g0),
            lock: spring(0),
            op: spring(L.cfg.idle === "hidden" && canHover ? 0 : L.cfg.idleOpacity),
        }
        // button pose, label pull, pointer light, reticle, per-corner snap offsets
        const B = { rx: spring(0), ry: spring(0), sc: spring(1), lx: spring(0), ly: spring(0), spot: spring(0), free: spring(0) }
        const O = [spring(0), spring(0), spring(0), spring(0)] // tl, tr, br, bl (outward px)
        const hold = [0, 0, 0, 0]
        const soft = new Set<Spring>([S.lock, S.op, B.spot, B.free])
        const all = [S.cx, S.cy, S.w, S.h, S.lock, S.op, B.rx, B.ry, B.sc, B.lx, B.ly, B.spot, B.free, ...O]
        let mxp = 50, myp = 50 // pointer inside the button, %
        let shock = 0, flashV = 0
        const P = { has: false, cx: 0, cy: 0 } // pointer in client px
        let raf = 0, running = false, last = 0, onScreen = true, disposed = false
        let focused = false, down = false, wasLocked = false
        let pulse = 0 // 1 → 0 after locking
        let scan = -1 // 0 → 1 while the sweep runs, -1 = idle
        let squeezeT = 0 // seconds left of the click squeeze
        let tapLock = 0 // seconds the frame stays locked after a tap / key press

        const measure = () => {
            W = root.offsetWidth
            H = root.offsetHeight
        }

        const targets = () => {
            const cfg = L.cfg, F = L.frame, M = L.motion
            const g = cfg.gap
            const lockedW = W + 2 * g, lockedH = H + 2 * g
            let mode: "idle" | "free" | "locked" = "idle"
            let px = 0, py = 0, d = Infinity
            if (P.has && canHover) {
                const r = root.getBoundingClientRect()
                const sx = r.width / (W || 1) || 1, sy = r.height / (H || 1) || 1
                px = (P.cx - r.left) / sx
                py = (P.cy - r.top) / sy
                const dx = Math.max(0 - px, 0, px - W), dy = Math.max(0 - py, 0, py - H)
                d = Math.hypot(dx, dy)
                const range = F.range ?? DEF.range
                if (d <= 0.5) mode = "locked"
                else if (d <= range) mode = "free"
            }
            const over = mode === "locked" && !reduce?.matches
            if (over) {
                const nx = clamp((px / (W || 1) - 0.5) * 2, -1, 1), ny = clamp((py / (H || 1) - 0.5) * 2, -1, 1)
                const tilt = M.tilt ?? DEF.tilt, pullT = M.textPull ?? DEF.textPull
                B.rx.t = -ny * tilt
                B.ry.t = nx * tilt
                B.lx.t = nx * pullT
                B.ly.t = ny * pullT
                B.spot.t = (L.hover.spot ?? DEF.spot) / 100
                mxp = clamp((px / (W || 1)) * 100, 0, 100)
                myp = clamp((py / (H || 1)) * 100, 0, 100)
            } else {
                B.rx.t = B.ry.t = B.lx.t = B.ly.t = 0
                B.spot.t = 0
            }
            B.sc.t = down ? (L.hover.press ?? DEF.press) / 100 : 1
            if (focused || tapLock > 0) mode = "locked"
            B.free.t = mode === "free" ? 1 : 0
            if (mode === "locked") {
                const sq = down || squeezeT > 0 ? (M.squeeze ?? DEF.squeeze) : 0
                S.cx.t = W / 2
                S.cy.t = H / 2
                S.w.t = lockedW - 2 * sq
                S.h.t = lockedH - 2 * sq
                S.lock.t = 1
                S.op.t = 1
            } else if (mode === "free") {
                const range = F.range ?? DEF.range
                const t = clamp(1 - d / range, 0, 1)
                const pull = ((M.magnet ?? DEF.magnet) / 100) * t * t
                const size = F.size ?? DEF.size
                S.cx.t = lerp(px, W / 2, pull)
                S.cy.t = lerp(py, H / 2, pull)
                S.w.t = lerp(size, lockedW, pull)
                S.h.t = lerp(size, lockedH, pull)
                S.lock.t = 0
                S.op.t = clamp(t * 5, 0, 1)
            } else {
                const docked = cfg.idle === "docked" || !canHover
                S.lock.t = 0
                if (docked) {
                    S.cx.t = W / 2
                    S.cy.t = H / 2
                    S.w.t = lockedW
                    S.h.t = lockedH
                    S.op.t = cfg.idleOpacity
                } else S.op.t = 0
            }
            return mode
        }

        const apply = () => {
            const cfg = L.cfg, g = cfg.gap
            const x0 = S.cx.x - S.w.x / 2, x1 = S.cx.x + S.w.x / 2
            const top = S.cy.x - S.h.x / 2, bottom = S.cy.x + S.h.x / 2
            const c = cornerRefs.current
            const lock = clamp(S.lock.x, 0, 1)
            const color = rgba(mix(parseColor(L.pal.frame), parseColor(L.pal.lock), lock))
            const len = (cfg.corner + lock * 5).toFixed(1) + "px"
            const set = (el: HTMLSpanElement | null, dx: number, dy: number) => {
                if (!el) return
                el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`
                el.style.borderColor = color
                el.style.width = len
                el.style.height = len
            }
            set(c.tl, x0 + g - O[0].x, top + g - O[0].x)
            set(c.tr, x1 - (W + g) + O[1].x, top + g - O[1].x)
            set(c.br, x1 - (W + g) + O[2].x, bottom - (H + g) + O[2].x)
            set(c.bl, x0 + g - O[3].x, bottom - (H + g) + O[3].x)
            // side marks ride on the locked frame
            const tk = tickRefs.current
            const tOp = (lock * lock * 0.9).toFixed(3)
            const mx = S.cx.x - W / 2, my = S.cy.x - H / 2
            const tset = (el: HTMLSpanElement | null, dx: number, dy: number) => {
                if (!el) return
                el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`
                el.style.opacity = tOp
                el.style.background = color
            }
            tset(tk[0], mx, top + g)
            tset(tk[1], x1 - (W + g), my)
            tset(tk[2], mx, bottom - (H + g))
            tset(tk[3], x0 + g, my)
            const rt = reticleRef.current
            if (rt) {
                const f = clamp(B.free.x, 0, 1)
                rt.style.opacity = f.toFixed(3)
                rt.style.transform = `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0) rotate(${((1 - f) * 90).toFixed(1)}deg) scale(${(0.4 + 0.6 * f).toFixed(3)})`
            }
            // button pose, label, pointer light
            const posed = Math.abs(B.rx.x) > 0.01 || Math.abs(B.ry.x) > 0.01 || Math.abs(B.sc.x - 1) > 0.0005
            root.style.transform = posed ? `perspective(700px) rotateX(${B.rx.x.toFixed(3)}deg) rotateY(${B.ry.x.toFixed(3)}deg) scale(${B.sc.x.toFixed(4)})` : ""
            const lb = labelRef.current
            if (lb) lb.style.transform = Math.abs(B.lx.x) > 0.01 || Math.abs(B.ly.x) > 0.01 ? `translate3d(${B.lx.x.toFixed(2)}px, ${B.ly.x.toFixed(2)}px, 0)` : ""
            const sp = spotRef.current
            if (sp) {
                sp.style.opacity = clamp(B.spot.x, 0, 1).toFixed(3)
                sp.style.setProperty("--mx", mxp.toFixed(1) + "%")
                sp.style.setProperty("--my", myp.toFixed(1) + "%")
            }
            const fl = flashRef.current
            if (fl) fl.style.opacity = (flashV * flashV * 0.3 * ((L.motion.flash ?? DEF.flash) / 60)).toFixed(3)
            const sh = shockRef.current
            if (sh) {
                if (shock > 0.01) {
                    const e = 1 - shock
                    const ease = 1 - (1 - e) * (1 - e) * (1 - e)
                    const k = (L.motion.shock ?? DEF.shock) / 60
                    sh.style.opacity = (shock * shock * 0.55 * Math.min(1, k)).toFixed(3)
                    sh.style.transform = `scale(${(1 + ease * 0.22 * k).toFixed(4)}, ${(1 + ease * 0.5 * k).toFixed(4)})`
                } else sh.style.opacity = "0"
            }
            overlay.style.opacity = clamp(S.op.x, 0, 1).toFixed(3)
            const glowPx = (cfg.glow / 100) * 10 * lock * (1 + pulse * 1.4 + shock * 1.2)
            overlay.style.filter = glowPx > 0.3 ? `drop-shadow(0 0 ${glowPx.toFixed(1)}px ${rgba(parseColor(L.pal.lock), 0.55 * lock)})` : "none"
            const sc = scanRef.current
            if (sc) {
                if (scan >= 0) {
                    const e = scan * scan * (3 - 2 * scan)
                    sc.style.opacity = String(((L.motion.flash ?? DEF.flash) / 60) * Math.sin(Math.PI * clamp(scan, 0, 1)))
                    sc.style.transform = `translateX(${(-110 + e * 340).toFixed(1)}%) skewX(-16deg)`
                } else sc.style.opacity = "0"
            }
        }

        const frame = (now: number) => {
            raf = 0
            if (disposed) return
            const dt = clamp((now - (last || now)) / 1000, 0, 1 / 20)
            last = now
            const M = L.motion
            if (squeezeT > 0) squeezeT = Math.max(0, squeezeT - dt)
            if (tapLock > 0) tapLock = Math.max(0, tapLock - dt)
            const mode = targets()
            const still = !!reduce?.matches
            if (mode === "locked" && !wasLocked && !still) {
                pulse = 1
                // the frame overshoots as it snaps on, corners click in one after another
                S.w.v -= 140
                S.h.v -= 140
                for (let i = 0; i < 4; i++) {
                    O[i].x = 9
                    O[i].v = 0
                    hold[i] = 0.03 + i * 0.045
                }
            }
            wasLocked = mode === "locked"
            if (pulse > 0) pulse = Math.max(0, pulse - dt * 2.4)
            if (shock > 0) shock = Math.max(0, shock - dt * 1.9)
            if (flashV > 0) flashV = Math.max(0, flashV - dt * 5.5)
            let holding = false
            for (let i = 0; i < 4; i++)
                if (hold[i] > 0) {
                    hold[i] = Math.max(0, hold[i] - dt)
                    holding = true
                }
            if (scan >= 0) {
                scan += dt / 0.42
                if (scan >= 1) scan = -1
            }
            let moving = false
            if (still) {
                for (const s of all) {
                    s.x = s.t
                    s.v = 0
                }
                hold.fill(0)
            } else {
                const k = M.stiffness ?? DEF.stiffness, c = M.damping ?? DEF.damping
                const steps = 3, h = dt / steps
                for (const s of all) {
                    // opacity and lock never overshoot
                    const oi = O.indexOf(s)
                    if (oi >= 0 && hold[oi] > 0) continue
                    const isSoft = soft.has(s)
                    const kk = isSoft ? 320 : oi >= 0 ? 520 : k
                    const cc = isSoft ? 36 : oi >= 0 ? 17 : c
                    for (let i = 0; i < steps; i++) {
                        s.v += (-kk * (s.x - s.t) - cc * s.v) * h
                        s.x += s.v * h
                    }
                    if (Math.abs(s.x - s.t) > 0.02 || Math.abs(s.v) > 0.05) moving = true
                }
            }
            apply()
            if (moving || holding || pulse > 0 || shock > 0 || flashV > 0 || scan >= 0 || squeezeT > 0 || tapLock > 0) raf = requestAnimationFrame(frame)
            else {
                running = false
                last = 0
            }
        }

        const kick = () => {
            if (disposed) return
            if (!running && onScreen) {
                running = true
                last = 0
                raf = requestAnimationFrame(frame)
            }
        }
        L.kick = () => {
            measure()
            kick()
        }
        L.shutter = () => {
            if (reduce?.matches) return
            squeezeT = 0.14
            tapLock = Math.max(tapLock, 0.7)
            if ((L.motion.flash ?? DEF.flash) > 0) {
                scan = 0
                flashV = 1
            }
            if ((L.motion.shock ?? DEF.shock) > 0) {
                shock = 1
                for (const o of O) o.v += 260
            }
            kick()
        }

        // pointer near the button: only mouse-like pointers move the frame
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" && e.pointerType !== "pen") return
            P.has = true
            P.cx = e.clientX
            P.cy = e.clientY
            kick()
        }
        const onOut = (e: PointerEvent) => {
            if (!e.relatedTarget) {
                P.has = false
                kick()
            }
        }
        const onScroll = () => {
            if (P.has) kick()
        }
        const onDown = () => {
            down = true
            kick()
        }
        const onUp = () => {
            down = false
            kick()
        }
        const onFocus = () => {
            let fv = true
            try {
                fv = root.matches(":focus-visible")
            } catch {
                fv = true
            }
            focused = fv
            kick()
        }
        const onBlur = () => {
            focused = false
            kick()
        }

        let listening = false
        const listen = (on: boolean) => {
            if (on === listening) return
            listening = on
            const f = on ? "addEventListener" : "removeEventListener"
            if (canHover) {
                document[f]("pointermove", onMove as EventListener, { passive: true } as AddEventListenerOptions)
                document.documentElement[f]("pointerout", onOut as EventListener)
                window[f]("scroll", onScroll, { passive: true, capture: true } as AddEventListenerOptions)
            }
        }
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointerup", onUp)
        root.addEventListener("pointercancel", onUp)
        root.addEventListener("pointerleave", onUp)
        root.addEventListener("focus", onFocus)
        root.addEventListener("blur", onBlur)

        const io =
            typeof IntersectionObserver === "function"
                ? new IntersectionObserver(
                      (entries) => {
                          onScreen = entries[entries.length - 1].isIntersecting
                          listen(onScreen)
                          if (onScreen) kick()
                          else P.has = false
                      },
                      { rootMargin: "200px" }
                  )
                : null
        if (io) io.observe(root)
        else listen(true)
        const ro =
            typeof ResizeObserver === "function"
                ? new ResizeObserver(() => {
                      measure()
                      kick()
                  })
                : null
        ro?.observe(root)
        const onReduce = () => kick()
        reduce?.addEventListener?.("change", onReduce)

        apply()
        kick()

        return () => {
            disposed = true
            if (raf) cancelAnimationFrame(raf)
            listen(false)
            L.kick = () => {}
            L.shutter = () => {}
            root.style.transform = ""
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointerup", onUp)
            root.removeEventListener("pointercancel", onUp)
            root.removeEventListener("pointerleave", onUp)
            root.removeEventListener("focus", onFocus)
            root.removeEventListener("blur", onBlur)
            io?.disconnect()
            ro?.disconnect()
            reduce?.removeEventListener?.("change", onReduce)
        }
    }, [])

    const navTimer = React.useRef(0)
    React.useEffect(() => () => clearTimeout(navTimer.current), [])

    const onClick = (e: React.MouseEvent) => {
        live.current.shutter()
        props.onClick?.(e)
        const link = (props.link ?? "").trim()
        if (!link || props.newTab || e.defaultPrevented) return
        // same tab: let the shutter play, then go. New tabs and modified clicks stay native.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        const delay = props.motion?.linkDelay ?? DEF.linkDelay
        const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
        if (delay <= 0 || reduce) return
        const href = (e.currentTarget as HTMLAnchorElement).href || link
        e.preventDefault()
        clearTimeout(navTimer.current)
        navTimer.current = window.setTimeout(() => {
            window.location.assign(href)
        }, delay * 1000)
    }

    const events = { onClick }

    return renderShell({ props, pal, uid, locked: false, rootRef, overlayRef, cornerRefs, pulseRef, scanRef, spotRef, flashRef, labelRef, shockRef, reticleRef, tickRefs, events })
}

/**
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-auto
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 66
 * @framerDisableUnlink
 */
export default function CursorFrameButton(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticButton {...props} />
    return <LiveButton {...props} />
}

CursorFrameButton.displayName = "Cursor Frame Button"

const notCustom = (c: ColorsProps) => c.custom !== true

addPropertyControls(CursorFrameButton, {
    title: { type: ControlType.String, title: "Title", defaultValue: DEF.title },
    link: { type: ControlType.Link, title: "Link", defaultValue: "" },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    look: {
        type: ControlType.Enum,
        title: "Look",
        options: LOOKS.map((l) => l.key),
        optionTitles: LOOKS.map((l) => l.title),
        defaultValue: "onyx",
        description: "Onyx and Cobalt suit light pages, Paper suits dark pages, Signal and Amber work on both.",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            custom: { type: ControlType.Boolean, title: "Mode", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Look" },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: LOOKS[0].fill, hidden: notCustom },
            text: { type: ControlType.Color, title: "Text", defaultValue: LOOKS[0].text, hidden: notCustom },
            frame: { type: ControlType.Color, title: "Frame", defaultValue: LOOKS[0].frame, hidden: notCustom, description: "The frame while it follows the pointer." },
            lock: { type: ControlType.Color, title: "Locked", defaultValue: LOOKS[0].lock, hidden: notCustom, description: "The frame once it sits on the button. It is drawn on the page, so pick a color that reads on your background." },
        },
    },
    frame: {
        type: ControlType.Object,
        title: "Frame",
        controls: {
            canvas: {
                type: ControlType.Enum,
                title: "On Canvas",
                options: ["button", "rest", "locked"],
                optionTitles: ["Button", "At Rest", "Locked"],
                defaultValue: "button",
                description: "What the Framer canvas shows: the button alone, the frame at rest, or the frame locked on. The live site is not affected.",
            },
            idle: {
                type: ControlType.Enum,
                title: "At Rest",
                options: ["docked", "hidden"],
                optionTitles: ["Docked", "Hidden"],
                displaySegmentedControl: true,
                defaultValue: "docked",
                description: "Docked: the frame waits on the button. Hidden: it only appears near the pointer. Touch devices always dock.",
            },
            idleOpacity: {
                type: ControlType.Number,
                title: "Rest Opacity",
                defaultValue: DEF.idleOpacity,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (f: FrameProps) => (f.idle ?? "docked") === "hidden",
            },
            range: { type: ControlType.Number, title: "Range", defaultValue: DEF.range, min: 0, max: 600, step: 5, unit: "px", description: "How far around the button the frame follows the pointer." },
            size: { type: ControlType.Number, title: "Free Size", defaultValue: DEF.size, min: 16, max: 200, step: 1, unit: "px", description: "The frame around the pointer." },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: DEF.gap, min: 0, max: 60, step: 1, unit: "px", description: "Space between the locked frame and the button." },
            corner: { type: ControlType.Number, title: "Corner Length", defaultValue: DEF.corner, min: 4, max: 60, step: 1, unit: "px" },
            stroke: { type: ControlType.Number, title: "Stroke", defaultValue: DEF.stroke, min: 0.5, max: 8, step: 0.5, unit: "px" },
            cornerRadius: { type: ControlType.Number, title: "Corner Radius", defaultValue: DEF.cornerRadius, min: 0, max: 60, step: 1, unit: "px" },
            ticks: { type: ControlType.Boolean, title: "Side Marks", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide", description: "Small marks on each side of the locked frame." },
            reticle: { type: ControlType.Boolean, title: "Crosshair", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide", description: "A small cross in the frame while it follows the pointer." },
            glow: { type: ControlType.Number, title: "Glow", defaultValue: DEF.glow, min: 0, max: 100, step: 1, unit: "%", description: "Glow of the locked frame in its color." },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            magnet: { type: ControlType.Number, title: "Magnet", defaultValue: DEF.magnet, min: 0, max: 100, step: 1, unit: "%", description: "How strongly the button pulls the frame in before it locks." },
            stiffness: { type: ControlType.Number, title: "Stiffness", defaultValue: DEF.stiffness, min: 40, max: 800, step: 10 },
            damping: { type: ControlType.Number, title: "Damping", defaultValue: DEF.damping, min: 4, max: 80, step: 1, description: "Lower values bounce more." },
            tilt: { type: ControlType.Number, title: "Tilt", defaultValue: DEF.tilt, min: 0, max: 16, step: 0.5, unit: "°", description: "The button leans toward the pointer. 0 = off." },
            textPull: { type: ControlType.Number, title: "Text Pull", defaultValue: DEF.textPull, min: 0, max: 12, step: 0.5, unit: "px", description: "The label drifts toward the pointer." },
            squeeze: { type: ControlType.Number, title: "Click Squeeze", defaultValue: DEF.squeeze, min: 0, max: 30, step: 1, unit: "px", description: "The frame closes in by this much on press." },
            flash: { type: ControlType.Number, title: "Click Sweep", defaultValue: DEF.flash, min: 0, max: 100, step: 1, unit: "%", description: "The flash and the light that sweeps across the button on click. 0 = off." },
            shock: { type: ControlType.Number, title: "Click Ring", defaultValue: DEF.shock, min: 0, max: 100, step: 1, unit: "%", description: "A ring bursts out of the frame on click. 0 = off." },
            linkDelay: {
                type: ControlType.Number,
                title: "Link Delay",
                defaultValue: DEF.linkDelay,
                min: 0,
                max: 1.5,
                step: 0.05,
                unit: "s",
                description: "Same-tab links wait this long so the click effect can play. New-tab links open at once.",
            },
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
            textCase: {
                type: ControlType.Enum,
                title: "Case",
                options: ["none", "upper"],
                optionTitles: ["As Typed", "Uppercase"],
                displaySegmentedControl: true,
                defaultValue: "none",
            },
        },
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            width: { type: ControlType.Number, title: "Width", defaultValue: 1, min: 0, max: 8, step: 0.5, unit: "px" },
            colorAuto: { type: ControlType.Boolean, title: "Color", defaultValue: true, enabledTitle: "Auto", disabledTitle: "Custom", hidden: (b: BorderProps) => b.width === 0, description: "Auto: a faint light line on dark fills, a faint dark one on light fills." },
            color: { type: ControlType.Color, title: " ", defaultValue: "rgba(255, 255, 255, 0.1)", hidden: (b: BorderProps) => b.width === 0 || b.colorAuto !== false },
        },
    },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: DEF.padding },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: DEF.radius },
    shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEF.shadow },
    hover: {
        type: ControlType.Object,
        title: "Hover & Press",
        controls: {
            spot: { type: ControlType.Number, title: "Pointer Light", defaultValue: DEF.spot, min: 0, max: 100, step: 1, unit: "%", description: "A soft light on the button under the pointer." },
            press: { type: ControlType.Number, title: "Press Scale", defaultValue: DEF.press, min: 85, max: 100, step: 1, unit: "%" },
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
