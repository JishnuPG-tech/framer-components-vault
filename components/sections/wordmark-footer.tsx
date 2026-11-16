/**
 * Wordmark Footer
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component at the bottom of your page and set its width to Fill.
 * 3. Edit columns, copyright, socials and colors in the property panel.
 * 4. Fonts: one Font control for the links, a separate one for the wordmark (its weight has its own control).
 *
 * A light footer with a thin palette stripe, link columns, a small bottom row and a giant heavy
 * wordmark on a colour band that always spans the full width. When the footer scrolls into view the wordmark letters rise from below a mask one by one.
 * Motion is CSS only, off in the static render and for reduced motion.
 */
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


type Column = { title: string; links: string }

interface WordmarkFooterProps {
    wordmark: string
    columns: Column[]
    copyright: string
    socials: string
    stagger: number
    duration: number
    tracking: number
    background: string
    textColor: string
    muted: string
    border: string
    wordmarkColor: string
    band: string
    stripe: string[]
    wordmarkWeight: number
    accent: string
    font?: React.CSSProperties
    wordmarkFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_COLUMNS: Column[] = [
    { title: "Product", links: "Features | #\nPricing | #\nChangelog | #\nIntegrations | #" },
    { title: "Company", links: "About | #\nCareers | #\nCustomers | #\nPress | #" },
    { title: "Resources", links: "Blog | #\nGuides | #\nHelp center | #\nStatus | #" },
    { title: "Legal", links: "Privacy | #\nTerms | #\nCookies | #\nImprint | #" },
]

const DEFAULT_STRIPE = ["#FFD35C", "#C8B8B2", "#F9C2F2", "#86A3E0", "#55683F"]

const DEFAULT_SOCIALS = "X | #\nLinkedIn | #"

/** "Label | https://url" per line → [{ label, url }] */
function parseLinks(text: string): { label: string; url: string }[] {
    const out: { label: string; url: string }[] = []
    for (const line of (text || "").split("\n")) {
        if (!line.trim()) continue
        const [label, ...rest] = line.split("|")
        out.push({ label: label.trim(), url: rest.join("|").trim() })
    }
    return out
}

function isExternal(url: string): boolean {
    if (/^https?:\/\//i.test(url)) return true
    return false
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function WordmarkFooter(props: WordmarkFooterProps) {
    const {
        wordmark = "Northwind",
        columns: rawColumns = DEFAULT_COLUMNS,
        copyright = "© 2026 Northwind",
        socials = DEFAULT_SOCIALS,
        stagger = 0.05,
        duration = 0.9,
        tracking = -0.04,
        background = "#F4F4F2",
        textColor = "#0E0E0E",
        muted = "rgba(14, 14, 14, 0.55)",
        border = "rgba(14, 14, 14, 0.12)",
        wordmarkColor = "#0E0E0E",
        band = "#FFD35C",
        stripe = DEFAULT_STRIPE,
        wordmarkWeight = 800,
        accent = "#0E0E0E",
        font,
        wordmarkFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const columns = rawColumns.length ? rawColumns : DEFAULT_COLUMNS
    const letters = Array.from(wordmark || " ")
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const measureRef = React.useRef<HTMLSpanElement>(null)
    const [size, setSize] = React.useState<number | null>(null)
    const [shown, setShown] = React.useState(false)
    const [reduced, setReduced] = React.useState(false)

    // Fit: the hidden copy is set at 100px, so width / measured * 100 is the size that spans edge to edge.
    React.useEffect(() => {
        const wrap = wrapRef.current
        const measure = measureRef.current
        if (!wrap || !measure) return
        let frame = 0
        const update = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                const measured = measure.getBoundingClientRect().width
                if (measured <= 0) return
                setSize(Math.floor((wrap.clientWidth / measured) * 100 * 100) / 100)
            })
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(wrap)
        document.fonts?.ready.then(update)
        return () => {
            cancelAnimationFrame(frame)
            ro.disconnect()
        }
    }, [wordmark, tracking, wordmarkFont, wordmarkWeight])

    // Reveal once when the wordmark scrolls into view.
    React.useEffect(() => {
        if (isStatic) return
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        if (media.matches) {
            setReduced(true)
            setShown(true)
            return
        }
        const node = wrapRef.current
        if (!node) return
        const io = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return
                setShown(true)
                io.disconnect()
            },
            { threshold: 0.35 }
        )
        io.observe(node)
        return () => io.disconnect()
    }, [isStatic])

    const animate = !isStatic && !reduced
    const visible = isStatic || shown
    // Before the first measure (and in the static render) estimate from the container width.
    const fontSize = size === null ? `${(100 / (letters.length * 0.62)).toFixed(2)}cqw` : `${size}px`

    const linkStyle: React.CSSProperties = { color: "inherit", textDecoration: "none", borderRadius: 4 }

    return (
        <footer
            style={{
                ...style,
                ...font,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                background,
                color: textColor,
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <style>{`
                .wmf-link { transition: ${animate ? "color 0.2s ease" : "none"}; }
                .wmf-link, .wmf-link:visited { text-decoration: none !important; }
                .wmf-link:hover, .wmf-link:focus-visible { color: ${textColor} !important; text-decoration: underline !important; text-underline-offset: 3px; opacity: 1; }
                .wmf-body { container-type: inline-size; }
                .wmf-cols { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                @container (max-width: 860px) { .wmf-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @container (max-width: 330px) { .wmf-cols { grid-template-columns: 1fr; } }
                .wmf-link:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
                @media (prefers-reduced-motion: reduce) { .wmf-letter, .wmf-link { transition: none !important; } }
            `}</style>

            {stripe.length ? (
                <div aria-hidden="true" style={{ display: "flex", height: 10 }}>
                    {stripe.map((c, i) => (
                        <span key={i} style={{ flex: 1, background: c }} />
                    ))}
                </div>
            ) : null}

            <div className="wmf-body" style={{ display: "flex", flexDirection: "column", gap: 48, padding: "64px clamp(20px, 4vw, 48px) 24px" }}>
            <nav
                aria-label="Footer"
                className="wmf-cols"
                style={{
                    display: "grid",
                    gap: "36px 24px",
                }}
            >
                {columns.map((col, i) => (
                    <div key={`${col.title}-${i}`} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: textColor }}>
                            {col.title}
                        </p>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                            {parseLinks(col.links).map((link, j) => (
                                <li key={j}>
                                    <a
                                        className="wmf-link"
                                        href={link.url || undefined}
                                        target={isExternal(link.url) ? "_blank" : undefined}
                                        rel={isExternal(link.url) ? "noopener noreferrer" : undefined}
                                        style={{ ...linkStyle, fontSize: 15, fontWeight: 500, color: muted }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px 24px",
                    paddingTop: 20,
                    borderTop: `1px solid ${border}`,
                    fontSize: 13,
                    fontWeight: 500,
                    color: muted,
                }}
            >
                <span>{copyright}</span>
                {parseLinks(socials).length ? (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 20 }}>
                        {parseLinks(socials).map((link, j) => (
                            <li key={j}>
                                <a
                                    className="wmf-link"
                                    href={link.url || undefined}
                                    target={isExternal(link.url) ? "_blank" : undefined}
                                    rel={isExternal(link.url) ? "noopener noreferrer" : undefined}
                                    style={{ ...linkStyle, color: muted }}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
            </div>

            <div style={{ background: band, padding: "clamp(16px, 3vw, 40px) clamp(20px, 4vw, 48px) 0" }}>
            <div ref={wrapRef} style={{ position: "relative", width: "100%", ...({ containerType: "inline-size" } as any) }}>
                <span
                    ref={measureRef}
                    aria-hidden="true"
                    style={{
                        ...wordmarkFont,
                        fontWeight: wordmarkWeight,
                        position: "absolute",
                        left: 0,
                        top: 0,
                        visibility: "hidden",
                        pointerEvents: "none",
                        whiteSpace: "pre",
                        fontSize: 100,
                        lineHeight: 1,
                        letterSpacing: `${tracking}em`,
                    }}
                >
                    {wordmark}
                </span>
                <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{wordmark}</span>
                <div
                    aria-hidden="true"
                    style={{
                        ...wordmarkFont,
                        fontWeight: wordmarkWeight,
                        display: "flex",
                        overflow: "hidden",
                        whiteSpace: "pre",
                        fontSize,
                        lineHeight: 0.92,
                        paddingBottom: "0.04em",
                        letterSpacing: `${tracking}em`,
                        color: wordmarkColor,
                    }}
                >
                    {letters.map((ch, i) => (
                        <span
                            key={i}
                            className="wmf-letter"
                            style={{
                                display: "inline-block",
                                transform: visible ? "translateY(0)" : "translateY(105%)",
                                transition: animate
                                    ? `transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${i * stagger}s`
                                    : "none",
                            }}
                        >
                            {ch}
                        </span>
                    ))}
                </div>
            </div>
            </div>
        </footer>
    )
}

addPropertyControls(WordmarkFooter, {
    wordmark: { type: ControlType.String, title: "Wordmark", defaultValue: "Northwind" },
    columns: {
        type: ControlType.Array,
        title: "Columns",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Column" },
                links: {
                    type: ControlType.String,
                    title: "Links",
                    displayTextArea: true,
                    defaultValue: "Link | #",
                    description: "One per line: Label | https://url",
                },
            },
        },
        defaultValue: DEFAULT_COLUMNS,
    },
    copyright: { type: ControlType.String, title: "Copyright", defaultValue: "© 2026 Northwind" },
    socials: {
        type: ControlType.String,
        title: "Socials",
        displayTextArea: true,
        defaultValue: DEFAULT_SOCIALS,
        description: "One per line: Label | https://url. Leave empty to hide.",
    },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.05, min: 0, max: 0.3, step: 0.01, unit: "s", description: "Delay between wordmark letters." },
    duration: { type: ControlType.Number, title: "Rise Time", defaultValue: 0.9, min: 0.1, max: 3, step: 0.05, unit: "s" },
    tracking: { type: ControlType.Number, title: "Tracking", defaultValue: -0.04, min: -0.2, max: 0.2, step: 0.01, unit: "em", description: "Wordmark letter spacing." },
    wordmarkWeight: { type: ControlType.Number, title: "Wordmark Weight", defaultValue: 800, min: 100, max: 900, step: 100, description: "Applied on top of the Wordmark Font." },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F4F4F2" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#0E0E0E" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "rgba(14, 14, 14, 0.55)" },
    border: { type: ControlType.Color, title: "Border", defaultValue: "rgba(14, 14, 14, 0.12)" },
    band: { type: ControlType.Color, title: "Band", defaultValue: "#FFD35C", description: "Colour behind the wordmark." },
    wordmarkColor: { type: ControlType.Color, title: "Wordmark", defaultValue: "#0E0E0E" },
    stripe: {
        type: ControlType.Array,
        title: "Stripe",
        control: { type: ControlType.Color },
        defaultValue: DEFAULT_STRIPE,
        description: "Thin colour row along the top edge. Remove all to hide.",
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#0E0E0E", description: "Focus ring." },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
    wordmarkFont: { type: ControlType.Font, title: "Wordmark Font", controls: "extended", defaultFontType: "sans-serif" },
})
