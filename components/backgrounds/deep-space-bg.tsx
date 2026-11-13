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
import { useMemo } from "react"

/**
 * Deep Space Background
 *
 *
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DeepSpaceBackground(props) {
    const {
        starCount,
        starColor,
        backgroundColor,
        nebulaColor,
        nebulaOpacity,
        twinkleSpeed,
        scale,
        style,
    } = props

    const stars = useMemo(() => {
        return Array.from({ length: starCount }).map((_, i) => {
            const seed = i + 1
            const r1 = Math.sin(seed * 12.9898) * 43758.5453
            const r2 = Math.cos(seed * 78.233) * 43758.5453

            const x = (r1 - Math.floor(r1)) * 100 + "%"
            const y = (r2 - Math.floor(r2)) * 100 + "%"

            const r3 = Math.sin(seed * 34.5678) * 43758.5453
            const size = (r3 - Math.floor(r3)) * 2 + 1 + "px"

            const r4 = Math.cos(seed * 90.1234) * 43758.5453
            const opacity = 0.3 + (r4 - Math.floor(r4)) * 0.7

            const r5 = Math.sin(seed * 56.789) * 43758.5453
            const delay = (r5 - Math.floor(r5)) * 5

            return { x, y, size, opacity, delay, id: i }
        })
    }, [starCount])

    return (
        <div
            style={{
                ...style,
                backgroundColor: backgroundColor,
                position: "relative",
                overflow: "hidden",
                isolation: "isolate",
                minWidth: 100,
                minHeight: 100,
            }}
        >
            {/* Nebula Dust Layers */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: nebulaOpacity,
                    background: `
                        radial-gradient(circle at 20% 30%, ${nebulaColor} 0%, transparent 40%),
                        radial-gradient(circle at 80% 70%, ${nebulaColor} 0%, transparent 40%),
                        radial-gradient(circle at 50% 50%, ${nebulaColor} 0%, transparent 50%)
                    `,
                    filter: "blur(60px)",
                    transform: `scale(${scale})`,
                    mixBlendMode: "screen",
                    pointerEvents: "none",
                }}
            />

            {/* Stars */}
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    initial={{ opacity: star.opacity }}
                    animate={{
                        opacity: [
                            star.opacity,
                            star.opacity * 0.3,
                            star.opacity,
                        ],
                        scale: [1, 0.8, 1],
                    }}
                    transition={{
                        duration: twinkleSpeed + star.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: star.delay,
                    }}
                    style={{
                        position: "absolute",
                        left: star.x,
                        top: star.y,
                        width: star.size,
                        height: star.size,
                        backgroundColor: starColor,
                        borderRadius: "50%",
                        boxShadow: `0 0 ${parseInt(star.size) * 2}px ${starColor}`,
                    }}
                />
            ))}

            {/* Vignette for depth */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

addPropertyControls(DeepSpaceBackground, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050508",
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FFFFFF",
    },
    starCount: {
        type: ControlType.Number,
        title: "Star Count",
        defaultValue: 100,
        min: 10,
        max: 500,
        step: 10,
    },
    twinkleSpeed: {
        type: ControlType.Number,
        title: "Twinkle (s)",
        defaultValue: 3,
        min: 0.5,
        max: 10,
        step: 0.5,
    },
    nebulaColor: {
        type: ControlType.Color,
        title: "Nebula Color",
        defaultValue: "#2A1B3D",
    },
    nebulaOpacity: {
        type: ControlType.Number,
        title: "Nebula Opacity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
    },
    scale: {
        type: ControlType.Number,
        title: "Nebula Scale",
        defaultValue: 1.5,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
})
