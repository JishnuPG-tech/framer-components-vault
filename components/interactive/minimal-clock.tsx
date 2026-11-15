import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ClockProps {
    timeFormat: "12" | "24"
    textColor: string
    backgroundColor: string
    font: any
    showSeconds: boolean
    padding: string
    flickerColons: boolean
    showDate: boolean
    dateFormat:
        | "YYYY-MM-DD"
        | "MM/DD/YYYY"
        | "DD-MM-YYYY"
        | "DD/MM/YYYY"
        | "MMMM DD, YYYY"
        | "DD MMMM YYYY"
        | "ddd, MMM DD, YYYY"
    style?: CSSProperties
}

// Helpers for month/day names
function getMonthName(monthIndex: number, short = false) {
    const months = [
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
    const shortMonths = months.map((m) => m.slice(0, 3))
    return short ? shortMonths[monthIndex] : months[monthIndex]
}
function getDayName(dayIndex: number, short = false) {
    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ]
    const shortDays = days.map((d) => d.slice(0, 3))
    return short ? shortDays[dayIndex] : days[dayIndex]
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MinimalClock(props: ClockProps) {
    const {
        timeFormat = "12",
        textColor = "#000000",
        backgroundColor = "#FFFFFF",
        font,
        showSeconds = false,
        padding = "16px 24px",
        showDate = false,
        dateFormat = "YYYY-MM-DD",
        flickerColons = true,
    } = props

    const [time, setTime] = useState(new Date())
    const [showColon, setShowColon] = useState(true)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return

        const interval = setInterval(() => {
            startTransition(() => {
                setTime(new Date())
                if (flickerColons) setShowColon((prev) => !prev)
                else setShowColon(true)
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isStatic, flickerColons])

    function formatTime(date: Date) {
        let hours = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()
        let ampm = ""

        if (timeFormat === "12") {
            ampm = hours >= 12 ? " PM" : " AM"
            hours = hours % 12
            hours = hours ? hours : 12
        }

        const formattedHours = hours.toString().padStart(2, "0")
        const formattedMinutes = minutes.toString().padStart(2, "0")
        const formattedSeconds = seconds.toString().padStart(2, "0")

        const colon = showColon ? ":" : " "

        if (showSeconds) {
            return `${formattedHours}${colon}${formattedMinutes}${colon}${formattedSeconds}${ampm}`
        }
        return `${formattedHours}${colon}${formattedMinutes}${ampm}`
    }

    function formatDate(date: Date, format: string) {
        const yyyy = date.getFullYear().toString()
        const mm = (date.getMonth() + 1).toString().padStart(2, "0")
        const dd = date.getDate().toString().padStart(2, "0")
        const monthName = getMonthName(date.getMonth())
        const monthShort = getMonthName(date.getMonth(), true)
        const dayName = getDayName(date.getDay())
        const dayShort = getDayName(date.getDay(), true)

        switch (format) {
            case "YYYY-MM-DD":
                return `${yyyy}-${mm}-${dd}`
            case "MM/DD/YYYY":
                return `${mm}/${dd}/${yyyy}`
            case "DD-MM-YYYY":
                return `${dd}-${mm}-${yyyy}`
            case "DD/MM/YYYY":
                return `${dd}/${mm}/${yyyy}`
            case "MMMM DD, YYYY":
                return `${monthName} ${dd}, ${yyyy}`
            case "DD MMMM YYYY":
                return `${dd} ${monthName} ${yyyy}`
            case "ddd, MMM DD, YYYY":
                return `${dayShort}, ${monthShort} ${dd}, ${yyyy}`
            default:
                return `${yyyy}-${mm}-${dd}`
        }
    }

    const displayTime = isStatic
        ? timeFormat === "12"
            ? "12:00 PM"
            : "12:00"
        : formatTime(time)

    const displayDate = isStatic
        ? dateFormat === "YYYY-MM-DD"
            ? "2024-01-01"
            : dateFormat === "MM/DD/YYYY"
              ? "01/01/2024"
              : dateFormat === "DD-MM-YYYY"
                ? "01-01-2024"
                : dateFormat === "DD/MM/YYYY"
                  ? "01/01/2024"
                  : dateFormat === "MMMM DD, YYYY"
                    ? "January 01, 2024"
                    : dateFormat === "DD MMMM YYYY"
                      ? "01 January 2024"
                      : "Mon, Jan 01, 2024"
        : formatDate(time, dateFormat)

    return (
        <div
            style={{
                ...props.style,
                color: textColor,
                background: backgroundColor,
                padding,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                minWidth: "max-content",
                ...font,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.05em",
            }}
        >
            {showDate && (
                <span style={{ fontSize: font?.fontSize, marginRight: 20 }}>
                    {displayDate}
                </span>
            )}
            <span style={{ fontSize: font?.fontSize }}>{displayTime}</span>
        </div>
    )
}

// Sorted and improved property controls
addPropertyControls(MinimalClock, {
    showDate: {
        type: ControlType.Boolean,
        title: "Show Date",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Toggle to display the date alongside the time.",
    },
    dateFormat: {
        type: ControlType.Enum,
        title: "Date Format",
        options: [
            "YYYY-MM-DD",
            "MM/DD/YYYY",
            "DD-MM-YYYY",
            "DD/MM/YYYY",
            "MMMM DD, YYYY",
            "DD MMMM YYYY",
            "ddd, MMM DD, YYYY",
        ],
        optionTitles: [
            "YYYY-MM-DD",
            "MM/DD/YYYY",
            "DD-MM-YYYY",
            "DD/MM/YYYY",
            "Month DD, YYYY",
            "DD Month YYYY",
            "Thu, Jul 31, 2025",
        ],
        defaultValue: "YYYY-MM-DD",
        hidden: ({ showDate }) => !showDate,
        description: "Select the format for the displayed date.",
    },
    timeFormat: {
        type: ControlType.Enum,
        title: "Time Format",
        options: ["12", "24"],
        optionTitles: ["12 Hour", "24 Hour"],
        defaultValue: "12",
        displaySegmentedControl: true,
        description: "Choose between 12-hour or 24-hour time display.",
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    flickerColons: {
        type: ControlType.Boolean,
        title: "Flicker Colons",
        defaultValue: true,
        enabledTitle: "Dynamic",
        disabledTitle: "Static",
        description:
            "Enable to animate the colons between hours, minutes, and seconds for a classic digital clock effect.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        description:
            "Customize the font family, size, weight, and other typography settings.",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "16px 24px",
        description: "Adjust the space inside the clock container.",
    },
})
