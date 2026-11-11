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


/**
 * Scenario Lens — a transparent, interactive ROI component.
 * Paste this file into Framer: Assets → Code → Create Code File.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ScenarioLens(props) {
    const {
        title,
        subtitle,
        peopleLabel,
        hoursLabel,
        rateLabel,
        efficiency,
        monthlyPrice,
        weeks,
        currency,
        accent,
        background,
        initialPeople,
        initialHours,
        initialRate,
        minRate,
        maxRate,
        maxPeople,
        maxHours,
        style,
    } = props
    const [people, setPeople] = React.useState(initialPeople)
    const [hours, setHours] = React.useState(initialHours)
    const [rate, setRate] = React.useState(initialRate)
    const [copied, setCopied] = React.useState(false)
    const safeWeeks = Math.max(1, weeks)
    const fraction = Math.min(1, Math.max(0, efficiency / 100))
    const weekly = people * hours
    const savedHours = weekly * fraction * safeWeeks
    const annualPrice = monthlyPrice * 12
    const net = savedHours * rate - annualPrice
    const paybackDays =
        weekly * fraction * rate > 0
            ? Math.ceil((monthlyPrice / (weekly * fraction * rate)) * 7)
            : null
    const number = (n) => Math.round(n).toLocaleString("en-US")
    const money = (n) => `${n < 0 ? "−" : ""}${currency}${number(Math.abs(n))}`

    const presets = React.useMemo(
        () => [
            { name: "Small team", values: [4, 5, 25] },
            { name: "Growing team", values: [12, 8, 35] },
            { name: "At scale", values: [40, 12, 55] },
        ],
        []
    )
    const applyPreset = (values) => {
        setPeople(Math.min(maxPeople, values[0]))
        setHours(Math.min(maxHours, values[1]))
        setRate(Math.min(maxRate, Math.max(minRate, values[2])))
    }
    const copy = async () => {
        const statement = `${title}\n${number(savedHours)} hours saved/year; ${money(net)} net/year. Assumptions: ${people} people × ${hours} hours/week × ${safeWeeks} weeks × ${efficiency}% at ${currency}${rate}/hour; ${currency}${monthlyPrice}/month.`
        try {
            await navigator.clipboard.writeText(statement)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopied(false)
        }
    }

    const css = `
      .sl-root{width:100%;color:#eef3e9;font-family:Inter,Arial,sans-serif;background:${background};border:1px solid #395247;border-radius:22px;overflow:hidden;display:grid;grid-template-columns:minmax(260px,39%) minmax(0,1fr);box-sizing:border-box}
      .sl-root *{box-sizing:border-box}.sl-panel{padding:30px}.sl-controls{border-right:1px solid #395247}.sl-kicker{color:${accent};font-size:11px;letter-spacing:.13em;font-weight:700;text-transform:uppercase}.sl-root h2{font-size:25px;line-height:1.15;letter-spacing:-.04em;margin:12px 0}.sl-muted{font-size:13px;color:#a7baaa;line-height:1.5}.sl-presets{display:flex;gap:7px;flex-wrap:wrap;margin:24px 0}.sl-preset,.sl-copy{font:600 12px Inter,Arial,sans-serif;cursor:pointer;border:1px solid #4d6857;border-radius:99px;padding:9px 12px;background:#24382e;color:#e5eee4}.sl-preset[data-active=true]{background:${accent};border-color:${accent};color:#15241a}.sl-field{margin:24px 0}.sl-fieldline,.sl-ends,.sl-foot{display:flex;justify-content:space-between;gap:10px}.sl-fieldline{align-items:center;font-size:13px}.sl-fieldline strong{font-size:18px;color:${accent}}.sl-field input{width:100%;margin:15px 0 4px;accent-color:${accent};cursor:pointer}.sl-ends{font-size:11px;color:#88a08e}.sl-assumption{border:1px solid #355145;border-radius:13px;background:#11211a;padding:13px;color:#a7baaa;font-size:12px;line-height:1.5}.sl-assumption strong{color:#edf6e9}.sl-head{display:flex;justify-content:space-between;gap:8px}.sl-tag{height:max-content;border:1px solid #476e4c;border-radius:99px;background:#233c29;color:${accent};font-size:10px;font-weight:700;padding:7px 9px;white-space:nowrap}.sl-big{font-size:clamp(46px,7vw,84px);font-weight:700;line-height:1;letter-spacing:-.075em;color:${accent};margin:29px 0 4px}.sl-bars{border-top:1px solid #395247;border-bottom:1px solid #395247;margin:28px 0 22px;padding:15px 0}.sl-barline{display:grid;grid-template-columns:85px minmax(0,1fr) 48px;align-items:center;gap:10px;font-size:12px;margin:12px 0}.sl-barline b{text-align:right}.sl-track{background:#31463a;height:12px;border-radius:99px;overflow:hidden}.sl-fill{height:100%;border-radius:99px}.sl-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sl-metric{padding:16px;background:#22382c;border-radius:13px}.sl-metric b{display:block;font-size:24px;letter-spacing:-.04em}.sl-metric span{font-size:11px;color:#a7baaa}.sl-foot{align-items:center;margin-top:21px;color:#96ab9b;font-size:11px;line-height:1.5}.sl-copy:hover{filter:brightness(1.2)}@media(max-width:760px){.sl-root{grid-template-columns:1fr}.sl-controls{border-right:0;border-bottom:1px solid #395247}.sl-panel{padding:25px}.sl-foot{align-items:flex-start;flex-direction:column}}@media(max-width:380px){.sl-metrics{grid-template-columns:1fr}}
    `
    const slider = (label, value, setter, min, max, suffix = "") => (
        <div className="sl-field">
            <div className="sl-fieldline">
                <label>{label}</label>
                <strong>
                    {value}
                    {suffix}
                </strong>
            </div>
            <input
                aria-label={label}
                type="range"
                min={min}
                max={max}
                step="1"
                value={value}
                onChange={(event) => setter(Number(event.target.value))}
            />
            <div className="sl-ends">
                <span>
                    {min}
                    {suffix}
                </span>
                <span>
                    {max}
                    {suffix}
                </span>
            </div>
        </div>
    )
    return (
        <div className="sl-root" style={style}>
            <style>{css}</style>
            <div className="sl-panel sl-controls">
                <div className="sl-kicker">01 / Your scenario</div>
                <h2>{title}</h2>
                <div className="sl-muted">{subtitle}</div>
                <div className="sl-presets">
                    {presets.map((preset) => (
                        <button
                            key={preset.name}
                            className="sl-preset"
                            data-active={
                                people ===
                                    Math.min(maxPeople, preset.values[0]) &&
                                hours ===
                                    Math.min(maxHours, preset.values[1]) &&
                                rate ===
                                    Math.min(
                                        maxRate,
                                        Math.max(minRate, preset.values[2])
                                    )
                            }
                            onClick={() => applyPreset(preset.values)}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
                {slider(peopleLabel, people, setPeople, 1, maxPeople)}
                {slider(hoursLabel, hours, setHours, 1, maxHours, " h")}
                {slider(
                    rateLabel,
                    rate,
                    setRate,
                    minRate,
                    maxRate,
                    ` ${currency}`
                )}
                <div className="sl-assumption">
                    <strong>Transparent assumptions</strong>
                    <br />
                    {safeWeeks} weeks/year · {efficiency}% automated ·{" "}
                    {currency}
                    {monthlyPrice}/month subscription. Illustrative estimate,
                    not a guarantee.
                </div>
            </div>
            <div className="sl-panel" aria-live="polite">
                <div className="sl-head">
                    <div>
                        <div className="sl-kicker">02 / Potential impact</div>
                        <h2>Your time, returned</h2>
                    </div>
                    <span className="sl-tag">LIVE ESTIMATE</span>
                </div>
                <div className="sl-big">{number(savedHours)} h</div>
                <div className="sl-muted">estimated hours freed per year</div>
                <div className="sl-bars">
                    <div className="sl-barline">
                        <span>Today</span>
                        <div className="sl-track">
                            <div
                                className="sl-fill"
                                style={{ width: "100%", background: "#799583" }}
                            />
                        </div>
                        <b>{number(weekly)} h</b>
                    </div>
                    <div className="sl-barline">
                        <span>With product</span>
                        <div className="sl-track">
                            <div
                                className="sl-fill"
                                style={{
                                    width: `${(1 - fraction) * 100}%`,
                                    background: accent,
                                }}
                            />
                        </div>
                        <b>{number(weekly * (1 - fraction))} h</b>
                    </div>
                    <div className="sl-ends">
                        <span>Weekly hours on this workflow</span>
                        <span>Lower is better ↓</span>
                    </div>
                </div>
                <div className="sl-metrics">
                    <div className="sl-metric">
                        <b>{money(net)}</b>
                        <span>estimated net savings / year</span>
                    </div>
                    <div className="sl-metric">
                        <b>
                            {paybackDays === null ? "—" : `${paybackDays} days`}
                        </b>
                        <span>estimated time to cover subscription</span>
                    </div>
                </div>
                <div className="sl-foot">
                    <span>
                        {people} people × {hours} h × {safeWeeks} weeks ×{" "}
                        {efficiency}% × {currency}
                        {rate} − {currency}
                        {number(annualPrice)} / year
                    </span>
                    <button className="sl-copy" onClick={copy}>
                        {copied ? "Copied ✓" : "Copy scenario ↗"}
                    </button>
                </div>
            </div>
        </div>
    )
}

ScenarioLens.defaultProps = {
    title: "Tell us about your team",
    subtitle: "Drag the inputs to see a scenario that fits your team.",
    peopleLabel: "People doing this work",
    hoursLabel: "Hours per person / week",
    rateLabel: "Cost per hour",
    efficiency: 60,
    monthlyPrice: 299,
    weeks: 52,
    currency: "$",
    accent: "#B8FA67",
    background: "#182722",
    initialPeople: 12,
    initialHours: 8,
    initialRate: 35,
    minRate: 10,
    maxRate: 150,
    maxPeople: 80,
    maxHours: 35,
}
addPropertyControls(ScenarioLens, {
    title: { type: ControlType.String, title: "Title" },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        displayTextArea: true,
    },
    peopleLabel: { type: ControlType.String, title: "People Label" },
    hoursLabel: { type: ControlType.String, title: "Hours Label" },
    rateLabel: { type: ControlType.String, title: "Rate Label" },
    efficiency: {
        type: ControlType.Number,
        title: "Saved %",
        min: 0,
        max: 100,
        step: 1,
    },
    monthlyPrice: {
        type: ControlType.Number,
        title: "Monthly Price",
        min: 0,
        max: 100000,
        step: 1,
    },
    weeks: {
        type: ControlType.Number,
        title: "Weeks/Year",
        min: 1,
        max: 53,
        step: 1,
    },
    currency: { type: ControlType.String, title: "Currency" },
    accent: { type: ControlType.Color, title: "Accent" },
    background: { type: ControlType.Color, title: "Background" },
    initialPeople: {
        type: ControlType.Number,
        title: "Start People",
        min: 1,
        max: 80,
        step: 1,
    },
    initialHours: {
        type: ControlType.Number,
        title: "Start Hours",
        min: 1,
        max: 35,
        step: 1,
    },
    initialRate: {
        type: ControlType.Number,
        title: "Start Rate",
        min: 1,
        max: 150,
        step: 1,
    },
    minRate: {
        type: ControlType.Number,
        title: "Min Rate",
        min: 1,
        max: 500,
        step: 1,
    },
    maxRate: {
        type: ControlType.Number,
        title: "Max Rate",
        min: 1,
        max: 500,
        step: 1,
    },
    maxPeople: {
        type: ControlType.Number,
        title: "Max People",
        min: 1,
        max: 500,
        step: 1,
    },
    maxHours: {
        type: ControlType.Number,
        title: "Max Hours",
        min: 1,
        max: 80,
        step: 1,
    },
})
