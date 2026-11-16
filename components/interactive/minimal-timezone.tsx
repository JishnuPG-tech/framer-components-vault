// Time zone component with location ID, customizable time format and styling
import { useEffect, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TimeZoneProps {
    locationId: string
    showLocationId: boolean
    showTime: boolean
    timeFormat: "12h" | "24h"
    showSeconds: boolean
    layout: "vertical" | "horizontal"
    backgroundColor: string
    textColor: string
    locationColor: string
    font: any
    locationFont: any
    borderRadius: number
    padding: number
    style?: CSSProperties
}

/**
 * Time Zone Display
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 80
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TimeZone(props: TimeZoneProps) {
    const {
        locationId,
        showLocationId,
        showTime,
        timeFormat,
        showSeconds,
        layout,
        backgroundColor,
        textColor,
        locationColor,
        font,
        locationFont,
        borderRadius,
        padding,
    } = props

    const [time, setTime] = useState("")
    const [detectedTimezone, setDetectedTimezone] = useState("")

    useEffect(() => {
        if (typeof window === "undefined") return

        // Detect user's timezone if "My Location" is selected
        if (locationId === "My Location") {
            try {
                const userTimezone =
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                startTransition(() => setDetectedTimezone(userTimezone))
            } catch (error) {
                startTransition(() => setDetectedTimezone("UTC"))
            }
        }
    }, [locationId])

    useEffect(() => {
        if (typeof window === "undefined") return

        const updateTime = () => {
            try {
                const now = new Date()
                const activeTimezone =
                    locationId === "My Location" ? detectedTimezone : locationId
                if (!activeTimezone) return

                const options: Intl.DateTimeFormatOptions = {
                    timeZone: activeTimezone,
                    hour: "2-digit",
                    minute: "2-digit",
                    ...(showSeconds && { second: "2-digit" }),
                    hour12: timeFormat === "12h",
                }
                const formattedTime = new Intl.DateTimeFormat(
                    "en-US",
                    options
                ).format(now)
                startTransition(() => setTime(formattedTime))
            } catch (error) {
                startTransition(() => setTime("Invalid timezone"))
            }
        }

        updateTime()
        const interval = setInterval(updateTime, 1000)

        return () => clearInterval(interval)
    }, [locationId, detectedTimezone, timeFormat, showSeconds])

    const isFixedWidth = props?.style && props.style.width === "100%"
    const isFixedHeight = props?.style && props.style.height === "100%"

    const displayLocation =
        locationId === "My Location"
            ? detectedTimezone || "Detecting..."
            : locationId
    const readableLocation = displayLocation.replace(/_/g, " ")

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                borderRadius,
                padding,
                display: "flex",
                flexDirection: layout === "vertical" ? "column" : "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                ...(isFixedWidth ? {} : { minWidth: "max-content" }),
                ...(isFixedHeight ? {} : { minHeight: "max-content" }),
            }}
        >
            {showTime && (
                <div
                    style={{
                        color: textColor,
                        ...font,
                        whiteSpace: "nowrap",
                    }}
                >
                    {time || "00:00"}
                </div>
            )}
            {showLocationId && (
                <div
                    style={{
                        color: locationColor,
                        ...locationFont,
                        whiteSpace: "nowrap",
                    }}
                >
                    {readableLocation}
                </div>
            )}
        </div>
    )
}

addPropertyControls(TimeZone, {
    locationId: {
        type: ControlType.Enum,
        title: "Location",
        options: [
            "My Location",
            "America/Buenos_Aires",
            "Australia/Brisbane",
            "Australia/Melbourne",
            "Australia/Perth",
            "Australia/Sydney",
            "Europe/Vienna",
            "Asia/Dhaka",
            "Europe/Brussels",
            "America/Sao_Paulo",
            "America/Toronto",
            "America/Vancouver",
            "America/Santiago",
            "Asia/Shanghai",
            "America/Bogota",
            "Europe/Prague",
            "America/Havana",
            "Europe/Copenhagen",
            "Africa/Cairo",
            "Europe/Helsinki",
            "Pacific/Fiji",
            "Europe/Paris",
            "Europe/Berlin",
            "Europe/Athens",
            "Asia/Hong_Kong",
            "Asia/Jakarta",
            "Asia/Kolkata",
            "Asia/Tehran",
            "Asia/Baghdad",
            "Europe/Dublin",
            "Asia/Jerusalem",
            "Europe/Rome",
            "Asia/Tokyo",
            "Africa/Nairobi",
            "Asia/Seoul",
            "Asia/Kuala_Lumpur",
            "America/Mexico_City",
            "Africa/Casablanca",
            "Europe/Amsterdam",
            "Pacific/Auckland",
            "Africa/Lagos",
            "Europe/Oslo",
            "Asia/Karachi",
            "Asia/Manila",
            "America/Lima",
            "Europe/Lisbon",
            "Europe/Warsaw",
            "Europe/Moscow",
            "Asia/Riyadh",
            "Asia/Singapore",
            "Africa/Johannesburg",
            "Europe/Madrid",
            "Europe/Stockholm",
            "Europe/Zurich",
            "Asia/Taipei",
            "Asia/Bangkok",
            "Europe/Istanbul",
            "Asia/Dubai",
            "Europe/London",
            "America/Anchorage",
            "America/Chicago",
            "America/Denver",
            "Pacific/Honolulu",
            "America/Los_Angeles",
            "America/New_York",
            "America/Phoenix",
            "UTC",
            "America/Caracas",
            "Asia/Ho_Chi_Minh",
        ],
        optionTitles: [
            "My Location",
            "America/Buenos Aires",
            "Australia/Brisbane",
            "Australia/Melbourne",
            "Australia/Perth",
            "Australia/Sydney",
            "Europe/Vienna",
            "Asia/Dhaka",
            "Europe/Brussels",
            "America/São Paulo",
            "America/Toronto",
            "America/Vancouver",
            "America/Santiago",
            "Asia/Shanghai",
            "America/Bogotá",
            "Europe/Prague",
            "America/Havana",
            "Europe/Copenhagen",
            "Africa/Cairo",
            "Europe/Helsinki",
            "Pacific/Fiji",
            "Europe/Paris",
            "Europe/Berlin",
            "Europe/Athens",
            "Asia/Hong Kong",
            "Asia/Jakarta",
            "Asia/Kolkata",
            "Asia/Mumbai",
            "Asia/Tehran",
            "Asia/Baghdad",
            "Europe/Dublin",
            "Asia/Jerusalem",
            "Europe/Rome",
            "Asia/Tokyo",
            "Africa/Nairobi",
            "Asia/Seoul",
            "Asia/Kuala Lumpur",
            "America/Mexico City",
            "Africa/Casablanca",
            "Europe/Amsterdam",
            "Pacific/Auckland",
            "Africa/Lagos",
            "Europe/Oslo",
            "Asia/Karachi",
            "Asia/Manila",
            "America/Lima",
            "Europe/Lisbon",
            "Europe/Warsaw",
            "Europe/Moscow",
            "Asia/Riyadh",
            "Asia/Singapore",
            "Africa/Johannesburg",
            "Europe/Madrid",
            "Europe/Stockholm",
            "Europe/Zurich",
            "Asia/Taipei",
            "Asia/Bangkok",
            "Europe/Istanbul",
            "Asia/Dubai",
            "Europe/London",
            "America/Anchorage",
            "America/Chicago",
            "America/Denver",
            "Pacific/Honolulu",
            "America/Los Angeles",
            "America/New York",
            "America/Phoenix",
            "UTC",
            "America/Caracas",
            "Asia/Ho Chi Minh",
        ],
        defaultValue: "auto",
    },
    showLocationId: {
        type: ControlType.Boolean,
        title: "Show Location",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showTime: {
        type: ControlType.Boolean,
        title: "Show Time",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
    timeFormat: {
        type: ControlType.Enum,
        title: "Time Format",
        options: ["12h", "24h"],
        optionTitles: ["12 Hour", "24 Hour"],
        defaultValue: "24h",
        displaySegmentedControl: true,
        hidden: ({ showTime }) => !showTime,
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showTime }) => !showTime,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Time Color",
        defaultValue: "#000000",
        hidden: ({ showTime }) => !showTime,
    },
    locationColor: {
        type: ControlType.Color,
        title: "Location Color",
        defaultValue: "#CCCCCC",
    },
    font: {
        type: ControlType.Font,
        title: "Time Font",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showTime }) => !showTime,
    },
    locationFont: {
        type: ControlType.Font,
        title: "Location Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
})
