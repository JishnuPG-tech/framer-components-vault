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

import { useReducedMotion } from "framer-motion"

type ResponsiveImage = { src?: string; srcSet?: string; alt?: string }

type PeekItem = {
    title: string
    description: string
    image?: ResponsiveImage
    imagePosition: string
    background: string
    textColor: string
    cta: string
    link: string
}

interface Props {
    items: PeekItem[]
    gap: number
    cardHeight: number
    radius: number
    cardPadding: number
    imageInset: number
    imageWidth: number
    hoverWidth: number
    imageRadius: number
    titleSize: number
    animationSpeed: number
    background: string
    titleFont?: React.CSSProperties
    smallFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: PeekItem[] = [
    {
        title: "Websites",
        description: "Your ideas, online.",
        image: {
            src: "https://framerusercontent.com/images/mapImtPjs21j2ZgFqaMyMxEZ82o.jpg",
            alt: "Abstract sculptural liquid chrome in electric blue and violet",
        },
        imagePosition: "52% 50%",
        background: "#087FB0",
        textColor: "#FFFFFF",
        cta: "Get Started",
        link: "",
    },
    {
        title: "Portfolios",
        description: "Your work, in focus.",
        image: {
            src: "https://framerusercontent.com/images/nlNC9q61Uf1YSE3ZUTPDY0FaZA.jpg",
            alt: "Sculptural curved staircase in vivid orange architecture",
        },
        imagePosition: "30% 53%",
        background: "#E96517",
        textColor: "#FFFFFF",
        cta: "Get Started",
        link: "",
    },
    {
        title: "Campaigns",
        description: "Small launch. Big energy.",
        image: {
            src: "https://framerusercontent.com/images/widm8qIrPvvCicZ8PAQJJSjrk.jpg",
            alt: "Abstract reflective liquid metal sculpture in hot pink and red",
        },
        imagePosition: "55% 50%",
        background: "#BA124E",
        textColor: "#FFFFFF",
        cta: "Get Started",
        link: "",
    },
]

const STYLE = `
.cpl-root { container-type: inline-size; }
.cpl-card { isolation: isolate; position: relative; outline: none; -webkit-tap-highlight-color: transparent; }
.cpl-image { position: absolute; display: block; top: var(--cpl-inset); bottom: var(--cpl-inset); right: var(--cpl-image-right); width: var(--cpl-rest); overflow: hidden; z-index: 0; transition: width var(--cpl-duration) cubic-bezier(.22,1,.36,1), transform var(--cpl-duration) cubic-bezier(.22,1,.36,1), border-radius var(--cpl-duration) cubic-bezier(.22,1,.36,1); will-change: width; }
.cpl-image img { display: block; width: 100%; height: 100%; object-fit: cover; transform: scale(1.001); transition: transform var(--cpl-duration) cubic-bezier(.22,1,.36,1); }
.cpl-arrow { position: absolute; z-index: 2; right: var(--cpl-arrow-right); top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 999px; background: white; color: #171717; display: flex; justify-content: center; align-items: center; transition: transform .45s cubic-bezier(.22,1,.36,1), background .25s ease; }
.cpl-content { position: relative; z-index: 1; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; height: 100%; max-width: 54%; }
.cpl-title { font-size: var(--cpl-title-size); margin: 0; letter-spacing: -.059em; line-height: 1; font-weight: 700; }
.cpl-cta { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; letter-spacing: .01em; white-space: nowrap; }
.cpl-description { font-size: 13px; line-height: 1.25; font-weight: 500; opacity: .77; }
.cpl-copybottom { display: flex; align-items: center; gap: 17px; flex-wrap: wrap; }
.cpl-card[href]:hover .cpl-image, .cpl-card[href]:focus-visible .cpl-image, .cpl-card:not([href]):hover .cpl-image { width: var(--cpl-hover); }
.cpl-card:hover .cpl-image img, .cpl-card:focus-visible .cpl-image img { transform: scale(1.055); }
.cpl-card[href]:hover .cpl-arrow, .cpl-card[href]:focus-visible .cpl-arrow { transform: translateY(-50%) rotate(45deg); }
.cpl-card[href]:focus-visible { outline: 3px solid #141414; outline-offset: 4px; }
@container (max-width: 750px) {
  .cpl-title { font-size: clamp(27px, 5.8cqw, 44px); }
  .cpl-content { max-width: 57%; }
  .cpl-image { width: 35%; }
  .cpl-card:hover .cpl-image, .cpl-card:focus-visible .cpl-image { width: 45% !important; }
}
@container (max-width: 520px) {
  .cpl-card { min-height: 150px !important; padding: 15px 16px !important; }
  .cpl-image { right: 10px !important; width: 42% !important; top: 9px; bottom: 9px; }
  .cpl-card:hover .cpl-image, .cpl-card:focus-visible .cpl-image { width: 42% !important; }
  .cpl-arrow { right: 18px !important; top: 21px; transform: none; width: 30px; height: 30px; }
  .cpl-card:hover .cpl-arrow, .cpl-card:focus-visible .cpl-arrow { transform: rotate(45deg); }
  .cpl-content { max-width: 51%; }
  .cpl-title { font-size: clamp(25px, 7.5cqw, 37px); letter-spacing: -.054em; }
  .cpl-description { font-size: 11px; }
  .cpl-copybottom { display: block; }
  .cpl-cta { margin-top: 6px; font-size: 11px; }
}
@media (hover: none) { .cpl-card:hover .cpl-image { width: var(--cpl-rest); } .cpl-card:hover .cpl-image img { transform: scale(1.001); } }
@media (prefers-reduced-motion: reduce) { .cpl-image, .cpl-image img, .cpl-arrow { transition-duration: 0ms !important; } }
`

function ArrowIcon({ size = 19 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 490
 */
export default function ColorPeekLinks(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        gap = 10,
        cardHeight = 156,
        radius = 21,
        cardPadding = 26,
        imageInset = 10,
        imageWidth = 30,
        hoverWidth = 51,
        imageRadius = 14,
        titleSize = 49,
        animationSpeed = 0.65,
        background = "#FFFFFF",
        titleFont,
        smallFont,
        style,
    } = props

    const staticRenderer = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const displayItems = Array.isArray(items) && items.length > 0 ? items : DEFAULT_ITEMS
    const duration = staticRenderer || prefersReduced ? "0ms" : `${Math.max(0.15, animationSpeed)}s`

    return (
        <div className="cpl-root" style={{ ...style, width: "100%", boxSizing: "border-box", background, fontFamily: "Satoshi, Inter, sans-serif", display: "flex", flexDirection: "column", gap: Math.max(0, gap), minWidth: 0 }}>
            <style>{STYLE}</style>
            {displayItems.map((item, index) => {
                const link = typeof item.link === "string" ? item.link.trim() : ""
                const canNavigate = link.length > 0
                const CardTag: any = canNavigate ? "a" : "div"
                const textColor = item.textColor || "#151515"
                const imageUrl = item.image?.src || ""

                return (
                    <CardTag
                        key={`${index}-${item.title}`}
                        className="cpl-card"
                        href={canNavigate ? link : undefined}
                        target={canNavigate ? "_blank" : undefined}
                        rel={canNavigate ? "noopener noreferrer" : undefined}
                        aria-label={canNavigate ? `${item.title}: ${item.cta || "Get Started"}` : undefined}
                        style={{
                            height: Math.max(120, cardHeight),
                            width: "100%",
                            boxSizing: "border-box",
                            display: "block",
                            textDecoration: "none",
                            color: textColor,
                            background: item.background || "#E3F8C6",
                            borderRadius: radius,
                            overflow: "hidden",
                            cursor: canNavigate ? "pointer" : "default",
                            padding: cardPadding,
                            "--cpl-inset": `${imageInset}px`,
                            "--cpl-image-right": "76px",
                            "--cpl-arrow-right": "19px",
                            "--cpl-rest": `${imageWidth}%`,
                            "--cpl-hover": `${hoverWidth}%`,
                            "--cpl-duration": duration,
                            "--cpl-title-size": `${titleSize}px`,
                        } as React.CSSProperties}
                    >
                        <div className="cpl-image" style={{ borderRadius: imageRadius, background: "rgba(0,0,0,.07)" }}>
                            {imageUrl && <img src={imageUrl} srcSet={item.image?.srcSet} alt={item.image?.alt || item.title} loading={index === 0 ? "eager" : "lazy"} style={{ objectPosition: item.imagePosition || "50% 50%" }} />}
                        </div>
                        <div className="cpl-content">
                            <h3 className="cpl-title" style={{ ...titleFont, fontSize: `clamp(25px, ${(titleSize / 11.2).toFixed(2)}cqw, ${titleSize}px)`, fontWeight: 700, letterSpacing: "-0.059em", lineHeight: 1, margin: 0 }}>{item.title}</h3>
                            <div className="cpl-copybottom">
                                <span className="cpl-description" style={{ ...smallFont }}>{item.description}</span>
                                {canNavigate && item.cta && <span className="cpl-cta" style={{ ...smallFont }}>{item.cta}<ArrowIcon size={13} /></span>}
                            </div>
                        </div>
                        {canNavigate && <div className="cpl-arrow"><ArrowIcon /></div>}
                    </CardTag>
                )
            })}
        </div>
    )
}

addPropertyControls(ColorPeekLinks, {
    items: {
        type: ControlType.Array,
        title: "Links",
        defaultValue: DEFAULT_ITEMS,
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "New Category" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Explore something new." },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imagePosition: { type: ControlType.String, title: "Image Position", defaultValue: "50% 50%" },
                background: { type: ControlType.Color, title: "Background", defaultValue: "#087FB0" },
                textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
                cta: { type: ControlType.String, title: "CTA", defaultValue: "Get Started" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
    },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 10, min: 0, max: 40, step: 1 },
    cardHeight: { type: ControlType.Number, title: "Card Height", defaultValue: 156, min: 120, max: 300, step: 2, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 21, min: 0, max: 60, step: 1 },
    cardPadding: { type: ControlType.Number, title: "Padding", defaultValue: 26, min: 12, max: 52, step: 1 },
    imageInset: { type: ControlType.Number, title: "Image Inset", defaultValue: 10, min: 0, max: 32, step: 1 },
    imageWidth: { type: ControlType.Number, title: "Peek Width", defaultValue: 30, min: 15, max: 50, step: 1, unit: "%" },
    hoverWidth: { type: ControlType.Number, title: "Hover Width", defaultValue: 51, min: 25, max: 70, step: 1, unit: "%" },
    imageRadius: { type: ControlType.Number, title: "Image Radius", defaultValue: 14, min: 0, max: 50, step: 1 },
    titleSize: { type: ControlType.Number, title: "Title Size", defaultValue: 49, min: 24, max: 80, step: 1 },
    animationSpeed: { type: ControlType.Number, title: "Motion", defaultValue: 0.65, min: 0.15, max: 1.4, step: 0.05, unit: "s" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif" },
    smallFont: { type: ControlType.Font, title: "Small Font", controls: "extended", defaultFontType: "sans-serif" },
})
