// User instructions: A simple and elegant component to show off a book or magazine cover. Customizable title, subtitle/tagline, author name, cover image. On hover it should look like the second screenshot (3D opened angle with visible pages), and on click it should fully open like a real book and show all pages the user adds (no extra pages). Remove any white lines.

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
    src: string
    srcSet?: string
    alt?: string
}

type CardItem = {
    title: string
    subtitle: string
    author: string
    coverImage?: ResponsiveImage
    pages?: ResponsiveImage[]
}

interface BookShowcaseProps {
    // Single card fallback
    title: string
    subtitle: string
    author: string
    coverImage?: ResponsiveImage
    backImage?: ResponsiveImage
    pages?: ResponsiveImage[]

    // Multi-card
    cards: CardItem[]
    layout: "single" | "row" | "grid"
    columns: number

    // Cover text visibility
    showSubtitle: boolean
    showAuthor: boolean

    // Card wrapper
    showCard: boolean
    cardBackground: string
    cardPadding: string
    cardRadius: string
    cardBorder: any
    cardShadow: string

    // Interaction
    openOnClick: boolean
    initialOpen: boolean

    // Book geometry
    perspective: number
    thickness: number
    radius: number

    hoverOpen: number
    clickOpen: number
    pageFan: number

    // Colors
    backgroundColor: string
    spineColor: string
    pageEdgeColor: string
    shadow: string

    // Cover text
    titleColor: string
    subtitleColor: string
    authorColor: string
    titleFont: any
    subtitleFont: any
    authorFont: any

    // Inside text
    showInsideText: boolean
    insideTextScrim: boolean
    insideTitleColor: string
    insideSubtitleColor: string
    insideAuthorColor: string
    insideTitleFont: any
    insideSubtitleFont: any
    insideAuthorFont: any
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function safeArray<T>(arr: T[] | undefined | null): T[] {
    return Array.isArray(arr) ? arr.filter(Boolean) : []
}

/**
 * Book Cover Showcase
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 420
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BookShowcase(props: BookShowcaseProps) {
    const {
        title,
        subtitle,
        author,
        coverImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Book cover",
        },
        backImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Back cover",
        },
        pages: singlePages,
        cards,
        layout,
        columns,
        showSubtitle,
        showAuthor,
        showCard,
        cardBackground,
        cardPadding,
        cardRadius,
        cardBorder,
        cardShadow,
        openOnClick,
        initialOpen,
        perspective,
        thickness,
        radius,
        hoverOpen,
        clickOpen,
        pageFan,
        backgroundColor,
        spineColor,
        pageEdgeColor,
        shadow,
        titleColor,
        subtitleColor,
        authorColor,
        titleFont,
        subtitleFont,
        authorFont,
        showInsideText,
        insideTextScrim,
        insideTitleColor,
        insideSubtitleColor,
        insideAuthorColor,
        insideTitleFont,
        insideSubtitleFont,
        insideAuthorFont,
    } = props

    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()

    const items = React.useMemo<CardItem[]>(() => {
        if (Array.isArray(cards) && cards.length > 0) return cards
        return [
            {
                title,
                subtitle,
                author,
                coverImage,
                pages: safeArray(singlePages),
            },
        ]
    }, [cards, title, subtitle, author, coverImage, singlePages])

    const isMulti = items.length > 1

    const resolvedLayout = React.useMemo<"single" | "row" | "grid">(() => {
        // If multiple cards are provided but layout is set to "single", ensure all cards are visible.
        if (isMulti && layout === "single") return "row"
        return layout
    }, [isMulti, layout])

    const [openMap, setOpenMap] = React.useState<Record<number, boolean>>({})
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

    React.useEffect(() => {
        React.startTransition(() => setOpenMap({}))
    }, [initialOpen])

    const toggleOpen = React.useCallback(
        (index: number) => {
            if (!openOnClick) return
            React.startTransition(() => {
                setOpenMap((m) => {
                    const current = m[index] ?? !!initialOpen
                    return { ...m, [index]: !current }
                })
            })
        },
        [openOnClick, initialOpen]
    )

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        background: backgroundColor,
        display: resolvedLayout === "grid" && isMulti ? "grid" : "flex",
        gridTemplateColumns:
            resolvedLayout === "grid" && isMulti
                ? `repeat(${Math.max(1, Math.round(columns))}, minmax(180px, 1fr))`
                : undefined,
        gap: isMulti ? 18 : 0,
        padding: isMulti ? 18 : 0,
        alignItems: resolvedLayout === "grid" && isMulti ? "stretch" : "center",
        justifyContent:
            resolvedLayout === "row" && isMulti
                ? "flex-start"
                : resolvedLayout === "grid" && isMulti
                  ? "stretch"
                  : "center",
        flexWrap: resolvedLayout === "row" && isMulti ? "nowrap" : "wrap",
        overflowX: resolvedLayout === "row" && isMulti ? "auto" : "visible",
        WebkitOverflowScrolling: resolvedLayout === "row" && isMulti ? "touch" : undefined,
        perspective: `${Math.max(100, perspective)}px`,
        overflow: "visible",
    }

    const t = Math.max(6, thickness)
    const r = clamp(radius, 0, 60)

    return (
        <section style={containerStyle} aria-label="Book showcase">
            {items.map((item, index) => {
                const itemCover = item.coverImage || coverImage
                const itemBack = (item as any).backImage || backImage
                const itemPages = safeArray(item.pages)

                const isOpen = openOnClick ? (openMap[index] ?? !!initialOpen) : false
                const isHovered = !isStatic && !prefersReducedMotion && hoverIndex === index

                const openAmount = isOpen ? 1 : isHovered ? 0.45 : 0
                const openAngle = openAmount === 1 ? clickOpen : hoverOpen * (openAmount / 0.45 || 0)

                const cardWrapStyle: React.CSSProperties = showCard
                    ? {
                          background: cardBackground,
                          padding: cardPadding,
                          borderRadius: cardRadius,
                          boxShadow: cardShadow,
                          ...(cardBorder || {}),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: resolvedLayout === "row" && isMulti ? 300 : "100%",
                          height: resolvedLayout === "grid" && isMulti ? "100%" : "100%",
                      }
                    : {
                          width: resolvedLayout === "row" && isMulti ? 300 : "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                      }

                const pageCount = itemPages.length
                const leftCount = Math.floor(pageCount / 2)
                const rightCount = pageCount - leftCount

                const keyBase = `${item.title}-${index}`

                return (
                    <div key={keyBase} style={cardWrapStyle}>
                        <motion.div
                            role={openOnClick ? "button" : "img"}
                            aria-label={openOnClick ? `Toggle open ${item.title}` : `${item.title} cover`}
                            tabIndex={openOnClick ? 0 : -1}
                            onKeyDown={(e) => {
                                if (!openOnClick) return
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    toggleOpen(index)
                                }
                            }}
                            onClick={() => toggleOpen(index)}
                            onHoverStart={
                                isStatic
                                    ? undefined
                                    : () => React.startTransition(() => setHoverIndex(index))
                            }
                            onHoverEnd={
                                isStatic
                                    ? undefined
                                    : () => React.startTransition(() => setHoverIndex(null))
                            }
                            style={{
                                width: isMulti ? "100%" : "72%",
                                height: isMulti ? "100%" : "88%",
                                aspectRatio: isMulti ? "3 / 4" : undefined,
                                position: "relative",
                                transformStyle: "preserve-3d",
                                borderRadius: r,
                                cursor: openOnClick ? "pointer" : "default",
                                boxShadow: shadow,
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                                userSelect: "none",
                            }}
                            animate={
                                prefersReducedMotion
                                    ? { rotateY: 0, rotateX: 0, y: 0, x: 0 }
                                    : {
                                          rotateY: -10 - openAmount * 10,
                                          rotateX: 8 + openAmount * 6,
                                          y: isHovered && !isOpen ? -6 : 0,
                                          x: -openAmount * (t * 0.8),
                                      }
                            }
                            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.6 }}
                        >
                            {/* Back board (subtle) */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: r,
                                    transform: `translateZ(${-t / 2}px)`,
                                    backgroundImage: itemBack?.src ? `url(${itemBack.src})` : undefined,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    backgroundColor: spineColor,
                                    opacity: 0.22,
                                    backfaceVisibility: "hidden",
                                }}
                                aria-hidden={true}
                            />

                            {/* Spine */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    width: t,
                                    borderRadius: r,
                                    transform: `rotateY(-90deg) translateZ(${t / 2}px)`,
                                    transformOrigin: "left center",
                                    background: spineColor,
                                    backfaceVisibility: "hidden",
                                }}
                                aria-hidden={true}
                            />

                            {/* Page edge */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    right: 0,
                                    width: t,
                                    borderRadius: r,
                                    transform: `rotateY(90deg) translateZ(${t / 2}px)`,
                                    transformOrigin: "right center",
                                    background: "transparent",
                                    opacity: 0,
                                    backfaceVisibility: "hidden",
                                }}
                                aria-hidden={true}
                            />

                            {/* Pages (left fan) */}
                            {pageCount > 0 && !prefersReducedMotion && openAmount > 0 && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: r,
                                        transformStyle: "preserve-3d",
                                        pointerEvents: "none",
                                    }}
                                    aria-hidden={true}
                                >
                                    {Array.from({ length: leftCount }).map((_, i) => {
                                        const img = itemPages[i]
                                        const p = leftCount <= 1 ? 0 : i / (leftCount - 1)
                                        const fan = clamp(pageFan, 0, 90) * openAmount
                                        const rotY = -(6 + p * fan)
                                        const rotZ = (p - 0.5) * 10 * openAmount
                                        const tz = -t / 2 - i * 0.35
                                        const lift = 0.12 + 0.45 * openAmount

                                        return (
                                            <div
                                                key={`${keyBase}-L-${i}`}
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    borderRadius: r,
                                                    overflow: "hidden",
                                                    transformOrigin: "left center",
                                                    transform: `translateZ(${tz}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
                                                    backgroundColor: "transparent",
                                                    backgroundImage: img?.src ? `url(${img.src})` : undefined,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                    opacity: lift,
                                                    boxShadow: `0 ${6 + p * 10}px ${18 + p * 22}px rgba(0,0,0,${0.12 * openAmount})`,
                                                }}
                                            />
                                        )
                                    })}

                                    {/* Pages (right fan) */}
                                    {Array.from({ length: rightCount }).map((_, i) => {
                                        const img = itemPages[leftCount + i]
                                        const p = rightCount <= 1 ? 0 : i / (rightCount - 1)
                                        const fan = clamp(pageFan, 0, 90) * openAmount
                                        const rotY = 6 + p * fan
                                        const rotZ = (0.5 - p) * 10 * openAmount
                                        const tx = (t * 0.55 + p * (t * 1.15)) * openAmount
                                        const tz = -t / 2 - (leftCount + i) * 0.35
                                        const lift = 0.18 + 0.7 * openAmount

                                        return (
                                            <div
                                                key={`${keyBase}-R-${i}`}
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    borderRadius: r,
                                                    overflow: "hidden",
                                                    transformOrigin: "left center",
                                                    transform: `translateZ(${tz}px) translateX(${tx}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
                                                    backgroundColor: "transparent",
                                                    backgroundImage: img?.src ? `url(${img.src})` : undefined,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                    opacity: lift,
                                                    boxShadow: `0 ${6 + p * 10}px ${18 + p * 26}px rgba(0,0,0,${0.14 * openAmount})`,
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            )}

                            {/* Front cover */}
                            <motion.div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: r,
                                    overflow: "hidden",
                                    transform: `translateZ(${t / 2}px)`,
                                    transformOrigin: "left center",
                                    backfaceVisibility: "hidden",
                                    backgroundImage: `url(${itemCover.src})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    willChange: prefersReducedMotion ? undefined : "transform",
                                }}
                                animate={prefersReducedMotion ? { rotateY: 0 } : { rotateY: -clamp(openAngle, 0, 179) }}
                                transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.55 }}
                                role="img"
                                aria-label={itemCover.alt || "Cover"}
                            >
                                {/* Cover scrim for readability */}
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: "58%",
                                        background:
                                            "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 78%)",
                                    }}
                                    aria-hidden={true}
                                />

                                <div
                                    style={{
                                        position: "absolute",
                                        left: 22,
                                        right: 22,
                                        bottom: 22,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
                                    }}
                                >
                                    <div style={{ color: titleColor, ...titleFont }}>{item.title}</div>
                                    {showSubtitle && (
                                        <div style={{ color: subtitleColor, ...subtitleFont, maxWidth: "92%" }}>
                                            {item.subtitle}
                                        </div>
                                    )}
                                    {showAuthor && (
                                        <>
                                            <div style={{ height: 6 }} />
                                            <div style={{ color: authorColor, ...authorFont, opacity: 0.95 }}>
                                                {item.author}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>

                            {/* Inside (text overlay when fully open) */}
                            {showInsideText && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: r,
                                        transform: `translateZ(${-t / 2 - 0.5}px)`,
                                        backfaceVisibility: "hidden",
                                        pointerEvents: "none",
                                        opacity: clamp((openAmount - 0.4) / 0.6, 0, 1),
                                        overflow: "hidden",
                                    }}
                                    aria-hidden={true}
                                >
                                    {insideTextScrim && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background:
                                                    "radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0.0) 100%)",
                                            }}
                                        />
                                    )}

                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            padding: 44,
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <div style={{ color: insideTitleColor, ...insideTitleFont }}>{item.title}</div>
                                        {showSubtitle && (
                                            <div style={{ color: insideSubtitleColor, ...insideSubtitleFont }}>
                                                {item.subtitle}
                                            </div>
                                        )}
                                        {showAuthor && (
                                            <>
                                                <div style={{ height: 6 }} />
                                                <div style={{ color: insideAuthorColor, ...insideAuthorFont }}>
                                                    {item.author}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )
            })}
        </section>
    )
}

addPropertyControls(BookShowcase, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Face of Tomorrow" },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "How Technology Rewrites Human Beauty",
                },
                author: { type: ControlType.String, title: "Author", defaultValue: "By Your Name" },
                coverImage: { type: ControlType.ResponsiveImage, title: "Cover" },
                backImage: { type: ControlType.ResponsiveImage, title: "Back" },
                pages: {
                    type: ControlType.Array,
                    title: "Pages",
                    maxCount: 24,
                    control: { type: ControlType.ResponsiveImage },
                    defaultValue: [
                        {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: "Page 1",
                        },
                        {
                            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                            alt: "Page 2",
                        },
                    ],
                },
            },
        },
        defaultValue: [
            {
                title: "Face of Tomorrow",
                subtitle: "How Technology Rewrites Human Beauty",
                author: "By Your Name",
            },
        ],
    },

    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["single", "row", "grid"],
        optionTitles: ["Single", "Row", "Grid"],
        defaultValue: "single",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
        hidden: ({ layout }) => layout !== "grid",
    },

    showCard: {
        type: ControlType.Boolean,
        title: "Card",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#FFFFFF",
        hidden: ({ showCard }) => !showCard,
    },
    cardPadding: {
        type: ControlType.Padding,
        title: "Card Padding",
        defaultValue: "18px",
        hidden: ({ showCard }) => !showCard,
    },
    cardRadius: {
        type: ControlType.BorderRadius,
        title: "Card Radius",
        defaultValue: "16px",
        hidden: ({ showCard }) => !showCard,
    },
    cardBorder: {
        type: ControlType.Border,
        title: "Card Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(0,0,0,0.08)",
        },
        hidden: ({ showCard }) => !showCard,
    },
    cardShadow: {
        type: ControlType.BoxShadow,
        title: "Card Shadow",
        defaultValue: "0px 14px 40px rgba(0,0,0,0.12)",
        hidden: ({ showCard }) => !showCard,
    },

    // Single fallback
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Face of Tomorrow",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "How Technology Rewrites Human Beauty",
    },
    author: {
        type: ControlType.String,
        title: "Author",
        defaultValue: "By Your Name",
    },
    coverImage: {
        type: ControlType.ResponsiveImage,
        title: "Cover",
    },
    backImage: {
        type: ControlType.ResponsiveImage,
        title: "Back",
    },
    pages: {
        type: ControlType.Array,
        title: "Pages",
        maxCount: 24,
        control: { type: ControlType.ResponsiveImage },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Page 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Page 2",
            },
        ],
    },

    showSubtitle: {
        type: ControlType.Boolean,
        title: "Subtitle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showAuthor: {
        type: ControlType.Boolean,
        title: "Author",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    openOnClick: {
        type: ControlType.Boolean,
        title: "Click",
        defaultValue: true,
        enabledTitle: "Opens",
        disabledTitle: "Off",
    },
    initialOpen: {
        type: ControlType.Boolean,
        title: "Open",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ openOnClick }) => !openOnClick,
    },

    hoverOpen: {
        type: ControlType.Number,
        title: "Hover",
        defaultValue: 35,
        min: 0,
        max: 80,
        step: 1,
        unit: "deg",
    },
    clickOpen: {
        type: ControlType.Number,
        title: "Click",
        defaultValue: 170,
        min: 0,
        max: 179,
        step: 1,
        unit: "deg",
        hidden: ({ openOnClick }) => !openOnClick,
    },
    pageFan: {
        type: ControlType.Number,
        title: "Fan",
        defaultValue: 60,
        min: 0,
        max: 120,
        step: 1,
        unit: "deg",
    },

    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 200,
        max: 2000,
        step: 10,
        unit: "px",
    },
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 18,
        min: 6,
        max: 60,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "BG",
        defaultValue: "#000000",
    },
    spineColor: {
        type: ControlType.Color,
        title: "Spine",
        defaultValue: "#000000",
    },
    pageEdgeColor: {
        type: ControlType.Color,
        title: "Pages",
        defaultValue: "#FFFFFF",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0px 16px 50px rgba(0,0,0,0.45)",
    },

    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#FFFFFF",
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle",
        defaultValue: "#FFFFFF",
    },
    authorColor: {
        type: ControlType.Color,
        title: "Author",
        defaultValue: "#FFFFFF",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1.05em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.25em",
        },
    },
    authorFont: {
        type: ControlType.Font,
        title: "Author Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },

    showInsideText: {
        type: ControlType.Boolean,
        title: "Inside",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    insideTextScrim: {
        type: ControlType.Boolean,
        title: "Scrim",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ showInsideText }) => !showInsideText,
    },

    insideTitleColor: {
        type: ControlType.Color,
        title: "In Title",
        defaultValue: "#000000",
        hidden: ({ showInsideText }) => !showInsideText,
    },
    insideSubtitleColor: {
        type: ControlType.Color,
        title: "In Sub",
        defaultValue: "#666666",
        hidden: ({ showInsideText }) => !showInsideText,
    },
    insideAuthorColor: {
        type: ControlType.Color,
        title: "In Author",
        defaultValue: "#3B82F6",
        hidden: ({ showInsideText }) => !showInsideText,
    },

    insideTitleFont: {
        type: ControlType.Font,
        title: "In Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
        hidden: ({ showInsideText }) => !showInsideText,
    },
    insideSubtitleFont: {
        type: ControlType.Font,
        title: "In Sub Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: ({ showInsideText }) => !showInsideText,
    },
    insideAuthorFont: {
        type: ControlType.Font,
        title: "In Author Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: ({ showInsideText }) => !showInsideText,
    },
})
