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


type ImageAsset = { src?: string; srcSet?: string; alt?: string }
type GalleryItem = {
    title: string
    shortTitle: string
    category: string
    image?: ImageAsset
    imagePosition: string
    accent: string
    ink: string
    ctaLabel?: string
    ctaDisclosure?: string
    link: string
}
interface Props {
    items: GalleryItem[]
    defaultActive: number
    cardHeight: number
    mobileHeight: number
    activeGrow: number
    gap: number
    radius: number
    speed: number
    background: string
    titleFont?: React.CSSProperties
    metaFont?: React.CSSProperties
    style?: React.CSSProperties
}
const DEFAULT_ITEMS: GalleryItem[] = [
    {
        title: "Electric Bloom", shortTitle: "Bloom", category: "ART DIRECTION",
        image: { src: "https://framerusercontent.com/images/ZYom7sDvii36W5rWknX2u0N2hA.jpg", alt: "Orange flowers lit in electric blue" },
        imagePosition: "50% 50%", accent: "#CEFF5A", ink: "#101010", ctaLabel: "View project", ctaDisclosure: "", link: "",
    },
    {
        title: "Cherry Pop", shortTitle: "Cherry", category: "PRODUCT STORY",
        image: { src: "https://framerusercontent.com/images/D2YSRd5YlIFq1xFUDLuBMgfhx9E.jpg", alt: "Pink handbag with a red sculptural object" },
        imagePosition: "50% 50%", accent: "#FFC4E0", ink: "#231223", ctaLabel: "View project", ctaDisclosure: "", link: "",
    },
    {
        title: "Acid Garden", shortTitle: "Garden", category: "EDITORIAL",
        image: { src: "https://framerusercontent.com/images/DzUUojc6Q6Y7dfMgM476ehL0hw.jpg", alt: "Pink flower and green stem on a pink background" },
        imagePosition: "50% 50%", accent: "#B9F887", ink: "#17341A", ctaLabel: "View project", ctaDisclosure: "", link: "",
    },
    {
        title: "Liquid Chrome", shortTitle: "Chrome", category: "IDENTITY",
        image: { src: "https://framerusercontent.com/images/XGugBk4dLo22B6gf1BiOEcxny3I.jpg", alt: "Swirling sculptural silver and orange forms" },
        imagePosition: "50% 50%", accent: "#B6ACFF", ink: "#1A123D", ctaLabel: "View project", ctaDisclosure: "", link: "",
    },
]
const baseTitle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "-0.055em",
    lineHeight: 1.04, fontSize: 31,
}
const baseMeta: React.CSSProperties = {
    fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 10,
    letterSpacing: "0.065em", lineHeight: 1.25,
}
const Arrow = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
        <path d="M3 13 13 3M5.5 3H13v7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 480
 */
export default function ColorFocusGallery(props: Props) {
    const {
        items = DEFAULT_ITEMS, defaultActive = 0, cardHeight = 480,
        mobileHeight = 640, activeGrow = 2.5, gap = 12, radius = 18,
        speed = 0.55, background = "#FFFFFF", titleFont, metaFont, style,
    } = props
    const isStatic = useIsStaticRenderer()
    const safeItems = Array.isArray(items) ? items : DEFAULT_ITEMS
    const clamp = (v: number) => Math.min(Math.max(v, 0), Math.max(0, safeItems.length - 1))
    const [activeIndex, setActiveIndex] = React.useState(() => clamp(defaultActive))
    React.useEffect(() => setActiveIndex(clamp(defaultActive)), [defaultActive, safeItems.length])
    const active = clamp(activeIndex)
    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const scope = "cfg-" + uid
    const selector = '[data-cfg="' + scope + '"]'
    const css = [
        "$C, $C * { box-sizing: border-box; }",
        "$C { container-type: inline-size; }",
        "$C .cfg-strip { display: flex; flex-direction: row; gap: var(--cfg-gap); height: var(--cfg-height); width: 100%; min-width: 0; }",
        "$C .cfg-card { position: relative; flex: 1 1 0px; min-width: 0; min-height: 0; overflow: hidden; border-radius: var(--cfg-radius); isolation: isolate; display: flex; flex-direction: column; background: var(--accent); color: var(--ink); outline: none; text-decoration: none; padding: 0; margin: 0; border: 0; -webkit-tap-highlight-color: transparent; transition: flex-grow var(--cfg-speed) cubic-bezier(.22,1,.36,1); }",
        "$C .cfg-card[data-active='true'] { flex-grow: var(--cfg-grow); }",
        "$C .cfg-card[data-active='false'] { cursor: pointer; appearance: none; text-align: left; }",
        "$C .cfg-hit { position: absolute; z-index: 4; inset: 0; width: 100%; height: 100%; border: 0; border-radius: var(--cfg-radius); background: transparent; color: inherit; cursor: pointer; display: block; -webkit-tap-highlight-color: transparent; }",
        "$C .cfg-hit:focus-visible { outline: 3px solid #111; outline-offset: -4px; }",
        "$C .cfg-card[data-linked='true'] { cursor: pointer; }",
        "$C .cfg-cta { position: absolute; right: 18px; bottom: 149px; z-index: 2; display: flex; align-items: center; gap: 14px; width: max-content; max-width: calc(100% - 36px); min-height: 53px; padding: 8px 9px 8px 17px; border-radius: 999px; background: #121212; color: #FFFFFF; box-shadow: 0 5px 18px rgba(0,0,0,.19), 0 1px 3px rgba(0,0,0,.08); pointer-events: none; opacity: 0; transform: translateY(10px) scale(.97); transition: opacity .17s ease, transform .24s cubic-bezier(.22,1,.36,1), box-shadow .24s ease; }",
        "$C .cfg-card[data-active='true'] .cfg-cta { opacity: 1; transform: translateY(0) scale(1); transition-delay: .09s; }",
        "$C .cfg-card[data-active='false'] .cfg-cta { transition-delay: 0s; }",
        "$C .cfg-cta-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }",
        "$C .cfg-cta-note { font: 600 9px/1.15 Inter,sans-serif; letter-spacing: .065em; color: rgba(255,255,255,.63); white-space: nowrap; }",
        "$C .cfg-cta-label { font: 600 13px/1.15 Inter,sans-serif; letter-spacing: -.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
        "$C .cfg-cta-icon { flex: 0 0 33px; width: 33px; height: 33px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #FFFFFF; color: #111111; transition: transform .35s cubic-bezier(.22,1,.36,1); }",
        "$C .cfg-card[data-active='true']:hover .cfg-cta { box-shadow: 0 9px 23px rgba(0,0,0,.25); }",
        "$C .cfg-card[data-linked='true']:hover .cfg-cta-icon { transform: rotate(45deg); }",
        "$C .cfg-image-wrap { position: relative; flex: 1 1 0; min-height: 0; overflow: hidden; background: var(--accent); }",
        "$C .cfg-image { display: block; position: absolute; width: 100%; height: 100%; inset: 0; object-fit: cover; transform: scale(1.07); transition: transform var(--cfg-speed) cubic-bezier(.22,1,.36,1), filter var(--cfg-speed) ease; }",
        "$C .cfg-card[data-active='true'] .cfg-image { transform: scale(1); }",
        "$C .cfg-card[data-active='false'] .cfg-image { filter: saturate(.86); }",
        "$C .cfg-card[data-active='false']:hover .cfg-image { transform: scale(1.025); filter: saturate(1); }",
        "$C .cfg-counter { position: absolute; left: 16px; top: 16px; width: 29px; height: 29px; border-radius: 99px; background: rgba(255,255,255,.96); color: #101010; display: flex; align-items: center; justify-content: center; font: 600 10px Inter, sans-serif; letter-spacing: -.015em; }",
        "$C .cfg-footer { position: relative; flex: 0 0 130px; width: 100%; min-width: 0; display: flex; flex-direction: column; align-items: stretch; justify-content: space-between; padding: 18px 19px 19px; background: var(--accent); overflow: hidden; transition: flex-basis var(--cfg-speed) cubic-bezier(.22,1,.36,1), padding var(--cfg-speed) cubic-bezier(.22,1,.36,1); }",
        "$C .cfg-meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .75; }",
        "$C .cfg-name { position: relative; height: 37px; flex: 0 0 37px; white-space: nowrap; min-width: 0; width: 100%; }",
        "$C .cfg-title { position: absolute; bottom: 0; left: 0; margin: 0; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 1; transform: translateY(0); transition: opacity .24s ease, transform .44s cubic-bezier(.22,1,.36,1); }",
        "$C .cfg-short { margin: 0; display: block; font: 600 19px/1.1 Inter, sans-serif; letter-spacing: -.045em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; position: absolute; left: 0; bottom: 0; width: 100%; opacity: 1; transform: translateY(0); transition: opacity .24s ease, transform .44s cubic-bezier(.22,1,.36,1); }",
        "$C .cfg-card[data-active='true'] .cfg-short { opacity: 0; transform: translateY(8px); }",
        "$C .cfg-card[data-active='false'] .cfg-title { opacity: 0; transform: translateY(8px); }",
        "$C .cfg-action { position: absolute; right: 16px; top: 15px; width: 29px; height: 29px; display: flex; align-items: center; justify-content: center; border: 1px solid currentColor; border-radius: 99px; }",
        "$C .cfg-card[data-active='false'] .cfg-action { display: none; }",
        "$C .cfg-card[data-active='true'] .cfg-image-wrap:after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg,rgba(0,0,0,.06),transparent 36%); pointer-events: none; }",
        "@container (max-width: 700px) {",
        "  $C .cfg-strip { flex-direction: column; height: var(--cfg-mobile-height); }",
        "  $C .cfg-card { flex: 1 1 0px; }",
        "  $C .cfg-card[data-active='true'] { flex-grow: 5.1; }",
        "  $C .cfg-footer { flex-basis: 112px; padding: 15px 18px; }",
        "  $C .cfg-card[data-active='false'] .cfg-footer { flex: 0 0 53px; padding: 14px 18px; justify-content: center; }",
        "  $C .cfg-card[data-active='false'] .cfg-meta { display: none; }",
        "  $C .cfg-card[data-active='false'] .cfg-short { font-size: 17px; }",
        "  $C .cfg-card[data-active='false'] .cfg-counter { display: none; }",
        "  $C .cfg-title { font-size: 26px !important; }",
        "  $C .cfg-cta { bottom: 131px; }",
        "}",
        "@container (max-width: 410px) {",
        "  $C .cfg-card[data-active='true'] { flex-grow: 4.2; }",
        "  $C .cfg-title { font-size: 23px !important; }",
        "}",
        "@media (prefers-reduced-motion: reduce) { $C .cfg-card, $C .cfg-image, $C .cfg-footer, $C .cfg-title, $C .cfg-short, $C .cfg-cta, $C .cfg-cta-icon { transition: none !important; } }",
        "$C[data-static='true'] .cfg-card, $C[data-static='true'] .cfg-image, $C[data-static='true'] .cfg-footer, $C[data-static='true'] .cfg-title, $C[data-static='true'] .cfg-short, $C[data-static='true'] .cfg-cta, $C[data-static='true'] .cfg-cta-icon { transition: none !important; }",
    ].join("\n").replace(/\$C/g, selector)
    const rootStyle = {
        width: "100%", height: "auto", ...style, minWidth: 0, boxSizing: "border-box",
        background, padding: 0, display: "block",
        "--cfg-height": Math.max(240, cardHeight) + "px",
        "--cfg-mobile-height": Math.max(360, mobileHeight) + "px",
        "--cfg-grow": Math.max(1.2, activeGrow),
        "--cfg-gap": Math.max(0, gap) + "px",
        "--cfg-radius": Math.max(0, radius) + "px",
        "--cfg-speed": Math.max(0.08, speed) + "s",
    } as React.CSSProperties
    if (!safeItems.length) return <div style={{ ...rootStyle, padding: 24 }}>Add gallery items in the properties panel.</div>
    return (
        <div data-cfg={scope} data-static={isStatic ? "true" : "false"} style={rootStyle}>
            <style>{css}</style>
            <div className="cfg-strip">
                {safeItems.map((item, index) => {
                    const selected = index === active
                    const link = (item.link || "").trim()
                    const linked = selected && Boolean(link)
                    const photo = item.image?.src || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length]?.image?.src || ""
                    const variables = { "--accent": item.accent || "#CEFF5A", "--ink": item.ink || "#111111" } as React.CSSProperties
                    const content = (
                        <>
                            <div className="cfg-image-wrap">
                                {photo && <img
                                    className="cfg-image"
                                    src={photo}
                                    srcSet={item.image?.srcSet}
                                    alt={item.image?.alt || item.title}
                                    draggable={false}
                                    loading={index > 1 ? "lazy" : "eager"}
                                    style={{ objectPosition: item.imagePosition || "50% 50%" }}
                                />}
                                <span className="cfg-counter" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                                
                            </div>
                            <div className="cfg-footer">
                                <span className="cfg-meta" style={{ ...baseMeta, ...metaFont }}>{item.category}</span>
                                <div className="cfg-name">
                                    <h3 className="cfg-title" style={{ ...baseTitle, ...titleFont }}>{item.title}</h3>
                                    <span className="cfg-short">{item.shortTitle || item.title}</span>
                                </div>

                            </div>
                        </>
                    )
                    const common = {
                        className: "cfg-card",
                        style: variables,
                        "data-active": selected ? "true" : "false",
                        "data-linked": linked ? "true" : "false",
                        "aria-label": item.title,
                        onPointerEnter: !isStatic ? (event: React.PointerEvent<HTMLDivElement>) => {
                            if (event.pointerType === "mouse" || event.pointerType === "pen") {
                                setActiveIndex(index)
                            }
                        } : undefined,
                    }
                    return (
                        <div {...common} key={index} role="group">
                            {content}
                            {Boolean(link) && (
                                <span className="cfg-cta" aria-hidden="true">
                                    <span className="cfg-cta-copy">
                                        {item.ctaDisclosure && <span className="cfg-cta-note">{item.ctaDisclosure}</span>}
                                        <span className="cfg-cta-label">{item.ctaLabel || "Explore"}</span>
                                    </span>
                                    <span className="cfg-cta-icon"><Arrow /></span>
                                </span>
                            )}
                            {linked ? (
                                <a className="cfg-hit" href={link} target="_blank" rel="noopener noreferrer"
                                    aria-label={(item.ctaLabel || "Explore") + ": " + item.title + " — partner link (new tab)"}>
                                </a>
                            ) : !selected ? (
                                <button className="cfg-hit" type="button" aria-label={"Select " + item.title}
                                    onClick={isStatic ? undefined : () => setActiveIndex(index)} />
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ColorFocusGallery, {
    items: {
        type: ControlType.Array, title: "Projects", defaultValue: DEFAULT_ITEMS, maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "New Project" },
                shortTitle: { type: ControlType.String, title: "Short Title", defaultValue: "Project" },
                category: { type: ControlType.String, title: "Category", defaultValue: "PROJECT" },
                ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "View project" },
                ctaDisclosure: { type: ControlType.String, title: "CTA Caption", defaultValue: "" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imagePosition: { type: ControlType.String, title: "Image Focus", defaultValue: "50% 50%" },
                accent: { type: ControlType.Color, title: "Panel Color", defaultValue: "#CEFF5A" },
                ink: { type: ControlType.Color, title: "Text Color", defaultValue: "#111111" },
                link: { type: ControlType.Link, title: "Project Link", defaultValue: "" },
            },
        },
    },
    defaultActive: { type: ControlType.Number, title: "Open Item", defaultValue: 0, min: 0, max: 11, step: 1 },
    cardHeight: { type: ControlType.Number, title: "Desktop Height", defaultValue: 480, min: 260, max: 850, step: 10, unit: "px" },
    mobileHeight: { type: ControlType.Number, title: "Mobile Height", defaultValue: 640, min: 360, max: 850, step: 10, unit: "px" },
    activeGrow: { type: ControlType.Number, title: "Expand Amount", defaultValue: 2.5, min: 1.2, max: 6, step: 0.1 },
    gap: { type: ControlType.Number, title: "Card Gap", defaultValue: 12, min: 0, max: 40, unit: "px" },
    radius: { type: ControlType.Number, title: "Corner Radius", defaultValue: 18, min: 0, max: 60, unit: "px" },
    speed: { type: ControlType.Number, title: "Motion Speed", defaultValue: 0.55, min: 0.08, max: 1.5, step: 0.05, unit: "s" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended" },
    metaFont: { type: ControlType.Font, title: "Label Font", controls: "extended" },
})