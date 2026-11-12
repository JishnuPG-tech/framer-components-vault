// SmartContactConfidenceHeaderStrip.tsx
// A slim, configurable header band that shows live business status, opening
// hours, contact methods, location, response-time messaging and quick links.
// Dependency-free. Paste into a new Framer code component file.

import * as React from "react"
// @ts-ignore — RenderTarget / useIsStaticRenderer aren't in framer's published types
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const { useState, useEffect, useMemo, useRef, useCallback, useId } = React

// Font is not present on ControlType's published type; alias + cast avoids the
// "fontFamily" type error while still giving a real Framer typography control.
const FontControl = (ControlType as any).Font

/* ============================================================================
 * TYPES
 * ========================================================================== */

type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"

interface DaySchedule {
    closed: boolean
    open: string
    close: string
    split: boolean
    open2: string
    close2: string
    label: string
}

interface Period {
    open: number // minutes since midnight
    close: number // minutes since midnight (may be <= open for overnight)
}

interface ExceptionItem {
    date: string // YYYY-MM-DD
    label: string
    closed: boolean
    open: string
    close: string
    split: boolean
    open2: string
    close2: string
    appointment: boolean
    message: string
    priority: number
}

type StatusKind =
    | "open"
    | "closingSoon"
    | "closed"
    | "opensSoon"
    | "appointment"
    | "unavailable"
    | "custom"

interface StatusResult {
    kind: StatusKind
    valid: boolean
    // minutes until the next boundary (close if open, open if closed); null if unknown
    minutesToChange: number | null
    // formatted next-change clock time, e.g. "18:00"
    changeTime: string | null
    // "today" | "tomorrow" | weekday name for the change
    changeDayLabel: string | null
    // convenience label used to compose the badge sentence
    todayHoursText: string | null
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
]
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/* ============================================================================
 * TIME UTILITIES
 * ========================================================================== */

// Parse "HH:MM" (or "H:MM") into minutes-since-midnight. Returns null when the
// value is missing, malformed, or out of range so callers can treat the day as
// closed rather than crash.
function parseTimeValue(value: string | undefined | null): number | null {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    const m = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
    if (!m) return null
    const h = parseInt(m[1], 10)
    const min = parseInt(m[2], 10)
    if (!Number.isFinite(h) || !Number.isFinite(min)) return null
    if (h < 0 || h > 23 || min < 0 || min > 59) return null
    return h * 60 + min
}

function formatMinutes(total: number, use24h: boolean): string {
    const norm = ((total % 1440) + 1440) % 1440
    const h = Math.floor(norm / 60)
    const m = norm % 60
    const mm = m < 10 ? `0${m}` : `${m}`
    if (use24h) {
        const hh = h < 10 ? `0${h}` : `${h}`
        return `${hh}:${mm}`
    }
    const period = h >= 12 ? "PM" : "AM"
    let h12 = h % 12
    if (h12 === 0) h12 = 12
    return `${h12}:${mm} ${period}`
}

interface ZonedNow {
    dayIndex: number // 0 = Sunday .. 6 = Saturday
    minutes: number // minutes since midnight
    dateStr: string // YYYY-MM-DD in the resolved zone
    valid: boolean
}

// Read "now" inside an IANA time zone using Intl only. Invalid zones throw and
// are reported as invalid so the caller can fall back to visitor-local time.
function getTimeInZone(zone: string, base?: Date): ZonedNow {
    const now = base || new Date()
    try {
        const fmt = new Intl.DateTimeFormat("en-US", {
            timeZone: zone,
            weekday: "short",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })
        const parts = fmt.formatToParts(now)
        const map: Record<string, string> = {}
        for (const p of parts) map[p.type] = p.value
        const weekdayIndex = DAY_NAMES_SHORT.indexOf(map.weekday)
        let hour = parseInt(map.hour, 10)
        if (hour === 24) hour = 0 // some engines emit "24" for midnight
        const minute = parseInt(map.minute, 10)
        const dateStr = `${map.year}-${map.month}-${map.day}`
        if (
            weekdayIndex < 0 ||
            !Number.isFinite(hour) ||
            !Number.isFinite(minute)
        ) {
            throw new Error("bad parts")
        }
        return {
            dayIndex: weekdayIndex,
            minutes: hour * 60 + minute,
            dateStr,
            valid: true,
        }
    } catch {
        return { dayIndex: 0, minutes: 0, dateStr: "", valid: false }
    }
}

function getVisitorNow(base?: Date): ZonedNow {
    const now = base || new Date()
    const y = now.getFullYear()
    const mo = `${now.getMonth() + 1}`.padStart(2, "0")
    const d = `${now.getDate()}`.padStart(2, "0")
    return {
        dayIndex: now.getDay(),
        minutes: now.getHours() * 60 + now.getMinutes(),
        dateStr: `${y}-${mo}-${d}`,
        valid: true,
    }
}

function getFixedOffsetNow(offsetHours: number, base?: Date): ZonedNow {
    const now = base || new Date()
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
    const shifted = new Date(utcMs + offsetHours * 3600000)
    const y = shifted.getFullYear()
    const mo = `${shifted.getMonth() + 1}`.padStart(2, "0")
    const d = `${shifted.getDate()}`.padStart(2, "0")
    return {
        dayIndex: shifted.getDay(),
        minutes: shifted.getHours() * 60 + shifted.getMinutes(),
        dateStr: `${y}-${mo}-${d}`,
        valid: true,
    }
}

/* ============================================================================
 * SCHEDULE ENGINE
 * ========================================================================== */

// Turn a day's raw config into 0–2 validated periods. A period whose close is
// <= open is treated as overnight (close belongs to the next calendar day).
function periodsForDay(day: DaySchedule | undefined): Period[] {
    if (!day || day.closed) return []
    const out: Period[] = []
    const o1 = parseTimeValue(day.open)
    const c1 = parseTimeValue(day.close)
    // Equal open/close is treated as "no period" rather than a 24h day.
    if (o1 !== null && c1 !== null && o1 !== c1)
        out.push({ open: o1, close: c1 })
    if (day.split) {
        const o2 = parseTimeValue(day.open2)
        const c2 = parseTimeValue(day.close2)
        if (o2 !== null && c2 !== null && o2 !== c2)
            out.push({ open: o2, close: c2 })
    }
    return out
}

// Build the effective weekly schedule (7 entries, index 0 = Sunday) after
// applying any exception that matches a given date. Exceptions with higher
// priority win when several share a date.
function buildEffectiveDay(
    weekly: Record<DayKey, DaySchedule>,
    exceptions: ExceptionItem[],
    dayIndex: number,
    dateStr: string
): {
    periods: Period[]
    appointment: boolean
    forcedClosed: boolean
    exceptionMessage: string | null
} {
    const matches = exceptions.filter(
        (e) => e && typeof e.date === "string" && e.date.trim() === dateStr
    )
    if (matches.length > 0) {
        matches.sort((a, b) => (b.priority || 0) - (a.priority || 0))
        const ex = matches[0]
        if (ex.appointment) {
            return {
                periods: [],
                appointment: true,
                forcedClosed: false,
                exceptionMessage: ex.message || ex.label || null,
            }
        }
        if (ex.closed) {
            return {
                periods: [],
                appointment: false,
                forcedClosed: true,
                exceptionMessage: ex.message || ex.label || null,
            }
        }
        const pseudo: DaySchedule = {
            closed: false,
            open: ex.open,
            close: ex.close,
            split: ex.split,
            open2: ex.open2,
            close2: ex.close2,
            label: ex.label,
        }
        return {
            periods: periodsForDay(pseudo),
            appointment: false,
            forcedClosed: false,
            exceptionMessage: ex.message || null,
        }
    }
    const key = DAY_KEYS[dayIndex]
    return {
        periods: periodsForDay(weekly[key]),
        appointment: false,
        forcedClosed: false,
        exceptionMessage: null,
    }
}

interface StatusConfig {
    closingSoonThreshold: number // minutes
    opensSoonThreshold: number // minutes
    use24h: boolean
}

// Core status calculation. Given the current zoned time, the weekly schedule
// and exceptions, decide whether the business is open and when it next flips.
function calculateBusinessStatus(
    now: ZonedNow,
    weekly: Record<DayKey, DaySchedule>,
    exceptions: ExceptionItem[],
    cfg: StatusConfig
): StatusResult {
    if (!now.valid) {
        return {
            kind: "custom",
            valid: false,
            minutesToChange: null,
            changeTime: null,
            changeDayLabel: null,
            todayHoursText: null,
        }
    }

    const { dayIndex, minutes, dateStr } = now

    // Date strings for today and yesterday (to catch overnight spillover).
    const yDate = shiftDate(dateStr, -1)
    const yIndex = (dayIndex + 6) % 7

    const today = buildEffectiveDay(weekly, exceptions, dayIndex, dateStr)
    const yesterday = buildEffectiveDay(weekly, exceptions, yIndex, yDate)

    // Today's opening hours as text — always available for display, regardless
    // of whether the business is currently open or closed.
    const todayText = describeToday(today.periods, cfg.use24h)

    // Appointment-only date overrides everything else for today.
    if (today.appointment) {
        return {
            kind: "appointment",
            valid: true,
            minutesToChange: null,
            changeTime: null,
            changeDayLabel: null,
            todayHoursText: today.exceptionMessage,
        }
    }

    // 1) Is a period from *today* active right now?
    for (const p of today.periods) {
        if (p.close > p.open) {
            // Same-day period.
            if (minutes >= p.open && minutes < p.close) {
                return openResult(p.close, minutes, cfg, "today", todayText)
            }
        } else {
            // Overnight period that starts today (e.g. 18:00–02:00).
            if (minutes >= p.open) {
                return openResult(
                    p.close + 1440,
                    minutes,
                    cfg,
                    "tomorrow",
                    todayText
                )
            }
        }
    }

    // 2) Is an overnight period from *yesterday* still active (early morning)?
    for (const p of yesterday.periods) {
        if (p.close <= p.open) {
            // Spillover: yesterday's close time is on today's clock.
            if (minutes < p.close) {
                return openResult(p.close, minutes, cfg, "today", todayText)
            }
        }
    }

    // 3) Closed now — find the next opening within the coming 8 days.
    const nextOpen = findNextScheduleChange(now, weekly, exceptions)
    if (!nextOpen) {
        return {
            kind: "closed",
            valid: true,
            minutesToChange: null,
            changeTime: null,
            changeDayLabel: null,
            todayHoursText: todayText,
        }
    }

    const minutesToOpen = nextOpen.absoluteMinutes - minutes
    const kind: StatusKind =
        minutesToOpen <= cfg.opensSoonThreshold && minutesToOpen >= 0
            ? "opensSoon"
            : "closed"

    return {
        kind,
        valid: true,
        minutesToChange: minutesToOpen,
        changeTime: formatMinutes(nextOpen.openMinutes, cfg.use24h),
        changeDayLabel: nextOpen.dayLabel,
        todayHoursText: todayText,
    }
}

function openResult(
    closeAbsolute: number,
    nowMinutes: number,
    cfg: StatusConfig,
    dayLabel: "today" | "tomorrow",
    todayText: string | null
): StatusResult {
    const minutesToClose = closeAbsolute - nowMinutes
    const kind: StatusKind =
        minutesToClose <= cfg.closingSoonThreshold ? "closingSoon" : "open"
    return {
        kind,
        valid: true,
        minutesToChange: minutesToClose,
        changeTime: formatMinutes(closeAbsolute, cfg.use24h),
        changeDayLabel: dayLabel,
        todayHoursText: todayText,
    }
}

// Walk forward from "now" up to 8 days and return the first opening boundary
// strictly in the future. Handles split days and days that are fully closed.
function findNextScheduleChange(
    now: ZonedNow,
    weekly: Record<DayKey, DaySchedule>,
    exceptions: ExceptionItem[]
): { absoluteMinutes: number; openMinutes: number; dayLabel: string } | null {
    for (let offset = 0; offset <= 8; offset++) {
        const idx = (now.dayIndex + offset) % 7
        const date = shiftDate(now.dateStr, offset)
        const eff = buildEffectiveDay(weekly, exceptions, idx, date)
        if (eff.forcedClosed || eff.appointment) continue
        const opens = eff.periods.map((p) => p.open).sort((a, b) => a - b)
        for (const open of opens) {
            const absolute = offset * 1440 + open
            if (absolute > now.minutes) {
                return {
                    absoluteMinutes: absolute,
                    openMinutes: open,
                    dayLabel: dayLabelForOffset(offset, idx),
                }
            }
        }
    }
    return null
}

function dayLabelForOffset(offset: number, dayIndex: number): string {
    if (offset === 0) return "today"
    if (offset === 1) return "tomorrow"
    return DAY_NAMES[dayIndex]
}

// Add/subtract whole days from a YYYY-MM-DD string using UTC math to avoid DST
// drift in the arithmetic itself.
function shiftDate(dateStr: string, deltaDays: number): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
    if (!m) return dateStr
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
    d.setUTCDate(d.getUTCDate() + deltaDays)
    const y = d.getUTCFullYear()
    const mo = `${d.getUTCMonth() + 1}`.padStart(2, "0")
    const day = `${d.getUTCDate()}`.padStart(2, "0")
    return `${y}-${mo}-${day}`
}

function describeToday(periods: Period[], use24h: boolean): string | null {
    if (!periods.length) return null
    return periods
        .map(
            (p) =>
                `${formatMinutes(p.open, use24h)}–${formatMinutes(p.close, use24h)}`
        )
        .join(", ")
}

function humanizeMinutes(mins: number): string {
    if (mins < 60) return `${mins} min`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (m === 0) return `${h} hr`
    return `${h} hr ${m} min`
}

/* ============================================================================
 * HOOKS
 * ========================================================================== */

// Recompute status on an interval (client only). On the Framer canvas / static
// export we compute exactly once so there are no timers and no hydration drift.
function useBusinessStatus(
    tzMode: string,
    tzIana: string,
    tzOffset: number,
    weekly: Record<DayKey, DaySchedule>,
    exceptions: ExceptionItem[],
    cfg: StatusConfig,
    intervalSeconds: number,
    isStatic: boolean
): StatusResult {
    const compute = useCallback((): StatusResult => {
        let now: ZonedNow
        if (tzMode === "business") {
            now = getTimeInZone(tzIana)
            if (!now.valid) now = getVisitorNow() // graceful fallback
        } else if (tzMode === "offset") {
            now = getFixedOffsetNow(tzOffset)
        } else {
            now = getVisitorNow()
        }
        return calculateBusinessStatus(now, weekly, exceptions, cfg)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tzMode, tzIana, tzOffset, weekly, exceptions, cfg])

    const [status, setStatus] = useState<StatusResult>(() => compute())

    useEffect(() => {
        if (isStatic) {
            setStatus(compute())
            return
        }
        setStatus(compute())
        const ms = Math.max(5, intervalSeconds) * 1000
        const id = window.setInterval(() => setStatus(compute()), ms)
        return () => window.clearInterval(id)
    }, [compute, intervalSeconds, isStatic])

    return status
}

// Dismissal persistence across page view / session / N days, guarding every
// storage access so SSR and the canvas never throw.
function useDismissalState(opts: {
    dismissible: boolean
    remember: string // "none" | "session" | "days"
    storageKey: string
    version: string
    days: number
    resetInPreview: boolean
    isStatic: boolean
}) {
    const {
        dismissible,
        remember,
        storageKey,
        version,
        days,
        resetInPreview,
        isStatic,
    } = opts
    const fullKey = `scchs:${storageKey}:${version}`

    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (!dismissible || isStatic || resetInPreview) return
        try {
            if (
                remember === "session" &&
                typeof sessionStorage !== "undefined"
            ) {
                if (sessionStorage.getItem(fullKey) === "1") setDismissed(true)
            } else if (
                remember === "days" &&
                typeof localStorage !== "undefined"
            ) {
                const raw = localStorage.getItem(fullKey)
                if (raw) {
                    const until = parseInt(raw, 10)
                    if (Number.isFinite(until) && Date.now() < until)
                        setDismissed(true)
                    else localStorage.removeItem(fullKey)
                }
            }
        } catch {
            /* storage blocked (private mode / sandbox) — stay visible */
        }
    }, [dismissible, remember, fullKey, resetInPreview, isStatic])

    const dismiss = useCallback(() => {
        setDismissed(true)
        try {
            if (
                remember === "session" &&
                typeof sessionStorage !== "undefined"
            ) {
                sessionStorage.setItem(fullKey, "1")
            } else if (
                remember === "days" &&
                typeof localStorage !== "undefined"
            ) {
                const until = Date.now() + Math.max(0, days) * 86400000
                localStorage.setItem(fullKey, String(until))
            }
        } catch {
            /* ignore write failures */
        }
    }, [remember, fullKey, days])

    return { dismissed, dismiss }
}

// Container-width-aware collapse. Uses ResizeObserver against the strip itself
// so it reacts to the Framer frame, not just the viewport.
function useResponsiveCollapse(breakpoint: number) {
    const ref = useRef<HTMLDivElement | null>(null)
    const [narrow, setNarrow] = useState(false)

    // Runs in the Framer canvas AND on the published site (guarded only by the
    // existence of ResizeObserver, not by the static-render flag) so the editor
    // preview collapses at the same width the live site does — WYSIWYG.
    // A width of 0 (element momentarily unmeasured / display:none during layout)
    // is ignored so the strip never false-collapses to the mobile bar.
    useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = (w: number) => {
            if (w > 0) setNarrow(w < breakpoint)
        }
        apply(el.getBoundingClientRect().width) // settled initial read
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) apply(entry.contentRect.width)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [breakpoint])

    return { ref, narrow }
}

function useOutsideClick(
    ref: React.RefObject<HTMLElement>,
    onOutside: () => void,
    active: boolean
) {
    useEffect(() => {
        if (!active) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                onOutside()
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [ref, onOutside, active])
}

function useEscapeKey(onEscape: () => void, active: boolean) {
    useEffect(() => {
        if (!active) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onEscape()
        }
        document.addEventListener("keydown", handler)
        return () => document.removeEventListener("keydown", handler)
    }, [onEscape, active])
}

// Flips to true only after mount on the client. Used to gate JS-driven ambient
// animation (the status pulse, the live clock) so the first client render still
// matches the static/SSR output — no hydration mismatch, then motion kicks in.
function useMounted(isStatic: boolean): boolean {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        if (!isStatic) setMounted(true)
    }, [isStatic])
    return mounted
}

// Optional live clock in the resolved time zone. Updates every 15s (enough for
// HH:MM). Off / computed-once on the canvas and static export.
function useLiveClock(
    active: boolean,
    tzMode: string,
    tzIana: string,
    tzOffset: number,
    use24h: boolean,
    isStatic: boolean
): string | null {
    const read = useCallback((): string => {
        let now: ZonedNow
        if (tzMode === "business") {
            now = getTimeInZone(tzIana)
            if (!now.valid) now = getVisitorNow()
        } else if (tzMode === "offset") {
            now = getFixedOffsetNow(tzOffset)
        } else {
            now = getVisitorNow()
        }
        return formatMinutes(now.minutes, use24h)
    }, [tzMode, tzIana, tzOffset, use24h])

    // Starts null so the server and first client render agree; the real time is
    // filled in after mount, avoiding a hydration mismatch on the clock text.
    const [time, setTime] = useState<string | null>(null)

    useEffect(() => {
        if (!active || isStatic) return
        setTime(read())
        const id = window.setInterval(() => setTime(read()), 15000)
        return () => window.clearInterval(id)
    }, [active, read, isStatic])

    return active ? time : null
}

// Premium announcement-bar behaviour: hide the strip while scrolling down,
// reveal it on scroll up. Only for sticky / fixed placements. Passive listener,
// removed on unmount; disabled on the canvas and static export.
function useScrollHide(active: boolean, isStatic: boolean): boolean {
    const [hidden, setHidden] = useState(false)
    useEffect(() => {
        if (!active || isStatic || typeof window === "undefined") return
        let last = window.scrollY
        let ticking = false
        const onScroll = () => {
            if (ticking) return
            ticking = true
            window.requestAnimationFrame(() => {
                const y = window.scrollY
                if (y > last && y > 90) setHidden(true)
                else if (y < last) setHidden(false)
                last = y
                ticking = false
            })
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [active, isStatic])
    return hidden
}

/* ============================================================================
 * ICONS
 * ========================================================================== */

type IconName =
    | "phone"
    | "email"
    | "chat"
    | "whatsapp"
    | "message"
    | "clock"
    | "location"
    | "directions"
    | "calendar"
    | "booking"
    | "faq"
    | "tracking"
    | "support"
    | "quote"
    | "external"
    | "chevron"
    | "menu"
    | "close"
    | "open"
    | "closed"
    | "warning"
    | "check"
    | "info"
    | "copy"

const ICON_PATHS: Record<IconName, React.ReactNode> = {
    phone: (
        <path d="M21 16.5v2.6a2 2 0 01-2.2 2 19.5 19.5 0 01-8.5-3A19.2 19.2 0 014.9 14 19.5 19.5 0 011.9 5.2 2 2 0 013.9 3h2.6a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.4 2.1L7.6 10.8a15 15 0 006 6l1.3-1.1a2 2 0 012.1-.4c.9.3 1.8.5 2.7.6a2 2 0 011.7 2z" />
    ),
    email: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M4 7l8 6 8-6" />
        </>
    ),
    chat: (
        <path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 4V5a1 1 0 011-1z" />
    ),
    whatsapp: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 9.5c0 4 2 6 6 6.5" />
            <path d="M8.5 9.5c0-1 .8-1.5 1.5-1l.8 1.4-.9 1c.5.9 1.2 1.6 2.1 2.1l1-.9 1.4.8c.5.7 0 1.5-1 1.5" />
        </>
    ),
    message: (
        <path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 4V5a1 1 0 011-1z" />
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    location: (
        <>
            <path d="M12 21s-7-6-7-11a7 7 0 1114 0c0 5-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
        </>
    ),
    directions: (
        <>
            <path d="M12 2l9 9-9 9-9-9 9-9z" />
            <path d="M10 13v-2a2 2 0 012-2h3" />
            <path d="M13 6l2 3-2 3" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M3 9h18M8 2v4M16 2v4" />
        </>
    ),
    booking: (
        <>
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M3 9h18M8 2v4M16 2v4" />
            <path d="M9 15l2 2 4-4" />
        </>
    ),
    faq: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 013.9-2c1.2.9 1.1 2.3 0 3-.7.5-1.4.9-1.4 2" />
            <circle cx="12" cy="17" r="0.6" />
        </>
    ),
    tracking: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 12l4-2M12 12v4" />
            <circle cx="12" cy="12" r="1" />
        </>
    ),
    support: (
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </>
    ),
    quote: (
        <>
            <path d="M4 5h16v11H8l-4 4V5z" />
            <path d="M8 10h8M8 13h5" />
        </>
    ),
    external: (
        <>
            <path d="M14 4h6v6" />
            <path d="M20 4l-9 9" />
            <path d="M18 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h6" />
        </>
    ),
    chevron: <path d="M6 9l6 6 6-6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    open: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
        </>
    ),
    closed: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 8l8 8M16 8l-8 8" />
        </>
    ),
    warning: (
        <>
            <path d="M12 3l10 18H2L12 3z" />
            <path d="M12 10v4M12 17v.5" />
        </>
    ),
    check: <path d="M5 12l4 4 10-11" />,
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8v.5" />
        </>
    ),
    copy: (
        <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
        </>
    ),
}

function BuiltInIcon(props: {
    name: IconName
    size?: number
    strokeWidth?: number
    filled?: boolean
    color?: string
    style?: React.CSSProperties
}) {
    const {
        name,
        size = 16,
        strokeWidth = 1.7,
        filled = false,
        color = "currentColor",
        style,
    } = props
    // Every built-in icon is a uniform-weight outline for a cohesive, premium
    // icon set (no odd filled glyph among strokes).
    const useFill = filled
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={useFill ? color : "none"}
            stroke={useFill ? "none" : color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            style={{ flexShrink: 0, display: "block", ...style }}
        >
            {ICON_PATHS[name]}
        </svg>
    )
}

// Renders either a built-in icon, a custom uploaded image, or nothing.
function ResolvedIcon(props: {
    mode: string // "builtin" | "custom" | "none"
    builtin: IconName
    custom?: string
    size?: number
    color?: string
}) {
    const { mode, builtin, custom, size = 16, color } = props
    if (mode === "none") return null
    if (mode === "custom" && custom) {
        return (
            <img
                src={custom}
                alt=""
                aria-hidden="true"
                width={size}
                height={size}
                style={{
                    objectFit: "contain",
                    display: "block",
                    flexShrink: 0,
                }}
            />
        )
    }
    return <BuiltInIcon name={builtin} size={size} color={color} />
}

/* ============================================================================
 * THEME
 * ========================================================================== */

interface Theme {
    bg: string
    text: string
    muted: string
    border: string
    openColor: string
    closedColor: string
    warnColor: string
    linkColor: string
    ctaBg: string
    ctaText: string
    drawerBg: string
    shadow: string
}

const THEMES: Record<string, Theme> = {
    light: {
        bg: "#ffffff",
        text: "#111418",
        muted: "#6b7280",
        border: "#e5e7eb",
        openColor: "#12805c",
        closedColor: "#b42318",
        warnColor: "#b45309",
        linkColor: "#111418",
        ctaBg: "#111418",
        ctaText: "#ffffff",
        drawerBg: "#ffffff",
        shadow: "0 1px 2px rgba(16,24,40,0.08)",
    },
    dark: {
        bg: "#0e1116",
        text: "#f4f6f8",
        muted: "#9aa4b2",
        border: "#232a33",
        openColor: "#34d399",
        closedColor: "#f87171",
        warnColor: "#fbbf24",
        linkColor: "#f4f6f8",
        ctaBg: "#f4f6f8",
        ctaText: "#0e1116",
        drawerBg: "#12161c",
        shadow: "0 1px 2px rgba(0,0,0,0.4)",
    },
    neutral: {
        bg: "#f7f7f5",
        text: "#2b2b2b",
        muted: "#7a7a72",
        border: "#e4e2dc",
        openColor: "#3f7d5c",
        closedColor: "#a3564b",
        warnColor: "#9a6b30",
        linkColor: "#2b2b2b",
        ctaBg: "#2b2b2b",
        ctaText: "#f7f7f5",
        drawerBg: "#ffffff",
        shadow: "0 1px 2px rgba(0,0,0,0.06)",
    },
    brand: {
        bg: "#111827",
        text: "#ffffff",
        muted: "#c7cbd4",
        border: "#2a3550",
        openColor: "#4ade80",
        closedColor: "#fca5a5",
        warnColor: "#fcd34d",
        linkColor: "#ffffff",
        ctaBg: "#6366f1",
        ctaText: "#ffffff",
        drawerBg: "#161f33",
        shadow: "0 2px 6px rgba(0,0,0,0.35)",
    },
    contrast: {
        bg: "#000000",
        text: "#ffffff",
        muted: "#e5e5e5",
        border: "#ffffff",
        openColor: "#00e676",
        closedColor: "#ff5252",
        warnColor: "#ffd600",
        linkColor: "#ffffff",
        ctaBg: "#ffffff",
        ctaText: "#000000",
        drawerBg: "#000000",
        shadow: "none",
    },
    borderless: {
        bg: "transparent",
        text: "#111418",
        muted: "#6b7280",
        border: "transparent",
        openColor: "#12805c",
        closedColor: "#b42318",
        warnColor: "#b45309",
        linkColor: "#111418",
        ctaBg: "#111418",
        ctaText: "#ffffff",
        drawerBg: "#ffffff",
        shadow: "none",
    },
    glass: {
        bg: "rgba(255,255,255,0.6)",
        text: "#111418",
        muted: "#4b5563",
        border: "rgba(255,255,255,0.4)",
        openColor: "#0f766e",
        closedColor: "#b42318",
        warnColor: "#b45309",
        linkColor: "#111418",
        ctaBg: "#111418",
        ctaText: "#ffffff",
        drawerBg: "rgba(255,255,255,0.85)",
        shadow: "0 4px 24px rgba(16,24,40,0.12)",
    },
    professional: {
        bg: "#0f2540",
        text: "#eef3f9",
        muted: "#a9bcd2",
        border: "#1e3a5c",
        openColor: "#4cc38a",
        closedColor: "#f2a3a3",
        warnColor: "#f5c86b",
        linkColor: "#eef3f9",
        ctaBg: "#2f80ed",
        ctaText: "#ffffff",
        drawerBg: "#12304f",
        shadow: "0 2px 8px rgba(4,16,32,0.4)",
    },
    warm: {
        bg: "#fbf3e9",
        text: "#3a2a1a",
        muted: "#8a6f55",
        border: "#ecdcc7",
        openColor: "#4f8a3c",
        closedColor: "#b5502f",
        warnColor: "#b07a1f",
        linkColor: "#3a2a1a",
        ctaBg: "#c2632c",
        ctaText: "#ffffff",
        drawerBg: "#fffaf3",
        shadow: "0 1px 3px rgba(80,50,20,0.12)",
    },
}

function resolveTheme(props: Props): Theme {
    if (props.themePreset === "custom") {
        return {
            bg: props.bgPrimary,
            text: props.customText,
            muted: props.customMuted,
            border: props.borderColor,
            openColor: props.openColor,
            closedColor: props.closedColor,
            warnColor: props.warnColor,
            linkColor: props.customText,
            ctaBg: props.ctaBg,
            ctaText: props.ctaText,
            drawerBg: props.drawerBg,
            shadow: props.shadowEnabled ? props.customShadow : "none",
        }
    }
    const base = THEMES[props.themePreset] || THEMES.light
    // Status colors always overridable per spec.
    return {
        ...base,
        openColor: props.openColor || base.openColor,
        closedColor: props.closedColor || base.closedColor,
        warnColor: props.warnColor || base.warnColor,
    }
}

/* ============================================================================
 * PROPS INTERFACE
 * ========================================================================== */

interface Props {
    // Layout
    layout: string

    // Status
    showStatus: boolean
    statusMode: string
    openLabel: string
    closedLabel: string
    closingSoonLabel: string
    opensSoonLabel: string
    appointmentLabel: string
    unavailableLabel: string
    customStatusText: string
    showNextChange: boolean
    showOpeningTime: boolean
    showClosingTime: boolean
    closingSoonThreshold: number
    opensSoonThreshold: number
    statusBadgeStyle: string
    statusIndicatorStyle: string
    openColor: string
    closedColor: string
    warnColor: string

    // Business hours
    weekly: Record<DayKey, DaySchedule>
    use24h: boolean
    firstDay: string
    showTodayHours: boolean
    showWeekly: boolean
    hideClosedDays: boolean
    closedDayLabel: string
    hoursSeparator: string

    // Time zone
    tzMode: string
    tzIana: string
    tzOffset: number
    tzLabel: string
    recalcInterval: number

    // Special dates
    exceptions: ExceptionItem[]

    // Phone
    showPhone: boolean
    phoneLabel: string
    phoneDisplay: string
    phoneLink: string
    phoneIconMode: string
    phoneShowIcon: boolean
    phoneShowLabel: boolean
    phoneColor: string

    // Email
    showEmail: boolean
    emailLabel: string
    email: string
    emailSubject: string
    emailBody: string
    emailIconMode: string
    emailShowIcon: boolean
    emailShowLabel: boolean

    // Messaging
    showMessaging: boolean
    messagingLabel: string
    messagingItems: MessagingItem[]
    messagingMaxVisible: number
    messagingIconOnly: boolean
    messagingGap: number

    // Location
    showLocation: boolean
    locationMode: string
    locationMain: string
    locationSupport: string
    locationAddress: string
    mapUrl: string
    directionsLabel: string
    locationShowIcon: boolean
    locationNewTab: boolean
    showDirections: boolean
    locationColor: string

    // Confidence
    showConfidence: boolean
    confidenceMessage: string
    confidenceIconMode: string
    confidenceShowIcon: boolean
    confidenceEmphasis: string
    confidenceLink: string

    // Quick links
    showQuickLinks: boolean
    quickLinks: QuickLinkItem[]
    quickLinksMaxVisible: number
    quickLinksStyle: string
    quickLinksGap: number
    quickLinksShowIcons: boolean
    quickLinksShowLabels: boolean

    // CTA
    showCTA: boolean
    ctaLabel: string
    ctaUrl: string
    ctaStyle: string
    ctaNewTab: boolean
    ctaShowIcon: boolean
    ctaIconName: IconName
    ctaIconPlacement: string
    ctaBg: string
    ctaText: string
    ctaBorderColor: string
    ctaHoverBg: string
    ctaHoverText: string
    ctaRadius: number
    ctaPaddingX: number
    ctaPaddingY: number

    // Service status
    enableServiceStatus: boolean
    serviceStatusType: string
    serviceStatusLabel: string
    serviceStatusMessage: string
    serviceStatusUrl: string
    serviceLastUpdated: string
    serviceShowIndicator: boolean
    serviceShowTimestamp: boolean

    // Availability
    showAvailability: boolean
    availabilityState: string
    availabilityMessage: string
    availabilityQty: number
    availabilityUnit: string
    availabilityNextDate: string
    availabilityCtaLabel: string
    availabilityCtaUrl: string

    // Placement
    placement: string
    zIndex: number
    topOffset: number
    bottomOffset: number
    fullWidth: boolean
    maxContentWidth: number
    safeArea: boolean
    previewFixed: boolean
    addSpacer: boolean
    spacerHeight: number

    // Dismissal
    dismissible: boolean
    showCloseButton: boolean
    closeLabel: string
    closePosition: string
    rememberDismissal: string
    storageKey: string
    storageVersion: string
    dismissDays: number
    resetInPreview: boolean

    // Mobile drawer
    mobileBreakpoint: number
    mobileCollapse: string
    mobilePrimaryContact: string
    keepStatusVisible: boolean
    showDrawer: boolean
    drawerTriggerStyle: string
    drawerPosition: string
    drawerBg: string
    drawerMaxHeight: number
    closeDrawerOnClick: boolean
    hideLocationMobile: boolean
    hideConfidenceMobile: boolean
    mobilePaddingX: number
    drawerTitle: string

    // Theme / background
    themePreset: string
    bgMode: string
    bgPrimary: string
    bgSecondary: string
    gradientAngle: number
    bgOpacity: number
    borderColor: string
    borderWidth: number
    borderRadius: number
    shadowEnabled: boolean
    customShadow: string
    backdropBlur: number
    customText: string
    customMuted: string

    // Typography
    statusFont: object
    hoursFont: object
    contactFont: object
    linkFont: object
    ctaFont: object
    drawerTitleFont: object
    labelFont: object

    // Interaction
    enableHover: boolean
    hoverStyle: string
    transitionDuration: number
    easing: string
    drawerAnimation: string
    drawerAnimDuration: number
    animateStatusChange: boolean

    // Animation / premium
    animateEntrance: boolean
    entranceStyle: string
    entranceDuration: number
    entranceStagger: number
    statusPulse: boolean
    shimmerOnLoad: boolean
    gradientAccent: boolean
    accentPosition: string
    accentColorA: string
    accentColorB: string
    enableCopy: boolean
    copiedLabel: string
    showLiveClock: boolean
    clockLabel: string
    autoHideOnScroll: boolean

    // Accessibility
    liveRegion: boolean
    statusAriaPrefix: string

    // Padding / gap (Advanced)
    paddingX: number
    paddingY: number
    gap: number
    showDividers: boolean
    height: number // section height (kept out of controls to avoid Framer's reserved name)
}

interface MessagingItem {
    channel: string
    label: string
    url: string
    phone: string
    message: string
    iconMode: string
    customIcon?: string
    newTab: boolean
    enabled: boolean
}

interface QuickLinkItem {
    type: string
    label: string
    url: string
    iconName: IconName
    enabled: boolean
    newTab: boolean
    highlighted: boolean
    ariaLabel: string
}

/* ============================================================================
 * SMALL PRESENTATIONAL COMPONENTS
 * ========================================================================== */

function StatusBadge(props: {
    result: StatusResult
    p: Props
    theme: Theme
    scope: string
    pulse?: boolean
}) {
    const { result, p, theme, scope, pulse } = props

    // Manual overrides bypass the schedule entirely.
    let kind = result.kind
    if (p.statusMode === "manualOpen") kind = "open"
    else if (p.statusMode === "manualClosed") kind = "closed"
    else if (p.statusMode === "appointment") kind = "appointment"
    else if (p.statusMode === "unavailable") kind = "unavailable"
    else if (p.statusMode === "custom") kind = "custom"

    const color =
        kind === "open"
            ? theme.openColor
            : kind === "closingSoon" || kind === "opensSoon"
              ? theme.warnColor
              : kind === "appointment"
                ? theme.warnColor
                : kind === "custom"
                  ? theme.text
                  : theme.closedColor

    const iconName: IconName =
        kind === "open"
            ? "open"
            : kind === "closingSoon"
              ? "warning"
              : kind === "opensSoon"
                ? "clock"
                : kind === "appointment"
                  ? "calendar"
                  : kind === "unavailable"
                    ? "warning"
                    : kind === "custom"
                      ? "info"
                      : "closed"

    // Split into a bold primary label + a muted secondary detail so the badge
    // reads as a designed element, not one flat coloured string.
    let primary = ""
    let secondary = ""
    if (kind === "custom") {
        primary = p.customStatusText || "Contact us"
    } else if (kind === "appointment") {
        primary = p.appointmentLabel
    } else if (kind === "unavailable") {
        primary = p.unavailableLabel
    } else if (kind === "open") {
        primary = p.openLabel
        if (
            p.showClosingTime &&
            result.changeTime &&
            p.statusMode === "automatic"
        ) {
            secondary = `Closes ${result.changeTime}`
        }
    } else if (kind === "closingSoon") {
        primary = p.closingSoonLabel
        if (result.minutesToChange != null)
            secondary = humanizeMinutes(result.minutesToChange)
    } else if (kind === "opensSoon") {
        primary = p.opensSoonLabel
        if (result.changeTime && p.showOpeningTime)
            secondary = result.changeTime
    } else {
        // closed
        primary = p.closedLabel
        if (
            p.showNextChange &&
            result.changeTime &&
            p.statusMode === "automatic"
        ) {
            const when =
                result.changeDayLabel === "today"
                    ? "Opens"
                    : result.changeDayLabel === "tomorrow"
                      ? "Opens tomorrow"
                      : `Opens ${result.changeDayLabel}`
            secondary = p.showOpeningTime
                ? `${when} ${result.changeTime}`
                : when
        }
    }

    // Pulse the dot in any "live" state (open / closing-soon / opening-soon) so
    // the strip feels alive even when the business is not currently open. The
    // halo colour follows the dot via a CSS variable.
    const doesPulse =
        !!pulse &&
        (kind === "open" || kind === "closingSoon" || kind === "opensSoon")
    const indicator =
        p.statusIndicatorStyle === "dot" ? (
            <span
                aria-hidden="true"
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                    boxShadow:
                        kind === "open" && !doesPulse
                            ? `0 0 0 3px ${hexWithAlpha(color, 0.18)}`
                            : "none",
                }}
            >
                {/* Real child element for the ping halo — NOT a ::after with
                    content:"", because React escapes the quotes inside the
                    injected <style> on the published (SSR) build and the rule is
                    silently dropped. A DOM element is bullet-proof. */}
                {doesPulse ? (
                    <span
                        className={`${scope}-ping`}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            background: color,
                            zIndex: -1,
                        }}
                    />
                ) : null}
            </span>
        ) : p.statusIndicatorStyle === "icon" ? (
            <BuiltInIcon name={iconName} size={15} color={color} />
        ) : null

    const style = p.statusBadgeStyle
    // In the default "minimal" style only the dot carries colour; the text stays
    // in the neutral ink colour, which is what makes it look premium instead of
    // like an alert banner.
    const primaryColor =
        style === "solid" ? "#ffffff" : style === "minimal" ? theme.text : color
    const secondaryColor =
        style === "solid" ? "rgba(255,255,255,0.82)" : theme.muted

    const badgeBase: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        color: primaryColor,
        fontWeight: 600,
        letterSpacing: "-0.006em",
        whiteSpace: "nowrap",
    }

    if (style === "pill" || style === "solid" || style === "soft") {
        badgeBase.padding = "5px 12px"
        badgeBase.borderRadius = 999
        badgeBase.background =
            style === "solid"
                ? color
                : style === "soft"
                  ? hexWithAlpha(color, 0.1)
                  : "transparent"
        if (style === "pill")
            badgeBase.border = `1px solid ${hexWithAlpha(color, 0.32)}`
    }

    return (
        <span className={`${scope}-status`} style={badgeBase} data-kind={kind}>
            {style === "solid" ? (
                <span aria-hidden="true" style={{ display: "inline-flex" }}>
                    <BuiltInIcon name={iconName} size={14} color="#ffffff" />
                </span>
            ) : (
                indicator
            )}
            <span>{primary}</span>
            {secondary ? (
                <>
                    <span
                        aria-hidden="true"
                        style={{
                            color: secondaryColor,
                            opacity: 0.5,
                            fontWeight: 400,
                        }}
                    >
                        ·
                    </span>
                    <span style={{ color: secondaryColor, fontWeight: 500 }}>
                        {secondary}
                    </span>
                </>
            ) : null}
        </span>
    )
}

function ServiceStatusBadge(props: { p: Props; theme: Theme }) {
    const { p, theme } = props
    const colorByType: Record<string, string> = {
        operational: theme.openColor,
        info: theme.text,
        maintenance: theme.warnColor,
        degraded: theme.warnColor,
        partial: theme.warnColor,
        major: theme.closedColor,
        custom: theme.text,
    }
    const color = colorByType[p.serviceStatusType] || theme.text
    const content = (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
            }}
        >
            {p.serviceShowIndicator && (
                <span
                    aria-hidden="true"
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                        flexShrink: 0,
                    }}
                />
            )}
            <span style={{ fontWeight: 600, color }}>
                {p.serviceStatusLabel}
            </span>
            {p.serviceStatusMessage && (
                <span style={{ color: theme.muted }}>
                    · {p.serviceStatusMessage}
                </span>
            )}
            {p.serviceShowTimestamp && p.serviceLastUpdated && (
                <span style={{ color: theme.muted, fontSize: "0.85em" }}>
                    ({p.serviceLastUpdated})
                </span>
            )}
        </span>
    )
    if (p.serviceStatusUrl) {
        return (
            <a
                href={p.serviceStatusUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
            >
                {content}
            </a>
        )
    }
    return content
}

function AvailabilityBadge(props: { p: Props; theme: Theme }) {
    const { p, theme } = props
    const colorByState: Record<string, string> = {
        available: theme.openColor,
        limited: theme.warnColor,
        booked: theme.closedColor,
        waitlist: theme.warnColor,
        emergency: theme.warnColor,
        custom: theme.text,
    }
    const color = colorByState[p.availabilityState] || theme.text
    let msg = p.availabilityMessage
    if (p.availabilityState === "limited" && p.availabilityQty > 0) {
        msg = `${p.availabilityQty} ${p.availabilityUnit} left`
    }
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                flexWrap: "wrap",
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                }}
            />
            <span style={{ fontWeight: 600, color }}>{msg}</span>
            {p.availabilityNextDate && p.availabilityNextDate.trim() ? (
                <span style={{ color: theme.muted, fontWeight: 500 }}>
                    · {p.availabilityNextDate}
                </span>
            ) : null}
            {p.availabilityCtaUrl && p.availabilityCtaLabel && (
                <a
                    href={p.availabilityCtaUrl}
                    style={{
                        color: theme.linkColor,
                        textDecoration: "underline",
                        fontWeight: 500,
                    }}
                >
                    {p.availabilityCtaLabel}
                </a>
            )}
        </span>
    )
}

function ContactLink(props: {
    href: string
    label?: string
    display: string
    iconMode: string
    builtinIcon: IconName
    showIcon: boolean
    showLabel: boolean
    color: string
    theme: Theme
    scope: string
    onClick?: () => void
}) {
    const {
        href,
        label,
        display,
        iconMode,
        builtinIcon,
        showIcon,
        showLabel,
        color,
        theme,
        scope,
        onClick,
    } = props
    if (!display) return null
    return (
        <a
            href={href}
            onClick={onClick}
            className={`${scope}-link`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: color || theme.linkColor,
                textDecoration: "none",
                fontWeight: 500,
                minHeight: 24,
            }}
        >
            {showIcon && iconMode !== "none" && (
                <ResolvedIcon
                    mode={iconMode}
                    builtin={builtinIcon}
                    size={15}
                    color={color || theme.linkColor}
                />
            )}
            {showLabel && label ? (
                <span style={{ color: theme.muted }}>{label}</span>
            ) : null}
            <span>{display}</span>
        </a>
    )
}

function MessagingLink(props: {
    item: MessagingItem
    iconOnly: boolean
    theme: Theme
    scope: string
    onClick?: () => void
}) {
    const { item, iconOnly, theme, scope, onClick } = props
    if (!item.enabled) return null
    const href = buildMessagingHref(item)
    if (!href) return null
    const iconByChannel: Record<string, IconName> = {
        whatsapp: "whatsapp",
        telegram: "message",
        messenger: "message",
        sms: "message",
        slack: "chat",
        teams: "chat",
        discord: "chat",
        livechat: "chat",
        custom: "chat",
    }
    const iconName = iconByChannel[item.channel] || "chat"
    return (
        <a
            href={href}
            onClick={onClick}
            target={item.newTab ? "_blank" : undefined}
            rel={item.newTab ? "noopener noreferrer" : undefined}
            className={`${scope}-link${iconOnly ? ` ${scope}-pill` : ""}`}
            aria-label={iconOnly ? item.label : undefined}
            title={iconOnly ? item.label : undefined}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: theme.linkColor,
                textDecoration: "none",
                fontWeight: 500,
                minHeight: 24,
                minWidth: iconOnly ? 24 : undefined,
            }}
        >
            <ResolvedIcon
                mode={item.iconMode === "custom" ? "custom" : "builtin"}
                builtin={iconName}
                custom={item.customIcon}
                size={16}
                color={theme.linkColor}
            />
            {!iconOnly && <span>{item.label}</span>}
        </a>
    )
}

function buildMessagingHref(item: MessagingItem): string {
    const digits = (item.phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "")
    const text = item.message ? encodeURIComponent(item.message) : ""
    switch (item.channel) {
        case "whatsapp":
            if (!digits) return item.url || ""
            return `https://wa.me/${digits}${text ? `?text=${text}` : ""}`
        case "sms":
            if (!digits) return item.url || ""
            return `sms:${item.phone}${text ? `?&body=${text}` : ""}`
        case "telegram":
        case "messenger":
        case "slack":
        case "teams":
        case "discord":
        case "livechat":
        case "custom":
        default:
            return item.url || ""
    }
}

function LocationBlock(props: { p: Props; theme: Theme; scope: string }) {
    const { p, theme, scope } = props
    if (!p.locationMain && !p.locationAddress) return null
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: p.locationColor || theme.text,
                minWidth: 0,
            }}
        >
            {p.locationShowIcon && (
                <BuiltInIcon
                    name="location"
                    size={15}
                    color={p.locationColor || theme.muted}
                />
            )}
            <span
                style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {p.locationMode === "address" && p.locationAddress
                    ? p.locationAddress
                    : p.locationMain}
                {p.locationSupport && (
                    <span style={{ color: theme.muted }}>
                        {" "}
                        · {p.locationSupport}
                    </span>
                )}
            </span>
            {p.showDirections && p.mapUrl && (
                <a
                    href={p.mapUrl}
                    target={p.locationNewTab ? "_blank" : undefined}
                    rel={p.locationNewTab ? "noopener noreferrer" : undefined}
                    className={`${scope}-link`}
                    style={{
                        color: theme.linkColor,
                        textDecoration: "underline",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                    }}
                >
                    {p.directionsLabel}
                </a>
            )}
        </span>
    )
}

function ConfidenceMessage(props: { p: Props; theme: Theme }) {
    const { p, theme } = props
    if (!p.confidenceMessage) return null
    const emphasis = p.confidenceEmphasis
    const style: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: emphasis === "subtle" ? theme.muted : theme.text,
        fontWeight: emphasis === "strong" || emphasis === "badge" ? 600 : 500,
    }
    if (emphasis === "badge") {
        style.padding = "3px 9px"
        style.borderRadius = 999
        style.background = hexWithAlpha(theme.openColor, 0.12)
        style.color = theme.openColor
    }
    const inner = (
        <>
            {p.confidenceShowIcon && p.confidenceIconMode !== "none" && (
                <ResolvedIcon
                    mode={p.confidenceIconMode}
                    builtin="check"
                    size={15}
                    color={emphasis === "badge" ? theme.openColor : theme.muted}
                />
            )}
            <span>{p.confidenceMessage}</span>
        </>
    )
    if (p.confidenceLink) {
        return (
            <a
                href={p.confidenceLink}
                style={{ ...style, textDecoration: "none" }}
            >
                {inner}
            </a>
        )
    }
    return <span style={style}>{inner}</span>
}

function QuickLink(props: {
    item: QuickLinkItem
    style: string
    showIcon: boolean
    showLabel: boolean
    theme: Theme
    scope: string
    onClick?: () => void
}) {
    const { item, style, showIcon, showLabel, theme, scope, onClick } = props
    if (!item.enabled) return null
    const base: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        textDecoration: style === "underline" ? "underline" : "none",
        color: item.highlighted ? theme.ctaText : theme.linkColor,
        fontWeight: item.highlighted ? 600 : 500,
        whiteSpace: "nowrap",
        minHeight: 28,
        cursor: "pointer",
    }
    if (style === "pill" || style === "outline" || item.highlighted) {
        base.padding = "5px 12px"
        base.borderRadius = 999
        if (item.highlighted) {
            base.background = theme.ctaBg
            base.color = theme.ctaText
        } else if (style === "pill") {
            base.background = hexWithAlpha(theme.text, 0.06)
            base.color = theme.linkColor
        } else if (style === "outline") {
            base.border = `1px solid ${theme.border}`
            base.color = theme.linkColor
        }
    }
    if (style === "icon") {
        base.padding = 6
        base.borderRadius = 8
        base.minWidth = 28
        base.justifyContent = "center"
    }
    const iconOnly = style === "icon" || !showLabel
    // Button-like styles get the lift/press hover; plain text links get the
    // animated underline instead.
    const pillLike =
        style === "pill" ||
        style === "outline" ||
        style === "icon" ||
        item.highlighted
    return (
        <a
            href={item.url || "#"}
            onClick={onClick}
            target={item.newTab ? "_blank" : undefined}
            rel={item.newTab ? "noopener noreferrer" : undefined}
            className={`${scope}-link${pillLike ? ` ${scope}-pill` : ""}`}
            style={base}
            aria-label={item.ariaLabel || (iconOnly ? item.label : undefined)}
            title={iconOnly ? item.label : undefined}
        >
            {showIcon && (
                <BuiltInIcon
                    name={item.iconName}
                    size={15}
                    color={base.color as string}
                />
            )}
            {!iconOnly && <span>{item.label}</span>}
        </a>
    )
}

function PrimaryCTA(props: {
    p: Props
    theme: Theme
    scope: string
    onClick?: () => void
}) {
    const { p, theme, scope, onClick } = props
    if (!p.ctaLabel) return null
    const filled = p.ctaStyle === "filled" || p.ctaStyle === "pill"
    const outline = p.ctaStyle === "outline"
    const base: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        textDecoration: p.ctaStyle === "text" ? "underline" : "none",
        fontWeight: 600,
        color: filled ? p.ctaText : theme.linkColor,
        background: filled ? p.ctaBg : "transparent",
        border: outline
            ? `1.5px solid ${p.ctaBorderColor || theme.border}`
            : "none",
        borderRadius: p.ctaStyle === "pill" ? 999 : p.ctaRadius,
        padding:
            p.ctaStyle === "text" ? 0 : `${p.ctaPaddingY}px ${p.ctaPaddingX}px`,
        whiteSpace: "nowrap",
        minHeight: 32,
        cursor: "pointer",
    }
    const icon = p.ctaShowIcon ? (
        <BuiltInIcon
            name={p.ctaIconName}
            size={15}
            color={base.color as string}
        />
    ) : null
    return (
        <a
            href={p.ctaUrl || "#"}
            onClick={onClick}
            target={p.ctaNewTab ? "_blank" : undefined}
            rel={p.ctaNewTab ? "noopener noreferrer" : undefined}
            className={`${scope}-cta${p.ctaStyle !== "text" ? ` ${scope}-btn` : ""}`}
            style={base}
            data-hoverbg={p.ctaHoverBg}
            data-hovertext={p.ctaHoverText}
        >
            {p.ctaIconPlacement === "left" && icon}
            <span>{p.ctaLabel}</span>
            {p.ctaIconPlacement === "right" && icon}
        </a>
    )
}

// Copy-to-clipboard button with an animated "Copied" confirmation. Guards
// navigator.clipboard access and clears its own timer on unmount.
function CopyButton(props: {
    value: string
    copiedLabel: string
    theme: Theme
    scope: string
}) {
    const { value, copiedLabel, theme, scope } = props
    const [copied, setCopied] = useState(false)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current)
        }
    }, [])

    const onClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            try {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(value)
                }
                setCopied(true)
                if (timerRef.current) window.clearTimeout(timerRef.current)
                timerRef.current = window.setTimeout(
                    () => setCopied(false),
                    1600
                )
            } catch {
                /* clipboard blocked — no-op */
            }
        },
        [value]
    )

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={copied ? copiedLabel : `Copy ${value}`}
            className={`${scope}-copy`}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: copied ? theme.openColor : theme.muted,
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
            }}
        >
            <BuiltInIcon
                name={copied ? "check" : "copy"}
                size={14}
                color={copied ? theme.openColor : theme.muted}
            />
            {copied && (
                <span
                    className={`${scope}-toast`}
                    role="status"
                    style={{
                        position: "absolute",
                        bottom: "calc(100% + 6px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: theme.text,
                        color: theme.bg === "transparent" ? "#fff" : theme.bg,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 7px",
                        borderRadius: 6,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        zIndex: 6,
                    }}
                >
                    {copiedLabel}
                </span>
            )}
        </button>
    )
}

function CloseButton(props: {
    label: string
    onClick: () => void
    theme: Theme
    scope: string
}) {
    const { label, onClick, theme, scope } = props
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`${scope}-close`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: theme.muted,
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
            }}
        >
            <BuiltInIcon name="close" size={16} color={theme.muted} />
        </button>
    )
}

/* ============================================================================
 * MOBILE DRAWER
 * ========================================================================== */

function MobileDrawer(props: {
    open: boolean
    onClose: () => void
    p: Props
    theme: Theme
    scope: string
    result: StatusResult
    titleId: string
    drawerId: string
}) {
    const { open, onClose, p, theme, scope, result, titleId, drawerId } = props
    const ref = useRef<HTMLDivElement | null>(null)
    useEscapeKey(onClose, open)
    useOutsideClick(ref, onClose, open)

    // Focus the drawer when it opens for keyboard users.
    useEffect(() => {
        if (open && ref.current) {
            const focusable = ref.current.querySelector<HTMLElement>("a,button")
            focusable?.focus()
        }
    }, [open])

    if (!open) return null

    const clickClose = p.closeDrawerOnClick ? onClose : undefined

    return (
        <div
            ref={ref}
            id={drawerId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            className={`${scope}-drawer`}
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                [p.drawerPosition === "top" ? "top" : "bottom"]: "100%",
                background: p.drawerBg || theme.drawerBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                boxShadow:
                    theme.shadow === "none"
                        ? "0 8px 24px rgba(0,0,0,0.18)"
                        : theme.shadow,
                padding: 16,
                maxHeight: p.drawerMaxHeight,
                overflowY: "auto",
                zIndex: 5,
                display: "flex",
                flexDirection: "column",
                gap: 14,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <strong
                    id={titleId}
                    style={{
                        ...fontToStyle(p.drawerTitleFont),
                        color: theme.text,
                    }}
                >
                    {p.drawerTitle}
                </strong>
                <CloseButton
                    label="Close menu"
                    onClick={onClose}
                    theme={theme}
                    scope={scope}
                />
            </div>

            {p.showStatus && (
                <StatusBadge
                    result={result}
                    p={p}
                    theme={theme}
                    scope={scope}
                />
            )}

            {p.showTodayHours && result.todayHoursText && (
                <div
                    style={{
                        color: theme.muted,
                        display: "inline-flex",
                        gap: 6,
                        alignItems: "center",
                    }}
                >
                    <BuiltInIcon name="clock" size={15} color={theme.muted} />
                    <span>Today: {result.todayHoursText}</span>
                </div>
            )}

            {p.showWeekly && <WeeklyList p={p} theme={theme} />}

            {p.showPhone && p.phoneDisplay && (
                <ContactLink
                    href={`tel:${p.phoneLink || p.phoneDisplay}`}
                    label={p.phoneLabel}
                    display={p.phoneDisplay}
                    iconMode={p.phoneIconMode}
                    builtinIcon="phone"
                    showIcon={p.phoneShowIcon}
                    showLabel={p.phoneShowLabel}
                    color={p.phoneColor}
                    theme={theme}
                    scope={scope}
                    onClick={clickClose}
                />
            )}

            {p.showEmail && p.email && (
                <ContactLink
                    href={buildMailto(p)}
                    label={p.emailLabel}
                    display={p.email}
                    iconMode={p.emailIconMode}
                    builtinIcon="email"
                    showIcon={p.emailShowIcon}
                    showLabel={p.emailShowLabel}
                    color={theme.linkColor}
                    theme={theme}
                    scope={scope}
                    onClick={clickClose}
                />
            )}

            {p.showMessaging && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {p.messagingItems
                        .filter((m) => m.enabled)
                        .map((m, i) => (
                            <MessagingLink
                                key={`dm-${i}`}
                                item={m}
                                iconOnly={false}
                                theme={theme}
                                scope={scope}
                                onClick={clickClose}
                            />
                        ))}
                </div>
            )}

            {p.showLocation && (
                <LocationBlock p={p} theme={theme} scope={scope} />
            )}

            {p.showConfidence && <ConfidenceMessage p={p} theme={theme} />}

            {p.showQuickLinks && (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: p.quickLinksGap,
                    }}
                >
                    {p.quickLinks
                        .filter((q) => q.enabled)
                        .map((q, i) => (
                            <QuickLink
                                key={`dq-${i}`}
                                item={q}
                                style={p.quickLinksStyle}
                                showIcon={p.quickLinksShowIcons}
                                showLabel
                                theme={theme}
                                scope={scope}
                                onClick={clickClose}
                            />
                        ))}
                </div>
            )}

            {p.showCTA && (
                <PrimaryCTA
                    p={p}
                    theme={theme}
                    scope={scope}
                    onClick={clickClose}
                />
            )}
        </div>
    )
}

function WeeklyList(props: { p: Props; theme: Theme }) {
    const { p, theme } = props
    // Order days starting from configured first day.
    const startIndex = p.firstDay === "sunday" ? 0 : 1
    const order: number[] = []
    for (let i = 0; i < 7; i++) order.push((startIndex + i) % 7)

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {order.map((idx) => {
                const key = DAY_KEYS[idx]
                const day = p.weekly[key]
                const periods = periodsForDay(day)
                if (p.hideClosedDays && periods.length === 0) return null
                const label = (day && day.label) || DAY_NAMES[idx]
                const value =
                    periods.length === 0
                        ? p.closedDayLabel
                        : periods
                              .map(
                                  (per) =>
                                      `${formatMinutes(per.open, p.use24h)}${p.hoursSeparator}${formatMinutes(per.close, p.use24h)}`
                              )
                              .join(", ")
                return (
                    <div
                        key={key}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 16,
                            fontSize: 13,
                        }}
                    >
                        <span style={{ color: theme.muted }}>{label}</span>
                        <span
                            style={{
                                color: periods.length
                                    ? theme.text
                                    : theme.muted,
                            }}
                        >
                            {value}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function buildMailto(p: Props): string {
    const params: string[] = []
    if (p.emailSubject)
        params.push(`subject=${encodeURIComponent(p.emailSubject)}`)
    if (p.emailBody) params.push(`body=${encodeURIComponent(p.emailBody)}`)
    return `mailto:${p.email}${params.length ? `?${params.join("&")}` : ""}`
}

// Accept #rgb / #rrggbb / rgb()/rgba() and return an rgba() with the given alpha.
function hexWithAlpha(color: string, alpha: number): string {
    if (!color) return `rgba(0,0,0,${alpha})`
    if (color.startsWith("#")) {
        let hex = color.slice(1)
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            if ([r, g, b].every(Number.isFinite))
                return `rgba(${r},${g},${b},${alpha})`
        }
    }
    const rgb = /rgba?\(([^)]+)\)/.exec(color)
    if (rgb) {
        const parts = rgb[1].split(",").map((s) => s.trim())
        return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`
    }
    return color
}

function fontToStyle(font: any): React.CSSProperties {
    if (!font || typeof font !== "object") return {}
    // Framer font objects already serialize to valid CSSProperties.
    return font as React.CSSProperties
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

/**
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 54
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SmartContactConfidenceHeaderStrip(
    partialProps: Partial<Props>
) {
    const merged = { ...(defaultProps as Props), ...partialProps }
    // Every setting is authoritative and takes effect immediately — there is no
    // preset layer silently overriding the individual toggles.
    const p = merged

    const isStatic = useIsStaticRenderer()
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const reactId = useId().replace(/[:]/g, "")
    const scope = `sc-${reactId}`

    const theme = resolveTheme(p)

    // Stable memoized config to avoid recreating the object each render.
    const statusCfg = useMemo<StatusConfig>(
        () => ({
            closingSoonThreshold: p.closingSoonThreshold,
            opensSoonThreshold: p.opensSoonThreshold,
            use24h: p.use24h,
        }),
        [p.closingSoonThreshold, p.opensSoonThreshold, p.use24h]
    )

    const result = useBusinessStatus(
        p.tzMode,
        p.tzIana,
        p.tzOffset,
        p.weekly,
        p.exceptions || [],
        statusCfg,
        p.recalcInterval,
        isStatic
    )

    const { dismissed, dismiss } = useDismissalState({
        dismissible: p.dismissible,
        remember: p.rememberDismissal,
        storageKey: p.storageKey,
        version: p.storageVersion,
        days: p.dismissDays,
        resetInPreview: p.resetInPreview,
        isStatic,
    })

    const { ref: rootRef, narrow } = useResponsiveCollapse(p.mobileBreakpoint)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const titleId = `${scope}-drawer-title`
    const drawerId = `${scope}-drawer`

    // Premium motion state. `mounted` gates ambient/JS animation so the first
    // client render matches static output; entrance runs via CSS class only when
    // off-canvas (avoids replaying on every editor edit).
    const mounted = useMounted(isStatic)
    const liveClock = useLiveClock(
        p.showLiveClock,
        p.tzMode,
        p.tzIana,
        p.tzOffset,
        p.use24h,
        isStatic
    )
    const scrollHidden = useScrollHide(
        p.autoHideOnScroll &&
            p.placement !== "inline" &&
            p.placement !== "aboveNav" &&
            p.placement !== "belowNav",
        isStatic
    )
    // Pulse is pure CSS keyed off the status kind, so it can be on from first
    // paint (no mount gate needed). Entrance/sheen classes are constant so they
    // reliably play on published sites regardless of the SSR render target;
    // CSS animations only fire on mount, so there's no editor-edit replay.
    const statusPulse = p.statusPulse
    const entranceOn = p.animateEntrance ? `${scope}-enter-on` : ""

    // Announce status changes politely — but only meaningful transitions, not
    // every interval tick. We track the previous kind.
    const prevKind = useRef<string | null>(null)
    const [announcement, setAnnouncement] = useState("")
    useEffect(() => {
        if (!p.liveRegion || isStatic) return
        if (prevKind.current !== null && prevKind.current !== result.kind) {
            setAnnouncement(
                `${p.statusAriaPrefix} ${statusPlainText(result, p)}`
            )
        }
        prevKind.current = result.kind
    }, [result.kind]) // eslint-disable-line react-hooks/exhaustive-deps

    if (dismissed) {
        // Keep an optional spacer collapse: render nothing.
        return null
    }

    /* ---- positioning ---- */
    const useFixed =
        (p.placement === "fixedTop" || p.placement === "fixedBottom") &&
        (!onCanvas || p.previewFixed)
    const useSticky =
        (p.placement === "stickyTop" || p.placement === "stickyBottom") &&
        (!onCanvas || p.previewFixed)
    const atBottom =
        p.placement === "fixedBottom" || p.placement === "stickyBottom"

    const hiddenTransform = atBottom ? "translateY(120%)" : "translateY(-120%)"
    const outerStyle: React.CSSProperties = {
        position: useFixed ? "fixed" : useSticky ? "sticky" : "relative",
        left: useFixed ? 0 : undefined,
        right: useFixed ? 0 : undefined,
        top: !atBottom && (useFixed || useSticky) ? p.topOffset : undefined,
        bottom:
            atBottom && (useFixed || useSticky) ? p.bottomOffset : undefined,
        zIndex: useFixed || useSticky ? p.zIndex : undefined,
        width: "100%",
        boxSizing: "border-box",
        transform: scrollHidden ? hiddenTransform : undefined,
    }

    /* ---- background ---- */
    let background: string = theme.bg
    if (p.themePreset === "custom" || p.bgMode) {
        if (p.bgMode === "gradient") {
            background = `linear-gradient(${p.gradientAngle}deg, ${p.bgPrimary}, ${p.bgSecondary})`
        } else if (p.bgMode === "transparent") {
            background = "transparent"
        } else if (p.bgMode === "solid") {
            background = p.bgPrimary
        }
    }

    const bandStyle: React.CSSProperties = {
        boxSizing: "border-box",
        width: "100%",
        maxWidth: p.fullWidth ? "100%" : undefined,
        background,
        color: theme.text,
        borderBottom:
            !atBottom && p.borderWidth > 0
                ? `${p.borderWidth}px solid ${theme.border}`
                : undefined,
        borderTop:
            atBottom && p.borderWidth > 0
                ? `${p.borderWidth}px solid ${theme.border}`
                : undefined,
        borderRadius: p.placement === "inline" ? p.borderRadius : 0,
        boxShadow: p.shadowEnabled ? theme.shadow : "none",
        backdropFilter:
            p.bgMode === "glass" || p.themePreset === "glass"
                ? `blur(${p.backdropBlur}px)`
                : undefined,
        WebkitBackdropFilter:
            p.bgMode === "glass" || p.themePreset === "glass"
                ? `blur(${p.backdropBlur}px)`
                : undefined,
        opacity: p.bgOpacity < 1 ? undefined : undefined, // opacity applied via background alpha instead
        paddingTop:
            p.safeArea && !atBottom && useFixed
                ? `calc(${p.paddingY}px + env(safe-area-inset-top))`
                : p.paddingY,
        paddingBottom:
            p.safeArea && atBottom && useFixed
                ? `calc(${p.paddingY}px + env(safe-area-inset-bottom))`
                : p.paddingY,
    }

    const innerStyle: React.CSSProperties = {
        boxSizing: "border-box",
        maxWidth: p.maxContentWidth > 0 ? p.maxContentWidth : undefined,
        margin: "0 auto",
        paddingLeft: narrow ? p.mobilePaddingX : p.paddingX,
        paddingRight: narrow ? p.mobilePaddingX : p.paddingX,
        display: "flex",
        alignItems: "center",
        gap: narrow ? Math.max(8, p.gap - 6) : p.gap,
        flexWrap: "wrap",
        minWidth: 0,
        position: "relative",
    }

    /* ---- section builders ---- */
    // Keying the badge on the status kind makes React remount it when the state
    // flips, replaying the fade — that is the "animate status change" effect.
    const statusNode =
        p.showStatus && p.statusMode !== "" ? (
            // suppressHydrationWarning: in visitor-timezone mode the server and
            // the visitor's browser may resolve status differently; the client
            // value is authoritative and corrects on hydration.
            <span style={fontToStyle(p.statusFont)} suppressHydrationWarning>
                <span
                    key={
                        p.animateStatusChange && mounted
                            ? result.kind
                            : "static"
                    }
                    className={
                        p.animateStatusChange && mounted
                            ? `${scope}-statuschange`
                            : undefined
                    }
                    style={{ display: "inline-flex" }}
                >
                    <StatusBadge
                        result={result}
                        p={p}
                        theme={theme}
                        scope={scope}
                        pulse={statusPulse}
                    />
                </span>
            </span>
        ) : null

    const clockNode =
        p.showLiveClock && liveClock ? (
            <span
                style={{
                    ...fontToStyle(p.hoursFont),
                    color: theme.muted,
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                    whiteSpace: "nowrap",
                }}
            >
                <BuiltInIcon name="clock" size={14} color={theme.muted} />
                <span>
                    {p.clockLabel ? `${p.clockLabel} ` : ""}
                    {liveClock}
                </span>
            </span>
        ) : null

    const serviceNode = p.enableServiceStatus ? (
        <span style={fontToStyle(p.statusFont)}>
            <ServiceStatusBadge p={p} theme={theme} />
        </span>
    ) : null

    const availabilityNode = p.showAvailability ? (
        <span style={fontToStyle(p.statusFont)}>
            <AvailabilityBadge p={p} theme={theme} />
        </span>
    ) : null

    const todayHoursNode =
        p.showTodayHours && result.todayHoursText ? (
            <span
                suppressHydrationWarning
                style={{
                    ...fontToStyle(p.hoursFont),
                    color: theme.muted,
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                    whiteSpace: "nowrap",
                }}
            >
                <BuiltInIcon name="clock" size={14} color={theme.muted} />
                <span>{result.todayHoursText}</span>
            </span>
        ) : null

    const confidenceNode =
        p.showConfidence && !(narrow && p.hideConfidenceMobile) ? (
            <span style={fontToStyle(p.labelFont)}>
                <ConfidenceMessage p={p} theme={theme} />
            </span>
        ) : null

    // Optional "times shown in … time" caption — only rendered when the user
    // has set it, so it never adds clutter by default.
    const tzLabelNode =
        p.showStatus && p.tzLabel && p.tzLabel.trim() ? (
            <span
                style={{
                    ...fontToStyle(p.labelFont),
                    color: theme.muted,
                    whiteSpace: "nowrap",
                }}
            >
                {p.tzLabel}
            </span>
        ) : null

    const phoneNode =
        p.showPhone && p.phoneDisplay ? (
            <span
                style={{
                    ...fontToStyle(p.contactFont),
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                }}
            >
                <ContactLink
                    href={`tel:${p.phoneLink || p.phoneDisplay}`}
                    label={p.phoneLabel}
                    display={p.phoneDisplay}
                    iconMode={p.phoneIconMode}
                    builtinIcon="phone"
                    showIcon={p.phoneShowIcon}
                    showLabel={p.phoneShowLabel}
                    color={p.phoneColor}
                    theme={theme}
                    scope={scope}
                />
                {p.enableCopy && (
                    <CopyButton
                        value={p.phoneLink || p.phoneDisplay}
                        copiedLabel={p.copiedLabel}
                        theme={theme}
                        scope={scope}
                    />
                )}
            </span>
        ) : null

    const emailNode =
        p.showEmail && p.email ? (
            <span
                style={{
                    ...fontToStyle(p.contactFont),
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                }}
            >
                <ContactLink
                    href={buildMailto(p)}
                    label={p.emailLabel}
                    display={p.email}
                    iconMode={p.emailIconMode}
                    builtinIcon="email"
                    showIcon={p.emailShowIcon}
                    showLabel={p.emailShowLabel}
                    color={theme.linkColor}
                    theme={theme}
                    scope={scope}
                />
                {p.enableCopy && (
                    <CopyButton
                        value={p.email}
                        copiedLabel={p.copiedLabel}
                        theme={theme}
                        scope={scope}
                    />
                )}
            </span>
        ) : null

    const messagingNode =
        p.showMessaging && p.messagingItems.some((m) => m.enabled) ? (
            <span
                style={{
                    ...fontToStyle(p.contactFont),
                    display: "inline-flex",
                    gap: p.messagingGap,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                {p.messagingLabel &&
                p.messagingLabel.trim() &&
                !p.messagingIconOnly ? (
                    <span style={{ color: theme.muted }}>
                        {p.messagingLabel}
                    </span>
                ) : null}
                {p.messagingItems
                    .filter((m) => m.enabled)
                    .slice(0, Math.max(1, p.messagingMaxVisible))
                    .map((m, i) => (
                        <MessagingLink
                            key={`m-${i}`}
                            item={m}
                            iconOnly={p.messagingIconOnly}
                            theme={theme}
                            scope={scope}
                        />
                    ))}
            </span>
        ) : null

    const locationNode =
        p.showLocation && !(narrow && p.hideLocationMobile) ? (
            <span style={fontToStyle(p.labelFont)}>
                <LocationBlock p={p} theme={theme} scope={scope} />
            </span>
        ) : null

    const quickLinksNode =
        p.showQuickLinks && p.quickLinks.some((q) => q.enabled) ? (
            <span
                style={{
                    ...fontToStyle(p.linkFont),
                    display: "inline-flex",
                    gap: p.quickLinksGap,
                    alignItems: "center",
                    flexWrap: "wrap",
                    minWidth: 0,
                }}
            >
                {p.quickLinks
                    .filter((q) => q.enabled)
                    .slice(
                        0,
                        narrow
                            ? Math.max(1, Math.min(p.quickLinksMaxVisible, 3))
                            : Math.max(1, p.quickLinksMaxVisible)
                    )
                    .map((q, i) => (
                        <QuickLink
                            key={`q-${i}`}
                            item={q}
                            style={p.quickLinksStyle}
                            showIcon={p.quickLinksShowIcons}
                            showLabel={p.quickLinksShowLabels}
                            theme={theme}
                            scope={scope}
                        />
                    ))}
            </span>
        ) : null

    const ctaNode = p.showCTA ? (
        <span style={fontToStyle(p.ctaFont)}>
            <PrimaryCTA p={p} theme={theme} scope={scope} />
        </span>
    ) : null

    const closeNode =
        p.dismissible && p.showCloseButton ? (
            <CloseButton
                label={p.closeLabel}
                onClick={dismiss}
                theme={theme}
                scope={scope}
            />
        ) : null

    const drawerTrigger = (
        <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            aria-label={drawerOpen ? "Close contact menu" : "Open contact menu"}
            className={`${scope}-trigger`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: `1px solid ${theme.border}`,
                background: "transparent",
                color: theme.text,
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                minHeight: 32,
                fontWeight: 600,
            }}
        >
            <BuiltInIcon
                name={drawerOpen ? "close" : "menu"}
                size={16}
                color={theme.text}
            />
            {p.drawerTriggerStyle === "labelled" && (
                <span>{drawerOpen ? "Close" : "Contact"}</span>
            )}
        </button>
    )

    /* ---- primary mobile contact (single action) ---- */
    const mobilePrimaryNode = (() => {
        if (p.mobilePrimaryContact === "phone" && p.phoneDisplay)
            return phoneNode
        if (p.mobilePrimaryContact === "email" && p.email) return emailNode
        if (p.mobilePrimaryContact === "cta") return ctaNode
        if (p.mobilePrimaryContact === "messaging") return messagingNode
        return phoneNode || emailNode || ctaNode
    })()

    /* ---- desktop content order by layout ---- */
    const contentByLayout = (): React.ReactNode[] => {
        const primaryStatus = serviceNode || availabilityNode || statusNode
        switch (p.layout) {
            case "contact":
                return [
                    phoneNode,
                    emailNode,
                    messagingNode,
                    primaryStatus,
                    quickLinksNode,
                    ctaNode,
                ]
            case "status":
                return [
                    primaryStatus,
                    todayHoursNode,
                    clockNode,
                    confidenceNode,
                    phoneNode,
                    ctaNode,
                ]
            case "quicklinks":
                return [quickLinksNode, primaryStatus, ctaNode]
            case "centered":
                return [primaryStatus, confidenceNode, ctaNode]
            case "iconrow":
                return [
                    primaryStatus,
                    phoneNode,
                    emailNode,
                    messagingNode,
                    quickLinksNode,
                ]
            case "minimal":
                return [primaryStatus, mobilePrimaryNode]
            case "mobilebar":
                return [primaryStatus, mobilePrimaryNode]
            case "split":
                return [
                    <span
                        key="left"
                        style={{
                            display: "inline-flex",
                            gap: p.gap,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        {primaryStatus}
                        {locationNode}
                    </span>,
                    <span key="spacer" style={{ flex: 1 }} />,
                    <span
                        key="right"
                        style={{
                            display: "inline-flex",
                            gap: p.gap,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        {phoneNode}
                        {emailNode}
                        {ctaNode}
                    </span>,
                ]
            case "full":
            default:
                return [
                    primaryStatus,
                    todayHoursNode,
                    clockNode,
                    tzLabelNode,
                    confidenceNode,
                    phoneNode,
                    emailNode,
                    messagingNode,
                    locationNode,
                    quickLinksNode,
                    ctaNode,
                ]
        }
    }

    /* ---- decide collapsed vs full ---- */
    const shouldCollapse = narrow && p.mobileCollapse !== "never"

    const centered = p.layout === "centered"

    const desktopItems = contentByLayout().filter(Boolean)
    // Hairline dividers give the strip a structured, "designed" rhythm. Skipped
    // for the layouts that are intentionally airy (split has its own spacer,
    // centered/minimal read better without them).
    const useDividers =
        p.showDividers &&
        p.layout !== "split" &&
        p.layout !== "centered" &&
        p.layout !== "minimal"

    const desktopContent = (
        <div
            className={entranceOn}
            style={{
                display: "flex",
                alignItems: "center",
                gap: p.gap,
                flexWrap: "wrap",
                flex: 1,
                minWidth: 0,
                justifyContent: centered ? "center" : "flex-start",
            }}
        >
            {desktopItems.map((node, i) => (
                <React.Fragment key={`c-${i}`}>
                    {useDividers && i > 0 && (
                        <span
                            aria-hidden="true"
                            style={{
                                width: 1,
                                height: 18,
                                background: theme.border,
                                alignSelf: "center",
                                flexShrink: 0,
                                opacity: 0.9,
                            }}
                        />
                    )}
                    <span
                        className={entranceOn ? `${scope}-item` : undefined}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            minWidth: 0,
                            animationDelay: entranceOn
                                ? `${i * p.entranceStagger}ms`
                                : undefined,
                        }}
                    >
                        {node}
                    </span>
                </React.Fragment>
            ))}
        </div>
    )

    const collapsedContent = (
        <div
            className={entranceOn ? `${scope}-enter-self` : undefined}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flex: 1,
                minWidth: 0,
                flexWrap: "wrap",
            }}
        >
            {p.keepStatusVisible &&
                (serviceNode || availabilityNode || statusNode)}
            {p.mobileCollapse !== "statusmenu" && (
                <div
                    style={{
                        minWidth: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    {mobilePrimaryNode}
                </div>
            )}
            <span style={{ flex: 1 }} />
            {p.showDrawer && drawerTrigger}
        </div>
    )

    const contentBody = shouldCollapse ? collapsedContent : desktopContent

    // CSS injected once. Constant per props (no isStatic branching) so SSR and
    // client markup match; all motion is disabled under prefers-reduced-motion.
    const ease = p.easing
    const dur = p.transitionDuration
    const hover = p.enableHover
    const hs = p.hoverStyle

    // Entrance from-state per selected style.
    const enterFrom =
        p.entranceStyle === "slideDown"
            ? "opacity:0; transform: translateY(-14px) scale(0.985);"
            : p.entranceStyle === "slideUp"
              ? "opacity:0; transform: translateY(14px) scale(0.985);"
              : p.entranceStyle === "scale"
                ? "opacity:0; transform: scale(0.94);"
                : p.entranceStyle === "blur"
                  ? "opacity:0; filter: blur(8px); transform: translateY(-6px);"
                  : "opacity:0;"

    const glowCss = hover && hs === "glow"
    const underlineCss = hover && hs === "underline"

    const css = `
.${scope}-link, .${scope}-cta, .${scope}-pill, .${scope}-btn, .${scope}-close, .${scope}-trigger, .${scope}-copy, .${scope}-status, .${scope}-outer {
  transition: ${hover ? `color ${dur}ms ${ease}, background-color ${dur}ms ${ease}, background-size ${dur}ms ${ease}, box-shadow ${dur}ms ${ease}, opacity ${dur}ms ${ease}, transform ${dur}ms ${ease}` : "none"};
}
.${scope}-link svg, .${scope}-cta svg, .${scope}-close svg { transition: transform ${dur}ms ${ease}; transform-origin: center; }
.${scope}-outer { transition: transform 320ms ${ease}; will-change: transform; }

/* Text / contact links — layout-stable hover. The link carries CONSTANT
   padding + radius at all times; only background-color (chip) or background-size
   (underline mode) animate on hover. Nothing changes the box geometry, so the
   hit target can never shift out from under the pointer — this is the definitive
   fix for the phone icon/number hover flicker. */
.${scope}-link:not(.${scope}-pill) {
  border-radius: 8px; padding: 2px 8px;
  ${underlineCss ? "background-image: linear-gradient(currentColor, currentColor); background-repeat: no-repeat; background-position: 8px 100%; background-size: 0% 1.5px;" : ""}
}
.${scope}-link:not(.${scope}-pill):hover {
  ${hover && underlineCss ? "background-size: calc(100% - 16px) 1.5px;" : ""}
  ${hover && !underlineCss ? `background-color: ${hexWithAlpha(theme.text, 0.08)}; box-shadow: 0 2px 10px ${hexWithAlpha(theme.text, 0.1)};` : ""}
}
/* Icon micro-interaction: a centred scale (never a translate) so the link's
   hit box is untouched — no pointer-boundary flicker on the phone icon. */
.${scope}-link:hover svg { ${hover ? "transform: scale(1.14);" : ""} }

/* Hover — CTA + button-like pills: lift, glow and a tactile press. */
.${scope}-cta:hover {
  ${hover && p.ctaHoverBg ? `background:${p.ctaHoverBg} !important;` : ""}
  ${hover && p.ctaHoverText ? `color:${p.ctaHoverText} !important;` : ""}
}
.${scope}-cta:hover svg { ${hover ? "transform: translateX(3px);" : ""} }
.${scope}-btn:hover, .${scope}-pill:hover {
  ${hover ? "transform: translateY(-2px);" : ""}
  ${hover ? `box-shadow: 0 8px 20px ${hexWithAlpha(glowCss ? p.ctaBg : theme.text, glowCss ? 0.34 : 0.16)};` : ""}
}
.${scope}-btn:active, .${scope}-pill:active { ${hover ? "transform: translateY(0) scale(0.97);" : ""} }

/* Hover — icon buttons (copy / close / drawer trigger): tint + subtle scale. */
.${scope}-close:hover, .${scope}-trigger:hover, .${scope}-copy:hover { ${hover ? `background:${hexWithAlpha(theme.text, 0.08)}; transform: scale(1.08);` : ""} }
.${scope}-close:active, .${scope}-trigger:active, .${scope}-copy:active { ${hover ? "transform: scale(0.92);" : ""} }
.${scope}-close:hover svg { ${hover ? "transform: rotate(90deg);" : ""} }

/* Focus — always visible for keyboard users */
.${scope}-link:focus-visible, .${scope}-cta:focus-visible, .${scope}-close:focus-visible, .${scope}-trigger:focus-visible, .${scope}-copy:focus-visible {
  outline: 2px solid ${theme.linkColor}; outline-offset: 2px; border-radius: 6px;
}

/* Copy toast pop */
.${scope}-toast { animation: ${scope}-pop 180ms ${ease}; }
@keyframes ${scope}-pop { from { opacity:0; transform: translateX(-50%) translateY(3px) scale(0.9); } to { opacity:1; transform: translateX(-50%) translateY(0) scale(1); } }

/* Ambient status ping — expanding halo behind the dot (real child element, see
   StatusBadge). Only the animation lives here; the box styles are inline. */
.${scope}-ping { animation: ${scope}-ping 1.9s ${ease} infinite; }
@keyframes ${scope}-ping {
  0% { transform: scale(1); opacity: 0.5; }
  70% { transform: scale(2.9); opacity: 0; }
  100% { transform: scale(2.9); opacity: 0; }
}

/* Status change cross-fade */
.${scope}-statuschange { animation: ${scope}-statusfade 320ms ${ease}; }
@keyframes ${scope}-statusfade { from { opacity:0; transform: translateY(-3px); } to { opacity:1; transform:none; } }

/* Entrance (staggered children + collapsed self). "backwards" fill applies the
   from-state during the stagger delay, then hands back to the element's normal
   style once done — so no transform lingers to promote a compositor layer that
   could make a hovered child (the phone icon) flicker. */
.${scope}-enter-on .${scope}-item { animation: ${scope}-enter ${p.entranceDuration}ms ${ease} backwards; }
.${scope}-enter-self { animation: ${scope}-enter ${p.entranceDuration}ms ${ease} backwards; }
@keyframes ${scope}-enter { from { ${enterFrom} } to { opacity:1; transform:none; filter:none; } }

/* Load sheen — one sweep across the strip on mount. Colour is derived from the
   text colour so it contrasts the background on BOTH light and dark themes
   (a plain white sheen was invisible on the default light background). */
.${scope}-sheen { position:absolute; inset:0; overflow:hidden; pointer-events:none; border-radius:inherit; }
.${scope}-sheen span { position:absolute; top:0; bottom:0; width:40%; left:-55%; transform: skewX(-18deg);
  background: linear-gradient(90deg, transparent, ${hexWithAlpha(theme.text, 0.09)}, transparent);
  animation: ${scope}-sheen 1.6s ${ease} 1; }
@keyframes ${scope}-sheen { to { left: 135%; } }

/* Animated gradient accent line */
.${scope}-accent { position:absolute; left:0; right:0; height:2px; ${p.accentPosition === "bottom" ? "bottom:0;" : "top:0;"}
  background: linear-gradient(90deg, ${p.accentColorA}, ${p.accentColorB}, ${p.accentColorA});
  background-size: 200% 100%; animation: ${scope}-accent 4s linear infinite; }
@keyframes ${scope}-accent { to { background-position: 200% 0; } }

/* Drawer */
.${scope}-drawer { animation: ${p.drawerAnimation === "none" ? "none" : `${scope}-drawer-in ${p.drawerAnimDuration}ms ${ease}`}; }
@keyframes ${scope}-drawer-in { from { opacity:0; transform: translateY(${p.drawerPosition === "top" ? "-6px" : "6px"}); } to { opacity:1; transform:none; } }

@media (prefers-reduced-motion: reduce) {
  .${scope}-link, .${scope}-cta, .${scope}-pill, .${scope}-btn, .${scope}-close, .${scope}-trigger, .${scope}-copy, .${scope}-status, .${scope}-outer,
  .${scope}-link svg, .${scope}-cta svg, .${scope}-close svg { transition: none !important; }
  .${scope}-ping, .${scope}-statuschange, .${scope}-enter-on .${scope}-item, .${scope}-enter-self,
  .${scope}-sheen span, .${scope}-accent, .${scope}-drawer, .${scope}-toast { animation: none !important; }
  .${scope}-ping { display: none !important; }
  .${scope}-enter-on .${scope}-item, .${scope}-enter-self { opacity: 1 !important; filter: none !important; transform: none !important; }
}

/* Static render (Framer canvas + image export): freeze ALL motion so the editor
   shows a clean resting state and the exported thumbnail has no animation
   artifacts. Motion resumes on the published site (isStatic is false there). */
.${scope}-static .${scope}-enter-on .${scope}-item,
.${scope}-static .${scope}-enter-self,
.${scope}-static .${scope}-statuschange,
.${scope}-static .${scope}-ping,
.${scope}-static .${scope}-sheen span,
.${scope}-static .${scope}-accent,
.${scope}-static .${scope}-drawer,
.${scope}-static .${scope}-toast { animation: none !important; }
.${scope}-static .${scope}-enter-on .${scope}-item,
.${scope}-static .${scope}-enter-self { opacity: 1 !important; filter: none !important; transform: none !important; }
.${scope}-static .${scope}-ping,
.${scope}-static .${scope}-sheen { display: none !important; }
`

    return (
        <>
            <style>{css}</style>
            {p.addSpacer && useFixed && (
                <div
                    aria-hidden="true"
                    style={{
                        height: p.spacerHeight > 0 ? p.spacerHeight : p.height,
                    }}
                />
            )}
            <div
                className={`${scope}-outer${isStatic ? ` ${scope}-static` : ""}`}
                style={outerStyle}
            >
                <div
                    ref={rootRef}
                    style={{ ...bandStyle, position: "relative" }}
                >
                    {/* Animated gradient accent line */}
                    {p.gradientAccent && (
                        <div aria-hidden="true" className={`${scope}-accent`} />
                    )}
                    {/* One-time load sheen */}
                    {p.shimmerOnLoad && (
                        <div aria-hidden="true" className={`${scope}-sheen`}>
                            <span />
                        </div>
                    )}
                    <div style={innerStyle}>
                        {/* Close button on the left if configured */}
                        {closeNode && p.closePosition === "left" && closeNode}

                        {contentBody}

                        {closeNode && p.closePosition === "right" && closeNode}

                        {/* Mobile drawer floats relative to inner container */}
                        {p.showDrawer && (
                            <MobileDrawer
                                open={drawerOpen}
                                onClose={() => setDrawerOpen(false)}
                                p={p}
                                theme={theme}
                                scope={scope}
                                result={result}
                                titleId={titleId}
                                drawerId={drawerId}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Polite live region for status transitions (not every tick). */}
            {p.liveRegion && (
                <div
                    aria-live="polite"
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        margin: -1,
                        padding: 0,
                        overflow: "hidden",
                        clip: "rect(0 0 0 0)",
                        whiteSpace: "nowrap",
                        border: 0,
                    }}
                >
                    {announcement}
                </div>
            )}
        </>
    )
}

function statusPlainText(result: StatusResult, p: Props): string {
    switch (result.kind) {
        case "open":
            return p.openLabel
        case "closingSoon":
            return p.closingSoonLabel
        case "opensSoon":
            return p.opensSoonLabel
        case "appointment":
            return p.appointmentLabel
        case "unavailable":
            return p.unavailableLabel
        case "custom":
            return p.customStatusText
        default:
            return p.closedLabel
    }
}

/* ============================================================================
 * DEFAULT PROPS
 * ========================================================================== */

const defaultDay = (
    open: string,
    close: string,
    closed = false
): DaySchedule => ({
    closed,
    open,
    close,
    split: false,
    open2: "13:00",
    close2: "18:00",
    label: "",
})

const defaultProps: Props = {
    layout: "full",

    showStatus: true,
    statusMode: "automatic",
    openLabel: "Open now",
    closedLabel: "Closed",
    closingSoonLabel: "Closing soon",
    opensSoonLabel: "Opening soon",
    appointmentLabel: "Available by appointment",
    unavailableLabel: "Temporarily unavailable",
    customStatusText: "Contact us anytime",
    showNextChange: true,
    showOpeningTime: true,
    showClosingTime: true,
    closingSoonThreshold: 60,
    opensSoonThreshold: 60,
    statusBadgeStyle: "minimal",
    statusIndicatorStyle: "dot",
    openColor: "#12805c",
    closedColor: "#b42318",
    warnColor: "#b45309",

    weekly: {
        mon: defaultDay("09:00", "18:00"),
        tue: defaultDay("09:00", "18:00"),
        wed: defaultDay("09:00", "18:00"),
        thu: defaultDay("09:00", "18:00"),
        fri: defaultDay("09:00", "17:00"),
        sat: defaultDay("10:00", "14:00"),
        sun: defaultDay("10:00", "16:00", true),
    },
    use24h: true,
    firstDay: "monday",
    showTodayHours: true,
    showWeekly: false,
    hideClosedDays: false,
    closedDayLabel: "Closed",
    hoursSeparator: "–",

    tzMode: "visitor",
    tzIana: "Europe/Amsterdam",
    tzOffset: 1,
    tzLabel: "",
    recalcInterval: 30,

    exceptions: [
        {
            date: "2026-12-25",
            label: "Christmas Day",
            closed: true,
            open: "09:00",
            close: "18:00",
            split: false,
            open2: "13:00",
            close2: "18:00",
            appointment: false,
            message: "Closed for the holiday",
            priority: 1,
        },
        {
            date: "2026-12-31",
            label: "New Year's Eve",
            closed: false,
            open: "09:00",
            close: "14:00",
            split: false,
            open2: "13:00",
            close2: "18:00",
            appointment: false,
            message: "",
            priority: 1,
        },
    ],

    showPhone: true,
    phoneLabel: "Call us",
    phoneDisplay: "+31 10 123 4567",
    phoneLink: "+31101234567",
    phoneIconMode: "builtin",
    phoneShowIcon: true,
    phoneShowLabel: false,
    phoneColor: "",

    showEmail: false,
    emailLabel: "Email",
    email: "hello@example.com",
    emailSubject: "Website enquiry",
    emailBody: "",
    emailIconMode: "builtin",
    emailShowIcon: true,
    emailShowLabel: false,

    showMessaging: false,
    messagingLabel: "Chat with us",
    messagingItems: [
        {
            channel: "whatsapp",
            label: "WhatsApp",
            url: "",
            phone: "+31612345678",
            message: "Hi! I have a question.",
            iconMode: "builtin",
            newTab: true,
            enabled: true,
        },
    ],
    messagingMaxVisible: 3,
    messagingIconOnly: false,
    messagingGap: 12,

    showLocation: true,
    locationMode: "servicearea",
    locationMain: "Serving Rotterdam and the EU",
    locationSupport: "",
    locationAddress: "Coolsingel 1, 3011 Rotterdam",
    mapUrl: "https://maps.google.com/?q=Rotterdam",
    directionsLabel: "Get directions",
    locationShowIcon: true,
    locationNewTab: true,
    showDirections: true,
    locationColor: "",

    showConfidence: false,
    confidenceMessage: "Same-day responses from a real person",
    confidenceIconMode: "builtin",
    confidenceShowIcon: true,
    confidenceEmphasis: "normal",
    confidenceLink: "",

    showQuickLinks: false,
    quickLinks: [
        {
            type: "faq",
            label: "FAQ",
            url: "/faq",
            iconName: "faq",
            enabled: true,
            newTab: false,
            highlighted: false,
            ariaLabel: "",
        },
        {
            type: "booking",
            label: "Book a call",
            url: "/book",
            iconName: "calendar",
            enabled: true,
            newTab: false,
            highlighted: false,
            ariaLabel: "",
        },
        {
            type: "quote",
            label: "Request a quote",
            url: "/quote",
            iconName: "quote",
            enabled: true,
            newTab: false,
            highlighted: false,
            ariaLabel: "",
        },
        {
            type: "tracking",
            label: "Track order",
            url: "/track",
            iconName: "tracking",
            enabled: true,
            newTab: false,
            highlighted: false,
            ariaLabel: "",
        },
    ],
    quickLinksMaxVisible: 4,
    quickLinksStyle: "plain",
    quickLinksGap: 14,
    quickLinksShowIcons: true,
    quickLinksShowLabels: true,

    showCTA: false,
    ctaLabel: "Contact us",
    ctaUrl: "/contact",
    ctaStyle: "filled",
    ctaNewTab: false,
    ctaShowIcon: false,
    ctaIconName: "message",
    ctaIconPlacement: "left",
    ctaBg: "#111418",
    ctaText: "#ffffff",
    ctaBorderColor: "#111418",
    ctaHoverBg: "#2b2f36",
    ctaHoverText: "#ffffff",
    ctaRadius: 10,
    ctaPaddingX: 16,
    ctaPaddingY: 9,

    enableServiceStatus: false,
    serviceStatusType: "operational",
    serviceStatusLabel: "All systems operational",
    serviceStatusMessage: "",
    serviceStatusUrl: "",
    serviceLastUpdated: "Updated just now",
    serviceShowIndicator: true,
    serviceShowTimestamp: false,

    showAvailability: false,
    availabilityState: "available",
    availabilityMessage: "Accepting new projects",
    availabilityQty: 3,
    availabilityUnit: "spots",
    availabilityNextDate: "",
    availabilityCtaLabel: "Get in touch",
    availabilityCtaUrl: "/contact",

    placement: "inline",
    zIndex: 1000,
    topOffset: 0,
    bottomOffset: 0,
    fullWidth: true,
    maxContentWidth: 1200,
    safeArea: true,
    previewFixed: false,
    addSpacer: false,
    spacerHeight: 0,

    dismissible: false,
    showCloseButton: true,
    closeLabel: "Dismiss this banner",
    closePosition: "right",
    rememberDismissal: "session",
    storageKey: "contact-strip",
    storageVersion: "1",
    dismissDays: 7,
    resetInPreview: true,

    mobileBreakpoint: 640,
    mobileCollapse: "iconmenu",
    mobilePrimaryContact: "phone",
    keepStatusVisible: true,
    showDrawer: true,
    drawerTriggerStyle: "labelled",
    drawerPosition: "bottom",
    drawerBg: "",
    drawerMaxHeight: 420,
    closeDrawerOnClick: true,
    hideLocationMobile: false,
    hideConfidenceMobile: false,
    mobilePaddingX: 14,
    drawerTitle: "Contact & hours",

    themePreset: "light",
    bgMode: "",
    bgPrimary: "#ffffff",
    bgSecondary: "#f2f4f7",
    gradientAngle: 90,
    bgOpacity: 1,
    borderColor: "#e5e7eb",
    borderWidth: 0,
    borderRadius: 0,
    shadowEnabled: true,
    customShadow: "0 1px 2px rgba(16,24,40,0.08)",
    backdropBlur: 10,
    customText: "#111418",
    customMuted: "#6b7280",

    statusFont: {
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "-0.01em",
    } as any,
    hoursFont: {
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.01em",
    } as any,
    contactFont: {
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.01em",
    } as any,
    linkFont: {
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.006em",
    } as any,
    ctaFont: { fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" } as any,
    drawerTitleFont: {
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-0.01em",
    } as any,
    labelFont: {
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.006em",
    } as any,

    enableHover: true,
    hoverStyle: "lift",
    transitionDuration: 180,
    easing: "cubic-bezier(0.22,1,0.36,1)",
    drawerAnimation: "slide",
    drawerAnimDuration: 220,
    animateStatusChange: true,

    animateEntrance: true,
    entranceStyle: "slideDown",
    entranceDuration: 560,
    entranceStagger: 85,
    statusPulse: true,
    shimmerOnLoad: true,
    gradientAccent: false,
    accentPosition: "top",
    accentColorA: "#6366f1",
    accentColorB: "#22d3ee",
    enableCopy: false,
    copiedLabel: "Copied!",
    showLiveClock: false,
    clockLabel: "",
    autoHideOnScroll: false,

    liveRegion: true,
    statusAriaPrefix: "Business status:",

    paddingX: 24,
    paddingY: 13,
    gap: 20,
    showDividers: true,
    height: 54,
}

/* ============================================================================
 * PROPERTY CONTROLS
 * ========================================================================== */

const iconOptions = [
    "phone",
    "email",
    "chat",
    "whatsapp",
    "message",
    "clock",
    "location",
    "directions",
    "calendar",
    "booking",
    "faq",
    "tracking",
    "support",
    "quote",
    "external",
    "chevron",
    "menu",
    "close",
    "open",
    "closed",
    "warning",
    "check",
    "info",
]

const dayControl = (
    title: string,
    defOpen: string,
    defClose: string,
    defClosed = false
) => ({
    type: ControlType.Object as const,
    title,
    controls: {
        closed: {
            type: ControlType.Boolean,
            title: "Closed",
            defaultValue: defClosed,
        },
        open: {
            type: ControlType.String,
            title: "Open",
            defaultValue: defOpen,
            hidden: (o: any) => o.closed,
        },
        close: {
            type: ControlType.String,
            title: "Close",
            defaultValue: defClose,
            hidden: (o: any) => o.closed,
        },
        split: {
            type: ControlType.Boolean,
            title: "Second period",
            defaultValue: false,
            hidden: (o: any) => o.closed,
        },
        open2: {
            type: ControlType.String,
            title: "Open 2",
            defaultValue: "13:00",
            hidden: (o: any) => o.closed || !o.split,
        },
        close2: {
            type: ControlType.String,
            title: "Close 2",
            defaultValue: "18:00",
            hidden: (o: any) => o.closed || !o.split,
        },
        label: {
            type: ControlType.String,
            title: "Custom label",
            defaultValue: "",
        },
    },
})

addPropertyControls(SmartContactConfidenceHeaderStrip, {
    // ---- 1. LAYOUT ----
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: [
            "full",
            "contact",
            "status",
            "quicklinks",
            "split",
            "centered",
            "iconrow",
            "minimal",
            "mobilebar",
        ],
        optionTitles: [
            "Full Header Strip",
            "Contact First",
            "Status First",
            "Quick Links",
            "Split Layout",
            "Centered",
            "Compact Icon Row",
            "Minimal",
            "Mobile Bar",
        ],
        defaultValue: "full",
    },

    // ---- 2. STATUS ----
    showStatus: {
        type: ControlType.Boolean,
        title: "Show Status",
        defaultValue: true,
    },
    statusMode: {
        type: ControlType.Enum,
        title: "Status Mode",
        defaultValue: "automatic",
        options: [
            "automatic",
            "manualOpen",
            "manualClosed",
            "appointment",
            "unavailable",
            "custom",
        ],
        optionTitles: [
            "Automatic",
            "Manual Open",
            "Manual Closed",
            "Appointment Only",
            "Temporarily Unavailable",
            "Custom",
        ],
        hidden: (p: any) => !p.showStatus,
    },
    openLabel: {
        type: ControlType.String,
        title: "Open Label",
        defaultValue: "Open now",
        hidden: (p: any) => !p.showStatus,
    },
    closedLabel: {
        type: ControlType.String,
        title: "Closed Label",
        defaultValue: "Closed",
        hidden: (p: any) => !p.showStatus,
    },
    closingSoonLabel: {
        type: ControlType.String,
        title: "Closing Soon",
        defaultValue: "Closing soon",
        hidden: (p: any) => !p.showStatus,
    },
    opensSoonLabel: {
        type: ControlType.String,
        title: "Opening Soon",
        defaultValue: "Opening soon",
        hidden: (p: any) => !p.showStatus,
    },
    appointmentLabel: {
        type: ControlType.String,
        title: "Appointment Label",
        defaultValue: "Available by appointment",
        hidden: (p: any) => !p.showStatus,
    },
    unavailableLabel: {
        type: ControlType.String,
        title: "Unavailable Label",
        defaultValue: "Temporarily unavailable",
        hidden: (p: any) => !p.showStatus,
    },
    customStatusText: {
        type: ControlType.String,
        title: "Custom Status",
        defaultValue: "Contact us anytime",
        hidden: (p: any) => !p.showStatus || p.statusMode !== "custom",
    },
    showNextChange: {
        type: ControlType.Boolean,
        title: "Show Next Change",
        defaultValue: true,
        hidden: (p: any) => !p.showStatus || p.statusMode !== "automatic",
    },
    showOpeningTime: {
        type: ControlType.Boolean,
        title: "Show Opening Time",
        defaultValue: true,
        hidden: (p: any) => !p.showStatus || p.statusMode !== "automatic",
    },
    showClosingTime: {
        type: ControlType.Boolean,
        title: "Show Closing Time",
        defaultValue: true,
        hidden: (p: any) => !p.showStatus || p.statusMode !== "automatic",
    },
    closingSoonThreshold: {
        type: ControlType.Number,
        title: "Closing Soon (min)",
        defaultValue: 60,
        min: 5,
        max: 480,
        step: 5,
        hidden: (p: any) => !p.showStatus || p.statusMode !== "automatic",
    },
    opensSoonThreshold: {
        type: ControlType.Number,
        title: "Opening Soon (min)",
        defaultValue: 60,
        min: 5,
        max: 480,
        step: 5,
        hidden: (p: any) => !p.showStatus || p.statusMode !== "automatic",
    },
    statusBadgeStyle: {
        type: ControlType.Enum,
        title: "Badge Style",
        defaultValue: "minimal",
        options: ["minimal", "plain", "soft", "pill", "solid"],
        optionTitles: ["Minimal", "Plain", "Soft", "Pill", "Solid"],
        hidden: (p: any) => !p.showStatus,
    },
    statusIndicatorStyle: {
        type: ControlType.Enum,
        title: "Indicator",
        defaultValue: "dot",
        options: ["dot", "icon", "none"],
        optionTitles: ["Dot", "Icon", "None"],
        hidden: (p: any) => !p.showStatus,
    },
    openColor: {
        type: ControlType.Color,
        title: "Open Color",
        defaultValue: "#12805c",
    },
    closedColor: {
        type: ControlType.Color,
        title: "Closed Color",
        defaultValue: "#b42318",
    },
    warnColor: {
        type: ControlType.Color,
        title: "Warning Color",
        defaultValue: "#b45309",
    },

    // ---- 3. BUSINESS HOURS ----
    weekly: {
        type: ControlType.Object,
        title: "Weekly Hours",
        hidden: (p: any) => p.statusMode !== "automatic",
        controls: {
            mon: dayControl("Monday", "09:00", "18:00"),
            tue: dayControl("Tuesday", "09:00", "18:00"),
            wed: dayControl("Wednesday", "09:00", "18:00"),
            thu: dayControl("Thursday", "09:00", "18:00"),
            fri: dayControl("Friday", "09:00", "17:00"),
            sat: dayControl("Saturday", "10:00", "14:00"),
            sun: dayControl("Sunday", "10:00", "16:00", true),
        },
    },
    use24h: {
        type: ControlType.Boolean,
        title: "24-hour Time",
        defaultValue: true,
    },
    firstDay: {
        type: ControlType.Enum,
        title: "First Day",
        options: ["monday", "sunday"],
        optionTitles: ["Monday", "Sunday"],
        defaultValue: "monday",
    },
    showTodayHours: {
        type: ControlType.Boolean,
        title: "Show Today's Hours",
        defaultValue: true,
    },
    showWeekly: {
        type: ControlType.Boolean,
        title: "Show Weekly (drawer)",
        defaultValue: false,
    },
    hideClosedDays: {
        type: ControlType.Boolean,
        title: "Hide Closed Days",
        defaultValue: false,
    },
    closedDayLabel: {
        type: ControlType.String,
        title: "Closed Day Label",
        defaultValue: "Closed",
    },
    hoursSeparator: {
        type: ControlType.String,
        title: "Time Separator",
        defaultValue: "–",
    },

    // ---- 4. TIME ZONE ----
    tzMode: {
        type: ControlType.Enum,
        title: "Time Zone Mode",
        defaultValue: "visitor",
        options: ["visitor", "business", "offset", "manualStatus"],
        optionTitles: [
            "Visitor Local",
            "Business Zone",
            "Fixed UTC Offset",
            "Manual Status Only",
        ],
    },
    tzIana: {
        type: ControlType.String,
        title: "IANA Zone",
        defaultValue: "Europe/Amsterdam",
        hidden: (p: any) => p.tzMode !== "business",
    },
    tzOffset: {
        type: ControlType.Number,
        title: "UTC Offset (hrs)",
        defaultValue: 1,
        min: -12,
        max: 14,
        step: 0.5,
        hidden: (p: any) => p.tzMode !== "offset",
    },
    tzLabel: {
        type: ControlType.String,
        title: "Zone Label",
        defaultValue: "",
        placeholder: "e.g. Times shown in Amsterdam time",
    },
    recalcInterval: {
        type: ControlType.Number,
        title: "Recalc (sec)",
        defaultValue: 30,
        min: 5,
        max: 300,
        step: 5,
    },

    // ---- 5. SPECIAL DATES ----
    exceptions: {
        type: ControlType.Array,
        title: "Special Dates",
        control: {
            type: ControlType.Object,
            controls: {
                date: {
                    type: ControlType.String,
                    title: "Date (YYYY-MM-DD)",
                    defaultValue: "2026-12-25",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Holiday",
                },
                closed: {
                    type: ControlType.Boolean,
                    title: "Closed",
                    defaultValue: true,
                },
                appointment: {
                    type: ControlType.Boolean,
                    title: "By Appointment",
                    defaultValue: false,
                    hidden: (o: any) => o.closed,
                },
                open: {
                    type: ControlType.String,
                    title: "Open",
                    defaultValue: "09:00",
                    hidden: (o: any) => o.closed || o.appointment,
                },
                close: {
                    type: ControlType.String,
                    title: "Close",
                    defaultValue: "14:00",
                    hidden: (o: any) => o.closed || o.appointment,
                },
                split: {
                    type: ControlType.Boolean,
                    title: "Second Period",
                    defaultValue: false,
                    hidden: (o: any) => o.closed || o.appointment,
                },
                open2: {
                    type: ControlType.String,
                    title: "Open 2",
                    defaultValue: "13:00",
                    hidden: (o: any) => o.closed || o.appointment || !o.split,
                },
                close2: {
                    type: ControlType.String,
                    title: "Close 2",
                    defaultValue: "18:00",
                    hidden: (o: any) => o.closed || o.appointment || !o.split,
                },
                message: {
                    type: ControlType.String,
                    title: "Message",
                    defaultValue: "",
                },
                priority: {
                    type: ControlType.Number,
                    title: "Priority",
                    defaultValue: 1,
                    min: 0,
                    max: 10,
                    step: 1,
                },
            },
        },
        defaultValue: [],
    },

    // ---- 6. PHONE ----
    showPhone: {
        type: ControlType.Boolean,
        title: "Show Phone",
        defaultValue: true,
    },
    phoneLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Call us",
        hidden: (p: any) => !p.showPhone,
    },
    phoneDisplay: {
        type: ControlType.String,
        title: "Display Number",
        defaultValue: "+31 10 123 4567",
        hidden: (p: any) => !p.showPhone,
    },
    phoneLink: {
        type: ControlType.String,
        title: "tel: Number",
        defaultValue: "+31101234567",
        hidden: (p: any) => !p.showPhone,
    },
    phoneIconMode: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["builtin", "none"],
        optionTitles: ["Built-in", "None"],
        defaultValue: "builtin",
        hidden: (p: any) => !p.showPhone,
    },
    phoneShowIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        hidden: (p: any) => !p.showPhone,
    },
    phoneShowLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: false,
        hidden: (p: any) => !p.showPhone,
    },
    phoneColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111418",
        optional: true,
        hidden: (p: any) => !p.showPhone,
    },

    // ---- 7. EMAIL ----
    showEmail: {
        type: ControlType.Boolean,
        title: "Show Email",
        defaultValue: false,
    },
    emailLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Email",
        hidden: (p: any) => !p.showEmail,
    },
    email: {
        type: ControlType.String,
        title: "Address",
        defaultValue: "hello@example.com",
        hidden: (p: any) => !p.showEmail,
    },
    emailSubject: {
        type: ControlType.String,
        title: "Subject",
        defaultValue: "Website enquiry",
        hidden: (p: any) => !p.showEmail,
    },
    emailBody: {
        type: ControlType.String,
        title: "Body",
        defaultValue: "",
        displayTextArea: true,
        hidden: (p: any) => !p.showEmail,
    },
    emailIconMode: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["builtin", "none"],
        optionTitles: ["Built-in", "None"],
        defaultValue: "builtin",
        hidden: (p: any) => !p.showEmail,
    },
    emailShowIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        hidden: (p: any) => !p.showEmail,
    },
    emailShowLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: false,
        hidden: (p: any) => !p.showEmail,
    },

    // ---- 8. MESSAGING ----
    showMessaging: {
        type: ControlType.Boolean,
        title: "Show Messaging",
        defaultValue: false,
    },
    messagingLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Chat with us",
        hidden: (p: any) => !p.showMessaging,
    },
    messagingItems: {
        type: ControlType.Array,
        title: "Channels",
        hidden: (p: any) => !p.showMessaging,
        control: {
            type: ControlType.Object,
            controls: {
                channel: {
                    type: ControlType.Enum,
                    title: "Channel",
                    defaultValue: "whatsapp",
                    options: [
                        "whatsapp",
                        "telegram",
                        "messenger",
                        "sms",
                        "slack",
                        "teams",
                        "discord",
                        "livechat",
                        "custom",
                    ],
                    optionTitles: [
                        "WhatsApp",
                        "Telegram",
                        "Messenger",
                        "SMS",
                        "Slack Connect",
                        "Microsoft Teams",
                        "Discord",
                        "Live Chat",
                        "Custom",
                    ],
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "WhatsApp",
                },
                url: {
                    type: ControlType.Link,
                    title: "URL",
                    hidden: (o: any) =>
                        o.channel === "whatsapp" || o.channel === "sms",
                },
                phone: {
                    type: ControlType.String,
                    title: "Phone",
                    defaultValue: "+31612345678",
                    hidden: (o: any) =>
                        o.channel !== "whatsapp" && o.channel !== "sms",
                },
                message: {
                    type: ControlType.String,
                    title: "Prefill",
                    defaultValue: "",
                    hidden: (o: any) =>
                        o.channel !== "whatsapp" && o.channel !== "sms",
                },
                iconMode: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ["builtin", "custom"],
                    optionTitles: ["Built-in", "Custom"],
                    defaultValue: "builtin",
                },
                customIcon: {
                    type: ControlType.Image,
                    title: "Custom Icon",
                    hidden: (o: any) => o.iconMode !== "custom",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: true,
                },
                enabled: {
                    type: ControlType.Boolean,
                    title: "Enabled",
                    defaultValue: true,
                },
            },
        },
        defaultValue: [],
    },
    messagingMaxVisible: {
        type: ControlType.Number,
        title: "Max Visible",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        hidden: (p: any) => !p.showMessaging,
    },
    messagingIconOnly: {
        type: ControlType.Boolean,
        title: "Icon Only",
        defaultValue: false,
        hidden: (p: any) => !p.showMessaging,
    },
    messagingGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 4,
        max: 40,
        step: 1,
        hidden: (p: any) => !p.showMessaging,
    },

    // ---- 9. LOCATION ----
    showLocation: {
        type: ControlType.Boolean,
        title: "Show Location",
        defaultValue: true,
    },
    locationMode: {
        type: ControlType.Enum,
        title: "Mode",
        defaultValue: "servicearea",
        options: [
            "address",
            "citycountry",
            "servicearea",
            "remote",
            "multiple",
            "custom",
        ],
        optionTitles: [
            "Physical Address",
            "City & Country",
            "Service Area",
            "Remote",
            "Multiple Locations",
            "Custom",
        ],
        hidden: (p: any) => !p.showLocation,
    },
    locationMain: {
        type: ControlType.String,
        title: "Main Text",
        defaultValue: "Serving Rotterdam and the EU",
        hidden: (p: any) => !p.showLocation,
    },
    locationSupport: {
        type: ControlType.String,
        title: "Supporting Text",
        defaultValue: "",
        hidden: (p: any) => !p.showLocation,
    },
    locationAddress: {
        type: ControlType.String,
        title: "Address",
        defaultValue: "Coolsingel 1, 3011 Rotterdam",
        hidden: (p: any) => !p.showLocation || p.locationMode !== "address",
    },
    mapUrl: {
        type: ControlType.Link,
        title: "Map / Directions URL",
        hidden: (p: any) => !p.showLocation,
    },
    directionsLabel: {
        type: ControlType.String,
        title: "Directions Label",
        defaultValue: "Get directions",
        hidden: (p: any) => !p.showLocation,
    },
    locationShowIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        hidden: (p: any) => !p.showLocation,
    },
    locationNewTab: {
        type: ControlType.Boolean,
        title: "Map New Tab",
        defaultValue: true,
        hidden: (p: any) => !p.showLocation,
    },
    showDirections: {
        type: ControlType.Boolean,
        title: "Show Directions",
        defaultValue: true,
        hidden: (p: any) => !p.showLocation,
    },
    locationColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111418",
        optional: true,
        hidden: (p: any) => !p.showLocation,
    },

    // ---- 10. CONFIDENCE ----
    showConfidence: {
        type: ControlType.Boolean,
        title: "Show Confidence",
        defaultValue: false,
    },
    confidenceMessage: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "Same-day responses from a real person",
        hidden: (p: any) => !p.showConfidence,
    },
    confidenceIconMode: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["builtin", "none"],
        optionTitles: ["Built-in", "None"],
        defaultValue: "builtin",
        hidden: (p: any) => !p.showConfidence,
    },
    confidenceShowIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        hidden: (p: any) => !p.showConfidence,
    },
    confidenceEmphasis: {
        type: ControlType.Enum,
        title: "Emphasis",
        defaultValue: "normal",
        options: ["subtle", "normal", "strong", "badge"],
        optionTitles: ["Subtle", "Normal", "Strong", "Badge"],
        hidden: (p: any) => !p.showConfidence,
    },
    confidenceLink: {
        type: ControlType.Link,
        title: "Link",
        hidden: (p: any) => !p.showConfidence,
    },

    // ---- 11. QUICK LINKS ----
    showQuickLinks: {
        type: ControlType.Boolean,
        title: "Show Quick Links",
        defaultValue: false,
    },
    quickLinks: {
        type: ControlType.Array,
        title: "Links",
        hidden: (p: any) => !p.showQuickLinks,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    defaultValue: "custom",
                    options: [
                        "faq",
                        "booking",
                        "reservations",
                        "tracking",
                        "support",
                        "quote",
                        "contact",
                        "returns",
                        "shipping",
                        "login",
                        "help",
                        "call",
                        "custom",
                    ],
                    optionTitles: [
                        "FAQ",
                        "Booking",
                        "Reservations",
                        "Order Tracking",
                        "Support Portal",
                        "Request a Quote",
                        "Contact",
                        "Returns",
                        "Shipping Info",
                        "Customer Login",
                        "Help Center",
                        "Schedule a Call",
                        "Custom",
                    ],
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "FAQ",
                },
                url: { type: ControlType.Link, title: "URL" },
                iconName: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: iconOptions,
                    defaultValue: "faq",
                },
                highlighted: {
                    type: ControlType.Boolean,
                    title: "Highlighted",
                    defaultValue: false,
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
                enabled: {
                    type: ControlType.Boolean,
                    title: "Enabled",
                    defaultValue: true,
                },
                ariaLabel: {
                    type: ControlType.String,
                    title: "Aria Label",
                    defaultValue: "",
                },
            },
        },
        defaultValue: [],
    },
    quickLinksMaxVisible: {
        type: ControlType.Number,
        title: "Max Visible",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        hidden: (p: any) => !p.showQuickLinks,
    },
    quickLinksStyle: {
        type: ControlType.Enum,
        title: "Style",
        defaultValue: "plain",
        options: ["plain", "underline", "pill", "outline", "icon"],
        optionTitles: [
            "Plain",
            "Underlined",
            "Pills",
            "Outlined",
            "Icon Buttons",
        ],
        hidden: (p: any) => !p.showQuickLinks,
    },
    quickLinksGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 14,
        min: 4,
        max: 40,
        step: 1,
        hidden: (p: any) => !p.showQuickLinks,
    },
    quickLinksShowIcons: {
        type: ControlType.Boolean,
        title: "Show Icons",
        defaultValue: true,
        hidden: (p: any) => !p.showQuickLinks,
    },
    quickLinksShowLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        hidden: (p: any) => !p.showQuickLinks,
    },

    // ---- 12. CTA ----
    showCTA: {
        type: ControlType.Boolean,
        title: "Show CTA",
        defaultValue: false,
    },
    ctaLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Contact us",
        hidden: (p: any) => !p.showCTA,
    },
    ctaUrl: {
        type: ControlType.Link,
        title: "URL",
        hidden: (p: any) => !p.showCTA,
    },
    ctaStyle: {
        type: ControlType.Enum,
        title: "Style",
        defaultValue: "filled",
        options: ["text", "filled", "outline", "pill", "icon"],
        optionTitles: [
            "Text Link",
            "Filled",
            "Outline",
            "Accent Pill",
            "Icon Button",
        ],
        hidden: (p: any) => !p.showCTA,
    },
    ctaNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (p: any) => !p.showCTA,
    },
    ctaShowIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: false,
        hidden: (p: any) => !p.showCTA,
    },
    ctaIconName: {
        type: ControlType.Enum,
        title: "Icon",
        options: iconOptions,
        defaultValue: "message",
        hidden: (p: any) => !p.showCTA || !p.ctaShowIcon,
    },
    ctaIconPlacement: {
        type: ControlType.Enum,
        title: "Icon Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        hidden: (p: any) => !p.showCTA || !p.ctaShowIcon,
    },
    ctaBg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111418",
        hidden: (p: any) => !p.showCTA,
    },
    ctaText: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
        hidden: (p: any) => !p.showCTA,
    },
    ctaBorderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#111418",
        hidden: (p: any) => !p.showCTA || p.ctaStyle !== "outline",
    },
    ctaHoverBg: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#2b2f36",
        hidden: (p: any) => !p.showCTA,
    },
    ctaHoverText: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#ffffff",
        hidden: (p: any) => !p.showCTA,
    },
    ctaRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 999,
        step: 1,
        hidden: (p: any) => !p.showCTA,
    },
    ctaPaddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        hidden: (p: any) => !p.showCTA,
    },
    ctaPaddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 9,
        min: 0,
        max: 30,
        step: 1,
        hidden: (p: any) => !p.showCTA,
    },

    // ---- 13. SERVICE STATUS ----
    enableServiceStatus: {
        type: ControlType.Boolean,
        title: "Enable Service Status",
        defaultValue: false,
    },
    serviceStatusType: {
        type: ControlType.Enum,
        title: "Type",
        defaultValue: "operational",
        options: [
            "operational",
            "info",
            "maintenance",
            "degraded",
            "partial",
            "major",
            "custom",
        ],
        optionTitles: [
            "Operational",
            "Information",
            "Maintenance",
            "Degraded",
            "Partial Outage",
            "Major Outage",
            "Custom",
        ],
        hidden: (p: any) => !p.enableServiceStatus,
    },
    serviceStatusLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "All systems operational",
        hidden: (p: any) => !p.enableServiceStatus,
    },
    serviceStatusMessage: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "",
        hidden: (p: any) => !p.enableServiceStatus,
    },
    serviceStatusUrl: {
        type: ControlType.Link,
        title: "Status Page URL",
        hidden: (p: any) => !p.enableServiceStatus,
    },
    serviceLastUpdated: {
        type: ControlType.String,
        title: "Updated Text",
        defaultValue: "Updated just now",
        hidden: (p: any) => !p.enableServiceStatus,
    },
    serviceShowIndicator: {
        type: ControlType.Boolean,
        title: "Show Indicator",
        defaultValue: true,
        hidden: (p: any) => !p.enableServiceStatus,
    },
    serviceShowTimestamp: {
        type: ControlType.Boolean,
        title: "Show Timestamp",
        defaultValue: false,
        hidden: (p: any) => !p.enableServiceStatus,
    },

    // ---- 14. AVAILABILITY ----
    showAvailability: {
        type: ControlType.Boolean,
        title: "Show Availability",
        defaultValue: false,
    },
    availabilityState: {
        type: ControlType.Enum,
        title: "State",
        defaultValue: "available",
        options: [
            "available",
            "limited",
            "booked",
            "waitlist",
            "emergency",
            "custom",
        ],
        optionTitles: [
            "Available",
            "Limited",
            "Fully Booked",
            "Waitlist",
            "Emergency Only",
            "Custom",
        ],
        hidden: (p: any) => !p.showAvailability,
    },
    availabilityMessage: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "Accepting new projects",
        hidden: (p: any) => !p.showAvailability,
    },
    availabilityQty: {
        type: ControlType.Number,
        title: "Quantity",
        defaultValue: 3,
        min: 0,
        max: 999,
        step: 1,
        hidden: (p: any) =>
            !p.showAvailability || p.availabilityState !== "limited",
    },
    availabilityUnit: {
        type: ControlType.String,
        title: "Unit",
        defaultValue: "spots",
        hidden: (p: any) =>
            !p.showAvailability || p.availabilityState !== "limited",
    },
    availabilityNextDate: {
        type: ControlType.String,
        title: "Next Available",
        defaultValue: "",
        hidden: (p: any) => !p.showAvailability,
    },
    availabilityCtaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Get in touch",
        hidden: (p: any) => !p.showAvailability,
    },
    availabilityCtaUrl: {
        type: ControlType.Link,
        title: "CTA URL",
        hidden: (p: any) => !p.showAvailability,
    },

    // ---- 15. PLACEMENT ----
    placement: {
        type: ControlType.Enum,
        title: "Placement",
        defaultValue: "inline",
        options: [
            "inline",
            "aboveNav",
            "belowNav",
            "stickyTop",
            "fixedTop",
            "stickyBottom",
            "fixedBottom",
        ],
        optionTitles: [
            "Inline",
            "Above Navigation",
            "Below Navigation",
            "Sticky Top",
            "Fixed Top",
            "Sticky Bottom",
            "Fixed Bottom",
        ],
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 1000,
        min: 0,
        max: 100000,
        step: 1,
        hidden: (p: any) =>
            p.placement === "inline" ||
            p.placement === "aboveNav" ||
            p.placement === "belowNav",
    },
    topOffset: {
        type: ControlType.Number,
        title: "Top Offset",
        defaultValue: 0,
        min: 0,
        max: 400,
        step: 1,
        hidden: (p: any) =>
            p.placement !== "stickyTop" && p.placement !== "fixedTop",
    },
    bottomOffset: {
        type: ControlType.Number,
        title: "Bottom Offset",
        defaultValue: 0,
        min: 0,
        max: 400,
        step: 1,
        hidden: (p: any) =>
            p.placement !== "stickyBottom" && p.placement !== "fixedBottom",
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Full Viewport Width",
        defaultValue: true,
    },
    maxContentWidth: {
        type: ControlType.Number,
        title: "Max Content Width",
        defaultValue: 1200,
        min: 0,
        max: 2400,
        step: 10,
    },
    safeArea: {
        type: ControlType.Boolean,
        title: "Safe-area Padding",
        defaultValue: true,
    },
    previewFixed: {
        type: ControlType.Boolean,
        title: "Preview Fixed in Canvas",
        defaultValue: false,
        hidden: (p: any) =>
            p.placement === "inline" ||
            p.placement === "aboveNav" ||
            p.placement === "belowNav",
    },
    addSpacer: {
        type: ControlType.Boolean,
        title: "Add Page Spacer",
        defaultValue: false,
        hidden: (p: any) =>
            p.placement !== "fixedTop" && p.placement !== "fixedBottom",
    },
    spacerHeight: {
        type: ControlType.Number,
        title: "Spacer Height",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        hidden: (p: any) => !p.addSpacer,
    },

    // ---- 16. DISMISSAL ----
    dismissible: {
        type: ControlType.Boolean,
        title: "Dismissible",
        defaultValue: false,
    },
    showCloseButton: {
        type: ControlType.Boolean,
        title: "Show Close Button",
        defaultValue: true,
        hidden: (p: any) => !p.dismissible,
    },
    closeLabel: {
        type: ControlType.String,
        title: "Close Aria Label",
        defaultValue: "Dismiss this banner",
        hidden: (p: any) => !p.dismissible,
    },
    closePosition: {
        type: ControlType.Enum,
        title: "Close Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        hidden: (p: any) => !p.dismissible,
    },
    rememberDismissal: {
        type: ControlType.Enum,
        title: "Remember",
        defaultValue: "session",
        options: ["none", "session", "days"],
        optionTitles: ["Page View Only", "Browser Session", "Number of Days"],
        hidden: (p: any) => !p.dismissible,
    },
    storageKey: {
        type: ControlType.String,
        title: "Storage Key",
        defaultValue: "contact-strip",
        hidden: (p: any) => !p.dismissible || p.rememberDismissal === "none",
    },
    storageVersion: {
        type: ControlType.String,
        title: "Storage Version",
        defaultValue: "1",
        hidden: (p: any) => !p.dismissible || p.rememberDismissal === "none",
    },
    dismissDays: {
        type: ControlType.Number,
        title: "Memory (days)",
        defaultValue: 7,
        min: 1,
        max: 365,
        step: 1,
        hidden: (p: any) => !p.dismissible || p.rememberDismissal !== "days",
    },
    resetInPreview: {
        type: ControlType.Boolean,
        title: "Reset in Preview",
        defaultValue: true,
        hidden: (p: any) => !p.dismissible,
    },

    // ---- 17. MOBILE DRAWER ----
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        defaultValue: 640,
        min: 320,
        max: 1024,
        step: 10,
    },
    mobileCollapse: {
        type: ControlType.Enum,
        title: "Collapse",
        defaultValue: "iconmenu",
        options: [
            "never",
            "iconrow",
            "iconmenu",
            "contactbtn",
            "hidesecondary",
        ],
        optionTitles: [
            "Never",
            "Icon Row",
            "Status + Menu",
            "Contact Button",
            "Hide Secondary",
        ],
    },
    mobilePrimaryContact: {
        type: ControlType.Enum,
        title: "Primary Contact",
        defaultValue: "phone",
        options: ["phone", "email", "messaging", "cta"],
        optionTitles: ["Phone", "Email", "Messaging", "CTA"],
    },
    keepStatusVisible: {
        type: ControlType.Boolean,
        title: "Keep Status Visible",
        defaultValue: true,
    },
    showDrawer: {
        type: ControlType.Boolean,
        title: "Show Drawer",
        defaultValue: true,
        hidden: (p: any) => p.mobileCollapse === "never",
    },
    drawerTriggerStyle: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["icon", "labelled"],
        optionTitles: ["Icon Only", "Icon + Label"],
        defaultValue: "labelled",
        hidden: (p: any) => !p.showDrawer,
    },
    drawerPosition: {
        type: ControlType.Enum,
        title: "Drawer Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "bottom",
        hidden: (p: any) => !p.showDrawer,
    },
    drawerBg: {
        type: ControlType.Color,
        title: "Drawer BG",
        defaultValue: "#ffffff",
        optional: true,
        hidden: (p: any) => !p.showDrawer,
    },
    drawerMaxHeight: {
        type: ControlType.Number,
        title: "Drawer Max Height",
        defaultValue: 420,
        min: 120,
        max: 900,
        step: 10,
        hidden: (p: any) => !p.showDrawer,
    },
    closeDrawerOnClick: {
        type: ControlType.Boolean,
        title: "Close on Link Click",
        defaultValue: true,
        hidden: (p: any) => !p.showDrawer,
    },
    hideLocationMobile: {
        type: ControlType.Boolean,
        title: "Hide Location (mobile)",
        defaultValue: false,
    },
    hideConfidenceMobile: {
        type: ControlType.Boolean,
        title: "Hide Confidence (mobile)",
        defaultValue: false,
    },
    mobilePaddingX: {
        type: ControlType.Number,
        title: "Mobile Padding X",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
    },
    drawerTitle: {
        type: ControlType.String,
        title: "Drawer Title",
        defaultValue: "Contact & hours",
        hidden: (p: any) => !p.showDrawer,
    },

    // ---- 20. THEME / BACKGROUND ----
    themePreset: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "light",
        options: [
            "light",
            "dark",
            "neutral",
            "brand",
            "contrast",
            "borderless",
            "glass",
            "professional",
            "warm",
            "custom",
        ],
        optionTitles: [
            "Clean Light",
            "Clean Dark",
            "Soft Neutral",
            "Brand Accent",
            "High Contrast",
            "Minimal Borderless",
            "Glass",
            "Professional",
            "Warm Local",
            "Custom",
        ],
    },
    bgMode: {
        type: ControlType.Enum,
        title: "Background",
        defaultValue: "",
        options: ["", "solid", "gradient", "transparent", "glass"],
        optionTitles: [
            "Theme Default",
            "Solid",
            "Gradient",
            "Transparent",
            "Glass",
        ],
    },
    bgPrimary: {
        type: ControlType.Color,
        title: "Primary",
        defaultValue: "#ffffff",
        hidden: (p: any) =>
            p.bgMode !== "solid" &&
            p.bgMode !== "gradient" &&
            p.themePreset !== "custom",
    },
    bgSecondary: {
        type: ControlType.Color,
        title: "Secondary",
        defaultValue: "#f2f4f7",
        hidden: (p: any) => p.bgMode !== "gradient",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 90,
        min: 0,
        max: 360,
        step: 1,
        hidden: (p: any) => p.bgMode !== "gradient",
    },
    bgOpacity: {
        type: ControlType.Number,
        title: "BG Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#e5e7eb",
        hidden: (p: any) => p.themePreset !== "custom",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 6,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
    },
    shadowEnabled: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
    },
    customShadow: {
        type: ControlType.String,
        title: "Shadow CSS",
        defaultValue: "0 1px 2px rgba(16,24,40,0.08)",
        hidden: (p: any) => !p.shadowEnabled || p.themePreset !== "custom",
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        hidden: (p: any) => p.bgMode !== "glass" && p.themePreset !== "glass",
    },
    customText: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111418",
        hidden: (p: any) => p.themePreset !== "custom",
    },
    customMuted: {
        type: ControlType.Color,
        title: "Muted Color",
        defaultValue: "#6b7280",
        hidden: (p: any) => p.themePreset !== "custom",
    },

    // ---- 21. TYPOGRAPHY ----
    statusFont: {
        type: FontControl,
        title: "Status Font",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.01em",
        },
    } as any,
    hoursFont: {
        type: FontControl,
        title: "Hours Font",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.01em",
        },
    } as any,
    contactFont: {
        type: FontControl,
        title: "Contact Font",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.01em",
        },
    } as any,
    linkFont: {
        type: FontControl,
        title: "Quick Link Font",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.006em",
        },
    } as any,
    ctaFont: {
        type: FontControl,
        title: "CTA Font",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.01em",
        },
    } as any,
    drawerTitleFont: {
        type: FontControl,
        title: "Drawer Title Font",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.01em",
        },
    } as any,
    labelFont: {
        type: FontControl,
        title: "Label / Location Font",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.006em",
        },
    } as any,

    // ---- 23. INTERACTION ----
    enableHover: {
        type: ControlType.Boolean,
        title: "Hover Effects",
        defaultValue: true,
    },
    hoverStyle: {
        type: ControlType.Enum,
        title: "Hover Style",
        defaultValue: "lift",
        options: ["subtle", "lift", "underline", "glow"],
        optionTitles: ["Subtle", "Lift", "Underline", "Glow"],
        hidden: (p: any) => !p.enableHover,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition (ms)",
        defaultValue: 180,
        min: 0,
        max: 800,
        step: 10,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "ease",
            "ease-in-out",
            "linear",
            "cubic-bezier(0.4,0,0.2,1)",
            "cubic-bezier(0.22,1,0.36,1)",
        ],
        optionTitles: ["Ease", "Ease In Out", "Linear", "Smooth", "Spring"],
        defaultValue: "cubic-bezier(0.22,1,0.36,1)",
    },
    drawerAnimation: {
        type: ControlType.Enum,
        title: "Drawer Animation",
        options: ["none", "fade", "slide"],
        optionTitles: ["None", "Fade", "Slide"],
        defaultValue: "slide",
    },
    drawerAnimDuration: {
        type: ControlType.Number,
        title: "Drawer Anim (ms)",
        defaultValue: 220,
        min: 0,
        max: 800,
        step: 10,
    },
    animateStatusChange: {
        type: ControlType.Boolean,
        title: "Animate Status Change",
        defaultValue: true,
    },

    // ---- ANIMATION / PREMIUM ----
    animateEntrance: {
        type: ControlType.Boolean,
        title: "Entrance Animation",
        defaultValue: true,
    },
    entranceStyle: {
        type: ControlType.Enum,
        title: "Entrance",
        defaultValue: "slideDown",
        options: ["fade", "slideDown", "slideUp", "scale", "blur"],
        optionTitles: ["Fade", "Slide Down", "Slide Up", "Scale", "Blur"],
        hidden: (p: any) => !p.animateEntrance,
    },
    entranceDuration: {
        type: ControlType.Number,
        title: "Entrance (ms)",
        defaultValue: 520,
        min: 100,
        max: 1600,
        step: 20,
        hidden: (p: any) => !p.animateEntrance,
    },
    entranceStagger: {
        type: ControlType.Number,
        title: "Stagger (ms)",
        defaultValue: 70,
        min: 0,
        max: 200,
        step: 5,
        hidden: (p: any) => !p.animateEntrance,
    },
    statusPulse: {
        type: ControlType.Boolean,
        title: "Pulse When Open",
        defaultValue: true,
    },
    shimmerOnLoad: {
        type: ControlType.Boolean,
        title: "Shimmer On Load",
        defaultValue: true,
    },
    gradientAccent: {
        type: ControlType.Boolean,
        title: "Animated Accent Line",
        defaultValue: false,
    },
    accentPosition: {
        type: ControlType.Enum,
        title: "Accent Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "top",
        hidden: (p: any) => !p.gradientAccent,
    },
    accentColorA: {
        type: ControlType.Color,
        title: "Accent Color A",
        defaultValue: "#6366f1",
        hidden: (p: any) => !p.gradientAccent,
    },
    accentColorB: {
        type: ControlType.Color,
        title: "Accent Color B",
        defaultValue: "#22d3ee",
        hidden: (p: any) => !p.gradientAccent,
    },
    enableCopy: {
        type: ControlType.Boolean,
        title: "Copy Buttons",
        defaultValue: false,
    },
    copiedLabel: {
        type: ControlType.String,
        title: "Copied Label",
        defaultValue: "Copied!",
        hidden: (p: any) => !p.enableCopy,
    },
    showLiveClock: {
        type: ControlType.Boolean,
        title: "Live Clock",
        defaultValue: false,
    },
    clockLabel: {
        type: ControlType.String,
        title: "Clock Label",
        defaultValue: "",
        hidden: (p: any) => !p.showLiveClock,
    },
    autoHideOnScroll: {
        type: ControlType.Boolean,
        title: "Auto-hide On Scroll",
        defaultValue: false,
        hidden: (p: any) =>
            p.placement === "inline" ||
            p.placement === "aboveNav" ||
            p.placement === "belowNav",
    },

    // ---- 24. ACCESSIBILITY ----
    liveRegion: {
        type: ControlType.Boolean,
        title: "Announce Status Changes",
        defaultValue: true,
    },
    statusAriaPrefix: {
        type: ControlType.String,
        title: "Status Aria Prefix",
        defaultValue: "Business status:",
        hidden: (p: any) => !p.liveRegion,
    },

    // ---- 25. ADVANCED ----
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 13,
        min: 0,
        max: 40,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 4,
        max: 60,
        step: 1,
    },
    showDividers: {
        type: ControlType.Boolean,
        title: "Section Dividers",
        defaultValue: true,
    },
} as any)
