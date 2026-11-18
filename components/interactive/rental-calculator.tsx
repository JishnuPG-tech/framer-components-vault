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


/* @framerSupportedLayoutWidth any */
/* @framerSupportedLayoutHeight any */

type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "BAM"

type Value = number | null

type Toggles = {
    showSliders: boolean
    showAdvancedInputs: boolean
    showExit: boolean
    showDisclaimer: boolean
    requireInteraction: boolean
    requireAllVisible: boolean
    allowFreeStepNavigation: boolean
}

type TextConfig = {
    title: string
    subtitle: string
    step1: string
    step2: string
    step3: string
    step4: string
    back: string
    next: string
    viewResults: string
    submit: string
    restart: string
    requiredHint: string
    leadTitle: string
    leadSubtitle: string
    nameLabel: string
    emailLabel: string
    successTitle: string
    successBody: string
    errorMissingDelivery: string
    errorSubmitFailed: string
    disclaimer: string
    // Field labels
    purchasePriceLabel: string
    downPaymentLabel: string
    interestRateLabel: string
    loanTermLabel: string
    monthlyRentLabel: string
    vacancyLabel: string
    annualTaxesLabel: string
    annualInsuranceLabel: string
    maintenanceLabel: string
    managementLabel: string
    closingCostsLabel: string
    rehabLabel: string
    hoaLabel: string
    utilitiesLabel: string
    otherExpensesLabel: string
    pmiLabel: string
    holdPeriodLabel: string
    appreciationLabel: string
    sellingCostsLabel: string
}

type Colors = {
    accent: string
    background: string
    card: string
    border: string
    text: string
    subtext: string
    fieldBg: string
    soft: string
    divider: string
    danger: string
}

type StyleConfig = {
    maxWidth: number
    radius: number
    padding: number
    compactness: number
    borderWidth: number
    shadowStrength: number
}

type Defaults = {
    startBlank: boolean

    purchasePrice: number | null
    downPaymentPct: number | null
    interestRatePct: number | null
    loanTermYears: number | null

    monthlyRent: number | null
    vacancyPct: number | null

    annualTaxes: number | null
    annualInsurance: number | null
    monthlyMaintenance: number | null
    managementPct: number | null

    closingCosts: number | null
    rehabCosts: number | null
    monthlyHOA: number | null
    monthlyUtilities: number | null
    monthlyOtherExpenses: number | null
    monthlyPMI: number | null

    holdYears: number | null
    appreciationPct: number | null
    sellingCostsPct: number | null
}

type FormulaConfig = {
    vacancyAppliesTo: "rentOnly" | "allIncome"
    managementAppliesTo: "effectiveIncome" | "grossIncome"
    debtServiceIncludesPMI: boolean
    cashInvestedIncludesClosing: boolean
    cashInvestedIncludesRehab: boolean
    capRateDenominator: "purchasePrice" | "cashInvested"
    breakEvenUsesEffectiveIncome: boolean
    appreciationMode: "compound" | "simple"
}

type DeliveryConfig = {
    mode: "webhook" | "mailto" | "none"
    webhookUrl: string
    notifyEmail: string
    includeInputs: boolean
    includeResults: boolean
    mailSubject: string
}

export type RealEstateRoiMultiStepProps = {
    currency: Currency
    toggles: Toggles
    text: TextConfig
    colors: Colors
    styleConfig: StyleConfig & { maxHeight: number }
    defaults: Defaults
    formulas: FormulaConfig
    delivery: DeliveryConfig
    style?: React.CSSProperties
}

function clamp(n: number, a: number, b: number) {
    return Math.min(b, Math.max(a, n))
}

function isNum(v: any): v is number {
    return typeof v === "number" && Number.isFinite(v)
}

function fmtMoneyFactory(currency: Currency) {
    return (value: number) => {
        const v = Number.isFinite(value) ? value : 0
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
            }).format(v)
        } catch {
            const sign = v < 0 ? "-" : ""
            const abs = Math.abs(v)
            return `${sign}${currency} ${Math.round(abs).toLocaleString()}`
        }
    }
}

function fmtPct01(v01: number) {
    const v = Number.isFinite(v01) ? v01 : 0
    return `${Math.round(v * 1000) / 10}%`
}

function fmtPct100(v100: number) {
    const v = Number.isFinite(v100) ? v100 : 0
    return `${Math.round(v * 10) / 10}%`
}

function fmtX(v: number) {
    const x = Number.isFinite(v) ? v : 0
    return `${Math.round(x * 100) / 100}x`
}

function mortgagePayment(
    principal: number,
    annualRatePct: number,
    termYears: number
) {
    const P = Math.max(0, principal)
    const r = Math.max(0, annualRatePct) / 100 / 12
    const n = Math.max(1, Math.round(Math.max(0, termYears) * 12))
    if (P === 0) return 0
    if (r === 0) return P / n
    const pow = Math.pow(1 + r, n)
    return (P * r * pow) / (pow - 1)
}

function loanBalance(
    principal: number,
    annualRatePct: number,
    termYears: number,
    yearsElapsed: number
) {
    const P = Math.max(0, principal)
    const r = Math.max(0, annualRatePct) / 100 / 12
    const n = Math.max(1, Math.round(Math.max(0, termYears) * 12))
    const k = clamp(Math.round(Math.max(0, yearsElapsed) * 12), 0, n)

    if (P === 0) return 0
    if (r === 0) return P * (1 - k / n)

    const pmt = mortgagePayment(P, annualRatePct, termYears)
    const pow = Math.pow(1 + r, k)
    return P * pow - pmt * ((pow - 1) / r)
}

function emailLooksValid(email: string) {
    const e = (email || "").trim()
    if (!e) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

function safeUrl(url: string) {
    try {
        const u = new URL(url)
        return u.toString()
    } catch {
        return ""
    }
}

function useContainerSize() {
    const ref = React.useRef<HTMLDivElement | null>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })

    React.useEffect(() => {
        if (!ref.current) return
        const el = ref.current
        const ro = new ResizeObserver((entries) => {
            const cr = entries[0]?.contentRect
            if (!cr) return
            setSize({ w: cr.width, h: cr.height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return { ref, ...size }
}

function StepTabs(props: {
    steps: string[]
    active: number
    maxAllowed: number
    onGo: (i: number) => void
    isNarrow: boolean
    c: Colors
    bw: number
    allowFree: boolean
}) {
    return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {props.steps.map((s, i) => {
                const on = i === props.active
                const enabled = props.allowFree || i <= props.maxAllowed
                return (
                    <button
                        key={`${s}-${i}`}
                        onClick={() => enabled && props.onGo(i)}
                        style={{
                            height: props.isNarrow ? 30 : 32,
                            padding: props.isNarrow ? "0 10px" : "0 12px",
                            borderRadius: 999,
                            border: `${props.bw}px solid ${props.c.border}`,
                            background: on ? props.c.accent : props.c.soft,
                            color: on ? "rgba(255,255,255,0.95)" : props.c.text,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: enabled ? "pointer" : "not-allowed",
                            letterSpacing: 0.1,
                            opacity: enabled ? 1 : 0.45,
                            transition: "opacity 160ms ease",
                        }}
                    >
                        {s}
                    </button>
                )
            })}
        </div>
    )
}

function FieldRow(props: {
    label: string
    suffix?: string
    value: Value
    touched: boolean
    onChange: (v: Value) => void
    onTouched: () => void
    min: number
    max: number
    step: number
    showSlider: boolean
    compact: number
    c: Colors
    bw: number
    radius: number
    requireInteraction?: boolean
}) {
    const h = props.compact <= 0.35 ? 34 : props.compact <= 0.7 ? 36 : 38
    const r = Math.max(10, props.radius - 8)

    // Track raw input value separately to allow typing intermediate values
    const [rawValue, setRawValue] = React.useState<string>(() =>
        props.value === null ? "" : String(props.value)
    )
    const [isFocused, setIsFocused] = React.useState(false)

    // Sync raw value with prop value when not focused
    React.useEffect(() => {
        if (!isFocused) {
            setRawValue(props.value === null ? "" : String(props.value))
        }
    }, [props.value, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value
        setRawValue(inputVal)
        props.onTouched()

        // Allow empty value
        if (!inputVal.trim()) {
            props.onChange(null)
            return
        }

        // Parse number but don't clamp yet while typing
        const num = Number(inputVal)
        if (!Number.isFinite(num)) {
            props.onChange(null)
            return
        }

        // Store the raw number value temporarily while typing
        // Allow values outside min/max temporarily while typing
        props.onChange(num)
    }

    const handleBlur = () => {
        setIsFocused(false)
        // Clamp on blur
        if (props.value !== null) {
            const clamped = clamp(props.value, props.min, props.max)
            if (clamped !== props.value) {
                props.onChange(clamped)
            }
        }
    }

    const handleFocus = () => {
        setIsFocused(true)
        // Select all text on focus for easier editing
        setRawValue(props.value === null ? "" : String(props.value))
    }

    const handleSliderChange = (num: number) => {
        props.onTouched()
        const clamped = clamp(num, props.min, props.max)
        props.onChange(clamped)
    }

    const displayVal = isFocused
        ? rawValue
        : props.value === null
          ? ""
          : String(props.value)

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <div
                    style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: props.c.text,
                        letterSpacing: 0.1,
                    }}
                >
                    {props.label}
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        height: h,
                        padding: "0 10px",
                        borderRadius: r,
                        border: `${props.bw}px solid ${props.c.border}`,
                        background: props.c.fieldBg,
                        minWidth: 154,
                        justifyContent: "space-between",
                    }}
                >
                    <input
                        type="number"
                        value={displayVal}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        style={{
                            width: 102,
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: props.c.text,
                        }}
                    />
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: props.c.subtext,
                        }}
                    >
                        {props.suffix || ""}
                    </div>
                </div>
            </div>

            {props.showSlider ? (
                <div
                    style={{
                        padding: "8px 10px",
                        borderRadius: r,
                        border: `${props.bw}px solid ${props.c.border}`,
                        background: props.c.soft,
                    }}
                >
                    <input
                        type="range"
                        min={props.min}
                        max={props.max}
                        step={props.step}
                        value={
                            props.value === null
                                ? props.min
                                : clamp(props.value, props.min, props.max)
                        }
                        onChange={(e) =>
                            handleSliderChange(Number(e.target.value))
                        }
                        style={{
                            width: "100%",
                            accentColor: props.c.accent,
                        }}
                    />
                </div>
            ) : null}
        </div>
    )
}

function Metric(props: {
    label: string
    value: string
    hint?: string
    danger?: boolean
    accent?: boolean
    compact: number
    c: Colors
    bw: number
    radius: number
}) {
    const pad = props.compact <= 0.35 ? 10 : props.compact <= 0.7 ? 11 : 12
    const vSize = props.compact <= 0.35 ? 16 : props.compact <= 0.7 ? 17 : 18
    const r = Math.max(12, props.radius - 6)
    const bg = props.accent ? `${props.c.accent}10` : props.c.soft

    return (
        <div
            style={{
                borderRadius: r,
                border: `${props.bw}px solid ${props.c.border}`,
                background: bg,
                padding: pad,
                display: "flex",
                flexDirection: "column",
                gap: 7,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: props.c.subtext,
                    }}
                >
                    {props.label}
                </div>
                {props.danger ? (
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: props.c.danger,
                            background: "rgba(255,60,60,0.10)",
                            borderRadius: 999,
                            padding: "3px 8px",
                        }}
                    >
                        Flag
                    </div>
                ) : null}
            </div>

            <div
                style={{
                    fontSize: vSize,
                    fontWeight: 600,
                    color: props.c.text,
                    letterSpacing: -0.2,
                }}
            >
                {props.value}
            </div>

            {props.hint ? (
                <div
                    style={{
                        fontSize: 11.5,
                        color: props.c.subtext,
                        lineHeight: 1.35,
                    }}
                >
                    {props.hint}
                </div>
            ) : null}
        </div>
    )
}

type InputKey =
    | "purchasePrice"
    | "downPaymentPct"
    | "interestRatePct"
    | "loanTermYears"
    | "monthlyRent"
    | "vacancyPct"
    | "annualTaxes"
    | "annualInsurance"
    | "monthlyMaintenance"
    | "managementPct"
    | "closingCosts"
    | "rehabCosts"
    | "monthlyHOA"
    | "monthlyUtilities"
    | "monthlyOtherExpenses"
    | "monthlyPMI"
    | "holdYears"
    | "appreciationPct"
    | "sellingCostsPct"

type Inputs = Record<InputKey, Value>
type Touched = Record<InputKey, boolean>

function buildInitialInputs(d: Defaults): Inputs {
    const z = d.startBlank
    const v = (n: number) => (z ? null : n)
    return {
        purchasePrice: v(d.purchasePrice),
        downPaymentPct: v(d.downPaymentPct),
        interestRatePct: v(d.interestRatePct),
        loanTermYears: v(d.loanTermYears),
        monthlyRent: v(d.monthlyRent),
        vacancyPct: v(d.vacancyPct),
        annualTaxes: v(d.annualTaxes),
        annualInsurance: v(d.annualInsurance),
        monthlyMaintenance: v(d.monthlyMaintenance),
        managementPct: v(d.managementPct),
        closingCosts: v(d.closingCosts),
        rehabCosts: v(d.rehabCosts),
        monthlyHOA: v(d.monthlyHOA),
        monthlyUtilities: v(d.monthlyUtilities),
        monthlyOtherExpenses: v(d.monthlyOtherExpenses),
        monthlyPMI: v(d.monthlyPMI),
        holdYears: v(d.holdYears),
        appreciationPct: v(d.appreciationPct),
        sellingCostsPct: v(d.sellingCostsPct),
    }
}

function buildInitialTouched(): Touched {
    return {
        purchasePrice: false,
        downPaymentPct: false,
        interestRatePct: false,
        loanTermYears: false,
        monthlyRent: false,
        vacancyPct: false,
        annualTaxes: false,
        annualInsurance: false,
        monthlyMaintenance: false,
        managementPct: false,
        closingCosts: false,
        rehabCosts: false,
        monthlyHOA: false,
        monthlyUtilities: false,
        monthlyOtherExpenses: false,
        monthlyPMI: false,
        holdYears: false,
        appreciationPct: false,
        sellingCostsPct: false,
    }
}

export default function RealEstateRoiMultiStep(
    props: RealEstateRoiMultiStepProps
) {
    const fmt$ = React.useMemo(
        () => fmtMoneyFactory(props.currency),
        [props.currency]
    )
    const { ref, w, h } = useContainerSize()
    const isNarrow = w > 0 && w < 520

    const sc = props.styleConfig
    const c = props.colors
    const t = props.text
    const bw = clamp(sc.borderWidth, 1, 2)
    const radius = Math.max(14, sc.radius)
    const padding = Math.max(12, sc.padding)
    const compact = clamp(sc.compactness, 0, 1)
    const maxWidth = sc.maxWidth > 0 ? `${sc.maxWidth}px` : "100%"
    const maxHeight = (sc as any).maxHeight > 0 ? (sc as any).maxHeight : 675
    const shadow = `0 22px 60px rgba(15,23,42,${clamp(sc.shadowStrength, 0, 0.28)})`

    const [inputs, setInputs] = React.useState<Inputs>(() =>
        buildInitialInputs(props.defaults)
    )
    const [touched, setTouched] = React.useState<Touched>(() =>
        buildInitialTouched()
    )

    // Unlock state for results
    const [isUnlocked, setIsUnlocked] = React.useState(false)

    React.useEffect(() => {
        setInputs(buildInitialInputs(props.defaults))
        setTouched(buildInitialTouched())
        setIsUnlocked(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(props.defaults)])

    function setField(key: InputKey, value: Value) {
        setInputs((prev) => ({ ...prev, [key]: value }))
    }

    function touchField(key: InputKey) {
        setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
    }

    const showAdvanced = props.toggles.showAdvancedInputs
    const showExit = props.toggles.showExit

    const steps: { key: string; title: string }[] = [
        { key: "property", title: t.step1 || "Property" },
        { key: "income", title: t.step2 || "Income" },
        { key: "expenses", title: t.step3 || "Expenses" },
        { key: "results", title: t.step4 || "Results" },
    ]

    const [step, setStep] = React.useState(0)

    const visibleByStep: Record<number, InputKey[]> = React.useMemo(() => {
        const s0: InputKey[] = [
            "purchasePrice",
            "downPaymentPct",
            "interestRatePct",
            "loanTermYears",
        ]
        if (showAdvanced) s0.push("closingCosts", "rehabCosts", "monthlyPMI")

        const s1: InputKey[] = ["monthlyRent", "vacancyPct"]

        const s2: InputKey[] = [
            "annualTaxes",
            "annualInsurance",
            "monthlyMaintenance",
            "managementPct",
        ]
        if (showAdvanced)
            s2.push("monthlyHOA", "monthlyUtilities", "monthlyOtherExpenses")
        if (showExit) s2.push("holdYears", "appreciationPct", "sellingCostsPct")

        return { 0: s0, 1: s1, 2: s2, 3: [] }
    }, [showAdvanced, showExit])

    const strictPositive: Partial<Record<InputKey, boolean>> = {
        purchasePrice: true,
        loanTermYears: true,
        monthlyRent: true,
    }

    const percentFields: InputKey[] = [
        "downPaymentPct",
        "vacancyPct",
        "managementPct",
        "sellingCostsPct",
    ]

    function fieldIsComplete(key: InputKey) {
        const v = inputs[key]
        if (!isNum(v)) return false

        if (strictPositive[key]) {
            if (v <= 0) return false
        }

        if (percentFields.includes(key)) {
            if (v < 0 || v > 100) return false
        }

        if (key === "loanTermYears" && (v < 5 || v > 100)) return false

        return true
    }

    function stepIsComplete(stepIndex: number) {
        const keys = visibleByStep[stepIndex] || []
        if (!keys.length) return true

        const baseRequired: InputKey[] =
            stepIndex === 0
                ? [
                      "purchasePrice",
                      "downPaymentPct",
                      "interestRatePct",
                      "loanTermYears",
                  ]
                : stepIndex === 1
                  ? ["monthlyRent", "vacancyPct"]
                  : stepIndex === 2
                    ? [
                          "annualTaxes",
                          "annualInsurance",
                          "monthlyMaintenance",
                          "managementPct",
                      ]
                    : []

        const required = props.toggles.requireAllVisible ? keys : baseRequired
        return required.every(fieldIsComplete)
    }

    const maxAllowed = React.useMemo(() => {
        if (!stepIsComplete(0)) return 0
        if (!stepIsComplete(1)) return 1
        if (!stepIsComplete(2)) return 2
        return 3
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        inputs,
        touched,
        visibleByStep,
        props.toggles.requireAllVisible,
        props.toggles.requireInteraction,
    ])

    const canGoNext = step < 3 ? stepIsComplete(step) : true

    const calc = React.useMemo(() => {
        const n = (k: InputKey, fallback = 0) =>
            isNum(inputs[k]) ? (inputs[k] as number) : fallback

        const price = clamp(n("purchasePrice"), 0, 100000000)
        const downPct = clamp(n("downPaymentPct"), 0, 100) / 100
        const dp = price * downPct
        const loan = Math.max(0, price - dp)

        const rate = clamp(n("interestRatePct"), 0, 25)
        const term = clamp(n("loanTermYears", 30), 1, 100)

        const pmi = Math.max(0, n("monthlyPMI"))
        const mortgagePI = mortgagePayment(loan, rate, term)
        const debtService =
            mortgagePI + (props.formulas.debtServiceIncludesPMI ? pmi : 0)

        const rent = clamp(n("monthlyRent"), 0, 1000000)
        const vacancy = clamp(n("vacancyPct"), 0, 50) / 100

        const grossIncome = rent
        const incomeBase =
            props.formulas.vacancyAppliesTo === "allIncome" ? grossIncome : rent

        const effectiveIncome =
            props.formulas.vacancyAppliesTo === "rentOnly"
                ? rent * (1 - vacancy)
                : incomeBase * (1 - vacancy)

        const taxesM = clamp(n("annualTaxes"), 0, 100000000) / 12
        const insM = clamp(n("annualInsurance"), 0, 100000000) / 12
        const maintM = clamp(n("monthlyMaintenance"), 0, 100000000)
        const hoaM = clamp(n("monthlyHOA"), 0, 100000000)
        const utilM = clamp(n("monthlyUtilities"), 0, 100000000)
        const otherM = clamp(n("monthlyOtherExpenses"), 0, 100000000)

        const mgmtPct = clamp(n("managementPct"), 0, 30) / 100
        const mgmtBasis =
            props.formulas.managementAppliesTo === "grossIncome"
                ? grossIncome
                : effectiveIncome
        const mgmtCost = mgmtBasis * mgmtPct

        const operatingExpenses =
            taxesM + insM + maintM + mgmtCost + hoaM + utilM + otherM
        const noi = effectiveIncome - operatingExpenses

        const cashFlow = noi - debtService
        const annualCashFlow = cashFlow * 12

        const closing = clamp(n("closingCosts"), 0, 100000000)
        const rehab = clamp(n("rehabCosts"), 0, 100000000)

        const cashInvested =
            dp +
            (props.formulas.cashInvestedIncludesClosing ? closing : 0) +
            (props.formulas.cashInvestedIncludesRehab ? rehab : 0)

        const capDen =
            props.formulas.capRateDenominator === "cashInvested"
                ? Math.max(1, cashInvested)
                : Math.max(1, price)

        const capRate = (noi * 12) / capDen || 0
        const coc = cashInvested > 0 ? annualCashFlow / cashInvested : 0
        const dscr = debtService > 0 ? noi / debtService : 0

        const breakEvenDen = props.formulas.breakEvenUsesEffectiveIncome
            ? Math.max(1, effectiveIncome)
            : Math.max(1, grossIncome)
        const breakEvenOcc =
            breakEvenDen > 0
                ? (operatingExpenses + debtService) / breakEvenDen
                : 0

        const years = clamp(n("holdYears", 5), 1, 30)
        const appr = clamp(n("appreciationPct", 3), -20, 25) / 100
        const sellCost = clamp(n("sellingCostsPct", 6), 0, 12) / 100

        const futureValue =
            props.formulas.appreciationMode === "simple"
                ? price * (1 + appr * years)
                : price * Math.pow(1 + appr, years)

        const saleNetBeforeDebt = futureValue * (1 - sellCost)
        const balance = loanBalance(loan, rate, term, years)
        const saleProceeds = Math.max(0, saleNetBeforeDebt - balance)

        const totalProfitSimple =
            annualCashFlow * years + saleProceeds - cashInvested
        const multiple =
            cashInvested > 0
                ? (cashInvested + totalProfitSimple) / cashInvested
                : 0
        const annualized =
            cashInvested > 0
                ? Math.pow(Math.max(0, multiple), 1 / years) - 1
                : 0

        return {
            dp,
            loan,
            mortgagePI,
            debtService,
            effectiveIncome,
            operatingExpenses,
            noi,
            cashFlow,
            annualCashFlow,
            cashInvested,
            capRate,
            coc,
            dscr,
            breakEvenOcc,
            futureValue,
            saleProceeds,
            totalProfitSimple,
            annualized,
        }
    }, [inputs, props.formulas])

    const [leadName, setLeadName] = React.useState("")
    const [leadEmail, setLeadEmail] = React.useState("")
    const [leadStatus, setLeadStatus] = React.useState<
        "idle" | "sending" | "success" | "error"
    >("idle")
    const [leadError, setLeadError] = React.useState("")

    const leadValid = leadName.trim().length >= 2 && emailLooksValid(leadEmail)
    const leadCanSubmit = leadValid && leadStatus !== "sending"

    async function submitLead() {
        setLeadError("")

        if (!leadValid) return

        const payload: any = {
            lead: {
                name: leadName.trim(),
                email: leadEmail.trim(),
            },
            meta: {
                timestamp: new Date().toISOString(),
                pageUrl:
                    typeof window !== "undefined" ? window.location.href : "",
            },
        }

        if (props.delivery.includeInputs) {
            payload.inputs = {
                purchasePrice: inputs.purchasePrice,
                downPaymentPct: inputs.downPaymentPct,
                interestRatePct: inputs.interestRatePct,
                loanTermYears: inputs.loanTermYears,
                monthlyRent: inputs.monthlyRent,
                vacancyPct: inputs.vacancyPct,
                annualTaxes: inputs.annualTaxes,
                annualInsurance: inputs.annualInsurance,
                monthlyMaintenance: inputs.monthlyMaintenance,
                managementPct: inputs.managementPct,
            }
        }
        if (props.delivery.includeResults) {
            payload.results = {
                monthlyCashFlow: calc.cashFlow,
                cashOnCash: calc.coc,
                capRate: calc.capRate,
                noi: calc.noi,
                annualCashFlow: calc.annualCashFlow,
            }
        }
        payload.currency = props.currency

        const mode = props.delivery.mode
        const webhook = safeUrl(props.delivery.webhookUrl || "")
        const notify = (props.delivery.notifyEmail || "").trim()

        setLeadStatus("sending")

        if (mode === "webhook") {
            if (!webhook) {
                setLeadStatus("error")
                setLeadError(
                    t.errorMissingDelivery || "Missing delivery configuration."
                )
                return
            }
            try {
                const res = await fetch(webhook, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
            } catch {
                setLeadStatus("error")
                setLeadError(t.errorSubmitFailed || "Submit failed.")
                return
            }
        }

        if (mode === "mailto") {
            if (!notify) {
                setLeadStatus("error")
                setLeadError(
                    t.errorMissingDelivery || "Missing delivery configuration."
                )
                return
            }
            const subject = encodeURIComponent(
                props.delivery.mailSubject || "New ROI lead"
            )
            const lines: string[] = []
            lines.push(`Name: ${payload.lead.name}`)
            lines.push(`Email: ${payload.lead.email}`)
            lines.push("")
            lines.push(`Monthly cash flow: ${fmt$(calc.cashFlow)}`)
            lines.push(`Cash on cash: ${fmtPct01(calc.coc)}`)
            lines.push(`Cap rate: ${fmtPct01(calc.capRate)}`)
            lines.push(`DSCR: ${fmtX(calc.dscr)}`)

            const body = encodeURIComponent(lines.join("\n"))
            const href = `mailto:${encodeURIComponent(notify)}?subject=${subject}&body=${body}`
            try {
                if (typeof window !== "undefined") window.location.href = href
            } catch {}
        }

        setLeadStatus("success")
        setIsUnlocked(true)
    }

    function resetAll() {
        setLeadName("")
        setLeadEmail("")
        setLeadStatus("idle")
        setLeadError("")
        setIsUnlocked(false)
        setInputs(buildInitialInputs(props.defaults))
        setTouched(buildInitialTouched())
        setStep(0)
    }

    const title = t.title || "Rental ROI Calculator"
    const subtitle =
        t.subtitle || "Minimal, fast estimate for cash flow and returns."

    const headerPad = compact <= 0.35 ? 14 : compact <= 0.7 ? 16 : 18
    const bodyPad = compact <= 0.35 ? 12 : compact <= 0.7 ? 14 : 16

    const nextLabel =
        step === 2 ? t.viewResults || "View results" : t.next || "Next"
    const backLabel = t.back || "Back"
    const restartLabel = t.restart || "Restart"

    const footerActionLabel =
        step === 3 && isUnlocked
            ? restartLabel
            : step === 3
              ? t.submit || "Get Results"
              : nextLabel

    const footerDisabled =
        step === 3 ? !leadCanSubmit && !isUnlocked : !canGoNext

    const requiredHint =
        t.requiredHint || "Complete the required fields to continue."

    const cardHeight = "100%"

    // Calculate max height for results - leave room for header, footer, and padding
    const availableHeight = Math.max(300, h - 180)

    return (
        <div
            ref={ref}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "stretch",
                background: c.background,
                padding,
                boxSizing: "border-box",
                overflow: "hidden",
                fontFamily:
                    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth,
                    height: cardHeight,
                    maxHeight,
                    borderRadius: radius,
                    border: `${bw}px solid ${c.border}`,
                    background: c.card,
                    boxShadow: shadow,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <div
                    style={{
                        padding: `${headerPad}px ${headerPad}px 12px ${headerPad}px`,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: isNarrow ? 13.5 : 14,
                                    fontWeight: 700,
                                    color: c.text,
                                    letterSpacing: -0.2,
                                }}
                            >
                                {title}
                            </div>
                            <div
                                style={{
                                    fontSize: 12.5,
                                    color: c.subtext,
                                    lineHeight: 1.35,
                                }}
                            >
                                {subtitle}
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                height: 32,
                                padding: "0 10px",
                                borderRadius: 999,
                                border: `${bw}px solid ${c.border}`,
                                background: c.fieldBg,
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: 999,
                                    background: c.accent,
                                }}
                            />
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: c.subtext,
                                }}
                            >
                                {props.currency}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <StepTabs
                            steps={steps.map((s) => s.title)}
                            active={step}
                            maxAllowed={maxAllowed}
                            onGo={(i) => setStep(clamp(i, 0, maxAllowed))}
                            isNarrow={isNarrow}
                            c={c}
                            bw={bw}
                            allowFree={props.toggles.allowFreeStepNavigation}
                        />
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        padding: `0 ${headerPad}px ${headerPad}px ${headerPad}px`,
                    }}
                >
                    <div
                        style={{
                            borderRadius: Math.max(12, radius - 6),
                            border: `${bw}px solid ${c.border}`,
                            padding: bodyPad,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            background: "transparent",
                            minHeight: 0,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: c.subtext,
                                }}
                            >
                                Step {step + 1} of {steps.length}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: c.text,
                                }}
                            >
                                {steps[step]?.title}
                            </div>
                        </div>

                        <div
                            style={{
                                height: 1,
                                background: c.divider,
                                opacity: 1,
                            }}
                        />

                        {step === 0 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                }}
                            >
                                <FieldRow
                                    label={
                                        t.purchasePriceLabel || "Purchase price"
                                    }
                                    suffix={props.currency}
                                    value={inputs.purchasePrice}
                                    touched={touched.purchasePrice}
                                    onChange={(v) =>
                                        setField("purchasePrice", v)
                                    }
                                    onTouched={() =>
                                        touchField("purchasePrice")
                                    }
                                    min={0}
                                    max={50000000}
                                    step={5000}
                                    showSlider={false}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />
                                <FieldRow
                                    label={t.downPaymentLabel || "Down payment"}
                                    suffix="%"
                                    value={inputs.downPaymentPct}
                                    touched={touched.downPaymentPct}
                                    onChange={(v) =>
                                        setField("downPaymentPct", v)
                                    }
                                    onTouched={() =>
                                        touchField("downPaymentPct")
                                    }
                                    min={0}
                                    max={60}
                                    step={0.5}
                                    showSlider={props.toggles.showSliders}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />
                                <FieldRow
                                    label={
                                        t.interestRateLabel || "Interest rate"
                                    }
                                    suffix="%"
                                    value={inputs.interestRatePct}
                                    touched={touched.interestRatePct}
                                    onChange={(v) =>
                                        setField("interestRatePct", v)
                                    }
                                    onTouched={() =>
                                        touchField("interestRatePct")
                                    }
                                    min={0}
                                    max={12}
                                    step={0.05}
                                    showSlider={props.toggles.showSliders}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />
                                <FieldRow
                                    label={t.loanTermLabel || "Loan term"}
                                    suffix="yrs"
                                    value={inputs.loanTermYears}
                                    touched={touched.loanTermYears}
                                    onChange={(v) =>
                                        setField("loanTermYears", v)
                                    }
                                    onTouched={() =>
                                        touchField("loanTermYears")
                                    }
                                    min={5}
                                    max={100}
                                    step={1}
                                    showSlider={props.toggles.showSliders}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />

                                {showAdvanced ? (
                                    <>
                                        <div
                                            style={{
                                                height: 1,
                                                background: c.divider,
                                                opacity: 1,
                                            }}
                                        />
                                        <FieldRow
                                            label={
                                                t.closingCostsLabel ||
                                                "Closing costs"
                                            }
                                            suffix={props.currency}
                                            value={inputs.closingCosts}
                                            touched={touched.closingCosts}
                                            onChange={(v) =>
                                                setField("closingCosts", v)
                                            }
                                            onTouched={() =>
                                                touchField("closingCosts")
                                            }
                                            min={0}
                                            max={400000}
                                            step={500}
                                            showSlider={false}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <FieldRow
                                            label={
                                                t.rehabLabel || "Rehab budget"
                                            }
                                            suffix={props.currency}
                                            value={inputs.rehabCosts}
                                            touched={touched.rehabCosts}
                                            onChange={(v) =>
                                                setField("rehabCosts", v)
                                            }
                                            onTouched={() =>
                                                touchField("rehabCosts")
                                            }
                                            min={0}
                                            max={800000}
                                            step={500}
                                            showSlider={false}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <FieldRow
                                            label={t.pmiLabel || "Monthly PMI"}
                                            suffix={props.currency}
                                            value={inputs.monthlyPMI}
                                            touched={touched.monthlyPMI}
                                            onChange={(v) =>
                                                setField("monthlyPMI", v)
                                            }
                                            onTouched={() =>
                                                touchField("monthlyPMI")
                                            }
                                            min={0}
                                            max={3000}
                                            step={10}
                                            showSlider={false}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                    </>
                                ) : null}
                            </div>
                        ) : null}

                        {step === 1 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                }}
                            >
                                <FieldRow
                                    label={t.monthlyRentLabel || "Monthly rent"}
                                    suffix={props.currency}
                                    value={inputs.monthlyRent}
                                    touched={touched.monthlyRent}
                                    onChange={(v) => setField("monthlyRent", v)}
                                    onTouched={() => touchField("monthlyRent")}
                                    min={0}
                                    max={50000}
                                    step={25}
                                    showSlider={false}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />
                                <FieldRow
                                    label={t.vacancyLabel || "Vacancy"}
                                    suffix="%"
                                    value={inputs.vacancyPct}
                                    touched={touched.vacancyPct}
                                    onChange={(v) => setField("vacancyPct", v)}
                                    onTouched={() => touchField("vacancyPct")}
                                    min={0}
                                    max={25}
                                    step={0.5}
                                    showSlider={props.toggles.showSliders}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />
                            </div>
                        ) : null}

                        {step === 2 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                }}
                            >
                                <FieldRow
                                    label={t.annualTaxesLabel || "Annual taxes"}
                                    suffix={props.currency}
                                    value={inputs.annualTaxes}
                                    touched={touched.annualTaxes}
                                    onChange={(v) => setField("annualTaxes", v)}
                                    onTouched={() => touchField("annualTaxes")}
                                    min={0}
                                    max={100000000}
                                    step={100}
                                    showSlider={false}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />
                                <FieldRow
                                    label={
                                        t.annualInsuranceLabel ||
                                        "Annual insurance"
                                    }
                                    suffix={props.currency}
                                    value={inputs.annualInsurance}
                                    touched={touched.annualInsurance}
                                    onChange={(v) =>
                                        setField("annualInsurance", v)
                                    }
                                    onTouched={() =>
                                        touchField("annualInsurance")
                                    }
                                    min={0}
                                    max={100000000}
                                    step={50}
                                    showSlider={false}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />
                                <FieldRow
                                    label={t.maintenanceLabel || "Maintenance"}
                                    suffix={props.currency}
                                    value={inputs.monthlyMaintenance}
                                    touched={touched.monthlyMaintenance}
                                    onChange={(v) =>
                                        setField("monthlyMaintenance", v)
                                    }
                                    onTouched={() =>
                                        touchField("monthlyMaintenance")
                                    }
                                    min={0}
                                    max={100000000}
                                    step={10}
                                    showSlider={false}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />
                                <FieldRow
                                    label={
                                        t.managementLabel || "Management fee"
                                    }
                                    suffix="%"
                                    value={inputs.managementPct}
                                    touched={touched.managementPct}
                                    onChange={(v) =>
                                        setField("managementPct", v)
                                    }
                                    onTouched={() =>
                                        touchField("managementPct")
                                    }
                                    min={0}
                                    max={30}
                                    step={0.5}
                                    showSlider={props.toggles.showSliders}
                                    compact={compact}
                                    c={c}
                                    bw={bw}
                                    radius={radius}
                                />

                                {showAdvanced ? (
                                    <>
                                        <div
                                            style={{
                                                height: 1,
                                                background: c.divider,
                                                opacity: 1,
                                            }}
                                        />
                                        <FieldRow
                                            label={t.hoaLabel || "HOA"}
                                            suffix={props.currency}
                                            value={inputs.monthlyHOA}
                                            touched={touched.monthlyHOA}
                                            onChange={(v) =>
                                                setField("monthlyHOA", v)
                                            }
                                            onTouched={() =>
                                                touchField("monthlyHOA")
                                            }
                                            min={0}
                                            max={100000000}
                                            step={10}
                                            showSlider={false}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <FieldRow
                                            label={
                                                t.utilitiesLabel || "Utilities"
                                            }
                                            suffix={props.currency}
                                            value={inputs.monthlyUtilities}
                                            touched={touched.monthlyUtilities}
                                            onChange={(v) =>
                                                setField("monthlyUtilities", v)
                                            }
                                            onTouched={() =>
                                                touchField("monthlyUtilities")
                                            }
                                            min={0}
                                            max={100000000}
                                            step={10}
                                            showSlider={false}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <FieldRow
                                            label={
                                                t.otherExpensesLabel ||
                                                "Other expenses"
                                            }
                                            suffix={props.currency}
                                            value={inputs.monthlyOtherExpenses}
                                            touched={
                                                touched.monthlyOtherExpenses
                                            }
                                            onChange={(v) =>
                                                setField(
                                                    "monthlyOtherExpenses",
                                                    v
                                                )
                                            }
                                            onTouched={() =>
                                                touchField(
                                                    "monthlyOtherExpenses"
                                                )
                                            }
                                            min={0}
                                            max={100000000}
                                            step={10}
                                            showSlider={false}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                    </>
                                ) : null}

                                {showExit ? (
                                    <>
                                        <div
                                            style={{
                                                height: 1,
                                                background: c.divider,
                                                opacity: 1,
                                            }}
                                        />
                                        <FieldRow
                                            label={
                                                t.holdPeriodLabel ||
                                                "Hold period"
                                            }
                                            suffix="yrs"
                                            value={inputs.holdYears}
                                            touched={touched.holdYears}
                                            onChange={(v) =>
                                                setField("holdYears", v)
                                            }
                                            onTouched={() =>
                                                touchField("holdYears")
                                            }
                                            min={1}
                                            max={30}
                                            step={1}
                                            showSlider={
                                                props.toggles.showSliders
                                            }
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <FieldRow
                                            label={
                                                t.appreciationLabel ||
                                                "Appreciation"
                                            }
                                            suffix="%"
                                            value={inputs.appreciationPct}
                                            touched={touched.appreciationPct}
                                            onChange={(v) =>
                                                setField("appreciationPct", v)
                                            }
                                            onTouched={() =>
                                                touchField("appreciationPct")
                                            }
                                            min={-20}
                                            max={25}
                                            step={0.25}
                                            showSlider={
                                                props.toggles.showSliders
                                            }
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <FieldRow
                                            label={
                                                t.sellingCostsLabel ||
                                                "Selling costs"
                                            }
                                            suffix="%"
                                            value={inputs.sellingCostsPct}
                                            touched={touched.sellingCostsPct}
                                            onChange={(v) =>
                                                setField("sellingCostsPct", v)
                                            }
                                            onTouched={() =>
                                                touchField("sellingCostsPct")
                                            }
                                            min={0}
                                            max={12}
                                            step={0.25}
                                            showSlider={
                                                props.toggles.showSliders
                                            }
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                    </>
                                ) : null}
                            </div>
                        ) : null}

                        {step === 3 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    position: "relative",
                                    minHeight: 0,
                                }}
                            >
                                {/* Results - hidden until unlocked */}
                                <div
                                    style={{
                                        display: isUnlocked ? "flex" : "none",
                                        flexDirection: "column",
                                        gap: 8,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: isNarrow
                                                ? "1fr"
                                                : "1fr 1fr",
                                            gap: 6,
                                        }}
                                    >
                                        <Metric
                                            label="Monthly Cash Flow"
                                            value={fmt$(calc.cashFlow)}
                                            accent
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <Metric
                                            label="Cash on Cash"
                                            value={fmtPct01(calc.coc)}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <Metric
                                            label="Cap Rate"
                                            value={fmtPct01(calc.capRate)}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                        <Metric
                                            label="NOI (Annual)"
                                            value={fmt$(calc.noi * 12)}
                                            compact={compact}
                                            c={c}
                                            bw={bw}
                                            radius={radius}
                                        />
                                    </div>

                                    {showExit && (
                                        <>
                                            <div
                                                style={{
                                                    height: 1,
                                                    background: c.divider,
                                                    margin: "8px 0",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 500,
                                                    color: c.subtext,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                Exit: {inputs.holdYears || 0}{" "}
                                                years
                                            </div>
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        isNarrow
                                                            ? "1fr"
                                                            : "1fr 1fr",
                                                    gap: 6,
                                                }}
                                            >
                                                <RowCompact
                                                    label="Future Value"
                                                    value={fmt$(
                                                        calc.futureValue
                                                    )}
                                                    c={c}
                                                />
                                                <RowCompact
                                                    label="Total Profit"
                                                    value={fmt$(
                                                        calc.totalProfitSimple
                                                    )}
                                                    c={c}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {props.toggles.showDisclaimer && (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                padding: 6,
                                                borderRadius: Math.max(
                                                    6,
                                                    radius - 12
                                                ),
                                                background: c.soft,
                                                fontSize: 9,
                                                color: c.subtext,
                                                lineHeight: 1.25,
                                            }}
                                        >
                                            {t.disclaimer}
                                        </div>
                                    )}

                                    {/* Reset link */}
                                    <button
                                        onClick={resetAll}
                                        style={{
                                            alignSelf: "center",
                                            marginTop: 4,
                                            padding: "6px 12px",
                                            fontSize: 11,
                                            fontWeight: 500,
                                            color: c.accent,
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        Reset calculator
                                    </button>
                                </div>

                                {/* Lead capture overlay */}
                                {!isUnlocked && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            background: c.card,
                                            borderRadius: Math.max(
                                                12,
                                                radius - 6
                                            ),
                                            padding: 16,
                                            gap: 10,
                                            minHeight: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: c.text,
                                                textAlign: "center",
                                            }}
                                        >
                                            {t.leadTitle ||
                                                "Get the full report"}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: c.subtext,
                                                textAlign: "center",
                                                lineHeight: 1.35,
                                            }}
                                        >
                                            {t.leadSubtitle ||
                                                "Enter your details to receive a copy of these results."}
                                        </div>

                                        <div
                                            style={{
                                                width: "100%",
                                                maxWidth: 220,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 8,
                                            }}
                                        >
                                            <TextFieldCompact
                                                label={t.nameLabel || "Name"}
                                                value={leadName}
                                                onChange={setLeadName}
                                                c={c}
                                                bw={bw}
                                                radius={radius}
                                                compact={compact}
                                            />
                                            <TextFieldCompact
                                                label={t.emailLabel || "Email"}
                                                value={leadEmail}
                                                onChange={setLeadEmail}
                                                inputMode="email"
                                                c={c}
                                                bw={bw}
                                                radius={radius}
                                                compact={compact}
                                            />
                                        </div>

                                        {leadStatus === "error" &&
                                            leadError && (
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        color: c.danger,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {leadError}
                                                </div>
                                            )}

                                        <button
                                            onClick={submitLead}
                                            disabled={!leadCanSubmit}
                                            style={{
                                                height: 36,
                                                padding: "0 20px",
                                                borderRadius: 8,
                                                border: "none",
                                                background: c.accent,
                                                color: "rgba(255,255,255,0.95)",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: leadCanSubmit
                                                    ? "pointer"
                                                    : "not-allowed",
                                                opacity: leadCanSubmit
                                                    ? 1
                                                    : 0.55,
                                                marginTop: 4,
                                            }}
                                        >
                                            {leadStatus === "sending"
                                                ? "Sending..."
                                                : t.submit || "Get Results"}
                                        </button>
                                    </div>
                                )}

                                {/* Success message */}
                                {isUnlocked && leadStatus === "success" && (
                                    <div
                                        style={{
                                            marginTop: 4,
                                            padding: 8,
                                            borderRadius: Math.max(
                                                6,
                                                radius - 12
                                            ),
                                            background: `${c.accent}15`,
                                            textAlign: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: c.accent,
                                            }}
                                        >
                                            {t.successTitle || "Success!"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div
                    style={{
                        padding: `12px ${headerPad}px ${headerPad}px ${headerPad}px`,
                        borderTop: `1px solid ${c.divider}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    {!footerDisabled && step < 3 ? null : step < 3 &&
                      !canGoNext ? (
                        <div
                            style={{
                                fontSize: 12.5,
                                color: c.subtext,
                                lineHeight: 1.35,
                            }}
                        >
                            {requiredHint}
                        </div>
                    ) : null}

                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            onClick={() =>
                                setStep((s) => clamp(s - 1, 0, maxAllowed))
                            }
                            disabled={step === 0}
                            style={{
                                height: 42,
                                padding: "0 14px",
                                borderRadius: 12,
                                border: `${bw}px solid ${c.border}`,
                                background: c.soft,
                                color: c.text,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: step === 0 ? "not-allowed" : "pointer",
                                opacity: step === 0 ? 0.5 : 1,
                            }}
                        >
                            {backLabel}
                        </button>

                        <button
                            onClick={() => {
                                if (step === 3 && isUnlocked) {
                                    resetAll()
                                    return
                                }
                                if (step === 3 && !isUnlocked) {
                                    if (leadCanSubmit) submitLead()
                                    return
                                }
                                if (step < 3) {
                                    if (!canGoNext) return
                                    setStep((s) => clamp(s + 1, 0, maxAllowed))
                                    return
                                }
                            }}
                            disabled={footerDisabled}
                            style={{
                                height: 42,
                                padding: "0 14px",
                                borderRadius: 12,
                                border: "none",
                                background: c.accent,
                                color: "rgba(255,255,255,0.95)",
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: 0.1,
                                cursor: footerDisabled
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: footerDisabled ? 0.55 : 1,
                                flex: 1,
                            }}
                        >
                            {footerActionLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function RowCompact(props: { label: string; value: string; c: Colors }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 11.5,
            }}
        >
            <span style={{ color: props.c.subtext }}>{props.label}</span>
            <span style={{ color: props.c.text, fontWeight: 500 }}>
                {props.value}
            </span>
        </div>
    )
}

function TextFieldCompact(props: {
    label: string
    value: string
    onChange: (v: string) => void
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
    c: Colors
    bw: number
    radius: number
    compact: number
}) {
    const h = props.compact <= 0.35 ? 28 : props.compact <= 0.7 ? 30 : 32
    const r = Math.max(6, props.radius - 12)
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
                style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: props.c.subtext,
                }}
            >
                {props.label}
            </div>
            <div
                style={{
                    height: h,
                    padding: "0 8px",
                    borderRadius: r,
                    border: `${props.bw}px solid ${props.c.border}`,
                    background: props.c.fieldBg,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <input
                    value={props.value}
                    onChange={(e) => props.onChange(e.target.value)}
                    inputMode={props.inputMode}
                    style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: 11,
                        fontWeight: 500,
                        color: props.c.text,
                    }}
                />
            </div>
        </div>
    )
}

;(RealEstateRoiMultiStep as any).displayName = "Real Estate ROI Multi Step"
;(RealEstateRoiMultiStep as any).defaultProps = {
    currency: "USD",
    toggles: {
        showSliders: true,
        showAdvancedInputs: false,
        showExit: true,
        showDisclaimer: true,
        requireInteraction: true,
        requireAllVisible: true,
        allowFreeStepNavigation: false,
    },
    text: {
        title: "Rental ROI Calculator",
        subtitle: "Minimal, fast estimate for cash flow and returns.",
        step1: "Property",
        step2: "Income",
        step3: "Expenses",
        step4: "Results",
        back: "Back",
        next: "Next",
        viewResults: "View results",
        submit: "Submit",
        restart: "Restart",
        requiredHint: "Complete the required fields to continue.",
        leadTitle: "Get the full report",
        leadSubtitle: "Enter your details to receive a copy of these results.",
        nameLabel: "Name",
        emailLabel: "Email",
        successTitle: "Submitted",
        successBody: "Thank you. We will follow up shortly.",
        errorMissingDelivery: "Missing delivery configuration.",
        errorSubmitFailed: "Submit failed. Check delivery and CORS.",
        disclaimer:
            "Estimates only. Verify assumptions and consult a professional.",
        // Field labels
        purchasePriceLabel: "Purchase price",
        downPaymentLabel: "Down payment",
        interestRateLabel: "Interest rate",
        loanTermLabel: "Loan term",
        monthlyRentLabel: "Monthly rent",
        vacancyLabel: "Vacancy",
        annualTaxesLabel: "Annual taxes",
        annualInsuranceLabel: "Annual insurance",
        maintenanceLabel: "Maintenance",
        managementLabel: "Management fee",
        closingCostsLabel: "Closing costs",
        rehabLabel: "Rehab budget",
        hoaLabel: "HOA",
        utilitiesLabel: "Utilities",
        otherExpensesLabel: "Other expenses",
        pmiLabel: "Monthly PMI",
        holdPeriodLabel: "Hold period",
        appreciationLabel: "Appreciation",
        sellingCostsLabel: "Selling costs",
    },
    colors: {
        accent: "#111827",
        background: "transparent",
        card: "rgba(255,255,255,0.92)",
        border: "rgba(15,23,42,0.10)",
        text: "rgba(15,23,42,0.92)",
        subtext: "rgba(15,23,42,0.62)",
        fieldBg: "rgba(255,255,255,0.96)",
        soft: "rgba(15,23,42,0.04)",
        divider: "rgba(15,23,42,0.08)",
        danger: "rgba(255,60,60,0.92)",
    },
    styleConfig: {
        maxWidth: 860,
        maxHeight: 675,
        radius: 18,
        padding: 16,
        compactness: 0.75,
        borderWidth: 1,
        shadowStrength: 0.1,
    },
    defaults: {
        startBlank: false,

        purchasePrice: 300000,
        downPaymentPct: 20,
        interestRatePct: 6.5,
        loanTermYears: 30,

        monthlyRent: 2500,
        vacancyPct: 5,

        annualTaxes: 3600,
        annualInsurance: 1200,
        monthlyMaintenance: 150,
        managementPct: 8,

        closingCosts: 9000,
        rehabCosts: 5000,
        monthlyHOA: 0,
        monthlyUtilities: 0,
        monthlyOtherExpenses: 0,
        monthlyPMI: 0,

        holdYears: 5,
        appreciationPct: 3,
        sellingCostsPct: 6,
    },
    formulas: {
        vacancyAppliesTo: "rentOnly",
        managementAppliesTo: "effectiveIncome",
        debtServiceIncludesPMI: true,
        cashInvestedIncludesClosing: true,
        cashInvestedIncludesRehab: true,
        capRateDenominator: "purchasePrice",
        breakEvenUsesEffectiveIncome: false,
        appreciationMode: "compound",
    },
    delivery: {
        mode: "webhook",
        webhookUrl: "",
        notifyEmail: "",
        includeInputs: true,
        includeResults: true,
        mailSubject: "New ROI lead",
    },
} satisfies Partial<RealEstateRoiMultiStepProps>

addPropertyControls(RealEstateRoiMultiStep as any, {
    currency: {
        type: ControlType.Enum,
        title: "Currency",
        options: ["USD", "EUR", "GBP", "CAD", "AUD", "BAM"],
    },

    toggles: {
        type: ControlType.Object,
        title: "Toggles",
        controls: {
            showSliders: {
                type: ControlType.Boolean,
                title: "Sliders",
                description: "Show range sliders for number inputs",
            },
            showAdvancedInputs: {
                type: ControlType.Boolean,
                title: "Advanced",
                description: "Show closing costs, rehab, PMI fields",
            },
            showExit: {
                type: ControlType.Boolean,
                title: "Exit",
                description: "Show hold period and appreciation fields",
            },
            showDisclaimer: {
                type: ControlType.Boolean,
                title: "Disclaimer",
                description: "Show disclaimer in results",
            },
            requireInteraction: {
                type: ControlType.Boolean,
                title: "Require Touch",
                description: "Require field interaction before complete",
            },
            requireAllVisible: {
                type: ControlType.Boolean,
                title: "Require Visible",
                description: "Require all visible fields to advance",
            },
            allowFreeStepNavigation: {
                type: ControlType.Boolean,
                title: "Free Navigation",
                description: "Allow jumping between steps",
            },
        },
    },

    delivery: {
        type: ControlType.Object,
        title: "Lead Delivery",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                description: "How to deliver lead data",
                options: ["webhook", "mailto", "none"],
                optionTitles: ["Webhook", "Mailto", "None"],
            },
            webhookUrl: {
                type: ControlType.String,
                title: "Webhook URL",
                description: "POST endpoint for lead data (Zapier, Make, etc.)",
                displayTextArea: true,
                placeholder: "https://hooks.zapier.com/hooks/catch/...",
                hidden: (props: any) => props.mode !== "webhook",
            },
            notifyEmail: {
                type: ControlType.String,
                title: "To Email",
                description: "Email address for lead notifications",
                placeholder: "leads@example.com",
                hidden: (props: any) => props.mode !== "mailto",
            },
            mailSubject: {
                type: ControlType.String,
                title: "Subject",
                description: "Email subject line",
                defaultValue: "New ROI lead",
                hidden: (props: any) => props.mode !== "mailto",
            },
            includeInputs: {
                type: ControlType.Boolean,
                title: "Send Inputs",
                description: "Include calculator inputs in payload",
                defaultValue: true,
                hidden: (props: any) => props.mode === "none",
            },
            includeResults: {
                type: ControlType.Boolean,
                title: "Send Results",
                description: "Include calculated results in payload",
                defaultValue: true,
                hidden: (props: any) => props.mode === "none",
            },
        },
    },

    formulas: {
        type: ControlType.Object,
        title: "Formulas",
        controls: {
            vacancyAppliesTo: {
                type: ControlType.Enum,
                title: "Vacancy On",
                description: "Apply vacancy to rent only or all income",
                options: ["rentOnly", "allIncome"],
                optionTitles: ["Rent Only", "All Income"],
            },
            managementAppliesTo: {
                type: ControlType.Enum,
                title: "Mgmt On",
                description: "Calculate management fee on",
                options: ["effectiveIncome", "grossIncome"],
                optionTitles: ["Effective", "Gross"],
            },
            debtServiceIncludesPMI: {
                type: ControlType.Boolean,
                title: "Include PMI",
                description: "Add PMI to debt service",
            },
            cashInvestedIncludesClosing: {
                type: ControlType.Boolean,
                title: "Invested Closing",
                description: "Include closing in cash invested",
            },
            cashInvestedIncludesRehab: {
                type: ControlType.Boolean,
                title: "Invested Rehab",
                description: "Include rehab in cash invested",
            },
            capRateDenominator: {
                type: ControlType.Enum,
                title: "Cap Den",
                description: "Divide NOI by price or cash invested",
                options: ["purchasePrice", "cashInvested"],
                optionTitles: ["Price", "Invested"],
            },
            breakEvenUsesEffectiveIncome: {
                type: ControlType.Boolean,
                title: "Break Even Eff",
                description: "Use effective income for break-even",
            },
            appreciationMode: {
                type: ControlType.Enum,
                title: "Appreciation",
                description: "Compound or simple appreciation",
                options: ["compound", "simple"],
                optionTitles: ["Compound", "Simple"],
            },
        },
    },

    defaults: {
        type: ControlType.Object,
        title: "Defaults",
        controls: {
            startBlank: {
                type: ControlType.Boolean,
                title: "Start Blank",
                description:
                    "Start with empty fields instead of pre-filled default values",
            },

            purchasePrice: {
                type: ControlType.Number,
                title: "Price",
                min: 0,
                max: 50000000,
                step: 5000,
            },
            downPaymentPct: {
                type: ControlType.Number,
                title: "Down %",
                min: 0,
                max: 60,
                step: 0.5,
            },
            interestRatePct: {
                type: ControlType.Number,
                title: "Rate %",
                min: 0,
                max: 12,
                step: 0.05,
            },
            loanTermYears: {
                type: ControlType.Number,
                title: "Term",
                min: 5,
                max: 100,
                step: 1,
            },

            monthlyRent: {
                type: ControlType.Number,
                title: "Rent",
                min: 0,
                max: 50000,
                step: 25,
            },
            vacancyPct: {
                type: ControlType.Number,
                title: "Vac %",
                min: 0,
                max: 25,
                step: 0.5,
            },

            annualTaxes: {
                type: ControlType.Number,
                title: "Taxes",
                min: 0,
                max: 100000,
                step: 100,
            },
            annualInsurance: {
                type: ControlType.Number,
                title: "Ins",
                min: 0,
                max: 50000,
                step: 50,
            },
            monthlyMaintenance: {
                type: ControlType.Number,
                title: "Maint",
                min: 0,
                max: 8000,
                step: 10,
            },
            managementPct: {
                type: ControlType.Number,
                title: "Mgmt %",
                min: 0,
                max: 20,
                step: 0.5,
            },

            closingCosts: {
                type: ControlType.Number,
                title: "Closing",
                min: 0,
                max: 400000,
                step: 500,
            },
            rehabCosts: {
                type: ControlType.Number,
                title: "Rehab",
                min: 0,
                max: 800000,
                step: 500,
            },
            monthlyHOA: {
                type: ControlType.Number,
                title: "HOA",
                min: 0,
                max: 3000,
                step: 10,
            },
            monthlyUtilities: {
                type: ControlType.Number,
                title: "Utilities",
                min: 0,
                max: 3000,
                step: 10,
            },
            monthlyOtherExpenses: {
                type: ControlType.Number,
                title: "Other",
                min: 0,
                max: 6000,
                step: 10,
            },
            monthlyPMI: {
                type: ControlType.Number,
                title: "PMI",
                min: 0,
                max: 3000,
                step: 10,
            },

            holdYears: {
                type: ControlType.Number,
                title: "Hold",
                min: 1,
                max: 20,
                step: 1,
            },
            appreciationPct: {
                type: ControlType.Number,
                title: "Appr %",
                min: -5,
                max: 12,
                step: 0.25,
            },
            sellingCostsPct: {
                type: ControlType.Number,
                title: "Sell %",
                min: 0,
                max: 10,
                step: 0.25,
            },
        },
    },

    styleConfig: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            maxWidth: {
                type: ControlType.Number,
                title: "Max W",
                min: 0,
                max: 1400,
                step: 10,
            },
            maxHeight: {
                type: ControlType.Number,
                title: "Max H",
                min: 300,
                max: 1200,
                step: 25,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 14,
                max: 28,
                step: 1,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 12,
                max: 28,
                step: 1,
            },
            compactness: {
                type: ControlType.Number,
                title: "Compact",
                min: 0,
                max: 1,
                step: 0.05,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                min: 1,
                max: 2,
                step: 1,
            },
            shadowStrength: {
                type: ControlType.Number,
                title: "Shadow",
                min: 0,
                max: 0.28,
                step: 0.01,
            },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            accent: { type: ControlType.Color, title: "Accent" },
            background: { type: ControlType.Color, title: "Bg" },
            card: { type: ControlType.Color, title: "Card" },
            border: { type: ControlType.Color, title: "Border" },
            text: { type: ControlType.Color, title: "Text" },
            subtext: { type: ControlType.Color, title: "Subtext" },
            fieldBg: { type: ControlType.Color, title: "Field" },
            soft: { type: ControlType.Color, title: "Soft" },
            divider: { type: ControlType.Color, title: "Divider" },
            danger: { type: ControlType.Color, title: "Danger" },
        },
    },

    text: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            title: { type: ControlType.String, title: "Title" },
            subtitle: { type: ControlType.String, title: "Subtitle" },
            step1: { type: ControlType.String, title: "Step 1" },
            step2: { type: ControlType.String, title: "Step 2" },
            step3: { type: ControlType.String, title: "Step 3" },
            step4: { type: ControlType.String, title: "Step 4" },
            back: { type: ControlType.String, title: "Back" },
            next: { type: ControlType.String, title: "Next" },
            viewResults: { type: ControlType.String, title: "View Button" },
            submit: { type: ControlType.String, title: "Submit" },
            restart: { type: ControlType.String, title: "Restart" },
            requiredHint: { type: ControlType.String, title: "Required Hint" },
            leadTitle: { type: ControlType.String, title: "Lead Title" },
            leadSubtitle: { type: ControlType.String, title: "Lead Subtitle" },
            nameLabel: { type: ControlType.String, title: "Name Label" },
            emailLabel: { type: ControlType.String, title: "Email Label" },
            successTitle: { type: ControlType.String, title: "Success Title" },
            successBody: { type: ControlType.String, title: "Success Body" },
            errorMissingDelivery: {
                type: ControlType.String,
                title: "Error Missing Delivery",
            },
            errorSubmitFailed: {
                type: ControlType.String,
                title: "Error Submit Failed",
            },
            disclaimer: { type: ControlType.String, title: "Disclaimer" },
        },
    },
    _contact: {
        type: ControlType.Link,
        title: "Need help?",
        defaultValue: "zlatkomarjanovic.zm@gmail.com",
    },
})
