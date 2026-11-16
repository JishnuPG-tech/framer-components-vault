// Premium horizontal coverflow component with realistic depth and perspective
import { useEffect, useState, useRef, useCallback, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion"

interface CardData {
    image: { src: string; alt?: string }
    badge: string
    title: string
    description: string
    buttonText: string
    buttonLink: string
}

interface CoverflowProps {
    cards: CardData[]
    cardWidth: number
    cardHeight: number
    perspectiveStrength: number
    rotationAngle: number
    scaleFactor: number
    gap: number
    borderRadius: number
    shadowIntensity: number
    backgroundColor: string
    cardColor: string
    titleColor: string
    descriptionColor: string
    badgeColor: string
    buttonColor: string
    buttonTextColor: string
    infiniteLoop: boolean
    autoPlay: boolean
    autoPlayInterval: number
    titleFont: CSSProperties
    descriptionFont: CSSProperties
    badgeFont: CSSProperties
    buttonFont: CSSProperties
    style?: CSSProperties
}

/**
 * Premium Horizontal Coverflow
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 */
export default function Coverflow(props: CoverflowProps) {
    const {
        cards = [],
        cardWidth,
        cardHeight,
        perspectiveStrength,
        rotationAngle,
        scaleFactor,
        gap,
        borderRadius,
        shadowIntensity,
        backgroundColor,
        cardColor,
        titleColor,
        descriptionColor,
        badgeColor,
        buttonColor,
        buttonTextColor,
        infiniteLoop,
        autoPlay,
        autoPlayInterval,
        titleFont,
        descriptionFont,
        badgeFont,
        buttonFont,
        style,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const dragX = useMotionValue(0)
    const autoPlayTimerRef = useRef<number | null>(null)

    // Responsive visible cards
    const [visibleCards, setVisibleCards] = useState(5)

    useEffect(() => {
        if (typeof window === "undefined") return

        const updateVisibleCards = () => {
            const width = window.innerWidth
            if (width < 768) {
                setVisibleCards(1)
            } else if (width < 1024) {
                setVisibleCards(3)
            } else {
                setVisibleCards(5)
            }
        }

        updateVisibleCards()
        window.addEventListener("resize", updateVisibleCards)
        return () => window.removeEventListener("resize", updateVisibleCards)
    }, [])

    // Responsive dimensions
    const [responsiveCardWidth, setResponsiveCardWidth] = useState(cardWidth)
    const [responsiveCardHeight, setResponsiveCardHeight] = useState(cardHeight)
    const [responsiveGap, setResponsiveGap] = useState(gap)
    const [responsivePadding, setResponsivePadding] = useState(24)

    useEffect(() => {
        if (typeof window === "undefined") return

        const updateResponsiveDimensions = () => {
            const width = window.innerWidth
            if (width < 768) {
                // Mobile: smaller cards with side preview
                startTransition(() => {
                    setResponsiveCardWidth(Math.min(cardWidth * 0.85, width - 80))
                    setResponsiveCardHeight(cardHeight * 0.8)
                    setResponsiveGap(gap * 0.3)
                    setResponsivePadding(16)
                })
            } else if (width < 1024) {
                // Tablet: medium cards
                startTransition(() => {
                    setResponsiveCardWidth(Math.min(cardWidth * 0.9, width / 2.5))
                    setResponsiveCardHeight(cardHeight * 0.9)
                    setResponsiveGap(gap * 0.5)
                    setResponsivePadding(20)
                })
            } else {
                // Desktop: full size
                startTransition(() => {
                    setResponsiveCardWidth(cardWidth)
                    setResponsiveCardHeight(cardHeight)
                    setResponsiveGap(gap)
                    setResponsivePadding(24)
                })
            }
        }

        updateResponsiveDimensions()
        window.addEventListener("resize", updateResponsiveDimensions)
        return () => window.removeEventListener("resize", updateResponsiveDimensions)
    }, [cardWidth, cardHeight, gap])

    // Spring animation for smooth transitions
    const springX = useSpring(dragX, {
        stiffness: 300,
        damping: 30,
        mass: 0.5,
    })

    const totalCards = cards.length

    const goToIndex = useCallback(
        (index: number) => {
            if (infiniteLoop) {
                const normalizedIndex = ((index % totalCards) + totalCards) % totalCards
                startTransition(() => setActiveIndex(normalizedIndex))
            } else {
                const clampedIndex = Math.max(0, Math.min(totalCards - 1, index))
                startTransition(() => setActiveIndex(clampedIndex))
            }
        },
        [infiniteLoop, totalCards]
    )

    const next = useCallback(() => {
        goToIndex(activeIndex + 1)
    }, [activeIndex, goToIndex])

    const prev = useCallback(() => {
        goToIndex(activeIndex - 1)
    }, [activeIndex, goToIndex])

    // Auto-play functionality
    useEffect(() => {
        if (!autoPlay || isDragging) return

        autoPlayTimerRef.current = window.setInterval(() => {
            next()
        }, autoPlayInterval * 1000)

        return () => {
            if (autoPlayTimerRef.current) {
                clearInterval(autoPlayTimerRef.current)
            }
        }
    }, [autoPlay, autoPlayInterval, next, isDragging])

    // Keyboard navigation
    useEffect(() => {
        if (typeof window === "undefined") return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                prev()
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                next()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [next, prev])

    // Wheel navigation
    const handleWheel = useCallback(
        (e: WheelEvent) => {
            e.preventDefault()
            if (Math.abs(e.deltaY) > 10) {
                if (e.deltaY > 0) {
                    next()
                } else {
                    prev()
                }
            }
        },
        [next, prev]
    )

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener("wheel", handleWheel, { passive: false })
        return () => container.removeEventListener("wheel", handleWheel)
    }, [handleWheel])

    // Calculate card transform based on position
    const getCardTransform = useCallback(
        (index: number) => {
            const diff = index - activeIndex
            const absDiff = Math.abs(diff)

            // Position - use responsive card width and gap
            const translateX = diff * (responsiveCardWidth + responsiveGap)

            // Rotation - reduce on mobile
            const rotateY = diff > 0 ? -rotationAngle : diff < 0 ? rotationAngle : 0

            // Scale - adjust based on visible cards
            const scaleFactor = visibleCards === 1 ? 0.25 : visibleCards === 3 ? 0.2 : 0.15
            const scale = diff === 0 ? 1 : Math.max(1 - absDiff * scaleFactor, 0.4)

            // Z-index
            const zIndex = totalCards - absDiff

            // Opacity - more visible on mobile for side preview
            const minOpacity = visibleCards === 1 ? 0.5 : 0.3
            const opacity = diff === 0 ? 1 : Math.max(1 - absDiff * 0.3, minOpacity)

            return {
                translateX,
                rotateY,
                scale,
                zIndex,
                opacity,
            }
        },
        [activeIndex, responsiveCardWidth, responsiveGap, rotationAngle, totalCards, visibleCards]
    )

    // Handle drag
    const handleDragEnd = useCallback(
        (event: any, info: any) => {
            startTransition(() => setIsDragging(false))
            const threshold = 50
            if (info.offset.x > threshold) {
                prev()
            } else if (info.offset.x < -threshold) {
                next()
            }
            dragX.set(0)
        },
        [next, prev, dragX]
    )

    const handleCardClick = useCallback(
        (index: number) => {
            if (index !== activeIndex) {
                goToIndex(index)
            }
        },
        [activeIndex, goToIndex]
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: `${perspectiveStrength}px`,
            }}
            tabIndex={0}
            role="region"
            aria-label="Coverflow carousel"
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <AnimatePresence initial={false}>
                    {cards.map((card, index) => {
                        const transform = getCardTransform(index)
                        const isActive = index === activeIndex
                        
                        // Provide default image if not set
                        const cardImage = card.image || {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: "Default image"
                        }

                        return (
                            <motion.div
                                key={index}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragStart={() => startTransition(() => setIsDragging(true))}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleCardClick(index)}
                                animate={{
                                    x: transform.translateX,
                                    rotateY: transform.rotateY,
                                    scale: transform.scale,
                                    opacity: transform.opacity,
                                    zIndex: transform.zIndex,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                    mass: 0.5,
                                }}
                                style={{
                                    position: "absolute",
                                    width: responsiveCardWidth,
                                    height: responsiveCardHeight,
                                    cursor: isActive ? "default" : "pointer",
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: cardColor,
                                        borderRadius,
                                        boxShadow: `0 ${shadowIntensity}px ${shadowIntensity * 2}px rgba(0,0,0,${
                                            shadowIntensity / 100
                                        })`,
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                        pointerEvents: isActive ? "auto" : "none",
                                    }}
                                >
                                    {/* Image */}
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "60%",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <img
                                            src={cardImage.src}
                                            alt={cardImage.alt || card.title}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                        {/* Badge */}
                                        {card.badge && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 16,
                                                    left: 16,
                                                    backgroundColor: badgeColor,
                                                    color: "#FFFFFF",
                                                    padding: "6px 12px",
                                                    borderRadius: 20,
                                                    ...badgeFont,
                                                }}
                                            >
                                                {card.badge}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div
                                        style={{
                                            flex: 1,
                                            padding: responsivePadding,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: visibleCards === 1 ? 8 : 12,
                                        }}
                                    >
                                        {/* Title */}
                                        <h3
                                            style={{
                                                margin: 0,
                                                color: titleColor,
                                                ...titleFont,
                                            }}
                                        >
                                            {card.title}
                                        </h3>

                                        {/* Description */}
                                        <p
                                            style={{
                                                margin: 0,
                                                color: descriptionColor,
                                                flex: 1,
                                                ...descriptionFont,
                                            }}
                                        >
                                            {card.description}
                                        </p>

                                        {/* CTA Button */}
                                        {card.buttonText && (
                                            <a
                                                href={card.buttonLink || "#"}
                                                style={{
                                                    display: "inline-block",
                                                    backgroundColor: buttonColor,
                                                    color: buttonTextColor,
                                                    padding: "12px 24px",
                                                    borderRadius: 8,
                                                    textDecoration: "none",
                                                    textAlign: "center",
                                                    cursor: "pointer",
                                                    border: "none",
                                                    ...buttonFont,
                                                }}
                                                onClick={(e) => {
                                                    if (!card.buttonLink || card.buttonLink === "#") {
                                                        e.preventDefault()
                                                    }
                                                }}
                                            >
                                                {card.buttonText}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prev}
                disabled={!infiniteLoop && activeIndex === 0}
                style={{
                    position: "absolute",
                    left: 20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    opacity: !infiniteLoop && activeIndex === 0 ? 0.3 : 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                aria-label="Previous card"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <button
                onClick={next}
                disabled={!infiniteLoop && activeIndex === totalCards - 1}
                style={{
                    position: "absolute",
                    right: 20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    opacity: !infiniteLoop && activeIndex === totalCards - 1 ? 0.3 : 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                aria-label="Next card"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Indicators */}
            <div
                style={{
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 8,
                    zIndex: 1000,
                }}
            >
                {cards.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToIndex(index)}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: index === activeIndex ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                            cursor: "pointer",
                            padding: 0,
                            transition: "all 0.3s ease",
                        }}
                        aria-label={`Go to card ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}

addPropertyControls(Coverflow, {
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
                badge: {
                    type: ControlType.String,
                    title: "Badge",
                    defaultValue: "New",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Card description goes here",
                    displayTextArea: true,
                },
                buttonText: {
                    type: ControlType.String,
                    title: "Button Text",
                    defaultValue: "Learn More",
                },
                buttonLink: {
                    type: ControlType.Link,
                    title: "Button Link",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Card 1",
                },
                badge: "Featured",
                title: "Premium Design",
                description: "Experience the future of web design with our cutting-edge components.",
                buttonText: "Explore",
                buttonLink: "#",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Card 2",
                },
                badge: "New",
                title: "Modern Interface",
                description: "Beautiful and intuitive interfaces that users love to interact with.",
                buttonText: "View More",
                buttonLink: "#",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Card 3",
                },
                badge: "Popular",
                title: "Smooth Animations",
                description: "Fluid animations that bring your designs to life with spring physics.",
                buttonText: "Discover",
                buttonLink: "#",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Card 4",
                },
                badge: "Trending",
                title: "Responsive Layout",
                description: "Perfectly adapts to any screen size from mobile to desktop.",
                buttonText: "Learn More",
                buttonLink: "#",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Card 5",
                },
                badge: "Hot",
                title: "Interactive Cards",
                description: "Engage your users with interactive 3D card experiences.",
                buttonText: "Get Started",
                buttonLink: "#",
            },
        ],
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 350,
        min: 200,
        max: 600,
        step: 10,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 500,
        min: 300,
        max: 800,
        step: 10,
        unit: "px",
    },
    perspectiveStrength: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1500,
        min: 500,
        max: 3000,
        step: 100,
        unit: "px",
    },
    rotationAngle: {
        type: ControlType.Number,
        title: "Rotation Angle",
        defaultValue: 35,
        min: 0,
        max: 90,
        step: 5,
        unit: "deg",
    },
    scaleFactor: {
        type: ControlType.Number,
        title: "Scale Factor",
        defaultValue: 0.15,
        min: 0,
        max: 0.5,
        step: 0.05,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 60,
        min: 0,
        max: 200,
        step: 10,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 2,
        unit: "px",
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Intensity",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 5,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card Color",
        defaultValue: "#FFFFFF",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description Color",
        defaultValue: "#CCCCCC",
    },
    badgeColor: {
        type: ControlType.Color,
        title: "Badge Color",
        defaultValue: "#000000",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#000000",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#FFFFFF",
    },
    infiniteLoop: {
        type: ControlType.Boolean,
        title: "Infinite Loop",
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
        title: "Auto Play Interval",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    badgeFont: {
        type: ControlType.Font,
        title: "Badge Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
