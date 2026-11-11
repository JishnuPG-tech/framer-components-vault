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

import { AnimatePresence, motion } from "framer-motion"

type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type TabItem = {
    tab: string
    eyebrow: string
    title: string
    description: string

    image?: ResponsiveImage

    primaryLabel: string
    primaryLink: string
    primaryNewTab: boolean

    secondaryLabel: string
    secondaryLink: string
    secondaryNewTab: boolean
}

type Props = {
    items: TabItem[]

    cardLink: string
    cardNewTab: boolean

    cardBackground: string

    textColor: string
    mutedTextColor: string

    tabColor: string
    activeTabColor: string

    primaryBackground: string
    primaryTextColor: string

    secondaryColor: string

    arrowBackground: string
    arrowColor: string

    imageOverlayColor: string
    imageOverlayOpacity: number
    grainOpacity: number

    cardRadius: number
    imageRadius: number

    cardWidth: number
    imageWidth: number
    imageHeight: number

    animationSpeed: number
    imageZoom: number

    eyebrowFont: React.CSSProperties
    tabFont: React.CSSProperties
    titleFont: React.CSSProperties
    bodyFont: React.CSSProperties
    buttonFont: React.CSSProperties
    counterFont: React.CSSProperties

    style?: React.CSSProperties
}

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=90"

const DEFAULT_ITEMS: TabItem[] = [
    {
        tab: "Overview",
        eyebrow: "Overview",
        title: "Designed for what’s next.",
        description:
            "A flexible tab component to present your ideas, products or services with impact.",

        image: {
            src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=90",
            alt: "Minimal interior",
        },

        primaryLabel: "Get Started",
        primaryLink: "#",
        primaryNewTab: false,

        secondaryLabel: "Learn More",
        secondaryLink: "#",
        secondaryNewTab: false,
    },
    {
        tab: "Features",
        eyebrow: "Features",
        title: "Everything in one place.",
        description:
            "Showcase key features with a strong visual, clear hierarchy and simple navigation.",

        image: {
            src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=90",
            alt: "Modern architecture",
        },

        primaryLabel: "Explore",
        primaryLink: "#",
        primaryNewTab: false,

        secondaryLabel: "View Details",
        secondaryLink: "#",
        secondaryNewTab: false,
    },
    {
        tab: "Details",
        eyebrow: "Details",
        title: "Made to be flexible.",
        description:
            "Adapt every tab to your own content, imagery and brand without changing the layout.",

        image: {
            src: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1800&q=90",
            alt: "Architectural interior",
        },

        primaryLabel: "Discover",
        primaryLink: "#",
        primaryNewTab: false,

        secondaryLabel: "More Info",
        secondaryLink: "#",
        secondaryNewTab: false,
    },
    {
        tab: "Gallery",
        eyebrow: "Gallery",
        title: "Let the visual lead.",
        description:
            "Large imagery stays at the center of the experience while your content remains clear and easy to explore.",

        image: {
            src: "https://images.unsplash.com/photo-1600607688066-890987f18a86?auto=format&fit=crop&w=1800&q=90",
            alt: "Minimal architectural space",
        },

        primaryLabel: "View Project",
        primaryLink: "#",
        primaryNewTab: false,

        secondaryLabel: "See More",
        secondaryLink: "#",
        secondaryNewTab: false,
    },
]

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='.55'/%3E%3C/svg%3E")`

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function getFrameNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) && value > 0
        ? value
        : undefined
}

function ArrowIcon({
    direction = "right",
    size = 14,
}: {
    direction?: "left" | "right"
    size?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            style={{
                display: "block",
                transform: direction === "left" ? "rotate(180deg)" : "none",
            }}
        >
            <path
                d="M3 8H13"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
            />

            <path
                d="M9.25 4.25L13 8L9.25 11.75"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 650
 */
export default function AsymmetricTabs(props: Props) {
    const {
        items = DEFAULT_ITEMS,

        cardLink = "",
        cardNewTab = false,

        cardBackground = "#F7F5F1",

        textColor = "#171717",
        mutedTextColor = "rgba(23,23,23,0.60)",

        tabColor = "rgba(23,23,23,0.48)",
        activeTabColor = "#171717",

        primaryBackground = "#171717",
        primaryTextColor = "#FFFFFF",

        secondaryColor = "#171717",

        arrowBackground = "#171717",
        arrowColor = "#FFFFFF",

        imageOverlayColor = "#000000",
        imageOverlayOpacity = 0.02,
        grainOpacity = 0.06,

        cardRadius = 22,
        imageRadius = 20,

        cardWidth = 48,
        imageWidth = 68,
        imageHeight = 82,

        animationSpeed = 0.55,
        imageZoom = 1.035,

        eyebrowFont,
        tabFont,
        titleFont,
        bodyFont,
        buttonFont,
        counterFont,

        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)

    const styleWidth = getFrameNumber(style?.width)

    const styleHeight = getFrameNumber(style?.height)

    const [frameSize, setFrameSize] = React.useState({
        width: styleWidth ?? 1000,
        height: styleHeight ?? 650,
    })

    useIsomorphicLayoutEffect(() => {
        const element = containerRef.current

        if (!element) return

        const updateSize = () => {
            const width = element.clientWidth
            const height = element.clientHeight

            if (width > 0 && height > 0) {
                setFrameSize({
                    width,
                    height,
                })
            }
        }

        updateSize()

        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]

            if (!entry) return

            const width = entry.contentRect.width

            const height = entry.contentRect.height

            if (width <= 0 || height <= 0) return

            setFrameSize({
                width,
                height,
            })
        })

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const frameWidth = styleWidth ?? frameSize.width

    const isMobile = frameWidth < 600

    const isTablet = frameWidth >= 600 && frameWidth < 820

    const isDesktop = frameWidth >= 820

    const safeItems = items && items.length ? items : DEFAULT_ITEMS

    const [activeIndex, setActiveIndex] = React.useState(0)

    React.useEffect(() => {
        setActiveIndex((current) => clamp(current, 0, safeItems.length - 1))
    }, [safeItems.length])

    const activeItem = safeItems[clamp(activeIndex, 0, safeItems.length - 1)]

    const imageSrc = activeItem.image?.src || FALLBACK_IMAGE

    const imageAlt = activeItem.image?.alt || activeItem.title

    const goTo = React.useCallback(
        (index: number) => {
            setActiveIndex(clamp(index, 0, safeItems.length - 1))
        },
        [safeItems.length]
    )

    const next = React.useCallback(() => {
        setActiveIndex((current) =>
            current >= safeItems.length - 1 ? 0 : current + 1
        )
    }, [safeItems.length])

    const previous = React.useCallback(() => {
        setActiveIndex((current) =>
            current <= 0 ? safeItems.length - 1 : current - 1
        )
    }, [safeItems.length])

    const openLink = React.useCallback(
        (url: string, newTab: boolean) => {
            if (isStatic || !url || typeof window === "undefined") return

            if (newTab) {
                window.open(url, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = url
            }
        },
        [isStatic]
    )

    const openCardLink = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (isStatic || !cardLink || typeof window === "undefined") {
                return
            }

            const target = event.target as HTMLElement

            if (target.closest("a, button, input, textarea, select")) {
                return
            }

            if (cardNewTab) {
                window.open(cardLink, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = cardLink
            }
        },
        [cardLink, cardNewTab, isStatic]
    )

    const tabs = (
        <div
            style={{
                width: "100%",

                display: "flex",
                alignItems: "center",

                gap: isMobile ? 18 : 26,

                overflowX: "auto",
                overflowY: "hidden",

                scrollbarWidth: "none",

                WebkitOverflowScrolling: "touch",

                flexShrink: 0,
            }}
        >
            {safeItems.map((item, index) => {
                const active = index === activeIndex

                return (
                    <button
                        key={`${item.tab}-${index}`}
                        type="button"
                        onClick={isStatic ? undefined : () => goTo(index)}
                        style={{
                            appearance: "none",

                            border: "none",
                            outline: "none",

                            padding: "0 0 9px",

                            margin: 0,

                            flexShrink: 0,

                            background: "transparent",

                            color: active ? activeTabColor : tabColor,

                            borderBottom: active
                                ? `1px solid ${activeTabColor}`
                                : "1px solid transparent",

                            cursor: isStatic ? "default" : "pointer",

                            transition: isStatic
                                ? "none"
                                : `color ${
                                      animationSpeed * 0.45
                                  }s ease, border-color ${
                                      animationSpeed * 0.45
                                  }s ease`,

                            ...tabFont,
                        }}
                    >
                        {item.tab}
                    </button>
                )
            })}
        </div>
    )

    const imagePanel = (
        <div
            style={{
                position: "absolute",

                right: 0,

                top: isDesktop ? "8%" : isTablet ? "10%" : 0,

                width: isDesktop
                    ? `${clamp(imageWidth, 50, 82)}%`
                    : isTablet
                      ? "68%"
                      : "100%",

                height: isDesktop
                    ? `${clamp(imageHeight, 55, 92)}%`
                    : isTablet
                      ? "76%"
                      : "58%",

                overflow: "hidden",

                borderRadius: imageRadius,

                backgroundColor: "#C8C3BA",
            }}
        >
            {isStatic ? (
                <img
                    src={imageSrc}
                    srcSet={activeItem.image?.srcSet}
                    alt={imageAlt}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,

                        width: "100%",
                        height: "100%",

                        objectFit: "cover",
                        objectPosition: "center",

                        display: "block",

                        userSelect: "none",
                    }}
                />
            ) : (
                <AnimatePresence initial={false} mode="sync">
                    <motion.img
                        key={`${activeIndex}-${imageSrc}`}
                        src={imageSrc}
                        srcSet={activeItem.image?.srcSet}
                        alt={imageAlt}
                        draggable={false}
                        initial={{
                            opacity: 0,
                            scale: imageZoom,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 1.01,
                        }}
                        transition={{
                            duration: animationSpeed,

                            ease: [0.4, 0, 0.2, 1],
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,

                            width: "100%",
                            height: "100%",

                            objectFit: "cover",

                            objectPosition: "center",

                            display: "block",

                            userSelect: "none",
                        }}
                    />
                </AnimatePresence>
            )}

            {imageOverlayOpacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,

                        backgroundColor: imageOverlayColor,

                        opacity: imageOverlayOpacity,

                        pointerEvents: "none",
                    }}
                />
            )}

            {grainOpacity > 0 && (
                <div
                    style={{
                        position: "absolute",

                        inset: "-20%",

                        width: "140%",
                        height: "140%",

                        backgroundImage: GRAIN_TEXTURE,

                        backgroundRepeat: "repeat",

                        backgroundSize: "180px 180px",

                        opacity: grainOpacity,

                        mixBlendMode: "soft-light",

                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )

    const content = (
        <div
            style={{
                width: "100%",
                height: "100%",

                display: "grid",

                gridTemplateRows: "auto minmax(0, 1fr) auto",

                boxSizing: "border-box",
            }}
        >
            {/* Tabs stay fixed */}
            <div
                style={{
                    width: "100%",
                }}
            >
                {tabs}
            </div>

            {/* Only text changes */}
            <div
                style={{
                    minHeight: 0,

                    paddingTop: isMobile ? 28 : 32,

                    paddingBottom: isMobile ? 20 : 22,

                    display: "flex",

                    flexDirection: "column",

                    alignItems: "flex-start",

                    justifyContent: "flex-start",

                    overflow: "hidden",
                }}
            >
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={
                            isStatic
                                ? false
                                : {
                                      opacity: 0,
                                      y: 10,
                                  }
                        }
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={
                            isStatic
                                ? undefined
                                : {
                                      opacity: 0,
                                      y: -7,
                                  }
                        }
                        transition={{
                            duration: animationSpeed * 0.7,

                            ease: [0.4, 0, 0.2, 1],
                        }}
                        style={{
                            width: "100%",
                        }}
                    >
                        {activeItem.eyebrow && (
                            <div
                                style={{
                                    marginBottom: 12,

                                    color: mutedTextColor,

                                    textTransform: "uppercase",

                                    ...eyebrowFont,
                                }}
                            >
                                {activeItem.eyebrow}
                            </div>
                        )}

                        <h2
                            style={{
                                margin: 0,

                                maxWidth: 500,

                                color: textColor,

                                ...titleFont,

                                ...(isMobile
                                    ? {
                                          fontSize: "34px",

                                          lineHeight: "0.98em",
                                      }
                                    : {}),
                            }}
                        >
                            {activeItem.title}
                        </h2>

                        <p
                            style={{
                                margin: "18px 0 0",

                                maxWidth: 430,

                                color: mutedTextColor,

                                ...bodyFont,
                            }}
                        >
                            {activeItem.description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Buttons stay fixed */}
            <div
                style={{
                    display: "flex",

                    alignItems: "center",

                    flexWrap: "wrap",

                    gap: 22,

                    flexShrink: 0,
                }}
            >
                {activeItem.primaryLabel && (
                    <button
                        type="button"
                        onClick={
                            isStatic
                                ? undefined
                                : () =>
                                      openLink(
                                          activeItem.primaryLink,
                                          activeItem.primaryNewTab
                                      )
                        }
                        style={{
                            appearance: "none",

                            border: "none",
                            outline: "none",

                            minHeight: 46,

                            padding: "0 18px 0 20px",

                            display: "inline-flex",

                            alignItems: "center",

                            gap: 24,

                            borderRadius: 999,

                            backgroundColor: primaryBackground,

                            color: primaryTextColor,

                            cursor: isStatic ? "default" : "pointer",

                            ...buttonFont,
                        }}
                    >
                        <span>{activeItem.primaryLabel}</span>

                        <ArrowIcon size={13} />
                    </button>
                )}

                {activeItem.secondaryLabel && (
                    <button
                        type="button"
                        onClick={
                            isStatic
                                ? undefined
                                : () =>
                                      openLink(
                                          activeItem.secondaryLink,
                                          activeItem.secondaryNewTab
                                      )
                        }
                        style={{
                            appearance: "none",

                            border: "none",
                            outline: "none",

                            padding: "4px 0",

                            borderBottom: `1px solid ${secondaryColor}`,

                            background: "transparent",

                            color: secondaryColor,

                            cursor: isStatic ? "default" : "pointer",

                            ...buttonFont,
                        }}
                    >
                        {activeItem.secondaryLabel}
                    </button>
                )}
            </div>
        </div>
    )

    const navigation = (
        <div
            style={{
                position: "absolute",

                /* no left margin */
                left: 0,

                bottom: 8,

                display: "flex",

                alignItems: "center",

                gap: 22,

                zIndex: 5,
            }}
        >
            <div
                style={{
                    minWidth: 44,

                    color: mutedTextColor,

                    ...counterFont,
                }}
            >
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(safeItems.length).padStart(2, "0")}
            </div>

            <div
                style={{
                    display: "flex",

                    gap: 8,
                }}
            >
                <button
                    type="button"
                    onClick={isStatic ? undefined : previous}
                    style={{
                        width: 38,
                        height: 38,

                        padding: 0,

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        borderRadius: 999,

                        border: "1px solid rgba(23,23,23,0.16)",

                        backgroundColor: "transparent",

                        color: textColor,

                        cursor: isStatic ? "default" : "pointer",
                    }}
                >
                    <ArrowIcon direction="left" size={13} />
                </button>

                <button
                    type="button"
                    onClick={isStatic ? undefined : next}
                    style={{
                        width: 38,
                        height: 38,

                        padding: 0,

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        borderRadius: 999,

                        border: "none",

                        backgroundColor: arrowBackground,

                        color: arrowColor,

                        cursor: isStatic ? "default" : "pointer",
                    }}
                >
                    <ArrowIcon direction="right" size={13} />
                </button>
            </div>
        </div>
    )

    return (
        <div
            ref={containerRef}
            onClick={openCardLink}
            style={{
                ...style,

                width: style?.width ?? 1000,

                height: style?.height ?? 650,

                minWidth: 1,
                minHeight: 1,

                position: "relative",

                /*
                 * No padding.
                 * No outer background.
                 * No left spacing.
                 */
                padding: 0,

                margin: 0,

                boxSizing: "border-box",

                overflow: "visible",

                background: "transparent",

                cursor: !isStatic && cardLink ? "pointer" : "default",
            }}
        >
            {isDesktop && (
                <>
                    {imagePanel}

                    <div
                        style={{
                            position: "absolute",

                            /* fully flush left */
                            left: 0,

                            top: "18%",

                            width: `${clamp(cardWidth, 34, 60)}%`,

                            height: "58%",

                            padding: "34px 36px 38px",

                            boxSizing: "border-box",

                            borderRadius: cardRadius,

                            backgroundColor: cardBackground,

                            overflow: "hidden",

                            zIndex: 3,
                        }}
                    >
                        {content}
                    </div>

                    {navigation}
                </>
            )}

            {isTablet && (
                <>
                    {imagePanel}

                    <div
                        style={{
                            position: "absolute",

                            /* fully flush left */
                            left: 0,

                            top: "20%",

                            width: "58%",

                            height: "58%",

                            padding: "28px 28px 32px",

                            boxSizing: "border-box",

                            borderRadius: cardRadius,

                            backgroundColor: cardBackground,

                            overflow: "hidden",

                            zIndex: 3,
                        }}
                    >
                        {content}
                    </div>

                    {navigation}
                </>
            )}

            {isMobile && (
                <>
                    <div
                        style={{
                            position: "relative",

                            width: "100%",

                            height: "100%",

                            margin: 0,
                            padding: 0,
                        }}
                    >
                        {imagePanel}

                        <div
                            style={{
                                position: "absolute",

                                left: 0,
                                right: 0,

                                bottom: 54,

                                height: "58%",

                                padding: "26px 24px 30px",

                                boxSizing: "border-box",

                                borderRadius: cardRadius,

                                backgroundColor: cardBackground,

                                overflow: "hidden",

                                zIndex: 3,
                            }}
                        >
                            {content}
                        </div>

                        {navigation}
                    </div>
                </>
            )}
        </div>
    )
}

addPropertyControls(AsymmetricTabs, {
    items: {
        type: ControlType.Array,
        title: "Tabs",

        control: {
            type: ControlType.Object,

            controls: {
                tab: {
                    type: ControlType.String,
                    title: "Tab",
                    defaultValue: "Overview",
                },

                eyebrow: {
                    type: ControlType.String,
                    title: "Eyebrow",
                    defaultValue: "Overview",
                },

                title: {
                    type: ControlType.String,
                    title: "Title",

                    defaultValue: "Designed for what’s next.",

                    displayTextArea: true,
                },

                description: {
                    type: ControlType.String,
                    title: "Text",

                    defaultValue:
                        "A flexible tab component to present your content with impact.",

                    displayTextArea: true,
                },

                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },

                primaryLabel: {
                    type: ControlType.String,
                    title: "Primary CTA",

                    defaultValue: "Get Started",
                },

                primaryLink: {
                    type: ControlType.Link,
                    title: "Primary Link",

                    defaultValue: "#",
                },

                primaryNewTab: {
                    type: ControlType.Boolean,
                    title: "Primary Open",

                    defaultValue: false,

                    enabledTitle: "New Tab",

                    disabledTitle: "Same Tab",
                },

                secondaryLabel: {
                    type: ControlType.String,
                    title: "Second CTA",

                    defaultValue: "Learn More",
                },

                secondaryLink: {
                    type: ControlType.Link,
                    title: "Second Link",

                    defaultValue: "#",
                },

                secondaryNewTab: {
                    type: ControlType.Boolean,
                    title: "Second Open",

                    defaultValue: false,

                    enabledTitle: "New Tab",

                    disabledTitle: "Same Tab",
                },
            },
        },

        defaultValue: DEFAULT_ITEMS,
    },

    cardLink: {
        type: ControlType.Link,
        title: "Card Link",
        defaultValue: "",
    },

    cardNewTab: {
        type: ControlType.Boolean,
        title: "Open Card",

        defaultValue: false,

        enabledTitle: "New Tab",
        disabledTitle: "Same Tab",
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",

        defaultValue: "#F7F5F1",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",

        defaultValue: "#171717",
    },

    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted",

        defaultValue: "rgba(23,23,23,0.60)",
    },

    tabColor: {
        type: ControlType.Color,
        title: "Tab",

        defaultValue: "rgba(23,23,23,0.48)",
    },

    activeTabColor: {
        type: ControlType.Color,
        title: "Active Tab",

        defaultValue: "#171717",
    },

    primaryBackground: {
        type: ControlType.Color,
        title: "Button BG",

        defaultValue: "#171717",
    },

    primaryTextColor: {
        type: ControlType.Color,
        title: "Button Text",

        defaultValue: "#FFFFFF",
    },

    secondaryColor: {
        type: ControlType.Color,
        title: "Second CTA",

        defaultValue: "#171717",
    },

    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow BG",

        defaultValue: "#171717",
    },

    arrowColor: {
        type: ControlType.Color,
        title: "Arrow",

        defaultValue: "#FFFFFF",
    },

    imageOverlayColor: {
        type: ControlType.Color,
        title: "Overlay",

        defaultValue: "#000000",
    },

    imageOverlayOpacity: {
        type: ControlType.Number,
        title: "Overlay",

        defaultValue: 0.02,

        min: 0,
        max: 0.8,
        step: 0.01,
    },

    grainOpacity: {
        type: ControlType.Number,
        title: "Grain",

        defaultValue: 0.06,

        min: 0,
        max: 0.3,
        step: 0.01,
    },

    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",

        defaultValue: 22,

        min: 0,
        max: 60,
        step: 1,

        unit: "px",
    },

    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",

        defaultValue: 20,

        min: 0,
        max: 60,
        step: 1,

        unit: "px",
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",

        defaultValue: 48,

        min: 34,
        max: 60,
        step: 1,

        unit: "%",
    },

    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",

        defaultValue: 68,

        min: 50,
        max: 82,
        step: 1,

        unit: "%",
    },

    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",

        defaultValue: 82,

        min: 55,
        max: 92,
        step: 1,

        unit: "%",
    },

    animationSpeed: {
        type: ControlType.Number,
        title: "Animation",

        defaultValue: 0.55,

        min: 0.1,
        max: 1.5,
        step: 0.05,

        unit: "s",
    },

    imageZoom: {
        type: ControlType.Number,
        title: "Image Zoom",

        defaultValue: 1.035,

        min: 1,
        max: 1.15,
        step: 0.005,
    },

    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "9px",

            variant: "Medium",

            letterSpacing: "0.12em",

            lineHeight: "1em",
        },
    },

    tabFont: {
        type: ControlType.Font,
        title: "Tab Font",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "11px",

            variant: "Medium",

            letterSpacing: "-0.01em",

            lineHeight: "1em",
        },
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",

        controls: "extended",

        defaultFontType: "serif",

        defaultValue: {
            fontSize: "48px",

            variant: "Regular",

            letterSpacing: "-0.045em",

            lineHeight: "0.97em",
        },
    },

    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "13px",

            variant: "Regular",

            letterSpacing: "-0.01em",

            lineHeight: "1.5em",
        },
    },

    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "11px",

            variant: "Medium",

            letterSpacing: "-0.01em",

            lineHeight: "1em",
        },
    },

    counterFont: {
        type: ControlType.Font,
        title: "Counter Font",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "9px",

            variant: "Medium",

            letterSpacing: "0.08em",

            lineHeight: "1em",
        },
    },
})
