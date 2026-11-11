import { useEffect, useMemo, useRef, useState } from "react"
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
 * Colorful Interactive Donut
 *
 * An animated, interactive donut / pie chart with an optional legend.
 * - Values, labels and colors are simple comma-separated lists.
 * - Draws itself when scrolled into view.
 * - Hover (or tap on mobile) a slice to grow it and show its share in the center.
 * - On the Framer canvas and in static exports it renders fully drawn, with no animation.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 220
 */

type Props = {
    values: string
    labels: string
    colors: string
    centerTitle: string
    centerSubtitle: string
    chartSize: number
    thickness: number
    gap: number
    roundCaps: boolean
    trackColor: string
    textColor: string
    mutedColor: string
    fontFamily: string
    titleSize: number
    subtitleSize: number
    decimals: number
    interactive: boolean
    hoverGrow: number
    glow: boolean
    animate: boolean
    duration: number
    legend: string
    legendValue: string
    valuePrefix: string
    valueSuffix: string
    legendSize: number
    legendGap: number
    style?: React.CSSProperties
}

const DEFAULT_COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EC4899", "#06B6D4", "#A855F7", "#EF4444", "#84CC16"]

function list(input: string): string[] {
    return (input || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
}

function toNumber(s: string): number {
    const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""))
    return Number.isFinite(n) && n > 0 ? n : 0
}

function num(v: any, fallback: number): number {
    const n = typeof v === "number" ? v : parseFloat(v)
    return Number.isFinite(n) ? n : fallback
}

function formatValue(n: number): string {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

export default function ColorfulInteractiveDonut(props: Props) {
    const {
        values,
        labels,
        colors,
        centerTitle,
        centerSubtitle,
        chartSize,
        thickness,
        gap,
        roundCaps,
        trackColor,
        textColor,
        mutedColor,
        fontFamily,
        titleSize,
        subtitleSize,
        decimals,
        interactive,
        hoverGrow,
        glow,
        animate,
        duration,
        legend,
        legendValue,
        valuePrefix,
        valueSuffix,
        legendSize,
        legendGap,
        style,
    } = props

    // Canvas, thumbnails and exports: render a finished, static chart.
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = animate && !isStatic
    const canInteract = interactive && !isStatic

    const ref = useRef<HTMLDivElement>(null)
    const [progress, setProgress] = useState(shouldAnimate ? 0 : 1)
    const [active, setActive] = useState<number | null>(null)

    const size = Math.max(40, num(chartSize, 180))
    const stroke = Math.max(2, Math.min(size / 2 - 2, num(thickness, 26)))
    const grow = Math.max(0, num(hoverGrow, 6))
    const radius = (size - stroke - grow * 2) / 2
    const circumference = 2 * Math.PI * radius
    const dec = Math.max(0, Math.min(3, Math.round(num(decimals, 1))))

    const slices = useMemo(() => {
        const vals = list(values).map(toNumber)
        const labs = list(labels)
        const cols = list(colors)
        const total = vals.reduce((a, b) => a + b, 0)
        return {
            total,
            items: vals.map((v, i) => ({
                value: v,
                label: labs[i] || `Item ${i + 1}`,
                color: cols[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                share: total > 0 ? v / total : 0,
            })),
        }
    }, [values, labels, colors])

    // Draw-in animation when the chart enters the viewport (live site / preview only).
    useEffect(() => {
        if (!shouldAnimate) {
            setProgress(1)
            return
        }
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setProgress(1)
            return
        }
        let raf = 0
        let started = false
        const ms = Math.max(100, num(duration, 1.2) * 1000)
        const io = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting || started) return
                started = true
                const t0 = performance.now()
                const tick = (now: number) => {
                    const t = Math.min(1, (now - t0) / ms)
                    setProgress(easeOutCubic(t))
                    if (t < 1) raf = requestAnimationFrame(tick)
                }
                raf = requestAnimationFrame(tick)
                io.disconnect()
            },
            { threshold: 0.3 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            cancelAnimationFrame(raf)
        }
    }, [shouldAnimate, duration])

    const gapLen = slices.items.length > 1 ? (Math.max(0, num(gap, 2)) / 360) * circumference : 0
    const capAdjust = roundCaps ? stroke : 0

    let offset = 0
    const arcs = slices.items.map((s, i) => {
        const full = s.share * circumference
        const visible = Math.max(0, full * progress - gapLen - capAdjust)
        const arc = {
            ...s,
            index: i,
            dash: visible,
            start: offset * progress + gapLen / 2 + capAdjust / 2,
        }
        offset += full
        return arc
    })

    const activeIndex = canInteract ? active : null
    const activeItem = activeIndex !== null ? slices.items[activeIndex] : null
    const title = activeItem
        ? `${(activeItem.share * 100).toFixed(dec)}%`
        : centerTitle || `${valuePrefix}${formatValue(slices.total)}${valueSuffix}`
    const subtitle = activeItem ? activeItem.label : centerSubtitle

    const fam = fontFamily || "Inter, system-ui, sans-serif"
    const transition = isStatic ? "none" : "stroke-width 0.2s ease, opacity 0.2s ease"
    const { width: _w, height: _h, ...restStyle } = (style || {}) as any

    const chart = (
        <div
            style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
            onPointerLeave={() => canInteract && setActive(null)}
        >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", overflow: "visible" }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={stroke}
                />
                <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                    {arcs.map((a) => {
                        const isActive = activeIndex === a.index
                        const dimmed = activeIndex !== null && !isActive
                        return (
                            <circle
                                key={a.index}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={a.color}
                                strokeWidth={isActive ? stroke + grow * 2 : stroke}
                                strokeLinecap={roundCaps ? "round" : "butt"}
                                strokeDasharray={`${a.dash} ${circumference}`}
                                strokeDashoffset={-a.start}
                                opacity={a.dash <= 0 ? 0 : dimmed ? 0.35 : 1}
                                style={{
                                    cursor: canInteract ? "pointer" : "default",
                                    transition,
                                    filter: glow ? `drop-shadow(0 0 ${Math.round(stroke * 0.35)}px ${a.color})` : undefined,
                                }}
                                onPointerEnter={() => canInteract && setActive(a.index)}
                                onClick={() => canInteract && setActive(active === a.index ? null : a.index)}
                            />
                        )
                    })}
                </g>
            </svg>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    textAlign: "center",
                    padding: stroke + grow,
                    fontFamily: fam,
                }}
            >
                <div style={{ color: textColor, fontSize: num(titleSize, 30), fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
                {subtitle ? (
                    <div
                        style={{
                            color: mutedColor,
                            fontSize: num(subtitleSize, 12),
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            marginTop: 4,
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {subtitle}
                    </div>
                ) : null}
            </div>
        </div>
    )

    const legendEl =
        legend === "none" ? null : (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: Math.round(num(legendSize, 14) * 0.85),
                    fontFamily: fam,
                    minWidth: 0,
                }}
            >
                {slices.items.map((s, i) => {
                    const pct = `${(s.share * 100).toFixed(dec)}%`
                    const val = `${valuePrefix}${formatValue(s.value)}${valueSuffix}`
                    const detail =
                        legendValue === "percent" ? pct : legendValue === "value" ? val : legendValue === "both" ? `${val} · ${pct}` : ""
                    const dimmed = activeIndex !== null && activeIndex !== i
                    return (
                        <div
                            key={i}
                            onPointerEnter={() => canInteract && setActive(i)}
                            onPointerLeave={() => canInteract && setActive(null)}
                            onClick={() => canInteract && setActive(active === i ? null : i)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                cursor: canInteract ? "pointer" : "default",
                                opacity: dimmed ? 0.45 : 1,
                                transition: isStatic ? "none" : "opacity 0.2s ease",
                            }}
                        >
                            <span
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 999,
                                    background: s.color,
                                    flexShrink: 0,
                                    boxShadow: glow ? `0 0 8px ${s.color}` : undefined,
                                }}
                            />
                            <span style={{ color: textColor, fontSize: num(legendSize, 14), fontWeight: 600, whiteSpace: "nowrap" }}>
                                {s.label}
                            </span>
                            {detail ? (
                                <span style={{ color: mutedColor, fontSize: num(legendSize, 14), whiteSpace: "nowrap" }}>{detail}</span>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        )

    return (
        <div
            ref={ref}
            style={{
                ...restStyle,
                display: "flex",
                flexDirection: legend === "bottom" ? "column" : "row",
                alignItems: "center",
                gap: num(legendGap, 28),
                userSelect: "none",
            }}
        >
            {chart}
            {legendEl}
        </div>
    )
}

ColorfulInteractiveDonut.defaultProps = {
    values: "45, 25, 20, 10",
    labels: "Product, Services, Licensing, Other",
    colors: "#6366F1, #22C55E, #F59E0B, #EC4899",
    centerTitle: "",
    centerSubtitle: "Total",
    chartSize: 180,
    thickness: 26,
    gap: 2,
    roundCaps: false,
    trackColor: "rgba(127, 127, 127, 0.12)",
    textColor: "#111111",
    mutedColor: "#777777",
    fontFamily: "Inter, system-ui, sans-serif",
    titleSize: 30,
    subtitleSize: 12,
    decimals: 1,
    interactive: true,
    hoverGrow: 6,
    glow: false,
    animate: true,
    duration: 1.2,
    legend: "right",
    legendValue: "percent",
    valuePrefix: "",
    valueSuffix: "",
    legendSize: 14,
    legendGap: 28,
}

addPropertyControls(ColorfulInteractiveDonut, {
    values: {
        type: ControlType.String,
        title: "Values",
        defaultValue: "45, 25, 20, 10",
        description: "Comma-separated numbers. Shares are calculated automatically.",
    },
    labels: {
        type: ControlType.String,
        title: "Labels",
        defaultValue: "Product, Services, Licensing, Other",
        description: "Comma-separated, same order as values.",
    },
    colors: {
        type: ControlType.String,
        title: "Colors",
        defaultValue: "#6366F1, #22C55E, #F59E0B, #EC4899",
        description: "Comma-separated hex or rgb colors. Missing colors use a built-in palette.",
    },
    centerTitle: {
        type: ControlType.String,
        title: "Center title",
        defaultValue: "",
        placeholder: "Auto (total)",
        description: "Leave empty to show the total of all values.",
    },
    centerSubtitle: { type: ControlType.String, title: "Center subtitle", defaultValue: "Total" },
    chartSize: { type: ControlType.Number, title: "Chart size", min: 60, max: 600, step: 1, unit: "px", defaultValue: 180 },
    thickness: { type: ControlType.Number, title: "Thickness", min: 2, max: 150, step: 1, unit: "px", defaultValue: 26 },
    gap: { type: ControlType.Number, title: "Slice gap", min: 0, max: 20, step: 0.5, unit: "°", defaultValue: 2 },
    roundCaps: { type: ControlType.Boolean, title: "Round ends", defaultValue: false },
    trackColor: { type: ControlType.Color, title: "Track", defaultValue: "rgba(127, 127, 127, 0.12)" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111111" },
    mutedColor: { type: ControlType.Color, title: "Muted text", defaultValue: "#777777" },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Inter, system-ui, sans-serif",
        description: "Any CSS font-family, e.g. a font already used on your site.",
    },
    titleSize: { type: ControlType.Number, title: "Title size", min: 8, max: 120, step: 1, unit: "px", defaultValue: 30 },
    subtitleSize: { type: ControlType.Number, title: "Subtitle size", min: 6, max: 48, step: 1, unit: "px", defaultValue: 12 },
    decimals: { type: ControlType.Number, title: "Decimals", min: 0, max: 3, step: 1, defaultValue: 1, displayStepper: true },
    interactive: { type: ControlType.Boolean, title: "Interactive", defaultValue: true },
    hoverGrow: {
        type: ControlType.Number,
        title: "Hover grow",
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        defaultValue: 6,
        hidden: (p: any) => !p.interactive,
    },
    glow: { type: ControlType.Boolean, title: "Glow", defaultValue: false },
    animate: { type: ControlType.Boolean, title: "Animate in", defaultValue: true },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 5,
        step: 0.1,
        unit: "s",
        defaultValue: 1.2,
        hidden: (p: any) => !p.animate,
    },
    legend: {
        type: ControlType.Enum,
        title: "Legend",
        options: ["none", "right", "bottom"],
        optionTitles: ["None", "Right", "Bottom"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    legendValue: {
        type: ControlType.Enum,
        title: "Legend shows",
        options: ["percent", "value", "both", "none"],
        optionTitles: ["Percent", "Value", "Both", "Label only"],
        defaultValue: "percent",
        hidden: (p: any) => p.legend === "none",
    },
    valuePrefix: { type: ControlType.String, title: "Prefix", defaultValue: "", placeholder: "e.g. $" },
    valueSuffix: { type: ControlType.String, title: "Suffix", defaultValue: "", placeholder: "e.g.  users" },
    legendSize: {
        type: ControlType.Number,
        title: "Legend size",
        min: 8,
        max: 32,
        step: 1,
        unit: "px",
        defaultValue: 14,
        hidden: (p: any) => p.legend === "none",
    },
    legendGap: {
        type: ControlType.Number,
        title: "Legend gap",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 28,
        hidden: (p: any) => p.legend === "none",
    },
})
