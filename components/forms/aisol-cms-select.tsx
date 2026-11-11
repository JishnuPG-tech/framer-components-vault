// build: R-cms-select (2026-10-07) — read-only CMS slot (P1): option labels read from a Collection List, our own <select> drawn
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from "react"

type ColorValue = string | { value?: string }

interface Option {
    label: string
    value: string
}

interface Resolved {
    itemSlots: ReactNode[]
    labelLayer: string
    valueLayer: string
    options: string[]
    extraOptions: string[]
    name: string
    placeholder: string
    accessibleName: string
    required: boolean
    defaultValue: string
    urlParam: string
    font: CSSProperties
    textSize: number
    height: number
    radius: number
    text: ColorValue
    muted: ColorValue
    fill: ColorValue
    border: ColorValue
    focus: ColorValue
    style?: CSSProperties
}

interface FieldGroup {
    name: string
    placeholder: string
    accessibleName: string
    required: boolean
}

interface LookGroup {
    font: CSSProperties
    textSize: number
    height: number
    radius: number
    text: ColorValue
    muted: ColorValue
    fill: ColorValue
    border: ColorValue
    focus: ColorValue
}

// Props as the property panel sends them (Field and Style grouped).
interface Props {
    itemSlots: ReactNode[]
    labelLayer: string
    valueLayer: string
    options: string[]
    extraOptions: string[]
    defaultValue: string
    urlParam: string
    field: Partial<FieldGroup>
    look: Partial<LookGroup>
    style?: CSSProperties
}

const DEMO_OPTIONS = ["Design Systems in Practice", "Digital Product Design", "Creative Front-End Development", "Data-Informed Product Decisions"]

const DEFAULTS: Resolved = {
    itemSlots: [],
    labelLayer: "Option",
    valueLayer: "Value",
    options: DEMO_OPTIONS,
    extraOptions: [],
    name: "course",
    placeholder: "Choose a course",
    accessibleName: "Course",
    required: true,
    defaultValue: "",
    urlParam: "course",
    font: {},
    textSize: 15,
    height: 48,
    radius: 8,
    text: "rgb(28, 32, 30)",
    muted: "rgb(104, 112, 106)",
    fill: "rgb(255, 255, 255)",
    border: "rgb(214, 219, 211)",
    focus: "rgb(23, 91, 82)",
}

// Controls arrive grouped (Field, Style); a flat prop of the same name also works.
const GROUPS = ["field", "look"]

function withDefaults(input: Partial<Props>): Resolved {
    const out = { ...DEFAULTS } as Resolved
    const flat: Record<string, unknown> = { ...input }
    for (const g of GROUPS) {
        const v = (input as Record<string, unknown>)[g]
        if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(flat, v as Record<string, unknown>)
    }
    for (const key of Object.keys(DEFAULTS) as (keyof Resolved)[]) {
        const v = flat[key]
        if (v !== undefined && v !== null) (out as unknown as Record<string, unknown>)[key] = v
    }
    out.style = input.style
    return out
}

function color(v: ColorValue | undefined, fallback: string): string {
    if (typeof v === "string" && v) return v
    if (v && typeof v === "object" && typeof v.value === "string" && v.value) return v.value
    return fallback
}

function bounded(n: unknown, fallback: number, min: number, max: number): number {
    const v = typeof n === "number" && isFinite(n) ? n : fallback
    return Math.min(max, Math.max(min, v))
}

function normalize(s: string): string {
    return String(s || "").trim().toLowerCase()
}

// "Design Systems in Practice" and "design-systems-in-practice" both match the same option.
function slugify(s: string): string {
    return String(s || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

function slotsOf(value: ReactNode[] | undefined): ReactNode[] {
    const out: ReactNode[] = []
    const src = Array.isArray(value) ? value : []
    for (let i = 0; i < src.length; i += 1) {
        const s = src[i]
        if (s !== null && s !== undefined && typeof s !== "boolean") out.push(s)
    }
    return out
}

// Manual options plus extra options, deduplicated by label. Order: given order.
function mergeOptions(base: Option[], extra: string[]): Option[] {
    const out: Option[] = []
    const seen: Record<string, true> = {}
    const add = (o: Option) => {
        const label = String(o.label || "").trim()
        if (!label || seen[label]) return
        seen[label] = true
        out.push({ label, value: String(o.value || "").trim() || label })
    }
    base.forEach(add)
    ;(Array.isArray(extra) ? extra : []).forEach((s) => add({ label: s, value: s }))
    return out
}

function manualOptions(p: Resolved): Option[] {
    return (Array.isArray(p.options) ? p.options : []).map((s) => ({ label: String(s || ""), value: String(s || "") }))
}

// ---------------------------------------------------------------- CMS read (live only, own source box, never written)
function layerText(item: Element, layer: string): string {
    const want = normalize(layer)
    if (!want) return ""
    const all = item.querySelectorAll("[data-framer-name]")
    for (let i = 0; i < all.length; i += 1) {
        const el = all[i]
        if (normalize(String(el.getAttribute("data-framer-name") || "")) === want) return String(el.textContent || "").trim()
    }
    return ""
}

// True when el sits in a layer with this name, looking up only as far as our own source box.
function insideLayer(el: Element, box: HTMLElement, name: string): boolean {
    for (let up: Element | null = el; up && up !== box; up = up.parentElement) {
        if (normalize(String(up.getAttribute("data-framer-name") || "")) === name) return true
    }
    return false
}

// One option per text layer named like the Option layer; its Value layer is looked up inside the same CMS item.
function scanBox(box: HTMLElement, labelLayer: string, valueLayer: string): Option[] {
    const out: Option[] = []
    const want = normalize(labelLayer)
    const labels = want ? Array.from(box.querySelectorAll("[data-framer-name]")).filter((el) => normalize(String(el.getAttribute("data-framer-name") || "")) === want) : []
    if (labels.length > 0) {
        const isLabel = (el: Element) => normalize(String(el.getAttribute("data-framer-name") || "")) === want
        const labelsIn = (el: Element) => Array.from(el.querySelectorAll("[data-framer-name]")).filter(isLabel).length
        for (const el of labels) {
            const label = String(el.textContent || "").trim()
            if (!label) continue
            // Item root = the widest ancestor that still holds only this one label (stays inside its CMS item).
            let item: Element = el
            while (item.parentElement && item.parentElement !== box && labelsIn(item.parentElement) === 1) item = item.parentElement
            out.push({ label, value: layerText(item, valueLayer) || label })
        }
        return out
    }
    // Fallback: one option per paragraph or heading text, skipping texts inside a Value layer.
    const skip = normalize(valueLayer)
    const texts = box.querySelectorAll("p, h1, h2, h3, h4, h5, h6")
    for (let i = 0; i < texts.length; i += 1) {
        const t = texts[i]
        if (skip && insideLayer(t, box, skip)) continue
        const label = String(t.textContent || "").trim()
        if (label) out.push({ label, value: label })
    }
    return out
}

function batchedObserver(cb: () => void, relevant?: (records: MutationRecord[]) => boolean): MutationObserver {
    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const fire = () => {
        frame = 0
        timer = undefined
        cb()
    }
    const mo = new MutationObserver((records) => {
        if (frame || timer !== undefined || (relevant && !relevant(records))) return
        if (typeof requestAnimationFrame === "function" && !document.hidden) frame = requestAnimationFrame(fire)
        else timer = setTimeout(fire, 100)
    })
    const stop = mo.disconnect.bind(mo)
    mo.disconnect = () => {
        if (frame) cancelAnimationFrame(frame)
        if (timer !== undefined) clearTimeout(timer)
        frame = 0
        timer = undefined
        stop()
    }
    return mo
}

function useCmsOptions(boxRef: MutableRefObject<HTMLDivElement | null>, enabled: boolean, labelLayer: string, valueLayer: string): Option[] | null {
    const [rows, setRows] = useState<Option[] | null>(null)
    useEffect(() => {
        const box = boxRef.current
        if (!enabled || !box) {
            setRows(null)
            return
        }
        let lastKey = ""
        const run = () => {
            const next = scanBox(box, labelLayer, valueLayer)
            const key = JSON.stringify(next)
            if (key !== lastKey) {
                lastKey = key
                setRows(next)
            }
        }
        run()
        // Observed range = our source box only; nothing here writes inside it, so it cannot re-trigger itself.
        const mo = batchedObserver(run)
        mo.observe(box, { childList: true, subtree: true, characterData: true })
        return () => mo.disconnect()
    }, [enabled, labelLayer, valueLayer])
    return rows
}

// ---------------------------------------------------------------- view
// One static sheet for every instance: no interpolation, no child combinators or quotes (SSR-safe).
const ACS_CSS = `
.acs-root { position: relative; width: 100%; min-width: 0; font-family: var(--acs-font); font-size: var(--acs-size); }
.acs-root * { box-sizing: border-box; }
.acs-sel { appearance: none; -webkit-appearance: none; display: block; width: 100%; height: var(--acs-h); margin: 0; padding: 0 calc(var(--acs-size) * 2.6) 0 calc(var(--acs-size) * 0.9); background: var(--acs-fill); color: var(--acs-text); border: 1px solid var(--acs-border); border-radius: var(--acs-radius); font: inherit; font-family: var(--acs-font); font-size: 1em; line-height: 1.4; outline: none; cursor: pointer; text-overflow: ellipsis; }
.acs-sel:hover { border-color: var(--acs-muted); }
.acs-sel:focus-visible { border-color: var(--acs-focus); box-shadow: 0 0 0 1px var(--acs-focus), 0 0 0 4px var(--acs-ring); }
.acs-empty { color: var(--acs-muted); }
.acs-sel option { color: var(--acs-text); background: var(--acs-fill); }
.acs-arrow { position: absolute; right: calc(var(--acs-size) * 0.95); top: 50%; width: 0.8em; height: 0.8em; margin-top: -0.4em; pointer-events: none; color: var(--acs-muted); }
.acs-src { display: none; }
.acs-hint { margin: 0.5em 0 0; color: var(--acs-muted); font-family: var(--acs-font); font-size: 0.889em; line-height: 1.45; }
`

interface ViewInput {
    p: Resolved
    options: Option[]
    value: string
    onChange?: (v: string) => void
    slots: ReactNode[]
    boxRef?: MutableRefObject<HTMLDivElement | null>
    hint: string
}

function rootStyle(p: Resolved): CSSProperties {
    const size = bounded(p.textSize, 15, 11, 24)
    const focus = color(p.focus, DEFAULTS.focus as string)
    return {
        ...p.style,
        "--acs-size": `${size}px`,
        "--acs-h": `${bounded(p.height, 48, 32, 80)}px`,
        "--acs-radius": `${bounded(p.radius, 8, 0, 40)}px`,
        "--acs-text": color(p.text, DEFAULTS.text as string),
        "--acs-muted": color(p.muted, DEFAULTS.muted as string),
        "--acs-fill": color(p.fill, DEFAULTS.fill as string),
        "--acs-border": color(p.border, DEFAULTS.border as string),
        "--acs-focus": focus,
        "--acs-ring": `color-mix(in srgb, ${focus} 22%, transparent)`,
        "--acs-font": (p.font && (p.font as CSSProperties).fontFamily) || "Inter, system-ui, -apple-system, sans-serif",
    } as CSSProperties
}

function SelectView({ p, options, value, onChange, slots, boxRef, hint }: ViewInput) {
    const font = (p.font || {}) as CSSProperties
    const name = String(p.accessibleName || "").trim()
    return (
        <div className="acs-root" style={rootStyle(p)}>
            <style>{ACS_CSS}</style>
            <select
                className={value ? "acs-sel" : "acs-sel acs-empty"}
                name={String(p.name || "").trim() || undefined}
                required={!!p.required}
                aria-label={name || undefined}
                value={value}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                style={{ ...font, fontFamily: "var(--acs-font)", fontSize: "1em" }}
            >
                <option value="">{p.placeholder}</option>
                {options.map((o) => (
                    <option key={o.label} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <svg className="acs-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                <path d="M2 4.25l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {hint ? <p className="acs-hint">{hint}</p> : null}
            {slots.length > 0 ? (
                <div className="acs-src" ref={boxRef} aria-hidden="true">
                    {slots}
                </div>
            ) : null}
        </div>
    )
}

// ---------------------------------------------------------------- static renderer (canvas, server)
// No DOM reads, observers or URL reads. With a CMS list in the slot, the field shows the manual options until live.
function StaticSelect(p: Resolved) {
    const slots = slotsOf(p.itemSlots)
    const options = mergeOptions(manualOptions(p), p.extraOptions)
    const hint = slots.length > 0 && options.length === 0 ? "Options from the Collection List appear on the live site." : ""
    return <SelectView p={p} options={options} value="" slots={slots} hint={hint} />
}

// ---------------------------------------------------------------- live
function pickInitial(options: Option[], wanted: string): string {
    if (!wanted) return ""
    const w = String(wanted).trim()
    const ws = slugify(w)
    const hit = options.find((o) => o.value === w || o.label === w) || options.find((o) => slugify(o.value) === ws || slugify(o.label) === ws)
    return hit ? hit.value : ""
}

function LiveSelect(p: Resolved) {
    const slots = slotsOf(p.itemSlots)
    const slotted = slots.length > 0
    const boxRef = useRef<HTMLDivElement | null>(null)
    const cms = useCmsOptions(boxRef, slotted, String(p.labelLayer || ""), String(p.valueLayer || ""))
    const options = mergeOptions(slotted ? cms || [] : manualOptions(p), p.extraOptions)
    const [value, setValue] = useState("")
    const [touched, setTouched] = useState(false)
    const optionsKey = options.map((o) => o.value).join("\n")

    // Preselect after mount: ?<URL param>=<value, label or slug> wins over Default. Stops once the visitor picks.
    useEffect(() => {
        if (touched) return
        let wanted = String(p.defaultValue || "")
        const param = String(p.urlParam || "").trim()
        if (param && typeof window !== "undefined") {
            const q = new URLSearchParams(window.location.search).get(param)
            if (q) wanted = q
        }
        const next = pickInitial(options, wanted)
        if (next && next !== value) setValue(next)
    }, [optionsKey, p.defaultValue, p.urlParam, touched])

    const hint = slotted && cms !== null && cms.length === 0 ? "No options found. Name the text layer in each CMS item " + JSON.stringify(String(p.labelLayer || "Option")) + "." : ""
    return (
        <SelectView
            p={p}
            options={options}
            value={value}
            onChange={(v) => {
                setTouched(true)
                setValue(v)
            }}
            slots={slots}
            boxRef={boxRef}
            hint={hint}
        />
    )
}

/**
 * Native select for Framer Forms whose options come from a CMS Collection List, with preselect from the URL.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 48
 * @framerDisableUnlink
 */
export default function AisolCmsSelect(input: Partial<Props>) {
    const isStatic = useIsStaticRenderer()
    const props = withDefaults(input)
    return isStatic ? <StaticSelect {...props} /> : <LiveSelect {...props} />
}

addPropertyControls(AisolCmsSelect, {
    itemSlots: {
        type: ControlType.Array,
        title: "Options (CMS)",
        defaultValue: [],
        control: { type: ControlType.ComponentInstance },
        description: "Drop a Collection List here. Each item becomes an option, read from its Option layer (and Value layer if present). The list itself stays hidden. Turn off its pagination so every item is read.",
    },
    labelLayer: { type: ControlType.String, title: "Option layer", defaultValue: "Option", description: "Text layer in each CMS item shown as the option. Case does not matter. Without it, each text in the item becomes an option." },
    valueLayer: { type: ControlType.String, title: "Value layer", defaultValue: "Value", description: "Optional text layer sent with the form instead of the label, e.g. the slug." },
    options: { type: ControlType.Array, title: "Options", defaultValue: DEMO_OPTIONS, control: { type: ControlType.String }, description: "Used when no Collection List is connected." },
    extraOptions: { type: ControlType.Array, title: "Extra options", defaultValue: [], control: { type: ControlType.String }, description: "Added after the list, e.g. Not sure yet." },
    defaultValue: { type: ControlType.String, title: "Default", defaultValue: "", description: "Preselected option (label, value or slug). Bind it to a CMS field on a detail page." },
    urlParam: { type: ControlType.String, title: "URL param", defaultValue: "course", description: "Preselect from the address, e.g. /apply?course=design-systems. Wins over Default. Empty = off." },
    field: {
        type: ControlType.Object,
        title: "Field",
        controls: {
            name: { type: ControlType.String, title: "Field name", defaultValue: "course", description: "Name of the field in form submissions." },
            placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "Choose a course" },
            accessibleName: { type: ControlType.String, title: "Label", defaultValue: "Course", description: "Read by screen readers. Keep it if the visible label is a separate text layer." },
            required: { type: ControlType.Boolean, title: "Required", defaultValue: true },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            font: { type: ControlType.Font, title: "Font", controls: "basic", description: "Font family and weight of the field." },
            textSize: { type: ControlType.Number, title: "Text size", defaultValue: 15, min: 11, max: 24, step: 1, unit: "px", description: "Field text. The hint below is one step smaller (÷1.125)." },
            height: { type: ControlType.Number, title: "Height", defaultValue: 48, min: 32, max: 80, step: 1, unit: "px" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 8, min: 0, max: 40, step: 1, unit: "px" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "rgb(28, 32, 30)" },
            muted: { type: ControlType.Color, title: "Placeholder", defaultValue: "rgb(104, 112, 106)", description: "Placeholder, arrow and hint." },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "rgb(255, 255, 255)" },
            border: { type: ControlType.Color, title: "Border", defaultValue: "rgb(214, 219, 211)" },
            focus: { type: ControlType.Color, title: "Focus", defaultValue: "rgb(23, 91, 82)" },
        },
    },
})
