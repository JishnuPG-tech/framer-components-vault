// Bento Grid component with custom images, aspect ratio preservation, and responsive layout
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
import type { CSSProperties } from "react"
import { useState, useEffect } from "react"

interface GridItem {
    image: {
        src: string
        alt: string
    }
    span: number
}

interface BentoGridProps {
    items: GridItem[]
    gap: number
    columns: number
    backgroundColor: string
    borderRadius: number
    enableAnimation: boolean
    animationDuration: number
    animationStagger: number
    enableHover: boolean
    hoverZoom: number
    hoverZoomDuration: number
    shineColor: string
    shineOpacity: number
    shineDuration: number
    enableShadow: boolean
    shadowColor: string
    shadowBlur: number
    shadowX: number
    shadowY: number
    shadowSpread: number
    shadowIntensity: number
    enableBorder: boolean
    borderWidth: number
    borderColor: string
    borderStyle: string
    borderBlur: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ModernBentoGrid(props: BentoGridProps) {
    const { 
        items, 
        gap, 
        columns, 
        backgroundColor, 
        borderRadius, 
        enableAnimation, 
        animationDuration, 
        animationStagger,
        enableHover = true,
        hoverZoom = 1.1,
        hoverZoomDuration = 0.6,
        shineColor = "#FFFFFF",
        shineOpacity = 0.4,
        shineDuration = 0.6,
        enableShadow = false,
        shadowColor = "#000000",
        shadowBlur = 20,
        shadowX = 0,
        shadowY = 4,
        shadowSpread = 0,
        shadowIntensity = 0.15,
        enableBorder = false,
        borderWidth = 2,
        borderColor = "#000000",
        borderStyle = "solid",
        borderBlur = 0,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [imageAspectRatios, setImageAspectRatios] = useState<{ [key: number]: number }>({})
    const [focusedImageIndex, setFocusedImageIndex] = useState<number | null>(null)

    // Navigate to previous image
    const goToPrevious = () => {
        if (focusedImageIndex !== null) {
            const newIndex = focusedImageIndex === 0 ? items.length - 1 : focusedImageIndex - 1
            setFocusedImageIndex(newIndex)
        }
    }

    // Navigate to next image
    const goToNext = () => {
        if (focusedImageIndex !== null) {
            const newIndex = focusedImageIndex === items.length - 1 ? 0 : focusedImageIndex + 1
            setFocusedImageIndex(newIndex)
        }
    }

    // Keyboard navigation
    useEffect(() => {
        if (focusedImageIndex === null) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                goToPrevious()
            } else if (e.key === "ArrowRight") {
                goToNext()
            } else if (e.key === "Escape") {
                setFocusedImageIndex(null)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [focusedImageIndex, items.length])

    // Convert hex/rgb to rgba
    const getRgbaColor = (color: string, opacity: number) => {
        // Simple hex to rgba conversion
        if (color.startsWith("#")) {
            const hex = color.replace("#", "")
            const r = parseInt(hex.substring(0, 2), 16)
            const g = parseInt(hex.substring(2, 4), 16)
            const b = parseInt(hex.substring(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${opacity})`
        }
        // If it's already an rgb/rgba, extract values and apply new opacity
        if (color.startsWith("rgb")) {
            const match = color.match(/\d+/g)
            if (match && match.length >= 3) {
                return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${opacity})`
            }
        }
        return color
    }

    return (
        <>
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridAutoRows: "200px",
                gap: `${gap}px`,
                padding: `${gap}px`,
                backgroundColor,
                overflow: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
            }}
            className="bento-grid-container"
        >
            <style>{`
                .bento-grid-container::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            {items.map((item, index) => {
                const image = item.image || {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Default image",
                }
                const isHovered = hoveredIndex === index
                const aspectRatio = imageAspectRatios[index] || 1
                const columnSpan = Math.min(item.span, columns)
                const rowSpan = Math.max(1, Math.round(columnSpan / aspectRatio))

                return (
                    <motion.div
                        key={index}
                        initial={enableAnimation ? { opacity: 0, scale: 0.8 } : false}
                        animate={enableAnimation ? { opacity: 1, scale: 1 } : {}}
                        transition={{
                            duration: animationDuration,
                            delay: index * animationStagger,
                            ease: "easeOut",
                        }}
                        onMouseEnter={() => enableHover && setHoveredIndex(index)}
                        onMouseLeave={() => enableHover && setHoveredIndex(null)}
                        onClick={() => setFocusedImageIndex(index)}
                        style={{
                            gridColumn: `span ${columnSpan}`,
                            gridRow: `span ${rowSpan}`,
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: `${borderRadius}px`,
                            backgroundColor: "#F5F5F5",
                            cursor: "pointer",
                            boxShadow: enableShadow 
                                ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${getRgbaColor(shadowColor, shadowIntensity)}`
                                : "none",
                        }}
                    >
                        {enableBorder && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    borderRadius: `${borderRadius}px`,
                                    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                                    filter: borderBlur > 0 ? `blur(${borderBlur}px)` : "none",
                                    pointerEvents: "none",
                                    zIndex: 3,
                                }}
                            />
                        )}
                        <motion.img
                            src={image.src}
                            alt={image.alt || ""}
                            onLoad={(e) => {
                                const img = e.target as HTMLImageElement
                                const ratio = img.naturalWidth / img.naturalHeight
                                setImageAspectRatios(prev => ({ ...prev, [index]: ratio }))
                            }}
                            animate={enableHover ? {
                                scale: isHovered ? hoverZoom : 1,
                            } : {}}
                            transition={{
                                duration: hoverZoomDuration,
                                ease: "easeOut",
                            }}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                        {enableHover && (
                            <motion.div
                                initial={{ x: "-100%", opacity: 0 }}
                                animate={isHovered ? { x: "100%", opacity: 1 } : { x: "-100%", opacity: 0 }}
                                transition={
                                    isHovered
                                        ? {
                                              duration: shineDuration,
                                              ease: "easeInOut",
                                          }
                                        : {
                                              duration: 0,
                                          }
                                }
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    background: `linear-gradient(110deg, 
                                        transparent 20%, 
                                        ${getRgbaColor(shineColor, shineOpacity)} 50%, 
                                        transparent 80%)`,
                                    zIndex: 2,
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                    </motion.div>
                )
            })}
        </div>

        {/* Fullscreen Image Modal */}
        {focusedImageIndex !== null && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFocusedImageIndex(null)}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    cursor: "pointer",
                    padding: "40px",
                }}
            >
                <motion.img
                    key={focusedImageIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    src={items[focusedImageIndex]?.image?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"}
                    alt={items[focusedImageIndex]?.image?.alt || ""}
                    style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: `${borderRadius}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
                
                {/* Close Button */}
                <button
                    onClick={() => setFocusedImageIndex(null)}
                    style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        background: "rgba(255, 255, 255, 0.2)",
                        border: "none",
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        color: "white",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    ×
                </button>

                {/* Previous Arrow */}
                {items.length > 1 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            goToPrevious()
                        }}
                        style={{
                            position: "absolute",
                            left: "20px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "rgba(255, 255, 255, 0.2)",
                            border: "none",
                            borderRadius: "50%",
                            width: "50px",
                            height: "50px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            color: "white",
                            backdropFilter: "blur(10px)",
                            transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
                        }}
                    >
                        ‹
                    </button>
                )}

                {/* Next Arrow */}
                {items.length > 1 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            goToNext()
                        }}
                        style={{
                            position: "absolute",
                            right: "20px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "rgba(255, 255, 255, 0.2)",
                            border: "none",
                            borderRadius: "50%",
                            width: "50px",
                            height: "50px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            color: "white",
                            backdropFilter: "blur(10px)",
                            transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
                        }}
                    >
                        ›
                    </button>
                )}

                {/* Image Counter */}
                {items.length > 1 && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(255, 255, 255, 0.2)",
                            backdropFilter: "blur(10px)",
                            padding: "8px 16px",
                            borderRadius: "20px",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "500",
                        }}
                    >
                        {focusedImageIndex + 1} / {items.length}
                    </div>
                )}
            </motion.div>
        )}
        </>
    )
}

addPropertyControls(ModernBentoGrid, {
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                span: {
                    type: ControlType.Number,
                    title: "Column Span",
                    defaultValue: 1,
                    min: 1,
                    max: 4,
                    step: 1,
                    displayStepper: true,
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1",
                },
                span: 2,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2",
                },
                span: 1,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3",
                },
                span: 1,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4",
                },
                span: 1,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5",
                },
                span: 1,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 6",
                },
                span: 2,
            },
        ],
        maxCount: 20,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 4,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    enableAnimation: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
    animationStagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.05,
        unit: "s",
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
    enableHover: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverZoom: {
        type: ControlType.Number,
        title: "Zoom Scale",
        defaultValue: 1.1,
        min: 1,
        max: 1.5,
        step: 0.05,
        hidden: ({ enableHover }) => !enableHover,
    },
    hoverZoomDuration: {
        type: ControlType.Number,
        title: "Zoom Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ enableHover }) => !enableHover,
    },
    shineColor: {
        type: ControlType.Color,
        title: "Shine Color",
        defaultValue: "#FFFFFF",
        hidden: ({ enableHover }) => !enableHover,
    },
    shineOpacity: {
        type: ControlType.Number,
        title: "Shine Opacity",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ enableHover }) => !enableHover,
    },
    shineDuration: {
        type: ControlType.Number,
        title: "Shine Duration",
        defaultValue: 0.6,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ enableHover }) => !enableHover,
    },
    enableShadow: {
        type: ControlType.Boolean,
        title: "Drop Shadow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#000000",
        hidden: ({ enableShadow }) => !enableShadow,
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ enableShadow }) => !enableShadow,
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 4,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ enableShadow }) => !enableShadow,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        hidden: ({ enableShadow }) => !enableShadow,
    },
    shadowSpread: {
        type: ControlType.Number,
        title: "Shadow Spread",
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ enableShadow }) => !enableShadow,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Intensity",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ enableShadow }) => !enableShadow,
    },
    enableBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
        hidden: ({ enableBorder }) => !enableBorder,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
        hidden: ({ enableBorder }) => !enableBorder,
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border Style",
        defaultValue: "solid",
        options: ["solid", "dashed", "dotted", "double"],
        optionTitles: ["Solid", "Dashed", "Dotted", "Double"],
        hidden: ({ enableBorder }) => !enableBorder,
    },
    borderBlur: {
        type: ControlType.Number,
        title: "Border Blur",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ enableBorder }) => !enableBorder,
    },
})