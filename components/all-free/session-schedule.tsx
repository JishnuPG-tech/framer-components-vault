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


// Lanyard SessionSchedule: conference timetable. Day tabs, track chips, Event time / My time, starred "My schedule"
// (localStorage), per-session and whole-schedule .ics, Google Calendar links, "Happening now". Standalone: no CMS, no libraries.
// Times are typed in the event's time zone. Conversion uses Intl only (see wallToUtc for the daylight-saving rules).

interface ScheduleLabels {
    eventTime: string
    myTime: string
    allTracks: string
    starredOnly: string
    downloadMine: string
    addToCalendar: string
    happeningNow: string
}

const DEFAULT_LABELS: ScheduleLabels = {
    eventTime: "Event time",
    myTime: "My time",
    allTracks: "All tracks",
    starredOnly: "Starred only",
    downloadMine: "Download my schedule (.ics)",
    addToCalendar: "Add to calendar",
    happeningNow: "Happening now",
}

interface SessionScheduleProps {
    days: string
    tracks: string
    sessions: string
    eventName: string
    eventTimeZone: string
    venue: string
    speakerPath: string
    compact: boolean
    previewRows: number
    moreLabel: string
    moreLink: string
    labels?: Partial<ScheduleLabels>
    inkColor: string
    mutedColor: string
    paperColor: string
    cardColor: string
    lineColor: string
    highlightColor: string
    radius: number
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    monoFont?: React.CSSProperties
    style?: React.CSSProperties
}

/* ---------- default data: Halfstep 2027, Rotterdam, times in Europe/Amsterdam ---------- */

const DEFAULT_DAYS = ["2027-03-18|Workshops", "2027-03-19|Conference"].join("\n")

const DEFAULT_TRACKS = ["Design|#E5482B", "Engineering|#0E8F8A", "Craft|#6B4EE6"].join("\n")

// date|start|end|track|title|speaker|room|speaker slug  (track "All" = one row across every column)
const DEFAULT_SESSIONS = [
    "2027-03-18|08:30|09:00|All|Registration and coffee||Foyer|",
    "2027-03-18|09:00|12:00|Design|Workshop: Tokens that survive a rebrand|Maya Okafor|Studio 1|maya-okafor",
    "2027-03-18|09:00|12:00|Engineering|Workshop: Container queries in a real design system|Daniel Reyes|Studio 2|daniel-reyes",
    "2027-03-18|09:00|12:00|Craft|Workshop: Drawing type for small screens|Sofia Lindqvist|Studio 3|sofia-lindqvist",
    "2027-03-18|12:00|13:15|All|Lunch||Foyer|",
    "2027-03-18|13:15|16:15|Design|Workshop: Designing the empty state first|Tomás Silva|Studio 1|tomas-silva",
    "2027-03-18|13:15|16:15|Engineering|Workshop: Forms that don't make people give up|Jonas Weber|Studio 2|jonas-weber",
    "2027-03-18|13:15|16:15|Craft|Workshop: Motion you can ship in a day|Lucas Moreau|Studio 3|lucas-moreau",
    "2027-03-18|17:00|19:00|All|Welcome drinks||Foyer|",
    "2027-03-19|08:30|09:30|All|Registration and coffee||Foyer|",
    "2027-03-19|09:30|10:15|All|Opening keynote: Interfaces are made of decisions|Priya Raman|Main Hall|priya-raman",
    "2027-03-19|10:15|10:45|All|Coffee break||Foyer|",
    "2027-03-19|10:45|11:30|Design|Writing interface copy with engineers|Aisha Khan|Main Hall|aisha-khan",
    "2027-03-19|10:45|11:30|Engineering|The slow page nobody owns|Hannah Brooks|Hall B|hannah-brooks",
    "2027-03-19|10:45|11:30|Craft|Pixel-perfect handoff without the PDF|Oliver Bennett|Hall C|oliver-bennett",
    "2027-03-19|11:45|12:30|Design|Design reviews that end with a decision|Maya Okafor|Main Hall|maya-okafor",
    "2027-03-19|11:45|12:30|Engineering|Accessible by default: lessons from a checkout rebuild|Marcus Chen|Hall B|marcus-chen",
    "2027-03-19|11:45|12:30|Craft|Prototyping with real data|Elena Petrova|Hall C|elena-petrova",
    "2027-03-19|12:30|13:45|All|Lunch||Foyer|",
    "2027-03-19|13:45|14:30|Design|Naming things: a field guide for design systems|Tomás Silva|Main Hall|tomas-silva",
    "2027-03-19|13:45|14:30|Engineering|Fewer breakpoints, better layouts|Daniel Reyes|Hall B|daniel-reyes",
    "2027-03-19|13:45|14:30|Craft|Letterforms in the browser|Sofia Lindqvist|Hall C|sofia-lindqvist",
    "2027-03-19|15:00|15:45|All|Closing talk: Small teams, long-lived products|Lucas Moreau|Main Hall|lucas-moreau",
    "2027-03-19|16:30|19:00|All|Closing party||Foyer|",
].join("\n")

const FALLBACK_COLORS = ["#E5482B", "#0E8F8A", "#6B4EE6", "#C98A00", "#2F6FDB", "#B02A6F"]

/* ---------- time: wall-clock in a zone <-> UTC, Intl only ---------- */

const DAY_MS = 86400000

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(zone: string): Intl.DateTimeFormat {
    let f = formatters.get(zone)
    if (!f) {
        f = new Intl.DateTimeFormat("en-US", {
            timeZone: zone,
            hourCycle: "h23",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        })
        formatters.set(zone, f)
    }
    return f
}

// A wrong or empty IANA name falls back instead of throwing a RangeError.
function safeZone(zone: unknown, fallback: string): string {
    const name = String(zone ?? "").trim()
    if (!name) return fallback
    try {
        formatterFor(name)
        return name
    } catch (error) {
        return fallback
    }
}

interface Wall {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
}

function wallAt(ms: number, zone: string): Wall {
    const v: Record<string, number> = {}
    for (const part of formatterFor(zone).formatToParts(new Date(ms))) if (part.type !== "literal") v[part.type] = Number(part.value)
    return { year: v.year, month: v.month, day: v.day, hour: v.hour % 24, minute: v.minute, second: v.second }
}

// minutes east of UTC at this instant, as milliseconds
function offsetAt(ms: number, zone: string): number {
    const w = wallAt(ms, zone)
    return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(ms / 1000) * 1000
}

/**
 * Wall-clock time in `zone` -> UTC milliseconds. Daylight-saving rules (same as JS Date and Temporal "compatible"):
 *  - a time that does not exist (spring-forward gap, e.g. Europe/Amsterdam 2027-03-28 02:30) moves forward by the gap: 02:30 -> 03:30 CEST = 01:30 UTC;
 *  - a time that happens twice (fall-back overlap, e.g. 2027-10-31 02:30) means the first one (summer time) = 00:30 UTC.
 */
function wallToUtc(date: string, minutes: number, zone: string): number {
    const [y, m, d] = date.split("-").map(Number)
    const wall = Date.UTC(y, m - 1, d, 0, minutes)
    const before = offsetAt(wall - DAY_MS, zone)
    const after = offsetAt(wall + DAY_MS, zone)
    const fits: number[] = []
    for (const o of before === after ? [before] : [before, after]) {
        const utc = wall - o
        if (offsetAt(utc, zone) === o) fits.push(utc)
    }
    if (fits.length === 0) return wall - before
    return Math.min(...fits)
}

function two(n: number): string {
    return n < 10 ? `0${n}` : String(n)
}

function clockAt(ms: number, zone: string): string {
    const w = wallAt(ms, zone)
    return `${two(w.hour)}:${two(w.minute)}`
}

function dateAt(ms: number, zone: string): string {
    const w = wallAt(ms, zone)
    return `${w.year}-${two(w.month)}-${two(w.day)}`
}

function dayNumber(date: string): number {
    const [y, m, d] = date.split("-").map(Number)
    return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}

function gmtLabel(offsetMs: number): string {
    const minutes = Math.round(offsetMs / 60000)
    const abs = Math.abs(minutes)
    const h = Math.floor(abs / 60)
    const m = abs % 60
    return `GMT${minutes < 0 ? "-" : "+"}${h}${m ? `:${two(m)}` : ""}`
}

// browsers report some zones under their old database names
const ZONE_ALIASES: Record<string, string> = { Calcutta: "Kolkata", Saigon: "Ho Chi Minh City", Katmandu: "Kathmandu", Rangoon: "Yangon", Kiev: "Kyiv" }

// "Asia/Seoul" -> "Seoul", "America/Argentina/Buenos_Aires" -> "Buenos Aires"
function zoneName(zone: string): string {
    const last = (zone.split("/").pop() || zone).replace(/_/g, " ")
    return ZONE_ALIASES[last] || last
}

function durationText(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m ? `${h} h ${m} min` : `${h} h`
}

function dayShiftMark(n: number): string {
    return n > 0 ? `+${n}` : `\u2212${-n}`
}

/* ---------- parsing the String controls ---------- */

interface Track {
    key: string
    name: string
    color: string
}

interface Day {
    date: string
    label: string
}

interface Session {
    id: string
    uid: string
    date: string
    startMs: number
    endMs: number
    minutes: number
    track: Track | null // null = All
    title: string
    speaker: string
    room: string
    slug: string
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

function lines(text: unknown): string[][] {
    return String(text ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && line[0] !== "#")
        .map((line) => line.split("|").map((part) => part.trim()))
}

function validDate(s: string): boolean {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
    if (!m) return false
    const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
    return t.getUTCFullYear() === +m[1] && t.getUTCMonth() === +m[2] - 1 && t.getUTCDate() === +m[3]
}

function minutesOf(s: string): number | null {
    const m = /^(\d{1,2}):(\d{2})$/.exec(s)
    if (!m) return null
    const h = +m[1]
    const mi = +m[2]
    if (mi > 59 || h > 24 || (h === 24 && mi > 0)) return null
    return h * 60 + mi
}

function validColor(s: string): boolean {
    return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) || /^(rgb|hsl)a?\([^)]*\)$/i.test(s)
}

interface Model {
    days: Day[]
    tracks: Track[]
    sessions: Session[]
    eventSlug: string
}

function buildModel(daysText: string, tracksText: string, sessionsText: string, eventName: string, zone: string): Model {
    const tracks: Track[] = []
    for (const [name, color] of lines(tracksText)) {
        const key = slugify(name || "")
        if (!key || key === "all" || tracks.some((t) => t.key === key)) continue
        tracks.push({ key, name, color: color && validColor(color) ? color : FALLBACK_COLORS[tracks.length % FALLBACK_COLORS.length] })
    }

    const eventSlug = slugify(eventName) || "event"
    const sessions: Session[] = []
    const seen = new Map<string, number>()
    for (const f of lines(sessionsText)) {
        const [date, start, end, trackName = "", title = "", speaker = "", room = "", slugText = ""] = f
        const startMin = minutesOf(start || "")
        const endMin = minutesOf(end || "")
        if (!validDate(date || "") || startMin === null || endMin === null || endMin <= startMin || !title) continue
        const key = slugify(trackName)
        const track = tracks.find((t) => t.key === key) || null
        const startMs = wallToUtc(date, startMin, zone)
        let endMs = wallToUtc(date, endMin, zone)
        if (endMs <= startMs) endMs = startMs + (endMin - startMin) * 60000 // end fell into a spring-forward gap
        const base = slugify(slugText || title) || "session"
        const hhmm = `${two(Math.floor(startMin / 60))}${two(startMin % 60)}`
        const idBase = `${date}-${hhmm}-${base}`
        const n = (seen.get(idBase) || 0) + 1
        seen.set(idBase, n)
        sessions.push({
            id: n > 1 ? `${idBase}-${n}` : idBase,
            uid: `${base}-${date}-${hhmm}${n > 1 ? `-${n}` : ""}@${eventSlug}`,
            date,
            startMs,
            endMs,
            minutes: Math.round((endMs - startMs) / 60000),
            track,
            title,
            speaker,
            room,
            slug: slugText ? slugify(slugText) : "",
        })
    }

    const days: Day[] = []
    for (const [date, label = ""] of lines(daysText)) if (validDate(date || "") && !days.some((d) => d.date === date)) days.push({ date, label })
    // sessions on a date nobody listed still get a tab
    for (const s of sessions) if (!days.some((d) => d.date === s.date)) days.push({ date: s.date, label: "" })
    days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    sessions.sort((a, b) => a.startMs - b.startMs || trackIndex(tracks, a) - trackIndex(tracks, b))
    return { days, tracks, sessions, eventSlug }
}

function trackIndex(tracks: Track[], s: Session): number {
    return s.track ? tracks.indexOf(s.track) : -1
}

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" })

function dayTitle(date: string): string {
    const v: Record<string, string> = {}
    const [y, m, d] = date.split("-").map(Number)
    for (const part of DAY_LABEL.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)))) v[part.type] = part.value
    return `${v.weekday} ${v.day} ${v.month}`
}

/* ---------- calendar files ---------- */

function utcStamp(ms: number): string {
    const d = new Date(ms)
    return `${d.getUTCFullYear()}${two(d.getUTCMonth() + 1)}${two(d.getUTCDate())}T${two(d.getUTCHours())}${two(d.getUTCMinutes())}${two(d.getUTCSeconds())}Z`
}

// RFC 5545 3.3.11: backslash, semicolon, comma and newlines in TEXT values
function icsText(text: string): string {
    return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")
}

function utf8Length(ch: string): number {
    const cp = ch.codePointAt(0) as number
    return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4
}

// RFC 5545 3.1: no content line longer than 75 octets (CRLF excluded); the rest continues after CRLF + one space
function foldLine(line: string): string {
    let out = ""
    let used = 0
    for (const ch of Array.from(line)) {
        const n = utf8Length(ch)
        if (used + n > 75) {
            out += "\r\n "
            used = 1
        }
        out += ch
        used += n
    }
    return out
}

interface CalendarContext {
    eventName: string
    venue: string
}

function locationOf(s: Session, ctx: CalendarContext): string {
    return [s.room, ctx.venue].filter(Boolean).join(", ")
}

function descriptionOf(s: Session, ctx: CalendarContext, newline: string): string {
    const rows: string[] = []
    if (s.speaker) rows.push(`Speaker: ${s.speaker}`)
    rows.push(`Track: ${s.track ? s.track.name : "All tracks"}`)
    if (ctx.eventName) rows.push(ctx.eventName)
    return rows.join(newline)
}

function buildIcs(list: Session[], ctx: CalendarContext, calName: string): string {
    const stamp = utcStamp(Date.now())
    const product = (ctx.eventName || "Event").replace(/[^\x20-\x7e]|[/\\;,]/g, "").trim() || "Event"
    const out: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${product}//SessionSchedule//EN`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsText(calName)}`]
    for (const s of list) {
        out.push("BEGIN:VEVENT", `UID:${s.uid}`, `DTSTAMP:${stamp}`, `DTSTART:${utcStamp(s.startMs)}`, `DTEND:${utcStamp(s.endMs)}`, `SUMMARY:${icsText(s.title)}`)
        const where = locationOf(s, ctx)
        if (where) out.push(`LOCATION:${icsText(where)}`)
        out.push(`DESCRIPTION:${icsText(descriptionOf(s, ctx, "\n"))}`, "END:VEVENT")
    }
    out.push("END:VCALENDAR")
    return out.map(foldLine).join("\r\n") + "\r\n"
}

function googleLink(s: Session, ctx: CalendarContext): string {
    const q = [
        "action=TEMPLATE",
        `text=${encodeURIComponent(s.title)}`,
        `dates=${utcStamp(s.startMs)}/${utcStamp(s.endMs)}`,
        `details=${encodeURIComponent(descriptionOf(s, ctx, "\n"))}`,
        `location=${encodeURIComponent(locationOf(s, ctx))}`,
    ]
    return `https://calendar.google.com/calendar/render?${q.join("&")}`
}

function downloadText(filename: string, text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/* ---------- clock, stars ---------- */

// minute-aligned clock: null before mount (server render and first client render agree), then the start of the current minute
function useMinuteClock(enabled: boolean): number | null {
    const [now, setNow] = React.useState<number | null>(null)
    React.useEffect(() => {
        if (!enabled) return
        let timer = 0
        const tick = () => {
            const t = Date.now()
            setNow(Math.floor(t / 60000) * 60000)
            timer = window.setTimeout(tick, 60000 - (t % 60000) + 50)
        }
        tick()
        const onVisible = () => {
            if (document.visibilityState !== "visible") return
            window.clearTimeout(timer)
            tick()
        }
        document.addEventListener("visibilitychange", onVisible)
        return () => {
            window.clearTimeout(timer)
            document.removeEventListener("visibilitychange", onVisible)
        }
    }, [enabled])
    return now
}

const STARS_EVENT = "ss-stars-changed"

// starred session ids in localStorage; every instance with the same key (Home preview + Schedule page) stays in step
function useStars(storageKey: string, enabled: boolean): [string[], (id: string) => void] {
    const [stars, setStars] = React.useState<string[]>([])
    React.useEffect(() => {
        if (!enabled) return
        const read = () => {
            try {
                const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]")
                setStars(Array.isArray(parsed) ? parsed.filter((x: unknown): x is string => typeof x === "string") : [])
            } catch (error) {
                setStars([])
            }
        }
        const onStorage = (e: StorageEvent) => {
            if (e.key === null || e.key === storageKey) read()
        }
        read()
        window.addEventListener("storage", onStorage)
        window.addEventListener(STARS_EVENT, read)
        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener(STARS_EVENT, read)
        }
    }, [storageKey, enabled])
    const toggle = React.useCallback(
        (id: string) => {
            const next = stars.includes(id) ? stars.filter((x) => x !== id) : [...stars, id]
            setStars(next)
            try {
                window.localStorage.setItem(storageKey, JSON.stringify(next))
            } catch (error) {
                // private mode or storage off: the star still works until the page closes
            }
            window.dispatchEvent(new Event(STARS_EVENT))
        },
        [stars, storageKey]
    )
    return [stars, toggle]
}

/* ---------- skin: every style value lives here (Lanyard) ---------- */

const TITLE_STACK = '"Archivo", "Helvetica Neue", Arial, system-ui, sans-serif'
const BODY_STACK = '"DM Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const MONO_STACK = '"DM Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'

function familyOf(font: React.CSSProperties | undefined, fallback: string): string {
    const family = font && typeof font.fontFamily === "string" ? font.fontFamily.trim() : ""
    return family ? `${family}, ${fallback}` : fallback
}

const WIDE_CARD = `grid-template-columns:minmax(0,1fr) auto auto;grid-template-rows:auto;grid-template-areas:"tag star cal" "when star cal" "title star cal" "who star cal"`

const CSS = `
.ss,.ss *{box-sizing:border-box}
.ss :where(h3,p,ul,ol,li,button,a,span,i,svg){margin:0;padding:0}
.ss :where(ul,ol){list-style:none}
.ss :where(button){appearance:none;background:none;border:0;border-radius:0;font:inherit;color:inherit;text-align:inherit;cursor:pointer;line-height:inherit}
.ss :where(a){color:inherit}
.ss{container-type:inline-size;position:relative;width:100%;overflow-x:clip;color:var(--ss-ink);font-family:var(--ss-body);font-size:16px;line-height:24px;font-weight:400;letter-spacing:0;text-align:left}
.ss :focus-visible{outline:2px solid var(--ss-ink);outline-offset:3px}
.ss-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ss-bar{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px 24px}
.ss-bar2{margin-top:20px;align-items:center}
.ss-tabs{display:flex;flex-wrap:wrap;gap:8px}
.ss-tab{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:168px;padding:12px 22px 12px;border:1px solid var(--ss-line);border-radius:16px;color:var(--ss-ink)}
.ss-tab:hover{background:var(--ss-card)}
.ss-tab[aria-selected=true],.ss-tab[data-current=true]{background:var(--ss-ink);border-color:var(--ss-ink);color:var(--ss-paper)}
.ss-tab-date{display:flex;align-items:center;gap:8px;font-family:var(--ss-title);font-weight:var(--ss-title-w);font-size:20px;line-height:24px;text-transform:uppercase}
.ss-tab-sub{font-size:14px;line-height:20px;opacity:.72}
.ss-pulse{flex:none;width:8px;height:8px;border-radius:50%;background:var(--ss-hi);box-shadow:0 0 0 1.5px var(--ss-ink)}
.ss-tab[aria-selected=true] .ss-pulse{box-shadow:0 0 0 1.5px var(--ss-paper)}
.ss-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--ss-line);border-radius:999px}
.ss[data-ready=false] .ss-seg{visibility:hidden}
.ss-seg button{padding:6px 16px;border-radius:999px;font-size:14px;line-height:20px;font-weight:500;white-space:nowrap}
.ss-seg button:hover{background:var(--ss-card)}
.ss-seg button[aria-pressed=true]{background:var(--ss-ink);color:var(--ss-paper)}
.ss-chips{display:flex;flex-wrap:wrap;gap:8px}
.ss-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border:1px solid var(--ss-line);border-radius:999px;font-size:14px;line-height:20px;font-weight:500;white-space:nowrap}
.ss-chip:hover{background:var(--ss-card)}
.ss-chip[aria-pressed=true]{background:var(--ss-ink);border-color:var(--ss-ink);color:var(--ss-paper)}
.ss-dot{flex:none;width:10px;height:10px;border-radius:50%;background:var(--tc)}
.ss-mine{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.ss-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border:1px solid var(--ss-ink);border-radius:999px;font-size:15px;line-height:22px;font-weight:700;white-space:nowrap}
.ss-btn[data-kind=ghost]{border-color:var(--ss-line)}
.ss-btn[data-kind=ghost]:hover:not(:disabled):not([aria-pressed=true]){background:var(--ss-card)}
.ss-btn[data-kind=ghost][aria-pressed=true]{background:var(--ss-ink);border-color:var(--ss-ink);color:var(--ss-paper)}
.ss-btn[data-kind=primary]{background:var(--ss-ink);color:var(--ss-paper)}
.ss-btn[data-kind=primary]:hover:not(:disabled){background:var(--ss-hi);color:var(--ss-ink)}
.ss-btn:disabled{opacity:.45;cursor:not-allowed}
.ss-count{min-width:22px;padding:0 6px;border-radius:999px;background:var(--ss-ink);color:var(--ss-paper);font-family:var(--ss-mono);font-size:12px;line-height:20px;font-weight:500;text-align:center}
.ss-btn[aria-pressed=true] .ss-count{background:var(--ss-paper);color:var(--ss-ink)}
.ss-ico{flex:none;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ss-note{margin-top:16px;font-family:var(--ss-mono);font-size:12px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--ss-muted)}
.ss-rows{display:flex;flex-direction:column;gap:12px;margin-top:24px}
.ss-row{display:block}
.ss-label{display:none}
.ss-cards{display:flex;flex-direction:column;gap:12px}
.ss-card{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto auto 1fr;grid-template-areas:"tag star" "when when" "title title" "who who" "cal cal";align-content:start;gap:6px 12px;padding:16px 16px 16px 28px;background:var(--ss-card);border:1px solid var(--ss-line);border-radius:var(--ss-r);box-shadow:inset 10px 0 0 var(--tc)}
.ss-card[data-open=true]{z-index:6}
.ss-card[data-kind=break]{background:transparent;border-style:dashed}
.ss-card[data-live=true]{background:var(--ss-hi);border-color:var(--ss-ink)}
.ss-when{grid-area:when;display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;font-family:var(--ss-mono);font-size:14px;line-height:20px;color:var(--ss-muted)}
.ss-clock{font-size:16px;font-weight:500;color:var(--ss-ink)}
.ss-shift{margin:0 2px 0 3px;font-size:11px;vertical-align:super;line-height:1}
.ss-live{display:inline-flex;align-items:center;gap:6px;padding:1px 10px;border-radius:999px;background:var(--ss-ink);color:var(--ss-hi);font-size:12px;line-height:18px;letter-spacing:.06em;text-transform:uppercase}
.ss-live i{width:6px;height:6px;border-radius:50%;background:var(--ss-hi)}
.ss-title{grid-area:title;font-family:var(--ss-title);font-weight:var(--ss-title-w);font-size:20px;line-height:26px;color:var(--ss-ink);text-wrap:balance}
.ss-who{grid-area:who;font-size:15px;line-height:22px;color:var(--ss-ink)}
.ss-who a{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.ss-who a:hover{text-decoration-thickness:2px}
.ss-room{color:var(--ss-muted)}
.ss-tag{grid-area:tag;align-self:center;display:inline-flex;align-items:center;gap:8px;font-family:var(--ss-mono);font-size:12px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--ss-ink)}
.ss-menu{grid-area:cal;justify-self:start;align-self:end;position:relative;margin-top:6px}
.ss-cal{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid var(--ss-line);border-radius:999px;font-size:14px;line-height:20px;font-weight:500;white-space:nowrap}
.ss-cal:hover,.ss-cal[aria-expanded=true]{border-color:var(--ss-ink)}
.ss-cal .ss-ico{width:16px;height:16px}
.ss-pop{position:absolute;right:0;top:calc(100% + 6px);z-index:8;display:flex;flex-direction:column;min-width:216px;padding:6px;background:var(--ss-paper);border:1px solid var(--ss-ink);border-radius:16px;box-shadow:0 10px 28px rgba(22,22,26,.2)}
.ss-pop[data-up=true]{top:auto;bottom:calc(100% + 6px)}
.ss-pop :where(button,a){display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;font-size:15px;line-height:22px;font-weight:500;text-decoration:none;white-space:nowrap}
.ss-pop :where(button,a):hover{background:var(--ss-card)}
.ss-star{grid-area:star;justify-self:end;align-self:start;display:grid;place-items:center;width:40px;height:40px;margin:-12px -8px 0 0;border-radius:50%;color:var(--ss-ink)}
.ss-star:hover{background:rgba(22,22,26,.08)}
.ss-star .ss-ico{width:22px;height:22px}
.ss-star[aria-pressed=true] .ss-ico{fill:currentColor}
.ss-empty{padding:32px 24px;border:1px dashed var(--ss-line);border-radius:var(--ss-r);text-align:center;color:var(--ss-muted)}
.ss-more{margin-top:24px}
.ss-more a{text-decoration:none}
@container (min-width:560px) and (max-width:899.98px){
.ss-card{${WIDE_CARD}}
.ss-card .ss-star,.ss-card .ss-menu{align-self:center;margin:0}
}
@container (min-width:900px){
.ss-row{display:grid;grid-template-columns:96px minmax(0,1fr);column-gap:24px;align-items:start;padding-top:16px;border-top:1px solid var(--ss-line)}
.ss-rows{gap:16px}
.ss-label{display:flex;flex-direction:column;gap:2px;padding-top:2px;font-family:var(--ss-mono);font-size:24px;line-height:28px;font-weight:500;color:var(--ss-ink)}
.ss-label .ss-shift{font-size:12px;margin-left:4px}
.ss-cards{display:grid;grid-template-columns:repeat(var(--ss-cols),minmax(0,1fr));gap:16px;align-items:stretch}
.ss-card[data-wide=true]{${WIDE_CARD}}
.ss-card[data-wide=true] .ss-star,.ss-card[data-wide=true] .ss-menu{align-self:center;margin:0}
}
@media (prefers-reduced-motion:no-preference){
.ss-tab,.ss-seg button,.ss-chip,.ss-btn,.ss-cal,.ss-star,.ss-card,.ss-pop :where(button,a){transition:background-color .15s,border-color .15s,color .15s}
.ss-pop{animation:ss-pop .12s ease-out}
}
@keyframes ss-pop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
`

/* ---------- small pieces ---------- */

function StarIcon() {
    return (
        <svg className="ss-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17.1l-5.4 3 1.1-6.1-4.5-4.3 6.1-.8z" />
        </svg>
    )
}

function CalendarIcon() {
    return (
        <svg className="ss-ico" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
    )
}

function DownloadIcon() {
    return (
        <svg className="ss-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
        </svg>
    )
}

function ChevronIcon() {
    return (
        <svg className="ss-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
        </svg>
    )
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SessionSchedule(props: SessionScheduleProps) {
    const {
        days: daysText = DEFAULT_DAYS,
        tracks: tracksText = DEFAULT_TRACKS,
        sessions: sessionsText = DEFAULT_SESSIONS,
        eventName = "Halfstep 2027",
        eventTimeZone = "Europe/Amsterdam",
        venue = "Pier Hall, Rotterdam, NL",
        speakerPath = "/speakers/",
        compact = false,
        previewRows = 4,
        moreLabel = "See the full schedule",
        moreLink = "",
        labels: labelsProp,
        inkColor = "#16161A",
        mutedColor = "#5B5850",
        paperColor = "#FFF6E5",
        cardColor = "#FBEBD0",
        lineColor = "rgba(22,22,26,0.12)",
        highlightColor = "#FFD23F",
        radius = 20,
        titleFont,
        bodyFont,
        monoFont,
        style,
    } = props

    const L = { ...DEFAULT_LABELS, ...(labelsProp || {}) }
    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const uid = React.useId()
    const now = useMinuteClock(!isStatic)

    const eventZone = React.useMemo(() => safeZone(eventTimeZone, "UTC"), [eventTimeZone])
    const model = React.useMemo(
        () => buildModel(String(daysText), String(tracksText), String(sessionsText), String(eventName || ""), eventZone),
        [daysText, tracksText, sessionsText, eventName, eventZone]
    )
    const { days, tracks, sessions, eventSlug } = model

    const [dayIndex, setDayIndex] = React.useState(0)
    const [trackSel, setTrackSel] = React.useState<string[]>([])
    const [mode, setMode] = React.useState<"event" | "mine">("event")
    const [starredOnly, setStarredOnly] = React.useState(false)
    const [visitorZone, setVisitorZone] = React.useState<string | null>(null)
    const [menu, setMenu] = React.useState<{ id: string; up: boolean } | null>(null)
    const [stars, toggleStar] = useStars(`ss-stars:${eventSlug}`, !isStatic)
    const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])
    const triggerRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
    const pendingFocus = React.useRef<string | null>(null)
    const autoDay = React.useRef(false)

    React.useEffect(() => {
        if (isStatic) return
        setVisitorZone(safeZone(new Intl.DateTimeFormat().resolvedOptions().timeZone, "UTC"))
    }, [isStatic])

    // the event is on: open today's tab (once, so a later click on another tab sticks)
    React.useEffect(() => {
        if (now === null || autoDay.current) return
        autoDay.current = true
        const i = days.findIndex((d) => d.date === dateAt(now, eventZone))
        if (i >= 0) setDayIndex(i)
    }, [now, days, eventZone])

    const starSet = React.useMemo(() => new Set(stars), [stars])
    const starCount = sessions.filter((s) => starSet.has(s.id)).length
    React.useEffect(() => {
        if (starCount === 0 && starredOnly) setStarredOnly(false)
    }, [starCount, starredOnly])

    React.useEffect(() => {
        if (!menu) return
        const onDown = (e: PointerEvent) => {
            const target = e.target as Element | null
            if (!target || !target.closest || !target.closest(`[data-menu="${menu.id}"]`)) setMenu(null)
        }
        document.addEventListener("pointerdown", onDown)
        return () => document.removeEventListener("pointerdown", onDown)
    }, [menu])

    React.useEffect(() => {
        if (!menu || pendingFocus.current !== menu.id) return
        pendingFocus.current = null
        const first = rootRef.current && rootRef.current.querySelector<HTMLElement>(`[data-menu="${menu.id}"] [data-menu-item]`)
        if (first) first.focus()
    }, [menu])

    const ready = isStatic || visitorZone !== null
    const zonesDiffer =
        visitorZone !== null && visitorZone !== eventZone && sessions.some((s) => offsetAt(s.startMs, visitorZone) !== offsetAt(s.startMs, eventZone))
    const showSeg = isStatic || !ready || zonesDiffer
    const shownZone = mode === "mine" && zonesDiffer && visitorZone ? visitorZone : eventZone

    const dayCount = days.length
    const di = Math.min(dayIndex, Math.max(0, dayCount - 1))
    const day = days[di]
    const activeKeys = trackSel.filter((k) => tracks.some((t) => t.key === k))
    const columns = activeKeys.length ? tracks.filter((t) => activeKeys.includes(t.key)) : tracks
    const onlyStarred = starredOnly && starCount > 0
    const isLive = (s: Session) => now !== null && now >= s.startMs && now < s.endMs

    const daySessions = day ? sessions.filter((s) => s.date === day.date) : []
    const shown = daySessions.filter((s) => (s.track === null || columns.includes(s.track)) && (!onlyStarred || starSet.has(s.id)))
    const groups: Array<{ startMs: number; items: Session[] }> = []
    for (const s of shown) {
        const last = groups[groups.length - 1]
        if (last && last.startMs === s.startMs) last.items.push(s)
        else groups.push({ startMs: s.startMs, items: [s] })
    }
    const rowLimit = compact ? Math.max(1, Math.round(Number(previewRows) || 4)) : groups.length
    const visibleGroups = groups.slice(0, rowLimit)

    const noteMs = daySessions.length ? daySessions[0].startMs : now !== null ? now : 0
    const noteZone = shownZone
    const noteText = `Times shown in ${zoneName(noteZone)} time (${gmtLabel(offsetAt(noteMs, noteZone))})`

    const ctx: CalendarContext = { eventName: String(eventName || "").trim(), venue: String(venue || "").trim() }
    const basePath = String(speakerPath || "").trim()
    const speakerHref = (slug: string) => (basePath ? `${basePath}${basePath.endsWith("/") ? "" : "/"}${slug}` : slug)

    const toggleTrack = (key: string) => {
        const next = activeKeys.includes(key) ? activeKeys.filter((k) => k !== key) : [...activeKeys, key]
        setTrackSel(next.length === tracks.length ? [] : next)
    }

    const openMenu = (id: string, trigger: HTMLElement, focusItem: boolean) => {
        const r = trigger.getBoundingClientRect()
        if (focusItem) pendingFocus.current = id
        setMenu({ id, up: window.innerHeight - r.bottom < 150 && r.top > 150 })
    }

    const onTabKey = (e: React.KeyboardEvent, i: number) => {
        let n = i
        if (e.key === "ArrowRight") n = (i + 1) % dayCount
        else if (e.key === "ArrowLeft") n = (i - 1 + dayCount) % dayCount
        else if (e.key === "Home") n = 0
        else if (e.key === "End") n = dayCount - 1
        else return
        e.preventDefault()
        setDayIndex(n)
        const el = tabRefs.current[n]
        if (el) el.focus()
    }

    const onMenuKey = (e: React.KeyboardEvent<HTMLElement>, id: string) => {
        const isOpen = menu !== null && menu.id === id
        if (e.key === "Escape" && isOpen) {
            e.stopPropagation()
            setMenu(null)
            const trigger = triggerRefs.current[id]
            if (trigger) trigger.focus()
            return
        }
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
        if (!isOpen) {
            const trigger = triggerRefs.current[id]
            if (e.key === "ArrowDown" && trigger) {
                e.preventDefault()
                openMenu(id, trigger, true)
            }
            return
        }
        const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-menu-item]"))
        if (!items.length) return
        e.preventDefault()
        const at = items.indexOf(document.activeElement as HTMLElement)
        const next = at < 0 ? (e.key === "ArrowDown" ? 0 : items.length - 1) : (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length
        items[next].focus()
    }

    const timeParts = (s: Session) => {
        const offsetShift = (ms: number) => dayNumber(dateAt(ms, shownZone)) - dayNumber(dateAt(ms, eventZone))
        const a = offsetShift(s.startMs)
        const b = offsetShift(s.endMs)
        return { start: clockAt(s.startMs, shownZone), end: clockAt(s.endMs, shownZone), shiftStart: a, shiftEnd: b }
    }

    const mark = (n: number) =>
        n === 0 ? null : (
            <span className="ss-shift" title={n > 0 ? "Next day in your time" : "Previous day in your time"}>
                {dayShiftMark(n)}
            </span>
        )

    const downloadMine = () => {
        const mine = sessions.filter((s) => starSet.has(s.id))
        if (!mine.length) return
        downloadText(`${eventSlug}-my-schedule.ics`, buildIcs(mine, ctx, `${ctx.eventName || "Event"} \u2013 my schedule`))
    }

    const renderCard = (s: Session) => {
        const t = timeParts(s)
        const starred = starSet.has(s.id)
        const live = isLive(s)
        const open = menu !== null && menu.id === s.id
        const wide = s.track === null || columns.length === 1
        // starred only: cards pack left to right instead of sitting in their track column
        const col = s.track === null ? "1 / -1" : onlyStarred ? "auto" : String(columns.indexOf(s.track) + 1)
        const isBreak = s.track === null && !s.speaker
        const accent = s.track ? s.track.color : inkColor
        const popId = `${uid}-pop-${s.id}`
        return (
            <li
                key={s.id}
                className="ss-card"
                data-track={s.track ? s.track.key : "all"}
                data-kind={isBreak ? "break" : "talk"}
                data-live={live}
                data-wide={wide}
                data-open={open}
                style={{ "--tc": accent, gridColumn: col } as React.CSSProperties}
            >
                <span className="ss-tag" style={{ "--tc": accent } as React.CSSProperties}>
                    <i className="ss-dot" aria-hidden="true" />
                    {s.track ? s.track.name : L.allTracks}
                </span>
                <button
                    type="button"
                    className="ss-star"
                    aria-pressed={starred}
                    aria-label={`Star: ${s.title}`}
                    title={starred ? "Remove from my schedule" : "Add to my schedule"}
                    onClick={() => toggleStar(s.id)}
                >
                    <StarIcon />
                </button>
                <p className="ss-when">
                    <span className="ss-clock">
                        {t.start}
                        {mark(t.shiftStart)}
                        {"\u2013"}
                        {t.end}
                        {t.shiftEnd !== t.shiftStart ? mark(t.shiftEnd) : null}
                    </span>
                    <span>{durationText(s.minutes)}</span>
                    {live && (
                        <span className="ss-live">
                            <i aria-hidden="true" />
                            {L.happeningNow}
                        </span>
                    )}
                </p>
                <h3 className="ss-title">{s.title}</h3>
                {(s.speaker || s.room) && (
                    <p className="ss-who">
                        {s.speaker ? s.slug ? <a href={speakerHref(s.slug)}>{s.speaker}</a> : <span>{s.speaker}</span> : null}
                        {s.speaker && s.room ? <span className="ss-room">{" \u00b7 "}</span> : null}
                        {s.room ? <span className="ss-room">{s.room}</span> : null}
                    </p>
                )}
                <div
                    className="ss-menu"
                    data-menu={s.id}
                    onKeyDown={(e) => onMenuKey(e, s.id)}
                    onBlur={(e) => {
                        const next = e.relatedTarget as Node | null
                        if (open && next && !e.currentTarget.contains(next)) setMenu(null)
                    }}
                >
                    <button
                        type="button"
                        className="ss-cal"
                        ref={(el) => {
                            triggerRefs.current[s.id] = el
                        }}
                        aria-expanded={open}
                        aria-controls={open ? popId : undefined}
                        aria-label={`Add to calendar: ${s.title}`}
                        onClick={(e) => (open ? setMenu(null) : openMenu(s.id, e.currentTarget, false))}
                    >
                        <CalendarIcon />
                        {L.addToCalendar}
                        <ChevronIcon />
                    </button>
                    {open && menu && (
                        <div className="ss-pop" id={popId} data-up={menu.up}>
                            <button
                                type="button"
                                data-menu-item=""
                                onClick={() => {
                                    downloadText(`${eventSlug}-${s.slug || slugify(s.title)}-${s.date}.ics`, buildIcs([s], ctx, ctx.eventName || s.title))
                                    setMenu(null)
                                }}
                            >
                                <DownloadIcon />
                                Download .ics
                            </button>
                            <a data-menu-item="" href={googleLink(s, ctx)} target="_blank" rel="noopener noreferrer" onClick={() => setMenu(null)}>
                                <CalendarIcon />
                                Google Calendar
                            </a>
                        </div>
                    )}
                </div>
            </li>
        )
    }

    const rootVars = {
        width: "100%",
        ...style,
        "--ss-ink": inkColor,
        "--ss-muted": mutedColor,
        "--ss-paper": paperColor,
        "--ss-card": cardColor,
        "--ss-line": lineColor,
        "--ss-hi": highlightColor,
        "--ss-r": `${Math.max(0, Number(radius) || 0)}px`,
        "--ss-cols": Math.max(1, columns.length),
        "--ss-title": familyOf(titleFont, TITLE_STACK),
        "--ss-title-w": (titleFont && titleFont.fontWeight) || 800,
        "--ss-body": familyOf(bodyFont, BODY_STACK),
        "--ss-mono": familyOf(monoFont, MONO_STACK),
    } as React.CSSProperties

    const panelId = `${uid}-panel`
    const tabId = (i: number) => `${uid}-tab-${i}`
    const dayLive = (d: Day) => sessions.some((s) => s.date === d.date && isLive(s))
    const dayStars = (d: Day) => sessions.filter((s) => s.date === d.date && starSet.has(s.id)).length
    const summary = `${shown.length} ${shown.length === 1 ? "session" : "sessions"} shown`

    return (
        <div ref={rootRef} className="ss" data-ready={ready} data-mode={shownZone === eventZone ? "event" : "mine"} data-compact={compact} style={rootVars}>
            <style>{CSS}</style>
            {!isStatic && (
                <p className="ss-sr" role="status">
                    {summary}
                </p>
            )}
            <div className="ss-bar">
                {compact ? (
                    day && (
                        <div className="ss-tabs">
                            <div className="ss-tab" data-current="true">
                                <span className="ss-tab-date">{dayTitle(day.date)}</span>
                                {day.label && <span className="ss-tab-sub">{day.label}</span>}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="ss-tabs" role="tablist" aria-label="Days">
                        {days.map((d, i) => (
                            <button
                                key={d.date}
                                type="button"
                                role="tab"
                                id={tabId(i)}
                                className="ss-tab"
                                aria-selected={i === di}
                                aria-controls={panelId}
                                tabIndex={i === di ? 0 : -1}
                                ref={(el) => {
                                    tabRefs.current[i] = el
                                }}
                                onClick={() => setDayIndex(i)}
                                onKeyDown={(e) => onTabKey(e, i)}
                            >
                                <span className="ss-tab-date">
                                    {dayTitle(d.date)}
                                    {dayLive(d) && <i className="ss-pulse" role="img" aria-label={L.happeningNow} />}
                                </span>
                                <span className="ss-tab-sub">
                                    {d.label}
                                    {onlyStarred ? `${d.label ? " \u00b7 " : ""}${dayStars(d)} starred` : ""}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                {showSeg && (
                    <div className="ss-seg" role="group" aria-label="Time zone">
                        <button type="button" aria-pressed={mode === "event" || !zonesDiffer} onClick={() => setMode("event")}>
                            {L.eventTime}
                        </button>
                        <button type="button" aria-pressed={mode === "mine" && zonesDiffer} onClick={() => setMode("mine")}>
                            {L.myTime}
                        </button>
                    </div>
                )}
            </div>
            {!compact && (
                <div className="ss-bar ss-bar2">
                    <div className="ss-chips" role="group" aria-label="Filter by track">
                        <button type="button" className="ss-chip" aria-pressed={activeKeys.length === 0} onClick={() => setTrackSel([])}>
                            {L.allTracks}
                        </button>
                        {tracks.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                className="ss-chip"
                                aria-pressed={activeKeys.includes(t.key)}
                                style={{ "--tc": t.color } as React.CSSProperties}
                                onClick={() => toggleTrack(t.key)}
                            >
                                <i className="ss-dot" aria-hidden="true" />
                                {t.name}
                            </button>
                        ))}
                    </div>
                    <div className="ss-mine">
                        <button
                            type="button"
                            className="ss-btn"
                            data-kind="ghost"
                            aria-pressed={onlyStarred}
                            disabled={starCount === 0}
                            title={starCount === 0 ? "Star a session to build your own schedule" : undefined}
                            onClick={() => setStarredOnly(!onlyStarred)}
                        >
                            <StarIcon />
                            {L.starredOnly}
                            {starCount > 0 && <span className="ss-count">{starCount}</span>}
                        </button>
                        <button
                            type="button"
                            className="ss-btn"
                            data-kind="primary"
                            disabled={starCount === 0}
                            title={starCount === 0 ? "Star a session to build your own schedule" : undefined}
                            onClick={downloadMine}
                        >
                            <DownloadIcon />
                            {L.downloadMine}
                        </button>
                    </div>
                </div>
            )}
            <p className="ss-note">{noteText}</p>
            <div role={compact ? undefined : "tabpanel"} id={panelId} aria-labelledby={compact ? undefined : tabId(di)}>
                {visibleGroups.length ? (
                    <ol className="ss-rows">
                        {visibleGroups.map((g) => {
                            const startShift = dayNumber(dateAt(g.startMs, shownZone)) - dayNumber(dateAt(g.startMs, eventZone))
                            return (
                                <li key={g.startMs} className="ss-row">
                                    <p className="ss-label" aria-hidden="true">
                                        <span>
                                            {clockAt(g.startMs, shownZone)}
                                            {mark(startShift)}
                                        </span>
                                    </p>
                                    <ul className="ss-cards">{g.items.map(renderCard)}</ul>
                                </li>
                            )
                        })}
                    </ol>
                ) : (
                    <p className="ss-empty">{onlyStarred ? "Nothing starred on this day yet." : "No sessions match these tracks."}</p>
                )}
            </div>
            {compact && moreLink && groups.length > 0 && (
                <p className="ss-more">
                    <a className="ss-btn" data-kind="primary" href={moreLink}>
                        {moreLabel}
                    </a>
                </p>
            )}
        </div>
    )
}

// Font controls cannot name a family in defaultValue: pick Archivo 800 (title), DM Sans 400 (body) and DM Mono 500 (mono) on the instance.
// Without a picked font the skin falls back to those families by name (TITLE_STACK, BODY_STACK, MONO_STACK).
addPropertyControls(SessionSchedule, {
    days: {
        type: ControlType.String,
        title: "Days",
        defaultValue: DEFAULT_DAYS,
        displayTextArea: true,
        description: "One per line: date|label, e.g. 2027-03-18|Workshops",
    },
    tracks: {
        type: ControlType.String,
        title: "Tracks",
        defaultValue: DEFAULT_TRACKS,
        displayTextArea: true,
        description: "One per line: name|#color. A session whose track is All (or not listed) spans every column.",
    },
    sessions: {
        type: ControlType.String,
        title: "Sessions",
        defaultValue: DEFAULT_SESSIONS,
        displayTextArea: true,
        description: "One per line: date|start|end|track|title|speaker|room|speaker slug. Times are HH:MM in the event time zone.",
    },
    eventName: {
        type: ControlType.String,
        title: "Event name",
        defaultValue: "Halfstep 2027",
        description: "Used in calendar files and to keep starred sessions apart from other events.",
    },
    eventTimeZone: {
        type: ControlType.String,
        title: "Event time zone",
        defaultValue: "Europe/Amsterdam",
        description: "IANA name, e.g. Europe/Amsterdam. A wrong name falls back to UTC.",
    },
    venue: {
        type: ControlType.String,
        title: "Venue",
        defaultValue: "Pier Hall, Rotterdam, NL",
        description: "Added after the room in the calendar location.",
    },
    speakerPath: {
        type: ControlType.String,
        title: "Speaker path",
        defaultValue: "/speakers/",
        description: "Speaker names link to this path + the speaker slug.",
    },
    compact: {
        type: ControlType.Boolean,
        title: "Compact",
        defaultValue: false,
        enabledTitle: "Preview",
        disabledTitle: "Full",
    },
    previewRows: {
        type: ControlType.Number,
        title: "Preview rows",
        defaultValue: 4,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        hidden: (props: Partial<SessionScheduleProps>) => !props.compact,
    },
    moreLabel: {
        type: ControlType.String,
        title: "More label",
        defaultValue: "See the full schedule",
        hidden: (props: Partial<SessionScheduleProps>) => !props.compact,
    },
    moreLink: {
        type: ControlType.Link,
        title: "More link",
        hidden: (props: Partial<SessionScheduleProps>) => !props.compact,
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            eventTime: { type: ControlType.String, title: "Event time", defaultValue: DEFAULT_LABELS.eventTime },
            myTime: { type: ControlType.String, title: "My time", defaultValue: DEFAULT_LABELS.myTime },
            allTracks: { type: ControlType.String, title: "All tracks", defaultValue: DEFAULT_LABELS.allTracks },
            starredOnly: { type: ControlType.String, title: "Starred only", defaultValue: DEFAULT_LABELS.starredOnly },
            downloadMine: { type: ControlType.String, title: "Download", defaultValue: DEFAULT_LABELS.downloadMine },
            addToCalendar: { type: ControlType.String, title: "Add to calendar", defaultValue: DEFAULT_LABELS.addToCalendar },
            happeningNow: { type: ControlType.String, title: "Happening now", defaultValue: DEFAULT_LABELS.happeningNow },
        },
    },
    inkColor: { type: ControlType.Color, title: "Ink", defaultValue: "#16161A" },
    mutedColor: { type: ControlType.Color, title: "Muted", defaultValue: "#5B5850" },
    paperColor: { type: ControlType.Color, title: "Paper", defaultValue: "#FFF6E5" },
    cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#FBEBD0" },
    lineColor: { type: ControlType.Color, title: "Line", defaultValue: "rgba(22,22,26,0.12)" },
    highlightColor: { type: ControlType.Color, title: "Highlight", defaultValue: "#FFD23F" },
    radius: {
        type: ControlType.Number,
        title: "Corner radius",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    monoFont: {
        type: ControlType.Font,
        title: "Mono font",
        controls: "basic",
        defaultFontType: "monospace",
    },
})
