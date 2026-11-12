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


// Source Notes: two-line headline + lead on the left two thirds, source cards in the margin column on the right.
// Footnote numbers are buttons: hover / focus / tap highlights the matching card. Layout follows the component's own width.

interface FootnoteSource {
    label: string
    date: string
    quote: string
}

interface SourceNotesProps {
    titleLines: string
    lead: string
    sources: FootnoteSource[]
    inkColor: string
    mutedColor: string
    accentColor: string
    lineColor: string
    highlightColor: string
    sansFont?: React.CSSProperties
    serifFont?: React.CSSProperties
    monoFont?: React.CSSProperties
    autoPlay: boolean
    interval: number
    textAlign: "left" | "center" | "right"
    style?: React.CSSProperties
}

/* ---------- content ---------- */

const DEFAULT_TITLE = "Every answer,\n*footnoted.*{1}"
const DEFAULT_LEAD =
    "Our assistant reads your docs, tickets and chats,{2} then answers in seconds, with a source for every sentence.{3}"

const DEFAULT_SOURCES: FootnoteSource[] = [
    { label: "Quarterly review.pdf", date: "Sep 30", quote: "Churn rose 2.1 points after the July price change." },
    { label: "#support thread", date: "Sep 14", quote: "Three accounts named the new seat minimum." },
    { label: "Ticket 4821", date: "Sep 12", quote: "Customer asked to move to monthly billing before renewal." },
]

// *word* = serif italic, {n} = footnote number n (1-based, points at the n-th source)
type Piece = { kind: "text"; text: string; em: boolean } | { kind: "ref"; n: number }

function parseInline(src: string, sourceCount: number): Piece[] {
    const out: Piece[] = []
    const re = /\*([^*\n]+)\*|\{(\d{1,2})\}/g
    let last = 0
    for (let m = re.exec(src); m; m = re.exec(src)) {
        if (m.index > last) out.push({ kind: "text", text: src.slice(last, m.index), em: false })
        if (m[1] !== undefined) out.push({ kind: "text", text: m[1], em: true })
        else {
            const n = Number(m[2])
            if (n >= 1 && n <= sourceCount) out.push({ kind: "ref", n })
        }
        last = m.index + m[0].length
    }
    if (last < src.length) out.push({ kind: "text", text: src.slice(last), em: false })
    return out
}

/* ---------- skin: every style value lives here (Source Notes) ---------- */

const SANS_STACK = '"Instrument Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const SERIF_STACK = '"Instrument Serif", ui-serif, Georgia, "Times New Roman", serif'
const MONO_STACK = '"Geist Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'

function familyOf(font: React.CSSProperties | undefined, fallback: string): string {
    const family = font && typeof font.fontFamily === "string" ? font.fontFamily.trim() : ""
    return family ? `${family}, ${fallback}` : fallback
}

const LINE_STEP = 120 // ms between rising lines
const FIRST_GAP = 420 // ms from the last line starting to the first footnote number lighting

const CSS = `
.bsn,.bsn *{box-sizing:border-box}
.bsn{container-type:inline-size;position:relative;color:var(--bsn-ink);font-family:var(--bsn-sans)}
.bsn :where(p,ul,h1){margin:0;padding:0}
.bsn ul{list-style:none}
.bsn-grid{--bsn-ts:48px;display:grid;grid-template-columns:minmax(0,1fr);row-gap:40px}
.bsn-main{min-width:0;text-align:var(--bsn-align)}
.bsn-title{font-weight:600;font-size:var(--bsn-ts);line-height:.95;letter-spacing:-.03em;overflow-wrap:break-word}
.bsn-line{display:block}
.bsn-em{font-family:var(--bsn-serif);font-style:italic;font-weight:400;letter-spacing:-.02em}
.bsn-lead{margin-top:24px;max-width:28em;font-size:18px;line-height:1.45;font-weight:400;letter-spacing:0}
.bsn[data-align=center] .bsn-lead{margin-left:auto;margin-right:auto}
.bsn[data-align=right] .bsn-lead{margin-left:auto}
.bsn-ref{appearance:none;background:none;border:0;margin:0;padding:.1em .15em;cursor:pointer;display:inline-block;position:relative;line-height:1;vertical-align:baseline;font-family:var(--bsn-mono);font-weight:500;font-style:normal;letter-spacing:0;color:var(--bsn-accent);transform-origin:50% 100%;-webkit-tap-highlight-color:transparent}
.bsn-ref::after{content:"";position:absolute;inset:-.6em -.4em}
.bsn-title .bsn-ref{font-size:.26em;top:-1.95em}
.bsn-lead .bsn-ref{font-size:.66em;top:-.7em}
.bsn-ref[data-active=true]{background:var(--bsn-hi)}
.bsn-ref:focus-visible{outline:2px solid var(--bsn-accent);outline-offset:2px}
.bsn-margin{position:relative;display:flex;gap:16px;min-width:0;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.bsn-margin::-webkit-scrollbar{display:none}
.bsn-card{position:relative;flex:0 0 min(300px,80cqw);scroll-snap-align:start;border-top:1px solid var(--bsn-line);padding:16px 16px 20px}
.bsn-card::before{content:"";position:absolute;left:0;top:-1px;bottom:0;width:2px;background:var(--bsn-accent);opacity:0}
.bsn-card[data-active=true]{background:var(--bsn-hi)}
.bsn-card[data-active=true]::before{opacity:1}
.bsn-card[data-dim=true]{opacity:.4}
.bsn-meta{display:flex;align-items:baseline;gap:10px;font-family:var(--bsn-mono);font-size:13px;line-height:1.4}
.bsn-num{color:var(--bsn-accent);font-weight:500}
.bsn-label{min-width:0;flex:1 1 auto;overflow-wrap:anywhere}
.bsn-date{margin-left:auto;flex:none;color:var(--bsn-muted);font-size:12px;white-space:nowrap}
.bsn-quote{margin-top:12px;font-family:var(--bsn-serif);font-style:italic;font-weight:400;font-size:20px;line-height:1.25}
@container (min-width:540px){
.bsn-grid{--bsn-ts:72px}
.bsn-lead{font-size:20px}
}
@container (min-width:810px){
.bsn-grid{grid-template-columns:repeat(12,minmax(0,1fr));column-gap:24px;row-gap:0}
.bsn-main{grid-column:1 / span 8}
.bsn-margin{grid-column:9 / span 4;flex-direction:column;gap:0;overflow:visible;align-self:start;margin-top:calc(var(--bsn-ts)*.15)}
.bsn-card{flex:none}
}
@container (min-width:1100px){
.bsn-grid{--bsn-ts:96px}
.bsn-lead{font-size:22px;margin-top:40px}
}
@media (prefers-reduced-motion:no-preference){
.bsn-line,.bsn-card,.bsn-ref{transition:opacity 480ms cubic-bezier(.2,.7,.2,1),transform 480ms cubic-bezier(.2,.7,.2,1),background-color 160ms ease-out}
.bsn-line[data-on=false]{opacity:0;transform:translateY(.4em)}
.bsn-card[data-on=false]{opacity:0;transform:translateY(10px)}
.bsn-ref[data-on=false]{opacity:0;transform:scale(.5)}
}
.bsn-ref[data-on=false]{pointer-events:none}
.bsn-card[data-on=false]{pointer-events:none}
`

type Phase = "wait" | "play" | "done"

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SourceNotes(props: SourceNotesProps) {
    const {
        titleLines = DEFAULT_TITLE,
        lead = DEFAULT_LEAD,
        sources: sourcesProp,
        inkColor = "#141414",
        mutedColor = "#5A5C62",
        accentColor = "#FF4D1F",
        lineColor = "#E1DED5",
        highlightColor = "#FFE7DE",
        sansFont,
        serifFont,
        monoFont,
        autoPlay = true,
        interval = 800,
        textAlign = "left",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = React.useId()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const marginRef = React.useRef<HTMLUListElement | null>(null)
    const cardRefs = React.useRef<Record<number, HTMLLIElement | null>>({})

    const sources = React.useMemo(() => (Array.isArray(sourcesProp) && sourcesProp.length > 0 ? sourcesProp : DEFAULT_SOURCES), [sourcesProp])
    const count = sources.length

    const titles = React.useMemo(
        () =>
            String(titleLines)
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => parseInline(line, count)),
        [titleLines, count]
    )
    const leadPieces = React.useMemo(() => parseInline(String(lead).trim(), count), [lead, count])
    const lineCount = titles.length + (leadPieces.length > 0 ? 1 : 0)

    // footnote numbers in reading order (title first, then lead), each number once
    const order = React.useMemo(() => {
        const seen: number[] = []
        for (const pieces of [...titles, leadPieces]) {
            for (const piece of pieces) if (piece.kind === "ref" && !seen.includes(piece.n)) seen.push(piece.n)
        }
        return seen
    }, [titles, leadPieces])
    const orderKey = order.join(",")

    const [phase, setPhase] = React.useState<Phase>(autoPlay && !isStatic ? "wait" : "done")
    const [shown, setShown] = React.useState(0)
    const [lit, setLit] = React.useState(0)
    const [hover, setHover] = React.useState<number | null>(null)
    const [focus, setFocus] = React.useState<number | null>(null)
    const [pinned, setPinned] = React.useState<number | null>(null)

    const gap = Math.max(120, Number(interval) || 800)
    const done = phase === "done"
    const litSet = new Set(order.slice(0, lit))
    const lineOn = (i: number) => done || i < shown
    const refOn = (n: number) => done || litSet.has(n)
    const cardOn = (n: number) => done || litSet.has(n) || (!order.includes(n) && lit >= order.length && shown >= lineCount)

    const candidate = hover ?? focus ?? pinned
    const active = !isStatic && candidate !== null && cardOn(candidate) ? candidate : null

    const scrollMargin = React.useCallback((n: number) => {
        const row = marginRef.current
        if (!row || row.scrollWidth <= row.clientWidth + 1) return // only the one-line phone layout scrolls
        const card = n > 0 ? cardRefs.current[n] : null
        const smooth = typeof window !== "undefined" && typeof window.matchMedia === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        row.scrollTo({ left: card ? card.offsetLeft : 0, behavior: smooth ? "smooth" : "auto" })
    }, [])

    // static renderer (canvas, thumbnails), autoplay off and reduced motion: finished state from the start
    React.useEffect(() => {
        if (isStatic || !autoPlay) {
            setPhase("done")
            return
        }
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        if (mq.matches) setPhase("done")
        if (typeof mq.addEventListener !== "function") return
        const onChange = () => {
            if (mq.matches) setPhase("done")
        }
        mq.addEventListener("change", onChange)
        return () => mq.removeEventListener("change", onChange)
    }, [isStatic, autoPlay])

    // the sequence starts once the hero scrolls into view
    React.useEffect(() => {
        if (phase !== "wait") return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setPhase("play")
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setPhase("play")
                    io.disconnect()
                }
            },
            { threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [phase])

    // lines rise 120 ms apart, then the footnote numbers light one by one and their cards appear
    React.useEffect(() => {
        if (phase !== "play") return
        const timers: number[] = []
        for (let i = 0; i < lineCount; i++) timers.push(window.setTimeout(() => setShown(i + 1), i * LINE_STEP))
        const first = Math.max(0, lineCount - 1) * LINE_STEP + FIRST_GAP
        for (let k = 0; k < order.length; k++) {
            timers.push(
                window.setTimeout(() => {
                    setLit(k + 1)
                    scrollMargin(order[k])
                }, first + k * gap)
            )
        }
        const end = first + Math.max(0, order.length - 1) * gap + 600
        timers.push(
            window.setTimeout(() => {
                scrollMargin(0)
                setPhase("done")
            }, end)
        )
        return () => timers.forEach((id) => window.clearTimeout(id))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, lineCount, orderKey, gap, scrollMargin])

    // a tapped number stays highlighted until the next tap elsewhere or Escape
    React.useEffect(() => {
        if (pinned === null) return
        const onDown = (event: PointerEvent) => {
            const target = event.target as Element | null
            const inside = !!(target && rootRef.current && rootRef.current.contains(target) && target.closest(".bsn-ref"))
            if (!inside) setPinned(null)
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setPinned(null)
        }
        document.addEventListener("pointerdown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [pinned])

    // keyboard focus or a tap brings the card into view in the one-line layout
    React.useEffect(() => {
        const n = focus ?? pinned
        if (n !== null) scrollMargin(n)
    }, [focus, pinned, scrollMargin])

    const finish = () => {
        if (phase !== "done") setPhase("done")
    }

    const renderPieces = (pieces: Piece[]) =>
        pieces.map((piece, i) => {
            if (piece.kind === "text") {
                return piece.em ? (
                    <em key={i} className="bsn-em">
                        {piece.text}
                    </em>
                ) : (
                    <React.Fragment key={i}>{piece.text}</React.Fragment>
                )
            }
            const n = piece.n
            return (
                <button
                    key={i}
                    type="button"
                    className="bsn-ref"
                    data-n={n}
                    data-on={refOn(n)}
                    data-active={active === n}
                    aria-label={`Source ${n}`}
                    aria-describedby={`${uid}-card-${n}`}
                    aria-pressed={pinned === n}
                    onPointerEnter={isStatic ? undefined : (e) => e.pointerType === "mouse" && setHover(n)}
                    onPointerLeave={isStatic ? undefined : () => setHover(null)}
                    onFocus={
                        isStatic
                            ? undefined
                            : (e) => {
                                  let keyboard = true
                                  try {
                                      keyboard = e.currentTarget.matches(":focus-visible")
                                  } catch (error) {
                                      keyboard = true
                                  }
                                  finish()
                                  if (keyboard) setFocus(n)
                              }
                    }
                    onBlur={isStatic ? undefined : () => setFocus(null)}
                    onClick={isStatic ? undefined : () => setPinned((prev) => (prev === n ? null : n))}
                >
                    {n}
                </button>
            )
        })

    const rootVars = {
        width: "100%",
        ...style,
        "--bsn-ink": inkColor,
        "--bsn-muted": mutedColor,
        "--bsn-accent": accentColor,
        "--bsn-line": lineColor,
        "--bsn-hi": highlightColor,
        "--bsn-sans": familyOf(sansFont, SANS_STACK),
        "--bsn-serif": familyOf(serifFont, SERIF_STACK),
        "--bsn-mono": familyOf(monoFont, MONO_STACK),
        "--bsn-align": textAlign,
    } as React.CSSProperties

    return (
        <div ref={rootRef} className="bsn" data-phase={phase} data-active={active ?? ""} data-align={textAlign} style={rootVars}>
            <style>{CSS}</style>
            <div className="bsn-grid">
                <div className="bsn-main">
                    <h1 className="bsn-title">
                        {titles.map((pieces, i) => (
                            <span key={i} className="bsn-line" data-on={lineOn(i)}>
                                {renderPieces(pieces)}
                            </span>
                        ))}
                    </h1>
                    {leadPieces.length > 0 && (
                        <p className="bsn-lead bsn-line" data-on={lineOn(titles.length)}>
                            {renderPieces(leadPieces)}
                        </p>
                    )}
                </div>
                <ul className="bsn-margin" ref={marginRef} aria-label="Sources">
                    {sources.map((source, i) => {
                        const n = i + 1
                        return (
                            <li
                                key={i}
                                id={`${uid}-card-${n}`}
                                ref={(el) => {
                                    cardRefs.current[n] = el
                                }}
                                className="bsn-card"
                                data-n={n}
                                data-on={cardOn(n)}
                                data-active={active === n}
                                data-dim={active !== null && active !== n}
                            >
                                <div className="bsn-meta">
                                    <span className="bsn-num">{n}</span>
                                    <span className="bsn-label">{source.label}</span>
                                    <span className="bsn-date">{source.date}</span>
                                </div>
                                <p className="bsn-quote">{`“${source.quote}”`}</p>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

// Font controls cannot name a family in defaultValue: pick Instrument Sans (600) / Instrument Serif (Italic) / Geist Mono on the instance.
// Without a picked font the skin falls back to those families by name (SANS_STACK, SERIF_STACK, MONO_STACK).
addPropertyControls(SourceNotes, {
    titleLines: {
        type: ControlType.String,
        title: "Title lines",
        defaultValue: DEFAULT_TITLE,
        displayTextArea: true,
        description: "One line per row. *word* = serif italic, {1} = footnote number.",
    },
    lead: {
        type: ControlType.String,
        title: "Lead",
        defaultValue: DEFAULT_LEAD,
        displayTextArea: true,
        description: "{1}, {2}, {3} point at the first, second and third source.",
    },
    sources: {
        type: ControlType.Array,
        title: "Sources",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Document", defaultValue: "Quarterly review.pdf" },
                date: { type: ControlType.String, title: "Date", defaultValue: "Sep 30" },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    defaultValue: "Churn rose 2.1 points after the July price change.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: DEFAULT_SOURCES,
        maxCount: 6,
    },
    inkColor: { type: ControlType.Color, title: "Ink", defaultValue: "#141414" },
    mutedColor: { type: ControlType.Color, title: "Muted", defaultValue: "#5A5C62" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#FF4D1F" },
    lineColor: { type: ControlType.Color, title: "Line", defaultValue: "#E1DED5" },
    highlightColor: { type: ControlType.Color, title: "Highlight", defaultValue: "#FFE7DE" },
    sansFont: {
        type: ControlType.Font,
        title: "Sans font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    serifFont: {
        type: ControlType.Font,
        title: "Serif font",
        controls: "basic",
        defaultFontType: "serif",
    },
    monoFont: {
        type: ControlType.Font,
        title: "Mono font",
        controls: "basic",
        defaultFontType: "monospace",
    },
    autoPlay: { type: ControlType.Boolean, title: "Auto play", defaultValue: true },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        description: "Milliseconds between footnotes",
        defaultValue: 800,
        min: 200,
        max: 2000,
        step: 50,
        unit: "ms",
        hidden: (p: { autoPlay?: boolean }) => !p.autoPlay,
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },
})
