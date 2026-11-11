import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
 * @framerDisableUnlink
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CalendarCountdown(props) {
    const {
        targetDate,
        utcOffset,
        backgroundColor,
        textColor,
        labelColor,
        numberFont,
        labelFont,
    } = props

    const [timeLeft, setTimeLeft] = useState({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
    })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const target = new Date(targetDate)
            target.setUTCHours(target.getUTCHours() + utcOffset)
            const difference = target.getTime() - now.getTime()

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24))
                    .toString()
                    .padStart(2, "0")
                const hours = Math.floor(
                    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                )
                    .toString()
                    .padStart(2, "0")
                const minutes = Math.floor(
                    (difference % (1000 * 60 * 60)) / (1000 * 60)
                )
                    .toString()
                    .padStart(2, "0")
                const seconds = Math.floor((difference % (1000 * 60)) / 1000)
                    .toString()
                    .padStart(2, "0")

                setTimeLeft({ days, hours, minutes, seconds })
            } else {
                setTimeLeft({
                    days: "00",
                    hours: "00",
                    minutes: "00",
                    seconds: "00",
                })
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)

        return () => clearInterval(timer)
    }, [targetDate, utcOffset])

    const FlipUnit = ({ value, prevValue, label }) => {
        const shouldFlip = value !== prevValue

        // Number font styles
        const numberStyle = {
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: numberFont?.fontSize || "3em",
            fontWeight: numberFont?.fontWeight || "bold",
            fontFamily: numberFont?.fontFamily || "Arial, sans-serif",
            letterSpacing: numberFont?.letterSpacing || "normal",
            lineHeight: numberFont?.lineHeight || "1",
            color: textColor,
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }

        // Label font styles
        const labelStyle = {
            marginTop: "10px",
            fontSize: labelFont?.fontSize || "0.8em",
            fontWeight: labelFont?.fontWeight || "normal",
            fontFamily: labelFont?.fontFamily || "Arial, sans-serif",
            letterSpacing: labelFont?.letterSpacing || "normal",
            lineHeight: labelFont?.lineHeight || "1",
            color: labelColor,
            textTransform: "uppercase",
        }

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    margin: "0 10px",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                        backgroundColor: backgroundColor,
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={value}
                            initial={
                                shouldFlip
                                    ? { y: -40, opacity: 0 }
                                    : { y: 0, opacity: 1 }
                            }
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={numberStyle}
                        >
                            {value}
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div style={labelStyle}>{label}</div>
            </div>
        )
    }

    // Separator font styles
    const separatorStyle = {
        fontSize: numberFont?.fontSize || "2em",
        fontFamily: numberFont?.fontFamily || "Arial, sans-serif",
        fontWeight: numberFont?.fontWeight || "bold",
        color: textColor,
        margin: "0 5px",
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: "Arial, sans-serif",
                width: "100%",
                height: "100%",
            }}
        >
            <FlipUnit
                value={timeLeft.days}
                prevValue={timeLeft.days}
                label="Days"
            />
            <div style={separatorStyle}>:</div>
            <FlipUnit
                value={timeLeft.hours}
                prevValue={timeLeft.hours}
                label="Hours"
            />
            <div style={separatorStyle}>:</div>
            <FlipUnit
                value={timeLeft.minutes}
                prevValue={timeLeft.minutes}
                label="Minutes"
            />
            <div style={separatorStyle}>:</div>
            <FlipUnit
                value={timeLeft.seconds}
                prevValue={timeLeft.seconds}
                label="Seconds"
            />
        </div>
    )
}

CalendarCountdown.defaultProps = {
    targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    utcOffset: 0,
    backgroundColor: "#2a2a2a",
    textColor: "#ffffff",
    labelColor: "#ffa500",
    numberFont: {
        fontSize: "3em",
        fontWeight: "bold",
        fontFamily: "Arial, sans-serif",
        letterSpacing: "normal",
        lineHeight: "1",
    },
    labelFont: {
        fontSize: "0.8em",
        fontWeight: "normal",
        fontFamily: "Arial, sans-serif",
        letterSpacing: "normal",
        lineHeight: "1",
    },
}

addPropertyControls(CalendarCountdown, {
    targetDate: {
        type: ControlType.Date,
        title: "Target Date",
    },
    utcOffset: {
        type: ControlType.Number,
        title: "UTC Offset",
        min: -12,
        max: 14,
        step: 1,
        displayStepper: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Number Background",
    },
    textColor: {
        type: ControlType.Color,
        title: "Number Color",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            fontWeight: "bold",
            letterSpacing: "normal",
            lineHeight: "1em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            fontWeight: "normal",
            letterSpacing: "normal",
            lineHeight: "1em",
        },
    },
})

// Hide code editor when component is reused
Object.defineProperty(CalendarCountdown, "__FramerMetadata__", {
    value: {
        type: "variable",
        template: false,
        custom: {
            removeCodeEditor: true,
        },
    },
})
