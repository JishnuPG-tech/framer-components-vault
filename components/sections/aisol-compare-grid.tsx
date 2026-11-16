// build: NEW-1102-comparegrid (2026-11-02, v1.1 corner header cell per Framer review) — Aisol Compare Grid, a free plan comparison table (sibling of Aisol Plan Diff)
// @framerDisableUnlink
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState } from "react"
import type { CSSProperties, RefObject } from "react"

/*
 * Aisol Compare Grid
 * A feature comparison table for two to five plans, built as a real <table>
 * (caption, column headers, row headers) so screen readers can move by cell.
 * Each row takes its values as one line, "yes | yes | no", one entry per plan:
 * yes draws a check, no or a dash draws a muted dash, anything else prints as
 * text. Rows marked as a group become a section label across the table.
 *
 * The one gesture: pick a plan. Clicking a plan header (or a chip on a narrow
 * screen) tints that whole column. On a narrow container the table keeps the
 * feature column plus the picked plan, and the chips above switch plans, so
 * the table never scrolls sideways. The static renderer draws the same markup
 * from the start state.
 */

type PlanCol = { name?: string; price?: string; note?: string; cta?: string; link?: string }
type RowItem = { text?: string; values?: string; group?: boolean }
type Table = { pick?: number; caption?: string; chips?: string; feature?: string; yes?: string; no?: string; zebra?: boolean }
type Look = {
    canvas?: string; card?: string; ink?: string; soft?: string; line?: string; accent?: string; accentInk?: string; tint?: string
    maxWidth?: number; radius?: number; padding?: number
}
type Type = { font?: Record<string, unknown>; textSize?: number }
type Props = {
    heading?: string
    subheading?: string
    plans?: PlanCol[]
    rows?: RowItem[]
    table?: Table
    look?: Look
    type?: Type
    style?: CSSProperties
}

const STARTER_PLANS: PlanCol[] = [
    { name: "Starter", price: "$12 / month", note: "For one person", cta: "Start free", link: "" },
    { name: "Growth", price: "$29 / month", note: "For small teams", cta: "Choose Growth", link: "" },
    { name: "Scale", price: "$79 / month", note: "For many sites", cta: "Talk to sales", link: "" },
]
const r = (text: string, values = "", group = false): RowItem => ({ text, values, group })
const STARTER_ROWS: RowItem[] = [
    r("Publishing", "", true),
    r("Projects", "3 | Unlimited | Unlimited"),
    r("Storage", "10 GB | 100 GB | 1 TB"),
    r("Custom domain", "yes | yes | yes"),
    r("Version history", "30 days | 90 days | 1 year"),
    r("Team", "", true),
    r("Seats", "1 | 5 | 25"),
    r("Roles and permissions", "no | yes | yes"),
    r("Single sign-on", "no | no | yes"),
    r("Support", "", true),
    r("Email support", "yes | yes | yes"),
    r("Priority replies", "no | yes | yes"),
]

// R57: an empty link renders as "/"; schemes we do not allow fall back to "#".
function safeHref(url: string | undefined): string {
    const s = (url || "").trim()
    if (!s || s === "#") return "/"
    if (/^(https?:|mailto:|tel:)/i.test(s)) return s
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return "#"
    return s
}
// QUALITY-10 A1: every size is the Text Size control times a 1.125 step.
const step = (base: number, n: number) => Math.max(10, Math.round(base * Math.pow(1.125, n)))
const fontCss = (font?: Record<string, unknown>): CSSProperties => {
    if (!font) return {}
    const o: Record<string, unknown> = { ...font }
    delete o.fontSize
    delete o.lineHeight
    return o as CSSProperties
}
type Cell = { kind: "yes" | "no" | "text"; text: string }
function cellsOf(values: string | undefined, n: number): Cell[] {
    const parts = (values || "").split("|").map((s) => s.trim())
    return Array.from({ length: n }, (_, i) => {
        const v = parts[i] || ""
        const low = v.toLowerCase()
        if (low === "yes" || low === "✓" || low === "true") return { kind: "yes", text: "" }
        if (!v || low === "no" || v === "-" || v === "–" || low === "false") return { kind: "no", text: "" }
        return { kind: "text", text: v }
    })
}
const clampPick = (pick: number | undefined, n: number) => Math.min(Math.max(1, Math.round(Number(pick) || 1)), Math.max(1, n)) - 1

// No quotes and no child combinators: React 18 SSR escapes them inside <style>.
const CSS = `
.cg-root{container-type:inline-size;contain-intrinsic-inline-size:1100px;min-width:240px;min-height:120px;box-sizing:border-box;background:var(--cg-canvas);color:var(--cg-ink);font-family:var(--cg-font);font-size:var(--cg-body);line-height:1.5;padding:var(--cg-pad) 24px}
.cg-root *{box-sizing:border-box}
.cg-wrap{max-width:var(--cg-max);margin:0 auto}
.cg-head{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;margin-bottom:32px}
.cg-title{margin:0;font-size:var(--cg-h1);font-weight:600;letter-spacing:-0.03em;line-height:1.05;text-wrap:balance;overflow-wrap:break-word}
.cg-sub{margin:0;color:var(--cg-soft);font-size:var(--cg-sub);max-width:44em}
.cg-chips{display:none;justify-content:center;flex-wrap:wrap;gap:6px;margin:0 0 16px}
.cg-chip{height:40px;padding:0 16px;border:1px solid var(--cg-line);border-radius:999px;background:var(--cg-card);color:var(--cg-soft);font:inherit;font-size:var(--cg-body);cursor:pointer}
.cg-chip[aria-checked=true]{background:var(--cg-accent);border-color:var(--cg-accent);color:var(--cg-onaccent);font-weight:600}
.cg-box{border:1px solid var(--cg-line);border-radius:var(--cg-radius);background:var(--cg-card);overflow:hidden}
.cg-table{width:100%;border-collapse:collapse;table-layout:fixed}
.cg-cap{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.cg-table th,.cg-table td{padding:12px 16px;text-align:center;vertical-align:middle;border-bottom:1px solid var(--cg-line);transition:background 180ms ease}
.cg-table .cg-feat{text-align:left;font-weight:400;color:var(--cg-ink);width:34%}
.cg-colh{padding:0;vertical-align:top}
.cg-pick{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;padding:20px 12px 16px;border:0;background:transparent;color:var(--cg-ink);font:inherit;cursor:pointer;text-align:center}
.cg-pname{font-size:var(--cg-name);font-weight:600}
.cg-price{font-size:var(--cg-body);color:var(--cg-ink);font-variant-numeric:tabular-nums}
.cg-pnote{font-size:var(--cg-small);color:var(--cg-soft);min-height:1.5em}
.cg-tag{font-size:var(--cg-tiny);padding:2px 8px;border-radius:999px;border:1px solid var(--cg-line);color:var(--cg-soft)}
.cg-pick[aria-pressed=true] .cg-tag{background:var(--cg-accent);border-color:var(--cg-accent);color:var(--cg-onaccent)}
.cg-table [data-on]{background:var(--cg-tint)}
.cg-group th{text-align:left;font-size:var(--cg-small);font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--cg-soft);padding-top:22px;background:transparent}
.cg-root[data-zebra] .cg-row:nth-of-type(even) th,.cg-root[data-zebra] .cg-row:nth-of-type(even) td:not([data-on]){background:var(--cg-zebra)}
.cg-yes{color:var(--cg-accent);font-weight:600}
.cg-no{color:var(--cg-soft)}
.cg-val{font-variant-numeric:tabular-nums}
.cg-ctar td{border-bottom:0;padding:16px}
.cg-cta{display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 18px;border-radius:999px;border:1px solid var(--cg-line);color:var(--cg-ink);text-decoration:none;font-weight:500;max-width:100%;white-space:nowrap}
.cg-ctar [data-on] .cg-cta{background:var(--cg-accent);border-color:var(--cg-accent);color:var(--cg-onaccent)}
.cg-pick:focus-visible,.cg-chip:focus-visible,.cg-cta:focus-visible{outline:2px solid var(--cg-accent);outline-offset:-2px}
.cg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.cg-empty{margin:0;text-align:center;color:var(--cg-soft)}
@container (max-width:639px){.cg-root{padding:var(--cg-pad) 16px}.cg-chips{display:flex}.cg-table{table-layout:auto}.cg-table [data-c]:not([data-on]){display:none}.cg-table .cg-feat{width:50%}.cg-table [data-on]{width:50%}.cg-table th,.cg-table td{padding:12px}.cg-table [data-on]{background:transparent}.cg-pick{cursor:default}}
@media (prefers-reduced-motion:reduce){.cg-table th,.cg-table td{transition:none!important}}
`

type ViewState = { pick: number; said: string }

/**
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 820
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AisolCompareGrid(props: Props) {
    const isStatic = useIsStaticRenderer()
    const plans = (Array.isArray(props.plans) ? props.plans : STARTER_PLANS).filter(Boolean).slice(0, 5)
    const still: ViewState = { pick: clampPick((props.table || {}).pick ?? 2, plans.length), said: "" }
    return isStatic ? <GridView p={props} s={still} /> : <LiveGrid p={props} start={still} />
}

function LiveGrid({ p: props, start }: { p: Props; start: ViewState }) {
    const plans = (Array.isArray(props.plans) ? props.plans : STARTER_PLANS).filter(Boolean).slice(0, 5)
    const [pick, setPickState] = useState(start.pick)
    const [said, setSaid] = useState("")
    const flip = useRef(0)
    const rootRef = useRef<HTMLDivElement>(null)
    const n = plans.length
    // Keep the picked column valid when the plan list shrinks in the editor.
    const safePick = Math.min(pick, Math.max(0, n - 1))
    const setPick = (i: number) => {
        if (i === safePick) return
        setPickState(i)
        flip.current = 1 - flip.current
        setSaid(`${(plans[i] && plans[i].name) || `Plan ${i + 1}`}` + (flip.current ? "​" : ""))
    }
    const live = useRef({ setPick })
    live.current = { setPick }
    // R8: keyboard on the root as a native listener; arrow keys move between plan chips (radio group).
    useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null
            if (!t || !root.contains(t) || t.getAttribute("role") !== "radio") return
            const group = t.parentElement
            if (!group) return
            const items = Array.from(group.children) as HTMLElement[]
            const at = items.indexOf(t)
            const len = items.length
            let to = -1
            if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (at + 1) % len
            else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = (at - 1 + len) % len
            else if (e.key === "Home") to = 0
            else if (e.key === "End") to = len - 1
            if (to < 0) return
            e.preventDefault()
            items[to].focus()
            live.current.setPick(to)
        }
        root.addEventListener("keydown", onKey)
        return () => root.removeEventListener("keydown", onKey)
    }, [])
    return <GridView p={props} s={{ pick: safePick, said }} onPick={setPick} rootRef={rootRef} />
}

function GridView({ p: props, s, onPick, rootRef }: { p: Props; s: ViewState; onPick?: (i: number) => void; rootRef?: RefObject<HTMLDivElement> }) {
    const { heading = "Compare plans", subheading = "Every feature, side by side. Pick a plan to follow its column.", rows = STARTER_ROWS, table = {}, look = {}, type = {}, style } = props
    const { caption = "Plan comparison", chips = "Plan", feature = "Feature", yes = "Included", no = "Not included", zebra = false } = table
    const {
        canvas = "rgb(11, 11, 12)", card = "rgb(22, 22, 24)", ink = "rgb(245, 245, 245)", soft = "rgb(150, 150, 156)",
        line = "rgba(255, 255, 255, 0.12)", accent = "rgb(120, 200, 150)", accentInk = "rgb(12, 12, 12)", tint = "rgba(120, 200, 150, 0.10)",
        maxWidth = 1040, radius = 20, padding = 56,
    } = look
    const { font, textSize = 14 } = type
    const plans = (Array.isArray(props.plans) ? props.plans : STARTER_PLANS).filter(Boolean).slice(0, 5)
    const list = (Array.isArray(rows) ? rows : []).filter(Boolean)
    const base = Math.max(10, Number(textSize) || 14)
    const vars = {
        "--cg-canvas": canvas, "--cg-card": card, "--cg-ink": ink, "--cg-soft": soft, "--cg-line": line, "--cg-accent": accent,
        "--cg-onaccent": accentInk, "--cg-tint": tint, "--cg-zebra": "rgba(127, 127, 127, 0.06)",
        "--cg-max": `${Math.max(320, Number(maxWidth) || 1040)}px`, "--cg-radius": `${Math.max(0, Number(radius) || 0)}px`, "--cg-pad": `${Math.max(0, Number(padding) || 0)}px`,
        "--cg-font": (font && typeof font.fontFamily === "string" && font.fontFamily) || "Inter, system-ui, sans-serif",
        "--cg-tiny": `${step(base, -2)}px`, "--cg-small": `${step(base, -1)}px`, "--cg-body": `${base}px`, "--cg-name": `${step(base, 2)}px`,
        "--cg-sub": `${step(base, 1)}px`, "--cg-h1": `${step(base, 9)}px`,
    } as CSSProperties
    const rootStyle = { ...vars, ...fontCss(font), ...style }
    if (!plans.length) {
        return (
            <div className="cg-root" style={rootStyle} ref={rootRef}>
                <style>{CSS}</style>
                <p className="cg-empty">Add plans in the properties panel.</p>
            </div>
        )
    }
    const n = plans.length
    const on = (i: number) => (i === s.pick ? "" : undefined)
    const nameOf = (pl: PlanCol, i: number) => (pl.name || "").trim() || `Plan ${i + 1}`
    return (
        <div className="cg-root" style={rootStyle} ref={rootRef} data-zebra={zebra ? "" : undefined}>
            <style>{CSS}</style>
            <section className="cg-wrap" aria-label={heading || caption}>
                <div className="cg-head">
                    {heading ? <h2 className="cg-title">{heading}</h2> : null}
                    {subheading ? <p className="cg-sub">{subheading}</p> : null}
                </div>
                <div className="cg-chips" role="radiogroup" aria-label={chips}>
                    {plans.map((pl, i) => (
                        <button key={i} type="button" role="radio" className="cg-chip" aria-checked={i === s.pick} tabIndex={i === s.pick ? 0 : -1} onClick={onPick ? () => onPick(i) : undefined}>
                            {nameOf(pl, i)}
                        </button>
                    ))}
                </div>
                <div className="cg-box">
                    <table className="cg-table">
                        <caption className="cg-cap">{caption}</caption>
                        <thead>
                            <tr>
                                <th scope="col" className="cg-feat"><span className="cg-sr">{feature}</span></th>
                                {plans.map((pl, i) => (
                                    <th key={i} scope="col" className="cg-colh" data-c="" data-on={on(i)}>
                                        <button type="button" className="cg-pick" aria-pressed={i === s.pick} onClick={onPick ? () => onPick(i) : undefined}>
                                            <span className="cg-pname">{nameOf(pl, i)}</span>
                                            {pl.price ? <span className="cg-price">{pl.price}</span> : null}
                                            <span className="cg-pnote">{pl.note || ""}</span>
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {list.length ? (
                                list.map((row, ri) =>
                                    row.group ? (
                                        <tr key={ri} className="cg-group">
                                            <th scope="colgroup" colSpan={n + 1}>{row.text || ""}</th>
                                        </tr>
                                    ) : (
                                        <tr key={ri} className="cg-row">
                                            <th scope="row" className="cg-feat">{row.text || ""}</th>
                                            {cellsOf(row.values, n).map((c, ci) => (
                                                <td key={ci} data-c="" data-on={on(ci)}>
                                                    {c.kind === "yes" ? (
                                                        <><span className="cg-yes" aria-hidden="true">✓</span><span className="cg-sr">{yes}</span></>
                                                    ) : c.kind === "no" ? (
                                                        <><span className="cg-no" aria-hidden="true">–</span><span className="cg-sr">{no}</span></>
                                                    ) : (
                                                        <span className="cg-val">{c.text}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td colSpan={n + 1} className="cg-empty">Add rows in the properties panel.</td>
                                </tr>
                            )}
                            {plans.some((pl) => pl.cta && pl.cta.trim()) ? (
                                <tr className="cg-ctar">
                                    <td className="cg-feat" />
                                    {plans.map((pl, i) => (
                                        <td key={i} data-c="" data-on={on(i)}>
                                            {pl.cta && pl.cta.trim() ? <a className="cg-cta" href={safeHref(pl.link)}>{pl.cta}</a> : null}
                                        </td>
                                    ))}
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>
            <div className="cg-sr" aria-live="polite">{s.said}</div>
        </div>
    )
}

addPropertyControls(AisolCompareGrid, {
    heading: { type: ControlType.String, title: "Heading", defaultValue: "Compare plans" },
    subheading: { type: ControlType.String, title: "Subheading", defaultValue: "Every feature, side by side. Pick a plan to follow its column." },
    plans: {
        type: ControlType.Array, title: "Plans", maxCount: 5, defaultValue: STARTER_PLANS,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Plan" },
                price: { type: ControlType.String, title: "Price", defaultValue: "", placeholder: "$29 / month" },
                note: { type: ControlType.String, title: "Note", defaultValue: "" },
                cta: { type: ControlType.String, title: "Button", defaultValue: "Choose plan", description: "Leave empty to hide this plan's button." },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    rows: {
        type: ControlType.Array, title: "Rows", maxCount: 40, defaultValue: STARTER_ROWS,
        control: {
            type: ControlType.Object,
            controls: {
                text: { type: ControlType.String, title: "Feature", defaultValue: "Feature" },
                values: { type: ControlType.String, title: "Values", defaultValue: "yes | yes | no", placeholder: "yes | 5 | no", description: "One entry per plan, split by |. yes = check, no or - = dash, anything else is shown as text." },
                group: { type: ControlType.Boolean, title: "Group Label", defaultValue: false, description: "Show this row as a section label across the table." },
            },
        },
    },
    table: {
        type: ControlType.Object, title: "Table",
        controls: {
            pick: { type: ControlType.Number, title: "Start Plan", defaultValue: 2, min: 1, max: 5, step: 1, displayStepper: true, description: "Which plan column is picked first (1 = first plan)." },
            zebra: { type: ControlType.Boolean, title: "Stripes", defaultValue: false },
            caption: { type: ControlType.String, title: "Caption", defaultValue: "Plan comparison", description: "Read by screen readers as the table name." },
            feature: { type: ControlType.String, title: "Feature Header", defaultValue: "Feature", description: "Read by screen readers as the name of the first column." },
            chips: { type: ControlType.String, title: "Chips Label", defaultValue: "Plan", description: "Name of the plan switcher shown on narrow screens." },
            yes: { type: ControlType.String, title: "Yes Text", defaultValue: "Included", description: "Read aloud for a check." },
            no: { type: ControlType.String, title: "No Text", defaultValue: "Not included", description: "Read aloud for a dash." },
        },
    },
    look: {
        type: ControlType.Object, title: "Look",
        controls: {
            canvas: { type: ControlType.Color, title: "Background", defaultValue: "rgb(11, 11, 12)" },
            card: { type: ControlType.Color, title: "Table", defaultValue: "rgb(22, 22, 24)" },
            ink: { type: ControlType.Color, title: "Text", defaultValue: "rgb(245, 245, 245)" },
            soft: { type: ControlType.Color, title: "Muted", defaultValue: "rgb(150, 150, 156)" },
            line: { type: ControlType.Color, title: "Lines", defaultValue: "rgba(255, 255, 255, 0.12)" },
            accent: { type: ControlType.Color, title: "Accent", defaultValue: "rgb(120, 200, 150)" },
            accentInk: { type: ControlType.Color, title: "On Accent", defaultValue: "rgb(12, 12, 12)" },
            tint: { type: ControlType.Color, title: "Picked Column", defaultValue: "rgba(120, 200, 150, 0.10)" },
            maxWidth: { type: ControlType.Number, title: "Max Width", defaultValue: 1040, min: 320, max: 1920, step: 10, unit: "px" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 48, step: 1, unit: "px" },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: 56, min: 0, max: 160, step: 4, unit: "px", description: "Top and bottom of the section." },
        },
    },
    type: {
        type: ControlType.Object, title: "Type",
        controls: {
            font: { type: ControlType.Font, title: "Font", controls: "basic", defaultFontType: "sans-serif" },
            textSize: { type: ControlType.Number, title: "Text Size", defaultValue: 14, min: 10, max: 24, step: 1, unit: "px", description: "Body size; every other size is a step of 1.125 from it." },
        },
    },
})
