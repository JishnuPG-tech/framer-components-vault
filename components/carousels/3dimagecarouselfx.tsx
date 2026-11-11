// 3D image carousel with rotating perspective, configurable images, spacing, and rotation speed
import {
    useEffect,
    useRef,
    useState,
    startTransition,
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

import {
    motion,
    useMotionValue,
    useSpring,
    animate,
    useTransform,
} from "framer-motion"

interface CarouselImage {
    image: {
        src: string
        alt: string
    }
}

interface ImageCarousel3DProps {
    images: CarouselImage[]
    spacing: number
    rotationSpeed: number
    autoRotate: boolean
    imageWidth: number
    imageHeight: number
    perspective: number
    showReflection: boolean
    borderRadius: number
    style?: CSSProperties
}

/**
 * 3D Image Carousel
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageCarousel3D(props: ImageCarousel3DProps) {
    const {
        images,
        spacing = 300,
        rotationSpeed = 20,
        autoRotate = false,
        imageWidth = 200,
        imageHeight = 280,
        perspective = 1000,
        showReflection = true,
        borderRadius = 12,
    } = props

    const defaultImages = [
        {
            image: {
                src: "https://images.unsplash.com/photo-1755956187917-65cbe263b4e6?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 1",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1751324136341-d7c64d2e1571?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 2",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1623463199109-186089df3102?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 3",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1743195954972-687f202d830f?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 4",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1696215105730-fa23954dd164?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 5",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1755956187917-65cbe263b4e6?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 6",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1751324136341-d7c64d2e1571?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 7",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1623463199109-186089df3102?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 8",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1743195954972-687f202d830f?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 9",
            },
        },
        {
            image: {
                src: "https://images.unsplash.com/photo-1696215105730-fa23954dd164?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Image 10",
            },
        },
    ]

    const displayImages = images && images.length > 0 ? images : defaultImages

    const rotation = useMotionValue(0)
    const smoothRotation = useSpring(rotation, {
        stiffness: 100,
        damping: 25,
        mass: 0.5,
    })
    const isStatic = RenderTarget.current() === RenderTarget.thumbnail

    const imageCount = displayImages.length
    const angleStep = 360 / imageCount

    const handleImageClick = (index: number) => {
        if (isStatic) return

        const currentRotation = rotation.get() % 360
        const targetAngle = -angleStep * index
        let rotationDiff = targetAngle - currentRotation

        // Find shortest rotation path
        if (rotationDiff > 180) rotationDiff -= 360
        if (rotationDiff < -180) rotationDiff += 360

        animate(rotation, rotation.get() + rotationDiff, {
            type: "spring",
            stiffness: 80,
            damping: 30,
        })
    }

    const handlePrevious = () => {
        if (isStatic) return
        animate(rotation, rotation.get() - angleStep, {
            type: "spring",
            stiffness: 80,
            damping: 30,
        })
    }

    const handleNext = () => {
        if (isStatic) return
        animate(rotation, rotation.get() + angleStep, {
            type: "spring",
            stiffness: 80,
            damping: 30,
        })
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                position: "relative",
                userSelect: "none",
                background:
                    "linear-gradient(to bottom, #f5f5f5 0%, #e0e0e0 100%)",
            }}
        >
            {/* Left Button */}
            <button
                onClick={handlePrevious}
                style={{
                    position: "absolute",
                    left: 20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255, 255, 255, 0.9)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                    transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 1)"
                    e.currentTarget.style.transform =
                        "translateY(-50%) scale(1.1)"
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.9)"
                    e.currentTarget.style.transform =
                        "translateY(-50%) scale(1)"
                }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>

            {/* Right Button */}
            <button
                onClick={handleNext}
                style={{
                    position: "absolute",
                    right: 20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255, 255, 255, 0.9)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                    transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 1)"
                    e.currentTarget.style.transform =
                        "translateY(-50%) scale(1.1)"
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.9)"
                    e.currentTarget.style.transform =
                        "translateY(-50%) scale(1)"
                }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>

            <motion.div
                style={{
                    position: "relative",
                    width: imageWidth,
                    height: imageHeight,
                    transformStyle: "preserve-3d",
                    perspective: perspective,
                }}
            >
                <motion.div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        rotateY: smoothRotation,
                    }}
                >
                    {displayImages.map((item, index) => {
                        const angle = angleStep * index
                        const radians = (angle * Math.PI) / 180
                        const translateZ = spacing

                        return (
                            <div
                                key={index}
                                style={{
                                    position: "absolute",
                                    width: imageWidth,
                                    height: imageHeight,
                                    left: 0,
                                    top: 0,
                                    transform: `rotateY(${angle}deg) translateZ(${translateZ}px)`,
                                    transformStyle: "preserve-3d",
                                    backfaceVisibility: "hidden",
                                }}
                                onClick={() => handleImageClick(index)}
                            >
                                <motion.img
                                    src={item.image.src}
                                    alt={item.image.alt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: borderRadius,
                                        boxShadow:
                                            "0 20px 60px rgba(0, 0, 0, 0.4)",
                                        pointerEvents: "none",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                    }}
                                    draggable={false}
                                />
                                {showReflection && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            width: "100%",
                                            height: "100%",
                                            top: "100%",
                                            left: 0,
                                            transform: "scaleY(-1)",
                                            transformOrigin: "top",
                                            opacity: 0.3,
                                            maskImage:
                                                "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 60%)",
                                            WebkitMaskImage:
                                                "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 60%)",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <img
                                            src={item.image.src}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                borderRadius: borderRadius,
                                            }}
                                            draggable={false}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </motion.div>
            </motion.div>
        </div>
    )
}

addPropertyControls(ImageCarousel3D, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://images.unsplash.com/photo-1755956187917-65cbe263b4e6?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    alt: "Image 1",
                },
            },
            {
                image: {
                    src: "https://images.unsplash.com/photo-1751324136341-d7c64d2e1571?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    alt: "Image 2",
                },
            },
            {
                image: {
                    src: "https://images.unsplash.com/photo-1623463199109-186089df3102?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    alt: "Image 3",
                },
            },
            {
                image: {
                    src: "https://images.unsplash.com/photo-1743195954972-687f202d830f?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    alt: "Image 4",
                },
            },
            {
                image: {
                    src: "https://images.unsplash.com/photo-1696215105730-fa23954dd164?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    alt: "Image 5",
                },
            },
        ],
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 300,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 200,
        min: 100,
        max: 400,
        step: 10,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 280,
        min: 100,
        max: 500,
        step: 10,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 500,
        max: 2000,
        step: 50,
        unit: "px",
    },
    showReflection: {
        type: ControlType.Boolean,
        title: "Reflection",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
