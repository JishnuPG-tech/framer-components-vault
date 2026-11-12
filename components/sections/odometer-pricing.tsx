/**
 * Odometer Pricing
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component on the canvas. Edit plans, labels and colors in the property panel.
 * 3. Fonts: pick any font in the Font control. It uses your project's default font until you do.
 *
 * A pricing section with a Monthly / Yearly switch. When you switch, every price rolls to the new
 * number digit by digit like an odometer, with a small stagger between columns.
 * Each plan is a flat colour band (palette by index, or its own colour). Bands sit edge to edge and
 * wrap to one column on phones. Motion is CSS only, off in the static render and for reduced motion.
 */
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


type Plan = {
    name: string
    description: string
    monthly: number
    yearly: number
    features: string
    cta: string
    link: string
    featured: boolean
    color?: string
}

interface OdometerPricingProps {
    plans: Plan[]
    startYearly: boolean
    monthlyLabel: string
    yearlyLabel: string
    badge: string
    currency: string
    suffix: string
    monthlyNote: string
    yearlyNote: string
    featuredLabel: string
    duration: number
    stagger: number
    gap: number
    radius: number
    colors: string[]
    ink: string
    surface: string
    background: string
    font?: React.CSSProperties
    style?: React.CSSProperties
}

const PALETTE = ["#FFD35C", "#F9C2F2", "#86A3E0", "#C8B8B2", "#55683F"]

const DEFAULT_PLANS: Plan[] = [
    {
        name: "Starter",
        description: "For solo founders shipping a first product.",
        monthly: 9,
        yearly: 7,
        features: "1 project\nCustom domain\nBasic analytics\nEmail support",
        cta: "Start free trial",
        link: "#",
        featured: false,
    },
    {
        name: "Pro",
        description: "For growing teams that ship every week.",
        monthly: 29,
        yearly: 24,
        features: "10 projects\nCMS with 2,000 items\nAdvanced analytics\nPriority support",
        cta: "Get Pro",
        link: "#",
        featured: true,
    },
    {
        name: "Team",
        description: "For companies running many projects at once.",
        monthly: 129,
        yearly: 99,
        features: "Unlimited projects\nRoles and permissions\nSSO\nDedicated manager",
        cta: "Talk to sales",
        link: "#",
        featured: false,
    },
]

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

function formatPrice(value: number): string {
    if (!Number.isFinite(value)) return "0"
    const rounded = Math.round(value * 100) / 100
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

function bandColor(plan: Plan, index: number, palette: string[]): string {
    if (plan.color) return plan.color
    return palette[index % palette.length]
}

/** Rolls each digit column to its new value. Columns are keyed from the right so units stay put when the length changes. */
function Odometer(props: { text: string; animate: boolean; duration: number; stagger: number }) {
    const { text, animate, duration, stagger } = props
    const chars = text.split("")
    return (
        <span aria-hidden="true" style={{ display: "inline-flex", lineHeight: 1, height: "1em", overflow: "hidden" }}>
            {chars.map((char, i) => {
                const fromRight = chars.length - 1 - i
                const digit = DIGITS.indexOf(char)
                if (digit === -1) {
                    return (
                        <span key={`s${fromRight}`} style={{ display: "inline-block" }}>
                            {char}
                        </span>
                    )
                }
                const transition = animate ? `transform ${duration}s ${EASE} ${fromRight * stagger}s` : "none"
                return (
                    <span key={`d${fromRight}`} style={{ display: "inline-block", height: "1em", overflow: "hidden" }}>
                        <span
                            className="odo-col"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                transform: `translateY(${-digit}em)`,
                                transition,
                            }}
                        >
                            {DIGITS.map((d) => (
                                <span key={d} style={{ height: "1em", display: "block", textAlign: "center" }}>
                                    {d}
                                </span>
                            ))}
                        </span>
                    </span>
                )
            })}
        </span>
    )
}

function ArrowCircle(props: { size: number; fill: string; color: string }) {
    const { size, fill, color } = props
    return (
        <span
            aria-hidden="true"
            style={{
                width: size,
                height: size,
                flexShrink: 0,
                borderRadius: 999,
                background: fill,
                color,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
                <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    )
}

function Check() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }}>
            <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1080
 */
export default function OdometerPricing(props: OdometerPricingProps) {
    const {
        plans: rawPlans = DEFAULT_PLANS,
        startYearly = false,
        monthlyLabel = "Monthly",
        yearlyLabel = "Yearly",
        badge = "Save 20%",
        currency = "$",
        suffix = "/mo",
        monthlyNote = "Billed monthly",
        yearlyNote = "Billed yearly",
        featuredLabel = "Most popular",
        duration = 0.9,
        stagger = 0.08,
        gap = 0,
        radius = 24,
        colors: rawColors = PALETTE,
        ink = "#0E0E0E",
        surface = "#F4F4F2",
        background = "rgba(0, 0, 0, 0)",
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const plans = rawPlans.length ? rawPlans : DEFAULT_PLANS
    const palette = rawColors && rawColors.length ? rawColors : PALETTE
    const [yearly, setYearly] = React.useState(startYearly)
    React.useEffect(() => setYearly(startYearly), [startYearly])

    const animate = !isStatic

    const segment = (active: boolean): React.CSSProperties => ({
        position: "relative",
        zIndex: 1,
        flex: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 44,
        padding: "0 22px",
        border: "none",
        borderRadius: 999,
        background: "transparent",
        color: active ? ink : surface,
        font: "inherit",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: animate ? `color 0.35s ${EASE}` : "none",
    })

    const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.005em" }
    const flush = gap === 0

    return (
        <div
            style={{
                ...style,
                ...font,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 28,
                background,
                color: ink,
                boxSizing: "border-box",
            }}
        >
            <style>{`
                .odo-card { container-type: inline-size; }
                .odo-btn:focus-visible, .odo-cta:focus-visible { outline: 2px solid ${ink}; outline-offset: 3px; }
                .odo-cta:hover .odo-arrow { transform: translateX(3px); }
                @media (prefers-reduced-motion: reduce) {
                    .odo-col, .odo-thumb, .odo-btn, .odo-arrow { transition: none !important; }
                }
            `}</style>

            <div
                role="radiogroup"
                aria-label="Billing period"
                style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    padding: 4,
                    borderRadius: 999,
                    background: ink,
                }}
            >
                <span
                    className="odo-thumb"
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: 4,
                        bottom: 4,
                        left: 4,
                        width: "calc(50% - 4px)",
                        borderRadius: 999,
                        background: surface,
                        transform: yearly ? "translateX(100%)" : "translateX(0)",
                        transition: animate ? `transform 0.45s ${EASE}` : "none",
                    }}
                />
                <button type="button" role="radio" aria-checked={!yearly} className="odo-btn" style={segment(!yearly)} onClick={() => setYearly(false)}>
                    {monthlyLabel}
                </button>
                <button type="button" role="radio" aria-checked={yearly} className="odo-btn" style={segment(yearly)} onClick={() => setYearly(true)}>
                    {yearlyLabel}
                    {badge ? (
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: 999,
                                background: palette[0],
                                color: ink,
                            }}
                        >
                            {badge}
                        </span>
                    ) : null}
                </button>
            </div>

            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexWrap: "wrap",
                    gap,
                    borderRadius: flush ? radius : 0,
                    overflow: flush ? "hidden" : "visible",
                }}
            >
                {plans.map((plan, i) => {
                    const featured = !!plan.featured
                    const band = bandColor(plan, i, palette)
                    const price = formatPrice(yearly ? plan.yearly : plan.monthly)
                    const features = (plan.features || "").split("\n").map((f) => f.trim()).filter(Boolean)
                    return (
                        <div
                            key={`${plan.name}-${i}`}
                            className="odo-card"
                            style={{
                                flex: "1 1 260px",
                                minWidth: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: 28,
                                padding: "28px 28px 28px",
                                borderRadius: flush ? 0 : radius,
                                background: band,
                                color: ink,
                                boxSizing: "border-box",
                            }}
                        >
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 10, minHeight: 32 }}>
                                <span style={{ flex: "1 0 auto", fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
                                    {plan.name}
                                </span>
                                {featured && featuredLabel ? (
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            fontSize: 12,
                                            fontWeight: 700,
                                            padding: "7px 12px",
                                            borderRadius: 999,
                                            background: ink,
                                            color: surface,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {featuredLabel}
                                    </span>
                                ) : null}
                            </div>

                            <div style={{ display: "flex", alignItems: "stretch", gap: 16 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 6,
                                        fontSize: "clamp(56px, 30cqi, 112px)",
                                        fontWeight: 800,
                                        letterSpacing: "-0.05em",
                                        lineHeight: 1,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    <span style={{ display: "inline-flex" }}>
                                        <span aria-hidden="true">{currency}</span>
                                        <Odometer text={price} animate={animate} duration={duration} stagger={stagger} />
                                    </span>
                                    <span aria-hidden="true" style={{ ...label, fontSize: 14, marginTop: 10, letterSpacing: 0, opacity: 0.55 }}>
                                        {suffix}
                                    </span>
                                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                                        {`${currency}${price} ${suffix}`}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 14, borderLeft: "1px solid rgba(14, 14, 14, 0.2)" }}>
                                <span style={label}>{yearly ? yearlyNote : monthlyNote}</span>
                                <span style={{ ...label, fontWeight: 500, opacity: 0.6 }}>{plan.description}</span>
                            </div>

                            {features.length ? (
                                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                                    {features.map((f, j) => (
                                        <li key={j} style={{ display: "flex", gap: 10, fontSize: 15, fontWeight: 600, lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                                            <Check />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span style={{ flex: 1 }} />
                            )}

                            <a
                                className="odo-cta"
                                href={plan.link || undefined}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    height: 56,
                                    padding: "0 6px 0 22px",
                                    borderRadius: 999,
                                    background: ink,
                                    color: surface,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    letterSpacing: "-0.01em",
                                    textDecoration: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{plan.cta}</span>
                                <span className="odo-arrow" style={{ display: "inline-flex", transition: animate ? `transform 0.3s ${EASE}` : "none" }}>
                                    <ArrowCircle size={44} fill={band} color={ink} />
                                </span>
                            </a>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(OdometerPricing, {
    plans: {
        type: ControlType.Array,
        title: "Plans",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Plan" },
                description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "" },
                monthly: { type: ControlType.Number, title: "Monthly", defaultValue: 19, min: 0, step: 1, displayStepper: true },
                yearly: { type: ControlType.Number, title: "Yearly", defaultValue: 15, min: 0, step: 1, displayStepper: true, description: "Per month, billed yearly." },
                features: { type: ControlType.String, title: "Features", displayTextArea: true, defaultValue: "", description: "One feature per line." },
                cta: { type: ControlType.String, title: "Button", defaultValue: "Get started" },
                link: { type: ControlType.Link, title: "Link" },
                featured: { type: ControlType.Boolean, title: "Featured", defaultValue: false },
                color: { type: ControlType.Color, title: "Color", optional: true, description: "Optional. Empty uses the band colours in order." },
            },
        },
        defaultValue: DEFAULT_PLANS,
    },
    startYearly: { type: ControlType.Boolean, title: "Start On", enabledTitle: "Yearly", disabledTitle: "Monthly", defaultValue: false },
    monthlyLabel: { type: ControlType.String, title: "Monthly Label", defaultValue: "Monthly" },
    yearlyLabel: { type: ControlType.String, title: "Yearly Label", defaultValue: "Yearly" },
    badge: { type: ControlType.String, title: "Badge", defaultValue: "Save 20%", description: "Leave empty to hide." },
    currency: { type: ControlType.String, title: "Currency", defaultValue: "$" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "/mo" },
    monthlyNote: { type: ControlType.String, title: "Monthly Note", defaultValue: "Billed monthly" },
    yearlyNote: { type: ControlType.String, title: "Yearly Note", defaultValue: "Billed yearly" },
    featuredLabel: { type: ControlType.String, title: "Featured Tag", defaultValue: "Most popular" },
    duration: { type: ControlType.Number, title: "Roll Time", defaultValue: 0.9, min: 0.1, max: 3, step: 0.05, unit: "s" },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.08, min: 0, max: 0.5, step: 0.01, unit: "s", description: "Delay between digit columns." },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 0, min: 0, max: 64, description: "0 = bands edge to edge in one rounded block." },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 24, min: 0, max: 40 },
    colors: {
        type: ControlType.Array,
        title: "Band Colors",
        control: { type: ControlType.Color },
        defaultValue: PALETTE,
        description: "Used in order, then repeated.",
    },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0E0E0E", description: "Text, toggle, buttons and focus ring." },
    surface: { type: ControlType.Color, title: "Surface", defaultValue: "#F4F4F2", description: "Toggle thumb and button text." },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
})
