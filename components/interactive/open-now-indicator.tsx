// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useState } from "react"

/**
 * OpenStatus
 * Live "Open now / Closed" indicator based on a weekly opening-hours schedule.
 *
 * - Computes the current day & time (optionally in a fixed timezone) and
 *   compares it against the schedule to show whether the business is open.
 * - Supports a lunch break (two time ranges per day) and overnight hours
 *   (close time earlier than open time, e.g. 18:00 -> 02:00).
 * - Shows the next change ("Closes at 17:00" / "Opens Mon at 09:00").
 * - All labels are editable, so it works in any language.
 *
 * Framer cannot do this natively because it requires runtime logic that reads
 * the current time on the visitor's device and re-evaluates it.
 */

const DAY_INDEX: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
}

type Day = {
    day: string
    closed: boolean
    from: string
    to: string
    from2: string
    to2: string
}

type Status = {
    open: boolean
    message: string
}

// "HH:MM" -> minutes since midnight, or null if empty/invalid
function toMinutes(t?: string): number | null {
    if (!t) return null
    const [h, m] = t.split(":").map((n) => parseInt(n, 10))
    if (Number.isNaN(h) || Number.isNaN(m)) return null
    return h * 60 + m
}

// minutes -> "HH:MM"
function fromMinutes(min: number): string {
    const v = ((min % 1440) + 1440) % 1440
    const h = Math.floor(v / 60)
    const m = v % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// All valid [open, close] ranges for a day (skips the lunch break if blank)
function dayRanges(item?: Day): [number, number][] {
    if (!item || item.closed) return []
    const ranges: [number, number][] = []
    const a = toMinutes(item.from)
    const b = toMinutes(item.to)
    if (a != null && b != null) ranges.push([a, b])
    const a2 = toMinutes(item.from2)
    const b2 = toMinutes(item.to2)
    if (a2 != null && b2 != null) ranges.push([a2, b2])
    return ranges
}

// Current weekday index (Mon=0) and minutes-since-midnight, in an optional timezone
function getNow(timeZone?: string): { dayIdx: number; nowMin: number } {
    try {
        const fmt = new Intl.DateTimeFormat("en-US", {
            timeZone: timeZone || undefined,
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })
        const parts = fmt.formatToParts(new Date())
        const get = (type: string) =>
            parts.find((p) => p.type === type)?.value ?? ""
        let h = parseInt(get("hour"), 10)
        if (h === 24 || Number.isNaN(h)) h = 0
        const m = parseInt(get("minute"), 10) || 0
        const wd = get("weekday")
        return { dayIdx: DAY_INDEX[wd] ?? 0, nowMin: h * 60 + m }
    } catch {
        const d = new Date()
        return {
            dayIdx: (d.getDay() + 6) % 7,
            nowMin: d.getHours() * 60 + d.getMinutes(),
        }
    }
}

function computeStatus(
    schedule: Day[],
    timeZone: string,
    labels: {
        closesLabel: string
        opensLabel: string
        opensDayLabel: string
    }
): Status {
    const { dayIdx, nowMin } = getNow(timeZone)

    // 1) Open right now? Check today's ranges.
    let closeAt: number | null = null
    for (const [a, b] of dayRanges(schedule[dayIdx])) {
        if (b > a) {
            if (nowMin >= a && nowMin < b) closeAt = b
        } else if (b < a) {
            // Overnight: open from `a` until `b` the next day
            if (nowMin >= a) closeAt = b
        }
        if (closeAt != null) break
    }

    // 2) Still inside yesterday's overnight range?
    if (closeAt == null) {
        const yIdx = (dayIdx + 6) % 7
        for (const [a, b] of dayRanges(schedule[yIdx])) {
            if (b < a && nowMin < b) {
                closeAt = b
                break
            }
        }
    }

    if (closeAt != null) {
        return {
            open: true,
            message: labels.closesLabel.replace("{time}", fromMinutes(closeAt)),
        }
    }

    // 3) Closed - find the next opening within the next 7 days.
    for (let d = 0; d < 8; d++) {
        const idx = (dayIdx + d) % 7
        const item = schedule[idx]
        const ranges = dayRanges(item).sort((x, y) => x[0] - y[0])
        for (const [a] of ranges) {
            if (d === 0 && a <= nowMin) continue // already passed today
            const time = fromMinutes(a)
            const message =
                d === 0
                    ? labels.opensLabel.replace("{time}", time)
                    : labels.opensDayLabel
                          .replace("{day}", item?.day ?? "")
                          .replace("{time}", time)
            return { open: false, message }
        }
    }

    return { open: false, message: "" }
}

export default function OpenStatus(props) {
    const {
        schedule,
        timeZone,
        showDot,
        openColor,
        closedColor,
        openLabel,
        closedLabel,
        showNextChange,
        closesLabel,
        opensLabel,
        opensDayLabel,
        font,
        gap,
        style,
    } = props

    // null until mounted -> identical first render on server & client (no hydration mismatch)
    const [status, setStatus] = useState<Status | null>(null)

    useEffect(() => {
        const update = () =>
            setStatus(
                computeStatus(schedule, timeZone, {
                    closesLabel,
                    opensLabel,
                    opensDayLabel,
                })
            )
        update()
        const id = setInterval(update, 30000) // re-check every 30s
        return () => clearInterval(id)
    }, [schedule, timeZone, closesLabel, opensLabel, opensDayLabel])

    // Safe default before first evaluation: show "open" styling.
    const open = status ? status.open : true
    const color = open ? openColor : closedColor
    const message = status && showNextChange ? status.message : ""

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap,
                ...font,
                whiteSpace: "nowrap",
                ...style,
            }}
        >
            {showDot && (
                <span
                    style={{
                        width: "0.6em",
                        height: "0.6em",
                        borderRadius: "50%",
                        background: color,
                        flexShrink: 0,
                    }}
                />
            )}
            <span style={{ color, fontWeight: 600 }}>
                {open ? openLabel : closedLabel}
            </span>
            {message && <span style={{ opacity: 0.65 }}>· {message}</span>}
        </div>
    )
}

OpenStatus.defaultProps = {
    timeZone: "",
    showDot: true,
    openColor: "#16A34A",
    closedColor: "#DC2626",
    openLabel: "Open now",
    closedLabel: "Closed",
    showNextChange: true,
    closesLabel: "Closes at {time}",
    opensLabel: "Opens at {time}",
    opensDayLabel: "Opens {day} at {time}",
    gap: 8,
    font: { fontSize: 16, lineHeight: 1.4, variant: "Regular" },
    schedule: [
        {
            day: "Mon",
            closed: false,
            from: "09:00",
            to: "17:00",
            from2: "",
            to2: "",
        },
        {
            day: "Tue",
            closed: false,
            from: "09:00",
            to: "17:00",
            from2: "",
            to2: "",
        },
        {
            day: "Wed",
            closed: false,
            from: "09:00",
            to: "17:00",
            from2: "",
            to2: "",
        },
        {
            day: "Thu",
            closed: false,
            from: "09:00",
            to: "17:00",
            from2: "",
            to2: "",
        },
        {
            day: "Fri",
            closed: false,
            from: "09:00",
            to: "17:00",
            from2: "",
            to2: "",
        },
        {
            day: "Sat",
            closed: false,
            from: "10:00",
            to: "14:00",
            from2: "",
            to2: "",
        },
        { day: "Sun", closed: true, from: "", to: "", from2: "", to2: "" },
    ],
}

const dayControl = {
    type: ControlType.Object,
    controls: {
        day: { type: ControlType.String, title: "Day", defaultValue: "Day" },
        closed: {
            type: ControlType.Boolean,
            title: "Status",
            enabledTitle: "Closed",
            disabledTitle: "Open",
            defaultValue: false,
        },
        from: {
            type: ControlType.String,
            title: "From",
            placeholder: "09:00",
            defaultValue: "09:00",
        },
        to: {
            type: ControlType.String,
            title: "To",
            placeholder: "17:00",
            defaultValue: "17:00",
        },
        from2: {
            type: ControlType.String,
            title: "From 2",
            placeholder: "(optional)",
            defaultValue: "",
        },
        to2: {
            type: ControlType.String,
            title: "To 2",
            placeholder: "(optional)",
            defaultValue: "",
        },
    },
}

addPropertyControls(OpenStatus, {
    schedule: {
        type: ControlType.Array,
        title: "Opening hours",
        maxCount: 7,
        control: dayControl,
        description:
            "Seven days (Mon-Sun). For a lunch break, fill in the second window *From 2 / To 2*. For overnight hours, set *To* earlier than *From* (e.g. 18:00 -> 02:00).",
    },
    timeZone: {
        type: ControlType.String,
        title: "Time zone",
        placeholder: "Europe/Prague",
        description:
            "IANA time zone of the business. Leave empty to use the visitor's device time.",
    },
    openLabel: { type: ControlType.String, title: "Open text" },
    closedLabel: { type: ControlType.String, title: "Closed text" },
    showNextChange: {
        type: ControlType.Boolean,
        title: "Next change",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    closesLabel: {
        type: ControlType.String,
        title: "Closes",
        description: "Use `{time}` for the closing time.",
        hidden: (p) => p.showNextChange === false,
    },
    opensLabel: {
        type: ControlType.String,
        title: "Opens today",
        description: "Use `{time}`.",
        hidden: (p) => p.showNextChange === false,
    },
    opensDayLabel: {
        type: ControlType.String,
        title: "Opens another day",
        description: "Use `{day}` and `{time}`.",
        hidden: (p) => p.showNextChange === false,
    },
    showDot: {
        type: ControlType.Boolean,
        title: "Dot",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    openColor: { type: ControlType.Color, title: "Open color" },
    closedColor: { type: ControlType.Color, title: "Closed color" },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 40,
        unit: "px",
        displayStepper: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        displayTextAlignment: false,
    },
})
