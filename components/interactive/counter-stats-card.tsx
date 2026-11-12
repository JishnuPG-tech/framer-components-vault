// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"
import { useInView } from "framer-motion"
import { useState, useEffect, useRef } from "react"

interface ResponsiveImage {
    src: string
    srcSet?: string
    alt?: string
}

interface StatsProps {
    label: string
    number: string
    description: string
    labelColor: string
    numberColor: string
    descriptionColor: string
    backgroundType: "solid" | "gradient" | "image"
    backgroundColor: string
    backgroundImage: ResponsiveImage
    gradientStart: string
    gradientEnd: string
    gradientAngle: number
    glowColor: string
    glowIntensity: number
    enableGlow: boolean
    borderRadius: string
    padding: string
    labelFont: any
    numberFont: any
    descriptionFont: any
    leftDecoration: ResponsiveImage
    rightDecoration: ResponsiveImage
    decorationSize: number
    showLeftDecoration: boolean
    showRightDecoration: boolean
    leftDecorationPaddingTop: number
    leftDecorationPaddingLeft: number
    rightDecorationPaddingBottom: number
    rightDecorationPaddingRight: number
    decorationGap: number
    cornerGlowColor: string
    showCornerDecorations: boolean
    animateNumber: boolean
    animationDuration: number
    style?: CSSProperties
}

/**
 * Counter Stats Card
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CounterStatsCard(props: StatsProps) {
    const {
        label = "Effort Reduction",
        number = "95%",
        description = "Automate manual tasks and focus on building better applications.",
        labelColor = "#FFFFFF",
        numberColor = "#FFFFFF",
        descriptionColor = "rgba(255, 255, 255, 0.7)",
        backgroundType = "gradient",
        backgroundColor = "#0a0f0c",
        backgroundImage = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Background" },
        gradientStart = "#0d1f18",
        gradientEnd = "#050a08",
        gradientAngle = 145,
        glowColor = "#2d5a3d",
        glowIntensity = 0.4,
        enableGlow = true,
        borderRadius = "20px",
        padding = "40px",
        labelFont,
        numberFont,
        descriptionFont,
        leftDecoration,
        rightDecoration,
        decorationSize = 70,
        showLeftDecoration = true,
        showRightDecoration = true,
        leftDecorationPaddingTop = 0,
        leftDecorationPaddingLeft = 0,
        rightDecorationPaddingBottom = 0,
        rightDecorationPaddingRight = 0,
        decorationGap = 8,
        cornerGlowColor = "#4ade80",
        showCornerDecorations = true,
        animateNumber = true,
        animationDuration = 2,
    } = props

    // Parse number to extract numeric value and suffix
    const parseNumber = (value: string): { numericValue: number; suffix: string; prefix: string; decimals: number; isRange: boolean } => {
        // Check if it's a range (contains dash between numbers)
        if (/\d+\s*-\s*\d+/.test(value)) {
            return { numericValue: 0, prefix: "", suffix: value, decimals: 0, isRange: true }
        }
        
        const match = value.match(/^([^\d-]*)(-?[\d.,]+)([^\d]*)$/)
        if (match) {
            const numericStr = match[2].replace(/,/g, "")
            const numericValue = parseFloat(numericStr)
            const decimals = numericStr.includes(".") ? numericStr.split(".")[1].length : 0
            return {
                numericValue: isNaN(numericValue) ? 0 : numericValue,
                prefix: match[1] || "",
                suffix: match[3] || "",
                decimals,
                isRange: false
            }
        }
        return { numericValue: 0, prefix: "", suffix: value, decimals: 0, isRange: false }
    }

    const { numericValue, prefix, suffix, decimals, isRange } = parseNumber(number)
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.3 })
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const shouldAnimate = animateNumber && !isCanvas
    const [displayValue, setDisplayValue] = useState(shouldAnimate ? 0 : numericValue)

    // Counter animation
    useEffect(() => {
        if (!shouldAnimate || isRange) {
            setDisplayValue(numericValue)
            return
        }

        if (!isInView) {
            setDisplayValue(0)
            return
        }

        let startTime: number
        let animationFrame: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / (animationDuration * 1000), 1)
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const currentValue = numericValue * easeOut
            
            setDisplayValue(currentValue)

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate)
            }
        }

        animationFrame = requestAnimationFrame(animate)

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame)
            }
        }
    }, [isInView, numericValue, animationDuration, shouldAnimate, isRange])

    // Format the displayed number
    const formatNumber = (value: number): string => {
        if (decimals > 0) {
            return value.toFixed(decimals)
        }
        return Math.round(value).toString()
    }

    const animatedNumber = isRange 
        ? number
        : shouldAnimate 
            ? `${prefix}${formatNumber(displayValue)}${suffix}`
            : number

    const getBackgroundStyle = () => {
        if (backgroundType === "gradient") {
            return {
                background: `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`,
            }
        }
        if (backgroundType === "image") {
            const imgSrc = backgroundImage?.src
            if (imgSrc) {
                return {
                    backgroundImage: `url("${imgSrc}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }
            }
            // Fallback to solid color if no image
            return {
                background: backgroundColor,
            }
        }
        return {
            background: backgroundColor,
        }
    }

    const backgroundStyle = getBackgroundStyle()

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                ...backgroundStyle,
                borderRadius: borderRadius,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                boxShadow: enableGlow ? `
                    inset 0 1px 1px rgba(255, 255, 255, 0.05),
                    inset 0 -1px 1px rgba(0, 0, 0, 0.3),
                    0 20px 60px rgba(0, 0, 0, 0.5),
                    0 0 ${60 * glowIntensity}px ${glowColor},
                    0 0 ${120 * glowIntensity}px ${glowColor}
                ` : `
                    inset 0 1px 1px rgba(255, 255, 255, 0.05),
                    inset 0 -1px 1px rgba(0, 0, 0, 0.3),
                    0 20px 60px rgba(0, 0, 0, 0.5)
                `,
            }}
        >
            {/* Vignette Overlay */}
            {enableGlow && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: borderRadius,
                        background: `
                            radial-gradient(ellipse at 30% 20%, ${glowColor}${Math.round(glowIntensity * 255 * 0.3).toString(16).padStart(2, '0')} 0%, transparent 50%),
                            radial-gradient(ellipse at 70% 80%, ${glowColor}${Math.round(glowIntensity * 255 * 0.2).toString(16).padStart(2, '0')} 0%, transparent 40%),
                            radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)
                        `,
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            )}

            {/* Corner Decorations - Now Inside */}
            {showCornerDecorations && (
                <>
                    {/* Organic blob - bottom left */}
                    <div
                        style={{
                            position: "absolute",
                            left: -20,
                            bottom: -20,
                            width: 100,
                            height: 100,
                            background: `radial-gradient(circle at 30% 30%, ${cornerGlowColor}, transparent 70%)`,
                            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
                            filter: "blur(20px)",
                            opacity: 0.5,
                            zIndex: 1,
                        }}
                    />
                    {/* Geometric pattern - top right */}
                    <div
                        style={{
                            position: "absolute",
                            right: -15,
                            top: -15,
                            width: 80,
                            height: 80,
                            background: `
                                linear-gradient(45deg, transparent 45%, ${cornerGlowColor}30 45%, ${cornerGlowColor}30 55%, transparent 55%),
                                linear-gradient(-45deg, transparent 45%, ${cornerGlowColor}20 45%, ${cornerGlowColor}20 55%, transparent 55%)
                            `,
                            backgroundSize: "12px 12px",
                            filter: "blur(1px)",
                            opacity: 0.4,
                            zIndex: 1,
                            transform: "rotate(15deg)",
                        }}
                    />
                    {/* Glow spot top right */}
                    <div
                        style={{
                            position: "absolute",
                            right: 10,
                            top: 10,
                            width: 50,
                            height: 50,
                            background: `radial-gradient(circle, ${cornerGlowColor}35 0%, transparent 70%)`,
                            filter: "blur(12px)",
                            zIndex: 1,
                        }}
                    />
                    {/* Soft glow bottom left */}
                    <div
                        style={{
                            position: "absolute",
                            left: 20,
                            bottom: 20,
                            width: 40,
                            height: 40,
                            background: `radial-gradient(circle, ${cornerGlowColor}25 0%, transparent 70%)`,
                            filter: "blur(10px)",
                            zIndex: 1,
                        }}
                    />
                </>
            )}

            {/* Left Decoration */}
            {showLeftDecoration && leftDecoration?.src && (
                <div
                    style={{
                        position: "absolute",
                        left: decorationGap,
                        top: decorationGap,
                        zIndex: 2,
                    }}
                >
                    <img
                        src={leftDecoration.src}
                        srcSet={leftDecoration.srcSet}
                        alt={leftDecoration.alt || ""}
                        style={{
                            width: decorationSize,
                            height: "auto",
                            objectFit: "contain",
                            pointerEvents: "none",
                            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                        }}
                    />
                </div>
            )}

            {/* Right Decoration */}
            {showRightDecoration && rightDecoration?.src && (
                <div
                    style={{
                        position: "absolute",
                        right: decorationGap,
                        bottom: decorationGap,
                        zIndex: 2,
                    }}
                >
                    <img
                        src={rightDecoration.src}
                        srcSet={rightDecoration.srcSet}
                        alt={rightDecoration.alt || ""}
                        style={{
                            width: decorationSize,
                            height: "auto",
                            objectFit: "contain",
                            pointerEvents: "none",
                            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                        }}
                    />
                </div>
            )}

            {/* Content Container with padding */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    width: "100%",
                    height: "100%",
                    padding: padding,
                    boxSizing: "border-box",
                    zIndex: 2,
                }}
            >
                <span
                    style={{
                        color: numberColor,
                        fontSize: numberFont?.fontSize || "56px",
                        fontWeight: numberFont?.fontWeight || 700,
                        fontFamily: numberFont?.fontFamily,
                        letterSpacing: numberFont?.letterSpacing || "-0.03em",
                        lineHeight: numberFont?.lineHeight || "1em",
                        textAlign: "center",
                        textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                    }}
                >
                    {animatedNumber}
                </span>
                <span
                    style={{
                        color: labelColor,
                        fontSize: labelFont?.fontSize || "16px",
                        fontWeight: labelFont?.fontWeight || 600,
                        fontFamily: labelFont?.fontFamily,
                        letterSpacing: labelFont?.letterSpacing || "0.05em",
                        lineHeight: labelFont?.lineHeight || "1.3em",
                        textAlign: "center",
                        opacity: 0.95,
                        whiteSpace: "nowrap",
                        padding: "0 8px",
                    }}
                >
                    {label}
                </span>
                <span
                    style={{
                        color: descriptionColor,
                        fontSize: descriptionFont?.fontSize || "13px",
                        fontWeight: descriptionFont?.fontWeight || 400,
                        fontFamily: descriptionFont?.fontFamily,
                        letterSpacing: descriptionFont?.letterSpacing || "0em",
                        lineHeight: descriptionFont?.lineHeight || "1.6em",
                        textAlign: "center",
                        maxWidth: "260px",
                    }}
                >
                    {description}
                </span>
            </div>
        </div>
    )
}

addPropertyControls(CounterStatsCard, {
    // Content Group
    number: {
        type: ControlType.String,
        title: "Number",
        defaultValue: "95%",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Effort Reduction",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Automate manual tasks and focus on building better applications.",
        displayTextArea: true,
    },
    // Animation Group
    animateNumber: {
        type: ControlType.Boolean,
        title: "Animate Number",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.5,
        unit: "s",
        hidden: ({ animateNumber }) => !animateNumber,
    },
    // Background Group
    backgroundType: {
        type: ControlType.Enum,
        title: "Background Type",
        options: ["solid", "gradient", "image"],
        optionTitles: ["Solid", "Gradient", "Image"],
        defaultValue: "gradient",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#0a0f0c",
        hidden: ({ backgroundType }) => backgroundType !== "solid",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background Image",
        hidden: ({ backgroundType }) => backgroundType !== "image",
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "#0d1f18",
        hidden: ({ backgroundType }) => backgroundType !== "gradient",
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#050a08",
        hidden: ({ backgroundType }) => backgroundType !== "gradient",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 145,
        min: 0,
        max: 360,
        step: 1,
        unit: "deg",
        hidden: ({ backgroundType }) => backgroundType !== "gradient",
    },
    // Glow Effects Group
    enableGlow: {
        type: ControlType.Boolean,
        title: "Card Glow",
        description: "Adds outer glow and vignette overlay to the card",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#2d5a3d",
        hidden: ({ enableGlow }) => !enableGlow,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ enableGlow }) => !enableGlow,
    },
    // Corner Decorations Group
    showCornerDecorations: {
        type: ControlType.Boolean,
        title: "Corner Accents",
        description: "Abstract decorative elements in corners (blobs, patterns, glows)",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cornerGlowColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#4ade80",
        hidden: ({ showCornerDecorations }) => !showCornerDecorations,
    },
    // Side Decorations Group
    showLeftDecoration: {
        type: ControlType.Boolean,
        title: "Left Decoration",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    leftDecoration: {
        type: ControlType.ResponsiveImage,
        title: "Left Image",
        hidden: ({ showLeftDecoration }) => !showLeftDecoration,
    },
    showRightDecoration: {
        type: ControlType.Boolean,
        title: "Right Decoration",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    rightDecoration: {
        type: ControlType.ResponsiveImage,
        title: "Right Image",
        hidden: ({ showRightDecoration }) => !showRightDecoration,
    },
    decorationSize: {
        type: ControlType.Number,
        title: "Decoration Size",
        defaultValue: 70,
        min: 20,
        max: 200,
        step: 4,
        unit: "px",
    },
    decorationGap: {
        type: ControlType.Number,
        title: "Decoration Gap",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 2,
        unit: "px",
    },
    // Text Colors Group
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#FFFFFF",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#FFFFFF",
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description Color",
        defaultValue: "rgba(255, 255, 255, 0.65)",
    },
    // Typography Group
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "56px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "0.05em",
            lineHeight: "1.3em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.6em",
        },
    },
    // Layout Group
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "40px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Border Radius",
        defaultValue: "20px",
    },
})
