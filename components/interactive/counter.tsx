// Number Counter component that animates from start to end value with customizable options
import {
    useState,
    useEffect,
    useRef,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, useAnimation, motion } from "framer-motion"

interface CounterProps {
    startValue: number
    endValue: number
    duration: number
    delay: number
    decimals: number
    easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce"
    font: any
    textAlign: "left" | "center" | "right"
    color: string
    autoStart: boolean
    loop: boolean
    resetOnReEntry: boolean
    prefix: string
    suffix: string
    separator: string
    style?: CSSProperties
}

const easingMap = {
    linear: [0, 0, 1, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Counter(props: CounterProps) {
    const {
        startValue = 0,
        endValue = 100,
        duration = 2,
        delay = 0,
        decimals = 0,
        easing = "easeOut",
        font,
        textAlign = "left",
        color = "#000000",
        autoStart = true,
        loop = false,
        resetOnReEntry = false,
        prefix = "",
        suffix = "",
        separator = ",",
    } = props

    const [currentValue, setCurrentValue] = useState(startValue)
    const [hasStarted, setHasStarted] = useState(false)
    const animationRef = useRef<number>()
    const startTimeRef = useRef<number>()
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const isInView = useInView(containerRef, {
        once: !resetOnReEntry,
        margin: "0px 0px -10% 0px",
    })

    const formatNumber = useMemo(() => {
        return (value: number) => {
            const fixed = value.toFixed(decimals)
            if (separator && Math.abs(value) >= 1000) {
                const parts = fixed.split(".")
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
                return parts.join(".")
            }
            return fixed
        }
    }, [decimals, separator])

    const easeValue = useMemo(() => {
        return (t: number) => {
            const [x1, y1, x2, y2] = easingMap[easing]

            if (easing === "linear") return t
            if (easing === "bounce") {
                if (t < 1 / 2.75) {
                    return 7.5625 * t * t
                } else if (t < 2 / 2.75) {
                    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
                } else if (t < 2.5 / 2.75) {
                    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
                } else {
                    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
                }
            }

            // Cubic bezier approximation
            return (
                3 * (1 - t) * (1 - t) * t * y1 +
                3 * (1 - t) * t * t * y2 +
                t * t * t
            )
        }
    }, [easing])

    const animate = useMemo(() => {
        return (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp + delay * 1000
            }

            const elapsed = timestamp - startTimeRef.current
            const progress = Math.min(elapsed / (duration * 1000), 1)

            if (progress >= 0) {
                const easedProgress = easeValue(progress)
                const newValue =
                    startValue + (endValue - startValue) * easedProgress

                startTransition(() => {
                    setCurrentValue(newValue)
                })

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate)
                } else if (loop) {
                    // Reset for loop
                    startTimeRef.current = undefined
                    startTransition(() => {
                        setCurrentValue(startValue)
                    })
                    setTimeout(() => {
                        animationRef.current = requestAnimationFrame(animate)
                    }, 100)
                }
            } else {
                animationRef.current = requestAnimationFrame(animate)
            }
        }
    }, [startValue, endValue, duration, delay, easing, loop, easeValue])

    const startAnimation = useMemo(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            startTimeRef.current = undefined
            startTransition(() => {
                setCurrentValue(startValue)
                setHasStarted(true)
            })
            animationRef.current = requestAnimationFrame(animate)
        }
    }, [animate, startValue])

    // Handle auto-start and in-view animation
    useEffect(() => {
        if (isStatic) {
            setCurrentValue(endValue)
            return
        }

        if (autoStart && isInView && (!hasStarted || resetOnReEntry)) {
            startAnimation()
        } else if (!autoStart && isInView && (!hasStarted || resetOnReEntry)) {
            startAnimation()
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [
        autoStart,
        isInView,
        hasStarted,
        resetOnReEntry,
        startAnimation,
        isStatic,
        endValue,
    ])

    // Reset when not in view and resetOnReEntry is true
    useEffect(() => {
        if (!isInView && resetOnReEntry && hasStarted) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            startTransition(() => {
                setCurrentValue(startValue)
                setHasStarted(false)
            })
            startTimeRef.current = undefined
        }
    }, [isInView, resetOnReEntry, hasStarted, startValue])

    const displayValue = formatNumber(currentValue)
    const fullText = `${prefix}${displayValue}${suffix}`

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "max-content",
                minWidth: "max-content",
                ...props.style,
            }}
        >
            <span
                style={{
                    display: "block",
                    textAlign,
                    color,
                    width: "max-content",
                    ...font,
                }}
            >
                {fullText}
            </span>
        </div>
    )
}

addPropertyControls(Counter, {
    startValue: {
        type: ControlType.Number,
        title: "Start Value",
        defaultValue: 0,
        step: 1,
    },
    endValue: {
        type: ControlType.Number,
        title: "End Value",
        defaultValue: 100,
        step: 1,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "bounce"],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Bounce",
        ],
        defaultValue: "easeOut",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    autoStart: {
        type: ControlType.Boolean,
        title: "Auto Start",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    resetOnReEntry: {
        type: ControlType.Boolean,
        title: "Reset on Re-entry",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "$",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        placeholder: "%",
    },
    separator: {
        type: ControlType.String,
        title: "Thousands Separator",
        defaultValue: ",",
        placeholder: ",",
    },
})
