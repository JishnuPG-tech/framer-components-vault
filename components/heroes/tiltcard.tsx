import * as React from "react"
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

/**
 * 3D Tilt Card
 * 
 * A card that tilts in 3D space based on cursor position with shadow effects.
 * 
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 400
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
function TiltCard(props) {
    const {
        image = {
            src: "https://framerusercontent.com/images/YnBYRlxvxFzRXG9rOYVJdkGBg.jpg",
            alt: "Blue flower"
        },
        tiltFactor = 15,
        perspective = 1000,
        borderRadius = 12,
        backgroundColor = "#FFFFFF",
        shadowColor = "rgba(0, 0, 0, 0.2)",
        shadowIntensity = 0.5,
        transitionDuration = 0.2,
        hoverScale = 1.05,
        glareEffect = true,
        glareIntensity = 0.5,
        glarePosition = 50,
        glareSize = 80,
    } = props

    const [isHovered, setIsHovered] = React.useState(false)
    const [tiltValues, setTiltValues] = React.useState({ x: 0, y: 0 })
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
    const cardRef = React.useRef(null)
    const isOnCanvas = useIsOnFramerCanvas()

    const handleMouseMove = React.useCallback((e) => {
        if (!cardRef.current || !isHovered || isOnCanvas) return

        const rect = cardRef.current.getBoundingClientRect()
        
        // Calculate mouse position relative to card center (in percentage, -50 to 50)
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 100
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 100
        
        setMousePosition({ x, y })
        
        // Calculate tilt values based on mouse position
        const tiltX = -(y / 50) * tiltFactor
        const tiltY = (x / 50) * tiltFactor
        
        setTiltValues({ x: tiltX, y: tiltY })
    }, [isHovered, tiltFactor, isOnCanvas])

    const handleMouseEnter = React.useCallback(() => {
        if (!isOnCanvas) setIsHovered(true)
    }, [isOnCanvas])

    const handleMouseLeave = React.useCallback(() => {
        if (!isOnCanvas) {
            setIsHovered(false)
            setTiltValues({ x: 0, y: 0 })
        }
    }, [isOnCanvas])

    // Calculate glare position based on mouse position
    const glareX = React.useMemo(() => {
        return isHovered ? 50 + (mousePosition.x / 2) : glarePosition
    }, [isHovered, mousePosition.x, glarePosition])
    
    const glareY = React.useMemo(() => {
        return isHovered ? 50 + (mousePosition.y / 2) : glarePosition
    }, [isHovered, mousePosition.y, glarePosition])

    return (
        <motion.div
            ref={cardRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                perspective: `${perspective}px`,
                transformStyle: "preserve-3d",
                cursor: "pointer",
                borderRadius: `${borderRadius}px`,
                overflow: "hidden",
            }}
            animate={{
                scale: isHovered ? hoverScale : 1,
            }}
            transition={{
                duration: transitionDuration,
                ease: "easeOut",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: `${borderRadius}px`,
                    overflow: "hidden",
                    backgroundColor,
                    transformStyle: "preserve-3d",
                    boxShadow: `0 10px 30px -10px ${shadowColor}`,
                }}
                animate={{
                    rotateX: tiltValues.x,
                    rotateY: tiltValues.y,
                    boxShadow: isHovered 
                        ? `0 25px 50px -12px rgba(0, 0, 0, ${shadowIntensity})`
                        : `0 10px 30px -10px ${shadowColor}`,
                }}
                transition={{
                    duration: transitionDuration,
                    ease: "easeOut",
                }}
            >
                <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: `${borderRadius}px`,
                        position: "relative",
                        zIndex: 1,
                    }}
                />
                
                {/* Glare effect */}
                {glareEffect && (
                    <motion.div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 2,
                            borderRadius: `${borderRadius}px`,
                            background: `radial-gradient(
                                circle at ${glareX}% ${glareY}%, 
                                rgba(255, 255, 255, ${isHovered ? glareIntensity : 0}) 0%, 
                                rgba(255, 255, 255, 0) ${glareSize}%
                            )`,
                            pointerEvents: "none",
                        }}
                        animate={{
                            opacity: isHovered ? 1 : 0,
                        }}
                        transition={{
                            duration: transitionDuration,
                        }}
                    />
                )}
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(TiltCard, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    tiltFactor: {
        type: ControlType.Number,
        title: "Tilt Amount",
        defaultValue: 15,
        min: 0,
        max: 45,
        step: 1,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 100,
        max: 2000,
        step: 50,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0, 0, 0, 0.2)",
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Intensity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "s",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    glareEffect: {
        type: ControlType.Boolean,
        title: "Glare Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glareIntensity: {
        type: ControlType.Number,
        title: "Glare Intensity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ glareEffect }) => !glareEffect,
    },
    glarePosition: {
        type: ControlType.Number,
        title: "Glare Position",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        hidden: ({ glareEffect }) => !glareEffect,
    },
    glareSize: {
        type: ControlType.Number,
        title: "Glare Size",
        defaultValue: 80,
        min: 10,
        max: 100,
        step: 1,
        hidden: ({ glareEffect }) => !glareEffect,
    },
})

export default TiltCard