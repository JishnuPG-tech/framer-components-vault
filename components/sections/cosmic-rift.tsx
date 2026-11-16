// Cinematic deep-space tunnel with vortex effect, particle trails, and interactive hover
import { useRef, useEffect, useMemo, useState, startTransition } from "react"
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
    z: number
    vx: number
    vy: number
    vz: number
    color: string
    life: number
    trailLength: number
}

interface SpaceTunnelProps {
    particleCount: number
    vortexStrength: number
    trailLength: number
    speed: number
    glowIntensity: number
    colorPalette: "neon" | "fire" | "ice" | "cosmic"
    quality: "low" | "medium" | "high"
    enableBloom: boolean
    enableChromaticAberration: boolean
    enableMotionBlur: boolean
    interactionStrength: number
}

const colorPalettes = {
    neon: ["#00D9FF", "#FF0080", "#9D00FF", "#FFFFFF"],
    fire: ["#FF4500", "#FF6B00", "#FFD700", "#FFFFFF"],
    ice: ["#00FFFF", "#4169E1", "#E0FFFF", "#FFFFFF"],
    cosmic: ["#FF1493", "#00CED1", "#9370DB", "#FFD700"]
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SpaceTunnel(props: SpaceTunnelProps) {
    const {
        particleCount = 300,
        vortexStrength = 1.5,
        trailLength = 0.8,
        speed = 1,
        glowIntensity = 2,
        colorPalette = "neon",
        quality = "high",
        enableBloom = true,
        enableChromaticAberration = true,
        enableMotionBlur = true,
        interactionStrength = 0.3
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: 0, y: 0, active: false })
    const animationFrameRef = useRef<number>()
    const isStatic = useIsStaticRenderer()
    const [isInView, setIsInView] = useState(false)

    const colors = useMemo(() => colorPalettes[colorPalette], [colorPalette])
    
    const qualitySettings = useMemo(() => ({
        low: { resolution: 0.5, particleSize: 1.5, trailPoints: 3 },
        medium: { resolution: 0.75, particleSize: 2, trailPoints: 5 },
        high: { resolution: 1, particleSize: 2.5, trailPoints: 8 }
    }[quality]), [quality])

    // Initialize particles
    const initParticle = (particle?: Particle): Particle => {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 300 + 100
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: Math.random() * 2000 + 1000,
            vx: 0,
            vy: 0,
            vz: -speed * (2 + Math.random() * 3),
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            trailLength: trailLength * (0.5 + Math.random() * 0.5)
        }
    }

    useEffect(() => {
        if (isStatic) return

        particlesRef.current = Array.from({ length: particleCount }, () => initParticle())
    }, [particleCount, isStatic])

    useEffect(() => {
        if (isStatic) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                startTransition(() => setIsInView(entry.isIntersecting))
            },
            { threshold: 0.1 }
        )

        if (canvasRef.current) {
            observer.observe(canvasRef.current)
        }

        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || isStatic || !isInView) return

        const ctx = canvas.getContext("2d", { alpha: false })
        if (!ctx) return

        const updateSize = () => {
            const dpr = window.devicePixelRatio * qualitySettings.resolution
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.scale(dpr, dpr)
        }

        updateSize()
        window.addEventListener("resize", updateSize)

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouseRef.current = {
                x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
                y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
                active: true
            }
        }

        const handleMouseLeave = () => {
            mouseRef.current.active = false
        }

        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("mouseleave", handleMouseLeave)

        const animate = () => {
            const rect = canvas.getBoundingClientRect()
            const centerX = rect.width / 2
            const centerY = rect.height / 2

            // Motion blur effect
            if (enableMotionBlur) {
                ctx.fillStyle = "rgba(0, 0, 5, 0.15)"
            } else {
                ctx.fillStyle = "rgb(0, 0, 5)"
            }
            ctx.fillRect(0, 0, rect.width, rect.height)

            particlesRef.current.forEach((particle, index) => {
                // Vortex physics
                const dx = -particle.x
                const dy = -particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                const force = vortexStrength * (1000 / (distance + 100))

                particle.vx += (dx / distance) * force * 0.1
                particle.vy += (dy / distance) * force * 0.1

                // Spiral motion
                const spiralForce = vortexStrength * 0.5
                particle.vx += -particle.y * spiralForce * 0.001
                particle.vy += particle.x * spiralForce * 0.001

                // Mouse interaction
                if (mouseRef.current.active) {
                    const mouseWorldX = mouseRef.current.x * 400
                    const mouseWorldY = mouseRef.current.y * 400
                    const mdx = mouseWorldX - particle.x
                    const mdy = mouseWorldY - particle.y
                    const mDist = Math.sqrt(mdx * mdx + mdy * mdy)
                    if (mDist < 300) {
                        const mForce = interactionStrength * (1 - mDist / 300)
                        particle.vx += (mdx / mDist) * mForce * 2
                        particle.vy += (mdy / mDist) * mForce * 2
                    }
                }

                // Update position
                particle.x += particle.vx
                particle.y += particle.vy
                particle.z += particle.vz * speed

                // Damping
                particle.vx *= 0.98
                particle.vy *= 0.98

                // Reset particle if too close or too far
                if (particle.z < 10 || distance < 20) {
                    Object.assign(particle, initParticle())
                }

                // Project to 2D
                const scale = 1000 / (particle.z + 1000)
                const x2d = particle.x * scale + centerX
                const y2d = particle.y * scale + centerY

                // Calculate previous positions for trail
                const trailPoints = qualitySettings.trailPoints
                const alpha = Math.min(1, scale * 2) * particle.life

                if (alpha > 0.05) {
                    ctx.save()

                    // Chromatic aberration
                    if (enableChromaticAberration && scale > 0.8) {
                        const offset = (1 - scale) * 3
                        
                        // Red channel
                        ctx.globalAlpha = alpha * 0.3
                        ctx.fillStyle = "#FF0000"
                        ctx.beginPath()
                        ctx.arc(x2d + offset, y2d, qualitySettings.particleSize * scale, 0, Math.PI * 2)
                        ctx.fill()

                        // Blue channel
                        ctx.fillStyle = "#0000FF"
                        ctx.beginPath()
                        ctx.arc(x2d - offset, y2d, qualitySettings.particleSize * scale, 0, Math.PI * 2)
                        ctx.fill()
                    }

                    // Draw trail
                    ctx.globalAlpha = alpha
                    const gradient = ctx.createLinearGradient(
                        x2d - particle.vx * particle.trailLength * 10,
                        y2d - particle.vy * particle.trailLength * 10,
                        x2d,
                        y2d
                    )
                    gradient.addColorStop(0, particle.color + "00")
                    gradient.addColorStop(1, particle.color)

                    ctx.strokeStyle = gradient
                    ctx.lineWidth = qualitySettings.particleSize * scale * 1.5
                    ctx.lineCap = "round"
                    ctx.beginPath()
                    ctx.moveTo(
                        x2d - particle.vx * particle.trailLength * 10,
                        y2d - particle.vy * particle.trailLength * 10
                    )
                    ctx.lineTo(x2d, y2d)
                    ctx.stroke()

                    // Core particle with glow
                    if (enableBloom) {
                        ctx.shadowBlur = 20 * glowIntensity * scale
                        ctx.shadowColor = particle.color
                    }

                    ctx.globalAlpha = alpha
                    ctx.fillStyle = particle.color
                    ctx.beginPath()
                    ctx.arc(x2d, y2d, qualitySettings.particleSize * scale, 0, Math.PI * 2)
                    ctx.fill()

                    // Bright center
                    ctx.globalAlpha = alpha * 0.8
                    ctx.fillStyle = "#FFFFFF"
                    ctx.beginPath()
                    ctx.arc(x2d, y2d, qualitySettings.particleSize * scale * 0.4, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.restore()
                }
            })

            // Vortex center glow
            if (enableBloom) {
                ctx.save()
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100)
                gradient.addColorStop(0, `rgba(255, 255, 255, ${0.1 * glowIntensity})`)
                gradient.addColorStop(0.5, `rgba(100, 150, 255, ${0.05 * glowIntensity})`)
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
                ctx.fillStyle = gradient
                ctx.fillRect(centerX - 100, centerY - 100, 200, 200)
                ctx.restore()
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            window.removeEventListener("resize", updateSize)
            canvas.removeEventListener("mousemove", handleMouseMove)
            canvas.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [
        isStatic,
        isInView,
        vortexStrength,
        speed,
        glowIntensity,
        colors,
        qualitySettings,
        enableBloom,
        enableChromaticAberration,
        enableMotionBlur,
        interactionStrength,
        trailLength
    ])

    // Static preview
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: "radial-gradient(circle at center, #001a33 0%, #000000 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#00D9FF",
                    fontSize: 24,
                    fontWeight: 600,
                    textShadow: "0 0 20px #00D9FF"
                }}
            >
                Space Tunnel Vortex
            </div>
        )
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                background: "#000005"
            }}
        />
    )
}

addPropertyControls(SpaceTunnel, {
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        defaultValue: 300,
        min: 50,
        max: 1000,
        step: 50,
        displayStepper: true
    },
    vortexStrength: {
        type: ControlType.Number,
        title: "Vortex Strength",
        defaultValue: 1.5,
        min: 0.5,
        max: 5,
        step: 0.1
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        defaultValue: 0.8,
        min: 0.1,
        max: 2,
        step: 0.1
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 2,
        min: 0,
        max: 5,
        step: 0.5
    },
    colorPalette: {
        type: ControlType.Enum,
        title: "Color Palette",
        options: ["neon", "fire", "ice", "cosmic"],
        optionTitles: ["Neon", "Fire", "Ice", "Cosmic"],
        defaultValue: "neon",
        displaySegmentedControl: true
    },
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        options: ["low", "medium", "high"],
        optionTitles: ["Low", "Medium", "High"],
        defaultValue: "high",
        displaySegmentedControl: true
    },
    enableBloom: {
        type: ControlType.Boolean,
        title: "Bloom Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    enableChromaticAberration: {
        type: ControlType.Boolean,
        title: "Chromatic Aberration",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    enableMotionBlur: {
        type: ControlType.Boolean,
        title: "Motion Blur",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    interactionStrength: {
        type: ControlType.Number,
        title: "Interaction Strength",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1
    }
})
