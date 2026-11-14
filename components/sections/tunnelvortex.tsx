// 3D Tunnel Vortex with rotating rings of images moving forward infinitely
// Mouse tilts camera view, rings reset when passing camera
// Includes predefined color schemes, lighting effects, and material properties
// Physics-based interactions with gravity, collisions, and realistic movements
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


interface ImageItem {
    src: string | { src: string; srcSet?: string; alt?: string }
    url: string
    hoverText?: string
}

interface CardPhysics {
    velocityX: number
    velocityY: number
    velocityZ: number
    angularVelocity: number
    mass: number
}

interface TunnelVortexProps {
    images: ImageItem[]
    ringCount: number
    cardsPerRing: number
    tunnelSpeed: number
    ringRotSpeed: number
    startRadius: number
    endRadius: number
    tunnelLength: number
    cameraMouseStrength: number
    cardSize: number
    borderRadius: number
    fadeDistance: number
    backgroundColor: string
    perspective: number
    colorScheme: "default" | "neon" | "sunset" | "ocean" | "forest" | "cyberpunk"
    lightingEffect: "none" | "glow" | "spotlight" | "ambient"
    material: "default" | "metallic" | "glass" | "matte"
    onCardClick?: (cardData: { image: ImageItem; ringIndex: number; cardIndex: number }) => void
    enableEntranceAnimation: boolean
    entranceAnimationType: "fadeIn" | "spiral" | "zoomIn" | "ripple"
    entranceAnimationDuration: number
    enableManualCamera: boolean
    cameraPositionX: number
    cameraPositionY: number
    cameraPositionZ: number
    cameraRotationX: number
    cameraRotationY: number
    cameraRotationZ: number
    enablePhysics: boolean
    gravity: number
    bounce: number
    friction: number
    collisionResponse: boolean
    interactionForce: number

    enableHoverTooltip: boolean
    hoverTooltipDefaultText: string
    hoverTooltipBackground: string
    hoverTooltipTextColor: string
    hoverTooltipFont: any
    hoverTooltipPadding: number
    hoverTooltipRadius: number
    hoverTooltipOffsetX: number
    hoverTooltipOffsetY: number
}

/**
 * 3D Tunnel Vortex
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TunnelVortex(props: TunnelVortexProps) {
    const {
        images,
        ringCount,
        cardsPerRing,
        tunnelSpeed,
        ringRotSpeed,
        startRadius,
        endRadius,
        tunnelLength,
        cameraMouseStrength,
        cardSize,
        borderRadius,
        fadeDistance,
        backgroundColor,
        perspective,
        colorScheme,
        lightingEffect,
        material,
        onCardClick,
        enableEntranceAnimation,
        entranceAnimationType,
        entranceAnimationDuration,
        enableManualCamera,
        cameraPositionX,
        cameraPositionY,
        cameraPositionZ,
        cameraRotationX,
        cameraRotationY,
        cameraRotationZ,
        enablePhysics,
        gravity,
        bounce,
        friction,
        collisionResponse,
        interactionForce,

        enableHoverTooltip,
        hoverTooltipDefaultText,
        hoverTooltipBackground,
        hoverTooltipTextColor,
        hoverTooltipFont,
        hoverTooltipPadding,
        hoverTooltipRadius,
        hoverTooltipOffsetX,
        hoverTooltipOffsetY,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const rafRef = useRef<number>()
    const timeRef = useRef(0)
    const mouseRef = useRef({ x: 0, y: 0 })
    const [isClient, setIsClient] = useState(false)
    const [hoveredCardKey, setHoveredCardKey] = useState<string | null>(null)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
    const [animationProgress, setAnimationProgress] = useState(enableEntranceAnimation ? 0 : 1)
    const animationStartTime = useRef<number>(0)

    // Initialize ring positions
    const ringPositions = useRef<number[]>([])
    
    // Physics state for each card
    const cardPhysics = useRef<Map<string, CardPhysics>>(new Map())
    const cardPositions = useRef<Map<string, { x: number; y: number; z: number; rotation: number }>>(new Map())
    
    useEffect(() => {
        startTransition(() => setIsClient(true))
        
        // Initialize ring Z positions evenly distributed
        ringPositions.current = Array.from({ length: ringCount }, (_, i) => {
            return -tunnelLength + (i / ringCount) * tunnelLength * 2
        })

        // Initialize physics for each card
        if (enablePhysics) {
            for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
                for (let cardIndex = 0; cardIndex < cardsPerRing; cardIndex++) {
                    const key = `${ringIndex}-${cardIndex}`
                    cardPhysics.current.set(key, {
                        velocityX: 0,
                        velocityY: 0,
                        velocityZ: 0,
                        angularVelocity: 0,
                        mass: 1,
                    })
                    cardPositions.current.set(key, {
                        x: 0,
                        y: 0,
                        z: 0,
                        rotation: 0,
                    })
                }
            }
        }
    }, [ringCount, tunnelLength, cardsPerRing, enablePhysics])

    // Mouse move handler
    useEffect(() => {
        if (typeof window === "undefined") return

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
            mouseRef.current = { x, y }
            
            // Update tooltip position
            if (enableHoverTooltip && hoveredCardKey) {
                startTransition(() => setTooltipPosition({ x: e.clientX, y: e.clientY }))
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [enableHoverTooltip, hoveredCardKey])

    // Entrance animation effect
    useEffect(() => {
        if (!enableEntranceAnimation || !isClient || typeof window === "undefined") {
            startTransition(() => setAnimationProgress(1))
            return
        }

        animationStartTime.current = performance.now()
        
        const animateEntrance = (currentTime: number) => {
            const elapsed = currentTime - animationStartTime.current
            const progress = Math.min(elapsed / (entranceAnimationDuration * 1000), 1)
            
            // Easing function for smooth animation
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2
            
            startTransition(() => setAnimationProgress(eased))
            
            if (progress < 1) {
                requestAnimationFrame(animateEntrance)
            }
        }
        
        requestAnimationFrame(animateEntrance)
    }, [enableEntranceAnimation, entranceAnimationDuration, isClient])

    // Animation loop
    useEffect(() => {
        if (typeof window === "undefined" || !isClient) return

        let lastTime = performance.now()

        const animate = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) / 1000
            lastTime = currentTime

            timeRef.current += deltaTime

            // Update ring positions
            for (let i = 0; i < ringPositions.current.length; i++) {
                ringPositions.current[i] += tunnelSpeed * deltaTime * 100

                // Reset ring to far end when it passes camera
                if (ringPositions.current[i] > tunnelLength) {
                    ringPositions.current[i] = -tunnelLength
                    
                    // Reset physics for cards in this ring
                    if (enablePhysics) {
                        for (let cardIndex = 0; cardIndex < cardsPerRing; cardIndex++) {
                            const key = `${i}-${cardIndex}`
                            const physics = cardPhysics.current.get(key)
                            if (physics) {
                                physics.velocityX = 0
                                physics.velocityY = 0
                                physics.velocityZ = 0
                                physics.angularVelocity = 0
                            }
                            cardPositions.current.set(key, { x: 0, y: 0, z: 0, rotation: 0 })
                        }
                    }
                }
            }

            // Update DOM
            if (containerRef.current) {
                const scene = containerRef.current.querySelector(".scene") as HTMLElement
                if (scene) {
                    // Apply camera transform based on mode
                    if (enableManualCamera) {
                        // Manual camera control mode
                        scene.style.transform = `
                            translate3d(${cameraPositionX}px, ${cameraPositionY}px, ${cameraPositionZ}px)
                            rotateX(${cameraRotationX}deg)
                            rotateY(${cameraRotationY}deg)
                            rotateZ(${cameraRotationZ}deg)
                        `
                    } else {
                        // Mouse tilt mode
                        const rotateX = -mouseRef.current.y * cameraMouseStrength
                        const rotateY = mouseRef.current.x * cameraMouseStrength
                        scene.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
                    }
                }

                // Update each ring
                ringPositions.current.forEach((z, ringIndex) => {
                    const ring = containerRef.current?.querySelector(`[data-ring="${ringIndex}"]`) as HTMLElement
                    if (!ring) return

                    // Calculate radius based on Z position (perspective effect)
                    const progress = (z + tunnelLength) / (tunnelLength * 2)
                    const radius = startRadius + (endRadius - startRadius) * progress

                    // Update each card in the ring
                    const cards = ring.querySelectorAll(".card")
                    cards.forEach((card, cardIndex) => {
                        const element = card as HTMLElement
                        const key = `${ringIndex}-${cardIndex}`
                        const angle = timeRef.current * ringRotSpeed + (cardIndex / cardsPerRing) * Math.PI * 2
                        
                        let x = Math.cos(angle) * radius
                        let y = Math.sin(angle) * radius
                        let finalZ = z
                        let finalRotation = -angle * (180 / Math.PI)

                        // Apply physics if enabled
                        if (enablePhysics) {
                            const physics = cardPhysics.current.get(key)
                            const position = cardPositions.current.get(key)
                            
                            if (physics && position) {
                                // Apply gravity
                                physics.velocityY += gravity * deltaTime * 100
                                
                                // Apply friction
                                physics.velocityX *= (1 - friction * deltaTime)
                                physics.velocityY *= (1 - friction * deltaTime)
                                physics.velocityZ *= (1 - friction * deltaTime)
                                physics.angularVelocity *= (1 - friction * deltaTime)
                                
                                // Update positions
                                position.x += physics.velocityX * deltaTime
                                position.y += physics.velocityY * deltaTime
                                position.z += physics.velocityZ * deltaTime
                                position.rotation += physics.angularVelocity * deltaTime
                                
                                // Collision detection with boundaries
                                if (collisionResponse) {
                                    const maxRadius = endRadius * 0.9
                                    const currentRadius = Math.sqrt((x + position.x) ** 2 + (y + position.y) ** 2)
                                    
                                    // Radial boundary collision
                                    if (currentRadius > maxRadius) {
                                        const angle = Math.atan2(y + position.y, x + position.x)
                                        const overlap = currentRadius - maxRadius
                                        
                                        // Push back
                                        position.x -= Math.cos(angle) * overlap
                                        position.y -= Math.sin(angle) * overlap
                                        
                                        // Bounce
                                        const normalX = Math.cos(angle)
                                        const normalY = Math.sin(angle)
                                        const dotProduct = physics.velocityX * normalX + physics.velocityY * normalY
                                        
                                        physics.velocityX -= 2 * dotProduct * normalX * bounce
                                        physics.velocityY -= 2 * dotProduct * normalY * bounce
                                        physics.angularVelocity += (Math.random() - 0.5) * 100 * bounce
                                    }
                                    
                                    // Vertical boundaries
                                    const maxY = 300
                                    if (Math.abs(y + position.y) > maxY) {
                                        position.y = Math.sign(y + position.y) * maxY - y
                                        physics.velocityY *= -bounce
                                        physics.angularVelocity += (Math.random() - 0.5) * 100 * bounce
                                    }
                                }
                                
                                // Card-to-card collision detection
                                if (collisionResponse) {
                                    cards.forEach((otherCard, otherIndex) => {
                                        if (otherIndex === cardIndex) return
                                        
                                        const otherKey = `${ringIndex}-${otherIndex}`
                                        const otherPosition = cardPositions.current.get(otherKey)
                                        const otherPhysics = cardPhysics.current.get(otherKey)
                                        
                                        if (otherPosition && otherPhysics) {
                                            const otherAngle = timeRef.current * ringRotSpeed + (otherIndex / cardsPerRing) * Math.PI * 2
                                            const otherX = Math.cos(otherAngle) * radius + otherPosition.x
                                            const otherY = Math.sin(otherAngle) * radius + otherPosition.y
                                            
                                            const dx = (x + position.x) - otherX
                                            const dy = (y + position.y) - otherY
                                            const dz = (finalZ + position.z) - (z + otherPosition.z)
                                            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
                                            const minDistance = cardSize * 0.8
                                            
                                            if (distance < minDistance && distance > 0) {
                                                // Collision detected
                                                const overlap = minDistance - distance
                                                const nx = dx / distance
                                                const ny = dy / distance
                                                const nz = dz / distance
                                                
                                                // Separate cards
                                                const separation = overlap / 2
                                                position.x += nx * separation
                                                position.y += ny * separation
                                                position.z += nz * separation
                                                
                                                // Exchange velocities (simplified elastic collision)
                                                const relativeVelX = physics.velocityX - otherPhysics.velocityX
                                                const relativeVelY = physics.velocityY - otherPhysics.velocityY
                                                const relativeVelZ = physics.velocityZ - otherPhysics.velocityZ
                                                
                                                const dotProduct = relativeVelX * nx + relativeVelY * ny + relativeVelZ * nz
                                                
                                                if (dotProduct < 0) {
                                                    const impulse = dotProduct * bounce
                                                    physics.velocityX -= impulse * nx
                                                    physics.velocityY -= impulse * ny
                                                    physics.velocityZ -= impulse * nz
                                                    
                                                    physics.angularVelocity += (Math.random() - 0.5) * 50 * bounce
                                                }
                                            }
                                        }
                                    })
                                }
                                
                                // Apply physics offsets
                                x += position.x
                                y += position.y
                                finalZ += position.z
                                finalRotation += position.rotation
                            }
                        }

                        // Calculate opacity based on distance
                        let opacity = 1
                        if (finalZ > fadeDistance) {
                            opacity = Math.max(0, 1 - (finalZ - fadeDistance) / (tunnelLength - fadeDistance))
                        } else if (finalZ < -tunnelLength * 0.5) {
                            opacity = Math.max(0, (finalZ + tunnelLength) / (tunnelLength * 0.5))
                        }

                        // Apply entrance animation opacity multiplier
                        if (enableEntranceAnimation && animationProgress < 1) {
                            const cardDelay = (ringIndex * cardsPerRing + cardIndex) / (ringCount * cardsPerRing)
                            const cardProgress = Math.max(0, Math.min(1, (animationProgress - cardDelay * 0.5) / 0.5))
                            opacity *= cardProgress
                        }

                        element.style.transform = `translate3d(${x}px, ${y}px, ${finalZ}px) rotateZ(${finalRotation}deg)`
                        element.style.opacity = opacity.toString()
                    })
                })
            }

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [
        isClient,
        ringCount,
        cardsPerRing,
        tunnelSpeed,
        ringRotSpeed,
        startRadius,
        endRadius,
        tunnelLength,
        cameraMouseStrength,
        fadeDistance,
        enableEntranceAnimation,
        animationProgress,
        enableManualCamera,
        cameraPositionX,
        cameraPositionY,
        cameraPositionZ,
        cameraRotationX,
        cameraRotationY,
        cameraRotationZ,
        enablePhysics,
        gravity,
        bounce,
        friction,
        collisionResponse,
        cardSize,
    ])

    // Color scheme definitions
    const colorSchemes = useMemo(() => ({
        default: {
            background: backgroundColor,
            cardOverlay: "transparent",
            glowColor: "rgba(255, 255, 255, 0.3)",
        },
        neon: {
            background: "#0a0a0a",
            cardOverlay: "linear-gradient(135deg, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.2))",
            glowColor: "rgba(255, 0, 255, 0.6)",
        },
        sunset: {
            background: "#1a0a0a",
            cardOverlay: "linear-gradient(135deg, rgba(255, 100, 0, 0.3), rgba(255, 200, 0, 0.2))",
            glowColor: "rgba(255, 150, 0, 0.5)",
        },
        ocean: {
            background: "#001a2e",
            cardOverlay: "linear-gradient(135deg, rgba(0, 100, 255, 0.2), rgba(0, 255, 200, 0.2))",
            glowColor: "rgba(0, 200, 255, 0.5)",
        },
        forest: {
            background: "#0a1a0a",
            cardOverlay: "linear-gradient(135deg, rgba(50, 200, 50, 0.2), rgba(150, 255, 100, 0.2))",
            glowColor: "rgba(100, 255, 100, 0.5)",
        },
        cyberpunk: {
            background: "#0d0221",
            cardOverlay: "linear-gradient(135deg, rgba(255, 0, 100, 0.3), rgba(0, 255, 255, 0.3))",
            glowColor: "rgba(255, 0, 200, 0.7)",
        },
    }), [backgroundColor])

    // Lighting effect styles
    const getLightingStyle = (effect: string, scheme: any) => {
        switch (effect) {
            case "glow":
                return {
                    boxShadow: `0 0 20px ${scheme.glowColor}, 0 0 40px ${scheme.glowColor}`,
                    filter: "brightness(1.2)",
                }
            case "spotlight":
                return {
                    boxShadow: `0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)`,
                    filter: "contrast(1.2)",
                }
            case "ambient":
                return {
                    boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5)`,
                    filter: "brightness(0.9) saturate(1.2)",
                }
            default:
                return {}
        }
    }

    // Material property styles
    const getMaterialStyle = (mat: string) => {
        switch (mat) {
            case "metallic":
                return {
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
                    backdropFilter: "blur(2px)",
                }
            case "glass":
                return {
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                }
            case "matte":
                return {
                    filter: "saturate(0.8) contrast(0.9)",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
                }
            default:
                return {}
        }
    }

    const currentScheme = colorSchemes[colorScheme]

    // Generate rings and cards
    const rings = useMemo(() => {
        return Array.from({ length: ringCount }, (_, ringIndex) => {
            const cards = Array.from({ length: cardsPerRing }, (_, cardIndex) => {
                const imageIndex = (ringIndex * cardsPerRing + cardIndex) % images.length
                const image = images[imageIndex]
                
                // Handle ResponsiveImage object or string
                const imageSrc = typeof image.src === "string" ? image.src : image.src?.src || ""
                const hoverText = (image.hoverText && image.hoverText.trim().length > 0) ? image.hoverText : hoverTooltipDefaultText

                const handleCardClick = () => {
                    // Apply physics impulse on click
                    if (enablePhysics) {
                        const key = `${ringIndex}-${cardIndex}`
                        const physics = cardPhysics.current.get(key)
                        if (physics) {
                            // Random impulse direction
                            const angle = Math.random() * Math.PI * 2
                            physics.velocityX += Math.cos(angle) * interactionForce * 100
                            physics.velocityY += Math.sin(angle) * interactionForce * 100
                            physics.velocityZ += (Math.random() - 0.5) * interactionForce * 50
                            physics.angularVelocity += (Math.random() - 0.5) * interactionForce * 200
                        }
                    }
                    
                    // Call custom event handler if provided
                    if (onCardClick) {
                        onCardClick({
                            image: image,
                            ringIndex: ringIndex,
                            cardIndex: cardIndex,
                        })
                    }
                    
                    // Navigate to URL if provided
                    if (image.url && typeof window !== "undefined") {
                        window.open(image.url, "_blank")
                    }
                }

                const lightingStyle = getLightingStyle(lightingEffect, currentScheme)
                const materialStyle = getMaterialStyle(material)

                // Calculate entrance animation styles
                const getEntranceStyle = () => {
                    if (!enableEntranceAnimation || animationProgress >= 1) {
                        return {}
                    }

                    const cardDelay = (ringIndex * cardsPerRing + cardIndex) / (ringCount * cardsPerRing)
                    const cardProgress = Math.max(0, Math.min(1, (animationProgress - cardDelay * 0.5) / 0.5))

                    switch (entranceAnimationType) {
                        case "fadeIn":
                            return {
                                opacity: cardProgress,
                                transform: `scale(${0.5 + cardProgress * 0.5})`,
                            }
                        case "spiral":
                            return {
                                opacity: cardProgress,
                                transform: `rotate(${(1 - cardProgress) * 360}deg) scale(${cardProgress})`,
                            }
                        case "zoomIn":
                            return {
                                opacity: cardProgress,
                                transform: `scale(${cardProgress}) translateZ(${(1 - cardProgress) * -500}px)`,
                            }
                        case "ripple":
                            const rippleDelay = ringIndex / ringCount
                            const rippleProgress = Math.max(0, Math.min(1, (animationProgress - rippleDelay * 0.7) / 0.3))
                            return {
                                opacity: rippleProgress,
                                transform: `scale(${0.3 + rippleProgress * 0.7})`,
                            }
                        default:
                            return {}
                    }
                }

                const entranceStyle = getEntranceStyle()

                return (
                    <div
                        key={`${ringIndex}-${cardIndex}`}
                        className="card"
                        data-ring-index={ringIndex}
                        data-card-index={cardIndex}
                        style={{
                            position: "absolute",
                            width: cardSize,
                            height: cardSize,
                            borderRadius: borderRadius,
                            overflow: enableHoverTooltip ? "visible" : "hidden",
                            cursor: image.url || onCardClick ? "pointer" : "default",
                            transformStyle: "preserve-3d",
                            backfaceVisibility: "hidden",
                            transition: enableEntranceAnimation && animationProgress < 1 
                                ? `opacity ${entranceAnimationDuration * 0.3}s ease-out, transform ${entranceAnimationDuration * 0.3}s ease-out`
                                : "none",
                            ...lightingStyle,
                            ...materialStyle,
                        }}
                        onClick={handleCardClick}
                        onMouseEnter={() => {
                            if (!enableHoverTooltip) return
                            const k = `${ringIndex}-${cardIndex}`
                            startTransition(() => setHoveredCardKey(k))
                        }}
                        onMouseLeave={() => {
                            if (!enableHoverTooltip) return
                            startTransition(() => setHoveredCardKey(null))
                        }}
                        onMouseMove={(e) => {
                            if (!enableHoverTooltip) return
                            startTransition(() => setTooltipPosition({ x: e.clientX, y: e.clientY }))
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "hidden",
                                borderRadius: "inherit",
                            }}
                        >
                            <img
                                src={imageSrc}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                }}
                            />
                            {currentScheme.cardOverlay !== "transparent" && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        background: currentScheme.cardOverlay,
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )
            })

            return (
                <div key={ringIndex} data-ring={ringIndex} style={{ transformStyle: "preserve-3d" }}>
                    {cards}
                </div>
            )
        })
    }, [ringCount, cardsPerRing, images, cardSize, borderRadius, onCardClick, lightingEffect, material, currentScheme, enableEntranceAnimation, entranceAnimationType, entranceAnimationDuration, animationProgress])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: currentScheme.background,
                perspective: perspective,
                overflow: "hidden",
                position: "relative",
            }}
        >
            <div
                className="scene"
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.1s ease-out",
                }}
            >
                {rings}
            </div>
            
            {enableHoverTooltip && hoveredCardKey !== null && isClient && typeof window !== "undefined" && (
                <div
                    style={{
                        position: "fixed",
                        left: tooltipPosition.x + hoverTooltipOffsetX,
                        top: tooltipPosition.y + hoverTooltipOffsetY,
                        transform: "translate(10px, 10px)",
                        padding: `${Math.max(0, hoverTooltipPadding)}px`,
                        borderRadius: hoverTooltipRadius,
                        background: hoverTooltipBackground,
                        color: hoverTooltipTextColor,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        zIndex: 9999,
                        opacity: 1,
                        transition: "opacity 0.15s ease",
                        ...hoverTooltipFont,
                    }}
                >
                    {(() => {
                        const [ringIndex, cardIndex] = hoveredCardKey.split("-").map(Number)
                        const imageIndex = (ringIndex * cardsPerRing + cardIndex) % images.length
                        const image = images[imageIndex]
                        return (image.hoverText && image.hoverText.trim().length > 0) ? image.hoverText : hoverTooltipDefaultText
                    })()}
                </div>
            )}
        </div>
    )
}

addPropertyControls(TunnelVortex, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                url: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "",
                    placeholder: "https://example.com",
                },
                hoverText: {
                    type: ControlType.String,
                    title: "Hover Text",
                    defaultValue: "",
                    placeholder: "Click here",
                },
            },
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                url: "",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                url: "",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                url: "",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                url: "",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                url: "",
            },
        ],
    },
    onCardClick: {
        type: ControlType.EventHandler,
        title: "On Card Click",
    },
    enableHoverTooltip: {
        type: ControlType.Boolean,
        title: "Hover Tooltip",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverTooltipDefaultText: {
        type: ControlType.String,
        title: "Tooltip Text",
        defaultValue: "Click here",
        hidden: ({ enableHoverTooltip }) => !enableHoverTooltip,
    },
    hoverTooltipBackground: {
        type: ControlType.Color,
        title: "Tooltip BG",
        defaultValue: "rgba(0, 0, 0, 0.75)",
        hidden: ({ enableHoverTooltip }) => !enableHoverTooltip,
    },
    hoverTooltipTextColor: {
        type: ControlType.Color,
        title: "Tooltip Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ enableHoverTooltip }) => !enableHoverTooltip,
    },
    hoverTooltipFont: {
        type: ControlType.Font,
        title: "Tooltip Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        hidden: ({ enableHoverTooltip }) => !enableHoverTooltip,
    },
    hoverTooltipPadding: {
        type: ControlType.Number,
        title: "Tooltip Padding",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        hidden: ({ enableHoverTooltip }) => !enableHoverTooltip,
    },
    hoverTooltipRadius: {
        type: ControlType.Number,
        title: "Tooltip Radius",
        defaultValue: 999,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ enableHoverTooltip }) => !enableHoverTooltip,
    },
    hoverTooltipOffsetX: {
        type: ControlType.Number,
        title: "Tooltip Offset X",
        defaultValue: 0,
        min: -200,
        max: 200,
        step: 1,
        unit: "px",
        hidden: ({ enableHoverTooltip }) => !enableHoverTooltip,
    },
    hoverTooltipOffsetY: {
        type: ControlType.Number,
        title: "Tooltip Offset Y",
        defaultValue: -70,
        min: -200,
        max: 200,
        step: 1,
        unit: "px",
        hidden: ({ enableHoverTooltip }) => !enableHoverTooltip,
    },
    enableManualCamera: {
        type: ControlType.Boolean,
        title: "Manual Camera",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cameraPositionX: {
        type: ControlType.Number,
        title: "Position X",
        defaultValue: 0,
        min: -500,
        max: 500,
        step: 10,
        unit: "px",
        hidden: ({ enableManualCamera }) => !enableManualCamera,
    },
    cameraPositionY: {
        type: ControlType.Number,
        title: "Position Y",
        defaultValue: 0,
        min: -500,
        max: 500,
        step: 10,
        unit: "px",
        hidden: ({ enableManualCamera }) => !enableManualCamera,
    },
    cameraPositionZ: {
        type: ControlType.Number,
        title: "Position Z",
        defaultValue: 0,
        min: -1000,
        max: 1000,
        step: 10,
        unit: "px",
        hidden: ({ enableManualCamera }) => !enableManualCamera,
    },
    cameraRotationX: {
        type: ControlType.Number,
        title: "Rotation X",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        hidden: ({ enableManualCamera }) => !enableManualCamera,
    },
    cameraRotationY: {
        type: ControlType.Number,
        title: "Rotation Y",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        hidden: ({ enableManualCamera }) => !enableManualCamera,
    },
    cameraRotationZ: {
        type: ControlType.Number,
        title: "Rotation Z",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        hidden: ({ enableManualCamera }) => !enableManualCamera,
    },
    enableEntranceAnimation: {
        type: ControlType.Boolean,
        title: "Entrance Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    entranceAnimationType: {
        type: ControlType.Enum,
        title: "Animation Type",
        options: ["fadeIn", "spiral", "zoomIn", "ripple"],
        optionTitles: ["Fade In", "Spiral", "Zoom In", "Ripple"],
        defaultValue: "fadeIn",
        hidden: ({ enableEntranceAnimation }) => !enableEntranceAnimation,
    },
    entranceAnimationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.1,
        unit: "s",
        hidden: ({ enableEntranceAnimation }) => !enableEntranceAnimation,
    },
    colorScheme: {
        type: ControlType.Enum,
        title: "Color Scheme",
        options: ["default", "neon", "sunset", "ocean", "forest", "cyberpunk"],
        optionTitles: ["Default", "Neon", "Sunset", "Ocean", "Forest", "Cyberpunk"],
        defaultValue: "default",
    },
    lightingEffect: {
        type: ControlType.Enum,
        title: "Lighting Effect",
        options: ["none", "glow", "spotlight", "ambient"],
        optionTitles: ["None", "Glow", "Spotlight", "Ambient"],
        defaultValue: "none",
    },
    material: {
        type: ControlType.Enum,
        title: "Material",
        options: ["default", "metallic", "glass", "matte"],
        optionTitles: ["Default", "Metallic", "Glass", "Matte"],
        defaultValue: "default",
    },
    ringCount: {
        type: ControlType.Number,
        title: "Ring Count",
        defaultValue: 8,
        min: 2,
        max: 20,
        step: 1,
    },
    cardsPerRing: {
        type: ControlType.Number,
        title: "Cards Per Ring",
        defaultValue: 6,
        min: 3,
        max: 12,
        step: 1,
    },
    tunnelSpeed: {
        type: ControlType.Number,
        title: "Tunnel Speed",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    ringRotSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 0.5,
        min: -5,
        max: 5,
        step: 0.1,
    },
    startRadius: {
        type: ControlType.Number,
        title: "Start Radius",
        defaultValue: 50,
        min: 20,
        max: 300,
        step: 10,
        unit: "px",
    },
    endRadius: {
        type: ControlType.Number,
        title: "End Radius",
        defaultValue: 400,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
    },
    tunnelLength: {
        type: ControlType.Number,
        title: "Tunnel Length",
        defaultValue: 1000,
        min: 500,
        max: 3000,
        step: 100,
        unit: "px",
    },
    cameraMouseStrength: {
        type: ControlType.Number,
        title: "Mouse Tilt",
        defaultValue: 15,
        min: 0,
        max: 45,
        step: 1,
        unit: "deg",
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        defaultValue: 120,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    fadeDistance: {
        type: ControlType.Number,
        title: "Fade Distance",
        defaultValue: 600,
        min: 0,
        max: 2000,
        step: 50,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 500,
        max: 3000,
        step: 100,
        unit: "px",
    },
})
