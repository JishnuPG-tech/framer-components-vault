// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Chart as ChartJS, registerables } from "chart.js"

ChartJS.register(...registerables)

// ─── Goal Line Plugin ────────────────────────────────────────────────────────

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
        const { left, right, top, bottom } = area
        if (y < top || y > bottom) return
        ctx.save()
        ctx.beginPath()
        ctx.rect(left, top, right - left, bottom - top)
        ctx.clip()
        ctx.lineWidth = Number(o.lineWidth) || 2
        ctx.strokeStyle = o.color || "rgba(255,255,255,0.86)"
        ctx.setLineDash(Array.isArray(o.dash) ? o.dash : [6, 4])
        ctx.lineDashOffset = 0
        ctx.beginPath()
        ctx.moveTo(left, y)
        ctx.lineTo(right, y)
        ctx.stroke()
        if (o.showLabel && o.label) {
            ctx.setLineDash([])
            ctx.fillStyle = o.labelColor || o.color || "rgba(255,255,255,0.86)"
            const fs = Number(o.fontSize) || 12
            const fw = Number(o.fontWeight) || 600
            ctx.font = `${fw} ${fs}px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial`
            ctx.textAlign = "right"
            ctx.textBaseline = "bottom"
            const pad = Number(o.labelPadding) || 6
            ctx.fillText(String(o.label), right - pad, y - pad)
        }
        ctx.restore()
    },
}

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

const safeType = (t: any): string => (ALLOWED_TYPES.has(t) ? t : "bar")

const parseCSV = (s: string): string[] =>
    (s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)

const parseNumCSV = (s: string): number[] =>
    parseCSV(s)
        .map(Number)
        .filter(Number.isFinite as (n: number) => boolean)

const clamp = (n: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, n))

const fmt = (n: number, dec: number, pre: string, suf: string) =>
    `${pre || ""}${n.toFixed(clamp(dec, 0, 6))}${suf || ""}`

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

const toRgba = (color: string, alpha: number) => {
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
    const rr = r / 255,
        gg = g / 255,
        bb = b / 255
    const max = Math.max(rr, gg, bb),
        min = Math.min(rr, gg, bb),
        d = max - min
    let h = 0,
        s = 0
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
    let rr = 0,
        gg = 0,
        bb = 0
    if (h < 60) {
        rr = c
        gg = x
    } else if (h < 120) {
        rr = x
        gg = c
    } else if (h < 180) {
        gg = c
        bb = x
    } else if (h < 240) {
        gg = x
        bb = c
    } else if (h < 300) {
        rr = x
        bb = c
    } else {
        rr = c
        gg = x
    }
    return [
        clamp(Math.round((rr + m) * 255), 0, 255),
        clamp(Math.round((gg + m) * 255), 0, 255),
        clamp(Math.round((bb + m) * 255), 0, 255),
    ]
}

function rgbToHex(r: number, g: number, b: number) {
    const t = (n: number) =>
        clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0")
    return `#${t(r)}${t(g)}${t(b)}`
}

function buildHuePalette(seedHex: string, count: number): string[] {
    const base = hexToRgbTuple(seedHex) || [107, 195, 78]
    const [h0, s0, l0] = rgbToHsl(base[0], base[1], base[2])
    const n = Math.max(1, Math.floor(count))
    return Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0 : i / (n - 1)
        const h = (h0 + 42 * i) % 360
        const s = clamp(s0 * 0.92 + 0.08, 0.35, 0.92)
        const l = clamp(l0 * (0.88 + 0.18 * Math.sin(t * Math.PI)), 0.28, 0.72)
        const [r, g, b] = hslToRgb(h, s, l)
        return rgbToHex(r, g, b)
    })
}

const padToLen = (arr: number[], len: number, fill = 0) => {
    const out = arr.slice(0, len)
    while (out.length < len) out.push(fill)
    return out
}

function computeRange(values: number[]) {
    const clean = values.filter(Number.isFinite)
    if (!clean.length) return { min: 0, max: 1 }
    const min = Math.min(...clean),
        max = Math.max(...clean)
    if (min === max) {
        const pad = Math.max(1, Math.abs(max) * 0.1)
        return { min: min - pad, max: max + pad }
    }
    const pad = (max - min) * 0.1
    return { min: min - pad, max: max + pad }
}

// ─── Responsive hook ─────────────────────────────────────────────────────────

/**
 * Returns true when the card's own width is ≤ breakpoint (default 520px).
 * This makes the layout responsive to the component size, not the viewport.
 */
function useContainerNarrow(
    ref: React.RefObject<HTMLDivElement>,
    breakpoint = 520
): boolean {
    const [narrow, setNarrow] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([entry]) => {
            setNarrow(entry.contentRect.width <= breakpoint)
        })
        ro.observe(el)
        setNarrow(el.offsetWidth <= breakpoint)
        return () => ro.disconnect()
    }, [breakpoint])
    return narrow
}

/**
 * ChartJS Pro Card — Optimized
 * Dependency: chart.js (npm install chart.js)
 *
 * Changes vs original:
 * — Mobile/tablet: chart and values list stack vertically (column), desktop: row
 * — Per-segment color controls (seg1Color … seg10Color) for arc charts
 * — Reduced re-renders: stable refs, no object spread on every render
 * — ResizeObserver debounce improved, chart destroy guard tightened
 * — Sparkline mode hides side list too
 * — Minor: clamp(animationDuration) was already there; kept
 *
 * @framerIntrinsicWidth 450
 * @framerIntrinsicHeight 350
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

// ─── Component ───────────────────────────────────────────────────────────────

export default function Chart_Visual(props: any) {
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

    // Per-segment colors for arc charts (pie / doughnut / polarArea)
    // Up to 10 segments. If not set, falls back to auto-generated palette.
    const {
        useCustomSegmentColors = false,
        seg1Color,
        seg2Color,
        seg3Color,
        seg4Color,
        seg5Color,
        seg6Color,
        seg7Color,
        seg8Color,
        seg9Color,
        seg10Color,
    } = props.segmentColors || {}

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
        // New: mobile breakpoint for stacking (component width in px)
        stackBreakpoint = 520,
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
        shadowOpacity = 0.4,
        hoverLift = true,
        barRadius = 8,
        lineTension = 0.35,
        pointRadius = 3,
        datasetFill = true,
        fillOpacity = 0.14,
        titleFont,
        descriptionFont,
        valuesListFont,
    } = props.style || {}

    const { animateOnMount = true, animationDuration = 650 } =
        props.animation || {}

    // ── derived flags ──────────────────────────────────────────────────────────
    const type = useMemo(() => safeType(chartType), [chartType])
    const isCartesian = type === "bar" || type === "line"
    const isRadar = type === "radar"
    const isArc = type === "pie" || type === "doughnut" || type === "polarArea"
    const isPolarArea = type === "polarArea"

    // ── refs ───────────────────────────────────────────────────────────────────
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const chartRef = useRef<ChartJS | null>(null)
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const chartAreaRef = useRef<HTMLDivElement | null>(null)
    const resizeRafRef = useRef<number | null>(null)

    // ── responsive stacking ────────────────────────────────────────────────────
    const isNarrow = useContainerNarrow(wrapRef, stackBreakpoint)

    // ── data parsing ───────────────────────────────────────────────────────────
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
        const out = parsedLabels.slice(0, maxLen)
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

    const arcLen = useMemo(
        () =>
            !isArc
                ? safeLen
                : Math.max(1, Math.max(parsedLabels.length, d1.length)),
        [isArc, safeLen, parsedLabels.length, d1.length]
    )

    const arcLabels = useMemo(() => {
        if (!isArc) return normalizedLabels
        const out = parsedLabels.slice(0, arcLen)
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

    // ── per-segment colors ─────────────────────────────────────────────────────
    // Custom colors prop list (up to 10)
    const customSegColors = useMemo(
        () => [
            seg1Color,
            seg2Color,
            seg3Color,
            seg4Color,
            seg5Color,
            seg6Color,
            seg7Color,
            seg8Color,
            seg9Color,
            seg10Color,
        ],
        [
            seg1Color,
            seg2Color,
            seg3Color,
            seg4Color,
            seg5Color,
            seg6Color,
            seg7Color,
            seg8Color,
            seg9Color,
            seg10Color,
        ]
    )

    const autoPalette = useMemo(
        () => buildHuePalette(ds1Color, Math.max(1, arcLabels.length)),
        [ds1Color, arcLabels.length]
    )

    // Resolved hex per segment (either custom or auto)
    const segmentHexList = useMemo(() => {
        return arcLabels.map((_: string, i: number) => {
            if (useCustomSegmentColors && customSegColors[i])
                return customSegColors[i] as string
            return autoPalette[i] || ds1Color
        })
    }, [
        arcLabels,
        useCustomSegmentColors,
        autoPalette,
        ds1Color,
        customSegColors,
    ])

    const segmentBgColors = useMemo(
        () => segmentHexList.map((h: string) => toRgba(h, 0.86)),
        [segmentHexList]
    )
    const segmentHoverColors = useMemo(
        () => segmentHexList.map((h: string) => toRgba(h, 0.98)),
        [segmentHexList]
    )
    const segmentDotColors = useMemo(
        () => segmentHexList.map((h: string) => toRgba(h, 1)),
        [segmentHexList]
    )

    // ── cartesian range ────────────────────────────────────────────────────────
    const cartesianRange = useMemo(() => {
        if (!isCartesian) return { min: 0, max: 1 }
        const vals: number[] = []
        const pushAll = (arr: number[]) =>
            arr
                .slice(0, safeLen)
                .forEach((v) => Number.isFinite(v) && vals.push(v))
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

    const arcValues = useMemo(
        () => (!isArc ? [] : padToLen(d1, arcLen, 0)),
        [isArc, d1, arcLen]
    )

    // ── datasets ───────────────────────────────────────────────────────────────
    const datasets = useMemo(() => {
        if (isArc) {
            const data = arcValues.length ? arcValues : [0]
            const border = toRgba(background, 0.96)
            const ds: any = {
                label: ds1Label || "Series",
                data,
                backgroundColor: segmentBgColors.slice(0, data.length),
                hoverBackgroundColor: segmentHoverColors.slice(0, data.length),
                borderColor: border,
                borderWidth: 2,
                spacing: 2,
                hoverOffset: 10,
                borderRadius: 6,
            }
            if (type === "polarArea") ds.borderAlign = "center"
            return [ds]
        }

        const buildDs = (label: string, data: number[], color: string) => {
            const sliced = data.slice(0, safeLen)
            const isLine = type === "line"
            const isBar = type === "bar"
            const isRdr = type === "radar"
            return {
                label: label || "Series",
                data: sliced,
                backgroundColor:
                    isLine || isRdr ? hexToRgba(color, fillA) : color,
                borderColor: color,
                borderWidth: 2,
                tension: isLine ? lineTension : 0,
                pointRadius: isLine || isRdr ? pointRadius : 0,
                pointHoverRadius: isLine ? Math.max(2, pointRadius + 2) : 0,
                fill: (isLine || isRdr) && datasetFill ? "origin" : false,
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

    // ── chart options ──────────────────────────────────────────────────────────
    const chartOptions = useMemo<any>(() => {
        const gridColor = "rgba(255,255,255,0.08)"
        const tickColor = sparklineMode ? "transparent" : mutedTextColor
        const legendAllowed =
            showLegend && !sparklineMode && !(isArc && showValuesList)

        const goalPlugin = {
            enabled:
                Boolean(goalEnabled) && (type === "bar" || type === "line"),
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
        }

        const base: any = {
            responsive: true,
            maintainAspectRatio: false,
            normalized: true,
            resizeDelay: 80,
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
                            const first = items?.[0]
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
                [GOAL_PLUGIN_ID]: goalPlugin,
            },
        }

        if (isArc) {
            if (type === "doughnut") base.cutout = "62%"
            base.layout = { padding: 6 }
            if (isPolarArea) {
                const vis = showAxes && !sparklineMode
                base.scales = {
                    r: {
                        display: vis,
                        angleLines: {
                            display: showGrid && !sparklineMode,
                            color: gridColor,
                        },
                        grid: {
                            display: showGrid && !sparklineMode,
                            color: gridColor,
                        },
                        pointLabels: {
                            display: vis,
                            color: mutedTextColor,
                            font: { size: 11, weight: 500 },
                            padding: 6,
                        },
                        ticks: {
                            display: vis,
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
            const vis = showAxes && !sparklineMode
            base.scales = {
                r: {
                    display: vis,
                    angleLines: {
                        display: showGrid && !sparklineMode,
                        color: gridColor,
                    },
                    grid: {
                        display: showGrid && !sparklineMode,
                        color: gridColor,
                    },
                    pointLabels: {
                        display: vis,
                        color: mutedTextColor,
                        font: { size: 11, weight: 500 },
                        padding: 10,
                    },
                    ticks: {
                        display: vis,
                        color: tickColor,
                        backdropColor: "rgba(0,0,0,0)",
                        callback: (v: any) => valueFormatter(v),
                    },
                },
            }
            base.layout = { padding: 10 }
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

    // ── chart lifecycle ────────────────────────────────────────────────────────
    const scheduleResize = useCallback(() => {
        if (resizeRafRef.current != null)
            cancelAnimationFrame(resizeRafRef.current)
        resizeRafRef.current = requestAnimationFrame(() => {
            resizeRafRef.current = null
            try {
                chartRef.current?.resize()
                chartRef.current?.update("none")
            } catch {}
        })
    }, [])

    const ensureChart = useCallback(() => {
        if (!canvasRef.current || chartRef.current) return
        chartRef.current = new ChartJS(canvasRef.current, {
            type: type as any,
            data: { labels: isArc ? arcLabels : normalizedLabels, datasets },
            options: chartOptions,
        })
        scheduleResize()
    }, [
        type,
        isArc,
        arcLabels,
        normalizedLabels,
        datasets,
        chartOptions,
        scheduleResize,
    ])

    // Mount / unmount
    useEffect(() => {
        ensureChart()
        return () => {
            if (resizeRafRef.current != null)
                cancelAnimationFrame(resizeRafRef.current)
            try {
                chartRef.current?.destroy()
            } catch {}
            chartRef.current = null
        }
    }, [ensureChart])

    // Data / options updates
    useEffect(() => {
        const chart = chartRef.current
        if (!chart || !canvasRef.current) return
        const nextLabels = isArc ? arcLabels : normalizedLabels
        const prevType = (chart as any)?.config?.type
        if (prevType !== type) {
            try {
                chart.destroy()
            } catch {}
            chartRef.current = new ChartJS(canvasRef.current, {
                type: type as any,
                data: { labels: nextLabels, datasets },
                options: { ...chartOptions, animation: false },
            })
            scheduleResize()
            return
        }
        chart.data.labels = nextLabels
        chart.data.datasets = datasets
        chart.options = chartOptions
        try {
            chart.update("none")
        } catch {
            try {
                chart.update()
            } catch {}
        }
    }, [
        type,
        isArc,
        arcLabels,
        normalizedLabels,
        datasets,
        chartOptions,
        scheduleResize,
    ])

    // ResizeObserver on chart area
    useEffect(() => {
        const el = chartAreaRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(scheduleResize)
        ro.observe(el)
        scheduleResize()
        return () => {
            ro.disconnect()
        }
    }, [scheduleResize])

    // ── styles ─────────────────────────────────────────────────────────────────
    const cardShadow =
        shadow === "strong"
            ? `0 18px 60px rgba(0,0,0,${shadowOpacity})`
            : shadow === "soft"
              ? `0 10px 30px rgba(0,0,0,${shadowOpacity})`
              : "none"

    const headerVisible =
        !sparklineMode && (title?.trim() || description?.trim())
    const showSideList = isArc && !sparklineMode && Boolean(showValuesList)

    // On narrow containers the side list stacks below the chart
    const listDirection: "row" | "column" =
        showSideList && !isNarrow ? "row" : "column"

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
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
                        ? `0 24px 80px rgba(0,0,0,${Math.min(shadowOpacity + 0.15, 1)})`
                        : shadow === "soft"
                          ? `0 14px 40px rgba(0,0,0,${Math.min(shadowOpacity + 0.05, 1)})`
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
                                ...titleFont,
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
                                ...descriptionFont,
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
                    minWidth: 0,
                    display: "flex",
                    // Stack vertically on narrow containers, side-by-side otherwise
                    flexDirection: listDirection,
                    alignItems: "stretch",
                    gap: showSideList ? 14 : 0,
                }}
            >
                {/* Values list — top/left on wide, below on narrow */}
                {showSideList && (
                    <div
                        style={{
                            flex: isNarrow ? "0 0 auto" : "0 1 auto",
                            // On narrow: full width row, on wide: up to 44%
                            width: isNarrow ? "100%" : "44%",
                            maxWidth: isNarrow ? "100%" : 300,
                            display: "flex",
                            // On narrow: two-column grid feel via wrap
                            flexDirection: isNarrow ? "row" : "column",
                            flexWrap: isNarrow ? "wrap" : "nowrap",
                            justifyContent: isNarrow ? "flex-start" : "center",
                            alignItems: isNarrow ? "flex-start" : "stretch",
                            gap: isNarrow ? "6px 16px" : 10,
                            paddingTop: 4,
                            paddingBottom: isNarrow ? 4 : 4,
                            // On narrow render the list below; on wide render before canvas
                            order: isNarrow ? 1 : 0,
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
                                        // On narrow, each item is half width (two columns)
                                        flex: isNarrow
                                            ? "0 0 calc(50% - 8px)"
                                            : "0 0 auto",
                                        minWidth: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
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
                                                ...valuesListFont,
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
                                            ...valuesListFont,
                                        }}
                                    >
                                        {valueFormatter(v)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Canvas wrapper */}
                <div
                    style={{
                        flex: "1 1 auto",
                        position: "relative",
                        minWidth: 0,
                        minHeight: showSideList && isNarrow ? 160 : 60,
                        order: 0,
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            maxWidth: "100%",
                            maxHeight: "100%",
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

// ─── Property Controls ───────────────────────────────────────────────────────

addPropertyControls(Chart_Visual, {
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

    // ── NEW: per-segment colors for arc charts ────────────────────────────────
    segmentColors: {
        title: "Segment Colors",
        type: ControlType.Object,
        description:
            "Individual colors for Pie, Doughnut, and Polar Area segments. Enable to override the auto palette.",
        hidden: (p: any) => {
            const t = p.chartType || "bar"
            return t !== "pie" && t !== "doughnut" && t !== "polarArea"
        },
        controls: {
            useCustomSegmentColors: {
                title: "Custom Colors",
                type: ControlType.Boolean,
                defaultValue: false,
                description:
                    "Override auto palette with custom colors per segment.",
            },
            seg1Color: {
                title: "Segment 1",
                type: ControlType.Color,
                defaultValue: "#6BC34E",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg2Color: {
                title: "Segment 2",
                type: ControlType.Color,
                defaultValue: "#60A5FA",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg3Color: {
                title: "Segment 3",
                type: ControlType.Color,
                defaultValue: "#F59E0B",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg4Color: {
                title: "Segment 4",
                type: ControlType.Color,
                defaultValue: "#EC4899",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg5Color: {
                title: "Segment 5",
                type: ControlType.Color,
                defaultValue: "#A78BFA",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg6Color: {
                title: "Segment 6",
                type: ControlType.Color,
                defaultValue: "#34D399",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg7Color: {
                title: "Segment 7",
                type: ControlType.Color,
                defaultValue: "#FB923C",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg8Color: {
                title: "Segment 8",
                type: ControlType.Color,
                defaultValue: "#38BDF8",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg9Color: {
                title: "Segment 9",
                type: ControlType.Color,
                defaultValue: "#818CF8",
                hidden: (p: any) => !p.useCustomSegmentColors,
            },
            seg10Color: {
                title: "Segment 10",
                type: ControlType.Color,
                defaultValue: "#F472B6",
                hidden: (p: any) => !p.useCustomSegmentColors,
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
                    "For Pie, Doughnut, Polar Area. Shows a list of segment values.",
                hidden: (p: any) => Boolean(p.sparklineMode),
            },
            stackBreakpoint: {
                title: "Stack Breakpoint (px)",
                type: ControlType.Number,
                defaultValue: 520,
                min: 200,
                max: 900,
                step: 10,
                description:
                    "Component width at which chart and list stack vertically (mobile/tablet).",
            },
        },
    },

    formatting: {
        title: "Formatting",
        type: ControlType.Object,
        controls: {
            valuePrefix: {
                title: "Prefix",
                type: ControlType.String,
                defaultValue: "$",
            },
            valueSuffix: {
                title: "Suffix",
                type: ControlType.String,
                defaultValue: "",
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
            titleFont: {
                title: "Title Font",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Semibold",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.15em",
                },
            },
            descriptionFont: {
                title: "Description Font",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "13px",
                    variant: "Regular",
                    lineHeight: "1.35em",
                },
            },
            valuesListFont: {
                title: "Values List Font",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "13px",
                    variant: "Medium",
                    lineHeight: "1.2em",
                },
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
            shadowOpacity: {
                title: "Shadow Opacity",
                type: ControlType.Number,
                defaultValue: 0.4,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => p.shadow === "none",
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
})
