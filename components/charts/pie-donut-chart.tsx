import React, { useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ChartItem {
    label: string
    value: number
    color: string
}

interface PieChartProps {
    items: ChartItem[]
    innerRadiusPercent: number
    centerValueText: string
    centerLabelText: string
    showCenterText: boolean
    showSliceValue: boolean
    centerValueFontSize: number
    centerValueColor: string
    centerLabelFontSize: number
    centerLabelColor: string
    sliceTextFontSize: number
    sliceTextColor: string
    fontFamily: string
    popOutDistance: number
    // Legend Props
    showLegend: boolean
    showLegendValues: boolean
    legendFontSize: number
    legendTextColor: string
    legendGap: number
    legendBoxSize: number
    legendBoxRadius: number
}

export default function PieChart(props: PieChartProps) {
    const {
        items = [],
        innerRadiusPercent = 55,
        centerValueText = "95.67%",
        centerLabelText = "OVERALL",
        showCenterText = true,
        showSliceValue = true,
        centerValueFontSize = 20,
        centerValueColor = "#1A1A1A",
        centerLabelFontSize = 11,
        centerLabelColor = "#666666",
        sliceTextFontSize = 12,
        sliceTextColor = "#FFFFFF",
        fontFamily = "Inter, sans-serif",
        popOutDistance = 12,
        showLegend = true,
        showLegendValues = true,
        legendFontSize = 13,
        legendTextColor = "#333333",
        legendGap = 16,
        legendBoxSize = 12,
        legendBoxRadius = 3,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    // Calculate total sum of values to normalize slice angles
    const totalValue = items.reduce((acc, curr) => acc + (curr.value || 0), 0)

    // SVG parameters
    const size = 300
    const center = size / 2
    const outerRadius = 140
    const innerRadius = (outerRadius * innerRadiusPercent) / 100

    // Compute cumulative angles
    let currentAngle = -90 // Start at top (12 o'clock)

    const slices = items.map((item, index) => {
        const val = item.value || 0
        const percentage = totalValue > 0 ? (val / totalValue) * 100 : 0
        const angleSpan = totalValue > 0 ? (val / totalValue) * 360 : 0

        const startAngle = currentAngle
        const endAngle = currentAngle + angleSpan
        const midAngle = startAngle + angleSpan / 2
        currentAngle = endAngle

        // Trigonometry to build SVG Arc Path
        const startRad = (Math.PI / 180) * startAngle
        const endRad = (Math.PI / 180) * endAngle
        const midRad = (Math.PI / 180) * midAngle

        const x1Outer = center + outerRadius * Math.cos(startRad)
        const y1Outer = center + outerRadius * Math.sin(startRad)
        const x2Outer = center + outerRadius * Math.cos(endRad)
        const y2Outer = center + outerRadius * Math.sin(endRad)

        const x1Inner = center + innerRadius * Math.cos(endRad)
        const y1Inner = center + innerRadius * Math.sin(endRad)
        const x2Inner = center + innerRadius * Math.cos(startRad)
        const y2Inner = center + innerRadius * Math.sin(startRad)

        const largeArcFlag = angleSpan > 180 ? 1 : 0

        // Combined donut arc path
        const pathData = [
            `M ${x1Outer} ${y1Outer}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
            `L ${x1Inner} ${y1Inner}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}`,
            "Z",
        ].join(" ")

        // Label position inside slice arc center
        const labelRadius = innerRadius + (outerRadius - innerRadius) / 2
        const labelX = center + labelRadius * Math.cos(midRad)
        const labelY = center + labelRadius * Math.sin(midRad)

        // Translation offset when hovered/focused
        const isHovered = hoveredIndex === index
        const translateX = isHovered ? Math.cos(midRad) * popOutDistance : 0
        const translateY = isHovered ? Math.sin(midRad) * popOutDistance : 0

        return {
            ...item,
            percentage,
            pathData,
            labelX,
            labelY,
            translateX,
            translateY,
            isHovered,
            index,
        }
    })

    // Construct summary description for accessibility
    const summaryDescription = items
        .map(
            (i) =>
                `${i.label}: ${i.value} (${totalValue > 0 ? ((i.value / totalValue) * 100).toFixed(1) : 0}%)`
        )
        .join(", ")

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily,
                position: "relative",
                boxSizing: "border-box",
                padding: "16px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: `${size}px`,
                    height: `${size}px`,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    role="img"
                    aria-label={`Donut chart showing data breakdown: ${summaryDescription}`}
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "visible",
                    }}
                >
                    <title>Pie and Donut Chart Breakdown</title>
                    <desc>{summaryDescription}</desc>

                    <defs>
                        <filter
                            id="sliceShadow"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                        >
                            <feDropShadow
                                dx="0"
                                dy="4"
                                stdDeviation="6"
                                floodOpacity="0.25"
                            />
                        </filter>
                    </defs>

                    {/* Render Slices with Accessibility & Keyboard Focus */}
                    {slices.map((slice) => (
                        <g
                            key={slice.index}
                            role="button"
                            tabIndex={0}
                            aria-label={`${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`}
                            style={{
                                transform: `translate(${slice.translateX}px, ${slice.translateY}px)`,
                                transition:
                                    "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                cursor: "pointer",
                                outline: "none",
                            }}
                            onMouseEnter={() => setHoveredIndex(slice.index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onFocus={() => setHoveredIndex(slice.index)}
                            onBlur={() => setHoveredIndex(null)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    setHoveredIndex(
                                        hoveredIndex === slice.index
                                            ? null
                                            : slice.index
                                    )
                                }
                            }}
                            filter={
                                slice.isHovered ? "url(#sliceShadow)" : "none"
                            }
                        >
                            <path
                                d={slice.pathData}
                                fill={slice.color}
                                stroke="#FFFFFF"
                                strokeWidth="1.5"
                            />
                            {/* Slice Percentage Label */}
                            {showSliceValue && slice.percentage > 4 && (
                                <text
                                    x={slice.labelX}
                                    y={slice.labelY}
                                    fill={sliceTextColor}
                                    fontSize={sliceTextFontSize}
                                    fontWeight="600"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    style={{ pointerEvents: "none" }}
                                >
                                    {slice.percentage.toFixed(1)}%
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Center Content / Overall Text */}
                    {showCenterText && (
                        <g style={{ pointerEvents: "none" }}>
                            <text
                                x={center}
                                y={center - 6}
                                fill={centerValueColor}
                                fontSize={centerValueFontSize}
                                fontWeight="700"
                                textAnchor="middle"
                                dominantBaseline="central"
                            >
                                {centerValueText}
                            </text>
                            <text
                                x={center}
                                y={center + 14}
                                fill={centerLabelColor}
                                fontSize={centerLabelFontSize}
                                fontWeight="600"
                                letterSpacing="0.5px"
                                textAnchor="middle"
                                dominantBaseline="central"
                            >
                                {centerLabelText}
                            </text>
                        </g>
                    )}
                </svg>
            </div>

            {/* Custom Legend Section with Keyboard Accessibility */}
            {showLegend && (
                <div
                    role="region"
                    aria-label="Chart Legend"
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: `${legendGap}px`,
                        marginTop: "20px",
                        width: "100%",
                    }}
                >
                    {items.map((item, index) => (
                        <div
                            key={index}
                            role="button"
                            tabIndex={0}
                            aria-label={`Highlight ${item.label}, value ${item.value}`}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onFocus={() => setHoveredIndex(index)}
                            onBlur={() => setHoveredIndex(null)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    setHoveredIndex(
                                        hoveredIndex === index ? null : index
                                    )
                                }
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer",
                                opacity:
                                    hoveredIndex === null ||
                                    hoveredIndex === index
                                        ? 1
                                        : 0.5,
                                transition: "opacity 0.2s ease",
                                outline: "none",
                                borderRadius: "4px",
                                padding: "2px 4px",
                            }}
                        >
                            <div
                                style={{
                                    width: `${legendBoxSize}px`,
                                    height: `${legendBoxSize}px`,
                                    backgroundColor: item.color,
                                    borderRadius: `${legendBoxRadius}px`,
                                    flexShrink: 0,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: `${legendFontSize}px`,
                                    color: legendTextColor,
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.label}
                                {showLegendValues && ` (${item.value})`}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Framer Canvas Property Controls
addPropertyControls(PieChart, {
    showSliceValue: {
        type: ControlType.Boolean,
        title: "Slice Text",
        defaultValue: true,
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Item",
                },
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    min: 0,
                    defaultValue: 10,
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#00B4D8",
                },
            },
        },
        defaultValue: [
            { label: "Beginner", value: 150, color: "#3B82F6" },
            { label: "Intermediate", value: 120, color: "#EF4444" },
            { label: "Advanced", value: 80, color: "#F59E0B" },
            { label: "Pro", value: 50, color: "#10B981" },
            { label: "Enterprise", value: 30, color: "#93C5FD" },
        ],
    },
    innerRadiusPercent: {
        type: ControlType.Number,
        title: "Hole Size %",
        min: 0,
        max: 85,
        step: 1,
        defaultValue: 55,
    },
    popOutDistance: {
        type: ControlType.Number,
        title: "Hover Offset",
        min: 0,
        max: 30,
        step: 1,
        defaultValue: 12,
    },
    showCenterText: {
        type: ControlType.Boolean,
        title: "Center Text",
        defaultValue: true,
    },
    centerValueText: {
        type: ControlType.String,
        title: "Center Value",
        defaultValue: "95.67%",
        hidden: (props) => !props.showCenterText,
    },
    centerLabelText: {
        type: ControlType.String,
        title: "Center Label",
        defaultValue: "OVERALL",
        hidden: (props) => !props.showCenterText,
    },
    // Legend Controls
    showLegend: {
        type: ControlType.Boolean,
        title: "Legend",
        defaultValue: true,
    },
    showLegendValues: {
        type: ControlType.Boolean,
        title: "Legend Values",
        defaultValue: true,
        hidden: (props) => !props.showLegend,
    },
    legendFontSize: {
        type: ControlType.Number,
        title: "Legend Font Size",
        min: 10,
        max: 20,
        defaultValue: 13,
        hidden: (props) => !props.showLegend,
    },
    legendTextColor: {
        type: ControlType.Color,
        title: "Legend Text Color",
        defaultValue: "#333333",
        hidden: (props) => !props.showLegend,
    },
    legendBoxSize: {
        type: ControlType.Number,
        title: "Box Size",
        min: 6,
        max: 24,
        defaultValue: 12,
        hidden: (props) => !props.showLegend,
    },
    legendBoxRadius: {
        type: ControlType.Number,
        title: "Box Radius",
        min: 0,
        max: 12,
        defaultValue: 3,
        hidden: (props) => !props.showLegend,
    },
    legendGap: {
        type: ControlType.Number,
        title: "Legend Gap",
        min: 8,
        max: 40,
        defaultValue: 16,
        hidden: (props) => !props.showLegend,
    },
    // Global Typography Controls
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    sliceTextColor: {
        type: ControlType.Color,
        title: "Slice Text Color",
        defaultValue: "#FFFFFF",
    },
    sliceTextFontSize: {
        type: ControlType.Number,
        title: "Slice Font Size",
        min: 8,
        max: 24,
        defaultValue: 12,
    },
    centerValueColor: {
        type: ControlType.Color,
        title: "Center Val Color",
        defaultValue: "#1A1A1A",
    },
    centerValueFontSize: {
        type: ControlType.Number,
        title: "Center Val Size",
        min: 12,
        max: 40,
        defaultValue: 20,
    },
    centerLabelColor: {
        type: ControlType.Color,
        title: "Center Lbl Color",
        defaultValue: "#666666",
    },
    centerLabelFontSize: {
        type: ControlType.Number,
        title: "Center Lbl Size",
        min: 8,
        max: 20,
        defaultValue: 11,
    },
})
