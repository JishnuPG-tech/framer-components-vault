// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef } from "react"

interface FontStyle {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    fontStyle?: string
    lineHeight?: number | string
    letterSpacing?: number | string
    textAlign?: string
}

interface TimeBoxProps {
    targetDate: string
    boxBackground: string
    boxBorderColor: string
    numberColor: string
    labelColor: string
    numberFont: FontStyle
    labelFont: FontStyle
    cornerRadius: number
    gap: number
    daysLabel: string
    hoursLabel: string
    minsLabel: string
    secsLabel: string
    style?: React.CSSProperties
}

interface TimeLeft {
    days: number
    hours: number
    mins: number
    secs: number
}

function calculateTimeLeft(targetDate: string): TimeLeft {
    const difference = new Date(targetDate).getTime() - Date.now()

    if (isNaN(new Date(targetDate).getTime()) || difference <= 0) {
        return { days: 0, hours: 0, mins: 0, secs: 0 }
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        mins: Math.floor((difference / (1000 * 60)) % 60),
        secs: Math.floor((difference / 1000) % 60),
    }
}

function pad(value: number): string {
    return value.toString().padStart(2, "0")
}

/**
 * Countdown Timer
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TimeBox(props: TimeBoxProps) {
    const {
        targetDate,
        boxBackground,
        boxBorderColor,
        numberColor,
        labelColor,
        numberFont,
        labelFont,
        cornerRadius,
        gap,
        daysLabel,
        hoursLabel,
        minsLabel,
        secsLabel,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const intervalRef = useRef<number | null>(null)

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
        isStatic
            ? { days: 34, hours: 15, mins: 18, secs: 41 }
            : calculateTimeLeft(targetDate)
    )

    useEffect(() => {
        if (isStatic) return

        intervalRef.current = window.setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate))
        }, 1000)

        return () => {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current)
            }
        }
    }, [targetDate, isStatic])

    const units = [
        { value: timeLeft.days, label: daysLabel },
        { value: timeLeft.hours, label: hoursLabel },
        { value: timeLeft.mins, label: minsLabel },
        { value: timeLeft.secs, label: secsLabel },
    ]

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "center",
                gap: `${gap}px`,
                width: style?.width ?? "max-content",
                height: style?.height ?? "max-content",
            }}
        >
            {units.map((unit, index) => (
                <div
                    key={index}
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "22px 24px",
                        minWidth: "88px",
                        backgroundColor: boxBackground,
                        border: `1px solid ${boxBorderColor}`,
                        borderRadius: `${cornerRadius}px`,
                        boxSizing: "border-box",
                    }}
                >
                    <span
                        style={{
                            ...numberFont,
                            color: numberColor,
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {pad(unit.value)}
                    </span>
                    <span
                        style={{
                            ...labelFont,
                            textTransform: "uppercase",
                            color: labelColor,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {unit.label}
                    </span>
                </div>
            ))}
        </div>
    )
}

TimeBox.displayName = "Countdown Timer"

addPropertyControls(TimeBox, {
    targetDate: {
        type: ControlType.Date,
        title: "Target Date",
        displayTime: true,
        defaultValue: "2026-12-31T23:59:59",
        description: "Pick the exact date and time the countdown ends at.",
    },
    daysLabel: {
        type: ControlType.String,
        title: "Days Label",
        defaultValue: "DAYS",
    },
    hoursLabel: {
        type: ControlType.String,
        title: "Hours Label",
        defaultValue: "HOURS",
    },
    minsLabel: {
        type: ControlType.String,
        title: "Mins Label",
        defaultValue: "MINS",
    },
    secsLabel: {
        type: ControlType.String,
        title: "Secs Label",
        defaultValue: "SECS",
    },
    boxBackground: {
        type: ControlType.Color,
        title: "Box Background",
        defaultValue: "rgba(255, 255, 255, 0.03)",
    },
    boxBorderColor: {
        type: ControlType.Color,
        title: "Box Border",
        defaultValue: "rgba(255, 255, 255, 0.08)",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#FFFFFF",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "rgba(255, 255, 255, 0.45)",
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 30,
            variant: "Bold",
            lineHeight: "1.1em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 10,
            variant: "Regular",
            lineHeight: "1.2em",
            letterSpacing: "0.08em",
        },
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
    },
})
