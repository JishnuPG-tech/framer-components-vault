// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useState, useId } from "react"

const SIZE_PRESETS: Record<
    string,
    { circleSize: number; strokeWidth: number }
> = {
    "2xl": { circleSize: 200, strokeWidth: 20 },
    xl: { circleSize: 160, strokeWidth: 16 },
    lg: { circleSize: 120, strokeWidth: 12 },
    md: { circleSize: 90, strokeWidth: 10 },
    sm: { circleSize: 64, strokeWidth: 8 },
    xs: { circleSize: 44, strokeWidth: 6 },
    "2xs": { circleSize: 32, strokeWidth: 4 },
}

interface Props {
    layout: {
        sizePreset: "2xl" | "xl" | "lg" | "md" | "sm" | "xs" | "2xs" | "custom"
        arcStyle: "ring" | "gauge" | "dashes"
        circleSize: number
        strokeWidth: number
        dashCount: number
        showCenterLabel: boolean
    }
    content: {
        label: string
        percentage: number
        showLabel: boolean
    }
    value: {
        style: "center" | "badge" | "none"
        countUp: boolean
        prefix: string
        suffix: string
        badgeBg: string
        badgeTextColor: string
    }
    fill: {
        colorStart: string
        colorEnd: string
    }
    thresholds: {
        enabled: boolean
        lowMax: number
        lowColor: string
        midMax: number
        midColor: string
        highColor: string
    }
    track: {
        color: string
        borderWidth: number
        borderColor: string
    }
    typography: {
        labelColor: string
        labelSize: number
        labelFont: {
            fontFamily?: string
            fontWeight?: string | number
            fontStyle?: string
        }
        percentageColor: string
        percentageSize: number
        percentageFont: {
            fontFamily?: string
            fontWeight?: string | number
            fontStyle?: string
        }
        spacing: number
    }
    animation: {
        scrollReveal: boolean
        duration: number
        delay: number
        completionPulse: boolean
    }
    comparison: {
        enabled: boolean
        value: number
        color: string
        strokeScale: number
    }
}

export default function ProgressCircleBars(props: Props) {
    const {
        layout,
        content,
        value,
        fill,
        thresholds,
        track,
        typography,
        animation,
        comparison,
    } = props

    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true, amount: 0.3 })
    const [animated, setAnimated] = useState(false)
    const [displayValue, setDisplayValue] = useState(0)
    const [animFillPct, setAnimFillPct] = useState(0)
    const [pulseKey, setPulseKey] = useState(0)
    const didInitialAnim = useRef(false)
    const gradId = `cpb-arc-grad-${useId()}`
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStaticRenderer = useIsStaticRenderer()
    const isStatic = isCanvas || isStaticRenderer

    const clampedPct = Math.min(100, Math.max(0, content.percentage))
    const isComplete = clampedPct === 100
    const shouldAnimate = isCanvas
        ? true
        : animation.scrollReveal
          ? isInView
          : true

    useEffect(() => {
        if (isStatic) {
            setAnimated(true)
            return
        }
        if (!shouldAnimate || animated) return
        const timer = setTimeout(
            () => setAnimated(true),
            animation.delay * 1000
        )
        return () => clearTimeout(timer)
    }, [shouldAnimate, isStatic])

    useEffect(() => {
        if (!animated) return
        if (isStatic) {
            setDisplayValue(clampedPct)
            setAnimFillPct(clampedPct)
            didInitialAnim.current = true
            return
        }
        didInitialAnim.current = false
        const totalFrames = Math.round(animation.duration * 60)
        let frame = 0
        const id = setInterval(() => {
            frame++
            const t = frame / totalFrames
            const eased = 1 - Math.pow(1 - t, 3)
            const animPct = Math.round(eased * clampedPct)
            setDisplayValue(value.countUp ? animPct : clampedPct)
            setAnimFillPct(eased * clampedPct)
            if (frame >= totalFrames) {
                didInitialAnim.current = true
                clearInterval(id)
            }
        }, 1000 / 60)
        return () => clearInterval(id)
    }, [animated, isStatic])

    useEffect(() => {
        if (!animated || !didInitialAnim.current) return
        setDisplayValue(clampedPct)
        setAnimFillPct(clampedPct)
    }, [clampedPct])

    useEffect(() => {
        if (isStatic) return
        if (animated && isComplete && animation.completionPulse) {
            const t = setTimeout(
                () => setPulseKey((k) => k + 1),
                animation.duration * 1000 + 100
            )
            return () => clearTimeout(t)
        }
    }, [animated, isStatic])

    let activeFillStart = fill.colorStart
    let activeFillEnd = fill.colorEnd
    if (thresholds.enabled) {
        const color =
            clampedPct < thresholds.lowMax
                ? thresholds.lowColor
                : clampedPct < thresholds.midMax
                  ? thresholds.midColor
                  : thresholds.highColor
        activeFillStart = color
        activeFillEnd = color
    }

    const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
    const transition = isStatic
        ? { duration: 0 }
        : { duration: animation.duration, ease }

    const isCustomSize = layout.sizePreset === "custom"
    const presetVals = !isCustomSize ? SIZE_PRESETS[layout.sizePreset] : null
    const svgSize = presetVals ? presetVals.circleSize : layout.circleSize
    const sw = presetVals ? presetVals.strokeWidth : layout.strokeWidth
    const r = (svgSize - sw) / 2
    const cx = svgSize / 2
    const cy = svgSize / 2
    const circumference = 2 * Math.PI * r
    const isGauge = layout.arcStyle === "gauge"
    const isDashes = layout.arcStyle === "dashes"

    const ringOffset = animated
        ? circumference * (1 - clampedPct / 100)
        : circumference
    const gaugeFillLength = animated
        ? circumference * 0.75 * (clampedPct / 100)
        : 0

    const showCenterValue = value.style === "center"
    const showBadge = value.style === "badge"

    const gaugeProps = isGauge
        ? {
              strokeDasharray: `${circumference * 0.75} ${circumference * 0.25}`,
              transform: `rotate(135, ${cx}, ${cy})`,
          }
        : {}

    return (
        <div
            ref={ref}
            role="img"
            aria-label={`${content.label}: ${Math.round(clampedPct)}%`}
            style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: typography.spacing,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: svgSize,
                    height: svgSize,
                }}
            >
                <svg
                    width={svgSize}
                    height={svgSize}
                    aria-hidden="true"
                    style={{ overflow: "visible", display: "block" }}
                >
                    <defs>
                        <linearGradient
                            id={gradId}
                            gradientUnits="userSpaceOnUse"
                            x1="0"
                            y1={cy}
                            x2={svgSize}
                            y2={cy}
                        >
                            <stop offset="0%" stopColor={activeFillStart} />
                            <stop offset="100%" stopColor={activeFillEnd} />
                        </linearGradient>
                    </defs>

                    {/* Track border (wider stroke behind track) */}
                    {track.borderWidth > 0 && !isDashes && (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={track.borderColor}
                            strokeWidth={sw + track.borderWidth * 2}
                            strokeLinecap="round"
                            {...gaugeProps}
                        />
                    )}

                    {/* Track */}
                    {!isDashes && (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={track.color}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            {...gaugeProps}
                        />
                    )}

                    {/* Fill — ring */}
                    {!isGauge && !isDashes && (
                        <motion.circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={
                                activeFillStart !== activeFillEnd
                                    ? `url(#${gradId})`
                                    : activeFillStart
                            }
                            strokeWidth={sw}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            transform={`rotate(-90, ${cx}, ${cy})`}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: ringOffset }}
                            transition={transition}
                        />
                    )}

                    {/* Fill — gauge */}
                    {isGauge && !isDashes && (
                        <motion.circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={
                                activeFillStart !== activeFillEnd
                                    ? `url(#${gradId})`
                                    : activeFillStart
                            }
                            strokeWidth={sw}
                            strokeLinecap="round"
                            transform={`rotate(135, ${cx}, ${cy})`}
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            animate={{
                                strokeDasharray: `${gaugeFillLength} ${circumference}`,
                            }}
                            transition={transition}
                        />
                    )}

                    {/* Comparison — ring */}
                    {comparison.enabled && !isDashes && !isGauge && (
                        <motion.circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={comparison.color}
                            strokeWidth={sw * comparison.strokeScale}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            transform={`rotate(-90, ${cx}, ${cy})`}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{
                                strokeDashoffset: animated
                                    ? circumference *
                                      (1 - comparison.value / 100)
                                    : circumference,
                            }}
                            transition={
                                isStatic
                                    ? { duration: 0 }
                                    : {
                                          duration: animation.duration * 0.8,
                                          ease,
                                      }
                            }
                        />
                    )}

                    {/* Comparison — gauge */}
                    {comparison.enabled && !isDashes && isGauge && (
                        <motion.circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={comparison.color}
                            strokeWidth={sw * comparison.strokeScale}
                            strokeLinecap="round"
                            transform={`rotate(135, ${cx}, ${cy})`}
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            animate={{
                                strokeDasharray: `${animated ? circumference * 0.75 * (comparison.value / 100) : 0} ${circumference}`,
                            }}
                            transition={
                                isStatic
                                    ? { duration: 0 }
                                    : {
                                          duration: animation.duration * 0.8,
                                          ease,
                                      }
                            }
                        />
                    )}

                    {/* Fill — dashes */}
                    {isDashes &&
                        (() => {
                            const totalAngle = 360
                            const count = layout.dashCount
                            const stepAngle = totalAngle / count
                            const filledCount = animated
                                ? Math.round((animFillPct / 100) * count)
                                : 0
                            const compCount = comparison.enabled
                                ? Math.round((comparison.value / 100) * count)
                                : 0
                            const dashWidth = Math.max(2, sw * 0.28)
                            const dashFilledH = sw
                            const dashTrackH = sw * 0.4
                            const dashCompH = sw * 0.75
                            const outerY = cy - r - sw / 2

                            return (
                                <>
                                    {comparison.enabled &&
                                        Array.from(
                                            { length: count },
                                            (_, i) => {
                                                if (
                                                    i < filledCount ||
                                                    i >= compCount
                                                )
                                                    return null
                                                return (
                                                    <rect
                                                        key={`c${i}`}
                                                        x={cx - dashWidth / 2}
                                                        y={outerY}
                                                        width={dashWidth}
                                                        height={dashCompH}
                                                        rx={dashWidth / 2}
                                                        fill={comparison.color}
                                                        opacity={0.65}
                                                        transform={`rotate(${stepAngle * i}, ${cx}, ${cy})`}
                                                    />
                                                )
                                            }
                                        )}
                                    {Array.from({ length: count }, (_, i) => {
                                        const isFilled = i < filledCount
                                        const h = isFilled
                                            ? dashFilledH
                                            : dashTrackH
                                        return (
                                            <rect
                                                key={i}
                                                x={cx - dashWidth / 2}
                                                y={outerY}
                                                width={dashWidth}
                                                height={h}
                                                rx={dashWidth / 2}
                                                fill={
                                                    isFilled
                                                        ? activeFillStart !==
                                                          activeFillEnd
                                                            ? `url(#${gradId})`
                                                            : activeFillStart
                                                        : track.color
                                                }
                                                opacity={isFilled ? 1 : 0.55}
                                                transform={`rotate(${stepAngle * i}, ${cx}, ${cy})`}
                                            />
                                        )
                                    })}
                                </>
                            )
                        })()}
                </svg>

                {/* Center text */}
                {(showCenterValue || layout.showCenterLabel) && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            pointerEvents: "none",
                        }}
                    >
                        {showCenterValue && (
                            <span
                                style={{
                                    ...typography.percentageFont,
                                    color: typography.percentageColor,
                                    fontSize: typography.percentageSize,
                                    lineHeight: 1,
                                    letterSpacing: "-0.04em",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {value.prefix}
                                {displayValue}
                                {value.suffix}
                            </span>
                        )}
                        {layout.showCenterLabel && (
                            <span
                                style={{
                                    ...typography.labelFont,
                                    color: typography.labelColor,
                                    fontSize: typography.labelSize,
                                    lineHeight: 1.2,
                                    opacity: 0.55,
                                }}
                            >
                                {content.label}
                            </span>
                        )}
                    </div>
                )}

                {/* Completion pulse */}
                {animation.completionPulse && isComplete && pulseKey > 0 && (
                    <motion.div
                        key={pulseKey}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            border: `${Math.max(2, sw * 0.4)}px solid ${activeFillEnd}`,
                            pointerEvents: "none",
                        }}
                        initial={{ opacity: 0.75, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.15 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                )}
            </div>

            {/* Badge below circle */}
            {showBadge && (
                <motion.div
                    aria-hidden="true"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        pointerEvents: "none",
                        marginTop: -4,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: animated ? 1 : 0 }}
                    transition={transition}
                >
                    <div
                        style={{
                            width: 0,
                            height: 0,
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderBottom: `6px solid ${value.badgeBg}`,
                        }}
                    />
                    <div
                        style={{
                            backgroundColor: value.badgeBg,
                            color: value.badgeTextColor,
                            padding: "3px 10px",
                            borderRadius: 999,
                            ...typography.percentageFont,
                            fontSize: 12,
                            fontWeight: "700",
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: "-0.02em",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)",
                            whiteSpace: "nowrap",
                            lineHeight: 1.6,
                        }}
                    >
                        {value.prefix}
                        {displayValue}
                        {value.suffix}
                    </div>
                </motion.div>
            )}

            {/* Label below circle */}
            {content.showLabel && !layout.showCenterLabel && (
                <span
                    style={{
                        ...typography.labelFont,
                        color: typography.labelColor,
                        fontSize: typography.labelSize,
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                    }}
                >
                    {content.label}
                </span>
            )}
        </div>
    )
}

ProgressCircleBars.defaultProps = {
    layout: {
        sizePreset: "lg" as const,
        arcStyle: "ring" as const,
        circleSize: 120,
        strokeWidth: 12,
        dashCount: 60,
        showCenterLabel: true,
    },
    content: { label: "Circle", percentage: 75, showLabel: true },
    value: {
        style: "center" as const,
        countUp: true,
        prefix: "",
        suffix: "%",
        badgeBg: "#111111",
        badgeTextColor: "#FFFFFF",
    },
    fill: {
        colorStart: "#7C3AED",
        colorEnd: "#3B82F6",
    },
    thresholds: {
        enabled: false,
        lowMax: 40,
        lowColor: "#EF4444",
        midMax: 70,
        midColor: "#F59E0B",
        highColor: "#10B981",
    },
    track: {
        color: "#F0F0F8",
        borderWidth: 0,
        borderColor: "#E5E7EB",
    },
    typography: {
        labelColor: "#111111",
        labelSize: 11,
        labelFont: { fontFamily: "Inter, sans-serif", fontWeight: 500 },
        percentageColor: "#111111",
        percentageSize: 24,
        percentageFont: { fontFamily: "Inter, sans-serif", fontWeight: 700 },
        spacing: 10,
    },
    animation: {
        scrollReveal: true,
        duration: 1.4,
        delay: 0.1,
        completionPulse: true,
    },
    comparison: {
        enabled: false,
        value: 90,
        color: "#D1D5DB",
        strokeScale: 0.45,
    },
}

addPropertyControls(ProgressCircleBars, {
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            sizePreset: {
                type: ControlType.Enum,
                title: "Size",
                defaultValue: "lg",
                options: ["2xl", "xl", "lg", "md", "sm", "xs", "2xs", "custom"],
                optionTitles: [
                    "2XL (200px)",
                    "XL (160px)",
                    "LG (120px)",
                    "MD (90px)",
                    "SM (64px)",
                    "XS (44px)",
                    "2XS (32px)",
                    "Custom",
                ],
            },
            arcStyle: {
                type: ControlType.Enum,
                title: "Arc Style",
                defaultValue: "ring",
                options: ["ring", "gauge", "dashes"],
                optionTitles: ["Ring (360°)", "Gauge (270°)", "Dashes"],
            },
            circleSize: {
                type: ControlType.Number,
                title: "Circle Size",
                defaultValue: 120,
                min: 40,
                max: 400,
                step: 4,
                unit: "px",
                displayStepper: true,
                hidden(props) {
                    return props.sizePreset !== "custom"
                },
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Stroke Width",
                defaultValue: 12,
                min: 2,
                max: 40,
                step: 1,
                displayStepper: true,
                hidden(props) {
                    return props.sizePreset !== "custom"
                },
            },
            dashCount: {
                type: ControlType.Number,
                title: "Dash Count",
                defaultValue: 60,
                min: 20,
                max: 120,
                step: 4,
                displayStepper: true,
                hidden(props) {
                    return props.arcStyle !== "dashes"
                },
            },
            showCenterLabel: {
                type: ControlType.Boolean,
                title: "Center Label",
                defaultValue: true,
            },
        },
    },

    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Circle",
            },
            percentage: {
                type: ControlType.Number,
                title: "Percentage",
                defaultValue: 75,
                min: 0,
                max: 100,
                step: 1,
                displayStepper: true,
            },
            showLabel: {
                type: ControlType.Boolean,
                title: "Show Label",
                defaultValue: true,
            },
        },
    },

    value: {
        type: ControlType.Object,
        title: "Value Display",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                defaultValue: "center",
                options: ["center", "badge", "none"],
                optionTitles: ["Center", "Badge", "Hidden"],
            },
            countUp: {
                type: ControlType.Boolean,
                title: "Count Up",
                defaultValue: true,
            },
            prefix: {
                type: ControlType.String,
                title: "Prefix",
                defaultValue: "",
            },
            suffix: {
                type: ControlType.String,
                title: "Suffix",
                defaultValue: "%",
            },
            badgeBg: {
                type: ControlType.Color,
                title: "Badge BG",
                defaultValue: "#111111",
                hidden(props) {
                    return props.style !== "badge"
                },
            },
            badgeTextColor: {
                type: ControlType.Color,
                title: "Badge Text",
                defaultValue: "#FFFFFF",
                hidden(props) {
                    return props.style !== "badge"
                },
            },
        },
    },

    fill: {
        type: ControlType.Object,
        title: "Fill",
        controls: {
            colorStart: {
                type: ControlType.Color,
                title: "Color Start",
                defaultValue: "#7C3AED",
            },
            colorEnd: {
                type: ControlType.Color,
                title: "Color End",
                defaultValue: "#3B82F6",
            },
        },
    },

    comparison: {
        type: ControlType.Object,
        title: "Comparison",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: false,
            },
            value: {
                type: ControlType.Number,
                title: "Target %",
                defaultValue: 90,
                min: 0,
                max: 100,
                step: 1,
                displayStepper: true,
                hidden(props) {
                    return !props.enabled
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#D1D5DB",
                hidden(props) {
                    return !props.enabled
                },
            },
            strokeScale: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 0.45,
                min: 0.1,
                max: 1.0,
                step: 0.05,
                displayStepper: true,
                hidden(props) {
                    return !props.enabled
                },
            },
        },
    },

    thresholds: {
        type: ControlType.Object,
        title: "Thresholds",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: false,
            },
            lowMax: {
                type: ControlType.Number,
                title: "Low < (max)",
                defaultValue: 40,
                min: 1,
                max: 99,
                step: 1,
                displayStepper: true,
                hidden(props) {
                    return !props.enabled
                },
            },
            lowColor: {
                type: ControlType.Color,
                title: "Low Color",
                defaultValue: "#EF4444",
                hidden(props) {
                    return !props.enabled
                },
            },
            midMax: {
                type: ControlType.Number,
                title: "Mid < (max)",
                defaultValue: 70,
                min: 1,
                max: 100,
                step: 1,
                displayStepper: true,
                hidden(props) {
                    return !props.enabled
                },
            },
            midColor: {
                type: ControlType.Color,
                title: "Mid Color",
                defaultValue: "#F59E0B",
                hidden(props) {
                    return !props.enabled
                },
            },
            highColor: {
                type: ControlType.Color,
                title: "High Color",
                defaultValue: "#10B981",
                hidden(props) {
                    return !props.enabled
                },
            },
        },
    },

    track: {
        type: ControlType.Object,
        title: "Track",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#F0F0F8",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                defaultValue: 0,
                min: 0,
                max: 8,
                step: 1,
                displayStepper: true,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#E5E7EB",
                hidden(props) {
                    return props.borderWidth === 0
                },
            },
        },
    },

    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            labelColor: {
                type: ControlType.Color,
                title: "Label Color",
                defaultValue: "#111111",
            },
            labelSize: {
                type: ControlType.Number,
                title: "Label Size",
                defaultValue: 11,
                min: 6,
                max: 48,
                step: 1,
                displayStepper: true,
            },
            labelFont: {
                type: ControlType.Font,
                title: "Label Font",
                controls: "extended",
                defaultFontType: "sans-serif",
            },
            percentageColor: {
                type: ControlType.Color,
                title: "% Color",
                defaultValue: "#111111",
            },
            percentageSize: {
                type: ControlType.Number,
                title: "% Size",
                defaultValue: 24,
                min: 8,
                max: 80,
                step: 1,
                displayStepper: true,
            },
            percentageFont: {
                type: ControlType.Font,
                title: "% Font",
                controls: "extended",
                defaultFontType: "sans-serif",
            },
            spacing: {
                type: ControlType.Number,
                title: "Label Gap",
                defaultValue: 10,
                min: 0,
                max: 40,
                step: 1,
                displayStepper: true,
            },
        },
    },

    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            scrollReveal: {
                type: ControlType.Boolean,
                title: "Scroll Reveal",
                defaultValue: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration (s)",
                defaultValue: 1.4,
                min: 0.1,
                max: 5,
                step: 0.1,
                displayStepper: true,
            },
            delay: {
                type: ControlType.Number,
                title: "Delay (s)",
                defaultValue: 0.1,
                min: 0,
                max: 3,
                step: 0.1,
                displayStepper: true,
            },
            completionPulse: {
                type: ControlType.Boolean,
                title: "Pulse at 100%",
                defaultValue: true,
            },
        },
    },
})
