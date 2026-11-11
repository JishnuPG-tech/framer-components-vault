// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useId,
    type CSSProperties,
} from "react"

// Mock rates for preview/fallback
const mockRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.25,
    AUD: 1.53,
    CAD: 1.35,
    CHF: 0.88,
    CNY: 7.19,
    HKD: 7.82,
    NZD: 1.63,
    BTC: 0.000015,
    ETH: 0.0003,
    USDT: 1,
    BNB: 0.0017,
    SOL: 0.007,
}

/**
 * Premium Currency Exchange
 *
 * A premium, Apple-style currency converter with real-time rates.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CurrencyExchange(props) {
    const {
        defaultFromCurrency,
        defaultToCurrency,
        accentColor,
        backgroundColor,
        textColor,
        secondaryTextColor,
        borderRadius,
        font,
        apiKey,
        showCrypto = true,
        logoIcon,
        swapIcon,
        enableLiquidEffect = false,
        blur = 20,
        showChart = true,
    } = props

    const [amount, setAmount] = useState("1000")
    const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency)
    const [toCurrency, setToCurrency] = useState(defaultToCurrency)
    const [rate, setRate] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [isSwapping, setIsSwapping] = useState(false)
    const [historyData, setHistoryData] = useState<number[]>([])
    const [timeRange, setTimeRange] = useState("1D")

    const isStatic = useIsStaticRenderer()

    const fetchRate = useCallback(async () => {
        if (isStatic) {
            // Use mock data in canvas
            const fromRate = mockRates[fromCurrency] || 1
            const toRate = mockRates[toCurrency] || 1
            setRate(toRate / fromRate)
            setLastUpdated(new Date())
            return
        }

        setLoading(true)
        try {
            // Using Coinbase API for better crypto support and realtime rates
            const response = await fetch(
                `https://api.coinbase.com/v2/exchange-rates?currency=${fromCurrency}`
            )
            const data = await response.json()
            const newRate = parseFloat(data.data.rates[toCurrency])

            setRate(newRate)
            setLastUpdated(new Date())
            setLoading(false)
        } catch (error) {
            console.error("Failed to fetch rates:", error)
            // Fallback to mock calculation on error
            const fromRate = mockRates[fromCurrency] || 1
            const toRate = mockRates[toCurrency] || 1
            setRate(toRate / fromRate)
            setLoading(false)
        }
    }, [fromCurrency, toCurrency, isStatic])

    useEffect(() => {
        if (!rate) return

        // Generate realistic-looking history data ending at current rate
        const points: number[] = []
        let current = rate

        // Adjust volatility and points based on timeRange
        let volatility = 0.005
        let pointsCount = 20

        switch (timeRange) {
            case "1H":
                volatility = 0.002
                pointsCount = 12
                break
            case "1D":
                volatility = 0.005
                pointsCount = 24
                break
            case "1W":
                volatility = 0.01
                pointsCount = 30
                break
            case "1M":
                volatility = 0.02
                pointsCount = 40
                break
            case "1Y":
                volatility = 0.05
                pointsCount = 50
                break
        }

        for (let i = 0; i < pointsCount; i++) {
            points.unshift(current)
            // Random walk backwards
            const change = 1 + (Math.random() * volatility * 2 - volatility)
            current = current * change
        }
        setHistoryData(points)
    }, [rate, timeRange])

    useEffect(() => {
        fetchRate()
        // Refresh every minute
        const interval = setInterval(fetchRate, 60000)
        return () => clearInterval(interval)
    }, [fetchRate])

    const handleSwap = () => {
        setIsSwapping(true)
        setFromCurrency(toCurrency)
        setToCurrency(fromCurrency)
        setTimeout(() => setIsSwapping(false), 500)
    }

    const convertedAmount = useMemo(() => {
        if (!rate || !amount) return "0.00"
        const val = parseFloat(amount)
        return isNaN(val) ? "0.00" : (val * rate).toFixed(2)
    }, [amount, rate])

    const formatCurrency = (val: string, currency: string) => {
        const num = parseFloat(val)
        if (isNaN(num)) return val
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num)
    }

    // Apple-style glass effect
    const glassStyle: CSSProperties = {
        background: enableLiquidEffect
            ? `linear-gradient(135deg, ${backgroundColor}, rgba(255, 255, 255, 0.05))`
            : backgroundColor,
        backdropFilter: enableLiquidEffect ? `blur(${blur}px) saturate(150%)` : `blur(${blur}px)`,
        WebkitBackdropFilter: enableLiquidEffect
            ? `blur(${blur}px) saturate(150%)`
            : `blur(${blur}px)`,
        borderRadius: borderRadius,
        border: enableLiquidEffect
            ? "1px solid rgba(255,255,255,0.3)"
            : "1px solid rgba(255,255,255,0.1)",
        boxShadow: enableLiquidEffect
            ? "0 30px 60px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 20px 40px rgba(255,255,255,0.1)"
            : "0 20px 40px rgba(0,0,0,0.1)",
        color: textColor,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        height: "100%",
        width: "100%",
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        ...font,
    }

    const inputGroupStyle: CSSProperties = {
        background: "rgba(120, 120, 128, 0.08)",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "background 0.2s ease",
    }

    return (
        <div style={glassStyle}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {logoIcon?.src && (
                        <img
                            src={logoIcon.src}
                            srcSet={logoIcon.srcSet}
                            alt={logoIcon.alt || ""}
                            style={{
                                width: 28,
                                height: 28,
                                objectFit: "contain",
                            }}
                        />
                    )}
                    <span
                        style={{
                            fontSize: 20,
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Exchange
                    </span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(120, 120, 128, 0.15)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchRate}
                    style={{
                        background: "rgba(120, 120, 128, 0.08)",
                        border: "none",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: secondaryTextColor,
                    }}
                >
                    <RefreshIcon spinning={loading} />
                </motion.button>
            </div>

            {/* From Section */}
            <div style={inputGroupStyle}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 13,
                            color: secondaryTextColor,
                            fontWeight: 500,
                        }}
                    >
                        You pay
                    </span>
                    <CurrencySelector
                        value={fromCurrency}
                        onChange={setFromCurrency}
                        textColor={textColor}
                        showCrypto={showCrypto}
                    />
                </div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                        background: "transparent",
                        border: "none",
                        fontSize: 34,
                        fontWeight: 600,
                        color: textColor,
                        width: "100%",
                        outline: "none",
                        padding: 0,
                        margin: 0,
                        fontFamily: "inherit",
                        lineHeight: 1.2,
                    }}
                    placeholder="0"
                />
            </div>

            {/* Swap Button */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "-12px 0",
                    zIndex: 10,
                }}
            >
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ rotate: isSwapping ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={handleSwap}
                    style={{
                        background: backgroundColor,
                        border: "4px solid " + backgroundColor, // Fake border for spacing
                        borderRadius: "50%",
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        color: accentColor,
                    }}
                >
                    {swapIcon?.src ? (
                        <img
                            src={swapIcon.src}
                            srcSet={swapIcon.srcSet}
                            alt={swapIcon.alt || ""}
                            style={{
                                width: 20,
                                height: 20,
                                objectFit: "contain",
                            }}
                        />
                    ) : (
                        <SwapIcon />
                    )}
                </motion.button>
            </div>

            {/* To Section */}
            <div style={inputGroupStyle}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 13,
                            color: secondaryTextColor,
                            fontWeight: 500,
                        }}
                    >
                        You receive
                    </span>
                    <CurrencySelector
                        value={toCurrency}
                        onChange={setToCurrency}
                        textColor={textColor}
                        showCrypto={showCrypto}
                    />
                </div>
                <div
                    style={{
                        fontSize: 34,
                        fontWeight: 600,
                        color: accentColor,
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.2,
                        paddingBottom: 4,
                    }}
                >
                    {loading ? "..." : <AnimatedValue value={convertedAmount} />}
                </div>
            </div>

            {/* Chart */}
            {showChart && historyData.length > 0 && (
                <div
                    style={{
                        width: "100%",
                        marginTop: 16,
                        marginBottom: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: secondaryTextColor,
                            }}
                        >
                            History
                        </span>
                        <TimeRangeSelector
                            value={timeRange}
                            onChange={setTimeRange}
                            textColor={secondaryTextColor}
                            activeColor={accentColor}
                        />
                    </div>
                    <div style={{ height: 60, width: "100%" }}>
                        <Sparkline data={historyData} color={accentColor} />
                    </div>
                </div>
            )}

            {/* Rate Info */}
            <div
                style={{
                    marginTop: "auto",
                    paddingTop: 16,
                    borderTop: "1px solid rgba(120, 120, 128, 0.1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                    color: secondaryTextColor,
                }}
            >
                <span>
                    1 {fromCurrency} = {rate?.toFixed(4)} {toCurrency}
                </span>
                <span>
                    Updated {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                </span>
            </div>
        </div>
    )
}

function CurrencySelector({ value, onChange, textColor, showCrypto }) {
    const currencies = [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD",
        "CHF",
        "CNY",
        "HKD",
        "NZD",
    ]

    if (showCrypto) {
        currencies.push("BTC", "ETH", "USDT", "BNB", "SOL")
    }

    const flags = {
        USD: "🇺🇸",
        EUR: "🇪🇺",
        GBP: "🇬🇧",
        JPY: "🇯🇵",
        AUD: "🇦🇺",
        CAD: "🇨🇦",
        CHF: "🇨🇭",
        CNY: "🇨🇳",
        HKD: "🇭🇰",
        NZD: "🇳🇿",
        BTC: "₿",
        ETH: "Ξ",
        USDT: "₮",
        BNB: "🟡",
        SOL: "◎",
    }

    return (
        <div style={{ position: "relative" }}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    appearance: "none",
                    background: "transparent",
                    border: "none",
                    fontSize: 16,
                    fontWeight: 600,
                    color: textColor,
                    paddingRight: 20,
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "inherit",
                }}
            >
                {currencies.map((c) => (
                    <option key={c} value={c}>
                        {flags[c]} {c}
                    </option>
                ))}
            </select>
            <div
                style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: textColor,
                    opacity: 0.5,
                }}
            >
                <ChevronDown />
            </div>
        </div>
    )
}

// Icons
function SwapIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 10L12 15L17 10" transform="rotate(180 12 12.5)" />
            <path d="M7 10L12 15L17 10" transform="translate(0 -5)" />
        </svg>
    )
}

function ChevronDown() {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    )
}

function RefreshIcon({ spinning }) {
    return (
        <motion.div
            animate={spinning ? { rotate: 360 } : { rotate: 0 }}
            transition={spinning ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
            style={{ display: "flex" }}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
        </motion.div>
    )
}

function AnimatedValue({ value }) {
    const numericValue = parseFloat(value) || 0
    const motionValue = useMotionValue(0)
    const springValue = useSpring(motionValue, { damping: 30, stiffness: 200 })
    const displayValue = useTransform(springValue, (latest: number) =>
        latest.toFixed(2)
    )

    useEffect(() => {
        motionValue.set(numericValue)
    }, [numericValue])

    return <motion.span>{displayValue}</motion.span>
}

function TimeRangeSelector({ value, onChange, textColor, activeColor }) {
    const ranges = ["1H", "1D", "1W", "1M", "1Y"]
    return (
        <div
            style={{
                display: "flex",
                background: "rgba(120, 120, 128, 0.1)",
                borderRadius: 8,
                padding: 2,
                gap: 2,
            }}
        >
            {ranges.map((range) => {
                const isActive = value === range
                return (
                    <motion.button
                        key={range}
                        onClick={() => onChange(range)}
                        initial={false}
                        animate={{
                            backgroundColor: isActive
                                ? "#FFFFFF"
                                : "transparent",
                            color: isActive ? activeColor : textColor,
                            boxShadow: isActive
                                ? "0 2px 4px rgba(0,0,0,0.08)"
                                : "none",
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            minWidth: 32,
                            textAlign: "center",
                            fontFamily: "inherit",
                        }}
                    >
                        {range}
                    </motion.button>
                )
            })}
        </div>
    )
}

function Sparkline({ data, color }) {
    const uniqueId = useId()
    const gradientId = `chartGradient-${uniqueId.replace(/:/g, "")}`

    if (!data || data.length < 2) return null

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    // Normalize data to 0-100 range for SVG path
    const points = data
        .map((val, i) => {
            const x = (i / (data.length - 1)) * 100
            const y = 100 - ((val - min) / range) * 100
            return `${x},${y}`
        })
        .join(" ")

    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ overflow: "visible" }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={`M 0,100 L ${points} L 100,100 Z`}
                fill={`url(#${gradientId})`}
                stroke="none"
            />
            <path
                d={`M ${points}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

addPropertyControls(CurrencyExchange, {
    enableLiquidEffect: {
        type: ControlType.Boolean,
        title: "Liquid Glass",
        defaultValue: false,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 20,
        min: 0,
        max: 100,
        unit: "px",
    },
    logoIcon: {
        type: ControlType.ResponsiveImage,
        title: "Logo Icon",
    },
    swapIcon: {
        type: ControlType.ResponsiveImage,
        title: "Swap Icon",
    },
    showChart: {
        type: ControlType.Boolean,
        title: "Show Chart",
        defaultValue: true,
    },
    showCrypto: {
        type: ControlType.Boolean,
        title: "Show Crypto",
        defaultValue: true,
    },
    defaultFromCurrency: {
        type: ControlType.Enum,
        title: "From",
        defaultValue: "USD",
        options: [
            "USD",
            "EUR",
            "GBP",
            "JPY",
            "AUD",
            "CAD",
            "CHF",
            "CNY",
            "HKD",
            "NZD",
            "BTC",
            "ETH",
            "USDT",
            "BNB",
            "SOL",
        ],
    },
    defaultToCurrency: {
        type: ControlType.Enum,
        title: "To",
        defaultValue: "EUR",
        options: [
            "USD",
            "EUR",
            "GBP",
            "JPY",
            "AUD",
            "CAD",
            "CHF",
            "CNY",
            "HKD",
            "NZD",
            "BTC",
            "ETH",
            "USDT",
            "BNB",
            "SOL",
        ],
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#007AFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(255, 255, 255, 0.8)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary",
        defaultValue: "rgba(60, 60, 67, 0.6)",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 40,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
        },
    },
})