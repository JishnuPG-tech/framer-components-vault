import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const NumberCounterStyles = {
    display: "flex",
    justifyContent: "left",
    alignItems: "left",
}

export default function BestNumberCounter(props) {
    const {
        startNumber,
        endNumber,
        duration,
        prefix,
        suffix,
        loop,
        decimalSeparator,
        decimalPlaces,
        fontSize,
        font,
        fontColor,
    } = props

    const [count, setCount] = useState(startNumber)
    const [isVisible, setIsVisible] = useState(false)
    const ref = React.useRef(null)

    // Total steps based on duration and frame rate
    const totalSteps = 60 * duration // Assuming 60 updates per second
    const increment = (endNumber - startNumber) / totalSteps // Increment per step

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0]
            setIsVisible(entry.isIntersecting)
        })

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current)
            }
        }
    }, [])

    useEffect(() => {
        if (isVisible && startNumber !== endNumber) {
            const intervalId = setInterval(() => {
                setCount((prevCount) => {
                    const nextValue = prevCount + increment

                    // Check if we've reached or exceeded the end number
                    if (
                        (increment > 0 && nextValue >= endNumber) ||
                        (increment < 0 && nextValue <= endNumber)
                    ) {
                        if (loop) {
                            return startNumber
                        } else {
                            clearInterval(intervalId)
                            return endNumber
                        }
                    }

                    return nextValue
                })
            }, 1000 / 60) // 60 updates per second

            return () => {
                clearInterval(intervalId)
            }
        }
    }, [count, startNumber, endNumber, loop, isVisible, increment])

    const formatCount = (number) => {
        // Round to specified decimal places
        const roundedNumber = Number(number.toFixed(decimalPlaces))

        if (decimalSeparator === "comma") {
            return roundedNumber.toLocaleString("en-US", {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces,
            })
        } else if (decimalSeparator === "period") {
            return roundedNumber
                .toLocaleString("en-US", {
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces,
                })
                .replace(/,/g, ".")
        } else {
            return roundedNumber.toFixed(decimalPlaces)
        }
    }

    return (
        <motion.div
            ref={ref}
            style={{
                ...NumberCounterStyles,
                gap: `${fontSize / 2}px`,
                flexDirection: "row",
                alignItems: "left",
                fontSize: `${fontSize}px`,
                fontFamily: font.fontFamily,
                fontWeight: font.fontWeight,
                color: fontColor,
            }}
        >
            {prefix}
            {formatCount(count)}
            {suffix}
        </motion.div>
    )
}

BestNumberCounter.defaultProps = {
    startNumber: 0,
    endNumber: 4.8,
    duration: 5, // 5 seconds
    prefix: "",
    suffix: "",
    loop: false,
    decimalSeparator: "comma",
    decimalPlaces: 1,
    fontSize: 16,
    font: {
        fontFamily: "Arial",
        fontWeight: 400,
        systemFont: true,
    },
    fontColor: "#707070",
}

addPropertyControls(BestNumberCounter, {
    font: {
        title: "Font",
        type: ControlType.Font,
        defaultValue: {
            fontFamily: "Arial",
            fontWeight: 400,
            systemFont: true,
        },
    },
    fontSize: {
        title: "Font Size",
        type: ControlType.Number,
        min: 8,
        max: 200,
        step: 1,
    },
    fontColor: {
        type: ControlType.Color,
        title: "Font Color",
    },
    startNumber: {
        type: ControlType.Number,
        title: "Start Number",
        defaultValue: 0,
        displayStepper: true,
        step: 0.1,
    },
    endNumber: {
        type: ControlType.Number,
        title: "End Number",
        defaultValue: 4.8,
        displayStepper: true,
        step: 0.1,
    },
    decimalPlaces: {
        type: ControlType.Number,
        title: "Decimal Places",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 1,
        displayStepper: true,
    },
    decimalSeparator: {
        type: ControlType.Enum,
        title: "Decimal Separator",
        defaultValue: "comma",
        options: ["comma", "period", "none"],
        optionTitles: ["Comma (1,000.0)", "Period (1.000,0)", "None"],
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (s)",
        defaultValue: 5,
        min: 0.1,
        max: 60,
        step: 0.1,
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop Animation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
