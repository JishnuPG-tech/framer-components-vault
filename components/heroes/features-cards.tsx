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

type FeatureItem = {
    tab: string
    eyebrow: string
    title: string
    description: string

    featureOne: string
    featureTwo: string
    featureThree: string

    image?: ResponsiveImage

    visualLink: string
    visualNewTab: boolean

    primaryLabel: string
    primaryLink: string
    primaryNewTab: boolean

    secondaryLabel: string
    secondaryLink: string
    secondaryNewTab: boolean
}

type Props = {
    items: FeatureItem[]

    sectionLabel: string

    contentBackground: string
    imageBackground: string

    accentColor: string
    accentSoft: string

    textColor: string
    mutedTextColor: string

    tabColor: string

    primaryTextColor: string
    secondaryColor: string

    imageArrowBackground: string
    imageArrowColor: string

    visualLabelBackground: string
    visualLabelColor: string

    borderColor: string

    overlayColor: string
    overlayOpacity: number
    grainOpacity: number

    contentRadius: number
    imageRadius: number

    gap: number
    imageWidth: number

    animationSpeed: number
    imageZoom: number

    sectionFont: React.CSSProperties
    eyebrowFont: React.CSSProperties
    tabFont: React.CSSProperties
    titleFont: React.CSSProperties
    bodyFont: React.CSSProperties
    featureFont: React.CSSProperties
    buttonFont: React.CSSProperties
    visualLabelFont: React.CSSProperties

    style?: React.CSSProperties
}

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1800&q=90"

const DEFAULT_ITEMS: FeatureItem[] = [
    {
        tab: "Motion",
        eyebrow: "01 / Movement",

        title: "Made to move.",

        description:
            "Lightweight layers, easy shapes and unrestricted fits designed to keep up wherever the day takes you.",

        featureOne: "Lightweight construction",
        featureTwo: "Unrestricted everyday fit",
        featureThree: "Built for active movement",

        image: {
            src: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1800&q=90",
            alt: "Dynamic lifestyle movement",
        },

        visualLink: "#",
        visualNewTab: true,

        primaryLabel: "Explore Motion",
        primaryLink: "#",
        primaryNewTab: true,

        secondaryLabel: "View Collection",
        secondaryLink: "#",
        secondaryNewTab: true,
    },

    {
        tab: "Comfort",
        eyebrow: "02 / Everyday",

        title: "Easy from morning to late.",

        description:
            "Designed around comfort without losing its edge. Soft where it matters, structured where it counts.",

        featureOne: "Soft-touch materials",
        featureTwo: "Comfort-first silhouettes",
        featureThree: "Easy to layer all day",

        image: {
            src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=90",
            alt: "Lifestyle fashion portrait",
        },

        visualLink: "#",
        visualNewTab: true,

        primaryLabel: "Feel the Difference",
        primaryLink: "#",
        primaryNewTab: true,

        secondaryLabel: "Discover More",
        secondaryLink: "#",
        secondaryNewTab: true,
    },

    {
        tab: "Utility",
        eyebrow: "03 / Performance",

        title: "Details that keep up.",

        description:
            "Functional details are integrated without turning the design technical. Useful, simple and ready for everyday wear.",

        featureOne: "Weather-ready fabrics",
        featureTwo: "Secure functional details",
        featureThree: "Adjustable where it matters",

        image: {
            src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=90",
            alt: "Outdoor performance lifestyle",
        },

        visualLink: "#",
        visualNewTab: true,

        primaryLabel: "Explore Utility",
        primaryLink: "#",
        primaryNewTab: true,

        secondaryLabel: "See the Details",
        secondaryLink: "#",
        secondaryNewTab: true,
    },

    {
        tab: "Identity",
        eyebrow: "04 / Expression",

        title: "Color that gets noticed.",

        description:
            "Strong color, clean silhouettes and just enough attitude to make every piece feel instantly recognizable.",

        featureOne: "High-impact color",
        featureTwo: "Clean visual language",
        featureThree: "Designed to stand out",

        image: {
            src: "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1800&q=90",
            alt: "Colorful urban lifestyle fashion",
        },

        visualLink: "#",
        visualNewTab: true,

        primaryLabel: "Discover the Look",
        primaryLink: "#",
        primaryNewTab: true,

        secondaryLabel: "Shop Collection",
        secondaryLink: "#",
        secondaryNewTab: true,
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

function ArrowIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
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

function ExternalArrowIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M5 11L11 5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
            />
            <path
                d="M6.6 5H11V9.4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function FeatureMark({ color }: { color: string }) {
    return (
        <span
            style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: color,
                flexShrink: 0,
            }}
        />
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 690
 */
export default function LifestyleFeatures(props: Props) {
    const {
        items = DEFAULT_ITEMS,

        sectionLabel = "Built for real life",

        contentBackground = "#0049CF",
        imageBackground = "#FFFFFF",

        accentColor = "#BCC500",
        accentSoft = "rgba(188,197,0,0.35)",

        textColor = "#FFFFFF",
        mutedTextColor = "#FFFFFF",

        tabColor = "#000000",

        primaryTextColor = "#FFFFFF",
        secondaryColor = "#FFFFFF",

        imageArrowBackground = "#FFFFFF",
        imageArrowColor = "#000000",

        visualLabelBackground = "#FFFFFF",
        visualLabelColor = "#000000",

        borderColor = "rgba(0,0,0,0.08)",

        overlayColor = "#FFFFFF",
        overlayOpacity = 0.015,
        grainOpacity = 0.035,

        contentRadius = 22,
        imageRadius = 22,

        gap = 16,
        imageWidth = 58,

        animationSpeed = 0.55,
        imageZoom = 1.035,

        sectionFont,
        eyebrowFont,
        tabFont,
        titleFont,
        bodyFont,
        featureFont,
        buttonFont,
        visualLabelFont,

        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)

    const styleWidth = getFrameNumber(style?.width)

    const styleHeight = getFrameNumber(style?.height)

    const [frameSize, setFrameSize] = React.useState({
        width: styleWidth ?? 1120,
        height: styleHeight ?? 690,
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

    const isMobile = frameWidth < 620

    const isTablet = frameWidth >= 620 && frameWidth < 900

    const isDesktop = frameWidth >= 900

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

    const features = [
        activeItem.featureOne,
        activeItem.featureTwo,
        activeItem.featureThree,
    ].filter(Boolean)

    const tabs = (
        <div
            style={{
                display: "flex",

                alignItems: "center",

                gap: isMobile ? 6 : 8,

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

                            minHeight: 38,

                            padding: isMobile ? "0 13px" : "0 16px",

                            margin: 0,

                            flexShrink: 0,

                            borderRadius: 999,

                            backgroundColor: active
                                ? accentColor
                                : "transparent",

                            color: active ? "#FFFFFF" : tabColor,

                            cursor: isStatic ? "default" : "pointer",

                            transition: isStatic
                                ? "none"
                                : `background-color ${
                                      animationSpeed * 0.4
                                  }s ease, color ${animationSpeed * 0.4}s ease`,

                            ...tabFont,
                        }}
                    >
                        {item.tab}
                    </button>
                )
            })}
        </div>
    )

    const header = (
        <div
            style={{
                width: "100%",

                minHeight: isMobile ? 44 : 52,

                boxSizing: "border-box",

                display: "flex",

                alignItems: "center",

                justifyContent: "space-between",

                gap: 24,

                flexShrink: 0,

                overflow: "hidden",
            }}
        >
            {!isMobile && (
                <div
                    style={{
                        color: "#000000",

                        whiteSpace: "nowrap",

                        textTransform: "uppercase",

                        flexShrink: 0,

                        ...sectionFont,
                    }}
                >
                    {sectionLabel}
                </div>
            )}

            <div
                style={{
                    marginLeft: isMobile ? 0 : "auto",

                    minWidth: 0,

                    maxWidth: "100%",

                    overflow: "hidden",
                }}
            >
                {tabs}
            </div>
        </div>
    )

    const contentPanel = (
        <div
            style={{
                width: "100%",
                height: "100%",

                maxWidth: "100%",

                minWidth: 0,
                minHeight: 0,

                padding: isMobile ? 24 : isTablet ? 30 : 38,

                boxSizing: "border-box",

                borderRadius: contentRadius,

                backgroundColor: contentBackground,

                border: `1px solid ${borderColor}`,

                overflow: "hidden",
            }}
        >
            {isStatic ? (
                <FeatureContent
                    item={activeItem}
                    features={features}
                    accentColor={accentColor}
                    textColor={textColor}
                    mutedTextColor={mutedTextColor}
                    primaryTextColor={primaryTextColor}
                    secondaryColor={secondaryColor}
                    eyebrowFont={eyebrowFont}
                    titleFont={titleFont}
                    bodyFont={bodyFont}
                    featureFont={featureFont}
                    buttonFont={buttonFont}
                    isMobile={isMobile}
                    isStatic={isStatic}
                    openLink={openLink}
                />
            ) : (
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{
                            opacity: 0,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: -8,
                        }}
                        transition={{
                            duration: animationSpeed * 0.65,

                            ease: [0.4, 0, 0.2, 1],
                        }}
                        style={{
                            width: "100%",

                            height: "100%",

                            minWidth: 0,

                            maxWidth: "100%",
                        }}
                    >
                        <FeatureContent
                            item={activeItem}
                            features={features}
                            accentColor={accentColor}
                            textColor={textColor}
                            mutedTextColor={mutedTextColor}
                            primaryTextColor={primaryTextColor}
                            secondaryColor={secondaryColor}
                            eyebrowFont={eyebrowFont}
                            titleFont={titleFont}
                            bodyFont={bodyFont}
                            featureFont={featureFont}
                            buttonFont={buttonFont}
                            isMobile={isMobile}
                            isStatic={isStatic}
                            openLink={openLink}
                        />
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )

    const visualPanel = (
        <div
            style={{
                width: "100%",
                height: "100%",

                maxWidth: "100%",

                minWidth: 0,
                minHeight: 0,

                padding: isMobile ? 8 : 10,

                boxSizing: "border-box",

                borderRadius: imageRadius + 8,

                backgroundColor: accentSoft,

                overflow: "hidden",
            }}
        >
            <button
                type="button"
                aria-label={`Open ${activeItem.tab}`}
                onClick={
                    isStatic
                        ? undefined
                        : () =>
                              openLink(
                                  activeItem.visualLink,
                                  activeItem.visualNewTab
                              )
                }
                style={{
                    appearance: "none",

                    width: "100%",
                    height: "100%",

                    maxWidth: "100%",

                    minWidth: 0,
                    minHeight: 0,

                    padding: 0,
                    margin: 0,

                    position: "relative",

                    overflow: "hidden",

                    border: "none",
                    outline: "none",

                    borderRadius: imageRadius,

                    backgroundColor: imageBackground,

                    cursor:
                        isStatic || !activeItem.visualLink
                            ? "default"
                            : "pointer",

                    textAlign: "left",

                    boxSizing: "border-box",
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

                {overlayOpacity > 0 && (
                    <div
                        style={{
                            position: "absolute",

                            inset: 0,

                            backgroundColor: overlayColor,

                            opacity: overlayOpacity,

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

                <div
                    style={{
                        position: "absolute",

                        left: isMobile ? 18 : 22,

                        top: isMobile ? 18 : 22,

                        zIndex: 4,

                        padding: "8px 11px",

                        borderRadius: 999,

                        backgroundColor: visualLabelBackground,

                        color: visualLabelColor,

                        boxShadow: "0 3px 12px rgba(0,0,0,0.08)",

                        ...visualLabelFont,
                    }}
                >
                    {activeItem.eyebrow}
                </div>

                {activeItem.visualLink && (
                    <div
                        style={{
                            position: "absolute",

                            right: isMobile ? 18 : 22,

                            bottom: isMobile ? 18 : 22,

                            width: 42,

                            height: 42,

                            borderRadius: 999,

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            backgroundColor: imageArrowBackground,

                            color: imageArrowColor,

                            boxShadow: "0 8px 26px rgba(0,0,0,0.10)",

                            zIndex: 4,
                        }}
                    >
                        <ExternalArrowIcon size={14} />
                    </div>
                )}
            </button>
        </div>
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,

                width: style?.width ?? 1120,

                height: style?.height ?? 690,

                minWidth: 1,
                minHeight: 1,

                maxWidth: "100%",

                boxSizing: "border-box",

                display: "flex",

                flexDirection: "column",

                gap,

                background: "transparent",

                padding: 0,
                margin: 0,

                overflow: "hidden",
            }}
        >
            {header}

            {isDesktop && (
                <div
                    style={{
                        flex: 1,

                        minHeight: 0,
                        minWidth: 0,

                        width: "100%",

                        maxWidth: "100%",

                        display: "grid",

                        gridTemplateColumns: `${
                            100 - clamp(imageWidth, 50, 66)
                        }fr ${clamp(imageWidth, 50, 66)}fr`,

                        gap,

                        boxSizing: "border-box",

                        overflow: "hidden",
                    }}
                >
                    {contentPanel}

                    {visualPanel}
                </div>
            )}

            {isTablet && (
                <div
                    style={{
                        flex: 1,

                        minHeight: 0,
                        minWidth: 0,

                        width: "100%",

                        maxWidth: "100%",

                        display: "grid",

                        gridTemplateColumns: "44fr 56fr",

                        gap,

                        boxSizing: "border-box",

                        overflow: "hidden",
                    }}
                >
                    {contentPanel}

                    {visualPanel}
                </div>
            )}

            {isMobile && (
                <div
                    style={{
                        flex: 1,

                        minHeight: 0,
                        minWidth: 0,

                        width: "100%",

                        maxWidth: "100%",

                        display: "grid",

                        gridTemplateRows: "minmax(230px, 40%) minmax(0, 1fr)",

                        gap,

                        boxSizing: "border-box",

                        overflow: "hidden",
                    }}
                >
                    {visualPanel}

                    {contentPanel}
                </div>
            )}
        </div>
    )
}

function FeatureContent({
    item,
    features,

    accentColor,

    textColor,
    mutedTextColor,

    primaryTextColor,
    secondaryColor,

    eyebrowFont,
    titleFont,
    bodyFont,
    featureFont,
    buttonFont,

    isMobile,
    isStatic,

    openLink,
}: {
    item: FeatureItem
    features: string[]

    accentColor: string

    textColor: string
    mutedTextColor: string

    primaryTextColor: string
    secondaryColor: string

    eyebrowFont: React.CSSProperties
    titleFont: React.CSSProperties
    bodyFont: React.CSSProperties
    featureFont: React.CSSProperties
    buttonFont: React.CSSProperties

    isMobile: boolean
    isStatic: boolean

    openLink: (url: string, newTab: boolean) => void
}) {
    return (
        <div
            style={{
                width: "100%",

                height: "100%",

                minWidth: 0,
                minHeight: 0,

                maxWidth: "100%",

                display: "flex",

                flexDirection: "column",

                boxSizing: "border-box",

                overflow: "hidden",
            }}
        >
            <div>
                <div
                    style={{
                        marginBottom: isMobile ? 18 : 22,

                        display: "flex",

                        alignItems: "center",

                        gap: 9,

                        color: accentColor,

                        textTransform: "uppercase",

                        ...eyebrowFont,
                    }}
                >
                    <span
                        style={{
                            width: 24,

                            height: 2,

                            borderRadius: 999,

                            backgroundColor: accentColor,
                        }}
                    />

                    {item.eyebrow}
                </div>

                <h2
                    style={{
                        margin: 0,

                        maxWidth: 430,

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
                    {item.title}
                </h2>

                <p
                    style={{
                        margin: isMobile ? "18px 0 0" : "22px 0 0",

                        maxWidth: 400,

                        color: mutedTextColor,

                        ...bodyFont,
                    }}
                >
                    {item.description}
                </p>
            </div>

            <div
                style={{
                    marginTop: isMobile ? 26 : 34,

                    display: "flex",

                    flexDirection: "column",

                    gap: isMobile ? 14 : 17,
                }}
            >
                {features.map((feature, index) => (
                    <div
                        key={`${feature}-${index}`}
                        style={{
                            display: "flex",

                            alignItems: "center",

                            gap: 12,

                            color: textColor,

                            ...featureFont,
                        }}
                    >
                        <FeatureMark color={accentColor} />

                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <div
                style={{
                    marginTop: isMobile ? 34 : 46,

                    display: "flex",

                    alignItems: "center",

                    flexWrap: "wrap",

                    gap: isMobile ? 18 : 24,
                }}
            >
                {item.primaryLabel && (
                    <button
                        type="button"
                        onClick={
                            isStatic
                                ? undefined
                                : () =>
                                      openLink(
                                          item.primaryLink,
                                          item.primaryNewTab
                                      )
                        }
                        style={{
                            appearance: "none",

                            minHeight: 48,

                            padding: "0 19px 0 21px",

                            display: "inline-flex",

                            alignItems: "center",

                            gap: 24,

                            border: "none",

                            outline: "none",

                            borderRadius: 999,

                            backgroundColor: accentColor,

                            color: primaryTextColor,

                            cursor: isStatic ? "default" : "pointer",

                            whiteSpace: "nowrap",

                            ...buttonFont,
                        }}
                    >
                        <span>{item.primaryLabel}</span>

                        <ArrowIcon size={13} />
                    </button>
                )}

                {item.secondaryLabel && (
                    <button
                        type="button"
                        onClick={
                            isStatic
                                ? undefined
                                : () =>
                                      openLink(
                                          item.secondaryLink,
                                          item.secondaryNewTab
                                      )
                        }
                        style={{
                            appearance: "none",

                            padding: "6px 0",

                            background: "transparent",

                            border: "none",

                            borderBottom: `1px solid ${secondaryColor}`,

                            outline: "none",

                            color: secondaryColor,

                            cursor: isStatic ? "default" : "pointer",

                            whiteSpace: "nowrap",

                            ...buttonFont,
                        }}
                    >
                        {item.secondaryLabel}
                    </button>
                )}
            </div>
        </div>
    )
}

addPropertyControls(LifestyleFeatures, {
    items: {
        type: ControlType.Array,

        title: "Features",

        control: {
            type: ControlType.Object,

            controls: {
                tab: {
                    type: ControlType.String,
                    title: "Tab",
                    defaultValue: "Motion",
                },

                eyebrow: {
                    type: ControlType.String,
                    title: "Eyebrow",
                    defaultValue: "01 / Movement",
                },

                title: {
                    type: ControlType.String,
                    title: "Title",

                    defaultValue: "Made to move.",

                    displayTextArea: true,
                },

                description: {
                    type: ControlType.String,
                    title: "Text",

                    defaultValue:
                        "Lightweight layers, easy shapes and unrestricted fits designed to keep up wherever the day takes you.",

                    displayTextArea: true,
                },

                featureOne: {
                    type: ControlType.String,
                    title: "Feature 1",

                    defaultValue: "Lightweight construction",
                },

                featureTwo: {
                    type: ControlType.String,
                    title: "Feature 2",

                    defaultValue: "Unrestricted everyday fit",
                },

                featureThree: {
                    type: ControlType.String,
                    title: "Feature 3",

                    defaultValue: "Built for active movement",
                },

                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },

                visualLink: {
                    type: ControlType.Link,
                    title: "Image Link",

                    defaultValue: "#",
                },

                visualNewTab: {
                    type: ControlType.Boolean,
                    title: "Image Open",

                    defaultValue: true,

                    enabledTitle: "New Tab",

                    disabledTitle: "Same Tab",
                },

                primaryLabel: {
                    type: ControlType.String,
                    title: "Primary CTA",

                    defaultValue: "Explore Feature",
                },

                primaryLink: {
                    type: ControlType.Link,
                    title: "Primary Link",

                    defaultValue: "#",
                },

                primaryNewTab: {
                    type: ControlType.Boolean,
                    title: "Primary Open",

                    defaultValue: true,

                    enabledTitle: "New Tab",

                    disabledTitle: "Same Tab",
                },

                secondaryLabel: {
                    type: ControlType.String,
                    title: "Second CTA",

                    defaultValue: "View Collection",
                },

                secondaryLink: {
                    type: ControlType.Link,
                    title: "Second Link",

                    defaultValue: "#",
                },

                secondaryNewTab: {
                    type: ControlType.Boolean,
                    title: "Second Open",

                    defaultValue: true,

                    enabledTitle: "New Tab",

                    disabledTitle: "Same Tab",
                },
            },
        },

        defaultValue: DEFAULT_ITEMS,
    },

    sectionLabel: {
        type: ControlType.String,
        title: "Section Label",

        defaultValue: "Built for real life",
    },

    accentColor: {
        type: ControlType.Color,
        title: "Accent",

        defaultValue: "#BCC500",
    },

    accentSoft: {
        type: ControlType.Color,
        title: "Accent Soft",

        defaultValue: "rgba(188,197,0,0.35)",
    },

    contentBackground: {
        type: ControlType.Color,
        title: "Content BG",

        defaultValue: "#0049CF",
    },

    imageBackground: {
        type: ControlType.Color,
        title: "Image BG",

        defaultValue: "#FFFFFF",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",

        defaultValue: "#FFFFFF",
    },

    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted",

        defaultValue: "#FFFFFF",
    },

    tabColor: {
        type: ControlType.Color,
        title: "Tabs",

        defaultValue: "#000000",
    },

    primaryTextColor: {
        type: ControlType.Color,
        title: "Button Text",

        defaultValue: "#FFFFFF",
    },

    secondaryColor: {
        type: ControlType.Color,
        title: "Second CTA",

        defaultValue: "#FFFFFF",
    },

    imageArrowBackground: {
        type: ControlType.Color,
        title: "Image Arrow BG",

        defaultValue: "#FFFFFF",
    },

    imageArrowColor: {
        type: ControlType.Color,
        title: "Image Arrow",

        defaultValue: "#000000",
    },

    visualLabelBackground: {
        type: ControlType.Color,
        title: "Image Label BG",

        defaultValue: "#FFFFFF",
    },

    visualLabelColor: {
        type: ControlType.Color,
        title: "Image Label Text",

        defaultValue: "#000000",
    },

    borderColor: {
        type: ControlType.Color,
        title: "Border",

        defaultValue: "rgba(0,0,0,0.08)",
    },

    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",

        defaultValue: "#FFFFFF",
    },

    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay",

        defaultValue: 0.015,

        min: 0,
        max: 0.8,

        step: 0.01,
    },

    grainOpacity: {
        type: ControlType.Number,
        title: "Grain",

        defaultValue: 0.035,

        min: 0,
        max: 0.3,

        step: 0.005,
    },

    contentRadius: {
        type: ControlType.Number,
        title: "Content Radius",

        defaultValue: 22,

        min: 0,
        max: 60,

        step: 1,

        unit: "px",
    },

    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",

        defaultValue: 22,

        min: 0,
        max: 60,

        step: 1,

        unit: "px",
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",

        defaultValue: 16,

        min: 0,
        max: 40,

        step: 1,

        unit: "px",
    },

    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",

        defaultValue: 58,

        min: 50,
        max: 66,

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

    sectionFont: {
        type: ControlType.Font,
        title: "Section Font",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "9px",

            variant: "Medium",

            letterSpacing: "0.1em",

            lineHeight: "1em",
        },
    },

    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "9px",

            variant: "Medium",

            letterSpacing: "0.1em",

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
            fontSize: "50px",

            variant: "Regular",

            letterSpacing: "-0.045em",

            lineHeight: "0.96em",
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

            lineHeight: "1.55em",
        },
    },

    featureFont: {
        type: ControlType.Font,
        title: "Feature Font",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "11px",

            variant: "Medium",

            letterSpacing: "-0.01em",

            lineHeight: "1.3em",
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

    visualLabelFont: {
        type: ControlType.Font,
        title: "Image Label",

        controls: "extended",

        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "10px",

            variant: "Medium",

            letterSpacing: "-0.01em",

            lineHeight: "1em",
        },
    },
})
