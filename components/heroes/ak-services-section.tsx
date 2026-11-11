// Framer Component: Services Section

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useEffect } from "react"

// ─── Framer layout metadata — suppresses the "Edit Code" button ───
// These tell Framer this component handles its own sizing.
export const layoutInfo = {
    supportedLayouts: ["full-width"],
}

// ─────────────────────────────────────────────────────────────
//  FONT OPTIONS
// ─────────────────────────────────────────────────────────────
const FONT_OPTIONS = [
    "Georgia, serif",
    '"Times New Roman", Times, serif',
    '"Palatino Linotype", Palatino, serif',
    '"Playfair Display", Georgia, serif',
    '"Merriweather", Georgia, serif',
    "system-ui, sans-serif",
    "Arial, Helvetica, sans-serif",
    '"Helvetica Neue", Helvetica, sans-serif',
    '"Trebuchet MS", sans-serif',
    "Verdana, Geneva, sans-serif",
    '"Gill Sans", sans-serif',
    '"Futura", "Century Gothic", sans-serif',
    '"Courier New", Courier, monospace',
    '"Lucida Console", Monaco, monospace',
]

const FONT_LABELS = [
    "Georgia",
    "Times New Roman",
    "Palatino",
    "Playfair Display",
    "Merriweather",
    "System UI (Sans)",
    "Arial",
    "Helvetica Neue",
    "Trebuchet MS",
    "Verdana",
    "Gill Sans",
    "Futura / Century Gothic",
    "Courier New",
    "Lucida Console",
]

const WEIGHT_OPTIONS = ["300", "400", "500", "600", "700", "800", "900"]
const WEIGHT_LABELS = [
    "Light 300",
    "Regular 400",
    "Medium 500",
    "SemiBold 600",
    "Bold 700",
    "ExtraBold 800",
    "Black 900",
]

// ─────────────────────────────────────────────────────────────
//  IMAGE SLIDER  — absolute-positioned slides, no width math
// ─────────────────────────────────────────────────────────────
function ImageSlider({ images }: { images: string[] }) {
    const [active, setActive] = useState(0)
    const startX = useRef(0)
    const startY = useRef(0)
    const total = images.length

    useEffect(() => {
        setActive(0)
    }, [images.length])

    const go = (i: number) => setActive((i + total) % total)

    const onTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX
        startY.current = e.touches[0].clientY
    }
    const onTouchEnd = (e: React.TouchEvent) => {
        const dx = startX.current - e.changedTouches[0].clientX
        const dy = Math.abs(startY.current - e.changedTouches[0].clientY)
        if (Math.abs(dx) > 30 && Math.abs(dx) > dy)
            go(active + (dx > 0 ? 1 : -1))
    }
    const onMouseDown = (e: React.MouseEvent) => {
        startX.current = e.clientX
    }
    const onMouseUp = (e: React.MouseEvent) => {
        const dx = startX.current - e.clientX
        if (Math.abs(dx) > 30) go(active + (dx > 0 ? 1 : -1))
    }

    if (!total)
        return (
            <div style={s.emptySlider}>
                <span style={s.emptyText}>Add images in Properties</span>
            </div>
        )

    return (
        <div
            style={s.sliderWrap}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {images.map((src, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute" as const,
                        inset: 0,
                        opacity: i === active ? 1 : 0,
                        transition: "opacity 0.4s ease",
                        pointerEvents:
                            i === active
                                ? ("auto" as const)
                                : ("none" as const),
                    }}
                >
                    <img
                        src={src}
                        alt=""
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover" as const,
                            display: "block",
                            pointerEvents: "none" as const,
                        }}
                    />
                </div>
            ))}

            {total > 1 && (
                <div style={s.dotsRow}>
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation()
                                setActive(i)
                            }}
                            style={{
                                ...s.dot,
                                background:
                                    i === active
                                        ? "rgba(255,255,255,1)"
                                        : "rgba(255,255,255,0.45)",
                                transform:
                                    i === active ? "scale(1.35)" : "scale(1)",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
//  SERVICE CARD
// ─────────────────────────────────────────────────────────────
function ServiceCard({
    item,
    cardBg,
    cardRadius,
    tagBg,
    tagColor,
    tagDotColor,
}: any) {
    const {
        icon,
        iconPosition,
        title,
        titleFont,
        titleSize,
        titleColor,
        titleWeight,
        description,
        descFont,
        descSize,
        descColor,
        descWeight,
        tags,
        images,
    } = item

    return (
        <div
            style={{
                ...s.card,
                background: cardBg || "#fff",
                borderRadius: cardRadius ?? 20,
                height: "100%",
            }}
        >
            {/* Info block — flexGrow pushes slider to bottom */}
            <div style={{ ...s.cardTop, flexGrow: 1 }}>
                {/* Icon */}
                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            iconPosition === "right"
                                ? "flex-end"
                                : "flex-start",
                        marginBottom: 20,
                    }}
                >
                    {icon ? (
                        <img src={icon} alt="" style={s.icon} />
                    ) : (
                        <DefaultFolderIcon />
                    )}
                </div>

                {/* Title */}
                <h3
                    style={{
                        fontFamily: titleFont || "Georgia, serif",
                        fontSize: titleSize || 22,
                        fontWeight: titleWeight || "700",
                        color: titleColor || "#111111",
                        margin: "0 0 10px 0",
                        lineHeight: 1.18,
                        letterSpacing: "-0.01em",
                    }}
                >
                    {title || "Service Title"}
                </h3>

                {/* Description */}
                <p
                    style={{
                        fontFamily: descFont || "system-ui, sans-serif",
                        fontSize: descSize || 14,
                        fontWeight: descWeight || "400",
                        color: descColor || "#555555",
                        margin: "0 0 20px 0",
                        lineHeight: 1.65,
                    }}
                >
                    {description ||
                        "Short description of the service goes here."}
                </p>

                {/* Tags */}
                {(tags || []).length > 0 && (
                    <div style={s.tagsWrap}>
                        {tags.map((tag: string, i: number) => (
                            <span
                                key={i}
                                style={{
                                    ...s.tag,
                                    background: tagBg || "#f2f2f2",
                                    color: tagColor || "#222",
                                }}
                            >
                                <span
                                    style={{
                                        ...s.tagDot,
                                        background: tagDotColor || "#e5392a",
                                    }}
                                />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Slider — always at bottom */}
            <ImageSlider images={images || []} />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
//  DEFAULT FOLDER ICON
// ─────────────────────────────────────────────────────────────
function DefaultFolderIcon() {
    return (
        <svg width="52" height="44" viewBox="0 0 52 44" fill="none">
            <rect x="0" y="12" width="52" height="32" rx="5" fill="#1a1a1a" />
            <rect x="0" y="8" width="22" height="12" rx="4" fill="#1a1a1a" />
            <rect x="1" y="13" width="50" height="2" fill="#2e2e2e" />
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ServicesSection(props: any) {
    const {
        sectionBg,
        paddingH,
        paddingV,
        showBadge,
        badgeLabel,
        badgeFont,
        badgeFontSize,
        badgeBg,
        badgeTextColor,
        badgeAccentColor,
        heading,
        headingFont,
        headingWeight,
        headingSize,
        headingColor,
        showSubheading,
        subheading,
        subheadingFont,
        subheadingWeight,
        subheadingSize,
        subheadingColor,
        columns,
        columnGap,
        rowGap,
        cardBg,
        cardRadius,
        tagBg,
        tagColor,
        tagDotColor,
        services,
    } = props

    // Clamp 1–3: 4th card wraps to next row automatically
    const cols = Math.min(Math.max(columns || 3, 1), 3)

    return (
        <div
            style={{
                background: sectionBg || "#eeeeec",
                padding: `${paddingV ?? 56}px ${paddingH ?? 40}px`,
                boxSizing: "border-box",
                width: "100%",
                minHeight: "100%",
            }}
        >
            {/* ── Header ── */}
            <div style={s.header}>
                <div style={s.headerLeft}>
                    {showBadge !== false && (
                        <div
                            style={{
                                ...s.badge,
                                background: badgeBg || "#f0f0ee",
                                fontFamily:
                                    badgeFont || "system-ui, sans-serif",
                                fontSize: badgeFontSize || 12,
                                color: badgeTextColor || "#111111",
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: badgeAccentColor || "#22c55e",
                                    display: "inline-block",
                                    flexShrink: 0,
                                }}
                            />
                            {badgeLabel || "SERVICES"}
                        </div>
                    )}

                    <h2
                        style={{
                            fontFamily: headingFont || "Georgia, serif",
                            fontSize: headingSize || 52,
                            fontWeight: headingWeight || "800",
                            color: headingColor || "#111111",
                            margin: 0,
                            lineHeight: 1.08,
                            letterSpacing: "-0.025em",
                        }}
                    >
                        {heading || "What We Do."}
                    </h2>
                </div>

                {showSubheading !== false && subheading && (
                    <p
                        style={{
                            fontFamily:
                                subheadingFont || "system-ui, sans-serif",
                            fontSize: subheadingSize || 14,
                            fontWeight: subheadingWeight || "400",
                            color: subheadingColor || "#666666",
                            maxWidth: 280,
                            lineHeight: 1.65,
                            margin: 0,
                            textAlign: "right",
                        }}
                    >
                        {subheading}
                    </p>
                )}
            </div>

            {/* ── Grid ──
                repeat(cols, 1fr) → max `cols` per row
                alignItems: stretch → equal card height in each row
                Extra cards auto-wrap to the next row
            ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    columnGap: columnGap ?? 20,
                    rowGap: rowGap ?? 20,
                    alignItems: "stretch",
                }}
            >
                {(services || []).map((item: any, i: number) => (
                    <ServiceCard
                        key={i}
                        item={item}
                        cardBg={cardBg}
                        cardRadius={cardRadius}
                        tagBg={tagBg}
                        tagColor={tagColor}
                        tagDotColor={tagDotColor}
                    />
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
//  STATIC STYLES
// ─────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 36,
        flexWrap: "wrap",
        gap: 20,
    },
    headerLeft: { display: "flex", flexDirection: "column", gap: 12 },
    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 500,
        letterSpacing: "0.02em",
        padding: "6px 14px 6px 10px",
        borderRadius: 999,
        width: "fit-content",
        border: "1px solid rgba(0,0,0,0.10)",
    },
    card: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    },
    cardTop: { padding: "28px 28px 22px" },
    icon: { width: 52, height: 52, objectFit: "contain" as const },
    tagsWrap: {
        display: "flex",
        flexWrap: "wrap" as const,
        gap: 7,
        marginTop: 4,
    },
    tag: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.07em",
        padding: "5px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap" as const,
    },
    tagDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
    sliderWrap: {
        position: "relative" as const,
        overflow: "hidden",
        // paddingTop creates a true 4:3 ratio box regardless of column width
        paddingTop: "75%",
        flexShrink: 0,
        cursor: "grab",
        userSelect: "none" as const,
        background: "#e8e8e6",
    },
    dotsRow: {
        position: "absolute" as const,
        bottom: 14,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 6,
        zIndex: 2,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        border: "none",
        padding: 0,
        cursor: "pointer",
        transition: "all 0.22s ease",
    },
    emptySlider: {
        paddingTop: "75%",
        position: "relative" as const,
        background: "#e8e8e6",
        flexShrink: 0,
    },
    emptyText: { fontSize: 12, color: "#999", letterSpacing: "0.05em" },
}

// ─────────────────────────────────────────────────────────────
//  PROPERTY CONTROLS
// ─────────────────────────────────────────────────────────────
addPropertyControls(ServicesSection, {
    // ── Section ──
    sectionBg: {
        type: ControlType.Color,
        title: "Section BG",
        defaultValue: "#eeeeec",
    },
    paddingH: {
        type: ControlType.Number,
        title: "Padding H",
        defaultValue: 40,
        min: 0,
        max: 160,
        unit: "px",
    },
    paddingV: {
        type: ControlType.Number,
        title: "Padding V",
        defaultValue: 56,
        min: 0,
        max: 160,
        unit: "px",
    },

    // ── Grid ──
    columns: {
        type: ControlType.Number,
        title: "Max Cols / Row",
        defaultValue: 3,
        min: 1,
        max: 3,
        step: 1,
        displayStepper: true,
    },
    columnGap: {
        type: ControlType.Number,
        title: "Col Gap",
        defaultValue: 20,
        min: 0,
        max: 80,
        unit: "px",
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 20,
        min: 0,
        max: 80,
        unit: "px",
    },

    // ── Badge ──
    showBadge: {
        type: ControlType.Boolean,
        title: "Show Badge",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    badgeLabel: {
        type: ControlType.String,
        title: "Badge Text",
        defaultValue: "SERVICES",
        hidden: (p) => p.showBadge === false,
    },
    badgeBg: {
        type: ControlType.Color,
        title: "Badge BG",
        defaultValue: "#f0f0ee",
        hidden: (p) => p.showBadge === false,
    },
    badgeTextColor: {
        type: ControlType.Color,
        title: "Badge Text Color",
        defaultValue: "#111111",
        hidden: (p) => p.showBadge === false,
    },
    badgeAccentColor: {
        type: ControlType.Color,
        title: "Badge Dot Color",
        defaultValue: "#22c55e",
        hidden: (p) => p.showBadge === false,
    },
    badgeFont: {
        type: ControlType.Enum,
        title: "Badge Font",
        options: FONT_OPTIONS,
        optionTitles: FONT_LABELS,
        defaultValue: "system-ui, sans-serif",
        hidden: (p) => p.showBadge === false,
    },
    badgeFontSize: {
        type: ControlType.Number,
        title: "Badge Size",
        defaultValue: 11,
        min: 8,
        max: 18,
        unit: "px",
        hidden: (p) => p.showBadge === false,
    },

    // ── Heading ──
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "What We Do.",
    },
    headingFont: {
        type: ControlType.Enum,
        title: "Heading Font",
        options: FONT_OPTIONS,
        optionTitles: FONT_LABELS,
        defaultValue: "Georgia, serif",
    },
    headingWeight: {
        type: ControlType.Enum,
        title: "Heading Weight",
        options: WEIGHT_OPTIONS,
        optionTitles: WEIGHT_LABELS,
        defaultValue: "800",
    },
    headingSize: {
        type: ControlType.Number,
        title: "Heading Size",
        defaultValue: 52,
        min: 20,
        max: 100,
        unit: "px",
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#111111",
    },

    // ── Subheading ──
    showSubheading: {
        type: ControlType.Boolean,
        title: "Show Subheading",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    subheading: {
        type: ControlType.String,
        title: "Subheading",
        defaultValue:
            "We combine strategy, speed, and skill to deliver exceptional design — every time.",
        displayTextArea: true,
        hidden: (p) => p.showSubheading === false,
    },
    subheadingFont: {
        type: ControlType.Enum,
        title: "Subheading Font",
        options: FONT_OPTIONS,
        optionTitles: FONT_LABELS,
        defaultValue: "system-ui, sans-serif",
        hidden: (p) => p.showSubheading === false,
    },
    subheadingWeight: {
        type: ControlType.Enum,
        title: "Subheading Weight",
        options: WEIGHT_OPTIONS,
        optionTitles: WEIGHT_LABELS,
        defaultValue: "400",
        hidden: (p) => p.showSubheading === false,
    },
    subheadingSize: {
        type: ControlType.Number,
        title: "Subheading Size",
        defaultValue: 14,
        min: 10,
        max: 28,
        unit: "px",
        hidden: (p) => p.showSubheading === false,
    },
    subheadingColor: {
        type: ControlType.Color,
        title: "Subheading Color",
        defaultValue: "#666666",
        hidden: (p) => p.showSubheading === false,
    },

    // ── Cards Global ──
    cardBg: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#ffffff",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 20,
        min: 0,
        max: 40,
        unit: "px",
    },
    tagBg: {
        type: ControlType.Color,
        title: "Tag BG",
        defaultValue: "#f2f2f2",
    },
    tagColor: {
        type: ControlType.Color,
        title: "Tag Text",
        defaultValue: "#222222",
    },
    tagDotColor: {
        type: ControlType.Color,
        title: "Tag Dot",
        defaultValue: "#e5392a",
    },

    // ── Services Array ──
    services: {
        type: ControlType.Array,
        title: "Services",
        control: {
            type: ControlType.Object,
            title: "Service",
            controls: {
                // Icon
                icon: { type: ControlType.Image, title: "Icon Image" },
                iconPosition: {
                    type: ControlType.Enum,
                    title: "Icon Align",
                    options: ["left", "right"],
                    optionTitles: ["Left ←", "Right →"],
                    defaultValue: "left",
                    displaySegmentedControl: true,
                },

                // Title
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Service Name",
                },
                titleFont: {
                    type: ControlType.Enum,
                    title: "Title Font",
                    options: FONT_OPTIONS,
                    optionTitles: FONT_LABELS,
                    defaultValue: "Georgia, serif",
                },
                titleWeight: {
                    type: ControlType.Enum,
                    title: "Title Weight",
                    options: WEIGHT_OPTIONS,
                    optionTitles: WEIGHT_LABELS,
                    defaultValue: "700",
                },
                titleSize: {
                    type: ControlType.Number,
                    title: "Title Size",
                    defaultValue: 22,
                    min: 12,
                    max: 64,
                    unit: "px",
                },
                titleColor: {
                    type: ControlType.Color,
                    title: "Title Color",
                    defaultValue: "#111111",
                },

                // Description
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Short description of the service.",
                    displayTextArea: true,
                },
                descFont: {
                    type: ControlType.Enum,
                    title: "Desc Font",
                    options: FONT_OPTIONS,
                    optionTitles: FONT_LABELS,
                    defaultValue: "system-ui, sans-serif",
                },
                descWeight: {
                    type: ControlType.Enum,
                    title: "Desc Weight",
                    options: WEIGHT_OPTIONS,
                    optionTitles: WEIGHT_LABELS,
                    defaultValue: "400",
                },
                descSize: {
                    type: ControlType.Number,
                    title: "Desc Size",
                    defaultValue: 14,
                    min: 10,
                    max: 28,
                    unit: "px",
                },
                descColor: {
                    type: ControlType.Color,
                    title: "Desc Color",
                    defaultValue: "#555555",
                },

                // Tags
                tags: {
                    type: ControlType.Array,
                    title: "Tags",
                    control: {
                        type: ControlType.String,
                        title: "Tag",
                        defaultValue: "TAG LABEL",
                    },
                },

                // Slider
                images: {
                    type: ControlType.Array,
                    title: "Slider Images",
                    control: { type: ControlType.Image, title: "Image" },
                },
            },
        },
        defaultValue: [
            {
                iconPosition: "left",
                title: "Brand Identity",
                titleFont: "Georgia, serif",
                titleWeight: "700",
                titleSize: 22,
                titleColor: "#111111",
                description:
                    "Elevate your identity: sharp positioning, cohesive visuals, real impact.",
                descFont: "system-ui, sans-serif",
                descWeight: "400",
                descSize: 14,
                descColor: "#555555",
                tags: [
                    "ART DIRECTION",
                    "BRAND STRATEGY",
                    "LOGO DESIGN",
                    "COLOR SYSTEMS",
                ],
                images: [],
            },
            {
                iconPosition: "left",
                title: "Web & Mobile Design",
                titleFont: "Georgia, serif",
                titleWeight: "700",
                titleSize: 22,
                titleColor: "#111111",
                description:
                    "Refresh or rebrand your UI; lift retention with clear flows and micro-interactions.",
                descFont: "system-ui, sans-serif",
                descWeight: "400",
                descSize: 14,
                descColor: "#555555",
                tags: [
                    "CLEAN & MODERN UI",
                    "REBRANDING",
                    "PROTOTYPING",
                    "DESIGN SYSTEM",
                ],
                images: [],
            },
            {
                iconPosition: "left",
                title: "No-Code Websites",
                titleFont: "Georgia, serif",
                titleWeight: "700",
                titleSize: 22,
                titleColor: "#111111",
                description:
                    "Launch a revenue-driving site that captures qualified leads 24/7 — shipped in 14 days or less.",
                descFont: "system-ui, sans-serif",
                descWeight: "400",
                descSize: 14,
                descColor: "#555555",
                tags: [
                    "FRAMER DEV",
                    "INTEGRATIONS",
                    "CMS INTEGRATION",
                    "ANIMATION",
                ],
                images: [],
            },
        ],
    },
})
