// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useState, useEffect, startTransition, useMemo, useRef } from "react"

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 480
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function WorldClock(props) {
    const { useAutoTimezone, selectedTimezone, primaryColor, darkMode, style } =
        props

    const [time, setTime] = useState(new Date())
    const [scale, setScale] = useState(1)
    const containerRef = useRef(null)

    useEffect(() => {
        const interval = setInterval(() => {
            startTransition(() => {
                setTime(new Date())
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    // Calculate scale based on container size
    useEffect(() => {
        if (typeof window === "undefined") return
        
        const updateScale = () => {
            if (containerRef.current) {
                const container = containerRef.current
                const containerWidth = container.offsetWidth
                const containerHeight = container.offsetHeight
                
                // Base dimensions (original design size)
                const baseWidth = 1200
                const baseHeight = 480
                
                // Calculate scale to fit container while maintaining aspect ratio
                const scaleX = containerWidth / baseWidth
                const scaleY = containerHeight / baseHeight
                const newScale = Math.min(scaleX, scaleY)
                
                startTransition(() => {
                    setScale(newScale)
                })
            }
        }
        
        updateScale()
        
        const resizeObserver = new ResizeObserver(updateScale)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }
        
        return () => resizeObserver.disconnect()
    }, [])

    // Get current time values based on timezone settings
    let hours, minutes, seconds

    if (useAutoTimezone) {
        hours = time.getHours()
        minutes = time.getMinutes()
        seconds = time.getSeconds()
    } else {
        // Get timezone-adjusted values directly
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: selectedTimezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })
        
        const parts = formatter.formatToParts(time)
        const getValue = (type) => parts.find(part => part.type === type)?.value
        
        hours = parseInt(getValue('hour'))
        minutes = parseInt(getValue('minute'))
        seconds = parseInt(getValue('second'))
    }

    // Calculate angles for clock hands
    const { secondAngle, minuteAngle, hourAngle } = useMemo(() => {
        return {
            secondAngle: (seconds / 60) * 360,
            minuteAngle: (minutes / 60) * 360 + (seconds / 60) * 6,
            hourAngle: ((hours % 12) / 12) * 360 + (minutes / 60) * 30
        }
    }, [hours, minutes, seconds])

    // Format digital time (24-hour format with leading zeros)
    const formatDigitalTime = () => {
        const h = String(hours).padStart(2, "0")
        const m = String(minutes).padStart(2, "0")
        return { hours: h, minutes: m }
    }

    const digitalTime = formatDigitalTime()

    // Format date
    const formatDate = () => {
        const day = String(time.getDate()).padStart(2, "0")
        const monthNames = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
        ]
        const month = monthNames[time.getMonth()]
        const year = time.getFullYear()
        return `${day} ${month} ${year}`
    }

    // Format day of week
    const formatDay = () => {
        const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
        return days[time.getDay()]
    }

    // Theme colors
    const backgroundColor = darkMode ? "#000000" : "#FFFFFF"
    const clockFaceColor = darkMode ? "#E5E5E5" : "#2A2A2A"
    const textColor = darkMode ? "#E8E8E8" : "#2A2A2A"
    const handColor = darkMode ? "#2A2A2A" : "#E0E0E0"

    // NDOT 45 style patterns (5x7 dot grid)
    const charPatterns = {
        "0": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "1": [
            [0, 0, 1, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
        ],
        "2": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 1, 1, 0],
            [0, 1, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
        ],
        "3": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "4": [
            [0, 0, 0, 1, 0],
            [0, 0, 1, 1, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 1, 0],
            [1, 1, 1, 1, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
        ],
        "5": [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "6": [
            [0, 0, 1, 1, 0],
            [0, 1, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "7": [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
        ],
        "8": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "9": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 1, 1, 0, 0],
        ],
        A: [
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        B: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
        ],
        C: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        D: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
        ],
        E: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
        ],
        F: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
        ],
        G: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 1],
        ],
        H: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        I: [
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
        ],
        J: [
            [0, 0, 1, 1, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [1, 0, 0, 1, 0],
            [1, 0, 0, 1, 0],
            [0, 1, 1, 0, 0],
        ],
        K: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 1, 0],
            [1, 0, 1, 0, 0],
            [1, 1, 0, 0, 0],
            [1, 0, 1, 0, 0],
            [1, 0, 0, 1, 0],
            [1, 0, 0, 0, 1],
        ],
        L: [
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
        ],
        M: [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 1, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        N: [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 1],
            [1, 0, 0, 0, 1],
        ],
        O: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        P: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
        ],
        Q: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 0],
            [0, 1, 1, 0, 1],
        ],
        R: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 1, 0, 0],
            [1, 0, 0, 1, 0],
            [1, 0, 0, 0, 1],
        ],
        S: [
            [0, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
        ],
        T: [
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
        ],
        U: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        V: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
        ],
        W: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 1, 0, 1, 1],
            [1, 0, 0, 0, 1],
        ],
        X: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        Y: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
        ],
        Z: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
        ],
        " ": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ],
        "|": [
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
        ],
    }

    // Dot display component for characters (NDOT 45 style - 5x7 grid)
    const DotChar = ({ char, color, dotSize = 5, gap = 4, outlined = false }) => {
        const pattern = charPatterns[char.toUpperCase()] || charPatterns[" "]
        const scaledGap = Math.round(gap * scale)
        const scaledSize = Math.round(dotSize * scale)
        const scaledBorder = Math.max(1, Math.round(1.5 * scale))

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${scaledGap}px`,
                    flexShrink: 0,
                }}
            >
                {pattern.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        style={{ display: "flex", gap: `${scaledGap}px`, flexShrink: 0 }}
                    >
                        {row.map((cell, cellIndex) => {
                            return (
                                <div
                                    key={cellIndex}
                                    style={{
                                        width: `${scaledSize}px`,
                                        height: `${scaledSize}px`,
                                        minWidth: `${scaledSize}px`,
                                        minHeight: `${scaledSize}px`,
                                        maxWidth: `${scaledSize}px`,
                                        maxHeight: `${scaledSize}px`,
                                        borderRadius: "50%",
                                        aspectRatio: "1 / 1",
                                        backgroundColor: cell && !outlined
                                            ? color
                                            : "transparent",
                                        border: cell && outlined ? `${scaledBorder}px solid ${color}` : "none",
                                        flexShrink: 0,
                                        boxSizing: "border-box",
                                    }}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        )
    }

    // Dot display component for digital time numbers (larger, 5x7 grid)
    const DotDigit = ({ digit, color }) => {
        const pattern = charPatterns[digit] || charPatterns["0"]
        const scaledGap = Math.round(6 * scale)
        const scaledSize = Math.round(16 * scale)

        return (
            <div
                style={{ display: "flex", flexDirection: "column", gap: `${scaledGap}px`, flexShrink: 0 }}
            >
                {pattern.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: "flex", gap: `${scaledGap}px`, flexShrink: 0 }}>
                        {row.map((cell, cellIndex) => {
                            return (
                                <div
                                    key={cellIndex}
                                    style={{
                                        width: `${scaledSize}px`,
                                        height: `${scaledSize}px`,
                                        minWidth: `${scaledSize}px`,
                                        minHeight: `${scaledSize}px`,
                                        maxWidth: `${scaledSize}px`,
                                        maxHeight: `${scaledSize}px`,
                                        borderRadius: "50%",
                                        aspectRatio: "1 / 1",
                                        backgroundColor: cell
                                            ? color
                                            : "transparent",
                                        flexShrink: 0,
                                    }}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        )
    }

    // Separator dots for time
    const TimeSeparator = ({ color }) => {
        const scaledSize = Math.round(16 * scale)
        const scaledGap = Math.round(28 * scale)
        const scaledPadding = Math.round(12 * scale)

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: `${scaledGap}px`,
                    padding: `0 ${scaledPadding}px`,
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: `${scaledSize}px`,
                        height: `${scaledSize}px`,
                        minWidth: `${scaledSize}px`,
                        minHeight: `${scaledSize}px`,
                        maxWidth: `${scaledSize}px`,
                        maxHeight: `${scaledSize}px`,
                        borderRadius: "50%",
                        aspectRatio: "1 / 1",
                        backgroundColor: color,
                        flexShrink: 0,
                    }}
                />
                <div
                    style={{
                        width: `${scaledSize}px`,
                        height: `${scaledSize}px`,
                        minWidth: `${scaledSize}px`,
                        minHeight: `${scaledSize}px`,
                        maxWidth: `${scaledSize}px`,
                        maxHeight: `${scaledSize}px`,
                        borderRadius: "50%",
                        aspectRatio: "1 / 1",
                        backgroundColor: color,
                        flexShrink: 0,
                    }}
                />
            </div>
        )
    }

    // Render text as dot matrix (NDOT 45 style)
    const DotText = ({
        text,
        color,
        dotSize = 5,
        gap = 4,
        charSpacing = 6,
        outlined = false,
    }) => {
        const chars = text.split("")
        const scaledCharSpacing = Math.round(charSpacing * scale)

        return (
            <div
                style={{
                    display: "flex",
                    gap: `${scaledCharSpacing}px`,
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                {chars.map((char, index) => (
                    <DotChar
                        key={index}
                        char={char}
                        color={color}
                        dotSize={dotSize}
                        gap={gap}
                        outlined={outlined}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "32px",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: `${Math.round(120 * scale)}px`,
                    padding: `${Math.round(60 * scale)}px ${Math.round(80 * scale)}px`,
                }}
            >
            {/* Analog Clock */}
            <div style={{ position: "relative", flexShrink: 0 }}>
                {/* Clock Face */}
                <div
                    style={{
                        width: `${360 * scale}px`,
                        height: `${360 * scale}px`,
                        borderRadius: "50%",
                        backgroundColor: clockFaceColor,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Hour markers */}
                    {[0, 3, 6, 9].map((hour) => (
                        <div
                            key={hour}
                            style={{
                                position: "absolute",
                                width: `${14 * scale}px`,
                                height: `${14 * scale}px`,
                                borderRadius: "50%",
                                backgroundColor: darkMode
                                    ? "#8B8B8B"
                                    : "#B8B8B8",
                                top:
                                    hour === 0
                                        ? `${24 * scale}px`
                                        : hour === 6
                                          ? `calc(100% - ${38 * scale}px)`
                                          : "50%",
                                left:
                                    hour === 9
                                        ? `${24 * scale}px`
                                        : hour === 3
                                          ? `calc(100% - ${38 * scale}px)`
                                          : "50%",
                                transform:
                                    hour === 0 || hour === 6
                                        ? "translateX(-50%)"
                                        : hour === 3 || hour === 9
                                          ? "translateY(-50%)"
                                          : "translate(-50%, -50%)",
                            }}
                        />
                    ))}

                    {/* Hour hand */}
                    <motion.div
                        style={{
                            position: "absolute",
                            width: `${8 * scale}px`,
                            height: `${100 * scale}px`,
                            backgroundColor: handColor,
                            borderRadius: `${4 * scale}px`,
                            transformOrigin: "center bottom",
                            bottom: "50%",
                            left: "50%",
                            marginLeft: `${-4 * scale}px`,
                            rotate: hourAngle,
                        }}
                    />

                    {/* Minute hand */}
                    <motion.div
                        style={{
                            position: "absolute",
                            width: `${6 * scale}px`,
                            height: `${140 * scale}px`,
                            backgroundColor: primaryColor,
                            borderRadius: `${3 * scale}px`,
                            transformOrigin: "center bottom",
                            bottom: "50%",
                            left: "50%",
                            marginLeft: `${-3 * scale}px`,
                            rotate: minuteAngle,
                        }}
                    />

                    {/* Center dot */}
                    <div
                        style={{
                            position: "absolute",
                            width: `${20 * scale}px`,
                            height: `${20 * scale}px`,
                            borderRadius: "50%",
                            backgroundColor: handColor,
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 10,
                        }}
                    />
                </div>
            </div>

            {/* Digital Display */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${Math.round(60 * scale)}px`,
                    alignItems: "flex-start",
                }}
            >
                {/* Digital Time */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: `${Math.round(20 * scale)}px`,
                    }}
                >
                    <DotDigit
                        digit={digitalTime.hours[0]}
                        color={primaryColor}
                    />
                    <DotDigit
                        digit={digitalTime.hours[1]}
                        color={primaryColor}
                    />
                    <TimeSeparator color={primaryColor} />
                    <DotDigit
                        digit={digitalTime.minutes[0]}
                        color={textColor}
                    />
                    <DotDigit
                        digit={digitalTime.minutes[1]}
                        color={textColor}
                    />
                </div>

                {/* Date and Day with Divider */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <DotText
                        text={formatDate()}
                        color={textColor}
                        dotSize={3.5}
                        gap={1.5}
                        charSpacing={4}
                        outlined={false}
                    />
                    <DotChar char="|" color={textColor} dotSize={3.5} gap={1.5} outlined={false} />
                    <DotText
                        text={formatDay()}
                        color={textColor}
                        dotSize={3.5}
                        gap={1.5}
                        charSpacing={4}
                        outlined={false}
                    />
                </div>
            </div>
            </div>
        </div>
    )
}

addPropertyControls(WorldClock, {
    useAutoTimezone: {
        type: ControlType.Boolean,
        title: "Auto Timezone",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    selectedTimezone: {
        type: ControlType.Enum,
        title: "Timezone",
        options: [
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Europe/London",
            "Europe/Paris",
            "Europe/Berlin",
            "Asia/Tokyo",
            "Asia/Shanghai",
            "Asia/Singapore",
            "Asia/Dubai",
            "Australia/Sydney",
            "Pacific/Auckland",
        ],
        optionTitles: [
            "New York (EST)",
            "Chicago (CST)",
            "Denver (MST)",
            "Los Angeles (PST)",
            "London (GMT)",
            "Paris (CET)",
            "Berlin (CET)",
            "Tokyo (JST)",
            "Shanghai (CST)",
            "Singapore (SGT)",
            "Dubai (GST)",
            "Sydney (AEDT)",
            "Auckland (NZDT)",
        ],
        defaultValue: "America/New_York",
        hidden: (props) => props.useAutoTimezone === true,
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#FF6B35",
    },
    darkMode: {
        type: ControlType.Boolean,
        title: "Theme",
        defaultValue: true,
        enabledTitle: "Dark",
        disabledTitle: "Light",
    },
})

WorldClock.displayName = "World Clock"