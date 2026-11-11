// Framer Code Component: SlidingHighlightGrid
// Paste this into a new Code Component in Framer (Assets → Code → New Component)

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useState } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FontStyle {
    family: string
    size: number
    weight: number
    lineHeight: number
    letterSpacing: number
    color: string
    hoverColor: string
}

interface CardData {
    category: string
    title: string
    body: string
    link: string
    linkLabel: string
}

interface Props {
    // Layout
    columns: number
    rows: number
    cardHeightMode: "fill" | "fixed"
    cardHeight: number
    // Colors
    backgroundColor: string
    highlightColor: string
    // Border
    showBorder: boolean
    borderColor: string
    borderWidth: number
    // Arrow
    showArrow: boolean
    arrowBgColor: string
    arrowIconColor: string
    // Category
    showCategory: boolean
    categoryStyle: FontStyle
    // Title
    showTitle: boolean
    titleStyle: FontStyle
    // Body
    showBody: boolean
    bodyStyle: FontStyle
    // Text alignment
    textAlign: "flex-start" | "center" | "flex-end"
    textAlignHorizontal: "left" | "center" | "right"
    blockDistribution:
        | "flex-start"
        | "center"
        | "flex-end"
        | "space-between"
        | "space-around"
        | "space-evenly"
    blockGap: number
    // Padding
    paddingMode: "global" | "custom"
    paddingAll: number
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    // Link label
    showLinkLabel: boolean
    linkStyle: FontStyle
    // Cards
    cards: CardData[]
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_CARDS: CardData[] = [
    {
        category: "Contractors",
        title: "Building Inclusivity: Celebrating Black History in Construction",
        body: "",
        link: "",
        linkLabel: "Read more",
    },
    {
        category: "Architects",
        title: "Outsource Consultants Inc becomes SCA Certified MBE",
        body: "",
        link: "",
        linkLabel: "Read more",
    },
    {
        category: "Building Owners",
        title: "Leaving Lead Behind: How NYC Plans to Replace Lead Pipes",
        body: "",
        link: "",
        linkLabel: "Read more",
    },
    {
        category: "Building Owners",
        title: "Powering Up: Applications Open for E-Bike Charging Cabinets",
        body: "",
        link: "",
        linkLabel: "Read more",
    },
    {
        category: "Contractors",
        title: "New Safety Regulations for High-Rise Construction Sites",
        body: "",
        link: "",
        linkLabel: "Read more",
    },
    {
        category: "Architects",
        title: "Sustainable Materials Reshaping Modern Architecture",
        body: "",
        link: "",
        linkLabel: "Read more",
    },
]

const DEFAULT_CATEGORY_STYLE: FontStyle = {
    family: "'GT America Mono', 'Courier New', monospace",
    size: 9,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0.08,
    color: "#1925AA",
    hoverColor: "#E8E6E0",
}

const DEFAULT_TITLE_STYLE: FontStyle = {
    family: "'PP Neue Montreal', 'Helvetica Neue', sans-serif",
    size: 15,
    weight: 400,
    lineHeight: 1.3,
    letterSpacing: 0,
    color: "#1925AA",
    hoverColor: "#E8E6E0",
}

const DEFAULT_BODY_STYLE: FontStyle = {
    family: "'PP Neue Montreal', 'Helvetica Neue', sans-serif",
    size: 13,
    weight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
    color: "#1925AA",
    hoverColor: "#E8E6E0",
}

const DEFAULT_LINK_STYLE: FontStyle = {
    family: "'PP Neue Montreal', 'Helvetica Neue', sans-serif",
    size: 13,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0,
    color: "#1925AA",
    hoverColor: "#E8E6E0",
}

// ─── Animated underline CSS ───────────────────────────────────────────────────

const UNDERLINE_CSS = `
.shg-link-label {
    display: inline-block;
    position: relative;
    text-decoration: none;
}
.shg-link-label::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 1px;
    background: currentColor;
    transform: scaleX(1);
    transform-origin: left center;
    transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.shg-card-wrap:not(:hover) .shg-link-label::after {
    transform: scaleX(0.25);
    transform-origin: right center;
}
.shg-card-wrap:hover .shg-link-label::after {
    transform: scaleX(1);
    transform-origin: left center;
}
`

function InjectCSS() {
    return <style dangerouslySetInnerHTML={{ __html: UNDERLINE_CSS }} />
}

// ─── Arrow ────────────────────────────────────────────────────────────────────

function ArrowIcon({ color }: { color: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "38%", height: "38%" }}
        >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
        </svg>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SlidingHighlightGrid(props: Props) {
    const {
        columns = 2,
        rows = 3,
        cardHeightMode = "fill",
        cardHeight = 200,
        backgroundColor = "#FFFFFF",
        highlightColor = "#1925AA",
        showBorder = true,
        borderColor = "#1925AA",
        borderWidth = 0.5,
        showArrow = true,
        arrowBgColor = "#E8E6E0",
        arrowIconColor = "#1925AA",
        showCategory = true,
        categoryStyle = DEFAULT_CATEGORY_STYLE,
        showTitle = true,
        titleStyle = DEFAULT_TITLE_STYLE,
        showBody = false,
        bodyStyle = DEFAULT_BODY_STYLE,
        textAlign = "flex-end",
        textAlignHorizontal = "left",
        blockDistribution = "flex-end",
        blockGap = 8,
        paddingMode = "global",
        paddingAll = 22,
        paddingTop = 22,
        paddingRight = 50,
        paddingBottom = 24,
        paddingLeft = 22,
        showLinkLabel = false,
        linkStyle = DEFAULT_LINK_STYLE,
        cards = DEFAULT_CARDS,
    } = props

    const computedPadding =
        paddingMode === "global"
            ? paddingAll
            : `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`

    const wrapRef = useRef<HTMLDivElement>(null)
    const [highlight, setHighlight] = useState<{
        top: number
        left: number
        width: number
        height: number
    } | null>(null)
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const [arrowVisible, setArrowVisible] = useState(false)

    const ARROW_SIZE = 64
    const T = "0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    const TA = "0.28s cubic-bezier(0.34, 1.56, 0.64, 1)"
    const border = showBorder ? `${borderWidth}px solid ${borderColor}` : "none"

    function handleMouseEnter(e: React.MouseEvent, index: number) {
        if (!wrapRef.current) return
        const wrapRect = wrapRef.current.getBoundingClientRect()
        const cardRect = (
            e.currentTarget as HTMLElement
        ).getBoundingClientRect()
        setHighlight({
            top: cardRect.top - wrapRect.top,
            left: cardRect.left - wrapRect.left,
            width: cardRect.width,
            height: cardRect.height,
        })
        setActiveIndex(index)
        setArrowVisible(true)
    }

    function handleMouseLeave() {
        setHighlight(null)
        setActiveIndex(null)
        setArrowVisible(false)
    }

    const totalCells = rows * columns
    const paddedCards: CardData[] = []
    for (let i = 0; i < totalCells; i++) {
        paddedCards.push(
            cards[i] ?? {
                category: "",
                title: "",
                body: "",
                link: "",
                linkLabel: "",
            }
        )
    }

    return (
        <div
            ref={wrapRef}
            onMouseLeave={handleMouseLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: backgroundColor,
            }}
        >
            <InjectCSS />

            {/* Sliding highlight */}
            <div
                style={{
                    position: "absolute",
                    background: highlightColor,
                    pointerEvents: "none",
                    zIndex: 0,
                    top: highlight ? highlight.top : 0,
                    left: highlight ? highlight.left : 0,
                    width: highlight ? highlight.width : 0,
                    height: highlight ? highlight.height : 0,
                    opacity: highlight ? 1 : 0,
                    transition: `top ${T}, left ${T}, width ${T}, height ${T}, opacity 0.2s ease`,
                }}
            />

            {/* Arrow */}
            {showArrow && (
                <div
                    style={{
                        position: "absolute",
                        width: ARROW_SIZE,
                        height: ARROW_SIZE,
                        background: arrowBgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 2,
                        top: highlight ? highlight.top : 0,
                        left: highlight
                            ? highlight.left + highlight.width - ARROW_SIZE
                            : 0,
                        transform: arrowVisible ? "scale(1)" : "scale(0)",
                        transformOrigin: "top right",
                        transition: `top ${T}, left ${T}, transform ${TA}`,
                    }}
                >
                    <ArrowIcon color={arrowIconColor} />
                </div>
            )}

            {/* Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridTemplateRows:
                        cardHeightMode === "fill"
                            ? `repeat(${rows}, 1fr)`
                            : `repeat(${rows}, ${cardHeight}px)`,
                    border,
                    width: "100%",
                    height: "100%",
                }}
            >
                {paddedCards.map((card, i) => {
                    const isActive = activeIndex === i
                    const isEmpty = !card.title && !card.category && !card.body
                    const hasLink = card.link?.trim() !== ""

                    const cardContent = isEmpty ? null : (
                        <>
                            {showCategory && card.category && (
                                <p
                                    style={{
                                        fontFamily:
                                            categoryStyle?.family ??
                                            DEFAULT_CATEGORY_STYLE.family,
                                        fontSize:
                                            categoryStyle?.size ??
                                            DEFAULT_CATEGORY_STYLE.size,
                                        fontWeight:
                                            categoryStyle?.weight ??
                                            DEFAULT_CATEGORY_STYLE.weight,
                                        lineHeight:
                                            categoryStyle?.lineHeight ??
                                            DEFAULT_CATEGORY_STYLE.lineHeight,
                                        letterSpacing: `${categoryStyle?.letterSpacing ?? DEFAULT_CATEGORY_STYLE.letterSpacing}em`,
                                        textTransform: "uppercase",
                                        margin: 0,
                                        color: isActive
                                            ? (categoryStyle?.hoverColor ??
                                              DEFAULT_CATEGORY_STYLE.hoverColor)
                                            : (categoryStyle?.color ??
                                              DEFAULT_CATEGORY_STYLE.color),
                                        transition: "color 0.25s ease",
                                    }}
                                >
                                    {card.category}
                                </p>
                            )}
                            {showTitle && card.title && (
                                <h3
                                    style={{
                                        fontFamily:
                                            titleStyle?.family ??
                                            DEFAULT_TITLE_STYLE.family,
                                        fontSize:
                                            titleStyle?.size ??
                                            DEFAULT_TITLE_STYLE.size,
                                        fontWeight:
                                            titleStyle?.weight ??
                                            DEFAULT_TITLE_STYLE.weight,
                                        lineHeight:
                                            titleStyle?.lineHeight ??
                                            DEFAULT_TITLE_STYLE.lineHeight,
                                        letterSpacing: `${titleStyle?.letterSpacing ?? DEFAULT_TITLE_STYLE.letterSpacing}em`,
                                        margin: 0,
                                        color: isActive
                                            ? (titleStyle?.hoverColor ??
                                              DEFAULT_TITLE_STYLE.hoverColor)
                                            : (titleStyle?.color ??
                                              DEFAULT_TITLE_STYLE.color),
                                        transition: "color 0.25s ease",
                                    }}
                                >
                                    {card.title}
                                </h3>
                            )}
                            {showBody && card.body && (
                                <p
                                    style={{
                                        fontFamily:
                                            bodyStyle?.family ??
                                            DEFAULT_BODY_STYLE.family,
                                        fontSize:
                                            bodyStyle?.size ??
                                            DEFAULT_BODY_STYLE.size,
                                        fontWeight:
                                            bodyStyle?.weight ??
                                            DEFAULT_BODY_STYLE.weight,
                                        lineHeight:
                                            bodyStyle?.lineHeight ??
                                            DEFAULT_BODY_STYLE.lineHeight,
                                        letterSpacing: `${bodyStyle?.letterSpacing ?? DEFAULT_BODY_STYLE.letterSpacing}em`,
                                        margin: 0,
                                        maxWidth: "80%",
                                        color: isActive
                                            ? (bodyStyle?.hoverColor ??
                                              DEFAULT_BODY_STYLE.hoverColor)
                                            : (bodyStyle?.color ??
                                              DEFAULT_BODY_STYLE.color),
                                        transition: "color 0.25s ease",
                                    }}
                                >
                                    {card.body}
                                </p>
                            )}
                            {showLinkLabel && card.linkLabel && (
                                <span
                                    className="shg-link-label"
                                    style={{
                                        fontFamily:
                                            linkStyle?.family ??
                                            DEFAULT_LINK_STYLE.family,
                                        fontSize:
                                            linkStyle?.size ??
                                            DEFAULT_LINK_STYLE.size,
                                        fontWeight:
                                            linkStyle?.weight ??
                                            DEFAULT_LINK_STYLE.weight,
                                        lineHeight:
                                            linkStyle?.lineHeight ??
                                            DEFAULT_LINK_STYLE.lineHeight,
                                        letterSpacing: `${linkStyle?.letterSpacing ?? DEFAULT_LINK_STYLE.letterSpacing}em`,
                                        color: isActive
                                            ? (linkStyle?.hoverColor ??
                                              DEFAULT_LINK_STYLE.hoverColor)
                                            : (linkStyle?.color ??
                                              DEFAULT_LINK_STYLE.color),
                                        transition: "color 0.25s ease",
                                    }}
                                >
                                    {card.linkLabel}
                                </span>
                            )}
                        </>
                    )

                    const sharedStyle: React.CSSProperties = {
                        position: "relative",
                        zIndex: 1,
                        border,
                        padding: computedPadding,
                        height: cardHeightMode === "fill" ? "100%" : cardHeight,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: blockDistribution,
                        alignItems:
                            textAlignHorizontal === "left"
                                ? "flex-start"
                                : textAlignHorizontal === "right"
                                  ? "flex-end"
                                  : "center",
                        textAlign: textAlignHorizontal,
                        gap: blockGap,
                        background: "transparent",
                        boxSizing: "border-box",
                        textDecoration: "none",
                    }

                    if (isEmpty)
                        return (
                            <div
                                key={i}
                                style={{ ...sharedStyle, cursor: "default" }}
                            />
                        )

                    if (hasLink) {
                        return (
                            <a
                                key={i}
                                href={card.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shg-card-wrap"
                                onMouseEnter={(e) => handleMouseEnter(e, i)}
                                style={{ ...sharedStyle, cursor: "pointer" }}
                            >
                                {cardContent}
                            </a>
                        )
                    }

                    return (
                        <div
                            key={i}
                            className="shg-card-wrap"
                            onMouseEnter={(e) => handleMouseEnter(e, i)}
                            style={{ ...sharedStyle, cursor: "default" }}
                        >
                            {cardContent}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Shared font object control ───────────────────────────────────────────────

const fontObjectControl = (
    defaultFamily: string,
    defaultSize: number,
    defaultColor: string,
    defaultLineHeight = 1.3,
    defaultLetterSpacing = 0
) => ({
    type: ControlType.Object,
    controls: {
        family: {
            type: ControlType.String,
            title: "Font Family",
            defaultValue: defaultFamily,
        },
        size: {
            type: ControlType.Number,
            title: "Size",
            defaultValue: defaultSize,
            min: 8,
            max: 72,
            step: 1,
            displayStepper: true,
        },
        weight: {
            type: ControlType.Enum,
            title: "Weight",
            defaultValue: 400,
            options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
            optionTitles: [
                "100 Thin",
                "200 ExtraLight",
                "300 Light",
                "400 Regular",
                "500 Medium",
                "600 SemiBold",
                "700 Bold",
                "800 ExtraBold",
                "900 Black",
            ],
        },
        lineHeight: {
            type: ControlType.Number,
            title: "Line Height",
            defaultValue: defaultLineHeight,
            min: 0.5,
            max: 3,
            step: 0.05,
            displayStepper: true,
        },
        letterSpacing: {
            type: ControlType.Number,
            title: "Letter Spacing",
            defaultValue: defaultLetterSpacing,
            min: -0.2,
            max: 1,
            step: 0.01,
            displayStepper: true,
        },
        color: {
            type: ControlType.Color,
            title: "Color",
            defaultValue: defaultColor,
        },
        hoverColor: {
            type: ControlType.Color,
            title: "Hover Color",
            defaultValue: "#E8E6E0",
        },
    },
})

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(SlidingHighlightGrid, {
    // ── Grid ─────────────────────────────────────────────────────────────────
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 3,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
    },
    cardHeightMode: {
        type: ControlType.Enum,
        title: "Card Height",
        defaultValue: "fill",
        options: ["fill", "fixed"],
        optionTitles: ["Fill", "Fixed"],
        displaySegmentedControl: true,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Height (px)",
        defaultValue: 200,
        min: 80,
        max: 600,
        step: 10,
        displayStepper: true,
        hidden: (props) => props.cardHeightMode !== "fixed",
    },

    // ── Alignment ────────────────────────────────────────────────────────────
    textAlignHorizontal: {
        type: ControlType.Enum,
        title: "Horizontal",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    blockDistribution: {
        type: ControlType.Enum,
        title: "Distribution",
        defaultValue: "flex-end",
        options: [
            "flex-start",
            "center",
            "flex-end",
            "space-between",
            "space-around",
            "space-evenly",
        ],
        optionTitles: [
            "Start",
            "Center",
            "End",
            "Space Between",
            "Space Around",
            "Space Evenly",
        ],
    },
    blockGap: {
        type: ControlType.Number,
        title: "Block Gap",
        defaultValue: 8,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
        hidden: (props) =>
            ["space-between", "space-around", "space-evenly"].includes(
                props.blockDistribution
            ),
    },

    // ── Padding ───────────────────────────────────────────────────────────────
    paddingMode: {
        type: ControlType.Enum,
        title: "Padding",
        defaultValue: "global",
        options: ["global", "custom"],
        optionTitles: ["Global", "Custom"],
        displaySegmentedControl: true,
    },
    paddingAll: {
        type: ControlType.Number,
        title: "All Sides",
        defaultValue: 22,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) => props.paddingMode !== "global",
    },
    paddingTop: {
        type: ControlType.FusedNumber,
        title: "Per Side",
        defaultValue: 22,
        toggleKey: "paddingPerSide",
        toggleTitles: ["All", "Per Side"],
        valueKeys: [
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
        hidden: (props) => props.paddingMode !== "custom",
    },

    // ── Colors ───────────────────────────────────────────────────────────────
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#1925AA",
    },

    // ── Border ───────────────────────────────────────────────────────────────
    showBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#1925AA",
        hidden: (props) => !props.showBorder,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0.5,
        min: 0.5,
        max: 10,
        step: 0.5,
        displayStepper: true,
        hidden: (props) => !props.showBorder,
    },

    // ── Arrow ────────────────────────────────────────────────────────────────
    showArrow: {
        type: ControlType.Boolean,
        title: "Arrow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    arrowBgColor: {
        type: ControlType.Color,
        title: "Arrow Background",
        defaultValue: "#E8E6E0",
        hidden: (props) => !props.showArrow,
    },
    arrowIconColor: {
        type: ControlType.Color,
        title: "Arrow Icon",
        defaultValue: "#1925AA",
        hidden: (props) => !props.showArrow,
    },

    // ── Overline ──────────────────────────────────────────────────────────────
    showCategory: {
        type: ControlType.Boolean,
        title: "Overline",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    categoryStyle: {
        ...fontObjectControl(
            "'GT America Mono', 'Courier New', monospace",
            9,
            "#1925AA",
            1.2,
            0.08
        ),
        title: "Overline Font",
        hidden: (props) => !props.showCategory,
    },

    // ── Title ─────────────────────────────────────────────────────────────────
    showTitle: {
        type: ControlType.Boolean,
        title: "Title",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    titleStyle: {
        ...fontObjectControl(
            "'PP Neue Montreal', 'Helvetica Neue', sans-serif",
            15,
            "#1925AA",
            1.3,
            0
        ),
        title: "Title Font",
        hidden: (props) => !props.showTitle,
    },

    // ── Body ──────────────────────────────────────────────────────────────────
    showBody: {
        type: ControlType.Boolean,
        title: "Body",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    bodyStyle: {
        ...fontObjectControl(
            "'PP Neue Montreal', 'Helvetica Neue', sans-serif",
            13,
            "#1925AA",
            1.5,
            0
        ),
        title: "Body Font",
        hidden: (props) => !props.showBody,
    },

    // ── Link Label ────────────────────────────────────────────────────────────
    showLinkLabel: {
        type: ControlType.Boolean,
        title: "Link Label",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    linkStyle: {
        ...fontObjectControl(
            "'PP Neue Montreal', 'Helvetica Neue', sans-serif",
            13,
            "#1925AA",
            1.2,
            0
        ),
        title: "Link Font",
        hidden: (props) => !props.showLinkLabel,
    },

    // ── Cards ────────────────────────────────────────────────────────────────
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                category: {
                    type: ControlType.String,
                    title: "Overline",
                    defaultValue: "Overline",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Article title goes here",
                    displayTextArea: true,
                },
                body: {
                    type: ControlType.String,
                    title: "Body",
                    defaultValue: "",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                    placeholder: "https://...",
                },
                linkLabel: {
                    type: ControlType.String,
                    title: "Link Text",
                    defaultValue: "Read more",
                },
            },
        },
        defaultValue: DEFAULT_CARDS,
    },
})
