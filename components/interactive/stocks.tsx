// CryptoPrice: Displays live crypto price from CoinGecko with icon, abbreviation, and full styling controls.
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


function abbreviateNumber(num) {
    if (num === null || num === undefined) return "-"
    if (num < 1000) return num.toLocaleString()
    const units = ["K", "M", "B", "T"]
    let unit = -1
    let n = num
    while (n >= 1000 && unit < units.length - 1) {
        n /= 1000
        unit++
    }
    return `${n.toFixed(2).replace(/\.00$/, "")}${units[unit]}`
}

/**
 * Stocks
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Stocks(props) {
    const {
        ticker,
        font,
        fontColor,
        backgroundColor,
        borderRadius,
        iconBg,
        padding,
        iconSize,
        iconRadius,
        gap,
        border,
        showIcon,
        abbreviate,
        showSymbol,
        showCurrencyLabel,
        showChange = false, // new prop
        changeUpColor = "#22CC66",
        changeDownColor = "#FF5588",
    } = props

    // State for price and icon
    const [price, setPrice] = React.useState(null)
    const [companyName, setCompanyName] = React.useState("")
    const [iconError, setIconError] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [change, setChange] = React.useState(null)
    const [changePercent, setChangePercent] = React.useState(null)

    // Default icon
    const DEFAULT_ICON = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"

    // Fetch price and company info
    React.useEffect(() => {
        if (!ticker) return
        let ignore = false
        setLoading(true)
        async function fetchData() {
            try {
                // Using Finnhub API for stock data (public endpoint, demo key)
                const apiKey = "c34391qad3i8edlcgrgg" // Finnhub demo key
                let stockPrice = null
                let conversion = 1
                // Determine symbol with exchange prefix if needed
                let symbol = ticker.toUpperCase()
                if (symbol.includes("NASDAQ")) symbol = `${ticker.toUpperCase()}`
                else if (symbol.includes("NYSE")) symbol = `${ticker.toUpperCase()}`
                else if (symbol.includes("LSE")) symbol = `${ticker.toUpperCase()}.L` // e.g. VOD.L
                else if (symbol.includes("JPX")) symbol = `${ticker.toUpperCase()}.T` // e.g. 7203.T
                else if (symbol.includes("SSE")) symbol = `${ticker.toUpperCase()}.SS` // e.g. 600519.SS
                // Always get USD price
                const res = await fetch(
                    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
                )
                if (!res.ok) throw new Error("Not found")
                const data = await res.json()
                if (ignore) return
                const usdPrice = data.c
                if (typeof usdPrice !== "number" || isNaN(usdPrice)) {
                    setPrice(null)
                    setCompanyName(ticker.toUpperCase())
                    if (!ignore) setLoading(false)
                    return
                }
                stockPrice = usdPrice
                setPrice(typeof stockPrice === "number" && !isNaN(stockPrice) ? stockPrice : null)
                setCompanyName(ticker.toUpperCase())
                // Add change logic
                if (showChange) {
                    let prevClose = data.pc
                    let prevCloseConv = prevClose
                    if (typeof prevClose === "number") {
                        prevCloseConv = prevClose
                    }
                    if (typeof prevCloseConv === "number" && typeof stockPrice === "number") {
                        const diff = stockPrice - prevCloseConv
                        const percent = prevCloseConv !== 0 ? (diff / prevCloseConv) * 100 : null
                        setChange(diff)
                        setChangePercent(percent)
                    } else {
                        setChange(null)
                        setChangePercent(null)
                    }
                } else {
                    setChange(null)
                    setChangePercent(null)
                }
            } catch (error) {
                setPrice(null)
                setCompanyName(ticker.toUpperCase())
                setChange(null)
                setChangePercent(null)
            } finally {
                if (!ignore) setLoading(false)
            }
        }
        fetchData()
        return () => {
            ignore = true
        }
    }, [ticker, showChange])

    // Icon error fallback
    function handleIconError() {
        setIconError(true)
    }

    // Price formatting
    let displayPrice = price
    if (abbreviate && typeof price === "number") {
        displayPrice = abbreviateNumber(price)
    } else if (typeof price === "number") {
        displayPrice = price.toLocaleString(undefined, {
            maximumFractionDigits: 2,
        })
    } else {
        displayPrice = "-"
    }
    const currencySymbol = "$"
    const currencyLabel = "USD"

    // Get stock icon (using a service that provides stock logos)
    const stockIcon = `https://storage.googleapis.com/iex/api/logos/${ticker.toUpperCase()}.png`

    // Layout
    const containerStyle = {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        background: backgroundColor,
        borderRadius,
        padding,
        gap,
        border: border
            ? `${border.borderWidth || 0}px ${border.borderStyle || "solid"} ${border.borderColor || "#EEEEEE"}`
            : undefined,
        ...font,
        color: fontColor,
        minWidth: 0,
        minHeight: 0,
        width: "max-content",
        height: "max-content",
        boxSizing: "border-box",
        overflow: "hidden", // ensure radius is clipped
    }

    const iconStyle = {
        width: iconSize,
        height: iconSize,
        borderRadius: typeof iconRadius === "number" ? iconRadius : iconSize / 2,
        background: iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
    }

    const textStyle = {
        color: fontColor,
        ...font,
        whiteSpace: "nowrap",
        minWidth: 0,
        minHeight: 0,
    }

    // Canvas static preview
    if (RenderTarget.current() === RenderTarget.thumbnail) {
        return (
            <div
                style={{
                    ...containerStyle,
                    width: 180,
                    height: 48,
                    justifyContent: "center",
                }}
            >
                <div style={iconStyle}>
                    <div style={{
                        width: "70%",
                        height: "70%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: iconSize * 0.4,
                    }}>
                        AAPL
                    </div>
                </div>
                <span style={{ ...textStyle, marginLeft: gap }}>
                    AAPL $175.04 USD
                </span>
            </div>
        )
    }

    // Loading placeholder
    if (loading) {
        return (
            <div style={containerStyle}>
                {showIcon && (
                    <div style={iconStyle}>
                        <div style={{
                            width: "70%",
                            height: "70%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: iconSize * 0.4,
                            opacity: 0.5,
                        }}>
                            {ticker.substring(0, 4).toUpperCase()}
                        </div>
                    </div>
                )}
                <span style={{ ...textStyle, opacity: 0.5 }}>
                    Loading price…
                </span>
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            {showIcon && (
                <div style={iconStyle}>
                    {iconError ? (
                        <div style={{
                            width: "70%",
                            height: "70%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: iconSize * 0.4,
                        }}>
                            {ticker.substring(0, 1).toUpperCase()}
                        </div>
                    ) : (
                        <img
                            src={stockIcon}
                            alt={ticker}
                            style={{
                                width: "70%",
                                height: "70%",
                                objectFit: "cover",
                                borderRadius: typeof iconRadius === "number" ? iconRadius : iconSize / 2,
                                overflow: "hidden",
                                display: "block",
                            }}
                            onError={handleIconError}
                        />
                    )}
                </div>
            )}
            <span style={textStyle}>
                {ticker.toUpperCase()} {showSymbol && currencySymbol}
                {displayPrice}
                {showCurrencyLabel && ` ${currencyLabel}`}
                {showChange && typeof change === "number" && typeof changePercent === "number" && (
                    <span style={{
                        marginLeft: 8,
                        color: change > 0 ? changeUpColor : change < 0 ? changeDownColor : fontColor,
                        fontWeight: 500,
                        fontSize: font?.fontSize ? (typeof font.fontSize === "number" ? font.fontSize * 0.9 : font.fontSize) : 16,
                    }}>
                        {change > 0 ? "+" : ""}{change.toFixed(2)} ({changePercent > 0 ? "+" : ""}{changePercent.toFixed(2)}%)
                    </span>
                )}
            </span>
        </div>
    )
}

addPropertyControls(Stocks, {
    ticker: {
        type: ControlType.String,
        title: "Stock Ticker",
        defaultValue: "AAPL",
        placeholder: "e.g. AAPL, MSFT, TSLA",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    fontColor: {
        type: ControlType.Color,
        title: "Font Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
    },
    iconBg: {
        type: ControlType.Color,
        title: "Icon BG",
        defaultValue: "#F5F5F5",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "12px",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 32,
        min: 16,
        max: 64,
    },
    iconRadius: {
        type: ControlType.Number,
        title: "Icon Radius",
        defaultValue: 16,
        min: 0,
        max: 64,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 48,
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: {
            borderColor: "#EEEEEE",
            borderStyle: "solid",
            borderWidth: 0,
        },
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    abbreviate: {
        type: ControlType.Boolean,
        title: "Abbreviate",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    showSymbol: {
        type: ControlType.Boolean,
        title: "Show Symbol",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    showCurrencyLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    showChange: {
        type: ControlType.Boolean,
        title: "Show Change",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    changeUpColor: {
        type: ControlType.Color,
        title: "Change Up Color",
        defaultValue: "#22CC66",
    },
    changeDownColor: {
        type: ControlType.Color,
        title: "Change Down Color",
        defaultValue: "#FF5588",
    },
})
