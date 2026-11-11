// Comparison Table — a responsive comparison table with a highlighted column.
//
// Brief: generic, brand-free comparison table for the Framer Marketplace.
// Columns and rows are edited in the properties panel, any column can be highlighted,
// cells accept text or icons (yes / no / partial), and below a breakpoint the table
// turns into stacked blocks for mobile.
//
// HOW THE HIGHLIGHT WORKS
// The highlight is not a layer positioned on top of the table. It is an item of the same
// CSS grid, placed in the highlighted column and spanning every row. Because it shares the
// column track with the cells, it can never drift out of alignment at any width.
// Every cell gets an explicit `gridRow` / `gridColumn`: without that, the browser's
// auto-placement would skip the occupied track and shift values into the wrong column.
//
// CELL SYNTAX
//   yes | ✓ | true        → check icon
//   no  | ✕ | x | false   → cross icon
//   partial | ~           → partial (dash) icon
//   yes: Unlimited        → icon followed by text (works with no: and partial: too)
//   anything else         → plain text
//   empty                 → em dash

import * as React from "react"
import { startTransition, useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Column = { title: string }
type Row = {
    feature: string
    c1?: string
    c2?: string
    c3?: string
    c4?: string
    c5?: string
}
type Kind = "yes" | "no" | "partial" | "text"

interface Colors {
    text: string
    muted: string
    border: string
    highlightFill: string
    accentFrom: string
    accentTo: string
    yes: string
    no: string
    partial: string
}

interface Labels {
    yes: string
    no: string
    partial: string
}

interface ComparisonTableProps {
    featureTitle: string
    columns: Column[]
    rows: Row[]
    highlight: number
    badge: string
    font: React.CSSProperties
    fontSize: number
    colors: Colors
    accentHeight: number
    radius: number
    gutter: number
    rowPadding: number
    featureWidth: number
    breakpoint: number
    maxWidth: number
    labels: Labels
    ariaLabel: string
    style?: React.CSSProperties
}

const MAX_COLUMNS = 5
const KEYS: Array<keyof Row> = ["c1", "c2", "c3", "c4", "c5"]

function parseCell(raw: string | undefined): { kind: Kind; text: string } {
    const value = (raw ?? "").trim()
    if (!value) return { kind: "text", text: "—" }
    const match = value.match(/^(yes|no|partial|✓|✕|~)\s*:\s*(.+)$/i)
    const token = (match ? match[1] : value).toLowerCase()
    const rest = match ? match[2] : ""
    if (["yes", "✓", "true"].includes(token)) return { kind: "yes", text: rest }
    if (["no", "✕", "x", "false"].includes(token)) return { kind: "no", text: rest }
    if (["partial", "~"].includes(token)) return { kind: "partial", text: rest }
    return { kind: "text", text: value }
}

function Icon({ kind, color, size }: { kind: Kind; color: string; size: number }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": true as const,
        style: { display: "block", flexShrink: 0 },
    }
    if (kind === "yes")
        return (
            <svg {...common}>
                <circle cx="10" cy="10" r="10" fill={color} opacity={0.14} />
                <path
                    d="M6 10.2l2.6 2.6L14 7.4"
                    stroke={color}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        )
    if (kind === "no")
        return (
            <svg {...common}>
                <circle cx="10" cy="10" r="10" fill={color} opacity={0.12} />
                <path
                    d="M7.2 7.2l5.6 5.6M12.8 7.2l-5.6 5.6"
                    stroke={color}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                />
            </svg>
        )
    return (
        <svg {...common}>
            <circle cx="10" cy="10" r="10" fill={color} opacity={0.14} />
            <path d="M6.5 10h7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </svg>
    )
}

const srOnly: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

/**
 * Comparison Table
 * Responsive comparison table with a structurally aligned highlight column.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ComparisonTable(props: ComparisonTableProps) {
    const {
        featureTitle,
        columns: rawColumns,
        rows,
        highlight,
        badge,
        font,
        fontSize,
        colors,
        accentHeight,
        radius,
        gutter,
        rowPadding,
        featureWidth,
        breakpoint,
        maxWidth,
        labels,
        ariaLabel,
        style,
    } = props

    const columns = (rawColumns ?? []).slice(0, MAX_COLUMNS)
    const hl = highlight >= 1 && highlight <= columns.length ? highlight : 0
    const fontFamily = font?.fontFamily ?? "Inter, system-ui, sans-serif"
    const accent = `linear-gradient(90deg, ${colors.accentFrom}, ${colors.accentTo})`

    // Width is measured so the layout follows the component's own width, not the viewport.
    const ref = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState<number | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        const update = (w: number) =>
            startTransition(() => setWidth((current) => (current === w ? current : w)))
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) update(entry.contentRect.width)
        })
        ro.observe(el)
        update(el.getBoundingClientRect().width)
        return () => ro.disconnect()
    }, [])

    // The first render (and the server render) is the table: that is where a layout jump
    // would be most visible.
    const stacked = width !== null && width < breakpoint
    const compact = width !== null && width < 900
    const size = compact ? Math.max(12, fontSize - 1) : fontSize
    const padV = compact ? Math.round(rowPadding * 0.8) : rowPadding
    const gut = compact ? Math.min(gutter, 28) : gutter
    const iconSize = Math.round(size * 1.25)

    const outer: React.CSSProperties = {
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        fontFamily,
        ...style,
        // Applied after `style` so the width Framer injects cannot override the cap.
        maxWidth,
        marginLeft: "auto",
        marginRight: "auto",
    }

    const iconLabel = (kind: Kind) =>
        kind === "yes" ? labels.yes : kind === "no" ? labels.no : labels.partial

    const iconColor = (kind: Kind) =>
        kind === "yes" ? colors.yes : kind === "no" ? colors.no : colors.partial

    // Icons are hidden from screen readers; the label is read instead.
    const cellContent = (raw: string | undefined) => {
        const { kind, text } = parseCell(raw)
        if (kind === "text") return <span>{text}</span>
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon kind={kind} color={iconColor(kind)} size={iconSize} />
                {text ? <span>{text}</span> : null}
                <span style={srOnly}>{text ? ` (${iconLabel(kind)})` : iconLabel(kind)}</span>
            </span>
        )
    }

    const headerLabel = (text: string, strong: boolean) => (
        <span
            style={{
                display: "block",
                fontSize: Math.max(11, size - 3),
                lineHeight: 1.3,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: strong ? 700 : 500,
                color: strong ? colors.text : colors.muted,
            }}
        >
            {text}
        </span>
    )

    const badgeEl =
        badge && hl ? (
            <span
                style={{
                    display: "inline-block",
                    marginBottom: 8,
                    padding: "3px 8px",
                    borderRadius: 999,
                    backgroundImage: accent,
                    color: "#FFFFFF",
                    fontSize: Math.max(10, size - 4),
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    lineHeight: 1.4,
                }}
            >
                {badge}
            </span>
        ) : null

    if (!columns.length || !rows?.length) {
        return (
            <div ref={ref} style={{ ...outer, padding: 24, color: colors.muted, fontSize: 14 }}>
                Add at least one column and one row in the properties panel.
            </div>
        )
    }

    // ------------------------------------------------------------------ stacked (mobile)
    if (stacked) {
        const highlightCol = hl ? hl - 1 : -1
        return (
            <div ref={ref} role="table" aria-label={ariaLabel} style={outer}>
                {rows.map((row, r) => {
                    const others = columns
                        .map((col, i) => ({ col, i }))
                        .filter(({ i }) => i !== highlightCol)
                    return (
                        <div
                            key={r}
                            role="row"
                            style={{
                                paddingBottom: 20,
                                borderTop: r === 0 ? "none" : `1px solid ${colors.border}`,
                            }}
                        >
                            <div
                                role="rowheader"
                                style={{
                                    fontSize: size + 1,
                                    lineHeight: 1.4,
                                    fontWeight: 600,
                                    color: colors.text,
                                    padding: "18px 0 12px",
                                }}
                            >
                                {row.feature}
                            </div>

                            {highlightCol >= 0 ? (
                                <div
                                    role="cell"
                                    style={{
                                        position: "relative",
                                        backgroundColor: colors.highlightFill,
                                        borderRadius: Math.max(0, radius - 4),
                                        padding: "16px 16px 14px",
                                        overflow: "hidden",
                                        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                                        marginBottom: 12,
                                    }}
                                >
                                    {accentHeight > 0 ? (
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                position: "absolute",
                                                inset: "0 0 auto 0",
                                                height: accentHeight,
                                                backgroundImage: accent,
                                            }}
                                        />
                                    ) : null}
                                    {headerLabel(columns[highlightCol].title, true)}
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: size + 1,
                                            lineHeight: 1.45,
                                            fontWeight: 600,
                                            color: colors.text,
                                        }}
                                    >
                                        {cellContent(row[KEYS[highlightCol]] as string)}
                                    </div>
                                </div>
                            ) : null}

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${Math.max(1, Math.min(others.length, 2))}, minmax(0, 1fr))`,
                                    gap: "14px 16px",
                                    padding: highlightCol >= 0 ? "0 16px" : 0,
                                }}
                            >
                                {others.map(({ col, i }) => (
                                    <div key={i} role="cell" style={{ minWidth: 0 }}>
                                        {headerLabel(col.title, false)}
                                        <div
                                            style={{
                                                marginTop: 4,
                                                fontSize: size - 1,
                                                lineHeight: 1.5,
                                                color: colors.muted,
                                            }}
                                        >
                                            {cellContent(row[KEYS[i]] as string)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // ------------------------------------------------------------------ table (desktop)
    const lastRow = rows.length + 1 // the header takes row 1
    const hlTrack = hl ? hl + 1 : 0 // the feature column is track 1

    const cellStyle = (col: number, gridRow: number, isLast: boolean): React.CSSProperties => {
        const isHl = col === hlTrack
        return {
            position: "relative",
            zIndex: 1,
            boxSizing: "border-box",
            gridColumn: col,
            gridRow, // explicit — see the note at the top of the file
            display: "flex",
            alignItems: "center",
            padding: `${padV}px ${isHl ? gut / 2 : 0}px`,
            borderBottom: isLast ? "none" : `1px solid ${colors.border}`,
            fontSize: size,
            lineHeight: 1.5,
            minWidth: 0,
        }
    }

    return (
        <div
            ref={ref}
            role="table"
            aria-label={ariaLabel}
            style={{
                ...outer,
                display: "grid",
                gridTemplateColumns: `${featureWidth}fr repeat(${columns.length}, minmax(0, 1fr))`,
                columnGap: gut,
            }}
        >
            {hl ? (
                <div
                    aria-hidden="true"
                    style={{
                        gridColumn: hlTrack,
                        gridRow: `1 / ${lastRow + 1}`,
                        marginLeft: -gut / 2,
                        marginRight: -gut / 2,
                        marginTop: -3,
                        marginBottom: -16,
                        backgroundColor: colors.highlightFill,
                        borderRadius: radius,
                        overflow: "hidden",
                        position: "relative",
                        zIndex: 0,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                    }}
                >
                    {accentHeight > 0 ? (
                        <span
                            style={{
                                position: "absolute",
                                inset: "0 0 auto 0",
                                height: accentHeight,
                                backgroundImage: accent,
                            }}
                        />
                    ) : null}
                </div>
            ) : null}

            <div role="row" style={{ display: "contents" }}>
                <div role="columnheader" style={{ ...cellStyle(1, 1, false), alignItems: "flex-end" }}>
                    {headerLabel(featureTitle, false)}
                </div>
                {columns.map((col, i) => {
                    const isHl = i + 2 === hlTrack
                    return (
                        <div
                            key={i}
                            role="columnheader"
                            style={{
                                ...cellStyle(i + 2, 1, false),
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "flex-end",
                                paddingTop: isHl && badge ? padV + 6 : padV,
                            }}
                        >
                            {isHl ? badgeEl : null}
                            {headerLabel(col.title, isHl)}
                        </div>
                    )
                })}
            </div>

            {rows.map((row, r) => {
                const isLast = r === rows.length - 1
                return (
                    <div key={r} role="row" style={{ display: "contents" }}>
                        <div
                            role="rowheader"
                            style={{
                                ...cellStyle(1, r + 2, isLast),
                                fontWeight: 500,
                                color: colors.text,
                            }}
                        >
                            {row.feature}
                        </div>
                        {columns.map((_, i) => {
                            const isHl = i + 2 === hlTrack
                            return (
                                <div
                                    key={i}
                                    role="cell"
                                    style={{
                                        ...cellStyle(i + 2, r + 2, isLast),
                                        fontWeight: isHl ? 600 : 400,
                                        color: isHl ? colors.text : colors.muted,
                                    }}
                                >
                                    {cellContent(row[KEYS[i]] as string)}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}

const cellHelp = "yes · no · partial → icon. “yes: Text” → icon + text. Anything else → text."

ComparisonTable.defaultProps = {
    featureTitle: "Features",
    columns: [{ title: "Pro" }, { title: "Basic" }, { title: "Free" }],
    rows: [
        { feature: "Projects", c1: "Unlimited", c2: "10", c3: "3" },
        { feature: "Team members", c1: "Unlimited", c2: "Up to 5", c3: "1" },
        { feature: "Custom domain", c1: "yes", c2: "yes", c3: "no" },
        { feature: "Analytics", c1: "yes: Real-time", c2: "partial", c3: "no" },
        { feature: "Priority support", c1: "yes", c2: "no", c3: "no" },
        { feature: "Price per month", c1: "$24", c2: "$12", c3: "$0" },
    ],
    highlight: 1,
    badge: "Recommended",
    fontSize: 15,
    colors: {
        text: "#111111",
        muted: "#5C5C58",
        border: "#E4E3DE",
        highlightFill: "#FFFFFF",
        accentFrom: "#FF7A18",
        accentTo: "#7B2FF7",
        yes: "#16A34A",
        no: "#9A9A93",
        partial: "#D97706",
    },
    accentHeight: 3,
    radius: 16,
    gutter: 36,
    rowPadding: 18,
    featureWidth: 1.2,
    breakpoint: 640,
    maxWidth: 1200,
    labels: { yes: "Included", no: "Not included", partial: "Partially included" },
    ariaLabel: "Plan comparison",
}

addPropertyControls(ComparisonTable, {
    featureTitle: {
        type: ControlType.String,
        title: "First Header",
        defaultValue: "Features",
    },
    columns: {
        type: ControlType.Array,
        title: "Columns",
        maxCount: MAX_COLUMNS,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Column" },
            },
        },
        defaultValue: ComparisonTable.defaultProps.columns,
    },
    rows: {
        type: ControlType.Array,
        title: "Rows",
        control: {
            type: ControlType.Object,
            controls: {
                feature: { type: ControlType.String, title: "Feature", defaultValue: "Feature" },
                c1: { type: ControlType.String, title: "Column 1", defaultValue: "yes", description: cellHelp },
                c2: { type: ControlType.String, title: "Column 2", defaultValue: "no" },
                c3: { type: ControlType.String, title: "Column 3", defaultValue: "no" },
                c4: { type: ControlType.String, title: "Column 4", defaultValue: "" },
                c5: { type: ControlType.String, title: "Column 5", defaultValue: "" },
            },
        },
        defaultValue: ComparisonTable.defaultProps.rows,
    },
    highlight: {
        type: ControlType.Number,
        title: "Highlight",
        defaultValue: 1,
        min: 0,
        max: MAX_COLUMNS,
        step: 1,
        displayStepper: true,
        description: "Column number to highlight. 0 = none.",
    },
    badge: {
        type: ControlType.String,
        title: "Badge",
        defaultValue: "Recommended",
        description: "Shown above the highlighted column. Leave empty to hide.",
        hidden: (p: Partial<ComparisonTableProps>) => !p.highlight,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 15,
        min: 12,
        max: 20,
        step: 1,
        unit: "px",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111111" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#5C5C58" },
            border: { type: ControlType.Color, title: "Dividers", defaultValue: "#E4E3DE" },
            highlightFill: { type: ControlType.Color, title: "Highlight Fill", defaultValue: "#FFFFFF" },
            accentFrom: { type: ControlType.Color, title: "Accent Start", defaultValue: "#FF7A18" },
            accentTo: { type: ControlType.Color, title: "Accent End", defaultValue: "#7B2FF7" },
            yes: { type: ControlType.Color, title: "Yes Icon", defaultValue: "#16A34A" },
            no: { type: ControlType.Color, title: "No Icon", defaultValue: "#9A9A93" },
            partial: { type: ControlType.Color, title: "Partial Icon", defaultValue: "#D97706" },
        },
    },
    accentHeight: {
        type: ControlType.Number,
        title: "Accent Bar",
        defaultValue: 3,
        min: 0,
        max: 8,
        step: 1,
        unit: "px",
        description: "Gradient bar on top of the highlight. 0 hides it.",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    gutter: {
        type: ControlType.Number,
        title: "Column Gap",
        defaultValue: 36,
        min: 12,
        max: 64,
        step: 2,
        unit: "px",
        description: "The highlight always bleeds half of this on each side.",
    },
    rowPadding: {
        type: ControlType.Number,
        title: "Row Padding",
        defaultValue: 18,
        min: 8,
        max: 32,
        step: 1,
        unit: "px",
    },
    featureWidth: {
        type: ControlType.Number,
        title: "First Column",
        defaultValue: 1.2,
        min: 0.6,
        max: 3,
        step: 0.1,
        unit: "fr",
        description: "Width of the feature column relative to the others.",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Stack Below",
        defaultValue: 640,
        min: 320,
        max: 1000,
        step: 10,
        unit: "px",
        description: "Below this component width, rows become stacked blocks.",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1200,
        min: 480,
        max: 1920,
        step: 20,
        unit: "px",
    },
    labels: {
        type: ControlType.Object,
        title: "Accessibility",
        controls: {
            yes: { type: ControlType.String, title: "Yes Label", defaultValue: "Included" },
            no: { type: ControlType.String, title: "No Label", defaultValue: "Not included" },
            partial: { type: ControlType.String, title: "Partial Label", defaultValue: "Partially included" },
        },
        description: "Read by screen readers in place of the icons.",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Table Label",
        defaultValue: "Plan comparison",
    },
})
