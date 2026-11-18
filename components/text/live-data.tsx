// ============================================================
// LiveText — Framer Code Component
// Paste this entire file into a Framer Code Component
// ============================================================

import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Moon phase ──
function getMoonPhase() {
    const phases = [
        "New Moon",
        "Waxing Crescent",
        "First Quarter",
        "Waxing Gibbous",
        "Full Moon",
        "Waning Gibbous",
        "Last Quarter",
        "Waning Crescent",
    ]
    const synodic = 29.53058867
    const known = new Date(2000, 0, 6)
    const diff = (Date.now() - known.getTime()) / 86400000
    const idx = Math.floor(
        (((diff % synodic) + synodic) % synodic) / (synodic / 8)
    )
    return phases[idx]
}

function getDayPct() {
    const n = new Date()
    return (
        ((n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()) / 86400) *
        100
    ).toFixed(1)
}

const QUOTES = [
    "Simplicity is the ultimate sophistication",
    "Do what you can, with what you have, where you are",
    "The present moment is the only moment available to us",
    "Less is more",
    "Stay hungry, stay foolish",
    "In the middle of every difficulty lies opportunity",
    "Design is not just what it looks like. Design is how it works",
]

const WMO = {
    0: "clear sky",
    1: "mainly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "foggy",
    51: "light drizzle",
    61: "light rain",
    63: "rain",
    65: "heavy rain",
    71: "light snow",
    73: "snow",
    80: "showers",
    95: "thunderstorm",
}

// ── Main component ──
export default function LiveText({
    source,
    prefix,
    suffix,
    uppercase,
    fontFamily,
    customFont,
    fontSize,
    fontWeight,
    color,
    opacity,
    align,
    typewriterSpeed,
    style,
}) {
    const [displayText, setDisplayText] = useState("")
    const [locationData, setLocationData] = useState(null)
    const typewriterRef = useRef(null)
    const targetTextRef = useRef("")

    // ── Build sentence ──
    function buildSentence(locData) {
        let value = ""
        const loc = locData || locationData

        if (source === "datetime") {
            const n = new Date()
            const h = String(n.getHours()).padStart(2, "0")
            const m = String(n.getMinutes()).padStart(2, "0")
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            const months = [
                "Jan",
                "Feb",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ]
            value = `${h}:${m}, ${days[n.getDay()]} ${n.getDate()} ${months[n.getMonth()]}`
        } else if (source === "weather") {
            if (!loc) return prefix + "allow location access" + suffix
            value = `${loc.temp}°C, ${loc.desc}`
        } else if (source === "city") {
            if (!loc) return prefix + "allow location access" + suffix
            value = `${loc.city}, ${loc.country}`
        } else if (source === "sun") {
            if (!loc) return prefix + "allow location access" + suffix
            value = `sunrise ${loc.sunrise} · sunset ${loc.sunset}`
        } else if (source === "moon") {
            value = getMoonPhase()
        } else if (source === "quote") {
            const d = new Date()
            value = QUOTES[(d.getDate() + d.getMonth()) % QUOTES.length]
        } else if (source === "day") {
            value = `${getDayPct()}% of the day has passed`
        }

        let full = prefix + value + suffix
        if (uppercase) full = full.toUpperCase()
        return full
    }

    // ── Typewriter ──
    function typewrite(text) {
        clearInterval(typewriterRef.current)
        targetTextRef.current = text
        let i = 0
        setDisplayText("")
        const speed = Math.max(10, 80 - typewriterSpeed * 6) // 10–80ms
        typewriterRef.current = setInterval(() => {
            i++
            setDisplayText(text.slice(0, i))
            if (i >= text.length) clearInterval(typewriterRef.current)
        }, speed)
    }

    // ── Fetch location ──
    useEffect(() => {
        if (!["weather", "city", "sun"].includes(source)) return
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude: lat, longitude: lon } = pos.coords
                    const [wRes, gRes] = await Promise.all([
                        fetch(
                            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&daily=sunrise,sunset&timezone=auto`
                        ),
                        fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
                        ),
                    ])
                    const w = await wRes.json()
                    const g = await gRes.json()

                    const code = w.current.weathercode
                    const desc =
                        WMO[code] || WMO[Math.floor(code / 10) * 10] || "clear"
                    const fmt = (t) => {
                        if (!t) return "--"
                        const d = new Date(t)
                        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                    }

                    const loc = {
                        temp: Math.round(w.current.temperature_2m),
                        desc,
                        city:
                            g.address.city ||
                            g.address.town ||
                            g.address.village ||
                            "your city",
                        country: g.address.country || "",
                        sunrise: fmt(w.daily?.sunrise?.[0]),
                        sunset: fmt(w.daily?.sunset?.[0]),
                    }

                    setLocationData(loc)
                    typewrite(buildSentence(loc))
                } catch (_) {}
            },
            () => {},
            { timeout: 7000 }
        )
    }, [source])

    // ── Re-typewrite on prop changes ──
    useEffect(() => {
        const text = buildSentence()
        if (text !== targetTextRef.current) typewrite(text)
    }, [source, prefix, suffix, uppercase, locationData])

    // ── Live clock ──
    useEffect(() => {
        if (!["datetime", "day"].includes(source)) return
        const id = setInterval(
            () => {
                const text = buildSentence()
                // Only retrigger typewriter on minute change for datetime
                if (source === "day" || text !== targetTextRef.current) {
                    typewrite(text)
                }
            },
            source === "day" ? 10000 : 60000
        )
        return () => clearInterval(id)
    }, [source, prefix, suffix, uppercase])

    // ── Cleanup ──
    useEffect(() => () => clearInterval(typewriterRef.current), [])

    const resolvedFont = fontFamily === "custom" ? customFont : fontFamily

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent:
                    align === "left"
                        ? "flex-start"
                        : align === "right"
                          ? "flex-end"
                          : "center",
                ...style,
            }}
        >
            <span
                style={{
                    fontFamily: resolvedFont,
                    fontSize: fontSize,
                    fontWeight: fontWeight,
                    color: color,
                    opacity: opacity / 100,
                    textAlign: align,
                    lineHeight: 1.3,
                    letterSpacing: "-0.01em",
                    width: "100%",
                }}
            >
                {displayText}
                <span
                    style={{
                        display: "inline-block",
                        width: "2px",
                        height: "0.85em",
                        background: color,
                        opacity: 0.5,
                        marginLeft: "2px",
                        verticalAlign: "text-bottom",
                        animation: "livetext-blink 1s step-end infinite",
                    }}
                />
                <style>{`
                    @keyframes livetext-blink {
                        0%, 100% { opacity: 0.5; }
                        50% { opacity: 0; }
                    }
                `}</style>
            </span>
        </div>
    )
}

// ── Framer Property Controls ──
addPropertyControls(LiveText, {
    source: {
        type: ControlType.Enum,
        title: "Data source",
        defaultValue: "datetime",
        options: ["datetime", "weather", "city", "sun", "moon", "quote", "day"],
        optionTitles: [
            "🕐 Time & date",
            "🌤 Weather + temp",
            "📍 City / location",
            "🌅 Sunrise & sunset",
            "🌙 Moon phase",
            "💬 Quote of the day",
            "🔋 Day progress",
        ],
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "It's ",
        placeholder: "e.g. It's ",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: " right now",
        placeholder: "e.g.  right now",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: false,
    },
    fontFamily: {
        type: ControlType.Enum,
        title: "Font",
        defaultValue: "system-ui, sans-serif",
        options: [
            "system-ui, sans-serif",
            "Georgia, serif",
            "'Courier New', monospace",
            "custom",
        ],
        optionTitles: ["System UI", "Georgia", "Courier Mono", "Custom"],
    },
    customFont: {
        type: ControlType.String,
        title: "Custom font",
        defaultValue: "",
        placeholder: "e.g. 'Syne', sans-serif",
        hidden: (props) => props.fontFamily !== "custom",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font size",
        defaultValue: 32,
        min: 10,
        max: 120,
        step: 1,
        displayStepper: true,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        defaultValue: "400",
        options: ["300", "400", "500", "600", "700"],
        optionTitles: ["Light", "Regular", "Medium", "Semibold", "Bold"],
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#2563EB",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 100,
        min: 10,
        max: 100,
        step: 5,
        displayStepper: true,
    },
    align: {
        type: ControlType.SegmentedEnum,
        title: "Align",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
    },
    typewriterSpeed: {
        type: ControlType.Number,
        title: "Typewriter speed",
        defaultValue: 7,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
        description: "1 = slow, 10 = instant",
    },
})
