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

import { useState, useEffect } from "react"

// Date formatting helper
function formatDate(dateString, format) {
    const date = new Date(dateString)
    if (isNaN(date)) return "Invalid Date"

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear()).slice(2)

    switch (format) {
        case "short":
            return `${day}.${month}.${year}`
        case "us":
            return `${month}.${day}.${year}`
        case "uk-slash":
            return `${day}/${month}/${year}`
        case "us-slash":
            return `${month}/${day}/${year}`
        case "long":
        default:
            return date.toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
    }
}

function formatTime(date, format, showSeconds) {
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")

    if (format === "12h") {
        const suffix = hours >= 12 ? "PM" : "AM"
        const twelveHour = hours % 12 || 12
        return `${twelveHour}:${minutes}${showSeconds ? `:${seconds}` : ""} ${suffix}`
    } else {
        return `${String(hours).padStart(2, "0")}:${minutes}${showSeconds ? `:${seconds}` : ""}`
    }
}

export default function TodayTag(props) {
    const {
        date,
        useToday,
        prefix,
        separator,
        format,
        showBackground,
        textColor,
        bgColor,
        borderRadius,
        border,
        font,
        textAlign,
        padding,
        showClock,
        useCustomTime,
        customTime,
        clockFormat,
        showPrefix,
        showDate,
        showSeconds,
        textTransform,
    } = props

    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    let dateToShow
    if (useToday) {
        dateToShow = now.toISOString()
    } else {
        const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
            ? `${date}T00:00:00`
            : new Date().toISOString()
        dateToShow = safeDate
    }
    const formattedDate = formatDate(dateToShow, format)

    let timeSource = now
    if (showClock && useCustomTime) {
        if (/^\d{2}:\d{2}$/.test(customTime)) {
            const [h, m] = customTime.split(":").map(Number)
            const manual = new Date()
            manual.setHours(h)
            manual.setMinutes(m)
            manual.setSeconds(0)
            timeSource = manual
        }
    }

    const formattedTime = showClock
        ? formatTime(timeSource, clockFormat, showSeconds)
        : null

    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent:
                    textAlign === "center"
                        ? "center"
                        : textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
                textAlign,
                background: showBackground ? bgColor : "transparent",
                borderRadius,
                borderTop: `${border.top}px ${border.style} ${border.color}`,
                borderRight: `${border.right}px ${border.style} ${border.color}`,
                borderBottom: `${border.bottom}px ${border.style} ${border.color}`,
                borderLeft: `${border.left}px ${border.style} ${border.color}`,
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    paddingTop: `${padding.top}px`,
                    paddingRight: `${padding.right}px`,
                    paddingBottom: `${padding.bottom}px`,
                    paddingLeft: `${padding.left}px`,
                    color: textColor,
                    ...font,
                    textTransform,
                }}
            >
                {showPrefix && prefix}
                {showPrefix && showDate && separator && " " + separator + " "}
                {showDate && formattedDate}
                {showClock &&
                    (showPrefix || showDate) &&
                    separator &&
                    " " + separator + " "}
                {showClock && formattedTime}
            </div>
        </div>
    )
}

TodayTag.defaultProps = {
    date: new Date().toISOString().split("T")[0],
    useToday: true,
    prefix: "Today",
    separator: "•",
    format: "long",
    showBackground: true,
    textColor: "#000000",
    bgColor: "#F2F2F2",
    borderRadius: 1000,
    showPrefix: true,
    showDate: true,
    border: {
        color: "#000000",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        style: "solid",
    },
    font: {
        fontFamily: "Inter, sans-serif",
        fontSize: "28px",
        fontWeight: 500,
        letterSpacing: "0px",
        lineHeight: "1.2em",
        fontFeatureSettings: `"ss01" 1, "liga" 1`,
    },
    textAlign: "left",
    padding: {
        top: 14,
        right: 20,
        bottom: 14,
        left: 20,
    },
    showClock: false,
    clockFormat: "24h",
    useCustomTime: false,
    customTime: "13:00",
    showSeconds: false,
    textTransform: "none",
}

addPropertyControls(TodayTag, {
    showPrefix: {
        type: ControlType.Boolean,
        title: "Show Prefix",
        defaultValue: true,
    },
    showDate: {
        type: ControlType.Boolean,
        title: "Show Date",
        defaultValue: true,
    },
    showClock: {
        type: ControlType.Boolean,
        title: "Show Clock",
        defaultValue: false,
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: false,
        hidden: ({ showClock }) => !showClock,
    },
    useCustomTime: {
        type: ControlType.Boolean,
        title: "Use Custom Time",
        defaultValue: false,
        hidden: ({ showClock }) => !showClock,
    },
    customTime: {
        type: ControlType.String,
        title: "Custom Time",
        placeholder: "13:00",
        hidden: ({ showClock, useCustomTime }) => !showClock || !useCustomTime,
    },
    clockFormat: {
        type: ControlType.Enum,
        title: "Clock Format",
        options: ["24h", "12h"],
        optionTitles: ["24 Hour", "12 Hour"],
        defaultValue: "24h",
        hidden: ({ showClock }) => !showClock,
    },
    useToday: {
        type: ControlType.Boolean,
        title: "Use Today",
    },
    date: {
        type: ControlType.String,
        title: "Custom Date",
        placeholder: "YYYY-MM-DD",
        defaultValue: new Date().toISOString().split("T")[0],
        hidden: ({ useToday }) => useToday,
    },
    format: {
        type: ControlType.Enum,
        title: "Format",
        options: ["long", "short", "us", "uk-slash", "us-slash"],
        optionTitles: [
            "Month Day, Year",
            "DD.MM.YY",
            "MM.DD.YY",
            "DD/MM/YY",
            "MM/DD/YY",
        ],
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
    },
    separator: {
        type: ControlType.String,
        title: "Separator",
    },
    showBackground: {
        type: ControlType.Boolean,
        title: "Background",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Fill Color",
        hidden: ({ showBackground }) => !showBackground,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 100,
        unit: "px",
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
            },
            top: {
                type: ControlType.Number,
                title: "Top",
                unit: "px",
            },
            right: {
                type: ControlType.Number,
                title: "Right",
                unit: "px",
            },
            bottom: {
                type: ControlType.Number,
                title: "Bottom",
                unit: "px",
            },
            left: {
                type: ControlType.Number,
                title: "Left",
                unit: "px",
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["solid", "dashed", "dotted"],
                optionTitles: ["Solid", "Dashed", "Dotted"],
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "28px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
        defaultValue: "none",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    padding: {
        type: ControlType.Object,
        title: "Padding",
        controls: {
            top: { type: ControlType.Number, title: "Top", defaultValue: 6 },
            right: {
                type: ControlType.Number,
                title: "Right",
                defaultValue: 12,
            },
            bottom: {
                type: ControlType.Number,
                title: "Bottom",
                defaultValue: 6,
            },
            left: { type: ControlType.Number, title: "Left", defaultValue: 12 },
        },
    },
})
