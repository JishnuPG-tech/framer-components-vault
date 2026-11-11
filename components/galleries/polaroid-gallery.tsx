// Floating Polaroid Gallery Component - Interactive polaroid gallery that reveals additional images on hover/click with smooth animations and multiple layout patterns

import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface PolaroidImage {
    src: string | { src: string; srcSet?: string; alt?: string } | any
    alt: string
    text: string
    textColor?: string
    backgroundColor?: string
    rotationType?: "2d" | "3d"
    rotation?: number
    rotationX?: number
    rotationY?: number
    rotationZ?: number
    size?: "small" | "medium" | "large"
    priority?: number
}

interface FloatingPolaroidGalleryProps {
    images: PolaroidImage[]
    layoutPattern: "circular" | "radial" | "fan" | "grid"
    triggerType: "hover" | "click"
    animationDuration: number
    animationEasing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce"
    maxImages: number
    spacing: number
    textFont: any
    defaultTextColor: string
    polaroidBackground: string
    polaroidBorder: string
    shadowColor: string
    entranceAnimation: "scale" | "slide" | "fade" | "bounce"
    hoverEffect: "float" | "rotate" | "scale" | "none"
    continuousAnimation: "rotate" | "float" | "swing" | "none"
    staggerDelay: number
    mobileLayout: "stack" | "grid" | "carousel"
    enablePagination: boolean
    fallbackImage: string | { src: string; srcSet?: string; alt?: string } | any
    style?: CSSProperties
}

/**
 * Floating Polaroid Gallery
 *
 * Interactive polaroid gallery that reveals additional images with smooth animations
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 240
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function FloatingPolaroidGallery(
    props: FloatingPolaroidGalleryProps
) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Main polaroid",
                text: "Polaroid",
                priority: 1,
            },
        ],
        layoutPattern = "circular",
        triggerType = "hover",
        animationDuration = 0.6,
        animationEasing = "easeOut",
        maxImages = 8,
        spacing = 150,
        textFont,
        defaultTextColor = "#000000",
        polaroidBackground = "#FFFFFF",
        polaroidBorder = "#FFFFFF",
        shadowColor = "rgba(0, 0, 0, 0.15)",
        entranceAnimation = "scale",
        hoverEffect = "float",
        continuousAnimation = "none",
        staggerDelay = 0.1,
        mobileLayout = "grid",
        enablePagination = true,
        fallbackImage = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    } = props

    const [isRevealed, setIsRevealed] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Helper function to extract image URL from Framer ResponsiveImage
    const getImageUrl = useCallback(
        (image: any): string => {
            if (typeof image === "string") {
                return image
            }
            if (image && typeof image === "object") {
                if (image.src && typeof image.src === "string") {
                    return image.src
                }
                if (
                    image.src &&
                    image.src.src &&
                    typeof image.src.src === "string"
                ) {
                    return image.src.src
                }
            }
            return typeof fallbackImage === "string"
                ? fallbackImage
                : fallbackImage?.src ||
                      "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
        },
        [fallbackImage]
    )

    // Device detection
    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                startTransition(() => {
                    setIsMobile(window.innerWidth < 768)
                })
            }
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    }, [])

    // Smart image limiting based on device
    const deviceMaxImages = useMemo(() => {
        if (isMobile) return Math.min(maxImages, 6)
        return Math.min(maxImages, 12)
    }, [isMobile, maxImages])

    // Sort and limit images
    const processedImages = useMemo(() => {
        const sorted = [...images]
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
            .slice(0, deviceMaxImages)
        return sorted
    }, [images, deviceMaxImages])

    // Pagination logic
    const imagesPerPage = isMobile ? 4 : 6
    const totalPages = Math.ceil(processedImages.length / imagesPerPage)
    const currentImages = enablePagination
        ? processedImages.slice(
              currentPage * imagesPerPage,
              (currentPage + 1) * imagesPerPage
          )
        : processedImages

    // Main image (first in array)
    const mainImage = processedImages[0]
    const additionalImages = currentImages.slice(1)

    // Layout positioning function
    const getPositionForLayout = useCallback(
        (index: number, total: number) => {
            if (total === 0) return { x: 0, y: 0, rotation: 0 }

            switch (layoutPattern) {
                case "circular":
                    // Arrange polaroids in a circle around the center
                    const angle = (index / total) * 2 * Math.PI - Math.PI / 2 // Start from top
                    // Calculate radius to prevent overlap - accounting for polaroid width (~200px with rotation)
                    const minRadius = 180 // Minimum distance from center to avoid overlap with main polaroid
                    const radius = Math.max(minRadius, spacing * 1.8) // Use larger radius to ensure no overlap
                    return {
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius,
                        rotation: ((index % 2) * 2 - 1) * (8 + (index % 3) * 4), // Alternating tilts
                    }

                case "radial":
                    const radialAngle = (index / total) * 2 * Math.PI
                    return {
                        x: Math.cos(radialAngle) * spacing,
                        y: Math.sin(radialAngle) * spacing,
                        rotation: (radialAngle * 180) / Math.PI,
                    }

                case "fan":
                    if (total === 1) return { x: 0, y: spacing, rotation: 0 }
                    const fanAngle =
                        (index / (total - 1)) * Math.PI - Math.PI / 2
                    return {
                        x: Math.sin(fanAngle) * spacing,
                        y: Math.cos(fanAngle) * spacing,
                        rotation: (fanAngle * 180) / Math.PI,
                    }

                case "grid":
                    const cols = Math.ceil(Math.sqrt(total))
                    const row = Math.floor(index / cols)
                    const col = index % cols
                    const gridSpacing = spacing * 0.8
                    const gridX = (col - (cols - 1) / 2) * gridSpacing
                    const gridY =
                        (row - Math.floor((total - 1) / cols) / 2) * gridSpacing
                    return { x: gridX, y: gridY, rotation: 0 }

                default:
                    return { x: 0, y: 0, rotation: 0 }
            }
        },
        [layoutPattern, spacing]
    )

    // Event handlers
    const handleInteraction = useCallback(
        (type: "enter" | "leave" | "click") => {
            if (isStatic) return

            if (
                triggerType === "hover" &&
                (type === "enter" || type === "leave")
            ) {
                setIsRevealed(type === "enter")
            } else if (triggerType === "click" && type === "click") {
                setIsRevealed(!isRevealed)
            }
        },
        [triggerType, isRevealed, isStatic]
    )

    // Animation variants
    const easingMap = {
        linear: "linear",
        easeIn: "easeIn",
        easeOut: "easeOut",
        easeInOut: "easeInOut",
        bounce: "circOut",
    }

    // Polaroid component
    const PolaroidCard = ({
        image,
        index,
        isMain = false,
    }: {
        image: PolaroidImage
        index: number
        isMain?: boolean
    }) => {
        const sizeMultiplier =
            image.size === "small" ? 0.8 : image.size === "large" ? 1.2 : 1
        const imageSrc = getImageUrl(image.src)
        const position = isMain
            ? { x: 0, y: 0, rotation: 0 }
            : getPositionForLayout(index, additionalImages.length)

        // Calculate rotation based on type for any image
        const getRotationTransform = () => {
            if (image.rotationType === "3d") {
                const rotX = image.rotationX || 0
                const rotY = image.rotationY || 0
                const rotZ = image.rotationZ || 0
                if (isMain) {
                    return `translate(-50%, -50%) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
                } else {
                    return `translate(-50%, -50%) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
                }
            } else {
                const rotation = isMain 
                    ? (image.rotation || 0)
                    : (image.rotation !== undefined ? image.rotation : position.rotation)
                return `translate(-50%, -50%) rotate(${rotation}deg)`
            }
        }

        // For motion animations, use layout rotation for non-main images only if no individual rotation is set
        const getAnimationRotation = () => {
            if (image.rotationType === "3d") {
                return image.rotationZ || 0
            }
            return isMain 
                ? (image.rotation || 0)
                : (image.rotation !== undefined ? image.rotation : position.rotation)
        }

        const finalRotation = getAnimationRotation()

        // Animation properties
        const animationProps = isMain
            ? {}
            : {
                  initial: {
                      opacity: 0,
                      scale: entranceAnimation === "scale" ? 0 : 1,
                      x: entranceAnimation === "slide" ? -100 : position.x,
                      y:
                          entranceAnimation === "bounce"
                              ? position.y - 50
                              : position.y,
                      rotate: finalRotation,
                  },
                  animate: {
                      opacity: 1,
                      scale: 1,
                      x: position.x,
                      y: position.y,
                      rotate: finalRotation,
                      transition: {
                          duration: animationDuration,
                          ease: easingMap[animationEasing],
                          delay: index * staggerDelay,
                          type:
                              entranceAnimation === "bounce"
                                  ? "spring"
                                  : "tween",
                          bounce: entranceAnimation === "bounce" ? 0.4 : 0,
                      },
                  },
                  exit: {
                      opacity: 0,
                      scale: 0,
                      transition: { duration: 0.2 },
                  },
              }

        const hoverProps =
            hoverEffect !== "none"
                ? {
                      whileHover: {
                          y: hoverEffect === "float" ? -10 : 0,
                          rotate:
                              hoverEffect === "rotate"
                                  ? finalRotation + 5
                                  : finalRotation,
                          scale: hoverEffect === "scale" ? 1.05 : 1,
                          transition: { duration: 0.3 },
                      },
                  }
                : {}

        return (
            <motion.div
                {...animationProps}
                {...hoverProps}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transformOrigin: "center center",
                    cursor: isMain && triggerType === "click" ? "pointer" : "default",
                    zIndex: isMain ? 10 : 5 + index,
                }}
                onClick={isMain ? () => handleInteraction("click") : undefined}
                onMouseEnter={
                    isMain ? () => handleInteraction("enter") : undefined
                }
                onMouseLeave={
                    isMain ? () => handleInteraction("leave") : undefined
                }
            >
                <div
                    style={{
                        position: "relative",
                        width: 160 * sizeMultiplier,
                        height: 240 * sizeMultiplier,
                        backgroundColor:
                            image.backgroundColor || polaroidBackground,
                        border: `8px solid ${polaroidBorder}`,
                        borderBottomWidth: 40 * sizeMultiplier,
                        borderRadius: 4,
                        boxShadow: `0 8px 32px ${shadowColor}`,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        transform: getRotationTransform(),
                        transformOrigin: "center center",
                    }}
                >
                    {/* Image container */}
                    <div
                        style={{
                            width: "100%",
                            height: `${184 * sizeMultiplier}px`,
                            backgroundImage: `url(${imageSrc})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundColor: "#f0f0f0",
                        }}
                    />

                    {/* Text below image */}
                    <div
                        style={{
                            width: "100%",
                            height: `${40 * sizeMultiplier}px`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: image.textColor || defaultTextColor,
                            fontSize:
                                (textFont?.fontSize
                                    ? parseInt(textFont.fontSize)
                                    : 12) * sizeMultiplier,
                            fontWeight: textFont?.fontWeight || 500,
                            fontFamily: textFont?.fontFamily || "sans-serif",
                            textAlign: "center",
                            padding: `0 ${8 * sizeMultiplier}px`,
                        }}
                    >
                        {image.text}
                    </div>
                </div>
            </motion.div>
        )
    }

    // Pagination controls
    const PaginationControls = () => {
        if (!enablePagination || totalPages <= 1) return null

        return (
            <div
                style={{
                    position: "absolute",
                    bottom: -40,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 8,
                    zIndex: 20,
                }}
            >
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor:
                                i === currentPage
                                    ? defaultTextColor
                                    : "#CCCCCC",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                        }}
                        aria-label={`Page ${i + 1}`}
                    />
                ))}
            </div>
        )
    }

    if (!mainImage) return null

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minWidth: 200,
                minHeight: 280,
                overflow: "visible",
                ...props.style,
            }}
        >
            {/* Main Polaroid */}
            <PolaroidCard image={mainImage} index={0} isMain={true} />

            {/* Additional Polaroids - Only show when revealed and not in static mode */}
            <AnimatePresence>
                {!isStatic &&
                    isRevealed &&
                    additionalImages.map((image, index) => (
                        <PolaroidCard
                            key={`polaroid-${index}`}
                            image={image}
                            index={index}
                            isMain={false}
                        />
                    ))}
            </AnimatePresence>

            {/* Static mode preview - show all polaroids */}
            {isStatic &&
                additionalImages.map((image, index) => (
                    <PolaroidCard
                        key={`static-${index}`}
                        image={image}
                        index={index}
                        isMain={false}
                    />
                ))}

            {/* Pagination Controls */}
            <PaginationControls />
        </div>
    )
}

addPropertyControls(FloatingPolaroidGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Polaroid",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    optional: true,
                },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Background",
                    optional: true,
                },
                rotationType: {
                    type: ControlType.Enum,
                    title: "Rotate",
                    options: ["2d", "3d"],
                    optionTitles: ["2D", "3D"],
                    defaultValue: "2d",
                    displaySegmentedControl: true,
                },
                rotation: {
                    type: ControlType.Number,
                    title: " ",
                    defaultValue: 0,
                    min: -180,
                    max: 180,
                    unit: "deg",
                    hidden: ({ rotationType }) => rotationType === "3d",
                },
                rotationX: {
                    type: ControlType.Number,
                    title: "X",
                    defaultValue: 0,
                    min: -180,
                    max: 180,
                    unit: "deg",
                    hidden: ({ rotationType }) => rotationType !== "3d",
                },
                rotationY: {
                    type: ControlType.Number,
                    title: "Y",
                    defaultValue: 0,
                    min: -180,
                    max: 180,
                    unit: "deg",
                    hidden: ({ rotationType }) => rotationType !== "3d",
                },
                rotationZ: {
                    type: ControlType.Number,
                    title: "Z",
                    defaultValue: 0,
                    min: -180,
                    max: 180,
                    unit: "deg",
                    hidden: ({ rotationType }) => rotationType !== "3d",
                },
                size: {
                    type: ControlType.Enum,
                    title: "Size",
                    options: ["small", "medium", "large"],
                    defaultValue: "medium",
                },
                priority: {
                    type: ControlType.Number,
                    title: "Priority",
                    defaultValue: 1,
                    min: 1,
                    max: 10,
                },
            },
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                text: "Polaroid",
                priority: 1,
                rotationType: "2d",
                rotation: 0,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
            },
        ],
        maxCount: 12,
    },
    layoutPattern: {
        type: ControlType.Enum,
        title: "Layout Pattern",
        options: ["circular", "fan"],
        optionTitles: ["Circular", "Fan"],
        defaultValue: "circular",
        displaySegmentedControl: true,
    },
    triggerType: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    animationEasing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "bounce"],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Bounce",
        ],
        defaultValue: "easeOut",
    },
    maxImages: {
        type: ControlType.Number,
        title: "Max Images",
        defaultValue: 8,
        min: 2,
        max: 12,
        step: 1,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 150,
        min: 100,
        max: 400,
        step: 10,
        unit: "px",
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    defaultTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    polaroidBackground: {
        type: ControlType.Color,
        title: "Polaroid Background",
        defaultValue: "#FFFFFF",
    },
    polaroidBorder: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0, 0, 0, 0.15)",
    },
    entranceAnimation: {
        type: ControlType.Enum,
        title: "Entrance Animation",
        options: ["scale", "slide", "fade", "bounce"],
        optionTitles: ["Scale", "Slide", "Fade", "Bounce"],
        defaultValue: "scale",
    },
    hoverEffect: {
        type: ControlType.Enum,
        title: "Hover Effect",
        options: ["float", "rotate", "scale", "none"],
        optionTitles: ["Float", "Rotate", "Scale", "None"],
        defaultValue: "float",
    },
    continuousAnimation: {
        type: ControlType.Enum,
        title: "Continuous Animation",
        options: ["rotate", "float", "swing", "none"],
        optionTitles: ["Rotate", "Float", "Swing", "None"],
        defaultValue: "none",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.05,
        unit: "s",
    },
    enablePagination: {
        type: ControlType.Boolean,
        title: "Pagination",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fallbackImage: {
        type: ControlType.ResponsiveImage,
        title: "Fallback Image",
    },
})