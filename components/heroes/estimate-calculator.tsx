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


// EstimateCalculator: Project / Retainer estimate with a rush surcharge, three currencies,
// a mailto brief and a copyable summary. All maths lives in the plain functions below (one file, no extra exports),
// the screen is the only thing the harness has to read. No project tokens: every colour and font is a control.

interface Service {
    name: string
    price: number // USD
    weeks: number
}

interface Scope {
    id: string
    title: string
    mult: number
    note: string
}

interface Term {
    months: number
    off: number // percent
}

type Mode = "project" | "retainer"
type Code = "USD" | "EUR" | "GBP"

interface EstimateCalculatorProps {
    services: string
    preselect: number
    bookedUntil: string
    hourlyRate: number
    eurRate: number
    gbpRate: number
    defaultMode: Mode
    defaultCurrency: Code
    email: string
    subject: string
    disclaimer: string
    scopes: string
    terms: string
    labels: Partial<Labels>
    background: string
    surface: string
    ink: string
    muted: string
    line: string
    accent: string
    onAccent: string
    headingFont: React.CSSProperties
    bodyFont: React.CSSProperties
    monoFont: React.CSSProperties
    corner: number
    style?: React.CSSProperties
}

const DEFAULT_SERVICES = "Brand identity|9000|4\nWebsite|14000|6\nProduct design|18000|8\nContent & copy|4000|2\nMotion|6000|3"
const DEFAULT_DISCLAIMER = "Estimates are a starting point. We confirm scope and price after a 30-minute call."

interface Labels {
    project: string
    retainer: string
    currency: string
    services: string
    servicesHint: string
    scope: string
    duration: string
    hours: string
    commitment: string
    estimated: string
    perMonth: string
    team: string
    start: string
    delivery: string
    send: string
    copySummary: string
}

const DEFAULT_LABELS: Labels = {
    project: "Project",
    retainer: "Retainer",
    currency: "Currency",
    services: "Services",
    servicesHint: "Pick any that apply",
    scope: "Scope",
    duration: "Duration",
    hours: "Hours per month",
    commitment: "Commitment",
    estimated: "Estimated range",
    perMonth: "Per month",
    team: "Team",
    start: "Earliest start",
    delivery: "Delivery",
    send: "Send this brief",
    copySummary: "Copy summary",
}

const SCOPES: Scope[] = [
    { id: "lean", title: "Lean", mult: 0.7, note: "A tight brief, one round of feedback, one decision-maker." },
    { id: "standard", title: "Standard", mult: 1, note: "Our usual process: research, two rounds, a full handover." },
    { id: "extended", title: "Extended", mult: 1.6, note: "Wider research, more stakeholders, extra rounds and rollout support." },
]
const SCOPE_START = 1
const DEFAULT_SCOPES = SCOPES.map((item) => `${item.title}|${item.mult}|${item.note}`).join("\n")

const TERMS: Term[] = [
    { months: 3, off: 0 },
    { months: 6, off: 5 },
    { months: 12, off: 10 },
]

const DEFAULT_TERMS = TERMS.map((item) => `${item.months}|${item.off}`).join("\n")

const CODES: Code[] = ["USD", "EUR", "GBP"]

const SPREAD = 0.1 // estimate range is +/- 10 %
const ROUND_TO = 500 // range ends are rounded to a multiple of this, in the shown currency
const RUSH_PER_WEEK = 12 // percent per week shorter than recommended
const RUSH_CAP = 40 // percent
const WEEKS_FROM = 0.6 // slider spans 60 % ...
const WEEKS_TO = 2 // ... to 200 % of the recommended weeks
const WEEKS_FLOOR = 2 // recommended weeks never go below this
const TEAM_MAX = 6
const HOURS_MIN = 20
const HOURS_MAX = 120
const HOURS_STEP = 10
const HOURS_PER_PERSON = 40
const HOURS_START = 40
const TWEEN_MS = 250
const COPIED_MS = 1500
const MINUS = "−"

const HEADING_FONT: React.CSSProperties = { fontFamily: '"Schibsted Grotesk"', fontWeight: 800 }
const BODY_FONT: React.CSSProperties = { fontFamily: '"Inter"', fontWeight: 400 }
const MONO_FONT: React.CSSProperties = { fontFamily: '"IBM Plex Mono"', fontWeight: 500 }

// Same specificity trap as LESSONS 197: the reset sits inside :where() so every class rule below wins over it.
const CSS = `
.er{container-type:inline-size;position:relative;width:100%;color:var(--er-ink);background:var(--er-bg);font-family:var(--er-b-family);font-weight:var(--er-b-weight);font-style:var(--er-b-style);font-size:16px;line-height:24px;-webkit-text-size-adjust:100%}
:where(.er *,.er *::before,.er *::after){box-sizing:border-box}
:where(.er p,.er ul,.er ol,.er dl,.er dd,.er fieldset,.er output,.er h2,.er h3){margin:0;padding:0}
:where(.er ul,.er ol){list-style:none}
:where(.er fieldset){border:0;min-width:0}
:where(.er button,.er input,.er a){font:inherit;color:inherit}
:where(.er button){padding:0;background:none;border:0;cursor:pointer}
:where(.er a){text-decoration:none}
.er-h{font-family:var(--er-h-family);font-weight:var(--er-h-weight);font-style:var(--er-h-style);letter-spacing:-.02em;word-spacing:.06em}
.er-m{font-family:var(--er-m-family);font-weight:var(--er-m-weight);font-style:var(--er-m-style);font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.er-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.er-cap{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;font-family:var(--er-m-family);font-weight:var(--er-m-weight);font-size:12px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--er-muted)}
.er-cap b{font-weight:inherit;color:var(--er-ink)}

.er-top{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:20px 32px;padding:0 0 32px}
.er-cur{display:flex;flex-direction:column;gap:8px}

.er-ch{position:relative;display:block;min-width:0}
.er-in{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.er-in:disabled{cursor:default}
.er-face{position:relative;display:flex;align-items:center;gap:10px;min-height:48px;padding:0 16px;border:1px solid var(--er-ink);border-radius:var(--er-radius);background:transparent;color:var(--er-ink);transition:background-color 120ms ease-out,color 120ms ease-out}
.er-ch:hover .er-face{background:var(--er-surface)}
.er-in:checked + .er-face{background:var(--er-ink);color:var(--er-bg)}
.er-in:focus-visible + .er-face{outline:2px solid var(--er-ink);outline-offset:3px}
.er-face--seg{justify-content:center;font-size:15px;line-height:24px;padding:0 20px}
.er-face--big{min-height:56px;padding:0 28px;font-size:20px;line-height:24px}
.er-segs{display:flex}
.er-segs .er-ch{flex:1 1 auto}
.er-segs .er-ch + .er-ch .er-face{border-left-width:0}

.er-body{display:grid;grid-template-columns:minmax(0,1fr);gap:40px}
.er-inputs{display:flex;flex-direction:column;gap:40px;min-width:0}
.er-sec{display:flex;flex-direction:column;gap:14px;min-width:0}
.er-hint{font-size:14px;line-height:20px;color:var(--er-muted)}

.er-chips{display:flex;flex-wrap:wrap;gap:10px}
.er-chip .er-face::before{content:"";flex:none;width:10px;height:10px;border:1px solid currentColor}
.er-chip .er-in:checked + .er-face::before{background:currentColor}
.er-name{font-weight:500}
.er-meta{font-size:12px;line-height:16px;letter-spacing:.04em;color:var(--er-muted)}
.er-in:checked + .er-face .er-meta{color:inherit;opacity:.7}

.er-scopes{display:flex;flex-direction:column}
.er-scope + .er-scope{margin-top:-1px}
.er-scope .er-face{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:2px 16px;padding:14px 16px}
.er-scope-t{font-size:22px;line-height:28px}
.er-scope-x{font-size:14px;line-height:20px}
.er-scope-n{grid-column:1 / -1;font-size:14px;line-height:20px;color:var(--er-muted)}
.er-in:checked + .er-face .er-scope-n{color:inherit;opacity:.78}

.er-sliderhead{display:flex;justify-content:space-between;align-items:baseline;gap:16px}
.er-val{font-size:28px;line-height:32px}
.er-rangebox{position:relative}
.er-range{-webkit-appearance:none;appearance:none;display:block;width:100%;height:40px;margin:0;padding:0;background:transparent;cursor:pointer;border-radius:0}
.er-range:disabled{cursor:default;opacity:.4}
.er-range:focus-visible{outline:2px solid var(--er-ink);outline-offset:4px}
.er-range::-webkit-slider-runnable-track{height:3px;background:linear-gradient(var(--er-ink),var(--er-ink)) 0 0/calc(6px + (100% - 12px) * var(--er-fill)) 3px no-repeat,linear-gradient(var(--er-muted),var(--er-muted)) 0 1px/100% 1px no-repeat}
.er-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:21px;margin-top:-9px;border:0;border-radius:0;background:var(--er-ink)}
.er-range::-moz-range-track{height:1px;background:var(--er-muted)}
.er-range::-moz-range-progress{height:3px;background:var(--er-ink)}
.er-range::-moz-range-thumb{width:12px;height:21px;border:0;border-radius:0;background:var(--er-ink)}
.er-tick{position:absolute;top:28px;left:calc(6px + (100% - 12px) * var(--er-rec));width:1px;height:7px;background:var(--er-ink);pointer-events:none}
.er-ends{display:flex;justify-content:space-between;font-size:12px;line-height:16px;color:var(--er-muted)}
.er-link{align-self:flex-start;font-size:14px;line-height:20px;text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px;color:var(--er-ink)}
.er-link:focus-visible{outline:2px solid var(--er-ink);outline-offset:3px}

.er-terms .er-face{flex-direction:column;align-items:flex-start;justify-content:center;gap:0;padding:8px 16px;min-height:64px}
.er-term-t{font-size:20px;line-height:26px}
.er-term-n{font-size:12px;line-height:16px;letter-spacing:.04em}

.er-result{min-width:0;padding:28px 20px 32px;background:var(--er-surface);border-radius:var(--er-radius)}
.er-big{margin:12px 0 0;font-size:clamp(30px,8.4cqw,64px);line-height:1.04;letter-spacing:-.04em;color:var(--er-accent)}
.er-big span{white-space:nowrap}
.er-per{margin-left:10px;font-family:var(--er-m-family);font-weight:var(--er-m-weight);font-size:14px;line-height:20px;letter-spacing:.02em;color:var(--er-muted);white-space:nowrap}
.er-basis{margin:12px 0 0;font-size:14px;line-height:20px;color:var(--er-muted)}
.er-rows{margin:24px 0 0;border-top:1px solid var(--er-ink)}
.er-row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:12px 0;border-bottom:1px solid var(--er-line)}
.er-row dd{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:baseline;gap:4px 10px;text-align:right;font-size:22px;line-height:28px}
.er-pill{display:inline-block;padding:2px 8px;border:1px solid var(--er-ink);border-radius:var(--er-radius);font-family:var(--er-m-family);font-weight:var(--er-m-weight);font-size:12px;line-height:16px;letter-spacing:.02em;white-space:nowrap}
.er-ctas{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0 0}
.er-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 24px;border:1px solid var(--er-ink);border-radius:var(--er-radius);background:transparent;color:var(--er-ink);font-weight:600;font-size:15px;line-height:24px;letter-spacing:-.005em;cursor:pointer;transition:background-color 120ms ease-out,color 120ms ease-out}
.er-btn:hover{background:var(--er-ink);color:var(--er-bg)}
.er-btn--main{border-color:var(--er-accent);background:var(--er-accent);color:var(--er-on-accent)}
.er-btn--main:hover{background:var(--er-ink);border-color:var(--er-ink);color:var(--er-bg)}
.er-btn:focus-visible{outline:2px solid var(--er-ink);outline-offset:3px}
.er-btn[aria-disabled="true"],.er-btn:disabled{opacity:.4;cursor:default;pointer-events:none}
.er-disc{margin:20px 0 0;font-size:13px;line-height:20px;color:var(--er-muted)}

@container (min-width: 480px){
  .er-result{padding:32px 28px 36px}
}
@container (min-width: 810px){
  .er-body{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:48px;align-items:start}
  .er-result{position:sticky;top:24px;padding:36px 32px 40px}
  .er-big{font-size:clamp(28px,3.9cqw,60px)}
}
@container (min-width: 1100px){
  .er-body{gap:72px}
}
@media (prefers-reduced-motion: reduce){
  .er *{transition:none !important}
}
`

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

// round to a multiple of `step`; the epsilon keeps x.5 cases stable against float noise
function roundTo(value: number, step: number): number {
    return Math.round(value / step + 1e-9) * step
}

// one service per line: name|base price (USD)|base weeks; lines that do not parse are skipped
function parseServices(text: string): Service[] {
    const out: Service[] = []
    for (const line of String(text ?? "").split(/\r?\n/)) {
        const [rawName = "", rawPrice = "", rawWeeks = ""] = line.split("|")
        const name = rawName.trim()
        const price = Number(rawPrice.trim().replace(/,/g, ""))
        const weeks = Number(rawWeeks.trim())
        if (!name || rawPrice.trim() === "" || !Number.isFinite(price) || price < 0) continue
        if (rawWeeks.trim() === "" || !Number.isFinite(weeks) || weeks <= 0) continue
        out.push({ name, price, weeks })
    }
    return out
}

// one per line: title|price multiplier|note
function parseScopes(text: string): Scope[] {
    const out: Scope[] = []
    String(text ?? "").split(/\r?\n/).forEach((line, index) => {
        const [title, mult, ...note] = line.split("|")
        const factor = Number(String(mult ?? "").trim())
        if (!title || !title.trim() || !(factor > 0)) return
        out.push({ id: `scope-${index}`, title: title.trim(), mult: Math.min(factor, 10), note: note.join("|").trim() })
    })
    return out.slice(0, 5)
}

// one per line: months|discount in percent
function parseTerms(text: string): Term[] {
    const out: Term[] = []
    String(text ?? "").split(/\r?\n/).forEach((line) => {
        const [months, off] = line.split("|")
        const m = Math.round(Number(String(months ?? "").trim()))
        const o = Number(String(off ?? "0").trim())
        if (!(m >= 1 && m <= 60)) return
        out.push({ months: m, off: o >= 0 && o <= 90 ? o : 0 })
    })
    return out.slice(0, 4)
}

const formatters: Record<string, Intl.NumberFormat> = {}

function money(value: number, code: string): string {
    const found = formatters[code]
    const format =
        found ??
        (formatters[code] = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }))
    return format.format(value)
}

// longest service x scope + the rest at half, e.g. Brand 4 + Website 6, Standard: 6 x 1 + 4 x 0.5 = 8 weeks
function recommendedWeeks(picked: Service[], mult: number): number {
    if (picked.length === 0) return 0
    const total = picked.reduce((sum, item) => sum + item.weeks, 0)
    const longest = Math.max(...picked.map((item) => item.weeks))
    return Math.max(WEEKS_FLOOR, Math.round(longest * mult + (total - longest) * 0.5 + 1e-9))
}

interface ProjectResult {
    rec: number
    min: number
    max: number
    weeks: number
    rush: number // percent
    low: number // in the shown currency
    high: number
    team: number
}

// total 23,000 x Standard 1 x (1 + rush) +/- 10 %, rounded to 500 in the shown currency:
// 8 weeks -> 20,700 / 25,300 -> $20,500 - $25,500; 6 weeks (Rush +24%) -> 25,668 / 31,372 -> $25,500 - $31,500
function projectResult(picked: Service[], scope: Scope, custom: number | null, rate: number): ProjectResult | null {
    if (picked.length === 0) return null
    const rec = recommendedWeeks(picked, scope.mult)
    const min = Math.max(1, Math.round(rec * WEEKS_FROM + 1e-9))
    const max = Math.max(min, Math.round(rec * WEEKS_TO + 1e-9))
    const weeks = clamp(custom ?? rec, min, max)
    const rush = Math.min(RUSH_CAP, Math.max(0, rec - weeks) * RUSH_PER_WEEK)
    const price = picked.reduce((sum, item) => sum + item.price, 0) * scope.mult * (1 + rush / 100) * rate
    const workWeeks = picked.reduce((sum, item) => sum + item.weeks, 0) * scope.mult
    return {
        rec,
        min,
        max,
        weeks,
        rush,
        low: roundTo(price * (1 - SPREAD), ROUND_TO),
        high: roundTo(price * (1 + SPREAD), ROUND_TO),
        team: clamp(Math.ceil(workWeeks / weeks - 1e-9), 1, TEAM_MAX),
    }
}

interface RetainerResult {
    monthly: number // in the shown currency, whole units
    total: number // monthly x months, so the figures on screen add up
    gross: number // before the long-term discount
    team: number
}

// 60 h x 120 = 7,200; 6 months -5 % -> 6,840 a month, 41,040 in total
function retainerResult(hours: number, hourly: number, term: Term, rate: number): RetainerResult {
    const gross = roundTo(hours * hourly * rate, 1)
    const monthly = roundTo(hours * hourly * (1 - term.off / 100) * rate, 1)
    return { monthly, total: monthly * term.months, gross, team: Math.max(1, Math.ceil(hours / HOURS_PER_PERSON - 1e-9)) }
}

function parseMonth(text: string): number | null {
    const found = /^\s*(\d{4})-(\d{1,2})\s*$/.exec(String(text ?? ""))
    if (!found) return null
    const month = Number(found[2])
    return month >= 1 && month <= 12 ? Number(found[1]) * 12 + month - 1 : null
}

// earliest start = the month after the later of "booked until" and today (today is unknown on the first and static render)
function startMonth(booked: string, now: number | null): number {
    const asked = parseMonth(booked)
    if (now === null && asked !== null) return asked + 1
    const date = new Date(now ?? Date.now())
    const today = date.getFullYear() * 12 + date.getMonth()
    return Math.max(asked ?? today, today) + 1
}

function monthLabel(index: number): string {
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(Date.UTC(Math.floor(index / 12), index % 12, 1))
}

// delivery = first day of the start month + weeks, as a month label
function deliveryLabel(startIndex: number, weeks: number): string {
    const first = Date.UTC(Math.floor(startIndex / 12), startIndex % 12, 1)
    const end = new Date(first + weeks * 7 * 86400000)
    return monthLabel(end.getUTCFullYear() * 12 + end.getUTCMonth())
}

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`
}

async function copyText(text: string): Promise<boolean> {
    try {
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text)
            return true
        }
    } catch {
        // fall through to the textarea path (iframes without clipboard permission)
    }
    try {
        const area = document.createElement("textarea")
        area.value = text
        area.setAttribute("readonly", "")
        area.style.position = "fixed"
        area.style.opacity = "0"
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(area)
        return ok
    } catch {
        return false
    }
}

function useReducedMotion(): boolean {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])
    return reduced
}

// counts the shown number toward `target` over 250 ms (ease-out); `enabled` false = jump straight there
function useTween(target: number, enabled: boolean): number {
    const [value, setValue] = React.useState(target)
    const shown = React.useRef(target)
    React.useEffect(() => {
        if (!enabled || shown.current === target) {
            shown.current = target
            setValue(target)
            return
        }
        const origin = shown.current
        const start = performance.now()
        let frame = 0
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / TWEEN_MS)
            shown.current = t >= 1 ? target : origin + (target - origin) * (1 - Math.pow(1 - t, 3))
            setValue(shown.current)
            if (t < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frame)
    }, [target, enabled])
    return enabled ? value : target
}

interface ChoiceProps {
    type: "radio" | "checkbox"
    name?: string
    checked: boolean
    disabled?: boolean
    onChange: () => void
    className?: string
    face?: string
    children: React.ReactNode
}

// a real input stretched over a styled face: keyboard, focus and screen readers come from the browser
function Choice({ type, name, checked, disabled, onChange, className = "", face = "", children }: ChoiceProps) {
    return (
        <label className={`er-ch ${className}`}>
            <input className="er-in" type={type} name={name} checked={checked} disabled={disabled} onChange={onChange} />
            <span className={`er-face ${face}`}>{children}</span>
        </label>
    )
}

function fontVars(prefix: string, font: React.CSSProperties, fallback: React.CSSProperties, generic: string): Record<string, string | number> {
    const family = font.fontFamily || fallback.fontFamily
    return {
        [`--er-${prefix}-family`]: `${family}, ${generic}`,
        [`--er-${prefix}-weight`]: font.fontWeight ?? fallback.fontWeight ?? 400,
        [`--er-${prefix}-style`]: font.fontStyle ?? "normal",
    }
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function EstimateCalculator(props: EstimateCalculatorProps) {
    const {
        services = DEFAULT_SERVICES,
        preselect = 2,
        bookedUntil = "2027-01",
        hourlyRate = 120,
        eurRate = 0.92,
        gbpRate = 0.79,
        defaultMode = "project",
        defaultCurrency = "USD",
        email = "hello@example.com",
        subject = "Project estimate request",
        disclaimer = DEFAULT_DISCLAIMER,
        scopes = DEFAULT_SCOPES,
        terms = DEFAULT_TERMS,
        labels,
        background = "#F3F1EC",
        surface = "#E8E5DE",
        ink = "#0F0F0E",
        muted = "#5E5C57",
        line = "rgba(15,15,14,0.14)",
        accent = "#2F45FF",
        onAccent = "#F3F1EC",
        headingFont = HEADING_FONT,
        bodyFont = BODY_FONT,
        monoFont = MONO_FONT,
        corner = 0,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const uid = React.useId()

    const list = React.useMemo(() => {
        const parsed = parseServices(services)
        return parsed.length > 0 ? parsed : parseServices(DEFAULT_SERVICES)
    }, [services])
    const scopeList = React.useMemo(() => {
        const parsed = parseScopes(scopes)
        return parsed.length > 0 ? parsed : SCOPES
    }, [scopes])
    const termList = React.useMemo(() => {
        const parsed = parseTerms(terms)
        return parsed.length > 0 ? parsed : TERMS
    }, [terms])
    const minMonths = Math.min(...termList.map((item) => item.months))
    const L = { ...DEFAULT_LABELS }
    for (const key of Object.keys(L) as (keyof Labels)[]) L[key] = (labels && labels[key]) || DEFAULT_LABELS[key]
    const firstPicked = React.useMemo(
        () => list.map((_, index) => index).slice(0, clamp(Math.round(toNumber(preselect, 2)), 0, list.length)),
        [list, preselect]
    )

    const [mode, setMode] = React.useState<Mode>(defaultMode === "retainer" ? "retainer" : "project")
    const [code, setCode] = React.useState<Code>(CODES.includes(defaultCurrency) ? defaultCurrency : "USD")
    const [picked, setPicked] = React.useState<number[]>(firstPicked)
    const [scopeIndex, setScopeIndex] = React.useState(SCOPE_START)
    const scopeAt = Math.min(scopeIndex, scopeList.length - 1)
    const [custom, setCustom] = React.useState<number | null>(null)
    const [hours, setHours] = React.useState(HOURS_START)
    const [termIndex, setTermIndex] = React.useState(0)
    const termAt = Math.min(termIndex, termList.length - 1)
    const [now, setNow] = React.useState<number | null>(null)
    const [copied, setCopied] = React.useState<"" | "yes" | "no">("")
    const copyTimer = React.useRef(0)

    React.useEffect(() => setMode(defaultMode === "retainer" ? "retainer" : "project"), [defaultMode])
    React.useEffect(() => setCode(CODES.includes(defaultCurrency) ? defaultCurrency : "USD"), [defaultCurrency])
    React.useEffect(() => {
        setPicked(firstPicked)
        setCustom(null)
    }, [firstPicked])
    // today only after mount, so server and first client render agree (the static renderer never gets here)
    React.useEffect(() => {
        if (!isStatic) setNow(Date.now())
    }, [isStatic])
    React.useEffect(() => () => window.clearTimeout(copyTimer.current), [])

    const rate = code === "EUR" ? Math.max(0, toNumber(eurRate, 0.92)) : code === "GBP" ? Math.max(0, toNumber(gbpRate, 0.79)) : 1
    const hourly = Math.max(0, toNumber(hourlyRate, 120))
    const scope = scopeList[scopeAt]
    const term = termList[termAt]
    const chosen = picked.filter((index) => index < list.length).sort((a, b) => a - b).map((index) => list[index])
    const project = projectResult(chosen, scope, custom, rate)
    const retainer = retainerResult(hours, hourly, term, rate)
    const startIndex = startMonth(bookedUntil, now)
    const startText = monthLabel(startIndex)
    const deliveryText = project ? deliveryLabel(startIndex, project.weeks) : ""
    const inProject = mode === "project"

    const tween = !isStatic && !reduced
    const shownLow = useTween(project ? project.low : 0, tween)
    const shownHigh = useTween(project ? project.high : 0, tween)
    const shownMonthly = useTween(retainer.monthly, tween)
    const shownTotal = useTween(retainer.total, tween)

    const ready = inProject ? project !== null : true
    const rangeText = project ? `${money(project.low, code)} – ${money(project.high, code)}` : ""
    const teamText = project ? plural(project.team, "person", "people") : ""

    let summary = ""
    if (inProject && project) {
        summary =
            `Project brief: ${chosen.map((item) => item.name).join(", ")}. ` +
            `${scope.title} scope, ${plural(project.weeks, "week", "weeks")}${project.rush > 0 ? ` (Rush +${project.rush}%)` : ""}, team of ${project.team}. ` +
            `Estimated ${rangeText}. Earliest start ${startText}, delivery around ${deliveryText}.`
    } else if (!inProject) {
        summary =
            `Retainer brief: ${hours} hours a month at ${money(hourly * rate, code)} an hour for ${term.months} months` +
            `${term.off > 0 ? ` (${term.off}% long-term discount)` : ""}. ` +
            `${money(retainer.monthly, code)} a month, ${money(retainer.total, code)} in total, dedicated team of ${retainer.team}. ` +
            `Earliest start ${startText}.`
    }
    const mailto = `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`

    const live = inProject
        ? project
            ? `Estimate ${rangeText}, ${plural(project.weeks, "week", "weeks")}${project.rush > 0 ? `, Rush +${project.rush}%` : ""}, ${teamText}, starts ${startText}, delivery ${deliveryText}.`
            : "Pick at least one service to see an estimate."
        : `${money(retainer.monthly, code)} a month for ${term.months} months${term.off > 0 ? `, ${term.off}% off` : ""}, ${money(retainer.total, code)} in total, dedicated team of ${retainer.team}, starts ${startText}.`

    const togglePicked = (index: number) => {
        setPicked((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]))
        setCustom(null)
    }
    const chooseScope = (index: number) => {
        setScopeIndex(index)
        setCustom(null)
    }
    const copy = async () => {
        const ok = await copyText(summary)
        setCopied(ok ? "yes" : "no")
        window.clearTimeout(copyTimer.current)
        copyTimer.current = window.setTimeout(() => setCopied(""), COPIED_MS)
    }

    const weeksFill = project && project.max > project.min ? (project.weeks - project.min) / (project.max - project.min) : 0
    const weeksRec = project && project.max > project.min ? (project.rec - project.min) / (project.max - project.min) : 0
    const hoursFill = (hours - HOURS_MIN) / (HOURS_MAX - HOURS_MIN)

    const vars = {
        "--er-bg": background,
        "--er-surface": surface,
        "--er-ink": ink,
        "--er-muted": muted,
        "--er-line": line,
        "--er-accent": accent,
        "--er-on-accent": onAccent,
        "--er-radius": `${Math.max(0, toNumber(corner, 0))}px`,
        ...fontVars("h", headingFont, HEADING_FONT, "ui-sans-serif, system-ui, sans-serif"),
        ...fontVars("b", bodyFont, BODY_FONT, "ui-sans-serif, system-ui, sans-serif"),
        ...fontVars("m", monoFont, MONO_FONT, "ui-monospace, SFMono-Regular, Menlo, monospace"),
    } as React.CSSProperties

    const weeksId = `${uid}-weeks`
    const hoursId = `${uid}-hours`

    return (
        <div className="er" style={{ ...style, ...vars }} data-mode={mode} data-currency={code} data-static={isStatic ? "true" : "false"}>
            <style>{CSS}</style>
            <div className="er-top">
                <div className="er-segs" role="radiogroup" aria-label="Engagement">
                    <Choice type="radio" name={`${uid}-mode`} checked={inProject} onChange={() => setMode("project")} face="er-face--seg er-face--big er-h">
                        {L.project}
                    </Choice>
                    <Choice type="radio" name={`${uid}-mode`} checked={!inProject} onChange={() => setMode("retainer")} face="er-face--seg er-face--big er-h">
                        {L.retainer}
                    </Choice>
                </div>
                <div className="er-cur">
                    <span className="er-cap" id={`${uid}-cur`}>{L.currency}</span>
                    <div className="er-segs" role="radiogroup" aria-labelledby={`${uid}-cur`}>
                        {CODES.map((item) => (
                            <Choice key={item} type="radio" name={`${uid}-cur`} checked={code === item} onChange={() => setCode(item)} face="er-face--seg er-m">
                                {item}
                            </Choice>
                        ))}
                    </div>
                </div>
            </div>

            <div className="er-body">
                <div className="er-inputs">
                    {inProject ? (
                        <>
                            <div className="er-sec" role="group" aria-labelledby={`${uid}-svc`}>
                                <span className="er-cap" id={`${uid}-svc`}><b aria-hidden="true">01</b> {L.services} <span>{L.servicesHint}</span></span>
                                <div className="er-chips">
                                    {list.map((item, index) => (
                                        <Choice key={`${index}-${item.name}`} type="checkbox" className="er-chip" checked={picked.includes(index)} onChange={() => togglePicked(index)}>
                                            <span className="er-name">{item.name}</span>
                                            <span className="er-meta er-m" aria-hidden="true">{`${item.weeks}w`}</span>
                                        </Choice>
                                    ))}
                                </div>
                            </div>
                            <div className="er-sec" role="radiogroup" aria-labelledby={`${uid}-scope`}>
                                <span className="er-cap" id={`${uid}-scope`}><b aria-hidden="true">02</b> {L.scope}</span>
                                <div className="er-scopes">
                                    {scopeList.map((item, index) => (
                                        <Choice key={item.id} type="radio" name={`${uid}-scope`} className="er-scope" checked={scopeAt === index} onChange={() => chooseScope(index)}>
                                            <span className="er-scope-t er-h">{item.title}</span>
                                            <span className="er-scope-x er-m" aria-hidden="true">{`×${item.mult}`}</span>
                                            <span className="er-scope-n">{item.note}</span>
                                        </Choice>
                                    ))}
                                </div>
                            </div>
                            <div className="er-sec">
                                <div className="er-sliderhead">
                                    <label className="er-cap" htmlFor={weeksId}><b aria-hidden="true">03</b> {L.duration}</label>
                                    <output className="er-val er-h" htmlFor={weeksId}>{project ? `${project.weeks} weeks` : "—"}</output>
                                </div>
                                <div className="er-rangebox" style={{ "--er-fill": weeksFill, "--er-rec": weeksRec } as React.CSSProperties}>
                                    <input
                                        id={weeksId}
                                        className="er-range"
                                        type="range"
                                        min={project ? project.min : 0}
                                        max={project ? project.max : 1}
                                        step={1}
                                        value={project ? project.weeks : 0}
                                        disabled={!project}
                                        aria-valuetext={project ? `${plural(project.weeks, "week", "weeks")}${project.rush > 0 ? `, Rush +${project.rush}%` : ""}` : undefined}
                                        onChange={(event) => setCustom(Number(event.target.value))}
                                    />
                                    {project ? <span className="er-tick" aria-hidden="true" /> : null}
                                </div>
                                <div className="er-ends er-m" aria-hidden="true">
                                    <span>{project ? `${project.min} weeks` : ""}</span>
                                    <span>{project ? `${project.max} weeks` : ""}</span>
                                </div>
                                <p className="er-hint">
                                    {!project
                                        ? "Pick a service to set a duration."
                                        : project.weeks < project.rec
                                          ? `Recommended: ${project.rec} weeks. Shorter adds ${RUSH_PER_WEEK}% per week, up to ${RUSH_CAP}%.`
                                          : project.weeks > project.rec
                                            ? `Recommended: ${project.rec} weeks. A longer schedule keeps the price and needs a smaller team.`
                                            : `Recommended for this scope: ${project.rec} weeks.`}
                                </p>
                                {project && project.weeks !== project.rec ? (
                                    <button type="button" className="er-link" onClick={() => setCustom(null)}>
                                        {`Back to ${project.rec} weeks`}
                                    </button>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="er-sec">
                                <div className="er-sliderhead">
                                    <label className="er-cap" htmlFor={hoursId}><b aria-hidden="true">01</b> {L.hours}</label>
                                    <output className="er-val er-h" htmlFor={hoursId}>{`${hours} h`}</output>
                                </div>
                                <div className="er-rangebox" style={{ "--er-fill": hoursFill, "--er-rec": 0 } as React.CSSProperties}>
                                    <input
                                        id={hoursId}
                                        className="er-range"
                                        type="range"
                                        min={HOURS_MIN}
                                        max={HOURS_MAX}
                                        step={HOURS_STEP}
                                        value={hours}
                                        aria-valuetext={`${hours} hours a month`}
                                        onChange={(event) => setHours(clamp(Number(event.target.value), HOURS_MIN, HOURS_MAX))}
                                    />
                                </div>
                                <div className="er-ends er-m" aria-hidden="true">
                                    <span>{`${HOURS_MIN} h`}</span>
                                    <span>{`${HOURS_MAX} h`}</span>
                                </div>
                                <p className="er-hint">{`One dedicated person per ${HOURS_PER_PERSON} hours. Billed at ${money(hourly * rate, code)} an hour.`}</p>
                            </div>
                            <div className="er-sec" role="radiogroup" aria-labelledby={`${uid}-term`}>
                                <span className="er-cap" id={`${uid}-term`}><b aria-hidden="true">02</b> {L.commitment} <span>{`Minimum ${minMonths} months`}</span></span>
                                <div className="er-segs er-terms">
                                    {termList.map((item, index) => (
                                        <Choice key={item.months} type="radio" name={`${uid}-term`} checked={termAt === index} onChange={() => setTermIndex(index)}>
                                            <span className="er-term-t er-h">{`${item.months} months`}</span>{" "}
                                            <span className="er-term-n er-m">{item.off > 0 ? `${MINUS}${item.off}%` : "Minimum"}</span>
                                        </Choice>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <aside className="er-result" aria-label="Your estimate" data-ready={ready}>
                    <span className="er-cap">{inProject ? L.estimated : L.perMonth}</span>
                    {inProject ? (
                        <p className="er-big er-h" aria-hidden="true" data-low={project ? project.low : ""} data-high={project ? project.high : ""} data-big="range">
                            {project ? (
                                <>
                                    <span>{`${money(Math.round(shownLow), code)} –`}</span> <span>{money(Math.round(shownHigh), code)}</span>
                                </>
                            ) : (
                                "—"
                            )}
                        </p>
                    ) : (
                        <p className="er-big er-h" aria-hidden="true" data-monthly={retainer.monthly} data-big="monthly">
                            <span>{money(Math.round(shownMonthly), code)}</span> <span className="er-per">/ month</span>
                        </p>
                    )}
                    <p className="er-basis">
                        {inProject
                            ? project
                                ? `${chosen.map((item) => item.name).join(" + ")} · ${scope.title} scope`
                                : "No service picked yet."
                            : `${hours} h × ${money(hourly * rate, code)} = ${money(retainer.gross, code)} a month${term.off > 0 ? `, ${MINUS}${term.off}% for ${term.months} months` : ""}`}
                    </p>
                    <dl className="er-rows">
                        {inProject ? (
                            <>
                                <div className="er-row">
                                    <dt className="er-cap">{L.duration}</dt>
                                    <dd className="er-h" data-field="duration">
                                        <span>{project ? `${project.weeks} weeks` : "—"}</span>
                                        {project && project.rush > 0 ? <span className="er-pill" data-field="rush">{`Rush +${project.rush}%`}</span> : null}
                                    </dd>
                                </div>
                                <div className="er-row">
                                    <dt className="er-cap">{L.team}</dt>
                                    <dd className="er-h" data-field="team">{project ? teamText : "—"}</dd>
                                </div>
                                <div className="er-row">
                                    <dt className="er-cap">{L.start}</dt>
                                    <dd className="er-h" data-field="start">{startText}</dd>
                                </div>
                                <div className="er-row">
                                    <dt className="er-cap">{L.delivery}</dt>
                                    <dd className="er-h" data-field="delivery">{project ? deliveryText : "—"}</dd>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="er-row">
                                    <dt className="er-cap">{L.commitment}</dt>
                                    <dd className="er-h" data-field="commitment">
                                        <span>{`${term.months} months`}</span>
                                        {term.off > 0 ? <span className="er-pill" data-field="discount">{`${MINUS}${term.off}%`}</span> : null}
                                    </dd>
                                </div>
                                <div className="er-row">
                                    <dt className="er-cap">{`Total, ${term.months} months`}</dt>
                                    <dd className="er-h" data-field="total" data-total={retainer.total}>{money(Math.round(shownTotal), code)}</dd>
                                </div>
                                <div className="er-row">
                                    <dt className="er-cap">{L.team}</dt>
                                    <dd className="er-h" data-field="team">{`Dedicated team of ${retainer.team}`}</dd>
                                </div>
                                <div className="er-row">
                                    <dt className="er-cap">{L.start}</dt>
                                    <dd className="er-h" data-field="start">{startText}</dd>
                                </div>
                            </>
                        )}
                    </dl>
                    <div className="er-ctas">
                        <a
                            className="er-btn er-btn--main"
                            href={ready ? mailto : undefined}
                            role={ready ? undefined : "link"}
                            aria-disabled={ready ? undefined : true}
                            data-cta="send"
                        >
                            {L.send}
                            <span aria-hidden="true">{"→"}</span>
                        </a>
                        <button type="button" className="er-btn" disabled={!ready} onClick={copy} data-cta="copy">
                            {copied === "yes" ? "Copied" : copied === "no" ? "Copy failed" : L.copySummary}
                        </button>
                    </div>
                    {disclaimer ? <p className="er-disc">{disclaimer}</p> : null}
                    <div className="er-sr" aria-live="polite" aria-atomic="true" data-live>
                        {live}
                    </div>
                    <div className="er-sr" role="status">
                        {copied === "yes" ? "Summary copied to the clipboard." : copied === "no" ? "Could not copy the summary." : ""}
                    </div>
                </aside>
            </div>
        </div>
    )
}

addPropertyControls(EstimateCalculator, {
    services: {
        type: ControlType.String,
        title: "Services",
        defaultValue: DEFAULT_SERVICES,
        displayTextArea: true,
        description: "One per line: name|base price in USD|base weeks",
    },
    preselect: {
        type: ControlType.Number,
        title: "Preselect",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
        description: "How many services from the top start selected",
    },
    bookedUntil: {
        type: ControlType.String,
        title: "Booked until",
        defaultValue: "2027-01",
        description: "YYYY-MM. The earliest start is the month after this, or after today if that is later",
    },
    hourlyRate: { type: ControlType.Number, title: "Hourly rate", defaultValue: 120, min: 1, max: 1000, step: 1, unit: "USD" },
    eurRate: { type: ControlType.Number, title: "EUR rate", defaultValue: 0.92, min: 0.01, max: 100, step: 0.01, description: "Per 1 USD" },
    gbpRate: { type: ControlType.Number, title: "GBP rate", defaultValue: 0.79, min: 0.01, max: 100, step: 0.01, description: "Per 1 USD" },
    defaultMode: {
        type: ControlType.Enum,
        title: "Default mode",
        defaultValue: "project",
        options: ["project", "retainer"],
        optionTitles: ["Project", "Retainer"],
        displaySegmentedControl: true,
    },
    defaultCurrency: {
        type: ControlType.Enum,
        title: "Default currency",
        defaultValue: "USD",
        options: ["USD", "EUR", "GBP"],
        displaySegmentedControl: true,
    },
    email: { type: ControlType.String, title: "Email", defaultValue: "hello@example.com" },
    subject: { type: ControlType.String, title: "Subject", defaultValue: "Project estimate request" },
    scopes: {
        type: ControlType.String,
        title: "Scopes",
        defaultValue: DEFAULT_SCOPES,
        displayTextArea: true,
        description: "One per line: name|price multiplier|short note. Up to 5",
    },
    terms: {
        type: ControlType.String,
        title: "Retainer terms",
        defaultValue: DEFAULT_TERMS,
        displayTextArea: true,
        description: "One per line: months|discount in percent. Up to 4",
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            project: { type: ControlType.String, title: "Project", defaultValue: DEFAULT_LABELS.project },
            retainer: { type: ControlType.String, title: "Retainer", defaultValue: DEFAULT_LABELS.retainer },
            currency: { type: ControlType.String, title: "Currency", defaultValue: DEFAULT_LABELS.currency },
            services: { type: ControlType.String, title: "Services", defaultValue: DEFAULT_LABELS.services },
            servicesHint: { type: ControlType.String, title: "Services hint", defaultValue: DEFAULT_LABELS.servicesHint },
            scope: { type: ControlType.String, title: "Scope", defaultValue: DEFAULT_LABELS.scope },
            duration: { type: ControlType.String, title: "Duration", defaultValue: DEFAULT_LABELS.duration },
            hours: { type: ControlType.String, title: "Hours", defaultValue: DEFAULT_LABELS.hours },
            commitment: { type: ControlType.String, title: "Commitment", defaultValue: DEFAULT_LABELS.commitment },
            estimated: { type: ControlType.String, title: "Range", defaultValue: DEFAULT_LABELS.estimated },
            perMonth: { type: ControlType.String, title: "Monthly", defaultValue: DEFAULT_LABELS.perMonth },
            team: { type: ControlType.String, title: "Team", defaultValue: DEFAULT_LABELS.team },
            start: { type: ControlType.String, title: "Start", defaultValue: DEFAULT_LABELS.start },
            delivery: { type: ControlType.String, title: "Delivery", defaultValue: DEFAULT_LABELS.delivery },
            send: { type: ControlType.String, title: "Send button", defaultValue: DEFAULT_LABELS.send },
            copySummary: { type: ControlType.String, title: "Copy button", defaultValue: DEFAULT_LABELS.copySummary },
        },
    },
    disclaimer: { type: ControlType.String, title: "Disclaimer", defaultValue: DEFAULT_DISCLAIMER, displayTextArea: true },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F3F1EC" },
    surface: { type: ControlType.Color, title: "Surface", defaultValue: "#E8E5DE" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0F0F0E" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#5E5C57" },
    line: { type: ControlType.Color, title: "Line", defaultValue: "rgba(15,15,14,0.14)" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2F45FF" },
    onAccent: { type: ControlType.Color, title: "On Accent", defaultValue: "#F3F1EC" },
    headingFont: {
        type: ControlType.Font,
        title: "Heading font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Bold" },
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
    corner: { type: ControlType.Number, title: "Corner", defaultValue: 0, min: 0, max: 24, step: 1, unit: "px" },
})
