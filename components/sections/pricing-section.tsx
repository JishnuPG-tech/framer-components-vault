// User instructions: Create a Framer component called "Pricing Table" with a centered single pricing card (380px wide, responsive), monthly/yearly toggle with badge and animated price, editable plan header, price display, feature list with checkmarks, and full-width CTA button with hover and link. All specified props editable in Framer panel. Zero dependencies.

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

import { AnimatePresence, motion, useInView } from "framer-motion"

type BillingCycle = "Monthly" | "Yearly"

interface PricingTableProps {
    planName: string
    description: string
    monthlyPrice: number
    yearlyPrice: number
    features: string[]
    ctaLabel: string
    ctaLink: string
    defaultToggle: BillingCycle
    highlightColor: string

    planFont: any
    descriptionFont: any
    priceFont: any
    metaFont: any
    featureFont: any
    buttonFont: any

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function parseHex(color: string): { r: number; g: number; b: number } | null {
    if (!color) return null
    const c = color.trim()
    const hex = c.startsWith("#") ? c.slice(1) : c
    if (![3, 6].includes(hex.length)) return null
    const full = hex.length === 3 ? hex.split("").map((x) => x + x).join("") : hex
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    if ([r, g, b].some((v) => Number.isNaN(v))) return null
    return { r, g, b }
}

function toHex({ r, g, b }: { r: number; g: number; b: number }) {
    const h = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")
    return `#${h(r)}${h(g)}${h(b)}`
}

function lightenHex(hex: string, amount01: number) {
    const rgb = parseHex(hex)
    if (!rgb) return hex
    const a = clamp(amount01, 0, 1)
    return toHex({
        r: rgb.r + (255 - rgb.r) * a,
        g: rgb.g + (255 - rgb.g) * a,
        b: rgb.b + (255 - rgb.b) * a,
    })
}

/**
 * Pricing Table
 *
 * @framerIntrinsicWidth 380
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PricingTable(props: PricingTableProps) {
    const {
        planName,
        description,
        monthlyPrice,
        yearlyPrice,
        features,
        ctaLabel,
        ctaLink,
        defaultToggle,
        highlightColor,
        planFont,
        descriptionFont,
        priceFont,
        metaFont,
        featureFont,
        buttonFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { margin: "-10% 0px -10% 0px", amount: 0.2 })

    const [billing, setBilling] = React.useState<BillingCycle>(defaultToggle)

    React.useEffect(() => {
        React.startTransition(() => setBilling(defaultToggle))
    }, [defaultToggle])

    const isYearly = billing === "Yearly"
    const displayedPrice = isYearly ? yearlyPrice : monthlyPrice

    const yearlyBilledTotal = React.useMemo(() => {
        const total = yearlyPrice * 12
        // presentable number: integers if near-int, else 2 decimals
        const rounded = Math.round(total)
        const asString = Math.abs(total - rounded) < 0.005 ? String(rounded) : total.toFixed(2)
        return asString
    }, [yearlyPrice])

    const priceKey = `${billing}-${displayedPrice}`

    const cardMaxWidth = 380
    const hoverButtonColor = React.useMemo(() => lightenHex(highlightColor, 0.08), [highlightColor])

    const fixedW = style?.width === "100%"
    const fixedH = style?.height === "100%"

    const rootStyle: React.CSSProperties = {
        ...style,
        position: "relative",
        width: fixedW ? "100%" : cardMaxWidth,
        maxWidth: "100%",
        height: fixedH ? "100%" : "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        boxSizing: "border-box",
    }

    const cardStyle: React.CSSProperties = {
        width: "100%",
        maxWidth: cardMaxWidth,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        padding: 24,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 18,
    }

    const toggleWrapStyle: React.CSSProperties = {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }

    const toggleStyle: React.CSSProperties = {
        background: "#F3F4F6",
        borderRadius: 999,
        padding: 4,
        display: "flex",
        alignItems: "center",
        gap: 4,
        boxSizing: "border-box",
    }

    const optionBase: React.CSSProperties = {
        position: "relative",
        border: "none",
        background: "transparent",
        padding: "8px 12px",
        borderRadius: 999,
        cursor: "pointer",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#111827",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
    }

    const activePill: React.CSSProperties = {
        background: "#FFFFFF",
        boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
    }

    const dividerStyle: React.CSSProperties = {
        width: "100%",
        height: 1,
        background: "#F3F4F6",
    }

    const onToggle = React.useCallback(
        (next: BillingCycle) => {
            React.startTransition(() => setBilling(next))
        },
        [setBilling]
    )

    const shouldAnimate = !isStatic && inView

    return (
        <div ref={containerRef} style={rootStyle}>
            <section style={cardStyle} aria-label="Pricing card">
                <div style={toggleWrapStyle}>
                    <div style={toggleStyle} role="tablist" aria-label="Billing cycle">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={billing === "Monthly"}
                            onClick={() => onToggle("Monthly")}
                            style={{ ...optionBase, ...(billing === "Monthly" ? activePill : undefined) }}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={billing === "Yearly"}
                            onClick={() => onToggle("Yearly")}
                            style={{ ...optionBase, ...(billing === "Yearly" ? activePill : undefined) }}
                        >
                            <span>Yearly</span>
                            {billing === "Yearly" && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#16A34A",
                                        lineHeight: 1,
                                        padding: "4px 6px",
                                        borderRadius: 999,
                                        background: "rgba(22, 163, 74, 0.10)",
                                    }}
                                >
                                    Save 20%
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div
                        style={{
                            ...planFont,
                            color: highlightColor,
                            margin: 0,
                            lineHeight: 1.1,
                        }}
                    >
                        {planName}
                    </div>
                    <div
                        style={{
                            ...descriptionFont,
                            color: "#6B7280",
                            margin: 0,
                            lineHeight: 1.3,
                        }}
                    >
                        {description}
                    </div>
                </header>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }} aria-label="Price">
                        <div
                            style={{
                                ...metaFont,
                                fontSize: 24,
                                fontWeight: 700,
                                color: highlightColor,
                                lineHeight: 1,
                                transform: "translateY(-6px)",
                                minWidth: "max-content",
                            }}
                        >
                            $
                        </div>
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "baseline",
                                gap: 8,
                                minWidth: "max-content",
                            }}
                        >
                            {shouldAnimate ? (
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={priceKey}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.22, ease: "easeOut" }}
                                        style={{
                                            ...priceFont,
                                            color: highlightColor,
                                            lineHeight: 1,
                                            display: "inline-block",
                                            minWidth: "max-content",
                                        }}
                                    >
                                        {displayedPrice}
                                    </motion.span>
                                </AnimatePresence>
                            ) : (
                                <span
                                    style={{
                                        ...priceFont,
                                        color: highlightColor,
                                        lineHeight: 1,
                                        display: "inline-block",
                                        minWidth: "max-content",
                                    }}
                                >
                                    {displayedPrice}
                                </span>
                            )}

                            <div
                                style={{
                                    ...metaFont,
                                    color: "#9CA3AF",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                    minWidth: "max-content",
                                }}
                            >
                                {isYearly ? "/month" : "/month"}
                            </div>
                        </div>
                    </div>

                    {isYearly ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <div
                                style={{
                                    ...metaFont,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#9CA3AF",
                                    lineHeight: 1.2,
                                }}
                            >
                                billed yearly
                            </div>
                            <div
                                style={{
                                    ...metaFont,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#9CA3AF",
                                    lineHeight: 1.2,
                                }}
                            >
                                billed ${yearlyBilledTotal}/year
                            </div>
                        </div>
                    ) : null}
                </div>

                <div style={dividerStyle} />

                <ul
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                    aria-label="Features"
                >
                    {(features || []).filter(Boolean).slice(0, 8).map((item, idx) => (
                        <li key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span
                                aria-hidden="true"
                                style={{
                                    color: "#16A34A",
                                    fontWeight: 800,
                                    lineHeight: 1.2,
                                    transform: "translateY(1px)",
                                    minWidth: "max-content",
                                }}
                            >
                                ✓
                            </span>
                            <span
                                style={{
                                    ...featureFont,
                                    color: "#374151",
                                    lineHeight: 1.35,
                                    flex: 1,
                                }}
                            >
                                {item}
                            </span>
                        </li>
                    ))}
                </ul>

                <motion.a
                    href={ctaLink}
                    target={ctaLink && ctaLink.startsWith("http") ? "_blank" : undefined}
                    rel={ctaLink && ctaLink.startsWith("http") ? "noreferrer" : undefined}
                    role="button"
                    aria-label={ctaLabel}
                    style={{
                        display: "flex",
                        width: "100%",
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        background: highlightColor,
                        color: "#FFFFFF",
                        borderRadius: 10,
                        transition: "background-color 200ms ease",
                        boxSizing: "border-box",
                        ...buttonFont,
                    }}
                    whileHover={isStatic ? undefined : { backgroundColor: hoverButtonColor }}
                    whileTap={isStatic ? undefined : { scale: 0.99 }}
                >
                    <span style={{ minWidth: "max-content" }}>{ctaLabel}</span>
                </motion.a>
            </section>
        </div>
    )
}

addPropertyControls(PricingTable, {
    planName: {
        type: ControlType.String,
        title: "Plan Name",
        defaultValue: "Pro",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Perfect for growing teams",
    },
    monthlyPrice: {
        type: ControlType.Number,
        title: "Monthly Price",
        defaultValue: 29,
        min: 0,
        max: 9999,
        step: 1,
    },
    yearlyPrice: {
        type: ControlType.Number,
        title: "Yearly Price",
        defaultValue: 23,
        min: 0,
        max: 9999,
        step: 1,
    },
    features: {
        type: ControlType.Array,
        title: "Features",
        control: {
            type: ControlType.String,
            defaultValue: "Feature",
        },
        maxCount: 8,
        defaultValue: [
            "Unlimited projects",
            "Team collaboration",
            "Advanced analytics",
            "Priority support",
            "Custom integrations",
            "SSO & security",
        ],
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Get Started",
    },
    ctaLink: {
        type: ControlType.Link,
        title: "CTA Link",
        defaultValue: "https://example.com",
    },
    defaultToggle: {
        type: ControlType.Enum,
        title: "Default",
        options: ["Monthly", "Yearly"],
        optionTitles: ["Monthly", "Yearly"],
        defaultValue: "Monthly",
        displaySegmentedControl: true,
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: "#111827",
    },
    planFont: {
        type: ControlType.Font,
        title: "Plan Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    featureFont: {
        type: ControlType.Font,
        title: "Feature Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
