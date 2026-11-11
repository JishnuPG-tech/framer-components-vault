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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

/* ==========================================================================
   TYPES
   ========================================================================== */

interface Stop {
    prefix: string
    location: string
    dateTime: number
    duration: number
    durationUnit: "minutes" | "hours"
}

interface FramerFontSettings {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
    fontStyle?: React.CSSProperties["fontStyle"]
    textTransform?: React.CSSProperties["textTransform"]
    textAlign?: React.CSSProperties["textAlign"]
    variant?: string
}

interface TypographySettings {
    prefix: FramerFontSettings
    location: FramerFontSettings
    date: FramerFontSettings
    time: FramerFontSettings
    countdown: FramerFontSettings
    duration: FramerFontSettings
    button: FramerFontSettings
}

interface ColorSettings {
    background: string
    surface: string
    border: string
    prefix: string
    location: string
    date: string
    time: string
    countdown: string
    duration: string
    buttonText: string
    buttonBackground: string
    buttonBorder: string
    navigation: string
    navigationDisabled: string
    accent: string
}

interface DisplaySettings {
    showPrefix: boolean
    showLocation: boolean
    showDate: boolean
    showTime: boolean
    showDuration: boolean
    showCountdown: boolean
}

interface CountdownSettings {
    format: "hoursMinutes" | "minutesSeconds" | "hoursMinutesSeconds"
}

interface CalendarSettings {
    show: boolean
    buttonText: string
}

interface NavigationSettings {
    show: boolean
    position: "top" | "bottom" | "side"
    gap: number
    iconSize: number
    rightInset: number
}

interface LayoutSettings {
    alignment: "left" | "center"
    cardStyle: "soft" | "solid" | "outline"
    radius: number
    padding: number
    verticalGap: number
    timeCountdownGap: number
}

interface AccentSettings {
    show: boolean
    width: number
    radius: number
}

interface Props {
    stops: Stop[]

    display: DisplaySettings
    countdown: CountdownSettings
    calendar: CalendarSettings
    navigation: NavigationSettings
    layout: LayoutSettings
    accent: AccentSettings

    typography: TypographySettings
    colors: ColorSettings
}

/* ==========================================================================
   DEFAULTS
   ========================================================================== */

const now = Date.now()

const DEFAULT_STOPS: Stop[] = [
    {
        prefix: "First stop",
        location: "Myka house",
        dateTime: now,
        duration: 30,
        durationUnit: "minutes",
    },
    {
        prefix: "Up next",
        location: "Lagos Island",
        dateTime: now + 30 * 60 * 1000,
        duration: 45,
        durationUnit: "minutes",
    },
    {
        prefix: "Last stop",
        location: "Victoria Island",
        dateTime: now + 75 * 60 * 1000,
        duration: 60,
        durationUnit: "minutes",
    },
]

const DEFAULT_DISPLAY: DisplaySettings = {
    showPrefix: true,
    showLocation: true,
    showDate: true,
    showTime: true,
    showDuration: true,
    showCountdown: true,
}

const DEFAULT_COUNTDOWN: CountdownSettings = {
    format: "hoursMinutes",
}

const DEFAULT_CALENDAR: CalendarSettings = {
    show: true,
    buttonText: "Add all events to calendar",
}

const DEFAULT_NAVIGATION: NavigationSettings = {
    show: true,
    position: "bottom",
    gap: 4,
    iconSize: 24,
    rightInset: 0,
}

const DEFAULT_LAYOUT: LayoutSettings = {
    alignment: "left",
    cardStyle: "soft",
    radius: 24,
    padding: 24,
    verticalGap: 10,
    timeCountdownGap: 14,
}

const DEFAULT_ACCENT: AccentSettings = {
    show: true,
    width: 4,
    radius: 999,
}

const DEFAULT_TYPOGRAPHY: TypographySettings = {
    prefix: {
        fontFamily: "Inter",
        fontSize: 13,
        lineHeight: 1.2,
        fontWeight: 600,
        letterSpacing: "-0.01em",
    },

    location: {
        fontFamily: "Inter",
        fontSize: 24,
        lineHeight: 1.12,
        fontWeight: 600,
        letterSpacing: "-0.025em",
    },

    date: {
        fontFamily: "Inter",
        fontSize: 13,
        lineHeight: 1.3,
        fontWeight: 400,
    },

    time: {
        fontFamily: "Inter",
        fontSize: 15,
        lineHeight: 1.2,
        fontWeight: 500,
    },

    countdown: {
        fontFamily: "Inter",
        fontSize: 15,
        lineHeight: 1.2,
        fontWeight: 500,
    },

    duration: {
        fontFamily: "Inter",
        fontSize: 15,
        lineHeight: 1.2,
        fontWeight: 500,
    },

    button: {
        fontFamily: "Inter",
        fontSize: 14,
        lineHeight: 1.2,
        fontWeight: 600,
    },
}

const DEFAULT_COLORS: ColorSettings = {
    background: "#F5F5F7",
    surface: "#FFFFFF",
    border: "rgba(0,0,0,0.08)",

    prefix: "#007AFF",
    location: "#1D1D1F",
    date: "#86868B",
    time: "#1D1D1F",
    countdown: "#86868B",
    duration: "#86868B",

    buttonText: "#FFFFFF",
    buttonBackground: "#007AFF",
    buttonBorder: "rgba(0,0,0,0.08)",

    navigation: "#1D1D1F",
    navigationDisabled: "rgba(60,60,67,0.25)",

    accent: "#007AFF",
}

/* ==========================================================================
   FONT HELPERS
   ========================================================================== */

function resolveFontWeight(
    weight: unknown,
    fallback: number = 400
): number | string {
    if (typeof weight === "number" && Number.isFinite(weight)) {
        return weight
    }

    if (typeof weight === "string") {
        const trimmed = weight.trim()

        if (/^\d+$/.test(trimmed)) {
            const numericWeight = Number(trimmed)

            if (Number.isFinite(numericWeight)) {
                return numericWeight
            }
        }

        const normalized = trimmed
            .toLowerCase()
            .replace(/[-_]/g, " ")
            .replace(/\s+/g, " ")
            .trim()

        const weightMap: Record<string, number> = {
            thin: 100,
            hairline: 100,

            "extra light": 200,
            extralight: 200,
            "ultra light": 200,
            ultralight: 200,

            light: 300,

            regular: 400,
            normal: 400,
            book: 400,
            roman: 400,

            medium: 500,

            semibold: 600,
            "semi bold": 600,
            "demi bold": 600,
            demibold: 600,

            bold: 700,

            extrabold: 800,
            "extra bold": 800,
            "ultra bold": 800,
            ultrabold: 800,

            black: 900,
            heavy: 900,
        }

        if (normalized in weightMap) {
            return weightMap[normalized]
        }
    }

    return fallback
}

function getFontStyles(
    font: FramerFontSettings,
    systemFont: string,
    fallbackWeight: number = 400
): React.CSSProperties {
    return {
        fontFamily: font?.fontFamily || systemFont,
        fontSize: font?.fontSize,
        lineHeight: font?.lineHeight,
        fontWeight: resolveFontWeight(font?.fontWeight, fallbackWeight),
        letterSpacing: font?.letterSpacing,
        fontStyle: font?.fontStyle,
        textTransform: font?.textTransform,
    }
}

/* ==========================================================================
   DATE / TIME HELPERS
   ========================================================================== */

function getTimestamp(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value
    }

    if (value instanceof Date) {
        return value.getTime()
    }

    const parsed = new Date(value as string | number).getTime()

    return Number.isFinite(parsed) ? parsed : 0
}

function getDurationMs(stop: Stop): number {
    const duration = Math.max(0, Number(stop.duration) || 0)

    if (stop.durationUnit === "hours") {
        return duration * 60 * 60 * 1000
    }

    return duration * 60 * 1000
}

function getStart(stop: Stop): number {
    return getTimestamp(stop.dateTime)
}

function getEnd(stop: Stop): number {
    return getStart(stop) + getDurationMs(stop)
}

/* ==========================================================================
   FORMATTERS
   ========================================================================== */

function formatDate(value: number): string {
    const date = new Date(getTimestamp(value))

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date)
}

function formatTime(value: number): string {
    const date = new Date(getTimestamp(value))

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date)
}

function formatDuration(stop: Stop): string {
    const duration = Math.max(0, Number(stop.duration) || 0)

    if (stop.durationUnit === "hours") {
        return `${duration}h`
    }

    return `${duration}m`
}

function getCountdownMs(stop: Stop, currentTime: number): number {
    const start = getStart(stop)
    const end = getEnd(stop)

    if (currentTime < start) {
        return Math.max(0, start - currentTime)
    }

    return Math.max(0, end - currentTime)
}

function formatCountdown(
    milliseconds: number,
    format: "hoursMinutes" | "minutesSeconds" | "hoursMinutesSeconds"
): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))

    const hours = Math.floor(totalSeconds / 3600)

    const minutes = Math.floor((totalSeconds % 3600) / 60)

    const seconds = totalSeconds % 60

    if (format === "minutesSeconds") {
        const totalMinutes = Math.floor(totalSeconds / 60)

        return `${String(totalMinutes).padStart(2, "0")}m:${String(
            seconds
        ).padStart(2, "0")}s`
    }

    if (format === "hoursMinutesSeconds") {
        return `${String(hours).padStart(2, "0")}h:${String(minutes).padStart(
            2,
            "0"
        )}m:${String(seconds).padStart(2, "0")}s`
    }

    return `${String(hours).padStart(2, "0")}h:${String(minutes).padStart(
        2,
        "0"
    )}m`
}

/* ==========================================================================
   CHRONOLOGICAL SORTING
   ========================================================================== */

function sortStopsChronologically(stops: Stop[]): Stop[] {
    return stops
        .map((stop, originalIndex) => ({
            stop,
            originalIndex,
        }))
        .sort((a, b) => {
            const aTime = getStart(a.stop)
            const bTime = getStart(b.stop)

            const aValid = aTime > 0
            const bValid = bTime > 0

            if (!aValid && !bValid) {
                return a.originalIndex - b.originalIndex
            }

            if (!aValid) {
                return 1
            }

            if (!bValid) {
                return -1
            }

            const dateDifference = aTime - bTime

            if (dateDifference !== 0) {
                return dateDifference
            }

            return a.originalIndex - b.originalIndex
        })
        .map((item) => item.stop)
}

/* ==========================================================================
   CALENDAR
   ========================================================================== */

function icsDate(value: number): string {
    const date = new Date(getTimestamp(value))

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")

    return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

function escapeICS(value: string): string {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;")
}

function createICS(stops: Stop[]): string {
    const chronologicalStops = sortStopsChronologically(stops)

    const events = chronologicalStops
        .map((stop, index) => {
            const start = getStart(stop)

            if (!start) {
                return ""
            }

            const end = getEnd(stop)

            return [
                "BEGIN:VEVENT",
                `UID:location-countdown-${Date.now()}-${index}`,
                `DTSTART:${icsDate(start)}`,
                `DTEND:${icsDate(end)}`,
                `SUMMARY:${escapeICS(stop.location)}`,
                `DESCRIPTION:${escapeICS(stop.prefix)}`,
                "END:VEVENT",
            ].join("\r\n")
        })
        .filter(Boolean)
        .join("\r\n")

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Location Countdown//Framer//EN",
        "CALSCALE:GREGORIAN",
        events,
        "END:VCALENDAR",
    ].join("\r\n")
}

function addAllToCalendar(stops: Stop[]) {
    if (typeof window === "undefined") {
        return
    }

    const blob = new Blob([createICS(stops)], {
        type: "text/calendar;charset=utf-8",
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")

    link.href = url
    link.download = "city-loop.ics"

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    window.setTimeout(() => {
        URL.revokeObjectURL(url)
    }, 1000)
}

/* ==========================================================================
   ICONS
   ========================================================================== */

function ChevronLeft({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M14.5 5L7.5 12L14.5 19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function ChevronRight({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M9.5 5L16.5 12L9.5 19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function CalendarIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <rect
                x="3"
                y="4"
                width="18"
                height="17"
                rx="4"
                stroke="currentColor"
                strokeWidth="1.8"
            />

            <path
                d="M8 2.5V6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />

            <path
                d="M16 2.5V6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />

            <path d="M3 9H21" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    )
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */

function NavigationButton({
    direction,
    disabled,
    onClick,
    size,
    colors,
}: {
    direction: "left" | "right"
    disabled: boolean
    onClick: () => void
    size: number
    colors: ColorSettings
}) {
    return (
        <button
            type="button"
            aria-label={direction === "left" ? "Previous stop" : "Next stop"}
            disabled={disabled}
            onClick={onClick}
            style={{
                width: size,
                height: size,
                padding: 0,
                margin: 0,
                border: "none",
                background: "transparent",
                color: disabled ? colors.navigationDisabled : colors.navigation,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "default" : "pointer",
                appearance: "none",
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {direction === "left" ? (
                <ChevronLeft size={size} />
            ) : (
                <ChevronRight size={size} />
            )}
        </button>
    )
}

/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function LocationCountdown(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()

    const {
        stops = DEFAULT_STOPS,

        display = DEFAULT_DISPLAY,
        countdown = DEFAULT_COUNTDOWN,
        calendar = DEFAULT_CALENDAR,
        navigation = DEFAULT_NAVIGATION,
        layout = DEFAULT_LAYOUT,
        accent = DEFAULT_ACCENT,

        typography = DEFAULT_TYPOGRAPHY,
        colors = DEFAULT_COLORS,
    } = props

    const safeStops =
        Array.isArray(stops) && stops.length > 0 ? stops : DEFAULT_STOPS

    const chronologicalStops = React.useMemo(() => {
        return sortStopsChronologically(safeStops)
    }, [safeStops])

    const [currentIndex, setCurrentIndex] = React.useState(0)

    const [manualIndex, setManualIndex] = React.useState<number | null>(null)

    const [currentTime, setCurrentTime] = React.useState(() =>
        isStaticRenderer
            ? getStart(chronologicalStops[0] || DEFAULT_STOPS[0])
            : Date.now()
    )

    /*
     * Framer's static renderer must remain visually useful while avoiding
     * browser timers. The component therefore keeps its normal rendered
     * output in static mode but does not start a live countdown interval.
     */
    React.useEffect(() => {
        if (isStaticRenderer) {
            return
        }

        const timer = window.setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000)

        return () => {
            window.clearInterval(timer)
        }
    }, [isStaticRenderer])

    React.useEffect(() => {
        if (currentIndex >= chronologicalStops.length) {
            setCurrentIndex(Math.max(0, chronologicalStops.length - 1))
        }

        if (manualIndex !== null && manualIndex >= chronologicalStops.length) {
            setManualIndex(Math.max(0, chronologicalStops.length - 1))
        }
    }, [chronologicalStops.length, currentIndex, manualIndex])

    React.useEffect(() => {
        if (manualIndex !== null) {
            return
        }

        if (currentIndex >= chronologicalStops.length - 1) {
            return
        }

        const active = chronologicalStops[currentIndex]

        if (!active) {
            return
        }

        const end = getEnd(active)

        if (currentTime >= end) {
            setCurrentIndex((index) =>
                Math.min(index + 1, chronologicalStops.length - 1)
            )
        }
    }, [currentTime, currentIndex, manualIndex, chronologicalStops])

    const selectedIndex = manualIndex !== null ? manualIndex : currentIndex

    const activeStop =
        chronologicalStops[selectedIndex] || chronologicalStops[0]

    const countdownMs = activeStop ? getCountdownMs(activeStop, currentTime) : 0

    const canGoBack = selectedIndex > 0

    const canGoForward = selectedIndex < chronologicalStops.length - 1

    function goPrevious() {
        if (!canGoBack) {
            return
        }

        const nextIndex = selectedIndex - 1

        setManualIndex(nextIndex)
        setCurrentIndex(nextIndex)
    }

    function goNext() {
        if (!canGoForward) {
            return
        }

        const nextIndex = selectedIndex + 1

        setManualIndex(nextIndex)
        setCurrentIndex(nextIndex)
    }

    const systemFont =
        "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif"

    const cardBackground =
        layout.cardStyle === "soft"
            ? colors.background
            : layout.cardStyle === "solid"
              ? colors.surface
              : "transparent"

    const cardBorder =
        layout.cardStyle === "outline" ? `1px solid ${colors.border}` : "none"

    const alignItems = layout.alignment === "center" ? "center" : "flex-start"

    const textAlign = layout.alignment === "center" ? "center" : "left"

    /* ======================================================================
       NAVIGATION ELEMENT
       ====================================================================== */

    const navigationElement =
        navigation.show && chronologicalStops.length > 1 ? (
            <div
                role="group"
                aria-label="Stop navigation"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: navigation.gap,
                    width: "fit-content",
                    height: navigation.iconSize,
                    flexShrink: 0,
                }}
            >
                <NavigationButton
                    direction="left"
                    disabled={!canGoBack}
                    onClick={goPrevious}
                    size={navigation.iconSize}
                    colors={colors}
                />

                <NavigationButton
                    direction="right"
                    disabled={!canGoForward}
                    onClick={goNext}
                    size={navigation.iconSize}
                    colors={colors}
                />
            </div>
        ) : null

    /* ======================================================================
       CONTENT
       ====================================================================== */

    const content = activeStop ? (
        <div
            style={{
                width: "100%",
                minWidth: 0,
                display: "flex",
                alignItems: "stretch",
                gap: accent.show ? 14 : 0,
            }}
        >
            {accent.show && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: accent.width,
                        margin: 0,
                        padding: 0,
                        borderRadius: accent.radius,
                        background: colors.accent,
                        zIndex: 2,
                    }}
                />
            )}

            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems,
                    textAlign,
                    gap: layout.verticalGap,
                }}
            >
                {display.showPrefix && activeStop.prefix && (
                    <div
                        style={{
                            ...getFontStyles(
                                typography.prefix,
                                systemFont,
                                600
                            ),
                            color: colors.prefix,
                            width: "100%",
                        }}
                    >
                        {activeStop.prefix}
                    </div>
                )}

                {display.showLocation && activeStop.location && (
                    <div
                        style={{
                            ...getFontStyles(
                                typography.location,
                                systemFont,
                                600
                            ),
                            color: colors.location,
                            width: "100%",
                            overflowWrap: "anywhere",
                        }}
                    >
                        {activeStop.location}
                    </div>
                )}

                {display.showDate && (
                    <div
                        style={{
                            ...getFontStyles(typography.date, systemFont, 400),
                            color: colors.date,
                            width: "100%",
                        }}
                    >
                        {formatDate(getStart(activeStop))}
                    </div>
                )}

                {(display.showTime ||
                    display.showDuration ||
                    display.showCountdown) && (
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent:
                                layout.alignment === "center"
                                    ? "center"
                                    : "flex-start",
                            gap: layout.timeCountdownGap,
                            flexWrap: "wrap",
                        }}
                    >
                        {display.showTime && (
                            <div
                                style={{
                                    ...getFontStyles(
                                        typography.time,
                                        systemFont,
                                        500
                                    ),
                                    color: colors.time,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {formatTime(getStart(activeStop))}
                            </div>
                        )}

                        {display.showDuration && (
                            <div
                                style={{
                                    ...getFontStyles(
                                        typography.duration,
                                        systemFont,
                                        500
                                    ),
                                    color: colors.duration,
                                    whiteSpace: "nowrap",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {formatDuration(activeStop)}
                            </div>
                        )}

                        {display.showCountdown && (
                            <div
                                aria-live={
                                    countdown.format === "hoursMinutes"
                                        ? "polite"
                                        : undefined
                                }
                                style={{
                                    ...getFontStyles(
                                        typography.countdown,
                                        systemFont,
                                        500
                                    ),
                                    color: colors.countdown,
                                    whiteSpace: "nowrap",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {formatCountdown(countdownMs, countdown.format)}
                            </div>
                        )}
                    </div>
                )}

                {calendar.show && (
                    <button
                        type="button"
                        aria-label={calendar.buttonText}
                        onClick={() => addAllToCalendar(chronologicalStops)}
                        style={{
                            ...getFontStyles(
                                typography.button,
                                systemFont,
                                600
                            ),
                            marginTop: 8,
                            minHeight: 44,
                            padding: "11px 16px",
                            borderRadius: 999,
                            border: `1px solid ${colors.buttonBorder}`,
                            background: colors.buttonBackground,
                            color: colors.buttonText,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            cursor: "pointer",
                            maxWidth: "100%",
                            appearance: "none",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        <CalendarIcon />

                        <span
                            style={{
                                ...getFontStyles(
                                    typography.button,
                                    systemFont,
                                    600
                                ),
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {calendar.buttonText}
                        </span>
                    </button>
                )}
            </div>
        </div>
    ) : null

    /* ======================================================================
       RENDER
       ====================================================================== */

    return (
        <div
            role="region"
            aria-label={
                activeStop?.location
                    ? `Location countdown for ${activeStop.location}`
                    : "Location countdown"
            }
            aria-busy={false}
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                position: "relative",
                padding: layout.padding,
                borderRadius: layout.radius,
                background: cardBackground,
                border: cardBorder,
                boxShadow:
                    layout.cardStyle === "solid"
                        ? "0 8px 30px rgba(0,0,0,0.06)"
                        : "none",
                fontFamily: typography.location?.fontFamily || systemFont,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {navigation.show &&
                navigation.position === "top" &&
                chronologicalStops.length > 1 && (
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: navigation.gap,
                            height: navigation.iconSize,
                            marginBottom: 16,
                            flexShrink: 0,
                        }}
                    >
                        {navigationElement}
                    </div>
                )}

            {navigation.show &&
            navigation.position === "side" &&
            chronologicalStops.length > 1 ? (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        flex: 1,
                        minWidth: 0,
                        minHeight: 0,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            right: navigation.rightInset,
                            zIndex: 10,
                            display: "flex",
                            alignItems: "center",
                            gap: navigation.gap,
                            height: navigation.iconSize,
                        }}
                    >
                        {navigationElement}
                    </div>

                    {content}
                </div>
            ) : (
                <>
                    {content}

                    {navigation.show &&
                        navigation.position === "bottom" &&
                        chronologicalStops.length > 1 && (
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    gap: navigation.gap,
                                    height: navigation.iconSize,
                                    marginTop: 18,
                                    flexShrink: 0,
                                }}
                            >
                                {navigationElement}
                            </div>
                        )}
                </>
            )}
        </div>
    )
}

/* ==========================================================================
   DEFAULT PROPS
   ========================================================================== */

LocationCountdown.defaultProps = {
    stops: DEFAULT_STOPS,

    display: DEFAULT_DISPLAY,

    countdown: DEFAULT_COUNTDOWN,

    calendar: DEFAULT_CALENDAR,

    navigation: DEFAULT_NAVIGATION,

    layout: DEFAULT_LAYOUT,

    accent: DEFAULT_ACCENT,

    typography: DEFAULT_TYPOGRAPHY,

    colors: DEFAULT_COLORS,
}

/* ==========================================================================
   PROPERTY CONTROLS
   ========================================================================== */

addPropertyControls(LocationCountdown, {
    /* ======================================================================
       01 — STOPS
       ====================================================================== */

    stops: {
        type: ControlType.Array,

        title: "Stops",

        maxCount: 50,

        control: {
            type: ControlType.Object,

            controls: {
                prefix: {
                    type: ControlType.String,
                    title: "Prefix",
                    defaultValue: "First stop",
                },

                location: {
                    type: ControlType.String,
                    title: "Location",
                    defaultValue: "Myka house",
                },

                dateTime: {
                    type: ControlType.Date,
                    title: "Date & Time",
                    displayTime: true,
                    defaultValue: Date.now(),
                },

                duration: {
                    type: ControlType.Number,
                    title: "Duration",
                    defaultValue: 30,
                    min: 0,
                    max: 1440,
                    step: 1,
                    displayStepper: true,
                },

                durationUnit: {
                    type: ControlType.Enum,
                    title: "Unit",
                    defaultValue: "minutes",
                    options: ["minutes", "hours"],
                    optionTitles: ["Minutes", "Hours"],
                    displaySegmentedControl: true,
                },
            },
        },

        defaultValue: DEFAULT_STOPS,
    },

    /* ======================================================================
       02 — DISPLAY
       ====================================================================== */

    display: {
        type: ControlType.Object,

        title: "Display",

        buttonTitle: "Edit Display",

        controls: {
            showPrefix: {
                type: ControlType.Boolean,
                title: "Prefix",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },

            showLocation: {
                type: ControlType.Boolean,
                title: "Location",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },

            showDate: {
                type: ControlType.Boolean,
                title: "Date",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },

            showTime: {
                type: ControlType.Boolean,
                title: "Time",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },

            showDuration: {
                type: ControlType.Boolean,
                title: "Duration",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },

            showCountdown: {
                type: ControlType.Boolean,
                title: "Countdown",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
        },
    },

    /* ======================================================================
       03 — COUNTDOWN
       ====================================================================== */

    countdown: {
        type: ControlType.Object,

        title: "Countdown",

        buttonTitle: "Edit Countdown",

        controls: {
            format: {
                type: ControlType.Enum,

                title: "Format",

                defaultValue: "hoursMinutes",

                options: [
                    "hoursMinutes",
                    "minutesSeconds",
                    "hoursMinutesSeconds",
                ],

                optionTitles: ["00h:00m", "00m:00s", "00h:00m:00s"],
            },
        },
    },

    /* ======================================================================
       04 — CALENDAR
       ====================================================================== */

    calendar: {
        type: ControlType.Object,

        title: "Calendar",

        buttonTitle: "Edit Calendar",

        controls: {
            show: {
                type: ControlType.Boolean,

                title: "Button",

                defaultValue: true,

                enabledTitle: "Show",

                disabledTitle: "Hide",
            },

            buttonText: {
                type: ControlType.String,

                title: "Button Text",

                defaultValue: "Add all events to calendar",

                hidden: (props) => !props.calendar?.show,
            },
        },
    },

    /* ======================================================================
       05 — NAVIGATION
       ====================================================================== */

    navigation: {
        type: ControlType.Object,

        title: "Navigation",

        buttonTitle: "Edit Navigation",

        controls: {
            show: {
                type: ControlType.Boolean,

                title: "Navigation",

                defaultValue: true,

                enabledTitle: "Show",

                disabledTitle: "Hide",
            },

            position: {
                type: ControlType.Enum,

                title: "Position",

                defaultValue: "bottom",

                options: ["top", "bottom", "side"],

                optionTitles: ["Top", "Bottom", "Side"],

                displaySegmentedControl: true,
            },

            gap: {
                type: ControlType.Number,

                title: "Arrow Gap",

                defaultValue: 4,

                min: 0,
                max: 40,
                step: 1,

                unit: "px",

                displayStepper: true,

                hidden: (props) => !props.navigation?.show,
            },

            iconSize: {
                type: ControlType.Number,

                title: "Icon Size",

                defaultValue: 24,

                min: 14,
                max: 48,
                step: 1,

                unit: "px",

                displayStepper: true,

                hidden: (props) => !props.navigation?.show,
            },

            rightInset: {
                type: ControlType.Number,

                title: "Right Inset",

                defaultValue: 0,

                min: 0,
                max: 60,
                step: 1,

                unit: "px",

                displayStepper: true,

                hidden: (props) =>
                    !props.navigation?.show ||
                    props.navigation?.position !== "side",
            },
        },
    },

    /* ======================================================================
       06 — LAYOUT
       ====================================================================== */

    layout: {
        type: ControlType.Object,

        title: "Layout",

        buttonTitle: "Edit Layout",

        controls: {
            alignment: {
                type: ControlType.Enum,

                title: "Alignment",

                defaultValue: "left",

                options: ["left", "center"],

                optionTitles: ["Left", "Center"],

                displaySegmentedControl: true,
            },

            cardStyle: {
                type: ControlType.Enum,

                title: "Card Style",

                defaultValue: "soft",

                options: ["soft", "solid", "outline"],

                optionTitles: ["Soft", "Solid", "Outline"],

                displaySegmentedControl: true,
            },

            radius: {
                type: ControlType.Number,

                title: "Radius",

                defaultValue: 24,

                min: 0,
                max: 60,
                step: 1,

                unit: "px",

                displayStepper: true,
            },

            padding: {
                type: ControlType.Number,

                title: "Padding",

                defaultValue: 24,

                min: 0,
                max: 100,
                step: 1,

                unit: "px",

                displayStepper: true,
            },

            verticalGap: {
                type: ControlType.Number,

                title: "Vertical Gap",

                defaultValue: 10,

                min: 0,
                max: 60,
                step: 1,

                unit: "px",

                displayStepper: true,
            },

            timeCountdownGap: {
                type: ControlType.Number,

                title: "Time / Duration / Countdown Gap",

                defaultValue: 14,

                min: 0,
                max: 60,
                step: 1,

                unit: "px",

                displayStepper: true,
            },
        },
    },

    /* ======================================================================
       07 — ACCENT
       ====================================================================== */

    accent: {
        type: ControlType.Object,

        title: "Accent",

        buttonTitle: "Edit Accent",

        controls: {
            show: {
                type: ControlType.Boolean,

                title: "Indicator",

                defaultValue: true,

                enabledTitle: "Show",

                disabledTitle: "Hide",
            },

            width: {
                type: ControlType.Number,

                title: "Width",

                defaultValue: 4,

                min: 1,
                max: 12,
                step: 1,

                unit: "px",

                displayStepper: true,

                hidden: (props) => !props.accent?.show,
            },

            radius: {
                type: ControlType.Number,

                title: "Radius",

                defaultValue: 999,

                min: 0,
                max: 999,
                step: 1,

                unit: "px",

                displayStepper: true,

                hidden: (props) => !props.accent?.show,
            },
        },
    },

    /* ======================================================================
       08 — TYPOGRAPHY
       ====================================================================== */

    typography: {
        type: ControlType.Object,

        title: "Typography",

        buttonTitle: "Edit Typography",

        controls: {
            prefix: {
                type: ControlType.Font,

                title: "Prefix",

                defaultValue: DEFAULT_TYPOGRAPHY.prefix,

                controls: "extended",
            },

            location: {
                type: ControlType.Font,

                title: "Location",

                defaultValue: DEFAULT_TYPOGRAPHY.location,

                controls: "extended",
            },

            date: {
                type: ControlType.Font,

                title: "Date",

                defaultValue: DEFAULT_TYPOGRAPHY.date,

                controls: "extended",
            },

            time: {
                type: ControlType.Font,

                title: "Time",

                defaultValue: DEFAULT_TYPOGRAPHY.time,

                controls: "extended",
            },

            duration: {
                type: ControlType.Font,

                title: "Duration",

                defaultValue: DEFAULT_TYPOGRAPHY.duration,

                controls: "extended",
            },

            countdown: {
                type: ControlType.Font,

                title: "Countdown",

                defaultValue: DEFAULT_TYPOGRAPHY.countdown,

                controls: "extended",
            },

            button: {
                type: ControlType.Font,

                title: "Calendar Button",

                defaultValue: DEFAULT_TYPOGRAPHY.button,

                controls: "extended",
            },
        },
    },

    /* ======================================================================
       09 — COLORS
       ====================================================================== */

    colors: {
        type: ControlType.Object,

        title: "Colors",

        buttonTitle: "Edit Colors",

        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_COLORS.background,
            },

            surface: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: DEFAULT_COLORS.surface,
            },

            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: DEFAULT_COLORS.border,
            },

            prefix: {
                type: ControlType.Color,
                title: "Prefix",
                defaultValue: DEFAULT_COLORS.prefix,
            },

            location: {
                type: ControlType.Color,
                title: "Location",
                defaultValue: DEFAULT_COLORS.location,
            },

            date: {
                type: ControlType.Color,
                title: "Date",
                defaultValue: DEFAULT_COLORS.date,
            },

            time: {
                type: ControlType.Color,
                title: "Time",
                defaultValue: DEFAULT_COLORS.time,
            },

            duration: {
                type: ControlType.Color,
                title: "Duration",
                defaultValue: DEFAULT_COLORS.duration,
            },

            countdown: {
                type: ControlType.Color,
                title: "Countdown",
                defaultValue: DEFAULT_COLORS.countdown,
            },

            buttonText: {
                type: ControlType.Color,
                title: "Button Text",
                defaultValue: DEFAULT_COLORS.buttonText,
            },

            buttonBackground: {
                type: ControlType.Color,
                title: "Button Background",
                defaultValue: DEFAULT_COLORS.buttonBackground,
            },

            buttonBorder: {
                type: ControlType.Color,
                title: "Button Border",
                defaultValue: DEFAULT_COLORS.buttonBorder,
            },

            navigation: {
                type: ControlType.Color,
                title: "Navigation",
                defaultValue: DEFAULT_COLORS.navigation,
            },

            navigationDisabled: {
                type: ControlType.Color,
                title: "Navigation Disabled",
                defaultValue: DEFAULT_COLORS.navigationDisabled,
            },

            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: DEFAULT_COLORS.accent,
            },
        },
    },
})
