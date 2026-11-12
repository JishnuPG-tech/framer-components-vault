// Pricing Slider Card Component
// Implements a pricing slider UI as described, with all visual and interactive details.
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


const priceTiers = [
    { max: 1000, label: "up to 1,000 visitors", price: 19 },
    { max: 5000, label: "1,001–5,000 visitors", price: 29 },
    { max: 10000, label: "5,001–10,000 visitors", price: 39 },
    { max: 25000, label: "10,001–25,000 visitors", price: 59 },
    { max: 50000, label: "25,001–50,000 visitors", price: 79 },
    { max: 100000, label: "50,001–100,000 visitors", price: 109 },
    { max: 250000, label: "100,001–250,000 visitors", price: 149 },
    { max: 500000, label: "250,001–500,000 visitors", price: 199 },
    { max: 1000000, label: "500,001–1,000,000 visitors", price: 299 },
    { max: 5000000, label: "1,000,001–5,000,000 visitors", price: 499 },
    { max: 10000000, label: "5,000,001–10,000,000 visitors", price: 799 },
    { max: 100000000, label: "10,000,001+ visitors", price: 1299 },
]

function getTier(value) {
    for (let i = 0; i < priceTiers.length; i++) {
        if (value <= priceTiers[i].max) return priceTiers[i]
    }
    return priceTiers[priceTiers.length - 1]
}

/**
 * PricingSlider
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 420
 */
export default function PricingSlider(props) {
    const {
        tooltip = {},
        ...rest
    } = props
    const {
        card = {},
        slider = {},
        price = {},
        questionGroup = {},
        button = {},
        priceLabel = "Your price",
    } = props

    // Destructure grouped props
    const {
        cardBg = "#fff",
        cardRadius = 20,
        cardShadowColor = "#8855FF",
        cardBorder = { borderWidth: 0, borderStyle: "solid", borderColor: "#EEEEEE" },
    } = card
    const {
        minVisitors = 100,
        maxVisitors = 1000000,
        defaultVisitors = 100,
        sliderTrackColor = "#F5F5F5",
        sliderActiveColor = "#6A4DFF",
        thumbBorderColor = "#6A4DFF",
        thumbBg = "#fff",
        thumbSize = 32,
    } = slider
    const {
        priceColor = "#6A4DFF",
        priceUnitColor = "#B0B0C3",
        priceLabelColor = "#B0B0C3",
        priceFont = {
            variant: "Bold",
            fontSize: "38px",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
        priceLabelFont = {
            variant: "Medium",
            fontSize: "15px",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    } = price
    const {
        question = "What’s your average monthly revenue?",
        questionColor = "#B0B0C3",
        questionFont = {
            variant: "Medium",
            fontSize: "18px",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    } = questionGroup
    const {
        buttonLabel = "START YOUR 14-DAY FREE TRIAL",
        buttonGradient = "linear-gradient(90deg, #8855FF 0%, #6A4DFF 100%)",
        buttonShadow = "0 4px 16px 0 rgba(136,85,255,0.18)",
        buttonTextColor = "#fff",
        buttonRadius = 12,
        buttonFont = {
            variant: "Bold",
            fontSize: "16px",
            letterSpacing: "0.08em",
            lineHeight: "1em",
        },
        buttonPadding = "18px 0",
    } = button

    const [visitors, setVisitors] = React.useState(defaultVisitors)
    const tier = getTier(visitors)
    const isOnCanvas = useIsOnFramerCanvas()

    // Animated price value
    const [animatedPrice, setAnimatedPrice] = React.useState(tier.price)
    const prevPriceRef = React.useRef(tier.price)
    React.useEffect(() => {
        let raf
        const start = prevPriceRef.current
        const end = tier.price
        const duration = 350
        const startTime = performance.now()
        function animate(now) {
            const elapsed = now - startTime
            const t = Math.min(1, elapsed / duration)
            // easeOutCubic
            const ease = 1 - Math.pow(1 - t, 3)
            setAnimatedPrice(Math.round(start + (end - start) * ease))
            if (t < 1) raf = requestAnimationFrame(animate)
            else prevPriceRef.current = end
        }
        if (start !== end) {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(animate)
        } else {
            setAnimatedPrice(end)
        }
        return () => cancelAnimationFrame(raf)
    }, [tier.price])

    // Slider percent for track fill
    const percent =
        ((visitors - minVisitors) / (maxVisitors - minVisitors)) * 100

    // Card styles
    const cardStyle = {
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        background: cardBg,
        borderRadius: cardRadius,
        boxShadow: `0 6px 32px 0 ${cardShadowColor}1A, 0 1.5px 6px 0 rgba(0,0,0,0.04)`,
        padding: 36,
        display: "flex",
        flexDirection: "column",
        gap: props.cardGap ?? 28,
        alignItems: "stretch",
        ...cardBorder,
    }

    // Slider styles
    const sliderTrackStyle = {
        width: "100%",
        height: 6,
        borderRadius: 3,
        background: sliderTrackColor,
        position: "relative",
    }
    const sliderActiveStyle = {
        position: "absolute",
        left: 0,
        top: 0,
        height: 6,
        borderRadius: 3,
        background: sliderActiveColor,
        width: `${percent}%`,
        transition: "none",
    }
    const sliderThumbStyle = {
        position: "absolute",
        left: `calc(${percent}% - ${thumbSize / 2}px)` ,
        top: "50%",
        transform: "translateY(-50%)",
        width: thumbSize,
        height: thumbSize,
        borderRadius: "50%",
        background: thumbBg,
        boxShadow: "0 2px 8px rgba(136,85,255,0.10)",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }
    const {
        tooltipFont = {
            variant: "Medium",
            fontSize: "15px",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        tooltipTextColor = "#6A4DFF",
        tooltipBg = "#fff",
        tooltipFormat = "{visitors}",
        tooltipPadding = "6px 14px",
        tooltipRadius = 8,
        tooltipBlur = 0,
    } = tooltip

    const tooltipRef = React.useRef(null)
    const [tooltipWidth, setTooltipWidth] = React.useState(0)
    const [showTooltip, setShowTooltip] = React.useState(false)
    const [tooltipVisible, setTooltipVisible] = React.useState(false)
    const fadeOutTimeout = React.useRef()
    React.useLayoutEffect(() => {
        if (tooltipRef.current) {
            setTooltipWidth(tooltipRef.current.offsetWidth)
        }
    }, [visitors, tooltipFormat, tooltipFont, tooltipPadding, showTooltip, tooltipVisible])

    // Show tooltip when hovering slider track or handle
    const handleSliderEnter = () => {
        clearTimeout(fadeOutTimeout.current)
        setShowTooltip(true)
        setTooltipVisible(true)
    }
    const handleSliderLeave = () => {
        setShowTooltip(false)
        fadeOutTimeout.current = setTimeout(() => setTooltipVisible(false), 180)
    }

    const tooltipStyle = {
        position: "absolute",
        left: `calc(${percent}% - ${tooltipWidth / 2}px + ${thumbSize / 2}px)`,
        top: thumbSize + 10,
        minWidth: 0,
        width: 'max-content',
        padding: tooltipPadding,
        background: tooltipBg,
        color: tooltipTextColor,
        borderRadius: tooltipRadius,
        fontWeight: 600,
        fontSize: 15,
        textAlign: "center",
        pointerEvents: showTooltip ? "auto" : "none",
        opacity: tooltipVisible ? (showTooltip ? 1 : 0) : 0,
        transition: showTooltip ? "opacity 0.18s cubic-bezier(.4,1,.4,1)" : "opacity 0.18s 0.18s cubic-bezier(.4,1,.4,1)",
        backdropFilter: tooltipBlur ? `blur(${tooltipBlur}px)` : undefined,
        WebkitBackdropFilter: tooltipBlur ? `blur(${tooltipBlur}px)` : undefined,
        ...tooltipFont,
    }

    // Price row
    const priceRowStyle = {
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 8,
        marginBottom: props.priceButtonGap ?? 0,
    }
    const priceLabelStyle = {
        color: priceLabelColor,
        fontWeight: 500,
        fontSize: 15,
        ...priceLabelFont,
    }
    const priceValueStyle = {
        color: priceColor,
        fontWeight: 800,
        fontSize: 38,
        letterSpacing: "-0.03em",
        ...priceFont,
    }
    const priceUnitStyle = {
        color: priceUnitColor,
        fontWeight: 500,
        fontSize: 18,
        marginLeft: 6,
    }

    // Button
    const buttonStyle = {
        width: "100%",
        marginTop: 24,
        padding: buttonPadding,
        border: "none",
        borderRadius: buttonRadius,
        background: buttonGradient,
        color: buttonTextColor,
        fontWeight: 800,
        fontSize: 16,
        letterSpacing: "0.08em",
        boxShadow: "none",
        cursor: "pointer",
        ...buttonFont,
    }

    // Question
    const questionStyle = {
        color: questionColor,
        fontWeight: 500,
        fontSize: 18,
        marginBottom: 8,
        ...questionFont,
    }

    // Slider drag state
    const [dragging, setDragging] = React.useState(false)
    const sliderRef = React.useRef(null)

    // Calculate value from pointer position
    function getValueFromEvent(e) {
        const slider = sliderRef.current
        if (!slider) return visitors
        const rect = slider.getBoundingClientRect()
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        let percent = (clientX - rect.left) / rect.width
        percent = Math.max(0, Math.min(1, percent))
        // Round to nearest 1000
        const raw = minVisitors + percent * (maxVisitors - minVisitors)
        return Math.round(raw / 1000) * 1000
    }

    // Mouse/touch handlers
    function handleTrackClick(e) {
        setVisitors(getValueFromEvent(e))
    }
    function handleThumbDown(e) {
        e.preventDefault()
        setDragging(true)
    }
    React.useEffect(() => {
        if (!dragging) return
        function move(ev) {
            setVisitors(getValueFromEvent(ev))
        }
        function up() {
            setDragging(false)
        }
        window.addEventListener("mousemove", move)
        window.addEventListener("mouseup", up)
        window.addEventListener("touchmove", move)
        window.addEventListener("touchend", up)
        return () => {
            window.removeEventListener("mousemove", move)
            window.removeEventListener("mouseup", up)
            window.removeEventListener("touchmove", move)
            window.removeEventListener("touchend", up)
        }
    }, [dragging, minVisitors, maxVisitors])

    // Keyboard accessibility
    function handleKeyDown(e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            setVisitors((v) => Math.max(minVisitors, Math.round((v - 1000) / 1000) * 1000))
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            setVisitors((v) => Math.min(maxVisitors, Math.round((v + 1000) / 1000) * 1000))
        }
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 420,
            }}
        >
            <div style={cardStyle}>
                <div style={questionStyle}>
                    {question || "What’s your average monthly visitors?"}
                </div>
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: 48,
                        margin: "16px 0 0 0",
                    }}
                >
                    <div
                        style={sliderTrackStyle}
                        ref={sliderRef}
                        onClick={handleTrackClick}
                        onTouchStart={handleTrackClick}
                        onMouseEnter={handleSliderEnter}
                        onMouseLeave={handleSliderLeave}
                    >
                        <div style={sliderActiveStyle} />
                        <div
                            style={sliderThumbStyle}
                            tabIndex={0}
                            role="slider"
                            aria-valuenow={visitors}
                            aria-valuemin={minVisitors}
                            aria-valuemax={maxVisitors}
                            aria-label="Monthly visitors"
                            onMouseDown={handleThumbDown}
                            onTouchStart={handleThumbDown}
                            onKeyDown={handleKeyDown}
                            onFocus={handleSliderEnter}
                            onBlur={handleSliderLeave}
                        >
                            <div style={tooltipStyle} ref={tooltipRef}>
                                {(tooltipFormat || "{visitors}")
                                    .replace(
                                        "{visitors}",
                                        visitors.toLocaleString()
                                    )
                                    .replace("{price}", tier.price)}
                                <span style={{marginLeft: 4}}>/mo</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={priceRowStyle}>
                    <span style={priceLabelStyle}>
                        {priceLabel || "Your price"}
                    </span>
                    <span style={{ display: "flex", alignItems: "flex-end" }}>
                        <span style={priceValueStyle}>${animatedPrice}</span>
                        <span style={priceUnitStyle}>/month</span>
                    </span>
                </div>
                <button style={buttonStyle}>{buttonLabel}</button>
            </div>
        </div>
    )
}

addPropertyControls(PricingSlider, {
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 1,
    },
    priceButtonGap: {
        type: ControlType.Number,
        title: "Price/Button Gap",
        defaultValue: 0,
        min: 0,
        max: 80,
        step: 1,
    },
    tooltip: {
        type: ControlType.Object,
        title: "Tooltip",
        controls: {
            tooltipFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Medium",
                    fontSize: "15px",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
            tooltipTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#6A4DFF",
            },
            tooltipBg: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#fff",
            },
            tooltipFormat: {
                type: ControlType.String,
                title: "Format",
                defaultValue: "{visitors}",
                description: "Use {visitors} and {price} as placeholders.",
            },
            tooltipPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "6px 14px",
            },
            tooltipRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "8px",
            },
            tooltipBlur: {
                type: ControlType.Number,
                title: "Background Blur",
                defaultValue: 0,
                min: 0,
                max: 40,
                step: 1,
            },
        },
    },
    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            cardBg: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#fff",
            },
            cardRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 20,
                min: 0,
                max: 40,
            },
            cardShadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "#8855FF",
            },
            cardBorder: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "#EEEEEE",
                },
            },
        },
    },
    slider: {
        type: ControlType.Object,
        title: "Slider",
        controls: {
            minVisitors: {
                type: ControlType.Number,
                title: "Min Visitors",
                defaultValue: 100,
                min: 0,
                max: 1000000,
                step: 100,
            },
            maxVisitors: {
                type: ControlType.Number,
                title: "Max Visitors",
                defaultValue: 1000000,
                min: 100,
                max: 1000000,
                step: 100,
            },
            defaultVisitors: {
                type: ControlType.Number,
                title: "Default Visitors",
                defaultValue: 100,
                min: 0,
                max: 1000000,
                step: 100,
            },
            sliderTrackColor: {
                type: ControlType.Color,
                title: "Track Color",
                defaultValue: "#F5F5F5",
            },
            sliderActiveColor: {
                type: ControlType.Color,
                title: "Active Color",
                defaultValue: "#6A4DFF",
            },
            thumbBorderColor: {
                type: ControlType.Color,
                title: "Thumb Border",
                defaultValue: "#6A4DFF",
            },
            thumbBg: {
                type: ControlType.Color,
                title: "Thumb BG",
                defaultValue: "#fff",
            },
            thumbSize: {
                type: ControlType.Number,
                title: "Thumb Size",
                defaultValue: 32,
                min: 20,
                max: 48,
            },
        },
    },
    price: {
        type: ControlType.Object,
        title: "Price Display",
        controls: {
            priceColor: {
                type: ControlType.Color,
                title: "Price Color",
                defaultValue: "#6A4DFF",
            },
            priceUnitColor: {
                type: ControlType.Color,
                title: "Unit Color",
                defaultValue: "#B0B0C3",
            },
            priceLabelColor: {
                type: ControlType.Color,
                title: "Label Color",
                defaultValue: "#B0B0C3",
            },
            priceFont: {
                type: ControlType.Font,
                title: "Price Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Bold",
                    fontSize: "38px",
                    letterSpacing: "-0.03em",
                    lineHeight: "1em",
                },
            },
            priceLabelFont: {
                type: ControlType.Font,
                title: "Label Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Medium",
                    fontSize: "15px",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
        },
    },
    questionGroup: {
        type: ControlType.Object,
        title: "Question",
        controls: {
            question: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "What’s your average monthly revenue?",
            },
            questionColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#B0B0C3",
            },
            questionFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Medium",
                    fontSize: "18px",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
        },
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            buttonLabel: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "START YOUR 14-DAY FREE TRIAL",
            },
            buttonGradient: {
                type: ControlType.Color,
                title: "Gradient",
                defaultValue:
                    "linear-gradient(90deg, #8855FF 0%, #6A4DFF 100%)",
            },
            buttonShadow: {
                type: ControlType.String,
                title: "Shadow",
                defaultValue: "0 4px 16px 0 rgba(136,85,255,0.18)",
            },
            buttonTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#fff",
            },
            buttonRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 40,
            },
            buttonFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Bold",
                    fontSize: "16px",
                    letterSpacing: "0.08em",
                    lineHeight: "1em",
                },
            },
            buttonPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "18px 0",
            },
        },
    },
    priceLabel: {
        type: ControlType.String,
        title: "Price Label",
        defaultValue: "Your price",
    },
})
