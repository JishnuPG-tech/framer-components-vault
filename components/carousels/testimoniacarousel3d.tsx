// Auto-playing testimonial carousel with 3D depth perspective, smooth slide transitions, swipe gestures, and animated dot indicators
import { useState, useEffect, useCallback, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Testimonial {
    rating: number
    quote: string
    name: string
    role: string
    avatarGradient: string
    link?: string
    avatar?: { src: string; srcSet?: string; alt?: string }
}

interface TestimonialCarouselProps {
    testimonials: Testimonial[]
    autoPlay: boolean
    interval: number
    accentColor: string
    cardBackground: string
    cardBorderColor: string
    cardBorderRadius: number
    cardPadding: number
    quoteColor: string
    nameColor: string
    roleColor: string
    quoteFont: any
    nameFont: any
    roleFont: any
    arrowBackground: string
    arrowBackgroundHover: string
    arrowBorderColor: string
    arrowIconColor: string
    arrowIconColorHover: string
    style?: CSSProperties
}

/**
 * Auto-playing testimonial carousel with 3D depth perspective effect
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TestimonialCarousel(props: TestimonialCarouselProps) {
    const {
        testimonials,
        autoPlay,
        interval,
        accentColor,
        cardBackground,
        cardBorderColor,
        cardBorderRadius,
        cardPadding,
        quoteColor,
        nameColor,
        roleColor,
        quoteFont,
        nameFont,
        roleFont,
        arrowBackground,
        arrowBackgroundHover,
        arrowBorderColor,
        arrowIconColor,
        arrowIconColorHover,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const totalSlides = testimonials.length

    const goToNext = useCallback(() => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev + 1) % totalSlides)
        })
    }, [totalSlides])

    const goToPrev = useCallback(() => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
        })
    }, [totalSlides])

    const goToSlide = useCallback((index: number) => {
        startTransition(() => {
            setCurrentIndex(index)
        })
    }, [])

    // Detect mobile viewport
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => {
                setIsMobile(window.innerWidth < 768)
            })
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Auto-play functionality
    useEffect(() => {
        if (!autoPlay || isPaused) return

        const timer = setInterval(() => {
            goToNext()
        }, interval)

        return () => clearInterval(timer)
    }, [autoPlay, isPaused, interval, goToNext])

    // Touch handlers for swipe gestures
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
        const swipeThreshold = 50
        const diff = touchStartX.current - touchEndX.current

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                goToNext()
            } else {
                goToPrev()
            }
        }
    }

    const renderStars = (rating: number) => {
        return (
            <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill={star <= rating ? accentColor : "#444"}
                    >
                        <path d="M10 0l2.5 6.5L19 7.5l-5 4.5L15.5 19 10 15.5 4.5 19 6 12 1 7.5l6.5-1z" />
                    </svg>
                ))}
            </div>
        )
    }

    const getCardStyle = (index: number): CSSProperties => {
        const diff = index - currentIndex
        const absDiff = Math.abs(diff)

        if (isMobile) {
            // Mobile: simpler stacking, no side cards visible
            if (absDiff === 0) {
                return {
                    transform: "translateX(0) scale(1)",
                    opacity: 1,
                    zIndex: 3,
                }
            } else {
                return {
                    transform: "translateX(0) scale(0.9)",
                    opacity: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                }
            }
        }

        if (absDiff === 0) {
            // Front card
            return {
                transform: "translateX(0) scale(1) translateZ(0)",
                opacity: 1,
                zIndex: 3,
            }
        } else if (absDiff === 1 || (currentIndex === 0 && index === totalSlides - 1) || (currentIndex === totalSlides - 1 && index === 0)) {
            // Side cards
            const isRight = diff === 1 || (currentIndex === totalSlides - 1 && index === 0)
            return {
                transform: `translateX(${isRight ? "30%" : "-30%"}) scale(0.85) translateZ(-100px)`,
                opacity: 0.4,
                zIndex: 2,
            }
        } else {
            // Hidden cards
            return {
                transform: "translateX(0) scale(0.7) translateZ(-200px)",
                opacity: 0,
                zIndex: 1,
            }
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 24 : 40,
                padding: isMobile ? 10 : 20,
                position: "relative",
            }}
            onMouseEnter={() => startTransition(() => setIsPaused(true))}
            onMouseLeave={() => startTransition(() => setIsPaused(false))}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Carousel Container */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: isMobile ? "100%" : 600,
                    height: isMobile ? "auto" : 400,
                    minHeight: isMobile ? 350 : 400,
                    perspective: "1000px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {testimonials.map((testimonial, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                            ...getCardStyle(index),
                        }}
                    >
                        <a
                            href={testimonial.link || "#"}
                            target={testimonial.link ? "_blank" : undefined}
                            rel={testimonial.link ? "noopener noreferrer" : undefined}
                            style={{
                                textDecoration: "none",
                                display: "block",
                                width: "100%",
                                height: "100%",
                                cursor: testimonial.link ? "pointer" : "default",
                            }}
                            onClick={(e) => {
                                if (!testimonial.link) {
                                    e.preventDefault()
                                }
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    background: cardBackground,
                                    backdropFilter: "blur(10px)",
                                    borderRadius: isMobile ? Math.min(cardBorderRadius, 16) : cardBorderRadius,
                                    padding: isMobile ? Math.max(cardPadding * 0.6, 20) : cardPadding,
                                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: isMobile ? 16 : 24,
                                    border: `1px solid ${cardBorderColor}`,
                                    transition: "transform 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    if (testimonial.link) {
                                        e.currentTarget.style.transform = "translateY(-2px)"
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (testimonial.link) {
                                        e.currentTarget.style.transform = "translateY(0)"
                                    }
                                }}
                            >
                                {/* Stars */}
                                {renderStars(testimonial.rating)}

                                {/* Quote */}
                                <p
                                    style={{
                                        flex: 1,
                                        color: quoteColor,
                                        margin: 0,
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: isMobile ? 4 : 6,
                                        WebkitBoxOrient: "vertical",
                                        ...quoteFont,
                                        fontSize: isMobile
                                            ? `${Math.max(parseFloat(quoteFont.fontSize || "18") * 0.85, 14)}px`
                                            : quoteFont.fontSize,
                                    }}
                                >
                                    "{testimonial.quote}"
                                </p>

                                {/* Author */}
                                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 16 }}>
                                    {testimonial.avatar?.src ? (
                                        <img
                                            src={testimonial.avatar.src}
                                            srcSet={testimonial.avatar.srcSet}
                                            alt={testimonial.avatar.alt || testimonial.name}
                                            style={{
                                                width: isMobile ? 48 : 56,
                                                height: isMobile ? 48 : 56,
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: isMobile ? 48 : 56,
                                                height: isMobile ? 48 : 56,
                                                borderRadius: "50%",
                                                background: testimonial.avatarGradient,
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <div>
                                        <div
                                            style={{
                                                color: nameColor,
                                                marginBottom: 4,
                                                ...nameFont,
                                                fontSize: isMobile
                                                    ? `${Math.max(parseFloat(nameFont.fontSize || "16") * 0.9, 14)}px`
                                                    : nameFont.fontSize,
                                            }}
                                        >
                                            {testimonial.name}
                                        </div>
                                        <div
                                            style={{
                                                color: roleColor,
                                                ...roleFont,
                                                fontSize: isMobile
                                                    ? `${Math.max(parseFloat(roleFont.fontSize || "14") * 0.9, 12)}px`
                                                    : roleFont.fontSize,
                                            }}
                                        >
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                ))}

                {/* Navigation Arrows */}
                <button
                    onClick={goToPrev}
                    style={{
                        position: "absolute",
                        left: isMobile ? 10 : -60,
                        top: isMobile ? "auto" : "50%",
                        bottom: isMobile ? -70 : "auto",
                        transform: isMobile ? "translateX(0)" : "translateY(-50%)",
                        width: isMobile ? 44 : 48,
                        height: isMobile ? 44 : 48,
                        borderRadius: "50%",
                        background: arrowBackground,
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${arrowBorderColor}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                        zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                        if (!isMobile) {
                            e.currentTarget.style.background = arrowBackgroundHover
                            e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                            const svg = e.currentTarget.querySelector("svg")
                            if (svg) svg.setAttribute("stroke", arrowIconColorHover)
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isMobile) {
                            e.currentTarget.style.background = arrowBackground
                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                            const svg = e.currentTarget.querySelector("svg")
                            if (svg) svg.setAttribute("stroke", arrowIconColor)
                        }
                    }}
                    aria-label="Previous testimonial"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={arrowIconColor} strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                <button
                    onClick={goToNext}
                    style={{
                        position: "absolute",
                        right: isMobile ? 10 : -60,
                        top: isMobile ? "auto" : "50%",
                        bottom: isMobile ? -70 : "auto",
                        transform: isMobile ? "translateX(0)" : "translateY(-50%)",
                        width: isMobile ? 44 : 48,
                        height: isMobile ? 44 : 48,
                        borderRadius: "50%",
                        background: arrowBackground,
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${arrowBorderColor}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                        zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                        if (!isMobile) {
                            e.currentTarget.style.background = arrowBackgroundHover
                            e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                            const svg = e.currentTarget.querySelector("svg")
                            if (svg) svg.setAttribute("stroke", arrowIconColorHover)
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isMobile) {
                            e.currentTarget.style.background = arrowBackground
                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                            const svg = e.currentTarget.querySelector("svg")
                            if (svg) svg.setAttribute("stroke", arrowIconColor)
                        }
                    }}
                    aria-label="Next testimonial"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={arrowIconColor} strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            {/* Dot Indicators */}
            <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center", marginTop: isMobile ? 40 : 0 }}>
                {testimonials.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        style={{
                            width: currentIndex === index ? (isMobile ? 24 : 32) : isMobile ? 6 : 8,
                            height: isMobile ? 6 : 8,
                            borderRadius: 4,
                            background: currentIndex === index ? accentColor : "rgba(255, 255, 255, 0.3)",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            minWidth: isMobile ? 6 : 8,
                        }}
                        aria-label={`Go to testimonial ${index + 1}`}
                        aria-current={currentIndex === index}
                    />
                ))}
            </div>
        </div>
    )
}

addPropertyControls(TestimonialCarousel, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar Image",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    defaultValue: 5,
                    min: 1,
                    max: 5,
                    step: 1,
                    displayStepper: true,
                },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    defaultValue: "This product has completely transformed how we work. The attention to detail and user experience is outstanding.",
                    displayTextArea: true,
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Sarah Johnson",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "CEO, TechCorp",
                },
                avatarGradient: {
                    type: ControlType.String,
                    title: "Avatar Gradient (Fallback)",
                    defaultValue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                },
                link: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "",
                    placeholder: "https://example.com",
                },
            },
        },
        defaultValue: [
            {
                rating: 5,
                quote: "This product has completely transformed how we work. The attention to detail and user experience is outstanding.",
                name: "Sarah Johnson",
                role: "CEO, TechCorp",
                avatarGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                link: "",
            },
            {
                rating: 5,
                quote: "Incredible results in just a few weeks. The team is responsive and the platform is intuitive. Highly recommend!",
                name: "Michael Chen",
                role: "Product Manager, StartupXYZ",
                avatarGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                link: "",
            },
            {
                rating: 4,
                quote: "A game-changer for our business. The features are powerful yet easy to use. Customer support is top-notch.",
                name: "Emily Rodriguez",
                role: "Marketing Director, GrowthCo",
                avatarGradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                link: "",
            },
        ],
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 4000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#FFA500",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "rgba(30, 30, 35, 0.95)",
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 24,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        defaultValue: 40,
        min: 10,
        max: 80,
        step: 5,
        unit: "px",
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Regular",
            lineHeight: "1.6em",
        },
    },
    quoteColor: {
        type: ControlType.Color,
        title: "Quote Color",
        defaultValue: "#E0E0E0",
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
        },
    },
    nameColor: {
        type: ControlType.Color,
        title: "Name Color",
        defaultValue: "#FFFFFF",
    },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
        },
    },
    roleColor: {
        type: ControlType.Color,
        title: "Role Color",
        defaultValue: "#999999",
    },
    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow Background",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },
    arrowBackgroundHover: {
        type: ControlType.Color,
        title: "Arrow Bg Hover",
        defaultValue: "rgba(255, 255, 255, 0.2)",
    },
    arrowBorderColor: {
        type: ControlType.Color,
        title: "Arrow Border",
        defaultValue: "rgba(255, 255, 255, 0.2)",
    },
    arrowIconColor: {
        type: ControlType.Color,
        title: "Arrow Icon",
        defaultValue: "#FFFFFF",
    },
    arrowIconColorHover: {
        type: ControlType.Color,
        title: "Arrow Icon Hover",
        defaultValue: "#FFFFFF",
    },
})
