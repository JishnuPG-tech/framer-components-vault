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


type ModelKey = "fast" | "balanced" | "advanced"
type ThemeMode = "light" | "dark"
type IndicatorStyle = "bar" | "dot"
type CTAStyle = "filled" | "glass" | "text"

type ModelData = {
    id: ModelKey
    name: string
    description: string
    speed: number
    quality: number
    cost: number
    bestFor: string
    recommended: boolean
}

type AIModelComparisonFreeProps = {
    style?: React.CSSProperties
    eyebrow?: string
    heading?: string

    model1Name?: string
    model1Description?: string
    model1Speed?: number
    model1Quality?: number
    model1Cost?: number
    model1BestFor?: string

    model2Name?: string
    model2Description?: string
    model2Speed?: number
    model2Quality?: number
    model2Cost?: number
    model2BestFor?: string

    model3Name?: string
    model3Description?: string
    model3Speed?: number
    model3Quality?: number
    model3Cost?: number
    model3BestFor?: string

    defaultSelectedModel?: ModelKey
    ctaText?: string
    brandNote?: string
}

const DEFAULTS = {
    eyebrow: "AI MODEL ROUTING",
    heading: "Compare models at a glance",

    model1Name: "Fast",
    model1Description: "Optimized for quick responses and lightweight tasks.",
    model1Speed: 92,
    model1Quality: 72,
    model1Cost: 28,
    model1BestFor: "Quick drafts, Simple tasks, Real-time workflows",

    model2Name: "Balanced",
    model2Description:
        "The best blend of latency, reasoning depth, and predictable cost.",
    model2Speed: 78,
    model2Quality: 86,
    model2Cost: 52,
    model2BestFor: "Production chat, AI copilots, Content workflows",

    model3Name: "Advanced",
    model3Description:
        "Built for complex reasoning, research, and high-quality outputs.",
    model3Speed: 58,
    model3Quality: 96,
    model3Cost: 82,
    model3BestFor: "Research, Analysis, Enterprise workflows",

    defaultSelectedModel: "balanced" as ModelKey,
    panelSplit: 62,
    showDetailPanel: true,
    ctaText: "Upgrade to Pro",
    ctaLink: "#",
    ctaOpenNewTab: false,
    ctaStyle: "filled" as CTAStyle,
    theme: "light" as ThemeMode,
    indicatorStyle: "bar" as IndicatorStyle,
    accentColor: "#AAB6FF",
    backgroundColor: "#0A101B",
    backgroundOpacity: 0.42,
    glassBlur: 4,
    borderColor: "#DDE6FF",
    textColor: "#F7F9FC",
    mutedTextColor: "#A7B1C2",
    radius: 24,
    padding: 24,
    gap: 14,
    shadow: true,
    recommendedBadge: true,
    barHeight: 5,
    brandNote: "Agapea",
}

// Replace this fixed URL with the Pro product page before distributing the Free Trial.
const UPGRADE_URL = "#"

function clamp(
    value: number,
    minimum: number,
    maximum: number,
    fallback: number
) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(maximum, Math.max(minimum, parsed))
}

function normalizeModelKey(value?: string): ModelKey {
    if (value === "fast" || value === "advanced") return value
    return "balanced"
}

function colorWithAlpha(color: string, alpha: number) {
    const safeAlpha = clamp(alpha, 0, 1, 1)
    const value = String(color || "").trim()
    const hex = value.replace("#", "")

    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
        const r = parseInt(hex[0] + hex[0], 16)
        const g = parseInt(hex[1] + hex[1], 16)
        const b = parseInt(hex[2] + hex[2], 16)
        return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
    }

    if (/^[0-9a-fA-F]{6}$/.test(hex) || /^[0-9a-fA-F]{8}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
    }

    const rgb = value.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)/i
    )
    if (rgb) {
        return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${safeAlpha})`
    }

    return value || `rgba(10, 16, 27, ${safeAlpha})`
}

function readableTextOn(color: string) {
    const hex = String(color || "")
        .replace("#", "")
        .slice(0, 6)
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#FFFFFF"
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const luminance = (r * 299 + g * 587 + b * 114) / 1000
    return luminance > 166 ? "#111520" : "#FFFFFF"
}

function splitBestFor(value: string) {
    const items = String(value || "")
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean)
    return items.length > 0 ? items.slice(0, 4) : ["General AI workflows"]
}

function MetricIndicator({
    label,
    value,
    accentColor,
    trackColor,
    textColor,
    mutedTextColor,
    indicatorStyle,
    barHeight,
    showLabel = false,
}: {
    label: string
    value: number
    accentColor: string
    trackColor: string
    textColor: string
    mutedTextColor: string
    indicatorStyle: IndicatorStyle
    barHeight: number
    showLabel?: boolean
}) {
    const safeValue = clamp(value, 0, 100, 0)
    const filledDots = Math.round(safeValue / 10)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 0,
                width: "100%",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                }}
            >
                {showLabel && (
                    <span
                        style={{
                            color: mutedTextColor,
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {label}
                    </span>
                )}
                <span
                    style={{
                        marginLeft: showLabel ? 0 : "auto",
                        color: textColor,
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {Math.round(safeValue)}
                </span>
            </div>

            {indicatorStyle === "dot" ? (
                <div
                    aria-label={`${label}: ${Math.round(safeValue)} out of 100`}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(10, minmax(3px, 1fr))",
                        gap: 3,
                        width: "100%",
                    }}
                >
                    {Array.from({ length: 10 }, (_, index) => (
                        <span
                            key={index}
                            style={{
                                display: "block",
                                height: Math.max(4, barHeight),
                                borderRadius: 999,
                                background:
                                    index < filledDots
                                        ? accentColor
                                        : trackColor,
                                boxShadow:
                                    index < filledDots
                                        ? `inset 0 1px 0 ${colorWithAlpha("#FFFFFF", 0.24)}`
                                        : "none",
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div
                    aria-label={`${label}: ${Math.round(safeValue)} out of 100`}
                    style={{
                        width: "100%",
                        height: barHeight,
                        minHeight: 3,
                        overflow: "hidden",
                        borderRadius: 999,
                        background: trackColor,
                        boxShadow: `inset 0 1px 1px ${colorWithAlpha("#000000", 0.12)}`,
                    }}
                >
                    <div
                        style={{
                            width: `${safeValue}%`,
                            height: "100%",
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${colorWithAlpha(accentColor, 0.7)}, ${accentColor})`,
                            boxShadow: `inset 0 1px 0 ${colorWithAlpha("#FFFFFF", 0.3)}`,
                            transition: "width 220ms ease",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 680
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
//@framerDisableUnlink
export default function AIModelComparisonFree(
    props: AIModelComparisonFreeProps
) {
    const {
        style,
        eyebrow = DEFAULTS.eyebrow,
        heading = DEFAULTS.heading,

        model1Name = DEFAULTS.model1Name,
        model1Description = DEFAULTS.model1Description,
        model1Speed = DEFAULTS.model1Speed,
        model1Quality = DEFAULTS.model1Quality,
        model1Cost = DEFAULTS.model1Cost,
        model1BestFor = DEFAULTS.model1BestFor,

        model2Name = DEFAULTS.model2Name,
        model2Description = DEFAULTS.model2Description,
        model2Speed = DEFAULTS.model2Speed,
        model2Quality = DEFAULTS.model2Quality,
        model2Cost = DEFAULTS.model2Cost,
        model2BestFor = DEFAULTS.model2BestFor,

        model3Name = DEFAULTS.model3Name,
        model3Description = DEFAULTS.model3Description,
        model3Speed = DEFAULTS.model3Speed,
        model3Quality = DEFAULTS.model3Quality,
        model3Cost = DEFAULTS.model3Cost,
        model3BestFor = DEFAULTS.model3BestFor,

        defaultSelectedModel = DEFAULTS.defaultSelectedModel,
        ctaText = DEFAULTS.ctaText,
        brandNote = DEFAULTS.brandNote,
    } = props

    // Free Trial presentation settings are intentionally fixed.
    const panelSplit = DEFAULTS.panelSplit
    const showDetailPanel = true
    const ctaLink = UPGRADE_URL
    const ctaOpenNewTab = false
    const ctaStyle: CTAStyle = DEFAULTS.ctaStyle
    const theme: ThemeMode = "light"
    const indicatorStyle: IndicatorStyle = DEFAULTS.indicatorStyle
    const accentColor = DEFAULTS.accentColor
    const backgroundColor = DEFAULTS.backgroundColor
    const backgroundOpacity = DEFAULTS.backgroundOpacity
    const glassBlur = DEFAULTS.glassBlur
    const borderColor = DEFAULTS.borderColor
    const textColor = DEFAULTS.textColor
    const mutedTextColor = DEFAULTS.mutedTextColor
    const radius = DEFAULTS.radius
    const padding = DEFAULTS.padding
    const gap = DEFAULTS.gap
    const shadow = true
    const recommendedBadge = true
    const barHeight = DEFAULTS.barHeight

    const safeTheme: ThemeMode = theme === "light" ? "light" : "dark"
    const safeDefaultModel = normalizeModelKey(defaultSelectedModel)
    const safeIndicatorStyle: IndicatorStyle =
        indicatorStyle === "dot" ? "dot" : "bar"
    const safeCTAStyle: CTAStyle =
        ctaStyle === "glass" || ctaStyle === "text" ? ctaStyle : "filled"
    const safeRadius = clamp(radius, 0, 56, DEFAULTS.radius)
    const safePadding = clamp(padding, 12, 56, DEFAULTS.padding)
    const safeGap = clamp(gap, 6, 32, DEFAULTS.gap)
    const safeBlur = clamp(glassBlur, 0, 24, DEFAULTS.glassBlur)
    const safeOpacity = clamp(
        backgroundOpacity,
        0.12,
        0.92,
        DEFAULTS.backgroundOpacity
    )
    const safeBarHeight = clamp(barHeight, 3, 12, DEFAULTS.barHeight)
    const safePanelSplit = clamp(panelSplit, 42, 74, DEFAULTS.panelSplit)

    const usingDefaultBackground = backgroundColor === DEFAULTS.backgroundColor
    const usingDefaultBorder = borderColor === DEFAULTS.borderColor
    const usingDefaultText = textColor === DEFAULTS.textColor
    const usingDefaultMuted = mutedTextColor === DEFAULTS.mutedTextColor

    const resolvedBackground =
        safeTheme === "light" && usingDefaultBackground
            ? "#EDF3FA"
            : backgroundColor
    const resolvedBorder =
        safeTheme === "light" && usingDefaultBorder ? "#8A99AE" : borderColor
    const resolvedText =
        safeTheme === "light" && usingDefaultText ? "#121722" : textColor
    const resolvedMuted =
        safeTheme === "light" && usingDefaultMuted ? "#667085" : mutedTextColor
    const resolvedOpacity =
        safeTheme === "light" ? Math.min(0.94, safeOpacity + 0.22) : safeOpacity

    const [selectedId, setSelectedId] =
        React.useState<ModelKey>(safeDefaultModel)

    React.useEffect(() => {
        setSelectedId(safeDefaultModel)
    }, [safeDefaultModel])

    const models: ModelData[] = [
        {
            id: "fast",
            name: model1Name || DEFAULTS.model1Name,
            description: model1Description || DEFAULTS.model1Description,
            speed: clamp(model1Speed, 0, 100, DEFAULTS.model1Speed),
            quality: clamp(model1Quality, 0, 100, DEFAULTS.model1Quality),
            cost: clamp(model1Cost, 0, 100, DEFAULTS.model1Cost),
            bestFor: model1BestFor || DEFAULTS.model1BestFor,
            recommended: false,
        },
        {
            id: "balanced",
            name: model2Name || DEFAULTS.model2Name,
            description: model2Description || DEFAULTS.model2Description,
            speed: clamp(model2Speed, 0, 100, DEFAULTS.model2Speed),
            quality: clamp(model2Quality, 0, 100, DEFAULTS.model2Quality),
            cost: clamp(model2Cost, 0, 100, DEFAULTS.model2Cost),
            bestFor: model2BestFor || DEFAULTS.model2BestFor,
            recommended: true,
        },
        {
            id: "advanced",
            name: model3Name || DEFAULTS.model3Name,
            description: model3Description || DEFAULTS.model3Description,
            speed: clamp(model3Speed, 0, 100, DEFAULTS.model3Speed),
            quality: clamp(model3Quality, 0, 100, DEFAULTS.model3Quality),
            cost: clamp(model3Cost, 0, 100, DEFAULTS.model3Cost),
            bestFor: model3BestFor || DEFAULTS.model3BestFor,
            recommended: false,
        },
    ]

    const selectedModel =
        models.find((model) => model.id === selectedId) || models[1]
    const selectedIndex = Math.max(
        0,
        models.findIndex((model) => model.id === selectedModel.id)
    )

    const outerSurface = colorWithAlpha(resolvedBackground, resolvedOpacity)
    const panelSurface = colorWithAlpha(
        "#FFFFFF",
        safeTheme === "dark" ? 0.035 : 0.48
    )
    const softSurface = colorWithAlpha(
        "#FFFFFF",
        safeTheme === "dark" ? 0.045 : 0.62
    )
    const selectedSurface = colorWithAlpha(
        accentColor,
        safeTheme === "dark" ? 0.12 : 0.1
    )
    const outerBorder = colorWithAlpha(
        resolvedBorder,
        safeTheme === "dark" ? 0.22 : 0.56
    )
    const innerBorder = colorWithAlpha(
        resolvedBorder,
        safeTheme === "dark" ? 0.15 : 0.4
    )
    const accentBorder = colorWithAlpha(accentColor, 0.48)
    const trackColor = colorWithAlpha(
        resolvedText,
        safeTheme === "dark" ? 0.11 : 0.1
    )
    const fontFamily =
        'Poppins, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

    const selectWithKeyboard = (
        event: React.KeyboardEvent<HTMLDivElement>,
        id: ModelKey
    ) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setSelectedId(id)
        }
    }

    const ctaBackground =
        safeCTAStyle === "filled"
            ? `linear-gradient(180deg, ${colorWithAlpha("#FFFFFF", 0.26)}, transparent), ${accentColor}`
            : safeCTAStyle === "glass"
              ? colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.08 : 0.64)
              : "transparent"
    const ctaColor =
        safeCTAStyle === "filled" ? readableTextOn(accentColor) : resolvedText
    const ctaBorder =
        safeCTAStyle === "text"
            ? "transparent"
            : safeCTAStyle === "filled"
              ? colorWithAlpha("#FFFFFF", 0.34)
              : innerBorder

    const rootShadow = shadow
        ? safeTheme === "dark"
            ? `0 26px 70px ${colorWithAlpha("#000000", 0.28)}, inset 0 1px 0 ${colorWithAlpha("#FFFFFF", 0.12)}`
            : `0 24px 60px ${colorWithAlpha("#526174", 0.14)}, inset 0 1px 0 ${colorWithAlpha("#FFFFFF", 0.88)}`
        : `inset 0 1px 0 ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.1 : 0.84)}`

    const panelShadow = shadow
        ? `0 14px 32px ${colorWithAlpha("#000000", safeTheme === "dark" ? 0.13 : 0.06)}, inset 0 1px 0 ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.075 : 0.8)}`
        : `inset 0 1px 0 ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.07 : 0.74)}`

    return (
        <div
            className="agapea-model-comparison-free"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                boxSizing: "border-box",
                containerType: "inline-size",
                borderRadius: safeRadius,
                border: `1px solid ${outerBorder}`,
                background: `linear-gradient(135deg, ${colorWithAlpha(accentColor, 0.05)}, transparent 38%), ${outerSurface}`,
                boxShadow: rootShadow,
                backdropFilter: `blur(${safeBlur}px) saturate(118%)`,
                WebkitBackdropFilter: `blur(${safeBlur}px) saturate(118%)`,
                color: resolvedText,
                fontFamily,
                padding: safePadding,
                ...style,
            }}
        >
            <style>{`
                .agapea-model-comparison-free,
                .agapea-model-comparison-free * {
                    box-sizing: border-box;
                }

                .agapea-model-comparison-free button,
                .agapea-model-comparison-free a {
                    font: inherit;
                }

                .agapea-model-comparison-free .amc-interactive {
                    transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
                }

                .agapea-model-comparison-free .amc-interactive:hover {
                    transform: translateY(-1px);
                }

                .agapea-model-comparison-free .amc-interactive:focus-visible {
                    outline: 2px solid ${colorWithAlpha(accentColor, 0.74)};
                    outline-offset: 2px;
                }

                @container (max-width: 720px) {
                    .agapea-model-comparison-free {
                        overflow: auto !important;
                    }

                    .agapea-model-comparison-free .amc-header {
                        align-items: stretch !important;
                        flex-direction: column !important;
                    }

                    .agapea-model-comparison-free .amc-heading-wrap {
                        max-width: none !important;
                    }

                    .agapea-model-comparison-free .amc-tabs {
                        width: 100% !important;
                    }

                    .agapea-model-comparison-free .amc-desktop-table {
                        display: none !important;
                    }

                    .agapea-model-comparison-free .amc-mobile-cards {
                        display: grid !important;
                    }

                    .agapea-model-comparison-free .amc-detail-panel {
                        min-height: 0 !important;
                    }
                }

                @container (max-width: 620px) {
                    .agapea-model-comparison-free .amc-split-shell {
                        grid-template-columns: minmax(0, 1fr) !important;
                        height: auto !important;
                        row-gap: 12px !important;
                    }


                    .agapea-model-comparison-free .amc-detail-panel {
                        min-height: 280px !important;
                    }
                }

                @container (max-width: 390px) {
                    .agapea-model-comparison-free .amc-detail-metrics,
                    .agapea-model-comparison-free .amc-mobile-metrics {
                        grid-template-columns: minmax(0, 1fr) !important;
                    }

                    .agapea-model-comparison-free .amc-tab {
                        padding-left: 7px !important;
                        padding-right: 7px !important;
                        font-size: 10px !important;
                    }
                }
            `}</style>

            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 1,
                    pointerEvents: "none",
                    borderRadius: Math.max(0, safeRadius - 1),
                    borderTop: `1px solid ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.15 : 0.84)}`,
                    background: `linear-gradient(112deg, ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.035 : 0.22)}, transparent 28%)`,
                }}
            />

            <div
                className="amc-header"
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: Math.max(16, safeGap + 4),
                    marginBottom: Math.max(16, safeGap + 4),
                }}
            >
                <div
                    className="amc-heading-wrap"
                    style={{ minWidth: 0, maxWidth: 470 }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 7,
                            color: resolvedMuted,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.13em",
                            lineHeight: 1.2,
                        }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                width: 6,
                                height: 6,
                                flex: "0 0 auto",
                                borderRadius: 999,
                                background: accentColor,
                                boxShadow: `0 0 0 4px ${colorWithAlpha(accentColor, 0.09)}`,
                            }}
                        />
                        {eyebrow}
                    </div>
                    <h2
                        style={{
                            margin: 0,
                            color: resolvedText,
                            fontSize: "clamp(20px, 3.1cqw, 30px)",
                            fontWeight: 600,
                            letterSpacing: "-0.035em",
                            lineHeight: 1.12,
                        }}
                    >
                        {heading}
                    </h2>
                </div>

                <div
                    className="amc-tabs"
                    role="tablist"
                    aria-label="Choose an AI model"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        width: "min(390px, 48%)",
                        padding: 4,
                        borderRadius: 15,
                        border: `1px solid ${innerBorder}`,
                        background: colorWithAlpha(
                            "#FFFFFF",
                            safeTheme === "dark" ? 0.035 : 0.5
                        ),
                        boxShadow: `inset 0 1px 0 ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.07 : 0.78)}`,
                    }}
                >
                    {models.map((model) => {
                        const active = selectedModel.id === model.id
                        return (
                            <button
                                key={model.id}
                                className="amc-tab amc-interactive"
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setSelectedId(model.id)}
                                style={{
                                    minWidth: 0,
                                    minHeight: 38,
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderRadius: 11,
                                    border: active
                                        ? `1px solid ${accentBorder}`
                                        : "1px solid transparent",
                                    background: active
                                        ? `linear-gradient(180deg, ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.15 : 0.78)}, transparent), ${selectedSurface}`
                                        : "transparent",
                                    boxShadow: active
                                        ? `0 7px 18px ${colorWithAlpha("#000000", safeTheme === "dark" ? 0.16 : 0.08)}, inset 0 1px 0 ${colorWithAlpha("#FFFFFF", 0.38)}`
                                        : "none",
                                    color: active
                                        ? resolvedText
                                        : resolvedMuted,
                                    fontSize: 11,
                                    fontWeight: active ? 600 : 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {model.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div
                className="amc-split-shell"
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    gridTemplateColumns: showDetailPanel
                        ? `minmax(0, ${safePanelSplit}fr) minmax(0, ${100 - safePanelSplit}fr)`
                        : "minmax(0, 1fr)",
                    alignItems: "stretch",
                    minHeight: 0,
                    height: `calc(100% - ${Math.max(76, safePadding + 62)}px)`,
                    gap: showDetailPanel ? safeGap : 0,
                }}
            >
                <section
                    aria-label="Model comparison"
                    style={{
                        minWidth: 0,
                        minHeight: 0,
                        overflow: "hidden",
                        borderRadius: Math.max(14, safeRadius - 5),
                        border: `1px solid ${innerBorder}`,
                        background: `linear-gradient(130deg, ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.025 : 0.2)}, transparent 42%), ${panelSurface}`,
                        boxShadow: panelShadow,
                        padding: Math.max(14, safePadding - 6),
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 16,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    color: resolvedText,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    lineHeight: 1.25,
                                }}
                            >
                                Model comparison
                            </div>
                            <div
                                style={{
                                    marginTop: 4,
                                    color: resolvedMuted,
                                    fontSize: 10,
                                    lineHeight: 1.4,
                                }}
                            >
                                Select a row to inspect the model
                            </div>
                        </div>
                        <span
                            style={{
                                flex: "0 0 auto",
                                padding: "5px 8px",
                                borderRadius: 999,
                                border: `1px solid ${innerBorder}`,
                                background: softSurface,
                                color: resolvedMuted,
                                fontSize: 9,
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                            }}
                        >
                            LIVE MATRIX
                        </span>
                    </div>

                    <div
                        className="amc-desktop-table"
                        style={{ display: "block" }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "minmax(120px, 1.35fr) repeat(3, minmax(72px, 1fr))",
                                gap: safeGap,
                                padding: "0 13px 8px",
                                color: resolvedMuted,
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                lineHeight: 1,
                                textTransform: "uppercase",
                            }}
                        >
                            <span>Model</span>
                            <span>Speed</span>
                            <span>Quality</span>
                            <span>Cost</span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gap: Math.max(8, safeGap - 4),
                            }}
                        >
                            {models.map((model) => {
                                const active = selectedModel.id === model.id
                                return (
                                    <div
                                        key={model.id}
                                        className="amc-interactive"
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={active}
                                        onClick={() => setSelectedId(model.id)}
                                        onKeyDown={(event) =>
                                            selectWithKeyboard(event, model.id)
                                        }
                                        style={{
                                            position: "relative",
                                            display: "grid",
                                            gridTemplateColumns:
                                                "minmax(120px, 1.35fr) repeat(3, minmax(72px, 1fr))",
                                            alignItems: "center",
                                            gap: safeGap,
                                            minHeight: 78,
                                            padding: "12px 13px",
                                            cursor: "pointer",
                                            overflow: "hidden",
                                            borderRadius: Math.max(
                                                12,
                                                safeRadius - 9
                                            ),
                                            border: active
                                                ? `1px solid ${accentBorder}`
                                                : `1px solid ${innerBorder}`,
                                            background: active
                                                ? `linear-gradient(105deg, ${selectedSurface}, ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.04 : 0.48)})`
                                                : colorWithAlpha(
                                                      "#FFFFFF",
                                                      safeTheme === "dark"
                                                          ? 0.018
                                                          : 0.3
                                                  ),
                                            boxShadow: active
                                                ? `0 12px 26px ${colorWithAlpha("#000000", safeTheme === "dark" ? 0.16 : 0.06)}, inset 0 1px 0 ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.12 : 0.86)}`
                                                : `inset 0 1px 0 ${colorWithAlpha("#FFFFFF", safeTheme === "dark" ? 0.04 : 0.64)}`,
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                    gap: 7,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: resolvedText,
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {model.name}
                                                </span>
                                                {recommendedBadge &&
                                                    model.recommended && (
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 4,
                                                                padding:
                                                                    "4px 6px",
                                                                borderRadius: 999,
                                                                border: `1px solid ${colorWithAlpha(accentColor, 0.28)}`,
                                                                background:
                                                                    colorWithAlpha(
                                                                        accentColor,
                                                                        0.1
                                                                    ),
                                                                color: resolvedText,
                                                                fontSize: 8,
                                                                fontWeight: 600,
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    color: accentColor,
                                                                }}
                                                            >
                                                                ✦
                                                            </span>
                                                            Recommended
                                                        </span>
                                                    )}
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 5,
                                                    color: resolvedMuted,
                                                    fontSize: 9,
                                                    lineHeight: 1.35,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {model.description}
                                            </div>
                                        </div>
                                        <MetricIndicator
                                            label="Speed"
                                            value={model.speed}
                                            accentColor={accentColor}
                                            trackColor={trackColor}
                                            textColor={resolvedText}
                                            mutedTextColor={resolvedMuted}
                                            indicatorStyle={safeIndicatorStyle}
                                            barHeight={safeBarHeight}
                                        />
                                        <MetricIndicator
                                            label="Quality"
                                            value={model.quality}
                                            accentColor={accentColor}
                                            trackColor={trackColor}
                                            textColor={resolvedText}
                                            mutedTextColor={resolvedMuted}
                                            indicatorStyle={safeIndicatorStyle}
                                            barHeight={safeBarHeight}
                                        />
                                        <MetricIndicator
                                            label="Cost"
                                            value={model.cost}
                                            accentColor={accentColor}
                                            trackColor={trackColor}
                                            textColor={resolvedText}
                                            mutedTextColor={resolvedMuted}
                                            indicatorStyle={safeIndicatorStyle}
                                            barHeight={safeBarHeight}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div
                        className="amc-mobile-cards"
                        style={{
                            display: "none",
                            gridTemplateColumns: "minmax(0, 1fr)",
                            gap: Math.max(8, safeGap - 4),
                        }}
                    >
                        {models.map((model) => {
                            const active = selectedModel.id === model.id
                            return (
                                <div
                                    key={model.id}
                                    className="amc-interactive"
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={active}
                                    onClick={() => setSelectedId(model.id)}
                                    onKeyDown={(event) =>
                                        selectWithKeyboard(event, model.id)
                                    }
                                    style={{
                                        padding: 14,
                                        cursor: "pointer",
                                        borderRadius: Math.max(
                                            12,
                                            safeRadius - 9
                                        ),
                                        border: active
                                            ? `1px solid ${accentBorder}`
                                            : `1px solid ${innerBorder}`,
                                        background: active
                                            ? selectedSurface
                                            : softSurface,
                                        boxShadow: active
                                            ? `inset 0 1px 0 ${colorWithAlpha("#FFFFFF", 0.14)}`
                                            : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 10,
                                            marginBottom: 13,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: resolvedText,
                                                fontSize: 14,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {model.name}
                                        </span>
                                        {recommendedBadge &&
                                            model.recommended && (
                                                <span
                                                    style={{
                                                        padding: "5px 7px",
                                                        borderRadius: 999,
                                                        border: `1px solid ${colorWithAlpha(accentColor, 0.28)}`,
                                                        background:
                                                            colorWithAlpha(
                                                                accentColor,
                                                                0.1
                                                            ),
                                                        color: resolvedText,
                                                        fontSize: 8,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    ✦ Recommended
                                                </span>
                                            )}
                                    </div>
                                    <div
                                        className="amc-mobile-metrics"
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(3, minmax(0, 1fr))",
                                            gap: 12,
                                        }}
                                    >
                                        <MetricIndicator
                                            label="Speed"
                                            value={model.speed}
                                            accentColor={accentColor}
                                            trackColor={trackColor}
                                            textColor={resolvedText}
                                            mutedTextColor={resolvedMuted}
                                            indicatorStyle={safeIndicatorStyle}
                                            barHeight={safeBarHeight}
                                            showLabel
                                        />
                                        <MetricIndicator
                                            label="Quality"
                                            value={model.quality}
                                            accentColor={accentColor}
                                            trackColor={trackColor}
                                            textColor={resolvedText}
                                            mutedTextColor={resolvedMuted}
                                            indicatorStyle={safeIndicatorStyle}
                                            barHeight={safeBarHeight}
                                            showLabel
                                        />
                                        <MetricIndicator
                                            label="Cost"
                                            value={model.cost}
                                            accentColor={accentColor}
                                            trackColor={trackColor}
                                            textColor={resolvedText}
                                            mutedTextColor={resolvedMuted}
                                            indicatorStyle={safeIndicatorStyle}
                                            barHeight={safeBarHeight}
                                            showLabel
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {showDetailPanel && (
                    <aside
                        className="amc-detail-panel"
                        aria-label={`${selectedModel.name} model details`}
                        style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                            minHeight: 0,
                            overflow: "hidden",
                            borderRadius: Math.max(14, safeRadius - 5),
                            border: `1px solid ${innerBorder}`,
                            background: `linear-gradient(145deg, ${colorWithAlpha(accentColor, 0.07)}, transparent 42%), ${panelSurface}`,
                            boxShadow: panelShadow,
                            padding: Math.max(16, safePadding - 4),
                        }}
                    >
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: -72,
                                right: -54,
                                width: 170,
                                height: 170,
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${colorWithAlpha(accentColor, 0.12)}, transparent 68%)`,
                                pointerEvents: "none",
                            }}
                        />

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    marginBottom: 18,
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "6px 8px",
                                        borderRadius: 999,
                                        border: `1px solid ${innerBorder}`,
                                        background: softSurface,
                                        color: resolvedMuted,
                                        fontSize: 9,
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 999,
                                            background: accentColor,
                                        }}
                                    />
                                    MODEL{" "}
                                    {String(selectedIndex + 1).padStart(2, "0")}
                                </span>
                                {recommendedBadge &&
                                    selectedModel.recommended && (
                                        <span
                                            style={{
                                                padding: "6px 8px",
                                                borderRadius: 999,
                                                border: `1px solid ${colorWithAlpha(accentColor, 0.32)}`,
                                                background: colorWithAlpha(
                                                    accentColor,
                                                    0.11
                                                ),
                                                color: resolvedText,
                                                fontSize: 9,
                                                fontWeight: 600,
                                            }}
                                        >
                                            ✦ Recommended
                                        </span>
                                    )}
                            </div>

                            <h3
                                style={{
                                    margin: 0,
                                    color: resolvedText,
                                    fontSize: "clamp(24px, 3.2cqw, 38px)",
                                    fontWeight: 600,
                                    letterSpacing: "-0.045em",
                                    lineHeight: 1.04,
                                }}
                            >
                                {selectedModel.name}
                            </h3>
                            <p
                                style={{
                                    margin: "12px 0 0",
                                    color: resolvedMuted,
                                    fontSize: 12,
                                    fontWeight: 400,
                                    lineHeight: 1.65,
                                }}
                            >
                                {selectedModel.description}
                            </p>
                        </div>

                        <div
                            className="amc-detail-metrics"
                            style={{
                                position: "relative",
                                zIndex: 1,
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(3, minmax(0, 1fr))",
                                gap: 8,
                                marginTop: 20,
                            }}
                        >
                            {[
                                ["Speed", selectedModel.speed],
                                ["Quality", selectedModel.quality],
                                ["Cost", selectedModel.cost],
                            ].map(([label, value]) => (
                                <div
                                    key={String(label)}
                                    style={{
                                        minWidth: 0,
                                        padding: 10,
                                        borderRadius: Math.max(
                                            10,
                                            safeRadius - 12
                                        ),
                                        border: `1px solid ${innerBorder}`,
                                        background: softSurface,
                                    }}
                                >
                                    <MetricIndicator
                                        label={String(label)}
                                        value={Number(value)}
                                        accentColor={accentColor}
                                        trackColor={trackColor}
                                        textColor={resolvedText}
                                        mutedTextColor={resolvedMuted}
                                        indicatorStyle={safeIndicatorStyle}
                                        barHeight={safeBarHeight}
                                        showLabel
                                    />
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                position: "relative",
                                zIndex: 1,
                                marginTop: 18,
                                paddingTop: 17,
                                borderTop: `1px solid ${innerBorder}`,
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: 9,
                                    color: resolvedMuted,
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Best for
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 7,
                                }}
                            >
                                {splitBestFor(selectedModel.bestFor).map(
                                    (item) => (
                                        <span
                                            key={item}
                                            style={{
                                                padding: "7px 9px",
                                                borderRadius: 9,
                                                border: `1px solid ${innerBorder}`,
                                                background: colorWithAlpha(
                                                    "#FFFFFF",
                                                    safeTheme === "dark"
                                                        ? 0.035
                                                        : 0.54
                                                ),
                                                color: resolvedText,
                                                fontSize: 9,
                                                fontWeight: 500,
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {item}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

                        <div
                            style={{
                                position: "relative",
                                zIndex: 1,
                                marginTop: "auto",
                                paddingTop: 18,
                            }}
                        >
                            <a
                                className="amc-interactive"
                                href={ctaLink || "#"}
                                target={ctaOpenNewTab ? "_blank" : undefined}
                                rel={
                                    ctaOpenNewTab
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    width: "100%",
                                    minHeight: 46,
                                    padding:
                                        safeCTAStyle === "text"
                                            ? "14px 1px 1px"
                                            : "11px 13px",
                                    borderRadius:
                                        safeCTAStyle === "text"
                                            ? 0
                                            : Math.max(11, safeRadius - 10),
                                    border: `1px solid ${ctaBorder}`,
                                    background: ctaBackground,
                                    boxShadow:
                                        safeCTAStyle === "filled"
                                            ? `0 12px 26px ${colorWithAlpha(accentColor, 0.18)}, inset 0 1px 0 ${colorWithAlpha("#FFFFFF", 0.32)}`
                                            : "none",
                                    color: ctaColor,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                    textDecoration: "none",
                                }}
                            >
                                <span>{ctaText}</span>
                                <span
                                    aria-hidden="true"
                                    style={{ fontSize: 14, lineHeight: 1 }}
                                >
                                    ↗
                                </span>
                            </a>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    )
}

addPropertyControls(AIModelComparisonFree, {
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: DEFAULTS.eyebrow,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: DEFAULTS.heading,
    },
    defaultSelectedModel: {
        type: ControlType.Enum,
        title: "Default Model",
        options: ["fast", "balanced", "advanced"],
        optionTitles: ["Fast", "Balanced", "Advanced"],
        defaultValue: DEFAULTS.defaultSelectedModel,
        displaySegmentedControl: true,
    },

    model1Name: {
        type: ControlType.String,
        title: "Fast Name",
        defaultValue: DEFAULTS.model1Name,
    },
    model1Description: {
        type: ControlType.String,
        title: "Fast Description",
        defaultValue: DEFAULTS.model1Description,
        displayTextArea: true,
    },
    model1Speed: {
        type: ControlType.Number,
        title: "Fast Speed",
        defaultValue: DEFAULTS.model1Speed,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model1Quality: {
        type: ControlType.Number,
        title: "Fast Quality",
        defaultValue: DEFAULTS.model1Quality,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model1Cost: {
        type: ControlType.Number,
        title: "Fast Cost",
        defaultValue: DEFAULTS.model1Cost,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model1BestFor: {
        type: ControlType.String,
        title: "Fast Best For",
        defaultValue: DEFAULTS.model1BestFor,
        description: "Separate tags with commas.",
    },

    model2Name: {
        type: ControlType.String,
        title: "Balanced Name",
        defaultValue: DEFAULTS.model2Name,
    },
    model2Description: {
        type: ControlType.String,
        title: "Balanced Description",
        defaultValue: DEFAULTS.model2Description,
        displayTextArea: true,
    },
    model2Speed: {
        type: ControlType.Number,
        title: "Balanced Speed",
        defaultValue: DEFAULTS.model2Speed,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model2Quality: {
        type: ControlType.Number,
        title: "Balanced Quality",
        defaultValue: DEFAULTS.model2Quality,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model2Cost: {
        type: ControlType.Number,
        title: "Balanced Cost",
        defaultValue: DEFAULTS.model2Cost,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model2BestFor: {
        type: ControlType.String,
        title: "Balanced Best For",
        defaultValue: DEFAULTS.model2BestFor,
        description: "Separate tags with commas.",
    },

    model3Name: {
        type: ControlType.String,
        title: "Advanced Name",
        defaultValue: DEFAULTS.model3Name,
    },
    model3Description: {
        type: ControlType.String,
        title: "Advanced Description",
        defaultValue: DEFAULTS.model3Description,
        displayTextArea: true,
    },
    model3Speed: {
        type: ControlType.Number,
        title: "Advanced Speed",
        defaultValue: DEFAULTS.model3Speed,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model3Quality: {
        type: ControlType.Number,
        title: "Advanced Quality",
        defaultValue: DEFAULTS.model3Quality,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model3Cost: {
        type: ControlType.Number,
        title: "Advanced Cost",
        defaultValue: DEFAULTS.model3Cost,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    model3BestFor: {
        type: ControlType.String,
        title: "Advanced Best For",
        defaultValue: DEFAULTS.model3BestFor,
        description: "Separate tags with commas.",
    },

    ctaText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: DEFAULTS.ctaText,
    },
    brandNote: {
        type: ControlType.String,
        title: "Pro Version",
        defaultValue: DEFAULTS.brandNote,
        description: "Get the Pro version for full customization by Agapea",
    },
})
