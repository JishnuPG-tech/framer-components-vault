// Shutter reveal component with image A beneath image B, 10 shutters slide left to reveal image A
import {
    useState,
    useEffect,
    startTransition,
    useRef,
    type CSSProperties,
} from "react"
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
import type React from "react"

interface ShutterFlowProps {
    imageA: { src: string; alt: string }
    imageB: { src: string; alt: string }
    imageC: { src: string; alt: string }
    imageD: { src: string; alt: string }
    imageE: { src: string; alt: string }
    imageCount: number
    autoPlay: boolean
    duration: number
    delay: number
    staggerDelay: number
    triggerOnHover: boolean
    showControls: boolean
    shutterCount: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
function ShutterFlow(props: ShutterFlowProps) {
    const {
        imageA = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Image A",
        },
        imageB = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Image B",
        },
        imageC = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Image C",
        },
        imageD = {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Image D",
        },
        imageE = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Image E",
        },
        imageCount = 5,
        autoPlay = true,
        duration = 2,
        delay = 4,
        staggerDelay = 0,
        triggerOnHover = false,
        showControls = false,
        shutterCount = 10,
    } = props

    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const isStatic = useIsStaticRenderer()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: false })
    const innerTimeoutRef = useRef<number | null>(null)
    const manualTimeoutRef = useRef<number | null>(null)

    // Image sequence: B -> A -> C -> D -> E -> B (loop)
    const images = [imageB, imageA, imageC, imageD, imageE]
    const activeImages = images.slice(0, imageCount)
    const currentImage = activeImages[currentImageIndex]
    const nextImage =
        activeImages[(currentImageIndex + 1) % activeImages.length]

    useEffect(() => {
        if (isStatic || !autoPlay || !isInView || isPaused) return

        const timer = window.setTimeout(() => {
            startTransition(() => setIsAnimating(true))

            innerTimeoutRef.current = window.setTimeout(
                () => {
                    startTransition(() => {
                        setCurrentImageIndex(
                            (prev) => (prev + 1) % activeImages.length
                        )
                        setIsAnimating(false)
                    })
                    innerTimeoutRef.current = null
                },
                (duration + staggerDelay * shutterCount) * 1000
            )
        }, delay * 1000)

        return () => {
            clearTimeout(timer)
            if (innerTimeoutRef.current !== null) {
                clearTimeout(innerTimeoutRef.current)
                innerTimeoutRef.current = null
            }
        }
    }, [
        autoPlay,
        delay,
        isStatic,
        isInView,
        isPaused,
        currentImageIndex,
        duration,
        staggerDelay,
        shutterCount,
        activeImages.length,
    ])

    const triggerAnimation = () => {
        if (!isStatic && !isAnimating) {
            // Clear any existing manual timeout before starting a new one
            if (manualTimeoutRef.current !== null) {
                clearTimeout(manualTimeoutRef.current)
                manualTimeoutRef.current = null
            }

            startTransition(() => setIsAnimating(true))

            manualTimeoutRef.current = window.setTimeout(
                () => {
                    startTransition(() => {
                        setCurrentImageIndex(
                            (prev) => (prev + 1) % activeImages.length
                        )
                        setIsAnimating(false)
                    })
                    manualTimeoutRef.current = null
                },
                (duration + staggerDelay * shutterCount) * 1000
            )
        }
    }

    // Cleanup manual timeout on unmount
    useEffect(() => {
        return () => {
            if (manualTimeoutRef.current !== null) {
                clearTimeout(manualTimeoutRef.current)
                manualTimeoutRef.current = null
            }
        }
    }, [])

    const handleMouseEnter = () => {
        if (triggerOnHover) {
            triggerAnimation()
        }
    }

    const handleClick = () => {
        if (!autoPlay && !triggerOnHover) {
            triggerAnimation()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!autoPlay && !triggerOnHover) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                triggerAnimation()
            }
        }
    }

    const handlePlay = () => {
        if (!isStatic) {
            startTransition(() => {
                setIsPaused(false)
                triggerAnimation()
            })
        }
    }

    const handlePause = () => {
        if (!isStatic) {
            startTransition(() => setIsPaused(true))
        }
    }

    const handleReset = () => {
        if (!isStatic) {
            startTransition(() => {
                setCurrentImageIndex(0)
                setIsPaused(false)
                setIsAnimating(false)
            })
        }
    }

    const handleControlKeyDown = (
        e: React.KeyboardEvent,
        action: () => void
    ) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            action()
        }
    }

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
                <img
                    src={imageB.src}
                    alt={imageB.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: !autoPlay && !triggerOnHover ? "pointer" : "default",
            }}
            onMouseEnter={handleMouseEnter}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={!autoPlay && !triggerOnHover ? 0 : -1}
            role={!autoPlay && !triggerOnHover ? "button" : undefined}
            aria-label={
                !autoPlay && !triggerOnHover
                    ? "Trigger image transition"
                    : undefined
            }
        >
            {/* Bottom image - what gets revealed */}
            <img
                src={nextImage.src}
                alt={nextImage.alt}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 1,
                }}
            />

            {/* Shutter frames with overflow hidden */}
            {isInView &&
                Array.from({ length: shutterCount }, (_, index) => {
                    const shutterWidth = 100 / shutterCount
                    const backgroundSize = `${shutterCount * 100}% 100%`
                    const backgroundPosition = `${(index / (shutterCount - 1)) * 100}% 0`

                    return (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: `${index * shutterWidth}%`,
                                width: `calc(${shutterWidth}% + 0.1%)`,
                                height: "100%",
                                overflow: "hidden",
                                zIndex: 2,
                            }}
                        >
                            {/* Shutter containing current image */}
                            <motion.div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    backgroundImage: `url(${currentImage.src})`,
                                    backgroundSize: backgroundSize,
                                    backgroundPosition: backgroundPosition,
                                    backgroundRepeat: "no-repeat",
                                }}
                                initial={{ x: 0 }}
                                animate={{
                                    x: isAnimating && !isPaused ? "-100%" : 0,
                                }}
                                transition={{
                                    duration: duration,
                                    delay: index * staggerDelay,
                                    ease: "easeInOut",
                                }}
                            />
                        </div>
                    )
                })}

            {/* Control buttons */}
            {showControls && !isStatic && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 16,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: 8,
                        zIndex: 10,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        borderRadius: 8,
                        padding: 8,
                    }}
                >
                    <button
                        onClick={handlePlay}
                        onKeyDown={(e) => handleControlKeyDown(e, handlePlay)}
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "none",
                            borderRadius: 4,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                        aria-label="Play animation"
                    >
                        Play
                    </button>
                    <button
                        onClick={handlePause}
                        onKeyDown={(e) => handleControlKeyDown(e, handlePause)}
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "none",
                            borderRadius: 4,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                        aria-label="Pause animation"
                    >
                        Pause
                    </button>
                    <button
                        onClick={handleReset}
                        onKeyDown={(e) => handleControlKeyDown(e, handleReset)}
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "none",
                            borderRadius: 4,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                        aria-label="Reset animation"
                    >
                        Reset
                    </button>
                </div>
            )}
        </div>
    )
}

export default ShutterFlow

addPropertyControls(ShutterFlow, {
    imageCount: {
        type: ControlType.Number,
        title: "Image Count",
        defaultValue: 5,
        min: 2,
        max: 5,
        step: 1,
        displayStepper: true,
    },
    imageA: {
        type: ControlType.ResponsiveImage,
        title: "Image A (Top)",
    },
    imageB: {
        type: ControlType.ResponsiveImage,
        title: "Image B (Bottom)",
    },
    imageC: {
        type: ControlType.ResponsiveImage,
        title: "Image C",
        hidden: ({ imageCount }) => imageCount < 3,
    },
    imageD: {
        type: ControlType.ResponsiveImage,
        title: "Image D",
        hidden: ({ imageCount }) => imageCount < 4,
    },
    imageE: {
        type: ControlType.ResponsiveImage,
        title: "Image E",
        hidden: ({ imageCount }) => imageCount < 5,
    },
    shutterCount: {
        type: ControlType.Number,
        title: "Shutter Count",
        defaultValue: 10,
        min: 2,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Show Controls",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        description: "Duration in seconds for the shutter animation",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Start Delay",
        description:
            "Delay in seconds before the animation starts (set higher than duration)",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 0.1,
        unit: "s",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        description: "Delay in seconds between each shutter slice",
        defaultValue: 0,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    triggerOnHover: {
        type: ControlType.Boolean,
        title: "Hover Trigger",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ autoPlay }) => autoPlay,
    },
})
