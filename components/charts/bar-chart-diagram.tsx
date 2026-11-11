import { useState, useEffect } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { createPortal } from "react-dom"

interface DataPoint {
    month: string
    desktop: number
    mobile: number
}

interface Props {
    data: string
    showGrid: boolean
    showXAxis: boolean
    showYAxis: boolean
    showTooltip: boolean
    showLegend: boolean
    barRadius: number
    barGap: number
    animateOnLoad: boolean
    primaryBarColor: string
    secondaryBarColor: string
    gridColor: string
    axisColor: string
    textColor: string
    backgroundColor: string
    tooltipBg: string
    tooltipBorder: string
    primaryLabel: string
    secondaryLabel: string
}

const defaultData: DataPoint[] = [
    { month: "Jan", desktop: 12400, mobile: 8200 },
    { month: "Feb", desktop: 18900, mobile: 12400 },
    { month: "Mar", desktop: 22100, mobile: 15800 },
    { month: "Apr", desktop: 26500, mobile: 18200 },
    { month: "May", desktop: 31200, mobile: 22900 },
    { month: "Jun", desktop: 38400, mobile: 28100 },
]

function BarChart(props: Props) {
    const {
        data = "",
        showGrid = true,
        showXAxis = true,
        showYAxis = false,
        showTooltip = true,
        showLegend = true,
        barRadius = 4,
        barGap = 8,
        animateOnLoad = true,
        primaryBarColor = "#18181b",
        secondaryBarColor = "#a1a1aa",
        gridColor = "#e4e4e7",
        axisColor = "#71717a",
        textColor = "#3f3f46",
        backgroundColor = "#ffffff",
        tooltipBg = "#ffffff",
        tooltipBorder = "#e4e4e7",
        primaryLabel = "Revenue",
        secondaryLabel = "New Users",
    } = props

    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
        null
    )
    const [hoveredBar, setHoveredBar] = useState<{
        x: number
        y: number
        data: DataPoint
        type: "desktop" | "mobile"
    } | null>(null)

    useEffect(() => {
        setPortalContainer(document.body)
    }, [])

    let chartData: DataPoint[] = defaultData
    try {
        if (data && data.trim()) {
            chartData = JSON.parse(data)
        }
    } catch (e) {
        chartData = defaultData
    }

    const svgWidth = 500
    const svgHeight = 280
    const padding = {
        top: 20,
        right: 20,
        bottom: 30,
        left: showYAxis ? 45 : 15,
    }
    const chartAreaWidth = svgWidth - padding.left - padding.right
    const chartAreaHeight = svgHeight - padding.top - padding.bottom

    const maxValue = Math.max(
        ...chartData.flatMap((d) => [d.desktop, d.mobile])
    )
    const roundedMax = Math.ceil(maxValue / 10000) * 10000

    const gridLines = 5
    const gridValues = Array.from(
        { length: gridLines },
        (_, i) => (roundedMax / (gridLines - 1)) * i
    )

    const groupWidth = chartAreaWidth / chartData.length
    const barWidth = (groupWidth - barGap * 3) / 2

    const handleMouseEnter = (
        e: React.MouseEvent<SVGRectElement>,
        item: DataPoint,
        type: "desktop" | "mobile"
    ) => {
        if (!showTooltip) return
        const rect = e.currentTarget.getBoundingClientRect()
        setHoveredBar({
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
            data: item,
            type,
        })
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: backgroundColor,
                borderRadius: 12,
                padding: 20,
                boxSizing: "border-box",
                border: `1px solid ${gridColor}`,
                fontFamily: "system-ui, -apple-system, sans-serif",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Grid lines */}
                    {showGrid &&
                        gridValues.map((value, i) => {
                            const y =
                                padding.top +
                                ((roundedMax - value) / roundedMax) *
                                    chartAreaHeight
                            return (
                                <line
                                    key={`grid-${i}`}
                                    x1={padding.left}
                                    y1={y}
                                    x2={svgWidth - padding.right}
                                    y2={y}
                                    stroke={gridColor}
                                    strokeDasharray="4 4"
                                    strokeWidth={1}
                                />
                            )
                        })}

                    {/* Y Axis labels */}
                    {showYAxis &&
                        gridValues.map((value, i) => {
                            const y =
                                padding.top +
                                ((roundedMax - value) / roundedMax) *
                                    chartAreaHeight
                            return (
                                <text
                                    key={`yaxis-${i}`}
                                    x={padding.left - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    fill={axisColor}
                                    fontSize={11}
                                >
                                    {value.toLocaleString()}
                                </text>
                            )
                        })}

                    {/* Bars */}
                    {chartData.map((item, index) => {
                        const groupX = padding.left + index * groupWidth
                        const barX =
                            groupX + (groupWidth - barWidth * 2 - barGap) / 2
                        const desktopHeight =
                            (item.desktop / roundedMax) * chartAreaHeight
                        const mobileHeight =
                            (item.mobile / roundedMax) * chartAreaHeight
                        const baseY = padding.top + chartAreaHeight

                        return (
                            <g key={`bar-group-${index}`}>
                                {/* Desktop bar */}
                                <motion.rect
                                    x={barX}
                                    width={barWidth}
                                    fill={primaryBarColor}
                                    rx={barRadius}
                                    initial={
                                        animateOnLoad
                                            ? { height: 0, y: baseY }
                                            : {
                                                  height: desktopHeight,
                                                  y: baseY - desktopHeight,
                                              }
                                    }
                                    animate={{
                                        height: desktopHeight,
                                        y: baseY - desktopHeight,
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        delay: index * 0.08,
                                        ease: [0.34, 1.56, 0.64, 1],
                                    }}
                                    style={{
                                        cursor: showTooltip
                                            ? "pointer"
                                            : "default",
                                    }}
                                    onMouseEnter={(e) =>
                                        handleMouseEnter(e, item, "desktop")
                                    }
                                    onMouseLeave={() => setHoveredBar(null)}
                                />

                                {/* Mobile bar */}
                                <motion.rect
                                    x={barX + barWidth + barGap}
                                    width={barWidth}
                                    fill={secondaryBarColor}
                                    rx={barRadius}
                                    initial={
                                        animateOnLoad
                                            ? { height: 0, y: baseY }
                                            : {
                                                  height: mobileHeight,
                                                  y: baseY - mobileHeight,
                                              }
                                    }
                                    animate={{
                                        height: mobileHeight,
                                        y: baseY - mobileHeight,
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        delay: index * 0.08 + 0.04,
                                        ease: [0.34, 1.56, 0.64, 1],
                                    }}
                                    style={{
                                        cursor: showTooltip
                                            ? "pointer"
                                            : "default",
                                    }}
                                    onMouseEnter={(e) =>
                                        handleMouseEnter(e, item, "mobile")
                                    }
                                    onMouseLeave={() => setHoveredBar(null)}
                                />

                                {/* X Axis label */}
                                {showXAxis && (
                                    <text
                                        x={groupX + groupWidth / 2}
                                        y={baseY + 18}
                                        textAnchor="middle"
                                        fill={axisColor}
                                        fontSize={12}
                                    >
                                        {item.month}
                                    </text>
                                )}
                            </g>
                        )
                    })}
                </svg>
            </div>

            {/* Legend */}
            {showLegend && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 24,
                        paddingTop: 12,
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 2,
                                backgroundColor: primaryBarColor,
                            }}
                        />
                        <span
                            style={{
                                fontSize: 13,
                                color: textColor,
                                fontWeight: 500,
                            }}
                        >
                            {primaryLabel}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 2,
                                backgroundColor: secondaryBarColor,
                            }}
                        />
                        <span
                            style={{
                                fontSize: 13,
                                color: textColor,
                                fontWeight: 500,
                            }}
                        >
                            {secondaryLabel}
                        </span>
                    </div>
                </div>
            )}

            {/* Tooltip via Portal */}
            {portalContainer &&
                hoveredBar &&
                createPortal(
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "fixed",
                            left: hoveredBar.x,
                            top: hoveredBar.y,
                            transform: "translate(-50%, -100%)",
                            backgroundColor: tooltipBg,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: 8,
                            padding: "8px 12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            pointerEvents: "none",
                            zIndex: 9999,
                            whiteSpace: "nowrap",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 4px",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "#09090b",
                            }}
                        >
                            {hoveredBar.data.month}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    backgroundColor:
                                        hoveredBar.type === "desktop"
                                            ? primaryBarColor
                                            : secondaryBarColor,
                                }}
                            />
                            <span style={{ fontSize: 11, color: textColor }}>
                                {hoveredBar.type === "desktop"
                                    ? primaryLabel
                                    : secondaryLabel}
                                :{" "}
                                {hoveredBar.type === "desktop"
                                    ? hoveredBar.data.desktop.toLocaleString()
                                    : hoveredBar.data.mobile.toLocaleString()}
                            </span>
                        </div>
                    </motion.div>,
                    portalContainer
                )}
        </div>
    )
}

export default BarChart

addPropertyControls(BarChart, {
    data: {
        type: ControlType.String,
        title: "Data (JSON)",
        defaultValue: "",
        displayTextArea: true,
    },
    animateOnLoad: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    showGrid: {
        type: ControlType.Boolean,
        title: "Show Grid",
        defaultValue: true,
    },
    showXAxis: {
        type: ControlType.Boolean,
        title: "Show X Axis",
        defaultValue: true,
    },
    showYAxis: {
        type: ControlType.Boolean,
        title: "Show Y Axis",
        defaultValue: false,
    },
    showTooltip: {
        type: ControlType.Boolean,
        title: "Show Tooltip",
        defaultValue: true,
    },
    showLegend: {
        type: ControlType.Boolean,
        title: "Show Legend",
        defaultValue: true,
    },
    barRadius: {
        type: ControlType.Number,
        title: "Bar Radius",
        min: 0,
        max: 12,
        defaultValue: 4,
    },
    barGap: {
        type: ControlType.Number,
        title: "Bar Gap",
        min: 0,
        max: 20,
        defaultValue: 8,
    },
    primaryLabel: {
        type: ControlType.String,
        title: "Primary Label",
        defaultValue: "Revenue",
    },
    secondaryLabel: {
        type: ControlType.String,
        title: "Secondary Label",
        defaultValue: "New Users",
    },
    primaryBarColor: {
        type: ControlType.Color,
        title: "Primary Bar",
        defaultValue: "#18181b",
    },
    secondaryBarColor: {
        type: ControlType.Color,
        title: "Secondary Bar",
        defaultValue: "#a1a1aa",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    gridColor: {
        type: ControlType.Color,
        title: "Grid / Border",
        defaultValue: "#e4e4e7",
    },
    axisColor: {
        type: ControlType.Color,
        title: "Axis Text",
        defaultValue: "#71717a",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#3f3f46",
    },
    tooltipBg: {
        type: ControlType.Color,
        title: "Tooltip Bg",
        defaultValue: "#ffffff",
    },
    tooltipBorder: {
        type: ControlType.Color,
        title: "Tooltip Border",
        defaultValue: "#e4e4e7",
    },
})
