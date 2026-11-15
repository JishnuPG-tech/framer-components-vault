// Ultra-premium cinematic Solar System experience with immersive 3D effects, interactive planets, and stunning visuals
import { useEffect, useState, useRef, useMemo, useCallback, startTransition } from "react"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Planet {
    id: string
    name: string
    size: number
    distance: number
    color: string
    orbitSpeed: number
    rotationSpeed: number
    description: string
    stats: { label: string; value: string }[]
    hasRings?: boolean
    hasMoon?: boolean
    glowColor: string
}

interface SolarSystemProps {
    sunColor: string
    backgroundColor: string
    enableParticles: boolean
    enableShootingStars: boolean
    enableNebula: boolean
    interactionSensitivity: number
    orbitSpeedMultiplier: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SolarSystem(props: SolarSystemProps) {
    const {
        sunColor,
        backgroundColor,
        enableParticles,
        enableShootingStars,
        enableNebula,
        interactionSensitivity,
        orbitSpeedMultiplier,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null)
    const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null)
    const [shootingStars, setShootingStars] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([])

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 })
    const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 })

    const parallaxX = useTransform(smoothMouseX, [-1, 1], [-30 * interactionSensitivity, 30 * interactionSensitivity])
    const parallaxY = useTransform(smoothMouseY, [-1, 1], [-30 * interactionSensitivity, 30 * interactionSensitivity])

    const planets: Planet[] = useMemo(
        () => [
            {
                id: "mercury",
                name: "Mercury",
                size: 30,
                distance: 120,
                color: "#8C7853",
                orbitSpeed: 4.7,
                rotationSpeed: 58.6,
                description: "The smallest and fastest planet",
                glowColor: "#B8A080",
                stats: [
                    { label: "Distance", value: "57.9M km" },
                    { label: "Diameter", value: "4,879 km" },
                    { label: "Day Length", value: "58.6 days" },
                ],
            },
            {
                id: "venus",
                name: "Venus",
                size: 45,
                distance: 180,
                color: "#FFC649",
                orbitSpeed: 3.5,
                rotationSpeed: 243,
                description: "The hottest planet in our solar system",
                glowColor: "#FFD97D",
                stats: [
                    { label: "Distance", value: "108.2M km" },
                    { label: "Diameter", value: "12,104 km" },
                    { label: "Temperature", value: "462°C" },
                ],
            },
            {
                id: "earth",
                name: "Earth",
                size: 48,
                distance: 250,
                color: "#4A90E2",
                orbitSpeed: 3.0,
                rotationSpeed: 1,
                description: "Our home planet",
                glowColor: "#6FB1FF",
                hasMoon: true,
                stats: [
                    { label: "Distance", value: "149.6M km" },
                    { label: "Diameter", value: "12,742 km" },
                    { label: "Population", value: "8B+" },
                ],
            },
            {
                id: "mars",
                name: "Mars",
                size: 40,
                distance: 320,
                color: "#E27B58",
                orbitSpeed: 2.4,
                rotationSpeed: 1.03,
                description: "The Red Planet",
                glowColor: "#FF9B7D",
                stats: [
                    { label: "Distance", value: "227.9M km" },
                    { label: "Diameter", value: "6,779 km" },
                    { label: "Moons", value: "2" },
                ],
            },
            {
                id: "jupiter",
                name: "Jupiter",
                size: 90,
                distance: 420,
                color: "#C88B3A",
                orbitSpeed: 1.3,
                rotationSpeed: 0.41,
                description: "The largest planet with a giant storm",
                glowColor: "#E5A855",
                stats: [
                    { label: "Distance", value: "778.5M km" },
                    { label: "Diameter", value: "139,820 km" },
                    { label: "Moons", value: "95" },
                ],
            },
            {
                id: "saturn",
                name: "Saturn",
                size: 80,
                distance: 520,
                color: "#FAD5A5",
                orbitSpeed: 0.97,
                rotationSpeed: 0.45,
                description: "The ringed beauty",
                glowColor: "#FFE4B8",
                hasRings: true,
                stats: [
                    { label: "Distance", value: "1.43B km" },
                    { label: "Diameter", value: "116,460 km" },
                    { label: "Rings", value: "7 major" },
                ],
            },
            {
                id: "uranus",
                name: "Uranus",
                size: 60,
                distance: 600,
                color: "#4FD0E7",
                orbitSpeed: 0.68,
                rotationSpeed: 0.72,
                description: "The tilted ice giant",
                glowColor: "#7DE5FF",
                stats: [
                    { label: "Distance", value: "2.87B km" },
                    { label: "Diameter", value: "50,724 km" },
                    { label: "Tilt", value: "97.8°" },
                ],
            },
            {
                id: "neptune",
                name: "Neptune",
                size: 58,
                distance: 670,
                color: "#4169E1",
                orbitSpeed: 0.54,
                rotationSpeed: 0.67,
                description: "The windiest planet",
                glowColor: "#6A8FFF",
                stats: [
                    { label: "Distance", value: "4.5B km" },
                    { label: "Diameter", value: "49,244 km" },
                    { label: "Wind Speed", value: "2,100 km/h" },
                ],
            },
        ],
        []
    )

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current || isStatic) return
            const rect = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
            mouseX.set(x)
            mouseY.set(y)
        },
        [mouseX, mouseY, isStatic]
    )

    const handlePlanetClick = useCallback((planet: Planet) => {
        startTransition(() => {
            setSelectedPlanet(planet)
        })
    }, [])

    const closePanel = useCallback(() => {
        startTransition(() => {
            setSelectedPlanet(null)
        })
    }, [])

    // Shooting stars effect
    useEffect(() => {
        if (!enableShootingStars || isStatic) return

        const interval = setInterval(() => {
            const newStar = {
                id: Date.now(),
                x: Math.random() * 100,
                y: Math.random() * 50,
                angle: Math.random() * 45 + 20,
            }
            startTransition(() => {
                setShootingStars((prev) => [...prev, newStar])
            })

            setTimeout(() => {
                startTransition(() => {
                    setShootingStars((prev) => prev.filter((s) => s.id !== newStar.id))
                })
            }, 2000)
        }, 3000)

        return () => clearInterval(interval)
    }, [enableShootingStars, isStatic])

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
                cursor: selectedPlanet ? "default" : "grab",
            }}
        >
            {/* Animated star field background */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    x: parallaxX,
                    y: parallaxY,
                }}
            >
                {[...Array(200)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                        style={{
                            position: "absolute",
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: Math.random() * 2 + 1,
                            height: Math.random() * 2 + 1,
                            borderRadius: "50%",
                            background: "#FFF",
                            boxShadow: "0 0 4px #FFF",
                        }}
                    />
                ))}
            </motion.div>

            {/* Nebula clouds */}
            {enableNebula && (
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        x: useTransform(parallaxX, (v) => v * 0.3),
                        y: useTransform(parallaxY, (v) => v * 0.3),
                    }}
                >
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                opacity: [0.1, 0.3, 0.1],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 10 + i * 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                position: "absolute",
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                width: 400 + i * 100,
                                height: 400 + i * 100,
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${
                                    ["#8855FF", "#FF5588", "#0099FF", "#22CC66", "#FFBB00"][i]
                                }33 0%, transparent 70%)`,
                                filter: "blur(60px)",
                            }}
                        />
                    ))}
                </motion.div>
            )}

            {/* Shooting stars */}
            <AnimatePresence>
                {shootingStars.map((star) => (
                    <motion.div
                        key={star.id}
                        initial={{ x: `${star.x}%`, y: `${star.y}%`, opacity: 0 }}
                        animate={{ x: `${star.x + 30}%`, y: `${star.y + 30}%`, opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            width: 100,
                            height: 2,
                            background: "linear-gradient(90deg, transparent, #FFF, transparent)",
                            transform: `rotate(${star.angle}deg)`,
                            boxShadow: "0 0 10px #FFF",
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Floating particles */}
            {enableParticles && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {[...Array(50)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [0, -20, 0],
                                x: [0, Math.random() * 10 - 5, 0],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: Math.random() * 5 + 3,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                            style={{
                                position: "absolute",
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                width: 3,
                                height: 3,
                                borderRadius: "50%",
                                background: "#00D9FF",
                                boxShadow: "0 0 6px #00D9FF",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Solar System container */}
            <motion.div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    x: "-50%",
                    y: "-50%",
                    rotateX: useTransform(smoothMouseY, [-1, 1], [5, -5]),
                    rotateY: useTransform(smoothMouseX, [-1, 1], [-5, 5]),
                    transformStyle: "preserve-3d",
                }}
            >
                {/* Sun */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        boxShadow: [
                            `0 0 60px 20px ${sunColor}`,
                            `0 0 80px 30px ${sunColor}`,
                            `0 0 60px 20px ${sunColor}`,
                        ],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 100,
                        height: 100,
                        marginLeft: -50,
                        marginTop: -50,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${sunColor} 0%, ${sunColor}CC 50%, ${sunColor}66 100%)`,
                        boxShadow: `0 0 60px 20px ${sunColor}`,
                    }}
                >
                    {/* Solar flares */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.25,
                            }}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: 20,
                                height: 60,
                                marginLeft: -10,
                                marginTop: -30,
                                background: `linear-gradient(180deg, ${sunColor} 0%, transparent 100%)`,
                                transform: `rotate(${i * 45}deg)`,
                                transformOrigin: "center center",
                                filter: "blur(8px)",
                            }}
                        />
                    ))}
                </motion.div>

                {/* Planets and orbits */}
                {planets.map((planet, index) => (
                    <motion.div
                        key={planet.id}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 60 / (planet.orbitSpeed * orbitSpeedMultiplier),
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: planet.distance * 2,
                            height: planet.distance * 2,
                            marginLeft: -planet.distance,
                            marginTop: -planet.distance,
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {/* Orbit ring */}
                        <motion.div
                            animate={{
                                opacity: hoveredPlanet === planet.id ? 0.6 : 0.2,
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: "50%",
                                border: `1px solid ${planet.glowColor}`,
                                boxShadow: `0 0 20px ${planet.glowColor}44`,
                            }}
                        />

                        {/* Planet */}
                        <motion.div
                            animate={{
                                rotate: -360,
                                scale: hoveredPlanet === planet.id ? 1.3 : 1,
                            }}
                            transition={{
                                rotate: {
                                    duration: planet.rotationSpeed * 2,
                                    repeat: Infinity,
                                    ease: "linear",
                                },
                                scale: { duration: 0.3 },
                            }}
                            onHoverStart={() => !isStatic && startTransition(() => setHoveredPlanet(planet.id))}
                            onHoverEnd={() => !isStatic && startTransition(() => setHoveredPlanet(null))}
                            onClick={() => !isStatic && handlePlanetClick(planet)}
                            style={{
                                position: "absolute",
                                left: planet.distance,
                                top: "50%",
                                width: planet.size,
                                height: planet.size,
                                marginLeft: -planet.size / 2,
                                marginTop: -planet.size / 2,
                                borderRadius: "50%",
                                background: `radial-gradient(circle at 30% 30%, ${planet.color}FF 0%, ${planet.color}CC 50%, ${planet.color}66 100%)`,
                                boxShadow: `0 0 ${hoveredPlanet === planet.id ? 40 : 20}px ${planet.glowColor}`,
                                cursor: "pointer",
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {/* Saturn rings */}
                            {planet.hasRings && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        width: planet.size * 2,
                                        height: planet.size * 0.3,
                                        marginLeft: -planet.size,
                                        marginTop: -planet.size * 0.15,
                                        borderRadius: "50%",
                                        border: `4px solid ${planet.color}AA`,
                                        boxShadow: `0 0 15px ${planet.glowColor}, inset 0 0 15px ${planet.glowColor}`,
                                        transform: "rotateX(75deg)",
                                    }}
                                />
                            )}

                            {/* Earth's moon */}
                            {planet.hasMoon && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        width: 60,
                                        height: 60,
                                        marginLeft: -30,
                                        marginTop: -30,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 50,
                                            top: "50%",
                                            width: 12,
                                            height: 12,
                                            marginTop: -6,
                                            borderRadius: "50%",
                                            background: "#CCC",
                                            boxShadow: "0 0 10px #FFF",
                                        }}
                                    />
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Holographic label on hover */}
                        <AnimatePresence>
                            {hoveredPlanet === planet.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    style={{
                                        position: "absolute",
                                        left: planet.distance,
                                        top: "50%",
                                        marginTop: planet.size / 2 + 15,
                                        marginLeft: -50,
                                        width: 100,
                                        padding: "8px 12px",
                                        background: "rgba(0, 217, 255, 0.1)",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(0, 217, 255, 0.3)",
                                        borderRadius: 8,
                                        textAlign: "center",
                                        color: "#00D9FF",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        boxShadow: "0 0 20px rgba(0, 217, 255, 0.3)",
                                        pointerEvents: "none",
                                    }}
                                >
                                    {planet.name}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </motion.div>

            {/* Planet information panel */}
            <AnimatePresence>
                {selectedPlanet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closePanel}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0, 0, 0, 0.8)",
                            backdropFilter: "blur(10px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 100,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: "90%",
                                maxWidth: 600,
                                padding: 40,
                                background: "rgba(10, 10, 30, 0.9)",
                                backdropFilter: "blur(20px)",
                                border: `2px solid ${selectedPlanet.glowColor}`,
                                borderRadius: 20,
                                boxShadow: `0 0 60px ${selectedPlanet.glowColor}66`,
                                color: "#FFF",
                            }}
                        >
                            {/* Planet preview */}
                            <div style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 30 }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    style={{
                                        width: 120,
                                        height: 120,
                                        borderRadius: "50%",
                                        background: `radial-gradient(circle at 30% 30%, ${selectedPlanet.color}FF 0%, ${selectedPlanet.color}CC 50%, ${selectedPlanet.color}66 100%)`,
                                        boxShadow: `0 0 40px ${selectedPlanet.glowColor}`,
                                        flexShrink: 0,
                                    }}
                                />
                                <div>
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: 48,
                                            fontWeight: 700,
                                            background: `linear-gradient(135deg, #FFF, ${selectedPlanet.glowColor})`,
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            letterSpacing: "-0.02em",
                                        }}
                                    >
                                        {selectedPlanet.name}
                                    </h2>
                                    <p style={{ margin: "10px 0 0", fontSize: 16, color: "#AAA" }}>
                                        {selectedPlanet.description}
                                    </p>
                                </div>
                            </div>

                            {/* Stats grid */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                                    gap: 20,
                                    marginBottom: 30,
                                }}
                            >
                                {selectedPlanet.stats.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            padding: 20,
                                            background: "rgba(255, 255, 255, 0.05)",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            borderRadius: 12,
                                        }}
                                    >
                                        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                                            {stat.label}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: selectedPlanet.glowColor,
                                            }}
                                        >
                                            {stat.value}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Close button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={closePanel}
                                style={{
                                    width: "100%",
                                    padding: "16px 32px",
                                    background: `linear-gradient(135deg, ${selectedPlanet.glowColor}, ${selectedPlanet.color})`,
                                    border: "none",
                                    borderRadius: 12,
                                    color: "#FFF",
                                    fontSize: 16,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    boxShadow: `0 10px 30px ${selectedPlanet.glowColor}66`,
                                }}
                            >
                                Close
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(SolarSystem, {
    sunColor: {
        type: ControlType.Color,
        title: "Sun Color",
        defaultValue: "#FFA500",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    enableParticles: {
        type: ControlType.Boolean,
        title: "Particles",
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
    enableNebula: {
        type: ControlType.Boolean,
        title: "Nebula Clouds",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    interactionSensitivity: {
        type: ControlType.Number,
        title: "Mouse Sensitivity",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    orbitSpeedMultiplier: {
        type: ControlType.Number,
        title: "Orbit Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
})
