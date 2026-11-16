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


type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type ServiceCard = {
    image?: ResponsiveImage
    hoverImage?: ResponsiveImage
    imagePosition: string
    category: string
    title: string
    description: string
    tags: string
    detail: string
    cta: string
    link: string
    newTab: boolean
    accent: string
}

type Props = {
    cards: ServiceCard[]
    minCardWidth: number
    gap: number
    padding: number
    contentPadding: number
    imageHeight: number
    radius: number
    borderWidth: number
    showImages: boolean
    showNumbers: boolean
    showTags: boolean
    showDescription: boolean
    background: string
    cardBackground: string
    textColor: string
    mutedColor: string
    borderColor: string
    tagBackground: string
    ctaBackground: string
    ctaText: string
    hoverText: string
    focusColor: string
    hoverLift: number
    imageZoom: number
    shadow: number
    duration: number
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_CARDS: ServiceCard[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "",
        },
        imagePosition: "50% 50%",
        category: "STRATEGY & IDENTITY",
        title: "Build your brand.",
        description:
            "A clear identity that feels like you. Made to connect and stay in mind.",
        tags: "Strategy, Identity, Art direction",
        detail: "Made to stand out",
        cta: "Explore branding",
        link: "#",
        newTab: false,
        accent: "#DFFF8F",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "",
        },
        imagePosition: "50% 50%",
        category: "DESIGN & DEVELOPMENT",
        title: "Make it digital.",
        description:
            "Thoughtful websites with a clear purpose. Designed with people in mind.",
        tags: "UX/UI, Framer, Development",
        detail: "Built around people",
        cta: "Explore websites",
        link: "#",
        newTab: false,
        accent: "#C9C2FF",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "",
        },
        imagePosition: "50% 50%",
        category: "MOTION & INTERACTION",
        title: "Bring it to life.",
        description:
            "Small details. Lasting impressions. Motion that gives your brand character.",
        tags: "Motion, Interaction, Prototyping",
        detail: "Every detail matters",
        cta: "Explore motion",
        link: "#",
        newTab: false,
        accent: "#FFC8A9",
    },
]

const TITLE_FONT: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "27px",
    fontWeight: 500,
    letterSpacing: "-0.045em",
    lineHeight: "1.12em",
}

const BODY_FONT: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    fontWeight: 400,
    letterSpacing: "-0.01em",
    lineHeight: "1.5em",
}

const LABEL_FONT: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0em",
    lineHeight: "1.35em",
}

function Arrow() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M5 12H19M13 6L19 12L13 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 440
 */
export default function ServiceTiles(props: Props) {
    const {
        cards = DEFAULT_CARDS,
        minCardWidth = 260,
        gap = 16,
        padding = 20,
        contentPadding = 22,
        imageHeight = 144,
        radius = 0,
        borderWidth = 1,
        showImages = true,
        showNumbers = true,
        showTags = true,
        showDescription = true,
        background = "#F5F5F2",
        cardBackground = "#FFFFFF",
        textColor = "#191919",
        mutedColor = "#686863",
        borderColor = "#E4E4DE",
        tagBackground = "#F3F3EF",
        ctaBackground = "#F3F3EF",
        ctaText = "#191919",
        hoverText = "#191919",
        focusColor = "#5252E8",
        hoverLift = 5,
        imageZoom = 1.06,
        shadow = 0.1,
        duration = 0.35,
        titleFont,
        bodyFont,
        labelFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const instanceId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const scope = `service-tiles-${instanceId}`
    const selector = `[data-service-tiles="${scope}"]`

    const safeCards = Array.isArray(cards) ? cards : DEFAULT_CARDS
    const safeDuration = Math.max(0, duration)
    const safeShadow = Math.min(1, Math.max(0, shadow))

    const headingStyle = { ...TITLE_FONT, ...titleFont }
    const paragraphStyle = { ...BODY_FONT, ...bodyFont }
    const smallStyle = { ...LABEL_FONT, ...labelFont }

    const activeStyles = `
        transform: translateY(-${Math.max(0, hoverLift)}px);
        box-shadow:
            0 16px 32px rgba(0, 0, 0, ${safeShadow}),
            0 3px 8px rgba(0, 0, 0, ${safeShadow * 0.35});
    `

    return (
        <div
            data-service-tiles={scope}
            data-static={isStatic ? "true" : "false"}
            style={{
                width: "100%",
                height: "auto",
                ...style,
                position: "relative",
                minWidth: 0,
                boxSizing: "border-box",
                background,
                padding: Math.max(0, padding),
            }}
        >
            <style>{`
                ${selector},
                ${selector} * {
                    box-sizing: border-box;
                }

                ${selector} .st-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(
                                min(100%, ${Math.max(160, minCardWidth)}px),
                                1fr
                            )
                        );
                    gap: ${Math.max(0, gap)}px;
                    align-items: stretch;
                    min-width: 0;
                }

                ${selector} .st-card {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    height: 100%;
                    color: ${textColor};
                    background: ${cardBackground};
                    border: ${Math.max(0, borderWidth)}px solid ${borderColor};
                    border-radius: ${Math.max(0, radius)}px;
                    text-decoration: none;
                    isolation: isolate;
                    -webkit-tap-highlight-color: transparent;
                    transition:
                        transform ${safeDuration}s cubic-bezier(.2,.75,.25,1),
                        box-shadow ${safeDuration}s ease;
                }

                ${selector} .st-card[data-linked="true"] {
                    cursor: pointer;
                }

                ${selector} .st-media {
                    position: relative;
                    height: ${Math.max(40, imageHeight)}px;
                    flex-shrink: 0;
                    overflow: hidden;
                    background: var(--st-accent);
                    border-radius:
                        ${Math.max(0, radius - borderWidth)}px
                        ${Math.max(0, radius - borderWidth)}px
                        0 0;
                }

                ${selector} .st-image {
                    display: block;
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transform: scale(1);
                    transition:
                        transform ${safeDuration * 1.6}s
                            cubic-bezier(.2,.75,.25,1),
                        opacity ${safeDuration}s ease;
                }

                ${selector} .st-image-secondary {
                    opacity: 0;
                }

                ${selector} .st-number {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 30px;
                    min-height: 26px;
                    padding: 4px 7px;
                    background: ${cardBackground};
                    color: ${textColor};
                    border-radius: ${Math.min(6, Math.max(0, radius))}px;
                    font-variant-numeric: tabular-nums;
                }

                ${selector} .st-body {
                    display: flex;
                    flex: 1;
                    flex-direction: column;
                    align-items: stretch;
                    min-width: 0;
                    padding: ${Math.max(8, contentPadding)}px;
                }

                ${selector} .st-eyebrow {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                    margin-bottom: 14px;
                    color: ${mutedColor};
                }

                ${selector} .st-dot {
                    width: 8px;
                    height: 8px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    background: var(--st-accent);
                    box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
                }

                ${selector} .st-title {
                    margin: 0;
                    color: ${textColor};
                    overflow-wrap: anywhere;
                }

                ${selector} .st-description {
                    margin: 10px 0 0;
                    color: ${mutedColor};
                    overflow-wrap: anywhere;
                }

                ${selector} .st-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 18px;
                }

                ${selector} .st-tag {
                    display: inline-flex;
                    align-items: center;
                    padding: 5px 8px;
                    max-width: 100%;
                    background: ${tagBackground};
                    color: ${mutedColor};
                    border-radius: ${Math.min(6, Math.max(0, radius))}px;
                    overflow-wrap: anywhere;
                }

                ${selector} .st-footer {
                    margin-top: auto;
                    padding-top: 22px;
                    min-width: 0;
                }

                ${selector} .st-detail {
                    margin-bottom: 10px;
                    color: ${mutedColor};
                    overflow-wrap: anywhere;
                }

                ${selector} .st-cta {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    min-height: 46px;
                    padding: 12px 14px;
                    overflow: hidden;
                    isolation: isolate;
                    background: ${ctaBackground};
                    color: ${ctaText};
                    border-radius: ${Math.min(12, Math.max(0, radius))}px;
                    transition: color ${safeDuration}s ease;
                }

                ${selector} .st-cta::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: var(--st-accent);
                    transform: scaleX(0);
                    transform-origin: left center;
                    transition:
                        transform ${safeDuration}s
                        cubic-bezier(.2,.75,.25,1);
                    z-index: -1;
                }

                ${selector} .st-cta-label {
                    min-width: 0;
                    overflow-wrap: anywhere;
                }

                ${selector} .st-arrow {
                    display: inline-flex;
                    flex-shrink: 0;
                    transition:
                        transform ${safeDuration}s
                        cubic-bezier(.2,.75,.25,1);
                }

                ${selector}[data-static="false"]
                .st-card[data-linked="true"]:focus-visible {
                    outline: 2px solid ${focusColor};
                    outline-offset: 4px;
                    ${activeStyles}
                }

                ${selector}[data-static="false"]
                .st-card[data-linked="true"]:focus-visible .st-cta {
                    color: ${hoverText};
                }

                ${selector}[data-static="false"]
                .st-card[data-linked="true"]:focus-visible .st-cta::before {
                    transform: scaleX(1);
                }

                ${selector}[data-static="false"]
                .st-card[data-linked="true"]:focus-visible .st-arrow {
                    transform: rotate(-35deg);
                }

                @media (hover: hover) and (pointer: fine) {
                    ${selector}[data-static="false"]
                    .st-card[data-linked="true"]:hover {
                        ${activeStyles}
                    }

                    ${selector}[data-static="false"]
                    .st-card[data-linked="true"]:hover .st-image {
                        transform: scale(${Math.max(1, imageZoom)});
                    }

                    ${selector}[data-static="false"]
                    .st-card[data-linked="true"]:hover
                    .st-image-secondary {
                        opacity: 1;
                    }

                    ${selector}[data-static="false"]
                    .st-card[data-linked="true"]:hover .st-cta {
                        color: ${hoverText};
                    }

                    ${selector}[data-static="false"]
                    .st-card[data-linked="true"]:hover .st-cta::before {
                        transform: scaleX(1);
                    }

                    ${selector}[data-static="false"]
                    .st-card[data-linked="true"]:hover .st-arrow {
                        transform: rotate(-35deg);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    ${selector} .st-card,
                    ${selector} .st-image,
                    ${selector} .st-cta,
                    ${selector} .st-cta::before,
                    ${selector} .st-arrow {
                        transition: none !important;
                    }

                    ${selector} .st-card,
                    ${selector} .st-image,
                    ${selector} .st-arrow {
                        transform: none !important;
                    }
                }

                ${selector}[data-static="true"] *,
                ${selector}[data-static="true"] *::before {
                    transition: none !important;
                }
            `}</style>

            <div className="st-grid">
                {safeCards.map((card, index) => {
                    const link = card.link?.trim()
                    const linked = Boolean(link)
                    const tags = (card.tags || "")
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)

                    const hasImage = Boolean(card.image?.src)
                    const number = String(index + 1).padStart(2, "0")
                    const titleId = `${scope}-title-${index}`

                    const content = (
                        <>
                            {showImages && (
                                <div className="st-media">
                                    {hasImage && (
                                        <img
                                            className="st-image"
                                            src={card.image?.src}
                                            srcSet={card.image?.srcSet}
                                            sizes={`${Math.max(160, minCardWidth)}px`}
                                            alt={card.image?.alt || ""}
                                            loading="lazy"
                                            decoding="async"
                                            draggable={false}
                                            style={{
                                                objectPosition:
                                                    card.imagePosition ||
                                                    "50% 50%",
                                            }}
                                        />
                                    )}

                                    {card.hoverImage?.src && (
                                        <img
                                            className="st-image st-image-secondary"
                                            src={card.hoverImage.src}
                                            srcSet={card.hoverImage.srcSet}
                                            sizes={`${Math.max(160, minCardWidth)}px`}
                                            alt=""
                                            aria-hidden="true"
                                            loading="lazy"
                                            decoding="async"
                                            draggable={false}
                                            style={{
                                                objectPosition:
                                                    card.imagePosition ||
                                                    "50% 50%",
                                            }}
                                        />
                                    )}

                                    {showNumbers && (
                                        <span
                                            className="st-number"
                                            style={smallStyle}
                                            aria-hidden="true"
                                        >
                                            {number}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="st-body">
                                {(card.category ||
                                    (showNumbers && !showImages)) && (
                                    <div
                                        className="st-eyebrow"
                                        style={smallStyle}
                                    >
                                        <span
                                            className="st-dot"
                                            aria-hidden="true"
                                        />

                                        <span
                                            style={{
                                                overflowWrap: "anywhere",
                                            }}
                                        >
                                            {showNumbers && !showImages
                                                ? `${number} / `
                                                : ""}
                                            {card.category}
                                        </span>
                                    </div>
                                )}

                                <h3
                                    id={titleId}
                                    className="st-title"
                                    style={headingStyle}
                                >
                                    {card.title || "Your service"}
                                </h3>

                                {showDescription && card.description && (
                                    <p
                                        className="st-description"
                                        style={paragraphStyle}
                                    >
                                        {card.description}
                                    </p>
                                )}

                                {showTags && tags.length > 0 && (
                                    <div className="st-tags">
                                        {tags.map((tag, tagIndex) => (
                                            <span
                                                key={`${tag}-${tagIndex}`}
                                                className="st-tag"
                                                style={smallStyle}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {(card.detail || (linked && card.cta)) && (
                                    <div className="st-footer">
                                        {card.detail && (
                                            <div
                                                className="st-detail"
                                                style={smallStyle}
                                            >
                                                {card.detail}
                                            </div>
                                        )}

                                        {linked && card.cta && (
                                            <div
                                                className="st-cta"
                                                style={paragraphStyle}
                                            >
                                                <span className="st-cta-label">
                                                    {card.cta}
                                                </span>

                                                <span className="st-arrow">
                                                    <Arrow />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )

                    const cardStyle = {
                        "--st-accent": card.accent || "#DFFF8F",
                    } as React.CSSProperties

                    // One native anchor per card:
                    // supports keyboard, middle-click and browser link menus.
                    // The visual CTA is part of this same link.
                    if (linked) {
                        return (
                            <a
                                key={index}
                                className="st-card"
                                data-linked="true"
                                href={link}
                                target={card.newTab ? "_blank" : undefined}
                                rel={
                                    card.newTab
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                aria-labelledby={titleId}
                                tabIndex={isStatic ? -1 : undefined}
                                onClick={
                                    isStatic
                                        ? (event) => event.preventDefault()
                                        : undefined
                                }
                                style={cardStyle}
                            >
                                {content}
                            </a>
                        )
                    }

                    return (
                        <article
                            key={index}
                            className="st-card"
                            data-linked="false"
                            aria-labelledby={titleId}
                            style={cardStyle}
                        >
                            {content}
                        </article>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ServiceTiles, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 24,
        defaultValue: DEFAULT_CARDS,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Your next big thing.",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "DESIGN & STRATEGY",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue:
                        "A short introduction to what you do and why it matters.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                hoverImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Hover Image",
                    description:
                        "Optional second image. Fades in on desktop hover.",
                },
                imagePosition: {
                    type: ControlType.String,
                    title: "Image Focus",
                    defaultValue: "50% 50%",
                    description: "CSS image position, e.g. 50% 50% or 50% 25%.",
                },
                tags: {
                    type: ControlType.String,
                    title: "Tags",
                    defaultValue: "Strategy, Design, Development",
                    description: "Separate tags with commas.",
                },
                detail: {
                    type: ControlType.String,
                    title: "Detail",
                    defaultValue: "Made with purpose",
                },
                cta: {
                    type: ControlType.String,
                    title: "CTA Label",
                    defaultValue: "Explore service",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "#",
                    description:
                        "The entire card opens this link. Leave empty for a static card.",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
                accent: {
                    type: ControlType.Color,
                    title: "Accent",
                    defaultValue: "#DFFF8F",
                },
            },
        },
    },

    minCardWidth: {
        type: ControlType.Number,
        title: "Min Width",
        defaultValue: 260,
        min: 160,
        max: 600,
        step: 10,
        unit: "px",
        description: "Cards wrap automatically when there is not enough space.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Outer Padding",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    contentPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        defaultValue: 22,
        min: 8,
        max: 60,
        step: 1,
        unit: "px",
    },
    showImages: {
        type: ControlType.Boolean,
        title: "Images",
        defaultValue: true,
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 144,
        min: 40,
        max: 360,
        step: 4,
        unit: "px",
        hidden: (props) => !props.showImages,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 0.5,
        unit: "px",
    },
    showNumbers: {
        type: ControlType.Boolean,
        title: "Numbers",
        defaultValue: true,
    },
    showTags: {
        type: ControlType.Boolean,
        title: "Tags",
        defaultValue: true,
    },
    showDescription: {
        type: ControlType.Boolean,
        title: "Descriptions",
        defaultValue: true,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F2",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Headlines",
        defaultValue: "#191919",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Body Text",
        defaultValue: "#686863",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#E4E4DE",
    },
    tagBackground: {
        type: ControlType.Color,
        title: "Tag BG",
        defaultValue: "#F3F3EF",
    },
    ctaBackground: {
        type: ControlType.Color,
        title: "CTA BG",
        defaultValue: "#F3F3EF",
    },
    ctaText: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#191919",
    },
    hoverText: {
        type: ControlType.Color,
        title: "CTA Hover Text",
        defaultValue: "#191919",
    },
    focusColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#5252E8",
    },

    hoverLift: {
        type: ControlType.Number,
        title: "Hover Lift",
        defaultValue: 5,
        min: 0,
        max: 16,
        step: 1,
        unit: "px",
    },
    imageZoom: {
        type: ControlType.Number,
        title: "Image Zoom",
        defaultValue: 1.06,
        min: 1,
        max: 1.3,
        step: 0.01,
    },
    shadow: {
        type: ControlType.Number,
        title: "Hover Shadow",
        defaultValue: 0.1,
        min: 0,
        max: 0.3,
        step: 0.01,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.35,
        min: 0,
        max: 1.2,
        step: 0.05,
        unit: "s",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "27px",
            variant: "Medium",
            letterSpacing: "-0.045em",
            lineHeight: "1.12em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.35em",
        },
    },
})
