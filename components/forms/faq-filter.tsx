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


type Item = { question: string; answer: string }
interface Props {
    items?: Item[]
    searchLabel?: string
    placeholder?: string
    emptyText?: string
    textColor?: string
    surface?: string
    accent?: string
    radius?: number
    style?: React.CSSProperties
}
const defaults: Item[] = [
    { question: "Can I request a refund?", answer: "You can request a refund within 14 days." },
    { question: "How do I update my email?", answer: "Open your account settings and update your email address." },
]

/**
 * FAQ Filter
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 300
 */
export default function FAQFilter(props: Props) {
    const { items = defaults, searchLabel = "Search questions", placeholder = "Try ‘refund’", emptyText = "No matching questions. Try another search.", textColor = "#18212F", surface = "#FFFFFF", accent = "#2455C7", radius = 16, style } = props
    const [query, setQuery] = React.useState("")
    const [open, setOpen] = React.useState<number | null>(null)
    const uid = React.useId()
    const needle = query.trim().toLocaleLowerCase()
    const matches = items.map((item, index) => ({ item, index })).filter(({ item }) => item.question.toLocaleLowerCase().includes(needle))
    return <section data-faq-filter="" aria-label="Frequently asked questions" style={{ ...style, position: "relative", width: "100%", minWidth: 0, boxSizing: "border-box", color: textColor, background: surface, border: "1px solid #D5DBE5", borderRadius: radius, padding: 20, fontFamily: "system-ui, sans-serif", fontSize: 16, lineHeight: 1.5, overflowWrap: "anywhere" }}>
        <style>{`[data-faq-filter] *{box-sizing:border-box}[data-faq-filter] .faq-control:focus-visible{outline:3px solid var(--faq-focus);outline-offset:3px}[data-faq-filter] button:hover{background:#F0F4FA!important}`}</style>
        <div style={{ "--faq-focus": accent } as React.CSSProperties}>
            <label htmlFor={`${uid}-search`} style={{ display: "block", fontSize: 14, fontWeight: 650, marginBottom: 8 }}>{searchLabel}</label>
            <input id={`${uid}-search`} className="faq-control" type="text" value={query} placeholder={placeholder} onChange={event => { setQuery(event.target.value); setOpen(null) }} style={{ display: "block", width: "100%", minWidth: 0, minHeight: 48, border: "1px solid #8693A8", borderRadius: 8, background: surface, color: textColor, padding: "12px 14px", font: "inherit" }} />
            <p role="status" aria-live="polite" aria-atomic="true" style={{ margin: "16px 0 8px", fontSize: 13, color: textColor }}>{matches.length} {matches.length === 1 ? "question" : "questions"}{needle ? " found" : " available"}</p>
            <div>
                {matches.map(({ item, index }) => {
                    const expanded = open === index
                    const buttonId = `${uid}-question-${index}`
                    const answerId = `${uid}-answer-${index}`
                    return <div key={index} style={{ borderTop: "1px solid #D5DBE5" }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>
                            <button id={buttonId} type="button" className="faq-control" aria-expanded={expanded} aria-controls={answerId} onClick={() => setOpen(expanded ? null : index)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 64, padding: "16px 4px", border: 0, borderRadius: 4, background: "transparent", color: textColor, font: "inherit", textAlign: "left", cursor: "pointer", overflowWrap: "anywhere" }}>
                                <span style={{ minWidth: 0 }}>{item.question}</span><span aria-hidden="true" style={{ color: accent, flexShrink: 0, fontSize: 24, lineHeight: 1 }}>{expanded ? "−" : "+"}</span>
                            </button>
                        </h3>
                        <div id={answerId} role="region" aria-labelledby={buttonId} hidden={!expanded} style={{ padding: "0 4px 20px" }}>{item.answer}</div>
                    </div>
                })}
                {matches.length === 0 && <p style={{ margin: "16px 0 4px" }}>{emptyText}</p>}
            </div>
        </div>
    </section>
}
addPropertyControls(FAQFilter, {
    items: { type: ControlType.Array, title: "Questions", control: { type: ControlType.Object, controls: { question: { type: ControlType.String, title: "Question", defaultValue: "New question" }, answer: { type: ControlType.String, title: "Answer", displayTextArea: true, defaultValue: "Your answer." } } }, defaultValue: defaults },
    searchLabel: { type: ControlType.String, title: "Search label", defaultValue: "Search questions" },
    placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "Try ‘refund’" },
    emptyText: { type: ControlType.String, title: "Empty state", defaultValue: "No matching questions. Try another search." },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#18212F" },
    surface: { type: ControlType.Color, title: "Surface", defaultValue: "#FFFFFF" },
    accent: { type: ControlType.Color, title: "Focus / accent", defaultValue: "#2455C7" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 32, step: 1, defaultValue: 16, unit: "px" },
})
