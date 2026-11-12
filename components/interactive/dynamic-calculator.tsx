// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type PlanKey = "plan1" | "plan2" | "plan3"
type UsageKey = "tier1" | "tier2" | "tier3"

type Addon = { id: string; name: string; price: number }

type FontStyle = any

type Props = {
    accentColor: string
    backgroundGradientStart: string
    backgroundGradientEnd: string
    gradientAngle: number
    cardBackgroundOpacity: number
    cardBorderOpacity: number
    outputCardBgOpacity: number
    outputCardBorderOpacity: number
    primaryTextColor: string
    secondaryTextColor: string
    buttonTextColor: string
    ctaBackgroundColor: string
    cardBorderRadius: number
    buttonBorderRadius: number
    componentPadding: number
    plan1Name: string
    plan1BasePrice: number
    plan2Name: string
    plan2BasePrice: number
    plan3Name: string
    plan3BasePrice: number
    seatsIncluded: number
    pricePerExtraSeat: number
    maxSeatsOnSlider: number
    usageTier1Label: string
    usageTier1Description: string
    usageTier1PriceMultiplier: number
    usageTier2Label: string
    usageTier2Description: string
    usageTier2PriceMultiplier: number
    usageTier3Label: string
    usageTier3Description: string
    usageTier3PriceMultiplier: number
    addon1Name: string
    addon1Price: number
    addon2Name: string
    addon2Price: number
    addon3Name: string
    addon3Price: number
    addon4Name: string
    addon4Price: number
    annualDiscountPercent: number
    showAnnualToggle: boolean
    currencySymbol: string
    ctaButtonText: string
    monthlyLabel: string
    annualLabel: string
    ctaLink: string
    ctaOpenInNewTab: boolean
    counterAnimationSpeedMs: number
    baseFont: FontStyle
    labelFont: FontStyle
    priceFont: FontStyle
    buttonFont: FontStyle
    style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function formatMoneyInt(n: number) {
    const rounded = Math.round(n)
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function rgbaFromHex(hex: string, alpha: number) {
    let h = (hex || "").trim()
    if (!h.startsWith("#")) h = `#${h}`
    if (h.length === 4) {
        const r = parseInt(h[1] + h[1], 16)
        const g = parseInt(h[2] + h[2], 16)
        const b = parseInt(h[3] + h[3], 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    if (h.length === 7) {
        const r = parseInt(h.slice(1, 3), 16)
        const g = parseInt(h.slice(3, 5), 16)
        const b = parseInt(h.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return `rgba(255, 255, 255, ${alpha})`
}

function useAnimatedNumber(
    target: number,
    durationMs: number,
    enabled: boolean
) {
    const [value, setValue] = useState<number>(target)
    const rafRef = useRef<number | null>(null)
    const fromRef = useRef<number>(target)
    const startRef = useRef<number>(0)

    useEffect(() => {
        if (!enabled || durationMs <= 0) {
            if (rafRef.current && typeof window !== "undefined")
                window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            fromRef.current = target
            startTransition(() => setValue(target))
            return
        }

        if (typeof window === "undefined") {
            fromRef.current = target
            startTransition(() => setValue(target))
            return
        }

        if (rafRef.current) window.cancelAnimationFrame(rafRef.current)

        const from = value
        const to = target
        fromRef.current = from
        startRef.current = performance.now()

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

        const tick = () => {
            const now = performance.now()
            const t = clamp((now - startRef.current) / durationMs, 0, 1)
            const eased = easeOutCubic(t)
            const next = from + (to - from) * eased
            startTransition(() => setValue(next))
            if (t < 1) {
                rafRef.current = window.requestAnimationFrame(tick)
            } else {
                rafRef.current = null
                fromRef.current = to
            }
        }

        rafRef.current = window.requestAnimationFrame(tick)

        return () => {
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, durationMs, enabled])

    useEffect(() => {
        if (!enabled) {
            fromRef.current = target
            startTransition(() => setValue(target))
        }
    }, [enabled, target])

    return value
}

/**
 * Pricing Calculator (Glass)
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PricingCalculatorGlass(props: Props) {
    const {
        accentColor,
        backgroundGradientStart,
        backgroundGradientEnd,
        gradientAngle,
        cardBackgroundOpacity,
        cardBorderOpacity,
        outputCardBgOpacity,
        outputCardBorderOpacity,
        primaryTextColor,
        secondaryTextColor,
        buttonTextColor,
        ctaBackgroundColor,
        cardBorderRadius,
        buttonBorderRadius,
        componentPadding,
        plan1Name,
        plan1BasePrice,
        plan2Name,
        plan2BasePrice,
        plan3Name,
        plan3BasePrice,
        seatsIncluded,
        pricePerExtraSeat,
        maxSeatsOnSlider,
        usageTier1Label,
        usageTier1Description,
        usageTier1PriceMultiplier,
        usageTier2Label,
        usageTier2Description,
        usageTier2PriceMultiplier,
        usageTier3Label,
        usageTier3Description,
        usageTier3PriceMultiplier,
        addon1Name,
        addon1Price,
        addon2Name,
        addon2Price,
        addon3Name,
        addon3Price,
        addon4Name,
        addon4Price,
        annualDiscountPercent,
        showAnnualToggle,
        currencySymbol,
        ctaButtonText,
        monthlyLabel,
        annualLabel,
        ctaLink,
        ctaOpenInNewTab,
        counterAnimationSpeedMs,
        baseFont,
        labelFont,
        priceFont,
        buttonFont,
        style,
    } = props

    const uid = useId().replace(/:/g, "")
    const isStatic = useIsStaticRenderer()

    // ─── FIX: Use ResizeObserver on the container for reliable mobile detection
    // instead of CSS media queries, which are unreliable in the Framer canvas.
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const el = containerRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                startTransition(() =>
                    setIsMobile(entry.contentRect.width <= 600)
                )
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const plans = useMemo(
        () => [
            { key: "plan1" as const, name: plan1Name, base: plan1BasePrice },
            { key: "plan2" as const, name: plan2Name, base: plan2BasePrice },
            { key: "plan3" as const, name: plan3Name, base: plan3BasePrice },
        ],
        [
            plan1Name,
            plan1BasePrice,
            plan2Name,
            plan2BasePrice,
            plan3Name,
            plan3BasePrice,
        ]
    )

    const usageTiers = useMemo(
        () => [
            {
                key: "tier1" as const,
                label: usageTier1Label,
                desc: usageTier1Description,
                mult: usageTier1PriceMultiplier,
            },
            {
                key: "tier2" as const,
                label: usageTier2Label,
                desc: usageTier2Description,
                mult: usageTier2PriceMultiplier,
            },
            {
                key: "tier3" as const,
                label: usageTier3Label,
                desc: usageTier3Description,
                mult: usageTier3PriceMultiplier,
            },
        ],
        [
            usageTier1Label,
            usageTier1Description,
            usageTier1PriceMultiplier,
            usageTier2Label,
            usageTier2Description,
            usageTier2PriceMultiplier,
            usageTier3Label,
            usageTier3Description,
            usageTier3PriceMultiplier,
        ]
    )

    const addons: Addon[] = useMemo(() => {
        const raw: Addon[] = [
            { id: "a1", name: addon1Name, price: addon1Price },
            { id: "a2", name: addon2Name, price: addon2Price },
            { id: "a3", name: addon3Name, price: addon3Price },
            { id: "a4", name: addon4Name, price: addon4Price },
        ]
        return raw.filter(
            (a) => (a.name || "").trim().length > 0 && (a.price || 0) > 0
        )
    }, [
        addon1Name,
        addon1Price,
        addon2Name,
        addon2Price,
        addon3Name,
        addon3Price,
        addon4Name,
        addon4Price,
    ])

    const [selectedPlan, setSelectedPlan] = useState<PlanKey>("plan2")
    const [teamSeats, setTeamSeats] = useState<number>(
        Math.max(1, Math.min(maxSeatsOnSlider || 50, 8))
    )
    const [usageTier, setUsageTier] = useState<UsageKey>("tier2")
    const [annual, setAnnual] = useState<boolean>(false)

    // ─── FIX: Properly closed useState call
    const [activeAddons, setActiveAddons] = useState<Record<string, boolean>>(
        {}
    )

    // Keep seats in range when prop changes
    useEffect(() => {
        const max = Math.max(1, Math.floor(maxSeatsOnSlider || 1))
        startTransition(() => setTeamSeats((s) => clamp(Math.round(s), 1, max)))
    }, [maxSeatsOnSlider])

    // Disable annual if toggle hidden
    useEffect(() => {
        if (!showAnnualToggle && annual) startTransition(() => setAnnual(false))
    }, [showAnnualToggle, annual])

    // Prune active add-ons if props changed to hide them
    useEffect(() => {
        const allowed = new Set(addons.map((a) => a.id))
        startTransition(() => {
            setActiveAddons((prev) => {
                let changed = false
                const next: Record<string, boolean> = { ...prev }
                for (const key of Object.keys(next)) {
                    if (!allowed.has(key)) {
                        delete next[key]
                        changed = true
                    }
                }
                return changed ? next : prev
            })
        })
    }, [addons])

    const selectedPlanObj = useMemo(
        () => plans.find((p) => p.key === selectedPlan) || plans[1],
        [plans, selectedPlan]
    )
    const selectedTierObj = useMemo(
        () => usageTiers.find((t) => t.key === usageTier) || usageTiers[1],
        [usageTiers, usageTier]
    )

    const costs = useMemo(() => {
        const base = Math.max(0, selectedPlanObj.base || 0)
        const mult = Math.max(0, selectedTierObj.mult || 1)
        const usageDelta = Math.max(0, (mult - 1) * base)
        const baseWithUsage = base * mult
        const included = Math.max(0, Math.floor(seatsIncluded || 0))
        const seats = Math.max(1, Math.floor(teamSeats || 1))
        const extraSeats = Math.max(0, seats - included)
        const extraSeatCost = extraSeats * Math.max(0, pricePerExtraSeat || 0)
        const addonsActiveList = addons.filter((a) => !!activeAddons[a.id])
        const addonsTotal = addonsActiveList.reduce(
            (sum, a) => sum + (a.price || 0),
            0
        )
        const monthlyPreDiscount = baseWithUsage + extraSeatCost + addonsTotal
        const discountPct = clamp(annualDiscountPercent || 0, 0, 80) / 100
        const monthly = annual
            ? monthlyPreDiscount * (1 - discountPct)
            : monthlyPreDiscount
        const annualTotal = monthly * 12
        const annualSavings = annual ? monthlyPreDiscount * 12 - annualTotal : 0

        return {
            base,
            usageDelta,
            baseWithUsage,
            extraSeats,
            extraSeatCost,
            addonsActiveList,
            addonsTotal,
            monthlyPreDiscount,
            monthly,
            annualTotal,
            annualSavings,
            discountMonthly: annual ? monthlyPreDiscount - monthly : 0,
            discountPct,
        }
    }, [
        selectedPlanObj,
        selectedTierObj,
        seatsIncluded,
        teamSeats,
        pricePerExtraSeat,
        addons,
        activeAddons,
        annual,
        annualDiscountPercent,
    ])

    const inView = useInView(containerRef, {
        amount: 0.25,
        margin: "200px 0px 200px 0px",
        once: false,
    })

    const animatedMonthly = useAnimatedNumber(
        costs.monthly,
        clamp(counterAnimationSpeedMs || 450, 100, 1500),
        !isStatic && inView
    )

    const glassBg = useMemo(
        () => rgbaFromHex("#ffffff", clamp(cardBackgroundOpacity, 1, 30) / 100),
        [cardBackgroundOpacity]
    )
    const glassBorder = useMemo(
        () => rgbaFromHex("#ffffff", clamp(cardBorderOpacity, 1, 50) / 100),
        [cardBorderOpacity]
    )
    const outBg = useMemo(
        () => rgbaFromHex(accentColor, clamp(outputCardBgOpacity, 1, 30) / 100),
        [accentColor, outputCardBgOpacity]
    )
    const outBorder = useMemo(
        () =>
            rgbaFromHex(
                accentColor,
                clamp(outputCardBorderOpacity, 1, 100) / 100
            ),
        [accentColor, outputCardBorderOpacity]
    )
    const accentSoft = useMemo(
        () => rgbaFromHex(accentColor, 0.18),
        [accentColor]
    )
    const accentDim = useMemo(
        () => rgbaFromHex(accentColor, 0.12),
        [accentColor]
    )
    const accentFaint = useMemo(
        () => rgbaFromHex(accentColor, 0.08),
        [accentColor]
    )
    const accentDivider = useMemo(
        () => rgbaFromHex(accentColor, 0.28),
        [accentColor]
    )

    const secondaryText = secondaryTextColor
    const primaryText = primaryTextColor

    // ─── FIX: Simplified fixed-dimension detection — "fit content" passes
    // undefined or "auto" for both width and height, so we guard for that.
    const isFixedWidth =
        style?.width !== undefined &&
        style?.width !== "auto" &&
        style?.width !== "fit-content" &&
        style?.width !== ""
    const isFixedHeight =
        style?.height !== undefined &&
        style?.height !== "auto" &&
        style?.height !== "fit-content" &&
        style?.height !== ""

    const onPickPlan = useCallback(
        (key: PlanKey) => startTransition(() => setSelectedPlan(key)),
        []
    )
    const onPickUsage = useCallback(
        (key: UsageKey) => startTransition(() => setUsageTier(key)),
        []
    )
    const onSeats = useCallback(
        (n: number) => startTransition(() => setTeamSeats(n)),
        []
    )
    const onToggleAnnual = useCallback(
        () => startTransition(() => setAnnual((v) => !v)),
        []
    )
    const onToggleAddon = useCallback((id: string) => {
        startTransition(() => {
            setActiveAddons((prev) => ({ ...prev, [id]: !prev[id] }))
        })
    }, [])

    const planLabel = useMemo(() => {
        const cycle = annual ? annualLabel : monthlyLabel
        return `${(selectedPlanObj.name || "").toUpperCase()} · ${(cycle || "").toUpperCase()}`
    }, [annual, annualLabel, monthlyLabel, selectedPlanObj.name])

    const ctaText = useMemo(() => {
        const plan = selectedPlanObj.name || "Plan"
        const raw = ctaButtonText || ""
        const replaced = raw.includes("{plan}")
            ? raw.replaceAll("{plan}", plan)
            : raw
        return `${replaced} →`
    }, [ctaButtonText, selectedPlanObj.name])

    const seatsReadout = useMemo(() => {
        const included = Math.max(0, Math.floor(seatsIncluded || 0))
        const seats = Math.max(1, Math.floor(teamSeats || 1))
        const extraSeats = Math.max(0, seats - included)
        if (extraSeats <= 0) return `${seats} seats  (${included} incl.)`
        const extraCost = extraSeats * Math.max(0, pricePerExtraSeat || 0)
        return `${seats} seats  +${currencySymbol}${formatMoneyInt(extraCost)}/mo`
    }, [seatsIncluded, teamSeats, pricePerExtraSeat, currencySymbol])

    const minSeats = 1
    const maxSeats = Math.max(1, Math.floor(maxSeatsOnSlider || 50))

    const labelBaseStyle: CSSProperties = useMemo(
        () => ({
            ...labelFont,
            color: secondaryText,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: labelFont?.fontSize || "12px",
        }),
        [labelFont, secondaryText]
    )

    const baseTextStyle: CSSProperties = useMemo(
        () => ({
            ...baseFont,
            color: primaryText,
        }),
        [baseFont, primaryText]
    )

    const interactiveTransition = "all 0.2s ease"

    const Button = useCallback(
        ({
            active,
            label,
            onClick,
        }: {
            active: boolean
            label: string
            onClick: () => void
        }) => {
            return (
                <button
                    type="button"
                    onClick={onClick}
                    style={{
                        ...baseTextStyle,
                        appearance: "none",
                        WebkitAppearance: "none",
                        width: "100%",
                        borderRadius: buttonBorderRadius,
                        border: `1px solid ${active ? rgbaFromHex(accentColor, 0.75) : rgbaFromHex("#ffffff", 0.12)}`,
                        background: active
                            ? accentDim
                            : rgbaFromHex("#000000", 0.18),
                        color: active ? accentColor : primaryText,
                        padding: "10px 10px",
                        cursor: "pointer",
                        transition: interactiveTransition,
                        outline: "none",
                        userSelect: "none",
                    }}
                    aria-pressed={active}
                >
                    {label}
                </button>
            )
        },
        [baseTextStyle, buttonBorderRadius, accentColor, accentDim, primaryText]
    )

    const CheckboxRow = useCallback(
        ({
            active,
            name,
            price,
            onClick,
        }: {
            active: boolean
            name: string
            price: number
            onClick: () => void
        }) => {
            return (
                <button
                    type="button"
                    onClick={onClick}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 12px",
                        borderRadius: 12,
                        border: `1px solid ${active ? rgbaFromHex(accentColor, 0.7) : rgbaFromHex("#ffffff", 0.12)}`,
                        background: active
                            ? accentFaint
                            : rgbaFromHex("#000000", 0.12),
                        cursor: "pointer",
                        transition: interactiveTransition,
                        color: primaryText,
                        textAlign: "left",
                    }}
                    aria-pressed={active}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `1px solid ${active ? rgbaFromHex(accentColor, 0.9) : rgbaFromHex("#ffffff", 0.18)}`,
                            background: active ? accentColor : "transparent",
                            transition: interactiveTransition,
                            flex: "0 0 auto",
                        }}
                    >
                        {active ? (
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    d="M10.2 3.2L5 8.4L1.8 5.2"
                                    stroke="#FFFFFF"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        ) : null}
                    </span>

                    <span
                        style={{
                            ...baseTextStyle,
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {name}
                    </span>

                    <span
                        style={{
                            ...baseTextStyle,
                            color: secondaryText,
                            flex: "0 0 auto",
                        }}
                    >
                        +{currencySymbol}
                        {formatMoneyInt(price)}/mo
                    </span>
                </button>
            )
        },
        [
            accentColor,
            accentFaint,
            baseTextStyle,
            currencySymbol,
            primaryText,
            secondaryText,
        ]
    )

    const Toggle = useCallback(
        ({ on, onClick }: { on: boolean; onClick: () => void }) => {
            return (
                <button
                    type="button"
                    onClick={onClick}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        width: 50,
                        height: 28,
                        borderRadius: 999,
                        border: `1px solid ${rgbaFromHex("#ffffff", 0.16)}`,
                        background: on
                            ? rgbaFromHex(accentColor, 0.9)
                            : rgbaFromHex("#ffffff", 0.1),
                        padding: 3,
                        cursor: "pointer",
                        transition: interactiveTransition,
                    }}
                    role="switch"
                    aria-checked={on}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            background: "#ffffff",
                            transform: on
                                ? "translateX(22px)"
                                : "translateX(0px)",
                            transition: "transform 0.2s ease",
                            boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                        }}
                    />
                </button>
            )
        },
        [accentColor]
    )

    const costBreakdown = useMemo(() => {
        const lines: {
            label: string
            value: number
            tone?: "normal" | "green"
        }[] = []
        const base = Math.max(0, selectedPlanObj.base || 0)
        lines.push({ label: `${selectedPlanObj.name} base`, value: base })
        if (costs.usageDelta > 0.0001) {
            lines.push({
                label: `${selectedTierObj.label} usage`,
                value: costs.usageDelta,
            })
        }
        if (costs.extraSeatCost > 0.0001) {
            lines.push({
                label: `Extra seats (${costs.extraSeats})`,
                value: costs.extraSeatCost,
            })
        }
        for (const a of costs.addonsActiveList) {
            lines.push({ label: a.name, value: a.price })
        }
        if (annual && costs.discountMonthly > 0.0001) {
            lines.push({
                label: `Annual discount (${Math.round(costs.discountPct * 100)}%)`,
                value: -costs.discountMonthly,
                tone: "green",
            })
        }
        return lines
    }, [
        annual,
        costs,
        selectedPlanObj.base,
        selectedPlanObj.name,
        selectedTierObj.label,
    ])

    // ─── FIX: Derived padding — on mobile cap it so there's room for content
    const effectivePadding = isMobile
        ? Math.min(componentPadding, 20)
        : componentPadding

    return (
        <div
            ref={containerRef}
            style={{
                // ─── FIX: Always use width/height 100% so Framer's own sizing
                // (fixed, fill, fit-content) drives the dimensions. Never fight it.
                ...(style || {}),
                position: "relative",
                width: "100%",
                // ─── FIX: When fit-content / auto, let height grow naturally.
                // When fixed, fill the container and clip overflow internally.
                height: isFixedHeight ? "100%" : "auto",
                minHeight: isFixedHeight ? undefined : 480,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                padding: effectivePadding,
                boxSizing: "border-box",
                background: `linear-gradient(${clamp(gradientAngle || 145, 0, 360)}deg, ${backgroundGradientStart}, ${backgroundGradientEnd})`,
                // ─── FIX: Only scroll at the root when height is truly fixed
                overflow: isFixedHeight ? "auto" : "visible",
                minWidth: 0,
                fontFamily:
                    'DM Sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            }}
        >
            {/* Scoped range-input styles — no media queries needed here */}
            <style>{`
        input[type="range"].pcg-range-${uid}{
          -webkit-appearance:none;
          appearance:none;
          width:100%;
          height: 4px;
          background: ${rgbaFromHex("#ffffff", 0.14)};
          border-radius: 999px;
          outline:none;
        }
        input[type="range"].pcg-range-${uid}::-webkit-slider-thumb{
          -webkit-appearance:none;
          appearance:none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: ${accentColor};
          box-shadow: 0 0 0 4px ${rgbaFromHex(accentColor, 0.18)};
          border: 1px solid ${rgbaFromHex("#ffffff", 0.22)};
          cursor:pointer;
          transition: all 0.2s ease;
        }
        input[type="range"].pcg-range-${uid}::-moz-range-thumb{
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: ${accentColor};
          border: 1px solid ${rgbaFromHex("#ffffff", 0.22)};
          box-shadow: 0 0 0 4px ${rgbaFromHex(accentColor, 0.18)};
          cursor:pointer;
          transition: all 0.2s ease;
        }
        input[type="range"].pcg-range-${uid}::-moz-range-track{
          height: 4px;
          background: ${rgbaFromHex("#ffffff", 0.14)};
          border-radius: 999px;
        }
      `}</style>

            {/*
             * ─── FIX: flexDirection and order are now driven entirely by the
             * isMobile boolean (ResizeObserver), not CSS media queries.
             * This works correctly in the Framer canvas, preview AND live.
             */}
            <div
                style={{
                    width: "min(900px, 100%)",
                    display: "flex",
                    // ─── FIX: column on mobile, row on desktop
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 14 : 18,
                    alignItems: "stretch",
                    // ─── FIX: always auto height so fit-content works
                    height: isFixedHeight ? "100%" : "auto",
                    minHeight: 0,
                    overflow: isFixedHeight ? "hidden" : "visible",
                    boxSizing: "border-box",
                }}
            >
                {/*
                 * ─── FIX: Output panel rendered FIRST in the DOM so that on
                 * mobile (column layout) it naturally appears on top without
                 * needing CSS `order` tricks that break in the Framer canvas.
                 * On desktop the row direction makes left/right visually correct.
                 * We use order:1 on desktop for controls, order:0 for output so
                 * output stays on the right on desktop and top on mobile.
                 */}

                {/* OUTPUT PANEL */}
                <section
                    aria-label="Price output panel"
                    style={{
                        // ─── FIX: on desktop show on the right (order 2),
                        // on mobile show on top (order 0 — first in flow)
                        order: isMobile ? 0 : 2,
                        flex: "1 1 0",
                        minWidth: 0,
                        borderRadius: cardBorderRadius,
                        background: outBg,
                        border: `1px solid ${outBorder}`,
                        boxShadow: `0 0 0 1px ${rgbaFromHex(accentColor, 0.1)}, 0 24px 70px ${accentSoft}`,
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        padding: 18,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 14,
                        // ─── FIX: height management — only scroll internally
                        // when the overall container is fixed height
                        height: isFixedHeight ? "100%" : "auto",
                        minHeight: isFixedHeight ? 0 : "auto",
                        overflow: isFixedHeight ? "hidden" : "visible",
                    }}
                >
                    <div
                        style={{
                            flex: isFixedHeight ? 1 : "none",
                            minHeight: isFixedHeight ? 0 : "auto",
                            overflow: isFixedHeight ? "auto" : "visible",
                            WebkitOverflowScrolling: "touch",
                            paddingRight: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                ...labelBaseStyle,
                                color: rgbaFromHex(accentColor, 0.65),
                            }}
                        >
                            {planLabel}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            <div
                                style={{
                                    ...priceFont,
                                    color: primaryText,
                                    fontSize: priceFont?.fontSize || "66px",
                                    lineHeight: priceFont?.lineHeight || "1em",
                                    letterSpacing:
                                        priceFont?.letterSpacing || "-0.04em",
                                    fontVariantNumeric: "tabular-nums",
                                    display: "inline-flex",
                                    alignItems: "baseline",
                                    gap: 6,
                                }}
                                aria-label={`Price per month ${Math.round(costs.monthly)}`}
                            >
                                <span
                                    style={{
                                        fontSize: "0.54em",
                                        opacity: 0.95,
                                    }}
                                >
                                    {currencySymbol}
                                </span>
                                <span>{formatMoneyInt(animatedMonthly)}</span>
                            </div>

                            <div
                                style={{
                                    ...baseTextStyle,
                                    color: rgbaFromHex(accentColor, 0.72),
                                    fontSize: "16px",
                                }}
                            >
                                /mo
                            </div>
                        </div>

                        {annual && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    ...baseTextStyle,
                                    color: rgbaFromHex(primaryText, 0.92),
                                }}
                            >
                                <span>
                                    {currencySymbol +
                                        formatMoneyInt(costs.annualTotal)}{" "}
                                    billed annually
                                </span>
                            </div>
                        )}

                        {annual && (
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    alignSelf: "flex-start",
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    border: `1px solid ${rgbaFromHex("#22c55e", 0.35)}`,
                                    background: rgbaFromHex("#22c55e", 0.1),
                                    color: "#86efac",
                                    ...baseTextStyle,
                                    fontSize: "13px",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                You save {currencySymbol}
                                {formatMoneyInt(costs.annualSavings)}/year
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    ...labelBaseStyle,
                                    color: rgbaFromHex(accentColor, 0.65),
                                }}
                            >
                                COST BREAKDOWN
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {costBreakdown.map((line, idx) => {
                                    const isGreen = line.tone === "green"
                                    return (
                                        <div
                                            key={`${line.label}-${idx}`}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 12,
                                                ...baseTextStyle,
                                                color: isGreen
                                                    ? "#86efac"
                                                    : rgbaFromHex(
                                                          primaryText,
                                                          0.92
                                                      ),
                                            }}
                                        >
                                            <span
                                                style={{
                                                    minWidth: 0,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {line.label}
                                            </span>
                                            <span style={{ flex: "0 0 auto" }}>
                                                {line.value < 0 ? "−" : ""}
                                                {currencySymbol}
                                                {formatMoneyInt(
                                                    Math.abs(line.value)
                                                )}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>

                            <div
                                style={{
                                    height: 1,
                                    background: accentDivider,
                                    opacity: 0.55,
                                    marginTop: 2,
                                }}
                            />

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    ...baseTextStyle,
                                    color: primaryText,
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>
                                    Total / month
                                </span>
                                <span style={{ fontWeight: 700 }}>
                                    {currencySymbol}
                                    {formatMoneyInt(costs.monthly)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        style={{
                            ...buttonFont,
                            width: "100%",
                            border: "none",
                            borderRadius: buttonBorderRadius,
                            padding: "14px 14px",
                            cursor: "pointer",
                            background: ctaBackgroundColor,
                            color: buttonTextColor,
                            transition: interactiveTransition,
                            boxShadow: `0 16px 40px ${rgbaFromHex(ctaBackgroundColor, 0.22)}`,
                            textAlign: "center",
                            userSelect: "none",
                        }}
                        onClick={() => {
                            if (!ctaLink) return
                            if (ctaOpenInNewTab) {
                                window.open(
                                    ctaLink,
                                    "_blank",
                                    "noopener noreferrer"
                                )
                            } else {
                                window.open(ctaLink, "_self")
                            }
                        }}
                        aria-label={ctaText}
                    >
                        {ctaText}
                    </button>
                </section>

                {/* CONTROLS PANEL */}
                <section
                    aria-label="Controls panel"
                    style={{
                        // ─── FIX: on desktop show on the left (order 1),
                        // on mobile show below output (order 1)
                        order: 1,
                        flex: "1 1 0",
                        minWidth: 0,
                        borderRadius: cardBorderRadius,
                        background: glassBg,
                        border: `1px solid ${glassBorder}`,
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        padding: 18,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        height: isFixedHeight ? "100%" : "auto",
                        minHeight: isFixedHeight ? 0 : "auto",
                        overflow: isFixedHeight ? "hidden" : "visible",
                    }}
                >
                    <div
                        style={{
                            flex: isFixedHeight ? 1 : "none",
                            minHeight: isFixedHeight ? 0 : "auto",
                            overflow: isFixedHeight ? "auto" : "visible",
                            WebkitOverflowScrolling: "touch",
                            paddingRight: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        {/* BASE PLAN */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <div style={labelBaseStyle}>BASE PLAN</div>
                            <div style={{ display: "flex", gap: 10 }}>
                                {plans.map((p) => (
                                    <div key={p.key} style={{ flex: 1 }}>
                                        <Button
                                            active={selectedPlan === p.key}
                                            label={p.name}
                                            onClick={() => onPickPlan(p.key)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TEAM SIZE */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    justifyContent: "space-between",
                                    gap: 12,
                                }}
                            >
                                <div style={labelBaseStyle}>TEAM SIZE</div>
                                <div
                                    style={{
                                        ...baseTextStyle,
                                        color: secondaryText,
                                        fontSize: baseFont?.fontSize || "14px",
                                        textAlign: "right",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {seatsReadout}
                                </div>
                            </div>

                            <input
                                className={`pcg-range-${uid}`}
                                type="range"
                                min={minSeats}
                                max={maxSeats}
                                step={1}
                                value={teamSeats}
                                onChange={(e) =>
                                    onSeats(
                                        parseInt(
                                            e.currentTarget.value || "1",
                                            10
                                        )
                                    )
                                }
                                aria-label="Team size"
                                style={{ cursor: "pointer" }}
                            />

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    color: secondaryText,
                                    ...labelBaseStyle,
                                    fontSize: "11px",
                                }}
                            >
                                <span>{minSeats}</span>
                                <span>{maxSeats}</span>
                            </div>
                        </div>

                        {/* USAGE VOLUME */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <div style={labelBaseStyle}>USAGE VOLUME</div>
                            <div style={{ display: "flex", gap: 10 }}>
                                {usageTiers.map((t) => (
                                    <div key={t.key} style={{ flex: 1 }}>
                                        <Button
                                            active={usageTier === t.key}
                                            label={t.label}
                                            onClick={() => onPickUsage(t.key)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                {usageTiers.map((t) => (
                                    <div
                                        key={`${t.key}-d`}
                                        style={{
                                            flex: 1,
                                            textAlign: "center",
                                            ...baseTextStyle,
                                            color: secondaryText,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {t.desc}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ADD-ONS */}
                        {addons.length > 0 && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                <div style={labelBaseStyle}>ADD-ONS</div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    {addons.map((a) => (
                                        <CheckboxRow
                                            key={a.id}
                                            active={!!activeAddons[a.id]}
                                            name={a.name}
                                            price={a.price}
                                            onClick={() => onToggleAddon(a.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ANNUAL TOGGLE */}
                    {showAnnualToggle && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                paddingTop: 6,
                                borderTop: `1px solid ${rgbaFromHex("#ffffff", 0.08)}`,
                            }}
                        >
                            <div
                                style={{ ...baseTextStyle, color: primaryText }}
                            >
                                Annual billing
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <span
                                    style={{
                                        ...baseTextStyle,
                                        color: accentColor,
                                        opacity: annual ? 1 : 0,
                                        transform: annual
                                            ? "translateY(0px)"
                                            : "translateY(2px)",
                                        transition: interactiveTransition,
                                        whiteSpace: "nowrap",
                                    }}
                                    aria-hidden={!annual}
                                >
                                    Save{" "}
                                    {clamp(annualDiscountPercent || 0, 0, 80)}%
                                </span>
                                <Toggle on={annual} onClick={onToggleAnnual} />
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

addPropertyControls(PricingCalculatorGlass, {
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#06b6d4",
    },
    backgroundGradientStart: {
        type: ControlType.Color,
        title: "BG Start",
        defaultValue: "#0a0f1e",
    },
    backgroundGradientEnd: {
        type: ControlType.Color,
        title: "BG End",
        defaultValue: "#070b14",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 145,
        min: 0,
        max: 360,
        step: 1,
        unit: "deg",
    },
    cardBackgroundOpacity: {
        type: ControlType.Number,
        title: "Card BG Opacity %",
        defaultValue: 4,
        min: 1,
        max: 30,
        step: 1,
        unit: "%",
    },
    cardBorderOpacity: {
        type: ControlType.Number,
        title: "Card Border Opacity %",
        defaultValue: 7,
        min: 1,
        max: 50,
        step: 1,
        unit: "%",
    },
    outputCardBgOpacity: {
        type: ControlType.Number,
        title: "Output BG Opacity %",
        defaultValue: 8,
        min: 1,
        max: 30,
        step: 1,
        unit: "%",
    },
    outputCardBorderOpacity: {
        type: ControlType.Number,
        title: "Output Border Opacity %",
        defaultValue: 40,
        min: 1,
        max: 100,
        step: 1,
        unit: "%",
    },
    primaryTextColor: {
        type: ControlType.Color,
        title: "Primary Text",
        defaultValue: "#ffffff",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        defaultValue: "#555555",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: "#000000",
    },
    ctaBackgroundColor: {
        type: ControlType.Color,
        title: "CTA Background",
        defaultValue: "#06b6d4",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    buttonBorderRadius: {
        type: ControlType.Number,
        title: "Button Radius",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    componentPadding: {
        type: ControlType.Number,
        title: "Component Padding",
        defaultValue: 40,
        min: 16,
        max: 80,
        step: 1,
        unit: "px",
    },
    plan1Name: {
        type: ControlType.String,
        title: "Plan 1 Name",
        defaultValue: "Starter",
    },
    plan1BasePrice: {
        type: ControlType.Number,
        title: "Plan 1 Base",
        defaultValue: 29,
        min: 0,
        max: 100000,
        step: 1,
    },
    plan2Name: {
        type: ControlType.String,
        title: "Plan 2 Name",
        defaultValue: "Pro",
    },
    plan2BasePrice: {
        type: ControlType.Number,
        title: "Plan 2 Base",
        defaultValue: 79,
        min: 0,
        max: 100000,
        step: 1,
    },
    plan3Name: {
        type: ControlType.String,
        title: "Plan 3 Name",
        defaultValue: "Enterprise",
    },
    plan3BasePrice: {
        type: ControlType.Number,
        title: "Plan 3 Base",
        defaultValue: 149,
        min: 0,
        max: 100000,
        step: 1,
    },
    seatsIncluded: {
        type: ControlType.Number,
        title: "Seats Included",
        defaultValue: 5,
        min: 0,
        max: 1000,
        step: 1,
    },
    pricePerExtraSeat: {
        type: ControlType.Number,
        title: "Price / Extra Seat",
        defaultValue: 10,
        min: 0,
        max: 1000,
        step: 1,
    },
    maxSeatsOnSlider: {
        type: ControlType.Number,
        title: "Max Seats",
        defaultValue: 50,
        min: 1,
        max: 500,
        step: 1,
    },
    usageTier1Label: {
        type: ControlType.String,
        title: "Tier 1 Label",
        defaultValue: "Small",
    },
    usageTier1Description: {
        type: ControlType.String,
        title: "Tier 1 Desc",
        defaultValue: "10k req/mo",
    },
    usageTier1PriceMultiplier: {
        type: ControlType.Number,
        title: "Tier 1 Mult",
        defaultValue: 1.0,
        min: 0.5,
        max: 5,
        step: 0.05,
    },
    usageTier2Label: {
        type: ControlType.String,
        title: "Tier 2 Label",
        defaultValue: "Medium",
    },
    usageTier2Description: {
        type: ControlType.String,
        title: "Tier 2 Desc",
        defaultValue: "50k req/mo",
    },
    usageTier2PriceMultiplier: {
        type: ControlType.Number,
        title: "Tier 2 Mult",
        defaultValue: 1.4,
        min: 0.5,
        max: 5,
        step: 0.05,
    },
    usageTier3Label: {
        type: ControlType.String,
        title: "Tier 3 Label",
        defaultValue: "Large",
    },
    usageTier3Description: {
        type: ControlType.String,
        title: "Tier 3 Desc",
        defaultValue: "200k req/mo",
    },
    usageTier3PriceMultiplier: {
        type: ControlType.Number,
        title: "Tier 3 Mult",
        defaultValue: 2.0,
        min: 0.5,
        max: 5,
        step: 0.05,
    },
    addon1Name: {
        type: ControlType.String,
        title: "Add-on 1 Name",
        defaultValue: "Priority Support",
    },
    addon1Price: {
        type: ControlType.Number,
        title: "Add-on 1 Price",
        defaultValue: 15,
        min: 0,
        max: 100000,
        step: 1,
    },
    addon2Name: {
        type: ControlType.String,
        title: "Add-on 2 Name",
        defaultValue: "White Label",
    },
    addon2Price: {
        type: ControlType.Number,
        title: "Add-on 2 Price",
        defaultValue: 29,
        min: 0,
        max: 100000,
        step: 1,
    },
    addon3Name: {
        type: ControlType.String,
        title: "Add-on 3 Name",
        defaultValue: "Custom Domain",
    },
    addon3Price: {
        type: ControlType.Number,
        title: "Add-on 3 Price",
        defaultValue: 9,
        min: 0,
        max: 100000,
        step: 1,
    },
    addon4Name: {
        type: ControlType.String,
        title: "Add-on 4 Name",
        defaultValue: "",
    },
    addon4Price: {
        type: ControlType.Number,
        title: "Add-on 4 Price",
        defaultValue: 0,
        min: 0,
        max: 100000,
        step: 1,
    },
    annualDiscountPercent: {
        type: ControlType.Number,
        title: "Annual Discount %",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
        unit: "%",
    },
    showAnnualToggle: {
        type: ControlType.Boolean,
        title: "Show Annual Toggle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    currencySymbol: {
        type: ControlType.String,
        title: "Currency",
        defaultValue: "$",
    },
    ctaButtonText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: "Get started with {plan}",
    },
    monthlyLabel: {
        type: ControlType.String,
        title: "Monthly Label",
        defaultValue: "Monthly",
    },
    annualLabel: {
        type: ControlType.String,
        title: "Annual Label",
        defaultValue: "Annual",
    },
    ctaLink: { type: ControlType.Link, title: "CTA Link", defaultValue: "" },
    ctaOpenInNewTab: {
        type: ControlType.Boolean,
        title: "CTA New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    counterAnimationSpeedMs: {
        type: ControlType.Number,
        title: "Counter Speed",
        defaultValue: 450,
        min: 100,
        max: 1500,
        step: 10,
        unit: "ms",
    },
    baseFont: {
        type: ControlType.Font,
        title: "Base Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "0.18em",
            lineHeight: "1.2em",
        },
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "66px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
