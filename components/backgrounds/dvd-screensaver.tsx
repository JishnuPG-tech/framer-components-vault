// DVD screensaver-style component where an icon bounces around inside a container, changing direction when it hits the edges
import { useEffect, useState, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

interface DVDScreensaverProps {
    useCustomIcon: boolean
    icon: string
    customIcon: { src: string; alt: string }
    iconSize: number
    speed: number
    backgroundColor: string
    iconColor: string
    trailEffect: boolean
    bounceSound: boolean
    iconFont: any
    style?: CSSProperties
}

/**
 * DVD Screensaver
 * 
 * An icon that bounces around inside a container, changing direction when it hits the edges.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DVDScreensaver(props: DVDScreensaverProps) {
    const {
        useCustomIcon = false,
        icon = "📀",
        customIcon = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Custom Icon" },
        iconSize = 60,
        speed = 2,
        backgroundColor = "#000000",
        iconColor = "#FFFFFF",
        trailEffect = false,
        bounceSound = false,
        iconFont
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const iconRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<number>()
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { once: false, amount: 0.1 })
    
    const [position, setPosition] = useState({ x: 50, y: 50 })
    const [velocity, setVelocity] = useState({ x: speed, y: speed })
    const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([])
    const trailIdRef = useRef(0)

    const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
    ]
    const [colorIndex, setColorIndex] = useState(0)

    // Use refs to store current values for animation loop
    const positionRef = useRef({ x: 50, y: 50 })
    const velocityRef = useRef({ x: speed, y: speed })
    const colorIndexRef = useRef(0)

    // Initialize position based on container size
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        if (!isInitialized && containerRef.current) {
            const container = containerRef.current
            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight
            
            const initialX = containerWidth / 2 - iconSize / 2
            const initialY = containerHeight / 2 - iconSize / 2
            
            positionRef.current = { x: initialX, y: initialY }
            setPosition({ x: initialX, y: initialY })
            setIsInitialized(true)
        }
    }, [iconSize, isInitialized])

    const playBounceSound = () => {
        if (bounceSound && typeof window !== "undefined") {
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
                
                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.1)
            } catch (error) {
                // Silently fail if audio context is not available
            }
        }
    }

    const animate = () => {
        if (!containerRef.current || !iconRef.current) return

        const container = containerRef.current
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight
        
        // Use refs for current values
        let newX = positionRef.current.x + velocityRef.current.x
        let newY = positionRef.current.y + velocityRef.current.y
        let newVelX = velocityRef.current.x
        let newVelY = velocityRef.current.y
        let bounced = false

        // Check horizontal boundaries
        if (newX <= 0 || newX >= containerWidth - iconSize) {
            newVelX = -newVelX
            newX = newX <= 0 ? 0 : containerWidth - iconSize
            bounced = true
        }

        // Check vertical boundaries
        if (newY <= 0 || newY >= containerHeight - iconSize) {
            newVelY = -newVelY
            newY = newY <= 0 ? 0 : containerHeight - iconSize
            bounced = true
        }

        // Update refs
        positionRef.current = { x: newX, y: newY }
        velocityRef.current = { x: newVelX, y: newVelY }

        // Update state
        startTransition(() => {
            setPosition({ x: newX, y: newY })
            setVelocity({ x: newVelX, y: newVelY })
        })

        if (bounced) {
            playBounceSound()
            colorIndexRef.current = (colorIndexRef.current + 1) % colors.length
            startTransition(() => {
                setColorIndex(colorIndexRef.current)
            })
        }

        // Add to trail
        if (trailEffect) {
            startTransition(() => {
                setTrail(prev => {
                    const newTrail = [...prev, { 
                        x: newX + iconSize / 2, 
                        y: newY + iconSize / 2, 
                        id: trailIdRef.current++ 
                    }]
                    return newTrail.slice(-20) // Keep last 20 positions
                })
            })
        }

        if (!isStatic && isInView) {
            animationRef.current = requestAnimationFrame(animate)
        }
    }

    useEffect(() => {
        // Update refs when speed changes
        velocityRef.current = { x: speed, y: speed }
        setVelocity({ x: speed, y: speed })
    }, [speed])

    useEffect(() => {
        if (!isStatic && isInView) {
            animationRef.current = requestAnimationFrame(animate)
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isStatic, isInView, iconSize, trailEffect, bounceSound])

    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <div
                    style={{
                        fontSize: `${iconSize}px`,
                        color: colors[colorIndex],
                        userSelect: "none",
                        filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))"
                    }}
                >
                    {icon}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/* Trail effect */}
            {trailEffect && trail.map((point, index) => (
                <div
                    key={point.id}
                    style={{
                        position: "absolute",
                        left: point.x - 2,
                        top: point.y - 2,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: colors[colorIndex],
                        opacity: (index + 1) / trail.length * 0.5,
                        pointerEvents: "none"
                    }}
                />
            ))}

            {/* Bouncing icon */}
            <motion.div
                ref={iconRef}
                style={{
                    position: "absolute",
                    left: position.x,
                    top: position.y,
                    fontSize: `${iconSize}px`,
                    color: colors[colorIndex],
                    userSelect: "none",
                    filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))",
                    zIndex: 10,
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
                animate={{
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 0.1,
                    ease: "easeOut"
                }}
            >
                {useCustomIcon ? (
                    <img
                        src={customIcon.src}
                        alt={customIcon.alt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain"
                        }}
                    />
                ) : (
                    <span style={{ ...iconFont }}>{icon}</span>
                )}
            </motion.div>
        </div>
    )
}

addPropertyControls(DVDScreensaver, {
    useCustomIcon: {
        type: ControlType.Boolean,
        title: "Use Custom Icon",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    icon: {
        type: ControlType.String,
        title: "Icon",
        defaultValue: "📀",
        placeholder: "Enter emoji or text"
    },
    customIcon: {
        type: ControlType.ResponsiveImage,
        title: "Custom Icon"
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 60,
        min: 20,
        max: 120,
        step: 5,
        unit: "px"
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "px/frame"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000"
    },
    trailEffect: {
        type: ControlType.Boolean,
        title: "Trail Effect",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    bounceSound: {
        type: ControlType.Boolean,
        title: "Bounce Sound",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    }
})