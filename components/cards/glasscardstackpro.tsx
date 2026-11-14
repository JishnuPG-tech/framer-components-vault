// Glass Card Stack - A stack of glassmorphism cards that fan out on hover, with drag-to-dismiss, smooth reordering, and configurable glass styles
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { useState, useEffect, useCallback, startTransition, useMemo, type CSSProperties } from "react"

interface CardItem {
    title: string
    description: string
    image: { src: string; alt?: string }
    tag: string
    link: string
    accentColor: string
    // Individual card style overrides
    customGlassColor?: string
    customBorderColor?: string
    customBorderWidth?: number
    customBlur?: number
    customBorderRadius?: number
    customShadowColor?: string
    customShadowBlur?: number
    backgroundImage?: { src: string; alt?: string }
    backgroundOpacity?: number
    customTitleColor?: string
    customDescColor?: string
    customTagBg?: string
    customTagColor?: string
}

interface GlassCardStackProps {
    cards: CardItem[]
    stackMode: "fan" | "cascade" | "overlap"
    stackOffsetY: number
    stackOffsetX: number
    stackRotation: number
    stackScale: number
    fanSpread: number
    fanRadius: number
    glassColor: string
    glassBorderColor: string
    glassBorderWidth: number
    glassBlur: number
    glassSaturation: number
    glassBorderRadius: number
    glassShadow: boolean
    glassShadowColor: string
    glassShadowBlur: number
    cardWidth: number
    cardHeight: number
    cardPadding: number
    imageHeight: number
    imageBorderRadius: number
    titleFontSize: number
    titleFontWeight: "500" | "600" | "700" | "800"
    titleColor: string
    descFontSize: number
    descColor: string
    tagFontSize: number
    tagBg: string
    tagColor: string
    tagBorderRadius: number
    hoverFanEnabled: boolean
    hoverFanDuration: number
    dragDismissEnabled: boolean
    dragDismissThreshold: number
    dragDismissRotation: number
    autoCycle: boolean
    autoCycleInterval: number
    springStiffness: number
    springDamping: number
    showBackground: boolean
    backgroundColor: string
    backgroundBlur: number
    theme: "light" | "dark" | "auto"
    responsiveMode: boolean
    mobileCardWidth: number
    mobileCardHeight: number
    mobilePadding: number
    mobileImageHeight: number
    mobileTitleSize: number
    mobileDescSize: number
    mobileTagSize: number
    style?: CSSProperties
}

/**
 * Glass Card Stack
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 500
 */
export default function GlassCardStack(props: GlassCardStackProps) {
    const {
        cards: initialCards,
        stackMode,
        stackOffsetY,
        stackOffsetX,
        stackRotation,
        stackScale,
        fanSpread,
        fanRadius,
        glassColor,
        glassBorderColor,
        glassBorderWidth,
        glassBlur,
        glassSaturation,
        glassBorderRadius,
        glassShadow,
        glassShadowColor,
        glassShadowBlur,
        cardWidth,
        cardHeight,
        cardPadding,
        imageHeight,
        imageBorderRadius,
        titleFontSize,
        titleFontWeight,
        titleColor,
        descFontSize,
        descColor,
        tagFontSize,
        tagBg,
        tagColor,
        tagBorderRadius,
        hoverFanEnabled,
        hoverFanDuration,
        dragDismissEnabled,
        dragDismissThreshold,
        dragDismissRotation,
        autoCycle,
        autoCycleInterval,
        springStiffness,
        springDamping,
        showBackground,
        backgroundColor,
        backgroundBlur,
        theme,
        responsiveMode,
        mobileCardWidth,
        mobileCardHeight,
        mobilePadding,
        mobileImageHeight,
        mobileTitleSize,
        mobileDescSize,
        mobileTagSize,
    } = props

    const [cards, setCards] = useState<CardItem[]>(initialCards)
    const [isHovered, setIsHovered] = useState(false)
    const [dismissedCards, setDismissedCards] = useState<Set<number>>(new Set())
    const [isMobile, setIsMobile] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)

    // Detect if we're in Canvas mode (disable animations for performance)
    const isCanvas = useIsStaticRenderer()

    // Detect mobile viewport
    useEffect(() => {
        if (!responsiveMode) return

        const checkMobile = () => {
            startTransition(() => {
                setIsMobile(window.innerWidth < 768)
            })
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [responsiveMode])

    // Detect dark mode
    useEffect(() => {
        if (theme === "auto") {
            const checkDarkMode = () => {
                if (typeof window !== "undefined") {
                    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                    startTransition(() => setIsDarkMode(isDark))
                }
            }

            checkDarkMode()
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
            const handler = (e: MediaQueryListEvent) => {
                startTransition(() => setIsDarkMode(e.matches))
            }
            mediaQuery.addEventListener("change", handler)
            return () => mediaQuery.removeEventListener("change", handler)
        } else {
            startTransition(() => setIsDarkMode(theme === "dark"))
        }
    }, [theme])

    // Responsive values
    const responsiveCardWidth = useMemo(
        () => (responsiveMode && isMobile ? mobileCardWidth : cardWidth),
        [responsiveMode, isMobile, mobileCardWidth, cardWidth]
    )
    const responsiveCardHeight = useMemo(
        () => (responsiveMode && isMobile ? mobileCardHeight : cardHeight),
        [responsiveMode, isMobile, mobileCardHeight, cardHeight]
    )
    const responsivePadding = useMemo(
        () => (responsiveMode && isMobile ? mobilePadding : cardPadding),
        [responsiveMode, isMobile, mobilePadding, cardPadding]
    )
    const responsiveImageHeight = useMemo(
        () => (responsiveMode && isMobile ? mobileImageHeight : imageHeight),
        [responsiveMode, isMobile, mobileImageHeight, imageHeight]
    )
    const responsiveTitleSize = useMemo(
        () => (responsiveMode && isMobile ? mobileTitleSize : titleFontSize),
        [responsiveMode, isMobile, mobileTitleSize, titleFontSize]
    )
    const responsiveDescSize = useMemo(
        () => (responsiveMode && isMobile ? mobileDescSize : descFontSize),
        [responsiveMode, isMobile, mobileDescSize, descFontSize]
    )
    const responsiveTagSize = useMemo(
        () => (responsiveMode && isMobile ? mobileTagSize : tagFontSize),
        [responsiveMode, isMobile, mobileTagSize, tagFontSize]
    )

    // Theme-aware colors
    const themedGlassColor = useMemo(() => {
        if (glassColor !== "rgba(255,255,255,0.08)") return glassColor
        return isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.7)"
    }, [glassColor, isDarkMode])

    const themedBorderColor = useMemo(() => {
        if (glassBorderColor !== "rgba(255,255,255,0.15)") return glassBorderColor
        return isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)"
    }, [glassBorderColor, isDarkMode])

    const themedTitleColor = useMemo(() => {
        if (titleColor !== "#ffffff") return titleColor
        return isDarkMode ? "#ffffff" : "#111827"
    }, [titleColor, isDarkMode])

    const themedDescColor = useMemo(() => {
        if (descColor !== "rgba(255,255,255,0.65)") return descColor
        return isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,24,39,0.7)"
    }, [descColor, isDarkMode])

    const themedTagBg = useMemo(() => {
        if (tagBg !== "rgba(99,102,241,0.2)") return tagBg
        return isDarkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)"
    }, [tagBg, isDarkMode])

    const themedTagColor = useMemo(() => {
        if (tagColor !== "#a5b4fc") return tagColor
        return isDarkMode ? "#a5b4fc" : "#4f46e5"
    }, [tagColor, isDarkMode])

    // Update cards when props change
    useEffect(() => {
        startTransition(() => {
            setCards(initialCards)
            setDismissedCards(new Set())
        })
    }, [initialCards])

    // Auto-cycle functionality
    useEffect(() => {
        if (!autoCycle || cards.length <= 1) return

        const interval = setInterval(() => {
            startTransition(() => {
                setCards((prev) => {
                    const newCards = [...prev]
                    const firstCard = newCards.shift()
                    if (firstCard) newCards.push(firstCard)
                    return newCards
                })
            })
        }, autoCycleInterval)

        return () => clearInterval(interval)
    }, [autoCycle, autoCycleInterval, cards.length])

    const handleDragEnd = useCallback(
        (cardIndex: number, info: PanInfo) => {
            const offset = info.offset.x
            const velocity = info.velocity.x

            if (
                dragDismissEnabled &&
                (Math.abs(offset) > dragDismissThreshold || Math.abs(velocity) > 500)
            ) {
                startTransition(() => {
                    setDismissedCards((prev) => new Set(prev).add(cardIndex))
                    setTimeout(() => {
                        setCards((prev) => prev.filter((_, i) => i !== cardIndex))
                        setDismissedCards((prev) => {
                            const newSet = new Set(prev)
                            newSet.delete(cardIndex)
                            return newSet
                        })
                    }, 300)
                })
            }
        },
        [dragDismissEnabled, dragDismissThreshold]
    )

    const getCardTransform = (index: number, total: number) => {
        const isFanned = isHovered && hoverFanEnabled && !isCanvas
        const mobileMultiplier = responsiveMode && isMobile ? 0.6 : 1

        if (stackMode === "fan" && isFanned) {
            const centerIndex = (total - 1) / 2
            const angleStep = fanSpread / (total - 1 || 1)
            const angle = (index - centerIndex) * angleStep
            const radians = (angle * Math.PI) / 180
            const adjustedRadius = fanRadius * mobileMultiplier
            const x = Math.sin(radians) * adjustedRadius
            const y = -Math.cos(radians) * adjustedRadius + adjustedRadius

            return {
                x,
                y,
                rotate: angle,
                scale: 1,
            }
        }

        if (stackMode === "cascade") {
            return {
                x: isFanned ? index * stackOffsetX * 3 * mobileMultiplier : index * stackOffsetX * mobileMultiplier,
                y: isFanned ? index * stackOffsetY * 2 * mobileMultiplier : index * stackOffsetY * mobileMultiplier,
                rotate: isFanned ? index * stackRotation * 1.5 : index * stackRotation,
                scale: isFanned ? 1 : Math.pow(stackScale, index),
            }
        }

        // overlap mode
        return {
            x: isFanned ? index * stackOffsetX * 4 * mobileMultiplier : 0,
            y: isFanned
                ? index * stackOffsetY * 3 * mobileMultiplier
                : index * stackOffsetY * 0.5 * mobileMultiplier,
            rotate: isFanned ? index * stackRotation * 2 : 0,
            scale: isFanned ? 1 : Math.pow(stackScale, index),
        }
    }

    const springTransition = {
        type: "spring" as const,
        stiffness: springStiffness,
        damping: springDamping,
    }

    // In Canvas mode, use instant transitions for better editing experience
    const transition = isCanvas 
        ? { duration: 0 }
        : springTransition

    const containerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        ...(showBackground && {
            backgroundColor,
            backdropFilter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
        }),
    }

    return (
        <div
            style={containerStyle}
            onMouseEnter={isCanvas ? undefined : () => startTransition(() => setIsHovered(true))}
            onMouseLeave={isCanvas ? undefined : () => startTransition(() => setIsHovered(false))}
        >
            <div
                style={{
                    position: "relative",
                    width: responsiveCardWidth,
                    height: responsiveCardHeight,
                }}
            >
                <AnimatePresence mode="popLayout">
                    {cards.map((card, index) => {
                        const transform = getCardTransform(index, cards.length)
                        const isDismissed = dismissedCards.has(index)
                        const zIndex = cards.length - index

                        return (
                            <motion.div
                                key={`${card.title}-${index}`}
                                layout={!isCanvas}
                                drag={dragDismissEnabled && index === 0 && !isCanvas ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                dragTransition={{ bounceStiffness: 600, bounceDamping: 40 }}
                                onDragEnd={isCanvas ? undefined : (_, info) => handleDragEnd(index, info)}
                                initial={isCanvas ? false : {
                                    x: transform.x,
                                    y: transform.y,
                                    rotate: transform.rotate,
                                    scale: transform.scale,
                                    opacity: 0,
                                }}
                                animate={
                                    isDismissed
                                        ? {
                                                x: transform.x > 0 ? 1000 : -1000,
                                                rotate:
                                                    transform.x > 0
                                                        ? dragDismissRotation
                                                        : -dragDismissRotation,
                                                opacity: 0,
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 35,
                                                },
                                          }
                                        : {
                                                x: transform.x,
                                                y: transform.y,
                                                rotate: transform.rotate,
                                                scale: transform.scale,
                                                opacity: 1,
                                          }
                                }
                                exit={isCanvas ? undefined : {
                                    opacity: 0,
                                    scale: 0.8,
                                    transition: {
                                        duration: 0.2,
                                        ease: "easeOut",
                                    },
                                }}
                                transition={transition}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: responsiveCardWidth,
                                    height: responsiveCardHeight,
                                    cursor: dragDismissEnabled && index === 0 && !isCanvas ? "grab" : "default",
                                    zIndex,
                                }}
                                whileDrag={!isCanvas ? { 
                                    cursor: "grabbing", 
                                    scale: 1.05,
                                    transition: {
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 35,
                                    },
                                } : undefined}
                            >
                                <motion.a
                                    href={card.link || undefined}
                                    target={card.link ? "_blank" : undefined}
                                    rel={card.link ? "noopener noreferrer" : undefined}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        textDecoration: "none",
                                        background: themedGlassColor,
                                        border: `${glassBorderWidth}px solid ${themedBorderColor}`,
                                        borderRadius: glassBorderRadius,
                                        backdropFilter: `blur(${glassBlur}px) saturate(${glassSaturation})`,
                                        WebkitBackdropFilter: `blur(${glassBlur}px) saturate(${glassSaturation})`,
                                        boxShadow: glassShadow
                                            ? `0 8px ${glassShadowBlur}px ${glassShadowColor}`
                                            : "none",
                                        overflow: "hidden",
                                        pointerEvents: index === 0 ? "auto" : "none",
                                    }}
                                    whileHover={
                                        index === 0 && !isCanvas
                                            ? {
                                                    scale: 1.02,
                                                    transition: { 
                                                        type: "spring",
                                                        stiffness: 400,
                                                        damping: 25,
                                                    },
                                              }
                                            : {}
                                    }
                                    whileTap={
                                        index === 0 && !isCanvas
                                            ? {
                                                    scale: 0.98,
                                                    transition: { 
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 30,
                                                    },
                                              }
                                            : {}
                                    }
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            padding: responsivePadding,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: responsiveMode && isMobile ? 12 : 16,
                                        }}
                                    >
                                        {responsiveImageHeight > 0 && card.image?.src && (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: responsiveImageHeight,
                                                    borderRadius: imageBorderRadius,
                                                    overflow: "hidden",
                                                    backgroundColor: isDarkMode
                                                        ? "rgba(255,255,255,0.05)"
                                                        : "rgba(0,0,0,0.05)",
                                                }}
                                            >
                                                <img
                                                    src={card.image.src}
                                                    alt={card.image.alt || card.title}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: responsiveMode && isMobile ? 8 : 12,
                                                flex: 1,
                                            }}
                                        >
                                            {card.tag && (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        width: "fit-content",
                                                        padding:
                                                            responsiveMode && isMobile ? "3px 10px" : "4px 12px",
                                                        fontSize: responsiveTagSize,
                                                        fontWeight: "600",
                                                        color: themedTagColor,
                                                        backgroundColor: themedTagBg,
                                                        borderRadius: tagBorderRadius,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px",
                                                    }}
                                                >
                                                    {card.tag}
                                                </span>
                                            )}

                                            <h3
                                                style={{
                                                    margin: 0,
                                                    fontSize: responsiveTitleSize,
                                                    fontWeight: titleFontWeight,
                                                    color: themedTitleColor,
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {card.title}
                                            </h3>

                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: responsiveDescSize,
                                                    color: themedDescColor,
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {card.description}
                                            </p>
                                        </div>

                                        {card.accentColor && (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: responsiveMode && isMobile ? 3 : 4,
                                                    borderRadius: 2,
                                                    background: card.accentColor,
                                                    marginTop: "auto",
                                                }}
                                            />
                                        )}
                                    </div>
                                </motion.a>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}

addPropertyControls(GlassCardStack, {
    // Cards Data
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Card description goes here",
                    displayTextArea: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                tag: {
                    type: ControlType.String,
                    title: "Tag",
                    defaultValue: "Featured",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                },
                accentColor: {
                    type: ControlType.Color,
                    title: "Accent Color",
                    defaultValue: "#6366f1",
                },
            },
        },
        maxCount: 8,
        defaultValue: [
            {
                title: "Mountain Vista",
                description: "Explore breathtaking mountain landscapes and serene valleys.",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Mountain",
                },
                tag: "Nature",
                link: "",
                accentColor: "#6366f1",
            },
            {
                title: "Urban Dreams",
                description: "Discover the pulse of modern city life and architecture.",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "City",
                },
                tag: "Urban",
                link: "",
                accentColor: "#8b5cf6",
            },
            {
                title: "Sunset Horizon",
                description: "Experience the magic of golden hour across stunning vistas.",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Sunset",
                },
                tag: "Travel",
                link: "",
                accentColor: "#f59e0b",
            },
        ],
    },

    // Stack Layout
    stackMode: {
        type: ControlType.Enum,
        title: "Stack Mode",
        options: ["fan", "cascade", "overlap"],
        optionTitles: ["Fan", "Cascade", "Overlap"],
        defaultValue: "cascade",
        displaySegmentedControl: true,
    },
    stackOffsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
    },
    stackOffsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
    },
    stackRotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 3,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "°",
    },
    stackScale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 0.94,
        min: 0.8,
        max: 1.0,
        step: 0.01,
    },
    fanSpread: {
        type: ControlType.Number,
        title: "Fan Spread",
        defaultValue: 30,
        min: 10,
        max: 80,
        step: 1,
        unit: "°",
        hidden: ({ stackMode }) => stackMode !== "fan",
    },
    fanRadius: {
        type: ControlType.Number,
        title: "Fan Radius",
        defaultValue: 300,
        min: 100,
        max: 600,
        step: 10,
        hidden: ({ stackMode }) => stackMode !== "fan",
    },

    // Glass Style
    glassColor: {
        type: ControlType.Color,
        title: "Glass Color",
        defaultValue: "rgba(255,255,255,0.08)",
    },
    glassBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255,255,255,0.15)",
    },
    glassBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.5,
    },
    glassBlur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    glassSaturation: {
        type: ControlType.Number,
        title: "Saturation",
        defaultValue: 1.5,
        min: 1,
        max: 3,
        step: 0.1,
    },
    glassBorderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 24,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    glassShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glassShadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.3)",
        hidden: ({ glassShadow }) => !glassShadow,
    },
    glassShadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 40,
        min: 10,
        max: 100,
        step: 5,
        hidden: ({ glassShadow }) => !glassShadow,
    },

    // Card Size
    cardWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 340,
        min: 200,
        max: 600,
        step: 10,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 440,
        min: 200,
        max: 700,
        step: 10,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 28,
        min: 16,
        max: 64,
        step: 2,
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 180,
        min: 0,
        max: 400,
        step: 10,
    },
    imageBorderRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        defaultValue: 16,
        min: 0,
        max: 24,
        step: 1,
    },

    // Text Style
    titleFontSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 20,
        min: 14,
        max: 36,
        step: 1,
    },
    titleFontWeight: {
        type: ControlType.Enum,
        title: "Title Weight",
        options: ["500", "600", "700", "800"],
        optionTitles: ["Medium", "Semibold", "Bold", "Extra Bold"],
        defaultValue: "700",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#ffffff",
    },
    descFontSize: {
        type: ControlType.Number,
        title: "Desc Size",
        defaultValue: 14,
        min: 11,
        max: 20,
        step: 1,
    },
    descColor: {
        type: ControlType.Color,
        title: "Desc Color",
        defaultValue: "rgba(255,255,255,0.65)",
    },
    tagFontSize: {
        type: ControlType.Number,
        title: "Tag Size",
        defaultValue: 11,
        min: 9,
        max: 16,
        step: 1,
    },
    tagBg: {
        type: ControlType.Color,
        title: "Tag Background",
        defaultValue: "rgba(99,102,241,0.2)",
    },
    tagColor: {
        type: ControlType.Color,
        title: "Tag Color",
        defaultValue: "#a5b4fc",
    },
    tagBorderRadius: {
        type: ControlType.Number,
        title: "Tag Radius",
        defaultValue: 999,
        min: 0,
        max: 50,
        step: 1,
    },

    // Interaction
    hoverFanEnabled: {
        type: ControlType.Boolean,
        title: "Hover Fan",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverFanDuration: {
        type: ControlType.Number,
        title: "Fan Duration",
        defaultValue: 0.5,
        min: 0.2,
        max: 1.0,
        step: 0.1,
        unit: "s",
        hidden: ({ hoverFanEnabled }) => !hoverFanEnabled,
    },
    dragDismissEnabled: {
        type: ControlType.Boolean,
        title: "Drag Dismiss",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    dragDismissThreshold: {
        type: ControlType.Number,
        title: "Dismiss Threshold",
        defaultValue: 100,
        min: 50,
        max: 300,
        step: 10,
        hidden: ({ dragDismissEnabled }) => !dragDismissEnabled,
    },
    dragDismissRotation: {
        type: ControlType.Number,
        title: "Dismiss Rotation",
        defaultValue: 25,
        min: 10,
        max: 60,
        step: 5,
        unit: "°",
        hidden: ({ dragDismissEnabled }) => !dragDismissEnabled,
    },
    autoCycle: {
        type: ControlType.Boolean,
        title: "Auto Cycle",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoCycleInterval: {
        type: ControlType.Number,
        title: "Cycle Interval",
        defaultValue: 3000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        hidden: ({ autoCycle }) => !autoCycle,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        defaultValue: 400,
        min: 100,
        max: 600,
        step: 50,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        defaultValue: 40,
        min: 10,
        max: 50,
        step: 5,
    },

    // Background
    showBackground: {
        type: ControlType.Boolean,
        title: "Show Background",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "rgba(0,0,0,0.5)",
        hidden: ({ showBackground }) => !showBackground,
    },
    backgroundBlur: {
        type: ControlType.Number,
        title: "BG Blur",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        hidden: ({ showBackground }) => !showBackground,
    },

    // Theme
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "auto"],
        optionTitles: ["Light", "Dark", "Auto"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },

    // Responsive
    responsiveMode: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    mobileCardWidth: {
        type: ControlType.Number,
        title: "Mobile Width",
        defaultValue: 280,
        min: 200,
        max: 400,
        step: 10,
        hidden: ({ responsiveMode }) => !responsiveMode,
    },
    mobileCardHeight: {
        type: ControlType.Number,
        title: "Mobile Height",
        defaultValue: 380,
        min: 200,
        max: 600,
        step: 10,
        hidden: ({ responsiveMode }) => !responsiveMode,
    },
    mobilePadding: {
        type: ControlType.Number,
        title: "Mobile Padding",
        defaultValue: 20,
        min: 12,
        max: 40,
        step: 2,
        hidden: ({ responsiveMode }) => !responsiveMode,
    },
    mobileImageHeight: {
        type: ControlType.Number,
        title: "Mobile Image H",
        defaultValue: 140,
        min: 0,
        max: 300,
        step: 10,
        hidden: ({ responsiveMode }) => !responsiveMode,
    },
    mobileTitleSize: {
        type: ControlType.Number,
        title: "Mobile Title",
        defaultValue: 18,
        min: 14,
        max: 28,
        step: 1,
        hidden: ({ responsiveMode }) => !responsiveMode,
    },
    mobileDescSize: {
        type: ControlType.Number,
        title: "Mobile Desc",
        defaultValue: 13,
        min: 11,
        max: 18,
        step: 1,
        hidden: ({ responsiveMode }) => !responsiveMode,
    },
    mobileTagSize: {
        type: ControlType.Number,
        title: "Mobile Tag",
        defaultValue: 10,
        min: 8,
        max: 14,
        step: 1,
        hidden: ({ responsiveMode }) => !responsiveMode,
    },
})
