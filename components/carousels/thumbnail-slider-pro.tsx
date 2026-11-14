// Made with 💛 by Karim Saif
import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SlideItem {
    image: string
    alt?: string
}

interface ComponentProps {
    slides: SlideItem[]
    orientation: "vertical" | "horizontal"
    autoplay: boolean
    delay: number
    loop: boolean
    pauseOnHover: boolean
    pauseOnFocus: boolean
    aspectRatioToggle: boolean
    aspectRatio: number
    borderRadius: number
    thumbWidth: number
    ariaLabel: string
}

/**
 * Thumbnail Slider (Vertical & Horizontal Overlay)
 * Made with 💛 by Karim Saif
 */
export default function ThumbnailSlider(props: ComponentProps) {
    const {
        slides = [],
        orientation = "vertical",
        autoplay = true,
        delay = 2000,
        loop = true,
        pauseOnHover = true,
        pauseOnFocus = true,
        aspectRatioToggle = false,
        aspectRatio = 1.77,
        borderRadius = 12,
        thumbWidth = 64,
        ariaLabel = "Thumbnail Slider",
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const isVertical = orientation === "vertical"

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isInView, setIsInView] = useState(true)

    const rootRef = useRef<HTMLDivElement | null>(null)
    const activeThumbRef = useRef<HTMLButtonElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    // Viewport Visibility Detection via IntersectionObserver
    useEffect(() => {
        if (isStaticRenderer || typeof IntersectionObserver === "undefined") {
            return
        }

        const target = rootRef.current
        if (!target) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)
            },
            { rootMargin: "50px", threshold: 0.1 }
        )

        observer.observe(target)
        return () => observer.disconnect()
    }, [isStaticRenderer])

    // Centralized Next / Previous navigation helpers
    const handleNext = useCallback(() => {
        if (!slides || slides.length === 0) return
        setCurrentIndex((prev) => {
            if (prev < slides.length - 1) return prev + 1
            return loop ? 0 : prev
        })
    }, [slides.length, loop])

    const handlePrev = useCallback(() => {
        if (!slides || slides.length === 0) return
        setCurrentIndex((prev) => {
            if (prev > 0) return prev - 1
            return loop ? slides.length - 1 : prev
        })
    }, [slides.length, loop])

    // Reset currentIndex if slides list shrinks out-of-bounds
    useEffect(() => {
        if (slides.length > 0 && currentIndex >= slides.length) {
            setCurrentIndex(Math.max(0, slides.length - 1))
        }
    }, [slides.length, currentIndex])

    // Autoplay timer (disabled offscreen or in static renderer)
    useEffect(() => {
        if (
            isStaticRenderer ||
            !isInView ||
            !autoplay ||
            isPaused ||
            slides.length <= 1
        ) {
            return
        }
        if (!loop && currentIndex === slides.length - 1) return

        const timer = setTimeout(() => {
            handleNext()
        }, delay)

        return () => clearTimeout(timer)
    }, [
        isStaticRenderer,
        isInView,
        autoplay,
        delay,
        loop,
        isPaused,
        currentIndex,
        slides.length,
        handleNext,
    ])

    // Smart auto-scroll: active thumbnail bounds check
    useEffect(() => {
        if (isStaticRenderer || !isInView) return
        if (activeThumbRef.current && containerRef.current) {
            const thumbRect = activeThumbRef.current.getBoundingClientRect()
            const containerRect = containerRef.current.getBoundingClientRect()

            const isOutOfBounds = isVertical
                ? thumbRect.top < containerRect.top ||
                  thumbRect.bottom > containerRect.bottom
                : thumbRect.left < containerRect.left ||
                  thumbRect.right > containerRect.right

            if (isOutOfBounds) {
                activeThumbRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                })
            }
        }
    }, [currentIndex, isVertical, isStaticRenderer, isInView])

    // Preload adjacent images imperatively (only when in viewport)
    useEffect(() => {
        if (isStaticRenderer || !isInView || !slides || slides.length <= 1) {
            return
        }

        const nextIndex = (currentIndex + 1) % slides.length
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length

        if (slides[nextIndex]?.image) {
            const imgNext = new Image()
            imgNext.src = slides[nextIndex].image
        }

        if (slides[prevIndex]?.image) {
            const imgPrev = new Image()
            imgPrev.src = slides[prevIndex].image
        }
    }, [currentIndex, slides, isStaticRenderer, isInView])

    // Dynamic swipe gesture handler
    const handleDragEnd = (
        _: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        const swipeThreshold = 50
        const offset = isVertical ? info.offset.y : info.offset.x

        if (offset < -swipeThreshold) {
            handleNext()
        } else if (offset > swipeThreshold) {
            handlePrev()
        }
    }

    if (!slides || slides.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    minHeight: 200,
                    background: "#f3f4f6",
                    borderRadius,
                    color: "#6b7280",
                    fontFamily: "sans-serif",
                    fontSize: 14,
                }}
            >
                Add slides in property controls
            </div>
        )
    }

    const activeSlide = slides[currentIndex] || slides[0]

    // Pure static markup return for SSG and Canvas exports
    if (isStaticRenderer) {
        return (
            <div
                aria-label={ariaLabel}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    aspectRatio: aspectRatioToggle ? `${aspectRatio}` : "unset",
                    overflow: "hidden",
                    borderRadius,
                    background: "#000000",
                }}
            >
                <img
                    src={activeSlide.image}
                    alt={activeSlide.alt || "Slide Image"}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>
        )
    }

    // Shared thumbnail button list renderer
    const renderThumbnails = () =>
        slides.map((slide, idx) => {
            const isActive = idx === currentIndex
            const accessibleLabel =
                slide.alt && slide.alt !== "Slide Image"
                    ? `Go to ${slide.alt}`
                    : `Go to slide ${idx + 1}`

            return (
                <button
                    type="button"
                    key={idx}
                    ref={isActive ? activeThumbRef : null}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={accessibleLabel}
                    aria-current={isActive ? "true" : undefined}
                    style={{
                        width: thumbWidth,
                        height: thumbWidth * 0.75,
                        padding: 0,
                        border: isActive
                            ? "2px solid #ffffff"
                            : "2px solid transparent",
                        borderRadius: 8,
                        overflow: "hidden",
                        cursor: "pointer",
                        opacity: isActive ? 1 : 0.65,
                        transition: "all 0.2s ease-in-out",
                        outlineOffset: 2,
                        background: "none",
                        flexShrink: 0,
                    }}
                >
                    <img
                        src={slides[idx].image}
                        alt=""
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            pointerEvents: "none",
                        }}
                    />
                </button>
            )
        })

    return (
        <div
            ref={rootRef}
            role="region"
            aria-label={ariaLabel}
            onMouseEnter={() => {
                if (pauseOnHover) setIsPaused(true)
            }}
            onMouseLeave={() => {
                if (pauseOnHover) setIsPaused(false)
            }}
            onFocus={() => {
                if (pauseOnFocus) setIsPaused(true)
            }}
            onBlur={(e) => {
                if (
                    pauseOnFocus &&
                    !e.currentTarget.contains(e.relatedTarget as Node)
                ) {
                    setIsPaused(false)
                }
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                aspectRatio: aspectRatioToggle ? `${aspectRatio}` : "unset",
                overflow: "hidden",
                borderRadius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000000",
                touchAction: isVertical ? "pan-x" : "pan-y",
            }}
        >
            {/* Screen reader live announcement */}
            <div
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {`Item ${currentIndex + 1} of ${slides.length}`}
            </div>

            {/* Main Active Image */}
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentIndex}
                    src={activeSlide.image}
                    alt={activeSlide.alt || `Slide ${currentIndex + 1}`}
                    loading={currentIndex === 0 ? "eager" : "lazy"}
                    drag={isVertical ? "y" : "x"}
                    dragConstraints={
                        isVertical
                            ? { top: 0, bottom: 0 }
                            : { left: 0, right: 0 }
                    }
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        cursor: "grab",
                    }}
                    whileTap={{ cursor: "grabbing" }}
                />
            </AnimatePresence>

            {/* Thumbnail Overlay Container */}
            <div
                ref={containerRef}
                style={
                    isVertical
                        ? {
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              zIndex: 10,
                              maxHeight: "80%",
                              overflowY: "auto",
                              overflowX: "hidden",
                              padding: 4,
                              scrollbarWidth: "none",
                              msOverflowStyle: "none",
                          }
                        : {
                              position: "absolute",
                              bottom: 12,
                              left: "50%",
                              transform: "translateX(-50%)",
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: 8,
                              zIndex: 10,
                              maxWidth: "calc(100% - 24px)",
                              overflowX: "auto",
                              overflowY: "hidden",
                              padding: "4px 8px",
                              scrollbarWidth: "none",
                              msOverflowStyle: "none",
                          }
                }
            >
                {renderThumbnails()}
            </div>
        </div>
    )
}

ThumbnailSlider.defaultProps = {
    slides: [
        {
            image: "https://images.unsplash.com/photo-1759395073808-17782f3d8d66?q=80&w=1471&auto=format&fit=crop",
            alt: "Slide 1",
        },
        {
            image: "https://images.unsplash.com/photo-1759434192768-fe3facebd5f6?q=80&w=1471&auto=format&fit=crop",
            alt: "Slide 2",
        },
        {
            image: "https://images.unsplash.com/photo-1758641008040-28cdd59ca8fb?q=80&w=687&auto=format&fit=crop",
            alt: "Slide 3",
        },
        {
            image: "https://images.unsplash.com/photo-1618220649687-ba860f3176e7?q=80&w=1474&auto=format&fit=crop",
            alt: "Slide 4",
        },
        {
            image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=765&auto=format&fit=crop",
            alt: "Slide 5",
        },
    ],
    orientation: "vertical",
    autoplay: true,
    delay: 2000,
    loop: true,
    pauseOnHover: true,
    pauseOnFocus: true,
    aspectRatioToggle: false,
    aspectRatio: 1.77,
    borderRadius: 12,
    thumbWidth: 64,
    ariaLabel: "Thumbnail Slider",
}

// Property Controls Definition Organized by Category
addPropertyControls(ThumbnailSlider, {
    // CONTENT
    slides: {
        type: ControlType.Array,
        title: "Slides",
        description: "Manage images and accessibility titles for each slide.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Slide Image",
                },
            },
        },
    },

    // LAYOUT
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
        description:
            "Switch between vertical right-side and horizontal bottom overlays.",
    },
    aspectRatioToggle: {
        type: ControlType.Boolean,
        title: "Aspect Ratio",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Off",
        description: "Lock component to a specific width-to-height ratio.",
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Ratio",
        defaultValue: 1.77,
        min: 0.2,
        max: 5,
        step: 0.01,
        hidden(props) {
            return !props.aspectRatioToggle
        },
        description: "Width divided by height (e.g., 16/9 = 1.77).",
    },
    thumbWidth: {
        type: ControlType.Number,
        title: "Thumb Size",
        defaultValue: 64,
        min: 40,
        max: 120,
        unit: "px",
        description: "Size of thumbnail previews.",
    },

    // BEHAVIOR
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        description: "Automatically cycle through slides.",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay (ms)",
        defaultValue: 2000,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
        hidden(props) {
            return !props.autoplay
        },
        description: "Time duration between slide transitions.",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Infinite Loop",
        defaultValue: true,
        description: "Restart from the first slide after reaching the end.",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        description: "Pause slide transitions when hovering over the slider.",
    },
    pauseOnFocus: {
        type: ControlType.Boolean,
        title: "Pause Focus",
        defaultValue: true,
        description:
            "Pause slide transitions when keyboard focus is inside the slider.",
    },

    // STYLE
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        unit: "px",
        description: "Corner roundness for the main container.",
    },

    // ACCESSIBILITY
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Thumbnail Slider",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
