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
    motion,
    useMotionValue,
    useTransform,
    animate,
    useInView,
} from "framer-motion"
import { useEffect, useRef } from "react"

function formatValue(value: number, decimals: number) {
    return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })
}

export default function StatCounter({
    value,
    startValue,
    step,
    prefix,
    suffix,
    label,
    duration,
    decimals,
    valueColor,
    labelColor,
    valueSize,
    labelSize,
    fontWeight,
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: "-40px" })

    const motionValue = useMotionValue(startValue)

    useEffect(() => {
        if (!inView) return

        motionValue.set(startValue)

        const controls = animate(motionValue, value, {
            duration,
            ease: "easeOut",
        })

        return controls.stop
    }, [inView, value, startValue])

    function applyStep(value: number, step: number) {
        if (!step || step <= 0) return value
        return Math.round(value / step) * step
    }

    const display = useTransform(motionValue, (latest) => {
        const stepped = applyStep(latest, step)
        return `${prefix}${formatValue(stepped, decimals)}${suffix}`
    })

    return (
        <div
            ref={ref}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
        >
            <motion.div
                style={{
                    color: valueColor,
                    fontSize: valueSize,
                    fontWeight,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {display}
            </motion.div>

            <div
                style={{
                    color: labelColor,
                    fontSize: labelSize,
                    opacity: 0.85,
                }}
            >
                {label}
            </div>
        </div>
    )
}

addPropertyControls(StatCounter, {
    value: {
        type: ControlType.Number,
        defaultValue: 40000,
    },
    startValue: {
        type: ControlType.Number,
        defaultValue: 0,
        title: "Start From",
    },
    step: {
        type: ControlType.Number,
        title: "Step",
        defaultValue: 1,
        min: 0.01,
        step: 0.01,
    },
    prefix: {
        type: ControlType.String,
        defaultValue: "",
    },
    suffix: {
        type: ControlType.String,
        defaultValue: "K+",
    },
    label: {
        type: ControlType.String,
        defaultValue: "Campaigns",
    },
    duration: {
        type: ControlType.Number,
        defaultValue: 1.4,
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "s",
    },
    decimals: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 3,
    },
    valueColor: {
        type: ControlType.Color,
        defaultValue: "#e5e5e5",
    },
    labelColor: {
        type: ControlType.Color,
        defaultValue: "#9ca3af",
    },
    valueSize: {
        type: ControlType.Number,
        defaultValue: 56,
        min: 16,
        max: 160,
        unit: "px",
    },
    labelSize: {
        type: ControlType.Number,
        defaultValue: 14,
        min: 10,
        max: 40,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Number,
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
    },
})
