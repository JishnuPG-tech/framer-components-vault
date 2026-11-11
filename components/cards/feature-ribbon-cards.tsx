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

import { motion, useReducedMotion } from "framer-motion"

type Picture = { src?: string; srcSet?: string; alt?: string }
type RibbonItem = {
    image?: Picture
    eyebrow: string
    title: string
    description: string
    cta: string
    link: string
    accent: string
}
interface Props {
    items: RibbonItem[]
    initialCard: number
    gap: number
    padding: number
    radius: number
    overlay: number
    background: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
    duration: number
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: RibbonItem[] = [
    {
        image: {
            src: "https://images.unsplash.com/photo-1777973320712-487d1d406f07?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900",
            alt: "Abstract sculptural blue metallic forms",
        },
        eyebrow: "01 / DESIGN",
        title: "Create freely.",
        description: "Give every idea a space to become something real. Start with a blank canvas and make it yours.",
        cta: "Get Started",
        link: "",
        accent: "#BDFF7A",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1492760864391-753aaae87234?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900",
            alt: "Sculptural terracotta-red architectural staircase",
        },
        eyebrow: "02 / EXPRESS",
        title: "Make it bold.",
        description: "Express your point of view with a website that looks and feels unmistakably yours.",
        cta: "Discover More",
        link: "",
        accent: "#FFEAA8",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1735231830864-adde00c280d8?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900",
            alt: "Ruby red glass vase photographed in natural light",
        },
        eyebrow: "03 / LAUNCH",
        title: "Go live.",
        description: "From the very first concept to a finished website, put your best work out into the world.",
        cta: "Start Building",
        link: "",
        accent: "#F4BCF5",
    },
]

const CSS = [
    ".frc-root{container-type:inline-size;container-name:frc}",
    ".frc-root,.frc-root *{box-sizing:border-box}",
    ".frc-strip{display:flex;width:100%;height:100%;align-items:stretch;min-width:0}",
    ".frc-card{position:relative;min-width:0;flex-basis:0;flex-shrink:1;isolation:isolate;overflow:hidden;outline:none;}",
    ".frc-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;user-select:none;pointer-events:none}",
    ".frc-card::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.27) 0%,rgba(0,0,0,.02) 36%,rgba(0,0,0,.10) 55%,rgba(0,0,0,.74) 100%);z-index:1}",
    ".frc-top{position:absolute;z-index:3;top:23px;left:23px;right:23px;display:flex;align-items:center;justify-content:space-between;gap:10px}",
    ".frc-index{font-size:10px;line-height:1.3;letter-spacing:.1em;font-weight:650;color:#fff;white-space:nowrap}",
    ".frc-icon{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.65);border-radius:50%;color:#fff;flex-shrink:0}",
    ".frc-bottom{position:absolute;z-index:3;left:25px;right:25px;bottom:26px;pointer-events:none}",
    ".frc-title{margin:0;letter-spacing:-.055em;line-height:1.01;max-width:590px;overflow-wrap:normal}",
    ".frc-detail{overflow:hidden;transition:max-height .48s cubic-bezier(.2,.75,.2,1),opacity .3s ease,margin .45s ease}",
    ".frc-description{margin:15px 0 0;max-width:440px;line-height:1.5;}",
    ".frc-action{display:inline-flex;align-items:center;justify-content:space-between;gap:28px;padding:13px 16px;min-height:44px;margin-top:24px;border-radius:100px;font-weight:600;font-size:12px;letter-spacing:-.01em;white-space:nowrap}",
    ".frc-card[data-linked='true']{cursor:pointer}",
    ".frc-card[data-selectable='true']{cursor:pointer}",
    ".frc-card:focus-within{outline:3px solid #B5FF76;outline-offset:-5px}",
    ".frc-card:focus-within .frc-icon{background:rgba(255,255,255,.2)}",
    ".frc-card[data-selectable='true']:hover .frc-icon{background:rgba(255,255,255,.22);transform:rotate(-45deg)}",
    ".frc-icon{transition:background .25s ease,transform .3s ease}",
    "@container frc (max-width: 700px){",
    " .frc-strip{flex-direction:column}",
    " .frc-card{flex-basis:auto!important;flex-grow:0!important;flex-shrink:0!important;height:86px!important;transition:height .58s cubic-bezier(.18,.72,.22,1)}",
    " .frc-card[data-active='true']{height:calc(100% - ((var(--frc-count) - 1) * 86px) - ((var(--frc-count) - 1) * var(--frc-gap)))!important}",
    " .frc-top{top:16px;left:18px;right:18px}",
    " .frc-icon{width:30px;height:30px}",
    " .frc-bottom{left:20px;right:20px;bottom:18px}",
    " .frc-title{font-size:25px!important;line-height:1.03}",
    " .frc-card[data-active='true'] .frc-title{font-size:34px!important}",
    " .frc-description{font-size:13px!important;line-height:1.42;margin-top:12px}",
    " .frc-action{margin-top:18px;padding:12px 14px}",
    " .frc-index{font-size:9px}",
    "}",
    "@media (prefers-reduced-motion:reduce){.frc-root *, .frc-root *::after{transition:none!important;animation:none!important}}",
].join("\n")

function Arrow() {
    return (
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3.5 10H16M10 4L16 10L10 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1130
 * @framerIntrinsicHeight 520
 */
export default function FeatureRibbonCards(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        initialCard = 1,
        gap = 12,
        padding = 12,
        radius = 18,
        overlay = 0.12,
        background = "#F3F2EE",
        textColor = "#FFFFFF",
        buttonColor = "#FFFFFF",
        buttonTextColor = "#161616",
        duration = 0.6,
        titleFont,
        bodyFont,
        labelFont,
        style,
    } = props

    const safeItems = Array.isArray(items) && items.length ? items : DEFAULT_ITEMS
    const [activeIndex, setActiveIndex] = React.useState(() => Math.min(Math.max(0, initialCard - 1), safeItems.length - 1))
    const selected = Math.min(activeIndex, safeItems.length - 1)
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const instant = staticRenderer || reducedMotion
    const transition = instant ? { duration: 0 } : {
        type: "spring" as const, stiffness: 185 / Math.max(0.3, duration / 0.6),
        damping: 28, mass: 0.8,
    }

    React.useEffect(() => {
        setActiveIndex(Math.min(Math.max(0, initialCard - 1), safeItems.length - 1))
    }, [initialCard, safeItems.length])

    const handleKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
        if (safeItems.length < 2) return
        event.preventDefault()
        setActiveIndex(i => (i + (event.key === "ArrowRight" ? 1 : -1) + safeItems.length) % safeItems.length)
    }

    return (
        <div
            className="frc-root"
            onKeyDown={handleKeys}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                position: "relative",
                overflow: "hidden",
                background,
                padding: Math.max(0, padding),
                ["--frc-gap" as any]: Math.max(0, gap) + "px",
                ["--frc-count" as any]: safeItems.length,
                ...style,
            }}
        >
            <style>{CSS}</style>
            <div className="frc-strip" style={{ gap: Math.max(0, gap) }}>
                {safeItems.map((item, index) => {
                    const active = index === selected
                    const href = (item.link || "").trim()
                    const linked = active && href.length > 0
                    const image = item.image?.src || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].image?.src || ""
                    const cardStyle: React.CSSProperties = {
                        height: "100%",
                        flexGrow: active ? 2.65 : 1,
                        backgroundColor: item.accent || "#D3CFC6",
                        borderRadius: Math.max(0, radius),
                        color: textColor,
                        WebkitTapHighlightColor: "transparent",
                        textDecoration: "none",
                        display: "block",
                    }
                    const innerStyle: React.CSSProperties = {
                        position: "absolute",
                        inset: 0,
                        zIndex: 4,
                        display: "block",
                        width: "100%",
                        height: "100%",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        textAlign: "left",
                        font: "inherit",
                        color: "inherit",
                        textDecoration: "none",
                        cursor: active && !linked ? "default" : "pointer",
                    }
                    const contents = (
                        <>
                            <div className="frc-top">
                                <span className="frc-index" style={{ ...labelFont }}>
                                    {item.eyebrow || String(index + 1).padStart(2, "0")}
                                </span>
                                {(!active || href) && <span className="frc-icon"><Arrow /></span>}
                            </div>
                            <div className="frc-bottom">
                                <motion.h3
                                    className="frc-title"
                                    initial={false}
                                    animate={{ fontSize: active ? 46 : 28 }}
                                    transition={transition}
                                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 580, ...titleFont }}
                                >
                                    {item.title}
                                </motion.h3>
                                <div className="frc-detail" style={{
                                    maxHeight: active ? 205 : 0,
                                    opacity: active ? 1 : 0,
                                    marginTop: active ? 2 : 0,
                                }}>
                                    <p className="frc-description" style={{
                                        fontFamily: "Inter, sans-serif", fontSize: 14,
                                        color: "rgba(255,255,255,.88)", ...bodyFont,
                                    }}>{item.description}</p>
                                    {href && item.cta && (
                                        <span className="frc-action" style={{
                                            background: buttonColor,
                                            color: buttonTextColor,
                                            fontFamily: "Inter, sans-serif",
                                        }}>
                                            {item.cta}<Arrow />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    )
                    return (
                        <motion.div
                            key={index}
                            className="frc-card"
                            data-active={active ? "true" : "false"}
                            data-linked={linked ? "true" : "false"}
                            data-selectable={!active ? "true" : "false"}
                            style={cardStyle}
                            initial={false}
                            animate={{ flexGrow: active ? 2.65 : 1 }}
                            transition={transition}
                        >
                            {image && (
                                <motion.img
                                    className="frc-image"
                                    src={image}
                                    srcSet={item.image?.srcSet}
                                    alt={item.image?.alt || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].image?.alt || ""}
                                    draggable={false}
                                    initial={false}
                                    animate={{ scale: active ? 1.035 : 1 }}
                                    transition={transition}
                                />
                            )}
                            <div style={{
                                position: "absolute", inset: 0,
                                background: "#05060B", opacity: overlay,
                                pointerEvents: "none", zIndex: 2,
                            }} />
                            {linked ? (
                                <a href={href} target="_blank" rel="noopener noreferrer"
                                    aria-label={item.title + " — " + item.cta}
                                    style={innerStyle}
                                >{contents}</a>
                            ) : !active ? (
                                <button type="button" aria-label={"Select " + item.title}
                                    aria-pressed={false} onClick={() => setActiveIndex(index)}
                                    style={innerStyle}
                                >{contents}</button>
                            ) : (
                                <div role="group" aria-label={item.title} style={innerStyle}>
                                    {contents}
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(FeatureRibbonCards, {
    items: {
        type: ControlType.Array, title: "Feature Cards",
        maxCount: 4, defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Your feature" },
                description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "" },
                cta: { type: ControlType.String, title: "CTA", defaultValue: "Get Started" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
                accent: { type: ControlType.Color, title: "Fallback", defaultValue: "#DDDDDD" },
            },
        },
    },
    initialCard: { type: ControlType.Number, title: "Start Card", defaultValue: 1, min: 1, max: 4, step: 1 },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 12, min: 0, max: 32, step: 1 },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 12, min: 0, max: 48 },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 18, min: 0, max: 48 },
    overlay: { type: ControlType.Number, title: "Dark Overlay", defaultValue: 0.12, min: 0, max: 0.6, step: 0.01 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F3F2EE" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    buttonColor: { type: ControlType.Color, title: "CTA Fill", defaultValue: "#FFFFFF" },
    buttonTextColor: { type: ControlType.Color, title: "CTA Text", defaultValue: "#161616" },
    duration: { type: ControlType.Number, title: "Motion", defaultValue: 0.6, min: 0.2, max: 1.5, step: 0.05 },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended" },
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "extended" },
})
