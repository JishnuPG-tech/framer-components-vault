// Animated circular progress bar with number in center, configurable number and percent
import { useEffect, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

interface CircularProgressBarProps {
    number: number
    percent: number
    strokeWidth: number
    barColor: string
    trackColor: string
    numberColor: string
    font: any
    animate: boolean
    duration: number
    startAngle: number
    direction: "clockwise" | "counterclockwise"
    label: string
    labelFont: any
    labelColor: string
    style?: React.CSSProperties
}

/**
 * Animated Circular Progress Bar with Number
 *
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 120
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CircularProgressBar(props: CircularProgressBarProps) {
    const {
        number = 75,
        percent = 80,

        strokeWidth = 10,
        barColor = "#0066FF",
        trackColor = "#F3F4F5",
        numberColor = "#131517",
        font,
        animate = true,
        duration = 1.2,
        style,
    } = props

    const size = 100
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const isStatic = useIsStaticRenderer()
    const [progress, setProgress] = useState(animate && !isStatic ? 0 : percent)
    const requestRef = useRef<number>()
    const startTime = useRef<number>()
    const containerRef = useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { once: true, margin: "-20%" })

    // Calculate SVG rotation for start angle and direction
    const rotation = (props.startAngle || 0) - 90
    const directionSign = props.direction === "counterclockwise" ? -1 : 1
    const dashOffset = directionSign * circumference * (1 - progress / 100)

    useEffect(() => {
        if (!animate || isStatic) {
            startTransition(() => setProgress(percent))
            return
        }
        if (!inView) return
        cancelAnimationFrame(requestRef.current)
        startTime.current = undefined
        function animateStep(ts: number) {
            if (!startTime.current) startTime.current = ts
            const elapsed = (ts - startTime.current) / 1000
            const t = Math.min(elapsed / duration, 1)
            const val = percent * t
            startTransition(() => setProgress(val))
            if (t < 1) {
                requestRef.current = requestAnimationFrame(animateStep)
            } else {
                startTransition(() => setProgress(percent))
            }
        }
        requestRef.current = requestAnimationFrame(animateStep)
        return () => cancelAnimationFrame(requestRef.current)
    }, [percent, animate, duration, isStatic, inView])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                ...style,
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transform: `rotate(${rotation}deg)`,
                }}
                preserveAspectRatio="xMidYMid meet"
            >
                <circle
                    cx={50}
                    cy={50}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={50}
                    cy={50}
                    r={radius}
                    stroke={barColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{
                        transition:
                            animate && !isStatic
                                ? undefined
                                : "stroke-dashoffset 0.4s",
                    }}
                />
            </svg>
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        color: numberColor,
                        display: "inline-block",
                        width: "100%",
                        textAlign: "center",
                        ...font,
                    }}
                >
                    {number}
                </span>
                {props.label && (
                    <span
                        style={{
                            color: props.labelColor,
                            marginTop: 4,
                            width: "100%",
                            textAlign: "center",
                            ...props.labelFont,
                        }}
                    >
                        {props.label}
                    </span>
                )}
            </div>
        </div>
    )
}

addPropertyControls(CircularProgressBar, {
    number: {
        type: ControlType.Number,
        title: "Number",
        defaultValue: 75,
        min: 0,
        max: 10000,
        step: 1,
    },
    percent: {
        type: ControlType.Number,
        title: "Percent",
        defaultValue: 80,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },

    strokeWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 10,
        min: 2,
        max: 40,
        step: 1,
        unit: "px",
    },
    barColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#0066FF",
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track Color",
        defaultValue: "#F3F4F5",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#131517",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.2,
        min: 0.2,
        max: 5,
        step: 0.1,
        unit: "s",
        hidden: ({ animate }) => !animate,
    },
    startAngle: {
        type: ControlType.Number,
        title: "Start Angle",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counterclockwise"],
        defaultValue: "clockwise",
        displaySegmentedControl: true,
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "Label text...",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        hidden: ({ label }) => !label,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#7B818E",
        hidden: ({ label }) => !label,
    },
})
