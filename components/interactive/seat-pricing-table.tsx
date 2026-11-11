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


// Seat Pricing Calculator: monthly/yearly switch, seat slider, currency switch, plans on a hairline sheet.
// Self-contained on purpose: no project tokens, only the props below, so it can ship as a free component.

interface Plan {
    name: string
    tagline: string
    pricePerSeat: number // USD per seat per month, 0 = none
    flatPrice: number // USD per month on top of the seats, 0 = none
    seatLimit: number // 0 = no limit
    priceLabel: string // replaces the amount when set, e.g. "Custom"
    features: string // one feature per line
    ctaLabel: string
    ctaLink: string
    highlight: boolean
}

interface Currency {
    code: string
    symbol: string
    rate: number // 1 USD in this currency
    rounding: number // amounts are rounded to a multiple of this (KRW 100, others 1)
}

interface PricingTableProps {
    plans: Plan[]
    annualDiscount: number
    defaultBilling: "monthly" | "yearly"
    defaultSeats: number
    defaultCurrency: string
    currencies: Currency[]
    badgeLabel: string
    paperColor: string
    inkColor: string
    mutedColor: string
    subtleColor: string
    lineColor: string
    accentColor: string
    headingFont: React.CSSProperties
    bodyFont: React.CSSProperties
    monoFont: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_PLANS: Plan[] = [
    {
        name: "Free",
        tagline: "For small teams getting started",
        pricePerSeat: 0,
        flatPrice: 0,
        seatLimit: 5,
        priceLabel: "",
        features: "Ask with receipts on every answer\n5 connectors\n7-day answer history\nCommunity support",
        ctaLabel: "Start free",
        ctaLink: "#start",
        highlight: false,
    },
    {
        name: "Team",
        tagline: "For teams that run on answers",
        pricePerSeat: 24,
        flatPrice: 0,
        seatLimit: 0,
        priceLabel: "",
        features: "Everything in Free\n40+ connectors\nDeep research runs\nScheduled briefs\nAPI & MCP server",
        ctaLabel: "Try Team free",
        ctaLink: "#start",
        highlight: true,
    },
    {
        name: "Enterprise",
        tagline: "For security reviews and scale",
        pricePerSeat: 0,
        flatPrice: 0,
        seatLimit: 0,
        priceLabel: "Custom",
        features: "Everything in Team\nSSO, SCIM and audit logs\nCustom data retention\nPriority support with an SLA",
        ctaLabel: "Let's talk",
        ctaLink: "#contact",
        highlight: false,
    },
]

const DEFAULT_CURRENCIES: Currency[] = [
    { code: "USD", symbol: "$", rate: 1, rounding: 1 },
    { code: "EUR", symbol: "€", rate: 0.92, rounding: 1 },
    { code: "GBP", symbol: "£", rate: 0.79, rounding: 1 },
    { code: "KRW", symbol: "₩", rate: 1350, rounding: 100 },
]

const HEADING_FONT: React.CSSProperties = { fontFamily: '"Instrument Sans"', fontWeight: 600 }
const BODY_FONT: React.CSSProperties = { fontFamily: '"Instrument Sans"', fontWeight: 400 }
const MONO_FONT: React.CSSProperties = { fontFamily: '"Geist Mono"', fontWeight: 400 }

const SEATS_MIN = 1
const SEATS_MAX = 200

// Plans are a hairline sheet: Ink rule above and below, Line rules between plans, no cards, no shadows.
// Every plan is a subgrid of the sheet, so label / name / tagline / price / notes / features / button line up across plans.
const CSS = `
.fpt{container-type:inline-size;position:relative;width:100%;color:var(--fpt-ink);background:var(--fpt-paper);font-family:var(--fpt-b-family);font-weight:var(--fpt-b-weight);font-style:var(--fpt-b-style);font-size:16px;line-height:24px}
.fpt *,.fpt *::before,.fpt *::after{box-sizing:border-box}
.fpt-wrap{padding:8px 0 16px}
.fpt-h{font-family:var(--fpt-h-family);font-weight:var(--fpt-h-weight);font-style:var(--fpt-h-style)}
.fpt-m{font-family:var(--fpt-m-family);font-weight:var(--fpt-m-weight);font-style:var(--fpt-m-style);font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.fpt-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.fpt button,.fpt a,.fpt input{border-radius:0}
.fpt button:focus-visible,.fpt a:focus-visible,.fpt input:focus-visible{outline:2px solid var(--fpt-ink);outline-offset:2px}

.fpt-bar{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;padding:0 0 32px}
.fpt-grp{min-width:0;display:flex;flex-direction:column;gap:8px}
.fpt-cap{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--fpt-muted)}
.fpt-sw{display:flex;align-items:center;flex-wrap:wrap;gap:12px;min-height:40px}
.fpt-opt{margin:0;padding:0;border:0;background:none;font-size:16px;line-height:24px;letter-spacing:inherit;text-align:left;cursor:pointer;user-select:none;color:var(--fpt-muted)}
.fpt-opt[aria-pressed="true"]{color:var(--fpt-ink);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:6px}
.fpt-switch{position:relative;flex:none;width:44px;height:24px;padding:0;border:1px solid var(--fpt-ink);background:var(--fpt-paper);cursor:pointer}
.fpt-switch[data-on="true"]{background:var(--fpt-ink)}
.fpt-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;background:var(--fpt-ink);transition:transform 120ms ease-out,background-color 120ms ease-out}
.fpt-switch[data-on="true"] .fpt-knob{transform:translateX(20px);background:var(--fpt-paper)}
.fpt-pill{padding:3px 8px;border:1px solid var(--fpt-ink);font-size:12px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.fpt-pill[data-on="true"]{background:var(--fpt-ink);color:var(--fpt-paper)}

.fpt-seatval{font-size:20px;line-height:16px;font-weight:600;color:var(--fpt-ink);letter-spacing:0}
.fpt-range{-webkit-appearance:none;appearance:none;display:block;width:100%;height:32px;margin:0;padding:0;background:transparent;cursor:pointer}
.fpt-range::-webkit-slider-runnable-track{height:3px;background:linear-gradient(var(--fpt-ink),var(--fpt-ink)) 0 0/calc(6px + (100% - 12px) * var(--fpt-r)) 3px no-repeat,linear-gradient(var(--fpt-subtle),var(--fpt-subtle)) 0 1px/100% 1px no-repeat}
.fpt-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:21px;margin-top:-9px;border:0;border-radius:0;background:var(--fpt-ink)}
.fpt-range::-moz-range-track{height:1px;background:var(--fpt-subtle)}
.fpt-range::-moz-range-progress{height:3px;background:var(--fpt-ink)}
.fpt-range::-moz-range-thumb{width:12px;height:21px;border:0;border-radius:0;background:var(--fpt-ink)}
.fpt-ends{display:flex;justify-content:space-between;font-size:12px;line-height:16px;color:var(--fpt-muted)}

.fpt-seg{display:flex}
.fpt-seg button{flex:1 1 0;min-width:56px;height:40px;padding:0 12px;margin:0 0 0 -1px;border:1px solid var(--fpt-ink);background:var(--fpt-paper);color:var(--fpt-ink);font-size:13px;line-height:20px;letter-spacing:.06em;cursor:pointer}
.fpt-seg button:first-child{margin-left:0}
.fpt-seg button:hover{background:var(--fpt-line)}
.fpt-seg button[aria-checked="true"]{background:var(--fpt-ink);color:var(--fpt-paper);position:relative;z-index:1}
.fpt-seg button:focus-visible{z-index:2}

.fpt-sheet{display:grid;grid-template-columns:minmax(0,1fr);border-top:1px solid var(--fpt-ink);border-bottom:1px solid var(--fpt-ink)}
.fpt-plan{position:relative;display:grid;grid-row:span 7;grid-template-rows:subgrid;min-width:0;padding:28px 0 32px}
.fpt-plan + .fpt-plan{border-top:1px solid var(--fpt-line)}
.fpt-plan[data-hl="true"]::before{content:"";position:absolute;left:0;right:0;top:-1px;height:2px;background:var(--fpt-accent)}
.fpt-label:empty{display:none}
.fpt-label{height:16px;margin:0 0 12px;font-size:12px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--fpt-accent);white-space:nowrap}
.fpt-name{margin:0 0 8px;font-size:28px;line-height:32px;letter-spacing:-.02em}
.fpt-tag{margin:0 0 24px;font-size:15px;line-height:22px;color:var(--fpt-muted)}
.fpt-price{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:8px;min-height:56px;margin:0 0 8px}
.fpt-amount{display:inline-flex;align-items:baseline;gap:2px;white-space:nowrap;font-family:var(--fpt-h-family);font-weight:var(--fpt-h-weight);font-style:var(--fpt-h-style);font-size:clamp(32px,4cqw,56px);line-height:56px;letter-spacing:-.03em;font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.fpt-sym{font-size:.6em;line-height:1;letter-spacing:0}
.fpt-per{font-size:13px;line-height:16px;color:var(--fpt-muted)}
.fpt-custom{font-size:clamp(32px,4cqw,56px);line-height:56px;letter-spacing:-.03em}
.fpt-notes{display:flex;flex-direction:column;align-items:flex-start;gap:4px;margin:0 0 28px;padding:0;list-style:none;font-size:12px;line-height:20px;color:var(--fpt-muted)}
.fpt-notes:empty{margin:0}
.fpt-limit[data-over="true"]{padding:2px 8px;border:1px solid var(--fpt-ink);color:var(--fpt-ink)}
.fpt-feat{margin:0 0 28px;padding:0;list-style:none;border-top:1px solid var(--fpt-line)}
.fpt-feat li{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:1px solid var(--fpt-line);font-size:15px;line-height:22px}
.fpt-check{flex:none;display:block;width:14px;height:14px;margin-top:4px}
.fpt-cta{display:flex;align-items:center;justify-content:center;align-self:end;min-height:48px;padding:8px 20px;border:1px solid var(--fpt-ink);background:var(--fpt-paper);color:var(--fpt-ink);font-size:15px;line-height:24px;letter-spacing:-.005em;text-align:center;text-decoration:none;cursor:pointer;transition:background-color 120ms ease-out,color 120ms ease-out}
.fpt-cta:hover{background:var(--fpt-ink);color:var(--fpt-paper)}
.fpt-plan[data-hl="true"] .fpt-cta{background:var(--fpt-ink);color:var(--fpt-paper)}
.fpt-plan[data-hl="true"] .fpt-cta:hover{background:var(--fpt-paper);color:var(--fpt-ink)}

/* 3 columns from 760px: an 810 Tablet page with 24px side padding gives this container 762px */
@container (min-width: 760px){
  .fpt-label:empty{display:block}
  .fpt-bar{grid-template-columns:auto auto;justify-content:space-between;align-items:end}
  .fpt-bar .fpt-seats{grid-column:1 / -1;order:3}
  .fpt-sheet{grid-template-columns:repeat(var(--fpt-cols),minmax(0,1fr))}
  .fpt-plan{padding:32px 32px 36px}
  .fpt-plan + .fpt-plan{border-top:0}
  .fpt-plan:first-child{padding-left:0}
  .fpt-plan:last-child{padding-right:0}
  .fpt-plan:not(:first-child){border-left:1px solid var(--fpt-line)}
  .fpt-plan[data-hl="true"]:not(:first-child)::before{left:-1px}
  .fpt-sheet[data-n="4"] .fpt-plan:nth-child(odd){padding-left:0;padding-right:32px;border-left:0}
  .fpt-sheet[data-n="4"] .fpt-plan:nth-child(even){padding-left:32px;padding-right:0}
  .fpt-sheet[data-n="4"] .fpt-plan:nth-child(n+3){border-top:1px solid var(--fpt-line)}
  .fpt-sheet[data-n="4"] .fpt-plan[data-hl="true"]:nth-child(odd)::before{left:0}
}
@container (min-width: 1100px){
  .fpt-bar{grid-template-columns:auto minmax(0,1fr) auto;gap:48px;align-items:start}
  .fpt-bar .fpt-seats{grid-column:auto;order:0}
  .fpt-plan{padding:36px 36px 40px}
  .fpt-sheet[data-n="4"]{grid-template-columns:repeat(4,minmax(0,1fr))}
  .fpt-sheet[data-n="4"] .fpt-plan,.fpt-sheet[data-n="4"] .fpt-plan:nth-child(odd),.fpt-sheet[data-n="4"] .fpt-plan:nth-child(even){padding:36px 28px 40px;border-top:0;border-left:1px solid var(--fpt-line)}
  .fpt-sheet[data-n="4"] .fpt-plan:nth-child(1){padding-left:0;border-left:0}
  .fpt-sheet[data-n="4"] .fpt-plan:nth-child(4){padding-right:0}
  .fpt-sheet[data-n="4"] .fpt-plan[data-hl="true"]:not(:nth-child(1))::before{left:-1px}
  .fpt-sheet[data-n="4"] .fpt-plan[data-hl="true"]:nth-child(1)::before{left:0}
}
@media (prefers-reduced-motion: reduce){
  .fpt *{transition:none !important}
}
`

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

// round to a multiple of `step`; the epsilon keeps x.5 cases stable against float noise
function roundTo(value: number, step: number): number {
    const unit = step > 0 ? step : 1
    return Math.round(value / unit + 1e-9) * unit
}

function groupDigits(whole: string): string {
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatInteger(value: number): string {
    return groupDigits(String(Math.round(value)))
}

// unit prices: whole amounts stay whole, fractions get two decimals ($19.20); coarse-rounded currencies (KRW) stay whole won
function formatUnit(value: number, rounding: number): string {
    if (rounding > 1) return formatInteger(value)
    const [whole, fraction] = value.toFixed(2).split(".")
    return fraction === "00" ? groupDigits(whole) : `${groupDigits(whole)}.${fraction}`
}

// Team 10 seats: 24 * 10 = 240 USD/mo; yearly 240 * (1 - 20%) = 192; KRW 192 * 1350 = 259,200
function monthlyAmount(plan: Pick<Plan, "pricePerSeat" | "flatPrice">, seats: number, yearly: boolean, discount: number, currency: Currency): number {
    const usd = (plan.pricePerSeat * seats + plan.flatPrice) * (yearly ? 1 - discount / 100 : 1)
    return roundTo(usd * currency.rate, currency.rounding)
}

interface NormalPlan extends Omit<Plan, "features"> {
    features: string[]
}

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

function normalizePlan(plan: Plan): NormalPlan {
    return {
        name: plan.name ?? "",
        tagline: plan.tagline ?? "",
        pricePerSeat: Math.max(0, toNumber(plan.pricePerSeat, 0)),
        flatPrice: Math.max(0, toNumber(plan.flatPrice, 0)),
        seatLimit: Math.max(0, toNumber(plan.seatLimit, 0)),
        priceLabel: (plan.priceLabel ?? "").trim(),
        features: String(plan.features ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
        ctaLabel: plan.ctaLabel ?? "",
        ctaLink: plan.ctaLink ?? "",
        highlight: plan.highlight === true,
    }
}

function Check() {
    return (
        <svg className="fpt-check" viewBox="0 0 14 14" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" aria-hidden="true" focusable="false">
            <path d="M2 7.5 5.5 11 12 3.5" />
        </svg>
    )
}

interface AmountProps {
    value: number
    currency: Currency
    planName: string
    yearly: boolean
}

function Amount({ value, currency, planName, yearly }: AmountProps) {
    const final = `${currency.symbol}${formatInteger(value)}`
    return (
        <div className="fpt-price">
            <span className="fpt-amount" data-amount={value}>
                <span className="fpt-sym" aria-hidden="true">{currency.symbol}</span>
                <span aria-hidden="true">{formatInteger(value)}</span>
            </span>
            <span className="fpt-per fpt-m" aria-hidden="true">/mo</span>
            <span className="fpt-sr" aria-live="polite">{`${planName}: ${final} per month${yearly ? ", billed yearly" : ""}`}</span>
        </div>
    )
}

interface CardProps {
    plan: Plan
    seats: number
    yearly: boolean
    discount: number
    currency: Currency
    badgeLabel: string
}

function PlanColumn({ plan: raw, seats, yearly, discount, currency, badgeLabel }: CardProps) {
    const plan = normalizePlan(raw)
    const custom = plan.priceLabel.length > 0
    const priced = !custom
    const amount = monthlyAmount(plan, seats, yearly, discount, currency)
    const over = plan.seatLimit > 0 && seats > plan.seatLimit
    const unit = plan.pricePerSeat * (yearly ? 1 - discount / 100 : 1) * currency.rate
    const notes: React.ReactNode[] = []
    if (plan.seatLimit > 0) {
        notes.push(
            <li key="limit" className="fpt-limit fpt-m" data-over={over} role={over ? "status" : undefined}>
                {over ? `Up to ${plan.seatLimit} seats · you picked ${seats}` : `Up to ${plan.seatLimit} seats`}
            </li>
        )
    }
    if (priced && plan.pricePerSeat > 0) {
        notes.push(
            <li key="unit" className="fpt-m">
                {`${seats} ${seats === 1 ? "seat" : "seats"} · ${currency.symbol}${formatUnit(unit, currency.rounding)} per seat`}
            </li>
        )
    }
    if (priced && amount > 0) {
        notes.push(
            <li key="billing" className="fpt-m">
                {yearly ? "billed yearly" : "billed monthly"}
            </li>
        )
    }
    return (
        <article className="fpt-plan" data-plan={plan.name} data-hl={plan.highlight}>
            <div className="fpt-label fpt-m">{plan.highlight && badgeLabel ? badgeLabel : null}</div>
            <h3 className="fpt-name fpt-h">{plan.name}</h3>
            <p className="fpt-tag">{plan.tagline}</p>
            {custom ? (
                <div className="fpt-price">
                    <span className="fpt-custom fpt-h">{plan.priceLabel}</span>
                </div>
            ) : (
                <Amount value={amount} currency={currency} planName={plan.name} yearly={yearly} />
            )}
            <ul className="fpt-notes">{notes}</ul>
            <ul className="fpt-feat">
                {plan.features.map((feature, index) => (
                    <li key={`${index}-${feature}`}>
                        <Check />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <a
                className="fpt-cta fpt-h"
                href={plan.ctaLink || "#"}
                onClick={plan.ctaLink ? undefined : (event) => event.preventDefault()}
            >
                {plan.ctaLabel}
            </a>
        </article>
    )
}

function fontVars(prefix: string, font: React.CSSProperties, fallback: React.CSSProperties): Record<string, string | number> {
    const family = font.fontFamily || fallback.fontFamily
    return {
        [`--fpt-${prefix}-family`]: `${family}, ui-sans-serif, system-ui, sans-serif`,
        [`--fpt-${prefix}-weight`]: font.fontWeight ?? fallback.fontWeight ?? 400,
        [`--fpt-${prefix}-style`]: font.fontStyle ?? "normal",
    }
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function PricingTable(props: PricingTableProps) {
    const {
        plans = DEFAULT_PLANS,
        annualDiscount = 20,
        defaultBilling = "monthly",
        defaultSeats = 10,
        defaultCurrency = "USD",
        currencies = DEFAULT_CURRENCIES,
        badgeLabel = "Most picked",
        paperColor = "#F5F4EF",
        inkColor = "#141414",
        mutedColor = "#5A5C62",
        subtleColor = "#8C8E93",
        lineColor = "#E1DED5",
        accentColor = "#FF4D1F",
        headingFont = HEADING_FONT,
        bodyFont = BODY_FONT,
        monoFont = MONO_FONT,
        style,
    } = props

    const uid = React.useId()
    const seatsId = `${uid}-seats`
    const discount = clamp(annualDiscount, 0, 90)
    const startSeats = clamp(Math.round(defaultSeats), SEATS_MIN, SEATS_MAX)
    const money = currencies.length > 0 ? currencies : DEFAULT_CURRENCIES

    const [yearly, setYearly] = React.useState(defaultBilling === "yearly")
    const [seats, setSeats] = React.useState(startSeats)
    const [code, setCode] = React.useState(defaultCurrency)
    React.useEffect(() => setYearly(defaultBilling === "yearly"), [defaultBilling])
    React.useEffect(() => setSeats(startSeats), [startSeats])
    React.useEffect(() => setCode(defaultCurrency), [defaultCurrency])

    const picked = money.find((item) => item.code === code) ?? money[0]
    const currency: Currency = {
        code: picked.code,
        symbol: picked.symbol ?? "",
        rate: Math.max(0, toNumber(picked.rate, 1)),
        rounding: Math.max(1, toNumber(picked.rounding, 1)),
    }
    const radios = React.useRef<(HTMLButtonElement | null)[]>([])

    const onCurrencyKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next = -1
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % money.length
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + money.length) % money.length
        else if (event.key === "Home") next = 0
        else if (event.key === "End") next = money.length - 1
        if (next < 0) return
        event.preventDefault()
        setCode(money[next].code)
        radios.current[next]?.focus()
    }

    // columns on the sheet: one per plan up to 3; four plans sit 2 x 2 until the sheet is wide enough for four across
    const count = Math.max(1, plans.length)
    const vars = {
        "--fpt-paper": paperColor,
        "--fpt-ink": inkColor,
        "--fpt-muted": mutedColor,
        "--fpt-subtle": subtleColor,
        "--fpt-line": lineColor,
        "--fpt-accent": accentColor,
        "--fpt-r": (seats - SEATS_MIN) / (SEATS_MAX - SEATS_MIN),
        "--fpt-cols": count === 4 ? 2 : count,
        ...fontVars("h", headingFont, HEADING_FONT),
        ...fontVars("b", bodyFont, BODY_FONT),
        ...fontVars("m", monoFont, MONO_FONT),
    } as React.CSSProperties

    return (
        <div
            className="fpt"
            style={{ ...style, ...vars }}
            data-seats={seats}
            data-billing={yearly ? "yearly" : "monthly"}
            data-currency={currency.code}
        >
            <style>{CSS}</style>
            <div className="fpt-wrap">
                <div className="fpt-bar" role="group" aria-label="Pricing options">
                    <div className="fpt-grp">
                        <span className="fpt-cap fpt-m" id={`${uid}-bill`}>Billing</span>
                        <div className="fpt-sw" role="group" aria-labelledby={`${uid}-bill`}>
                            <button type="button" className="fpt-opt fpt-h" aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
                            {/* mouse shortcut for the two buttons: hidden from assistive tech and the tab order, so the labels are the only stops */}
                            <button type="button" className="fpt-switch" data-on={yearly} aria-hidden="true" tabIndex={-1} onClick={() => setYearly(!yearly)}>
                                <span className="fpt-knob" />
                            </button>
                            <button
                                type="button"
                                className="fpt-opt fpt-h"
                                aria-pressed={yearly}
                                aria-describedby={discount > 0 ? `${uid}-save` : undefined}
                                onClick={() => setYearly(true)}
                            >
                                Yearly
                            </button>
                            {discount > 0 ? <span className="fpt-pill fpt-m" id={`${uid}-save`} data-on={yearly}>{`Save ${discount}%`}</span> : null}
                        </div>
                    </div>
                    <div className="fpt-grp fpt-seats">
                        <label className="fpt-cap fpt-m" htmlFor={seatsId}>
                            <span>Seats</span>
                            <output className="fpt-seatval fpt-h" htmlFor={seatsId}>{seats}</output>
                        </label>
                        <input
                            id={seatsId}
                            className="fpt-range"
                            type="range"
                            min={SEATS_MIN}
                            max={SEATS_MAX}
                            step={1}
                            value={seats}
                            aria-valuetext={`${seats} ${seats === 1 ? "seat" : "seats"}`}
                            onChange={(event) => setSeats(clamp(Number(event.target.value), SEATS_MIN, SEATS_MAX))}
                        />
                        <div className="fpt-ends fpt-m" aria-hidden="true">
                            <span>{SEATS_MIN}</span>
                            <span>{SEATS_MAX}</span>
                        </div>
                    </div>
                    <div className="fpt-grp">
                        <span className="fpt-cap fpt-m" id={`${uid}-cur`}>Currency</span>
                        <div className="fpt-seg" role="radiogroup" aria-labelledby={`${uid}-cur`}>
                            {money.map((item, index) => (
                                <button
                                    key={item.code}
                                    ref={(node) => {
                                        radios.current[index] = node
                                    }}
                                    type="button"
                                    role="radio"
                                    className="fpt-m"
                                    aria-checked={item.code === currency.code}
                                    tabIndex={item.code === currency.code ? 0 : -1}
                                    onClick={() => setCode(item.code)}
                                    onKeyDown={(event) => onCurrencyKey(event, index)}
                                >
                                    {item.code}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="fpt-sheet" data-n={count}>
                    {plans.map((plan, index) => (
                        <PlanColumn
                            key={`${index}-${plan.name}`}
                            plan={plan}
                            seats={seats}
                            yearly={yearly}
                            discount={discount}
                            currency={currency}
                            badgeLabel={badgeLabel}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(PricingTable, {
    plans: {
        type: ControlType.Array,
        title: "Plans",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Plan" },
                tagline: { type: ControlType.String, title: "Tagline", defaultValue: "" },
                pricePerSeat: { type: ControlType.Number, title: "Per seat", defaultValue: 0, min: 0, max: 1000, step: 1, unit: "USD" },
                flatPrice: { type: ControlType.Number, title: "Flat price", defaultValue: 0, min: 0, max: 10000, step: 1, unit: "USD" },
                seatLimit: { type: ControlType.Number, title: "Seat limit", defaultValue: 0, min: 0, max: 1000, step: 1, description: "0 = no limit" },
                priceLabel: { type: ControlType.String, title: "Price text", defaultValue: "", description: "Replaces the amount, e.g. Custom" },
                features: {
                    type: ControlType.String,
                    title: "Features",
                    defaultValue: "Feature",
                    displayTextArea: true,
                    description: "One feature per line",
                },
                ctaLabel: { type: ControlType.String, title: "Button", defaultValue: "Start free" },
                ctaLink: { type: ControlType.Link, title: "Link" },
                highlight: { type: ControlType.Boolean, title: "Highlight", defaultValue: false },
            },
        },
        defaultValue: DEFAULT_PLANS,
    },
    badgeLabel: { type: ControlType.String, title: "Badge", defaultValue: "Most picked" },
    annualDiscount: { type: ControlType.Number, title: "Yearly off", defaultValue: 20, min: 0, max: 50, step: 1, unit: "%" },
    defaultBilling: {
        type: ControlType.Enum,
        title: "Billing",
        defaultValue: "monthly",
        options: ["monthly", "yearly"],
        optionTitles: ["Monthly", "Yearly"],
        displaySegmentedControl: true,
    },
    defaultSeats: { type: ControlType.Number, title: "Seats", defaultValue: 10, min: SEATS_MIN, max: SEATS_MAX, step: 1 },
    defaultCurrency: {
        type: ControlType.Enum,
        title: "Currency",
        defaultValue: "USD",
        options: ["USD", "EUR", "GBP", "KRW"],
        displaySegmentedControl: true,
    },
    currencies: {
        type: ControlType.Array,
        title: "Currencies",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                code: { type: ControlType.String, title: "Code", defaultValue: "USD" },
                symbol: { type: ControlType.String, title: "Symbol", defaultValue: "$" },
                rate: { type: ControlType.Number, title: "Rate", defaultValue: 1, min: 0, max: 100000, step: 0.01, description: "Per 1 USD" },
                rounding: { type: ControlType.Number, title: "Round to", defaultValue: 1, min: 1, max: 10000, step: 1 },
            },
        },
        defaultValue: DEFAULT_CURRENCIES,
    },
    paperColor: { type: ControlType.Color, title: "Paper", defaultValue: "#F5F4EF" },
    inkColor: { type: ControlType.Color, title: "Ink", defaultValue: "#141414" },
    mutedColor: { type: ControlType.Color, title: "Ink muted", defaultValue: "#5A5C62" },
    subtleColor: { type: ControlType.Color, title: "Ink subtle", defaultValue: "#8C8E93" },
    lineColor: { type: ControlType.Color, title: "Line", defaultValue: "#E1DED5" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#FF4D1F" },
    headingFont: {
        type: ControlType.Font,
        title: "Heading font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Semibold" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Regular" },
    },
    monoFont: {
        type: ControlType.Font,
        title: "Mono font",
        controls: "basic",
        defaultFontType: "monospace",
    },
})
