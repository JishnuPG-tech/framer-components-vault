// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useState,
    useRef,
    useCallback,
    useEffect,
    type CSSProperties,
} from "react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Props = {
    minPrice: number
    maxPrice: number
    defaultMin: number
    defaultMax: number
    step: number
    currencySymbol: string
    showPlusOnMax: boolean
    labelPrefix: string
    labelSeparator: string
    lockMinThumb: boolean
    showGoButton: boolean
    goButtonLabel: string
    trackColor: string
    rangeColor: string
    thumbColor: string
    thumbBorderColor: string
    thumbSize: number
    trackHeight: number
    borderRadius: number
    labelColor: string
    labelFontSize: number
    labelFontWeight: number
    buttonColor: string
    buttonTextColor: string
    buttonBorderColor: string
    buttonFontSize: number
    buttonBorderRadius: number
    buttonPaddingX: number
    buttonPaddingY: number
    gap: number
    fontFamily: string
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 64
 */
export default function PriceSlider(props: Props) {
    const {
        minPrice,
        maxPrice,
        defaultMin,
        defaultMax,
        step,
        currencySymbol,
        showPlusOnMax,
        labelPrefix,
        labelSeparator,
        lockMinThumb,
        showGoButton,
        goButtonLabel,
        trackColor,
        rangeColor,
        thumbColor,
        thumbBorderColor,
        thumbSize,
        trackHeight,
        borderRadius,
        labelColor,
        labelFontSize,
        labelFontWeight,
        buttonColor,
        buttonTextColor,
        buttonBorderColor,
        buttonFontSize,
        buttonBorderRadius,
        buttonPaddingX,
        buttonPaddingY,
        gap,
        fontFamily,
        style,
    } = props

    const clamp = (v: number, lo: number, hi: number) =>
        Math.min(hi, Math.max(lo, v))

    const snap = (v: number) => Math.round(v / step) * step

    const safeDefaultMin = clamp(defaultMin, minPrice, maxPrice)
    const safeDefaultMax = clamp(defaultMax, minPrice, maxPrice)

    const [low, setLow] = useState(safeDefaultMin)
    const [high, setHigh] = useState(
        safeDefaultMax >= safeDefaultMin ? safeDefaultMax : maxPrice
    )

    useEffect(() => {
        const newLow = clamp(defaultMin, minPrice, maxPrice)
        const newHigh = clamp(defaultMax, minPrice, maxPrice)
        setLow(newLow)
        setHigh(newHigh >= newLow ? newHigh : maxPrice)
    }, [defaultMin, defaultMax, minPrice, maxPrice])

    const trackRef = useRef<HTMLDivElement>(null)
    const dragging = useRef<"low" | "high" | null>(null)

    const pxToValue = useCallback(
        (clientX: number) => {
            const rect = trackRef.current?.getBoundingClientRect()
            if (!rect) return minPrice
            const ratio = (clientX - rect.left) / rect.width
            const raw = minPrice + ratio * (maxPrice - minPrice)
            return snap(clamp(raw, minPrice, maxPrice))
        },
        [minPrice, maxPrice, step]
    )

    const onMove = useCallback(
        (clientX: number) => {
            const val = pxToValue(clientX)
            if (dragging.current === "low" && !lockMinThumb) {
                setLow(Math.min(val, high))
            } else if (dragging.current === "high") {
                setHigh(Math.max(val, low))
            }
        },
        [pxToValue, low, high, lockMinThumb]
    )

    /* --- pointer handlers --- */
    const onPointerDown = useCallback(
        (thumb: "low" | "high") => (e: React.PointerEvent) => {
            if (thumb === "low" && lockMinThumb) return
            e.preventDefault()
            dragging.current = thumb
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        },
        [lockMinThumb]
    )

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!dragging.current) return
            onMove(e.clientX)
        },
        [onMove]
    )

    const onPointerUp = useCallback(() => {
        dragging.current = null
    }, [])

    /* --- track click to jump nearest thumb --- */
    const onTrackClick = useCallback(
        (e: React.MouseEvent) => {
            const val = pxToValue(e.clientX)
            if (lockMinThumb) {
                setHigh(Math.max(val, low))
            } else {
                const distLow = Math.abs(val - low)
                const distHigh = Math.abs(val - high)
                if (distLow <= distHigh) {
                    setLow(Math.min(val, high))
                } else {
                    setHigh(Math.max(val, low))
                }
            }
        },
        [pxToValue, low, high, lockMinThumb]
    )

    /* --- derived percentages --- */
    const range = maxPrice - minPrice || 1
    const lowPct = ((low - minPrice) / range) * 100
    const highPct = ((high - minPrice) / range) * 100

    /* --- price formatting --- */
    const formatPrice = (price: number) => {
        const formatted = `${currencySymbol}${price.toLocaleString()}`
        return showPlusOnMax && price === maxPrice ? `${formatted}+` : formatted
    }

    const fontMap: Record<string, string> = {
        Inter: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        "SF Pro":
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        Roboto: "'Roboto', Arial, Helvetica, sans-serif",
        Poppins: "'Poppins', sans-serif",
        "DM Sans": "'DM Sans', sans-serif",
        Manrope: "'Manrope', sans-serif",
        "Plus Jakarta Sans": "'Plus Jakarta Sans', sans-serif",
        "Space Grotesk": "'Space Grotesk', sans-serif",
        "IBM Plex Sans": "'IBM Plex Sans', sans-serif",
        "Source Sans 3": "'Source Sans 3', sans-serif",
        "Work Sans": "'Work Sans', sans-serif",
        Outfit: "'Outfit', sans-serif",
    }
    const font = fontMap[fontFamily] || fontFamily

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: gap,
                width: "100%",
                minWidth: 200,
                fontFamily: font,
                boxSizing: "border-box",
                ...style,
            }}
        >
            {/* Label */}
            <span
                style={{
                    fontSize: labelFontSize,
                    fontWeight: labelFontWeight,
                    color: labelColor,
                    fontVariantNumeric: "tabular-nums",
                    fontFamily: font,
                    lineHeight: 1.4,
                    userSelect: "none",
                }}
            >
                {labelPrefix} {formatPrice(low)} {labelSeparator}{" "}
                {formatPrice(high)}
            </span>

            {/* Slider + Button row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                {/* Slider track area */}
                <div
                    ref={trackRef}
                    onClick={onTrackClick}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    style={{
                        position: "relative",
                        flex: 1,
                        height: thumbSize + 8,
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        touchAction: "none",
                    }}
                >
                    {/* Background track */}
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            height: trackHeight,
                            borderRadius: trackHeight / 2,
                            background: trackColor,
                        }}
                    />

                    {/* Active range */}
                    <div
                        style={{
                            position: "absolute",
                            left: `${lowPct}%`,
                            right: `${100 - highPct}%`,
                            height: trackHeight,
                            borderRadius: trackHeight / 2,
                            background: rangeColor,
                        }}
                    />

                    {/* Low thumb */}
                    <div
                        onPointerDown={onPointerDown("low")}
                        style={{
                            position: "absolute",
                            left: `${lowPct}%`,
                            width: thumbSize,
                            height: thumbSize,
                            borderRadius: "50%",
                            background: lockMinThumb ? trackColor : thumbColor,
                            border: `2px solid ${lockMinThumb ? trackColor : thumbBorderColor}`,
                            transform: "translateX(-50%)",
                            cursor: lockMinThumb ? "default" : "grab",
                            zIndex: lockMinThumb ? 1 : lowPct > 90 ? 3 : 2,
                            boxShadow: lockMinThumb
                                ? "none"
                                : "0 1px 3px rgba(0,0,0,0.12)",
                            touchAction: "none",
                            boxSizing: "border-box",
                            opacity: lockMinThumb ? 0.6 : 1,
                            pointerEvents: lockMinThumb ? "none" : "auto",
                        }}
                        role="slider"
                        aria-label="Minimum price"
                        aria-valuemin={minPrice}
                        aria-valuemax={maxPrice}
                        aria-valuenow={low}
                        aria-disabled={lockMinThumb}
                        tabIndex={lockMinThumb ? -1 : 0}
                        onKeyDown={
                            lockMinThumb
                                ? undefined
                                : (e) => {
                                      if (
                                          e.key === "ArrowRight" ||
                                          e.key === "ArrowUp"
                                      ) {
                                          e.preventDefault()
                                          setLow(Math.min(low + step, high))
                                      } else if (
                                          e.key === "ArrowLeft" ||
                                          e.key === "ArrowDown"
                                      ) {
                                          e.preventDefault()
                                          setLow(Math.max(low - step, minPrice))
                                      }
                                  }
                        }
                    />

                    {/* High thumb */}
                    <div
                        onPointerDown={onPointerDown("high")}
                        style={{
                            position: "absolute",
                            left: `${highPct}%`,
                            width: thumbSize,
                            height: thumbSize,
                            borderRadius: "50%",
                            background: thumbColor,
                            border: `2px solid ${thumbBorderColor}`,
                            transform: "translateX(-50%)",
                            cursor: "grab",
                            zIndex: highPct < 10 ? 3 : 2,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                            touchAction: "none",
                            boxSizing: "border-box",
                        }}
                        role="slider"
                        aria-label="Maximum price"
                        aria-valuemin={minPrice}
                        aria-valuemax={maxPrice}
                        aria-valuenow={high}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                                e.preventDefault()
                                setHigh(Math.min(high + step, maxPrice))
                            } else if (
                                e.key === "ArrowLeft" ||
                                e.key === "ArrowDown"
                            ) {
                                e.preventDefault()
                                setHigh(Math.max(high - step, low))
                            }
                        }}
                    />
                </div>

                {/* Go button */}
                {showGoButton && (
                    <button
                        style={{
                            fontFamily: font,
                            fontSize: buttonFontSize,
                            fontWeight: 500,
                            color: buttonTextColor,
                            background: buttonColor,
                            border: `1px solid ${buttonBorderColor}`,
                            borderRadius: buttonBorderRadius,
                            paddingLeft: buttonPaddingX,
                            paddingRight: buttonPaddingX,
                            paddingTop: buttonPaddingY,
                            paddingBottom: buttonPaddingY,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            lineHeight: 1.4,
                            flexShrink: 0,
                        }}
                    >
                        {goButtonLabel}
                    </button>
                )}
            </div>
        </div>
    )
}

PriceSlider.displayName = "PriceSlider"

/* ------------------------------------------------------------------ */
/*  Default props                                                      */
/* ------------------------------------------------------------------ */

PriceSlider.defaultProps = {
    minPrice: 5,
    maxPrice: 1240,
    defaultMin: 5,
    defaultMax: 1240,
    step: 1,
    currencySymbol: "$",
    showPlusOnMax: true,
    labelPrefix: "From",
    labelSeparator: "to",
    lockMinThumb: false,
    showGoButton: true,
    goButtonLabel: "Go",
    trackColor: "#e5e5e5",
    rangeColor: "#1a1a1a",
    thumbColor: "#ffffff",
    thumbBorderColor: "#1a1a1a",
    thumbSize: 20,
    trackHeight: 3,
    borderRadius: 0,
    labelColor: "#0a0a0a",
    labelFontSize: 14,
    labelFontWeight: 500,
    buttonColor: "#ffffff",
    buttonTextColor: "#0a0a0a",
    buttonBorderColor: "#e5e5e5",
    buttonFontSize: 14,
    buttonBorderRadius: 6,
    buttonPaddingX: 16,
    buttonPaddingY: 6,
    gap: 10,
    fontFamily: "Inter",
}

/* ------------------------------------------------------------------ */
/*  Property controls                                                  */
/* ------------------------------------------------------------------ */

addPropertyControls(PriceSlider, {
    minPrice: {
        type: ControlType.Number,
        title: "Min Price",
        defaultValue: 5,
        min: 0,
        step: 1,
        displayStepper: true,
    },
    maxPrice: {
        type: ControlType.Number,
        title: "Max Price",
        defaultValue: 1240,
        min: 1,
        step: 1,
        displayStepper: true,
    },
    defaultMin: {
        type: ControlType.Number,
        title: "Default Min",
        defaultValue: 5,
        min: 0,
        step: 1,
        displayStepper: true,
        description: "Initial position of the left thumb",
    },
    defaultMax: {
        type: ControlType.Number,
        title: "Default Max",
        defaultValue: 1240,
        min: 1,
        step: 1,
        displayStepper: true,
        description: "Initial position of the right thumb",
    },
    step: {
        type: ControlType.Number,
        title: "Step",
        defaultValue: 1,
        min: 1,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    currencySymbol: {
        type: ControlType.String,
        title: "Currency",
        defaultValue: "$",
    },
    showPlusOnMax: {
        type: ControlType.Boolean,
        title: "Plus on Max",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Append + when value equals max price",
    },
    lockMinThumb: {
        type: ControlType.Boolean,
        title: "Lock Min",
        defaultValue: false,
        enabledTitle: "Locked",
        disabledTitle: "Free",
        description: "Lock the minimum thumb so only the max can be dragged",
    },
    labelPrefix: {
        type: ControlType.String,
        title: "Label Start",
        defaultValue: "From",
    },
    labelSeparator: {
        type: ControlType.String,
        title: "Label Mid",
        defaultValue: "to",
    },
    showGoButton: {
        type: ControlType.Boolean,
        title: "Go Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    goButtonLabel: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Go",
        hidden: (p: Props) => !p.showGoButton,
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "#e5e5e5",
    },
    rangeColor: {
        type: ControlType.Color,
        title: "Range",
        defaultValue: "#1a1a1a",
    },
    thumbColor: {
        type: ControlType.Color,
        title: "Thumb Fill",
        defaultValue: "#ffffff",
    },
    thumbBorderColor: {
        type: ControlType.Color,
        title: "Thumb Border",
        defaultValue: "#1a1a1a",
    },
    thumbSize: {
        type: ControlType.Number,
        title: "Thumb Size",
        defaultValue: 20,
        min: 12,
        max: 40,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    trackHeight: {
        type: ControlType.Number,
        title: "Track Height",
        defaultValue: 3,
        min: 1,
        max: 12,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#0a0a0a",
    },
    labelFontSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    labelFontWeight: {
        type: ControlType.Enum,
        title: "Label Weight",
        defaultValue: 500,
        options: [300, 400, 500, 600, 700],
        optionTitles: ["Light", "Regular", "Medium", "Semi-Bold", "Bold"],
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Btn Fill",
        defaultValue: "#ffffff",
        hidden: (p: Props) => !p.showGoButton,
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Btn Text",
        defaultValue: "#0a0a0a",
        hidden: (p: Props) => !p.showGoButton,
    },
    buttonBorderColor: {
        type: ControlType.Color,
        title: "Btn Border",
        defaultValue: "#e5e5e5",
        hidden: (p: Props) => !p.showGoButton,
    },
    buttonFontSize: {
        type: ControlType.Number,
        title: "Btn Font",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: Props) => !p.showGoButton,
    },
    buttonBorderRadius: {
        type: ControlType.Number,
        title: "Btn Radius",
        defaultValue: 6,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: Props) => !p.showGoButton,
    },
    buttonPaddingX: {
        type: ControlType.Number,
        title: "Btn Pad X",
        defaultValue: 16,
        min: 4,
        max: 40,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: Props) => !p.showGoButton,
    },
    buttonPaddingY: {
        type: ControlType.Number,
        title: "Btn Pad Y",
        defaultValue: 6,
        min: 2,
        max: 24,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: Props) => !p.showGoButton,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "Space between the label and the slider",
    },
    fontFamily: {
        type: ControlType.Enum,
        title: "Font",
        defaultValue: "Inter",
        options: [
            "Inter",
            "SF Pro",
            "Roboto",
            "Poppins",
            "DM Sans",
            "Manrope",
            "Plus Jakarta Sans",
            "Space Grotesk",
            "IBM Plex Sans",
            "Source Sans 3",
            "Work Sans",
            "Outfit",
        ],
        optionTitles: [
            "Inter",
            "SF Pro",
            "Roboto",
            "Poppins",
            "DM Sans",
            "Manrope",
            "Plus Jakarta Sans",
            "Space Grotesk",
            "IBM Plex Sans",
            "Source Sans 3",
            "Work Sans",
            "Outfit",
        ],
    },
})
