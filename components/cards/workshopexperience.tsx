// Futuristic Workshop Experience UI with ultra-premium interactive hover effects
// Dark glassmorphism, floating particles, 3D modular cards, magnetic hover, holographic sphere
// Cinematic cyber aesthetics with dynamic lighting and depth blur
import { useEffect, useRef, useState, useMemo, useCallback, startTransition } from "react"
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


interface WorkshopCard {
    id: number
    title: string
    subtitle: string
    icon: string
    color: string
}

interface WorkshopExperienceProps {
    primaryColor: string
    accentColor: string
    glowColor: string
    backgroundColor: string
    headingFont: any
    bodyFont: any
    particleCount: number
    enableSphere: boolean
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function WorkshopExperience(props: WorkshopExperienceProps) {
    const {
        primaryColor,
        accentColor,
        glowColor,
        backgroundColor,
        headingFont,
        bodyFont,
        particleCount,
        enableSphere,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [sphereHovered, setSphereHovered] = useState(false)
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 200 })
    const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 200 })

    // Initialize particles
    useEffect(() => {
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * 5,
        }))
        startTransition(() => setParticles(newParticles))
    }, [particleCount])

    // Track mouse movement
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
    }, [mouseX, mouseY])

    const workshopCards: WorkshopCard[] = useMemo(() => [
        { id: 1, title: "Neural Design", subtitle: "AI-Powered Creation", icon: "◈", color: primaryColor },
        { id: 2, title: "Quantum Code", subtitle: "Next-Gen Development", icon: "◊", color: accentColor },
        { id: 3, title: "Holographic UI", subtitle: "Immersive Interfaces", icon: "◉", color: glowColor },
        { id: 4, title: "Cyber Assets", subtitle: "Digital Resources", icon: "◭", color: primaryColor },
        { id: 5, title: "Meta Tools", subtitle: "Advanced Utilities", icon: "◬", color: accentColor },
    ], [primaryColor, accentColor, glowColor])

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                fontFamily: bodyFont.fontFamily,
            }}
        >
            {/* Animated Background Gradient */}
            <motion.div
                animate={{
                    background: [
                        `radial-gradient(circle at 20% 30%, ${primaryColor}15 0%, transparent 50%)`,
                        `radial-gradient(circle at 80% 70%, ${accentColor}15 0%, transparent 50%)`,
                        `radial-gradient(circle at 50% 50%, ${glowColor}15 0%, transparent 50%)`,
                        `radial-gradient(circle at 20% 30%, ${primaryColor}15 0%, transparent 50%)`,
                    ],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.4,
                }}
            />

            {/* Floating Particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: ["0%", "-100%"],
                        x: [0, Math.sin(particle.id) * 50],
                    }}
                    transition={{
                        duration: 8 + Math.random() * 4,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "linear",
                    }}
                    style={{
                        position: "absolute",
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                        borderRadius: "50%",
                        background: glowColor,
                        boxShadow: `0 0 ${particle.size * 3}px ${glowColor}`,
                        pointerEvents: "none",
                    }}
                />
            ))}

            {/* Workshop Control Sphere */}
            {enableSphere && (
                <motion.div
                    onHoverStart={() => startTransition(() => setSphereHovered(true))}
                    onHoverEnd={() => startTransition(() => setSphereHovered(false))}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        x: "-50%",
                        y: "-50%",
                        width: 120,
                        height: 120,
                        cursor: "pointer",
                        zIndex: 10,
                    }}
                >
                    {/* Sphere Core */}
                    <motion.div
                        animate={{
                            scale: sphereHovered ? 1.2 : 1,
                            rotate: sphereHovered ? 360 : 0,
                        }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            background: `radial-gradient(circle at 30% 30%, ${glowColor}40, ${primaryColor}20)`,
                            backdropFilter: "blur(20px)",
                            border: `2px solid ${glowColor}60`,
                            boxShadow: `0 0 40px ${glowColor}80, inset 0 0 30px ${glowColor}40`,
                            position: "relative",
                        }}
                    >
                        {/* Inner Glow */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            style={{
                                position: "absolute",
                                inset: 10,
                                borderRadius: "50%",
                                border: `1px solid ${accentColor}40`,
                            }}
                        />
                    </motion.div>

                    {/* Energy Rings */}
                    <AnimatePresence>
                        {sphereHovered && [0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                exit={{ scale: 1, opacity: 0 }}
                                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    border: `2px solid ${glowColor}`,
                                    pointerEvents: "none",
                                }}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Orbiting Widgets */}
                    {sphereHovered && [0, 1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.25 }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: 200,
                                height: 200,
                                x: "-50%",
                                y: "-50%",
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "50%",
                                    x: "-50%",
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    background: accentColor,
                                    boxShadow: `0 0 15px ${accentColor}`,
                                }}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Workshop Cards Grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 40,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 30,
                    alignItems: "center",
                    justifyItems: "center",
                }}
            >
                {workshopCards.map((card, index) => {
                    const isHovered = hoveredCard === card.id
                    const offsetX = (index % 3) * 15 - 15
                    const offsetY = Math.floor(index / 3) * 15 - 15

                    return (
                        <motion.div
                            key={card.id}
                            onHoverStart={() => startTransition(() => setHoveredCard(card.id))}
                            onHoverEnd={() => startTransition(() => setHoveredCard(null))}
                            style={{
                                position: "relative",
                                width: "100%",
                                maxWidth: 280,
                                height: 320,
                                cursor: "pointer",
                                transformStyle: "preserve-3d",
                                perspective: 1000,
                            }}
                            animate={{
                                x: isHovered ? offsetX : 0,
                                y: isHovered ? offsetY : 0,
                                scale: isHovered ? 1.05 : 1,
                                rotateY: isHovered ? 5 : 0,
                                rotateX: isHovered ? -5 : 0,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {/* Card Background Layer */}
                            <motion.div
                                animate={{
                                    boxShadow: isHovered
                                        ? `0 30px 60px ${card.color}40, 0 0 80px ${card.color}30`
                                        : `0 10px 30px ${card.color}20`,
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: 24,
                                    background: `linear-gradient(135deg, ${card.color}15, ${backgroundColor}80)`,
                                    backdropFilter: "blur(20px)",
                                    border: `1px solid ${card.color}30`,
                                    overflow: "hidden",
                                }}
                            >
                                {/* Animated Border Gradient */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    style={{
                                        position: "absolute",
                                        inset: -2,
                                        background: `conic-gradient(from 0deg, ${card.color}, transparent, ${card.color})`,
                                        borderRadius: 24,
                                        opacity: isHovered ? 0.6 : 0,
                                        transition: "opacity 0.3s",
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 2,
                                        borderRadius: 22,
                                        background: backgroundColor,
                                    }}
                                />
                            </motion.div>

                            {/* Card Content */}
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    padding: 30,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    zIndex: 1,
                                }}
                            >
                                {/* Icon */}
                                <motion.div
                                    animate={{
                                        rotateY: isHovered ? 360 : 0,
                                        scale: isHovered ? 1.2 : 1,
                                    }}
                                    transition={{ duration: 0.6 }}
                                    style={{
                                        fontSize: 48,
                                        color: card.color,
                                        textShadow: `0 0 20px ${card.color}`,
                                        ...headingFont,
                                    }}
                                >
                                    {card.icon}
                                </motion.div>

                                {/* Text Content */}
                                <div>
                                    <motion.h3
                                        animate={{
                                            letterSpacing: isHovered ? "0.1em" : "0em",
                                        }}
                                        style={{
                                            margin: 0,
                                            fontSize: 24,
                                            color: "#FFFFFF",
                                            textShadow: isHovered ? `0 0 10px ${card.color}` : "none",
                                            ...headingFont,
                                        }}
                                    >
                                        {card.title}
                                    </motion.h3>
                                    <motion.p
                                        animate={{ opacity: isHovered ? 1 : 0.6 }}
                                        style={{
                                            margin: "8px 0 0 0",
                                            fontSize: 14,
                                            color: "#CCCCCC",
                                            ...bodyFont,
                                        }}
                                    >
                                        {card.subtitle}
                                    </motion.p>
                                </div>

                                {/* Energy Bar */}
                                <motion.div
                                    style={{
                                        width: "100%",
                                        height: 4,
                                        borderRadius: 2,
                                        background: `${card.color}20`,
                                        overflow: "hidden",
                                    }}
                                >
                                    <motion.div
                                        animate={{
                                            width: isHovered ? "100%" : "40%",
                                        }}
                                        transition={{ duration: 0.6 }}
                                        style={{
                                            height: "100%",
                                            background: card.color,
                                            boxShadow: `0 0 10px ${card.color}`,
                                        }}
                                    />
                                </motion.div>
                            </div>

                            {/* Floating Mini Components on Hover */}
                            <AnimatePresence>
                                {isHovered && (
                                    <>
                                        {/* Top Panel */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, y: -40, scale: 1 }}
                                            exit={{ opacity: 0, y: 0, scale: 0.8 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: "50%",
                                                x: "-50%",
                                                width: "80%",
                                                height: 60,
                                                background: `linear-gradient(135deg, ${card.color}20, ${backgroundColor}90)`,
                                                backdropFilter: "blur(10px)",
                                                borderRadius: 12,
                                                border: `1px solid ${card.color}40`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 12,
                                                color: "#FFFFFF",
                                                boxShadow: `0 10px 30px ${card.color}30`,
                                                ...bodyFont,
                                            }}
                                        >
                                            Advanced Tools
                                        </motion.div>

                                        {/* Side Badges */}
                                        {[-1, 1].map((dir) => (
                                            <motion.div
                                                key={dir}
                                                initial={{ opacity: 0, x: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, x: dir * 50, scale: 1 }}
                                                exit={{ opacity: 0, x: 0, scale: 0.8 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
                                                style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    [dir > 0 ? "right" : "left"]: 0,
                                                    y: "-50%",
                                                    width: 40,
                                                    height: 40,
                                                    background: `radial-gradient(circle, ${card.color}40, transparent)`,
                                                    backdropFilter: "blur(10px)",
                                                    borderRadius: "50%",
                                                    border: `1px solid ${card.color}60`,
                                                    boxShadow: `0 0 20px ${card.color}50`,
                                                }}
                                            />
                                        ))}

                                        {/* Particle Trail */}
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{
                                                    opacity: [0, 1, 0],
                                                    scale: [0, 1, 0],
                                                    x: Math.cos(i * 72 * (Math.PI / 180)) * 100,
                                                    y: Math.sin(i * 72 * (Math.PI / 180)) * 100,
                                                }}
                                                transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
                                                style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: "50%",
                                                    background: card.color,
                                                    boxShadow: `0 0 10px ${card.color}`,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        ))}
                                    </>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>

            {/* Cursor Follower */}
            <motion.div
                style={{
                    position: "absolute",
                    width: 400,
                    height: 400,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${glowColor}10, transparent 70%)`,
                    pointerEvents: "none",
                    x: smoothMouseX,
                    y: smoothMouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                    zIndex: 0,
                }}
            />
        </div>
    )
}

addPropertyControls(WorkshopExperience, {
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#0099FF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#8855FF",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#00FFFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0F",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 5,
    },
    enableSphere: {
        type: ControlType.Boolean,
        title: "Control Sphere",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
