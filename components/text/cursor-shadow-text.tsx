import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
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


/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

interface Props {
    text: string
    textColor: string
    shadowColors: string[]
    shadowColor1: string
    shadowColor2: string
    shadowColor3: string
    shadowColor4: string
    shadowColor5: string
    shadowCount: number
    shadowDistance: number
    sensitivity: number
    font: any
    shadowEffect: "solid" | "blur" | "noise" | "glow"
    blurAmount: number
    noiseIntensity: number
    glowIntensity: number
    style?: React.CSSProperties
}

export default function CursorShadowText(props: Props) {
    const {
        text,
        textColor,
        shadowColors = ["#1A237E", "#7E57C2", "#ff005e", "#ff9e00", "#00e5ff"],
        shadowColor1 = "#1A237E",
        shadowColor2 = "#7E57C2",
        shadowColor3 = "#ff005e",
        shadowColor4 = "#ff9e00",
        shadowColor5 = "#00e5ff",
        shadowCount,
        shadowDistance,
        sensitivity,
        font,
        shadowEffect,
        blurAmount,
        noiseIntensity,
        glowIntensity,
        style,
    } = props

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [elementCenter, setElementCenter] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    // Create active shadow colors using individual color props
    const activeShadowColors = useMemo(() => {
        const individualColors = [
            shadowColor1,
            shadowColor2,
            shadowColor3,
            shadowColor4,
            shadowColor5,
        ]
        const colors = []

        for (let i = 0; i < shadowCount; i++) {
            colors.push(individualColors[i])
        }

        return colors
    }, [
        shadowColor1,
        shadowColor2,
        shadowColor3,
        shadowColor4,
        shadowColor5,
        shadowCount,
    ])

    // Memoized mouse move handler
    const handleMouseMove = useCallback((e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY })
    }, [])

    // Setup mouse tracking
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.addEventListener("mousemove", handleMouseMove)
            return () => window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [handleMouseMove])

    // Update element center position when ref changes
    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setElementCenter({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            })
        }
    }, [text, font]) // Re-calculate when text or font changes

    // Memoized shadow positions calculation
    const shadowPositions = useMemo(() => {
        // For static rendering (canvas/thumbnail), use a static shadow position
        if (
            RenderTarget.current() === RenderTarget.canvas ||
            RenderTarget.current() === RenderTarget.thumbnail
        ) {
            return activeShadowColors.map((color, index) => {
                const multiplier = index + 1
                return {
                    x: shadowDistance * multiplier,
                    y: shadowDistance * multiplier,
                    color,
                }
            })
        }

        // For interactive rendering
        const deltaX = (mousePosition.x - elementCenter.x) * sensitivity
        const deltaY = (mousePosition.y - elementCenter.y) * sensitivity

        const clampedX = Math.max(
            -shadowDistance * 2,
            Math.min(shadowDistance * 2, deltaX)
        )
        const clampedY = Math.max(
            -shadowDistance * 2,
            Math.min(shadowDistance * 2, deltaY)
        )

        return activeShadowColors.map((color, index) => {
            const multiplier = index + 1
            return {
                // Default to bottom right position (positive values) when no mouse movement
                x:
                    mousePosition.x === 0 && mousePosition.y === 0
                        ? shadowDistance * multiplier
                        : clampedX * multiplier,
                y:
                    mousePosition.x === 0 && mousePosition.y === 0
                        ? shadowDistance * multiplier
                        : clampedY * multiplier,
                color,
            }
        })
    }, [
        mousePosition,
        elementCenter,
        sensitivity,
        shadowDistance,
        activeShadowColors,
    ])

    // Generate noise filter if needed
    const noiseFilter = useMemo(() => {
        if (shadowEffect !== "noise") return null

        return (
            <svg style={{ position: "absolute", width: 0, height: 0 }}>
                <filter id="noise">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency={noiseIntensity / 100}
                        numOctaves="3"
                        result="noise"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale={noiseIntensity}
                    />
                </filter>
            </svg>
        )
    }, [shadowEffect, noiseIntensity])

    // Get effect styles for shadows
    const getEffectStyles = (effect: string, shadowColor: string) => {
        switch (effect) {
            case "blur":
                return { filter: `blur(${blurAmount}px)` }
            case "noise":
                return { filter: "url(#noise)" }
            case "glow":
                return { filter: `blur(${glowIntensity}px)` }
            case "solid":
            default:
                return {}
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {noiseFilter}

            {/* Shadow layers - rendered in reverse order so first shadow is at the bottom */}
            {shadowPositions.map((shadow, index) => (
                <motion.h1
                    key={index}
                    style={{
                        position: "absolute",
                        color: shadow.color,
                        margin: 0,
                        userSelect: "none",
                        transform: `translate(${shadow.x}px, ${shadow.y}px)`,
                        zIndex: shadowPositions.length - index, // First shadow has highest z-index
                        ...font,
                        ...getEffectStyles(shadowEffect, shadow.color),
                    }}
                    transition={{
                        transform: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        },
                    }}
                >
                    {text}
                </motion.h1>
            ))}

            {/* Main text layer - no effects applied */}
            <motion.h1
                style={{
                    position: "relative",
                    color: textColor,
                    margin: 0,
                    userSelect: "none",
                    zIndex: shadowPositions.length + 1, // Main text always on top
                    ...font,
                }}
            >
                {text}
            </motion.h1>
        </div>
    )
}

// Default props
CursorShadowText.defaultProps = {
    text: "MOVE WITH ME",
    textColor: "#ffffff",
    shadowColors: ["#1A237E", "#7E57C2"],
    shadowColor1: "#1A237E",
    shadowColor2: "#7E57C2",
    shadowColor3: "#ff005e",
    shadowColor4: "#ff9e00",
    shadowColor5: "#00e5ff",
    shadowCount: 2,
    shadowDistance: 2,
    sensitivity: 0.1,
    shadowEffect: "solid" as "solid" | "blur" | "noise" | "glow",
    blurAmount: 5,
    noiseIntensity: 10,
    glowIntensity: 8,
}

// Property controls with dynamic color visibility
addPropertyControls(CursorShadowText, {
    text: {
        type: ControlType.String,
        title: "Text",
        placeholder: "Enter text...",
        defaultValue: "MOVE WITH ME",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "64px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    shadowEffect: {
        type: ControlType.Enum,
        title: "Shadow Effect",
        options: ["solid", "blur", "noise", "glow"],
        optionTitles: ["Solid", "Blur", "Noise", "Glow"],
        defaultValue: "solid",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 5,
        unit: "px",
        displayStepper: true,
        hidden: ({ shadowEffect }) => shadowEffect !== "blur",
    },
    noiseIntensity: {
        type: ControlType.Number,
        title: "Noise Intensity",
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 10,
        displayStepper: true,
        hidden: ({ shadowEffect }) => shadowEffect !== "noise",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 8,
        unit: "px",
        displayStepper: true,
        hidden: ({ shadowEffect }) => shadowEffect !== "glow",
    },
    shadowCount: {
        type: ControlType.Number,
        title: "Shadow Count",
        min: 0,
        max: 5,
        step: 1,
        defaultValue: 2,
        displayStepper: true,
    },
    // Group all shadow colors under a section
    shadowColor1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#1A237E",
        hidden: ({ shadowCount }) => shadowCount < 1,
    },
    shadowColor2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#7E57C2",
        hidden: ({ shadowCount }) => shadowCount < 2,
    },
    shadowColor3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#ff005e",
        hidden: ({ shadowCount }) => shadowCount < 3,
    },
    shadowColor4: {
        type: ControlType.Color,
        title: "Color 4",
        defaultValue: "#ff9e00",
        hidden: ({ shadowCount }) => shadowCount < 4,
    },
    shadowColor5: {
        type: ControlType.Color,
        title: "Color 5",
        defaultValue: "#00e5ff",
        hidden: ({ shadowCount }) => shadowCount < 5,
    },
    shadowDistance: {
        type: ControlType.Number,
        title: "Shadow Distance",
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 3,
        unit: "px",
        displayStepper: true,
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Mouse Sensitivity",
        min: 0.01,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
        description: "Controls how responsive shadows are to cursor movement",
    },
})