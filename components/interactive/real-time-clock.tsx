// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useEffect, useState } from "react"
import moment from "moment-timezone"

// List of timezones
const timezones = moment.tz.names()
function getTimeInZone(timezone, showSeconds, use24HourFormat) {
    const date = new Date()
    const timeOptions = {
        hour: "numeric",
        minute: "numeric",
        second: showSeconds ? "numeric" : undefined,
        hour12: !use24HourFormat,
        timeZone: timezone,
    }
    return new Intl.DateTimeFormat("en-US", timeOptions).format(date)
}

/**
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function RealTimeClock(props) {
    const [time, setTime] = useState(
        getTimeInZone(props.location, props.showSeconds, props.use24HourFormat)
    )

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime(
                getTimeInZone(
                    props.location,
                    props.showSeconds,
                    props.use24HourFormat
                )
            )
        }, 1000)
        return () => clearInterval(intervalId)
    }, [props.location, props.showSeconds, props.use24HourFormat])

    return (
        <div style={{ ...props.style, ...props.font, color: props.color }}>
            {time}
        </div>
    )
}

RealTimeClock.displayName = "Real Time Clock"

addPropertyControls(RealTimeClock, {
    font: {
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            lineHeight: 1.2,
            description: "Play with font properties",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Font Color",
        defaultValue: "#000",
        description: "Select your text color",
    },
    location: {
        type: ControlType.Enum,
        title: "Location",
        defaultValue: "UTC",
        options: timezones,
        optionTitles: timezones,
        description: "Select a timezone",
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: false,
        description: "Turn on if you want to show seconds.",
    },
    use24HourFormat: {
        type: ControlType.Boolean,
        title: "24-Hour Format",
        defaultValue: false,
        description:
            "Use if you want 24 hour format \n \n  Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works)",
    },
})
