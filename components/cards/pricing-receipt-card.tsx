// ServicesReceipt — Framer Marketplace Component
// A customizable pricing receipt card with animated price scramble,
// interactive service checkboxes, optional split payment row,
// zigzag edges, and a barcode footer.
//
// Theme presets: Dark · Light · Minimal · Custom
// Services: add up to 5, control how many can be checked at once
// No external dependencies.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useEffect } from "react"

// ─── Constants ────────────────────────────────────────────────────────────────

const UI_FONT = "'Press Start 2P', monospace"
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`

const KEYFRAMES = `
@keyframes _subLabelIn {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes _strikeIn {
    from { transform: translateY(-50%) scaleX(0); }
    to   { transform: translateY(-50%) scaleX(1); }
}
@keyframes _waveBtn {
    from { opacity: 0.6; }
    to   { opacity: 1; }
}
`

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const PRICE_CHARS = "?)!%["

const toEm = (v: number) => `${(v / 100).toFixed(3)}em`

// ─── Theme presets ────────────────────────────────────────────────────────────

type ThemeKey = "dark" | "light" | "custom"

const THEMES: Record<
    ThemeKey,
    {
        receiptBg: string
        titleColor: string
        subtitleColor: string
        dashColor: string
        serviceActiveColor: string
        serviceInactiveColor: string
        checkboxUncheckedBg: string
        checkboxCheckedBg: string
        checkmarkColor: string
        priceLabelColor: string
        priceColor: string
        barcodeColor: string
        footerColor: string
        buttonBg: string
        buttonTextColor: string
        buttonHoverBg: string
        buttonHoverTextColor: string
    }
> = {
    dark: {
        receiptBg: "#111111",
        titleColor: "#FFFFFF",
        subtitleColor: "#6B7280",
        dashColor: "#2A2A2A",
        serviceActiveColor: "#FFFFFF",
        serviceInactiveColor: "#6B7280",
        checkboxUncheckedBg: "#1C1C1C",
        checkboxCheckedBg: "#FFFFFF",
        checkmarkColor: "#000000",
        priceLabelColor: "#6B7280",
        priceColor: "#FFFFFF",
        barcodeColor: "#2A2A2A",
        footerColor: "#3A3A3A",
        buttonBg: "#FFFFFF",
        buttonTextColor: "#000000",
        buttonHoverBg: "#222222",
        buttonHoverTextColor: "#FFFFFF",
    },
    light: {
        receiptBg: "#FFFFFF",
        titleColor: "#000000",
        subtitleColor: "#6B7280",
        dashColor: "#E5E7EB",
        serviceActiveColor: "#000000",
        serviceInactiveColor: "#9CA3AF",
        checkboxUncheckedBg: "#F3F4F6",
        checkboxCheckedBg: "#000000",
        checkmarkColor: "#FFFFFF",
        priceLabelColor: "#6B7280",
        priceColor: "#000000",
        barcodeColor: "#000000",
        footerColor: "#9CA3AF",
        buttonBg: "#000000",
        buttonTextColor: "#FFFFFF",
        buttonHoverBg: "#333333",
        buttonHoverTextColor: "#FFFFFF",
    },
    custom: {
        receiptBg: "#111111",
        titleColor: "#FFFFFF",
        subtitleColor: "#6B7280",
        dashColor: "#2A2A2A",
        serviceActiveColor: "#FFFFFF",
        serviceInactiveColor: "#6B7280",
        checkboxUncheckedBg: "#1C1C1C",
        checkboxCheckedBg: "#FFFFFF",
        checkmarkColor: "#000000",
        priceLabelColor: "#6B7280",
        priceColor: "#FFFFFF",
        barcodeColor: "#2A2A2A",
        footerColor: "#3A3A3A",
        buttonBg: "#FFFFFF",
        buttonTextColor: "#000000",
        buttonHoverBg: "#222222",
        buttonHoverTextColor: "#FFFFFF",
    },
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useWaveScramble(text: string, speed: number, interval: number) {
    const idle = text.split("").map((c) => ({ char: c, opacity: 1 }))
    const [slots, setSlots] = useState(idle)
    const timer = useRef<ReturnType<typeof setInterval> | null>(null)
    useEffect(() => {
        setSlots(text.split("").map((c) => ({ char: c, opacity: 1 })))
    }, [text])
    const scramble = () => {
        const center = (text.length - 1) / 2
        let wave = 0
        clearInterval(timer.current!)
        timer.current = setInterval(() => {
            setSlots(
                text.split("").map((char, i) => {
                    if (char === " ") return { char: " ", opacity: 1 }
                    const d = Math.abs(i - center)
                    if (d > wave)
                        return {
                            char: SCRAMBLE_CHARS[
                                Math.floor(
                                    Math.random() * SCRAMBLE_CHARS.length
                                )
                            ],
                            opacity: 0,
                        }
                    if (d > wave - 2.5)
                        return {
                            char: SCRAMBLE_CHARS[
                                Math.floor(
                                    Math.random() * SCRAMBLE_CHARS.length
                                )
                            ],
                            opacity: 1,
                        }
                    return { char: text[i], opacity: 1 }
                })
            )
            wave += speed
            if (wave > center + 3.5) {
                clearInterval(timer.current!)
                setSlots(idle)
            }
        }, interval)
    }
    const reset = () => {
        clearInterval(timer.current!)
        setSlots(idle)
    }
    return { slots, scramble, reset }
}

function usePriceScramble(
    target: string,
    speed: number,
    scrambleInterval: number
) {
    const [slots, setSlots] = useState<string[]>(target.split(""))
    const revealedRef = useRef<boolean[]>(new Array(target.length).fill(true))
    const scrambleTimer = useRef<ReturnType<typeof setInterval> | null>(null)
    const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const firstRender = useRef(true)
    const rand = () =>
        PRICE_CHARS[Math.floor(Math.random() * PRICE_CHARS.length)]
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false
            setSlots(target.split(""))
            return
        }
        const n = target.length
        revealedRef.current = new Array(n).fill(false)
        let pos = n - 1
        clearInterval(scrambleTimer.current!)
        clearTimeout(revealTimer.current!)
        scrambleTimer.current = setInterval(() => {
            setSlots(
                target
                    .split("")
                    .map((c, i) => (revealedRef.current[i] ? c : rand()))
            )
        }, scrambleInterval)
        const next = () => {
            if (pos < 0) {
                clearInterval(scrambleTimer.current!)
                setSlots(target.split(""))
                return
            }
            revealedRef.current[pos] = true
            pos--
            revealTimer.current = setTimeout(next, speed)
        }
        revealTimer.current = setTimeout(next, speed)
        return () => {
            clearInterval(scrambleTimer.current!)
            clearTimeout(revealTimer.current!)
        }
    }, [target])
    return slots.join("")
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ZigzagEdge({
    width,
    toothWidth,
    toothHeight,
    fillColor,
    direction,
}: {
    width: number
    toothWidth: number
    toothHeight: number
    fillColor: string
    direction: "top" | "bottom"
}) {
    const n = Math.ceil(width / toothWidth) + 2
    const pts: string[] = []
    if (direction === "top") {
        pts.push(`0,${toothHeight}`)
        for (let i = 0; i < n; i++) {
            pts.push(`${Math.min(i * toothWidth + toothWidth / 2, width)},0`)
            pts.push(`${Math.min((i + 1) * toothWidth, width)},${toothHeight}`)
        }
        pts.push(`${width},${toothHeight}`)
    } else {
        pts.push(`0,0`)
        for (let i = 0; i < n; i++) {
            pts.push(
                `${Math.min(i * toothWidth + toothWidth / 2, width)},${toothHeight}`
            )
            pts.push(`${Math.min((i + 1) * toothWidth, width)},0`)
        }
        pts.push(`${width},0`)
    }
    return (
        <svg
            width={width}
            height={toothHeight}
            style={{ display: "block", flexShrink: 0 }}
            viewBox={`0 0 ${width} ${toothHeight}`}
            preserveAspectRatio="none"
        >
            <polygon points={pts.join(" ")} fill={fillColor} />
        </svg>
    )
}

function DashedLine({
    color,
    thickness,
    dashLen,
    dashGap,
}: {
    color: string
    thickness: number
    dashLen: number
    dashGap: number
}) {
    return (
        <svg
            width="100%"
            height={thickness}
            style={{ display: "block", overflow: "visible" }}
        >
            <line
                x1={0}
                y1={thickness / 2}
                x2="100%"
                y2={thickness / 2}
                stroke={color}
                strokeWidth={thickness}
                strokeDasharray={`${dashLen} ${dashGap}`}
            />
        </svg>
    )
}

const BARCODE_WIDTHS = [
    2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1,
    2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 3, 1, 2, 2, 1, 3,
]

function Barcode({
    width,
    height,
    color,
}: {
    width: number
    height: number
    color: string
}) {
    const bars: { x: number; w: number }[] = []
    let x = 0
    let pi = 0
    let filled = true
    while (x < width) {
        const w = BARCODE_WIDTHS[pi % BARCODE_WIDTHS.length]
        if (filled) bars.push({ x, w: Math.min(w, width - x) })
        x += w
        pi++
        filled = !filled
    }
    return (
        <div style={{ width, height, position: "relative", flexShrink: 0 }}>
            {bars.map((bar, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: bar.x,
                        top: 0,
                        width: bar.w,
                        height: "100%",
                        background: color,
                    }}
                />
            ))}
        </div>
    )
}

function Checkbox({
    checked,
    size,
    checkmarkColor,
    checkedBg,
    uncheckedBg,
    borderColor,
}: {
    checked: boolean
    size: number
    checkmarkColor: string
    checkedBg: string
    uncheckedBg: string
    borderColor: string
}) {
    return (
        <div
            style={{
                width: size,
                height: size,
                flexShrink: 0,
                background: checked ? checkedBg : uncheckedBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: checked ? "none" : `1px solid ${borderColor}`,
                boxSizing: "border-box" as const,
            }}
        >
            {checked && (
                <svg
                    width={size * 0.6}
                    height={size * 0.6}
                    viewBox="0 0 12 12"
                    fill="none"
                >
                    <polyline
                        points="2,6 5,9 10,3"
                        stroke={checkmarkColor}
                        strokeWidth="2"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                    />
                </svg>
            )}
        </div>
    )
}

function ServiceRow({
    label,
    checked,
    fontSize,
    textColor,
    strikeColor,
    strikeWidth,
    strikeThickness,
    strikeOffsetY,
    strikeSpeed,
    checkboxSize,
    checkmarkColor,
    checkedBg,
    uncheckedBg,
    checkboxBorderColor,
    onClick,
}: {
    label: string
    checked: boolean
    fontSize: number
    textColor: string
    strikeColor: string
    strikeWidth: number
    strikeThickness: number
    strikeOffsetY: number
    strikeSpeed: number
    checkboxSize: number
    checkmarkColor: string
    checkedBg: string
    uncheckedBg: string
    checkboxBorderColor: string
    onClick: () => void
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
            }}
        >
            <div style={{ position: "relative", flex: 1 }}>
                <div style={{ width: "fit-content", position: "relative" }}>
                    <p
                        style={{
                            fontFamily: UI_FONT,
                            fontSize,
                            color: textColor,
                            margin: 0,
                            lineHeight: 1.6,
                            letterSpacing: "0.08em",
                        }}
                    >
                        {label}
                    </p>
                    {!checked && (
                        <div
                            style={{
                                position: "absolute",
                                top: `calc(50% + ${strikeOffsetY}px)`,
                                left: 0,
                                width: `${strikeWidth}%`,
                                height: strikeThickness,
                                background: strikeColor,
                                transformOrigin: "left center",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                animation: `_strikeIn ${strikeSpeed}ms cubic-bezier(0.4, 0, 0.2, 1) both`,
                            }}
                        />
                    )}
                </div>
            </div>
            <div onClick={onClick} style={{ cursor: "pointer", flexShrink: 0 }}>
                <Checkbox
                    checked={checked}
                    size={checkboxSize}
                    checkmarkColor={checkmarkColor}
                    checkedBg={checkedBg}
                    uncheckedBg={uncheckedBg}
                    borderColor={checkboxBorderColor}
                />
            </div>
        </div>
    )
}

function CtaButton({
    label,
    href,
    fontSize,
    letterSpacing,
    paddingY,
    waveSpeed,
    waveInterval,
    fullWidth,
    buttonBg,
    buttonTextColor,
    buttonHoverBg,
    buttonHoverTextColor,
}: {
    label: string
    href: string
    fontSize: number
    letterSpacing: number
    paddingY: number
    waveSpeed: number
    waveInterval: number
    fullWidth: boolean
    buttonBg: string
    buttonTextColor: string
    buttonHoverBg: string
    buttonHoverTextColor: string
}) {
    const { slots, scramble, reset } = useWaveScramble(
        label,
        waveSpeed,
        waveInterval
    )
    const [hovered, setHovered] = useState(false)
    return (
        <a
            href={href || "#"}
            style={{
                fontFamily: UI_FONT,
                fontSize,
                letterSpacing: toEm(letterSpacing),
                background: hovered ? buttonHoverBg : buttonBg,
                color: hovered ? buttonHoverTextColor : buttonTextColor,
                border: "none",
                borderRadius: 0,
                outline: hovered ? `2px solid ${buttonHoverTextColor}` : "none",
                outlineOffset: "-2px",
                paddingTop: paddingY,
                paddingBottom: paddingY,
                paddingLeft: 16,
                paddingRight: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                width: fullWidth ? "100%" : "auto",
                lineHeight: 1,
                boxSizing: "border-box" as const,
                textDecoration: "none",
                transition:
                    "background 0.15s ease, color 0.15s ease, outline 0.15s ease",
                userSelect: "none" as const,
                whiteSpace: "nowrap",
            }}
            onMouseEnter={() => {
                setHovered(true)
                scramble()
            }}
            onMouseLeave={() => {
                setHovered(false)
                reset()
            }}
        >
            {slots.map((s, i) => (
                <span
                    key={i}
                    style={{
                        opacity: s.opacity,
                        display: "inline-block",
                        minWidth: s.char === " " ? "0.6em" : undefined,
                    }}
                >
                    {s.char}
                </span>
            ))}
        </a>
    )
}

// ─── ServicesReceipt ──────────────────────────────────────────────────────────

interface Props {
    // Theme
    theme: ThemeKey
    // Custom theme overrides (only visible when theme = "custom")
    customReceiptBg: string
    customTitleColor: string
    customSubtitleColor: string
    customDashColor: string
    customServiceActiveColor: string
    customServiceInactiveColor: string
    customCheckboxUncheckedBg: string
    customCheckboxCheckedBg: string
    customCheckmarkColor: string
    customPriceLabelColor: string
    customPriceColor: string
    customBarcodeColor: string
    customFooterColor: string
    customButtonBg: string
    customButtonTextColor: string
    customButtonHoverBg: string
    customButtonHoverTextColor: string

    // Receipt shape
    widthMode: "fixed" | "percent"
    receiptWidth: number
    widthPercent: number
    toothWidth: number
    toothHeight: number
    showZigzag: boolean
    receiptPaddingX: number
    receiptPaddingTop: number
    receiptPaddingBottom: number

    // Header
    showHeader: boolean
    subtitleText: string
    subtitleSize: number
    subtitleLetterSpacing: number
    titleText: string
    titleSize: number
    titleLetterSpacing: number
    gapSubtitleToTitle: number
    gapTitleToDash: number

    // Dashes
    dashThickness: number
    dashLength: number
    dashGap: number

    // Services
    serviceLabels: string[]
    servicePrices: string[]
    maxChecked: number
    serviceFontSize: number
    serviceMobileFontSize: number
    checkboxSize: number
    checkmarkColor: string
    strikeWidth: number
    strikeThickness: number
    strikeOffsetY: number
    strikeSpeed: number
    gapDashToServices: number
    gapBetweenServices: number
    gapServicesToDash: number

    // Split payment
    showSplitPayment: boolean
    splitLabel: string
    splitPrices: string[]
    gapDashToSplit: number
    gapSplitToDash: number
    splitStrikeWidth: number
    splitStrikeThickness: number
    splitStrikeOffsetY: number

    // Price display
    priceLabelText: string
    priceLabelSize: number
    priceLabelLetterSpacing: number
    priceSize: number
    priceLetterSpacing: number
    priceRevealSpeed: number
    priceScrambleInterval: number
    showPriceSubLabel: boolean
    priceSubLabelSingle: string
    priceSubLabelSplit: string
    priceSubLabelSize: number
    priceSubLabelLetterSpacing: number
    gapDashToPrice: number
    gapPriceLabelToAmount: number
    gapPriceToSubLabel: number

    // Button
    buttonLabel: string
    buttonHref: string
    buttonFontSize: number
    buttonLetterSpacing: number
    buttonPaddingY: number
    buttonFullWidth: boolean
    buttonWaveSpeed: number
    buttonWaveInterval: number
    gapPriceToButton: number

    // Barcode
    showBarcode: boolean
    barcodeWidth: number
    barcodeHeight: number
    gapButtonToBarcode: number

    // Footer
    showFooter: boolean
    footerText: string
    footerSize: number
    footerLetterSpacing: number
    gapBarcodeToFooter: number

    // Section padding (controls receipt position within the frame)
    paddingTop: number
    paddingBottom: number
    paddingLeft: number
    paddingRight: number
    verticalAlign: "flex-start" | "center" | "flex-end"
    horizontalAlign: "flex-start" | "center" | "flex-end"
}

export default function ServicesReceipt({
    theme = "dark",
    customReceiptBg = "#111111",
    customTitleColor = "#FFFFFF",
    customSubtitleColor = "#6B7280",
    customDashColor = "#2A2A2A",
    customServiceActiveColor = "#FFFFFF",
    customServiceInactiveColor = "#6B7280",
    customCheckboxUncheckedBg = "#1C1C1C",
    customCheckboxCheckedBg = "#FFFFFF",
    customCheckmarkColor = "#FFFFFF",
    customPriceLabelColor = "#6B7280",
    customPriceColor = "#FFFFFF",
    customBarcodeColor = "#2A2A2A",
    customFooterColor = "#3A3A3A",
    customButtonBg = "#FFFFFF",
    customButtonTextColor = "#000000",
    customButtonHoverBg = "#222222",
    customButtonHoverTextColor = "#FFFFFF",

    widthMode = "fixed" as "fixed" | "percent",
    receiptWidth = 480,
    widthPercent = 80,
    toothWidth = 12,
    toothHeight = 10,
    showZigzag = true,
    receiptPaddingX = 40,
    receiptPaddingTop = 28,
    receiptPaddingBottom = 28,

    showHeader = true,
    subtitleText = "YOUR PLAN",
    subtitleSize = 9,
    subtitleLetterSpacing = 8,
    titleText = "PRICING RECEIPT",
    titleSize = 13,
    titleLetterSpacing = 8,
    gapSubtitleToTitle = 10,
    gapTitleToDash = 28,

    dashThickness = 1,
    dashLength = 6,
    dashGap = 4,

    serviceLabels = ["SERVICE 01", "SERVICE 02"],
    servicePrices = ["$99", "$199"],
    maxChecked = 1,
    serviceFontSize = 9,
    serviceMobileFontSize = 8,
    checkboxSize = 16,
    checkmarkColor = "#000000",
    strikeWidth = 100,
    strikeThickness = 1,
    strikeOffsetY = 0,
    strikeSpeed = 300,
    gapDashToServices = 24,
    gapBetweenServices = 16,
    gapServicesToDash = 24,

    showSplitPayment = true,
    splitLabel = "SPLIT INTO 2 PAYMENTS",
    splitPrices = ["$55", "$109"],
    gapDashToSplit = 24,
    gapSplitToDash = 24,
    splitStrikeWidth = 100,
    splitStrikeThickness = 1,
    splitStrikeOffsetY = 0,

    priceLabelText = "FROM",
    priceLabelSize = 9,
    priceLabelLetterSpacing = 10,
    priceSize = 32,
    priceLetterSpacing = 4,
    priceRevealSpeed = 40,
    priceScrambleInterval = 60,
    showPriceSubLabel = true,
    priceSubLabelSingle = "ONE-TIME",
    priceSubLabelSplit = "× 2 MONTHS",
    priceSubLabelSize = 8,
    priceSubLabelLetterSpacing = 8,
    gapDashToPrice = 20,
    gapPriceLabelToAmount = 6,
    gapPriceToSubLabel = 8,

    buttonLabel = "GET STARTED",
    buttonHref = "#",
    buttonFontSize = 11,
    buttonLetterSpacing = 10,
    buttonPaddingY = 16,
    buttonFullWidth = true,
    buttonWaveSpeed = 0.25,
    buttonWaveInterval = 45,
    gapPriceToButton = 28,

    showBarcode = true,
    barcodeWidth = 400,
    barcodeHeight = 40,
    gapButtonToBarcode = 28,

    showFooter = true,
    footerText = "THANK YOU",
    footerSize = 8,
    footerLetterSpacing = 20,
    gapBarcodeToFooter = 10,

    paddingTop = 0,
    paddingBottom = 0,
    paddingLeft = 0,
    paddingRight = 0,
    verticalAlign = "center" as "flex-start" | "center" | "flex-end",
    horizontalAlign = "center" as "flex-start" | "center" | "flex-end",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(480)

    // Checked state — Set of indices, respects maxChecked
    const [checkedSet, setCheckedSet] = useState<Set<number>>(new Set([0]))
    const [isSplit, setIsSplit] = useState(false)

    useEffect(() => {
        const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
        if (containerRef.current) obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [])

    const isMobile = width < 480
    const fontSize = isMobile ? serviceMobileFontSize : serviceFontSize

    // Resolve colors from theme
    const t =
        theme === "custom"
            ? {
                  receiptBg: customReceiptBg,
                  titleColor: customTitleColor,
                  subtitleColor: customSubtitleColor,
                  dashColor: customDashColor,
                  serviceActiveColor: customServiceActiveColor,
                  serviceInactiveColor: customServiceInactiveColor,
                  checkboxUncheckedBg: customCheckboxUncheckedBg,
                  checkboxCheckedBg: customCheckboxCheckedBg,
                  checkmarkColor: customCheckmarkColor,
                  priceLabelColor: customPriceLabelColor,
                  priceColor: customPriceColor,
                  barcodeColor: customBarcodeColor,
                  footerColor: customFooterColor,
                  buttonBg: customButtonBg,
                  buttonTextColor: customButtonTextColor,
                  buttonHoverBg: customButtonHoverBg,
                  buttonHoverTextColor: customButtonHoverTextColor,
              }
            : THEMES[theme]

    const handleCheck = (index: number) => {
        setCheckedSet((prev) => {
            const next = new Set(prev)
            if (next.has(index)) {
                if (next.size > 1) next.delete(index) // always keep at least one checked
            } else {
                if (maxChecked === 1) {
                    next.clear()
                    next.add(index)
                } else if (next.size < maxChecked) {
                    next.add(index)
                }
            }
            return new Set(next)
        })
    }

    // Price: use first checked service's price
    const firstChecked = Math.min(...Array.from(checkedSet))
    const singlePrice = servicePrices[firstChecked] ?? servicePrices[0] ?? "$99"
    const splitPrice = splitPrices[firstChecked] ?? splitPrices[0] ?? "$55"
    const currentPrice = isSplit ? splitPrice : singlePrice
    const displayPrice = usePriceScramble(
        currentPrice,
        priceRevealSpeed,
        priceScrambleInterval
    )

    const actualWidth =
        widthMode === "percent"
            ? Math.round((width * widthPercent) / 100)
            : receiptWidth // fixed mode: use exactly what the user set, no clamping

    const dashProps = {
        color: t.dashColor,
        thickness: dashThickness,
        dashLen: dashLength,
        dashGap,
    }

    return (
        <>
            <style>{FONT_IMPORT + KEYFRAMES}</style>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: horizontalAlign,
                    justifyContent: verticalAlign,
                    paddingTop,
                    paddingBottom,
                    paddingLeft,
                    paddingRight,
                    boxSizing: "border-box" as const,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: actualWidth,
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                    }}
                >
                    {/* Zigzag top */}
                    {showZigzag && (
                        <ZigzagEdge
                            width={actualWidth}
                            toothWidth={toothWidth}
                            toothHeight={toothHeight}
                            fillColor={t.receiptBg}
                            direction="top"
                        />
                    )}

                    {/* Content */}
                    <div
                        style={{
                            background: t.receiptBg,
                            paddingTop: receiptPaddingTop,
                            paddingBottom: receiptPaddingBottom,
                            paddingLeft: receiptPaddingX,
                            paddingRight: receiptPaddingX,
                            display: "flex",
                            flexDirection: "column",
                            borderTop: showZigzag
                                ? "none"
                                : `1px solid ${t.dashColor}`,
                            borderBottom: showZigzag
                                ? "none"
                                : `1px solid ${t.dashColor}`,
                        }}
                    >
                        {/* Header */}
                        {showHeader && (
                            <>
                                <p
                                    style={{
                                        fontFamily: UI_FONT,
                                        fontSize: subtitleSize,
                                        color: t.subtitleColor,
                                        margin: 0,
                                        letterSpacing: toEm(
                                            subtitleLetterSpacing
                                        ),
                                        lineHeight: 1,
                                        marginBottom: gapSubtitleToTitle,
                                    }}
                                >
                                    {subtitleText}
                                </p>
                                <p
                                    style={{
                                        fontFamily: UI_FONT,
                                        fontSize: titleSize,
                                        color: t.titleColor,
                                        margin: 0,
                                        letterSpacing: toEm(titleLetterSpacing),
                                        lineHeight: 1,
                                        marginBottom: gapTitleToDash,
                                    }}
                                >
                                    {titleText}
                                </p>
                            </>
                        )}

                        {/* Dash 1 */}
                        <DashedLine {...dashProps} />

                        {/* Services */}
                        <div
                            style={{
                                marginTop: gapDashToServices,
                                marginBottom: gapServicesToDash,
                                display: "flex",
                                flexDirection: "column",
                                gap: gapBetweenServices,
                            }}
                        >
                            {serviceLabels.map((label, i) => {
                                const isChecked = checkedSet.has(i)
                                return (
                                    <ServiceRow
                                        key={i}
                                        label={label}
                                        checked={isChecked}
                                        fontSize={fontSize}
                                        textColor={
                                            isChecked
                                                ? t.serviceActiveColor
                                                : t.serviceInactiveColor
                                        }
                                        strikeColor={t.serviceInactiveColor}
                                        strikeWidth={strikeWidth}
                                        strikeThickness={strikeThickness}
                                        strikeOffsetY={strikeOffsetY}
                                        strikeSpeed={strikeSpeed}
                                        checkboxSize={checkboxSize}
                                        checkmarkColor={t.checkmarkColor}
                                        checkedBg={t.checkboxCheckedBg}
                                        uncheckedBg={t.checkboxUncheckedBg}
                                        checkboxBorderColor={t.dashColor}
                                        onClick={() => handleCheck(i)}
                                    />
                                )
                            })}
                        </div>

                        {/* Dash 2 */}
                        <DashedLine {...dashProps} />

                        {/* Split payment */}
                        {showSplitPayment && (
                            <>
                                <div
                                    style={{
                                        marginTop: gapDashToSplit,
                                        marginBottom: gapSplitToDash,
                                    }}
                                >
                                    <ServiceRow
                                        label={splitLabel}
                                        checked={isSplit}
                                        fontSize={fontSize}
                                        textColor={
                                            isSplit
                                                ? t.serviceActiveColor
                                                : t.serviceInactiveColor
                                        }
                                        strikeColor={t.serviceInactiveColor}
                                        strikeWidth={splitStrikeWidth}
                                        strikeThickness={splitStrikeThickness}
                                        strikeOffsetY={splitStrikeOffsetY}
                                        strikeSpeed={strikeSpeed}
                                        checkboxSize={checkboxSize}
                                        checkmarkColor={t.checkmarkColor}
                                        checkedBg={t.checkboxCheckedBg}
                                        uncheckedBg={t.checkboxUncheckedBg}
                                        checkboxBorderColor={t.dashColor}
                                        onClick={() => setIsSplit((v) => !v)}
                                    />
                                </div>
                                {/* Dash 3 */}
                                <DashedLine {...dashProps} />
                            </>
                        )}

                        {/* Price */}
                        <div
                            style={{
                                marginTop: gapDashToPrice,
                                marginBottom: gapPriceToButton,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: UI_FONT,
                                    fontSize: priceLabelSize,
                                    color: t.priceLabelColor,
                                    margin: 0,
                                    letterSpacing: toEm(
                                        priceLabelLetterSpacing
                                    ),
                                    lineHeight: 1,
                                    marginBottom: gapPriceLabelToAmount,
                                }}
                            >
                                {priceLabelText}
                            </p>
                            <p
                                style={{
                                    fontFamily: UI_FONT,
                                    fontSize: priceSize,
                                    color: t.priceColor,
                                    margin: 0,
                                    letterSpacing: toEm(priceLetterSpacing),
                                    lineHeight: 1,
                                }}
                            >
                                {displayPrice}
                            </p>
                            {showPriceSubLabel && (
                                <p
                                    key={isSplit ? "split" : "single"}
                                    style={{
                                        fontFamily: UI_FONT,
                                        fontSize: priceSubLabelSize,
                                        color: t.priceLabelColor,
                                        margin: 0,
                                        letterSpacing: toEm(
                                            priceSubLabelLetterSpacing
                                        ),
                                        lineHeight: 1,
                                        marginTop: gapPriceToSubLabel,
                                        animation:
                                            "_subLabelIn 0.3s cubic-bezier(0.25,0.1,0.25,1) both",
                                    }}
                                >
                                    {isSplit
                                        ? priceSubLabelSplit
                                        : priceSubLabelSingle}
                                </p>
                            )}
                        </div>

                        {/* CTA Button */}
                        <div
                            style={{
                                marginBottom: showBarcode
                                    ? gapButtonToBarcode
                                    : 0,
                            }}
                        >
                            <CtaButton
                                label={buttonLabel}
                                href={buttonHref}
                                fontSize={buttonFontSize}
                                letterSpacing={buttonLetterSpacing}
                                paddingY={buttonPaddingY}
                                fullWidth={buttonFullWidth}
                                waveSpeed={buttonWaveSpeed}
                                waveInterval={buttonWaveInterval}
                                buttonBg={t.buttonBg}
                                buttonTextColor={t.buttonTextColor}
                                buttonHoverBg={t.buttonHoverBg}
                                buttonHoverTextColor={t.buttonHoverTextColor}
                            />
                        </div>

                        {/* Barcode */}
                        {showBarcode && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginBottom: showFooter
                                        ? gapBarcodeToFooter
                                        : 0,
                                }}
                            >
                                <Barcode
                                    width={Math.min(
                                        barcodeWidth,
                                        actualWidth - receiptPaddingX * 2
                                    )}
                                    height={barcodeHeight}
                                    color={t.barcodeColor}
                                />
                            </div>
                        )}

                        {/* Footer */}
                        {showFooter && (
                            <p
                                style={{
                                    fontFamily: UI_FONT,
                                    fontSize: footerSize,
                                    color: t.footerColor,
                                    margin: 0,
                                    textAlign: "center",
                                    letterSpacing: toEm(footerLetterSpacing),
                                    lineHeight: 1,
                                }}
                            >
                                {footerText}
                            </p>
                        )}
                    </div>

                    {/* Zigzag bottom */}
                    {showZigzag && (
                        <ZigzagEdge
                            width={actualWidth}
                            toothWidth={toothWidth}
                            toothHeight={toothHeight}
                            fillColor={t.receiptBg}
                            direction="bottom"
                        />
                    )}
                </div>
            </div>
        </>
    )
}

// ─── Property Controls ───────────────────────────────────────────────────────

addPropertyControls(ServicesReceipt, {
    // ╔══════════════════════════════════════╗
    // ║             THEME                    ║
    // ╚══════════════════════════════════════╝
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light", "custom"],
        optionTitles: ["Dark", "Light", "Custom"],
        defaultValue: "dark",
    },
    customReceiptBg: {
        type: ControlType.Color,
        title: "Receipt Background",
        defaultValue: "#111111",
        hidden: (p) => p.theme !== "custom",
    },
    customTitleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.theme !== "custom",
    },
    customSubtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "#6B7280",
        hidden: (p) => p.theme !== "custom",
    },
    customDashColor: {
        type: ControlType.Color,
        title: "Dash / Border Color",
        defaultValue: "#2A2A2A",
        hidden: (p) => p.theme !== "custom",
    },
    customServiceActiveColor: {
        type: ControlType.Color,
        title: "Service Active Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.theme !== "custom",
    },
    customServiceInactiveColor: {
        type: ControlType.Color,
        title: "Service Inactive Color",
        defaultValue: "#6B7280",
        hidden: (p) => p.theme !== "custom",
    },
    customCheckboxUncheckedBg: {
        type: ControlType.Color,
        title: "Checkbox Empty BG",
        defaultValue: "#1C1C1C",
        hidden: (p) => p.theme !== "custom",
    },
    customCheckboxCheckedBg: {
        type: ControlType.Color,
        title: "Checkbox Checked BG",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.theme !== "custom",
    },
    customCheckmarkColor: {
        type: ControlType.Color,
        title: "Checkmark Color",
        defaultValue: "#000000",
        hidden: (p) => p.theme !== "custom",
    },
    customPriceLabelColor: {
        type: ControlType.Color,
        title: "Price Label Color",
        defaultValue: "#6B7280",
        hidden: (p) => p.theme !== "custom",
    },
    customPriceColor: {
        type: ControlType.Color,
        title: "Price Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.theme !== "custom",
    },
    customBarcodeColor: {
        type: ControlType.Color,
        title: "Barcode Color",
        defaultValue: "#2A2A2A",
        hidden: (p) => p.theme !== "custom",
    },
    customFooterColor: {
        type: ControlType.Color,
        title: "Footer Color",
        defaultValue: "#3A3A3A",
        hidden: (p) => p.theme !== "custom",
    },
    customButtonBg: {
        type: ControlType.Color,
        title: "Button Background",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.theme !== "custom",
    },
    customButtonTextColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: "#000000",
        hidden: (p) => p.theme !== "custom",
    },
    customButtonHoverBg: {
        type: ControlType.Color,
        title: "Button Hover Background",
        defaultValue: "#222222",
        hidden: (p) => p.theme !== "custom",
    },
    customButtonHoverTextColor: {
        type: ControlType.Color,
        title: "Button Hover Text Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.theme !== "custom",
    },

    // ╔══════════════════════════════════════╗
    // ║              SHAPE                   ║
    // ╚══════════════════════════════════════╝
    widthMode: {
        type: ControlType.Enum,
        title: "Width Mode",
        options: ["fixed", "percent"],
        optionTitles: ["Fixed (px)", "Relative (%)"],
        defaultValue: "fixed",
        description:
            "Fixed: exact pixel width. Relative: % of component container width.",
    },
    receiptWidth: {
        type: ControlType.Number,
        title: "Width (px)",
        defaultValue: 480,
        min: 200,
        max: 1200,
        step: 10,
        hidden: (p) => p.widthMode !== "fixed",
    },
    widthPercent: {
        type: ControlType.Number,
        title: "Width (%)",
        defaultValue: 80,
        min: 10,
        max: 100,
        step: 5,
        hidden: (p) => p.widthMode !== "percent",
    },
    showZigzag: {
        type: ControlType.Boolean,
        title: "Show Zigzag Edges",
        defaultValue: true,
    },
    toothWidth: {
        type: ControlType.Number,
        title: "Zigzag Tooth Width",
        defaultValue: 12,
        min: 6,
        max: 40,
        step: 2,
        hidden: (p) => !p.showZigzag,
    },
    toothHeight: {
        type: ControlType.Number,
        title: "Zigzag Tooth Height",
        defaultValue: 10,
        min: 4,
        max: 24,
        step: 1,
        hidden: (p) => !p.showZigzag,
    },
    receiptPaddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 40,
        min: 8,
        max: 80,
        step: 4,
    },
    receiptPaddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 4,
    },
    receiptPaddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 4,
    },

    // ╔══════════════════════════════════════╗
    // ║              HEADER                  ║
    // ╚══════════════════════════════════════╝
    showHeader: {
        type: ControlType.Boolean,
        title: "Show Header",
        defaultValue: true,
    },
    subtitleText: {
        type: ControlType.String,
        title: "Subtitle Text",
        defaultValue: "YOUR PLAN",
        hidden: (p) => !p.showHeader,
    },
    subtitleSize: {
        type: ControlType.Number,
        title: "Subtitle Size",
        defaultValue: 9,
        min: 7,
        max: 20,
        step: 1,
        hidden: (p) => !p.showHeader,
    },
    subtitleLetterSpacing: {
        type: ControlType.Number,
        title: "Subtitle Tracking ×100",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        hidden: (p) => !p.showHeader,
    },
    titleText: {
        type: ControlType.String,
        title: "Title Text",
        defaultValue: "PRICING RECEIPT",
        hidden: (p) => !p.showHeader,
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 13,
        min: 8,
        max: 32,
        step: 1,
        hidden: (p) => !p.showHeader,
    },
    titleLetterSpacing: {
        type: ControlType.Number,
        title: "Title Tracking ×100",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        hidden: (p) => !p.showHeader,
    },
    gapSubtitleToTitle: {
        type: ControlType.Number,
        title: "Gap: Subtitle → Title",
        defaultValue: 10,
        min: 0,
        max: 60,
        step: 2,
        hidden: (p) => !p.showHeader,
    },
    gapTitleToDash: {
        type: ControlType.Number,
        title: "Gap: Title → Dash",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 2,
        hidden: (p) => !p.showHeader,
    },

    // ╔══════════════════════════════════════╗
    // ║           DASHED LINES               ║
    // ╚══════════════════════════════════════╝
    dashThickness: {
        type: ControlType.Number,
        title: "Dash Thickness",
        defaultValue: 1,
        min: 1,
        max: 6,
        step: 1,
    },
    dashLength: {
        type: ControlType.Number,
        title: "Dash Length",
        defaultValue: 6,
        min: 2,
        max: 40,
        step: 1,
    },
    dashGap: {
        type: ControlType.Number,
        title: "Dash Gap",
        defaultValue: 4,
        min: 1,
        max: 30,
        step: 1,
    },

    // ╔══════════════════════════════════════╗
    // ║             SERVICES                 ║
    // ╚══════════════════════════════════════╝
    serviceLabels: {
        type: ControlType.Array,
        title: "Service Labels",
        control: { type: ControlType.String },
        defaultValue: ["SERVICE 01", "SERVICE 02"],
        maxCount: 5,
    },
    servicePrices: {
        type: ControlType.Array,
        title: "Service Prices",
        control: { type: ControlType.String },
        defaultValue: ["$99", "$199"],
        maxCount: 5,
        description: "One price per service. Must match Services count.",
    },
    maxChecked: {
        type: ControlType.Number,
        title: "Max Checked at Once",
        defaultValue: 1,
        min: 1,
        max: 5,
        step: 1,
        description: "1 = radio button (one at a time). 2+ = multiple allowed.",
    },
    serviceFontSize: {
        type: ControlType.Number,
        title: "Service Font Size",
        defaultValue: 9,
        min: 7,
        max: 20,
        step: 1,
    },
    serviceMobileFontSize: {
        type: ControlType.Number,
        title: "Service Font Size – Mobile",
        defaultValue: 8,
        min: 6,
        max: 16,
        step: 1,
    },
    checkboxSize: {
        type: ControlType.Number,
        title: "Checkbox Size",
        defaultValue: 16,
        min: 10,
        max: 32,
        step: 2,
    },
    strikeWidth: {
        type: ControlType.Number,
        title: "Strike Width (%)",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 5,
    },
    strikeThickness: {
        type: ControlType.Number,
        title: "Strike Thickness",
        defaultValue: 1,
        min: 1,
        max: 6,
        step: 1,
    },
    strikeOffsetY: {
        type: ControlType.Number,
        title: "Strike Offset Y",
        defaultValue: 0,
        min: -20,
        max: 20,
        step: 1,
    },
    strikeSpeed: {
        type: ControlType.Number,
        title: "Strike Anim Speed (ms)",
        defaultValue: 300,
        min: 50,
        max: 1000,
        step: 50,
    },
    gapDashToServices: {
        type: ControlType.Number,
        title: "Gap: Dash → Services",
        defaultValue: 24,
        min: 0,
        max: 60,
        step: 2,
    },
    gapBetweenServices: {
        type: ControlType.Number,
        title: "Gap: Between Services",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 2,
    },
    gapServicesToDash: {
        type: ControlType.Number,
        title: "Gap: Services → Dash",
        defaultValue: 24,
        min: 0,
        max: 60,
        step: 2,
    },

    // ╔══════════════════════════════════════╗
    // ║          SPLIT PAYMENT               ║
    // ╚══════════════════════════════════════╝
    showSplitPayment: {
        type: ControlType.Boolean,
        title: "Show Split Payment Row",
        defaultValue: true,
    },
    splitLabel: {
        type: ControlType.String,
        title: "Split Label",
        defaultValue: "SPLIT INTO 2 PAYMENTS",
        hidden: (p) => !p.showSplitPayment,
    },
    splitPrices: {
        type: ControlType.Array,
        title: "Split Prices",
        control: { type: ControlType.String },
        defaultValue: ["$55", "$109"],
        maxCount: 5,
        description: "One split price per service. Must match Services count.",
        hidden: (p) => !p.showSplitPayment,
    },
    gapDashToSplit: {
        type: ControlType.Number,
        title: "Gap: Dash → Split",
        defaultValue: 24,
        min: 0,
        max: 60,
        step: 2,
        hidden: (p) => !p.showSplitPayment,
    },
    gapSplitToDash: {
        type: ControlType.Number,
        title: "Gap: Split → Dash",
        defaultValue: 24,
        min: 0,
        max: 60,
        step: 2,
        hidden: (p) => !p.showSplitPayment,
    },
    splitStrikeWidth: {
        type: ControlType.Number,
        title: "Split Strike Width (%)",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 5,
        hidden: (p) => !p.showSplitPayment,
    },
    splitStrikeThickness: {
        type: ControlType.Number,
        title: "Split Strike Thickness",
        defaultValue: 1,
        min: 1,
        max: 6,
        step: 1,
        hidden: (p) => !p.showSplitPayment,
    },
    splitStrikeOffsetY: {
        type: ControlType.Number,
        title: "Split Strike Offset Y",
        defaultValue: 0,
        min: -20,
        max: 20,
        step: 1,
        hidden: (p) => !p.showSplitPayment,
    },

    // ╔══════════════════════════════════════╗
    // ║           PRICE DISPLAY              ║
    // ╚══════════════════════════════════════╝
    priceLabelText: {
        type: ControlType.String,
        title: "Price Label",
        defaultValue: "FROM",
    },
    priceLabelSize: {
        type: ControlType.Number,
        title: "Price Label Size",
        defaultValue: 9,
        min: 7,
        max: 20,
        step: 1,
    },
    priceLabelLetterSpacing: {
        type: ControlType.Number,
        title: "Price Label Tracking ×100",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
    },
    priceSize: {
        type: ControlType.Number,
        title: "Price Size",
        defaultValue: 32,
        min: 16,
        max: 72,
        step: 2,
    },
    priceLetterSpacing: {
        type: ControlType.Number,
        title: "Price Tracking ×100",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
    },
    priceRevealSpeed: {
        type: ControlType.Number,
        title: "Price · Reveal Speed (ms/char)",
        defaultValue: 40,
        min: 10,
        max: 200,
        step: 5,
        description: "How fast each character is revealed right-to-left.",
    },
    priceScrambleInterval: {
        type: ControlType.Number,
        title: "Price · Scramble Speed (ms)",
        defaultValue: 60,
        min: 20,
        max: 200,
        step: 10,
        description:
            "How fast the symbol cycling animates. Lower = more chaotic.",
    },
    gapDashToPrice: {
        type: ControlType.Number,
        title: "Gap: Dash → Price",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
    },
    gapPriceLabelToAmount: {
        type: ControlType.Number,
        title: "Gap: Label → Amount",
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 2,
    },
    showPriceSubLabel: {
        type: ControlType.Boolean,
        title: "Show Price Sub-Label",
        defaultValue: true,
    },
    priceSubLabelSingle: {
        type: ControlType.String,
        title: "Sub-Label (single)",
        defaultValue: "ONE-TIME",
        hidden: (p) => !p.showPriceSubLabel,
    },
    priceSubLabelSplit: {
        type: ControlType.String,
        title: "Sub-Label (split)",
        defaultValue: "× 2 MONTHS",
        hidden: (p) => !p.showPriceSubLabel || !p.showSplitPayment,
    },
    priceSubLabelSize: {
        type: ControlType.Number,
        title: "Sub-Label Size",
        defaultValue: 8,
        min: 6,
        max: 14,
        step: 1,
        hidden: (p) => !p.showPriceSubLabel,
    },
    priceSubLabelLetterSpacing: {
        type: ControlType.Number,
        title: "Sub-Label Tracking ×100",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        hidden: (p) => !p.showPriceSubLabel,
    },
    gapPriceToSubLabel: {
        type: ControlType.Number,
        title: "Gap: Price → Sub-Label",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 2,
        hidden: (p) => !p.showPriceSubLabel,
    },

    // ╔══════════════════════════════════════╗
    // ║               BUTTON                 ║
    // ╚══════════════════════════════════════╝
    buttonLabel: {
        type: ControlType.String,
        title: "Button Label",
        defaultValue: "GET STARTED",
    },
    buttonHref: {
        type: ControlType.String,
        title: "Button Link",
        defaultValue: "#",
        description: "Use #section-id, /page, or a full URL.",
    },
    buttonFontSize: {
        type: ControlType.Number,
        title: "Button Font Size",
        defaultValue: 11,
        min: 8,
        max: 24,
        step: 1,
    },
    buttonLetterSpacing: {
        type: ControlType.Number,
        title: "Button Tracking ×100",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
    },
    buttonPaddingY: {
        type: ControlType.Number,
        title: "Button Padding Y",
        defaultValue: 16,
        min: 4,
        max: 40,
        step: 2,
    },
    buttonFullWidth: {
        type: ControlType.Boolean,
        title: "Button Full Width",
        defaultValue: true,
    },
    buttonWaveSpeed: {
        type: ControlType.Number,
        title: "Button Wave Speed",
        defaultValue: 0.25,
        min: 0.05,
        max: 0.8,
        step: 0.05,
    },
    buttonWaveInterval: {
        type: ControlType.Number,
        title: "Button Wave Interval",
        defaultValue: 45,
        min: 15,
        max: 100,
        step: 5,
    },
    gapPriceToButton: {
        type: ControlType.Number,
        title: "Gap: Price → Button",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 2,
    },

    // ╔══════════════════════════════════════╗
    // ║              BARCODE                 ║
    // ╚══════════════════════════════════════╝
    showBarcode: {
        type: ControlType.Boolean,
        title: "Show Barcode",
        defaultValue: true,
    },
    barcodeWidth: {
        type: ControlType.Number,
        title: "Barcode Width",
        defaultValue: 400,
        min: 100,
        max: 600,
        step: 8,
        hidden: (p) => !p.showBarcode,
    },
    barcodeHeight: {
        type: ControlType.Number,
        title: "Barcode Height",
        defaultValue: 40,
        min: 10,
        max: 120,
        step: 2,
        hidden: (p) => !p.showBarcode,
    },
    gapButtonToBarcode: {
        type: ControlType.Number,
        title: "Gap: Button → Barcode",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 2,
        hidden: (p) => !p.showBarcode,
    },

    // ╔══════════════════════════════════════╗
    // ║               FOOTER                 ║
    // ╚══════════════════════════════════════╝
    showFooter: {
        type: ControlType.Boolean,
        title: "Show Footer Text",
        defaultValue: true,
    },
    footerText: {
        type: ControlType.String,
        title: "Footer Text",
        defaultValue: "THANK YOU",
        hidden: (p) => !p.showFooter,
    },
    footerSize: {
        type: ControlType.Number,
        title: "Footer Size",
        defaultValue: 8,
        min: 6,
        max: 16,
        step: 1,
        hidden: (p) => !p.showFooter,
    },
    footerLetterSpacing: {
        type: ControlType.Number,
        title: "Footer Tracking ×100",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
        hidden: (p) => !p.showFooter,
    },
    gapBarcodeToFooter: {
        type: ControlType.Number,
        title: "Gap: Barcode → Footer",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 2,
        hidden: (p) => !p.showFooter || !p.showBarcode,
    },

    // ╔══════════════════════════════════════╗
    // ║          POSITION & SPACING          ║
    // ╚══════════════════════════════════════╝
    verticalAlign: {
        type: ControlType.Enum,
        title: "Vertical Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        description:
            "Where the receipt sits vertically within the component frame.",
    },
    horizontalAlign: {
        type: ControlType.Enum,
        title: "Horizontal Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 0,
        min: 0,
        max: 600,
        step: 4,
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 0,
        min: 0,
        max: 600,
        step: 4,
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Padding Left",
        defaultValue: 0,
        min: 0,
        max: 400,
        step: 4,
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Padding Right",
        defaultValue: 0,
        min: 0,
        max: 400,
        step: 4,
    },
})
