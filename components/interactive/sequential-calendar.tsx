import React, { useEffect, useMemo, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ==========================================================================
   TYPES
   ========================================================================== */

interface FontValue {
    fontSize?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
    textAlign?: string
    variant?: string
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
}

interface Activity {
    title: string
    description: string
    date: string
    endDate: string
    location: string
    category: string
    image?: string
    link: string

    buttonText: string
    buttonVisibility: "before" | "onDate" | "none"

    showCountdown: boolean
    countdownLabel: string
    countdownLockedText: string

    showAddToCalendar: boolean
    addToCalendarText: string

    showCalendarIcon: boolean
    showCalendarText: boolean

    completedTagText: string

    overrideAfterEvent: boolean
    afterEventAction: "same" | "custom" | "disabled" | "hide"
    afterEventButtonText: string
    afterEventLink: string

    overrideColors: boolean
    cardBackground: string
    cardBorder: string
    cardAccent: string
    cardTitle: string
    cardDescription: string
    cardMeta: string
    cardButtonBackground: string
    cardButtonText: string
}

type ActivityInput = Partial<Activity>

type CalendarView = "events" | "day" | "month"

type CompletedButtonMode = "hide" | "keep"

type CountdownDisplay = "all" | "one"

interface ColorSettings {
    backgroundColor?: string
    primaryTextColor?: string
    titleColor?: string
    subtitleColor?: string
    dateTextColor?: string
    calendarBackgroundColor?: string
    calendarCellBackgroundColor?: string
    calendarBorderColor?: string
    calendarDayTextColor?: string
    calendarSecondaryTextColor?: string
    weekdayTextColor?: string
    todayBackgroundColor?: string
    todayDotBackgroundColor?: string
    todayDotTextColor?: string
    eventIndicatorColor?: string
    monthEventBackgroundColor?: string
    monthEventTextColor?: string
    cardBackgroundColor?: string
    cardBorderColor?: string
    cardAccentColor?: string
    cardTitleColor?: string
    cardDescriptionColor?: string
    cardMetaColor?: string
    countdownNumberColor?: string
    countdownLabelColor?: string
    buttonBackgroundColor?: string
    buttonTextColor?: string
    disabledButtonBackgroundColor?: string
    disabledButtonTextColor?: string
    completedTextColor?: string
    addCalendarTextColor?: string
    navigationBackgroundColor?: string
    navigationBorderColor?: string
    navigationTextColor?: string
    switcherBackgroundColor?: string
    switcherBorderColor?: string
    switcherActiveBackgroundColor?: string
    switcherActiveTextColor?: string
    switcherTextColor?: string
    emptyBackgroundColor?: string
    emptyBorderColor?: string
    emptyTextColor?: string
}

interface TypographySettings {
    titleFont?: FontValue
    subtitleFont?: FontValue
    dateFont?: FontValue
    eventTitleFont?: FontValue
    eventDescriptionFont?: FontValue
    eventMetaFont?: FontValue
    countdownNumberFont?: FontValue
    countdownLabelFont?: FontValue
    buttonFont?: FontValue
    addCalendarFont?: FontValue
    disabledFont?: FontValue
    completedFont?: FontValue
    weekdayFont?: FontValue
    calendarDayFont?: FontValue
    monthEventFont?: FontValue
    calendarSecondaryFont?: FontValue
    emptyStateFont?: FontValue
    navigationFont?: FontValue
    switcherFont?: FontValue
}

interface CardSettings {
    radius?: number
    padding?: number
    gap?: number
}

interface ImageSettings {
    width?: number
    height?: number
}

interface ButtonSettings {
    width?: number
    height?: number
    radius?: number
}

interface LayoutSettings {
    maxWidth?: number
    containerPadding?: number
    containerRadius?: number
    titleGap?: number
    sectionGap?: number
}

interface CalendarProps {
    view?: CalendarView

    title?: string
    subtitle?: string

    activities?: ActivityInput[]

    showTitle?: boolean
    showSubtitle?: boolean
    showDescriptions?: boolean
    showLocation?: boolean
    showCategory?: boolean
    showPastEvents?: boolean
    showViewSwitcher?: boolean
    showAccent?: boolean

    completedButtonMode?: CompletedButtonMode

    countdownDisplay?: CountdownDisplay

    typography?: TypographySettings
    colors?: ColorSettings

    cards?: CardSettings
    images?: ImageSettings
    buttons?: ButtonSettings
    layout?: LayoutSettings

    mobileBreakpoint?: number
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function parseDate(value?: string | Date): Date | null {
    if (!value) return null

    const date = value instanceof Date ? value : new Date(value)

    return Number.isNaN(date.getTime()) ? null : date
}

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

function formatDate(date: Date) {
    return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
    })
}

function formatLongDate(date: Date) {
    return date.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    })
}

function formatTime(date: Date) {
    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}

function formatMonth(date: Date) {
    return date.toLocaleDateString([], {
        month: "long",
        year: "numeric",
    })
}

function pad(value: number) {
    return String(value).padStart(2, "0")
}

function countdownParts(milliseconds: number) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))

    return {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
    }
}

function resolveFontWeight(
    value: number | string | undefined,
    fallback: number = 400
): number | string {
    if (typeof value === "number" && Number.isFinite(value)) return value

    if (typeof value === "string") {
        const trimmed = value.trim()

        if (/^\d+$/.test(trimmed)) {
            return Number(trimmed)
        }

        const weights: Record<string, number> = {
            thin: 100,
            hairline: 100,
            extralight: 200,
            "extra light": 200,
            "extra-light": 200,
            ultralight: 200,
            "ultra light": 200,
            light: 300,
            regular: 400,
            normal: 400,
            book: 400,
            medium: 500,
            semibold: 600,
            "semi bold": 600,
            "semi-bold": 600,
            demibold: 600,
            "demi bold": 600,
            bold: 700,
            extrabold: 800,
            "extra bold": 800,
            "extra-bold": 800,
            ultrabold: 800,
            "ultra bold": 800,
            black: 900,
            heavy: 900,
        }

        return weights[trimmed.toLowerCase()] ?? fallback
    }

    return fallback
}

function applyFont(
    font?: FontValue,
    fallbackWeight: number = 400
): React.CSSProperties {
    if (!font) return {}

    const result: React.CSSProperties = {}

    if (font.fontFamily) {
        result.fontFamily = font.fontFamily
    }

    if (font.fontSize !== undefined) {
        result.fontSize =
            typeof font.fontSize === "number"
                ? `${font.fontSize}px`
                : font.fontSize
    }

    if (font.lineHeight !== undefined) {
        result.lineHeight = font.lineHeight
    }

    if (font.letterSpacing !== undefined) {
        result.letterSpacing =
            typeof font.letterSpacing === "number"
                ? `${font.letterSpacing}px`
                : font.letterSpacing
    }

    if (font.textAlign) {
        result.textAlign = font.textAlign as React.CSSProperties["textAlign"]
    }

    result.fontWeight = resolveFontWeight(
        font.fontWeight ?? font.variant,
        fallbackWeight
    )

    if (font.fontStyle) {
        result.fontStyle = font.fontStyle as React.CSSProperties["fontStyle"]
    }

    return result
}

function googleCalendarUrl(activity: Activity) {
    const start = parseDate(activity.date)

    if (!start) return "#"

    const end =
        parseDate(activity.endDate) ||
        new Date(start.getTime() + 60 * 60 * 1000)

    const googleDate = (date: Date) =>
        `${date.getUTCFullYear()}${pad(
            date.getUTCMonth() + 1
        )}${pad(date.getUTCDate())}T${pad(
            date.getUTCHours()
        )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: activity.title || "Activity",
        dates: `${googleDate(start)}/${googleDate(end)}`,
        details: activity.description || "",
        location: activity.location || "",
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/* ==========================================================================
   CALENDAR ICON
   ========================================================================== */

function CalendarPlusIcon() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{
                display: "block",
                flexShrink: 0,
            }}
        >
            <rect
                x="3"
                y="4.5"
                width="18"
                height="16"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.7"
            />

            <path
                d="M7.5 2.5V6.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />

            <path
                d="M16.5 2.5V6.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />

            <path d="M3 9H21" stroke="currentColor" strokeWidth="1.7" />

            <path
                d="M12 12V18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />

            <path
                d="M9 15H15"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    )
}

/* ==========================================================================
   COUNTDOWN
   ========================================================================== */

function Countdown({
    target,
    label,
    numberFont,
    labelFont,
    numberColor,
    labelColor,
    accentBackground,
}: {
    target: Date
    label: string
    numberFont?: FontValue
    labelFont?: FontValue
    numberColor: string
    labelColor: string
    accentBackground: string
}) {
    const isStaticRenderer = useIsStaticRenderer()

    const [remaining, setRemaining] = useState(
        Math.max(0, target.getTime() - Date.now())
    )

    useEffect(() => {
        /*
         * Framer canvas/export/static rendering must not run a continuous
         * timer. The initial value above provides a plain static preview.
         */
        if (isStaticRenderer) {
            return
        }

        const update = () => {
            setRemaining(Math.max(0, target.getTime() - Date.now()))
        }

        update()

        const interval = window.setInterval(update, 1000)

        return () => window.clearInterval(interval)
    }, [target, isStaticRenderer])

    const parts = countdownParts(remaining)

    const values: Array<[string, number]> = [
        ["D", parts.days],
        ["H", parts.hours],
        ["M", parts.minutes],
        ["S", parts.seconds],
    ]

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 12,
                padding: "8px 11px",
                borderRadius: 9,
                background: accentBackground,
                maxWidth: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    ...applyFont(labelFont, 500),
                    color: labelColor,
                    whiteSpace: "nowrap",
                    opacity: 0.85,
                    flexShrink: 0,
                }}
            >
                {label}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    minWidth: 0,
                }}
            >
                {values.map(([labelText, value], index) => (
                    <React.Fragment key={labelText}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 2,
                                flexShrink: 0,
                            }}
                        >
                            <span
                                style={{
                                    ...applyFont(numberFont, 600),
                                    color: numberColor,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {String(value).padStart(2, "0")}
                            </span>

                            <span
                                style={{
                                    ...applyFont(labelFont, 500),
                                    color: labelColor,
                                    opacity: 0.7,
                                }}
                            >
                                {labelText}
                            </span>
                        </div>

                        {index < values.length - 1 && (
                            <span
                                style={{
                                    ...applyFont(labelFont, 500),
                                    color: labelColor,
                                    opacity: 0.35,
                                }}
                            >
                                :
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

/* ==========================================================================
   EVENT CARD
   ========================================================================== */

function EventCard({
    activity,
    now,

    cardBackground,
    cardBorder,
    cardAccent,

    titleColor,
    descriptionColor,
    metaColor,

    buttonBackground,
    buttonText,
    disabledButtonText,

    countdownNumberColor,
    countdownLabelColor,

    addCalendarColor,
    completedTextColor,

    radius,
    padding,
    gap,

    imageWidth,
    imageHeight,

    buttonWidth,
    buttonHeight,
    buttonRadius,

    titleFont,
    descriptionFont,
    metaFont,
    countdownFont,
    countdownLabelFont,
    buttonFont,
    addCalendarFont,
    disabledFont,
    completedFont,

    showDescription,
    showLocation,
    showCategory,

    completedButtonMode,

    showThisCountdown,

    showAccent,
}: {
    activity: Activity
    now: Date

    cardBackground: string
    cardBorder: string
    cardAccent: string

    titleColor: string
    descriptionColor: string
    metaColor: string

    buttonBackground: string
    buttonText: string
    disabledButtonText: string

    countdownNumberColor: string
    countdownLabelColor: string

    addCalendarColor: string
    completedTextColor: string

    radius: number
    padding: number
    gap: number

    imageWidth: number
    imageHeight: number

    buttonWidth: number
    buttonHeight: number
    buttonRadius: number

    titleFont?: FontValue
    descriptionFont?: FontValue
    metaFont?: FontValue
    countdownFont?: FontValue
    countdownLabelFont?: FontValue
    buttonFont?: FontValue
    addCalendarFont?: FontValue
    disabledFont?: FontValue
    completedFont?: FontValue

    showDescription: boolean
    showLocation: boolean
    showCategory: boolean

    completedButtonMode: "hide" | "keep"

    showThisCountdown: boolean

    showAccent: boolean
}) {
    const start = parseDate(activity.date)

    if (!start) return null

    const end = parseDate(activity.endDate)

    const beforeEvent = now.getTime() < start.getTime()

    const completed = end !== null && now.getTime() >= end.getTime()

    let buttonState:
        | "locked"
        | "active"
        | "after-same"
        | "after-custom"
        | "after-disabled"
        | "hidden"

    const buttonVisibility = activity.buttonVisibility || "before"

    if (buttonVisibility === "none") {
        buttonState = "hidden"
    } else if (beforeEvent) {
        buttonState = buttonVisibility === "before" ? "active" : "locked"
    } else if (!completed) {
        buttonState = "active"
    } else {
        const action = activity.overrideAfterEvent
            ? activity.afterEventAction
            : completedButtonMode === "hide"
              ? "hide"
              : "same"

        if (action === "hide") {
            buttonState = "hidden"
        } else if (action === "custom") {
            buttonState = "after-custom"
        } else if (action === "disabled") {
            buttonState = "after-disabled"
        } else {
            buttonState = "after-same"
        }
    }

    const finalBackground = activity.overrideColors
        ? activity.cardBackground
        : cardBackground

    const finalBorder = activity.overrideColors
        ? activity.cardBorder
        : cardBorder

    const finalAccent = activity.overrideColors
        ? activity.cardAccent
        : cardAccent

    const finalTitle = activity.overrideColors ? activity.cardTitle : titleColor

    const finalDescription = activity.overrideColors
        ? activity.cardDescription
        : descriptionColor

    const finalMeta = activity.overrideColors ? activity.cardMeta : metaColor

    const finalButtonBackground = activity.overrideColors
        ? activity.cardButtonBackground
        : buttonBackground

    const finalButtonText = activity.overrideColors
        ? activity.cardButtonText
        : buttonText

    const activeText = activity.buttonText || "Open"

    const afterText = activity.afterEventButtonText || activeText || "Open"

    const lockedText = activity.countdownLockedText || "Not available yet"

    let displayedButtonText = lockedText

    if (buttonState === "active") {
        displayedButtonText = activeText
    } else if (
        buttonState === "after-same" ||
        buttonState === "after-custom" ||
        buttonState === "after-disabled"
    ) {
        displayedButtonText = afterText
    }

    let buttonHref: string | undefined

    if (buttonState === "active" || buttonState === "after-same") {
        buttonHref = activity.link || undefined
    }

    if (buttonState === "after-custom") {
        buttonHref = activity.afterEventLink || undefined
    }

    const showCalendarAction =
        activity.showAddToCalendar &&
        (activity.showCalendarIcon || activity.showCalendarText)

    return (
        <article
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap,
                padding,
                borderRadius: radius,
                background: finalBackground,
                border: `1px solid ${finalBorder}`,
                overflow: "hidden",
                boxSizing: "border-box",
                width: "100%",
            }}
        >
            {showAccent && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: finalAccent,
                    }}
                />
            )}

            {activity.image && (
                <div
                    style={{
                        width: imageWidth,
                        maxWidth: "100%",
                        height: imageHeight,
                        borderRadius: Math.max(0, radius - 5),
                        overflow: "hidden",
                        flexShrink: 0,
                    }}
                >
                    <img
                        src={activity.image}
                        alt={activity.title}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 18,
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {showCategory && activity.category && (
                        <div
                            style={{
                                ...applyFont(metaFont, 500),
                                marginBottom: 7,
                                color: finalAccent,
                                textTransform: "uppercase",
                            }}
                        >
                            {activity.category}
                        </div>
                    )}

                    <h3
                        className="calendar-event-title"
                        style={{
                            ...applyFont(titleFont),
                            margin: 0,
                            color: finalTitle,
                            overflowWrap: "anywhere",
                        }}
                    >
                        {activity.title}
                    </h3>
                </div>

                <div
                    style={{
                        flexShrink: 0,
                        textAlign: "right",
                    }}
                >
                    <div
                        style={{
                            ...applyFont(metaFont, 500),
                            color: finalTitle,
                        }}
                    >
                        {formatDate(start)}
                    </div>

                    <div
                        style={{
                            ...applyFont(metaFont, 400),
                            marginTop: 4,
                            color: finalMeta,
                        }}
                    >
                        {formatTime(start)}
                    </div>
                </div>
            </div>

            {showDescription && activity.description && (
                <div
                    style={{
                        ...applyFont(descriptionFont, 400),
                        color: finalDescription,
                        overflowWrap: "anywhere",
                    }}
                >
                    {activity.description}
                </div>
            )}

            {showLocation && activity.location && (
                <div
                    style={{
                        ...applyFont(metaFont, 400),
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        color: finalMeta,
                    }}
                >
                    {showAccent && (
                        <span
                            style={{
                                width: 5,
                                height: 5,
                                borderRadius: 999,
                                background: finalAccent,
                                flexShrink: 0,
                            }}
                        />
                    )}

                    <span
                        style={{
                            overflowWrap: "anywhere",
                        }}
                    >
                        {activity.location}
                    </span>
                </div>
            )}

            {activity.showCountdown && beforeEvent && showThisCountdown && (
                <Countdown
                    target={start}
                    label={activity.countdownLabel || "Starts in"}
                    numberFont={countdownFont}
                    labelFont={countdownLabelFont}
                    numberColor={countdownNumberColor}
                    labelColor={countdownLabelColor}
                    accentBackground={finalAccent}
                />
            )}

            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    flexWrap: "wrap",
                    width: "100%",
                    minWidth: 0,
                }}
            >
                {(buttonState === "active" ||
                    buttonState === "after-same" ||
                    buttonState === "after-custom") && (
                    <a
                        href={buttonHref}
                        onClick={(event) => {
                            if (!buttonHref) {
                                event.preventDefault()
                            }
                        }}
                        style={{
                            ...applyFont(buttonFont, 500),
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: buttonWidth,
                            minWidth: buttonWidth,
                            height: buttonHeight,
                            minHeight: buttonHeight,
                            padding: "0 15px",
                            boxSizing: "border-box",
                            borderRadius: buttonRadius,
                            background: finalButtonBackground,
                            color: finalButtonText,
                            border: "1px solid transparent",
                            textDecoration: "none",
                            cursor: "pointer",
                            flexShrink: 0,
                        }}
                    >
                        {displayedButtonText}
                    </a>
                )}

                {(buttonState === "locked" ||
                    buttonState === "after-disabled") && (
                    <span
                        style={{
                            ...applyFont(disabledFont, 500),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            minHeight: buttonHeight,
                            minWidth: 0,
                            padding: 0,
                            margin: 0,
                            background: "transparent",
                            color: disabledButtonText,
                            border: 0,
                            opacity: 0.7,
                            cursor: "default",
                            pointerEvents: "none",
                            flex: "1 1 160px",
                            textAlign: "left",
                            whiteSpace: "normal",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                        }}
                    >
                        {displayedButtonText}
                    </span>
                )}

                {showCalendarAction && (
                    <a
                        href={googleCalendarUrl(activity)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            ...applyFont(addCalendarFont, 500),
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            minHeight: 40,
                            marginLeft: "auto",
                            color: addCalendarColor,
                            textDecoration: "none",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {activity.showCalendarIcon && <CalendarPlusIcon />}

                        {activity.showCalendarText && (
                            <span>
                                {activity.addToCalendarText ||
                                    "Add to calendar"}
                            </span>
                        )}
                    </a>
                )}
            </div>

            {completed && (
                <div
                    style={{
                        ...applyFont(completedFont, 600),
                        display: "inline-flex",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        padding: "5px 9px",
                        borderRadius: 999,
                        background: finalAccent,
                        color: completedTextColor,
                        whiteSpace: "nowrap",
                    }}
                >
                    {activity.completedTagText || "Completed"}
                </div>
            )}
        </article>
    )
}

/* ==========================================================================
   MONTH VIEW
   ========================================================================== */

function MonthView({
    month,
    activities,
    weekdayFont,
    calendarDayFont,
    monthEventFont,
    calendarSecondaryFont,
    weekdayTextColor,
    calendarBorderColor,
    calendarCellBackgroundColor,
    todayBackgroundColor,
    calendarDayTextColor,
    todayDotBackgroundColor,
    todayDotTextColor,
    eventIndicatorColor,
    monthEventBackgroundColor,
    monthEventTextColor,
    calendarSecondaryTextColor,
    onSelectDate,
}: {
    month: Date
    activities: Activity[]
    weekdayFont?: FontValue
    calendarDayFont?: FontValue
    monthEventFont?: FontValue
    calendarSecondaryFont?: FontValue
    weekdayTextColor: string
    calendarBorderColor: string
    calendarCellBackgroundColor: string
    todayBackgroundColor: string
    calendarDayTextColor: string
    todayDotBackgroundColor: string
    todayDotTextColor: string
    eventIndicatorColor: string
    monthEventBackgroundColor: string
    monthEventTextColor: string
    calendarSecondaryTextColor: string
    onSelectDate: (date: Date) => void
}) {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

    const firstDay = new Date(year, monthIndex, 1).getDay()

    const cells: Array<Date | null> = []

    for (let i = 0; i < firstDay; i++) {
        cells.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, monthIndex, day))
    }

    while (cells.length % 7 !== 0) {
        cells.push(null)
    }

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
        <div
            style={{
                width: "100%",
                overflowX: "hidden",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    width: "100%",
                }}
            >
                {weekdays.map((day) => (
                    <div
                        key={day}
                        style={{
                            ...applyFont(weekdayFont, 400),
                            padding: "10px 2px",
                            color: weekdayTextColor,
                            textAlign: "center",
                            minWidth: 0,
                            borderTop: `1px solid ${calendarBorderColor}`,
                            borderLeft: `1px solid ${calendarBorderColor}`,
                            boxSizing: "border-box",
                        }}
                    >
                        {day}
                    </div>
                ))}

                {cells.map((date, index) => {
                    if (!date) {
                        return (
                            <div
                                key={`empty-${index}`}
                                style={{
                                    minHeight: 92,
                                    minWidth: 0,
                                    background: calendarCellBackgroundColor,
                                    borderTop: `1px solid ${calendarBorderColor}`,
                                    borderLeft: `1px solid ${calendarBorderColor}`,
                                    boxSizing: "border-box",
                                }}
                            />
                        )
                    }

                    const dayActivities = activities.filter((activity) => {
                        const dateValue = parseDate(activity.date)

                        return dateValue && sameDay(dateValue, date)
                    })

                    const today = sameDay(date, new Date())

                    const dayContent = (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                    minWidth: 0,
                                }}
                            >
                                <span
                                    style={{
                                        ...applyFont(calendarDayFont, 600),
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 24,
                                        height: 24,
                                        minWidth: 24,
                                        borderRadius: 999,
                                        background: today
                                            ? todayDotBackgroundColor
                                            : "transparent",
                                        color: today
                                            ? todayDotTextColor
                                            : calendarDayTextColor,
                                    }}
                                >
                                    {date.getDate()}
                                </span>

                                {dayActivities.length > 0 && (
                                    <span
                                        style={{
                                            width: 5,
                                            height: 5,
                                            minWidth: 5,
                                            borderRadius: 999,
                                            background: eventIndicatorColor,
                                        }}
                                    />
                                )}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                    marginTop: 8,
                                    minWidth: 0,
                                }}
                            >
                                {dayActivities
                                    .slice(0, 2)
                                    .map((activity, i) => (
                                        <div
                                            key={`${activity.title}-${i}`}
                                            style={{
                                                ...applyFont(
                                                    monthEventFont,
                                                    400
                                                ),
                                                padding: "4px",
                                                borderRadius: 5,
                                                background:
                                                    monthEventBackgroundColor,
                                                color: monthEventTextColor,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                minWidth: 0,
                                            }}
                                        >
                                            {activity.title}
                                        </div>
                                    ))}

                                {dayActivities.length > 2 && (
                                    <div
                                        style={{
                                            ...applyFont(
                                                calendarSecondaryFont,
                                                400
                                            ),
                                            color: calendarSecondaryTextColor,
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        +{dayActivities.length - 2} more
                                    </div>
                                )}
                            </div>
                        </>
                    )

                    /*
                     * Days without activities are intentionally rendered as
                     * non-interactive elements. Only dates containing at
                     * least one activity remain keyboard-focusable buttons.
                     */
                    if (dayActivities.length === 0) {
                        return (
                            <div
                                key={date.toISOString()}
                                aria-label={`${formatLongDate(date)}. No activities scheduled.`}
                                style={{
                                    minHeight: 92,
                                    minWidth: 0,
                                    width: "100%",
                                    padding: 6,
                                    border: 0,
                                    borderTop: `1px solid ${calendarBorderColor}`,
                                    borderLeft: `1px solid ${calendarBorderColor}`,
                                    background: today
                                        ? todayBackgroundColor
                                        : calendarCellBackgroundColor,
                                    color: calendarDayTextColor,
                                    textAlign: "left",
                                    boxSizing: "border-box",
                                    overflow: "hidden",
                                }}
                            >
                                {dayContent}
                            </div>
                        )
                    }

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onSelectDate(date)}
                            aria-label={`${formatLongDate(date)}. ${dayActivities.length} ${
                                dayActivities.length === 1
                                    ? "activity"
                                    : "activities"
                            }.`}
                            style={{
                                minHeight: 92,
                                minWidth: 0,
                                width: "100%",
                                padding: 6,
                                border: 0,
                                borderTop: `1px solid ${calendarBorderColor}`,
                                borderLeft: `1px solid ${calendarBorderColor}`,
                                background: today
                                    ? todayBackgroundColor
                                    : calendarCellBackgroundColor,
                                color: calendarDayTextColor,
                                textAlign: "left",
                                cursor: "pointer",
                                boxSizing: "border-box",
                                overflow: "hidden",
                            }}
                        >
                            {dayContent}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */

function EmptyState({
    emptyStateFont,
    emptyBackgroundColor,
    emptyBorderColor,
    emptyTextColor,
}: {
    emptyStateFont?: FontValue
    emptyBackgroundColor: string
    emptyBorderColor: string
    emptyTextColor: string
}) {
    return (
        <div
            style={{
                ...applyFont(emptyStateFont, 400),
                padding: 40,
                borderRadius: 14,
                background: emptyBackgroundColor,
                border: `1px solid ${emptyBorderColor}`,
                color: emptyTextColor,
                textAlign: "center",
            }}
        >
            No activities scheduled.
        </div>
    )
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function Calendar(props: CalendarProps) {
    const isStaticRenderer = useIsStaticRenderer()

    const {
        view = "events",

        title = "Calendar",
        subtitle = "Upcoming activities and events",

        activities = [],

        showTitle = true,
        showSubtitle = true,
        showDescriptions = true,
        showLocation = true,
        showCategory = true,
        showPastEvents = true,
        showViewSwitcher = true,
        showAccent = true,

        completedButtonMode = "hide",

        countdownDisplay = "all",

        typography = {},
        colors = {},

        cards = {},
        images = {},
        buttons = {},
        layout = {},

        mobileBreakpoint = 700,
    } = props

    const {
        backgroundColor = "#090A09",
        primaryTextColor = "#F4F5F2",
        titleColor = "#F4F5F2",
        subtitleColor = "#8E938E",
        dateTextColor = "#F4F5F2",
        calendarBackgroundColor = "#0F110F",
        calendarCellBackgroundColor = "#0F110F",
        calendarBorderColor = "rgba(255,255,255,0.08)",
        calendarDayTextColor = "#F4F5F2",
        calendarSecondaryTextColor = "#8E938E",
        weekdayTextColor = "#8E938E",
        todayBackgroundColor = "rgba(198,220,188,0.08)",
        todayDotBackgroundColor = "#C6DCBC",
        todayDotTextColor = "#090A09",
        eventIndicatorColor = "#C6DCBC",
        monthEventBackgroundColor = "rgba(255,255,255,0.06)",
        monthEventTextColor = "#F4F5F2",
        cardBackgroundColor = "#151715",
        cardBorderColor = "rgba(255,255,255,0.08)",
        cardAccentColor = "#C6DCBC",
        cardTitleColor = "#F4F5F2",
        cardDescriptionColor = "#969B96",
        cardMetaColor = "#8E938E",
        countdownNumberColor = "#090A09",
        countdownLabelColor = "rgba(9,10,9,0.7)",
        buttonBackgroundColor = "#C6DCBC",
        buttonTextColor = "#090A09",
        disabledButtonBackgroundColor = "rgba(255,255,255,0.06)",
        disabledButtonTextColor = "#777C77",
        completedTextColor = "#090A09",
        addCalendarTextColor = "#C6DCBC",
        navigationBackgroundColor = "#0F110F",
        navigationBorderColor = "rgba(255,255,255,0.08)",
        navigationTextColor = "#F4F5F2",
        switcherBackgroundColor = "#0F110F",
        switcherBorderColor = "rgba(255,255,255,0.08)",
        switcherActiveBackgroundColor = "rgba(255,255,255,0.09)",
        switcherActiveTextColor = "#F4F5F2",
        switcherTextColor = "#8E938E",
        emptyBackgroundColor = "#0F110F",
        emptyBorderColor = "rgba(255,255,255,0.08)",
        emptyTextColor = "#8E938E",
    } = colors

    const {
        titleFont = {},
        subtitleFont = {},
        dateFont = {},
        eventTitleFont = {},
        eventDescriptionFont = {},
        eventMetaFont = {},
        countdownNumberFont = {},
        countdownLabelFont = {},
        buttonFont = {},
        addCalendarFont = {},
        disabledFont = {},
        completedFont = {},
        weekdayFont = {},
        calendarDayFont = {},
        monthEventFont = {},
        calendarSecondaryFont = {},
        emptyStateFont = {},
        navigationFont = {},
        switcherFont = {},
    } = typography

    const [currentView, setCurrentView] = useState<CalendarView>(view)

    const [now, setNow] = useState(new Date())

    const [selectedDate, setSelectedDate] = useState(new Date())

    const [month, setMonth] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    )

    useEffect(() => {
        setCurrentView(view)
    }, [view])

    useEffect(() => {
        /*
         * The calendar only needs this continuous clock in the live runtime.
         * Framer's static renderer receives the initial Date value above and
         * does not start a repeating timer.
         */
        if (isStaticRenderer) {
            return
        }

        const timer = window.setInterval(() => {
            setNow(new Date())
        }, 1000)

        return () => window.clearInterval(timer)
    }, [isStaticRenderer])

    const normalizedActivities: Activity[] = useMemo(() => {
        if (!Array.isArray(activities)) {
            return []
        }

        return activities
            .map(
                (item: ActivityInput): Activity => ({
                    title: item?.title || "Untitled activity",

                    description: item?.description || "",

                    date: item?.date || "",

                    endDate: item?.endDate || "",

                    location: item?.location || "",

                    category: item?.category || "",

                    image: item?.image || "",

                    link: item?.link || "https://framer.com",

                    buttonText: item?.buttonText || "Open",
                    buttonVisibility: item?.buttonVisibility || "before",

                    showCountdown: item?.showCountdown !== false,

                    countdownLabel: item?.countdownLabel || "Starts in",

                    countdownLockedText:
                        item?.countdownLockedText || "Not available yet",

                    showAddToCalendar: item?.showAddToCalendar !== false,

                    addToCalendarText:
                        item?.addToCalendarText || "Add to calendar",

                    showCalendarIcon: item?.showCalendarIcon !== false,

                    showCalendarText: item?.showCalendarText !== false,

                    completedTagText: item?.completedTagText || "Completed",

                    overrideAfterEvent: item?.overrideAfterEvent || false,

                    afterEventAction: item?.afterEventAction || "same",

                    afterEventButtonText: item?.afterEventButtonText || "Open",

                    afterEventLink: item?.afterEventLink || "",

                    overrideColors: item?.overrideColors || false,

                    cardBackground: item?.cardBackground || cardBackgroundColor,

                    cardBorder: item?.cardBorder || cardBorderColor,

                    cardAccent: item?.cardAccent || cardAccentColor,

                    cardTitle: item?.cardTitle || cardTitleColor,

                    cardDescription:
                        item?.cardDescription || cardDescriptionColor,

                    cardMeta: item?.cardMeta || cardMetaColor,

                    cardButtonBackground:
                        item?.cardButtonBackground || buttonBackgroundColor,

                    cardButtonText: item?.cardButtonText || buttonTextColor,
                })
            )
            .filter((item) => Boolean(parseDate(item.date)))
    }, [
        activities,
        cardBackgroundColor,
        cardBorderColor,
        cardAccentColor,
        cardTitleColor,
        cardDescriptionColor,
        cardMetaColor,
        buttonBackgroundColor,
        buttonTextColor,
    ])

    const visibleActivities = useMemo(() => {
        return normalizedActivities
            .filter((activity) => {
                const date = parseDate(activity.date)

                if (!date) return false

                if (showPastEvents) {
                    return true
                }

                return date.getTime() >= now.getTime()
            })
            .sort((a, b) => {
                const aDate = parseDate(a.date)

                const bDate = parseDate(b.date)

                return (aDate?.getTime() || 0) - (bDate?.getTime() || 0)
            })
    }, [normalizedActivities, showPastEvents, now])

    const activeCountdownActivity = useMemo(() => {
        if (countdownDisplay !== "one") {
            return null
        }

        return (
            visibleActivities.find((activity) => {
                const start = parseDate(activity.date)

                return (
                    start !== null &&
                    activity.showCountdown &&
                    start.getTime() > now.getTime()
                )
            }) || null
        )
    }, [visibleActivities, countdownDisplay, now])

    const shouldShowCountdown = (activity: Activity) => {
        if (countdownDisplay === "all") {
            return activity.showCountdown
        }

        if (!activeCountdownActivity) {
            return false
        }

        return activity === activeCountdownActivity
    }

    const dayActivities = visibleActivities.filter((activity) => {
        const date = parseDate(activity.date)

        return date && sameDay(date, selectedDate)
    })

    const cardProps = {
        cardBackground: cardBackgroundColor,

        cardBorder: cardBorderColor,

        cardAccent: cardAccentColor,

        titleColor: cardTitleColor,

        descriptionColor: cardDescriptionColor,

        metaColor: cardMetaColor,

        buttonBackground: buttonBackgroundColor,

        buttonText: buttonTextColor,

        disabledButtonText: disabledButtonTextColor,

        countdownNumberColor: countdownNumberColor,

        countdownLabelColor: countdownLabelColor,

        addCalendarColor: addCalendarTextColor,
        completedTextColor,

        radius: cards.radius ?? 14,

        padding: cards.padding ?? 18,

        gap: cards.gap ?? 12,

        imageWidth: images.width ?? 100,

        imageHeight: images.height ?? 150,

        buttonWidth: buttons.width ?? 110,

        buttonHeight: buttons.height ?? 40,

        buttonRadius: buttons.radius ?? 9,

        titleFont: eventTitleFont,

        descriptionFont: eventDescriptionFont,

        metaFont: eventMetaFont,

        countdownFont: countdownNumberFont,

        countdownLabelFont: countdownLabelFont,

        buttonFont: buttonFont,

        addCalendarFont: addCalendarFont,

        disabledFont: disabledFont,

        completedFont: completedFont,

        showDescription: showDescriptions,

        showLocation,

        showCategory,

        completedButtonMode,

        showAccent,
    }

    const previousDay = () => {
        const currentTime = selectedDate.getTime()

        const previousEvents = visibleActivities
            .map((activity) => parseDate(activity.date))
            .filter(
                (date): date is Date =>
                    date !== null && date.getTime() < currentTime
            )
            .sort((a, b) => b.getTime() - a.getTime())

        if (previousEvents.length > 0) {
            setSelectedDate(new Date(previousEvents[0]))
        }
    }

    const nextDay = () => {
        const currentTime = selectedDate.getTime()

        const nextEvents = visibleActivities
            .map((activity) => parseDate(activity.date))
            .filter(
                (date): date is Date =>
                    date !== null && date.getTime() > currentTime
            )
            .sort((a, b) => a.getTime() - b.getTime())

        if (nextEvents.length > 0) {
            setSelectedDate(new Date(nextEvents[0]))
        }
    }

    const previousMonth = () => {
        const currentMonthStart = new Date(
            month.getFullYear(),
            month.getMonth(),
            1
        )

        const previousEvents = visibleActivities
            .map((activity) => parseDate(activity.date))
            .filter(
                (date): date is Date =>
                    date !== null &&
                    date.getTime() < currentMonthStart.getTime()
            )
            .sort((a, b) => b.getTime() - a.getTime())

        if (previousEvents.length > 0) {
            const previousEvent = previousEvents[0]

            setMonth(
                new Date(
                    previousEvent.getFullYear(),
                    previousEvent.getMonth(),
                    1
                )
            )
        }
    }

    const nextMonth = () => {
        const nextMonthStart = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            1
        )

        const nextEvents = visibleActivities
            .map((activity) => parseDate(activity.date))
            .filter(
                (date): date is Date =>
                    date !== null && date.getTime() >= nextMonthStart.getTime()
            )
            .sort((a, b) => a.getTime() - b.getTime())

        if (nextEvents.length > 0) {
            const nextEvent = nextEvents[0]

            setMonth(new Date(nextEvent.getFullYear(), nextEvent.getMonth(), 1))
        }
    }

    const goToday = () => {
        const today = new Date()

        setSelectedDate(today)

        setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    }

    return (
        <div
            className="calendar-root"
            style={{
                width: "100%",
                height: "100%",
                minHeight: 400,
                overflow: "auto",
                boxSizing: "border-box",
                background: backgroundColor,
                color: primaryTextColor,
                padding: layout.containerPadding ?? 20,
                borderRadius: layout.containerRadius ?? 0,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: layout.maxWidth ?? 1100,
                    margin: "0 auto",
                }}
            >
                {/* HEADER */}

                {(showTitle || showSubtitle || showViewSwitcher) && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            gap: 20,
                            marginBottom: layout.sectionGap ?? 24,
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                minWidth: 180,
                            }}
                        >
                            {showTitle && (
                                <h1
                                    className="calendar-main-title"
                                    style={{
                                        ...applyFont(titleFont),
                                        margin: 0,
                                        color: titleColor,
                                    }}
                                >
                                    {title}
                                </h1>
                            )}

                            {showSubtitle && subtitle && (
                                <div
                                    style={{
                                        ...applyFont(subtitleFont),
                                        marginTop: layout.titleGap ?? 8,
                                        color: subtitleColor,
                                    }}
                                >
                                    {subtitle}
                                </div>
                            )}
                        </div>

                        {showViewSwitcher && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 2,
                                    padding: 3,
                                    borderRadius: 9,
                                    background: switcherBackgroundColor,
                                    border: `1px solid ${switcherBorderColor}`,
                                }}
                            >
                                {[
                                    ["day", "Day"],
                                    ["month", "Month"],
                                    ["events", "Events"],
                                ].map((item) => {
                                    const [value, label] = item

                                    const active = currentView === value

                                    return (
                                        <button
                                            key={value}
                                            onClick={() =>
                                                setCurrentView(
                                                    value as CalendarView
                                                )
                                            }
                                            style={{
                                                ...applyFont(switcherFont, 400),
                                                border: 0,
                                                borderRadius: 7,
                                                padding: "7px 11px",
                                                background: active
                                                    ? switcherActiveBackgroundColor
                                                    : "transparent",
                                                color: active
                                                    ? switcherActiveTextColor
                                                    : switcherTextColor,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* DAY VIEW */}

                {currentView === "day" && (
                    <section>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                marginBottom: 18,
                                flexWrap: "wrap",
                            }}
                        >
                            <div
                                style={{
                                    ...applyFont(dateFont),
                                    color: dateTextColor,
                                }}
                            >
                                {sameDay(selectedDate, new Date())
                                    ? "Today"
                                    : formatLongDate(selectedDate)}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 6,
                                }}
                            >
                                <button
                                    onClick={previousDay}
                                    aria-label="Previous day"
                                    style={navButtonStyle(
                                        navigationFont,
                                        navigationBorderColor,
                                        navigationBackgroundColor,
                                        navigationTextColor
                                    )}
                                >
                                    ←
                                </button>

                                <button
                                    onClick={goToday}
                                    style={navButtonStyle(
                                        navigationFont,
                                        navigationBorderColor,
                                        navigationBackgroundColor,
                                        navigationTextColor
                                    )}
                                >
                                    Today
                                </button>

                                <button
                                    onClick={nextDay}
                                    aria-label="Next day"
                                    style={navButtonStyle(
                                        navigationFont,
                                        navigationBorderColor,
                                        navigationBackgroundColor,
                                        navigationTextColor
                                    )}
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        {dayActivities.length > 0 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: cards.gap ?? 12,
                                }}
                            >
                                {dayActivities.map((activity, index) => (
                                    <EventCard
                                        key={`${activity.title}-${index}`}
                                        activity={activity}
                                        now={now}
                                        showThisCountdown={shouldShowCountdown(
                                            activity
                                        )}
                                        {...cardProps}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                emptyStateFont={emptyStateFont}
                                emptyBackgroundColor={emptyBackgroundColor}
                                emptyBorderColor={emptyBorderColor}
                                emptyTextColor={emptyTextColor}
                            />
                        )}
                    </section>
                )}

                {/* MONTH VIEW */}

                {currentView === "month" && (
                    <section>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                marginBottom: 16,
                                flexWrap: "wrap",
                            }}
                        >
                            <div
                                style={{
                                    ...applyFont(dateFont),
                                    color: dateTextColor,
                                }}
                            >
                                {formatMonth(month)}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 6,
                                }}
                            >
                                <button
                                    onClick={previousMonth}
                                    aria-label="Previous month"
                                    style={navButtonStyle(
                                        navigationFont,
                                        navigationBorderColor,
                                        navigationBackgroundColor,
                                        navigationTextColor
                                    )}
                                >
                                    ←
                                </button>

                                <button
                                    onClick={goToday}
                                    style={navButtonStyle(
                                        navigationFont,
                                        navigationBorderColor,
                                        navigationBackgroundColor,
                                        navigationTextColor
                                    )}
                                >
                                    Today
                                </button>

                                <button
                                    onClick={nextMonth}
                                    aria-label="Next month"
                                    style={navButtonStyle(
                                        navigationFont,
                                        navigationBorderColor,
                                        navigationBackgroundColor,
                                        navigationTextColor
                                    )}
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <MonthView
                            month={month}
                            activities={visibleActivities}
                            weekdayFont={weekdayFont}
                            calendarDayFont={calendarDayFont}
                            monthEventFont={monthEventFont}
                            calendarSecondaryFont={calendarSecondaryFont}
                            weekdayTextColor={weekdayTextColor}
                            calendarBorderColor={calendarBorderColor}
                            calendarCellBackgroundColor={
                                calendarCellBackgroundColor
                            }
                            todayBackgroundColor={todayBackgroundColor}
                            calendarDayTextColor={calendarDayTextColor}
                            todayDotBackgroundColor={todayDotBackgroundColor}
                            todayDotTextColor={todayDotTextColor}
                            eventIndicatorColor={eventIndicatorColor}
                            monthEventBackgroundColor={
                                monthEventBackgroundColor
                            }
                            monthEventTextColor={monthEventTextColor}
                            calendarSecondaryTextColor={
                                calendarSecondaryTextColor
                            }
                            onSelectDate={(date) => {
                                setSelectedDate(date)
                                setCurrentView("day")
                            }}
                        />
                    </section>
                )}

                {/* EVENTS VIEW */}

                {currentView === "events" && (
                    <section>
                        {visibleActivities.length > 0 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: cards.gap ?? 12,
                                }}
                            >
                                {visibleActivities.map((activity, index) => (
                                    <EventCard
                                        key={`${activity.title}-${index}`}
                                        activity={activity}
                                        now={now}
                                        showThisCountdown={shouldShowCountdown(
                                            activity
                                        )}
                                        {...cardProps}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                emptyStateFont={emptyStateFont}
                                emptyBackgroundColor={emptyBackgroundColor}
                                emptyBorderColor={emptyBorderColor}
                                emptyTextColor={emptyTextColor}
                            />
                        )}
                    </section>
                )}
            </div>

            {/* RESPONSIVE TYPOGRAPHY */}

            <style>
                {`
                    @media (max-width: ${mobileBreakpoint}px) {
                        .calendar-root .calendar-main-title {
                            font-size: 26px !important;
                        }

                        .calendar-root .calendar-event-title {
                            font-size: 18px !important;
                        }
                    }

                    @media (max-width: 560px) {
                        .calendar-root .calendar-main-title {
                            font-size: 24px !important;
                        }

                        .calendar-root .calendar-event-title {
                            font-size: 17px !important;
                        }
                    }
                `}
            </style>
        </div>
    )
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */

function navButtonStyle(
    navigationFont: FontValue | undefined,
    navigationBorderColor: string,
    navigationBackgroundColor: string,
    navigationTextColor: string
): React.CSSProperties {
    return {
        ...applyFont(navigationFont, 400),
        minHeight: 34,
        padding: "0 10px",
        borderRadius: 7,
        border: `1px solid ${navigationBorderColor}`,
        background: navigationBackgroundColor,
        color: navigationTextColor,
        cursor: "pointer",
    }
}

/* ==========================================================================
   PROPERTY CONTROL HELPERS
   ========================================================================== */

const font = (title: string, defaultValue: FontValue) => ({
    type: ControlType.Font,
    title,
    defaultValue,
    defaultFontType: "sans-serif",
    displayFontSize: true,
    displayTextAlignment: true,
    controls: "extended",
})

const color = (title: string, defaultValue: string) => ({
    type: ControlType.Color,
    title,
    defaultValue,
})

/* ==========================================================================
   PROPERTY CONTROLS
   ========================================================================== */

addPropertyControls(Calendar, {
    /* CONTENT */

    view: {
        type: ControlType.Enum,
        title: "Default View",
        options: ["events", "day", "month"],
        optionTitles: ["Events", "Day", "Month"],
        displaySegmentedControl: true,
        defaultValue: "events",
    },

    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Calendar",
    },

    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Upcoming activities and events",
    },

    activities: {
        type: ControlType.Array,
        title: "Activities",

        control: {
            type: ControlType.Object,

            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New activity",
                },

                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                },

                date: {
                    type: ControlType.Date,
                    title: "Start",
                    defaultValue: new Date(Date.now() + 86400000).toISOString(),
                    displayTime: true,
                },

                endDate: {
                    type: ControlType.Date,
                    title: "End",
                    displayTime: true,
                },

                location: {
                    type: ControlType.String,
                    title: "Location",
                    defaultValue: "",
                },

                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Event",
                },

                image: {
                    type: ControlType.Image,
                    title: "Image",
                },

                link: {
                    type: ControlType.Link,
                    title: "Event Link",
                    defaultValue: "https://framer.com",
                },

                buttonText: {
                    type: ControlType.String,
                    title: "Active Text",
                    defaultValue: "Open",
                },

                buttonVisibility: {
                    type: ControlType.Enum,
                    title: "Show Button",
                    options: ["before", "onDate", "none"],
                    optionTitles: ["Before Date", "On Date", "No Button"],
                    defaultValue: "before",
                },

                showCountdown: {
                    type: ControlType.Boolean,
                    title: "Countdown",
                    defaultValue: true,
                },

                countdownLabel: {
                    type: ControlType.String,
                    title: "Countdown Label",
                    defaultValue: "Starts in",
                    hidden: (props: any) => !props.showCountdown,
                },

                countdownLockedText: {
                    type: ControlType.String,
                    title: "Locked Text",
                    defaultValue: "Not available yet",
                },

                showAddToCalendar: {
                    type: ControlType.Boolean,
                    title: "Calendar",
                    defaultValue: true,
                },

                addToCalendarText: {
                    type: ControlType.String,
                    title: "Calendar Text",
                    defaultValue: "Add to calendar",
                    hidden: (props: any) =>
                        !props.showAddToCalendar ||
                        props.showCalendarText === false,
                },

                showCalendarIcon: {
                    type: ControlType.Boolean,
                    title: "Calendar Icon",
                    defaultValue: true,
                    hidden: (props: any) => !props.showAddToCalendar,
                },

                showCalendarText: {
                    type: ControlType.Boolean,
                    title: "Calendar Text",
                    defaultValue: true,
                    hidden: (props: any) => !props.showAddToCalendar,
                },

                completedTagText: {
                    type: ControlType.String,
                    title: "Completed Text",
                    defaultValue: "Completed",
                },

                overrideAfterEvent: {
                    type: ControlType.Boolean,
                    title: "Custom After Event",
                    defaultValue: false,
                },

                afterEventAction: {
                    type: ControlType.Enum,
                    title: "After Event",
                    options: ["same", "custom", "disabled", "hide"],
                    optionTitles: [
                        "Same Link",
                        "Custom Link",
                        "Disable",
                        "Hide",
                    ],
                    defaultValue: "same",
                    hidden: (props: any) => !props.overrideAfterEvent,
                },

                afterEventButtonText: {
                    type: ControlType.String,
                    title: "After Event Text",
                    defaultValue: "Open",
                    hidden: (props: any) =>
                        !props.overrideAfterEvent ||
                        props.afterEventAction === "hide",
                },

                afterEventLink: {
                    type: ControlType.Link,
                    title: "After Event Link",
                    defaultValue: "https://framer.com",
                    hidden: (props: any) =>
                        !props.overrideAfterEvent ||
                        props.afterEventAction !== "custom",
                },

                overrideColors: {
                    type: ControlType.Boolean,
                    title: "Color Override",
                    defaultValue: false,
                },

                cardBackground: {
                    type: ControlType.Color,
                    title: "Card Background",
                    defaultValue: "#151715",
                    hidden: (props: any) => !props.overrideColors,
                },

                cardBorder: {
                    type: ControlType.Color,
                    title: "Card Border",
                    defaultValue: "rgba(255,255,255,0.08)",
                    hidden: (props: any) => !props.overrideColors,
                },

                cardAccent: {
                    type: ControlType.Color,
                    title: "Card Accent",
                    defaultValue: "#C6DCBC",
                    hidden: (props: any) => !props.overrideColors,
                },

                cardTitle: {
                    type: ControlType.Color,
                    title: "Card Title",
                    defaultValue: "#F4F5F2",
                    hidden: (props: any) => !props.overrideColors,
                },

                cardDescription: {
                    type: ControlType.Color,
                    title: "Card Description",
                    defaultValue: "#969B96",
                    hidden: (props: any) => !props.overrideColors,
                },

                cardMeta: {
                    type: ControlType.Color,
                    title: "Card Meta",
                    defaultValue: "#8E938E",
                    hidden: (props: any) => !props.overrideColors,
                },

                cardButtonBackground: {
                    type: ControlType.Color,
                    title: "Button Background",
                    defaultValue: "#C6DCBC",
                    hidden: (props: any) => !props.overrideColors,
                },

                cardButtonText: {
                    type: ControlType.Color,
                    title: "Button Text",
                    defaultValue: "#090A09",
                    hidden: (props: any) => !props.overrideColors,
                },
            },
        },

        defaultValue: [
            {
                title: "Design review",
                description: "Review the latest project direction.",
                date: new Date(Date.now() + 2 * 86400000).toISOString(),
                endDate: "",
                location: "Studio",
                category: "Meeting",
                image: "",
                link: "https://framer.com",
                buttonText: "Open",
                buttonVisibility: "before",
                showCountdown: true,
                countdownLabel: "Starts in",
                countdownLockedText: "Not available yet",
                showAddToCalendar: true,
                addToCalendarText: "Add to calendar",
                showCalendarIcon: true,
                showCalendarText: true,
                completedTagText: "Completed",
                overrideAfterEvent: false,
                afterEventAction: "same",
                afterEventButtonText: "Open",
                afterEventLink: "https://framer.com",
                overrideColors: false,
                cardBackground: "#151715",
                cardBorder: "rgba(255,255,255,0.08)",
                cardAccent: "#C6DCBC",
                cardTitle: "#F4F5F2",
                cardDescription: "#969B96",
                cardMeta: "#8E938E",
                cardButtonBackground: "#C6DCBC",
                cardButtonText: "#090A09",
            },
        ],
    },

    /* DISPLAY */

    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: true,
    },

    showSubtitle: {
        type: ControlType.Boolean,
        title: "Show Subtitle",
        defaultValue: true,
    },

    showDescriptions: {
        type: ControlType.Boolean,
        title: "Descriptions",
        defaultValue: true,
    },

    showLocation: {
        type: ControlType.Boolean,
        title: "Location",
        defaultValue: true,
    },

    showCategory: {
        type: ControlType.Boolean,
        title: "Category",
        defaultValue: true,
    },

    showAccent: {
        type: ControlType.Boolean,
        title: "Accent",
        defaultValue: true,
    },

    showPastEvents: {
        type: ControlType.Boolean,
        title: "Show Past Events",
        defaultValue: true,
    },

    showViewSwitcher: {
        type: ControlType.Boolean,
        title: "View Switcher",
        defaultValue: true,
    },

    /* BEHAVIOR */

    completedButtonMode: {
        type: ControlType.Enum,
        title: "Default After Event",
        options: ["hide", "keep"],
        optionTitles: ["Hide Button", "Keep Button"],
        displaySegmentedControl: true,
        defaultValue: "hide",
    },

    countdownDisplay: {
        type: ControlType.Enum,
        title: "Countdown Display",
        options: ["all", "one"],
        optionTitles: ["All", "One at a Time"],
        displaySegmentedControl: true,
        defaultValue: "all",
    },

    /* COLORS */

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            backgroundColor: color("Background", "#090A09"),
            primaryTextColor: color("Primary Text", "#F4F5F2"),
            titleColor: color("Title", "#F4F5F2"),
            subtitleColor: color("Subtitle", "#8E938E"),
            dateTextColor: color("Date", "#F4F5F2"),
            calendarBackgroundColor: color("Calendar Background", "#0F110F"),
            calendarCellBackgroundColor: color("Cell Background", "#0F110F"),
            calendarBorderColor: color(
                "Calendar Border",
                "rgba(255,255,255,0.08)"
            ),
            calendarDayTextColor: color("Day Text", "#F4F5F2"),
            calendarSecondaryTextColor: color("Secondary Text", "#8E938E"),
            weekdayTextColor: color("Weekday Text", "#8E938E"),
            todayBackgroundColor: color(
                "Today Background",
                "rgba(198,220,188,0.08)"
            ),
            todayDotBackgroundColor: color("Today Dot", "#C6DCBC"),
            todayDotTextColor: color("Today Text", "#090A09"),
            eventIndicatorColor: color("Event Indicator", "#C6DCBC"),
            monthEventBackgroundColor: color(
                "Month Event Background",
                "rgba(255,255,255,0.06)"
            ),
            monthEventTextColor: color("Month Event Text", "#F4F5F2"),
            cardBackgroundColor: color("Card Background", "#151715"),
            cardBorderColor: color("Card Border", "rgba(255,255,255,0.08)"),
            cardAccentColor: color("Card Accent", "#C6DCBC"),
            cardTitleColor: color("Card Title", "#F4F5F2"),
            cardDescriptionColor: color("Card Description", "#969B96"),
            cardMetaColor: color("Card Meta", "#8E938E"),
            countdownNumberColor: color("Countdown Numbers", "#090A09"),
            countdownLabelColor: color("Countdown Labels", "rgba(9,10,9,0.7)"),
            buttonBackgroundColor: color("Button Background", "#C6DCBC"),
            buttonTextColor: color("Button Text", "#090A09"),
            disabledButtonBackgroundColor: color(
                "Disabled Background",
                "rgba(255,255,255,0.06)"
            ),
            disabledButtonTextColor: color("Disabled Text", "#777C77"),
            completedTextColor: color("Completed Text", "#090A09"),
            addCalendarTextColor: color("Add to Calendar", "#C6DCBC"),
            navigationBackgroundColor: color(
                "Navigation Background",
                "#0F110F"
            ),
            navigationBorderColor: color(
                "Navigation Border",
                "rgba(255,255,255,0.08)"
            ),
            navigationTextColor: color("Navigation Text", "#F4F5F2"),
            switcherBackgroundColor: color("Switcher Background", "#0F110F"),
            switcherBorderColor: color(
                "Switcher Border",
                "rgba(255,255,255,0.08)"
            ),
            switcherActiveBackgroundColor: color(
                "Switcher Active",
                "rgba(255,255,255,0.09)"
            ),
            switcherActiveTextColor: color("Switcher Active Text", "#F4F5F2"),
            switcherTextColor: color("Switcher Text", "#8E938E"),
            emptyBackgroundColor: color("Empty Background", "#0F110F"),
            emptyBorderColor: color("Empty Border", "rgba(255,255,255,0.08)"),
            emptyTextColor: color("Empty Text", "#8E938E"),
        },
    },

    /* TYPOGRAPHY */

    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            titleFont: font("Title", {
                fontSize: 30,
                lineHeight: 1.1,
                letterSpacing: -0.5,
                variant: "Semibold",
                fontWeight: 600,
                textAlign: "left",
            }),

            subtitleFont: font("Subtitle", {
                fontSize: 14,
                lineHeight: 1.45,
                letterSpacing: 0,
                variant: "Regular",
                fontWeight: 400,
                textAlign: "left",
            }),

            dateFont: font("Date", {
                fontSize: 18,
                lineHeight: 1.2,
                letterSpacing: -0.1,
                variant: "Medium",
                fontWeight: 500,
                textAlign: "left",
            }),

            eventTitleFont: font("Event Title", {
                fontSize: 20,
                lineHeight: 1.2,
                letterSpacing: -0.2,
                variant: "Semibold",
                fontWeight: 600,
                textAlign: "left",
            }),

            eventDescriptionFont: font("Event Description", {
                fontSize: 14,
                lineHeight: 1.5,
                letterSpacing: 0,
                variant: "Regular",
                fontWeight: 400,
                textAlign: "left",
            }),

            eventMetaFont: font("Event Meta", {
                fontSize: 12,
                lineHeight: 1.3,
                letterSpacing: 0,
                variant: "Medium",
                fontWeight: 500,
                textAlign: "left",
            }),

            countdownNumberFont: font("Countdown Numbers", {
                fontSize: 16,
                lineHeight: 1,
                letterSpacing: -0.3,
                variant: "Semibold",
                fontWeight: 600,
                textAlign: "left",
            }),

            countdownLabelFont: font("Countdown Labels", {
                fontSize: 10,
                lineHeight: 1,
                letterSpacing: 0,
                variant: "Medium",
                fontWeight: 500,
                textAlign: "left",
            }),

            buttonFont: font("Button", {
                fontSize: 13,
                lineHeight: 1,
                letterSpacing: 0,
                variant: "Medium",
                fontWeight: 500,
                textAlign: "center",
            }),

            addCalendarFont: font("Add to Calendar", {
                fontSize: 12,
                lineHeight: 1.2,
                letterSpacing: 0,
                variant: "Medium",
                fontWeight: 500,
                textAlign: "left",
            }),

            disabledFont: font("Disabled", {
                fontSize: 13,
                lineHeight: 1.3,
                letterSpacing: 0,
                variant: "Medium",
                fontWeight: 500,
                textAlign: "left",
            }),

            completedFont: font("Completed", {
                fontSize: 10,
                lineHeight: 1,
                letterSpacing: 0,
                variant: "Semibold",
                fontWeight: 600,
                textAlign: "left",
            }),

            weekdayFont: font("Weekday", {
                fontSize: 11,
                lineHeight: 1.2,
                letterSpacing: 0,
                variant: "Regular",
                fontWeight: 400,
                textAlign: "center",
            }),

            calendarDayFont: font("Calendar Day", {
                fontSize: 11,
                lineHeight: 1,
                letterSpacing: 0,
                variant: "Semibold",
                fontWeight: 600,
                textAlign: "center",
            }),

            monthEventFont: font("Month Event", {
                fontSize: 9,
                lineHeight: 1.2,
                letterSpacing: 0,
                variant: "Regular",
                fontWeight: 400,
                textAlign: "left",
            }),

            calendarSecondaryFont: font("Calendar Secondary", {
                fontSize: 9,
                lineHeight: 1.2,
                letterSpacing: 0,
                variant: "Regular",
                fontWeight: 400,
                textAlign: "left",
            }),

            emptyStateFont: font("Empty State", {
                fontSize: 13,
                lineHeight: 1.3,
                letterSpacing: 0,
                variant: "Regular",
                fontWeight: 400,
                textAlign: "center",
            }),

            navigationFont: font("Navigation", {
                fontSize: 11,
                lineHeight: 1,
                letterSpacing: 0,
                variant: "Regular",
                fontWeight: 400,
                textAlign: "center",
            }),

            switcherFont: font("View Switcher", {
                fontSize: 12,
                lineHeight: 1,
                letterSpacing: 0,
                variant: "Regular",
                fontWeight: 400,
                textAlign: "center",
            }),
        },
    },

    /* CARDS */

    cards: {
        type: ControlType.Object,
        title: "Cards",

        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 14,
                min: 0,
                max: 40,
                unit: "px",
            },

            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 18,
                min: 8,
                max: 48,
                unit: "px",
            },

            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 12,
                min: 4,
                max: 40,
                unit: "px",
            },
        },
    },

    /* IMAGES */

    images: {
        type: ControlType.Object,
        title: "Images",

        controls: {
            width: {
                type: ControlType.Number,
                title: "Image Width",
                defaultValue: 100,
                min: 20,
                max: 100,
                step: 1,
                unit: "%",
            },

            height: {
                type: ControlType.Number,
                title: "Image Height",
                defaultValue: 150,
                min: 50,
                max: 400,
                step: 5,
                unit: "px",
            },
        },
    },

    /* BUTTONS */

    buttons: {
        type: ControlType.Object,
        title: "Buttons",

        controls: {
            width: {
                type: ControlType.Number,
                title: "Button Width",
                defaultValue: 110,
                min: 40,
                max: 400,
                step: 1,
                unit: "px",
            },

            height: {
                type: ControlType.Number,
                title: "Button Height",
                defaultValue: 40,
                min: 28,
                max: 100,
                step: 1,
                unit: "px",
            },

            radius: {
                type: ControlType.Number,
                title: "Button Radius",
                defaultValue: 9,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
        },
    },

    /* LAYOUT */

    layout: {
        type: ControlType.Object,
        title: "Layout",

        controls: {
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: 1100,
                min: 400,
                max: 1600,
                unit: "px",
            },

            containerPadding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 20,
                min: 0,
                max: 80,
                unit: "px",
            },

            containerRadius: {
                type: ControlType.Number,
                title: "Container Radius",
                defaultValue: 0,
                min: 0,
                max: 60,
                unit: "px",
            },

            titleGap: {
                type: ControlType.Number,
                title: "Title Gap",
                defaultValue: 8,
                min: 0,
                max: 40,
                unit: "px",
            },

            sectionGap: {
                type: ControlType.Number,
                title: "Section Gap",
                defaultValue: 24,
                min: 8,
                max: 80,
                unit: "px",
            },
        },
    },

    /* RESPONSIVE */

    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 700,
        min: 480,
        max: 1000,
        step: 10,
        unit: "px",
    },
})
