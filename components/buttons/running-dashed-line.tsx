// Get Started: https://www.framer.com/developers

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
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState } from "react"

/**
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DashedLine(props) {
    const {
        variant,
        dashLength,
        gapLength,
        speed,
        lineWidth,
        lineColor,
        strokeLinecap,
        hoverLineColor,
        borderRadius,
        backgroundColor,
        hoverBackgroundColor,
        solidOnHover,
        run,
        transition,
        onClick,
    } = props
    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()

    const dashArray = `${dashLength} ${gapLength}`
    const totalLength = dashLength + gapLength
    const duration = speed
    return (
        <motion.div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            transition={transition}
            style={{
                position: "relative",
                width: "100%",
                height: variant === "line" ? lineWidth : "100%",
                backgroundColor: isHovered
                    ? hoverBackgroundColor
                    : backgroundColor,
                borderRadius,
                overflow: "visible",
                border: "none",
                cursor: "default",
                padding: "0",
                transition: "background-color 0.2s ease",
            }}
        >
            <svg
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
                xmlns="http://www.w3.org/2000/svg"
            >
                {variant === "border" ? (
                    <motion.rect
                        x={lineWidth / 2}
                        y={lineWidth / 2}
                        width={`calc(100% - ${lineWidth}px)`}
                        height={`calc(100% - ${lineWidth}px)`}
                        rx={borderRadius}
                        ry={borderRadius}
                        fill="none"
                        strokeLinecap={strokeLinecap}
                        stroke={isHovered ? hoverLineColor : lineColor}
                        strokeWidth={lineWidth}
                        strokeDasharray={
                            isHovered && solidOnHover ? "0" : dashArray
                        }
                        strokeDashoffset={-totalLength}
                        animate={
                            !run || isStatic
                                ? {}
                                : {
                                      strokeDashoffset: [0, -totalLength],
                                      stroke: isHovered
                                          ? hoverLineColor
                                          : lineColor,
                                      strokeDasharray:
                                          isHovered && solidOnHover
                                              ? "0"
                                              : dashArray,
                                  }
                        }
                        transition={
                            !run || isStatic
                                ? {}
                                : {
                                      strokeDashoffset: {
                                          duration: duration,
                                          repeat: Infinity,
                                          ease: "linear",
                                      },
                                      stroke: transition,
                                      strokeDasharray: transition,
                                  }
                        }
                    />
                ) : (
                    <motion.line
                        x1="0%"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                        strokeLinecap={strokeLinecap}
                        stroke={lineColor}
                        strokeWidth={lineWidth}
                        strokeDasharray={dashArray}
                        strokeDashoffset={-totalLength}
                        animate={
                            isStatic
                                ? {}
                                : {
                                      strokeDashoffset: [0, -totalLength],
                                      stroke: lineColor,
                                      strokeDasharray: dashArray,
                                  }
                        }
                        transition={
                            !run || isStatic
                                ? {}
                                : {
                                      strokeDashoffset: {
                                          duration: duration,
                                          repeat: Infinity,
                                          ease: "linear",
                                      },
                                      stroke: transition,
                                      strokeDasharray: transition,
                                  }
                        }
                    />
                )}
            </svg>
        </motion.div>
    )
}

addPropertyControls(DashedLine, {
    variant: {
        type: ControlType.Enum,
        title: "Style",
        options: ["border", "line"],
        optionTitles: ["Border", "Line"],
        defaultValue: "border",
    },
    dashLength: {
        type: ControlType.Number,
        title: "Dash Length",
        defaultValue: 10,
        min: 1,
        max: 50,
        step: 1,
        unit: "px",
    },
    gapLength: {
        type: ControlType.Number,
        title: "Gap Length",
        defaultValue: 11,
        min: 1,
        max: 50,
        step: 1,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "s",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 2,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#999999",
    },
    strokeLinecap: {
        type: ControlType.Enum,
        title: "Line Cap",
        options: ["butt", "round", "square"],
        optionTitles: ["Butt", "Round", "Square"],
        defaultValue: "round",
    },
    borderRadius: {
        title: "Border Radius",
        type: ControlType.BorderRadius,
        defaultValue: "10px",
        hidden: (props) => props.variant === "line",
    },
    hoverLineColor: {
        type: ControlType.Color,
        title: "Hover Line",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.variant === "line",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0A",
        hidden: (props) => props.variant === "line",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "#0A0A0A",
        hidden: (props) => props.variant === "line",
    },
    solidOnHover: {
        type: ControlType.Boolean,
        title: "Solid on Hover",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => props.variant === "line",
    },
    run: {
        type: ControlType.Boolean,
        title: "Run",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
    },
})
