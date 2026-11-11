// Bar Graph Component (Horizontal Only)
// Removes all vertical view logic and controls
import { useEffect, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useSpring, useTransform } from "framer-motion"

interface DataItem {
    label: string
    value: number
    color: string
    percentageColor?: string
}

interface BarGraphProps {
    data: DataItem[]
    backgroundColor: string
    backgroundBarColor: string
    textColor: string
    barSpacing: number
    barBorderRadius: number
    showPercentage: boolean
    maxHeight: number
    minBarHeight: number
    labelSpacing: number
    percentagePosition: "top" | "center" | "bottom"
    barWidth: number | "auto" | "fill" | "relative"
    labelFont: any
    percentageFont: any
    alignment: "left" | "center" | "right"
    padding: string
    // Animation properties grouped
    animation: {
        type: "spring" | "tween"
        duration: number
        stiffness: number
        damping: number
        mass: number
        delay: number
    }
    style?: CSSProperties
}

/**
 * Bar Graph Component (Horizontal Only)
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function BarGraph(props: BarGraphProps) {
    const {
        data,
        backgroundColor,
        backgroundBarColor,
        textColor,
        barSpacing,
        barBorderRadius,
        showPercentage,
        maxHeight,
        minBarHeight,
        labelSpacing,
        percentagePosition,
        barWidth,
        labelFont,
        percentageFont,
        alignment,
        padding,
        // Animation properties
        animation,
        style,
    } = props

    const [isAnimated, setIsAnimated] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            startTransition(() => {
                setIsAnimated(true)
            })
        }, animation.delay)
        return () => clearTimeout(timer)
    }, [animation.delay])

    const maxValue = Math.max(...data.map((item) => item.value))
    const calculatedBarWidth = (() => {
        if (barWidth === "auto") {
            return `calc((100% - ${(data.length - 1) * barSpacing}px) / ${data.length})`
        } else if (barWidth === "fill") {
            return "100%"
        } else if (barWidth === "relative") {
            return "1fr"
        } else if (typeof barWidth === "number") {
            return `${barWidth}px`
        }
        return barWidth
    })()

    const getBarHeight = (value: number) => {
        const percentage = value / 100
        return Math.max(minBarHeight, maxHeight * percentage)
    }

    return (
        <div
            style={{
                ...style,
                backgroundColor,
                padding,
                borderRadius: "12px",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center",
                    gap: `${barSpacing}px`,
                    height: `${maxHeight + 80}px`,
                    width: "100%",
                }}
            >
                {data.map((item, index) => {
                    const barHeight = getBarHeight(item.value)
                    
                    // Animation variants based on selected type
                    const barVariants = {
                        hidden: { height: 0 },
                        visible: animation.type === "spring" 
                            ? { 
                                height: barHeight,
                                transition: {
                                    type: "spring",
                                    stiffness: animation.stiffness,
                                    damping: animation.damping,
                                    mass: animation.mass,
                                    delay: index * 0.1,
                                }
                            }
                            : {
                                height: barHeight,
                                transition: {
                                    type: "tween",
                                    duration: animation.duration / 1000,
                                    ease: "easeOut",
                                    delay: index * 0.1,
                                }
                            }
                    }

                    // Animation variants for percentage text
                    const textVariants = {
                        hidden: { opacity: 0 },
                        visible: { 
                            opacity: 1,
                            transition: { 
                                delay: (animation.duration / 2000) + (index * 0.1),
                                duration: 0.3
                            }
                        }
                    }

                    return (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: barWidth === "relative" ? "100%" : calculatedBarWidth,
                                height: "auto",
                                flex: barWidth === "fill" ? 1 : undefined,
                            }}
                        >
                            {/* Bar Container */}
                            <div
                                style={{
                                    width: "100%",
                                    height: `${maxHeight}px`,
                                    position: "relative",
                                    marginBottom: `${labelSpacing}px`,
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "center",
                                }}
                            >
                                {/* Background Bar (Full Height) */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: backgroundBarColor,
                                        borderRadius: `${barBorderRadius}px`,
                                        opacity: 0.3,
                                    }}
                                />
                                {/* Foreground Bar (Value Height) */}
                                <motion.div
                                    initial="hidden"
                                    animate={isAnimated ? "visible" : "hidden"}
                                    variants={barVariants}
                                    style={{
                                        width: "100%",
                                        backgroundColor: item.color,
                                        borderRadius: `${barBorderRadius}px`,
                                        position: "relative",
                                        zIndex: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        transformOrigin: "center bottom",
                                        marginLeft: "auto",
                                        marginRight: "auto",
                                    }}
                                >
                                    {/* Percentage inside bar */}
                                    {showPercentage && (
                                        <motion.div
                                            initial="hidden"
                                            animate={isAnimated ? "visible" : "hidden"}
                                            variants={textVariants}
                                            style={{
                                                position: "absolute",
                                                top: percentagePosition === "top" ? "12px" : percentagePosition === "bottom" ? "auto" : "50%",
                                                bottom: percentagePosition === "bottom" ? "12px" : "auto",
                                                left: "50%",
                                                transform: percentagePosition === "center" ? "translate(-50%, -50%)" : "translateX(-50%)",
                                                color: item.percentageColor || "#FFFFFF",
                                                whiteSpace: "nowrap",
                                                zIndex: 3,
                                                ...percentageFont,
                                            }}
                                        >
                                            {item.value}%
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                            {/* Label */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isAnimated ? 1 : 0 }}
                                transition={{ 
                                    delay: (animation.duration / 3000) + (index * 0.1),
                                    duration: 0.5
                                }}
                                style={{
                                    color: textColor,
                                    textAlign: "center",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    width: "auto",
                                    ...labelFont,
                                }}
                            >
                                {item.label}
                            </motion.div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(BarGraph, {
    data: {
        type: ControlType.Array,
        title: "Data",
        description: "The data points to display in the graph. Each item has a label, value, color, and percentage color.",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    title: "Label",
                    type: ControlType.String,
                    defaultValue: "Item",
                },
                value: {
                    title: "Value",
                    type: ControlType.Number,
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                },
                color: {
                    title: "Color",
                    type: ControlType.Color,
                    defaultValue: "#FF6B47",
                },
                percentageColor: {
                    title: "% Color",
                    type: ControlType.Color,
                    defaultValue: "#FFFFFF",
                },
            },
        },
        defaultValue: [
            { label: "Jan", value: 64, color: "#9CA3AF", percentageColor: "#FFFFFF" },
            { label: "Feb", value: 79, color: "#9CA3AF", percentageColor: "#FFFFFF" },
            { label: "Mar", value: 92, color: "#9CA3AF", percentageColor: "#FFFFFF" },
            { label: "Apr", value: 84, color: "#FF6B47", percentageColor: "#FFFFFF" },
            { label: "May", value: 26, color: "#FF6B47", percentageColor: "#FFFFFF" },
            { label: "Jun", value: 50, color: "#FF6B47", percentageColor: "#FFFFFF" },
            { label: "Jul", value: 74, color: "#374151", percentageColor: "#FFFFFF" },
            { label: "Aug", value: 85, color: "#374151", percentageColor: "#FFFFFF" },
            { label: "Sep", value: 75, color: "#374151", percentageColor: "#FFFFFF" },
            { label: "Oct", value: 47, color: "#FF6B47", percentageColor: "#FFFFFF" },
            { label: "Nov", value: 78, color: "#FF6B47", percentageColor: "#FFFFFF" },
            { label: "Dec", value: 85, color: "#FF6B47", percentageColor: "#FFFFFF" },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "The background color of the entire graph container.",
        defaultValue: "#1F2937",
    },
    backgroundBarColor: {
        type: ControlType.Color,
        title: "Bar Background",
        description: "The background color of the bars before they are filled.",
        defaultValue: "#374151",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "The color of the labels text.",
        defaultValue: "#FFFFFF",
    },
    // Animation Controls grouped into one object
    animation: {
        type: ControlType.Object,
        title: "Animation",
        description: "Control the animation behavior of the bars",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                description: "Type of animation to use for the bars",
                options: ["spring", "tween"],
                optionTitles: ["Spring", "Tween"],
                defaultValue: "spring",
                displaySegmentedControl: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                description: "Duration of the animation in milliseconds",
                defaultValue: 800,
                min: 100,
                max: 3000,
                step: 100,
                unit: "ms",
            },
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                description: "Spring stiffness (higher = more rigid)",
                defaultValue: 100,
                min: 10,
                max: 1000,
                step: 10,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                description: "Spring damping (higher = less bouncy)",
                defaultValue: 12,
                min: 1,
                max: 100,
                step: 1,
            },
            mass: {
                type: ControlType.Number,
                title: "Mass",
                description: "Spring mass (higher = slower)",
                defaultValue: 1,
                min: 0.1,
                max: 10,
                step: 0.1,
            },
            delay: {
                type: ControlType.Number,
                title: "Initial Delay",
                description: "Delay before animation starts (ms)",
                defaultValue: 100,
                min: 0,
                max: 2000,
                step: 50,
                unit: "ms",
            },
        },
        defaultValue: {
            type: "spring",
            duration: 800,
            stiffness: 100,
            damping: 12,
            mass: 1,
            delay: 100
        }
    },
    // Other Controls
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        description: "Alignment of the bars within the container.",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    barSpacing: {
        type: ControlType.Number,
        title: "Bar Spacing",
        description: "Space between adjacent bars in pixels.",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    barBorderRadius: {
        type: ControlType.Number,
        title: "Bar Radius",
        description: "Rounded corner radius of the bars.",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    showPercentage: {
        type: ControlType.Boolean,
        title: "Show %",
        description: "Toggle visibility of percentage values inside bars.",
        defaultValue: true,
    },
    maxHeight: {
        type: ControlType.Number,
        title: "Max Height",
        description: "Maximum height/width of bars at 100% value.",
        defaultValue: 280,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
    },
    minBarHeight: {
        type: ControlType.Number,
        title: "Min Bar Height",
        description: "Minimum height/width for bars with very small values.",
        defaultValue: 40,
        min: 1,
        max: 200,
        step: 1,
        unit: "px",
    },
    labelSpacing: {
        type: ControlType.Number,
        title: "Label Spacing",
        description: "Space between labels and bars.",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    percentagePosition: {
        type: ControlType.Enum,
        title: "% Position",
        description: "Position of percentage text within the bars (top, center, or bottom).",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    barWidth: {
        type: ControlType.Enum,
        title: "Bar Width",
        description: "Width of individual bars. Auto adjusts based on container, fill takes full width, relative uses equal space.",
        options: ["auto", "fill", "relative", 30, 40, 50, 60, 80],
        optionTitles: [
            "Auto",
            "Fill",
            "Relative",
            "30px",
            "40px",
            "50px",
            "60px",
            "80px",
        ],
        defaultValue: "auto",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        description: "Font settings for the bar labels.",
        defaultValue: {
            fontSize: "14px",
            lineHeight: "1.2em",
            letterSpacing: "-0.01em",
            textAlign: "center",
            variant: "Medium",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    percentageFont: {
        type: ControlType.Font,
        title: "Percentage Font",
        description: "Font settings for the percentage values inside bars.",
        defaultValue: {
            fontSize: "16px",
            lineHeight: "1em",
            letterSpacing: "-0.01em",
            textAlign: "center",
            variant: "Semibold",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        description: "Inner spacing of the graph container.",
        defaultValue: "30px",
    },
})
