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


// Badge Countdown: name-badge card that counts down to a date, says "Happening now" while the event runs
// and a closing line afterwards. Times are wall-clock times in the chosen time zone (Intl only, no library).

type Unit = "days" | "hours" | "minutes" | "seconds"

interface EventCountdownProps {
    startsAt: string
    endsAt: string
    timeZone: string
    labelBefore: string
    labelDuring: string
    labelAfter: string
    showDays: boolean
    showHours: boolean
    showMinutes: boolean
    showSeconds: boolean
    size: "compact" | "large"
    align: "left" | "center" | "right"
    cardColor: string
    holeColor: string
    bandColor: string
    inkColor: string
    mutedColor: string
    lineColor: string
    highlightColor: string
    headingFont?: React.CSSProperties
    monoFont?: React.CSSProperties
    style?: React.CSSProperties
}

/* ---------- time ---------- */

const UNIT_MS: Record<Unit, number> = { days: 86400000, hours: 3600000, minutes: 60000, seconds: 1000 }
const UNIT_ORDER: Unit[] = ["days", "hours", "minutes", "seconds"]
const UNIT_SHORT: Record<Unit, string> = { days: "d", hours: "h", minutes: "m", seconds: "s" }
const UNIT_LONG: Record<Unit, string> = { days: "Days", hours: "Hours", minutes: "Min", seconds: "Sec" }
const UNIT_SPOKEN: Record<Unit, [string, string]> = {
    days: ["day", "days"],
    hours: ["hour", "hours"],
    minutes: ["minute", "minutes"],
    seconds: ["second", "seconds"],
}

// static renderer / first paint before the clock is read: 152 days 04 h 12 m 36 s
const PLACEHOLDER_MS = (((152 * 24 + 4) * 60 + 12) * 60 + 36) * 1000
const MAX_WAIT = 60000 // never sleep longer than a minute: a laptop that slept catches up on the next wake-up

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
    let f = formatters.get(timeZone)
    if (!f) {
        f = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
        formatters.set(timeZone, f)
    }
    return f
}

// zone offset in ms at a UTC instant (wall clock minus UTC); throws RangeError for an unknown zone
function offsetAt(utc: number, timeZone: string): number {
    const parts = formatterFor(timeZone).formatToParts(new Date(utc))
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
    const hour = get("hour") % 24
    const wall = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"))
    return wall - Math.floor(utc / 1000) * 1000
}

// "2028-03-16T09:00" in a zone -> UTC ms. A trailing Z or +01:00 wins over the zone. NaN when unreadable.
function parseInstant(text: string, timeZone: string): number {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(String(text || "").trim())
    if (!m) return NaN
    const [y, mo, d, h, mi, s] = [m[1], m[2], m[3], m[4] || "0", m[5] || "0", m[6] || "0"].map(Number)
    const wall = Date.UTC(y, mo - 1, d, h, mi, s)
    const check = new Date(wall)
    if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d || h > 23 || mi > 59 || s > 59) return NaN
    if (m[7]) {
        if (m[7].toUpperCase() === "Z") return wall
        const sign = m[7][0] === "-" ? -1 : 1
        const digits = m[7].slice(1).replace(":", "")
        return wall - sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2))) * 60000
    }
    try {
        // a wall time that happens twice (clocks go back) means the first one: the earliest instant whose offset maps back to it
        let best = NaN
        for (const o of [offsetAt(wall - 86400000, timeZone), offsetAt(wall + 86400000, timeZone)]) {
            const c = wall - o
            if (offsetAt(c, timeZone) === o && !(c >= best)) best = c
        }
        if (!Number.isNaN(best)) return best
        const first = wall - offsetAt(wall, timeZone)
        return wall - offsetAt(first, timeZone) // spring gap: no instant fits, the second pass settles it
    } catch (error) {
        return NaN
    }
}

// the largest shown unit takes everything above it (days off -> hours count past 24); the smallest rounds down
function split(ms: number, units: Unit[]): Record<Unit, number> {
    const out: Record<Unit, number> = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    let rest = Math.max(0, ms)
    for (const unit of units) {
        out[unit] = Math.floor(rest / UNIT_MS[unit])
        rest -= out[unit] * UNIT_MS[unit]
    }
    return out
}

function spoken(ms: number, units: Unit[]): string {
    const parts = split(ms, units)
    return units.map((unit) => `${parts[unit]} ${UNIT_SPOKEN[unit][parts[unit] === 1 ? 0 : 1]}`).join(" ")
}

type Phase = "before" | "during" | "after" | "invalid"

/* ---------- skin: every style value lives here ---------- */

const HEADING_STACK = 'Archivo, "Archivo Black", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const MONO_STACK = '"DM Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'

function familyOf(font: React.CSSProperties | undefined, fallback: string): string {
    const family = font && typeof font.fontFamily === "string" ? font.fontFamily.trim() : ""
    return family ? `${family}, ${fallback}` : fallback
}

const CSS = `
.bcd,.bcd *{box-sizing:border-box}
.bcd{container-type:inline-size;width:100%;display:flex;justify-content:var(--bcd-just);color:var(--bcd-ink);font-family:var(--bcd-mono)}
.bcd :where(p,div,span){margin:0;padding:0}
.bcd[data-size=large]{--bcd-fs:min(72px,11cqw);--bcd-top:44px;--bcd-px:28px;--bcd-bottom:26px;--bcd-band:10px;--bcd-hole-w:44px;--bcd-hole-h:12px;--bcd-hole-top:17px;--bcd-msg:min(34px,8cqw)}
.bcd[data-size=compact]{--bcd-fs:min(26px,6.6cqw);--bcd-top:30px;--bcd-px:20px;--bcd-bottom:16px;--bcd-band:6px;--bcd-hole-w:28px;--bcd-hole-h:8px;--bcd-hole-top:11px;--bcd-msg:min(20px,5.4cqw)}
.bcd-card{position:relative;overflow:hidden;max-width:100%;border-radius:20px;background:var(--bcd-card);border:1px solid var(--bcd-line);padding:var(--bcd-top) var(--bcd-px) var(--bcd-bottom)}
.bcd-band{position:absolute;left:0;right:0;top:0;height:var(--bcd-band);background:var(--bcd-band-color)}
.bcd-hole{position:absolute;left:50%;top:var(--bcd-hole-top);width:var(--bcd-hole-w);height:var(--bcd-hole-h);margin-left:calc(var(--bcd-hole-w)/-2);border-radius:999px;background:var(--bcd-hole-color);box-shadow:inset 0 1px 2px var(--bcd-line),0 0 0 1px var(--bcd-line)}
.bcd-body{display:flex;flex-direction:column;align-items:center;text-align:center}
.bcd-body[data-ready=false]{opacity:0}
.bcd-label{font-size:12px;line-height:1.3;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--bcd-muted)}
.bcd[data-size=compact] .bcd-label{font-size:11px}
.bcd-msg{text-wrap:balance;font-family:var(--bcd-heading);font-weight:800;font-size:var(--bcd-msg);line-height:1.15;letter-spacing:.01em;text-transform:uppercase;padding:0 .12em}
.bcd-msg[data-hi=true]{background:linear-gradient(transparent 58%,var(--bcd-hi) 58%,var(--bcd-hi) 92%,transparent 92%)}
.bcd-digits{display:flex;align-items:flex-start;justify-content:center;margin-top:14px;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.bcd[data-size=compact] .bcd-digits{margin-top:6px;align-items:baseline}
.bcd-cell{display:flex;flex-direction:column;align-items:center;padding:0 .42em}
.bcd-cell+.bcd-cell{border-left:1px solid var(--bcd-line)}
.bcd[data-size=compact] .bcd-cell{flex-direction:row;align-items:baseline;gap:.25em;padding:0 .45em;border-left:0}
.bcd-num{display:block;text-align:center;font-size:var(--bcd-fs);line-height:1;font-weight:500;letter-spacing:0;white-space:nowrap}
.bcd-unit{display:block;margin-top:12px;font-size:12px;line-height:1;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--bcd-muted)}
.bcd[data-size=compact] .bcd-unit{margin-top:0;font-size:max(11px,calc(var(--bcd-fs)*.5));letter-spacing:0;text-transform:none}
.bcd-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
`

/**
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 190
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function BadgeCountdown(props: EventCountdownProps) {
    const {
        startsAt = "2028-03-16T09:00",
        endsAt = "2028-03-17T18:00",
        timeZone = "UTC",
        labelBefore = "Starts in",
        labelDuring = "Happening now",
        labelAfter = "This event has ended",
        showDays = true,
        showHours = true,
        showMinutes = true,
        showSeconds = false,
        size = "large",
        align = "left",
        cardColor = "#FBEBD0",
        holeColor = "#FFF6E5",
        bandColor = "#E5482B",
        inkColor = "#16161A",
        mutedColor = "#5B5850",
        lineColor = "rgba(22,22,26,0.12)",
        highlightColor = "#FFD23F",
        headingFont,
        monoFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [now, setNow] = React.useState<number | null>(null) // null until mounted: server and first client paint match
    const widthRef = React.useRef<{ unit: Unit; digits: number }>({ unit: "days", digits: 2 })

    const units = UNIT_ORDER.filter((unit) => ({ days: showDays, hours: showHours, minutes: showMinutes, seconds: showSeconds })[unit])
    if (units.length === 0) units.push("days")
    const unitsKey = units.join(",")

    const start = parseInstant(startsAt, timeZone)
    const rawEnd = String(endsAt || "").trim() ? parseInstant(endsAt, timeZone) : start // no end -> a single moment
    const end = Number.isNaN(rawEnd) ? NaN : Math.max(rawEnd, start)

    // tick on the smallest shown unit, stop while the tab is hidden, stop for good once the event is over
    React.useEffect(() => {
        if (isStatic) return
        if (Number.isNaN(start) || Number.isNaN(end)) {
            setNow(Date.now())
            return
        }
        const step = UNIT_MS[units[units.length - 1]]
        let timer = 0
        const clear = () => {
            if (timer) window.clearTimeout(timer)
            timer = 0
        }
        const tick = () => {
            clear()
            if (document.visibilityState === "hidden") return
            const t = Date.now()
            setNow(t)
            if (t >= end) return
            const wait = t < start ? Math.min((start - t) % step + 1, start - t) : end - t
            timer = window.setTimeout(tick, Math.max(1, Math.min(wait, MAX_WAIT)))
        }
        tick()
        document.addEventListener("visibilitychange", tick)
        return () => {
            clear()
            document.removeEventListener("visibilitychange", tick)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, start, end, unitsKey])

    const fixed = isStatic || now === null
    let phase: Phase = "before"
    if (Number.isNaN(start) || Number.isNaN(end)) phase = "invalid"
    else if (!fixed) phase = (now as number) < start ? "before" : (now as number) < end ? "during" : "after"

    const remaining = phase === "before" && !fixed ? start - (now as number) : PLACEHOLDER_MS
    const parts = split(remaining, units)

    // the first shown unit keeps the width it had at its widest, so 100 -> 99 days never narrows the card
    const lead = units[0]
    if (widthRef.current.unit !== lead) widthRef.current = { unit: lead, digits: 2 }
    const leadDigits = Math.max(2, String(parts[lead]).length)
    if (!fixed && phase === "before" && leadDigits > widthRef.current.digits) widthRef.current.digits = leadDigits // the placeholder's 152 does not count
    const widthOf = (unit: Unit) => (unit === lead ? widthRef.current.digits : 2)

    const label = phase === "during" ? labelDuring : phase === "after" ? labelAfter : labelBefore
    const showDigits = phase === "before" || phase === "invalid"
    // screen readers get minutes at most: the live text changes once a minute, never every second
    const calm = units.filter((unit) => unit !== "seconds")
    const spokenUnits = calm.length > 0 ? calm : (["minutes"] as Unit[])
    const liveText = fixed || phase === "invalid" ? "" : phase === "before" ? `${label} ${spoken(remaining, spokenUnits)}` : label

    const rootVars = {
        ...style,
        "--bcd-just": align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        "--bcd-card": cardColor,
        "--bcd-hole-color": holeColor,
        "--bcd-band-color": bandColor,
        "--bcd-ink": inkColor,
        "--bcd-muted": mutedColor,
        "--bcd-line": lineColor,
        "--bcd-hi": highlightColor,
        "--bcd-heading": familyOf(headingFont, HEADING_STACK),
        "--bcd-mono": familyOf(monoFont, MONO_STACK),
    } as React.CSSProperties

    return (
        <div className="bcd" data-size={size} data-state={phase} style={rootVars}>
            {/* raw text: the server would escape the quotes in the CSS and the page would fail to hydrate */}
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="bcd-card">
                <span className="bcd-band" aria-hidden="true" />
                <span className="bcd-hole" aria-hidden="true" />
                <div className="bcd-body" data-ready={isStatic || now !== null} aria-hidden="true">
                    {showDigits ? <p className="bcd-label">{label}</p> : <p className="bcd-msg" data-hi={phase === "during"}>{label}</p>}
                    {showDigits && (
                        <div className="bcd-digits">
                            {units.map((unit) => (
                                <div className="bcd-cell" key={unit} data-unit={unit}>
                                    <span className="bcd-num" style={{ minWidth: `${widthOf(unit)}ch` }}>
                                        {phase === "invalid" ? "–".repeat(widthOf(unit)) : String(parts[unit]).padStart(widthOf(unit), "0")}
                                    </span>
                                    <span className="bcd-unit">{size === "compact" ? UNIT_SHORT[unit] : UNIT_LONG[unit]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bcd-sr" role="status" aria-live="polite" aria-atomic="true">
                    {liveText}
                </div>
            </div>
        </div>
    )
}

// Font controls cannot name a family in defaultValue: pick Archivo (800) / DM Mono (Medium) on the instance.
// Without a picked font the skin falls back to those families by name (HEADING_STACK, MONO_STACK).
addPropertyControls(BadgeCountdown, {
    startsAt: {
        type: ControlType.String,
        title: "Starts at",
        defaultValue: "2028-03-16T09:00",
        description: "Local time at the event: YYYY-MM-DDTHH:MM",
    },
    endsAt: {
        type: ControlType.String,
        title: "Ends at",
        defaultValue: "2028-03-17T18:00",
        description: "Leave empty for a single moment (no 'now' state)",
    },
    timeZone: {
        type: ControlType.String,
        title: "Time zone",
        defaultValue: "UTC",
        description: "IANA name, e.g. UTC, Europe/Amsterdam or Asia/Seoul",
    },
    labelBefore: { type: ControlType.String, title: "Label before", defaultValue: "Starts in" },
    labelDuring: { type: ControlType.String, title: "Label during", defaultValue: "Happening now" },
    labelAfter: { type: ControlType.String, title: "Label after", defaultValue: "This event has ended" },
    showDays: { type: ControlType.Boolean, title: "Show days", defaultValue: true },
    showHours: { type: ControlType.Boolean, title: "Show hours", defaultValue: true },
    showMinutes: { type: ControlType.Boolean, title: "Show minutes", defaultValue: true },
    showSeconds: { type: ControlType.Boolean, title: "Show seconds", defaultValue: false },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["compact", "large"],
        optionTitles: ["Compact", "Large"],
        displaySegmentedControl: true,
        defaultValue: "large",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },
    cardColor: { type: ControlType.Color, title: "Card color", defaultValue: "#FBEBD0" },
    holeColor: { type: ControlType.Color, title: "Hole color", defaultValue: "#FFF6E5" },
    bandColor: { type: ControlType.Color, title: "Band color", defaultValue: "#E5482B" },
    inkColor: { type: ControlType.Color, title: "Ink color", defaultValue: "#16161A" },
    mutedColor: { type: ControlType.Color, title: "Muted color", defaultValue: "#5B5850" },
    lineColor: { type: ControlType.Color, title: "Line color", defaultValue: "rgba(22,22,26,0.12)" },
    highlightColor: { type: ControlType.Color, title: "Highlight color", defaultValue: "#FFD23F" },
    headingFont: {
        type: ControlType.Font,
        title: "Heading font",
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
