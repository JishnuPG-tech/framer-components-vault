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


const fontStack = `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`

const containerStyles = {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
}

const localeOptions: Record<string, string> = {
    af: "Afrikaans",
    sq: "Albanian",
    an: "Aragonese",
    ar: "Arabic (Standard)",
    "ar-dz": "Arabic (Algeria)",
    "ar-bh": "Arabic (Bahrain)",
    "ar-eg": "Arabic (Egypt)",
    "ar-iq": "Arabic (Iraq)",
    "ar-jo": "Arabic (Jordan)",
    "ar-kw": "Arabic (Kuwait)",
    "ar-lb": "Arabic (Lebanon)",
    "ar-ly": "Arabic (Libya)",
    "ar-ma": "Arabic (Morocco)",
    "ar-om": "Arabic (Oman)",
    "ar-qa": "Arabic (Qatar)",
    "ar-sa": "Arabic (Saudi Arabia)",
    "ar-sy": "Arabic (Syria)",
    "ar-tn": "Arabic (Tunisia)",
    "ar-ae": "Arabic (U.A.E.)",
    "ar-ye": "Arabic (Yemen)",
    hy: "Armenian",
    as: "Assamese",
    ast: "Asturian",
    az: "Azerbaijani",
    eu: "Basque",
    bg: "Bulgarian",
    be: "Belarusian",
    bn: "Bengali",
    bs: "Bosnian",
    br: "Breton",
    my: "Burmese",
    ca: "Catalan",
    ch: "Chamorro",
    ce: "Chechen",
    zh: "Chinese",
    "zh-hk": "Chinese (Hong Kong)",
    "zh-cn": "Chinese (PRC)",
    "zh-sg": "Chinese (Singapore)",
    "zh-tw": "Chinese (Taiwan)",
    cv: "Chuvash",
    co: "Corsican",
    cr: "Cree",
    hr: "Croatian",
    cs: "Czech",
    da: "Danish",
    nl: "Dutch (Standard)",
    "nl-be": "Dutch (Belgian)",
    en: "English",
    "en-au": "English (Australia)",
    "en-bz": "English (Belize)",
    "en-ca": "English (Canada)",
    "en-ie": "English (Ireland)",
    "en-jm": "English (Jamaica)",
    "en-nz": "English (New Zealand)",
    "en-ph": "English (Philippines)",
    "en-za": "English (South Africa)",
    "en-tt": "English (Trinidad & Tobago)",
    "en-gb": "English (United Kingdom)",
    "en-us": "English (United States)",
    "en-zw": "English (Zimbabwe)",
    eo: "Esperanto",
    et: "Estonian",
    fo: "Faeroese",
    fa: "Farsi",
    fj: "Fijian",
    fi: "Finnish",
    fr: "French (Standard)",
    "fr-be": "French (Belgium)",
    "fr-ca": "French (Canada)",
    "fr-fr": "French (France)",
    "fr-lu": "French (Luxembourg)",
    "fr-mc": "French (Monaco)",
    "fr-ch": "French (Switzerland)",
    fy: "Frisian",
    fur: "Friulian",
    gd: "Gaelic (Scots)",
    "gd-ie": "Gaelic (Irish)",
    gl: "Galacian",
    ka: "Georgian",
    de: "German (Standard)",
    "de-at": "German (Austria)",
    "de-de": "German (Germany)",
    "de-li": "German (Liechtenstein)",
    "de-lu": "German (Luxembourg)",
    "de-ch": "German (Switzerland)",
    el: "Greek",
    gu: "Gujurati",
    ht: "Haitian",
    he: "Hebrew",
    hi: "Hindi",
    hu: "Hungarian",
    is: "Icelandic",
    id: "Indonesian",
    iu: "Inuktitut",
    ga: "Irish",
    it: "Italian (Standard)",
    "it-ch": "Italian (Switzerland)",
    ja: "Japanese",
    kn: "Kannada",
    ks: "Kashmiri",
    kk: "Kazakh",
    km: "Khmer",
    ky: "Kirghiz",
    tlh: "Klingon",
    ko: "Korean",
    "ko-kp": "Korean (North Korea)",
    "ko-kr": "Korean (South Korea)",
    la: "Latin",
    lv: "Latvian",
    lt: "Lithuanian",
    lb: "Luxembourgish",
    mk: "FYRO Macedonian",
    ms: "Malay",
    ml: "Malayalam",
    mt: "Maltese",
    mi: "Maori",
    mr: "Marathi",
    mo: "Moldavian",
    nv: "Navajo",
    ng: "Ndonga",
    ne: "Nepali",
    no: "Norwegian",
    nb: "Norwegian (Bokmal)",
    nn: "Norwegian (Nynorsk)",
    oc: "Occitan",
    or: "Oriya",
    om: "Oromo",
    "fa-ir": "Persian/Iran",
    pl: "Polish",
    pt: "Portuguese",
    "pt-br": "Portuguese (Brazil)",
    pa: "Punjabi",
    "pa-in": "Punjabi (India)",
    "pa-pk": "Punjabi (Pakistan)",
    qu: "Quechua",
    rm: "Rhaeto-Romanic",
    ro: "Romanian",
    "ro-mo": "Romanian (Moldavia)",
    ru: "Russian",
    "ru-mo": "Russian (Moldavia)",
    sz: "Sami (Lappish)",
    sg: "Sango",
    sa: "Sanskrit",
    sc: "Sardinian",
    sd: "Sindhi",
    si: "Singhalese",
    sr: "Serbian",
    sk: "Slovak",
    sl: "Slovenian",
    so: "Somani",
    sb: "Sorbian",
    es: "Spanish",
    "es-ar": "Spanish (Argentina)",
    "es-bo": "Spanish (Bolivia)",
    "es-cl": "Spanish (Chile)",
    "es-co": "Spanish (Colombia)",
    "es-cr": "Spanish (Costa Rica)",
    "es-do": "Spanish (Dominican Republic)",
    "es-ec": "Spanish (Ecuador)",
    "es-sv": "Spanish (El Salvador)",
    "es-gt": "Spanish (Guatemala)",
    "es-hn": "Spanish (Honduras)",
    "es-mx": "Spanish (Mexico)",
    "es-ni": "Spanish (Nicaragua)",
    "es-pa": "Spanish (Panama)",
    "es-py": "Spanish (Paraguay)",
    "es-pe": "Spanish (Peru)",
    "es-pr": "Spanish (Puerto Rico)",
    "es-es": "Spanish (Spain)",
    "es-uy": "Spanish (Uruguay)",
    "es-ve": "Spanish (Venezuela)",
    sx: "Sutu",
    sw: "Swahili",
    sv: "Swedish",
    "sv-fi": "Swedish (Finland)",
    "sv-sv": "Swedish (Sweden)",
    ta: "Tamil",
    tt: "Tatar",
    te: "Teluga",
    th: "Thai",
    tig: "Tigre",
    ts: "Tsonga",
    tn: "Tswana",
    tr: "Turkish",
    tk: "Turkmen",
    uk: "Ukrainian",
    hsb: "Upper Sorbian",
    ur: "Urdu",
    ve: "Venda",
    vi: "Vietnamese",
    vo: "Volapuk",
    wa: "Walloon",
    cy: "Welsh",
    xh: "Xhosa",
    ji: "Yiddish",
    zu: "Zulu",
}

const regionToTimeZone: Record<string, string> = {
    US: "America/New_York",
    CA: "America/Toronto",
    MX: "America/Mexico_City",
    BR: "America/Sao_Paulo",
    AR: "America/Argentina/Buenos_Aires",
    GB: "Europe/London",
    IE: "Europe/Dublin",
    FR: "Europe/Paris",
    DE: "Europe/Berlin",
    IT: "Europe/Rome",
    ES: "Europe/Madrid",
    NL: "Europe/Amsterdam",
    PT: "Europe/Lisbon",
    PL: "Europe/Warsaw",
    TR: "Europe/Istanbul",
    RU: "Europe/Moscow",
    SA: "Asia/Riyadh",
    AE: "Asia/Dubai",
    IN: "Asia/Kolkata",
    TH: "Asia/Bangkok",
    SG: "Asia/Singapore",
    MY: "Asia/Kuala_Lumpur",
    PH: "Asia/Manila",
    ID: "Asia/Jakarta",
    VN: "Asia/Ho_Chi_Minh",
    CN: "Asia/Shanghai",
    HK: "Asia/Hong_Kong",
    TW: "Asia/Taipei",
    KR: "Asia/Seoul",
    JP: "Asia/Tokyo",
    AU: "Australia/Sydney",
    NZ: "Pacific/Auckland",
    ZA: "Africa/Johannesburg",
    EG: "Africa/Cairo",
    NG: "Africa/Lagos",
}

function getBrowserTimeZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    } catch (error) {
        return "UTC"
    }
}

function isSupportedTimeZone(timeZone: string) {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date())
        return true
    } catch (error) {
        return false
    }
}

function resolveTimeZoneFromLocale(locale: string) {
    try {
        let region = ""
        if (typeof Intl !== "undefined" && "Locale" in Intl) {
            const localeObject = new Intl.Locale(locale)
            region = localeObject.region || ""
        }
        if (!region) {
            const fallbackRegion = locale.split("-")[1]
            region = fallbackRegion ? fallbackRegion.toUpperCase() : ""
        }

        const mappedTimeZone = region ? regionToTimeZone[region] : undefined
        if (mappedTimeZone && isSupportedTimeZone(mappedTimeZone)) {
            return mappedTimeZone
        }
    } catch (error) {
        // Fallback handled below
    }

    return getBrowserTimeZone()
}

function getTimeZoneLabel(timeZone: string, now: Date) {
    try {
        const offsetParts = new Intl.DateTimeFormat("en", {
            timeZone,
            timeZoneName: "shortOffset",
        }).formatToParts(now)
        const offsetPart = offsetParts.find(
            (part) => part.type === "timeZoneName"
        )
        if (offsetPart?.value) return offsetPart.value
    } catch (error) {
        // Fallback handled below
    }

    try {
        const shortParts = new Intl.DateTimeFormat("en", {
            timeZone,
            timeZoneName: "short",
        }).formatToParts(now)
        const shortPart = shortParts.find(
            (part) => part.type === "timeZoneName"
        )
        if (shortPart?.value?.startsWith("GMT")) return shortPart.value
    } catch (error) {
        // Fallback handled below
    }

    return timeZone
}

/**
 * TIME
 *
 * @framerIntrinsicWidth 140
 * @framerIntrinsicHeight 20
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LiveDateTime(props) {
    const {
        outputType,
        localeType,
        customLocale,
        timeFormat,
        showYear,
        showDate,
        showTime,
        showWeekday,
        showHours,
        showMinutes,
        showSeconds,
        monthFormat,
        showTimezone,
        tag,
        color,
        font,
    } = props

    const Tag = tag || "div"
    const isStatic = useIsStaticRenderer()

    const [rerenderOutputKey, setRerenderOutputKey] = React.useState(
        `${Math.random()}`
    )
    const timerRef = React.useRef<number>()
    const timeoutRef = React.useRef<number>()

    const text = React.useMemo(() => {
        const locale = localeType === "custom" ? [customLocale] : []
        const resolvedTimeZone =
            localeType === "custom"
                ? resolveTimeZoneFromLocale(customLocale)
                : undefined
        const now = new Date()

        let parts: string[] = []

        // DATE
        if (showDate) {
            const dateOptions: Intl.DateTimeFormatOptions = {
                weekday: showWeekday ? "long" : undefined,
                day: "numeric",
                month: monthFormat,
                year: showYear ? "numeric" : undefined,
                ...(resolvedTimeZone ? { timeZone: resolvedTimeZone } : {}),
            }
            parts.push(new Intl.DateTimeFormat(locale, dateOptions).format(now))
        }

        // TIME
        if (showTime) {
            const timeOptions: Intl.DateTimeFormatOptions = {
                hour: showHours ? "numeric" : undefined,
                minute: showMinutes ? "numeric" : undefined,
                second: showSeconds && showMinutes ? "numeric" : undefined,
                hour12: timeFormat === "12h",
                ...(resolvedTimeZone ? { timeZone: resolvedTimeZone } : {}),
            }
            parts.push(new Intl.DateTimeFormat(locale, timeOptions).format(now))
        }

        // YEAR ONLY (when date is off but year is on)
        if (!showDate && !showTime && showYear) {
            parts.push(
                new Intl.DateTimeFormat(locale, {
                    year: "numeric",
                    ...(resolvedTimeZone ? { timeZone: resolvedTimeZone } : {}),
                }).format(now)
            )
        }

        if (localeType === "custom" && showTimezone && resolvedTimeZone) {
            parts.push(getTimeZoneLabel(resolvedTimeZone, now))
        }

        if (!parts.length) {
            return new Intl.DateTimeFormat(locale, {
                year: "numeric",
            }).format(now)
        }

        return parts.join(" ")
    }, [
        localeType,
        customLocale,
        timeFormat,
        showYear,
        showDate,
        showTime,
        showWeekday,
        showHours,
        showMinutes,
        showSeconds,
        monthFormat,
        showTimezone,
        rerenderOutputKey,
    ])

    React.useEffect(() => {
        if (!showTime || isStatic) return
        if (typeof window === "undefined") return

        const tick = () => {
            React.startTransition(() => {
                setRerenderOutputKey(`${Math.random()}`)
            })
        }

        const now = new Date()
        const initialDelay = showSeconds
            ? 1000 - now.getMilliseconds()
            : (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
        const intervalMs = showSeconds ? 1000 : 60000

        timeoutRef.current = window.setTimeout(
            () => {
                tick()
                timerRef.current = window.setInterval(tick, intervalMs)
            },
            Math.max(1, initialDelay)
        )

        return () => {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
            if (timerRef.current) window.clearInterval(timerRef.current)
        }
    }, [showTime, showSeconds, isStatic])

    return (
        <Tag
            style={{
                ...containerStyles,
                margin: 0,
                color,
                fontFamily: fontStack,
                fontWeight: 500,
                fontSize: 16,
                ...font,
                textAlign: font?.textAlign || "center",
            }}
        >
            <span style={{ width: "100%" }}>{text}</span>
        </Tag>
    )
}

LiveDateTime.defaultProps = {
    height: 20,
    width: 140,
    localeType: "auto",
    customLocale: "en-US",
    color: "#999",
    timeFormat: "24h",

    // NEW VISIBILITY CONTROLS
    showDate: true,
    showTime: true,
    showYear: true,

    showWeekday: true,
    showHours: true,
    showMinutes: true,
    showSeconds: false,
    monthFormat: "long",
    showTimezone: true,
    tag: "p",
}

LiveDateTime.displayName = "Live Date & Time"

addPropertyControls(LiveDateTime, {
    showDate: {
        title: "Date",
        type: ControlType.Boolean,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    showTime: {
        title: "Time",
        type: ControlType.Boolean,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    showYear: {
        title: "Year",
        type: ControlType.Boolean,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    showWeekday: {
        title: "Weekday",
        type: ControlType.Boolean,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.showDate,
    },
    monthFormat: {
        title: "Month",
        type: ControlType.Enum,
        options: ["short", "long", "numeric"],
        optionTitles: ["Short", "Long", "Numeric"],
        hidden: (props) => !props.showDate,
    },
    timeFormat: {
        title: "Format",
        type: ControlType.Enum,
        options: ["12h", "24h"],
        optionTitles: ["12h", "24h"],
        displaySegmentedControl: true,
        hidden: (props) => !props.showTime,
    },
    showHours: {
        title: "Hours",
        type: ControlType.Boolean,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.showTime,
    },
    showMinutes: {
        title: "Minutes",
        type: ControlType.Boolean,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.showTime,
    },
    showSeconds: {
        title: "Seconds",
        type: ControlType.Boolean,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.showTime || !props.showMinutes,
    },
    showTimezone: {
        title: "Timezone",
        type: ControlType.Boolean,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
        hidden: (props) => props.localeType !== "custom",
    },
    localeType: {
        title: "Locale",
        type: ControlType.Enum,
        displaySegmentedControl: true,
        options: ["custom", "auto"],
        optionTitles: ["Custom", "Auto"],
    },
    customLocale: {
        title: " ",
        type: ControlType.Enum,
        options: Object.keys(localeOptions).sort(),
        optionTitles: Object.keys(localeOptions)
            .sort()
            .map((key) => localeOptions[key]),
        hidden: (props) => props.localeType !== "custom",
    },
    tag: {
        title: "Tag",
        type: ControlType.Enum,
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"],
        optionTitles: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"],
        defaultValue: "p",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        displayTextAlignment: true,
        defaultValue: {
            textAlign: "center",
        },
    },
    color: {
        type: ControlType.Color,
    },
})
