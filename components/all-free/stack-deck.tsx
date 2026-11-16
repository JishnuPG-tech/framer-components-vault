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
   StackDeck

   Photo cards that hold the screen while you scroll. Each new card rises
   over the last one — revealed upward from its bottom edge, or sliding
   in from below — and the card underneath shrinks, tilts back, dims and
   sinks into a pile. A counter pill on the deck shows "03 / 05" and its
   dashes jump straight to any card.

   The section is tall (one scroll stretch per card) with a sticky stage
   inside. One progress value (0 … cards − 1, fractional mid-way) drives
   every card, written straight to the DOM. The value glides after the
   scroll position with time-based inertia, so the motion stays slow and
   heavy at any frame rate, and the photo inside an arriving card drifts
   into place as it lands.
   ──────────────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────────
   GUIDE FOR EDITING THIS FILE (people and AI coding agents)

   A Framer code component: one file, one default export, imports only
   from "react", "react-dom", "framer" and "framer-motion".

   ## Map
   1. Types and DEFAULT_* objects
   2. framerAsset() — media allowlist
   3. StackDeck component
        a. cards (or placeholders)
        b. pose(i, progress): entering card + covered pile + title; paint()
        c. scroll → progress (inertia), jump to card
        d. JSX: tall section → sticky stage → deck → cards + counter
   4. addPropertyControls

   ## Rules
   - Keep control keys stable; renaming one resets it on placed instances.
   - useIsStaticRenderer() is true on the Framer canvas and in export:
     render only the stage ("Canvas Height") posed at "Canvas Card",
     with no listeners.
   - Media must come from Framer-managed assets: every image URL goes
     through framerAsset(); never add free-form URL fields.
   - Sticky positioning needs every parent to have overflow visible.
   - Respect prefers-reduced-motion: cards swap with no rise or tilt.
   - No template literals in this file (keeps it easy to paste into tools
     that wrap code in backticks).

   ## Common changes
   - Different pile look: edit the "covered" branch in pose().
   - Different entrance: edit the "entering" branch in pose().
   - Title timing: the "label" / "labelY" fields in pose(). Titles only
     appear once their card has landed, so a reveal never slices text.
   ──────────────────────────────────────────────────────────────────────── */

interface CardInput {
    image?: { src?: string; srcSet?: string; alt?: string }
    title?: string
    link?: string
}

interface Props {
    style?: React.CSSProperties
    cards: CardInput[]
    layout: { width: number; mobileWidth: number; maxWidth: number; ratio: number; radius: number; stageHeight: number; top: number; scroll: number }
    enter: { mode: "reveal" | "slide"; smooth: number; parallax: number }
    pile: { shrink: number; tilt: number; lift: number; twist: number; dim: number; dimColor: string; depth: number; perspective: number }
    label: { show: boolean; font: any; color: string; inset: number }
    counter: { show: boolean; font: any; color: string; fill: string; radius: number; jump: boolean }
    canvas: { card: number; height: number }
    onChange?: (index: number) => void
}

const DEFAULT_LAYOUT = { width: 64, mobileWidth: 90, maxWidth: 1040, ratio: 1.6, radius: 6, stageHeight: 100, top: 0, scroll: 90 }
const DEFAULT_ENTER = { mode: "reveal" as const, smooth: 0.8, parallax: 14 }
const DEFAULT_PILE = { shrink: 0.06, tilt: 14, lift: 24, twist: 0, dim: 0.45, dimColor: "#000000", depth: 2, perspective: 1400 }
const DEFAULT_LABEL = { show: true, font: { fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: "1.2em" }, color: "#FFFFFF", inset: 16 }
const DEFAULT_COUNTER = { show: true, font: { fontSize: 12, fontWeight: 500, letterSpacing: "0.02em", lineHeight: "1em" }, color: "#FFFFFF", fill: "rgba(0,0,0,0.35)", radius: 999, jump: true }
const DEFAULT_CANVAS = { card: 2, height: 800 }
const PLACEHOLDERS = [
    "linear-gradient(160deg,#2A1A10,#C4622D)",
    "linear-gradient(160deg,#3B2416,#E08A4A)",
    "linear-gradient(160deg,#1E1612,#9C4B26)",
    "linear-gradient(160deg,#40220F,#D9783A)",
    "linear-gradient(160deg,#160E0A,#7A3A1E)",
]
const PLACEHOLDER_TITLES = ["Headphones", "Turntable", "Cassette", "Desktop", "Speaker"]

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
function framerSrcSet(srcSet: string | undefined): string | undefined {
    if (!srcSet) return undefined
    const kept = srcSet
        .split(",")
        .map((c) => c.trim())
        .filter((c) => framerAsset(c.split(/\s+/)[0]))
    return kept.length ? kept.join(", ") : undefined
}
function px(v: any) {
    return typeof v === "number" ? v + "px" : v
}
function pad2(n: number) {
    return n < 10 ? "0" + n : String(n)
}
function clamp(v: number, a: number, b: number) {
    return v < a ? a : v > b ? b : v
}
function easeInOut(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function easeOut(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])
    return reduced
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function StackDeck(props: Props) {
    const isStatic = useIsStaticRenderer()
    // The canvas always shows the designed pose, even if the editor reports reduced motion.
    const reduced = useReducedMotion() && !isStatic
    const ly = { ...DEFAULT_LAYOUT, ...props.layout }
    const en = { ...DEFAULT_ENTER, ...props.enter }
    const pl = { ...DEFAULT_PILE, ...props.pile }
    const lb = { ...DEFAULT_LABEL, ...props.label }
    const ct = { ...DEFAULT_COUNTER, ...props.counter }
    const cv = { ...DEFAULT_CANVAS, ...props.canvas }

    /* ── a. cards ────────────────────────────────────────────────────── */
    const userCards = Array.isArray(props.cards) ? props.cards : []
    const cards = React.useMemo(() => {
        if (!userCards.length) return PLACEHOLDERS.map((fill, i) => ({ src: "", srcSet: undefined as string | undefined, alt: "", title: PLACEHOLDER_TITLES[i], link: "", fill }))
        return userCards.map((c, i) => ({
            src: framerAsset(c?.image?.src),
            srcSet: framerSrcSet(c?.image?.srcSet),
            alt: c?.image?.alt || "",
            title: c?.title || "",
            link: c?.link || "",
            fill: PLACEHOLDERS[i % PLACEHOLDERS.length],
        }))
    }, [userCards])
    const n = cards.length
    const last = Math.max(0, n - 1)
    const canvasP = clamp(Math.round(cv.card) - 1, 0, last)

    const rootRef = React.useRef<HTMLElement>(null)
    const cardRefs = React.useRef<(HTMLLIElement | null)[]>([])
    const dimRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const labelRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const imgRefs = React.useRef<(HTMLImageElement | null)[]>([])
    const progRef = React.useRef(isStatic ? canvasP : 0)
    const [active, setActive] = React.useState(isStatic ? canvasP : 0)
    const activeRef = React.useRef(active)

    /* ── b. pose + paint ─────────────────────────────────────────────── */
    // Pure: the look of card i at progress p. Used inline at render (so the
    // static canvas shows the pile) and by paint() on every scroll frame.
    const levels = Math.max(1, pl.depth)
    const parallax = clamp(en.parallax ?? 0, 0, 40)
    const pose = (i: number, p: number) => {
        const e = p - i
        if (e <= -1) return { visibility: "hidden", transform: "none", clipPath: "none", opacity: "0", dim: "0", label: "0", labelY: "0px", image: "none" }
        if (e < 0) {
            // entering: t 0 → 1 as this card arrives on top
            const t = reduced ? (e > -0.5 ? 1 : 0) : easeInOut(e + 1)
            const reveal = en.mode === "reveal"
            // The title waits for the card to land, then rises in.
            const lt = reduced ? t : easeOut(clamp((e + 1 - 0.72) / 0.28, 0, 1))
            const drift = reduced ? 0 : 1 - t
            return {
                visibility: "visible",
                clipPath: reveal ? "inset(" + ((1 - t) * 100).toFixed(2) + "% 0 0 0 round " + ly.radius + "px)" : "none",
                transform: reveal ? "none" : "translateY(" + ((1 - t) * 125).toFixed(2) + "%)",
                opacity: reduced ? String(t) : "1",
                dim: "0",
                label: lt.toFixed(3),
                labelY: ((1 - lt) * 18).toFixed(2) + "px",
                image: "translateY(" + (drift * parallax).toFixed(2) + "%) scale(" + (1 + drift * (parallax / 100) * 0.9).toFixed(4) + ")",
            }
        }
        // covered: d = how many cards now sit on top of this one. Own perspective()
        // per card (no shared 3D space), so stacking is plain z-index order and a
        // tilted card never cuts through the one above. Lift is % of card height.
        const d = reduced ? 0 : Math.min(e, levels + 1)
        const twist = pl.twist * d * (i % 2 ? -1 : 1)
        // The title leaves before the next card's edge can pass through it.
        const lo = reduced ? (e < 0.5 ? 1 : 0) : 1 - easeOut(clamp(e / 0.22, 0, 1))
        return {
            visibility: "visible",
            clipPath: "none",
            transform: "perspective(" + pl.perspective + "px) translateY(" + (-pl.lift * d).toFixed(2) + "%) rotateX(" + (pl.tilt * d).toFixed(2) + "deg) rotateZ(" + twist.toFixed(2) + "deg) scale(" + (1 - pl.shrink * d).toFixed(4) + ")",
            opacity: String(clamp(levels + 1 - e, 0, 1)),
            dim: String(Math.min(1, e) * pl.dim),
            label: lo.toFixed(3),
            labelY: (-(1 - lo) * 12).toFixed(2) + "px",
            image: "none",
        }
    }
    const paint = (p: number) => {
        for (let i = 0; i < n; i++) {
            const el = cardRefs.current[i]
            if (!el) continue
            const q = pose(i, p)
            el.style.visibility = q.visibility
            el.style.clipPath = q.clipPath
            el.style.transform = q.transform
            el.style.opacity = q.opacity
            const dim = dimRefs.current[i]
            if (dim) dim.style.opacity = q.dim
            const label = labelRefs.current[i]
            if (label) {
                label.style.opacity = q.label
                label.style.transform = "translateY(" + q.labelY + ")"
            }
            const img = imgRefs.current[i]
            if (img) img.style.transform = q.image
        }
        const idx = clamp(Math.round(p), 0, last)
        if (idx !== activeRef.current) {
            activeRef.current = idx
            setActive(idx)
            props.onChange?.(idx)
        }
    }
    const paintRef = React.useRef(paint)
    paintRef.current = paint
    React.useLayoutEffect(() => {
        if (isStatic) progRef.current = canvasP
        paint(progRef.current)
    })

    /* ── c. scroll → progress ────────────────────────────────────────── */
    const segPx = () => (ly.scroll / 100) * (window.innerHeight || 800)
    React.useEffect(() => {
        if (isStatic) return
        const el = rootRef.current
        if (!el) return
        let raf = 0
        let lastT = 0
        const goal = () => clamp((ly.top - el.getBoundingClientRect().top) / Math.max(1, segPx()), 0, last)
        // Inertia: progress chases the scroll goal at a fixed rate per second
        // (Smoothing 0 ≈ instant, 1 ≈ a long, heavy glide), independent of
        // the display's frame rate.
        const s = clamp(en.smooth, 0, 1)
        const rate = 1.2 + Math.pow(1 - s, 2) * 38
        const tick = (now: number) => {
            raf = 0
            const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 1 / 60
            lastT = now
            const g = goal()
            const k = reduced ? 1 : 1 - Math.exp(-dt * rate)
            const next = progRef.current + (g - progRef.current) * k
            progRef.current = Math.abs(g - next) < 0.0005 ? g : next
            paintRef.current(progRef.current)
            if (progRef.current !== g) raf = requestAnimationFrame(tick)
            else lastT = 0
        }
        const wake = () => {
            if (!raf) raf = requestAnimationFrame(tick)
        }
        progRef.current = goal()
        paintRef.current(progRef.current)
        window.addEventListener("scroll", wake, { passive: true })
        window.addEventListener("resize", wake)
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("scroll", wake)
            window.removeEventListener("resize", wake)
        }
    }, [isStatic, ly.top, ly.scroll, last, reduced, en.smooth])

    const jump = (i: number) => {
        const el = rootRef.current
        if (!el || isStatic) return
        const y = window.scrollY + el.getBoundingClientRect().top - ly.top + i * segPx() + 1
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" })
    }

    /* ── d. render ───────────────────────────────────────────────────── */
    // Narrow frames (phones) use "Mobile Width" so the card stays readable.
    const [narrow, setNarrow] = React.useState(false)
    React.useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => setNarrow(el.offsetWidth < 640))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const stageH = isStatic ? cv.height + "px" : ly.stageHeight + "vh"
    const height = isStatic ? cv.height + "px" : "calc(" + ly.stageHeight + "vh + " + last * ly.scroll + "vh)"
    const ratio = Math.max(0.3, ly.ratio)
    const deckW = "min(" + (narrow ? ly.mobileWidth : ly.width) + "%, " + ly.maxWidth + "px, calc(" + stageH + " * 0.72 * " + ratio + "))"
    const labelFont: React.CSSProperties = { ...lb.font, fontSize: px(lb.font?.fontSize) }
    const counterFont: React.CSSProperties = { ...ct.font, fontSize: px(ct.font?.fontSize) }
    const fontPx = parseFloat(String(ct.font?.fontSize ?? 12)) || 12
    return (
        <section ref={rootRef} aria-roledescription="card stack" style={{ ...props.style, position: "relative", width: "100%", height }}>
            <div style={{ position: isStatic ? "relative" : "sticky", top: ly.top, height: stageH, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ position: "relative", width: deckW, aspectRatio: String(ratio) }}>
                    <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "absolute", inset: 0 }}>
                        {cards.map((c, i) => {
                            const Wrap: any = c.link ? "a" : "div"
                            const q = pose(i, isStatic ? canvasP : progRef.current)
                            return (
                                <li
                                    key={i}
                                    ref={(el) => {
                                        cardRefs.current[i] = el
                                    }}
                                    aria-hidden={i !== active || undefined}
                                    style={{ position: "absolute", inset: 0, zIndex: i + 1, transformOrigin: "50% 100%", borderRadius: ly.radius, overflow: "hidden", background: c.fill, visibility: q.visibility as any, clipPath: q.clipPath, transform: q.transform, opacity: q.opacity as any, willChange: isStatic ? undefined : "transform, clip-path" }}
                                >
                                    <Wrap href={c.link || undefined} tabIndex={c.link && i === active ? 0 : -1} style={{ position: "absolute", inset: 0, display: "block", color: "inherit", textDecoration: "none" }}>
                                        {c.src ? (
                                            <img
                                                ref={(el) => {
                                                    imgRefs.current[i] = el
                                                }}
                                                src={c.src}
                                                srcSet={c.srcSet}
                                                sizes="(max-width: 810px) 100vw, 1040px"
                                                alt={c.alt || c.title}
                                                draggable={false}
                                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", transform: q.image, transformOrigin: "50% 100%", willChange: isStatic ? undefined : "transform" }}
                                            />
                                        ) : null}
                                        <div
                                            ref={(el) => {
                                                dimRefs.current[i] = el
                                            }}
                                            style={{ position: "absolute", inset: 0, background: pl.dimColor, opacity: q.dim as any, pointerEvents: "none" }}
                                        />
                                        {lb.show && c.title ? (
                                            <div
                                                ref={(el) => {
                                                    labelRefs.current[i] = el
                                                }}
                                                style={{ ...labelFont, position: "absolute", left: lb.inset, top: lb.inset, color: lb.color, opacity: q.label as any, transform: "translateY(" + q.labelY + ")", pointerEvents: "none", willChange: isStatic ? undefined : "transform, opacity" }}
                                            >
                                                {c.title}
                                            </div>
                                        ) : null}
                                    </Wrap>
                                </li>
                            )
                        })}
                    </ol>
                    {ct.show && n > 1 ? (
                        <nav aria-label="Cards" style={{ ...counterFont, position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)", zIndex: n + 2, display: "flex", alignItems: "center", gap: fontPx * 0.9, padding: fontPx * 0.55 + "px " + fontPx + "px", borderRadius: Math.max(0, ct.radius ?? 999), background: ct.fill, color: ct.color, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", whiteSpace: "nowrap" }}>
                            <span aria-live="polite" style={{ fontVariantNumeric: "tabular-nums" }}>
                                {pad2(active + 1)}
                                <span style={{ opacity: 0.55 }}>{" / " + pad2(n)}</span>
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {cards.map((c, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={!ct.jump}
                                        onClick={() => jump(i)}
                                        aria-label={"Go to card " + (i + 1) + (c.title ? ": " + c.title : "")}
                                        aria-current={i === active || undefined}
                                        style={{ all: "unset", cursor: ct.jump ? "pointer" : "default", padding: "6px 0", display: "block" }}
                                    >
                                        <span style={{ display: "block", width: i === active ? fontPx * 1.6 : fontPx * 0.8, height: 2, borderRadius: 2, background: ct.color, opacity: i === active ? 1 : 0.45, transition: "width 0.3s ease, opacity 0.3s ease" }} />
                                    </button>
                                ))}
                            </span>
                        </nav>
                    ) : null}
                </div>
            </div>
        </section>
    )
}

addPropertyControls(StackDeck, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Card" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            width: { type: ControlType.Number, title: "Card Width", min: 20, max: 100, unit: "%", defaultValue: DEFAULT_LAYOUT.width },
            mobileWidth: { type: ControlType.Number, title: "Mobile Width", min: 20, max: 100, unit: "%", defaultValue: DEFAULT_LAYOUT.mobileWidth, description: "Card width when the frame is under 640px wide." },
            maxWidth: { type: ControlType.Number, title: "Max Width", min: 200, max: 2400, step: 10, unit: "px", defaultValue: DEFAULT_LAYOUT.maxWidth },
            ratio: { type: ControlType.Number, title: "Ratio", min: 0.5, max: 3, step: 0.05, defaultValue: DEFAULT_LAYOUT.ratio, description: "Card width ÷ height." },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 60, unit: "px", defaultValue: DEFAULT_LAYOUT.radius },
            stageHeight: { type: ControlType.Number, title: "Stage", min: 40, max: 100, unit: "vh", defaultValue: DEFAULT_LAYOUT.stageHeight, description: "Height of the pinned area." },
            top: { type: ControlType.Number, title: "Sticky Top", min: 0, max: 400, unit: "px", defaultValue: DEFAULT_LAYOUT.top },
            scroll: { type: ControlType.Number, title: "Scroll / Card", min: 20, max: 300, unit: "vh", defaultValue: DEFAULT_LAYOUT.scroll },
        },
    },
    enter: {
        type: ControlType.Object,
        title: "Enter",
        controls: {
            mode: { type: ControlType.Enum, title: "Mode", options: ["reveal", "slide"], optionTitles: ["Reveal", "Slide"], defaultValue: DEFAULT_ENTER.mode, displaySegmentedControl: true },
            smooth: { type: ControlType.Number, title: "Smoothing", min: 0, max: 1, step: 0.01, defaultValue: DEFAULT_ENTER.smooth, description: "Inertia. 0 follows the scroll exactly, 1 is a long, slow glide." },
            parallax: { type: ControlType.Number, title: "Image Drift", min: 0, max: 40, unit: "%", defaultValue: DEFAULT_ENTER.parallax, description: "How far the photo drifts inside an arriving card. 0 turns it off." },
        },
    },
    pile: {
        type: ControlType.Object,
        title: "Pile",
        controls: {
            shrink: { type: ControlType.Number, title: "Shrink", min: 0, max: 0.3, step: 0.01, defaultValue: DEFAULT_PILE.shrink },
            tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 60, unit: "°", defaultValue: DEFAULT_PILE.tilt },
            lift: { type: ControlType.Number, title: "Lift", min: -60, max: 60, unit: "%", defaultValue: DEFAULT_PILE.lift, description: "How far each covered card peeks out above." },
            twist: { type: ControlType.Number, title: "Twist", min: 0, max: 15, step: 0.5, unit: "°", defaultValue: DEFAULT_PILE.twist },
            dim: { type: ControlType.Number, title: "Dim", min: 0, max: 1, step: 0.01, defaultValue: DEFAULT_PILE.dim },
            dimColor: { type: ControlType.Color, title: "Dim Color", defaultValue: DEFAULT_PILE.dimColor },
            depth: { type: ControlType.Number, title: "Visible", min: 1, max: 6, step: 1, displayStepper: true, defaultValue: DEFAULT_PILE.depth, description: "Covered cards kept visible." },
            perspective: { type: ControlType.Number, title: "Perspective", min: 300, max: 4000, step: 50, unit: "px", defaultValue: DEFAULT_PILE.perspective },
        },
    },
    label: {
        type: ControlType.Object,
        title: "Label",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_LABEL.show },
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: DEFAULT_LABEL.font, hidden: (p: any) => !p.show },
            color: { type: ControlType.Color, title: "Color", defaultValue: DEFAULT_LABEL.color, hidden: (p: any) => !p.show },
            inset: { type: ControlType.Number, title: "Inset", min: 0, max: 80, unit: "px", defaultValue: DEFAULT_LABEL.inset, hidden: (p: any) => !p.show },
        },
    },
    counter: {
        type: ControlType.Object,
        title: "Counter",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_COUNTER.show },
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: DEFAULT_COUNTER.font, hidden: (p: any) => !p.show },
            color: { type: ControlType.Color, title: "Color", defaultValue: DEFAULT_COUNTER.color, hidden: (p: any) => !p.show },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: DEFAULT_COUNTER.fill, hidden: (p: any) => !p.show },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 999, unit: "px", defaultValue: DEFAULT_COUNTER.radius, hidden: (p: any) => !p.show },
            jump: { type: ControlType.Boolean, title: "Jump on Click", defaultValue: DEFAULT_COUNTER.jump, hidden: (p: any) => !p.show },
        },
    },
    canvas: {
        type: ControlType.Object,
        title: "Canvas",
        controls: {
            card: { type: ControlType.Number, title: "Show Card", min: 1, max: 20, step: 1, displayStepper: true, defaultValue: DEFAULT_CANVAS.card },
            height: { type: ControlType.Number, title: "Height", min: 300, max: 1600, step: 10, unit: "px", defaultValue: DEFAULT_CANVAS.height, description: "Stage height on the canvas. The live site is as tall as the scroll." },
        },
    },
    onChange: { type: ControlType.EventHandler, title: "On Change" },
})
