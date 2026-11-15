/**
 * Sparkle Button
 *
 * Interactive button featuring dynamic radial burst sparkles on hover and focus.
 *
 * Made by Karim Saif
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

import React, { useState, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export interface SparkleButtonProps {
    text: string
    link?: any
    font: any
    textColor: string
    buttonBg: string
    hoverBg: string
    sparkleColor: string
    borderRadius: number
    paddingHorizontal: number
    paddingVertical: number
    hoverScale: number
    animationSpeed: number
    burstCount: number
    burstDistance: number
    burstLength: number
    burstThickness: number
}

export default function SparkleButton(props: SparkleButtonProps) {
    const {
        text,
        link,
        font,
        textColor,
        buttonBg,
        hoverBg,
        sparkleColor,
        borderRadius,
        paddingHorizontal,
        paddingVertical,
        hoverScale,
        animationSpeed,
        burstCount,
        burstDistance,
        burstLength,
        burstThickness,
    } = props

    // Check Framer static rendering context (Canvas / SSG Export)
    const isStatic = useIsStaticRenderer()

    const [isHovered, setIsHovered] = useState(false)

    // Safely parse Framer Link Control
    const href = typeof link === "string" ? link : link?.href || "#"
    const target = typeof link === "object" && link?.target ? "_blank" : "_self"
    const rel = target === "_blank" ? "noopener noreferrer" : undefined

    // Mathematical Sparkle Ray Calculations
    const sparkles = useMemo(() => {
        const count = Math.max(1, burstCount || 8)
        return Array.from({ length: count }).map((_, i) => {
            const angle = (360 / count) * i
            const rad = (angle * Math.PI) / 180
            // Position around center boundary
            const x = 50 + 50 * Math.cos(rad)
            const y = 50 + 50 * Math.sin(rad)
            return { angle, left: `${x}%`, top: `${y}%` }
        })
    }, [burstCount])

    // --- 1. STATIC CANVAS PREVIEW (NO STATE, NO LISTENERS, NO SPARKLES) ---
    if (isStatic) {
        return (
            <div
                style={{
                    display: "inline-flex",
                    minWidth: "fit-content",
                }}
            >
                <a
                    aria-label={text}
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        borderRadius: `${borderRadius}px`,
                        backgroundColor: buttonBg,
                        padding: `${paddingVertical}px ${paddingHorizontal}px`,
                        color: textColor,
                        userSelect: "none",
                        pointerEvents: "none",
                        ...font,
                    }}
                >
                    <span style={{ whiteSpace: "nowrap", lineHeight: 1.2 }}>
                        {text}
                    </span>
                </a>
            </div>
        )
    }

    // --- 2. INTERACTIVE LIVE RENDER BRANCH ---
    return (
        <div
            style={{
                position: "relative",
                display: "inline-flex",
                minWidth: "fit-content",
            }}
        >
            <a
                href={href}
                target={target}
                rel={rel}
                aria-label={text}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    cursor: "pointer",
                    borderRadius: `${borderRadius}px`,
                    backgroundColor: isHovered && hoverBg ? hoverBg : buttonBg,
                    padding: `${paddingVertical}px ${paddingHorizontal}px`,
                    transition: `background-color ${animationSpeed}s ease, transform ${animationSpeed}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                    transform: isHovered ? `scale(${hoverScale})` : "scale(1)",
                    willChange: "transform",
                    zIndex: 2,
                    outline: "none",
                }}
            >
                <span
                    style={{
                        color: textColor,
                        whiteSpace: "nowrap",
                        userSelect: "none",
                        lineHeight: 1.2,
                        ...font,
                    }}
                >
                    {text}
                </span>
            </a>

            {/* Sparkle Burst Rays Container */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            >
                {sparkles.map((spark, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            top: spark.top,
                            left: spark.left,
                            width: `${burstLength}px`,
                            height: `${burstThickness}px`,
                            borderRadius: `${burstThickness}px`,
                            backgroundColor: sparkleColor,
                            transformOrigin: "center",
                            transform: isHovered
                                ? `translate(-50%, -50%) rotate(${spark.angle}deg) translateX(${burstDistance}px) scale(1)`
                                : `translate(-50%, -50%) rotate(${spark.angle}deg) translateX(0px) scale(0)`,
                            opacity: isHovered ? 1 : 0,
                            transition: `transform ${animationSpeed}s cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${animationSpeed * 0.75}s ease`,
                            transitionDelay: isHovered
                                ? `${index * 0.015}s`
                                : "0s",
                            willChange: "transform, opacity",
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

// Default Property Values
SparkleButton.defaultProps = {
    text: "Button",
    font: {
        fontFamily: "Inter, sans-serif",
        fontWeight: "600",
        fontSize: "18px",
    },
    textColor: "#000000",
    buttonBg: "#FFE81A",
    hoverBg: "#FFE81A",
    sparkleColor: "#000000",
    borderRadius: 999,
    paddingHorizontal: 36,
    paddingVertical: 14,
    hoverScale: 1.03,
    animationSpeed: 0.25,
    burstCount: 8,
    burstDistance: 12,
    burstLength: 8,
    burstThickness: 2.5,
}

// Framer Controls Panel Configuration
addPropertyControls(SparkleButton, {
    // ▶ Content Group
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Button",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },

    // ▶ Typography Group
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter, sans-serif",
            fontWeight: "600",
            fontSize: "18px",
        },
    },

    // ▶ Colors Group
    buttonBg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFE81A",
    },
    hoverBg: {
        type: ControlType.Color,
        title: "Hover Bg",
        defaultValue: "#FFE81A",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    sparkleColor: {
        type: ControlType.Color,
        title: "Burst Color",
        defaultValue: "#000000",
    },

    // ▶ Layout Group
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
    },
    paddingHorizontal: {
        type: ControlType.Number,
        title: "Padding H",
        defaultValue: 36,
        min: 8,
        max: 100,
    },
    paddingVertical: {
        type: ControlType.Number,
        title: "Padding V",
        defaultValue: 14,
        min: 4,
        max: 50,
    },

    // ▶ Animation Group
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.03,
        min: 0.9,
        max: 1.3,
        step: 0.01,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed (s)",
        defaultValue: 0.25,
        min: 0.05,
        max: 1.0,
        step: 0.05,
    },

    // ▶ Sparkles Group
    burstCount: {
        type: ControlType.Number,
        title: "Burst Count",
        defaultValue: 8,
        min: 3,
        max: 24,
        step: 1,
    },
    burstDistance: {
        type: ControlType.Number,
        title: "Distance",
        defaultValue: 12,
        min: 2,
        max: 40,
        step: 1,
    },
    burstLength: {
        type: ControlType.Number,
        title: "Ray Length",
        defaultValue: 8,
        min: 2,
        max: 30,
        step: 1,
    },
    burstThickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 2.5,
        min: 1,
        max: 10,
        step: 0.5,
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
