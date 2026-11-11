// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

// Framer port of lab/PriceTargetFan.tsx — single file, inline styles, no
// Tailwind. History walks to "now", three dashed projections fan out to the
// High / Mean / Low analyst targets; scrub the history or hover a target and
// a KPI-style card flips in beside the point.

interface PriceTargetFanProps {
    label: string
    current: number
    high: number
    mean: number
    low: number
    highAnalysts: number
    meanAnalysts: number
    lowAnalysts: number
    theme: "dark" | "light"
    accent: string
    style?: React.CSSProperties
}

const TOKENS = {
    dark: {
        surface: "#0a0e16",
        surfaceRaised: "linear-gradient(180deg, #131926 0%, #0e1420 100%)",
        hairline: "rgba(255, 255, 255, 0.08)",
        text: "rgba(255, 255, 255, 0.9)",
        textMuted: "#868f97",
        textFaint: "rgba(255, 255, 255, 0.35)",
        grid: "rgba(255, 255, 255, 0.05)",
        axis: "rgba(255, 255, 255, 0.32)",
        history: "rgba(255, 255, 255, 0.78)",
        nowLine: "rgba(255, 255, 255, 0.12)",
        dot: "#ffffff",
        green: "#4dbe95",
        amber: "#e8b45a",
    },
    light: {
        surface: "#f8fafc",
        surfaceRaised: "linear-gradient(180deg, #ffffff 0%, #f4f7fa 100%)",
        hairline: "rgba(0, 0, 0, 0.09)",
        text: "rgba(11, 14, 21, 0.92)",
        textMuted: "#5a636b",
        textFaint: "rgba(11, 14, 21, 0.4)",
        grid: "rgba(11, 14, 21, 0.06)",
        axis: "rgba(11, 14, 21, 0.38)",
        history: "rgba(11, 14, 21, 0.8)",
        nowLine: "rgba(11, 14, 21, 0.14)",
        dot: "#0b0e15",
        green: "#1f9d6d",
        amber: "#c4922f",
    },
}

const SANS = "'Sora', 'Inter', sans-serif"
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const W = 520
const H = 236
const PAD = { l: 30, r: 104, t: 16, b: 28 }
const CARD_W = 120

// deterministic weekly history (same walk as the lab source)
function history(current: number): number[] {
    let s = 17
    let v = 150
    const out: number[] = []
    for (let i = 0; i < 52; i++) {
        s = (s * 16807) % 2147483647
        v = v + (s / 2147483647 - 0.44) * 4.2
        out.push(v)
    }
    const lo = Math.min(...out)
    const hi = Math.max(...out)
    const scaled = out.map((x) => 158 + ((x - lo) / (hi - lo)) * 26)
    const shift = current - scaled[scaled.length - 1]
    return scaled.map((x) => x + shift)
}

/**
 * Price Target Fan
 *
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 290
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function PriceTargetFan(props: PriceTargetFanProps) {
    const {
        label = "Price target · 12mo",
        current = 178.52,
        high = 232,
        mean = 205,
        low = 168,
        highAnalysts = 9,
        meanAnalysts = 34,
        lowAnalysts = 6,
        theme = "dark",
        accent = "#489ffa",
    } = props
    const t = TOKENS[theme] ?? TOKENS.dark
    const reducedMotion = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    // canvas/export render one static frame — freeze the draw-in at its final state there
    const reduced = reducedMotion || isStatic
    const svgRef = useRef<SVGSVGElement>(null)
    const [scrub, setScrub] = useState<number | null>(null)
    const [hotT, setHotT] = useState<number | null>(null)

    const yMin = Math.min(150, low - 10)
    const yMax = Math.max(250, high + 10)
    const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b)
    const pct = (p: number) => ((p - current) / current) * 100
    const fmt = (p: number) => `$${p.toFixed(2)}`

    const HIST = useMemo(() => history(current), [current])
    const targets = useMemo(
        () => [
            { key: "High", price: high, analysts: highAnalysts, color: t.green },
            { key: "Mean", price: mean, analysts: meanAnalysts, color: accent },
            { key: "Low", price: low, analysts: lowAnalysts, color: t.amber },
        ],
        [high, mean, low, highAnalysts, meanAnalysts, lowAnalysts, t, accent]
    )

    const geo = useMemo(() => {
        const histW = (W - PAD.l - PAD.r) * 0.56
        const hx = (i: number) => PAD.l + (i / (HIST.length - 1)) * histW
        const nowX = hx(HIST.length - 1)
        const nowY = y(current)
        const endX = W - PAD.r
        const line = HIST.map((v, i) => `${i === 0 ? "M" : "L"}${hx(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
        const proj = targets.map((tg) => {
            const ty = y(tg.price)
            const cx = nowX + (endX - nowX) * 0.5
            const cy = nowY + (ty - nowY) * 0.15
            return { ...tg, ty, d: `M${nowX},${nowY} Q${cx},${cy} ${endX},${ty}`, cx, cy }
        })
        const hi = proj[0]
        const lo2 = proj[2]
        const band = `M${nowX},${nowY} Q${hi.cx},${hi.cy} ${endX},${hi.ty} L${endX},${lo2.ty} Q${lo2.cx},${lo2.cy} ${nowX},${nowY} Z`
        return { hx, nowX, nowY, endX, line, proj, band }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [HIST, targets])

    const onMove = (e: React.PointerEvent) => {
        const el = svgRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const px = ((e.clientX - r.left) / r.width) * W
        if (px > geo.nowX + 6) {
            setScrub(null)
            return
        }
        const histW = geo.nowX - PAD.l
        setScrub(Math.max(0, Math.min(HIST.length - 1, Math.round(((px - PAD.l) / histW) * (HIST.length - 1)))))
    }

    const overlay = (() => {
        if (hotT !== null) {
            const p = geo.proj[hotT]
            const up = p.price >= current
            return {
                px: geo.endX,
                py: p.ty,
                value: fmt(p.price),
                context: `${p.key} · ${up ? "+" : ""}${pct(p.price).toFixed(1)}% · ${p.analysts} analysts`,
                color: p.color as string | undefined,
            }
        }
        if (scrub !== null) {
            const ago = HIST.length - 1 - scrub
            return {
                px: geo.hx(scrub),
                py: y(HIST[scrub]),
                value: fmt(HIST[scrub]),
                context: ago === 0 ? "now" : `${ago}w ago`,
                color: undefined as string | undefined,
            }
        }
        return null
    })()

    const meanPct = pct(mean)

    // Responsive by SVG, not by JS. The plot is a viewBox that scales with its own
    // box (`width:100%; height:auto`), so it fits any frame width with no measuring
    // and no transform. The previous ResizeObserver + `transform: scale` scaler could
    // not shrink below the fixed design width, so narrow frames clipped the chart on
    // both edges; measuring also never settled in Framer's static/export render.
    return (
        <div style={{ ...props.style, position: "relative", width: "100%", minWidth: 0, fontFamily: SANS }}>
            <div style={{ marginBottom: 4, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 4px" }}>
                <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: t.textFaint }}>{label}</div>
                    <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: t.text }}>{fmt(mean)}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: meanPct >= 0 ? t.green : t.amber }}>
                            {meanPct >= 0 ? "+" : ""}
                            {meanPct.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, fontVariantNumeric: "tabular-nums", color: t.textMuted }}>Now {fmt(current)}</div>
            </div>

            <div style={{ position: "relative", width: "100%" }}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: "block", width: "100%", height: "auto", cursor: "crosshair" }}
                    onPointerMove={onMove}
                    onPointerLeave={() => setScrub(null)}
                >
                    {[yMax - 10, yMax - 40, yMax - 70, yMin].map((v) => (
                        <g key={v}>
                            <line x1={PAD.l} y1={y(v)} x2={geo.endX} y2={y(v)} stroke={t.grid} strokeDasharray="2 5" />
                            <text x={PAD.l - 7} y={y(v) + 3} textAnchor="end" fontSize={8.5} fill={t.axis} style={{ fontVariantNumeric: "tabular-nums" }}>
                                {Math.round(v)}
                            </text>
                        </g>
                    ))}

                    {[
                        { x: geo.hx(0), t: "Jul '25", a: "start" as const },
                        { x: geo.hx(26), t: "Jan '26", a: "middle" as const },
                        { x: geo.nowX, t: "Now", a: "middle" as const },
                        { x: geo.endX, t: "Jul '27", a: "middle" as const },
                    ].map((d) => (
                        <text key={d.t} x={d.x} y={H - 8} textAnchor={d.a} fontSize={8.5} fill={t.axis}>
                            {d.t}
                        </text>
                    ))}

                    <motion.path
                        d={geo.band}
                        fill={accent}
                        initial={{ opacity: reduced ? 0.06 : 0 }}
                        animate={{ opacity: hotT === null ? 0.06 : 0.015 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: 0.9 }}
                    />

                    <line x1={geo.nowX} y1={PAD.t} x2={geo.nowX} y2={H - PAD.b} stroke={t.nowLine} strokeWidth={1} strokeDasharray="3 3" />

                    <motion.path
                        d={geo.line}
                        fill="none"
                        stroke={t.history}
                        strokeWidth={1.5}
                        initial={{ pathLength: reduced ? 1 : 0 }}
                        animate={{ pathLength: 1 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.9, ease: EASE }}
                    />

                    {geo.proj.map((p, i) => {
                        const on = hotT === i
                        const dim = hotT !== null && !on
                        return (
                            <motion.g
                                key={p.key}
                                initial={{ opacity: reduced ? 1 : 0 }}
                                animate={{ opacity: dim ? 0.26 : 1 }}
                                transition={reduced ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: 0.9 + i * 0.12 }}
                                onMouseEnter={() => setHotT(i)}
                                onMouseLeave={() => setHotT(null)}
                                style={{ cursor: "default" }}
                            >
                                <path d={p.d} fill="none" stroke="transparent" strokeWidth={16} />
                                <path d={p.d} fill="none" stroke={p.color} strokeWidth={on ? 2.2 : 1.4} strokeOpacity={on ? 1 : 0.7} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
                                <circle cx={geo.endX} cy={p.ty} r={on ? 4 : 3.2} fill={t.surface} stroke={p.color} strokeWidth={1.6} />
                                <text x={geo.endX + 10} y={p.ty - 2.5} fontSize={8} fill={t.axis}>
                                    {p.key}
                                </text>
                                <text x={geo.endX + 10} y={p.ty + 8} fontSize={10.5} fontWeight={600} fill={p.color} style={{ fontVariantNumeric: "tabular-nums" }}>
                                    {p.price}
                                </text>
                            </motion.g>
                        )
                    })}

                    <motion.circle cx={geo.nowX} cy={geo.nowY} r={3.2} fill={t.dot} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : { delay: 0.85 }} />

                    {scrub !== null && (
                        <g pointerEvents="none">
                            <line x1={geo.hx(scrub)} y1={PAD.t} x2={geo.hx(scrub)} y2={H - PAD.b} stroke={t.nowLine} strokeWidth={1} />
                            <circle cx={geo.hx(scrub)} cy={y(HIST[scrub])} r={3.2} fill={t.dot} stroke={t.surface} strokeWidth={1.5} />
                        </g>
                    )}
                </svg>

                {overlay && (
                    <div
                        style={{
                            pointerEvents: "none",
                            position: "absolute",
                            zIndex: 10,
                            width: CARD_W,
                            // Anchored in viewBox space as a percentage so the card tracks
                            // the point at any rendered width, then nudged in real pixels
                            // so the card itself stays a readable fixed size.
                            left: `${(overlay.px / W) * 100}%`,
                            top: `${(Math.max(2, Math.min(H - 44, overlay.py - 18)) / H) * 100}%`,
                            transform: overlay.px < W / 2 ? "translateX(14px)" : "translateX(calc(-100% - 14px))",
                            borderRadius: 8,
                            border: `1px solid ${t.hairline}`,
                            padding: "6px 10px",
                            background: t.surfaceRaised,
                        }}
                    >
                        <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: overlay.color ?? t.text }}>{overlay.value}</div>
                        <div style={{ marginTop: 2, fontSize: 10, color: t.textMuted }}>{overlay.context}</div>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(PriceTargetFan, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Price target · 12mo" },
    current: { type: ControlType.Number, title: "Now", defaultValue: 178.52, min: 1, max: 10000, step: 0.01 },
    high: { type: ControlType.Number, title: "High", defaultValue: 232, min: 1, max: 10000, step: 1 },
    mean: { type: ControlType.Number, title: "Mean", defaultValue: 205, min: 1, max: 10000, step: 1 },
    low: { type: ControlType.Number, title: "Low", defaultValue: 168, min: 1, max: 10000, step: 1 },
    highAnalysts: { type: ControlType.Number, title: "High #", defaultValue: 9, min: 0, max: 200, step: 1 },
    meanAnalysts: { type: ControlType.Number, title: "Mean #", defaultValue: 34, min: 0, max: 200, step: 1 },
    lowAnalysts: { type: ControlType.Number, title: "Low #", defaultValue: 6, min: 0, max: 200, step: 1 },
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
