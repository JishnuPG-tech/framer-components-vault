// Animated scroll indicator with mouse-following dot that bounces when idle

import React from "react"
import { motion, useAnimationControls } from "framer-motion"
import { useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ScrollIndicatorProps {
    borderColor: string
    borderOpacity: number
    dotColor: string
    pillWidth: number
    pillHeight: number
    dotSize: number
    borderWidth: number
    borderRadius: number
    animationSpeed: number
    scrollType: "section" | "link"
    sectionName: string
    customLink: string
    animationPreset: "default" | "elegant-chevrons" | "minimalist-scroll"
    chevronColor: string
    chevronSize: number
    chevronGap: number
    minimalistColor: string
    minimalistFontSize: number
    minimalistSpeed: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ScrollIndicator(props: ScrollIndicatorProps) {
    const {
        borderColor,
        borderOpacity,
        dotColor,
        pillWidth,
        pillHeight,
        dotSize,
        borderWidth,
        borderRadius,
        animationSpeed,
        scrollType,
        sectionName,
        customLink,
        animationPreset,
        chevronColor,
        chevronSize,
        chevronGap,
        minimalistColor,
        minimalistFontSize,
        minimalistSpeed,
    } = props

    const controls = useAnimationControls()
    const elegantChevronControls = useAnimationControls()
    const elegantChevronGlowControls = useAnimationControls()
    const minimalistLabelControls = useAnimationControls()
    const minimalistLineControls = useAnimationControls()

    // Define animation presets
    const animationPresets = {
        default: {
            y: [-(pillHeight / 2 - dotSize - 4), pillHeight / 2 - dotSize - 4],
            transition: {
                duration: animationSpeed,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
            },
        },
        "elegant-chevrons": {
            y: [0, 0, 14, 14, 14, 14, 0],
            opacity: [0, 1, 1, 0.6, 0.85, 0, 0],
            transition: {
                duration: 1.8,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                times: [0, 0.167, 0.5, 0.583, 0.667, 0.833, 1],
            },
        },
        "elegant-chevrons-glow": {
            filter: [
                "drop-shadow(0 0 0px rgba(255,255,255,0))",
                "drop-shadow(0 0 2px rgba(255,255,255,0.35))",
                "drop-shadow(0 0 2px rgba(255,255,255,0.2))",
                "drop-shadow(0 0 4px rgba(255,255,255,0.4))",
                "drop-shadow(0 0 4px rgba(255,255,255,0.4))",
                "drop-shadow(0 0 0px rgba(255,255,255,0))",
                "drop-shadow(0 0 0px rgba(255,255,255,0))",
            ],
            transition: {
                duration: 1.8,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                times: [0, 0.167, 0.5, 0.583, 0.667, 0.833, 1],
            },
        },
        "minimalist-scroll": {
            label: {
                y: [0, 0, 6, 6, 6],
                opacity: [1, 1, 1, 0, 0],
                transition: {
                    duration: 2.5,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                    times: [0, 0.4, 0.6, 0.8, 1],
                },
            },
            line: {
                opacity: [1, 1, 1, 1, 0],
                transition: {
                    duration: 2.5,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeOut",
                    times: [0, 0.6, 0.8, 0.8, 1],
                },
            },
        },
    }

    useEffect(() => {
        if (animationPreset === "default") {
            controls.start(animationPresets.default)
        } else if (animationPreset === "elegant-chevrons") {
            elegantChevronControls.start(animationPresets["elegant-chevrons"])
            elegantChevronGlowControls.start(animationPresets["elegant-chevrons-glow"])
        } else if (animationPreset === "minimalist-scroll") {
            minimalistLabelControls.start(animationPresets["minimalist-scroll"].label)
            minimalistLineControls.start(animationPresets["minimalist-scroll"].line)
        }
    }, [
        controls,
        elegantChevronControls,
        elegantChevronGlowControls,
        minimalistLabelControls,
        minimalistLineControls,
        animationPreset,
        pillHeight,
        dotSize,
        animationSpeed,
    ])

    const handleClick = () => {
        if (scrollType === "section" && sectionName) {
            const element = document.getElementById(sectionName)
            if (element) {
                element.scrollIntoView({ behavior: "smooth" })
            }
        } else if (scrollType === "link" && customLink) {
            window.location.href = customLink
        }
    }

    const renderDoubleChevron = () => {
        // Map size (1-10) to scale values (0.5-1.4)
        const scaleMap = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4]
        const scale = scaleMap[chevronSize - 1] || 0.8
        
        // Map gap (1-10) to pixel values
        const gapMap = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
        const gap = gapMap[chevronGap - 1] || 5
        
        // Scale drift distance proportionally with size
        const driftDistance = 14 * (scale / 0.8)
        
        return (
            <div
                onClick={handleClick}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "pointer",
                }}
            >
                <motion.div
                    animate={{
                        ...animationPresets["elegant-chevrons-glow"],
                        filter: [
                            "drop-shadow(0 0 0px rgba(255,255,255,0))",
                            `drop-shadow(0 0 ${2 * scale}px rgba(255,255,255,0.35))`,
                            `drop-shadow(0 0 ${2 * scale}px rgba(255,255,255,0.2))`,
                            `drop-shadow(0 0 ${4 * scale}px rgba(255,255,255,0.4))`,
                            `drop-shadow(0 0 ${4 * scale}px rgba(255,255,255,0.4))`,
                            "drop-shadow(0 0 0px rgba(255,255,255,0))",
                            "drop-shadow(0 0 0px rgba(255,255,255,0))",
                        ],
                    }}
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: `${gap}px`,
                    }}
                >
                    {/* Upper chevron */}
                    <motion.svg
                        animate={{
                            y: [0, 0, driftDistance, driftDistance, driftDistance, driftDistance, 0],
                            opacity: [0, 1, 1, 0.6, 0.85, 0, 0],
                            transition: {
                                duration: 1.8,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeInOut",
                                times: [0, 0.167, 0.5, 0.583, 0.667, 0.833, 1],
                            },
                        }}
                        width={18 * scale}
                        height={9 * scale}
                        viewBox="0 0 18 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            position: "relative",
                        }}
                    >
                        <path
                            d="M1.5 1.5L9 7.5L16.5 1.5"
                            stroke={chevronColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.svg>
                    {/* Lower chevron */}
                    <motion.svg
                        animate={{
                            y: [0, 0, driftDistance, driftDistance, driftDistance, driftDistance, 0],
                            opacity: [0, 1, 1, 0.6, 0.85, 0, 0],
                            transition: {
                                duration: 1.8,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeInOut",
                                times: [0, 0.167, 0.5, 0.583, 0.667, 0.833, 1],
                            },
                        }}
                        width={18 * scale}
                        height={9 * scale}
                        viewBox="0 0 18 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            position: "relative",
                        }}
                    >
                        <path
                            d="M1.5 1.5L9 7.5L16.5 1.5"
                            stroke={chevronColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.svg>
                </motion.div>
            </div>
        )
    }

    const renderMinimalistScroll = () => {
        // Map font size (1-10) to pixel values
        const fontSizeMap = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20]
        const fontSize = fontSizeMap[minimalistFontSize - 1] || 10
        
        // Map speed (1-10) to duration values
        const speedMap = [4, 3.5, 3, 2.5, 2, 1.8, 1.5, 1.2, 1, 0.8]
        const duration = speedMap[minimalistSpeed - 1] || 2
        
        return (
            <div
                onClick={handleClick}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "pointer",
                }}
            >
                <motion.div
                    animate={{
                        y: [0, 0, 6, 6, 6],
                        opacity: [1, 1, 1, 0, 0],
                        transition: {
                            duration: duration,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut",
                            times: [0, 0.4, 0.6, 0.8, 1],
                        },
                    }}
                    style={{
                        fontSize: `${fontSize}px`,
                        fontWeight: "bold",
                        letterSpacing: "2px",
                        color: minimalistColor,
                        marginBottom: "8px",
                    }}
                >
                    SCROLL
                </motion.div>
                <motion.div
                    animate={{
                        opacity: [1, 1, 1, 1, 0],
                        transition: {
                            duration: duration,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeOut",
                            times: [0, 0.6, 0.8, 0.8, 1],
                        },
                    }}
                    style={{
                        width: "1px",
                        height: "20px",
                        backgroundColor: minimalistColor,
                    }}
                />
            </div>
        )
    }

    const renderDefault = () => (
        <div
            onClick={handleClick}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
            }}
        >
            <div
                style={{
                    width: pillWidth,
                    height: pillHeight,
                    border: `${borderWidth}px solid ${borderColor}`,
                    opacity: borderOpacity,
                    borderRadius: borderRadius,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <motion.div
                    animate={controls}
                    style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: "50%",
                        backgroundColor: dotColor,
                        position: "absolute",
                    }}
                />
            </div>
        </div>
    )

    // Render based on animation preset
    switch (animationPreset) {
        case "elegant-chevrons":
            return renderDoubleChevron()
        case "minimalist-scroll":
            return renderMinimalistScroll()
        default:
            return renderDefault()
    }
}

addPropertyControls(ScrollIndicator, {
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    borderOpacity: {
        type: ControlType.Number,
        title: "Border Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FFFFFF",
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    pillWidth: {
        type: ControlType.Number,
        title: "Pill Width",
        defaultValue: 24,
        min: 20,
        max: 60,
        step: 1,
        unit: "px",
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    pillHeight: {
        type: ControlType.Number,
        title: "Pill Height",
        defaultValue: 40,
        min: 30,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 6,
        min: 4,
        max: 12,
        step: 1,
        unit: "px",
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        unit: "px",
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: ({ animationPreset }) => animationPreset === "elegant-chevrons" || animationPreset === "minimalist-scroll",
    },
    scrollType: {
        type: ControlType.Enum,
        title: "Scroll Type",
        options: ["section", "link"],
        optionTitles: ["Section", "Link"],
        defaultValue: "section",
        displaySegmentedControl: true,
    },
    sectionName: {
        type: ControlType.String,
        title: "Section Name",
        defaultValue: "",
        placeholder: "Enter section ID...",
        hidden: ({ scrollType }) => scrollType !== "section",
    },
    customLink: {
        type: ControlType.String,
        title: "Custom Link",
        defaultValue: "",
        placeholder: "https://...",
        hidden: ({ scrollType }) => scrollType !== "link",
    },
    animationPreset: {
        type: ControlType.Enum,
        title: "Animation Preset",
        options: ["default", "elegant-chevrons", "minimalist-scroll"],
        optionTitles: [
            "Default Dot",
            "Elegant Chevrons",
            "Minimalist Scroll",
        ],
        defaultValue: "default",
    },
    chevronColor: {
        type: ControlType.Color,
        title: "Chevron Color",
        defaultValue: "#FFFFFF",
        hidden: ({ animationPreset }) => animationPreset !== "elegant-chevrons",
    },
    chevronSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ animationPreset }) => animationPreset !== "elegant-chevrons",
    },
    chevronGap: {
        type: ControlType.Number,
        title: "Chevron Spacing",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ animationPreset }) => animationPreset !== "elegant-chevrons",
    },
    minimalistColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
        hidden: ({ animationPreset }) => animationPreset !== "minimalist-scroll",
    },
    minimalistFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ animationPreset }) => animationPreset !== "minimalist-scroll",
    },
    minimalistSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: ({ animationPreset }) => animationPreset !== "minimalist-scroll",
    },
})
