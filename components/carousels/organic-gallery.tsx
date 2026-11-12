// Responsive editorial portfolio carousel with organic vertical pill-shaped image masks
import * as React from "react"
import {
    useEffect,
    useState,
    useRef,
    useCallback,
    startTransition,
} from "react"
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


interface CarouselItem {
    image: { src: string; alt?: string }
    category: string
    title: string
    subtitle: string
    link?: string
}

interface EditorialCarouselProps {
    items: CarouselItem[]
    cardWidth: number
    cardHeight: number
    cardGap: number
    borderRadius: number
    activeScale: number
    inactiveOpacity: number
    animationSpeed: number
    showArrows: boolean
    textColor: string
    categoryFont: any
    titleFont: any
    subtitleFont: any
    backgroundColor: string
    mobileCardWidth: number
    mobileCardHeight: number
    mobileGap: number
}

/**
 * Organic Carousel
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function OrganicCarousel(props: EditorialCarouselProps) {
    const {
        items = [],
        cardWidth = 240,
        cardHeight = 420,
        cardGap = 60,
        borderRadius = 48,
        activeScale = 1.05,
        inactiveOpacity = 0.6,
        animationSpeed = 0.6,
        showArrows = true,
        textColor = "#000000",
        categoryFont,
        titleFont,
        subtitleFont,
        backgroundColor = "#FFFFFF",
        mobileCardWidth = 150,
        mobileCardHeight = 260,
        mobileGap = 20,
    } = props

    const isStatic = useIsStaticRenderer()

    const [activeIndex, setActiveIndex] = useState(Math.floor(items.length / 2))
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [containerWidth, setContainerWidth] = useState(1200)

    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (typeof window === "undefined") return

        const checkResponsive = () => {
            const width = window.innerWidth

            startTransition(() => {
                setIsMobile(width < 768)
                setIsTablet(width >= 768 && width < 1024)
            })
        }

        checkResponsive()
        window.addEventListener("resize", checkResponsive)

        return () => window.removeEventListener("resize", checkResponsive)
    }, [])

    useEffect(() => {
        const element = containerRef.current
        if (!element) return

        const updateWidth = () => {
            setContainerWidth(element.offsetWidth || 1200)
        }

        updateWidth()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateWidth)
            return () => window.removeEventListener("resize", updateWidth)
        }

        const observer = new ResizeObserver(updateWidth)
        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const currentCardWidth = isMobile
        ? mobileCardWidth
        : isTablet
          ? cardWidth * 0.79
          : cardWidth

    const currentCardHeight = isMobile
        ? mobileCardHeight
        : isTablet
          ? cardHeight * 0.79
          : cardHeight

    const currentGap = isMobile ? mobileGap : isTablet ? cardGap * 0.7 : cardGap

    const itemStep = currentCardWidth + currentGap

    // Exact center alignment:
    // The active card center is moved to the horizontal center of the component / viewport.
    const activeCardCenter = activeIndex * itemStep + currentCardWidth / 2
    const trackX = containerWidth / 2 - activeCardCenter

    const goToNext = useCallback(() => {
        if (items.length === 0) return

        startTransition(() => {
            setActiveIndex((prev) => (prev + 1) % items.length)
            setHoveredIndex(null)
        })
    }, [items.length])

    const goToPrev = useCallback(() => {
        if (items.length === 0) return

        startTransition(() => {
            setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
            setHoveredIndex(null)
        })
    }, [items.length])

    const goToIndex = useCallback(
        (index: number) => {
            if (index < 0 || index >= items.length) return

            startTransition(() => {
                setActiveIndex(index)
                setHoveredIndex(null)
            })
        },
        [items.length]
    )

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            const target = event.target as HTMLElement
            const isEditable =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.tagName === "SELECT" ||
                target.isContentEditable

            if (isEditable) return

            if (event.key === "ArrowLeft") {
                event.preventDefault()
                goToPrev()
            }

            if (event.key === "ArrowRight") {
                event.preventDefault()
                goToNext()
            }
        },
        [goToNext, goToPrev]
    )

    const handleCardKeyDown = useCallback(
        (
            event: React.KeyboardEvent<HTMLDivElement | HTMLAnchorElement>,
            index: number,
            link?: string
        ) => {
            if (event.key !== "Enter" && event.key !== " ") return

            if (link && index === activeIndex) return

            event.preventDefault()

            if (index !== activeIndex) {
                goToIndex(index)
                return
            }

            setHoveredIndex((prev) => (prev === index ? null : index))
        },
        [activeIndex, goToIndex]
    )

    if (items.length === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor,
                    color: textColor,
                    ...titleFont,
                }}
            >
                Add items to the carousel
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Editorial carousel"
            onKeyDown={handleKeyDown}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
            }}
        >
            <motion.div
                drag={isStatic ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragStart={() => {
                    if (!isStatic) setIsDragging(true)
                }}
                onDragEnd={(_, info) => {
                    if (isStatic) return

                    setIsDragging(false)

                    const threshold = 50

                    if (info.offset.x > threshold) {
                        goToPrev()
                    } else if (info.offset.x < -threshold) {
                        goToNext()
                    }
                }}
                animate={isStatic ? { x: trackX } : { x: trackX }}
                transition={
                    isStatic
                        ? { duration: 0 }
                        : {
                              type: "spring",
                              stiffness: 300,
                              damping: 32,
                              duration: animationSpeed,
                          }
                }
                style={{
                    display: "flex",
                    gap: currentGap,
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    translateY: "-50%",
                    cursor: isStatic
                        ? "default"
                        : isDragging
                          ? "grabbing"
                          : "grab",
                    willChange: isStatic ? "auto" : "transform",
                }}
            >
                {items.map((item, index) => {
                    const itemImage = item.image || {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Default",
                    }

                    const isActive = index === activeIndex
                    const isHovered = hoveredIndex === index
                    const showInfo = isActive || isHovered
                    const hasLink = Boolean(item.link)

                    const cardContent = (
                        <>
                            <div
                                style={{
                                    width: currentCardWidth,
                                    height: currentCardHeight,
                                    borderRadius: `${borderRadius}%`,
                                    overflow: "hidden",
                                    position: "relative",
                                    cursor: isActive
                                        ? hasLink
                                            ? "pointer"
                                            : "default"
                                        : "pointer",
                                }}
                            >
                                <img
                                    src={itemImage.src}
                                    alt={itemImage.alt || item.title}
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                        display: "block",
                                    }}
                                />
                            </div>

                            <AnimatePresence>
                                {showInfo && (
                                    <motion.div
                                        initial={
                                            isStatic
                                                ? false
                                                : { opacity: 0, y: 10 }
                                        }
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={
                                            isStatic
                                                ? undefined
                                                : { opacity: 0, y: 10 }
                                        }
                                        transition={
                                            isStatic
                                                ? { duration: 0 }
                                                : { duration: 0.3 }
                                        }
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            right: 0,
                                            paddingTop: isMobile ? 12 : 16,
                                            textAlign: "center",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...categoryFont,
                                                color: textColor,
                                                marginBottom: 6,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.1em",
                                            }}
                                        >
                                            {item.category}
                                        </div>

                                        <div
                                            style={{
                                                ...titleFont,
                                                color: textColor,
                                                marginBottom: 4,
                                            }}
                                        >
                                            {item.title}
                                        </div>

                                        <div
                                            style={{
                                                ...subtitleFont,
                                                color: textColor,
                                            }}
                                        >
                                            {item.subtitle}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )

                    return (
                        <motion.div
                            key={index}
                            style={{
                                position: "relative",
                                flexShrink: 0,
                                width: currentCardWidth,
                                transformOrigin: "center center",
                            }}
                            animate={{
                                scale: isStatic
                                    ? 1
                                    : isActive
                                      ? activeScale
                                      : 1,
                                opacity: isActive ? 1 : inactiveOpacity,
                            }}
                            transition={
                                isStatic
                                    ? { duration: 0 }
                                    : {
                                          duration: animationSpeed * 0.5,
                                          ease: "easeOut",
                                      }
                            }
                            onMouseEnter={() => {
                                if (!isMobile) setHoveredIndex(index)
                            }}
                            onMouseLeave={() => {
                                if (!isMobile) setHoveredIndex(null)
                            }}
                            onClick={() => {
                                if (isDragging) return

                                if (isMobile) {
                                    if (isActive) {
                                        setHoveredIndex(
                                            hoveredIndex === index
                                                ? null
                                                : index
                                        )
                                    } else {
                                        goToIndex(index)
                                    }

                                    return
                                }

                                if (!isActive) {
                                    goToIndex(index)
                                }
                            }}
                        >
                            {hasLink && isActive ? (
                                <a
                                    href={item.link}
                                    aria-label={`Open ${item.title}`}
                                    onKeyDown={(event) =>
                                        handleCardKeyDown(
                                            event,
                                            index,
                                            item.link
                                        )
                                    }
                                    style={{
                                        display: "block",
                                        color: "inherit",
                                        textDecoration: "none",
                                        outlineOffset: 4,
                                    }}
                                >
                                    {cardContent}
                                </a>
                            ) : (
                                <div
                                    tabIndex={0}
                                    role="button"
                                    aria-label={
                                        isActive
                                            ? `${item.title}`
                                            : `Show ${item.title}`
                                    }
                                    aria-current={isActive ? "true" : undefined}
                                    onKeyDown={(event) =>
                                        handleCardKeyDown(
                                            event,
                                            index,
                                            item.link
                                        )
                                    }
                                    style={{
                                        outlineOffset: 4,
                                    }}
                                >
                                    {cardContent}
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </motion.div>

            {showArrows && (
                <>
                    <button
                        onClick={goToPrev}
                        aria-label="Previous slide"
                        style={{
                            position: "absolute",
                            left: isMobile ? 10 : 20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: isMobile ? 36 : 48,
                            height: isMobile ? 36 : 48,
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor,
                            color: textColor,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            opacity: 0.8,
                            transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "1"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "0.8"
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                    <button
                        onClick={goToNext}
                        aria-label="Next slide"
                        style={{
                            position: "absolute",
                            right: isMobile ? 10 : 20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: isMobile ? 36 : 48,
                            height: isMobile ? 36 : 48,
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor,
                            color: textColor,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            opacity: 0.8,
                            transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "1"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "0.8"
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    )
}

addPropertyControls(OrganicCarousel, {
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
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Category",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project Title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Brief description",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Project 1",
                },
                category: "Editorial",
                title: "Azure Dreams",
                subtitle: "Modern minimalist design",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Project 2",
                },
                category: "Portfolio",
                title: "Purple Haze",
                subtitle: "Creative visual identity",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Project 3",
                },
                category: "Branding",
                title: "Sunset Glow",
                subtitle: "Bold brand experience",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Project 4",
                },
                category: "Design",
                title: "Golden Hour",
                subtitle: "Elegant art direction",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Project 5",
                },
                category: "Photography",
                title: "Emerald Forest",
                subtitle: "Nature inspired visuals",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Project 6",
                },
                category: "Art",
                title: "Ocean Breeze",
                subtitle: "Contemporary aesthetics",
                link: "",
            },
        ],
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 270,
        min: 150,
        max: 400,
        step: 10,
        displayStepper: true,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 400,
        min: 250,
        max: 600,
        step: 10,
        displayStepper: true,
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 60,
        min: 10,
        max: 150,
        step: 5,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 44,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
    },
    activeScale: {
        type: ControlType.Number,
        title: "Active Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.3,
        step: 0.05,
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        defaultValue: 0.6,
        min: 0.2,
        max: 1,
        step: 0.1,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 0.6,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    categoryFont: {
        type: ControlType.Font,
        title: "Category Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Medium",
            letterSpacing: "0.1em",
            lineHeight: "1.2em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
    },
    mobileCardWidth: {
        type: ControlType.Number,
        title: "Mobile Card Width",
        defaultValue: 150,
        min: 100,
        max: 250,
        step: 10,
        displayStepper: true,
    },
    mobileCardHeight: {
        type: ControlType.Number,
        title: "Mobile Card Height",
        defaultValue: 260,
        min: 150,
        max: 400,
        step: 10,
        displayStepper: true,
    },
    mobileGap: {
        type: ControlType.Number,
        title: "Mobile Gap",
        defaultValue: 20,
        min: 10,
        max: 60,
        step: 5,
        displayStepper: true,
    },
})
