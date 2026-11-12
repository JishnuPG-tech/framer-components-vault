// slider with scale up effect and parallax scrolling
import {
    useState,
    useRef,
    useEffect,
    startTransition,
    type CSSProperties,
} from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SlideData {
    image: string
    objectFit?: "fill" | "fit" | "cover"
    objectPosition?: string
}

interface ParallaxSliderProps {
    slides: SlideData[]
    autoPlay: boolean
    autoPlayDelay: number
    showDots: boolean
    showArrows: boolean
    parallaxIntensity: number
    transitionEffect: "fade" | "slide" | "scale"
    transitionDuration: number
    backgroundColor: string
    dotColor: string
    dotActiveColor: string
    arrowColor: string
    borderRadius: number
    style?: CSSProperties
}

/**
 * Slider with Scale and Parallax Effects
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ParallaxSlider(props: ParallaxSliderProps) {
    const {
        slides = [],
        autoPlay = true,
        autoPlayDelay = 4000,
        showDots = true,
        showArrows = true,
        parallaxIntensity = 50,
        transitionEffect = "fade",
        transitionDuration = 0.8,
        backgroundColor = "#000000",
        dotColor = "#FFFFFF",
        dotActiveColor = "#0099FF",
        arrowColor = "#FFFFFF",
        borderRadius = 16,
    } = props

    const [currentSlide, setCurrentSlide] = useState(1)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [hasScrolled, setHasScrolled] = useState(false)
    const [imagesLoaded, setImagesLoaded] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { once: false, amount: 0.3 })
    const [touchStart, setTouchStart] = useState(0)
    const [touchEnd, setTouchEnd] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    // Create extended slides array with first slide duplicated at the end for infinite loop
    const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]]

    // Detect mobile screen size
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => setIsMobile(window.innerWidth < 768))
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Preload all images
    useEffect(() => {
        if (typeof window === "undefined" || isStatic) return

        const imageUrls = slides
            .map((slide) => slide?.image)
            .filter((src) => src && src !== "")

        if (imageUrls.length === 0) {
            startTransition(() => setImagesLoaded(true))
            return
        }

        const preloadImage = (url: string) => {
            return new Promise((resolve, reject) => {
                const img = new Image()
                img.onload = () => resolve(url)
                img.onerror = () => resolve(url)
            })
        }

        Promise.all(imageUrls.map(preloadImage)).then(() => {
            startTransition(() => setImagesLoaded(true))
        })
    }, [slides, isStatic])

    // Parallax scroll tracking
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const parallaxY = useTransform(
        scrollYProgress,
        [0, 1],
        [-parallaxIntensity, parallaxIntensity]
    )

    // Track if user has scrolled
    useEffect(() => {
        if (isStatic) return

        const unsubscribe = scrollYProgress.on("change", (latest) => {
            if (latest > 0 && !hasScrolled) {
                startTransition(() => setHasScrolled(true))
            }
        })

        return () => unsubscribe()
    }, [scrollYProgress, hasScrolled, isStatic])

    // Track user interaction
    useEffect(() => {
        if (currentSlide !== 0) {
            startTransition(() => setHasInteracted(true))
        }
    }, [currentSlide])

    // Auto-play functionality
    useEffect(() => {
        if (!autoPlay || isStatic) return
        if (!isInView) return

        const interval = setInterval(() => {
            startTransition(() => {
                setIsTransitioning(true)
                setCurrentSlide((prev) => prev + 1)
            })
        }, autoPlayDelay)

        return () => clearInterval(interval)
    }, [autoPlay, autoPlayDelay, slides.length, isStatic, isInView])

    // Reset to first slide after reaching the duplicate at the end
    useEffect(() => {
        if (currentSlide === slides.length + 1 && isTransitioning) {
            const timer = setTimeout(() => {
                startTransition(() => {
                    setIsTransitioning(false)
                    setCurrentSlide(1)
                })
            }, transitionDuration * 1000)

            return () => clearTimeout(timer)
        }
        // Reset to last slide after reaching the duplicate at the beginning
        if (currentSlide === 0 && isTransitioning) {
            const timer = setTimeout(() => {
                startTransition(() => {
                    setIsTransitioning(false)
                    setCurrentSlide(slides.length)
                })
            }, transitionDuration * 1000)

            return () => clearTimeout(timer)
        }
    }, [currentSlide, slides.length, isTransitioning, transitionDuration])

    const goToSlide = (index: number) => {
        if (index === currentSlide) return
        startTransition(() => {
            setIsTransitioning(true)
            setCurrentSlide(index)
        })
    }

    const nextSlideHandler = () => {
        startTransition(() => {
            setIsTransitioning(true)
            setCurrentSlide((prev) => prev + 1)
        })
    }

    const prevSlide = () => {
        startTransition(() => {
            setIsTransitioning(true)
            setCurrentSlide((prev) => prev - 1)
        })
    }

    // Touch handlers for mobile swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > 50
        const isRightSwipe = distance < -50

        if (isLeftSwipe) {
            nextSlideHandler()
        }
        if (isRightSwipe) {
            prevSlide()
        }

        setTouchStart(0)
        setTouchEnd(0)
    }

    if (slides.length === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor,
                }}
            >
                <span
                    style={{
                        color: "#FFFFFF",
                        fontSize: "32px",
                        fontWeight: "600",
                    }}
                >
                    No slides available
                </span>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                borderRadius,
                width: "100%",
                height: "100%",
                ...props.style,
            }}
        >
            {/* Slides Container */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                }}
            >
                {extendedSlides.map((slide, index) => {
                    const isActive = index === currentSlide

                    let translateX = "0%"
                    let opacity = 1
                    let scale = 1

                    if (transitionEffect === "slide") {
                        translateX = `${(index - currentSlide) * 100}%`
                        opacity = isActive ? 1 : 0
                    } else if (transitionEffect === "fade") {
                        opacity = isActive ? 1 : 0
                    } else if (transitionEffect === "scale") {
                        scale = isActive ? 1 : 0.8
                        opacity = isActive ? 1 : 0
                    }

                    return (
                        <motion.div
                            key={index}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: isActive ? "auto" : "none",
                            }}
                            animate={
                                isStatic
                                    ? {
                                          x: translateX,
                                          opacity,
                                          scale,
                                      }
                                    : {
                                          x: translateX,
                                          opacity,
                                          scale,
                                      }
                            }
                            transition={{
                                duration: isTransitioning
                                    ? transitionDuration
                                    : 0,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                        >
                            {/* Background Image with Parallax */}
                            <motion.div
                                style={{
                                    position: "absolute",
                                    top: "-10%",
                                    left: "-10%",
                                    width: "120%",
                                    height: "120%",
                                    backgroundImage: slide?.image
                                        ? `url(${slide.image})`
                                        : "none",
                                    backgroundColor: slide?.image
                                        ? "transparent"
                                        : backgroundColor,
                                    backgroundSize:
                                        slide?.objectFit === "fill"
                                            ? "100% 100%"
                                            : slide?.objectFit === "fit"
                                              ? "contain"
                                              : slide?.objectFit || "cover",
                                    backgroundPosition:
                                        slide?.objectPosition || "center",
                                    backgroundRepeat: "no-repeat",
                                    y: isStatic ? 0 : parallaxY,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                role="img"
                                aria-label={`Slide ${index + 1}`}
                            >
                                {(!slide?.image || slide.image === "") && (
                                    <span
                                        style={{
                                            color: "#FFFFFF",
                                            fontSize: "32px",
                                            fontWeight: "600",
                                            textAlign: "center",
                                            padding: "20px",
                                        }}
                                    >
                                        No Image. Please Upload Image
                                    </span>
                                )}
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Navigation Arrows */}
            {showArrows && slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        style={{
                            position: "absolute",
                            left: isMobile ? 10 : 20,
                            top: isMobile ? "auto" : "50%",
                            bottom: isMobile ? 20 : "auto",
                            transform: isMobile ? "none" : "translateY(-50%)",
                            background: "rgba(0,0,0,0.5)",
                            border: "none",
                            borderRadius: "50%",
                            width: isMobile ? 40 : 50,
                            height: isMobile ? 40 : 50,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 3,
                            transition: "all 0.3s ease",
                            backdropFilter: "blur(10px)",
                        }}
                        onMouseEnter={(e) => {
                            if (!isStatic) {
                                e.currentTarget.style.background =
                                    "rgba(0,0,0,0.8)"
                                e.currentTarget.style.transform = isMobile
                                    ? "scale(1.1)"
                                    : "translateY(-50%) scale(1.1)"
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isStatic) {
                                e.currentTarget.style.background =
                                    "rgba(0,0,0,0.5)"
                                e.currentTarget.style.transform = isMobile
                                    ? "scale(1)"
                                    : "translateY(-50%) scale(1)"
                            }
                        }}
                        aria-label="Previous slide"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={arrowColor}
                        >
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlideHandler}
                        style={{
                            position: "absolute",
                            right: isMobile ? 10 : 20,
                            top: isMobile ? "auto" : "50%",
                            bottom: isMobile ? 20 : "auto",
                            transform: isMobile ? "none" : "translateY(-50%)",
                            background: "rgba(0,0,0,0.5)",
                            border: "none",
                            borderRadius: "50%",
                            width: isMobile ? 40 : 50,
                            height: isMobile ? 40 : 50,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 3,
                            transition: "all 0.3s ease",
                            backdropFilter: "blur(10px)",
                        }}
                        onMouseEnter={(e) => {
                            if (!isStatic) {
                                e.currentTarget.style.background =
                                    "rgba(0,0,0,0.8)"
                                e.currentTarget.style.transform = isMobile
                                    ? "scale(1.1)"
                                    : "translateY(-50%) scale(1.1)"
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isStatic) {
                                e.currentTarget.style.background =
                                    "rgba(0,0,0,0.5)"
                                e.currentTarget.style.transform = isMobile
                                    ? "scale(1)"
                                    : "translateY(-50%) scale(1)"
                            }
                        }}
                        aria-label="Next slide"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={arrowColor}
                        >
                            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {showDots && slides.length > 1 && (
                <div
                    style={{
                        position: "absolute",
                        bottom: isMobile ? 10 : 30,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: isMobile ? 8 : 12,
                        zIndex: 3,
                    }}
                >
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index + 1)}
                            style={{
                                width: isMobile ? 10 : 12,
                                height: isMobile ? 10 : 12,
                                borderRadius: "50%",
                                border: "none",
                                background:
                                    index + 1 === currentSlide ||
                                    (currentSlide === slides.length + 1 &&
                                        index === 0) ||
                                    (currentSlide === 0 &&
                                        index === slides.length - 1)
                                        ? dotActiveColor
                                        : dotColor,
                                opacity:
                                    index + 1 === currentSlide ||
                                    (currentSlide === slides.length + 1 &&
                                        index === 0) ||
                                    (currentSlide === 0 &&
                                        index === slides.length - 1)
                                        ? 1
                                        : 0.5,
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                transform:
                                    index + 1 === currentSlide ||
                                    (currentSlide === slides.length + 1 &&
                                        index === 0) ||
                                    (currentSlide === 0 &&
                                        index === slides.length - 1)
                                        ? "scale(1.2)"
                                        : "scale(1)",
                            }}
                            onMouseEnter={(e) => {
                                if (!isStatic && index + 1 !== currentSlide) {
                                    e.currentTarget.style.opacity = "0.8"
                                    e.currentTarget.style.transform =
                                        "scale(1.1)"
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isStatic && index + 1 !== currentSlide) {
                                    e.currentTarget.style.opacity = "0.5"
                                    e.currentTarget.style.transform = "scale(1)"
                                }
                            }}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

addPropertyControls(ParallaxSlider, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                objectFit: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["cover", "fit", "fill"],
                    optionTitles: ["Fill", "Fit", "stretch"],
                    defaultValue: "cover",
                },
                objectPosition: {
                    type: ControlType.Enum,
                    title: "Position",
                    options: [
                        "center",
                        "top",
                        "bottom",
                        "left",
                        "right",
                        "top left",
                        "top right",
                        "bottom left",
                        "bottom right",
                    ],
                    optionTitles: [
                        "Center",
                        "Top",
                        "Bottom",
                        "Left",
                        "Right",
                        "Top Left",
                        "Top Right",
                        "Bottom Left",
                        "Bottom Right",
                    ],
                    defaultValue: "center",
                },
            },
        },
        defaultValue: [
            {
                objectFit: "cover",
                objectPosition: "center",
            },
        ],
        maxCount: 10,
    },
    transitionEffect: {
        type: ControlType.Enum,
        title: "Transition Effect",
        options: ["fade", "slide", "scale"],
        optionTitles: ["Fade", "Slide", "Scale"],
        defaultValue: "fade",
        displaySegmentedControl: true,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 0.8,
        min: 0.3,
        max: 2.0,
        step: 0.1,
        unit: "s",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlayDelay: {
        type: ControlType.Number,
        title: "Auto Play Delay",
        defaultValue: 4000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    parallaxIntensity: {
        type: ControlType.Number,
        title: "Parallax Intensity",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showDots }) => !showDots,
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Active Dot Color",
        defaultValue: "#0099FF",
        hidden: ({ showDots }) => !showDots,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showArrows }) => !showArrows,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
})
