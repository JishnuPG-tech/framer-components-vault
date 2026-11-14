// Sticky Scroll Showcase component - Apple-style feature showcase with sticky content panel
// Left/right sticky text area updates as feature cards scroll into view
// Uses Intersection Observer for scroll detection with smooth transitions
// Responsive: stacks vertically on mobile

import { useEffect, useRef, useState, useMemo, startTransition, type CSSProperties } from "react"
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

interface FeatureImage {
    src: string
    alt?: string
    srcSet?: string
}

interface Feature {
    title: string
    description: string
    image: FeatureImage
    content?: string
    ctaText?: string
    ctaUrl?: string
}

interface StickyScrollShowcaseProps {
    features: Feature[]
    layoutDirection: "text-left" | "text-right"
    transitionStyle: "fade" | "slide" | "scale"
    accentColor: string
    backgroundColor: string
    cardBackground: string
    textColor: string
    titleFont: CSSProperties
    cardTitleFont: CSSProperties
    descriptionFont: CSSProperties
    showProgressDots: boolean
    ctaButtonFont: CSSProperties
    style?: CSSProperties
}

/**
 * Sticky Scroll Showcase
 * 
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 2400
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function StickyScrollShowcase(props: StickyScrollShowcaseProps) {
    const {
        features = [],
        layoutDirection = "text-left",
        transitionStyle = "fade",
        accentColor = "#0071E3",
        backgroundColor = "#FFFFFF",
        cardBackground = "#F5F5F5",
        textColor = "#000000",
        titleFont,
        cardTitleFont,
        descriptionFont,
        showProgressDots = true,
        ctaButtonFont,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const observerRefs = useRef<(HTMLDivElement | null)[]>([])
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)

    // Check if mobile or tablet
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkViewport = () => {
            const width = window.innerWidth
            startTransition(() => {
                setIsMobile(width < 768)
                setIsTablet(width >= 768 && width < 1024)
            })
        }

        checkViewport()
        window.addEventListener("resize", checkViewport)

        return () => window.removeEventListener("resize", checkViewport)
    }, [])

    // Set up Intersection Observer
    useEffect(() => {
        if (typeof window === "undefined") return

        const observers: IntersectionObserver[] = []

        observerRefs.current.forEach((ref, index) => {
            if (!ref) return

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            startTransition(() => setActiveIndex(index))
                        }
                    })
                },
                {
                    threshold: 0.6,
                    rootMargin: "-20% 0px -20% 0px",
                }
            )

            observer.observe(ref)
            observers.push(observer)
        })

        return () => {
            observers.forEach((observer) => observer.disconnect())
        }
    }, [features.length])

    const activeFeature = useMemo(() => {
        return features[activeIndex] || features[0]
    }, [activeIndex, features])

    // Responsive values
    const responsiveValues = useMemo(() => {
        if (isMobile) {
            return {
                containerPadding: "32px 16px",
                gap: 32,
                stickyTop: 20,
                stickyMinHeight: 280,
                imageHeight: 180,
                cardMinHeight: 180,
                cardGap: 240,
                cardPadding: 20,
                cardBorderRadius: 16,
                contentGap: 16,
                progressDotsMarginTop: 12,
                titleFontSize: "28px",
                cardTitleFontSize: "20px",
            }
        } else if (isTablet) {
            return {
                containerPadding: "60px 40px",
                gap: 60,
                stickyTop: 60,
                stickyMinHeight: 400,
                imageHeight: 240,
                cardMinHeight: 240,
                cardGap: 320,
                cardPadding: 32,
                cardBorderRadius: 18,
                contentGap: 20,
                progressDotsMarginTop: 16,
                titleFontSize: "36px",
                cardTitleFontSize: "22px",
            }
        } else {
            return {
                containerPadding: "80px 60px",
                gap: 80,
                stickyTop: 80,
                stickyMinHeight: 0,
                imageHeight: 300,
                cardMinHeight: 300,
                cardGap: 400,
                cardPadding: 40,
                cardBorderRadius: 20,
                contentGap: 24,
                progressDotsMarginTop: 16,
                titleFontSize: titleFont.fontSize || "40px",
                cardTitleFontSize: cardTitleFont.fontSize || "24px",
            }
        }
    }, [isMobile, isTablet, titleFont.fontSize, cardTitleFont.fontSize])

    const transitionVariants = useMemo(() => {
        switch (transitionStyle) {
            case "slide":
                return {
                    initial: { opacity: 0, x: -30 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: 30 },
                }
            case "scale":
                return {
                    initial: { opacity: 0, scale: 0.9 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.9 },
                }
            default: // fade
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                }
        }
    }, [transitionStyle])

    const isTextLeft = layoutDirection === "text-left"

    if (features.length === 0) {
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
                    ...descriptionFont,
                }}
            >
                Add features to get started
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "auto",
                position: "relative",
            }}
        >
            {isMobile ? (
                // Mobile: Stacked card layout
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                        padding: "32px 16px",
                    }}
                >
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: cardBackground,
                                borderRadius: 20,
                                overflow: "hidden",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            }}
                        >
                            {/* Image */}
                            {feature.image && (
                                <div
                                    style={{
                                        width: "100%",
                                        height: 200,
                                        overflow: "hidden",
                                    }}
                                >
                                    <img
                                        src={feature.image.src || ""}
                                        srcSet={feature.image.srcSet}
                                        alt={feature.image.alt || ""}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            )}
                            
                            {/* Content */}
                            <div
                                style={{
                                    padding: 24,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                {/* Title */}
                                <h2
                                    style={{
                                        margin: 0,
                                        color: textColor,
                                        ...titleFont,
                                        fontSize: "24px",
                                    }}
                                >
                                    {feature.title}
                                </h2>

                                {/* Description */}
                                <p
                                    style={{
                                        margin: 0,
                                        color: textColor,
                                        opacity: 0.7,
                                        ...descriptionFont,
                                        fontSize: "14px",
                                    }}
                                >
                                    {feature.description}
                                </p>

                                {/* Content Details */}
                                {feature.content && (
                                    <div
                                        style={{
                                            padding: "16px",
                                            backgroundColor: backgroundColor,
                                            borderRadius: 12,
                                            color: textColor,
                                            opacity: 0.8,
                                            ...descriptionFont,
                                            fontSize: "13px",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {feature.content}
                                    </div>
                                )}

                                {/* CTA Button */}
                                {feature.ctaText && (
                                    <a
                                        href={feature.ctaUrl || "#"}
                                        target={feature.ctaUrl && feature.ctaUrl.startsWith("http") ? "_blank" : "_self"}
                                        rel={feature.ctaUrl && feature.ctaUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                                        style={{
                                            padding: "12px 24px",
                                            backgroundColor: accentColor,
                                            color: "#FFFFFF",
                                            borderRadius: 10,
                                            textDecoration: "none",
                                            display: "inline-block",
                                            alignSelf: "flex-start",
                                            transition: "opacity 0.2s ease",
                                            cursor: "pointer",
                                            ...ctaButtonFont,
                                            fontSize: "14px",
                                        }}
                                    >
                                        {feature.ctaText}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Desktop/Tablet: Original sticky layout
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        minHeight: "100%",
                        gap: 80,
                        padding: "80px 60px",
                    }}
                >
                    {/* Sticky Content Panel */}
                    <div
                        style={{
                            flex: 1,
                            position: "sticky",
                            top: responsiveValues.stickyTop,
                            height: `calc(100vh - ${responsiveValues.stickyTop * 2}px)`,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            order: isTextLeft ? 1 : 2,
                            minHeight: responsiveValues.stickyMinHeight,
                        }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                variants={transitionVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: responsiveValues.contentGap,
                                }}
                            >
                                {/* Image */}
                                {activeFeature?.image && (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: responsiveValues.imageHeight,
                                            borderRadius: responsiveValues.cardBorderRadius,
                                            overflow: "hidden",
                                            backgroundColor: cardBackground,
                                        }}
                                    >
                                        <img
                                            src={activeFeature.image.src || ""}
                                            srcSet={activeFeature.image.srcSet}
                                            alt={activeFeature.image.alt || ""}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Title */}
                                <h2
                                    style={{
                                        margin: 0,
                                        color: textColor,
                                        ...titleFont,
                                        fontSize: responsiveValues.titleFontSize,
                                    }}
                                >
                                    {activeFeature?.title || ""}
                                </h2>

                                {/* Description */}
                                <p
                                    style={{
                                        margin: 0,
                                        color: textColor,
                                        opacity: 0.7,
                                        ...descriptionFont,
                                    }}
                                >
                                    {activeFeature?.description || ""}
                                </p>

                                {/* Progress Dots */}
                                {showProgressDots && (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            marginTop: responsiveValues.progressDotsMarginTop,
                                        }}
                                    >
                                        {features.map((_, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    width: isMobile ? 6 : 8,
                                                    height: isMobile ? 6 : 8,
                                                    borderRadius: "50%",
                                                    backgroundColor:
                                                        index === activeIndex ? accentColor : cardBackground,
                                                    transition: "background-color 0.3s ease",
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Scrolling Feature Cards */}
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: responsiveValues.cardGap,
                            order: isTextLeft ? 2 : 1,
                        }}
                    >
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                ref={(el) => {
                                    observerRefs.current[index] = el
                                }}
                                style={{
                                    minHeight: responsiveValues.cardMinHeight,
                                    backgroundColor: cardBackground,
                                    borderRadius: responsiveValues.cardBorderRadius,
                                    padding: responsiveValues.cardPadding,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: isMobile ? 12 : 16,
                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                    transform: index === activeIndex ? "scale(1)" : "scale(0.95)",
                                    boxShadow:
                                        index === activeIndex
                                            ? "0 8px 24px rgba(0,0,0,0.12)"
                                            : "0 2px 8px rgba(0,0,0,0.06)",
                                    cursor: isMobile ? "default" : "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        width: isMobile ? 32 : 40,
                                        height: isMobile ? 3 : 4,
                                        borderRadius: 2,
                                        backgroundColor: index === activeIndex ? accentColor : "#CCCCCC",
                                        transition: "background-color 0.3s ease",
                                    }}
                                />
                                {feature.content && (
                                    <div
                                        style={{
                                            marginTop: 0,
                                            padding: isMobile ? "12px" : "16px",
                                            backgroundColor: backgroundColor,
                                            borderRadius: isMobile ? 12 : 14,
                                            color: textColor,
                                            opacity: 0.8,
                                            ...descriptionFont,
                                            fontSize: isMobile ? "13px" : "14px",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {feature.content}
                                    </div>
                                )}
                                {feature.ctaText && (
                                    <a
                                        href={feature.ctaUrl || "#"}
                                        target={feature.ctaUrl && feature.ctaUrl.startsWith("http") ? "_blank" : "_self"}
                                        rel={feature.ctaUrl && feature.ctaUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                                        style={{
                                            marginTop: isMobile ? 8 : 12,
                                            padding: isMobile ? "10px 20px" : "12px 24px",
                                            backgroundColor: accentColor,
                                            color: "#FFFFFF",
                                            borderRadius: isMobile ? 8 : 10,
                                            textDecoration: "none",
                                            display: "inline-block",
                                            alignSelf: "flex-start",
                                            transition: "transform 0.2s ease, opacity 0.2s ease",
                                            cursor: "pointer",
                                            ...ctaButtonFont,
                                            fontSize: isMobile ? "13px" : ctaButtonFont.fontSize,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = "0.9"
                                            e.currentTarget.style.transform = "translateY(-1px)"
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = "1"
                                            e.currentTarget.style.transform = "translateY(0)"
                                        }}
                                    >
                                        {feature.ctaText}
                                    </a>
                                )}
                            </div>
                        ))}
                        {/* Spacer at the end */}
                        <div style={{ minHeight: responsiveValues.cardGap }} />
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(StickyScrollShowcase, {
    features: {
        type: ControlType.Array,
        title: "Features",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Feature Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Feature description goes here with details about this amazing capability.",
                    displayTextArea: true,
                },
                content: {
                    type: ControlType.String,
                    title: "Content Details",
                    defaultValue: "",
                    displayTextArea: true,
                },
                ctaText: {
                    type: ControlType.String,
                    title: "CTA Button Text",
                    defaultValue: "",
                },
                ctaUrl: {
                    type: ControlType.String,
                    title: "CTA Button URL",
                    defaultValue: "",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: [
            {
                title: "Powerful Performance",
                description: "Experience lightning-fast speeds with our advanced processing technology that handles any task with ease.",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Performance feature",
                },
            },
            {
                title: "Beautiful Design",
                description: "Crafted with attention to every detail, delivering an elegant and intuitive user experience.",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design feature",
                },
            },
            {
                title: "Seamless Integration",
                description: "Works perfectly with your existing workflow and connects with all your favorite tools.",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Integration feature",
                },
            },
            {
                title: "Advanced Security",
                description: "Your data is protected with enterprise-grade encryption and security measures.",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Security feature",
                },
            },
        ],
        maxCount: 8,
    },
    layoutDirection: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["text-left", "text-right"],
        optionTitles: ["Text Left", "Text Right"],
        defaultValue: "text-left",
        displaySegmentedControl: true,
    },
    transitionStyle: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["fade", "slide", "scale"],
        optionTitles: ["Fade", "Slide", "Scale"],
        defaultValue: "fade",
        displaySegmentedControl: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#0071E3",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#F5F5F5",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Main Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    cardTitleFont: {
        type: ControlType.Font,
        title: "Card Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    showProgressDots: {
        type: ControlType.Boolean,
        title: "Progress Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ctaButtonFont: {
        type: ControlType.Font,
        title: "CTA Button Font",
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
