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


// Tally Row: a row of figures that count up once when half of the row is on screen.
// The hidden text always holds the final figures; the counting digits are decoration (aria-hidden).
// Server render, canvas and reduced motion all show the final figures.
// Two skins: Paper (warm paper, green ink, brass rule) and Ink (dark, light text, lime rule). No project tokens: colours and fonts are controls.

interface CounterItem {
    value: number
    prefix: string
    suffix: string
    label: string
    decimals: number
}

interface TallyRowProps {
    items: CounterItem[]
    stat1Value: string
    stat1Label: string
    stat2Value: string
    stat2Label: string
    stat3Value: string
    stat3Label: string
    count: number
    columns: number
    duration: number
    startOn: "view" | "load"
    groupLabel: string
    skin: string
    background?: string
    text?: string
    muted?: string
    line?: string
    numberFont: React.CSSProperties
    labelFont: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: CounterItem[] = [
    { value: 1280, prefix: "", suffix: "", label: "Projects delivered", decimals: 0 },
    { value: 12, prefix: "$", suffix: "M", label: "Raised by our clients", decimals: 0 },
    { value: 98, prefix: "", suffix: "%", label: "Delivered on time", decimals: 0 },
    { value: 8, prefix: "", suffix: " years", label: "In business", decimals: 0 },
]

const SKINS = ["paper", "ink"]

// Colors a skin uses when the Color controls are left empty
const PALETTES: Record<string, Record<string, string>> = {
    paper: { bg: "#F2EEE3", text: "#12261E", muted: "#55594B", line: "#B07A22" },
    ink: { bg: "#0E1117", text: "#F3F1EA", muted: "#9BA3B0", line: "#C6F24E" },
}

const STAGGER_MS = 80
const THRESHOLD = 0.5
const NUMBER_FONT: React.CSSProperties = { fontFamily: '"Hanken Grotesk"', fontWeight: 500 }
const LABEL_FONT: React.CSSProperties = { fontFamily: '"Hanken Grotesk"', fontWeight: 400 }

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// The reset sits inside :where() so every class rule below wins over it.
const CSS = `
.tly{container-type:inline-size;position:relative;width:100%;background:var(--tly-bg);color:var(--tly-text);font-family:var(--tly-l-family);font-weight:var(--tly-l-weight);font-style:var(--tly-l-style);font-size:16px;line-height:24px;-webkit-text-size-adjust:100%}
:where(.tly *,.tly *::before,.tly *::after){box-sizing:border-box}
:where(.tly ul,.tly li,.tly p){margin:0;padding:0;list-style:none}
.tly-list{display:grid;grid-template-columns:repeat(var(--tly-cols),minmax(0,1fr));column-gap:24px;row-gap:40px;width:100%}
.tly-item{min-width:0;border-top:1px solid var(--tly-line);padding-top:20px}
.tly-num{display:grid;width:max-content;max-width:100%;font-family:var(--tly-n-family);font-weight:var(--tly-n-weight);font-style:var(--tly-n-style);font-size:clamp(36px,5.4cqi,72px);line-height:1.1;letter-spacing:-0.02em;font-variant-numeric:tabular-nums lining-nums;font-feature-settings:"tnum" 1,"lnum" 1;white-space:nowrap;color:var(--tly-text)}
.tly-ghost,.tly-live{grid-area:1/1;text-align:left}
.tly-ghost{visibility:hidden}
.tly-unit{font-size:0.5em;letter-spacing:0}
.tly-label{display:block;margin-top:12px;color:var(--tly-muted);overflow-wrap:anywhere}
.tly-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.tly[data-skin="ink"] .tly-item{border-top-width:2px}
@container (max-width:640px){.tly-list{grid-template-columns:repeat(var(--tly-cols-sm),minmax(0,1fr));column-gap:20px;row-gap:32px}}
@container (max-width:280px){.tly-list{grid-template-columns:minmax(0,1fr);column-gap:16px}}
`

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
    const v = typeof n === "number" && isFinite(n) ? Math.round(n) : fallback
    return Math.min(max, Math.max(min, v))
}

function toNumber(n: unknown): number {
    return typeof n === "number" && isFinite(n) ? n : 0
}

function formatNumber(value: number, decimals: number): string {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

function cleanItem(raw: Partial<CounterItem> | null | undefined): CounterItem {
    const r = raw || {}
    return {
        value: toNumber(r.value),
        prefix: typeof r.prefix === "string" ? r.prefix : "",
        suffix: typeof r.suffix === "string" ? r.suffix : "",
        label: typeof r.label === "string" ? r.label : "",
        decimals: clampInt(r.decimals, 0, 4, 0),
    }
}

// Long or spaced suffixes (" months", " in 5") are set smaller than the figure; "M", "%", "k" stay full size.
function isUnit(suffix: string): boolean {
    return /\s|[A-Za-z]{2,}/.test(suffix)
}

function Figure({ prefix, digits, suffix }: { prefix: string; digits: string; suffix: string }) {
    return (
        <>
            {prefix}
            {digits}
            {suffix ? <span className={isUnit(suffix) ? "tly-unit" : undefined}>{suffix}</span> : null}
        </>
    )
}

// CMS figures arrive as text ("€6.2M", "11 weeks", "−19%", "+4.8 pts"): split into prefix, number and suffix.
function parseFigure(raw: string, label: string): CounterItem | null {
    const t = (raw || "").trim()
    const m = /^([^0-9]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(t)
    if (!m) return t ? { value: 0, prefix: "", suffix: "", label, decimals: 0 } : null
    const [, prefix, digits, suffix] = m
    const dot = digits.indexOf(".")
    const decimals = dot < 0 ? 0 : Math.min(4, digits.length - dot - 1)
    const value = parseFloat(digits.replace(/,/g, ""))
    return { value: isFinite(value) ? value : 0, prefix, suffix, label, decimals }
}

function fontVars(prefix: string, font: React.CSSProperties | undefined, fallback: React.CSSProperties, generic: string): Record<string, string | number> {
    const f = font || {}
    const family = f.fontFamily || fallback.fontFamily
    return {
        [`--tly-${prefix}-family`]: `${family}, ${generic}`,
        [`--tly-${prefix}-weight`]: f.fontWeight ?? fallback.fontWeight ?? 400,
        [`--tly-${prefix}-style`]: f.fontStyle ?? "normal",
    }
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 180
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function TallyRow(props: TallyRowProps) {
    const {
        items = DEFAULT_ITEMS,
        stat1Value = "",
        stat1Label = "",
        stat2Value = "",
        stat2Label = "",
        stat3Value = "",
        stat3Label = "",
        count = 4,
        columns = 4,
        duration = 1200,
        startOn = "view",
        groupLabel = "Key figures",
        skin = "paper",
        background,
        text,
        muted,
        line,
        numberFont = NUMBER_FONT,
        labelFont = LABEL_FONT,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)

    const shownCount = clampInt(count, 1, 12, 4)
    // Text figures (CMS) win over the items array; a figure with an empty value is skipped.
    const textList = [parseFigure(stat1Value, stat1Label), parseFigure(stat2Value, stat2Label), parseFigure(stat3Value, stat3Label)].filter(
        (x): x is CounterItem => x !== null
    )
    const list = (textList.length > 0 ? textList : Array.isArray(items) ? items : DEFAULT_ITEMS).slice(0, shownCount).map(cleanItem)
    const cols = Math.min(clampInt(columns, 1, 6, 4), Math.max(1, list.length))
    const colsSm = Math.min(cols, 2)
    const ms = Math.max(0, toNumber(duration))

    // null = show the final figures (server render, canvas, reduced motion, before and after the count).
    const [shown, setShown] = React.useState<number[] | null>(null)
    const key = JSON.stringify(list)

    useIsoLayoutEffect(() => {
        const root = rootRef.current
        if (isStatic || !root || list.length === 0 || ms === 0) return
        if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
        if (startOn === "view" && typeof IntersectionObserver === "undefined") return

        const finals = list.map((it) => it.value)
        // Biggest figure first, the rest follow 80ms apart.
        const order = list.map((_, i) => i).sort((a, b) => Math.abs(finals[b]) - Math.abs(finals[a]) || a - b)
        const delay: number[] = []
        order.forEach((idx, rank) => { delay[idx] = rank * STAGGER_MS })

        let raf = 0
        let observer: IntersectionObserver | null = null
        let t0 = -1
        let cancelled = false

        const tick = (now: number) => {
            if (cancelled) return
            if (t0 < 0) t0 = now
            let done = true
            const next = list.map((it, i) => {
                const p = Math.min(1, Math.max(0, (now - t0 - delay[i]) / ms))
                if (p < 1) done = false
                if (p >= 1) return finals[i]
                const eased = 1 - Math.pow(1 - p, 3)
                const f = Math.pow(10, it.decimals)
                return Math.round(finals[i] * eased * f) / f
            })
            if (done) setShown(null)
            else {
                setShown(next)
                raf = window.requestAnimationFrame(tick)
            }
        }
        const begin = () => {
            raf = window.requestAnimationFrame(tick)
        }

        setShown(finals.map(() => 0))
        if (startOn === "load") begin()
        else {
            observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((e) => e.isIntersecting)) {
                        observer?.disconnect()
                        observer = null
                        begin()
                    }
                },
                { threshold: THRESHOLD }
            )
            observer.observe(root)
        }

        return () => {
            cancelled = true
            if (raf) window.cancelAnimationFrame(raf)
            observer?.disconnect()
            setShown(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, ms, startOn, isStatic])

    const skinKey = SKINS.includes(skin) ? skin : "paper"
    const pal = PALETTES[skinKey]
    const vars = {
        "--tly-bg": background || pal.bg,
        "--tly-text": text || pal.text,
        "--tly-muted": muted || pal.muted,
        "--tly-line": line || pal.line,
        "--tly-cols": cols,
        "--tly-cols-sm": colsSm,
        ...fontVars("n", numberFont, NUMBER_FONT, "ui-sans-serif, system-ui, sans-serif"),
        ...fontVars("l", labelFont, LABEL_FONT, "ui-sans-serif, system-ui, sans-serif"),
    } as React.CSSProperties

    return (
        <div ref={rootRef} className="tly" data-skin={skinKey} style={{ ...style, ...vars }} data-state={shown ? "counting" : "final"}>
            <style>{CSS}</style>
            <div role="group" aria-label={groupLabel}>
                <ul role="list" className="tly-list">
                    {list.map((it, i) => {
                        const finalDigits = formatNumber(it.value, it.decimals)
                        const liveDigits = shown ? formatNumber(shown[i] ?? 0, it.decimals) : finalDigits
                        return (
                            <li key={i} className="tly-item" data-item={i}>
                                <span className="tly-sr" data-final>
                                    {it.prefix}
                                    {finalDigits}
                                    {it.suffix} {it.label}
                                </span>
                                <span aria-hidden="true">
                                    <span className="tly-num">
                                        <span className="tly-ghost">
                                            <Figure prefix={it.prefix} digits={finalDigits} suffix={it.suffix} />
                                        </span>
                                        <span className="tly-live" data-live>
                                            <Figure prefix={it.prefix} digits={liveDigits} suffix={it.suffix} />
                                        </span>
                                    </span>
                                    <span className="tly-label">{it.label}</span>
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

TallyRow.displayName = "TallyRow"

addPropertyControls(TallyRow, {
    items: {
        type: ControlType.Array,
        title: "Items",
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                value: { type: ControlType.Number, title: "Value", defaultValue: 0, min: -1000000000, max: 1000000000, step: 1 },
                prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
                suffix: { type: ControlType.String, title: "Suffix", defaultValue: "" },
                label: { type: ControlType.String, title: "Label", defaultValue: "Label" },
                decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 4, step: 1, displayStepper: true },
            },
        },
    },
    stat1Value: { type: ControlType.String, title: "Figure 1", defaultValue: "", description: "Text such as $6.2M. When any figure is set it replaces Items." },
    stat1Label: { type: ControlType.String, title: "Label 1", defaultValue: "" },
    stat2Value: { type: ControlType.String, title: "Figure 2", defaultValue: "" },
    stat2Label: { type: ControlType.String, title: "Label 2", defaultValue: "" },
    stat3Value: { type: ControlType.String, title: "Figure 3", defaultValue: "" },
    stat3Label: { type: ControlType.String, title: "Label 3", defaultValue: "" },
    count: { type: ControlType.Number, title: "Show", defaultValue: 4, min: 1, max: 12, step: 1, displayStepper: true },
    columns: { type: ControlType.Number, title: "Columns", defaultValue: 4, min: 1, max: 6, step: 1, displayStepper: true },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 1200, min: 0, max: 3000, step: 100, unit: "ms" },
    startOn: {
        type: ControlType.Enum,
        title: "Start on",
        options: ["view", "load"],
        optionTitles: ["View", "Load"],
        defaultValue: "view",
        displaySegmentedControl: true,
    },
    groupLabel: { type: ControlType.String, title: "Group label", defaultValue: "Key figures" },
    skin: {
        type: ControlType.Enum,
        title: "Skin",
        options: SKINS,
        optionTitles: ["Paper", "Ink"],
        defaultValue: "paper",
        displaySegmentedControl: true,
    },
    background: { type: ControlType.Color, title: "Background", description: "Empty uses the skin color" },
    text: { type: ControlType.Color, title: "Text", description: "Empty uses the skin color" },
    muted: { type: ControlType.Color, title: "Muted", description: "Empty uses the skin color" },
    line: { type: ControlType.Color, title: "Line", description: "Empty uses the skin color" },
    numberFont: {
        type: ControlType.Font,
        title: "Number font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
})
