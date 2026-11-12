import * as React from "react"
import { useState, useRef, useEffect } from "react"
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

interface SlideItem {
    title: string
    backgroundColor: string
    mainImage: string
}

interface SliderProps {
    width: number
    height: number
    slides: SlideItem[]
    mainWidth: number
    mainHeight: number
    sideWidth: number
    sideHeight: number
    stiffness: number
    damping: number
    padding: number
    autoplay: boolean
    autoplayDelay: number

    contentMaxWidth: number
    mobileGap: number

    textOptions: {
        titleFont: any
        titleColor: string
        titleSize: number
        titleLineHeight: number
        titleLetterSpacing: number
    }

    arrowOptions: {
        showArrows: boolean
        arrowLayout: "Separate" | "Together"
        arrowPlacement: "top" | "center" | "bottom"
        arrowGroupPosition:
            | "Top Left"
            | "Top Center"
            | "Top Right"
            | "Bottom Left"
            | "Bottom Center"
            | "Bottom Right"
        arrowSize: number
        arrowRadius: number
        arrowOffset: number
        arrowBgColor: string
        arrowHoverBgColor: string
        arrowHoverScale: number
        arrowIconColor: string
        useCustomIcon: boolean
        customLeftIcon: string
        customRightIcon: string
    }
}

const defaultSlides: SlideItem[] = [
    {
        title: "Monza",
        backgroundColor: "#1A0F0F",
        mainImage:
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    },
    {
        title: "Stratos",
        backgroundColor: "#11161B",
        mainImage:
            "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
    },
    {
        title: "Apex",
        backgroundColor: "#0E1813",
        mainImage:
            "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    },
    {
        title: "Modena",
        backgroundColor: "#36232D",
        mainImage:
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    },
]

export default function AnimatedImgSlider(props: SliderProps) {
    const {
        slides,
        height,
        mainWidth,
        mainHeight,
        sideWidth,
        sideHeight,
        stiffness,
        damping,
        padding,
        autoplay,
        autoplayDelay,
        contentMaxWidth,
        mobileGap,
        textOptions,
        arrowOptions,
    } = props

    const {
        titleFont,
        titleColor,
        titleSize,
        titleLineHeight,
        titleLetterSpacing,
    } = textOptions || {}

    const {
        showArrows,
        arrowLayout,
        arrowPlacement,
        arrowGroupPosition,
        arrowSize,
        arrowRadius,
        arrowOffset,
        arrowBgColor,
        arrowHoverBgColor,
        arrowHoverScale,
        arrowIconColor,
        useCustomIcon,
        customLeftIcon,
        customRightIcon,
    } = arrowOptions || {}

    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(1)
    const [isHovered, setIsHovered] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isInView, setIsInView] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const autoplayIntervalRef = useRef<number | null>(null)

    // Framer Hook to determine if we are in a static context (canvas or site export generation)
    const isStatic = useIsStaticRenderer()

    // Ensure we fall back immediately if slides array is unpopulated or missing items
    const activeSlides = slides && slides.length > 0 ? slides : defaultSlides
    const total = activeSlides.length

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Intersection Observer to track viewport visibility
    useEffect(() => {
        if (isStatic || !autoplay) {
            setIsInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)
            },
            { threshold: 0.05 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [isStatic, autoplay])

    const centerIdx = ((currentIndex % total) + total) % total
    const prevIdx = (centerIdx - 1 + total) % total
    const nextIdx = (centerIdx + 1) % total

    const outgoingIdx = direction === 1 ? prevIdx : nextIdx
    const currentSlide = activeSlides[centerIdx] || defaultSlides[0]

    const handleNext = () => {
        if (currentIndex < total - 1 || autoplay) {
            setDirection(1)
            setCurrentIndex((prev) => (prev + 1) % total)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0 || autoplay) {
            setDirection(-1)
            setCurrentIndex((prev) => (prev - 1 + total) % total)
        }
    }

    const handleNextRef = useRef(handleNext)
    useEffect(() => {
        handleNextRef.current = handleNext
    })

    useEffect(() => {
        // Stop background interval processes if loop is disabled, framed statically, or off-screen
        if (!autoplay || total <= 1 || isStatic || !isInView) return

        autoplayIntervalRef.current = window.setInterval(() => {
            handleNextRef.current()
        }, autoplayDelay * 1000)

        return () => {
            if (autoplayIntervalRef.current !== null) {
                clearInterval(autoplayIntervalRef.current)
                autoplayIntervalRef.current = null
            }
        }
    }, [autoplay, autoplayDelay, total, isStatic, isInView])

    const baseImageStyle = {
        position: "absolute" as const,
        objectFit: "cover" as const,
        cursor: "pointer",
    }

    const waveTransition = {
        type: "spring",
        stiffness: stiffness,
        damping: damping,
        mass: 0.8,
    }

    const bottomY = 92
    const bottomX = -30
    const bottomRotate = 12

    const resolveTypography = (
        fontObject: any,
        customSize: number,
        customLineHeight: number,
        customLetterSpacing: number,
        defaultWeight: string
    ) => {
        if (!fontObject) return {}
        return {
            fontFamily:
                fontObject.fontFamily ||
                "-apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: customSize,
            fontWeight: fontObject.fontWeight || defaultWeight,
            letterSpacing: `${customLetterSpacing}em`,
            lineHeight: customLineHeight,
        }
    }

    const arrowVariants = {
        rest: { scale: 1, backgroundColor: arrowBgColor },
        hover: { scale: arrowHoverScale, backgroundColor: arrowHoverBgColor },
    }

    const baseArrowStyle: React.CSSProperties = {
        border: "none",
        outline: "none",
        cursor: "pointer",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        color: arrowIconColor,
        width: arrowSize,
        height: arrowSize,
        borderRadius: arrowRadius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition:
            "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease",
        padding: 0,
        boxSizing: "border-box",
    }

    const getGroupPositionStyles = (): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            position: "absolute",
            zIndex: 50,
            display: "flex",
            gap: 12,
        }
        const effectivePadding = isMobile ? 24 : padding
        const currentPosition = arrowGroupPosition || "Bottom Right"

        switch (currentPosition) {
            case "Top Left":
                return {
                    ...baseStyles,
                    top: effectivePadding + arrowOffset,
                    left: effectivePadding,
                }
            case "Top Center":
                return {
                    ...baseStyles,
                    top: effectivePadding + arrowOffset,
                    left: "50%",
                    transform: "translateX(-50%)",
                }
            case "Top Right":
                return {
                    ...baseStyles,
                    top: effectivePadding + arrowOffset,
                    right: effectivePadding,
                }
            case "Bottom Left":
                return {
                    ...baseStyles,
                    bottom: effectivePadding + arrowOffset,
                    left: effectivePadding,
                }
            case "Bottom Center":
                return {
                    ...baseStyles,
                    bottom: effectivePadding + arrowOffset,
                    left: "50%",
                    transform: "translateX(-50%)",
                }
            case "Bottom Right":
            default:
                return {
                    ...baseStyles,
                    bottom: effectivePadding + arrowOffset,
                    right: effectivePadding,
                }
        }
    }

    const getContainerStyles = (): React.CSSProperties => {
        if (arrowLayout === "Together") return getGroupPositionStyles()
        return {
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 50,
        }
    }

    if (isStatic) {
        return (
            <div ref={containerRef} style={{ width: "100%", height: height }}>
                <div
                    style={{
                        position: "relative",
                        top: 0,
                        left: 0,
                        right: 0,
                        width: "100%",
                        height: height,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: isMobile ? "center" : "space-between",
                        padding: isMobile ? 24 : padding,
                        overflow: "hidden",
                        boxSizing: "border-box",
                        userSelect: "none",
                        backgroundColor:
                            currentSlide?.backgroundColor || "#1A0F0F",
                    }}
                >
                    <div style={{ height: isMobile ? 0 : 12 }} />

                    <div
                        style={{
                            display: "flex",
                            width: "100%",
                            height: isMobile ? "auto" : "100%",
                            maxWidth: isMobile ? "100%" : contentMaxWidth,
                            marginLeft: "auto",
                            marginRight: "auto",
                            alignItems: "center",
                            justifyContent: isMobile
                                ? "center"
                                : "space-between",
                            marginTop: isMobile ? 0 : 16,
                            position: "relative",
                            flexDirection: isMobile ? "column" : "row",
                            gap: isMobile ? mobileGap : 0,
                        }}
                    >
                        <div
                            style={{
                                width: isMobile ? "100%" : "50%",
                                zIndex: 10,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                textAlign: isMobile ? "center" : "left",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    color: titleColor,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    ...resolveTypography(
                                        titleFont,
                                        titleSize,
                                        titleLineHeight,
                                        titleLetterSpacing,
                                        "800"
                                    ),
                                }}
                            >
                                {currentSlide?.title || ""}
                            </h2>
                        </div>

                        <div
                            style={{
                                width: isMobile ? "100%" : "50%",
                                height: isMobile ? "auto" : "100%",
                                minHeight: isMobile ? mainHeight : "auto",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft: isMobile ? 0 : "-5%",
                            }}
                        >
                            {!isMobile && activeSlides[prevIdx] && (
                                <img
                                    src={activeSlides[prevIdx].mainImage}
                                    style={{
                                        ...baseImageStyle,
                                        width: sideWidth,
                                        height: sideHeight,
                                        zIndex: 2,
                                        pointerEvents: "none",
                                        transform:
                                            "translateX(-95px) translateY(-90%) scale(1.1) rotate(-16deg)",
                                        opacity: 0.4,
                                    }}
                                />
                            )}

                            {currentSlide && (
                                <img
                                    src={currentSlide.mainImage}
                                    style={{
                                        ...baseImageStyle,
                                        width: mainWidth,
                                        height: mainHeight,
                                        maxWidth: "100%",
                                        borderRadius: 16,
                                        zIndex: 4,
                                    }}
                                />
                            )}

                            {!isMobile && activeSlides[nextIdx] && (
                                <img
                                    src={activeSlides[nextIdx].mainImage}
                                    style={{
                                        ...baseImageStyle,
                                        width: sideWidth,
                                        height: sideHeight,
                                        zIndex: 1,
                                        pointerEvents: "none",
                                        transform: `translateY(${bottomY}%) translateX(${bottomX}px) rotate(${bottomRotate}deg) scale(0.85)`,
                                        opacity: 0.4,
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {showArrows && (
                        <div style={getContainerStyles()}>
                            <button
                                style={{
                                    ...baseArrowStyle,
                                    backgroundColor: arrowBgColor,
                                    pointerEvents: "none",
                                    ...(arrowLayout === "Separate"
                                        ? {
                                              position: "absolute",
                                              left: isMobile
                                                  ? 16
                                                  : padding + arrowOffset,
                                              top:
                                                  arrowPlacement === "top"
                                                      ? padding
                                                      : arrowPlacement ===
                                                          "bottom"
                                                        ? "auto"
                                                        : "50%",
                                              bottom:
                                                  arrowPlacement === "bottom"
                                                      ? padding
                                                      : "auto",
                                              transform:
                                                  arrowPlacement === "center"
                                                      ? "translateY(-50%)"
                                                      : "none",
                                          }
                                        : {}),
                                }}
                                aria-label="Previous Slide"
                            >
                                {useCustomIcon && customLeftIcon ? (
                                    <img
                                        src={customLeftIcon}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain",
                                            borderRadius: arrowRadius,
                                        }}
                                        alt="Prev"
                                    />
                                ) : (
                                    <svg
                                        width="45%"
                                        height="45%"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line
                                            x1="19"
                                            y1="12"
                                            x2="5"
                                            y2="12"
                                        ></line>
                                        <polyline points="12 19 5 12 12 5"></polyline>
                                    </svg>
                                )}
                            </button>

                            <button
                                style={{
                                    ...baseArrowStyle,
                                    backgroundColor: arrowBgColor,
                                    pointerEvents: "none",
                                    ...(arrowLayout === "Separate"
                                        ? {
                                              position: "absolute",
                                              right: isMobile
                                                  ? 16
                                                  : padding + arrowOffset,
                                              top:
                                                  arrowPlacement === "top"
                                                      ? padding
                                                      : arrowPlacement ===
                                                          "bottom"
                                                        ? "auto"
                                                        : "50%",
                                              bottom:
                                                  arrowPlacement === "bottom"
                                                      ? padding
                                                      : "auto",
                                              transform:
                                                  arrowPlacement === "center"
                                                      ? "translateY(-50%)"
                                                      : "none",
                                          }
                                        : {}),
                                }}
                                aria-label="Next Slide"
                            >
                                {useCustomIcon && customRightIcon ? (
                                    <img
                                        src={customRightIcon}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain",
                                            borderRadius: arrowRadius,
                                        }}
                                        alt="Next"
                                    />
                                ) : (
                                    <svg
                                        width="45%"
                                        height="45%"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line
                                            x1="5"
                                            y1="12"
                                            x2="19"
                                            y2="12"
                                        ></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} style={{ width: "100%", height: height }}>
            <motion.div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: "relative",
                    top: 0,
                    left: 0,
                    right: 0,
                    width: "100%",
                    height: height,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: isMobile ? "center" : "space-between",
                    padding: isMobile ? 24 : padding,
                    overflow: "hidden",
                    boxSizing: "border-box",
                    userSelect: "none",
                }}
                animate={{
                    backgroundColor: currentSlide?.backgroundColor || "#1A0F0F",
                }}
                transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            >
                <div style={{ height: isMobile ? 0 : 12 }} />

                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        height: isMobile ? "auto" : "100%",
                        maxWidth: isMobile ? "100%" : contentMaxWidth,
                        marginLeft: "auto",
                        marginRight: "auto",
                        alignItems: "center",
                        justifyContent: isMobile ? "center" : "space-between",
                        marginTop: isMobile ? 0 : 16,
                        position: "relative",
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? mobileGap : 0,
                    }}
                >
                    <div
                        style={{
                            width: isMobile ? "100%" : "50%",
                            zIndex: 10,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            textAlign: isMobile ? "center" : "left",
                        }}
                    >
                        <AnimatePresence
                            mode="popLayout"
                            initial={false}
                            custom={direction}
                        >
                            <motion.div key={`text-block-${centerIdx}`}>
                                <motion.h2
                                    style={{
                                        margin: 0,
                                        color: titleColor,
                                        display: "flex",
                                        flexWrap: "wrap",
                                        justifyContent: isMobile
                                            ? "center"
                                            : "flex-start",
                                        ...resolveTypography(
                                            titleFont,
                                            titleSize,
                                            titleLineHeight,
                                            titleLetterSpacing,
                                            "800"
                                        ),
                                    }}
                                    custom={direction}
                                    variants={{
                                        enter: (dir) => ({
                                            transition: {
                                                staggerChildren: 0.025,
                                                staggerDirection: dir,
                                            },
                                        }),
                                        center: {
                                            transition: {
                                                staggerChildren: 0.025,
                                            },
                                        },
                                        exit: (dir) => ({
                                            transition: {
                                                staggerChildren: 0.02,
                                                staggerDirection: -dir,
                                            },
                                        }),
                                    }}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                >
                                    {(currentSlide?.title || "")
                                        .split("")
                                        .map((char, index) => (
                                            <motion.span
                                                key={`${char}-${index}`}
                                                custom={direction}
                                                variants={{
                                                    enter: (dir) => ({
                                                        opacity: 0,
                                                        y: dir > 0 ? 30 : -30,
                                                        filter: "blur(8px)",
                                                    }),
                                                    center: {
                                                        opacity: 1,
                                                        y: 0,
                                                        filter: "blur(0px)",
                                                        transition: {
                                                            duration: 0.4,
                                                            ease: [
                                                                0.25, 1, 0.5, 1,
                                                            ],
                                                        },
                                                    },
                                                    exit: (dir) => ({
                                                        opacity: 0,
                                                        y: dir > 0 ? -30 : 30,
                                                        filter: "blur(8px)",
                                                        transition: {
                                                            duration: 0.3,
                                                            ease: [
                                                                0.25, 1, 0.5, 1,
                                                            ],
                                                        },
                                                    }),
                                                }}
                                                style={{
                                                    display: "inline-block",
                                                    whiteSpace: "pre",
                                                }}
                                            >
                                                {char}
                                            </motion.span>
                                        ))}
                                </motion.h2>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div
                        style={{
                            width: isMobile ? "100%" : "50%",
                            height: isMobile ? "auto" : "100%",
                            minHeight: isMobile ? mainHeight : "auto",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: isMobile ? 0 : "-5%",
                        }}
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            {!isMobile && activeSlides[outgoingIdx] && (
                                <motion.img
                                    key={`exit-${outgoingIdx}-${direction}`}
                                    src={activeSlides[outgoingIdx].mainImage}
                                    initial={{
                                        y:
                                            direction === 1
                                                ? "-90%"
                                                : `${bottomY}%`,
                                        x: direction === 1 ? -25 : bottomX,
                                        rotate:
                                            direction === 1 ? -8 : bottomRotate,
                                        scale: 0.85,
                                        opacity: 0.25,
                                        filter: "blur(0px)",
                                    }}
                                    animate={{
                                        y:
                                            direction === 1
                                                ? "-180%"
                                                : `${bottomY * 2}%`,
                                        x: direction === 1 ? -50 : bottomX * 2,
                                        rotate:
                                            direction === 1
                                                ? -16
                                                : bottomRotate * 2,
                                        scale: 0.7,
                                        opacity: 0,
                                        filter: "blur(5px)",
                                    }}
                                    transition={waveTransition}
                                    style={{
                                        ...baseImageStyle,
                                        width: sideWidth,
                                        height: sideHeight,
                                        zIndex: 1,
                                        pointerEvents: "none",
                                    }}
                                />
                            )}

                            {!isMobile && activeSlides[prevIdx] && (
                                <motion.img
                                    key={`top-${centerIdx}`}
                                    src={activeSlides[prevIdx].mainImage}
                                    onClick={handlePrev}
                                    initial={
                                        direction === 1
                                            ? {
                                                  transform:
                                                      "translateX(0px) translateY(0%) scale(1) rotate(0deg)",
                                                  opacity: 1,
                                                  filter: "blur(0px)",
                                              }
                                            : {
                                                  transform:
                                                      "translateX(-190px) translateY(-180%) scale(0.7) rotate(-32deg)",
                                                  opacity: 0,
                                                  filter: "blur(5px)",
                                              }
                                    }
                                    animate={{
                                        transform:
                                            "translateX(-95px) translateY(-90%) scale(1.1) rotate(-16deg)",
                                        opacity: 0.4,
                                        filter: "blur(5px)",
                                    }}
                                    transition={waveTransition}
                                    style={{
                                        ...baseImageStyle,
                                        width: sideWidth,
                                        height: sideHeight,
                                        zIndex: 2,
                                        pointerEvents: "auto",
                                    }}
                                />
                            )}

                            {currentSlide && (
                                <motion.img
                                    key={`center-${centerIdx}`}
                                    src={currentSlide.mainImage}
                                    initial={
                                        isMobile
                                            ? { opacity: 0, scale: 0.95 }
                                            : direction === 1
                                              ? {
                                                    y: `${bottomY}%`,
                                                    x: bottomX,
                                                    rotate: bottomRotate,
                                                    scale: 0.85,
                                                    opacity: 0.25,
                                                    filter: "blur(5px)",
                                                }
                                              : {
                                                    transform:
                                                        "translateX(-95px) translateY(-90%) scale(1.1) rotate(-16deg)",
                                                    opacity: 0.4,
                                                    filter: "blur(5px)",
                                                }
                                    }
                                    animate={{
                                        transform:
                                            "translateX(0px) translateY(0%) scale(1) rotate(0deg)",
                                        opacity: 1,
                                        x: 0,
                                        y: 0,
                                        filter: "blur(0px)",
                                        scale: 1,
                                    }}
                                    transition={waveTransition}
                                    style={{
                                        ...baseImageStyle,
                                        width: mainWidth,
                                        height: mainHeight,
                                        maxWidth: "100%",
                                        borderRadius: 16,
                                        zIndex: 4,
                                    }}
                                />
                            )}

                            {!isMobile && activeSlides[nextIdx] && (
                                <motion.img
                                    key={`bottom-${centerIdx}`}
                                    src={activeSlides[nextIdx].mainImage}
                                    onClick={handleNext}
                                    initial={
                                        direction === 1
                                            ? {
                                                  y: `${bottomY * 2}%`,
                                                  x: bottomX * 2,
                                                  rotate: bottomRotate * 2,
                                                  scale: 0.7,
                                                  opacity: 0,
                                                  filter: "blur(5px)",
                                              }
                                            : {
                                                  y: 0,
                                                  x: 0,
                                                  rotate: 0,
                                                  scale: 1,
                                                  opacity: 1,
                                                  filter: "blur(0px)",
                                              }
                                    }
                                    animate={{
                                        y: `${bottomY}%`,
                                        x: bottomX,
                                        rotate: bottomRotate,
                                        scale: 0.85,
                                        opacity: 0.4,
                                        filter: "blur(5px)",
                                    }}
                                    transition={waveTransition}
                                    style={{
                                        ...baseImageStyle,
                                        width: sideWidth,
                                        height: sideHeight,
                                        zIndex: 1,
                                        pointerEvents: "auto",
                                    }}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {showArrows && (
                    <div style={getContainerStyles()}>
                        <motion.button
                            onClick={handlePrev}
                            initial="rest"
                            whileHover="hover"
                            variants={arrowVariants}
                            style={{
                                ...baseArrowStyle,
                                pointerEvents: "auto",
                                ...(arrowLayout === "Separate"
                                    ? {
                                          position: "absolute",
                                          left: isMobile
                                              ? 16
                                              : padding + arrowOffset,
                                          top:
                                              arrowPlacement === "top"
                                                  ? padding
                                                  : arrowPlacement === "bottom"
                                                    ? "auto"
                                                    : "50%",
                                          bottom:
                                              arrowPlacement === "bottom"
                                                  ? padding
                                                  : "auto",
                                          transform:
                                              arrowPlacement === "center"
                                                  ? "translateY(-50%)"
                                                  : "none",
                                      }
                                    : {}),
                            }}
                            aria-label="Previous Slide"
                        >
                            {useCustomIcon && customLeftIcon ? (
                                <img
                                    src={customLeftIcon}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        borderRadius: arrowRadius,
                                    }}
                                    alt="Prev"
                                />
                            ) : (
                                <svg
                                    width="45%"
                                    height="45%"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            )}
                        </motion.button>

                        <motion.button
                            onClick={handleNext}
                            initial="rest"
                            whileHover="hover"
                            variants={arrowVariants}
                            style={{
                                ...baseArrowStyle,
                                pointerEvents: "auto",
                                ...(arrowLayout === "Separate"
                                    ? {
                                          position: "absolute",
                                          right: isMobile
                                              ? 16
                                              : padding + arrowOffset,
                                          top:
                                              arrowPlacement === "top"
                                                  ? padding
                                                  : arrowPlacement === "bottom"
                                                    ? "auto"
                                                    : "50%",
                                          bottom:
                                              arrowPlacement === "bottom"
                                                  ? padding
                                                  : "auto",
                                          transform:
                                              arrowPlacement === "center"
                                                  ? "translateY(-50%)"
                                                  : "none",
                                      }
                                    : {}),
                            }}
                            aria-label="Next Slide"
                        >
                            {useCustomIcon && customRightIcon ? (
                                <img
                                    src={customRightIcon}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        borderRadius: arrowRadius,
                                    }}
                                    alt="Next"
                                />
                            ) : (
                                <svg
                                    width="45%"
                                    height="45%"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            )}
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

AnimatedImgSlider.defaultProps = {
    width: 800,
    height: 600,
    slides: defaultSlides,
    mainWidth: 380,
    mainHeight: 320,
    sideWidth: 380,
    sideHeight: 380,
    stiffness: 95,
    damping: 16,
    padding: 48,
    autoplay: true,
    autoplayDelay: 4,
    contentMaxWidth: 1200,
    mobileGap: 24,
    textOptions: {
        titleColor: "#ffffff",
        titleSize: 72,
        titleLineHeight: 1.1,
        titleLetterSpacing: -0.02,
    },
    arrowOptions: {
        showArrows: false,
        arrowLayout: "Separate",
        arrowPlacement: "center",
        arrowGroupPosition: "Bottom Right",
        arrowSize: 44,
        arrowRadius: 30,
        arrowOffset: 0,
        arrowBgColor: "#0F0F14",
        arrowHoverBgColor: "#6366F1",
        arrowHoverScale: 1.1,
        arrowIconColor: "#ffffff",
        useCustomIcon: false,
    },
}

addPropertyControls(AnimatedImgSlider, {
    padding: {
        type: ControlType.Number,
        title: "Layout Padding",
        min: 10,
        max: 100,
        defaultValue: 48,
        group: "General Setup",
    },
    contentMaxWidth: {
        type: ControlType.Number,
        title: "Row Max Width",
        min: 400,
        max: 2000,
        step: 10,
        defaultValue: 1200,
        group: "General Setup",
    },
    mobileGap: {
        type: ControlType.Number,
        title: "Mobile Stack Gap",
        min: 0,
        max: 120,
        step: 2,
        defaultValue: 24,
        group: "General Setup",
        unit: "px",
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        min: 200,
        max: 1200,
        step: 10,
        defaultValue: 600,
        group: "General Setup",
        unit: "px",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay fallback",
        defaultValue: false,
        group: "Interaction Loop",
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Delay (s)",
        min: 2,
        max: 15,
        step: 0.5,
        defaultValue: 4,
        hidden: ({ autoplay }) => !autoplay,
        group: "Interaction Loop",
    },
    arrowOptions: {
        type: ControlType.Object,
        title: "Arrows Configuration",
        group: "Navigation Panel",
        controls: {
            showArrows: {
                type: ControlType.Boolean,
                title: "Show Arrows",
                defaultValue: true,
            },
            arrowLayout: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["Separate", "Together"],
                defaultValue: "Separate",
            },
            arrowPlacement: {
                type: ControlType.Enum,
                title: "Placement",
                options: ["top", "center", "bottom"],
                defaultValue: "center",
                hidden: ({ arrowLayout }) => arrowLayout === "Together",
            },
            arrowGroupPosition: {
                type: ControlType.Enum,
                title: "Group Position",
                options: [
                    "Top Left",
                    "Top Center",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Center",
                    "Bottom Right",
                ],
                defaultValue: "Bottom Right",
                hidden: ({ arrowLayout }) => arrowLayout !== "Together",
            },
            arrowSize: {
                type: ControlType.Number,
                title: "Size",
                min: 24,
                max: 100,
                defaultValue: 44,
                unit: "px",
            },
            arrowRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 50,
                defaultValue: 30,
                unit: "px",
            },
            arrowOffset: {
                type: ControlType.Number,
                title: "Offset",
                min: -100,
                max: 200,
                defaultValue: 0,
                unit: "px",
            },
            arrowBgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0F0F14",
            },
            arrowHoverBgColor: {
                type: ControlType.Color,
                title: "Hover Bg",
                defaultValue: "#6366F1",
            },
            arrowHoverScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                min: 1.0,
                max: 1.5,
                step: 0.05,
                defaultValue: 1.1,
            },
            arrowIconColor: {
                type: ControlType.Color,
                title: "Icon Stroke",
                defaultValue: "#ffffff",
            },
            useCustomIcon: {
                type: ControlType.Boolean,
                title: "Custom Icon",
                defaultValue: false,
            },
            customLeftIcon: { type: ControlType.Image, title: "Left Graphic" },
            customRightIcon: {
                type: ControlType.Image,
                title: "Right Graphic",
            },
        },
    },
    textOptions: {
        type: ControlType.Object,
        title: "Text & Fonts",
        group: "Custom Styling",
        controls: {
            titleFont: { type: ControlType.Font, title: "Title Font" },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#ffffff",
            },
            titleSize: {
                type: ControlType.Number,
                title: "Title Size",
                min: 12,
                max: 120,
                defaultValue: 72,
                unit: "px",
            },
            titleLineHeight: {
                type: ControlType.Number,
                title: "Title Line Height",
                min: 0.8,
                max: 2.5,
                step: 0.1,
                defaultValue: 1.1,
            },
            titleLetterSpacing: {
                type: ControlType.Number,
                title: "Title Spacing",
                min: -0.1,
                max: 0.2,
                step: 0.01,
                defaultValue: -0.02,
                unit: "em",
            },
        },
    },
    mainWidth: {
        type: ControlType.Number,
        title: "Main Width",
        min: 100,
        max: 600,
        defaultValue: 380,
        group: "Image Dimensions",
    },
    mainHeight: {
        type: ControlType.Number,
        title: "Main Height",
        min: 100,
        max: 600,
        defaultValue: 320,
        group: "Image Dimensions",
    },
    sideWidth: {
        type: ControlType.Number,
        title: "Side Width",
        min: 100,
        max: 600,
        defaultValue: 380,
        group: "Image Dimensions",
    },
    sideHeight: {
        type: ControlType.Number,
        title: "Side Height",
        min: 100,
        max: 600,
        defaultValue: 380,
        group: "Image Dimensions",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        min: 10,
        max: 300,
        defaultValue: 95,
        group: "Physics Controls",
    },
    damping: {
        type: ControlType.Number,
        title: "Spring Damping",
        min: 5,
        max: 50,
        defaultValue: 16,
        group: "Physics Controls",
    },
    slides: {
        type: ControlType.Array,
        title: "Slides Slider",
        defaultValue: defaultSlides,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Background Color",
                },
                mainImage: { type: ControlType.Image, title: "Main Graphic" },
            },
        },
    },
})
