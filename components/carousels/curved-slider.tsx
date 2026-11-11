// Curved slider component with tilted cards and arrow navigation buttons
// Cards are displayed in a curved/tilted layout with smooth transitions
// Navigation arrows allow cycling through the cards

import { useState, startTransition, type CSSProperties, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, type TargetAndTransition } from "framer-motion"

interface Card {
    image: {
        src: string
        alt: string
    }
    title: string
}

interface CurvedSliderProps {
    cards: Card[]
    backgroundColor: string
    arrowColor: string
    cardBorderRadius: number
    autoPlay: boolean
    autoPlayInterval: number
    imageAspectRatio: "cover" | "contain"
    mobileMarqueeSpeed: number
    enableKeyboardNavigation: boolean
    titleFont: any
    titleColor: string
    showTitles: boolean
    style?: CSSProperties
}

/**
 * Curved Slider Component
 * 
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function CurvedSlider(props: CurvedSliderProps) {
    const {
        cards = [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Card 1"
                },
                title: "ROAD TO",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Card 2"
                },
                title: "IN HIS",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Card 3"
                },
                title: "JOURNEY",
            }
        ],
        backgroundColor = "#000000",
        arrowColor = "#FFFFFF",
        cardBorderRadius = 8,
        autoPlay = false,
        autoPlayInterval = 3000,
        imageAspectRatio = "cover",
        mobileMarqueeSpeed = 1,
        enableKeyboardNavigation = true,
        titleFont = {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        titleColor = "#FFFFFF",
        showTitles = true
    } = props

    const [currentIndex, setCurrentIndex] = useState(1)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile viewport
    useEffect(() => {
        if (typeof window === "undefined") return
        
        const checkMobile = () => {
            startTransition(() => {
                setIsMobile(window.innerWidth < 768)
            })
        }
        
        checkMobile()
        window.addEventListener("resize", checkMobile)
        
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const handlePrevious = () => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1))
        })
    }

    const handleNext = () => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1))
        })
    }

    // Auto-play functionality
    useEffect(() => {
        if (typeof window === "undefined" || !autoPlay) return
        
        const timer = setTimeout(() => {
            handleNext()
        }, autoPlayInterval)
        
        return () => clearTimeout(timer)
    }, [autoPlay, autoPlayInterval, currentIndex])

    // Keyboard navigation
    useEffect(() => {
        if (typeof window === "undefined" || !enableKeyboardNavigation || isMobile) return
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft") {
                handlePrevious()
            } else if (event.key === "ArrowRight") {
                handleNext()
            }
        }
        
        window.addEventListener("keydown", handleKeyDown)
        
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [enableKeyboardNavigation, currentIndex, isMobile])

    const getCardStyle = (index: number): TargetAndTransition => {
        const diff = index - currentIndex
        const isCenter = diff === 0
        const isLeft = diff === -1 || (currentIndex === 0 && index === cards.length - 1)
        const isRight = diff === 1 || (currentIndex === cards.length - 1 && index === 0)

        if (isCenter) {
            return {
                transform: "translateX(0%) scale(1) rotateZ(0deg)",
                zIndex: 3,
                opacity: 1,
            }
        } else if (isLeft) {
            return {
                transform: "translateX(-110%) scale(0.75) rotateZ(-12deg)",
                zIndex: 2,
                opacity: 0.7,
            }
        } else if (isRight) {
            return {
                transform: "translateX(110%) scale(0.75) rotateZ(12deg)",
                zIndex: 2,
                opacity: 0.7,
            }
        } else {
            return {
                transform: "translateX(0%) scale(0.5)",
                zIndex: 1,
                opacity: 0,
            }
        }
    }

    // Create extended array for infinite loop on mobile
    const extendedCards = isMobile ? [...cards, ...cards, ...cards] : cards

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                ...props.style,
            }}
        >
            {/* Left Arrow */}
            <button
                onClick={handlePrevious}
                style={{
                    position: "absolute",
                    left: "5%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: isMobile ? "none" : "block",
                }}
                aria-label="Previous slide"
            >
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>

            {/* Cards Container */}
            {isMobile ? (
                <div
                    style={{
                        width: "100%",
                        height: "70%",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    <motion.div
                        animate={{
                            x: [0, -(cards.length * (typeof window !== "undefined" ? window.innerWidth * 0.8 + 20 : 0))]
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: (cards.length * 3) / mobileMarqueeSpeed,
                                ease: "linear"
                            }
                        }}
                        style={{
                            display: "flex",
                            gap: "20px",
                            paddingLeft: "10%",
                            paddingRight: "10%",
                            height: "100%",
                            alignItems: "center",
                        }}
                    >
                        {extendedCards.map((card, index) => {
                            const cardImage = card.image || { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Default" }
                            return (
                                <div
                                    key={index}
                                    style={{
                                        minWidth: "80%",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            borderRadius: cardBorderRadius,
                                            overflow: "hidden",
                                            position: "relative",
                                        }}
                                    >
                                        <img
                                            src={cardImage.src}
                                            alt={cardImage.alt || "Card image"}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: imageAspectRatio,
                                                pointerEvents: "none",
                                                display: "block",
                                                borderRadius: "inherit",
                                            }}
                                        />
                                    </div>
                                    {showTitles && (
                                        <div
                                            style={{
                                                color: titleColor,
                                                textAlign: "center",
                                                pointerEvents: "none",
                                                width: "100%",
                                                ...titleFont,
                                            }}
                                        >
                                            {card.title}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </motion.div>
                </div>
            ) : (
                <div
                    style={{
                        position: "relative",
                        width: "50%",
                        height: "70%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <AnimatePresence initial={false}>
                        {cards.map((card, index) => {
                            const cardStyle = getCardStyle(index)
                            const isVisible = Math.abs(index - currentIndex) <= 1 || 
                                            (currentIndex === 0 && index === cards.length - 1) ||
                                            (currentIndex === cards.length - 1 && index === 0)

                            if (!isVisible) return null

                            const cardImage = card.image || { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Default" }

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    animate={cardStyle}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.32, 0.72, 0, 1],
                                    }}
                                    style={{
                                        position: "absolute",
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            borderRadius: cardBorderRadius,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <img
                                            src={cardImage.src}
                                            alt={cardImage.alt || "Card image"}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: imageAspectRatio,
                                                display: "block",
                                                borderRadius: "inherit",
                                            }}
                                        />
                                    </div>
                                    {showTitles && (
                                        <div
                                            style={{
                                                color: titleColor,
                                                textAlign: "center",
                                                pointerEvents: "none",
                                                width: "100%",
                                                ...titleFont,
                                            }}
                                        >
                                            {card.title}
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Right Arrow */}
            <button
                onClick={handleNext}
                style={{
                    position: "absolute",
                    right: "5%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: isMobile ? "none" : "block",
                }}
                aria-label="Next slide"
            >
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </div>
    )
}

addPropertyControls(CurvedSlider, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Card 1"
                },
                title: "ROAD TO"
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Card 2"
                },
                title: "IN HIS"
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Card 3"
                },
                title: "JOURNEY"
            }
        ],
    },
    imageAspectRatio: {
        type: ControlType.Enum,
        title: "Image Fit",
        description: "Uniform fills the card, Default maintains original aspect ratio",
        options: ["cover", "contain"],
        optionTitles: ["Uniform", "Default"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    enableKeyboardNavigation: {
        type: ControlType.Boolean,
        title: "Keyboard Nav",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: false,
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
    mobileMarqueeSpeed: {
        type: ControlType.Number,
        title: "Mobile Speed",
        description: "Controls the speed of the marquee animation on mobile devices",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    showTitles: {
        type: ControlType.Boolean,
        title: "Show Titles",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
})