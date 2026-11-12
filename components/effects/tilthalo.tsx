// Create a circular image gallery component with rotating artwork display
// TiltHalo: A circular image gallery that displays images in a rotating halo formation with 3D tilt interactions, focus mode for viewing individual images, and customizable flip animations on hover.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
import {
    motion,
    useSpring,
    useMotionValue,
    AnimatePresence,
} from "framer-motion"

interface ResponsiveImage {
    src: string
    alt?: string
    srcSet?: string
}

interface TiltHaloProps {
    images: ResponsiveImage[]
    backgroundColor: string
    layout: {
        imageWidth: number
        imageHeight: number
        circleRadius: number
    }
    rotation: {
        autoRotate: boolean
        rotationSpeed: number
    }
    tilt: {
        enableTilt: boolean
        tiltIntensity: number
        tiltStiffness: number
        tiltDamping: number
    }
    focusMode: {
        enableFocusMode: boolean
        focusOverlayColor: string
        focusImageScale: number
        focusImageBorderRadius: number
        focusBlurAmount: number
    }
    flipAnimation: {
        flipDuration: number
        flipScale: number
        flipRotation: number
    }
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TiltHalo(props: TiltHaloProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Artwork 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Artwork 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Artwork 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Artwork 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Artwork 5",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Artwork 6",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Artwork 7",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Artwork 8",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Artwork 9",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Artwork 10",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Artwork 11",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Artwork 12",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Artwork 13",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Artwork 14",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Artwork 15",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Artwork 16",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Artwork 17",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Artwork 18",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Artwork 19",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Artwork 20",
            },
        ],
        backgroundColor = "#F5F5F5",
        layout = {
            imageWidth: 60,
            imageHeight: 60,
            circleRadius: 280,
        },
        rotation = {
            autoRotate: true,
            rotationSpeed: 30,
        },
        tilt = {
            enableTilt: true,
            tiltIntensity: 15,
            tiltStiffness: 150,
            tiltDamping: 20,
        },
        focusMode = {
            enableFocusMode: true,
            focusOverlayColor: "#000000",
            focusImageScale: 80,
            focusImageBorderRadius: 8,
            focusBlurAmount: 10,
        },
        flipAnimation = {
            flipDuration: 0.6,
            flipScale: 1.1,
            flipRotation: 180,
        },
    } = props

    const { imageWidth, imageHeight, circleRadius } = layout
    const { autoRotate, rotationSpeed } = rotation
    const { enableTilt, tiltIntensity, tiltStiffness, tiltDamping } = tilt
    const {
        enableFocusMode,
        focusOverlayColor,
        focusImageScale,
        focusImageBorderRadius,
        focusBlurAmount,
    } = focusMode
    const { flipDuration, flipScale, flipRotation } = flipAnimation

    const [currentRotation, setCurrentRotation] = useState(0)
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Constants
    const ROTATION_INCREMENT = 0.2
    const SPRING_MASS = 0.8
    const IMAGE_BORDER_RADIUS = 4
    const OUTWARD_ROTATION_OFFSET = 90

    // Use motion values for smooth spring animations
    const tiltX = useMotionValue(0)
    const tiltY = useMotionValue(0)

    // Create spring animations for tilt values
    const springTiltX = useSpring(tiltX, {
        stiffness: tiltStiffness,
        damping: tiltDamping,
        mass: SPRING_MASS,
    })
    const springTiltY = useSpring(tiltY, {
        stiffness: tiltStiffness,
        damping: tiltDamping,
        mass: SPRING_MASS,
    })

    useEffect(() => {
        if (!autoRotate) return

        const interval = setInterval(() => {
            startTransition(() => {
                setCurrentRotation((prev) => prev + ROTATION_INCREMENT)
            })
        }, rotationSpeed)

        return () => clearInterval(interval)
    }, [autoRotate, rotationSpeed])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !enableTilt || focusedIndex !== null)
            return

        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const mouseX = e.clientX - centerX
        const mouseY = e.clientY - centerY

        // Check if mouse is within the circle radius
        const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY)
        const maxDistance =
            Math.min(rect.width, rect.height) / 2 -
            Math.max(imageWidth, imageHeight) / 2
        if (distance > maxDistance) return

        const newTiltX = (mouseY / (rect.height / 2)) * tiltIntensity
        const newTiltY = -(mouseX / (rect.width / 2)) * tiltIntensity

        tiltX.set(newTiltX)
        tiltY.set(newTiltY)
    }

    const handleMouseLeave = () => {
        if (!enableTilt) return

        tiltX.set(0)
        tiltY.set(0)
    }

    const handleCircleMouseLeave = () => {
        if (!enableTilt) return

        tiltX.set(0)
        tiltY.set(0)
    }

    const handleImageClick = (index: number) => {
        if (!enableFocusMode) return

        startTransition(() => {
            setFocusedIndex(focusedIndex === index ? null : index)
        })
    }

    const exitFocusMode = () => {
        startTransition(() => {
            setFocusedIndex(null)
        })
    }

    const handleBackgroundClick = () => {
        if (focusedIndex !== null) {
            exitFocusMode()
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                perspective: "1000px",
                minWidth: "400px",
                minHeight: "400px",
                ...props.style,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleBackgroundClick}
            role="region"
            aria-label="TiltHalo circular image gallery"
        >
            {/* Focused image overlay */}
            <AnimatePresence>
                {focusedIndex !== null && enableFocusMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: focusOverlayColor,
                            backdropFilter: `blur(${focusBlurAmount}px)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            cursor: "pointer",
                        }}
                    >
                        <motion.img
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            src={images[focusedIndex]?.src}
                            alt={images[focusedIndex]?.alt}
                            style={{
                                maxWidth: `${focusImageScale}%`,
                                maxHeight: `${focusImageScale}%`,
                                objectFit: "contain",
                                borderRadius: `${focusImageBorderRadius}px`,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Circular arrangement of images */}
            <motion.div
                style={{
                    position: "absolute",
                    width: `${circleRadius * 2}px`,
                    height: `${circleRadius * 2}px`,
                    transformOrigin: "center",
                    filter:
                        focusedIndex !== null
                            ? `blur(${focusBlurAmount}px)`
                            : "none",
                    rotateX:
                        enableTilt && focusedIndex === null ? springTiltX : 0,
                    rotateY:
                        enableTilt && focusedIndex === null ? springTiltY : 0,
                }}
                animate={{
                    rotate: currentRotation,
                    rotateX:
                        enableTilt && focusedIndex === null ? undefined : 0,
                    rotateY:
                        enableTilt && focusedIndex === null ? undefined : 0,
                }}
                transition={{
                    rotate: { type: "tween", ease: "linear", duration: 0 },
                    rotateX: {
                        type: "spring",
                        stiffness: tiltStiffness,
                        damping: tiltDamping,
                    },
                    rotateY: {
                        type: "spring",
                        stiffness: tiltStiffness,
                        damping: tiltDamping,
                    },
                }}
            >
                {images.map((image, index) => {
                    const angle = (index / images.length) * 360
                    const radian = (angle * Math.PI) / 180
                    const x = Math.cos(radian) * circleRadius
                    const y = Math.sin(radian) * circleRadius

                    return (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                left: `calc(50% + ${x}px - ${imageWidth / 2}px)`,
                                top: `calc(50% + ${y}px - ${imageHeight / 2}px)`,
                                width: `${imageWidth}px`,
                                height: `${imageHeight}px`,
                                transform: `rotate(${angle + OUTWARD_ROTATION_OFFSET}deg)`,
                                transformOrigin: "center",
                                cursor: enableFocusMode ? "pointer" : "default",
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleImageClick(index)
                            }}
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: `${IMAGE_BORDER_RADIUS}px`,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    transition: `transform ${flipDuration}s ease`,
                                }}
                                onMouseEnter={(e) => {
                                    if (enableFocusMode) {
                                        e.currentTarget.style.transform = `rotateY(${flipRotation}deg) scale(${flipScale})`
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (enableFocusMode) {
                                        e.currentTarget.style.transform =
                                            "rotateY(0deg) scale(1)"
                                    }
                                }}
                            />
                        </div>
                    )
                })}
            </motion.div>
        </div>
    )
}

addPropertyControls(TiltHalo, {
    images: {
        type: ControlType.Array,
        title: "Images",
        description: "Collection of images to display in the circular gallery",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 50,
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Artwork 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Artwork 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Artwork 3",
            },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        description: "Background color of the carousel container",
        defaultValue: "#F5F5F5",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Configure image dimensions and circle size",
        controls: {
            imageWidth: {
                type: ControlType.Number,
                title: "Image Width",
                description: "Width of each image in pixels",
                defaultValue: 60,
                min: 30,
                max: 120,
                step: 5,
                unit: "px",
            },
            imageHeight: {
                type: ControlType.Number,
                title: "Image Height",
                description: "Height of each image in pixels",
                defaultValue: 60,
                min: 30,
                max: 120,
                step: 5,
                unit: "px",
            },
            circleRadius: {
                type: ControlType.Number,
                title: "Circle Radius",
                description: "Radius of the circular arrangement in pixels",
                defaultValue: 50,
                min: 50,
                max: 500,
                step: 10,
                unit: "px",
            },
        },
    },
    rotation: {
        type: ControlType.Object,
        title: "Rotation",
        description: "Configure automatic rotation behavior",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                description: "Enable automatic rotation of the carousel",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            rotationSpeed: {
                type: ControlType.Number,
                title: "Rotation Speed",
                description: "Speed of automatic rotation in milliseconds",
                defaultValue: 30,
                min: 10,
                max: 100,
                step: 5,
                unit: "ms",
            },
        },
    },
    tilt: {
        type: ControlType.Object,
        title: "Tilt",
        description: "Configure 3D tilt interaction on hover",
        controls: {
            enableTilt: {
                type: ControlType.Boolean,
                title: "Tilt Interaction",
                description: "Enable 3D tilt effect on mouse hover",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            tiltIntensity: {
                type: ControlType.Number,
                title: "Tilt Intensity",
                description: "Maximum tilt angle in degrees",
                defaultValue: 15,
                min: 5,
                max: 30,
                step: 1,
                unit: "°",
            },
            tiltStiffness: {
                type: ControlType.Number,
                title: "Tilt Stiffness",
                description:
                    "Spring stiffness for tilt animation (higher = snappier)",
                defaultValue: 150,
                min: 50,
                max: 300,
                step: 10,
            },
            tiltDamping: {
                type: ControlType.Number,
                title: "Tilt Damping",
                description:
                    "Spring damping for tilt animation (higher = less bouncy)",
                defaultValue: 20,
                min: 10,
                max: 50,
                step: 1,
            },
        },
    },
    focusMode: {
        type: ControlType.Object,
        title: "Focus Mode",
        description: "Configure focus overlay and image display",
        controls: {
            enableFocusMode: {
                type: ControlType.Boolean,
                title: "Focus Mode",
                description:
                    "Allow clicking images to view them in focus overlay",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            focusOverlayColor: {
                type: ControlType.Color,
                title: "Overlay Color",
                description: "Background color of the focus mode overlay",
                defaultValue: "#000000",
            },
            focusImageScale: {
                type: ControlType.Number,
                title: "Image Scale",
                description:
                    "Size of the focused image as percentage of container",
                defaultValue: 80,
                min: 50,
                max: 95,
                step: 5,
                unit: "%",
            },
            focusImageBorderRadius: {
                type: ControlType.Number,
                title: "Image Border Radius",
                description: "Corner radius of the focused image",
                defaultValue: 8,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
            },
            focusBlurAmount: {
                type: ControlType.Number,
                title: "Blur Amount",
                description:
                    "Blur intensity applied to background when in focus mode",
                defaultValue: 10,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
            },
        },
    },
    flipAnimation: {
        type: ControlType.Object,
        title: "Flip Animation",
        description:
            "More components at [8ighty8 Studio](https://8ighty8studio.lemonsqueezy.com)",
        controls: {
            flipDuration: {
                type: ControlType.Number,
                title: "Flip Duration",
                description: "Duration of the flip animation in seconds",
                defaultValue: 0.6,
                min: 0.1,
                max: 2,
                step: 0.1,
                unit: "s",
            },
            flipScale: {
                type: ControlType.Number,
                title: "Flip Scale",
                description: "Scale factor during flip animation",
                defaultValue: 1.1,
                min: 1,
                max: 2,
                step: 0.1,
            },
            flipRotation: {
                type: ControlType.Number,
                title: "Flip Rotation",
                description: "Rotation angle for flip animation in degrees",
                defaultValue: 180,
                min: 90,
                max: 360,
                step: 10,
                unit: "°",
            },
        },
    },
})
