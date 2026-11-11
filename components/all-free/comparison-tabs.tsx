// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useReducedMotion } from "framer-motion"
import { useRef, useMemo, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────

type CellValue =
    | "check" // ✓ green check
    | "dash" // — not available
    | "custom" // show custom text

interface FeatureRow {
    label: string // Feature name
    tooltip: string // Optional description shown on hover
    col1: CellValue
    col1Custom: string
    col2: CellValue
    col2Custom: string
    col3: CellValue
    col3Custom: string
    col4: CellValue
    col4Custom: string
    isGroupHeader: boolean // Renders as a section divider
}

interface Props {
    // Columns
    columnCount: 2 | 3 | 4
    col1Label: string
    col2Label: string
    col3Label: string
    col4Label: string
    col1Subtitle: string
    col2Subtitle: string
    col3Subtitle: string
    col4Subtitle: string
    highlightColumn: 0 | 1 | 2 | 3 | 4 // 0 = none
    highlightLabel: string

    // Rows
    rows: FeatureRow[]

    // Heading
    showHeading: boolean
    heading: string
    subheading: string
    headingAlign: "left" | "center"

    // Colors
    background: string
    headerBackground: string
    rowBackground: string
    rowAltBackground: string
    highlightBg: string
    highlightHeaderBg: string
    borderColor: string
    headingColor: string
    subheadingColor: string
    columnLabelColor: string
    columnSubtitleColor: string
    featureLabelColor: string
    groupHeaderColor: string
    groupHeaderBg: string
    checkColor: string
    dashColor: string
    customValueColor: string
    tooltipBg: string
    tooltipTextColor: string

    // Typography
    font: any
    headingSize: number
    columnLabelSize: number
    columnLabelBold: boolean
    featureLabelSize: number
    featureLabelBold: boolean
    cellValueSize: number

    // Layout
    rowHeight: number
    groupHeaderHeight: number
    featureColumnMinWidth: number
    columnMinWidth: number
    borderRadius: number
    tablePadding: number

    // Animation
    animateIn: boolean
    staggerDelay: number

    // Width
    width: number | string
}

// ─── Default rows ─────────────────────────────────────────────────────

const DEFAULT_ROWS: FeatureRow[] = [
    // Group
    {
        label: "Core",
        tooltip: "",
        col1: "check",
        col1Custom: "",
        col2: "check",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: true,
    },
    {
        label: "Projects",
        tooltip: "Number of active projects allowed",
        col1: "custom",
        col1Custom: "3",
        col2: "custom",
        col2Custom: "10",
        col3: "custom",
        col3Custom: "Unlimited",
        col4: "custom",
        col4Custom: "Unlimited",
        isGroupHeader: false,
    },
    {
        label: "Team members",
        tooltip: "Users who can access the workspace",
        col1: "custom",
        col1Custom: "1",
        col2: "custom",
        col2Custom: "5",
        col3: "custom",
        col3Custom: "25",
        col4: "custom",
        col4Custom: "Unlimited",
        isGroupHeader: false,
    },
    {
        label: "Storage",
        tooltip: "",
        col1: "custom",
        col1Custom: "5 GB",
        col2: "custom",
        col2Custom: "50 GB",
        col3: "custom",
        col3Custom: "500 GB",
        col4: "custom",
        col4Custom: "Custom",
        isGroupHeader: false,
    },
    {
        label: "Custom domain",
        tooltip: "",
        col1: "dash",
        col1Custom: "",
        col2: "check",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: false,
    },
    // Group
    {
        label: "Features",
        tooltip: "",
        col1: "check",
        col1Custom: "",
        col2: "check",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: true,
    },
    {
        label: "Analytics",
        tooltip: "Track visits, clicks, and conversions",
        col1: "dash",
        col1Custom: "",
        col2: "check",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: false,
    },
    {
        label: "A/B Testing",
        tooltip: "",
        col1: "dash",
        col1Custom: "",
        col2: "dash",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: false,
    },
    {
        label: "API access",
        tooltip: "Programmatic access to your data",
        col1: "dash",
        col1Custom: "",
        col2: "dash",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: false,
    },
    {
        label: "Priority support",
        tooltip: "",
        col1: "dash",
        col1Custom: "",
        col2: "dash",
        col2Custom: "",
        col3: "dash",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: false,
    },
    // Group
    {
        label: "Security",
        tooltip: "",
        col1: "check",
        col1Custom: "",
        col2: "check",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: true,
    },
    {
        label: "SSL certificate",
        tooltip: "",
        col1: "check",
        col1Custom: "",
        col2: "check",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: false,
    },
    {
        label: "SSO / SAML",
        tooltip: "Single sign-on for enterprise teams",
        col1: "dash",
        col1Custom: "",
        col2: "dash",
        col2Custom: "",
        col3: "dash",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: false,
    },
    {
        label: "Audit logs",
        tooltip: "",
        col1: "dash",
        col1Custom: "",
        col2: "dash",
        col2Custom: "",
        col3: "check",
        col3Custom: "",
        col4: "check",
        col4Custom: "",
        isGroupHeader: false,
    },
]

// ─── Check icon ────────────────────────────────────────────────────────

function CheckMark({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 18 18"
            fill="none"
            aria-label="Included"
            style={{ display: "block", flexShrink: 0 }}
        >
            <circle cx={9} cy={9} r={8.5} stroke={color} strokeOpacity={0.2} />
            <polyline
                points="5,9 8,12 13,6"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// ─── Dash icon ─────────────────────────────────────────────────────────

function DashMark({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 18 18"
            fill="none"
            aria-label="Not included"
            style={{ display: "block", flexShrink: 0 }}
        >
            <line
                x1={5}
                y1={9}
                x2={13}
                y2={9}
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
        </svg>
    )
}

// ─── Tooltip ────────────────────────────────────────────────────────────

function Tooltip({
    text,
    tooltipBg,
    tooltipTextColor,
}: {
    text: string
    tooltipBg: string
    tooltipTextColor: string
}) {
    const [show, setShow] = useState(false)

    return (
        <span
            style={{
                position: "relative",
                display: "inline-flex",
                marginLeft: 6,
            }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span
                style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "1.5px solid currentColor",
                    opacity: 0.3,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: "default",
                    lineHeight: 1,
                    flexShrink: 0,
                    userSelect: "none",
                }}
            >
                i
            </span>
            {show && (
                <span
                    style={{
                        position: "absolute",
                        bottom: "calc(100% + 8px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: tooltipBg,
                        color: tooltipTextColor,
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: 1.5,
                        padding: "6px 10px",
                        borderRadius: 8,
                        whiteSpace: "nowrap",
                        zIndex: 100,
                        pointerEvents: "none",
                        letterSpacing: "-0.01em",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    }}
                >
                    {text}
                </span>
            )}
        </span>
    )
}

// ─── Cell value renderer ────────────────────────────────────────────────

function CellValue({
    value,
    custom,
    checkColor,
    dashColor,
    customValueColor,
    cellValueSize,
}: {
    value: CellValue
    custom: string
    checkColor: string
    dashColor: string
    customValueColor: string
    cellValueSize: number
}) {
    if (value === "check") {
        return <CheckMark color={checkColor} size={cellValueSize + 2} />
    }
    if (value === "dash") {
        return <DashMark color={dashColor} size={cellValueSize + 2} />
    }
    return (
        <span
            style={{
                fontSize: cellValueSize,
                fontWeight: 500,
                color: customValueColor,
                lineHeight: 1,
                letterSpacing: "-0.01em",
            }}
        >
            {custom || "—"}
        </span>
    )
}

// ─── Main component ─────────────────────────────────────────────────────

export default function CompareTable({
    columnCount,
    col1Label,
    col2Label,
    col3Label,
    col4Label,
    col1Subtitle,
    col2Subtitle,
    col3Subtitle,
    col4Subtitle,
    highlightColumn,
    highlightLabel,
    rows,
    showHeading,
    heading,
    subheading,
    headingAlign,
    background,
    headerBackground,
    rowBackground,
    rowAltBackground,
    highlightBg,
    highlightHeaderBg,
    borderColor,
    headingColor,
    subheadingColor,
    columnLabelColor,
    columnSubtitleColor,
    featureLabelColor,
    groupHeaderColor,
    groupHeaderBg,
    checkColor,
    dashColor,
    customValueColor,
    tooltipBg,
    tooltipTextColor,
    font,
    headingSize,
    columnLabelSize,
    columnLabelBold,
    featureLabelSize,
    featureLabelBold,
    cellValueSize,
    rowHeight,
    groupHeaderHeight,
    featureColumnMinWidth,
    columnMinWidth,
    borderRadius,
    tablePadding,
    animateIn,
    staggerDelay,
    width,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion() ?? false
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true, margin: "-60px 0px" })

    const safeRows = rows?.length ? rows : DEFAULT_ROWS
    const cols = Math.min(Math.max(columnCount ?? 3, 2), 4)

    const colLabels = [col1Label, col2Label, col3Label, col4Label].slice(
        0,
        cols
    )
    const colSubs = [
        col1Subtitle,
        col2Subtitle,
        col3Subtitle,
        col4Subtitle,
    ].slice(0, cols)

    // Feature column width vs data columns
    const featureColWidth = "38%"
    const dataColWidth = `${62 / cols}%`
    const tableMinWidth = useMemo(() => {
        return featureColumnMinWidth + columnMinWidth * cols
    }, [featureColumnMinWidth, columnMinWidth, cols])

    const shouldAnimate = animateIn && !isStatic && !reduced
    const show = shouldAnimate ? inView : true
    const sharedFontStyle = useMemo(() => ({ ...(font ?? {}) }), [font])

    // Column index that gets highlighted (1-based from prop, 0-based internally)
    const normalizedHighlightColumn =
        (highlightColumn ?? 0) >= 1 && (highlightColumn ?? 0) <= cols
            ? (highlightColumn ?? 0)
            : 0
    const highlightIdx = normalizedHighlightColumn - 1 // -1 = none

    return (
        <div
            ref={ref}
            style={{
                width: width ?? "100%",
                background,
                boxSizing: "border-box",
                ...sharedFontStyle,
            }}
        >
            {/* Heading */}
            {showHeading && (
                <motion.div
                    initial={shouldAnimate ? { opacity: 0, y: 16 } : {}}
                    animate={show ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        textAlign: headingAlign,
                        marginBottom: 32,
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: headingSize,
                            fontWeight: 700,
                            color: headingColor,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                        }}
                    >
                        {heading}
                    </h2>
                    {subheading && (
                        <p
                            style={{
                                margin: "10px 0 0",
                                fontSize: 15,
                                color: subheadingColor,
                                lineHeight: 1.6,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {subheading}
                        </p>
                    )}
                </motion.div>
            )}

            {/* Table */}
            <motion.div
                initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
                animate={show ? { opacity: 1, y: 0 } : {}}
                transition={{
                    duration: 0.5,
                    delay: 0.1,
                    ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                    width: "100%",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    <div
                        style={{
                            minWidth: tableMinWidth,
                            width: "100%",
                            borderRadius,
                            border: `1px solid ${borderColor}`,
                            overflow: "hidden",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* Column headers */}
                        <div
                            style={{
                                display: "flex",
                                background: headerBackground,
                                borderBottom: `1px solid ${borderColor}`,
                            }}
                        >
                            {/* Feature label header */}
                            <div
                                style={{
                                    width: featureColWidth,
                                    minWidth: featureColumnMinWidth,
                                    flexShrink: 0,
                                    padding: `${tablePadding}px`,
                                    boxSizing: "border-box",
                                }}
                            />

                            {/* Column headers */}
                            {colLabels.map((label, i) => {
                                const isHighlighted = i === highlightIdx
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            width: dataColWidth,
                                            minWidth: columnMinWidth,
                                            flexShrink: 0,
                                            flexGrow: 1,
                                            padding: `${tablePadding}px ${tablePadding * 0.75}px`,
                                            textAlign: "center",
                                            background: isHighlighted
                                                ? highlightHeaderBg
                                                : undefined,
                                            position: "relative",
                                            borderLeft:
                                                i > 0
                                                    ? `1px solid ${borderColor}`
                                                    : undefined,
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        {isHighlighted && highlightLabel && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: -1,
                                                    left: "50%",
                                                    transform:
                                                        "translateX(-50%)",
                                                    background: checkColor,
                                                    color: "#fff",
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.05em",
                                                    textTransform: "uppercase",
                                                    padding: "3px 10px",
                                                    borderRadius: "0 0 8px 8px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {highlightLabel}
                                            </span>
                                        )}
                                        <div
                                            style={{
                                                fontSize: columnLabelSize,
                                                fontWeight: columnLabelBold
                                                    ? 600
                                                    : 400,
                                                color: columnLabelColor,
                                                letterSpacing: "-0.02em",
                                                lineHeight: 1.2,
                                                marginTop:
                                                    isHighlighted &&
                                                    highlightLabel
                                                        ? 14
                                                        : 0,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {label}
                                        </div>
                                        {colSubs[i] && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: columnSubtitleColor,
                                                    marginTop: 3,
                                                    letterSpacing: "-0.01em",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {colSubs[i]}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Rows */}
                        {safeRows.map((row, rowIdx) => {
                            const dataValues = [
                                { value: row.col1, custom: row.col1Custom },
                                { value: row.col2, custom: row.col2Custom },
                                { value: row.col3, custom: row.col3Custom },
                                { value: row.col4, custom: row.col4Custom },
                            ].slice(0, cols)

                            const isAlt = !row.isGroupHeader && rowIdx % 2 === 0
                            const delay = shouldAnimate
                                ? Math.min(0.15 + rowIdx * staggerDelay, 0.6)
                                : 0

                            if (row.isGroupHeader) {
                                return (
                                    <motion.div
                                        key={rowIdx}
                                        initial={
                                            shouldAnimate ? { opacity: 0 } : {}
                                        }
                                        animate={show ? { opacity: 1 } : {}}
                                        transition={{
                                            duration: 0.35,
                                            delay,
                                            ease: "easeOut",
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            height: groupHeaderHeight,
                                            background: groupHeaderBg,
                                            borderTop:
                                                rowIdx > 0
                                                    ? `1px solid ${borderColor}`
                                                    : undefined,
                                            borderBottom: `1px solid ${borderColor}`,
                                            paddingLeft: tablePadding,
                                            paddingRight: tablePadding,
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: "0.07em",
                                                textTransform: "uppercase",
                                                color: groupHeaderColor,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {row.label}
                                        </span>
                                    </motion.div>
                                )
                            }

                            return (
                                <motion.div
                                    key={rowIdx}
                                    initial={
                                        shouldAnimate
                                            ? { opacity: 0, x: -8 }
                                            : {}
                                    }
                                    animate={show ? { opacity: 1, x: 0 } : {}}
                                    transition={{
                                        duration: 0.38,
                                        delay,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        height: rowHeight,
                                        background: isAlt
                                            ? rowAltBackground
                                            : rowBackground,
                                        borderTop: `1px solid ${borderColor}`,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {/* Feature label */}
                                    <div
                                        style={{
                                            width: featureColWidth,
                                            minWidth: featureColumnMinWidth,
                                            flexShrink: 0,
                                            paddingLeft: tablePadding,
                                            paddingRight: tablePadding * 0.5,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: featureLabelSize,
                                                fontWeight: featureLabelBold
                                                    ? 600
                                                    : 400,
                                                color: featureLabelColor,
                                                letterSpacing: "-0.01em",
                                                lineHeight: 1.3,
                                                whiteSpace: "normal",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {row.label}
                                        </span>
                                        {row.tooltip && (
                                            <Tooltip
                                                text={row.tooltip}
                                                tooltipBg={tooltipBg}
                                                tooltipTextColor={
                                                    tooltipTextColor
                                                }
                                            />
                                        )}
                                    </div>

                                    {/* Data cells */}
                                    {dataValues.map((cell, colIdx) => {
                                        const isHighlighted =
                                            colIdx === highlightIdx
                                        return (
                                            <div
                                                key={colIdx}
                                                style={{
                                                    width: dataColWidth,
                                                    minWidth: columnMinWidth,
                                                    flexShrink: 0,
                                                    flexGrow: 1,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    height: "100%",
                                                    background: isHighlighted
                                                        ? highlightBg
                                                        : undefined,
                                                    borderLeft: `1px solid ${borderColor}`,
                                                    boxSizing: "border-box",
                                                }}
                                            >
                                                <CellValue
                                                    value={
                                                        cell.value as CellValue
                                                    }
                                                    custom={cell.custom}
                                                    checkColor={checkColor}
                                                    dashColor={dashColor}
                                                    customValueColor={
                                                        customValueColor
                                                    }
                                                    cellValueSize={
                                                        cellValueSize
                                                    }
                                                />
                                            </div>
                                        )
                                    })}
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// ─── Default props ─────────────────────────────────────────────────────

CompareTable.defaultProps = {
    columnCount: 3,
    col1Label: "Starter",
    col2Label: "Pro",
    col3Label: "Business",
    col4Label: "Enterprise",
    col1Subtitle: "Free forever",
    col2Subtitle: "$12 / month",
    col3Subtitle: "$39 / month",
    col4Subtitle: "Custom pricing",
    highlightColumn: 2,
    highlightLabel: "Most popular",

    rows: DEFAULT_ROWS,

    showHeading: true,
    heading: "Compare plans",
    subheading: "Everything you need, at every stage of your journey.",
    headingAlign: "left",

    background: "transparent",
    headerBackground: "#f9fafb",
    rowBackground: "#ffffff",
    rowAltBackground: "#fafafa",
    highlightBg: "#f5f3ff",
    highlightHeaderBg: "#ede9fe",
    borderColor: "#e5e7eb",
    headingColor: "#111111",
    subheadingColor: "#6b7280",
    columnLabelColor: "#111111",
    columnSubtitleColor: "#9ca3af",
    featureLabelColor: "#374151",
    groupHeaderColor: "#9ca3af",
    groupHeaderBg: "#f3f4f6",
    checkColor: "#6366f1",
    dashColor: "#d1d5db",
    customValueColor: "#111111",
    tooltipBg: "#111111",
    tooltipTextColor: "#ffffff",

    font: {
        fontSize: "15px",
        variant: "Medium",
        letterSpacing: "-0.01em",
        lineHeight: "1.3em",
    },
    headingSize: 32,
    columnLabelSize: 15,
    columnLabelBold: true,
    featureLabelSize: 13.5,
    featureLabelBold: false,
    cellValueSize: 13,

    rowHeight: 48,
    groupHeaderHeight: 36,
    featureColumnMinWidth: 180,
    columnMinWidth: 120,
    borderRadius: 12,
    tablePadding: 20,

    animateIn: true,
    staggerDelay: 0.035,

    width: "100%",
} as Partial<Props>

// ─── Property controls ──────────────────────────────────────────────────

addPropertyControls(CompareTable, {
    // ══ HEADING ═══════════════════════════════════════════════════
    showHeading: {
        type: ControlType.Boolean,
        title: "Show Heading",
        defaultValue: true,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Compare plans",
        hidden: (p) => !p.showHeading,
    },
    subheading: {
        type: ControlType.String,
        title: "Sub-heading",
        defaultValue: "Everything you need, at every stage.",
        displayTextArea: true,
        hidden: (p) => !p.showHeading,
    },
    headingAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        displaySegmentedControl: true,
        defaultValue: "left",
        hidden: (p) => !p.showHeading,
    },

    // ══ COLUMNS ═══════════════════════════════════════════════════
    columnCount: {
        type: ControlType.Enum,
        title: "Column Count",
        options: [2, 3, 4],
        optionTitles: ["2 columns", "3 columns", "4 columns"],
        defaultValue: 3,
        description:
            "Number of comparison columns (not counting the feature label column).",
    },
    col1Label: {
        type: ControlType.String,
        title: "Col 1 Label",
        defaultValue: "Starter",
    },
    col1Subtitle: {
        type: ControlType.String,
        title: "Col 1 Subtitle",
        defaultValue: "Free forever",
        description: "Price or short tagline below column name.",
    },
    col2Label: {
        type: ControlType.String,
        title: "Col 2 Label",
        defaultValue: "Pro",
    },
    col2Subtitle: {
        type: ControlType.String,
        title: "Col 2 Subtitle",
        defaultValue: "$12 / month",
    },
    col3Label: {
        type: ControlType.String,
        title: "Col 3 Label",
        defaultValue: "Business",
        hidden: (p) => (p.columnCount ?? 3) < 3,
    },
    col3Subtitle: {
        type: ControlType.String,
        title: "Col 3 Subtitle",
        defaultValue: "$39 / month",
        hidden: (p) => (p.columnCount ?? 3) < 3,
    },
    col4Label: {
        type: ControlType.String,
        title: "Col 4 Label",
        defaultValue: "Enterprise",
        hidden: (p) => (p.columnCount ?? 3) < 4,
    },
    col4Subtitle: {
        type: ControlType.String,
        title: "Col 4 Subtitle",
        defaultValue: "Custom pricing",
        hidden: (p) => (p.columnCount ?? 3) < 4,
    },
    highlightColumn: {
        type: ControlType.Enum,
        title: "Highlight Column",
        options: [0, 1, 2, 3, 4],
        optionTitles: ["None", "Column 1", "Column 2", "Column 3", "Column 4"],
        defaultValue: 2,
        description:
            "Visually emphasize one column with a different background. Selections above the active column count are ignored.",
    },
    highlightLabel: {
        type: ControlType.String,
        title: "Highlight Badge",
        defaultValue: "Most popular",
        description: "Badge text shown at the top of the highlighted column.",
        hidden: (p) => {
            const count = p.columnCount ?? 3
            const selected = p.highlightColumn ?? 0
            return selected === 0 || selected > count
        },
    },

    // ══ ROWS ══════════════════════════════════════════════════════
    rows: {
        type: ControlType.Array,
        title: "Rows",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Feature",
                    description: "Feature name, or group header text.",
                },
                isGroupHeader: {
                    type: ControlType.Boolean,
                    title: "Section Header",
                    defaultValue: false,
                    description:
                        "Turns this row into a section divider (spans full width).",
                },
                tooltip: {
                    type: ControlType.String,
                    title: "Tooltip",
                    defaultValue: "",
                    description:
                        "Optional hover explanation. Leave blank to hide.",
                },
                col1: {
                    type: ControlType.Enum,
                    title: "Col 1",
                    options: ["check", "dash", "custom"],
                    optionTitles: ["✓ Check", "— Dash", "Custom text"],
                    defaultValue: "check",
                },
                col1Custom: {
                    type: ControlType.String,
                    title: "Col 1 Text",
                    defaultValue: "",
                    description:
                        "Text shown when Col 1 is set to 'Custom text'.",
                },
                col2: {
                    type: ControlType.Enum,
                    title: "Col 2",
                    options: ["check", "dash", "custom"],
                    optionTitles: ["✓ Check", "— Dash", "Custom text"],
                    defaultValue: "check",
                },
                col2Custom: {
                    type: ControlType.String,
                    title: "Col 2 Text",
                    defaultValue: "",
                },
                col3: {
                    type: ControlType.Enum,
                    title: "Col 3",
                    options: ["check", "dash", "custom"],
                    optionTitles: ["✓ Check", "— Dash", "Custom text"],
                    defaultValue: "check",
                },
                col3Custom: {
                    type: ControlType.String,
                    title: "Col 3 Text",
                    defaultValue: "",
                },
                col4: {
                    type: ControlType.Enum,
                    title: "Col 4",
                    options: ["check", "dash", "custom"],
                    optionTitles: ["✓ Check", "— Dash", "Custom text"],
                    defaultValue: "check",
                },
                col4Custom: {
                    type: ControlType.String,
                    title: "Col 4 Text",
                    defaultValue: "",
                },
            },
        },
        description:
            "Each row is one feature. Toggle 'Section Header' to add a group divider row.",
    },

    // ══ COLORS ════════════════════════════════════════════════════
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
    headerBackground: {
        type: ControlType.Color,
        title: "Header Row BG",
        defaultValue: "#f9fafb",
        description: "Background of the column label header row.",
    },
    rowBackground: {
        type: ControlType.Color,
        title: "Row BG",
        defaultValue: "#ffffff",
    },
    rowAltBackground: {
        type: ControlType.Color,
        title: "Alt Row BG",
        defaultValue: "#fafafa",
        description: "Alternating row background for easier scanning.",
    },
    highlightBg: {
        type: ControlType.Color,
        title: "Highlight Cell BG",
        defaultValue: "#f5f3ff",
        description: "Background of cells in the highlighted column.",
        hidden: (p) => {
            const count = p.columnCount ?? 3
            const selected = p.highlightColumn ?? 0
            return selected === 0 || selected > count
        },
    },
    highlightHeaderBg: {
        type: ControlType.Color,
        title: "Highlight Header BG",
        defaultValue: "#ede9fe",
        hidden: (p) => {
            const count = p.columnCount ?? 3
            const selected = p.highlightColumn ?? 0
            return selected === 0 || selected > count
        },
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#e5e7eb",
    },
    checkColor: {
        type: ControlType.Color,
        title: "✓ Check Color",
        defaultValue: "#6366f1",
    },
    dashColor: {
        type: ControlType.Color,
        title: "— Dash Color",
        defaultValue: "#d1d5db",
    },
    customValueColor: {
        type: ControlType.Color,
        title: "Custom Text Color",
        defaultValue: "#111111",
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#111111",
        hidden: (p) => !p.showHeading,
    },
    subheadingColor: {
        type: ControlType.Color,
        title: "Sub-heading Color",
        defaultValue: "#6b7280",
        hidden: (p) => !p.showHeading,
    },
    columnLabelColor: {
        type: ControlType.Color,
        title: "Column Label Color",
        defaultValue: "#111111",
    },
    columnSubtitleColor: {
        type: ControlType.Color,
        title: "Column Subtitle Color",
        defaultValue: "#9ca3af",
    },
    featureLabelColor: {
        type: ControlType.Color,
        title: "Feature Label Color",
        defaultValue: "#374151",
    },
    groupHeaderColor: {
        type: ControlType.Color,
        title: "Group Header Text",
        defaultValue: "#9ca3af",
    },
    groupHeaderBg: {
        type: ControlType.Color,
        title: "Group Header BG",
        defaultValue: "#f3f4f6",
    },
    tooltipBg: {
        type: ControlType.Color,
        title: "Tooltip BG",
        defaultValue: "#111111",
    },
    tooltipTextColor: {
        type: ControlType.Color,
        title: "Tooltip Text",
        defaultValue: "#ffffff",
    },

    // ══ TYPOGRAPHY ════════════════════════════════════════════════
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    headingSize: {
        type: ControlType.Number,
        title: "Heading Size",
        defaultValue: 32,
        min: 18,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (p) => !p.showHeading,
    },
    columnLabelSize: {
        type: ControlType.Number,
        title: "Column Label Size",
        defaultValue: 15,
        min: 11,
        max: 22,
        step: 1,
        unit: "px",
    },
    columnLabelBold: {
        type: ControlType.Boolean,
        title: "Column Label Bold",
        defaultValue: true,
    },
    featureLabelSize: {
        type: ControlType.Number,
        title: "Feature Label Size",
        defaultValue: 13.5,
        min: 11,
        max: 18,
        step: 0.5,
        unit: "px",
    },
    featureLabelBold: {
        type: ControlType.Boolean,
        title: "Feature Label Bold",
        defaultValue: false,
    },
    cellValueSize: {
        type: ControlType.Number,
        title: "Cell Value Size",
        defaultValue: 13,
        min: 10,
        max: 18,
        step: 1,
        unit: "px",
    },

    // ══ LAYOUT ════════════════════════════════════════════════════
    rowHeight: {
        type: ControlType.Number,
        title: "Row Height",
        defaultValue: 48,
        min: 36,
        max: 80,
        step: 2,
        unit: "px",
    },
    groupHeaderHeight: {
        type: ControlType.Number,
        title: "Group Header Height",
        defaultValue: 36,
        min: 28,
        max: 56,
        step: 2,
        unit: "px",
    },
    featureColumnMinWidth: {
        type: ControlType.Number,
        title: "Feature Col Min",
        defaultValue: 180,
        min: 120,
        max: 360,
        step: 4,
        unit: "px",
        description: "Minimum width for the first (feature label) column.",
    },
    columnMinWidth: {
        type: ControlType.Number,
        title: "Data Col Min",
        defaultValue: 120,
        min: 40,
        max: 280,
        step: 4,
        unit: "px",
        description: "Minimum width for each comparison data column.",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Table Radius",
        defaultValue: 12,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },
    tablePadding: {
        type: ControlType.Number,
        title: "Cell Padding",
        defaultValue: 20,
        min: 10,
        max: 40,
        step: 2,
        unit: "px",
        description: "Horizontal padding inside each cell.",
    },

    // ══ ANIMATION ═════════════════════════════════════════════════
    animateIn: {
        type: ControlType.Boolean,
        title: "Animate on Scroll",
        defaultValue: true,
        description: "Fade and slide rows in when the table scrolls into view.",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Row Stagger",
        defaultValue: 0.035,
        min: 0,
        max: 0.1,
        step: 0.005,
        unit: "s",
        description: "Time between each row animating in.",
        hidden: (p) => !p.animateIn,
    },
})
