import * as React from "react"
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

/**
 * Create a new Framer code component file exporting a component with display name "HoverExpand".
 * Build an accessible focus-slice carousel with editable slides, active/collapsed panel behavior, motion timing,
 * responsive mobile stacking, SSR safety, and reduced-motion support.
 */

interface SlideItem {
    id: string
    image?: { src?: string; srcSet?: string; alt?: string } | string
    imagePosition?: "center" | "top" | "bottom" | "left" | "right"
    title: string
    subtitle: string
    link: string
}

interface HoverExpandProps {
    slides: SlideItem[]
    activeWidth: number
    gap: number
    cornerRadius: number
    height: number
    mobileHeight: number
    mobileBreakpoint: number
    transitionDuration: number
    titleFont: {
        fontSize?: number | string
        lineHeight?: number | string
        letterSpacing?: number | string
        fontWeight?: number
        fontStyle?: "normal" | "italic"
        textAlign?: "left" | "center" | "right"
        fontFamily?: string
    }
    subtitleFont: {
        fontSize?: number | string
        lineHeight?: number | string
        letterSpacing?: number | string
        fontWeight?: number
        fontStyle?: "normal" | "italic"
        textAlign?: "left" | "center" | "right"
        fontFamily?: string
    }
    textColor: string
    arrowButtonBackground: string
    arrowIconColor: string
    style?: React.CSSProperties
}

/**
 * @framerSupportsResizing
 * @framerIntrinsicWidth 980
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HoverExpand(props: HoverExpandProps) {
    const {
        slides = [
            {
                id: "slide-1",
                image: {
                    src: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
                    alt: "Leather tub sofa in soft light",
                },
                imagePosition: "center",
                title: "Quiet Morning Light",
                subtitle: "A calm opening frame for the day.",
                link: "#",
            },
            {
                id: "slide-2",
                image: {
                    src: "https://images.unsplash.com/photo-1602128110234-2d11c0aaadfe?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
                    alt: "Trees beside a white concrete building",
                },
                imagePosition: "center",
                title: "City Notes",
                subtitle: "Fragments of movement and rhythm.",
                link: "#",
            },
            {
                id: "slide-3",
                image: {
                    src: "https://images.unsplash.com/photo-1543067361-9bf996edf6ff?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
                    alt: "White wooden cabinet with mirror",
                },
                imagePosition: "center",
                title: "Soft Materials",
                subtitle: "Tactile surfaces, neutral tones.",
                link: "#",
            },
            {
                id: "slide-4",
                image: {
                    src: "https://images.unsplash.com/photo-1622396481322-3b83d186701b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
                    alt: "White concrete building under blue sky",
                },
                imagePosition: "center",
                title: "Afterglow",
                subtitle: "An understated closing vignette.",
                link: "#",
            },
        ],
        activeWidth = 45,
        gap = 12,
        cornerRadius = 24,
        height = 500,
        mobileHeight = 300,
        mobileBreakpoint = 768,
        transitionDuration = 0.5,
        titleFont = {
            fontSize: 28,
            lineHeight: "1.05em",
            letterSpacing: "-0.02em",
            fontWeight: 600,
            fontStyle: "normal",
            textAlign: "left",
        },
        subtitleFont = {
            fontSize: 15,
            lineHeight: "1.3em",
            letterSpacing: "-0.01em",
            fontWeight: 500,
            fontStyle: "normal",
            textAlign: "left",
        },
        textColor = "#FFFFFF",
        arrowButtonBackground = "#FFFFFF",
        arrowIconColor = "#000000",
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const [activeIndex, setActiveIndex] = React.useState(0)
    const [isMobile, setIsMobile] = React.useState(false)
    const [reducedMotion, setReducedMotion] = React.useState(false)

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const media = window.matchMedia(
                `(max-width: ${mobileBreakpoint}px)`
            )
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")

            const handleViewport = () => {
                React.startTransition(() => setIsMobile(media.matches))
            }
            const handleReduce = () => {
                React.startTransition(() => setReducedMotion(reduce.matches))
            }

            handleViewport()
            handleReduce()

            media.addEventListener("change", handleViewport)
            reduce.addEventListener("change", handleReduce)

            return () => {
                media.removeEventListener("change", handleViewport)
                reduce.removeEventListener("change", handleReduce)
            }
        } else {
            React.startTransition(() => setIsMobile(false))
            React.startTransition(() => setReducedMotion(false))
        }
    }, [mobileBreakpoint])

    const safeSlides = React.useMemo(() => {
        if (!slides || slides.length === 0) return []
        return slides.map((slide, index) => ({
            id: slide.id || `slide-${index + 1}`,
            image: slide.image,
            imagePosition: slide.imagePosition || "center",
            title: slide.title || `Slide ${index + 1}`,
            subtitle: slide.subtitle || "",
            link: slide.link || "#",
        }))
    }, [slides])

    React.useEffect(() => {
        if (activeIndex > safeSlides.length - 1) {
            React.startTransition(() => setActiveIndex(0))
        }
    }, [safeSlides.length, activeIndex])

    const panelCount = Math.max(safeSlides.length, 1)
    const inactiveShare = React.useMemo(() => {
        if (panelCount <= 1) return 100
        return (100 - activeWidth) / (panelCount - 1)
    }, [activeWidth, panelCount])

    const motionDuration =
        reducedMotion || isStaticRenderer ? 0.01 : transitionDuration
    const contentDelay = reducedMotion || isStaticRenderer ? 0 : 0.15

    const getImageSrc = React.useCallback((image: SlideItem["image"]) => {
        if (!image) return ""
        if (typeof image === "string") return image
        return image.src || ""
    }, [])

    const activate = React.useCallback((index: number) => {
        React.startTransition(() => setActiveIndex(index))
    }, [])

    if (safeSlides.length === 0) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height,
                    background: "#F5F5F5",
                    borderRadius: cornerRadius,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                    ...style,
                }}
            >
                Add slides
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: isMobile ? mobileHeight : height,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap,
                ...style,
            }}
        >
            <style>{`
                .focus-slice-panel:focus-visible {
                    outline: 2px solid #3B82F6;
                    outline-offset: 2px;
                }
            `}</style>
            {safeSlides.map((slide, index) => {
                const isActive = index === activeIndex
                const imageSrc = getImageSrc(slide.image)
                const sharedTransition = {
                    duration: motionDuration,
                    ease: "easeInOut" as const,
                }
                const panelGrow = isActive ? activeWidth : inactiveShare

                return (
                    <motion.div
                        key={slide.id}
                        className="focus-slice-panel"
                        role="button"
                        tabIndex={0}
                        aria-label={slide.title}
                        aria-expanded={isActive}
                        aria-current={isActive ? "true" : undefined}
                        onMouseEnter={() => {
                            if (!isMobile && !isStaticRenderer && !isActive)
                                activate(index)
                        }}
                        onClick={() => {
                            if (isMobile || !isActive) activate(index)
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                activate(index)
                            }
                        }}
                        whileHover={
                            !isMobile &&
                            !isActive &&
                            !isStaticRenderer &&
                            !reducedMotion
                                ? { scale: 1.02 }
                                : undefined
                        }
                        animate={{
                            flexGrow: panelGrow,
                        }}
                        transition={sharedTransition}
                        style={{
                            position: "relative",
                            minWidth: 0,
                            minHeight: isMobile ? 0 : "100%",
                            width: isMobile ? "100%" : undefined,
                            flexBasis: 0,
                            overflow: "hidden",
                            borderRadius: cornerRadius,
                            cursor: !isActive ? "pointer" : "default",
                            background: imageSrc ? "#D9D9D9" : "#DDDDDD",
                        }}
                    >
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                alt={slide.title || ""}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    objectPosition:
                                        slide.imagePosition || "center",
                                }}
                            />
                        ) : null}

                        {isActive ? (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0) 70%)",
                                    pointerEvents: "none",
                                }}
                            />
                        ) : null}

                        <AnimatePresence initial={false}>
                            {isActive ? (
                                <motion.div
                                    key={`content-${slide.id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 0 }}
                                    transition={{
                                        opacity: {
                                            duration: reducedMotion
                                                ? 0.01
                                                : 0.15,
                                            delay: contentDelay,
                                        },
                                        y: {
                                            duration: reducedMotion
                                                ? 0.01
                                                : 0.22,
                                            delay: contentDelay,
                                        },
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: 20,
                                        right: 20,
                                        bottom: 20,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        gap: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            color: textColor,
                                            fontSize: titleFont.fontSize,
                                            lineHeight: titleFont.lineHeight,
                                            letterSpacing:
                                                titleFont.letterSpacing,
                                            fontWeight: titleFont.fontWeight,
                                            fontStyle: titleFont.fontStyle,
                                            textAlign: titleFont.textAlign,
                                            fontFamily: titleFont.fontFamily,
                                        }}
                                    >
                                        {slide.title}
                                    </div>
                                    <div
                                        style={{
                                            color: textColor,
                                            fontSize: subtitleFont.fontSize,
                                            lineHeight: subtitleFont.lineHeight,
                                            letterSpacing:
                                                subtitleFont.letterSpacing,
                                            fontWeight: subtitleFont.fontWeight,
                                            fontStyle: subtitleFont.fontStyle,
                                            textAlign: subtitleFont.textAlign,
                                            fontFamily: subtitleFont.fontFamily,
                                            opacity: 0.92,
                                        }}
                                    >
                                        {slide.subtitle}
                                    </div>
                                    <Link href={slide.link}>
                                        <a
                                            aria-label={`Open ${slide.title}`}
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "999px",
                                                border: "none",
                                                background:
                                                    arrowButtonBackground,
                                                color: arrowIconColor,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                textDecoration: "none",
                                            }}
                                        >
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M7 12H17M17 12L12 7M17 12L12 17"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </a>
                                    </Link>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </motion.div>
                )
            })}
        </div>
    )
}

addPropertyControls(HoverExpand, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        defaultValue: [
            {
                id: "slide-1",
                image: {
                    src: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
                    alt: "Leather tub sofa in soft light",
                },
                imagePosition: "center",
                title: "Quiet Morning Light",
                subtitle: "A calm opening frame for the day.",
                link: "#",
            },
            {
                id: "slide-2",
                image: {
                    src: "https://images.unsplash.com/photo-1602128110234-2d11c0aaadfe?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
                    alt: "Trees beside a white concrete building",
                },
                imagePosition: "center",
                title: "City Notes",
                subtitle: "Fragments of movement and rhythm.",
                link: "#",
            },
            {
                id: "slide-3",
                image: {
                    src: "https://images.unsplash.com/photo-1543067361-9bf996edf6ff?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
                    alt: "White wooden cabinet with mirror",
                },
                imagePosition: "center",
                title: "Soft Materials",
                subtitle: "Tactile surfaces, neutral tones.",
                link: "#",
            },
            {
                id: "slide-4",
                image: {
                    src: "https://images.unsplash.com/photo-1622396481322-3b83d186701b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
                    alt: "White concrete building under blue sky",
                },
                imagePosition: "center",
                title: "Afterglow",
                subtitle: "An understated closing vignette.",
                link: "#",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    title: "ID",
                    defaultValue: "slide",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imagePosition: {
                    type: ControlType.Enum,
                    title: "Image Pos",
                    options: ["center", "top", "bottom", "left", "right"],
                    optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
                    defaultValue: "center",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Subtitle",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "#",
                },
            },
        },
    },
    activeWidth: {
        type: ControlType.Number,
        title: "Active %",
        min: 30,
        max: 80,
        step: 1,
        defaultValue: 45,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 12,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 24,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        min: 200,
        max: 900,
        step: 1,
        defaultValue: 500,
    },
    mobileHeight: {
        type: ControlType.Number,
        title: "Mobile H",
        min: 160,
        max: 700,
        step: 1,
        defaultValue: 300,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile BP",
        min: 320,
        max: 1280,
        step: 1,
        defaultValue: 768,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.5,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            lineHeight: "1.05em",
            letterSpacing: "-0.02em",
            variant: "Semibold",
            textAlign: "left",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            lineHeight: "1.3em",
            letterSpacing: "-0.01em",
            variant: "Medium",
            textAlign: "left",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    arrowButtonBackground: {
        type: ControlType.Color,
        title: "Btn BG",
        defaultValue: "#FFFFFF",
    },
    arrowIconColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "#000000",
    },
})
