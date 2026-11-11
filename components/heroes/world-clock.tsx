// WorldClock — Live Clock Framer Code Component
// Features: live toggle, canvas-safe fluid font, auto timezone, vertical align
// FIX: Two-phase hydration pattern to prevent React #425/#422 SSR mismatches

import {
    useState,
    useEffect,
    useMemo,
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


const TIMEZONE_OPTIONS = [
    "Current Location",
    "UTC",
    "America/Anchorage",
    "America/Buenos_Aires",
    "America/Bogota",
    "America/Caracas",
    "America/Chicago",
    "America/Denver",
    "America/Havana",
    "America/Lima",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/New_York",
    "America/Phoenix",
    "America/Santiago",
    "America/Sao_Paulo",
    "America/Toronto",
    "America/Vancouver",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Casablanca",
    "Asia/Baghdad",
    "Asia/Bangkok",
    "Asia/Dhaka",
    "Asia/Dubai",
    "Asia/Ho_Chi_Minh",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Jerusalem",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Kuala_Lumpur",
    "Asia/Manila",
    "Asia/Riyadh",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Taipei",
    "Asia/Tehran",
    "Asia/Tokyo",
    "Australia/Brisbane",
    "Australia/Melbourne",
    "Australia/Perth",
    "Australia/Sydney",
    "Europe/Amsterdam",
    "Europe/Athens",
    "Europe/Berlin",
    "Europe/Brussels",
    "Europe/Copenhagen",
    "Europe/Dublin",
    "Europe/Helsinki",
    "Europe/Istanbul",
    "Europe/Lisbon",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Moscow",
    "Europe/Oslo",
    "Europe/Paris",
    "Europe/Prague",
    "Europe/Rome",
    "Europe/Stockholm",
    "Europe/Vienna",
    "Europe/Warsaw",
    "Europe/Zurich",
    "Pacific/Auckland",
    "Pacific/Fiji",
    "Pacific/Honolulu",
]

const TIMEZONE_TITLES = [
    "📍 Current Location",
    "UTC",
    "America / Anchorage",
    "America / Buenos Aires",
    "America / Bogotá",
    "America / Caracas",
    "America / Chicago",
    "America / Denver",
    "America / Havana",
    "America / Lima",
    "America / Los Angeles",
    "America / Mexico City",
    "America / New York",
    "America / Phoenix",
    "America / Santiago",
    "America / São Paulo",
    "America / Toronto",
    "America / Vancouver",
    "Africa / Cairo",
    "Africa / Johannesburg",
    "Africa / Lagos",
    "Africa / Nairobi",
    "Africa / Casablanca",
    "Asia / Baghdad",
    "Asia / Bangkok",
    "Asia / Dhaka",
    "Asia / Dubai",
    "Asia / Ho Chi Minh",
    "Asia / Hong Kong",
    "Asia / Jakarta",
    "Asia / Jerusalem",
    "Asia / Karachi",
    "Asia / Kolkata",
    "Asia / Kuala Lumpur",
    "Asia / Manila",
    "Asia / Riyadh",
    "Asia / Seoul",
    "Asia / Shanghai",
    "Asia / Singapore",
    "Asia / Taipei",
    "Asia / Tehran",
    "Asia / Tokyo",
    "Australia / Brisbane",
    "Australia / Melbourne",
    "Australia / Perth",
    "Australia / Sydney",
    "Europe / Amsterdam",
    "Europe / Athens",
    "Europe / Berlin",
    "Europe / Brussels",
    "Europe / Copenhagen",
    "Europe / Dublin",
    "Europe / Helsinki",
    "Europe / Istanbul",
    "Europe / Lisbon",
    "Europe / London",
    "Europe / Madrid",
    "Europe / Moscow",
    "Europe / Oslo",
    "Europe / Paris",
    "Europe / Prague",
    "Europe / Rome",
    "Europe / Stockholm",
    "Europe / Vienna",
    "Europe / Warsaw",
    "Europe / Zurich",
    "Pacific / Auckland",
    "Pacific / Fiji",
    "Pacific / Honolulu",
]

function buildClamp(
    minVp: number,
    maxVp: number,
    minFs: number,
    maxFs: number
): string {
    if (maxVp === minVp) return `${minFs}px`
    const slope = (maxFs - minFs) / (maxVp - minVp)
    const intercept = minFs - slope * minVp
    const slopeVw = (slope * 100).toFixed(4)
    const sign = intercept >= 0 ? "+" : "-"
    return `clamp(${minFs}px, ${slopeVw}vw ${sign} ${Math.abs(intercept).toFixed(2)}px, ${maxFs}px)`
}

function getTimeString(
    timezone: string,
    hour12: boolean,
    showMinutes: boolean,
    showSeconds: boolean
): string {
    try {
        const opts: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            hour12,
            timeZone: timezone,
        }
        if (showMinutes) opts.minute = "2-digit"
        if (showMinutes && showSeconds) opts.second = "2-digit"
        return new Intl.DateTimeFormat("en-US", opts).format(new Date())
    } catch {
        return "--:--"
    }
}

interface WorldClockProps {
    locationId: string
    liveTime: boolean
    hour12: boolean
    showMinutes: boolean
    showSeconds: boolean
    tabular: boolean
    showLabel: boolean
    useCustomLabel: boolean
    customLabel: string
    layout: "horizontal" | "vertical"
    verticalAlign: "flex-start" | "center" | "flex-end"
    labelPosition: "before" | "after"
    separator: string
    separatorColor: string
    gapSize: number
    font: any
    color: string
    labelFont: any
    labelColor: string
    fluidFont: boolean
    fluidMode: "auto" | "manual"
    minFontSize: number
    maxFontSize: number
    minViewport: number
    maxViewport: number
    clampValue: string
    labelFluidFont: boolean
    labelFluidMode: "auto" | "manual"
    labelMinFontSize: number
    labelMaxFontSize: number
    labelMinViewport: number
    labelMaxViewport: number
    labelClampValue: string
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function WorldClock({
    locationId = "America/Los_Angeles",
    liveTime = true,
    hour12 = false,
    showMinutes = true,
    showSeconds = true,
    tabular = true,
    showLabel = true,
    useCustomLabel = false,
    customLabel = "",
    layout = "horizontal",
    verticalAlign = "flex-start",
    labelPosition = "after",
    separator = "",
    separatorColor = "#111111",
    gapSize = 8,
    font = {},
    color = "#111111",
    labelFont = {},
    labelColor = "#111111",
    fluidFont = false,
    fluidMode = "auto",
    minFontSize = 16,
    maxFontSize = 48,
    minViewport = 390,
    maxViewport = 1440,
    clampValue = "clamp(16px, 4vw, 48px)",
    labelFluidFont = false,
    labelFluidMode = "auto",
    labelMinFontSize = 12,
    labelMaxFontSize = 24,
    labelMinViewport = 390,
    labelMaxViewport = 1440,
    labelClampValue = "clamp(12px, 2vw, 24px)",
    style,
}: WorldClockProps) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer() // Catches canvas + export + static render modes

    // ── TWO-PHASE HYDRATION FIX ────────────────────────────────────────────────
    // Framer pre-renders on the server. new Date() produces a different value
    // on server vs client, causing React errors #425 and #422 (hydration mismatch).
    // Solution: render a neutral placeholder ("--:--") until the client has
    // mounted. Only then do we switch to the real live time.
    // This ensures SSR output == first client paint, satisfying React's hydration.
    const [isClient, setIsClient] = useState(false)
    useEffect(() => {
        setIsClient(true)
    }, [])

    // ── Auto-detect browser timezone ───────────────────────────────────────────
    const [detectedTimezone, setDetectedTimezone] = useState("")
    useEffect(() => {
        if (locationId !== "Current Location") return
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
            startTransition(() => setDetectedTimezone(tz))
        } catch {
            startTransition(() => setDetectedTimezone("UTC"))
        }
    }, [locationId])

    const activeTimezone =
        locationId === "Current Location"
            ? detectedTimezone || "UTC"
            : locationId

    // ── Live tick — disabled on canvas and when liveTime is off ───────────────
    const [tick, setTick] = useState(0)
    useEffect(() => {
        if (isStatic || !liveTime || !isClient) return // ← isStatic covers all static contexts
        const id = setInterval(
            () => startTransition(() => setTick((n) => n + 1)),
            1000
        )
        return () => clearInterval(id)
    }, [isStatic, liveTime, isClient])

    // ── Time display string ────────────────────────────────────────────────────
    // Before client mount: always show placeholder so SSR and first client
    // render are identical — this is the core hydration fix.
    const displayString = useMemo(() => {
        if (!isClient) return "--:--" // ← SSR-safe placeholder
        if (!activeTimezone) return "--:--"
        return getTimeString(activeTimezone, hour12, showMinutes, showSeconds)
    }, [isClient, activeTimezone, hour12, showMinutes, showSeconds, tick])

    // ── Label: auto city name or custom text ───────────────────────────────────
    const autoLabel = useMemo(() => {
        const tz =
            locationId === "Current Location"
                ? detectedTimezone || "Detecting..."
                : locationId
        return tz.split("/").pop()?.replace(/_/g, " ") ?? tz
    }, [locationId, detectedTimezone])

    const labelText = useCustomLabel && customLabel ? customLabel : autoLabel

    // ── Responsive font sizes — canvas always uses font control value ──────────
    const resolvedTimeFontSize = useMemo(() => {
        if (isStatic) return undefined
        if (!fluidFont) return undefined
        return fluidMode === "manual"
            ? clampValue
            : buildClamp(minViewport, maxViewport, minFontSize, maxFontSize)
    }, [
        isStatic,
        fluidFont,
        fluidMode,
        clampValue,
        minViewport,
        maxViewport,
        minFontSize,
        maxFontSize,
    ])

    const resolvedLabelFontSize = useMemo(() => {
        if (isCanvas) return undefined
        if (!labelFluidFont) return undefined
        return labelFluidMode === "manual"
            ? labelClampValue
            : buildClamp(
                  labelMinViewport,
                  labelMaxViewport,
                  labelMinFontSize,
                  labelMaxFontSize
              )
    }, [
        isCanvas,
        labelFluidFont,
        labelFluidMode,
        labelClampValue,
        labelMinViewport,
        labelMaxViewport,
        labelMinFontSize,
        labelMaxFontSize,
    ])

    // ── Element styles ─────────────────────────────────────────────────────────
    const timeStyle: CSSProperties = {
        ...font,
        ...(resolvedTimeFontSize ? { fontSize: resolvedTimeFontSize } : {}),
        color,
        fontVariantNumeric: tabular ? "tabular-nums" : "normal",
        whiteSpace: "nowrap",
    }

    const locationStyle: CSSProperties = {
        ...labelFont,
        ...(resolvedLabelFontSize ? { fontSize: resolvedLabelFontSize } : {}),
        color: labelColor,
        whiteSpace: "nowrap",
    }

    const sepStyle: CSSProperties = {
        ...font,
        ...(resolvedTimeFontSize ? { fontSize: resolvedTimeFontSize } : {}),
        color: separatorColor,
        fontVariantNumeric: tabular ? "tabular-nums" : "normal",
        whiteSpace: "nowrap",
    }

    const timeEl = <div style={timeStyle}>{displayString}</div>
    const labelEl = showLabel ? (
        <div style={locationStyle}>{labelText}</div>
    ) : null
    const sepEl = separator ? <div style={sepStyle}>{separator}</div> : null
    const isHorizontal = layout === "horizontal"

    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: isHorizontal ? "row" : "column",
                alignItems: layout === "vertical" ? verticalAlign : "center",
                justifyContent: "center",
                gap: gapSize,
                minWidth: "max-content",
                minHeight: "max-content",
            }}
        >
            {isHorizontal ? (
                labelPosition === "before" ? (
                    <>
                        {labelEl}
                        {sepEl}
                        {timeEl}
                    </>
                ) : (
                    <>
                        {timeEl}
                        {sepEl}
                        {labelEl}
                    </>
                )
            ) : (
                <>
                    {timeEl}
                    {labelEl}
                </>
            )}
        </div>
    )
}

WorldClock.displayName = "World Clock"

addPropertyControls(WorldClock, {
    locationId: {
        type: ControlType.Enum,
        title: "City / Zone",
        options: TIMEZONE_OPTIONS,
        optionTitles: TIMEZONE_TITLES,
        defaultValue: "America/Los_Angeles",
        description:
            "Choose a city or use the visitor's local timezone automatically.",
    },
    liveTime: {
        type: ControlType.Boolean,
        title: "Live Clock",
        defaultValue: true,
        enabledTitle: "Ticking",
        disabledTitle: "Frozen",
        description:
            "When on, the clock updates every second in real-time.\n\n--------------------\n↓ Formatting ↓",
    },
    hour12: {
        type: ControlType.Boolean,
        title: "Format",
        defaultValue: false,
        enabledTitle: "12h (AM/PM)",
        disabledTitle: "24h",
    },
    showMinutes: {
        type: ControlType.Boolean,
        title: "Minutes",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Seconds",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.showMinutes,
    },
    tabular: {
        type: ControlType.Boolean,
        title: "Fixed Digits",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Displays digits in tabular format so the clock doesn't jump as time changes. Recommended to leave On.",
    },
    showLabel: {
        type: ControlType.Boolean,
        title: "City Label",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Shows the city name next to the time.",
    },
    useCustomLabel: {
        type: ControlType.Boolean,
        title: "Custom Text",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => !props.showLabel,
        description: "Replace the auto city name with your own short label.",
    },
    customLabel: {
        type: ControlType.String,
        title: "Label Text",
        defaultValue: "CA",
        placeholder: "e.g. LA, NYC, TYO",
        hidden: (props) => !props.showLabel || !props.useCustomLabel,
    },
    layout: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
        description:
            "Side by Side puts time and label in a row. Stacked puts the label below the time.",
        hidden: (props) => !props.showLabel,
    },
    verticalAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "flex-start",
        displaySegmentedControl: true,
        hidden: (props) => !props.showLabel || props.layout !== "vertical",
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Label Side",
        options: ["before", "after"],
        optionTitles: ["Left", "Right"],
        defaultValue: "after",
        displaySegmentedControl: true,
        hidden: (props) => !props.showLabel || props.layout === "vertical",
    },
    separator: {
        type: ControlType.String,
        title: "Divider",
        defaultValue: "",
        placeholder: "e.g.  ·  or  |  or  -",
        hidden: (props) => !props.showLabel || props.layout === "vertical",
        description: "Optional character between the time and label.",
    },
    separatorColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "#111111",
        hidden: (props) =>
            !props.showLabel || props.layout === "vertical" || !props.separator,
    },
    gapSize: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 8,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        description:
            "Space between the time and the city label.\n\n--------------------\n↓ Styling Options ↓",
        hidden: (props) => !props.showLabel,
    },
    font: {
        type: ControlType.Font,
        title: "Time Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Medium",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Time Color",
        defaultValue: "#111111",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        hidden: (props) => !props.showLabel,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#111111",
        hidden: (props) => !props.showLabel,
        description:
            "\n\n--------------------\n↓ Fluid Responsive Font Size (Optional) ↓",
    },
    fluidFont: {
        type: ControlType.Boolean,
        title: "Time Size",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Optional - Automatically scales the font size between mobile and desktop. Only visible in Preview and on the live site.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
    },
    fluidMode: {
        type: ControlType.Enum,
        title: "↳ Method",
        options: ["auto", "manual"],
        optionTitles: ["Auto Calc", "Manual"],
        defaultValue: "auto",
        displaySegmentedControl: true,
        hidden: (props) => !props.fluidFont,
        description:
            "*Auto Calc* - lets you pick font sizes.\n *Manual* - lets you paste a clamp() value.",
    },
    minFontSize: {
        type: ControlType.Number,
        title: "↳ Mobile Size",
        defaultValue: 20,
        min: 8,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => !props.fluidFont || props.fluidMode === "manual",
        description: "Font size on small screens (mobile).",
    },
    maxFontSize: {
        type: ControlType.Number,
        title: "↳ Desktop Size",
        defaultValue: 32,
        min: 8,
        max: 300,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => !props.fluidFont || props.fluidMode === "manual",
        description: "Font size on large screens (desktop).",
    },
    minViewport: {
        type: ControlType.Number,
        title: "↳ Mobile Width",
        defaultValue: 390,
        min: 200,
        max: 1920,
        step: 10,
        unit: "px",
        hidden: (props) => !props.fluidFont || props.fluidMode === "manual",
        description: "Screen width where mobile font size is applied.",
    },
    maxViewport: {
        type: ControlType.Number,
        title: "↳ Desktop Width",
        defaultValue: 1440,
        min: 400,
        max: 3840,
        step: 10,
        unit: "px",
        hidden: (props) => !props.fluidFont || props.fluidMode === "manual",
        description:
            "Screen width where desktop font size is applied.\n\n--------------------",
    },
    clampValue: {
        type: ControlType.String,
        title: "↳ CSS Clamp",
        defaultValue: "clamp(16px, 4vw, 48px)",
        placeholder: "clamp(16px, 4vw, 48px)",
        hidden: (props) => !props.fluidFont || props.fluidMode !== "manual",
        description:
            "Paste a clamp() value from tools like clamp.font-size.app\n\n--------------------",
    },
    labelFluidFont: {
        type: ControlType.Boolean,
        title: "Label Size",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => !props.showLabel,
        description:
            "Optional - Automatically scales the font size between mobile and desktop. Only visible in Preview and on the live site.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
    },
    labelFluidMode: {
        type: ControlType.Enum,
        title: "↳ Method",
        options: ["auto", "manual"],
        optionTitles: ["Auto Calc", "Manual"],
        defaultValue: "auto",
        displaySegmentedControl: true,
        hidden: (props) => !props.showLabel || !props.labelFluidFont,
        description:
            "*Auto Calc* - lets you pick font sizes.\n *Manual* - lets you paste a clamp() value.",
    },
    labelMinFontSize: {
        type: ControlType.Number,
        title: "↳ Mobile Size",
        defaultValue: 20,
        min: 8,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) =>
            !props.showLabel ||
            !props.labelFluidFont ||
            props.labelFluidMode === "manual",
        description: "Font size on small screens (mobile).",
    },
    labelMaxFontSize: {
        type: ControlType.Number,
        title: "↳ Desktop Size",
        defaultValue: 32,
        min: 8,
        max: 300,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) =>
            !props.showLabel ||
            !props.labelFluidFont ||
            props.labelFluidMode === "manual",
        description: "Font size on large screens (desktop).",
    },
    labelMinViewport: {
        type: ControlType.Number,
        title: "↳ Mobile Width",
        defaultValue: 390,
        min: 200,
        max: 1920,
        step: 10,
        unit: "px",
        hidden: (props) =>
            !props.showLabel ||
            !props.labelFluidFont ||
            props.labelFluidMode === "manual",
        description: "Screen width where mobile font size is applied.",
    },
    labelMaxViewport: {
        type: ControlType.Number,
        title: "↳ Desktop Width",
        defaultValue: 1440,
        min: 400,
        max: 3840,
        step: 10,
        unit: "px",
        hidden: (props) =>
            !props.showLabel ||
            !props.labelFluidFont ||
            props.labelFluidMode === "manual",
        description:
            "Screen width where desktop font size is applied.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
    },
    labelClampValue: {
        type: ControlType.String,
        title: "↳ CSS Clamp",
        defaultValue: "clamp(12px, 2vw, 24px)",
        placeholder: "clamp(12px, 2vw, 24px)",
        hidden: (props) =>
            !props.showLabel ||
            !props.labelFluidFont ||
            props.labelFluidMode !== "manual",
        description:
            "Paste a clamp() value from tools like clamp.font-size.app\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
    },
})
