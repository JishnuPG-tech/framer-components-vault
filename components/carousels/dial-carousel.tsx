/**
 * Dial Carousel
 * Creator: Frankie, framer-expert.com
 * 100 Days of Components
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component on the canvas. Edit items, sizes and colors in the property panel.
 * 3. Fonts: pick any font in the Font control. It uses your project's default font until you do.
 *
 * Cards sit on a large circle and turn like a dial: drag the empty space, trackpad-scroll sideways
 * or use the arrow keys. Drag a card onto another card to swap them. Click a card to open its
 * article in a centred popup (Esc or the backdrop closes it).
 * Layout: width and height flex to the frame. Not position fixed, so canvas and published site match.
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

interface DialCarouselProps {
    source: "items" | "cms"
    collection?: React.ReactNode
    items: Item[]
    cardWidth: number
    imageRatio: number
    dialRadius: number
    gap: number
    arcOffset: number
    showTag: boolean
    autoRotate: number
    snap: boolean
    reorder: boolean
    popup: boolean
    linkLabel: string
    cardBackground: string
    textColor: string
    accent: string
    backdrop: string
    cardRadius: number
    imageRadius: number
    padding: number
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

const TAU = Math.PI * 2
const FRICTION = 0.94
const LABEL_HEIGHT = 44
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

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

function sameItems(a: Item[], b: Item[]) {
    return (
        a.length === b.length &&
        a.every((x, i) => {
            const y = b[i]
            return (
                x.title === y.title &&
                x.tag === y.tag &&
                x.year === y.year &&
                x.excerpt === y.excerpt &&
                x.body === y.body &&
                x.link === y.link &&
                x.image?.src === y.image?.src &&
                x.image?.srcSet === y.image?.srcSet &&
                x.image?.alt === y.image?.alt
            )
        })
    )
}

function useCmsItems(enabled: boolean, ref: React.RefObject<HTMLDivElement>, slot: React.ReactNode) {
    const [items, setItems] = React.useState<Item[]>([])
    // CMS items only exist after hydration; callers hide until ready so nothing flashes.
    const [ready, setReady] = React.useState(false)
    React.useEffect(() => {
        const root = ref.current
        if (!enabled || !root || typeof MutationObserver === "undefined") return
        let last: Item[] = []
        let timer = 0
        const sync = () => {
            timer = 0
            const next = readCollection(root)
            if (sameItems(next, last)) return
            last = next
            setItems(next)
            if (next.length) setReady(true)
        }
        // CMS updates arrive as bursts of mutations; read the list once per burst.
        const schedule = () => {
            if (!timer) timer = window.setTimeout(sync, 120)
        }
        sync()
        // Empty or unconnected list: reveal anyway.
        const reveal = window.setTimeout(() => setReady(true), 1500)
        // We only read inside root, never write, so observing it cannot loop.
        const observer = new MutationObserver(schedule)
        observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "srcset", "href"] })
        return () => {
            observer.disconnect()
            window.clearTimeout(reveal)
            window.clearTimeout(timer)
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
                <button
                    type="button"
                    aria-label="Close"
                    data-dial-focus=""
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


const wrapAngle = (a: number) => {
    let x = a % TAU
    if (x > Math.PI) x -= TAU
    if (x < -Math.PI) x += TAU
    return x
}

type Drag =
    | { kind: "spin"; x: number; last: number; t: number; moved: boolean }
    | { kind: "card"; slot: number; x: number; y: number; moved: boolean; ox: number; oy: number }

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 */
export default function DialCarousel(props: DialCarouselProps) {
    const {
        source = "items",
        collection,
        items: rawItems = DEFAULT_ITEMS,
        cardWidth = 380,
        imageRatio = 0.62,
        dialRadius = 1700,
        gap = 72,
        arcOffset = 48,
        showTag = true,
        autoRotate = 2,
        snap = false,
        reorder = true,
        popup = true,
        linkLabel = "Visit project",
        cardBackground = "#1F1F1F",
        textColor = "#F4F4F2",
        accent = "#A3A3A0",
        backdrop = "rgba(10, 10, 10, 0.72)",
        cardRadius = 14,
        imageRadius = 0,
        padding = 10,
        font,
    } = props

    const isCms = source === "cms"
    const cmsRef = React.useRef<HTMLDivElement>(null)
    const cms = useCmsItems(isCms, cmsRef, collection)
    const items = isCms ? (cms.items.length ? cms.items : []) : rawItems.length ? rawItems : DEFAULT_ITEMS
    const n = Math.max(1, items.length)
    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const slotRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const [width, setWidth] = React.useState(1200)
    // order[k] = which item sits in position k; swapping two entries is a drag-and-drop.
    const [order, setOrder] = React.useState<number[]>(() => items.map((_, i) => i))
    const [openItem, setOpenItem] = React.useState<number | null>(null)
    const [origin, setOrigin] = React.useState<Origin | undefined>(undefined)

    React.useEffect(() => setOrder(items.map((_, i) => i)), [n, isCms])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(() => setWidth(root.clientWidth || 1200))
        observer.observe(root)
        return () => observer.disconnect()
    }, [])

    // Phones get a smaller dial so a couple of cards stay in view.
    const scale = Math.min(1, Math.max(0.5, width / 1200))
    const cardW = cardWidth * scale
    const cardH = cardW * imageRatio + padding * 2 + LABEL_HEIGHT * Math.max(0.8, scale)
    // Fill the circle with whole copies of the item list so the loop has no seam,
    // then fit the radius to them so the spacing stays exactly "gap".
    const slotLen = cardW + gap * scale
    const copies = Math.max(1, Math.round((TAU * dialRadius * scale) / slotLen / n))
    const count = n * copies
    const step = TAU / count
    const R = Math.max((count * slotLen) / TAU, cardH)
    const centerY = arcOffset + cardH / 2 + R

    const rotation = React.useRef(0)
    const velocity = React.useRef(0)
    const drag = React.useRef<Drag | null>(null)
    // Set when a drag ends, so the click the browser fires right after is swallowed.
    const suppressClick = React.useRef(false)
    const carried = React.useRef<number | null>(null)
    // Cards dropped off the ring stay where they were let go (centre offset from the dial centre).
    const placed = React.useRef<Record<number, { x: number; y: number }>>({})
    React.useEffect(() => {
        placed.current = {}
    }, [count, R])

    const paint = React.useCallback(() => {
        const rot = rotation.current
        for (let i = 0; i < count; i++) {
            const el = slotRefs.current[i]
            if (!el || i === carried.current || placed.current[i]) continue
            const a = wrapAngle(i * step + rot)
            // Cards below the horizon are skipped.
            const visible = Math.abs(a) < Math.PI / 2
            el.style.visibility = visible ? "visible" : "hidden"
            if (visible) el.style.transform = `rotate(${a}rad) translateY(${-R}px)`
        }
    }, [count, step, R])

    React.useLayoutEffect(paint, [paint, order])

    React.useEffect(() => {
        if (isStatic) return
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        let frame = 0
        let prev = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(64, now - prev) / 1000
            prev = now
            const busy = drag.current?.kind === "spin" || openItem !== null || carried.current !== null
            if (!busy) {
                const v = velocity.current
                if (Math.abs(v) > 0.00005) {
                    rotation.current += v
                    velocity.current = v * FRICTION
                } else if (snap) {
                    const target = Math.round(rotation.current / step) * step
                    rotation.current += (target - rotation.current) * 0.12
                    velocity.current = 0
                } else velocity.current = 0
                if (!snap && !reduce && autoRotate && Math.abs(velocity.current) < 0.002)
                    rotation.current -= ((autoRotate * Math.PI) / 180) * dt
            }
            paint()
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [isStatic, paint, autoRotate, snap, step, openItem])

    // Pointer position relative to the dial centre (top-left origin of the root).
    const local = (e: React.PointerEvent) => {
        const box = rootRef.current!.getBoundingClientRect()
        return { x: e.clientX - box.left - box.width / 2, y: e.clientY - box.top - centerY }
    }

    const onPointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return
        const slotEl = (e.target as HTMLElement).closest<HTMLElement>("[data-slot]")
        velocity.current = 0
        if (slotEl && reorder) {
            const slot = Number(slotEl.dataset.slot)
            // A placed card is picked up where it was grabbed; a dial card centres on the pointer.
            const at = placed.current[slot]
            const p0 = local(e)
            drag.current = {
                kind: "card",
                slot,
                x: e.clientX,
                y: e.clientY,
                moved: false,
                ox: at ? p0.x - at.x : 0,
                oy: at ? p0.y - at.y : 0,
            }
        } else {
            drag.current = { kind: "spin", x: e.clientX, last: e.clientX, t: performance.now(), moved: false }
        }
    }

    const onPointerMove = (e: React.PointerEvent) => {
        const d = drag.current
        if (!d) return
        if (d.kind === "spin") {
            if (!d.moved && Math.abs(e.clientX - d.x) > 5) {
                d.moved = true
                rootRef.current?.setPointerCapture(e.pointerId)
            }
            // Arc length to angle: the card under the pointer follows it.
            const da = (e.clientX - d.last) / (R + cardH / 2)
            rotation.current += da
            velocity.current = da
            d.last = e.clientX
            d.t = performance.now()
            return
        }
        if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) {
            d.moved = true
            carried.current = d.slot
            rootRef.current?.setPointerCapture(e.pointerId)
        }
        if (!d.moved) return
        const el = slotRefs.current[d.slot]
        if (!el) return
        // The carried card leaves the dial, follows the pointer upright and sits on top.
        const p = local(e)
        el.style.transition = "none"
        el.style.zIndex = "5"
        el.style.transform = `translate(${p.x - d.ox}px, ${p.y - d.oy}px) rotate(0rad) scale(1.06)`
        el.style.boxShadow = "0 30px 60px rgba(0,0,0,0.45)"
    }

    const endDrag = (e: React.PointerEvent) => {
        const d = drag.current
        if (!d) return
        drag.current = null
        if (rootRef.current?.hasPointerCapture(e.pointerId)) rootRef.current.releasePointerCapture(e.pointerId)
        suppressClick.current = d.moved
        if (d.kind === "spin") {
            if (performance.now() - d.t > 80) velocity.current = 0
            return
        }
        if (!d.moved) return
        const el = slotRefs.current[d.slot]
        // Which slot is under the drop point? Angle from the dial centre, rotation removed.
        const p = local(e)
        const dist = Math.hypot(p.x, p.y)
        const target = (Math.round((Math.atan2(p.x, -p.y) - rotation.current) / step) % count + count) % count
        // Only a drop on the band of cards itself counts as the ring; anywhere else is open space.
        const onRing = Math.abs(dist - R) < cardH * 0.5
        if (!onRing && el && rootRef.current) {
            // Dropped on open space: the card stays there, upright, kept inside the frame.
            const box = rootRef.current.getBoundingClientRect()
            const halfW = Math.max(0, box.width / 2 - cardW / 2)
            const x = Math.min(halfW, Math.max(-halfW, p.x - d.ox))
            const y = Math.min(box.height - centerY - cardH / 2, Math.max(cardH / 2 - centerY, p.y - d.oy))
            placed.current[d.slot] = { x, y }
            carried.current = null
            el.style.transition = `transform 0.4s ${EASE}, box-shadow 0.4s ${EASE}`
            el.style.transform = `translate(${x}px, ${y}px) rotate(0rad) scale(1)`
            el.style.boxShadow = "0 20px 40px rgba(0,0,0,0.35)"
            el.style.zIndex = "4"
            el.style.visibility = "visible"
            window.setTimeout(() => (el.style.transition = "none"), 420)
            return
        }
        // Back on the ring: it rejoins the dial (and swaps if it landed on another card).
        delete placed.current[d.slot]
        if (onRing && target % n !== d.slot % n) {
            setOrder((o) => {
                const next = o.slice()
                const a = d.slot % n
                const b = target % n
                ;[next[a], next[b]] = [next[b], next[a]]
                return next
            })
        }
        if (el) {
            el.style.transition = `transform 0.55s ${EASE}, box-shadow 0.55s ${EASE}`
            el.style.boxShadow = "none"
            carried.current = null
            paint()
            window.setTimeout(() => {
                el.style.transition = "none"
                el.style.zIndex = ""
            }, 560)
        } else carried.current = null
    }

    const onClickCapture = (e: React.MouseEvent) => {
        if (!suppressClick.current) return
        suppressClick.current = false
        e.preventDefault()
        e.stopPropagation()
    }

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        // Sideways trackpad scroll turns the dial; vertical scroll stays with the page.
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
            e.preventDefault()
            velocity.current = -e.deltaX / (R + cardH / 2) / 4
            rotation.current += velocity.current
        }
        root.addEventListener("wheel", onWheel, { passive: false })
        return () => root.removeEventListener("wheel", onWheel)
    }, [isStatic, R, cardH])

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
        e.preventDefault()
        // A velocity kick of one step's worth, summed over the friction series.
        velocity.current = (e.key === "ArrowLeft" ? 1 : -1) * step * (1 - FRICTION)
    }

    // The popup grows out of the whole card: hand it the card's centre, size, tilt and radius.
    const openAt = (card: HTMLElement, slotIndex: number, index: number) => {
        const r = card.getBoundingClientRect()
        setOrigin({
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            w: card.offsetWidth,
            h: card.offsetHeight,
            angle: placed.current[slotIndex] ? 0 : wrapAngle(slotIndex * step + rotation.current),
            radius: cardRadius,
            el: card,
            heroRatio: 1 / imageRatio,
        })
        setOpenItem(index)
    }

    const fontStyle: React.CSSProperties = { fontSize: Math.max(13, 17 * scale), ...font }

    return (
        <div
            ref={rootRef}
            role="region"
            data-dial-focus="inset"
            aria-roledescription="carousel"
            aria-label="Dial carousel"
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={onClickCapture}
            onKeyDown={onKeyDown}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: "grab",
                opacity: isCms && !cms.ready ? 0 : 1,
            }}
        >
            {/* Keyboard focus ring only; mouse and touch clicks stay clean. */}
            <style>{`[data-dial-focus]:focus{outline:none}[data-dial-focus]:focus-visible{outline:2px solid ${textColor};outline-offset:3px}[data-dial-focus="inset"]:focus-visible{outline-offset:-3px}`}</style>
            {items.length > 0 && Array.from({ length: count }, (_, i) => {
                const index = order[i % n] ?? i % n
                const item = items[index]
                if (!item) return null
                const pic = imageAt(items, index, !isCms)
                return (
                    <div
                        key={i}
                        data-slot={i}
                        ref={(el) => {
                            slotRefs.current[i] = el
                        }}
                        data-dial-focus=""
                        role={popup ? "button" : undefined}
                        aria-label={popup ? `Open ${item.title}` : undefined}
                        aria-hidden={i >= n ? true : undefined}
                        tabIndex={popup && i < n ? 0 : -1}
                        onClick={(e) => popup && openAt(e.currentTarget, i, index)}
                        onKeyDown={(e) => {
                            if (popup && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault()
                                openAt(e.currentTarget, i, index)
                            }
                        }}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: centerY,
                            width: cardW,
                            height: cardH,
                            marginLeft: -cardW / 2,
                            marginTop: -cardH / 2,
                            boxSizing: "border-box",
                            padding,
                            display: "flex",
                            flexDirection: "column",
                            background: cardBackground,
                            borderRadius: cardRadius,
                            color: textColor,
                            visibility: "hidden",
                            willChange: "transform",
                            cursor: reorder ? "grab" : popup ? "pointer" : "inherit",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: `${1 / imageRatio}`,
                                borderRadius: imageRadius,
                                overflow: "hidden",
                                background: "rgba(255,255,255,0.04)",
                            }}
                        >
                            {pic && (
                                <img
                                    src={pic.src}
                                    srcSet={pic.srcSet}
                                    alt={pic.alt || item.title}
                                    draggable={false}
                                    sizes={`${Math.round(cardW)}px`}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: `0 ${Math.max(4, padding - 2)}px`,
                                lineHeight: 1.2,
                                ...fontStyle,
                            }}
                        >
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.title}
                            </span>
                            {showTag && item.tag && (
                                <span style={{ color: accent, fontSize: "0.75em", whiteSpace: "nowrap" }}>
                                    {item.tag}
                                </span>
                            )}
                        </div>
                    </div>
                )
            })}
            {popup && openItem !== null && items[openItem] && (
                <Article
                    item={items[openItem]}
                    pic={imageAt(items, openItem, !isCms)}
                    origin={origin}
                    onClose={() => setOpenItem(null)}
                    linkLabel={linkLabel}
                    panel={cardBackground}
                    textColor={textColor}
                    accent={accent}
                    backdrop={backdrop}
                    radius={cardRadius}
                    font={font}
                />
            )}
            {isCms && <HiddenSlot slotRef={cmsRef}>{collection}</HiddenSlot>}
        </div>
    )
}

DialCarousel.displayName = "Dial Carousel"

addPropertyControls(DialCarousel, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        description: "Items: edit cards here. CMS: connect a Collection List.",
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
        hidden: (p: Partial<DialCarouselProps>) => p.source !== "cms",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        hidden: (p: Partial<DialCarouselProps>) => p.source === "cms",
        maxCount: 24,
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
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS.map(({ title, tag, year, excerpt, body }) => ({ title, tag, year, excerpt, body })),
    },
    popup: {
        type: ControlType.Boolean,
        title: "Popup",
        defaultValue: true,
        description: "Click a card to open its article.",
    },
    linkLabel: {
        type: ControlType.String,
        title: "Link Label",
        defaultValue: "Visit project",
        hidden: (p: Partial<DialCarouselProps>) => !p.popup,
    },
    reorder: {
        type: ControlType.Boolean,
        title: "Drag Cards",
        defaultValue: true,
        description: "Drop a card anywhere to leave it there, on another card to swap, or back on the ring to return it. Drag the empty space to spin.",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 380,
        min: 160,
        max: 800,
        step: 10,
        unit: "px",
        description: "Scales down on screens narrower than 1200px.",
    },
    imageRatio: {
        type: ControlType.Number,
        title: "Image Ratio",
        defaultValue: 0.62,
        min: 0.4,
        max: 1.5,
        step: 0.01,
        description: "Image height divided by width.",
    },
    dialRadius: {
        type: ControlType.Number,
        title: "Dial Radius",
        defaultValue: 1700,
        min: 400,
        max: 4000,
        step: 50,
        unit: "px",
        description: "Bigger = flatter arc. Rounded so the cards close the circle.",
    },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 72, min: 0, max: 400, unit: "px" },
    arcOffset: { type: ControlType.Number, title: "Top Offset", defaultValue: 48, min: -400, max: 600, unit: "px" },
    showTag: { type: ControlType.Boolean, title: "Show Tag", defaultValue: true },
    autoRotate: {
        type: ControlType.Number,
        title: "Auto Rotate",
        defaultValue: 2,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "°/s",
        description: "0 turns it off. Paused while dragging, with the popup open and with reduced motion.",
    },
    snap: {
        type: ControlType.Boolean,
        title: "Snap",
        defaultValue: false,
        description: "Settle on the nearest card. Turns off auto rotate.",
    },
    cardBackground: { type: ControlType.Color, title: "Card", defaultValue: "#1F1F1F" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#F4F4F2" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A3A3A0" },
    backdrop: { type: ControlType.Color, title: "Backdrop", defaultValue: "rgba(10, 10, 10, 0.72)" },
    cardRadius: { type: ControlType.Number, title: "Card Radius", defaultValue: 14, min: 0, max: 60, unit: "px" },
    imageRadius: { type: ControlType.Number, title: "Image Radius", defaultValue: 0, min: 0, max: 60, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 10, min: 0, max: 40, unit: "px" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
