// Animated particles background with customizable particle count, colors, and movement
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


interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    color: string
}

interface ParticlesBackgroundProps {
    particleCount: number
    particleSize: number
    speed: number
    opacity: number
    backgroundColor: string
    connectionLines: boolean
    connectionDistance: number
    connectionOpacity: number
    density: number
    style?: CSSProperties
}

/**
 * Animated particles background with floating particles and optional connection lines
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ParticlesBackground(props: ParticlesBackgroundProps) {
    const {
        particleCount = 50,
        particleSize = 2,
        speed = 1,
        opacity = 0.8,
        backgroundColor = "#000000",
        connectionLines = false,
        connectionDistance = 100,
        connectionOpacity = 0.3,
        density = 1,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>()
    const particlesRef = useRef<Particle[]>([])
    const isStatic = useIsStaticRenderer()

    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

    // Initialize particles
    const initializeParticles = (width: number, height: number) => {
        const particles: Particle[] = []
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                size: Math.random() * particleSize + 1,
                opacity: Math.random() * opacity + 0.1,
                color: "#FFFFFF",
            })
        }
        particlesRef.current = particles
    }

    // Update particle positions
    const updateParticles = (width: number, height: number) => {
        particlesRef.current.forEach((particle) => {
            // Apply real-time speed changes
            const currentSpeed = speed * density
            particle.vx = (particle.vx / Math.abs(particle.vx || 1)) * currentSpeed * (Math.random() * 0.5 + 0.75)
            particle.vy = (particle.vy / Math.abs(particle.vy || 1)) * currentSpeed * (Math.random() * 0.5 + 0.75)
            
            particle.x += particle.vx
            particle.y += particle.vy

            // Wrap around edges
            if (particle.x < 0) particle.x = width
            if (particle.x > width) particle.x = 0
            if (particle.y < 0) particle.y = height
            if (particle.y > height) particle.y = 0
        })
    }

    // Draw particles and connections
    const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.clearRect(0, 0, width, height)

        // Draw connection lines
        if (connectionLines) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${connectionOpacity})`
            ctx.lineWidth = 1

            for (let i = 0; i < particlesRef.current.length; i++) {
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const dx = particlesRef.current[i].x - particlesRef.current[j].x
                    const dy = particlesRef.current[i].y - particlesRef.current[j].y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < connectionDistance) {
                        ctx.beginPath()
                        ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y)
                        ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y)
                        ctx.stroke()
                    }
                }
            }
        }

        // Draw particles
        particlesRef.current.forEach((particle) => {
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
            ctx.fill()
        })
    }

    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : "255, 255, 255"
    }

    // Animation loop
    const animate = () => {
        if (!canvasRef.current || isStatic) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        updateParticles(canvas.width, canvas.height)
        draw(ctx, canvas.width, canvas.height)

        animationRef.current = requestAnimationFrame(animate)
    }

    // Handle resize
    useEffect(() => {
        if (typeof window === "undefined") return

        const updateDimensions = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                const parent = canvasRef.current.parentElement
                const rect = parent.getBoundingClientRect()
                startTransition(() => {
                    setDimensions({ width: rect.width, height: rect.height })
                })
            }
        }

        updateDimensions()
        window.addEventListener("resize", updateDimensions)

        return () => {
            window.removeEventListener("resize", updateDimensions)
        }
    }, [])

    // Initialize and start animation
    useEffect(() => {
        if (isStatic) return

        initializeParticles(dimensions.width, dimensions.height)

        if (canvasRef.current) {
            const canvas = canvasRef.current
            canvas.width = dimensions.width
            canvas.height = dimensions.height
        }

        animate()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [dimensions, particleCount, speed, density, opacity, particleSize, connectionLines, connectionDistance, connectionOpacity, isStatic])

    if (isStatic) {
        // Static preview with some particles
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {Array.from({ length: Math.min(20, particleCount) }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: particleSize * 2,
                            height: particleSize * 2,
                            backgroundColor: "#FFFFFF",
                            borderRadius: "50%",
                            opacity: opacity * 0.8,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
                width={dimensions.width}
                height={dimensions.height}
            />
        </div>
    )
}

addPropertyControls(ParticlesBackground, {
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 1,
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
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
        title: "Particle Opacity",
        defaultValue: 0.8,
        min: 0.1,
        max: 1,
        step: 0.1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    connectionLines: {
        type: ControlType.Boolean,
        title: "Connection Lines",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    connectionDistance: {
        type: ControlType.Number,
        title: "Connection Distance",
        defaultValue: 100,
        min: 50,
        max: 200,
        step: 10,
        unit: "px",
        hidden: ({ connectionLines }) => !connectionLines,
    },
    connectionOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 0.3,
        min: 0.1,
        max: 1,
        step: 0.1,
        hidden: ({ connectionLines }) => !connectionLines,
    },
})