/**
 * ChartJS Pro Card - Framer Marketplace Component
 * Dependency: chart.js (npm install chart.js)
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 450
 * @framerIntrinsicHeight 350
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useEffect, useMemo, useRef, useCallback } from "react"
import { Chart as ChartJS, registerables } from "chart.js"

ChartJS.register(...registerables)

// ─── Goal Line Plugin (draws full-width across chartArea) ────────────────────

const GOAL_PLUGIN_ID = "goalLinePro"

const GoalLineProPlugin = {
    id: GOAL_PLUGIN_ID,
    afterDatasetsDraw(chart: any, _args: any, opts: any) {
        const o = opts || {}
        if (!o.enabled) return

        const t = chart?.config?.type
        if (t !== "bar" && t !== "line") return

        const yScale = chart?.scales?.y
        const area = chart?.chartArea
        const ctx = chart?.ctx
        if (!yScale || !area || !ctx) return

        const v = Number(o.value)
        if (!Number.isFinite(v)) return

        const y = yScale.getPixelForValue(v)
        if (!Number.isFinite(y)) return

        const left = area.left
        const right = area.right
        const top = area.top
        const bottom = area.bottom

        if (y < top || y > bottom) return

        ctx.save()

        // Clip to chartArea so it never bleeds into header/legend/card padding
        ctx.beginPath()
        ctx.rect(left, top, right - left, bottom - top)
        ctx.clip()

        ctx.lineWidth = Number(o.lineWidth) || 2
        ctx.strokeStyle = o.color || "rgba(255,255,255,0.86)"
        const dash = Array.isArray(o.dash) ? o.dash : [6, 4]
        ctx.setLineDash(dash)
        ctx.lineDashOffset = 0

        ctx.beginPath()
        ctx.moveTo(left, y)
        ctx.lineTo(right, y)
        ctx.stroke()

        if (o.showLabel && o.label) {
            ctx.setLineDash([])
            ctx.fillStyle = o.labelColor || o.color || "rgba(255,255,255,0.86)"
            const fontSize = Number(o.fontSize) || 12
            const fontWeight = Number(o.fontWeight) || 600
            ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
            ctx.textAlign = "right"
            ctx.textBaseline = "bottom"
            const pad = Number(o.labelPadding) || 6
            ctx.fillText(String(o.label), right - pad, y - pad)
        }

        ctx.restore()
    },
}

// Guard against double registration in hot reload environments
const __any = ChartJS as any
if (!__any.__goalLineProRegistered) {
    ChartJS.register(GoalLineProPlugin)
    __any.__goalLineProRegistered = true
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
    "bar",
    "line",
    "pie",
    "doughnut",
    "radar",
    "polarArea",
])

function safeType(t: any): string {
    return ALLOWED_TYPES.has(t) ? t : "bar"
}

function parseCSV(s: string): string[] {
    return (s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
}

function parseNumCSV(s: string): number[] {
    return parseCSV(s)
        .map((x) => Number(x))
        .filter(Number.isFinite as (n: number) => boolean)
}

function clamp(n: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, n))
}

function fmt(n: number, dec: number, pre: string, suf: string) {
    return `${pre || ""}${n.toFixed(clamp(dec, 0, 6))}${suf || ""}`
}

function hexToRgba(hex: string, alpha: number) {
    const h = (hex || "").replace("#", "").trim()
    if (h.length !== 3 && h.length !== 6) return `rgba(255,255,255,${alpha})`
    const full =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function toRgba(color: string, alpha: number) {
    const c = (color || "").trim()
    if (!c) return `rgba(255,255,255,${alpha})`
    if (c.startsWith("rgba(") || c.startsWith("rgb(")) return c
    return hexToRgba(c, alpha)
}

function hexToRgbTuple(hex: string): [number, number, number] | null {
    const h = (hex || "").replace("#", "").trim()
    if (h.length !== 3 && h.length !== 6) return null
    const full =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    if (![r, g, b].every(Number.isFinite)) return null
    return [r, g, b]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const rr = r / 255
    const gg = g / 255
    const bb = b / 255

    const max = Math.max(rr, gg, bb)
    const min = Math.min(rr, gg, bb)
    const d = max - min

    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1))
        switch (max) {
            case rr:
                h = ((gg - bb) / d) % 6
                break
            case gg:
                h = (bb - rr) / d + 2
                break
            default:
                h = (rr - gg) / d + 4
                break
        }
        h *= 60
        if (h < 0) h += 360
    }

    return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2

    let rr = 0
    let gg = 0
    let bb = 0

    if (h >= 0 && h < 60) {
        rr = c
        gg = x
        bb = 0
    } else if (h >= 60 && h < 120) {
        rr = x
        gg = c
        bb = 0
    } else if (h >= 120 && h < 180) {
        rr = 0
        gg = c
        bb = x
    } else if (h >= 180 && h < 240) {
        rr = 0
        gg = x
        bb = c
    } else if (h >= 240 && h < 300) {
        rr = x
        gg = 0
        bb = c
    } else {
        rr = c
        gg = 0
        bb = x
    }

    const r = Math.round((rr + m) * 255)
    const g = Math.round((gg + m) * 255)
    const b = Math.round((bb + m) * 255)
    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)]
}

function rgbToHex(r: number, g: number, b: number) {
    const to2 = (n: number) => n.toString(16).padStart(2, "0")
    return `#${to2(clamp(Math.round(r), 0, 255))}${to2(
        clamp(Math.round(g), 0, 255)
    )}${to2(clamp(Math.round(b), 0, 255))}`
}

function buildHuePalette(seedHex: string, count: number): string[] {
    const base = hexToRgbTuple(seedHex) || [107, 195, 78]
    const [h0, s0, l0] = rgbToHsl(base[0], base[1], base[2])

    const out: string[] = []
    const n = Math.max(1, Math.floor(count))

    for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1)
        const h = (h0 + 42 * i) % 360
        const s = clamp(s0 * 0.92 + 0.08, 0.35, 0.92)
        const l = clamp(l0 * (0.88 + 0.18 * Math.sin(t * Math.PI)), 0.28, 0.72)
        const [r, g, b] = hslToRgb(h, s, l)
        out.push(rgbToHex(r, g, b))
    }
    return out
}

function padToLen(arr: number[], len: number, fillValue = 0) {
    const out = arr.slice(0, len)
    while (out.length < len) out.push(fillValue)
    return out
}

function computeRange(values: number[]) {
    const clean = values.filter((n) => Number.isFinite(n))
    if (clean.length === 0) return { min: 0, max: 1 }
    let min = clean[0]
    let max = clean[0]
    for (let i = 1; i < clean.length; i++) {
        const v = clean[i]
        if (v < min) min = v
        if (v > max) max = v
    }
    if (!Number.isFinite(min) || !Number.isFinite(max))
        return { min: 0, max: 1 }
    if (min === max) {
        const pad = Math.max(1, Math.abs(max) * 0.1)
        return { min: min - pad, max: max + pad }
    }
    const pad = (max - min) * 0.1
    return { min: min - pad, max: max + pad }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChartJS_ProCard(props: any) {
    const { chartType = "bar" } = props

    const {
        title = "Monthly Revenue",
        description = "This year vs last year (USD)",
    } = props.header || {}

    const {
        labels = "Jan, Feb, Mar, Apr, May",
        ds1Label = "2026",
        ds1Values = "42000, 58000, 51000, 74000, 92000",
        ds1Color = "#6BC34E",
        ds2Enabled = true,
        ds2Label = "2025",
        ds2Values = "35000, 44000, 46000, 62000, 70000",
        ds2Color = "#60A5FA",
        ds3Enabled = false,
        ds3Label = "Series 3",
        ds3Values = "14000, 19000, 17000, 25000, 30000",
        ds3Color = "#9CA3AF",
        ds4Enabled = false,
        ds4Label = "Series 4",
        ds4Values = "8000, 11000, 9000, 14000, 16000",
        ds4Color = "#F59E0B",
        ds5Enabled = false,
        ds5Label = "Series 5",
        ds5Values = "6000, 9000, 7000, 10000, 12000",
        ds5Color = "#A78BFA",
    } = props.datasets || {}

    const {
        goalEnabled = false,
        goalValue = 80000,
        goalLabel = "Goal",
        goalColor = "#FFFFFF",
    } = props.goalLine || {}

    const {
        sparklineMode = false,
        showLegend = true,
        legendPosition = "top",
        showTooltips = true,
        showGrid = true,
        showAxes = true,
        showValuesList = true,
    } = props.display || {}

    const {
        valuePrefix = "$",
        valueSuffix = "",
        valueDecimals = 0,
    } = props.formatting || {}

    const {
        background = "#161616",
        textColor = "#FFFFFF",
        mutedTextColor = "rgba(255,255,255,0.72)",
        radius = 16,
        padding = 18,
        cardBorderWidth = 1,
        cardBorderColor = "rgba(255,255,255,0.08)",
        shadow = "soft",
        hoverLift = true,
        barRadius = 8,
        lineTension = 0.35,
        pointRadius = 3,
        datasetFill = true,
        fillOpacity = 0.14,
    } = props.style || {}

    const { animateOnMount = true, animationDuration = 650 } =
        props.animation || {}

    const type = useMemo(() => safeType(chartType), [chartType])
    const isCartesian = type === "bar" || type === "line"
    const isRadar = type === "radar"
    const isArc = type === "pie" || type === "doughnut" || type === "polarArea"
    const isPolarArea = type === "polarArea"

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const chartRef = useRef<any>(null)
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const chartAreaRef = useRef<HTMLDivElement | null>(null)
    const resizeRafRef = useRef<number | null>(null)

    const parsedLabels = useMemo(() => parseCSV(labels), [labels])
    const d1 = useMemo(() => parseNumCSV(ds1Values), [ds1Values])
    const d2 = useMemo(() => parseNumCSV(ds2Values), [ds2Values])
    const d3 = useMemo(() => parseNumCSV(ds3Values), [ds3Values])
    const d4 = useMemo(() => parseNumCSV(ds4Values), [ds4Values])
    const d5 = useMemo(() => parseNumCSV(ds5Values), [ds5Values])

    const normalizedLabels = useMemo(() => {
        const maxLen = Math.max(
            parsedLabels.length,
            d1.length,
            ds2Enabled ? d2.length : 0,
            ds3Enabled ? d3.length : 0,
            ds4Enabled ? d4.length : 0,
            ds5Enabled ? d5.length : 0
        )
        const out = [...parsedLabels.slice(0, maxLen)]
        while (out.length < maxLen) out.push(`Item ${out.length + 1}`)
        return out
    }, [
        parsedLabels,
        d1,
        d2,
        d3,
        d4,
        d5,
        ds2Enabled,
        ds3Enabled,
        ds4Enabled,
        ds5Enabled,
    ])

    const safeLen = normalizedLabels.length

    const arcLen = useMemo(() => {
        if (!isArc) return safeLen
        const maxLen = Math.max(parsedLabels.length, d1.length)
        return Math.max(1, maxLen)
    }, [isArc, safeLen, parsedLabels.length, d1.length])

    const arcLabels = useMemo(() => {
        if (!isArc) return normalizedLabels
        const out = [...parsedLabels.slice(0, arcLen)]
        while (out.length < arcLen) out.push(`Item ${out.length + 1}`)
        return out
    }, [isArc, parsedLabels, arcLen, normalizedLabels])

    const valueFormatter = useCallback(
        (v: any) => {
            const n = Number(v)
            return Number.isFinite(n)
                ? fmt(n, valueDecimals, valuePrefix, valueSuffix)
                : `${v}`
        },
        [valueDecimals, valuePrefix, valueSuffix]
    )

    const fillA = useMemo(
        () => clamp(Number(fillOpacity) || 0, 0, 1),
        [fillOpacity]
    )

    const segmentHexPalette = useMemo(() => {
        const n = isArc ? arcLabels.length : 0
        return buildHuePalette(ds1Color, Math.max(1, n))
    }, [isArc, arcLabels.length, ds1Color])

    const segmentBgColors = useMemo(() => {
        const alpha = 0.86
        return segmentHexPalette.map((h) => hexToRgba(h, alpha))
    }, [segmentHexPalette])

    const segmentHoverColors = useMemo(() => {
        const alpha = 0.98
        return segmentHexPalette.map((h) => hexToRgba(h, alpha))
    }, [segmentHexPalette])

    const segmentDotColors = useMemo(() => {
        return segmentHexPalette.map((h) => hexToRgba(h, 1))
    }, [segmentHexPalette])

    const cartesianRange = useMemo(() => {
        if (!isCartesian) return { min: 0, max: 1 }
        const vals: number[] = []

        const pushAll = (arr: number[]) => {
            for (let i = 0; i < Math.min(arr.length, safeLen); i++) {
                const v = arr[i]
                if (Number.isFinite(v)) vals.push(v)
            }
        }

        pushAll(d1)
        if (ds2Enabled) pushAll(d2)
        if (ds3Enabled) pushAll(d3)
        if (ds4Enabled) pushAll(d4)
        if (ds5Enabled) pushAll(d5)

        if (goalEnabled) {
            const gv = Number(goalValue)
            if (Number.isFinite(gv)) vals.push(gv)
        }

        return computeRange(vals)
    }, [
        isCartesian,
        safeLen,
        d1,
        d2,
        d3,
        d4,
        d5,
        ds2Enabled,
        ds3Enabled,
        ds4Enabled,
        ds5Enabled,
        goalEnabled,
        goalValue,
    ])

    const arcValues = useMemo(() => {
        if (!isArc) return []
        return padToLen(d1, arcLen, 0)
    }, [isArc, d1, arcLen])

    const datasets = useMemo(() => {
        if (isArc) {
            const data = arcValues.length ? arcValues : [0]
            const label = ds1Label || "Series"
            const border = toRgba(background, 0.96)

            const ds: any = {
                label,
                data,
                backgroundColor: segmentBgColors.slice(0, data.length),
                hoverBackgroundColor: segmentHoverColors.slice(0, data.length),
                borderColor: border,
                borderWidth: 2,
                spacing: 2,
                hoverOffset: 10,
                borderRadius: 6,
            }

            if (type === "polarArea") {
                ds.borderAlign = "center"
            }

            return [ds]
        }

        const buildDs = (label: string, data: number[], color: string) => {
            const sliced = data.slice(0, safeLen)
            const isLine = type === "line"
            const isBar = type === "bar"
            const isRadarLocal = type === "radar"

            const bg = isLine || isRadarLocal ? hexToRgba(color, fillA) : color

            return {
                label: label || "Series",
                data: sliced,
                backgroundColor: bg,
                borderColor: color,
                borderWidth: 2,
                tension: isLine ? lineTension : 0,
                pointRadius: isLine
                    ? pointRadius
                    : isRadarLocal
                      ? pointRadius
                      : 0,
                pointHoverRadius: isLine ? Math.max(2, pointRadius + 2) : 0,
                fill:
                    (isLine || isRadarLocal) && datasetFill ? "origin" : false,
                borderRadius: isBar ? barRadius : 0,
                borderSkipped: isBar ? false : undefined,
            }
        }

        const result: any[] = [buildDs(ds1Label, d1, ds1Color)]
        if (ds2Enabled) result.push(buildDs(ds2Label, d2, ds2Color))
        if (ds3Enabled) result.push(buildDs(ds3Label, d3, ds3Color))
        if (ds4Enabled) result.push(buildDs(ds4Label, d4, ds4Color))
        if (ds5Enabled) result.push(buildDs(ds5Label, d5, ds5Color))

        return result
    }, [
        isArc,
        arcValues,
        ds1Label,
        background,
        segmentBgColors,
        segmentHoverColors,
        type,
        safeLen,
        fillA,
        lineTension,
        pointRadius,
        datasetFill,
        barRadius,
        d1,
        d2,
        d3,
        d4,
        d5,
        ds1Label,
        ds1Color,
        ds2Enabled,
        ds2Label,
        ds2Color,
        ds3Enabled,
        ds3Label,
        ds3Color,
        ds4Enabled,
        ds4Label,
        ds4Color,
        ds5Enabled,
        ds5Label,
        ds5Color,
    ])

    const chartOptions = useMemo<any>(() => {
        const gridColor = "rgba(255,255,255,0.08)"
        const tickColor = sparklineMode ? "transparent" : mutedTextColor

        const legendAllowed =
            showLegend && !sparklineMode && !(isArc && showValuesList)

        const base: any = {
            responsive: true,
            maintainAspectRatio: false,
            normalized: true,
            resizeDelay: 60,
            animation: animateOnMount
                ? { duration: clamp(animationDuration, 0, 4000) }
                : false,
            plugins: {
                legend: {
                    display: legendAllowed,
                    position: legendPosition,
                    labels: {
                        color: mutedTextColor,
                        boxWidth: 10,
                        boxHeight: 10,
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 16,
                    },
                },
                tooltip: {
                    enabled: showTooltips && !sparklineMode,
                    callbacks: {
                        title: (items: any[]) => {
                            const first = items && items[0]
                            const lbl =
                                first?.label ??
                                first?.chart?.data?.labels?.[first?.dataIndex]
                            return lbl ? `${lbl}` : ""
                        },
                        label: (ctx: any) => {
                            const dsLbl = ctx?.dataset?.label
                                ? `${ctx.dataset.label}: `
                                : ""
                            const parsed = ctx?.parsed
                            const val =
                                parsed && typeof parsed === "object"
                                    ? (parsed.y ?? parsed.r ?? parsed)
                                    : (parsed ?? ctx?.raw)
                            return `${dsLbl}${valueFormatter(val)}`
                        },
                    },
                },

                // Full-width goal line across chartArea (bar + line only)
                [GOAL_PLUGIN_ID]: {
                    enabled:
                        Boolean(goalEnabled) &&
                        (type === "bar" || type === "line"),
                    value: Number(goalValue),
                    color: toRgba(goalColor, 0.86),
                    dash: [6, 4],
                    lineWidth: 2,
                    showLabel: false,
                    label: goalLabel || "Goal",
                    labelColor: toRgba(goalColor, 0.9),
                    fontSize: 12,
                    fontWeight: 650,
                    labelPadding: 6,
                },
            },
        }

        if (isArc) {
            if (type === "doughnut") base.cutout = "62%"
            base.layout = { padding: 6 }

            if (isPolarArea) {
                const radialScaleVisible = showAxes && !sparklineMode
                base.scales = {
                    r: {
                        display: radialScaleVisible,
                        angleLines: {
                            display: showGrid && !sparklineMode,
                            color: gridColor,
                        },
                        grid: {
                            display: showGrid && !sparklineMode,
                            color: gridColor,
                        },
                        pointLabels: {
                            display: radialScaleVisible,
                            color: mutedTextColor,
                            font: { size: 11, weight: 500 },
                            padding: 6,
                        },
                        ticks: {
                            display: radialScaleVisible,
                            color: tickColor,
                            backdropColor: "rgba(0,0,0,0)",
                            callback: (v: any) => valueFormatter(v),
                        },
                    },
                }
            } else {
                base.scales = undefined
            }

            return base
        }

        if (isCartesian) {
            base.interaction = { mode: "nearest", intersect: false }
            base.scales = {
                x: {
                    display: showAxes && !sparklineMode,
                    grid: {
                        display: showGrid && !sparklineMode,
                        color: gridColor,
                    },
                    ticks: { color: tickColor },
                },
                y: {
                    display: showAxes && !sparklineMode,
                    grid: {
                        display: showGrid && !sparklineMode,
                        color: gridColor,
                    },
                    ticks: {
                        color: tickColor,
                        callback: (v: any) => valueFormatter(v),
                    },
                    suggestedMin: cartesianRange.min,
                    suggestedMax: cartesianRange.max,
                },
            }
            base.layout = { padding: 6 }
            return base
        }

        if (isRadar) {
            const radialScaleVisible = showAxes && !sparklineMode
            base.scales = {
                r: {
                    display: radialScaleVisible,
                    angleLines: {
                        display: showGrid && !sparklineMode,
                        color: gridColor,
                    },
                    grid: {
                        display: showGrid && !sparklineMode,
                        color: gridColor,
                    },
                    pointLabels: {
                        display: radialScaleVisible,
                        color: mutedTextColor,
                        font: { size: 11, weight: 500 },
                        padding: 10,
                    },
                    ticks: {
                        display: radialScaleVisible,
                        color: tickColor,
                        backdropColor: "rgba(0,0,0,0)",
                        callback: (v: any) => valueFormatter(v),
                    },
                },
            }
            base.layout = { padding: 10 }
            return base
        }

        return base
    }, [
        isArc,
        isPolarArea,
        isCartesian,
        isRadar,
        type,
        goalEnabled,
        goalValue,
        goalLabel,
        goalColor,
        animateOnMount,
        animationDuration,
        showLegend,
        legendPosition,
        showTooltips,
        showGrid,
        showAxes,
        sparklineMode,
        mutedTextColor,
        valueFormatter,
        cartesianRange.min,
        cartesianRange.max,
        showValuesList,
    ])

    const forceResizeNextFrame = useCallback(() => {
        requestAnimationFrame(() => {
            const chart = chartRef.current
            if (!chart) return
            try {
                chart.resize()
                chart.update("none")
            } catch (e) {}
        })
    }, [])

    const ensureChart = useCallback(() => {
        if (!canvasRef.current) return
        if (chartRef.current) return

        const nextLabels = isArc ? arcLabels : normalizedLabels

        chartRef.current = new ChartJS(canvasRef.current, {
            type: type as any,
            data: { labels: nextLabels, datasets },
            options: chartOptions,
        })

        forceResizeNextFrame()
    }, [
        type,
        isArc,
        arcLabels,
        normalizedLabels,
        datasets,
        chartOptions,
        forceResizeNextFrame,
    ])

    useEffect(() => {
        ensureChart()
        return () => {
            if (resizeRafRef.current != null) {
                cancelAnimationFrame(resizeRafRef.current)
                resizeRafRef.current = null
            }
            if (chartRef.current) {
                try {
                    chartRef.current.destroy()
                } catch (e) {}
                chartRef.current = null
            }
        }
    }, [ensureChart])

    useEffect(() => {
        const chart = chartRef.current
        if (!chart) return
        if (!canvasRef.current) return

        const nextLabels = isArc ? arcLabels : normalizedLabels

        const prevType = chart?.config?.type
        const nextType = type as any
        const typeChanged = prevType !== nextType

        if (typeChanged) {
            const prevCanvas = canvasRef.current
            try {
                chart.destroy()
            } catch (e) {}

            chartRef.current = new ChartJS(prevCanvas, {
                type: nextType,
                data: { labels: nextLabels, datasets },
                options: { ...chartOptions, animation: false },
            })

            forceResizeNextFrame()
            return
        }

        chart.data.labels = nextLabels
        chart.data.datasets = datasets
        chart.options = chartOptions

        try {
            chart.update("none")
        } catch (e) {
            try {
                chart.update()
            } catch (e2) {}
        }
    }, [
        type,
        isArc,
        arcLabels,
        normalizedLabels,
        datasets,
        chartOptions,
        forceResizeNextFrame,
    ])

    useEffect(() => {
        const el = chartAreaRef.current
        if (!el || typeof ResizeObserver === "undefined") return

        const schedule = () => {
            if (resizeRafRef.current != null) {
                cancelAnimationFrame(resizeRafRef.current)
            }
            resizeRafRef.current = requestAnimationFrame(() => {
                resizeRafRef.current = null
                const chart = chartRef.current
                if (!chart) return
                try {
                    chart.resize()
                    chart.update("none")
                } catch (e) {}
            })
        }

        const ro = new ResizeObserver(() => schedule())
        ro.observe(el)

        schedule()

        return () => {
            ro.disconnect()
            if (resizeRafRef.current != null) {
                cancelAnimationFrame(resizeRafRef.current)
                resizeRafRef.current = null
            }
        }
    }, [])

    const cardShadow =
        shadow === "strong"
            ? "0 18px 60px rgba(0,0,0,0.5)"
            : shadow === "soft"
              ? "0 10px 30px rgba(0,0,0,0.35)"
              : "none"

    const headerVisible =
        !sparklineMode && (title?.trim() || description?.trim())

    const showSideList = isArc && !sparklineMode && Boolean(showValuesList)

    return (
        <div
            ref={wrapRef}
            style={{
                position: "absolute",
                inset: 0,
                backgroundColor: background,
                borderRadius: radius,
                padding,
                boxSizing: "border-box",
                border:
                    cardBorderWidth > 0
                        ? `${cardBorderWidth}px solid ${cardBorderColor}`
                        : "none",
                boxShadow: cardShadow,
                color: textColor,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: hoverLift
                    ? "transform 180ms ease, box-shadow 180ms ease"
                    : undefined,
            }}
            onMouseEnter={(e) => {
                if (!hoverLift) return
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow =
                    shadow === "strong"
                        ? "0 24px 80px rgba(0,0,0,0.55)"
                        : shadow === "soft"
                          ? "0 14px 40px rgba(0,0,0,0.45)"
                          : "none"
            }}
            onMouseLeave={(e) => {
                if (!hoverLift) return
                e.currentTarget.style.transform = "translateY(0px)"
                e.currentTarget.style.boxShadow = cardShadow
            }}
        >
            {headerVisible && (
                <div style={{ flex: "0 0 auto", marginBottom: 14 }}>
                    {title?.trim() && (
                        <h3
                            style={{
                                margin: 0,
                                fontSize: 16,
                                lineHeight: 1.15,
                                letterSpacing: "-0.02em",
                                fontWeight: 650,
                            }}
                        >
                            {title}
                        </h3>
                    )}
                    {description?.trim() && (
                        <p
                            style={{
                                margin: title?.trim() ? "5px 0 0" : 0,
                                fontSize: 13,
                                color: mutedTextColor,
                                lineHeight: 1.35,
                            }}
                        >
                            {description}
                        </p>
                    )}
                </div>
            )}

            <div
                ref={chartAreaRef}
                style={{
                    flex: "1 1 auto",
                    minHeight: 60,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "stretch",
                    gap: showSideList ? 14 : 0,
                }}
            >
                {showSideList && (
                    <div
                        style={{
                            flex: "0 0 44%",
                            minWidth: 150,
                            maxWidth: 300,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            gap: 10,
                            paddingTop: 4,
                            paddingBottom: 4,
                        }}
                    >
                        {arcLabels.map((lbl: string, i: number) => {
                            const v = arcValues[i] ?? 0
                            const dot =
                                segmentDotColors[i] || "rgba(255,255,255,0.9)"
                            return (
                                <div
                                    key={`${lbl}-${i}`}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            minWidth: 0,
                                            flex: "1 1 auto",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 999,
                                                background: dot,
                                                boxShadow:
                                                    "0 0 0 2px rgba(255,255,255,0.06)",
                                                flex: "0 0 auto",
                                            }}
                                        />
                                        <div
                                            style={{
                                                fontSize: 13,
                                                lineHeight: 1.2,
                                                color: mutedTextColor,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {lbl}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            lineHeight: 1.2,
                                            color: textColor,
                                            fontWeight: 600,
                                            flex: "0 0 auto",
                                        }}
                                    >
                                        {valueFormatter(v)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <div
                    style={{
                        flex: "1 1 auto",
                        position: "relative",
                        minWidth: 0,
                        minHeight: 60,
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

// ─── Property Controls ───────────────────────────────────────────────────────

addPropertyControls(ChartJS_ProCard, {
    chartType: {
        title: "Chart Type",
        type: ControlType.Enum,
        defaultValue: "bar",
        options: ["bar", "line", "pie", "doughnut", "radar", "polarArea"],
        optionTitles: ["Bar", "Line", "Pie", "Doughnut", "Radar", "Polar Area"],
    },

    header: {
        title: "Header",
        type: ControlType.Object,
        controls: {
            title: {
                title: "Title",
                type: ControlType.String,
                defaultValue: "Monthly Revenue",
            },
            description: {
                title: "Description",
                type: ControlType.String,
                defaultValue: "This year vs last year (USD)",
            },
        },
    },

    datasets: {
        title: "Datasets",
        type: ControlType.Object,
        controls: {
            labels: {
                title: "Labels",
                type: ControlType.String,
                defaultValue: "Jan, Feb, Mar, Apr, May",
                description: "Comma-separated. e.g. Jan, Feb, Mar",
            },

            ds1Label: {
                title: "DS1 Label",
                type: ControlType.String,
                defaultValue: "2026",
            },
            ds1Values: {
                title: "DS1 Values",
                type: ControlType.String,
                defaultValue: "42000, 58000, 51000, 74000, 92000",
                description: "Comma-separated numbers.",
            },
            ds1Color: {
                title: "DS1 Color",
                type: ControlType.Color,
                defaultValue: "#6BC34E",
            },

            ds2Enabled: {
                title: "Dataset 2",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            ds2Label: {
                title: "DS2 Label",
                type: ControlType.String,
                defaultValue: "2025",
                hidden: (p: any) => !p.ds2Enabled,
            },
            ds2Values: {
                title: "DS2 Values",
                type: ControlType.String,
                defaultValue: "35000, 44000, 46000, 62000, 70000",
                hidden: (p: any) => !p.ds2Enabled,
            },
            ds2Color: {
                title: "DS2 Color",
                type: ControlType.Color,
                defaultValue: "#60A5FA",
                hidden: (p: any) => !p.ds2Enabled,
            },

            ds3Enabled: {
                title: "Dataset 3",
                type: ControlType.Boolean,
                defaultValue: false,
            },
            ds3Label: {
                title: "DS3 Label",
                type: ControlType.String,
                defaultValue: "Series 3",
                hidden: (p: any) => !p.ds3Enabled,
            },
            ds3Values: {
                title: "DS3 Values",
                type: ControlType.String,
                defaultValue: "14000, 19000, 17000, 25000, 30000",
                hidden: (p: any) => !p.ds3Enabled,
            },
            ds3Color: {
                title: "DS3 Color",
                type: ControlType.Color,
                defaultValue: "#9CA3AF",
                hidden: (p: any) => !p.ds3Enabled,
            },

            ds4Enabled: {
                title: "Dataset 4",
                type: ControlType.Boolean,
                defaultValue: false,
            },
            ds4Label: {
                title: "DS4 Label",
                type: ControlType.String,
                defaultValue: "Series 4",
                hidden: (p: any) => !p.ds4Enabled,
            },
            ds4Values: {
                title: "DS4 Values",
                type: ControlType.String,
                defaultValue: "8000, 11000, 9000, 14000, 16000",
                hidden: (p: any) => !p.ds4Enabled,
            },
            ds4Color: {
                title: "DS4 Color",
                type: ControlType.Color,
                defaultValue: "#F59E0B",
                hidden: (p: any) => !p.ds4Enabled,
            },

            ds5Enabled: {
                title: "Dataset 5",
                type: ControlType.Boolean,
                defaultValue: false,
            },
            ds5Label: {
                title: "DS5 Label",
                type: ControlType.String,
                defaultValue: "Series 5",
                hidden: (p: any) => !p.ds5Enabled,
            },
            ds5Values: {
                title: "DS5 Values",
                type: ControlType.String,
                defaultValue: "6000, 9000, 7000, 10000, 12000",
                hidden: (p: any) => !p.ds5Enabled,
            },
            ds5Color: {
                title: "DS5 Color",
                type: ControlType.Color,
                defaultValue: "#A78BFA",
                hidden: (p: any) => !p.ds5Enabled,
            },
        },
    },

    goalLine: {
        title: "Goal Line",
        type: ControlType.Object,
        description: "Dashed target line. Bar and Line charts only.",
        hidden: (p: any) => {
            const t = p.chartType || "bar"
            return t !== "bar" && t !== "line"
        },
        controls: {
            goalEnabled: {
                title: "Enabled",
                type: ControlType.Boolean,
                defaultValue: false,
            },
            goalValue: {
                title: "Value",
                type: ControlType.Number,
                defaultValue: 80000,
                min: 0,
                max: 100000,
                step: 100,
                hidden: (p: any) => !p.goalEnabled,
            },
            goalLabel: {
                title: "Label",
                type: ControlType.String,
                defaultValue: "Goal",
                hidden: (p: any) => !p.goalEnabled,
            },
            goalColor: {
                title: "Color",
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.goalEnabled,
            },
        },
    },

    display: {
        title: "Display",
        type: ControlType.Object,
        controls: {
            sparklineMode: {
                title: "Sparkline Mode",
                type: ControlType.Boolean,
                defaultValue: false,
                description: "Hides header, legend, axes, and tooltips.",
            },
            showLegend: {
                title: "Legend",
                type: ControlType.Boolean,
                defaultValue: true,
                hidden: (p: any) => Boolean(p.sparklineMode),
            },
            legendPosition: {
                title: "Legend Position",
                type: ControlType.Enum,
                defaultValue: "top",
                options: ["top", "bottom", "left", "right"],
                hidden: (p: any) =>
                    Boolean(p.sparklineMode) || !Boolean(p.showLegend),
            },
            showTooltips: {
                title: "Tooltips",
                type: ControlType.Boolean,
                defaultValue: true,
                hidden: (p: any) => Boolean(p.sparklineMode),
            },
            showGrid: {
                title: "Grid Lines",
                type: ControlType.Boolean,
                defaultValue: true,
                hidden: (p: any) => Boolean(p.sparklineMode),
            },
            showAxes: {
                title: "Axes",
                type: ControlType.Boolean,
                defaultValue: true,
                hidden: (p: any) => Boolean(p.sparklineMode),
            },
            showValuesList: {
                title: "Values List",
                type: ControlType.Boolean,
                defaultValue: true,
                description:
                    "For Pie, Doughnut, Polar Area. Shows values on the left.",
                hidden: (p: any) => Boolean(p.sparklineMode),
            },
        },
    },

    formatting: {
        title: "Formatting",
        type: ControlType.Object,
        description: "Prefix, suffix, and decimal places for values.",
        controls: {
            valuePrefix: {
                title: "Prefix",
                type: ControlType.String,
                defaultValue: "$",
                description: "e.g. $ or €",
            },
            valueSuffix: {
                title: "Suffix",
                type: ControlType.String,
                defaultValue: "",
                description: "e.g. % or k",
            },
            valueDecimals: {
                title: "Decimals",
                type: ControlType.Number,
                defaultValue: 0,
                min: 0,
                max: 6,
                step: 1,
            },
        },
    },

    style: {
        title: "Style",
        type: ControlType.Object,
        controls: {
            background: {
                title: "Background",
                type: ControlType.Color,
                defaultValue: "#161616",
            },
            textColor: {
                title: "Text",
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
            },
            mutedTextColor: {
                title: "Muted Text",
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.72)",
            },
            radius: {
                title: "Corner Radius",
                type: ControlType.Number,
                defaultValue: 16,
                min: 0,
                max: 40,
                step: 1,
            },
            padding: {
                title: "Padding",
                type: ControlType.Number,
                defaultValue: 18,
                min: 0,
                max: 60,
                step: 1,
            },
            cardBorderWidth: {
                title: "Border Width",
                type: ControlType.Number,
                defaultValue: 1,
                min: 0,
                max: 6,
                step: 1,
            },
            cardBorderColor: {
                title: "Border Color",
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.08)",
                hidden: (p: any) => (p.cardBorderWidth ?? 1) === 0,
            },
            shadow: {
                title: "Shadow",
                type: ControlType.Enum,
                defaultValue: "soft",
                options: ["none", "soft", "strong"],
                optionTitles: ["None", "Soft", "Strong"],
            },
            hoverLift: {
                title: "Hover Lift",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            barRadius: {
                title: "Bar Radius",
                type: ControlType.Number,
                defaultValue: 8,
                min: 0,
                max: 24,
                step: 1,
            },
            lineTension: {
                title: "Line Curve",
                type: ControlType.Number,
                defaultValue: 0.35,
                min: 0,
                max: 1,
                step: 0.05,
                description: "0 = straight, 1 = very curved.",
            },
            pointRadius: {
                title: "Point Size",
                type: ControlType.Number,
                defaultValue: 3,
                min: 0,
                max: 10,
                step: 1,
            },
            datasetFill: {
                title: "Area Fill",
                type: ControlType.Boolean,
                defaultValue: true,
                description: "Fill area beneath Line and Radar series.",
            },
            fillOpacity: {
                title: "Fill Opacity",
                type: ControlType.Number,
                defaultValue: 0.14,
                min: 0,
                max: 1,
                step: 0.02,
                hidden: (p: any) => !Boolean(p.datasetFill),
            },
        },
    },

    animation: {
        title: "Animation",
        type: ControlType.Object,
        controls: {
            animateOnMount: {
                title: "Enabled",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            animationDuration: {
                title: "Duration (ms)",
                type: ControlType.Number,
                defaultValue: 650,
                min: 0,
                max: 4000,
                step: 50,
                hidden: (p: any) => !Boolean(p.animateOnMount),
            },
        },
    },
    _contact: {
        type: ControlType.Link,
        title: "Need help?",
        defaultValue: "zlatkomarjanovic.zm@gmail.com",
    },
})
