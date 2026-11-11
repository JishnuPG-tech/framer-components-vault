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
import { useEffect, useState, useMemo, useRef, startTransition } from "react"

interface ArcGalleryProps {
    images: { src: string; alt: string }[]
    radius: number
    rotationSpeed: number
    arcAngle: number
    imageSize: number
    reverseDirection: boolean
    style?: React.CSSProperties
}

/**
 * Circular Image Gallery
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 320
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ArcGallery(props: ArcGalleryProps) {
    const {
        radius = 150,
        rotationSpeed = 30,
        arcAngle = 360,
        imageSize = 60,
        reverseDirection = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    // No pause state needed as we want continuous movement
    const containerRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(true)

    // Default images if none provided
    const images = useMemo(() => {
        const defaultImages = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5",
            },
        ]
        
        // Check if props.images exists and has items
        if (props.images && Array.isArray(props.images) && props.images.length > 0) {
            return props.images
        }
        
        return defaultImages
    }, [props.images])

    // Calculate positions for each image
    const imagePositions = useMemo(() => {
        return images.map((_, index) => {
            const angleInRadians =
                ((arcAngle / images.length) * index * Math.PI) / 180
            const x = radius * Math.cos(angleInRadians)
            const y = radius * Math.sin(angleInRadians)
            return { x, y }
        })
    }, [images.length, radius, arcAngle])

    // Check if element is in viewport
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const observer = new IntersectionObserver(
            (entries) => {
                startTransition(() => {
                    setIsVisible(entries[0].isIntersecting)
                })
            },
            { threshold: 0.1 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current)
            }
        }
    }, [isStatic])

    // Animation variants
    const containerVariants = {
        animate: {
            rotate: reverseDirection ? -360 : 360,
            transition: {
                duration: rotationSpeed,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop" as const,
            },
        },
        paused: {
            rotate: 0,
            transition: {
                duration: 0.5,
            },
        },
    }

    // No hover effects needed

    // Static preview for canvas
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: Math.max(radius * 2, 5),
                    height: Math.max(radius * 2, 5),
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    ...style,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        width: radius * 2,
                        height: radius * 2,
                        borderRadius: "50%",
                        border: "1px dashed rgba(0,0,0,0.2)",
                    }}
                />
                {imagePositions.map((pos, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            width: imageSize,
                            height: imageSize,
                            borderRadius: "50%",
                            overflow: "hidden",
                            transform: `translate(${pos.x}px, ${pos.y}px)`,
                            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                        }}
                    >
                        <img
                            src={images[index % images.length].src}
                            alt={images[index % images.length].alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: Math.max(radius * 2, 5),
                height: Math.max(radius * 2, 5),
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "visible",
                ...style,
            }}
            // No mouse events needed for continuous movement
        >
            <motion.div
                style={{
                    position: "relative",
                    width: radius * 2,
                    height: radius * 2,
                }}
                variants={containerVariants}
                animate={!isVisible ? "paused" : "animate"}
            >
                {imagePositions.map((pos, index) => (
                    <motion.div
                        key={index}
                        style={{
                            position: "absolute",
                            width: imageSize,
                            height: imageSize,
                            borderRadius: "50%",
                            overflow: "hidden",
                            left: "50%",
                            top: "50%",
                            marginLeft: -imageSize / 2,
                            marginTop: -imageSize / 2,
                            transform: `translate(${pos.x}px, ${pos.y}px)`,
                            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                            // No cursor change needed
                        }}
                        // No hover effects
                    >
                        <img
                            src={images[index % images.length].src}
                            alt={images[index % images.length].alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    )
}

addPropertyControls(ArcGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1"
            }
        ],
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 150,
        min: 50,
        max: 500,
        step: 10,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed (s)",
        defaultValue: 30,
        min: 5,
        max: 120,
        step: 5,
    },
    arcAngle: {
        type: ControlType.Enum,
        title: "Arc Angle",
        options: [90, 180, 270, 360],
        defaultValue: 360,
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 60,
        min: 20,
        max: 150,
        step: 5,
    },
    reverseDirection: {
        type: ControlType.Boolean,
        title: "Direction",
        defaultValue: false,
        enabledTitle: "Reverse",
        disabledTitle: "Forward",
    },
    // Removed hover effect control
})