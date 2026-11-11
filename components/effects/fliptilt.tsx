// Flipping card component with front and back content
import { useState, startTransition, useRef, useCallback } from "react"
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

interface FlipTiltProps {
    frontChildren: React.ReactNode
    backChildren: React.ReactNode
    borderRadius: number
    flipDirection: "horizontal" | "vertical" | "none"
    flipTrigger: "hover" | "click"
    animationDuration: number
    animationType: "smooth" | "bounce" | "spring" | "elastic" | "back" | "expo"
    shadow: string
    enableTilt: boolean
    tiltIntensity: "subtle" | "normal" | "dramatic" | "extreme"
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FlipTilt(props: FlipTiltProps) {
    const {
        frontChildren,
        backChildren,
        borderRadius,
        flipDirection,
        flipTrigger,
        animationDuration,
        animationType,
        shadow,
        enableTilt,
        tiltIntensity,
    } = props

    const [isFlipped, setIsFlipped] = useState(false)
    const [tiltX, setTiltX] = useState(0)
    const [tiltY, setTiltY] = useState(0)
    const [shadowX, setShadowX] = useState(0)
    const [shadowY, setShadowY] = useState(4)
    const cardRef = useRef<HTMLDivElement>(null)

    const getShadowValue = (shadowType: string, x: number, y: number) => {
        switch (shadowType) {
            case "none":
                return "none"
            case "small":
                return `${x}px ${y}px 8px rgba(0, 0, 0, 0.15)`
            case "medium":
                return `${x}px ${y}px 16px rgba(0, 0, 0, 0.2)`
            case "large":
                return `${x}px ${y}px 24px rgba(0, 0, 0, 0.25)`
            default:
                return `${x}px ${y}px 16px rgba(0, 0, 0, 0.2)`
        }
    }

    const shadowValue = getShadowValue(shadow, shadowX, shadowY)

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!cardRef.current) return

            const rect = cardRef.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const mouseX = e.clientX - centerX
            const mouseY = e.clientY - centerY

            // Calculate shadow offset based on mouse position
            const shadowOffsetX = (mouseX / (rect.width / 2)) * -8
            const shadowOffsetY = (mouseY / (rect.height / 2)) * -8 + 4 // Add base offset

            startTransition(() => {
                setShadowX(shadowOffsetX)
                setShadowY(shadowOffsetY)
            })

            if (!enableTilt) return

            const getTiltValue = () => {
                switch (tiltIntensity) {
                    case "subtle":
                        return 5
                    case "normal":
                        return 10
                    case "dramatic":
                        return 20
                    case "extreme":
                        return 30
                    default:
                        return 10
                }
            }

            const tiltValue = getTiltValue()
            const rotateX = (mouseY / (rect.height / 2)) * -tiltValue
            const rotateY = (mouseX / (rect.width / 2)) * tiltValue

            startTransition(() => {
                setTiltX(rotateX)
                setTiltY(rotateY)
            })
        },
        [enableTilt, tiltIntensity]
    )

    const handleMouseLeaveCard = useCallback(() => {
        startTransition(() => {
            setShadowX(0)
            setShadowY(4)
        })

        if (enableTilt) {
            startTransition(() => {
                setTiltX(0)
                setTiltY(0)
            })
        }

        if (flipTrigger === "hover") {
            startTransition(() => setIsFlipped(false))
        }
    }, [enableTilt, flipTrigger])

    const handleFlip = () => {
        if (flipTrigger === "click" && flipDirection !== "none") {
            startTransition(() => setIsFlipped(!isFlipped))
        }
    }

    const handleMouseEnter = () => {
        if (flipTrigger === "hover" && flipDirection !== "none") {
            startTransition(() => setIsFlipped(true))
        }
    }

    const isHorizontal = flipDirection === "horizontal"
    const rotateAxis = isHorizontal ? "rotateY" : "rotateX"

    const getTransition = () => {
        switch (animationType) {
            case "smooth":
                return {
                    duration: animationDuration,
                    ease: [0.4, 0.0, 0.2, 1],
                }
            case "bounce":
                return {
                    duration: animationDuration,
                    ease: [0.175, 0.885, 0.32, 1.275],
                }
            default:
                return {
                    duration: animationDuration,
                    ease: [0.4, 0.0, 0.2, 1],
                }
        }
    }

    const getTiltTransition = () => ({
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 0.8,
    })

    // Calculate final rotation values
    const getAnimateValues = () => {
        if (flipDirection === "none") {
            return {
                rotateX: enableTilt ? tiltX : 0,
                rotateY: enableTilt ? tiltY : 0,
            }
        }

        const flipRotation = isFlipped ? 180 : 0

        if (isHorizontal) {
            return {
                rotateY: enableTilt ? flipRotation + tiltY : flipRotation,
                rotateX: enableTilt ? tiltX : 0,
            }
        } else {
            return {
                rotateX: enableTilt ? flipRotation + tiltX : flipRotation,
                rotateY: enableTilt ? tiltY : 0,
            }
        }
    }

    return (
        <div
            ref={cardRef}
            style={{
                width: "100%",
                height: "100%",
                perspective: "1000px",
                cursor: flipTrigger === "click" ? "pointer" : "default",
            }}
            onClick={handleFlip}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeaveCard}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
                initial={{
                    rotateX: 0,
                    rotateY: 0,
                }}
                animate={getAnimateValues()}
                transition={getTransition()}
            >
                {/* Front Side */}
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        borderRadius,
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: shadowValue,
                        overflow: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    {frontChildren}
                </div>

                {/* Back Side */}
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        borderRadius,
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: shadowValue,
                        overflow: "hidden",
                        transform: isHorizontal
                            ? "rotateY(180deg)"
                            : "rotateX(180deg)",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    {backChildren}
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(FlipTilt, {
    frontChildren: {
        type: ControlType.Slot,
        title: "Front Content",
        maxCount: 5,
    },
    backChildren: {
        type: ControlType.Slot,
        title: "Back Content",
        maxCount: 5,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        unit: "px",
    },
    flipDirection: {
        type: ControlType.Enum,
        title: "Flip Direction",
        options: ["horizontal", "vertical", "none"],
        optionTitles: ["Horizontal", "Vertical", "None"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    flipTrigger: {
        type: ControlType.Enum,
        title: "Flip Trigger",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 1.2,
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation Type",
        options: ["smooth", "bounce"],
        optionTitles: ["Smooth", "Bounce"],
        defaultValue: "smooth",
        displaySegmentedControl: true,
        hidden: ({ enableTilt, flipDirection }) =>
            enableTilt && flipDirection === "none",
    },
    shadow: {
        type: ControlType.Enum,
        title: "Shadow Size",
        options: ["none", "small", "medium", "large"],
        optionTitles: ["None", "Small", "Medium", "Large"],
        defaultValue: "medium",
        displaySegmentedControl: true,
    },
    enableTilt: {
        type: ControlType.Boolean,
        title: "Enable Tilt",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tiltIntensity: {
        type: ControlType.Enum,
        title: "Tilt Intensity",
        options: ["subtle", "normal", "dramatic", "extreme"],
        optionTitles: ["Subtle", "Normal", "Dramatic", "Extreme"],
        defaultValue: "normal",
        displaySegmentedControl: true,
        hidden: ({ enableTilt }) => !enableTilt,
        description:
            "More components at [8ighty8 Studio](https://8ighty8studio.lemonsqueezy.com)",
    },
})
