import {
    motion,
    useInView,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion"
import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type AnimatedNumberProps = {
    start: number
    end: number
    decimals?: number
    font?: any
    color?: string
}

const formatNumber = (value: number, decimals: number) => {
    const n = Number(value)
    const fixed = n.toFixed(decimals)

    return n >= 1000 ? Number(fixed).toLocaleString() : fixed
}

function AnimatedNumberMotion({
    start = 0,
    end = 100,
    decimals = 0,
    font,
    color = "#000",
}: AnimatedNumberProps) {
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true, amount: 0.5 })

    const value = useMotionValue(start)
    const spring = useSpring(value, { damping: 30, stiffness: 100 })

    const display = useTransform<number, string>(spring, (num: number) => {
        return formatNumber(num, decimals)
    })

    useEffect(() => {
        value.set(isInView ? end : start)
    }, [start, end, isInView, value])

    return (
        <motion.span
            ref={ref}
            style={{
                color,
                display: "inline-block",
                ...(font as CSSProperties),
            }}
        >
            {display}
        </motion.span>
    )
}

/**
 * @framerDisableUnlink
 */

export default function AnimatedNumber({
    start = 0,
    end = 100,
    decimals = 0,
    font,
    color = "#000",
}: AnimatedNumberProps) {
    const isStaticRenderer = useIsStaticRenderer()

    if (isStaticRenderer) {
        return (
            <span
                style={{
                    color,
                    display: "inline-block",
                    ...(font as CSSProperties),
                }}
            >
                {formatNumber(end, decimals)}
            </span>
        )
    }

    return (
        <AnimatedNumberMotion
            start={start}
            end={end}
            decimals={decimals}
            font={font}
            color={color}
        />
    )
}

AnimatedNumber.displayName = "AnimatedNumber"

addPropertyControls(AnimatedNumber, {
    start: {
        type: ControlType.Number,
        title: "Start",
        defaultValue: 0,
        min: 0,
        max: 100000,
        step: 1,
    },
    end: {
        type: ControlType.Number,
        title: "End",
        defaultValue: 100,
        min: 0,
        max: 100000,
        step: 1,
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        title: "Styles",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000",
        description: "More components at [Stylokit](https://stylokit.com/).",
    },
})
