// NarrativeMetricsGrid.tsx
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


// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type Trend = "up" | "down" | "flat"

type Metric = {
    label: string
    title: string
    value: string
    suffix: string
    subtext: string
    trend: Trend
}

type Category = {
    label: string
    metrics: Metric[]
}

// ─────────────────────────────────────────────────────────────
// DEFAULT DATA
// ─────────────────────────────────────────────────────────────

const defaultCategories: Category[] = [
    {
        label: "Overview",
        metrics: [
            {
                label: "MRR",
                title: "Monthly Recurring Revenue",
                value: "148k",
                suffix: "$",
                subtext: "Net recurring from AI subscriptions this month",
                trend: "up",
            },
            {
                label: "CUSTOMERS",
                title: "Active AI Teams",
                value: "312",
                suffix: "",
                subtext: "Workspaces that ran workloads in the last 30 days",
                trend: "up",
            },
            {
                label: "RESPONSE TIME",
                title: "Model Latency (p95)",
                value: "420",
                suffix: "ms",
                subtext: "End-to-end API latency across all regions",
                trend: "flat",
            },
            {
                label: "RELIABILITY",
                title: "AI API Uptime",
                value: "99.97",
                suffix: "%",
                subtext: "Rolling 30-day uptime for generation & embeddings",
                trend: "up",
            },
        ],
    },
    {
        label: "Growth",
        metrics: [
            {
                label: "ACTIVATION",
                title: "Users Reaching First Value",
                value: "68",
                suffix: "%",
                subtext: "New workspaces that shipped one workflow in 7 days",
                trend: "up",
            },
            {
                label: "RETENTION",
                title: "Logo Retention",
                value: "93",
                suffix: "%",
                subtext: "AI customers still active after 12 months",
                trend: "up",
            },
            {
                label: "NPS",
                title: "Product Net Promoter Score",
                value: "71",
                suffix: "",
                subtext: "Promoters minus detractors across AI builders",
                trend: "up",
            },
        ],
    },
    {
        label: "Revenue",
        metrics: [
            {
                label: "ARR",
                title: "Annual Recurring Revenue",
                value: "1.9",
                suffix: "M",
                subtext: "Run-rate from AI seats, usage & enterprise",
                trend: "up",
            },
            {
                label: "CHURN",
                title: "Net Revenue Churn",
                value: "1.4",
                suffix: "%",
                subtext: "Downgrades and cancels minus expansion, last quarter",
                trend: "down",
            },
        ],
    },
]

// ─────────────────────────────────────────────────────────────
// COUNT-UP HOOK
// ─────────────────────────────────────────────────────────────

function useCountUp(
    value: string,
    enabled: boolean,
    duration: number,
    deps: any[]
) {
    const [display, setDisplay] = React.useState(value)

    React.useEffect(() => {
        if (!enabled) {
            setDisplay(value)
            return
        }
        const numeric = parseFloat(value.replace(/[^\d.]/g, ""))
        if (Number.isNaN(numeric)) {
            setDisplay(value)
            return
        }
        const prefix = value.match(/^[^\d]*/)?.[0] ?? ""
        const durationMs = duration * 1000
        const start = performance.now()
        let frame: number
        const loop = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs)
            const eased = 1 - Math.pow(1 - t, 3)
            const current = numeric * eased
            const decimals = value.includes(".") ? 1 : 0
            setDisplay(prefix + current.toFixed(decimals))
            if (t < 1) frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [value, enabled, duration, ...deps])

    return display
}

// ─────────────────────────────────────────────────────────────
// SPARKLINE
// ─────────────────────────────────────────────────────────────

function Sparkline({ trend, accent }: { trend: Trend; accent: string }) {
    const path =
        trend === "up"
            ? "M2 26 C 20 10, 40 24, 58 8 S 92 18, 118 4"
            : trend === "down"
              ? "M2 8 C 20 20, 40 10, 58 24 S 92 10, 118 26"
              : "M2 18 L118 18"
    const cy = trend === "up" ? 4 : trend === "down" ? 26 : 18
    return (
        <svg width="120" height="32" viewBox="0 0 120 32" fill="none">
            <path
                d={path}
                stroke={accent}
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.7"
            />
            <circle cx="118" cy={cy} r="2.5" fill={"none"} />
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────────

interface CardProps {
    metric: Metric
    index: number
    accent: string
    countUp: boolean
    countDuration: number
    textPrimary: string
    textSecondary: string
    textMuted: string
    cardValueSize: number
    cardBackground: string
    cardBorder: string
    radius: number
    bodyFont: string
    showSparkline: boolean
    showTrendDot: boolean
    cardShadow: boolean
    hoverEffect: boolean
    reducedMotion: boolean
    cardLabelSize: number
    cardTitleSize: number
    cardSubtextSize: number
}

function MetricCard(props: CardProps) {
    const {
        metric,
        index,
        accent,
        countUp,
        countDuration,
        textPrimary,
        textSecondary,
        textMuted,
        cardValueSize,
        cardBackground,
        cardBorder,
        radius,
        bodyFont,
        showSparkline,
        showTrendDot,
        cardShadow,
        hoverEffect,
        reducedMotion,
        cardLabelSize,
        cardTitleSize,
        cardSubtextSize,
    } = props

    const animValue = useCountUp(metric.value, countUp, countDuration, [
        metric.label,
    ])
    const displayValue = countUp ? animValue : metric.value

    const trendColor =
        metric.trend === "up"
            ? accent
            : metric.trend === "down"
              ? "#ff7b9f"
              : "rgba(255,255,255,0.3)"

    return (
        <motion.div
            // entrance animation for each card
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
                reducedMotion
                    ? { duration: 0 }
                    : {
                          duration: 0.4,
                          delay: index * 0.06,
                          ease: [0.16, 1, 0.3, 1],
                      }
            }
            // modern hover pop effect
            whileHover={
                hoverEffect && !reducedMotion
                    ? {
                          y: -6,
                          scale: 1.03,
                          boxShadow:
                              "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
                          transition: {
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                          },
                      }
                    : {}
            }
            style={{
                aspectRatio: "1 / 1",
                borderRadius: radius,
                padding: 20,
                overflow: "hidden",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: cardBackground,
                border: `1px solid ${cardBorder}`,
                boxShadow: cardShadow ? "0 20px 50px rgba(0,0,0,0.45)" : "none",
                cursor: "default",
                minWidth: 0,
            }}
        >
            {/* very subtle glow only, no heavy fill */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at top left, rgba(255,255,255,0.04), transparent 60%)",
                    pointerEvents: "none",
                }}
            />

            {/* CONTENT LAYER */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                }}
            >
                {/* TOP ROW */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10,
                    }}
                >
                    <div>
                        <div
                            style={{
                                color: textPrimary,
                                fontSize: cardLabelSize,
                                letterSpacing: "0.08em",
                                fontWeight: 600,
                                fontFamily: bodyFont,
                                textTransform: "uppercase",
                                opacity: 0.75,
                            }}
                        >
                            {metric.label || "LABEL"}
                        </div>
                        <div
                            style={{
                                marginTop: 5,
                                color: textSecondary,
                                fontSize: cardTitleSize,
                                lineHeight: 1.4,
                                fontFamily: bodyFont,
                            }}
                        >
                            {metric.title || "Title"}
                        </div>
                    </div>

                    {showTrendDot && (
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: trendColor,
                                boxShadow: `0 0 14px ${trendColor}`,
                                marginTop: 4,
                            }}
                        />
                    )}
                </div>

                {/* VALUE + SUBTEXT */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 5,
                            flexWrap: "wrap",
                        }}
                    >
                        <span
                            style={{
                                fontSize: cardValueSize,
                                lineHeight: 0.9,
                                letterSpacing: "-0.07em",
                                color: textPrimary,
                                fontWeight: 700,
                                fontFamily: bodyFont,
                            }}
                        >
                            {displayValue || "0"}
                        </span>
                        {metric.suffix ? (
                            <span
                                style={{
                                    color: textSecondary,
                                    fontSize: Math.round(cardValueSize * 0.28),
                                    marginBottom: Math.round(
                                        cardValueSize * 0.08
                                    ),
                                    fontFamily: bodyFont,
                                }}
                            >
                                {metric.suffix}
                            </span>
                        ) : null}
                    </div>
                    <div
                        style={{
                            color: textMuted,
                            fontSize: cardSubtextSize,
                            lineHeight: 1.6,
                            maxWidth: 220,
                            fontFamily: bodyFont,
                        }}
                    >
                        {metric.subtext || "—"}
                    </div>
                </div>

                {/* SPARKLINE */}
                {showSparkline && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 12,
                        }}
                    >
                        <Sparkline
                            trend={metric.trend ?? "flat"}
                            accent={accent}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

interface Props {
    // Content
    categories: Category[]

    // Header
    showHeading: boolean
    heading: string
    showDescription: boolean
    description: string
    align: "left" | "center"

    // Vertical spacing between sections
    headingDescriptionGap: number
    descriptionTabsGap: number
    tabsGridGap: number

    // Tabs
    showTabs: boolean
    autoplay: boolean
    autoplayInterval: number

    // Cards
    showSparkline: boolean
    showTrendDot: boolean
    countUp: boolean
    countDuration: number
    hoverEffect: boolean
    cardShadow: boolean
    cardBlur: number

    // Layout
    gap: number
    padding: number

    // Style
    background: string
    transparentBg: boolean
    accent: string
    radius: number

    cardBackground: string
    cardBorder: string

    // Typography
    headingFont: string
    bodyFont: string
    headingSize: number
    cardValueSize: number
    descriptionSize: number
    tabLabelSize: number
    cardLabelSize: number
    cardTitleSize: number
    cardSubtextSize: number

    // Colors
    headingColor: string
    textPrimary: string
    textSecondary: string
    textMuted: string

    // Accessibility
    reducedMotion: boolean
}

export function NarrativeMetricsGrid(props: Props) {
    const {
        categories,
        showHeading,
        heading,
        showDescription,
        description,
        align,
        headingDescriptionGap,
        descriptionTabsGap,
        tabsGridGap,
        showTabs,
        autoplay,
        autoplayInterval,
        showSparkline,
        showTrendDot,
        countUp,
        countDuration,
        hoverEffect,
        cardShadow,
        cardBlur,
        gap,
        padding,
        background,
        transparentBg,
        accent,
        radius,
        cardBackground,
        cardBorder,
        headingFont,
        bodyFont,
        headingSize,
        cardValueSize,
        descriptionSize,
        tabLabelSize,
        cardLabelSize,
        cardTitleSize,
        cardSubtextSize,
        headingColor,
        textPrimary,
        textSecondary,
        textMuted,
        reducedMotion,
    } = props

    const safeCategories =
        Array.isArray(categories) && categories.length > 0
            ? categories
            : defaultCategories

    const [activeIndex, setActiveIndex] = React.useState(0)

    const clampedIndex = Math.min(activeIndex, safeCategories.length - 1)

    React.useEffect(() => {
        if (!autoplay || safeCategories.length < 2) return
        const id = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % safeCategories.length)
        }, autoplayInterval * 1000)
        return () => clearInterval(id)
    }, [autoplay, autoplayInterval, safeCategories.length])

    const activeCategory = safeCategories[clampedIndex]
    const metrics = Array.isArray(activeCategory?.metrics)
        ? activeCategory.metrics
        : []

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: transparentBg ? "transparent" : background,
                padding,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap,
                fontFamily: bodyFont,
                overflow: "visible",
            }}
        >
            {/* HEADER */}
            {(showHeading || showDescription) && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: headingDescriptionGap,
                        alignItems:
                            align === "center" ? "center" : "flex-start",
                        textAlign: align,
                    }}
                >
                    {showHeading && (
                        <h2
                            style={{
                                margin: 0,
                                color: headingColor,
                                fontSize: headingSize,
                                lineHeight: 0.92,
                                letterSpacing: "-0.06em",
                                fontWeight: 700,
                                fontFamily: headingFont,
                            }}
                        >
                            {heading}
                        </h2>
                    )}
                    {showDescription && (
                        <p
                            style={{
                                margin: 0,
                                color: textMuted,
                                fontSize: descriptionSize,
                                lineHeight: 1.7,
                                maxWidth: 520,
                                fontFamily: bodyFont,
                            }}
                        >
                            {description}
                        </p>
                    )}
                </div>
            )}

            {/* TABS */}
            {showTabs && safeCategories.length > 1 && (
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginTop: showDescription ? descriptionTabsGap : 0,
                    }}
                >
                    {safeCategories.map((cat, idx) => {
                        const active = idx === clampedIndex
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                style={{
                                    border: active
                                        ? `1px solid ${accent}40`
                                        : "1px solid rgba(255,255,255,0.08)",
                                    background: active
                                        ? `${accent}18`
                                        : "rgba(255,255,255,0.03)",
                                    color: active ? textPrimary : textMuted,
                                    padding: "8px 16px",
                                    borderRadius: 999,
                                    fontSize: tabLabelSize,
                                    fontWeight: active ? 600 : 400,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    fontFamily: bodyFont,
                                    backdropFilter: `blur(${cardBlur}px)`,
                                    WebkitBackdropFilter: `blur(${cardBlur}px)`,
                                    outline: "none",
                                    letterSpacing: "0.01em",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {cat.label || `Category ${idx + 1}`}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* GRID – animates on tab change */}
            <motion.div
                key={clampedIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                    reducedMotion
                        ? { duration: 0 }
                        : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap,
                    width: "100%",
                    flex: 1,
                    alignContent: "start",
                    marginTop:
                        showTabs && safeCategories.length > 1 ? tabsGridGap : 0,
                }}
            >
                {metrics.length > 0 ? (
                    metrics.map((metric, idx) => (
                        <MetricCard
                            key={`${clampedIndex}-${idx}`}
                            metric={metric}
                            index={idx}
                            accent={accent}
                            countUp={countUp}
                            countDuration={countDuration}
                            textPrimary={textPrimary}
                            textSecondary={textSecondary}
                            textMuted={textMuted}
                            cardValueSize={cardValueSize}
                            cardBackground={cardBackground}
                            cardBorder={cardBorder}
                            radius={radius}
                            bodyFont={bodyFont}
                            showSparkline={showSparkline}
                            showTrendDot={showTrendDot}
                            cardShadow={cardShadow}
                            hoverEffect={hoverEffect}
                            reducedMotion={reducedMotion}
                            cardLabelSize={cardLabelSize}
                            cardTitleSize={cardTitleSize}
                            cardSubtextSize={cardSubtextSize}
                        />
                    ))
                ) : (
                    <div
                        style={{
                            aspectRatio: "1 / 1",
                            borderRadius: radius,
                            border: `1px dashed ${cardBorder}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: textMuted,
                            fontSize: 13,
                            fontFamily: bodyFont,
                            opacity: 0.5,
                        }}
                    >
                        Add a metric card →
                    </div>
                )}
            </motion.div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────

NarrativeMetricsGrid.defaultProps = {
    categories: defaultCategories,

    showHeading: true,
    heading: "AI Growth Control Center",
    showDescription: true,
    description:
        "Track how your AI product is compounding across revenue, retention, and activation in a single live view.",
    align: "left",

    headingDescriptionGap: 10,
    descriptionTabsGap: 16,
    tabsGridGap: 16,

    showTabs: true,
    autoplay: false,
    autoplayInterval: 6,

    showSparkline: true,
    showTrendDot: true,
    countUp: true,
    countDuration: 1.2,
    hoverEffect: true,
    cardShadow: true,
    cardBlur: 20,

    gap: 16,
    padding: 0,

    background: "#050505",
    transparentBg: true,
    accent: "#7c6aff",
    radius: 28,

    cardBackground:
        "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
    cardBorder: "rgba(255,255,255,0.08)",

    headingFont: "Inter",
    bodyFont: "Inter",
    headingSize: 52,
    cardValueSize: 60,
    descriptionSize: 14,
    tabLabelSize: 12,
    cardLabelSize: 11,
    cardTitleSize: 13,
    cardSubtextSize: 13,

    headingColor: "#ffffff",
    textPrimary: "#ffffff",
    textSecondary: "rgba(255,255,255,0.6)",
    textMuted: "rgba(255,255,255,0.38)",

    reducedMotion: false,
}

// ─────────────────────────────────────────────────────────────
// PROPERTY CONTROLS
// ─────────────────────────────────────────────────────────────

addPropertyControls(NarrativeMetricsGrid, {
    // CONTENT
    categories: {
        type: ControlType.Array,
        title: "Categories",
        description: "Tabs & cards",
        control: {
            type: ControlType.Object,
            title: "Category",
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Tab Label",
                    description: "Tab name",
                    placeholder: "Overview",
                    defaultValue: "Category",
                },
                metrics: {
                    type: ControlType.Array,
                    title: "Metric Cards",
                    description: "Cards in this tab",
                    control: {
                        type: ControlType.Object,
                        title: "Card",
                        controls: {
                            label: {
                                type: ControlType.String,
                                title: "Eyebrow",
                                description: "Small label",
                                placeholder: "REVENUE",
                                defaultValue: "METRIC",
                            },
                            title: {
                                type: ControlType.String,
                                title: "Title",
                                description: "Card title",
                                placeholder: "Annual Growth",
                                defaultValue: "Metric Name",
                            },
                            value: {
                                type: ControlType.String,
                                title: "Value",
                                description: "Main number",
                                placeholder: "87",
                                defaultValue: "0",
                            },
                            suffix: {
                                type: ControlType.String,
                                title: "Suffix",
                                description: "Unit (%, $, k)",
                                placeholder: "%",
                                defaultValue: "",
                            },
                            subtext: {
                                type: ControlType.String,
                                title: "Sub-text",
                                description: "Small caption",
                                placeholder: "Compared to last year",
                                defaultValue: "Subtitle here",
                            },
                            trend: {
                                type: ControlType.Enum,
                                title: "Trend",
                                description: "Up / down / flat",
                                options: ["up", "down", "flat"],
                                optionTitles: ["↑ Up", "↓ Down", "→ Flat"],
                                defaultValue: "up",
                            },
                        },
                    },
                    defaultValue: [
                        {
                            label: "METRIC",
                            title: "Metric Name",
                            value: "0",
                            suffix: "",
                            subtext: "Subtitle here",
                            trend: "up",
                        },
                    ],
                },
            },
        },
        defaultValue: defaultCategories,
    },

    // HEADER
    showHeading: {
        type: ControlType.Boolean,
        title: "Show Heading",
        description: "Toggle heading",
        defaultValue: true,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        description: "Main title",
        placeholder: "AI Growth Control Center",
        defaultValue: "AI Growth Control Center",
        hidden: (props) => !props.showHeading,
    },
    showDescription: {
        type: ControlType.Boolean,
        title: "Show Description",
        description: "Toggle description",
        defaultValue: true,
    },
    description: {
        type: ControlType.String,
        title: "Description",
        description: "Short paragraph",
        displayTextArea: true,
        placeholder: "A short line about these metrics",
        defaultValue:
            "Track how your AI product is compounding across revenue, retention, and activation in a single live view.",
        hidden: (props) => !props.showDescription,
    },
    align: {
        type: ControlType.Enum,
        title: "Alignment",
        description: "Text alignment",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "left",
        hidden: (props) => !props.showHeading && !props.showDescription,
    },

    // HEADER SPACING
    headingDescriptionGap: {
        type: ControlType.Number,
        title: "Heading ↔ Desc",
        description: "Space between heading and description",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 10,
    },
    descriptionTabsGap: {
        type: ControlType.Number,
        title: "Desc ↔ Tabs",
        description: "Space between description and category tabs",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 16,
    },
    tabsGridGap: {
        type: ControlType.Number,
        title: "Tabs ↔ Grid",
        description: "Space between tabs and metric cards",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 16,
    },

    // TABS
    showTabs: {
        type: ControlType.Boolean,
        title: "Show Tabs",
        description: "Show tab bar",
        defaultValue: true,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Auto-rotate Tabs",
        description: "Cycle tabs",
        defaultValue: false,
        hidden: (props) => !props.showTabs,
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Rotation Speed",
        description: "Seconds",
        min: 2,
        max: 20,
        step: 0.5,
        unit: "s",
        defaultValue: 6,
        hidden: (props) => !props.autoplay || !props.showTabs,
    },

    // CARD CONTENT / MOTION
    showSparkline: {
        type: ControlType.Boolean,
        title: "Show Sparkline",
        description: "Trend line",
        defaultValue: true,
    },
    showTrendDot: {
        type: ControlType.Boolean,
        title: "Show Trend Dot",
        description: "Status dot",
        defaultValue: true,
    },
    countUp: {
        type: ControlType.Boolean,
        title: "Count-Up Animation",
        description: "Animate numbers",
        defaultValue: true,
    },
    countDuration: {
        type: ControlType.Number,
        title: "Count Duration",
        description: "Seconds",
        min: 0.2,
        max: 4,
        step: 0.1,
        unit: "s",
        defaultValue: 1.2,
        hidden: (props) => !props.countUp,
    },
    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Lift Effect",
        description: "Lift on hover",
        defaultValue: true,
    },
    reducedMotion: {
        type: ControlType.Boolean,
        title: "Reduce Motion",
        description: "Disable animation",
        defaultValue: false,
    },

    // LAYOUT
    gap: {
        type: ControlType.Number,
        title: "Grid Gap",
        description: "Spacing between cards",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 16,
    },
    padding: {
        type: ControlType.Number,
        title: "Outer Padding",
        description: "Padding around the component",
        min: 0,
        max: 80,
        unit: "px",
        defaultValue: 0,
    },

    // CARD STYLE
    radius: {
        type: ControlType.Number,
        title: "Card Radius",
        description: "Corners",
        min: 0,
        max: 60,
        unit: "px",
        defaultValue: 28,
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Card Shadow",
        description: "Drop shadow",
        defaultValue: true,
    },
    cardBlur: {
        type: ControlType.Number,
        title: "Card Blur (Glass)",
        description: "Backdrop blur",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 20,
    },

    // COLORS
    transparentBg: {
        type: ControlType.Boolean,
        title: "Transparent Background",
        description: "No background",
        defaultValue: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background Color",
        description: "Component bg",
        defaultValue: "#050505",
        hidden: (props) => props.transparentBg,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent Color",
        description: "Dots & lines",
        defaultValue: "#7c6aff",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        description: "Card fill",
        defaultValue: "rgba(255,255,255,0.05)",
    },
    cardBorder: {
        type: ControlType.Color,
        title: "Card Border",
        description: "Card outline",
        defaultValue: "rgba(255,255,255,0.08)",
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        description: "Heading text",
        defaultValue: "#ffffff",
    },
    textPrimary: {
        type: ControlType.Color,
        title: "Primary Text",
        description: "Main values",
        defaultValue: "#ffffff",
    },
    textSecondary: {
        type: ControlType.Color,
        title: "Secondary Text",
        description: "Titles & units",
        defaultValue: "rgba(255,255,255,0.6)",
    },
    textMuted: {
        type: ControlType.Color,
        title: "Muted Text",
        description: "Subtext",
        defaultValue: "rgba(255,255,255,0.38)",
    },

    // TYPOGRAPHY
    headingFont: {
        type: ControlType.String,
        title: "Heading Font",
        description: "Heading family",
        placeholder: "Inter",
        defaultValue: "Inter",
        hidden: (props) => !props.showHeading,
    },
    bodyFont: {
        type: ControlType.String,
        title: "Body Font",
        description: "Body family",
        placeholder: "Inter",
        defaultValue: "Inter",
    },
    headingSize: {
        type: ControlType.Number,
        title: "Heading Size",
        description: "Heading px",
        min: 24,
        max: 120,
        unit: "px",
        defaultValue: 52,
        hidden: (props) => !props.showHeading,
    },
    descriptionSize: {
        type: ControlType.Number,
        title: "Description Size",
        description: "Description px",
        min: 10,
        max: 24,
        unit: "px",
        defaultValue: 14,
        hidden: (props) => !props.showDescription,
    },
    tabLabelSize: {
        type: ControlType.Number,
        title: "Tab Label Size",
        description: "Tab text px",
        min: 10,
        max: 20,
        unit: "px",
        defaultValue: 12,
        hidden: (props) => !props.showTabs,
    },
    cardValueSize: {
        type: ControlType.Number,
        title: "Card Value Size",
        description: "Big number px",
        min: 24,
        max: 100,
        unit: "px",
        defaultValue: 60,
    },
    cardLabelSize: {
        type: ControlType.Number,
        title: "Card Label Size",
        description: "Top eyebrow px",
        min: 8,
        max: 18,
        unit: "px",
        defaultValue: 11,
    },
    cardTitleSize: {
        type: ControlType.Number,
        title: "Card Title Size",
        description: "Metric title px",
        min: 10,
        max: 22,
        unit: "px",
        defaultValue: 13,
    },
    cardSubtextSize: {
        type: ControlType.Number,
        title: "Card Subtext Size",
        description: "Small caption px",
        min: 10,
        max: 20,
        unit: "px",
        defaultValue: 13,
    },
})
