// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useId, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

// Framer port of lab/MarketSnapshotCard.tsx — single file, inline styles, no
// Tailwind. A price snapshot card: animated line chart with hover scrubbing
// (crosshair + date tooltip), period tabs with a sliding underline, and a
// ticking price readout. Sample price history is inlined.

interface MarketSnapshotCardProps {
    symbol: string
    company: string
    updated: string
    exchange: string
    theme: "dark" | "light"
    accent: string
    style?: React.CSSProperties
}

const TOKENS = {
    dark: {
        surface: "#0a0e16",
        text: "#ffffff",
        textMuted: "#868f97",
        hairline: "rgba(255, 255, 255, 0.05)",
        hover: "rgba(255, 255, 255, 0.055)",
        crosshair: "rgba(255, 255, 255, 0.16)",
        down: "#e06a6a",
        shadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
    },
    light: {
        surface: "#f8fafc",
        text: "#0b0e15",
        textMuted: "#5a636b",
        hairline: "rgba(0, 0, 0, 0.08)",
        hover: "rgba(11, 14, 21, 0.055)",
        crosshair: "rgba(11, 14, 21, 0.16)",
        down: "#d0433f",
        shadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
    },
}

const SANS = "'Sora', 'Inter', sans-serif"
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const PERIODS = ["1D", "1W", "1M", "3M", "YTD", "1Y", "All"]
const VALUES = [178.52, 176.84, 180.15, 181.42, 179.96, 184.22, 187.61, 190.04, 188.72, 194.85, 202.14, 198.93, 211.75, 224.68, 219.42, 236.18, 248.06, 243.44, 268.31, 284.12, 276.88, 301.45]
const W = 320
const H = 150
const CARD_W = 340

// days each period window spans — drives the date under the cursor
const WINDOW_DAYS: Record<string, number> = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, YTD: 210, "1Y": 365, All: 660 }

/**
 * Market Snapshot
 *
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 296
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MarketSnapshotCard(props: MarketSnapshotCardProps) {
    const {
        symbol = "AMZN",
        company = "Amazon.com Inc.",
        updated = "Updated 1:54 PM",
        exchange = "NASDAQ · USD",
        theme = "dark",
        accent = "#4dbe95",
    } = props
    const t = TOKENS[theme] ?? TOKENS.dark
    const reducedMotion = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    // canvas/export render one static frame — the chart must draw fully there
    const reduced = !!reducedMotion || isStatic
    const tabId = useId()
    const svgRef = useRef<SVGSVGElement>(null)
    const [period, setPeriod] = useState("All")
    const [hover, setHover] = useState<number | null>(null)

    const factor = Math.max(7, Math.round(VALUES.length * ((PERIODS.indexOf(period) + 1) / PERIODS.length)))
    const data = useMemo(() => VALUES.slice(-factor), [factor])
    const min = Math.min(...data) * 0.97
    const max = Math.max(...data) * 1.02
    const x = (i: number) => 8 + (i / (data.length - 1)) * (W - 16)
    const y = (v: number) => 8 + (1 - (v - min) / (max - min || 1)) * (H - 18)
    const path = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
    const active = hover == null ? data.length - 1 : hover
    const price = data[active]
    const delta = price - data[0]
    const pct = (delta / data[0]) * 100
    const up = delta >= 0
    const deltaColor = up ? accent : t.down

    const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
        const bounds = svgRef.current?.getBoundingClientRect()
        if (!bounds) return
        setHover(Math.max(0, Math.min(data.length - 1, Math.round(((event.clientX - bounds.left) / bounds.width) * (data.length - 1)))))
    }

    // date under the cursor — fixed "now" anchor so every render reads the same
    const hoverStamp = (i: number) => {
        const end = new Date(2026, 6, 29, 16, 0)
        const backDays = ((data.length - 1 - i) / (data.length - 1)) * (WINDOW_DAYS[period] ?? 660)
        const d = new Date(end.getTime() - backDays * 86400000)
        return period === "1D"
            ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: period === "All" || period === "1Y" ? "2-digit" : undefined })
    }

    return (
        <div
            style={{
                position: "relative",
                minWidth: CARD_W,
                overflow: "hidden",
                borderRadius: 8,
                border: `1px solid ${t.hairline}`,
                background: t.surface,
                fontFamily: SANS,
                ...props.style,
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 20px 8px" }}>
                <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: t.textMuted }}>{company}</p>
                    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 8, rowGap: 4, fontVariantNumeric: "tabular-nums" }}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                                key={price.toFixed(2)}
                                style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.035em", color: t.text }}
                                initial={reduced ? false : { opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: reduced ? 0 : 0.18 }}
                            >
                                ${price.toFixed(2)}
                            </motion.span>
                        </AnimatePresence>
                        <span style={{ fontSize: 11, fontWeight: 600, color: deltaColor }}>
                            {up ? "+" : ""}
                            {delta.toFixed(2)} ({pct >= 0 ? "+" : ""}
                            {pct.toFixed(2)}%)
                        </span>
                    </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{symbol}</span>
            </div>

            <div style={{ position: "relative", padding: "0 12px" }}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    style={{ display: "block", width: "100%", touchAction: "none" }}
                    onPointerMove={onMove}
                    onPointerLeave={() => setHover(null)}
                    role="img"
                    aria-label={`${company} price ${price.toFixed(2)} dollars over ${period}`}
                >
                    {[0.33, 0.66].map((p) => (
                        <line key={p} x1="8" x2={W - 8} y1={8 + p * (H - 18)} y2={8 + p * (H - 18)} stroke={t.hairline} strokeDasharray="2 5" />
                    ))}
                    <motion.path
                        key={`${period}-${reduced}`}
                        d={path}
                        fill="none"
                        stroke={accent}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.65, ease: EASE }}
                    />
                    {hover != null && (
                        <>
                            <line x1={x(active)} x2={x(active)} y1="8" y2={H - 10} stroke={t.crosshair} />
                            <circle cx={x(active)} cy={y(price)} r="3" fill={accent} stroke={t.surface} strokeWidth="1.5" />
                        </>
                    )}
                </svg>
                {hover != null && (
                    <div
                        role="status"
                        style={{
                            pointerEvents: "none",
                            position: "absolute",
                            top: 0,
                            zIndex: 10,
                            left: `${((x(active) / W) * 100).toFixed(1)}%`,
                            transform: "translateX(-50%)",
                            whiteSpace: "nowrap",
                            borderRadius: 6,
                            border: `1px solid ${t.hairline}`,
                            padding: "2px 6px",
                            fontSize: 9,
                            fontVariantNumeric: "tabular-nums",
                            background: t.surface,
                            color: t.textMuted,
                            boxShadow: t.shadow,
                        }}
                    >
                        {hoverStamp(active)}
                    </div>
                )}
            </div>

            <div style={{ borderTop: `1px solid ${t.hairline}`, padding: "12px 16px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                    {PERIODS.map((item) => {
                        const activePeriod = item === period
                        return (
                            <button
                                key={item}
                                type="button"
                                onClick={() => {
                                    setPeriod(item)
                                    setHover(null)
                                }}
                                style={{
                                    position: "relative",
                                    margin: 0,
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "6px 8px",
                                    font: "inherit",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    color: activePeriod ? t.text : t.textMuted,
                                    background: activePeriod ? t.hover : "transparent",
                                    transition: "color 0.15s ease",
                                }}
                            >
                                {item}
                                {activePeriod &&
                                    (reduced ? (
                                        <span aria-hidden style={{ position: "absolute", left: 6, right: 6, bottom: -5, height: 3, borderRadius: "3px 3px 0 0", background: accent }} />
                                    ) : (
                                        <motion.span
                                            aria-hidden
                                            layoutId={`msnap-period-${tabId}`}
                                            style={{ position: "absolute", left: 6, right: 6, bottom: -5, height: 3, borderRadius: "3px 3px 0 0", background: accent }}
                                            transition={{ type: "spring", stiffness: 400, damping: 34 }}
                                        />
                                    ))}
                            </button>
                        )
                    })}
                </div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, fontVariantNumeric: "tabular-nums", color: t.textMuted }}>
                    <span>{updated}</span>
                    <span>{exchange}</span>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(MarketSnapshotCard, {
    symbol: { type: ControlType.String, title: "Symbol", defaultValue: "AMZN" },
    company: { type: ControlType.String, title: "Company", defaultValue: "Amazon.com Inc." },
    updated: { type: ControlType.String, title: "Updated", defaultValue: "Updated 1:54 PM" },
    exchange: { type: ControlType.String, title: "Exchange", defaultValue: "NASDAQ · USD" },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#4dbe95" },
})
