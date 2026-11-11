import React, { useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─── TYPES ────────────────────────────────────────────────────
interface Plan {
    name: string
    description: string
    monthlyPrice: number
    yearlyPrice: number
    featured: boolean
    badge: string
    ctaText: string
    feature1: string
    feature2: string
    feature3: string
    feature4: string
    feature5: string
}

// ─── DEFAULT DATA ─────────────────────────────────────────────
const DEFAULT_PLANS: Plan[] = [
    {
        name: "Starter",
        description: "For individuals getting started.",
        monthlyPrice: 9,
        yearlyPrice: 90,
        featured: false,
        badge: "",
        ctaText: "Get Started",
        feature1: "Up to 3 projects",
        feature2: "1 GB storage",
        feature3: "Community support",
        feature4: "",
        feature5: "",
    },
    {
        name: "Pro",
        description: "For growing teams and businesses.",
        monthlyPrice: 29,
        yearlyPrice: 290,
        featured: true,
        badge: "Most Popular",
        ctaText: "Start Free Trial",
        feature1: "Unlimited projects",
        feature2: "50 GB storage",
        feature3: "Priority support",
        feature4: "Custom domains",
        feature5: "Advanced analytics",
    },
    {
        name: "Enterprise",
        description: "For large organizations at scale.",
        monthlyPrice: 99,
        yearlyPrice: 990,
        featured: false,
        badge: "",
        ctaText: "Contact Sales",
        feature1: "Unlimited everything",
        feature2: "500 GB storage",
        feature3: "24/7 dedicated support",
        feature4: "Custom domains",
        feature5: "SSO & SAML",
    },
]

// ─── TOKENS (Original Colors Restored) ────────────────────────
const DARK = {
    bg: "#0A0E27",
    card: "rgba(12,16,40,0.82)",
    cardFeatured: "rgba(15,20,50,0.92)",
    surface: "#141B3D",
    controlBg: "#141B3D", // Toggle button ke liye surface color use kiya
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.14)",
    text: "#F0F4FF",
    textSub: "#9BA3C0",
    textMuted: "#5A6280",
}
const LIGHT = {
    bg: "#F5F7FC",
    card: "rgba(255,255,255,0.92)",
    cardFeatured: "rgba(255,255,255,0.98)",
    surface: "#FFFFFF",
    controlBg: "#FFFFFF",
    border: "rgba(0,0,0,0.06)",
    borderStrong: "rgba(0,0,0,0.12)",
    text: "#0F1729",
    textSub: "#5A6280",
    textMuted: "#9BA3C0",
}

const F = "-apple-system, 'Inter', BlinkMacSystemFont, sans-serif"
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"

// ─── COMPONENT ────────────────────────────────────────────────
/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PricingToggle(props: {
    theme?: "dark" | "light"
    accentColor?: string
    accentColor2?: string
    currencySymbol?: string
    yearlySavingsLabel?: string
    defaultPeriod?: "monthly" | "yearly"
    plans?: Plan[]
}) {
    const {
        theme: propTheme = "dark",
        accentColor = "#00D9FF",
        accentColor2 = "#7C3AED",
        currencySymbol = "$",
        yearlySavingsLabel = "Save 20%",
        defaultPeriod = "monthly",
        plans = DEFAULT_PLANS,
    } = props

    const isStatic = useIsStaticRenderer()
    const [theme, setTheme] = useState<"dark" | "light">(propTheme)
    const [period, setPeriod] = useState<"monthly" | "yearly">(defaultPeriod)
    const safePlans = Array.isArray(plans) ? plans : DEFAULT_PLANS

    useEffect(() => setTheme(propTheme), [propTheme])
    useEffect(() => setPeriod(defaultPeriod), [defaultPeriod])

    const tk = theme === "dark" ? DARK : LIGHT
    const accent = accentColor || "#00D9FF"
    const accent2 = accentColor2 || "#7C3AED"
    const isYearly = period === "yearly"

    return (
        <div
            className="pt-pro-root"
            style={{
                fontFamily: F,
                background: tk.bg,
                color: tk.text,
                width: "100%",
                minHeight: "100%",
                maxHeight: "100%",
                boxSizing: "border-box",
                padding: "clamp(1.5rem, 5vw, 3.5rem) clamp(1rem, 4vw, 1.5rem)",
                position: "relative",
                overflow: "hidden",
                transition: `background 0.5s ${EASE}, color 0.5s ${EASE}`,
            }}
        >
            {/* ── Scoped Premium Styles ── */}
            <style>{`
                .pt-pro-root, .pt-pro-root *, .pt-pro-root *::before, .pt-pro-root *::after { box-sizing: border-box; }
                .pt-pro-root .pt-card { transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, border-color 0.6s ${EASE}; }
                .pt-pro-root .pt-card:hover { transform: translateY(-8px) !important; }
                
                .pt-pro-root .pt-btn { position: relative; overflow: hidden; transition: transform 0.5s ${EASE}, filter 0.3s; }
                .pt-pro-root .pt-btn::before { content: ''; position: absolute; top: 0; left: -120%; width: 60%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.3), transparent); transform: skewX(-20deg); transition: left 0.8s ${EASE}; pointer-events: none; }
                .pt-pro-root .pt-btn:hover::before { left: 140%; }
                .pt-pro-root .pt-btn:hover { transform: translateY(-2px); }
                .pt-pro-root .pt-btn:active { transform: translateY(0) scale(0.98); }
                
                .pt-pro-root .pt-ghost:hover { background: ${tk.surface} !important; border-color: ${accent} !important; }
                .pt-pro-root .pt-tbtn { -webkit-tap-highlight-color: transparent; transition: color 0.4s ${EASE}; }
                .pt-pro-root .pt-tbtn:focus-visible, .pt-pro-root .pt-btn:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
                
                .pt-pro-root .pt-theme-btn { transition: background 0.4s ${EASE}, transform 0.6s ${EASE}; }
                .pt-pro-root .pt-theme-btn:hover { transform: rotate(20deg); }
                
                @media (prefers-reduced-motion: reduce) {
                    .pt-pro-root, .pt-pro-root * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
                }
            `}</style>

            {/* ── Theme toggle (top-right) ── */}
            <button
                type="button"
                className="pt-theme-btn"
                onClick={() =>
                    setTheme((th) => (th === "dark" ? "light" : "dark"))
                }
                aria-label={
                    theme === "dark"
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                }
                style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: `1px solid ${tk.borderStrong}`,
                    background: tk.controlBg,
                    color: tk.textSub,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    cursor: "pointer",
                    zIndex: 10,
                }}
            >
                {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <div style={{ maxWidth: 1080, margin: "0 auto" }}>
                {/* Header */}
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "clamp(1.5rem, 4vw, 2.5rem)",
                    }}
                >
                    <h2
                        style={{
                            fontWeight: 800,
                            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                            letterSpacing: "-0.03em",
                            color: tk.text,
                            margin: "0 0 0.5rem",
                        }}
                    >
                        Simple, transparent pricing
                    </h2>
                    <p
                        style={{
                            color: tk.textSub,
                            fontSize: "clamp(0.875rem, 2vw, 1.0625rem)",
                            marginBottom: "clamp(1.25rem, 3vw, 2rem)",
                        }}
                    >
                        Choose the plan that fits your team. Switch anytime.
                    </p>

                    {/* Toggle */}
                    <div
                        role="group"
                        aria-label="Billing period"
                        style={{
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: 4,
                            borderRadius: 999,
                            background: tk.surface,
                            border: `1px solid ${tk.borderStrong}`,
                        }}
                    >
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 4,
                                left: 4,
                                bottom: 4,
                                width: "calc(50% - 4px)",
                                borderRadius: 999,
                                background: `linear-gradient(135deg, ${accent}, ${accent2})`,
                                transform: isYearly
                                    ? "translateX(100%)"
                                    : "translateX(0)",
                                transition: isStatic
                                    ? "none"
                                    : `transform 0.6s ${EASE}`,
                                boxShadow: `0 4px 15px ${accent}44`,
                            }}
                        />
                        <button
                            type="button"
                            className="pt-tbtn"
                            onClick={() => setPeriod("monthly")}
                            aria-pressed={!isYearly}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                padding: "8px 22px",
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: F,
                                border: "none",
                                background: "none",
                                borderRadius: 999,
                                color: !isYearly ? "#fff" : tk.textSub,
                                cursor: "pointer",
                            }}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            className="pt-tbtn"
                            onClick={() => setPeriod("yearly")}
                            aria-pressed={isYearly}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                padding: "8px 22px",
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: F,
                                border: "none",
                                background: "none",
                                borderRadius: 999,
                                color: isYearly ? "#fff" : tk.textSub,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            Yearly
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "2px 7px",
                                    borderRadius: 999,
                                    background: isYearly
                                        ? "rgba(255,255,255,0.22)"
                                        : `${accent}22`,
                                    color: isYearly ? "#fff" : accent,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {yearlySavingsLabel}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                        gap: "clamp(12px, 3vw, 20px)",
                        alignItems: "stretch",
                    }}
                >
                    {safePlans.map((plan, i) => {
                        const price = isYearly
                            ? Math.round(plan.yearlyPrice / 12)
                            : plan.monthlyPrice
                        const features = [
                            plan.feature1,
                            plan.feature2,
                            plan.feature3,
                            plan.feature4,
                            plan.feature5,
                        ].filter(Boolean)

                        return (
                            <div
                                key={i}
                                className="pt-card"
                                style={{
                                    position: "relative",
                                    background: plan.featured
                                        ? tk.cardFeatured
                                        : tk.card,
                                    border: `1px solid ${plan.featured ? accent + "55" : tk.border}`,
                                    borderRadius: "clamp(12px, 3vw, 18px)",
                                    padding:
                                        "clamp(1.25rem, 4vw, 1.75rem) clamp(1rem, 3vw, 1.5rem)",
                                    display: "flex",
                                    flexDirection: "column",
                                    backdropFilter: "blur(16px)",
                                    WebkitBackdropFilter: "blur(16px)",
                                    boxShadow: plan.featured
                                        ? `0 16px 48px ${accent}22, 0 0 0 1px ${accent}33`
                                        : "0 4px 20px rgba(0,0,0,0.10)",
                                    transform: plan.featured
                                        ? "scale(1.03)"
                                        : "scale(1)",
                                }}
                            >
                                {plan.featured && plan.badge ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: -13,
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            padding: "5px 16px",
                                            borderRadius: 999,
                                            fontSize: 11,
                                            fontWeight: 800,
                                            color: "#fff",
                                            background: `linear-gradient(135deg, ${accent}, ${accent2})`,
                                            boxShadow: `0 4px 16px ${accent}44`,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {plan.badge}
                                    </div>
                                ) : null}

                                <div style={{ marginBottom: "1rem" }}>
                                    <div
                                        style={{
                                            fontSize: "1.0625rem",
                                            fontWeight: 800,
                                            color: tk.text,
                                            marginBottom: 4,
                                        }}
                                    >
                                        {plan.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.8125rem",
                                            color: tk.textSub,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {plan.description}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-end",
                                        gap: 4,
                                        marginBottom: 4,
                                        transition: `color 0.4s ${EASE}`,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "1.125rem",
                                            fontWeight: 700,
                                            color: tk.text,
                                            paddingBottom: 6,
                                        }}
                                    >
                                        {currencySymbol}
                                    </span>
                                    <span
                                        key={price}
                                        style={{
                                            fontSize:
                                                "clamp(2rem, 6vw, 2.625rem)",
                                            fontWeight: 800,
                                            letterSpacing: "-0.03em",
                                            color: tk.text,
                                            lineHeight: 1,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {price}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: tk.textSub,
                                            paddingBottom: 8,
                                        }}
                                    >
                                        /mo
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 11.5,
                                        color: tk.textMuted,
                                        marginBottom: "1.25rem",
                                        minHeight: 16,
                                    }}
                                >
                                    {isYearly
                                        ? `${currencySymbol}${plan.yearlyPrice} billed yearly`
                                        : "billed monthly"}
                                </div>

                                <button
                                    type="button"
                                    className={`pt-btn${plan.featured ? "" : " pt-ghost"}`}
                                    style={{
                                        width: "100%",
                                        padding: "0.85rem",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        fontFamily: "inherit",
                                        borderRadius: 11,
                                        border: plan.featured
                                            ? "none"
                                            : `1px solid ${tk.borderStrong}`,
                                        background: plan.featured
                                            ? `linear-gradient(135deg, ${accent}, ${accent2})`
                                            : "transparent",
                                        color: plan.featured ? "#fff" : tk.text,
                                        cursor: "pointer",
                                        marginBottom: "1.5rem",
                                        boxShadow: plan.featured
                                            ? `0 6px 20px ${accent}40`
                                            : "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 6,
                                    }}
                                >
                                    {plan.ctaText}
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ width: 14, height: 14 }}
                                        aria-hidden="true"
                                    >
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </button>

                                <div
                                    style={{
                                        height: 1,
                                        background: tk.border,
                                        marginBottom: "1rem",
                                    }}
                                />

                                <ul
                                    style={{
                                        listStyle: "none",
                                        margin: 0,
                                        padding: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    {features.map((feat, fi) => (
                                        <li
                                            key={fi}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                fontSize: 13,
                                                color: tk.text,
                                            }}
                                        >
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    flexShrink: 0,
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: "50%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: `${accent}22`,
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke={accent}
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                    }}
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── FRAMER PROPERTY CONTROLS ─────────────────────────────────
addPropertyControls(PricingToggle, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#00D9FF",
    },
    accentColor2: {
        type: ControlType.Color,
        title: "Accent Color 2",
        defaultValue: "#7C3AED",
    },
    currencySymbol: {
        type: ControlType.String,
        title: "Currency Symbol",
        defaultValue: "$",
    },
    yearlySavingsLabel: {
        type: ControlType.String,
        title: "Savings Label",
        defaultValue: "Save 20%",
    },
    defaultPeriod: {
        type: ControlType.Enum,
        title: "Default Period",
        options: ["monthly", "yearly"],
        optionTitles: ["Monthly", "Yearly"],
        defaultValue: "monthly",
        displaySegmentedControl: true,
    },
    plans: {
        type: ControlType.Array,
        title: "Plans",
        maxCount: 5,
        defaultValue: DEFAULT_PLANS,
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Plan",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Plan description",
                    displayTextArea: true,
                },
                monthlyPrice: {
                    type: ControlType.Number,
                    title: "Monthly Price",
                    defaultValue: 9,
                    min: 0,
                },
                yearlyPrice: {
                    type: ControlType.Number,
                    title: "Yearly Price",
                    defaultValue: 90,
                    min: 0,
                },
                featured: {
                    type: ControlType.Boolean,
                    title: "Featured",
                    defaultValue: false,
                },
                badge: {
                    type: ControlType.String,
                    title: "Badge Text",
                    defaultValue: "",
                },
                ctaText: {
                    type: ControlType.String,
                    title: "Button Text",
                    defaultValue: "Get Started",
                },
                feature1: {
                    type: ControlType.String,
                    title: "Feature 1",
                    defaultValue: "Feature one",
                },
                feature2: {
                    type: ControlType.String,
                    title: "Feature 2",
                    defaultValue: "Feature two",
                },
                feature3: {
                    type: ControlType.String,
                    title: "Feature 3",
                    defaultValue: "Feature three",
                },
                feature4: {
                    type: ControlType.String,
                    title: "Feature 4",
                    defaultValue: "",
                },
                feature5: {
                    type: ControlType.String,
                    title: "Feature 5",
                    defaultValue: "",
                },
            },
        },
    },
})
