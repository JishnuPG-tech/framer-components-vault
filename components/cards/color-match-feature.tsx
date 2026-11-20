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


type ImageValue = {
    src?: string
    srcSet?: string
    alt?: string
}

type FeatureItem = {
    title: string
    category: string
    image?: ImageValue | string
    imageAlt?: string
    color: string
    textColor: string
    cta: string
    link: string
    imagePosition?: string
}

type Props = {
    items: FeatureItem[]
    gap: number
    cardRadius: number
    photoRadius: number
    photoInset: number
    photoRatio: number
    cardPadding: number
    titleSize: number
    minCardWidth: number
    lift: number
    tilt: number
    duration: number
    font?: React.CSSProperties
    showNumbers: boolean
    showCta: boolean
    background: string
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: FeatureItem[] = [
    {
        category: "CREATE",
        title: "Start with an idea.",
        image: {
            src: "https://framerusercontent.com/images/nFFWttJrUfbYHvnWS9fM9xJbGQ.png",
            alt: "Vibrant pink hibiscus and glass bottle against electric yellow",
        },
        imageAlt: "Vibrant pink hibiscus and glass bottle against electric yellow",
        color: "#FFE55A",
        textColor: "#171610",
        cta: "Get Started",
        link: "",
        imagePosition: "center",
    },
    {
        category: "EXPRESS",
        title: "Make it your own.",
        image: {
            src: "https://framerusercontent.com/images/C0PFlt1q5rd8Q6AhgwSR9Kr3zY.jpg",
            alt: "Fashion eyewear and floating ribbons on a soft pink set",
        },
        imageAlt: "Fashion eyewear and floating ribbons on a soft pink set",
        color: "#FFB5D5",
        textColor: "#211720",
        cta: "Get Started",
        link: "",
        imagePosition: "center",
    },
    {
        category: "DESIGN",
        title: "Every detail counts.",
        image: {
            src: "https://framerusercontent.com/images/W0DwhzKShcVpTHUTSAgZIQaQ.jpg",
            alt: "Deep-blue glass perfume bottle under colored studio lights",
        },
        imageAlt: "Deep-blue glass perfume bottle under colored studio lights",
        color: "#3855EB",
        textColor: "#FFFFFF",
        cta: "Get Started",
        link: "",
        imagePosition: "center",
    },
    {
        category: "LAUNCH",
        title: "Put it out there.",
        image: {
            src: "https://framerusercontent.com/images/4LLfJQ3B0KGt16ZRiqhmNCLhAo.jpg",
            alt: "Grapefruit slice on saturated red-orange and yellow paper",
        },
        imageAlt: "Grapefruit slice on saturated red-orange and yellow paper",
        color: "#FF9670",
        textColor: "#231811",
        cta: "Get Started",
        link: "",
        imagePosition: "center",
    },
]

function Arrow({ color }: { color: string }) {
    return (
        <svg
            aria-hidden="true"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 19 19 5M8 5h11v11" />
        </svg>
    )
}

const stylesheet = `
.cmfc-root { container-type: inline-size; }
.cmfc-grid { display: grid; width: 100%; align-items: stretch; }
.cmfc-card { position: relative; display: flex; flex-direction: column; min-width: 0; height: 100%; box-sizing: border-box; text-decoration: none; isolation: isolate; outline-offset: 4px; -webkit-tap-highlight-color: transparent; }
.cmfc-card:focus-visible { outline: 3px solid #1B1918; }
.cmfc-photo-space { position: relative; width: 100%; min-height: 0; flex: none; }
.cmfc-photo-back, .cmfc-photo { position: absolute; inset: 0; border-radius: var(--cmfc-photo-radius); }
.cmfc-photo-back { background: rgba(15,15,15,.16); transform: translate(0,0); transition: transform var(--cmfc-speed) cubic-bezier(.2,.8,.2,1); }
.cmfc-photo { overflow: hidden; background: rgba(0,0,0,.08); transform: translate3d(0,0,0) rotate(0deg); transform-origin: center bottom; transition: transform var(--cmfc-speed) cubic-bezier(.2,.78,.18,1); box-shadow: 0 3px 8px rgba(0,0,0,.07); }
.cmfc-photo img { width: 100%; height: 100%; display: block; object-fit: cover; transform: scale(1.001); transition: transform var(--cmfc-speed) cubic-bezier(.2,.78,.18,1); }
.cmfc-count { position: absolute; left: 13px; top: 13px; display: inline-flex; align-items: center; justify-content: center; min-width: 35px; height: 29px; padding: 0 9px; box-sizing: border-box; font-size: 11px; font-weight: 650; letter-spacing: .035em; color: #181818; border-radius: 999px; background: rgba(255,255,255,.92); backdrop-filter: blur(8px); }
.cmfc-body { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }
.cmfc-category { font-size: 10px; font-weight: 750; letter-spacing: .095em; line-height: 1.4; }
.cmfc-title { font-weight: 730; letter-spacing: -.058em; line-height: 1.045; text-wrap: balance; overflow-wrap: anywhere; }
.cmfc-cta { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid currentColor; font-size: 11px; letter-spacing: .04em; font-weight: 750; text-transform: uppercase; line-height: 1.3; }
.cmfc-cta-arrow { display: inline-flex; transform: translate3d(0,0,0); transition: transform var(--cmfc-speed) cubic-bezier(.2,.8,.2,1); }
.cmfc-card.cmfc-linked { cursor: pointer; }
@media (hover: hover) and (pointer: fine) {
  .cmfc-card:hover .cmfc-photo { transform: translate3d(0, calc(var(--cmfc-lift) * -1), 0) rotate(var(--cmfc-tilt)); }
  .cmfc-card:hover .cmfc-photo-back { transform: translate3d(5px, 4px, 0) rotate(1deg); }
  .cmfc-card:hover .cmfc-photo img { transform: scale(1.055); }
  .cmfc-linked:hover .cmfc-cta-arrow { transform: translate3d(4px,-3px,0); }
}
.cmfc-card:focus-visible .cmfc-photo { transform: translate3d(0, calc(var(--cmfc-lift) * -1), 0) rotate(var(--cmfc-tilt)); }
.cmfc-card:active .cmfc-photo { transform: translate3d(0,-3px,0) scale(.99); }
@container (min-width: 611px) and (max-width: 1050px) {
  .cmfc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .cmfc-photo-space { aspect-ratio: 1.22 !important; }
}
@container (max-width: 610px) {
  .cmfc-grid { grid-template-columns: 1fr !important; }
  .cmfc-card { max-width: none; }
  .cmfc-photo-space { aspect-ratio: 1.47 !important; }
  .cmfc-title { font-size: min(7.4cqw, 30px) !important; }
}
@media (prefers-reduced-motion: reduce) {
  .cmfc-photo, .cmfc-photo-back, .cmfc-photo img, .cmfc-cta-arrow { transition-duration: 0.01ms !important; }
  .cmfc-card:hover .cmfc-photo, .cmfc-card:focus-visible .cmfc-photo { transform: none !important; }
  .cmfc-card:hover .cmfc-photo img { transform: none !important; }
  .cmfc-card:hover .cmfc-photo-back { transform: none !important; }
}
`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 484
 */
export default function ColorMatchFeatureCards(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        gap = 14,
        cardRadius = 20,
        photoRadius = 12,
        photoInset = 12,
        photoRatio = 0.92,
        cardPadding = 19,
        titleSize = 26,
        minCardWidth = 238,
        lift = 12,
        tilt = -2.6,
        duration = 0.48,
        font,
        showNumbers = true,
        showCta = true,
        background = "#FFFFFF",
        style,
    } = props

    const safeItems = Array.isArray(items) ? items : DEFAULT_ITEMS
    const hasItems = safeItems.length > 0
    const ratio = Math.max(0.45, Math.min(1.7, photoRatio))
    const safeGap = Math.max(0, gap)
    const cardWidth = Math.max(180, minCardWidth)

    return (
        <div
            className="cmfc-root"
            style={{
                width: "100%",
                height: "auto",
                boxSizing: "border-box",
                background,
                padding: "12px",
                fontFamily: "Inter, Arial, sans-serif",
                ...font,
                ...style,
            }}
        >
            <style>{stylesheet}</style>
            <div
                className="cmfc-grid"
                role="list"
                aria-label="Featured links"
                style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${cardWidth}px), 1fr))`,
                    gap: safeGap,
                }}
            >
                {hasItems && safeItems.map((item, index) => {
                    const url = typeof item.link === "string" ? item.link.trim() : ""
                    const linked = url.length > 0
                    const image = typeof item.image === "string" ? { src: item.image } : item.image
                    const src = image?.src ?? ""
                    const ink = item.textColor || "#171717"
                    const cardStyles = {
                        backgroundColor: item.color || "#ECECEC",
                        color: ink,
                        borderRadius: cardRadius,
                        padding: photoInset,
                        "--cmfc-photo-radius": `${photoRadius}px`,
                        "--cmfc-lift": `${Math.max(0, lift)}px`,
                        "--cmfc-tilt": `${tilt}deg`,
                        "--cmfc-speed": `${Math.max(.05, duration)}s`,
                    } as React.CSSProperties

                    const content = (
                        <>
                            <div className="cmfc-photo-space" style={{ aspectRatio: `${ratio}` }}>
                                <div className="cmfc-photo-back" aria-hidden="true" />
                                <div className="cmfc-photo">
                                    {src ? <img src={src} srcSet={image?.srcSet} alt={item.imageAlt || image?.alt || item.title || ""} style={{ objectPosition: item.imagePosition || "center" }} loading={index < 4 ? "eager" : "lazy"} /> : null}
                                    {showNumbers && <span className="cmfc-count" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}
                                </div>
                            </div>
                            <div className="cmfc-body" style={{ padding: `${cardPadding}px ${Math.max(0, cardPadding - photoInset)}px ${Math.max(0, cardPadding - photoInset)}px`, gap: 11 }}>
                                <span className="cmfc-category">{item.category}</span>
                                <span className="cmfc-title" style={{ fontSize: titleSize }}>{item.title}</span>
                                {showCta && linked && <span className="cmfc-cta" style={{ marginTop: 15 }}>
                                    <span>{item.cta || "Discover More"}</span>
                                    <span className="cmfc-cta-arrow"><Arrow color={ink} /></span>
                                </span>}
                            </div>
                        </>
                    )

                    return linked ? (
                        <a key={`${index}-${item.title}`} role="listitem" className="cmfc-card cmfc-linked" style={cardStyles} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${item.title} — ${item.cta || "Discover More"}`}>
                            {content}
                        </a>
                    ) : (
                        <div key={`${index}-${item.title}`} role="listitem" className="cmfc-card" style={cardStyles}>
                            {content}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ColorMatchFeatureCards, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        defaultValue: DEFAULT_ITEMS,
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imagePosition: { type: ControlType.Enum, title: "Image Crop", options: ["center", "top", "bottom", "left", "right"], optionTitles: ["Center", "Top", "Bottom", "Left", "Right"], defaultValue: "center" },
                imageAlt: { type: ControlType.String, title: "Image Alt" },
                category: { type: ControlType.String, title: "Category" },
                title: { type: ControlType.String, title: "Title" },
                cta: { type: ControlType.String, title: "CTA" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
                color: { type: ControlType.Color, title: "Card Color" },
                textColor: { type: ControlType.Color, title: "Text Color" },
            },
        },
    },
    minCardWidth: { type: ControlType.Number, title: "Min Width", min: 180, max: 420, step: 2, defaultValue: 238, displayStepper: true },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 42, step: 1, defaultValue: 14, displayStepper: true },
    cardRadius: { type: ControlType.Number, title: "Card Radius", min: 0, max: 48, step: 1, defaultValue: 20 },
    photoRadius: { type: ControlType.Number, title: "Photo Radius", min: 0, max: 40, step: 1, defaultValue: 12 },
    photoInset: { type: ControlType.Number, title: "Photo Inset", min: 0, max: 32, step: 1, defaultValue: 12 },
    photoRatio: { type: ControlType.Number, title: "Photo Ratio", min: 0.5, max: 1.7, step: 0.05, defaultValue: 0.92 },
    cardPadding: { type: ControlType.Number, title: "Text Padding", min: 12, max: 38, step: 1, defaultValue: 19 },
    titleSize: { type: ControlType.Number, title: "Title Size", min: 18, max: 42, step: 1, defaultValue: 26 },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
    showNumbers: { type: ControlType.Boolean, title: "Card Numbers", defaultValue: true },
    showCta: { type: ControlType.Boolean, title: "CTA", defaultValue: true },
    lift: { type: ControlType.Number, title: "Photo Lift", min: 0, max: 32, step: 1, defaultValue: 12 },
    tilt: { type: ControlType.Number, title: "Photo Tilt", min: -12, max: 12, step: 0.2, defaultValue: -2.6 },
    duration: { type: ControlType.Number, title: "Motion Speed", min: 0.1, max: 1.2, step: 0.02, defaultValue: 0.48 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
})
