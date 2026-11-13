import * as React from "react"
import { startTransition, useEffect, useId, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

// Skill Index: skills or services set as a large typographic list.
// The section pins while you scroll. Each scroll step moves the list by one line, the line inside the band
// grows to full size, and only the notes and work for that line change. After the last line the page scrolls on.
// Each line keeps a small shelf of work. Point at a card and it moves out of the shelf and grows.

interface Work {
    image?: { src: string; srcSet?: string; alt?: string }
    title: string
    meta: string
    link?: string
}

interface Item {
    title: string
    text: string
    tags: string
    link?: string
    // work1Image, work1Title, work1Meta, work1Link, and the same for 2 and 3
    [key: string]: any
}

interface Props {
    items: Item[]
    sectionLabel: string
    linkLabel: string
    notesSide: "left" | "right"
    showNumbers: boolean
    showCounter: boolean
    showLines: boolean
    showWork: boolean
    cardsPerItem: number
    bigSize: number
    greyRest: boolean
    dimText: boolean
    sideRows: number
    loop: boolean
    sideScale: number
    spacing: number
    margin: number
    background: string
    titleColor: string
    notesColor: string
    lineColor: string
    titleFont: React.CSSProperties
    notesFont: React.CSSProperties
    scrollPerItem: number
    snap: number
    minHeight: number
    firstItem: number
    style?: React.CSSProperties
}

const img = (id: string) => ({ src: "https://framerusercontent.com/images/" + id + ".jpg" })

const DEFAULT_ITEMS: Item[] = [
    {
        title: "Brand Identity",
        text: "Logos, color and type that make your business easy to spot and easy to trust.",
        tags: "Logo, Color, Guidelines",
        work1Image: img("A4SwNfTiAfLUPzkT8gAKi9Lek8"),
        work1Title: "Morrow Paper",
        work1Meta: "Identity, 2025",
        work2Image: img("ZJ1XkF70ACcIZTwueiFsfLqQfE"),
        work2Title: "Fennel House",
        work2Meta: "Packaging, 2024",
        work3Image: img("uGagKNfgieNbl3ze6EVjUjZc"),
        work3Title: "Second Light",
        work3Meta: "Brand system, 2023",
    },
    {
        title: "Website Design",
        text: "Clear pages that explain what you do and lead people to get in touch.",
        tags: "Landing pages, Full sites, Responsive",
        work1Image: img("x3CAUyh6VEuSLITuMzDEwpxg0"),
        work1Title: "Aria Homes",
        work1Meta: "Marketing site, 2025",
        work2Image: img("c5Eezc3kG6XgOVSIDKTuDrV7Vw"),
        work2Title: "Sofa Theory",
        work2Meta: "Online store, 2024",
        work3Image: img("jwXzOTB4wgxEqUpbm8PzQ1tvQvU"),
        work3Title: "Interior Notes",
        work3Meta: "Editorial site, 2023",
    },
    {
        title: "Product UX",
        text: "Simple flows for apps and dashboards, tested with real people before anything gets built.",
        tags: "Research, Wireframes, Prototypes",
        work1Image: img("leKBhLaUXksYzGPoa1k4ho9Rog"),
        work1Title: "Ledgerly",
        work1Meta: "Dashboard, 2025",
        work2Image: img("gbsKUZZHyEv7UUitn3syYqzS9qw"),
        work2Title: "Current Spaces",
        work2Meta: "Booking flow, 2024",
        work3Image: img("1Dd64IYHZJYElvQMh080myd1XA"),
        work3Title: "North Desk",
        work3Meta: "Team app, 2023",
    },
    {
        title: "Motion Design",
        text: "Small movements and short films that make your product feel alive.",
        tags: "Interactions, Explainers, Social clips",
        work1Image: img("gVLjUeIiLjGUA6uh3DlNHS5oPM"),
        work1Title: "Sip Club",
        work1Meta: "Launch film, 2025",
        work2Image: img("wiyqHgtEASCQU3zB9e9e6Pxo"),
        work2Title: "Afterglow",
        work2Meta: "Campaign loop, 2024",
        work3Image: img("dyF4RDYMCruMtIc8yUN9A8Almg"),
        work3Title: "Night Drive",
        work3Meta: "Title sequence, 2023",
    },
    {
        title: "Framer Development",
        text: "Fast, editable websites built in Framer, with a CMS your team can run on its own.",
        tags: "Framer, CMS, Code components",
        work1Image: img("jHkucfUM7a4wolqOgHiFxqrRio"),
        work1Title: "Oda Portfolio",
        work1Meta: "Framer build, 2025",
        work2Image: img("YqjQXWWPM0L6Sgg94ocnb01s55k"),
        work2Title: "Fold Studio",
        work2Meta: "CMS site, 2024",
        work3Image: img("5bL8w9sGLlqvj7LMsKw79yEU7U"),
        work3Title: "Plain Paper",
        work3Meta: "Code components, 2023",
    },
    {
        title: "SEO and Content",
        text: "Pages and articles written so search engines find you and visitors stay to read.",
        tags: "Keyword plan, Copywriting, Reports",
        work1Image: img("oxBMxYDTdId7wbQADMMKPgzws"),
        work1Title: "Plain Pages",
        work1Meta: "Content plan, 2025",
        work2Image: img("kngtDBLID9heVk3Hrc5ahXsHBbg"),
        work2Title: "Long Read",
        work2Meta: "Magazine, 2024",
        work3Image: img("gbsKUZZHyEv7UUitn3syYqzS9qw"),
        work3Title: "Quiet Rooms",
        work3Meta: "Search rebuild, 2023",
    },
    {
        title: "Art Direction",
        text: "One clear visual idea carried through photos, campaigns and every screen.",
        tags: "Shoots, Campaigns, Style guides",
        work1Image: img("oGswSW4DtjphJk1o3ahIkvy68qA"),
        work1Title: "Rangefinder",
        work1Meta: "Photo series, 2025",
        work2Image: img("5bL8w9sGLlqvj7LMsKw79yEU7U"),
        work2Title: "Linen Week",
        work2Meta: "Campaign, 2024",
        work3Image: img("gVLjUeIiLjGUA6uh3DlNHS5oPM"),
        work3Title: "Sip Club",
        work3Meta: "Set design, 2023",
    },
]

const DEFAULTS = {
    sectionLabel: "What I do",
    linkLabel: "See the work",
    notesSide: "right" as "left" | "right",
    showNumbers: true,
    showCounter: true,
    showLines: true,
    showWork: true,
    cardsPerItem: 3,
    bigSize: 600,
    greyRest: true,
    dimText: true,
    sideRows: 3,
    loop: true,
    sideScale: 0.46,
    spacing: 1,
    margin: 40,
    background: "#FFFFFF",
    titleColor: "#111111",
    notesColor: "#55534F",
    lineColor: "#111111",
    scrollPerItem: 460,
    snap: 0.5,
    minHeight: 560,
    firstItem: 1,
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mod = (v: number, n: number) => ((v % n) + n) % n
const pad = (v: number) => String(v).padStart(2, "0")
const num = (v: unknown, fb: number) => {
    const n = parseFloat(String(v))
    return isNaN(n) ? fb : n
}

// allow only web, mail, phone and relative links
function safeHref(link?: string): string | undefined {
    const s = (link || "").trim()
    if (!s) return undefined
    if (/^(https?:|mailto:|tel:)/i.test(s)) return s
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return undefined
    return s
}

type Geo = { F: number; side: number; sideScale: number; spacing: number; maxT: number }

// where a line sits for a distance d from the band
function linePose(d: number, g: Geo) {
    const t = Math.abs(d)
    const gap = 1.17 * g.sideScale * g.F * g.spacing
    const y = Math.sign(d) * (t <= 1 ? 0.95 * g.F * g.spacing * t : 0.95 * g.F * g.spacing + (t - 1) * gap)
    const scale = t <= 1 ? lerp(1, g.sideScale, t) : Math.max(g.sideScale * 0.65, g.sideScale - 0.04 * (t - 1))
    let opacity = t <= 1 ? lerp(1, 0.42, t) : Math.max(0.14, 0.42 - 0.13 * (t - 1))
    if (t > g.maxT) opacity *= 1 - clamp((t - g.maxT) / 0.7, 0, 1)
    return { y, scale, opacity, z: 1000 - Math.round(t * 100), hidden: t > g.maxT + 0.7 }
}

// in a looping list, the shortest way round to this line
function lineDistance(r: number, pos: number, total: number, loop: boolean) {
    if (!loop) return r - pos
    const d = mod(r - pos, total)
    return d > total / 2 ? d - total : d
}

// the share of a scroll step spent before the first line moves and after the last line lands
const HEAD = 0.2
const TAIL = 0.35

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SkillIndex(props: Props) {
    const p = { ...DEFAULTS, ...props }
    const list = p.items && p.items.length ? p.items : DEFAULT_ITEMS
    const n = list.length
    // the order starts at the chosen item and wraps around
    const first = clamp(Math.round(p.firstItem) - 1, 0, n - 1)
    const items = first ? list.slice(first).concat(list.slice(0, first)) : list
    const isStatic = useIsStaticRenderer()
    const uid = "si" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const notesRef = useRef<HTMLDivElement>(null)
    const rowRefs = useRef<(HTMLElement | null)[]>([])
    const inView = useInView(rootRef, { margin: "200px" })

    const [active, setActive] = useState(0)
    const shown = isStatic ? 0 : Math.min(active, n - 1)
    const [box, setBox] = useState({ w: 1200, h: 760 })
    const [notesH, setNotesH] = useState(240)
    const [shelfOff, setShelfOff] = useState(0)
    const [openCard, setOpenCard] = useState<{ i: number; j: number } | null>(null)
    const openRef = useRef(openCard)
    openRef.current = openCard
    const closeTimer = useRef(0)
    const shelfRef = useRef<HTMLDivElement>(null)
    const [stageH, setStageH] = useState("100vh")
    // how wide the longest title is, in units of its own font size
    const [widest, setWidest] = useState(0)

    // follow the stage's own size
    useEffect(() => {
        const el = stageRef.current
        if (!el) return
        const read = () => {
            const w = el.offsetWidth
            const h = el.offsetHeight
            if (w && h) setBox((b) => (b.w === w && b.h === h ? b : { w, h }))
        }
        read()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // on phones the list centers itself in the space above the notes
    useEffect(() => {
        const el = notesRef.current
        if (!el) return
        const read = () => {
            setNotesH((v) => (v === el.offsetHeight ? v : el.offsetHeight))
            const shelf = shelfRef.current
            if (shelf) setShelfOff((v) => (v === shelf.offsetTop ? v : shelf.offsetTop))
        }
        read()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [p.showWork])

    // 100svh stays still while a phone's address bar slides away
    useEffect(() => {
        if (isStatic) return
        if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("height", "100svh")) setStageH("100svh")
    }, [isStatic])

    const narrow = box.w < 820
    const gutter = Math.min(clamp(p.margin, 0, 120), box.w < 600 ? 20 : box.w < 1000 ? 32 : 999)
    const left = p.showNumbers ? clamp(box.w * 0.034, 24, 52) : 0
    const notesLeft = !narrow && p.notesSide === "left"
    const notesW = Math.min(box.w * 0.31, 400)
    const cardCount = p.showWork ? clamp(Math.round(p.cardsPerItem), 1, 3) : 0
    const shelfW = narrow ? box.w - gutter * 2 : notesW
    const thumbW = (shelfW - 16) / 3
    const thumbH = thumbW * 0.75
    const listX = gutter + left + (notesLeft ? notesW + box.w * 0.05 : 0)
    const wanted = num(p.titleFont && p.titleFont.fontSize, 104)
    const limit = Math.min(wanted, box.w * (narrow ? 0.14 : 0.074))
    const room = box.w - listX - gutter
    // only the longest title can pull the size down, so nothing is ever cut off
    const F = widest > 0 ? Math.min(limit, room / widest) : limit
    const side = clamp(Math.round(p.sideRows), 1, 4)
    // small side lines get hard to read on a phone
    const sideScale = Math.max(clamp(p.sideScale, 0.25, 0.8), narrow ? 0.56 : 0)
    const spacing = clamp(p.spacing, 0.7, 1.5)
    const free = box.h - notesH - 48
    // on a short screen the band moves up so the notes and shelf still fit below it
    const cy = narrow ? Math.max(F, free / 2 + 8) : Math.max(F + 30, Math.min(box.h * 0.47, box.h - notesH - 0.68 * F - 50))
    // on a phone, keep only the lines that fit above the notes
    const fits = Math.floor((free - cy - 0.95 * F * spacing) / (1.17 * sideScale * F * spacing)) + 1
    const geo: Geo = { F, side, sideScale, spacing, maxT: narrow ? clamp(fits, 1, side) : side }
    const bandUp = cy - 0.68 * F
    const bandLow = cy + 0.68 * F
    // where the shelf sits, and where a card goes when it comes out
    const notesTop = narrow ? box.h - 24 - notesH : bandLow + 22
    const shelfX = narrow || notesLeft ? gutter : box.w - gutter - notesW
    const shelfY = notesTop + shelfOff
    const bigW = narrow ? box.w - gutter * 2 : Math.min(box.w * 0.4, clamp(p.bigSize, 240, 900))
    const bigH = bigW * 0.75
    const bigX = narrow ? gutter : notesLeft ? gutter + notesW + 32 : Math.max(gutter, shelfX - 32 - bigW)
    const bigY = narrow ? Math.max(14, (box.h - bigH) / 2 - 40) : Math.max(16, Math.min(cy - bigH / 2 - 10, box.h - bigH - 60))

    // a short list repeats its lines so the page always looks full
    const copies = p.loop ? Math.max(1, Math.ceil((side * 2 + 3) / n)) : 1
    const total = n * copies

    const cfg = useRef({ n, total, geo, loop: p.loop, snap: p.snap })
    cfg.current = { n, total, geo, loop: p.loop, snap: p.snap }
    const applyRef = useRef<() => void>(() => {})

    // measure the longest title once its font has loaded
    const titleKey = items.map((it) => it.title).join("|")
    const fontKey = String(p.titleFont && p.titleFont.fontFamily) + String(p.titleFont && p.titleFont.fontWeight) + String(p.titleFont && p.titleFont.letterSpacing)
    useEffect(() => {
        let alive = true
        const read = () => {
            if (!alive) return
            let max = 0
            for (let r = 0; r < n; r++) {
                const el = rowRefs.current[r]
                const size = el ? parseFloat(el.style.fontSize) : 0
                if (el && size) max = Math.max(max, el.offsetWidth / size)
            }
            if (max) setWidest((v) => (Math.abs(v - max) < 0.005 ? v : max))
        }
        read()
        const fonts = document.fonts
        if (fonts && fonts.ready) fonts.ready.then(read)
        return () => {
            alive = false
        }
    }, [titleKey, fontKey, n, box.w])

    // the live scroll link: read the scroll, ease toward it, write the lines
    useEffect(() => {
        if (isStatic || !inView) return
        const root = rootRef.current
        const stage = stageRef.current
        if (!root || !stage) return
        const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        let raf = 0
        let last = 0
        let pos = -1
        let shownIndex = -1

        const targetFromScroll = () => {
            const c = cfg.current
            const rect = root.getBoundingClientRect()
            const travel = rect.height - stage.offsetHeight
            const prog = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0
            const raw = clamp(prog * (c.n - 1 + HEAD + TAIL) - HEAD, 0, c.n - 1)
            if (reduce) return Math.round(raw)
            // hold on each line for a moment, then move to the next
            const s = clamp(c.snap, 0, 1)
            const h = s * 0.42
            const i = Math.floor(raw)
            const u = clamp((raw - i - h) / (1 - 2 * h), 0, 1)
            return i + lerp(u, u * u * (3 - 2 * u), Math.min(1, s * 2))
        }
        const write = (v: number) => {
            const c = cfg.current
            for (let r = 0; r < c.total; r++) {
                const el = rowRefs.current[r]
                if (!el) continue
                const q = linePose(lineDistance(r, v, c.total, c.loop), c.geo)
                el.style.transform = `translate3d(0,${q.y.toFixed(2)}px,0) scale(${q.scale.toFixed(4)})`
                el.style.visibility = q.hidden && r >= c.n ? "hidden" : "visible"
                el.style.pointerEvents = q.hidden ? "none" : "auto"
                el.style.zIndex = String(q.z)
                const inner = el.firstElementChild as HTMLElement | null
                if (inner) inner.style.opacity = q.opacity.toFixed(3)
            }
            // a card put away the moment the list starts to move
            if (openRef.current && Math.abs(v - Math.round(v)) > 0.04) setOpenCard(null)
        }
        const frame = (now: number) => {
            raf = 0
            const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
            last = now
            const target = targetFromScroll()
            if (pos < 0 || reduce) pos = target
            else pos += (target - pos) * (1 - Math.exp(-dt * 11))
            if (Math.abs(target - pos) < 0.0006) pos = target
            write(pos)
            const a = clamp(Math.round(pos), 0, cfg.current.n - 1)
            if (a !== shownIndex) {
                shownIndex = a
                startTransition(() => setActive(a))
            }
            if (pos !== target) wake()
        }
        const wake = () => {
            if (raf) return
            if (!last || performance.now() - last > 100) last = performance.now()
            raf = requestAnimationFrame(frame)
        }
        applyRef.current = () => {
            if (pos >= 0) write(pos)
            wake()
        }
        window.addEventListener("scroll", wake, { passive: true })
        window.addEventListener("resize", wake, { passive: true })
        wake()
        return () => {
            if (raf) cancelAnimationFrame(raf)
            window.removeEventListener("scroll", wake)
            window.removeEventListener("resize", wake)
            applyRef.current = () => {}
        }
    }, [isStatic, inView])

    useEffect(() => {
        if (!openCard) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenCard(null)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [openCard])
    useEffect(() => () => window.clearTimeout(closeTimer.current), [])

    // new sizes or settings from the panel get placed right away
    useEffect(() => {
        applyRef.current()
    }, [total, F, side, geo.sideScale, geo.spacing, geo.maxT, p.loop])

    // jump the page to the spot where this line sits in the band
    const goTo = (i: number) => {
        const root = rootRef.current
        const stage = stageRef.current
        if (isStatic || !root || !stage) return
        const rect = root.getBoundingClientRect()
        const travel = rect.height - stage.offsetHeight
        const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        window.scrollTo({ top: rect.top + window.scrollY + ((i + HEAD) / (n - 1 + HEAD + TAIL)) * travel, behavior: reduce ? "auto" : "smooth" })
    }

    const scrollLength = (n - 1 + HEAD + TAIL) * clamp(p.scrollPerItem, 100, 2000)
    // a phone screen can be shorter than the set height, and the stage must never be taller than the screen
    const minH = narrow ? Math.min(clamp(p.minHeight, 360, 1400), 480) : clamp(p.minHeight, 360, 1400)
    const notesSize = num(p.notesFont && p.notesFont.fontSize, 17)
    const smallFont: React.CSSProperties = { ...p.notesFont, fontSize: Math.max(12, notesSize * 0.78), lineHeight: 1.25 }
    const softLine = `color-mix(in srgb, ${p.lineColor} 16%, transparent)`

    const opened = !isStatic && openCard && openCard.i === shown ? openCard : null
    const dim: React.CSSProperties = { opacity: opened && p.dimText ? 0.16 : 1, transition: "opacity 0.35s ease" }
    const rows: React.ReactNode[] = []
    for (let r = 0; r < total; r++) {
        const i = r % n
        const it = items[i]
        const q = linePose(lineDistance(r, 0, total, p.loop), geo)
        const isReal = r < n
        const rowStyle: React.CSSProperties = {
            position: "absolute",
            left: listX,
            top: cy - F / 2,
            margin: 0,
            padding: 0,
            border: "none",
            background: "transparent",
            color: p.titleColor,
            textAlign: "left",
            cursor: "pointer",
            whiteSpace: "nowrap",
            lineHeight: 1,
            letterSpacing: "-0.025em",
            ...p.titleFont,
            fontSize: F,
            transformOrigin: "0 50%",
            transform: `translate3d(0,${q.y.toFixed(2)}px,0) scale(${q.scale.toFixed(4)})`,
            visibility: q.hidden && !isReal ? "hidden" : "visible",
            pointerEvents: q.hidden || isStatic ? "none" : "auto",
            zIndex: q.z,
            willChange: isStatic ? undefined : "transform",
            WebkitTapHighlightColor: "transparent",
        }
        const body = (
            <span className={`${uid}-in`} style={{ display: "block", opacity: q.opacity }}>
                {p.showNumbers && (
                    <span
                        aria-hidden="true"
                        style={{ ...p.notesFont, position: "absolute", right: "100%", top: "0.12em", marginRight: "0.32em", fontSize: "0.17em", lineHeight: 1, letterSpacing: 0, fontVariantNumeric: "tabular-nums" }}
                    >
                        {pad(i + 1)}
                    </span>
                )}
                {it.title}
            </span>
        )
        const setRef = (el: HTMLElement | null) => {
            rowRefs.current[r] = el
        }
        rows.push(
            isReal ? (
                <button
                    key={r}
                    ref={setRef}
                    type="button"
                    className={`${uid}-row`}
                    aria-current={shown === i ? "true" : undefined}
                    onClick={() => goTo(i)}
                    onFocus={(e) => {
                        if (e.currentTarget.matches(":focus-visible")) goTo(i)
                    }}
                    style={rowStyle}
                >
                    {body}
                </button>
            ) : (
                <div key={r} ref={setRef} aria-hidden="true" className={`${uid}-row`} onClick={() => goTo(i)} style={rowStyle}>
                    {body}
                </div>
            )
        )
    }

    const label = (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, ...smallFont, color: p.titleColor, ...dim }}>
            <span>{p.sectionLabel}</span>
            {p.showCounter && (
                <span aria-hidden="true" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {pad(shown + 1)} / {pad(n)}
                </span>
            )}
        </div>
    )
    const noteX: React.CSSProperties = notesLeft ? { left: gutter, width: notesW } : { right: gutter, width: notesW }

    const notes = (
        <div
            ref={notesRef}
            role="group"
            aria-label={p.sectionLabel}
            style={
                narrow
                    ? { position: "absolute", zIndex: 1001, left: gutter, right: gutter, bottom: 24, display: "grid", gap: 12 }
                    : { position: "absolute", zIndex: 1001, top: bandLow + 22, ...noteX }
            }
        >
            {narrow && label}
            {/* every item stays in the page; only the notes for the line in the band show */}
            <div style={{ display: "grid", ...dim }}>
                {items.map((it, i) => {
                    const on = i === shown
                    const href = safeHref(it.link)
                    const tags = (it.tags || "").split(",").map((s) => s.trim()).filter(Boolean)
                    return (
                        <div
                            key={i}
                            aria-hidden={on ? undefined : true}
                            style={{
                                gridArea: "1 / 1",
                                minWidth: 0,
                                opacity: on ? 1 : 0,
                                visibility: on ? "visible" : "hidden",
                                transform: on ? "none" : "translateY(10px)",
                                transition: on ? "opacity 0.34s ease 0.14s, transform 0.5s cubic-bezier(0.2,0.7,0.2,1) 0.14s, visibility 0s" : "opacity 0.14s ease, transform 0.2s ease, visibility 0s linear 0.14s",
                            }}
                        >
                            <h3 style={{ position: "absolute", width: 1, height: 1, margin: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{it.title}</h3>
                            <p style={{ margin: 0, color: p.notesColor, lineHeight: 1.5, ...p.notesFont, fontSize: narrow ? Math.min(notesSize, 16) : notesSize }}>{it.text}</p>
                            {tags.length > 0 && narrow && p.showWork && <p style={{ ...smallFont, margin: "8px 0 0", color: p.titleColor }}>{tags.join(", ")}</p>}
                            {tags.length > 0 && !(narrow && p.showWork) && (
                                <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, borderBottom: `1px solid ${softLine}` }}>
                                    {tags.map((t, k) => (
                                        <li key={k} style={{ ...smallFont, display: "flex", justifyContent: "space-between", gap: 12, padding: narrow ? "6px 0" : "8px 0", borderTop: `1px solid ${softLine}`, color: p.titleColor }}>
                                            <span>{t}</span>
                                            <span aria-hidden="true" style={{ color: p.notesColor, fontVariantNumeric: "tabular-nums" }}>
                                                {pad(k + 1)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {href && (
                                <a href={href} aria-label={`${p.linkLabel}: ${it.title}`} style={{ display: "inline-block", marginTop: 14, ...p.notesFont, fontSize: notesSize, color: p.titleColor, textUnderlineOffset: "0.25em" }}>
                                    {p.linkLabel}
                                </a>
                            )}
                        </div>
                    )
                })}
            </div>
            {p.showWork && <div ref={shelfRef} aria-hidden="true" style={{ height: thumbH, marginTop: narrow ? 0 : 16 }} />}
        </div>
    )

    // the link stays at the resting spot and only the picture travels, so a card can't slip out from under the cursor
    const openIt = (i: number, j: number) => {
        window.clearTimeout(closeTimer.current)
        setOpenCard({ i, j })
    }
    const works = cardCount > 0 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1003, pointerEvents: "none" }}>
            {items.map((it, i) => {
                const on = i === shown
                const list3 = [1, 2, 3].slice(0, cardCount).map((k): Work => ({ image: it["work" + k + "Image"], title: it["work" + k + "Title"], meta: it["work" + k + "Meta"], link: it["work" + k + "Link"] }))
                return (
                    <div
                        key={i}
                        data-group={on ? "on" : "off"}
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: on ? 1 : 0,
                            visibility: on ? "visible" : "hidden",
                            transition: on ? "opacity 0.34s ease 0.14s, visibility 0s" : "opacity 0.14s ease, visibility 0s linear 0.14s",
                        }}
                    >
                        {list3.map((w, j) => {
                            const fb = DEFAULT_ITEMS[i % DEFAULT_ITEMS.length]
                            // an item without its own picture yet shows a placeholder until one is added
                            const image = (w.image && w.image.src ? w.image : fb["work" + (j + 1) + "Image"]) as { src: string; srcSet?: string }
                            const name = (w.title ?? fb["work" + (j + 1) + "Title"]) || ""
                            const meta = (w.meta ?? fb["work" + (j + 1) + "Meta"]) || ""
                            const href = safeHref(w.link)
                            const big = !!opened && opened.i === i && opened.j === j
                            const restX = shelfX + j * (thumbW + 8)
                            const tf = big
                                ? `translate3d(${bigX.toFixed(1)}px,${bigY.toFixed(1)}px,0) scale(1)`
                                : `translate3d(${restX.toFixed(1)}px,${shelfY.toFixed(1)}px,0) scale(${(thumbW / bigW).toFixed(4)})`
                            const slotStyle: React.CSSProperties = {
                                position: "absolute",
                                left: restX,
                                top: shelfY,
                                width: thumbW,
                                height: thumbH,
                                zIndex: 40,
                                display: "block",
                                margin: 0,
                                padding: 0,
                                border: "none",
                                background: "transparent",
                                cursor: "zoom-in",
                                pointerEvents: isStatic ? "none" : "auto",
                                // a faint outline marks the spot a card came from
                                boxShadow: big ? `inset 0 0 0 1px ${softLine}` : "none",
                                WebkitTapHighlightColor: "transparent",
                            }
                            const events = {
                                onPointerEnter: (e: React.PointerEvent) => {
                                    if (e.pointerType === "mouse") openIt(i, j)
                                },
                                onPointerLeave: (e: React.PointerEvent) => {
                                    if (e.pointerType !== "mouse") return
                                    window.clearTimeout(closeTimer.current)
                                    closeTimer.current = window.setTimeout(() => setOpenCard(null), 50)
                                },
                                onFocus: (e: React.FocusEvent<HTMLElement>) => {
                                    if (e.currentTarget.matches(":focus-visible")) openIt(i, j)
                                },
                                onBlur: () => setOpenCard(null),
                                onClick: (e: React.MouseEvent) => {
                                    // touch has no hover: the first tap brings the card out, the next one follows its link or puts it back
                                    const hover = typeof window.matchMedia === "function" && window.matchMedia("(hover: hover)").matches
                                    if (hover) return
                                    if (!big) {
                                        e.preventDefault()
                                        openIt(i, j)
                                    } else if (!href) setOpenCard(null)
                                },
                            }
                            const label = [name, meta].filter(Boolean).join(", ") || `${it.title} ${j + 1}`
                            return (
                                <React.Fragment key={j}>
                                    <div
                                        aria-hidden="true"
                                        data-card={big ? "open" : "rest"}
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            width: bigW,
                                            height: bigH,
                                            zIndex: big ? 30 : j + 1,
                                            transformOrigin: "0 0",
                                            transform: tf,
                                            willChange: isStatic ? undefined : "transform",
                                            background: p.background,
                                            pointerEvents: "none",
                                            transition: `transform 0.62s cubic-bezier(0.2,0.85,0.2,1), z-index 0s linear ${big ? "0s" : "0.42s"}`,
                                        }}
                                        className={`${uid}-card`}
                                    >
                                        <img
                                            src={image.src}
                                            srcSet={image.srcSet}
                                            alt=""
                                            draggable={false}
                                            loading="lazy"
                                            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", filter: p.greyRest && !big ? "grayscale(1)" : "none", transition: "filter 0.4s ease" }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                right: 0,
                                                top: "100%",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "baseline",
                                                gap: 16,
                                                paddingTop: 10,
                                                background: p.background,
                                                opacity: big ? 1 : 0,
                                                transition: big ? "opacity 0.3s ease 0.22s" : "opacity 0.18s ease",
                                            }}
                                        >
                                            <span style={{ letterSpacing: "-0.01em", ...p.titleFont, fontSize: narrow ? 21 : 24, lineHeight: 1.2, color: p.titleColor }}>{name}</span>
                                            <span style={{ ...smallFont, whiteSpace: "nowrap", color: p.notesColor }}>{meta}</span>
                                        </div>
                                    </div>
                                    {href ? (
                                        <a data-slot={j} className={`${uid}-slot`} href={href} aria-label={label} style={slotStyle} {...events} />
                                    ) : (
                                        <button data-slot={j} className={`${uid}-slot`} type="button" aria-label={label} style={slotStyle} {...events} />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )

    const lineStyle = (top: number): React.CSSProperties => ({ position: "absolute", left: gutter, right: gutter, top, height: 1, background: p.lineColor, zIndex: 1002, pointerEvents: "none" })
    const css = `.${uid}-row:focus{outline:none}.${uid}-row:focus-visible{outline:2px solid ${p.titleColor};outline-offset:4px}@media (hover:hover){.${uid}-row:hover .${uid}-in{opacity:1 !important}}.${uid}-slot:focus{outline:none}.${uid}-slot:focus-visible{outline:2px solid ${p.titleColor};outline-offset:3px}@media (prefers-reduced-motion: reduce){.${uid}-card,.${uid}-card *{transition:none !important}}`

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: isStatic ? Math.max(minH, narrow ? 860 : 760) : `calc(max(${stageH}, ${minH}px) + ${scrollLength}px)`,
                background: p.background,
                ...p.style,
            }}
        >
            <style>{css}</style>
            <div ref={stageRef} style={{ position: isStatic ? "relative" : "sticky", top: 0, height: isStatic ? "100%" : stageH, minHeight: minH, overflow: "clip" }} onClick={(e) => {
                    if (opened && !(e.target as HTMLElement).closest("[data-slot]")) setOpenCard(null)
                }}>
                <div style={{ position: "absolute", inset: 0, ...dim }}>{rows}</div>
                {p.showLines && <div aria-hidden="true" style={lineStyle(bandUp)} />}
                {p.showLines && <div aria-hidden="true" style={lineStyle(bandLow)} />}
                {!narrow && <div style={{ position: "absolute", zIndex: 1001, top: bandUp - 28, ...noteX }}>{label}</div>}
                {notes}
                {works}
            </div>
            <div role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
                {isStatic ? "" : `${shown + 1} of ${n}: ${items[shown] ? items[shown].title : ""}`}
            </div>
        </div>
    )
}

addPropertyControls(SkillIndex, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 14,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "New Skill" },
                text: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: "Say in a line or two what you do and who it helps." },
                tags: { type: ControlType.String, title: "Tags", defaultValue: "One, Two, Three", description: "Separate with commas." },
                link: { type: ControlType.Link, title: "Link" },
                work1Image: { type: ControlType.ResponsiveImage, title: "Work 1 Image" },
                work1Title: { type: ControlType.String, title: "Work 1 Title", defaultValue: "Project Name" },
                work1Meta: { type: ControlType.String, title: "Work 1 Details", defaultValue: "Type, Year" },
                work1Link: { type: ControlType.Link, title: "Work 1 Link" },
                work2Image: { type: ControlType.ResponsiveImage, title: "Work 2 Image" },
                work2Title: { type: ControlType.String, title: "Work 2 Title", defaultValue: "Project Name" },
                work2Meta: { type: ControlType.String, title: "Work 2 Details", defaultValue: "Type, Year" },
                work2Link: { type: ControlType.Link, title: "Work 2 Link" },
                work3Image: { type: ControlType.ResponsiveImage, title: "Work 3 Image" },
                work3Title: { type: ControlType.String, title: "Work 3 Title", defaultValue: "Project Name" },
                work3Meta: { type: ControlType.String, title: "Work 3 Details", defaultValue: "Type, Year" },
                work3Link: { type: ControlType.Link, title: "Work 3 Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    sectionLabel: { type: ControlType.String, title: "Section Label", defaultValue: DEFAULTS.sectionLabel },
    linkLabel: {
        type: ControlType.String,
        title: "Link Label",
        defaultValue: DEFAULTS.linkLabel,
        hidden: (props: Partial<Props>) => !(props.items || []).some((it) => it && it.link),
    },
    notesSide: { type: ControlType.Enum, title: "Notes Side", options: ["left", "right"], optionTitles: ["Left", "Right"], displaySegmentedControl: true, defaultValue: DEFAULTS.notesSide },
    showNumbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: DEFAULTS.showNumbers },
    showCounter: { type: ControlType.Boolean, title: "Counter", defaultValue: DEFAULTS.showCounter },
    showLines: { type: ControlType.Boolean, title: "Band Lines", defaultValue: DEFAULTS.showLines },
    showWork: { type: ControlType.Boolean, title: "Show Work", defaultValue: DEFAULTS.showWork },
    cardsPerItem: { type: ControlType.Number, title: "Cards", min: 1, max: 3, step: 1, defaultValue: DEFAULTS.cardsPerItem, description: "How many work cards each item shows.", hidden: (props: Partial<Props>) => props.showWork === false },
    bigSize: { type: ControlType.Number, title: "Big Card Width", min: 300, max: 900, step: 10, unit: "px", defaultValue: DEFAULTS.bigSize, hidden: (props: Partial<Props>) => props.showWork === false },
    greyRest: { type: ControlType.Boolean, title: "Grey at Rest", defaultValue: DEFAULTS.greyRest, description: "Cards turn full color when they come out.", hidden: (props: Partial<Props>) => props.showWork === false },
    dimText: { type: ControlType.Boolean, title: "Dim Text", defaultValue: DEFAULTS.dimText, description: "Fades the page text while a card is out.", hidden: (props: Partial<Props>) => props.showWork === false },
    sideRows: { type: ControlType.Number, title: "Side Rows", min: 1, max: 4, step: 1, defaultValue: DEFAULTS.sideRows, description: "Lines shown above and below the band." },
    loop: { type: ControlType.Boolean, title: "Loop Rows", defaultValue: DEFAULTS.loop, description: "Keeps the list full at the first and last item." },
    sideScale: { type: ControlType.Number, title: "Side Size", min: 0.3, max: 0.8, step: 0.01, defaultValue: DEFAULTS.sideScale, description: "Size of the other lines compared to the one in the band." },
    spacing: { type: ControlType.Number, title: "Row Spacing", min: 0.8, max: 1.4, step: 0.01, defaultValue: DEFAULTS.spacing },
    margin: { type: ControlType.Number, title: "Page Margin", min: 0, max: 120, step: 1, unit: "px", defaultValue: DEFAULTS.margin },
    background: { type: ControlType.Color, title: "Background", defaultValue: DEFAULTS.background },
    titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: DEFAULTS.titleColor },
    notesColor: { type: ControlType.Color, title: "Notes Color", defaultValue: DEFAULTS.notesColor },
    lineColor: { type: ControlType.Color, title: "Line Color", defaultValue: DEFAULTS.lineColor },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: { fontSize: 104, letterSpacing: "-0.025em", lineHeight: "1em" },
    },
    notesFont: {
        type: ControlType.Font,
        title: "Notes Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 17, lineHeight: "1.5em", variant: "Regular" },
    },
    scrollPerItem: { type: ControlType.Number, title: "Scroll Per Item", min: 200, max: 1200, step: 10, unit: "px", defaultValue: DEFAULTS.scrollPerItem, description: "How far to scroll to reach the next line." },
    snap: { type: ControlType.Number, title: "Snap", min: 0, max: 1, step: 0.05, defaultValue: DEFAULTS.snap, description: "0 follows the scroll exactly. Higher values hold on each line longer." },
    minHeight: { type: ControlType.Number, title: "Min Height", min: 400, max: 1200, step: 10, unit: "px", defaultValue: DEFAULTS.minHeight },
    firstItem: { type: ControlType.Number, title: "First Item", min: 1, max: 14, step: 1, defaultValue: DEFAULTS.firstItem, description: "The line in the band before scrolling starts. The list carries on from there and wraps around." },
})
