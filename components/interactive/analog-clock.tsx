import React, { useState, useEffect, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Component made by Eleveight Supply, All rights reserved.

/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth 100%
 * @framerSupportedLayoutHeight 100%
 */

// ---- helpers ---------------------------------------------------------------

/** Build a Date that represents the current wall-clock time in a given IANA timezone. */
function getZonedNow(tz: string): Date {
    const now = new Date()
    // Use formatToParts to avoid locale-string parsing quirks
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    })

    const parts = dtf
        .formatToParts(now)
        .reduce<Record<string, string>>((acc, p) => {
            if (p.type !== "literal") acc[p.type] = p.value
            return acc
        }, {})

    const y = Number(parts.year)
    const m = Number(parts.month) - 1 // 0-based
    const d = Number(parts.day)
    const h = Number(parts.hour)
    const min = Number(parts.minute)
    const s = Number(parts.second)

    // Create a UTC date with the wall-clock components for deterministic math
    return new Date(Date.UTC(y, m, d, h, min, s))
}

/** Safe wrapper: if tz is invalid, fall back to local Date (prevents throw). */
function safeZonedNow(tz: string): Date {
    try {
        return getZonedNow(tz)
    } catch {
        return new Date()
    }
}

type AnalogClockProps = {
    clockSettings: {
        timezone: string
        clockSize: number
        border: {
            showBorder: boolean
            clockColor: string
            borderWidth: number
            borderRadius: number // as percentage
        }
        background: {
            showBackground: boolean
            backgroundColor: string
        }
    }
    hands: {
        showSecondHand: boolean
        hourHand: { hourHandThickness: number; hourHandColor: string }
        minuteHand: { minuteHandThickness: number; minuteHandColor: string }
        secondHand: { secondHandThickness: number; secondHandColor: string }
    }
    markers: {
        markerStyle: "numbers" | "lines" | "dots" | "none"
        markerColor: string
        markerPadding: number
    }
    centerDot: {
        centerDotColor: string
        centerDotSize: number
    }
}

export default function AnalogClock({
    clockSettings: {
        timezone,
        clockSize,
        border: { showBorder, clockColor, borderWidth, borderRadius },
        background: { showBackground, backgroundColor },
    },
    hands: {
        showSecondHand,
        hourHand: { hourHandThickness, hourHandColor },
        minuteHand: { minuteHandThickness, minuteHandColor },
        secondHand: { secondHandThickness, secondHandColor },
    },
    markers: { markerStyle, markerColor, markerPadding },
    centerDot: { centerDotColor, centerDotSize },
}: AnalogClockProps) {
    // Initialize with correct zone to avoid the initial flicker
    const initial = useMemo(() => safeZonedNow(timezone), [timezone])
    const [time, setTime] = useState<Date>(initial)

    // Keep ticking in the right zone
    useEffect(() => {
        // Immediately sync when timezone changes (no 1s wait)
        setTime(safeZonedNow(timezone))

        const id = setInterval(() => {
            setTime(safeZonedNow(timezone))
        }, 1000)

        return () => clearInterval(id)
    }, [timezone])

    // Angles
    const seconds = time.getUTCSeconds()
    const minutes = time.getUTCMinutes()
    const hours = time.getUTCHours() // because we built a UTC date with zone-correct wall clock

    const secondsDegrees = (seconds / 60) * 360
    const minutesDegrees = (minutes / 60) * 360 + secondsDegrees / 60
    const hoursDegrees = ((hours % 12) / 12) * 360 + minutesDegrees / 12

    // Styles
    const clockStyle: React.CSSProperties = {
        width: `${clockSize}px`,
        height: `${clockSize}px`,
        border: showBorder ? `${borderWidth}px solid ${clockColor}` : "none",
        backgroundColor: showBackground ? backgroundColor : "transparent",
        borderRadius: `${borderRadius}%`,
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // helps GPU promote the element for smoother transforms
        willChange: "transform",
    }

    const handStyle = (
        width: number,
        heightPercent: number,
        color: string,
        zIndex = 8
    ): React.CSSProperties => ({
        width: `${width}px`,
        height: `${heightPercent}%`,
        backgroundColor: color,
        position: "absolute",
        top: "50%",
        left: "50%",
        transformOrigin: "50% 100%",
        borderRadius: "2px",
        zIndex,
    })

    const computeMarkerStyle = (
        i: number,
        type: AnalogClockProps["markers"]["markerStyle"]
    ) => {
        // Place 12 at the top visually
        const angle = (i - 3) * 30
        const radians = (Math.PI / 180) * angle
        const radius = clockSize / 2.2 - markerPadding
        const x = radius * Math.cos(radians)
        const y = radius * Math.sin(radians)

        const common: React.CSSProperties = {
            position: "absolute",
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            transform: "translate(-50%, -50%)",
            color: markerColor,
            zIndex: 1,
            userSelect: "none",
            pointerEvents: "none",
        }

        if (type === "numbers") {
            return {
                ...common,
                fontSize: `${clockSize / 12}px`,
                lineHeight: 1,
                fontWeight: 500,
            }
        }
        if (type === "lines") {
            return {
                ...common,
                width: `${clockSize / 50}px`,
                height: `${clockSize / 15}px`,
                backgroundColor: markerColor,
                transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                borderRadius: "4px",
            }
        }
        if (type === "dots") {
            const s = clockSize / 30
            return {
                ...common,
                width: `${s}px`,
                height: `${s}px`,
                borderRadius: "50%",
                backgroundColor: markerColor,
            }
        }
        return common
    }

    const renderMarkers = () => {
        if (markerStyle === "none") return null
        return Array.from({ length: 12 }).map((_, i) => {
            const number = i === 0 ? 12 : i
            return (
                <div key={i} style={computeMarkerStyle(i, markerStyle)}>
                    {markerStyle === "numbers" ? number : ""}
                </div>
            )
        })
    }

    return (
        <div style={clockStyle}>
            {/* Hour */}
            <div
                style={{
                    ...handStyle(hourHandThickness, 35, hourHandColor),
                    transform: `translate(-50%, -100%) rotate(${hoursDegrees}deg)`,
                }}
            />
            {/* Minute */}
            <div
                style={{
                    ...handStyle(minuteHandThickness, 40, minuteHandColor),
                    transform: `translate(-50%, -100%) rotate(${minutesDegrees}deg)`,
                }}
            />
            {/* Second */}
            {showSecondHand && (
                <div
                    style={{
                        ...handStyle(secondHandThickness, 45, secondHandColor),
                        transform: `translate(-50%, -100%) rotate(${secondsDegrees}deg)`,
                    }}
                />
            )}

            {renderMarkers()}

            {/* Center Dot */}
            <div
                style={{
                    position: "absolute",
                    width: `${centerDotSize}px`,
                    height: `${centerDotSize}px`,
                    backgroundColor: centerDotColor,
                    borderRadius: "50%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                }}
            />
        </div>
    )
}

AnalogClock.defaultProps = {
    clockSettings: {
        timezone: "America/New_York",
        clockSize: 120,
        border: {
            showBorder: true,
            clockColor: "#525252",
            borderWidth: 1,
            borderRadius: 50,
        },
        background: {
            showBackground: true,
            backgroundColor: "#333333",
        },
    },
    hands: {
        showSecondHand: true,
        hourHand: {
            hourHandThickness: 3,
            hourHandColor: "#EDEDED",
        },
        minuteHand: {
            minuteHandThickness: 2,
            minuteHandColor: "#8A8A8A",
        },
        secondHand: {
            secondHandThickness: 1,
            secondHandColor: "red",
        },
    },
    markers: {
        markerStyle: "numbers",
        markerColor: "#8A8A8A",
        markerPadding: 10,
    },
    centerDot: {
        centerDotColor: "#8A8A8A",
        centerDotSize: 6,
    },
}

addPropertyControls(AnalogClock, {
    clockSettings: {
        type: ControlType.Object,
        title: "Clock",
        controls: {
            timezone: {
                type: ControlType.String,
                title: "Timezone",
                defaultValue: "America/New_York",
                description:
                    "Use an IANA tz like 'Europe/Bucharest' or 'America/Los_Angeles'.",
            },
            clockSize: {
                type: ControlType.Number,
                title: "Size",
                min: 50,
                max: 400,
                defaultValue: 200,
            },
            border: {
                type: ControlType.Object,
                title: "Border",
                controls: {
                    showBorder: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                        enabledTitle: "Yes",
                        disabledTitle: "No",
                    },
                    clockColor: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#525252",
                        hidden: (props) =>
                            !props.clockSettings.border.showBorder,
                    },
                    borderWidth: {
                        type: ControlType.Number,
                        title: "Thickness",
                        min: 0,
                        max: 20,
                        defaultValue: 1,
                        displayStepper: true,
                        hidden: (props) =>
                            !props.clockSettings.border.showBorder,
                    },
                    borderRadius: {
                        type: ControlType.Number,
                        title: "Radius",
                        min: 0,
                        max: 50,
                        defaultValue: 50,
                        displayStepper: true,
                    },
                },
            },
            background: {
                type: ControlType.Object,
                title: "Background",
                controls: {
                    showBackground: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                        enabledTitle: "Yes",
                        disabledTitle: "No",
                    },
                    backgroundColor: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#333333",
                        hidden: (props) =>
                            !props.clockSettings.background.showBackground,
                    },
                },
            },
        },
    },
    hands: {
        type: ControlType.Object,
        title: "Hands",
        controls: {
            showSecondHand: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            hourHand: {
                type: ControlType.Object,
                title: "Hour",
                controls: {
                    hourHandThickness: {
                        type: ControlType.Number,
                        title: "Thickness",
                        min: 1,
                        max: 20,
                        defaultValue: 3,
                        displayStepper: true,
                    },
                    hourHandColor: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#EDEDED",
                    },
                },
            },
            minuteHand: {
                type: ControlType.Object,
                title: "Minute",
                controls: {
                    minuteHandThickness: {
                        type: ControlType.Number,
                        title: "Thickness",
                        min: 1,
                        max: 20,
                        defaultValue: 2,
                        displayStepper: true,
                    },
                    minuteHandColor: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#8A8A8A",
                    },
                },
            },
            secondHand: {
                type: ControlType.Object,
                title: "Second",
                controls: {
                    secondHandThickness: {
                        type: ControlType.Number,
                        title: "Thickness",
                        min: 1,
                        max: 20,
                        defaultValue: 1,
                        displayStepper: true,
                    },
                    secondHandColor: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "red",
                    },
                },
            },
        },
    },
    markers: {
        type: ControlType.Object,
        title: "Markers",
        controls: {
            markerStyle: {
                type: ControlType.Enum,
                title: "Style",
                options: ["numbers", "lines", "dots", "none"],
                optionTitles: ["Numbers", "Lines", "Dots", "None"],
                defaultValue: "numbers",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            markerColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#8A8A8A",
            },
            markerPadding: {
                type: ControlType.Number,
                title: "Edge Offset",
                min: 0,
                max: 50,
                defaultValue: 8,
                displayStepper: true,
            },
        },
    },
    centerDot: {
        type: ControlType.Object,
        title: "Center Dot",
        controls: {
            centerDotColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#8A8A8A",
            },
            centerDotSize: {
                type: ControlType.Number,
                title: "Size",
                min: 2,
                max: 20,
                defaultValue: 6,
                displayStepper: true,
            },
        },
    },
})
