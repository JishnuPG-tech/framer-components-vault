// WorldDate — Date Framer Code Component
// Features: PHP-style custom format, timezone-aware, fluid font, auto label
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


// ─── Timezone lists ──────────────────────────────────────────────────────────

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

// ─── Fluid font clamp builder ────────────────────────────────────────────────

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

// ─── PHP-style date formatter ────────────────────────────────────────────────

function phpFormatDate(format: string, timezone: string): string {
    const now = new Date()

    const getPart = (opts: Intl.DateTimeFormatOptions): string =>
        new Intl.DateTimeFormat("en-US", {
            ...opts,
            timeZone: timezone,
        }).format(now)

    const fullYear = parseInt(getPart({ year: "numeric" }), 10)
    const monthNum = parseInt(getPart({ month: "numeric" }), 10)
    const dayNum = parseInt(getPart({ day: "numeric" }), 10)

    const isoWeekday = (() => {
        const wd = new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            timeZone: timezone,
        }).format(now)
        const map: Record<string, number> = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
        }
        return map[wd] ?? 0
    })()

    const isoDay = isoWeekday === 0 ? 7 : isoWeekday

    const ordinal = (n: number): string => {
        if (n >= 11 && n <= 13) return "th"
        switch (n % 10) {
            case 1:
                return "st"
            case 2:
                return "nd"
            case 3:
                return "rd"
            default:
                return "th"
        }
    }

    const startOfYear = new Date(Date.UTC(fullYear, 0, 1))
    const localMidnight = new Date(Date.UTC(fullYear, monthNum - 1, dayNum))
    const dayOfYear = Math.round(
        (localMidnight.getTime() - startOfYear.getTime()) / 86400000
    )

    const daysInMonth = new Date(fullYear, monthNum, 0).getDate()

    const isoWeekNum = (() => {
        const d = new Date(Date.UTC(fullYear, monthNum - 1, dayNum))
        const dayOfWeek = d.getUTCDay() || 7
        d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek)
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        return Math.ceil(
            ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
        )
    })()

    const fullMonth = getPart({ month: "long" })
    const shortMonth = getPart({ month: "short" })
    const fullWeekday = getPart({ weekday: "long" })
    const shortWeekday = getPart({ weekday: "short" })

    const tokens: Record<string, string> = {
        d: String(dayNum).padStart(2, "0"),
        D: shortWeekday,
        j: String(dayNum),
        l: fullWeekday,
        N: String(isoDay),
        S: ordinal(dayNum),
        w: String(isoWeekday),
        z: String(dayOfYear),
        W: String(isoWeekNum).padStart(2, "0"),
        F: fullMonth,
        m: String(monthNum).padStart(2, "0"),
        M: shortMonth,
        n: String(monthNum),
        t: String(daysInMonth),
        Y: String(fullYear),
        y: String(fullYear).slice(-2),
    }

    let result = ""
    for (let i = 0; i < format.length; i++) {
        const ch = format[i]
        if (ch === "\\" && i + 1 < format.length) {
            result += format[++i]
        } else if (tokens[ch] !== undefined) {
            result += tokens[ch]
        } else {
            result += ch
        }
    }
    return result
}

// ─── Default auto date string ────────────────────────────────────────────────

function getAutoDateString(timezone: string): string {
    try {
        return new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: timezone,
        }).format(new Date())
    } catch {
        return "---"
    }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface WorldDateProps {
    locationId: string
    useCustomFormat: boolean
    customFormat: string
    showLabel: boolean
    useCustomLabel: boolean
    customLabel: string
    layout: "horizontal" | "vertical"
    contentAlign: "flex-start" | "center" | "flex-end"
    verticalAlign: "flex-start" | "center" | "flex-end"
    labelPosition: "before" | "after"
    separator: string
    separatorColor: string
    font: any
    textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
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

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 60
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function WorldDate({
    locationId = "Asia/Kolkata",
    useCustomFormat = false,
    customFormat = "l, d F Y",
    showLabel = true,
    useCustomLabel = false,
    customLabel = "",
    layout = "horizontal",
    contentAlign = "flex-start",
    verticalAlign = "flex-start",
    labelPosition = "after",
    separator = "",
    separatorColor = "#111111",
    font = {},
    textTransform = "none",
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
}: WorldDateProps) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // ── TWO-PHASE HYDRATION FIX ───────────────────────────────────────────────
    // Framer pre-renders on the server. new Date() inside phpFormatDate() and
    // getAutoDateString() produces a different value at SSR time vs. hydration
    // time, causing React errors #425 and #422 (text content mismatch).
    //
    // Additionally, when "Current Location" is selected, detectedTimezone starts
    // as "" on the server — activeTimezone falls back to "UTC" — but after
    // hydration it resolves to the real browser timezone. This causes a second
    // mismatch: the date string changes from a UTC-based date to the user's
    // local date immediately after hydration.
    //
    // Fix: render "---" as a stable placeholder until the client has fully
    // mounted and both isClient=true and detectedTimezone (if needed) are set.
    // The placeholder is invisible in practice — it lasts one frame.
    const [isClient, setIsClient] = useState(false)
    useEffect(() => {
        setIsClient(true)
    }, [])

    // ── Auto-detect browser timezone (only when "Current Location" is selected) ──
    // Note: typeof window === "undefined" guard removed — useEffect never runs
    // on the server, so the guard is redundant and misleading.
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

    // ── Date string — computed once after client mount, no interval ──────────
    // isClient gates the real computation. Before mount, "---" is returned so
    // SSR output == first client render == no hydration mismatch.
    const displayString = useMemo(() => {
        if (!isClient) return "---"
        if (!activeTimezone) return "---"
        if (useCustomFormat && customFormat.trim()) {
            try {
                return phpFormatDate(customFormat.trim(), activeTimezone)
            } catch {
                return "Invalid format"
            }
        }
        return getAutoDateString(activeTimezone)
    }, [isClient, activeTimezone, useCustomFormat, customFormat])
    // ^ No tick dependency — intentional. Date is static per page load.
    //   isClient added so the real date only computes after client mount.

    // ── Auto label: city name extracted from timezone string ─────────────────
    const autoLabel = useMemo(() => {
        const tz =
            locationId === "Current Location"
                ? detectedTimezone || "Detecting..."
                : locationId
        return tz.split("/").pop()?.replace(/_/g, " ") ?? tz
    }, [locationId, detectedTimezone])

    const labelText = useCustomLabel && customLabel ? customLabel : autoLabel

    // ── Responsive font sizes (canvas-safe: always undefined on canvas) ───────
    const resolvedDateFontSize = useMemo(() => {
        if (isCanvas || !fluidFont) return undefined
        return fluidMode === "manual"
            ? clampValue
            : buildClamp(minViewport, maxViewport, minFontSize, maxFontSize)
    }, [
        isCanvas,
        fluidFont,
        fluidMode,
        clampValue,
        minViewport,
        maxViewport,
        minFontSize,
        maxFontSize,
    ])

    const resolvedLabelFontSize = useMemo(() => {
        if (isCanvas || !labelFluidFont) return undefined
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

    // ── Element styles ────────────────────────────────────────────────────────
    const dateStyle: CSSProperties = {
        ...font,
        ...(resolvedDateFontSize ? { fontSize: resolvedDateFontSize } : {}),
        color,

        textTransform,
    }

    const locationStyle: CSSProperties = {
        ...labelFont,
        ...(resolvedLabelFontSize ? { fontSize: resolvedLabelFontSize } : {}),
        color: labelColor,
        whiteSpace: "nowrap",
    }

    const sepStyle: CSSProperties = {
        ...font,
        ...(resolvedDateFontSize ? { fontSize: resolvedDateFontSize } : {}),
        color: separatorColor,
        whiteSpace: "nowrap",
    }

    const dateEl = <div style={dateStyle}>{displayString}</div>
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
                justifyContent: contentAlign,
                width: "100%",
                flexWrap: "wrap",
                minHeight: "max-content",
            }}
        >
            {isHorizontal ? (
                <div style={{ display: "inline", lineHeight: "inherit" }}>
                    {labelPosition === "before" && showLabel && (
                        <span style={locationStyle}>{labelText} </span>
                    )}
                    {separator && labelPosition === "before" && showLabel && (
                        <span style={sepStyle}>{separator} </span>
                    )}
                    <span style={dateStyle}>{displayString}</span>
                    {separator && labelPosition === "after" && showLabel && (
                        <span style={sepStyle}> {separator}</span>
                    )}
                    {labelPosition === "after" && showLabel && (
                        <span style={{ ...locationStyle }}> {labelText}</span>
                    )}
                </div>
            ) : (
                // ── Vertical: stacked as before
                <>
                    {dateEl}
                    {labelEl}
                </>
            )}
        </div>
    )
}

WorldDate.displayName = "World Date"

addPropertyControls(WorldDate, {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. DATE SETTINGS
    // ─────────────────────────────────────────────────────────────────────────

    locationId: {
        type: ControlType.Enum,
        title: "City / Zone",
        options: TIMEZONE_OPTIONS,
        optionTitles: TIMEZONE_TITLES,
        defaultValue: "Asia/Kolkata",
        description:
            "Choose a city or use the visitor's local timezone automatically.",
    },
    useCustomFormat: {
        type: ControlType.Boolean,
        title: "Custom Format",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Enable to write your own PHP-style date format string.\nDefault output: *Thursday, 19 March 2026*",
    },
    customFormat: {
        type: ControlType.String,
        title: "↳ Format",
        defaultValue: "l, d F Y",
        placeholder: "e.g. D, d M Y  or  j/n/Y",
        hidden: (props) => !props.useCustomFormat,
        description:
            "*Date format tokens:*\n" +
            "`d` - Day 01-31\n" +
            "`D` - Short weekday (Mon)\n" +
            "`j` - Day without zero (1-31)\n" +
            "`l` - Full weekday (Monday)\n" +
            "`N` - ISO weekday (1=Mon, 7=Sun)\n" +
            "`S` - Ordinal suffix (st, nd, rd, th)\n" +
            "`w` - Weekday (0=Sun, 6=Sat)\n" +
            "`z` - Day of year (0-365)\n" +
            "`W` - ISO week number\n" +
            "`F` - Full month (January)\n" +
            "`m` - Month 01-12\n" +
            "`M` - Short month (Jan)\n" +
            "`n` - Month without zero (1-12)\n" +
            "`t` - Days in month\n" +
            "`Y` - Year (2026)\n" +
            "`y` - Short year (26)\n" +
            "Use `\\` to escape a letter, e.g. `\\F` → F",
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CITY LABEL
    // ─────────────────────────────────────────────────────────────────────────

    showLabel: {
        type: ControlType.Boolean,
        title: "City Label",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Shows the city name next to the date.",
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
        defaultValue: "IN",
        placeholder: "e.g. LA, NYC, TYO",
        hidden: (props) => !props.showLabel || !props.useCustomLabel,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 3. LAYOUT
    // ─────────────────────────────────────────────────────────────────────────

    layout: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
        description:
            "Side by Side puts date and label in a row. Stacked puts the label below.",
    },
    contentAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "flex-start",
        displaySegmentedControl: true,
        description: "Text Alignment of the date",
    },
    verticalAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["flex-start", "center", "flex-end"],
        defaultValue: "flex-start",
        displaySegmentedControl: true,
        hidden: (props) => props.layout !== "vertical",
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
        placeholder: "e.g.  ·  or  |  or  —",
        hidden: (props) => !props.showLabel || props.layout === "vertical",
        description: "Optional character between the date and label.",
    },
    separatorColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "#111111",
        hidden: (props) =>
            !props.showLabel || props.layout === "vertical" || !props.separator,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 4. DATE STYLE
    // ─────────────────────────────────────────────────────────────────────────

    font: {
        type: ControlType.Font,
        title: "Date Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            variant: "Medium",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        displayTextAlignment: false,
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Case",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["Normal", "UPPERCASE", "lowercase", "Capitalize"],
        defaultValue: "none",
        displaySegmentedControl: false,
        description: "Transform the letter case of the date text.",
    },
    color: {
        type: ControlType.Color,
        title: "Date Color",
        defaultValue: "#111111",
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 5. LABEL STYLE
    // ─────────────────────────────────────────────────────────────────────────

    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        displayTextAlignment: false,
        hidden: (props) => !props.showLabel,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#111111",
        hidden: (props) => !props.showLabel,
        description:
            "\n--------------------\n↓ Fluid Responsive Font Size (Optional) ↓",
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 6. FLUID RESPONSIVE FONT — DATE
    // ─────────────────────────────────────────────────────────────────────────

    fluidFont: {
        type: ControlType.Boolean,
        title: "Date Size",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Automatically scales the font size between mobile and desktop. Only visible in Preview and on the live site.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
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
            "*Auto Calc* - lets you pick font sizes.\n*Manual* - lets you paste a clamp() value.",
    },
    minFontSize: {
        type: ControlType.Number,
        title: "↳ Mobile Size",
        defaultValue: 18,
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
        defaultValue: 28,
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
        defaultValue: "clamp(18px, 3vw, 28px)",
        placeholder: "clamp(18px, 3vw, 28px)",
        hidden: (props) => !props.fluidFont || props.fluidMode !== "manual",
        description:
            "Paste a clamp() value from tools like clamp.font-size.app\n\n--------------------",
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 7. FLUID RESPONSIVE FONT — LABEL
    // ─────────────────────────────────────────────────────────────────────────

    labelFluidFont: {
        type: ControlType.Boolean,
        title: "Label Size",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => !props.showLabel,
        description:
            "Automatically scales the font size between mobile and desktop. Only visible in Preview and on the live site.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
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
            "*Auto Calc* - lets you pick font sizes.\n*Manual* - lets you paste a clamp() value.",
    },
    labelMinFontSize: {
        type: ControlType.Number,
        title: "↳ Mobile Size",
        defaultValue: 14,
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
        defaultValue: 22,
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
        defaultValue: "clamp(12px, 2vw, 22px)",
        placeholder: "clamp(12px, 2vw, 22px)",
        hidden: (props) =>
            !props.showLabel ||
            !props.labelFluidFont ||
            props.labelFluidMode !== "manual",
        description:
            "Paste a clamp() value from tools like clamp.font-size.app\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
    },
})
