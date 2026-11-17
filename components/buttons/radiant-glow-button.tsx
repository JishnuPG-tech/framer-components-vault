// Button component with animated glowing border that moves around the perimeter
import { useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useTransform,
    useMotionTemplate,
} from "framer-motion"
import React from "react"

/**
 * Button Effect
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
function ButtonEffect(props) {
    const {
        content,
        buttonColor,
        contentColor,
        borderColor,
        lightColor,
        borderRadius,
        duration,
        borderWidth,
        style,
        font,
        link,
        glowBlur,
        padding,
    } = props

    const isStatic = useIsStaticRenderer()
    const pathRef = useRef(null)
    const progress = useMotionValue(0)

    useAnimationFrame((time) => {
        if (isStatic) return
        const length = pathRef.current?.getTotalLength()
        if (length && duration > 0) {
            const pxPerMillisecond = length / duration
            progress.set((time * pxPerMillisecond) % length)
        }
    })

    const x = useTransform(
        progress,
        (val) => pathRef.current?.getPointAtLength(val).x
    )
    const y = useTransform(
        progress,
        (val) => pathRef.current?.getPointAtLength(val).y
    )

    const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`

    // Calculate border radius for SVG rect
    const getBorderRadiusValue = () => {
        if (typeof borderRadius === "object") {
            // FusedNumber returns object with topLeft, topRight, bottomRight, bottomLeft
            const avg = (
                (parseFloat(borderRadius.topLeft) || 0) +
                (parseFloat(borderRadius.topRight) || 0) +
                (parseFloat(borderRadius.bottomRight) || 0) +
                (parseFloat(borderRadius.bottomLeft) || 0)
            ) / 4
            return avg
        }
        return typeof borderRadius === "string" ? parseFloat(borderRadius) : borderRadius
    }

    const radiusValue = getBorderRadiusValue()
    const radiusPercent = Math.min((radiusValue / 100) * 100, 50) + "%"

    // Helper to get border radius CSS string
    const getBorderRadiusCSS = () => {
        if (typeof borderRadius === "object") {
            return `${parseFloat(borderRadius.topLeft) || 0}px ${parseFloat(borderRadius.topRight) || 0}px ${parseFloat(borderRadius.bottomRight) || 0}px ${parseFloat(borderRadius.bottomLeft) || 0}px`
        }
        return typeof borderRadius === "string" ? borderRadius : `${borderRadius}px`
    }

    // Helper to apply individual corner radii
    const getBorderRadiusStyle = () => {
        if (typeof borderRadius === "object" && borderRadius !== null) {
            return {
                borderTopLeftRadius: `${borderRadius.topLeft || 0}px`,
                borderTopRightRadius: `${borderRadius.topRight || 0}px`,
                borderBottomRightRadius: `${borderRadius.bottomRight || 0}px`,
                borderBottomLeftRadius: `${borderRadius.bottomLeft || 0}px`,
            }
        }
        return {
            borderRadius: typeof borderRadius === "string" ? borderRadius : `${borderRadius}px`,
        }
    }

    const buttonStyle: React.CSSProperties = {
        ...style,
        position: "relative",
        overflow: "hidden",
        background: "transparent",
        padding: borderWidth,
        color: contentColor,
        cursor: "pointer",
        outline: "none",
        border: "none",
        display: "inline-flex",
        ...(typeof borderRadius === "object"
            ? {
                borderTopLeftRadius: `${parseFloat(borderRadius.topLeft) || 0}px`,
                borderTopRightRadius: `${parseFloat(borderRadius.topRight) || 0}px`,
                borderBottomRightRadius: `${parseFloat(borderRadius.bottomRight) || 0}px`,
                borderBottomLeftRadius: `${parseFloat(borderRadius.bottomLeft) || 0}px`,
            }
            : {
                borderRadius: typeof borderRadius === "string" ? borderRadius : `${borderRadius}px`,
            }),
        ...getBorderRadiusStyle(),
    }

    const innerContainerStyle: React.CSSProperties = {
        position: "relative" as const,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `${borderWidth}px solid ${borderColor}`,
        background: buttonColor,
        borderRadius: typeof borderRadius === "object"
            ? `${(parseFloat(borderRadius.topLeft) || 0) * 0.96}px ${(parseFloat(borderRadius.topRight) || 0) * 0.96}px ${(parseFloat(borderRadius.bottomRight) || 0) * 0.96}px ${(parseFloat(borderRadius.bottomLeft) || 0) * 0.96}px`
            : `calc(${typeof borderRadius === "string" ? borderRadius : borderRadius + "px"} * 0.96)`,
        paddingTop: padding?.top ?? 12,
        paddingRight: padding?.right ?? 24,
        paddingBottom: padding?.bottom ?? 12,
        paddingLeft: padding?.left ?? 24,
        ...font,
    }

    const glowContainerStyle: React.CSSProperties = {
        position: "absolute" as const,
        inset: borderWidth,
        borderRadius: typeof borderRadius === "object"
            ? `${(parseFloat(borderRadius.topLeft) || 0) * 0.96}px ${(parseFloat(borderRadius.topRight) || 0) * 0.96}px ${(parseFloat(borderRadius.bottomRight) || 0) * 0.96}px ${(parseFloat(borderRadius.bottomLeft) || 0) * 0.96}px`
            : `calc(${typeof borderRadius === "string" ? borderRadius : borderRadius + "px"} * 0.96)`,
        pointerEvents: "none" as const,
    }

    const renderContent = () => (
        <>
            {!isStatic && (
                <div style={glowContainerStyle}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                        }}
                        width="100%"
                        height="100%"
                    >
                        <rect
                            ref={pathRef}
                            fill="none"
                            x={0}
                            y={0}
                            width="100%"
                            height="100%"
                            rx={radiusValue}
                            ry={radiusValue}
                        />
                    </svg>
                    <motion.div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            display: "inline-block",
                            transform,
                        }}
                    >
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                background: `radial-gradient(${lightColor} 40%, transparent 60%)`,
                                opacity: 0.8,
                                filter: `blur(${glowBlur}px)`,
                            }}
                        />
                    </motion.div>
                </div>
            )}
            <div style={innerContainerStyle}>
                {content}
            </div>
        </>
    )

    return link ? (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                ...buttonStyle,
                textDecoration: "none",
            }}
            aria-label={content}
        >
            {renderContent()}
        </a>
    ) : (
        <button
            style={buttonStyle}
            aria-label={content}
        >
            {renderContent()}
        </button>
    )
}

addPropertyControls(ButtonEffect, {
    content: {
        type: ControlType.String,
        title: "Content",
        defaultValue: "Button",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#0F172A",
    },
    contentColor: {
        type: ControlType.Color,
        title: "Content Color",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#334155",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 1,
        max: 12,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.FusedNumber,
        title: "Radius",
        defaultValue: 12,
        toggleKey: "isMixed",
        toggleTitles: ["All", "Individual"],
        valueKeys: ["topLeft", "topRight", "bottomRight", "bottomLeft"],
        valueLabels: ["TL", "TR", "BR", "BL"],
        min: 0,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "12px 24px 12px 24px",
    },
    lightColor: {
        type: ControlType.Color,
        title: "Light Color",
        defaultValue: "#0ea5e9",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 3000,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
    },
})

export default ButtonEffect
