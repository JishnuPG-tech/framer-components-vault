// Responsive Line/Bar Chart component with unlimited X/Y data, axis, color, and style controls
import { useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface LineChartProps {
    xData: string[]
    yData: number[]
    chartType: "line" | "bar"
    lineStyle: "straight" | "wave"
    lineColor: string
    lineWidth: number
    pointColor: string
    pointRadius: number
    showPoints: boolean
    axisColor: string
    axisWidth: number
    axisFont: any
    showGrid: boolean
    gridColor: string
    decimals: number
    style?: React.CSSProperties
    barColor: string
    barWidth: number
    barRadius: number
}

/**
 * Responsive Line/Bar Chart
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 240
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LineChart(props: LineChartProps) {
    const {
        xData = ["Jan", "Feb", "Mar", "Apr", "May"],
        yData = [10, 20, 15, 30, 25],
        chartType = "line",
        lineStyle,
        lineColor,
        lineWidth,
        pointColor,
        pointRadius,
        showPoints,
        axisColor,
        axisWidth,
        style,
        showGrid,
        gridColor,
        decimals = 2,
        barColor = "#B9D5FF",
        barWidth = 24,
        barRadius = 2,
        axisFont,
    } = props

    // Responsive SVG viewBox
    const viewW = 400
    const viewH = 240
    const padding = 32

    // Clamp data lengths
    const points = useMemo(() => {
        const len = Math.min(xData.length, yData.length)
        return Array.from({ length: len }, (_, i) => ({
            x: xData[i],
            y: yData[i],
        }))
    }, [xData, yData])

    // Find min/max for scaling
    const yMin = useMemo(
        () => (yData.length > 0 ? Math.min(...yData) : 0),
        [yData]
    )
    const yMax = useMemo(
        () => (yData.length > 0 ? Math.max(...yData) : 1),
        [yData]
    )
    const yRange = yMax - yMin === 0 ? 1 : yMax - yMin

    // Map data to SVG coordinates
    const svgPoints = useMemo(() => {
        const len = points.length
        if (len === 0) return []
        if (len === 1) {
            // Single point: center it
            return [{ x: viewW / 2, y: viewH / 2 }]
        }
        return points.map((pt, i) => {
            const x = padding + (i * (viewW - 2 * padding)) / (len - 1)
            const y = padding + ((yMax - pt.y) * (viewH - 2 * padding)) / yRange
            return { x, y }
        })
    }, [points, viewW, viewH, yMin, yMax, yRange, padding])

    // Build SVG path
    const linePath = useMemo(() => {
        if (svgPoints.length === 0) return ""
        if (lineStyle === "wave" && svgPoints.length > 1) {
            // Cubic Bezier smoothing
            let d = `M${svgPoints[0].x},${svgPoints[0].y}`
            for (let i = 1; i < svgPoints.length; i++) {
                const p0 = svgPoints[i - 1]
                const p1 = svgPoints[i]
                const midX = (p0.x + p1.x) / 2
                d += ` C${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`
            }
            return d
        }
        // Straight lines
        return svgPoints
            .map((pt, i) => (i === 0 ? `M${pt.x},${pt.y}` : `L${pt.x},${pt.y}`))
            .join(" ")
    }, [svgPoints, lineStyle])

    // Axis ticks
    const yTicks = 5
    const yTickVals = useMemo(() => {
        return Array.from(
            { length: yTicks + 1 },
            (_, i) => yMin + ((yMax - yMin) * i) / yTicks
        )
    }, [yMin, yMax])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${viewW} ${viewH}`}
                preserveAspectRatio="none"
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
            >
                {/* Background grid */}
                {showGrid && (
                    <g>
                        {/* Vertical grid lines */}
                        {svgPoints.map((pt, i) => (
                            <line
                                key={"vgrid-" + i}
                                x1={pt.x}
                                y1={padding}
                                x2={pt.x}
                                y2={viewH - padding}
                                stroke={gridColor}
                                strokeWidth={1}
                                opacity={0.3}
                            />
                        ))}
                        {/* Horizontal grid lines */}
                        {yTickVals.map((val, i) => {
                            const y =
                                padding +
                                ((yMax - val) * (viewH - 2 * padding)) / yRange
                            return (
                                <line
                                    key={"hgrid-" + i}
                                    x1={padding}
                                    y1={y}
                                    x2={viewW - padding}
                                    y2={y}
                                    stroke={gridColor}
                                    strokeWidth={1}
                                    opacity={0.3}
                                />
                            )
                        })}
                    </g>
                )}
                {/* X and Y axis */}
                <line
                    x1={padding}
                    y1={viewH - padding}
                    x2={viewW - padding}
                    y2={viewH - padding}
                    stroke={axisColor}
                    strokeWidth={axisWidth}
                />
                <line
                    x1={padding}
                    y1={padding}
                    x2={padding}
                    y2={viewH - padding}
                    stroke={axisColor}
                    strokeWidth={axisWidth}
                />
                {/* Y axis ticks and labels */}
                {yTickVals.map((val, i) => {
                    const y =
                        padding +
                        ((yMax - val) * (viewH - 2 * padding)) / yRange
                    return (
                        <g key={i}>
                            <line
                                x1={padding - 6}
                                y1={y}
                                x2={padding}
                                y2={y}
                                stroke={axisColor}
                                strokeWidth={1}
                            />
                            <text
                                x={padding - 10}
                                y={y + 4}
                                fontSize={axisFont.fontSize}
                                fontFamily={axisFont.fontFamily}
                                fontWeight={axisFont.fontWeight}
                                letterSpacing={axisFont.letterSpacing}
                                textAnchor="end"
                                fill={axisColor}
                                style={{ userSelect: "none" }}
                            >
                                {val.toFixed(decimals)}
                            </text>
                        </g>
                    )
                })}
                {/* X axis labels */}
                {svgPoints.map((pt, i) => (
                    <text
                        key={i}
                        x={pt.x}
                        y={viewH - padding + 18}
                        fontSize={axisFont.fontSize}
                        fontFamily={axisFont.fontFamily}
                        fontWeight={axisFont.fontWeight}
                        letterSpacing={axisFont.letterSpacing}
                        textAnchor="middle"
                        fill={axisColor}
                        style={{ userSelect: "none" }}
                    >
                        {xData[i]}
                    </text>
                ))}
                {/* Chart rendering */}
                {chartType === "line" && (
                    <>
                        {/* Line path */}
                        <path
                            d={linePath}
                            fill="none"
                            stroke={lineColor}
                            strokeWidth={lineWidth}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                        {/* Points */}
                        {showPoints &&
                            svgPoints.map((pt, i) => (
                                <circle
                                    key={i}
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={pointRadius}
                                    fill={pointColor}
                                    stroke={lineColor}
                                    strokeWidth={1}
                                />
                            ))}
                    </>
                )}
                {chartType === "bar" && (
                    <>
                        {svgPoints.map((pt, i) => {
                            const barX = pt.x - barWidth / 2
                            const barY = pt.y
                            const barH = viewH - padding - pt.y
                            return (
                                <rect
                                    key={i}
                                    x={barX}
                                    y={barY}
                                    width={barWidth}
                                    height={barH}
                                    fill={barColor}
                                    rx={barRadius}
                                />
                            )
                        })}
                    </>
                )}
            </svg>
        </div>
    )
}

addPropertyControls(LineChart, {
    chartType: {
        type: ControlType.Enum,
        title: "Chart Type",
        options: ["line", "bar"],
        optionTitles: ["Line", "Bar"],
        defaultValue: "line",
        displaySegmentedControl: true,
    },
    xData: {
        type: ControlType.Array,
        title: "X Data",
        control: { type: ControlType.String, placeholder: "Label" },
        defaultValue: ["Jan", "Feb", "Mar", "Apr", "May"],
    },
    yData: {
        type: ControlType.Array,
        title: "Y Data",
        control: { type: ControlType.Number, min: 0, max: 100, step: 1 },
        defaultValue: [10, 20, 15, 30, 25],
    },
    lineStyle: {
        type: ControlType.Enum,
        title: "Line Style",
        options: ["straight", "wave"],
        optionTitles: ["Straight", "Wave"],
        defaultValue: "straight",
        displaySegmentedControl: true,
        hidden: ({ chartType }) => chartType !== "line",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#B9D5FF",
        hidden: ({ chartType }) => chartType !== "line",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
        hidden: ({ chartType }) => chartType !== "line",
    },
    showPoints: {
        type: ControlType.Boolean,
        title: "Show Points",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ chartType }) => chartType !== "line",
    },
    pointColor: {
        type: ControlType.Color,
        title: "Point Color",
        defaultValue: "#0066FF",
        hidden: ({ showPoints, chartType }) =>
            !showPoints || chartType !== "line",
    },
    pointRadius: {
        type: ControlType.Number,
        title: "Point Radius",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ showPoints, chartType }) =>
            !showPoints || chartType !== "line",
    },
    barColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#B9D5FF",
        hidden: ({ chartType }) => chartType !== "bar",
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 24,
        min: 4,
        max: 60,
        step: 1,
        unit: "px",
        hidden: ({ chartType }) => chartType !== "bar",
    },
    barRadius: {
        type: ControlType.Number,
        title: "Bar Radius",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ chartType }) => chartType !== "bar",
    },
    axisColor: {
        type: ControlType.Color,
        title: "Axis Color",
        defaultValue: "#7B818E",
    },
    axisWidth: {
        type: ControlType.Number,
        title: "Axis Width",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
        unit: "px",
    },
    axisFont: {
        type: ControlType.Font,
        title: "Axis Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    showGrid: {
        type: ControlType.Boolean,
        title: "Show Grid",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    gridColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "#DBDDE0",
        hidden: ({ showGrid }) => !showGrid,
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 2,
        min: 0,
        max: 6,
        step: 1,
        displayStepper: true,
    },
})
