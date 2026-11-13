// Number count up component with CMS integration
import { useEffect, useState, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CountUpProps {
    targetValue: number
    duration: number
    prefix: string
    suffix: string
    decimals: number
    separator: boolean
    textColor: string
    font: CSSProperties
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CountUp(props: CountUpProps) {
    const {
        targetValue = 1000,
        duration = 2000,
        prefix = "",
        suffix = "",
        decimals = 0,
        separator = true,
        textColor = "#000000",
        font,
        style,
    } = props

    const [count, setCount] = useState(0)
    const [isInView, setIsInView] = useState(false)
    const [hasAnimated, setHasAnimated] = useState(false)
    const elementRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (typeof window === "undefined") return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    startTransition(() => setIsInView(true))
                }
            },
            { threshold: 0.1 }
        )

        if (elementRef.current) {
            observer.observe(elementRef.current)
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current)
            }
        }
    }, [hasAnimated])

    useEffect(() => {
        if (!isInView || hasAnimated) return

        const startTime = Date.now()
        const startValue = 0

        const animate = () => {
            const currentTime = Date.now()
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const currentCount = startValue + (targetValue - startValue) * easeOutQuart

            startTransition(() => setCount(currentCount))

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                startTransition(() => {
                    setCount(targetValue)
                    setHasAnimated(true)
                })
            }
        }

        requestAnimationFrame(animate)
    }, [isInView, targetValue, duration, hasAnimated])

    const formatNumber = (num: number): string => {
        const fixed = num.toFixed(decimals)
        if (!separator) return fixed

        const parts = fixed.split(".")
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        return parts.join(".")
    }

    const displayValue = formatNumber(count)

    return (
        <div
            ref={elementRef}
            style={{
                ...style,
                position: "relative",
                width: "max-content",
                minWidth: "max-content",
            }}
        >
            <span
                style={{
                    color: textColor,
                    ...font,
                    whiteSpace: "nowrap",
                }}
            >
                {prefix}
                {displayValue}
                {suffix}
            </span>
        </div>
    )
}

addPropertyControls(CountUp, {
    targetValue: {
        type: ControlType.Number,
        title: "Target Value",
        defaultValue: 1000,
        min: 0,
        step: 1,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2000,
        min: 100,
        max: 10000,
        step: 100,
        unit: "ms",
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 4,
        step: 1,
    },
    separator: {
        type: ControlType.Boolean,
        title: "Separator",
        defaultValue: true,
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
        placeholder: "+",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
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
})