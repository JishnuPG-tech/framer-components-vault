// Paper background component with light and dark versions and customizable properties
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, type CSSProperties } from "react"

interface PaperBackgroundProps {
    paperType: "lined" | "grid" | "dotted" | "blank" | "wavy"
    lineColor: string
    lineSpacing: number
    lineWidth: number
    opacity: number
    paperTexture: boolean
    textureStyle: "vintage" | "modern" | "rough" | "smooth"
    textureIntensity: number
    background: string
    shadow: boolean
    noise: boolean
    noiseIntensity: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PaperBackground(props: PaperBackgroundProps) {
    const {
        paperType = "lined",
        lineColor = "#d0d0d0",
        lineSpacing = 24,
        lineWidth = 1,
        opacity = 0.3,
        paperTexture = true,
        textureStyle = "vintage",
        textureIntensity = 30,
        background = "#ffffff",
        shadow = false,
        noise = false,
        noiseIntensity = 25,
    } = props

    const patternId = `paper-pattern-${paperType}-${Math.random().toString(36).substr(2, 9)}`
    const noiseId = `noise-${Math.random().toString(36).substr(2, 9)}`

    const renderPattern = () => {
        switch (paperType) {
            case "lined":
                return (
                    <defs>
                        <pattern
                            id={patternId}
                            x="0"
                            y="0"
                            width="100%"
                            height={lineSpacing}
                            patternUnits="userSpaceOnUse"
                        >
                            <line
                                x1="0"
                                y1={lineSpacing}
                                x2="100%"
                                y2={lineSpacing}
                                stroke={lineColor}
                                strokeWidth={lineWidth}
                                opacity={opacity}
                            />
                        </pattern>
                    </defs>
                )
            case "grid":
                return (
                    <defs>
                        <pattern
                            id={patternId}
                            x="0"
                            y="0"
                            width={lineSpacing}
                            height={lineSpacing}
                            patternUnits="userSpaceOnUse"
                        >
                            <line
                                x1="0"
                                y1={lineSpacing}
                                x2={lineSpacing}
                                y2={lineSpacing}
                                stroke={lineColor}
                                strokeWidth={lineWidth}
                                opacity={opacity}
                            />
                            <line
                                x1={lineSpacing}
                                y1="0"
                                x2={lineSpacing}
                                y2={lineSpacing}
                                stroke={lineColor}
                                strokeWidth={lineWidth}
                                opacity={opacity}
                            />
                        </pattern>
                    </defs>
                )
            case "dotted":
                return (
                    <defs>
                        <pattern
                            id={patternId}
                            x="0"
                            y="0"
                            width={lineSpacing}
                            height={lineSpacing}
                            patternUnits="userSpaceOnUse"
                        >
                            <circle
                                cx={lineSpacing / 2}
                                cy={lineSpacing / 2}
                                r={lineWidth}
                                fill={lineColor}
                                opacity={opacity}
                            />
                        </pattern>
                    </defs>
                )
            case "wavy":
                return (
                    <defs>
                        <pattern
                            id={patternId}
                            x="0"
                            y="0"
                            width="100"
                            height={lineSpacing}
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d={`M 0,${lineSpacing / 2} Q 25,${lineSpacing / 2 - 8} 50,${lineSpacing / 2} T 100,${lineSpacing / 2}`}
                                fill="none"
                                stroke={lineColor}
                                strokeWidth={lineWidth}
                                opacity={opacity}
                            />
                        </pattern>
                    </defs>
                )
            default:
                return null
        }
    }

    // Create paper texture using CSS filters and pseudo-elements
    const textureStyles = useMemo(() => {
        if (!paperTexture) return {}
        
        const intensity = textureIntensity / 100
        
        switch (textureStyle) {
            case "vintage":
                return {
                    filter: `
                        contrast(${1 + intensity * 0.4}) 
                        brightness(${1 - intensity * 0.2}) 
                        saturate(${1 - intensity * 0.25})
                        sepia(${intensity * 0.35})
                        hue-rotate(${intensity * 15}deg)
                    `,
                    backgroundImage: `
                        radial-gradient(ellipse at 20% 30%, rgba(139, 69, 19, ${intensity * 0.25}) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 70%, rgba(160, 82, 45, ${intensity * 0.22}) 0%, transparent 55%),
                        radial-gradient(ellipse at 40% 80%, rgba(210, 180, 140, ${intensity * 0.18}) 0%, transparent 45%),
                        radial-gradient(ellipse at 70% 20%, rgba(222, 184, 135, ${intensity * 0.2}) 0%, transparent 50%),
                        radial-gradient(ellipse at 10% 60%, rgba(205, 133, 63, ${intensity * 0.15}) 0%, transparent 40%),
                        linear-gradient(45deg, rgba(139, 69, 19, ${intensity * 0.08}) 0%, transparent 30%, rgba(160, 82, 45, ${intensity * 0.06}) 70%),
                        linear-gradient(-30deg, rgba(222, 184, 135, ${intensity * 0.1}) 0%, transparent 40%)
                    `,
                }
            case "modern":
                return {
                    filter: `
                        contrast(${1 + intensity * 0.15}) 
                        brightness(${1 - intensity * 0.08})
                        saturate(${1 + intensity * 0.1})
                    `,
                    backgroundImage: `
                        linear-gradient(45deg, rgba(0, 0, 0, ${intensity * 0.04}) 25%, transparent 25%),
                        linear-gradient(-45deg, rgba(0, 0, 0, ${intensity * 0.04}) 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, ${intensity * 0.04}) 75%),
                        linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, ${intensity * 0.04}) 75%),
                        radial-gradient(circle at 25% 25%, rgba(100, 100, 100, ${intensity * 0.06}) 0%, transparent 50%),
                        radial-gradient(circle at 75% 75%, rgba(120, 120, 120, ${intensity * 0.05}) 0%, transparent 45%)
                    `,
                    backgroundSize: "3px 3px, 3px 3px, 3px 3px, 3px 3px, 20px 20px, 25px 25px",
                    backgroundPosition: "0 0, 0 1.5px, 1.5px -1.5px, -1.5px 0px, 0 0, 10px 10px",
                }
            case "rough":
                return {
                    filter: `
                        contrast(${1 + intensity * 0.6}) 
                        brightness(${1 - intensity * 0.3})
                        blur(${intensity * 0.4}px)
                        saturate(${1 - intensity * 0.2})
                    `,
                    backgroundImage: `
                        radial-gradient(ellipse at 15% 85%, rgba(101, 67, 33, ${intensity * 0.3}) 0%, transparent 60%),
                        radial-gradient(ellipse at 85% 15%, rgba(139, 69, 19, ${intensity * 0.28}) 0%, transparent 65%),
                        radial-gradient(ellipse at 35% 45%, rgba(160, 82, 45, ${intensity * 0.25}) 0%, transparent 55%),
                        radial-gradient(ellipse at 65% 75%, rgba(205, 133, 63, ${intensity * 0.22}) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 20%, rgba(139, 69, 19, ${intensity * 0.2}) 0%, transparent 45%),
                        linear-gradient(30deg, rgba(101, 67, 33, ${intensity * 0.15}) 0%, transparent 40%, rgba(139, 69, 19, ${intensity * 0.12}) 80%),
                        linear-gradient(-60deg, rgba(160, 82, 45, ${intensity * 0.18}) 0%, transparent 35%)
                    `,
                }
            case "smooth":
                return {
                    filter: `
                        contrast(${1 + intensity * 0.08}) 
                        brightness(${1 - intensity * 0.04})
                        saturate(${1 + intensity * 0.05})
                    `,
                    backgroundImage: `
                        linear-gradient(0deg, rgba(0, 0, 0, ${intensity * 0.02}) 50%, transparent 50%),
                        linear-gradient(90deg, rgba(0, 0, 0, ${intensity * 0.02}) 50%, transparent 50%),
                        radial-gradient(circle at 30% 30%, rgba(200, 200, 200, ${intensity * 0.04}) 0%, transparent 40%),
                        radial-gradient(circle at 70% 70%, rgba(220, 220, 220, ${intensity * 0.03}) 0%, transparent 35%)
                    `,
                    backgroundSize: "1.5px 1.5px, 1.5px 1.5px, 15px 15px, 18px 18px",
                }
            default:
                return {}
        }
    }, [paperTexture, textureStyle, textureIntensity])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                boxSizing: "border-box",
                backgroundColor: background,
                boxShadow: shadow ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none",
                ...textureStyles,
                ...props.style,
            }}
        >
            {/* Noise overlay */}
            {noise && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: noiseIntensity / 100,
                        pointerEvents: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
                        mixBlendMode: "multiply",
                    }}
                />
            )}

            {/* Paper grain overlay */}
            {paperTexture && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: textureIntensity / 100 * 0.8,
                        backgroundImage: textureStyle === "vintage" ? `
                            repeating-linear-gradient(
                                0deg,
                                transparent,
                                transparent 0.8px,
                                rgba(139, 69, 19, 0.12) 0.8px,
                                rgba(139, 69, 19, 0.12) 1.6px
                            ),
                            repeating-linear-gradient(
                                90deg,
                                transparent,
                                transparent 0.8px,
                                rgba(160, 82, 45, 0.1) 0.8px,
                                rgba(160, 82, 45, 0.1) 1.6px
                            ),
                            repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 3px,
                                rgba(222, 184, 135, 0.08) 3px,
                                rgba(222, 184, 135, 0.08) 4px
                            )
                        ` : textureStyle === "rough" ? `
                            repeating-linear-gradient(
                                35deg,
                                transparent,
                                transparent 1.5px,
                                rgba(101, 67, 33, 0.15) 1.5px,
                                rgba(101, 67, 33, 0.15) 2.5px
                            ),
                            repeating-linear-gradient(
                                -55deg,
                                transparent,
                                transparent 2px,
                                rgba(139, 69, 19, 0.12) 2px,
                                rgba(139, 69, 19, 0.12) 3px
                            ),
                            repeating-linear-gradient(
                                80deg,
                                transparent,
                                transparent 4px,
                                rgba(160, 82, 45, 0.1) 4px,
                                rgba(160, 82, 45, 0.1) 5px
                            )
                        ` : textureStyle === "modern" ? `
                            repeating-linear-gradient(
                                0deg,
                                transparent,
                                transparent 0.5px,
                                rgba(0, 0, 0, 0.08) 0.5px,
                                rgba(0, 0, 0, 0.08) 1px
                            ),
                            repeating-linear-gradient(
                                90deg,
                                transparent,
                                transparent 0.5px,
                                rgba(0, 0, 0, 0.06) 0.5px,
                                rgba(0, 0, 0, 0.06) 1px
                            )
                        ` : `
                            repeating-linear-gradient(
                                0deg,
                                transparent,
                                transparent 0.7px,
                                rgba(0, 0, 0, 0.06) 0.7px,
                                rgba(0, 0, 0, 0.06) 1.4px
                            ),
                            repeating-linear-gradient(
                                90deg,
                                transparent,
                                transparent 0.7px,
                                rgba(0, 0, 0, 0.04) 0.7px,
                                rgba(0, 0, 0, 0.04) 1.4px
                            )
                        `,
                        pointerEvents: "none",
                        mixBlendMode: textureStyle === "vintage" ? "multiply" : "normal",
                    }}
                />
            )}

            {/* Additional texture layer for more depth */}
            {paperTexture && textureIntensity > 40 && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: (textureIntensity - 40) / 100 * 0.6,
                        backgroundImage: textureStyle === "vintage" ? `
                            radial-gradient(circle at 10% 10%, rgba(139, 69, 19, 0.15) 0%, transparent 30%),
                            radial-gradient(circle at 90% 90%, rgba(160, 82, 45, 0.12) 0%, transparent 25%),
                            radial-gradient(circle at 30% 70%, rgba(205, 133, 63, 0.1) 0%, transparent 35%),
                            radial-gradient(circle at 70% 30%, rgba(222, 184, 135, 0.08) 0%, transparent 40%)
                        ` : textureStyle === "rough" ? `
                            radial-gradient(circle at 20% 20%, rgba(101, 67, 33, 0.2) 0%, transparent 40%),
                            radial-gradient(circle at 80% 80%, rgba(139, 69, 19, 0.18) 0%, transparent 35%),
                            radial-gradient(circle at 50% 10%, rgba(160, 82, 45, 0.15) 0%, transparent 30%)
                        ` : `
                            radial-gradient(circle at 25% 25%, rgba(0, 0, 0, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.03) 0%, transparent 45%)
                        `,
                        pointerEvents: "none",
                        mixBlendMode: "overlay",
                    }}
                />
            )}

            <svg
                width="100%"
                height="100%"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
            >
                {renderPattern()}
                {paperType !== "blank" && (
                    <rect
                        width="100%"
                        height="100%"
                        fill={`url(#${patternId})`}
                    />
                )}
            </svg>
        </div>
    )
}

addPropertyControls(PaperBackground, {
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    noise: {
        type: ControlType.Boolean,
        title: "Noise",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    noiseIntensity: {
        type: ControlType.Number,
        title: "Noise Intensity",
        defaultValue: 25,
        min: 5,
        max: 60,
        step: 5,
        unit: "%",
        hidden: ({ noise }) => !noise,
    },
    paperType: {
        type: ControlType.Enum,
        title: "Paper Type",
        options: ["lined", "grid", "dotted", "blank", "wavy"],
        optionTitles: ["Lined", "Grid", "Dotted", "Blank", "Wavy"],
        defaultValue: "lined",
        displaySegmentedControl: true,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#d0d0d0",
        hidden: ({ paperType }) => paperType === "blank",
    },
    lineSpacing: {
        type: ControlType.Number,
        title: "Line Spacing",
        defaultValue: 24,
        min: 8,
        max: 60,
        step: 2,
        unit: "px",
        hidden: ({ paperType }) => paperType === "blank",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 1,
        min: 0.5,
        max: 4,
        step: 0.5,
        unit: "px",
        hidden: ({ paperType }) => paperType === "blank",
    },
    opacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 0.3,
        min: 0.1,
        max: 1,
        step: 0.1,
        hidden: ({ paperType }) => paperType === "blank",
    },
    paperTexture: {
        type: ControlType.Boolean,
        title: "Paper Texture",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textureStyle: {
        type: ControlType.Enum,
        title: "Texture Style",
        options: ["vintage", "modern", "rough", "smooth"],
        optionTitles: ["Vintage", "Modern", "Rough", "Smooth"],
        defaultValue: "vintage",
        displaySegmentedControl: true,
        hidden: ({ paperTexture }) => !paperTexture,
    },
    textureIntensity: {
        type: ControlType.Number,
        title: "Texture Intensity",
        defaultValue: 30,
        min: 10,
        max: 80,
        step: 5,
        unit: "%",
        hidden: ({ paperTexture }) => !paperTexture,
    },
})