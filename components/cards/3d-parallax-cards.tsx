// 3D Parallax Card Grid component with glassmorphism, responsive layout, and accessibility features
import { useState, useRef, useEffect, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

interface CardData {
    image: { src: string; alt: string }
    title: string
    description: string
    tag: string
    linkLabel: string
    linkUrl: string
    linkIcon?: string
    cardWidth?: number
    cardHeight?: number
}

interface ParallaxCardGridProps {
    cards: CardData[]
    mobileColumns: number
    tabletColumns: number
    desktopColumns: number
    gap: number
    aspectRatio: number
    cardWidth: number
    cardHeight: number
    borderRadius: number
    tiltDepth: number
    shadowStrength: number
    enableGlare: boolean
    enableRevealAnimation: boolean
    enableGlassmorphism: boolean
    surfaceColor: string
    backgroundColor: string
    textColor: string
    linkTextColor: string
    theme: "light" | "dark"
    hoverVariant: "tilt" | "cards-elevate-on-hover"
    gridDirection: "horizontal" | "vertical"
    titleFont: any
    descriptionFont: any
    tagFont: any
    linkFont: any
    style?: CSSProperties
}

/**
 * 3D Parallax Card Grid
 * 
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ParallaxCardGrid(props: ParallaxCardGridProps) {
    const {
        cards = [
            {
                image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Featured Project" },
                title: "Featured Project",
                description: "Innovative design solution with modern aesthetics and user-centered approach.",
                tag: "Design",
                linkLabel: "View Project",
                linkUrl: "#"
            },
            {
                image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Creative Work" },
                title: "Creative Work",
                description: "Exploring new possibilities in digital experiences and interactive design.",
                tag: "Development",
                linkLabel: "Learn More",
                linkUrl: "#"
            },
            {
                image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Innovation" },
                title: "Innovation",
                description: "Pushing boundaries with cutting-edge technology and creative solutions.",
                tag: "Research",
                linkLabel: "Explore",
                linkUrl: "#"
            }
        ],
        mobileColumns = 1,
        tabletColumns = 2,
        desktopColumns = 3,
        gap = 24,
        aspectRatio = 1.2,
        borderRadius = 16,
        tiltDepth = 8,
        shadowStrength = 0.15,
        enableGlare = true,
        enableRevealAnimation = true,
        enableGlassmorphism = false,
        surfaceColor = "#FFFFFF",
        backgroundColor = "#F5F5F5",
        textColor = "#000000",
        linkTextColor = "#2563EB",
        theme = "light",
        gridDirection = "horizontal",
        titleFont,
        descriptionFont,
        tagFont,
        linkFont
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, margin: "-100px" })
    const isStatic = useIsStaticRenderer()
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

    useEffect(() => {
        if (typeof window !== "undefined") {
            const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
            setPrefersReducedMotion(mediaQuery.matches)
            
            const handleChange = (e: MediaQueryListEvent) => {
                startTransition(() => setPrefersReducedMotion(e.matches))
            }
            
            mediaQuery.addEventListener("change", handleChange)
            return () => mediaQuery.removeEventListener("change", handleChange)
        }
    }, [])

    // Track container size for responsive scaling
    useEffect(() => {
        if (!containerRef.current) return

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                startTransition(() => {
                    setContainerSize({ width, height })
                })
            }
        })

        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    const gridColumns = useMemo(() => {
        return {
            mobile: mobileColumns,
            tablet: tabletColumns,
            desktop: desktopColumns
        }
    }, [mobileColumns, tabletColumns, desktopColumns])

    // Calculate responsive scale based on container size
    const baseWidth = 800 // Base design width
    const baseHeight = 600 // Base design height
    const scaleX = containerSize.width / baseWidth
    const scaleY = containerSize.height / baseHeight
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up beyond 100%

    // Calculate responsive gap and sizing
    const responsiveGap = Math.max(gap * scale, 8) // Minimum gap of 8px
    const responsiveBorderRadius = borderRadius * scale

    const shouldAnimate = !isStatic && !prefersReducedMotion

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                padding: `${responsiveGap}px`,
                minHeight: "200px",
                overflow: "hidden"
            }}
        >
            <div
                style={{
                    display: gridDirection === "vertical" ? "flex" : "grid",
                    ...(gridDirection === "vertical" ? {
                        flexDirection: "column",
                        gap: `${responsiveGap}px`
                    } : {
                        gridTemplateColumns: `repeat(${gridColumns.mobile}, 1fr)`,
                        gap: `${responsiveGap}px`,
                        alignItems: "start",
                        justifyItems: "center"
                    }),
                    width: "100%",
                    height: "100%",
                    transform: `scale(${scale})`,
                    transformOrigin: "top left"
                }}
                className="card-grid"
            >
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        card={card}
                        index={index}
                        aspectRatio={aspectRatio}
                        borderRadius={responsiveBorderRadius}
                        tiltDepth={tiltDepth}
                        shadowStrength={shadowStrength}
                        enableGlare={enableGlare}
                        enableRevealAnimation={enableRevealAnimation && shouldAnimate}
                        enableGlassmorphism={enableGlassmorphism}
                        surfaceColor={surfaceColor}
                        textColor={textColor}
                        linkTextColor={linkTextColor}
                        theme={theme}
                        hoverVariant={props.hoverVariant}
                        titleFont={titleFont}
                        descriptionFont={descriptionFont}
                        tagFont={tagFont}
                        linkFont={linkFont}
                        isInView={isInView}
                        shouldAnimate={shouldAnimate}
                        cardWidth={card.cardWidth}
                        cardHeight={card.cardHeight}
                    />
                ))}
            </div>

            {gridDirection === "horizontal" && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                        @media (min-width: 768px) {
                            .card-grid {
                                grid-template-columns: repeat(${gridColumns.tablet}, 1fr) !important;
                            }
                        }
                        @media (min-width: 1024px) {
                            .card-grid {
                                grid-template-columns: repeat(${gridColumns.desktop}, 1fr) !important;
                            }
                        }
                    `
                }} />
            )}
        </div>
    )
}

interface CardProps {
    card: CardData
    index: number
    aspectRatio: number
    borderRadius: number
    tiltDepth: number
    shadowStrength: number
    enableGlare: boolean
    enableRevealAnimation: boolean
    enableGlassmorphism: boolean
    surfaceColor: string
    textColor: string
    linkTextColor: string
    theme: "light" | "dark"
    hoverVariant: "tilt" | "cards-elevate-on-hover"
    titleFont: any
    descriptionFont: any
    tagFont: any
    linkFont: any
    isInView: boolean
    shouldAnimate: boolean
    cardWidth?: number
    cardHeight?: number
}

function Card({
    card,
    index,
    aspectRatio,
    borderRadius,
    tiltDepth,
    shadowStrength,
    enableGlare,
    enableRevealAnimation,
    enableGlassmorphism,
    surfaceColor,
    textColor,
    linkTextColor,
    theme,
    hoverVariant,
    titleFont,
    descriptionFont,
    tagFont,
    linkFont,
    isInView,
    shouldAnimate,
    cardWidth,
    cardHeight
}: CardProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    // Add default image handling
    const cardImage = card.image || { 
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", 
        alt: "Default image" 
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!shouldAnimate || !cardRef.current) return

        const rect = cardRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
        const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)

        startTransition(() => {
            setMousePosition({ x, y })
        })
    }

    const handleMouseEnter = () => {
        if (shouldAnimate) {
            startTransition(() => setIsHovered(true))
        }
    }

    const handleMouseLeave = () => {
        if (shouldAnimate) {
            startTransition(() => {
                setIsHovered(false)
                setMousePosition({ x: 0, y: 0 })
            })
        }
    }

    const tiltX = shouldAnimate && hoverVariant === "tilt" ? mousePosition.y * tiltDepth : 0
    const tiltY = shouldAnimate && hoverVariant === "tilt" ? -mousePosition.x * tiltDepth : 0

    const glareOpacity = enableGlare && isHovered ? 0.1 : 0
    const glareX = (mousePosition.x + 1) * 50
    const glareY = (mousePosition.y + 1) * 50

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 60,
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.6,
                delay: enableRevealAnimation ? index * 0.1 : 0,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    }

    const glassmorphismStyles = enableGlassmorphism ? {
        backdropFilter: "blur(20px)",
        backgroundColor: theme === "dark" 
            ? "rgba(255, 255, 255, 0.1)" 
            : "rgba(255, 255, 255, 0.8)",
        border: `1px solid ${theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"}`
    } : {
        backgroundColor: surfaceColor
    }

    // Handle reduced motion: use scale and shadow only

    return (
        <motion.div
            ref={cardRef}
            variants={enableRevealAnimation ? cardVariants : undefined}
            initial={enableRevealAnimation ? "hidden" : undefined}
            animate={enableRevealAnimation && isInView ? "visible" : undefined}
            style={{
                perspective: "1000px",
                transformStyle: "preserve-3d"
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    width: cardWidth ? `${cardWidth}px` : "100%",
                    height: cardHeight ? `${cardHeight}px` : undefined,
                    aspectRatio: cardHeight ? undefined : `1 / ${aspectRatio}`,
                    borderRadius: `${borderRadius}px`,
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    ...glassmorphismStyles
                }}
                animate={shouldAnimate ? {
                    ...(hoverVariant === "cards-elevate-on-hover" ? {
                        // Elevate variant: y-translate and shadow bloom
                        y: isHovered ? -8 : 0,
                        boxShadow: isHovered 
                            ? `0 20px 40px rgba(0, 0, 0, ${shadowStrength * 1.8})`
                            : `0 8px 24px rgba(0, 0, 0, ${shadowStrength})`
                    } : {
                        // Tilt variant: rotation and shadow
                        rotateX: tiltX,
                        rotateY: tiltY,
                        boxShadow: isHovered 
                            ? `0 ${20 + tiltDepth}px ${40 + tiltDepth * 2}px rgba(0, 0, 0, ${shadowStrength * 1.5})`
                            : `0 8px 24px rgba(0, 0, 0, ${shadowStrength})`
                    })
                } : {}}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
                onClick={() => {
                    if (card.linkUrl && card.linkUrl !== "#") {
                        try {
                            // Handle different URL formats
                            if (card.linkUrl.startsWith('http://') || card.linkUrl.startsWith('https://')) {
                                window.open(card.linkUrl, '_blank', 'noopener,noreferrer')
                            } else if (card.linkUrl.startsWith('/') || card.linkUrl.startsWith('#')) {
                                window.location.href = card.linkUrl
                            } else {
                                // Assume it's an external URL without protocol
                                window.open(`https://${card.linkUrl}`, '_blank', 'noopener,noreferrer')
                            }
                        } catch (error) {
                            console.warn('Failed to navigate to URL:', card.linkUrl)
                        }
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${card.title} - ${card.description}`}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        if (card.linkUrl && card.linkUrl !== "#") {
                            try {
                                if (card.linkUrl.startsWith('http://') || card.linkUrl.startsWith('https://')) {
                                    window.open(card.linkUrl, '_blank', 'noopener,noreferrer')
                                } else if (card.linkUrl.startsWith('/') || card.linkUrl.startsWith('#')) {
                                    window.location.href = card.linkUrl
                                } else {
                                    window.open(`https://${card.linkUrl}`, '_blank', 'noopener,noreferrer')
                                }
                            } catch (error) {
                                console.warn('Failed to navigate to URL:', card.linkUrl)
                            }
                        }
                    }
                }}
            >
                {/* Image */}
                <div
                    style={{
                        width: "100%",
                        height: "60%",
                        backgroundImage: `url(${cardImage.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative"
                    }}
                    role="img"
                    aria-label={cardImage.alt}
                >
                    {/* Glare Effect */}
                    {enableGlare && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, ${glareOpacity}) 0%, transparent 50%)`,
                                pointerEvents: "none",
                                transition: "opacity 0.3s ease-out"
                            }}
                        />
                    )}

                    {/* Tag */}
                    <div
                        style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            color: "#FFFFFF",
                            fontSize: tagFont?.fontSize || "12px",
                            fontFamily: tagFont?.fontFamily,
                            fontWeight: tagFont?.fontWeight,
                            fontStyle: tagFont?.fontStyle,
                            letterSpacing: tagFont?.letterSpacing,
                            lineHeight: tagFont?.lineHeight
                        }}
                    >
                        {card.tag}
                    </div>
                </div>

                {/* Content */}
                <div
                    style={{
                        padding: "16px",
                        height: "40%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                    }}
                >
                    <div>
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                color: textColor,
                                fontSize: titleFont?.fontSize || "18px",
                                fontWeight: titleFont?.fontWeight,
                                fontStyle: titleFont?.fontStyle,
                                fontFamily: titleFont?.fontFamily,
                                letterSpacing: titleFont?.letterSpacing,
                                lineHeight: titleFont?.lineHeight,
                                width: "max-content",
                                minWidth: "max-content"
                            }}
                        >
                            {card.title}
                        </h3>
                        <p
                            style={{
                                margin: "0 0 12px 0",
                                color: textColor,
                                opacity: 0.7,
                                fontSize: descriptionFont?.fontSize || "14px",
                                fontWeight: descriptionFont?.fontWeight,
                                fontStyle: descriptionFont?.fontStyle,
                                fontFamily: descriptionFont?.fontFamily,
                                letterSpacing: descriptionFont?.letterSpacing,
                                lineHeight: descriptionFont?.lineHeight,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                            }}
                        >
                            {card.description}
                        </p>
                    </div>

                    {card.linkLabel && (
                        <button
                            style={{
                                fontSize: linkFont?.fontSize || "14px",
                                fontWeight: linkFont?.fontWeight,
                                fontStyle: linkFont?.fontStyle,
                                fontFamily: linkFont?.fontFamily,
                                letterSpacing: linkFont?.letterSpacing,
                                lineHeight: linkFont?.lineHeight,
                                color: linkTextColor,
                                backgroundColor: "transparent",
                                border: "none",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "background-color 0.2s ease",
                                width: "max-content"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent"
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (card.linkUrl && card.linkUrl !== "#") {
                                    try {
                                        if (card.linkUrl.startsWith('http://') || card.linkUrl.startsWith('https://')) {
                                            window.open(card.linkUrl, '_blank', 'noopener,noreferrer')
                                        } else if (card.linkUrl.startsWith('/') || card.linkUrl.startsWith('#')) {
                                            window.location.href = card.linkUrl
                                        } else {
                                            window.open(`https://${card.linkUrl}`, '_blank', 'noopener,noreferrer')
                                        }
                                    } catch (error) {
                                        console.warn('Failed to navigate to URL:', card.linkUrl)
                                    }
                                }
                            }}
                        >
                            {card.linkLabel}
                            {card.linkIcon && card.linkIcon !== "none" && (
                                <span style={{ fontSize: "16px" }}>{card.linkIcon}</span>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(ParallaxCardGrid, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image"
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card Title"
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Card description text",
                    displayTextArea: true
                },
                tag: {
                    type: ControlType.String,
                    title: "Tag",
                    defaultValue: "Category"
                },
                linkLabel: {
                    type: ControlType.String,
                    title: "Link Label",
                    defaultValue: "Learn More"
                },
                linkUrl: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "#"
                },
                linkIcon: {
                    type: ControlType.Enum,
                    title: "Link Icon",
                    options: ["none", "📖", "→", "↗", "🔗", "📄", "🎯", "⚡", "🚀", "💡", "🔍", "📊", "🎨", "🛠", "📱", "💻"],
                    optionTitles: ["None", "Book", "Arrow Right", "Arrow Up Right", "Link", "Document", "Target", "Lightning", "Rocket", "Bulb", "Search", "Chart", "Palette", "Tools", "Mobile", "Computer"],
                    defaultValue: "none"
                },
                cardWidth: {
                    type: ControlType.Number,
                    title: "Card Width",
                    defaultValue: 300,
                    min: 200,
                    max: 600,
                    step: 10,
                    unit: "px"
                },
                cardHeight: {
                    type: ControlType.Number,
                    title: "Card Height", 
                    defaultValue: 400,
                    min: 250,
                    max: 700,
                    step: 10,
                    unit: "px"
                }
            }
        },
        maxCount: 12
    },
    gridDirection: {
        type: ControlType.Enum,
        title: "Layout Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Grid", "Stack"],
        defaultValue: "horizontal",
        displaySegmentedControl: true
    },
    mobileColumns: {
        type: ControlType.Number,
        title: "Mobile Columns",
        defaultValue: 1,
        min: 1,
        max: 2,
        step: 1,
        displayStepper: true
    },
    tabletColumns: {
        type: ControlType.Number,
        title: "Tablet Columns",
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 1,
        displayStepper: true
    },
    desktopColumns: {
        type: ControlType.Number,
        title: "Desktop Columns",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 24,
        min: 8,
        max: 48,
        step: 4,
        unit: "px"
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Card Aspect Ratio",
        defaultValue: 1.2,
        min: 0.8,
        max: 2,
        step: 0.1
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 32,
        step: 2,
        unit: "px"
    },
    tiltDepth: {
        type: ControlType.Number,
        title: "Tilt Depth",
        defaultValue: 8,
        min: 0,
        max: 12,
        step: 1,
        unit: "deg"
    },
    shadowStrength: {
        type: ControlType.Number,
        title: "Shadow Strength",
        defaultValue: 0.15,
        min: 0,
        max: 0.5,
        step: 0.05
    },
    enableGlare: {
        type: ControlType.Boolean,
        title: "Glare Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    enableRevealAnimation: {
        type: ControlType.Boolean,
        title: "Reveal Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    enableGlassmorphism: {
        type: ControlType.Boolean,
        title: "Glassmorphism",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Surface Color",
        defaultValue: "#FFFFFF"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#F5F5F5"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000"
    },
    linkTextColor: {
        type: ControlType.Color,
        title: "Link Text Color",
        defaultValue: "#2563EB"
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true
    },
    hoverVariant: {
        type: ControlType.Enum,
        title: "Hover Variant",
        options: ["tilt", "cards-elevate-on-hover"],
        optionTitles: ["Tilt", "Elevate"],
        defaultValue: "tilt",
        displaySegmentedControl: true
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    tagFont: {
        type: ControlType.Font,
        title: "Tag Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    }
})