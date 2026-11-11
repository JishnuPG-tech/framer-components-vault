// @framerDisableUnlink
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react"

/**
 * AisolPeekCarousel
 * A snap carousel that lets the next card peek in from the edge.
 * Drag, swipe, arrows, dots, keyboard and optional autoplay. Each card links anywhere,
 * including a CMS detail page.
 *
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 460
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

type ImageValue = { src?: string; srcSet?: string; alt?: string } | string

interface CardItem {
    image?: ImageValue
    imageUrl?: string
    imageAlt?: string
    title?: string
    caption?: string
    badge?: string
    link?: string | { href?: string }
    newTab?: boolean
}

interface FontValue {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
}

type Ratio = "16:9" | "4:3" | "1:1" | "3:4"

interface Props {
    cards?: CardItem[]
    label?: string
    cardsPerView?: number
    peek?: number
    gap?: number
    radius?: number
    aspectRatio?: Ratio
    showArrows?: boolean
    showDots?: boolean
    autoPlay?: boolean
    interval?: number
    loop?: boolean
    accentColor?: string
    cardBackground?: string
    font?: FontValue
    style?: CSSProperties
}

const DEFAULT_CARDS: CardItem[] = [
    {
        title: "Onboarding flow",
        caption: "Three steps, zero friction.",
        badge: "Product",
        imageUrl: "https://framerusercontent.com/images/xJTTP7JmvgZWJSqkpkrT6GNJRA.jpg",
    },
    {
        title: "Design system",
        caption: "Tokens, styles and components in one file.",
        badge: "Design",
        imageUrl: "https://framerusercontent.com/images/JEtcgluh8MysvkrSn9xnDGcrBqg.jpg",
    },
    {
        title: "Field notes",
        caption: "What shipped this month, and why.",
        badge: "Journal",
        imageUrl: "https://framerusercontent.com/images/poT9DJd3ptDBqLAITdYsXaYMqMs.jpg",
    },
    {
        title: "Case study",
        caption: "From idea to launch in six weeks.",
        badge: "Story",
        imageUrl: "https://framerusercontent.com/images/hcjomPnwPONmhVahp1E6AkaSwwI.jpg",
    },
    {
        title: "Changelog",
        caption: "Every release, in order.",
        badge: "Notes",
        imageUrl: "https://framerusercontent.com/images/Vv3BeHqhxoVwTfbh5m1i82GVCJE.jpg",
    },
]

// ControlType.Color can arrive as a token object; unwrap to its value.
function tok(v: unknown, fallback: string): string {
    if (typeof v === "string" && v) return v
    if (v && typeof v === "object" && "value" in v) {
        const inner = (v as { value?: unknown }).value
        if (typeof inner === "string" && inner) return inner
    }
    return fallback
}

function fontFamilyOf(f?: FontValue): string {
    return (f && f.fontFamily) || "Inter, sans-serif"
}

const RATIOS: Record<string, number> = {
    "16:9": 16 / 9,
    "4:3": 4 / 3,
    "1:1": 1,
    "3:4": 3 / 4,
}

// R7 URL guards — one shared implementation across the Aisol catalogue (10/3 r2).
// Browsers ignore tabs, newlines and control characters inside a scheme, so the scheme is tested without them.
const SCHEME = /^([a-z][a-z0-9+.-]*):/i
const flatUrl = (s: string) => s.replace(/[\u0000- \u007f]+/g, "")
// http is lifted to https (the published site is https; the browser would upgrade or block it anyway).
const toHttps = (s: string) => "https:" + s.slice(s.indexOf(":") + 1)
// "//host" (protocol-relative) leaves the site without a visible scheme.
const isProtocolRelative = (flat: string) => /^[\\/]{2}/.test(flat)
// user:pass@host — credentials inside a URL are never passed on.
function hasUserInfo(flat: string): boolean {
    const m = /^[a-z][a-z0-9+.-]*:[\\/]*([^\\/?#]*)/i.exec(flat)
    return !!m && m[1].indexOf("@") >= 0
}
// Links: https, http (lifted to https), mailto, tel and same-site paths (/, #, ?, ./).
// javascript:, data:, protocol-relative //host and user:pass@ URLs → "".
function safeHref(raw: unknown): string {
    const href = String(raw || "").trim()
    const flat = flatUrl(href)
    if (isProtocolRelative(flat)) return ""
    const m = SCHEME.exec(flat)
    if (!m) return href
    const scheme = m[1].toLowerCase()
    if (scheme === "mailto" || scheme === "tel") return href
    if ((scheme !== "https" && scheme !== "http") || hasUserInfo(flat)) return ""
    return scheme === "http" ? toHttps(href) : href
}
// Images: https (framerusercontent.com included), http (lifted), data:image/, blob: and same-site paths.
// Protocol-relative //host, user:pass@ URLs and every other scheme → "".
function safeImageUrl(raw: unknown): string {
    const src = String(raw || "").trim()
    const flat = flatUrl(src)
    if (!flat || isProtocolRelative(flat)) return ""
    const m = SCHEME.exec(flat)
    if (!m) return src
    const scheme = m[1].toLowerCase()
    if (scheme === "blob") return src
    if (scheme === "data") return flat.toLowerCase().startsWith("data:image/") ? src : ""
    if ((scheme !== "https" && scheme !== "http") || hasUserInfo(flat)) return ""
    return scheme === "http" ? toHttps(src) : src
}
// srcSet: every candidate URL goes through safeImageUrl (http candidates are lifted to https) and every
// descriptor must be a plain width/density ("640w", "2x"); one bad candidate drops the whole set.
function safeSrcSet(raw: unknown): string {
    const set = String(raw || "").trim()
    if (!set) return ""
    const parts = set.split(/,\s+/)
    let out = ""
    for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i].trim()
        const cut = part.search(/\s/)
        const url = safeImageUrl(cut < 0 ? part : part.slice(0, cut))
        const descriptor = cut < 0 ? "" : part.slice(cut)
        if (!url || !/^(?:\s+\d+(?:\.\d+)?[wx])?$/.test(descriptor)) return ""
        out += (i ? ", " : "") + url + descriptor
    }
    return out
}

// Image picker first; the legacy "Image URL" string only when the picker is empty. URLs are sanitised here.
function imageOf(card: CardItem): { src: string; srcSet?: string; alt: string } {
    const img = card.image
    const alt = card.imageAlt || (img && typeof img === "object" ? img.alt || "" : "")
    if (typeof img === "string" && img) return { src: safeImageUrl(img), alt }
    if (img && typeof img === "object" && img.src) return { src: safeImageUrl(img.src), srcSet: safeSrcSet(img.srcSet) || undefined, alt }
    return { src: safeImageUrl(card.imageUrl), alt }
}

function linkOf(card: CardItem): string {
    const l = card.link
    if (!l) return ""
    return safeHref(typeof l === "string" ? l : l.href || "")
}

function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
    const n = typeof v === "number" && isFinite(v) ? Math.round(v) : fallback
    return Math.max(lo, Math.min(hi, n))
}

function basisFor(perView: number, peek: number, gap: number) {
    const share = perView + Math.max(0, Math.min(peek, 40)) / 100
    return `calc((100% - ${gap * (perView - 1)}px) / ${share})`
}

function prefersReduced(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
}

interface CardProps {
    card: CardItem
    n: number
    total: number
    basis: string
    ratio: number
    radius: number
    cardBackground: string
    accent: string
    interactive: boolean
    ff: string
}

function Card({ card, n, total, basis, ratio, radius, cardBackground, accent, interactive, ff }: CardProps) {
    const img = imageOf(card)
    const href = interactive ? linkOf(card) : ""
    const innerStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        textDecoration: "none",
        color: "inherit",
        minWidth: 0,
    }
    const body = (
        <>
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: `${100 / ratio}%`,
                    background: "#0E0E14",
                }}
            >
                {img.src ? (
                    <img
                        src={safeImageUrl(img.src)}
                        srcSet={img.srcSet ? safeSrcSet(img.srcSet) : undefined}
                        alt={img.alt}
                        draggable={false}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            userSelect: "none",
                        }}
                    />
                ) : null}
                {card.badge ? (
                    <span
                        style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "rgba(8,8,12,0.72)",
                            border: `1px solid ${accent}`,
                            color: "#F5F5FA",
                            fontFamily: ff,
                            fontSize: 12,
                            lineHeight: 1.4,
                        }}
                    >
                        {card.badge}
                    </span>
                ) : null}
            </div>
            {card.title || card.caption ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        padding: 16,
                        boxSizing: "border-box",
                    }}
                >
                    {card.title ? (
                        <span
                            style={{
                                color: "#F5F5FA",
                                fontFamily: ff,
                                fontSize: 16,
                                fontWeight: 600,
                                lineHeight: 1.3,
                            }}
                        >
                            {card.title}
                        </span>
                    ) : null}
                    {card.caption ? (
                        <span
                            style={{
                                color: "rgba(245,245,250,0.66)",
                                fontFamily: ff,
                                fontSize: 13,
                                lineHeight: 1.45,
                            }}
                        >
                            {card.caption}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </>
    )
    // A link with no visible text and no alt still needs a name.
    const linkName = !card.title && !img.alt ? `Card ${n} of ${total}` : undefined
    return (
        <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${n} of ${total}`}
            style={{
                flex: `0 0 ${basis}`,
                boxSizing: "border-box",
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
                borderRadius: radius,
                overflow: "hidden",
                background: cardBackground,
                border: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            {href ? (
                <a
                    href={safeHref(href)}
                    target={card.newTab ? "_blank" : undefined}
                    rel={card.newTab ? "noopener noreferrer" : undefined}
                    aria-label={linkName}
                    draggable={false}
                    style={innerStyle}
                >
                    {body}
                </a>
            ) : (
                <div style={innerStyle}>{body}</div>
            )}
        </div>
    )
}

function arrowStyle(accent: string, disabled: boolean): CSSProperties {
    return {
        width: 36,
        height: 36,
        boxSizing: "border-box",
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(12,12,18,0.78)",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.10)" : accent}`,
        color: disabled ? "rgba(245,245,250,0.35)" : "#F5F5FA",
        cursor: disabled ? "default" : "pointer",
        padding: 0,
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
    }
}

function Chevron({ dir }: { dir: "left" | "right" }) {
    return (
        <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={dir === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} />
        </svg>
    )
}

const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

type Resolved = {
    list: CardItem[]
    label: string
    peek: number
    gap: number
    radius: number
    showArrows: boolean
    showDots: boolean
    autoPlay: boolean
    interval: number
    loop: boolean
    ratio: number
    accent: string
    cardBg: string
    ff: string
    wanted: number
    regionLabel: string
    shellStyle: CSSProperties
    trackStyle: CSSProperties
}

// Prop defaults and derived values shared by the static and live renderers (no hooks, no DOM).
function resolve(props: Props): Resolved {
    const {
        cards = DEFAULT_CARDS,
        label = "Carousel",
        cardsPerView = 3,
        peek = 14,
        gap = 16,
        radius = 18,
        aspectRatio = "4:3",
        showArrows = true,
        showDots = true,
        autoPlay = false,
        interval = 4,
        loop = true,
        accentColor,
        cardBackground,
        font,
        style,
    } = props

    const list: CardItem[] = Array.isArray(cards) ? cards.filter((c) => c && typeof c === "object") : []
    const ratio = RATIOS[aspectRatio] || 4 / 3
    const accent = tok(accentColor, "#6D5EF6")
    const cardBg = tok(cardBackground, "#141418")
    const ff = fontFamilyOf(font)
    const wanted = clampInt(cardsPerView, 1, 5, 3)
    const regionLabel = label || "Carousel"

    const shellStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        ...style,
    }
    const trackStyle: CSSProperties = {
        position: "relative",
        display: "flex",
        gap,
        width: "100%",
        boxSizing: "border-box",
        overflowX: "auto",
        overflowY: "hidden",
        scrollSnapType: "x mandatory",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x pan-y",
        outline: "none",
    } as CSSProperties

    return { list, label, peek, gap, radius, showArrows, showDots, autoPlay, interval, loop, ratio, accent, cardBg, ff, wanted, regionLabel, shellStyle, trackStyle }
}

// Static renderer (Framer canvas / export): a fully separate plain-DOM component —
// no hooks, no state updates, no listeners, no transitions, no hover rules,
// no keyframes, no rAF/interval/observer.
function AisolPeekCarouselStatic({ r }: { r: Resolved }) {
    const { list, ratio, accent, cardBg, ff, wanted, regionLabel, peek, gap, radius, showArrows, showDots, shellStyle, trackStyle } = r
    const staticBasis = basisFor(wanted, peek, gap)
    const staticPositions = Math.max(1, list.length - wanted + 1)
    return (
        <div style={shellStyle} role="region" aria-roledescription="carousel" aria-label={regionLabel}>
            <div style={{ ...trackStyle, overflowX: "hidden" }}>
                {list.map((card, i) => (
                    <Card
                        key={i}
                        card={card}
                        n={i + 1}
                        total={list.length}
                        basis={staticBasis}
                        ratio={ratio}
                        radius={radius}
                        cardBackground={cardBg}
                        accent={accent}
                        interactive={false}
                        ff={ff}
                    />
                ))}
                {list.length === 0 ? (
                    <span style={{ color: accent, fontFamily: ff, fontSize: 13, padding: 8 }}>
                        Add cards →
                    </span>
                ) : null}
            </div>
            {(showArrows || showDots) && list.length > 0 ? (
                <div style={controlsRowStyle} aria-hidden="true">
                    {showArrows ? (
                        <div style={arrowStyle(accent, true)}>
                            <Chevron dir="left" />
                        </div>
                    ) : (
                        <span style={spacerStyle} />
                    )}
                    {showDots && staticPositions > 1 ? (
                        <div style={dotsRowStyle}>
                            {Array.from({ length: staticPositions }, (_, i) => (
                                <span key={i} style={dotHitStyle}>
                                    <span style={dotStyle(accent, i === 0, false)} />
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span />
                    )}
                    {showArrows ? (
                        <div style={arrowStyle(accent, list.length <= wanted)}>
                            <Chevron dir="right" />
                        </div>
                    ) : (
                        <span style={spacerStyle} />
                    )}
                </div>
            ) : null}
        </div>
    )
}

function AisolPeekCarouselLive({ r }: { r: Resolved }) {
    const { list, ratio, accent, cardBg, ff, wanted, regionLabel, peek, gap, radius, showArrows, showDots, autoPlay, interval, loop, shellStyle, trackStyle } = r

    const rootRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const [perView, setPerView] = useState(wanted)
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const [reduce, setReduce] = useState(false)

    const perViewRef = useRef(perView)
    perViewRef.current = perView

    const basis = basisFor(perView, peek, gap)
    const maxIndex = Math.max(0, list.length - perView)
    const positions = maxIndex + 1

    // Width-based responsive cards per view.
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = (w: number) => {
            const next = w < 560 ? 1 : w < 900 ? Math.min(2, wanted) : wanted
            setPerView(Math.max(1, next))
        }
        apply(el.getBoundingClientRect().width)
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) apply(e.contentRect.width)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [wanted])

    // Keep the index inside the range when cards per view or the card count changes.
    useEffect(() => {
        if (index > maxIndex) setIndex(maxIndex)
    }, [index, maxIndex])

    // Reduced motion: smooth scrolling and dot transitions off.
    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => setReduce(mq.matches)
        on()
        mq.addEventListener("change", on)
        return () => mq.removeEventListener("change", on)
    }, [])

    // While a programmatic scroll runs, scroll events must not rewrite the index.
    const lockRef = useRef<{ left: number; t: number } | null>(null)
    const snapOffRef = useRef(false)
    const snapTimerRef = useRef(0)

    const restoreSnap = useCallback(() => {
        const track = trackRef.current
        if (snapTimerRef.current) {
            window.clearTimeout(snapTimerRef.current)
            snapTimerRef.current = 0
        }
        if (track && snapOffRef.current) {
            snapOffRef.current = false
            track.style.scrollSnapType = "x mandatory"
        }
    }, [])

    const leftOf = (track: HTMLDivElement, i: number) => {
        const child = track.children[i] as HTMLElement | undefined
        if (!child) return null
        const max = Math.max(0, track.scrollWidth - track.clientWidth)
        return Math.max(0, Math.min(max, child.offsetLeft))
    }

    const stepTo = useCallback((i: number, smooth = true) => {
        const track = trackRef.current
        if (!track) return
        const left = leftOf(track, i)
        if (left === null) return
        if (Math.abs(track.scrollLeft - left) < 1) {
            lockRef.current = null
            restoreSnap()
            return
        }
        lockRef.current = { left, t: Date.now() }
        track.scrollTo({ left, behavior: smooth && !prefersReduced() ? "smooth" : "auto" })
    }, [restoreSnap])

    const goTo = useCallback(
        (i: number) => {
            const target = Math.max(0, Math.min(maxIndex, i))
            setIndex(target)
            stepTo(target)
        },
        [maxIndex, stepTo]
    )

    const go = useCallback(
        (delta: number) => {
            const next = index + delta
            const target = loop
                ? next < 0
                    ? maxIndex
                    : next > maxIndex
                      ? 0
                      : next
                : Math.max(0, Math.min(maxIndex, next))
            goTo(target)
        },
        [index, loop, maxIndex, goTo]
    )

    // Scroll position → active index (drag, swipe, trackpad, focus scrolling).
    useEffect(() => {
        const track = trackRef.current
        if (!track) return
        let frame = 0
        const onScroll = () => {
            if (frame) return
            frame = requestAnimationFrame(() => {
                frame = 0
                const x = track.scrollLeft
                const lock = lockRef.current
                if (lock) {
                    if (Math.abs(x - lock.left) > 2 && Date.now() - lock.t < 1200) return
                    lockRef.current = null
                    restoreSnap()
                }
                const children = Array.from(track.children) as HTMLElement[]
                const max = track.scrollWidth - track.clientWidth
                let best = 0
                let bestDist = Infinity
                children.forEach((c, i) => {
                    const d = Math.abs(c.offsetLeft - x)
                    if (d < bestDist) {
                        bestDist = d
                        best = i
                    }
                })
                const cap = Math.max(0, children.length - perViewRef.current)
                if (max > 0 && x >= max - 2) best = cap
                setIndex(Math.min(best, cap))
            })
        }
        track.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            track.removeEventListener("scroll", onScroll)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [list.length, restoreSnap])

    // Autoplay — stops for reduced motion, hover, focus inside and background tabs.
    useEffect(() => {
        if (!autoPlay || paused || reduce || list.length <= perView) return
        const ms = Math.max(1, interval) * 1000
        const id = window.setInterval(() => {
            setIndex((cur) => {
                const next = cur + 1 > maxIndex ? (loop ? 0 : cur) : cur + 1
                stepTo(next)
                return next
            })
        }, ms)
        return () => window.clearInterval(id)
    }, [autoPlay, paused, reduce, interval, maxIndex, loop, list.length, perView, stepTo])

    // Pause reasons are tracked separately; autoplay pauses while any one is true.
    const why = useRef({ hover: false, focus: false, hidden: false })
    const syncPause = useCallback(() => {
        const w = why.current
        setPaused(w.hover || w.focus || w.hidden)
    }, [])

    useEffect(() => {
        const onVis = () => {
            why.current.hidden = document.visibilityState === "hidden"
            syncPause()
        }
        onVis() // the tab can already be in the background at mount
        document.addEventListener("visibilitychange", onVis)
        return () => document.removeEventListener("visibilitychange", onVis)
    }, [syncPause])

    // Keyboard handler kept in a ref so the native listener below always sees fresh state.
    const keyRef = useRef<(e: KeyboardEvent) => void>(() => {})
    keyRef.current = (e: KeyboardEvent) => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return
        if (e.key === "ArrowRight") {
            e.preventDefault()
            go(1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            go(-1)
        } else if (e.key === "Home") {
            e.preventDefault()
            goTo(0)
        } else if (e.key === "End") {
            e.preventDefault()
            goTo(maxIndex)
        }
    }

    // Pointer drag (mouse and pen). Touch uses the browser's own swipe with snapping.
    const drag = useRef({ active: false, id: -1, x: 0, left: 0, v: 0, t: 0, moved: 0 })
    const suppressClick = useRef(false)

    // Native listeners on our own root only. On published Framer sites React's delegated
    // keydown does not reach components, so a JSX onKeyDown prop is not enough.
    useEffect(() => {
        const root = rootRef.current
        const track = trackRef.current
        if (!root) return
        const onKey = (e: KeyboardEvent) => keyRef.current(e)
        const onFocusIn = () => {
            why.current.focus = true
            syncPause()
        }
        const onFocusOut = (e: FocusEvent) => {
            const next = e.relatedTarget as Node | null
            if (next && root.contains(next)) return
            why.current.focus = false
            syncPause()
        }
        const onEnter = () => {
            why.current.hover = true
            syncPause()
        }
        const onLeave = () => {
            why.current.hover = false
            syncPause()
        }
        // A drag that ends on a linked card must not open the link.
        const onClickCapture = (e: MouseEvent) => {
            if (!suppressClick.current) return
            suppressClick.current = false
            e.preventDefault()
            e.stopPropagation()
        }
        root.addEventListener("keydown", onKey)
        root.addEventListener("focusin", onFocusIn)
        root.addEventListener("focusout", onFocusOut)
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("pointerleave", onLeave)
        if (track) track.addEventListener("click", onClickCapture, true)
        return () => {
            root.removeEventListener("keydown", onKey)
            root.removeEventListener("focusin", onFocusIn)
            root.removeEventListener("focusout", onFocusOut)
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("pointerleave", onLeave)
            if (track) track.removeEventListener("click", onClickCapture, true)
            if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current)
        }
    }, [syncPause])

    const atStart = index <= 0
    const atEnd = index >= maxIndex
    const scrollable = list.length > perView
    const prevOff = !scrollable || (!loop && atStart)
    const nextOff = !scrollable || (!loop && atEnd)
    const liveOn = !(autoPlay && !paused && !reduce && scrollable)

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        const track = trackRef.current
        if (!track || e.pointerType === "touch" || e.button !== 0) return
        restoreSnap()
        lockRef.current = null
        drag.current = { active: true, id: e.pointerId, x: e.clientX, left: track.scrollLeft, v: 0, t: Date.now(), moved: 0 }
        suppressClick.current = false
    }
    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const track = trackRef.current
        const d = drag.current
        if (!track || !d.active || e.pointerId !== d.id) return
        const dx = e.clientX - d.x
        if (d.moved <= 5 && Math.abs(dx) > 5) {
            // Real drag starts: capture the pointer so leaving the track does not end it.
            track.setPointerCapture(e.pointerId)
            snapOffRef.current = true
            track.style.scrollSnapType = "none"
        }
        d.moved = Math.max(d.moved, Math.abs(dx))
        if (d.moved <= 5) return
        const now = Date.now()
        const dt = Math.max(1, now - d.t)
        const prevLeft = track.scrollLeft
        track.scrollLeft = d.left - dx
        d.v = 0.8 * ((track.scrollLeft - prevLeft) / dt) + 0.2 * d.v
        d.t = now
    }
    const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
        const track = trackRef.current
        const d = drag.current
        if (!track || !d.active || e.pointerId !== d.id) return
        d.active = false
        if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId)
        if (d.moved <= 5) return
        suppressClick.current = true
        window.setTimeout(() => {
            suppressClick.current = false
        }, 0)
        // Momentum: project the release velocity forward, then settle on the nearest card.
        const idle = Date.now() - d.t > 80
        const projected = track.scrollLeft + (idle ? 0 : d.v * 220)
        const children = Array.from(track.children) as HTMLElement[]
        let best = 0
        let bestDist = Infinity
        children.forEach((c, i) => {
            const dist = Math.abs(c.offsetLeft - projected)
            if (dist < bestDist) {
                bestDist = dist
                best = i
            }
        })
        const target = Math.max(0, Math.min(maxIndex, best))
        setIndex(target)
        stepTo(target)
        snapTimerRef.current = window.setTimeout(restoreSnap, 1300)
    }

    return (
        <div
            ref={rootRef}
            style={shellStyle}
            role="region"
            aria-roledescription="carousel"
            aria-label={regionLabel}
            tabIndex={0}
        >
            <div
                ref={trackRef}
                tabIndex={-1}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onDragStart={(e) => e.preventDefault()}
                style={trackStyle}
            >
                {list.map((card, i) => (
                    <Card
                        key={i}
                        card={card}
                        n={i + 1}
                        total={list.length}
                        basis={basis}
                        ratio={ratio}
                        radius={radius}
                        cardBackground={cardBg}
                        accent={accent}
                        interactive
                        ff={ff}
                    />
                ))}
                {list.length === 0 ? (
                    <span style={{ color: accent, fontFamily: ff, fontSize: 13, padding: 8 }}>
                        Add cards →
                    </span>
                ) : null}
            </div>

            <span aria-live={liveOn ? "polite" : "off"} aria-atomic="true" style={srOnly}>
                {list.length > 0 ? `Slide ${Math.min(index, maxIndex) + 1} of ${positions}` : ""}
            </span>

            {(showArrows || showDots) && list.length > 0 ? (
                <div style={controlsRowStyle}>
                    {showArrows ? (
                        <button
                            type="button"
                            aria-label="Previous slide"
                            disabled={prevOff}
                            onClick={() => go(-1)}
                            style={arrowStyle(accent, prevOff)}
                        >
                            <Chevron dir="left" />
                        </button>
                    ) : (
                        <span style={spacerStyle} />
                    )}

                    {showDots && positions > 1 ? (
                        <div style={dotsRowStyle}>
                            {Array.from({ length: positions }, (_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`Go to slide ${i + 1} of ${positions}`}
                                    aria-current={i === index ? "true" : undefined}
                                    onClick={() => goTo(i)}
                                    style={{ ...dotHitStyle, cursor: "pointer" }}
                                >
                                    <span style={dotStyle(accent, i === index, !reduce)} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span />
                    )}

                    {showArrows ? (
                        <button
                            type="button"
                            aria-label="Next slide"
                            disabled={nextOff}
                            onClick={() => go(1)}
                            style={arrowStyle(accent, nextOff)}
                        >
                            <Chevron dir="right" />
                        </button>
                    ) : (
                        <span style={spacerStyle} />
                    )}
                </div>
            ) : null}
        </div>
    )
}

export default function AisolPeekCarousel(props: Props) {
    const isStatic = useIsStaticRenderer()
    const r = resolve(props)
    return isStatic ? <AisolPeekCarouselStatic r={r} /> : <AisolPeekCarouselLive r={r} />
}

const controlsRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 14,
    boxSizing: "border-box",
}

const dotsRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 0,
    flexWrap: "wrap",
    minWidth: 0,
}

// 24px hit area around the 8px dot.
const dotHitStyle: CSSProperties = {
    width: 24,
    height: 24,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    flexShrink: 0,
    minWidth: 24,
    boxSizing: "content-box",
}

const spacerStyle: CSSProperties = { width: 36, height: 36, flexShrink: 0 }

function dotStyle(accent: string, active: boolean, animated: boolean = true): CSSProperties {
    const base: CSSProperties = {
        display: "block",
        width: active ? 22 : 8,
        height: 8,
        borderRadius: 999,
        background: active ? accent : "rgba(245,245,250,0.28)",
        border: "none",
    }
    // Motion belongs to the live path only; static and reduced motion pass animated=false.
    return animated ? { ...base, transition: "width 200ms ease, background 200ms ease" } : base
}

addPropertyControls(AisolPeekCarousel, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        description: "One entry per card: image, title, caption, badge and link.",
        defaultValue: DEFAULT_CARDS,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "Card image. Used before Image URL (legacy).",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL (legacy)",
                    placeholder: "https://…",
                    description: "Older URL field. Used only when Image is empty.",
                },
                imageAlt: {
                    type: ControlType.String,
                    title: "Image alt",
                    description: "Text for screen readers. Leave empty if the image is decorative.",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card title",
                    description: "Heading under the image.",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    displayTextArea: true,
                    description: "Short text under the title.",
                },
                badge: {
                    type: ControlType.String,
                    title: "Badge",
                    description: "Small label on the image corner.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Page or URL the card opens. Can be a CMS page.",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New tab",
                    defaultValue: false,
                    description: "Open the link in a new tab.",
                },
            },
        },
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Carousel",
        description: "Name of the carousel for screen readers, e.g. Case studies.",
    },
    cardsPerView: {
        type: ControlType.Number,
        title: "Per view",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        description: "Cards fully visible at once. Below 900px wide: 2 at most; below 560px: 1.",
    },
    peek: {
        type: ControlType.Number,
        title: "Peek",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
        unit: "%",
        description: "How much of the next card shows at the edge.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        description: "Space between cards.",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        description: "Card corner radius.",
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Ratio",
        defaultValue: "4:3",
        options: ["16:9", "4:3", "1:1", "3:4"],
        optionTitles: ["16:9", "4:3", "1:1", "3:4"],
        displaySegmentedControl: true,
        description: "Image shape.",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Previous and next buttons.",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "One dot per scroll position.",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Advance on a timer. Pauses on hover, focus, hidden tabs and reduced motion.",
    },
    interval: {
        type: ControlType.Number,
        title: "Every",
        defaultValue: 4,
        min: 1,
        max: 15,
        step: 1,
        unit: "s",
        hidden: (p: Props) => !p.autoPlay,
        description: "Seconds between autoplay steps.",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "Wrap",
        disabledTitle: "Stop",
        description: "Wrap from the last position to the first.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        description: "Font for titles, captions and badges.",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#141418",
        description: "Card background color.",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#6D5EF6",
        description: "Arrow borders, active dot, badge border and empty-state text.",
    },
})
