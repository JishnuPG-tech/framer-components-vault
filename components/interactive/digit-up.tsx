// Number counter component that animates from start to end value when in view
// Supports prefix/suffix, font customization, decimals, easing, duration and delay
// Animation triggers once when component enters viewport

import { useEffect, useRef, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, animate } from "framer-motion"

interface AnimatedCounterProps {
    startValue: number
    endValue: number
    duration: number
    delay: number
    decimals: number
    prefix: string
    suffix: string
    easing: "linear" | "easeIn" | "easeOut" | "easeInOut"
    font: any
    color: string
    style?: React.CSSProperties
}

const easingFunctions = {
    linear: [0, 0, 1, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function AnimatedCounter(props: AnimatedCounterProps) {
    const {
        startValue,
        endValue,
        duration,
        delay,
        decimals,
        prefix,
        suffix,
        easing,
        font,
        color,
        style,
    } = props

    const [displayValue, setDisplayValue] = useState(startValue)
    const [hasAnimated, setHasAnimated] = useState(false)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    const inferredDecimals = useMemo(() => {
        const getDecimals = (value: number) => {
            const asString = value.toString()
            const dotIndex = asString.indexOf(".")
            if (dotIndex === -1) return 0
            return asString.length - dotIndex - 1
        }

        return Math.max(getDecimals(startValue), getDecimals(endValue))
    }, [startValue, endValue])

    useEffect(() => {
        if (isInView && !hasAnimated) {
            let controls: any
            const timer = setTimeout(() => {
                controls = animate(startValue, endValue, {
                    duration: duration,
                    ease: easingFunctions[easing],
                    onUpdate: (value) => {
                        startTransition(() => {
                            setDisplayValue(value)
                        })
                    },
                    onComplete: () => {
                        startTransition(() => {
                            setHasAnimated(true)
                        })
                    },
                })
            }, delay * 1000)

            return () => {
                clearTimeout(timer)
                if (controls) {
                    controls.stop()
                }
            }
        }
    }, [isInView, hasAnimated, startValue, endValue, duration, delay, easing])

    useEffect(() => {
        startTransition(() => {
            setHasAnimated(false)
            setDisplayValue(startValue)
        })
    }, [startValue, endValue, duration, delay, easing, decimals])

    const formattedValue = displayValue.toFixed(decimals > 0 ? decimals : inferredDecimals)

    return (
        <div
            ref={ref}
            style={{
                ...style,
                position: "relative",
                width: "max-content",
                minWidth: "max-content",
                color: color,
                ...font,
            }}
        >
            {prefix}
            {formattedValue}
            {suffix}
        </div>
    )
}

addPropertyControls(AnimatedCounter, {
    startValue: {
        type: ControlType.Number,
        title: "Start Value",
        defaultValue: 0,
        step: 0.1,
    },
    endValue: {
        type: ControlType.Number,
        title: "End Value",
        defaultValue: 100,
        step: 0.1,
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
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
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
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out"],
        defaultValue: "easeOut",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
})