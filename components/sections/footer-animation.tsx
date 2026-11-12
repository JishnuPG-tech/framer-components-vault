import * as React from "react"
import { useRef, useState, useEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const FRAMER_REFERRAL_URL = "https://framer.link/angela-storace"
/**
 * Reveal Footer
 * Il footer resta "spento" finché non entra nel viewport: poi la linea si disegna,
 * il titolo sale riga per riga da una maschera e le info di contatto compaiono in sequenza.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 760
 */

type Column = { title: string; text: string; link?: string }
type LinkItem = { label: string; link?: string }

interface Props {
    brand: string
    statusText: string
    headline: string
    email: string
    columns: Column[]
    socialTitle: string
    socials: LinkItem[]
    copyright: string
    legalLinks: LinkItem[]
    showBackToTop: boolean
    backToTopLabel: string
    showTopBar: boolean
    brandType: "text" | "logo"
    logo?: { src?: string; srcSet?: string; alt?: string }
    logoHeight: number
    showHeadline: boolean
    showEmail: boolean
    emailSubject: string
    ctaLabel: string
    ctaLink: string
    showInfo: boolean
    columnMinWidth: number
    showBottomBar: boolean
    background: string
    textColor: string
    mutedColor: string
    accent: string
    lineColor: string
    glow: boolean
    headlineFont: React.CSSProperties
    bodyFont: React.CSSProperties
    headlineSize: number
    emailSize: number
    verticalPadding: number
    animationSpeed: number
    triggerAmount: number
    once: boolean
    style?: React.CSSProperties
}

const EASE = [0.16, 1, 0.3, 1] as const

const CSS = `
.lf a, .lf button { color: inherit; text-decoration: none; }
.lf-link { transition: color .3s ease; }
.lf-link:hover { color: var(--lf-accent); }
.lf a:focus-visible, .lf button:focus-visible {
  outline: 2px solid var(--lf-accent); outline-offset: 5px; border-radius: 2px;
}
.lf-mail { position: relative; display: inline-block; padding-bottom: .12em; }
.lf-mail::before, .lf-mail::after {
  content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 2px;
}
.lf-mail::before { background: var(--lf-line); }
.lf-mail::after {
  background: var(--lf-accent); transform: scaleX(0); transform-origin: right;
  transition: transform .6s cubic-bezier(.16,1,.3,1);
}
.lf-mail:hover::after { transform: scaleX(1); transform-origin: left; }
.lf-top { transition: background .3s ease, color .3s ease, border-color .3s ease; cursor: pointer; }
.lf-top:hover { background: var(--lf-accent); color: var(--lf-bg); border-color: var(--lf-accent); }
.lf-cta { display: inline-flex; align-items: center; padding: 0.95em 1.8em; border: 1px solid var(--lf-accent); border-radius: 999px; color: var(--lf-accent) !important; transition: background .3s ease, color .3s ease; }
.lf-cta:hover { background: var(--lf-accent); color: var(--lf-bg) !important; }
.lf-dot { animation: lf-pulse 2.4s ease-in-out infinite; }
@keyframes lf-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
@media (prefers-reduced-motion: reduce) { .lf-dot { animation: none; } }
`

function isExternal(url?: string) {
    return !!url && /^https?:\/\//i.test(url)
}

function Anchor({
    href,
    children,
    className = "lf-link",
}: {
    href?: string
    children: React.ReactNode
    className?: string
}) {
    if (!href) return <>{children}</>
    return (
        <a
            className={className}
            href={href}
            target={isExternal(href) ? "_blank" : undefined}
            rel={isExternal(href) ? "noopener noreferrer" : undefined}
        >
            {children}
        </a>
    )
}

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: string | null }
> {
    state = { error: null as string | null }
    static getDerivedStateFromError(e: any) {
        return { error: String((e && e.message) || e) }
    }
    render() {
        if (this.state.error) {
            return (
                <div
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: 24,
                        background: "#2a0f14",
                        color: "#ffb4b4",
                        font: "14px/1.5 monospace",
                    }}
                >
                    Reveal Footer – errore: {this.state.error}
                </div>
            )
        }
        return this.props.children
    }
}

function FooterInner(props: Props) {
    const {
        brand,
        statusText,
        headline,
        email,
        columns,
        socialTitle,
        socials,
        copyright,
        legalLinks,
        showBackToTop,
        backToTopLabel,
        showTopBar,
        brandType,
        logo,
        logoHeight,
        showHeadline,
        showEmail,
        emailSubject,
        ctaLabel,
        ctaLink,
        showInfo,
        columnMinWidth,
        showBottomBar,
        background,
        textColor,
        mutedColor,
        accent,
        lineColor,
        glow,
        headlineFont: headlineFontProp,
        bodyFont: bodyFontProp,
        headlineSize,
        emailSize,
        verticalPadding,
        animationSpeed,
        triggerAmount,
        once,
        style,
    } = props

    const headlineFont: React.CSSProperties = headlineFontProp || {}
    const bodyFont: React.CSSProperties = bodyFontProp || {}

    const ref = useRef<HTMLElement>(null)
    const [w, setW] = useState(1200)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const update = () => setW(el.offsetWidth || 1200)
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const cl = (min: number, v: number, max: number) =>
        Math.min(max, Math.max(min, v))
    const reduce = useReducedMotion()

    // true nel canvas di Framer e durante l'export: qui niente animazioni né effetti continui,
    // il footer viene mostrato direttamente nel suo stato finale.
    const isStatic = useIsStaticRenderer()

    // L'osservatore dello scroll parte solo fuori dal contesto statico.
    const [inView, setInView] = useState(false)
    useEffect(() => {
        if (isStatic) return
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[0]
                if (!e) return
                if (e.isIntersecting) {
                    setInView(true)
                    if (once) io.disconnect()
                } else if (!once) {
                    setInView(false)
                }
            },
            { threshold: triggerAmount }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, once, triggerAmount])

    const show = isStatic || !!reduce || inView
    const k = reduce ? 0 : 1 / Math.max(animationSpeed, 0.1)

    const rise = {
        hidden: { opacity: 0, y: 18 },
        show: (delay: number) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.9 * k, delay: delay * k, ease: EASE },
        }),
    }
    const maskUp = {
        hidden: { y: "110%" },
        show: (delay: number) => ({
            y: "0%",
            transition: { duration: 1.1 * k, delay: delay * k, ease: EASE },
        }),
    }
    const draw = {
        hidden: { scaleX: 0 },
        show: {
            scaleX: 1,
            transition: { duration: 1.4 * k, ease: EASE },
        },
    }

    const lines = (headline || "").split("\n")
    const year = new Date().getFullYear()
    const copy = (copyright || "").replace("{year}", String(year))
    const infoStart = 0.25 + lines.length * 0.14 + 0.35

    const cssVars = {
        "--lf-bg": background,
        "--lf-accent": accent,
        "--lf-line": lineColor,
    } as React.CSSProperties

    return (
        <motion.footer
            ref={ref as any}
            className="lf"
            initial={isStatic ? false : "hidden"}
            animate={show ? "show" : "hidden"}
            style={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
                background,
                color: textColor,
                minHeight: 320,
                boxSizing: "border-box",
                ...cssVars,
                ...style,
            }}
        >
            <style>{CSS}</style>

            {glow && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        opacity: 0.16,
                        background: `radial-gradient(60% 55% at 88% 0%, ${accent}, transparent 70%)`,
                    }}
                />
            )}

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: cl(48, w * 0.07, 96),
                    padding: `${verticalPadding}px ${cl(24, w * 0.055, 88)}px 40px`,
                    boxSizing: "border-box",
                    ...bodyFont,
                }}
            >
                {/* Linea + riga superiore */}
                {showTopBar && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 24,
                        }}
                    >
                        <motion.div
                            variants={draw}
                            aria-hidden
                            style={{
                                height: 1,
                                background: accent,
                                transformOrigin: "left center",
                            }}
                        />
                        <motion.div
                            variants={rise}
                            custom={0.1}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 16,
                            }}
                        >
                            {brandType === "logo" && logo && logo.src ? (
                                <img
                                    src={logo.src}
                                    srcSet={logo.srcSet}
                                    alt={logo.alt || brand}
                                    style={{
                                        height: logoHeight,
                                        width: "auto",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <span
                                    style={{
                                        fontWeight: 600,
                                        letterSpacing: "0.01em",
                                    }}
                                >
                                    {brand}
                                </span>
                            )}
                            {statusText && (
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 10,
                                        color: mutedColor,
                                        fontSize: "0.92em",
                                    }}
                                >
                                    <span
                                        className={
                                            isStatic ? undefined : "lf-dot"
                                        }
                                        aria-hidden
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: accent,
                                        }}
                                    />
                                    {statusText}
                                </span>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Titolo + email */}
                {(showHeadline || showEmail || !!ctaLabel) && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: cl(28, w * 0.04, 56),
                        }}
                    >
                        {showHeadline && (
                            <h2
                                style={{
                                    margin: 0,
                                    fontWeight: 500,
                                    ...headlineFont,
                                    fontSize: cl(40, w * 0.095, headlineSize),
                                    color: textColor,
                                }}
                            >
                                {lines.map((line, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            display: "block",
                                            overflow: "hidden",
                                            paddingBottom: "0.14em",
                                            marginBottom: "-0.14em",
                                        }}
                                    >
                                        <motion.span
                                            variants={maskUp}
                                            custom={0.25 + i * 0.14}
                                            style={{ display: "block" }}
                                        >
                                            {line}
                                        </motion.span>
                                    </span>
                                ))}
                            </h2>
                        )}

                        {(showEmail || !!ctaLabel) && (
                            <motion.div
                                variants={rise}
                                custom={infoStart - 0.1}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "24px 44px",
                                }}
                            >
                                {showEmail && (
                                    <a
                                        className="lf-mail"
                                        href={`mailto:${email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ""}`}
                                        style={{
                                            ...headlineFont,
                                            fontWeight:
                                                headlineFont.fontWeight ?? 400,
                                            fontSize: cl(
                                                20,
                                                w * 0.042,
                                                emailSize
                                            ),
                                            lineHeight: 1.2,
                                            letterSpacing: "-0.02em",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {email}
                                    </a>
                                )}
                                {ctaLabel && (
                                    <a
                                        className="lf-cta"
                                        href={ctaLink || undefined}
                                        target={
                                            isExternal(ctaLink)
                                                ? "_blank"
                                                : undefined
                                        }
                                        rel={
                                            isExternal(ctaLink)
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                    >
                                        {ctaLabel}
                                    </a>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Colonne di contatto */}
                {showInfo && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(auto-fit, minmax(${columnMinWidth}px, 1fr))`,
                            gap: cl(32, w * 0.04, 64),
                            borderTop: `1px solid ${lineColor}`,
                            paddingTop: cl(28, w * 0.035, 48),
                        }}
                    >
                        {(columns || []).map((col, i) => (
                            <motion.div
                                key={i}
                                variants={rise}
                                custom={infoStart + 0.12 + i * 0.12}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 14,
                                }}
                            >
                                <span
                                    style={{
                                        color: mutedColor,
                                        fontSize: "0.88em",
                                    }}
                                >
                                    {col.title}
                                </span>
                                <span style={{ whiteSpace: "pre-line" }}>
                                    <Anchor href={col.link}>{col.text}</Anchor>
                                </span>
                            </motion.div>
                        ))}

                        {socials && socials.length > 0 && (
                            <motion.div
                                variants={rise}
                                custom={
                                    infoStart +
                                    0.12 +
                                    (columns?.length || 0) * 0.12
                                }
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 14,
                                }}
                            >
                                <span
                                    style={{
                                        color: mutedColor,
                                        fontSize: "0.88em",
                                    }}
                                >
                                    {socialTitle}
                                </span>
                                <ul
                                    style={{
                                        listStyle: "none",
                                        margin: 0,
                                        padding: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
                                    }}
                                >
                                    {socials.map((s, i) => (
                                        <li key={i}>
                                            <Anchor href={s.link}>
                                                {s.label}
                                            </Anchor>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Barra finale */}
                {showBottomBar && (
                    <motion.div
                        variants={rise}
                        custom={infoStart + 0.6}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 20,
                            borderTop: `1px solid ${lineColor}`,
                            paddingTop: 24,
                            color: mutedColor,
                            fontSize: "0.88em",
                        }}
                    >
                        <span>{copy}</span>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 28,
                                flexWrap: "wrap",
                            }}
                        >
                            {(legalLinks || []).map((l, i) => (
                                <Anchor key={i} href={l.link}>
                                    {l.label}
                                </Anchor>
                            ))}
                            {showBackToTop && (
                                <button
                                    type="button"
                                    className="lf-top"
                                    aria-label={backToTopLabel}
                                    onClick={() =>
                                        window.scrollTo({
                                            top: 0,
                                            behavior: reduce
                                                ? "auto"
                                                : "smooth",
                                        })
                                    }
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        border: `1px solid ${lineColor}`,
                                        background: "transparent",
                                        color: textColor,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 0,
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        aria-hidden
                                    >
                                        <path
                                            d="M8 13V3M3.5 7.5L8 3l4.5 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.footer>
    )
}

export default function RevealFooter(props: Props) {
    return (
        <ErrorBoundary>
            <FooterInner {...props} />
        </ErrorBoundary>
    )
}

RevealFooter.defaultProps = {
    brand: "Studio Name",
    statusText: "Available for new projects",
    headline: "Let’s build something\nthey’ll remember.",
    email: "hello@yourstudio.com",
    columns: [
        {
            title: "Contact",
            text: "+39 000 000 0000\nMon–Fri, 9:00–18:00",
            link: "tel:+390000000000",
        },
        {
            title: "Studio",
            text: "Via Esempio 12\n00100 City, Country",
            link: "",
        },
    ],
    socialTitle: "Follow",
    socials: [
        { label: "Instagram", link: "https://instagram.com" },
        { label: "LinkedIn", link: "https://linkedin.com" },
        { label: "Behance", link: "https://behance.net" },
    ],
    copyright: "© {year} Studio Name. All rights reserved.",
    legalLinks: [
        { label: "Privacy", link: "" },
        { label: "Terms", link: "" },
    ],
    showBackToTop: true,
    backToTopLabel: "Back to top",
    showTopBar: true,
    brandType: "text",
    logoHeight: 28,
    showHeadline: true,
    showEmail: true,
    emailSubject: "",
    ctaLabel: "",
    ctaLink: "",
    showInfo: true,
    columnMinWidth: 210,
    showBottomBar: true,
    background: "#0E1A2B",
    textColor: "#F4EFE6",
    mutedColor: "rgba(244,239,230,0.6)",
    accent: "#C8A96A",
    lineColor: "rgba(244,239,230,0.16)",
    glow: true,
    headlineSize: 144,
    emailSize: 56,
    verticalPadding: 120,
    animationSpeed: 1,
    triggerAmount: 0.3,
    once: true,
}

const linkItem = {
    type: ControlType.Object,
    controls: {
        label: { type: ControlType.String, title: "Label" },
        link: {
            type: ControlType.String,
            title: "URL",
            placeholder: "https://, mailto:, tel:",
        },
    },
} as const

addPropertyControls(RevealFooter, {
    // ---- Top bar
    showTopBar: {
        type: ControlType.Boolean,
        title: "Top bar",
        defaultValue: true,
    },
    brandType: {
        type: ControlType.Enum,
        title: "Brand",
        options: ["text", "logo"],
        optionTitles: ["Text", "Logo"],
        displaySegmentedControl: true,
        defaultValue: "text",
        hidden: (p: any) => !p.showTopBar,
    },
    brand: {
        type: ControlType.String,
        title: "Name",
        hidden: (p: any) => !p.showTopBar || p.brandType === "logo",
    },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
        hidden: (p: any) => !p.showTopBar || p.brandType !== "logo",
    },
    logoHeight: {
        type: ControlType.Number,
        title: "Logo height",
        min: 12,
        max: 120,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.showTopBar || p.brandType !== "logo",
    },
    statusText: {
        type: ControlType.String,
        title: "Status",
        description: "Leave empty to hide the status.",
        hidden: (p: any) => !p.showTopBar,
    },

    // ---- Headline / email / CTA
    showHeadline: {
        type: ControlType.Boolean,
        title: "Headline",
        defaultValue: true,
    },
    headline: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        description: "Each line break becomes a separate line in the reveal.",
        hidden: (p: any) => !p.showHeadline,
    },
    showEmail: {
        type: ControlType.Boolean,
        title: "Email",
        defaultValue: true,
    },
    email: {
        type: ControlType.String,
        title: "Address",
        hidden: (p: any) => !p.showEmail,
    },
    emailSubject: {
        type: ControlType.String,
        title: "Subject",
        placeholder: "Optional",
        hidden: (p: any) => !p.showEmail,
    },
    ctaLabel: {
        type: ControlType.String,
        title: "Button",
        placeholder: "Leave empty to hide",
    },
    ctaLink: {
        type: ControlType.String,
        title: "Button link",
        placeholder: "https://, mailto:, tel:",
        hidden: (p: any) => !p.ctaLabel,
    },

    // ---- Info columns + social
    showInfo: { type: ControlType.Boolean, title: "Info", defaultValue: true },
    columns: {
        type: ControlType.Array,
        title: "Columns",
        hidden: (p: any) => !p.showInfo,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    placeholder: "https://, mailto:, tel:",
                },
            },
        },
    },
    socialTitle: {
        type: ControlType.String,
        title: "Social title",
        hidden: (p: any) => !p.showInfo,
    },
    socials: {
        type: ControlType.Array,
        title: "Social",
        hidden: (p: any) => !p.showInfo,
        control: linkItem,
    },
    columnMinWidth: {
        type: ControlType.Number,
        title: "Column min",
        min: 140,
        max: 420,
        step: 10,
        unit: "px",
        hidden: (p: any) => !p.showInfo,
    },

    // ---- Bottom bar
    showBottomBar: {
        type: ControlType.Boolean,
        title: "Bottom bar",
        defaultValue: true,
    },
    copyright: {
        type: ControlType.String,
        title: "Copyright",
        description: "{year} becomes the current year.",
        hidden: (p: any) => !p.showBottomBar,
    },
    legalLinks: {
        type: ControlType.Array,
        title: "Legal links",
        hidden: (p: any) => !p.showBottomBar,
        control: linkItem,
    },
    showBackToTop: {
        type: ControlType.Boolean,
        title: "Back to top",
        defaultValue: true,
        hidden: (p: any) => !p.showBottomBar,
    },
    backToTopLabel: {
        type: ControlType.String,
        title: "Button label",
        description: "Accessibility label for the back-to-top button.",
        hidden: (p: any) => !p.showBottomBar || !p.showBackToTop,
    },

    // ---- Style
    background: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text" },
    mutedColor: { type: ControlType.Color, title: "Muted" },
    accent: { type: ControlType.Color, title: "Accent" },
    lineColor: { type: ControlType.Color, title: "Lines" },
    glow: { type: ControlType.Boolean, title: "Glow", defaultValue: true },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline font",
        controls: "extended",
        displayFontSize: false,
        defaultFontType: "sans-serif",
        defaultValue: { letterSpacing: "-0.04em", lineHeight: "1em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 17, lineHeight: "1.6em" },
    },
    headlineSize: {
        type: ControlType.Number,
        title: "Headline max",
        min: 48,
        max: 260,
        step: 2,
        unit: "px",
    },
    emailSize: {
        type: ControlType.Number,
        title: "Email max",
        min: 20,
        max: 120,
        step: 2,
        unit: "px",
    },
    verticalPadding: {
        type: ControlType.Number,
        title: "Padding top",
        min: 32,
        max: 260,
        step: 4,
        unit: "px",
    },

    // ---- Animation
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.4,
        max: 2.5,
        step: 0.1,
        displayStepper: true,
    },
    triggerAmount: {
        type: ControlType.Number,
        title: "Trigger",
        min: 0.05,
        max: 1,
        step: 0.05,
        description:
            "How much of the footer must be visible before the animation starts.",
    },
    once: { type: ControlType.Boolean, title: "Play once", defaultValue: true },
})
