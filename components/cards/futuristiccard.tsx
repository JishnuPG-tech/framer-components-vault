// Futuristic interactive glassmorphism card with magnetic hover physics, liquid neon borders, 
// breathing glow, 3D motion, particles, morphing shapes, and cinematic transitions
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


interface FuturisticCardProps {
    title: string
    subtitle: string
    description: string
    titleFont: any
    subtitleFont: any
    descriptionFont: any
    primaryColor: string
    secondaryColor: string
    accentColor: string
    glassOpacity: number
    magneticStrength: number
    particleCount: number
    enableParticles: boolean
    enableMorphing: boolean
    enableBreathing: boolean
    enableColorChange: boolean
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FuturisticCard(props: FuturisticCardProps) {
    const {
        title,
        subtitle,
        description,
        titleFont,
        subtitleFont,
        descriptionFont,
        primaryColor,
        secondaryColor,
        accentColor,
        glassOpacity,
        magneticStrength,
        particleCount,
        enableParticles,
        enableMorphing,
        enableBreathing,
        enableColorChange,
    } = props

    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
    const [colorSchemeIndex, setColorSchemeIndex] = useState(0)

    // Color schemes to cycle through
    const colorSchemes = useMemo(
        () => [
            { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
            { primary: "#FF0080", secondary: "#7928CA", accent: "#FFD700" },
            { primary: "#00FF88", secondary: "#00D9FF", accent: "#FF6B6B" },
            { primary: "#FF4500", secondary: "#FFD700", accent: "#00CED1" },
            { primary: "#9D00FF", secondary: "#FF00E5", accent: "#00FFFF" },
            { primary: "#39FF14", secondary: "#FF073A", accent: "#FFFF00" },
        ],
        [primaryColor, secondaryColor, accentColor]
    )

    const currentColors = useMemo(
        () => (enableColorChange ? colorSchemes[colorSchemeIndex] : colorSchemes[0]),
        [colorSchemeIndex, colorSchemes, enableColorChange]
    )

    // Mouse position tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Smooth spring physics for magnetic effect
    const springConfig = { damping: 20, stiffness: 150, mass: 0.5 }
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig)
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig)
    const scale = useSpring(1, springConfig)

    // Generate particles
    useEffect(() => {
        if (!enableParticles) return
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 2,
        }))
        startTransition(() => setParticles(newParticles))
    }, [particleCount, enableParticles])

    // Magnetic hover effect
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!cardRef.current) return

            const rect = cardRef.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const deltaX = (e.clientX - centerX) / (rect.width / 2)
            const deltaY = (e.clientY - centerY) / (rect.height / 2)

            mouseX.set(deltaX * magneticStrength)
            mouseY.set(deltaY * magneticStrength)
        },
        [mouseX, mouseY, magneticStrength]
    )

    const handleMouseEnter = useCallback(() => {
        startTransition(() => setIsHovered(true))
        scale.set(1.05)
    }, [scale])

    const handleMouseLeave = useCallback(() => {
        startTransition(() => setIsHovered(false))
        mouseX.set(0)
        mouseY.set(0)
        scale.set(1)
    }, [mouseX, mouseY, scale])

    const handleClick = useCallback(() => {
        if (!enableColorChange) return
        startTransition(() => {
            setColorSchemeIndex((prev) => (prev + 1) % colorSchemes.length)
        })
    }, [colorSchemes.length, enableColorChange])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: "1000px",
                position: "relative",
                overflow: "visible",
            }}
        >
            <motion.div
                ref={cardRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    rotateX,
                    rotateY,
                    scale,
                    transformStyle: "preserve-3d",
                    cursor: enableColorChange ? "pointer" : "default",
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                {/* Floating shadow */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle at 50% 50%, ${currentColors.primary}40, transparent 70%)`,
                        filter: "blur(40px)",
                        transform: "translateZ(-50px)",
                        opacity: isHovered ? 0.8 : 0.4,
                    }}
                    animate={{
                        scale: isHovered ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />

                {/* Main glass card */}
                <motion.div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        borderRadius: "24px",
                        background: `linear-gradient(135deg, 
                            rgba(255, 255, 255, ${glassOpacity * 0.1}), 
                            rgba(255, 255, 255, ${glassOpacity * 0.05}))`,
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        overflow: "hidden",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {/* Liquid neon border */}
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: -2,
                            borderRadius: "24px",
                            background: `linear-gradient(45deg, ${currentColors.primary}, ${currentColors.secondary}, ${currentColors.accent}, ${currentColors.primary})`,
                            backgroundSize: "300% 300%",
                            opacity: isHovered ? 1 : 0.6,
                            filter: "blur(8px)",
                            zIndex: -1,
                        }}
                        animate={{
                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />

                    {/* Breathing glow overlay */}
                    {enableBreathing && (
                        <motion.div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: `radial-gradient(circle at 50% 50%, ${currentColors.accent}20, transparent 70%)`,
                                pointerEvents: "none",
                            }}
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    )}

                    {/* Morphing shapes */}
                    {enableMorphing && (
                        <>
                            <motion.div
                                style={{
                                    position: "absolute",
                                    top: "20%",
                                    right: "10%",
                                    width: "150px",
                                    height: "150px",
                                    background: `radial-gradient(circle, ${currentColors.primary}40, transparent)`,
                                    borderRadius: "50%",
                                    filter: "blur(30px)",
                                }}
                                animate={{
                                    x: [0, 30, 0],
                                    y: [0, -20, 0],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                            <motion.div
                                style={{
                                    position: "absolute",
                                    bottom: "20%",
                                    left: "10%",
                                    width: "120px",
                                    height: "120px",
                                    background: `radial-gradient(circle, ${currentColors.secondary}40, transparent)`,
                                    borderRadius: "50%",
                                    filter: "blur(30px)",
                                }}
                                animate={{
                                    x: [0, -20, 0],
                                    y: [0, 30, 0],
                                    scale: [1, 1.3, 1],
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5,
                                }}
                            />
                        </>
                    )}

                    {/* Particles */}
                    {enableParticles &&
                        particles.map((particle) => (
                            <motion.div
                                key={particle.id}
                                style={{
                                    position: "absolute",
                                    left: `${particle.x}%`,
                                    top: `${particle.y}%`,
                                    width: "3px",
                                    height: "3px",
                                    borderRadius: "50%",
                                    background: currentColors.accent,
                                    boxShadow: `0 0 10px ${currentColors.accent}`,
                                }}
                                animate={{
                                    y: [0, -20, 0],
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: particle.delay,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}

                    {/* Light reflection */}
                    <motion.div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "50%",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
                            pointerEvents: "none",
                            opacity: isHovered ? 0.4 : 0.2,
                        }}
                        animate={{
                            opacity: isHovered ? [0.2, 0.4, 0.2] : 0.2,
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                        }}
                    />

                    {/* Content container */}
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "40px",
                            zIndex: 1,
                        }}
                    >
                        {/* Subtitle */}
                        <motion.div
                            style={{
                                ...subtitleFont,
                                color: currentColors.accent,
                                textTransform: "uppercase",
                                letterSpacing: "3px",
                                marginBottom: "16px",
                                textShadow: `0 0 20px ${currentColors.accent}`,
                            }}
                            animate={{
                                opacity: isHovered ? 1 : 0.8,
                            }}
                        >
                            {subtitle}
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            style={{
                                ...titleFont,
                                color: "#FFFFFF",
                                textAlign: "center",
                                marginBottom: "24px",
                                textShadow: "0 0 30px rgba(255,255,255,0.5)",
                            }}
                            animate={{
                                scale: isHovered ? 1.05 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            {title}
                        </motion.div>

                        {/* Description */}
                        <motion.div
                            style={{
                                ...descriptionFont,
                                color: "rgba(255,255,255,0.8)",
                                textAlign: "center",
                                maxWidth: "80%",
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: isHovered ? 1 : 0.6,
                                y: isHovered ? 0 : 10,
                            }}
                            transition={{ duration: 0.4 }}
                        >
                            {description}
                        </motion.div>

                        {/* Hidden glowing elements revealed on hover */}
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    style={{
                                        marginTop: "32px",
                                        padding: "12px 32px",
                                        borderRadius: "50px",
                                        background: `linear-gradient(90deg, ${currentColors.primary}, ${currentColors.secondary})`,
                                        color: "#FFFFFF",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                        letterSpacing: "1px",
                                        textTransform: "uppercase",
                                        boxShadow: `0 0 30px ${currentColors.primary}80`,
                                        cursor: "pointer",
                                    }}
                                >
                                    Explore More
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Cyberpunk corner accents */}
                        <motion.div
                            style={{
                                position: "absolute",
                                top: "20px",
                                left: "20px",
                                width: "40px",
                                height: "40px",
                                borderTop: `2px solid ${currentColors.accent}`,
                                borderLeft: `2px solid ${currentColors.accent}`,
                                opacity: isHovered ? 1 : 0.5,
                            }}
                            animate={{
                                boxShadow: isHovered
                                    ? `0 0 20px ${currentColors.accent}`
                                    : `0 0 10px ${currentColors.accent}`,
                            }}
                        />
                        <motion.div
                            style={{
                                position: "absolute",
                                bottom: "20px",
                                right: "20px",
                                width: "40px",
                                height: "40px",
                                borderBottom: `2px solid ${currentColors.accent}`,
                                borderRight: `2px solid ${currentColors.accent}`,
                                opacity: isHovered ? 1 : 0.5,
                            }}
                            animate={{
                                boxShadow: isHovered
                                    ? `0 0 20px ${currentColors.accent}`
                                    : `0 0 10px ${currentColors.accent}`,
                            }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

addPropertyControls(FuturisticCard, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "NEURAL INTERFACE",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "NEXT-GEN",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Experience the future of interactive design with advanced physics and liquid animations",
        displayTextArea: true,
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
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "0.2em",
            lineHeight: "1em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.5em",
        },
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#00F0FF",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#FF00FF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#00FF88",
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Opacity",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
    },
    magneticStrength: {
        type: ControlType.Number,
        title: "Magnetic Strength",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
    },
    enableParticles: {
        type: ControlType.Boolean,
        title: "Particles",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 5,
        hidden: ({ enableParticles }) => !enableParticles,
    },
    enableMorphing: {
        type: ControlType.Boolean,
        title: "Morphing Shapes",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableBreathing: {
        type: ControlType.Boolean,
        title: "Breathing Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableColorChange: {
        type: ControlType.Boolean,
        title: "Click to Change Color",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
