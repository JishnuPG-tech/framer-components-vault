// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    CSSProperties,
} from "react"

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEZONE DATA
// ═══════════════════════════════════════════════════════════════════════════════

interface TimezoneInfo {
    offset: number // hours from UTC
    abbreviation: string
    fullName: string
}

const TIMEZONES: Record<string, TimezoneInfo> = {
    // UTC / GMT
    UTC: { offset: 0, abbreviation: "UTC", fullName: "UTC" },
    London: { offset: 0, abbreviation: "LON", fullName: "London" },
    Reykjavik: { offset: 0, abbreviation: "REY", fullName: "Reykjavik" },
    Accra: { offset: 0, abbreviation: "ACC", fullName: "Accra" },
    // UTC+1
    Paris: { offset: 1, abbreviation: "PAR", fullName: "Paris" },
    Berlin: { offset: 1, abbreviation: "BER", fullName: "Berlin" },
    Rome: { offset: 1, abbreviation: "ROM", fullName: "Rome" },
    Madrid: { offset: 1, abbreviation: "MAD", fullName: "Madrid" },
    Amsterdam: { offset: 1, abbreviation: "AMS", fullName: "Amsterdam" },
    Brussels: { offset: 1, abbreviation: "BRU", fullName: "Brussels" },
    Vienna: { offset: 1, abbreviation: "VIE", fullName: "Vienna" },
    Warsaw: { offset: 1, abbreviation: "WAR", fullName: "Warsaw" },
    Prague: { offset: 1, abbreviation: "PRA", fullName: "Prague" },
    Zurich: { offset: 1, abbreviation: "ZUR", fullName: "Zurich" },
    Stockholm: { offset: 1, abbreviation: "STO", fullName: "Stockholm" },
    Oslo: { offset: 1, abbreviation: "OSL", fullName: "Oslo" },
    Copenhagen: { offset: 1, abbreviation: "COP", fullName: "Copenhagen" },
    Lagos: { offset: 1, abbreviation: "LAG", fullName: "Lagos" },
    // UTC+2
    Kyiv: { offset: 2, abbreviation: "KYI", fullName: "Kyiv" },
    Helsinki: { offset: 2, abbreviation: "HEL", fullName: "Helsinki" },
    Athens: { offset: 2, abbreviation: "ATH", fullName: "Athens" },
    Bucharest: { offset: 2, abbreviation: "BUC", fullName: "Bucharest" },
    Cairo: { offset: 2, abbreviation: "CAI", fullName: "Cairo" },
    Johannesburg: { offset: 2, abbreviation: "JHB", fullName: "Johannesburg" },
    Istanbul: { offset: 3, abbreviation: "IST", fullName: "Istanbul" },
    // UTC+3
    Moscow: { offset: 3, abbreviation: "MOW", fullName: "Moscow" },
    Riyadh: { offset: 3, abbreviation: "RIY", fullName: "Riyadh" },
    Nairobi: { offset: 3, abbreviation: "NAI", fullName: "Nairobi" },
    Baghdad: { offset: 3, abbreviation: "BAG", fullName: "Baghdad" },
    Doha: { offset: 3, abbreviation: "DOH", fullName: "Doha" },
    // UTC+3.5
    Tehran: { offset: 3.5, abbreviation: "TEH", fullName: "Tehran" },
    // UTC+4
    Dubai: { offset: 4, abbreviation: "DXB", fullName: "Dubai" },
    "Abu Dhabi": { offset: 4, abbreviation: "AUH", fullName: "Abu Dhabi" },
    Baku: { offset: 4, abbreviation: "BAK", fullName: "Baku" },
    Muscat: { offset: 4, abbreviation: "MUS", fullName: "Muscat" },
    // UTC+4.5
    Kabul: { offset: 4.5, abbreviation: "KBL", fullName: "Kabul" },
    // UTC+5
    Karachi: { offset: 5, abbreviation: "KHI", fullName: "Karachi" },
    Tashkent: { offset: 5, abbreviation: "TAS", fullName: "Tashkent" },
    // UTC+5.5
    Mumbai: { offset: 5.5, abbreviation: "BOM", fullName: "Mumbai" },
    Delhi: { offset: 5.5, abbreviation: "DEL", fullName: "Delhi" },
    Kolkata: { offset: 5.5, abbreviation: "CCU", fullName: "Kolkata" },
    Chennai: { offset: 5.5, abbreviation: "MAA", fullName: "Chennai" },
    // UTC+5.75
    Kathmandu: { offset: 5.75, abbreviation: "KTM", fullName: "Kathmandu" },
    // UTC+6
    Dhaka: { offset: 6, abbreviation: "DAC", fullName: "Dhaka" },
    Almaty: { offset: 6, abbreviation: "ALA", fullName: "Almaty" },
    // UTC+6.5
    Yangon: { offset: 6.5, abbreviation: "RGN", fullName: "Yangon" },
    // UTC+7
    Bangkok: { offset: 7, abbreviation: "BKK", fullName: "Bangkok" },
    Jakarta: { offset: 7, abbreviation: "JKT", fullName: "Jakarta" },
    "Ho Chi Minh": { offset: 7, abbreviation: "SGN", fullName: "Ho Chi Minh" },
    Hanoi: { offset: 7, abbreviation: "HAN", fullName: "Hanoi" },
    // UTC+8
    Singapore: { offset: 8, abbreviation: "SIN", fullName: "Singapore" },
    "Hong Kong": { offset: 8, abbreviation: "HKG", fullName: "Hong Kong" },
    Beijing: { offset: 8, abbreviation: "BJS", fullName: "Beijing" },
    Shanghai: { offset: 8, abbreviation: "SHA", fullName: "Shanghai" },
    Taipei: { offset: 8, abbreviation: "TPE", fullName: "Taipei" },
    "Kuala Lumpur": {
        offset: 8,
        abbreviation: "KUL",
        fullName: "Kuala Lumpur",
    },
    Perth: { offset: 8, abbreviation: "PER", fullName: "Perth" },
    Manila: { offset: 8, abbreviation: "MNL", fullName: "Manila" },
    // UTC+9
    Tokyo: { offset: 9, abbreviation: "TYO", fullName: "Tokyo" },
    Seoul: { offset: 9, abbreviation: "SEL", fullName: "Seoul" },
    Osaka: { offset: 9, abbreviation: "OSA", fullName: "Osaka" },
    // UTC+9.5
    Adelaide: { offset: 9.5, abbreviation: "ADL", fullName: "Adelaide" },
    // UTC+10
    Sydney: { offset: 10, abbreviation: "SYD", fullName: "Sydney" },
    Melbourne: { offset: 10, abbreviation: "MEL", fullName: "Melbourne" },
    Brisbane: { offset: 10, abbreviation: "BNE", fullName: "Brisbane" },
    // UTC+11
    Noumea: { offset: 11, abbreviation: "NOU", fullName: "Noumea" },
    // UTC+12
    Auckland: { offset: 12, abbreviation: "AKL", fullName: "Auckland" },
    Fiji: { offset: 12, abbreviation: "FIJ", fullName: "Fiji" },
    // UTC+13
    Samoa: { offset: 13, abbreviation: "SAM", fullName: "Samoa" },
    // UTC-1
    Azores: { offset: -1, abbreviation: "AZO", fullName: "Azores" },
    // UTC-3
    "São Paulo": { offset: -3, abbreviation: "SAO", fullName: "São Paulo" },
    "Buenos Aires": {
        offset: -3,
        abbreviation: "BUE",
        fullName: "Buenos Aires",
    },
    "Rio de Janeiro": {
        offset: -3,
        abbreviation: "RIO",
        fullName: "Rio de Janeiro",
    },
    // UTC-4
    Santiago: { offset: -4, abbreviation: "SCL", fullName: "Santiago" },
    Caracas: { offset: -4, abbreviation: "CCS", fullName: "Caracas" },
    Halifax: { offset: -4, abbreviation: "HFX", fullName: "Halifax" },
    // UTC-5
    "New York": { offset: -5, abbreviation: "NY", fullName: "New York" },
    Toronto: { offset: -5, abbreviation: "TOR", fullName: "Toronto" },
    Miami: { offset: -5, abbreviation: "MIA", fullName: "Miami" },
    Bogotá: { offset: -5, abbreviation: "BOG", fullName: "Bogotá" },
    Lima: { offset: -5, abbreviation: "LIM", fullName: "Lima" },
    // UTC-6
    Chicago: { offset: -6, abbreviation: "CHI", fullName: "Chicago" },
    "Mexico City": { offset: -6, abbreviation: "MEX", fullName: "Mexico City" },
    Dallas: { offset: -6, abbreviation: "DAL", fullName: "Dallas" },
    Houston: { offset: -6, abbreviation: "HOU", fullName: "Houston" },
    // UTC-7
    Denver: { offset: -7, abbreviation: "DEN", fullName: "Denver" },
    Phoenix: { offset: -7, abbreviation: "PHX", fullName: "Phoenix" },
    Calgary: { offset: -7, abbreviation: "CAL", fullName: "Calgary" },
    // UTC-8
    "Los Angeles": { offset: -8, abbreviation: "LA", fullName: "Los Angeles" },
    "San Francisco": {
        offset: -8,
        abbreviation: "SFO",
        fullName: "San Francisco",
    },
    Vancouver: { offset: -8, abbreviation: "VAN", fullName: "Vancouver" },
    Seattle: { offset: -8, abbreviation: "SEA", fullName: "Seattle" },
    // UTC-9
    Anchorage: { offset: -9, abbreviation: "ANC", fullName: "Anchorage" },
    // UTC-10
    Honolulu: { offset: -10, abbreviation: "HNL", fullName: "Honolulu" },
    // Florence (Italy, UTC+1)
    Florence: { offset: 1, abbreviation: "FLO", fullName: "Florence" },
    // Dublin (Ireland, UTC+0)
    Dublin: { offset: 0, abbreviation: "DUB", fullName: "Dublin" },
}

const TIMEZONE_KEYS = Object.keys(TIMEZONES).sort()

// ═══════════════════════════════════════════════════════════════════════════════
// THEME PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

interface ThemeColors {
    cardBackground: string
    clockFaceBackground: string
    pillBackground: string
    hourHandColor: string
    minuteHandColor: string
    secondHandColor: string
    numberColor: string
    tickColor: string
    minuteTickColor: string
    labelColor: string
    gmtColor: string
    cityColor: string
    centerDotColor: string
    clockBorderColor: string
}

const THEMES: Record<string, ThemeColors> = {
    "iOS Light": {
        cardBackground: "#e5e5ea",
        clockFaceBackground: "#f2f2f7",
        pillBackground: "rgba(255,255,255,0.65)",
        hourHandColor: "#000000",
        minuteHandColor: "#000000",
        secondHandColor: "#ff3b30",
        numberColor: "#8e8e93",
        tickColor: "#48484a",
        minuteTickColor: "#c7c7cc",
        labelColor: "#000000",
        gmtColor: "#6e6e73",
        cityColor: "#000000",
        centerDotColor: "#000000",
        clockBorderColor: "rgba(0,0,0,0.06)",
    },
    "iOS Dark": {
        cardBackground: "#1c1c1e",
        clockFaceBackground: "#2c2c2e",
        pillBackground: "rgba(58,58,60,0.7)",
        hourHandColor: "#ffffff",
        minuteHandColor: "#ffffff",
        secondHandColor: "#ff9f0a",
        numberColor: "#ffffff",
        tickColor: "#ffffff",
        minuteTickColor: "rgba(255,255,255,0.4)",
        labelColor: "#ffffff",
        gmtColor: "rgba(255,255,255,0.55)",
        cityColor: "#ffffff",
        centerDotColor: "#ffffff",
        clockBorderColor: "rgba(255,255,255,0.1)",
    },
    Midnight: {
        cardBackground: "#0a1628",
        clockFaceBackground: "#122044",
        pillBackground: "rgba(18,32,68,0.7)",
        hourHandColor: "#c0c8dc",
        minuteHandColor: "#c0c8dc",
        secondHandColor: "#00d4ff",
        numberColor: "#c0c8dc",
        tickColor: "#c0c8dc",
        minuteTickColor: "rgba(192,200,220,0.35)",
        labelColor: "#c0c8dc",
        gmtColor: "rgba(192,200,220,0.6)",
        cityColor: "#c0c8dc",
        centerDotColor: "#c0c8dc",
        clockBorderColor: "rgba(0,212,255,0.15)",
    },
    Sunset: {
        cardBackground: "#3d2117",
        clockFaceBackground: "#f5ebe0",
        pillBackground: "rgba(245,235,224,0.45)",
        hourHandColor: "#3d2117",
        minuteHandColor: "#3d2117",
        secondHandColor: "#ff6f61",
        numberColor: "#3d2117",
        tickColor: "#3d2117",
        minuteTickColor: "rgba(61,33,23,0.35)",
        labelColor: "#f5ebe0",
        gmtColor: "rgba(245,235,224,0.6)",
        cityColor: "#f5ebe0",
        centerDotColor: "#3d2117",
        clockBorderColor: "rgba(61,33,23,0.12)",
    },
    Minimal: {
        cardBackground: "#ffffff",
        clockFaceBackground: "#ffffff",
        pillBackground: "rgba(0,0,0,0.03)",
        hourHandColor: "#000000",
        minuteHandColor: "#000000",
        secondHandColor: "#000000",
        numberColor: "#000000",
        tickColor: "#000000",
        minuteTickColor: "rgba(0,0,0,0.2)",
        labelColor: "#000000",
        gmtColor: "rgba(0,0,0,0.4)",
        cityColor: "#000000",
        centerDotColor: "#000000",
        clockBorderColor: "rgba(0,0,0,0.06)",
    },
    Classic: {
        cardBackground: "#f5f0e8",
        clockFaceBackground: "#fffdf7",
        pillBackground: "rgba(255,253,247,0.5)",
        hourHandColor: "#8b6914",
        minuteHandColor: "#8b6914",
        secondHandColor: "#c49b2a",
        numberColor: "#2c2416",
        tickColor: "#2c2416",
        minuteTickColor: "rgba(44,36,22,0.3)",
        labelColor: "#2c2416",
        gmtColor: "rgba(44,36,22,0.5)",
        cityColor: "#2c2416",
        centerDotColor: "#8b6914",
        clockBorderColor: "rgba(139,105,20,0.15)",
    },
}

const THEME_KEYS = Object.keys(THEMES)

// ═══════════════════════════════════════════════════════════════════════════════
// TIME HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getTimeForOffset(utcOffsetHours: number): {
    hours: number
    minutes: number
    seconds: number
    milliseconds: number
} {
    const now = new Date()
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000
    const targetMs = utcMs + utcOffsetHours * 60 * 60 * 1000
    const targetDate = new Date(targetMs)
    return {
        hours: targetDate.getHours(),
        minutes: targetDate.getMinutes(),
        seconds: targetDate.getSeconds(),
        milliseconds: targetDate.getMilliseconds(),
    }
}

function formatGmtOffset(offset: number): string {
    const sign = offset >= 0 ? "+" : ""
    if (offset % 1 === 0) return `GMT ${sign}${offset}`
    const h = Math.floor(Math.abs(offset))
    const m = (Math.abs(offset) % 1) * 60
    const sn = offset >= 0 ? "+" : "-"
    return `GMT ${sn}${h}:${m.toString().padStart(2, "0")}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLOCK FACE COMPONENT (SVG)
// ═══════════════════════════════════════════════════════════════════════════════

interface ClockFaceProps {
    size: number
    hours: number
    minutes: number
    seconds: number
    milliseconds: number
    showNumbers: boolean
    showSecondHand: boolean
    showMinuteTicks: boolean
    handStyle: "rounded" | "square"
    colors: {
        faceBackground: string
        hourHand: string
        minuteHand: string
        secondHand: string
        numbers: string
        ticks: string
        minuteTicks: string
        centerDot: string
        border: string
    }
}

function ClockFace({
    size,
    hours,
    minutes,
    seconds,
    milliseconds,
    showNumbers,
    showSecondHand,
    showMinuteTicks,
    handStyle,
    colors,
}: ClockFaceProps) {
    const cx = 50
    const cy = 50
    const radius = 45
    const lineCap = handStyle === "rounded" ? "round" : "butt"

    // Smooth hand angles
    const secondAngle = (seconds + milliseconds / 1000) * 6 // 360/60
    const minuteAngle = (minutes + seconds / 60) * 6
    const hourAngle = ((hours % 12) + minutes / 60 + seconds / 3600) * 30 // 360/12

    // Hand dimensions relative to viewBox (100x100)
    const hourHandLength = showNumbers ? 20 : 21
    const minuteHandLength = showNumbers ? 30 : 32
    const secondHandLength = showNumbers ? 36 : 37
    const secondTailLength = 10

    const hourHandWidth = showNumbers ? 3 : 2.6
    const minuteHandWidth = showNumbers ? 2 : 1.8
    const secondHandWidth = showNumbers ? 1.8 : 1.3

    // Generate tick marks
    const ticks: React.ReactNode[] = []
    for (let i = 0; i < 60; i++) {
        const angle = (i * 6 - 90) * (Math.PI / 180)
        const isHour = i % 5 === 0

        if (!isHour && !showMinuteTicks) continue

        const outerR = radius - 0.5
        const innerR = isHour ? radius - 5 : radius - 2.5
        const x1 = cx + outerR * Math.cos(angle)
        const y1 = cy + outerR * Math.sin(angle)
        const x2 = cx + innerR * Math.cos(angle)
        const y2 = cy + innerR * Math.sin(angle)

        ticks.push(
            <line
                key={`tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isHour ? colors.ticks : colors.minuteTicks}
                strokeWidth={isHour ? 1.3 : 0.4}
                strokeLinecap={lineCap}
            />
        )
    }

    // Generate numbers
    const numbers: React.ReactNode[] = []
    if (showNumbers) {
        const hourNums = [12, 3, 6, 9] as const
        const hourPositions = [
            { x: cx, y: cy - radius + 19 },
            { x: cx + radius - 18, y: cy + 1 },
            { x: cx, y: cy + radius - 19 },
            { x: cx - radius + 18, y: cy + 1 },
        ]
        hourNums.forEach((num, i) => {
            numbers.push(
                <text
                    key={`num-${num}`}
                    x={hourPositions[i].x}
                    y={hourPositions[i].y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={colors.numbers}
                    fontSize={18}
                    fontFamily="'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    fontWeight="500"
                >
                    {num}
                </text>
            )
        })
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            style={{ display: "block" }}
        >
            {/* Clock face background */}
            <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={colors.faceBackground}
                stroke={colors.border}
                strokeWidth={0.5}
            />

            {/* Tick marks */}
            {ticks}

            {/* Numbers */}
            {numbers}

            {/* Hour hand */}
            <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - hourHandLength}
                stroke={colors.hourHand}
                strokeWidth={hourHandWidth}
                strokeLinecap={lineCap}
                transform={`rotate(${hourAngle}, ${cx}, ${cy})`}
            />

            {/* Minute hand */}
            <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - minuteHandLength}
                stroke={colors.minuteHand}
                strokeWidth={minuteHandWidth}
                strokeLinecap={lineCap}
                transform={`rotate(${minuteAngle}, ${cx}, ${cy})`}
            />

            {/* Second hand */}
            {showSecondHand && (
                <g transform={`rotate(${secondAngle}, ${cx}, ${cy})`}>
                    {/* Tail */}
                    <line
                        x1={cx}
                        y1={cy}
                        x2={cx}
                        y2={cy + secondTailLength}
                        stroke={colors.secondHand}
                        strokeWidth={secondHandWidth}
                        strokeLinecap={lineCap}
                    />
                    {/* Main */}
                    <line
                        x1={cx}
                        y1={cy}
                        x2={cx}
                        y2={cy - secondHandLength}
                        stroke={colors.secondHand}
                        strokeWidth={secondHandWidth}
                        strokeLinecap={lineCap}
                    />
                </g>
            )}

            {/* Center dot - iOS donut style */}
            <circle cx={cx} cy={cy} r={2.2} fill={colors.centerDot} />
            <circle cx={cx} cy={cy} r={1} fill={colors.faceBackground} />
        </svg>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ClockConfig {
    city: string
    label: string
    visible: boolean
}

interface ColorsConfig {
    cardBackground: string
    clockFaceBackground: string
    pillBackground: string
    hourHandColor: string
    minuteHandColor: string
    secondHandColor: string
    numberColor: string
    tickColor: string
    minuteTickColor: string
    labelColor: string
    gmtColor: string
    cityColor: string
    centerDotColor: string
    clockBorderColor: string
}

interface ClockStyleConfig {
    showSecondHand: boolean
    showNumbers: boolean
    showMinuteTicks: boolean
    handStyle: "rounded" | "square"
}

interface Props {
    theme: string
    mainClock: { city: string }
    clock2: ClockConfig
    clock3: ClockConfig
    clock4: ClockConfig
    colors: ColorsConfig
    fontFamily?: {
        fontFamily?: string
        fontWeight?: number | string
    }
    clockStyle: ClockStyleConfig
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 340
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ClocksiOS(props: Props) {
    const {
        theme = "iOS Light",
        mainClock = {} as { city: string },
        clock2 = {} as ClockConfig,
        clock3 = {} as ClockConfig,
        clock4 = {} as ClockConfig,
        colors = {} as ColorsConfig,
        fontFamily: fontFamilyProp,
        clockStyle = {} as ClockStyleConfig,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // ─── Resolve theme + color overrides ──────────────────────────────
    const themeColors = THEMES[theme] || THEMES["iOS Light"]

    const cardBackground = colors.cardBackground ?? themeColors.cardBackground
    const clockFaceBackground =
        colors.clockFaceBackground ?? themeColors.clockFaceBackground
    const pillBackground = colors.pillBackground ?? themeColors.pillBackground
    const hourHandColor = colors.hourHandColor ?? themeColors.hourHandColor
    const minuteHandColor =
        colors.minuteHandColor ?? themeColors.minuteHandColor
    const secondHandColor =
        colors.secondHandColor ?? themeColors.secondHandColor
    const numberColor = colors.numberColor ?? themeColors.numberColor
    const tickColor = colors.tickColor ?? themeColors.tickColor
    const minuteTickColor =
        colors.minuteTickColor ?? themeColors.minuteTickColor
    const labelColor = colors.labelColor ?? themeColors.labelColor
    const gmtColor = colors.gmtColor ?? themeColors.gmtColor
    const cityColor = colors.cityColor ?? themeColors.cityColor
    const centerDotColor = colors.centerDotColor ?? themeColors.centerDotColor
    const clockBorderColor =
        colors.clockBorderColor ?? themeColors.clockBorderColor

    // ─── Resolve clock style ────────────────────────────────────────
    const showSecondHand = clockStyle.showSecondHand ?? true
    const showNumbers = clockStyle.showNumbers ?? true
    const showMinuteTicks = clockStyle.showMinuteTicks ?? true
    const handStyle = clockStyle.handStyle ?? "rounded"

    // ─── Resolve font ───────────────────────────────────────────────
    const fontFamily = fontFamilyProp?.fontFamily
        ? `${fontFamilyProp.fontFamily}, 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`
        : "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    const fontWeight = fontFamilyProp?.fontWeight || 400

    // ─── Resolve cities ─────────────────────────────────────────────
    const mainCity = mainClock.city ?? "Kyiv"
    const city2 = clock2.city ?? "New York"
    const city3 = clock3.city ?? "Florence"
    const city4 = clock4.city ?? "Dublin"
    const label2 = clock2.label ?? TIMEZONES[city2]?.abbreviation ?? "NY"
    const label3 = clock3.label ?? TIMEZONES[city3]?.abbreviation ?? "FLO"
    const label4 = clock4.label ?? TIMEZONES[city4]?.abbreviation ?? "DUB"
    const show2 = clock2.visible ?? true
    const show3 = clock3.visible ?? true
    const show4 = clock4.visible ?? true

    const visibleSmallClocks = [
        show2 ? { city: city2, label: label2 } : null,
        show3 ? { city: city3, label: label3 } : null,
        show4 ? { city: city4, label: label4 } : null,
    ].filter(Boolean) as { city: string; label: string }[]

    // ─── Animation loop ─────────────────────────────────────────────
    const [, forceUpdate] = useState(0)
    const rafRef = useRef<number | null>(null)

    const tick = useCallback(() => {
        forceUpdate((v) => v + 1)
        rafRef.current = requestAnimationFrame(tick)
    }, [])

    useEffect(() => {
        if (isCanvas) return
        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [tick, isCanvas])

    // ─── Container measurement ──────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ w: 340, h: 340 })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const update = () => {
            setContainerSize({ w: el.offsetWidth, h: el.offsetHeight })
        }
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // ─── Sizing calculations ────────────────────────────────────────
    const baseSize = Math.min(containerSize.w, containerSize.h)
    const scale = baseSize / 340
    const mainClockSize = Math.round(118 * scale)
    const smallClockSize = Math.round(74 * scale)
    const cardBorderRadius = Math.round(36 * scale)
    const pillBorderRadius = 9999
    const innerPadding = Math.round(16 * scale)
    const gmtFontSize = Math.max(12, Math.round(17 * scale))
    const cityFontSize = Math.max(18, Math.round(38 * scale))
    const labelFontSize = Math.max(14, Math.round(24 * scale))

    // ─── Resolve time for each clock ────────────────────────────────
    const mainTz = TIMEZONES[mainCity] || TIMEZONES["Kyiv"]
    const mainTime = getTimeForOffset(mainTz.offset)

    const getSmallClockTime = (city: string) => {
        const tz = TIMEZONES[city] || TIMEZONES["UTC"]
        return getTimeForOffset(tz.offset)
    }

    // ─── Clock face color helper ────────────────────────────────────
    const faceColors = {
        faceBackground: clockFaceBackground,
        hourHand: hourHandColor,
        minuteHand: minuteHandColor,
        secondHand: secondHandColor,
        numbers: numberColor,
        ticks: tickColor,
        minuteTicks: minuteTickColor,
        centerDot: centerDotColor,
        border: clockBorderColor,
    }

    // ─── Render ─────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                isolation: "isolate",
                zIndex: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    width: baseSize,
                    height: baseSize,
                    backgroundColor: cardBackground,
                    borderRadius: cardBorderRadius,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: Math.round(20 * scale),
                    padding: innerPadding,
                    boxSizing: "border-box",
                    boxShadow: `0 ${Math.round(2 * scale)}px ${Math.round(
                        8 * scale
                    )}px rgba(0,0,0,0.08), 0 ${Math.round(
                        1 * scale
                    )}px ${Math.round(3 * scale)}px rgba(0,0,0,0.04)`,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* ── Top section: pill with main clock + city ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: Math.round(18 * scale),
                        backgroundColor: pillBackground,
                        borderRadius: pillBorderRadius,
                        padding: `${Math.round(12 * scale)}px ${Math.round(
                            40 * scale
                        )}px ${Math.round(12 * scale)}px ${Math.round(
                            14 * scale
                        )}px`,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        flexShrink: 0,
                    }}
                >
                    {/* Main clock face */}
                    <div
                        style={{
                            width: mainClockSize,
                            height: mainClockSize,
                            flexShrink: 0,
                            filter: `drop-shadow(0 ${Math.round(
                                1 * scale
                            )}px ${Math.round(3 * scale)}px rgba(0,0,0,0.1))`,
                        }}
                    >
                        <ClockFace
                            size={mainClockSize}
                            hours={mainTime.hours}
                            minutes={mainTime.minutes}
                            seconds={mainTime.seconds}
                            milliseconds={isCanvas ? 0 : mainTime.milliseconds}
                            showNumbers={showNumbers}
                            showSecondHand={showSecondHand}
                            showMinuteTicks={showMinuteTicks}
                            handStyle={handStyle}
                            colors={faceColors}
                        />
                    </div>

                    {/* City info */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: Math.round(2 * scale),
                        }}
                    >
                        <span
                            style={{
                                fontFamily,
                                fontWeight: fontWeight || 800,
                                fontSize: gmtFontSize,
                                color: gmtColor,
                                lineHeight: 1.3,
                                letterSpacing: "0.02em",
                            }}
                        >
                            {formatGmtOffset(mainTz.offset)}
                        </span>
                        <span
                            style={{
                                fontFamily,
                                fontWeight: fontWeight || 900,
                                fontSize: cityFontSize,
                                color: cityColor,
                                lineHeight: 1.1,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {mainTz.fullName}
                        </span>
                    </div>
                </div>

                {/* ── Bottom section: small clocks ── */}
                {visibleSmallClocks.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap:
                                Math.round(
                                    visibleSmallClocks.length <= 2 ? 32 : 24
                                ) * scale,
                            flexShrink: 0,
                        }}
                    >
                        {visibleSmallClocks.map((sc) => {
                            const t = getSmallClockTime(sc.city)
                            return (
                                <div
                                    key={sc.city + sc.label}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: Math.round(8 * scale),
                                    }}
                                >
                                    <div
                                        style={{
                                            width: smallClockSize,
                                            height: smallClockSize,
                                            filter: `drop-shadow(0 ${Math.round(
                                                1 * scale
                                            )}px ${Math.round(
                                                2 * scale
                                            )}px rgba(0,0,0,0.08))`,
                                        }}
                                    >
                                        <ClockFace
                                            size={smallClockSize}
                                            hours={t.hours}
                                            minutes={t.minutes}
                                            seconds={t.seconds}
                                            milliseconds={
                                                isCanvas ? 0 : t.milliseconds
                                            }
                                            showNumbers={false}
                                            showSecondHand={showSecondHand}
                                            showMinuteTicks={showMinuteTicks}
                                            handStyle={handStyle}
                                            colors={faceColors}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontFamily,
                                            fontWeight: fontWeight || 900,
                                            fontSize: labelFontSize,
                                            color: labelColor,
                                            lineHeight: 1,
                                            letterSpacing: "0.02em",
                                            textAlign: "center",
                                        }}
                                    >
                                        {sc.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT PROPS
// ═══════════════════════════════════════════════════════════════════════════════

ClocksiOS.defaultProps = {
    theme: "iOS Light",
    mainClock: { city: "Kyiv" },
    clock2: { city: "New York", label: "NY", visible: true },
    clock3: { city: "Florence", label: "FLO", visible: true },
    clock4: { city: "Dublin", label: "DUB", visible: true },
    clockStyle: {
        showSecondHand: true,
        showNumbers: true,
        showMinuteTicks: true,
        handStyle: "rounded",
    },
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPERTY CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════

addPropertyControls(ClocksiOS, {
    // ─── Theme ────────────────────────────────────────────────────────
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: THEME_KEYS,
        defaultValue: "iOS Light",
        description:
            "Select a preset theme. Individual color overrides below will take priority.",
    },

    // ─── Main Clock ──────────────────────────────────────────────────
    mainClock: {
        type: ControlType.Object,
        title: "Main Clock",
        icon: "effect",
        controls: {
            city: {
                type: ControlType.Enum,
                title: "City",
                options: TIMEZONE_KEYS,
                defaultValue: "Kyiv",
            },
        },
    },

    // ─── Clock 2 ─────────────────────────────────────────────────────
    clock2: {
        type: ControlType.Object,
        title: "Clock 2",
        icon: "effect",
        controls: {
            city: {
                type: ControlType.Enum,
                title: "City",
                options: TIMEZONE_KEYS,
                defaultValue: "New York",
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "NY",
                description: "Short label shown below the clock.",
            },
            visible: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
            },
        },
    },

    // ─── Clock 3 ─────────────────────────────────────────────────────
    clock3: {
        type: ControlType.Object,
        title: "Clock 3",
        icon: "effect",
        controls: {
            city: {
                type: ControlType.Enum,
                title: "City",
                options: TIMEZONE_KEYS,
                defaultValue: "Florence",
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "FLO",
                description: "Short label shown below the clock.",
            },
            visible: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
            },
        },
    },

    // ─── Clock 4 ─────────────────────────────────────────────────────
    clock4: {
        type: ControlType.Object,
        title: "Clock 4",
        icon: "effect",
        controls: {
            city: {
                type: ControlType.Enum,
                title: "City",
                options: TIMEZONE_KEYS,
                defaultValue: "Dublin",
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "DUB",
                description: "Short label shown below the clock.",
            },
            visible: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
            },
        },
    },

    // ─── Colors ──────────────────────────────────────────────────────
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        optional: true,
        buttonTitle: "Color Overrides",
        controls: {
            cardBackground: {
                type: ControlType.Color,
                title: "Card BG",
                optional: true,
            },
            clockFaceBackground: {
                type: ControlType.Color,
                title: "Clock Face BG",
                optional: true,
            },
            pillBackground: {
                type: ControlType.Color,
                title: "Pill BG",
                optional: true,
            },
            hourHandColor: {
                type: ControlType.Color,
                title: "Hour Hand",
                optional: true,
            },
            minuteHandColor: {
                type: ControlType.Color,
                title: "Minute Hand",
                optional: true,
            },
            secondHandColor: {
                type: ControlType.Color,
                title: "Second Hand",
                optional: true,
            },
            numberColor: {
                type: ControlType.Color,
                title: "Numbers",
                optional: true,
            },
            tickColor: {
                type: ControlType.Color,
                title: "Ticks",
                optional: true,
            },
            minuteTickColor: {
                type: ControlType.Color,
                title: "Minute Ticks",
                optional: true,
            },
            labelColor: {
                type: ControlType.Color,
                title: "City Labels",
                optional: true,
            },
            gmtColor: {
                type: ControlType.Color,
                title: "GMT Text",
                optional: true,
            },
            cityColor: {
                type: ControlType.Color,
                title: "City Name",
                optional: true,
            },
            centerDotColor: {
                type: ControlType.Color,
                title: "Center Dot",
                optional: true,
            },
            clockBorderColor: {
                type: ControlType.Color,
                title: "Clock Border",
                optional: true,
            },
        },
    },

    // ─── Typography ──────────────────────────────────────────────────
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },

    // ─── Clock Style ─────────────────────────────────────────────────
    clockStyle: {
        type: ControlType.Object,
        title: "Clock Style",
        icon: "object",
        controls: {
            showSecondHand: {
                type: ControlType.Boolean,
                title: "Second Hand",
                defaultValue: true,
            },
            showNumbers: {
                type: ControlType.Boolean,
                title: "Hour Numbers",
                defaultValue: true,
                description: "Show 12, 3, 6, 9 on the main clock.",
            },
            showMinuteTicks: {
                type: ControlType.Boolean,
                title: "Minute Ticks",
                defaultValue: true,
            },
            handStyle: {
                type: ControlType.Enum,
                title: "Hand Style",
                options: ["rounded", "square"],
                optionTitles: ["Rounded", "Square"],
                defaultValue: "rounded",
                displaySegmentedControl: true,
            },
        },
    },
})
