// 3D vertical card stack for images and videos with drag, scroll and dot navigation. Spring animations, four card shapes, ambient glow, text overlays and clickable links. Autoplay with video auto-advance. Full color and shape controls. No dependencies.
import { useEffect, useRef, useState, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, PanInfo } from "framer-motion"

interface CardData {
    mediaType: "image" | "video"
    image: { src: string; alt?: string }
    video: string
    title: string
    description: string
    link: string
}

interface CardStack3DProps {
    cards: CardData[]
    showContent: "hide" | "always" | "hover"
    cardTextColor: string
    background: string
    cardBackground: string
    foreground: string
    mutedColor: string
    borderColor: string
    cardShape: "rounded" | "circle" | "squircle" | "hexagon"
    borderRadius: number
    cardWidth: number
    cardHeight: number
    showDots: boolean
    showCounter: boolean
    showInstructions: boolean
    autoplay: boolean
    autoplayInterval: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CardStack3D(props: CardStack3DProps) {
    const {
        cards = [],
        showContent = "hover",
        cardTextColor = "#FFFFFF",
        background = "#000000",
        cardBackground = "#FFFFFF",
        foreground = "#FFFFFF",
        mutedColor = "#CCCCCC",
        borderColor = "#EEEEEE",
        cardShape = "rounded",
        borderRadius = 24,
        cardWidth = 500,
        cardHeight = 600,
        showDots = true,
        showCounter = true,
        showInstructions = true,
        autoplay = true,
        autoplayInterval = 3000,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
    const autoplayTimerRef = useRef<number | null>(null)
    const dragY = useMotionValue(0)
    const springY = useSpring(dragY, { stiffness: 300, damping: 30 })
    const isStatic = RenderTarget.current() === RenderTarget.canvas

    const totalCards = Math.min(cards.length, 10)

    // Handle video playback
    useEffect(() => {
        if (isStatic) return

        videoRefs.current.forEach((video, index) => {
            if (!video) return

            if (index === activeIndex) {
                video.currentTime = 0
                video.play().catch(() => {})
            } else {
                video.pause()
                video.currentTime = 0
            }
        })
    }, [activeIndex, isStatic])

    // Handle video end event
    const handleVideoEnd = useCallback(() => {
        if (activeIndex < totalCards - 1) {
            startTransition(() => setActiveIndex((prev) => prev + 1))
        }
    }, [activeIndex, totalCards])

    // Autoplay
    useEffect(() => {
        if (isStatic || !autoplay || totalCards <= 1) return

        autoplayTimerRef.current = window.setInterval(() => {
            startTransition(() => {
                setActiveIndex((prev) => (prev + 1) % totalCards)
            })
        }, autoplayInterval)

        return () => {
            if (autoplayTimerRef.current) {
                clearInterval(autoplayTimerRef.current)
            }
        }
    }, [autoplay, autoplayInterval, totalCards, isStatic])

    // Drag handlers
    const handleDragEnd = useCallback(
        (_: any, info: PanInfo) => {
            const threshold = 50
            if (info.offset.y < -threshold && activeIndex < totalCards - 1) {
                startTransition(() => setActiveIndex((prev) => prev + 1))
            } else if (info.offset.y > threshold && activeIndex > 0) {
                startTransition(() => setActiveIndex((prev) => prev - 1))
            }
            dragY.set(0)
        },
        [activeIndex, totalCards, dragY]
    )

    // Wheel handler
    useEffect(() => {
        if (isStatic) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            if (Math.abs(e.deltaY) > 10) {
                if (e.deltaY > 0 && activeIndex < totalCards - 1) {
                    startTransition(() => setActiveIndex((prev) => prev + 1))
                } else if (e.deltaY < 0 && activeIndex > 0) {
                    startTransition(() => setActiveIndex((prev) => prev - 1))
                }
            }
        }

        window.addEventListener("wheel", handleWheel, { passive: false })
        return () => window.removeEventListener("wheel", handleWheel)
    }, [activeIndex, totalCards, isStatic])

    const getCardStyle = (index: number) => {
        const diff = index - activeIndex
        const absDiff = Math.abs(diff)

        let scale = 1
        let offsetY = 0
        let opacity = 1
        let rotateX = 0
        let zIndex = 100
        let blur = 0

        if (absDiff === 0) {
            scale = 1
            offsetY = 0
            opacity = 1
            rotateX = 0
            zIndex = 100
            blur = 0
        } else if (absDiff === 1) {
            scale = 0.82
            offsetY = diff > 0 ? 160 : -160
            opacity = 0.6
            rotateX = diff > 0 ? -8 : 8
            zIndex = 90
            blur = 2
        } else if (absDiff === 2) {
            scale = 0.7
            offsetY = diff > 0 ? 280 : -280
            opacity = 0.3
            rotateX = diff > 0 ? -12 : 12
            zIndex = 80
            blur = 4
        } else {
            scale = 0.6
            offsetY = diff > 0 ? 400 : -400
            opacity = 0
            rotateX = diff > 0 ? -15 : 15
            zIndex = 70
            blur = 6
        }

        return {
            scale,
            y: offsetY,
            opacity,
            rotateX,
            zIndex,
            filter: `blur(${blur}px)`,
        }
    }

    const getShapeStyles = (): CSSProperties => {
        switch (cardShape) {
            case "circle":
                return { borderRadius: "50%" }
            case "squircle":
                return {
                    borderRadius: `${borderRadius}px`,
                    clipPath:
                        "path('M 0,50 C 0,20 20,0 50,0 L 150,0 C 180,0 200,20 200,50 L 200,150 C 200,180 180,200 150,200 L 50,200 C 20,200 0,180 0,150 Z')",
                }
            case "hexagon":
                return {
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }
            default:
                return { borderRadius: `${borderRadius}px` }
        }
    }

    const handleCardClick = (link: string) => {
        if (link && typeof window !== "undefined") {
            window.open(link, "_blank")
        }
    }

    const shouldShowContent = (index: number) => {
        if (showContent === "always") return true
        if (showContent === "hover" && hoveredCard === index) return true
        return false
    }

    if (totalCards === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background,
                    color: mutedColor,
                }}
            >
                Add cards to get started
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background,
                position: "relative",
                overflow: "hidden",
                perspective: "1200px",
            }}
        >
            {/* Ambient glow */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "60%",
                    height: "60%",
                    background: `radial-gradient(circle, ${foreground}20 0%, transparent 70%)`,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    filter: "blur(80px)",
                }}
            />

            {/* Card stack */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: `min(${cardWidth}px, 80%)`,
                    height: `min(${cardHeight}px, 70%)`,
                }}
            >
                {cards.slice(0, 10).map((card, index) => {
                    const cardStyle = getCardStyle(index)
                    const isActive = index === activeIndex
                    
                    // Set default video URL if not provided
                    const videoUrl = card.video || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"

                    return (
                        <motion.div
                            key={index}
                            drag={isActive && !isStatic ? "y" : false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.1}
                            onDragEnd={handleDragEnd}
                            animate={cardStyle}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            whileHover={
                                isActive
                                    ? {
                                          scale: 1.02,
                                          transition: { duration: 0.3, ease: "easeOut" },
                                      }
                                    : {}
                            }
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                cursor: card.link ? "pointer" : isActive ? "grab" : "default",
                                transformStyle: "preserve-3d",
                            }}
                            onMouseEnter={() => startTransition(() => setHoveredCard(index))}
                            onMouseLeave={() => startTransition(() => setHoveredCard(null))}
                            onClick={() => card.link && handleCardClick(card.link)}
                        >
                            <motion.div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    background: cardBackground,
                                    border: `1px solid ${borderColor}`,
                                    position: "relative",
                                    overflow: "hidden",
                                    boxShadow:
                                        isActive && hoveredCard === index
                                            ? `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px ${borderColor}`
                                            : isActive
                                            ? `0 10px 40px rgba(0,0,0,0.2)`
                                            : "0 4px 20px rgba(0,0,0,0.1)",
                                    transition: "box-shadow 0.3s ease",
                                    ...getShapeStyles(),
                                }}
                            >
                                {/* Media */}
                                {card.mediaType === "image" ? (
                                    card.image && card.image.src ? (
                                        <img
                                            src={card.image.src}
                                            alt={card.image.alt || ""}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : null
                                ) : (
                                    <video
                                        ref={(el) => {
                                            videoRefs.current[index] = el
                                        }}
                                        src={videoUrl}
                                        onEnded={handleVideoEnd}
                                        loop={false}
                                        muted
                                        playsInline
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}

                                {/* Text overlay */}
                                {shouldShowContent(index) && (card.title || card.description) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: "24px",
                                            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                                            backdropFilter: "blur(10px)",
                                            color: cardTextColor,
                                        }}
                                    >
                                        {card.title && (
                                            <motion.h3
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                                style={{
                                                    margin: 0,
                                                    fontSize: "24px",
                                                    fontWeight: 600,
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                {card.title}
                                            </motion.h3>
                                        )}
                                        {card.description && (
                                            <motion.p
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                                style={{
                                                    margin: 0,
                                                    fontSize: "14px",
                                                    opacity: 0.9,
                                                }}
                                            >
                                                {card.description}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Counter */}
            {showCounter && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        top: "40px",
                        left: "40px",
                        fontSize: "48px",
                        fontWeight: 700,
                        color: foreground,
                        fontVariantNumeric: "tabular-nums",
                        textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    }}
                >
                    {String(activeIndex + 1).padStart(2, "0")}
                    <div style={{ fontSize: "16px", color: mutedColor, marginTop: "4px" }}>
                        {String(totalCards).padStart(2, "0")}
                    </div>
                </motion.div>
            )}

            {/* Instructions */}
            {showInstructions && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        top: "40px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                        background: `${foreground}10`,
                        backdropFilter: "blur(10px)",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        border: `1px solid ${borderColor}`,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                >
                    <span style={{ fontSize: "20px" }}>▶</span>
                    <span style={{ fontSize: "12px", color: mutedColor }}>Drag or scroll</span>
                    <span style={{ fontSize: "20px" }}>✕</span>
                </motion.div>
            )}

            {/* Navigation dots */}
            {showDots && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        right: "40px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        background: `${foreground}08`,
                        backdropFilter: "blur(10px)",
                        padding: "12px 8px",
                        borderRadius: "24px",
                        border: `1px solid ${borderColor}20`,
                    }}
                >
                    {cards.slice(0, 10).map((_, index) => (
                        <motion.button
                            key={index}
                            onClick={() => !isStatic && startTransition(() => setActiveIndex(index))}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                width: index === activeIndex ? "12px" : "8px",
                                height: index === activeIndex ? "12px" : "8px",
                                borderRadius: "50%",
                                background: index === activeIndex ? foreground : mutedColor,
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                opacity: index === activeIndex ? 1 : 0.5,
                                boxShadow:
                                    index === activeIndex
                                        ? `0 0 10px ${foreground}80`
                                        : "none",
                            }}
                            aria-label={`Go to card ${index + 1}`}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    )
}

addPropertyControls(CardStack3D, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: ({ mediaType }) => mediaType === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: ({ mediaType }) => mediaType === "image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Card description text",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            {
                mediaType: "image",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Card 1",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "First Card",
                description: "Beautiful gradient background",
                link: "",
            },
            {
                mediaType: "image",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Card 2",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Second Card",
                description: "Stunning purple tones",
                link: "",
            },
            {
                mediaType: "image",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Card 3",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Third Card",
                description: "Vibrant orange energy",
                link: "",
            },
            {
                mediaType: "image",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Card 4",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Fourth Card",
                description: "Warm yellow glow",
                link: "",
            },
            {
                mediaType: "image",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Card 5",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Fifth Card",
                description: "Fresh green nature",
                link: "",
            },
        ],
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 500,
        min: 200,
        max: 1000,
        step: 10,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 600,
        min: 200,
        max: 1200,
        step: 10,
        unit: "px",
    },
    showContent: {
        type: ControlType.Enum,
        title: "Show Card Content",
        options: ["hide", "always", "hover"],
        optionTitles: ["Hide", "Always", "On Hover"],
        defaultValue: "hover",
    },
    cardTextColor: {
        type: ControlType.Color,
        title: "Card Text Color",
        defaultValue: "#FFFFFF",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    foreground: {
        type: ControlType.Color,
        title: "Foreground",
        defaultValue: "#FFFFFF",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Color",
        defaultValue: "#CCCCCC",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#EEEEEE",
    },
    cardShape: {
        type: ControlType.Enum,
        title: "Card Shape",
        options: ["rounded", "circle", "squircle", "hexagon"],
        optionTitles: ["Rounded", "Circle", "Squircle", "Hexagon"],
        defaultValue: "rounded",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 24,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ cardShape }) => cardShape === "circle" || cardShape === "hexagon",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Show Counter",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showInstructions: {
        type: ControlType.Boolean,
        title: "Show Instructions",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Autoplay Interval",
        defaultValue: 3000,
        min: 1000,
        max: 10000,
        step: 100,
        unit: "ms",
        hidden: ({ autoplay }) => !autoplay,
    },
})
