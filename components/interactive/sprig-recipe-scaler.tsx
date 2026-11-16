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

import type { CSSProperties } from "react"

// One ingredient per line: amount | unit | description
// "200 | g | plain flour"          scales and converts (ml <-> fl oz, g <-> oz, written in either system)
// "2 | clove/cloves | garlic"      unit with singular/plural
// "0.5 | | lemon, juiced"          amount without unit
// "| | Salt, to taste"             no amount, shown as written

type Line = { qty: number | null; one: string; many: string; text: string }

function parse(lines: string): Line[] {
    return (lines || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
            const parts = l.split("|").map((p) => p.trim())
            if (parts.length < 3) return { qty: null, one: "", many: "", text: l }
            const qty = parts[0] === "" ? null : Number(parts[0].replace(",", "."))
            const [one, many] = parts[1].split("/").map((u) => u.trim())
            return {
                qty: qty !== null && !isNaN(qty) ? qty : null,
                one: one || "",
                many: many || one || "",
                text: parts.slice(2).join("|").trim(),
            }
        })
}

const FRACTIONS: [number, string][] = [
    [0.25, "¼"],
    [0.33, "⅓"],
    [0.5, "½"],
    [0.67, "⅔"],
    [0.75, "¾"],
]

// Only metric measures (ml, g) are rounded to the nearest 5 above 20; counted things and ounces stay exact.
function pretty(n: number, kind: "metric" | "us" | "count", tiny: string): string {
    if (kind === "metric" && n >= 20) return String(Math.round(n / 5) * 5)
    if (n >= 10) return String(Math.round(n))
    const whole = Math.floor(n + 0.001)
    const rest = n - whole
    if (rest < 0.13) return String(Math.max(whole, 0) || (n > 0 ? (kind === "count" ? "¼" : tiny) : "0"))
    if (rest > 0.87) return String(whole + 1)
    let best = FRACTIONS[0]
    for (const f of FRACTIONS) if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f
    return (whole > 0 ? whole + " " : "") + best[1]
}

function amount(line: Line, factor: number, us: boolean, tiny: string): string {
    if (line.qty === null) return ""
    let q = line.qty * factor
    let one = line.one
    let many = line.many
    // Converts both ways: write the recipe in ml and g, or in fl oz and oz, and the other system is worked out.
    const u = one.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ")
    if (us && u === "ml") {
        q = q / 29.57
        one = many = "fl oz"
    } else if (us && u === "g") {
        q = q / 28.35
        one = many = "oz"
    } else if (!us && (u === "fl oz" || u === "floz")) {
        q = q * 29.57
        one = many = "ml"
    } else if (!us && u === "oz") {
        q = q * 28.35
        one = many = "g"
    }
    const unit = q > 1.12 ? many : one
    const short = ["ml", "g", "fl oz", "oz"].includes(unit)
    const text = pretty(q, unit === "ml" || unit === "g" ? "metric" : short ? "us" : "count", tiny)
    return short ? `${text} ${unit}` : unit ? `${text}|${unit}` : text
}

const STORE_KEY = "recipe-scaler-units"

function savedUnits(): string | null {
    try {
        const v = window.localStorage.getItem(STORE_KEY)
        return v === "us" || v === "metric" ? v : null
    } catch (e) {
        return null
    }
}

// US units are the default only for visitors who are in the United States. The browser's time zone says where someone is;
// its language does not (many people outside the US run their browser in US English).
const US_ZONES = /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak|Menominee|Indianapolis|Fort_Wayne|Knox_IN|Louisville|Shiprock|Puerto_Rico|St_Thomas|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/(Honolulu|Guam|Saipan|Pago_Pago)|US\/.+)$/

function prefersUS(): boolean {
    try {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (zone) return US_ZONES.test(zone)
        return /[-_]US\b/i.test((typeof navigator !== "undefined" && navigator.language) || "")
    } catch (e) {
        return false
    }
}

// Drawn icons, so the strokes sit exactly in the middle of the round buttons.
function StepIcon({ plus }: { plus?: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style={{ display: "block" }}>
            <path d={plus ? "M1 7h12M7 1v12" : "M1 7h12"} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square" />
        </svg>
    )
}

type RecipeScalerProps = {
    lines: string
    baseServings: number
    serving: string
    maxServings: number
    showUnits: boolean
    showCopy: boolean
    showPrint: boolean
    units: "auto" | "metric" | "us"
    title: string
    method: string
    heading: string
    methodHeading: string
    makesLabel: string
    unitsLabel: string
    metricLabel: string
    usLabel: string
    printLabel: string
    copyLabel: string
    copiedLabel: string
    backLabel: string
    fewerLabel: string
    moreLabel: string
    tinyLabel: string
    ink: string
    accent: string
    rule: string
    surface: string
    headingFont?: CSSProperties
    bodyFont?: CSSProperties
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 560
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function RecipeScaler(props: RecipeScalerProps) {
    const {
        lines, baseServings, serving, maxServings, showUnits, showCopy, showPrint, units, title, method,
        heading, methodHeading, makesLabel, unitsLabel, metricLabel, usLabel, printLabel, copyLabel, copiedLabel, backLabel, fewerLabel, moreLabel, tinyLabel,
        ink, accent, rule, surface, headingFont, bodyFont, style,
    } = props
    const [servingOne, servingManyRaw] = String(serving || "serving/servings").split("/").map((x) => x.trim())
    const servingMany = servingManyRaw || servingOne
    const base = Math.max(1, Math.round(baseServings || 1))
    const [n, setN] = useState(Math.min(base, maxServings))
    const [us, setUs] = useState(units === "us")
    // "Auto" starts in metric and switches to US units for visitors in a United States time zone.
    useEffect(() => {
        if (units === "us") setUs(true)
        else if (units === "metric") setUs(false)
        else {
            // A visitor's own choice, made on any recipe, wins over the time zone.
            const saved = savedUnits()
            if (saved) setUs(saved === "us")
            else if (prefersUS()) setUs(true)
        }
    }, [units])
    const pick = (value: boolean) => {
        setUs(value)
        try { window.localStorage.setItem(STORE_KEY, value ? "us" : "metric") } catch (e) {}
    }
    const [copied, setCopied] = useState(false)
    // The confirmation is cleared after a moment; nothing runs once the component has left the page.
    const copiedTimer = useRef<number | undefined>(undefined)
    const mounted = useRef(true)
    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
            window.clearTimeout(copiedTimer.current)
        }
    }, [])
    // A new base serving count (another recipe, or a change in the panel) starts over from that count.
    useEffect(() => setN(Math.min(base, maxServings)), [base, maxServings])
    const parsed = useMemo(() => parse(lines), [lines])
    const factor = n / base
    const rows = parsed.map((l) => {
        const [a, unit] = amount(l, factor, us, tinyLabel).split("|")
        // a description that starts with a comma joins its unit without a space: "½ lemon, juiced"
        return { amount: a, text: unit ? (l.text.startsWith(",") ? `${unit}${l.text}` : `${unit} ${l.text}`) : l.text }
    })
    const steps = String(method || "").split("\n").map((l) => l.trim()).filter(Boolean)
    const serif = headingFont?.fontFamily || "serif"
    const sans = bodyFont?.fontFamily || "sans-serif"
    const servingName = (count: number) => `${count} ${count === 1 ? servingOne : servingMany}`

    const copy = () => {
        const text = rows.map((r) => (r.amount ? `${r.amount} ${r.text}` : r.text)).join("\n")
        if (typeof navigator === "undefined" || !navigator.clipboard) return
        navigator.clipboard.writeText(text).then(() => {
            if (!mounted.current) return
            setCopied(true)
            window.clearTimeout(copiedTimer.current)
            copiedTimer.current = window.setTimeout(() => setCopied(false), 1800)
        }).catch(() => {})
    }

    const label = {
        fontFamily: bodyFont?.fontFamily, fontSize: 12, fontWeight: 500, letterSpacing: "0.1em",
        textTransform: "uppercase" as const, color: ink, opacity: 0.8, margin: 0,
    }
    const round = {
        width: 40, height: 40, borderRadius: 100, border: `1px solid ${rule}`, background: "transparent",
        color: ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
    }
    const big = { fontFamily: headingFont?.fontFamily, fontWeight: headingFont?.fontWeight, fontSize: 28, lineHeight: 1.1, color: ink, margin: 0 }

    return (
        <div className="recipe-scaler" style={{ ...style, display: "flex", flexDirection: "column", gap: 24, width: "100%", "--rs-ink": ink, "--rs-accent": accent, "--rs-rule": rule, "--rs-surface": surface, "--rs-serif": serif, "--rs-sans": sans } as CSSProperties}>
            <style>{`
                .recipe-scaler button { font: inherit; }
                .recipe-scaler button:focus-visible { outline: 2px solid var(--rs-ink); outline-offset: 3px; }
                .recipe-scaler .seg { display: inline-flex; gap: 8px; }
                .recipe-scaler .seg button { border: 1px solid var(--rs-rule); border-radius: 0; background: transparent; color: var(--rs-ink); cursor: pointer; padding: 9px 14px; margin: 0; transition: background 0.3s, color 0.3s; }
                .recipe-scaler .seg button[aria-pressed="true"] { background: var(--rs-ink); border-color: var(--rs-ink); color: var(--rs-surface); cursor: default; pointer-events: none; }
                .recipe-scaler .seg .u { position: relative; display: inline-block; }
                .recipe-scaler .seg .u::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform 0.5s cubic-bezier(.2,.8,.2,1); }
                @media (hover: hover) { .recipe-scaler .seg button[aria-pressed="false"]:hover .u::after { transform: scaleX(1); } }
                .recipe-scaler .act { border: 0; background: transparent; padding: 0; margin: 0; cursor: pointer; color: var(--rs-ink); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 5px; transition: color 0.3s; }
                .recipe-scaler .act:hover { color: var(--rs-accent); }
                .recipe-scaler .ing { display: flex; align-items: baseline; gap: 12px; padding: 12px 0; }
                .recipe-scaler .ing-line { flex: 1; min-width: 20px; height: 0; border-top: 1px solid var(--rs-rule); }
                .recipe-scaler .ing-what { flex: none; max-width: 70%; text-align: right; text-wrap: balance; }
                .recipe-scaler .back { animation: recipe-scaler-in 0.4s cubic-bezier(.2,.8,.2,1); white-space: nowrap; }
                @keyframes recipe-scaler-in { from { opacity: 0; } to { opacity: 1; } }
                .recipe-scaler .step { transition: border-color 0.3s, transform 0.2s cubic-bezier(.2,.8,.2,1); }
                .recipe-scaler .step:disabled { cursor: default !important; }
                @media (hover: hover) { .recipe-scaler .step:not(:disabled):hover { border-color: var(--rs-ink) !important; } }
                .recipe-scaler .step:not(:disabled):active { transform: scale(0.9); border-color: var(--rs-ink) !important; }
                @media (prefers-reduced-motion: reduce) { .recipe-scaler .step:not(:disabled):active { transform: none; } }
                /* Printing: the sheet lives inside the component. Everything on the page that does not hold the sheet is left out. */
                .recipe-scaler-sheet { display: none; }
                @media print {
                    @page { size: A4; margin: 16mm 18mm; }
                    html, body { background: #fff !important; }
                    body *:not(:has(.recipe-scaler-sheet), .recipe-scaler-sheet, .recipe-scaler-sheet *) { display: none !important; }
                    body *:has(.recipe-scaler-sheet) { display: block !important; position: static !important; width: auto !important; max-width: none !important; height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; transform: none !important; background: #fff !important; }
                    .recipe-scaler-sheet { display: block !important; color: var(--rs-ink); font: 400 10.5pt/1.5 var(--rs-sans); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .recipe-scaler-sheet h1 { font: 400 34pt/1.04 var(--rs-serif); letter-spacing: -.025em; margin: 0 0 10pt; text-wrap: balance; }
                    .recipe-scaler-sheet .makes { font: 500 7.5pt/1.3 var(--rs-sans); letter-spacing: .12em; text-transform: uppercase; margin: 0 0 26pt; }
                    .recipe-scaler-sheet .cols { display: grid; grid-template-columns: 62mm 1fr; column-gap: 12mm; align-items: start; }
                    .recipe-scaler-sheet h2 { font: italic 400 15pt/1.15 var(--rs-serif); margin: 0; padding: 9pt 0 10pt; border-top: 1px solid var(--rs-ink); }
                    .recipe-scaler-sheet ul, .recipe-scaler-sheet ol { list-style: none; margin: 0; padding: 0; }
                    .recipe-scaler-sheet li { display: flex; gap: 8pt; padding: 7pt 0; border-top: 1px solid var(--rs-rule); break-inside: avoid; }
                    .recipe-scaler-sheet li > span:first-child { flex: 0 0 46pt; font: 400 11.5pt/1.35 var(--rs-serif); color: var(--rs-accent); }
                    .recipe-scaler-sheet li > span:last-child { flex: 1; }
                }
            `}</style>
            {heading ? <h2 style={{ ...headingFont, color: ink, margin: 0 }}>{heading}</h2> : null}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 0", borderTop: `1px solid ${rule}`, borderBottom: showUnits ? "none" : `1px solid ${rule}` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {/* the way back sits on the label row, so nothing below moves when it appears */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 14, minHeight: 16 }}>
                        <p style={label}>{makesLabel}</p>
                        {n !== base && (
                            <button type="button" className="act back" style={{ ...label, opacity: 1, color: undefined }} onClick={() => setN(base)}>{backLabel} {servingName(base)}</button>
                        )}
                    </div>
                    <p aria-live="polite" aria-atomic="true" style={big}>{servingName(n)}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="step" aria-label={fewerLabel} style={{ ...round, opacity: n <= 1 ? 0.35 : 1 }} disabled={n <= 1} onClick={() => { if (!(n <= 1)) setN(Math.max(1, n - 1)) }}><StepIcon /></button>
                    <button type="button" className="step" aria-label={moreLabel} style={{ ...round, opacity: n >= maxServings ? 0.35 : 1 }} disabled={n >= maxServings} onClick={() => { if (!(n >= maxServings)) setN(Math.min(maxServings, n + 1)) }}><StepIcon plus /></button>
                </div>
            </div>
            {showUnits && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", borderTop: `1px solid ${rule}`, borderBottom: `1px solid ${rule}`, marginTop: -24 }}>
                    <p style={label}>{unitsLabel}</p>
                    <div className="seg" role="group" aria-label={unitsLabel}>
                        <button type="button" style={{ ...label, opacity: 1, color: undefined }} aria-pressed={!us} onClick={() => pick(false)}><span className="u">{metricLabel}</span></button>
                        <button type="button" style={{ ...label, opacity: 1, color: undefined }} aria-pressed={us} onClick={() => pick(true)}><span className="u">{usLabel}</span></button>
                    </div>
                </div>
            )}
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
                {rows.map((r, i) => (
                    // Amount, then a thin line on the text's baseline that runs to the ingredient at the right edge.
                    <li key={i} className="ing" style={{ ...bodyFont, color: ink }}>
                        {r.amount ? <span style={{ flex: "none", fontFamily: headingFont?.fontFamily, color: accent, fontVariantNumeric: "tabular-nums" }}>{r.amount}</span> : null}
                        <span aria-hidden="true" className="ing-line" />
                        <span className="ing-what">{r.text}</span>
                    </li>
                ))}
            </ul>
            {(showPrint || showCopy) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", alignItems: "center" }}>
                    {showPrint && (
                        <button type="button" className="act" style={{ ...label, opacity: 1, color: undefined }} onClick={() => window.print()}>{printLabel}</button>
                    )}
                    {showCopy && (
                        <button type="button" className="act" style={{ ...label, opacity: 1, color: undefined }} aria-live="polite" onClick={copy}>{copied ? copiedLabel : copyLabel}</button>
                    )}
                </div>
            )}
            {showPrint && (
                <div className="recipe-scaler-sheet">
                    {title ? <h1>{title}</h1> : null}
                    <p className="makes">{makesLabel} {servingName(n)}</p>
                    <div className="cols">
                        <div>
                            <h2>{heading}</h2>
                            <ul>{rows.map((r, i) => <li key={i}><span>{r.amount}</span><span>{r.text}</span></li>)}</ul>
                        </div>
                        {steps.length ? (
                            <div>
                                <h2>{methodHeading}</h2>
                                <ol>{steps.map((t, i) => <li key={i}><span>{i + 1}</span><span>{t}</span></li>)}</ol>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}

RecipeScaler.defaultProps = {
    lines: "200 | g | plain flour\n300 | ml | whole milk\n2 | egg/eggs | at room temperature\n0.5 | | lemon, zested\n| | Salt, a good pinch",
    baseServings: 4, serving: "serving/servings", maxServings: 24,
    showUnits: true, showCopy: true, showPrint: true, units: "auto", title: "Lemon pancakes", method: "Whisk the flour, milk and eggs until smooth.\nStir in the zest and the salt, then rest for ten minutes.\nFry in a hot pan until golden on both sides.",
    heading: "Ingredients", methodHeading: "Method", makesLabel: "Makes", unitsLabel: "Units", metricLabel: "Metric", usLabel: "US",
    printLabel: "Print recipe", copyLabel: "Copy list", copiedLabel: "Copied to clipboard", backLabel: "Back to", fewerLabel: "Fewer", moreLabel: "More", tinyLabel: "a little",
    ink: "#14251F", accent: "#8C2F2B", rule: "rgba(20,37,31,0.25)", surface: "#F5F1E8",
}

addPropertyControls(RecipeScaler, {
    lines: { type: ControlType.String, title: "Lines", displayTextArea: true, description: "One ingredient per line: amount | unit | description. Example: 200 | g | plain flour. Plurals: 2 | clove/cloves | garlic." },
    baseServings: { type: ControlType.Number, title: "Base servings", min: 1, max: 48, step: 1, displayStepper: true },
    serving: { type: ControlType.String, title: "Serving", description: "Singular/plural, for example glass/glasses." },
    maxServings: { type: ControlType.Number, title: "Max", min: 2, max: 96, step: 1 },
    units: { type: ControlType.Enum, title: "Units", options: ["auto", "metric", "us"], optionTitles: ["Auto", "Metric", "US"], description: "Auto shows US units to visitors in a United States time zone and metric to everyone else." },
    showUnits: { type: ControlType.Boolean, title: "Unit toggle" },
    showCopy: { type: ControlType.Boolean, title: "Copy button" },
    showPrint: { type: ControlType.Boolean, title: "Print button" },
    title: { type: ControlType.String, title: "Title", description: "Printed at the top of the sheet. Bind it to the recipe's title in the CMS.", hidden: (p) => !p.showPrint },
    method: { type: ControlType.String, title: "Method", displayTextArea: true, description: "One step per line. Printed under the method heading.", hidden: (p) => !p.showPrint },
    headingFont: { type: ControlType.Font, title: "Heading font", controls: "extended", defaultFontType: "serif", defaultValue: { fontSize: 30, lineHeight: 1.15, letterSpacing: "-0.01em" } },
    bodyFont: { type: ControlType.Font, title: "Body font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 17, lineHeight: 1.45 } },
    ink: { type: ControlType.Color, title: "Text" },
    accent: { type: ControlType.Color, title: "Accent" },
    rule: { type: ControlType.Color, title: "Rules" },
    surface: { type: ControlType.Color, title: "Active text", description: "Text on the selected unit button." },
    heading: { type: ControlType.String, title: "Heading" },
    methodHeading: { type: ControlType.String, title: "Method heading", hidden: (p) => !p.showPrint },
    makesLabel: { type: ControlType.String, title: "Makes" },
    backLabel: { type: ControlType.String, title: "Back to" },
    unitsLabel: { type: ControlType.String, title: "Units label" },
    metricLabel: { type: ControlType.String, title: "Metric" },
    usLabel: { type: ControlType.String, title: "US" },
    printLabel: { type: ControlType.String, title: "Print" },
    copyLabel: { type: ControlType.String, title: "Copy" },
    copiedLabel: { type: ControlType.String, title: "Copied" },
    fewerLabel: { type: ControlType.String, title: "Fewer", description: "Read out by screen readers." },
    moreLabel: { type: ControlType.String, title: "More", description: "Read out by screen readers." },
    tinyLabel: { type: ControlType.String, title: "Tiny amount", description: "Shown when a measure scales down to almost nothing." },
})
