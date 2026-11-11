// Instructions: Create a Framer component that follows the Framer component rules and achieves the user's goal.
// Goal: Build a professional "Interactive Chart Kit" for Framer that includes Line and Bar charts. The goal is to provide a "No-Code" experience for SaaS founders to display data beautifully.

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

import { motion, useInView } from "framer-motion"

type ChartType = "line" | "bar"

type ChartPoint = {
    label: string
    value: number
    color?: string
}

type NumberFormat = "number" | "compact" | "percent"

interface Props {
    chartType: ChartType
    title: string
    showTitle: boolean

    data: ChartPoint[]

    // NEW: Simplified grouped configuration
    appearance?: {
        backgroundColor?: string
        borderColor?: string
        borderWidth?: number
        borderRadius?: string
        shadow?: string
        padding?: number
    }

    axes?: {
        showGrid?: boolean
        gridLines?: number
        gridColor?: string
        axisColor?: string
        showXAxisLabels?: boolean
        maxXAxisLabels?: number
        showYAxisLabels?: boolean
        yAxisLabels?: number
        startAtZero?: boolean
    }

    series?: {
        accentColor?: string
        lineWidth?: number
        smoothLine?: boolean
        showMarkers?: boolean
        markerSize?: number
        showArea?: boolean
        areaOpacity?: number
        barRadius?: number
        barGap?: number
    }

    numbers?: {
        format?: NumberFormat
        decimals?: number
        prefix?: string
        suffix?: string
    }

    tooltipStyle?: {
        enabled?: boolean
        background?: string
        textColor?: string
        crosshairColor?: string
    }

    typography?: {
        titleFont?: any
        labelFont?: any
        tooltipFont?: any
        titleColor?: string
        labelColor?: string
    }

    // LEGACY flat props (kept for backward compatibility)
    backgroundColor: string
    borderColor: string
    borderWidth: number
    borderRadius: string
    shadow: string

    padding: number

    showGrid: boolean
    gridLines: number
    gridColor: string
    axisColor: string

    lineColor: string
    lineWidth: number
    smoothLine: boolean
    showMarkers: boolean
    markerSize: number

    showArea: boolean
    areaColor: string
    areaOpacity: number

    barColor: string
    barRadius: number
    barGap: number

    showXAxisLabels: boolean
    maxXAxisLabels: number

    showYAxisLabels: boolean
    yAxisLabels: number

    startAtZero: boolean

    format: NumberFormat
    decimals: number
    prefix: string
    suffix: string

    tooltip: boolean
    tooltipBackground: string
    tooltipTextColor: string
    crosshairColor: string

    titleFont: any
    labelFont: any
    tooltipFont: any
    titleColor: string
    labelColor: string

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function roundTo(n: number, decimals: number) {
    const f = Math.pow(10, decimals)
    return Math.round(n * f) / f
}

function safeMinMax(values: number[]) {
    if (!values.length) return { min: 0, max: 1 }
    let min = values[0]
    let max = values[0]
    for (let i = 1; i < values.length; i++) {
        const v = values[i]
        if (v < min) min = v
        if (v > max) max = v
    }
    if (min === max) {
        const pad = Math.abs(min) * 0.1 || 1
        return { min: min - pad, max: max + pad }
    }
    return { min, max }
}

function buildSmoothPath(points: { x: number; y: number }[]) {
    if (points.length === 0) return ""
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i]
        const p1 = points[i + 1]
        const midX = (p0.x + p1.x) / 2
        const midY = (p0.y + p1.y) / 2
        d += ` Q ${p0.x} ${p0.y} ${midX} ${midY}`
    }
    const last = points[points.length - 1]
    d += ` T ${last.x} ${last.y}`
    return d
}

function buildLinearPath(points: { x: number; y: number }[]) {
    if (points.length === 0) return ""
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`
    return d
}

function parsePx(value: any): number | null {
    if (value == null) return null
    if (typeof value === "number" && isFinite(value)) return value
    if (typeof value === "string") {
        const v = value.trim()
        if (!v) return null
        const px = v.match(/^(-?\d*\.?\d+)px$/i)
        if (px) return Number(px[1])
        const num = v.match(/^(-?\d*\.?\d+)$/)
        if (num) return Number(num[1])
    }
    return null
}

function resolveTextBlockHeight(font: any, fallbackPx: number) {
    const fontSizePx = parsePx(font?.fontSize) ?? fallbackPx

    const lh = font?.lineHeight
    if (typeof lh === "number" && isFinite(lh)) return Math.max(0, lh)

    if (typeof lh === "string") {
        const t = lh.trim()
        const px = t.match(/^(-?\d*\.?\d+)px$/i)
        if (px) return Math.max(0, Number(px[1]))
        const em = t.match(/^(-?\d*\.?\d+)em$/i)
        if (em) return Math.max(0, Number(em[1]) * fontSizePx)
        const unitless = t.match(/^(-?\d*\.?\d+)$/)
        if (unitless) return Math.max(0, Number(unitless[1]) * fontSizePx)
    }

    return fontSizePx * 1.2
}

/**
 * Interactive Chart Kit
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InteractiveChartKit(props: Props) {
    const {
        chartType = "line",
        title = "Revenue",
        showTitle = true,
        data = [
            { label: "Jan", value: 12 },
            { label: "Feb", value: 18 },
            { label: "Mar", value: 14 },
            { label: "Apr", value: 26 },
            { label: "May", value: 22 },
            { label: "Jun", value: 34 },
        ],

        appearance,
        axes,
        series,
        numbers,
        tooltipStyle: tooltipConfig,
        typography,

        backgroundColor: legacyBackgroundColor = "#FFFFFF",
        borderColor: legacyBorderColor = "#EEEEEE",
        borderWidth: legacyBorderWidth = 1,
        borderRadius: legacyBorderRadius = "16px",
        shadow: legacyShadow = "0 10px 30px rgba(0,0,0,0.08)",

        padding: legacyPadding = 18,

        showGrid: legacyShowGrid = true,
        gridLines: legacyGridLines = 4,
        gridColor: legacyGridColor = "#EEEEEE",
        axisColor: legacyAxisColor = "#CCCCCC",

        lineColor: legacyLineColor = "#0066FF",
        lineWidth: legacyLineWidth = 3,
        smoothLine: legacySmoothLine = true,
        showMarkers: legacyShowMarkers = true,
        markerSize: legacyMarkerSize = 5,

        showArea: legacyShowArea = true,
        areaColor: legacyAreaColor = "#0066FF",
        areaOpacity: legacyAreaOpacity = 0.14,

        barColor: legacyBarColor = "#0066FF",
        barRadius: legacyBarRadius = 8,
        barGap: legacyBarGap = 10,

        showXAxisLabels: legacyShowXAxisLabels = true,
        maxXAxisLabels: legacyMaxXAxisLabels = 6,

        showYAxisLabels: legacyShowYAxisLabels = true,
        yAxisLabels: legacyYAxisLabels = 4,

        startAtZero: legacyStartAtZero = true,

        format: legacyFormat = "compact",
        decimals: legacyDecimals = 0,
        prefix: legacyPrefix = "$",
        suffix: legacySuffix = "",

        tooltip: legacyTooltip = true,
        tooltipBackground: legacyTooltipBackground = "#111111",
        tooltipTextColor: legacyTooltipTextColor = "#FFFFFF",
        crosshairColor: legacyCrosshairColor = "#CCCCCC",

        titleFont: legacyTitleFont,
        labelFont: legacyLabelFont,
        tooltipFont: legacyTooltipFont,
        titleColor: legacyTitleColor = "#000000",
        labelColor: legacyLabelColor = "#000000",
    } = props

    const backgroundColor = appearance?.backgroundColor ?? legacyBackgroundColor
    const borderColor = appearance?.borderColor ?? legacyBorderColor
    const borderWidth = appearance?.borderWidth ?? legacyBorderWidth
    const borderRadius = appearance?.borderRadius ?? legacyBorderRadius
    const shadow = appearance?.shadow ?? legacyShadow
    const padding = appearance?.padding ?? legacyPadding

    const showGrid = axes?.showGrid ?? legacyShowGrid
    const gridLines = axes?.gridLines ?? legacyGridLines
    const gridColor = axes?.gridColor ?? legacyGridColor
    const axisColor = axes?.axisColor ?? legacyAxisColor
    const showXAxisLabels = axes?.showXAxisLabels ?? legacyShowXAxisLabels
    const maxXAxisLabels = axes?.maxXAxisLabels ?? legacyMaxXAxisLabels
    const showYAxisLabels = axes?.showYAxisLabels ?? legacyShowYAxisLabels
    const yAxisLabels = axes?.yAxisLabels ?? legacyYAxisLabels
    const startAtZero = axes?.startAtZero ?? legacyStartAtZero

    const accentColor = series?.accentColor ?? (chartType === "bar" ? legacyBarColor : legacyLineColor)
    const lineWidth = series?.lineWidth ?? legacyLineWidth
    const smoothLine = series?.smoothLine ?? legacySmoothLine
    const showMarkers = series?.showMarkers ?? legacyShowMarkers
    const markerSize = series?.markerSize ?? legacyMarkerSize
    const showArea = series?.showArea ?? legacyShowArea
    const areaOpacity = series?.areaOpacity ?? legacyAreaOpacity
    const barRadius = series?.barRadius ?? legacyBarRadius
    const barGap = series?.barGap ?? legacyBarGap

    const format = numbers?.format ?? legacyFormat
    const decimals = numbers?.decimals ?? legacyDecimals
    const prefix = numbers?.prefix ?? legacyPrefix
    const suffix = numbers?.suffix ?? legacySuffix

    const tooltip = tooltipConfig?.enabled ?? legacyTooltip
    const tooltipBackground = tooltipConfig?.background ?? legacyTooltipBackground
    const tooltipTextColor = tooltipConfig?.textColor ?? legacyTooltipTextColor
    const crosshairColor = tooltipConfig?.crosshairColor ?? legacyCrosshairColor

    const titleFont = typography?.titleFont ?? legacyTitleFont
    const labelFont = typography?.labelFont ?? legacyLabelFont
    const tooltipFont = typography?.tooltipFont ?? legacyTooltipFont
    const titleColor = typography?.titleColor ?? legacyTitleColor
    const labelColor = typography?.labelColor ?? legacyLabelColor

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const svgRef = React.useRef<SVGSVGElement>(null)

    const [activeIndex, setActiveIndex] = React.useState<number>(-1)
    const [pointerSvg, setPointerSvg] = React.useState<{ x: number; y: number } | null>(null)

    const inView = useInView(containerRef, { margin: "80px 0px 80px 0px", amount: 0.15 })

    const safeData = React.useMemo(() => {
        const cleaned = Array.isArray(data) ? data.filter((p) => p && typeof p.value === "number" && isFinite(p.value)) : []
        if (cleaned.length === 0) return [{ label: "—", value: 0 }]
        return cleaned
    }, [data])

    const values = React.useMemo(() => safeData.map((d) => d.value), [safeData])

    const { min: rawMin, max: rawMax } = React.useMemo(() => safeMinMax(values), [values])

    const domain = React.useMemo(() => {
        let min = rawMin
        let max = rawMax
        if (startAtZero) min = Math.min(0, min)
        if (min === max) max = min + 1
        return { min, max }
    }, [rawMin, rawMax, startAtZero])

    const formatValue = React.useCallback(
        (v: number) => {
            const rounded = roundTo(v, decimals)
            if (typeof Intl === "undefined") return `${prefix}${rounded}${suffix}`

            let nf: Intl.NumberFormat
            if (format === "percent") {
                nf = new Intl.NumberFormat(undefined, {
                    style: "percent",
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                })
                return `${prefix}${nf.format(rounded)}${suffix}`
            }

            if (format === "compact") {
                nf = new Intl.NumberFormat(undefined, {
                    notation: "compact",
                    maximumFractionDigits: decimals,
                    minimumFractionDigits: decimals,
                })
                return `${prefix}${nf.format(rounded)}${suffix}`
            }

            nf = new Intl.NumberFormat(undefined, {
                maximumFractionDigits: decimals,
                minimumFractionDigits: decimals,
            })
            return `${prefix}${nf.format(rounded)}${suffix}`
        },
        [decimals, format, prefix, suffix],
    )

    const dims = React.useMemo(() => {
        const w = (props.style?.width as any) === "100%" ? "fill" : "fixedOrAuto"
        const h = (props.style?.height as any) === "100%" ? "fill" : "fixedOrAuto"
        return { w, h }
    }, [props.style?.height, props.style?.width])

    const canInteract = !isStatic && inView && RenderTarget.current() === RenderTarget.preview

    const chartGeometry = React.useMemo(() => {
        const titleBlock = 0
        const xLabelBlock = showXAxisLabels ? 26 : 12
        const yLabelBlock = showYAxisLabels ? 46 : 14

        return {
            titleBlock,
            xLabelBlock,
            yLabelBlock,
        }
    }, [showXAxisLabels, showYAxisLabels])

    const yTicks = React.useMemo(() => {
        const count = clamp(Math.round(yAxisLabels), 2, 10)
        const ticks: number[] = []
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1)
            const v = domain.max + (domain.min - domain.max) * t
            ticks.push(v)
        }
        return ticks
    }, [domain.max, domain.min, yAxisLabels])

    const xLabelIndices = React.useMemo(() => {
        const n = safeData.length
        if (!showXAxisLabels) return []
        const maxLabels = clamp(Math.round(maxXAxisLabels), 2, 12)
        if (n <= maxLabels) return Array.from({ length: n }, (_, i) => i)

        const indices: number[] = []
        const step = (n - 1) / (maxLabels - 1)
        for (let i = 0; i < maxLabels; i++) {
            const idx = Math.round(i * step)
            if (!indices.includes(idx)) indices.push(idx)
        }
        indices.sort((a, b) => a - b)
        return indices
    }, [maxXAxisLabels, safeData.length, showXAxisLabels])

    const getSvgPointFromEvent = React.useCallback((e: React.PointerEvent) => {
        if (!svgRef.current) return null
        const svg = svgRef.current
        const rect = svg.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        if (!isFinite(x) || !isFinite(y)) return null
        return { x, y }
    }, [])

    const onPointerLeave = React.useCallback(() => {
        if (!canInteract) return
        React.startTransition(() => {
            setActiveIndex(-1)
            setPointerSvg(null)
        })
    }, [canInteract])

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (!canInteract || !tooltip) return
            const pt = getSvgPointFromEvent(e)
            if (!pt) return
            React.startTransition(() => setPointerSvg(pt))

            const n = safeData.length
            if (n <= 0) return

            const titleBlock = chartGeometry.titleBlock
            const chartTop = padding + titleBlock
            const chartLeft = padding + chartGeometry.yLabelBlock
            const chartRight = padding
            const chartBottom = padding + chartGeometry.xLabelBlock

            const svg = svgRef.current
            if (!svg) return
            const rect = svg.getBoundingClientRect()
            const width = rect.width
            const height = rect.height

            const innerW = Math.max(1, width - chartLeft - chartRight)
            const innerH = Math.max(1, height - chartTop - chartBottom)

            const x = clamp(pt.x, chartLeft, chartLeft + innerW)
            const relX = (x - chartLeft) / innerW

            let idx = 0
            if (chartType === "bar") {
                idx = Math.round(relX * (n - 1))
            } else {
                idx = Math.round(relX * (n - 1))
            }
            idx = clamp(idx, 0, n - 1)

            React.startTransition(() => setActiveIndex(idx))
        },
        [
            canInteract,
            chartGeometry.titleBlock,
            chartGeometry.xLabelBlock,
            chartGeometry.yLabelBlock,
            chartType,
            getSvgPointFromEvent,
            padding,
            safeData.length,
            tooltip,
        ],
    )

    const svgElements = React.useMemo(() => {
        const n = safeData.length
        const titleBlock = chartGeometry.titleBlock
        const chartTop = padding + titleBlock
        const chartLeft = padding + chartGeometry.yLabelBlock
        const chartRight = padding
        const chartBottom = padding + chartGeometry.xLabelBlock

        const viewW = 1000
        const viewH = 560

        const innerW = Math.max(1, viewW - chartLeft - chartRight)
        const innerH = Math.max(1, viewH - chartTop - chartBottom)

        const xForIndex = (i: number) => {
            if (n === 1) return chartLeft + innerW / 2
            return chartLeft + (i / (n - 1)) * innerW
        }

        const yForValue = (v: number) => {
            const t = (v - domain.min) / (domain.max - domain.min)
            const inv = 1 - t
            return chartTop + inv * innerH
        }

        const grid = []
        if (showGrid) {
            const count = clamp(Math.round(gridLines), 2, 10)
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1)
                const y = chartTop + t * innerH
                grid.push(
                    <line
                        key={`grid-${i}`}
                        x1={chartLeft}
                        y1={y}
                        x2={chartLeft + innerW}
                        y2={y}
                        stroke={gridColor}
                        strokeWidth={1}
                        opacity={i === count - 1 ? 0.8 : 0.6}
                        shapeRendering="crispEdges"
                    />,
                )
            }
        }

        const axis = (
            <>
                <line
                    x1={chartLeft}
                    y1={chartTop + innerH}
                    x2={chartLeft + innerW}
                    y2={chartTop + innerH}
                    stroke={axisColor}
                    strokeWidth={1}
                    opacity={0.9}
                    shapeRendering="crispEdges"
                />
                <line
                    x1={chartLeft}
                    y1={chartTop}
                    x2={chartLeft}
                    y2={chartTop + innerH}
                    stroke={axisColor}
                    strokeWidth={1}
                    opacity={0.9}
                    shapeRendering="crispEdges"
                />
            </>
        )

        const yLabelEls = []
        if (showYAxisLabels) {
            for (let i = 0; i < yTicks.length; i++) {
                const v = yTicks[i]
                const y = yForValue(v)
                yLabelEls.push(
                    <text
                        key={`y-label-${i}`}
                        x={chartLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        style={{
                            ...labelFont,
                            fill: labelColor,
                            opacity: 0.7,
                            userSelect: "none",
                        }}
                    >
                        {formatValue(v)}
                    </text>,
                )
            }
        }

        const xLabelEls = []
        if (showXAxisLabels) {
            for (let i = 0; i < xLabelIndices.length; i++) {
                const idx = xLabelIndices[i]
                const x = xForIndex(idx)
                xLabelEls.push(
                    <text
                        key={`x-label-${idx}`}
                        x={x}
                        y={chartTop + innerH + 18}
                        textAnchor="middle"
                        style={{
                            ...labelFont,
                            fill: labelColor,
                            opacity: 0.75,
                            userSelect: "none",
                        }}
                    >
                        {safeData[idx]?.label ?? ""}
                    </text>,
                )
            }
        }

        let seriesEls: React.ReactNode = null

        if (chartType === "bar") {
            const gap = clamp(barGap, 0, 40)
            const barCount = n
            const totalGap = gap * Math.max(0, barCount - 1)
            const barW = Math.max(2, (innerW - totalGap) / Math.max(1, barCount))
            const r = clamp(barRadius, 0, 48)

            const bars = []
            for (let i = 0; i < n; i++) {
                const v = safeData[i].value
                const x = chartLeft + i * (barW + gap)
                const y = yForValue(v)
                const h = chartTop + innerH - y

                const isActive = i === activeIndex && tooltip && canInteract
                const fill = safeData[i].color || accentColor

                bars.push(
                    <motion.rect
                        key={`bar-${i}`}
                        x={x}
                        y={y}
                        width={barW}
                        height={Math.max(0.0001, h)}
                        rx={r}
                        ry={r}
                        fill={fill}
                        initial={false}
                        animate={
                            canInteract
                                ? {
                                      opacity: isActive ? 1 : 0.9,
                                  }
                                : { opacity: 0.95 }
                        }
                        transition={{ duration: 0.18 }}
                    />,
                )
            }

            seriesEls = <>{bars}</>
        } else {
            const pts = safeData.map((d, i) => ({ x: xForIndex(i), y: yForValue(d.value) }))
            const path = smoothLine ? buildSmoothPath(pts) : buildLinearPath(pts)

            const baselineY = yForValue(domain.min)
            const areaPath =
                pts.length >= 2
                    ? `${path} L ${pts[pts.length - 1].x} ${baselineY} L ${pts[0].x} ${baselineY} Z`
                    : pts.length === 1
                      ? `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${baselineY} Z`
                      : ""

            const markers =
                showMarkers && pts.length > 0
                    ? pts.map((p, i) => {
                          const isActive = i === activeIndex && tooltip && canInteract
                          return (
                              <motion.circle
                                  key={`marker-${i}`}
                                  cx={p.x}
                                  cy={p.y}
                                  r={Math.max(1, markerSize / 2)}
                                  fill={accentColor}
                                  initial={false}
                                  animate={
                                      canInteract
                                          ? {
                                                opacity: isActive ? 1 : 0.9,
                                                r: isActive ? Math.max(2, markerSize / 2 + 1.5) : Math.max(1, markerSize / 2),
                                            }
                                          : { opacity: 0.95, r: Math.max(1, markerSize / 2) }
                                  }
                                  transition={{ duration: 0.18 }}
                              />
                          )
                      })
                    : null

            seriesEls = (
                <>
                    {showArea && areaPath ? (
                        <path d={areaPath} fill={accentColor} opacity={clamp(areaOpacity, 0, 1)} stroke="none" />
                    ) : null}
                    <path
                        d={path}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth={lineWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {markers}
                </>
            )
        }

        let crosshair: React.ReactNode = null
        if (tooltip && canInteract && activeIndex >= 0 && activeIndex < n) {
            const x = xForIndex(activeIndex)
            crosshair = (
                <line
                    x1={x}
                    y1={chartTop}
                    x2={x}
                    y2={chartTop + innerH}
                    stroke={crosshairColor}
                    strokeWidth={1}
                    opacity={0.7}
                    strokeDasharray="4 4"
                />
            )
        }

        return {
            viewW,
            viewH,
            axis,
            grid,
            seriesEls,
            yLabelEls,
            xLabelEls,
            crosshair,
            chartBounds: { chartLeft, chartTop, innerW, innerH },
        }
    }, [
        activeIndex,
        accentColor,
        areaOpacity,
        axisColor,
        barGap,
        barRadius,
        canInteract,
        chartGeometry.titleBlock,
        chartGeometry.xLabelBlock,
        chartGeometry.yLabelBlock,
        chartType,
        crosshairColor,
        domain.max,
        domain.min,
        formatValue,
        gridColor,
        gridLines,
        labelColor,
        labelFont,
        lineWidth,
        markerSize,
        padding,
        safeData,
        showArea,
        showGrid,
        showMarkers,
        showXAxisLabels,
        showYAxisLabels,
        smoothLine,
        tooltip,
        xLabelIndices,
        yTicks,
    ])

    const tooltipModel = React.useMemo(() => {
        if (!tooltip || activeIndex < 0 || activeIndex >= safeData.length) return null
        const p = safeData[activeIndex]
        return {
            label: p.label ?? "",
            value: p.value,
            valueText: formatValue(p.value),
            color: accentColor,
        }
    }, [accentColor, activeIndex, formatValue, safeData, tooltip])

    const tooltipCss: React.CSSProperties = React.useMemo(() => {
        if (!tooltipModel || !pointerSvg) return { display: "none" }

        const bounds = svgElements.chartBounds
        const svg = svgRef.current
        const rect = svg?.getBoundingClientRect()
        const viewW = rect?.width ?? svgElements.viewW
        const viewH = rect?.height ?? svgElements.viewH

        const ptX = clamp(pointerSvg.x, 0, viewW)
        const ptY = clamp(pointerSvg.y, 0, viewH)

        const pad = 10
        const preferRight = ptX < viewW * 0.6
        const left = preferRight ? ptX + 12 : ptX - 12
        const top = clamp(ptY - 18, bounds.chartTop + pad, bounds.chartTop + bounds.innerH - pad)

        return {
            position: "absolute",
            left,
            top,
            transform: preferRight ? "translate(0, -100%)" : "translate(-100%, -100%)",
            maxWidth: 220,
            background: tooltipBackground,
            color: tooltipTextColor,
            borderRadius: 10,
            padding: "10px 12px",
            boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            ...tooltipFont,
            zIndex: 10,
        }
    }, [pointerSvg, svgElements.chartBounds, svgElements.viewH, svgElements.viewW, tooltipBackground, tooltipFont, tooltipModel, tooltipTextColor])

    const rootStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "visible",
            display: "flex",
            flexDirection: "column",
            background: backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius,
            boxShadow: shadow,
        }),
        [backgroundColor, borderColor, borderRadius, borderWidth, shadow],
    )

    const headerStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            display: showTitle ? "flex" : "none",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            paddingLeft: padding,
            paddingRight: padding,
            paddingTop: padding,
            paddingBottom: 0,
            pointerEvents: "none",
        }),
        [padding, showTitle],
    )

    const titleStyle: React.CSSProperties = React.useMemo(
        () => ({
            margin: 0,
            color: titleColor,
            ...titleFont,
            lineHeight: (titleFont?.lineHeight as any) ?? "1.1em",
            letterSpacing: titleFont?.letterSpacing,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: "1 1 auto",
            maxWidth: "100%",
            minWidth: 0,
        }),
        [titleColor, titleFont],
    )

    const svgWrapStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            flex: "1 1 auto",
            minHeight: 0,
            width: "100%",
            height: "100%",
            padding: 0,
        }),
        [],
    )

    const tooltipNode = tooltip && tooltipModel && canInteract ? (
        <div style={tooltipCss} aria-hidden="true">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: tooltipModel.color,
                        flex: "0 0 auto",
                    }}
                />
                <span style={{ opacity: 0.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tooltipModel.label}
                </span>
            </div>
            <div style={{ fontWeight: 600, color: tooltipTextColor, whiteSpace: "nowrap" }}>{tooltipModel.valueText}</div>
        </div>
    ) : null

    return (
        <section
            ref={containerRef}
            style={{ ...rootStyle, ...props.style }}
            aria-label="Interactive Chart Kit"
            onPointerLeave={canInteract ? onPointerLeave : undefined}
        >
            <div style={headerStyle}>
                <h3 style={titleStyle}>{title}</h3>
            </div>

            <div style={svgWrapStyle}>
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${svgElements.viewW} ${svgElements.viewH}`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`${chartType} chart`}
                    onPointerMove={canInteract ? onPointerMove : undefined}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        touchAction: "none",
                        cursor: canInteract && tooltip ? "crosshair" : "default",
                    }}
                >
                    <g>
                        {svgElements.grid}
                        {svgElements.axis}
                        {svgElements.crosshair}
                        {svgElements.seriesEls}
                        {svgElements.yLabelEls}
                        {svgElements.xLabelEls}
                    </g>
                </svg>

                {tooltipNode}
            </div>
        </section>
    )
}

addPropertyControls(InteractiveChartKit, {
    chartType: {
        type: ControlType.Enum,
        title: "Type",
        options: ["line", "bar"],
        optionTitles: ["Line", "Bar"],
        defaultValue: "line",
        displaySegmentedControl: true,
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Revenue",
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    data: {
        type: ControlType.Array,
        title: "Data",
        maxCount: 24,
        defaultValue: [
            { label: "Jan", value: 12 },
            { label: "Feb", value: 18 },
            { label: "Mar", value: 14 },
            { label: "Apr", value: 26 },
            { label: "May", value: 22 },
            { label: "Jun", value: 34 },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Jan" },
                value: { type: ControlType.Number, title: "Value", defaultValue: 12, step: 1 },
            },
        },
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "effect",
        controls: {
            backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            borderColor: { type: ControlType.Color, title: "Border", defaultValue: "#EEEEEE" },
            borderWidth: { type: ControlType.Number, title: "Border W", defaultValue: 1, min: 0, max: 8, step: 1 },
            borderRadius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "16px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0 10px 30px rgba(0,0,0,0.08)" },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: 18, min: 0, max: 60, step: 1 },
        },
    },

    axes: {
        type: ControlType.Object,
        title: "Axes & Grid",
        icon: "interaction",
        controls: {
            showGrid: { type: ControlType.Boolean, title: "Grid", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
            gridLines: { type: ControlType.Number, title: "Grid Lines", defaultValue: 4, min: 2, max: 10, step: 1 },
            gridColor: { type: ControlType.Color, title: "Grid Color", defaultValue: "#EEEEEE" },
            axisColor: { type: ControlType.Color, title: "Axis Color", defaultValue: "#CCCCCC" },

            showXAxisLabels: { type: ControlType.Boolean, title: "X Labels", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
            maxXAxisLabels: { type: ControlType.Number, title: "Max X Labels", defaultValue: 6, min: 2, max: 12, step: 1 },

            showYAxisLabels: { type: ControlType.Boolean, title: "Y Labels", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
            yAxisLabels: { type: ControlType.Number, title: "Y Ticks", defaultValue: 4, min: 2, max: 10, step: 1 },

            startAtZero: { type: ControlType.Boolean, title: "Start at 0", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
        },
    },

    series: {
        type: ControlType.Object,
        title: "Series",
        icon: "color",
        controls: {
            accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#0066FF" },

            lineWidth: { type: ControlType.Number, title: "Line W", defaultValue: 3, min: 1, max: 10, step: 0.5 },
            smoothLine: { type: ControlType.Boolean, title: "Smooth", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
            showMarkers: { type: ControlType.Boolean, title: "Markers", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
            markerSize: { type: ControlType.Number, title: "Marker Size", defaultValue: 5, min: 2, max: 18, step: 1 },

            showArea: { type: ControlType.Boolean, title: "Area", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
            areaOpacity: { type: ControlType.Number, title: "Area Opacity", defaultValue: 0.14, min: 0, max: 1, step: 0.01 },

            barRadius: { type: ControlType.Number, title: "Bar Radius", defaultValue: 8, min: 0, max: 40, step: 1 },
            barGap: { type: ControlType.Number, title: "Bar Gap", defaultValue: 10, min: 0, max: 30, step: 1 },
        },
    },

    numbers: {
        type: ControlType.Object,
        title: "Numbers",
        icon: "object",
        controls: {
            format: {
                type: ControlType.Enum,
                title: "Format",
                options: ["number", "compact", "percent"],
                optionTitles: ["Number", "Compact", "Percent"],
                defaultValue: "compact",
            },
            decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 6, step: 1 },
            prefix: { type: ControlType.String, title: "Prefix", defaultValue: "$" },
            suffix: { type: ControlType.String, title: "Suffix", defaultValue: "" },
        },
    },

    tooltipStyle: {
        type: ControlType.Object,
        title: "Tooltip",
        icon: "interaction",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
            background: { type: ControlType.Color, title: "BG", defaultValue: "#111111" },
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
            crosshairColor: { type: ControlType.Color, title: "Crosshair", defaultValue: "#CCCCCC" },
        },
    },

    typography: {
        type: ControlType.Object,
        title: "Typography",
        icon: "object",
        controls: {
            titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: "#000000" },
            labelColor: { type: ControlType.Color, title: "Label Color", defaultValue: "#000000" },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
            labelFont: {
                type: ControlType.Font,
                title: "Label Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
            tooltipFont: {
                type: ControlType.Font,
                title: "Tooltip Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
        },
    },
})