// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect } from "react"
import { EmptyState } from "https://framer.com/m/Shared-8iGD.js@9bbvaZD8RsNyj0rYVQ4z"

// ============================================================================
// CONSTANTS
// ============================================================================

const unitNames = ["years", "months", "days", "hours", "minutes", "seconds"]
const unitSizes = [365, 12, 30, 24, 60, 60]
const finishedIndex = 6

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_TIME = { hour: 12, minute: 0, second: 0, time: "PM" }

const DEFAULT_UNITS = {
    years: false,
    months: false,
    days: true,
    hours: true,
    minutes: true,
    seconds: true,
    zeroUnits: false,
}

const DEFAULT_LAYOUT = {
    orientation: "horizontal",
    alignment: "center",
    gap: 16,
    textSelect: false,
}

const DEFAULT_NUMBER_STYLE = {
    font: {
        fontSize: 40,
        fontWeight: "600",
        lineHeight: "1.2em",
    },
    color: "#ffffff",
    padZero: true,
    minWidth: 60,
}

const DEFAULT_LABEL_STYLE = {
    show: true,
    text: "full",
    case: "capitalize",
    location: "below",
    gap: 4,
    font: {
        fontSize: 14,
        fontWeight: "400",
        lineHeight: "1.2em",
    },
    color: "#999999",
}

const DEFAULT_BOX_STYLE = {
    enabled: false,
    background: "rgba(255,255,255,0.08)",
    padding: "12px 16px",
    radius: "12px",
    border: {
        borderWidth: 0,
        borderStyle: "solid",
        borderColor: "rgba(255,255,255,0.1)",
    },
    shadow: "",
}

const DEFAULT_SEPARATOR = {
    show: false,
    style: "line",
    text: ":",
    color: "#cccccc",
    thickness: 2,
    length: 48,
}

const DEFAULT_FINISHED = {
    style: "text",
    text: "Countdown finished!",
}

// ============================================================================
// HELPERS
// ============================================================================

function getDateWithTime(date, hour, minute, second, ampm) {
    const newDate = new Date(date)
    newDate.setHours(hour + (ampm === "PM" && hour !== 12 ? 12 : 0))
    newDate.setMinutes(minute)
    newDate.setSeconds(second)
    return newDate
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Countdown Timer
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 120
 */
export default function Countdown(props) {
    // Merge configs with defaults so missing sub-properties still work
    const time = { ...DEFAULT_TIME, ...(props.time || {}) }
    const units = { ...DEFAULT_UNITS, ...(props.units || {}) }
    const layout = { ...DEFAULT_LAYOUT, ...(props.layout || {}) }
    const numberStyle = {
        ...DEFAULT_NUMBER_STYLE,
        ...(props.numberStyle || {}),
        font: {
            ...DEFAULT_NUMBER_STYLE.font,
            ...((props.numberStyle && props.numberStyle.font) || {}),
        },
    }
    const labelStyle = {
        ...DEFAULT_LABEL_STYLE,
        ...(props.labelStyle || {}),
        font: {
            ...DEFAULT_LABEL_STYLE.font,
            ...((props.labelStyle && props.labelStyle.font) || {}),
        },
    }
    const boxStyle = {
        ...DEFAULT_BOX_STYLE,
        ...(props.boxStyle || {}),
        border: {
            ...DEFAULT_BOX_STYLE.border,
            ...((props.boxStyle && props.boxStyle.border) || {}),
        },
    }
    const separator = { ...DEFAULT_SEPARATOR, ...(props.separator || {}) }
    const finished = { ...DEFAULT_FINISHED, ...(props.finished || {}) }

    const targetDate = getDateWithTime(
        props.date,
        time.hour,
        time.minute,
        time.second,
        time.time
    )
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)
        return () => clearTimeout(timer)
    })

    if (isCanvas && !props.date) {
        return (
            <EmptyState
                title="Set a date value."
                subtitle="Use the properties panel to choose a target date."
                maxWidth={500}
            />
        )
    }

    function calculateTimeLeft() {
        const now = new Date()
        const difference = targetDate.getTime() - now.getTime()
        const timeLeftValue = Array(7).fill(null)

        if (difference > 0) {
            timeLeftValue[0] = Math.floor(
                difference / (1000 * 60 * 60 * 24 * 365)
            )
            timeLeftValue[1] = Math.floor(
                (difference / (1000 * 60 * 60 * 24 * 30)) % 12
            )
            timeLeftValue[2] = Math.floor(
                (difference / (1000 * 60 * 60 * 24)) % 30
            )
            timeLeftValue[3] = Math.floor((difference / (1000 * 60 * 60)) % 24)
            timeLeftValue[4] = Math.floor((difference / 1000 / 60) % 60)
            timeLeftValue[5] = Math.floor((difference / 1000) % 60)
            timeLeftValue[6] = true

            for (let i = 0; i < unitNames.length - 1; i++) {
                if (!units[unitNames[i]]) {
                    timeLeftValue[i + 1] += timeLeftValue[i] * unitSizes[i + 1]
                    timeLeftValue[i] = null
                }
            }

            if (!units.seconds) timeLeftValue[5] = null

            if (!units.zeroUnits) {
                for (let i = 0; i < unitNames.length; i++) {
                    if (timeLeftValue[i] <= 0) timeLeftValue[i] = null
                    else break
                }
            }
        } else {
            timeLeftValue[finishedIndex] = false
        }

        return timeLeftValue
    }

    // ---- Build styles (spread full font object so all properties apply) ----

    const numberTextStyle: React.CSSProperties = {
        ...numberStyle.font,
        color: numberStyle.color,
        display: "block",
    }

    const labelTextStyle: React.CSSProperties = {
        ...labelStyle.font,
        color: labelStyle.color,
        textTransform: labelStyle.case as any,
        display: "block",
    }

    const validUnits = unitNames
        .map((unit, index) => ({ unit, value: timeLeft[index] }))
        .filter((item) => item.value != null)

    const isVertical = layout.orientation === "vertical"

    function labelText(item) {
        if (labelStyle.text === "short") return item.unit[0].toUpperCase()
        return item.unit
    }

    // ---- Unit block (number + optional label with configurable location) ----

    function renderUnit(item, idx) {
        const paddedValue = numberStyle.padZero
            ? String(item.value).padStart(2, "0")
            : String(item.value)

        const labelNode = labelStyle.show ? (
            <span style={labelTextStyle}>{labelText(item)}</span>
        ) : null

        const numberNode = <span style={numberTextStyle}>{paddedValue}</span>

        // Build inner content based on label location
        let inner: React.ReactNode
        const innerGap = `${labelStyle.gap}px`

        if (!labelStyle.show) {
            inner = numberNode
        } else if (labelStyle.location === "above") {
            inner = (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: innerGap,
                    }}
                >
                    {labelNode}
                    {numberNode}
                </div>
            )
        } else if (labelStyle.location === "inline") {
            inner = (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: innerGap,
                    }}
                >
                    {numberNode}
                    {labelNode}
                </div>
            )
        } else {
            // below (default)
            inner = (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: innerGap,
                    }}
                >
                    {numberNode}
                    {labelNode}
                </div>
            )
        }

        const boxWrapStyle: React.CSSProperties = boxStyle.enabled
            ? {
                  background: boxStyle.background,
                  padding: boxStyle.padding,
                  borderRadius: boxStyle.radius,
                  borderWidth: boxStyle.border.borderWidth,
                  borderStyle: boxStyle.border.borderStyle,
                  borderColor: boxStyle.border.borderColor,
                  boxShadow: boxStyle.shadow || undefined,
                  minWidth: numberStyle.minWidth,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
              }
            : {
                  minWidth: numberStyle.minWidth,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
              }

        return (
            <div key={item.unit} style={boxWrapStyle}>
                {inner}
            </div>
        )
    }

    // ---- Separator ----

    function renderSeparator(i) {
        if (!separator.show) return null

        if (separator.style === "text") {
            return (
                <span
                    key={`sep-${i}`}
                    style={{
                        ...numberTextStyle,
                        color: separator.color,
                    }}
                >
                    {separator.text}
                </span>
            )
        }

        // line style
        return (
            <div
                key={`sep-${i}`}
                style={{
                    width: isVertical ? separator.length : separator.thickness,
                    height: isVertical ? separator.thickness : separator.length,
                    backgroundColor: separator.color,
                    flexShrink: 0,
                }}
            />
        )
    }

    // ---- Compose segments with gaps + separators ----

    const segments: React.ReactNode[] = []
    validUnits.forEach((item, i) => {
        if (i > 0) {
            const sep = renderSeparator(i)
            if (sep) segments.push(sep)
        }
        segments.push(renderUnit(item, i))
    })

    // ---- Finished state ----

    if (!timeLeft[finishedIndex]) {
        if (finished.style === "text") {
            return (
                <p
                    style={{
                        ...numberTextStyle,
                        margin: 0,
                    }}
                >
                    {finished.text}
                </p>
            )
        }
        return finished.component || null
    }

    // ---- Container ----

    const alignMap: Record<string, string> = {
        start: "flex-start",
        center: "center",
        end: "flex-end",
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                justifyContent: alignMap[layout.alignment] || "center",
                alignItems: "center",
                gap: `${layout.gap}px`,
                userSelect: layout.textSelect ? "auto" : "none",
                width: "100%",
                height: "100%",
            }}
        >
            {segments}
        </div>
    )
}

// ============================================================================
// PROPERTY CONTROLS
// ============================================================================

addPropertyControls(Countdown, {
    // ---------- Date & Time ----------
    date: {
        type: ControlType.Date,
        title: "Target Date",
    },
    time: {
        type: ControlType.Object,
        title: "Target Time",
        controls: {
            hour: {
                type: ControlType.Number,
                title: "Hour",
                min: 1,
                max: 12,
                step: 1,
                defaultValue: 12,
            },
            minute: {
                type: ControlType.Number,
                title: "Minute",
                min: 0,
                max: 59,
                step: 1,
                defaultValue: 0,
            },
            second: {
                type: ControlType.Number,
                title: "Second",
                min: 0,
                max: 59,
                step: 1,
                defaultValue: 0,
            },
            time: {
                type: ControlType.Enum,
                title: "AM / PM",
                options: ["AM", "PM"],
                optionTitles: ["AM", "PM"],
                defaultValue: "PM",
                displaySegmentedControl: true,
            },
        },
    },

    // ---------- Units ----------
    units: {
        type: ControlType.Object,
        title: "Units",
        controls: {
            years: {
                type: ControlType.Boolean,
                title: "Years",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            months: {
                type: ControlType.Boolean,
                title: "Months",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            days: {
                type: ControlType.Boolean,
                title: "Days",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            hours: {
                type: ControlType.Boolean,
                title: "Hours",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            minutes: {
                type: ControlType.Boolean,
                title: "Minutes",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            seconds: {
                type: ControlType.Boolean,
                title: "Seconds",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            zeroUnits: {
                type: ControlType.Boolean,
                title: "Zero Units",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                description: "Show units even when their value is zero.",
            },
        },
    },

    // ---------- Layout ----------
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            orientation: {
                type: ControlType.Enum,
                title: "Orientation",
                options: ["horizontal", "vertical"],
                optionTitles: ["Horizontal", "Vertical"],
                optionIcons: ["direction-horizontal", "direction-vertical"],
                defaultValue: "horizontal",
                displaySegmentedControl: true,
            },
            alignment: {
                type: ControlType.Enum,
                title: "Align",
                options: ["start", "center", "end"],
                optionTitles: ["Start", "Center", "End"],
                defaultValue: "center",
                displaySegmentedControl: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 16,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
            },
            textSelect: {
                type: ControlType.Boolean,
                title: "Text Select",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
        },
    },

    // ---------- Number Style ----------
    numberStyle: {
        type: ControlType.Object,
        title: "Number Style",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                displayFontSize: true,
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 40,
                    fontWeight: "600",
                    lineHeight: "1.2em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#ffffff",
            },
            padZero: {
                type: ControlType.Boolean,
                title: "Pad Zero",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Show leading zeros (e.g., 05 instead of 5).",
            },
            minWidth: {
                type: ControlType.Number,
                title: "Min Width",
                defaultValue: 60,
                min: 0,
                max: 400,
                step: 2,
                unit: "px",
            },
        },
    },

    // ---------- Label Style ----------
    labelStyle: {
        type: ControlType.Object,
        title: "Label Style",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show Labels",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            text: {
                type: ControlType.Enum,
                title: "Text",
                options: ["full", "short"],
                optionTitles: ["Full", "Short"],
                defaultValue: "full",
                displaySegmentedControl: true,
                hidden: (p) => p.show === false,
            },
            case: {
                type: ControlType.Enum,
                title: "Case",
                options: ["capitalize", "uppercase", "lowercase", "none"],
                optionTitles: ["Aa", "AA", "aa", "-"],
                defaultValue: "capitalize",
                displaySegmentedControl: true,
                hidden: (p) => p.show === false,
            },
            location: {
                type: ControlType.Enum,
                title: "Location",
                options: ["above", "below", "inline"],
                optionTitles: ["Above", "Below", "Inline"],
                defaultValue: "below",
                displaySegmentedControl: true,
                hidden: (p) => p.show === false,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 4,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (p) => p.show === false,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                displayFontSize: true,
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 14,
                    fontWeight: "400",
                    lineHeight: "1.2em",
                },
                hidden: (p) => p.show === false,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#999999",
                hidden: (p) => p.show === false,
            },
        },
    },

    // ---------- Box Style ----------
    boxStyle: {
        type: ControlType.Object,
        title: "Box Style",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Box",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(255,255,255,0.08)",
                hidden: (p) => p.enabled === false,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "12px 16px",
                hidden: (p) => p.enabled === false,
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "12px",
                hidden: (p) => p.enabled === false,
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "rgba(255,255,255,0.1)",
                },
                hidden: (p) => p.enabled === false,
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                hidden: (p) => p.enabled === false,
            },
        },
    },

    // ---------- Separator ----------
    separator: {
        type: ControlType.Object,
        title: "Separator",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Separator",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["line", "text"],
                optionTitles: ["Line", "Text"],
                defaultValue: "line",
                displaySegmentedControl: true,
                hidden: (p) => p.show === false,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: ":",
                hidden: (p) => p.show === false || p.style !== "text",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#cccccc",
                hidden: (p) => p.show === false,
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 2,
                min: 1,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (p) => p.show === false || p.style !== "line",
            },
            length: {
                type: ControlType.Number,
                title: "Length",
                defaultValue: 48,
                min: 4,
                max: 400,
                step: 2,
                unit: "px",
                hidden: (p) => p.show === false || p.style !== "line",
            },
        },
    },

    // ---------- Finished State ----------
    finished: {
        type: ControlType.Object,
        title: "Finished State",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Display",
                options: ["text", "layer"],
                optionTitles: ["Text", "Layer"],
                defaultValue: "text",
                displaySegmentedControl: true,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "Countdown finished!",
                hidden: (p) => p.style !== "text",
            },
            component: {
                type: ControlType.ComponentInstance,
                title: "Component",
                hidden: (p) => p.style !== "layer",
            },
        },
    },
})
