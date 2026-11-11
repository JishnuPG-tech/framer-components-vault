/**
 * @framerDisableUnlink
 * @framerDisplayName "Live Location"
 */

/**
 * Live Location v1.1.0
 * Professional location display component with live pulse indicator.
 *
 * ✨ Features:
 * • Auto-detects City/Country via IP (no API keys required)
 * • Multiple display modes: City, Country, or City + Country
 * • Multi-language support with locale awareness
 * • Responsive pulse animation that scales with font size
 * • Full accessibility support (ARIA, screen readers)
 * • Respects user motion preferences automatically
 * • Smart 24-hour caching for optimal performance
 * • Clean property controls with organized groups
 *
 * 🎨 Customization:
 * • Native Framer font controls with full typography support
 * • Customizable pulse color, position, and spacing
 * • Flag emoji support for countries
 * • Language/locale selection (manual or auto-detect)
 * • Flexible error handling and loading states
 *
 * 🚀 Perfect for:
 * • Hero sections showing visitor location
 * • Footer location displays
 * • Personalized welcome messages
 * • Location-based content blocks
 * • Multi-language websites
 *
 * 📝 CHANGELOG:
 * v1.1.0 (2025-08-12) - Added comprehensive locale/language support
 * v1.0.0 (2025-08-12) - Initial release
 *
 * © 2025 Amr Rashed - All rights reserved
 * Author: Amr Rashed (https://amrrashed.com)
 * Documentation: https://livelocation.framer.website/demo
 * Support: hello@amrrashed.com
 * License: Commercial use allowed with attribution
 */

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


/* =========================
   Types
   ========================= */
type Props = {
    displayMode: "City" | "Country" | "CityCountry"
    countryFormat: "name" | "code"
    showFlag: boolean

    localeMode: "manual" | "auto"
    locale: string

    font: any
    textColor: string

    showPulse: boolean
    pulseColor: string
    pulsePosition: "left" | "right"
    pulseSize: number
    pulseGap: number

    loadingText: string
    errorFallback: string
    enabled: boolean
}

type GeoData = {
    city?: string
    country_name?: string
    country_code?: string
}

/* =========================
   Constants & Defaults
   ========================= */
const CACHE_KEY = "liveLocationCacheV1"
const CACHE_HOURS = 24
const DEFAULT_TIMEOUT = 5000 // Slightly longer for better reliability

const defaultFont = {
    family: "Inter",
    weight: "500",
    size: 16,
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: "left",
}

// Translations for UI text
const translations: Record<string, { loading: string; error: string }> = {
    "en-US": {
        loading: "Detecting location…",
        error: "Somewhere in the world",
    },
    "es-ES": {
        loading: "Detectando ubicación…",
        error: "En algún lugar del mundo",
    },
    "fr-FR": {
        loading: "Détection de la position…",
        error: "Quelque part dans le monde",
    },
    "de-DE": {
        loading: "Standort wird ermittelt…",
        error: "Irgendwo auf der Welt",
    },
    "it-IT": {
        loading: "Rilevamento posizione…",
        error: "Da qualche parte nel mondo",
    },
    "pt-BR": {
        loading: "Detectando localização…",
        error: "Em algum lugar do mundo",
    },
    "ru-RU": { loading: "Определение местоположения…", error: "Где-то в мире" },
    "ja-JP": { loading: "位置を検出中…", error: "世界のどこか" },
    "ko-KR": { loading: "위치 감지 중…", error: "세계 어딘가" },
    "zh-CN": { loading: "正在检测位置…", error: "世界某处" },
    "ar-SA": { loading: "جارٍ تحديد الموقع…", error: "في مكان ما في العالم" },
    "hi-IN": {
        loading: "स्थान का पता लगाया जा रहा है…",
        error: "दुनिया में कहीं",
    },
    "nl-NL": { loading: "Locatie detecteren…", error: "Ergens ter wereld" },
    "pl-PL": { loading: "Wykrywanie lokalizacji…", error: "Gdzieś na świecie" },
    "tr-TR": { loading: "Konum algılanıyor…", error: "Dünyanın bir yerinde" },
    "sv-SE": { loading: "Upptäcker plats…", error: "Någonstans i världen" },
    "da-DK": { loading: "Registrerer placering…", error: "Et sted i verden" },
    "no-NO": { loading: "Oppdager plassering…", error: "Et sted i verden" },
    "fi-FI": {
        loading: "Tunnistetaan sijaintia…",
        error: "Jossain päin maailmaa",
    },
    "cs-CZ": { loading: "Zjišťování polohy…", error: "Někde ve světě" },
    "hu-HU": { loading: "Helymeghatározás…", error: "Valahol a világban" },
    "el-GR": { loading: "Εντοπισμός τοποθεσίας…", error: "Κάπου στον κόσμο" },
    "th-TH": { loading: "กำลังตรวจหาตำแหน่ง…", error: "ที่ใดที่หนึ่งในโลก" },
    "vi-VN": {
        loading: "Đang phát hiện vị trí…",
        error: "Một nơi nào đó trên thế giới",
    },
    "id-ID": {
        loading: "Mendeteksi lokasi…",
        error: "Di suatu tempat di dunia",
    },
    "ms-MY": { loading: "Mengesan lokasi…", error: "Di suatu tempat di dunia" },
    "uk-UA": { loading: "Визначення місцезнаходження…", error: "Десь у світі" },
    "ro-RO": { loading: "Detectare locație…", error: "Undeva în lume" },
    "bg-BG": {
        loading: "Откриване на местоположение…",
        error: "Някъде по света",
    },
    "hr-HR": { loading: "Otkrivanje lokacije…", error: "Negdje u svijetu" },
}

/* =========================
   Utils
   ========================= */
function countryCodeToFlagEmoji(code?: string): string {
    if (!code) return ""
    const cc = code.trim().toUpperCase()
    if (cc.length !== 2) return ""
    const base = 127397
    return String.fromCodePoint(
        cc.charCodeAt(0) + base,
        cc.charCodeAt(1) + base
    )
}

function cleanCountryName(name: string): string {
    // Common country name cleanups for better display
    const cleanups: Record<string, string> = {
        "The Netherlands": "Netherlands",
        "The Bahamas": "Bahamas",
        "The Gambia": "Gambia",
    }
    return cleanups[name] || name
}

// Get localized country name using Intl.DisplayNames
function getLocalizedCountryName(
    countryCode: string | undefined,
    locale: string
): string | undefined {
    if (!countryCode || typeof Intl === "undefined") return undefined

    try {
        // Use Intl.DisplayNames if available (modern browsers)
        if ("DisplayNames" in Intl) {
            const displayNames = new (Intl as any).DisplayNames([locale], {
                type: "region",
                fallback: "code",
            })
            return displayNames.of(countryCode.toUpperCase())
        }
    } catch (error) {
        // Fallback to English or original name
        if (process.env.NODE_ENV === "development") {
            console.warn("Failed to get localized country name:", error)
        }
    }

    return undefined
}

// Get browser locale or use fallback
function getBrowserLocale(): string {
    if (typeof window === "undefined") return "en-US"

    // Try multiple sources for locale
    const locale =
        navigator.language ||
        (navigator as any).userLanguage ||
        (navigator.languages && navigator.languages[0]) ||
        "en-US"

    return locale
}

// Validate and normalize locale code
function normalizeLocale(locale: string): string {
    // Handle common locale formats: en, en-US, en_US
    const normalized = locale.replace(/_/g, "-")

    // If it's just a language code (e.g., "en"), try to expand it
    if (normalized.length === 2) {
        const expansions: Record<string, string> = {
            en: "en-US",
            es: "es-ES",
            fr: "fr-FR",
            de: "de-DE",
            it: "it-IT",
            pt: "pt-BR",
            ru: "ru-RU",
            ja: "ja-JP",
            ko: "ko-KR",
            zh: "zh-CN",
            ar: "ar-SA",
            hi: "hi-IN",
            nl: "nl-NL",
        }
        return expansions[normalized.toLowerCase()] || normalized
    }

    return normalized
}

// Get localized text for loading and error states
function getLocalizedText(locale: string, type: "loading" | "error"): string {
    const normalized = normalizeLocale(locale)
    const translation = translations[normalized] || translations["en-US"]
    return translation[type]
}

async function fetchGeo(timeoutMs = DEFAULT_TIMEOUT): Promise<GeoData> {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
        const res = await fetch("https://ipapi.co/json/", {
            signal: ctrl.signal,
            headers: {
                Accept: "application/json",
                "User-Agent": "LiveLocation-Framer/1.0",
            },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        const data = await res.json()
        if (typeof data !== "object" || data === null) {
            throw new Error("Invalid response format")
        }
        return data as GeoData
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error("Request timeout")
        }
        throw error
    } finally {
        clearTimeout(t)
    }
}

function getCached(): (GeoData & { ts?: number }) | null {
    if (typeof window === "undefined") return null
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as GeoData & { ts?: number }
        if (!parsed.ts) return null
        const ageMs = Date.now() - parsed.ts
        if (ageMs > CACHE_HOURS * 3600 * 1000) {
            // Clean up expired cache
            localStorage.removeItem(CACHE_KEY)
            return null
        }
        return parsed
    } catch {
        // Clean up corrupted cache
        try {
            localStorage.removeItem(CACHE_KEY)
        } catch {}
        return null
    }
}

function setCached(data: GeoData): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ...data, ts: Date.now() })
        )
    } catch (error) {
        // Handle quota exceeded silently
        if (process.env.NODE_ENV === "development") {
            console.warn("LiveLocation: Failed to cache data", error)
        }
    }
}

/* =========================
   Component
   ========================= */
export default function LiveLocation(props: Partial<Props>) {
    const {
        displayMode = "CityCountry",
        countryFormat = "name",
        showFlag = false,

        localeMode = "manual",
        locale = "en-US",

        font,
        textColor = "#000000",

        showPulse = true,
        pulseColor = "#4CAF50",
        pulsePosition = "left",
        pulseSize = 10,
        pulseGap = 8,

        loadingText = "Detecting location…",
        errorFallback = "Somewhere in the world",
        enabled = true,
    } = props as Props

    const [geo, setGeo] = React.useState<GeoData | null>(null)
    const [state, setState] = React.useState<
        "idle" | "loading" | "ready" | "error"
    >("idle")
    const reduceMotion = useReducedMotion()

    // Determine which locale to use
    const activeLocale = React.useMemo(() => {
        return localeMode === "auto" ? getBrowserLocale() : locale
    }, [localeMode, locale])

    React.useEffect(() => {
        if (typeof window === "undefined" || !enabled) {
            setState("error")
            setGeo(null)
            return
        }

        const cached = getCached()
        if (cached?.city || cached?.country_name || cached?.country_code) {
            setGeo(cached)
            setState("ready")
            return
        }

        let mounted = true
        setState("loading")
        setGeo(null)

        fetchGeo()
            .then((data) => {
                if (!mounted) return
                // Validate we got useful data
                if (!data.city && !data.country_name && !data.country_code) {
                    throw new Error("No location data received")
                }
                setGeo(data)
                setCached(data)
                setState("ready")
            })
            .catch((error) => {
                if (!mounted) return
                if (process.env.NODE_ENV === "development") {
                    console.warn(
                        "LiveLocation: Failed to fetch location data",
                        error.message || error
                    )
                }
                setState("error")
            })

        return () => {
            mounted = false
        }
    }, [enabled])

    // Memoize text processing for performance
    const displayText = React.useMemo(() => {
        // City names stay in original form (Latin script)
        const city = geo?.city?.trim()

        // Get country name (localized if enabled)
        let countryName = geo?.country_name
            ? cleanCountryName(geo.country_name.trim())
            : ""

        // Attempt to get localized version if we're showing country name
        if (geo?.country_code && countryFormat === "name") {
            const localizedName = getLocalizedCountryName(
                geo.country_code,
                activeLocale
            )
            if (localizedName) {
                countryName = localizedName
            }
        }

        const countryCode = geo?.country_code?.trim()
        const flag = showFlag ? countryCodeToFlagEmoji(countryCode) : ""

        // Get localized or custom text for loading and error states
        const effectiveLoadingText =
            locale !== "en-US"
                ? getLocalizedText(activeLocale, "loading")
                : loadingText

        const effectiveErrorText =
            locale !== "en-US"
                ? getLocalizedText(activeLocale, "error")
                : errorFallback

        let text: string | null = null
        if (state === "loading") {
            text = effectiveLoadingText || ""
        } else if (state === "error") {
            text = effectiveErrorText === "hide" ? null : effectiveErrorText
        } else if (state === "ready") {
            if (displayMode === "City") {
                text =
                    city ||
                    (effectiveErrorText === "hide" ? null : effectiveErrorText)
            } else if (displayMode === "Country") {
                text =
                    countryFormat === "code"
                        ? countryCode || ""
                        : countryName || ""
                if (!text)
                    text =
                        effectiveErrorText === "hide"
                            ? null
                            : effectiveErrorText
            } else {
                const countryOut =
                    countryFormat === "code"
                        ? countryCode || ""
                        : countryName || ""
                const parts = [city, countryOut].filter(Boolean)
                text = parts.length
                    ? parts.join(", ")
                    : effectiveErrorText === "hide"
                      ? null
                      : effectiveErrorText
            }
        }

        if (text == null) return null
        return {
            text,
            finalText: `${flag ? `${flag} ` : ""}${text}`,
        }
    }, [
        geo,
        state,
        displayMode,
        countryFormat,
        showFlag,
        loadingText,
        errorFallback,
        localeMode,
        activeLocale,
    ])

    if (!displayText) return null

    // Use custom pulse size or default to 10px
    const dotSize = pulseSize || 10

    const justifyContent =
        (font?.textAlign || defaultFont.textAlign) === "center"
            ? "center"
            : (font?.textAlign || defaultFont.textAlign) === "right"
              ? "flex-end"
              : "flex-start"

    const Ripple = (
        <div
            style={{
                position: "relative",
                width: dotSize,
                height: dotSize,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: pulsePosition === "left" ? pulseGap : 0,
                marginLeft: pulsePosition === "right" ? pulseGap : 0,
                flexShrink: 0,
                overflow: "visible",
            }}
            aria-hidden="true"
        >
            <span
                style={{
                    position: "absolute",
                    width: dotSize,
                    height: dotSize,
                    borderRadius: "50%",
                    backgroundColor: pulseColor,
                    zIndex: 2,
                }}
            />
            {!reduceMotion && (
                <motion.span
                    key={`pulse-${dotSize}-${pulseColor}`} // Key forces re-mount on changes
                    style={{
                        position: "absolute",
                        width: dotSize,
                        height: dotSize,
                        borderRadius: "50%",
                        backgroundColor: pulseColor,
                        willChange: "transform, opacity",
                        transformOrigin: "center",
                        zIndex: 1,
                    }}
                    animate={{ scale: [1, 2.8], opacity: [0, 0.35, 0] }}
                    transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: ["linear", "easeOut"],
                        times: [0, 0.25, 1],
                    }}
                />
            )}
        </div>
    )

    const fontStyle: React.CSSProperties = {
        ...(font || defaultFont),
        color: textColor,
    }

    return (
        <div
            style={{
                ...fontStyle,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent,
                overflow: "visible",
            }}
            aria-label={`Current location: ${displayText.text}`}
            aria-live={state === "loading" ? "polite" : "off"}
            aria-busy={state === "loading"}
            role="status"
            title={displayText.finalText}
        >
            {showPulse && pulsePosition === "left" && Ripple}
            <span
                style={{
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "visible", // Changed from "hidden" to "visible"
                }}
            >
                {displayText.finalText}
            </span>
            {showPulse && pulsePosition === "right" && Ripple}
        </div>
    )
}

/* =========================
   Property Controls
   ========================= */
addPropertyControls(LiveLocation, {
    // Location group
    displayMode: {
        type: ControlType.Enum,
        options: ["City", "Country", "CityCountry"],
        optionTitles: ["City", "Country", "City + Country"],
        title: "Display Mode",
        defaultValue: "CityCountry",
        group: "Location",
    },
    countryFormat: {
        type: ControlType.Enum,
        options: ["name", "code"],
        optionTitles: ["Full Name", "Code"],
        title: "Country Format",
        defaultValue: "name",
        displaySegmentedControl: true,
        hidden: (props) => props.displayMode === "City",
        group: "Location",
    },
    showFlag: {
        type: ControlType.Boolean,
        title: "Show Flag Emoji",
        defaultValue: false,
        group: "Location",
    },
    // Locale group
    localeMode: {
        type: ControlType.Enum,
        options: ["manual", "auto"],
        optionTitles: ["Manual", "Auto"],
        title: "Locale",
        defaultValue: "manual",
        displaySegmentedControl: true,
        group: "Locale",
    },
    locale: {
        type: ControlType.Enum,
        options: [
            "en-US",
            "es-ES",
            "fr-FR",
            "de-DE",
            "it-IT",
            "pt-BR",
            "ru-RU",
            "ja-JP",
            "ko-KR",
            "zh-CN",
            "ar-SA",
            "hi-IN",
            "nl-NL",
            "pl-PL",
            "tr-TR",
            "sv-SE",
            "da-DK",
            "no-NO",
            "fi-FI",
            "cs-CZ",
            "hu-HU",
            "el-GR",
            "th-TH",
            "vi-VN",
            "id-ID",
            "ms-MY",
            "uk-UA",
            "ro-RO",
            "bg-BG",
            "hr-HR",
        ],
        optionTitles: [
            "English (US)",
            "Español (Spain)",
            "Français (France)",
            "Deutsch (Germany)",
            "Italiano (Italy)",
            "Português (Brazil)",
            "Русский (Russia)",
            "日本語 (Japan)",
            "한국어 (Korea)",
            "中文 (China)",
            "العربية (Saudi)",
            "हिन्दी (India)",
            "Nederlands (Netherlands)",
            "Polski (Poland)",
            "Türkçe (Turkey)",
            "Svenska (Sweden)",
            "Dansk (Denmark)",
            "Norsk (Norway)",
            "Suomi (Finland)",
            "Čeština (Czech)",
            "Magyar (Hungary)",
            "Ελληνικά (Greece)",
            "ไทย (Thailand)",
            "Tiếng Việt (Vietnam)",
            "Bahasa (Indonesia)",
            "Bahasa (Malaysia)",
            "Українська (Ukraine)",
            "Română (Romania)",
            "Български (Bulgaria)",
            "Hrvatski (Croatia)",
        ],
        title: "Language",
        defaultValue: "en-US",
        hidden: (props) => props.localeMode === "auto",
        group: "Locale",
    },

    // Typography group
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultValue: { ...defaultFont },
        group: "Typography",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        group: "Typography",
    },

    // Pulse group
    showPulse: {
        type: ControlType.Boolean,
        title: "Show Pulse",
        defaultValue: true,
        group: "Pulse",
    },
    pulseColor: {
        type: ControlType.Color,
        title: "Pulse Color",
        defaultValue: "#4CAF50",
        hidden: (props) => !props.showPulse,
        group: "Pulse",
    },
    pulsePosition: {
        type: ControlType.Enum,
        title: "Pulse Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: (props) => !props.showPulse,
        group: "Pulse",
    },
    pulseSize: {
        type: ControlType.Number,
        title: "Pulse Size",
        min: 1,
        step: 1,
        unit: "px",
        defaultValue: 10,
        hidden: (props) => !props.showPulse,
        group: "Pulse",
    },
    pulseGap: {
        type: ControlType.Number,
        title: "Pulse Gap",
        min: 0,
        step: 1,
        unit: "px",
        defaultValue: 8,
        hidden: (props) => !props.showPulse,
        group: "Pulse",
    },

    // States group
    loadingText: {
        type: ControlType.String,
        title: "Loading Text",
        defaultValue: "Detecting location…",
        placeholder: "Text shown while loading",
        group: "States",
    },
    errorFallback: {
        type: ControlType.String,
        title: "Error Fallback",
        defaultValue: "Somewhere in the world",
        placeholder: "Use 'hide' to hide component on error",
        group: "States",
    },
    enabled: {
        type: ControlType.Boolean,
        title: "Enable Component",
        defaultValue: true,
        description:
            "Live Location built by [Amr Rashed](https://amrrashed.com)",
        group: "States",
    },
})

// Component metadata
;(LiveLocation as any).displayName = "Live Location"
;(LiveLocation as any).defaultProps = {
    font: { ...defaultFont },
}

// FramerDisableLink - Prevents users from accessing the source code
;(LiveLocation as any).FramerDisableLink = true

// Disable unlinking to protect the component
export const framerDisableUnlinking = true
