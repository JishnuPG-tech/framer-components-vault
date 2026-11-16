// Star cloud component with cursor-based movement controls
import { useRef, useEffect, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface StarCloudProps {
    starCount: number
    starSize: number
    starColor: string
    cloudSize: number
    baseSpeed: number
    variant: "desktop" | "phone"
    style?: React.CSSProperties
}

interface Star {
    x: number
    y: number
    z: number
    id: number
}

/**
 * Star Cloud
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function StarCloud(props: StarCloudProps) {
    const {
        starCount = 200,
        starSize = 2,
        starColor = "#FFFFFF",
        cloudSize = 1000,
        baseSpeed = 1,
        variant = "desktop",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<number>()
    const mouseRef = useRef({ x: 0, y: 0 })
    const centerRef = useRef({ x: 0, y: 0 })
    const [stars, setStars] = useState<Star[]>([])
    const isStatic = useIsStaticRenderer()

    // Generate initial stars
    const initialStars = useMemo(() => {
        return Array.from({ length: starCount }, (_, i) => ({
            x: (Math.random() - 0.5) * cloudSize,
            y: (Math.random() - 0.5) * cloudSize,
            z: Math.random() * cloudSize,
            id: i,
        }))
    }, [starCount, cloudSize])

    useEffect(() => {
        setStars(initialStars)
    }, [initialStars])

    // Update center position on resize
    useEffect(() => {
        if (isStatic) return

        const updateCenter = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                centerRef.current = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                }
            }
        }

        updateCenter()
        window.addEventListener('resize', updateCenter)
        return () => window.removeEventListener('resize', updateCenter)
    }, [isStatic])

    // Mouse tracking (only for desktop variant)
    useEffect(() => {
        if (isStatic || variant === "phone") return

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [isStatic, variant])

    // Animation loop
    useEffect(() => {
        if (isStatic) return

        const animate = () => {
            let speed: number
            let moveX = 0
            let moveY = 0
            let moveZ = 0

            if (variant === "phone") {
                // Phone variant: always move forward on Z axis at 10x speed (like cursor is in center)
                speed = baseSpeed * 10
                moveZ = speed
            } else {
                // Desktop variant: existing cursor-based logic
                const mouse = mouseRef.current
                const center = centerRef.current
                
                // Calculate distance from cursor to center
                const dx = mouse.x - center.x
                const dy = mouse.y - center.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                // Apply gradual easing for smooth transitions
                const centerZone = 50 // Distance considered "center"
                const transitionZone = 150 // Distance over which to blend movements
                
                if (distance < centerZone) {
                    // Cursor is in center - move forward on Z axis at 10x speed
                    speed = baseSpeed * 10
                    moveZ = speed
                } else if (distance < centerZone + transitionZone) {
                    // In transition zone - blend Z movement with directional movement
                    const blendFactor = (distance - centerZone) / transitionZone
                    const easedBlend = blendFactor * blendFactor * (3 - 2 * blendFactor) // Smooth step function
                    
                    // Z movement (decreases as we move away from center)
                    const zSpeed = baseSpeed * 10 * (1 - easedBlend)
                    moveZ = zSpeed
                    
                    // Directional movement (increases as we move away from center)
                    const directionalSpeed = baseSpeed * (1200 / distance) * easedBlend
                    const dirX = -dx / distance
                    const dirY = -dy / distance
                    moveX = dirX * directionalSpeed
                    moveY = dirY * directionalSpeed
                } else {
                    // Far from center - pure directional movement
                    speed = baseSpeed * (1200 / distance)
                    
                    // Normalize direction vector from cursor to center
                    const dirX = -dx / distance
                    const dirY = -dy / distance
                    
                    moveX = dirX * speed
                    moveY = dirY * speed
                }
            }

            startTransition(() => {
                setStars(prevStars => 
                    prevStars.map(star => {
                        let newX = star.x + moveX
                        let newY = star.y + moveY
                        let newZ = star.z + moveZ

                        // Wrap around boundaries
                        if (newX > cloudSize / 2) newX = -cloudSize / 2
                        if (newX < -cloudSize / 2) newX = cloudSize / 2
                        if (newY > cloudSize / 2) newY = -cloudSize / 2
                        if (newY < -cloudSize / 2) newY = cloudSize / 2
                        if (newZ > cloudSize) newZ = 0
                        if (newZ < 0) newZ = cloudSize

                        return {
                            ...star,
                            x: newX,
                            y: newY,
                            z: newZ,
                        }
                    })
                )
            })

            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isStatic, baseSpeed, cloudSize, variant])

    // Initialize center position after mount
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        
        const initializeCenter = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                centerRef.current = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                }
            }
        }

        // Use setTimeout to ensure DOM is ready
        const timeoutId = setTimeout(initializeCenter, 0)
        return () => clearTimeout(timeoutId)
    }, [isStatic])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#000000",
                overflow: "hidden",
                position: "relative",
                ...props.style,
            }}
        >
            {stars.map(star => {
                // Project 3D coordinates to 2D screen space
                const scale = 300 / (300 + star.z)
                const x = star.x * scale
                const y = star.y * scale
                const size = starSize * scale
                const opacity = Math.max(0.1, 1 - star.z / cloudSize)

                return (
                    <div
                        key={star.id}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: size,
                            height: size,
                            backgroundColor: starColor,
                            borderRadius: "50%",
                            transform: `translate(${x - size/2}px, ${y - size/2}px)`,
                            opacity,
                            pointerEvents: "none",
                        }}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(StarCloud, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["desktop", "phone"],
        optionTitles: ["Desktop", "Phone"],
        defaultValue: "desktop",
        displaySegmentedControl: true,
    },
    starCount: {
        type: ControlType.Number,
        title: "Star Count",
        defaultValue: 200,
        min: 50,
        max: 500,
        step: 10,
    },
    starSize: {
        type: ControlType.Number,
        title: "Star Size",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FFFFFF",
    },
    cloudSize: {
        type: ControlType.Number,
        title: "Cloud Size",
        defaultValue: 1000,
        min: 500,
        max: 2000,
        step: 100,
        unit: "px",
    },
    baseSpeed: {
        type: ControlType.Number,
        title: "Base Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
})