// Floating dots background with support for 3 customizable colors
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

import { useMemo, type CSSProperties } from "react"

interface FloatingDotsBackgroundProps {
    dotCount: number
    dotSize: number
    dotColor1: string
    dotColor2: string
    dotColor3: string
    glowIntensity: number
    animationSpeed: number
    verticalRange: number
    opacity: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FloatingDotsBackground(
    props: FloatingDotsBackgroundProps
) {
    const {
        dotCount = 20,
        dotSize = 4,
        dotColor1 = "#E5E7EB",
        dotColor2 = "#60A5FA",
        dotColor3 = "#F472B6",
        glowIntensity = 0.3,
        animationSpeed = 1,
        verticalRange = 30,
        opacity = 0.6,
    } = props

    const isStatic = useIsStaticRenderer()

    const colors = [dotColor1, dotColor2, dotColor3]

    const dots = useMemo(() => {
        return Array.from({ length: dotCount }, (_, i) => {
            const color = colors[Math.floor(Math.random() * colors.length)]
            return {
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                delay: Math.random() * 4,
                duration: 3 + Math.random() * 4,
                scale: 0.5 + Math.random() * 0.5,
                color,
            }
        })
    }, [dotCount, dotColor1, dotColor2, dotColor3])

    const containerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
    }

    if (isStatic) {
        return (
            <div style={containerStyle}>
                {dots.map((dot) => (
                    <div
                        key={dot.id}
                        style={{
                            position: "absolute",
                            borderRadius: "50%",
                            backgroundColor: dot.color,
                            opacity: opacity,
                            left: `${dot.x}%`,
                            top: `${dot.y}%`,
                            width: dotSize * dot.scale,
                            height: dotSize * dot.scale,
                            boxShadow:
                                glowIntensity > 0
                                    ? `0 0 ${glowIntensity * 20}px ${dot.color}`
                                    : "none",
                        }}
                    />
                ))}
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            {dots.map((dot) => (
                <motion.div
                    key={dot.id}
                    style={{
                        position: "absolute",
                        borderRadius: "50%",
                        backgroundColor: dot.color,
                        opacity: opacity,
                        left: `${dot.x}%`,
                        top: `${dot.y}%`,
                        width: dotSize * dot.scale,
                        height: dotSize * dot.scale,
                        boxShadow:
                            glowIntensity > 0
                                ? `0 0 ${glowIntensity * 20}px ${dot.color}`
                                : "none",
                    }}
                    animate={{
                        y: [
                            -verticalRange / 2,
                            verticalRange / 2,
                            -verticalRange / 2,
                        ],
                        opacity: [opacity * 0.3, opacity, opacity * 0.3],
                    }}
                    transition={{
                        duration: dot.duration / animationSpeed,
                        delay: dot.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    )
}

addPropertyControls(FloatingDotsBackground, {
    dotCount: {
        type: ControlType.Number,
        title: "Dot Count",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 1,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 4,
        min: 2,
        max: 50,
        step: 1,
        unit: "px",
    },
    dotColor1: {
        type: ControlType.Color,
        title: "Dot Color 1",
        defaultValue: "#E5E7EB",
    },
    dotColor2: {
        type: ControlType.Color,
        title: "Dot Color 2",
        defaultValue: "#60A5FA",
    },
    dotColor3: {
        type: ControlType.Color,
        title: "Dot Color 3",
        defaultValue: "#F472B6",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    verticalRange: {
        type: ControlType.Number,
        title: "Vertical Range",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 5,
        unit: "px",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.6,
        min: 0.1,
        max: 1,
        step: 0.1,
    },
})
