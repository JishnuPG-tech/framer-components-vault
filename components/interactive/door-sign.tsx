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


// Door Sign: one-line badge "● Open · 10:24 in Lisbon · 8h behind you · Booking from next month ●●○○".
// Clock, weekday and office hours all come from Intl.DateTimeFormat in the studio's time zone. Refreshes once a minute.

interface DoorSignProps {
    city: string
    timeZone: string
    firstDay: string
    lastDay: string
    opensAt: number
    closesAt: number
    bookingFrom: string
    slots: number
    skin: string
    inkColor: string
    mutedColor: string
    accentColor: string
    lineColor: string
    bodyFont?: React.CSSProperties
    monoFont?: React.CSSProperties
    style?: React.CSSProperties
}

/* ---------- time ---------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SLOT_COUNT = 4
const STATIC_TIME = "10:24"
const SKINS = ["outline", "pill", "tint"]

interface ZoneClock {
    day: number // 0 = Mon … 6 = Sun, in that zone
    minutes: number // minutes since local midnight
    offset: number // minutes east of UTC at this instant
}

const FORMAT: Intl.DateTimeFormatOptions = {
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
}

// undefined = the visitor's own zone. An unknown IANA name throws a RangeError: caught here, the clock falls back to UTC.
function makeFormatter(timeZone: string | undefined): Intl.DateTimeFormat {
    try {
        return new Intl.DateTimeFormat("en-US", { ...FORMAT, timeZone })
    } catch (error) {
        return new Intl.DateTimeFormat("en-US", { ...FORMAT, timeZone: "UTC" })
    }
}

function zoneClock(ms: number, formatter: Intl.DateTimeFormat): ZoneClock {
    const whole = Math.floor(ms / 1000) * 1000
    const v: Record<string, string> = {}
    for (const part of formatter.formatToParts(new Date(whole))) v[part.type] = part.value
    const hour = Number(v.hour) % 24
    const local = Date.UTC(Number(v.year), Number(v.month) - 1, Number(v.day), hour, Number(v.minute), Number(v.second))
    return {
        day: Math.max(0, DAYS.indexOf(v.weekday)),
        minutes: hour * 60 + Number(v.minute),
        offset: Math.round((local - whole) / 60000),
    }
}

function clamp(value: unknown, fallback: number, min: number, max: number): number {
    const n = typeof value === "number" ? value : Number(value)
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

function dayIndex(name: unknown, fallback: number): number {
    const i = DAYS.indexOf(String(name))
    return i < 0 ? fallback : i
}

interface Hours {
    first: number
    last: number
    open: number // minutes
    close: number // minutes
}

// open from `open` (inclusive) to `close` (exclusive) on working days; close < open runs past midnight into the next day
function isOpen(clock: ZoneClock, hours: Hours): boolean {
    const { first, last, open, close } = hours
    const worksOn = (d: number) => (first <= last ? d >= first && d <= last : d >= first || d <= last)
    if (close > open) return worksOn(clock.day) && clock.minutes >= open && clock.minutes < close
    if (close < open) return (worksOn(clock.day) && clock.minutes >= open) || (worksOn((clock.day + 6) % 7) && clock.minutes < close)
    return false
}

function two(n: number): string {
    return n < 10 ? `0${n}` : String(n)
}

function formatTime(minutes: number): string {
    return `${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`
}

// studio minus visitor, in minutes: negative = the studio's clock is behind the visitor's
function describeGap(gap: number): { span: string; tail: string } {
    if (gap === 0) return { span: "", tail: "same time as you" }
    const abs = Math.abs(gap)
    const h = Math.floor(abs / 60)
    const m = abs % 60
    const span = h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`
    return { span, tail: gap < 0 ? "behind you" : "ahead of you" }
}

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

/* ---------- skin: every style value lives here ---------- */

const BODY_STACK = '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const MONO_STACK = '"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'

function familyOf(font: React.CSSProperties | undefined, fallback: string): string {
    const family = font && typeof font.fontFamily === "string" ? font.fontFamily.trim() : ""
    return family ? `${family}, ${fallback}` : fallback
}

const CSS = `
.dsg,.dsg *{box-sizing:border-box}
.dsg{container-type:inline-size;position:relative;width:100%;color:var(--dsg-ink);font-family:var(--dsg-body);font-size:14px;line-height:20px;font-weight:400;letter-spacing:0}
.dsg-badge{display:flex;width:fit-content;max-width:100%;overflow:hidden;border:1px solid var(--dsg-line)}
.dsg[data-ready=false] .dsg-badge{visibility:hidden}
.dsg-flow{display:flex;flex-wrap:wrap;align-items:center;min-width:0;margin-left:-1px}
.dsg-item{display:flex;align-items:center;gap:8px;padding:6px 14px;border-left:1px solid var(--dsg-line);white-space:nowrap}
.dsg-brk{display:none;flex:0 0 100%;height:0}
.dsg-dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--dsg-muted)}
.dsg[data-state=open] .dsg-dot{background:var(--dsg-accent)}
.dsg-num{font-family:var(--dsg-mono);font-weight:500}
.dsg-muted{color:var(--dsg-muted)}
.dsg-slots{display:flex;gap:5px;margin-left:4px}
.dsg-slot{flex:none;width:8px;height:8px;border-radius:50%;border:1px solid var(--dsg-muted)}
.dsg-slot[data-on=true]{background:var(--dsg-accent);border-color:var(--dsg-accent)}
.dsg[data-skin=pill] .dsg-badge{border-color:transparent;border-radius:999px;background:color-mix(in srgb,var(--dsg-ink) 7%,transparent)}
.dsg[data-skin=pill] .dsg-item{border-left-color:color-mix(in srgb,var(--dsg-ink) 12%,transparent)}
.dsg[data-skin=pill] .dsg-item:first-child{padding-left:18px}
.dsg[data-skin=tint] .dsg-badge{border-color:color-mix(in srgb,var(--dsg-accent) 35%,transparent);border-radius:6px;background:color-mix(in srgb,var(--dsg-accent) 9%,transparent)}
.dsg[data-skin=tint] .dsg-item{border-left-color:color-mix(in srgb,var(--dsg-accent) 25%,transparent)}
.dsg[data-skin=tint][data-state=closed] .dsg-badge{border-color:var(--dsg-line);background:color-mix(in srgb,var(--dsg-muted) 10%,transparent)}
.dsg[data-skin=tint][data-state=closed] .dsg-item{border-left-color:var(--dsg-line)}
@container (max-width:479.98px){
.dsg[data-skin=pill] .dsg-badge{border-radius:22px}
.dsg-brk{display:block}
.dsg-item{padding-left:10px;padding-right:10px;gap:6px}
}
`

/**
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 36
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function DoorSign(props: DoorSignProps) {
    const {
        city = "Lisbon",
        timeZone = "Europe/Lisbon",
        firstDay = "Mon",
        lastDay = "Fri",
        opensAt = 9,
        closesAt = 18,
        bookingFrom = "next month",
        slots = 2,
        skin = "outline",
        inkColor = "#0F0F0E",
        mutedColor = "#5E5C57",
        accentColor = "#2F45FF",
        lineColor = "rgba(15,15,14,0.14)",
        bodyFont,
        monoFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const now = useMinuteClock(!isStatic)

    const zone = String(timeZone || "").trim()
    // wrong or empty zone name: UTC, no console error
    const studioFormatter = React.useMemo(() => makeFormatter(zone || "UTC"), [zone])
    const visitorFormatter = React.useMemo(() => makeFormatter(undefined), [])

    const hours: Hours = {
        first: dayIndex(firstDay, 0),
        last: dayIndex(lastDay, 4),
        open: Math.round(clamp(opensAt, 9, 0, 24) * 60),
        close: Math.round(clamp(closesAt, 18, 0, 24) * 60),
    }

    // static renderer (canvas, thumbnails): fixed "10:24", open, no gap phrase. Before mount: same layout, hidden.
    const ready = isStatic || now !== null
    let open = true
    let time = STATIC_TIME
    let gap: { span: string; tail: string } | null = isStatic ? null : { span: "", tail: "same time as you" }
    if (!isStatic && now !== null) {
        const studio = zoneClock(now, studioFormatter)
        const visitor = zoneClock(now, visitorFormatter)
        open = isOpen(studio, hours)
        time = formatTime(studio.minutes)
        gap = describeGap(studio.offset - visitor.offset)
    }

    const cityName = String(city || "").trim()
    const booking = String(bookingFrom || "").trim()
    const filled = Math.round(clamp(slots, 2, 0, SLOT_COUNT))

    const rootVars = {
        width: "100%",
        ...style,
        "--dsg-ink": inkColor,
        "--dsg-muted": mutedColor,
        "--dsg-accent": accentColor,
        "--dsg-line": lineColor,
        "--dsg-body": familyOf(bodyFont, BODY_STACK),
        "--dsg-mono": familyOf(monoFont, MONO_STACK),
    } as React.CSSProperties

    return (
        <div className="dsg" data-state={open ? "open" : "closed"} data-skin={SKINS.includes(skin) ? skin : "outline"} data-ready={ready} style={rootVars}>
            <style>{CSS}</style>
            <div className="dsg-badge">
                <div className="dsg-flow">
                    <div className="dsg-item dsg-status">
                        <span className="dsg-dot" aria-hidden="true" />
                        <span>{open ? "Open" : "Closed"}</span>
                    </div>
                    <div className="dsg-item dsg-where">
                        <span>
                            <span className="dsg-num">{time}</span>
                            {cityName ? ` in ${cityName}` : ""}
                        </span>
                    </div>
                    {gap && (
                        <div className="dsg-item dsg-gap">
                            <span>
                                {gap.span && <span className="dsg-num">{gap.span}</span>}
                                {gap.span ? " " : ""}
                                {gap.tail}
                            </span>
                        </div>
                    )}
                    <div className="dsg-brk" aria-hidden="true" />
                    <div className="dsg-item dsg-booking">
                        {booking && <span>{`Booking from ${booking}`}</span>}
                        <span className="dsg-slots" role="img" aria-label={`${filled} of ${SLOT_COUNT} slots open`}>
                            {Array.from({ length: SLOT_COUNT }, (_, i) => (
                                <span key={i} className="dsg-slot" data-on={i < filled} />
                            ))}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Font controls cannot name a family in defaultValue: pick Inter (400/500) and IBM Plex Mono (500) on the instance.
// Without a picked font the skin falls back to those families by name (BODY_STACK, MONO_STACK).
addPropertyControls(DoorSign, {
    city: { type: ControlType.String, title: "City", defaultValue: "Lisbon" },
    timeZone: {
        type: ControlType.String,
        title: "Time zone",
        defaultValue: "Europe/Lisbon",
        description: "IANA name, e.g. Europe/Lisbon. A wrong name falls back to UTC.",
    },
    firstDay: {
        type: ControlType.Enum,
        title: "First day",
        options: DAYS,
        optionTitles: DAYS,
        defaultValue: "Mon",
    },
    lastDay: {
        type: ControlType.Enum,
        title: "Last day",
        options: DAYS,
        optionTitles: DAYS,
        defaultValue: "Fri",
    },
    opensAt: {
        type: ControlType.Number,
        title: "Opens at",
        description: "Studio hour, 0–24",
        defaultValue: 9,
        min: 0,
        max: 24,
        step: 0.5,
        unit: "h",
    },
    closesAt: {
        type: ControlType.Number,
        title: "Closes at",
        defaultValue: 18,
        min: 0,
        max: 24,
        step: 0.5,
        unit: "h",
    },
    bookingFrom: {
        type: ControlType.String,
        title: "Booking from",
        defaultValue: "next month",
        description: 'Shown as "Booking from …".',
    },
    slots: {
        type: ControlType.Number,
        title: "Slots",
        description: "Open slots: filled dots out of 4",
        defaultValue: 2,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    skin: {
        type: ControlType.Enum,
        title: "Skin",
        options: SKINS,
        optionTitles: ["Outline", "Pill", "Tint"],
        defaultValue: "outline",
    },
    inkColor: { type: ControlType.Color, title: "Ink", defaultValue: "#0F0F0E" },
    mutedColor: { type: ControlType.Color, title: "Muted", defaultValue: "#5E5C57" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#2F45FF" },
    lineColor: { type: ControlType.Color, title: "Line", defaultValue: "rgba(15,15,14,0.14)" },
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
