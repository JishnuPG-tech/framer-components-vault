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


/* -----------------------------------------------------------
   TIMEFRAME OPTIONS
----------------------------------------------------------- */
type RangeId = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y"

interface RangeOption {
    id: RangeId
    label: string
    interval: string
    limit: number
}

const RANGE_OPTIONS: RangeOption[] = [
    { id: "1D", label: "1D", interval: "5m", limit: 288 },
    { id: "5D", label: "5D", interval: "30m", limit: 240 },
    { id: "1M", label: "1M", interval: "4h", limit: 180 },
    { id: "3M", label: "3M", interval: "12h", limit: 180 },
    { id: "6M", label: "6M", interval: "1d", limit: 180 },
    { id: "1Y", label: "1Y", interval: "1d", limit: 365 },
]

/* -----------------------------------------------------------
   MAJOR CRYPTO LIST (60 PAIRS)
----------------------------------------------------------- */
const CRYPTO_OPTIONS = [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "ADAUSDT",
    "DOGEUSDT",
    "AVAXUSDT",
    "MATICUSDT",
    "DOTUSDT",
    "LTCUSDT",
    "LINKUSDT",
    "ATOMUSDT",
    "FILUSDT",
    "APTUSDT",
    "ARBUSDT",
    "OPUSDT",
    "NEARUSDT",
    "SUIUSDT",
    "INJUSDT",
    "RNDRUSDT",
    "ARUSDT",
    "SEIUSDT",
    "RPLUSDT",
    "FTMUSDT",
    "GALAUSDT",
    "ALGOUSDT",
    "AAVEUSDT",
    "FLOWUSDT",
    "HBARUSDT",
    "EGLDUSDT",
    "VETUSDT",
    "EUSDT",
    "CRVUSDT",
    "IMXUSDT",
    "DYDXUSDT",
    "MKRUSDT",
    "KASUSDT",
    "AXSUSDT",
    "PENDLEUSDT",
    "PYTHUSDT",
    "TIAUSDT",
    "WIFUSDT",
    "PEPEUSDT",
    "SHIBUSDT",
    "FLOKIUSDT",
    "BONKUSDT",
    "CHZUSDT",
    "THETAUSDT",
    "GRTUSDT",
    "SANDUSDT",
    "MANAUSDT",
    "XLMUSDT",
    "XMRUSDT",
    "ETCUSDT",
    "KAVAUSDT",
    "LDOUSDT",
    "QNTUSDT",
] as const

type CryptoPair = (typeof CRYPTO_OPTIONS)[number]

/* Display names for UI */
const CRYPTO_NAMES: Partial<Record<CryptoPair, string>> = {
    BTCUSDT: "Bitcoin (BTC)",
    ETHUSDT: "Ethereum (ETH)",
    SOLUSDT: "Solana (SOL)",
    BNBUSDT: "BNB",
    XRPUSDT: "XRP",
    ADAUSDT: "Cardano (ADA)",
    DOGEUSDT: "Dogecoin (DOGE)",
    AVAXUSDT: "Avalanche (AVAX)",
    MATICUSDT: "Polygon (MATIC)",
    DOTUSDT: "Polkadot (DOT)",
    LTCUSDT: "Litecoin (LTC)",
    LINKUSDT: "Chainlink (LINK)",
    ATOMUSDT: "Cosmos (ATOM)",
    FILUSDT: "Filecoin (FIL)",
    APTUSDT: "Aptos (APT)",
    ARBUSDT: "Arbitrum (ARB)",
    OPUSDT: "Optimism (OP)",
    NEARUSDT: "Near Protocol (NEAR)",
    SUIUSDT: "Sui (SUI)",
    INJUSDT: "Injective (INJ)",
    RNDRUSDT: "Render (RNDR)",
    ARUSDT: "Arweave (AR)",
    SEIUSDT: "Sei (SEI)",
    FTMUSDT: "Fantom (FTM)",
    AAVEUSDT: "Aave (AAVE)",
    FLOWUSDT: "Flow (FLOW)",
    HBARUSDT: "Hedera (HBAR)",
    EGLDUSDT: "MultiversX (EGLD)",
    VETUSDT: "VeChain (VET)",
    CRVUSDT: "Curve (CRV)",
    IMXUSDT: "Immutable (IMX)",
    DYDXUSDT: "dYdX (DYDX)",
    MKRUSDT: "Maker (MKR)",
    KASUSDT: "Kaspa (KAS)",
    XLMUSDT: "Stellar (XLM)",
    XMRUSDT: "Monero (XMR)",
    ETCUSDT: "Ethereum Classic (ETC)",
    SANDUSDT: "The Sandbox (SAND)",
    MANAUSDT: "Decentraland (MANA)",
    GRTUSDT: "The Graph (GRT)",
    SHIBUSDT: "Shiba Inu (SHIB)",
    PEPEUSDT: "Pepe (PEPE)",
    BONKUSDT: "Bonk (BONK)",
    FLOKIUSDT: "Floki (FLOKI)",
    WIFUSDT: "Dogwifhat (WIF)",
}

/* -----------------------------------------------------------
   UTIL
----------------------------------------------------------- */
function formatNumber(
    value: number | string | null | undefined,
    decimals = 2
): string {
    if (value === null || value === undefined) return "—"
    const num = Number(value)
    if (Number.isNaN(num) || !Number.isFinite(num)) return "—"
    return num.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })
}

function formatPrice(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return "—"
    const num = Number(value)
    if (Number.isNaN(num) || !Number.isFinite(num)) return "—"
    if (Math.abs(num) >= 1000) {
        return num.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }
    if (Math.abs(num) >= 1) {
        return num.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }
    return num.toLocaleString("en-US", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
    })
}

function formatCompact(
    value: number | string | null | undefined,
    decimals = 2
): string {
    if (value === null || value === undefined) return "—"
    const num = Number(value)
    if (Number.isNaN(num) || !Number.isFinite(num)) return "—"
    const abs = Math.abs(num)
    if (abs >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(decimals)}B`
    }
    if (abs >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(decimals)}M`
    }
    if (abs >= 1_000) {
        return `${(num / 1_000).toFixed(decimals)}K`
    }
    return num.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })
}

function getUnits(pair: string) {
    if (pair.endsWith("USDT")) {
        return { base: pair.replace("USDT", ""), quote: "USDT" }
    }
    return { base: "", quote: "" }
}

type ChartType = "line" | "candles"

interface TickerMeta {
    price: number
    change: number
    changePercent: number
    high: number
    low: number
    open: number
    volume: number
    quoteVolume: number
    closeTime: number
    name: string
    currency: string
}

interface Binance24hTicker {
    lastPrice: string
    priceChange: string
    priceChangePercent: string
    highPrice: string
    lowPrice: string
    openPrice: string
    volume: string
    quoteVolume: string
    closeTime: number
}

type BinanceKline = [
    number,
    string,
    string,
    string,
    string,
    string,
    ...string[],
]

interface KlinePoint {
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
    quoteVolume: number
}

interface CryptoPriceChartProps {
    cryptoPair: CryptoPair
    themeMode: "Light" | "Dark"
    initialRange: RangeId
    borderRadius: number
    showShadow: boolean
    accentUpColor: string
    accentDownColor: string
    lightBackground: string
    darkBackground: string
    lightTextColor: string
    darkTextColor: string
    chartHeight: number
    showCurrency: boolean
    showCryptoName: boolean
    autoRefreshMinutes: number
    defaultChartType: ChartType
    showChartToggle: boolean
    showStats: boolean
    font: any
}

/* -----------------------------------------------------------
   CRYPTO COMPONENT
----------------------------------------------------------- */
export default function CryptoPriceChart(props: CryptoPriceChartProps) {
    const {
        cryptoPair,
        themeMode,
        initialRange,
        borderRadius,
        showShadow,
        accentUpColor,
        accentDownColor,
        lightBackground,
        darkBackground,
        lightTextColor,
        darkTextColor,
        chartHeight,
        showCurrency,
        showCryptoName,
        autoRefreshMinutes,
        defaultChartType, // Keeping for internal initial state, exposed as 'defaultChartType' in property controls
        showChartToggle: isChartToggleVisible,
        showStats: isStatsVisible,
        font,
    } = props

    const [meta, setMeta] = React.useState<TickerMeta | null>(null)
    const [points, setPoints] = React.useState<KlinePoint[]>([])
    const [loadingChart, setLoadingChart] = React.useState<boolean>(true)
    const [loadingTicker, setLoadingTicker] = React.useState<boolean>(true)
    const [tickerError, setTickerError] = React.useState<string | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [selectedRangeId, setSelectedRangeId] =
        React.useState<RangeId>(initialRange)
    const [lastUpdated, setLastUpdated] = React.useState<number | null>(null)
    const [chartType, setChartType] =
        React.useState<ChartType>(defaultChartType)
    const [hoverData, setHoverData] = React.useState<KlinePoint | null>(null)
    const [viewport, setViewport] = React.useState<{
        start: number
        end: number
    }>({
        start: 0,
        end: 0,
    })
    const [isDragging, setIsDragging] = React.useState(false)
    const dragRef = React.useRef<{
        startX: number
        startRange: { start: number; end: number }
    } | null>(null)

    const isDark = themeMode === "Dark"
    const bg = isDark ? darkBackground : lightBackground
    const text = isDark ? darkTextColor : lightTextColor

    const selectedRange = React.useMemo(
        () =>
            RANGE_OPTIONS.find((r) => r.id === selectedRangeId) ||
            RANGE_OPTIONS[0],
        [selectedRangeId]
    )

    // Reset viewport when data changes (e.g. new range or pair)
    React.useEffect(() => {
        if (points.length > 0) {
            setViewport({ start: 0, end: points.length })
        }
    }, [points])

    React.useEffect(() => {
        setChartType(defaultChartType)
    }, [defaultChartType])

    /* -----------------------------------------------------------
       DATA FETCHING
----------------------------------------------------------- */
    React.useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller

        const fetchData = async () => {
            try {
                setLoadingTicker(true)
                setLoadingChart(true)
                setError(null)
                setTickerError(null)

                const { interval, limit } = selectedRange
                const tickerUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${cryptoPair}`
                const klineUrl = `https://api.binance.com/api/v3/klines?symbol=${cryptoPair}&interval=${interval}&limit=${limit}`

                // Parallel fetch
                const [tickerRes, klineRes] = await Promise.all([
                    fetch(tickerUrl, { signal }),
                    fetch(klineUrl, { signal }),
                ])

                if (!tickerRes.ok) throw new Error("Ticker failed")
                if (!klineRes.ok) throw new Error("Chart data failed")

                const tickerData = (await tickerRes.json()) as Binance24hTicker
                const klineData = (await klineRes.json()) as BinanceKline[]

                if (!signal.aborted) {
                    // Process Ticker
                    setMeta({
                        price: Number(tickerData.lastPrice),
                        change: Number(tickerData.priceChange),
                        changePercent: Number(tickerData.priceChangePercent),
                        high: Number(tickerData.highPrice),
                        low: Number(tickerData.lowPrice),
                        open: Number(tickerData.openPrice),
                        volume: Number(tickerData.volume),
                        quoteVolume: Number(tickerData.quoteVolume),
                        closeTime: Number(tickerData.closeTime),
                        name: CRYPTO_NAMES[cryptoPair] ?? cryptoPair,
                        currency: "USDT",
                    })

                    // Process Chart
                    const pts: KlinePoint[] = klineData.map((d) => ({
                        time: d[0],
                        open: Number(d[1]),
                        high: Number(d[2]),
                        low: Number(d[3]),
                        close: Number(d[4]),
                        volume: Number(d[5]),
                        quoteVolume: Number(d[7]),
                    }))
                    setPoints(pts)
                    setLastUpdated(Date.now())
                }
            } catch (err: any) {
                if (signal.aborted) return
                // console.error(err)
                setError("Failed to load data")
                setTickerError("Failed to load ticker")
            } finally {
                if (!signal.aborted) {
                    setLoadingTicker(false)
                    setLoadingChart(false)
                }
            }
        }

        fetchData()

        let intervalId: any = null
        if (autoRefreshMinutes > 0) {
            intervalId = setInterval(fetchData, autoRefreshMinutes * 60 * 1000)
        }

        return () => {
            controller.abort()
            if (intervalId) clearInterval(intervalId)
        }
    }, [cryptoPair, selectedRangeId, autoRefreshMinutes])

    /* -----------------------------------------------------------
       DERIVED DATA
    ----------------------------------------------------------- */
    const visiblePoints = React.useMemo(() => {
        if (!points.length) return []
        const { start, end } = viewport
        // Ensure visible slice has at least 2 points for line chart logic
        // and clamp to bounds
        const s = Math.max(0, Math.min(start, points.length - 2))
        const e = Math.min(points.length, Math.max(s + 2, end))
        return points.slice(s, e)
    }, [points, viewport])

    /* -----------------------------------------------------------
       HANDLERS & MEMOIZED HELPERS
    ----------------------------------------------------------- */
    const onSelectRange = React.useCallback((id: RangeId) => {
        setSelectedRangeId(id)
    }, [])

    const handleWheel = React.useCallback(
        (e: React.WheelEvent) => {
            if (!points.length) return
            // Prevent default page scroll when zooming
            // e.preventDefault() // React synthetic event might need passive:false in container

            const ZOOM_SPEED = 0.2
            const direction = e.deltaY > 0 ? 1 : -1 // 1 = zoom out, -1 = zoom in
            const currentLength = viewport.end - viewport.start
            const zoomAmount = Math.max(
                1,
                Math.floor(currentLength * ZOOM_SPEED)
            )
            const delta = zoomAmount * direction

            // Calculate cursor position ratio for anchor
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const ratio = Math.max(0, Math.min(1, x / rect.width))

            let newStart = viewport.start - Math.floor(delta * ratio)
            let newEnd = viewport.end + Math.ceil(delta * (1 - ratio))

            // Constraints
            const MIN_ITEMS = 5
            if (newEnd - newStart < MIN_ITEMS) return // Max zoom in reached

            // Clamp to bounds
            if (newStart < 0) {
                newStart = 0
                newEnd = Math.min(
                    points.length,
                    newStart + currentLength + delta
                )
            }
            if (newEnd > points.length) {
                newEnd = points.length
                newStart = Math.max(0, newEnd - (currentLength + delta))
            }

            setViewport({ start: newStart, end: newEnd })
        },
        [points.length, viewport]
    )

    const handleMouseDown = React.useCallback(
        (e: React.MouseEvent) => {
            if (!points.length) return
            setIsDragging(true)
            dragRef.current = {
                startX: e.clientX,
                startRange: { ...viewport },
            }
        },
        [points.length, viewport]
    )

    const handleMouseMove = React.useCallback(
        (e: React.MouseEvent) => {
            // 1. Handle Dragging (Pan)
            if (isDragging && dragRef.current) {
                const { startX, startRange } = dragRef.current
                const dx = e.clientX - startX
                const rect = e.currentTarget.getBoundingClientRect()
                const rangeSize = startRange.end - startRange.start

                // How many candles fits in the width?
                // dx pixels = (dx / width) * rangeSize candles
                const shift = Math.round(-(dx / rect.width) * rangeSize)

                let newStart = startRange.start + shift
                let newEnd = startRange.end + shift

                // Clamp
                if (newStart < 0) {
                    newStart = 0
                    newEnd = rangeSize
                }
                if (newEnd > points.length) {
                    newEnd = points.length
                    newStart = points.length - rangeSize
                }

                setViewport({ start: newStart, end: newEnd })
                return // Skip hover logic while dragging
            }

            // 2. Handle Hover Tooltip
            if (visiblePoints.length > 0) {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const width = rect.width
                const index = Math.min(
                    visiblePoints.length - 1,
                    Math.max(
                        0,
                        Math.round((x / width) * (visiblePoints.length - 1))
                    )
                )
                setHoverData(visiblePoints[index])
            }
        },
        [isDragging, points.length, visiblePoints]
    )

    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false)
        dragRef.current = null
    }, [])

    const buildPath = React.useCallback(
        (data: KlinePoint[], w: number, h: number): string => {
            if (data.length < 2) return ""

            const padX = 8
            const padY = 4

            const xs = data.map((p) => p.time)
            const ys = data.map((p) => p.close)

            const minX = Math.min(...xs)
            const maxX = Math.max(...xs)
            const minY = Math.min(...ys)
            const maxY = Math.max(...ys)

            const dw = w - padX * 2
            const dh = h - padY * 2

            const norm = data.map((p) => ({
                x: padX + ((p.time - minX) / (maxX - minX || 1)) * dw,
                y: padY + (1 - (p.close - minY) / (maxY - minY || 1)) * dh,
            }))

            let d = `M ${norm[0].x} ${norm[0].y}`
            for (let i = 1; i < norm.length; i++) {
                d += ` L ${norm[i].x} ${norm[i].y}`
            }
            return d
        },
        []
    )

    const renderCandles = React.useCallback(
        (data: KlinePoint[], w: number, h: number): React.ReactNode => {
            if (!data.length) return null

            const padX = 12
            const padY = 6

            const times = data.map((p) => p.time)
            const highs = data.map((p) => p.high)
            const lows = data.map((p) => p.low)

            const minX = Math.min(...times)
            const maxX = Math.max(...times)
            const minY = Math.min(...lows)
            const maxY = Math.max(...highs)

            const dw = w - padX * 2
            const dh = h - padY * 2
            const total = data.length
            const step = total > 1 ? dw / (total - 1) : dw
            const bodyWidth = Math.max(2, step * 0.6)

            const scaleY = (value: number) =>
                padY + (1 - (value - minY) / (maxY - minY || 1)) * dh

            return data.map((p, index) => {
                const x = padX + ((p.time - minX) / (maxX - minX || 1)) * dw
                const yOpen = scaleY(p.open)
                const yClose = scaleY(p.close)
                const yHigh = scaleY(p.high)
                const yLow = scaleY(p.low)
                const isUp = p.close >= p.open
                const color = isUp ? accentUpColor : accentDownColor
                const bodyTop = Math.min(yOpen, yClose)
                const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1)

                return (
                    <g key={`${p.time}-${index}`}>
                        <line
                            x1={x}
                            x2={x}
                            y1={yHigh}
                            y2={yLow}
                            stroke={color}
                            strokeWidth={1}
                            strokeOpacity={0.8}
                        />
                        <rect
                            x={x - bodyWidth / 2}
                            y={bodyTop}
                            width={bodyWidth}
                            height={bodyHeight || 1}
                            fill={color}
                            fillOpacity={isUp ? 0.6 : 0.35}
                            stroke={color}
                            strokeWidth={1}
                        />
                    </g>
                )
            })
        },
        [accentUpColor, accentDownColor]
    )

    const viewW = 400
    const viewH = chartHeight

    // Calculate Stats from points (if available) or fallback to meta
    const stats = React.useMemo(() => {
        if (!points.length && meta) {
            return {
                high: meta.high,
                low: meta.low,
                volume: meta.volume,
                quoteVolume: meta.quoteVolume,
            }
        }
        if (!points.length) return null

        const highs = points.map((p) => p.high)
        const lows = points.map((p) => p.low)
        const volume = points.reduce((acc, p) => acc + p.volume, 0)
        const quoteVolume = points.reduce((acc, p) => acc + p.quoteVolume, 0)

        return {
            high: Math.max(...highs),
            low: Math.min(...lows),
            volume,
            quoteVolume,
        }
    }, [points, meta])

    const accent = (meta?.change ?? 0) >= 0 ? accentUpColor : accentDownColor

    const lineColor = React.useMemo(() => {
        const latestClose =
            points.length && points[points.length - 1]
                ? points[points.length - 1].close
                : null
        const firstClose = points.length ? points[0].close : null

        if (
            latestClose !== null &&
            firstClose !== null &&
            latestClose < firstClose
        ) {
            return accentDownColor
        }
        return accentUpColor
    }, [points, accentDownColor, accentUpColor])

    /* -----------------------------------------------------------
     Render
----------------------------------------------------------- */
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: bg,
                color: text,
                borderRadius,
                padding: 16,
                ...font,
                boxShadow: showShadow
                    ? isDark
                        ? "0 18px 40px rgba(0,0,0,0.5)"
                        : "0 18px 40px rgba(0,0,0,0.1)"
                    : "none",
                display: "flex",
                flexDirection: "column",
                gap: 14,
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 12,
                            opacity: 0.6,
                            textTransform: "uppercase",
                            letterSpacing: 0.6,
                        }}
                    >
                        {cryptoPair}
                    </div>
                    {showCryptoName && (
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                marginTop: 4,
                            }}
                        >
                            {meta?.name ||
                                CRYPTO_NAMES[cryptoPair] ||
                                cryptoPair}
                        </div>
                    )}
                </div>

                {isChartToggleVisible && (
                    <div
                        style={{
                            display: "flex",
                            gap: 4,
                            background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(15,23,42,0.06)",
                            padding: 4,
                            borderRadius: 999,
                        }}
                    >
                        {[
                            { id: "line" as ChartType, label: "Line" },
                            { id: "candles" as ChartType, label: "Candles" },
                        ].map((option) => {
                            const active = chartType === option.id
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setChartType(option.id)}
                                    style={{
                                        border: "none",
                                        padding: "4px 12px",
                                        borderRadius: 999,
                                        cursor: "pointer",
                                        fontSize: 12,
                                        background: active
                                            ? accent
                                            : "transparent",
                                        color: active ? "#ffffff" : text,
                                        transition:
                                            "background 0.2s ease, color 0.2s ease",
                                    }}
                                >
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* PRICE + CHANGE */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <div style={{ fontSize: 28, fontWeight: 600 }}>
                        {loadingTicker && !meta
                            ? "Loading…"
                            : formatPrice(meta?.price)}
                        {showCurrency && (
                            <span
                                style={{
                                    opacity: 0.7,
                                    marginLeft: 6,
                                    fontSize: 13,
                                }}
                            >
                                {meta?.currency ?? "USDT"}
                            </span>
                        )}
                    </div>
                    {tickerError && (
                        <div
                            style={{
                                fontSize: 12,
                                color: accentDownColor,
                                opacity: 0.8,
                                marginTop: 4,
                            }}
                        >
                            {tickerError}
                        </div>
                    )}
                    {error && (
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.7,
                                color: accentDownColor,
                                marginTop: 4,
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: `${accent}22`,
                        color: accent,
                        fontSize: 12,
                        fontWeight: 500,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    {loadingTicker && !meta ? (
                        "Updating…"
                    ) : meta?.change != null ? (
                        <>
                            {meta.change >= 0 ? "▲" : "▼"}{" "}
                            {formatNumber(meta.change)} (
                            {formatNumber(meta.changePercent)}%)
                        </>
                    ) : (
                        "—"
                    )}
                </div>
            </div>

            {/* STATS */}
            {isStatsVisible && stats && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(110px, 1fr))",
                        gap: 12,
                        background: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(15,23,42,0.05)",
                        padding: 12,
                        borderRadius: 12,
                    }}
                >
                    {[
                        {
                            label: "High",
                            value: formatPrice(stats.high),
                        },
                        {
                            label: "Low",
                            value: formatPrice(stats.low),
                        },
                        {
                            label: `Vol (${getUnits(cryptoPair).base})`,
                            value: formatCompact(stats.volume),
                        },
                        {
                            label: `Vol (${getUnits(cryptoPair).quote})`,
                            value: formatCompact(stats.quoteVolume),
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    opacity: 0.6,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                }}
                            >
                                {item.label}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* CHART */}
            <div
                style={{
                    flexGrow: 1,
                    minHeight: chartHeight,
                    position: "relative",
                    cursor: isDragging ? "grabbing" : "crosshair",
                    userSelect: "none",
                }}
                onMouseLeave={() => {
                    setHoverData(null)
                    handleMouseUp()
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {loadingChart ||
                points.length === 0 ||
                (chartType === "line" && points.length < 2) ? (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            border: isDark
                                ? "1px dashed rgba(255,255,255,0.15)"
                                : "1px dashed rgba(15,23,42,0.15)",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0.7,
                            fontSize: 12,
                        }}
                    >
                        {loadingChart
                            ? "Fetching market data…"
                            : chartType === "line"
                              ? "Not enough data for line chart"
                              : "No data available"}
                    </div>
                ) : (
                    <>
                        <svg
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${viewW} ${viewH}`}
                            preserveAspectRatio="none"
                            style={{ overflow: "visible" }}
                            onMouseMove={(e) => {
                                const rect =
                                    e.currentTarget.getBoundingClientRect()
                                const x = e.clientX - rect.left
                                const width = rect.width
                                const index = Math.min(
                                    points.length - 1,
                                    Math.max(
                                        0,
                                        Math.round(
                                            (x / width) * (points.length - 1)
                                        )
                                    )
                                )
                                setHoverData(points[index])
                            }}
                        >
                            <defs>
                                <linearGradient
                                    id="chartGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={accent}
                                        stopOpacity="0.2"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={accent}
                                        stopOpacity="0"
                                    />
                                </linearGradient>
                            </defs>
                            <line
                                x1={0}
                                y1={viewH - 2}
                                x2={viewW}
                                y2={viewH - 2}
                                stroke={
                                    isDark
                                        ? "rgba(255,255,255,0.1)"
                                        : "rgba(15,23,42,0.1)"
                                }
                            />
                            {chartType === "line" ? (
                                <>
                                    <path
                                        d={`${buildPath(visiblePoints, viewW, viewH)} L ${viewW} ${viewH} L 0 ${viewH} Z`}
                                        fill="url(#chartGradient)"
                                        stroke="none"
                                    />
                                    <path
                                        d={buildPath(
                                            visiblePoints,
                                            viewW,
                                            viewH
                                        )}
                                        fill="none"
                                        stroke={lineColor}
                                        strokeWidth={2.2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </>
                            ) : (
                                renderCandles(visiblePoints, viewW, viewH)
                            )}
                        </svg>

                        {/* TOOLTIP OVERLAY */}
                        {hoverData && (
                            <div
                                style={{
                                    position: "absolute",
                                    pointerEvents: "none",
                                    background: isDark
                                        ? "rgba(20,20,25,0.9)"
                                        : "rgba(255,255,255,0.9)",
                                    border: isDark
                                        ? "1px solid rgba(255,255,255,0.1)"
                                        : "1px solid rgba(0,0,0,0.1)",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    transform: "translate(-50%, -100%)",
                                    marginTop: -10,
                                    whiteSpace: "nowrap",
                                    zIndex: 10,
                                    // Calculate position based on time
                                    left: `${((hoverData.time - Math.min(...visiblePoints.map((p) => p.time))) / (Math.max(...visiblePoints.map((p) => p.time)) - Math.min(...visiblePoints.map((p) => p.time)) || 1)) * 100}%`,
                                    top: "20%",
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>
                                    {formatPrice(hoverData.close)}
                                </div>
                                <div style={{ opacity: 0.6, fontSize: 10 }}>
                                    {new Date(hoverData.time).toLocaleString()}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CONTROLS */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {RANGE_OPTIONS.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => onSelectRange(r.id)}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 12,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 12,
                                background:
                                    r.id === selectedRangeId
                                        ? `${accent}22`
                                        : isDark
                                          ? "rgba(255,255,255,0.06)"
                                          : "rgba(15,23,42,0.06)",
                                color: r.id === selectedRangeId ? accent : text,
                                transition:
                                    "background 0.2s ease, color 0.2s ease",
                            }}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                {lastUpdated && (
                    <div
                        style={{
                            fontSize: 11,
                            opacity: 0.6,
                        }}
                    >
                        Updated{" "}
                        {new Date(lastUpdated).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

/* -----------------------------------------------------------
   DEFAULT PROPS
----------------------------------------------------------- */
CryptoPriceChart.defaultProps = {
    cryptoPair: "BTCUSDT",
    themeMode: "Dark",
    initialRange: "1M",
    borderRadius: 16,
    showShadow: true,
    accentUpColor: "#0099FF",
    accentDownColor: "#ef4444",
    lightBackground: "#ffffff",
    darkBackground: "#050816",
    lightTextColor: "#0f172a",
    darkTextColor: "#e5e7eb",
    chartHeight: 160,
    showCurrency: true,
    showCryptoName: true,
    autoRefreshMinutes: 0,
    defaultChartType: "line",
    showChartToggle: true,
    showStats: true,
    font: {
        fontFamily: "Inter, sans-serif",
        fontSize: 16,
        fontWeight: 400,
    },
}

/* -----------------------------------------------------------
   FRAMER CONTROLS
----------------------------------------------------------- */
addPropertyControls(CryptoPriceChart, {
    // DATA SECTION
    cryptoPair: {
        type: ControlType.Enum,
        title: "Asset",
        options: CRYPTO_OPTIONS,
        optionTitles: CRYPTO_OPTIONS.map((p) => CRYPTO_NAMES[p] ?? p),
        description: "Select the cryptocurrency pair to display.",
    },
    initialRange: {
        type: ControlType.SegmentedEnum,
        title: "Timeframe",
        options: ["1D", "5D", "1M", "3M", "6M", "1Y"],
        description: "Initial time range for the chart.",
    },
    autoRefreshMinutes: {
        type: ControlType.Number,
        title: "Auto Refresh",
        min: 0,
        max: 60,
        step: 1,
        displayStepper: true,
        unit: "min",
        description: "Set to 0 to disable auto-refresh.",
    },

    // APPEARANCE SECTION
    themeMode: {
        type: ControlType.SegmentedEnum,
        title: "Theme",
        options: ["Light", "Dark"],
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: 16,
            fontFamily: "Inter",
        },
        controls: "basic",
    },
    accentUpColor: {
        type: ControlType.Color,
        title: "Up Color",
    },
    accentDownColor: {
        type: ControlType.Color,
        title: "Down Color",
    },
    lightBackground: {
        type: ControlType.Color,
        title: "Light BG",
        hidden: (props) => props.themeMode === "Dark",
    },
    darkBackground: {
        type: ControlType.Color,
        title: "Dark BG",
        hidden: (props) => props.themeMode === "Light",
    },
    lightTextColor: {
        type: ControlType.Color,
        title: "Light Text",
        hidden: (props) => props.themeMode === "Dark",
    },
    darkTextColor: {
        type: ControlType.Color,
        title: "Dark Text",
        hidden: (props) => props.themeMode === "Light",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 50,
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
    },

    // CHART CONFIG
    defaultChartType: {
        type: ControlType.SegmentedEnum,
        title: "Chart Type",
        options: ["line", "candles"],
        optionTitles: ["Line", "Candles"],
    },
    chartHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 50,
        max: 500,
    },

    // LAYOUT & VISIBILITY
    showChartToggle: {
        type: ControlType.Boolean,
        title: "Toggle UI",
        description: "Show the Line/Candle toggle switch.",
    },
    showStats: {
        type: ControlType.Boolean,
        title: "Stats Row",
        description: "Show 24h High/Low and Volume stats.",
    },
    showCryptoName: {
        type: ControlType.Boolean,
        title: "Full Name",
    },
    showCurrency: {
        type: ControlType.Boolean,
        title: "Currency",
    },
})
