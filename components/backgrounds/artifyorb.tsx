import * as React from "react"
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
 * ARTIFY ORB ANIMATION
 * A glowing orb with floating stars that reacts to mouse movement.
 *
 * -- HOW TO CUSTOMIZE IN CODE --
 * All key configuration values are either props (editable in Framer)
 * or constants defined inside the component or Star class.
 * Look for comments marked with "CONFIG" to find tweakable values.
 *
 * @framerSupported
 */

interface ArtifyOrbProps {
    width?: number
    height?: number
    style?: React.CSSProperties
    className?: string
    orbColor: string
    orbPositionX: number
    orbPositionY: number
    starColor: string
    starColor2: string
    starBaseSize: number
    starFuzziness: number
    backgroundColor: string
    orbSize: number
    starCount: number
}

export default function ArtifyOrb(props: ArtifyOrbProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const orbRef = React.useRef<HTMLDivElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const canvas = canvasRef.current
        const orb = orbRef.current
        const container = containerRef.current
        if (!canvas || !orb || !container) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let width = container.clientWidth
        let height = container.clientHeight
        let stars: Star[] = []
        let animationFrameId: number

        // Mouse Parallax State
        // This tracks the current mouse position relative to the center of the screen
        let mouseX = 0
        let mouseY = 0
        // "Target" values are used for smooth interpolation (easing)
        let targetX = 0
        let targetY = 0

        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2

        // --- STAR CLASS ---
        // Represents a single floating dot/star
        class Star {
            x!: number
            y!: number
            size!: number
            baseAlpha!: number // Starting transparency
            alpha!: number // Current transparency (some flicker added)
            speedX!: number
            speedY!: number
            flickerSpeed!: number
            flickerAngle!: number
            useSecondaryColor!: boolean

            constructor() {
                // Initialize with random flicker starting point
                this.flickerAngle = Math.random() * Math.PI * 2
                this.reset()
            }

            // Resets a star's position and properties.
            // Called on creation and when a star drifts too far away.
            reset() {
                // CONFIG: Origin point for stars.
                // Center matches the Orb's position exactly.
                const orbX = width / 2 + props.orbPositionX
                // Use the explicit Top position + radius to find center
                const orbY = props.orbPositionY + props.orbSize / 2

                // CONFIG: Spawn Area
                // Random point in circle around the origin
                const angle = Math.random() * Math.PI * 2
                // Radius: spread stars out up to half the orb's size
                const radius = Math.sqrt(Math.random()) * (props.orbSize / 2)

                this.x = orbX + Math.cos(angle) * radius
                this.y = orbY + Math.sin(angle) * radius

                // CONFIG: Appearance
                // Size: Random based on starBaseSize prop
                this.size = Math.random() * props.starBaseSize + 0.5

                // Brightness: Ignored now, using full sine wave cycle for "pop in/out"
                this.baseAlpha = 1
                this.alpha = 0

                // Color Selection: 50/50 chance
                this.useSecondaryColor = Math.random() > 0.5

                // CONFIG: Movement Speed
                // Greatly reduced speed for "drifting" effect rather than "flying"
                // Was 0.2, now 0.05
                this.speedX = (Math.random() - 0.5) * 0.05
                this.speedY = (Math.random() - 0.5) * 0.05

                // CONFIG: Twinkle Speed
                // Speed of the sine wave used for alpha fluctuation
                this.flickerSpeed = Math.random() * 0.02 + 0.005
            }

            update() {
                // Move the star
                this.x += this.speedX
                this.y += this.speedY

                // Flicker effect
                this.flickerAngle += this.flickerSpeed
                // CONFIG: Flicker Intensity
                // Full cycle from 0 to 1 and back to 0 (sine wave mapped to 0-1)
                // "Pop in and out" effect
                this.alpha = (Math.sin(this.flickerAngle) + 1) / 2

                // Check bounds: if too far from orb center, reset
                const orbX = width / 2 + props.orbPositionX
                const orbY = props.orbPositionY + props.orbSize / 2
                const dist = Math.hypot(this.x - orbX, this.y - orbY)

                // CONFIG: Respawn Distance
                // Stars respawn if they drift more than (OrbRadius + 100px) away
                if (dist > props.orbSize / 2 + 100) {
                    this.reset()
                }
            }

            draw(context: CanvasRenderingContext2D) {
                // Draw the star
                context.save()

                // Use globalAlpha to apply the flicker effect to whatever color is chosen
                context.globalAlpha = this.alpha

                // Use the color prop based on selection
                context.fillStyle = this.useSecondaryColor
                    ? props.starColor2
                    : props.starColor

                // Apply fuzziness if specified
                if (props.starFuzziness > 0) {
                    context.filter = `blur(${props.starFuzziness}px)`
                }

                context.beginPath()
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                context.fill()
                context.restore()
            }
        }

        // --- INIT & RESIZE ---
        const initStars = () => {
            stars = []
            for (let i = 0; i < props.starCount; i++) {
                stars.push(new Star())
            }
        }

        const resize = () => {
            if (container && canvas && ctx) {
                const rect = container.getBoundingClientRect()
                width = rect.width
                height = rect.height

                // High-DPI Support
                const dpr = window.devicePixelRatio || 1
                canvas.width = width * dpr
                canvas.height = height * dpr

                // Scale context to match logical pixels
                ctx.scale(dpr, dpr)

                // Reset stars (optional, but ensures they are placed correctly)
                initStars()
            }
        }

        // Use ResizeObserver to handle container size changes
        const resizeObserver = new ResizeObserver((entries) => {
            resize()
        })
        resizeObserver.observe(container)

        // --- ANIMATION LOOP ---
        const animate = () => {
            // Clear entire canvas
            ctx.clearRect(0, 0, width, height)

            // Update and draw all stars
            stars.forEach((star) => {
                star.update()
                star.draw(ctx)
            })

            // Parallax Logic
            targetX += (mouseX - targetX) * 0.1
            targetY += (mouseY - targetY) * 0.1

            const orbFactor = 0.05 // Orb moves 5% of mouse distance
            const starsFactor = 0.02 // Stars move 2% of mouse distance

            if (orb) {
                // Move orb
                orb.style.transform = `translate(calc(-50% + ${targetX * orbFactor}px), ${targetY * orbFactor}px)`
            }
            if (canvas) {
                // Move stars container
                canvas.style.transform = `translate(${targetX * starsFactor}px, ${targetY * starsFactor}px)`
            }

            animationFrameId = requestAnimationFrame(animate)
        }

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX - centerX
            mouseY = e.clientY - centerY
        }

        window.addEventListener("mousemove", onMouseMove)

        // Initial Start
        resize()
        animate()

        // Cleanup on unmount
        return () => {
            window.removeEventListener("mousemove", onMouseMove)
            resizeObserver.disconnect()
            cancelAnimationFrame(animationFrameId)
        }
    }, [
        props.orbSize,
        props.starCount,
        props.orbColor,
        props.backgroundColor,
        props.starColor,
        props.starColor2,
        props.starBaseSize,
        props.starFuzziness,
        props.orbPositionX,
        props.orbPositionY,
    ])

    // --- CSS STYLES (Inline for React/Framer) ---
    const containerStyle: React.CSSProperties = {
        width: props.width || 600,
        height: props.height || 400,
        position: "relative",
        background: props.backgroundColor,
        overflow: "hidden",
        ...props.style,
    }

    const orbStyle: React.CSSProperties = {
        position: "absolute",
        // Orb vertical position
        top: props.orbPositionY,
        left: "50%",
        width: props.orbSize,
        height: props.orbSize,
        borderRadius: "50%",
        // Gradient Construction
        background: `radial-gradient(circle, ${props.orbColor} 0%, transparent 70%)`,
        // CONFIG: Blur Amount
        filter: "blur(80px)",
        opacity: 0.6,
        pointerEvents: "none",
        willChange: "transform",
        transform: `translateX(-50%) translateX(${props.orbPositionX}px)`,
    }

    const canvasStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
    }

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            className={props.className}
        >
            <div ref={orbRef} style={orbStyle} />
            <canvas ref={canvasRef} style={canvasStyle} />
        </div>
    )
}

// Default props for Framer drag-and-drop usage
ArtifyOrb.defaultProps = {
    width: 1200,
    height: 600,
    orbColor: "#FAAD93",
    orbPositionX: 0,
    orbPositionY: 100,
    starColor: "#FFFFFF",
    starColor2: "#FFFFFF",
    starBaseSize: 1,
    starFuzziness: 0,
    backgroundColor: "#050505",
    orbSize: 1200,
    starCount: 150,
}

// Controls visible in Framer UI
addPropertyControls(ArtifyOrb, {
    orbColor: {
        type: ControlType.Color,
        title: "Orb Color",
        defaultValue: "#FAAD93",
        description: "The main gradient color of the center orb.",
    },
    orbPositionX: {
        type: ControlType.Number,
        title: "Orb Offset X",
        defaultValue: 0,
        min: -1000,
        max: 1000,
        step: 10,
        description: "Move the orb horizontally from the center.",
    },
    orbPositionY: {
        type: ControlType.Number,
        title: "Orb Top (Y)",
        defaultValue: 100,
        min: -1000,
        max: 1000,
        step: 10,
        description: "Move the orb vertically (distance from top).",
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FFFFFF",
        description: "Primary color of the stars.",
    },
    starColor2: {
        type: ControlType.Color,
        title: "Star Color 2",
        defaultValue: "#FFFFFF",
        description:
            "Secondary color. Stars randomly pick this 50% of the time.",
    },
    starBaseSize: {
        type: ControlType.Number,
        title: "Star Size",
        defaultValue: 1,
        min: 0.1,
        max: 20,
        step: 0.1,
        description: "Base size multiplier. Lower values = tinier stars.",
    },
    starFuzziness: {
        type: ControlType.Number,
        title: "Fuzziness",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.5,
        description: "Blur amount. Higher values = glowier/softer stars.",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050505",
        description: "Background color of the entire container.",
    },
    orbSize: {
        type: ControlType.Number,
        title: "Orb Size",
        defaultValue: 1200,
        min: 100,
        max: 3000,
        step: 50,
        description: "Diameter of the glowing orb.",
    },
    starCount: {
        type: ControlType.Number,
        title: "Star Count",
        defaultValue: 150,
        min: 0,
        max: 1000,
        description:
            "Number of stars to render. Caution: High numbers may affect performance.",
    },
})
