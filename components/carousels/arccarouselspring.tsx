// Arc-shaped image carousel with curved card arrangement, drag gestures, and spring physics
import { useEffect, useRef, useState, useCallback, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, PanInfo } from "framer-motion"

interface SlideData {
    image: { src: string; alt?: string }
    title: string
    subheadline: string
    ctaLabel: string
    link: string
}

interface ArcCarouselProps {
    slides: SlideData[]
    arcRadius: number
    arcSpread: number
    centerX: number
    centerY: number
    activeScale: number
    inactiveScale: number
    dragSensitivity: number
    springStiffness: number
    springDamping: number
    enableScroll: boolean
    cardWidth: number
    cardHeight: number
    responsiveEnabled: boolean
    responsiveBreakpoint: number
    mobileCardWidth: number
    mobileCardHeight: number
    mobileArcRadius: number
    mobileArcSpread: number
    mobileCenterX: number
    mobileCenterY: number
    mobileActiveScale: number
    mobileInactiveScale: number
    showArrows: boolean
    arrowSize: number
    arrowColor: string
    arrowBackground: string
    arrowPosition: number
    backgroundColor: string
    cardBackground: string
    titleColor: string
    subheadlineColor: string
    ctaBackground: string
    ctaTextColor: string
    borderRadius: number
    cardShadow: string
    titleFont: any
    subheadlineFont: any
    ctaFont: any
}

/**
 * Arc Image Carousel
 * 
 * Premium carousel with cards arranged in a curved arc formation.
 * Center card is largest and most prominent, side cards follow the curve.
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ArcCarousel(props: ArcCarouselProps) {
    const {
        slides = [],
        arcRadius = 800,
        arcSpread = 120,
        centerX = 0,
        centerY = -200,
        activeScale = 1,
        inactiveScale = 0.7,
        dragSensitivity = 0.5,
        springStiffness = 100,
        springDamping = 20,
        enableScroll = true,
        cardWidth = 280,
        cardHeight = 380,
        responsiveEnabled = false,
        responsiveBreakpoint = 520,
        mobileCardWidth = 220,
        mobileCardHeight = 300,
        mobileArcRadius = 520,
        mobileArcSpread = 95,
        mobileCenterX = 0,
        mobileCenterY = -160,
        mobileActiveScale = 1,
        mobileInactiveScale = 0.75,
        showArrows = true,
        arrowSize = 48,
        arrowColor = "#FFFFFF",
        arrowBackground = "rgba(0,0,0,0.5)",
        arrowPosition = 50,
        backgroundColor = "#000000",
        cardBackground = "#FFFFFF",
        titleColor = "#000000",
        subheadlineColor = "#666666",
        ctaBackground = "#000000",
        ctaTextColor = "#FFFFFF",
        borderRadius = 16,
        cardShadow = "0 20px 60px rgba(0,0,0,0.3)",
        titleFont,
        subheadlineFont,
        ctaFont,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)
    const dragX = useMotionValue(0)
    const isDragging = useRef(false)

    const springTransition = useMemo(() => {
        return { type: "spring" as const, stiffness: springStiffness, damping: springDamping }
    }, [springStiffness, springDamping])

    // Normalize index for infinite loop
    const normalizeIndex = useCallback(
        (index: number) => {
            const len = slides.length
            if (len <= 0) return 0
            return ((index % len) + len) % len
        },
        [slides.length]
    )

    useEffect(() => {
        const len = slides.length
        if (len <= 0) return

        // Keep currentIndex within the middle copy so the extendedSlides always has content around it
        if (currentIndex < 0) {
            startTransition(() => setCurrentIndex((v) => v + len))
        } else if (currentIndex > len * 2 - 1) {
            startTransition(() => setCurrentIndex((v) => v - len))
        }
    }, [currentIndex, slides.length])

    useEffect(() => {
        if (!responsiveEnabled) return
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        const el = containerRef.current

        const update = () => {
            const next = el.getBoundingClientRect().width
            startTransition(() => setContainerWidth(next))
        }

        update()

        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => update())
        ro.observe(el)
        return () => ro.disconnect()
    }, [responsiveEnabled])

    const isMobile = responsiveEnabled && containerWidth > 0 && containerWidth <= responsiveBreakpoint

    const responsiveConfig = useMemo(() => {
        return {
            arcRadius: isMobile ? mobileArcRadius : arcRadius,
            arcSpread: isMobile ? mobileArcSpread : arcSpread,
            centerX: isMobile ? mobileCenterX : centerX,
            centerY: isMobile ? mobileCenterY : centerY,
            activeScale: isMobile ? mobileActiveScale : activeScale,
            inactiveScale: isMobile ? mobileInactiveScale : inactiveScale,
            cardWidth: isMobile ? mobileCardWidth : cardWidth,
            cardHeight: isMobile ? mobileCardHeight : cardHeight,
        }
    }, [
        isMobile,
        mobileArcRadius,
        arcRadius,
        mobileArcSpread,
        arcSpread,
        mobileCenterX,
        centerX,
        mobileCenterY,
        centerY,
        mobileActiveScale,
        activeScale,
        mobileInactiveScale,
        inactiveScale,
        mobileCardWidth,
        cardWidth,
        mobileCardHeight,
        cardHeight,
    ])

    // Handle drag end
    const handleDragEnd = useCallback(
        (_: any, info: PanInfo) => {
            isDragging.current = false
            const threshold = 50
            const effectiveOffset = info.offset.x * dragSensitivity
            const effectiveVelocity = info.velocity.x * dragSensitivity

            if (Math.abs(effectiveOffset) > threshold || Math.abs(effectiveVelocity) > 500) {
                const direction = effectiveOffset > 0 ? -1 : 1
                const newIndex = currentIndex + direction
                
                startTransition(() => setCurrentIndex(newIndex))
            }

            dragX.set(0)
        },
        [currentIndex, dragSensitivity, dragX]
    )

    // Handle wheel scroll
    useEffect(() => {
        if (!enableScroll || !containerRef.current) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            
            const delta = e.deltaY
            if (Math.abs(delta) > 10) {
                const direction = delta > 0 ? 1 : -1
                const newIndex = currentIndex + direction
                
                startTransition(() => setCurrentIndex(newIndex))
            }
        }

        const container = containerRef.current
        container.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            container.removeEventListener("wheel", handleWheel)
        }
    }, [currentIndex, enableScroll])

    // Calculate card position and properties based on arc
    const getCardTransform = useCallback(
        (index: number, animatedIdx: number) => {
            const offset = index - animatedIdx
            const angle = (offset * responsiveConfig.arcSpread * Math.PI) / 180
            
            // Arc positioning
            const x = responsiveConfig.centerX + responsiveConfig.arcRadius * Math.sin(angle)
            const y = responsiveConfig.centerY + responsiveConfig.arcRadius * (1 - Math.cos(angle))
            
            // Scale based on distance from center
            const distanceFromCenter = Math.abs(offset)
            const scale =
                responsiveConfig.activeScale -
                (responsiveConfig.activeScale - responsiveConfig.inactiveScale) * Math.min(distanceFromCenter, 1)
            
            // Opacity based on distance
            const opacity = Math.max(0.3, 1 - distanceFromCenter * 0.3)
            
            // Z-index for layering
            const zIndex = 100 - Math.abs(offset) * 10

            return { x, y, scale, opacity, zIndex }
        },
        [responsiveConfig]
    )

    // Image dimensions based on ratio
    const imageDimensions = useMemo(() => {
        return { width: responsiveConfig.cardWidth, height: responsiveConfig.cardHeight }
    }, [responsiveConfig])

    const handleCardClick = useCallback(
        (index: number) => {
            if (index !== currentIndex) {
                startTransition(() => setCurrentIndex(index))
            }
        },
        [currentIndex]
    )

    const handleCtaClick = useCallback((e: any, link: string) => {
        e.stopPropagation()
        if (link && typeof window !== "undefined") {
            window.open(link, "_blank")
        }
    }, [])

    const handlePrevious = useCallback(() => {
        startTransition(() => setCurrentIndex((prev) => prev - 1))
    }, [])

    const handleNext = useCallback(() => {
        startTransition(() => setCurrentIndex((prev) => prev + 1))
    }, [])

    // Generate extended array for infinite loop effect
    const extendedSlides = useMemo(() => {
        if (slides.length === 0) return []
        // Create 3 copies for smooth infinite scrolling
        return [...slides, ...slides, ...slides]
    }, [slides])

    // Calculate visible range
    const visibleRange = 5 // Number of cards to render on each side

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
                cursor: "grab",
            }}
        >
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragStart={() => {
                    isDragging.current = true
                }}
                onDragEnd={handleDragEnd}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    x: dragX,
                }}
            >
                {extendedSlides.map((slide, extendedIndex) => {
                    // Calculate the actual index offset from current
                    const baseOffset = extendedIndex - slides.length - currentIndex
                    
                    // Only render cards within visible range
                    if (Math.abs(baseOffset) > visibleRange) return null
                    
                    const actualIndex = normalizeIndex(currentIndex + baseOffset)
                    const slideImage = slide.image || { 
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", 
                        alt: "Default image" 
                    }
                    
                    const isCenter = baseOffset === 0
                    
                    return (
                        <motion.div
                            key={`${actualIndex}-${extendedIndex}`}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                cursor: isCenter ? "default" : "pointer",
                            }}
                            animate={(() => {
                                const transform = getCardTransform(extendedIndex, slides.length + currentIndex)
                                return {
                                    x: transform.x,
                                    y: transform.y,
                                    scale: transform.scale,
                                    opacity: transform.opacity,
                                    zIndex: transform.zIndex,
                                }
                            })()}
                            transition={springTransition}
                            onClick={() => {
                                if (!isCenter) {
                                    const targetIndex = currentIndex + baseOffset
                                    startTransition(() => setCurrentIndex(targetIndex))
                                }
                            }}
                        >
                            <div
                                style={{
                                    width: imageDimensions.width,
                                    transform: "translate(-50%, -50%)",
                                    pointerEvents: isCenter ? "auto" : "none",
                                }}
                            >
                                {/* Card */}
                                <div
                                    style={{
                                        backgroundColor: cardBackground,
                                        borderRadius,
                                        boxShadow: cardShadow,
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* Image */}
                                    <div
                                        style={{
                                            width: "100%",
                                            height: imageDimensions.height,
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <img
                                            src={slideImage.src}
                                            alt={slideImage.alt || slide.title}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </div>

                                    {/* Content - Only visible on center card */}
                                    {isCenter && (
                                        <div
                                            style={{
                                                padding: 24,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 16,
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
                                                {slide.title}
                                            </h3>

                                            {/* Subheadline */}
                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: subheadlineColor,
                                                    ...subheadlineFont,
                                                }}
                                            >
                                                {slide.subheadline}
                                            </p>

                                            {/* CTA Button */}
                                            <button
                                                onClick={(e) => handleCtaClick(e, slide.link)}
                                                style={{
                                                    backgroundColor: ctaBackground,
                                                    color: ctaTextColor,
                                                    border: "none",
                                                    borderRadius: borderRadius / 2,
                                                    padding: "12px 24px",
                                                    cursor: "pointer",
                                                    transition: "transform 0.2s, opacity 0.2s",
                                                    ...ctaFont,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = "scale(1.05)"
                                                    e.currentTarget.style.opacity = "0.9"
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = "scale(1)"
                                                    e.currentTarget.style.opacity = "1"
                                                }}
                                            >
                                                {slide.ctaLabel}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* Navigation Dots */}
            <div
                style={{
                    position: "absolute",
                    bottom: 32,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 8,
                    zIndex: 1000,
                }}
            >
                {slides.map((_, index) => {
                    const len = slides.length
                    const normalizedCurrent = normalizeIndex(currentIndex)
                    return (
                        <button
                            key={index}
                            onClick={() => {
                                if (len <= 0) return
                                const raw = index - normalizedCurrent
                                const alt = raw > 0 ? raw - len : raw + len
                                const chosen = Math.abs(raw) <= Math.abs(alt) ? raw : alt
                                startTransition(() => setCurrentIndex(currentIndex + chosen))
                            }}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                border: "none",
                                backgroundColor: index === normalizedCurrent ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                transition: "all 0.3s",
                                padding: 0,
                            }}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    )
                })}
            </div>

            {/* Navigation Arrows */}
            {showArrows && slides.length > 1 && (
                <>
                    {/* Previous Arrow */}
                    <button
                        onClick={handlePrevious}
                        style={{
                            position: "absolute",
                            left: 16,
                            top: `${arrowPosition}%`,
                            transform: "translateY(-50%)",
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: "50%",
                            backgroundColor: arrowBackground,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            transition: "all 0.3s",
                            backdropFilter: "blur(10px)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                            e.currentTarget.style.backgroundColor = arrowBackground.replace(/[\d.]+\)$/, "0.7)")
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                            e.currentTarget.style.backgroundColor = arrowBackground
                        }}
                        aria-label="Previous slide"
                    >
                        <svg
                            width={arrowSize * 0.5}
                            height={arrowSize * 0.5}
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

                    {/* Next Arrow */}
                    <button
                        onClick={handleNext}
                        style={{
                            position: "absolute",
                            right: 16,
                            top: `${arrowPosition}%`,
                            transform: "translateY(-50%)",
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: "50%",
                            backgroundColor: arrowBackground,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            transition: "all 0.3s",
                            backdropFilter: "blur(10px)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                            e.currentTarget.style.backgroundColor = arrowBackground.replace(/[\d.]+\)$/, "0.7)")
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                            e.currentTarget.style.backgroundColor = arrowBackground
                        }}
                        aria-label="Next slide"
                    >
                        <svg
                            width={arrowSize * 0.5}
                            height={arrowSize * 0.5}
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
                </>
            )}
        </div>
    )
}

addPropertyControls(ArcCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
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
                    defaultValue: "Project Title",
                },
                subheadline: {
                    type: ControlType.String,
                    title: "Subheadline",
                    defaultValue: "A brief description of this amazing project",
                    displayTextArea: true,
                },
                ctaLabel: {
                    type: ControlType.String,
                    title: "CTA Label",
                    defaultValue: "View Project",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "https://framer.com",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Project 1",
                },
                title: "Creative Vision",
                subheadline: "Transforming ideas into stunning visual experiences",
                ctaLabel: "Explore",
                link: "https://framer.com",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Project 2",
                },
                title: "Brand Identity",
                subheadline: "Crafting memorable brand experiences that resonate",
                ctaLabel: "Discover",
                link: "https://framer.com",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Project 3",
                },
                title: "Digital Innovation",
                subheadline: "Pushing boundaries with cutting-edge design solutions",
                ctaLabel: "Learn More",
                link: "https://framer.com",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Project 4",
                },
                title: "User Experience",
                subheadline: "Designing intuitive interfaces that users love",
                ctaLabel: "View Case",
                link: "https://framer.com",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Project 5",
                },
                title: "Visual Storytelling",
                subheadline: "Bringing narratives to life through design",
                ctaLabel: "See More",
                link: "https://framer.com",
            },
        ],
    },
    arcRadius: {
        type: ControlType.Number,
        title: "Arc Radius",
        defaultValue: 800,
        min: 400,
        max: 1500,
        step: 50,
    },
    arcSpread: {
        type: ControlType.Number,
        title: "Arc Spread",
        defaultValue: 120,
        min: 60,
        max: 180,
        step: 10,
        unit: "°",
    },
    centerX: {
        type: ControlType.Number,
        title: "Center X",
        defaultValue: 0,
        min: -500,
        max: 500,
        step: 10,
    },
    centerY: {
        type: ControlType.Number,
        title: "Center Y",
        defaultValue: -200,
        min: -500,
        max: 500,
        step: 10,
    },
    activeScale: {
        type: ControlType.Number,
        title: "Active Scale",
        defaultValue: 1,
        min: 0.8,
        max: 1.5,
        step: 0.1,
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Scale",
        defaultValue: 0.7,
        min: 0.3,
        max: 1,
        step: 0.1,
    },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Sensitivity",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        defaultValue: 100,
        min: 50,
        max: 300,
        step: 10,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        defaultValue: 20,
        min: 10,
        max: 50,
        step: 5,
    },
    enableScroll: {
        type: ControlType.Boolean,
        title: "Scroll",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 280,
        min: 150,
        max: 600,
        step: 10,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 380,
        min: 150,
        max: 800,
        step: 10,
        unit: "px",
    },
    responsiveEnabled: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    responsiveBreakpoint: {
        type: ControlType.Number,
        title: "Mobile ≤",
        defaultValue: 520,
        min: 320,
        max: 900,
        step: 10,
        unit: "px",
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    mobileCardWidth: {
        type: ControlType.Number,
        title: "Mobile Card W",
        defaultValue: 220,
        min: 120,
        max: 600,
        step: 10,
        unit: "px",
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    mobileCardHeight: {
        type: ControlType.Number,
        title: "Mobile Card H",
        defaultValue: 300,
        min: 120,
        max: 800,
        step: 10,
        unit: "px",
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    mobileArcRadius: {
        type: ControlType.Number,
        title: "Mobile Radius",
        defaultValue: 520,
        min: 200,
        max: 1500,
        step: 20,
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    mobileArcSpread: {
        type: ControlType.Number,
        title: "Mobile Spread",
        defaultValue: 95,
        min: 40,
        max: 180,
        step: 5,
        unit: "°",
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    mobileCenterX: {
        type: ControlType.Number,
        title: "Mobile Center X",
        defaultValue: 0,
        min: -500,
        max: 500,
        step: 10,
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    mobileCenterY: {
        type: ControlType.Number,
        title: "Mobile Center Y",
        defaultValue: -160,
        min: -500,
        max: 500,
        step: 10,
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    mobileActiveScale: {
        type: ControlType.Number,
        title: "Mobile Active",
        defaultValue: 1,
        min: 0.8,
        max: 1.5,
        step: 0.05,
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    mobileInactiveScale: {
        type: ControlType.Number,
        title: "Mobile Inactive",
        defaultValue: 0.75,
        min: 0.3,
        max: 1,
        step: 0.05,
        hidden: ({ responsiveEnabled }) => !responsiveEnabled,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 48,
        min: 32,
        max: 80,
        step: 4,
        unit: "px",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowBackground: {
        type: ControlType.String,
        title: "Arrow BG",
        defaultValue: "rgba(0,0,0,0.5)",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowPosition: {
        type: ControlType.Number,
        title: "Arrow Position",
        defaultValue: 50,
        min: 10,
        max: 90,
        step: 5,
        unit: "%",
        hidden: ({ showArrows }) => !showArrows,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
    },
    subheadlineColor: {
        type: ControlType.Color,
        title: "Subheadline Color",
        defaultValue: "#666666",
    },
    ctaBackground: {
        type: ControlType.Color,
        title: "CTA Background",
        defaultValue: "#000000",
    },
    ctaTextColor: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
    },
    cardShadow: {
        type: ControlType.String,
        title: "Card Shadow",
        defaultValue: "0 20px 60px rgba(0,0,0,0.3)",
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
    subheadlineFont: {
        type: ControlType.Font,
        title: "Subheadline Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    ctaFont: {
        type: ControlType.Font,
        title: "CTA Font",
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
