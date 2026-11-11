import { useEffect, useRef, useState } from "react"
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
 * Savings Calculator — an interactive ROI calculator.
 * Visitors move three sliders (team size, hours per week, hourly cost)
 * and see the time and money your product saves them, animated live.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

interface Props {
    title: string
    subtitle: string
    teamLabel: string
    hoursLabel: string
    rateLabel: string
    teamMin: number
    teamMax: number
    teamDefault: number
    hoursMax: number
    hoursDefault: number
    rateMax: number
    rateDefault: number
    automation: number
    currency: string
    ctaText: string
    ctaLink: string
    showCta: boolean
    background: string
    surface: string
    text: string
    muted: string
    accent: string
    accentText: string
    border: string
    radius: number
    font: any
    numberFont: any
    style?: React.CSSProperties
}

function useCountUp(target: number, duration = 500) {
    const [value, setValue] = useState(target)
    const from = useRef(target)
    useEffect(() => {
        const start = performance.now()
        const begin = from.current
        let raf = 0
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - t, 3)
            const v = begin + (target - begin) * eased
            setValue(v)
            from.current = v
            if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target, duration])
    return value
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US")

export default function SavingsCalculator(props: Props) {
    const {
        title,
        subtitle,
        teamLabel,
        hoursLabel,
        rateLabel,
        teamMin,
        teamMax,
        teamDefault,
        hoursMax,
        hoursDefault,
        rateMax,
        rateDefault,
        automation,
        currency,
        ctaText,
        ctaLink,
        showCta,
        background,
        surface,
        text,
        muted,
        accent,
        accentText,
        border,
        radius,
        font,
        numberFont,
        style,
    } = props

    const [team, setTeam] = useState(teamDefault)
    const [hours, setHours] = useState(hoursDefault)
    const [rate, setRate] = useState(rateDefault)
    useEffect(() => setTeam(teamDefault), [teamDefault])
    useEffect(() => setHours(hoursDefault), [hoursDefault])
    useEffect(() => setRate(rateDefault), [rateDefault])

    const share = Math.max(0, Math.min(100, automation)) / 100
    const hoursSavedMonth = team * hours * share * 4.33
    const moneyMonth = hoursSavedMonth * rate
    const moneyYear = moneyMonth * 12

    const aMonth = useCountUp(moneyMonth)
    const aYear = useCountUp(moneyYear)
    const aHours = useCountUp(hoursSavedMonth)

    const id = useRef("sc" + Math.random().toString(36).slice(2, 8)).current

    const slider = (
        label: string,
        value: number,
        min: number,
        max: number,
        step: number,
        onChange: (v: number) => void,
        display: string
    ) => {
        const pct = ((value - min) / Math.max(1, max - min)) * 100
        return (
            <label style={{ display: "grid", gap: 12 }}>
                <span
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        fontSize: 15,
                        color: muted,
                    }}
                >
                    <span>{label}</span>
                    <span
                        style={{
                            color: text,
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {display}
                    </span>
                </span>
                <input
                    className={id + "-range"}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    aria-label={label}
                    style={{
                        width: "100%",
                        margin: 0,
                        height: 6,
                        borderRadius: 3,
                        appearance: "none",
                        WebkitAppearance: "none",
                        cursor: "pointer",
                        outline: "none",
                        background: `linear-gradient(to right, ${accent} ${pct}%, ${border} ${pct}%)`,
                    }}
                />
            </label>
        )
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                boxSizing: "border-box",
                background: border,
                gap: 1,
                color: text,
                borderRadius: radius,
                border: `1px solid ${border}`,
                overflow: "hidden",
                display: "flex",
                flexWrap: "wrap",
                fontFamily: "Inter, sans-serif",
                ...font,
            }}
        >
            <style>{`
                .${id}-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${background};border:2px solid ${accent};box-shadow:0 2px 8px rgba(0,0,0,.15);transition:transform .15s}
                .${id}-range::-webkit-slider-thumb:hover{transform:scale(1.12)}
                .${id}-range::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${background};border:2px solid ${accent}}
                .${id}-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 5px ${accent}33}
            `}</style>

            <div
                style={{
                    flex: "1 1 320px",
                    padding: 32,
                    display: "grid",
                    gap: 28,
                    alignContent: "start",
                    background,
                }}
            >
                <div style={{ display: "grid", gap: 8 }}>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 600,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{ fontSize: 15, color: muted, lineHeight: 1.5 }}
                    >
                        {subtitle}
                    </div>
                </div>
                {slider(
                    teamLabel,
                    team,
                    teamMin,
                    teamMax,
                    1,
                    setTeam,
                    fmt(team)
                )}
                {slider(
                    hoursLabel,
                    hours,
                    1,
                    hoursMax,
                    1,
                    setHours,
                    hours + " h"
                )}
                {slider(
                    rateLabel,
                    rate,
                    10,
                    rateMax,
                    5,
                    setRate,
                    currency + fmt(rate)
                )}
            </div>

            <div
                style={{
                    flex: "1 1 280px",
                    padding: 32,
                    background: surface,
                    display: "flex",
                    flexDirection: "column",
                    gap: 24,
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 14, color: muted }}>
                        You save every month
                    </div>
                    <div
                        style={{
                            fontSize: 52,
                            fontWeight: 600,
                            letterSpacing: "-0.03em",
                            lineHeight: 1,
                            color: accent,
                            fontVariantNumeric: "tabular-nums",
                            ...numberFont,
                        }}
                    >
                        {currency}
                        {fmt(aMonth)}
                    </div>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1,
                        background: border,
                        borderRadius: 12,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            background,
                            padding: 16,
                            display: "grid",
                            gap: 4,
                        }}
                    >
                        <span style={{ fontSize: 13, color: muted }}>
                            Per year
                        </span>
                        <span
                            style={{
                                fontSize: 22,
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                                ...numberFont,
                            }}
                        >
                            {currency}
                            {fmt(aYear)}
                        </span>
                    </div>
                    <div
                        style={{
                            background,
                            padding: 16,
                            display: "grid",
                            gap: 4,
                        }}
                    >
                        <span style={{ fontSize: 13, color: muted }}>
                            Hours saved / month
                        </span>
                        <span
                            style={{
                                fontSize: 22,
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                                ...numberFont,
                            }}
                        >
                            {fmt(aHours)} h
                        </span>
                    </div>
                </div>
                <div style={{ fontSize: 13, color: muted, lineHeight: 1.5 }}>
                    Based on automating {Math.round(share * 100)}% of this work.
                </div>
                {showCta && (
                    <a
                        href={ctaLink || "#"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 48,
                            borderRadius: Math.min(radius, 12),
                            background: accent,
                            color: accentText,
                            fontWeight: 600,
                            fontSize: 15,
                            textDecoration: "none",
                        }}
                    >
                        {ctaText}
                    </a>
                )}
            </div>
        </div>
    )
}

SavingsCalculator.defaultProps = {
    title: "See what you'll save",
    subtitle:
        "Move the sliders to estimate the time and money your team gets back.",
    teamLabel: "Team size",
    hoursLabel: "Hours per person, per week",
    rateLabel: "Average hourly cost",
    teamMin: 1,
    teamMax: 200,
    teamDefault: 12,
    hoursMax: 40,
    hoursDefault: 8,
    rateMax: 200,
    rateDefault: 45,
    automation: 60,
    currency: "$",
    ctaText: "Start saving today",
    ctaLink: "",
    showCta: true,
    background: "#FFFFFF",
    surface: "#F6F7F5",
    text: "#131614",
    muted: "#6A706B",
    accent: "#2443E6",
    accentText: "#FFFFFF",
    border: "#E3E5E1",
    radius: 20,
}

addPropertyControls(SavingsCalculator, {
    title: { type: ControlType.String, title: "Title" },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        displayTextArea: true,
    },
    teamLabel: { type: ControlType.String, title: "Label 1" },
    hoursLabel: { type: ControlType.String, title: "Label 2" },
    rateLabel: { type: ControlType.String, title: "Label 3" },
    teamMin: {
        type: ControlType.Number,
        title: "Team Min",
        min: 1,
        max: 1000,
        step: 1,
    },
    teamMax: {
        type: ControlType.Number,
        title: "Team Max",
        min: 2,
        max: 10000,
        step: 1,
    },
    teamDefault: {
        type: ControlType.Number,
        title: "Team Start",
        min: 1,
        max: 10000,
        step: 1,
    },
    hoursMax: {
        type: ControlType.Number,
        title: "Hours Max",
        min: 2,
        max: 60,
        step: 1,
    },
    hoursDefault: {
        type: ControlType.Number,
        title: "Hours Start",
        min: 1,
        max: 60,
        step: 1,
    },
    rateMax: {
        type: ControlType.Number,
        title: "Rate Max",
        min: 20,
        max: 1000,
        step: 5,
    },
    rateDefault: {
        type: ControlType.Number,
        title: "Rate Start",
        min: 10,
        max: 1000,
        step: 5,
    },
    automation: {
        type: ControlType.Number,
        title: "Saved %",
        min: 1,
        max: 100,
        step: 1,
        unit: "%",
    },
    currency: { type: ControlType.String, title: "Currency" },
    showCta: { type: ControlType.Boolean, title: "Button" },
    ctaText: {
        type: ControlType.String,
        title: "Button Text",
        hidden: (p: Props) => !p.showCta,
    },
    ctaLink: {
        type: ControlType.Link,
        title: "Button Link",
        hidden: (p: Props) => !p.showCta,
    },
    font: { type: ControlType.Font, title: "Font", controls: "extended" },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
    },
    background: { type: ControlType.Color, title: "Background" },
    surface: { type: ControlType.Color, title: "Result Panel" },
    text: { type: ControlType.Color, title: "Text" },
    muted: { type: ControlType.Color, title: "Muted" },
    accent: { type: ControlType.Color, title: "Accent" },
    accentText: { type: ControlType.Color, title: "Button Text" },
    border: { type: ControlType.Color, title: "Border" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40 },
})
