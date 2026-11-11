// Responsive fan-card carousel component with fanned layout, keyboard navigation, and drag support
import {
    useEffect,
    useState,
    useCallback,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, animate, PanInfo } from "framer-motion"

interface CardData {
    image: { src: string; alt: string }
    title: string
    subtitle: string
    tag: string
    link: string
}

interface FanCardCarouselProps {
    cards: CardData[]
    cardWidth: number
    cardHeight: number
    fanSpread: number
    rotationAngle: number
    activeScale: number
    inactiveScale: number
    enableDrag: boolean
    enableScrollNavigation: boolean
    animationDuration: number
    verticalPosition: number
    mobileVerticalPosition: number
    tabletVerticalPosition: number
    mobileCarouselScale: number
    topicHeadline: string
    mainHeadline: string
    topicFont: CSSProperties
    headlineFont: CSSProperties
    topicColor: string
    headlineColor: string
    desktopHeadlineY: number
    tabletHeadlineY: number
    mobileHeadlineY: number
    titleFont: CSSProperties
    subtitleFont: CSSProperties
    tagFont: CSSProperties
    titleColor: string
    subtitleColor: string
    tagColor: string
    tagBackground: string
    cardBackground: string
    shadowColor: string
    cardRadius: number
    style?: CSSProperties
}

/**
 * Fan Card Carousel
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FanCardCarousel(props: FanCardCarouselProps) {
    const {
        cards,
        cardWidth,
        cardHeight,
        fanSpread,
        rotationAngle,
        activeScale,
        inactiveScale,
        enableDrag,
        enableScrollNavigation,
        animationDuration,
        verticalPosition,
        mobileVerticalPosition,
        tabletVerticalPosition,
        mobileCarouselScale,
        topicHeadline,
        mainHeadline,
        topicFont,
        headlineFont,
        topicColor,
        headlineColor,
        desktopHeadlineY,
        tabletHeadlineY,
        mobileHeadlineY,
        titleFont,
        subtitleFont,
        tagFont,
        titleColor,
        subtitleColor,
        tagColor,
        tagBackground,
        cardBackground,
        shadowColor,
        cardRadius,
        style,
    } = props

    const [activeIndex, setActiveIndex] = useState(Math.floor(cards.length / 2))
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dragX = useMotionValue(0)
    const [isDragging, setIsDragging] = useState(false)
    const [containerWidth, setContainerWidth] = useState(1200)
    const scrollTimeoutRef = useRef<number | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth || 1200)
            }
        }

        updateWidth()

        const element = containerRef.current

        if (typeof ResizeObserver !== "undefined") {
            const resizeObserver = new ResizeObserver(updateWidth)
            resizeObserver.observe(element)

            return () => resizeObserver.disconnect()
        }

        if (typeof window !== "undefined") {
            window.addEventListener("resize", updateWidth)
            return () => window.removeEventListener("resize", updateWidth)
        }
    }, [])

    const isMobile = containerWidth < 640
    const isTablet = containerWidth >= 640 && containerWidth < 1024

    const responsiveCardWidth = isMobile
        ? Math.min(cardWidth * mobileCarouselScale, containerWidth * 0.78)
        : isTablet
          ? Math.min(cardWidth * 0.88, containerWidth * 0.46)
          : cardWidth

    const responsiveCardHeight =
        isMobile || isTablet
            ? responsiveCardWidth * (cardHeight / cardWidth)
            : cardHeight

    const responsiveFanSpread = isMobile
        ? Math.min(
              fanSpread * mobileCarouselScale * 0.72,
              responsiveCardWidth * 0.52
          )
        : isTablet
          ? fanSpread * 0.78
          : fanSpread

    const responsiveRotation = isMobile
        ? rotationAngle * 0.45
        : isTablet
          ? rotationAngle * 0.7
          : rotationAngle

    const responsiveActiveScale = isMobile
        ? Math.min(activeScale, 1)
        : isTablet
          ? Math.min(activeScale, 1.05)
          : activeScale

    const responsiveInactiveScale = isMobile
        ? Math.min(inactiveScale, 0.78)
        : isTablet
          ? Math.min(inactiveScale, 0.82)
          : inactiveScale

    const responsiveVerticalPosition = isMobile
        ? mobileVerticalPosition
        : isTablet
          ? tabletVerticalPosition
          : verticalPosition

    const responsiveHeadlineY = isMobile
        ? mobileHeadlineY
        : isTablet
          ? tabletHeadlineY
          : desktopHeadlineY

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                startTransition(() => {
                    setActiveIndex((prev) =>
                        prev > 0 ? prev - 1 : cards.length - 1
                    )
                })
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                startTransition(() => {
                    setActiveIndex((prev) =>
                        prev < cards.length - 1 ? prev + 1 : 0
                    )
                })
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }
    }, [cards.length])

    useEffect(() => {
        if (!enableScrollNavigation || !containerRef.current) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()

            if (scrollTimeoutRef.current !== null) {
                clearTimeout(scrollTimeoutRef.current)
            }

            scrollTimeoutRef.current = window.setTimeout(() => {
                if (e.deltaY > 0) {
                    startTransition(() => {
                        setActiveIndex((prev) =>
                            prev < cards.length - 1 ? prev + 1 : 0
                        )
                    })
                } else if (e.deltaY < 0) {
                    startTransition(() => {
                        setActiveIndex((prev) =>
                            prev > 0 ? prev - 1 : cards.length - 1
                        )
                    })
                }
            }, 50)
        }

        const container = containerRef.current
        container.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            container.removeEventListener("wheel", handleWheel)
            if (scrollTimeoutRef.current !== null) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [enableScrollNavigation, cards.length])

    const handleCardClick = useCallback(
        (index: number) => {
            if (index === activeIndex) {
                const link = cards[index].link

                if (link && typeof window !== "undefined") {
                    if (link.startsWith("http") || link.startsWith("//")) {
                        window.open(link, "_blank")
                    } else {
                        window.location.href = link
                    }
                }
            } else {
                startTransition(() => {
                    setActiveIndex(index)
                })
            }
        },
        [activeIndex, cards]
    )

    const handleDragEnd = useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            setIsDragging(false)

            const threshold = isMobile ? 30 : 50

            if (info.offset.x > threshold && activeIndex > 0) {
                startTransition(() => {
                    setActiveIndex(activeIndex - 1)
                })
            } else if (
                info.offset.x < -threshold &&
                activeIndex < cards.length - 1
            ) {
                startTransition(() => {
                    setActiveIndex(activeIndex + 1)
                })
            }

            animate(dragX, 0, {
                type: "spring",
                stiffness: 300,
                damping: 30,
            })
        },
        [activeIndex, cards.length, dragX, isMobile]
    )

    const getCardTransform = useCallback(
        (index: number) => {
            const distance = index - activeIndex
            const absDistance = Math.abs(distance)

            const xOffset = distance * responsiveFanSpread
            const yOffset = absDistance * (isMobile ? 32 : isTablet ? 46 : 60)
            const rotation = distance * responsiveRotation

            const scale =
                index === activeIndex
                    ? responsiveActiveScale
                    : Math.max(
                          0.4,
                          responsiveInactiveScale - absDistance * 0.05
                      )

            const zIndex = cards.length - absDistance

            return { xOffset, yOffset, rotation, scale, zIndex }
        },
        [
            activeIndex,
            responsiveFanSpread,
            responsiveRotation,
            responsiveActiveScale,
            responsiveInactiveScale,
            cards.length,
            isMobile,
            isTablet,
        ]
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingBottom: isMobile ? 40 : isTablet ? 60 : 80,
                paddingTop: isMobile ? 40 : isTablet ? 60 : 80,
                backgroundColor: "#000000",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: isMobile ? "90%" : isTablet ? "80%" : "1000px",
                    textAlign: "center",
                    marginBottom: isMobile ? 90 : isTablet ? 160 : 240,
                    paddingLeft: 20,
                    paddingRight: 20,
                    transform: `translateY(${responsiveHeadlineY}px)`,
                }}
            >
                {topicHeadline && (
                    <p
                        style={{
                            margin: 0,
                            marginBottom: isMobile ? 12 : 16,
                            color: topicColor,
                            textTransform: "uppercase",
                            ...topicFont,
                            fontSize: isMobile
                                ? `calc(${topicFont.fontSize} * 0.8)`
                                : isTablet
                                  ? `calc(${topicFont.fontSize} * 0.9)`
                                  : topicFont.fontSize,
                        }}
                    >
                        {topicHeadline}
                    </p>
                )}

                {mainHeadline && (
                    <h1
                        style={{
                            margin: 0,
                            color: headlineColor,
                            ...headlineFont,
                            fontSize: isMobile
                                ? `calc(${headlineFont.fontSize} * 0.7)`
                                : isTablet
                                  ? `calc(${headlineFont.fontSize} * 0.85)`
                                  : headlineFont.fontSize,
                        }}
                    >
                        {mainHeadline}
                    </h1>
                )}
            </div>

            <div
                style={{
                    position: "relative",
                    transform: `translateY(${responsiveVerticalPosition}px)`,
                    width: "100%",
                    height: "100%",
                    minHeight: isMobile
                        ? responsiveCardHeight * 1.35
                        : isTablet
                          ? responsiveCardHeight * 1.25
                          : responsiveCardHeight * 1.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {cards.map((card, index) => {
                    const { xOffset, yOffset, rotation, scale, zIndex } =
                        getCardTransform(index)

                    const isActive = index === activeIndex
                    const isHovered = hoveredIndex === index

                    const resolvedCardRadius = isMobile
                        ? cardRadius * 0.7
                        : isTablet
                          ? cardRadius * 0.85
                          : cardRadius

                    const cardImage = card.image || {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Default image",
                    }

                    return (
                        <motion.div
                            key={index}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: responsiveCardWidth,
                                height: responsiveCardHeight,
                                marginLeft: -responsiveCardWidth / 2,
                                marginTop: -responsiveCardHeight / 2,
                                cursor: "pointer",
                                zIndex,
                                touchAction: isMobile ? "pan-y" : "auto",
                                borderRadius: resolvedCardRadius,
                                overflow: "visible",
                            }}
                            initial={false}
                            animate={{
                                x: xOffset,
                                y: yOffset,
                                rotate: rotation,
                                scale:
                                    isHovered && !isActive
                                        ? scale * 1.05
                                        : scale,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                duration: animationDuration,
                            }}
                            drag={enableDrag || isMobile ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={isMobile ? 0.3 : 0.2}
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={handleDragEnd}
                            onClick={() =>
                                !isDragging && handleCardClick(index)
                            }
                            onMouseEnter={() =>
                                !isMobile &&
                                startTransition(() => setHoveredIndex(index))
                            }
                            onMouseLeave={() =>
                                !isMobile &&
                                startTransition(() => setHoveredIndex(null))
                            }
                            whileHover={
                                !isActive && !isMobile
                                    ? {
                                          y: yOffset - 10,
                                      }
                                    : undefined
                            }
                        >
                            <motion.div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: resolvedCardRadius,
                                    overflow: "hidden",
                                    backgroundColor: cardBackground,
                                    boxShadow: `0 ${isActive ? 20 : 10}px ${
                                        isActive ? 40 : 30
                                    }px ${shadowColor}`,
                                    position: "relative",
                                    clipPath: `inset(0 round ${resolvedCardRadius}px)`,
                                    WebkitClipPath: `inset(0 round ${resolvedCardRadius}px)`,
                                    transform: "translateZ(0)",
                                    isolation: "isolate",
                                }}
                                animate={{
                                    boxShadow: isHovered
                                        ? `0 ${isActive ? 25 : 15}px ${
                                              isActive ? 50 : 40
                                          }px ${shadowColor}`
                                        : `0 ${isActive ? 20 : 10}px ${
                                              isActive ? 40 : 30
                                          }px ${shadowColor}`,
                                }}
                            >
                                <motion.div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        position: "relative",
                                        overflow: "hidden",
                                        borderRadius: resolvedCardRadius,
                                    }}
                                >
                                    <motion.img
                                        src={cardImage.src}
                                        alt={cardImage.alt}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: resolvedCardRadius,
                                            display: "block",
                                        }}
                                        animate={{
                                            scale: isHovered ? 1.05 : 1,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25,
                                        }}
                                    />
                                </motion.div>

                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        padding: isMobile
                                            ? 16
                                            : isTablet
                                              ? 20
                                              : 24,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        background:
                                            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)",
                                    }}
                                >
                                    <div style={{ flex: 1, marginRight: 12 }}>
                                        <h3
                                            style={{
                                                margin: 0,
                                                color: titleColor,
                                                ...titleFont,
                                                fontSize: isMobile
                                                    ? `calc(${titleFont.fontSize} * 0.7)`
                                                    : isTablet
                                                      ? `calc(${titleFont.fontSize} * 0.85)`
                                                      : titleFont.fontSize,
                                            }}
                                        >
                                            {card.title}
                                        </h3>

                                        <p
                                            style={{
                                                margin: "4px 0 0 0",
                                                color: subtitleColor,
                                                ...subtitleFont,
                                                fontSize: isMobile
                                                    ? `calc(${subtitleFont.fontSize} * 0.7)`
                                                    : isTablet
                                                      ? `calc(${subtitleFont.fontSize} * 0.85)`
                                                      : subtitleFont.fontSize,
                                            }}
                                        >
                                            {card.subtitle}
                                        </p>
                                    </div>

                                    {card.tag && (
                                        <div
                                            style={{
                                                backgroundColor: tagBackground,
                                                color: tagColor,
                                                padding: isMobile
                                                    ? "6px 12px"
                                                    : "8px 16px",
                                                borderRadius: 999,
                                                backdropFilter:
                                                    "blur(12px) saturate(180%)",
                                                WebkitBackdropFilter:
                                                    "blur(12px) saturate(180%)",
                                                border: "1px solid rgba(255, 255, 255, 0.18)",
                                                boxShadow:
                                                    "0 4px 12px rgba(0, 0, 0, 0.15)",
                                                ...tagFont,
                                                fontSize: isMobile
                                                    ? `calc(${tagFont.fontSize} * 0.7)`
                                                    : isTablet
                                                      ? `calc(${tagFont.fontSize} * 0.85)`
                                                      : tagFont.fontSize,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {card.tag}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>

            <div
                style={{
                    position: "absolute",
                    bottom: isMobile ? 20 : 40,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 8,
                    zIndex: 1000,
                }}
            >
                {cards.map((_, index) => (
                    <button
                        key={index}
                        onClick={() =>
                            startTransition(() => setActiveIndex(index))
                        }
                        style={{
                            width: index === activeIndex ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            border: "none",
                            backgroundColor:
                                index === activeIndex
                                    ? "#FFFFFF"
                                    : "rgba(255,255,255,0.4)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                        }}
                        aria-label={`Go to card ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}

addPropertyControls(FanCardCarousel, {
    topicHeadline: {
        type: ControlType.String,
        title: "Topic Headline",
        defaultValue: "FEATURED COLLECTION",
    },
    mainHeadline: {
        type: ControlType.String,
        title: "Main Headline",
        defaultValue: "Discover Amazing Places",
    },
    desktopHeadlineY: {
        type: ControlType.Number,
        title: "Desktop Headline Y",
        defaultValue: 60,
        min: -100,
        max: 100,
        step: 1,
        unit: "%",
    },
    tabletHeadlineY: {
        type: ControlType.Number,
        title: "Tablet Headline Y",
        defaultValue: 80,
        min: -100,
        max: 100,
        step: 1,
        unit: "%",
    },
    mobileHeadlineY: {
        type: ControlType.Number,
        title: "Mobile Headline Y",
        defaultValue: 100,
        min: -100,
        max: 100,
        step: 1,
        unit: "%",
    },
    topicFont: {
        type: ControlType.Font,
        title: "Topic Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "0.1em",
            lineHeight: "1em",
        },
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1.1em",
        },
    },
    topicColor: {
        type: ControlType.Color,
        title: "Topic Color",
        defaultValue: "#E3E78F",
    },
    headlineColor: {
        type: ControlType.Color,
        title: "Headline Color",
        defaultValue: "#FFFFFF",
    },
    cards: {
        type: ControlType.Array,
        title: "Cards",
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
                    defaultValue: "Card Title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Card subtitle",
                },
                tag: {
                    type: ControlType.String,
                    title: "Tag",
                    defaultValue: "NEW",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Card 1",
                },
                title: "Explore Nature",
                subtitle: "Discover the wilderness",
                tag: "NEW",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Card 2",
                },
                title: "Urban Adventures",
                subtitle: "City life awaits",
                tag: "POPULAR",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Card 3",
                },
                title: "Creative Spaces",
                subtitle: "Inspire your imagination",
                tag: "FEATURED",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Card 4",
                },
                title: "Coastal Escapes",
                subtitle: "Beach paradise",
                tag: "TRENDING",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Card 5",
                },
                title: "Mountain Peaks",
                subtitle: "Reach new heights",
                tag: "ADVENTURE",
                link: "",
            },
        ],
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 40,
        min: 0,
        max: 80,
        step: 4,
        unit: "px",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 400,
        min: 200,
        max: 600,
        step: 10,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 500,
        min: 300,
        max: 700,
        step: 10,
    },
    fanSpread: {
        type: ControlType.Number,
        title: "Fan Spread",
        defaultValue: 180,
        min: 50,
        max: 300,
        step: 10,
    },
    rotationAngle: {
        type: ControlType.Number,
        title: "Rotation Angle",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
        unit: "deg",
    },
    activeScale: {
        type: ControlType.Number,
        title: "Active Scale",
        defaultValue: 1.1,
        min: 0.8,
        max: 1.2,
        step: 0.05,
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Scale",
        defaultValue: 0.85,
        min: 0.5,
        max: 1,
        step: 0.05,
    },
    enableDrag: {
        type: ControlType.Boolean,
        title: "Enable Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableScrollNavigation: {
        type: ControlType.Boolean,
        title: "Scroll Navigation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 0.6,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    verticalPosition: {
        type: ControlType.Number,
        title: "Vertical Position",
        defaultValue: -140,
        min: -200,
        max: 150,
        step: 1,
        unit: "%",
    },
    tabletVerticalPosition: {
        type: ControlType.Number,
        title: "Tablet Vertical Position",
        defaultValue: -100,
        min: -200,
        max: 150,
        step: 1,
        unit: "%",
    },
    mobileVerticalPosition: {
        type: ControlType.Number,
        title: "Mobile Vertical Position",
        defaultValue: -45,
        min: -200,
        max: 150,
        step: 1,
        unit: "%",
    },
    mobileCarouselScale: {
        type: ControlType.Number,
        title: "Mobile Carousel Scale",
        defaultValue: 0.8,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Bold",
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
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    tagFont: {
        type: ControlType.Font,
        title: "Tag Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Semibold",
            letterSpacing: "0.05em",
            lineHeight: "1em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "rgba(255, 255, 255, 0.7)",
    },
    tagColor: {
        type: ControlType.Color,
        title: "Tag Text",
        defaultValue: "#FFFFFF",
    },
    tagBackground: {
        type: ControlType.Color,
        title: "Tag Background",
        defaultValue: "rgba(255, 255, 255, 0.15)",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#1a1a1a",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.5)",
    },
})
