// Standalone image scatter effect that can be applied to any content - images scatter outward on scroll

import { useScroll, useTransform, motion } from "framer-motion"
import { useRef, type CSSProperties, useState, useCallback, Children } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageScatterEffectProps {
    children?: React.ReactNode
    scatterDistance: number
    imageSize: number
    imageRadius: number
    scrollStart: number
    scrollEnd: number
    rotationAngle: number
    animationEasing: "spring" | "easeIn" | "easeOut" | "easeInOut" | "linear"
    imageEndSize: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicHeight 600
 * @framerIntrinsicWidth 400
 * @framerComponentUrl https://framer.com/m/Scroll-Scatter-xK9L.js
 */
export default function ScrollScatter(props: ImageScatterEffectProps) {
    const {
        children,
        scatterDistance = 100,
        imageSize = 400,
        imageRadius = 80,
        scrollStart = 0,
        scrollEnd = 1,
        rotationAngle = 360,
        animationEasing = "spring",
        imageEndSize = 200,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [focusedImageIndex, setFocusedImageIndex] = useState<number | null>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    // Scatter positions for 8 images - spreading to all sides
    const scatterData = [
        { x: -250, y: -330, scale: 0.5, rotate: -5 },
        { x: -450, y: -220, scale: 0.42, rotate: -7 },
        { x: -380, y: 190, scale: 0.5, rotate: 6 },
        { x: -150, y: 320, scale: 0.35, rotate: 4 },
        { x: 340, y: -390, scale: 0.46, rotate: 5 },
        { x: 500, y: -280, scale: 0.4, rotate: -4 },
        { x: 420, y: 200, scale: 0.4, rotate: 4 },
        { x: 210, y: 340, scale: 0.4, rotate: -6 },
    ]

    const scatterMultiplier = scatterDistance / 100

    // Get transition config based on easing type
    const getTransition = (delay: number) => {
        if (animationEasing === "spring") {
            return {
                type: "spring" as const,
                stiffness: 100,
                damping: 20,
                delay,
            }
        }
        return {
            type: "tween" as const,
            ease: animationEasing,
            duration: 0.6,
            delay,
        }
    }

    // Convert children to array
    const childrenArray = Children.toArray(children).slice(0, 8)
    const totalImages = childrenArray.length

    const handleImageKeyDown = useCallback(
        (e: React.KeyboardEvent, index: number) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                const nextIndex = (index + 1) % totalImages
                setFocusedImageIndex(nextIndex)
                const nextElement = document.getElementById(`scatter-image-${nextIndex}`)
                nextElement?.focus()
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                const prevIndex = (index - 1 + totalImages) % totalImages
                setFocusedImageIndex(prevIndex)
                const prevElement = document.getElementById(`scatter-image-${prevIndex}`)
                prevElement?.focus()
            } else if (e.key === "Home") {
                e.preventDefault()
                setFocusedImageIndex(0)
                const firstElement = document.getElementById("scatter-image-0")
                firstElement?.focus()
            } else if (e.key === "End") {
                e.preventDefault()
                const lastIndex = totalImages - 1
                setFocusedImageIndex(lastIndex)
                const lastElement = document.getElementById(`scatter-image-${lastIndex}`)
                lastElement?.focus()
            }
        },
        [totalImages]
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: imageSize,
                minHeight: imageSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
            }}
            role="region"
            aria-label="Image scatter effect container"
        >
            {/* Scattered Images */}
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
                role="group"
                aria-label={`Image gallery with ${totalImages} images`}
            >
                {childrenArray.map((child, index) => {
                    const scatter = scatterData[index]

                    // Calculate stagger delay - each image delayed by 0.05s
                    const staggerDelay = index * 0.05

                    // Adjust scroll progress range for stagger effect at both start and end
                    const staggerAmount = staggerDelay * 0.15
                    const adjustedStart = Math.min(scrollStart + staggerAmount, scrollEnd - 0.1)
                    const adjustedEnd = Math.min(scrollEnd + staggerAmount, 1)

                    const x = useTransform(
                        scrollYProgress,
                        [adjustedStart, adjustedEnd],
                        [0, scatter.x * scatterMultiplier]
                    )
                    const y = useTransform(
                        scrollYProgress,
                        [adjustedStart, adjustedEnd],
                        [0, scatter.y * scatterMultiplier]
                    )
                    const scale = useTransform(
                        scrollYProgress,
                        [adjustedStart, adjustedEnd],
                        [1, imageEndSize / imageSize]
                    )
                    const rotate = useTransform(
                        scrollYProgress,
                        [adjustedStart, adjustedEnd],
                        [0, rotationAngle]
                    )

                    return (
                        <motion.div
                            key={index}
                            id={`scatter-image-${index}`}
                            tabIndex={0}
                            role="img"
                            aria-label={`Gallery image ${index + 1} of ${totalImages}. Use arrow keys to navigate between images.`}
                            onKeyDown={(e) => handleImageKeyDown(e, index)}
                            onFocus={() => setFocusedImageIndex(index)}
                            onBlur={() => setFocusedImageIndex(null)}
                            style={{
                                position: "absolute",
                                width: imageSize,
                                height: imageSize,
                                borderRadius: imageRadius,
                                overflow: "hidden",
                                x,
                                y,
                                scale,
                                rotate,
                                outline: focusedImageIndex === index ? "3px solid #0099FF" : "none",
                                outlineOffset: "4px",
                                cursor: "pointer",
                                pointerEvents: "auto",
                            }}
                            transition={getTransition(staggerDelay)}
                        >
                            {child}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ScrollScatter, {
    children: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 8,
    },
    scatterDistance: {
        type: ControlType.Number,
        title: "Scatter Distance",
        defaultValue: 100,
        min: 40,
        max: 200,
        step: 1,
        unit: "%",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Start Size",
        defaultValue: 400,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
    },
    imageEndSize: {
        type: ControlType.Number,
        title: "End Size",
        defaultValue: 200,
        min: 0,
        max: 800,
        step: 10,
        unit: "px",
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 80,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
    },
    rotationAngle: {
        type: ControlType.Number,
        title: "Rotation Angle",
        defaultValue: 360,
        min: 0,
        max: 720,
        step: 15,
        unit: "°",
    },
    animationEasing: {
        type: ControlType.Enum,
        title: "Animation Easing",
        options: ["spring", "easeIn", "easeOut", "easeInOut", "linear"],
        optionTitles: ["Spring", "Ease In", "Ease Out", "Ease In Out", "Linear"],
        defaultValue: "spring",
    },
    scrollStart: {
        type: ControlType.Number,
        title: "Scroll Start",
        defaultValue: 0,
        min: 0,
        max: 0.9,
        step: 0.01,
    },
    scrollEnd: {
        type: ControlType.Number,
        title: "Scroll End",
        defaultValue: 1,
        min: 0.1,
        max: 1,
        step: 0.01,
    },
})
