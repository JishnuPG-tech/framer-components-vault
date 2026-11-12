// Ultra-responsive split-screen storytelling with optimized performance
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function ScrollStorytelling(props) {
    const {
        slides = [
            {
                title: "Chapter One",
                content:
                    "This is the beginning of our story. As you scroll, watch how the narrative unfolds with beautiful visuals that complement each section.",
                media: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Chapter One Visual",
                },
                mediaType: "image",
            },
            {
                title: "Chapter Two",
                content:
                    "The story continues with new insights and perspectives. Each section brings fresh content and engaging visuals to keep your audience captivated.",
                media: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Chapter Two Visual",
                },
                mediaType: "image",
            },
            {
                title: "Chapter Three",
                content:
                    "As we reach the climax, the visuals become more dynamic. This storytelling format creates an immersive experience for your users.",
                media: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Chapter Three Visual",
                },
                mediaType: "image",
            },
        ],
        animationStyle = "fade",
        accentColor = "#0099FF",
        backgroundColor = "#FFFFFF",
        textColor = "#000000",
        titleFont,
        contentFont,
        showArrows = true,
        arrowColor = "#FFFFFF",
        darkMode = false,
        darkBackgroundColor = "#1A1A1A",
        darkTextColor = "#FFFFFF",
        autoScroll = false,
        autoScrollInterval = 5,
        borderRadius = 0,
        style,
    } = props

    const [currentSlide, setCurrentSlide] = useState(0)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const containerRef = useRef(null)
    const autoScrollTimer = useRef(null)

    // Optimized responsive breakpoint detection
    const isMobile = dimensions.width < 768
    const isTablet = dimensions.width >= 768 && dimensions.width < 1024
    const isSmall = dimensions.width < 480 || dimensions.height < 400

    // Memoized color values
    const colors = useMemo(
        () => ({
            background: darkMode ? darkBackgroundColor : backgroundColor,
            text: darkMode ? darkTextColor : textColor,
            accent: accentColor,
            arrow: arrowColor,
        }),
        [
            darkMode,
            darkBackgroundColor,
            backgroundColor,
            darkTextColor,
            textColor,
            accentColor,
            arrowColor,
        ]
    )

    // Responsive sizing calculations
    const sizing = useMemo(
        () => ({
            padding: isSmall
                ? "16px"
                : isMobile
                  ? "24px 20px"
                  : isTablet
                    ? "32px 28px"
                    : "48px 40px",
            titleSize: isSmall ? "20px" : isMobile ? "24px" : "32px",
            contentSize: isSmall ? "14px" : isMobile ? "15px" : "16px",
            arrowSize: isSmall ? "32px" : "40px",
            arrowIconSize: isSmall ? "14px" : "16px",
            progressHeight: "3px",
            progressWidth: isSmall ? "20px" : "28px",
            maxContentWidth: isMobile ? "100%" : isTablet ? "480px" : "560px",
        }),
        [isSmall, isMobile, isTablet]
    )

    // Optimized resize observer
    useEffect(() => {
        if (!containerRef.current) return

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                const { width, height } = entry.contentRect
                setDimensions({ width, height })
            }
        })

        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    // Auto-scroll with pause on interaction
    useEffect(() => {
        if (!autoScroll || slides.length <= 1) return

        const startAutoScroll = () => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current)

            autoScrollTimer.current = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length)
            }, autoScrollInterval * 1000)
        }

        startAutoScroll()
        return () => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current)
        }
    }, [autoScroll, autoScrollInterval, slides.length])

    // Pause auto-scroll on user interaction
    const handleInteraction = useCallback(() => {
        if (autoScrollTimer.current) {
            clearInterval(autoScrollTimer.current)
            setTimeout(() => {
                if (autoScroll) {
                    autoScrollTimer.current = setInterval(() => {
                        setCurrentSlide((prev) => (prev + 1) % slides.length)
                    }, autoScrollInterval * 1000)
                }
            }, autoScrollInterval * 2000)
        }
    }, [autoScroll, autoScrollInterval, slides.length])

    // Memoized animation variants
    const variants = useMemo(() => {
        const configs = {
            fade: {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
            },
            slide: {
                initial: { x: 30, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: -30, opacity: 0 },
            },
            scale: {
                initial: { scale: 0.96, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 1.04, opacity: 0 },
            },
        }
        return configs[animationStyle] || configs.fade
    }, [animationStyle])

    // Navigation handlers
    const navigate = useCallback(
        (direction) => {
            handleInteraction()
            setCurrentSlide((prev) => {
                if (direction === "next") {
                    return (prev + 1) % slides.length
                }
                return prev === 0 ? slides.length - 1 : prev - 1
            })
        },
        [slides.length, handleInteraction]
    )

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") navigate("prev")
            if (e.key === "ArrowRight") navigate("next")
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [navigate])

    const currentContent = slides[currentSlide] || slides[0]

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                backgroundColor: colors.background,
                overflow: "hidden",
                width: "100%",
                height: "100%",
                minHeight: "300px",
                minWidth: "280px",
                borderRadius: `${borderRadius}px`,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
            }}
        >
            {/* Text Panel */}
            <div
                style={{
                    flex: 1,
                    padding: sizing.padding,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    position: "relative",
                    zIndex: 2,
                    minWidth: 0,
                    height: isMobile ? "50%" : "100%",
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`content-${currentSlide}`}
                        initial={variants.initial}
                        animate={variants.animate}
                        exit={variants.exit}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            width: "100%",
                            maxWidth: sizing.maxContentWidth,
                        }}
                    >
                        <h2
                            style={{
                                margin: "0 0 16px 0",
                                color: colors.accent,
                                fontSize: sizing.titleSize,
                                fontWeight: 700,
                                lineHeight: 1.2,
                                letterSpacing: "-0.02em",
                                ...titleFont,
                            }}
                        >
                            {currentContent.title}
                        </h2>

                        <p
                            style={{
                                margin: 0,
                                color: colors.text,
                                fontSize: sizing.contentSize,
                                lineHeight: 1.6,
                                letterSpacing: "-0.01em",
                                opacity: 0.9,
                                ...contentFont,
                            }}
                        >
                            {currentContent.content}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Progress Indicators */}
                {slides.length > 1 && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: sizing.padding.split(" ")[0],
                            left:
                                sizing.padding.split(" ")[1] ||
                                sizing.padding.split(" ")[0],
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                        }}
                    >
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    handleInteraction()
                                    setCurrentSlide(idx)
                                }}
                                style={{
                                    width: sizing.progressWidth,
                                    height: sizing.progressHeight,
                                    borderRadius: "2px",
                                    backgroundColor:
                                        idx === currentSlide
                                            ? colors.accent
                                            : darkMode
                                              ? "rgba(255,255,255,0.2)"
                                              : "rgba(0,0,0,0.15)",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    transition:
                                        "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                                    transform:
                                        idx === currentSlide
                                            ? "scaleX(1.2)"
                                            : "scaleX(1)",
                                }}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Media Panel */}
            <div
                style={{
                    flex: 1,
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: darkMode ? "#0a0a0a" : "#f5f5f5",
                    minWidth: 0,
                    height: isMobile ? "50%" : "100%",
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`media-${currentSlide}`}
                        initial={variants.initial}
                        animate={variants.animate}
                        exit={variants.exit}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        {currentContent.mediaType === "video" &&
                        currentContent.media?.src ? (
                            <video
                                src={currentContent.media.src}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={
                                    currentContent.media?.src ||
                                    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
                                }
                                alt={currentContent.media?.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                                loading="lazy"
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                {showArrows && slides.length > 1 && (
                    <div
                        style={{
                            position: "absolute",
                            left: isMobile ? "50%" : "auto",
                            right: isMobile ? "auto" : isSmall ? "4%" : "5%",
                            bottom: isMobile ? "4%" : isSmall ? "5%" : "6%",
                            transform: isMobile ? "translateX(-50%)" : "none",
                            display: "flex",
                            gap: "8px",
                            zIndex: 10,
                        }}
                    >
                        {[
                            { dir: "prev", path: "M15 18l-6-6 6-6" },
                            { dir: "next", path: "M9 18l6-6-6-6" },
                        ].map(({ dir, path }) => (
                            <motion.button
                                key={dir}
                                onClick={() => navigate(dir)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: sizing.arrowSize,
                                    height: sizing.arrowSize,
                                    borderRadius:
                                        borderRadius > 0
                                            ? `${Math.min(borderRadius * 0.4, 10)}px`
                                            : "50%",
                                    border: "none",
                                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                                    color: colors.arrow,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                }}
                                aria-label={`${dir === "next" ? "Next" : "Previous"} slide`}
                            >
                                <svg
                                    width={sizing.arrowIconSize}
                                    height={sizing.arrowIconSize}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d={path} />
                                </svg>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(ScrollStorytelling, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Chapter Title",
                },
                content: {
                    type: ControlType.String,
                    title: "Content",
                    displayTextArea: true,
                    defaultValue: "Your story content goes here.",
                },
                media: { type: ControlType.ResponsiveImage, title: "Media" },
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
            },
        },
        defaultValue: [
            {
                title: "Chapter One",
                content:
                    "This is the beginning of our story. As you scroll, watch how the narrative unfolds with beautiful visuals.",
                media: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Chapter One",
                },
                mediaType: "image",
            },
        ],
    },
    animationStyle: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["fade", "slide", "scale"],
        optionTitles: ["Fade", "Slide", "Scale"],
        defaultValue: "fade",
        displaySegmentedControl: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showArrows }) => !showArrows,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0099FF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
    },
    contentFont: {
        type: ControlType.Font,
        title: "Content Font",
        controls: "extended",
    },
    darkMode: {
        type: ControlType.Boolean,
        title: "Dark Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    darkBackgroundColor: {
        type: ControlType.Color,
        title: "Dark BG",
        defaultValue: "#1A1A1A",
        hidden: ({ darkMode }) => !darkMode,
    },
    darkTextColor: {
        type: ControlType.Color,
        title: "Dark Text",
        defaultValue: "#FFFFFF",
        hidden: ({ darkMode }) => !darkMode,
    },
    autoScroll: {
        type: ControlType.Boolean,
        title: "Auto Scroll",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoScrollInterval: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 5,
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
        hidden: ({ autoScroll }) => !autoScroll,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})
