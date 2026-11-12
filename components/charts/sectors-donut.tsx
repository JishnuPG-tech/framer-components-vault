// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

// Framer port of lab/SectorsDonut.tsx — single file, inline styles, no
// Tailwind. An allocation ring: sectors as arc segments around a centered
// symbol, legend rows on the right. Hovering a row (or arc) dims the rest of
// the ring so one weight reads at a time. Sample SPY sector data is inlined.

interface SectorsDonutProps {
    symbol: string
    caption: string
    thickness: number
    theme: "dark" | "light"
    accent: string
    style?: React.CSSProperties
}

const TOKENS = {
    dark: {
        text: "rgba(255, 255, 255, 0.9)",
        textFaint: "rgba(255, 255, 255, 0.35)",
        label: "rgba(255, 255, 255, 0.65)",
        pct: "rgba(255, 255, 255, 0.5)",
        neutral: "rgba(255, 255, 255, 0.22)",
        green: "#4dbe95",
        amber: "#c27c58",
    },
    light: {
        text: "rgba(11, 14, 21, 0.92)",
        textFaint: "rgba(11, 14, 21, 0.4)",
        label: "rgba(11, 14, 21, 0.68)",
        pct: "rgba(11, 14, 21, 0.55)",
        neutral: "rgba(11, 14, 21, 0.22)",
        green: "#2f9e70",
        amber: "#a85f3b",
    },
}

const SANS = "'Sora', 'Inter', sans-serif"
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

type Sector = { label: string; pct: number }

// sample allocation — SPY sector weights
const SECTORS: Sector[] = [
    { label: "Technology", pct: 31.2 },
    { label: "Financials", pct: 13.9 },
    { label: "Health care", pct: 12.4 },
    { label: "Consumer disc.", pct: 10.1 },
    { label: "Industrials", pct: 8.6 },
    { label: "Other", pct: 23.8 },
]

const R = 52
const C = 2 * Math.PI * R

/**
 * Sectors Donut
 *
 * @framerIntrinsicWidth 358
 * @framerIntrinsicHeight 156
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SectorsDonut(props: SectorsDonutProps) {
    const {
        symbol = "SPY",
        caption = "of 503 holdings",
        thickness = 13,
        theme = "dark",
        accent = "#489ffa",
    } = props
    const t = TOKENS[theme] ?? TOKENS.dark
    const reducedMotion = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    // canvas/export render one static frame — freeze the staggered fade-in there
    const reduced = !!reducedMotion || isStatic
    const [hot, setHot] = useState<number | null>(null)

    // blue-family ramp + the two semantic hues + a neutral tail for "Other"
    const series = [accent, "#5C9EE8", "#2E5FA3", t.green, t.amber, t.neutral]

    let acc = 0
    const arcs = SECTORS.map((s, i) => {
        const start = acc
        acc += s.pct
        return { ...s, start, color: series[i % series.length] }
    })

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 28,
                fontFamily: SANS,
            }}
        >
            <div style={{ position: "relative", width: 132, height: 132, flexShrink: 0 }}>
                <svg width={132} height={132} viewBox="0 0 132 132" style={{ display: "block", transform: "rotate(-90deg)" }}>
                    {arcs.map((a, i) => (
                        <motion.circle
                            key={a.label}
                            cx={66}
                            cy={66}
                            r={R}
                            fill="none"
                            stroke={a.color}
                            strokeWidth={thickness}
                            strokeDasharray={`${Math.max(0, (a.pct / 100) * C - 2)} ${C}`}
                            strokeDashoffset={-((a.start / 100) * C)}
                            initial={{ opacity: reduced ? 1 : 0 }}
                            animate={{ opacity: hot === null || hot === i ? 1 : 0.22 }}
                            transition={reduced ? { duration: 0 } : { duration: 0.35, ease: EASE, delay: 0.08 * i }}
                            onMouseEnter={() => setHot(i)}
                            onMouseLeave={() => setHot(null)}
                            style={{ cursor: "default" }}
                        />
                    ))}
                </svg>
                <div
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.025em", color: t.text }}>{symbol}</span>
                    <span style={{ marginTop: 2, fontSize: 9, color: t.textFaint }}>{caption}</span>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
                {arcs.map((a, i) => (
                    <button
                        key={a.label}
                        type="button"
                        onMouseEnter={() => setHot(i)}
                        onMouseLeave={() => setHot(null)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "5px 8px",
                            margin: 0,
                            border: "none",
                            borderRadius: 6,
                            background: "none",
                            font: "inherit",
                            textAlign: "left",
                            cursor: "default",
                            opacity: hot !== null && hot !== i ? 0.35 : 1,
                            transition: "opacity 200ms",
                        }}
                    >
                        <span aria-hidden style={{ width: 8, height: 8, flexShrink: 0, borderRadius: 3, background: a.color }} />
                        <span
                            style={{
                                width: 120,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: 11.5,
                                color: t.label,
                            }}
                        >
                            {a.label}
                        </span>
                        <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", color: t.pct }}>{a.pct.toFixed(1)}%</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

addPropertyControls(SectorsDonut, {
    symbol: { type: ControlType.String, title: "Symbol", defaultValue: "SPY" },
    caption: { type: ControlType.String, title: "Caption", defaultValue: "of 503 holdings" },
    thickness: { type: ControlType.Number, title: "Thickness", defaultValue: 13, min: 6, max: 20, step: 1, displayStepper: true },
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
