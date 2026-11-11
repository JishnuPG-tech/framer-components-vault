// Apple-style product card component with full customization

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
import { useState, startTransition, useRef, useEffect } from "react"
import type { CSSProperties } from "react"

interface ProductCardProps {
    image: {
        src: string
        alt: string
    }
    title: string
    modalHeading: string
    modalDescription: string
    cardTextColor: string
    borderRadius: number
    padding: number
    headingFont: CSSProperties
    modalDescriptionFont: CSSProperties
    imagePosition: "top" | "center" | "bottom"
    textPosition: "bottom-left" | "bottom-center" | "top-left" | "top-center"
    overlayStyles: {
        showOverlay: boolean
        overlayColor: string
        overlayOpacity: number
        overlayHeight: number
    }
    modalStyles: {
        modalTextColor: string
        modalOverlayColor: string
        modalBackgroundColor: string
    }
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ProductCard(props: ProductCardProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Product Image",
        },
        title = "Built for Comfort.",
        modalHeading = "Design dedicated to designers & Creatives",
        modalDescription = "Experience unparalleled design with the Tela collection, where premium aesthetics meet luxury and comfort.\n\nEach piece is meticulously crafted to elevate your space, offering a harmonious blend of style and functionality.\n\nIndulge in the exquisite details and superior materials that define the Tela line, ensuring that every moment spent in your environment is one of elegance and relaxation.",
        cardTextColor = "#1D1D1F",
        borderRadius = 48,
        padding = 40,
        headingFont,
        modalDescriptionFont,
        imagePosition = "center",
        textPosition = "bottom-left",
        overlayStyles = {
            showOverlay: true,
            overlayColor: "#FFFFFF",
            overlayOpacity: 0.8,
            overlayHeight: 50,
        },
        modalStyles = {
            modalTextColor: "#1D1D1F",
            modalOverlayColor: "rgba(0, 0, 0, 0.6)",
            modalBackgroundColor: "#F5EDE4",
        },
    } = props

    const { modalTextColor, modalOverlayColor, modalBackgroundColor } = modalStyles
    const { showOverlay, overlayColor, overlayOpacity, overlayHeight } = overlayStyles

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [cardPosition, setCardPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined") {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight })
            
            const handleResize = () => {
                setWindowSize({ width: window.innerWidth, height: window.innerHeight })
            }
            
            window.addEventListener("resize", handleResize)
            return () => window.removeEventListener("resize", handleResize)
        }
    }, [])

    const openModal = () => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect()
            setCardPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                width: rect.width,
                height: rect.height,
            })
        }
        startTransition(() => setIsModalOpen(true))
    }

    const closeModal = () => {
        startTransition(() => setIsModalOpen(false))
    }

    const getImagePositionStyle = (): CSSProperties => {
        switch (imagePosition) {
            case "top":
                return { objectPosition: "center top" }
            case "bottom":
                return { objectPosition: "center bottom" }
            default:
                return { objectPosition: "center center" }
        }
    }

    const getTextPositionStyle = (): CSSProperties => {
        const baseStyle: CSSProperties = {
            position: "absolute",
            zIndex: 2,
        }

        switch (textPosition) {
            case "bottom-left":
                return {
                    ...baseStyle,
                    bottom: padding,
                    left: padding,
                    textAlign: "left",
                }
            case "bottom-center":
                return {
                    ...baseStyle,
                    bottom: padding,
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                }
            case "top-left":
                return {
                    ...baseStyle,
                    top: padding,
                    left: padding,
                    textAlign: "left",
                }
            case "top-center":
                return {
                    ...baseStyle,
                    top: padding,
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                }
            default:
                return {
                    ...baseStyle,
                    bottom: padding,
                    left: padding,
                    textAlign: "left",
                }
        }
    }

    return (
        <>
            <div
                ref={cardRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    borderRadius,
                    overflow: "hidden",
                    cursor: "pointer",
                    ...props.style,
                }}
                onClick={openModal}
                onMouseEnter={() => startTransition(() => setIsHovered(true))}
                onMouseLeave={() => startTransition(() => setIsHovered(false))}
            >
                <motion.img
                    src={image.src}
                    alt={image.alt}
                    animate={{
                        scale: isHovered ? 1.04 : 1,
                    }}
                    transition={{
                        duration: 0.4,
                        ease: [0.32, 0.72, 0, 1],
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        ...getImagePositionStyle(),
                    }}
                />

                {/* Gradient overlay for text contrast */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${overlayHeight}%`,
                        background: `linear-gradient(to top, ${overlayColor}, transparent)`,
                        opacity: showOverlay ? overlayOpacity : 0,
                        zIndex: 1,
                        pointerEvents: "none",
                    }}
                />

                <div style={getTextPositionStyle()}>
                    <h2
                        style={{
                            margin: 0,
                            color: cardTextColor,
                            ...headingFont,
                        }}
                    >
                        {title}
                    </h2>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: modalOverlayColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 9999,
                            padding: 20,
                        }}
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{
                                scale: cardPosition.width / 600,
                                x: cardPosition.x - windowSize.width / 2,
                                y: cardPosition.y - windowSize.height / 2,
                                opacity: 0,
                            }}
                            animate={{
                                scale: 1,
                                x: 0,
                                y: 0,
                                opacity: 1,
                            }}
                            exit={{
                                scale: cardPosition.width / 600,
                                x: cardPosition.x - windowSize.width / 2,
                                y: cardPosition.y - windowSize.height / 2,
                                opacity: 0,
                            }}
                            transition={{
                                duration: 0.4,
                                ease: [0.32, 0.72, 0, 1],
                            }}
                            style={{
                                position: "relative",
                                width: "calc(100vw - 2rem)",
                                maxWidth: 600,
                                minHeight: "90vh",
                                backgroundColor: modalBackgroundColor,
                                borderRadius: 32,
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={closeModal}
                                style={{
                                    position: "absolute",
                                    top: 20,
                                    right: 20,
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 10,
                                    transition: "background-color 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 4L4 12M4 4L12 12"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>

                            {/* Image section */}
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: 300,
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        ...getImagePositionStyle(),
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: "60%",
                                        background: `linear-gradient(to top, ${modalBackgroundColor}, transparent)`,
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>

                            {/* Content section */}
                            <div
                                style={{
                                    padding: "0 40px 40px 40px",
                                    overflowY: "auto",
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: 400,
                                        width: "100%",
                                    }}
                                >
                                    <h2
                                        style={{
                                            margin: "0 0 20px 0",
                                            color: modalTextColor,
                                            ...headingFont,
                                        }}
                                    >
                                        {modalHeading}
                                    </h2>
                                    <div
                                        style={{
                                            color: modalTextColor,
                                            ...modalDescriptionFont,
                                            whiteSpace: "pre-line",
                                        }}
                                    >
                                        {modalDescription}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

addPropertyControls(ProductCard, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Built for Comfort.",
    },
    modalHeading: {
        type: ControlType.String,
        title: "Modal Heading",
        defaultValue: "Design dedicated to designers & Creatives",
    },
    modalDescription: {
        type: ControlType.String,
        title: "Modal Description",
        displayTextArea: true,
        defaultValue:
            "Experience unparalleled design with the Tela collection, where premium aesthetics meet luxury and comfort.\n\nEach piece is meticulously crafted to elevate your space, offering a harmonious blend of style and functionality.\n\nIndulge in the exquisite details and superior materials that define the Tela line, ensuring that every moment spent in your environment is one of elegance and relaxation.",
    },
    modalStyles: {
        type: ControlType.Object,
        title: "Modal Styles",
        controls: {
            modalTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#1D1D1F",
            },
            modalOverlayColor: {
                type: ControlType.Color,
                title: "Overlay",
                defaultValue: "rgba(0, 0, 0, 0.6)",
            },
            modalBackgroundColor: {
                type: ControlType.Color,
                title: "Background Color",
                defaultValue: "#F5EDE4",
            },
        },
        defaultValue: {
            modalTextColor: "#1D1D1F",
            modalOverlayColor: "rgba(0, 0, 0, 0.6)",
            modalBackgroundColor: "#F5EDE4",
        },
    },
    overlayStyles: {
        type: ControlType.Object,
        title: "Card Overlay",
        description: "Adds a gradient overlay to create contrast for the title text",
        controls: {
            showOverlay: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
            overlayOpacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.8,
                min: 0,
                max: 1,
                step: 0.1,
            },
            overlayHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
            },
        },
        defaultValue: {
            showOverlay: true,
            overlayColor: "#FFFFFF",
            overlayOpacity: 0.8,
            overlayHeight: 50,
        },
    },
    cardTextColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#1D1D1F",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 48,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 48,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
    },
    imagePosition: {
        type: ControlType.Enum,
        title: "Image Position",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    textPosition: {
        type: ControlType.Enum,
        title: "Text Position",
        options: ["bottom-left", "bottom-center", "top-left", "top-center"],
        optionTitles: ["Bottom Left", "Bottom Center", "Top Left", "Top Center"],
        defaultValue: "bottom-left",
    },
    modalDescriptionFont: {
        type: ControlType.Font,
        title: "Modal Text",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
})