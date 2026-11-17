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

import type { ControlDescription } from "framer"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion"
import type { MotionValue } from "framer-motion"

// ---------- Types & defaults ----------

type Milestone = {
    date: string
    tag: string
    title: string
    description: string
    value: number
    prefix: string
    suffix: string
    decimals: number
    valueLabel: string
    linkText: string
    link: string
    newTab: boolean
}

type Colors = { background: string; accent: string; text: string; muted: string; rail: string; chip: string; dialFill: string }
type Grid = { show: boolean; side: "right" | "left" | "edges" | "full"; spread: number; cellSize: number; gap: number; radius: number; density: number; intensity: number; twinkle: number; rise: boolean; cursorGlow: boolean; color: string }
type Dial = { icon: "chevrons" | "arrow" | "dot" | "number"; size: number; ringWidth: number; glow: number }
type Layout = { railSide: "left" | "right"; railWidth: number; itemGap: number; maxWidth: number; padding: number; contentWidth: number }
type Motion = { mode: "scroll" | "autoplay"; stepHeight: number; interval: number; pauseOnHover: boolean; loop: boolean; counterDuration: number; minHeight: number; previewStep: number }
type Counter = { show: boolean; gradient: boolean; grouping: boolean; locale: string }
type Cta = { show: boolean; label: string; link: string; newTab: boolean; style: "solid" | "outline" | "ghost" }
type Badge = { show: boolean; label: string; link: string; newTab: boolean; position: "top-right" | "top-left" | "bottom-right" | "bottom-left" }

type Props = {
    milestones: Milestone[]
    colors: Partial<Colors>
    grid: Partial<Grid>
    dial: Partial<Dial>
    layout: Partial<Layout>
    motion: Partial<Motion>
    counter: Partial<Counter>
    cta: Partial<Cta>
    badge: Partial<Badge>
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    counterFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    ariaLabel: string
    onStepChange?: () => void
    style?: React.CSSProperties
}

const m = (date: string, tag: string, title: string, description: string, value: number, valueLabel: string, decimals = 0, prefix = "", suffix = ""): Milestone => ({
    date, tag, title, description, value, prefix, suffix, decimals, valueLabel, linkText: "", link: "", newTab: true,
})

const DEFAULT_MILESTONES: Milestone[] = [
    m("Jan 2025", "Q1 · 2025", "First commit", "A weekend prototype becomes a real product with a handful of early testers.", 12, "Early testers"),
    m("Feb 2025", "Q1 · 2025", "Private beta", "The waitlist opens and the team ships something new every single day.", 480, "Beta users"),
    m("Mar 2025", "Q1 · 2025", "Launch day", "A public launch lands at the top of the charts and the inbox lights up.", 6800, "Sign-ups in a week"),
    m("Apr 2025", "Q2 · 2025", "Teams pull in teams", "Every new workspace brings two more, and growth starts compounding.", 24900, "Active users"),
    m("May 2025", "Q2 · 2025", "Revenue unlocks", "Paid plans go live and the first customers upgrade within hours.", 61300, "Active users"),
    m("Jun 2025", "Q2 · 2025", "Going global", "Localised in nine languages and used in more than forty countries.", 142000, "Active users"),
    m("Jul 2025", "Q3 · 2025", "The next summit", "A new funding round closes and the roadmap climbs higher than ever.", 1.2, "Users and counting", 1, "", "M"),
]

const DEFAULT_COLORS: Colors = { background: "#050605", accent: "#A3FF47", text: "#F4F6F1", muted: "rgba(244, 246, 241, 0.5)", rail: "rgba(244, 246, 241, 0.12)", chip: "rgba(163, 255, 71, 0.1)", dialFill: "#0B0D0A" }
const DEFAULT_GRID: Grid = { show: true, side: "right", spread: 0.62, cellSize: 9, gap: 5, radius: 1.5, density: 0.42, intensity: 0.75, twinkle: 1, rise: true, cursorGlow: true, color: "" }
const DEFAULT_DIAL: Dial = { icon: "chevrons", size: 64, ringWidth: 2, glow: 0.55 }
const DEFAULT_LAYOUT: Layout = { railSide: "left", railWidth: 320, itemGap: 76, maxWidth: 1200, padding: 40, contentWidth: 460 }
const DEFAULT_MOTION: Motion = { mode: "scroll", stepHeight: 70, interval: 3.5, pauseOnHover: true, loop: true, counterDuration: 1.4, minHeight: 760, previewStep: 4 }
const DEFAULT_COUNTER: Counter = { show: true, gradient: true, grouping: true, locale: "" }
const DEFAULT_CTA: Cta = { show: false, label: "Start your climb", link: "", newTab: true, style: "solid" }
const DEFAULT_BADGE: Badge = { show: false, label: "Made in Framer", link: "", newTab: true, position: "bottom-right" }

const FONT_STACK = '"Inter", "Geist", system-ui, -apple-system, sans-serif'
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

// ---------- Helpers ----------

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, x: number) => {
    const t = clamp((x - a) / (b - a || 1e-6), 0, 1)
    return t * t * (3 - 2 * t)
}
const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return s - Math.floor(s)
}
const sizeOf = (font: React.CSSProperties | undefined, fallback: number) => {
    const raw = font?.fontSize
    const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""))
    return isFinite(n) && n > 0 ? n : fallback
}
const scaled = (font: React.CSSProperties | undefined, fallback: number, scale: number): React.CSSProperties => ({ ...font, fontSize: Math.round(sizeOf(font, fallback) * scale * 10) / 10 })

type RoundRectPath = Path2D & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void }

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number, dpr: number, g: Grid, color: string, level: number, t: number, pointer: { x: number; y: number; on: number }) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!g.show || W < 2 || H < 2) return
    const cell = Math.max(2, g.cellSize)
    const step = cell + Math.max(0, g.gap)
    const cols = Math.ceil(W / step)
    const rows = Math.ceil(H / step)
    const LEVELS = 20
    const paths: RoundRectPath[] = []
    for (let i = 0; i < LEVELS; i++) paths.push(new Path2D() as RoundRectPath)
    const fill = 0.28 + 0.72 * clamp(level, 0, 1)
    const spread = clamp(g.spread, 0.05, 1)
    const glowR = Math.max(W, H) * 0.12
    const round = g.radius > 0
    for (let y = 0; y < rows; y++) {
        const py = y * step
        const ny = (py + cell / 2) / H
        const vm = g.rise ? 0.12 + 0.88 * smooth(1 - fill - 0.24, 1 - fill + 0.24, ny) : 1
        for (let x = 0; x < cols; x++) {
            const px = x * step
            const nx = (px + cell / 2) / W
            const right = smooth(1 - spread, 1, nx)
            const left = smooth(1 - spread, 1, 1 - nx)
            const hm = g.side === "right" ? right : g.side === "left" ? left : g.side === "edges" ? Math.max(left, right) : 1
            const h = hash(x, y)
            const h2 = hash(x + 71.3, y + 13.7)
            let a: number
            if (h > g.density) a = 0.055 * hm
            else {
                const tw = g.twinkle > 0 ? 0.55 + 0.45 * Math.sin(t * g.twinkle * (0.6 + h2 * 1.8) + h2 * 40) : 0.8
                a = hm * vm * tw * g.intensity * (0.35 + 0.65 * h2)
            }
            if (pointer.on > 0.01) {
                const dx = px + cell / 2 - pointer.x
                const dy = py + cell / 2 - pointer.y
                const d2 = (dx * dx + dy * dy) / (glowR * glowR)
                if (d2 < 4) a += Math.exp(-d2) * pointer.on * 0.7 * g.intensity * (h < g.density * 1.7 ? 1 : 0.25)
            }
            const li = Math.min(LEVELS - 1, Math.floor(clamp(a, 0, 1) * LEVELS))
            if (li < 1) continue
            const p = paths[li]
            if (round && p.roundRect) p.roundRect(px, py, cell, cell, g.radius)
            else p.rect(px, py, cell, cell)
        }
    }
    ctx.fillStyle = color
    for (let i = 1; i < LEVELS; i++) {
        ctx.globalAlpha = (i + 0.5) / LEVELS
        ctx.fill(paths[i])
    }
    ctx.globalAlpha = 1
}

function DialIcon({ icon, color, size, index }: { icon: Dial["icon"]; color: string; size: number; index: number }) {
    const s = Math.round(size * 0.34)
    if (icon === "number") return <span style={{ fontFamily: FONT_STACK, fontSize: Math.round(size * 0.26), fontWeight: 600, color, letterSpacing: "-0.02em" }}>{String(index + 1).padStart(2, "0")}</span>
    if (icon === "dot") return <span style={{ width: Math.round(size * 0.16), height: Math.round(size * 0.16), borderRadius: 999, background: color, display: "block" }} />
    const path = icon === "arrow" ? "M12 19V5M5 12l7-7 7 7" : "M7 11l5-5 5 5M7 18l5-5 5 5"
    return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={path} />
        </svg>
    )
}

function CounterText({ value, decimals, prefix, suffix, format, duration, instant, style }: { value: number; decimals: number; prefix: string; suffix: string; format: (v: number, d: number) => string; duration: number; instant: boolean; style: React.CSSProperties }) {
    const ref = React.useRef<HTMLSpanElement>(null)
    const shown = React.useRef(instant ? value : 0)
    const write = React.useCallback((v: number) => {
        shown.current = v
        if (ref.current) ref.current.textContent = prefix + format(v, decimals) + suffix
    }, [prefix, suffix, decimals, format])
    React.useEffect(() => {
        if (instant) {
            write(value)
            return
        }
        const controls = animate(shown.current, value, { duration, ease: EASE, onUpdate: write })
        return () => controls.stop()
    }, [value, instant, duration, write])
    return (
        <span ref={ref} style={style}>
            {prefix + format(shown.current, decimals) + suffix}
        </span>
    )
}

function Ring({ progress, size, width, color, track }: { progress: MotionValue<number>; size: number; width: number; color: string; track: string }) {
    const r = size / 2 - width / 2 - 1
    return (
        <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden="true">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={width} />
            <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" style={{ pathLength: progress }} />
        </svg>
    )
}

/**
 * Ascent Timeline
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function AscentTimeline(props: Props) {
    const items = props.milestones && props.milestones.length ? props.milestones : DEFAULT_MILESTONES
    const n = items.length
    const colors: Colors = { ...DEFAULT_COLORS, ...props.colors }
    const grid: Grid = { ...DEFAULT_GRID, ...props.grid }
    const dial: Dial = { ...DEFAULT_DIAL, ...props.dial }
    const layout: Layout = { ...DEFAULT_LAYOUT, ...props.layout }
    const mo: Motion = { ...DEFAULT_MOTION, ...props.motion }
    const counter: Counter = { ...DEFAULT_COUNTER, ...props.counter }
    const cta: Cta = { ...DEFAULT_CTA, ...props.cta }
    const badge: Badge = { ...DEFAULT_BADGE, ...props.badge }
    const gridColor = grid.color || colors.accent

    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion() ?? false
    const live = !isStatic
    const scrollMode = mo.mode === "scroll" && live

    const rootRef = React.useRef<HTMLDivElement>(null)
    const stageRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const startIndex = clamp(Math.round(mo.previewStep) - 1, 0, n - 1)
    const [index, setIndex] = React.useState(isStatic ? startIndex : 0)
    const [dir, setDir] = React.useState(1)
    const [width, setWidth] = React.useState(1200)
    const [inView, setInView] = React.useState(isStatic)
    const [hovered, setHovered] = React.useState(false)
    const [focusRing, setFocusRing] = React.useState(false)
    const ring = useMotionValue(isStatic ? 0.35 : 0)
    const levelRef = React.useRef(isStatic ? startIndex / Math.max(1, n - 1) : 0)
    const indexRef = React.useRef(index)
    const pointer = React.useRef({ x: 0, y: 0, on: 0, target: 0 })
    const onStepChange = props.onStepChange

    const go = React.useCallback((next: number) => {
        const i = clamp(next, 0, n - 1)
        if (i === indexRef.current) return
        setDir(i > indexRef.current ? 1 : -1)
        indexRef.current = i
        setIndex(i)
        if (onStepChange) onStepChange()
    }, [n, onStepChange])

    // Keep the index valid when milestones change
    React.useEffect(() => {
        if (indexRef.current > n - 1) {
            indexRef.current = n - 1
            setIndex(n - 1)
        }
    }, [n])

    // Canvas preview: follow the Preview Step control
    React.useEffect(() => {
        if (!isStatic) return
        indexRef.current = startIndex
        setIndex(startIndex)
        levelRef.current = startIndex / Math.max(1, n - 1)
    }, [isStatic, startIndex, n])

    // Width for responsive scaling
    React.useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width
            if (w) setWidth(w)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Visibility
    React.useEffect(() => {
        if (!live) return
        const el = stageRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver((entries) => setInView(entries[0]?.isIntersecting ?? true), { threshold: 0.05 })
        io.observe(el)
        return () => io.disconnect()
    }, [live])

    // Scroll mode: progress comes from the section's position in the viewport
    React.useEffect(() => {
        if (!scrollMode) return
        let raf = 0
        const update = () => {
            raf = 0
            const el = rootRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const total = Math.max(1, rect.height - window.innerHeight)
            const p = clamp(-rect.top / total, 0, 1)
            const pos = Math.min(n - 1e-4, p * n)
            const i = Math.floor(pos)
            ring.set(clamp(pos - i, 0, 1))
            levelRef.current = clamp(pos / n, 0, 1)
            go(i)
        }
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update)
        }
        update()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            if (raf) cancelAnimationFrame(raf)
        }
    }, [scrollMode, n, go, ring])

    // Autoplay mode: a timer fills the ring, then steps up
    const paused = !inView || (mo.pauseOnHover && hovered)
    React.useEffect(() => {
        if (!live || mo.mode !== "autoplay") return
        levelRef.current = indexRef.current / Math.max(1, n - 1)
        if (paused || n < 2) return
        const ms = Math.max(0.8, mo.interval) * 1000
        let start = performance.now() - ring.get() * ms
        let raf = 0
        const tick = (now: number) => {
            const f = (now - start) / ms
            if (f >= 1) {
                const atEnd = indexRef.current >= n - 1
                if (atEnd && !mo.loop) {
                    ring.set(1)
                    return
                }
                go(atEnd ? 0 : indexRef.current + 1)
                levelRef.current = indexRef.current / Math.max(1, n - 1)
                start = now
                ring.set(0)
            } else ring.set(f)
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [live, mo.mode, mo.interval, mo.loop, paused, n, go, ring])

    // Pixel grid: a 30fps loop while visible, or a single redraw per step when motion is off
    const gridAnimated = live && !reduced && inView
    const redrawKey = gridAnimated ? -1 : index
    React.useEffect(() => {
        const canvas = canvasRef.current
        const stage = stageRef.current
        if (!canvas || !stage) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        let W = 0
        let H = 0
        const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
        const resize = () => {
            const r = stage.getBoundingClientRect()
            W = Math.max(1, Math.round(r.width))
            H = Math.max(1, Math.round(r.height))
            canvas.width = Math.round(W * dpr)
            canvas.height = Math.round(H * dpr)
        }
        resize()
        let shownLevel = levelRef.current
        if (!gridAnimated) {
            drawGrid(ctx, W, H, dpr, grid, gridColor, levelRef.current, 0, { x: 0, y: 0, on: 0 })
            const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
                resize()
                drawGrid(ctx, W, H, dpr, grid, gridColor, levelRef.current, 0, { x: 0, y: 0, on: 0 })
            }) : null
            ro?.observe(stage)
            return () => ro?.disconnect()
        }
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
        ro?.observe(stage)
        let raf = 0
        let last = 0
        const t0 = performance.now()
        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)
            if (now - last < 33) return
            last = now
            shownLevel += (levelRef.current - shownLevel) * 0.08
            const pt = pointer.current
            pt.on += (pt.target - pt.on) * 0.12
            drawGrid(ctx, W, H, dpr, grid, gridColor, shownLevel, (now - t0) / 1000, pt)
        }
        raf = requestAnimationFrame(frame)
        return () => {
            cancelAnimationFrame(raf)
            ro?.disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridAnimated, redrawKey, gridColor, grid.show, grid.side, grid.spread, grid.cellSize, grid.gap, grid.radius, grid.density, grid.intensity, grid.twinkle, grid.rise])

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!grid.cursorGlow || !stageRef.current) return
        const r = stageRef.current.getBoundingClientRect()
        pointer.current.x = e.clientX - r.left
        pointer.current.y = e.clientY - r.top
        pointer.current.target = 1
    }
    const onPointerLeave = () => {
        pointer.current.target = 0
        setHovered(false)
    }

    const jump = (i: number) => {
        if (scrollMode && rootRef.current) {
            const rect = rootRef.current.getBoundingClientRect()
            const total = Math.max(1, rect.height - window.innerHeight)
            const top = window.scrollY + rect.top + ((i + 0.5) / n) * total
            window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
        } else {
            ring.set(0)
            go(i)
            levelRef.current = i / Math.max(1, n - 1)
        }
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault()
            jump(Math.min(n - 1, indexRef.current + 1))
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault()
            jump(Math.max(0, indexRef.current - 1))
        }
    }

    // Responsive scale
    const compact = width < 760
    const scale = clamp(width / 1200, compact ? 0.5 : 0.72, 1)
    const railW = compact ? Math.max(96, Math.round(layout.railWidth * 0.36)) : Math.round(layout.railWidth * clamp(width / 1200, 0.75, 1))
    const dialSize = Math.round(dial.size * (compact ? 0.72 : 1))
    const gap = Math.round(layout.itemGap * (compact ? 0.78 : 1))
    const pad = Math.round(layout.padding * (compact ? 0.5 : 1))

    const fmt = React.useMemo(() => {
        const cache = new Map<number, Intl.NumberFormat>()
        return (v: number, d: number) => {
            const dd = clamp(Math.round(d), 0, 4)
            let f = cache.get(dd)
            if (!f) {
                try {
                    f = new Intl.NumberFormat(counter.locale || undefined, { minimumFractionDigits: dd, maximumFractionDigits: dd, useGrouping: counter.grouping })
                } catch {
                    f = new Intl.NumberFormat(undefined, { minimumFractionDigits: dd, maximumFractionDigits: dd, useGrouping: counter.grouping })
                }
                cache.set(dd, f)
            }
            return f.format(v)
        }
    }, [counter.locale, counter.grouping])

    const item = items[clamp(index, 0, n - 1)]
    const instant = isStatic || reduced
    const t: (d: number) => { duration: number; ease: [number, number, number, number] } = (d) => ({ duration: instant ? 0 : d, ease: EASE })

    const titleStyle: React.CSSProperties = { fontFamily: FONT_STACK, fontWeight: 700, ...scaled(props.titleFont, 44, scale), color: colors.text, margin: 0 }
    const bodyStyle: React.CSSProperties = { fontFamily: FONT_STACK, ...scaled(props.bodyFont, 16, Math.max(0.86, scale)), color: colors.muted, margin: 0, maxWidth: layout.contentWidth }
    const labelFont: React.CSSProperties = { fontFamily: FONT_STACK, fontWeight: 500, ...scaled(props.labelFont, 13, compact ? 0.88 : 1) }
    const counterBase: React.CSSProperties = { fontFamily: FONT_STACK, fontWeight: 700, ...scaled(props.counterFont, 96, scale), display: "inline-block", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }
    const counterStyle: React.CSSProperties = counter.gradient
        ? { ...counterBase, backgroundImage: "linear-gradient(180deg, " + colors.text + " 30%, " + colors.muted + " 115%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }
        : { ...counterBase, color: colors.text }

    const railOnLeft = layout.railSide === "left"
    const stageHeight = scrollMode ? "100vh" : "100%"
    const outerHeight = scrollMode ? "calc(100vh + " + n * Math.max(20, mo.stepHeight) + "vh)" : "100%"

    const ctaStyle: React.CSSProperties = {
        display: "inline-flex", alignItems: "center", gap: 10, height: 46, padding: "0 20px", borderRadius: 999, textDecoration: "none", cursor: "pointer",
        fontFamily: FONT_STACK, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", boxSizing: "border-box", transition: "transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease",
        ...(cta.style === "solid"
            ? { background: colors.accent, color: colors.background, boxShadow: "0 0 32px " + colors.chip }
            : cta.style === "outline"
              ? { background: "transparent", color: colors.text, border: "1px solid " + colors.rail }
              : { background: "transparent", color: colors.accent, padding: 0, height: "auto" }),
    }
    const badgePos: React.CSSProperties = {
        position: "absolute", zIndex: 3,
        ...(badge.position.indexOf("top") === 0 ? { top: pad * 0.6 + 8 } : { bottom: pad * 0.6 + 8 }),
        ...(badge.position.indexOf("right") > 0 ? { right: pad * 0.6 + 8 } : { left: pad * 0.6 + 8 }),
    }

    const rail = (
        <div style={{ position: "relative", width: railW, flexShrink: 0 }}>
            {/* vertical line, faded at both ends */}
            <div style={{ position: "absolute", top: 0, bottom: 0, [railOnLeft ? "right" : "left"]: dialSize / 2 - 0.5, width: 1, background: "linear-gradient(180deg, transparent, " + colors.rail + " 18%, " + colors.rail + " 82%, transparent)" }} />
            <motion.div
                style={{ position: "absolute", left: 0, right: 0, top: "50%" }}
                initial={false}
                animate={{ y: -index * gap }}
                transition={instant ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 24, mass: 0.9 }}
            >
                {items.map((it, i) => {
                    const d = Math.abs(i - index)
                    const active = d === 0
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => jump(i)}
                            aria-label={"Go to " + (it.date || "step " + (i + 1)) + (it.title ? ": " + it.title : "")}
                            aria-current={active ? "step" : undefined}
                            style={{
                                position: "absolute", top: i * gap, transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 14,
                                [railOnLeft ? "right" : "left"]: 0, flexDirection: railOnLeft ? "row" : "row-reverse",
                                appearance: "none", background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", color: colors.text,
                            }}
                        >
                            <motion.span
                                initial={false}
                                animate={{ opacity: active ? 1 : Math.max(0.08, 0.62 - (d - 1) * 0.2) }}
                                transition={t(0.5)}
                                style={{ ...labelFont, whiteSpace: "nowrap", fontWeight: active ? 600 : labelFont.fontWeight }}
                            >
                                {it.date}
                            </motion.span>
                            <span style={{ width: dialSize, display: "flex", justifyContent: "center" }}>
                                <span style={{ width: 9, height: 1, background: colors.rail, opacity: active ? 0 : 1 }} />
                            </span>
                        </button>
                    )
                })}
            </motion.div>
            {/* dial */}
            <div style={{ position: "absolute", top: "50%", [railOnLeft ? "right" : "left"]: 0, width: dialSize, height: dialSize, transform: "translateY(-50%)", pointerEvents: "none" }}>
                <div style={{ position: "absolute", left: "50%", top: "50%", width: dialSize * 5, height: dialSize * 5, transform: "translate(-50%, -50%)", borderRadius: "50%", background: "radial-gradient(circle, " + colors.accent + " 0%, transparent 62%)", opacity: dial.glow * 0.28, filter: "blur(6px)" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: colors.dialFill, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), 0 10px 40px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DialIcon icon={dial.icon} color={colors.text} size={dialSize} index={index} />
                </div>
                <Ring progress={ring} size={dialSize} width={dial.ringWidth} color={colors.accent} track="rgba(255,255,255,0.06)" />
            </div>
        </div>
    )

    const content = (
        <div aria-live="polite" style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: Math.round(18 * Math.max(0.8, scale)) }}>
            {/* soft shade so text stays readable over the pixel grid */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-12%", right: "-12%", top: "50%", height: "70%", transform: "translateY(-50%)", background: "radial-gradient(closest-side, " + colors.background + " 35%, transparent)", opacity: 0.85, pointerEvents: "none", zIndex: -1 }} />
            <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div
                    key={index}
                    custom={dir}
                    initial={{ opacity: 0, y: 34 * dir, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -26 * dir, filter: "blur(6px)" }}
                    transition={t(0.55)}
                    style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}
                >
                    {item.tag ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 11px", borderRadius: 999, background: colors.chip, border: "1px solid " + colors.chip, ...labelFont, fontSize: Math.max(10, sizeOf(labelFont, 13) - 1), color: colors.text }}>
                            <span style={{ width: 6, height: 6, borderRadius: 99, background: colors.accent, boxShadow: "0 0 10px " + colors.accent }} />
                            {item.tag}
                        </span>
                    ) : null}
                    {item.title ? <h3 style={titleStyle}>{item.title}</h3> : null}
                    {item.description ? <p style={bodyStyle}>{item.description}</p> : null}
                    {item.linkText && item.link ? (
                        <a href={item.link} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener" : undefined} style={{ ...labelFont, color: colors.accent, textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center" }}>
                            {item.linkText}
                            <span aria-hidden="true">→</span>
                        </a>
                    ) : null}
                </motion.div>
            </AnimatePresence>
            {counter.show ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: Math.round(10 * scale) }}>
                    <CounterText value={inView || isStatic ? item.value : 0} decimals={item.decimals} prefix={item.prefix} suffix={item.suffix} format={fmt} duration={mo.counterDuration} instant={instant} style={counterStyle} />
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={item.valueLabel + index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t(0.3)} style={{ ...labelFont, color: colors.muted }}>
                            {item.valueLabel}
                        </motion.span>
                    </AnimatePresence>
                </div>
            ) : null}
            {cta.show && cta.label ? (
                <div style={{ marginTop: Math.round(14 * scale) }}>
                    <a
                        href={cta.link || undefined}
                        target={cta.newTab ? "_blank" : undefined}
                        rel={cta.newTab ? "noopener" : undefined}
                        style={ctaStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                        {cta.label}
                        <span aria-hidden="true">↗</span>
                    </a>
                </div>
            ) : null}
        </div>
    )

    return (
        <div ref={rootRef} style={{ ...props.style, position: "relative", width: "100%", height: outerHeight, minHeight: scrollMode ? undefined : mo.minHeight, background: colors.background }}>
            <div
                ref={stageRef}
                role="region"
                aria-roledescription="timeline"
                aria-label={props.ariaLabel || "Timeline"}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onFocus={(e) => {
                    // Show the ring only for keyboard focus, like :focus-visible
                    if (e.target !== e.currentTarget) return
                    let visible = true
                    try {
                        visible = e.currentTarget.matches(":focus-visible")
                    } catch {
                        visible = true
                    }
                    setFocusRing(visible)
                }}
                onBlur={(e) => {
                    if (e.target === e.currentTarget) setFocusRing(false)
                }}
                onPointerMove={onPointerMove}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={onPointerLeave}
                style={{ position: scrollMode ? "sticky" : "relative", top: 0, width: "100%", height: stageHeight, minHeight: scrollMode ? undefined : mo.minHeight, overflow: "hidden", outline: focusRing ? "2px solid " + colors.accent : "none", outlineOffset: -4, background: colors.background, display: "flex", flexDirection: "column" }}
            >
                <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
                <div
                    style={{
                        position: "relative", zIndex: 1, flex: "1 1 auto", minHeight: 0, width: "100%", maxWidth: layout.maxWidth, margin: "0 auto", padding: "0 " + pad + "px", boxSizing: "border-box", isolation: "isolate",
                        display: "flex", flexDirection: railOnLeft ? "row" : "row-reverse", alignItems: "stretch", gap: compact ? 22 : Math.round(80 * scale),
                    }}
                >
                    {rail}
                    {content}
                </div>
                {badge.show && badge.label ? (
                    <a href={badge.link || undefined} target={badge.newTab ? "_blank" : undefined} rel={badge.newTab ? "noopener" : undefined} style={{ ...badgePos, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: colors.text, textDecoration: "none", fontFamily: FONT_STACK, fontSize: 12, fontWeight: 500 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: colors.accent }} />
                        {badge.label}
                    </a>
                ) : null}
            </div>
        </div>
    )
}

// ---------- Property controls ----------

const hiddenFor =
    <T,>(test: (values: Partial<T>) => boolean) =>
    (values: unknown): boolean =>
        test((values ?? {}) as Partial<T>)

const fontControl = (title: string, fontSize: number, variant: string, letterSpacing: string, lineHeight: string): ControlDescription<Partial<Props>> => ({
    type: ControlType.Font, title, controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize, variant, letterSpacing, lineHeight },
} as ControlDescription<Partial<Props>>)

addPropertyControls(AscentTimeline, {
    milestones: {
        type: ControlType.Array,
        title: "Milestones",
        maxCount: 24,
        defaultValue: DEFAULT_MILESTONES,
        control: {
            type: ControlType.Object,
            controls: {
                date: { type: ControlType.String, title: "Date", defaultValue: "Jan 2025" },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "Q1 · 2025" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Milestone" },
                description: { type: ControlType.String, title: "Text", defaultValue: "", displayTextArea: true },
                value: { type: ControlType.Number, title: "Value", defaultValue: 100, step: 0.1, displayStepper: false },
                decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 4, step: 1 },
                prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
                suffix: { type: ControlType.String, title: "Suffix", defaultValue: "" },
                valueLabel: { type: ControlType.String, title: "Value Label", defaultValue: "Active users" },
                linkText: { type: ControlType.String, title: "Link Text", defaultValue: "", placeholder: "Read more" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: true },
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            mode: { type: ControlType.Enum, title: "Mode", options: ["scroll", "autoplay"], optionTitles: ["Scroll", "Autoplay"], displaySegmentedControl: true, defaultValue: DEFAULT_MOTION.mode },
            stepHeight: { type: ControlType.Number, title: "Scroll / Step", defaultValue: DEFAULT_MOTION.stepHeight, min: 20, max: 200, step: 5, unit: "vh", hidden: hiddenFor<Motion>((p) => p.mode === "autoplay") },
            interval: { type: ControlType.Number, title: "Interval", defaultValue: DEFAULT_MOTION.interval, min: 1, max: 15, step: 0.5, unit: "s", hidden: hiddenFor<Motion>((p) => p.mode !== "autoplay") },
            pauseOnHover: { type: ControlType.Boolean, title: "Hover Pause", defaultValue: DEFAULT_MOTION.pauseOnHover, hidden: hiddenFor<Motion>((p) => p.mode !== "autoplay") },
            loop: { type: ControlType.Boolean, title: "Loop", defaultValue: DEFAULT_MOTION.loop, hidden: hiddenFor<Motion>((p) => p.mode !== "autoplay") },
            minHeight: { type: ControlType.Number, title: "Min Height", defaultValue: DEFAULT_MOTION.minHeight, min: 320, max: 1600, step: 10, unit: "px", hidden: hiddenFor<Motion>((p) => p.mode !== "autoplay") },
            counterDuration: { type: ControlType.Number, title: "Count Time", defaultValue: DEFAULT_MOTION.counterDuration, min: 0, max: 4, step: 0.1, unit: "s" },
            previewStep: { type: ControlType.Number, title: "Canvas Step", defaultValue: DEFAULT_MOTION.previewStep, min: 1, max: 24, step: 1, displayStepper: true },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: DEFAULT_COLORS.background },
            accent: { type: ControlType.Color, title: "Accent", defaultValue: DEFAULT_COLORS.accent },
            text: { type: ControlType.Color, title: "Text", defaultValue: DEFAULT_COLORS.text },
            muted: { type: ControlType.Color, title: "Muted", defaultValue: DEFAULT_COLORS.muted },
            rail: { type: ControlType.Color, title: "Rail", defaultValue: DEFAULT_COLORS.rail },
            chip: { type: ControlType.Color, title: "Tag Fill", defaultValue: DEFAULT_COLORS.chip },
            dialFill: { type: ControlType.Color, title: "Dial Fill", defaultValue: DEFAULT_COLORS.dialFill },
        },
    },
    grid: {
        type: ControlType.Object,
        title: "Pixel Grid",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_GRID.show },
            side: { type: ControlType.Enum, title: "Side", options: ["right", "left", "edges", "full"], optionTitles: ["Right", "Left", "Edges", "Full"], defaultValue: DEFAULT_GRID.side, hidden: hiddenFor<Grid>((p) => p.show === false) },
            spread: { type: ControlType.Number, title: "Spread", defaultValue: DEFAULT_GRID.spread, min: 0.1, max: 1, step: 0.01, hidden: hiddenFor<Grid>((p) => p.show === false || p.side === "full") },
            color: { type: ControlType.Color, title: "Color", optional: true, hidden: hiddenFor<Grid>((p) => p.show === false) },
            cellSize: { type: ControlType.Number, title: "Cell", defaultValue: DEFAULT_GRID.cellSize, min: 2, max: 40, step: 1, unit: "px", hidden: hiddenFor<Grid>((p) => p.show === false) },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: DEFAULT_GRID.gap, min: 0, max: 20, step: 1, unit: "px", hidden: hiddenFor<Grid>((p) => p.show === false) },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: DEFAULT_GRID.radius, min: 0, max: 20, step: 0.5, unit: "px", hidden: hiddenFor<Grid>((p) => p.show === false) },
            density: { type: ControlType.Number, title: "Density", defaultValue: DEFAULT_GRID.density, min: 0, max: 1, step: 0.01, hidden: hiddenFor<Grid>((p) => p.show === false) },
            intensity: { type: ControlType.Number, title: "Intensity", defaultValue: DEFAULT_GRID.intensity, min: 0, max: 1, step: 0.01, hidden: hiddenFor<Grid>((p) => p.show === false) },
            twinkle: { type: ControlType.Number, title: "Twinkle", defaultValue: DEFAULT_GRID.twinkle, min: 0, max: 4, step: 0.1, hidden: hiddenFor<Grid>((p) => p.show === false) },
            rise: { type: ControlType.Boolean, title: "Rise", defaultValue: DEFAULT_GRID.rise, enabledTitle: "With step", disabledTitle: "Static", hidden: hiddenFor<Grid>((p) => p.show === false) },
            cursorGlow: { type: ControlType.Boolean, title: "Cursor Glow", defaultValue: DEFAULT_GRID.cursorGlow, hidden: hiddenFor<Grid>((p) => p.show === false) },
        },
    },
    dial: {
        type: ControlType.Object,
        title: "Dial",
        controls: {
            icon: { type: ControlType.Enum, title: "Icon", options: ["chevrons", "arrow", "dot", "number"], optionTitles: ["Chevrons", "Arrow", "Dot", "Number"], defaultValue: DEFAULT_DIAL.icon },
            size: { type: ControlType.Number, title: "Size", defaultValue: DEFAULT_DIAL.size, min: 32, max: 140, step: 1, unit: "px" },
            ringWidth: { type: ControlType.Number, title: "Ring", defaultValue: DEFAULT_DIAL.ringWidth, min: 1, max: 8, step: 0.5, unit: "px" },
            glow: { type: ControlType.Number, title: "Glow", defaultValue: DEFAULT_DIAL.glow, min: 0, max: 1, step: 0.01 },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            railSide: { type: ControlType.Enum, title: "Rail", options: ["left", "right"], optionTitles: ["Left", "Right"], displaySegmentedControl: true, defaultValue: DEFAULT_LAYOUT.railSide },
            railWidth: { type: ControlType.Number, title: "Rail Width", defaultValue: DEFAULT_LAYOUT.railWidth, min: 120, max: 520, step: 4, unit: "px" },
            itemGap: { type: ControlType.Number, title: "Item Gap", defaultValue: DEFAULT_LAYOUT.itemGap, min: 32, max: 160, step: 2, unit: "px" },
            contentWidth: { type: ControlType.Number, title: "Text Width", defaultValue: DEFAULT_LAYOUT.contentWidth, min: 240, max: 800, step: 10, unit: "px" },
            maxWidth: { type: ControlType.Number, title: "Max Width", defaultValue: DEFAULT_LAYOUT.maxWidth, min: 600, max: 1800, step: 10, unit: "px" },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: DEFAULT_LAYOUT.padding, min: 0, max: 120, step: 2, unit: "px" },
        },
    },
    counter: {
        type: ControlType.Object,
        title: "Counter",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_COUNTER.show },
            gradient: { type: ControlType.Boolean, title: "Fade Fill", defaultValue: DEFAULT_COUNTER.gradient, hidden: hiddenFor<Counter>((p) => p.show === false) },
            grouping: { type: ControlType.Boolean, title: "Separators", defaultValue: DEFAULT_COUNTER.grouping, hidden: hiddenFor<Counter>((p) => p.show === false) },
            locale: { type: ControlType.String, title: "Locale", defaultValue: DEFAULT_COUNTER.locale, placeholder: "Auto (e.g. en-US)", hidden: hiddenFor<Counter>((p) => p.show === false) },
        },
    },
    cta: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_CTA.show },
            label: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_CTA.label, hidden: hiddenFor<Cta>((p) => !p.show) },
            link: { type: ControlType.Link, title: "Link", hidden: hiddenFor<Cta>((p) => !p.show) },
            newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: DEFAULT_CTA.newTab, hidden: hiddenFor<Cta>((p) => !p.show) },
            style: { type: ControlType.Enum, title: "Style", options: ["solid", "outline", "ghost"], optionTitles: ["Solid", "Outline", "Ghost"], defaultValue: DEFAULT_CTA.style, hidden: hiddenFor<Cta>((p) => !p.show) },
        },
    },
    badge: {
        type: ControlType.Object,
        title: "Badge",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_BADGE.show },
            label: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_BADGE.label, hidden: hiddenFor<Badge>((p) => !p.show) },
            link: { type: ControlType.Link, title: "Link", hidden: hiddenFor<Badge>((p) => !p.show) },
            newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: DEFAULT_BADGE.newTab, hidden: hiddenFor<Badge>((p) => !p.show) },
            position: { type: ControlType.Enum, title: "Position", options: ["top-left", "top-right", "bottom-left", "bottom-right"], optionTitles: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"], defaultValue: DEFAULT_BADGE.position, hidden: hiddenFor<Badge>((p) => !p.show) },
        },
    },
    titleFont: fontControl("Title Font", 44, "Bold", "-0.03em", "1.05em"),
    bodyFont: fontControl("Text Font", 16, "Regular", "-0.005em", "1.5em"),
    counterFont: fontControl("Counter Font", 96, "Bold", "-0.045em", "1em"),
    labelFont: fontControl("Label Font", 13, "Medium", "0em", "1.2em"),
    ariaLabel: { type: ControlType.String, title: "Aria Label", defaultValue: "Product roadmap" },
    onStepChange: { type: ControlType.EventHandler },
})
