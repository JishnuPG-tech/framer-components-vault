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

type Photo = { src?: string; srcSet?: string; alt?: string }

type IndexItem = {
    title: string
    description: string
    image?: Photo
    position: string
    color: string
    link: string
}

interface Props {
    items: IndexItem[]
    eyebrow: string
    ctaLabel: string
    background: string
    textColor: string
    mutedColor: string
    activeBackground: string
    imageRadius: number
    grain: number
    animationSpeed: number
    titleFont?: React.CSSProperties
    detailFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: IndexItem[] = [
    {
        title: "Portfolio",
        description: "A little more you, online.",
        image: {
            src: "https://images.unsplash.com/photo-1740044742102-9c7b2923e73e?auto=format&fit=crop&w=1400&q=86",
            alt: "Violet and blue motion-blurred editorial portrait",
        },
        position: "50% 46%",
        color: "#B9A6FF",
        link: "",
    },
    {
        title: "Studio",
        description: "Give your ideas room to bloom.",
        image: {
            src: "https://images.unsplash.com/photo-1759223293145-017da2722112?auto=format&fit=crop&w=1400&q=86",
            alt: "Yellow and orange flowers drifting in motion blur",
        },
        position: "50% 50%",
        color: "#FBC63A",
        link: "",
    },
    {
        title: "Storefront",
        description: "Make every product feel different.",
        image: {
            src: "https://images.unsplash.com/photo-1688809957913-0ecfb2d32dc5?auto=format&fit=crop&w=1400&q=86",
            alt: "Bright pink motion-blurred skateboard photograph",
        },
        position: "52% 50%",
        color: "#FF739B",
        link: "",
    },
    {
        title: "Editorial",
        description: "For stories that go somewhere.",
        image: {
            src: "https://images.unsplash.com/photo-1700938551374-7ec1983ef60d?auto=format&fit=crop&w=1400&q=86",
            alt: "Orange and deep black long-exposure photograph",
        },
        position: "50% 50%",
        color: "#FE7648",
        link: "",
    },
]

const TITLE_DEFAULT = {
    fontSize: "34px",
    lineHeight: "1.1em",
    letterSpacing: "-0.055em",
    fontWeight: 600,
    fontFamily: "Inter Tight, Inter, sans-serif",
}

const DETAIL_DEFAULT = {
    fontSize: "13px",
    lineHeight: "1.5em",
    letterSpacing: "-0.01em",
    fontFamily: "Inter, sans-serif",
}

const LABEL_DEFAULT = {
    fontSize: "11px",
    lineHeight: "1.4em",
    letterSpacing: "0.11em",
    fontWeight: 600,
    fontFamily: "Inter, sans-serif",
}

function Arrow({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19L19 5M8 5h11v11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * Motion Blur Link Index
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 510
 */
export default function MotionBlurLinkIndex(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        eyebrow = "WHAT WILL YOU MAKE?",
        ctaLabel = "Start Building",
        background = "#F4F3EE",
        textColor = "#151515",
        mutedColor = "#6F6D67",
        activeBackground = "#DCFF5C",
        imageRadius = 16,
        grain = 0.21,
        animationSpeed = 0.55,
        titleFont,
        detailFont,
        labelFont,
        style,
    } = props

    const safeItems = items?.length ? items : DEFAULT_ITEMS
    const [activeIndex, setActiveIndex] = React.useState(0)
    const active = safeItems[Math.min(activeIndex, safeItems.length - 1)]
    const staticCanvas = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const noMotion = staticCanvas || reducedMotion
    const grainId = React.useId().replace(/:/g, "")
    const classRoot = `motionblur-${grainId}`
    const hasLink = Boolean(active?.link?.trim())
    const imageSource = active?.image?.src || ""

    const previewContent = (
        <>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: imageRadius, background: active?.color || "#B9A6FF" }}>
                <AnimatePresence initial={false} mode="sync">
                    <motion.div
                        key={`${activeIndex}-${imageSource}`}
                        initial={noMotion ? false : { opacity: 0, x: 56, scale: 1.12, filter: "blur(24px) saturate(180%)" }}
                        animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px) saturate(110%)" }}
                        exit={noMotion ? undefined : { opacity: 0, x: -42, scale: 1.06, filter: "blur(18px) saturate(145%)" }}
                        transition={{ duration: noMotion ? 0 : animationSpeed, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{ position: "absolute", inset: -1, overflow: "hidden", willChange: noMotion ? undefined : "transform, opacity, filter" }}
                    >
                        {imageSource ? (
                            <img src={imageSource} srcSet={active?.image?.srcSet} alt={active?.image?.alt || active?.title || "Visual preview"} draggable={false} style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: active?.position || "50% 50%" }} />
                        ) : (
                            <div style={{ height: "100%", width: "100%", background: `linear-gradient(135deg, ${active?.color || "#B9A6FF"}, #FC644A 66%, #4528C8)` }} />
                        )}
                    </motion.div>
                </AnimatePresence>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(0,0,0,.14), transparent 36%, transparent 55%, rgba(0,0,0,.43))" }} />
                <svg aria-hidden="true" width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: grain, mixBlendMode: "soft-light" }}>
                    <filter id={`grain-${grainId}`} x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="7" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter={`url(#grain-${grainId})`} />
                </svg>
            </div>
            <div style={{ position: "absolute", left: 23, top: 22, zIndex: 2, display: "flex", alignItems: "center", gap: 8, color: "white", ...LABEL_DEFAULT, ...labelFont, letterSpacing: "0.09em" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: active?.color || "#DCFF5C" }} />
                {String(Math.min(activeIndex + 1, safeItems.length)).padStart(2, "0")} / {String(safeItems.length).padStart(2, "0")}
            </div>
            {hasLink ? (
                <div style={{ position: "absolute", left: 23, right: 23, bottom: 22, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, color: "white" }}>
                    <span style={{ ...DETAIL_DEFAULT, ...detailFont, fontWeight: 600, fontSize: 15 }}>{ctaLabel}</span>
                    <span style={{ width: 43, height: 43, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", background: "white", color: textColor }}><Arrow size={19} /></span>
                </div>
            ) : (
                <div style={{ position: "absolute", left: 23, right: 23, bottom: 22, zIndex: 2, color: "white", ...DETAIL_DEFAULT, ...detailFont, fontWeight: 500 }}>{active?.description}</div>
            )}
        </>
    )

    return (
        <div className={classRoot} style={{ ...style, ...({ containerType: "inline-size" } as React.CSSProperties), width: "100%", height: "auto", minHeight: 0, boxSizing: "border-box", background, color: textColor, padding: 22, borderRadius: 21, fontFamily: "Inter, sans-serif" }}>
            <style>{`
                .${classRoot} .motionblur-layout { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1.11fr); align-items:stretch; gap:20px; }
                .${classRoot} .motionblur-row:focus-visible { outline:3px solid #3670E8; outline-offset:-3px; position:relative; z-index:3; }
                .${classRoot} .motionblur-stage:focus-visible { outline:3px solid #3670E8; outline-offset:4px; }
                .${classRoot} .motionblur-row:hover .motionblur-arrow { transform:translate(3px,-3px); }
                .${classRoot} .motionblur-arrow { transition:transform 240ms cubic-bezier(.2,.8,.2,1); }
                @container (max-width: 710px) {
                    .${classRoot} .motionblur-layout { grid-template-columns:1fr; gap:15px; }
                    .${classRoot} .motionblur-stage { height:300px !important; min-height:300px !important; grid-row:1; }
                    .${classRoot} .motionblur-list { grid-row:2; }
                    .${classRoot} .motionblur-row { min-height:70px !important; padding:10px 14px !important; }
                    .${classRoot} .motionblur-row-title { font-size:clamp(25px, 6.7cqw, 35px) !important; }
                    .${classRoot} .motionblur-row-subtitle { font-size:11px !important; }
                }
                @container (max-width: 410px) {
                    .${classRoot} { padding:12px !important; border-radius:15px !important; }
                    .${classRoot} .motionblur-stage { height:235px !important; min-height:235px !important; }
                    .${classRoot} .motionblur-row { min-height:63px !important; }
                    .${classRoot} .motionblur-row-subtitle { display:none; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .${classRoot} .motionblur-row, .${classRoot} .motionblur-arrow { transition:none !important; }
                }
            `}</style>
            <div className="motionblur-layout">
                <div className="motionblur-list" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <div style={{ minHeight: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "0 5px 12px" }}>
                        <span style={{ ...LABEL_DEFAULT, ...labelFont, color: mutedColor }}>{eyebrow}</span>
                        <span style={{ ...LABEL_DEFAULT, ...labelFont, color: mutedColor }}>{String(safeItems.length).padStart(2, "0")}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                        {safeItems.map((item, i) => {
                            const selected = i === Math.min(activeIndex, safeItems.length - 1)
                            return (
                                <button
                                    key={`${i}-${item.title}`}
                                    type="button"
                                    className="motionblur-row"
                                    aria-pressed={selected}
                                    aria-label={`Preview ${item.title}`}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    onFocus={() => setActiveIndex(i)}
                                    onClick={() => setActiveIndex(i)}
                                    style={{ width: "100%", minWidth: 0, minHeight: 98, padding: "12px 17px", border: 0, borderRadius: 11, background: selected ? activeBackground : "transparent", color: textColor, textAlign: "left", cursor: "pointer", display: "grid", gridTemplateColumns: "25px minmax(0,1fr) 25px", alignItems: "center", columnGap: 12, transition: noMotion ? "none" : "background 300ms ease", WebkitTapHighlightColor: "transparent" }}
                                >
                                    <span style={{ ...LABEL_DEFAULT, ...labelFont, alignSelf: "center", color: selected ? textColor : mutedColor, fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</span>
                                    <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                                        <span className="motionblur-row-title" style={{ ...TITLE_DEFAULT, ...titleFont, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</span>
                                        <span className="motionblur-row-subtitle" style={{ ...DETAIL_DEFAULT, ...detailFont, color: selected ? textColor : mutedColor, opacity: selected ? 0.8 : 0.72, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.description}</span>
                                    </span>
                                    <span className="motionblur-arrow" aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: selected ? textColor : mutedColor, opacity: selected ? 1 : 0.55 }}><Arrow size={19} /></span>
                                </button>
                            )
                        })}
                    </div>
                </div>
                {hasLink ? (
                    <a className="motionblur-stage" href={active.link} target="_blank" rel="noopener noreferrer" aria-label={`${ctaLabel}: ${active.title}`} style={{ display: "block", position: "relative", height: 445, minHeight: 445, borderRadius: imageRadius, overflow: "hidden", cursor: "pointer", isolation: "isolate" }}>{previewContent}</a>
                ) : (
                    <div className="motionblur-stage" style={{ display: "block", position: "relative", height: 445, minHeight: 445, borderRadius: imageRadius, overflow: "hidden", isolation: "isolate" }}>{previewContent}</div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(MotionBlurLinkIndex, {
    items: {
        type: ControlType.Array, title: "Links", maxCount: 12, defaultValue: DEFAULT_ITEMS,
        control: { type: ControlType.Object, controls: {
            title: { type: ControlType.String, title: "Title", defaultValue: "Portfolio" },
            description: { type: ControlType.String, title: "Description", defaultValue: "Your story, your way." },
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            position: { type: ControlType.String, title: "Image Focus", defaultValue: "50% 50%" },
            color: { type: ControlType.Color, title: "Fallback Color", defaultValue: "#B9A6FF" },
            link: { type: ControlType.Link, title: "Link", defaultValue: "" },
        } },
    },
    eyebrow: { type: ControlType.String, title: "Top Label", defaultValue: "WHAT WILL YOU MAKE?" },
    ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "Start Building" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F4F3EE" },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#151515" },
    mutedColor: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6F6D67" },
    activeBackground: { type: ControlType.Color, title: "Active Color", defaultValue: "#DCFF5C" },
    imageRadius: { type: ControlType.Number, title: "Image Radius", min: 0, max: 40, step: 1, defaultValue: 16, unit: "px" },
    grain: { type: ControlType.Number, title: "Film Grain", min: 0, max: 0.55, step: 0.01, defaultValue: 0.21 },
    animationSpeed: { type: ControlType.Number, title: "Motion Speed", min: 0.2, max: 1.2, step: 0.05, defaultValue: 0.55, unit: "s" },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: TITLE_DEFAULT },
    detailFont: { type: ControlType.Font, title: "Detail Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: DETAIL_DEFAULT },
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: LABEL_DEFAULT },
})
