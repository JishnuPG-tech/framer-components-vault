// Hover animation component that spreads icons like confetti
import {
    useState,
    useRef,
    useEffect,
    startTransition,
    type CSSProperties,
} from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ConfettiIconProps {
    icon: string
    iconColor: string
    backgroundColor: string
    particleCount: number
    spreadDistance: number
    minParticleDistance: number
    direction: "outward" | "inward" | "circular"
    outwardDirection: "allSides" | "up" | "down" | "sides"
    animationDuration: number
    iconSize: number
    useCustomSvg: boolean
    customSvgFile: string
    hoverAnimation: "scale" | "pulse" | "circular" | "bounce"
    style?: CSSProperties
}

/**
 * Confetti Icon Hover Animation
 *
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ConfettiIcon(props: ConfettiIconProps) {
    const {
        icon = "⭐",
        iconColor = "#FFD700",
        backgroundColor,
        particleCount = 12,
        spreadDistance = 80,
        direction = "outward",
        animationDuration = 0.8,
        iconSize = 24,
        useCustomSvg = false,
        customSvgFile = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        hoverAnimation = "scale",
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [particles, setParticles] = useState<
        Array<{ id: number; angle: number; distance: number }>
    >([])
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const newParticles = Array.from({ length: particleCount }, (_, i) => {
            let angle: number

            if (direction === "outward") {
                switch (props.outwardDirection || "allSides") {
                    case "up":
                        angle = 270 + (Math.random() * 60 - 30) // 240-300 degrees (upward cone)
                        break
                    case "down":
                        angle = 90 + (Math.random() * 60 - 30) // 60-120 degrees (downward cone)
                        break
                    case "sides":
                        angle =
                            Math.random() < 0.5
                                ? 180 + (Math.random() * 60 - 30) // 150-210 degrees (left)
                                : 0 + (Math.random() * 60 - 30) // -30 to 30 degrees (right)
                        break
                    case "allSides":
                        // Evenly distributed angles for all directions
                        angle = (360 / particleCount) * i
                        break
                    default:
                        angle = (360 / particleCount) * i
                }
            } else {
                // For inward and circular directions, use evenly distributed angles
                angle = (360 / particleCount) * i
            }

            return {
                id: i,
                angle,
                distance: spreadDistance + (Math.random() * 40 - 20), // More random distance variation
            }
        })
        startTransition(() => setParticles(newParticles))
    }, [particleCount, spreadDistance, direction, props.outwardDirection])

    const handleMouseEnter = () => {
        if (!isStatic) {
            startTransition(() => setIsHovered(true))
        }
    }

    const handleMouseLeave = () => {
        if (!isStatic) {
            startTransition(() => setIsHovered(false))
        }
    }

    const renderIcon = (size: number = iconSize) => {
        if (useCustomSvg && customSvgFile) {
            return (
                <img
                    src={customSvgFile}
                    alt="Custom SVG"
                    style={{
                        width: size,
                        height: size,
                        objectFit: "contain",
                    }}
                />
            )
        }

        return <span style={{ fontSize: size, color: iconColor }}>{icon}</span>
    }

    const getParticleAnimation = (particle: {
        angle: number
        distance: number
    }) => {
        const baseX =
            Math.cos((particle.angle * Math.PI) / 180) * particle.distance
        const baseY =
            Math.sin((particle.angle * Math.PI) / 180) * particle.distance

        switch (direction) {
            case "inward":
                return {
                    initial: {
                        x: baseX,
                        y: baseY,
                        scale: 0,
                        opacity: 0,
                        rotate: 0,
                    },
                    animate: {
                        x: 0,
                        y: 0,
                        scale: [0, 1.2, 0.8],
                        opacity: [0, 1, 0],
                        rotate: 360,
                    },
                }
            case "circular":
                return {
                    initial: { x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 },
                    animate: {
                        x: [0, baseX * 0.5, baseX, baseX * 0.5, 0],
                        y: [0, baseY * 0.5, baseY, baseY * 0.5, 0],
                        scale: [0, 1.2, 1, 1.2, 0.8],
                        opacity: [0, 1, 1, 1, 0],
                        rotate: 720,
                    },
                }
            default: // outward
                return {
                    initial: { x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 },
                    animate: {
                        x: baseX,
                        y: baseY,
                        scale: [0, 1.2, 0.8],
                        opacity: [0, 1, 0],
                        rotate: 360,
                    },
                }
        }
    }

    const getMainIconAnimation = () => {
        switch (hoverAnimation) {
            case "pulse":
                return {
                    scale: isHovered ? [1, 1.3, 1.1] : 1,
                    opacity: isHovered ? [1, 0.8, 1] : 1,
                }
            case "circular":
                return {
                    scale: isHovered ? 1.1 : 1,
                    rotate: isHovered ? 360 : 0,
                    x: isHovered ? [0, 10, -10, 0] : 0,
                    y: isHovered ? [0, -10, 10, 0] : 0,
                }
            case "bounce":
                return {
                    scale: isHovered ? [1, 1.2, 0.9, 1.1] : 1,
                    y: isHovered ? [0, -10, 5, 0] : 0,
                }
            default: // scale
                return {
                    scale: isHovered ? 1.2 : 1,
                    rotate: isHovered ? 360 : 0,
                }
        }
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...(backgroundColor &&
                backgroundColor.trim() !== "" &&
                backgroundColor !== "transparent"
                    ? {
                          backgroundColor,
                          borderRadius: "50%",
                      }
                    : {}),
                cursor: "pointer",
                overflow: "visible",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Main Icon */}
            <motion.div
                style={{
                    zIndex: 2,
                    userSelect: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                animate={getMainIconAnimation()}
                transition={{
                    duration: animationDuration,
                    ease: "easeOut",
                    times:
                        hoverAnimation === "pulse" ||
                        hoverAnimation === "bounce" ||
                        hoverAnimation === "circular"
                            ? [0, 0.5, 1]
                            : undefined,
                }}
            >
                {renderIcon()}
            </motion.div>

            {/* Confetti Particles */}
            <AnimatePresence mode="wait">
                {isHovered &&
                    !isStatic &&
                    particles.map((particle) => {
                        const animation = getParticleAnimation(particle)

                        return (
                            <motion.div
                                key={particle.id}
                                style={{
                                    position: "absolute",
                                    userSelect: "none",
                                    zIndex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                initial={animation.initial}
                                animate={animation.animate}
                                exit={{
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: animationDuration,
                                    ease: "easeOut",
                                    times:
                                        direction === "circular"
                                            ? [0, 0.3, 0.6, 0.8, 1]
                                            : [0, 0.6, 1],
                                }}
                            >
                                {renderIcon(iconSize * 0.6)}
                            </motion.div>
                        )
                    })}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(ConfettiIcon, {
    useCustomSvg: {
        type: ControlType.Boolean,
        title: "Use Custom SVG",
        defaultValue: false,
        enabledTitle: "Custom SVG",
        disabledTitle: "Emoji",
    },
    customSvgFile: {
        type: ControlType.File,
        title: "Custom SVG File",
        allowedFileTypes: ["svg"],
        hidden: ({ useCustomSvg }) => !useCustomSvg,
    },
    icon: {
        type: ControlType.String,
        title: "Emoji Icon",
        defaultValue: "⭐",
        placeholder: "Enter emoji...",
        hidden: ({ useCustomSvg }) => useCustomSvg,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFD700",
        optional: true,
        hidden: ({ useCustomSvg }) => useCustomSvg,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        optional: true,
    },
    hoverAnimation: {
        type: ControlType.Enum,
        title: "Hover Animation",
        defaultValue: "scale",
        options: ["scale", "pulse", "circular", "bounce"],
        optionTitles: ["Scale", "Pulse", "Circular", "Bounce"],
        displaySegmentedControl: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Animation Direction",
        defaultValue: "outward",
        options: ["outward", "inward", "circular"],
        optionTitles: ["Outward", "Inward", "Circular"],
        displaySegmentedControl: false,
    },
    outwardDirection: {
        type: ControlType.Enum,
        title: "Outward Direction",
        defaultValue: "allSides",
        options: ["allSides", "up", "down", "sides"],
        optionTitles: ["All Sides", "Up", "Down", "Sides"],
        displaySegmentedControl: false,
        hidden: ({ direction }) => direction !== "outward",
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        defaultValue: 12,
        min: 4,
        max: 24,
        step: 1,
    },
    spreadDistance: {
        type: ControlType.Number,
        title: "Spread Distance",
        defaultValue: 80,
        min: 40,
        max: 150,
        step: 5,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.8,
        min: 0.3,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 24,
        min: 12,
        step: 2,
        unit: "px",
    },
})
