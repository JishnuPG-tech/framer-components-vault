// Card thumbnail with title that opens a fullscreen overlay slider with media, details, navigation arrows, progress dots, and close button
import { useState, useCallback, useEffect, startTransition, type CSSProperties } from "react"
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

interface SlideItem {
    media: { src: string; alt?: string }
    mediaType: "image" | "video"
    videoFile?: string
    title: string
    description: string
}

interface MediaSliderCardProps {
    thumbnailImage: { src: string; alt?: string }
    thumbnailTitle: string
    slides: SlideItem[]
    cardBackground: string
    textColor: string
    closeButtonColor: string
    arrowColor: string
    dotColor: string
    activeDotColor: string
    cardBorderRadius: number
    headingFont: any
    bodyFont: any
    autoplay: boolean
    autoplayInterval: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 */
export default function MediaSliderCard(props: MediaSliderCardProps) {
    const {
        thumbnailImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Thumbnail",
        },
        thumbnailTitle = "Essential",
        slides = [
            {
                media: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Slide 1",
                },
                mediaType: "image",
                title: "50 MP OIS Main Camera",
                description:
                    "50 MP OIS Main Camera 1/1.3'' sensor, 24 mm focal length, ƒ/1.68 aperture, advanced image processing",
            },
            {
                media: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Slide 2",
                },
                mediaType: "image",
                title: "50 MP Front Camera",
                description: "High-resolution front camera with advanced AI features for stunning selfies",
            },
            {
                media: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Slide 3",
                },
                mediaType: "image",
                title: "Video Recording Light",
                description: "Professional-grade video recording with enhanced lighting capabilities",
            },
        ],
        cardBackground = "rgba(255, 255, 255, 0.1)",
        textColor = "#FFFFFF",
        closeButtonColor = "#FFFFFF",
        arrowColor = "#FFFFFF",
        dotColor = "rgba(255, 255, 255, 0.3)",
        activeDotColor = "#FFFFFF",
        cardBorderRadius = 16,
        headingFont,
        bodyFont,
        autoplay = false,
        autoplayInterval = 3000,
    } = props

    const [isOpen, setIsOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isLeftSide, setIsLeftSide] = useState(false)
    const [direction, setDirection] = useState(1)
    const [isHovering, setIsHovering] = useState(false)

    const openOverlay = useCallback(() => {
        startTransition(() => {
            setIsOpen(true)
            setCurrentIndex(0)
        })
    }, [])

    const closeOverlay = useCallback(() => {
        startTransition(() => setIsOpen(false))
    }, [])

    const nextSlide = useCallback(() => {
        startTransition(() => {
            setDirection(1)
            setCurrentIndex((prev) => (prev + 1) % slides.length)
        })
    }, [slides.length])

    const prevSlide = useCallback(() => {
        startTransition(() => {
            setDirection(-1)
            setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
        })
    }, [slides.length])

    const goToSlide = useCallback((index: number) => {
        startTransition(() => {
            setDirection(index > currentIndex ? 1 : -1)
            setCurrentIndex(index)
        })
    }, [currentIndex])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeOverlay()
            if (e.key === "ArrowLeft") prevSlide()
            if (e.key === "ArrowRight") nextSlide()
        }

        const handleMouseMove = (e: MouseEvent) => {
            startTransition(() => {
                setMousePosition({ x: e.clientX, y: e.clientY })
                setIsLeftSide(e.clientX < window.innerWidth / 2)
            })
        }

        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown)
            window.addEventListener("mousemove", handleMouseMove)
            return () => {
                window.removeEventListener("keydown", handleKeyDown)
                window.removeEventListener("mousemove", handleMouseMove)
            }
        }
    }, [isOpen, closeOverlay, prevSlide, nextSlide])

    // Autoplay effect
    useEffect(() => {
        if (!isOpen || !autoplay) return

        const interval = setInterval(() => {
            nextSlide()
        }, autoplayInterval)

        return () => clearInterval(interval)
    }, [isOpen, autoplay, autoplayInterval, nextSlide])

    const currentSlide = slides[currentIndex] || slides[0]

    return (
        <>
            {/* Thumbnail Card */}
            <div
                onClick={openOverlay}
                onMouseEnter={() => startTransition(() => setIsHovering(true))}
                onMouseLeave={() => startTransition(() => setIsHovering(false))}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    transform: isHovering ? "scale(1.02)" : "scale(1)",
                    transition: "transform 0.3s ease",
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open ${thumbnailTitle} media slider`}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openOverlay()
                    }
                }}
            >
                <div
                    style={{
                        width: "100%",
                        flex: 1,
                        borderRadius: cardBorderRadius,
                        overflow: "hidden",
                        backgroundColor: "#F5F5F5",
                        position: "relative",
                        boxShadow: isHovering ? "0 8px 24px rgba(0, 0, 0, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
                        transition: "box-shadow 0.3s ease",
                    }}
                >
                    <img
                        src={thumbnailImage.src}
                        alt={thumbnailImage.alt || ""}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: isHovering ? "scale(1.05)" : "scale(1)",
                            transition: "transform 0.4s ease",
                        }}
                    />
                    {/* Hover Overlay */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.4)",
                            opacity: isHovering ? 1 : 0,
                            transition: "opacity 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                        }}
                    >
                        {/* Expand Icon */}
                        <div
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transform: isHovering ? "scale(1)" : "scale(0.8)",
                                transition: "transform 0.3s ease",
                            }}
                        >
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#000000"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 3 21 3 21 9" />
                                <polyline points="9 21 3 21 3 15" />
                                <line x1="21" y1="3" x2="14" y2="10" />
                                <line x1="3" y1="21" x2="10" y2="14" />
                            </svg>
                        </div>
                    </div>
                </div>
                <span
                    style={{
                        ...headingFont,
                        color: textColor,
                        textAlign: "center",
                    }}
                >
                    {thumbnailTitle}
                </span>
            </div>

            {/* Fullscreen Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="overlay-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100vw",
                                height: "100vh",
                                backgroundColor: "rgba(0, 0, 0, 0.95)",
                                zIndex: 9999,
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                                cursor: "none",
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`${thumbnailTitle} media slider`}
                        >
                            {/* Top Bar */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 24,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: "100%",
                                    maxWidth: 400,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "1rem 1rem 1rem 1.5rem",
                                    backgroundColor: cardBackground,
                                    backdropFilter: "blur(10px)",
                                    borderRadius: cardBorderRadius,
                                    zIndex: 20,
                                }}
                                className="top-card"
                            >
                                <span
                                    style={{
                                        ...headingFont,
                                        color: textColor,
                                        letterSpacing: "0.2em",
                                    }}
                                >
                                    {thumbnailTitle}
                                </span>
                                <button
                                    onClick={closeOverlay}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: closeButtonColor,
                                        fontSize: 24,
                                        cursor: "pointer",
                                        padding: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    aria-label="Close media slider"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Mobile Navigation Dots - Top */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 24,
                                    left: 24,
                                    transform: "none",
                                    display: "none",
                                    justifyContent: "center",
                                    gap: 12,
                                    zIndex: 20,
                                    padding: "12px 24px",
                                    backgroundColor: cardBackground,
                                    backdropFilter: "blur(10px)",
                                    borderRadius: cardBorderRadius,
                                }}
                                className="mobile-dots-top"
                                role="tablist"
                                aria-label="Slide navigation dots"
                            >
                                {slides.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            border: "none",
                                            backgroundColor: index === currentIndex ? activeDotColor : dotColor,
                                            cursor: "pointer",
                                            padding: 0,
                                            transition: "background-color 0.3s ease",
                                        }}
                                        role="tab"
                                        aria-label={`Go to slide ${index + 1} of ${slides.length}`}
                                        aria-selected={index === currentIndex}
                                        aria-current={index === currentIndex ? "true" : "false"}
                                    />
                                ))}
                            </div>

                            {/* Mobile Close Button - Top Left */}
                            <button
                                onClick={closeOverlay}
                                style={{
                                    position: "absolute",
                                    top: 24,
                                    right: 24,
                                    display: "none",
                                    background: cardBackground,
                                    backdropFilter: "blur(10px)",
                                    border: "none",
                                    color: closeButtonColor,
                                    fontSize: 20,
                                    cursor: "pointer",
                                    padding: 0,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: cardBorderRadius,
                                    zIndex: 20,
                                    width: 40,
                                    height: 40,
                                }}
                                className="mobile-close-button"
                                aria-label="Close media slider"
                            >
                                ✕
                            </button>

                            {/* Media Area */}
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    overflow: "hidden",
                                    cursor: "none",
                                }}
                                role="region"
                                aria-label="Media carousel"
                                aria-live="polite"
                            >
                                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                    <motion.div
                                        key={currentIndex}
                                        custom={direction}
                                        initial={{ x: direction > 0 ? "100%" : "-100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: direction > 0 ? "-100%" : "100%" }}
                                        transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
                                        style={{
                                            position: "absolute",
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {currentSlide.mediaType === "video" ? (
                                            <video
                                                src={currentSlide.videoFile || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                                aria-label={currentSlide.title}
                                            />
                                        ) : (
                                            <img
                                                src={currentSlide.media.src}
                                                alt={currentSlide.media.alt || currentSlide.title}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                {/* Navigation Arrows - Custom Cursor */}
                                <button
                                    onClick={isLeftSide ? prevSlide : nextSlide}
                                    style={{
                                        position: "absolute",
                                        left: mousePosition.x - 28,
                                        top: mousePosition.y - 28,
                                        background: "rgba(255, 255, 255, 0.1)",
                                        border: "1px solid rgba(255, 255, 255, 0.4)",
                                        color: arrowColor,
                                        fontSize: 32,
                                        cursor: "none",
                                        padding: "16px 20px",
                                        borderRadius: "50%",
                                        backdropFilter: "blur(10px)",
                                        pointerEvents: "none",
                                        zIndex: 10,
                                        width: 56,
                                        height: 56,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    className="custom-cursor"
                                    aria-hidden="true"
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={arrowColor}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            transform: isLeftSide ? "rotate(0deg)" : "rotate(180deg)",
                                        }}
                                    >
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>

                                {/* Invisible click areas */}
                                <div
                                    onClick={prevSlide}
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        width: "50%",
                                        height: "100%",
                                        cursor: "none",
                                    }}
                                    className="click-area"
                                    aria-label="Click to go to previous slide"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault()
                                            prevSlide()
                                        }
                                    }}
                                />
                                <div
                                    onClick={nextSlide}
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: 0,
                                        width: "50%",
                                        height: "100%",
                                        cursor: "none",
                                    }}
                                    className="click-area"
                                    aria-label="Click to go to next slide"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault()
                                            nextSlide()
                                        }
                                    }}
                                />

                                {/* Bottom Floating Card */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 40,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: "100%",
                                        maxWidth: 400,
                                        padding: "24px",
                                        backgroundColor: cardBackground,
                                        backdropFilter: "blur(10px)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 20,
                                        borderRadius: cardBorderRadius,
                                    }}
                                    className="bottom-card"
                                    role="region"
                                    aria-label="Slide details"
                                >
                                    <div style={{ textAlign: "left" }}>
                                        <h2
                                            style={{
                                                ...headingFont,
                                                color: textColor,
                                                margin: "0 0 1rem 0",
                                            }}
                                        >
                                            {currentSlide.title}
                                        </h2>
                                        <p
                                            style={{
                                                ...bodyFont,
                                                color: textColor,
                                                margin: 0,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {currentSlide.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Dots - Below Card */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 10,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: 12,
                                        zIndex: 10,
                                    }}
                                    className="desktop-dots"
                                    role="tablist"
                                    aria-label="Slide navigation dots"
                                >
                                    {slides.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToSlide(index)}
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                border: "none",
                                                backgroundColor: index === currentIndex ? activeDotColor : dotColor,
                                                cursor: "pointer",
                                                padding: 0,
                                                transition: "background-color 0.3s ease",
                                            }}
                                            role="tab"
                                            aria-label={`Go to slide ${index + 1} of ${slides.length}`}
                                            aria-selected={index === currentIndex}
                                            aria-current={index === currentIndex ? "true" : "false"}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                        <style>{`
                            @media (max-width: 768px) {
                                .top-card {
                                    display: none !important;
                                }
                                
                                .custom-cursor {
                                    display: none !important;
                                }
                                
                                .click-area {
                                    cursor: auto !important;
                                }
                                
                                .bottom-card {
                                    left: 0.5rem !important;
                                    right: 0.5rem !important;
                                    width: calc(100% - 1rem) !important;
                                    transform: none !important;
                                    bottom: 0.5rem !important;
                                }
                                
                                .mobile-dots-top {
                                    display: flex !important;
                                }
                                
                                .desktop-dots {
                                    display: none !important;
                                }
                                
                                .mobile-close-button {
                                    display: flex !important;
                                }
                            }
                        `}</style>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

addPropertyControls(MediaSliderCard, {
    thumbnailImage: {
        type: ControlType.ResponsiveImage,
        title: "Thumbnail Image",
    },
    thumbnailTitle: {
        type: ControlType.String,
        title: "Thumbnail Title",
        defaultValue: "Essential",
    },
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                media: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (props) => props.mediaType === "video",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.mediaType === "image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Slide Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Slide description text",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                media: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Slide 1",
                },
                mediaType: "image",
                title: "50 MP OIS Main Camera",
                description:
                    "50 MP OIS Main Camera 1/1.3'' sensor, 24 mm focal length, ƒ/1.68 aperture, advanced image processing",
            },
        ],
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Autoplay Interval",
        defaultValue: 3000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        hidden: (props) => !props.autoplay,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Cards BG",
        description: "Background color for the floating top and bottom cards in the overlay",
        defaultValue: "rgba(255, 255, 255, 0.4)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    closeButtonColor: {
        type: ControlType.Color,
        title: "Close Button",
        defaultValue: "#000000",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "rgba(255, 255, 255, 0.3)",
    },
    activeDotColor: {
        type: ControlType.Color,
        title: "Active Dot",
        defaultValue: "#FFFFFF",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})