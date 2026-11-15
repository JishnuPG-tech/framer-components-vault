// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useLayoutEffect, useRef, useState, startTransition, type CSSProperties } from "react"

// Open Hours Live — opening hours with a live open / closed status, in the business's own time zone.
// Designed by Miguel Recio · miguelrecio.es · Free on the Framer Marketplace.
// Documentation: https://miguelrecio-components.framer.website/open-hours/docs

type Layout = "status" | "today" | "week" | "compact" | "strip"
type TimeFormat = "auto" | "24h" | "12h"
type BusinessType = "LocalBusiness" | "Restaurant" | "Hotel" | "LegalService" | "AccountingService" | "Store" | "CafeOrCoffeeShop"
type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

interface SpecialDay {
    date: string
    hours: string
    label: string
}

interface Props {
    layout: Layout
    align: "left" | "center"
    showStatus: boolean
    // Week
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
    // Special days
    specialDays: SpecialDay[]
    showSpecials: boolean
    specialAhead: number
    // Time
    timeZone: string
    timeFormat: TimeFormat
    dayNames: "short" | "long"
    weekStart: "monday" | "sunday"
    closingSoon: number
    // Text
    openText: string
    soonText: string
    closedTodayText: string
    closedLaterText: string
    closedLabel: string
    allDayLabel: string
    todayLabel: string
    specialTitle: string
    tableCaption: string
    showHeaders: boolean
    dayHeader: string
    hoursHeader: string
    // SEO
    jsonLd: boolean
    businessType: BusinessType
    businessName: string
    // Style
    pillStyle: "filled" | "outline" | "plain"
    openColor: string
    soonColor: string
    closedColor: string
    textColor: string
    mutedColor: string
    highlightBackground: string
    lineColor: string
    pillBackground: string
    colorText: boolean
    pulse: boolean
    dotSize: number
    radius: number
    pillRadius: number
    rowPadding: number
    lines: boolean
    gap: number
    stripWidth: number
    todayStyle: "fill" | "accent"
    card: boolean
    cardBackground: string
    cardRadius: number
    cardPadding: number
    cardBorder: boolean
    cardShadow: boolean
    statusFont: CSSProperties
    bodyFont: CSSProperties
    labelFont: CSSProperties
    style?: CSSProperties
}

const DAY_KEYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
const DAY_TITLES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// --- pure logic ---
interface Hours {
    closed: boolean
    allDay: boolean
    // Minutes from midnight; an end past 1440 runs into the next day
    ranges: [number, number][]
    error: string
}

interface Zoned {
    y: number
    m: number
    d: number
    key: string
    weekday: number // 0 = Monday
    minutes: number
}

interface Status {
    kind: "open" | "soon" | "always" | "today" | "later" | "none"
    time: number
    offset: number
    weekday: number
}

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`
}

// 9 · 09:00 · 9.30 · 9h30 · 9am · 9:30 p.m. · noon · midnight
function parseTime(raw: string): number | null {
    let s = (raw || "").trim().toLowerCase().replace(/\s+/g, "")
    if (s === "noon") return 720
    if (s === "midnight") return 0
    let meridiem = ""
    const suffix = s.match(/(a\.?m\.?|p\.?m\.?)$/)
    if (suffix) {
        meridiem = suffix[1][0]
        s = s.slice(0, s.length - suffix[1].length)
    }
    const m = s.match(/^(\d{1,2})(?:[:.h](\d{2})|h)?$/)
    if (!m) return null
    let h = Number(m[1])
    const min = m[2] ? Number(m[2]) : 0
    if (min > 59) return null
    if (meridiem) {
        if (h < 1 || h > 12) return null
        h = (h % 12) + (meridiem === "p" ? 12 : 0)
    }
    if (h > 24 || (h === 24 && min > 0)) return null
    return h * 60 + min
}

// "09:00–14:00, 17:00–20:30" · "Closed" · "24h" · "20:00–02:00" (past midnight)
function parseHours(raw: string): Hours {
    const text = (raw || "").trim()
    const lower = text.toLowerCase()
    if (!lower || /^(closed|close|off|none|[-–—x])$/.test(lower)) return { closed: true, allDay: false, ranges: [], error: "" }
    if (/^(24\s*h(ours|rs|s)?|24\/7|open 24 hours|all day|always open)$/.test(lower)) return { closed: false, allDay: true, ranges: [[0, 1440]], error: "" }
    const ranges: [number, number][] = []
    const bad: string[] = []
    for (const part of lower.split(/\s*(?:,|;|&|\+|\band\b)\s*/).filter(Boolean)) {
        const m = part.match(/^(.+?)\s*(?:–|—|‒|-|\bto\b|\buntil\b|\btill\b)\s*(.+)$/)
        const start = m ? parseTime(m[1]) : null
        let end = m ? parseTime(m[2]) : null
        if (start === null || end === null || start >= 1440) {
            bad.push(part)
            continue
        }
        if (end <= start) end += 1440
        ranges.push([start, Math.min(end, start + 1440)])
    }
    ranges.sort((a, b) => a[0] - b[0])
    if (!ranges.length) return { closed: true, allDay: false, ranges: [], error: text }
    const allDay = ranges.some(([s, e]) => e - s >= 1440)
    return { closed: false, allDay, ranges: allDay ? [[0, 1440]] : ranges, error: bad.join(", ") }
}

function normalizeDate(raw: string): string {
    const m = (raw || "").trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (!m) return ""
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    const check = new Date(Date.UTC(y, mo - 1, d))
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return ""
    return `${y}-${pad(mo)}-${pad(d)}`
}

function shiftDay(z: { y: number; m: number; d: number }, offset: number): { y: number; m: number; d: number; key: string; weekday: number } {
    const t = new Date(Date.UTC(z.y, z.m - 1, z.d + offset))
    const y = t.getUTCFullYear()
    const m = t.getUTCMonth() + 1
    const d = t.getUTCDate()
    return { y, m, d, key: `${y}-${pad(m)}-${pad(d)}`, weekday: (t.getUTCDay() + 6) % 7 }
}

// The wall clock in the business's zone, whatever the visitor's own zone is
function zonedNow(date: Date, timeZone: string | undefined): Zoned {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date)
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0)
    const y = get("year")
    const m = get("month")
    const d = get("day")
    const day = shiftDay({ y, m, d }, 0)
    return { y, m, d, key: day.key, weekday: day.weekday, minutes: (get("hour") % 24) * 60 + get("minute") }
}

function hoursOn(key: string, weekday: number, week: Hours[], specials: Record<string, Hours>): Hours {
    return specials[key] || week[weekday] || { closed: true, allDay: false, ranges: [], error: "" }
}

// Lays yesterday to a week ahead on one timeline in minutes from today's midnight, so late shifts spill over correctly
function computeStatus(now: Zoned, week: Hours[], specials: Record<string, Hours>, soonMinutes: number): Status {
    const spans: [number, number][] = []
    for (let offset = -1; offset <= 7; offset++) {
        const day = shiftDay(now, offset)
        const h = hoursOn(day.key, day.weekday, week, specials)
        if (h.closed) continue
        for (const [s, e] of h.ranges) spans.push([offset * 1440 + s, offset * 1440 + e])
    }
    spans.sort((a, b) => a[0] - b[0])
    const merged: [number, number][] = []
    for (const span of spans) {
        const last = merged[merged.length - 1]
        if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1])
        else merged.push([span[0], span[1]])
    }
    const t = now.minutes
    const current = merged.find(([s, e]) => s <= t && t < e)
    if (current) {
        if (current[1] - t >= 7 * 1440) return { kind: "always", time: 0, offset: 0, weekday: now.weekday }
        const offset = Math.floor(current[1] / 1440)
        const time = current[1] - offset * 1440
        const kind = soonMinutes > 0 && current[1] - t <= soonMinutes ? "soon" : "open"
        return { kind, time, offset, weekday: (now.weekday + offset) % 7 }
    }
    const next = merged.find(([s]) => s > t)
    if (!next) return { kind: "none", time: 0, offset: 0, weekday: now.weekday }
    const offset = Math.floor(next[0] / 1440)
    return { kind: offset === 0 ? "today" : "later", time: next[0] - offset * 1440, offset, weekday: (now.weekday + offset) % 7 }
}

function formatTime(minutes: number, locale: string, format: TimeFormat): string {
    const h = Math.floor(minutes / 60) % 24
    const m = minutes % 60
    const options: Intl.DateTimeFormatOptions = { hour: format === "24h" ? "2-digit" : "numeric", minute: "2-digit", timeZone: "UTC" }
    if (format === "24h") options.hourCycle = "h23"
    if (format === "12h") options.hourCycle = "h12"
    try {
        return new Intl.DateTimeFormat(locale || "en", options).format(new Date(Date.UTC(2000, 0, 1, h, m)))
    } catch {
        return `${pad(h)}:${pad(m)}`
    }
}

function formatHours(h: Hours, locale: string, format: TimeFormat, closedLabel: string, allDayLabel: string): string {
    if (h.closed) return closedLabel
    if (h.allDay) return allDayLabel
    return h.ranges
        .map(([s, e]) => {
            const a = formatTime(s, locale, format)
            const b = formatTime(e, locale, format)
            return /\s/.test(a + b) ? `${a} – ${b}` : `${a}–${b}`
        })
        .join(", ")
}

function dayName(weekday: number, locale: string, width: "short" | "long"): string {
    try {
        return new Intl.DateTimeFormat(locale || "en", { weekday: width, timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + weekday)))
    } catch {
        return DAY_TITLES[weekday]
    }
}

// Consecutive days with the same hours share one line: Tue–Sat
function groupDays(order: number[], texts: string[]): { days: number[]; text: string }[] {
    const groups: { days: number[]; text: string }[] = []
    for (const day of order) {
        const last = groups[groups.length - 1]
        if (last && last.text === texts[day]) last.days.push(day)
        else groups.push({ days: [day], text: texts[day] })
    }
    return groups
}

function schemaTimes(h: Hours): [string, string][] {
    if (h.closed) return []
    if (h.allDay) return [["00:00", "23:59"]]
    const clock = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`
    return h.ranges.map(([s, e]) => [clock(s), e === 1440 ? "23:59" : clock(e)])
}

// schema.org opening hours; days with the same hours share one entry, a closing time earlier than the opening one means past midnight
function buildJsonLd(type: string, name: string, week: Hours[], specials: { key: string; hours: Hours }[]): Record<string, unknown> {
    const groups: { opens: string; closes: string; days: string[] }[] = []
    week.forEach((h, i) => {
        for (const [opens, closes] of schemaTimes(h)) {
            const g = groups.find((x) => x.opens === opens && x.closes === closes)
            if (g) g.days.push(DAY_TITLES[i])
            else groups.push({ opens, closes, days: [DAY_TITLES[i]] })
        }
    })
    const special: Record<string, unknown>[] = []
    for (const s of specials) {
        const base = { "@type": "OpeningHoursSpecification", validFrom: s.key, validThrough: s.key }
        const times = schemaTimes(s.hours)
        if (!times.length) special.push({ ...base, opens: "00:00", closes: "00:00" })
        for (const [opens, closes] of times) special.push({ ...base, opens, closes })
    }
    return {
        "@context": "https://schema.org",
        "@type": type || "LocalBusiness",
        name: name || undefined,
        openingHoursSpecification: groups.map((g) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: g.days, opens: g.opens, closes: g.closes })),
        specialOpeningHoursSpecification: special.length ? special : undefined,
    }
}

function fill(template: string, values: Record<string, string>): string {
    return (template || "").replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match))
}
// --- end pure logic ---

// Layout effect in the browser (measure before paint), plain effect when the page is rendered ahead of time
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

const visuallyHidden: CSSProperties = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }

function tomorrowWord(locale: string): string {
    try {
        return new Intl.RelativeTimeFormat(locale || "en", { numeric: "auto" }).format(1, "day")
    } catch {
        return "tomorrow"
    }
}

function capitalize(text: string, locale: string): string {
    return text ? text.charAt(0).toLocaleUpperCase(locale || "en") + text.slice(1) : text
}

/**
 * Open Hours Live
 *
 * Opening hours with a live "Open now" status, worked out in the business's own time zone.
 * Optional schema.org data for Google. Everything runs in the page; nothing is sent anywhere.
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function OpenHours(props: Props) {
    const {
        layout = "week",
        align = "left",
        showStatus = true,
        specialDays = [],
        showSpecials = true,
        specialAhead = 90,
        timeZone = "Europe/Madrid",
        timeFormat = "24h",
        dayNames = "long",
        weekStart = "monday",
        closingSoon = 30,
        openText,
        soonText,
        closedTodayText,
        closedLaterText,
        closedLabel,
        allDayLabel,
        todayLabel,
        specialTitle,
        tableCaption,
        showHeaders = false,
        dayHeader,
        hoursHeader,
        jsonLd = false,
        businessType = "LocalBusiness",
        businessName,
        pillStyle = "filled",
        openColor,
        soonColor,
        closedColor,
        textColor,
        mutedColor,
        highlightBackground,
        lineColor,
        pillBackground,
        colorText = false,
        pulse = true,
        dotSize = 8,
        radius = 8,
        pillRadius = 999,
        rowPadding = 10,
        lines = false,
        gap = 16,
        stripWidth = 104,
        todayStyle = "fill",
        card = false,
        cardBackground = "#FFFFFF",
        cardRadius = 20,
        cardPadding = 24,
        cardBorder = true,
        cardShadow = false,
        statusFont,
        bodyFont,
        labelFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const { activeLocale } = useLocaleInfo()
    const uid = useId()
    const scope = `oh-${uid.replace(/[^a-zA-Z0-9_-]/g, "")}`
    const [docLang, setDocLang] = useState("")
    // Published pages render before they reach the visitor, so the clock starts in the browser
    const [now, setNow] = useState<Date | null>(null)
    const [canvasNow] = useState(() => new Date())

    useEffect(() => {
        if (typeof document === "undefined") return
        const lang = document.documentElement.lang || ""
        if (lang) startTransition(() => setDocLang(lang))
    }, [])

    // Every 30 seconds, and as soon as the tab comes back into view
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const tick = () => startTransition(() => setNow(new Date()))
        tick()
        const id = window.setInterval(tick, 30000)
        const onVisible = () => {
            if (document.visibilityState === "visible") tick()
        }
        document.addEventListener("visibilitychange", onVisible)
        return () => {
            window.clearInterval(id)
            document.removeEventListener("visibilitychange", onVisible)
        }
    }, [isStatic])

    // Week strip: a tile is never narrower than its longest line, so a day's hours stay inside it
    const stripRef = useRef<HTMLUListElement>(null)
    const [fitWidth, setFitWidth] = useState(0)

    const locale = activeLocale?.code || docLang || "en"

    const zoneName = (timeZone || "").trim()
    let zoneOk = true
    try {
        if (zoneName) new Intl.DateTimeFormat("en-US", { timeZone: zoneName })
    } catch {
        zoneOk = false
    }
    const zone = zoneName && zoneOk ? zoneName : undefined

    const week = DAY_KEYS.map((k) => parseHours(props[k]))
    const specials = (specialDays || [])
        .map((s) => ({ key: normalizeDate(s?.date || ""), raw: s?.date || "", label: (s?.label || "").trim(), hours: parseHours(s?.hours || "") }))
        .filter((s) => s.raw.trim())
    const validSpecials = specials.filter((s) => s.key)
    const specialMap: Record<string, Hours> = {}
    const specialLabel: Record<string, string> = {}
    for (const s of validSpecials) {
        specialMap[s.key] = s.hours
        specialLabel[s.key] = s.label
    }

    const current = isStatic ? canvasNow : now
    const today = current ? zonedNow(current, zone) : null
    const status = today ? computeStatus(today, week, specialMap, Math.max(0, closingSoon || 0)) : null

    const time = (m: number) => formatTime(m, locale, timeFormat)
    const hoursText = (h: Hours) => formatHours(h, locale, timeFormat, closedLabel, allDayLabel)
    // Each range on one line: a narrow row breaks between ranges, never inside one
    const hoursNode = (h: Hours) =>
        h.closed || h.allDay || !h.ranges.length
            ? hoursText(h)
            : h.ranges.map((r, i) => (
                  <span key={i}>
                      {i ? ", " : null}
                      <span style={{ whiteSpace: "nowrap" }}>{hoursText({ ...h, ranges: [r] })}</span>
                  </span>
              ))

    let statusText = ""
    let statusColor = closedColor
    if (status) {
        if (status.kind === "open") statusText = fill(openText, { time: time(status.time) })
        if (status.kind === "soon") statusText = fill(soonText, { time: time(status.time) })
        if (status.kind === "always") statusText = allDayLabel
        if (status.kind === "today") statusText = fill(closedTodayText, { time: time(status.time) })
        if (status.kind === "later")
            statusText = fill(closedLaterText, {
                time: time(status.time),
                day: status.offset === 1 ? tomorrowWord(locale) : dayName(status.weekday, locale, "long"),
            })
        if (status.kind === "none") statusText = closedLabel
        statusColor = status.kind === "open" || status.kind === "always" ? openColor : status.kind === "soon" ? soonColor : closedColor
    }
    const isOpen = status?.kind === "open" || status?.kind === "always" || status?.kind === "soon"

    const order = weekStart === "sunday" ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6]

    // Measured again only when what the tiles show changes; the observer also catches fonts that load late
    const fitKey = layout === "strip" ? JSON.stringify([locale, timeFormat, closedLabel, allDayLabel, todayLabel, weekStart, today?.key || "", week, validSpecials.map((s) => [s.key, s.hours]), labelFont, bodyFont]) : ""
    useIsoLayoutEffect(() => {
        const el = stripRef.current
        if (!fitKey || !el || typeof ResizeObserver === "undefined") return
        const measure = () => {
            let widest = 0
            el.querySelectorAll<HTMLElement>("[data-oh-fit]").forEach((n) => {
                widest = Math.max(widest, n.getBoundingClientRect().width)
            })
            // 12px of padding on each side and the 1px border
            const w = widest ? Math.ceil(widest) + 26 : 0
            setFitWidth((prev) => (prev === w ? prev : w))
        }
        measure()
        const ro = new ResizeObserver(measure)
        el.querySelectorAll("[data-oh-fit]").forEach((n) => ro.observe(n))
        return () => ro.disconnect()
    }, [fitKey])

    // Upcoming special days, from today to the look-ahead limit
    const lastKey = today && specialAhead > 0 ? shiftDay(today, specialAhead).key : "9999-12-31"
    const upcoming = today
        ? validSpecials
              .filter((s) => s.key >= today.key && s.key <= lastKey)
              .sort((a, b) => (a.key < b.key ? -1 : 1))
              .filter((s, i, all) => all.findIndex((x) => x.key === s.key) === i)
        : []

    const dateLabel = (key: string) => {
        const [y, m, d] = key.split("-").map(Number)
        try {
            return capitalize(new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d))), locale)
        } catch {
            return key
        }
    }

    // Canvas-only hints so a typo never reaches the published site silently
    const warnings: string[] = []
    if (isStatic) {
        if (zoneName && !zoneOk) warnings.push(`Time zone “${zoneName}” isn’t recognised. Use a name like Europe/Madrid or America/New_York.`)
        week.forEach((h, i) => {
            if (h.error) warnings.push(`${DAY_TITLES[i]}: couldn’t read “${h.error}”.`)
        })
        specials.forEach((s) => {
            if (!s.key) warnings.push(`Special day “${s.raw}”: write the date as YYYY-MM-DD.`)
            else if (s.hours.error) warnings.push(`Special day ${s.key}: couldn’t read “${s.hours.error}”.`)
        })
    }

    const json = jsonLd
        ? JSON.stringify(
              buildJsonLd(
                  businessType,
                  (businessName || "").trim(),
                  week,
                  validSpecials.map((s) => ({ key: s.key, hours: s.hours }))
              )
          ).replace(/</g, "\\u003c")
        : ""

    const css = `
.${scope} [data-oh-pulse]{animation:${scope}-pulse 2.4s ease-out infinite}
@keyframes ${scope}-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,currentColor 45%,transparent)}70%,100%{box-shadow:0 0 0 ${Math.max(4, dotSize)}px color-mix(in srgb,currentColor 0%,transparent)}}
@media (prefers-reduced-motion: reduce){.${scope} [data-oh-pulse]{animation:none}}`

    const pillPadding = pillStyle === "plain" ? 0 : "8px 14px 8px 12px"
    const pill = (
        <div
            role={status ? "status" : undefined}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                maxWidth: "100%",
                padding: pillPadding,
                borderRadius: pillRadius,
                background: pillStyle === "filled" ? pillBackground : "transparent",
                border: pillStyle === "outline" ? `1px solid ${lineColor}` : "none",
                boxSizing: "border-box",
                visibility: status ? "visible" : "hidden",
            }}
        >
            <span
                aria-hidden="true"
                data-oh-pulse={pulse && isOpen && !isStatic ? "" : undefined}
                style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: statusColor, color: statusColor, flexShrink: 0 }}
            />
            <span style={{ ...statusFont, color: colorText ? statusColor : textColor }}>{statusText || " "}</span>
        </div>
    )

    const cell: CSSProperties = {
        ...bodyFont,
        padding: `${rowPadding}px 12px`,
        borderBottom: lines ? `1px solid ${lineColor}` : "none",
        verticalAlign: "top",
    }

    const headerCell: CSSProperties = showHeaders
        ? { ...labelFont, color: mutedColor, textAlign: "left", padding: `0 12px ${Math.max(6, rowPadding - 2)}px`, borderBottom: `1px solid ${lineColor}` }
        : { padding: 0, height: 0, lineHeight: 0, border: 0 }

    const table = (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, color: textColor }}>
            <caption style={visuallyHidden}>{tableCaption}</caption>
            <thead>
                <tr>
                    <th scope="col" style={headerCell}>
                        {showHeaders ? dayHeader : <span style={visuallyHidden}>{dayHeader}</span>}
                    </th>
                    <th scope="col" style={{ ...headerCell, textAlign: "right" }}>
                        {showHeaders ? hoursHeader : <span style={visuallyHidden}>{hoursHeader}</span>}
                    </th>
                </tr>
            </thead>
            <tbody>
                {order.map((w) => {
                    const isToday = !!today && today.weekday === w
                    // Each row is the next time that weekday comes round, so a special day this week shows in place
                    const date = today ? shiftDay(today, (w - today.weekday + 7) % 7).key : ""
                    const special = date && specialMap[date] ? specialMap[date] : null
                    const h = special || week[w]
                    const note = special ? specialLabel[date] : ""
                    const bg = isToday && todayStyle === "fill" ? highlightBackground : "transparent"
                    const accent = isToday && todayStyle === "accent" && status ? { boxShadow: `inset 3px 0 0 ${statusColor}`, fontWeight: 600 } : {}
                    return (
                        <tr key={w} aria-current={isToday ? "date" : undefined}>
                            <th
                                scope="row"
                                style={{ ...cell, textAlign: "left", background: bg, borderRadius: isToday ? `${radius}px 0 0 ${radius}px` : 0, whiteSpace: "nowrap", ...accent }}
                            >
                                {capitalize(dayName(w, locale, dayNames), locale)}
                            </th>
                            <td style={{ ...cell, textAlign: "right", background: bg, borderRadius: isToday ? `0 ${radius}px ${radius}px 0` : 0, color: h.closed ? mutedColor : textColor, fontWeight: isToday && todayStyle === "accent" ? 600 : undefined }}>
                                {hoursNode(h)}
                                {note && <span style={{ display: "block", color: mutedColor, ...labelFont }}>{note}</span>}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )

    const texts = week.map((h) => hoursText(h))
    const groups = groupDays(order, texts)
    const compact = (
        <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, width: "100%", display: "flex", flexDirection: "column" }}>
            {groups.map((g, i) => {
                const first = capitalize(dayName(g.days[0], locale, "short"), locale)
                const last = capitalize(dayName(g.days[g.days.length - 1], locale, "short"), locale)
                const label = g.days.length === 1 ? first : `${first}–${last}`
                const hasToday = !!today && g.days.includes(today.weekday)
                const closed = week[g.days[0]].closed
                return (
                    <li
                        key={i}
                        aria-current={hasToday ? "date" : undefined}
                        style={{
                            ...bodyFont,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 16,
                            padding: `${rowPadding}px 12px`,
                            borderRadius: radius,
                            background: hasToday && todayStyle === "fill" ? highlightBackground : "transparent",
                            boxShadow: hasToday && todayStyle === "accent" && status ? `inset 3px 0 0 ${statusColor}` : "none",
                            fontWeight: hasToday && todayStyle === "accent" ? 600 : undefined,
                            borderBottom: lines ? `1px solid ${lineColor}` : "none",
                            color: textColor,
                        }}
                    >
                        <span style={{ whiteSpace: "nowrap" }}>{label}</span>
                        <span style={{ textAlign: "right", color: closed ? mutedColor : textColor }}>{hoursNode(week[g.days[0]])}</span>
                    </li>
                )
            })}
        </ul>
    )

    // Week strip: seven tiles side by side, like the sign on a shop door. Tiles wrap on narrow widths.
    const strip = (
        <ul
            ref={stripRef}
            role="list"
            aria-label={tableCaption}
            style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                width: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.max(64, stripWidth, fitWidth)}px), 1fr))`,
                gap: 8,
            }}
        >
            {order.map((w) => {
                const isToday = !!today && today.weekday === w
                const date = today ? shiftDay(today, (w - today.weekday + 7) % 7).key : ""
                const special = date && specialMap[date] ? specialMap[date] : null
                const h = special || week[w]
                const note = special ? specialLabel[date] : ""
                const parts = h.closed || h.allDay ? [hoursText(h)] : h.ranges.map((r) => hoursText({ ...h, ranges: [r] }))
                const filled = isToday && todayStyle === "fill"
                return (
                    <li
                        key={w}
                        aria-current={isToday ? "date" : undefined}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: align === "center" ? "center" : "flex-start",
                            gap: 6,
                            padding: `${rowPadding + 4}px 12px`,
                            borderRadius: radius,
                            background: filled ? highlightBackground : "transparent",
                            border: `1px solid ${isToday && todayStyle === "accent" && status ? statusColor : filled ? "transparent" : lineColor}`,
                            color: textColor,
                            boxSizing: "border-box",
                            minWidth: 0,
                        }}
                    >
                        <span data-oh-fit="" style={{ ...labelFont, color: isToday ? textColor : mutedColor, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                            {isToday && status ? (
                                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                            ) : null}
                            {capitalize(dayName(w, locale, "short"), locale)}
                            {isToday ? <span style={visuallyHidden}>{` · ${todayLabel}`}</span> : null}
                        </span>
                        {parts.map((t, i) => (
                            <span key={i} data-oh-fit="" style={{ ...bodyFont, color: h.closed ? mutedColor : textColor, whiteSpace: "nowrap" }}>
                                {t}
                            </span>
                        ))}
                        {note ? <span style={{ ...labelFont, color: mutedColor }}>{note}</span> : null}
                    </li>
                )
            })}
        </ul>
    )

    const todayHours = today ? hoursOn(today.key, today.weekday, week, specialMap) : null
    const todayLine = (
        <p style={{ margin: 0, ...bodyFont, color: textColor, visibility: today ? "visible" : "hidden" }}>
            <span style={{ color: mutedColor }}>{todayLabel}</span>
            {today && specialLabel[today.key] && specialMap[today.key] ? <span style={{ color: mutedColor }}>{` · ${specialLabel[today.key]}`}</span> : null}
            <span>{` · ${todayHours ? hoursText(todayHours) : " "}`}</span>
        </p>
    )

    const specialsBlock =
        showSpecials && upcoming.length > 0 && (layout === "week" || layout === "compact" || layout === "strip") ? (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
                <p style={{ margin: `0 0 4px`, padding: "0 12px", ...labelFont, color: mutedColor }}>{specialTitle}</p>
                <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
                    {upcoming.map((s) => (
                        <li
                            key={s.key}
                            style={{
                                ...bodyFont,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                gap: 16,
                                padding: `${rowPadding}px 12px`,
                                borderBottom: lines ? `1px solid ${lineColor}` : "none",
                                color: textColor,
                            }}
                        >
                            <span>
                                {dateLabel(s.key)}
                                {s.label ? <span style={{ color: mutedColor }}>{` · ${s.label}`}</span> : null}
                            </span>
                            <span style={{ textAlign: "right", color: s.hours.closed ? mutedColor : textColor }}>{hoursNode(s.hours)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        ) : null

    const showPill = layout === "status" || layout === "today" || showStatus

    return (
        <div
            className={scope}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: align === "center" ? "center" : "flex-start",
                textAlign: align === "center" ? "center" : "left",
                gap: layout === "today" ? Math.min(gap, 10) : gap,
                color: textColor,
                boxSizing: "border-box",
                ...(card
                    ? {
                          background: cardBackground,
                          borderRadius: cardRadius,
                          padding: cardPadding,
                          border: cardBorder ? `1px solid ${lineColor}` : "none",
                          boxShadow: cardShadow ? "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -12px rgba(0,0,0,0.16)" : "none",
                      }
                    : {}),
            }}
        >
            <style>{css}</style>
            {json ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} /> : null}
            {showPill && pill}
            {layout === "today" && todayLine}
            {layout === "week" && table}
            {layout === "compact" && compact}
            {layout === "strip" && strip}
            {specialsBlock}
            {warnings.length > 0 && (
                <div style={{ width: "100%", padding: "10px 12px", border: `1px dashed ${closedColor}`, borderRadius: radius, color: textColor, textAlign: "left", ...labelFont, boxSizing: "border-box" }}>
                    {warnings.map((w, i) => (
                        <div key={i}>{w}</div>
                    ))}
                </div>
            )}
        </div>
    )
}

OpenHours.displayName = "Open Hours Live"

const dayControl = (title: string, defaultValue: string) => ({
    type: ControlType.String as const,
    title,
    defaultValue,
    placeholder: "09:00–14:00, 17:00–20:30",
    preventLocalization: true,
})

const isTable = (p: Partial<Props>) => p.layout === "week" || p.layout === "compact" || p.layout === "strip"

addPropertyControls(OpenHours, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["status", "today", "week", "compact", "strip"],
        optionTitles: ["Status only", "Status + today", "Full week", "Compact week", "Week strip"],
        defaultValue: "week",
        description: "Full documentation: miguelrecio-components.framer.website/open-hours/docs",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    showStatus: { type: ControlType.Boolean, title: "Status", defaultValue: true, hidden: (p) => !isTable(p) },

    // Week
    monday: { ...dayControl("Monday", "Closed"), description: "Like 09:00–14:00, 17:00–20:30 · Closed · 24h. Past midnight works: 20:00–02:00." },
    tuesday: dayControl("Tuesday", "13:00–16:00, 20:00–23:30"),
    wednesday: dayControl("Wednesday", "13:00–16:00, 20:00–23:30"),
    thursday: dayControl("Thursday", "13:00–16:00, 20:00–23:30"),
    friday: dayControl("Friday", "13:00–16:00, 20:00–23:30"),
    saturday: dayControl("Saturday", "13:00–16:00, 20:00–23:30"),
    sunday: dayControl("Sunday", "13:00–16:30"),

    // Special days
    specialDays: {
        type: ControlType.Array,
        title: "Special days",
        description: "Holidays and one-off changes. They replace the usual hours on that date.",
        control: {
            type: ControlType.Object,
            controls: {
                date: { type: ControlType.String, title: "Date", defaultValue: "2026-12-24", placeholder: "YYYY-MM-DD", preventLocalization: true },
                hours: { type: ControlType.String, title: "Hours", defaultValue: "Closed", placeholder: "Closed", preventLocalization: true },
                label: { type: ControlType.String, title: "Label", defaultValue: "Holiday" },
            },
        },
        defaultValue: [{ date: "2026-12-24", hours: "13:00–16:00", label: "Christmas Eve" }],
    },
    showSpecials: { type: ControlType.Boolean, title: "List special days", defaultValue: true, hidden: (p) => !isTable(p) },
    specialAhead: {
        type: ControlType.Number,
        title: "Days ahead",
        defaultValue: 90,
        min: 0,
        max: 365,
        step: 1,
        description: "Lists special days up to this many days ahead. 0 lists every upcoming one.",
        hidden: (p) => !isTable(p) || !p.showSpecials,
    },

    // Time
    timeZone: {
        type: ControlType.String,
        title: "Time zone",
        defaultValue: "Europe/Madrid",
        placeholder: "Europe/Madrid",
        preventLocalization: true,
        description: "Where the business is, as an IANA name: Europe/London, America/New_York. Visitors abroad still see the right status.",
    },
    timeFormat: {
        type: ControlType.Enum,
        title: "Time format",
        options: ["24h", "12h", "auto"],
        optionTitles: ["24 hours", "12 hours", "Site language"],
        defaultValue: "24h",
    },
    dayNames: {
        type: ControlType.Enum,
        title: "Day names",
        options: ["long", "short"],
        optionTitles: ["Monday", "Mon"],
        defaultValue: "long",
        displaySegmentedControl: true,
        hidden: (p) => p.layout !== "week",
    },
    weekStart: {
        type: ControlType.Enum,
        title: "Week starts",
        options: ["monday", "sunday"],
        optionTitles: ["Monday", "Sunday"],
        defaultValue: "monday",
        displaySegmentedControl: true,
        hidden: (p) => !isTable(p),
    },
    closingSoon: {
        type: ControlType.Number,
        title: "Closes soon",
        defaultValue: 30,
        min: 0,
        max: 180,
        step: 5,
        unit: "min",
        description: "Minutes before closing that the status turns to Closes soon. 0 turns it off.",
    },

    // Text
    openText: { type: ControlType.String, title: "Open text", defaultValue: "Open now · closes at {time}" },
    soonText: { type: ControlType.String, title: "Soon text", defaultValue: "Closes soon · at {time}" },
    closedTodayText: { type: ControlType.String, title: "Opens today", defaultValue: "Closed · opens at {time} today" },
    closedLaterText: {
        type: ControlType.String,
        title: "Opens later",
        defaultValue: "Closed · opens {day} at {time}",
        description: "{day} becomes tomorrow or the weekday, in the site’s language.",
    },
    closedLabel: { type: ControlType.String, title: "Closed text", defaultValue: "Closed" },
    allDayLabel: { type: ControlType.String, title: "24 hours text", defaultValue: "Open 24 hours" },
    todayLabel: { type: ControlType.String, title: "Today text", defaultValue: "Today", hidden: (p) => p.layout !== "today" && p.layout !== "strip" },
    specialTitle: { type: ControlType.String, title: "Special title", defaultValue: "Special hours", hidden: (p) => !isTable(p) },
    tableCaption: { type: ControlType.String, title: "Table name", defaultValue: "Opening hours", description: "Read by screen readers.", hidden: (p) => p.layout !== "week" && p.layout !== "strip" },
    showHeaders: { type: ControlType.Boolean, title: "Headers", defaultValue: false, hidden: (p) => p.layout !== "week" },
    dayHeader: { type: ControlType.String, title: "Day header", defaultValue: "Day", hidden: (p) => p.layout !== "week" },
    hoursHeader: { type: ControlType.String, title: "Hours header", defaultValue: "Hours", hidden: (p) => p.layout !== "week" },

    // SEO
    jsonLd: {
        type: ControlType.Boolean,
        title: "Google data",
        defaultValue: false,
        description: "Adds schema.org opening hours to the page code so Google can read them. Turn on in one place only, and leave off if your site already has this data.",
    },
    businessType: {
        type: ControlType.Enum,
        title: "Business type",
        options: ["LocalBusiness", "Restaurant", "CafeOrCoffeeShop", "Hotel", "Store", "LegalService", "AccountingService"],
        optionTitles: ["Local business", "Restaurant", "Café", "Hotel", "Shop", "Law firm", "Accountant"],
        defaultValue: "Restaurant",
        hidden: (p) => !p.jsonLd,
    },
    businessName: { type: ControlType.String, title: "Business name", defaultValue: "Casa Ribera", hidden: (p) => !p.jsonLd },

    // Style
    pillStyle: {
        type: ControlType.Enum,
        title: "Status style",
        options: ["filled", "outline", "plain"],
        optionTitles: ["Filled", "Outline", "Plain"],
        defaultValue: "filled",
        displaySegmentedControl: true,
    },
    openColor: { type: ControlType.Color, title: "Open colour", defaultValue: "#1E8E3E" },
    soonColor: { type: ControlType.Color, title: "Soon colour", defaultValue: "#C77700" },
    closedColor: { type: ControlType.Color, title: "Closed colour", defaultValue: "#C5221F" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111111" },
    mutedColor: { type: ControlType.Color, title: "Muted text", defaultValue: "#6B6B6B" },
    highlightBackground: { type: ControlType.Color, title: "Today row", defaultValue: "#F3F3F3" },
    lineColor: { type: ControlType.Color, title: "Line colour", defaultValue: "#E6E6E6" },
    pillBackground: { type: ControlType.Color, title: "Status fill", defaultValue: "#F3F3F3", hidden: (p) => p.pillStyle !== "filled" },
    colorText: { type: ControlType.Boolean, title: "Colour text", defaultValue: false, description: "Status text takes the open, soon or closed colour." },
    pulse: { type: ControlType.Boolean, title: "Pulse", defaultValue: true, description: "The dot pulses while open. Still for visitors who prefer reduced motion." },
    dotSize: { type: ControlType.Number, title: "Dot size", defaultValue: 8, min: 4, max: 20, step: 1, unit: "px" },
    radius: { type: ControlType.Number, title: "Row radius", defaultValue: 8, min: 0, max: 24, step: 1, unit: "px" },
    pillRadius: { type: ControlType.Number, title: "Status radius", defaultValue: 999, min: 0, max: 999, step: 1, unit: "px", hidden: (p) => p.pillStyle === "plain" },
    rowPadding: { type: ControlType.Number, title: "Row padding", defaultValue: 10, min: 0, max: 32, step: 1, unit: "px", hidden: (p) => !isTable(p) },
    lines: { type: ControlType.Boolean, title: "Lines", defaultValue: false, hidden: (p) => !isTable(p) || p.layout === "strip" },
    todayStyle: {
        type: ControlType.Enum,
        title: "Today",
        options: ["fill", "accent"],
        optionTitles: ["Fill", "Accent"],
        defaultValue: "fill",
        displaySegmentedControl: true,
        description: "Fill uses the Today row colour. Accent marks today with the status colour.",
        hidden: (p) => !isTable(p),
    },
    stripWidth: {
        type: ControlType.Number,
        title: "Day width",
        defaultValue: 104,
        min: 64,
        max: 200,
        step: 2,
        unit: "px",
        description: "Smallest width of each day. It grows when a day’s hours need more room, and days wrap onto a new line when there isn’t room.",
        hidden: (p) => p.layout !== "strip",
    },
    card: { type: ControlType.Boolean, title: "Card", defaultValue: false, description: "Wraps the hours in a card with its own background." },
    cardBackground: { type: ControlType.Color, title: "Card colour", defaultValue: "#FFFFFF", hidden: (p) => !p.card },
    cardRadius: { type: ControlType.Number, title: "Card radius", defaultValue: 20, min: 0, max: 48, step: 1, unit: "px", hidden: (p) => !p.card },
    cardPadding: { type: ControlType.Number, title: "Card padding", defaultValue: 24, min: 0, max: 64, step: 1, unit: "px", hidden: (p) => !p.card },
    cardBorder: { type: ControlType.Boolean, title: "Card border", defaultValue: true, hidden: (p) => !p.card },
    cardShadow: { type: ControlType.Boolean, title: "Card shadow", defaultValue: false, hidden: (p) => !p.card },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 16, min: 0, max: 64, step: 1, unit: "px" },
    statusFont: {
        type: ControlType.Font,
        title: "Status font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Medium", letterSpacing: "0em", lineHeight: "1.3em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Regular", letterSpacing: "0em", lineHeight: "1.5em" },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Medium", letterSpacing: "0.04em", lineHeight: "1.4em" },
    },
})
