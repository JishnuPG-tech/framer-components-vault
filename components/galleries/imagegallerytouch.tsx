// Click-to-cycle image gallery with smooth transitions, indicator dots, and full responsiveness
import { useState, startTransition, type CSSProperties } from "react"
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

interface Image {
    src: string | { src: string; srcSet?: string; alt?: string }
    alt: string
    link?: string
    buttonText?: string
}

interface ImageGalleryProps {
    images: Image[]
    transitionType: "fade" | "slide" | "scale"
    transitionDuration: number
    borderRadius: number
    backgroundColor: string
    backgroundBlur: boolean
    blurAmount: number
    showIndicators: boolean
    indicatorColor: string
    indicatorActiveColor: string
    shadow: boolean
    linkTarget: "_blank" | "_self"
    cursorType: "pointer" | "zoom-in" | "grab" | "crosshair"
    showButton: boolean
    buttonText: string
    buttonBackgroundColor: string
    buttonTextColor: string
    buttonFont: CSSProperties
    showMobileArrows: boolean
    arrowColor: string
    arrowBackgroundColor: string
    style?: CSSProperties
}

/**
 * Click-to-Cycle Image Gallery
 * 
 * A minimal, responsive gallery that cycles through images on click.
 * Perfect for product cards, portfolios, and CMS collections.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageGallery(props: ImageGalleryProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Image 4",
            },
        ],
        transitionType = "fade",
        transitionDuration = 0.4,
        borderRadius = 12,
        backgroundColor = "#F5F5F5",
        backgroundBlur = false,
        blurAmount = 10,
        showIndicators = true,
        indicatorColor = "#CCCCCC",
        indicatorActiveColor = "#000000",
        shadow = true,
        linkTarget = "_blank",
        cursorType = "pointer",
        showButton = true,
        buttonText = "View More",
        buttonBackgroundColor = "#000000",
        buttonTextColor = "#FFFFFF",
        buttonFont,
        showMobileArrows = true,
        arrowColor = "#FFFFFF",
        arrowBackgroundColor = "rgba(0, 0, 0, 0.5)",
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)

    const handleClick = () => {
        const currentImage = images[currentIndex]
        
        // Otherwise, cycle to next image
        startTransition(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length)
        })
    }

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation()
        startTransition(() => {
            setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
        })
    }

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        startTransition(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length)
        })
    }

    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        const currentImage = images[currentIndex]
        
        if (currentImage.link && currentImage.link.trim() !== "") {
            if (typeof window !== "undefined") {
                if (linkTarget === "_blank") {
                    window.open(currentImage.link, "_blank", "noopener,noreferrer")
                } else {
                    window.location.href = currentImage.link
                }
            }
        }
    }

    const getTransitionVariants = () => {
        switch (transitionType) {
            case "slide":
                return {
                    initial: { x: "100%", opacity: 0 },
                    animate: { x: 0, opacity: 1 },
                    exit: { x: "-100%", opacity: 0 },
                }
            case "scale":
                return {
                    initial: { scale: 0.8, opacity: 0 },
                    animate: { scale: 1, opacity: 1 },
                    exit: { scale: 1.2, opacity: 0 },
                }
            case "fade":
            default:
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                }
        }
    }

    const variants = getTransitionVariants()

    // Helper to get image source
    const getImageSrc = (img: Image) => {
        return typeof img.src === "string" ? img.src : img.src.src
    }

    // Helper to get image srcSet
    const getImageSrcSet = (img: Image) => {
        return typeof img.src === "object" ? img.src.srcSet : undefined
    }

    // Helper to get image alt
    const getImageAlt = (img: Image) => {
        if (typeof img.src === "object" && img.src.alt) {
            return img.src.alt
        }
        return img.alt || "Gallery image"
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}
        >
            {/* Gallery Container */}
            <div
                onClick={handleClick}
                style={{
                    position: "relative",
                    width: "100%",
                    flex: 1,
                    backgroundColor: backgroundColor,
                    borderRadius: borderRadius,
                    overflow: "hidden",
                    cursor: cursorType,
                    boxShadow: shadow ? "0 4px 20px rgba(0, 0, 0, 0.08)" : "none",
                    ...(backgroundBlur && {
                        backdropFilter: `blur(${blurAmount}px)`,
                        WebkitBackdropFilter: `blur(${blurAmount}px)`,
                    }),
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={currentIndex}
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{
                            duration: transitionDuration,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <img
                            src={getImageSrc(images[currentIndex])}
                            srcSet={getImageSrcSet(images[currentIndex])}
                            alt={getImageAlt(images[currentIndex])}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                        
                        {/* CTA Button */}
                        {showButton && images[currentIndex].link && images[currentIndex].link.trim() !== "" && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 24,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    zIndex: 10,
                                }}
                            >
                                <button
                                    onClick={handleButtonClick}
                                    style={{
                                        padding: "12px 24px",
                                        backgroundColor: buttonBackgroundColor,
                                        color: buttonTextColor,
                                        border: "none",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
                                        transition: "all 0.2s ease",
                                        ...buttonFont,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-2px)"
                                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)"
                                        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.15)"
                                    }}
                                >
                                    {images[currentIndex].buttonText || buttonText}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows for Mobile */}
                {showMobileArrows && images.length > 1 && (
                    <>
                        {/* Previous Arrow */}
                        <button
                            onClick={handlePrevious}
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                backgroundColor: arrowBackgroundColor,
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 20,
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                            }}
                            aria-label="Previous image"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={arrowColor}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>

                        {/* Next Arrow */}
                        <button
                            onClick={handleNext}
                            style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                backgroundColor: arrowBackgroundColor,
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 20,
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                            }}
                            aria-label="Next image"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={arrowColor}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* Indicator Dots */}
            {showIndicators && images.length > 1 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 0",
                    }}
                >
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation()
                                startTransition(() => setCurrentIndex(index))
                            }}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                backgroundColor:
                                    index === currentIndex ? indicatorActiveColor : indicatorColor,
                                transition: "all 0.3s ease",
                            }}
                            aria-label={`Go to image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

addPropertyControls(ImageGallery, {
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
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Gallery image",
                },
                link: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "",
                },
                buttonText: {
                    type: ControlType.String,
                    title: "Button Text",
                    defaultValue: "View More",
                },
            },
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Image 4",
            },
        ],
    },
    showMobileArrows: {
        type: ControlType.Boolean,
        title: "Navigation Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showMobileArrows }) => !showMobileArrows,
    },
    arrowBackgroundColor: {
        type: ControlType.Color,
        title: "Arrow BG",
        defaultValue: "rgba(0, 0, 0, 0.5)",
        hidden: ({ showMobileArrows }) => !showMobileArrows,
    },
    showButton: {
        type: ControlType.Boolean,
        title: "Show Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    buttonText: {
        type: ControlType.String,
        title: "Default Button Text",
        defaultValue: "View More",
        hidden: ({ showButton }) => !showButton,
    },
    buttonBackgroundColor: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#000000",
        hidden: ({ showButton }) => !showButton,
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#FFFFFF",
        hidden: ({ showButton }) => !showButton,
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        defaultValue: {
            variant: "Semibold",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showButton }) => !showButton,
    },
    linkTarget: {
        type: ControlType.Enum,
        title: "Link Target",
        options: ["_blank", "_self"],
        optionTitles: ["New Tab", "Same Tab"],
        defaultValue: "_blank",
        displaySegmentedControl: true,
    },
    cursorType: {
        type: ControlType.Enum,
        title: "Cursor",
        options: ["pointer", "zoom-in", "grab", "crosshair"],
        optionTitles: ["Pointer", "Zoom In", "Grab", "Crosshair"],
        defaultValue: "pointer",
    },
    transitionType: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["fade", "slide", "scale"],
        optionTitles: ["Fade", "Slide", "Scale"],
        defaultValue: "fade",
        displaySegmentedControl: true,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.4,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    backgroundBlur: {
        type: ControlType.Boolean,
        title: "Blur",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ backgroundBlur }) => !backgroundBlur,
    },
    showIndicators: {
        type: ControlType.Boolean,
        title: "Indicators",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    indicatorColor: {
        type: ControlType.Color,
        title: "Indicator",
        defaultValue: "#CCCCCC",
        hidden: ({ showIndicators }) => !showIndicators,
    },
    indicatorActiveColor: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#000000",
        hidden: ({ showIndicators }) => !showIndicators,
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
