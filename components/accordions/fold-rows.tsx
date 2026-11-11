import { useEffect, useId, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Fold Rows — by H SHIFT WORKS (https://hshiftworks.com)
// Rows that open and close: FAQs, services, steps or price details.
// - One open at a time, or several. Choose which row starts open.
// - Each row can have a number, a picture and a link. Plus, chevron, arrow or no icon.
// - The height opens smoothly with no jumps. Visitors who turn off motion get no animation.
// - Keyboard: Tab to a row, Enter or Space opens it, ↑ ↓ Home End move between rows.
//   Screen readers hear each row as a button that says whether it is open.
// - Links like yoursite.com/faq#shipping open the row whose title is "Shipping" (and scroll to it).
// - Optional FAQ data for search engines (schema.org FAQPage).
// - Open style "Shift" adds an outline moved down and right behind the open row.

type Icon = "plus" | "chevron" | "arrow" | "none"
type Mode = "one" | "many"
type Look = "lines" | "cards"
type OpenStyle = "none" | "fill" | "shift"
type Tag = "h2" | "h3" | "h4" | "div"
type FontStyle = React.CSSProperties

interface Item {
    title: string
    body: string
    image?: { src: string; srcSet?: string; alt?: string }
    linkLabel?: string
    link?: string
}

interface FoldRowsProps {
    items: Item[]
    mode: Mode
    openFirst: number
    numbers: boolean
    icon: Icon
    tag: Tag
    look: Look
    openStyle: OpenStyle
    titleFont?: FontStyle
    bodyFont?: FontStyle
    numberFont?: FontStyle
    textColor: string
    mutedColor: string
    lineColor: string
    accent: string
    cardColor: string
    openColor: string
    gap: number
    padding: number
    radius: number
    imageRatio: number
    duration: number
    hashLinks: boolean
    faqData: boolean
    canvasOpen: number
    style?: React.CSSProperties
}

const FALLBACK_TITLE: FontStyle = { fontSize: 22, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.02em" }
const FALLBACK_BODY: FontStyle = { fontSize: 16, fontWeight: 400, lineHeight: 1.6, letterSpacing: "0em" }
const FALLBACK_NUMBER: FontStyle = { fontSize: 13, fontWeight: 500, lineHeight: 1, letterSpacing: "0.04em" }
const withFallback = (f: FontStyle | undefined, fallback: FontStyle): FontStyle => (f && f.fontSize ? f : { ...fallback, ...f })
const EASE = "cubic-bezier(.2,.7,.2,1)"

const slugify = (s: string) =>
    s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)

function IconMark({ kind, open, color, ms }: { kind: Icon; open: boolean; color: string; ms: number }) {
    if (kind === "none") return null
    const t = `transform ${ms}ms ${EASE}`
    const box: React.CSSProperties = { width: 20, height: 20, flex: "0 0 20px", position: "relative", color }
    if (kind === "plus")
        return (
            <span aria-hidden style={box}>
                <span style={{ position: "absolute", left: 3, right: 3, top: 9, height: 2, background: "currentColor", borderRadius: 1 }} />
                <span style={{ position: "absolute", top: 3, bottom: 3, left: 9, width: 2, background: "currentColor", borderRadius: 1, transition: t, transform: open ? "scaleY(0)" : "none" }} />
            </span>
        )
    const path = kind === "chevron" ? "M5 8l5 5 5-5" : "M4 10h12M11 5l5 5-5 5"
    const turn = kind === "chevron" ? "rotate(180deg)" : "rotate(90deg)"
    return (
        <span aria-hidden style={box}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ transition: t, transform: open ? turn : "none" }}>
                <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    )
}

/** Body text: a blank line starts a new paragraph, a single line break stays a line break. */
function Paragraphs({ text, style }: { text: string; style: React.CSSProperties }) {
    const parts = (text || "").split(/\n\s*\n/)
    return (
        <>
            {parts.map((p, i) => (
                <p key={i} style={{ ...style, margin: i ? "0.8em 0 0" : 0, whiteSpace: "pre-line" }}>
                    {p.trim()}
                </p>
            ))}
        </>
    )
}

export default function FoldRows(props: FoldRowsProps) {
    const {
        items, mode, openFirst, numbers, icon, tag, look, openStyle, textColor, mutedColor, lineColor, accent,
        cardColor, openColor, gap, padding, radius, imageRatio, duration, hashLinks, faqData, canvasOpen,
    } = props
    const list = items && items.length ? items : []
    const isStatic = useIsStaticRenderer()
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const baseId = "fr" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const slugs = useMemo(() => {
        const used = new Map<string, number>()
        return list.map((it, i) => {
            const s = slugify(it.title || "") || `item-${i + 1}`
            const n = used.get(s) ?? 0
            used.set(s, n + 1)
            return n ? `${s}-${n + 1}` : s
        })
    }, [list])

    const start = onCanvas ? canvasOpen : openFirst
    const [open, setOpen] = useState<number[]>(() => (start > 0 && start <= list.length ? [start - 1] : []))
    useEffect(() => {
        if (onCanvas) setOpen(canvasOpen > 0 && canvasOpen <= list.length ? [canvasOpen - 1] : [])
    }, [onCanvas, canvasOpen, list.length])

    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (isStatic || onCanvas || typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const set = () => setReduced(mq.matches)
        set()
        mq.addEventListener?.("change", set)
        return () => mq.removeEventListener?.("change", set)
    }, [isStatic, onCanvas])
    const ms = isStatic || onCanvas || reduced ? 0 : Math.max(0, duration * 1000)

    // yoursite.com/page#row-title opens that row.
    const rowRefs = useRef<(HTMLDivElement | null)[]>([])
    useEffect(() => {
        if (!hashLinks || isStatic || onCanvas || typeof window === "undefined") return
        const fromHash = () => {
            const h = decodeURIComponent(window.location.hash.slice(1))
            const i = slugs.indexOf(h)
            if (i < 0) return
            setOpen((o) => (mode === "one" ? [i] : o.includes(i) ? o : [...o, i]))
            requestAnimationFrame(() => rowRefs.current[i]?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" }))
        }
        fromHash()
        window.addEventListener("hashchange", fromHash)
        return () => window.removeEventListener("hashchange", fromHash)
    }, [hashLinks, isStatic, onCanvas, slugs, mode, reduced])

    const toggle = (i: number) => {
        if (onCanvas) return
        setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : mode === "one" ? [i] : [...o, i]))
    }

    const buttons = useRef<(HTMLButtonElement | null)[]>([])
    const onKey = (e: React.KeyboardEvent, i: number) => {
        const last = list.length - 1
        const go = { ArrowDown: i === last ? 0 : i + 1, ArrowUp: i === 0 ? last : i - 1, Home: 0, End: last }[e.key]
        if (go === undefined) return
        e.preventDefault()
        buttons.current[go]?.focus()
    }

    const titleFont = withFallback(props.titleFont, FALLBACK_TITLE)
    const bodyFont = withFallback(props.bodyFont, FALLBACK_BODY)
    const numberFont = withFallback(props.numberFont, FALLBACK_NUMBER)
    const cards = look === "cards"
    const Heading = (tag === "div" ? "div" : tag) as React.ElementType

    const faq = useMemo(() => {
        if (!faqData || !list.length) return null
        return JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: list.map((it) => ({ "@type": "Question", name: it.title, acceptedAnswer: { "@type": "Answer", text: it.body } })),
        })
    }, [faqData, list])

    if (!list.length)
        return (
            <div style={{ ...props.style, padding: 24, border: `1px dashed ${lineColor}`, color: mutedColor, fontSize: 14 }}>
                Add rows in the right panel.
            </div>
        )

    return (
        <div className={`fr-${baseId}`} style={{ ...props.style, width: "100%", display: "flex", flexDirection: "column", gap: cards ? gap : 0, color: textColor, ...({ containerType: "inline-size" } as React.CSSProperties) }}>
            {/* Narrow (phones): the text starts under the number instead of under the title, so lines stay long. */}
            {numbers && <style>{`@container (max-width: 520px) { .fr-${baseId} .fr-body { padding-left: var(--fr-inset) !important } }`}</style>}
            {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq }} />}
            {list.map((it, i) => {
                const isOpen = open.includes(i)
                const id = `${baseId}-${i}`
                const shift = openStyle === "shift" && isOpen
                // Shift: the open row gets a fill so the moved outline only shows outside it.
                const fill = (openStyle === "fill" || openStyle === "shift") && isOpen
                const rowStyle: React.CSSProperties = cards
                    ? { position: "relative", zIndex: 1, background: fill ? openColor : cardColor, borderRadius: radius, border: `1px solid ${lineColor}`, transition: `background ${ms}ms` }
                    : { position: "relative", zIndex: 1, borderTop: i === 0 ? `1px solid ${lineColor}` : undefined, borderBottom: `1px solid ${lineColor}`, background: fill ? openColor : "transparent", transition: `background ${ms}ms` }
                const pad = cards ? padding : Math.round(padding * 0.75)
                // Rows with a fill keep side padding open or closed, so the title never moves.
                const inset = cards || openStyle !== "none"
                return (
                    <div key={i} ref={(el) => { rowRefs.current[i] = el }} id={hashLinks ? slugs[i] : undefined}
                        style={{ position: "relative", isolation: "isolate", scrollMarginTop: 96, zIndex: shift ? 1 : undefined }}>
                        {openStyle === "shift" && (
                            <span aria-hidden style={{
                                position: "absolute", inset: 0, transform: shift ? "translate(8px, 8px)" : "translate(0, 0)", opacity: shift ? 1 : 0,
                                border: `2px solid ${accent}`, borderRadius: cards ? radius : 0, pointerEvents: "none",
                                transition: `transform ${ms}ms ${EASE}, opacity ${ms}ms`,
                            }} />
                        )}
                    <div style={rowStyle}>
                        <Heading style={{ margin: 0, font: "inherit" }}>
                            <button
                                ref={(el) => { buttons.current[i] = el }}
                                type="button"
                                id={`${id}-b`}
                                aria-expanded={isOpen}
                                aria-controls={`${id}-p`}
                                onClick={() => toggle(i)}
                                onKeyDown={(e) => onKey(e, i)}
                                style={{
                                    all: "unset", boxSizing: "border-box", width: "100%", cursor: onCanvas ? "default" : "pointer",
                                    display: "flex", alignItems: "center", gap: 16, padding: inset ? `${pad}px` : `${pad}px 0`,
                                    color: textColor, outlineOffset: 2,
                                }}
                            >
                                {numbers && <span style={{ ...numberFont, width: 28, flex: "0 0 28px", color: isOpen ? accent : mutedColor, fontVariantNumeric: "tabular-nums", transition: `color ${ms}ms` }}>{String(i + 1).padStart(2, "0")}</span>}
                                <span style={{ ...titleFont, flex: 1, minWidth: 0 }}>{it.title}</span>
                                <IconMark kind={icon} open={isOpen} color={isOpen ? accent : textColor} ms={ms} />
                            </button>
                        </Heading>
                        <div
                            id={`${id}-p`}
                            role="region"
                            aria-labelledby={`${id}-b`}
                            // Closed rows stay in the page for search engines but are hidden from keyboard and screen readers.
                            ref={(el) => { if (el) (el as HTMLElement & { inert: boolean }).inert = !isOpen }}
                            aria-hidden={!isOpen}
                            style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: `grid-template-rows ${ms}ms ${EASE}` }}
                        >
                            <div style={{ overflow: "hidden", minHeight: 0 }}>
                                <div className="fr-body" style={{
                                    ["--fr-inset" as string]: `${inset ? pad : 0}px`,
                                    display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start",
                                    padding: inset ? `0 ${pad}px ${pad}px` : `0 0 ${pad}px`,
                                    paddingLeft: (inset ? pad : 0) + (numbers ? 16 + 28 : 0),
                                    opacity: isOpen ? 1 : 0, transition: `opacity ${ms}ms`,
                                }}>
                                    <div style={{ flex: "1 1 280px", minWidth: 0, color: mutedColor }}>
                                        <Paragraphs text={it.body} style={bodyFont} />
                                        {it.link && (
                                            <a href={it.link} style={{ ...bodyFont, display: "inline-block", marginTop: "0.9em", color: accent, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
                                                {it.linkLabel || "Learn more"} →
                                            </a>
                                        )}
                                    </div>
                                    {it.image?.src && (
                                        <img src={it.image.src} srcSet={it.image.srcSet} alt={it.image.alt || ""} loading="lazy"
                                            style={{ flex: "0 1 260px", width: 260, maxWidth: "100%", aspectRatio: String(imageRatio || 1.5), objectFit: "cover", borderRadius: Math.max(0, radius - 6), display: "block" }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                )
            })}
        </div>
    )
}

FoldRows.displayName = "Fold Rows"

const DEFAULT_ITEMS: Item[] = [
    { title: "How long does a project take?", body: "Most sites take two to four weeks, from the first call to launch.\n\nWe agree on the dates before we start." },
    { title: "What do you need from me?", body: "Your logo, the text for each page and any photos you want to use. We can help with the text if you have none yet." },
    { title: "Can I edit the site myself?", body: "Yes. Everything is built in Framer, so you can change text and pictures without code." },
    { title: "Do you offer support after launch?", body: "Every project includes 30 days of small fixes after launch." },
]

addPropertyControls(FoldRows, {
    items: {
        type: ControlType.Array,
        title: "Rows",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Question" },
                body: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: "Answer" },
                image: { type: ControlType.ResponsiveImage, title: "Picture" },
                linkLabel: { type: ControlType.String, title: "Link text", placeholder: "Learn more" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    mode: { type: ControlType.Enum, title: "Open", options: ["one", "many"], optionTitles: ["One at a time", "Several"], displaySegmentedControl: true, defaultValue: "one" },
    openFirst: { type: ControlType.Number, title: "Start open", min: 0, max: 50, step: 1, displayStepper: true, defaultValue: 1, description: "Row number open on load. 0: all closed." },
    numbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: true },
    icon: { type: ControlType.Enum, title: "Icon", options: ["plus", "chevron", "arrow", "none"], optionTitles: ["Plus", "Chevron", "Arrow", "None"], defaultValue: "plus" },
    tag: { type: ControlType.Enum, title: "Title tag", options: ["h2", "h3", "h4", "div"], optionTitles: ["H2", "H3", "H4", "None"], defaultValue: "h3" },
    look: { type: ControlType.Enum, title: "Look", options: ["lines", "cards"], optionTitles: ["Lines", "Cards"], displaySegmentedControl: true, defaultValue: "lines" },
    openStyle: { type: ControlType.Enum, title: "Open row", options: ["none", "fill", "shift"], optionTitles: ["Plain", "Fill", "Shift"], displaySegmentedControl: true, defaultValue: "none" },
    titleFont: { type: ControlType.Font, title: "Title font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 22, variant: "Semibold", lineHeight: "1.25em", letterSpacing: "-0.02em" } as never },
    bodyFont: { type: ControlType.Font, title: "Text font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 16, lineHeight: "1.6em" } as never },
    numberFont: { type: ControlType.Font, title: "Number font", controls: "extended", defaultFontType: "monospace", defaultValue: { fontSize: 13, letterSpacing: "0.04em" } as never, hidden: (p: FoldRowsProps) => !p.numbers },
    textColor: { type: ControlType.Color, title: "Title", defaultValue: "#111111" },
    mutedColor: { type: ControlType.Color, title: "Text", defaultValue: "#55524C" },
    lineColor: { type: ControlType.Color, title: "Lines", defaultValue: "rgba(17,17,17,0.16)" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2454FF" },
    cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#FFFFFF", hidden: (p: FoldRowsProps) => p.look !== "cards" },
    openColor: { type: ControlType.Color, title: "Open fill", defaultValue: "#F1EEE7", hidden: (p: FoldRowsProps) => p.openStyle === "none" },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 64, defaultValue: 12, hidden: (p: FoldRowsProps) => p.look !== "cards" },
    padding: { type: ControlType.Number, title: "Padding", min: 8, max: 64, defaultValue: 28 },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40, defaultValue: 16, hidden: (p: FoldRowsProps) => p.look !== "cards" },
    imageRatio: { type: ControlType.Number, title: "Picture ratio", min: 0.5, max: 3, step: 0.1, defaultValue: 1.5, description: "Width ÷ height." },
    duration: { type: ControlType.Number, title: "Duration", min: 0, max: 1.5, step: 0.05, unit: "s", defaultValue: 0.45 },
    hashLinks: { type: ControlType.Boolean, title: "Open from link", defaultValue: true, description: "page#row-title opens that row." },
    faqData: { type: ControlType.Boolean, title: "FAQ data", defaultValue: false, description: "Adds schema.org FAQPage data for search engines. Use it on one FAQ per page." },
    canvasOpen: { type: ControlType.Number, title: "On canvas", min: 0, max: 50, step: 1, displayStepper: true, defaultValue: 1, description: "Row open on the canvas, to design it." },
})
