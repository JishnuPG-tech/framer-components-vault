import { useEffect, useRef, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useReducedMotion } from "framer-motion"

interface EarthHeroProps {
    title: string
    subtitle: string
    ctaText: string
    ctaLink: string
    ctaStyle: "filled" | "outline" | "glow"
    earthSize: number
    rotationSpeed: number
    starCount: number
    particleCount: number
    energyLineCount: number
    glowIntensity: number
    backgroundGradient: string
    titleGradientStart: string
    titleGradientEnd: string
    earthTexture: "cyber" | "hologram" | "magma" | "ice" | "matrix" | "golden"
}

/**
 * Futuristic Earth Hero Section
 * 
 * A cinematic hero section featuring an animated Earth with glowing effects,
 * twinkling stars, floating particles, and animated energy lines.
 * 
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function EarthHero(props: EarthHeroProps) {
    const {
        title = "SAVE OUR EARTH",
        subtitle = "The Future of Humanity Depends on Nature",
        earthSize = 320,
        rotationSpeed = 20,
        starCount = 150,
        particleCount = 30,
        energyLineCount = 8,
        glowIntensity = 1,
        backgroundGradient = "linear-gradient(180deg, #000000 0%, #0a0a1a 30%, #0f0f2e 60%, #0a1628 100%)",
        titleGradientStart = "#00ffff",
        titleGradientEnd = "#00ff88",
        earthTexture = "cyber",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.2 })
    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const [isHovered, setIsHovered] = useState(false)

    // Determine if animations should run
    const shouldAnimate = !isStatic && !prefersReducedMotion

    // Generate stars with random positions
    const stars = useMemo(() => {
        return Array.from({ length: starCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * 3,
            duration: Math.random() * 2 + 1,
            opacity: Math.random() * 0.7 + 0.3,
        }))
    }, [starCount])

    // Generate floating particles
    const particles = useMemo(() => {
        return Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 6 + 2,
            delay: Math.random() * 5,
            duration: Math.random() * 10 + 10,
        }))
    }, [particleCount])

    // Generate energy lines
    const energyLines = useMemo(() => {
        return Array.from({ length: energyLineCount }, (_, i) => ({
            id: i,
            angle: (360 / energyLineCount) * i,
            delay: i * 0.3,
            duration: 3 + Math.random() * 2,
        }))
    }, [energyLineCount])

    // Texture configurations
    const textureConfigs = useMemo(() => {
        const configs = {
            cyber: {
                gradient: `
                    radial-gradient(ellipse at 30% 30%, rgba(0,200,255,0.3) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 70%, rgba(0,255,136,0.3) 0%, transparent 50%),
                    linear-gradient(90deg, 
                        #0a1628 0%, 
                        #0d3b4a 15%, 
                        #0a5f4f 25%, 
                        #0d4a3a 35%, 
                        #0a3d5c 45%, 
                        #0a1628 50%,
                        #0d3b4a 65%, 
                        #0a5f4f 75%, 
                        #0d4a3a 85%, 
                        #0a3d5c 95%, 
                        #0a1628 100%
                    )
                `,
                continents: `
                    radial-gradient(ellipse 80px 60px at 25% 35%, rgba(0,180,120,0.6) 0%, transparent 70%),
                    radial-gradient(ellipse 60px 80px at 70% 25%, rgba(0,200,100,0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 100px 50px at 50% 70%, rgba(0,160,140,0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 50px 40px at 80% 65%, rgba(0,180,100,0.4) 0%, transparent 70%)
                `,
                glowColor: "rgba(0,255,255",
                gridColor: "rgba(0,255,255,0.1)",
                gridColor2: "rgba(0,255,136,0.1)",
                particleColor: "rgba(0,255,255,0.8)",
            },
            hologram: {
                gradient: `
                    radial-gradient(ellipse at 50% 50%, rgba(0,255,255,0.1) 0%, transparent 60%),
                    linear-gradient(90deg, 
                        #0a1a2e 0%, 
                        #0d2a3a 20%, 
                        #0a1a2e 40%, 
                        #0d2a4a 60%, 
                        #0a1a2e 80%,
                        #0d2a3a 100%
                    )
                `,
                continents: `
                    radial-gradient(ellipse 100px 80px at 30% 40%, rgba(100,200,255,0.3) 0%, transparent 70%),
                    radial-gradient(ellipse 80px 100px at 65% 30%, rgba(100,220,255,0.25) 0%, transparent 70%),
                    radial-gradient(ellipse 120px 60px at 45% 75%, rgba(100,200,255,0.25) 0%, transparent 70%)
                `,
                glowColor: "rgba(100,220,255",
                gridColor: "rgba(100,220,255,0.15)",
                gridColor2: "rgba(150,230,255,0.1)",
                particleColor: "rgba(100,220,255,0.8)",
            },
            magma: {
                gradient: `
                    radial-gradient(ellipse at 30% 30%, rgba(255,100,0,0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 70%, rgba(255,50,50,0.3) 0%, transparent 50%),
                    linear-gradient(90deg, 
                        #2a0a0a 0%, 
                        #4a1a0a 15%, 
                        #5f2a0a 25%, 
                        #4a1a0a 35%, 
                        #3a0a0a 45%, 
                        #2a0a0a 50%,
                        #4a1a0a 65%, 
                        #5f2a0a 75%, 
                        #4a1a0a 85%, 
                        #3a0a0a 95%, 
                        #2a0a0a 100%
                    )
                `,
                continents: `
                    radial-gradient(ellipse 80px 60px at 25% 35%, rgba(255,100,0,0.7) 0%, transparent 70%),
                    radial-gradient(ellipse 60px 80px at 70% 25%, rgba(255,80,20,0.6) 0%, transparent 70%),
                    radial-gradient(ellipse 100px 50px at 50% 70%, rgba(255,60,0,0.6) 0%, transparent 70%),
                    radial-gradient(ellipse 50px 40px at 80% 65%, rgba(255,100,0,0.5) 0%, transparent 70%)
                `,
                glowColor: "rgba(255,100,0",
                gridColor: "rgba(255,100,0,0.15)",
                gridColor2: "rgba(255,50,50,0.1)",
                particleColor: "rgba(255,100,0,0.8)",
            },
            ice: {
                gradient: `
                    radial-gradient(ellipse at 30% 30%, rgba(200,230,255,0.3) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 70%, rgba(150,200,255,0.3) 0%, transparent 50%),
                    linear-gradient(90deg, 
                        #0a1a2e 0%, 
                        #1a3a5a 15%, 
                        #2a4a6a 25%, 
                        #1a3a5a 35%, 
                        #0a2a4a 45%, 
                        #0a1a2e 50%,
                        #1a3a5a 65%, 
                        #2a4a6a 75%, 
                        #1a3a5a 85%, 
                        #0a2a4a 95%, 
                        #0a1a2e 100%
                    )
                `,
                continents: `
                    radial-gradient(ellipse 80px 60px at 25% 35%, rgba(200,230,255,0.6) 0%, transparent 70%),
                    radial-gradient(ellipse 60px 80px at 70% 25%, rgba(180,220,255,0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 100px 50px at 50% 70%, rgba(160,210,255,0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 50px 40px at 80% 65%, rgba(200,230,255,0.4) 0%, transparent 70%)
                `,
                glowColor: "rgba(200,230,255",
                gridColor: "rgba(200,230,255,0.15)",
                gridColor2: "rgba(150,200,255,0.1)",
                particleColor: "rgba(200,230,255,0.8)",
            },
            matrix: {
                gradient: `
                    radial-gradient(ellipse at 30% 30%, rgba(0,255,0,0.2) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 70%, rgba(50,255,50,0.2) 0%, transparent 50%),
                    linear-gradient(90deg, 
                        #0a1a0a 0%, 
                        #0d3a0d 15%, 
                        #0a4f0a 25%, 
                        #0d3a0d 35%, 
                        #0a2a0a 45%, 
                        #0a1a0a 50%,
                        #0d3a0d 65%, 
                        #0a4f0a 75%, 
                        #0d3a0d 85%, 
                        #0a2a0a 95%, 
                        #0a1a0a 100%
                    )
                `,
                continents: `
                    radial-gradient(ellipse 80px 60px at 25% 35%, rgba(0,255,0,0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 60px 80px at 70% 25%, rgba(50,255,50,0.4) 0%, transparent 70%),
                    radial-gradient(ellipse 100px 50px at 50% 70%, rgba(0,200,0,0.4) 0%, transparent 70%),
                    radial-gradient(ellipse 50px 40px at 80% 65%, rgba(0,255,0,0.3) 0%, transparent 70%)
                `,
                glowColor: "rgba(0,255,0",
                gridColor: "rgba(0,255,0,0.15)",
                gridColor2: "rgba(50,255,50,0.1)",
                particleColor: "rgba(0,255,0,0.8)",
            },
            golden: {
                gradient: `
                    radial-gradient(ellipse at 30% 30%, rgba(255,200,50,0.3) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 70%, rgba(255,180,0,0.3) 0%, transparent 50%),
                    linear-gradient(90deg, 
                        #2a1a0a 0%, 
                        #4a2a0a 15%, 
                        #5f3a0a 25%, 
                        #4a2a0a 35%, 
                        #3a1a0a 45%, 
                        #2a1a0a 50%,
                        #4a2a0a 65%, 
                        #5f3a0a 75%, 
                        #4a2a0a 85%, 
                        #3a1a0a 95%, 
                        #2a1a0a 100%
                    )
                `,
                continents: `
                    radial-gradient(ellipse 80px 60px at 25% 35%, rgba(255,200,50,0.6) 0%, transparent 70%),
                    radial-gradient(ellipse 60px 80px at 70% 25%, rgba(255,180,0,0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 100px 50px at 50% 70%, rgba(255,160,0,0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 50px 40px at 80% 65%, rgba(255,200,50,0.4) 0%, transparent 70%)
                `,
                glowColor: "rgba(255,200,50",
                gridColor: "rgba(255,200,50,0.15)",
                gridColor2: "rgba(255,180,0,0.1)",
                particleColor: "rgba(255,200,50,0.8)",
            },
        }
        return configs[earthTexture]
    }, [earthTexture])

    const currentTexture = textureConfigs

    const handleMouseEnter = () => {
        if (!isStatic) {
            startTransition(() => setIsHovered(true))
        }
    }

    const handleMouseLeave = () => {
        if (!isStatic) {
            startTransition(() => setIsHovered(false))
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: backgroundGradient,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Stars */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: "none",
                }}
            >
                {stars.map((star) => (
                    <motion.div
                        key={star.id}
                        style={{
                            position: "absolute",
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: star.size,
                            height: star.size,
                            borderRadius: "50%",
                            background: "#ffffff",
                            boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
                        }}
                        animate={!isStatic ? {
                            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
                            scale: [1, 1.2, 1],
                        } : {}}
                        transition={{
                            duration: star.duration,
                            repeat: Infinity,
                            delay: star.delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Floating Particles */}
            {!isStatic && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: "none",
                    }}
                >
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            style={{
                                position: "absolute",
                                width: particle.size,
                                height: particle.size,
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${currentTexture.particleColor} 0%, transparent 70%)`,
                                filter: "blur(1px)",
                            }}
                            animate={{
                                x: [`${particle.x}%`, `${particle.x + (Math.random() - 0.5) * 20}%`],
                                y: [`${particle.y}%`, `${particle.y - 20}%`],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                delay: particle.delay,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Main Content Container */}
            <div
                style={{
                    position: "relative",
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px 20px",
                }}
            >
                {/* Earth Container */}
                <div
                    style={{
                        position: "relative",
                        width: earthSize,
                        height: earthSize,
                        marginBottom: 60,
                    }}
                >
                    {/* Outer Glow Ring */}
                    <motion.div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: earthSize * 1.4,
                            height: earthSize * 1.4,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${currentTexture.glowColor},${0.1 * glowIntensity}) 0%, ${currentTexture.glowColor},${0.05 * glowIntensity}) 30%, transparent 70%)`,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                        }}
                        animate={!isStatic ? {
                            scale: isHovered ? [1, 1.1, 1] : [1, 1.05, 1],
                            opacity: [0.6, 1, 0.6],
                        } : {}}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Energy Lines */}
                    {!isStatic && energyLines.map((line) => (
                        <motion.div
                            key={line.id}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: earthSize * 1.5,
                                height: 2,
                                background: `linear-gradient(90deg, transparent, ${currentTexture.particleColor}, transparent)`,
                                transformOrigin: "center",
                            }}
                            animate={{
                                rotate: [line.angle, line.angle + 360],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: line.duration,
                                repeat: Infinity,
                                delay: line.delay,
                                ease: "linear",
                            }}
                        />
                    ))}

                    {/* Earth Sphere */}
                    <div
                        style={{
                            position: "relative",
                            width: earthSize,
                            height: earthSize,
                            borderRadius: "50%",
                            overflow: "hidden",
                            boxShadow: `
                                inset -40px -40px 80px rgba(0,0,0,0.9),
                                inset 20px 20px 40px rgba(255,255,255,0.1),
                                0 0 ${60 * glowIntensity}px ${currentTexture.glowColor},${0.4 * glowIntensity}),
                                0 0 ${120 * glowIntensity}px ${currentTexture.glowColor},${0.2 * glowIntensity}),
                                0 0 ${200 * glowIntensity}px ${currentTexture.glowColor},${0.1 * glowIntensity})
                            `,
                        }}
                    >
                        {/* Rotating Earth Surface */}
                        <motion.div
                            style={{
                                width: "200%",
                                height: "100%",
                                background: currentTexture.gradient,
                                borderRadius: "50%",
                            }}
                            animate={!isStatic ? {
                                x: [0, -earthSize],
                            } : {}}
                            transition={{
                                duration: rotationSpeed,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />

                        {/* Continent Shapes */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: currentTexture.continents,
                                filter: "blur(2px)",
                            }}
                        />

                        {/* Atmosphere Glow */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: "50%",
                                background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                            }}
                        />

                        {/* Neon Grid Lines */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: "50%",
                                background: `
                                    linear-gradient(90deg, transparent 48%, ${currentTexture.gridColor} 49%, ${currentTexture.gridColor} 51%, transparent 52%),
                                    linear-gradient(0deg, transparent 48%, ${currentTexture.gridColor2} 49%, ${currentTexture.gridColor2} 51%, transparent 52%)
                                `,
                                backgroundSize: "40px 40px",
                            }}
                        />
                    </div>

                    {/* Light Reflection */}
                    <div
                        style={{
                            position: "absolute",
                            top: "10%",
                            left: "15%",
                            width: "30%",
                            height: "20%",
                            borderRadius: "50%",
                            background: "radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 70%)",
                            filter: "blur(8px)",
                            pointerEvents: "none",
                        }}
                    />
                </div>

                {/* Hero Text */}
                <div
                    style={{
                        textAlign: "center",
                        zIndex: 20,
                    }}
                >
                    {/* Title */}
                    <motion.h1
                        style={{
                            fontSize: "clamp(36px, 8vw, 72px)",
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            margin: "0 0 20px 0",
                            background: `linear-gradient(135deg, ${titleGradientStart} 0%, ${titleGradientEnd} 50%, ${titleGradientStart} 100%)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            textShadow: `0 0 ${30 * glowIntensity}px rgba(0,255,255,${0.5 * glowIntensity})`,
                            filter: `drop-shadow(0 0 ${10 * glowIntensity}px rgba(0,255,255,0.8))`,
                            textTransform: "uppercase",
                        }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {title}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        style={{
                            fontSize: "clamp(16px, 3vw, 24px)",
                            fontWeight: 300,
                            letterSpacing: "0.05em",
                            color: "rgba(255, 255, 255, 0.8)",
                            margin: 0,
                            textShadow: `0 0 ${20 * glowIntensity}px rgba(0,255,255,${0.3 * glowIntensity})`,
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        {subtitle}
                    </motion.p>

                    {/* Decorative Line */}
                    <motion.div
                        style={{
                            width: 120,
                            height: 2,
                            margin: "30px auto 0",
                            background: `linear-gradient(90deg, transparent, ${titleGradientStart}, ${titleGradientEnd}, transparent)`,
                            borderRadius: 1,
                        }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
                        transition={{ duration: 1, delay: 0.8 }}
                    />
                </div>
            </div>

            {/* Bottom Gradient Fade */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 200,
                    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

addPropertyControls(EarthHero, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "SAVE OUR EARTH",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "The Future of Humanity Depends on Nature",
    },
    earthTexture: {
        type: ControlType.Enum,
        title: "Earth Texture",
        options: ["cyber", "hologram", "magma", "ice", "matrix", "golden"],
        optionTitles: ["Cyber", "Hologram", "Magma", "Ice", "Matrix", "Golden"],
        defaultValue: "cyber",
        displaySegmentedControl: true,
    },
    earthSize: {
        type: ControlType.Number,
        title: "Earth Size",
        defaultValue: 320,
        min: 200,
        max: 500,
        step: 10,
        unit: "px",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 20,
        min: 5,
        max: 60,
        step: 1,
        unit: "s",
    },
    starCount: {
        type: ControlType.Number,
        title: "Star Count",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 5,
    },
    energyLineCount: {
        type: ControlType.Number,
        title: "Energy Lines",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 1,
        min: 0.2,
        max: 2,
        step: 0.1,
    },
    backgroundGradient: {
        type: ControlType.String,
        title: "Background",
        defaultValue: "linear-gradient(180deg, #000000 0%, #0a0a1a 30%, #0f0f2e 60%, #0a1628 100%)",
        displayTextArea: true,
    },
    titleGradientStart: {
        type: ControlType.Color,
        title: "Title Color Start",
        defaultValue: "#00ffff",
    },
    titleGradientEnd: {
        type: ControlType.Color,
        title: "Title Color End",
        defaultValue: "#00ff88",
    },
})