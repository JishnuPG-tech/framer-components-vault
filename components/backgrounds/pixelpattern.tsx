// Animated pixel background pattern with customizable box size, timing, and random fill
import { useEffect, useState, useMemo, startTransition, useRef } from "react"
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

interface PixelPatternProps {
    boxSize: number
    fillPercentage: number
    animationDuration: number
    staggerDelay: number
    backgroundColor: string
    pixelColor: string
    randomize: boolean
    positionMode: "full" | "left" | "right" | "top" | "bottom" | "custom"
    customLeft: number
    customRight: number
    customTop: number
    customBottom: number
    animationType: "fade" | "scale" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "rotate" | "bounce" | "flip" | "wave" | "blink"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function PixelPattern(props: PixelPatternProps) {
    const {
        boxSize = 20,
        fillPercentage = 50,
        animationDuration = 0.5,
        staggerDelay = 0.05,
        backgroundColor = "#000000",
        pixelColor = "#FFFFFF",
        randomize = true,
        positionMode = "full",
        customLeft = 0,
        customRight = 100,
        customTop = 0,
        customBottom = 100,
        animationType = "scale",
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return

        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect()
                startTransition(() => setDimensions({ width, height }))
            }
        }

        updateDimensions()

        const resizeObserver = new ResizeObserver(updateDimensions)
        resizeObserver.observe(containerRef.current)

        return () => resizeObserver.disconnect()
    }, [])

    const pixels = useMemo(() => {
        const cols = Math.ceil(dimensions.width / boxSize)
        const rows = Math.ceil(dimensions.height / boxSize)
        
        // Calculate bounds based on position mode
        let leftBound = 0
        let rightBound = cols
        let topBound = 0
        let bottomBound = rows

        switch (positionMode) {
            case "left":
                rightBound = Math.floor(cols / 2)
                break
            case "right":
                leftBound = Math.ceil(cols / 2)
                break
            case "top":
                bottomBound = Math.floor(rows / 2)
                break
            case "bottom":
                topBound = Math.ceil(rows / 2)
                break
            case "custom":
                leftBound = Math.floor((cols * customLeft) / 100)
                rightBound = Math.ceil((cols * customRight) / 100)
                topBound = Math.floor((rows * customTop) / 100)
                bottomBound = Math.ceil((rows * customBottom) / 100)
                break
        }

        const allPositions = []
        for (let row = topBound; row < bottomBound; row++) {
            for (let col = leftBound; col < rightBound; col++) {
                allPositions.push({ row, col, id: `${row}-${col}` })
            }
        }

        const totalPixels = allPositions.length
        const pixelsToShow = Math.floor((totalPixels * fillPercentage) / 100)

        if (randomize) {
            for (let i = allPositions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]]
            }
        }

        return allPositions.slice(0, pixelsToShow).map((pos, index) => ({
            ...pos,
            delay: index * staggerDelay,
        }))
    }, [dimensions, boxSize, fillPercentage, randomize, staggerDelay, positionMode, customLeft, customRight, customTop, customBottom])

    const getAnimationVariants = (type: string) => {
        switch (type) {
            case "fade":
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                }
            case "scale":
                return {
                    initial: { opacity: 0, scale: 0 },
                    animate: { opacity: 1, scale: 1 },
                }
            case "blink":
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: [0, 1, 1, 0.3, 1, 0, 1] },
                }
            case "slideUp":
                return {
                    initial: { opacity: 0, y: boxSize },
                    animate: { opacity: 1, y: 0 },
                }
            case "slideDown":
                return {
                    initial: { opacity: 0, y: -boxSize },
                    animate: { opacity: 1, y: 0 },
                }
            case "slideLeft":
                return {
                    initial: { opacity: 0, x: boxSize },
                    animate: { opacity: 1, x: 0 },
                }
            case "slideRight":
                return {
                    initial: { opacity: 0, x: -boxSize },
                    animate: { opacity: 1, x: 0 },
                }
            case "rotate":
                return {
                    initial: { opacity: 0, rotate: -180, scale: 0 },
                    animate: { opacity: 1, rotate: 0, scale: 1 },
                }
            case "bounce":
                return {
                    initial: { opacity: 0, scale: 0, y: -boxSize * 2 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                }
            case "flip":
                return {
                    initial: { opacity: 0, rotateY: 90 },
                    animate: { opacity: 1, rotateY: 0 },
                }
            case "wave":
                return {
                    initial: { opacity: 0, scale: 0, rotate: 0 },
                    animate: { 
                        opacity: 1, 
                        scale: [0, 1.2, 1], 
                        rotate: [0, 10, -10, 0] 
                    },
                }
            default:
                return {
                    initial: { opacity: 0, scale: 0 },
                    animate: { opacity: 1, scale: 1 },
                }
        }
    }

    const getEasing = (type: string) => {
        switch (type) {
            case "bounce":
                return "easeOut"
            case "wave":
                return "easeInOut"
            case "blink":
                return "easeInOut"
            default:
                return "easeOut"
        }
    }

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
                }}
            >
                {pixels.map((pixel) => (
                    <div
                        key={pixel.id}
                        style={{
                            position: "absolute",
                            left: pixel.col * boxSize,
                            top: pixel.row * boxSize,
                            width: boxSize,
                            height: boxSize,
                            backgroundColor: pixelColor,
                        }}
                    />
                ))}
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
                overflow: "hidden",
            }}
        >
            {pixels.map((pixel) => {
                const variants = getAnimationVariants(animationType)
                const isBlinkMode = animationType === "blink"
                const blinkDuration = isBlinkMode ? 1.5 + Math.random() * 2.5 : animationDuration
                
                return (
                    <motion.div
                        key={pixel.id}
                        initial={variants.initial}
                        animate={variants.animate}
                        transition={{
                            duration: isBlinkMode ? blinkDuration : animationDuration,
                            delay: pixel.delay,
                            ease: getEasing(animationType),
                            repeat: isBlinkMode ? Infinity : 0,
                            repeatDelay: isBlinkMode ? Math.random() * 1 : 0,
                        }}
                        style={{
                            position: "absolute",
                            left: pixel.col * boxSize,
                            top: pixel.row * boxSize,
                            width: boxSize,
                            height: boxSize,
                            backgroundColor: pixelColor,
                        }}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(PixelPattern, {
    boxSize: {
        type: ControlType.Number,
        title: "Box Size",
        defaultValue: 50,
        min: 5,
        max: 100,
        step: 1,
        unit: "px",
    },
    fillPercentage: {
        type: ControlType.Number,
        title: "Fill %",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        defaultValue: "blink",
        options: ["fade", "scale", "slideUp", "slideDown", "slideLeft", "slideRight", "rotate", "bounce", "flip", "wave", "blink"],
        optionTitles: ["Fade", "Scale", "Slide Up", "Slide Down", "Slide Left", "Slide Right", "Rotate", "Bounce", "Flip", "Wave", "Blink"],
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.02,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    randomize: {
        type: ControlType.Boolean,
        title: "Random Pattern",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0, 0, 0, 0)",
    },
    pixelColor: {
        type: ControlType.Color,
        title: "Pixel Color",
        defaultValue: "#808080",
    },
    positionMode: {
        type: ControlType.Enum,
        title: "Position",
        defaultValue: "full",
        options: ["full", "left", "right", "top", "bottom", "custom"],
        optionTitles: ["Full", "Left Half", "Right Half", "Top Half", "Bottom Half", "Custom"],
    },
    customLeft: {
        type: ControlType.Number,
        title: "Left %",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.positionMode !== "custom",
    },
    customRight: {
        type: ControlType.Number,
        title: "Right %",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.positionMode !== "custom",
    },
    customTop: {
        type: ControlType.Number,
        title: "Top %",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.positionMode !== "custom",
    },
    customBottom: {
        type: ControlType.Number,
        title: "Bottom %",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.positionMode !== "custom",
    },
})