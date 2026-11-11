// Create a 3D carousel with overlapping cards, navigation buttons, and a centered tag
import { useState, useEffect, startTransition, type CSSProperties } from "react"
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

interface CarouselItem {
    image: {
        src: string
        alt: string
    }
    tooltipText?: string
    link?: string
}

interface CarouselProps {
    items: CarouselItem[]
    backgroundColor: string
    cardBorderRadius: number
    autoPlay: boolean
    autoPlayInterval: number
    showNavigation: boolean
    navigationColor: string
    tooltipText: string
    tooltipBackgroundColor: string
    tooltipTextColor: string
    onTooltipClick?: () => void
    style?: CSSProperties
    // New props
    cardShadow: string
    transitionDuration: number
    hoverScale: number
    hoverBrightness: number
    tooltipPadding: string
    tooltipFontSize: number
    tooltipBorderRadius: number
    tooltipShadow: string
    activeBorderWidth: number
    activeBorderColor: string
}

/**
 * 3D Pill Carousel
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ThreeDPillCarousel(props: CarouselProps) {
    const {
        items = [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 1",
                },
                tooltipText: "View Details",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 2",
                },
                tooltipText: "Learn More",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
                tooltipText: "Explore",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 4",
                },
                tooltipText: "Discover",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 5",
                },
                tooltipText: "See More",
                link: "",
            },
        ],
        backgroundColor = "#6B2C2C",
        cardBorderRadius = 200,
        autoPlay = true,
        autoPlayInterval = 3000,
        showNavigation = true,
        navigationColor = "#9B8B8B",
        tooltipText = "View Details",
        tooltipBackgroundColor = "#FFFFFF",
        tooltipTextColor = "#000000",
        onTooltipClick,
        style,
        cardShadow = "0 20px 60px rgba(0, 0, 0, 0.3)",
        transitionDuration = 0.6,
        hoverScale = 1.05,
        hoverBrightness = 1.15,
        tooltipPadding = "12px 24px",
        tooltipFontSize = 14,
        tooltipBorderRadius = 50,
        tooltipShadow = "0 4px 12px rgba(0, 0, 0, 0.15)",
        activeBorderWidth = 6,
        activeBorderColor = "#FFFFFF",
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [tooltipHovered, setTooltipHovered] = useState(false)

    const validItems = items.filter((item) => item?.image?.src)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                handleNext()
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                handlePrev()
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }
    }, [validItems.length])

    useEffect(() => {
        if (!autoPlay || validItems.length <= 1) return

        const interval = setInterval(() => {
            startTransition(() => {
                setCurrentIndex((prev) => (prev + 1) % validItems.length)
            })
        }, autoPlayInterval)

        return () => clearInterval(interval)
    }, [autoPlay, autoPlayInterval, validItems.length])

    const handleNext = () => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev + 1) % validItems.length)
        })
    }

    const handlePrev = () => {
        startTransition(() => {
            setCurrentIndex(
                (prev) => (prev - 1 + validItems.length) % validItems.length
            )
        })
    }

    const handleCardClick = (index: number) => {
        startTransition(() => {
            setCurrentIndex(index)
        })
    }

    const getCardStyle = (index: number): CSSProperties => {
        const diff =
            (index - currentIndex + validItems.length) % validItems.length

        const isHovered = hoveredIndex === index

        if (diff === 0) {
            return {
                transform: "translateX(-50%) translateY(-50%) scale(1)",
                zIndex: 50,
                opacity: 1,
                left: "50%",
                top: "50%",
                filter: "blur(0px) brightness(1)",
            }
        }

        if (diff === 1 || diff === -validItems.length + 1) {
            return {
                transform: `translateX(-50%) translateY(-50%) scale(${
                    isHovered ? 0.85 * hoverScale : 0.85
                })`,
                zIndex: 40,
                opacity: isHovered ? 1 : 0.95,
                left: "88%",
                top: "34%",
                filter: `blur(0.5px) brightness(${isHovered ? hoverBrightness : 1})`,
            }
        }

        if (diff === 2 || diff === -validItems.length + 2) {
            return {
                transform: `translateX(-50%) translateY(-50%) scale(${
                    isHovered ? 0.7 * hoverScale : 0.7
                })`,
                zIndex: 30,
                opacity: isHovered ? 0.9 : 0.85,
                left: "122%",
                top: "22%",
                filter: `blur(1.5px) brightness(${isHovered ? hoverBrightness : 1})`,
            }
        }

        if (diff === validItems.length - 1 || diff === -1) {
            return {
                transform: `translateX(-50%) translateY(-50%) scale(${
                    isHovered ? 0.85 * hoverScale : 0.85
                })`,
                zIndex: 40,
                opacity: isHovered ? 1 : 0.95,
                left: "12%",
                top: "66%",
                filter: `blur(0.5px) brightness(${isHovered ? hoverBrightness : 1})`,
            }
        }

        if (diff === validItems.length - 2 || diff === -2) {
            return {
                transform: `translateX(-50%) translateY(-50%) scale(${
                    isHovered ? 0.7 * hoverScale : 0.7
                })`,
                zIndex: 30,
                opacity: isHovered ? 0.9 : 0.85,
                left: "-22%",
                top: "78%",
                filter: `blur(1.5px) brightness(${isHovered ? hoverBrightness : 1})`,
            }
        }

        return {
            transform: "translateX(-50%) translateY(-50%) scale(0.5)",
            zIndex: 10,
            opacity: 0,
            left: "50%",
            top: "50%",
            filter: "blur(3px) brightness(1)",
        }
    }

    if (validItems.length === 0) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: "16px",
                }}
            >
                Add images to the carousel
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
            }}
        >
            {/* Carousel Container */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "280px",
                    height: "100%",
                }}
            >
                {validItems.map((item, index) => {
                    const cardStyle = getCardStyle(index)
                    const isCenter =
                        (index - currentIndex + validItems.length) %
                            validItems.length ===
                        0

                    return (
                        <motion.div
                            key={index}
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "60%",
                                ...cardStyle,
                                transition:
                                    `all ${transitionDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                                cursor: isCenter ? "default" : "pointer",
                            }}
                            onClick={() => !isCenter && handleCardClick(index)}
                            onMouseEnter={() =>
                                !isCenter && setHoveredIndex(index)
                            }
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: `${cardBorderRadius}px`,
                                    overflow: "hidden",
                                    boxShadow:
                                        hoveredIndex === index && !isCenter
                                            ? `0 25px 70px rgba(0, 0, 0, 0.4)`
                                            : cardShadow,
                                    transition: "box-shadow 0.3s ease",
                                    border: isCenter ? `${activeBorderWidth}px solid ${activeBorderColor}` : "none",
                                }}
                            >
                                <img
                                    src={item.image?.src || ""}
                                    alt={item.image?.alt || "Carousel image"}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Animated Tooltip Button - centered above active card */}
            <AnimatePresence>
                {validItems.length > 0 && (
                    <motion.button
                        key={currentIndex}
                        initial={{
                            opacity: 0,
                            x: "-50%",
                            y: 20,
                            scale: 0.8,
                        }}
                        animate={{
                            opacity: 1,
                            x: "-50%",
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            x: "-50%",
                            y: 20,
                            scale: 0.8,
                        }}
                        transition={{
                            duration: 0.4,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation()
                            const currentItem = validItems[currentIndex]
                            if (currentItem?.link) {
                                if (typeof window !== "undefined") {
                                    window.open(currentItem.link, "_blank")
                                }
                            } else if (onTooltipClick) {
                                onTooltipClick()
                            }
                        }}
                        onMouseEnter={() => setTooltipHovered(true)}
                        onMouseLeave={() => setTooltipHovered(false)}
                        style={{
                            position: "absolute",
                            top: "calc(20% - 56px)",
                            left: "50%",
                            backgroundColor: tooltipBackgroundColor,
                            color: tooltipTextColor,
                            padding: tooltipPadding,
                            borderRadius: `${tooltipBorderRadius}px`,
                            border: "none",
                            cursor: "pointer",
                            fontSize: `${tooltipFontSize}px`,
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            boxShadow: tooltipHovered
                                ? "0 8px 24px rgba(0, 0, 0, 0.25)"
                                : tooltipShadow,
                            transition: "box-shadow 0.3s ease",
                            zIndex: 100,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {validItems[currentIndex]?.tooltipText || tooltipText}
                        {/* Tooltip Arrow */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: "-8px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: 0,
                                height: 0,
                                borderLeft: "8px solid transparent",
                                borderRight: "8px solid transparent",
                                borderTop: `8px solid ${tooltipBackgroundColor}`,
                            }}
                        />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(ThreeDPillCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                tooltipText: {
                    type: ControlType.String,
                    title: "Tooltip Text",
                    defaultValue: "",
                    placeholder: "Optional tooltip text",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                    placeholder: "https://example.com",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 1",
                },
                tooltipText: "View Details",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 2",
                },
                tooltipText: "Learn More",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
                tooltipText: "Explore",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 4",
                },
                tooltipText: "Discover",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 5",
                },
                tooltipText: "See More",
                link: "",
            },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 200,
        min: 0,
        max: 300,
        step: 10,
        unit: "px",
    },
    cardShadow: {
        type: ControlType.String,
        title: "Card Shadow",
        defaultValue: "0 20px 60px rgba(0, 0, 0, 0.3)",
        placeholder: "CSS box-shadow value",
    },
    activeBorderWidth: {
        type: ControlType.Number,
        title: "Active Border Width",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    activeBorderColor: {
        type: ControlType.Color,
        title: "Active Border Color",
        defaultValue: "#FFFFFF",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.3,
        step: 0.05,
    },
    hoverBrightness: {
        type: ControlType.Number,
        title: "Hover Brightness",
        defaultValue: 1.15,
        min: 1,
        max: 2,
        step: 0.05,
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlayInterval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 3000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    tooltipBackgroundColor: {
        type: ControlType.Color,
        title: "Tooltip Background",
        defaultValue: "#000000",
    },
    tooltipTextColor: {
        type: ControlType.Color,
        title: "Tooltip Text Color",
        defaultValue: "#FFFFFF",
    },
    tooltipPadding: {
        type: ControlType.String,
        title: "Tooltip Padding",
        defaultValue: "12px 24px",
        placeholder: "e.g., 12px 24px",
    },
    tooltipFontSize: {
        type: ControlType.Number,
        title: "Tooltip Font Size",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
    },
    tooltipBorderRadius: {
        type: ControlType.Number,
        title: "Tooltip Radius",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    tooltipShadow: {
        type: ControlType.String,
        title: "Tooltip Shadow",
        defaultValue: "0 4px 12px rgba(0, 0, 0, 0.15)",
        placeholder: "CSS box-shadow value",
    },
})
