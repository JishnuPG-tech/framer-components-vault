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


/**
 * Pricing Matrix: plan comparison table with billing toggle, currency switcher and light/dark themes.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1080
 */

type CurrencyCode = "USD" | "EUR" | "GBP"
type Mode = "light" | "dark"
type Palette = {
    bg: string
    text: string
    muted: string
    line: string
    control: string
    controlActive: string
    tint: string
    off: string
}
type Tier = {
    name: string
    description: string
    priceUSD: number
    priceEUR: number
    priceGBP: number
    ctaLabel: string
    ctaLink: string
}
type Feature = { label: string; tier1: string; tier2: string; tier3: string }

const CURRENCIES: { code: CurrencyCode; symbol: string }[] = [
    { code: "USD", symbol: "$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
]

const THEMES: Record<Mode, Palette> = {
    light: {
        bg: "#FFFFFF",
        text: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        control: "#F1F5F9",
        controlActive: "#FFFFFF",
        tint: "#EFF6FF",
        off: "#CBD5E1",
    },
    dark: {
        bg: "#0D1117",
        text: "#F1F5F9",
        muted: "#8B95A7",
        line: "#1F2530",
        control: "#161B24",
        controlActive: "#2A3140",
        tint: "rgba(37, 99, 235, 0.16)",
        off: "#3A4352",
    },
}

const FALLBACK_STACK = `"Inter", "Inter Placeholder", ui-sans-serif, system-ui, -apple-system, sans-serif`
const SPACE = 12 // space between plan name, description, price and button
const BODY_BASE = 15 // design size the body scale is based on

function useSystemTheme(): Mode {
    const [mode, setMode] = React.useState<Mode>("light")
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const update = () => setMode(mq.matches ? "dark" : "light")
        update()
        if (mq.addEventListener) mq.addEventListener("change", update)
        else mq.addListener(update)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", update)
            else mq.removeListener(update)
        }
    }, [])
    return mode
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement>) {
    const [width, setWidth] = React.useState(1080)
    React.useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) setWidth(e.contentRect.width)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return width
}

function Check({ color, size }: { color: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" role="img" aria-label="Included">
            <path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function Dash({ color, size }: { color: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" role="img" aria-label="Not included">
            <path d="M6 10h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

const noWrap: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden" }

// Reads a Framer font control value safely
function readFont(font: any, fallbackWeight: number, fallbackSize: number) {
    const family = font && font.fontFamily ? `${font.fontFamily}, ${FALLBACK_STACK}` : FALLBACK_STACK
    const weight = font && font.fontWeight ? font.fontWeight : fallbackWeight
    const style = font && font.fontStyle ? font.fontStyle : "normal"
    const parsed = font && font.fontSize !== undefined ? parseFloat(String(font.fontSize)) : NaN
    const size = Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackSize
    return { family, weight, style, size }
}

export default function PricingMatrix(props: any) {
    const {
        theme,
        bgLight,
        bgDark,
        accent,
        accentHover,
        displayFont,
        priceSize,
        planNameSize,
        bodyFont,
        yearlyDiscount,
        roundPrices,
        showCurrencySwitcher,
        defaultCurrency,
        defaultBilling,
        featuredTier,
        badgeLabel,
        priceSuffix,
        yearlySuffix,
        featureColumnLabel,
        tiers,
        features,
        mobileBreakpoint,
        style,
    } = props

    const system = useSystemTheme()
    const mode: Mode = theme === "system" ? system : theme === "dark" ? "dark" : "light"
    const base: Palette = THEMES[mode]
    const c: Palette = {
        ...base,
        bg: (mode === "dark" ? bgDark : bgLight) || base.bg,
    }

    // ---- Typography ----
    const display = readFont(displayFont, 600, 44)
    const body = readFont(bodyFont, 400, BODY_BASE)
    const scale = body.size / BODY_BASE
    const s = (n: number) => Math.round(n * scale * 10) / 10

    const priceLine = Math.ceil(priceSize * 1.2)
    const nameLine = Math.max(Math.ceil(planNameSize * 1.4), Math.ceil(s(12) * 1.4 + 8))

    // Display text: plan names and prices
    const displayText = (size: number): React.CSSProperties => ({
        fontFamily: display.family,
        fontWeight: display.weight as any,
        fontStyle: display.style as any,
        fontSize: size,
    })
    // Regular body text: buyer's weight applies
    const bodyText = (size: number): React.CSSProperties => ({
        fontFamily: body.family,
        fontWeight: body.weight as any,
        fontStyle: body.style as any,
        fontSize: size,
    })
    // Emphasis body text: buttons, labels, badges keep their designed weight
    const strongText = (size: number, weight: number): React.CSSProperties => ({
        fontFamily: body.family,
        fontWeight: weight,
        fontStyle: body.style as any,
        fontSize: size,
    })

    const [billing, setBilling] = React.useState<"monthly" | "yearly">(defaultBilling)
    const [currency, setCurrency] = React.useState<CurrencyCode>(defaultCurrency)
    const [hoveredCta, setHoveredCta] = React.useState<number | null>(null)

    const rootRef = React.useRef<HTMLDivElement>(null)
    const width = useContainerWidth(rootRef)
    const isMobile = width < mobileBreakpoint

    const symbol = CURRENCIES.find((x) => x.code === currency)?.symbol ?? "$"
    const featuredIndex = featuredTier - 1
    const iconSize = Math.round(s(20))

    const formatPrice = (tier: Tier) => {
        const amount = currency === "EUR" ? tier.priceEUR : currency === "GBP" ? tier.priceGBP : tier.priceUSD
        let value = billing === "yearly" ? amount * (1 - yearlyDiscount / 100) : amount
        value = roundPrices ? Math.round(value) : Math.round(value * 100) / 100
        const text = Number.isInteger(value) ? String(value) : value.toFixed(2)
        return `${symbol}${text}`
    }

    const renderValue = (v: string) => {
        const val = (v ?? "").trim()
        if (val.toLowerCase() === "yes") return <Check color={accent} size={iconSize} />
        if (val === "" || val.toLowerCase() === "no") return <Dash color={c.off} size={iconSize} />
        return <span style={{ ...bodyText(s(15)), color: c.text }}>{val}</span>
    }

    const tierValue = (f: Feature, i: number) => (i === 0 ? f.tier1 : i === 1 ? f.tier2 : f.tier3)

    const pill = (active: boolean): React.CSSProperties => ({
        appearance: "none",
        border: "none",
        cursor: "pointer",
        ...strongText(s(14), 500),
        padding: "8px 16px",
        borderRadius: 999,
        background: active ? c.controlActive : "transparent",
        color: active ? c.text : c.muted,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        outlineOffset: 2,
    })

    // ---- Pieces of a tier header (used by both desktop grid and mobile cards) ----

    const nameRow = (tier: Tier, i: number) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, height: nameLine }}>
            <span style={{ ...displayText(planNameSize), lineHeight: `${nameLine}px`, color: c.text, ...noWrap }}>{tier.name}</span>
            {i === featuredIndex && badgeLabel ? (
                <span
                    style={{
                        ...strongText(s(12), 600),
                        background: accent,
                        color: "#FFFFFF",
                        padding: "4px 10px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}
                >
                    {badgeLabel}
                </span>
            ) : null}
        </div>
    )

    const description = (tier: Tier) => (
        <p style={{ margin: 0, ...bodyText(s(14)), lineHeight: 1.5, color: c.muted }}>{tier.description}</p>
    )

    // Fixed-height lines: toggling billing or currency never changes the height.
    const priceBlock = (tier: Tier) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, height: priceLine, ...noWrap }}>
                <span style={{ ...displayText(priceSize), letterSpacing: "-0.02em", color: c.text, lineHeight: `${priceLine}px` }}>
                    {formatPrice(tier)}
                </span>
                {billing === "yearly" && yearlySuffix ? (
                    <span style={{ ...strongText(s(13), 500), color: c.muted }}>{yearlySuffix}</span>
                ) : null}
            </div>
            <span style={{ ...bodyText(s(14)), lineHeight: `${Math.ceil(s(14) * 1.45)}px`, color: c.muted, ...noWrap }}>
                {priceSuffix}
            </span>
        </div>
    )

    const cta = (tier: Tier, i: number) => {
        const primary = i === featuredIndex
        const hovered = hoveredCta === i
        return (
            <a
                href={tier.ctaLink || "#"}
                onMouseEnter={() => setHoveredCta(i)}
                onMouseLeave={() => setHoveredCta(null)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 20px",
                    borderRadius: 999,
                    ...strongText(s(15), 600),
                    textDecoration: "none",
                    cursor: "pointer",
                    background: primary ? (hovered ? accentHover : accent) : hovered ? c.control : "transparent",
                    color: primary ? "#FFFFFF" : c.text,
                    border: primary ? `1.5px solid ${hovered ? accentHover : accent}` : `1.5px solid ${c.line}`,
                    outlineOffset: 3,
                    ...noWrap,
                }}
            >
                {tier.ctaLabel}
            </a>
        )
    }

    const controls = (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div role="radiogroup" aria-label="Billing period" style={{ display: "inline-flex", background: c.control, borderRadius: 999, padding: 4 }}>
                <button role="radio" aria-checked={billing === "monthly"} style={pill(billing === "monthly")} onClick={() => setBilling("monthly")}>
                    Monthly
                </button>
                <button role="radio" aria-checked={billing === "yearly"} style={pill(billing === "yearly")} onClick={() => setBilling("yearly")}>
                    Yearly
                    {yearlyDiscount > 0 ? (
                        <span style={{ ...strongText(s(12), 600), color: accent }}>Save {yearlyDiscount}%</span>
                    ) : null}
                </button>
            </div>
            {showCurrencySwitcher ? (
                <div role="radiogroup" aria-label="Currency" style={{ display: "inline-flex", background: c.control, borderRadius: 999, padding: 4 }}>
                    {CURRENCIES.map((cur) => (
                        <button
                            key={cur.code}
                            role="radio"
                            aria-checked={currency === cur.code}
                            style={pill(currency === cur.code)}
                            onClick={() => setCurrency(cur.code)}
                        >
                            {cur.symbol} {cur.code}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )

    const tierList = ((tiers || []) as Tier[]).slice(0, 3)
    const featureList = (features || []) as Feature[]

    // Desktop: each header piece is its own grid row, so names, descriptions,
    // prices and buttons line up across all three tiers automatically.
    const headerCell = (i: number, padding: string, radius?: string): React.CSSProperties => ({
        padding,
        background: i === featuredIndex ? c.tint : "transparent",
        borderRadius: i === featuredIndex && radius ? radius : 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
    })

    return (
        <div
            ref={rootRef}
            className="pm-root"
            style={{
                ...style,
                width: "100%",
                boxSizing: "border-box",
                background: c.bg,
                color: c.text,
                fontFamily: body.family,
                padding: isMobile ? "32px 20px" : "48px 40px",
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? 24 : 40,
                borderRadius: 24,
            }}
        >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
            .pm-root button:focus-visible, .pm-root a:focus-visible { outline: 2px solid ${accent}; }`}</style>
            {controls}

            {isMobile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {tierList.map((tier, i) => (
                        <div
                            key={i}
                            style={{
                                padding: 24,
                                borderRadius: 24,
                                background: i === featuredIndex ? c.tint : "transparent",
                                display: "flex",
                                flexDirection: "column",
                                gap: 24,
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: SPACE }}>
                                {nameRow(tier, i)}
                                {description(tier)}
                                {priceBlock(tier)}
                                {cta(tier, i)}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {featureList.map((f, fi) => (
                                    <div
                                        key={fi}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 16,
                                            padding: "12px 0",
                                            borderTop: fi === 0 ? "none" : `1px solid ${c.line}`,
                                        }}
                                    >
                                        <span style={{ ...bodyText(s(15)), color: c.muted }}>{f.label}</span>
                                        <span style={{ textAlign: "right", display: "inline-flex" }}>{renderValue(tierValue(f, i))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    role="table"
                    aria-label="Plan comparison"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(144px, 23.53%) repeat(3, minmax(0, 1fr))",
                    }}
                >
                    {/* Plan name row */}
                    <div />
                    {tierList.map((tier, i) => (
                        <div key={`n${i}`} role="columnheader" style={headerCell(i, `24px 24px ${SPACE}px`, "24px 24px 0 0")}>
                            {nameRow(tier, i)}
                        </div>
                    ))}

                    {/* Description row */}
                    <div />
                    {tierList.map((tier, i) => (
                        <div key={`d${i}`} style={headerCell(i, `0 24px ${SPACE}px`)}>
                            {description(tier)}
                        </div>
                    ))}

                    {/* Price row */}
                    <div />
                    {tierList.map((tier, i) => (
                        <div key={`p${i}`} style={headerCell(i, `0 24px ${SPACE}px`)}>
                            {priceBlock(tier)}
                        </div>
                    ))}

                    {/* Button row */}
                    <div style={{ padding: "0 24px 32px 0", display: "flex", alignItems: "center" }}>
                        <span style={{ ...strongText(s(15), 600), color: c.text }}>{featureColumnLabel}</span>
                    </div>
                    {tierList.map((tier, i) => (
                        <div key={`b${i}`} style={headerCell(i, "0 24px 32px")}>
                            {cta(tier, i)}
                        </div>
                    ))}

                    {/* Feature rows */}
                    {featureList.map((f, fi) => {
                        const last = fi === featureList.length - 1
                        return (
                            <div role="row" key={fi} style={{ display: "contents" }}>
                                <div
                                    role="rowheader"
                                    style={{
                                        padding: "16px 24px 16px 0",
                                        borderTop: `1px solid ${c.line}`,
                                        ...bodyText(s(15)),
                                        color: c.muted,
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    {f.label}
                                </div>
                                {tierList.map((_, i) => (
                                    <div
                                        role="cell"
                                        key={i}
                                        style={{
                                            padding: "16px 24px",
                                            borderTop: `1px solid ${c.line}`,
                                            background: i === featuredIndex ? c.tint : "transparent",
                                            borderRadius: i === featuredIndex && last ? "0 0 24px 24px" : 0,
                                            paddingBottom: i === featuredIndex && last ? 28 : 16,
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        {renderValue(tierValue(f, i))}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

const DEFAULT_TIERS: Tier[] = [
    {
        name: "Starter",
        description: "For small teams getting their projects organized.",
        priceUSD: 12,
        priceEUR: 12,
        priceGBP: 10,
        ctaLabel: "Start free trial",
        ctaLink: "",
    },
    {
        name: "Pro",
        description: "For growing teams that ship work every week.",
        priceUSD: 29,
        priceEUR: 28,
        priceGBP: 24,
        ctaLabel: "Start free trial",
        ctaLink: "",
    },
    {
        name: "Business",
        description: "For companies running projects across departments.",
        priceUSD: 79,
        priceEUR: 75,
        priceGBP: 65,
        ctaLabel: "Start free trial",
        ctaLink: "",
    },
]

const DEFAULT_FEATURES: Feature[] = [
    { label: "Projects", tier1: "10", tier2: "Unlimited", tier3: "Unlimited" },
    { label: "Team members", tier1: "Up to 5", tier2: "Up to 50", tier3: "Unlimited" },
    { label: "File storage", tier1: "10 GB", tier2: "100 GB", tier3: "1 TB" },
    { label: "Boards and lists", tier1: "yes", tier2: "yes", tier3: "yes" },
    { label: "Timeline view", tier1: "no", tier2: "yes", tier3: "yes" },
    { label: "Automations", tier1: "no", tier2: "250 per month", tier3: "Unlimited" },
    { label: "Guest access", tier1: "no", tier2: "yes", tier3: "yes" },
    { label: "Roles and permissions", tier1: "no", tier2: "no", tier3: "yes" },
    { label: "Single sign-on (SSO)", tier1: "no", tier2: "no", tier3: "yes" },
    { label: "Support", tier1: "Email", tier2: "Priority email", tier3: "Dedicated manager" },
]

PricingMatrix.defaultProps = {
    theme: "system",
    bgLight: "#FFFFFF",
    bgDark: "#0D1117",
    accent: "#2563EB",
    accentHover: "#1D4ED8",
    priceSize: 44,
    planNameSize: 18,
    yearlyDiscount: 24,
    roundPrices: true,
    showCurrencySwitcher: true,
    defaultCurrency: "USD",
    defaultBilling: "monthly",
    featuredTier: 2,
    badgeLabel: "Most popular",
    priceSuffix: "per user / month",
    yearlySuffix: "Billed yearly",
    featureColumnLabel: "Compare features",
    tiers: DEFAULT_TIERS,
    features: DEFAULT_FEATURES,
    mobileBreakpoint: 760,
}

addPropertyControls(PricingMatrix, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["system", "light", "dark"],
        optionTitles: ["System", "Light", "Dark"],
        defaultValue: "system",
    },
    bgLight: {
        type: ControlType.Color,
        title: "Light background",
        defaultValue: "#FFFFFF",
        hidden: (p: any) => p.theme === "dark",
    },
    bgDark: {
        type: ControlType.Color,
        title: "Dark background",
        defaultValue: "#0D1117",
        hidden: (p: any) => p.theme === "light",
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2563EB" },
    accentHover: { type: ControlType.Color, title: "Accent hover", defaultValue: "#1D4ED8" },
    displayFont: {
        type: ControlType.Font,
        title: "Display font",
        description: "Plan names and prices. Set their sizes below.",
        controls: "basic",
        defaultFontType: "sans-serif",
    } as any,
    priceSize: { type: ControlType.Number, title: "Price size", min: 24, max: 80, step: 1, unit: "px", defaultValue: 44 },
    planNameSize: { type: ControlType.Number, title: "Plan name size", min: 12, max: 40, step: 1, unit: "px", defaultValue: 18 },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        description: "Everything else. Size scales all body text; weight applies to regular text, buttons and labels stay bold.",
        controls: "basic",
        defaultFontType: "sans-serif",
    } as any,
    defaultBilling: {
        type: ControlType.Enum,
        title: "Default billing",
        options: ["monthly", "yearly"],
        optionTitles: ["Monthly", "Yearly"],
        defaultValue: "monthly",
    },
    yearlyDiscount: { type: ControlType.Number, title: "Yearly discount %", min: 0, max: 90, step: 1, defaultValue: 24 },
    roundPrices: { type: ControlType.Boolean, title: "Round prices", defaultValue: true },
    showCurrencySwitcher: { type: ControlType.Boolean, title: "Currency switcher", defaultValue: true },
    defaultCurrency: {
        type: ControlType.Enum,
        title: "Default currency",
        options: ["USD", "EUR", "GBP"],
        defaultValue: "USD",
    },
    featuredTier: { type: ControlType.Number, title: "Featured tier", min: 1, max: 3, step: 1, displayStepper: true, defaultValue: 2 },
    badgeLabel: { type: ControlType.String, title: "Badge", defaultValue: "Most popular" },
    priceSuffix: { type: ControlType.String, title: "Price suffix", defaultValue: "per user / month" },
    yearlySuffix: { type: ControlType.String, title: "Yearly note", defaultValue: "Billed yearly" },
    featureColumnLabel: { type: ControlType.String, title: "Feature column", defaultValue: "Compare features" },
    tiers: {
        type: ControlType.Array,
        title: "Tiers",
        maxCount: 3,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name" },
                description: { type: ControlType.String, title: "Description", displayTextArea: true },
                priceUSD: { type: ControlType.Number, title: "Price $", min: 0, step: 1 },
                priceEUR: { type: ControlType.Number, title: "Price €", min: 0, step: 1 },
                priceGBP: { type: ControlType.Number, title: "Price £", min: 0, step: 1 },
                ctaLabel: { type: ControlType.String, title: "Button" },
                ctaLink: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_TIERS,
    },
    features: {
        type: ControlType.Array,
        title: "Features",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Feature" },
                tier1: { type: ControlType.String, title: "Tier 1", placeholder: "yes, no or text" },
                tier2: { type: ControlType.String, title: "Tier 2", placeholder: "yes, no or text" },
                tier3: { type: ControlType.String, title: "Tier 3", placeholder: "yes, no or text" },
            },
        },
        defaultValue: DEFAULT_FEATURES,
    },
    mobileBreakpoint: { type: ControlType.Number, title: "Stack below", min: 320, max: 1200, step: 10, unit: "px", defaultValue: 760 },
})
