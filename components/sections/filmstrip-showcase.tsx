
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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type ImageValue = { src?: string; srcSet?: string; alt?: string }
type FrameItem = {
    image?: ImageValue
    category: string
    title: string
    description: string
    cta: string
    link: string
}
type Props = {
    items: FrameItem[]
    initialFrame: number
    collectionLabel: string
    editionLabel: string
    photoCaption: string
    background: string
    panel: string
    textColor: string
    mutedColor: string
    accent: string
    radius: number
    grain: number
    imageShade: number
    speed: number
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: FrameItem[] = [
    {
        image: { src: "https://images.unsplash.com/photo-1723466372884-4bc078f7bfa8?auto=format&fit=crop&w=1600&q=85", alt: "Portrait lit by warm orange light" },
        category: "PORTFOLIO",
        title: "Make it personal.",
        description: "A space for your work, your story, and everything that makes it yours.",
        cta: "Create your site",
        link: "",
    },
    {
        image: { src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85", alt: "Warm architectural interior with sculptural furniture" },
        category: "CREATIVE STUDIO",
        title: "Give ideas a home.",
        description: "Bring your projects, people, and point of view together in one place.",
        cta: "Start building",
        link: "",
    },
    {
        image: { src: "https://images.unsplash.com/photo-1691698087336-f7f4d93a4443?auto=format&fit=crop&w=1600&q=85", alt: "Quiet architectural room with soft natural light" },
        category: "EDITORIAL JOURNAL",
        title: "Tell it your way.",
        description: "Collect moments, publish stories, and share what matters most.",
        cta: "Get started",
        link: "",
    },
]

const GRAIN = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.83' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='.7'/%3E%3C/svg%3E\")"
const SHEET = [
    ".fsg-root,.fsg-root *{box-sizing:border-box}",
    ".fsg-shell{display:grid;grid-template-columns:minmax(0,1.54fr) minmax(305px,.85fr);min-height:518px;gap:8px}",
    ".fsg-picture{min-width:0;min-height:518px;position:relative;overflow:hidden;background:#5b392e}",
    ".fsg-picturelink{position:absolute;inset:0;display:block;text-decoration:none;color:#fff;overflow:hidden}",
    ".fsg-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;user-select:none}",
    ".fsg-photo-top{position:absolute;top:25px;left:26px;right:26px;display:flex;justify-content:space-between;gap:18px;align-items:center;color:rgba(255,255,255,.9);z-index:3}",
    ".fsg-photo-bottom{position:absolute;left:26px;right:26px;bottom:27px;display:flex;justify-content:space-between;align-items:flex-end;gap:18px;z-index:3}",
    ".fsg-mini{font-family:Inter,Arial,sans-serif;font-size:10px;letter-spacing:.14em;font-weight:600;text-transform:uppercase}",
    ".fsg-cta{display:flex;align-items:center;gap:15px;padding:13px 15px 13px 19px;background:#F4F0E7;border-radius:99px;color:#26211C;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;white-space:nowrap;transition:transform .3s ease,background .3s ease}",
    ".fsg-cta svg{width:17px;height:17px;transition:transform .3s ease}",
    ".fsg-picturelink[href]:hover .fsg-cta{transform:translateY(-3px);background:#fff}",
    ".fsg-picturelink[href]:hover .fsg-cta svg{transform:translate(2px,-2px)}",
    ".fsg-picturelink[href]:focus-visible{outline:3px solid #F2D8A7;outline-offset:-5px}",
    ".fsg-panel{display:flex;flex-direction:column;min-width:0;padding:34px 30px 22px;overflow:hidden}",
    ".fsg-panel-header{display:flex;align-items:center;justify-content:space-between;gap:12px}",
    ".fsg-heading{margin:44px 0 0;letter-spacing:-.06em;line-height:1.04;max-width:350px;overflow-wrap:break-word}",
    ".fsg-description{margin:19px 0 0;max-width:320px;line-height:1.55}",
    ".fsg-menu{margin-top:auto;padding-top:32px;display:flex;flex-direction:column;gap:7px}",
    ".fsg-rule{height:1px;width:100%;background:currentColor;opacity:.18;margin-bottom:12px}",
    ".fsg-menu-title{display:flex;justify-content:space-between;align-items:center;margin:0 0 11px}",
    ".fsg-row{width:100%;border:1px solid transparent;background:transparent;display:flex;align-items:center;gap:13px;min-height:75px;padding:8px;text-align:left;text-decoration:none;font:inherit;color:inherit;cursor:pointer;border-radius:11px;transition:background .22s ease,border-color .22s ease}",
    ".fsg-row:not([data-active=true]):hover{background:rgba(30,25,20,.065)}",
    ".fsg-row[data-active=true]{background:rgba(30,25,20,.075);border-color:rgba(30,25,20,.085)}",
    ".fsg-row[data-active=true]:not([href]){cursor:default}",
    ".fsg-row:focus-visible{outline:2px solid currentColor;outline-offset:2px}",
    ".fsg-thumb{width:76px;height:56px;flex:0 0 76px;position:relative;border-radius:5px;overflow:hidden;background:#a28a75}",
    ".fsg-thumb img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.74) contrast(1.05);transition:filter .35s ease,transform .35s ease}",
    ".fsg-row:hover .fsg-thumb img{filter:saturate(1);transform:scale(1.07)}",
    ".fsg-rowmeta{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1}",
    ".fsg-rowtitle{font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:600;line-height:1.2}",
    ".fsg-rowsub{font-family:Inter,Arial,sans-serif;font-size:10px;letter-spacing:.1em;opacity:.54}",
    ".fsg-row-arrow{width:18px;height:18px;flex-shrink:0;opacity:.75}",
    "@container fsg (max-width: 790px){.fsg-shell{grid-template-columns:minmax(0,1fr);min-height:0}.fsg-picture{min-height:410px}.fsg-panel{padding:27px 24px 22px}.fsg-heading{margin-top:24px;max-width:560px}.fsg-description{max-width:560px;margin-top:12px}.fsg-menu{padding-top:29px}.fsg-menu-title{margin-bottom:9px}.fsg-row{min-height:68px}.fsg-thumb{width:68px;height:48px;flex-basis:68px}}",
    "@container fsg (max-width: 480px){.fsg-shell{gap:6px}.fsg-picture{min-height:335px}.fsg-panel{padding:24px 18px 18px}.fsg-photo-top{top:19px;left:18px;right:18px}.fsg-photo-bottom{left:18px;right:18px;bottom:20px}.fsg-cta{padding:11px 13px;font-size:11px;gap:9px}.fsg-heading{margin-top:21px}.fsg-menu{padding-top:22px;gap:5px}.fsg-row{padding:6px;gap:9px;min-height:64px}.fsg-thumb{width:59px;height:47px;flex-basis:59px}.fsg-rowtitle{font-size:12px}.fsg-rowsub{font-size:9px}.fsg-mini{font-size:9px}}",
    "@media(prefers-reduced-motion:reduce){.fsg-root *{transition:none!important;animation:none!important}}"
].join("\n")

function Arrow({className}:{className?:string}) {
    return <svg className={className} viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><path d="M4.5 15.5 15 5M6.8 5H15v8.2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 535
 */
export default function FilmstripShowcase(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        initialFrame = 1,
        collectionLabel = "THE COLLECTION",
        editionLabel = "EST. 2026",
        photoCaption = "A DIFFERENT WAY TO SHOW UP",
        background = "#201F1C",
        panel = "#EEE9DF",
        textColor = "#211F1B",
        mutedColor = "#716B63",
        accent = "#C76C46",
        radius = 19,
        grain = 0.22,
        imageShade = 0.24,
        speed = 0.65,
        titleFont,
        bodyFont,
        labelFont,
        style,
    } = props

    const safeItems = Array.isArray(items) && items.length ? items : DEFAULT_ITEMS
    const [selected, setSelected] = React.useState(() => Math.max(0, Math.floor(initialFrame) - 1))
    React.useEffect(() => {
        setSelected(Math.min(Math.max(0, Math.floor(initialFrame) - 1), safeItems.length - 1))
    }, [initialFrame, safeItems.length])

    const item = safeItems[Math.min(selected, safeItems.length - 1)]
    const staticRender = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const duration = staticRender || reduced ? 0 : Math.max(0, speed)
    const id = React.useId().replace(/[^a-z0-9]/gi, "")
    const link = typeof item.link === "string" ? item.link.trim() : ""
    const ordinal = String(selected + 1).padStart(2, "0")
    const count = String(safeItems.length).padStart(2, "0")
    const titleStyle: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: "clamp(35px, 4.3cqw, 56px)", fontWeight: 400, ...titleFont }
    const descStyle: React.CSSProperties = { fontFamily: "Inter, Arial, sans-serif", fontSize: 14, fontWeight: 400, ...bodyFont }
    const tinyStyle: React.CSSProperties = { fontFamily: "Inter, Arial, sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.11em", ...labelFont }

    const photograph = (
        <>
            <AnimatePresence initial={false}>
                {item.image?.src && <motion.img
                    key={String(selected) + item.image.src}
                    className="fsg-photo"
                    src={item.image.src}
                    srcSet={item.image.srcSet}
                    alt={item.image.alt || item.category || "Gallery photograph"}
                    draggable={false}
                    initial={duration ? { clipPath: "inset(0 100% 0 0)", scale: 1.06, opacity: 0.85 } : false}
                    animate={{ clipPath: "inset(0 0% 0 0)", scale: 1, opacity: 1 }}
                    exit={duration ? { opacity: 0, scale: 1.025 } : undefined}
                    transition={{ duration, ease: [0.25, 0.75, 0.2, 1] }}
                    style={{ position: "absolute", inset: 0 }}
                />}
            </AnimatePresence>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(0,0,0,.23),transparent 32%,rgba(0,0,0," + Math.max(0,Math.min(.85,imageShade + .28)) + "))", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:0, backgroundImage:GRAIN, backgroundSize:"175px 175px", mixBlendMode:"soft-light", opacity:Math.max(0,Math.min(.7,grain)), pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:0, bottom:0, left:0, width:"15%", background:"linear-gradient(90deg,rgba(240,113,49,.23),transparent)", mixBlendMode:"screen", pointerEvents:"none" }} />
            <div className="fsg-photo-top fsg-mini"><span>FILM / {ordinal}</span><span>FRAME {ordinal} / {count}</span></div>
            <div className="fsg-photo-bottom">
                <span className="fsg-mini" style={{ color:"#FFF", maxWidth:155, lineHeight:"1.6" }}>{photoCaption}</span>
                {link && <span className="fsg-cta">{item.cta || "Explore more"}<Arrow/></span>}
            </div>
        </>
    )
    const rootPhoto = link
        ? <a className="fsg-picturelink" href={link} target="_blank" rel="noopener noreferrer" aria-label={(item.cta || "Explore more") + " — " + item.category}>{photograph}</a>
        : <div className="fsg-picturelink">{photograph}</div>

    return <div className="fsg-root" data-filmstrip={id} style={{ width:"100%", height:"auto", minWidth:0, padding:8, borderRadius:radius, background, overflow:"hidden", containerType:"inline-size", containerName:"fsg", ...style } as React.CSSProperties}>
        <style>{SHEET}</style>
        <div className="fsg-shell">
            <div className="fsg-picture" style={{ borderRadius:Math.max(5,radius - 7) }}>{rootPhoto}</div>
            <div className="fsg-panel" style={{ borderRadius:Math.max(5,radius - 7), background:panel, color:textColor }}>
                <div className="fsg-panel-header" style={tinyStyle}>
                    <span>{collectionLabel}</span>
                    <span style={{ color:accent }}>{editionLabel}</span>
                </div>
                <div>
                    <div style={{ ...tinyStyle, color:accent, marginTop:34 }}>{item.category || "FEATURED STORY"} — {ordinal}</div>
                    <h2 className="fsg-heading" style={{ color:textColor, ...titleStyle }}>{item.title || "Make it yours."}</h2>
                    <p className="fsg-description" style={{ color:mutedColor, ...descStyle }}>{item.description || ""}</p>
                </div>
                <div className="fsg-menu">
                    <div className="fsg-rule"/>
                    <div className="fsg-menu-title" style={{ ...tinyStyle, color:mutedColor }}><span>CHOOSE A DIRECTION</span><span>{ordinal} / {count}</span></div>
                    {safeItems.map((entry,i) => {
                        const active = selected === i
                        const rowLink = typeof entry.link === "string" ? entry.link.trim() : ""
                        const contents = <>
                            <span className="fsg-thumb">
                                {entry.image?.src && <img src={entry.image.src} srcSet={entry.image.srcSet} alt="" draggable={false} loading="lazy"/>}
                                <span style={{ position:"absolute", inset:0, backgroundImage:GRAIN, backgroundSize:"120px 120px", opacity:Math.max(0,Math.min(.6,grain)), mixBlendMode:"soft-light", pointerEvents:"none" }}/>
                            </span>
                            <span className="fsg-rowmeta">
                                <span className="fsg-rowtitle">{entry.category || "Story"}</span>
                                <span className="fsg-rowsub">{String(i + 1).padStart(2, "0")} / {count}</span>
                            </span>
                            {active ? <Arrow className="fsg-row-arrow"/> : <span className="fsg-row-arrow" style={{ display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, opacity:.45 }}>+</span>}
                        </>
                        return active ? (rowLink
                            ? <a key={i} className="fsg-row" data-active="true" href={rowLink} target="_blank" rel="noopener noreferrer" aria-label={(entry.cta || "Explore") + " — " + entry.category}>{contents}</a>
                            : <div key={i} className="fsg-row" data-active="true" aria-current="true">{contents}</div>
                        ) : <button key={i} type="button" className="fsg-row" data-active="false" aria-label={"Show " + entry.category} aria-pressed="false" onClick={() => setSelected(i)}>{contents}</button>
                    })}
                </div>
            </div>
        </div>
    </div>
}

addPropertyControls(FilmstripShowcase, {
    items: {
        type: ControlType.Array,
        title: "Frames",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Photo" },
                category: { type: ControlType.String, title: "Category", defaultValue: "PORTFOLIO" },
                title: { type: ControlType.String, title: "Headline", defaultValue: "Make it personal." },
                description: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: "Your story deserves a space of its own." },
                cta: { type: ControlType.String, title: "CTA", defaultValue: "Create your site" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
        maxCount: 8,
    },
    initialFrame: { type: ControlType.Number, title: "Starting Frame", min: 1, max: 8, step: 1, defaultValue: 1 },
    collectionLabel: { type: ControlType.String, title: "Top Label", defaultValue: "THE COLLECTION" },
    editionLabel: { type: ControlType.String, title: "Edition Label", defaultValue: "EST. 2026" },
    photoCaption: { type: ControlType.String, title: "Photo Caption", defaultValue: "A DIFFERENT WAY TO SHOW UP" },
    background: { type: ControlType.Color, title: "Outer", defaultValue: "#201F1C" },
    panel: { type: ControlType.Color, title: "Panel", defaultValue: "#EEE9DF" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#211F1B" },
    mutedColor: { type: ControlType.Color, title: "Muted", defaultValue: "#716B63" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#C76C46" },
    radius: { type: ControlType.Number, title: "Corner Radius", min: 0, max: 48, step: 1, defaultValue: 19 },
    grain: { type: ControlType.Number, title: "Film Grain", min: 0, max: 0.7, step: 0.01, defaultValue: 0.22 },
    imageShade: { type: ControlType.Number, title: "Image Shade", min: 0, max: 0.6, step: 0.01, defaultValue: 0.24 },
    speed: { type: ControlType.Number, title: "Reveal Speed", min: 0, max: 1.5, step: 0.05, defaultValue: 0.65 },
    titleFont: { type: ControlType.Font, title: "Headline Font", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended" },
    labelFont: { type: ControlType.Font, title: "Label Font" },
})
