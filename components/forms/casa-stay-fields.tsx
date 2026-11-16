import { useEffect, useId, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Casa Stay Fields — the date, guest and villa fields for your booking form. Place it inside a
// Framer form: its fields are sent with the form like any other. Choices made in Casa Calendar or
// Casa Booking Bar appear here straight away, and edits here flow back to them. They talk through
// events ("casa:stay", "casa:request", "casa:form-visible"), so this component only ever touches
// its own elements and nothing else on the page.

interface Props {
    format: "stay" | "evening"
    checkInLabel: string
    checkOutLabel: string
    guestsLabel: string
    choiceLabel: string
    showChoice: boolean
    choicePlaceholder: string
    maxGuests: number
    labelColor: string
    textColor: string
    fieldFill: string
    borderColor: string
    focusColor: string
    radius: number
    fieldHeight: number
    darkFields: boolean
    fontFamily: string
    style?: CSSProperties
}

type Stay = { option?: string; checkIn?: string; checkOut?: string; guests?: number }
declare global {
    interface Window {
        casaStay?: Stay
    }
}
const STORE = "casa:stay"
const isDay = (v?: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v)
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const addDays = (s: string, n: number) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d) }
// the same sources Casa Calendar and Casa Booking Bar use: shared global, then the session, then the URL
const readStay = (): Stay => {
    if (typeof window === "undefined") return {}
    if (window.casaStay) return window.casaStay
    let s: Stay = {}
    try { const raw = window.sessionStorage.getItem(STORE); if (raw) s = JSON.parse(raw) || {} } catch {}
    const q = new URLSearchParams(window.location.search)
    const ci = q.get("checkin"), co = q.get("checkout"), g = parseInt(q.get("guests") || "", 10), o = q.get("option")
    if (isDay(ci)) s.checkIn = ci as string
    if (isDay(co)) s.checkOut = co as string
    if (g > 0 && g < 50) s.guests = g
    if (o) s.option = o.slice(0, 80)
    if (!isDay(s.checkIn) || (s.checkIn as string) < iso(new Date())) { delete s.checkIn; delete s.checkOut }
    return s
}
const shareStay = (s: Stay, from: string) => {
    window.casaStay = s
    try { window.sessionStorage.setItem(STORE, JSON.stringify(s)) } catch {}
    window.dispatchEvent(new CustomEvent("casa:stay", { detail: { ...s, from } }))
}

// focus ring and date-picker icon colour: static, scoped to this component's class
const CSS = `.casa-sf input:focus{outline:none;border-color:var(--sf-focus) !important}.casa-sf input::placeholder{color:var(--sf-ph)}`
function useStaticStyles(id: string, css: string) {
    useEffect(() => {
        if (typeof document === "undefined" || document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = css
        document.head.appendChild(el)
    }, [id, css])
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 520
 */
export default function CasaStayFields(props: Props) {
    useStaticStyles("casa-stayfields-css", CSS)
    const { format, checkInLabel, checkOutLabel, guestsLabel, choiceLabel, showChoice, choicePlaceholder, maxGuests, labelColor, textColor, fieldFill, borderColor, focusColor, radius, fieldHeight, darkFields, fontFamily } = props
    const isStatic = useIsStaticRenderer()
    const uid = useId().replace(/:/g, "")
    const box = useRef<HTMLDivElement>(null)
    const [s, setS] = useState<Stay>({})
    const [wide, setWide] = useState(true)
    const [flash, setFlash] = useState(false)
    const stayMode = format !== "evening"
    const today = iso(new Date())

    useEffect(() => {
        if (isStatic) return
        setS({ ...readStay() })
        const onStay = (e: Event) => { const d = (e as CustomEvent).detail || {}; if (d.from !== uid) setS({ ...readStay(), ...d }) }
        // "Request these dates" / "Check availability": take the choices and bring this form into view
        const onRequest = (e: Event) => {
            const d = (e as CustomEvent).detail
            if (!d || d.handled) return
            d.handled = true
            setS((x) => ({ ...x, ...d }))
            box.current?.scrollIntoView({ behavior: "smooth", block: "center" })
            setFlash(true)
            window.setTimeout(() => setFlash(false), 1600)
        }
        window.addEventListener("casa:stay", onStay)
        window.addEventListener("casa:request", onRequest)
        // tell a floating Casa Booking Bar when this form is on screen, so it can step aside
        const io = new IntersectionObserver((es) => window.dispatchEvent(new CustomEvent("casa:form-visible", { detail: { id: uid, visible: es[0].isIntersecting } })), { threshold: 0.05 })
        const ro = new ResizeObserver(() => setWide((box.current?.clientWidth || 520) >= 420))
        if (box.current) { io.observe(box.current); ro.observe(box.current) }
        return () => {
            window.removeEventListener("casa:stay", onStay)
            window.removeEventListener("casa:request", onRequest)
            io.disconnect(); ro.disconnect()
            window.dispatchEvent(new CustomEvent("casa:form-visible", { detail: { id: uid, visible: false } }))
        }
    }, [isStatic, uid])

    const edit = (patch: Stay) => {
        const next: Stay = { ...s, ...patch }
        if (stayMode && next.checkIn && next.checkOut && next.checkOut <= next.checkIn) next.checkOut = addDays(next.checkIn, 1)
        setS(next)
        shareStay({ ...readStay(), ...next }, uid)
    }

    const font: CSSProperties = { fontFamily: fontFamily ? `"${fontFamily}", system-ui, sans-serif` : undefined }
    const input: CSSProperties = { ...font, boxSizing: "border-box", width: "100%", height: fieldHeight, padding: "0 16px", borderRadius: radius, border: `1px solid ${borderColor}`, background: fieldFill, color: textColor, fontSize: 15, colorScheme: darkFields ? "dark" : "light", WebkitAppearance: "none", appearance: "none", minWidth: 0 }
    const lab = (text: string, field: JSX.Element) => (
        <label style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 0", minWidth: 0 }}>
            <span style={{ ...font, fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: labelColor, userSelect: "none" }}>{text}</span>
            {field}
        </label>
    )
    const row: CSSProperties = { display: "flex", flexDirection: wide ? "row" : "column", gap: 16 }
    const guests = s.guests ? String(s.guests) : ""

    return (
        <div ref={box} className="casa-sf" style={{ ...props.style, ["--sf-focus" as any]: focusColor, ["--sf-ph" as any]: labelColor, width: "100%", display: "flex", flexDirection: "column", gap: 16, borderRadius: radius + 6, boxShadow: flash ? `0 0 0 6px ${focusColor}55` : "0 0 0 0 transparent", transition: "box-shadow .45s" }}>
            <div style={row}>
                {lab(stayMode ? checkInLabel : checkInLabel, <input type="date" name={checkInLabel} value={s.checkIn || ""} min={today} onChange={(e) => edit({ checkIn: e.target.value || undefined })} style={input} />)}
                {stayMode
                    ? lab(checkOutLabel, <input type="date" name={checkOutLabel} value={s.checkOut || ""} min={s.checkIn ? addDays(s.checkIn, 1) : today} onChange={(e) => edit({ checkOut: e.target.value || undefined })} style={input} />)
                    : lab(guestsLabel, <input type="number" name={guestsLabel} inputMode="numeric" min={1} max={maxGuests} value={guests} placeholder="2" onChange={(e) => edit({ guests: Math.max(1, Math.min(maxGuests, parseInt(e.target.value, 10) || 0)) || undefined })} style={input} />)}
            </div>
            {(stayMode || showChoice) && (
                <div style={row}>
                    {stayMode && lab(guestsLabel, <input type="number" name={guestsLabel} inputMode="numeric" min={1} max={maxGuests} value={guests} placeholder="2" onChange={(e) => edit({ guests: Math.max(1, Math.min(maxGuests, parseInt(e.target.value, 10) || 0)) || undefined })} style={input} />)}
                    {showChoice && lab(choiceLabel, <input type="text" name={choiceLabel} value={s.option || ""} placeholder={choicePlaceholder} onChange={(e) => edit({ option: e.target.value || undefined })} style={input} />)}
                </div>
            )}
        </div>
    )
}

addPropertyControls(CasaStayFields, {
    format: { type: ControlType.Enum, title: "Booking", options: ["stay", "evening"], optionTitles: ["Stay", "Evening"], defaultValue: "stay", displaySegmentedControl: true, description: "Place this inside your Framer form. Its fields are sent with the form, named after their labels." },
    checkInLabel: { type: ControlType.String, title: "Check-in", defaultValue: "Arrival" },
    checkOutLabel: { type: ControlType.String, title: "Check-out", defaultValue: "Departure", hidden: (p: Partial<Props>) => p.format === "evening" },
    guestsLabel: { type: ControlType.String, title: "Guests", defaultValue: "Guests" },
    showChoice: { type: ControlType.Boolean, title: "Villa Field", defaultValue: true, description: "Shows the villa or experience chosen in Casa Booking Bar." },
    choiceLabel: { type: ControlType.String, title: "Villa Label", defaultValue: "Villa", hidden: (p: Partial<Props>) => !p.showChoice },
    choicePlaceholder: { type: ControlType.String, title: "Villa Hint", defaultValue: "e.g. Overwater Pool Villa", hidden: (p: Partial<Props>) => !p.showChoice },
    maxGuests: { type: ControlType.Number, title: "Max Guests", defaultValue: 12, min: 1, max: 49, step: 1 },
    labelColor: { type: ControlType.Color, title: "Labels", defaultValue: "rgba(255, 255, 255, 0.72)" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    fieldFill: { type: ControlType.Color, title: "Field Fill", defaultValue: "rgba(255, 255, 255, 0.08)" },
    borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(255, 255, 255, 0.22)" },
    focusColor: { type: ControlType.Color, title: "Focus", defaultValue: "#7FE3F0" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 40, unit: "px" },
    fieldHeight: { type: ControlType.Number, title: "Field Height", defaultValue: 50, min: 36, max: 72, unit: "px" },
    darkFields: { type: ControlType.Boolean, title: "Dark Fields", defaultValue: true, description: "Use on dark backgrounds so the date pickers match." },
    fontFamily: { type: ControlType.String, title: "Font", defaultValue: "Inter Tight" },
})
