// Modern Stock Chart Component - Fully functional with interactive chart and time period selection
import { useState, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface StockChartProps {
    stockName: string
    stockSymbol: string
    currentPrice: number
    priceChange: number
    marketCap: string
    volume: string
    logo: {
        src: string
        srcSet?: string
        alt?: string
    }
    backgroundColor: string
    cardBackground: string
    textColor: string
    secondaryTextColor: string
    chartColor: string
    positiveColor: string
    negativeColor: string
    buttonActiveColor: string
    buttonInactiveColor: string
    buttonTextActive: string
    buttonTextInactive: string
    headingFont: any
    bodyFont: any
    buttonFont: any
    style?: CSSProperties
}

/**
 * Modern Stock Chart Component
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function StockChart(props: StockChartProps) {
    const {
        stockName = "NVIDIA",
        stockSymbol = "NVDA",
        currentPrice = 235.74,
        priceChange = 6.44,
        marketCap = "$5.73T",
        volume = "$175.52M",
        logo = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Stock Logo"
        },
        backgroundColor = "#000000",
        cardBackground = "#FFFFFF",
        textColor = "#000000",
        secondaryTextColor = "#666666",
        chartColor = "#0099FF",
        positiveColor = "#00CC66",
        negativeColor = "#FF5588",
        buttonActiveColor = "#F5F5F5",
        buttonInactiveColor = "transparent",
        buttonTextActive = "#000000",
        buttonTextInactive = "#999999",
        headingFont,
        bodyFont,
        buttonFont,
    } = props

    const [selectedPeriod, setSelectedPeriod] = useState("1M")

    // Generate chart data based on selected period
    const chartData = useMemo(() => {
        const periods = {
            "1D": 24,
            "7D": 7,
            "1M": 30,
            "1Y": 12,
            "5Y": 60,
        }
        const points = periods[selectedPeriod] || 30

        // Generate realistic stock data
        const data = []
        let value = currentPrice * 0.7
        for (let i = 0; i < points; i++) {
            const change = (Math.random() - 0.45) * (currentPrice * 0.05)
            value = Math.max(value + change, currentPrice * 0.5)
            data.push(value)
        }
        // Ensure last value trends toward current price
        data[data.length - 1] = currentPrice
        return data
    }, [selectedPeriod, currentPrice])

    // Calculate SVG path for chart
    const chartPath = useMemo(() => {
        if (chartData.length === 0) return ""

        const width = 340
        const height = 180
        const padding = 10

        const minValue = Math.min(...chartData)
        const maxValue = Math.max(...chartData)
        const valueRange = maxValue - minValue || 1

        const xStep = (width - padding * 2) / (chartData.length - 1)

        let path = ""
        chartData.forEach((value, index) => {
            const x = padding + index * xStep
            const y = height - padding - ((value - minValue) / valueRange) * (height - padding * 2)

            if (index === 0) {
                path += `M ${x} ${y}`
            } else {
                path += ` L ${x} ${y}`
            }
        })

        return path
    }, [chartData])

    const periods = ["1D", "7D", "1M", "1Y", "5Y"]
    const isPositive = priceChange >= 0

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    backgroundColor: cardBackground,
                    borderRadius: "24px",
                    padding: "24px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "20px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "12px",
                                overflow: "hidden",
                                backgroundColor: "#F5F5F5",
                            }}
                        >
                            <img
                                {...logo}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                        <div>
                            <div
                                style={{
                                    color: textColor,
                                    ...headingFont,
                                }}
                            >
                                {stockName}
                            </div>
                            <div
                                style={{
                                    color: secondaryTextColor,
                                    ...bodyFont,
                                    fontSize: "13px",
                                }}
                            >
                                {stockSymbol}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div
                            style={{
                                color: textColor,
                                ...headingFont,
                            }}
                        >
                            ${currentPrice.toFixed(2)}
                        </div>
                        <div
                            style={{
                                color: isPositive ? positiveColor : negativeColor,
                                ...bodyFont,
                                fontSize: "13px",
                            }}
                        >
                            {isPositive ? "+" : ""}
                            {priceChange.toFixed(2)}%
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div
                    style={{
                        width: "100%",
                        height: "180px",
                        marginBottom: "20px",
                        position: "relative",
                    }}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 340 180"
                        preserveAspectRatio="none"
                        style={{ overflow: "visible" }}
                    >
                        <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={chartColor} stopOpacity="0.2" />
                                <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* Gradient fill */}
                        <path
                            d={`${chartPath} L 340 180 L 10 180 Z`}
                            fill="url(#chartGradient)"
                        />
                        {/* Line */}
                        <path
                            d={chartPath}
                            fill="none"
                            stroke={chartColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {/* Time Period Buttons */}
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "20px",
                        justifyContent: "space-between",
                    }}
                >
                    {periods.map((period) => {
                        const isActive = selectedPeriod === period
                        return (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: isActive ? buttonActiveColor : buttonInactiveColor,
                                    color: isActive ? buttonTextActive : buttonTextInactive,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    ...buttonFont,
                                }}
                            >
                                {period}
                            </button>
                        )
                    })}
                </div>

                {/* Stats */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                color: secondaryTextColor,
                                marginBottom: "4px",
                                ...bodyFont,
                                fontSize: "12px",
                            }}
                        >
                            Market Cap
                        </div>
                        <div
                            style={{
                                color: textColor,
                                ...headingFont,
                                fontSize: "15px",
                            }}
                        >
                            {marketCap}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                color: secondaryTextColor,
                                marginBottom: "4px",
                                ...bodyFont,
                                fontSize: "12px",
                            }}
                        >
                            Vol [24h]
                        </div>
                        <div
                            style={{
                                color: textColor,
                                ...headingFont,
                                fontSize: "15px",
                            }}
                        >
                            {volume}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                color: secondaryTextColor,
                                marginBottom: "4px",
                                ...bodyFont,
                                fontSize: "12px",
                            }}
                        >
                            Date
                        </div>
                        <div
                            style={{
                                color: textColor,
                                ...headingFont,
                                fontSize: "15px",
                            }}
                        >
                            Today
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(StockChart, {
    stockName: {
        type: ControlType.String,
        title: "Stock Name",
        defaultValue: "NVIDIA",
    },
    stockSymbol: {
        type: ControlType.String,
        title: "Symbol",
        defaultValue: "NVDA",
    },
    currentPrice: {
        type: ControlType.Number,
        title: "Current Price",
        defaultValue: 235.74,
        min: 0,
        step: 0.01,
    },
    priceChange: {
        type: ControlType.Number,
        title: "Price Change %",
        defaultValue: 6.44,
        step: 0.01,
    },
    marketCap: {
        type: ControlType.String,
        title: "Market Cap",
        defaultValue: "$5.73T",
    },
    volume: {
        type: ControlType.String,
        title: "Volume 24h",
        defaultValue: "$175.52M",
    },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        defaultValue: "#666666",
    },
    chartColor: {
        type: ControlType.Color,
        title: "Chart Color",
        defaultValue: "#0099FF",
    },
    positiveColor: {
        type: ControlType.Color,
        title: "Positive Color",
        defaultValue: "#00CC66",
    },
    negativeColor: {
        type: ControlType.Color,
        title: "Negative Color",
        defaultValue: "#FF5588",
    },
    buttonActiveColor: {
        type: ControlType.Color,
        title: "Active Button",
        defaultValue: "#F5F5F5",
    },
    buttonInactiveColor: {
        type: ControlType.Color,
        title: "Inactive Button",
        defaultValue: "transparent",
    },
    buttonTextActive: {
        type: ControlType.Color,
        title: "Active Button Text",
        defaultValue: "#000000",
    },
    buttonTextInactive: {
        type: ControlType.Color,
        title: "Inactive Button Text",
        defaultValue: "#999999",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
