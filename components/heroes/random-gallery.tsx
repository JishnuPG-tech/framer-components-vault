// Image gallery grid with configurable columns, gap, and ability to skip cells for non-linear layouts
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"
import { useState, useEffect, useMemo, useCallback, startTransition } from "react"
import { motion } from "framer-motion"

interface ImageItem {
    image: {
        src: string
        alt: string
    }
    skip: boolean
}

interface ImageGalleryGridProps {
    images: ImageItem[]
    columns: number
    gap: number
    backgroundColor: string
    borderRadius: number
    imageHeight: "square" | "auto" | "fixed"
    customHeight: string
    transition: any
    hoverEffects: {
        scale: number
        opacity: number
        rotation: number
    }
    style?: CSSProperties
}

/**
 * Image Gallery Grid
 * 
 * A flexible grid gallery with support for skipping cells to create non-linear layouts
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageGalleryGrid(props: ImageGalleryGridProps) {
    const {
        images,
        columns,
        gap,
        backgroundColor,
        borderRadius,
        imageHeight,
        customHeight,
        transition,
        hoverEffects,
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    // Provide default images if none are provided
    const defaultImages: ImageItem[] = [
        {
            image: {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1",
            },
            skip: false,
        },
        {
            image: {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2",
            },
            skip: false,
        },
        {
            image: {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3",
            },
            skip: false,
        },
        {
            image: {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4",
            },
            skip: false,
        },
        {
            image: {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5",
            },
            skip: false,
        },
        {
            image: {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 6",
            },
            skip: false,
        },
    ]

    const displayImages = useMemo(
        () => (!images || images.length === 0 || !images[0]?.image?.src ? defaultImages : images),
        [images]
    )

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    // Detect if device is mobile/touch-enabled
    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                startTransition(() => {
                    setIsMobile(window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window)
                })
            }
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    }, [])

    // Parse imageHeight to determine the mode and value
    const isSquare = imageHeight === "square"
    const isAuto = imageHeight === "auto"
    const isFixed = imageHeight === "fixed"

    // Create a map of actual visible item indices (excluding skipped items)
    const visibleItemIndices = useMemo(
        () =>
            displayImages.reduce((acc, item, index) => {
                if (!item.skip && item.image && item.image.src) {
                    acc.push(index)
                }
                return acc
            }, [] as number[]),
        [displayImages]
    )

    const openLightbox = useCallback(
        (index: number) => {
            if (isStaticRenderer) return
            startTransition(() => setLightboxIndex(index))
        },
        [isStaticRenderer]
    )

    const closeLightbox = useCallback(() => {
        startTransition(() => setLightboxIndex(null))
    }, [])

    const goToNext = useCallback(() => {
        if (lightboxIndex === null) return
        const currentVisibleIndex = visibleItemIndices.indexOf(lightboxIndex)
        const nextVisibleIndex = (currentVisibleIndex + 1) % visibleItemIndices.length
        startTransition(() => setLightboxIndex(visibleItemIndices[nextVisibleIndex]))
    }, [lightboxIndex, visibleItemIndices])

    const goToPrevious = useCallback(() => {
        if (lightboxIndex === null) return
        const currentVisibleIndex = visibleItemIndices.indexOf(lightboxIndex)
        const prevVisibleIndex = (currentVisibleIndex - 1 + visibleItemIndices.length) % visibleItemIndices.length
        startTransition(() => setLightboxIndex(visibleItemIndices[prevVisibleIndex]))
    }, [lightboxIndex, visibleItemIndices])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return
            if (e.key === "Escape") closeLightbox()
            if (e.key === "ArrowRight") goToNext()
            if (e.key === "ArrowLeft") goToPrevious()
        }

        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }
    }, [lightboxIndex, closeLightbox, goToNext, goToPrevious])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                overflow: "visible",
            }}
        >
            {displayImages.map((item, index) => {
                if (item.skip || !item.image || !item.image.src) {
                    return <div key={index} style={{ gridColumn: "span 1" }} />
                }

                const isHovered = hoveredIndex === index
                const isOtherHovered = hoveredIndex !== null && !isHovered
                
                // Find the position of this item in the visible items array
                const visiblePosition = visibleItemIndices.indexOf(index)
                const rotation = isHovered ? (visiblePosition % 2 === 0 ? hoverEffects.rotation : -hoverEffects.rotation) : 0
                const transformOrigin = "center"
                const imageContent = (
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            paddingBottom: isSquare ? "100%" : isAuto ? "0" : undefined,
                            height: isAuto ? "auto" : isFixed ? customHeight : undefined,
                            backgroundColor: isAuto ? "transparent" : backgroundColor,
                            borderRadius: isAuto ? "0" : `${borderRadius}px`,
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={item.image.src}
                            alt={item.image.alt || `Gallery image ${index + 1}`}
                            style={{
                                position: isAuto ? "relative" : "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: isAuto ? "auto" : "100%",
                                objectFit: isAuto ? "contain" : "cover",
                                display: "block",
                                borderRadius: isAuto ? `${borderRadius}px` : "0",
                            }}
                        />
                    </div>
                )

                if (isStaticRenderer) {
                    return (
                        <div key={index} style={{ width: "100%" }}>
                            {imageContent}
                        </div>
                    )
                }

                return (
                    <motion.div
                        key={index}
                        onMouseEnter={() => startTransition(() => setHoveredIndex(index))}
                        onMouseLeave={() => startTransition(() => setHoveredIndex(null))}
                        onClick={() => openLightbox(index)}
                        animate={{
                            rotate: rotation,
                            scale: isMobile ? 1 : isOtherHovered ? hoverEffects.scale : 1,
                            opacity: isMobile ? 1 : isOtherHovered ? hoverEffects.opacity : 1,
                        }}
                        transition={transition}
                        style={{
                            width: "100%",
                            transformOrigin,
                            cursor: "pointer",
                            willChange: "transform, opacity",
                        }}
                    >
                        {imageContent}
                    </motion.div>
                )
            })}

            {/* Lightbox */}
            {!isStaticRenderer && lightboxIndex !== null && displayImages[lightboxIndex] && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeLightbox}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        cursor: "zoom-out",
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "none",
                            color: "white",
                            fontSize: "24px",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 12,
                        }}
                        aria-label="Close lightbox"
                    >
                        ×
                    </button>

                    {/* Image */}
                    <motion.img
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        src={displayImages[lightboxIndex].image.src}
                        alt={displayImages[lightboxIndex].image.alt || `Gallery image ${lightboxIndex + 1}`}
                        style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                            objectFit: "contain",
                            cursor: "default",
                            zIndex: 11,
                        }}
                    />
                </motion.div>
            )}
        </div>
    )
}

addPropertyControls(ImageGalleryGrid, {
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
                skip: {
                    type: ControlType.Boolean,
                    title: "Skip Cell",
                    defaultValue: false,
                    enabledTitle: "Skip",
                    disabledTitle: "Show",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1",
                },
                skip: false,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2",
                },
                skip: false,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3",
                },
                skip: true,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4",
                },
                skip: false,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5",
                },
                skip: false,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 6",
                },
                skip: false,
            },
        ],
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Enum,
        title: "Image Height",
        defaultValue: "square",
        options: ["square", "auto", "fixed"],
        optionTitles: ["Square", "Auto", "Fixed"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
    },
    customHeight: {
        type: ControlType.String,
        title: "Custom Height",
        defaultValue: "200px",
        placeholder: "e.g., 200px, 50vh, 300px",
        hidden: ({ imageHeight }) => imageHeight !== "fixed",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "spring",
            stiffness: 300,
            damping: 20,
        },
    },
    hoverEffects: {
        type: ControlType.Object,
        title: "Hover Effects",
        controls: {
            rotation: {
                type: ControlType.Number,
                title: "Rotation",
                defaultValue: 3,
                min: 0,
                max: 15,
                step: 0.5,
                unit: "deg",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 0.9,
                min: 0,
                max: 1,
                step: 0.05,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.4,
                min: 0,
                max: 1,
                step: 0.1,
            },
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#EEEEEE",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})
