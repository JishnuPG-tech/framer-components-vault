// Adjustable Pricing Card — neutral pricing card with slider, model selector, billing toggle,
// and standard / free / custom / configurable pricing modes.
// Currency and locale are pure props — no network, no IP lookup, no sessionStorage.
// Static-safe: useIsStaticRenderer guards every side effect, initial state is deterministic.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useMemo, useEffect, type CSSProperties } from "react"

interface ModelOption {
    name: string
    image?: { src: string; alt?: string; srcSet?: string }
    enabled: boolean
    imageSize?: number
    borderRadius?: number
}

interface TierOption {
    label: string
    runs: number
    monthlyPrice: number
    yearlyPrice: number
    monthlyPriceEur?: number
    yearlyPriceEur?: number
    overage: string
    overageEur?: string
}

interface AdjustablePricingCardProps {
    componentId: string
    pricingMode: "standard" | "free" | "custom" | "configurable"
    density: "compact" | "comfortable"
    customPriceLabel: string
    customPriceSuffix: string
    showBillingToggle: boolean
    showFixedLimit: boolean
    fixedLimitLabel: string
    fixedLimitValue: string
    standardPerModelMonthly: number
    standardPerModelMonthlyEur: number
    standardPerModelYearly: number
    standardPerModelYearlyEur: number
    showModelAddonRow: boolean
    modelAddonLabel: string
    configurableBasePrice: number
    configurableBasePriceEur: number
    configurablePerModelPrice: number
    configurablePerModelPriceEur: number
    configurableAnnualDiscount: number
    configurablePriceLabel: string
    tierName: string
    tierBadge: string
    showTierBadge: boolean
    showTierDescription: boolean
    tierDescription: string
    tiers: TierOption[]
    showButton: boolean
    buttonText: string
    buttonLink: string
    defaultBilling: "monthly" | "annual"
    showSavingsBadge: boolean
    savingsPercentage: number
    showRunsSlider: boolean
    runsLabel: string
    showModelsSection: boolean
    modelsSectionTitle: string
    models: ModelOption[]
    maxSelectableModels: number
    showOverageRow: boolean
    overageLabel: string
    showFeatureList: boolean
    features: { label: string; included: boolean }[]
    featuresTitle: string
    backgroundColor: string
    accentBackgroundColor: string
    textColor: string
    mutedTextColor: string
    titleColor: string
    priceColor: string
    borderColor: string
    borderWidth: number
    borderRadius: number
    buttonBackground: string
    buttonTextColor: string
    buttonBorderColor: string
    accentColor: string
    headerFont: any
    priceFont: any
    bodyFont: any
    labelFont: any
    fontFamily: string
    cardShadow: string
    isFeatured: boolean
    featuredBadgeText: string
    currencyMode: "usd" | "eur" | "custom"
    customCurrencySymbol: string
    locale: string
    style?: CSSProperties
}

// ─────────────────────────────────────────────────────────────────────────
// Cross-instance billing sync via window event bus.
// Pure client-side coordination — no network, no storage.
// ─────────────────────────────────────────────────────────────────────────

const BILLING_EVENT = "__adjustable_billing_change"

interface BillingBus {
    isAnnual: boolean
    prices: Record<string, number>
}

function getBus(): BillingBus {
    if (typeof window === "undefined") {
        return { isAnnual: false, prices: {} }
    }
    const w = window as any
    if (!w.__adjustableBillingBus) {
        w.__adjustableBillingBus = { isAnnual: false, prices: {} }
    }
    return w.__adjustableBillingBus
}

function setBillingGlobal(isAnnual: boolean) {
    if (typeof window === "undefined") return
    const bus = getBus()
    if (bus.isAnnual === isAnnual) return
    bus.isAnnual = isAnnual
    window.dispatchEvent(
        new CustomEvent(BILLING_EVENT, { detail: { isAnnual } })
    )
}

export function getPriceById(componentId: string): number {
    return getBus().prices[componentId] || 0
}

// ─────────────────────────────────────────────────────────────────────────
// Density tokens
// ─────────────────────────────────────────────────────────────────────────

const densityTokens = {
    compact: {
        padding: 16,
        sectionGap: 10,
        sectionDivider: 10,
        headerGap: 4,
        priceGap: 8,
        rowPaddingV: 7,
        rowPaddingH: 10,
        modelIcon: 20,
        modelImage: 14,
        modelRowPadV: 6,
        modelRowPadH: 10,
        modelListGap: 4,
        featureGap: 5,
        ctaPadding: "9px 16px",
        toggleOuterPad: 3,
        toggleBtnPadV: 5,
        toggleBtnPadH: 10,
        toggleBtnFont: 12,
        priceFontSize: 26,
        sliderHeaderFont: 12,
        sliderMarkerFont: 10,
        labelFontSize: 12,
        bodyFontSize: 13,
        rowFontSize: 12,
        descFontSize: 12,
    },
    comfortable: {
        padding: 24,
        sectionGap: 20,
        sectionDivider: 16,
        headerGap: 8,
        priceGap: 12,
        rowPaddingV: 12,
        rowPaddingH: 14,
        modelIcon: 24,
        modelImage: 18,
        modelRowPadV: 10,
        modelRowPadH: 12,
        modelListGap: 6,
        featureGap: 10,
        ctaPadding: "12px 20px",
        toggleOuterPad: 4,
        toggleBtnPadV: 8,
        toggleBtnPadH: 12,
        toggleBtnFont: 13,
        priceFontSize: 40,
        sliderHeaderFont: 13,
        sliderMarkerFont: 11,
        labelFontSize: 13,
        bodyFontSize: 14,
        rowFontSize: 13,
        descFontSize: 14,
    },
}

/**
 * Adjustable Pricing Card
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AdjustablePricingCard(
    props: AdjustablePricingCardProps
) {
    const {
        componentId,
        pricingMode,
        density,
        customPriceLabel,
        customPriceSuffix,
        showBillingToggle,
        showFixedLimit,
        fixedLimitLabel,
        fixedLimitValue,
        standardPerModelMonthly,
        standardPerModelMonthlyEur,
        standardPerModelYearly,
        standardPerModelYearlyEur,
        showModelAddonRow,
        modelAddonLabel,
        configurableBasePrice,
        configurableBasePriceEur,
        configurablePerModelPrice,
        configurablePerModelPriceEur,
        configurableAnnualDiscount,
        configurablePriceLabel,
        tierName,
        tierBadge,
        showTierBadge,
        showTierDescription,
        tierDescription,
        tiers,
        showButton,
        buttonText,
        buttonLink,
        defaultBilling,
        showSavingsBadge,
        savingsPercentage,
        showRunsSlider,
        runsLabel,
        showModelsSection,
        modelsSectionTitle,
        models,
        maxSelectableModels,
        showOverageRow,
        overageLabel,
        showFeatureList,
        features,
        featuresTitle,
        backgroundColor,
        accentBackgroundColor,
        textColor,
        mutedTextColor,
        titleColor,
        priceColor,
        borderColor,
        borderWidth,
        borderRadius,
        buttonBackground,
        buttonTextColor,
        buttonBorderColor,
        accentColor,
        headerFont,
        priceFont,
        bodyFont,
        labelFont,
        fontFamily,
        cardShadow,
        isFeatured,
        featuredBadgeText,
        currencyMode,
        customCurrencySymbol,
        locale,
        style,
    } = props

    const t = densityTokens[density] || densityTokens.compact
    const isStatic = useIsStaticRenderer()

    // ── Disable CSS transitions during static render so the first paint
    // doesn't animate from a default to the prop-driven state.
    const safeTransition = (value: string): string =>
        isStatic ? "none" : value

    // ── Currency: pure prop-driven, no detection, no network.
    const useEur = currencyMode === "eur"
    const currencySymbol =
        currencyMode === "eur"
            ? "\u20AC"
            : currencyMode === "custom"
              ? customCurrencySymbol || "$"
              : "$"

    // ── Locale for number formatting. Empty string falls back to runtime
    // default — for marketplace builds, prefer an explicit locale to avoid
    // SSR/CSR mismatch.
    const resolvedLocale = locale && locale.trim() ? locale.trim() : undefined

    // ── Billing state. Initial value is deterministic for static rendering
    // (defaultBilling prop). In dynamic context the bus may already hold a
    // value from a sibling card.
    const [isAnnual, setIsAnnualLocal] = useState<boolean>(() => {
        if (isStatic || typeof window === "undefined") {
            return defaultBilling === "annual"
        }
        return getBus().isAnnual
    })

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail
            if (detail && typeof detail.isAnnual === "boolean") {
                setIsAnnualLocal(detail.isAnnual)
            }
        }
        window.addEventListener(BILLING_EVENT, handler)
        return () => window.removeEventListener(BILLING_EVENT, handler)
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        const annual = defaultBilling === "annual"
        const bus = getBus()
        if (bus.isAnnual !== annual) {
            setBillingGlobal(annual)
        } else {
            setIsAnnualLocal(annual)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultBilling, isStatic])

    const setBilling = (annual: boolean) => {
        if (isStatic) return
        setBillingGlobal(annual)
        setIsAnnualLocal(annual)
    }

    const [selectedTierIndex, setSelectedTierIndex] = useState(0)

    const [selectedModels, setSelectedModels] = useState<Set<number>>(() => {
        const enabledIndices = models
            .map((_, i) => i)
            .filter((i) => models[i].enabled)
        const max =
            maxSelectableModels && maxSelectableModels > 0
                ? maxSelectableModels
                : Infinity
        return new Set(enabledIndices.slice(0, max))
    })

    const toggleModel = (idx: number) => {
        if (isStatic) return
        setSelectedModels((prev) => {
            const next = new Set(prev)
            if (next.has(idx)) {
                next.delete(idx)
            } else {
                const max =
                    maxSelectableModels && maxSelectableModels > 0
                        ? maxSelectableModels
                        : Infinity
                if (next.size >= max) {
                    const first = next.values().next().value
                    if (first !== undefined) next.delete(first)
                }
                next.add(idx)
            }
            return next
        })
    }

    const currentTier = useMemo(() => {
        if (!tiers || tiers.length === 0) return null
        return tiers[Math.min(selectedTierIndex, tiers.length - 1)] || null
    }, [tiers, selectedTierIndex])

    const standardPerModel = useMemo(() => {
        if (isAnnual) {
            return useEur
                ? standardPerModelYearlyEur || standardPerModelYearly
                : standardPerModelYearly
        }
        return useEur
            ? standardPerModelMonthlyEur || standardPerModelMonthly
            : standardPerModelMonthly
    }, [
        isAnnual,
        useEur,
        standardPerModelMonthly,
        standardPerModelMonthlyEur,
        standardPerModelYearly,
        standardPerModelYearlyEur,
    ])

    const currentPrice = useMemo(() => {
        if (pricingMode === "configurable") {
            const basePrice = useEur
                ? configurableBasePriceEur || configurableBasePrice
                : configurableBasePrice
            const perModel = useEur
                ? configurablePerModelPriceEur || configurablePerModelPrice
                : configurablePerModelPrice

            const tierMultipliers = [1, 1.6, 2.4, 3.5, 5.0, 7.0]
            const tierMult =
                tierMultipliers[
                    Math.min(selectedTierIndex, tierMultipliers.length - 1)
                ] || 1

            const modelsCost = perModel * selectedModels.size
            let total = Math.round((basePrice + modelsCost) * tierMult)

            if (isAnnual) {
                const discount = (configurableAnnualDiscount || 20) / 100
                total = Math.round(total * 12 * (1 - discount))
            }

            return total
        }

        if (!currentTier) return 0

        let basePrice: number
        if (useEur) {
            const eur = isAnnual
                ? currentTier.yearlyPriceEur
                : currentTier.monthlyPriceEur
            basePrice =
                eur !== undefined && eur !== null
                    ? eur
                    : isAnnual
                      ? currentTier.yearlyPrice
                      : currentTier.monthlyPrice
        } else {
            basePrice = isAnnual
                ? currentTier.yearlyPrice
                : currentTier.monthlyPrice
        }

        return basePrice + standardPerModel * selectedModels.size
    }, [
        pricingMode,
        currentTier,
        isAnnual,
        useEur,
        selectedModels.size,
        selectedTierIndex,
        configurableBasePrice,
        configurableBasePriceEur,
        configurablePerModelPrice,
        configurablePerModelPriceEur,
        configurableAnnualDiscount,
        standardPerModel,
    ])

    const currentOverage = useMemo(() => {
        if (!currentTier) return ""
        if (useEur && currentTier.overageEur) return currentTier.overageEur
        return currentTier.overage
    }, [currentTier, useEur])

    useEffect(() => {
        if (isStatic) return
        if (componentId) {
            getBus().prices[componentId] = currentPrice
        }
    }, [componentId, currentPrice, isStatic])

    const formatRuns = (n: number): string => {
        if (n >= 1_000_000)
            return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
        if (n >= 1_000) return (n / 1_000).toFixed(0) + "K"
        return n.toString()
    }

    const segBtn = (active: boolean): CSSProperties => ({
        flex: 1,
        padding: `${t.toggleBtnPadV}px ${t.toggleBtnPadH}px`,
        fontSize: t.toggleBtnFont,
        fontWeight: 500,
        fontFamily: "inherit",
        color: active ? "#fff" : textColor,
        background: active ? accentColor : "transparent",
        border: "none",
        borderRadius: Math.max(borderRadius - 4, 4),
        cursor: "pointer",
        transition: safeTransition("background 0.15s ease, color 0.15s ease"),
        whiteSpace: "nowrap",
    })

    // Resolved price font size (number, in px). Used both for font-size
    // and for explicit line-height reservation so font swap doesn't shift.
    const resolvedPriceFontSize: number = (() => {
        const raw = priceFont?.fontSize
        const parsed = raw ? parseInt(String(raw), 10) : NaN
        const base = isFinite(parsed) ? parsed : t.priceFontSize
        return density === "compact" ? Math.min(t.priceFontSize, base) : base
    })()

    // Explicit line height in px — locks the price-line container height
    // regardless of whether the price font has loaded yet.
    const priceLineHeightPx = Math.round(resolvedPriceFontSize * 1.15)

    const priceTextStyle: CSSProperties = {
        ...priceFont,
        fontSize: resolvedPriceFontSize,
        lineHeight: `${priceLineHeightPx}px`,
        display: "inline-block",
    }

    const formatMoney = (n: number): string => {
        // Use explicit locale when provided (deterministic). Otherwise fall
        // back to runtime default — fine in browser, may differ in SSG.
        const formatted = resolvedLocale
            ? n.toLocaleString(resolvedLocale)
            : n.toLocaleString()
        return `${currencySymbol}${formatted}`
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor,
                borderRadius,
                border: `${borderWidth}px solid ${isFeatured ? accentColor : borderColor}`,
                boxShadow: cardShadow,
                overflow: "hidden",
                fontFamily,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    padding: t.padding,
                    display: "flex",
                    flexDirection: "column",
                    gap: t.sectionGap,
                    minWidth: 0,
                    boxSizing: "border-box",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: t.headerGap,
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            flexWrap: "wrap",
                            minWidth: 0,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                color: titleColor,
                                ...headerFont,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {tierName}
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                flexShrink: 0,
                                flexWrap: "wrap",
                            }}
                        >
                            {isFeatured && (
                                <span
                                    style={{
                                        ...labelFont,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        padding: "2px 7px",
                                        borderRadius: 999,
                                        background: accentColor,
                                        color: "#fff",
                                    }}
                                >
                                    {featuredBadgeText}
                                </span>
                            )}
                            {showTierBadge && tierBadge && (
                                <span
                                    style={{
                                        ...labelFont,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        padding: "2px 7px",
                                        borderRadius: 999,
                                        background: accentBackgroundColor,
                                        color: mutedTextColor,
                                        border: `1px solid ${borderColor}`,
                                    }}
                                >
                                    {tierBadge}
                                </span>
                            )}
                        </div>
                    </div>
                    {showTierDescription && (
                        <p
                            style={{
                                margin: 0,
                                color: mutedTextColor,
                                ...bodyFont,
                                fontSize: t.descFontSize,
                                lineHeight: 1.4,
                            }}
                        >
                            {tierDescription}
                        </p>
                    )}
                </div>

                {/* Price block */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: t.priceGap,
                        minWidth: 0,
                    }}
                >
                    {pricingMode === "configurable" && (
                        <span
                            style={{
                                ...labelFont,
                                fontSize: 11,
                                color: mutedTextColor,
                            }}
                        >
                            {configurablePriceLabel}
                        </span>
                    )}

                    {/* Price line — height locked by explicit line-height */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 6,
                            flexWrap: "wrap",
                            minWidth: 0,
                            height: priceLineHeightPx,
                        }}
                    >
                        {pricingMode === "free" || pricingMode === "custom" ? (
                            <>
                                <span
                                    style={{
                                        color: priceColor,
                                        ...priceTextStyle,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {customPriceLabel}
                                </span>
                                {customPriceSuffix && (
                                    <span
                                        style={{
                                            color: mutedTextColor,
                                            fontSize: t.bodyFontSize,
                                        }}
                                    >
                                        {customPriceSuffix}
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <span
                                    style={{
                                        color: priceColor,
                                        ...priceTextStyle,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {formatMoney(currentPrice)}
                                </span>
                                <span
                                    style={{
                                        color: mutedTextColor,
                                        fontSize: t.bodyFontSize,
                                    }}
                                >
                                    /{isAnnual ? "yr" : "mo"}
                                </span>
                                {isAnnual && showSavingsBadge && (
                                    <span
                                        style={{
                                            marginLeft: 4,
                                            fontSize: 11,
                                            fontWeight: 500,
                                            color: accentColor,
                                            background: `${accentColor}12`,
                                            padding: "2px 7px",
                                            borderRadius: 999,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Save{" "}
                                        {pricingMode === "configurable"
                                            ? configurableAnnualDiscount
                                            : savingsPercentage}
                                        %
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* Billing toggle */}
                    {(pricingMode === "standard" ||
                        pricingMode === "configurable") &&
                        showBillingToggle && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    gap: 4,
                                    padding: t.toggleOuterPad,
                                    background: accentBackgroundColor,
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: borderRadius,
                                    width: "100%",
                                    boxSizing: "border-box",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setBilling(false)}
                                    style={segBtn(!isAnnual)}
                                >
                                    Monthly
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBilling(true)}
                                    style={segBtn(isAnnual)}
                                >
                                    Annual
                                </button>
                            </div>
                        )}
                </div>

                {/* Runs slider */}
                {(pricingMode === "standard" ||
                    pricingMode === "configurable") &&
                    showRunsSlider &&
                    tiers.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: t.priceGap,
                                paddingTop: t.sectionDivider,
                                borderTop: `1px solid ${borderColor}`,
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <span
                                    style={{
                                        ...labelFont,
                                        fontSize: t.sliderHeaderFont,
                                        fontWeight: 500,
                                        color: titleColor,
                                    }}
                                >
                                    {runsLabel}
                                </span>
                                <span
                                    style={{
                                        fontSize: t.sliderHeaderFont,
                                        color: titleColor,
                                        fontWeight: 500,
                                    }}
                                >
                                    {currentTier
                                        ? formatRuns(currentTier.runs)
                                        : "—"}
                                    <span
                                        style={{
                                            color: mutedTextColor,
                                            marginLeft: 4,
                                            fontWeight: 400,
                                        }}
                                    >
                                        runs/mo
                                    </span>
                                </span>
                            </div>

                            <input
                                type="range"
                                min={0}
                                max={Math.max(0, tiers.length - 1)}
                                step={1}
                                value={selectedTierIndex}
                                onChange={(e) => {
                                    if (isStatic) return
                                    const v = parseInt(e.target.value, 10)
                                    setSelectedTierIndex(v)
                                }}
                                disabled={isStatic}
                                style={{
                                    width: "100%",
                                    height: 4,
                                    borderRadius: 2,
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(selectedTierIndex / Math.max(1, tiers.length - 1)) * 100}%, ${borderColor} ${(selectedTierIndex / Math.max(1, tiers.length - 1)) * 100}%, ${borderColor} 100%)`,
                                    outline: "none",
                                    cursor: "pointer",
                                    margin: 0,
                                    boxSizing: "border-box",
                                }}
                                aria-label={runsLabel}
                            />
                            <style>{`
                            input[type=range]::-webkit-slider-thumb {
                                -webkit-appearance: none;
                                appearance: none;
                                width: 14px;
                                height: 14px;
                                border-radius: 50%;
                                background: ${accentColor};
                                border: 2px solid ${backgroundColor};
                                cursor: pointer;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.12);
                            }
                            input[type=range]::-moz-range-thumb {
                                width: 14px;
                                height: 14px;
                                border-radius: 50%;
                                background: ${accentColor};
                                border: 2px solid ${backgroundColor};
                                cursor: pointer;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.12);
                            }
                        `}</style>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: t.sliderMarkerFont,
                                    color: mutedTextColor,
                                    marginTop: -4,
                                    gap: 4,
                                }}
                            >
                                {tiers.map((tier, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            color:
                                                i === selectedTierIndex
                                                    ? titleColor
                                                    : mutedTextColor,
                                            fontWeight:
                                                i === selectedTierIndex
                                                    ? 500
                                                    : 400,
                                            cursor: isStatic
                                                ? "default"
                                                : "pointer",
                                            transition:
                                                safeTransition(
                                                    "color 0.15s ease"
                                                ),
                                            whiteSpace: "nowrap",
                                        }}
                                        onClick={() => {
                                            if (isStatic) return
                                            setSelectedTierIndex(i)
                                        }}
                                    >
                                        {formatRuns(tier.runs)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                {/* Model add-on row */}
                {pricingMode === "standard" &&
                    showModelAddonRow &&
                    standardPerModel > 0 &&
                    selectedModels.size > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: `${t.rowPaddingV}px ${t.rowPaddingH}px`,
                                background: accentBackgroundColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: Math.max(borderRadius - 2, 6),
                                gap: 8,
                                minWidth: 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: t.rowFontSize,
                                    color: mutedTextColor,
                                }}
                            >
                                {modelAddonLabel}
                            </span>
                            <span
                                style={{
                                    fontSize: t.rowFontSize,
                                    color: titleColor,
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                +{formatMoney(standardPerModel)} ×{" "}
                                {selectedModels.size}
                            </span>
                        </div>
                    )}

                {/* Overage row */}
                {pricingMode === "standard" &&
                    showOverageRow &&
                    currentTier && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: `${t.rowPaddingV}px ${t.rowPaddingH}px`,
                                background: accentBackgroundColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: Math.max(borderRadius - 2, 6),
                                gap: 8,
                                minWidth: 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: t.rowFontSize,
                                    color: mutedTextColor,
                                }}
                            >
                                {overageLabel}
                            </span>
                            <span
                                style={{
                                    fontSize: t.rowFontSize,
                                    color: titleColor,
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {currentOverage}
                            </span>
                        </div>
                    )}

                {/* Fixed limit row */}
                {pricingMode !== "standard" && showFixedLimit && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: `${t.rowPaddingV}px ${t.rowPaddingH}px`,
                            background: accentBackgroundColor,
                            border: `1px solid ${borderColor}`,
                            borderRadius: Math.max(borderRadius - 2, 6),
                            gap: 8,
                            minWidth: 0,
                        }}
                    >
                        <span
                            style={{
                                fontSize: t.rowFontSize,
                                color: mutedTextColor,
                            }}
                        >
                            {fixedLimitLabel}
                        </span>
                        <span
                            style={{
                                fontSize: t.rowFontSize,
                                color: titleColor,
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {fixedLimitValue}
                        </span>
                    </div>
                )}

                {/* Models section */}
                {showModelsSection && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: t.priceGap - 2,
                            paddingTop: t.sectionDivider,
                            borderTop: `1px solid ${borderColor}`,
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            <span
                                style={{
                                    ...labelFont,
                                    fontSize: t.labelFontSize,
                                    fontWeight: 500,
                                    color: titleColor,
                                }}
                            >
                                {modelsSectionTitle}
                            </span>
                            {pricingMode === "standard" &&
                                standardPerModel > 0 && (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: mutedTextColor,
                                        }}
                                    >
                                        +{formatMoney(standardPerModel)} each
                                    </span>
                                )}
                            {maxSelectableModels > 0 &&
                                !(
                                    pricingMode === "standard" &&
                                    standardPerModel > 0
                                ) && (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: mutedTextColor,
                                        }}
                                    >
                                        {selectedModels.size} of{" "}
                                        {maxSelectableModels} selected
                                    </span>
                                )}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: t.modelListGap,
                            }}
                        >
                            {models.map((model, idx) => {
                                const isSelected = selectedModels.has(idx)
                                return (
                                    <button
                                        type="button"
                                        key={idx}
                                        onClick={() => toggleModel(idx)}
                                        disabled={isStatic}
                                        style={{
                                            position: "relative",
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 10,
                                            padding: `${t.modelRowPadV}px ${t.modelRowPadH}px`,
                                            background: isSelected
                                                ? accentBackgroundColor
                                                : backgroundColor,
                                            border: `1px solid ${isSelected ? accentColor : borderColor}`,
                                            borderRadius: Math.max(
                                                borderRadius - 2,
                                                6
                                            ),
                                            cursor: isStatic
                                                ? "default"
                                                : "pointer",
                                            transition: safeTransition(
                                                "background 0.15s ease, border-color 0.15s ease"
                                            ),
                                            textAlign: "left",
                                            fontFamily: "inherit",
                                            boxSizing: "border-box",
                                            minWidth: 0,
                                        }}
                                        aria-label={`${isSelected ? "Disable" : "Enable"} ${model.name}`}
                                        aria-pressed={isSelected}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                minWidth: 0,
                                                flex: 1,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flexShrink: 0,
                                                    width: t.modelIcon,
                                                    height: t.modelIcon,
                                                    borderRadius: 5,
                                                    background:
                                                        accentBackgroundColor,
                                                    border: `1px solid ${borderColor}`,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {model.image?.src ? (
                                                    <img
                                                        src={model.image.src}
                                                        srcSet={
                                                            model.image.srcSet
                                                        }
                                                        alt={
                                                            model.image.alt ||
                                                            model.name
                                                        }
                                                        style={{
                                                            width:
                                                                model.imageSize ||
                                                                t.modelImage,
                                                            height:
                                                                model.imageSize ||
                                                                t.modelImage,
                                                            objectFit:
                                                                "contain",
                                                            borderRadius:
                                                                model.borderRadius ??
                                                                4,
                                                            display: "block",
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            color: mutedTextColor,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {model.name
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: t.rowFontSize,
                                                    color: titleColor,
                                                    fontWeight: 500,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    minWidth: 0,
                                                }}
                                            >
                                                {model.name}
                                            </span>
                                        </div>

                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: isSelected
                                                    ? accentColor
                                                    : mutedTextColor,
                                                fontWeight: 500,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {isSelected ? "On" : "Off"}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Feature list */}
                {showFeatureList && features && features.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: t.priceGap - 2,
                            paddingTop: t.sectionDivider,
                            borderTop: `1px solid ${borderColor}`,
                            minWidth: 0,
                        }}
                    >
                        {featuresTitle && (
                            <span
                                style={{
                                    ...labelFont,
                                    fontSize: t.labelFontSize,
                                    fontWeight: 500,
                                    color: titleColor,
                                }}
                            >
                                {featuresTitle}
                            </span>
                        )}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: t.featureGap,
                            }}
                        >
                            {features.map((f, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 8,
                                        opacity: f.included ? 1 : 0.45,
                                    }}
                                >
                                    <div
                                        style={{
                                            flexShrink: 0,
                                            width: 14,
                                            height: 14,
                                            marginTop: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {f.included ? (
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 14 14"
                                                fill="none"
                                            >
                                                <path
                                                    d="M3 7.5L5.5 10L11 4.5"
                                                    stroke={accentColor}
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 14 14"
                                                fill="none"
                                            >
                                                <path
                                                    d="M3.5 7H10.5"
                                                    stroke={mutedTextColor}
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <span
                                        style={{
                                            ...bodyFont,
                                            color: textColor,
                                            fontSize: t.bodyFontSize,
                                            lineHeight: 1.4,
                                            minWidth: 0,
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {f.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA Button */}
                {showButton && (
                    <a
                        href={buttonLink}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            background: buttonBackground,
                            color: buttonTextColor,
                            borderRadius: Math.max(borderRadius - 2, 6),
                            padding: t.ctaPadding,
                            textDecoration: "none",
                            cursor: "pointer",
                            border: `1px solid ${buttonBorderColor}`,
                            transition: safeTransition("filter 0.15s ease"),
                            ...bodyFont,
                            fontWeight: 500,
                            fontSize: 14,
                            boxSizing: "border-box",
                            width: "100%",
                        }}
                        onMouseEnter={(e) => {
                            if (isStatic) return
                            e.currentTarget.style.filter = "brightness(0.92)"
                        }}
                        onMouseLeave={(e) => {
                            if (isStatic) return
                            e.currentTarget.style.filter = "brightness(1)"
                        }}
                    >
                        <span>{buttonText}</span>
                    </a>
                )}
            </div>
        </div>
    )
}

addPropertyControls(AdjustablePricingCard, {
    // ───── Content
    tierName: {
        type: ControlType.String,
        title: "Tier Name",
        defaultValue: "Pro",
    },
    showTierDescription: {
        type: ControlType.Boolean,
        title: "Description",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    tierDescription: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "For teams shipping agents to production at scale.",
        displayTextArea: true,
        hidden: ({ showTierDescription }) => !showTierDescription,
    },
    showTierBadge: {
        type: ControlType.Boolean,
        title: "Tier Badge",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    tierBadge: {
        type: ControlType.String,
        title: "Badge Text",
        defaultValue: "Pro",
        hidden: ({ showTierBadge }) => !showTierBadge,
    },
    isFeatured: {
        type: ControlType.Boolean,
        title: "Featured",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "Highlights the card with the accent border color and adds a featured badge.",
    },
    featuredBadgeText: {
        type: ControlType.String,
        title: "Featured Label",
        defaultValue: "Popular",
        hidden: ({ isFeatured }) => !isFeatured,
    },

    // ───── Density
    density: {
        type: ControlType.Enum,
        title: "Density",
        options: ["compact", "comfortable"],
        optionTitles: ["Compact", "Comfortable"],
        defaultValue: "compact",
        displaySegmentedControl: true,
        description:
            "Compact fits the full card in ~520px height. Comfortable is roomier — for hero pricing sections with more vertical space.",
    },

    // ───── Currency & locale
    currencyMode: {
        type: ControlType.Enum,
        title: "Currency",
        options: ["usd", "eur", "custom"],
        optionTitles: ["USD ($)", "EUR (€)", "Custom"],
        defaultValue: "usd",
        description:
            "USD or EUR uses the matching prices in your tier array. Custom uses the USD prices but swaps the symbol.",
    },
    customCurrencySymbol: {
        type: ControlType.String,
        title: "Custom Symbol",
        defaultValue: "$",
        placeholder: "£ / ¥ / CHF",
        hidden: ({ currencyMode }) => currencyMode !== "custom",
    },
    locale: {
        type: ControlType.String,
        title: "Locale",
        defaultValue: "en-US",
        placeholder: "en-US / de-DE / fr-FR",
        description:
            "Used by toLocaleString() for number grouping (1,000 vs 1.000). Empty = runtime default.",
    },

    // ───── Pricing
    pricingMode: {
        type: ControlType.Enum,
        title: "Pricing Mode",
        options: ["standard", "free", "custom", "configurable"],
        optionTitles: ["Standard", "Free", "Custom", "Configurable"],
        defaultValue: "standard",
        description:
            "Standard = fixed tiers + optional per-model add-on. Free = static label. Custom = 'Talk to sales' style. Configurable = price calculated live from base + selected models + tier multiplier.",
    },
    componentId: {
        type: ControlType.String,
        title: "Component ID",
        defaultValue: "",
        placeholder: "e.g. pricing-pro",
        description:
            "Optional. Lets other components read this card's current price via getPriceById().",
    },
    defaultBilling: {
        type: ControlType.Enum,
        title: "Default Billing",
        options: ["monthly", "annual"],
        optionTitles: ["Monthly", "Annual"],
        defaultValue: "monthly",
        displaySegmentedControl: true,
        hidden: ({ pricingMode }) =>
            pricingMode === "free" || pricingMode === "custom",
    },
    showBillingToggle: {
        type: ControlType.Boolean,
        title: "Billing Toggle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ pricingMode }) =>
            pricingMode === "free" || pricingMode === "custom",
        description:
            "Monthly / Annual switch. State syncs across every card on the page.",
    },
    showSavingsBadge: {
        type: ControlType.Boolean,
        title: "Savings Badge",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ pricingMode }) =>
            pricingMode === "free" || pricingMode === "custom",
    },
    savingsPercentage: {
        type: ControlType.Number,
        title: "Savings %",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        hidden: ({ pricingMode, showSavingsBadge }) =>
            pricingMode === "free" ||
            pricingMode === "custom" ||
            pricingMode === "configurable" ||
            !showSavingsBadge,
    },

    // ───── Standard mode: per-model add-on
    standardPerModelMonthly: {
        type: ControlType.Number,
        title: "Per Model ($/mo)",
        defaultValue: 0,
        min: 0,
        step: 1,
        hidden: ({ pricingMode }) => pricingMode !== "standard",
        description:
            "Added to the tier price for each enabled model. Set to 0 if models are included with the tier.",
    },
    standardPerModelMonthlyEur: {
        type: ControlType.Number,
        title: "Per Model (\u20AC/mo)",
        defaultValue: 0,
        min: 0,
        step: 1,
        hidden: ({ pricingMode }) => pricingMode !== "standard",
    },
    standardPerModelYearly: {
        type: ControlType.Number,
        title: "Per Model ($/yr)",
        defaultValue: 0,
        min: 0,
        step: 1,
        hidden: ({ pricingMode }) => pricingMode !== "standard",
        description:
            "Per-model add-on charged annually. Apply your annual discount here directly.",
    },
    standardPerModelYearlyEur: {
        type: ControlType.Number,
        title: "Per Model (\u20AC/yr)",
        defaultValue: 0,
        min: 0,
        step: 1,
        hidden: ({ pricingMode }) => pricingMode !== "standard",
    },
    showModelAddonRow: {
        type: ControlType.Boolean,
        title: "Add-on Row",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ pricingMode }) => pricingMode !== "standard",
        description:
            "Shows '+€5 × 3' style breakdown row when models are selected and a per-model price is set.",
    },
    modelAddonLabel: {
        type: ControlType.String,
        title: "Add-on Label",
        defaultValue: "Models",
        hidden: ({ pricingMode, showModelAddonRow }) =>
            pricingMode !== "standard" || !showModelAddonRow,
    },

    // ───── Free / Custom modes
    customPriceLabel: {
        type: ControlType.String,
        title: "Price Label",
        defaultValue: "Free",
        placeholder: "Free / €0 / Talk to sales",
        hidden: ({ pricingMode }) =>
            pricingMode === "standard" || pricingMode === "configurable",
    },
    customPriceSuffix: {
        type: ControlType.String,
        title: "Price Suffix",
        defaultValue: "forever",
        placeholder: "forever / per seat / on request",
        hidden: ({ pricingMode }) =>
            pricingMode === "standard" || pricingMode === "configurable",
    },
    showFixedLimit: {
        type: ControlType.Boolean,
        title: "Fixed Limit Row",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ pricingMode }) =>
            pricingMode === "standard" || pricingMode === "configurable",
    },
    fixedLimitLabel: {
        type: ControlType.String,
        title: "Limit Label",
        defaultValue: "Included",
        hidden: ({ pricingMode, showFixedLimit }) =>
            pricingMode === "standard" ||
            pricingMode === "configurable" ||
            !showFixedLimit,
    },
    fixedLimitValue: {
        type: ControlType.String,
        title: "Limit Value",
        defaultValue: "1K runs/mo",
        placeholder: "1K runs/mo / unlimited",
        hidden: ({ pricingMode, showFixedLimit }) =>
            pricingMode === "standard" ||
            pricingMode === "configurable" ||
            !showFixedLimit,
    },

    // ───── Configurable mode
    configurablePriceLabel: {
        type: ControlType.String,
        title: "Calc. Label",
        defaultValue: "Estimated price",
        placeholder: "Estimated price / Starting at",
        hidden: ({ pricingMode }) => pricingMode !== "configurable",
    },
    configurableBasePrice: {
        type: ControlType.Number,
        title: "Base Price ($)",
        defaultValue: 1499,
        min: 0,
        step: 50,
        hidden: ({ pricingMode }) => pricingMode !== "configurable",
        description: "Starting price before models and tier multiplier.",
    },
    configurableBasePriceEur: {
        type: ControlType.Number,
        title: "Base Price (\u20AC)",
        defaultValue: 1399,
        min: 0,
        step: 50,
        hidden: ({ pricingMode }) => pricingMode !== "configurable",
    },
    configurablePerModelPrice: {
        type: ControlType.Number,
        title: "Per Model ($)",
        defaultValue: 49,
        min: 0,
        step: 1,
        hidden: ({ pricingMode }) => pricingMode !== "configurable",
        description:
            "Added to base price for each enabled model in the Models section.",
    },
    configurablePerModelPriceEur: {
        type: ControlType.Number,
        title: "Per Model (\u20AC)",
        defaultValue: 45,
        min: 0,
        step: 1,
        hidden: ({ pricingMode }) => pricingMode !== "configurable",
    },
    configurableAnnualDiscount: {
        type: ControlType.Number,
        title: "Annual Discount %",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
        hidden: ({ pricingMode }) => pricingMode !== "configurable",
        description:
            "Discount applied when Annual is selected. Annual price = monthly × 12 × (1 - discount).",
    },

    // ───── Run tiers (slider)
    showRunsSlider: {
        type: ControlType.Boolean,
        title: "Runs Slider",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ pricingMode }) =>
            pricingMode === "free" || pricingMode === "custom",
    },
    runsLabel: {
        type: ControlType.String,
        title: "Slider Label",
        defaultValue: "Monthly runs",
        hidden: ({ pricingMode, showRunsSlider }) =>
            pricingMode === "free" ||
            pricingMode === "custom" ||
            !showRunsSlider,
    },
    tiers: {
        type: ControlType.Array,
        title: "Run Tiers",
        description:
            "Each tier is a snap point on the runs slider. In Standard mode prices come from these tiers (per-model add-on layered on top); in Configurable mode the tier index adjusts a multiplier.",
        hidden: ({ pricingMode }) =>
            pricingMode === "free" || pricingMode === "custom",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "25K runs",
                },
                runs: {
                    type: ControlType.Number,
                    title: "Runs/mo",
                    defaultValue: 25000,
                    min: 0,
                    step: 1000,
                },
                monthlyPrice: {
                    type: ControlType.Number,
                    title: "Monthly ($)",
                    defaultValue: 99,
                    min: 0,
                    step: 1,
                },
                yearlyPrice: {
                    type: ControlType.Number,
                    title: "Yearly ($)",
                    defaultValue: 950,
                    min: 0,
                    step: 1,
                },
                monthlyPriceEur: {
                    type: ControlType.Number,
                    title: "Monthly (\u20AC)",
                    defaultValue: 90,
                    min: 0,
                    step: 1,
                },
                yearlyPriceEur: {
                    type: ControlType.Number,
                    title: "Yearly (\u20AC)",
                    defaultValue: 870,
                    min: 0,
                    step: 1,
                },
                overage: {
                    type: ControlType.String,
                    title: "Overage ($)",
                    defaultValue: "$0.002/run",
                },
                overageEur: {
                    type: ControlType.String,
                    title: "Overage (\u20AC)",
                    defaultValue: "\u20AC0.0018/run",
                },
            },
        },
        defaultValue: [
            {
                label: "10K runs",
                runs: 10000,
                monthlyPrice: 49,
                yearlyPrice: 470,
                monthlyPriceEur: 45,
                yearlyPriceEur: 430,
                overage: "$0.003/run",
                overageEur: "\u20AC0.0028/run",
            },
            {
                label: "25K runs",
                runs: 25000,
                monthlyPrice: 99,
                yearlyPrice: 950,
                monthlyPriceEur: 90,
                yearlyPriceEur: 870,
                overage: "$0.002/run",
                overageEur: "\u20AC0.0018/run",
            },
            {
                label: "100K runs",
                runs: 100000,
                monthlyPrice: 299,
                yearlyPrice: 2870,
                monthlyPriceEur: 275,
                yearlyPriceEur: 2640,
                overage: "$0.0015/run",
                overageEur: "\u20AC0.0014/run",
            },
            {
                label: "500K runs",
                runs: 500000,
                monthlyPrice: 999,
                yearlyPrice: 9590,
                monthlyPriceEur: 920,
                yearlyPriceEur: 8830,
                overage: "$0.001/run",
                overageEur: "\u20AC0.0009/run",
            },
        ],
    },
    showOverageRow: {
        type: ControlType.Boolean,
        title: "Overage Row",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ pricingMode }) => pricingMode !== "standard",
    },
    overageLabel: {
        type: ControlType.String,
        title: "Overage Label",
        defaultValue: "Overage",
        hidden: ({ pricingMode, showOverageRow }) =>
            pricingMode !== "standard" || !showOverageRow,
    },

    // ───── Models section
    showModelsSection: {
        type: ControlType.Boolean,
        title: "Models Section",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    modelsSectionTitle: {
        type: ControlType.String,
        title: "Models Title",
        defaultValue: "Supported models",
        hidden: ({ showModelsSection }) => !showModelsSection,
    },
    maxSelectableModels: {
        type: ControlType.Number,
        title: "Max Selectable",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        description:
            "Cap on simultaneously enabled models. 0 = unlimited. When the cap is reached, selecting another model replaces the oldest selection.",
        hidden: ({ showModelsSection }) => !showModelsSection,
    },
    models: {
        type: ControlType.Array,
        title: "Models",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Model",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description:
                        "Optional model logo. Falls back to initials if empty.",
                },
                imageSize: {
                    type: ControlType.Number,
                    title: "Image Size",
                    defaultValue: 14,
                    min: 10,
                    max: 32,
                    step: 1,
                },
                borderRadius: {
                    type: ControlType.Number,
                    title: "Image Radius",
                    defaultValue: 4,
                    min: 0,
                    max: 20,
                    step: 1,
                },
                enabled: {
                    type: ControlType.Boolean,
                    title: "Default Enabled",
                    defaultValue: true,
                },
            },
        },
        defaultValue: [
            { name: "GPT-5", enabled: true, imageSize: 14, borderRadius: 4 },
            { name: "Claude", enabled: true, imageSize: 14, borderRadius: 4 },
            { name: "Gemini", enabled: true, imageSize: 14, borderRadius: 4 },
            { name: "Llama", enabled: false, imageSize: 14, borderRadius: 4 },
        ],
        hidden: ({ showModelsSection }) => !showModelsSection,
    },

    // ───── Features
    showFeatureList: {
        type: ControlType.Boolean,
        title: "Features",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    featuresTitle: {
        type: ControlType.String,
        title: "Features Title",
        defaultValue: "Includes",
        hidden: ({ showFeatureList }) => !showFeatureList,
    },
    features: {
        type: ControlType.Array,
        title: "Feature List",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Feature",
                },
                included: {
                    type: ControlType.Boolean,
                    title: "Included",
                    defaultValue: true,
                    description:
                        "Excluded features stay listed but appear muted — useful when comparing tiers.",
                },
            },
        },
        defaultValue: [
            { label: "Multi-model routing", included: true },
            { label: "Full execution traces", included: true },
            { label: "40+ pre-built tools", included: true },
            { label: "Slack & email alerts", included: true },
        ],
        hidden: ({ showFeatureList }) => !showFeatureList,
    },

    // ───── CTA
    showButton: {
        type: ControlType.Boolean,
        title: "CTA Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Start building",
        hidden: ({ showButton }) => !showButton,
    },
    buttonLink: {
        type: ControlType.Link,
        title: "Button Link",
        hidden: ({ showButton }) => !showButton,
    },

    // ───── Layout
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 24,
        step: 1,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 1,
    },

    // ───── Color
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    accentBackgroundColor: {
        type: ControlType.Color,
        title: "Accent BG",
        defaultValue: "#FAFAFA",
        description: "Background for rows, badges, and the billing toggle.",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E5E5E5",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#0A0A0A",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#525252",
    },
    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "#737373",
    },
    priceColor: {
        type: ControlType.Color,
        title: "Price",
        defaultValue: "#0A0A0A",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0A0A0A",
        description:
            "Used for the active billing toggle, slider, savings badge, model On state, and feature checkmarks.",
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#0A0A0A",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#FFFFFF",
    },
    buttonBorderColor: {
        type: ControlType.Color,
        title: "Button Border",
        defaultValue: "#0A0A0A",
    },
    cardShadow: {
        type: ControlType.String,
        title: "Shadow",
        defaultValue: "none",
        placeholder: "0 1px 3px rgba(0,0,0,0.06)",
    },

    // ───── Typography
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    headerFont: {
        type: ControlType.Font,
        title: "Header Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price Font",
        defaultValue: {
            fontSize: "26px",
            variant: "Semibold",
            letterSpacing: "-0.025em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "0",
            lineHeight: "1.4em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0",
            lineHeight: "1.4em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
