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
import { useState, useMemo, useCallback } from "react"

/**
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function GeometricArcGrid(props) {
    const {
        variant = "Ice",
        backgroundColor: customBackgroundColor,
        colorStart: customColorStart,
        colorEnd: customColorEnd,
        gridLineWidth,
        glowIntensity,
        animationSpeed,
    } = props

    const isStatic = useIsStaticRenderer()

    const themes = {
        Magma: { rock: "#1a1a1a", start: "#FFD700", end: "#FF4500" },
        Ice: { rock: "#0a1a2a", start: "#E0FFFF", end: "#00BFFF" },
        Toxic: { rock: "#0a2a0a", start: "#ADFF2F", end: "#006400" },
        Amethyst: { rock: "#1a0a1a", start: "#E6E6FA", end: "#8A2BE2" },
        Custom: {
            rock: customBackgroundColor,
            start: customColorStart,
            end: customColorEnd,
        },
    }

    const currentTheme = themes[variant] || themes.Magma
    const backgroundColor = currentTheme.rock
    const colorStart = currentTheme.start
    const colorEnd = currentTheme.end

    const [ripples, setRipples] = useState([])

    const handleClick = (e) => {
        if (isStatic) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setRipples((prev) => {
            const newRipples = [...prev, { id: Math.random(), x, y }]
            return newRipples.slice(-5)
        })
    }

    // SVG pattern for cracks
    const crackPath =
        "M0,0 L100,100 M20,0 L0,50 L40,100 M60,0 L100,40 L80,100 M0,80 L100,20 M40,0 L60,100"

    return (
        <div
            onClick={handleClick}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 5,
                minHeight: 5,
                backgroundColor: backgroundColor,
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
            }}
        >
            <svg width="0" height="0">
                <defs>
                    <linearGradient
                        id="lavaGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={colorStart} />
                        <stop offset="50%" stopColor={colorEnd} />
                        <stop offset="100%" stopColor={colorStart} />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur
                            stdDeviation={glowIntensity}
                            result="coloredBlur"
                        />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>

            <motion.div
                style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    right: "-50%",
                    bottom: "-50%",
                    background: `repeating-linear-gradient(45deg, ${colorStart}, ${colorEnd} 20%, ${colorStart} 40%)`,
                    backgroundSize: "200% 200%",
                    opacity: 0.8,
                    filter: `blur(${glowIntensity * 2}px)`,
                    zIndex: 0,
                    willChange: isStatic ? "auto" : "background-position",
                }}
                animate={
                    isStatic
                        ? {}
                        : {
                              backgroundPosition: [
                                  "0% 50%",
                                  "100% 50%",
                                  "0% 50%",
                              ],
                          }
                }
                transition={{
                    duration: 10 / animationSpeed,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
            />

            {/* Enhanced Shimmer Layer */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    right: "-50%",
                    bottom: "-50%",
                    background: `linear-gradient(135deg, 
                            transparent 0%, 
                            ${colorStart}20 20%, 
                            ${colorEnd}40 40%, 
                            ${colorStart}40 50%, 
                            ${colorEnd}40 60%,
                            ${colorStart}20 80%,
                            transparent 100%)`,
                    backgroundSize: "300% 300%",
                    opacity: 0.5,
                    filter: `blur(${glowIntensity * 1.5}px)`,
                    zIndex: 0,
                    mixBlendMode: "overlay",
                    willChange: isStatic ? "auto" : "background-position",
                }}
                animate={
                    isStatic
                        ? {}
                        : {
                              backgroundPosition: [
                                  "0% 0%",
                                  "100% 100%",
                                  "0% 0%",
                              ],
                          }
                }
                transition={{
                    duration: 6 / animationSpeed,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
            />

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                }}
            >
                <svg width="100%" height="100%" preserveAspectRatio="none">
                    <defs>
                        <pattern
                            id="crackPattern"
                            x="0"
                            y="0"
                            width="200"
                            height="200"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M10,10 Q50,5 90,30 T180,50 M20,180 Q60,140 100,160 T190,120 M5,100 Q40,80 80,110 T150,90 M120,10 Q140,60 110,100 T140,190 M60,10 Q40,50 70,90 T50,190"
                                fill="none"
                                stroke="url(#lavaGradient)"
                                strokeWidth={gridLineWidth}
                                strokeLinecap="round"
                                filter={`url(#glow)`}
                            />
                            <path
                                d="M0,0 L200,200 M200,0 L0,200 M100,0 L100,200 M0,100 L200,100"
                                fill="none"
                                stroke="url(#lavaGradient)"
                                strokeWidth={gridLineWidth * 0.5}
                                strokeOpacity="0.5"
                                filter={`url(#glow)`}
                            />
                        </pattern>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="url(#crackPattern)"
                    />
                </svg>
            </div>

            {ripples.map((ripple) => (
                <motion.div
                    key={ripple.id}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    onAnimationComplete={() =>
                        setRipples((prev) =>
                            prev.filter((r) => r.id !== ripple.id)
                        )
                    }
                    style={{
                        position: "absolute",
                        left: ripple.x - 50,
                        top: ripple.y - 50,
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${colorStart} 0%, ${colorEnd} 50%, transparent 70%)`,
                        pointerEvents: "none",
                        zIndex: 5,
                        filter: `blur(${glowIntensity}px)`,
                        mixBlendMode: "screen",
                    }}
                />
            ))}
        </div>
    )
}

addPropertyControls(GeometricArcGrid, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["Magma", "Ice", "Toxic", "Amethyst", "Custom"],
        defaultValue: "Ice",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#1a1a1a",
        hidden: (props) => props.variant !== "Custom",
    },
    colorStart: {
        type: ControlType.Color,
        title: "Color Start",
        defaultValue: "#FFD700", // Gold/Yellow
        hidden: (props) => props.variant !== "Custom",
    },
    colorEnd: {
        type: ControlType.Color,
        title: "Color End",
        defaultValue: "#FF4500", // OrangeRed
        hidden: (props) => props.variant !== "Custom",
    },
    gridLineWidth: {
        type: ControlType.Number,
        title: "Grid Line Width",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 0.5,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 3,
        min: 0,
        max: 20,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
})
