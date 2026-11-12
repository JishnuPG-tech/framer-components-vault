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


const COINS = [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
    { id: "ethereum", symbol: "ETH", name: "Ethereum" },
    { id: "solana", symbol: "SOL", name: "Solana" },
    { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
    { id: "cardano", symbol: "ADA", name: "Cardano" },
]
const CURRENCIES = [
    { code: "usd", symbol: "$" },
    { code: "eur", symbol: "€" },
    { code: "cad", symbol: "CA$" },
    { code: "gbp", symbol: "£" },
    { code: "jpy", symbol: "¥" },
]
const DEFAULT_ICON = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"

function getCoinBySymbol(symbol) {
    return COINS.find(c => c.symbol.toLowerCase() === symbol.toLowerCase())
}
function getCurrencySymbol(code) {
    const c = CURRENCIES.find(c => c.code === code)
    return c ? c.symbol : "$"
}
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
 * CryptoPrice
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
function CryptoPrice(props) {
    const {
        coin,
        customTicker,
        currency,
        font,
        fontColor,
        backgroundColor,
        borderRadius,
        iconBg,
        padding,
        iconSize,
        gap,
        border,
        showIcon,
        abbreviate,
        showSymbol,
        showCurrencyLabel,
    } = props

    // Coin selection logic
    let coinId = coin
    let coinSymbol = COINS.find(c => c.id === coin)?.symbol || "BTC"
    let coinName = COINS.find(c => c.id === coin)?.name || "Bitcoin"
    if (coin === "custom" && customTicker) {
        const found = getCoinBySymbol(customTicker)
        if (found) {
            coinId = found.id
            coinSymbol = found.symbol
            coinName = found.name
        } else {
            coinId = customTicker.toLowerCase()
            coinSymbol = customTicker.toUpperCase()
            coinName = customTicker.toUpperCase()
        }
    }

    // State for price and icon
    const [price, setPrice] = React.useState(null)
    const [icon, setIcon] = React.useState(null)
    const [iconError, setIconError] = React.useState(false)
    const isOnCanvas = useIsOnFramerCanvas()

    // Bitcoin icon for placeholder
    const BITCOIN_ICON = "https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
    // Loading state
    const [loading, setLoading] = React.useState(true)

    // Fetch price and icon
    React.useEffect(() => {
        if (!coinId || !currency) return
        let ignore = false
        setLoading(true)
        async function fetchData() {
            try {
                const res = await fetch(
                    `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
                )
                if (!res.ok) throw new Error("Not found")
                const data = await res.json()
                if (ignore) return
                setIcon(data.image?.small || DEFAULT_ICON)
                setPrice(data.market_data?.current_price?.[currency] ?? null)
            } catch {
                setIcon(DEFAULT_ICON)
                setPrice(null)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
        return () => { ignore = true }
    }, [coinId, currency])

    // Icon error fallback
    function handleIconError() {
        setIconError(true)
    }

    // Price formatting
    let displayPrice = price
    if (abbreviate && typeof price === "number") {
        displayPrice = abbreviateNumber(price)
    } else if (typeof price === "number") {
        displayPrice = price.toLocaleString(undefined, { maximumFractionDigits: 8 })
    } else {
        displayPrice = "-"
    }
    const currencySymbol = getCurrencySymbol(currency)
    const currencyLabel = currency.toUpperCase()

    // Layout
    const containerStyle = {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        background: backgroundColor,
        borderRadius,
        padding,
        gap,
        border: border ? `${border.borderWidth || 0}px ${border.borderStyle || "solid"} ${border.borderColor || "#EEEEEE"}` : undefined,
        ...font,
        color: fontColor,
        minWidth: 0,
        minHeight: 0,
        width: "max-content",
        height: "max-content",
        boxSizing: "border-box",
        ...borderSideStyles(border),
    }
    const iconStyle = {
        width: iconSize,
        height: iconSize,
        borderRadius: "50%",
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
    // Border per-side
    function borderSideStyles(border) {
        if (!border) return {}
        const s = {}
        if (border.borderTopWidth !== undefined) s.borderTop = `${border.borderTopWidth}px ${border.borderStyle || "solid"} ${border.borderColor || "#EEEEEE"}`
        if (border.borderRightWidth !== undefined) s.borderRight = `${border.borderRightWidth}px ${border.borderStyle || "solid"} ${border.borderColor || "#EEEEEE"}`
        if (border.borderBottomWidth !== undefined) s.borderBottom = `${border.borderBottomWidth}px ${border.borderStyle || "solid"} ${border.borderColor || "#EEEEEE"}`
        if (border.borderLeftWidth !== undefined) s.borderLeft = `${border.borderLeftWidth}px ${border.borderStyle || "solid"} ${border.borderColor || "#EEEEEE"}`
        return s
    }

    // Canvas static preview
    if (RenderTarget.current() === RenderTarget.thumbnail) {
        return (
            <div style={{ ...containerStyle, width: 180, height: 48, justifyContent: "center" }}>
                <div style={iconStyle}>
                    <img src={DEFAULT_ICON} alt="icon" style={{ width: "70%", height: "70%" }} />
                </div>
                <span style={{ ...textStyle, marginLeft: gap }}>BTC $42,000 USD</span>
            </div>
        )
    }

    // Loading placeholder
    if (loading) {
        return (
            <div style={containerStyle}>
                {showIcon && (
                    <div style={iconStyle}>
                        <img
                            src={BITCOIN_ICON}
                            alt="BTC"
                            style={{ width: "70%", height: "70%", objectFit: "contain", filter: "grayscale(0.2) opacity(0.7)" }}
                        />
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
                    <img
                        src={iconError ? DEFAULT_ICON : icon || DEFAULT_ICON}
                        alt={coinSymbol}
                        style={{ width: "70%", height: "70%", objectFit: "contain" }}
                        onError={handleIconError}
                    />
                </div>
            )}
            <span style={textStyle}>
                {showSymbol && currencySymbol}
                {displayPrice}
                {showCurrencyLabel && ` ${currencyLabel}`}
            </span>
        </div>
    )
}

addPropertyControls(CryptoPrice, {
    coin: {
        type: ControlType.Enum,
        title: "Coin",
        options: ["bitcoin", "ethereum", "solana", "dogecoin", "cardano", "custom"],
        optionTitles: ["Bitcoin", "Ethereum", "Solana", "Dogecoin", "Cardano", "Custom"],
        defaultValue: "bitcoin",
    },
    customTicker: {
        type: ControlType.String,
        title: "Custom Ticker",
        placeholder: "e.g. SHIB",
        hidden: props => props.coin !== "custom",
        defaultValue: "",
    },
    currency: {
        type: ControlType.Enum,
        title: "Currency",
        options: ["usd", "eur", "cad", "gbp", "jpy"],
        optionTitles: ["USD", "EUR", "CAD", "GBP", "JPY"],
        defaultValue: "usd",
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
})

export default CryptoPrice
