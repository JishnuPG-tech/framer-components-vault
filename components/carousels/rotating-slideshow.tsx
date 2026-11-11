// Slideshow component with previous/next arrows, supports images and components, centered content with horizontal rotation animation
import { useState, startTransition, useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface ArrowSettings {
    color: string
    backgroundColor: string
    size: number
    arrows: boolean
    horizontalOffset: number
    verticalOffset: number
    borderRadius: number
    showBorder: boolean
    borderWidth: number
    borderColor: string
    hoverBackgroundColor: string
    hoverColor: string
    previousIcon: string
    nextIcon: string
    previousImage?: { src: string; alt?: string }
    nextImage?: { src: string; alt?: string }
    previousHoverImage?: { src: string; alt?: string }
    nextHoverImage?: { src: string; alt?: string }
    shadow: boolean
    shadowColor: string
    shadowBlur: number
    shadowSpread: number
    shadowOffsetX: number
    shadowOffsetY: number
    position: "sides" | "bottom" | "top" | "custom"
    horizontalPosition: number
    verticalPosition: number
    spacing: number
    changeBorderOnHover: boolean
    hoverBorderColor: string
    changeShadowOnHover: boolean
    hoverShadowColor: string
    showFill: boolean
    changeFillOnHover: boolean
}

interface SlideshowProps {
    slides: any[]
    rotationType: "horizontal" | "vertical"
    rotationDirection: "left-to-right" | "right-to-left"
    verticalDirection: "top-to-bottom" | "bottom-to-top"
    perspective: number
    opacity: number
    autoplay: boolean
    interval: number
    arrow: ArrowSettings
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Slideshow(props: SlideshowProps) {
    const {
        slides = [],
        rotationType = "horizontal",
        rotationDirection = "left-to-right",
        verticalDirection = "top-to-bottom",
        opacity = 0,
        autoplay = false,
        interval = 3000,
        arrow = {
            color: "#000000",
            backgroundColor: "#FFFFFF",
            size: 40,
            arrows: true,
            horizontalOffset: 20,
            verticalOffset: 0,
            borderRadius: 50,
            showBorder: false,
            borderWidth: 0,
            borderColor: "#000000",
            hoverBackgroundColor: "#F5F5F5",
            hoverColor: "#000000",
            previousIcon: "chevron",
            nextIcon: "chevron",
            shadow: true,
            shadowColor: "rgba(0,0,0,0.15)",
            shadowBlur: 8,
            shadowSpread: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 2,
            position: "sides",
            horizontalPosition: 50,
            verticalPosition: 50,
            spacing: 20,
            changeBorderOnHover: false,
            hoverBorderColor: "#000000",
            changeShadowOnHover: false,
            hoverShadowColor: "#000000",
            showFill: true,
            changeFillOnHover: false,
            previousImage: undefined,
            nextImage: undefined,
            previousHoverImage: undefined,
            nextHoverImage: undefined,
        },
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState<"next" | "prev">("next")
    const [hoveredArrow, setHoveredArrow] = useState<"prev" | "next" | null>(null)

    useEffect(() => {
        if (!autoplay || slides.length <= 1) return

        const timer = setInterval(() => {
            handleNext()
        }, interval * 1000)

        return () => clearInterval(timer)
    }, [autoplay, interval, currentIndex, slides.length])

    const arrowBoxShadow = arrow.shadow
        ? `${arrow.shadowOffsetX}px ${arrow.shadowOffsetY}px ${arrow.shadowBlur}px ${arrow.shadowSpread}px ${arrow.shadowColor}`
        : "none"

    const handlePrevious = () => {
        startTransition(() => {
            setDirection("prev")
            setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
        })
    }

    const handleNext = () => {
        startTransition(() => {
            setDirection("next")
            setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
        })
    }

    const variants = {
        enter: (dir: "next" | "prev") => {
            if (rotationType === "horizontal") {
                const isLeftToRight = rotationDirection === "left-to-right"
                const angle = isLeftToRight 
                    ? (dir === "next" ? 90 : -90)
                    : (dir === "next" ? -90 : 90)
                return {
                    rotateY: angle,
                    opacity: opacity,
                }
            } else {
                const isTopToBottom = verticalDirection === "top-to-bottom"
                const angle = isTopToBottom
                    ? (dir === "next" ? 90 : -90)
                    : (dir === "next" ? -90 : 90)
                return {
                    rotateX: angle,
                    opacity: opacity,
                }
            }
        },
        center: {
            rotateY: 0,
            rotateX: 0,
            opacity: 1,
        },
        exit: (dir: "next" | "prev") => {
            if (rotationType === "horizontal") {
                const isLeftToRight = rotationDirection === "left-to-right"
                const angle = isLeftToRight
                    ? (dir === "next" ? -90 : 90)
                    : (dir === "next" ? 90 : -90)
                return {
                    rotateY: angle,
                    opacity: opacity,
                }
            } else {
                const isTopToBottom = verticalDirection === "top-to-bottom"
                const angle = isTopToBottom
                    ? (dir === "next" ? -90 : 90)
                    : (dir === "next" ? 90 : -90)
                return {
                    rotateX: angle,
                    opacity: opacity,
                }
            }
        },
    }

    const getArrowIcon = (type: "prev" | "next", iconType: string) => {
        const size = arrow.size * 0.5
        const color = hoveredArrow === type ? arrow.hoverColor : arrow.color
        const isLeftRight = rotationType === "horizontal"

        if (iconType === "image") {
            const isHovered = hoveredArrow === type
            const imageData = type === "prev" 
                ? (isHovered && arrow.previousHoverImage?.src ? arrow.previousHoverImage : arrow.previousImage)
                : (isHovered && arrow.nextHoverImage?.src ? arrow.nextHoverImage : arrow.nextImage)
            
            if (imageData?.src) {
                return (
                    <img
                        src={imageData.src}
                        alt={imageData.alt || `${type === "prev" ? "Previous" : "Next"} arrow`}
                        style={{
                            width: size,
                            height: size,
                            objectFit: "contain",
                        }}
                    />
                )
            }
        }

        if (iconType === "chevron") {
            const points = isLeftRight 
                ? (type === "prev" ? "15 18 9 12 15 6" : "9 18 15 12 9 6")
                : (type === "prev" ? "18 15 12 9 6 15" : "18 9 12 15 6 9")
            
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points={points} />
                </svg>
            )
        } else if (iconType === "arrow") {
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {isLeftRight ? (
                        type === "prev" ? (
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        ) : (
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        )
                    ) : (
                        type === "prev" ? (
                            <path d="M12 19V5M5 12l7-7 7 7" />
                        ) : (
                            <path d="M12 5v14M19 12l-7 7-7-7" />
                        )
                    )}
                </svg>
            )
        } else if (iconType === "caret") {
            const path = isLeftRight
                ? (type === "prev" ? "M15 18l-6-6 6-6v12z" : "M9 18l6-6-6-6v12z")
                : (type === "prev" ? "M18 15l-6-6-6 6h12z" : "M18 9l-6 6-6-6h12z")
            
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
                    <path d={path} />
                </svg>
            )
        }
    }

    const getArrowPositions = () => {
        if (arrow.position === "sides") {
            return {
                prev: {
                    left: `${arrow.horizontalOffset}px`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    right: "auto",
                    bottom: "auto",
                },
                next: {
                    right: `${arrow.horizontalOffset}px`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: "auto",
                    bottom: "auto",
                },
            }
        } else if (arrow.position === "bottom") {
            return {
                prev: {
                    left: `calc(50% - ${arrow.spacing / 2}px - ${arrow.size}px)`,
                    bottom: `${arrow.verticalOffset}px`,
                    transform: "none",
                    right: "auto",
                    top: "auto",
                },
                next: {
                    left: `calc(50% + ${arrow.spacing / 2}px)`,
                    bottom: `${arrow.verticalOffset}px`,
                    transform: "none",
                    right: "auto",
                    top: "auto",
                },
            }
        } else if (arrow.position === "top") {
            return {
                prev: {
                    left: `calc(50% - ${arrow.spacing / 2}px - ${arrow.size}px)`,
                    top: `${arrow.verticalOffset}px`,
                    transform: "none",
                    right: "auto",
                    bottom: "auto",
                },
                next: {
                    left: `calc(50% + ${arrow.spacing / 2}px)`,
                    top: `${arrow.verticalOffset}px`,
                    transform: "none",
                    right: "auto",
                    bottom: "auto",
                },
            }
        } else {
            // custom
            return {
                prev: {
                    left: `calc(${arrow.horizontalPosition}% - ${arrow.spacing / 2}px - ${arrow.size}px)`,
                    top: `${arrow.verticalPosition}%`,
                    transform: "translateY(-50%)",
                    right: "auto",
                    bottom: "auto",
                },
                next: {
                    left: `calc(${arrow.horizontalPosition}% + ${arrow.spacing / 2}px)`,
                    top: `${arrow.verticalPosition}%`,
                    transform: "translateY(-50%)",
                    right: "auto",
                    bottom: "auto",
                },
            }
        }
    }

    const arrowPositions = getArrowPositions()

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: `${props.perspective || 2000}px`,
                perspectiveOrigin: "50% 50%",
            }}
        >
            <AnimatePresence initial={false} mode="wait" custom={direction}>
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        rotateY: { type: "tween", duration: 0.8, ease: "easeInOut" },
                        rotateX: { type: "tween", duration: 0.8, ease: "easeInOut" },
                        opacity: { duration: 0.4, ease: "easeInOut" },
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "absolute",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {slides[currentIndex]}
                </motion.div>
            </AnimatePresence>

            {arrow.arrows && slides.length > 1 && (
                <>
                    <button
                        onClick={handlePrevious}
                        onMouseEnter={() => startTransition(() => setHoveredArrow("prev"))}
                        onMouseLeave={() => startTransition(() => setHoveredArrow(null))}
                        style={{
                            position: "absolute",
                            ...arrowPositions.prev,
                            width: arrow.size,
                            height: arrow.size,
                            borderRadius: `${arrow.borderRadius}%`,
                            backgroundColor: arrow.showFill 
                                ? (hoveredArrow === "prev" ? arrow.hoverBackgroundColor : arrow.backgroundColor) 
                                : (arrow.changeFillOnHover && hoveredArrow === "prev" ? arrow.hoverBackgroundColor : "transparent"),
                            border: arrow.showBorder && arrow.borderWidth > 0 ? `${arrow.borderWidth}px solid ${hoveredArrow === "prev" && arrow.changeBorderOnHover ? arrow.hoverBorderColor : arrow.borderColor}` : "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: arrowBoxShadow,
                            transition: "background-color 0.2s ease",
                        }}
                        aria-label="Previous slide"
                    >
                        {getArrowIcon("prev", arrow.previousIcon)}
                    </button>

                    <button
                        onClick={handleNext}
                        onMouseEnter={() => startTransition(() => setHoveredArrow("next"))}
                        onMouseLeave={() => startTransition(() => setHoveredArrow(null))}
                        style={{
                            position: "absolute",
                            ...arrowPositions.next,
                            width: arrow.size,
                            height: arrow.size,
                            borderRadius: `${arrow.borderRadius}%`,
                            backgroundColor: arrow.showFill 
                                ? (hoveredArrow === "next" ? arrow.hoverBackgroundColor : arrow.backgroundColor) 
                                : (arrow.changeFillOnHover && hoveredArrow === "next" ? arrow.hoverBackgroundColor : "transparent"),
                            border: arrow.showBorder && arrow.borderWidth > 0 ? `${arrow.borderWidth}px solid ${hoveredArrow === "next" && arrow.changeBorderOnHover ? arrow.hoverBorderColor : arrow.borderColor}` : "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: arrowBoxShadow,
                            transition: "background-color 0.2s ease",
                        }}
                        aria-label="Next slide"
                    >
                        {getArrowIcon("next", arrow.nextIcon)}
                    </button>
                </>
            )}
        </div>
    )
}

addPropertyControls(Slideshow, {
    slides: {
        type: ControlType.Array,
        control: {
            type: ControlType.ComponentInstance,
        },
        maxCount: 10,
        defaultValue: [],
    },
    rotationType: {
        type: ControlType.Enum,
        title: "Rotation Type",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    rotationDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left-to-right", "right-to-left"],
        optionTitles: ["←", "→"],
        defaultValue: "left-to-right",
        displaySegmentedControl: true,
        hidden: ({ rotationType }) => rotationType !== "horizontal",
    },
    verticalDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["top-to-bottom", "bottom-to-top"],
        optionTitles: ["↓", "↑"],
        defaultValue: "top-to-bottom",
        displaySegmentedControl: true,
        hidden: ({ rotationType }) => rotationType !== "vertical",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 3,
        min: 1,
        max: 60,
        step: 0.5,
        unit: "s",
        hidden: ({ autoplay }) => !autoplay,
    },
    opacity: {
        type: ControlType.Number,
        title: "Rotation Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.1,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 2000,
        min: 1000,
        max: 10000,
        step: 100,
        unit: "px",
    },
    arrow: {
        type: ControlType.Object,
        title: "Arrow Settings",
        controls: {
            arrows: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["sides", "bottom", "top", "custom"],
                optionTitles: ["Sides", "Bottom", "Top", "Custom"],
                defaultValue: "sides",
                hidden: ({ arrows }) => !arrows,
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 20,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                hidden: ({ arrows }) => !arrows,
            },
            horizontalOffset: {
                type: ControlType.Number,
                title: "H Offset",
                defaultValue: 20,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                hidden: ({ position, arrows }) => !arrows || position !== "sides",
            },
            verticalOffset: {
                type: ControlType.Number,
                title: "V Offset",
                defaultValue: 0,
                min: -200,
                max: 200,
                step: 1,
                unit: "px",
                hidden: ({ position, arrows }) => !arrows || (position !== "top" && position !== "bottom"),
            },
            horizontalPosition: {
                type: ControlType.Number,
                title: "H Offset",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: ({ position, arrows }) => !arrows || position !== "custom",
            },
            verticalPosition: {
                type: ControlType.Number,
                title: "V Offset",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: ({ position, arrows }) => !arrows || position !== "custom",
            },
            previousIcon: {
                type: ControlType.Enum,
                title: "Previous",
                options: ["chevron", "arrow", "caret", "image"],
                optionTitles: ["Chevron", "Arrow", "Caret", "Image"],
                defaultValue: "chevron",
                hidden: ({ arrows }) => !arrows,
            },
            previousImage: {
                type: ControlType.ResponsiveImage,
                title: "Default",
                hidden: ({ previousIcon, arrows }) => !arrows || previousIcon !== "image",
            },
            previousHoverImage: {
                type: ControlType.ResponsiveImage,
                title: "Hover",
                hidden: ({ previousIcon, arrows }) => !arrows || previousIcon !== "image",
            },
            nextIcon: {
                type: ControlType.Enum,
                title: "Next",
                options: ["chevron", "arrow", "caret", "image"],
                optionTitles: ["Chevron", "Arrow", "Caret", "Image"],
                defaultValue: "chevron",
                hidden: ({ arrows }) => !arrows,
            },
            nextImage: {
                type: ControlType.ResponsiveImage,
                title: "Default",
                hidden: ({ nextIcon, arrows }) => !arrows || nextIcon !== "image",
            },
            nextHoverImage: {
                type: ControlType.ResponsiveImage,
                title: "Hover",
                hidden: ({ nextIcon, arrows }) => !arrows || nextIcon !== "image",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 40,
                min: 20,
                max: 80,
                step: 1,
                unit: "px",
                hidden: ({ arrows }) => !arrows,
            },
            color: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#000000",
                hidden: ({ previousIcon, nextIcon, arrows }) => !arrows || previousIcon === "image" || nextIcon === "image",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover Icon",
                defaultValue: "#000000",
                hidden: ({ previousIcon, nextIcon, arrows }) => !arrows || previousIcon === "image" || nextIcon === "image",
            },
            showFill: {
                type: ControlType.Boolean,
                title: "Fill",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: ({ arrows }) => !arrows,
            },
            changeFillOnHover: {
                type: ControlType.Boolean,
                title: "Hover",
                defaultValue: false,
                enabledTitle: "Change",
                disabledTitle: "Default",
                hidden: ({ showFill, arrows }) => !arrows || showFill,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: ({ showFill, arrows }) => !arrows || !showFill,
            },
            hoverBackgroundColor: {
                type: ControlType.Color,
                title: "Hover Fill",
                defaultValue: "#F5F5F5",
                hidden: ({ showFill, changeFillOnHover, arrows }) => !arrows || (!showFill && !changeFillOnHover),
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 50,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                hidden: ({ arrows }) => !arrows,
            },
            showBorder: {
                type: ControlType.Boolean,
                title: "Border",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: ({ arrows }) => !arrows,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 0,
                min: 0,
                max: 10,
                step: 1,
                unit: "px",
                hidden: ({ showBorder, arrows }) => !arrows || !showBorder,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#000000",
                hidden: ({ showBorder, arrows }) => !arrows || !showBorder,
            },
            changeBorderOnHover: {
                type: ControlType.Boolean,
                title: "Hover",
                defaultValue: false,
                enabledTitle: "Change",
                disabledTitle: "Default",
                hidden: ({ showBorder, arrows }) => !arrows || !showBorder,
            },
            hoverBorderColor: {
                type: ControlType.Color,
                title: "Hover Color",
                defaultValue: "#000000",
                hidden: ({ showBorder, changeBorderOnHover, arrows }) => !arrows || !showBorder || !changeBorderOnHover,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: ({ arrows }) => !arrows,
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0,0,0,0.15)",
                hidden: ({ shadow, arrows }) => !arrows || !shadow,
            },
            shadowBlur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 8,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                hidden: ({ shadow, arrows }) => !arrows || !shadow,
            },
            shadowSpread: {
                type: ControlType.Number,
                title: "Spread",
                defaultValue: 0,
                min: -20,
                max: 20,
                step: 1,
                unit: "px",
                hidden: ({ shadow, arrows }) => !arrows || !shadow,
            },
            shadowOffsetX: {
                type: ControlType.Number,
                title: "Shadow X",
                defaultValue: 0,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
                hidden: ({ shadow, arrows }) => !arrows || !shadow,
            },
            shadowOffsetY: {
                type: ControlType.Number,
                title: "Shadow Y",
                defaultValue: 2,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
                hidden: ({ shadow, arrows }) => !arrows || !shadow,
            },
            changeShadowOnHover: {
                type: ControlType.Boolean,
                title: "Hover",
                defaultValue: false,
                enabledTitle: "Change",
                disabledTitle: "Default",
                hidden: ({ shadow, arrows }) => !arrows || !shadow,
            },
            hoverShadowColor: {
                type: ControlType.Color,
                title: "Hover Color",
                defaultValue: "#000000",
                hidden: ({ shadow, changeShadowOnHover, arrows }) => !arrows || !shadow || !changeShadowOnHover,
            },
        },
    },
})

Slideshow.displayName = "Rotating Slideshow"