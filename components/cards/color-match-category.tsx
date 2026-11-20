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


type CardImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type CategoryCard = {
    category: string
    title: string
    description: string
    cta: string
    image?: CardImage
    imagePosition: string
    accent: string
    ink: string
    link: string
}

interface Props {
    cards: CategoryCard[]
    gap: number
    cardRadius: number
    imageHeight: number
    panelHeight: number
    panelPadding: number
    titleSize: number
    imageZoom: number
    colorLift: number
    duration: number
    showNumbers: boolean
    showDescriptions: boolean
    background: string
    font?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_CARDS: CategoryCard[] = [
    {
        category: "PORTFOLIO",
        title: "Show your work.",
        description: "A little space for everything you create.",
        cta: "Start building",
        image: {
            src: "https://framerusercontent.com/images/XDnQ74k2tnBbBPq8SWY2ssZ5cOs.png",
            alt: "Sculptural blue chair against a vivid lime backdrop",
        },
        imagePosition: "50% 50%",
        accent: "#D7FF35",
        ink: "#121911",
        link: "",
    },
    {
        category: "STUDIO",
        title: "Make some noise.",
        description: "Give your ideas a bold new home.",
        cta: "Start building",
        image: {
            src: "https://framerusercontent.com/images/4jYtLXAGEzF9AsUX50waNqdoums.png",
            alt: "Expressive portrait in a vivid pink fashion look",
        },
        imagePosition: "50% 42%",
        accent: "#FFA7C9",
        ink: "#23141C",
        link: "",
    },
    {
        category: "JOURNAL",
        title: "Tell your story.",
        description: "Beautiful ideas, worth sharing.",
        cta: "Start building",
        image: {
            src: "https://framerusercontent.com/images/bMhoGG5iPDUQFLWn5E3KFujUdlE.png",
            alt: "Intense orange poppy on blue with a chrome plinth",
        },
        imagePosition: "50% 48%",
        accent: "#3D50F8",
        ink: "#FFFFFF",
        link: "",
    },
    {
        category: "LANDING PAGE",
        title: "Start something.",
        description: "A first impression with personality.",
        cta: "Start building",
        image: {
            src: "https://framerusercontent.com/images/lwNsdKwKlzBhG1iWEV60P6NpjZE.png",
            alt: "Orange architectural staircase with a violet sphere",
        },
        imagePosition: "50% 58%",
        accent: "#FFA06B",
        ink: "#25170F",
        link: "",
    },
]

function Arrow({ size = 18 }: { size?: number }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M5 19 19 5M8 5h11v11"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 465
 */
export default function ColorMatchCategoryCards(props: Props) {
    const {
        cards = DEFAULT_CARDS,
        gap = 14,
        cardRadius = 16,
        imageHeight = 254,
        panelHeight = 202,
        panelPadding = 22,
        titleSize = 27,
        imageZoom = 1.09,
        colorLift = 21,
        duration = 0.52,
        showNumbers = true,
        showDescriptions = true,
        background = "#FFFFFF",
        font,
        style,
    } = props

    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const scope = `color-category-${uid}`
    const selector = `[data-color-category="${scope}"]`
    const safeCards = Array.isArray(cards) ? cards.filter(Boolean) : DEFAULT_CARDS
    const motionTime = Math.max(0, Math.min(2, duration))
    const safeZoom = Math.max(1, Math.min(1.5, imageZoom))
    const lift = Math.max(0, Math.min(60, colorLift))
    const baseFont = font || {}

    const sheet = `
        ${selector} * { box-sizing: border-box; }
        ${selector} .cc-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: var(--cc-gap);
            align-items: stretch;
        }
        ${selector} .cc-card {
            display: block;
            position: relative;
            isolation: isolate;
            min-width: 0;
            overflow: hidden;
            border-radius: var(--cc-radius);
            background: var(--cc-accent);
            color: var(--cc-ink);
            text-decoration: none;
            -webkit-tap-highlight-color: transparent;
            box-shadow: 0 0 0 1px rgba(18, 18, 18, 0.055);
            transition: box-shadow var(--cc-time) ease, transform var(--cc-time) cubic-bezier(.22,1,.36,1);
        }
        ${selector} .cc-photo {
            position: relative;
            overflow: hidden;
            height: var(--cc-image-height);
            background: var(--cc-accent);
        }
        ${selector} .cc-photo img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scale(1.001);
            transition: transform calc(var(--cc-time) * 1.24) cubic-bezier(.2,.78,.2,1);
            will-change: transform;
        }
        ${selector} .cc-photo::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(180deg,rgba(0,0,0,.14),transparent 38%);
        }
        ${selector} .cc-index {
            position: absolute;
            z-index: 2;
            top: 16px;
            left: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 33px;
            padding: 0 12px;
            border-radius: 99px;
            border: 1px solid rgba(255,255,255,.5);
            background: rgba(255,255,255,.16);
            color: white;
            font-size: 11px;
            font-weight: 600;
            line-height: 1;
            letter-spacing: .02em;
            font-variant-numeric: tabular-nums;
            backdrop-filter: blur(10px);
        }
        ${selector} .cc-top-arrow {
            position: absolute;
            z-index: 2;
            right: 15px;
            top: 15px;
            width: 36px;
            height: 36px;
            display: grid;
            place-items: center;
            background: #FFFFFF;
            color: #151515;
            border-radius: 50%;
            transition: transform var(--cc-time) cubic-bezier(.22,1,.36,1), background var(--cc-time) ease;
        }
        ${selector} .cc-panel {
            position: relative;
            z-index: 3;
            display: flex;
            flex-direction: column;
            height: var(--cc-panel-height);
            padding: var(--cc-padding);
            background: var(--cc-accent);
            color: var(--cc-ink);
            transform: translateY(0);
            transition: transform var(--cc-time) cubic-bezier(.22,1,.36,1);
        }
        ${selector} .cc-category {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            font-size: 10px;
            font-weight: 650;
            letter-spacing: .115em;
            line-height: 1.3;
            text-transform: uppercase;
            opacity: .8;
        }
        ${selector} .cc-category-line {
            height: 1px;
            flex: 1 1 14px;
            max-width: 40px;
            background: currentColor;
            opacity: .38;
        }
        ${selector} .cc-title {
            margin: 15px 0 0;
            font-size: var(--cc-title-size);
            font-weight: 600;
            letter-spacing: -.052em;
            line-height: 1.09;
            overflow-wrap: anywhere;
        }
        ${selector} .cc-description {
            margin: 8px 0 0;
            font-size: 12.5px;
            font-weight: 400;
            line-height: 1.42;
            letter-spacing: -.006em;
            opacity: .76;
        }
        ${selector} .cc-spacer { flex: 1 1 10px; min-height: 9px; }
        ${selector} .cc-cta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid currentColor;
            padding-top: 10px;
            font-size: 11px;
            font-weight: 650;
            letter-spacing: .045em;
            line-height: 1.2;
            text-transform: uppercase;
        }
        ${selector} .cc-cta-arrow {
            display: inline-grid;
            place-items: center;
            transition: transform var(--cc-time) cubic-bezier(.22,1,.36,1);
        }
        ${selector} .cc-card[data-linked="true"]:hover,
        ${selector} .cc-card[data-linked="true"]:focus-visible {
            box-shadow: 0 13px 34px rgba(0,0,0,.1);
            transform: translateY(-3px);
        }
        ${selector} .cc-card:hover .cc-photo img,
        ${selector} .cc-card[data-linked="true"]:focus-visible .cc-photo img {
            transform: scale(var(--cc-zoom)) translateY(-1%);
        }
        ${selector} .cc-card:hover .cc-panel,
        ${selector} .cc-card[data-linked="true"]:focus-visible .cc-panel {
            transform: translateY(calc(var(--cc-lift) * -1));
        }
        ${selector} .cc-card[data-linked="true"]:hover .cc-top-arrow,
        ${selector} .cc-card[data-linked="true"]:focus-visible .cc-top-arrow {
            transform: rotate(45deg);
        }
        ${selector} .cc-card[data-linked="true"]:hover .cc-cta-arrow,
        ${selector} .cc-card[data-linked="true"]:focus-visible .cc-cta-arrow {
            transform: translate(3px, -3px);
        }
        ${selector} .cc-card:focus-visible {
            outline: 3px solid #121212;
            outline-offset: 4px;
        }
        @container (max-width: 1019px) {
            ${selector} .cc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @container (max-width: 590px) {
            ${selector} .cc-grid { grid-template-columns: minmax(0, 1fr); }
            ${selector} .cc-photo { height: min(var(--cc-image-height), 245px); }
            ${selector} .cc-panel { height: auto; min-height: 170px; }
        }
        @media (hover: none) {
            ${selector} .cc-card[data-linked="true"]:hover { transform: none; box-shadow: 0 0 0 1px rgba(18,18,18,.055); }
            ${selector} .cc-card:hover .cc-panel { transform: none; }
            ${selector} .cc-card:hover .cc-photo img { transform: scale(1.001); }
        }
        @media (prefers-reduced-motion: reduce) {
            ${selector} .cc-card,
            ${selector} .cc-photo img,
            ${selector} .cc-panel,
            ${selector} .cc-top-arrow,
            ${selector} .cc-cta-arrow { transition: none !important; }
        }
    `

    return (
        <div
            data-color-category={scope}
            style={{
                width: "100%",
                height: "auto",
                position: "relative",
                minWidth: 0,
                boxSizing: "border-box",
                ["containerType" as any]: "inline-size",
                background,
                padding: 0,
                ...style,
                ["--cc-gap" as any]: `${Math.max(0, gap)}px`,
                ["--cc-radius" as any]: `${Math.max(0, cardRadius)}px`,
                ["--cc-image-height" as any]: `${Math.max(120, imageHeight)}px`,
                ["--cc-panel-height" as any]: `${Math.max(150, panelHeight)}px`,
                ["--cc-padding" as any]: `${Math.max(8, panelPadding)}px`,
                ["--cc-title-size" as any]: `${Math.max(16, titleSize)}px`,
                ["--cc-zoom" as any]: safeZoom,
                ["--cc-lift" as any]: `${lift}px`,
                ["--cc-time" as any]: `${motionTime}s`,
                fontFamily: "Inter, Arial, sans-serif",
                ...baseFont,
            }}
        >
            <style>{sheet}</style>
            <div className="cc-grid">
                {safeCards.map((card, index) => {
                    const link = typeof card.link === "string" ? card.link.trim() : ""
                    const linked = link.length > 0
                    const Surface: any = linked ? "a" : "article"
                    return (
                        <Surface
                            className="cc-card"
                            key={index}
                            data-linked={linked ? "true" : "false"}
                            href={linked ? link : undefined}
                            target={linked ? "_blank" : undefined}
                            rel={linked ? "noopener noreferrer" : undefined}
                            style={{
                                ["--cc-accent" as any]: card.accent || "#D7FF35",
                                ["--cc-ink" as any]: card.ink || "#171717",
                                cursor: linked ? "pointer" : "default",
                            }}
                            aria-label={linked ? `${card.category || "Category"}: ${card.title || "Explore"}` : undefined}
                        >
                            <div className="cc-photo">
                                {card.image?.src ? (
                                    <img
                                        src={card.image.src}
                                        srcSet={card.image.srcSet || undefined}
                                        alt={card.image.alt || card.title || ""}
                                        draggable={false}
                                        loading={index < 2 ? "eager" : "lazy"}
                                        style={{
                                            objectPosition: card.imagePosition || "50% 50%",
                                        }}
                                    />
                                ) : (
                                    <div
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background:
                                                "radial-gradient(circle at 75% 25%, rgba(255,255,255,.34), transparent 38%), linear-gradient(135deg, rgba(255,255,255,.12), transparent)",
                                        }}
                                    />
                                )}
                                {showNumbers && (
                                    <span className="cc-index">
                                        {String(index + 1).padStart(2, "0")} / {String(safeCards.length).padStart(2, "0")}
                                    </span>
                                )}
                                {linked && (
                                    <span className="cc-top-arrow">
                                        <Arrow size={17} />
                                    </span>
                                )}
                            </div>
                            <div className="cc-panel">
                                <div className="cc-category">
                                    <span>{card.category || "CATEGORY"}</span>
                                    <span className="cc-category-line" aria-hidden="true" />
                                </div>
                                <div className="cc-title">{card.title || "Your next idea."}</div>
                                {showDescriptions && card.description && (
                                    <p className="cc-description">{card.description}</p>
                                )}
                                <div className="cc-spacer" />
                                {linked && card.cta && (
                                    <div className="cc-cta">
                                        <span>{card.cta}</span>
                                        <span className="cc-cta-arrow">
                                            <Arrow size={17} />
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Surface>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ColorMatchCategoryCards, {
    cards: {
        type: ControlType.Array,
        title: "Categories",
        maxCount: 8,
        defaultValue: DEFAULT_CARDS,
        control: {
            type: ControlType.Object,
            controls: {
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "PORTFOLIO",
                },
                title: {
                    type: ControlType.String,
                    title: "Headline",
                    defaultValue: "Show your work.",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "A little space for everything you create.",
                },
                cta: {
                    type: ControlType.String,
                    title: "CTA",
                    defaultValue: "Start building",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imagePosition: {
                    type: ControlType.String,
                    title: "Image Focus",
                    defaultValue: "50% 50%",
                },
                accent: {
                    type: ControlType.Color,
                    title: "Card Color",
                    defaultValue: "#D7FF35",
                },
                ink: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#171717",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                    description: "Entire card opens this URL in a new tab. Empty = no link or CTA.",
                },
            },
        },
    },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 14, min: 0, max: 48, step: 1, unit: "px" },
    cardRadius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 40, step: 1, unit: "px" },
    imageHeight: { type: ControlType.Number, title: "Image Height", defaultValue: 254, min: 120, max: 500, step: 2, unit: "px" },
    panelHeight: { type: ControlType.Number, title: "Panel Height", defaultValue: 202, min: 150, max: 380, step: 2, unit: "px" },
    panelPadding: { type: ControlType.Number, title: "Padding", defaultValue: 22, min: 8, max: 48, step: 1, unit: "px" },
    titleSize: { type: ControlType.Number, title: "Title Size", defaultValue: 27, min: 16, max: 44, step: 1, unit: "px" },
    imageZoom: { type: ControlType.Number, title: "Hover Zoom", defaultValue: 1.09, min: 1, max: 1.5, step: 0.01 },
    colorLift: { type: ControlType.Number, title: "Color Lift", defaultValue: 21, min: 0, max: 60, step: 1, unit: "px" },
    duration: { type: ControlType.Number, title: "Motion Speed", defaultValue: 0.52, min: 0, max: 2, step: 0.05, unit: "s" },
    showNumbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: true },
    showDescriptions: { type: ControlType.Boolean, title: "Descriptions", defaultValue: true },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
})
