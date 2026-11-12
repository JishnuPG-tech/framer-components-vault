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


/**
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 50
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost"
type IconPosition = "left" | "right"

interface ButtonProps {
    label?: string
    variant?: ButtonVariant
    disabled?: boolean
    loading?: boolean
    fullWidth?: boolean
    showIcon?: boolean
    iconPosition?: IconPosition
    fontFamily?: string
    buttonHeight?: number
    paddingX?: number
    fontSize?: number
    radius?: number
    gap?: number
    accentColor?: string
    accentTextColor?: string
    secondaryColor?: string
    secondaryTextColor?: string
    borderWidth?: number
    ringColor?: string
    ringWidth?: number
    duration?: number
}

function Spinner({
    size,
    color,
    isStatic,
    isVisible,
}: {
    size: number
    color: string
    isStatic: boolean
    isVisible: boolean
}) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0 }}
            animate={isStatic || !isVisible ? { rotate: 0 } : { rotate: 360 }}
            transition={
                isStatic || !isVisible
                    ? { duration: 0 }
                    : { duration: 0.7, repeat: Infinity, ease: "linear" }
            }
            aria-hidden="true"
        >
            <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke={color}
                strokeOpacity="0.25"
                strokeWidth="2"
            />
            <path
                d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </motion.svg>
    )
}

function ArrowIcon({ color }: { color: string }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M3 7h8M8 3.5L11.5 7 8 10.5"
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function ActionButton({
    label = "Button",
    variant = "primary",
    disabled = false,
    loading = false,
    fullWidth = false,
    showIcon = false,
    iconPosition = "left",
    fontFamily = "Inter, system-ui, sans-serif",
    buttonHeight = 50,
    paddingX,
    fontSize,
    radius,
    gap,
    accentColor = "#f59e0b",
    accentTextColor = "#ffffff",
    secondaryColor = "#f3f4f6",
    secondaryTextColor = "#111827",
    borderWidth = 1.5,
    ringColor = "rgba(245,158,11,0.25)",
    ringWidth = 3,
    duration = 0.18,
    isStatic,
    isVisible,
}: ButtonProps & { isStatic: boolean; isVisible: boolean }) {
    const [focused, setFocused] = React.useState(false)
    const isInactive = disabled || loading
    const resolvedPaddingX = paddingX ?? Math.round(buttonHeight * 0.55)
    const resolvedFontSize =
        fontSize ?? Math.max(13, Math.round(buttonHeight * 0.32))
    const resolvedRadius = radius ?? Math.round(buttonHeight * 0.28)
    const resolvedGap = gap ?? Math.round(buttonHeight * 0.2)
    const spinnerSize = resolvedFontSize * 1.05
    const iconColor =
        variant === "primary"
            ? accentTextColor
            : variant === "secondary"
              ? secondaryTextColor
              : accentColor

    const variantStyle: React.CSSProperties =
        variant === "primary"
            ? {
                  backgroundColor: accentColor,
                  color: accentTextColor,
                  border: "none",
              }
            : variant === "secondary"
              ? {
                    backgroundColor: secondaryColor,
                    color: secondaryTextColor,
                    border: "none",
                }
              : variant === "outline"
                ? {
                      backgroundColor: "transparent",
                      color: accentColor,
                      border: `${borderWidth}px solid ${accentColor}`,
                  }
                : {
                      backgroundColor: "transparent",
                      color: accentColor,
                      border: "none",
                  }

    return (
        <motion.button
            type="button"
            disabled={isInactive}
            aria-label={label}
            aria-busy={loading || undefined}
            aria-disabled={isInactive || undefined}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
                boxSizing: "border-box",
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                userSelect: "none",
                width: fullWidth ? "100%" : "auto",
                minWidth: fullWidth ? "100%" : 128,
                height: buttonHeight,
                paddingLeft: resolvedPaddingX,
                paddingRight: resolvedPaddingX,
                gap: resolvedGap,
                borderRadius: resolvedRadius,
                fontFamily,
                fontSize: resolvedFontSize,
                lineHeight: 1,
                whiteSpace: "nowrap",
                cursor: isInactive ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : loading ? 0.85 : 1,
                flexShrink: 0,
                outline: "none",
                boxShadow: focused
                    ? `0 0 0 ${ringWidth}px ${ringColor}`
                    : "none",
                transition: isStatic
                    ? "none"
                    : `box-shadow ${duration}s ease, opacity ${duration}s ease`,
                ...variantStyle,
            }}
            initial={false}
            whileHover={isStatic || isInactive ? undefined : { scale: 1.02 }}
            whileTap={isStatic || isInactive ? undefined : { scale: 0.96 }}
            transition={isStatic ? { duration: 0 } : { duration }}
        >
            {loading ? (
                <Spinner
                    size={spinnerSize}
                    color={iconColor}
                    isStatic={isStatic}
                    isVisible={isVisible}
                />
            ) : (
                showIcon &&
                iconPosition === "left" && <ArrowIcon color={iconColor} />
            )}
            <span style={{ lineHeight: 1, whiteSpace: "nowrap" }}>{label}</span>
            {!loading && showIcon && iconPosition === "right" && (
                <ArrowIcon color={iconColor} />
            )}
        </motion.button>
    )
}

const VARIANTS: { id: ButtonVariant; label: string }[] = [
    { id: "primary", label: "Primary" },
    { id: "secondary", label: "Secondary" },
    { id: "outline", label: "Outline" },
    { id: "ghost", label: "Ghost" },
]

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: 8,
            }}
        >
            {children}
        </div>
    )
}

function DemoSwitch({
    checked,
    onChange,
    label,
}: {
    checked: boolean
    onChange: () => void
    label: string
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            style={{
                width: 40,
                height: 22,
                borderRadius: 999,
                border: "none",
                padding: 2,
                cursor: "pointer",
                background: checked ? "#f4f4f5" : "#2a2a2a",
                display: "flex",
                alignItems: "center",
                justifyContent: checked ? "flex-end" : "flex-start",
            }}
        >
            <div
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: checked ? "#111" : "#6b6b6b",
                }}
            />
        </button>
    )
}

interface ComponentProps extends ButtonProps {
    demoMode?: boolean
    style?: React.CSSProperties
}

function useContainerWidth(
    ref: React.RefObject<HTMLDivElement | null>,
    isStatic: boolean,
    enabled: boolean
) {
    const [width, setWidth] = React.useState(900)

    React.useEffect(() => {
        if (isStatic || !enabled) return
        const node = ref.current
        if (!node) return
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            setWidth(entry.contentRect.width)
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [isStatic, enabled, ref])

    return width
}

export default function CTAButtonPro(props: ComponentProps) {
    const {
        demoMode = false,
        variant = "primary",
        accentColor = "#f59e0b",
        buttonHeight = 50,
        loading = false,
        disabled = false,
        style,
        ...rest
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const isVisibleRef = React.useRef(true)
    const [isVisible, setIsVisible] = React.useState(true)
    const boxWidth = useContainerWidth(rootRef, isStatic, demoMode)
    const isMobile = boxWidth < 720

    const [liveVariant, setLiveVariant] = React.useState<ButtonVariant>(variant)
    const [liveAccent, setLiveAccent] = React.useState(accentColor)
    const [liveHeight, setLiveHeight] = React.useState(buttonHeight)
    const [liveLoading, setLiveLoading] = React.useState(loading)
    const [liveDisabled, setLiveDisabled] = React.useState(disabled)

    React.useEffect(() => setLiveVariant(variant), [variant])
    React.useEffect(() => setLiveAccent(accentColor), [accentColor])
    React.useEffect(() => setLiveHeight(buttonHeight), [buttonHeight])
    React.useEffect(() => setLiveLoading(loading), [loading])
    React.useEffect(() => setLiveDisabled(disabled), [disabled])

    React.useEffect(() => {
        if (isStatic) return
        const node = rootRef.current
        if (!node) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting
                isVisibleRef.current = visible
                setIsVisible(visible)
            },
            { threshold: 0 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [isStatic])

    return (
        <div
            ref={rootRef}
            role="group"
            aria-label="Call to action button"
            style={{
                ...style,
                position: "relative",
                overflow: "visible",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: demoMode && isMobile ? 138 : 0,
                boxSizing: "border-box",
            }}
        >
            {demoMode && (
                <div
                    style={{
                        position: "absolute",
                        top: isMobile ? 8 : undefined,
                        bottom: isMobile ? undefined : "calc(100% + 12px)",
                        left: isMobile ? 8 : "50%",
                        right: isMobile ? 8 : undefined,
                        transform: isMobile ? "none" : "translateX(-50%)",
                        zIndex: 50,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: isMobile ? "stretch" : "flex-end",
                            justifyContent: isMobile ? "flex-start" : "center",
                            flexWrap: "wrap",
                            gap: isMobile ? 12 : 22,
                            padding: isMobile ? 12 : "14px 16px",
                            borderRadius: isMobile ? 16 : 18,
                            background: "#141414",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                            width: isMobile ? "100%" : "max-content",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                flex: isMobile ? "1 1 100%" : "0 0 auto",
                                minWidth: 0,
                            }}
                        >
                            <FieldLabel>VARIANT</FieldLabel>
                            <div
                                role="radiogroup"
                                aria-label="Button variant"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: 2,
                                    padding: 3,
                                    borderRadius: 999,
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.03)",
                                    width: isMobile ? "100%" : "auto",
                                    boxSizing: "border-box",
                                }}
                            >
                                {VARIANTS.map((item) => {
                                    const active = liveVariant === item.id
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            onClick={() =>
                                                setLiveVariant(item.id)
                                            }
                                            style={{
                                                border: "none",
                                                cursor: "pointer",
                                                height: 28,
                                                padding: "0 10px",
                                                borderRadius: 999,
                                                fontSize: isMobile ? 12 : 13,
                                                fontWeight: 600,
                                                background: active
                                                    ? "#fff"
                                                    : "transparent",
                                                color: active
                                                    ? "#111"
                                                    : "rgba(255,255,255,0.62)",
                                                flex: isMobile
                                                    ? "1 1 auto"
                                                    : "0 0 auto",
                                                transition: isStatic
                                                    ? "none"
                                                    : "background 0.16s ease, color 0.16s ease",
                                            }}
                                        >
                                            {item.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div style={{ flex: "0 0 auto" }}>
                            <FieldLabel>ACCENT</FieldLabel>
                            <label
                                style={{
                                    width: 42,
                                    height: 32,
                                    borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.03)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    position: "relative",
                                }}
                            >
                                <span
                                    style={{
                                        width: 26,
                                        height: 14,
                                        borderRadius: 4,
                                        background: liveAccent,
                                        display: "block",
                                    }}
                                />
                                <input
                                    type="color"
                                    aria-label="Accent color"
                                    value={liveAccent}
                                    onChange={(e) =>
                                        setLiveAccent(e.target.value)
                                    }
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        opacity: 0,
                                        cursor: "pointer",
                                    }}
                                />
                            </label>
                        </div>

                        <div
                            style={{
                                flex: isMobile ? "1 1 140px" : "0 0 140px",
                                minWidth: 120,
                            }}
                        >
                            <FieldLabel>HEIGHT</FieldLabel>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    height: 32,
                                }}
                            >
                                <input
                                    type="range"
                                    min={32}
                                    max={72}
                                    value={liveHeight}
                                    aria-label="Button height"
                                    onChange={(e) =>
                                        setLiveHeight(Number(e.target.value))
                                    }
                                    style={{
                                        flex: 1,
                                        height: 4,
                                        borderRadius: 999,
                                        accentColor: "#ffffff",
                                        cursor: "pointer",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: "rgba(255,255,255,0.7)",
                                        width: 18,
                                    }}
                                >
                                    {liveHeight}
                                </span>
                            </div>
                        </div>

                        <div style={{ flex: "0 0 auto" }}>
                            <FieldLabel>LOADING</FieldLabel>
                            <div
                                style={{
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <DemoSwitch
                                    label="Loading"
                                    checked={liveLoading}
                                    onChange={() => setLiveLoading((v) => !v)}
                                />
                            </div>
                        </div>

                        <div style={{ flex: "0 0 auto" }}>
                            <FieldLabel>DISABLED</FieldLabel>
                            <div
                                style={{
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <DemoSwitch
                                    label="Disabled"
                                    checked={liveDisabled}
                                    onChange={() => setLiveDisabled((v) => !v)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ActionButton
                {...rest}
                variant={liveVariant}
                accentColor={liveAccent}
                buttonHeight={liveHeight}
                loading={liveLoading}
                disabled={liveDisabled}
                isStatic={isStatic}
                isVisible={isVisible}
            />
        </div>
    )
}

addPropertyControls(CTAButtonPro, {
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Shows a live preview bar for variant, accent, height and states.",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Button",
        description: "Visible button text and accessible name.",
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["primary", "secondary", "outline", "ghost"],
        optionTitles: ["Primary", "Secondary", "Outline", "Ghost"],
        defaultValue: "primary",
        description: "Visual style of the call to action.",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    loading: {
        type: ControlType.Boolean,
        title: "Loading",
        defaultValue: false,
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Full Width",
        defaultValue: false,
    },
    showIcon: { type: ControlType.Boolean, title: "Icon", defaultValue: false },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Pos",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        hidden(props) {
            return !props.showIcon
        },
    },
    buttonHeight: {
        type: ControlType.Number,
        title: "Btn Height",
        defaultValue: 50,
        min: 32,
        max: 72,
        step: 1,
        description:
            "Button height in pixels. Typography and padding scale with this value.",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 14,
        min: 0,
        max: 40,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#f59e0b",
    },
    accentTextColor: {
        type: ControlType.Color,
        title: "Accent Text",
        defaultValue: "#ffffff",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary",
        defaultValue: "#f3f4f6",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Sec. Text",
        defaultValue: "#111827",
    },
})
