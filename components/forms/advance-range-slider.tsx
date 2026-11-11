import * as React from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function CustomSlider(props) {
    const {
        knobSize,
        trackColor,
        progressColor,
        knobColor,
        min,
        max,
        textColor,
        step,
        defaultValue,
        targetId,
        showTooltip,
        enableCustomCSS,
        customTooltipStyle,
        freeMode,
        enableCustomKnobCSS,
        customKnobStyle,
        showLabels,
        labelPosition,
        enableLabelCSS,
        customLabelStyle,
        trackHeight,
        prefix,
        suffix,
        labelTextColor,
        inputName,
    } = props

    const containerRef = React.useRef(null)
    const x = useMotionValue(0)
    const hiddenInputRef = React.useRef(null)

    const safeMax = max <= min ? min + 1 : max
    const safeStep = step <= 0 ? 0.1 : step
    const cleanValue = (val) => parseFloat(Number(val).toFixed(2))
    const formatValue = (val) => `${prefix || ""}${val}${suffix || ""}`

    const getInitialValue = () => {
        let val = defaultValue
        if (!freeMode) {
            val = Math.round((val - min) / safeStep) * safeStep + min
        }
        return Math.max(min, Math.min(safeMax, cleanValue(val)))
    }

    const [currentValue, setCurrentValue] = React.useState(getInitialValue())

    const parseCSS = (cssString) => {
        if (!cssString) return {}
        try {
            return cssString.split(";").reduce((acc, rule) => {
                const [prop, val] = rule.split(":")
                if (prop && val) {
                    const key = prop
                        .trim()
                        .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
                    acc[key] = val.trim()
                }
                return acc
            }, {})
        } catch (e) {
            return {}
        }
    }

    const userKnobStyle = React.useMemo(
        () => (enableCustomKnobCSS ? parseCSS(customKnobStyle) : {}),
        [enableCustomKnobCSS, customKnobStyle]
    )
    const knobDiameter = enableCustomKnobCSS
        ? parseFloat(userKnobStyle.width) || 28
        : knobSize
    const progressWidth = useTransform(x, (latest) => latest + knobDiameter / 2)

    const getXFromValue = (val) => {
        if (!containerRef.current) return 0
        const trackWidth = containerRef.current.offsetWidth - knobDiameter
        return ((val - min) / (safeMax - min)) * trackWidth
    }

    const updateExternalDisplay = (val) => {
        if (targetId?.trim()) {
            const el = document.getElementById(targetId)
            if (el) {
                const formatted = formatValue(val)
                const node = Array.from(el.childNodes).find(
                    (n) => n.nodeType === 3 || n.nodeType === 1
                )
                node
                    ? (node.textContent = formatted)
                    : (el.textContent = formatted)
            }
        }

        // Update hidden input for Framer Forms
        if (hiddenInputRef.current) {
            hiddenInputRef.current.value = val
            // Dispatch input event so form knows value changed
            const event = new Event("input", { bubbles: true })
            hiddenInputRef.current.dispatchEvent(event)
        }
    }

    // Prevents jump on initial load
    React.useLayoutEffect(() => {
        const val = getInitialValue()
        setCurrentValue(val)
        const timer = setTimeout(() => {
            if (containerRef.current) x.set(getXFromValue(val))
        }, 50)
        updateExternalDisplay(val)
        return () => clearTimeout(timer)
    }, [defaultValue, min, max, knobDiameter, freeMode, step])

    // Updates position on resize
    React.useLayoutEffect(() => {
        if (!containerRef.current) return
        const ro = new ResizeObserver(() => x.set(getXFromValue(currentValue)))
        ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [currentValue, min, max, knobDiameter])

    const handleDrag = () => {
        if (!containerRef.current) return
        const trackWidth = containerRef.current.offsetWidth - knobDiameter
        const currentX = x.get()
        const percentage = Math.max(0, Math.min(1, currentX / trackWidth))
        const rawValue = percentage * (safeMax - min) + min

        let newValue
        if (freeMode) {
            newValue = cleanValue(rawValue)
        } else {
            const stepped =
                Math.round((rawValue - min) / safeStep) * safeStep + min
            newValue = cleanValue(stepped)
            x.set(getXFromValue(newValue))
        }

        newValue = Math.max(min, Math.min(safeMax, newValue))
        if (newValue !== currentValue) {
            setCurrentValue(newValue)
            updateExternalDisplay(newValue)
        }
    }

    const userTooltipStyle = React.useMemo(
        () => (enableCustomCSS ? parseCSS(customTooltipStyle) : {}),
        [enableCustomCSS, customTooltipStyle]
    )
    const userLabelStyle = React.useMemo(
        () => (enableLabelCSS ? parseCSS(customLabelStyle) : {}),
        [enableLabelCSS, customLabelStyle]
    )

    // Space calculation for "Fit Content"
    const tooltipSpace = showTooltip ? 50 : 10
    const labelSpace = showLabels ? 35 : 10

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: `${tooltipSpace}px ${knobDiameter / 2}px ${labelSpace}px ${knobDiameter / 2}px`,
                boxSizing: "border-box",
                position: "relative",
                overflow: "visible",
            }}
        >
            {/* Hidden input for Framer Forms integration */}
            <input
                ref={hiddenInputRef}
                type="hidden"
                name={inputName}
                defaultValue={currentValue}
            />

            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: `${Math.max(knobDiameter, trackHeight)}px`,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    overflow: "visible",
                }}
            >
                {showLabels && (
                    <>
                        <div
                            style={{
                                ...defaultLabelStyle,
                                left: 0,
                                [labelPosition === "bottom" ? "bottom" : "top"]:
                                    -28,
                                color: labelTextColor,
                                ...(enableLabelCSS ? userLabelStyle : {}),
                            }}
                        >
                            {formatValue(min)}
                        </div>
                        <div
                            style={{
                                ...defaultLabelStyle,
                                right: 0,
                                [labelPosition === "bottom" ? "bottom" : "top"]:
                                    -28,
                                color: labelTextColor,
                                ...(enableLabelCSS ? userLabelStyle : {}),
                            }}
                        >
                            {formatValue(max)}
                        </div>
                    </>
                )}

                <div
                    style={{
                        width: "100%",
                        height: trackHeight,
                        backgroundColor: trackColor,
                        borderRadius: trackHeight / 2,
                        position: "absolute",
                    }}
                />
                <motion.div
                    style={{
                        position: "absolute",
                        left: 0,
                        height: trackHeight,
                        backgroundColor: progressColor,
                        borderRadius: trackHeight / 2,
                        width: progressWidth,
                        pointerEvents: "none",
                    }}
                />

                <motion.div
                    drag="x"
                    dragConstraints={containerRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={handleDrag}
                    onDragStart={handleDrag}
                    style={{
                        ...knobStyle,
                        x,
                        width: knobDiameter,
                        height: knobDiameter,
                        backgroundColor: knobColor,
                        ...(enableCustomKnobCSS ? userKnobStyle : {}),
                    }}
                >
                    {showTooltip && (
                        <div
                            style={{
                                ...defaultTooltipStyle,
                                color: textColor,
                                bottom: knobDiameter + 12,
                                ...userTooltipStyle,
                            }}
                        >
                            {formatValue(currentValue)}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

const knobStyle = {
    borderRadius: "50%",
    position: "absolute",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    zIndex: 1,
    cursor: "grab",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
}
const defaultTooltipStyle = {
    position: "absolute",
    fontSize: "14px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
}
const defaultLabelStyle = {
    position: "absolute",
    fontSize: "12px",
    color: "#999",
    fontWeight: "500",
    fontFamily: "inherit",
}

addPropertyControls(CustomSlider, {
    inputName: {
        type: ControlType.String,
        title: "Input Name",
        defaultValue: "slider_value",
    },
    freeMode: {
        type: ControlType.Boolean,
        title: "Range Step Free",
        defaultValue: false,
    },
    step: {
        type: ControlType.Number,
        title: "Range Step",
        defaultValue: 1,
        min: 0.01,
        hidden: (p) => p.freeMode,
    },
    defaultValue: {
        type: ControlType.Number,
        title: "Set Default Value",
        defaultValue: 10,
    },

    showTooltip: {
        type: ControlType.Boolean,
        title: "Tooltip Visibility",
        defaultValue: true,
    },
    enableCustomCSS: {
        type: ControlType.Boolean,
        title: "Tooltip CSS Visibility",
        defaultValue: false,
        hidden: (p) => !p.showTooltip,
    },
    customTooltipStyle: {
        type: ControlType.String,
        title: "Tooltip CSS",
        defaultValue:
            "background: #000; color: #fff; padding: 4px 8px; border-radius: 4px;",
        hidden: (p) => !p.enableCustomCSS || !p.showTooltip,
    },
    textColor: {
        type: ControlType.Color,
        title: "Tooltip Text Color",
        defaultValue: "#333",
        hidden: (p) => p.enableCustomCSS || !p.showTooltip,
    },

    enableCustomKnobCSS: {
        type: ControlType.Boolean,
        title: "Custom Knob CSS",
        defaultValue: false,
    },
    customKnobStyle: {
        type: ControlType.String,
        title: "Knob CSS",
        defaultValue: "width: 28px; height: 28px; border: 2px solid #007AFF;",
        hidden: (p) => !p.enableCustomKnobCSS,
    },
    knobSize: {
        type: ControlType.Number,
        title: "Knob Size (px)",
        defaultValue: 28,
        min: 12,
        max: 60,
        hidden: (p) => p.enableCustomKnobCSS,
    },
    knobColor: {
        type: ControlType.Color,
        title: "Knob Color",
        defaultValue: "#FFF",
        hidden: (p) => p.enableCustomKnobCSS,
    },

    min: { type: ControlType.Number, title: "Min Range", defaultValue: 0 },
    max: { type: ControlType.Number, title: "Max Range", defaultValue: 100 },
    targetId: {
        type: ControlType.String,
        title: "Display on #ID",
        placeholder: "e.g. price-value",
    },

    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "" },
    showLabels: {
        type: ControlType.Boolean,
        title: "Min-Max Labels",
        defaultValue: true,
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["top", "bottom"],
        defaultValue: "bottom",
        hidden: (p) => !p.showLabels,
    },
    labelTextColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#999",
        hidden: (p) => !p.showLabels,
    },
    enableLabelCSS: {
        type: ControlType.Boolean,
        title: "Custom Label CSS",
        defaultValue: false,
        hidden: (p) => !p.showLabels,
    },
    customLabelStyle: {
        type: ControlType.String,
        title: "Label CSS",
        defaultValue: "font-size: 10px; font-weight: bold;",
        hidden: (p) => !p.enableLabelCSS || !p.showLabels,
    },

    trackHeight: {
        type: ControlType.Number,
        title: "Track Height",
        defaultValue: 6,
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track Color",
        defaultValue: "#DDD",
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progressbar Color",
        defaultValue: "#007AFF",
    },
})
