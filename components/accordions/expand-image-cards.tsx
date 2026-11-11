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


type ResponsiveImage = { src?: string; srcSet?: string; alt?: string }

type AudienceItem = {
    eyebrow: string
    title: string
    description: string
    image?: ResponsiveImage
    imagePosition: string
    cta: string
    link: string
    tint: string
}

type Props = {
    items: AudienceItem[]
    defaultActive: number
    gap: number
    cardHeight: number
    mobileClosedHeight: number
    mobileOpenHeight: number
    activeWeight: number
    radius: number
    padding: number
    duration: number
    imageZoom: number
    overlayStrength: number
    background: string
    textColor: string
    labelColor: string
    ctaBackground: string
    ctaText: string
    focusColor: string
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    ctaFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: AudienceItem[] = [
    {
        eyebrow: "01 / FOR CREATORS",
        title: "Portfolios.",
        description: "Give your best work the space it deserves. A personal website, completely your own.",
        image: {
            src: "https://images.unsplash.com/photo-1750857740680-d4c2823dd51e?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1000",
            alt: "Creative portrait by the water",
        },
        imagePosition: "50% 46%",
        cta: "Create Your Site",
        link: "",
        tint: "#626458",
    },
    {
        eyebrow: "02 / FOR STUDIOS",
        title: "Studios.",
        description: "Show what makes your practice different with a portfolio as thoughtful as your projects.",
        image: {
            src: "https://images.unsplash.com/photo-1680786693504-f67cf0ae4492?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1000",
            alt: "Sculptural green design object",
        },
        imagePosition: "50% 50%",
        cta: "Get Started",
        link: "",
        tint: "#57765B",
    },
    {
        eyebrow: "03 / FOR BUSINESSES",
        title: "Businesses.",
        description: "Build a confident digital home for your next big idea, from first impression to launch.",
        image: {
            src: "https://images.unsplash.com/photo-1692305416355-dd61ca199c8e?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
            alt: "Sculptural black furniture with a terracotta accent",
        },
        imagePosition: "50% 54%",
        cta: "Create Your Site",
        link: "",
        tint: "#585955",
    },
]

const CSS = [
    ".aec-root, .aec-root * { box-sizing: border-box; }",
    ".aec-root { container-type: inline-size; isolation: isolate; }",
    ".aec-row { display: flex; align-items: stretch; gap: var(--aec-gap); height: var(--aec-desktop-height); min-width: 0; }",
    ".aec-card { min-width: 0; height: 100%; overflow: hidden; flex-basis: 0; position: relative; border-radius: var(--aec-radius); isolation: isolate; clip-path: inset(0 round var(--aec-radius)); -webkit-clip-path: inset(0 round var(--aec-radius)); background: #666; transition: flex-grow var(--aec-duration) cubic-bezier(.22,1,.36,1); }",
    ".aec-card-surface { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; clip-path: inset(0 round var(--aec-radius)); -webkit-clip-path: inset(0 round var(--aec-radius)); contain: paint; }",
    ".aec-card[data-active='true'] { flex-grow: var(--aec-weight); }",
    ".aec-card[data-active='false'] { flex-grow: 1; }",
    ".aec-cover { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block; user-select: none; transform: scale(1); transition: transform calc(var(--aec-duration) * 1.65) cubic-bezier(.22,1,.36,1); }",
    ".aec-card[data-active='true']:hover .aec-cover { transform: scale(var(--aec-zoom)); }",
    ".aec-scrim { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: linear-gradient(180deg, rgba(0,0,0,.25) 0%,rgba(0,0,0,.02) 33%,rgba(0,0,0,.25) 54%,rgba(0,0,0,.76) 100%); }",
    ".aec-tint { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: var(--aec-overlay); mix-blend-mode: multiply; }",
    ".aec-interactive { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit; border: 0; text-decoration: none; color: inherit; text-align: left; background: transparent; cursor: default; padding: 0; display: block; -webkit-tap-highlight-color: transparent; appearance: none; }",
    ".aec-card[data-active='false'] .aec-interactive { cursor: default; pointer-events: none; }",
    ".aec-select-overlay { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit; z-index: 3; background: transparent; border: 0; padding: 0; appearance: none; -webkit-tap-highlight-color: transparent; cursor: pointer; }",
    ".aec-select-overlay:focus-visible { outline: 3px solid var(--aec-focus); outline-offset: -5px; border-radius: var(--aec-radius); }",
    ".aec-card[data-active='true'] .aec-select-overlay { visibility: hidden; pointer-events: none; }",
    ".aec-card[data-active='true'][data-linked='true'] .aec-interactive { cursor: pointer; }",
    ".aec-interactive:focus-visible { outline: 3px solid var(--aec-focus); outline-offset: -5px; border-radius: var(--aec-radius); }",
    ".aec-content { position: absolute; inset: 0; display: flex; flex-direction: column; padding: var(--aec-padding); min-width: 0; color: var(--aec-text); pointer-events: none; }",
    ".aec-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; }",
    ".aec-eyebrow { display: block; margin: 0; color: var(--aec-label); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".aec-eyebrow-short { display: none; }",
    "@container (min-width: 701px) and (max-width: 1000px) { .aec-card[data-active='false'] .aec-eyebrow-full { display: none; } .aec-card[data-active='false'] .aec-eyebrow-short { display: inline; } }",
    ".aec-icon { display: grid; place-items: center; border: 1px solid rgba(255,255,255,.52); color: #fff; border-radius: 100px; width: 35px; height: 35px; flex: 0 0 auto; transition: transform var(--aec-duration) ease, background var(--aec-duration) ease; }",
    ".aec-card[data-active='true'] .aec-icon { transform: rotate(45deg); background: rgba(255,255,255,.13); }",
    ".aec-bottom { margin-top: auto; width: 100%; min-width: 0; }",
    ".aec-title-shell { display: block; position: relative; height: 1.12em; width: 100%; min-width: 0; }",
    ".aec-title { display: block; position: absolute; left: 0; bottom: 0; margin: 0; font-size: inherit; font-weight: inherit; line-height: inherit; letter-spacing: inherit; white-space: nowrap; width: max-content; max-width: none; transform-origin: left bottom; transform: translateZ(0) scale(.64); transition: transform var(--aec-duration) cubic-bezier(.22,1,.36,1); }",
    ".aec-card[data-active='true'] .aec-title { transform: translateZ(0) scale(1); }",
    ".aec-reveal { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .46s cubic-bezier(.22,1,.36,1); }",
    ".aec-reveal-inner { min-height: 0; overflow: hidden; }",
    ".aec-description { display: block; max-width: 330px; margin: 12px 0 0; line-height: 1.45; opacity: 0; transform: translate3d(0, 10px, 0); transition: opacity .30s ease, transform .42s cubic-bezier(.22,1,.36,1); }",
    ".aec-card[data-active='true'] .aec-reveal { grid-template-rows: 1fr; transition-delay: calc(var(--aec-duration) * .32); }",
    ".aec-card[data-active='true'] .aec-description { opacity: 1; transform: translate3d(0, 0, 0); transition-delay: calc(var(--aec-duration) * .53); }",
    ".aec-cta { width: max-content; max-width: 100%; min-height: 45px; display: inline-flex; align-items: center; justify-content: space-between; gap: 22px; margin-top: 25px; padding: 11px 15px 11px 18px; background: var(--aec-cta-bg); color: var(--aec-cta-text); border-radius: 100px; opacity: 0; transform: translateY(12px); transition: opacity .4s ease, transform .48s cubic-bezier(.22,1,.36,1); }",
    ".aec-card[data-active='true'] .aec-cta { opacity: 1; transform: translate3d(0, 0, 0); transition-delay: calc(var(--aec-duration) * .65); }",
    ".aec-arrow { display: inline-flex; flex: 0 0 auto; align-items: center; transition: transform .3s ease; }",
    ".aec-card[data-linked='true']:hover .aec-arrow { transform: translate(3px,-3px); }",
    ".aec-card[data-active='false']:hover .aec-icon { background: rgba(255,255,255,.22); }",
    "@container (min-width: 701px) { .aec-card[data-active='false'] .aec-title { transform: translateZ(0) scale(.64); } }",
    "@container (max-width: 700px) {",
    "  .aec-row { flex-direction: column; height: auto; }",
    "  .aec-card { width: 100%; height: var(--aec-mobile-closed); flex: none !important; transition: height var(--aec-duration) cubic-bezier(.22,1,.36,1); }",
    "  .aec-card[data-active='true'] { height: var(--aec-mobile-open); }",
    "  .aec-content { padding: min(var(--aec-padding), 25px); }",
    "  .aec-eyebrow { font-size: 10px !important; letter-spacing: .06em !important; }",
    "  .aec-icon { width: 30px; height: 30px; }",
    "  .aec-title-shell { font-size: clamp(24px, 6.8cqw, 36px) !important; line-height: 1.08 !important; }",
    "  .aec-title { transform: none !important; }",
    "  .aec-description { font-size: 14px !important; max-width: 400px; margin-top: 8px; }",
    "  .aec-cta { margin-top: 16px; min-height: 42px; }",
    "}",
    "@media (prefers-reduced-motion: reduce) { .aec-root *, .aec-root *::before, .aec-root *::after { transition: none !important; animation: none !important; } }",
    ".aec-root[data-static='true'] *, .aec-root[data-static='true'] *::before { transition: none !important; }",
].join("\n")

function Arrow() {
    return <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4.5 15.5 15.5 4.5M6 4.5h9.5V14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function Plus() {
    return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
}

const TITLE_FONT: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "38px", lineHeight: "1.06", letterSpacing: "-0.05em" }
const BODY_FONT: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "15px", lineHeight: "1.45", letterSpacing: "-0.015em" }
const LABEL_FONT: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "11px", lineHeight: "1.3", letterSpacing: "0.065em" }
const CTA_FONT: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", lineHeight: "1.25", letterSpacing: "-0.01em" }

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 510
 */
export default function AudienceExpandCards(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        defaultActive = 0,
        gap = 12,
        cardHeight = 500,
        mobileClosedHeight = 112,
        mobileOpenHeight = 340,
        activeWeight = 2.6,
        radius = 19,
        padding = 25,
        duration = 0.64,
        imageZoom = 1.055,
        overlayStrength = 0.20,
        background = "#F4F3F0",
        textColor = "#FFFFFF",
        labelColor = "#FFFFFF",
        ctaBackground = "#E2FA9B",
        ctaText = "#142019",
        focusColor = "#DDFC90",
        titleFont, bodyFont, labelFont, ctaFont, style,
    } = props

    const isStatic = useIsStaticRenderer()
    const safeItems = Array.isArray(items) && items.length ? items : DEFAULT_ITEMS
    const clamp = (n: number) => Math.min(safeItems.length - 1, Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)))
    const [activeIndex, setActiveIndex] = React.useState(() => clamp(defaultActive))
    const reactId = React.useId()
    const detailRefs = React.useRef<(HTMLAnchorElement | HTMLDivElement | null)[]>([])
    const pendingKeyboardFocus = React.useRef<number | null>(null)
    React.useEffect(() => setActiveIndex(clamp(defaultActive)), [defaultActive, safeItems.length])
    const selected = clamp(activeIndex)
    React.useEffect(() => {
        const targetIndex = pendingKeyboardFocus.current
        if (targetIndex === null || targetIndex !== selected) return
        pendingKeyboardFocus.current = null
        detailRefs.current[targetIndex]?.focus({ preventScroll: true })
    }, [selected])
    const variables = {
        "--aec-gap": Math.max(0, gap) + "px",
        "--aec-desktop-height": Math.max(1, cardHeight) + "px",
        "--aec-radius": Math.max(0, radius) + "px",
        "--aec-padding": Math.max(12, padding) + "px",
        "--aec-duration": Math.max(0, duration) + "s",
        "--aec-weight": String(Math.max(1.2, activeWeight)),
        "--aec-zoom": String(Math.max(1, imageZoom)),
        "--aec-overlay": String(Math.max(0, Math.min(0.75, overlayStrength))),
        "--aec-text": textColor,
        "--aec-label": labelColor,
        "--aec-cta-bg": ctaBackground,
        "--aec-cta-text": ctaText,
        "--aec-focus": focusColor,
        "--aec-mobile-closed": Math.max(90, mobileClosedHeight) + "px",
        "--aec-mobile-open": Math.max(250, mobileOpenHeight) + "px",
    } as React.CSSProperties

    return (
        <div className="aec-root" data-static={isStatic ? "true" : "false"} style={{ width: "100%", height: "auto", minHeight: 1, minWidth: 0, background, padding: 0, ...style, ...variables }}>
            <style>{CSS}</style>
            <div className="aec-row" style={{ minHeight: Math.max(1, cardHeight) }}>
                {safeItems.map((item, index) => {
                    const active = index === selected
                    const url = typeof item.link === "string" ? item.link.trim() : ""
                    const linked = active && Boolean(url)
                    const image = item.image?.src
                    const detailsId = reactId + "-details-" + index
                    const content = (
                        <>
                            {image ? <img className="aec-cover" src={image} srcSet={item.image?.srcSet} alt={active ? (item.image?.alt || item.title) : ""} draggable={false} style={{ objectPosition: item.imagePosition || "50% 50%" }} /> : null}
                            <span className="aec-tint" aria-hidden="true" style={{ backgroundColor: item.tint || "#343434" }} />
                            <span className="aec-scrim" aria-hidden="true" />
                            <div className="aec-content">
                                <div className="aec-top">
                                    <p className="aec-eyebrow" style={{ ...LABEL_FONT, ...labelFont }}><span className="aec-eyebrow-full">{item.eyebrow}</span><span className="aec-eyebrow-short" aria-hidden="true">{String(item.eyebrow || "").split("/")[0].trim()}</span></p>
                                    <span className="aec-icon" aria-hidden="true"><Plus /></span>
                                </div>
                                <div className="aec-bottom">
                                    <div className="aec-title-shell" style={{ ...TITLE_FONT, ...titleFont }}><h3 className="aec-title">{item.title}</h3></div>
                                    <div className="aec-reveal" id={detailsId} aria-hidden={!active}>
                                        <div className="aec-reveal-inner">
                                            <p className="aec-description" style={{ ...BODY_FONT, ...bodyFont }}>{item.description}</p>
                                            {url && item.cta ? <span className="aec-cta" style={{ ...CTA_FONT, ...ctaFont }}><span>{item.cta}</span><span className="aec-arrow"><Arrow /></span></span> : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                    return (
                        <article key={index} className="aec-card" data-active={active ? "true" : "false"} data-linked={linked ? "true" : "false"} style={{ backgroundColor: item.tint || "#555555", flexGrow: active ? Math.max(1.2, activeWeight) : 1, borderRadius: Math.max(0, radius), clipPath: "inset(0px round " + Math.max(0, radius) + "px)" }}>
                            <div className="aec-card-surface">
                            {url ? (
                                <a ref={(element) => { detailRefs.current[index] = element }} className="aec-interactive" href={url} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1} aria-hidden={!active} aria-label={item.title + (item.cta ? " — " + item.cta : "")}>{content}</a>
                            ) : (
                                <div ref={(element) => { detailRefs.current[index] = element }} className="aec-interactive" role="group" aria-label={item.title + " details"} aria-hidden={!active} tabIndex={-1}>{content}</div>
                            )}
                            <button type="button" className="aec-select-overlay" disabled={active} tabIndex={active ? -1 : 0} aria-hidden={active} aria-expanded={active} aria-controls={detailsId} aria-label={"Expand " + item.title} onClick={(event) => { if (event.detail === 0) pendingKeyboardFocus.current = index; setActiveIndex(index) }} />
                            </div>
                        </article>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(AudienceExpandCards, {
    items: {
        type: ControlType.Array, title: "Audiences", defaultValue: DEFAULT_ITEMS, maxCount: 6,
        control: { type: ControlType.Object, controls: {
            eyebrow: { type: ControlType.String, title: "Category", defaultValue: "FOR CREATORS" },
            title: { type: ControlType.String, title: "Headline", defaultValue: "Portfolios." },
            description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "Build a site that feels like you." },
            image: { type: ControlType.ResponsiveImage, title: "Photo" },
            imagePosition: { type: ControlType.String, title: "Photo Position", defaultValue: "50% 50%" },
            cta: { type: ControlType.String, title: "CTA", defaultValue: "Create Your Site" },
            link: { type: ControlType.Link, title: "CTA Link", defaultValue: "" },
            tint: { type: ControlType.Color, title: "Image Tint", defaultValue: "#777777" },
        }}
    },
    defaultActive: { type: ControlType.Number, title: "Open Card", defaultValue: 0, min: 0, max: 5, step: 1 },
    gap: { type: ControlType.Number, title: "Card Gap", defaultValue: 12, min: 0, max: 40, unit: "px" },
    cardHeight: { type: ControlType.Number, title: "Desktop Height", defaultValue: 500, min: 280, max: 780, unit: "px" },
    mobileClosedHeight: { type: ControlType.Number, title: "Mobile Closed", defaultValue: 112, min: 90, max: 200, unit: "px" },
    mobileOpenHeight: { type: ControlType.Number, title: "Mobile Open", defaultValue: 340, min: 250, max: 600, unit: "px" },
    activeWeight: { type: ControlType.Number, title: "Open Width", defaultValue: 2.6, min: 1.2, max: 5, step: 0.1 },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 19, min: 0, max: 48, unit: "px" },
    padding: { type: ControlType.Number, title: "Inner Padding", defaultValue: 25, min: 12, max: 52, unit: "px" },
    duration: { type: ControlType.Number, title: "Animation", defaultValue: 0.64, min: 0, max: 1.4, step: 0.02, unit: "s" },
    imageZoom: { type: ControlType.Number, title: "Photo Zoom", defaultValue: 1.055, min: 1, max: 1.3, step: 0.005 },
    overlayStrength: { type: ControlType.Number, title: "Photo Tint", defaultValue: 0.20, min: 0, max: 0.75, step: 0.01 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F4F3F0" },
    textColor: { type: ControlType.Color, title: "Title Color", defaultValue: "#FFFFFF" },
    labelColor: { type: ControlType.Color, title: "Label Color", defaultValue: "#FFFFFF" },
    ctaBackground: { type: ControlType.Color, title: "CTA Fill", defaultValue: "#E2FA9B" },
    ctaText: { type: ControlType.Color, title: "CTA Text", defaultValue: "#142019" },
    focusColor: { type: ControlType.Color, title: "Focus Ring", defaultValue: "#DDFC90" },
    titleFont: { type: ControlType.Font, title: "Headline Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "38px", variant: "Medium", letterSpacing: "-0.05em", lineHeight: "1.06em" } },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "15px", variant: "Regular", lineHeight: "1.45em" } },
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "11px", variant: "Semibold", letterSpacing: "0.065em" } },
    ctaFont: { type: ControlType.Font, title: "CTA Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "13px", variant: "Semibold" } },
})
