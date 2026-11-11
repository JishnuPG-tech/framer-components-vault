// Framer component that displays the local time for a specific area set by the user.

import { useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TimezoneClocksProps {
    timezone: string
    use24Hour: boolean
    showSeconds: boolean
    showDayOfWeek: boolean
    separator: string
    textColor: string
    font: any
    leadingZero: boolean
    textCase: "normal" | "uppercase" | "lowercase"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SimpleTimezoneClock(props: TimezoneClocksProps) {
    const {
        timezone = "My Location",
        use24Hour = false,
        showSeconds = true,
        showDayOfWeek = false,
        separator = ":",
        textColor = "#000000",
        font,
        leadingZero = false,
        textCase = "normal",
        style,
    } = props

    const [time, setTime] = useState("")
    const [timeSegments, setTimeSegments] = useState<
        Array<{ type: string; content: string }>
    >([])
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const updateTime = () => {
            try {
                const now = new Date()
                // Detect visitor's timezone if "My Location" is selected
                const effectiveTimezone =
                    timezone === "My Location"
                        ? Intl.DateTimeFormat().resolvedOptions().timeZone
                        : timezone

                const options: Intl.DateTimeFormatOptions = {
                    timeZone: effectiveTimezone,
                    hour: "2-digit",
                    minute: "2-digit",
                    ...(showSeconds && { second: "2-digit" }),
                    hour12: !use24Hour,
                }

                const formatter = new Intl.DateTimeFormat("en-US", options)
                const formattedTime = formatter.format(now)

                // Remove leading zero from hours in 12-hour format if leadingZero is false
                let processedTime = formattedTime
                if (!use24Hour && !leadingZero) {
                    // Remove leading zero from hour (e.g., "04:31:45 PM" -> "4:31:45 PM")
                    processedTime = formattedTime.replace(/^0/, "")
                }

                // Replace colons with custom separator
                const customTime = processedTime.replace(/:/g, separator)

                // Parse the time into segments
                const segments: Array<{ type: string; content: string }> = []

                // Add day of week if enabled
                if (showDayOfWeek) {
                    const dayOptions: Intl.DateTimeFormatOptions = {
                        timeZone: effectiveTimezone,
                        weekday: "short",
                    }
                    const dayFormatter = new Intl.DateTimeFormat(
                        "en-US",
                        dayOptions
                    )
                    let dayOfWeek = dayFormatter.format(now)

                    // Apply text case transformation to day of week
                    if (textCase === "uppercase") {
                        dayOfWeek = dayOfWeek.toUpperCase()
                    } else if (textCase === "lowercase") {
                        dayOfWeek = dayOfWeek.toLowerCase()
                    }

                    segments.push({ type: "day", content: dayOfWeek })
                    segments.push({ type: "space", content: " " })
                }

                // Parse time string into digits and separators
                const timeWithoutAmPm = customTime.replace(
                    /\s?(AM|PM|am|pm)$/i,
                    ""
                )
                const ampmMatch = customTime.match(/\s?(AM|PM|am|pm)$/i)

                for (let i = 0; i < timeWithoutAmPm.length; i++) {
                    const char = timeWithoutAmPm[i]
                    if (/\d/.test(char)) {
                        segments.push({ type: "digit", content: char })
                    } else {
                        segments.push({ type: "separator", content: char })
                    }
                }

                // Add AM/PM if present
                if (ampmMatch) {
                    let ampm = ampmMatch[1]
                    // Apply text case transformation to AM/PM
                    if (textCase === "uppercase") {
                        ampm = ampm.toUpperCase()
                    } else if (textCase === "lowercase") {
                        ampm = ampm.toLowerCase()
                    }
                    segments.push({ type: "space", content: " " })
                    segments.push({ type: "ampm", content: ampm })
                }

                startTransition(() => {
                    setTimeSegments(segments)
                    setTime(customTime)
                })
            } catch (error) {
                startTransition(() => {
                    setTime("Invalid timezone")
                    setTimeSegments([])
                })
            }
        }

        updateTime()
        
        // Skip interval in static renderer
        if (isStatic) return
        
        const interval = setInterval(updateTime, 1000)

        return () => clearInterval(interval)
    }, [
        timezone,
        use24Hour,
        showSeconds,
        showDayOfWeek,
        separator,
        leadingZero,
        textCase,
        isStatic,
    ])

    // If there's an error, show the error message
    if (timeSegments.length === 0 && time) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    display: "inline-block",
                    width: "max-content",
                    minWidth: "max-content",
                    color: textColor,
                    backgroundColor: "transparent",
                    ...font,
                }}
            >
                {time}
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "inline-block",
                width: "max-content",
                minWidth: "max-content",
                color: textColor,
                backgroundColor: "transparent",
                ...font,
            }}
        >
            {timeSegments.map((segment, index) => {
                if (segment.type === "digit") {
                    return (
                        <span
                            key={index}
                            style={{
                                display: "inline-block",
                                width: "0.6em",
                                textAlign: "center",
                            }}
                        >
                            {segment.content}
                        </span>
                    )
                } else if (segment.type === "ampm") {
                    return (
                        <span
                            key={index}
                            style={{
                                display: "inline-block",
                                width: "2em",
                                textAlign: "left",
                            }}
                        >
                            {segment.content}
                        </span>
                    )
                } else {
                    return <span key={index}>{segment.content}</span>
                }
            })}
        </div>
    )
}

addPropertyControls(SimpleTimezoneClock, {
    timezone: {
        type: ControlType.Enum,
        title: "Timezone",
        defaultValue: "My Location",
        options: [
            "My Location",
            // Americas
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "America/Anchorage",
            "America/Toronto",
            "America/Vancouver",
            "America/Mexico_City",
            "America/Sao_Paulo",
            "America/Buenos_Aires",
            "America/Santiago",
            "America/Lima",
            "America/Bogota",
            "America/Caracas",
            "America/Panama",
            "America/Costa_Rica",
            "America/Guatemala",
            "America/Havana",
            "America/Jamaica",
            "America/Montevideo",
            "America/La_Paz",
            "America/Guayaquil",
            "America/Asuncion",
            // Europe
            "Europe/London",
            "Europe/Paris",
            "Europe/Berlin",
            "Europe/Madrid",
            "Europe/Rome",
            "Europe/Amsterdam",
            "Europe/Brussels",
            "Europe/Vienna",
            "Europe/Stockholm",
            "Europe/Copenhagen",
            "Europe/Oslo",
            "Europe/Helsinki",
            "Europe/Warsaw",
            "Europe/Prague",
            "Europe/Budapest",
            "Europe/Athens",
            "Europe/Istanbul",
            "Europe/Moscow",
            "Europe/Zurich",
            "Europe/Lisbon",
            "Europe/Dublin",
            "Europe/Kiev",
            "Europe/Bucharest",
            "Europe/Sofia",
            "Europe/Belgrade",
            "Europe/Zagreb",
            "Europe/Luxembourg",
            // Asia
            "Asia/Dubai",
            "Asia/Tokyo",
            "Asia/Shanghai",
            "Asia/Hong_Kong",
            "Asia/Singapore",
            "Asia/Seoul",
            "Asia/Bangkok",
            "Asia/Jakarta",
            "Asia/Manila",
            "Asia/Taipei",
            "Asia/Kolkata",
            "Asia/Karachi",
            "Asia/Dhaka",
            "Asia/Tehran",
            "Asia/Jerusalem",
            "Asia/Riyadh",
            "Asia/Kuwait",
            "Asia/Beirut",
            "Asia/Baghdad",
            "Asia/Kabul",
            "Asia/Tashkent",
            "Asia/Almaty",
            "Asia/Yangon",
            "Asia/Kathmandu",
            "Asia/Colombo",
            "Asia/Kuala_Lumpur",
            "Asia/Ho_Chi_Minh",
            "Asia/Phnom_Penh",
            "Asia/Vientiane",
            "Asia/Ulaanbaatar",
            // Pacific
            "Pacific/Auckland",
            "Australia/Sydney",
            "Australia/Melbourne",
            "Australia/Brisbane",
            "Australia/Perth",
            "Australia/Adelaide",
            "Pacific/Fiji",
            "Pacific/Honolulu",
            "Pacific/Guam",
            "Pacific/Tahiti",
            "Pacific/Port_Moresby",
            "Pacific/Noumea",
            "Pacific/Tongatapu",
            "Pacific/Apia",
            // Africa
            "Africa/Cairo",
            "Africa/Johannesburg",
            "Africa/Lagos",
            "Africa/Nairobi",
            "Africa/Casablanca",
            "Africa/Algiers",
            "Africa/Tunis",
            "Africa/Accra",
            "Africa/Addis_Ababa",
            "Africa/Dar_es_Salaam",
            "Africa/Kampala",
            "Africa/Khartoum",
            "Africa/Kinshasa",
            "Africa/Luanda",
            "Africa/Maputo",
            // Atlantic
            "Atlantic/Reykjavik",
            "Atlantic/Azores",
            "Atlantic/Cape_Verde",
            "Atlantic/Bermuda",
            "Atlantic/Canary",
        ],
    },
    use24Hour: {
        type: ControlType.Boolean,
        title: "24-Hour Format",
        defaultValue: false,
        enabledTitle: "24h",
        disabledTitle: "12h",
    },
    leadingZero: {
        type: ControlType.Boolean,
        title: "Leading Zero",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ use24Hour }) => use24Hour,
    },
    showDayOfWeek: {
        type: ControlType.Boolean,
        title: "Show Day",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    separator: {
        type: ControlType.String,
        title: "Separator",
        defaultValue: ":",
        placeholder: ":",
    },
    textCase: {
        type: ControlType.Enum,
        title: "Text Case",
        defaultValue: "normal",
        options: ["normal", "uppercase", "lowercase"],
        optionTitles: ["Normal", "Uppercase", "Lowercase"],
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
})
