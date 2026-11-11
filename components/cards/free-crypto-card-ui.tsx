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


// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type RangeKey = "7D" | "1M" | "6M" | "1Y"
type Currency = "usd" | "gbp" | "eur" | "jpy" | "chf" | "rub"
type Mode = "dark" | "light"
type Provider =
    | "coingecko"
    | "binance"
    | "coinmarketcap"
    | "kraken"
    | "cryptocompare"
type Point = { t: number; c: number }

interface Ticker {
    price: number // converted to display currency
    change24h: number // percent
    high24h: number // converted to display currency
    low24h: number // converted to display currency
    volume: number // quote volume, converted to display currency
}
interface Err {
    status: number | null
    title: string
    hint: string
    docs: string
}
interface TK {
    bg: string
    border: string
    divider: string
    text: string
    muted: string
    shadow: string
    chipBg: (a: string) => string
    inactiveBg: string
    liveRing: string
    statColor: string
    upBg: string
    upBd: string
    dnBg: string
    dnBd: string
    errBg: string
    errBd: string
    fill: [number, number]
}

// ─────────────────────────────────────────────────────────────────────────────
// THEMES — complete, fully independent visual systems
// ─────────────────────────────────────────────────────────────────────────────

const DARK: TK = {
    bg: "linear-gradient(158deg,#141826 0%,#0A0C17 100%)",
    border: "rgba(255,255,255,0.09)",
    divider: "rgba(255,255,255,0.06)",
    text: "#EDEFFF",
    muted: "rgba(237,239,255,0.40)",
    shadow: "0 24px 64px rgba(0,0,0,0.60)",
    chipBg: (a) => a + "26",
    inactiveBg: "rgba(255,255,255,0.04)",
    liveRing: "rgba(0,227,150,0.08)",
    statColor: "rgba(237,239,255,0.82)",
    upBg: "rgba(0,227,150,0.10)",
    upBd: "rgba(0,227,150,0.26)",
    dnBg: "rgba(255,69,96,0.10)",
    dnBd: "rgba(255,69,96,0.26)",
    errBg: "rgba(255,69,96,0.07)",
    errBd: "rgba(255,69,96,0.24)",
    fill: [0.36, 0.0],
}
const LIGHT: TK = {
    bg: "linear-gradient(158deg,#FFFFFF 0%,#EEF0FA 100%)",
    border: "rgba(0,0,40,0.08)",
    divider: "rgba(0,0,40,0.06)",
    text: "#0C0E1E",
    muted: "rgba(12,14,30,0.44)",
    shadow: "0 8px 36px rgba(0,0,40,0.11)",
    chipBg: (a) => a + "18",
    inactiveBg: "rgba(0,0,0,0.045)",
    liveRing: "rgba(0,185,110,0.08)",
    statColor: "rgba(12,14,30,0.80)",
    upBg: "rgba(0,185,110,0.09)",
    upBd: "rgba(0,185,110,0.26)",
    dnBg: "rgba(205,45,65,0.09)",
    dnBd: "rgba(205,45,65,0.24)",
    errBg: "rgba(205,45,65,0.06)",
    errBd: "rgba(205,45,65,0.22)",
    fill: [0.15, 0.0],
}
const UP: Record<Mode, string> = { dark: "#00E396", light: "#00A85D" }
const DN: Record<Mode, string> = { dark: "#FF4560", light: "#CC2D40" }

// ─────────────────────────────────────────────────────────────────────────────
// COIN REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

const COINS = [
    {
        sym: "BTC",
        name: "Bitcoin",
        id: "bitcoin",
        accent: "#F7931A",
        krakenPair: "XBTUSD",
    },
    {
        sym: "ETH",
        name: "Ethereum",
        id: "ethereum",
        accent: "#627EEA",
        krakenPair: "ETHUSD",
    },
    {
        sym: "BNB",
        name: "BNB",
        id: "binancecoin",
        accent: "#F3BA2F",
        krakenPair: "",
    },
    {
        sym: "SOL",
        name: "Solana",
        id: "solana",
        accent: "#9945FF",
        krakenPair: "SOLUSD",
    },
    {
        sym: "XRP",
        name: "XRP",
        id: "ripple",
        accent: "#00A3E0",
        krakenPair: "XRPUSD",
    },
    {
        sym: "DOGE",
        name: "Dogecoin",
        id: "dogecoin",
        accent: "#C6A135",
        krakenPair: "XDGUSD",
    },
    {
        sym: "ADA",
        name: "Cardano",
        id: "cardano",
        accent: "#1758A6",
        krakenPair: "ADAUSD",
    },
    {
        sym: "TRX",
        name: "TRON",
        id: "tron",
        accent: "#FF0013",
        krakenPair: "TRXUSD",
    },
    {
        sym: "TON",
        name: "Toncoin",
        id: "the-open-network",
        accent: "#0088CC",
        krakenPair: "",
    },
    {
        sym: "AVAX",
        name: "Avalanche",
        id: "avalanche-2",
        accent: "#E84142",
        krakenPair: "AVAXUSD",
    },
    {
        sym: "SHIB",
        name: "Shiba Inu",
        id: "shiba-inu",
        accent: "#FF6D00",
        krakenPair: "SHIBUSD",
    },
    {
        sym: "LINK",
        name: "Chainlink",
        id: "chainlink",
        accent: "#2A5ADA",
        krakenPair: "LINKUSD",
    },
    {
        sym: "DOT",
        name: "Polkadot",
        id: "polkadot",
        accent: "#E6007A",
        krakenPair: "DOTUSD",
    },
    {
        sym: "NEAR",
        name: "NEAR Protocol",
        id: "near",
        accent: "#00C08B",
        krakenPair: "NEARUSD",
    },
    {
        sym: "MATIC",
        name: "Polygon",
        id: "matic-network",
        accent: "#8247E5",
        krakenPair: "MATICUSD",
    },
    {
        sym: "LTC",
        name: "Litecoin",
        id: "litecoin",
        accent: "#A0A0A0",
        krakenPair: "XLTCZUSD",
    },
    {
        sym: "UNI",
        name: "Uniswap",
        id: "uniswap",
        accent: "#FF007A",
        krakenPair: "UNIUSD",
    },
    {
        sym: "APT",
        name: "Aptos",
        id: "aptos",
        accent: "#00BCD4",
        krakenPair: "APTUSD",
    },
    {
        sym: "OP",
        name: "Optimism",
        id: "optimism",
        accent: "#FF0420",
        krakenPair: "OPUSD",
    },
    {
        sym: "ARB",
        name: "Arbitrum",
        id: "arbitrum",
        accent: "#12AAFF",
        krakenPair: "",
    },
    {
        sym: "ATOM",
        name: "Cosmos",
        id: "cosmos",
        accent: "#6F7390",
        krakenPair: "ATOMUSD",
    },
    {
        sym: "INJ",
        name: "Injective",
        id: "injective-protocol",
        accent: "#00B2FF",
        krakenPair: "INJUSD",
    },
    {
        sym: "SUI",
        name: "Sui",
        id: "sui",
        accent: "#6FBCF0",
        krakenPair: "SUIUSD",
    },
    {
        sym: "FTM",
        name: "Fantom",
        id: "fantom",
        accent: "#1969FF",
        krakenPair: "FTMUSD",
    },
    {
        sym: "AAVE",
        name: "Aave",
        id: "aave",
        accent: "#B6509E",
        krakenPair: "AAVEUSD",
    },
    {
        sym: "LDO",
        name: "Lido DAO",
        id: "lido-dao",
        accent: "#F4A246",
        krakenPair: "LDOUSD",
    },
    {
        sym: "CRV",
        name: "Curve DAO",
        id: "curve-dao-token",
        accent: "#FFCB00",
        krakenPair: "CRVUSD",
    },
    {
        sym: "MKR",
        name: "Maker",
        id: "maker",
        accent: "#1AAB9B",
        krakenPair: "MKRUSD",
    },
    {
        sym: "ALGO",
        name: "Algorand",
        id: "algorand",
        accent: "#7FFFD4",
        krakenPair: "ALGOUSD",
    },
    {
        sym: "HBAR",
        name: "Hedera",
        id: "hedera-hashgraph",
        accent: "#00AEEF",
        krakenPair: "HBARUSD",
    },
    {
        sym: "XLM",
        name: "Stellar",
        id: "stellar",
        accent: "#7B68EE",
        krakenPair: "XXLMZUSD",
    },
    {
        sym: "ETC",
        name: "Ethereum Classic",
        id: "ethereum-classic",
        accent: "#328332",
        krakenPair: "XETCZUSD",
    },
    {
        sym: "GRT",
        name: "The Graph",
        id: "the-graph",
        accent: "#6F4CFF",
        krakenPair: "GRTUSD",
    },
    {
        sym: "SNX",
        name: "Synthetix",
        id: "synthetix-network-token",
        accent: "#5FCDF9",
        krakenPair: "SNXUSD",
    },
    {
        sym: "COMP",
        name: "Compound",
        id: "compound-governance-token",
        accent: "#00D395",
        krakenPair: "COMPUSD",
    },
    {
        sym: "FIL",
        name: "Filecoin",
        id: "filecoin",
        accent: "#0090FF",
        krakenPair: "FILUSD",
    },
    {
        sym: "RUNE",
        name: "THORChain",
        id: "thorchain",
        accent: "#33FF99",
        krakenPair: "RUNEUSD",
    },
    {
        sym: "ICP",
        name: "Internet Computer",
        id: "internet-computer",
        accent: "#29ABE2",
        krakenPair: "ICPUSD",
    },
    {
        sym: "KAVA",
        name: "Kava",
        id: "kava",
        accent: "#FF564F",
        krakenPair: "KAVAUSD",
    },
    {
        sym: "SAND",
        name: "The Sandbox",
        id: "the-sandbox",
        accent: "#00ADEF",
        krakenPair: "SANDUSD",
    },
    {
        sym: "MANA",
        name: "Decentraland",
        id: "decentraland",
        accent: "#FF2D55",
        krakenPair: "MANAUSD",
    },
    {
        sym: "FLOW",
        name: "Flow",
        id: "flow",
        accent: "#00EF8B",
        krakenPair: "FLOWUSD",
    },
    {
        sym: "1INCH",
        name: "1inch",
        id: "1inch",
        accent: "#94A3C7",
        krakenPair: "1INCHUSD",
    },
    {
        sym: "CHZ",
        name: "Chiliz",
        id: "chiliz",
        accent: "#CD0124",
        krakenPair: "CHZUSD",
    },
]
const COIN_MAP = new Map(COINS.map((c) => [c.sym, c]))
function getCoin(s: string) {
    return (
        COIN_MAP.get(s.toUpperCase()) ?? {
            sym: s.toUpperCase(),
            name: s.toUpperCase(),
            id: s.toLowerCase(),
            accent: "#627EEA",
            krakenPair: s + "USD",
        }
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENCY CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const CCY_SYM: Record<Currency, string> = {
    usd: "$",
    gbp: "£",
    eur: "€",
    jpy: "¥",
    chf: "Fr",
    rub: "₽",
}
const CCY_CODE: Record<Currency, string> = {
    usd: "USD",
    gbp: "GBP",
    eur: "EUR",
    jpy: "JPY",
    chf: "CHF",
    rub: "RUB",
}

// ─────────────────────────────────────────────────────────────────────────────
// API CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CG_FREE = "https://api.coingecko.com/api/v3"
const CG_PRO = "https://pro-api.coingecko.com/api/v3"
const BIN_API = "https://api.binance.com/api/v3"
const CMC_API = "https://pro-api.coinmarketcap.com"
const KRK_API = "https://api.kraken.com/0/public"
const CC_API = "https://min-api.cryptocompare.com/data"
const PROXY = "https://corsproxy.io/?"
const FX_TTL = 30 * 60_000
const POLL_MS = 20_000 // re-fetch ticker every 20 s for live price

const DOCS: Record<Provider, string> = {
    coingecko: "https://docs.coingecko.com/reference/introduction",
    binance: "https://developers.binance.com/docs/binance-spot-api-docs",
    coinmarketcap: "https://coinmarketcap.com/api/documentation/v1/",
    kraken: "https://docs.kraken.com/api/docs/rest-api/get-ticker-information",
    cryptocompare: "https://developers.cryptocompare.com/documentation",
}

// Range configs
const BIN_INTERVAL: Record<RangeKey, string> = {
    "7D": "4h",
    "1M": "1d",
    "6M": "1d",
    "1Y": "1d",
}
const BIN_LIMIT: Record<RangeKey, number> = {
    "7D": 42,
    "1M": 30,
    "6M": 180,
    "1Y": 365,
}
const CG_DAYS: Record<RangeKey, string> = {
    "7D": "7",
    "1M": "30",
    "6M": "180",
    "1Y": "365",
}
const CG_INTERVAL: Record<RangeKey, string> = {
    "7D": "hourly",
    "1M": "daily",
    "6M": "daily",
    "1Y": "daily",
}
const CC_RESOLUTION: Record<RangeKey, string> = {
    "7D": "histohour",
    "1M": "histoday",
    "6M": "histoday",
    "1Y": "histoday",
}
const CC_LIMIT: Record<RangeKey, number> = {
    "7D": 168,
    "1M": 30,
    "6M": 180,
    "1Y": 365,
}
const KR_INTERVAL: Record<RangeKey, number> = {
    "7D": 240,
    "1M": 1440,
    "6M": 1440,
    "1Y": 1440,
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const px = (u: string) => PROXY + encodeURIComponent(u)

async function get(
    url: string,
    hdrs: Record<string, string> = {}
): Promise<any> {
    const r = await fetch(url, { cache: "no-store", headers: hdrs })
    if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw Object.assign(
            new Error(`HTTP ${r.status} — ${body.slice(0, 120)}`),
            { status: r.status }
        )
    }
    return r.json()
}

// Try direct URL, fall back to CORS proxy; preserves error .status from the direct call
async function getWithProxy(
    url: string,
    hdrs: Record<string, string> = {}
): Promise<any> {
    try {
        return await get(url, hdrs)
    } catch (e: any) {
        try {
            return await get(px(url), hdrs)
        } catch (e2: any) {
            // Prefer direct error (has real HTTP status) over proxy error
            throw e.status ? e : e2
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FX RATES  (single-flight, module-level)
// ─────────────────────────────────────────────────────────────────────────────

const FX_FALLBACK: Record<string, number> = {
    USD: 1,
    GBP: 0.79,
    EUR: 0.92,
    JPY: 149,
    CHF: 0.9,
    RUB: 89,
}
let _fxCache: { rates: Record<string, number>; at: number } | null = null
let _fxFlight: Promise<Record<string, number>> | null = null

async function getFx(): Promise<Record<string, number>> {
    if (_fxCache && Date.now() - _fxCache.at < FX_TTL) return _fxCache.rates
    if (_fxFlight) return _fxFlight
    _fxFlight = get("https://api.exchangerate-api.com/v4/latest/USD")
        .catch(() => get(px("https://api.exchangerate-api.com/v4/latest/USD")))
        .then((d) => {
            const rates = d?.rates || d?.conversion_rates || {}
            if (Object.keys(rates).length > 5) {
                _fxCache = { rates, at: Date.now() }
                _fxFlight = null
                return rates
            }
            _fxFlight = null
            return FX_FALLBACK
        })
        .catch(() => {
            _fxFlight = null
            return FX_FALLBACK
        })
    return _fxFlight
}

async function toDisplayCurrency(
    usdPrice: number,
    ccy: Currency
): Promise<number> {
    if (ccy === "usd") return usdPrice
    const rates = await getFx()
    return usdPrice * (rates[CCY_CODE[ccy]] ?? 1)
}

// ─────────────────────────────────────────────────────────────────────────────
// KLINE CACHE  (module-level, singleflight)
// ─────────────────────────────────────────────────────────────────────────────

const KLINE_CACHE = new Map<string, { pts: Point[]; at: number }>()
const KLINE_FLIGHT = new Map<string, Promise<Point[]>>()
const KLINE_TTL = 5 * 60_000

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function mkErr(e: any, prov: Provider): Err {
    const st: number | null = e?.status ?? null
    const d = DOCS[prov]
    if (st === 401 || st === 403)
        return {
            status: st,
            title: "Invalid API key",
            hint: "Your API key was rejected. Verify it is active and correct.",
            docs: d,
        }
    if (st === 429)
        return {
            status: 429,
            title: "Rate limit hit",
            hint: "Too many requests. Wait 60 s or upgrade your API plan.",
            docs: d,
        }
    if (st === 404)
        return {
            status: 404,
            title: "Coin not found",
            hint: `${prov} may not list this symbol. Try CoinGecko or Binance as provider.`,
            docs: d,
        }
    if (st === 400)
        return {
            status: 400,
            title: "Bad request",
            hint: "The symbol format may be wrong for this provider.",
            docs: d,
        }
    if (st === 402)
        return {
            status: 402,
            title: "Plan required",
            hint: "This endpoint requires a paid API plan. Upgrade or switch provider.",
            docs: d,
        }
    if (!st)
        return {
            status: null,
            title: "Network error",
            hint: "Cannot reach the API. Check your connection. A CORS proxy is used as fallback.",
            docs: d,
        }
    return {
        status: st,
        title: `API error (${st})`,
        hint: "An unexpected error occurred. See docs for details.",
        docs: d,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ═══════════════════════  PROVIDER IMPLEMENTATIONS  ══════════════════════════
//
//  All ticker functions return Ticker in the requested display currency.
//  All kline functions return Point[] in the requested display currency.
//
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. COINGECKO ─────────────────────────────────────────────────────────────
//  Endpoint: GET /coins/{id}?market_data=true
//  Fields:   market_data.current_price[ccy], high_24h[ccy], low_24h[ccy],
//            total_volume[ccy], price_change_percentage_24h
//  Auth:     x-cg-pro-api-key header (optional)
//  CORS:     proxy fallback

async function cgTicker(
    cgId: string,
    ccy: Currency,
    apiKey?: string
): Promise<Ticker> {
    const base = apiKey ? CG_PRO : CG_FREE
    const hdrs = apiKey ? { "x-cg-pro-api-key": apiKey } : {}
    const url = `${base}/coins/${cgId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    const d = await getWithProxy(url, hdrs)
    const md = d?.market_data
    if (!md)
        throw Object.assign(new Error("No market_data in response"), {
            status: 404,
        })
    const c = ccy
    return {
        price: md.current_price?.[c] ?? 0,
        change24h: md.price_change_percentage_24h ?? 0,
        high24h: md.high_24h?.[c] ?? 0,
        low24h: md.low_24h?.[c] ?? 0,
        volume: md.total_volume?.[c] ?? 0,
    }
}

async function cgKlines(
    cgId: string,
    range: RangeKey,
    ccy: Currency,
    apiKey?: string
): Promise<Point[]> {
    const base = apiKey ? CG_PRO : CG_FREE
    const hdrs = apiKey ? { "x-cg-pro-api-key": apiKey } : {}
    const url = `${base}/coins/${cgId}/market_chart?vs_currency=${ccy}&days=${CG_DAYS[range]}&interval=${CG_INTERVAL[range]}`
    const d = await getWithProxy(url, hdrs)
    const arr: any[] = d?.prices ?? []
    if (arr.length < 2)
        throw Object.assign(new Error("Insufficient price data"), {
            status: 404,
        })
    return arr.map((r: any) => ({ t: +r[0], c: parseFloat(r[1]) }))
}

// ── 2. BINANCE ────────────────────────────────────────────────────────────────
//  Ticker: GET /api/v3/ticker/24hr?symbol=BTCUSDT
//  Fields: lastPrice, priceChangePercent, highPrice, lowPrice, quoteVolume
//  Auth:   No key needed for market data
//  Klines: GET /api/v3/klines?symbol=BTCUSDT&interval=1d&limit=365

async function binTicker(sym: string, ccy: Currency): Promise<Ticker> {
    const url = `${BIN_API}/ticker/24hr?symbol=${sym}USDT`
    const d = await getWithProxy(url)
    const price = parseFloat(d.lastPrice)
    if (!price || price === 0)
        throw Object.assign(new Error("Symbol not found on Binance"), {
            status: 404,
        })
    const usdTicker: Ticker = {
        price: price,
        change24h: parseFloat(d.priceChangePercent) || 0,
        high24h: parseFloat(d.highPrice) || 0,
        low24h: parseFloat(d.lowPrice) || 0,
        volume: parseFloat(d.quoteVolume) || 0, // already in USDT
    }
    if (ccy === "usd") return usdTicker
    const rates = await getFx()
    const rate = rates[CCY_CODE[ccy]] ?? 1
    return {
        price: usdTicker.price * rate,
        change24h: usdTicker.change24h,
        high24h: usdTicker.high24h * rate,
        low24h: usdTicker.low24h * rate,
        volume: usdTicker.volume * rate,
    }
}

async function binKlines(
    sym: string,
    range: RangeKey,
    ccy: Currency
): Promise<Point[]> {
    const url = `${BIN_API}/klines?symbol=${sym}USDT&interval=${BIN_INTERVAL[range]}&limit=${BIN_LIMIT[range]}`
    const raw = await getWithProxy(url)
    if (!Array.isArray(raw) || raw.length < 2)
        throw Object.assign(new Error("No kline data"), { status: 404 })
    let pts: Point[] = raw.map((k: any) => ({ t: +k[0], c: parseFloat(k[4]) }))
    if (ccy !== "usd") {
        const rates = await getFx()
        const rate = rates[CCY_CODE[ccy]] ?? 1
        pts = pts.map((p) => ({ ...p, c: p.c * rate }))
    }
    return pts
}

// ── 3. COINMARKETCAP ──────────────────────────────────────────────────────────
//  Endpoint: GET /v2/cryptocurrency/quotes/latest?symbol=BTC&convert=USD
//  Fields:   data[SYM][0].quote[CCY].{price, percent_change_24h, volume_24h}
//  Note:     high_24h / low_24h not available on Basic plan → show note in UI
//  Auth:     X-CMC_PRO_API_KEY header  (REQUIRED — no free anonymous calls)

async function cmcTicker(
    sym: string,
    ccy: Currency,
    apiKey: string
): Promise<Ticker> {
    if (!apiKey)
        throw Object.assign(new Error("CMC API key required"), { status: 401 })
    const convert = CCY_CODE[ccy]
    const url = `${CMC_API}/v2/cryptocurrency/quotes/latest?symbol=${sym}&convert=${convert}`
    const hdrs = { "X-CMC_PRO_API_KEY": apiKey }
    const d = await getWithProxy(url, hdrs)
    if (d.status?.error_code && d.status.error_code !== 0) {
        throw Object.assign(new Error(d.status.error_message || "CMC error"), {
            status: d.status.error_code,
        })
    }
    const arr = d.data?.[sym]
    if (!arr?.length)
        throw Object.assign(new Error("Coin not found in CMC response"), {
            status: 404,
        })
    const q = arr[0].quote?.[convert]
    if (!q)
        throw Object.assign(
            new Error(`Currency ${convert} not in CMC response`),
            { status: 404 }
        )
    return {
        price: q.price ?? 0,
        change24h: q.percent_change_24h ?? 0,
        // CMC Basic plan doesn't expose high/low — return 0 so UI shows placeholder
        high24h: 0,
        low24h: 0,
        volume: q.volume_24h ?? 0,
    }
}

// CMC historical OHLCV requires paid plan — cascade to CG free as fallback
async function cmcKlines(
    cgId: string,
    range: RangeKey,
    ccy: Currency
): Promise<Point[]> {
    return cgKlines(cgId, range, ccy) // uses CG free (no key) — always works
}

// ── 4. KRAKEN ─────────────────────────────────────────────────────────────────
//  Ticker: GET /0/public/Ticker?pair=XBTUSD
//  Fields: result[PAIR].c[0]=last, h[1]=24h high, l[1]=24h low, v[1]=24h vol,
//          o=open price (used to compute change%)
//  Auth:   None — public endpoint
//  OHLC:   GET /0/public/OHLC?pair=XBTUSD&interval=1440  → result[PAIR][n][4]=close

async function krkTicker(sym: string, ccy: Currency): Promise<Ticker> {
    const coin = getCoin(sym)
    const pair = coin.krakenPair
    if (!pair)
        throw Object.assign(new Error(`${sym} is not listed on Kraken`), {
            status: 404,
        })
    const url = `${KRK_API}/Ticker?pair=${pair}`
    const d = await getWithProxy(url)
    if (d.error?.length)
        throw Object.assign(new Error(d.error[0]), { status: 404 })
    const resultKey = Object.keys(d.result || {})[0]
    const t = d.result?.[resultKey]
    if (!t)
        throw Object.assign(new Error("Empty ticker result from Kraken"), {
            status: 404,
        })

    const priceUSD = parseFloat(t.c?.[0]) // last trade price
    const openUSD = parseFloat(t.o) // 24h open price
    const high24USD = parseFloat(t.h?.[1]) // 24h high
    const low24USD = parseFloat(t.l?.[1]) // 24h low
    // v[1] = 24h base volume; multiply by last price to get quote volume
    const vol24USD = parseFloat(t.v?.[1]) * priceUSD

    if (!priceUSD || priceUSD === 0)
        throw Object.assign(new Error("Zero price from Kraken"), {
            status: 404,
        })
    const change24h = openUSD > 0 ? ((priceUSD - openUSD) / openUSD) * 100 : 0

    if (ccy === "usd")
        return {
            price: priceUSD,
            change24h,
            high24h: high24USD,
            low24h: low24USD,
            volume: vol24USD,
        }
    const rates = await getFx()
    const rate = rates[CCY_CODE[ccy]] ?? 1
    return {
        price: priceUSD * rate,
        change24h,
        high24h: high24USD * rate,
        low24h: low24USD * rate,
        volume: vol24USD * rate,
    }
}

async function krkKlines(
    sym: string,
    range: RangeKey,
    ccy: Currency
): Promise<Point[]> {
    const coin = getCoin(sym)
    const pair = coin.krakenPair
    if (!pair)
        throw Object.assign(new Error(`${sym} not on Kraken`), { status: 404 })
    const url = `${KRK_API}/OHLC?pair=${pair}&interval=${KR_INTERVAL[range]}`
    const d = await getWithProxy(url)
    if (d.error?.length)
        throw Object.assign(new Error(d.error[0]), { status: 404 })
    const resultKey = Object.keys(d.result || {}).find((k) => k !== "last")
    const arr: any[] = d.result?.[resultKey!] ?? []
    if (arr.length < 2)
        throw Object.assign(new Error("Insufficient OHLC data"), {
            status: 404,
        })
    // Kraken returns up to 720 candles max; slice to desired range length
    const n = BIN_LIMIT[range]
    let pts: Point[] = arr
        .slice(-n)
        .map((k: any) => ({ t: +k[0] * 1000, c: parseFloat(k[4]) }))
    if (ccy !== "usd") {
        const rates = await getFx()
        const rate = rates[CCY_CODE[ccy]] ?? 1
        pts = pts.map((p) => ({ ...p, c: p.c * rate }))
    }
    return pts
}

// ── 5. CRYPTOCOMPARE ──────────────────────────────────────────────────────────
//  Ticker: GET /data/pricemultifull?fsyms=BTC&tsyms=USD
//  Fields: RAW.BTC.USD.{PRICE, CHANGEPCT24HOUR, HIGH24HOUR, LOW24HOUR, VOLUME24HOURTO}
//  Auth:   Authorization: Apikey <key> header (optional; anonymous has lower limits)
//  OHLC:   GET /data/v2/histoday?fsym=BTC&tsym=USD&limit=365

async function ccTicker(
    sym: string,
    ccy: Currency,
    apiKey?: string
): Promise<Ticker> {
    const tsym = CCY_CODE[ccy]
    const url = `${CC_API}/pricemultifull?fsyms=${sym}&tsyms=${tsym}`
    const hdrs = apiKey ? { authorization: `Apikey ${apiKey}` } : {}
    const d = await getWithProxy(url, hdrs)
    if (d.Response === "Error")
        throw Object.assign(new Error(d.Message || "CryptoCompare error"), {
            status: 404,
        })
    const q = d.RAW?.[sym]?.[tsym]
    if (!q)
        throw Object.assign(
            new Error(`${sym}/${tsym} not found on CryptoCompare`),
            { status: 404 }
        )
    return {
        price: q.PRICE ?? 0,
        change24h: q.CHANGEPCT24HOUR ?? 0,
        high24h: q.HIGH24HOUR ?? 0,
        low24h: q.LOW24HOUR ?? 0,
        volume: q.VOLUME24HOURTO ?? 0, // already in tsym
    }
}

async function ccKlines(
    sym: string,
    range: RangeKey,
    ccy: Currency,
    apiKey?: string
): Promise<Point[]> {
    const tsym = CCY_CODE[ccy]
    const res = CC_RESOLUTION[range]
    const lim = CC_LIMIT[range]
    const url = `${CC_API}/v2/${res}?fsym=${sym}&tsym=${tsym}&limit=${lim}`
    const hdrs = apiKey ? { authorization: `Apikey ${apiKey}` } : {}
    const d = await getWithProxy(url, hdrs)
    if (d.Response === "Error")
        throw Object.assign(new Error(d.Message || "CC error"), { status: 404 })
    const arr: any[] = d.Data?.Data ?? []
    if (arr.length < 2)
        throw Object.assign(new Error("Insufficient data from CryptoCompare"), {
            status: 404,
        })
    return arr.map((k: any) => ({ t: k.time * 1000, c: parseFloat(k.close) }))
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH — routes to the selected provider
// ─────────────────────────────────────────────────────────────────────────────

interface Keys {
    cg?: string
    cmc?: string
    cc?: string
}

async function fetchTicker(
    prov: Provider,
    sym: string,
    cgId: string,
    ccy: Currency,
    keys: Keys
): Promise<Ticker> {
    switch (prov) {
        case "coingecko":
            return cgTicker(cgId, ccy, keys.cg)
        case "binance":
            return binTicker(sym, ccy)
        case "coinmarketcap":
            return cmcTicker(sym, ccy, keys.cmc ?? "")
        case "kraken":
            return krkTicker(sym, ccy)
        case "cryptocompare":
            return ccTicker(sym, ccy, keys.cc)
    }
}

async function fetchKlines(
    prov: Provider,
    sym: string,
    cgId: string,
    range: RangeKey,
    ccy: Currency,
    keys: Keys
): Promise<Point[]> {
    switch (prov) {
        case "coingecko":
            return cgKlines(cgId, range, ccy, keys.cg)
        case "binance":
            return binKlines(sym, range, ccy)
        case "coinmarketcap":
            return cmcKlines(cgId, range, ccy) // falls back to CG free
        case "kraken":
            return krkKlines(sym, range, ccy)
        case "cryptocompare":
            return ccKlines(sym, range, ccy, keys.cc)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHED KLINES  (singleflight + TTL)
// ─────────────────────────────────────────────────────────────────────────────

async function getCachedKlines(
    prov: Provider,
    sym: string,
    cgId: string,
    range: RangeKey,
    ccy: Currency,
    keys: Keys
): Promise<Point[]> {
    const key = `${prov}|${sym}|${range}|${ccy}`
    const cached = KLINE_CACHE.get(key)
    if (cached && Date.now() - cached.at < KLINE_TTL) return cached.pts
    if (KLINE_FLIGHT.has(key))
        return cached ? cached.pts : KLINE_FLIGHT.get(key)!

    const p = fetchKlines(prov, sym, cgId, range, ccy, keys)
        .then((pts) => {
            KLINE_CACHE.set(key, { pts, at: Date.now() })
            KLINE_FLIGHT.delete(key)
            return pts
        })
        .catch((e) => {
            KLINE_FLIGHT.delete(key)
            throw e
        })
    KLINE_FLIGHT.set(key, p)
    return p
}

// ─────────────────────────────────────────────────────────────────────────────
// BINANCE WEBSOCKET  (trade-level price stream, shared across all instances)
// Gives sub-second price ticks for "LIVE" feel; high/low/vol come from REST poll
// ─────────────────────────────────────────────────────────────────────────────

type PriceCb = (price: number) => void
const _wsMap = new Map<
    string,
    { ws: WebSocket | null; cbs: Set<PriceCb>; last: number; retry: any }
>()

function subscribeWS(sym: string, cb: PriceCb): () => void {
    const key = sym.toLowerCase() + "usdt@trade"
    if (!_wsMap.has(key)) {
        const entry = {
            ws: null as any,
            cbs: new Set<PriceCb>(),
            last: 0,
            retry: null as any,
        }
        _wsMap.set(key, entry)
        const connect = () => {
            try {
                const ws = new WebSocket(
                    `wss://stream.binance.com:9443/ws/${key}`
                )
                entry.ws = ws
                ws.onmessage = (e) => {
                    try {
                        const d = JSON.parse(e.data)
                        const p = parseFloat(d.p)
                        if (p > 0) {
                            entry.last = p
                            entry.cbs.forEach((f) => f(p))
                        }
                    } catch {}
                }
                ws.onerror = () => {}
                ws.onclose = () => {
                    if (entry.cbs.size > 0)
                        entry.retry = setTimeout(connect, 3000)
                }
            } catch {}
        }
        connect()
    }
    const entry = _wsMap.get(key)!
    entry.cbs.add(cb)
    if (entry.last > 0) setTimeout(() => cb(entry.last), 0)
    return () => entry.cbs.delete(cb)
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

function fmtPrice(n: number, ccy: Currency): string {
    if (!Number.isFinite(n) || n <= 0) return "—"
    const code = CCY_CODE[ccy]
    try {
        if (n >= 1000)
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: code,
                maximumFractionDigits: 0,
            }).format(n)
        if (n >= 1)
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: code,
                maximumFractionDigits: 2,
            }).format(n)
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: code,
            maximumFractionDigits: 6,
        }).format(n)
    } catch {
        return CCY_SYM[ccy] + n.toFixed(n >= 1 ? 2 : 6)
    }
}
function fmtPct(n: number): string {
    return (
        (Number.isFinite(n) && n >= 0 ? "+" : "") +
        (Number.isFinite(n) ? n.toFixed(2) : "0.00") +
        "%"
    )
}
function fmtVol(n: number, ccy: Currency): string {
    const s = CCY_SYM[ccy]
    const v = Number.isFinite(n) ? n : 0
    if (v >= 1e9) return s + (v / 1e9).toFixed(2) + "B"
    if (v >= 1e6) return s + (v / 1e6).toFixed(2) + "M"
    if (v >= 1e3) return s + (v / 1e3).toFixed(1) + "K"
    return s + v.toFixed(0)
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({
    pts,
    accent,
    fill,
}: {
    pts: Point[]
    accent: string
    fill: [number, number]
}) {
    const closes = pts
        .map((p) => p.c)
        .filter((v) => Number.isFinite(v) && v > 0)
    if (closes.length < 2) return null
    const W = 500,
        H = 88,
        pad = 5
    const mn = Math.min(...closes),
        mx = Math.max(...closes),
        span = mx - mn || 1
    let line = ""
    pts.forEach((p, i) => {
        const x = (i / (pts.length - 1)) * W
        const y = H - pad - ((p.c - mn) / span) * (H - pad * 2)
        line += (i === 0 ? "M" : " L") + x.toFixed(1) + "," + y.toFixed(1)
    })
    const area = line + ` L${W},${H} L0,${H} Z`
    const gid = "sg" + accent.replace(/[^a-z0-9]/gi, "").slice(0, 8)
    return (
        <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: "block" }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop
                        offset="0%"
                        stopColor={accent}
                        stopOpacity={fill[0]}
                    />
                    <stop
                        offset="100%"
                        stopColor={accent}
                        stopOpacity={fill[1]}
                    />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <path
                d={line}
                fill="none"
                stroke={accent}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CHIP
// ─────────────────────────────────────────────────────────────────────────────

function Stat({
    label,
    value,
    muted,
    color,
}: {
    label: string
    value: string
    muted: string
    color: string
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
                style={{
                    color: muted,
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.7px",
                    textTransform: "uppercase" as const,
                }}
            >
                {label}
            </span>
            <span
                style={{
                    color,
                    fontSize: 12,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums" as const,
                }}
            >
                {value}
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR PANEL
// ─────────────────────────────────────────────────────────────────────────────

function ErrPanel({
    err,
    onRetry,
    tk,
    text,
    muted,
    border,
}: {
    err: Err
    onRetry: () => void
    tk: TK
    text: string
    muted: string
    border: string
}) {
    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 18px",
                gap: 8,
                textAlign: "center" as const,
            }}
        >
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: tk.errBg,
                    border: `1.5px solid ${tk.errBd}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                }}
            >
                ⚠
            </div>
            <span
                style={{
                    color: text,
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.3,
                }}
            >
                {err.title}
            </span>
            {err.status !== null && (
                <span
                    style={{
                        color: muted,
                        fontSize: 10,
                        fontWeight: 700,
                        background: tk.errBg,
                        border: `1px solid ${tk.errBd}`,
                        borderRadius: 4,
                        padding: "2px 7px",
                    }}
                >
                    HTTP {err.status}
                </span>
            )}
            <span
                style={{
                    color: muted,
                    fontSize: 11,
                    lineHeight: 1.55,
                    maxWidth: 260,
                }}
            >
                {err.hint}
            </span>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <button
                    onClick={onRetry}
                    style={{
                        background: tk.inactiveBg,
                        border: `1px solid ${border}`,
                        color: text,
                        borderRadius: 6,
                        padding: "5px 14px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "inherit",
                    }}
                >
                    Retry
                </button>
                <a
                    href={err.docs}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        background: "transparent",
                        border: `1px solid ${border}`,
                        color: muted,
                        borderRadius: 6,
                        padding: "5px 14px",
                        fontSize: 10,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                    }}
                >
                    Docs ↗
                </a>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART ERROR INLINE
// ─────────────────────────────────────────────────────────────────────────────

function ChartErr({
    err,
    onRetry,
    muted,
    border,
    tk,
    text,
}: {
    err: Err
    onRetry: () => void
    muted: string
    border: string
    tk: TK
    text: string
}) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "0 20px",
                textAlign: "center" as const,
            }}
        >
            <span style={{ fontSize: 16 }}>📉</span>
            <span style={{ color: text, fontSize: 11, fontWeight: 700 }}>
                Chart: {err.title}
            </span>
            <span
                style={{
                    color: muted,
                    fontSize: 10,
                    lineHeight: 1.5,
                    maxWidth: 240,
                }}
            >
                {err.hint}
            </span>
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <button
                    onClick={onRetry}
                    style={{
                        background: tk.errBg,
                        border: `1px solid ${tk.errBd}`,
                        color: text,
                        borderRadius: 5,
                        padding: "3px 10px",
                        fontSize: 9,
                        fontWeight: 700,
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "inherit",
                    }}
                >
                    Retry
                </button>
                <a
                    href={err.docs}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        background: "transparent",
                        border: `1px solid ${border}`,
                        color: muted,
                        borderRadius: 5,
                        padding: "3px 10px",
                        fontSize: 9,
                        fontWeight: 700,
                        textDecoration: "none",
                    }}
                >
                    Docs ↗
                </a>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    content?: { coin?: string; defaultRange?: RangeKey; currency?: Currency }
    features?: {
        showHighLow?: boolean
        showVolume?: boolean
        showRangePnL?: boolean
    }
    providers?: {
        provider?: Provider
        coingeckoApiKey?: string
        coinmarketcapApiKey?: string
        cryptocompareApiKey?: string
    }
    appearance?: {
        theme?: Mode
        cornerRadius?: number
        glassBlur?: number
        accentOverride?: string
    }
    // Separate color groups per theme — Framer remembers each independently
    darkColors?: {
        bgTop?: string
        bgBottom?: string
        border?: string
        textPrimary?: string
        textMuted?: string
    }
    lightColors?: {
        bgTop?: string
        bgBottom?: string
        border?: string
        textPrimary?: string
        textMuted?: string
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CryptoCard(props: Props) {
    // ── Resolve props ─────────────────────────────────────────────────────────
    const sym = String(props?.content?.coin || "BTC")
        .toUpperCase()
        .trim()
    const defRange = (props?.content?.defaultRange || "1Y") as RangeKey
    const ccy = (props?.content?.currency || "usd") as Currency
    const showHL = props?.features?.showHighLow !== false
    const showVol = props?.features?.showVolume !== false
    const showPnL = props?.features?.showRangePnL !== false
    const provider = (props?.providers?.provider || "coingecko") as Provider
    const keys: Keys = {
        cg: props?.providers?.coingeckoApiKey || undefined,
        cmc: props?.providers?.coinmarketcapApiKey || undefined,
        cc: props?.providers?.cryptocompareApiKey || undefined,
    }
    const mode = (props?.appearance?.theme || "dark") as Mode
    const cr = Number.isFinite(props?.appearance?.cornerRadius)
        ? props!.appearance!.cornerRadius!
        : 22
    const blur = Number.isFinite(props?.appearance?.glassBlur)
        ? props!.appearance!.glassBlur!
        : 18

    // Per-theme color overrides — uses the correct override set for current mode
    const tk = mode === "dark" ? DARK : LIGHT
    const oc = mode === "dark" ? props?.darkColors : props?.lightColors
    const has = (v?: string) => !!(v && v.length > 2)

    const bg =
        has(oc?.bgTop) || has(oc?.bgBottom)
            ? `linear-gradient(158deg,${oc?.bgTop || (mode === "dark" ? "#141826" : "#FFFFFF")} 0%,${oc?.bgBottom || (mode === "dark" ? "#0A0C17" : "#EEF0FA")} 100%)`
            : tk.bg
    const border = has(oc?.border) ? oc!.border! : tk.border
    const text = has(oc?.textPrimary) ? oc!.textPrimary! : tk.text
    const muted = has(oc?.textMuted) ? oc!.textMuted! : tk.muted

    const upColor = UP[mode]
    const dnColor = DN[mode]
    const coin = getCoin(sym)
    const accent = has(props?.appearance?.accentOverride)
        ? props!.appearance!.accentOverride!
        : coin.accent

    // ── State ─────────────────────────────────────────────────────────────────
    const [range, setRange] = React.useState<RangeKey>(defRange)
    const [ticker, setTicker] = React.useState<Ticker | null>(null)
    const [pts, setPts] = React.useState<Point[]>([])
    const [tkErr, setTkErr] = React.useState<Err | null>(null)
    const [chartErr, setChartErr] = React.useState<Err | null>(null)
    const [iconErr, setIconErr] = React.useState(false)
    // retryCount is a real state variable — incrementing it re-triggers effects
    const [retryCount, setRetryCount] = React.useState(0)

    // Sync range when the Framer property changes
    React.useEffect(() => {
        setRange(defRange)
    }, [defRange])

    // Reset when coin or provider changes
    React.useEffect(() => {
        setTicker(null)
        setTkErr(null)
        setIconErr(false)
    }, [sym, provider])

    // ── Binance WebSocket — fast price tick (price only; high/low come from poll)
    React.useEffect(() => {
        if (provider !== "binance") return
        const unsub = subscribeWS(sym, (rawPriceUSD) => {
            // Convert to display currency using cached FX rates
            const applyFx = async () => {
                const displayPrice = await toDisplayCurrency(rawPriceUSD, ccy)
                setTicker((prev) => {
                    if (!prev) return prev // wait for first REST poll to populate high/low/vol
                    return { ...prev, price: displayPrice }
                })
            }
            applyFx()
        })
        return unsub
    }, [sym, provider, ccy])

    // ── Ticker polling — ALL providers, every POLL_MS ─────────────────────────
    //  This is the canonical source for price, change, high, low, volume.
    //  The Binance WS above just makes price updates faster between polls.
    React.useEffect(() => {
        let alive = true

        const poll = async () => {
            try {
                const t = await fetchTicker(provider, sym, coin.id, ccy, keys)
                if (alive) {
                    setTicker(t)
                    setTkErr(null)
                }
            } catch (e: any) {
                if (alive) setTkErr(mkErr(e, provider))
            }
        }

        poll() // immediate first call
        const id = setInterval(poll, POLL_MS)
        return () => {
            alive = false
            clearInterval(id)
        }

        // We stringify keys to get stable deps — object identity changes every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sym,
        ccy,
        provider,
        keys.cg ?? "",
        keys.cmc ?? "",
        keys.cc ?? "",
        retryCount,
    ])

    // ── Chart klines ──────────────────────────────────────────────────────────
    React.useEffect(() => {
        let alive = true
        setChartErr(null)
        getCachedKlines(provider, sym, coin.id, range, ccy, keys)
            .then((p) => {
                if (alive) {
                    setPts(p)
                }
            })
            .catch((e: any) => {
                if (alive) {
                    setPts([])
                    setChartErr(mkErr(e, provider))
                }
            })
        return () => {
            alive = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sym, range, ccy, provider, keys.cg ?? "", keys.cc ?? "", retryCount])

    // ── Retry handler ─────────────────────────────────────────────────────────
    const retry = React.useCallback(() => {
        // Bust the kline cache for this specific key
        const key = `${provider}|${sym}|${range}|${ccy}`
        KLINE_CACHE.delete(key)
        setTicker(null)
        setTkErr(null)
        setChartErr(null)
        setPts([])
        setRetryCount((n) => n + 1) // triggers effects via dep array
    }, [provider, sym, range, ccy])

    // ── Derived values ────────────────────────────────────────────────────────
    const isUp = (ticker?.change24h ?? 0) >= 0
    const changeClr = isUp ? upColor : dnColor
    const rangeChng =
        pts.length >= 2
            ? ((pts[pts.length - 1].c - pts[0].c) / pts[0].c) * 100
            : null
    const iconSrc = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${sym.toLowerCase()}.svg`
    const RANGES: RangeKey[] = ["7D", "1M", "6M", "1Y"]

    // CMC free plan doesn't provide high/low — show advisory
    const noHighLow =
        provider === "coinmarketcap" &&
        ticker &&
        ticker.high24h === 0 &&
        ticker.low24h === 0

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                borderRadius: cr,
                background: bg,
                border: `1px solid ${border}`,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                fontFamily:
                    '"SF Pro Display","Helvetica Neue",system-ui,sans-serif',
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
                boxShadow: tk.shadow,
                color: text,
            }}
        >
            <style>{`@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.5)}}`}</style>

            {/* ══ HEADER ═══════════════════════════════════════════════════════ */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 18px 12px",
                    borderBottom: `1px solid ${tk.divider}`,
                    flexShrink: 0,
                }}
            >
                {/* Coin identity */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: accent + "20",
                            border: `1.5px solid ${accent}44`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            overflow: "hidden",
                        }}
                    >
                        {!iconErr ? (
                            <img
                                src={iconSrc}
                                width={26}
                                height={26}
                                style={{
                                    display: "block",
                                    objectFit: "contain",
                                }}
                                onError={() => setIconErr(true)}
                            />
                        ) : (
                            <span
                                style={{
                                    color: accent,
                                    fontSize: sym.length > 3 ? 7 : 10,
                                    fontWeight: 800,
                                }}
                            >
                                {sym}
                            </span>
                        )}
                    </div>
                    <div>
                        <div
                            style={{
                                color: text,
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: "-0.3px",
                                lineHeight: 1.2,
                            }}
                        >
                            {coin.name}
                        </div>
                        <div
                            style={{
                                color: muted,
                                fontSize: 10,
                                marginTop: 1,
                                fontWeight: 500,
                            }}
                        >
                            {sym} · {CCY_CODE[ccy]} · {provider}
                        </div>
                    </div>
                </div>

                {/* Status badge */}
                {tkErr && !ticker ? (
                    <div
                        style={{
                            background: tk.errBg,
                            border: `1px solid ${tk.errBd}`,
                            borderRadius: 99,
                            padding: "3px 9px",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                        }}
                    >
                        <span
                            style={{
                                color: dnColor,
                                fontSize: 10,
                                fontWeight: 700,
                            }}
                        >
                            ERROR
                        </span>
                    </div>
                ) : (
                    <div
                        style={{
                            background: tk.liveRing,
                            border: `1px solid ${upColor}30`,
                            borderRadius: 99,
                            padding: "3px 9px 3px 7px",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                        }}
                    >
                        <div
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: upColor,
                                animation: "livePulse 2s ease-in-out infinite",
                            }}
                        />
                        <span
                            style={{
                                color: upColor,
                                fontSize: 10,
                                fontWeight: 600,
                            }}
                        >
                            LIVE
                        </span>
                    </div>
                )}
            </div>

            {/* ══ TICKER ERROR — full panel if no data yet ══════════════════ */}
            {tkErr && !ticker && (
                <ErrPanel
                    err={tkErr}
                    onRetry={retry}
                    tk={tk}
                    text={text}
                    muted={muted}
                    border={border}
                />
            )}

            {/* ══ PRICE + STATS ════════════════════════════════════════════════ */}
            {(!tkErr || ticker) && (
                <div style={{ padding: "12px 18px 0", flexShrink: 0 }}>
                    {/* Price row */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        <span
                            style={{
                                color: text,
                                fontSize: 28,
                                fontWeight: 800,
                                letterSpacing: "-1.2px",
                                lineHeight: 1,
                                fontVariantNumeric: "tabular-nums" as const,
                            }}
                        >
                            {ticker ? fmtPrice(ticker.price, ccy) : "—"}
                        </span>
                        {ticker && (
                            <span
                                style={{
                                    background: isUp ? tk.upBg : tk.dnBg,
                                    color: changeClr,
                                    border: `1px solid ${isUp ? tk.upBd : tk.dnBd}`,
                                    borderRadius: 6,
                                    padding: "2px 7px",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    marginBottom: 3,
                                    lineHeight: 1,
                                    flexShrink: 0,
                                }}
                            >
                                {fmtPct(ticker.change24h)} 24h
                            </span>
                        )}
                        {/* Soft error badge when we have stale data but polling errored */}
                        {tkErr && ticker && (
                            <span
                                style={{
                                    background: tk.errBg,
                                    border: `1px solid ${tk.errBd}`,
                                    color: dnColor,
                                    borderRadius: 6,
                                    padding: "2px 7px",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    marginBottom: 3,
                                    lineHeight: 1,
                                    flexShrink: 0,
                                    cursor: "pointer",
                                }}
                                onClick={retry}
                                title={tkErr.hint}
                            >
                                ↻ stale
                            </span>
                        )}
                    </div>

                    {/* Stats row */}
                    {ticker && (
                        <div
                            style={{
                                display: "flex",
                                gap: 16,
                                marginTop: 8,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            {showHL && !noHighLow && ticker.high24h > 0 && (
                                <>
                                    <Stat
                                        label="24h High"
                                        value={fmtPrice(ticker.high24h, ccy)}
                                        muted={muted}
                                        color={tk.statColor}
                                    />
                                    <Stat
                                        label="24h Low"
                                        value={fmtPrice(ticker.low24h, ccy)}
                                        muted={muted}
                                        color={tk.statColor}
                                    />
                                </>
                            )}
                            {showHL && noHighLow && (
                                <span
                                    style={{
                                        color: muted,
                                        fontSize: 9,
                                        fontStyle: "italic",
                                    }}
                                >
                                    High/Low not on CMC Basic plan
                                </span>
                            )}
                            {showVol && ticker.volume > 0 && (
                                <Stat
                                    label="Volume"
                                    value={fmtVol(ticker.volume, ccy)}
                                    muted={muted}
                                    color={tk.statColor}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ══ CHART ════════════════════════════════════════════════════════ */}
            <div
                style={{
                    flex: 1,
                    marginTop: 10,
                    minHeight: 88,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {chartErr ? (
                    <ChartErr
                        err={chartErr}
                        onRetry={retry}
                        muted={muted}
                        border={border}
                        tk={tk}
                        text={text}
                    />
                ) : pts.length >= 2 ? (
                    <Sparkline pts={pts} accent={accent} fill={tk.fill} />
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: muted,
                            fontSize: 11,
                        }}
                    >
                        Loading chart…
                    </div>
                )}
            </div>

            {/* ══ RANGE TABS ═══════════════════════════════════════════════════ */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 18px 14px",
                    flexShrink: 0,
                }}
            >
                <div style={{ display: "flex", gap: 3 }}>
                    {RANGES.map((k) => {
                        const active = range === k
                        return (
                            <button
                                key={k}
                                onClick={() => setRange(k)}
                                style={{
                                    border: `1px solid ${active ? accent + "55" : border}`,
                                    background: active
                                        ? tk.chipBg(accent)
                                        : tk.inactiveBg,
                                    color: active ? accent : muted,
                                    borderRadius: 6,
                                    padding: "4px 10px",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    outline: "none",
                                    fontFamily: "inherit",
                                    transition: "all 0.14s ease",
                                }}
                            >
                                {k}
                            </button>
                        )
                    })}
                </div>
                {showPnL && rangeChng !== null && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                        }}
                    >
                        <span style={{ color: muted, fontSize: 10 }}>
                            {range}
                        </span>
                        <span
                            style={{
                                color: rangeChng >= 0 ? upColor : dnColor,
                                fontSize: 11,
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums" as const,
                            }}
                        >
                            {fmtPct(rangeChng)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT PROPS
// ─────────────────────────────────────────────────────────────────────────────

CryptoCard.defaultProps = {
    content: { coin: "BTC", defaultRange: "1Y", currency: "usd" },
    features: { showHighLow: true, showVolume: true, showRangePnL: true },
    providers: {
        provider: "coingecko",
        coingeckoApiKey: "",
        coinmarketcapApiKey: "",
        cryptocompareApiKey: "",
    },
    appearance: {
        theme: "dark",
        cornerRadius: 22,
        glassBlur: 18,
        accentOverride: "",
    },
    darkColors: {
        bgTop: "",
        bgBottom: "",
        border: "",
        textPrimary: "",
        textMuted: "",
    },
    lightColors: {
        bgTop: "",
        bgBottom: "",
        border: "",
        textPrimary: "",
        textMuted: "",
    },
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY CONTROLS — 6 collapsible groups
// ─────────────────────────────────────────────────────────────────────────────

addPropertyControls(CryptoCard, {
    // ── CONTENT ───────────────────────────────────────────────────────────────
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            coin: {
                type: ControlType.Enum,
                title: "Coin",
                defaultValue: "BTC",
                options: COINS.map((c) => c.sym),
                optionTitles: COINS.map((c) => `${c.name} (${c.sym})`),
            },
            defaultRange: {
                type: ControlType.Enum,
                title: "Range",
                options: ["7D", "1M", "6M", "1Y"],
                optionTitles: ["7 Days", "1 Month", "6 Months", "1 Year"],
                defaultValue: "1Y",
            },
            currency: {
                type: ControlType.Enum,
                title: "Currency",
                options: ["usd", "gbp", "eur", "jpy", "chf", "rub"],
                optionTitles: [
                    "USD – Dollar",
                    "GBP – Pound",
                    "EUR – Euro",
                    "JPY – Yen",
                    "CHF – Franc",
                    "RUB – Ruble",
                ],
                defaultValue: "usd",
            },
        },
    },

    // ── FEATURES ──────────────────────────────────────────────────────────────
    features: {
        type: ControlType.Object,
        title: "Features",
        controls: {
            showHighLow: {
                type: ControlType.Boolean,
                title: "24h High / Low",
                defaultValue: true,
            },
            showVolume: {
                type: ControlType.Boolean,
                title: "24h Volume",
                defaultValue: true,
            },
            showRangePnL: {
                type: ControlType.Boolean,
                title: "Range % Change",
                defaultValue: true,
            },
        },
    },

    // ── PROVIDERS ─────────────────────────────────────────────────────────────
    providers: {
        type: ControlType.Object,
        title: "Providers",
        controls: {
            provider: {
                type: ControlType.Enum,
                title: "Provider",
                options: [
                    "coingecko",
                    "binance",
                    "coinmarketcap",
                    "kraken",
                    "cryptocompare",
                ],
                optionTitles: [
                    "CoinGecko",
                    "Binance",
                    "CoinMarketCap",
                    "Kraken",
                    "CryptoCompare",
                ],
                defaultValue: "coingecko",
            },
            coingeckoApiKey: {
                type: ControlType.String,
                title: "CoinGecko Key",
                defaultValue: "",
                placeholder: "CG-xxxxxxxxxxxx",
                description:
                    "Optional. Raises rate limits. Free key at coingecko.com/api.",
            },
            coinmarketcapApiKey: {
                type: ControlType.String,
                title: "CMC Key",
                defaultValue: "",
                placeholder: "CMC API key",
                description:
                    "Required for CoinMarketCap. Free tier at coinmarketcap.com/api.",
            },
            cryptocompareApiKey: {
                type: ControlType.String,
                title: "CryptoCompare Key",
                defaultValue: "",
                placeholder: "CC API key",
                description:
                    "Optional for CryptoCompare. Free at developers.cryptocompare.com.",
            },
        },
    },

    // ── APPEARANCE ────────────────────────────────────────────────────────────
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            theme: {
                type: ControlType.Enum,
                title: "Theme",
                options: ["dark", "light"],
                optionTitles: ["Dark", "Light"],
                defaultValue: "dark",
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: 22,
                min: 0,
                max: 48,
                step: 2,
            },
            glassBlur: {
                type: ControlType.Number,
                title: "Backdrop Blur",
                defaultValue: 18,
                min: 0,
                max: 40,
                step: 1,
            },
            accentOverride: {
                type: ControlType.Color,
                title: "Accent Color",
                defaultValue: "",
                description: "Overrides the coin brand color.",
            },
        },
    },

    // ── DARK THEME COLORS ─────────────────────────────────────────────────────
    darkColors: {
        type: ControlType.Object,
        title: "Dark Theme Colors",
        controls: {
            bgTop: {
                type: ControlType.Color,
                title: "Bg Top",
                defaultValue: "",
            },
            bgBottom: {
                type: ControlType.Color,
                title: "Bg Bottom",
                defaultValue: "",
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "",
            },
            textPrimary: {
                type: ControlType.Color,
                title: "Text Primary",
                defaultValue: "",
            },
            textMuted: {
                type: ControlType.Color,
                title: "Text Muted",
                defaultValue: "",
            },
        },
    },

    // ── LIGHT THEME COLORS ────────────────────────────────────────────────────
    lightColors: {
        type: ControlType.Object,
        title: "Light Theme Colors",
        controls: {
            bgTop: {
                type: ControlType.Color,
                title: "Bg Top",
                defaultValue: "",
            },
            bgBottom: {
                type: ControlType.Color,
                title: "Bg Bottom",
                defaultValue: "",
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "",
            },
            textPrimary: {
                type: ControlType.Color,
                title: "Text Primary",
                defaultValue: "",
            },
            textMuted: {
                type: ControlType.Color,
                title: "Text Muted",
                defaultValue: "",
            },
        },
    },
    _contact: {
        type: ControlType.Link,
        title: "Need help?",
        defaultValue: "zlatkomarjanovic.zm@gmail.com",
    },
})
