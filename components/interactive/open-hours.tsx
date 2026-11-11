import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { DateTime, IANAZone } from "luxon"
/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth auto
 * @framerIntrinsicHeight auto
 *
 * @framerSupportedLayoutWidth 100%
 * @framerSupportedLayoutHeight 100%
 */
export default function Openhours({
    textStyling,
    indicatorSettings,
    timeSettings,
    days = [],
}) {
    const {
        dotIndicatorVisible,
        dotIndicatorFlashing,
        pulseDuration = 3,
        pulseScale = 2.6,
        openDotColor,
        closedDotColor,
        dotSize = 8,
        gap = 8,
    } = indicatorSettings

    useEffect(() => {
        const key = "openhours-pulse"
        let style = document.getElementById(key)
        if (!style) {
            style = document.createElement("style")
            style.id = key
            document.head.appendChild(style)
        }
        style.innerHTML = `
      @keyframes openhoursPulse {
        0% { animation-timing-function: ease-out; transform: scale(1); opacity: 0.9; }
        50% { animation-timing-function: ease-out; transform: scale(${pulseScale}); opacity: 0; }
        100% { transform: scale(${pulseScale}); opacity: 0; }
      }
    `
    }, [pulseScale])

    const {
        shopLocationTimezone,
        timeFormat12,
        showTime,
        showSchedule,
        distribution,
    } = timeSettings

    const { openPrefix, closedPrefix } = textStyling

    const shopZone = IANAZone.create(shopLocationTimezone)
    const [now, setNow] = useState(DateTime.now().setZone(shopZone))
    useEffect(() => {
        const id = setInterval(
            () => setNow(DateTime.now().setZone(shopZone)),
            60000
        )
        return () => clearInterval(id)
    }, [shopLocationTimezone])

    // --- time helpers --------------------------------------------------------
    function parseTime(str: string) {
        let dt = DateTime.fromFormat(str.trim(), "HH:mm", { zone: shopZone })
        if (!dt.isValid)
            dt = DateTime.fromFormat(str.trim(), "h:mm a", { zone: shopZone })
        return dt
    }
    const timeFmt = timeFormat12 ? "h:mm a" : "HH:mm"

    function fmtRangeFromInterval(ivl: { open: DateTime; close: DateTime }) {
        return `${ivl.open.toFormat(timeFmt)} – ${ivl.close.toFormat(timeFmt)}`
    }

    // Map Luxon weekday (1=Mon..7=Sun) to 0=Mon..6=Sun
    const todayIdx = (now.weekday + 6) % 7
    const startOfToday = now.startOf("day")

    // Build an open interval for a given day index using a specific base date
    function intervalFor(dayIndex: number, baseDate: DateTime) {
        const day = days[dayIndex]
        if (!day || !day.status || !day.hours) return null
        const [o, c] = (day.hours as string).split(" - ")
        const s = parseTime(o)
        const e = parseTime(c)
        if (!s.isValid || !e.isValid) return null

        let openT = baseDate.set({ hour: s.hour, minute: s.minute })
        let closeT = baseDate.set({ hour: e.hour, minute: e.minute })

        // Handle overnight: if close <= open, it closes the next day
        if (closeT <= openT) closeT = closeT.plus({ days: 1 })

        return { open: openT, close: closeT, idx: dayIndex }
    }

    // Previous day's overnight (if any) that spills into today
    const prevIdx = (todayIdx + 6) % 7
    const prevInterval = (() => {
        const ivl = intervalFor(prevIdx, startOfToday.minus({ days: 1 }))
        if (!ivl) return null
        // Only relevant if it closes today (i.e., overnight)
        return ivl.close > ivl.open &&
            ivl.close.startOf("day").equals(startOfToday)
            ? ivl
            : ivl.close > startOfToday &&
                ivl.close <= startOfToday.plus({ days: 1 })
              ? ivl
              : ivl
    })()

    // Today's interval (may or may not be overnight)
    const todayInterval = intervalFor(todayIdx, startOfToday)

    // Are we open now? Consider today's interval and previous day's overnight
    const openByPrev = prevInterval
        ? now >= prevInterval.open && now <= prevInterval.close
        : false
    const openByToday = todayInterval
        ? now >= todayInterval.open && now <= todayInterval.close
        : false

    const isOpenNow = openByPrev || openByToday
    const activeInterval = openByPrev
        ? prevInterval
        : openByToday
          ? todayInterval
          : null

    // Find the next opening interval from "now"
    function nextOpenInterval() {
        // If today has an interval and we're before opening -> that's next
        if (todayInterval && now < todayInterval.open) {
            return { ...todayInterval, dayOffset: 0 }
        }
        // Otherwise search the following days
        for (let i = 1; i <= 7; i++) {
            const idx = (todayIdx + i) % days.length
            const base = startOfToday.plus({ days: i })
            const ivl = intervalFor(idx, base)
            if (ivl) return { ...ivl, dayOffset: i }
        }
        return null
    }

    function getStatusText() {
        // If we're open, show the active interval (prev overnight or today)
        if (isOpenNow && activeInterval) {
            if (showTime) {
                return `${openPrefix} ${fmtRangeFromInterval(activeInterval)}`
            }
            return openPrefix
        }

        const nxt = nextOpenInterval()

        // If there is a future opening scheduled
        if (nxt) {
            if (nxt.dayOffset === 0) {
                // Later today
                return showTime
                    ? `${closedPrefix} today at ${nxt.open.toFormat(timeFmt)}`
                    : closedPrefix
            } else {
                // Another day
                const name = days[nxt.idx]?.dayName ?? ""
                return showTime
                    ? `${closedPrefix} ${name} ${fmtRangeFromInterval(nxt)}`
                    : `${closedPrefix} ${name}`
            }
        }

        // No upcoming openings in the provided week
        return "Closed. We'll be back."
    }

    // Typography + layout
    const {
        fontFamily = "Inter",
        fontWeight = "Medium",
        fontSize = 16,
        lineHeight = 1.2,
        letterSpacing = 0,
        fontStyle = "normal",
        textDecoration = "none",
        fontFeatureSettings = "",
        fontVariationSettings = "",
    } = textStyling?.font || {}

    const fsPx = typeof fontSize === "number" ? fontSize : parseFloat(fontSize)
    const lhNum =
        typeof lineHeight === "number" ? lineHeight : parseFloat(lineHeight)
    const lhPx = fsPx * lhNum
    const dotOffset = (lhPx - dotSize) / 2

    const mainColor = textStyling?.color || "#8A8A8A"
    const hoursColor = textStyling?.timeColor || "#8A8A8A"

    const fontStyles = {
        fontFamily,
        fontWeight,
        fontSize: fsPx,
        lineHeight: `${lhNum}`,
        letterSpacing,
        fontStyle,
        textDecoration,
        fontFeatureSettings,
        WebkitFontFeatureSettings: fontFeatureSettings,
        fontVariationSettings,
    }

    const wrapperStyle = {
        width: "100%",
        textAlign: distribution,
        overflow: "visible",
    } as React.CSSProperties

    const groupStyle = {
        display: "inline-flex",
        alignItems: "flex-start",
        margin: 0,
        padding: 0,
        overflow: "visible",
    } as React.CSSProperties

    const renderDot = () => {
        if (!dotIndicatorVisible) return null
        const baseColor = isOpenNow ? openDotColor : closedDotColor
        return (
            <span
                style={{
                    position: "relative",
                    display: "inline-block",
                    width: dotSize,
                    height: dotSize,
                    marginRight: gap,
                }}
            >
                {dotIndicatorFlashing && (
                    <span
                        style={{
                            position: "absolute",
                            top: dotOffset,
                            left: 0,
                            width: dotSize,
                            height: dotSize,
                            borderRadius: "50%",
                            backgroundColor: baseColor,
                            animation: `openhoursPulse ${pulseDuration}s infinite`,
                        }}
                    />
                )}
                <span
                    style={{
                        display: "inline-block",
                        width: dotSize,
                        height: dotSize,
                        borderRadius: "50%",
                        backgroundColor: baseColor,
                        marginTop: dotOffset,
                    }}
                />
            </span>
        )
    }

    const fullText = getStatusText()
    const simpleText = isOpenNow ? openPrefix : closedPrefix
    const displayText = showSchedule ? fullText : simpleText

    const splitIdx = displayText.search(/\d/)
    const prefixTxt =
        splitIdx >= 0 ? displayText.slice(0, splitIdx) : displayText
    const timeTxt =
        showSchedule && splitIdx >= 0 ? displayText.slice(splitIdx) : ""

    return (
        <motion.div style={wrapperStyle}>
            <div style={groupStyle}>
                {renderDot()}
                <p style={{ ...fontStyles, color: mainColor, margin: 0 }}>
                    {prefixTxt}
                    {timeTxt && (
                        <span style={{ color: hoursColor, opacity: 0.9 }}>
                            {timeTxt}
                        </span>
                    )}
                </p>
            </div>
        </motion.div>
    )
}

const timeZones = (Intl as any).supportedValuesOf("timeZone").sort()

addPropertyControls(Openhours, {
    textStyling: {
        title: "Text",
        type: ControlType.Object,
        defaultValue: {
            font: {
                fontFamily: "Inter",
                fontWeight: "Medium",
                fontSize: 16,
                lineHeight: 1.2,
                letterSpacing: 0,
                fontStyle: "normal",
                textDecoration: "none",
                fontFeatureSettings: "",
                fontVariationSettings: "",
            },
            color: "#8A8A8A",
            timeColor: "#8A8A8A",
            openPrefix: "Open",
            closedPrefix: "Closed. We'll be back",
        },
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
            },
            color: {
                type: ControlType.Color,
                title: "Status",
            },
            timeColor: {
                type: ControlType.Color,
                title: "Hours",
            },
            openPrefix: {
                type: ControlType.String,
                title: "Open Text",
            },
            closedPrefix: {
                type: ControlType.String,
                title: "Closed Text",
            },
        },
    },
    indicatorSettings: {
        title: "Indicator",
        type: ControlType.Object,
        controls: {
            dotIndicatorVisible: {
                type: ControlType.Boolean,
                title: "Show Dot",
                defaultValue: true,
            },
            dotIndicatorFlashing: {
                type: ControlType.Boolean,
                title: "Pulse Dot",
                defaultValue: true,
            },
            pulseDuration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 3,
                min: 0.3,
                max: 10,
                step: 0.1,
            },
            pulseScale: {
                type: ControlType.Number,
                title: "Pulse Scale",
                defaultValue: 2.6,
                min: 1,
                max: 10,
                step: 0.1,
            },
            dotSize: {
                type: ControlType.Number,
                title: "Dot Size",
                defaultValue: 8,
                min: 4,
                max: 50,
                step: 1,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            openDotColor: {
                type: ControlType.Color,
                title: "Open Color",
                defaultValue: "#00ED00",
            },
            closedDotColor: {
                type: ControlType.Color,
                title: "Close Color",
                defaultValue: "#FF0800",
            },
        },
    },
    timeSettings: {
        title: "Format",
        type: ControlType.Object,
        controls: {
            shopLocationTimezone: {
                type: ControlType.Enum,
                title: "Timezone",
                options: timeZones,
                defaultValue: "America/New_York",
            },
            timeFormat12: {
                type: ControlType.Boolean,
                title: "Format",
                enabledTitle: "12h",
                disabledTitle: "24h",
                defaultValue: true,
            },
            showTime: {
                type: ControlType.Boolean,
                title: "Show Time",
                defaultValue: true,
            },
            showSchedule: {
                type: ControlType.Boolean,
                title: "Schedule",
                enabledTitle: "Yes",
                disabledTitle: "No",
                defaultValue: true,
            },
            distribution: {
                type: ControlType.SegmentedEnum,
                title: "Alignment",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "Left",
            },
        },
    },
    days: {
        title: "Days",
        type: ControlType.Array,
        getItemTitle: (props, idx) => {
            const item = props.days[idx]
            return item?.dayName || `Day ${idx + 1}`
        },
        defaultValue: [
            { status: true, dayName: "Monday", hours: "09:00 - 17:00" },
            { status: true, dayName: "Tuesday", hours: "09:00 - 17:00" },
            { status: true, dayName: "Wednesday", hours: "09:00 - 17:00" },
            { status: true, dayName: "Thursday", hours: "09:00 - 17:00" },
            { status: true, dayName: "Friday", hours: "09:00 - 17:00" },
            { status: false, dayName: "Saturday", hours: "" },
            { status: false, dayName: "Sunday", hours: "" },
        ],
        propertyControl: {
            type: ControlType.Object,
            controls: {
                status: {
                    type: ControlType.Boolean,
                    title: "Status",
                    enabledTitle: "Open",
                    disabledTitle: "Closed",
                    defaultValue: true,
                },
                dayName: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Day",
                },
                hours: {
                    type: ControlType.String,
                    title: "Hours",
                    defaultValue: "09:00 - 17:00",
                    description:
                        'Use AM/PM in 12h mode, e.g. "9:00 AM - 5:00 PM".',
                    hidden: (props, idx) => !props.days[idx].status,
                },
            },
        },
    },
})
