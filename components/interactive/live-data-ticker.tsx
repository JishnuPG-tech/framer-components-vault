// Build a Live Data Ticker component in Framer.
// Variant 1 first: "12,842 people joined today" style social proof ticker with live pulse, animated counting, and configurable update frequency/icon/label.

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
    animate,
    motion,
    useInView,
    type AnimationPlaybackControls,
} from "framer-motion"
import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

type IconType = "people" | "star" | "check"
type UpdateFrequency = "slow" | "medium" | "fast"

type FlashMode = "none" | "flash" | "shake"

type TickerVariant = "users" | "reviews" | "revenue" | "visitors"

interface LiveDataTickerProps {
    variant: TickerVariant
    useVariantDefaults: boolean

    startingNumber: number
    label: string
    iconType: IconType
    updateFrequency: UpdateFrequency
    minIncrement: number
    maxIncrement: number
    countUpDuration: number
    updateAnimationDuration: number
    flashMode: FlashMode

    numberPrefix: string
    numberSuffix: string
    decimalPlaces: number
    compactNotation: boolean

    backgroundColor: string
    borderColor: string
    numberColor: string
    labelColor: string
    iconColor: string
    liveDotColor: string

    numberFont: any
    labelFont: any

    padding: string
    borderRadius: string
    shadow: string

    style?: CSSProperties
}

function clampNumber(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function formatIntegerWithCommas(value: number) {
    if (!Number.isFinite(value)) return "0"
    try {
        return Math.round(value).toLocaleString(undefined)
    } catch {
        return String(Math.round(value))
    }
}

function formatNumber(value: number, options: { decimalPlaces: number; compact: boolean }) {
    if (!Number.isFinite(value)) return "0"
    const decimals = clampNumber(options.decimalPlaces, 0, 6)

    try {
        if (options.compact) {
            return new Intl.NumberFormat(undefined, {
                notation: "compact",
                maximumFractionDigits: decimals,
                minimumFractionDigits: Math.min(0, decimals),
            }).format(value)
        }

        const isInt = decimals === 0
        return new Intl.NumberFormat(undefined, {
            maximumFractionDigits: decimals,
            minimumFractionDigits: isInt ? 0 : decimals,
        }).format(value)
    } catch {
        const rounded = decimals === 0 ? Math.round(value) : Number(value.toFixed(decimals))
        return String(rounded)
    }
}

function getFrequencyRangeMs(freq: UpdateFrequency) {
    switch (freq) {
        case "slow":
            return { min: 3800, max: 5200 }
        case "fast":
            return { min: 1700, max: 2600 }
        case "medium":
        default:
            return { min: 2800, max: 4000 }
    }
}

function randomIntInclusive(min: number, max: number) {
    const a = Math.ceil(min)
    const b = Math.floor(max)
    if (b <= a) return a
    return Math.floor(Math.random() * (b - a + 1)) + a
}

function randomInRange(min: number, max: number) {
    const a = Math.min(min, max)
    const b = Math.max(min, max)
    if (a === b) return a
    return Math.random() * (b - a) + a
}

function getVariantDefaults(variant: TickerVariant) {
    switch (variant) {
        case "reviews":
            return {
                startingNumber: 4.9,
                label: "from 2,300+ reviews",
                iconType: "star" as const,
                updateFrequency: "slow" as const,
                minIncrement: 0.0,
                maxIncrement: 0.1,
                numberPrefix: "",
                numberSuffix: "★",
                decimalPlaces: 1,
                compactNotation: false,
            }
        case "revenue":
            return {
                startingNumber: 1200000,
                label: "earned by creators",
                iconType: "check" as const,
                updateFrequency: "medium" as const,
                minIncrement: 5000,
                maxIncrement: 45000,
                numberPrefix: "$",
                numberSuffix: "",
                decimalPlaces: 1,
                compactNotation: true,
            }
        case "visitors":
            return {
                startingNumber: 143,
                label: "people viewing now",
                iconType: "people" as const,
                updateFrequency: "fast" as const,
                minIncrement: 0,
                maxIncrement: 6,
                numberPrefix: "",
                numberSuffix: "",
                decimalPlaces: 0,
                compactNotation: false,
            }
        case "users":
        default:
            return {
                startingNumber: 12842,
                label: "people joined today",
                iconType: "people" as const,
                updateFrequency: "medium" as const,
                minIncrement: 1,
                maxIncrement: 15,
                numberPrefix: "",
                numberSuffix: "",
                decimalPlaces: 0,
                compactNotation: false,
            }
    }
}

function Icon({ type, color }: { type: IconType; color: string }) {
    const common = {
        width: 18,
        height: 18,
        viewBox: "0 0 24 24",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
    }

    if (type === "star") {
        return (
            <svg {...common} aria-hidden="true">
                <path
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                    fill={color}
                />
            </svg>
        )
    }

    if (type === "check") {
        return (
            <svg {...common} aria-hidden="true">
                <path
                    d="M20 6L9 17l-5-5"
                    stroke={color}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }

    // people
    return (
        <svg {...common} aria-hidden="true">
            <path
                d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5Z"
                fill={color}
            />
        </svg>
    )
}

/**
 * Live Data Ticker
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 64
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LiveDataTicker(props: LiveDataTickerProps) {
    const {
        variant,
        useVariantDefaults,
        startingNumber,
        label,
        iconType,
        updateFrequency,
        minIncrement,
        maxIncrement,
        countUpDuration,
        updateAnimationDuration,
        flashMode,
        numberPrefix,
        numberSuffix,
        decimalPlaces,
        compactNotation,
        backgroundColor,
        borderColor,
        numberColor,
        labelColor,
        iconColor,
        liveDotColor,
        numberFont,
        labelFont,
        padding,
        borderRadius,
        shadow,
        style,
    } = props

    const variantDefaults = useMemo(() => getVariantDefaults(variant), [variant])

    const effectiveStartingNumber = useVariantDefaults ? variantDefaults.startingNumber : startingNumber
    const effectiveLabel = useVariantDefaults ? variantDefaults.label : label
    const effectiveIconType = useVariantDefaults ? variantDefaults.iconType : iconType
    const effectiveUpdateFrequency = useVariantDefaults ? variantDefaults.updateFrequency : updateFrequency
    const effectiveMinIncrement = useVariantDefaults ? variantDefaults.minIncrement : minIncrement
    const effectiveMaxIncrement = useVariantDefaults ? variantDefaults.maxIncrement : maxIncrement

    const effectivePrefix = useVariantDefaults ? variantDefaults.numberPrefix : numberPrefix
    const effectiveSuffix = useVariantDefaults ? variantDefaults.numberSuffix : numberSuffix
    const effectiveDecimals = useVariantDefaults ? variantDefaults.decimalPlaces : decimalPlaces
    const effectiveCompact = useVariantDefaults ? variantDefaults.compactNotation : compactNotation

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(rootRef, { amount: 0.4 })

    const safeMinInc = useMemo(() => clampNumber(effectiveMinIncrement, -1000000, 1000000), [effectiveMinIncrement])
    const safeMaxInc = useMemo(() => clampNumber(effectiveMaxIncrement, -1000000, 1000000), [effectiveMaxIncrement])

    const [displayValue, setDisplayValue] = useState(() => {
        const lower = Math.max(0, Number(effectiveStartingNumber) - 50)
        return lower
    })

    const targetRef = useRef<number>(Number(effectiveStartingNumber))
    const animRef = useRef<AnimationPlaybackControls | null>(null)
    const rafPendingRef = useRef(false)
    const latestValueRef = useRef(displayValue)

    useEffect(() => {
        latestValueRef.current = displayValue
    }, [displayValue])

    const setDisplayValueRaf = useCallback((v: number) => {
        latestValueRef.current = v
        if (rafPendingRef.current) return
        rafPendingRef.current = true
        if (typeof window === "undefined") {
            rafPendingRef.current = false
            startTransition(() => setDisplayValue(v))
            return
        }
        window.requestAnimationFrame(() => {
            rafPendingRef.current = false
            startTransition(() => setDisplayValue(latestValueRef.current))
        })
    }, [])

    const runCountTo = useCallback(
        (nextTarget: number, duration: number) => {
            if (isStatic) {
                setDisplayValueRaf(nextTarget)
                return
            }

            animRef.current?.stop()
            const from = latestValueRef.current
            const to = nextTarget

            animRef.current = animate(from, to, {
                duration: Math.max(0.1, duration),
                ease: [0.22, 1, 0.36, 1],
                onUpdate: (v) => setDisplayValueRaf(v),
            })
        },
        [isStatic, setDisplayValueRaf],
    )

    // Initial count-up (from a lower value)
    useEffect(() => {
        targetRef.current = Number(effectiveStartingNumber)
        const from = Math.max(0, Number(effectiveStartingNumber) - 60)
        startTransition(() => setDisplayValue(from))
        latestValueRef.current = from

        if (isStatic) {
            setDisplayValueRaf(targetRef.current)
            return
        }

        // Only animate when visible
        if (!isInView) return

        runCountTo(targetRef.current, countUpDuration)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveStartingNumber, isStatic, isInView])

    // Periodic updates
    useEffect(() => {
        if (isStatic) return
        if (!isInView) return

        let timeoutId: number | null = null
        let cancelled = false

        const tick = () => {
            if (cancelled) return

            const min = Math.min(safeMinInc, safeMaxInc)
            const max = Math.max(safeMinInc, safeMaxInc)
            const inc = randomInRange(min, max)
            const next = Math.max(0, Number(targetRef.current + inc))
            targetRef.current = next

            runCountTo(next, updateAnimationDuration)

            const { min: tMin, max: tMax } = getFrequencyRangeMs(effectiveUpdateFrequency)
            const wait = randomIntInclusive(tMin, tMax)
            timeoutId = window.setTimeout(tick, wait)
        }

        const { min: tMin, max: tMax } = getFrequencyRangeMs(effectiveUpdateFrequency)
        timeoutId = window.setTimeout(tick, randomIntInclusive(tMin, tMax))

        return () => {
            cancelled = true
            if (timeoutId) window.clearTimeout(timeoutId)
        }
    }, [isStatic, isInView, runCountTo, safeMinInc, safeMaxInc, updateAnimationDuration, effectiveUpdateFrequency])

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            animRef.current?.stop()
        }
    }, [])

    const formatted = useMemo(() => {
        const core = formatNumber(displayValue, { decimalPlaces: effectiveDecimals, compact: effectiveCompact })
        return `${effectivePrefix}${core}${effectiveSuffix}`
    }, [displayValue, effectiveDecimals, effectiveCompact, effectivePrefix, effectiveSuffix])

    const flashKey = useMemo(() => {
        // Any visible change triggers a micro animation.
        return `${variant}-${formatted}`
    }, [formatted, variant])

    const flashAnimation = useMemo(() => {
        if (isStatic || flashMode === "none") return undefined
        if (flashMode === "shake") {
            return {
                x: [0, -2, 2, -1, 1, 0],
            }
        }
        // flash
        return {
            scale: [1, 1.02, 1],
        }
    }, [flashMode, isStatic])

    const flashTransition = useMemo(() => {
        if (isStatic || flashMode === "none") return undefined
        return { duration: 0.35, ease: "easeOut" as const }
    }, [flashMode, isStatic])

    const ariaLabel = useMemo(() => {
        const core = formatNumber(displayValue, { decimalPlaces: effectiveDecimals, compact: effectiveCompact })
        return `${effectivePrefix}${core}${effectiveSuffix} ${effectiveLabel}`
    }, [displayValue, effectiveDecimals, effectiveCompact, effectiveLabel, effectivePrefix, effectiveSuffix])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding,
                borderRadius,
                background: backgroundColor,
                boxShadow: shadow,
                border: `1px solid ${borderColor}`,
                overflow: "hidden",
                ...style,
            }}
            role="group"
            aria-label={ariaLabel}
        >
            <div
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                }}
                aria-hidden="true"
            >
                <Icon type={effectiveIconType} color={iconColor} />
            </div>

            <motion.div
                key={flashKey}
                animate={flashAnimation}
                transition={flashTransition}
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    flex: "0 0 auto",
                    minWidth: "max-content",
                }}
            >
                <span
                    style={{
                        ...numberFont,
                        color: numberColor,
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: numberFont?.letterSpacing ?? "-0.03em",
                        lineHeight: numberFont?.lineHeight ?? "1em",
                        whiteSpace: "nowrap",
                    }}
                    aria-hidden="true"
                >
                    {formatted}
                </span>
            </motion.div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flex: "1 1 auto",
                    minWidth: 0,
                    gap: 10,
                }}
            >
                <span
                    style={{
                        ...labelFont,
                        color: labelColor,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        minWidth: 0,
                    }}
                >
                    {effectiveLabel}
                </span>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: "0 0 auto",
                    }}
                    aria-hidden="true"
                >
                    <motion.div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: liveDotColor,
                            boxShadow: `0 0 0 0 ${liveDotColor}55`,
                        }}
                        animate={
                            isStatic
                                ? undefined
                                : {
                                      scale: [1, 1.35, 1],
                                      opacity: [0.6, 1, 0.6],
                                  }
                        }
                        transition={
                            isStatic
                                ? undefined
                                : {
                                      duration: 1.3,
                                      ease: "easeInOut",
                                      repeat: Infinity,
                                  }
                        }
                    />
                    <span
                        style={{
                            ...labelFont,
                            color: labelColor,
                            opacity: 0.75,
                            fontSize: typeof labelFont?.fontSize === "number" ? labelFont.fontSize * 0.9 : labelFont?.fontSize,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Live
                    </span>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(LiveDataTicker, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["users", "reviews", "revenue", "visitors"],
        optionTitles: ["Users Joined", "Reviews", "Revenue", "Live Visitors"],
        defaultValue: "users",
    },
    useVariantDefaults: {
        type: ControlType.Boolean,
        title: "Defaults",
        defaultValue: true,
        enabledTitle: "Variant",
        disabledTitle: "Custom",
    },
    startingNumber: {
        type: ControlType.Number,
        title: "Starting",
        defaultValue: 12842,
        min: 0,
        max: 1000000000,
        step: 0.1,
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "people joined today",
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["people", "star", "check"],
        optionTitles: ["People", "Star", "Check"],
        defaultValue: "people",
        displaySegmentedControl: true,
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },
    updateFrequency: {
        type: ControlType.Enum,
        title: "Updates",
        options: ["slow", "medium", "fast"],
        optionTitles: ["Slow", "Medium", "Fast"],
        defaultValue: "medium",
        displaySegmentedControl: true,
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },
    minIncrement: {
        type: ControlType.Number,
        title: "Min +",
        defaultValue: 1,
        min: -1000,
        max: 1000,
        step: 0.1,
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },
    maxIncrement: {
        type: ControlType.Number,
        title: "Max +",
        defaultValue: 15,
        min: -1000,
        max: 1000,
        step: 0.1,
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },

    numberPrefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },
    numberSuffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },
    decimalPlaces: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 6,
        step: 1,
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },
    compactNotation: {
        type: ControlType.Boolean,
        title: "Compact",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ useVariantDefaults }) => useVariantDefaults,
    },

    countUpDuration: {
        type: ControlType.Number,
        title: "Load anim",
        defaultValue: 1.1,
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    updateAnimationDuration: {
        type: ControlType.Number,
        title: "Update anim",
        defaultValue: 0.7,
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    flashMode: {
        type: ControlType.Enum,
        title: "On update",
        options: ["none", "flash", "shake"],
        optionTitles: ["None", "Flash", "Shake"],
        defaultValue: "flash",
        displaySegmentedControl: true,
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number",
        defaultValue: "#000000",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label",
        defaultValue: "#000000",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "#000000",
    },
    liveDotColor: {
        type: ControlType.Color,
        title: "Live Dot",
        defaultValue: "#22CC66",
    },

    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "26px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },

    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "14px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "12px",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 8px 24px rgba(0,0,0,0.08)",
    },
})
