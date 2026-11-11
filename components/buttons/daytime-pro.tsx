// Component that displays customizable date and time with format symbols
// Supports symbols like {dddd}, {MMMM}, {yyyy}, etc. wrapped in curly braces
// Full list of symbols available at www.framer.com
// Now supports Local and International time with timezone selection

import {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface DateTimeProProps {
    text: string
    textColor: string
    fontSource: any
    mode: "local" | "international"
    region: string
    timezoneNorthAmerica: string
    timezoneSouthAmerica: string
    timezoneEurope: string
    timezoneMiddleEast: string
    timezoneSouthAsia: string
    timezoneSoutheastAsia: string
    timezoneEastAsia: string
    timezoneAustraliaOceania: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DateTimePro(props: DateTimeProProps) {
    const {
        text,
        textColor,
        fontSource,
        mode,
        region,
        timezoneNorthAmerica,
        timezoneSouthAmerica,
        timezoneEurope,
        timezoneMiddleEast,
        timezoneSouthAsia,
        timezoneSoutheastAsia,
        timezoneEastAsia,
        timezoneAustraliaOceania,
    } = props
    const [displayText, setDisplayText] = useState("")
    const [inheritedStyles, setInheritedStyles] = useState({})
    const measureRef = useRef(null)

    useEffect(() => {
        if (!fontSource || !measureRef.current) return

        const extractStyles = () => {
            const container = measureRef.current
            if (!container) return
            const allElements = container.getElementsByTagName("*")

            let targetElement = null
            for (let i = 0; i < allElements.length; i++) {
                const el = allElements[i]
                if (el.children.length === 0 && el.textContent?.trim()) {
                    targetElement = el
                    break
                }
            }

            if (targetElement) {
                const styles = window.getComputedStyle(targetElement)
                setInheritedStyles({
                    fontFamily: styles.fontFamily,
                    fontSize: styles.fontSize,
                    fontWeight: styles.fontWeight,
                    fontStyle: styles.fontStyle,
                    lineHeight: styles.lineHeight,
                    letterSpacing: styles.letterSpacing,
                    textTransform: styles.textTransform,
                    textDecoration: styles.textDecoration,
                })
            }
        }

        const timeouts = [0, 100, 300, 500]
        timeouts.forEach((delay) => setTimeout(extractStyles, delay))

        return () => timeouts.forEach((delay) => clearTimeout(delay))
    }, [fontSource])

    useEffect(() => {
        const updateDisplay = () => {
            const now = new Date()

            // Determine which timezone to use based on region
            let useTimezone = undefined
            if (mode === "international") {
                switch (region) {
                    case "north_america":
                        useTimezone = timezoneNorthAmerica
                        break
                    case "south_america":
                        useTimezone = timezoneSouthAmerica
                        break
                    case "europe":
                        useTimezone = timezoneEurope
                        break
                    case "middle_east":
                        useTimezone = timezoneMiddleEast
                        break
                    case "south_asia":
                        useTimezone = timezoneSouthAsia
                        break
                    case "southeast_asia":
                        useTimezone = timezoneSoutheastAsia
                        break
                    case "east_asia":
                        useTimezone = timezoneEastAsia
                        break
                    case "australia_oceania":
                        useTimezone = timezoneAustraliaOceania
                        break
                }
            }

            // Create a formatter to get individual parts
            const getDatePart = (options: Intl.DateTimeFormatOptions) => {
                return new Intl.DateTimeFormat("en-US", {
                    ...options,
                    timeZone: useTimezone,
                }).format(now)
            }

            // Get hours and minutes properly
            const hours24 = parseInt(
                new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    hour12: false,
                    timeZone: useTimezone,
                }).format(now)
            )

            const hours12Raw = parseInt(
                new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    hour12: true,
                    timeZone: useTimezone,
                }).format(now)
            )

            const hours12 = hours12Raw === 0 ? 12 : hours12Raw

            const minutes = parseInt(
                new Intl.DateTimeFormat("en-US", {
                    minute: "2-digit",
                    timeZone: useTimezone,
                }).format(now)
            )

            const seconds = now.getSeconds()
            const ampm = new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                hour12: true,
                timeZone: useTimezone,
            })
                .format(now)
                .includes("PM")
                ? "PM"
                : "AM"

            // Helper functions for advanced date calculations
            const getWeekOfYear = (date: Date) => {
                const start = new Date(date.getFullYear(), 0, 1)
                const diff = date.getTime() - start.getTime()
                const oneWeek = 1000 * 60 * 60 * 24 * 7
                return Math.ceil(diff / oneWeek)
            }

            const getWeekOfMonth = (date: Date) => {
                const firstDay = new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    1
                )
                const day = date.getDate()
                return Math.ceil((day + firstDay.getDay()) / 7)
            }

            const getDayOfYear = (date: Date) => {
                const start = new Date(date.getFullYear(), 0, 0)
                const diff = date.getTime() - start.getTime()
                const oneDay = 1000 * 60 * 60 * 24
                return Math.floor(diff / oneDay)
            }

            const getOrdinal = (n: number) => {
                const s = ["th", "st", "nd", "rd"]
                const v = n % 100
                return n + (s[(v - 20) % 10] || s[v] || s[0])
            }

            const day = parseInt(getDatePart({ day: "numeric" }))
            const month = parseInt(getDatePart({ month: "numeric" }))
            const weekOfYear = getWeekOfYear(now)
            const weekOfMonth = getWeekOfMonth(now)
            const dayOfYear = getDayOfYear(now)

            const formatMap = {
                // AM/PM
                a: ampm.toLowerCase(),
                A: ampm.toUpperCase(),

                // Seconds
                ss: seconds.toString().padStart(2, "0"),
                s: seconds.toString(),

                // Minutes
                mm: minutes.toString().padStart(2, "0"),
                m: minutes.toString(),

                // Hours (12-hour)
                hh: hours12.toString().padStart(2, "0"),
                h: hours12.toString(),

                // Hours (24-hour)
                HH: hours24.toString().padStart(2, "0"),
                H: hours24.toString(),

                // Week of year
                WW: weekOfYear.toString().padStart(2, "0"),
                W: weekOfYear.toString(),

                // Week of month
                ww: weekOfMonth.toString().padStart(2, "0"),
                w: weekOfMonth.toString(),

                // Year
                YYYY: getDatePart({ year: "numeric" }),
                YY: getDatePart({ year: "2-digit" }),

                // Month
                MMMM: getDatePart({ month: "long" }),
                MMM: getDatePart({ month: "short" }),
                MM: getDatePart({ month: "2-digit" }),
                M: month.toString(),

                // Day of month with ordinal
                do: getOrdinal(day),

                // Day of year
                DD: dayOfYear.toString().padStart(2, "0"),
                D: dayOfYear.toString(),

                // Weekday
                dddd: getDatePart({ weekday: "long" }),
                ddd: getDatePart({ weekday: "short" }),

                // Day of month
                dd: getDatePart({ day: "2-digit" }),
                d: day.toString(),
            }

            let result = text
            const regex = /\{([^}]+)\}/g

            result = result.replace(regex, (match, symbol) => {
                return formatMap[symbol] !== undefined
                    ? formatMap[symbol]
                    : match
            })

            startTransition(() => setDisplayText(result))
        }

        updateDisplay()
        const interval = setInterval(updateDisplay, 1000)

        return () => clearInterval(interval)
    }, [
        text,
        mode,
        region,
        timezoneNorthAmerica,
        timezoneSouthAmerica,
        timezoneEurope,
        timezoneMiddleEast,
        timezoneSouthAsia,
        timezoneSoutheastAsia,
        timezoneEastAsia,
        timezoneAustraliaOceania,
    ])

    return (
        <>
            <div
                ref={measureRef}
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    pointerEvents: "none",
                    top: -9999,
                    left: -9999,
                    width: "max-content",
                    height: "max-content",
                }}
            >
                {fontSource}
            </div>
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    color: textColor,
                    ...inheritedStyles,
                }}
            >
                {displayText}
            </div>
        </>
    )
}

addPropertyControls(DateTimePro, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "Today is {dddd}, {MMMM} {do}, {YYYY} at {h}:{mm}:{ss} {a}",
        displayTextArea: true,
        description:
            "Always use {} around tokens. [Check out all the tokens](https://mj-datetimedisplay.framer.website/tokens)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    fontSource: {
        type: ControlType.ComponentInstance,
        title: "Font Source",
        description: "Connect a frame containing text",
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["local", "international"],
        optionTitles: ["System Time", "International Time"],
        defaultValue: "local",
    },
    region: {
        type: ControlType.Enum,
        title: "Region",
        options: [
            "north_america",
            "south_america",
            "europe",
            "middle_east",
            "south_asia",
            "southeast_asia",
            "east_asia",
            "australia_oceania",
        ],
        optionTitles: [
            "North America",
            "South America",
            "Europe",
            "Middle East",
            "South Asia",
            "Southeast Asia",
            "East Asia",
            "Australia & Oceania",
        ],
        defaultValue: "south_asia",
        hidden: (props) => props.mode === "local",
    },
    timezoneNorthAmerica: {
        type: ControlType.Enum,
        title: "Timezone",
        options: [
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "America/Anchorage",
            "Pacific/Honolulu",
            "America/Toronto",
            "America/Vancouver",
            "America/Mexico_City",
        ],
        optionTitles: [
            "New York (EST/EDT)",
            "Chicago (CST/CDT)",
            "Denver (MST/MDT)",
            "Los Angeles (PST/PDT)",
            "Anchorage (AKST/AKDT)",
            "Honolulu (HST)",
            "Toronto (EST/EDT)",
            "Vancouver (PST/PDT)",
            "Mexico City (CST/CDT)",
        ],
        defaultValue: "America/New_York",
        hidden: (props) =>
            props.mode === "local" || props.region !== "north_america",
    },
    timezoneSouthAmerica: {
        type: ControlType.Enum,
        title: "Timezone",
        options: [
            "America/Argentina/Buenos_Aires",
            "America/Sao_Paulo",
            "America/Santiago",
            "America/Lima",
            "America/Bogota",
        ],
        optionTitles: [
            "Buenos Aires (ART)",
            "São Paulo (BRT/BRST)",
            "Santiago (CLT/CLST)",
            "Lima (PET)",
            "Bogotá (COT)",
        ],
        defaultValue: "America/Argentina/Buenos_Aires",
        hidden: (props) =>
            props.mode === "local" || props.region !== "south_america",
    },
    timezoneEurope: {
        type: ControlType.Enum,
        title: "Timezone",
        options: [
            "Europe/London",
            "Europe/Paris",
            "Europe/Berlin",
            "Europe/Rome",
            "Europe/Madrid",
            "Europe/Amsterdam",
            "Europe/Brussels",
            "Europe/Vienna",
            "Europe/Stockholm",
            "Europe/Zurich",
            "Europe/Lisbon",
            "Europe/Athens",
            "Europe/Helsinki",
            "Europe/Moscow",
        ],
        optionTitles: [
            "London (GMT/BST)",
            "Paris (CET/CEST)",
            "Berlin (CET/CEST)",
            "Rome (CET/CEST)",
            "Madrid (CET/CEST)",
            "Amsterdam (CET/CEST)",
            "Brussels (CET/CEST)",
            "Vienna (CET/CEST)",
            "Stockholm (CET/CEST)",
            "Zurich (CET/CEST)",
            "Lisbon (WET/WEST)",
            "Athens (EET/EEST)",
            "Helsinki (EET/EEST)",
            "Moscow (MSK)",
        ],
        defaultValue: "Europe/London",
        hidden: (props) => props.mode === "local" || props.region !== "europe",
    },
    timezoneMiddleEast: {
        type: ControlType.Enum,
        title: "Timezone",
        options: ["Asia/Dubai", "Asia/Riyadh", "Asia/Qatar", "Asia/Tehran"],
        optionTitles: [
            "Dubai (GST)",
            "Riyadh (AST)",
            "Doha (AST)",
            "Tehran (IRST)",
        ],
        defaultValue: "Asia/Dubai",
        hidden: (props) =>
            props.mode === "local" || props.region !== "middle_east",
    },
    timezoneSouthAsia: {
        type: ControlType.Enum,
        title: "Timezone",
        options: [
            "Asia/Kolkata",
            "Asia/Karachi",
            "Asia/Dhaka",
            "Asia/Kathmandu",
            "Asia/Colombo",
        ],
        optionTitles: [
            "Mumbai (IST)",
            "Karachi (PKT)",
            "Dhaka (BST)",
            "Kathmandu (NPT)",
            "Colombo (IST)",
        ],
        defaultValue: "Asia/Dhaka",
        hidden: (props) =>
            props.mode === "local" || props.region !== "south_asia",
    },
    timezoneSoutheastAsia: {
        type: ControlType.Enum,
        title: "Timezone",
        options: [
            "Asia/Bangkok",
            "Asia/Jakarta",
            "Asia/Singapore",
            "Asia/Kuala_Lumpur",
            "Asia/Manila",
            "Asia/Ho_Chi_Minh",
        ],
        optionTitles: [
            "Bangkok (ICT)",
            "Jakarta (WIB)",
            "Singapore (SGT)",
            "Kuala Lumpur (MYT)",
            "Manila (PHT)",
            "Ho Chi Minh City (ICT)",
        ],
        defaultValue: "Asia/Bangkok",
        hidden: (props) =>
            props.mode === "local" || props.region !== "southeast_asia",
    },
    timezoneEastAsia: {
        type: ControlType.Enum,
        title: "Timezone",
        options: [
            "Asia/Shanghai",
            "Asia/Hong_Kong",
            "Asia/Taipei",
            "Asia/Tokyo",
            "Asia/Seoul",
        ],
        optionTitles: [
            "Beijing (CST)",
            "Hong Kong (HKT)",
            "Taipei (CST)",
            "Tokyo (JST)",
            "Seoul (KST)",
        ],
        defaultValue: "Asia/Shanghai",
        hidden: (props) =>
            props.mode === "local" || props.region !== "east_asia",
    },
    timezoneAustraliaOceania: {
        type: ControlType.Enum,
        title: "Timezone",
        options: [
            "Australia/Sydney",
            "Australia/Melbourne",
            "Australia/Brisbane",
            "Australia/Adelaide",
            "Australia/Darwin",
            "Australia/Perth",
            "Pacific/Auckland",
            "Pacific/Fiji",
        ],
        optionTitles: [
            "Sydney (AEST/AEDT)",
            "Melbourne (AEST/AEDT)",
            "Brisbane (AEST)",
            "Adelaide (ACST/ACDT)",
            "Darwin (ACST)",
            "Perth (AWST)",
            "Auckland (NZST/NZDT)",
            "Fiji (FJT)",
        ],
        defaultValue: "Australia/Sydney",
        hidden: (props) =>
            props.mode === "local" || props.region !== "australia_oceania",
    },
})

DateTimePro.displayName = "DayTime Pro"
