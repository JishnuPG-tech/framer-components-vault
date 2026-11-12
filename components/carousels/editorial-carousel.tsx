// Create a responsive, full-width double slider component with synchronized navigation.
import {
    useState,
    useEffect,
    useCallback,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
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

interface CustomCursorProps {
    mousePosition: { x: number; y: number }
    isHovering: boolean
    isHoveringClickable: boolean
    showCustomCursor: boolean
}

function CustomCursor({
    mousePosition,
    isHovering,
    isHoveringClickable,
    showCustomCursor,
}: CustomCursorProps) {
    if (!showCustomCursor) return null

    return (
        <motion.div
            animate={{
                x: mousePosition.x - 16,
                y: mousePosition.y - 16,
                opacity: isHovering ? 1 : 0,
            }}
            transition={{
                type: "spring",
                damping: 30,
                stiffness: 400,
                mass: 0.5,
            }}
            style={{
                position: "absolute",
                width: "32px",
                height: "32px",
                pointerEvents: "none",
                zIndex: 10000,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
            }}
        >
            {/* Top-left corner */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "8px",
                    height: "1px",
                    backgroundColor: "#FFFFFF",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "1px",
                    height: "8px",
                    backgroundColor: "#FFFFFF",
                }}
            />

            {/* Top-right corner */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "8px",
                    height: "1px",
                    backgroundColor: "#FFFFFF",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "1px",
                    height: "8px",
                    backgroundColor: "#FFFFFF",
                }}
            />

            {/* Bottom-left corner */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "8px",
                    height: "1px",
                    backgroundColor: "#FFFFFF",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "1px",
                    height: "8px",
                    backgroundColor: "#FFFFFF",
                }}
            />

            {/* Bottom-right corner */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "8px",
                    height: "1px",
                    backgroundColor: "#FFFFFF",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "1px",
                    height: "8px",
                    backgroundColor: "#FFFFFF",
                }}
            />

            {/* Plus symbol when hovering clickable elements */}
            {isHoveringClickable && (
                <>
                    {/* Horizontal line */}
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "12px",
                            height: "1px",
                            backgroundColor: "#FFFFFF",
                        }}
                    />
                    {/* Vertical line */}
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "1px",
                            height: "12px",
                            backgroundColor: "#FFFFFF",
                        }}
                    />
                </>
            )}
        </motion.div>
    )
}

interface Slide {
    title: string
    description: string
    image: {
        src: string
        alt: string
    }
    gpsCoordinates?: string
    metadata?: string
}

interface EditorialCarouselProps {
    slides: Slide[]
    autoplay: boolean
    autoplayInterval: number
    transitionDuration: number
    showTitle: boolean
    showDescription: boolean
    titleFont: CSSProperties
    descriptionFont: CSSProperties
    titleColor: string
    sideTitleColor: string
    descriptionColor: string
    buttonColor: string
    thumbnailBorderRadius: number
    showThumbnails: boolean
    showGPS: boolean
    showMetadata: boolean
    settingsColor: string
    showSideTitle: boolean
    showCustomCursor: boolean
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 645
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function EditorialCarousel(props: EditorialCarouselProps) {
    const {
        slides: rawSlides = [
            {
                title: "Edition No.1",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Italy",
                },
                gpsCoordinates: "41.9028° N, 12.4964° E",
                metadata: "35mm / f1.4 / ISO 200",
            },
            {
                title: "Edition No.2",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Japan",
                },
                gpsCoordinates: "35.6762° N, 139.6503° E",
                metadata: "35mm / f1.4 / ISO 200",
            },
            {
                title: "Edition No.3",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Iceland",
                },
                gpsCoordinates: "64.1466° N, 21.9426° W",
                metadata: "35mm / f1.4 / ISO 200",
            },
            {
                title: "Edition No.4",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Morocco",
                },
                gpsCoordinates: "31.7917° N, 7.0926° W",
                metadata: "35mm / f1.4 / ISO 200",
            },
            {
                title: "Edition No.5",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Peru",
                },
                gpsCoordinates: "13.1631° S, 72.5450° W",
                metadata: "35mm / f1.4 / ISO 200",
            },
        ],
        autoplay = true,
        autoplayInterval = 6000,
        transitionDuration = 700,
        showTitle = true,
        showDescription = true,
        titleFont,
        descriptionFont,
        titleColor = "#FFFFFF",
        sideTitleColor = "#FFFFFF",
        descriptionColor = "#FFFFFF",
        buttonColor = "#FFFFFF",
        thumbnailBorderRadius = 18,
        showThumbnails = true,
        showGPS = true,
        showMetadata = true,
        settingsColor = "#FFFFFF",
        showSideTitle = true,
        showCustomCursor = true,
    } = props

    // Ensure all slides have valid image objects with default values
    const slides = rawSlides.map((slide, index) => ({
        ...slide,
        image: slide.image || {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: slide.title || `Slide ${index + 1}`,
        },
    }))

    const [activeIndex, setActiveIndex] = useState(0)
    const [direction, setDirection] = useState(0)
    const thumbnailContainerRef = useRef<HTMLDivElement>(null)
    const autoplayTimerRef = useRef<number | null>(null)

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const [isHoveringClickable, setIsHoveringClickable] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const THUMB_WIDTH = 200
    const THUMB_GAP = 20
    const VISIBLE_THUMBS = 4

    // Calculate how many thumbnails to show based on total slides
    const getVisibleThumbnailCount = () => {
        if (slides.length === 2) return 1
        if (slides.length === 3) return 2
        if (slides.length === 4) return 3
        return 4 // 5 or more items
    }

    const visibleThumbnailCount = getVisibleThumbnailCount()

    const thumbnailContainerWidth =
        THUMB_WIDTH * visibleThumbnailCount + THUMB_GAP * (visibleThumbnailCount - 1)

    const goToSlide = useCallback(
        (index: number) => {
            if (index === activeIndex) return
            setDirection(index > activeIndex ? 1 : -1)
            startTransition(() => setActiveIndex(index))
        },
        [activeIndex]
    )

    const nextSlide = useCallback(() => {
        const nextIndex = (activeIndex + 1) % slides.length
        setDirection(1)
        startTransition(() => {
            setActiveIndex(nextIndex)
        })
    }, [activeIndex, slides.length])

    const prevSlide = useCallback(() => {
        const prevIndex = (activeIndex - 1 + slides.length) % slides.length
        setDirection(-1)
        startTransition(() => {
            setActiveIndex(prevIndex)
        })
    }, [activeIndex, slides.length])

    useEffect(() => {
        if (thumbnailContainerRef.current) {
            const container = thumbnailContainerRef.current
            const thumbWidth = THUMB_WIDTH
            const gap = THUMB_GAP

            // Calculate the scroll position to center the active thumbnail
            // We offset by 1 thumbnail to show it slightly to the left
            const scrollLeft = activeIndex * (thumbWidth + gap)

            container.scrollTo({
                left: scrollLeft,
                behavior: "smooth",
            })
        }
    }, [activeIndex])

    useEffect(() => {
        if (autoplay) {
            autoplayTimerRef.current = window.setInterval(() => {
                nextSlide()
            }, autoplayInterval)

            return () => {
                if (autoplayTimerRef.current) {
                    clearInterval(autoplayTimerRef.current)
                }
            }
        }
    }, [autoplay, autoplayInterval, nextSlide])

    const resetAutoplay = useCallback(() => {
        if (autoplayTimerRef.current) {
            clearInterval(autoplayTimerRef.current)
        }
        if (autoplay) {
            autoplayTimerRef.current = window.setInterval(() => {
                nextSlide()
            }, autoplayInterval)
        }
    }, [autoplay, autoplayInterval, nextSlide])

    const handleThumbnailClick = useCallback(
        (index: number) => {
            goToSlide(index)
            resetAutoplay()
        },
        [goToSlide, resetAutoplay]
    )

    const handlePrevClick = useCallback(() => {
        prevSlide()
        resetAutoplay()
    }, [prevSlide, resetAutoplay])

    const handleNextClick = useCallback(() => {
        nextSlide()
        resetAutoplay()
    }, [nextSlide, resetAutoplay])

    const slideVariants = {
        enter: (direction: number) => ({
            opacity: 1,
            y: 0,
            scale: 1,
        }),
        center: {
            opacity: 1,
            y: 0,
            scale: 1,
        },
        exit: (direction: number) => ({
            opacity: 0,
            y: 0,
            scale: 1,
        }),
    }

    const contentVariants = {
        enter: {
            opacity: 0,
            y: 30,
        },
        center: {
            opacity: 1,
            y: 0,
        },
        exit: {
            opacity: 0,
            y: -30,
        },
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                startTransition(() => {
                    setMousePosition({ 
                        x: e.clientX - rect.left, 
                        y: e.clientY - rect.top 
                    })
                })
            }
        }

        const container = containerRef.current
        if (container) {
            container.addEventListener("mousemove", handleMouseMove)
            return () => container.removeEventListener("mousemove", handleMouseMove)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: "#000000",
                cursor: showCustomCursor ? "none" : "default",
            }}
            onMouseEnter={() => startTransition(() => setIsHovering(true))}
            onMouseLeave={() => startTransition(() => setIsHovering(false))}
        >
            {/* Custom Cursor */}
            <CustomCursor
                mousePosition={mousePosition}
                isHovering={isHovering}
                isHoveringClickable={isHoveringClickable}
                showCustomCursor={showCustomCursor}
            />

            {/* GPS Coordinates - Top Left */}
            {showGPS && (
                <div
                    style={{
                        position: "absolute",
                        top: "40px",
                        left: "40px",
                        zIndex: 4,
                        color: settingsColor,
                        fontSize: "11px",
                        fontWeight: 400,
                        letterSpacing: "0.08em",
                        opacity: 0.7,
                        fontFamily: "monospace",
                    }}
                >
                    {slides[activeIndex].gpsCoordinates || "00.0000° N, 00.0000° E"}
                </div>
            )}

            {/* Shot Metadata - Top Right */}
            {showMetadata && (
                <div
                    style={{
                        position: "absolute",
                        top: "40px",
                        right: "40px",
                        zIndex: 4,
                        color: settingsColor,
                        fontSize: "11px",
                        fontWeight: 400,
                        letterSpacing: "0.08em",
                        opacity: 0.7,
                        fontFamily: "monospace",
                    }}
                >
                    {slides[activeIndex].metadata || "35mm / f1.4 / ISO 200"}
                </div>
            )}

            {/* Vertical line with edition text on left side */}
            {showSideTitle && (
                <div
                    style={{
                        position: "absolute",
                        left: "40px",
                        top: "50%",
                        transform: "translateY(-50%) rotate(180deg)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "20px",
                        zIndex: 4,
                    }}
                >
                    <motion.div
                        key={`line-top-${activeIndex}`}
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{
                            duration: 0.6,
                            ease: [0.43, 0.13, 0.23, 0.96],
                        }}
                        style={{
                            width: "1px",
                            height: "100px",
                            backgroundColor: sideTitleColor,
                            transformOrigin: "bottom",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    />
                    <span
                        style={{
                            color: sideTitleColor,
                            fontSize: "12px",
                            fontWeight: 500,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                        }}
                    >
                        {slides[activeIndex].title}
                    </span>
                    <motion.div
                        key={`line-bottom-${activeIndex}`}
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{
                            duration: 0.6,
                            ease: [0.43, 0.13, 0.23, 0.96],
                        }}
                        style={{
                            width: "1px",
                            height: "100px",
                            backgroundColor: sideTitleColor,
                            transformOrigin: "top",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    />
                </div>
            )}

            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={activeIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        duration: 1,
                        ease: [0.43, 0.13, 0.23, 0.96],
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${slides[activeIndex]?.image?.src || ""})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        willChange: "transform, opacity",
                        zIndex: 2,
                    }}
                />
            </AnimatePresence>

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)`,
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    zIndex: 2,
                    width: "90%",
                    maxWidth: "900px",
                }}
            >
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={`content-${activeIndex}`}
                        custom={direction}
                        variants={contentVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            duration: transitionDuration / 1000,
                            ease: [0.43, 0.13, 0.23, 0.96],
                        }}
                    >
                        {showTitle && (
                            <h1
                                style={{
                                    ...titleFont,
                                    color: titleColor,
                                    margin: 0,
                                    marginBottom: "24px",
                                    textTransform: "uppercase",
                                    textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                                }}
                            >
                                {slides[activeIndex].title}
                            </h1>
                        )}
                        {showDescription && (
                            <p
                                style={{
                                    ...descriptionFont,
                                    color: descriptionColor,
                                    margin: 0,
                                    textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                                    maxWidth: "700px",
                                    marginLeft: "auto",
                                    marginRight: "auto",
                                }}
                            >
                                {slides[activeIndex].description}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div
                style={{
                    position: "absolute",
                    bottom: "40px",
                    left: "40px",
                    display: "flex",
                    gap: "20px",
                    zIndex: 5,
                    alignItems: "center",
                }}
            >
                <motion.button
                    whileHover={{
                        scale: 1.1,
                        opacity: 1,
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrevClick}
                    onMouseEnter={() =>
                        startTransition(() => setIsHoveringClickable(true))
                    }
                    onMouseLeave={() =>
                        startTransition(() => setIsHoveringClickable(false))
                    }
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: showCustomCursor ? "none" : "pointer",
                        opacity: 0.8,
                        position: "relative",
                    }}
                    transition={{
                        scale: { duration: 0.3 },
                        opacity: { duration: 0.3 },
                    }}
                    aria-label="Previous slide"
                >
                    <motion.svg
                        width="60"
                        height="60"
                        viewBox="0 0 60 60"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                        }}
                        variants={{
                            initial: { rotate: 0 },
                            hover: { rotate: 360 },
                        }}
                        initial="initial"
                        animate="initial"
                        whileHover="hover"
                        transition={{
                            rotate: {
                                duration: 8,
                                ease: "linear",
                                repeat: Infinity,
                            },
                        }}
                    >
                        <motion.circle
                            cx="30"
                            cy="30"
                            r="29"
                            fill="none"
                            stroke={buttonColor}
                            strokeWidth="1"
                            variants={{
                                initial: { strokeDasharray: "1000, 0" },
                                hover: { strokeDasharray: "2, 6" },
                            }}
                            transition={{
                                strokeDasharray: { duration: 0 },
                            }}
                        />
                    </motion.svg>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        style={{
                            position: "relative",
                            zIndex: 1,
                            pointerEvents: "none",
                        }}
                    >
                        <path
                            d="M12 4L6 10L12 16"
                            stroke={buttonColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </motion.button>
                <motion.button
                    whileHover={{
                        scale: 1.1,
                        opacity: 1,
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextClick}
                    onMouseEnter={() =>
                        startTransition(() => setIsHoveringClickable(true))
                    }
                    onMouseLeave={() =>
                        startTransition(() => setIsHoveringClickable(false))
                    }
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: showCustomCursor ? "none" : "pointer",
                        opacity: 0.8,
                        position: "relative",
                    }}
                    transition={{
                        scale: { duration: 0.3 },
                        opacity: { duration: 0.3 },
                    }}
                    aria-label="Next slide"
                >
                    <motion.svg
                        width="60"
                        height="60"
                        viewBox="0 0 60 60"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                        }}
                        variants={{
                            initial: { rotate: 0 },
                            hover: { rotate: 360 },
                        }}
                        initial="initial"
                        animate="initial"
                        whileHover="hover"
                        transition={{
                            rotate: {
                                duration: 8,
                                ease: "linear",
                                repeat: Infinity,
                            },
                        }}
                    >
                        <motion.circle
                            cx="30"
                            cy="30"
                            r="29"
                            fill="none"
                            stroke={buttonColor}
                            strokeWidth="1"
                            variants={{
                                initial: { strokeDasharray: "1000, 0" },
                                hover: { strokeDasharray: "2, 6" },
                            }}
                            transition={{
                                strokeDasharray: { duration: 0 },
                            }}
                        />
                    </motion.svg>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        style={{
                            position: "relative",
                            zIndex: 1,
                            pointerEvents: "none",
                        }}
                    >
                        <path
                            d="M8 4L14 10L8 16"
                            stroke={buttonColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </motion.button>
            </div>

            <div
                ref={thumbnailContainerRef}
                style={{
                    position: "absolute",
                    bottom: "28px",
                    right: "0px",
                    display: showThumbnails ? "flex" : "none",
                    gap: "20px",
                    zIndex: 5,
                    maxWidth: `${thumbnailContainerWidth}px`,
                    overflowX: "hidden",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                    paddingLeft: "0px",
                    paddingTop: "12px",
                    paddingBottom: "12px",
                }}
            >
                {Array.from({ length: slides.length * 100 }).map((_, index) => {
                    const actualIndex = index % slides.length
                    const slide = slides[actualIndex]
                    const isActive = actualIndex === activeIndex
                    
                    // Skip rendering the current active slide
                    if (isActive) return null

                    return (
                        <motion.div
                            key={index}
                            onClick={() => handleThumbnailClick(actualIndex)}
                            onMouseEnter={() =>
                                startTransition(() =>
                                    setIsHoveringClickable(true)
                                )
                            }
                            onMouseLeave={() =>
                                startTransition(() =>
                                    setIsHoveringClickable(false)
                                )
                            }
                            animate={{
                                opacity: 1,
                            }}
                            transition={{
                                duration: 0.3,
                                ease: [0.43, 0.13, 0.23, 0.96],
                            }}
                            style={{
                                position: "relative",
                                width: "200px",
                                height: "120px",
                                borderRadius: `${thumbnailBorderRadius}px`,
                                overflow: "visible",
                                cursor: showCustomCursor ? "none" : "pointer",
                                flexShrink: 0,
                                border: "1px solid rgba(255, 255, 255, 0.06)",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: `${thumbnailBorderRadius}px`,
                                    overflow: "hidden",
                                    backgroundImage: `url(${slide?.image?.src || ""})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    boxShadow:
                                        "inset 0 1px 4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.15)",
                                }}
                            />
                        </motion.div>
                    )
                })}
            </div>

            <style>{`
                @media (max-width: 620px) {
                    div[style*="position: absolute"][style*="bottom: 28px"][style*="right: 0px"] {
                        display: none !important;
                    }
                }
                @media (max-width: 620px) {
                    div[style*="position: absolute"][style*="top: 50%"][style*="left: 50%"] {
                        left: 80px !important;
                        transform: translateY(-50%) !important;
                        text-align: left !important;
                        max-width: calc(100% - 120px) !important;
                        width: calc(100% - 120px) !important;
                    }
                    div[style*="position: absolute"][style*="top: 50%"][style*="left: 50%"] h1 {
                        font-size: 32px !important;
                        text-align: left !important;
                        margin-bottom: 16px !important;
                    }
                    div[style*="position: absolute"][style*="top: 50%"][style*="left: 50%"] p {
                        font-size: 14px !important;
                        text-align: left !important;
                        max-width: 100% !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                }
                @media (max-width: 460px) {
                    div[style*="position: absolute"][style*="top: 40px"][style*="right: 40px"] {
                        top: 60px !important;
                        left: 40px !important;
                        right: auto !important;
                    }
                }
            `}</style>
        </div>
    )
}

addPropertyControls(EditorialCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "DESTINATION",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Find beauty in the fleeting, for nothing is meant to stay.",
                    displayTextArea: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                gpsCoordinates: {
                    type: ControlType.String,
                    title: "GPS Coordinates",
                    defaultValue: "00.0000° N, 00.0000° E",
                },
                metadata: {
                    type: ControlType.String,
                    title: "Shot Metadata",
                    defaultValue: "35mm / f1.4 / ISO 200",
                },
            },
        },
        defaultValue: [
            {
                title: "Edition No.1",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Italy",
                },
                gpsCoordinates: "41.9028° N, 12.4964° E",
                metadata: "35mm / f1.4 / ISO 200",
            },
            {
                title: "Edition No.2",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Japan",
                },
                gpsCoordinates: "35.6762° N, 139.6503° E",
                metadata: "35mm / f1.4 / ISO 200",
            },
            {
                title: "Edition No.3",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Iceland",
                },
                gpsCoordinates: "64.1466° N, 21.9426° W",
                metadata: "35mm / f1.4 / ISO 200",
            },
            {
                title: "Edition No.4",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Morocco",
                },
                gpsCoordinates: "31.7917° N, 7.0926° W",
                metadata: "35mm / f1.4 / ISO 200",
            },
            {
                title: "Edition No.5",
                description:
                    "Find beauty in the fleeting, for nothing is meant to stay.",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Peru",
                },
                gpsCoordinates: "13.1631° S, 72.5450° W",
                metadata: "35mm / f1.4 / ISO 200",
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
    showCustomCursor: {
        type: ControlType.Boolean,
        title: "Custom Cursor",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Autoplay Interval",
        defaultValue: 6000,
        min: 2000,
        max: 15000,
        step: 500,
        unit: "ms",
        hidden: (props) => !props.autoplay,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 700,
        min: 300,
        max: 2000,
        step: 100,
        unit: "ms",
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showSideTitle: {
        type: ControlType.Boolean,
        title: "Show Side Title",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showDescription: {
        type: ControlType.Boolean,
        title: "Show Description",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "80px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "18px",
            letterSpacing: "0.02em",
            lineHeight: "1.6em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Colour",
        defaultValue: "#FFFFFF",
    },
    sideTitleColor: {
        type: ControlType.Color,
        title: "Side Title Colour",
        defaultValue: "#FFFFFF",
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description Colour",
        defaultValue: "#FFFFFF",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Colour",
        defaultValue: "#FFFFFF",
    },
    showThumbnails: {
        type: ControlType.Boolean,
        title: "Show Thumbnails",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    thumbnailBorderRadius: {
        type: ControlType.Number,
        title: "Thumbnail Radius",
        defaultValue: 24,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    showGPS: {
        type: ControlType.Boolean,
        title: "Show GPS",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showMetadata: {
        type: ControlType.Boolean,
        title: "Show Camera Settings",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    settingsColor: {
        type: ControlType.Color,
        title: "GPS & Camera Colour",
        defaultValue: "#FFFFFF",
    },
})
