// Floating particles that smoothly hover and move around
import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

interface Particle {
    id: number
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    color: string
}

interface FloatingParticlesProps {
    particleCount: number
    particleSize: number
    particleColor1: string
    particleColor2: string
    particleColor3: string
    speed: number
    opacity: number
    blur: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FloatingParticles(props: FloatingParticlesProps) {
    const {
        particleCount = 20,
        particleSize = 4,
        particleColor1 = "#FFFFFF",
        particleColor2 = "#CCCCCC",
        particleColor3 = "#999999",
        speed = 1,
        opacity = 0.8,
        blur = false,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<number>()
    const [particles, setParticles] = useState<Particle[]>([])
    const [dimensions, setDimensions] = useState({ width: 400, height: 300 })
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { once: false })

    // Initialize particles
    useEffect(() => {
        if (isStatic) return

        const colors = [particleColor1, particleColor2, particleColor3]
        const newParticles: Particle[] = []
        for (let i = 0; i < particleCount; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * dimensions.width,
                y: Math.random() * dimensions.height,
                vx: (Math.random() - 0.5) * speed * 0.5,
                vy: (Math.random() - 0.5) * speed * 0.5,
                size: particleSize + Math.random() * particleSize * 0.5,
                opacity: opacity * (0.5 + Math.random() * 0.5),
                color: colors[Math.floor(Math.random() * colors.length)],
            })
        }
        startTransition(() => setParticles(newParticles))
    }, [particleCount, particleSize, particleColor1, particleColor2, particleColor3, speed, opacity, dimensions, isStatic])

    // Update dimensions when container size changes
    useEffect(() => {
        if (!containerRef.current || isStatic) return

        const updateDimensions = () => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                startTransition(() => 
                    setDimensions({ width: rect.width, height: rect.height })
                )
            }
        }

        updateDimensions()
        
        if (typeof window !== "undefined") {
            window.addEventListener("resize", updateDimensions)
            return () => window.removeEventListener("resize", updateDimensions)
        }
    }, [isStatic])

    // Animation loop
    useEffect(() => {
        if (isStatic || !isInView || particles.length === 0) return

        const animate = () => {
            startTransition(() => {
                setParticles(prevParticles => 
                    prevParticles.map(particle => {
                        let newX = particle.x + particle.vx * speed
                        let newY = particle.y + particle.vy * speed
                        let newVx = particle.vx
                        let newVy = particle.vy

                        // Bounce off edges with some randomness
                        if (newX <= 0 || newX >= dimensions.width) {
                            newVx = -newVx + (Math.random() - 0.5) * 0.1
                            newX = Math.max(0, Math.min(dimensions.width, newX))
                        }
                        if (newY <= 0 || newY >= dimensions.height) {
                            newVy = -newVy + (Math.random() - 0.5) * 0.1
                            newY = Math.max(0, Math.min(dimensions.height, newY))
                        }

                        // Add slight random movement for floating effect
                        newVx += (Math.random() - 0.5) * 0.02
                        newVy += (Math.random() - 0.5) * 0.02

                        // Limit velocity
                        const maxVel = speed * 0.8
                        newVx = Math.max(-maxVel, Math.min(maxVel, newVx))
                        newVy = Math.max(-maxVel, Math.min(maxVel, newVy))

                        return {
                            ...particle,
                            x: newX,
                            y: newY,
                            vx: newVx,
                            vy: newVy,
                        }
                    })
                )
            })

            if (isInView) {
                animationRef.current = requestAnimationFrame(animate)
            }
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isStatic, isInView, particles.length, speed, dimensions])

    if (isStatic) {
        // Static preview with some particles
        const colors = [particleColor1, particleColor2, particleColor3]
        const staticParticles = Array.from({ length: Math.min(particleCount, 10) }, (_, i) => ({
            id: i,
            x: (i * 50 + 30) % 300,
            y: (i * 30 + 40) % 200,
            size: particleSize,
            opacity: opacity,
            color: colors[i % colors.length],
        }))

        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "transparent",
                }}
            >
                {staticParticles.map(particle => (
                    <div
                        key={particle.id}
                        style={{
                            position: "absolute",
                            left: particle.x,
                            top: particle.y,
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            borderRadius: "50%",
                            opacity: particle.opacity,
                            filter: blur ? "blur(1px)" : "none",
                        }}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "transparent",
            }}
        >
            {particles.map(particle => (
                <motion.div
                    key={particle.id}
                    style={{
                        position: "absolute",
                        left: particle.x,
                        top: particle.y,
                        width: particle.size,
                        height: particle.size,
                        backgroundColor: particle.color,
                        borderRadius: "50%",
                        opacity: particle.opacity,
                        filter: blur ? "blur(1px)" : "none",
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [particle.opacity, particle.opacity * 0.7, particle.opacity],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    )
}

addPropertyControls(FloatingParticles, {
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        defaultValue: 20,
        min: 5,
        max: 300,
        step: 1,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
    },
    particleColor1: {
        type: ControlType.Color,
        title: "Particle Color 1",
        defaultValue: "#FFFFFF",
    },
    particleColor2: {
        type: ControlType.Color,
        title: "Particle Color 2",
        defaultValue: "#CCCCCC",
    },
    particleColor3: {
        type: ControlType.Color,
        title: "Particle Color 3",
        defaultValue: "#999999",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.8,
        min: 0.1,
        max: 1,
        step: 0.1,
    },
    blur: {
        type: ControlType.Boolean,
        title: "Blur Effect",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})