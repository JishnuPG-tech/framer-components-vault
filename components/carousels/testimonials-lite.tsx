/**
 * TestimonialsLite — free Framer code component: Marquee Wall + editorial Quote.
 * All 8 layouts + CMS live in Testimonial Carousel.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 560
 */
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
    type PointerEvent as ReactPointerEvent,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useTransform, useReducedMotion as useFMReduced } from "framer-motion"

/* -------------------------------------------------------------------------- */
/* Inlined helpers (from shared.tsx) — self-contained for Framer paste          */
/* -------------------------------------------------------------------------- */

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        if (mq.addEventListener) mq.addEventListener("change", update)
        else mq.addListener(update)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", update)
            else mq.removeListener(update)
        }
    }, [])
    return reduced
}

/**
 * IntersectionObserver visibility for one element, keyed on stable primitives only.
 * The observer is created once per element (the element itself is the dependency, so a
 * remounted node is re-observed) and is rebuilt only if `threshold` / `rootMargin`
 * actually change — never because a caller re-rendered with a fresh options object.
 * Pass module-level constants (or other primitives) for `threshold` / `rootMargin`.
 */
function useElementInView(
    el: Element | null,
    threshold: number,
    rootMargin: string = "0px"
): boolean {
    const [inView, setInView] = useState(false)
    useEffect(() => {
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                setInView(!!entry?.isIntersecting)
            },
            { threshold, rootMargin }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [el, threshold, rootMargin])
    return inView
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n))
}

function wrapIndex(i: number, len: number): number {
    if (len <= 0) return 0
    return ((i % len) + len) % len
}

function fontToCss(font?: Record<string, unknown> | null): CSSProperties {
    if (!font) return {}
    const style: CSSProperties = {}
    if (typeof font.fontFamily === "string") style.fontFamily = font.fontFamily
    if (typeof font.fontSize === "number" || typeof font.fontSize === "string")
        style.fontSize = font.fontSize as CSSProperties["fontSize"]
    if (typeof font.fontWeight === "number" || typeof font.fontWeight === "string")
        style.fontWeight = font.fontWeight as CSSProperties["fontWeight"]
    if (typeof font.fontStyle === "string") style.fontStyle = font.fontStyle
    if (typeof font.letterSpacing === "string" || typeof font.letterSpacing === "number")
        style.letterSpacing = font.letterSpacing as CSSProperties["letterSpacing"]
    if (typeof font.lineHeight === "string" || typeof font.lineHeight === "number")
        style.lineHeight = font.lineHeight as CSSProperties["lineHeight"]
    if (typeof font.textAlign === "string")
        style.textAlign = font.textAlign as CSSProperties["textAlign"]
    if (typeof font.textTransform === "string")
        style.textTransform = font.textTransform as CSSProperties["textTransform"]
    return style
}

function contrastText(bg: string, light = "#ffffff", dark = "#111111"): string {
    const rgb = parseColor(bg)
    if (!rgb) return dark
    const [r, g, b] = rgb.map((c) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return L > 0.45 ? dark : light
}

function parseColor(input: string): [number, number, number] | null {
    if (!input) return null
    const hex = input.trim()
    if (hex.startsWith("#")) {
        const h = hex.slice(1)
        if (h.length === 3) {
            return [
                parseInt(h[0] + h[0], 16),
                parseInt(h[1] + h[1], 16),
                parseInt(h[2] + h[2], 16),
            ]
        }
        if (h.length >= 6) {
            return [
                parseInt(h.slice(0, 2), 16),
                parseInt(h.slice(2, 4), 16),
                parseInt(h.slice(4, 6), 16),
            ]
        }
    }
    const m = hex.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
    return null
}

function Stars({
    rating,
    size = 14,
    color = "#F5B301",
    emptyColor = "rgba(0,0,0,0.15)",
}: {
    rating: number
    size?: number
    color?: string
    emptyColor?: string
}): ReactNode {
    const value = clamp(rating, 0, 5)
    const full = Math.floor(value)
    const half = value - full >= 0.5
    const label = `${value.toFixed(1)} out of 5 stars`
    return (
        <span
            role="img"
            aria-label={label}
            style={{ display: "inline-flex", gap: 2, alignItems: "center", lineHeight: 1 }}
        >
            {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < full || (i === full && half)
                return (
                    <svg
                        key={i}
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        aria-hidden
                        style={{ display: "block" }}
                    >
                        <path
                            d="M12 2.5l2.9 6.1 6.7.9-4.9 4.7 1.2 6.6L12 17.8 6.1 20.8l1.2-6.6L2.4 9.5l6.7-.9L12 2.5z"
                            fill={filled ? color : emptyColor}
                        />
                    </svg>
                )
            })}
        </span>
    )
}

/**
 * Autoplay timer. Pass the current index as `resetKey`: ANY index change (arrow,
 * dot, keyboard, drag, or the tick itself) restarts the full interval, so an
 * automatic advance can never land right after a manual click.
 */
function useAutoplay(
    enabled: boolean,
    intervalMs: number,
    onTick: () => void,
    paused: boolean,
    resetKey?: unknown
): void {
    const cb = useRef(onTick)
    cb.current = onTick
    useEffect(() => {
        if (!enabled || paused || intervalMs <= 0) return
        const id = window.setTimeout(() => cb.current(), intervalMs)
        return () => window.clearTimeout(id)
    }, [enabled, intervalMs, paused, resetKey])
}

function highlightPhrase(text: string, phrase?: string, color = "#F5B301"): ReactNode {
    if (!phrase || !phrase.trim()) return text
    const idx = text.toLowerCase().indexOf(phrase.toLowerCase())
    if (idx < 0) return text
    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + phrase.length)
    const after = text.slice(idx + phrase.length)
    return (
        <>
            {before}
            <mark
                style={{
                    background: "transparent",
                    color,
                    fontWeight: 600,
                    padding: 0,
                }}
            >
                {match}
            </mark>
            {after}
        </>
    )
}

const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
}

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type TestimonialLayout = "marquee" | "single"

export interface TestimonialItem {
    id?: string
    name?: string
    role?: string
    company?: string
    avatar?: string
    quote?: string
    rating?: number
    highlight?: string
    metric?: string
    sourceLogo?: string
    cardColor?: string
    link?: string
}

const FOCUS_RING_CSS =
    "[data-tk-root]{outline:none}[data-tk-root]:focus-visible{outline:2px solid #3b82f6;outline-offset:-2px}" +
    // Small visual dots keep their look but get a 44×44 hit area (WCAG 2.5.5 / Apple HIG).
    "[data-tk-hit]{position:relative}[data-tk-hit]::before{content:'';position:absolute;left:50%;top:50%;width:44px;height:44px;transform:translate(-50%,-50%)}"


export interface TestimonialsLiteProps {
    layout?: TestimonialLayout
    items?: TestimonialItem[]
    /** Accessible name read by screen readers. */
    label?: string
    theme?: "light" | "dark" | "custom"
    background?: string
    cardBackground?: string
    textColor?: string
    mutedColor?: string
    accentColor?: string
    starColor?: string
    highlightColor?: string
    radius?: number
    gap?: number
    padding?: number
    shadow?: string
    quoteFont?: Record<string, unknown>
    nameFont?: Record<string, unknown>
    showRatings?: boolean
    showMetrics?: boolean
    showAvatars?: boolean
    showLogos?: boolean
    showHighlights?: boolean
    autoplay?: boolean
    autoplayInterval?: number
    pauseOnHover?: boolean
    loop?: boolean
    marqueeSpeed?: number
    marqueeRows?: number
    style?: CSSProperties
    /**
     * Code-only (no property control): controlled autoplay pause state. Wrappers that
     * re-mount the kit (e.g. a showcase switching layouts) pass this together with
     * `onAutoplayPausedChange` to keep the visitor's Pause/Play choice.
     */
    autoplayPaused?: boolean
    /** Code-only: called when the visitor presses the Pause/Play button. */
    onAutoplayPausedChange?: (paused: boolean) => void
}

/** Root in-view threshold that gates autoplay and the marquee (stable primitive). */
const ROOT_IN_VIEW_THRESHOLD = 0.2

/** Layouts with a single active index (arrows, autoplay, keyboard). */
const NAV_LAYOUTS: ReadonlySet<TestimonialLayout> = new Set<TestimonialLayout>(["single"])

/* -------------------------------------------------------------------------- */
/* Defaults                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Placeholder content shown until the buyer adds their own: neutral quotes from a
 * fictional studio's clients (nothing about this component), generic first names and
 * roles, no company names and no photos (initial avatars), so nothing reads as a real
 * customer endorsement or a review of the kit itself.
 */
const DEFAULT_ITEMS: TestimonialItem[] = [
    {
        id: "1",
        name: "Maya",
        role: "Owner, florist studio",
        quote: "They turned our messy brief into a site that finally feels like us. Booking a consult takes two clicks now.",
        rating: 5,
        highlight: "finally feels like us",
        metric: "Website redesign",
        cardColor: "#FFF7ED",
    },
    {
        id: "2",
        name: "Daniel",
        role: "Head chef",
        quote: "Our menu pages are quick on every phone, and updating the specials is something I can do myself.",
        rating: 5,
        highlight: "something I can do myself",
        metric: "Menu & ordering",
        cardColor: "#EEF2FF",
    },
    {
        id: "3",
        name: "Priya",
        role: "Founder, yoga studio",
        quote: "Class bookings moved from DMs to the website. Clear, calm, and exactly on brand.",
        rating: 5,
        highlight: "exactly on brand",
        metric: "Booking flow",
        cardColor: "#ECFDF5",
    },
    {
        id: "4",
        name: "Tom",
        role: "Director, architecture firm",
        quote: "The project pages give our photography room to breathe. Clients bring up the site in first meetings.",
        rating: 4.5,
        highlight: "room to breathe",
        metric: "Portfolio",
        cardColor: "#FDF2F8",
    },
    {
        id: "5",
        name: "Lucía",
        role: "Co-founder, ceramics shop",
        quote: "Launching the shop was painless. Product drops look as good as the pieces themselves.",
        rating: 5,
        highlight: "painless",
        metric: "Online store",
        cardColor: "#F0F9FF",
    },
    {
        id: "6",
        name: "Sam",
        role: "Marketing lead, bike shop",
        quote: "Fast, thoughtful, and easy to work with. The brand refresh landed better than we hoped.",
        rating: 5,
        highlight: "landed better than we hoped",
        metric: "Brand refresh",
        cardColor: "#FEF3C7",
    },
]

const DEFAULT_SHADOW = "0 12px 40px rgba(15,23,42,0.10)"

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
type SlotFill = "both" | "width"
/** Resolved item; slots mode carries the item's React element (`fromCollection`: CMS item). */
type TKItem = TestimonialItem & { node?: ReactNode; fromCollection?: boolean }
/** Layouts call this instead of TestimonialCard in slots mode. */
type RenderSlot = (item: TestimonialItem, opts: { fill: SlotFill; clone?: boolean }) => ReactElement


/** TestimonialCard (manual) or the slotted CMS card (slots mode). */
function cardOrSlot(
    item: TestimonialItem,
    cardProps: Omit<Parameters<typeof TestimonialCard>[0], "item">,
    renderSlot: RenderSlot | undefined,
    fill: SlotFill,
    extra?: { compact?: boolean; clone?: boolean; style?: CSSProperties; maxQuoteLines?: number }
): ReactElement {
    if (renderSlot) return renderSlot(item, { fill, clone: extra?.clone })
    return (
        <TestimonialCard
            item={item}
            {...cardProps}
            compact={extra?.compact}
            style={extra?.style}
            decorative={extra?.clone}
            maxQuoteLines={extra?.maxQuoteLines}
        />
    )
}

function Avatar({
    src,
    name,
    size = 44,
    eager = false,
}: {
    src?: string
    name?: string
    size?: number
    /** Static renderer (canvas / export / thumbnail): load now so stills are complete. */
    eager?: boolean
}) {
    const initials = (name || "")
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    if (src) {
        return (
            <img
                src={src}
                alt=""
                draggable={false}
                width={size}
                height={size}
                loading={eager ? "eager" : "lazy"}
                style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    objectFit: "cover",
                    display: "block",
                    background: "rgba(0,0,0,0.06)",
                }}
            />
        )
    }
    return (
        <div
            aria-hidden
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                // Mid-grey tint reads on light and dark cards alike (8% black vanished on Dark).
                background: "rgba(128,128,128,0.2)",
                fontSize: size * 0.32,
                fontWeight: 600,
            }}
        >
            {initials}
        </div>
    )
}

function TestimonialCard({
    item,
    theme,
    cardBackground,
    textColor,
    mutedColor,
    accentColor,
    starColor,
    highlightColor,
    radius,
    padding,
    shadow,
    quoteFont,
    nameFont,
    showRatings,
    showMetrics,
    showAvatars,
    showLogos,
    showHighlights,
    style,
    compact,
    border,
    starEmptyColor,
    eagerImages = false,
    decorative = false,
    maxQuoteLines,
}: {
    item: TestimonialItem
    theme: "light" | "dark" | "custom"
    cardBackground: string
    textColor: string
    mutedColor: string
    accentColor: string
    starColor: string
    highlightColor: string
    radius: number
    padding: number
    shadow: string
    quoteFont?: Record<string, unknown>
    nameFont?: Record<string, unknown>
    showRatings: boolean
    showMetrics: boolean
    showAvatars: boolean
    showLogos: boolean
    showHighlights: boolean
    style?: CSSProperties
    compact?: boolean
    border?: string
    starEmptyColor?: string
    /** Static renderer: images load eagerly. */
    eagerImages?: boolean
    /** Visual-only copy (marquee repeats): hidden from AT and out of the tab order. */
    decorative?: boolean
    /** Clamp the quote (fixed-size stages: Layered); full text stays in the DOM for AT. */
    maxQuoteLines?: number
}): ReactElement {
    // Dark theme: the theme's card colour wins over per-item pastel card colours,
    // otherwise Dark would still render light cards.
    const bg = (theme !== "dark" && item.cardColor) || cardBackground
    const fg = theme === "custom" ? textColor : contrastText(bg, "#f8fafc", "#0f172a")
    const muted = theme === "custom" ? mutedColor : contrastText(bg, "rgba(248,250,252,0.72)", "rgba(15,23,42,0.62)")
    const onDark = contrastText(bg) === "#ffffff"
    const chipColor = onDark ? mixColor(accentColor, "#ffffff", 0.45) : accentColor

    const quote = (item.quote || "").trim()
    const name = (item.name || "").trim()
    // Ids for the link's accessible name (Chrome doesn't compute a link name from
    // content nested in <article>/<blockquote>, so a linked card announced as "link").
    const uid = useId()
    const quoteId = `${uid}-q`
    const nameId = `${uid}-n`
    const body = (
        <article
            data-tk-card=""
            aria-hidden={decorative ? true : undefined}
            style={{
                background: bg,
                color: fg,
                borderRadius: radius,
                padding,
                boxShadow: shadow,
                border: border || "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: compact ? 10 : 14,
                height: "100%",
                boxSizing: "border-box",
                ...style,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                {showRatings && typeof item.rating === "number" && (
                    <Stars
                        rating={item.rating}
                        color={starColor}
                        size={compact ? 12 : 14}
                        emptyColor={starEmptyColor ?? (onDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)")}
                    />
                )}
                {showMetrics && item.metric && (
                    <span
                        style={{
                            fontSize: compact ? 11 : 12,
                            fontWeight: 600,
                            color: chipColor,
                            background: withAlpha(accentColor, onDark ? 0.22 : 0.09),
                            padding: "4px 8px",
                            borderRadius: 999,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {item.metric}
                    </span>
                )}
            </div>

            {quote && (
                <blockquote
                    id={quoteId}
                    style={{
                        margin: 0,
                        ...fontToCss(quoteFont),
                        fontSize: (quoteFont?.fontSize as number) || (compact ? 14 : 16),
                        lineHeight: 1.45,
                        letterSpacing: "-0.01em",
                        overflowWrap: "anywhere",
                        ...(maxQuoteLines
                            ? {
                                  display: "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: maxQuoteLines,
                                  overflow: "hidden",
                              }
                            : {}),
                    }}
                >
                    “
                    {showHighlights
                        ? highlightPhrase(item.quote || "", item.highlight, highlightColor)
                        : item.quote}
                    ”
                </blockquote>
            )}

            <footer style={{ display: "flex", alignItems: "center", gap: 12, marginTop: compact ? 2 : 4 }}>
                {/* No photo and no name: nothing to show (a "?" bubble looked broken). */}
                {showAvatars && (item.avatar || name) && (
                    <Avatar src={item.avatar} name={name} size={compact ? 36 : 44} eager={eagerImages} />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        id={nameId}
                        style={{
                            ...fontToCss(nameFont),
                            fontWeight: 600,
                            fontSize: (nameFont?.fontSize as number) || (compact ? 13 : 14),
                            lineHeight: 1.2,
                        }}
                    >
                        {item.name}
                    </div>
                    <div style={{ color: muted, fontSize: compact ? 11 : 12, marginTop: 2 }}>
                        {[item.role, item.company].filter(Boolean).join(" · ")}
                    </div>
                </div>
                {showLogos && item.sourceLogo && (
                    <img
                        src={item.sourceLogo}
                        alt=""
                        draggable={false}
                        height={18}
                        style={{ height: 18, width: "auto", opacity: 0.7, objectFit: "contain" }}
                    />
                )}
            </footer>
        </article>
    )

    if (item.link) {
        // Accessible name: the card's own visible text (quote, then name) via
        // aria-labelledby, so the label always matches what's on screen. A card with
        // neither gets a fallback label.
        // Decorative copies are aria-hidden and removed from the tab order.
        return (
            <a
                href={item.link}
                aria-labelledby={
                    decorative || !(quote || name)
                        ? undefined
                        : [quote ? quoteId : "", name ? nameId : ""].filter(Boolean).join(" ")
                }
                aria-label={decorative || quote || name ? undefined : "Open testimonial"}
                aria-hidden={decorative ? true : undefined}
                tabIndex={decorative ? -1 : undefined}
                style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
            >
                {body}
            </a>
        )
    }
    return body
}

/** Mix two colours (hex/rgb) — used to lift the accent for dark cards. */
function mixColor(a: string, b: string, t: number): string {
    const ca = parseColor(a)
    const cb = parseColor(b)
    if (!ca || !cb) return a
    const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
    return `rgb(${m[0]}, ${m[1]}, ${m[2]})`
}

function withAlpha(color: string, alpha: number): string {
    const c = parseColor(color)
    if (!c) return color
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Layouts                                                                     */
/* -------------------------------------------------------------------------- */



/** Hover ease time constants (seconds) for the per-row velocity: exponential approach to
 * the target speed — critically damped, so it never overshoots or runs backwards.
 * ~95% stopped after 3·τ (≈0.4 s), ~95% back to speed after ≈0.6 s. */
const MARQUEE_DECEL_TAU = 0.115
const MARQUEE_ACCEL_TAU = 0.2

/**
 * One marquee row. Its phase (0..1 of one loop = a third of the tripled track) lives in a
 * motion value, so the per-frame update never re-renders React. A rAF loop advances the
 * phase by the row's current velocity, which eases toward full speed or 0. The loop only
 * runs while the row is moving or easing and the page is visible.
 */
function MarqueeRow(props: {
    direction: 1 | -1
    /** Seconds per loop at full speed. */
    duration: number
    animated: boolean
    /** Target: moving (true) or stopped (false). */
    moving: boolean
    gap: number
    children: ReactNode
}): ReactElement {
    const { direction, duration, animated, moving, gap, children } = props
    const phase = useMotionValue(0)
    const x = useTransform(phase, (p) => `${(direction > 0 ? -p : p - 1) * 33.3333}%`)
    const vel = useRef(moving ? 1 : 0) // 0..1 of full speed
    const target = useRef(moving)
    target.current = moving
    // Starts the loop if it is idle; set by the effect below. Changing the target never
    // restarts a running loop (a restart would drop a frame's step and then double it).
    const wake = useRef<() => void>(() => {})
    useEffect(() => {
        if (!animated) return
        let id = 0
        let last: number | null = null
        const tick = (now: number) => {
            const dt = last === null ? 1 / 60 : Math.min(0.1, (now - last) / 1000)
            last = now
            const goal = target.current ? 1 : 0
            const tau = goal > vel.current ? MARQUEE_ACCEL_TAU : MARQUEE_DECEL_TAU
            let v = vel.current + (goal - vel.current) * (1 - Math.exp(-dt / tau))
            if (Math.abs(goal - v) < 0.002) v = goal
            vel.current = v
            if (v > 0) {
                const p = phase.get() + (v * dt) / duration
                phase.set(p - Math.floor(p))
            }
            if (v === 0 && goal === 0) { id = 0; return } // fully stopped: idle until woken
            id = requestAnimationFrame(tick)
        }
        const start = () => {
            if (id || document.hidden) return
            last = null
            id = requestAnimationFrame(tick)
        }
        const onVis = () => {
            if (!document.hidden) return start()
            cancelAnimationFrame(id)
            id = 0
        }
        wake.current = start
        start()
        document.addEventListener("visibilitychange", onVis)
        return () => {
            cancelAnimationFrame(id)
            wake.current = () => {}
            document.removeEventListener("visibilitychange", onVis)
        }
    }, [animated, duration, phase])
    useEffect(() => {
        if (moving) wake.current()
    }, [moving])
    return (
        <motion.div
            data-qa="marquee-track"
            style={{ display: "flex", gap, width: "max-content", x: animated ? x : 0, willChange: animated ? "transform" : undefined }}
        >
            {children}
        </motion.div>
    )
}

function MarqueeLayout(props: {
    items: TestimonialItem[]
    renderSlot?: RenderSlot
    cardProps: Omit<Parameters<typeof TestimonialCard>[0], "item">
    speed: number
    rows: number
    gap: number
    /** False for reduced motion and the static renderer (no animation at all). */
    animated: boolean
    /** False while paused (focus, off-screen): every row eases to a stop and keeps its place. */
    running: boolean
    /** Hovering a card (mouse only) eases just that card's row to a stop; other rows keep moving. */
    pauseOnHover: boolean
}): ReactElement {
    const { items, cardProps, speed, rows, gap, animated, running, pauseOnHover } = props
    const [hoveredRow, setHoveredRow] = useState<number | null>(null)
    const onRowPointer = (r: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== "mouse") return
        const onCard = e.target instanceof Element && e.target.closest("[data-tk-card]") !== null
        setHoveredRow((cur) => (onCard ? r : cur === r ? null : cur))
    }
    const onRowLeave = (r: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "mouse") setHoveredRow((cur) => (cur === r ? null : cur))
    }
    const rowItems = useMemo(() => {
        const chunks: TestimonialItem[][] = Array.from({ length: rows }, () => [])
        items.forEach((it, i) => chunks[i % rows].push(it))
        return chunks.map((c) => (c.length ? c : items))
    }, [items, rows])

    // First occurrence of an item is the accessible one; repeats (tripled rows, rows that
    // reuse items) render the same element again as aria-hidden visual copies.
    const primary = new Set<string>()
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: gap, width: "100%", height: "100%", justifyContent: "center", overflow: "hidden" }}>
            {rowItems.map((row, r) => {
                const direction = r % 2 === 0 ? 1 : -1
                const duration = Math.max(12, 60 / Math.max(0.25, speed)) * (1 + r * 0.08)
                const doubled = [...row, ...row, ...row]
                const hovered = pauseOnHover && hoveredRow === r
                return (
                    <div
                        key={r}
                        data-qa="marquee-row"
                        data-paused={running && hovered ? true : undefined}
                        onPointerOver={pauseOnHover ? onRowPointer(r) : undefined}
                        onPointerMove={pauseOnHover ? onRowPointer(r) : undefined}
                        onPointerLeave={pauseOnHover ? onRowLeave(r) : undefined}
                        style={{ overflow: "hidden", width: "100%" }}
                    >
                        <MarqueeRow direction={direction} duration={duration} animated={animated} moving={running && !hovered} gap={gap}>
                            {doubled.map((item, i) => {
                                const id = item.id || String(i)
                                const clone = primary.has(id)
                                primary.add(id)
                                return (
                                    <div
                                        key={`${item.id}-${i}`}
                                        aria-hidden={clone ? true : undefined}
                                        style={{ width: 320, flex: "0 0 auto" }}
                                    >
                                        {cardOrSlot(item, cardProps, props.renderSlot, "width", { compact: true, clone })}
                                    </div>
                                )
                            })}
                        </MarqueeRow>
                    </div>
                )
            })}
        </div>
    )
}


/** CSS for the editorial Quote: progress fill + reduced-motion opt-out. */
const PULL_QUOTE_CSS =
    "@keyframes tkPullFill{from{transform:scaleX(0)}to{transform:scaleX(1)}}" +
    "[data-tk-pull]{container-type:inline-size}"

/**
 * Editorial pull-quote (manual content). Content-sized: no fixed panel, so nothing but
 * the composition itself takes vertical space. Every quote sits in one grid cell
 * (inactive ones invisible), so the block keeps the tallest quote's height and the
 * crossfade never changes the layout height.
 */
function PullQuoteLayout(props: {
    items: TestimonialItem[]
    cardProps: Omit<Parameters<typeof TestimonialCard>[0], "item">
    index: number
    setIndex: (n: number) => void
    reduced: boolean
    isStatic: boolean
    /** Autoplay is advancing right now (drives the progress fill). */
    playing: boolean
    intervalMs: number
    nav: { prev: ReactNode; next: ReactNode; pause: ReactNode }
}): ReactElement {
    const { items, cardProps: cp, reduced, isStatic, playing, intervalMs } = props
    const active = wrapIndex(props.index, items.length)
    const fg = cp.textColor
    // Sits on the kit background (no card), so judge light/dark from the text colour.
    const onDark = contrastText(fg) !== "#ffffff"
    const chipColor = onDark ? mixColor(cp.accentColor, "#ffffff", 0.45) : cp.accentColor
    const fade = reduced || isStatic ? undefined : 450
    const layer = (on: boolean): CSSProperties => ({
        gridArea: "q",
        opacity: on ? 1 : 0,
        // Hidden layers keep their size (reserve height) but leave the a11y tree and tab order.
        visibility: on ? "visible" : "hidden",
        transition: fade
            ? `opacity ${fade}ms ease, visibility 0s linear ${on ? 0 : fade}ms`
            : undefined,
    })
    const multi = items.length > 1
    return (
        <div
            data-qa="quote-stage"
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(12px, 3vw, 28px) clamp(16px, 5vw, 48px)",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <style>{PULL_QUOTE_CSS}</style>
            <figure
                data-tk-pull=""
                data-tk-card=""
                data-qa="quote-composition"
                style={{ position: "relative", margin: 0, width: "min(880px, 100%)", color: fg }}
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 64 48"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "clamp(44px, 8cqi, 72px)",
                        height: "auto",
                        color: cp.accentColor,
                        opacity: 0.9,
                        pointerEvents: "none",
                    }}
                >
                    <path
                        fill="currentColor"
                        d="M0 48V30C0 13 9 3 25 0l3 6C19 9 14 15 14 24h12v24H0zm36 0V30C36 13 45 3 61 0l3 6c-9 3-14 9-14 18h12v24H36z"
                    />
                </svg>
                <div style={{ display: "grid", gridTemplateAreas: '"q"', paddingTop: "calc(clamp(44px, 8cqi, 72px) * 0.75 + 18px)" }}>
                    {items.map((it, j) => {
                        const on = j === active
                        const quote = (it.quote || "").trim()
                        const text = (
                            <blockquote
                                style={{
                                    margin: 0,
                                    ...fontToCss(cp.quoteFont),
                                    fontSize: "clamp(24px, 4.6cqi, 44px)",
                                    lineHeight: 1.18,
                                    fontWeight: (cp.quoteFont?.fontWeight as number) || 600,
                                    letterSpacing: "-0.025em",
                                    textWrap: "balance",
                                    overflowWrap: "anywhere",
                                } as CSSProperties}
                            >
                                {cp.showHighlights ? highlightPhrase(quote, it.highlight, cp.highlightColor) : quote}
                            </blockquote>
                        )
                        return (
                            <div
                                key={it.id || j}
                                aria-hidden={on ? undefined : true}
                                data-qa={on ? "quote-active" : "quote-layer"}
                                style={{ ...layer(on), display: "flex", flexDirection: "column", gap: "clamp(14px, 2.4cqi, 22px)" }}
                            >
                                {((cp.showRatings && typeof it.rating === "number") || (cp.showMetrics && it.metric)) && (
                                    <div data-qa="quote-meta" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                        {cp.showRatings && typeof it.rating === "number" && (
                                            <Stars
                                                rating={it.rating}
                                                color={cp.starColor}
                                                size={15}
                                                emptyColor={onDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
                                            />
                                        )}
                                        {cp.showMetrics && it.metric && (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: chipColor,
                                                    background: withAlpha(cp.accentColor, onDark ? 0.22 : 0.1),
                                                    padding: "4px 10px",
                                                    borderRadius: 999,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {it.metric}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {it.link ? (
                                    <a
                                        href={it.link}
                                        tabIndex={on ? undefined : -1}
                                        style={{ color: "inherit", textDecoration: "none" }}
                                    >
                                        {text}
                                    </a>
                                ) : (
                                    text
                                )}
                            </div>
                        )
                    })}
                </div>
                {/* Author row: author crossfades on the left; controls + pager stay docked on the right. */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "14px 20px",
                        marginTop: "clamp(20px, 3.4cqi, 32px)",
                        paddingTop: "clamp(16px, 2.4cqi, 22px)",
                        borderTop: `1px solid ${withAlpha(fg, 0.12)}`,
                    }}
                >
                    <div data-qa="quote-author" style={{ display: "grid", gridTemplateAreas: '"q"', flex: "1 1 220px", minWidth: 0 }}>
                        {items.map((it, j) => {
                            const on = j === active
                            const name = (it.name || "").trim()
                            return (
                                <figcaption
                                    key={it.id || j}
                                    aria-hidden={on ? undefined : true}
                                    style={{ ...layer(on), display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
                                >
                                    {cp.showAvatars && (it.avatar || name) && (
                                        <Avatar src={it.avatar} name={name} size={44} eager={cp.eagerImages} />
                                    )}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ ...fontToCss(cp.nameFont), fontWeight: 600, fontSize: (cp.nameFont?.fontSize as number) || 15, lineHeight: 1.25 }}>
                                            {it.name}
                                        </div>
                                        <div style={{ color: cp.mutedColor, fontSize: 13, marginTop: 2 }}>
                                            {[it.role, it.company].filter(Boolean).join(" · ")}
                                        </div>
                                    </div>
                                </figcaption>
                            )
                        })}
                    </div>
                    {multi && (
                        <div data-qa="quote-controls" style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}>
                            <div
                                role="group"
                                aria-label="Choose testimonial"
                                data-qa="quote-pager"
                                style={{ display: "flex", alignItems: "center", marginRight: 6 }}
                            >
                                {items.map((it, j) => {
                                    const on = j === active
                                    return (
                                        <button
                                            key={it.id || j}
                                            type="button"
                                            aria-current={on ? true : undefined}
                                            aria-label={`Show testimonial ${j + 1} of ${items.length}`}
                                            onClick={isStatic ? undefined : () => props.setIndex(j)}
                                            style={{
                                                // 44px tall target, compact visual bar.
                                                width: on ? 34 : 18,
                                                height: 44,
                                                padding: "0 3px",
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                display: "grid",
                                                alignItems: "center",
                                                transition: fade ? `width ${fade}ms ease` : undefined,
                                            }}
                                        >
                                            <span
                                                aria-hidden="true"
                                                style={{ display: "block", height: 3, borderRadius: 2, overflow: "hidden", background: withAlpha(fg, on ? 0.22 : 0.18) }}
                                            >
                                                {on && (
                                                    <span
                                                        key={`fill-${active}`}
                                                        data-qa="quote-progress"
                                                        style={{
                                                            display: "block",
                                                            height: "100%",
                                                            background: cp.accentColor,
                                                            transformOrigin: "left center",
                                                            animation: fade ? `tkPullFill ${intervalMs}ms linear forwards` : undefined,
                                                            animationPlayState: playing ? "running" : "paused",
                                                        }}
                                                    />
                                                )}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                            {props.nav.prev}
                            {props.nav.pause}
                            {props.nav.next}
                        </div>
                    )}
                </div>
            </figure>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TestimonialsLite(props: TestimonialsLiteProps): ReactElement {
    return <TestimonialsLiteView {...props} />
}

function TestimonialsLiteView(
    props: TestimonialsLiteProps
): ReactElement {
    const {
        layout = "marquee",
        items,
        label = "Testimonials",
        theme = "light",
        background,
        cardBackground,
        textColor,
        mutedColor,
        accentColor = "#4F46E5",
        starColor = "#F5B301",
        highlightColor = "#D97706",
        radius = 20,
        gap = 16,
        padding = 22,
        shadow = DEFAULT_SHADOW,
        quoteFont,
        nameFont,
        showRatings = true,
        showMetrics = true,
        showAvatars = true,
        showLogos = true,
        showHighlights = true,
        autoplay = true,
        autoplayInterval = 4.5,
        pauseOnHover = true,
        loop = true,
        marqueeSpeed = 1,
        marqueeRows = 2,
        style,
        autoplayPaused,
        onAutoplayPausedChange,
    } = props

    const prefersReduced = usePrefersReducedMotion()
    const fmReduced = useFMReduced()
    const reduced = prefersReduced || !!fmReduced
    const isCanvas =
        typeof RenderTarget !== "undefined" &&
        (RenderTarget.current() === RenderTarget.canvas ||
            RenderTarget.current() === RenderTarget.thumbnail)
    // Framer's static renderer (canvas, export, thumbnails): one settled frame, no
    // timers, springs, CSS animations or input handlers. Called unconditionally.
    const isStatic = !!useIsStaticRenderer() || isCanvas

    // Light / Dark are presets; Background / Card BG / Text / Muted only apply to
    // Custom. (Previously the Background & Card BG controls always sent their light
    // defaults, so choosing Dark changed nothing.)
    const themeColors = useMemo(() => {
        if (theme === "dark") {
            return {
                bg: "#0B1220",
                card: "#151C2C",
                text: "#F8FAFC",
                muted: "rgba(248,250,252,0.65)",
                border: "1px solid rgba(255,255,255,0.08)",
                starEmpty: "rgba(255,255,255,0.2)",
            }
        }
        if (theme === "custom") {
            return {
                bg: background || "#F8FAFC",
                card: cardBackground || "#FFFFFF",
                text: textColor || "#0F172A",
                muted: mutedColor || "rgba(15,23,42,0.6)",
                border: undefined as string | undefined,
                starEmpty: undefined as string | undefined,
            }
        }
        return {
            bg: "#F4F6FB",
            card: "#FFFFFF",
            text: "#0F172A",
            muted: "rgba(15,23,42,0.6)",
            border: undefined as string | undefined,
            starEmpty: undefined as string | undefined,
        }
    }, [theme, background, cardBackground, textColor, mutedColor])

    // The default shadow is tuned for light backgrounds; deepen it on Dark.
    const effectiveShadow =
        theme === "dark" && shadow === DEFAULT_SHADOW ? "0 14px 40px rgba(0,0,0,0.45)" : shadow

    // Content signature → edits from the property panel always re-derive, even if the
    // host hands back the same array instance.
    const itemsSig =
        items == null
            ? ""
            : items
                  .map((it) =>
                      it
                          ? [it.id, it.name, it.role, it.company, it.avatar, it.quote, it.rating, it.highlight, it.metric, it.sourceLogo, it.cardColor, it.link].join("\u0001")
                          : ""
                  )
                  .join("\u0002")
    const resolved = useMemo((): TKItem[] => {
        // undefined/null → demo defaults (Framer canvas); explicit [] → empty state
        const source = items == null ? DEFAULT_ITEMS : items
        // New objects (props are never mutated); index-based ids keep keys stable while
        // editing, so cards don't remount on every keystroke.
        return source.map((it, i) => ({
            ...(it ?? {}),
            id: it?.id || `t-${i}`,
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, itemsSig])

    const hasSlotNodes = false
    const count = resolved.length

    const [index, setIndex] = useState(0)
    // The visitor's Pause/Play choice (undefined until they press the button).
    const [pausedChoice, setPausedChoice] = useState<boolean | undefined>(undefined)
    // Mouse hover only (pointerType "mouse"): touch taps fire compatibility mouseenter
    // without a matching mouseleave, which used to freeze autoplay for good.
    const [hoverPaused, setHoverPaused] = useState(false)
    // Focus-within pause is tracked separately: a blur must not un-pause while the
    // mouse is still over the component (that let autoplay fire right after a click).
    const [focusPaused, setFocusPaused] = useState(false)
    // Root element in state (stable primitive IntersectionObserver params, re-observed
    // if the node is replaced) plus a ref object for the width hook.
    const rootRef = useRef<HTMLDivElement | null>(null)
    const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)
    const setRoot = useCallback((el: HTMLDivElement | null) => {
        rootRef.current = el
        setRootEl(el)
    }, [])
    const inView = useElementInView(rootEl, ROOT_IN_VIEW_THRESHOLD)
    // Prefer container width (Framer frame) over viewport media query.

    // Keep index in range when the list shrinks (CMS / prop updates).
    useEffect(() => {
        if (count <= 0) {
            if (index !== 0) setIndex(0)
            return
        }
        if (index > count - 1) setIndex(count - 1)
    }, [count, index])


    // What the Pause/Play button shows and controls: the visitor's choice (controlled
    // prop first, then our own state). Reduced-motion visitors start paused until they
    // press Play. Hover / focus / off-screen / static only suspend the timer; they never
    // flip the button (it used to show the momentary timer state, so pressing Play while
    // hovering looked dead).
    const userPaused = autoplayPaused ?? pausedChoice ?? reduced
    const interactionPaused = pauseOnHover && (hoverPaused || focusPaused)

    // Rating Badge aggregates manual ratings; CMS slots carry none → featured card view.
    const effectiveLayout: TestimonialLayout = layout === "single" ? "single" : "marquee"
    const navigable = NAV_LAYOUTS.has(effectiveLayout) && count > 1
    // Highest reachable index without loop. The slider stops when its last page is
    // fully visible (it used to scroll past the end into empty space).
    const maxIndex = Math.max(0, count - 1)
    const step = useCallback(
        (delta: number) => {
            if (count <= 0 || isStatic) return
            setIndex((i) => (loop ? wrapIndex(i + delta, count) : clamp(i + delta, 0, maxIndex)))
        },
        [count, isStatic, loop, maxIndex]
    )
    const goTo = useCallback(
        (n: number) => {
            if (count <= 0 || isStatic) return
            setIndex(loop ? wrapIndex(n, count) : clamp(n, 0, maxIndex))
        },
        [count, isStatic, loop, maxIndex]
    )
    // Keep the index reachable when the list, Cards per View or Loop change.
    useEffect(() => {
        if (!loop && index > maxIndex) setIndex(maxIndex)
    }, [loop, index, maxIndex])
    const canAutoplay =
        autoplay && !isStatic && inView && !userPaused && !interactionPaused && navigable
    const pointerDownRef = useRef(false)
    const onCardHover = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== "mouse" || !pauseOnHover || effectiveLayout === "marquee") return
        const onCard = e.target instanceof Element && e.target.closest("[data-tk-card]") !== null
        setHoverPaused((cur) => (cur === onCard ? cur : onCard))
    }
    const toggleAutoplay = () => {
        const nextPaused = !userPaused
        // An explicit Play wins over pause-on-hover/focus (the pointer and focus are on
        // the button, inside the kit). They apply again on the next enter / focus.
        if (!nextPaused) {
            setHoverPaused(false)
            setFocusPaused(false)
        }
        setPausedChoice(nextPaused)
        onAutoplayPausedChange?.(nextPaused)
    }

    useAutoplay(
        canAutoplay,
        Math.max(1.5, autoplayInterval) * 1000,
        () => {
            // Without loop, autoplay stops at the end instead of ticking in place.
            if (!loop && index >= maxIndex) return
            step(1)
        },
        false,
        index // resetKey: manual nav restarts the full interval
    )

    const cardProps = useMemo(
        () => ({
            eagerImages: isStatic,
            theme,
            cardBackground: themeColors.card,
            textColor: themeColors.text,
            mutedColor: themeColors.muted,
            accentColor,
            starColor,
            highlightColor,
            radius,
            padding,
            shadow: effectiveShadow,
            quoteFont,
            nameFont,
            showRatings,
            showMetrics,
            showAvatars,
            showLogos,
            showHighlights,
            border: themeColors.border,
            starEmptyColor: themeColors.starEmpty,
        }),
        [
            isStatic,
            theme,
            themeColors,
            accentColor,
            starColor,
            highlightColor,
            radius,
            padding,
            effectiveShadow,
            quoteFont,
            nameFont,
            showRatings,
            showMetrics,
            showAvatars,
            showLogos,
            showHighlights,
        ]
    )

    const renderSlot: RenderSlot | undefined = undefined
    // Keys are only claimed when they can navigate (slider-like layouts, 2+ items), so
    // arrow keys still scroll the page / the masonry and stack panes everywhere else.
    // Up/Down are left to the page.
    const onKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (!navigable || isStatic || e.altKey || e.ctrlKey || e.metaKey) return
            let handled = true
            if (e.key === "ArrowRight") step(1)
            else if (e.key === "ArrowLeft") step(-1)
            else if (e.key === "Home") goTo(0)
            else if (e.key === "End") goTo(loop ? count - 1 : maxIndex)
            else handled = false
            if (handled) e.preventDefault()
        },
        [navigable, isStatic, step, goTo, loop, count, maxIndex]
    )


    const navButtons = {
        prev: (
            <button
                type="button"
                aria-label="Previous testimonial"
                data-qa="testimonial-prev"
                disabled={count <= 1 || (!loop && index <= 0)}
                onClick={isStatic ? undefined : () => step(-1)}
                style={navBtnStyle(themeColors.card, themeColors.text, count <= 1 || (!loop && index <= 0))}
            >
                <span aria-hidden="true">‹</span>
            </button>
        ),
        pause: autoplay ? (
            <button
                type="button"
                aria-label={userPaused ? "Play autoplay" : "Pause autoplay"}
                data-qa="testimonial-autoplay"
                onClick={isStatic ? undefined : toggleAutoplay}
                style={navBtnStyle(themeColors.card, themeColors.text, false)}
            >
                <span aria-hidden="true">{userPaused ? "▶" : "❚❚"}</span>
            </button>
        ) : null,
        next: (
            <button
                type="button"
                aria-label="Next testimonial"
                data-qa="testimonial-next"
                disabled={count <= 1 || (!loop && index >= maxIndex)}
                onClick={isStatic ? undefined : () => step(1)}
                style={navBtnStyle(themeColors.card, themeColors.text, count <= 1 || (!loop && index >= maxIndex))}
            >
                <span aria-hidden="true">›</span>
            </button>
        ),
    }

    let body: ReactElement
    if (count === 0 && !hasSlotNodes) {
        body = (
            <div
                data-qa="empty-state"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    color: themeColors.muted,
                    fontSize: 14,
                    padding: 24,
                    boxSizing: "border-box",
                    textAlign: "center",
                }}
            >
                No testimonials to display
            </div>
        )
    } else {
        switch (effectiveLayout) {
            case "marquee":
            default:
                body = (
                    <MarqueeLayout
                        items={resolved}
                        renderSlot={renderSlot}
                        cardProps={cardProps}
                        speed={marqueeSpeed}
                        rows={marqueeRows}
                        gap={gap}
                        animated={!reduced && !isStatic}
                        // Focus / off-screen pause every row; card hover pauses only its own row.
                        running={inView && !(pauseOnHover && focusPaused)}
                        pauseOnHover={pauseOnHover}
                    />
                )
                break
            case "single":
                // Manual content: editorial pull-quote with docked controls. CMS slots
                // keep the card (their nodes bring their own design).
                body = (
                    <PullQuoteLayout
                        items={resolved}
                        cardProps={cardProps}
                        index={index}
                        setIndex={goTo}
                        reduced={reduced}
                        isStatic={isStatic}
                        playing={canAutoplay}
                        intervalMs={Math.max(1.5, autoplayInterval) * 1000}
                        nav={navButtons}
                    />
                )
                break
        }
    }

    return (
        <div
            ref={setRoot}
            role="region"
            aria-roledescription={navigable ? "carousel" : undefined}
            aria-label={label.trim() || "Testimonials"}
            data-tk-root=""
            data-layout={effectiveLayout}
            data-static={isStatic ? "true" : undefined}
            // Focusable when the keyboard can do something here: navigate (slider-like
            // layouts) or pause the moving marquee (focus pauses it, WCAG 2.2.2).
            tabIndex={(navigable || effectiveLayout === "marquee") && !isStatic ? 0 : undefined}
            onKeyDown={isStatic ? undefined : onKeyDown}
            // Pause on Hover applies over cards only: gaps, padding and chrome keep playing.
            onPointerOver={isStatic ? undefined : onCardHover}
            onPointerMove={isStatic ? undefined : onCardHover}
            onPointerLeave={isStatic ? undefined : (e) => e.pointerType === "mouse" && setHoverPaused(false)}
            // Focus anywhere inside pauses (WCAG 2.2.2); pressing Play clears it.
            // A mouse click on empty space focuses the region itself; that must not pause
            // autoplay. Keyboard / programmatic focus anywhere inside still pauses.
            onPointerDown={isStatic ? undefined : () => { pointerDownRef.current = true }}
            onPointerUp={isStatic ? undefined : () => { pointerDownRef.current = false }}
            onFocus={isStatic ? undefined : (e) => {
                if (pointerDownRef.current && e.target === e.currentTarget) return
                setFocusPaused(true)
            }}
            onBlur={isStatic ? undefined : (e) => {
                const next = e.relatedTarget
                if (!(next instanceof Node) || !e.currentTarget.contains(next)) setFocusPaused(false)
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: themeColors.bg,
                color: themeColors.text,
                borderRadius: radius,
                overflow: "hidden",
                ...style,
            }}
        >
            {/* Announce manual changes only; while autoplay runs the region is off (APG
                carousel pattern), so screen readers aren't interrupted every few seconds. */}
            <span style={srOnly} aria-live={canAutoplay ? "off" : "polite"} data-qa="testimonial-live">
                {count === 0
                    ? "No testimonials"
                    : hasSlotNodes
                      ? `Showing item ${wrapIndex(index, count) + 1} of ${count}`
                      : resolved[wrapIndex(index, count)]?.name
                      ? `Showing testimonial from ${resolved[wrapIndex(index, count)]?.name}`
                      : ""}
            </span>

            <style>{FOCUS_RING_CSS}</style>

            {body}


        </div>
    )
}

function navBtnStyle(bg: string, color: string, disabled: boolean): CSSProperties {
    return {
        opacity: disabled ? 0.4 : 1,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "none",
        background: bg,
        color,
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
        cursor: disabled ? "default" : "pointer",
        fontSize: 16,
        lineHeight: 1,
        display: "grid",
        placeItems: "center",
        padding: 0,
        flex: "0 0 auto",
    }
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

addPropertyControls(TestimonialsLite, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["marquee", "single"],
        optionTitles: ["Marquee Wall", "Quote"],
        defaultValue: "marquee",
        displaySegmentedControl: true,
        description: "Free: Marquee + Quote. All 8 layouts + CMS in Testimonial Carousel.",
    },
    items: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Jane Doe" },
                role: { type: ControlType.String, title: "Role", defaultValue: "Designer" },
                company: { type: ControlType.String, title: "Company", defaultValue: "Acme" },
                avatar: { type: ControlType.Image, title: "Avatar" },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue: "This product changed how we ship.",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    min: 0,
                    max: 5,
                    step: 0.5,
                    defaultValue: 5,
                },
                highlight: { type: ControlType.String, title: "Highlight Phrase", defaultValue: "" },
                metric: { type: ControlType.String, title: "Metric", defaultValue: "" },
                sourceLogo: { type: ControlType.Image, title: "Source Logo" },
                cardColor: { type: ControlType.Color, title: "Card Color" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
        description: "Manual items. CMS Collection Lists: Testimonial Carousel.",
    },
    marqueeSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        hidden: (p) => p.layout !== "marquee",
        min: 0.25,
        max: 3,
        step: 0.05,
        defaultValue: 1,
    },
    marqueeRows: {
        type: ControlType.Number,
        title: "Rows",
        hidden: (p) => p.layout !== "marquee",
        min: 1,
        max: 4,
        step: 1,
        defaultValue: 2,
    },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: true, hidden: (p) => p.layout !== "single", description: "Quote only. Pauses on focus and offers a Pause button; off for reduced motion." },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Autoplay Every",
        hidden: (p) => !p.autoplay,
        min: 2,
        max: 12,
        step: 0.5,
        defaultValue: 4.5,
        unit: "s",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        hidden: (p) => !p.autoplay && p.layout !== "marquee",
    },
    loop: { type: ControlType.Boolean, title: "Loop Around", defaultValue: true, description: "After the last card, go back to the first." },
    showRatings: { type: ControlType.Boolean, title: "Show Ratings", defaultValue: true },
    showMetrics: { type: ControlType.Boolean, title: "Show Metrics", defaultValue: true },
    showAvatars: { type: ControlType.Boolean, title: "Show Avatars", defaultValue: true, description: "Cards with no photo show initials; cards with no name and no photo show none." },
    showLogos: { type: ControlType.Boolean, title: "Show Logos", defaultValue: true },
    showHighlights: { type: ControlType.Boolean, title: "Show Highlights", defaultValue: true },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "custom"],
        optionTitles: ["Light", "Dark", "Custom"],
        defaultValue: "light",
        displaySegmentedControl: true,
        description: "Light and Dark set every colour for you. Custom unlocks the colour pickers.",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F4F6FB",
        hidden: (p) => p.theme !== "custom",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.theme !== "custom",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#0F172A",
        hidden: (p) => p.theme !== "custom",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        defaultValue: "rgba(15,23,42,0.6)",
        hidden: (p) => p.theme !== "custom",
    },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#4F46E5", description: "Metric chips, active thumbnail ring and badge caption." },
    starColor: { type: ControlType.Color, title: "Star Color", defaultValue: "#F5B301" },
    highlightColor: { type: ControlType.Color, title: "Highlight Color", defaultValue: "#D97706", description: "Colour of each card's Highlight Phrase." },
    radius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 40,
        defaultValue: 20,
        unit: "px",
    },
    gap: { type: ControlType.Number, title: "Card Gap", min: 0, max: 48, defaultValue: 16, unit: "px" },
    padding: {
        type: ControlType.Number,
        title: "Card Padding",
        min: 8,
        max: 48,
        defaultValue: 22,
        unit: "px",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Card Shadow",
        defaultValue: "0 12px 40px rgba(15,23,42,0.10)",
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        displayFontSize: true,
    },
    label: {
        type: ControlType.String,
        title: "Accessible Label",
        defaultValue: "Testimonials",
        description: "Accessible name read by screen readers.",
    },
})
