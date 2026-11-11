"use client"

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


const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}

/**
 * Framer's ControlType.Date passes a Unix timestamp (ms number) or ISO string.
 * Normalize it to a plain { year, month, day } tuple so we never deal with
 * Date object identity / timezone drift issues anywhere in the component.
 */
function parseToYMD(
    value: unknown
): { year: number; month: number; day: number } | null {
    if (!value) return null
    const d = value instanceof Date ? value : new Date(value as string | number)
    if (isNaN(d.getTime())) return null
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
}

/**
 * Framer's ControlType.Color passes rgba() strings like "rgba(240,237,232,1)".
 * Appending hex like + "cc" produces invalid CSS → invisible text.
 * This helper always returns a valid rgba() string.
 */
function withOpacity(color: string, opacity: number): string {
    if (!color) return `rgba(0,0,0,${opacity})`
    const rgba = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
    if (rgba) return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${opacity})`
    const hex = color.replace("#", "")
    if (hex.length === 3) {
        const [a, b, c] = [hex[0] + hex[0], hex[1] + hex[1], hex[2] + hex[2]]
        return `rgba(${parseInt(a, 16)},${parseInt(b, 16)},${parseInt(c, 16)},${opacity})`
    }
    if (hex.length >= 6) {
        return `rgba(${parseInt(hex.slice(0, 2), 16)},${parseInt(hex.slice(2, 4), 16)},${parseInt(hex.slice(4, 6), 16)},${opacity})`
    }
    return color
}

interface CalendarProps {
    defaultDate?: unknown
    accentColor?: string
    backgroundColor?: string
    textColor?: string
    showBorder?: boolean
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    showShadow?: boolean
    shadowColor?: string
    shadowX?: number
    shadowY?: number
    shadowBlur?: number
    shadowSpread?: number
    style?: React.CSSProperties
}

function CalendarDemo({
    defaultDate,
    accentColor = "#e8c97a",
    backgroundColor = "#0f0f11",
    textColor = "#f0ede8",
    showBorder = false,
    borderColor = "#ffffff33",
    borderWidth = 1,
    borderRadius = 20,
    showShadow = true,
    shadowColor = "#00000073",
    shadowX = 0,
    shadowY = 8,
    shadowBlur = 40,
    shadowSpread = 0,
    style,
}: CalendarProps) {
    const todayRaw = new Date()
    const todayYMD = {
        year: todayRaw.getFullYear(),
        month: todayRaw.getMonth(),
        day: todayRaw.getDate(),
    }

    // Parse defaultDate once to a plain YMD (no Date objects stored in state)
    const defaultYMD = parseToYMD(defaultDate)

    /**
     * SELECTION LOGIC — the cleanest approach for Framer:
     *
     * We store selection as a plain { year, month, day } tuple (or null).
     * `userSelection` holds what the user clicked. It starts as null.
     * The actual displayed selection is: userSelection ?? defaultYMD ?? null.
     *
     * When `defaultDate` prop changes to a genuinely different value, we clear
     * userSelection so the new default takes over — but we compare by value
     * (stringified YMD) not by object reference, so Framer re-renders that
     * pass the same date don't reset the user's click.
     */
    const [userSelection, setUserSelection] = React.useState<{
        year: number
        month: number
        day: number
    } | null>(null)

    // Track last seen defaultDate as a stable string key
    const prevDefaultKey = React.useRef<string>(
        defaultYMD
            ? `${defaultYMD.year}-${defaultYMD.month}-${defaultYMD.day}`
            : ""
    )

    const defaultKey = defaultYMD
        ? `${defaultYMD.year}-${defaultYMD.month}-${defaultYMD.day}`
        : ""

    // Only reset userSelection when the defaultDate prop genuinely changes
    if (defaultKey !== prevDefaultKey.current) {
        prevDefaultKey.current = defaultKey
        // Reset in render (safe in React — only runs when condition is true)
        // We use a ref flag to avoid calling setState during render
    }

    const [prevDefaultKeyState, setPrevDefaultKeyState] =
        React.useState(defaultKey)
    if (defaultKey !== prevDefaultKeyState) {
        setPrevDefaultKeyState(defaultKey)
        setUserSelection(null)
    }

    // The final resolved selection
    const selected = userSelection ?? defaultYMD ?? null

    // View state — initialise to selected date's month/year if available, else today
    const initDate = selected ?? todayYMD
    const [viewYear, setViewYear] = React.useState(initDate.year)
    const [viewMonth, setViewMonth] = React.useState(initDate.month)
    const [hovered, setHovered] = React.useState<number | null>(null)

    // Keep view in sync when defaultDate changes in the editor
    React.useEffect(() => {
        const ymd = parseToYMD(defaultDate)
        if (ymd) {
            setViewYear(ymd.year)
            setViewMonth(ymd.month)
        }
    }, [defaultKey]) // only runs when the date VALUE changes

    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear((y) => y - 1)
        } else setViewMonth((m) => m - 1)
    }
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear((y) => y + 1)
        } else setViewMonth((m) => m + 1)
    }

    const isSelected = (day: number) =>
        !!selected &&
        day === selected.day &&
        viewMonth === selected.month &&
        viewYear === selected.year

    const handleDayClick = (day: number) => {
        setUserSelection({ year: viewYear, month: viewMonth, day })
    }

    // Derived colors
    const mutedText = withOpacity(textColor, 0.33)
    const dimText = withOpacity(textColor, 0.8)
    const navBtnBg = withOpacity(textColor, 0.06)
    const divider = withOpacity(textColor, 0.09)
    const hoverBg = withOpacity(accentColor, 0.13)

    const boxBorder = showBorder
        ? `${borderWidth}px solid ${borderColor}`
        : "none"
    const boxShadow = showShadow
        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
        : "none"

    // Build calendar cells
    const cells: React.ReactNode[] = Array.from(
        { length: firstDay },
        (_, i) => <div key={`e-${i}`} style={{ height: 36 }} />
    )

    for (let d = 1; d <= daysInMonth; d++) {
        const day = d
        const sel = isSelected(day)
        const tod =
            day === todayYMD.day &&
            viewMonth === todayYMD.month &&
            viewYear === todayYMD.year
        const hov = hovered === day && !sel

        cells.push(
            <div
                key={day}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleDayClick(day)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 36,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: sel ? 700 : 400,
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.12s, color 0.12s",
                    background: sel
                        ? accentColor
                        : hov
                          ? hoverBg
                          : "transparent",
                    color: sel ? backgroundColor : dimText,
                }}
            >
                {day}
                {tod && !sel && (
                    <span
                        style={{
                            position: "absolute",
                            bottom: 4,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: accentColor,
                        }}
                    />
                )}
            </div>
        )
    }

    const selectedLabel = selected
        ? `${MONTHS[selected.month]} ${selected.day}, ${selected.year}`
        : "None"

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            <div
                style={{
                    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
                    background: backgroundColor,
                    borderRadius: borderRadius,
                    border: boxBorder,
                    boxShadow: boxShadow,
                    padding: "24px 20px 20px",
                    width: 320,
                    userSelect: "none",
                    color: textColor,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                    }}
                >
                    <button
                        onClick={prevMonth}
                        style={{
                            background: navBtnBg,
                            border: "none",
                            borderRadius: 8,
                            width: 30,
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: dimText,
                            fontSize: 16,
                        }}
                    >
                        ‹
                    </button>
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                            color: textColor,
                        }}
                    >
                        {MONTHS[viewMonth]} {viewYear}
                    </span>
                    <button
                        onClick={nextMonth}
                        style={{
                            background: navBtnBg,
                            border: "none",
                            borderRadius: 8,
                            width: 30,
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: dimText,
                            fontSize: 16,
                        }}
                    >
                        ›
                    </button>
                </div>

                {/* Day grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: 4,
                    }}
                >
                    {DAYS.map((d) => (
                        <div
                            key={d}
                            style={{
                                textAlign: "center",
                                fontSize: 11,
                                fontWeight: 500,
                                color: mutedText,
                                paddingBottom: 8,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                            }}
                        >
                            {d}
                        </div>
                    ))}
                    {cells}
                </div>

                {/* Footer */}
                <div
                    style={{
                        marginTop: 16,
                        borderTop: `1px solid ${divider}`,
                        paddingTop: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <span style={{ fontSize: 12, color: mutedText }}>
                        Selected
                    </span>
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: accentColor,
                            letterSpacing: "0.02em",
                        }}
                    >
                        {selectedLabel}
                    </span>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(CalendarDemo, {
    defaultDate: { type: ControlType.Date, title: "Default Date" },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0f0f11",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#f0ede8",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#e8c97a",
    },
    showBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#ffffff33",
        hidden: (props) => !props.showBorder,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showBorder,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 20,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#00000073",
        hidden: (props) => !props.showShadow,
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showShadow,
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 8,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showShadow,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showShadow,
    },
    shadowSpread: {
        type: ControlType.Number,
        title: "Shadow Spread",
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showShadow,
    },
})

export default CalendarDemo
