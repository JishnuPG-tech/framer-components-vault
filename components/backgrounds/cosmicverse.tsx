// Create a cinematic futuristic Solar System experience in Framer for a premium space-themed website called "CosmicVerse". Design a fully responsive interactive 3D-inspired Solar System section with a deep black and navy space background filled with animated stars, nebula clouds, cosmic dust, galaxies, aurora gradients, and floating particles. Place a glowing animated Sun in the center with realistic solar flare effects and create smooth orbital paths for all 8 planets — Mercury, Venus, Earth with a rotating Moon, Mars, Jupiter with a storm animation, Saturn with glowing rings, Uranus, and Neptune — each with unique textures, ambient lighting, glow effects, realistic shadows, and different orbital speeds. Add continuous orbit motion, rotating planets, shooting stars, mouse-based parallax movement, scroll-triggered cinematic transitions, floating UI movement, depth effects, and smooth zoom animations when users interact with planets. On hover, planets should scale slightly, glow brighter, and reveal animated tooltips with planet names, while clicking a planet should smoothly zoom the camera toward it and open a futuristic glassmorphism info card with details. Use premium sci-fi UI styling with neon blue, purple, cyan, and orange highlights, glowing borders, smooth gradients, soft shadows, modern typography, and Apple-level smooth animations. Include atmospheric effects like lens flares, space fog, particle trails, and dynamic lighting for a highly immersive experience. Ensure the component is optimized for performance, fully responsive across desktop, tablet, and mobile, and built with reusable Framer components and motion effects.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef, useMemo, startTransition } from "react"

interface PlanetData {
    name: string
    size: number
    color: string
    orbitRadius: number
    orbitSpeed: number
    glowColor: string
    description: string
    facts: string[]
    hasMoon?: boolean
    hasRings?: boolean
    rotationSpeed: number
}

interface CosmicVerseProps {
    enableParallax: boolean
    enableShootingStars: boolean
    starDensity: number
    nebulaOpacity: number
    particleCount: number
    orbitSpeedMultiplier: number
    sunGlowIntensity: number
    planetGlowIntensity: number
    backgroundColor: string
    accentColor: string
    uiGlassOpacity: number
    enableZoomAnimation: boolean
    showOrbits: boolean
    enableDynamicLighting: boolean
    ambientLightIntensity: number
    titleText: string
    subtitleText: string
    titleFont: any
    subtitleFont: any
    colorTheme: string
    customBackgroundColor: string
    customAccentColor: string
    customNebulaColor1: string
    customNebulaColor2: string
    customNebulaColor3: string
    customStarColor: string
    enableCameraControls: boolean
    cameraZoomSpeed: number
    cameraPanSpeed: number
    cameraRotateSpeed: number
    minZoom: number
    maxZoom: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CosmicVerse(props: CosmicVerseProps) {
    const {
        enableParallax = true,
        enableShootingStars = true,
        starDensity = 200,
        nebulaOpacity = 0.3,
        particleCount = 50,
        orbitSpeedMultiplier = 1,
        sunGlowIntensity = 0.8,
        planetGlowIntensity = 0.6,
        backgroundColor = "#000000",
        accentColor = "#00D9FF",
        uiGlassOpacity = 0.15,
        enableZoomAnimation = true,
        showOrbits = true,
        enableDynamicLighting = true,
        ambientLightIntensity = 0.3,
        titleText = "CosmicVerse",
        subtitleText = "Explore the Solar System",
        titleFont,
        subtitleFont,
        colorTheme = "cosmic",
        customBackgroundColor = "#000000",
        customAccentColor = "#00D9FF",
        customNebulaColor1 = "#8A2BE2",
        customNebulaColor2 = "#0064FF",
        customNebulaColor3 = "#FF64C8",
        customStarColor = "#FFFFFF",
        enableCameraControls = true,
        cameraZoomSpeed = 0.1,
        cameraPanSpeed = 1,
        cameraRotateSpeed = 0.5,
        minZoom = 0.3,
        maxZoom = 3,
    } = props

    const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null)
    const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null)
    const [shootingStars, setShootingStars] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
    const [orbitAngles, setOrbitAngles] = useState<Record<string, number>>({})
    const [cameraX, setCameraX] = useState(0)
    const [cameraY, setCameraY] = useState(0)
    const [cameraZoom, setCameraZoom] = useState(1)
    const [cameraRotation, setCameraRotation] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isRotating, setIsRotating] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const isStatic = useIsStaticRenderer()

    const springConfig = { stiffness: 50, damping: 20 }
    const parallaxX = useSpring(useTransform(mouseX, [0, 1], [-20, 20]), springConfig)
    const parallaxY = useSpring(useTransform(mouseY, [0, 1], [-20, 20]), springConfig)

    // Theme definitions
    const themes = useMemo(() => ({
        cosmic: {
            background: "#000000",
            accent: "#00D9FF",
            nebula1: "#8A2BE2",
            nebula2: "#0064FF",
            nebula3: "#FF64C8",
            star: "#FFFFFF",
            name: "Cosmic Blue"
        },
        aurora: {
            background: "#0A0E27",
            accent: "#00FFA3",
            nebula1: "#00FFA3",
            nebula2: "#00D9FF",
            nebula3: "#B24BF3",
            star: "#E0FFFF",
            name: "Aurora Borealis"
        },
        sunset: {
            background: "#1A0A0F",
            accent: "#FF6B35",
            nebula1: "#FF6B35",
            nebula2: "#F7931E",
            nebula3: "#FDC830",
            star: "#FFF8DC",
            name: "Cosmic Sunset"
        },
        nebula: {
            background: "#0D0221",
            accent: "#B24BF3",
            nebula1: "#B24BF3",
            nebula2: "#FF006E",
            nebula3: "#8338EC",
            star: "#F0E6FF",
            name: "Purple Nebula"
        },
        deepSpace: {
            background: "#000814",
            accent: "#FFC300",
            nebula1: "#003566",
            nebula2: "#001D3D",
            nebula3: "#FFC300",
            star: "#FFFFFF",
            name: "Deep Space"
        },
        galaxy: {
            background: "#120136",
            accent: "#FF10F0",
            nebula1: "#FF10F0",
            nebula2: "#7B2CBF",
            nebula3: "#00F5FF",
            star: "#FFEEFF",
            name: "Galaxy Core"
        },
        custom: {
            background: customBackgroundColor,
            accent: customAccentColor,
            nebula1: customNebulaColor1,
            nebula2: customNebulaColor2,
            nebula3: customNebulaColor3,
            star: customStarColor,
            name: "Custom"
        }
    }), [customBackgroundColor, customAccentColor, customNebulaColor1, customNebulaColor2, customNebulaColor3, customStarColor])

    // Get active theme colors
    const activeTheme = useMemo(() => themes[colorTheme] || themes.cosmic, [themes, colorTheme])

    const planets: PlanetData[] = useMemo(
        () => [
            {
                name: "Mercury",
                size: 20,
                color: "#8C7853",
                orbitRadius: 80,
                orbitSpeed: 4.8 * orbitSpeedMultiplier,
                glowColor: "#B8A080",
                description: "The smallest and fastest planet",
                facts: ["Closest to the Sun", "No atmosphere", "800°F day, -290°F night"],
                rotationSpeed: 58.6,
            },
            {
                name: "Venus",
                size: 28,
                color: "#FFC649",
                orbitRadius: 120,
                orbitSpeed: 3.5 * orbitSpeedMultiplier,
                glowColor: "#FFD700",
                description: "The hottest planet in our solar system",
                facts: ["Thick toxic atmosphere", "Rotates backwards", "Surface temp: 900°F"],
                rotationSpeed: -243,
            },
            {
                name: "Earth",
                size: 30,
                color: "#4A90E2",
                orbitRadius: 160,
                orbitSpeed: 3 * orbitSpeedMultiplier,
                glowColor: "#5AB9EA",
                description: "Our home planet, the only known world with life",
                facts: ["71% water coverage", "Protective atmosphere", "Perfect distance from Sun"],
                hasMoon: true,
                rotationSpeed: 1,
            },
            {
                name: "Mars",
                size: 24,
                color: "#E27B58",
                orbitRadius: 200,
                orbitSpeed: 2.4 * orbitSpeedMultiplier,
                glowColor: "#FF6B4A",
                description: "The Red Planet, future home for humanity",
                facts: ["Iron oxide surface", "Largest volcano in solar system", "Polar ice caps"],
                rotationSpeed: 1.03,
            },
            {
                name: "Jupiter",
                size: 60,
                color: "#C88B3A",
                orbitRadius: 280,
                orbitSpeed: 1.3 * orbitSpeedMultiplier,
                glowColor: "#E5A857",
                description: "The largest planet, a gas giant",
                facts: ["Great Red Spot storm", "79 known moons", "Protects inner planets"],
                rotationSpeed: 0.41,
            },
            {
                name: "Saturn",
                size: 52,
                color: "#FAD5A5",
                orbitRadius: 360,
                orbitSpeed: 0.97 * orbitSpeedMultiplier,
                glowColor: "#FFE4B5",
                description: "The ringed beauty of our solar system",
                facts: ["Iconic ring system", "Could float on water", "82 known moons"],
                hasRings: true,
                rotationSpeed: 0.45,
            },
            {
                name: "Uranus",
                size: 38,
                color: "#4FD0E7",
                orbitRadius: 430,
                orbitSpeed: 0.68 * orbitSpeedMultiplier,
                glowColor: "#7FDBFF",
                description: "The tilted ice giant",
                facts: ["Rotates on its side", "Methane atmosphere", "27 known moons"],
                rotationSpeed: -0.72,
            },
            {
                name: "Neptune",
                size: 36,
                color: "#4169E1",
                orbitRadius: 490,
                orbitSpeed: 0.54 * orbitSpeedMultiplier,
                glowColor: "#5B9BD5",
                description: "The windiest planet in the solar system",
                facts: ["Supersonic winds", "Dark spot storms", "14 known moons"],
                rotationSpeed: 0.67,
            },
        ],
        [orbitSpeedMultiplier]
    )

    // Generate stars
    const stars = useMemo(() => {
        return Array.from({ length: starDensity }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            twinkleDelay: Math.random() * 5,
        }))
    }, [starDensity])

    // Generate floating particles
    const particles = useMemo(() => {
        return Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * 5,
        }))
    }, [particleCount])

    // Handle mouse movement for parallax
    useEffect(() => {
        if (!enableParallax || isStatic) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height
            mouseX.set(x)
            mouseY.set(y)
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [enableParallax, mouseX, mouseY, isStatic])

    // Camera Controls - Mouse/Touch handlers
    useEffect(() => {
        if (!enableCameraControls || isStatic) return

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 0) {
                // Left click for panning
                setIsDragging(true)
                setDragStart({ x: e.clientX, y: e.clientY })
            } else if (e.button === 2) {
                // Right click for rotating
                e.preventDefault()
                setIsRotating(true)
                setDragStart({ x: e.clientX, y: e.clientY })
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const deltaX = (e.clientX - dragStart.x) * cameraPanSpeed
                const deltaY = (e.clientY - dragStart.y) * cameraPanSpeed
                startTransition(() => {
                    setCameraX((prev) => prev + deltaX)
                    setCameraY((prev) => prev + deltaY)
                })
                setDragStart({ x: e.clientX, y: e.clientY })
            } else if (isRotating) {
                const deltaX = (e.clientX - dragStart.x) * cameraRotateSpeed
                startTransition(() => {
                    setCameraRotation((prev) => prev + deltaX)
                })
                setDragStart({ x: e.clientX, y: e.clientY })
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            setIsRotating(false)
        }

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            const delta = e.deltaY * -0.001 * cameraZoomSpeed
            startTransition(() => {
                setCameraZoom((prev) => Math.max(minZoom, Math.min(maxZoom, prev + delta)))
            })
        }

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault()
        }

        // Touch handlers for mobile
        let touchStartDistance = 0
        let touchStartRotation = 0

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                setIsDragging(true)
                setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
            } else if (e.touches.length === 2) {
                // Pinch to zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                touchStartDistance = Math.sqrt(dx * dx + dy * dy)
                touchStartRotation = Math.atan2(dy, dx)
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 1 && isDragging) {
                const deltaX = (e.touches[0].clientX - dragStart.x) * cameraPanSpeed
                const deltaY = (e.touches[0].clientY - dragStart.y) * cameraPanSpeed
                startTransition(() => {
                    setCameraX((prev) => prev + deltaX)
                    setCameraY((prev) => prev + deltaY)
                })
                setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
            } else if (e.touches.length === 2) {
                // Pinch zoom and rotate
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                const distance = Math.sqrt(dx * dx + dy * dy)
                const rotation = Math.atan2(dy, dx)

                if (touchStartDistance > 0) {
                    const zoomDelta = (distance - touchStartDistance) * 0.01 * cameraZoomSpeed
                    startTransition(() => {
                        setCameraZoom((prev) => Math.max(minZoom, Math.min(maxZoom, prev + zoomDelta)))
                    })
                }

                const rotationDelta = ((rotation - touchStartRotation) * 180) / Math.PI
                startTransition(() => {
                    setCameraRotation((prev) => prev + rotationDelta * cameraRotateSpeed)
                })

                touchStartDistance = distance
                touchStartRotation = rotation
            }
        }

        const handleTouchEnd = () => {
            setIsDragging(false)
            touchStartDistance = 0
        }

        const container = containerRef.current
        if (container) {
            container.addEventListener("mousedown", handleMouseDown)
            container.addEventListener("contextmenu", handleContextMenu)
            container.addEventListener("touchstart", handleTouchStart)
            container.addEventListener("touchmove", handleTouchMove)
            container.addEventListener("touchend", handleTouchEnd)
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        window.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            if (container) {
                container.removeEventListener("mousedown", handleMouseDown)
                container.removeEventListener("contextmenu", handleContextMenu)
                container.removeEventListener("touchstart", handleTouchStart)
                container.removeEventListener("touchmove", handleTouchMove)
                container.removeEventListener("touchend", handleTouchEnd)
            }
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
            window.removeEventListener("wheel", handleWheel)
        }
    }, [
        enableCameraControls,
        isDragging,
        isRotating,
        dragStart,
        cameraPanSpeed,
        cameraRotateSpeed,
        cameraZoomSpeed,
        minZoom,
        maxZoom,
        isStatic,
    ])

    // Update orbit angles for dynamic lighting
    useEffect(() => {
        if (isStatic || !enableDynamicLighting) return

        let animationFrame: number

        const updateAngles = () => {
            setOrbitAngles((prev) => {
                const newAngles: Record<string, number> = {}
                planets.forEach((planet) => {
                    const currentAngle = prev[planet.name] || 0
                    newAngles[planet.name] = (currentAngle + planet.orbitSpeed * 0.01) % 360
                })
                return newAngles
            })
            animationFrame = requestAnimationFrame(updateAngles)
        }

        animationFrame = requestAnimationFrame(updateAngles)

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame)
        }
    }, [planets, isStatic, enableDynamicLighting])

    // Calculate dynamic lighting for a planet based on its position
    const calculatePlanetLighting = (planetName: string, planetColor: string, glowColor: string) => {
        if (!enableDynamicLighting) {
            return {
                background: `radial-gradient(circle at 30% 30%, ${planetColor}, ${planetColor}DD)`,
                boxShadow: `0 0 ${20 * planetGlowIntensity}px ${glowColor}, inset -5px -5px 15px rgba(0, 0, 0, 0.5)`,
            }
        }

        const angle = orbitAngles[planetName] || 0
        const angleRad = (angle * Math.PI) / 180

        // Calculate light direction from sun (center)
        const lightX = 50 + Math.cos(angleRad) * 30
        const lightY = 50 + Math.sin(angleRad) * 30

        // Calculate shadow direction (opposite of light)
        const shadowX = Math.cos(angleRad + Math.PI) * 5
        const shadowY = Math.sin(angleRad + Math.PI) * 5

        // Ambient light based on distance from "front" position (angle 0)
        const ambientFactor = (Math.cos(angleRad) + 1) / 2 // 0 to 1
        const brightness = ambientLightIntensity + (1 - ambientLightIntensity) * ambientFactor

        // Enhanced glow when planet is closer to viewer (front of orbit)
        const glowIntensity = planetGlowIntensity * (0.5 + ambientFactor * 0.5)

        const isHovered = hoveredPlanet === planetName
        const isSelected = selectedPlanet?.name === planetName

        // Interaction lighting boost
        const interactionBoost = isHovered ? 1.5 : isSelected ? 1.3 : 1

        return {
            background: `radial-gradient(circle at ${lightX}% ${lightY}%, 
                ${planetColor}${Math.round(brightness * 255).toString(16).padStart(2, "0")}, 
                ${planetColor}DD)`,
            boxShadow: `
                0 0 ${20 * glowIntensity * interactionBoost}px ${glowColor},
                inset ${shadowX}px ${shadowY}px 15px rgba(0, 0, 0, ${0.7 - ambientFactor * 0.3}),
                inset ${-shadowX}px ${-shadowY}px 10px rgba(255, 255, 255, ${0.1 * ambientFactor})
            `,
            filter: `brightness(${brightness * interactionBoost})`,
        }
    }

    // Generate shooting stars
    useEffect(() => {
        if (!enableShootingStars || isStatic) return

        const timeouts: number[] = []

        const interval = setInterval(() => {
            startTransition(() => {
                setShootingStars((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        x: Math.random() * 100,
                        y: Math.random() * 50,
                        delay: 0,
                    },
                ])
            })

            const timeout = window.setTimeout(() => {
                startTransition(() => {
                    setShootingStars((prev) => prev.slice(1))
                })
            }, 2000)
            
            timeouts.push(timeout)
        }, 3000)

        return () => {
            clearInterval(interval)
            timeouts.forEach((timeout) => clearTimeout(timeout))
        }
    }, [enableShootingStars, isStatic])

    const handlePlanetClick = (planet: PlanetData) => {
        if (enableZoomAnimation) {
            startTransition(() => {
                setSelectedPlanet(planet)
            })
        }
    }

    const closeInfoCard = () => {
        startTransition(() => {
            setSelectedPlanet(null)
        })
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            {/* Nebula Background */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 20% 30%, rgba(${parseInt(activeTheme.nebula1.slice(1, 3), 16)}, ${parseInt(activeTheme.nebula1.slice(3, 5), 16)}, ${parseInt(activeTheme.nebula1.slice(5, 7), 16)}, ${nebulaOpacity}) 0%, transparent 50%),
                                radial-gradient(ellipse at 80% 70%, rgba(${parseInt(activeTheme.nebula2.slice(1, 3), 16)}, ${parseInt(activeTheme.nebula2.slice(3, 5), 16)}, ${parseInt(activeTheme.nebula2.slice(5, 7), 16)}, ${nebulaOpacity}) 0%, transparent 50%),
                                radial-gradient(ellipse at 50% 50%, rgba(${parseInt(activeTheme.nebula3.slice(1, 3), 16)}, ${parseInt(activeTheme.nebula3.slice(3, 5), 16)}, ${parseInt(activeTheme.nebula3.slice(5, 7), 16)}, ${nebulaOpacity * 0.5}) 0%, transparent 60%)`,
                    x: enableParallax ? parallaxX : 0,
                    y: enableParallax ? parallaxY : 0,
                }}
            />

            {/* Stars */}
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
                        backgroundColor: activeTheme.star,
                        boxShadow: `0 0 ${star.size * 2}px ${activeTheme.star}${Math.round(star.opacity * 255).toString(16).padStart(2, '0')}`,
                    }}
                    animate={isStatic ? {} : {
                        opacity: [star.opacity, star.opacity * 0.3, star.opacity],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: star.twinkleDelay,
                    }}
                />
            ))}

            {/* Floating Particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    style={{
                        position: "absolute",
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                        borderRadius: "50%",
                        backgroundColor: activeTheme.accent,
                        opacity: 0.4,
                    }}
                    animate={isStatic ? {} : {
                        y: [0, -100, 0],
                        x: [0, Math.random() * 50 - 25, 0],
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Shooting Stars */}
            <AnimatePresence>
                {shootingStars.map((star) => (
                    <motion.div
                        key={star.id}
                        initial={{ x: `${star.x}%`, y: `${star.y}%`, opacity: 0, scale: 0 }}
                        animate={{ x: `${star.x + 30}%`, y: `${star.y + 30}%`, opacity: [0, 1, 0], scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            width: 2,
                            height: 60,
                            background: `linear-gradient(to bottom, ${activeTheme.accent}, transparent)`,
                            transform: "rotate(45deg)",
                            boxShadow: `0 0 10px ${activeTheme.accent}`,
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Title Section */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                    position: "absolute",
                    top: 40,
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    zIndex: 10,
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        background: `linear-gradient(135deg, ${activeTheme.accent}, #B24BF3)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        textShadow: `0 0 40px ${activeTheme.accent}40`,
                        ...titleFont,
                    }}
                >
                    {titleText}
                </h1>
                <p
                    style={{
                        margin: "8px 0 0 0",
                        color: "#FFFFFF",
                        opacity: 0.8,
                        ...subtitleFont,
                    }}
                >
                    {subtitleText}
                </p>
            </motion.div>

            {/* Solar System Container */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: enableCameraControls
                        ? isDragging
                            ? "grabbing"
                            : isRotating
                            ? "crosshair"
                            : "grab"
                        : "default",
                }}
            >
                <motion.div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    animate={{
                        x: enableCameraControls ? cameraX : 0,
                        y: enableCameraControls ? cameraY : 0,
                        scale: enableCameraControls ? cameraZoom : 1,
                        rotate: enableCameraControls ? cameraRotation : 0,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    }}
                >
                    {/* Sun */}
                    <motion.div
                        animate={isStatic ? {} : {
                            scale: [1, 1.05, 1],
                            rotate: 360,
                        }}
                        transition={{
                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                        }}
                        style={{
                            position: "absolute",
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, #FDB813 0%, #FF8C00 50%, #FF4500 100%)`,
                            boxShadow: `0 0 60px rgba(253, 184, 19, ${sunGlowIntensity}),
                                       0 0 100px rgba(255, 140, 0, ${sunGlowIntensity * 0.6}),
                                       inset 0 0 30px rgba(255, 69, 0, 0.8)`,
                            zIndex: 5,
                        }}
                    >
                        {/* Solar Flares */}
                        {[0, 120, 240].map((angle) => (
                            <motion.div
                                key={angle}
                                animate={isStatic ? {} : {
                                    scale: [1, 1.5, 1],
                                    opacity: [0.6, 0.3, 0.6],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: angle / 360,
                                }}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    width: 40,
                                    height: 40,
                                    background: `radial-gradient(circle, rgba(255, 140, 0, 0.8), transparent)`,
                                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-40px)`,
                                    borderRadius: "50%",
                                }}
                            />
                        ))}
                        
                        {/* Light Rays from Sun */}
                        {enableDynamicLighting && [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                            <motion.div
                                key={`ray-${angle}`}
                                animate={isStatic ? {} : {
                                    opacity: [0.1, 0.3, 0.1],
                                    scaleY: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: angle / 360,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    width: 2,
                                    height: 200,
                                    background: `linear-gradient(to bottom, rgba(255, 200, 100, ${ambientLightIntensity}), transparent)`,
                                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                                    transformOrigin: "center top",
                                    pointerEvents: "none",
                                }}
                            />
                        ))}
                    </motion.div>

                    {/* Planets and Orbits */}
                    {planets.map((planet, index) => {
                        const lighting = calculatePlanetLighting(planet.name, planet.color, planet.glowColor)
                        
                        return (
                            <div key={planet.name}>
                                {/* Orbit Path */}
                                {showOrbits && (
                                    <motion.div
                                        style={{
                                            position: "absolute",
                                            width: planet.orbitRadius * 2,
                                            height: planet.orbitRadius * 2,
                                            borderRadius: "50%",
                                            border: `1px solid rgba(255, 255, 255, 0.1)`,
                                            boxShadow: `inset 0 0 20px rgba(0, 217, 255, 0.1)`,
                                        }}
                                        animate={isStatic ? {} : { rotate: 360 }}
                                        transition={{
                                            duration: 100 / planet.orbitSpeed,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                    />
                                )}

                                {/* Planet */}
                                <motion.div
                                    whileHover={{ scale: 1.2 }}
                                    onHoverStart={() => startTransition(() => setHoveredPlanet(planet.name))}
                                    onHoverEnd={() => startTransition(() => setHoveredPlanet(null))}
                                    onClick={() => handlePlanetClick(planet)}
                                    animate={isStatic ? {} : {
                                        rotate: planet.rotationSpeed < 0 ? 360 : -360,
                                    }}
                                    transition={{
                                        rotate: { 
                                            duration: Math.abs(20 / planet.rotationSpeed), 
                                            repeat: Infinity, 
                                            ease: "linear" 
                                        },
                                    }}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: planet.size,
                                        height: planet.size,
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        ...lighting,
                                    }}
                                >
                                    {/* Jupiter Storm */}
                                    {planet.name === "Jupiter" && (
                                        <motion.div
                                            animate={isStatic ? {} : { rotate: 360 }}
                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                            style={{
                                                position: "absolute",
                                                top: "40%",
                                                left: "30%",
                                                width: "30%",
                                                height: "20%",
                                                borderRadius: "50%",
                                                background: "rgba(200, 50, 50, 0.6)",
                                                boxShadow: "0 0 10px rgba(200, 50, 50, 0.8)",
                                            }}
                                        />
                                    )}

                                    {/* Saturn Rings */}
                                    {planet.hasRings && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -50%) rotateX(75deg)",
                                                width: planet.size * 1.8,
                                                height: planet.size * 1.8,
                                                borderRadius: "50%",
                                                border: `4px solid ${planet.glowColor}80`,
                                                boxShadow: `0 0 15px ${planet.glowColor}`,
                                            }}
                                        />
                                    )}

                                    {/* Earth Moon */}
                                    {planet.hasMoon && (
                                        <motion.div
                                            animate={isStatic ? {} : { rotate: 360 }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                            style={{
                                                position: "absolute",
                                                width: planet.size * 2,
                                                height: planet.size * 2,
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -50%)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    background: "#C0C0C0",
                                                    boxShadow: "0 0 5px rgba(192, 192, 192, 0.8)",
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* Tooltip */}
                                <AnimatePresence>
                                    {hoveredPlanet === planet.name && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            style={{
                                                position: "absolute",
                                                top: -40,
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                padding: "8px 16px",
                                                background: `rgba(0, 0, 0, ${uiGlassOpacity + 0.6})`,
                                                backdropFilter: "blur(10px)",
                                                border: `1px solid ${activeTheme.accent}60`,
                                                borderRadius: 8,
                                                color: "#FFF",
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                boxShadow: `0 0 20px ${activeTheme.accent}40`,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {planet.name}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </motion.div>
            </div>

            {/* Planet Info Card */}
            <AnimatePresence>
                {selectedPlanet && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeInfoCard}
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0, 0, 0, 0.8)",
                                backdropFilter: "blur(10px)",
                                zIndex: 100,
                            }}
                        />

                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                width: "90%",
                                maxWidth: 500,
                                background: `rgba(10, 10, 30, ${uiGlassOpacity + 0.7})`,
                                backdropFilter: "blur(20px)",
                                border: `2px solid ${selectedPlanet.glowColor}60`,
                                borderRadius: 24,
                                padding: 32,
                                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${selectedPlanet.glowColor}40`,
                                zIndex: 101,
                            }}
                        >
                            {/* Close Button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={closeInfoCard}
                                style={{
                                    position: "absolute",
                                    top: 16,
                                    right: 16,
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    border: `1px solid ${activeTheme.accent}60`,
                                    background: `rgba(0, 0, 0, ${uiGlassOpacity + 0.3})`,
                                    color: "#FFF",
                                    fontSize: 20,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                ×
                            </motion.button>

                            {/* Planet Preview */}
                            <motion.div
                                animate={isStatic ? {} : { rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                style={{
                                    width: 100,
                                    height: 100,
                                    margin: "0 auto 24px",
                                    borderRadius: "50%",
                                    background: `radial-gradient(circle at 30% 30%, ${selectedPlanet.color}, ${selectedPlanet.color}DD)`,
                                    boxShadow: `0 0 40px ${selectedPlanet.glowColor}, inset -10px -10px 20px rgba(0, 0, 0, 0.5)`,
                                }}
                            />

                            {/* Planet Name */}
                            <h2
                                style={{
                                    margin: "0 0 8px 0",
                                    fontSize: 32,
                                    fontWeight: 700,
                                    textAlign: "center",
                                    background: `linear-gradient(135deg, ${selectedPlanet.glowColor}, ${activeTheme.accent})`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                {selectedPlanet.name}
                            </h2>

                            {/* Description */}
                            <p
                                style={{
                                    margin: "0 0 24px 0",
                                    fontSize: 16,
                                    color: "#CCC",
                                    textAlign: "center",
                                    lineHeight: 1.6,
                                }}
                            >
                                {selectedPlanet.description}
                            </p>

                            {/* Facts */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {selectedPlanet.facts.map((fact, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            padding: 12,
                                            background: `rgba(255, 255, 255, ${uiGlassOpacity * 0.5})`,
                                            border: `1px solid ${selectedPlanet.glowColor}40`,
                                            borderRadius: 12,
                                            fontSize: 14,
                                            color: "#FFF",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: selectedPlanet.glowColor,
                                                boxShadow: `0 0 10px ${selectedPlanet.glowColor}`,
                                                flexShrink: 0,
                                            }}
                                        />
                                        {fact}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Lens Flare Effect */}
            <motion.div
                animate={isStatic ? {} : {
                    opacity: [0.1, 0.15, 0.1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 400,
                    height: 400,
                    background: `radial-gradient(circle, rgba(255, 255, 255, ${0.1 * ambientLightIntensity}) 0%, transparent 70%)`,
                    pointerEvents: "none",
                    x: enableParallax ? parallaxX : 0,
                    y: enableParallax ? parallaxY : 0,
                }}
            />
            
            {/* Dynamic Ambient Light Overlay */}
            {enableDynamicLighting && (
                <motion.div
                    animate={isStatic ? {} : {
                        opacity: [ambientLightIntensity * 0.3, ambientLightIntensity * 0.5, ambientLightIntensity * 0.3],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(ellipse at 50% 50%, rgba(255, 200, 100, ${ambientLightIntensity * 0.1}) 0%, transparent 60%)`,
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(CosmicVerse, {
    titleText: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "CosmicVerse",
    },
    subtitleText: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Explore the Solar System",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "0.02em",
            lineHeight: "1.4em",
        },
    },
    colorTheme: {
        type: ControlType.Enum,
        title: "Color Theme",
        options: ["cosmic", "aurora", "sunset", "nebula", "deepSpace", "galaxy", "custom"],
        optionTitles: ["Cosmic Blue", "Aurora Borealis", "Cosmic Sunset", "Purple Nebula", "Deep Space", "Galaxy Core", "Custom"],
        defaultValue: "cosmic",
    },
    customBackgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        hidden: ({ colorTheme }) => colorTheme !== "custom",
    },
    customAccentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#00D9FF",
        hidden: ({ colorTheme }) => colorTheme !== "custom",
    },
    customNebulaColor1: {
        type: ControlType.Color,
        title: "Nebula Color 1",
        defaultValue: "#8A2BE2",
        hidden: ({ colorTheme }) => colorTheme !== "custom",
    },
    customNebulaColor2: {
        type: ControlType.Color,
        title: "Nebula Color 2",
        defaultValue: "#0064FF",
        hidden: ({ colorTheme }) => colorTheme !== "custom",
    },
    customNebulaColor3: {
        type: ControlType.Color,
        title: "Nebula Color 3",
        defaultValue: "#FF64C8",
        hidden: ({ colorTheme }) => colorTheme !== "custom",
    },
    customStarColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FFFFFF",
        hidden: ({ colorTheme }) => colorTheme !== "custom",
    },
    enableCameraControls: {
        type: ControlType.Boolean,
        title: "Camera Controls",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cameraPanSpeed: {
        type: ControlType.Number,
        title: "Pan Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        hidden: ({ enableCameraControls }) => !enableCameraControls,
    },
    cameraRotateSpeed: {
        type: ControlType.Number,
        title: "Rotate Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        hidden: ({ enableCameraControls }) => !enableCameraControls,
    },
    cameraZoomSpeed: {
        type: ControlType.Number,
        title: "Zoom Speed",
        defaultValue: 0.1,
        min: 0.05,
        max: 0.5,
        step: 0.05,
        hidden: ({ enableCameraControls }) => !enableCameraControls,
    },
    minZoom: {
        type: ControlType.Number,
        title: "Min Zoom",
        defaultValue: 0.3,
        min: 0.1,
        max: 1,
        step: 0.1,
        hidden: ({ enableCameraControls }) => !enableCameraControls,
    },
    maxZoom: {
        type: ControlType.Number,
        title: "Max Zoom",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 0.5,
        hidden: ({ enableCameraControls }) => !enableCameraControls,
    },
    enableParallax: {
        type: ControlType.Boolean,
        title: "Parallax",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableShootingStars: {
        type: ControlType.Boolean,
        title: "Shooting Stars",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showOrbits: {
        type: ControlType.Boolean,
        title: "Show Orbits",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableZoomAnimation: {
        type: ControlType.Boolean,
        title: "Zoom Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableDynamicLighting: {
        type: ControlType.Boolean,
        title: "Dynamic Lighting",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    starDensity: {
        type: ControlType.Number,
        title: "Star Density",
        defaultValue: 200,
        min: 50,
        max: 500,
        step: 10,
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
    },
    nebulaOpacity: {
        type: ControlType.Number,
        title: "Nebula Opacity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
    },
    orbitSpeedMultiplier: {
        type: ControlType.Number,
        title: "Orbit Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    sunGlowIntensity: {
        type: ControlType.Number,
        title: "Sun Glow",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.1,
    },
    planetGlowIntensity: {
        type: ControlType.Number,
        title: "Planet Glow",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.1,
    },
    ambientLightIntensity: {
        type: ControlType.Number,
        title: "Ambient Light",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
    },
    uiGlassOpacity: {
        type: ControlType.Number,
        title: "UI Glass Opacity",
        defaultValue: 0.15,
        min: 0,
        max: 0.5,
        step: 0.05,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#00D9FF",
    },
})
