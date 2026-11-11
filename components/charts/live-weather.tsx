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


type Props = {
    city: string
    unit: "celsius" | "fahrenheit"
    background: string
    foreground: string
    muted: string
    radius: number
    padding: number
    fontSize: number
    refreshMinutes: number
    showIcon: boolean
    clearIcon?: string
    cloudyIcon?: string
    fogIcon?: string
    rainIcon?: string
    snowIcon?: string
    stormIcon?: string
    iconSize: number
    clearRadius: number
    cloudyRadius: number
    fogRadius: number
    rainRadius: number
    snowRadius: number
    stormRadius: number
}
type Weather = {
    temperature: number
    feels: number
    code: number
    rainSoon: boolean | null
    location: string
}

type Place = { name: string; latitude: number; longitude: number }
type Forecast = {
    current: {
        time: string
        temperature_2m: number
        apparent_temperature: number
        weather_code: number
    }
    hourly: {
        time: string[]
        precipitation: (number | null)[]
        precipitation_probability: (number | null)[]
    }
}
const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v)
const isFiniteNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v)
const isTimestamp = (v: unknown): v is string =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)
const isNumberArray = (v: unknown): v is (number | null)[] =>
    Array.isArray(v) && v.every((x) => x === null || isFiniteNumber(x))
function isPlace(v: unknown): v is Place {
    return (
        isRecord(v) &&
        typeof v.name === "string" &&
        v.name.length > 0 &&
        isFiniteNumber(v.latitude) &&
        isFiniteNumber(v.longitude)
    )
}
function isForecast(v: unknown): v is Forecast {
    if (!isRecord(v) || !isRecord(v.current) || !isRecord(v.hourly))
        return false
    const c = v.current,
        h = v.hourly
    return (
        isTimestamp(c.time) &&
        isFiniteNumber(c.temperature_2m) &&
        isFiniteNumber(c.apparent_temperature) &&
        isFiniteNumber(c.weather_code) &&
        Array.isArray(h.time) &&
        h.time.every(isTimestamp) &&
        isNumberArray(h.precipitation) &&
        isNumberArray(h.precipitation_probability)
    )
}

function isAbortError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
    )
}

async function readResponse(
    response: Response,
    label: string
): Promise<unknown> {
    try {
        return await response.json()
    } catch (error) {
        if (isAbortError(error)) throw error
        console.error(`[Live Weather] Invalid ${label} response:`, error)
        throw new Error(`${label} data could not be read. Please try again.`)
    }
}

function condition(code: number) {
    if (code === 0) return "clear"
    if (code <= 3) return "cloudy"
    if (code <= 49) return "fog"
    if (code <= 67 || (code >= 80 && code <= 82)) return "rain"
    if (code <= 77 || code === 85 || code === 86) return "snow"
    return "storm"
}
function WeatherIcon({ kind }: { kind: string }) {
    const cloud = (
        <path
            d="M15 34h28a10 10 0 0 0 1-20A14 14 0 0 0 17 16 9 9 0 0 0 15 34Z"
            fill="currentColor"
        />
    )
    return (
        <svg
            viewBox="0 0 56 52"
            aria-hidden="true"
            style={{
                width: "1em",
                height: "1em",
                display: "inline-block",
                verticalAlign: "-0.08em",
                flexShrink: 0,
            }}
        >
            {kind === "clear" ? (
                <>
                    <circle cx="28" cy="26" r="10" fill="currentColor" />
                    <path
                        d="M28 3v6m0 34v6M5 26h6m34 0h6M12 10l4 4m24 24 4 4m0-32-4 4M16 38l-4 4"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </>
            ) : (
                <>
                    {cloud}
                    {(kind === "rain" || kind === "storm") && (
                        <path
                            d="m20 39-3 6m15-6-3 6m14-6-3 6"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    )}
                    {kind === "snow" && (
                        <path
                            d="M19 39v8m-4-4h8m12-4v8m-4-4h8"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                    )}
                    {kind === "fog" && (
                        <path
                            d="M14 40h29m-25 6h22"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    )}
                </>
            )}
        </svg>
    )
}

/**
 * Live weather via Open-Meteo. No API key is required.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 410
 * @framerIntrinsicHeight 410
 * @framerDisableUnlink
 */
export default function LiveWeather(props: Props) {
    const {
        city,
        unit,
        background,
        foreground,
        muted,
        radius,
        padding,
        fontSize,
        refreshMinutes,
        showIcon,
    } = props
    const isStatic = useIsStaticRenderer()
    const [weather, setWeather] = React.useState<Weather | null>(null)
    const [error, setError] = React.useState("")
    const [loading, setLoading] = React.useState(true)
    React.useEffect(() => {
        // Canvas and static exports should be deterministic and make no network requests.
        if (isStatic) return
        let active = true
        const controller = new AbortController()
        async function load() {
            try {
                const geo = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`,
                    { signal: controller.signal }
                )
                if (!geo.ok) throw new Error("Could not find the location.")
                const geoData = await readResponse(geo, "Location")
                if (!isRecord(geoData))
                    throw new Error(
                        "Location data is incomplete. Please try again."
                    )
                if (
                    geoData.results === undefined ||
                    (Array.isArray(geoData.results) &&
                        geoData.results.length === 0)
                )
                    throw new Error("City not found. Try another name.")
                if (
                    !Array.isArray(geoData.results) ||
                    !isPlace(geoData.results[0])
                )
                    throw new Error(
                        "Location data is incomplete. Please try again."
                    )
                const place = geoData.results[0]
                const params = new URLSearchParams({
                    latitude: String(place.latitude),
                    longitude: String(place.longitude),
                    current: "temperature_2m,apparent_temperature,weather_code",
                    hourly: "precipitation_probability,precipitation",
                    forecast_days: "2",
                    timezone: "auto",
                    temperature_unit: unit,
                })
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?${params}`,
                    { signal: controller.signal }
                )
                if (!response.ok)
                    throw new Error("Weather is temporarily unavailable.")
                const data = await readResponse(response, "Weather")
                if (!isForecast(data))
                    throw new Error(
                        "Weather data is incomplete. Please try again."
                    )
                // Compare local ISO timestamps from the API, not the visitor's timezone.
                const currentHour = data.current.time.slice(0, 13)
                const start = data.hourly.time.findIndex(
                    (t: string) => t.slice(0, 13) === currentHour
                )
                const next = start >= 0 ? [start + 1, start + 2] : []
                // Missing hours or null readings must not be reported as "no rain".
                const hasForecast =
                    next.length === 2 &&
                    next.every(
                        (i) =>
                            i < data.hourly.time.length &&
                            (isFiniteNumber(data.hourly.precipitation[i]) ||
                                isFiniteNumber(
                                    data.hourly.precipitation_probability[i]
                                ))
                    )
                const rainSoon = hasForecast
                    ? next.some(
                          (i) =>
                              (data.hourly.precipitation[i] ?? 0) >= 0.1 ||
                              (data.hourly.precipitation_probability[i] ?? 0) >=
                                  50
                      )
                    : null
                if (active) {
                    setWeather({
                        temperature: data.current.temperature_2m,
                        feels: data.current.apparent_temperature,
                        code: data.current.weather_code,
                        rainSoon,
                        location: place.name,
                    })
                    setError("")
                    setLoading(false)
                }
            } catch (e) {
                // Abort is expected when the component unmounts or its settings change.
                if (isAbortError(e) || controller.signal.aborted || !active)
                    return
                if (e instanceof TypeError) {
                    console.error("[Live Weather] Network request failed:", e)
                    setError(
                        "Could not connect to the weather service. Please check your connection."
                    )
                } else {
                    console.error("[Live Weather] Could not load weather:", e)
                    setError(
                        e instanceof Error
                            ? e.message
                            : "Weather is temporarily unavailable."
                    )
                }
                setLoading(false)
            }
        }
        setLoading(true)
        setWeather(null)
        setError("")
        if (city.trim()) load()
        else {
            setError("Enter a city in the component settings.")
            setLoading(false)
        }
        const timer = window.setInterval(
            load,
            Math.max(1, refreshMinutes) * 60000
        )
        return () => {
            active = false
            controller.abort()
            window.clearInterval(timer)
        }
    }, [city, unit, refreshMinutes, isStatic])
    const kind = weather ? condition(weather.code) : "cloudy"
    const conditionNames: Record<string, string> = {
        clear: "Clear skies",
        cloudy: "Cloudy",
        fog: "Foggy",
        rain: "Rainy",
        snow: "Snowy",
        storm: "Thunderstorms",
    }
    const customIcons: Record<string, string | undefined> = {
        clear: props.clearIcon,
        cloudy: props.cloudyIcon,
        fog: props.fogIcon,
        rain: props.rainIcon,
        snow: props.snowIcon,
        storm: props.stormIcon,
    }
    const customIcon = customIcons[kind]
    const iconRadii: Record<string, number> = {
        clear: props.clearRadius,
        cloudy: props.cloudyRadius,
        fog: props.fogRadius,
        rain: props.rainRadius,
        snow: props.snowRadius,
        storm: props.stormRadius,
    }
    const text: React.CSSProperties = {
        fontSize: `clamp(20px, ${fontSize / 4.1}cqw, ${fontSize}px)`,
        fontWeight: 600,
        letterSpacing: "-0.045em",
        lineHeight: 1.07,
    }
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: 180,
                boxSizing: "border-box",
                borderRadius: radius,
                padding: `${padding}%`,
                background,
                color: foreground,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                containerType: "inline-size",
                fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
            }}
        >
            <div style={{ ...text, width: "100%" }} aria-live="polite">
                {isStatic ? (
                    <>
                        <div>
                            <span>{unit === "fahrenheit" ? "75°" : "24°"}</span>{" "}
                            <span style={{ color: muted }}>preview</span>
                        </div>
                        <div>
                            <span style={{ color: muted }}>in </span>
                            <span>{city || "City"}</span>
                        </div>
                        <div>
                            <span style={{ color: muted }}>feels </span>
                            <span>{unit === "fahrenheit" ? "64°" : "18°"}</span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: ".14em",
                            }}
                        >
                            {showIcon && (
                                <span
                                    style={{
                                        display: "inline-flex",
                                        width: `${props.iconSize / 100}em`,
                                        height: `${props.iconSize / 100}em`,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {props.cloudyIcon ? (
                                        <img
                                            src={props.cloudyIcon}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                borderRadius:
                                                    props.cloudyRadius || 0,
                                            }}
                                        />
                                    ) : (
                                        <WeatherIcon kind="cloudy" />
                                    )}
                                </span>
                            )}
                            <span aria-label="Cloudy">cloudy</span>{" "}
                            <span style={{ color: muted }}>now</span>
                        </div>
                        <div>
                            <span style={{ color: muted }}>
                                forecast preview
                            </span>
                        </div>
                    </>
                ) : loading && !weather ? (
                    <span style={{ color: muted }}>Loading weather…</span>
                ) : error && !weather ? (
                    <span
                        style={{
                            color: muted,
                            fontSize: "0.5em",
                            letterSpacing: "normal",
                            lineHeight: 1.3,
                        }}
                    >
                        {error}
                    </span>
                ) : (
                    weather && (
                        <>
                            <div>
                                <span>{Math.round(weather.temperature)}°</span>{" "}
                                <span style={{ color: muted }}>now</span>
                            </div>
                            <div>
                                <span style={{ color: muted }}>in </span>
                                <span>{weather.location}</span>
                            </div>
                            <div>
                                <span style={{ color: muted }}>feels </span>
                                <span>{Math.round(weather.feels)}°</span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: ".14em",
                                    flexWrap: "wrap",
                                }}
                            >
                                {showIcon && (
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            width: `${props.iconSize / 100}em`,
                                            height: `${props.iconSize / 100}em`,
                                            flexShrink: 0,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {customIcon ? (
                                            <img
                                                src={customIcon}
                                                alt=""
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "contain",
                                                    borderRadius:
                                                        iconRadii[kind] || 0,
                                                }}
                                            />
                                        ) : (
                                            <WeatherIcon kind={kind} />
                                        )}
                                    </span>
                                )}
                                <span aria-label={conditionNames[kind]}>
                                    {kind}
                                </span>{" "}
                                <span style={{ color: muted }}>now</span>
                            </div>
                            <div>
                                <span style={{ color: muted }}>
                                    {weather.rainSoon === null
                                        ? "forecast unavailable"
                                        : weather.rainSoon
                                          ? "rain next"
                                          : "no rain next"}
                                </span>
                            </div>
                            {weather.rainSoon !== null && (
                                <div>
                                    <span style={{ color: muted }}>2 hrs</span>
                                </div>
                            )}
                        </>
                    )
                )}
            </div>
        </div>
    )
}
LiveWeather.defaultProps = {
    city: "New York",
    unit: "celsius",
    background: "#111111",
    foreground: "#FAFAFA",
    muted: "#797979",
    radius: 90,
    padding: 12,
    fontSize: 56,
    refreshMinutes: 15,
    showIcon: true,
    iconSize: 100,
}
addPropertyControls(LiveWeather, {
    city: {
        type: ControlType.String,
        title: "City",
        defaultValue: "New York",
        placeholder: "New York",
    },
    unit: {
        type: ControlType.Enum,
        title: "Temperature",
        options: ["celsius", "fahrenheit"],
        optionTitles: ["Celsius", "Fahrenheit"],
        defaultValue: "celsius",
        displaySegmentedControl: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
    foreground: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FAFAFA",
    },
    muted: {
        type: ControlType.Color,
        title: "Muted text",
        defaultValue: "#797979",
    },
    radius: {
        type: ControlType.Number,
        title: "Corner radius",
        defaultValue: 90,
        min: 0,
        max: 200,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 0,
        max: 30,
        unit: "%",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font size",
        defaultValue: 56,
        min: 20,
        max: 120,
        unit: "px",
    },
    refreshMinutes: {
        type: ControlType.Number,
        title: "Refresh",
        defaultValue: 15,
        min: 1,
        max: 180,
        unit: "min",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Weather icon",
        defaultValue: true,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon size",
        min: 50,
        max: 200,
        defaultValue: 100,
        unit: "%",
        hidden: (p) => !p.showIcon,
    },
    clearIcon: {
        type: ControlType.Image,
        title: "Clear icon",
        hidden: (p) => !p.showIcon,
    },
    cloudyIcon: {
        type: ControlType.Image,
        title: "Cloudy icon",
        hidden: (p) => !p.showIcon,
    },
    fogIcon: {
        type: ControlType.Image,
        title: "Fog icon",
        hidden: (p) => !p.showIcon,
    },
    rainIcon: {
        type: ControlType.Image,
        title: "Rain icon",
        hidden: (p) => !p.showIcon,
    },
    snowIcon: {
        type: ControlType.Image,
        title: "Snow icon",
        hidden: (p) => !p.showIcon,
    },
    stormIcon: {
        type: ControlType.Image,
        title: "Storm icon",
        hidden: (p) => !p.showIcon,
    },
    clearRadius: {
        type: ControlType.Number,
        title: "Clear radius",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "px",
        hidden: (p) => !p.showIcon || !p.clearIcon,
    },
    cloudyRadius: {
        type: ControlType.Number,
        title: "Cloudy radius",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "px",
        hidden: (p) => !p.showIcon || !p.cloudyIcon,
    },
    fogRadius: {
        type: ControlType.Number,
        title: "Fog radius",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "px",
        hidden: (p) => !p.showIcon || !p.fogIcon,
    },
    rainRadius: {
        type: ControlType.Number,
        title: "Rain radius",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "px",
        hidden: (p) => !p.showIcon || !p.rainIcon,
    },
    snowRadius: {
        type: ControlType.Number,
        title: "Snow radius",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "px",
        hidden: (p) => !p.showIcon || !p.snowIcon,
    },
    stormRadius: {
        type: ControlType.Number,
        title: "Storm radius",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "px",
        hidden: (p) => !p.showIcon || !p.stormIcon,
    },
})
