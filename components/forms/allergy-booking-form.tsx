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


/**
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 780
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Props = {
    componentHeight: number
    heading: string
    intro: string
    restaurantEmail: string
    emailSubject: string
    dateLabel: string
    timeLabel: string
    partyLabel: string
    occasionLabel: string
    dietaryLabel: string
    allergyLabel: string
    severityLabel: string
    nameLabel: string
    contactLabel: string
    notesLabel: string
    summaryTitle: string
    summaryHeading: string
    sendLabel: string
    copyLabel: string
    copiedLabel: string
    requiredNotice: string
    emptyNotice: string
    honeypotEnabled: boolean
    honeypotFieldName: string
    honeypotLabel: string
    honeypotBlockedNotice: string
    disclaimer: string
    timeSlots: string
    partyMin: number
    partyMax: number
    occasionOptions: string
    dietaryOptions: string
    allergyOptions: string
    severityOptions: string
    requireDate: boolean
    requireTime: boolean
    requireParty: boolean
    requireOccasion: boolean
    requireDietary: boolean
    requireAllergies: boolean
    requireSeverity: boolean
    requireName: boolean
    requireContact: boolean
    background: string
    panelBackground: string
    fieldBackground: string
    menuBackground: string
    textColor: string
    mutedColor: string
    accentColor: string
    errorColor: string
    buttonColor: string
    buttonTextColor: string
    lineColor: string
    radius: number
    breakpoint: number
    style?: React.CSSProperties
}

type FormKey =
    | "date"
    | "time"
    | "party"
    | "occasion"
    | "dietary"
    | "allergies"
    | "severity"
    | "name"
    | "contact"

type MenuKey =
    | "date"
    | "time"
    | "party"
    | "occasion"
    | "dietary"
    | "allergies"
    | "severity"
    | null

type Colors = Pick<
    Props,
    | "fieldBackground"
    | "menuBackground"
    | "textColor"
    | "mutedColor"
    | "accentColor"
    | "errorColor"
    | "lineColor"
>

const fontSans =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const fontSerif = 'Georgia, "Times New Roman", Times, serif'

const defaults: Props = {
    componentHeight: 780,
    heading: "Table request, without the allergy guesswork.",
    intro: "Collect the details a restaurant needs before confirming a booking: date, time, party size, dietary preferences, allergies and contact information.",
    restaurantEmail: "reservations@example.com",
    emailSubject: "Restaurant booking request",
    dateLabel: "Preferred date",
    timeLabel: "Preferred time",
    partyLabel: "Party size",
    occasionLabel: "Occasion",
    dietaryLabel: "Dietary preferences",
    allergyLabel: "Allergies",
    severityLabel: "Allergy severity",
    nameLabel: "Name",
    contactLabel: "Contact",
    notesLabel: "Notes",
    summaryTitle: "Booking request",
    summaryHeading: "Review the request before sending.",
    sendLabel: "Send request",
    copyLabel: "Copy summary",
    copiedLabel: "Booking request copied.",
    requiredNotice: "Required",
    emptyNotice: "Please complete the required fields before sending.",
    honeypotEnabled: true,
    honeypotFieldName: "company_website",
    honeypotLabel: "Company website",
    honeypotBlockedNotice:
        "Request blocked. Please refresh the page and try again.",
    disclaimer:
        "This component helps collect dietary and allergy information before a booking. It does not replace direct confirmation with the restaurant team.",
    timeSlots: "17:30, 18:00, 18:30, 19:00, 19:30, 20:00, 20:30, 21:00",
    partyMin: 1,
    partyMax: 10,
    occasionOptions:
        "Dinner, Birthday, Date night, Business, Private event, Other",
    dietaryOptions:
        "No dietary restrictions, Vegetarian, Vegan, Gluten-free, Dairy-free, Halal, Kosher, No alcohol",
    allergyOptions:
        "No known allergies, Nuts, Peanuts, Shellfish, Eggs, Soy, Sesame, Dairy, Gluten, Other",
    severityOptions:
        "No allergy specified, Low sensitivity, Avoid ingredient, Severe allergy, Cross-contact concern",
    requireDate: true,
    requireTime: true,
    requireParty: true,
    requireOccasion: false,
    requireDietary: false,
    requireAllergies: false,
    requireSeverity: false,
    requireName: true,
    requireContact: true,
    background: "#fbf3e7",
    panelBackground: "#fffaf2",
    fieldBackground: "rgba(255,255,255,.62)",
    menuBackground: "#fffaf2",
    textColor: "#21150f",
    mutedColor: "#7a6659",
    accentColor: "#b65f42",
    errorColor: "#b8332f",
    buttonColor: "#21150f",
    buttonTextColor: "#fffaf2",
    lineColor: "rgba(33, 21, 15, .22)",
    radius: 0,
    breakpoint: 780,
}

function mergeProps(props: Partial<Props>): Props {
    return { ...defaults, ...props, style: props.style }
}

function splitOptions(value: string, fallback: string[]) {
    const items = String(value || "")
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    return items.length ? items : fallback
}

function clampInt(value: number, min: number, max: number, fallback: number) {
    const next = Math.round(Number(value))
    if (!Number.isFinite(next)) return fallback
    return Math.min(Math.max(next, min), max)
}

function startOfDay(date: Date) {
    const next = new Date(date)
    next.setHours(0, 0, 0, 0)
    return next
}

function monthStart(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

function toISO(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function parseISO(value: string) {
    if (!value) return null
    const [year, month, day] = value.split("-").map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
}

function formatDate(value: string) {
    const date = parseISO(value)
    if (!date) return "Not specified"
    return new Intl.DateTimeFormat("en", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date)
}

function formatMonth(date: Date) {
    return new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
    }).format(date)
}

function sameMonth(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function useElementWidth<T extends HTMLElement>() {
    const ref = React.useRef<T | null>(null)
    const [width, setWidth] = React.useState(1120)

    React.useEffect(() => {
        const node = ref.current
        if (!node) return

        const measure = () =>
            setWidth(Math.round(node.getBoundingClientRect().width || 1120))
        measure()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }

        const observer = new ResizeObserver(measure)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    return [ref, width] as const
}

function Label({
    text,
    required,
    colors,
}: {
    text: string
    required: boolean
    colors: Colors
}) {
    return (
        <span
            style={{
                color: colors.textColor,
                fontFamily: fontSans,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: ".13em",
                lineHeight: 1.2,
                textTransform: "uppercase",
            }}
        >
            {text}
            {required && (
                <span style={{ color: colors.accentColor, marginLeft: 4 }}>
                    *
                </span>
            )}
        </span>
    )
}

function ErrorText({ text, colors }: { text?: string; colors: Colors }) {
    return (
        <span
            style={{
                minHeight: 15,
                color: colors.errorColor,
                fontSize: 10.5,
                lineHeight: 1.35,
                overflowWrap: "anywhere",
            }}
        >
            {text || ""}
        </span>
    )
}

function fieldShell(open: boolean): React.CSSProperties {
    return {
        position: "relative",
        display: "grid",
        gap: 8,
        minWidth: 0,
        zIndex: open ? 80 : 1,
    }
}

function fieldButton(colors: Colors, hasError: boolean): React.CSSProperties {
    return {
        width: "100%",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0 14px",
        border: `1px solid ${hasError ? colors.errorColor : colors.lineColor}`,
        borderRadius: 0,
        outline: "none",
        color: colors.textColor,
        background: colors.fieldBackground,
        fontFamily: fontSans,
        fontSize: 13,
        lineHeight: 1.25,
        textAlign: "left",
        cursor: "pointer",
        boxSizing: "border-box",
    }
}

function textInput(colors: Colors, hasError: boolean): React.CSSProperties {
    return {
        width: "100%",
        minHeight: 52,
        padding: "0 14px",
        border: `1px solid ${hasError ? colors.errorColor : colors.lineColor}`,
        borderRadius: 0,
        outline: "none",
        color: colors.textColor,
        background: colors.fieldBackground,
        fontFamily: fontSans,
        fontSize: 13,
        lineHeight: 1.25,
        boxSizing: "border-box",
    }
}

function valueText(hasValue: boolean): React.CSSProperties {
    return {
        minWidth: 0,
        flex: "1 1 auto",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        opacity: hasValue ? 1 : 0.6,
    }
}

function Menu({
    children,
    colors,
    maxHeight = 240,
}: {
    children: React.ReactNode
    colors: Colors
    maxHeight?: number
}) {
    return (
        <div
            role="listbox"
            style={{
                position: "absolute",
                top: 78,
                left: 0,
                right: 0,
                zIndex: 120,
                maxHeight,
                overflowY: "auto",
                border: `1px solid ${colors.accentColor}`,
                background: colors.menuBackground,
                boxShadow: "0 18px 40px rgba(0,0,0,.16)",
                boxSizing: "border-box",
            }}
        >
            {children}
        </div>
    )
}

function OptionButton({
    option,
    selected,
    colors,
    onClick,
}: {
    option: string
    selected: boolean
    colors: Colors
    onClick: () => void
}) {
    return (
        <button
            type="button"
            role="option"
            aria-selected={selected}
            onClick={onClick}
            style={{
                width: "100%",
                minHeight: 39,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                border: 0,
                borderBottom: `1px solid ${colors.lineColor}`,
                color: colors.textColor,
                background: selected
                    ? colors.fieldBackground
                    : colors.menuBackground,
                fontFamily: fontSans,
                fontSize: 12.5,
                lineHeight: 1.3,
                textAlign: "left",
                cursor: "pointer",
            }}
        >
            {option}
        </button>
    )
}

function Chevron({ color, open }: { color: string; open: boolean }) {
    return (
        <span
            aria-hidden="true"
            style={{
                width: 7,
                height: 7,
                borderRight: `1.5px solid ${color}`,
                borderBottom: `1.5px solid ${color}`,
                transform: open
                    ? "rotate(225deg) translate(-1px, -1px)"
                    : "rotate(45deg) translate(-2px, -2px)",
                flex: "0 0 auto",
            }}
        />
    )
}

function SelectField({
    id,
    label,
    required,
    value,
    placeholder,
    options,
    openMenu,
    setOpenMenu,
    onChange,
    error,
    colors,
}: {
    id: Exclude<MenuKey, "date" | "dietary" | "allergies" | null>
    label: string
    required: boolean
    value: string
    placeholder: string
    options: string[]
    openMenu: MenuKey
    setOpenMenu: (value: MenuKey) => void
    onChange: (value: string) => void
    error?: string
    colors: Colors
}) {
    const open = openMenu === id
    return (
        <label style={fieldShell(open)}>
            <Label text={label} required={required} colors={colors} />
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpenMenu(open ? null : id)}
                style={fieldButton(colors, !!error)}
            >
                <span style={valueText(Boolean(value))}>
                    {value || placeholder}
                </span>
                <Chevron color={colors.accentColor} open={open} />
            </button>
            {open && (
                <Menu colors={colors}>
                    {options.map((option) => (
                        <OptionButton
                            key={option}
                            option={option}
                            selected={option === value}
                            colors={colors}
                            onClick={() => {
                                onChange(option)
                                setOpenMenu(null)
                            }}
                        />
                    ))}
                </Menu>
            )}
            <ErrorText text={error} colors={colors} />
        </label>
    )
}

function MultiField({
    id,
    label,
    required,
    selected,
    placeholder,
    options,
    openMenu,
    setOpenMenu,
    onToggle,
    onClear,
    error,
    colors,
}: {
    id: "dietary" | "allergies"
    label: string
    required: boolean
    selected: string[]
    placeholder: string
    options: string[]
    openMenu: MenuKey
    setOpenMenu: (value: MenuKey) => void
    onToggle: (value: string) => void
    onClear: () => void
    error?: string
    colors: Colors
}) {
    const open = openMenu === id
    const text = selected.length ? selected.join(", ") : placeholder
    return (
        <label style={fieldShell(open)}>
            <Label text={label} required={required} colors={colors} />
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpenMenu(open ? null : id)}
                style={fieldButton(colors, !!error)}
            >
                <span style={valueText(selected.length > 0)}>{text}</span>
                <Chevron color={colors.accentColor} open={open} />
            </button>
            {open && (
                <Menu colors={colors}>
                    {options.map((option) => {
                        const active = selected.includes(option)
                        return (
                            <button
                                key={option}
                                type="button"
                                role="option"
                                aria-selected={active}
                                onClick={() => onToggle(option)}
                                style={{
                                    width: "100%",
                                    minHeight: 39,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "10px 12px",
                                    border: 0,
                                    borderBottom: `1px solid ${colors.lineColor}`,
                                    color: colors.textColor,
                                    background: active
                                        ? colors.fieldBackground
                                        : colors.menuBackground,
                                    fontFamily: fontSans,
                                    fontSize: 12.5,
                                    lineHeight: 1.3,
                                    textAlign: "left",
                                    cursor: "pointer",
                                }}
                            >
                                <span
                                    style={{
                                        width: 18,
                                        color: colors.accentColor,
                                    }}
                                >
                                    {active ? "✓" : ""}
                                </span>
                                {option}
                            </button>
                        )
                    })}
                    {selected.length > 0 && (
                        <button
                            type="button"
                            onClick={onClear}
                            style={{
                                width: "100%",
                                minHeight: 39,
                                padding: "10px 12px",
                                border: 0,
                                color: colors.mutedColor,
                                background: colors.menuBackground,
                                fontFamily: fontSans,
                                fontSize: 12.5,
                                textAlign: "left",
                                cursor: "pointer",
                            }}
                        >
                            Clear selection
                        </button>
                    )}
                </Menu>
            )}
            <ErrorText text={error} colors={colors} />
        </label>
    )
}

function TextField({
    label,
    required,
    value,
    placeholder,
    onChange,
    error,
    colors,
}: {
    label: string
    required: boolean
    value: string
    placeholder: string
    onChange: (value: string) => void
    error?: string
    colors: Colors
}) {
    return (
        <label style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <Label text={label} required={required} colors={colors} />
            <input
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                style={textInput(colors, !!error)}
            />
            <ErrorText text={error} colors={colors} />
        </label>
    )
}

function NotesField({
    label,
    value,
    placeholder,
    onChange,
    colors,
}: {
    label: string
    value: string
    placeholder: string
    onChange: (value: string) => void
    colors: Colors
}) {
    return (
        <label style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <Label text={label} required={false} colors={colors} />
            <textarea
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                style={{
                    ...textInput(colors, false),
                    minHeight: 88,
                    paddingTop: 12,
                    resize: "vertical",
                }}
            />
            <ErrorText colors={colors} />
        </label>
    )
}

function calendarDays(month: Date) {
    const first = monthStart(month)
    const mondayOffset = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - mondayOffset)
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start)
        date.setDate(start.getDate() + index)
        return date
    })
}

function primaryButton(p: Props): React.CSSProperties {
    return {
        minHeight: 48,
        padding: "0 22px",
        border: 0,
        borderRadius: 0,
        color: p.buttonTextColor,
        background: p.buttonColor,
        fontFamily: fontSans,
        fontSize: 10.5,
        fontWeight: 900,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        cursor: "pointer",
    }
}

function secondaryButton(p: Props): React.CSSProperties {
    return {
        minHeight: 48,
        padding: "0 18px",
        border: `1px solid ${p.lineColor}`,
        borderRadius: 0,
        color: p.textColor,
        background: "transparent",
        fontFamily: fontSans,
        fontSize: 10.5,
        fontWeight: 900,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        cursor: "pointer",
    }
}

export default function TableRequestBookingAllergyIntakeV4(
    inputProps: Partial<Props>
) {
    const p = mergeProps(inputProps)
    const [rootRef, width] = useElementWidth<HTMLDivElement>()
    const today = React.useMemo(() => startOfDay(new Date()), [])
    const [month, setMonth] = React.useState(() => monthStart(today))
    const [openMenu, setOpenMenu] = React.useState<MenuKey>(null)
    const [selectedDate, setSelectedDate] = React.useState("")
    const [time, setTime] = React.useState("")
    const [party, setParty] = React.useState("")
    const [occasion, setOccasion] = React.useState("")
    const [dietary, setDietary] = React.useState<string[]>([])
    const [allergies, setAllergies] = React.useState<string[]>([])
    const [severity, setSeverity] = React.useState("")
    const [name, setName] = React.useState("")
    const [contact, setContact] = React.useState("")
    const [notes, setNotes] = React.useState("")
    const [errors, setErrors] = React.useState<
        Partial<Record<FormKey, string>>
    >({})
    const [status, setStatus] = React.useState("")
    const [honeypot, setHoneypot] = React.useState("")

    const colors: Colors = {
        fieldBackground: p.fieldBackground,
        menuBackground: p.menuBackground,
        textColor: p.textColor,
        mutedColor: p.mutedColor,
        accentColor: p.accentColor,
        errorColor: p.errorColor,
        lineColor: p.lineColor,
    }

    const compact = width <= p.breakpoint
    const veryCompact = width <= 540

    const timeOptions = React.useMemo(
        () => splitOptions(p.timeSlots, splitOptions(defaults.timeSlots, [])),
        [p.timeSlots]
    )
    const minParty = clampInt(p.partyMin, 1, 100, 1)
    const maxParty = clampInt(p.partyMax, minParty, 100, 10)
    const partyOptions = React.useMemo(
        () =>
            Array.from({ length: maxParty - minParty + 1 }, (_, i) =>
                String(minParty + i)
            ),
        [minParty, maxParty]
    )
    const occasionOptions = React.useMemo(
        () =>
            splitOptions(
                p.occasionOptions,
                splitOptions(defaults.occasionOptions, [])
            ),
        [p.occasionOptions]
    )
    const dietaryOptions = React.useMemo(
        () =>
            splitOptions(
                p.dietaryOptions,
                splitOptions(defaults.dietaryOptions, [])
            ),
        [p.dietaryOptions]
    )
    const allergyOptions = React.useMemo(
        () =>
            splitOptions(
                p.allergyOptions,
                splitOptions(defaults.allergyOptions, [])
            ),
        [p.allergyOptions]
    )
    const severityOptions = React.useMemo(
        () =>
            splitOptions(
                p.severityOptions,
                splitOptions(defaults.severityOptions, [])
            ),
        [p.severityOptions]
    )

    React.useEffect(() => {
        if (typeof document === "undefined") return
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenMenu(null)
        }
        document.addEventListener("keydown", onEscape)
        return () => document.removeEventListener("keydown", onEscape)
    }, [])

    const clearError = (key: FormKey) => {
        setErrors((current) => ({ ...current, [key]: undefined }))
        setStatus("")
    }

    const toggleFrom = (current: string[], item: string) => {
        if (current.includes(item))
            return current.filter((value) => value !== item)
        return [...current, item]
    }

    const validate = () => {
        if (p.honeypotEnabled && honeypot.trim()) {
            setErrors({})
            setStatus(
                p.honeypotBlockedNotice ||
                    "Request blocked. Please refresh the page and try again."
            )
            return false
        }

        const next: Partial<Record<FormKey, string>> = {}
        const missing = p.requiredNotice || "Required"

        if (p.requireDate && !selectedDate) next.date = missing
        if (p.requireTime && !time) next.time = missing
        if (p.requireParty && !party) next.party = missing
        if (p.requireOccasion && !occasion) next.occasion = missing
        if (p.requireDietary && dietary.length === 0) next.dietary = missing
        if (p.requireAllergies && allergies.length === 0)
            next.allergies = missing
        if (p.requireSeverity && !severity) next.severity = missing
        if (p.requireName && !name.trim()) next.name = missing
        if (p.requireContact && !contact.trim()) next.contact = missing

        const hasAnyInput = Boolean(
            selectedDate ||
                time ||
                party ||
                occasion ||
                dietary.length ||
                allergies.length ||
                severity ||
                name.trim() ||
                contact.trim() ||
                notes.trim()
        )
        if (!hasAnyInput) {
            next.date =
                next.date ||
                p.emptyNotice ||
                "Add booking details before sending."
            next.time =
                next.time ||
                p.emptyNotice ||
                "Add booking details before sending."
        }

        setErrors(next)
        return Object.keys(next).length === 0
    }

    const summaryTitleText =
        (p.summaryTitle || p.emailSubject || defaults.emailSubject).trim() ||
        defaults.emailSubject
    const summaryLabel = (value: string, fallback: string) =>
        (value || fallback).trim() || fallback

    const summary = [
        summaryTitleText,
        `${summaryLabel(p.dateLabel, defaults.dateLabel)}: ${formatDate(selectedDate)}`,
        `${summaryLabel(p.timeLabel, defaults.timeLabel)}: ${time || "Not specified"}`,
        `${summaryLabel(p.partyLabel, defaults.partyLabel)}: ${party || "Not specified"}`,
        `${summaryLabel(p.occasionLabel, defaults.occasionLabel)}: ${occasion || "Not specified"}`,
        `${summaryLabel(p.dietaryLabel, defaults.dietaryLabel)}: ${dietary.length ? dietary.join(", ") : "None specified"}`,
        `${summaryLabel(p.allergyLabel, defaults.allergyLabel)}: ${allergies.length ? allergies.join(", ") : "None specified"}`,
        `${summaryLabel(p.severityLabel, defaults.severityLabel)}: ${severity || "Not specified"}`,
        `${summaryLabel(p.nameLabel, defaults.nameLabel)}: ${name.trim() || "Not specified"}`,
        `${summaryLabel(p.contactLabel, defaults.contactLabel)}: ${contact.trim() || "Not specified"}`,
        `${summaryLabel(p.notesLabel, defaults.notesLabel)}: ${notes.trim() || "None"}`,
        "",
        p.disclaimer,
    ].join("\n")

    const sendEmail = () => {
        if (!validate()) {
            if (!(p.honeypotEnabled && honeypot.trim())) {
                setStatus(
                    p.emptyNotice ||
                        "Please complete the required fields before sending."
                )
            }
            return
        }
        const recipient = encodeURIComponent(p.restaurantEmail || "")
        const subject = encodeURIComponent(
            p.emailSubject || defaults.emailSubject
        )
        const body = encodeURIComponent(summary)
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`
    }

    const copySummary = async () => {
        if (!validate()) {
            if (!(p.honeypotEnabled && honeypot.trim())) {
                setStatus(
                    p.emptyNotice ||
                        "Please complete the required fields before copying."
                )
            }
            return
        }

        const canUseClipboard =
            typeof navigator !== "undefined" &&
            Boolean(navigator.clipboard?.writeText)

        if (!canUseClipboard) {
            setStatus("Copy is unavailable. Select the summary manually.")
            return
        }

        try {
            await navigator.clipboard.writeText(summary)
            setStatus(p.copiedLabel || defaults.copiedLabel)
        } catch {
            setStatus("Copy failed. Select the summary manually.")
        }
    }

    const days = calendarDays(month)
    const canGoPrev = month > monthStart(today)

    return (
        <div
            ref={rootRef}
            style={{
                ...p.style,
                width: "100%",
                minWidth: 0,
                height: p.componentHeight,
                minHeight: p.componentHeight,
                borderRadius: p.radius,
                background: p.background,
                color: p.textColor,
                fontFamily: fontSans,
                border: `1px solid ${p.lineColor}`,
                boxSizing: "border-box",
                overflow: "visible",
                position: "relative",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: compact
                        ? "1fr"
                        : "minmax(0, 1.05fr) minmax(330px, .78fr)",
                    gridTemplateRows: compact
                        ? "auto minmax(0, 1fr)"
                        : "minmax(0, 1fr)",
                    height: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    overflow: "hidden",
                    borderRadius: p.radius,
                }}
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        sendEmail()
                    }}
                    style={{
                        display: "grid",
                        gridTemplateColumns: veryCompact
                            ? "1fr"
                            : "repeat(2, minmax(0, 1fr))",
                        alignContent: "start",
                        gap: veryCompact ? "16px" : "18px 18px",
                        minWidth: 0,
                        minHeight: 0,
                        overflowY: "auto",
                        overflowX: "hidden",
                        padding: veryCompact
                            ? "24px 18px"
                            : compact
                              ? "28px 24px"
                              : "42px 34px 42px 38px",
                        boxSizing: "border-box",
                        borderRight: compact ? 0 : `1px solid ${p.lineColor}`,
                        borderBottom: compact ? `1px solid ${p.lineColor}` : 0,
                    }}
                >
                    {p.honeypotEnabled && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: -10000,
                                top: "auto",
                                width: 1,
                                height: 1,
                                overflow: "hidden",
                                opacity: 0,
                                pointerEvents: "none",
                            }}
                        >
                            <label>
                                {p.honeypotLabel || "Leave this field empty"}
                                <input
                                    type="text"
                                    name={
                                        p.honeypotFieldName || "company_website"
                                    }
                                    value={honeypot}
                                    onChange={(event) =>
                                        setHoneypot(event.target.value)
                                    }
                                    tabIndex={-1}
                                    autoComplete="off"
                                />
                            </label>
                        </div>
                    )}

                    <div style={{ gridColumn: "1 / -1", marginBottom: 4 }}>
                        <h2
                            style={{
                                margin: 0,
                                color: p.textColor,
                                fontFamily: fontSerif,
                                fontSize: veryCompact ? 34 : 44,
                                fontWeight: 400,
                                lineHeight: 1.02,
                                letterSpacing: "-.035em",
                            }}
                        >
                            {p.heading}
                        </h2>
                        <p
                            style={{
                                maxWidth: 620,
                                margin: "14px 0 0",
                                color: p.mutedColor,
                                fontSize: 13,
                                lineHeight: 1.6,
                            }}
                        >
                            {p.intro}
                        </p>
                    </div>

                    <label style={fieldShell(openMenu === "date")}>
                        <Label
                            text={p.dateLabel}
                            required={p.requireDate}
                            colors={colors}
                        />
                        <button
                            type="button"
                            aria-haspopup="dialog"
                            aria-expanded={openMenu === "date"}
                            onClick={() =>
                                setOpenMenu(openMenu === "date" ? null : "date")
                            }
                            style={fieldButton(colors, !!errors.date)}
                        >
                            <span style={valueText(Boolean(selectedDate))}>
                                {selectedDate
                                    ? formatDate(selectedDate)
                                    : "Select date"}
                            </span>
                            <span
                                aria-hidden="true"
                                style={{ color: p.accentColor, fontSize: 15 }}
                            >
                                ▣
                            </span>
                        </button>
                        {openMenu === "date" && (
                            <div
                                role="dialog"
                                style={{
                                    position: "absolute",
                                    top: 78,
                                    left: 0,
                                    zIndex: 140,
                                    width: "min(100%, 310px)",
                                    padding: 14,
                                    border: `1px solid ${p.accentColor}`,
                                    background: p.menuBackground,
                                    boxShadow: "0 18px 40px rgba(0,0,0,.16)",
                                    boxSizing: "border-box",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 12,
                                    }}
                                >
                                    <button
                                        type="button"
                                        disabled={!canGoPrev}
                                        onClick={() =>
                                            canGoPrev &&
                                            setMonth(
                                                new Date(
                                                    month.getFullYear(),
                                                    month.getMonth() - 1,
                                                    1
                                                )
                                            )
                                        }
                                        style={{
                                            width: 32,
                                            height: 32,
                                            border: `1px solid ${p.lineColor}`,
                                            borderRadius: 999,
                                            color: canGoPrev
                                                ? p.textColor
                                                : p.mutedColor,
                                            opacity: canGoPrev ? 1 : 0.35,
                                            background: p.fieldBackground,
                                            fontSize: 22,
                                            lineHeight: 1,
                                            cursor: canGoPrev
                                                ? "pointer"
                                                : "not-allowed",
                                        }}
                                    >
                                        ‹
                                    </button>
                                    <strong
                                        style={{
                                            fontFamily: fontSerif,
                                            fontSize: 16,
                                            fontWeight: 400,
                                        }}
                                    >
                                        {formatMonth(month)}
                                    </strong>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMonth(
                                                new Date(
                                                    month.getFullYear(),
                                                    month.getMonth() + 1,
                                                    1
                                                )
                                            )
                                        }
                                        style={{
                                            width: 32,
                                            height: 32,
                                            border: `1px solid ${p.lineColor}`,
                                            borderRadius: 999,
                                            color: p.textColor,
                                            background: p.fieldBackground,
                                            fontSize: 22,
                                            lineHeight: 1,
                                            cursor: "pointer",
                                        }}
                                    >
                                        ›
                                    </button>
                                </div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(7, 1fr)",
                                        gap: 4,
                                    }}
                                >
                                    {[
                                        "Mon",
                                        "Tue",
                                        "Wed",
                                        "Thu",
                                        "Fri",
                                        "Sat",
                                        "Sun",
                                    ].map((day) => (
                                        <span
                                            key={day}
                                            style={{
                                                color: p.mutedColor,
                                                fontSize: 9,
                                                fontWeight: 900,
                                                letterSpacing: ".1em",
                                                textAlign: "center",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {day}
                                        </span>
                                    ))}
                                    {days.map((day) => {
                                        const iso = toISO(day)
                                        const past = startOfDay(day) < today
                                        const selected = iso === selectedDate
                                        const outside = !sameMonth(day, month)
                                        return (
                                            <button
                                                key={iso}
                                                type="button"
                                                disabled={past}
                                                onClick={() => {
                                                    if (past) return
                                                    setSelectedDate(iso)
                                                    clearError("date")
                                                    setOpenMenu(null)
                                                }}
                                                style={{
                                                    height: 34,
                                                    border: selected
                                                        ? `1px solid ${p.accentColor}`
                                                        : "1px solid transparent",
                                                    borderRadius: 999,
                                                    color: past
                                                        ? p.mutedColor
                                                        : outside
                                                          ? p.mutedColor
                                                          : p.textColor,
                                                    opacity: past
                                                        ? 0.28
                                                        : outside
                                                          ? 0.52
                                                          : 1,
                                                    background: selected
                                                        ? p.fieldBackground
                                                        : "transparent",
                                                    fontFamily: fontSans,
                                                    fontSize: 12,
                                                    fontWeight: selected
                                                        ? 900
                                                        : 650,
                                                    cursor: past
                                                        ? "not-allowed"
                                                        : "pointer",
                                                }}
                                            >
                                                {day.getDate()}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        <ErrorText text={errors.date} colors={colors} />
                    </label>

                    <SelectField
                        id="time"
                        label={p.timeLabel}
                        required={p.requireTime}
                        value={time}
                        placeholder="Select time"
                        options={timeOptions}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onChange={(value) => {
                            setTime(value)
                            clearError("time")
                        }}
                        error={errors.time}
                        colors={colors}
                    />
                    <SelectField
                        id="party"
                        label={p.partyLabel}
                        required={p.requireParty}
                        value={party}
                        placeholder="Select party size"
                        options={partyOptions}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onChange={(value) => {
                            setParty(value)
                            clearError("party")
                        }}
                        error={errors.party}
                        colors={colors}
                    />
                    <SelectField
                        id="occasion"
                        label={p.occasionLabel}
                        required={p.requireOccasion}
                        value={occasion}
                        placeholder="Select occasion"
                        options={occasionOptions}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onChange={(value) => {
                            setOccasion(value)
                            clearError("occasion")
                        }}
                        error={errors.occasion}
                        colors={colors}
                    />
                    <MultiField
                        id="dietary"
                        label={p.dietaryLabel}
                        required={p.requireDietary}
                        selected={dietary}
                        placeholder="Select dietary preferences"
                        options={dietaryOptions}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onToggle={(value) => {
                            setDietary((current) => toggleFrom(current, value))
                            clearError("dietary")
                        }}
                        onClear={() => setDietary([])}
                        error={errors.dietary}
                        colors={colors}
                    />
                    <MultiField
                        id="allergies"
                        label={p.allergyLabel}
                        required={p.requireAllergies}
                        selected={allergies}
                        placeholder="Select allergies"
                        options={allergyOptions}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onToggle={(value) => {
                            setAllergies((current) =>
                                toggleFrom(current, value)
                            )
                            clearError("allergies")
                        }}
                        onClear={() => setAllergies([])}
                        error={errors.allergies}
                        colors={colors}
                    />
                    <SelectField
                        id="severity"
                        label={p.severityLabel}
                        required={p.requireSeverity}
                        value={severity}
                        placeholder="Select severity"
                        options={severityOptions}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onChange={(value) => {
                            setSeverity(value)
                            clearError("severity")
                        }}
                        error={errors.severity}
                        colors={colors}
                    />
                    <TextField
                        label={p.nameLabel}
                        required={p.requireName}
                        value={name}
                        placeholder="Guest name"
                        onChange={(value) => {
                            setName(value)
                            clearError("name")
                        }}
                        error={errors.name}
                        colors={colors}
                    />
                    <TextField
                        label={p.contactLabel}
                        required={p.requireContact}
                        value={contact}
                        placeholder="Email or phone"
                        onChange={(value) => {
                            setContact(value)
                            clearError("contact")
                        }}
                        error={errors.contact}
                        colors={colors}
                    />

                    <div style={{ gridColumn: "1 / -1" }}>
                        <NotesField
                            label={p.notesLabel}
                            value={notes}
                            placeholder="Anything the restaurant should know?"
                            onChange={setNotes}
                            colors={colors}
                        />
                    </div>

                    <div
                        style={{
                            gridColumn: "1 / -1",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <button type="submit" style={primaryButton(p)}>
                            {p.sendLabel}
                        </button>
                        <button
                            type="button"
                            onClick={copySummary}
                            style={secondaryButton(p)}
                        >
                            {p.copyLabel}
                        </button>
                        <span
                            style={{
                                minHeight: 18,
                                color:
                                    status.toLowerCase().includes("complete") ||
                                    status.toLowerCase().includes("required")
                                        ? p.errorColor
                                        : p.mutedColor,
                                fontSize: 11,
                            }}
                        >
                            {status}
                        </span>
                    </div>
                </form>

                <aside
                    style={{
                        minWidth: 0,
                        minHeight: 0,
                        overflowY: "auto",
                        padding: veryCompact
                            ? "24px 18px"
                            : compact
                              ? "28px 24px"
                              : "42px 38px",
                        background: p.panelBackground,
                        boxSizing: "border-box",
                    }}
                >
                    <p
                        style={{
                            margin: "0 0 14px",
                            color: p.accentColor,
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                        }}
                    >
                        {p.summaryTitle}
                    </p>
                    <h3
                        style={{
                            margin: "0 0 18px",
                            color: p.textColor,
                            fontFamily: fontSerif,
                            fontSize: veryCompact ? 30 : 38,
                            fontWeight: 400,
                            lineHeight: 1.04,
                        }}
                    >
                        {p.summaryHeading}
                    </h3>
                    <div
                        style={{
                            display: "grid",
                            gap: 1,
                            border: `1px solid ${p.lineColor}`,
                            background: p.lineColor,
                        }}
                    >
                        {[
                            [p.dateLabel, formatDate(selectedDate)],
                            [p.timeLabel, time || "Not specified"],
                            [p.partyLabel, party || "Not specified"],
                            [p.occasionLabel, occasion || "Not specified"],
                            [
                                p.dietaryLabel,
                                dietary.length
                                    ? dietary.join(", ")
                                    : "None specified",
                            ],
                            [
                                p.allergyLabel,
                                allergies.length
                                    ? allergies.join(", ")
                                    : "None specified",
                            ],
                            [p.severityLabel, severity || "Not specified"],
                            [p.nameLabel, name.trim() || "Not specified"],
                            [p.contactLabel, contact.trim() || "Not specified"],
                            [p.notesLabel, notes.trim() || "None"],
                        ].map(([label, value]) => (
                            <div
                                key={String(label)}
                                style={{
                                    display: "grid",
                                    gap: 4,
                                    padding: "12px 13px",
                                    background: p.panelBackground,
                                }}
                            >
                                <span
                                    style={{
                                        color: p.mutedColor,
                                        fontSize: 9,
                                        fontWeight: 900,
                                        letterSpacing: ".1em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {label}
                                </span>
                                <strong
                                    style={{
                                        color: p.textColor,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        lineHeight: 1.35,
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {value}
                                </strong>
                            </div>
                        ))}
                    </div>
                    <p
                        style={{
                            margin: "18px 0 0",
                            color: p.mutedColor,
                            fontSize: 11.5,
                            lineHeight: 1.55,
                        }}
                    >
                        {p.disclaimer}
                    </p>
                </aside>
            </div>
        </div>
    )
}

TableRequestBookingAllergyIntakeV4.defaultProps = defaults

addPropertyControls(TableRequestBookingAllergyIntakeV4, {
    componentHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 780,
        min: 560,
        max: 1400,
        step: 10,
        unit: "px",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        displayTextArea: true,
        defaultValue: defaults.heading,
    },
    intro: {
        type: ControlType.String,
        title: "Intro",
        displayTextArea: true,
        defaultValue: defaults.intro,
    },
    restaurantEmail: {
        type: ControlType.String,
        title: "Email to",
        defaultValue: defaults.restaurantEmail,
    },
    emailSubject: {
        type: ControlType.String,
        title: "Email subject",
        defaultValue: defaults.emailSubject,
    },
    dateLabel: {
        type: ControlType.String,
        title: "Date label",
        defaultValue: defaults.dateLabel,
    },
    timeLabel: {
        type: ControlType.String,
        title: "Time label",
        defaultValue: defaults.timeLabel,
    },
    partyLabel: {
        type: ControlType.String,
        title: "Party label",
        defaultValue: defaults.partyLabel,
    },
    occasionLabel: {
        type: ControlType.String,
        title: "Occasion label",
        defaultValue: defaults.occasionLabel,
    },
    dietaryLabel: {
        type: ControlType.String,
        title: "Diet label",
        defaultValue: defaults.dietaryLabel,
    },
    allergyLabel: {
        type: ControlType.String,
        title: "Allergy label",
        defaultValue: defaults.allergyLabel,
    },
    severityLabel: {
        type: ControlType.String,
        title: "Severity label",
        defaultValue: defaults.severityLabel,
    },
    nameLabel: {
        type: ControlType.String,
        title: "Name label",
        defaultValue: defaults.nameLabel,
    },
    contactLabel: {
        type: ControlType.String,
        title: "Contact label",
        defaultValue: defaults.contactLabel,
    },
    notesLabel: {
        type: ControlType.String,
        title: "Notes label",
        defaultValue: defaults.notesLabel,
    },
    summaryTitle: {
        type: ControlType.String,
        title: "Summary title",
        defaultValue: defaults.summaryTitle,
    },
    summaryHeading: {
        type: ControlType.String,
        title: "Summary heading",
        displayTextArea: true,
        defaultValue: defaults.summaryHeading,
    },
    sendLabel: {
        type: ControlType.String,
        title: "Send label",
        defaultValue: defaults.sendLabel,
    },
    copyLabel: {
        type: ControlType.String,
        title: "Copy label",
        defaultValue: defaults.copyLabel,
    },
    copiedLabel: {
        type: ControlType.String,
        title: "Copied text",
        defaultValue: defaults.copiedLabel,
    },
    requiredNotice: {
        type: ControlType.String,
        title: "Required text",
        defaultValue: defaults.requiredNotice,
    },
    emptyNotice: {
        type: ControlType.String,
        title: "Empty error",
        displayTextArea: true,
        defaultValue: defaults.emptyNotice,
    },
    honeypotEnabled: {
        type: ControlType.Boolean,
        title: "Spam trap",
        defaultValue: true,
    },
    honeypotFieldName: {
        type: ControlType.String,
        title: "Trap field",
        defaultValue: defaults.honeypotFieldName,
        hidden: (props) => !props.honeypotEnabled,
    },
    honeypotLabel: {
        type: ControlType.String,
        title: "Trap label",
        defaultValue: defaults.honeypotLabel,
        hidden: (props) => !props.honeypotEnabled,
    },
    honeypotBlockedNotice: {
        type: ControlType.String,
        title: "Trap error",
        displayTextArea: true,
        defaultValue: defaults.honeypotBlockedNotice,
        hidden: (props) => !props.honeypotEnabled,
    },
    disclaimer: {
        type: ControlType.String,
        title: "Disclaimer",
        displayTextArea: true,
        defaultValue: defaults.disclaimer,
    },
    timeSlots: {
        type: ControlType.String,
        title: "Time slots",
        displayTextArea: true,
        defaultValue: defaults.timeSlots,
        description: "Comma, semicolon or line separated.",
    },
    partyMin: {
        type: ControlType.Number,
        title: "Party min",
        defaultValue: 1,
        min: 1,
        max: 100,
        step: 1,
    },
    partyMax: {
        type: ControlType.Number,
        title: "Party max",
        defaultValue: 10,
        min: 1,
        max: 100,
        step: 1,
    },
    occasionOptions: {
        type: ControlType.String,
        title: "Occasions",
        displayTextArea: true,
        defaultValue: defaults.occasionOptions,
    },
    dietaryOptions: {
        type: ControlType.String,
        title: "Diet options",
        displayTextArea: true,
        defaultValue: defaults.dietaryOptions,
    },
    allergyOptions: {
        type: ControlType.String,
        title: "Allergy options",
        displayTextArea: true,
        defaultValue: defaults.allergyOptions,
    },
    severityOptions: {
        type: ControlType.String,
        title: "Severity options",
        displayTextArea: true,
        defaultValue: defaults.severityOptions,
    },
    requireDate: {
        type: ControlType.Boolean,
        title: "Require date",
        defaultValue: true,
    },
    requireTime: {
        type: ControlType.Boolean,
        title: "Require time",
        defaultValue: true,
    },
    requireParty: {
        type: ControlType.Boolean,
        title: "Require party",
        defaultValue: true,
    },
    requireOccasion: {
        type: ControlType.Boolean,
        title: "Require occasion",
        defaultValue: false,
    },
    requireDietary: {
        type: ControlType.Boolean,
        title: "Require diet",
        defaultValue: false,
    },
    requireAllergies: {
        type: ControlType.Boolean,
        title: "Require allergies",
        defaultValue: false,
    },
    requireSeverity: {
        type: ControlType.Boolean,
        title: "Require severity",
        defaultValue: false,
    },
    requireName: {
        type: ControlType.Boolean,
        title: "Require name",
        defaultValue: true,
    },
    requireContact: {
        type: ControlType.Boolean,
        title: "Require contact",
        defaultValue: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: defaults.background,
    },
    panelBackground: {
        type: ControlType.Color,
        title: "Panel",
        defaultValue: defaults.panelBackground,
    },
    fieldBackground: {
        type: ControlType.Color,
        title: "Fields",
        defaultValue: defaults.fieldBackground,
    },
    menuBackground: {
        type: ControlType.Color,
        title: "Menu",
        defaultValue: defaults.menuBackground,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: defaults.textColor,
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: defaults.mutedColor,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: defaults.accentColor,
    },
    errorColor: {
        type: ControlType.Color,
        title: "Error",
        defaultValue: defaults.errorColor,
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button fill",
        defaultValue: defaults.buttonColor,
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button text",
        defaultValue: defaults.buttonTextColor,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Lines",
        defaultValue: defaults.lineColor,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        defaultValue: 780,
        min: 520,
        max: 980,
        step: 10,
        unit: "px",
    },
})
