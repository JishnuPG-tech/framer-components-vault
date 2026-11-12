// User instructions: "banao ya" — Create a Framer component replicating the attached “Get a Quote” glassmorphism pricing card with team-size slider, priority support toggle, total price, and checkout button.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"
import { startTransition, useCallback, useMemo, useRef, useState, type CSSProperties } from "react"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type CurrencyPosition = "prefix" | "suffix"

interface GetAQuoteCardProps {
    title: string
    subtitle: string

    minSeats: number
    maxSeats: number
    stepSeats: number
    initialSeats: number

    pricePerSeat: number
    prioritySupportFee: number
    initialPrioritySupport: boolean

    currencySymbol: string
    currencyPosition: CurrencyPosition
    perLabel: string

    labelTeamSize: string
    teamSizeLine: string
    seatsSuffix: string
    labelPrioritySupport: string
    labelSupportPill: string
    labelTotal: string
    buttonLabel: string

    backgroundImage: ResponsiveImage
    cardBackground: string
    borderColor: string
    dividerColor: string

    textPrimary: string
    textSecondary: string

    sliderTrack: string
    sliderFill: string
    sliderThumb: string

    toggleOffTrack: string
    toggleOnTrack: string
    toggleThumb: string

    buttonBackground: string
    buttonText: string

    radius: number
    padding: number

    titleFont: any
    subtitleFont: any
    labelFont: any
    pillFont: any
    totalLabelFont: any
    totalValueFont: any
    buttonFont: any

    checkoutUrl: string
    openInNewTab: boolean

    onCheckout: (event?: any) => void

    style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function formatMoney(value: number, currencySymbol: string, position: CurrencyPosition) {
    const rounded = Math.round(value)
    const str = String(rounded)
    return position === "prefix" ? `${currencySymbol}${str}` : `${str}${currencySymbol}`
}

/**
 * Get a Quote Card
 *
 * @framerIntrinsicWidth 760
 * @framerIntrinsicHeight 420
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GetAQuoteCard(props: GetAQuoteCardProps) {
    const {
        title,
        subtitle,
        minSeats,
        maxSeats,
        stepSeats,
        initialSeats,
        pricePerSeat,
        prioritySupportFee,
        initialPrioritySupport,
        currencySymbol,
        currencyPosition,
        perLabel,
        labelTeamSize,
        teamSizeLine,
        seatsSuffix,
        labelPrioritySupport,
        labelSupportPill,
        labelTotal,
        buttonLabel,
        backgroundImage = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Background gradient",
        },
        cardBackground,
        borderColor,
        dividerColor,
        textPrimary,
        textSecondary,
        sliderTrack,
        sliderFill,
        sliderThumb,
        toggleOffTrack,
        toggleOnTrack,
        toggleThumb,
        buttonBackground,
        buttonText,
        radius,
        padding,
        titleFont,
        subtitleFont,
        labelFont,
        pillFont,
        totalLabelFont,
        totalValueFont,
        buttonFont,
        checkoutUrl,
        openInNewTab,
        onCheckout,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const inViewRef = useRef<HTMLElement | null>(null)
    const isInView = useInView(inViewRef, { margin: "-10% 0px -10% 0px" })

    const [seats, setSeats] = useState(() => clamp(initialSeats, minSeats, maxSeats))
    const [prioritySupport, setPrioritySupport] = useState(() => initialPrioritySupport)

    const total = useMemo(() => {
        const base = seats * pricePerSeat
        const addOn = prioritySupport ? prioritySupportFee : 0
        return base + addOn
    }, [seats, pricePerSeat, prioritySupport, prioritySupportFee])

    const sliderPct = useMemo(() => {
        const denom = Math.max(1, maxSeats - minSeats)
        return ((seats - minSeats) / denom) * 100
    }, [seats, minSeats, maxSeats])

    const handleSlider = useCallback(
        (e: any) => {
            const next = clamp(Number(e?.target?.value ?? minSeats), minSeats, maxSeats)
            startTransition(() => setSeats(next))
        },
        [minSeats, maxSeats]
    )

    const toggle = useCallback(() => {
        startTransition(() => setPrioritySupport((v) => !v))
    }, [])

    const buttonClick = useCallback(
        (e: any) => {
            if (typeof onCheckout === "function") onCheckout(e)

            if (checkoutUrl && typeof window !== "undefined") {
                try {
                    if (openInNewTab) window.open(checkoutUrl, "_blank", "noopener,noreferrer")
                    else window.location.href = checkoutUrl
                } catch (err) {
                    // Ignore navigation failures in restricted environments
                }
            }
        },
        [onCheckout, checkoutUrl, openInNewTab]
    )

    const isFixedWidth = !!(style && style.width === "100%")

    const rootStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: radius,
        ...style,
        ...(isFixedWidth ? null : { minWidth: 520 }),
    }

    const overlayStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${backgroundImage.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(0px)",
        transform: "scale(1.08)",
    }

    const glassStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        background: cardBackground,
        border: `1px solid ${borderColor}`,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 20px 70px rgba(0,0,0,0.45)",
    }

    const contentStyle: CSSProperties = {
        position: "relative",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        padding,
        gap: 18,
        color: textPrimary,
    }

    const sliderWrapStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: 28,
        display: "flex",
        alignItems: "center",
    }

    const sliderBase: CSSProperties = {
        WebkitAppearance: "none",
        appearance: "none",
        width: "100%",
        height: 3,
        borderRadius: 999,
        background: sliderTrack,
        outline: "none",
        margin: 0,
        padding: 0,
    }

    // Custom thumb styling via inline <style> (scoped by data attribute)
    const sliderCSS = useMemo(() => {
        const thumbSize = 16
        return `
        [data-framer-quote-slider]::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:${thumbSize}px; height:${thumbSize}px; border-radius:999px; background:${sliderThumb}; border:2px solid rgba(255,255,255,0.9); box-shadow:0 6px 20px rgba(0,0,0,0.45); cursor:pointer; }
        [data-framer-quote-slider]::-moz-range-thumb{ width:${thumbSize}px; height:${thumbSize}px; border-radius:999px; background:${sliderThumb}; border:2px solid rgba(255,255,255,0.9); box-shadow:0 6px 20px rgba(0,0,0,0.45); cursor:pointer; }
        [data-framer-quote-slider]::-moz-range-track{ height:3px; border-radius:999px; background:${sliderTrack}; }
        `
    }, [sliderThumb, sliderTrack])

    const Toggle = (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={prioritySupport}
            aria-label={labelPrioritySupport}
            style={{
                position: "relative",
                width: 54,
                height: 28,
                borderRadius: 999,
                border: `1px solid ${borderColor}`,
                background: prioritySupport ? toggleOnTrack : toggleOffTrack,
                cursor: "pointer",
                padding: 0,
                outline: "none",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: 3,
                    left: prioritySupport ? 28 : 3,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: toggleThumb,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                    transition: "left 180ms ease",
                }}
            />
        </button>
    )

    return (
        <section ref={(node) => { inViewRef.current = node as any }} style={rootStyle} aria-label={title}>
            <div style={overlayStyle} aria-hidden="true" />
            <div style={glassStyle} aria-hidden="true" />

            <div style={contentStyle}>
                <style>{sliderCSS}</style>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ ...titleFont, color: textPrimary }}>{title}</div>
                    <div style={{ ...subtitleFont, color: textSecondary }}>{subtitle}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div style={{ ...labelFont, color: textPrimary, opacity: 0.95 }}>{labelTeamSize}</div>
                        <div style={{ ...labelFont, color: textPrimary, opacity: 0.95 }}>\n                            {seats} {seatsSuffix}\n                        </div>
                    </div>

                    <div style={sliderWrapStyle}>
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: "50%",
                                height: 3,
                                borderRadius: 999,
                                width: `${sliderPct}%`,
                                background: sliderFill,
                                transform: "translateY(-50%)",
                            }}
                        />
                        <input
                            data-framer-quote-slider
                            type="range"
                            min={minSeats}
                            max={maxSeats}
                            step={stepSeats}
                            value={seats}
                            onChange={handleSlider}
                            aria-label={labelTeamSize}
                            style={{ ...sliderBase, background: "transparent", position: "relative", zIndex: 1 }}
                        />
                    </div>

                    <div style={{ ...subtitleFont, color: textSecondary, opacity: 0.9 }}>
                        {teamSizeLine.replace(/\{\{\s*value\s*\}\}/g, String(seats)).replace(/\{\{\s*suffix\s*\}\}/g, seatsSuffix)}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ ...labelFont, color: textPrimary, opacity: 0.95 }}>{labelPrioritySupport}</div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "12px 14px",
                            borderRadius: 14,
                            border: `1px solid ${borderColor}`,
                            background: "rgba(255,255,255,0.06)",
                        }}
                    >
                        <div
                            style={{
                                ...pillFont,
                                color: textSecondary,
                                opacity: 0.95,
                                minWidth: "max-content",
                            }}
                        >
                            {labelSupportPill}
                        </div>
                        {Toggle}
                    </div>
                </div>

                <div style={{ height: 1, width: "100%", background: dividerColor, opacity: 0.9, marginTop: 2 }} />

                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ ...totalLabelFont, color: textSecondary }}>{labelTotal}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <div style={{ ...totalValueFont, color: textPrimary, minWidth: "max-content" }}>
                            {formatMoney(total, currencySymbol, currencyPosition)}
                        </div>
                        <div style={{ ...labelFont, color: textSecondary, opacity: 0.9, minWidth: "max-content" }}>
                            {perLabel}
                        </div>
                    </div>
                </div>

                <motion.button
                    type="button"
                    onClick={buttonClick}
                    whileHover={isStatic ? undefined : { y: -1, scale: 1.01 }}
                    whileTap={isStatic ? undefined : { scale: 0.99 }}
                    animate={isStatic ? undefined : isInView ? { opacity: 1, y: 0 } : { opacity: 0.92, y: 6 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
                    style={{
                        marginTop: "auto",
                        width: "100%",
                        height: 54,
                        borderRadius: 14,
                        border: `1px solid ${borderColor}`,
                        background: `linear-gradient(135deg, ${buttonBackground} 0%, rgba(255,255,255,0.72) 120%)`,
                        color: buttonText,
                        cursor: "pointer",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
                        outline: "none",
                        position: "relative",
                        overflow: "hidden",
                        ...buttonFont,
                    }}
                    aria-label={buttonLabel}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: -2,
                            background: "radial-gradient(800px 120px at 20% 0%, rgba(255,255,255,0.65), transparent 55%)",
                            opacity: 0.55,
                            pointerEvents: "none",
                        }}
                    />
                    <span style={{ position: "relative" }}>{buttonLabel}</span>
                </motion.button>
            </div>
        </section>
    )
}

addPropertyControls(GetAQuoteCard, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Get a Quote",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Customize your plan.",
    },

    labelTeamSize: {
        type: ControlType.String,
        title: "Team Label",
        defaultValue: "Team Size",
    },
    teamSizeLine: {
        type: ControlType.String,
        title: "Team Line",
        defaultValue: "Team size: {{value}} {{suffix}}",
    },
    seatsSuffix: {
        type: ControlType.String,
        title: "Seats Suffix",
        defaultValue: "seats",
    },
    labelPrioritySupport: {
        type: ControlType.String,
        title: "Support Label",
        defaultValue: "Priority Support",
    },
    labelSupportPill: {
        type: ControlType.String,
        title: "Support Text",
        defaultValue: "24/7 Response",
    },
    labelTotal: {
        type: ControlType.String,
        title: "Total Label",
        defaultValue: "Total",
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Checkout",
    },

    minSeats: {
        type: ControlType.Number,
        title: "Min Seats",
        defaultValue: 1,
        min: 1,
        max: 999,
        step: 1,
    },
    maxSeats: {
        type: ControlType.Number,
        title: "Max Seats",
        defaultValue: 20,
        min: 2,
        max: 999,
        step: 1,
    },
    stepSeats: {
        type: ControlType.Number,
        title: "Step",
        defaultValue: 1,
        min: 1,
        max: 50,
        step: 1,
    },
    initialSeats: {
        type: ControlType.Number,
        title: "Initial",
        defaultValue: 9,
        min: 1,
        max: 999,
        step: 1,
    },

    pricePerSeat: {
        type: ControlType.Number,
        title: "Price/Seat",
        defaultValue: 21,
        min: 0,
        max: 10000,
        step: 1,
    },
    prioritySupportFee: {
        type: ControlType.Number,
        title: "Support Fee",
        defaultValue: 199,
        min: 0,
        max: 100000,
        step: 1,
    },
    initialPrioritySupport: {
        type: ControlType.Boolean,
        title: "Support",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    currencySymbol: {
        type: ControlType.String,
        title: "Currency",
        defaultValue: "$",
    },
    currencyPosition: {
        type: ControlType.Enum,
        title: "Cur Pos",
        options: ["prefix", "suffix"],
        optionTitles: ["$123", "123$"],
        defaultValue: "prefix",
        displaySegmentedControl: true,
    },
    perLabel: {
        type: ControlType.String,
        title: "Per",
        defaultValue: "/mo",
    },

    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background",
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "rgba(20, 20, 20, 0.55)",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255, 255, 255, 0.10)",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider",
        defaultValue: "rgba(255, 255, 255, 0.12)",
    },

    textPrimary: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    textSecondary: {
        type: ControlType.Color,
        title: "Subtext",
        defaultValue: "rgba(255, 255, 255, 0.70)",
    },

    sliderTrack: {
        type: ControlType.Color,
        title: "S Track",
        defaultValue: "rgba(255, 255, 255, 0.22)",
    },
    sliderFill: {
        type: ControlType.Color,
        title: "S Fill",
        defaultValue: "rgba(255, 255, 255, 0.85)",
    },
    sliderThumb: {
        type: ControlType.Color,
        title: "S Thumb",
        defaultValue: "#FFFFFF",
    },

    toggleOffTrack: {
        type: ControlType.Color,
        title: "T Off",
        defaultValue: "rgba(255, 255, 255, 0.12)",
    },
    toggleOnTrack: {
        type: ControlType.Color,
        title: "T On",
        defaultValue: "rgba(255, 255, 255, 0.28)",
    },
    toggleThumb: {
        type: ControlType.Color,
        title: "T Thumb",
        defaultValue: "#FFFFFF",
    },

    buttonBackground: {
        type: ControlType.Color,
        title: "Btn Bg",
        defaultValue: "#FFFFFF",
    },
    buttonText: {
        type: ControlType.Color,
        title: "Btn Text",
        defaultValue: "#0B0B0B",
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 26,
        min: 0,
        max: 60,
        step: 1,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 26,
        min: 0,
        max: 80,
        step: 1,
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    pillFont: {
        type: ControlType.Font,
        title: "Pill Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    totalLabelFont: {
        type: ControlType.Font,
        title: "Total Label",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    totalValueFont: {
        type: ControlType.Font,
        title: "Total Value",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "44px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },

    onCheckout: {
        type: ControlType.EventHandler,
        title: "Checkout",
    },
    checkoutUrl: {
        type: ControlType.Link,
        title: "Checkout URL",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ checkoutUrl }) => !checkoutUrl,
    },
})
