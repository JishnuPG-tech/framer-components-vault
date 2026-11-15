// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion } from "framer-motion"
import { useEffect, useId, useRef, useState, startTransition, type CSSProperties, type KeyboardEvent } from "react"

// Pricing Switch — a SaaS pricing table with monthly and yearly billing, currencies by site language, seats and VAT.
// Designed by Miguel Recio · miguelrecio.es
// Documentation: https://miguelrecio-components.framer.website/pricing-switch/docs
// Version 1.1.1

type Billing = "monthly" | "yearly"
type Rounding = "none" | "whole" | "99" | "90" | "00"
type Decimals = "auto" | "always" | "never"
type Layout = "cards" | "compact"
type SeatsInput = "stepper" | "slider"
type BadgeMode = "auto" | "custom" | "none"
type VatShown = "excl" | "incl"
type Align = "left" | "center"

interface Plan {
    name: string
    description: string
    highlighted: boolean
    highlightLabel: string
    monthly: number
    yearly: number
    seatMonthly: number
    seatYearly: number
    includedSeats: number
    customPrice: string
    features: string
    ctaLabel: string
    ctaLink: string
    newTab: boolean
}

interface Currency {
    code: string
    rate: number
    locales: string
    rounding: Rounding
}

interface Props {
    plans: Plan[]
    // Billing
    defaultBilling: Billing
    monthlyLabel: string
    yearlyLabel: string
    billingLabel: string
    badgeMode: BadgeMode
    badgeText: string
    perMonthLabel: string
    monthlyNote: string
    yearlyNote: string
    // Currency
    currencies: Currency[]
    currencySelector: boolean
    currencyLabel: string
    decimals: Decimals
    // Seats
    seats: boolean
    seatsInput: SeatsInput
    seatsMin: number
    seatsMax: number
    seatsStep: number
    seatsDefault: number
    seatsLabel: string
    seatsNote: string
    seatsNoteOne: string
    fewerLabel: string
    moreLabel: string
    // VAT
    vat: boolean
    vatRate: number
    vatShown: VatShown
    vatSwitch: boolean
    vatSwitchLabel: string
    vatExclLabel: string
    vatInclLabel: string
    notIncludedLabel: string
    // Layout
    layout: Layout
    stackBelow: number
    controlsAlign: Align
    animateNumbers: boolean
    // Colours
    cardBackground: string
    highlightBackground: string
    highlightBorder: string
    textColor: string
    mutedColor: string
    highlightTextColor: string
    highlightMutedColor: string
    accentColor: string
    accentTextColor: string
    lineColor: string
    toggleBackground: string
    toggleThumb: string
    toggleTextColor: string
    toggleActiveTextColor: string
    controlTextColor: string
    primaryBackground: string
    primaryText: string
    secondaryBackground: string
    secondaryText: string
    // Shape
    radius: number
    buttonRadius: number
    toggleRadius: number
    gap: number
    cardPadding: string
    border: boolean
    highlightBorderWidth: number
    shadow: boolean
    excludedStyle: "muted" | "strike"
    // Type
    nameFont: CSSProperties
    priceFont: CSSProperties
    bodyFont: CSSProperties
    buttonFont: CSSProperties
    style?: CSSProperties
}

// --- pure logic ---
function num(value: unknown, fallback = 0): number {
    const n = typeof value === "number" ? value : parseFloat(String(value ?? ""))
    return Number.isFinite(n) ? n : fallback
}

// Converted prices land on a clean ending; every option except Whole only rounds up
function roundPrice(value: number, rounding: Rounding): number {
    if (!Number.isFinite(value) || value <= 0) return 0
    // The tiny nudge settles half cents that binary floats store just below .5 (33.535 → 33.54)
    const v = Math.round(value * 100 + 1e-6) / 100
    if (rounding === "whole") return Math.round(v)
    if (rounding === "00") return Math.ceil(v - 1e-9)
    if (rounding === "99" || rounding === "90") {
        const end = rounding === "99" ? 0.99 : 0.9
        return Math.round((Math.ceil(v - end - 1e-9) + end) * 100) / 100
    }
    return v
}

function clampSeats(value: number, min: number, max: number, step: number): number {
    const lo = Math.max(1, Math.round(num(min, 1)))
    const hi = Math.max(lo, Math.round(num(max, lo)))
    const st = Math.max(1, Math.round(num(step, 1)))
    if (!Number.isFinite(value)) return lo
    const snapped = lo + Math.round((value - lo) / st) * st
    return Math.min(hi, Math.max(lo, snapped))
}

// Monthly amount in the base currency, before VAT: base price plus every seat beyond the included ones
function planNet(plan: Plan, billing: Billing, seats: number, useSeats: boolean): number {
    const base = num(billing === "yearly" ? plan.yearly : plan.monthly)
    if (!useSeats) return base
    const seat = num(billing === "yearly" ? plan.seatYearly : plan.seatMonthly)
    const extra = Math.max(0, Math.round(seats) - Math.max(0, Math.round(num(plan.includedSeats))))
    return base + seat * extra
}

// The biggest yearly saving among the priced plans, rounded down so the badge never promises more than it gives
function savingPercent(plans: Plan[], seats: number, useSeats: boolean): number {
    let best = 0
    for (const p of plans) {
        if ((p.customPrice || "").trim()) continue
        const m = planNet(p, "monthly", seats, useSeats)
        const y = planNet(p, "yearly", seats, useSeats)
        if (m > 0 && y > 0 && y < m) best = Math.max(best, Math.floor((1 - y / m) * 100 + 1e-6))
    }
    return best
}

// Exact locale first (en-GB), then a bare language (en), then the first currency
function pickCurrency(list: Currency[], locale: string): number {
    const loc = (locale || "").trim().toLowerCase().replace(/_/g, "-")
    if (!loc) return 0
    const lang = loc.split("-")[0]
    const tokens = list.map((c) =>
        (c.locales || "")
            .toLowerCase()
            .split(/[\s,;]+/)
            .filter(Boolean)
            .map((t) => t.replace(/_/g, "-"))
    )
    let i = tokens.findIndex((t) => t.includes(loc))
    if (i >= 0) return i
    i = tokens.findIndex((t) => t.includes(lang))
    return i >= 0 ? i : 0
}

function shownPrice(net: number, currency: Currency, vatRate: number, withVat: boolean): number {
    const converted = net * num(currency.rate, 1)
    const gross = withVat ? converted * (1 + Math.max(0, num(vatRate)) / 100) : converted
    return roundPrice(gross, currency.rounding)
}

function fractionDigits(value: number, code: string, decimals: Decimals): number {
    let max = 2
    try {
        max = new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits ?? 2
    } catch {
        max = 2
    }
    if (decimals === "never" || max === 0) return 0
    if (decimals === "always") return max
    return Math.abs(value - Math.round(value)) < 0.005 ? 0 : max
}

function formatMoney(value: number, code: string, locale: string, digits: number): string {
    try {
        return new Intl.NumberFormat(locale || "en", {
            style: "currency",
            currency: code,
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(value)
    } catch {
        return `${code} ${value.toFixed(digits)}`
    }
}

function currencySymbol(code: string, locale: string): string {
    try {
        const parts = new Intl.NumberFormat(locale || "en", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(0)
        const symbol = parts.find((p) => p.type === "currency")?.value || ""
        return symbol && symbol !== code ? symbol : ""
    } catch {
        return ""
    }
}

// One feature per line; a leading - marks a feature the plan does not include
function parseFeatures(text: string): { text: string; included: boolean }[] {
    return (text || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const excluded = /^[-–—]/.test(line)
            return { text: excluded ? line.replace(/^[-–—]+\s*/, "") : line, included: !excluded }
        })
        .filter((f) => f.text)
}

function fill(template: string, values: Record<string, string>): string {
    return (template || "").replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match))
}
// --- end pure logic ---

// Screen readers still get the text when it is hidden on screen
const visuallyHidden: CSSProperties = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }

function useCountUp(target: number, animate: boolean): number {
    const [shown, setShown] = useState(target)
    const current = useRef(target)
    useEffect(() => {
        if (!animate || typeof window === "undefined") {
            current.current = target
            setShown(target)
            return
        }
        const from = current.current
        if (from === target) return
        const start = window.performance.now()
        const duration = 520
        let frame = 0
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - t, 3)
            const value = from + (target - from) * eased
            current.current = value
            setShown(value)
            if (t < 1) frame = window.requestAnimationFrame(step)
        }
        frame = window.requestAnimationFrame(step)
        return () => window.cancelAnimationFrame(frame)
    }, [target, animate])
    return animate ? shown : target
}

function AnimatedPrice(props: { value: number; code: string; locale: string; digits: number; animate: boolean; style: CSSProperties }) {
    const shown = useCountUp(props.value, props.animate)
    return (
        <span aria-hidden="true" style={props.style}>
            {formatMoney(shown, props.code, props.locale, props.digits)}
        </span>
    )
}

const FALLBACK_CURRENCY: Currency = { code: "EUR", rate: 1, locales: "", rounding: "none" }

/**
 * Pricing Switch
 *
 * A pricing table for SaaS: monthly or yearly billing, the right currency for the site's language,
 * seats and VAT. Prices are calculated in the browser; nothing is stored or sent anywhere.
 *
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 640
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function PricingSwitch(props: Props) {
    const {
        plans = [],
        defaultBilling = "yearly",
        monthlyLabel,
        yearlyLabel,
        billingLabel,
        badgeMode = "auto",
        badgeText,
        perMonthLabel,
        monthlyNote,
        yearlyNote,
        currencies = [],
        currencySelector = true,
        currencyLabel,
        decimals = "auto",
        seats: useSeats = true,
        seatsInput = "stepper",
        seatsMin = 1,
        seatsMax = 50,
        seatsStep = 1,
        seatsDefault = 3,
        seatsLabel,
        seatsNote,
        seatsNoteOne,
        fewerLabel,
        moreLabel,
        vat = false,
        vatRate = 21,
        vatShown = "excl",
        vatSwitch = true,
        vatSwitchLabel,
        vatExclLabel,
        vatInclLabel,
        notIncludedLabel,
        layout = "cards",
        stackBelow = 760,
        controlsAlign = "center",
        animateNumbers = true,
        cardBackground,
        highlightBackground,
        highlightBorder,
        textColor,
        mutedColor,
        highlightTextColor,
        highlightMutedColor,
        accentColor,
        accentTextColor,
        lineColor,
        toggleBackground,
        toggleThumb,
        toggleTextColor,
        toggleActiveTextColor,
        controlTextColor = "#111111",
        primaryBackground,
        primaryText,
        secondaryBackground,
        secondaryText,
        radius = 16,
        buttonRadius = 10,
        toggleRadius = 999,
        gap = 16,
        cardPadding,
        border = true,
        highlightBorderWidth = 2,
        shadow = false,
        excludedStyle = "muted",
        nameFont,
        priceFont,
        bodyFont,
        buttonFont,
        style,
    } = props
    // Framer can hand a fresh instance "0px" instead of the default padding
    const pad = cardPadding && cardPadding !== "0px" ? cardPadding : "28px"

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const { activeLocale } = useLocaleInfo()
    const uid = useId()
    const scope = `ps-${uid.replace(/[^a-zA-Z0-9_-]/g, "")}`
    const rootRef = useRef<HTMLDivElement>(null)
    const radioRefs = useRef<(HTMLButtonElement | null)[]>([])

    const [docLang, setDocLang] = useState("")
    const [billing, setBilling] = useState<Billing>(defaultBilling === "monthly" ? "monthly" : "yearly")
    const [picked, setPicked] = useState<string | null>(null)
    const [seatCount, setSeatCount] = useState(seatsDefault)
    const [draft, setDraft] = useState<string | null>(null)
    const [withVat, setWithVat] = useState(vatShown === "incl")
    const [narrow, setNarrow] = useState(false)
    const [touched, setTouched] = useState(false)

    // Sites without Framer Localization still declare their language on <html>
    useEffect(() => {
        if (typeof document === "undefined") return
        const lang = document.documentElement.lang || ""
        if (lang) startTransition(() => setDocLang(lang))
    }, [])

    // Cards wrap into one column when the component is narrower than Stack below
    useEffect(() => {
        const el = rootRef.current
        if (!stackBelow || !el || typeof ResizeObserver === "undefined") {
            startTransition(() => setNarrow(false))
            return
        }
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? 0
            if (w) startTransition(() => setNarrow(w < stackBelow))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [stackBelow])

    const siteLocale = activeLocale?.code || docLang || ""
    const locale = siteLocale || "en"

    const list: Currency[] = (currencies || [])
        .filter((c) => c && /^[A-Za-z]{3}$/.test((c.code || "").trim()))
        .map((c) => ({ ...c, code: c.code.trim().toUpperCase() }))
    if (!list.length) list.push(FALLBACK_CURRENCY)
    const autoCurrency = list[pickCurrency(list, siteLocale)] || list[0]
    const currency = (!isStatic && picked && list.find((c) => c.code === picked)) || autoCurrency

    // The canvas always shows the defaults from the panel
    const activeBilling: Billing = isStatic ? (defaultBilling === "monthly" ? "monthly" : "yearly") : billing
    const activeWithVat = vat && (isStatic || !vatSwitch ? vatShown === "incl" : withVat)
    const lo = Math.max(1, Math.round(num(seatsMin, 1)))
    const hi = Math.max(lo, Math.round(num(seatsMax, lo)))
    const step = Math.max(1, Math.round(num(seatsStep, 1)))
    const seatValue = clampSeats(isStatic ? seatsDefault : seatCount, lo, hi, step)
    const animate = animateNumbers && !isStatic && !reduceMotion && touched

    const visiblePlans = (plans || []).slice(0, 4)
    const rows = visiblePlans.map((plan, i) => {
        const custom = (plan.customPrice || "").trim()
        const value = shownPrice(planNet(plan, activeBilling, seatValue, useSeats), currency, vatRate, activeWithVat)
        const digits = fractionDigits(value, currency.code, decimals)
        const total = Math.round(value * 12 * 100) / 100
        const parts: string[] = []
        if (!custom) {
            if (useSeats) parts.push(fill(seatValue === 1 ? seatsNoteOne : seatsNote, { seats: String(seatValue) }))
            parts.push(
                activeBilling === "yearly"
                    ? fill(yearlyNote, { total: formatMoney(total, currency.code, locale, fractionDigits(total, currency.code, decimals)) })
                    : monthlyNote
            )
            if (vat) parts.push(activeWithVat ? vatInclLabel : vatExclLabel)
        }
        return {
            plan,
            i,
            custom,
            value,
            digits,
            text: formatMoney(value, currency.code, locale, digits),
            note: parts.filter((p) => p && p.trim()).join(" · "),
            highlighted: !!plan.highlighted,
            features: parseFeatures(plan.features),
        }
    })

    const percent = savingPercent(visiblePlans, seatValue, useSeats)
    const badge = badgeMode === "none" ? "" : badgeMode === "custom" ? fill(badgeText, { percent: String(percent) }) : percent > 0 ? fill(badgeText, { percent: String(percent) }) : ""

    // One polite announcement per change, after the visitor has touched a control
    const summary = [
        activeBilling === "yearly" ? yearlyLabel : monthlyLabel,
        ...rows.map((r) => `${r.plan.name}: ${r.custom || `${r.text} ${perMonthLabel}`}`),
    ].join(". ")
    const announcement = touched && !isStatic ? summary : ""

    function chooseBilling(next: Billing) {
        setTouched(true)
        setBilling(next)
    }

    // Controlled inputs update synchronously: a transition here drops keystrokes
    function changeSeats(next: number) {
        setTouched(true)
        setDraft(null)
        setSeatCount(clampSeats(next, lo, hi, step))
    }

    function onSeatsType(text: string) {
        setTouched(true)
        setDraft(text)
        const n = parseInt(text, 10)
        if (Number.isFinite(n) && n >= lo && n <= hi) setSeatCount(n)
    }

    function onRadioKey(e: KeyboardEvent<HTMLDivElement>) {
        const index = activeBilling === "monthly" ? 0 : 1
        let next = -1
        if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? 1 : 0
        else if (e.key === "Home") next = 0
        else if (e.key === "End") next = 1
        if (next < 0) return
        e.preventDefault()
        chooseBilling(next === 0 ? "monthly" : "yearly")
        radioRefs.current[next]?.focus()
    }

    const shadowValue = "0px 1px 2px rgba(0, 0, 0, 0.05), 0px 16px 40px -16px rgba(0, 0, 0, 0.16)"
    const controlHeight = 44
    const smallText: CSSProperties = { ...bodyFont, fontSize: "13px", lineHeight: "1.4em" }

    const css = `
.${scope} [data-ps-focus]:focus-visible{outline:2px solid ${accentColor};outline-offset:2px}
.${scope} a[data-ps-btn]{transition:opacity .2s ease,transform .2s ease}
.${scope} a[data-ps-btn][href]:hover{opacity:.86}
.${scope} a[data-ps-btn][href]:active{transform:translateY(1px)}
.${scope} a[data-ps-btn]:focus-visible{outline:2px solid ${accentColor};outline-offset:3px}
.${scope} [data-ps-thumb]{transition:transform .32s cubic-bezier(.2,.7,.2,1),background-color .2s ease}
.${scope} [data-ps-step]:disabled{opacity:.35;cursor:default}
.${scope} input[type=range]{accent-color:${accentColor}}
@media (prefers-reduced-motion: reduce){.${scope} [data-ps-thumb],.${scope} a[data-ps-btn]{transition:none}}`

    // ── Controls bar ──
    const billingToggle = (
        <div
            role="radiogroup"
            aria-label={billingLabel}
            onKeyDown={onRadioKey}
            style={{
                position: "relative",
                display: "inline-grid",
                gridTemplateColumns: "1fr 1fr",
                padding: 4,
                borderRadius: toggleRadius,
                background: toggleBackground,
                boxSizing: "border-box",
            }}
        >
            <span
                aria-hidden="true"
                data-ps-thumb=""
                style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: "calc(50% - 4px)",
                    borderRadius: toggleRadius,
                    background: toggleThumb,
                    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
                    transform: activeBilling === "yearly" ? "translateX(100%)" : "none",
                }}
            />
            {(["monthly", "yearly"] as Billing[]).map((key, index) => {
                const checked = activeBilling === key
                return (
                    <button
                        key={key}
                        ref={(el) => {
                            radioRefs.current[index] = el
                        }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        data-ps-focus=""
                        onClick={() => chooseBilling(key)}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            minHeight: controlHeight - 8,
                            padding: "0 18px",
                            border: 0,
                            borderRadius: toggleRadius,
                            background: "transparent",
                            color: checked ? toggleActiveTextColor : toggleTextColor,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            ...bodyFont,
                        }}
                    >
                        {key === "monthly" ? monthlyLabel : yearlyLabel}
                        {key === "yearly" && badge && (
                            <span
                                style={{
                                    ...bodyFont,
                                    fontSize: "12px",
                                    lineHeight: "16px",
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    background: accentColor,
                                    color: accentTextColor,
                                }}
                            >
                                {badge}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )

    const stepButton = (label: string, symbol: string, delta: number, disabled: boolean) => (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            data-ps-step=""
            data-ps-focus=""
            onClick={() => changeSeats(seatValue + delta)}
            style={{
                width: controlHeight - 8,
                height: controlHeight - 8,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: 0,
                borderRadius: toggleRadius,
                background: toggleThumb,
                color: toggleActiveTextColor,
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
            }}
        >
            <span aria-hidden="true">{symbol}</span>
        </button>
    )

    const seatsControl = useSeats ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            <label htmlFor={`${uid}-seats`} style={{ ...bodyFont, color: mutedColor, whiteSpace: "nowrap" }}>
                {seatsLabel}
            </label>
            {seatsInput === "slider" ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minHeight: controlHeight }}>
                    <input
                        id={`${uid}-seats`}
                        type="range"
                        min={lo}
                        max={hi}
                        step={step}
                        value={seatValue}
                        aria-valuetext={fill(seatValue === 1 ? seatsNoteOne : seatsNote, { seats: String(seatValue) })}
                        onChange={(e) => changeSeats(Number(e.target.value))}
                        data-ps-focus=""
                        style={{ width: 160, margin: 0, cursor: "pointer" }}
                    />
                    <span aria-hidden="true" style={{ ...bodyFont, color: textColor, minWidth: `${String(hi).length}ch`, fontVariantNumeric: "tabular-nums" }}>
                        {seatValue}
                    </span>
                </span>
            ) : (
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: 4,
                        borderRadius: toggleRadius,
                        background: toggleBackground,
                        boxSizing: "border-box",
                    }}
                >
                    {stepButton(fewerLabel, "−", -step, seatValue <= lo)}
                    <input
                        id={`${uid}-seats`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        role="spinbutton"
                        aria-valuemin={lo}
                        aria-valuemax={hi}
                        aria-valuenow={seatValue}
                        value={draft ?? String(seatValue)}
                        onChange={(e) => onSeatsType(e.target.value)}
                        onBlur={() => changeSeats(parseInt(draft ?? String(seatValue), 10))}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                                e.preventDefault()
                                changeSeats(seatValue + step)
                            } else if (e.key === "ArrowDown") {
                                e.preventDefault()
                                changeSeats(seatValue - step)
                            } else if (e.key === "Enter") {
                                changeSeats(parseInt(draft ?? String(seatValue), 10))
                            }
                        }}
                        data-ps-focus=""
                        style={{
                            width: `${Math.max(2, String(hi).length) + 1.5}ch`,
                            height: controlHeight - 8,
                            padding: 0,
                            margin: 0,
                            border: 0,
                            borderRadius: 6,
                            background: "transparent",
                            color: controlTextColor,
                            textAlign: "center",
                            fontVariantNumeric: "tabular-nums",
                            ...bodyFont,
                        }}
                    />
                    {stepButton(moreLabel, "+", step, seatValue >= hi)}
                </span>
            )}
        </div>
    ) : null

    const currencyControl =
        currencySelector && list.length > 1 ? (
            <span style={{ position: "relative", display: "inline-flex" }}>
                <select
                    aria-label={currencyLabel}
                    value={currency.code}
                    onChange={(e) => {
                        setTouched(true)
                        setPicked(e.target.value)
                    }}
                    data-ps-focus=""
                    style={{
                        appearance: "none",
                        WebkitAppearance: "none",
                        height: controlHeight,
                        padding: "0 36px 0 16px",
                        margin: 0,
                        border: 0,
                        borderRadius: toggleRadius,
                        background: toggleBackground,
                        color: controlTextColor,
                        cursor: "pointer",
                        ...bodyFont,
                    }}
                >
                    {list.map((c) => {
                        const symbol = currencySymbol(c.code, locale)
                        return (
                            <option key={c.code} value={c.code} style={{ color: "#111111" }}>
                                {symbol ? `${c.code} · ${symbol}` : c.code}
                            </option>
                        )
                    })}
                </select>
                <svg
                    aria-hidden="true"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    style={{ position: "absolute", right: 14, top: "50%", marginTop: -6, pointerEvents: "none" }}
                >
                    <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke={controlTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        ) : null

    const vatControl =
        vat && vatSwitch ? (
            <button
                type="button"
                role="switch"
                aria-checked={activeWithVat}
                data-ps-focus=""
                onClick={() => {
                    setTouched(true)
                    setWithVat(!activeWithVat)
                }}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    minHeight: controlHeight,
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    color: textColor,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    ...bodyFont,
                }}
            >
                <span
                    aria-hidden="true"
                    style={{ position: "relative", width: 38, height: 22, borderRadius: 999, background: activeWithVat ? accentColor : toggleBackground, transition: "background-color .2s ease", flexShrink: 0 }}
                >
                    <span
                        data-ps-thumb=""
                        style={{
                            position: "absolute",
                            top: 3,
                            left: 3,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: activeWithVat ? accentTextColor : toggleThumb,
                            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
                            transform: activeWithVat ? "translateX(16px)" : "none",
                        }}
                    />
                </span>
                {vatSwitchLabel}
            </button>
        ) : null

    const controls = (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: controlsAlign === "left" ? "flex-start" : "center",
                gap: "12px 20px",
            }}
        >
            {billingToggle}
            {seatsControl}
            {currencyControl}
            {vatControl}
        </div>
    )

    // ── Plans ──
    const ring = (on: boolean) => (on && highlightBorderWidth > 1 ? `inset 0 0 0 ${highlightBorderWidth - 1}px ${highlightBorder}` : "")
    const shadows = (on: boolean) => [ring(on), shadow ? shadowValue : ""].filter(Boolean).join(", ") || "none"

    // On a highlighted card painted in the accent colour, badges and checkmarks switch to its text colour so they stay visible
    const accentOn = (hl: boolean) => (hl && accentColor === highlightBackground ? { bg: highlightTextColor, fg: highlightBackground } : { bg: accentColor, fg: accentTextColor })

    const pill = (label: string, hl: boolean) => (
        <span
            style={{
                ...bodyFont,
                fontSize: "12px",
                lineHeight: "16px",
                padding: "4px 10px",
                borderRadius: 999,
                background: accentOn(hl).bg,
                color: accentOn(hl).fg,
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </span>
    )

    const priceBlock = (r: (typeof rows)[number], muted: string) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            {r.custom ? (
                <span style={{ ...priceFont, margin: 0 }}>{r.custom}</span>
            ) : (
                <span style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "2px 6px" }}>
                    <AnimatedPrice
                        value={r.value}
                        code={currency.code}
                        locale={locale}
                        digits={r.digits}
                        animate={animate}
                        style={{ ...priceFont, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
                    />
                    <span aria-hidden="true" style={{ ...bodyFont, color: muted }}>
                        {perMonthLabel}
                    </span>
                    <span style={visuallyHidden}>{`${r.text} ${perMonthLabel}`}</span>
                </span>
            )}
            {r.note ? <span style={{ ...smallText, color: muted }}>{r.note}</span> : <span aria-hidden="true" style={{ ...smallText }}>{" "}</span>}
        </div>
    )

    const cta = (r: (typeof rows)[number]) => {
        const link = (r.plan.ctaLink || "").trim()
        const style: CSSProperties = {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            padding: "0 20px",
            borderRadius: buttonRadius,
            background: r.highlighted ? primaryBackground : secondaryBackground,
            color: r.highlighted ? primaryText : secondaryText,
            textDecoration: "none",
            textAlign: "center",
            boxSizing: "border-box",
            ...buttonFont,
        }
        // Without a link there is nothing to do, so it isn't presented as a link: same look, plain text
        if (!link) return <span style={{ ...style, cursor: "default" }}>{r.plan.ctaLabel}</span>
        return (
            <a
                href={link}
                target={r.plan.newTab ? "_blank" : undefined}
                rel={r.plan.newTab ? "noopener" : undefined}
                data-ps-btn=""
                style={{ ...style, cursor: "pointer" }}
            >
                {r.plan.ctaLabel}
            </a>
        )
    }

    const hasDescription = rows.some((r) => (r.plan.description || "").trim())
    const hasFeatures = rows.some((r) => r.features.length > 0)
    const rowCount = 3 + (hasDescription ? 1 : 0) + (hasFeatures ? 1 : 0)

    const cards = (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: narrow ? "minmax(0, 1fr)" : `repeat(${Math.max(1, rows.length)}, minmax(0, 1fr))`,
                columnGap: gap,
                rowGap: gap,
                alignItems: "stretch",
            }}
        >
            {rows.map((r) => {
                const hl = r.highlighted
                const ink = hl ? highlightTextColor : textColor
                const muted = hl ? highlightMutedColor : mutedColor
                return (
                    <article
                        key={r.i}
                        aria-labelledby={`${uid}-plan-${r.i}`}
                        style={{
                            gridRow: `span ${rowCount}`,
                            display: "grid",
                            gridTemplateRows: "subgrid",
                            rowGap: 20,
                            alignContent: "start",
                            minWidth: 0,
                            padding: pad,
                            borderRadius: radius,
                            background: hl ? highlightBackground : cardBackground,
                            color: ink,
                            border: `1px solid ${hl ? highlightBorder : border ? lineColor : "transparent"}`,
                            boxShadow: shadows(hl),
                            boxSizing: "border-box",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, minWidth: 0 }}>
                            <h3 id={`${uid}-plan-${r.i}`} style={{ margin: 0, ...nameFont }}>
                                {r.plan.name}
                            </h3>
                            {hl && r.plan.highlightLabel ? pill(r.plan.highlightLabel, hl) : null}
                        </div>
                        {hasDescription && <p style={{ margin: 0, ...bodyFont, color: muted }}>{r.plan.description}</p>}
                        {priceBlock(r, muted)}
                        {cta(r)}
                        {hasFeatures && (
                            <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                                {r.features.map((f, k) => (
                                    <li
                                        key={k}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 10,
                                            ...bodyFont,
                                            color: f.included ? ink : muted,
                                            textDecoration: !f.included && excludedStyle === "strike" ? "line-through" : "none",
                                        }}
                                    >
                                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: "0.2em" }}>
                                            {f.included ? (
                                                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke={accentOn(hl).bg} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                            ) : (
                                                <path d="M5 5 11 11M11 5 5 11" fill="none" stroke={muted} strokeWidth="1.5" strokeLinecap="round" />
                                            )}
                                        </svg>
                                        <span>
                                            {!f.included && <span style={visuallyHidden}>{`${notIncludedLabel}: `}</span>}
                                            {f.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                )
            })}
        </div>
    )

    const compact = (
        <div
            role="list"
            style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: radius,
                background: cardBackground,
                border: `1px solid ${border ? lineColor : "transparent"}`,
                boxShadow: shadow ? shadowValue : "none",
                overflow: "hidden",
            }}
        >
            {rows.map((r, index) => {
                const hl = r.highlighted
                const ink = hl ? highlightTextColor : textColor
                const muted = hl ? highlightMutedColor : mutedColor
                return (
                    <div
                        key={r.i}
                        role="listitem"
                        style={{
                            display: "grid",
                            gridTemplateColumns: narrow ? "minmax(0, 1fr)" : "minmax(0, 1.4fr) minmax(0, 1fr) minmax(160px, auto)",
                            alignItems: "center",
                            gap: narrow ? 16 : 24,
                            padding: pad,
                            background: hl ? highlightBackground : "transparent",
                            color: ink,
                            borderTop: index > 0 ? `1px solid ${lineColor}` : "none",
                            boxShadow: hl ? `inset 0 0 0 ${highlightBorderWidth}px ${highlightBorder}` : "none",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                                <h3 style={{ margin: 0, ...nameFont }}>{r.plan.name}</h3>
                                {hl && r.plan.highlightLabel ? pill(r.plan.highlightLabel, hl) : null}
                            </div>
                            {(r.plan.description || "").trim() && <p style={{ margin: 0, ...bodyFont, color: muted }}>{r.plan.description}</p>}
                        </div>
                        {priceBlock(r, muted)}
                        {cta(r)}
                    </div>
                )
            })}
        </div>
    )

    return (
        <div
            ref={rootRef}
            className={scope}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: Math.max(24, gap * 2),
                color: textColor,
                boxSizing: "border-box",
            }}
        >
            <style>{css}</style>
            {controls}
            {rows.length ? (
                layout === "compact" ? compact : cards
            ) : (
                <div style={{ ...bodyFont, color: mutedColor, padding: 24, border: `1px dashed ${lineColor}`, borderRadius: radius, textAlign: "center" }}>Add a plan in the Plans list.</div>
            )}
            <div aria-live="polite" aria-atomic="true" style={visuallyHidden}>
                {announcement}
            </div>
        </div>
    )
}

PricingSwitch.displayName = "Pricing Switch"

const ROUNDING_OPTIONS: Rounding[] = ["none", "whole", "99", "90", "00"]
const ROUNDING_TITLES = ["None · exact", "Whole number", "Ends in .99", "Ends in .90", "Up to .00"]

addPropertyControls(PricingSwitch, {
    plans: {
        type: ControlType.Array,
        title: "Plans",
        maxCount: 4,
        description: "Two to four plans. Prices are per month, in the first currency, without VAT. Full documentation: miguelrecio-components.framer.website/pricing-switch/docs",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Plan" },
                description: { type: ControlType.String, title: "Description", defaultValue: "", displayTextArea: true },
                highlighted: { type: ControlType.Boolean, title: "Highlight", defaultValue: false },
                highlightLabel: { type: ControlType.String, title: "Highlight label", defaultValue: "Most popular", hidden: (p: any) => !p.highlighted },
                monthly: { type: ControlType.Number, title: "Monthly", defaultValue: 19, min: 0, max: 100000, step: 1, description: "Price per month, billed monthly." },
                yearly: { type: ControlType.Number, title: "Yearly", defaultValue: 15, min: 0, max: 100000, step: 1, description: "Price per month, billed yearly." },
                seatMonthly: { type: ControlType.Number, title: "Seat · monthly", defaultValue: 0, min: 0, max: 10000, step: 0.5, description: "Each extra seat per month, billed monthly. Used when Seats is on." },
                seatYearly: { type: ControlType.Number, title: "Seat · yearly", defaultValue: 0, min: 0, max: 10000, step: 0.5, description: "Each extra seat per month, billed yearly." },
                includedSeats: { type: ControlType.Number, title: "Seats included", defaultValue: 1, min: 0, max: 1000, step: 1, displayStepper: true },
                customPrice: {
                    type: ControlType.String,
                    title: "Custom price",
                    defaultValue: "",
                    placeholder: "Let’s talk",
                    description: "Fill it for a Contact us plan: this text replaces the price.",
                },
                features: {
                    type: ControlType.String,
                    title: "Features",
                    defaultValue: "First feature\nSecond feature\n-Not in this plan",
                    displayTextArea: true,
                    description: "One per line. Start a line with - to show it as not included.",
                },
                ctaLabel: { type: ControlType.String, title: "Button", defaultValue: "Get started" },
                ctaLink: { type: ControlType.Link, title: "Link" },
                newTab: { type: ControlType.Boolean, title: "New tab", defaultValue: false },
            },
        },
        defaultValue: [
            {
                name: "Starter",
                description: "For freelancers and solo founders.",
                highlighted: false,
                highlightLabel: "Most popular",
                monthly: 15,
                yearly: 12,
                seatMonthly: 15,
                seatYearly: 12,
                includedSeats: 1,
                customPrice: "",
                features: "1 workspace\nUnlimited projects\nClient portal\nEmail support\n-Custom domain\n-SSO and audit log",
                ctaLabel: "Start free trial",
                ctaLink: "",
                newTab: false,
            },
            {
                name: "Team",
                description: "For small teams shipping every week.",
                highlighted: true,
                highlightLabel: "Most popular",
                monthly: 49,
                yearly: 39,
                seatMonthly: 9,
                seatYearly: 7,
                includedSeats: 5,
                customPrice: "",
                features: "Everything in Starter\nUp to 10 workspaces\nCustom domain\nRoles and permissions\nPriority support\n-SSO and audit log",
                ctaLabel: "Start free trial",
                ctaLink: "",
                newTab: false,
            },
            {
                name: "Business",
                description: "For companies with a security review.",
                highlighted: false,
                highlightLabel: "Most popular",
                monthly: 119,
                yearly: 95,
                seatMonthly: 8,
                seatYearly: 6,
                includedSeats: 15,
                customPrice: "",
                features: "Everything in Team\nUnlimited workspaces\nSSO and audit log\nData hosted in the EU\nDedicated success manager",
                ctaLabel: "Talk to sales",
                ctaLink: "",
                newTab: false,
            },
        ],
    },

    // Billing
    defaultBilling: {
        type: ControlType.Enum,
        title: "Billing",
        options: ["monthly", "yearly"],
        optionTitles: ["Monthly", "Yearly"],
        defaultValue: "yearly",
        displaySegmentedControl: true,
        description: "Selected when the page loads.",
    },
    monthlyLabel: { type: ControlType.String, title: "Monthly label", defaultValue: "Monthly" },
    yearlyLabel: { type: ControlType.String, title: "Yearly label", defaultValue: "Yearly" },
    billingLabel: { type: ControlType.String, title: "Toggle name", defaultValue: "Billing period", description: "Read by screen readers only." },
    badgeMode: {
        type: ControlType.Enum,
        title: "Badge",
        options: ["auto", "custom", "none"],
        optionTitles: ["Auto", "Custom", "None"],
        defaultValue: "auto",
        displaySegmentedControl: true,
        description: "Auto works out the biggest yearly saving from your prices and hides the badge when there is none.",
    },
    badgeText: { type: ControlType.String, title: "Badge text", defaultValue: "Save {percent}%", hidden: (p) => p.badgeMode === "none" },
    perMonthLabel: { type: ControlType.String, title: "Per month", defaultValue: "/month" },
    monthlyNote: { type: ControlType.String, title: "Monthly note", defaultValue: "Billed monthly" },
    yearlyNote: { type: ControlType.String, title: "Yearly note", defaultValue: "{total} billed yearly", description: "{total} is the yearly amount." },

    // Currency
    currencies: {
        type: ControlType.Array,
        title: "Currencies",
        description: "The first one is your base currency (rate 1): plan prices are in it. Each visitor gets the currency whose Locales match the site’s language.",
        control: {
            type: ControlType.Object,
            controls: {
                code: { type: ControlType.String, title: "Code", defaultValue: "EUR", placeholder: "EUR", preventLocalization: true },
                rate: { type: ControlType.Number, title: "Rate", defaultValue: 1, min: 0.0001, max: 100000, step: 0.01, description: "How many of this currency make one of the base currency." },
                locales: {
                    type: ControlType.String,
                    title: "Locales",
                    defaultValue: "",
                    placeholder: "es, fr, de or en-GB",
                    preventLocalization: true,
                    description: "Languages (es) or language-region codes (en-GB), separated by commas.",
                },
                rounding: {
                    type: ControlType.Enum,
                    title: "Rounding",
                    options: ROUNDING_OPTIONS,
                    optionTitles: ROUNDING_TITLES,
                    defaultValue: "none",
                },
            },
        },
        defaultValue: [
            { code: "EUR", rate: 1, locales: "es, fr, de, it, pt, nl, fi, el, en-IE", rounding: "none" },
            { code: "GBP", rate: 0.86, locales: "en-GB", rounding: "whole" },
            { code: "USD", rate: 1.17, locales: "en, en-US", rounding: "whole" },
        ],
    },
    currencySelector: { type: ControlType.Boolean, title: "Selector", defaultValue: true, description: "Lets visitors change the currency." },
    currencyLabel: { type: ControlType.String, title: "Selector name", defaultValue: "Currency", hidden: (p) => !p.currencySelector },
    decimals: {
        type: ControlType.Enum,
        title: "Decimals",
        options: ["auto", "always", "never"],
        optionTitles: ["Only when needed", "Always", "Never"],
        defaultValue: "auto",
    },

    // Seats
    seats: { type: ControlType.Boolean, title: "Seats", defaultValue: true, description: "Prices grow with the team size: base price plus each seat beyond the included ones." },
    seatsInput: {
        type: ControlType.Enum,
        title: "Seats input",
        options: ["stepper", "slider"],
        optionTitles: ["Stepper", "Slider"],
        defaultValue: "stepper",
        displaySegmentedControl: true,
        hidden: (p) => !p.seats,
    },
    seatsMin: { type: ControlType.Number, title: "Min seats", defaultValue: 1, min: 1, max: 1000, step: 1, displayStepper: true, hidden: (p) => !p.seats },
    seatsMax: { type: ControlType.Number, title: "Max seats", defaultValue: 50, min: 1, max: 10000, step: 1, displayStepper: true, hidden: (p) => !p.seats },
    seatsStep: { type: ControlType.Number, title: "Step", defaultValue: 1, min: 1, max: 100, step: 1, displayStepper: true, hidden: (p) => !p.seats },
    seatsDefault: { type: ControlType.Number, title: "Start at", defaultValue: 3, min: 1, max: 10000, step: 1, displayStepper: true, hidden: (p) => !p.seats },
    seatsLabel: { type: ControlType.String, title: "Seats label", defaultValue: "Seats", hidden: (p) => !p.seats },
    seatsNote: { type: ControlType.String, title: "Seats note", defaultValue: "{seats} seats", hidden: (p) => !p.seats },
    seatsNoteOne: { type: ControlType.String, title: "One seat note", defaultValue: "1 seat", hidden: (p) => !p.seats },
    fewerLabel: { type: ControlType.String, title: "Minus name", defaultValue: "Fewer seats", hidden: (p) => !p.seats || p.seatsInput === "slider" },
    moreLabel: { type: ControlType.String, title: "Plus name", defaultValue: "More seats", hidden: (p) => !p.seats || p.seatsInput === "slider" },

    // VAT
    vat: { type: ControlType.Boolean, title: "VAT", defaultValue: false, description: "Enter plan prices without VAT. The component adds it when prices are shown with VAT." },
    vatRate: { type: ControlType.Number, title: "VAT rate", defaultValue: 21, min: 0, max: 50, step: 0.5, unit: "%", hidden: (p) => !p.vat },
    vatShown: {
        type: ControlType.Enum,
        title: "Show prices",
        options: ["excl", "incl"],
        optionTitles: ["+ VAT", "With VAT"],
        defaultValue: "excl",
        displaySegmentedControl: true,
        hidden: (p) => !p.vat,
    },
    vatSwitch: { type: ControlType.Boolean, title: "VAT switch", defaultValue: true, description: "Lets visitors include or leave out VAT.", hidden: (p) => !p.vat },
    vatSwitchLabel: { type: ControlType.String, title: "Switch label", defaultValue: "Prices include VAT", hidden: (p) => !p.vat || !p.vatSwitch },
    vatExclLabel: { type: ControlType.String, title: "Without VAT", defaultValue: "excl. VAT", hidden: (p) => !p.vat },
    vatInclLabel: { type: ControlType.String, title: "With VAT", defaultValue: "incl. VAT", hidden: (p) => !p.vat },
    notIncludedLabel: { type: ControlType.String, title: "Not included label", defaultValue: "Not included", description: "Read by screen readers before a crossed-out feature." },

    // Layout
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["cards", "compact"],
        optionTitles: ["Cards", "Compact list"],
        defaultValue: "cards",
        displaySegmentedControl: true,
        description: "Compact: one row per plan, without features.",
    },
    stackBelow: {
        type: ControlType.Number,
        title: "Stack below",
        defaultValue: 760,
        min: 0,
        max: 1600,
        step: 10,
        unit: "px",
        description: "Narrower than this, the plans stack in one column. 0 keeps them side by side.",
    },
    controlsAlign: {
        type: ControlType.Enum,
        title: "Controls",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    animateNumbers: { type: ControlType.Boolean, title: "Count up", defaultValue: true, description: "Prices roll to the new amount. Off for visitors who prefer reduced motion." },

    // Colours
    cardBackground: { type: ControlType.Color, title: "Card", defaultValue: "#FFFFFF" },
    highlightBackground: { type: ControlType.Color, title: "Highlight card", defaultValue: "#FFFFFF" },
    highlightBorder: { type: ControlType.Color, title: "Highlight border", defaultValue: "#111111" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111111" },
    mutedColor: { type: ControlType.Color, title: "Muted text", defaultValue: "#6B6B6B" },
    highlightTextColor: { type: ControlType.Color, title: "Highlight text", defaultValue: "#111111" },
    highlightMutedColor: { type: ControlType.Color, title: "Highlight muted", defaultValue: "#6B6B6B" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#111111", description: "Badges, checkmarks, focus ring and the VAT switch." },
    accentTextColor: { type: ControlType.Color, title: "On accent", defaultValue: "#FFFFFF" },
    lineColor: { type: ControlType.Color, title: "Lines", defaultValue: "#E6E6E6" },
    toggleBackground: { type: ControlType.Color, title: "Toggle", defaultValue: "#F2F2F2" },
    toggleThumb: { type: ControlType.Color, title: "Toggle thumb", defaultValue: "#FFFFFF" },
    toggleTextColor: { type: ControlType.Color, title: "Toggle text", defaultValue: "#6B6B6B" },
    toggleActiveTextColor: { type: ControlType.Color, title: "Toggle active", defaultValue: "#111111" },
    controlTextColor: {
        type: ControlType.Color,
        title: "Controls text",
        defaultValue: "#111111",
        description: "The seats number and the currency selector, on the Toggle colour.",
    },
    primaryBackground: { type: ControlType.Color, title: "Primary button", defaultValue: "#111111", description: "The highlighted plan’s button." },
    primaryText: { type: ControlType.Color, title: "Primary text", defaultValue: "#FFFFFF" },
    secondaryBackground: { type: ControlType.Color, title: "Secondary button", defaultValue: "#F2F2F2", description: "Every other plan’s button." },
    secondaryText: { type: ControlType.Color, title: "Secondary text", defaultValue: "#111111" },

    // Shape
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 48, step: 1, unit: "px" },
    buttonRadius: { type: ControlType.Number, title: "Button radius", defaultValue: 10, min: 0, max: 40, step: 1, unit: "px" },
    toggleRadius: { type: ControlType.Number, title: "Toggle radius", defaultValue: 999, min: 0, max: 999, step: 1, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 16, min: 0, max: 64, step: 1, unit: "px" },
    cardPadding: { type: ControlType.Padding, title: "Card padding", defaultValue: "28px" },
    border: { type: ControlType.Boolean, title: "Border", defaultValue: true },
    highlightBorderWidth: { type: ControlType.Number, title: "Highlight width", defaultValue: 2, min: 1, max: 4, step: 1, unit: "px" },
    shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: false },
    excludedStyle: {
        type: ControlType.Enum,
        title: "Not included style",
        options: ["muted", "strike"],
        optionTitles: ["Muted", "Crossed out"],
        defaultValue: "muted",
        displaySegmentedControl: true,
    },

    // Type
    nameFont: {
        type: ControlType.Font,
        title: "Plan name font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "18px", variant: "Semibold", letterSpacing: "-0.01em", lineHeight: "1.3em" },
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "40px", variant: "Semibold", letterSpacing: "-0.03em", lineHeight: "1.1em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Regular", letterSpacing: "0em", lineHeight: "1.5em" },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Semibold", letterSpacing: "0em", lineHeight: "1em" },
    },
})
