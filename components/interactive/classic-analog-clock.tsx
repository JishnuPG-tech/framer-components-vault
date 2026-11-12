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


// Component made by Moe Kyaw, All rights reserved.

type FontControlValue = {
    fontFamily?: string
    fontSize?: string | number
    fontStyle?: string
    fontWeight?: string | number
    letterSpacing?: string | number
    lineHeight?: string | number
    fontFeatureSettings?: string
    fontVariationSettings?: string
    fontKerning?: string
    fontVariantLigatures?: string
    fontVariantCaps?: string
    fontVariantNumeric?: string
    fontVariantAlternates?: string
    fontVariantEastAsian?: string
    textAlign?: "left" | "center" | "right"
    variant?: string
}

type Props = {
    timeMode: "local" | "custom"
    customGMTText: string
    manualHour: number
    manualMinute: number
    manualSecond: number
    showSecondHand: boolean
    secondHandMotion: "digital" | "quartz" | "mechanical"
    labelMode: "label" | "image"
    label: string
    labelImage?: {
        src?: string
        srcSet?: string
        alt?: string
    }
    labelImageSize: number
    labelFont: FontControlValue
    dateFont: FontControlValue
    numberFont: FontControlValue
    autoThemeFromColor: boolean
    themeColor: string
    faceColor: string
    darkFaceColor: string
    majorTickColor: string
    minorTickColor: string
    labelColor: string
    numberColor: string
    darkMajorTickColor: string
    darkMinorTickColor: string
    darkLabelColor: string
    darkNumberColor: string
    hourHandColor: string
    minuteHandColor: string
    secondHandColor: string
    axleColor: string
    dateWindowFill: string
    darkDateWindowFill: string
    dateTextColor: string
    darkDateTextColor: string
    dateWindowShadow: any
    darkDateWindowShadow: any
    darkHourHandColor: string
    darkMinuteHandColor: string
    darkSecondHandColor: string
    darkAxleColor: string
}

const numeralPositions = [
    { value: "12", angle: 0, dx: 0, dy: 1 },
    { value: "3", angle: 90, dx: 1, dy: 0 },
    { value: "6", angle: 180, dx: 0, dy: -1 },
    { value: "9", angle: 270, dx: -1, dy: 0 },
]

function polarToCartesian(angle: number, radius: number) {
    const radians = ((angle - 90) * Math.PI) / 180
    return {
        x: 50 + Math.cos(radians) * radius,
        y: 50 + Math.sin(radians) * radius,
    }
}

function useClockTime(
    timeMode: "local" | "custom",
    customGMTText: string,
    manualHour: number,
    manualMinute: number,
    manualSecond: number,
    secondHandMotion: "digital" | "quartz" | "mechanical",
    isStaticRenderer: boolean
) {
    const isBrowser = typeof window !== "undefined"
    const useClientLayoutEffect = isBrowser
        ? React.useLayoutEffect
        : React.useEffect
    const staticNow = React.useMemo(() => new Date(), [])
    const [now, setNow] = React.useState<Date | null>(() =>
        isStaticRenderer ? staticNow : null
    )
    const [isReady, setIsReady] = React.useState(isStaticRenderer)

    useClientLayoutEffect(() => {
        if (!isBrowser || isStaticRenderer) return

        const syncNow = () => {
            setNow(new Date())
            setIsReady(true)
        }

        let frameId = 0
        let intervalId = 0

        syncNow()

        if (secondHandMotion !== "quartz") {
            const tick = () => {
                syncNow()
                frameId = window.requestAnimationFrame(tick)
            }

            frameId = window.requestAnimationFrame(tick)
        } else {
            intervalId = window.setInterval(syncNow, 250)
        }

        const handleVisibilityChange = () => {
            if (!document.hidden) syncNow()
        }

        const handleFocus = () => syncNow()

        document.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("focus", handleFocus)

        return () => {
            if (frameId) window.cancelAnimationFrame(frameId)
            if (intervalId) window.clearInterval(intervalId)
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )
            window.removeEventListener("focus", handleFocus)
        }
    }, [timeMode, secondHandMotion, isBrowser, isStaticRenderer])

    const resolvedNow = isStaticRenderer ? (now ?? staticNow) : now

    if (!resolvedNow || !isReady) {
        return {
            hour: manualHour,
            minute: manualMinute,
            second: manualSecond,
            date: 12,
            isReady,
        }
    }

    if (timeMode === "local") {
        return {
            hour: resolvedNow.getHours(),
            minute: resolvedNow.getMinutes(),
            second:
                resolvedNow.getSeconds() + resolvedNow.getMilliseconds() / 1000,
            date: resolvedNow.getDate(),
            isReady,
        }
    }

    if (timeMode === "custom") {
        const parsedOffset = parseGMTOffset(customGMTText)
        const shifted = new Date(resolvedNow.getTime() + parsedOffset * 3600000)

        return {
            hour: shifted.getUTCHours(),
            minute: shifted.getUTCMinutes(),
            second:
                shifted.getUTCSeconds() + shifted.getUTCMilliseconds() / 1000,
            date: shifted.getUTCDate(),
            isReady,
        }
    }

    return {
        hour: manualHour,
        minute: manualMinute,
        second: manualSecond,
        date: 12,
        isReady,
    }
}

function parseGMTOffset(value: string): number {
    const normalized = value.trim().toUpperCase()
    const match = normalized.match(/^GMT\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/)

    if (!match) return 0

    const sign = match[1] === "-" ? -1 : 1
    const hours = Number(match[2])
    const minutes = match[3] ? Number(match[3]) : 0

    if (hours > 14 || minutes >= 60) return 0
    return sign * (hours + minutes / 60)
}

function toPx(value: string | number | undefined, fallback: number): number {
    if (typeof value === "number") return value
    if (typeof value === "string") {
        const parsed = parseFloat(value)
        if (Number.isFinite(parsed)) return parsed
    }
    return fallback
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function getFontWeight(
    font: FontControlValue,
    fallback: number
): string | number {
    if (font.fontWeight !== undefined) return font.fontWeight
    if (font.variant === "Bold") return 700
    if (font.variant === "Semibold") return 600
    if (font.variant === "Medium") return 500
    if (font.variant === "Light") return 300
    return fallback
}

function getFontStyle(font: FontControlValue): string {
    if (font.fontStyle) return font.fontStyle
    if (font.variant?.toLowerCase().includes("italic")) return "italic"
    return "normal"
}

function getSvgTextStyle(
    font: FontControlValue,
    fallbackSize: number,
    fallbackLetterSpacing: string,
    fallbackWeight: number
): React.CSSProperties {
    return {
        fontFamily:
            font.fontFamily ||
            '"Arial Narrow", "Helvetica Neue", Arial, sans-serif',
        fontSize: toPx(font.fontSize, fallbackSize),
        fontWeight: getFontWeight(font, fallbackWeight),
        fontStyle: getFontStyle(font),
        letterSpacing: font.letterSpacing ?? fallbackLetterSpacing,
        fontFeatureSettings: font.fontFeatureSettings,
        fontVariationSettings: font.fontVariationSettings,
        fontKerning: font.fontKerning as React.CSSProperties["fontKerning"],
        fontVariantLigatures: font.fontVariantLigatures,
        fontVariantCaps:
            font.fontVariantCaps as React.CSSProperties["fontVariantCaps"],
        fontVariantNumeric: font.fontVariantNumeric,
        fontVariantAlternates: font.fontVariantAlternates,
        fontVariantEastAsian: font.fontVariantEastAsian,
    } as React.CSSProperties
}

function boxShadowToCss(shadows: any): string {
    if (!shadows) return "none"
    if (typeof shadows === "string") return shadows

    if (typeof shadows === "object" && !Array.isArray(shadows)) {
        const direct = shadows.boxShadow ?? shadows.value ?? shadows.css
        if (typeof direct === "string" && direct.trim()) return direct
        if (shadows.shadow) return boxShadowToCss(shadows.shadow)
        if (shadows.shadows) return boxShadowToCss(shadows.shadows)
    }

    const num = (v: any) => {
        if (typeof v === "number") return v
        if (typeof v === "string") {
            const n = parseFloat(v)
            return Number.isFinite(n) ? n : 0
        }
        if (v && typeof v === "object" && typeof v.value === "number") {
            return v.value
        }
        return 0
    }

    const one = (sh: any) => {
        if (!sh) return null
        if (typeof sh === "string") return sh

        const x = num(sh.x ?? sh.offsetX)
        const y = num(sh.y ?? sh.offsetY)
        const blur = num(sh.blur ?? sh.blurRadius)
        const spread = num(sh.spread ?? sh.spreadRadius)
        const color = sh.color ?? "rgba(0,0,0,0.2)"
        const inset = sh.inset ? "inset " : ""

        return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`
    }

    if (Array.isArray(shadows)) {
        const parts = shadows.map(one).filter(Boolean)
        return parts.length ? parts.join(", ") : "none"
    }

    if (typeof shadows === "object") {
        return one(shadows) || "none"
    }

    return "none"
}

function parseOklch(value: string) {
    const match = value
        .trim()
        .match(
            /^oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)$/i
        )

    if (!match) return null

    const lightness = match[1].endsWith("%")
        ? parseFloat(match[1]) / 100
        : parseFloat(match[1])
    const chroma = parseFloat(match[2])
    const hue = parseFloat(match[3])
    const alphaRaw = match[4]
    const alpha = alphaRaw
        ? alphaRaw.endsWith("%")
            ? parseFloat(alphaRaw) / 100
            : parseFloat(alphaRaw)
        : 1

    if (
        !Number.isFinite(lightness) ||
        !Number.isFinite(chroma) ||
        !Number.isFinite(hue) ||
        !Number.isFinite(alpha)
    ) {
        return null
    }

    return {
        l: clamp(lightness, 0, 1),
        c: Math.max(0, chroma),
        h: ((hue % 360) + 360) % 360,
        a: clamp(alpha, 0, 1),
    }
}

function formatOklch(l: number, c: number, h: number, a = 1): string {
    const lightness = clamp(l, 0, 1).toFixed(3)
    const chroma = Math.max(0, c).toFixed(3)
    const hue = (((h % 360) + 360) % 360).toFixed(1)
    const alpha = clamp(a, 0, 1)

    return alpha < 1
        ? `oklch(${lightness} ${chroma} ${hue} / ${alpha.toFixed(3)})`
        : `oklch(${lightness} ${chroma} ${hue})`
}

function buildAutoTheme(themeColor: string) {
    const parsed = parseOklch(themeColor)
    if (!parsed) return null

    const { l, c, h } = parsed

    return {
        light: {
            faceColor: formatOklch(0.985, c * 0.05, h),
            majorTickColor: formatOklch(0.24, c * 0.35, h),
            minorTickColor: formatOklch(0.38, c * 0.22, h),
            labelColor: formatOklch(0.42, c * 0.12, h),
            numberColor: formatOklch(0.22, c * 0.3, h),
            hourHandColor: formatOklch(0.2, c * 0.25, h),
            minuteHandColor: formatOklch(0.2, c * 0.25, h),
            secondHandColor: formatOklch(
                clamp(l, 0.45, 0.72),
                Math.max(0.08, c),
                h
            ),
            axleColor: formatOklch(clamp(l, 0.45, 0.72), Math.max(0.08, c), h),
            dateWindowFill: formatOklch(0.92, c * 0.02, h),
            dateWindowShadow: `inset 0px 1px 2px 0px ${formatOklch(
                0.74,
                c * 0.02,
                h,
                0.9
            )}`,
            dateTextColor: formatOklch(0.22, c * 0.03, h),
        },
        dark: {
            faceColor: formatOklch(0.3, c * 0.08, h),
            majorTickColor: formatOklch(0.9, c * 0.12, h),
            minorTickColor: formatOklch(0.68, c * 0.08, h),
            labelColor: formatOklch(0.72, c * 0.05, h),
            numberColor: formatOklch(0.92, c * 0.1, h),
            hourHandColor: formatOklch(0.94, c * 0.08, h),
            minuteHandColor: formatOklch(0.94, c * 0.08, h),
            secondHandColor: formatOklch(
                clamp(l, 0.65, 0.82),
                Math.max(0.07, c),
                h
            ),
            axleColor: formatOklch(clamp(l, 0.65, 0.82), Math.max(0.07, c), h),
            dateWindowFill: formatOklch(0.25, c * 0.01, h),
            dateWindowShadow: `inset 0px 1px 2px 0px ${formatOklch(
                0.18,
                c * 0.01,
                h,
                0.85
            )}`,
            dateTextColor: formatOklch(0.97, c * 0.005, h),
        },
    }
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 320
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ClassicClock(props: Props) {
    const {
        timeMode = "local",
        customGMTText = "GMT+0",
        manualHour = 10,
        manualMinute = 10,
        manualSecond = 35,
        showSecondHand = true,
        secondHandMotion = "quartz",
        labelMode = "label",
        label = "Local Time",
        labelImage,
        labelImageSize = 18,
        labelFont = {
            fontFamily: "Geist",
            fontSize: "6px",
            lineHeight: "1em",
            letterSpacing: "-0.03em",
            variant: "Semibold",
            textAlign: "center",
        },
        dateFont = {
            fontFamily: "Geist",
            fontSize: "5px",
            lineHeight: "1em",
            letterSpacing: "0em",
            variant: "Semibold",
            textAlign: "center",
        },
        numberFont = {
            fontFamily: "Geist",
            fontSize: "9px",
            lineHeight: "1em",
            letterSpacing: "0em",
            variant: "Regular",
            textAlign: "center",
        },
        autoThemeFromColor = true,
        themeColor = "oklch(0.62 0.19 42)",
        faceColor = "#F7F5EF",
        darkFaceColor = "#101010",
        majorTickColor = "#1D1D1D",
        minorTickColor = "#444444",
        labelColor = "#6C6C6C",
        numberColor = "#111111",
        darkMajorTickColor = "#F5F1E8",
        darkMinorTickColor = "#9B9B9B",
        darkLabelColor = "#B7B7B7",
        darkNumberColor = "#F5F1E8",
        hourHandColor = "#111111",
        minuteHandColor = "#111111",
        secondHandColor = "#FF4F0C",
        axleColor = "#FF4F0C",
        dateWindowFill = "#E2DFD7",
        darkDateWindowFill = "#8A8478",
        dateTextColor = "#1D1D1D",
        darkDateTextColor = "#FFFFFF",
        dateWindowShadow = [
            {
                inset: true,
                x: 0,
                y: 1,
                blur: 2,
                spread: 0,
                diffusion: 0,
                focus: 0,
                color: "rgba(163, 158, 149, 0.88)",
            },
        ] as any,
        darkDateWindowShadow = [
            {
                inset: true,
                x: 0,
                y: 1,
                blur: 2,
                spread: 0,
                diffusion: 0,
                focus: 0,
                color: "rgba(22, 22, 22, 0.95)",
            },
        ] as any,
        darkHourHandColor = "#F5F1E8",
        darkMinuteHandColor = "#F5F1E8",
        darkSecondHandColor = "#FF4F0C",
        darkAxleColor = "#FF4F0C",
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const time = useClockTime(
        timeMode,
        customGMTText,
        manualHour,
        manualMinute,
        manualSecond,
        secondHandMotion,
        isStaticRenderer
    )

    const displayedSecond =
        secondHandMotion === "quartz"
            ? Math.floor(time.second)
            : secondHandMotion === "mechanical"
              ? Math.floor(time.second * 8) / 8
              : time.second
    const shouldHideUntilReady =
        (timeMode === "local" || timeMode === "custom") && !time.isReady
    const faceRadius = 49
    const innerRingRadius = 47.6
    const tickOuterRadius = 46
    const tickInnerMajorRadius = 42.2
    const tickInnerMinorRadius = 43.8
    const numeralRadius = 37.6
    const labelY = 31
    const dateY = 68.2
    const secondAngle = displayedSecond * 6
    const minuteAngle = time.minute * 6 + displayedSecond * 0.1
    const hourAngle = ((time.hour % 12) + time.minute / 60) * 30
    const isNight = time.hour < 6 || time.hour >= 19
    const autoTheme = autoThemeFromColor ? buildAutoTheme(themeColor) : null
    const activeTheme = autoTheme
        ? isNight
            ? autoTheme.dark
            : autoTheme.light
        : null

    const currentFaceColor =
        activeTheme?.faceColor || (isNight ? darkFaceColor : faceColor)
    const currentMajorTickColor =
        activeTheme?.majorTickColor ||
        (isNight ? darkMajorTickColor : majorTickColor)
    const currentMinorTickColor =
        activeTheme?.minorTickColor ||
        (isNight ? darkMinorTickColor : minorTickColor)
    const currentLabelColor =
        activeTheme?.labelColor || (isNight ? darkLabelColor : labelColor)
    const currentNumberColor =
        activeTheme?.numberColor || (isNight ? darkNumberColor : numberColor)
    const currentHourHandColor =
        activeTheme?.hourHandColor ||
        (isNight ? darkHourHandColor : hourHandColor)
    const currentMinuteHandColor =
        activeTheme?.minuteHandColor ||
        (isNight ? darkMinuteHandColor : minuteHandColor)
    const currentSecondHandColor =
        activeTheme?.secondHandColor ||
        (isNight ? darkSecondHandColor : secondHandColor)
    const currentAxleColor =
        activeTheme?.axleColor || (isNight ? darkAxleColor : axleColor)
    const currentDateWindowFill =
        activeTheme?.dateWindowFill ||
        (isNight ? darkDateWindowFill : dateWindowFill)
    const currentDateWindowShadow =
        activeTheme?.dateWindowShadow ||
        boxShadowToCss(isNight ? darkDateWindowShadow : dateWindowShadow)
    const currentDateTextColor =
        activeTheme?.dateTextColor ||
        (isNight ? darkDateTextColor : dateTextColor)

    const numeralTextStyle = getSvgTextStyle(numberFont, 8.9, "-0.04em", 400)
    const labelTextStyle = getSvgTextStyle(labelFont, 3.6, "-0.03em", 700)
    const dateTextStyle = getSvgTextStyle(dateFont, 4.2, "0em", 400)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                visibility: shouldHideUntilReady ? "hidden" : "visible",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
            aria-label="Analog clock"
            role="img"
        >
            <svg
                viewBox="0 0 100 100"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    overflow: "visible",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
            >
                <circle
                    cx="50"
                    cy="50"
                    r={faceRadius}
                    fill={currentFaceColor}
                />
                <circle
                    cx="50"
                    cy="50"
                    r={innerRingRadius}
                    fill="none"
                    stroke={
                        isNight
                            ? "rgba(255, 255, 255, 0.18)"
                            : "rgba(0, 0, 0, 0.2)"
                    }
                    strokeWidth="0.35"
                />

                {Array.from({ length: 60 }).map((_, index) => {
                    const angle = index * 6
                    const isMajor = index % 5 === 0
                    const outer = polarToCartesian(angle, tickOuterRadius)
                    const inner = polarToCartesian(
                        angle,
                        isMajor ? tickInnerMajorRadius : tickInnerMinorRadius
                    )

                    return (
                        <line
                            key={index}
                            x1={outer.x}
                            y1={outer.y}
                            x2={inner.x}
                            y2={inner.y}
                            stroke={
                                isMajor
                                    ? currentMajorTickColor
                                    : currentMinorTickColor
                            }
                            strokeWidth={isMajor ? 0.65 : 0.32}
                            strokeLinecap="round"
                        />
                    )
                })}

                {numeralPositions.map((numeral) => {
                    const point = polarToCartesian(numeral.angle, numeralRadius)

                    return (
                        <text
                            key={numeral.value}
                            x={point.x + numeral.dx}
                            y={point.y + numeral.dy}
                            fill={currentNumberColor}
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={numeralTextStyle}
                        >
                            {numeral.value}
                        </text>
                    )
                })}

                {labelMode === "image" && labelImage?.src ? (
                    <foreignObject
                        x={50 - labelImageSize / 2}
                        y={labelY - labelImageSize / 2}
                        width={labelImageSize}
                        height={labelImageSize}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <img
                                src={labelImage.src}
                                alt={labelImage.alt || ""}
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    display: "block",
                                }}
                            />
                        </div>
                    </foreignObject>
                ) : label ? (
                    <text
                        x="50"
                        y={labelY}
                        fill={currentLabelColor}
                        textAnchor="middle"
                        style={labelTextStyle}
                    >
                        {label}
                    </text>
                ) : null}

                <g>
                    <foreignObject x="46" y={dateY} width="8" height="7.5">
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "0.3px",
                                background: currentDateWindowFill,
                                boxShadow: currentDateWindowShadow,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: currentDateTextColor,
                                ...dateTextStyle,
                            }}
                        >
                            {time.date}
                        </div>
                    </foreignObject>
                </g>

                <g transform={`rotate(${hourAngle} 50 50)`}>
                    <line
                        x1="50"
                        y1="51.5"
                        x2="50"
                        y2="27.5"
                        stroke={currentHourHandColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </g>

                <g transform={`rotate(${minuteAngle} 50 50)`}>
                    <line
                        x1="50"
                        y1="52"
                        x2="50"
                        y2="18"
                        stroke={currentMinuteHandColor}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                    />
                </g>

                {showSecondHand ? (
                    <g transform={`rotate(${secondAngle} 50 50)`}>
                        <line
                            x1="50"
                            y1="54.5"
                            x2="50"
                            y2="16"
                            stroke={currentSecondHandColor}
                            strokeWidth="0.65"
                            strokeLinecap="round"
                        />
                    </g>
                ) : null}

                <circle
                    cx="50"
                    cy="50"
                    r="3"
                    fill={currentAxleColor}
                    stroke={
                        isNight
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.08)"
                    }
                    strokeWidth="0.45"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="0.8"
                    fill={currentFaceColor}
                    opacity="0.9"
                />
            </svg>
        </div>
    )
}

addPropertyControls(ClassicClock, {
    timeMode: {
        type: ControlType.Enum,
        title: "Time Zone",
        options: ["local", "custom"],
        optionTitles: ["Local", "Custom"],
        defaultValue: "local",
        displaySegmentedControl: true,
    },
    customGMTText: {
        type: ControlType.String,
        title: "GMT",
        defaultValue: "GMT+0",
        description: "Use values like GMT+7, GMT-6, or GMT+5:30.",
        hidden: (props: Partial<Props>): boolean => props.timeMode !== "custom",
    },
    manualHour: {
        type: ControlType.Number,
        title: "Hour",
        defaultValue: 10,
        min: 0,
        max: 23,
        step: 1,
        displayStepper: true,
        hidden: () => true,
    },
    manualMinute: {
        type: ControlType.Number,
        title: "Minute",
        defaultValue: 10,
        min: 0,
        max: 59,
        step: 1,
        displayStepper: true,
        hidden: () => true,
    },
    manualSecond: {
        type: ControlType.Number,
        title: "Second",
        defaultValue: 35,
        min: 0,
        max: 59,
        step: 1,
        displayStepper: true,
        hidden: () => true,
    },
    showSecondHand: {
        type: ControlType.Boolean,
        title: "Seconds",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    secondHandMotion: {
        type: ControlType.Enum,
        title: "Movement",
        options: ["digital", "quartz", "mechanical"],
        optionTitles: ["Digital", "Quartz", "Mechanical"],
        defaultValue: "quartz",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        hidden: (props: Partial<Props>): boolean =>
            !Boolean(props.showSecondHand),
    },
    labelMode: {
        type: ControlType.Enum,
        title: "Label Mode",
        options: ["label", "image"],
        optionTitles: ["Label", "Image"],
        defaultValue: "label",
        displaySegmentedControl: true,
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Local Time",
        hidden: (props: Partial<Props>): boolean => props.labelMode === "image",
    },
    labelImage: {
        type: ControlType.ResponsiveImage,
        title: "Label Image",
        hidden: (props: Partial<Props>): boolean => props.labelMode !== "image",
    },
    labelImageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 18,
        min: 4,
        max: 999,
        step: 1,
        displayStepper: true,
        hidden: (props: Partial<Props>): boolean => props.labelMode !== "image",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
        hidden: (props: Partial<Props>): boolean => props.labelMode === "image",
        defaultValue: {
            fontFamily: "Geist",
            variant: "Semibold",
            fontSize: "6px",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    numberFont: {
        type: ControlType.Font,
        title: "Num Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
        defaultValue: {
            fontFamily: "Geist",
            variant: "Regular",
            fontSize: "9px",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    dateFont: {
        type: ControlType.Font,
        title: "Date Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
        defaultValue: {
            fontFamily: "Geist",
            variant: "Semibold",
            fontSize: "5px",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    autoThemeFromColor: {
        type: ControlType.Boolean,
        title: "Auto Theme",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    themeColor: {
        type: ControlType.String,
        title: "OKLCH",
        defaultValue: "oklch(0.62 0.19 42)",
        description:
            "Create an [OKLCH color](https://oklch.com/) and paste the value.",
        hidden: (props: Partial<Props>): boolean =>
            !Boolean(props.autoThemeFromColor),
    },
    faceColor: {
        type: ControlType.Color,
        title: "Day Face",
        defaultValue: "#F7F5EF",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    majorTickColor: {
        type: ControlType.Color,
        title: "Day Major",
        defaultValue: "#1D1D1D",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    minorTickColor: {
        type: ControlType.Color,
        title: "Day Minor",
        defaultValue: "#444444",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    labelColor: {
        type: ControlType.Color,
        title: "Day Label",
        defaultValue: "#6C6C6C",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    numberColor: {
        type: ControlType.Color,
        title: "Day Numbers",
        defaultValue: "#111111",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    hourHandColor: {
        type: ControlType.Color,
        title: "Day Hour",
        defaultValue: "#111111",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    minuteHandColor: {
        type: ControlType.Color,
        title: "Day Minute",
        defaultValue: "#111111",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    secondHandColor: {
        type: ControlType.Color,
        title: "Day Second",
        defaultValue: "#FF4F0C",
        hidden: (props: Partial<Props>): boolean =>
            !Boolean(props.showSecondHand) || Boolean(props.autoThemeFromColor),
    },
    axleColor: {
        type: ControlType.Color,
        title: "Day Axle",
        defaultValue: "#FF4F0C",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    dateWindowFill: {
        type: ControlType.Color,
        title: "Day Date Bg",
        defaultValue: "#E2DFD7",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    dateTextColor: {
        type: ControlType.Color,
        title: "Day Date Text",
        defaultValue: "#1D1D1D",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    dateWindowShadow: {
        type: ControlType.BoxShadow,
        title: "Day Date Shadow",
        defaultValue: [
            {
                inset: true,
                x: 0,
                y: 1,
                blur: 2,
                spread: 0,
                diffusion: 0,
                focus: 0,
                color: "rgba(163, 158, 149, 0.88)",
            },
        ] as any,
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkFaceColor: {
        type: ControlType.Color,
        title: "Night Face",
        defaultValue: "#101010",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkMajorTickColor: {
        type: ControlType.Color,
        title: "Night Major",
        defaultValue: "#F5F1E8",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkMinorTickColor: {
        type: ControlType.Color,
        title: "Night Minor",
        defaultValue: "#9B9B9B",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkLabelColor: {
        type: ControlType.Color,
        title: "Night Label",
        defaultValue: "#B7B7B7",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkNumberColor: {
        type: ControlType.Color,
        title: "Night Numbers",
        defaultValue: "#F5F1E8",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkHourHandColor: {
        type: ControlType.Color,
        title: "Night Hour",
        defaultValue: "#F5F1E8",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkMinuteHandColor: {
        type: ControlType.Color,
        title: "Night Minute",
        defaultValue: "#F5F1E8",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkSecondHandColor: {
        type: ControlType.Color,
        title: "Night Second",
        defaultValue: "#FF4F0C",
        hidden: (props: Partial<Props>): boolean =>
            !Boolean(props.showSecondHand) || Boolean(props.autoThemeFromColor),
    },
    darkAxleColor: {
        type: ControlType.Color,
        title: "Night Axle",
        defaultValue: "#FF4F0C",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkDateWindowFill: {
        type: ControlType.Color,
        title: "Night Date Bg",
        defaultValue: "#8A8478",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkDateTextColor: {
        type: ControlType.Color,
        title: "Night Date Text",
        defaultValue: "#FFFFFF",
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
    darkDateWindowShadow: {
        type: ControlType.BoxShadow,
        title: "Night Date Shadow",
        description:
            "Get more Framer goodies from [Moe Kyaw](https://dub.sh/moe-kyaw).",

        defaultValue: [
            {
                inset: true,
                x: 0,
                y: 1,
                blur: 2,
                spread: 0,
                diffusion: 0,
                focus: 0,
                color: "rgba(34, 34, 34, 0.9)",
            },
        ] as any,
        hidden: (props: Partial<Props>): boolean =>
            Boolean(props.autoThemeFromColor),
    },
})
