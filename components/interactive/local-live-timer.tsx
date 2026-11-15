// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useState } from "react"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 50
 */
export default function LocalLiveTimer(props) {
    const {
        font,
        textColor,
        showSeconds,
        showLocation,
        locationFormat,
        showDay,
        gap,
        separator,
        style,
    } = props
    const [timeData, setTimeData] = useState({
        day: "",
        time: "",
        location: "",
    })

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()

            // Get user's timezone
            const userTimezone =
                Intl.DateTimeFormat().resolvedOptions().timeZone

            // Format time in 12-hour format with AM/PM
            const localTime = new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
                second: showSeconds ? "2-digit" : undefined,
                hour12: true,
            })
                .format(now)
                .toUpperCase()

            // Get day of week (Mon, Tue, Wed, etc.)
            const dayOfWeek = new Intl.DateTimeFormat("en-US", {
                weekday: "short",
            }).format(now)

            // Map timezone to country code and full name
            const getCountryInfo = (timezone) => {
                const countryData = {
                    // INDIA
                    "Asia/Kolkata": { code: "IN", name: "India" },
                    "Asia/Calcutta": { code: "IN", name: "India" },
                    "Asia/Mumbai": { code: "IN", name: "India" },
                    "Asia/Delhi": { code: "IN", name: "India" },
                    "Asia/Bangalore": { code: "IN", name: "India" },
                    "Asia/Chennai": { code: "IN", name: "India" },
                    "Asia/Hyderabad": { code: "IN", name: "India" },

                    // USA
                    "America/New_York": { code: "US", name: "United States" },
                    "America/Chicago": { code: "US", name: "United States" },
                    "America/Denver": { code: "US", name: "United States" },
                    "America/Los_Angeles": {
                        code: "US",
                        name: "United States",
                    },
                    "America/Phoenix": { code: "US", name: "United States" },
                    "America/Anchorage": { code: "US", name: "United States" },
                    "America/Honolulu": { code: "US", name: "United States" },
                    "America/Detroit": { code: "US", name: "United States" },
                    "America/Indianapolis": {
                        code: "US",
                        name: "United States",
                    },
                    "America/Boise": { code: "US", name: "United States" },
                    "Pacific/Honolulu": { code: "US", name: "United States" },

                    // CANADA
                    "America/Toronto": { code: "CA", name: "Canada" },
                    "America/Vancouver": { code: "CA", name: "Canada" },
                    "America/Montreal": { code: "CA", name: "Canada" },
                    "America/Edmonton": { code: "CA", name: "Canada" },
                    "America/Winnipeg": { code: "CA", name: "Canada" },
                    "America/Halifax": { code: "CA", name: "Canada" },
                    "America/Regina": { code: "CA", name: "Canada" },

                    // MEXICO
                    "America/Mexico_City": { code: "MX", name: "Mexico" },
                    "America/Cancun": { code: "MX", name: "Mexico" },
                    "America/Tijuana": { code: "MX", name: "Mexico" },

                    // UNITED KINGDOM
                    "Europe/London": { code: "GB", name: "United Kingdom" },
                    "Europe/Belfast": { code: "GB", name: "United Kingdom" },
                    "Europe/Edinburgh": { code: "GB", name: "United Kingdom" },

                    // FRANCE
                    "Europe/Paris": { code: "FR", name: "France" },

                    // GERMANY
                    "Europe/Berlin": { code: "DE", name: "Germany" },
                    "Europe/Munich": { code: "DE", name: "Germany" },

                    // SPAIN
                    "Europe/Madrid": { code: "ES", name: "Spain" },
                    "Europe/Barcelona": { code: "ES", name: "Spain" },

                    // ITALY
                    "Europe/Rome": { code: "IT", name: "Italy" },
                    "Europe/Milan": { code: "IT", name: "Italy" },

                    // NETHERLANDS
                    "Europe/Amsterdam": { code: "NL", name: "Netherlands" },

                    // BELGIUM
                    "Europe/Brussels": { code: "BE", name: "Belgium" },

                    // AUSTRIA
                    "Europe/Vienna": { code: "AT", name: "Austria" },

                    // SWEDEN
                    "Europe/Stockholm": { code: "SE", name: "Sweden" },

                    // DENMARK
                    "Europe/Copenhagen": { code: "DK", name: "Denmark" },

                    // NORWAY
                    "Europe/Oslo": { code: "NO", name: "Norway" },

                    // FINLAND
                    "Europe/Helsinki": { code: "FI", name: "Finland" },

                    // POLAND
                    "Europe/Warsaw": { code: "PL", name: "Poland" },

                    // CZECH REPUBLIC
                    "Europe/Prague": { code: "CZ", name: "Czech Republic" },

                    // HUNGARY
                    "Europe/Budapest": { code: "HU", name: "Hungary" },

                    // ROMANIA
                    "Europe/Bucharest": { code: "RO", name: "Romania" },

                    // GREECE
                    "Europe/Athens": { code: "GR", name: "Greece" },

                    // TURKEY
                    "Europe/Istanbul": { code: "TR", name: "Turkey" },
                    "Asia/Istanbul": { code: "TR", name: "Turkey" },

                    // RUSSIA
                    "Europe/Moscow": { code: "RU", name: "Russia" },
                    "Asia/Yekaterinburg": { code: "RU", name: "Russia" },
                    "Asia/Vladivostok": { code: "RU", name: "Russia" },

                    // SWITZERLAND
                    "Europe/Zurich": { code: "CH", name: "Switzerland" },

                    // IRELAND
                    "Europe/Dublin": { code: "IE", name: "Ireland" },

                    // PORTUGAL
                    "Europe/Lisbon": { code: "PT", name: "Portugal" },

                    // JAPAN
                    "Asia/Tokyo": { code: "JP", name: "Japan" },

                    // SOUTH KOREA
                    "Asia/Seoul": { code: "KR", name: "South Korea" },

                    // CHINA
                    "Asia/Shanghai": { code: "CN", name: "China" },
                    "Asia/Beijing": { code: "CN", name: "China" },

                    // HONG KONG
                    "Asia/Hong_Kong": { code: "HK", name: "Hong Kong" },

                    // SINGAPORE
                    "Asia/Singapore": { code: "SG", name: "Singapore" },

                    // THAILAND
                    "Asia/Bangkok": { code: "TH", name: "Thailand" },

                    // INDONESIA
                    "Asia/Jakarta": { code: "ID", name: "Indonesia" },

                    // PHILIPPINES
                    "Asia/Manila": { code: "PH", name: "Philippines" },

                    // UAE
                    "Asia/Dubai": { code: "AE", name: "United Arab Emirates" },

                    // PAKISTAN
                    "Asia/Karachi": { code: "PK", name: "Pakistan" },

                    // BANGLADESH
                    "Asia/Dhaka": { code: "BD", name: "Bangladesh" },

                    // TAIWAN
                    "Asia/Taipei": { code: "TW", name: "Taiwan" },

                    // MALAYSIA
                    "Asia/Kuala_Lumpur": { code: "MY", name: "Malaysia" },

                    // VIETNAM
                    "Asia/Ho_Chi_Minh": { code: "VN", name: "Vietnam" },

                    // SAUDI ARABIA
                    "Asia/Riyadh": { code: "SA", name: "Saudi Arabia" },

                    // IRAN
                    "Asia/Tehran": { code: "IR", name: "Iran" },

                    // ISRAEL
                    "Asia/Jerusalem": { code: "IL", name: "Israel" },

                    // SRI LANKA
                    "Asia/Colombo": { code: "LK", name: "Sri Lanka" },

                    // NEPAL
                    "Asia/Kathmandu": { code: "NP", name: "Nepal" },

                    // AUSTRALIA
                    "Australia/Sydney": { code: "AU", name: "Australia" },
                    "Australia/Melbourne": { code: "AU", name: "Australia" },
                    "Australia/Brisbane": { code: "AU", name: "Australia" },
                    "Australia/Perth": { code: "AU", name: "Australia" },

                    // NEW ZEALAND
                    "Pacific/Auckland": { code: "NZ", name: "New Zealand" },

                    // BRAZIL
                    "America/Sao_Paulo": { code: "BR", name: "Brazil" },

                    // ARGENTINA
                    "America/Buenos_Aires": { code: "AR", name: "Argentina" },

                    // CHILE
                    "America/Santiago": { code: "CL", name: "Chile" },

                    // PERU
                    "America/Lima": { code: "PE", name: "Peru" },

                    // COLOMBIA
                    "America/Bogota": { code: "CO", name: "Colombia" },

                    // EGYPT
                    "Africa/Cairo": { code: "EG", name: "Egypt" },

                    // NIGERIA
                    "Africa/Lagos": { code: "NG", name: "Nigeria" },

                    // KENYA
                    "Africa/Nairobi": { code: "KE", name: "Kenya" },

                    // SOUTH AFRICA
                    "Africa/Johannesburg": { code: "ZA", name: "South Africa" },
                }

                return countryData[timezone] || { code: "XX", name: "Unknown" }
            }

            const countryInfo = getCountryInfo(userTimezone)
            const locationText =
                locationFormat === "code" ? countryInfo.code : countryInfo.name

            // Update state with separate parts
            setTimeData({
                day: dayOfWeek,
                time: localTime,
                location: locationText,
            })
        }

        // Update immediately
        updateTime()

        // Update every second
        const intervalId = setInterval(updateTime, 1000)

        // Cleanup on unmount
        return () => clearInterval(intervalId)
    }, [showSeconds, showLocation, locationFormat, showDay])

    // Build parts array for rendering - each element separate including separators
    const renderParts = []

    if (showDay) {
        renderParts.push({ key: "day", content: timeData.day })
        renderParts.push({ key: "sep1", content: separator })
    }

    renderParts.push({ key: "time", content: timeData.time })

    if (showLocation) {
        renderParts.push({ key: "sep2", content: separator })
        renderParts.push({ key: "location", content: timeData.location })
    }

    return (
        <div
            style={{
                ...style,
                ...font,
                color: textColor,
                display: "inline-flex",
                alignItems: "center",
                gap: `${gap}px`,
            }}
        >
            {renderParts.map((part) => (
                <span key={part.key}>{part.content}</span>
            ))}
        </div>
    )
}

// Default Props
LocalLiveTimer.defaultProps = {
    showSeconds: false,
    showLocation: true,
    locationFormat: "code",
    showDay: false,
    textColor: "#000000",
    gap: 8,
    separator: "-",
    font: {
        fontFamily: "Inter",
        fontSize: 24,
        fontWeight: "600",
        lineHeight: "1.5em",
        letterSpacing: "0em",
        textAlign: "left",
    },
}

// Property Controls
addPropertyControls(LocalLiveTimer, {
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: LocalLiveTimer.defaultProps.font,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    separator: {
        type: ControlType.String,
        title: "Separator",
        defaultValue: "-",
        placeholder: "-",
        description: "Character(s) between elements (e.g., '-' or '|' or '•')",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 8,
        displayStepper: true,
        description: "Spacing between ALL elements",
    },
    showDay: {
        type: ControlType.Boolean,
        title: "Show Day",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showLocation: {
        type: ControlType.Boolean,
        title: "Show Location",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    locationFormat: {
        type: ControlType.Enum,
        title: "Location Format",
        options: ["code", "fullName"],
        optionTitles: ["Country Code (IN)", "Full Name (India)"],
        defaultValue: "code",
        hidden: (props) => !props.showLocation,
    },
})
