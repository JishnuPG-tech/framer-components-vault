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

type ResponsiveImage = {
    src?: string
    alt?: string
    srcSet?: string
    positionX?: string
    positionY?: string
}

interface PortalItem {
    number: string
    label: string
    title: string
    description: string
    image?: ResponsiveImage | string
    color: string
    link: string
    cta: string
}

interface PortalRevealCardsProps {
    items: PortalItem[]
    cardHeight: number
    gap: number
    radius: number
    padding: number
    imageHeight: number
    restReveal: number
    revealSpeed: number
    titleSize: number
    background: string
    foreground: string
    labelColor: string
    font: any
    style?: React.CSSProperties
}

// Buyer link defaults intentionally stay empty. Links for a creator's own
// preview are configured ONLY as saved Framer canvas instance properties.
const DEFAULT_ITEMS: PortalItem[] = [
    {
        number: "01",
        label: "THE FIRST SPARK",
        title: "Shape your ideas.",
        description: "Turn a small thought into something worth sharing.",
        image: {
            src: "https://images.unsplash.com/photo-1726044781946-fca0baa0cdcd?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
            alt: "Sculptural red and pink discs photographed against a vivid backdrop",
        },
        color: "#FFC5D9",
        link: "",
        cta: "Get Started",
    },
    {
        number: "02",
        label: "THE CREATIVE PART",
        title: "Make it yours.",
        description: "Experiment freely and give every detail a purpose.",
        image: {
            src: "https://images.unsplash.com/photo-1648269277240-1ee0da354b76?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
            alt: "Colorful translucent glass sculpture with soft reflections",
        },
        color: "#CFC2FF",
        link: "",
        cta: "Get Started",
    },
    {
        number: "03",
        label: "READY FOR THE WORLD",
        title: "Let it go live.",
        description: "Bring your work into the world with confidence.",
        image: {
            src: "https://images.unsplash.com/photo-1737627274965-88c6ddf5125f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
            alt: "Bold blue and yellow abstract artwork with rich texture",
        },
        color: "#DCFA54",
        link: "",
        cta: "Get Started",
    },
]

function Arrow({ size = 20 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ display: "block", flexShrink: 0 }}
        >
            <path
                d="M5 19 19 5M8 5h11v11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function getImage(item: PortalItem) {
    if (typeof item.image === "string") return { src: item.image, alt: "" }
    return { src: item.image?.src || "", alt: item.image?.alt || item.title }
}

function PortalCard({
    item,
    index,
    config,
}: {
    item: PortalItem
    index: number
    config: PortalRevealCardsProps
}) {
    const [engaged, setEngaged] = React.useState(false)
    const reducedMotion = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    const linked = typeof item.link === "string" && item.link.trim().length > 0
    const image = getImage(item)
    const speed = reducedMotion || isStatic ? 0 : config.revealSpeed
    const coverHeight = Math.min(config.cardHeight - 130, config.imageHeight)
    const circleSize = engaged ? "95%" : `${config.restReveal}%`

    const commonCardStyle: React.CSSProperties = {
        position: "relative",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minWidth: 0,
        height: config.cardHeight,
        overflow: "hidden",
        borderRadius: config.radius,
        background: item.color || "#E7E7E7",
        color: config.foreground,
        border: "1px solid rgba(0,0,0,0.085)",
        boxSizing: "border-box",
        textDecoration: "none",
        cursor: linked ? "pointer" : "default",
        outlineOffset: 4,
        fontFamily: config.font?.fontFamily || "Inter, sans-serif",
        WebkitTapHighlightColor: "transparent",
    }

    const inner = (
        <>
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: coverHeight,
                    overflow: "hidden",
                }}
            >
                {image.src && (
                    <motion.div
                        initial={false}
                        animate={{
                            clipPath: `circle(${circleSize} at 50% 43%)`,
                        }}
                        transition={{
                            duration: speed,
                            ease: [0.2, 0.85, 0.2, 1],
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            willChange: engaged ? "clip-path" : "auto",
                        }}
                    >
                        <motion.img
                            src={image.src}
                            srcSet={typeof item.image === "object" ? item.image?.srcSet : undefined}
                            alt=""
                            decoding="async"
                            loading="eager"
                            initial={false}
                            animate={{ scale: engaged ? 1.055 : 1 }}
                            transition={{
                                duration: speed,
                                ease: [0.2, 0.85, 0.2, 1],
                            }}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center",
                                display: "block",
                            }}
                        />
                    </motion.div>
                )}
            </div>

            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    padding: config.padding,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    pointerEvents: "none",
                }}
            >
                <span
                    style={{
                        background: "#FFFFFF",
                        borderRadius: 100,
                        padding: "10px 14px",
                        fontSize: 13,
                        fontWeight: 650,
                        lineHeight: 1,
                        letterSpacing: "0.015em",
                    }}
                >
                    {item.number || String(index + 1).padStart(2, "0")}
                </span>
                {linked && (
                    <motion.span
                        aria-hidden="true"
                        initial={false}
                        animate={{ rotate: engaged ? 45 : 0 }}
                        transition={{ duration: speed, ease: [0.2, 0.85, 0.2, 1] }}
                        style={{
                            display: "grid",
                            placeItems: "center",
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                            background: "#FFFFFF",
                            borderRadius: "50%",
                        }}
                    >
                        <Arrow size={19} />
                    </motion.span>
                )}
            </div>

            <div style={{ flexGrow: 1, minHeight: 0, pointerEvents: "none" }} />

            <div
                style={{
                    zIndex: 2,
                    position: "relative",
                    flexShrink: 0,
                    padding: `${Math.max(18, config.padding - 4)}px ${config.padding}px ${Math.max(20, config.padding)}px`,
                    background: item.color || "#E7E7E7",
                    borderTopLeftRadius: Math.max(12, config.radius - 12),
                    borderTopRightRadius: Math.max(12, config.radius - 12),
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    minHeight: 145,
                    boxSizing: "border-box",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        fontSize: 10,
                        fontWeight: 750,
                        lineHeight: 1.25,
                        color: config.labelColor,
                        letterSpacing: "0.11em",
                        marginBottom: 13,
                    }}
                >
                    {item.label}
                </div>
                <div
                    style={{
                        fontSize: config.titleSize,
                        lineHeight: 1.04,
                        letterSpacing: "-0.045em",
                        fontWeight: 650,
                        marginBottom: 9,
                    }}
                >
                    {item.title}
                </div>
                <div
                    style={{
                        fontSize: 13,
                        lineHeight: 1.38,
                        maxWidth: "30ch",
                        color: config.labelColor,
                    }}
                >
                    {item.description}
                </div>
                {linked && item.cta && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 11,
                            textTransform: "uppercase",
                            fontWeight: 750,
                            lineHeight: 1,
                            letterSpacing: "0.08em",
                            marginTop: 20,
                            paddingTop: 13,
                            borderTop: "1px solid rgba(15,15,15,0.23)",
                        }}
                    >
                        <span>{item.cta}</span>
                        <Arrow size={15} />
                    </div>
                )}
            </div>
        </>
    )

    const events = {
        onMouseEnter: () => setEngaged(true),
        onMouseLeave: () => setEngaged(false),
        onFocus: () => setEngaged(true),
        onBlur: () => setEngaged(false),
    }

    if (linked) {
        return (
            <a
                {...events}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.title} — ${item.cta || "Open link"} (opens in a new tab)`}
                style={commonCardStyle}
            >
                {inner}
            </a>
        )
    }

    return (
        <article {...events} style={commonCardStyle}>
            {inner}
        </article>
    )
}

/**
 * A compact image-led card grid with a circular portal reveal on hover and focus.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1140
 * @framerIntrinsicHeight 450
 */
export default function PortalRevealCards(props: PortalRevealCardsProps) {
    const items = props.items?.length ? props.items : DEFAULT_ITEMS
    return (
        <section
            style={{
                ...props.style,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 265px), 1fr))",
                gap: props.gap,
                alignItems: "stretch",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                background: props.background,
            }}
            aria-label="Explore our creative steps"
        >
            {items.map((item, index) => (
                <PortalCard key={`${index}-${item.number}`} item={item} index={index} config={props} />
            ))}
        </section>
    )
}

PortalRevealCards.defaultProps = {
    items: DEFAULT_ITEMS,
    cardHeight: 440,
    gap: 16,
    radius: 27,
    padding: 22,
    imageHeight: 310,
    restReveal: 33,
    revealSpeed: 0.72,
    titleSize: 29,
    background: "rgba(255,255,255,0)",
    foreground: "#121217",
    labelColor: "#34343C",
    font: { fontFamily: "Inter" },
}

addPropertyControls(PortalRevealCards, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 8,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                number: { type: ControlType.String, title: "Number" },
                label: { type: ControlType.String, title: "Eyebrow" },
                title: { type: ControlType.String, title: "Headline" },
                description: { type: ControlType.String, title: "Description", displayTextArea: true },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                color: { type: ControlType.Color, title: "Card Color" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
                cta: { type: ControlType.String, title: "CTA" },
            },
        },
    },
    cardHeight: { type: ControlType.Number, title: "Height", min: 310, max: 680, step: 10, unit: "px", defaultValue: 440 },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 60, step: 1, unit: "px", defaultValue: 16 },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 70, step: 1, unit: "px", defaultValue: 27 },
    padding: { type: ControlType.Number, title: "Padding", min: 12, max: 42, step: 1, unit: "px", defaultValue: 22 },
    imageHeight: { type: ControlType.Number, title: "Image Height", min: 140, max: 520, step: 10, unit: "px", defaultValue: 310 },
    restReveal: { type: ControlType.Number, title: "Portal Size", min: 20, max: 70, step: 1, unit: "%", defaultValue: 33 },
    revealSpeed: { type: ControlType.Number, title: "Reveal Speed", min: 0.1, max: 1.8, step: 0.05, unit: "s", defaultValue: 0.72 },
    titleSize: { type: ControlType.Number, title: "Headline Size", min: 18, max: 46, step: 1, unit: "px", defaultValue: 29 },
    foreground: { type: ControlType.Color, title: "Text", defaultValue: "#121217" },
    labelColor: { type: ControlType.Color, title: "Secondary Text", defaultValue: "#34343C" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(255,255,255,0)" },
    font: { type: ControlType.Font, title: "Font", controls: "basic", defaultFontType: "sans-serif" },
})
