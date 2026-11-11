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


const PRESETS = {
    standard: {
        background: "#ffffff",
        text: "#111111",
        shadow: "0 8px 24px rgba(0,0,0,0.08)",
    },
    glass: {
        background: "rgba(255,255,255,0.05)",
        text: "#ffffff",
        shadow: "0 8px 32px rgba(31,38,135,0.25)",
        blur: "blur(16px)",
        saturate: "saturate(180%)",
    },
    dark: {
        background: "#111111",
        text: "#ffffff",
        shadow: "0 10px 30px rgba(0,0,0,0.4)",
    },
    gradient: {
        text: "#ffffff",
        shadow: "0 14px 40px rgba(37,99,235,0.35)",
    },
    neon: {
        background: "#050505",
        text: "#00ffcc",
    },
}

const getDefaultTargetDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 15)
    return d.toISOString()
}

const parseColor = (color: string) => {
    if (!color) return null
    let c = String(color).trim()
    if (c.toLowerCase().startsWith("rgb")) {
        const m = c.match(/(\d+(\.\d+)?)/g)
        if (m && m.length >= 3) return { r: +m[0], g: +m[1], b: +m[2] }
        return null
    }
    c = c.replace("#", "")
    if (c.length === 3)
        c = c
            .split("")
            .map((x) => x + x)
            .join("")
    if (c.length < 6) return null
    const r = parseInt(c.slice(0, 2), 16)
    const g = parseInt(c.slice(2, 4), 16)
    const b = parseInt(c.slice(4, 6), 16)
    if ([r, g, b].some((v) => Number.isNaN(v))) return null
    return { r, g, b }
}

const isLightColor = (color: string) => {
    const rgb = parseColor(color)
    if (!rgb) return false
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
    return lum > 0.6
}

const colorToRgba = (color: string, alpha: number) => {
    const rgb = parseColor(color)
    if (!rgb) return `rgba(0,0,0,${alpha})`
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

const normalizeColor = (color: string) => {
    if (!color) return color
    const c = String(color).trim()
    if (c.toLowerCase().startsWith("rgb")) return c
    return c[0] === "#" ? c : `#${c.replace("#", "")}`
}

const sameColor = (a: string, b: string) => {
    const ca = parseColor(a)
    const cb = parseColor(b)
    if (!ca || !cb) return false
    return ca.r === cb.r && ca.g === cb.g && ca.b === cb.b
}

const ACCENT_DEFAULT = "#22D3EE"

function FlipCard({ digit, size, cardStyle }) {
    return (
        <div
            key={digit}
            className="ct-flip"
            style={{
                width: size * 0.62,
                height: size,
                borderRadius: size * 0.12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: cardStyle.bg,
                color: cardStyle.text,
                fontSize: size * 0.62,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                boxShadow: cardStyle.shadow,
                backfaceVisibility: "hidden",
            }}
        >
            {digit}
        </div>
    )
}

export default function CountdownTimer(props) {
    const {
        title,
        subtitle,
        targetDate,
        targetHour,
        targetMinute,
        accentColor,
        borderRadius,
        preset,
        gradientStart,
        gradientEnd,
        gradientAngle,
        separatorStyle,
        digitStyle,
    } = props

    const currentPreset = PRESETS[preset]

    // -------------------------
    // 컴포넌트 자기 폭 측정 (iframe/캔버스/기기 무관 정확)
    // -------------------------
    const containerRef = React.useRef(null)
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver((entries) => {
            const width = entries[0].contentRect.width
            setIsMobile(width < 420)
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const accentSet = accentColor && !sameColor(accentColor, ACCENT_DEFAULT)

    const GLOW_INTENSITY = 32

    const gradientBackground =
        preset === "gradient"
            ? `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`
            : null
    const resolvedBackground =
        preset === "gradient" ? gradientBackground : currentPreset.background

    const numberColor =
        preset === "gradient"
            ? currentPreset.text
            : preset === "neon"
              ? accentSet
                  ? normalizeColor(accentColor)
                  : currentPreset.text
              : accentSet
                ? normalizeColor(accentColor)
                : preset === "standard"
                  ? currentPreset.text
                  : ACCENT_DEFAULT

    const labelBaseColor = preset === "neon" ? numberColor : currentPreset.text

    const glowColor = preset === "neon" ? numberColor : null

    const backdrop =
        preset === "glass"
            ? `${currentPreset.blur} ${currentPreset.saturate}`
            : "none"

    const neonShadow =
        preset === "neon"
            ? `0 0 ${GLOW_INTENSITY}px ${glowColor}`
            : currentPreset.shadow

    const calculateTimeLeft = () => {
        const targetDateObj = new Date(targetDate)
        targetDateObj.setHours(targetHour)
        targetDateObj.setMinutes(targetMinute)
        targetDateObj.setSeconds(0)
        const diff = targetDateObj.getTime() - new Date().getTime()
        if (diff <= 0) {
            return { days: "00", hours: "00", minutes: "00", seconds: "00" }
        }
        return {
            days: String(Math.floor(diff / 86400000)).padStart(2, "0"),
            hours: String(Math.floor((diff / 3600000) % 24)).padStart(2, "0"),
            minutes: String(Math.floor((diff / 60000) % 60)).padStart(2, "0"),
            seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, "0"),
        }
    }

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft())
    React.useEffect(() => {
        const t = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
        return () => clearInterval(t)
    }, [targetDate, targetHour, targetMinute])

    const separatorChar = separatorStyle === "colon" ? ":" : ""
    const showSeparator = separatorChar !== ""

    const items = [
        ["Days", timeLeft.days],
        ["Hours", timeLeft.hours],
        ["Minutes", timeLeft.minutes],
        ["Seconds", timeLeft.seconds],
    ]

    const numberFontSize = isMobile ? 22 : 42
    const cardSize = isMobile ? 44 : 60

    const isDarkBg =
        preset === "dark" || preset === "neon" || preset === "gradient"
    const circleBg = isDarkBg ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"

    const cardStyle = {
        bg: isLightColor(numberColor)
            ? colorToRgba(numberColor, 0.14)
            : colorToRgba(numberColor, 0.08),
        text: numberColor,
        shadow: "0 2px 6px rgba(0,0,0,0.18)",
    }

    const isFlip = digitStyle === "flip"

    const renderCardGroup = (value: string) => (
        <div style={{ display: "flex", gap: isMobile ? 3 : 4 }}>
            <FlipCard digit={value[0]} size={cardSize} cardStyle={cardStyle} />
            <FlipCard digit={value[1]} size={cardSize} cardStyle={cardStyle} />
        </div>
    )

    const renderNumber = (value: string) => {
        const baseStyle = {
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums" as const,
            lineHeight: 1,
            color: numberColor,
        }
        if (digitStyle === "circle") {
            return (
                <div
                    style={{
                        ...baseStyle,
                        width: isMobile ? 56 : 68,
                        height: isMobile ? 56 : 68,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        fontSize: isMobile ? 20 : 28,
                        background: circleBg,
                    }}
                >
                    {value}
                </div>
            )
        }
        return (
            <div style={{ ...baseStyle, fontSize: numberFontSize }}>
                {value}
            </div>
        )
    }

    const rowHeight = isFlip
        ? cardSize
        : digitStyle === "circle"
          ? isMobile
              ? 56
              : 68
          : isMobile
            ? 34
            : 52

    const gridTemplateColumns = showSeparator
        ? "auto auto auto auto auto auto auto"
        : "repeat(4, auto)"

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                background: resolvedBackground,
                boxShadow: neonShadow,
                color: labelBaseColor,
                backdropFilter: backdrop,
                WebkitBackdropFilter: backdrop,
                borderRadius,
                padding: isMobile ? 24 : 36,
                overflow: "hidden",
                boxSizing: "border-box",
                backgroundImage:
                    preset === "glass"
                        ? "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))"
                        : "none",
                fontFamily:
                    "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            <style>{`
                @keyframes ctFlipIn {
                    0%   { transform: perspective(400px) rotateX(-90deg); opacity: 0; }
                    100% { transform: perspective(400px) rotateX(0deg); opacity: 1; }
                }
                .ct-flip {
                    animation: ctFlipIn 0.5s ease-out;
                    transform-origin: center center;
                }
            `}</style>

            {title ? (
                <div
                    style={{
                        fontSize: isMobile ? 18 : 22,
                        fontWeight: 700,
                        textAlign: "center",
                        marginBottom: subtitle ? 6 : 24,
                        color: labelBaseColor,
                    }}
                >
                    {title}
                </div>
            ) : null}

            {subtitle ? (
                <div
                    style={{
                        fontSize: isMobile ? 13 : 15,
                        fontWeight: 400,
                        opacity: 0.7,
                        textAlign: "center",
                        marginBottom: 28,
                        color: labelBaseColor,
                    }}
                >
                    {subtitle}
                </div>
            ) : null}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns,
                    rowGap: 12,
                    columnGap: isMobile ? (showSeparator ? 4 : 12) : 22,
                    textAlign: "center",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {items.map(([label, value], i) => (
                    <React.Fragment key={`num-${label}`}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: rowHeight,
                            }}
                        >
                            {isFlip
                                ? renderCardGroup(value)
                                : renderNumber(value)}
                        </div>
                        {showSeparator && i < items.length - 1 && (
                            <div
                                style={{
                                    height: rowHeight,
                                    fontSize: isMobile ? 18 : 28,
                                    fontWeight: 700,
                                    opacity: 0.4,
                                    lineHeight: 1,
                                    color: labelBaseColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {separatorChar}
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {items.map(([label], i) => (
                    <React.Fragment key={`label-${label}`}>
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.7,
                                color: labelBaseColor,
                            }}
                        >
                            {label}
                        </div>
                        {showSeparator && i < items.length - 1 && <div />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

CountdownTimer.defaultProps = {
    title: "Event Countdown",
    subtitle: "Stay tuned for the big reveal",
    targetDate: getDefaultTargetDate(),
    targetHour: 23,
    targetMinute: 59,
    accentColor: ACCENT_DEFAULT,
    borderRadius: 16,
    preset: "dark",
    gradientStart: "rgb(139, 92, 246)",
    gradientEnd: "rgb(236, 72, 153)",
    gradientAngle: 135,
    separatorStyle: "none",
    digitStyle: "flip",
}

addPropertyControls(CountdownTimer, {
    title: { type: ControlType.String, title: "Title" },
    subtitle: { type: ControlType.String, title: "Subtitle" },

    targetDate: { type: ControlType.Date, title: "End Date" },
    targetHour: { type: ControlType.Number, title: "Hour", min: 0, max: 23 },
    targetMinute: {
        type: ControlType.Number,
        title: "Minute",
        min: 0,
        max: 59,
    },

    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["standard", "glass", "dark", "gradient", "neon"],
        optionTitles: ["Standard", "Glass", "Dark", "Gradient", "Neon"],
    },

    digitStyle: {
        type: ControlType.Enum,
        title: "Digits",
        options: ["classic", "flip", "circle"],
        optionTitles: ["Classic", "Flip", "Circle"],
    },
    separatorStyle: {
        type: ControlType.Enum,
        title: "Separator",
        options: ["none", "colon"],
        optionTitles: ["None", "Colon"],
    },

    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        hidden: (props) => props.preset === "gradient",
    },

    gradientStart: {
        type: ControlType.Color,
        title: "Grad Start",
        hidden: (props) => props.preset !== "gradient",
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "Grad End",
        hidden: (props) => props.preset !== "gradient",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Angle",
        min: 0,
        max: 360,
        hidden: (props) => props.preset !== "gradient",
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
    },
})
