// Interactive box with magnetic arrow button that follows cursor and returns to bottom-left position
import { useRef, useState, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useSpring } from "framer-motion"

interface MagneticArrowButtonProps {
    backgroundColor: string
    buttonColor: string
    buttonSize: number
    magneticStrength: number
    springStiffness: number
    springDamping: number
    arrowColor: string
    arrowRotation: number
    followStrength: number
    offsetX: number
    offsetY: number
    images: { src: string; alt?: string }[]
    imageFit: "cover" | "contain" | "fill" | "none" | "scale-down"
    maskSettings: {
        effect: "circle" | "square" | "wipe"
        duration: number
        rotation: number
    }
    style?: CSSProperties
}

/**
 * Magnetic Arrow Box - Box with arrow button that follows cursor and returns to bottom-left
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MagneticArrowButton(props: MagneticArrowButtonProps) {
    const {
        backgroundColor = "#F5F5F5",
        buttonColor = "#FFFFFF",
        buttonSize = 80,
        magneticStrength = 0.3,
        springStiffness = 150,
        springDamping = 15,
        arrowColor = "#000000",
        arrowRotation = 0,
        followStrength = 1,
        offsetX = 0,
        offsetY = 0,
        images = [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2 - Purple" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3 - Orange" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4 - Yellow" },
        ],
        imageFit = "cover",
        maskSettings = { effect: "circle", duration: 0.8, rotation: -45 },
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [previousImageIndex, setPreviousImageIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    const x = useSpring(0, { stiffness: springStiffness, damping: springDamping })
    const y = useSpring(0, { stiffness: springStiffness, damping: springDamping })

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            const defaultX = buttonSize / 2
            const defaultY = rect.height - buttonSize / 2

            // Calculate target position for button center to align with cursor
            const targetX = mouseX - defaultX + offsetX
            const targetY = mouseY - defaultY + offsetY

            startTransition(() => setIsHovered(true))
            x.set(targetX * followStrength)
            y.set(targetY * followStrength)
        },
        [buttonSize, followStrength, offsetX, offsetY, x, y]
    )

    const handleMouseEnter = useCallback(() => {
        startTransition(() => setIsHovered(true))
    }, [])

    const handleMouseLeave = useCallback(() => {
        startTransition(() => setIsHovered(false))
        x.set(0)
        y.set(0)
    }, [x, y])

    const handleClick = useCallback(() => {
        if (isTransitioning || images.length === 0) return
        
        startTransition(() => {
            setIsTransitioning(true)
            setPreviousImageIndex(currentImageIndex)
            setCurrentImageIndex((prev) => (prev + 1) % images.length)
        })
        
        setTimeout(() => {
            startTransition(() => setIsTransitioning(false))
        }, maskSettings.duration * 1000)
    }, [isTransitioning, maskSettings.duration, currentImageIndex, images.length])

    const getClipPath = (effect: string) => {
        switch (effect) {
            case "circle":
                return {
                    initial: "circle(0% at 50% 50%)",
                    animate: "circle(150% at 50% 50%)",
                }
            case "square":
                return {
                    initial: "inset(50% 50% 50% 50%)",
                    animate: "inset(0% 0% 0% 0%)",
                }
            case "wipe":
                return {
                    initial: "inset(0% 100% 0% 0%)",
                    animate: "inset(0% 0% 0% 0%)",
                }
            default:
                return {
                    initial: "circle(0% at 50% 50%)",
                    animate: "circle(150% at 50% 50%)",
                }
        }
    }

    const clipPath = getClipPath(maskSettings.effect)

    const currentImage = images[currentImageIndex] || images[0]
    const previousImage = images[previousImageIndex] || images[0]

    if (images.length === 0) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    borderRadius: 24,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: 16,
                }}
            >
                Add images to get started
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                borderRadius: 24,
                overflow: "hidden",
                cursor: isHovered ? "pointer" : "default",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            {/* Previous image (base layer) */}
            <div style={{ position: "absolute", inset: 0 }}>
                <img
                    src={previousImage.src}
                    alt={previousImage.alt || `Image ${previousImageIndex + 1}`}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit,
                        objectPosition: "center",
                    }}
                />
            </div>

            {/* Current image with mask transition */}
            <motion.div
                key={currentImageIndex}
                initial={{ clipPath: clipPath.initial, rotate: maskSettings.rotation }}
                animate={{ clipPath: clipPath.animate, rotate: 0 }}
                transition={{
                    duration: maskSettings.duration,
                    ease: [0.43, 0.13, 0.23, 0.96],
                }}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    inset: 0,
                }}
            >
                <motion.div
                    initial={{ rotate: -maskSettings.rotation }}
                    animate={{ rotate: 0 }}
                    transition={{
                        duration: maskSettings.duration,
                        ease: [0.43, 0.13, 0.23, 0.96],
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <img
                        src={currentImage.src}
                        alt={currentImage.alt || `Image ${currentImageIndex + 1}`}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: imageFit,
                            objectPosition: "center",
                        }}
                    />
                </motion.div>
            </motion.div>

            <motion.div
                style={{
                    position: "absolute",
                    left: buttonSize / 2,
                    bottom: buttonSize / 2,
                    width: buttonSize,
                    height: buttonSize,
                    x,
                    y,
                    transform: "translate(-50%, -50%)",
                }}
            >
                <motion.div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: buttonColor,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg
                        width={buttonSize * 0.4}
                        height={buttonSize * 0.4}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={arrowColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transform: `rotate(${arrowRotation}deg)` }}
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </motion.div>
            </motion.div>
        </div>
    )
}

addPropertyControls(MagneticArrowButton, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2 - Purple" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3 - Orange" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4 - Yellow" },
        ],
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "none", "scale-down"],
        optionTitles: ["Cover", "Contain", "Fill", "None", "Scale Down"],
        defaultValue: "cover",
        displaySegmentedControl: false,
    },
    maskSettings: {
        type: ControlType.Object,
        title: "Mask Settings",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["circle", "square", "wipe"],
                optionTitles: ["Circle", "Square", "Wipe"],
                defaultValue: "circle",
                displaySegmentedControl: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.8,
                min: 0.2,
                max: 2,
                step: 0.1,
                unit: "s",
            },
            rotation: {
                type: ControlType.Number,
                title: "Start Rotation",
                defaultValue: -45,
                min: -180,
                max: 180,
                step: 15,
                unit: "deg",
            },
        },
        defaultValue: {
            effect: "circle",
            duration: 0.8,
            rotation: -45,
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#FFFFFF",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#000000",
    },
    buttonSize: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 80,
        min: 40,
        max: 150,
        step: 5,
        unit: "px",
    },
    arrowRotation: {
        type: ControlType.Number,
        title: "Arrow Rotation",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 15,
        unit: "deg",
    },
    followStrength: {
        type: ControlType.Number,
        title: "Follow Strength",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
    },
    magneticStrength: {
        type: ControlType.Number,
        title: "Magnetic Strength (Legacy)",
        defaultValue: 0.3,
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: () => true,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        defaultValue: 15,
        min: 5,
        max: 30,
        step: 1,
    },
})