/**
 * Lens Accordion
 * Creator: Frankie, framer-expert.com
 * 100 Days of Components
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component on the canvas. Edit items and colors in the property panel.
 * 3. Fonts: pick any font in the Font control. It uses your project's default font until you do.
 *
 * Image strips that open on hover or tap; the neighbours follow in a short ripple. Click the open
 * strip to read its article in a centred popup. Items or CMS. Stacks vertically on narrow frames.
 * Layout: width and height flex to the frame. Pure CSS motion, left out of the static (canvas/SSR) render.
 */
import * as React from "react"
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


interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface Item {
    title: string
    tag: string
    year: string
    excerpt: string
    body: string
    image?: ImageValue
    link?: string
}

interface LensAccordionProps {
    source: "items" | "cms"
    collection?: React.ReactNode
    popup: boolean
    reorder: boolean
    linkLabel: string
    panel: string
    backdrop: string
    items: Item[]
    startIndex: number
    trigger: "hover" | "click"
    autoplay: number
    direction: "auto" | "row" | "column"
    openSize: number
    curve: number
    gap: number
    radius: number
    dim: number
    showCaption: boolean
    showYear: boolean
    background: string
    textColor: string
    accent: string
    duration: number
    ripple: number
    font?: React.CSSProperties
}

const img = (id: string, alt: string): ImageValue => ({
    src: `https://framerusercontent.com/images/${id}.jpg`,
    alt,
})

const DEFAULT_ITEMS: Item[] = [
    {
        title: "Pulse",
        tag: "Analytics",
        year: "2026",
        excerpt: "A live view of the numbers that matter, built for teams who check the dashboard before their coffee.",
        body: "Pulse started as a single chart on a wall screen. The team wanted to see sign-ups as they happened, not in a report the next morning.\n\nWe kept that idea at the centre: one screen, a handful of metrics, and nothing that needs a manual to read. Every number links back to the events behind it, so a spike is one click away from an explanation.",
        image: img("euLOO6Ou9QZdgqKU751KI8t8bk", "Gold-lit facade of a building at night"),
    },
    {
        title: "Relay",
        tag: "Developer API",
        year: "2026",
        excerpt: "An API that gets out of the way: clear errors, honest limits and docs you can read on a phone.",
        body: "Relay moves messages between services for a few thousand engineering teams. Most of them never think about it, which is the point.\n\nThe redesign focused on the first ten minutes: a working request before sign-up, error messages that say what to change, and reference pages that load instantly.",
        image: img("6Wkw88YdEewX7DRohHkl5bog", "Dark ribbed tower against a grey sky"),
    },
    {
        title: "Stack",
        tag: "Infrastructure",
        year: "2025",
        excerpt: "Servers, queues and storage in one calm control room instead of twelve browser tabs.",
        body: "Stack brings every part of a production system into one place. Before it, the team on call kept a bookmark folder just to find things.\n\nWe grouped resources by what they serve, not by vendor, and gave each one a plain status line. The busiest screen now fits on a laptop without scrolling.",
        image: img("hHdtsofstKIbMVMeRf04wZgOjk", "Curved high-rise with a warm edge of light at night"),
    },
    {
        title: "Focus",
        tag: "Productivity",
        year: "2025",
        excerpt: "A planner that protects deep work by saying no to the meetings you would have said yes to.",
        body: "Focus reads your calendar and finds the hours that are still yours. Then it guards them, politely declining what can wait.\n\nThe interface is mostly empty on purpose. A single timeline, one colour for focus time and a weekly note on how much of it you actually kept.",
        image: img("jpD6ZiA6ijTJf73dMpNiDIwh8I", "Grid of warm lit windows on a dark facade"),
    },
    {
        title: "Orbit",
        tag: "Mobile App",
        year: "2024",
        excerpt: "A travel companion that keeps tickets, maps and plans in one place, even with no signal.",
        body: "Orbit works best when you need it most: in a station, half awake, with one bar of signal. Everything important is stored on the phone first.\n\nWe designed for one hand and a moving train. Big targets, a single scrolling day, and the next thing you need always at the top.",
        image: img("Rkz63WK1d4h3V7XAVmNnIUQw60", "City lights reflected in a gold glass facade"),
    },
    {
        title: "Hello",
        tag: "Onboarding",
        year: "2024",
        excerpt: "The first five minutes of a product, rewritten so new users stay for the sixth.",
        body: "Hello is the welcome flow for a team chat product. It used to ask eleven questions before showing a single message.\n\nNow it asks two, fills a workspace with real examples and lets people learn by poking around. Activation went up and support tickets about setup went down.",
        image: img("S4OIP9UoWC0Yeu3PhSnE0hM9UQ", "Single glowing window on a dark building"),
    },
]

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)"

// Framer strips image values from array defaults, so fall back to the built-in picture (not for CMS items).
function imageAt(items: Item[], i: number, fallback: boolean): ImageValue | undefined {
    const own = items[i]?.image
    if (own && own.src) return own
    if (!fallback) return undefined
    return DEFAULT_ITEMS[i % DEFAULT_ITEMS.length].image
}

// ---- CMS: reads a hidden Collection List. Layers named Title, Tag, Year, Image, Intro, Body (and an optional link on the item). ----
function readCollection(root: HTMLElement): Item[] {
    const titles = Array.from(root.querySelectorAll<HTMLElement>('[data-framer-name="Title"]'))
    return titles.map((title) => {
        // Climb to the largest ancestor that still holds only this Title: that is the CMS item.
        let card: HTMLElement = title
        while (
            card.parentElement &&
            card.parentElement !== root &&
            card.parentElement.querySelectorAll('[data-framer-name="Title"]').length === 1
        )
            card = card.parentElement
        const layer = (name: string) => card.querySelector<HTMLElement>(`[data-framer-name="${name}"]`)
        const text = (name: string) => layer(name)?.textContent?.trim() || ""
        // Rich text keeps its paragraphs; plain text becomes one paragraph.
        const bodyEl = layer("Body")
        const paras = bodyEl ? Array.from(bodyEl.querySelectorAll("p, h2, h3, h4, li")) : []
        const body = paras.length
            ? paras.map((p) => p.textContent?.trim()).filter(Boolean).join("\n\n")
            : bodyEl?.textContent?.trim() || ""
        const pic =
            card.querySelector<HTMLImageElement>('[data-framer-name="Image"] img') ||
            card.querySelector<HTMLImageElement>("img")
        const src = pic?.getAttribute("src")
        const anchor = card.closest("a") || card.querySelector("a")
        return {
            title: title.textContent?.trim() || "",
            tag: text("Tag"),
            year: text("Year"),
            excerpt: text("Intro"),
            body,
            image: pic && src ? { src, srcSet: pic.getAttribute("srcset") || undefined, alt: pic.alt } : undefined,
            link: anchor?.getAttribute("href") || undefined,
        }
    })
}

function useCmsItems(enabled: boolean, ref: React.RefObject<HTMLDivElement>, slot: React.ReactNode) {
    const [items, setItems] = React.useState<Item[]>([])
    // CMS items only exist after hydration; callers hide until ready so nothing flashes.
    const [ready, setReady] = React.useState(false)
    React.useEffect(() => {
        const root = ref.current
        if (!enabled || !root || typeof MutationObserver === "undefined") return
        let last = ""
        const sync = () => {
            const next = readCollection(root)
            const key = JSON.stringify(next)
            if (key === last) return
            last = key
            setItems(next)
            if (next.length) setReady(true)
        }
        sync()
        // Empty or unconnected list: reveal anyway.
        const reveal = window.setTimeout(() => setReady(true), 1500)
        // We only read inside root, never write, so observing it cannot loop.
        const observer = new MutationObserver(sync)
        observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "srcset", "href"] })
        return () => {
            observer.disconnect()
            window.clearTimeout(reveal)
        }
    }, [enabled, slot])
    return { items, ready }
}

// The connected Collection List only feeds data; it stays in the DOM but out of view and the a11y tree.
function HiddenSlot({ slotRef, children }: { slotRef: React.RefObject<HTMLDivElement>; children: React.ReactNode }) {
    return (
        <div
            ref={slotRef}
            aria-hidden="true"
            style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", visibility: "hidden", pointerEvents: "none" }}
        >
            {children}
        </div>
    )
}

interface Origin {
    // Centre, unrotated size, tilt and corner radius of the card the popup grows out of.
    cx: number
    cy: number
    w: number
    h: number
    angle: number
    radius: number
    el?: HTMLElement
    // Width / height of the card's image, so the hero crops the same way and nothing jumps.
    heroRatio?: number
}

interface ArticleProps {
    item: Item
    pic?: ImageValue
    origin?: Origin
    onClose: () => void
    linkLabel: string
    panel: string
    textColor: string
    accent: string
    backdrop: string
    radius: number
    font?: React.CSSProperties
}

// expo.inOut, the same curve as the List/Grid Flip morph.
const MORPH_EASE = "cubic-bezier(0.87, 0, 0.13, 1)"
const MORPH_MS = 800

// The popup: a centred editorial article, portalled to <body> so no parent transform or overflow can clip it.
// Opening morphs the whole card into the panel: the panel starts scaled, tilted and clipped onto the card's box
// (its image + title read as the card), then grows to full size. Closing runs the same morph backwards.
function Article({ item, pic, origin, onClose, linkLabel, panel, textColor, accent, backdrop, radius, font }: ArticleProps) {
    const dialogRef = React.useRef<HTMLDivElement>(null)
    const panelRef = React.useRef<HTMLElement>(null)
    const closing = React.useRef(false)

    const reduce = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    const morph = (open: boolean, duration: number) => {
        const a = panelRef.current
        if (!a || !origin) return null
        const F = a.getBoundingClientRect()
        const s = origin.w / F.width
        // Show only a card-shaped slice of the panel at the start: its top, scaled to the card width.
        const visible = Math.min(F.height, origin.h / s)
        const ox = F.width / 2
        const oy = visible / 2
        a.style.transformOrigin = `${ox}px ${oy}px`
        const card = {
            transform: `translate(${origin.cx - (F.left + ox)}px, ${origin.cy - (F.top + oy)}px) rotate(${origin.angle}rad) scale(${s})`,
            clipPath: `inset(0px 0px ${F.height - visible}px 0px round ${origin.radius / s}px)`,
        }
        const full = {
            transform: "translate(0px, 0px) rotate(0rad) scale(1)",
            clipPath: `inset(0px 0px 0px 0px round ${radius}px)`,
        }
        return a.animate(open ? [card, full] : [full, card], { duration, easing: MORPH_EASE, fill: "both" })
    }

    const fadeBackdrop = (open: boolean, duration: number) => {
        const clear = { background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }
        const dim = { background: backdrop, backdropFilter: "blur(10px)" }
        dialogRef.current?.animate(open ? [clear, dim] : [dim, clear], { duration, easing: "ease", fill: "both" })
    }

    React.useLayoutEffect(() => {
        dialogRef.current?.focus({ preventScroll: true })
        const d = reduce() ? 0 : MORPH_MS
        fadeBackdrop(true, d * 0.7)
        const anim = morph(true, d)
        // Crossfade card → panel over the first quarter, so the swap never shows as a jump.
        panelRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: anim ? d * 0.25 : d * 0.5, fill: "both" })
        const el = origin?.el
        if (el) {
            el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d * 0.25, fill: "forwards" }).onfinish = () => {
                el.style.opacity = "0"
            }
        }
    }, [])

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
        }
        window.addEventListener("keydown", onKey)
        const overflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = overflow
            if (origin?.el) origin.el.style.opacity = ""
        }
    }, [])

    const close = () => {
        if (closing.current) return
        closing.current = true
        const d = reduce() ? 0 : MORPH_MS
        const a = panelRef.current
        if (a) a.scrollTop = 0
        fadeBackdrop(false, d)
        const anim = morph(false, d)
        const el = origin?.el
        const done = () => {
            if (el) {
                el.getAnimations().forEach((x) => x.cancel())
                el.style.opacity = ""
            }
            onClose()
        }
        if (anim) {
            // Crossfade panel → card over the last quarter, while both sit on the same box.
            const fade = { duration: d, easing: "linear", fill: "forwards" as FillMode }
            a?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], fade)
            if (el) {
                el.getAnimations().forEach((x) => x.cancel())
                el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.75 }, { opacity: 1 }], fade)
            }
            anim.onfinish = done
        }
        else {
            a?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d * 0.4, fill: "forwards" })
            window.setTimeout(done, d * 0.4)
        }
    }

    const paragraphs = (item.body || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    const words = `${item.excerpt || ""} ${item.body || ""}`.split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.round(words / 220))
    const { fontSize: _ignored, ...fontFace } = font || {}
    // Events from a portal still bubble through the React tree; keep them away from the dial behind.
    const stop = (e: React.SyntheticEvent) => e.stopPropagation()

    return createPortal(
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            tabIndex={-1}
            onPointerDown={(e) => {
                e.stopPropagation()
                if (e.target === e.currentTarget) close()
            }}
            onPointerMove={stop}
            onPointerUp={stop}
            onClick={stop}
            onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === "Escape") close()
            }}
            onWheel={stop}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4vh 16px",
                boxSizing: "border-box",
                background: backdrop,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                outline: "none",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                ...fontFace,
            }}
        >
            <article
                ref={panelRef}
                data-lenis-prevent
                style={{
                    position: "relative",
                    width: "min(860px, 100%)",
                    maxHeight: "92vh",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                    overscrollBehavior: "contain",
                    touchAction: "pan-y",
                    background: panel,
                    color: textColor,
                    borderRadius: radius,
                    boxShadow: "0 40px 120px rgba(0,0,0,0.5)",
                }}
            >
                <style>{`.article-close:focus-visible { outline: 2px solid ${textColor}; outline-offset: 3px; }`}</style>
                <button
                    type="button"
                    className="article-close"
                    aria-label="Close"
                    onClick={close}
                    style={{
                        position: "sticky",
                        top: 16,
                        float: "right",
                        marginRight: 16,
                        marginBottom: -56,
                        zIndex: 1,
                        width: 40,
                        height: 40,
                        borderRadius: 40,
                        border: "none",
                        background: "rgba(20,20,20,0.7)",
                        color: textColor,
                        fontSize: 20,
                        lineHeight: "40px",
                        cursor: "pointer",
                        backdropFilter: "blur(6px)",
                    }}
                >
                    ×
                </button>
                {pic && (
                    <img
                        src={pic.src}
                        srcSet={pic.srcSet}
                        alt={pic.alt || item.title}
                        sizes="(max-width: 900px) 100vw, 860px"
                        style={{
                            display: "block",
                            width: "100%",
                            aspectRatio: `${origin?.heroRatio || 16 / 9}`,
                            objectFit: "cover",
                        }}
                    />
                )}
                <div style={{ padding: "clamp(24px, 6vw, 56px)", display: "flex", flexDirection: "column", gap: 24 }}>
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            flexWrap: "wrap",
                            fontSize: 12,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: accent,
                        }}
                    >
                        {item.tag && <span>{item.tag}</span>}
                        {item.year && <span>{item.year}</span>}
                        <span>{minutes} min read</span>
                    </div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "clamp(40px, 7vw, 72px)",
                            lineHeight: 0.95,
                            letterSpacing: "-0.03em",
                            fontWeight: 500,
                        }}
                    >
                        {item.title}
                    </h2>
                    {item.excerpt && (
                        <p style={{ margin: 0, fontSize: "clamp(18px, 2.2vw, 22px)", lineHeight: 1.45, maxWidth: "36ch" }}>
                            {item.excerpt}
                        </p>
                    )}
                    {paragraphs.length > 0 && (
                        <div
                            style={{
                                borderTop: `1px solid ${accent}33`,
                                paddingTop: 24,
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                                maxWidth: "62ch",
                            }}
                        >
                            {paragraphs.map((p, i) => (
                                <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: 1.7, opacity: 0.8 }}>
                                    {p}
                                </p>
                            ))}
                        </div>
                    )}
                    {item.link && (
                        <a
                            href={item.link}
                            style={{
                                alignSelf: "flex-start",
                                marginTop: 8,
                                padding: "12px 20px",
                                borderRadius: 100,
                                background: textColor,
                                color: panel,
                                fontSize: 15,
                                textDecoration: "none",
                            }}
                        >
                            {linkLabel} →
                        </a>
                    )}
                </div>
            </article>
        </div>,
        document.body
    )
}
// ---- end shared ----


/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 480
 */
export default function LensAccordion(props: LensAccordionProps) {
    const {
        source = "items",
        collection,
        popup = true,
        reorder = true,
        linkLabel = "Visit project",
        panel = "#1F1F1F",
        backdrop = "rgba(10, 10, 10, 0.72)",
        items: rawItems = DEFAULT_ITEMS,
        startIndex = 4,
        trigger = "hover",
        autoplay = 0,
        direction = "auto",
        openSize = 8,
        curve = 0,
        gap = 6,
        radius = 0,
        dim = 35,
        showCaption = true,
        showYear = true,
        background = "rgba(0, 0, 0, 0)",
        textColor = "#F4F4F2",
        accent = "#D4D4D0",
        duration = 900,
        ripple = 45,
        font,
    } = props

    const isStatic = useIsStaticRenderer()
    const isCms = source === "cms"
    const cmsRef = React.useRef<HTMLDivElement>(null)
    const cms = useCmsItems(isCms, cmsRef, collection)
    const items = isCms ? cms.items : rawItems.length ? rawItems : DEFAULT_ITEMS
    const [openItem, setOpenItem] = React.useState<number | null>(null)
    const [origin, setOrigin] = React.useState<Origin | undefined>(undefined)
    const clampIndex = (i: number) => Math.min(Math.max(0, items.length - 1), Math.max(0, i))
    const [active, setActive] = React.useState(() => clampIndex(startIndex - 1))
    const [hovering, setHovering] = React.useState(false)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const [narrow, setNarrow] = React.useState(false)

    React.useEffect(() => setActive(clampIndex(startIndex - 1)), [startIndex, items.length])

    // order[position] = item index. Dragging a strip onto another swaps two entries.
    const [order, setOrder] = React.useState<number[]>(() => items.map((_, i) => i))
    React.useEffect(() => setOrder(items.map((_, i) => i)), [items.length, isCms])
    const ord = order.length === items.length ? order : items.map((_, i) => i)
    const stripRefs = React.useRef<Record<number, HTMLButtonElement | null>>({})
    const drag = React.useRef<{ pos: number; idx: number; x: number; y: number; moved: boolean; target: number | null } | null>(null)
    const suppressClick = React.useRef(false)
    const prevRects = React.useRef<Record<number, DOMRect> | null>(null)
    const [flip, setFlip] = React.useState(0)

    // FLIP: after a drop, every strip glides from where it was to its new slot.
    React.useLayoutEffect(() => {
        const before = prevRects.current
        if (!before) return
        prevRects.current = null
        for (const key of Object.keys(before)) {
            const el = stripRefs.current[Number(key)]
            const old = before[Number(key)]
            if (!el || !old) continue
            const now = el.getBoundingClientRect()
            const dx = old.left - now.left
            const dy = old.top - now.top
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
            el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
                duration: 550,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            })
        }
    }, [flip])

    const onRootPointerMove = (e: React.PointerEvent) => {
        const d = drag.current
        if (!d) return
        const el = stripRefs.current[d.idx]
        if (!el) return
        if (!d.moved) {
            if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return
            d.moved = true
            rootRef.current?.setPointerCapture(e.pointerId)
            // Let hit-testing see the strip underneath the one being carried.
            el.style.pointerEvents = "none"
            el.style.zIndex = "3"
            el.style.boxShadow = "0 24px 50px rgba(0,0,0,0.35)"
        }
        el.style.transform = `translate(${e.clientX - d.x}px, ${e.clientY - d.y}px) scale(0.96)`
        const under = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-pos]")
        d.target = under && rootRef.current?.contains(under) ? Number(under.dataset.pos) : null
    }

    const onRootPointerUp = (e: React.PointerEvent) => {
        const d = drag.current
        drag.current = null
        if (!d || !d.moved) return
        if (rootRef.current?.hasPointerCapture(e.pointerId)) rootRef.current.releasePointerCapture(e.pointerId)
        suppressClick.current = true
        const rects: Record<number, DOMRect> = {}
        for (const idx of ord) {
            const el = stripRefs.current[idx]
            if (el) rects[idx] = el.getBoundingClientRect()
        }
        const el = stripRefs.current[d.idx]
        if (el) {
            el.style.transform = ""
            el.style.pointerEvents = ""
            el.style.zIndex = ""
            el.style.boxShadow = ""
        }
        prevRects.current = rects
        const t = d.target
        if (t !== null && t !== d.pos) {
            setOrder(() => {
                const next = ord.slice()
                ;[next[d.pos], next[t]] = [next[t], next[d.pos]]
                return next
            })
            setActive(t)
        }
        setFlip((f) => f + 1)
    }

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(() => setNarrow(root.clientWidth < 640))
        observer.observe(root)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        if (!autoplay || hovering) return
        const id = window.setInterval(() => setActive((i) => (i + 1) % items.length), autoplay * 1000)
        return () => window.clearInterval(id)
    }, [autoplay, hovering, items.length])

    const column = direction === "column" || (direction === "auto" && narrow)
    // Elliptical corners: "curve" px along the strip, half the cross axis, so the edge reads as one arc.
    const bend = `${Math.round(curve * 1.1)}px`
    const lensRadius = column ? `50% / ${bend}` : `${bend} / 50%`
    const flatRadius = `${radius}px / ${radius}px`

    const fontStyle: React.CSSProperties = { ...font }

    return (
        <div
            ref={rootRef}
            role="tablist"
            aria-orientation={column ? "vertical" : "horizontal"}
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            onPointerMove={onRootPointerMove}
            onPointerUp={onRootPointerUp}
            onPointerCancel={onRootPointerUp}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: column ? "column" : "row",
                gap,
                background,
                boxSizing: "border-box",
                opacity: isCms && !cms.ready ? 0 : 1,
                ...fontStyle,
            }}
        >
            {!isStatic && <style>{`
                .lens-strip { transition-property: flex-grow, border-radius; transition-timing-function: ${EASE}; }
                .lens-strip img { transition: transform ${duration}ms ${EASE}, filter ${duration}ms ${EASE}; }
                .lens-cap { transition: opacity ${duration * 0.5}ms ease, transform ${duration * 0.6}ms ${EASE}; }
                .lens-strip:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
                @media (prefers-reduced-motion: reduce) {
                    .lens-strip, .lens-strip img, .lens-cap { transition-duration: 0ms !important; transition-delay: 0ms !important; }
                }
            `}</style>}
            {ord.map((idx, i) => {
                const item = items[idx]
                if (!item) return null
                const open = i === active
                const pic = imageAt(items, idx, !isCms)
                const distance = Math.abs(i - active)
                return (
                    <button
                        key={idx}
                        ref={(el) => {
                            stripRefs.current[idx] = el
                        }}
                        data-pos={i}
                        type="button"
                        className="lens-strip"
                        role="tab"
                        aria-selected={open}
                        aria-label={popup && open ? `Read ${item.title}` : item.title}
                        onPointerEnter={(e: React.PointerEvent) => {
                            if (trigger === "hover" && e.pointerType === "mouse" && !drag.current?.moved) setActive(i)
                        }}
                        onPointerDown={(e: React.PointerEvent) => {
                            if (reorder && e.button === 0)
                                drag.current = { pos: i, idx, x: e.clientX, y: e.clientY, moved: false, target: null }
                        }}
                        onFocus={() => setActive(i)}
                        onClick={(e) => {
                            if (suppressClick.current) {
                                suppressClick.current = false
                                return
                            }
                            // Hover already opened it, so a click reads it; on touch the first tap opens, the second reads.
                            if (popup && (open || trigger === "hover")) {
                                const r = e.currentTarget.getBoundingClientRect()
                                setOrigin({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, angle: 0, radius, el: e.currentTarget })
                                setOpenItem(idx)
                            }
                            setActive(i)
                        }}
                        style={{
                            position: "relative",
                            flexGrow: open ? openSize : 1,
                            flexShrink: 1,
                            flexBasis: 0,
                            minWidth: 0,
                            minHeight: 0,
                            padding: 0,
                            margin: 0,
                            border: "none",
                            overflow: "hidden",
                            cursor: popup && open ? "zoom-in" : "pointer",
                            background: "#1F1F1F",
                            borderRadius: open ? lensRadius : flatRadius,
                            transitionDuration: isStatic ? undefined : `${duration}ms`,
                            // The ripple: strips further from the open one start a little later.
                            transitionDelay: isStatic ? undefined : `${distance * ripple}ms`,
                            color: textColor,
                            textAlign: "left",
                            textDecoration: "none",
                            font: "inherit",
                            WebkitTapHighlightColor: "transparent",
                            touchAction: column ? "pan-x" : "pan-y",
                            userSelect: "none",
                        }}
                    >
                        {pic && (
                            <img
                                src={pic.src}
                                srcSet={pic.srcSet}
                                alt={pic.alt || item.title}
                                draggable={false}
                                sizes="(max-width: 640px) 100vw, 70vw"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transform: open ? "scale(1)" : "scale(1.18)",
                                    filter: open ? "none" : `brightness(${1 - dim / 100}) saturate(0.8)`,
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                        {showCaption && (
                            <div
                                className="lens-cap"
                                aria-hidden={!open}
                                style={{
                                    position: "absolute",
                                    left: column ? "8%" : `calc(${Math.round(curve * 0.55)}px + 4%)`,
                                    bottom: column ? `calc(${Math.round(curve * 0.35)}px + 6%)` : "8%",
                                    right: "8%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                    opacity: open ? 1 : 0,
                                    transform: open ? "translateY(0)" : "translateY(10px)",
                                    transitionDelay: isStatic ? undefined : open ? `${duration * 0.45}ms` : "0ms",
                                    pointerEvents: "none",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.5), 0 2px 18px rgba(0,0,0,0.55)",
                                }}
                            >
                                <span style={{ fontSize: "1.5em", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                                    {item.title}
                                </span>
                                <span style={{ color: accent, fontSize: "0.85em", whiteSpace: "nowrap" }}>
                                    {item.tag}
                                    {showYear && item.year ? ` · ${item.year}` : ""}
                                </span>
                            </div>
                        )}
                    </button>
                )
            })}
            {popup && openItem !== null && items[openItem] && (
                <Article
                    item={items[openItem]}
                    pic={imageAt(items, openItem, !isCms)}
                    origin={origin}
                    onClose={() => setOpenItem(null)}
                    linkLabel={linkLabel}
                    panel={panel}
                    textColor={textColor}
                    accent={accent}
                    backdrop={backdrop}
                    radius={radius}
                    font={font}
                />
            )}
            {isCms && <HiddenSlot slotRef={cmsRef}>{collection}</HiddenSlot>}
        </div>
    )
}

LensAccordion.displayName = "Lens Accordion"

addPropertyControls(LensAccordion, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        description: "Items: edit strips here. CMS: connect a Collection List.",
        options: ["items", "cms"],
        optionTitles: ["Items", "CMS"],
        defaultValue: "items",
        displaySegmentedControl: true,
    },
    collection: {
        type: ControlType.Slot,
        title: "Collection",
        description: "A Collection List whose item has layers named Title, Tag, Year, Image, Intro and Body.",
        maxCount: 1,
        hidden: (p: Partial<LensAccordionProps>) => p.source !== "cms",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        hidden: (p: Partial<LensAccordionProps>) => p.source === "cms",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Project" },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "Category" },
                year: { type: ControlType.String, title: "Year", defaultValue: "2026" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                excerpt: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "" },
                body: {
                    type: ControlType.String,
                    title: "Body",
                    displayTextArea: true,
                    defaultValue: "",
                    description: "Blank line = new paragraph.",
                },
                link: { type: ControlType.Link, title: "Link", description: "Button at the end of the article." },
            },
        },
        defaultValue: DEFAULT_ITEMS.map(({ title, tag, year, excerpt, body }) => ({ title, tag, year, excerpt, body })),
    },
    popup: {
        type: ControlType.Boolean,
        title: "Popup",
        defaultValue: true,
        description: "Click the open strip to read its article.",
    },
    reorder: {
        type: ControlType.Boolean,
        title: "Drag Strips",
        defaultValue: true,
        description: "Drop a strip on another to swap them.",
    },
    linkLabel: {
        type: ControlType.String,
        title: "Link Label",
        defaultValue: "Visit project",
        hidden: (p: Partial<LensAccordionProps>) => !p.popup,
    },
    panel: {
        type: ControlType.Color,
        title: "Panel",
        defaultValue: "#1F1F1F",
        hidden: (p: Partial<LensAccordionProps>) => !p.popup,
    },
    backdrop: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "rgba(10, 10, 10, 0.72)",
        hidden: (p: Partial<LensAccordionProps>) => !p.popup,
    },
    startIndex: {
        type: ControlType.Number,
        title: "Open Strip",
        defaultValue: 4,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        displaySegmentedControl: true,
        defaultValue: "hover",
        description: "Touch screens always use tap.",
    },
    autoplay: {
        type: ControlType.Number,
        title: "Autoplay",
        defaultValue: 0,
        min: 0,
        max: 15,
        step: 0.5,
        unit: "s",
        description: "0 turns it off. Pauses while hovered.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["auto", "row", "column"],
        optionTitles: ["Auto", "Row", "Column"],
        displaySegmentedControl: true,
        defaultValue: "auto",
        description: "Auto stacks the strips below 640px wide.",
    },
    openSize: {
        type: ControlType.Number,
        title: "Open Size",
        defaultValue: 8,
        min: 2,
        max: 20,
        step: 0.5,
        description: "How many closed strips the open one is worth.",
    },
    curve: { type: ControlType.Number, title: "Curve", defaultValue: 0, min: 0, max: 200, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 6, min: 0, max: 40, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 0, min: 0, max: 40, unit: "px" },
    dim: { type: ControlType.Number, title: "Dim Closed", defaultValue: 35, min: 0, max: 90, unit: "%" },
    showCaption: { type: ControlType.Boolean, title: "Caption", defaultValue: true },
    showYear: {
        type: ControlType.Boolean,
        title: "Show Year",
        defaultValue: true,
        hidden: (p: Partial<LensAccordionProps>) => !p.showCaption,
    },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#F4F4F2" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#D4D4D0" },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 900, min: 0, max: 3000, step: 50, unit: "ms" },
    ripple: {
        type: ControlType.Number,
        title: "Ripple",
        defaultValue: 45,
        min: 0,
        max: 200,
        unit: "ms",
        description: "Delay per strip away from the open one.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
