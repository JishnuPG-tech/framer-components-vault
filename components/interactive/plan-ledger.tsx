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


// Plan Ledger: plan comparison for three plans. A table from 700 px up with a sticky head row,
// one collapsible list per plan below that (no sideways scrolling on phones).
// Two skins: Glass (dark, translucent panel) and Light (paper and ink). Self-contained: no project tokens, only the props below.

interface Row {
    label: string
    free: string
    team: string
    enterprise: string
}

type PlanKey = "free" | "team" | "enterprise"

interface PlanLedgerProps {
    freeName: string
    teamName: string
    enterpriseName: string
    skin: string
    featuresLabel: string
    highlight: PlanKey
    badgeLabel: string
    openOnPhone: PlanKey | "none"
    stickyTop: number
    rows: Row[]
    yesLabel: string
    noLabel: string
    backgroundColor?: string
    panelColor?: string
    textColor?: string
    mutedColor?: string
    lineColor?: string
    glowColor?: string
    accentColor?: string
    headingFont: React.CSSProperties
    bodyFont: React.CSSProperties
    numberFont: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ROWS: Row[] = [
    { label: "Team members", free: "Up to 3", team: "Unlimited", enterprise: "Unlimited" },
    { label: "Projects", free: "3", team: "25", enterprise: "Unlimited" },
    { label: "Storage", free: "1 GB", team: "100 GB", enterprise: "1 TB" },
    { label: "Version history", free: "no", team: "30 days", enterprise: "1 year" },
    { label: "Custom domain", free: "no", team: "yes", enterprise: "yes" },
    { label: "SSO & audit log", free: "no", team: "no", enterprise: "yes" },
    { label: "Support", free: "Community", team: "Email", enterprise: "Priority" },
    { label: "Uptime SLA", free: "no", team: "no", enterprise: "99.9%" },
]

const HEADING_FONT: React.CSSProperties = { fontFamily: '"Bricolage Grotesque"', fontWeight: 800 }
const BODY_FONT: React.CSSProperties = { fontFamily: '"Geist"', fontWeight: 400 }
const NUMBER_FONT: React.CSSProperties = { fontFamily: '"Geist Mono"', fontWeight: 400 }

const SKINS = ["glass", "light"]

// Colors a skin uses when the Color controls are left empty
const PALETTES: Record<string, Record<string, string>> = {
    glass: { bg: "#05070F", panel: "rgba(21,27,48,0.72)", text: "#EAF0FF", muted: "#8C97B5", line: "#232B45", glow: "rgba(124,245,255,0.18)", accent: "#7CF5FF" },
    light: { bg: "#F5F4EF", panel: "#FFFFFF", text: "#141414", muted: "#5A5C62", line: "#E1DED5", glow: "#D6D2C6", accent: "#E0431A" },
}

const PLAN_KEYS: PlanKey[] = ["free", "team", "enterprise"]

// Table: Panel fill with a 1px Border line and 16px corners, 1px Line rules between rows, no vertical rules.
// The head row sticks to the top while the page scrolls (Background under the Panel so rows never show through).
// The recommended column's head is Accent text over a 1px Accent line; nothing else is tinted.
const CSS = `
.plg{container-type:inline-size;position:relative;width:100%;color:var(--plg-text);font-family:var(--plg-b-family);font-weight:var(--plg-b-weight);font-style:var(--plg-b-style);font-size:16px;line-height:24px}
.plg *,.plg *::before,.plg *::after{box-sizing:border-box}
.plg-wrap{padding:8px 0 16px}
.plg-h{font-family:var(--plg-h-family);font-weight:var(--plg-h-weight);font-style:var(--plg-h-style);letter-spacing:-.025em}
.plg-m{font-family:var(--plg-n-family);font-weight:var(--plg-n-weight);font-style:var(--plg-n-style);font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.plg-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.plg button:focus-visible{outline:2px solid var(--plg-accent);outline-offset:-3px}
.plg-mark{display:block;flex:none}
.plg-mark[data-kind="yes"]{color:var(--plg-accent);filter:drop-shadow(0 0 4px color-mix(in srgb,var(--plg-accent) 60%,transparent))}
.plg-mark[data-kind="no"]{color:var(--plg-muted);opacity:.75}

.plg-table{display:table;width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;background:var(--plg-panel);border:1px solid var(--plg-glow);border-radius:16px}
.plg-table th,.plg-table td{padding:0 16px;text-align:left;vertical-align:middle;border:0;font-weight:inherit}
.plg-table th:first-child,.plg-table td:first-child{padding-left:24px}
.plg-table th:last-child,.plg-table td:last-child{padding-right:24px}
.plg-table thead th{position:sticky;top:var(--plg-top);z-index:2;padding-top:24px;padding-bottom:16px;vertical-align:bottom;background:linear-gradient(var(--plg-panel),var(--plg-panel)),var(--plg-bg);border-bottom:1px solid var(--plg-line)}
.plg-table thead th:first-child{border-top-left-radius:15px}
.plg-table thead th:last-child{border-top-right-radius:15px}
.plg-table thead th[data-hl="true"]{color:var(--plg-accent);border-bottom-color:var(--plg-accent)}
.plg-table thead .plg-corner{padding-bottom:21px;font-size:12px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--plg-muted)}
.plg-pn{display:block;font-size:22px;line-height:28px}
.plg-badge{display:block;height:16px;margin:0 0 8px;font-size:11px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--plg-accent);white-space:nowrap}
.plg-table th[scope="row"]{font-size:16px;line-height:24px}
.plg-table tbody tr{height:56px}
.plg-table tbody tr + tr > *{border-top:1px solid var(--plg-line)}
.plg-table col.plg-c0{width:31%}
.plg-val{display:block;font-size:14px;line-height:24px}

.plg-fold{display:none;flex-direction:column;border:1px solid var(--plg-glow);border-radius:16px;background:var(--plg-panel);overflow:hidden}
.plg-plan{position:relative}
.plg-plan + .plg-plan{border-top:1px solid var(--plg-line)}
.plg-plan h3{margin:0;font-weight:inherit}
.plg-plan[data-hl="true"] .plg-pn{color:var(--plg-accent)}
.plg-plan[data-hl="true"] .plg-list{border-top-color:var(--plg-accent)}
.plg-sum{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:76px;padding:20px 20px;margin:0;border:0;background:transparent;color:var(--plg-text);text-align:left;cursor:pointer}
.plg-sumname{display:flex;flex-direction:column;min-width:0}
.plg-sumname .plg-pn{font-size:22px;line-height:28px}
.plg-sumname .plg-badge{margin:0 0 4px}
.plg-tog{position:relative;flex:none;width:28px;height:28px;border:1px solid var(--plg-glow);border-radius:50%}
.plg-tog::before,.plg-tog::after{content:"";position:absolute;left:50%;top:50%;border-radius:1px;background:var(--plg-text);transform:translate(-50%,-50%)}
.plg-tog::before{width:10px;height:1.5px}
.plg-tog::after{width:1.5px;height:10px}
.plg-sum[aria-expanded="true"] .plg-tog::after{display:none}
.plg-sum:hover .plg-tog{border-color:var(--plg-accent)}
.plg-list{margin:0;padding:0 20px;list-style:none;border-top:1px solid var(--plg-line)}
.plg-list[hidden]{display:none}
.plg-item{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:52px;padding:10px 0;font-size:15px;line-height:24px}
.plg-item + .plg-item{border-top:1px solid var(--plg-line)}
.plg-item .plg-lbl{min-width:0}
.plg-item .plg-v{flex:none;text-align:right}
.plg-item .plg-mark{margin:0}

.plg[data-skin="light"] .plg-table,.plg[data-skin="light"] .plg-fold{box-shadow:0 1px 2px rgba(20,20,20,.04),0 16px 32px -20px rgba(20,20,20,.18)}
.plg[data-skin="light"] .plg-mark[data-kind="yes"]{filter:none}
.plg[data-skin="light"] .plg-mark[data-kind="no"]{opacity:.55}

@container (max-width: 699px){
  .plg-table{display:none}
  .plg-fold{display:flex}
}
@container (min-width: 1000px){
  .plg-table th,.plg-table td{padding-left:24px;padding-right:24px}
  .plg-table th:first-child,.plg-table td:first-child{padding-left:32px}
  .plg-table th:last-child,.plg-table td:last-child{padding-right:32px}
  .plg-table thead th{padding-top:28px;padding-bottom:20px}
  .plg-pn{font-size:26px;line-height:32px}
  .plg-val{font-size:15px}
}
`

function fontVars(prefix: string, font: React.CSSProperties, fallback: React.CSSProperties): Record<string, string | number> {
    const family = font.fontFamily || fallback.fontFamily
    return {
        [`--plg-${prefix}-family`]: `${family}, ui-sans-serif, system-ui, sans-serif`,
        [`--plg-${prefix}-weight`]: font.fontWeight ?? fallback.fontWeight ?? 400,
        [`--plg-${prefix}-style`]: font.fontStyle ?? "normal",
    }
}

type Cell = { kind: "yes" } | { kind: "no" } | { kind: "text"; text: string }

const YES = new Set(["yes", "y", "true", "included", "✓", "✔", "check"])
const NO = new Set(["", "no", "n", "false", "none", "-", "–", "—", "×", "x", "✕"])

function parseCell(raw: unknown): Cell {
    const text = String(raw ?? "").trim()
    const key = text.toLowerCase()
    if (YES.has(key)) return { kind: "yes" }
    if (NO.has(key)) return { kind: "no" }
    return { kind: "text", text }
}

// yes = a lit dot (Accent), no = a short dash (Muted); an SVG, so the row height does not depend on a font's glyphs
function Mark({ kind }: { kind: "yes" | "no" }) {
    return (
        <svg
            className="plg-mark"
            data-kind={kind}
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
        >
            {kind === "yes" ? (
                <>
                    <circle cx={8} cy={8} r={7} fill="currentColor" fillOpacity={0.2} stroke="none" />
                    <circle cx={8} cy={8} r={4} fill="currentColor" stroke="none" />
                </>
            ) : (
                <path d="M4 8h8" />
            )}
        </svg>
    )
}

function normalizeRows(rows: unknown): Row[] {
    if (!Array.isArray(rows)) return DEFAULT_ROWS
    return rows.map((row) => {
        const r = (row ?? {}) as Partial<Row>
        return { label: String(r.label ?? ""), free: String(r.free ?? ""), team: String(r.team ?? ""), enterprise: String(r.enterprise ?? "") }
    })
}

/**
 * Plan Ledger
 *
 * Side-by-side plan comparison. Type "yes" or "no" in a cell to get a lit dot or a dash, any other text is shown as is.
 * From 700 px up it is a table whose head row sticks while the page scrolls; below that every plan folds open and shut.
 *
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 640
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function PlanLedger(props: PlanLedgerProps) {
    const {
        freeName = "Free",
        teamName = "Team",
        enterpriseName = "Enterprise",
        skin = "glass",
        featuresLabel = "Features",
        highlight = "team",
        badgeLabel = "Most popular",
        openOnPhone = "team",
        stickyTop = 0,
        rows,
        yesLabel = "Included",
        noLabel = "Not included",
        backgroundColor,
        panelColor,
        textColor,
        mutedColor,
        lineColor,
        glowColor,
        accentColor,
        headingFont = HEADING_FONT,
        bodyFont = BODY_FONT,
        numberFont = NUMBER_FONT,
        style,
    } = props

    const uid = React.useId().replace(/:/g, "")
    const data = React.useMemo(() => normalizeRows(rows), [rows])
    const names: Record<PlanKey, string> = { free: freeName, team: teamName, enterprise: enterpriseName }
    const [open, setOpen] = React.useState<Record<PlanKey, boolean>>({
        free: openOnPhone === "free",
        team: openOnPhone === "team",
        enterprise: openOnPhone === "enterprise",
    })
    React.useEffect(() => {
        setOpen({ free: openOnPhone === "free", team: openOnPhone === "team", enterprise: openOnPhone === "enterprise" })
    }, [openOnPhone])

    const skinKey = SKINS.includes(skin) ? skin : "glass"
    const pal = PALETTES[skinKey]
    const vars = {
        "--plg-bg": backgroundColor || pal.bg,
        "--plg-panel": panelColor || pal.panel,
        "--plg-text": textColor || pal.text,
        "--plg-muted": mutedColor || pal.muted,
        "--plg-line": lineColor || pal.line,
        "--plg-glow": glowColor || pal.glow,
        "--plg-accent": accentColor || pal.accent,
        "--plg-top": `${Math.max(0, Number(stickyTop) || 0)}px`,
        ...fontVars("h", headingFont, HEADING_FONT),
        ...fontVars("b", bodyFont, BODY_FONT),
        ...fontVars("n", numberFont, NUMBER_FONT),
    } as React.CSSProperties

    const renderValue = (raw: string) => {
        const cell = parseCell(raw)
        if (cell.kind === "text") return <span className="plg-val plg-m">{cell.text}</span>
        return (
            <>
                <Mark kind={cell.kind} />
                <span className="plg-sr">{cell.kind === "yes" ? yesLabel : noLabel}</span>
            </>
        )
    }

    return (
        <div className="plg" data-skin={skinKey} style={{ ...style, ...vars }}>
            <style>{CSS}</style>
            <div className="plg-wrap">
                <table className="plg-table">
                    <caption className="plg-sr">Compare plans</caption>
                    <colgroup>
                        <col className="plg-c0" />
                        <col />
                        <col />
                        <col />
                    </colgroup>
                    <thead>
                        <tr>
                            <th scope="col" className="plg-corner plg-m">{featuresLabel}</th>
                            {PLAN_KEYS.map((key) => (
                                <th key={key} scope="col" data-hl={highlight === key}>
                                    <span className="plg-badge plg-m">{highlight === key && badgeLabel ? badgeLabel : null}</span>
                                    <span className="plg-pn plg-h">{names[key]}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={`${index}-${row.label}`}>
                                <th scope="row">{row.label}</th>
                                {PLAN_KEYS.map((key) => (
                                    <td key={key} data-hl={highlight === key}>
                                        {renderValue(row[key])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="plg-fold">
                    {PLAN_KEYS.map((key) => {
                        const id = `${uid}-${key}`
                        const isOpen = open[key]
                        return (
                            <section key={key} className="plg-plan" data-hl={highlight === key}>
                                <h3>
                                    <button
                                        type="button"
                                        className="plg-sum"
                                        aria-expanded={isOpen}
                                        aria-controls={id}
                                        onClick={() => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
                                    >
                                        <span className="plg-sumname">
                                            {highlight === key && badgeLabel ? <span className="plg-badge plg-m">{badgeLabel}</span> : null}
                                            <span className="plg-pn plg-h">{names[key]}</span>
                                        </span>
                                        <span className="plg-tog" aria-hidden="true" />
                                    </button>
                                </h3>
                                <ul id={id} className="plg-list" hidden={!isOpen}>
                                    {data.map((row, index) => (
                                        <li key={`${index}-${row.label}`} className="plg-item">
                                            <span className="plg-lbl">{row.label}</span>
                                            <span className="plg-v">{renderValue(row[key])}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(PlanLedger, {
    skin: {
        type: ControlType.Enum,
        title: "Skin",
        options: SKINS,
        optionTitles: ["Glass", "Light"],
        defaultValue: "glass",
    },
    freeName: { type: ControlType.String, title: "Plan 1", defaultValue: "Free" },
    teamName: { type: ControlType.String, title: "Plan 2", defaultValue: "Team" },
    enterpriseName: { type: ControlType.String, title: "Plan 3", defaultValue: "Enterprise" },
    featuresLabel: { type: ControlType.String, title: "Corner label", defaultValue: "Features" },
    highlight: {
        type: ControlType.Enum,
        title: "Highlight",
        defaultValue: "team",
        options: ["free", "team", "enterprise"],
        optionTitles: ["Plan 1", "Plan 2", "Plan 3"],
    },
    badgeLabel: { type: ControlType.String, title: "Badge text", defaultValue: "Most popular" },
    openOnPhone: {
        type: ControlType.Enum,
        title: "Open on phone",
        defaultValue: "team",
        options: ["free", "team", "enterprise", "none"],
        optionTitles: ["Plan 1", "Plan 2", "Plan 3", "None"],
    },
    stickyTop: {
        type: ControlType.Number,
        title: "Sticky top",
        defaultValue: 0,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        description: "Distance from the top of the window where the head row sticks, e.g. the Nav height",
    },
    rows: {
        type: ControlType.Array,
        title: "Rows",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Feature", defaultValue: "Feature" },
                free: { type: ControlType.String, title: "Plan 1", defaultValue: "no", description: "yes, no or any text" },
                team: { type: ControlType.String, title: "Plan 2", defaultValue: "yes" },
                enterprise: { type: ControlType.String, title: "Plan 3", defaultValue: "yes" },
            },
        },
        defaultValue: DEFAULT_ROWS,
    },
    yesLabel: { type: ControlType.String, title: "Yes label", defaultValue: "Included" },
    noLabel: { type: ControlType.String, title: "No label", defaultValue: "Not included" },
    backgroundColor: { type: ControlType.Color, title: "Background", description: "Empty uses the skin color" },
    panelColor: { type: ControlType.Color, title: "Panel", description: "Empty uses the skin color" },
    textColor: { type: ControlType.Color, title: "Text", description: "Empty uses the skin color" },
    mutedColor: { type: ControlType.Color, title: "Muted", description: "Empty uses the skin color" },
    lineColor: { type: ControlType.Color, title: "Line", description: "Empty uses the skin color" },
    glowColor: { type: ControlType.Color, title: "Border", description: "Empty uses the skin color" },
    accentColor: { type: ControlType.Color, title: "Accent", description: "Empty uses the skin color" },
    headingFont: {
        type: ControlType.Font,
        title: "Heading font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Regular" },
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number font",
        controls: "basic",
        defaultFontType: "monospace",
    },
})

