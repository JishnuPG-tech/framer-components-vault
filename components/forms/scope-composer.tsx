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


interface ScopeComposerProps {
    heading?: string
    accent?: string
    surface?: string
    textColor?: string
    font?: React.CSSProperties
    initialName?: string
    style?: React.CSSProperties
}
const areas = ["Website", "Components", "Motion"] as const
type Area = (typeof areas)[number]
const defaultFont: React.CSSProperties = { fontFamily: '"DM Sans", sans-serif', fontSize: 16, lineHeight: 1.5, fontWeight: 400 }

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 460
 */
export default function ScopeComposer({
    heading = "Compose a small brief",
    accent = "#CCFF58",
    surface = "#F5F6F2",
    textColor = "#18201C",
    font = defaultFont,
    initialName = "Studio exploration",
    style = {},
}: ScopeComposerProps) {
    const uid = React.useId()
    const [name, setName] = React.useState(initialName)
    const [selected, setSelected] = React.useState<Area[]>(["Website", "Components"])
    const [notice, setNotice] = React.useState("")
    React.useEffect(() => { setName(initialName); setNotice("") }, [initialName])
    const ordered = areas.filter(area => selected.includes(area))
    const project = name.trim() || "Untitled project"
    const summary = ordered.length
        ? `${project} — a brief for ${ordered.join(" + ")}. Start with the smallest useful version, then refine the details.`
        : `${project} — no areas selected yet. Choose an area above to begin.`
    const brief = `STUDIO NOTES / LOCAL BRIEF\n\nProject: ${project}\nScope: ${ordered.join(", ") || "Not selected"}\n\n${summary}\n\nDemo only. This file was created locally; nothing was submitted.\n`
    function toggle(area: Area) {
        setSelected(previous => previous.includes(area) ? previous.filter(value => value !== area) : [...previous, area])
        setNotice("")
    }
    function downloadBrief() {
        if (typeof window === "undefined" || typeof document === "undefined") return
        let url: string | undefined
        try {
            url = URL.createObjectURL(new Blob([brief], { type: "text/plain;charset=utf-8" }))
            const link = document.createElement("a")
            link.href = url
            link.download = "studio-notes-brief.txt"
            document.body.appendChild(link)
            link.click()
            link.remove()
            setNotice("TXT download requested. Nothing was sent.")
        } catch {
            setNotice("Download unavailable in this view. Try the interactive browser preview.")
        } finally {
            if (url) { const objectUrl = url; window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000) }
        }
    }
    const control: React.CSSProperties = {
        ...font, boxSizing: "border-box", color: textColor, border: `1px solid ${textColor}`,
        borderRadius: 4, padding: "10px 14px", minHeight: 46, maxWidth: "100%", cursor: "pointer",
        overflowWrap: "anywhere", background: surface,
    }
    return (
        <section className="studio-scope-composer" aria-labelledby={`${uid}-heading`} style={{
            ...defaultFont, ...font, ...style, position: "relative", width: "100%", height: "auto",
            minWidth: 0, boxSizing: "border-box", padding: "clamp(16px, 4%, 32px)",
            background: surface, color: textColor, border: `1px solid ${textColor}`, borderRadius: 4,
            display: "flex", flexDirection: "column", gap: 24, overflowWrap: "anywhere",
        }}>
            <style>{`.studio-scope-composer button:focus-visible, .studio-scope-composer input:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; } .studio-scope-composer button:hover { text-decoration: underline; } @media (prefers-reduced-motion: reduce) { .studio-scope-composer *, .studio-scope-composer { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }`}</style>
            <h3 id={`${uid}-heading`} style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: "1.5em", lineHeight: 1.2, fontWeight: 500 }}>{heading}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                <label htmlFor={`${uid}-name`}>Project name</label>
                <input id={`${uid}-name`} type="text" value={name} maxLength={120} autoComplete="off" onChange={event => { setName(event.target.value); setNotice("") }} style={{ ...control, cursor: "text", width: "100%" }} />
            </div>
            <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
                <legend style={{ padding: 0, marginBottom: 8 }}>Areas of work</legend>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {areas.map(area => <button key={area} type="button" aria-pressed={selected.includes(area)} onClick={() => toggle(area)} style={{ ...control, background: selected.includes(area) ? accent : surface, fontWeight: selected.includes(area) ? 600 : 400 }}>{area}</button>)}
                </div>
            </fieldset>
            <div style={{ borderTop: `1px solid ${textColor}`, paddingTop: 20 }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.8em", letterSpacing: "0.06em", fontWeight: 600 }}>LIVE BRIEF</p>
                <p aria-live="polite" aria-atomic="true" style={{ margin: 0 }}>{summary}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
                <button type="button" onClick={downloadBrief} style={{ ...control, background: accent, fontWeight: 600 }}>Download brief</button>
                <p style={{ margin: 0, fontSize: "0.8125em" }}>Local TXT only. No form submission. No data sent.</p>
                <p role="status" style={{ margin: 0, fontSize: "0.8125em" }}>{notice}</p>
            </div>
        </section>
    )
}

addPropertyControls(ScopeComposer, {
    heading: { type: ControlType.String, title: "Heading", defaultValue: "Compose a small brief" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#CCFF58" },
    surface: { type: ControlType.Color, title: "Surface", defaultValue: "#F5F6F2" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#18201C" },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "16px", lineHeight: "1.5em", variant: "Regular" } },
    initialName: { type: ControlType.String, title: "Initial Name", defaultValue: "Studio exploration" },
})
