// Cycling wave component with rotating circular outlines, green accent, and blurred background
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

import { useMemo, useCallback, type CSSProperties } from "react"

interface CyclingRingsProps {
    waveCount: number
    waveSize: number
    rotationSpeed: number
    tiltAngle: number
    strokeWidth: number
    accentColor: string
    backgroundColor: string
    blurAmount: number
    opacity: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CyclingRings(props: CyclingRingsProps) {
    const {
        waveCount,
        waveSize,
        rotationSpeed,
        tiltAngle,
        strokeWidth,
        accentColor,
        backgroundColor,
        blurAmount,
        opacity,
    } = props

    const isStatic = useIsStaticRenderer()

    // Memoize wave configurations to prevent recalculation
    const waves = useMemo(() => {
        return Array.from({ length: waveCount }, (_, i) => ({
            id: i,
            delay: i * 0.2,
            scale: 1 + i * 0.1,
            opacity: opacity * (1 - i * 0.1),
        }))
    }, [waveCount, opacity])

    // Memoize container styles
    const containerStyle = useMemo(() => ({
        width: "100%",
        height: "100%",
        position: "relative" as const,
        background: backgroundColor,
        overflow: "hidden" as const,
        display: "flex",
        alignItems: "center" as const,
        justifyContent: "center" as const,
    }), [backgroundColor])

    // Memoize background gradient style
    const backgroundGradientStyle = useMemo(() => ({
        position: "absolute" as const,
        inset: 0,
        background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
        filter: `blur(${blurAmount}px)`,
    }), [accentColor, blurAmount])

    // Memoize animation transition
    const animationTransition = useMemo(() => ({
        duration: rotationSpeed,
        repeat: Infinity,
        ease: "linear" as const,
    }), [rotationSpeed])

    // Memoize wave style calculator
    const getWaveStyle = useCallback((wave: typeof waves[0]) => ({
        position: "absolute" as const,
        width: waveSize * wave.scale,
        height: waveSize * wave.scale,
        border: `${strokeWidth}px solid ${accentColor}`,
        borderRadius: "50%",
        opacity: wave.opacity,
        willChange: "transform",
    }), [waveSize, strokeWidth, accentColor])

    // Memoize static wave style calculator
    const getStaticWaveStyle = useCallback((wave: typeof waves[0]) => ({
        position: "absolute" as const,
        width: waveSize * wave.scale,
        height: waveSize * wave.scale,
        border: `${strokeWidth}px solid ${accentColor}`,
        borderRadius: "50%",
        opacity: wave.opacity,
        transform: `rotate(${tiltAngle}deg) rotateY(60deg)`,
    }), [waveSize, strokeWidth, accentColor, tiltAngle])

    if (isStatic) {
        return (
            <div style={containerStyle}>
                <div style={backgroundGradientStyle} />
                {waves.map((wave) => (
                    <div
                        key={wave.id}
                        style={getStaticWaveStyle(wave)}
                    />
                ))}
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <div style={backgroundGradientStyle} />

            {waves.map((wave) => (
                <motion.div
                    key={wave.id}
                    style={getWaveStyle(wave)}
                    animate={{
                        rotateZ: [0, 360],
                        rotateY: [0, 360],
                        rotateX: [tiltAngle, tiltAngle + 360],
                    }}
                    transition={{
                        ...animationTransition,
                        delay: wave.delay,
                    }}
                />
            ))}
        </div>
    )
}

addPropertyControls(CyclingRings, {
    waveCount: {
        type: ControlType.Number,
        title: "Wave Count",
        defaultValue: 10,
        min: 1,
        max: 10,
        step: 1,
    },
    waveSize: {
        type: ControlType.Number,
        title: "Wave Size",
        defaultValue: 140,
        min: 20,
        max: 300,
        step: 10,
        unit: "px",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
    },
    tiltAngle: {
        type: ControlType.Number,
        title: "Tilt Angle",
        defaultValue: 45,
        min: 0,
        max: 90,
        step: 5,
        unit: "deg",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 1,
        unit: "px",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#22CC66",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 2,
        unit: "px",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.8,
        min: 0.1,
        max: 1,
        step: 0.1,
    },
})
