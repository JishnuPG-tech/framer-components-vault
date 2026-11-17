import * as React from "react"
import { useState, useEffect, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const COUNTRY_TO_CURRENCY = {
    // Americas
    US: "USD",
    CA: "CAD",
    MX: "MXN",
    BR: "BRL",
    AR: "ARS",
    CO: "COP",
    CL: "CLP",
    PE: "PEN",

    // Europe
    GB: "GBP",
    CH: "CHF",
    SE: "SEK",
    NO: "NOK",
    DK: "DKK",
    TR: "TRY",
    RU: "RUB",

    // Asia / Pacific
    IN: "INR",
    PK: "PKR",
    AU: "AUD",
    NZ: "NZD",
    JP: "JPY",
    CN: "CNY",
    SG: "SGD",
    ID: "IDR",
    MY: "MYR",
    TH: "THB",
    PH: "PHP",
    BD: "BDT",
    VN: "VND",

    // Middle East / Africa
    AE: "AED",
    SA: "SAR",
    ZA: "ZAR",
    NG: "NGN",
    EG: "EGP",

    // Eurozone
    DE: "EUR",
    FR: "EUR",
    IT: "EUR",
    ES: "EUR",
    NL: "EUR",
    BE: "EUR",
    AT: "EUR",
    GR: "EUR",
    PT: "EUR",
    FI: "EUR",
    IE: "EUR",
    SK: "EUR",
    EE: "EUR",
    LV: "EUR",
    LT: "EUR",
    LU: "EUR",
    MT: "EUR",
    CY: "EUR",
    SI: "EUR",
    HR: "EUR",
}

const GEO_ENDPOINTS = [
    "https://api.country.is/",
    "https://get.geojs.io/v1/ip/country.json",
]

function normalizeCountryCode(value) {
    if (!value) return ""

    return String(value).trim().toUpperCase().slice(0, 2)
}

function normalizeCurrencyCode(value, fallback = "USD") {
    if (!value) return fallback

    const code = String(value).trim().toUpperCase()

    return /^[A-Z]{3}$/.test(code) ? code : fallback
}

function formatMoney(priceString, currencyCode, currencyDisplay) {
    const rawValue = String(priceString ?? "")
    const cleanValue = rawValue.replace(/,/g, "").replace(/[^\d.-]/g, "")
    const numericPrice = Number(cleanValue)

    if (!Number.isFinite(numericPrice)) return rawValue

    const safeCurrencyCode = normalizeCurrencyCode(currencyCode)

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: safeCurrencyCode,
            currencyDisplay,
            minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
            maximumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
        }).format(numericPrice)
    } catch (error) {
        return `${safeCurrencyCode} ${rawValue}`
    }
}

async function fetchCountryFromEndpoint(url, signal) {
    const response = await fetch(url, { signal })

    if (!response.ok) {
        throw new Error(`Geo request failed: ${response.status}`)
    }

    const data = await response.json()

    return normalizeCountryCode(data?.country)
}

export default function GeoPricing(props) {
    const {
        defaultPrice,
        defaultCurrencyCode,
        pricingData,
        countryMode,
        countryCode,
        suffix,
        loadingText,
        font = {},
        suffixFont = {},
        gap,
        textColor,
        suffixColor,
        currencyDisplay,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const [detectedCountryCode, setDetectedCountryCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const safeDefaultCurrencyCode = normalizeCurrencyCode(
        defaultCurrencyCode,
        "USD"
    )

    const parsedPricingMap = useMemo(() => {
        const map = {}

        if (!pricingData) return map

        const lines = pricingData.split("\n")

        lines.forEach((line) => {
            const trimmedLine = line.trim()

            if (!trimmedLine || trimmedLine.startsWith("#")) return

            const parts = trimmedLine.split(",").map((part) => part.trim())

            const rowCountryCode = normalizeCountryCode(parts[0])
            const rowPrice = parts[1]
            const rowCurrencyCode = normalizeCurrencyCode(
                parts[2],
                COUNTRY_TO_CURRENCY[rowCountryCode] || safeDefaultCurrencyCode
            )

            if (!rowCountryCode || !rowPrice) return

            map[rowCountryCode] = {
                price: rowPrice,
                currencyCode: rowCurrencyCode,
            }
        })

        return map
    }, [pricingData, safeDefaultCurrencyCode])

    useEffect(() => {
        const shouldAutoDetect =
            countryMode === "auto" && isStaticRenderer === false

        if (!shouldAutoDetect) {
            setDetectedCountryCode("")
            setIsLoading(false)
            return
        }

        const controller = new AbortController()
        let isMounted = true

        async function detectCountry() {
            setIsLoading(true)

            try {
                let resolvedCountryCode = ""

                for (const endpoint of GEO_ENDPOINTS) {
                    try {
                        resolvedCountryCode = await fetchCountryFromEndpoint(
                            endpoint,
                            controller.signal
                        )

                        if (resolvedCountryCode) break
                    } catch (error) {
                        if (error?.name === "AbortError") return
                    }
                }

                if (isMounted) {
                    setDetectedCountryCode(resolvedCountryCode)
                }
            } catch (error) {
                if (isMounted) {
                    setDetectedCountryCode("")
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        detectCountry()

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [countryMode, isStaticRenderer])

    const activeCountryCode = useMemo(() => {
        if (countryMode === "auto" && isStaticRenderer === false) {
            return detectedCountryCode
        }

        return normalizeCountryCode(countryCode)
    }, [countryMode, isStaticRenderer, detectedCountryCode, countryCode])

    const displayPrice = useMemo(() => {
        const matchedPricing = parsedPricingMap[activeCountryCode]

        if (matchedPricing) {
            return formatMoney(
                matchedPricing.price,
                matchedPricing.currencyCode,
                currencyDisplay
            )
        }

        return formatMoney(
            defaultPrice,
            safeDefaultCurrencyCode,
            currencyDisplay
        )
    }, [
        activeCountryCode,
        parsedPricingMap,
        defaultPrice,
        safeDefaultCurrencyCode,
        currencyDisplay,
    ])

    const containerStyle = {
        display: "flex",
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "center",
        gap: `${gap}px`,
        width: "100%",
        height: "100%",
    }

    const mainTextStyle = {
        fontFamily: "Inter, sans-serif",
        fontSize: "64px",
        ...font,
        color: textColor,
        margin: 0,
        whiteSpace: "nowrap",
    }

    const suffixStyle = {
        fontFamily: "Inter, sans-serif",
        fontSize: "20px",
        ...suffixFont,
        color: suffixColor,
        margin: 0,
        whiteSpace: "nowrap",
    }

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <p style={{ ...mainTextStyle, opacity: 0.5 }}>{loadingText}</p>
            </div>
        )
    }

    return (
        <div style={containerStyle} aria-label={`Price ${displayPrice}`}>
            <p style={mainTextStyle}>{displayPrice}</p>
            {suffix && <p style={suffixStyle}>{suffix}</p>}
        </div>
    )
}

addPropertyControls(GeoPricing, {
    pricingData: {
        type: ControlType.String,
        displayTextArea: true,
        title: "Country Data",
        defaultValue: "US, 99, USD\nGB, 79, GBP\nIN, 2999, INR\nPK, 15000, PKR",
        placeholder: "US, 99, USD\nGB, 79, GBP",
        description:
            "Format: Country Code, Price, Currency Code. One country per line. Example: US, 99, USD",
    },
    defaultPrice: {
        type: ControlType.String,
        title: "Default Price",
        defaultValue: "99",
    },
    defaultCurrencyCode: {
        type: ControlType.String,
        title: "Default Currency",
        defaultValue: "USD",
        description: "Fallback 3-letter currency code. Example: USD, EUR, GBP.",
    },
    countryMode: {
        type: ControlType.Enum,
        title: "Country Source",
        options: ["manual", "auto"],
        optionTitles: ["Manual", "Auto-detect"],
        defaultValue: "manual",
        description:
            "Manual uses the country code below. Auto-detect uses optional third-party IP geolocation on the live site only.",
    },
    countryCode: {
        type: ControlType.String,
        title: "Country Code",
        defaultValue: "US",
        placeholder: "US",
        description:
            "Used for manual mode and as the static preview country on Canvas/export.",
    },
    currencyDisplay: {
        type: ControlType.Enum,
        title: "Currency Style",
        options: ["narrowSymbol", "symbol", "code"],
        optionTitles: ["Narrow Symbol", "Symbol", "Code"],
        defaultValue: "narrowSymbol",
    },
    font: {
        type: ControlType.Font,
        title: "Price Font",
        controls: "extended",
    },
    textColor: {
        type: ControlType.Color,
        title: "Price Color",
        defaultValue: "#111827",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix Text",
        defaultValue: "/mo",
    },
    suffixFont: {
        type: ControlType.Font,
        title: "Suffix Font",
        controls: "extended",
    },
    suffixColor: {
        type: ControlType.Color,
        title: "Suffix Color",
        defaultValue: "#6B7280",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 4,
        min: 0,
        max: 100,
        step: 1,
    },
    loadingText: {
        type: ControlType.String,
        title: "Loading Text",
        defaultValue: "...",
    },
})
