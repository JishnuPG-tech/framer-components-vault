// Create a modern animated grouped bar chart as a Framer Code Component using React and Framer Motion.
// Requirements:
// Two data series (e.g. Nightblue and Pigeon) displayed as rounded vertical bars grouped by category.
// Bars animate in on load (from height 0 to their value) with a smooth spring animation and slight stagger.
// A subtle horizontal grid with values from 0 to 5 on the Y-axis.
// X-axis labels below each group.
// A legend at the top with colored indicators for each series.
// On hover over a group, lightly highlight the group background and dim non-hovered bars.
// On hover, show a floating tooltip near the cursor that displays both values with matching color dots.
// Rounded card container, soft shadow, minimal UI, light background.
// Style:
// Clean, SaaS-style dashboard aesthetic.
// Rounded corners on bars and container.
// Smooth micro-interactions (hover + tooltip fade/scale).
// Colors similar to indigo/blue and light slate.
// Implementation details:
// Use Framer Motion for animations.
// Self-contained Code Component (no external libraries).
// Data defined in an array at the top of the file for easy editing.
// Responsive width.

import { motion, AnimatePresence, useInView } from "framer-motion"
import { useState, useRef, useEffect, startTransition } from "react"
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
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function InteractiveBarChart(props) {
    const {
        data,
        series1Color,
        series2Color,
        series3Color,
        series1Label,
        series2Label,
        series3Label,
        backgroundColor,
        textColor,
        gridColor,
        font,
        maxValue,
        barRadius,
        borderRadius = 24,
        seriesCount = 2,
        barWidth = 12,
        title = "Sales Overview",
        showTitle = false,
        titleFontSize = 20,
        showLegend = true,
        valuePrefix = "",
        valueSuffix = "",
        yAxisSteps = 5,
        yAxisLabelWidth = 40,
        xAxisLabelHeight = 24,
        animate = true,
        animationTrigger = "load",
        inactiveColor = "#E2E8F0",
    } = props

    const [hoveredIndex, setHoveredIndex] = useState(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })

    const handleMouseMove = (e) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            startTransition(() => {
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    width: rect.width,
                    height: rect.height,
                })
            })
        }
    }

    // Calculate the highest value in the data
    const highestDataValue = Math.max(
        ...data.map((item) =>
            Math.max(
                item.value1,
                seriesCount >= 2 ? item.value2 ?? 0 : 0,
                seriesCount >= 3 ? item.value3 ?? 0 : 0
            )
        )
    )

    // Use the higher of maxValue or highestDataValue
    const effectiveMaxValue = Math.max(maxValue, highestDataValue)

    // Calculate grid lines
    const gridLines = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
        const val = (effectiveMaxValue / yAxisSteps) * i
        return parseFloat(val.toFixed(1))
    })

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => startTransition(() => setHoveredIndex(null))}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: backgroundColor,
                borderRadius: borderRadius,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                fontFamily: "Inter, sans-serif",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                ...font,
            }}
        >
            {/* Title */}
            {showTitle && (
                <div
                    style={{
                        fontSize: titleFontSize,
                        lineHeight: "1.2em",
                        fontWeight: 600,
                        color: textColor,
                        marginBottom: 16,
                        flexShrink: 0,
                    }}
                >
                    {title}
                </div>
            )}

            {/* Legend */}
            {showLegend && (
                <div
                    style={{
                        display: "flex",
                        gap: 24,
                        marginBottom: 32,
                        alignItems: "center",
                    }}
                >
                    <LegendItem color={series1Color} label={series1Label} textColor={textColor} />
                    {seriesCount >= 2 && (
                        <LegendItem color={series2Color} label={series2Label} textColor={textColor} />
                    )}
                    {seriesCount >= 3 && (
                        <LegendItem color={series3Color} label={series3Label} textColor={textColor} />
                    )}
                </div>
            )}

            {/* Chart Area */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    position: "relative",
                    alignItems: "flex-end",
                    paddingLeft: yAxisLabelWidth, // Space for Y-axis labels
                    paddingBottom: xAxisLabelHeight, // Space for X-axis labels
                }}
            >
                {/* Grid Lines */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: yAxisLabelWidth,
                        right: 0,
                        bottom: xAxisLabelHeight,
                        display: "flex",
                        flexDirection: "column-reverse",
                        justifyContent: "space-between",
                        pointerEvents: "none",
                    }}
                >
                    {gridLines.map((val) => (
                        <div
                            key={val}
                            style={{
                                width: "100%",
                                height: 1,
                                backgroundColor: val === 0 ? textColor : gridColor,
                                opacity: val === 0 ? 0.1 : 0.5,
                                position: "relative",
                            }}
                        >
                            <span
                                style={{
                                    position: "absolute",
                                    left: -yAxisLabelWidth,
                                    top: -8,
                                    fontSize: "0.85em",
                                    color: textColor,
                                    opacity: 0.5,
                                    width: Math.max(0, yAxisLabelWidth - 8),
                                    textAlign: "right",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {valuePrefix}{val}{valueSuffix}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Bars Container */}
                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        height: "100%",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        zIndex: 1,
                    }}
                >
                    {data.map((item, index) => {
                        const isHovered = hoveredIndex === index
                        const isDimmed = hoveredIndex !== null && hoveredIndex !== index

                        return (
                            <div
                                key={index}
                                onMouseEnter={() => startTransition(() => setHoveredIndex(index))}
                                style={{
                                    flex: 1,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                    position: "relative",
                                    cursor: "pointer",
                                    opacity: isDimmed ? 0.4 : 1,
                                    transition: "opacity 0.2s",
                                }}
                            >
                                {/* Bar Group */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 4,
                                        height: "100%",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <Bar
                                        value={item.value1}
                                        max={effectiveMaxValue}
                                        color={item.active1 === false ? inactiveColor : series1Color}
                                        index={index}
                                        series={0}
                                        radius={barRadius}
                                        width={barWidth}
                                        animate={animate}
                                        animationTrigger={animationTrigger}
                                        isInView={isInView}
                                    />
                                    {seriesCount >= 2 && (
                                        <Bar
                                            value={item.value2}
                                            max={effectiveMaxValue}
                                            color={item.active2 === false ? inactiveColor : series2Color}
                                            index={index}
                                            series={1}
                                            radius={barRadius}
                                            width={barWidth}
                                            animate={animate}
                                            animationTrigger={animationTrigger}
                                            isInView={isInView}
                                        />
                                    )}
                                    {seriesCount >= 3 && (
                                        <Bar
                                            value={item.value3}
                                            max={effectiveMaxValue}
                                            color={item.active3 === false ? inactiveColor : series3Color}
                                            index={index}
                                            series={2}
                                            radius={barRadius}
                                            width={barWidth}
                                            animate={animate}
                                            animationTrigger={animationTrigger}
                                            isInView={isInView}
                                        />
                                    )}
                                </div>

                                {/* X-Axis Label */}
                                <span
                                    style={{
                                        position: "absolute",
                                        bottom: -(xAxisLabelHeight + 4),
                                        fontSize: "0.85em",
                                        fontWeight: 500,
                                        color: textColor,
                                        opacity: isHovered ? 1 : 0.6,
                                        transition: "opacity 0.2s",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {item.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Floating Tooltip */}
            <AnimatePresence>
                {hoveredIndex !== null && (
                    <Tooltip
                        x={mousePos.x}
                        y={mousePos.y}
                        containerWidth={mousePos.width}
                        containerHeight={mousePos.height}
                        data={data[hoveredIndex]}
                        colors={[series1Color, series2Color, series3Color]}
                        labels={[series1Label, series2Label, series3Label]}
                        textColor={textColor}
                        backgroundColor={backgroundColor}
                        seriesCount={seriesCount}
                        valuePrefix={valuePrefix}
                        valueSuffix={valueSuffix}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function Bar({ value, max, color, index, series, radius, width, animate, animationTrigger, isInView }) {
    const heightPercent = (value / max) * 100
    const shouldShow = !animate || (animationTrigger === "inView" ? isInView : true)

    return (
        <motion.div
            initial={animate ? { height: 0 } : false}
            animate={{ height: shouldShow ? `${heightPercent}%` : 0 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: animate ? index * 0.05 + series * 0.05 : 0, // Stagger based on index and series
            }}
            style={{
                width: width,
                backgroundColor: color,
                borderRadius: radius,
                minHeight: 4, // Ensure visibility even if 0
            }}
        />
    )
}

function LegendItem({ color, label, textColor }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: color,
                }}
            />
            <span
                style={{
                    fontSize: "0.85em",
                    fontWeight: 500,
                    color: textColor,
                    opacity: 0.8,
                }}
            >
                {label}
            </span>
        </div>
    )
}

function Tooltip({
    x,
    y,
    containerWidth,
    containerHeight,
    data,
    colors,
    labels,
    textColor,
    backgroundColor,
    seriesCount,
    valuePrefix,
    valueSuffix,
}) {
    const offsetX = 16
    const offsetY = 16

    // Estimate tooltip dimensions
    const estimatedWidth = 180
    const estimatedHeight = 70 + (seriesCount - 1) * 30

    const flipX = x + offsetX + estimatedWidth > containerWidth
    const flipY = y + offsetY + estimatedHeight > containerHeight

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
                position: "absolute",
                left: x,
                top: y,
                x: flipX ? `calc(-100% - ${offsetX}px)` : offsetX,
                y: flipY ? `calc(-100% - ${offsetY}px)` : offsetY,
                backgroundColor: backgroundColor,
                padding: "12px 16px",
                borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
                zIndex: 100,
                pointerEvents: "none",
                minWidth: 140,
            }}
        >
            <div
                style={{
                    fontSize: "0.9em",
                    fontWeight: 600,
                    color: textColor,
                    marginBottom: 8,
                }}
            >
                {data.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <TooltipRow
                    color={colors[0]}
                    label={labels[0]}
                    value={`${valuePrefix}${data.value1}${valueSuffix}`}
                    textColor={textColor}
                />
                {seriesCount >= 2 && (
                    <TooltipRow
                        color={colors[1]}
                        label={labels[1]}
                        value={`${valuePrefix}${data.value2 ?? 0}${valueSuffix}`}
                        textColor={textColor}
                    />
                )}
                {seriesCount >= 3 && (
                    <TooltipRow
                        color={colors[2]}
                        label={labels[2]}
                        value={`${valuePrefix}${data.value3 ?? 0}${valueSuffix}`}
                        textColor={textColor}
                    />
                )}
            </div>
        </motion.div>
    )
}

function TooltipRow({ color, label, value, textColor }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                fontSize: "0.85em",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: color,
                    }}
                />
                <span style={{ color: textColor, opacity: 0.7, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            <span style={{ fontWeight: 600, color: textColor, whiteSpace: "nowrap" }}>{value}</span>
        </div>
    )
}

// Default Data
const defaultData = [
    { label: "Jan", value1: 2.5, value2: 1.2, value3: 3.0 },
    { label: "Feb", value1: 3.8, value2: 2.4, value3: 1.5 },
    { label: "Mar", value1: 1.5, value2: 3.1, value3: 2.0 },
    { label: "Apr", value1: 4.2, value2: 2.8, value3: 3.5 },
    { label: "May", value1: 3.0, value2: 4.5, value3: 2.2 },
    { label: "Jun", value1: 2.1, value2: 3.2, value3: 4.1 },
]

addPropertyControls(InteractiveBarChart, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Sales Overview",
        hidden: (props) => !props.showTitle,
    },
    series1Label: {
        type: ControlType.String,
        title: "Value 1",
        defaultValue: "Nightblue",
    },
    series2Label: {
        type: ControlType.String,
        title: "Value 2",
        defaultValue: "Pigeon",
        hidden: (props) => props.seriesCount < 2,
    },
    series3Label: {
        type: ControlType.String,
        title: "Value 3",
        defaultValue: "Emerald",
        hidden: (props) => props.seriesCount < 3,
    },
    valuePrefix: {
        type: ControlType.String,
        title: "Value Prefix",
        defaultValue: "",
        placeholder: "$",
    },
    valueSuffix: {
        type: ControlType.String,
        title: "Value Suffix",
        defaultValue: "",
        placeholder: "M",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
        },
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: false,
    },
    titleFontSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 20,
        min: 8,
        max: 100,
        hidden: (props) => !props.showTitle,
    },
    showLegend: {
        type: ControlType.Boolean,
        title: "Show Legend",
        defaultValue: true,
    },
    seriesCount: {
        type: ControlType.Number,
        title: "Number of Values",
        defaultValue: 2,
        min: 1,
        max: 3,
        displayStepper: true,
    },
    data: {
        type: ControlType.Array,
        title: "Data",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "Label" },
                value1: { type: ControlType.Number, defaultValue: 3, min: 0, displayStepper: true },
                active1: { type: ControlType.Boolean, defaultValue: true, title: "Active 1" },
                value2: { type: ControlType.Number, defaultValue: 2, min: 0, displayStepper: true },
                active2: { type: ControlType.Boolean, defaultValue: true, title: "Active 2" },
                value3: { type: ControlType.Number, defaultValue: 1, min: 0, displayStepper: true },
                active3: { type: ControlType.Boolean, defaultValue: true, title: "Active 3" },
            },
        },
        defaultValue: defaultData,
    },
    maxValue: {
        type: ControlType.Number,
        title: "Max Y-Axis",
        defaultValue: 5,
        min: 1,
        displayStepper: true,
    },
    yAxisSteps: {
        type: ControlType.Number,
        title: "Y-Axis Steps",
        defaultValue: 5,
        min: 2,
        max: 50,
        displayStepper: true,
    },
    yAxisLabelWidth: {
        type: ControlType.Number,
        title: "Y-Axis Space",
        defaultValue: 40,
        min: 0,
        step: 1,
    },
    xAxisLabelHeight: {
        type: ControlType.Number,
        title: "X-Axis Space",
        defaultValue: 24,
        min: 0,
        step: 1,
    },
    barRadius: {
        type: ControlType.Number,
        title: "Bar Radius",
        defaultValue: 4,
        min: 0,
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 12,
        min: 1,
    },
    series1Color: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#3B82F6", // Blue-500
    },
    series2Color: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#94A3B8", // Slate-400
        hidden: (props) => props.seriesCount < 2,
    },
    series3Color: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#10B981", // Emerald-500
        hidden: (props) => props.seriesCount < 3,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#1E293B", // Slate-800
    },
    gridColor: {
        type: ControlType.Color,
        title: "Interactive",
        defaultValue: "#F1F5F9", // Slate-100
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "BG Radius",
        defaultValue: 24,
        min: 0,
        max: 50,
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive Bar",
        defaultValue: "#E2E8F0", // Slate-200
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationTrigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["load", "inView"],
        optionTitles: ["On Load", "On Scroll"],
        defaultValue: "load",
        hidden: (props) => !props.animate,
    },
})
