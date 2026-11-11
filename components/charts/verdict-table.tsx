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
    price: string
    period: string
    note: string
    highlight: boolean
    ctaLabel: string
    ctaLink: string
}

type Feature = {
    label: string
    values: string
}

type Props = {
    plans: Plan[]
    features: Feature[]
    highlightLabel: string
    font: React.CSSProperties
    background: string
    surface: string
    text: string
    muted: string
    border: string
    accent: string
    accentText: string
    radius: number
    gap: number
    breakpoint: number
    style?: React.CSSProperties
}

/**
 * Verdict Table
 * Side by side comparison of 2 to 4 products or plans.
 * Feature values: "Yes" shows a check, "No" shows a dash, anything else shows as text.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 960
 */
export default function VerdictTable(props: Props) {
    const {
        plans,
        features,
        highlightLabel,
        font,
        background,
        surface,
        text,
        muted,
        border,
        accent,
        accentText,
        radius,
        gap,
        breakpoint,
        style,
    } = props

    const ref = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(960)

    React.useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) setWidth(entry.contentRect.width)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const list = (plans || []).slice(0, 4)
    const rows = features || []
    const stacked = width < breakpoint

    const valueFor = (feature: Feature, index: number) => {
        const parts = (feature.values || "").split("|").map((v) => v.trim())
        return parts[index] ?? ""
    }

    const renderValue = (value: string, color: string) => {
        const v = value.toLowerCase()
        if (v === "yes" || v === "true") {
            return (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    role="img"
                    aria-label="Included"
                >
                    <path
                        d="M3.5 9.5 L7.5 13.5 L14.5 5"
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )
        }
        if (v === "no" || v === "false" || v === "") {
            return (
                <span aria-label="Not included" style={{ color: muted }}>
                    –
                </span>
            )
        }
        return <span>{value}</span>
    }

    const Badge = () => (
        <span
            style={{
                alignSelf: "flex-start",
                background: accent,
                color: accentText,
                fontSize: "0.72em",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                padding: "4px 8px",
                borderRadius: Math.max(0, radius - 6),
            }}
        >
            {highlightLabel}
        </span>
    )

    const Cta = ({ plan }: { plan: Plan }) =>
        plan.ctaLabel ? (
            <a
                href={plan.ctaLink || "#"}
                style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 600,
                    padding: "12px 16px",
                    borderRadius: Math.max(0, radius - 4),
                    background: plan.highlight ? accent : "transparent",
                    color: plan.highlight ? accentText : text,
                    border: `1px solid ${plan.highlight ? accent : border}`,
                }}
            >
                {plan.ctaLabel}
            </a>
        ) : null

    const Head = ({ plan }: { plan: Plan }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.highlight && highlightLabel ? <Badge /> : null}
            <div style={{ fontWeight: 600, fontSize: "1.1em" }}>
                {plan.name}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                    style={{
                        fontSize: "1.9em",
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {plan.price}
                </span>
                {plan.period ? (
                    <span style={{ color: muted }}>{plan.period}</span>
                ) : null}
            </div>
            {plan.note ? (
                <div style={{ color: muted, fontSize: "0.9em" }}>
                    {plan.note}
                </div>
            ) : null}
        </div>
    )

    const base: React.CSSProperties = {
        ...style,
        ...font,
        width: "100%",
        boxSizing: "border-box",
        background,
        color: text,
        borderRadius: radius,
    }

    if (stacked) {
        return (
            <div
                ref={ref}
                style={{
                    ...base,
                    display: "flex",
                    flexDirection: "column",
                    gap,
                }}
            >
                {list.map((plan, i) => (
                    <div
                        key={i}
                        style={{
                            background: surface,
                            border: `1px solid ${plan.highlight ? accent : border}`,
                            borderRadius: radius,
                            padding: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        <Head plan={plan} />
                        <div
                            style={{ display: "flex", flexDirection: "column" }}
                        >
                            {rows.map((f, r) => (
                                <div
                                    key={r}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "10px 0",
                                        borderTop: `1px solid ${border}`,
                                    }}
                                >
                                    <span style={{ color: muted }}>
                                        {f.label}
                                    </span>
                                    <span style={{ textAlign: "right" }}>
                                        {renderValue(
                                            valueFor(f, i),
                                            plan.highlight ? accent : text
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Cta plan={plan} />
                    </div>
                ))}
            </div>
        )
    }

    const columns = `minmax(140px, 1.2fr) repeat(${list.length}, minmax(0, 1fr))`

    return (
        <div
            ref={ref}
            role="table"
            style={{
                ...base,
                background: surface,
                border: `1px solid ${border}`,
                overflow: "hidden",
            }}
        >
            <div
                role="row"
                style={{
                    display: "grid",
                    gridTemplateColumns: columns,
                    alignItems: "end",
                }}
            >
                <div role="columnheader" style={{ padding: 20 }} />
                {list.map((plan, i) => (
                    <div
                        key={i}
                        role="columnheader"
                        style={{
                            padding: 20,
                            borderLeft: `1px solid ${border}`,
                            boxShadow: plan.highlight
                                ? `inset 0 3px 0 ${accent}`
                                : "none",
                        }}
                    >
                        <Head plan={plan} />
                    </div>
                ))}
            </div>

            {rows.map((f, r) => (
                <div
                    key={r}
                    role="row"
                    style={{
                        display: "grid",
                        gridTemplateColumns: columns,
                        borderTop: `1px solid ${border}`,
                    }}
                >
                    <div
                        role="rowheader"
                        style={{ padding: "14px 20px", color: muted }}
                    >
                        {f.label}
                    </div>
                    {list.map((plan, i) => (
                        <div
                            key={i}
                            role="cell"
                            style={{
                                padding: "14px 20px",
                                borderLeft: `1px solid ${border}`,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {renderValue(
                                valueFor(f, i),
                                plan.highlight ? accent : text
                            )}
                        </div>
                    ))}
                </div>
            ))}

            <div
                role="row"
                style={{
                    display: "grid",
                    gridTemplateColumns: columns,
                    borderTop: `1px solid ${border}`,
                }}
            >
                <div role="cell" style={{ padding: 20 }} />
                {list.map((plan, i) => (
                    <div
                        key={i}
                        role="cell"
                        style={{
                            padding: 20,
                            borderLeft: `1px solid ${border}`,
                        }}
                    >
                        <Cta plan={plan} />
                    </div>
                ))}
            </div>
        </div>
    )
}

VerdictTable.defaultProps = {
    plans: [
        {
            name: "Starter",
            price: "$0",
            period: "/ month",
            note: "For trying it out",
            highlight: false,
            ctaLabel: "Start free",
            ctaLink: "",
        },
        {
            name: "Pro",
            price: "$19",
            period: "/ month",
            note: "For one real project",
            highlight: true,
            ctaLabel: "Choose Pro",
            ctaLink: "",
        },
        {
            name: "Team",
            price: "$49",
            period: "/ month",
            note: "For small teams",
            highlight: false,
            ctaLabel: "Choose Team",
            ctaLink: "",
        },
    ],
    features: [
        { label: "Projects", values: "1 | 10 | Unlimited" },
        { label: "Custom domain", values: "No | Yes | Yes" },
        { label: "Analytics", values: "No | Yes | Yes" },
        { label: "Team seats", values: "1 | 1 | 5" },
        { label: "Priority support", values: "No | No | Yes" },
    ],
    highlightLabel: "Best pick",
    font: { fontSize: 15, lineHeight: 1.45 },
    background: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#1A1C1F",
    muted: "#5A6168",
    border: "#E2E5E8",
    accent: "#1A1C1F",
    accentText: "#FFFFFF",
    radius: 14,
    gap: 16,
    breakpoint: 640,
}

addPropertyControls(VerdictTable, {
    plans: {
        type: ControlType.Array,
        title: "Plans",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Plan",
                },
                price: {
                    type: ControlType.String,
                    title: "Price",
                    defaultValue: "$0",
                },
                period: {
                    type: ControlType.String,
                    title: "Period",
                    defaultValue: "/ month",
                },
                note: {
                    type: ControlType.String,
                    title: "Note",
                    defaultValue: "",
                },
                highlight: {
                    type: ControlType.Boolean,
                    title: "Highlight",
                    defaultValue: false,
                },
                ctaLabel: {
                    type: ControlType.String,
                    title: "Button",
                    defaultValue: "Choose",
                },
                ctaLink: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    features: {
        type: ControlType.Array,
        title: "Rows",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Feature",
                },
                values: {
                    type: ControlType.String,
                    title: "Values",
                    defaultValue: "Yes | No | Yes",
                    description:
                        "One value per plan, split with |. Yes = check, No = dash.",
                },
            },
        },
    },
    highlightLabel: {
        type: ControlType.String,
        title: "Badge",
        defaultValue: "Best pick",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, lineHeight: 1.45 },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    surface: {
        type: ControlType.Color,
        title: "Surface",
        defaultValue: "#FFFFFF",
    },
    text: { type: ControlType.Color, title: "Text", defaultValue: "#1A1C1F" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#5A6168" },
    border: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E2E5E8",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#1A1C1F",
    },
    accentText: {
        type: ControlType.Color,
        title: "Accent text",
        defaultValue: "#FFFFFF",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 32,
        defaultValue: 14,
    },
    gap: {
        type: ControlType.Number,
        title: "Stack gap",
        min: 0,
        max: 48,
        defaultValue: 16,
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Stack below",
        min: 320,
        max: 1200,
        unit: "px",
        defaultValue: 640,
    },
})
