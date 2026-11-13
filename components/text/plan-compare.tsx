import { useState, useRef, useEffect } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Plan {
    name: string
    tagline: string
    price: string
    priceSuffix: string
    buttonLabel: string
    buttonLink: string
    highlight: boolean
    badge: string
}

interface Row {
    label: string
    values: string[]
}

interface ComparisonTableProps {
    heading: string
    subheading: string
    plans: Plan[]
    rows: Row[]
    font: CSSProperties
    radius: number
    accentColor: string
    highlightTint: string
    highlightTextColor: string
    highlightMutedColor: string
    yesColor: string
    noColor: string
    cardColor: string
    pageColor: string
    textColor: string
    mutedColor: string
    borderColor: string
    buttonTextColor: string
    showButtons: boolean
    mobileBreakpoint: number
    style?: CSSProperties
}

/**
 * COMPARISON TABLE
 *
 * A soft, inviting feature comparison table. Each row shows a check or cross
 * per plan (or free text like "10 GB"). One plan can be highlighted as a
 * single continuous column block (its own background + text colours) that
 * stays perfectly aligned with the rows and is never cut by dividers.
 *
 * Cell values: type "yes" for a check, "no" (or leave blank) for a cross, or
 * any free text like "10 GB". In each Feature Row the Values list holds one
 * entry per plan, in the same order as your Plans.
 *
 * Buttons wrap gracefully and share equal height per row. Responsive: a
 * classic table on wide screens; roomy stacked per-plan cards below the mobile
 * breakpoint (no horizontal scroll).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 560
 */
export default function ComparisonTable(props: ComparisonTableProps) {
    const {
        heading,
        subheading,
        plans,
        rows,
        font,
        radius,
        accentColor,
        highlightTint,
        highlightTextColor,
        highlightMutedColor,
        yesColor,
        noColor,
        cardColor,
        pageColor,
        textColor,
        mutedColor,
        borderColor,
        buttonTextColor,
        showButtons,
        mobileBreakpoint,
        style,
    } = props

    const safePlans: Plan[] =
        Array.isArray(plans) && plans.length > 0
            ? plans
            : [
                  {
                      name: "Plan",
                      tagline: "",
                      price: "",
                      priceSuffix: "",
                      buttonLabel: "Get started",
                      buttonLink: "",
                      highlight: false,
                      badge: "",
                  },
              ]

    const safeRows: Row[] = Array.isArray(rows) ? rows : []

    const containerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(900)

    useEffect(() => {
        const el = containerRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) setWidth(entry.contentRect.width)
        })
        ro.observe(el)
        setWidth(el.getBoundingClientRect().width)
        return () => ro.disconnect()
    }, [])

    const isMobile = width <= mobileBreakpoint

    const cellValue = (v: string) => (v == null ? "" : String(v))

    const renderMark = (raw: string, size: number, hl: boolean) => {
        const v = cellValue(raw).trim().toLowerCase()
        if (v === "yes" || v === "true" || v === "✓") {
            return (
                <Check size={size} color={hl ? highlightTextColor : yesColor} />
            )
        }
        if (v === "" || v === "no" || v === "false" || v === "✗" || v === "-") {
            return (
                <Cross
                    size={size}
                    color={hl ? highlightMutedColor : noColor}
                />
            )
        }
        return (
            <span
                style={{
                    fontSize: size * 0.8,
                    fontWeight: 600,
                    color: hl ? highlightTextColor : textColor,
                }}
            >
                {cellValue(raw)}
            </span>
        )
    }

    const theme: Theme = {
        accentColor,
        highlightTint,
        highlightTextColor,
        highlightMutedColor,
        cardColor,
        textColor,
        mutedColor,
        borderColor,
        buttonTextColor,
        showButtons,
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                ...font,
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                background: pageColor,
                borderRadius: radius,
                padding: isMobile ? 20 : 32,
                color: textColor,
                overflowY: "auto",
                overflowX: "hidden",
            }}
        >
            {(heading || subheading) && (
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: isMobile ? 20 : 32,
                    }}
                >
                    {heading && (
                        <div
                            style={{
                                fontSize: isMobile ? 22 : 28,
                                fontWeight: 800,
                                letterSpacing: -0.5,
                            }}
                        >
                            {heading}
                        </div>
                    )}
                    {subheading && (
                        <div
                            style={{
                                fontSize: isMobile ? 14 : 16,
                                color: mutedColor,
                                marginTop: 8,
                            }}
                        >
                            {subheading}
                        </div>
                    )}
                </div>
            )}

            {isMobile
                ? renderMobile(safePlans, safeRows, renderMark, theme)
                : renderTable(safePlans, safeRows, renderMark, theme)}
        </div>
    )
}

interface Theme {
    accentColor: string
    highlightTint: string
    highlightTextColor: string
    highlightMutedColor: string
    cardColor: string
    textColor: string
    mutedColor: string
    borderColor: string
    buttonTextColor: string
    showButtons: boolean
}

function renderTable(
    plans: Plan[],
    rows: Row[],
    renderMark: (raw: string, size: number, hl: boolean) => any,
    t: Theme
) {
    const cols = plans.length
    const gridCols = `minmax(160px, 1.4fr) repeat(${cols}, minmax(120px, 1fr))`
    // Grid rows: 1 header + N feature rows + (buttons ? 1 : 0)
    const gridRowCount = 1 + rows.length + (t.showButtons ? 1 : 0)
    const gridRows = `auto repeat(${rows.length}, auto)${
        t.showButtons ? " auto" : ""
    }`

    return (
        <div
            style={{
                position: "relative",
                background: t.cardColor,
                borderRadius: 20,
                border: "1px solid " + t.borderColor,
                display: "grid",
                gridTemplateColumns: gridCols,
                gridTemplateRows: gridRows,
            }}
        >
            {/* Continuous highlight blocks: one per highlighted plan, spanning
                ALL grid rows in that column. Same grid → perfect alignment. */}
            {plans.map((p, ci) =>
                p.highlight ? (
                    <div
                        key={"hl" + ci}
                        style={{
                            gridColumn: ci + 2,
                            gridRow: `1 / ${gridRowCount + 1}`,
                            background: t.highlightTint,
                            borderRadius: 16,
                            zIndex: 0,
                        }}
                    />
                ) : null
            )}

            {/* ---- Header row ---- */}
            <div style={{ gridColumn: 1, gridRow: 1 }} />
            {plans.map((p, ci) => {
                const hText = p.highlight ? t.highlightTextColor : t.textColor
                const hMuted = p.highlight
                    ? t.highlightMutedColor
                    : t.mutedColor
                return (
                    <div
                        key={"h" + ci}
                        style={{
                            gridColumn: ci + 2,
                            gridRow: 1,
                            zIndex: 1,
                            padding: 20,
                            textAlign: "center",
                        }}
                    >
                        {p.badge && (
                            <div
                                style={{
                                    display: "inline-block",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    color: p.highlight
                                        ? t.highlightTint
                                        : "#fff",
                                    background: p.highlight
                                        ? t.highlightTextColor
                                        : t.accentColor,
                                    borderRadius: 999,
                                    padding: "3px 10px",
                                    marginBottom: 8,
                                }}
                            >
                                {p.badge}
                            </div>
                        )}
                        <div
                            style={{
                                fontSize: 17,
                                fontWeight: 700,
                                color: hText,
                            }}
                        >
                            {p.name}
                        </div>
                        {p.tagline && (
                            <div
                                style={{
                                    fontSize: 12,
                                    color: hMuted,
                                    marginTop: 2,
                                }}
                            >
                                {p.tagline}
                            </div>
                        )}
                        {p.price && (
                            <div style={{ marginTop: 10 }}>
                                <span
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 800,
                                        color: hText,
                                    }}
                                >
                                    {p.price}
                                </span>
                                {p.priceSuffix && (
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: hMuted,
                                            marginLeft: 4,
                                        }}
                                    >
                                        {p.priceSuffix}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}

            {/* ---- Feature rows ---- */}
            {rows.map((row, ri) => {
                const gr = ri + 2 // header is row 1
                return (
                    <Frag key={"r" + ri}>
                        <div
                            style={{
                                gridColumn: 1,
                                gridRow: gr,
                                zIndex: 1,
                                padding: "16px 20px",
                                fontSize: 14,
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                borderTop: "1px solid " + t.borderColor,
                            }}
                        >
                            {row.label}
                        </div>
                        {plans.map((p, ci) => {
                            const divider = p.highlight
                                ? dividerOnHighlight()
                                : t.borderColor
                            return (
                                <div
                                    key={"c" + ci}
                                    style={{
                                        gridColumn: ci + 2,
                                        gridRow: gr,
                                        zIndex: 1,
                                        padding: "16px 20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderTop: "1px solid " + divider,
                                    }}
                                >
                                    {renderMark(
                                        row.values ? row.values[ci] : "",
                                        20,
                                        !!p.highlight
                                    )}
                                </div>
                            )
                        })}
                    </Frag>
                )
            })}

            {/* ---- Button row ---- */}
            {t.showButtons && (
                <Frag>
                    <div
                        style={{
                            gridColumn: 1,
                            gridRow: gridRowCount,
                            zIndex: 1,
                            padding: 20,
                            borderTop: "1px solid " + t.borderColor,
                        }}
                    />
                    {plans.map((p, ci) => {
                        const divider = p.highlight
                            ? dividerOnHighlight()
                            : t.borderColor
                        return (
                            <div
                                key={"b" + ci}
                                style={{
                                    gridColumn: ci + 2,
                                    gridRow: gridRowCount,
                                    zIndex: 1,
                                    padding: 20,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "stretch",
                                    borderTop: "1px solid " + divider,
                                }}
                            >
                                <Button plan={p} theme={t} />
                            </div>
                        )
                    })}
                </Frag>
            )}
        </div>
    )
}

// Inline fragment helper (keeps grid children flat).
function Frag({ children }: { children: any }) {
    return <>{children}</>
}

// A subtle divider color that reads on top of a highlight background.
function dividerOnHighlight(): string {
    return "rgba(255,255,255,0.18)"
}

function Button({ plan, theme }: { plan: Plan; theme: Theme }) {
    const hasLink = !!(plan.buttonLink && plan.buttonLink.length > 0)
    return (
        <a
            href={plan.buttonLink || undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                width: "100%",
                minHeight: 42,
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.25,
                whiteSpace: "normal",
                wordBreak: "break-word",
                textDecoration: "none",
                cursor: hasLink ? "pointer" : "default",
                boxSizing: "border-box",
                background: plan.highlight
                    ? theme.highlightTextColor
                    : "transparent",
                color: plan.highlight ? theme.highlightTint : theme.accentColor,
                border: plan.highlight
                    ? "none"
                    : "1.5px solid " + theme.accentColor,
            }}
        >
            {plan.buttonLabel}
        </a>
    )
}

function renderMobile(
    plans: Plan[],
    rows: Row[],
    renderMark: (raw: string, size: number, hl: boolean) => any,
    t: Theme
) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {plans.map((p, pi) => {
                const hText = p.highlight ? t.highlightTextColor : t.textColor
                const hMuted = p.highlight
                    ? t.highlightMutedColor
                    : t.mutedColor
                const rowDivider = p.highlight
                    ? dividerOnHighlight()
                    : t.borderColor
                return (
                    <div
                        key={pi}
                        style={{
                            background: p.highlight
                                ? t.highlightTint
                                : t.cardColor,
                            border:
                                "1px solid " +
                                (p.highlight ? t.highlightTint : t.borderColor),
                            borderRadius: 18,
                            padding: 24,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: hText,
                                }}
                            >
                                {p.name}
                            </span>
                            {p.badge && (
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.5,
                                        color: p.highlight
                                            ? t.highlightTint
                                            : "#fff",
                                        background: p.highlight
                                            ? t.highlightTextColor
                                            : t.accentColor,
                                        borderRadius: 999,
                                        padding: "2px 8px",
                                    }}
                                >
                                    {p.badge}
                                </span>
                            )}
                        </div>
                        {p.tagline && (
                            <div
                                style={{
                                    fontSize: 13,
                                    color: hMuted,
                                    marginBottom: 10,
                                }}
                            >
                                {p.tagline}
                            </div>
                        )}
                        {p.price && (
                            <div style={{ marginBottom: 20 }}>
                                <span
                                    style={{
                                        fontSize: 30,
                                        fontWeight: 800,
                                        color: hText,
                                    }}
                                >
                                    {p.price}
                                </span>
                                {p.priceSuffix && (
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: hMuted,
                                            marginLeft: 5,
                                        }}
                                    >
                                        {p.priceSuffix}
                                    </span>
                                )}
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                borderTop: "1px solid " + rowDivider,
                            }}
                        >
                            {rows.map((row, ri) => (
                                <div
                                    key={ri}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 16,
                                        fontSize: 14,
                                        padding: "13px 0",
                                        borderBottom:
                                            ri < rows.length - 1
                                                ? "1px solid " + rowDivider
                                                : "none",
                                    }}
                                >
                                    <span style={{ color: hMuted }}>
                                        {row.label}
                                    </span>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {renderMark(
                                            row.values ? row.values[pi] : "",
                                            18,
                                            !!p.highlight
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {t.showButtons && (
                            <div style={{ marginTop: 20 }}>
                                <Button plan={p} theme={t} />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function Check({ size, color }: { size: number; color: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Included"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

function Cross({ size, color }: { size: number; color: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Not included"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}

const defaultPlans: Plan[] = [
    {
        name: "Free",
        tagline: "For getting started",
        price: "$0",
        priceSuffix: "/mo",
        buttonLabel: "Start free",
        buttonLink: "",
        highlight: false,
        badge: "",
    },
    {
        name: "Pro",
        tagline: "For growing teams",
        price: "$19",
        priceSuffix: "/mo",
        buttonLabel: "Choose Pro",
        buttonLink: "",
        highlight: true,
        badge: "Popular",
    },
    {
        name: "Business",
        tagline: "For scale",
        price: "$49",
        priceSuffix: "/mo",
        buttonLabel: "Choose Business",
        buttonLink: "",
        highlight: false,
        badge: "",
    },
]

const defaultRows: Row[] = [
    { label: "Unlimited projects", values: ["no", "yes", "yes"] },
    { label: "Team members", values: ["1", "10", "Unlimited"] },
    { label: "Advanced analytics", values: ["no", "yes", "yes"] },
    { label: "Custom integrations", values: ["no", "yes", "yes"] },
    { label: "Priority support", values: ["no", "no", "yes"] },
    { label: "SSO & security", values: ["no", "no", "yes"] },
]

ComparisonTable.defaultProps = {
    heading: "Compare plans",
    subheading: "Pick the plan that fits your team.",
    font: { fontFamily: "Inter, sans-serif" },
    radius: 24,
    accentColor: "#6C5CE7",
    highlightTint: "#6C5CE7",
    highlightTextColor: "#FFFFFF",
    highlightMutedColor: "#D6CFF7",
    yesColor: "#22C55E",
    noColor: "#CBD5E1",
    cardColor: "#FFFFFF",
    pageColor: "#FBFAFF",
    textColor: "#1E1B2E",
    mutedColor: "#8E8AA0",
    borderColor: "#ECE9F5",
    buttonTextColor: "#6C5CE7",
    showButtons: true,
    mobileBreakpoint: 640,
    plans: defaultPlans,
    rows: defaultRows,
}

addPropertyControls(ComparisonTable, {
    heading: { type: ControlType.String, title: "Heading" },
    subheading: { type: ControlType.String, title: "Subheading" },
    plans: {
        type: ControlType.Array,
        title: "Plans",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name" },
                tagline: { type: ControlType.String, title: "Tagline" },
                price: { type: ControlType.String, title: "Price" },
                priceSuffix: {
                    type: ControlType.String,
                    title: "Price Suffix",
                },
                badge: {
                    type: ControlType.String,
                    title: "Badge",
                    placeholder: "e.g. Popular",
                },
                highlight: {
                    type: ControlType.Boolean,
                    title: "Highlight",
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
                buttonLabel: {
                    type: ControlType.String,
                    title: "Button Label",
                },
                buttonLink: {
                    type: ControlType.Link,
                    title: "Button Link",
                },
            },
        },
        description:
            "Add one entry per plan, in order. Each plan's Values list (in Feature Rows) follows this same order.",
    },
    rows: {
        type: ControlType.Array,
        title: "Feature Rows",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Feature" },
                values: {
                    type: ControlType.Array,
                    title: "Value per plan",
                    control: {
                        type: ControlType.String,
                        placeholder: "yes / no / text",
                    },
                },
            },
        },
        description:
            "Each row needs ONE value PER PLAN. Open a row → 'Value per plan' → tap 'Add' once for each plan, in the same order as your Plans list (1st value = 1st plan, 2nd = 2nd plan…). Type 'yes' for a ✓, 'no' (or leave blank) for a ✗, or any text like '10 GB'.",
    },
    showButtons: {
        type: ControlType.Boolean,
        title: "Buttons",
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    accentColor: { type: ControlType.Color, title: "Accent" },
    highlightTint: { type: ControlType.Color, title: "Highlight BG" },
    highlightTextColor: {
        type: ControlType.Color,
        title: "Highlight Text",
    },
    highlightMutedColor: {
        type: ControlType.Color,
        title: "Highlight Muted",
    },
    yesColor: { type: ControlType.Color, title: "Check Color" },
    noColor: { type: ControlType.Color, title: "Cross Color" },
    cardColor: { type: ControlType.Color, title: "Card BG" },
    pageColor: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text" },
    mutedColor: { type: ControlType.Color, title: "Muted" },
    borderColor: { type: ControlType.Color, title: "Border" },
    buttonTextColor: { type: ControlType.Color, title: "Button Text" },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile ≤",
        min: 320,
        max: 900,
        step: 10,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
})
