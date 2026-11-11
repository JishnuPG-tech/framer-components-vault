/**
 * Vraxis Scale — Premium Adaptive Pricing Engine
 * Framer Code Component · v3.6 [Canvas Fixed & Secure]
 */

// ─── Imports ─────────────────────────────────────────────────────────────────

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanData {
    name: string
    price: number | null
    cap: string
    features: string[]
    ctaText: string
    ctaUrl: string
}

interface VraxisScaleProps {
    eyebrow: string
    title: string
    subtitle: string
    accentColor: string
    backgroundColor: string
    surfaceColor: string
    borderColor: string
    textColor: string
    currencySymbol: string
    yearlyDiscount: number
    showYearlyToggle: boolean
    showRoi: boolean
    starterName: string
    starterPrice: number
    starterCap: string
    starterFeatures: string
    starterCtaText: string
    starterCtaUrl: string
    proName: string
    proPrice: number
    proCap: string
    proFeatures: string
    proCtaText: string
    proCtaUrl: string
    scaleName: string
    scalePrice: number
    scaleCap: string
    scaleFeatures: string
    scaleCtaText: string
    scaleCtaUrl: string
    enterpriseName: string
    enterpriseCap: string
    enterpriseFeatures: string
    enterpriseCtaText: string
    enterpriseCtaUrl: string
    enterpriseBarTitle: string
    enterpriseBarCopy: string
    enterpriseBarCtaText: string
    enterpriseBarCtaUrl: string
}

// ─── Static Constants ─────────────────────────────────────────────────────────

const SNAP_LABELS = ["10", "50", "100", "500", "5k", "Ent."]
const SNAP_DISPLAY = [
    "10 users",
    "50 users",
    "100 users",
    "500 users",
    "5,000 users",
    "Enterprise",
]
const SNAP_USERS: (number | null)[] = [10, 50, 100, 500, 5000, null]
const REC_MAP: Record<number, number> = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 }
const STEPS = 5

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseFeatures(csv: string): string[] {
    return csv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
}

// ─── useAnimatedNumber Hook ──────────────────────────────────────────────────

function useAnimatedNumber(
    target: number | null,
    durationMs = 420
): number | null {
    const [val, setVal] = useState<number | null>(target)
    const fromRef = useRef<number>(target ?? 0)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }

        if (target === null) {
            setVal(null)
            fromRef.current = 0
            return
        }

        const from = fromRef.current
        const to = target

        if (from === to) {
            setVal(to)
            return
        }

        let start: number | null = null

        const tick = (now: number) => {
            if (start === null) start = now
            const t = Math.min((now - start) / durationMs, 1)
            const ease = 1 - Math.pow(1 - t, 3) // cubic ease-out
            setVal(from + (to - from) * ease)
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick)
            } else {
                fromRef.current = to
                rafRef.current = null
            }
        }

        rafRef.current = requestAnimationFrame(tick)

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            fromRef.current = to
        }
    }, [target, durationMs])

    return val
}

// ─── Reduced Motion Hook ──────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduced(mq.matches)
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])
    return reduced
}

// ─── useContainerWidth Hook ───────────────────────────────────────────────────

function useContainerWidth(ref: React.RefObject<HTMLElement>): number {
    const [width, setWidth] = useState(0)
    useEffect(() => {
        if (!ref.current) return
        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) setWidth(entry.contentRect.width)
        })
        ro.observe(ref.current)
        setWidth(ref.current.getBoundingClientRect().width)
        return () => ro.disconnect()
    }, [ref])
    return width
}

// ─── PremiumSlider Component ──────────────────────────────────────────────────

interface SliderProps {
    snapIndex: number
    onChange: (i: number) => void
    isEnterprise: boolean
    accentColor: string
    textColor: string
}

function PremiumSlider({
    snapIndex,
    onChange,
    isEnterprise,
    accentColor,
    textColor,
}: SliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)
    const reduced = usePrefersReducedMotion()

    const pct = (snapIndex / STEPS) * 100

    const springPct = useSpring(pct, {
        stiffness: reduced ? 9000 : 420,
        damping: reduced ? 100 : 38,
        mass: 0.7,
    })

    useEffect(() => {
        springPct.set(pct)
    }, [pct, springPct])

    const springPctString = useTransform(springPct, (value) => `${value}%`)

    const trackingFillColor = accentColor
    const handleBgColor = isEnterprise ? accentColor : textColor

    const getIndexFromClientX = useCallback((clientX: number): number => {
        if (!trackRef.current) return 0
        const rect = trackRef.current.getBoundingClientRect()
        const ratio = Math.max(
            0,
            Math.min(1, (clientX - rect.left) / rect.width)
        )
        return Math.round(ratio * STEPS)
    }, [])

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = true
        onChange(getIndexFromClientX(e.clientX))
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging.current) return
        onChange(getIndexFromClientX(e.clientX))
    }

    const onPointerUp = () => {
        dragging.current = false
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const map: Record<string, number> = {
            ArrowRight: 1,
            ArrowUp: 1,
            ArrowLeft: -1,
            ArrowDown: -1,
        }
        if (map[e.key] !== undefined) {
            e.preventDefault()
            onChange(Math.max(0, Math.min(STEPS, snapIndex + map[e.key])))
        }
        if (e.key === "Home") {
            e.preventDefault()
            onChange(0)
        }
        if (e.key === "End") {
            e.preventDefault()
            onChange(STEPS)
        }
    }

    return (
        <div style={{ paddingTop: 7, width: "100%" }}>
            <div
                ref={trackRef}
                role="slider"
                data-vrx-slider=""
                aria-valuemin={0}
                aria-valuemax={STEPS}
                aria-valuenow={snapIndex}
                aria-valuetext={SNAP_DISPLAY[snapIndex]}
                aria-label="Team scaling framework"
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                style={{
                    position: "relative",
                    height: 24,
                    cursor: "pointer",
                    userSelect: "none",
                    touchAction: "none",
                    outline: "none",
                    width: "100%",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        right: 0,
                        height: 3,
                        background: "rgba(128,128,128,0.15)",
                        borderRadius: 1.5,
                        transform: "translateY(-50%)",
                    }}
                >
                    <motion.div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            background: trackingFillColor,
                            borderRadius: 1.5,
                            width: springPctString,
                        }}
                    />
                </div>

                <motion.div
                    style={{
                        position: "absolute",
                        top: "50%",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: handleBgColor,
                        border: "2px solid #000000",
                        transform: "translateY(-50%)",
                        marginLeft: -9,
                        pointerEvents: "none",
                        zIndex: 2,
                        boxShadow: isEnterprise
                            ? `0 0 12px ${accentColor}`
                            : "none",
                        left: springPctString,
                    }}
                />

                <style
                    dangerouslySetInnerHTML={{
                        __html: `
          [data-vrx-slider]:focus-visible {
            outline: 2px solid ${accentColor} !important;
            outline-offset: 4px;
          }
        `,
                    }}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 10,
                    width: "100%",
                }}
            >
                {SNAP_LABELS.map((label, i) => (
                    <button
                        key={i}
                        onClick={() => onChange(i)}
                        aria-label={`Set scale to ${SNAP_DISPLAY[i]}`}
                        aria-pressed={i === snapIndex}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: 10,
                            fontWeight: 500,
                            textTransform: "uppercase",
                            color:
                                i === snapIndex
                                    ? accentColor
                                    : "rgba(128,128,128,0.5)",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "color 0.2s ease",
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── BillingToggle Component ──────────────────────────────────────────────────

interface BillingToggleProps {
    yearly: boolean
    onToggle: () => void
    discount: number
    accentColor: string
    textColor: string
    reduced: boolean
}

function BillingToggle({
    yearly,
    onToggle,
    discount,
    accentColor,
    textColor,
    reduced,
}: BillingToggleProps) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginBottom: 32,
            }}
        >
            <button
                type="button"
                onClick={yearly ? onToggle : undefined}
                style={{
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    color: !yearly ? textColor : "rgba(128,128,128,0.4)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                }}
            >
                Monthly
            </button>

            <div
                role="switch"
                aria-checked={yearly}
                aria-label="Billing frequency selection switch"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                        e.preventDefault()
                        onToggle()
                    }
                }}
                style={{
                    width: 40,
                    height: 22,
                    background: "rgba(128,128,128,0.1)",
                    border: `1px solid ${yearly ? accentColor : "rgba(128,128,128,0.2)"}`,
                    borderRadius: 11,
                    cursor: "pointer",
                    position: "relative",
                    outline: "none",
                }}
            >
                <motion.div
                    animate={{
                        left: yearly ? 22 : 2,
                        background: yearly ? accentColor : textColor,
                    }}
                    transition={
                        reduced
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 500, damping: 40 }
                    }
                    style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        position: "absolute",
                        top: 3,
                    }}
                />
            </div>

            <button
                type="button"
                onClick={!yearly ? onToggle : undefined}
                style={{
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    color: yearly ? textColor : "rgba(128,128,128,0.4)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                }}
            >
                Yearly
            </button>

            <AnimatePresence>
                {yearly && (
                    <motion.div
                        initial={
                            reduced
                                ? { opacity: 1 }
                                : { opacity: 0, scale: 0.9 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        exit={
                            reduced
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 0.9 }
                        }
                        style={{
                            fontSize: 11,
                            background: `${accentColor}15`,
                            color: accentColor,
                            border: `1px solid ${accentColor}30`,
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontWeight: 500,
                        }}
                    >
                        Save {Math.round(discount * 100)}%
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── AnimatedPrice Component ──────────────────────────────────────────────────

interface AnimatedPriceProps {
    basePrice: number | null
    yearly: boolean
    discount: number
    currencySymbol: string
    isEnterprisePlan: boolean
    accentColor: string
    textColor: string
}

function AnimatedPrice({
    basePrice,
    yearly,
    discount,
    currencySymbol,
    isEnterprisePlan,
    accentColor,
    textColor,
}: AnimatedPriceProps) {
    const target =
        basePrice === null
            ? null
            : yearly
              ? Math.round(basePrice * (1 - discount))
              : basePrice
    const animated = useAnimatedNumber(target)

    const priceStyle: React.CSSProperties = {
        fontSize: isEnterprisePlan ? 22 : 28,
        fontWeight: 500,
        color: isEnterprisePlan ? accentColor : textColor,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
        lineHeight: 1,
    }

    if (basePrice === null || animated === null) {
        return <div style={priceStyle}>Custom</div>
    }

    return (
        <div style={priceStyle}>
            {currencySymbol}
            {Math.round(animated).toLocaleString()}
        </div>
    )
}

// ─── RoiCell Component ────────────────────────────────────────────────────────

interface RoiCellProps {
    label: string
    value: number | null
    format: (v: number) => string
    isPositive: boolean
    isCustom: boolean
    isDash: boolean
    accentColor: string
    surfaceColor: string
    borderColor: string
    textColor: string
}

function RoiCell({
    label,
    value,
    format,
    isPositive,
    isCustom,
    isDash,
    accentColor,
    surfaceColor,
    borderColor,
    textColor,
}: RoiCellProps) {
    const animated = useAnimatedNumber(value)

    let displayNode: React.ReactNode
    if (isCustom) {
        displayNode = (
            <span style={{ color: accentColor, fontWeight: 500 }}>Contact</span>
        )
    } else if (isDash || animated === null) {
        displayNode = <span style={{ opacity: 0.25 }}>—</span>
    } else {
        displayNode = (
            <span style={{ color: isPositive ? "#10b981" : textColor }}>
                {format(animated)}
            </span>
        )
    }

    return (
        <div
            style={{
                background: surfaceColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                padding: "14px 16px",
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    color: "rgba(128,128,128,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 18,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {displayNode}
            </div>
        </div>
    )
}

// ─── PlanCard Component ────────────────────────────────────────────────────────

interface PlanCardProps {
    plan: PlanData
    isRecommended: boolean
    isEnterprisePlan: boolean
    isEnterpriseMode: boolean
    yearly: boolean
    currencySymbol: string
    discount: number
    accentColor: string
    surfaceColor: string
    borderColor: string
    textColor: string
    reduced: boolean
}

function PlanCard({
    plan,
    isRecommended,
    isEnterprisePlan,
    isEnterpriseMode,
    yearly,
    currencySymbol,
    discount,
    accentColor,
    surfaceColor,
    borderColor,
    textColor,
    reduced,
}: PlanCardProps) {
    const isHighlighted = isEnterpriseMode ? isEnterprisePlan : isRecommended
    const recede = isEnterpriseMode && !isEnterprisePlan

    const activeBorder = isHighlighted ? accentColor : borderColor
    const activeBackground = isHighlighted ? `${accentColor}05` : surfaceColor

    return (
        <motion.div
            whileHover={
                recede ? undefined : { y: -4, borderColor: accentColor }
            }
            animate={{
                opacity: recede ? 0.4 : 1,
                scale: isEnterprisePlan && isEnterpriseMode ? 1.02 : 1,
            }}
            transition={
                reduced ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }
            }
            style={{
                background: activeBackground,
                border: `1px solid ${activeBorder}`,
                borderRadius: 12,
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
            }}
        >
            <div style={{ minHeight: 24, marginBottom: 8 }}>
                {isHighlighted && (
                    <div
                        style={{
                            fontSize: 9,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: accentColor,
                            background: `${accentColor}10`,
                            padding: "2px 8px",
                            borderRadius: 4,
                            display: "inline-block",
                            fontWeight: 600,
                        }}
                    >
                        {isEnterprisePlan
                            ? "Optimal Match"
                            : "Recommended Choice"}
                    </div>
                )}
            </div>

            <div
                style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "rgba(128,128,128,0.7)",
                    marginBottom: 12,
                }}
            >
                {plan.name}
            </div>

            <AnimatedPrice
                basePrice={plan.price}
                yearly={yearly}
                discount={discount}
                currencySymbol={currencySymbol}
                isEnterprisePlan={isEnterprisePlan}
                accentColor={accentColor}
                textColor={textColor}
            />

            <div
                style={{
                    fontSize: 11,
                    color: "rgba(128,128,128,0.5)",
                    marginTop: 6,
                    marginBottom: 16,
                }}
            >
                {plan.price === null
                    ? plan.cap
                    : yearly
                      ? `/mo, billed annually (${plan.cap})`
                      : `/mo (${plan.cap})`}
            </div>

            <div
                style={{ height: 1, background: borderColor, marginBottom: 16 }}
            />

            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 24px 0",
                    flex: 1,
                }}
            >
                {plan.features.map((feat, idx) => (
                    <li
                        key={idx}
                        style={{
                            fontSize: 13,
                            color: textColor,
                            padding: "4px 0",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <span
                            style={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                backgroundColor: accentColor,
                                flexShrink: 0,
                            }}
                        />
                        {feat}
                    </li>
                ))}
            </ul>

            <a
                href={plan.ctaUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    textAlign: "center",
                    textDecoration: "none",
                    borderRadius: 6,
                    background: isHighlighted ? accentColor : "transparent",
                    border: `1px solid ${isHighlighted ? accentColor : borderColor}`,
                    color: isHighlighted ? "#ffffff" : textColor,
                    transition: "opacity 0.2s",
                }}
            >
                {plan.ctaText}
            </a>
        </motion.div>
    )
}

// ─── Main Structural Dashboard Component ──────────────────────────────────────

export default function VraxisScale(props: VraxisScaleProps) {
    const {
        eyebrow,
        title,
        subtitle,
        accentColor,
        backgroundColor,
        surfaceColor,
        borderColor,
        textColor,
        currencySymbol,
        yearlyDiscount,
        showYearlyToggle,
        showRoi,
        starterName,
        starterPrice,
        starterCap,
        starterFeatures,
        starterCtaText,
        starterCtaUrl,
        proName,
        proPrice,
        proCap,
        proFeatures,
        proCtaText,
        proCtaUrl,
        scaleName,
        scalePrice,
        scaleCap,
        scaleFeatures,
        scaleCtaText,
        scaleCtaUrl,
        enterpriseName,
        enterpriseCap,
        enterpriseFeatures,
        enterpriseCtaText,
        enterpriseCtaUrl,
        enterpriseBarTitle,
        enterpriseBarCopy,
        enterpriseBarCtaText,
        enterpriseBarCtaUrl,
    } = props

    const [snapIndex, setSnapIndex] = useState(0)
    const [yearly, setYearly] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const width = useContainerWidth(
        containerRef as React.RefObject<HTMLElement>
    )
    const reduced = usePrefersReducedMotion()

    useEffect(() => {
        if (typeof document === "undefined") return
        if (!document.getElementById("vraxis-scale-plex-mono")) {
            const linkTag = document.createElement("link")
            linkTag.id = "vraxis-scale-plex-mono"
            linkTag.rel = "stylesheet"
            linkTag.href =
                "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"
            document.head.appendChild(linkTag)
        }
    }, [])

    const isEnterprise = snapIndex === STEPS
    const recPlanIndex = REC_MAP[snapIndex] ?? 0

    const plans: PlanData[] = useMemo(
        () => [
            {
                name: starterName,
                price: starterPrice,
                cap: starterCap,
                features: parseFeatures(starterFeatures),
                ctaText: starterCtaText,
                ctaUrl: starterCtaUrl,
            },
            {
                name: proName,
                price: proPrice,
                cap: proCap,
                features: parseFeatures(proFeatures),
                ctaText: proCtaText,
                ctaUrl: proCtaUrl,
            },
            {
                name: scaleName,
                price: scalePrice,
                cap: scaleCap,
                features: parseFeatures(scaleFeatures),
                ctaText: scaleCtaText,
                ctaUrl: scaleCtaUrl,
            },
            {
                name: enterpriseName,
                price: null,
                cap: enterpriseCap,
                features: parseFeatures(enterpriseFeatures),
                ctaText: isEnterprise ? "Schedule Call" : enterpriseCtaText,
                ctaUrl: enterpriseCtaUrl,
            },
        ],
        [
            starterName,
            starterPrice,
            starterCap,
            starterFeatures,
            starterCtaText,
            starterCtaUrl,
            proName,
            proPrice,
            proCap,
            proFeatures,
            proCtaText,
            proCtaUrl,
            scaleName,
            scalePrice,
            scaleCap,
            scaleFeatures,
            scaleCtaText,
            scaleCtaUrl,
            enterpriseName,
            enterpriseCap,
            enterpriseFeatures,
            enterpriseCtaText,
            enterpriseCtaUrl,
            isEnterprise,
        ]
    )

    const recPlan = plans[recPlanIndex]
    const recBase = recPlan.price ?? null
    const recMo =
        recBase !== null
            ? yearly
                ? Math.round(recBase * (1 - yearlyDiscount))
                : recBase
            : null
    const scaleUsers = SNAP_USERS[snapIndex]

    const roiAnnual = isEnterprise || recMo === null ? null : recMo * 12
    const roiPerUser =
        isEnterprise || recMo === null || scaleUsers === null
            ? null
            : recMo / scaleUsers
    const roiSaving =
        isEnterprise || recBase === null || !yearly
            ? null
            : Math.round(recBase * yearlyDiscount * 12)

    // Pure mathematical viewport scaling breaks column containers apart into multi-parallel arrays instantly
    const isMobile = width < 540
    const isNarrow = width < 800

    const gridCols = isMobile
        ? "1fr"
        : isNarrow
          ? "1fr 1fr"
          : "repeat(4, minmax(0, 1fr))"

    // Hardened parent structural metrics to enforce full horizontal width compliance across any parent framer frame
    const baseContainerStyle: React.CSSProperties = {
        background: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        padding: isMobile ? "24px 16px" : "40px",
        fontFamily: '"IBM Plex Mono", monospace',
        color: textColor,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
    }

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label="Vraxis Scale dynamic configuration portal"
            style={baseContainerStyle}
        >
            {/* Header Panel */}
            <div
                style={{ textAlign: "center", marginBottom: 36, width: "100%" }}
            >
                {eyebrow && (
                    <span
                        style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: accentColor,
                            fontWeight: 600,
                        }}
                    >
                        {eyebrow}
                    </span>
                )}
                <h2
                    style={{
                        fontSize: 24,
                        fontWeight: 500,
                        marginTop: 6,
                        marginBottom: 8,
                        letterSpacing: "-0.01em",
                    }}
                >
                    {title}
                </h2>
                <p
                    style={{
                        fontSize: 13,
                        color: "rgba(128,128,128,0.6)",
                        margin: 0,
                    }}
                >
                    {subtitle}
                </p>
            </div>

            {/* Interactive Selectors Row */}
            {showYearlyToggle && (
                <BillingToggle
                    yearly={yearly}
                    onToggle={() => setYearly(!yearly)}
                    discount={yearlyDiscount}
                    accentColor={accentColor}
                    textColor={textColor}
                    reduced={reduced}
                />
            )}

            <div style={{ marginBottom: 40, width: "100%" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                        width: "100%",
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "rgba(128,128,128,0.6)",
                        }}
                    >
                        Team Size
                    </span>
                    <span
                        style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: isEnterprise ? accentColor : textColor,
                        }}
                    >
                        {SNAP_DISPLAY[snapIndex]}
                    </span>
                </div>
                <PremiumSlider
                    snapIndex={snapIndex}
                    onChange={setSnapIndex}
                    isEnterprise={isEnterprise}
                    accentColor={accentColor}
                    textColor={textColor}
                />
            </div>

            {/* Main Structural Matrix Grid Cards */}
            <motion.div
                layout={!reduced}
                style={{
                    display: "grid",
                    gridTemplateColumns: gridCols,
                    gap: 12,
                    marginBottom: 24,
                    alignItems: "stretch",
                    width: "100%",
                }}
            >
                {plans.map((plan, idx) => (
                    <PlanCard
                        key={idx}
                        plan={plan}
                        isRecommended={idx === recPlanIndex}
                        isEnterprisePlan={idx === 3}
                        isEnterpriseMode={isEnterprise}
                        yearly={yearly}
                        currencySymbol={currencySymbol}
                        discount={yearlyDiscount}
                        accentColor={accentColor}
                        surfaceColor={surfaceColor}
                        borderColor={borderColor}
                        textColor={textColor}
                        reduced={reduced}
                    />
                ))}
            </motion.div>

            {/* Balanced Enterprise Status Bar Area */}
            <AnimatePresence>
                {isEnterprise && (
                    <motion.div
                        initial={
                            reduced ? { opacity: 0 } : { opacity: 0, y: 8 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        style={{
                            background: surfaceColor,
                            border: `1px solid ${accentColor}40`,
                            borderRadius: 8,
                            padding: "16px 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 16,
                            marginBottom: 24,
                            flexDirection: isMobile ? "column" : "row",
                            textAlign: isMobile ? "center" : "left",
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    color: accentColor,
                                }}
                            >
                                {enterpriseBarTitle}
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: textColor,
                                    opacity: 0.7,
                                    lineHeight: 1.4,
                                }}
                            >
                                {enterpriseBarCopy}
                            </div>
                        </div>

                        {enterpriseBarCtaUrl && (
                            <a
                                href={enterpriseBarCtaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    padding: "8px 16px",
                                    background: accentColor,
                                    color: "#ffffff",
                                    borderRadius: 6,
                                    textDecoration: "none",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {enterpriseBarCtaText}
                            </a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dynamic Continuous Evaluation ROI Segment */}
            {showRoi && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                            ? "1fr"
                            : "repeat(3, minmax(0, 1fr))",
                        gap: 12,
                        width: "100%",
                    }}
                >
                    <RoiCell
                        label="Annual cost"
                        value={roiAnnual}
                        format={(v) =>
                            `${currencySymbol}${Math.round(v).toLocaleString()}`
                        }
                        isPositive={false}
                        isCustom={isEnterprise}
                        isDash={roiAnnual === null && !isEnterprise}
                        accentColor={accentColor}
                        surfaceColor={surfaceColor}
                        borderColor={borderColor}
                        textColor={textColor}
                    />
                    <RoiCell
                        label="Per user / mo"
                        value={roiPerUser}
                        format={(v) => `${currencySymbol}${v.toFixed(2)}`}
                        isPositive={false}
                        isCustom={false}
                        isDash={roiPerUser === null}
                        accentColor={accentColor}
                        surfaceColor={surfaceColor}
                        borderColor={borderColor}
                        textColor={textColor}
                    />
                    <RoiCell
                        label="Yearly saving"
                        value={roiSaving}
                        format={(v) =>
                            `${currencySymbol}${Math.round(v).toLocaleString()}`
                        }
                        isPositive={true}
                        isCustom={false}
                        isDash={roiSaving === null}
                        accentColor={accentColor}
                        surfaceColor={surfaceColor}
                        borderColor={borderColor}
                        textColor={textColor}
                    />
                </div>
            )}
        </div>
    )
}

// ─── Framer Property Canvas Controls Map ──────────────────────────────────────

VraxisScale.defaultProps = {
    eyebrow: "Pricing infrastructure",
    title: "Built for teams that mean business",
    subtitle: "Configure your scale. Get a recommendation.",
    accentColor: "#4f46e5",
    backgroundColor: "#080808",
    surfaceColor: "#0b0b0b",
    borderColor: "#181818",
    textColor: "#f0f0f0",
    currencySymbol: "$",
    yearlyDiscount: 0.2,
    showYearlyToggle: true,
    showRoi: true,
    starterName: "Starter",
    starterPrice: 29,
    starterCap: "up to 25 users",
    starterFeatures:
        "Core analytics, Email support, 5 integrations, Basic onboarding",
    starterCtaText: "Get started",
    starterCtaUrl: "",
    proName: "Pro",
    proPrice: 79,
    proCap: "up to 100 users",
    proFeatures:
        "Advanced analytics, Priority support, Unlimited integrations, Team roles",
    proCtaText: "Get started",
    proCtaUrl: "",
    scaleName: "Scale",
    scalePrice: 199,
    scaleCap: "up to 1k users",
    scaleFeatures:
        "Custom analytics, Dedicated support, SSO / SAML, Audit logs",
    scaleCtaText: "Get started",
    scaleCtaUrl: "",
    enterpriseName: "Enterprise",
    enterpriseCap: "unlimited users",
    enterpriseFeatures:
        "Custom SLA, Dedicated infrastructure, SSO + SCIM, Compliance suite, Custom contracts",
    enterpriseCtaText: "Contact sales",
    enterpriseCtaUrl: "",
    enterpriseBarTitle: "Enterprise threshold reached",
    enterpriseBarCopy:
        "Custom SLAs · dedicated infrastructure · volume contracts",
    enterpriseBarCtaText: "Book a call →",
    enterpriseBarCtaUrl: "",
}

addPropertyControls(VraxisScale, {
    eyebrow: { type: ControlType.String, title: "Header • Eyebrow Text" },
    title: { type: ControlType.String, title: "Header • Main Heading" },
    subtitle: { type: ControlType.String, title: "Header • Subtitle Copy" },

    accentColor: { type: ControlType.Color, title: "Style • Theme Accent" },
    backgroundColor: {
        type: ControlType.Color,
        title: "Style • Main Canvas BG",
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Style • Component Surface",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Style • Structural Outlines",
    },
    textColor: { type: ControlType.Color, title: "Style • Primary Typography" },

    currencySymbol: {
        type: ControlType.String,
        title: "Pricing • Currency Token",
    },
    yearlyDiscount: {
        type: ControlType.Number,
        title: "Pricing • Annual Discount Multiplier",
        min: 0,
        max: 0.9,
        step: 0.01,
    },

    showYearlyToggle: {
        type: ControlType.Boolean,
        title: "Visibility • Frequency Toggler",
    },
    showRoi: {
        type: ControlType.Boolean,
        title: "Visibility • Dynamic ROI Panel",
    },

    starterName: { type: ControlType.String, title: "Tier 1 • Name String" },
    starterPrice: {
        type: ControlType.Number,
        title: "Tier 1 • Baseline Price /Mo",
    },
    starterCap: {
        type: ControlType.String,
        title: "Tier 1 • Scope Ceiling Capacity",
    },
    starterFeatures: {
        type: ControlType.String,
        title: "Tier 1 • Feature Manifest (CSV)",
    },
    starterCtaText: {
        type: ControlType.String,
        title: "Tier 1 • Action Link Label",
    },
    starterCtaUrl: {
        type: ControlType.String,
        title: "Tier 1 • Target Forward URL",
    },

    proName: { type: ControlType.String, title: "Tier 2 • Name String" },
    proPrice: {
        type: ControlType.Number,
        title: "Tier 2 • Baseline Price /Mo",
    },
    proCap: {
        type: ControlType.String,
        title: "Tier 2 • Scope Ceiling Capacity",
    },
    proFeatures: {
        type: ControlType.String,
        title: "Tier 2 • Feature Manifest (CSV)",
    },
    proCtaText: {
        type: ControlType.String,
        title: "Tier 2 • Action Link Label",
    },
    proCtaUrl: {
        type: ControlType.String,
        title: "Tier 2 • Target Forward URL",
    },

    scaleName: { type: ControlType.String, title: "Tier 3 • Name String" },
    scalePrice: {
        type: ControlType.Number,
        title: "Tier 3 • Baseline Price /Mo",
    },
    scaleCap: {
        type: ControlType.String,
        title: "Tier 3 • Scope Ceiling Capacity",
    },
    scaleFeatures: {
        type: ControlType.String,
        title: "Tier 3 • Feature Manifest (CSV)",
    },
    scaleCtaText: {
        type: ControlType.String,
        title: "Tier 3 • Action Link Label",
    },
    scaleCtaUrl: {
        type: ControlType.String,
        title: "Tier 3 • Target Forward URL",
    },

    enterpriseName: { type: ControlType.String, title: "Tier 4 • Name String" },
    enterpriseCap: {
        type: ControlType.String,
        title: "Tier 4 • Scope Ceiling Capacity",
    },
    enterpriseFeatures: {
        type: ControlType.String,
        title: "Tier 4 • Feature Manifest (CSV)",
    },
    enterpriseCtaText: {
        type: ControlType.String,
        title: "Tier 4 • Action Link Label",
    },
    enterpriseCtaUrl: {
        type: ControlType.String,
        title: "Tier 4 • Target Forward URL",
    },

    enterpriseBarTitle: {
        type: ControlType.String,
        title: "Alert • Enterprise Threshold Banner Header",
    },
    enterpriseBarCopy: {
        type: ControlType.String,
        title: "Alert • Contextual Specification Copy",
    },
    enterpriseBarCtaText: {
        type: ControlType.String,
        title: "Alert • Action Navigation Label",
    },
    enterpriseBarCtaUrl: {
        type: ControlType.String,
        title: "Alert • Forward Destination URL",
    },
})
