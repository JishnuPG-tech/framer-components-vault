// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

// Framer port of lab/RangeNavigatorPro.tsx — single file, inline styles, no
// Tailwind. Focus + context price history: a detail chart sits over a
// compressed mini-map of the whole series. Drag the brush window to pan, pull
// an edge to zoom, hover the plot for a dashed crosshair whose card reads that
// point's price and date. Axis ticks and end labels derive from the window.

interface RangeNavigatorProps {
    title: string
    windowSize: number
    showAxis: boolean
    showCrosshair: boolean
    theme: "dark" | "light"
    accent: string
    style?: React.CSSProperties
}

const TOKENS = {
    dark: {
        surface: "#0a0e16",
        card: "#080b12",
        cardRaised: "linear-gradient(180deg, #131926 0%, #0e1420 100%)",
        hairline: "rgba(255, 255, 255, 0.08)",
        text: "rgba(255, 255, 255, 0.9)",
        textMuted: "#868f97",
        grid: "rgba(255, 255, 255, 0.04)",
        axis: "rgba(255, 255, 255, 0.28)",
        navLine: "rgba(255, 255, 255, 0.3)",
        crosshair: "rgba(255, 255, 255, 0.22)",
        mask: "rgba(2, 4, 10, 0.62)",
        dotRing: "#0a0e16",
    },
    light: {
        surface: "#f8fafc",
        card: "#ffffff",
        cardRaised: "linear-gradient(180deg, #ffffff 0%, #f4f7fa 100%)",
        hairline: "rgba(0, 0, 0, 0.09)",
        text: "rgba(11, 14, 21, 0.92)",
        textMuted: "#5a636b",
        grid: "rgba(11, 14, 21, 0.05)",
        axis: "rgba(11, 14, 21, 0.34)",
        navLine: "rgba(11, 14, 21, 0.32)",
        crosshair: "rgba(11, 14, 21, 0.24)",
        mask: "rgba(255, 255, 255, 0.66)",
        dotRing: "#ffffff",
    },
}

const SANS = "'Sora', 'Inter', sans-serif"

// deterministic daily walk — same generator as the lab source
const LEN = 240
const SERIES: number[] = (() => {
    let s = 5
    const rnd = () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff
        return s / 0x7fffffff
    }
    const out: number[] = []
    let v = 120
    for (let i = 0; i < LEN; i++) {
        v += (rnd() - 0.48) * 3 + Math.sin(i / 22) * 0.6
        out.push(v)
    }
    return out
})()

// one daily sample per point, anchored to a fixed last day — deterministic, no
// hydration drift, and every date on screen derives from the series index
const DAY_MS = 86400000
const LAST_DAY = Date.UTC(2026, 6, 30)
const dayAt = (i: number) => new Date(LAST_DAY - (LEN - 1 - i) * DAY_MS)
const fmtDay = (i: number, withYear: boolean) =>
    dayAt(i).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: withYear ? "2-digit" : undefined,
        timeZone: "UTC",
    })

// currency formatting, inlined from the lab's formatValue helper
const fmtMoney = (n: number, precision: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    }).format(n)

const W = 560
const MAIN_H = 168
const NAV_H = 46
const PAD = { l: 8, r: 54, t: 12, b: 8 }
const plotW = W - PAD.l - PAD.r
const MIN_W = 12 // min window width in points
const AXIS_TICKS = [0, 0.25, 0.5, 0.75, 1] // fraction from the top of the plot

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * Range Navigator
 *
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 254
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function RangeNavigator(props: RangeNavigatorProps) {
    const {
        title = "Price history · drag to navigate",
        windowSize = 72,
        showAxis = true,
        showCrosshair = true,
        theme = "dark",
        accent = "#489ffa",
    } = props
    const t = TOKENS[theme] ?? TOKENS.dark
    const reducedMotion = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    // canvas/export render one static frame — freeze the re-window fade there
    const reduced = reducedMotion || isStatic

    const initialWidth = clamp(Math.round(windowSize), MIN_W, LEN - 1)
    const [win, setWin] = useState({ start: LEN - 1 - initialWidth, end: LEN - 1 })
    const [hover, setHover] = useState<number | null>(null) // index within the window slice
    const navRef = useRef<SVGSVGElement>(null)
    const mainRef = useRef<SVGSVGElement>(null)
    const drag = useRef<{
        mode: "move" | "left" | "right"
        startIdx: number
        s: number
        e: number
    } | null>(null)

    // re-seat the window whenever the panel changes its size
    useEffect(() => {
        setWin({ start: LEN - 1 - initialWidth, end: LEN - 1 })
    }, [initialWidth])

    const pxToIdx = (clientX: number) => {
        const r = navRef.current?.getBoundingClientRect()
        if (!r) return 0
        return ((clientX - r.left) / r.width) * (LEN - 1)
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        const onMove = (e: PointerEvent) => {
            const d = drag.current
            if (!d) return
            const delta = Math.round(pxToIdx(e.clientX) - d.startIdx)
            if (d.mode === "move") {
                const width = d.e - d.s
                const start = clamp(d.s + delta, 0, LEN - 1 - width)
                setWin({ start, end: start + width })
            } else if (d.mode === "left") {
                setWin({ start: clamp(d.s + delta, 0, d.e - MIN_W), end: d.e })
            } else {
                setWin({ start: d.s, end: clamp(d.e + delta, d.s + MIN_W, LEN - 1) })
            }
        }
        const onUp = () => {
            drag.current = null
        }
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
        }
    }, [])

    const startDrag = (mode: "move" | "left" | "right") => (e: React.PointerEvent) => {
        e.preventDefault()
        drag.current = { mode, startIdx: pxToIdx(e.clientX), s: win.start, e: win.end }
    }

    // detail chart geometry over the selected window
    const detail = useMemo(() => {
        const slice = SERIES.slice(win.start, win.end + 1)
        const lo = Math.min(...slice)
        const hi = Math.max(...slice)
        const pad = (hi - lo) * 0.1 || 1
        const min = lo - pad
        const max = hi + pad
        const n = slice.length
        const x = (i: number) => PAD.l + (i / (n - 1)) * plotW
        const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (MAIN_H - PAD.t - PAD.b)
        const line = slice.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
        const area = `${line} L${x(n - 1).toFixed(1)},${MAIN_H - PAD.b} L${x(0).toFixed(1)},${MAIN_H - PAD.b} Z`
        // tight windows span a couple of dollars — keep the cents so ticks stay distinct
        const axisPrecision = max - min >= 6 ? 0 : 2
        return { line, area, min, max, slice, n, x, y, axisPrecision }
    }, [win])

    // hover crosshair on the detail chart — pointer x → nearest point in the window
    const onMainMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!showCrosshair) return
        const r = mainRef.current?.getBoundingClientRect()
        if (!r) return
        const px = ((e.clientX - r.left) / r.width) * W
        setHover(clamp(Math.round(((px - PAD.l) / plotW) * (detail.n - 1)), 0, detail.n - 1))
    }
    const hv =
        showCrosshair && hover != null && hover < detail.n
            ? { i: hover, v: detail.slice[hover], x: detail.x(hover), y: detail.y(detail.slice[hover]) }
            : null

    // navigator (full series) geometry
    const nav = useMemo(() => {
        const lo = Math.min(...SERIES)
        const hi = Math.max(...SERIES)
        const nx = (i: number) => PAD.l + (i / (LEN - 1)) * plotW
        const ny = (v: number) => 4 + (1 - (v - lo) / (hi - lo)) * (NAV_H - 8)
        const line = SERIES.map((v, i) => `${i === 0 ? "M" : "L"}${nx(i).toFixed(1)},${ny(v).toFixed(1)}`).join(" ")
        return { line, nx }
    }, [])

    const wx0 = nav.nx(win.start)
    const wx1 = nav.nx(win.end)

    // end labels track the window; add the year only when the window straddles one
    const crossesYear = dayAt(win.start).getUTCFullYear() !== dayAt(win.end).getUTCFullYear()

    // scale the fixed 560px layout to whatever width Framer gives the frame
    const rootRef = useRef<HTMLDivElement>(null)
    const [rootW, setRootW] = useState(0)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width
            if (w) setRootW(w)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const scale = rootW > 0 ? rootW / W : 1

    const gradientId = `rn-fill-${theme}`

    return (
        <div ref={rootRef} style={{ ...props.style, position: "relative", fontFamily: SANS }}>
            <div style={{ width: W, zoom: scale }}>
                {title ? (
                    <div style={{ marginBottom: 4, display: "flex", alignItems: "baseline", padding: "0 4px" }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{title}</span>
                    </div>
                ) : null}

                {/* detail chart */}
                <svg
                    ref={mainRef}
                    width={W}
                    height={MAIN_H}
                    viewBox={`0 0 ${W} ${MAIN_H}`}
                    style={{ display: "block", cursor: showCrosshair ? "crosshair" : "default", touchAction: "none" }}
                    onPointerMove={onMainMove}
                    onPointerLeave={() => setHover(null)}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
                            <stop offset="100%" stopColor={accent} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* price axis — dollar ticks derived from the windowed min/max */}
                    {showAxis &&
                        AXIS_TICKS.map((f) => {
                            const ty = PAD.t + f * (MAIN_H - PAD.t - PAD.b)
                            return (
                                <g key={f}>
                                    {f > 0 && f < 1 && (
                                        <line x1={PAD.l} y1={ty} x2={W - PAD.r} y2={ty} stroke={t.grid} strokeDasharray="2 5" />
                                    )}
                                    <text
                                        x={W - PAD.r + 8}
                                        y={ty + (f === 0 ? 4 : f === 1 ? 0 : 3)}
                                        fontSize={8.5}
                                        fill={t.axis}
                                        style={{ fontVariantNumeric: "tabular-nums" }}
                                    >
                                        {fmtMoney(detail.max - f * (detail.max - detail.min), detail.axisPrecision)}
                                    </text>
                                </g>
                            )
                        })}

                    <motion.path
                        key={`${win.start}-${win.end}`}
                        d={detail.area}
                        fill={`url(#${gradientId})`}
                        initial={{ opacity: reduced ? 1 : 0.4 }}
                        animate={{ opacity: 1 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                    />
                    <path d={detail.line} fill="none" stroke={accent} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />

                    {/* hover crosshair + readout */}
                    {hv && (
                        <g pointerEvents="none">
                            <line
                                x1={hv.x}
                                y1={PAD.t}
                                x2={hv.x}
                                y2={MAIN_H - PAD.b}
                                stroke={t.crosshair}
                                strokeDasharray="3 3"
                            />
                            <circle cx={hv.x} cy={hv.y} r={3.5} fill={accent} stroke={t.dotRing} strokeWidth={1.5} />
                            {(() => {
                                const label = `${fmtMoney(hv.v, 2)} · ${fmtDay(win.start + hv.i, crossesYear)}`
                                const bw = label.length * 5.6 + 14
                                const bx = clamp(hv.x - bw / 2, PAD.l, W - PAD.r - bw)
                                return (
                                    <g>
                                        <rect
                                            x={bx}
                                            y={PAD.t - 10}
                                            width={bw}
                                            height={17}
                                            rx={4}
                                            fill={t.card}
                                            stroke={t.hairline}
                                        />
                                        <text
                                            x={bx + bw / 2}
                                            y={PAD.t + 2}
                                            textAnchor="middle"
                                            fontSize={9.5}
                                            fill={t.text}
                                            style={{ fontVariantNumeric: "tabular-nums" }}
                                        >
                                            {label}
                                        </text>
                                    </g>
                                )
                            })()}
                        </g>
                    )}
                </svg>

                {/* navigator mini-map */}
                <svg
                    ref={navRef}
                    width={W}
                    height={NAV_H}
                    viewBox={`0 0 ${W} ${NAV_H}`}
                    style={{ marginTop: 4, display: "block", touchAction: "none", userSelect: "none" }}
                >
                    <path d={nav.line} fill="none" stroke={t.navLine} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    {/* dim masks outside the window */}
                    <rect x={PAD.l} y={0} width={Math.max(0, wx0 - PAD.l)} height={NAV_H} fill={t.mask} />
                    <rect x={wx1} y={0} width={Math.max(0, W - PAD.r - wx1)} height={NAV_H} fill={t.mask} />
                    {/* window */}
                    <rect
                        x={wx0}
                        y={1}
                        width={wx1 - wx0}
                        height={NAV_H - 2}
                        rx={3}
                        fill={accent}
                        fillOpacity={0.08}
                        stroke={accent}
                        strokeOpacity={0.55}
                        onPointerDown={startDrag("move")}
                        style={{ cursor: "grab" }}
                    />
                    {/* edge handles */}
                    {[
                        { x: wx0, mode: "left" as const },
                        { x: wx1, mode: "right" as const },
                    ].map(({ x, mode }) => (
                        <g key={mode} onPointerDown={startDrag(mode)} style={{ cursor: "ew-resize" }}>
                            <rect x={x - 5} y={0} width={10} height={NAV_H} fill="transparent" />
                            <rect x={x - 1.5} y={NAV_H / 2 - 8} width={3} height={16} rx={1.5} fill={accent} />
                        </g>
                    ))}
                </svg>

                {/* end labels — first and last day of the current window */}
                <div
                    style={{
                        marginTop: 4,
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0 4px",
                        fontSize: 9,
                        fontVariantNumeric: "tabular-nums",
                        color: t.textMuted,
                    }}
                >
                    <span>{fmtDay(win.start, crossesYear)}</span>
                    <span>{fmtDay(win.end, crossesYear)}</span>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(RangeNavigator, {
    title: { type: ControlType.String, title: "Title", defaultValue: "Price history · drag to navigate" },
    windowSize: { type: ControlType.Number, title: "Window", defaultValue: 72, min: 12, max: 239, step: 1 },
    showAxis: {
        type: ControlType.Boolean,
        title: "Price axis",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showCrosshair: {
        type: ControlType.Boolean,
        title: "Crosshair",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#489ffa" },
})
