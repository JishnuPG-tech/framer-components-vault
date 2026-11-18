// 3D carousel for luxury fashion brand with smooth rotation and premium feel
import { useState, useEffect, startTransition, type CSSProperties, useRef, useCallback, Profiler } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion"
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
    title: string
    subtitle: string
    image: {
        src: string
        alt: string
    }
    link?: string
}

interface LuxuryCarousel3DProps {
    items: CarouselItem[]
    autoRotate: boolean
    rotationInterval: number
    titleColor: string
    subtitleColor: string
    backgroundColor: string
    borderColor: string
    titleFont: CSSProperties
    subtitleFont: CSSProperties
    showPerformanceStats: boolean
    cardWidth: number
    imageHeight: number
    style?: CSSProperties
}

/**
 * 3D Luxury Fashion Carousel
 * 
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function LuxuryCarousel3D(props: LuxuryCarousel3DProps) {
    const {
        items,
        autoRotate,
        rotationInterval,
        titleColor,
        subtitleColor,
        backgroundColor,
        borderColor,
        titleFont,
        subtitleFont,
        showPerformanceStats = false,
        cardWidth = 400,
        imageHeight = 70,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [viewportWidth, setViewportWidth] = useState(0)
    
    // Performance monitoring state
    const [performanceMetrics, setPerformanceMetrics] = useState({
        renderTime: 0,
        fps: 0,
        memoryUsage: 0,
        renderCount: 0,
    })
    const frameCountRef = useRef(0)
    const lastFrameTimeRef = useRef(performance.now())
    const renderTimesRef = useRef<number[]>([])

    // Performance monitoring: FPS counter
    useEffect(() => {
        if (!showPerformanceStats) return

        let animationFrameId: number

        const measureFPS = () => {
            const now = performance.now()
            const delta = now - lastFrameTimeRef.current

            if (delta >= 1000) {
                const fps = Math.round((frameCountRef.current * 1000) / delta)
                
                startTransition(() => {
                    setPerformanceMetrics(prev => ({
                        ...prev,
                        fps,
                    }))
                })

                frameCountRef.current = 0
                lastFrameTimeRef.current = now
            }

            frameCountRef.current++
            animationFrameId = requestAnimationFrame(measureFPS)
        }

        animationFrameId = requestAnimationFrame(measureFPS)

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [showPerformanceStats])

    // Performance monitoring: Memory usage
    useEffect(() => {
        if (!showPerformanceStats) return

        const measureMemory = () => {
            if (typeof window !== "undefined" && "memory" in performance) {
                const memory = (performance as any).memory
                const usedMemoryMB = Math.round(memory.usedJSHeapSize / 1048576)
                
                startTransition(() => {
                    setPerformanceMetrics(prev => ({
                        ...prev,
                        memoryUsage: usedMemoryMB,
                    }))
                })
            }
        }

        measureMemory()
        const interval = setInterval(measureMemory, 2000)

        return () => clearInterval(interval)
    }, [showPerformanceStats])

    // React Profiler callback
    const onRenderCallback = useCallback(
        (
            id: string,
            phase: "mount" | "update",
            actualDuration: number,
            baseDuration: number,
            startTime: number,
            commitTime: number
        ) => {
            if (!showPerformanceStats) return

            renderTimesRef.current.push(actualDuration)
            
            // Keep only last 10 render times
            if (renderTimesRef.current.length > 10) {
                renderTimesRef.current.shift()
            }

            const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length

            startTransition(() => {
                setPerformanceMetrics(prev => ({
                    ...prev,
                    renderTime: Math.round(avgRenderTime * 100) / 100,
                    renderCount: prev.renderCount + 1,
                }))
            })
        },
        [showPerformanceStats]
    )

    // Auto-rotation effect
    useEffect(() => {
        if (!autoRotate || isHovered || isDragging) return

        const interval = setInterval(() => {
            startTransition(() => {
                setCurrentIndex((prev) => (prev + 1) % items.length)
            })
        }, rotationInterval * 1000)

        return () => clearInterval(interval)
    }, [autoRotate, rotationInterval, items.length, isHovered, isDragging])

    // Detect mobile and viewport size
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            const width = window.innerWidth
            startTransition(() => {
                setViewportWidth(width)
                setIsMobile(width < 768)
            })
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)

        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const handleNext = () => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length)
        })
    }

    const handlePrev = () => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
        })
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault()
            handlePrev()
        } else if (event.key === "ArrowRight") {
            event.preventDefault()
            handleNext()
        } else if (event.key === "Home") {
            event.preventDefault()
            startTransition(() => setCurrentIndex(0))
        } else if (event.key === "End") {
            event.preventDefault()
            startTransition(() => setCurrentIndex(items.length - 1))
        }
    }

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false)
        const threshold = 50
        
        if (info.offset.x > threshold) {
            handlePrev()
        } else if (info.offset.x < -threshold) {
            handleNext()
        }
    }

    // Calculate responsive dimensions
    const responsiveCardWidth = isMobile 
        ? Math.min(viewportWidth * 0.85, 320) 
        : cardWidth
    
    const responsiveImageHeight = isMobile ? 60 : imageHeight
    
    const responsiveCardHeight = isMobile ? "400px" : "500px"
    
    const responsivePadding = isMobile ? "20px 16px" : "32px 24px"
    
    const responsiveButtonSize = isMobile ? 40 : 48
    
    const responsiveButtonPosition = isMobile ? "16px" : "32px"

    const getCardStyle = (index: number) => {
        const diff = (index - currentIndex + items.length) % items.length
        const totalItems = items.length
        
        let position = diff
        if (diff > totalItems / 2) {
            position = diff - totalItems
        }

        const isFront = position === 0
        const scale = isFront ? 1 : 0.7
        const opacity = isFront ? 1 : 0
        const translateX = position * (responsiveCardWidth * 0.7)

        return {
            scale,
            opacity,
            translateX,
            zIndex: isFront ? 10 : 5 - Math.abs(position),
        }
    }

    return (
        <Profiler id="LuxuryCarousel3D" onRender={onRenderCallback}>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
            
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                onMouseEnter={() => !isMobile && startTransition(() => setIsHovered(true))}
                onMouseLeave={() => !isMobile && startTransition(() => setIsHovered(false))}
                role="region"
                aria-label="Luxury fashion carousel"
                aria-roledescription="carousel"
                onKeyDown={handleKeyDown}
            >
                {/* Performance Stats Overlay */}
                {showPerformanceStats && (
                    <div
                        style={{
                            position: "absolute",
                            top: isMobile ? "8px" : "16px",
                            right: isMobile ? "8px" : "16px",
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            color: "#FFFFFF",
                            padding: isMobile ? "8px 12px" : "12px 16px",
                            borderRadius: isMobile ? "6px" : "8px",
                            fontFamily: "monospace",
                            fontSize: isMobile ? "10px" : "12px",
                            zIndex: 1000,
                            lineHeight: "1.6",
                            minWidth: isMobile ? "150px" : "200px",
                        }}
                        role="status"
                        aria-live="polite"
                        aria-label="Performance statistics"
                    >
                        <div style={{ fontWeight: "bold", marginBottom: isMobile ? "4px" : "8px", color: "#00FF88" }}>
                            {isMobile ? "Perf" : "Performance Monitor"}
                        </div>
                        <div>FPS: {performanceMetrics.fps}</div>
                        <div>Render: {performanceMetrics.renderTime}ms</div>
                        {!isMobile && <div>Renders: {performanceMetrics.renderCount}</div>}
                        {!isMobile && performanceMetrics.memoryUsage > 0 && (
                            <div>Memory: {performanceMetrics.memoryUsage}MB</div>
                        )}
                        <div style={{ 
                            marginTop: isMobile ? "4px" : "8px", 
                            paddingTop: isMobile ? "4px" : "8px", 
                            borderTop: "1px solid rgba(255,255,255,0.2)",
                            color: performanceMetrics.fps >= 55 ? "#00FF88" : performanceMetrics.fps >= 30 ? "#FFB800" : "#FF4444"
                        }}>
                            {performanceMetrics.fps >= 55 ? "Excellent" : performanceMetrics.fps >= 30 ? "Good" : "Poor"}
                        </div>
                    </div>
                )}

                {/* Screen reader live region for announcements */}
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    style={{
                        position: "absolute",
                        left: "-10000px",
                        width: "1px",
                        height: "1px",
                        overflow: "hidden",
                    }}
                >
                    Item {currentIndex + 1} of {items.length}: {items[currentIndex]?.title}
                </div>

                {/* Carousel Container */}
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    role="group"
                    aria-roledescription="slide"
                >
                    {items.map((item, index) => {
                        const style = getCardStyle(index)
                        const itemImage = item.image || {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: "Default image"
                        }
                        const isActive = style.zIndex === 10
                        
                        return (
                            <motion.div
                                key={index}
                                style={{
                                    position: "absolute",
                                    width: `${responsiveCardWidth}px`,
                                    height: responsiveCardHeight,
                                    cursor: isActive ? "grab" : "pointer",
                                    touchAction: "pan-y",
                                }}
                                animate={{
                                    scale: style.scale,
                                    opacity: style.opacity,
                                    x: style.translateX,
                                    zIndex: style.zIndex,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 80,
                                    damping: 35,
                                    mass: 1.2,
                                }}
                                drag={isActive ? "x" : false}
                                dragConstraints={{ left: isMobile ? -100 : -150, right: isMobile ? 100 : 150 }}
                                dragElastic={0.1}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={handleDragEnd}
                                whileDrag={{ cursor: "grabbing" }}
                                onClick={() => {
                                    if (!isActive && !isDragging) {
                                        startTransition(() => setCurrentIndex(index))
                                    } else if (isActive && !isDragging && item.link) {
                                        window.open(item.link, "_blank", "noopener,noreferrer")
                                    }
                                }}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`${item.title}, ${item.subtitle}`}
                                aria-current={isActive ? "true" : "false"}
                                tabIndex={isActive ? 0 : -1}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: backgroundColor,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: isMobile ? "8px" : "4px",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                        cursor: isActive && item.link ? "pointer" : isActive ? "grab" : "pointer",
                                    }}
                                >
                                    {/* Image */}
                                    <div
                                        style={{
                                            width: "100%",
                                            height: `${responsiveImageHeight}%`,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <img
                                            src={itemImage.src}
                                            alt={itemImage.alt}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                pointerEvents: "none",
                                            }}
                                            aria-hidden={!isActive}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div
                                        style={{
                                            padding: responsivePadding,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: isMobile ? "6px" : "8px",
                                            flex: 1,
                                        }}
                                    >
                                        <h3
                                            style={{
                                                margin: 0,
                                                color: titleColor,
                                                fontFamily: "'Playfair Display', serif",
                                                fontSize: isMobile ? "22px" : titleFont.fontSize,
                                                ...titleFont,
                                            }}
                                            aria-hidden={!isActive}
                                        >
                                            {item.title}
                                        </h3>
                                        <p
                                            style={{
                                                margin: 0,
                                                color: subtitleColor,
                                                fontSize: isMobile ? "13px" : subtitleFont.fontSize,
                                                ...subtitleFont,
                                            }}
                                            aria-hidden={!isActive}
                                        >
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={handlePrev}
                    style={{
                        position: "absolute",
                        left: responsiveButtonPosition,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: `${responsiveButtonSize}px`,
                        height: `${responsiveButtonSize}px`,
                        borderRadius: "50%",
                        border: `1px solid ${borderColor}`,
                        backgroundColor: backgroundColor,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        transition: "all 0.3s ease",
                        opacity: 0.8,
                    }}
                    onMouseEnter={(e) => {
                        if (!isMobile) {
                            e.currentTarget.style.opacity = "1"
                            e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isMobile) {
                            e.currentTarget.style.opacity = "0.8"
                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                        }
                    }}
                    aria-label="Previous item"
                    aria-controls="carousel-container"
                >
                    <svg 
                        width={isMobile ? "20" : "24"} 
                        height={isMobile ? "20" : "24"} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke={titleColor} 
                        strokeWidth="2" 
                        aria-hidden="true"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                <button
                    onClick={handleNext}
                    style={{
                        position: "absolute",
                        right: responsiveButtonPosition,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: `${responsiveButtonSize}px`,
                        height: `${responsiveButtonSize}px`,
                        borderRadius: "50%",
                        border: `1px solid ${borderColor}`,
                        backgroundColor: backgroundColor,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        transition: "all 0.3s ease",
                        opacity: 0.8,
                    }}
                    onMouseEnter={(e) => {
                        if (!isMobile) {
                            e.currentTarget.style.opacity = "1"
                            e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isMobile) {
                            e.currentTarget.style.opacity = "0.8"
                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                        }
                    }}
                    aria-label="Next item"
                    aria-controls="carousel-container"
                >
                    <svg 
                        width={isMobile ? "20" : "24"} 
                        height={isMobile ? "20" : "24"} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke={titleColor} 
                        strokeWidth="2" 
                        aria-hidden="true"
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>

                {/* Indicators */}
                <div
                    style={{
                        position: "absolute",
                        bottom: isMobile ? "16px" : "24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: isMobile ? "6px" : "8px",
                        zIndex: 100,
                    }}
                    role="tablist"
                    aria-label="Carousel navigation"
                >
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => startTransition(() => setCurrentIndex(index))}
                            style={{
                                width: isMobile ? "6px" : "8px",
                                height: isMobile ? "6px" : "8px",
                                borderRadius: "50%",
                                border: `1px solid ${borderColor}`,
                                backgroundColor: index === currentIndex ? titleColor : "transparent",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                padding: 0,
                                minWidth: isMobile ? "24px" : "auto",
                                minHeight: isMobile ? "24px" : "auto",
                            }}
                            role="tab"
                            aria-label={`Go to item ${index + 1}`}
                            aria-selected={index === currentIndex}
                            aria-controls="carousel-container"
                            tabIndex={index === currentIndex ? 0 : -1}
                        />
                    ))}
                </div>
            </div>
        </Profiler>
    )
}

addPropertyControls(LuxuryCarousel3D, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Collection",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Spring 2024",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            {
                title: "Elegance",
                subtitle: "Spring Collection 2024",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Collection 1",
                },
                link: "https://example.com/spring-collection",
            },
            {
                title: "Sophistication",
                subtitle: "Summer Collection 2024",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Collection 2",
                },
                link: "https://example.com/summer-collection",
            },
            {
                title: "Refinement",
                subtitle: "Autumn Collection 2024",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Collection 3",
                },
                link: "https://example.com/autumn-collection",
            },
            {
                title: "Prestige",
                subtitle: "Winter Collection 2024",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Collection 4",
                },
                link: "https://example.com/winter-collection",
            },
        ],
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotationInterval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 4,
        min: 2,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: ({ autoRotate }) => !autoRotate,
    },
    showPerformanceStats: {
        type: ControlType.Boolean,
        title: "Performance Monitor",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "#666666",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#E5E5E5",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "0.05em",
            lineHeight: "1.4em",
        },
    },
})
