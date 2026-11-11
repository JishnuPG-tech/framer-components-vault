// Follow eyes that follow the mouse cursor with smooth pupil tracking
import { useEffect, useState, useRef, startTransition, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface FollowEyesProps {
    eyeColor: string
    pupilColor: string
    eyeSize: number
    pupilSize: number
    eyeSpacing: number
    trackingSpeed: number
    trackingRange: number
    eyeCount: "one" | "two"
    enableBlinking: boolean
    blinkInterval: number
    style?: CSSProperties
}

/**
 * Follow Eyes
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FollowEyes(props: FollowEyesProps) {
    const {
        eyeColor,
        pupilColor,
        eyeSize,
        pupilSize: rawPupilSize,
        eyeSpacing,
        trackingSpeed,
        trackingRange,
        eyeCount,
        enableBlinking,
        blinkInterval,
        style,
    } = props

    const pupilSize = useMemo(() => Math.min(rawPupilSize, eyeSize * 0.8), [rawPupilSize, eyeSize])

    const containerRef = useRef<HTMLDivElement>(null)
    const [leftPupilPos, setLeftPupilPos] = useState({ x: 0, y: 0 })
    const [rightPupilPos, setRightPupilPos] = useState({ x: 0, y: 0 })
    const [centerPupilPos, setCenterPupilPos] = useState({ x: 0, y: 0 })
    const [isBlinking, setIsBlinking] = useState(false)
    const isStatic = useIsStaticRenderer()

    const maxDistance = useMemo(() => (eyeSize - pupilSize) / 2 * (trackingRange / 100), [eyeSize, pupilSize, trackingRange])

    useEffect(() => {
        if (isStatic || !enableBlinking) return

        const blinkDuration = 200
        const interval = setInterval(() => {
            startTransition(() => setIsBlinking(true))
            setTimeout(() => {
                startTransition(() => setIsBlinking(false))
            }, blinkDuration)
        }, blinkInterval)

        return () => clearInterval(interval)
    }, [isStatic, enableBlinking, blinkInterval])

    useEffect(() => {
        if (isStatic) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const mouseX = e.clientX - centerX
            const mouseY = e.clientY - centerY
            
            if (eyeCount === "one") {
                const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY)
                
                if (distance === 0) {
                    startTransition(() => setCenterPupilPos({ x: 0, y: 0 }))
                    return
                }

                const clampedDistance = Math.min(distance, maxDistance)
                const angle = Math.atan2(mouseY, mouseX)

                startTransition(() => {
                    setCenterPupilPos({
                        x: Math.cos(angle) * clampedDistance,
                        y: Math.sin(angle) * clampedDistance,
                    })
                })
            } else {
                const leftEyeOffsetX = -eyeSpacing / 2
                const rightEyeOffsetX = eyeSpacing / 2

                const calculatePupilPosition = (eyeOffsetX: number) => {
                    const relativeX = mouseX - eyeOffsetX
                    const relativeY = mouseY

                    const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY)
                    
                    if (distance === 0) return { x: 0, y: 0 }

                    const clampedDistance = Math.min(distance, maxDistance)
                    const angle = Math.atan2(relativeY, relativeX)

                    return {
                        x: Math.cos(angle) * clampedDistance,
                        y: Math.sin(angle) * clampedDistance,
                    }
                }

                const leftPos = calculatePupilPosition(leftEyeOffsetX)
                const rightPos = calculatePupilPosition(rightEyeOffsetX)

                startTransition(() => {
                    setLeftPupilPos(leftPos)
                    setRightPupilPos(rightPos)
                })
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [isStatic, eyeSpacing, maxDistance, eyeCount])

    const containerWidth = useMemo(() => eyeCount === "one" ? eyeSize : eyeSize * 2 + eyeSpacing, [eyeCount, eyeSize, eyeSpacing])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: eyeCount === "two" ? eyeSpacing : 0,
                overflow: "visible",
                position: "relative",
                width: containerWidth,
                height: eyeSize,
            }}
        >
            {eyeCount === "one" ? (
                <div
                    style={{
                        width: eyeSize,
                        height: eyeSize,
                        borderRadius: "50%",
                        overflow: "hidden",
                    }}
                >
                    <motion.div
                        style={{
                            width: eyeSize,
                            height: eyeSize,
                            borderRadius: "50%",
                            backgroundColor: eyeColor,
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transformOrigin: "center",
                        }}
                        animate={{
                            scaleY: isBlinking ? 0.3 : 1,
                        }}
                        transition={{
                            duration: 0.1,
                            ease: "easeInOut",
                        }}
                    >
                        <motion.div
                            style={{
                                width: pupilSize,
                                height: pupilSize,
                                borderRadius: "50%",
                                backgroundColor: pupilColor,
                                opacity: isBlinking ? 0 : 1,
                            }}
                            animate={{
                                x: centerPupilPos.x,
                                y: centerPupilPos.y,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: trackingSpeed,
                                damping: 20,
                            }}
                        />
                    </motion.div>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            width: eyeSize,
                            height: eyeSize,
                            borderRadius: "50%",
                            overflow: "hidden",
                        }}
                    >
                        <motion.div
                            style={{
                                width: eyeSize,
                                height: eyeSize,
                                borderRadius: "50%",
                                backgroundColor: eyeColor,
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transformOrigin: "center",
                            }}
                            animate={{
                                scaleY: isBlinking ? 0.3 : 1,
                            }}
                            transition={{
                                duration: 0.1,
                                ease: "easeInOut",
                            }}
                        >
                            <motion.div
                                style={{
                                    width: pupilSize,
                                    height: pupilSize,
                                    borderRadius: "50%",
                                    backgroundColor: pupilColor,
                                    opacity: isBlinking ? 0 : 1,
                                }}
                                animate={{
                                    x: leftPupilPos.x,
                                    y: leftPupilPos.y,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: trackingSpeed,
                                    damping: 20,
                                }}
                            />
                        </motion.div>
                    </div>

                    <div
                        style={{
                            width: eyeSize,
                            height: eyeSize,
                            borderRadius: "50%",
                            overflow: "hidden",
                        }}
                    >
                        <motion.div
                            style={{
                                width: eyeSize,
                                height: eyeSize,
                                borderRadius: "50%",
                                backgroundColor: eyeColor,
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transformOrigin: "center",
                            }}
                            animate={{
                                scaleY: isBlinking ? 0.3 : 1,
                            }}
                            transition={{
                                duration: 0.1,
                                ease: "easeInOut",
                            }}
                        >
                            <motion.div
                                style={{
                                    width: pupilSize,
                                    height: pupilSize,
                                    borderRadius: "50%",
                                    backgroundColor: pupilColor,
                                    opacity: isBlinking ? 0 : 1,
                                }}
                                animate={{
                                    x: rightPupilPos.x,
                                    y: rightPupilPos.y,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: trackingSpeed,
                                    damping: 20,
                                }}
                            />
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    )
}

addPropertyControls(FollowEyes, {
    eyeCount: {
        type: ControlType.Enum,
        title: "Eye Count",
        options: ["one", "two"],
        optionTitles: ["One", "Two"],
        defaultValue: "two",
        displaySegmentedControl: true,
        description: "Number of eyes (1 or 2).",
    },
    eyeColor: {
        type: ControlType.Color,
        title: "Eye Color",
        defaultValue: "#FFFFFF",
        description: "Color of the eye background.",
    },
    pupilColor: {
        type: ControlType.Color,
        title: "Pupil Color",
        defaultValue: "#000000",
        description: "Color of the pupil.",
    },
    eyeSize: {
        type: ControlType.Number,
        title: "Eye Size",
        defaultValue: 120,
        min: 40,
        max: 300,
        step: 1,
        unit: "px",
        description: "Overall size of the eye shape.",
    },
    pupilSize: {
        type: ControlType.Number,
        title: "Pupil Size",
        defaultValue: 40,
        min: 10,
        max: 100,
        step: 1,
        unit: "px",
        description: "Size of the pupil inside the eye.",
    },
    eyeSpacing: {
        type: ControlType.Number,
        title: "Eye Gap",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: ({ eyeCount }) => eyeCount === "one",
        description: "Space between the two eyes when using 2 eyes.",
    },
    trackingSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 150,
        min: 50,
        max: 500,
        step: 10,
        description: "How quickly the eyes follow the cursor.",
    },
    trackingRange: {
        type: ControlType.Number,
        title: "Range",
        defaultValue: 80,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        description: "How far the pupils can move inside the eye.",
    },
    enableBlinking: {
        type: ControlType.Boolean,
        title: "Blinking",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Turn blinking animation on or off.",
    },
    blinkInterval: {
        type: ControlType.Number,
        title: "Blink Interval",
        defaultValue: 3000,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
        hidden: ({ enableBlinking }) => !enableBlinking,
        description: "How often the eye blinks.",
    },
})