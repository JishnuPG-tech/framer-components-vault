// CalendarDisplay component that displays current day with red dot indicator and updates automatically
import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CalendarDisplayProps {
    backgroundColor: string
    dayColor: string
    numberColor: string
    dotColor: string
    cornerRadius: number
    dayFont: any
    numberFont: any
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CalendarDisplay(props: CalendarDisplayProps) {
    const {
        backgroundColor,
        dayColor,
        numberColor,
        dotColor,
        cornerRadius,
        dayFont,
        numberFont,
    } = props

    const [currentDate, setCurrentDate] = useState(new Date())

    useEffect(() => {
        const updateDate = () => {
            startTransition(() => {
                setCurrentDate(new Date())
            })
        }

        // Update immediately
        updateDate()

        // Update every minute to catch day changes
        const interval = setInterval(updateDate, 60000)

        return () => clearInterval(interval)
    }, [])

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayName = dayNames[currentDate.getDay()]
    const dayNumber = currentDate.getDate()

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                borderRadius: cornerRadius,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                padding: "16px",
                boxSizing: "border-box",
            }}
        >
            {/* Red dot indicator */}
            <div
                style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: dotColor,
                    borderRadius: "50%",
                }}
            />

            {/* Day name */}
            <div
                style={{
                    color: dayColor,
                    textAlign: "center",
                    marginBottom: "4px",
                    ...dayFont,
                }}
            >
                {dayName}
            </div>

            {/* Day number */}
            <div
                style={{
                    color: numberColor,
                    textAlign: "center",
                    fontWeight: "bold",
                    ...numberFont,
                }}
            >
                {dayNumber}
            </div>
        </div>
    )
}

addPropertyControls(CalendarDisplay, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    dayColor: {
        type: ControlType.Color,
        title: "Day Color",
        defaultValue: "#FF0000",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#000000",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FF0000",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        unit: "px",
    },
    dayFont: {
        type: ControlType.Font,
        title: "Day Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})