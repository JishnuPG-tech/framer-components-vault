import * as React from "react"
import { useState, useEffect, useRef } from "react"
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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 80
 */
function AnimatedCounter(props: any) {
    const {
        target,
        start,
        duration,
        prefix,
        suffix,
        separator,
        trigger,
        easing,
        color,
        fontSize,
    } = props

    const [currentValue, setCurrentValue] = useState(start)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })
    const motionValue = useMotionValue(start)

    useEffect(() => {
        let shouldAnimate = false
        if (trigger === "On Load") {
            shouldAnimate = true
        } else if (trigger === "On Scroll" && isInView) {
            shouldAnimate = true
        }

        if (shouldAnimate) {
            const controls = animate(motionValue, target, {
                duration: duration,
                ease: easing,
                onUpdate: (latest) => {
                    setCurrentValue(latest)
                },
            })
            return () => controls.stop()
        }
    }, [trigger, isInView, start, target, duration, easing, motionValue])

    let displayValue = Math.round(currentValue)
    let displayString = displayValue.toString()

    if (separator) {
        displayString = displayValue.toLocaleString("en-US")
    }

    return (
        <div
            ref={ref}
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                color: color,
                fontSize: `${fontSize}px`,
                fontFamily: "monospace",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            {prefix}
            {displayString}
            {suffix}
        </div>
    )
}

AnimatedCounter.defaultProps = {
    target: 10000,
    start: 0,
    duration: 2,
    prefix: "",
    suffix: "+",
    separator: true,
    trigger: "On Scroll",
    easing: "easeOut",
    color: "#e8e8f0",
    fontSize: 48,
}

addPropertyControls(AnimatedCounter, {
    target: {
        type: ControlType.Number,
        title: "Target",
        defaultValue: 10000,
    },
    start: {
        type: ControlType.Number,
        title: "Start",
        defaultValue: 0,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        displayStepper: true,
        step: 0.1,
        min: 0,
        unit: "s",
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        placeholder: "$",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "+",
    },
    separator: {
        type: ControlType.Boolean,
        title: "Separator",
        defaultValue: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["On Scroll", "On Load"],
        defaultValue: "On Scroll",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "easeOut", "easeInOut"],
        defaultValue: "easeOut",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#e8e8f0",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 48,
        unit: "px",
    },
})

//@framerDisableUnlink
export default AnimatedCounter
