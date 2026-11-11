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

type LocationItem = {
    name: string
    region: string
    image?: ResponsiveImage

    headline: string
    description: string

    address: string
    openingHours: string
    phone: string

    primaryLabel: string
    primaryLink: string
    primaryNewTab: boolean

    secondaryLabel: string
    secondaryLink: string
    secondaryNewTab: boolean
}

type Props = {
    locations: LocationItem[]

    eyebrow: string

    showNumbers: boolean
    showRegion: boolean
    showSecondaryButton: boolean

    backgroundColor: string
    navBackground: string
    infoBackground: string

    navTextColor: string
    navInactiveColor: string

    textColor: string
    mutedTextColor: string
    dividerColor: string

    buttonBackground: string
    buttonTextColor: string

    imageOverlayColor: string
    imageOverlayOpacity: number

    grainOpacity: number

    borderRadius: number

    navWidth: number
    infoWidth: number

    animationSpeed: number
    imageZoom: number

    eyebrowFont: React.CSSProperties
    locationFont: React.CSSProperties
    headlineFont: React.CSSProperties
    bodyFont: React.CSSProperties
    detailFont: React.CSSProperties
    buttonFont: React.CSSProperties

    style?: React.CSSProperties
}

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=90"

const DEFAULT_LOCATIONS: LocationItem[] = [
    {
        name: "New York",
        region: "USA",

        image: {
            src: "https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=1800&q=90",
            alt: "Warm contemporary restaurant interior in New York",
        },

        headline: "A place to feel at home.",

        description:
            "Good coffee, thoughtful spaces and a place made for slowing down.",

        address: "123 Mulberry Street\nNew York, NY 10013",

        openingHours: "Mon – Sun\n8:00 – 18:00",

        phone: "+1 212 555 0187",

        primaryLabel: "Book a Table",
        primaryLink: "#",
        primaryNewTab: true,

        secondaryLabel: "View Menu",
        secondaryLink: "#",
        secondaryNewTab: true,
    },

    {
        name: "Paris",
        region: "France",

        image: {
            src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1800&q=90",
            alt: "Atmospheric restaurant interior in Paris",
        },

        headline: "Made for good moments.",

        description:
            "A relaxed neighborhood space for food, drinks and everything in between.",

        address: "24 Rue Vieille du Temple\n75004 Paris",

        openingHours: "Mon – Sun\n9:00 – 23:00",

        phone: "+33 1 42 72 28 41",

        primaryLabel: "Book a Table",
        primaryLink: "#",
        primaryNewTab: true,

        secondaryLabel: "View Menu",
        secondaryLink: "#",
        secondaryNewTab: true,
    },

    {
        name: "Copenhagen",
        region: "Denmark",

        image: {
            src: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1800&q=90",
            alt: "Minimal café interior in Copenhagen",
        },

        headline: "Simple things, done well.",

        description:
            "A calm space shaped around quality, community and everyday rituals.",

        address: "18 Vesterbrogade\n1620 Copenhagen",

        openingHours: "Mon – Sun\n8:00 – 19:00",

        phone: "+45 33 14 18 18",

        primaryLabel: "Book a Table",
        primaryLink: "#",
        primaryNewTab: true,

        secondaryLabel: "View Menu",
        secondaryLink: "#",
        secondaryNewTab: true,
    },

    {
        name: "Berlin",
        region: "Germany",

        image: {
            src: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=90",
            alt: "Warm modern restaurant interior in Berlin",
        },

        headline: "Come by and stay awhile.",

        description:
            "A welcoming space in the middle of the city, open throughout the week.",

        address: "Torstraße 123\n10119 Berlin",

        openingHours: "Mon – Sun\n8:00 – 20:00",

        phone: "+49 30 123 456 789",

        primaryLabel: "Book a Table",
        primaryLink: "#",
        primaryNewTab: true,

        secondaryLabel: "View Menu",
        secondaryLink: "#",
        secondaryNewTab: true,
    },
]

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

function formatNumber(index: number) {
    return String(index + 1).padStart(2, "0")
}

function getPhoneHref(phone: string) {
    if (!phone) return undefined

    const cleaned = phone.replace(/[^\d+]/g, "")

    return `tel:${cleaned}`
}

function ArrowIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            style={{
                display: "block",
                flexShrink: 0,
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

function PinIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M8 14C8 14 12 10.1 12 6.7C12 4.5 10.2 2.75 8 2.75C5.8 2.75 4 4.5 4 6.7C4 10.1 8 14 8 14Z"
                stroke="currentColor"
                strokeWidth="1.2"
            />

            <circle
                cx="8"
                cy="6.7"
                r="1.25"
                stroke="currentColor"
                strokeWidth="1.2"
            />
        </svg>
    )
}

function ClockIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <circle
                cx="8"
                cy="8"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.2"
            />

            <path
                d="M8 4.7V8L10.4 9.3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
        </svg>
    )
}

function PhoneIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M3.6 2.8L5.7 5.5L4.7 6.8C5.45 8.55 7 10.1 8.75 10.85L10.05 9.85L12.8 11.9C13.05 12.1 13.15 12.45 13 12.75C12.45 13.75 11.3 14.2 10.15 13.95C5.9 13.05 2.9 10.05 2.05 5.85C1.8 4.7 2.25 3.55 3.25 3C3.4 2.9 3.5 2.85 3.6 2.8Z"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='.55'/%3E%3C/svg%3E")`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 */
export default function Locations(props: Props) {
    const {
        locations = DEFAULT_LOCATIONS,

        eyebrow = "Our Locations",

        showNumbers = true,
        showRegion = true,
        showSecondaryButton = true,

        backgroundColor = "#EEEAE4",
        navBackground = "#EEEAE4",
        infoBackground = "#171715",

        navTextColor = "#111111",
        navInactiveColor = "rgba(17,17,17,0.38)",

        textColor = "#FFFFFF",
        mutedTextColor = "rgba(255,255,255,0.62)",

        dividerColor = "rgba(17,17,17,0.14)",

        buttonBackground = "#FFFFFF",
        buttonTextColor = "#111111",

        imageOverlayColor = "#000000",
        imageOverlayOpacity = 0.06,

        grainOpacity = 0.1,

        borderRadius = 0,

        navWidth = 27,
        infoWidth = 29,

        animationSpeed = 0.55,
        imageZoom = 1.035,

        eyebrowFont,
        locationFont,
        headlineFont,
        bodyFont,
        detailFont,
        buttonFont,

        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)

    const styleWidth = getFrameNumber(style?.width)
    const styleHeight = getFrameNumber(style?.height)

    const [frameSize, setFrameSize] = React.useState({
        width: styleWidth ?? 1200,
        height: styleHeight ?? 760,
    })

    const safeLocations =
        locations && locations.length ? locations : DEFAULT_LOCATIONS

    const [activeIndex, setActiveIndex] = React.useState(0)

    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    useIsomorphicLayoutEffect(() => {
        const element = containerRef.current

        if (!element) return

        const updateInitialSize = () => {
            const width = element.clientWidth
            const height = element.clientHeight

            if (width > 0 && height > 0) {
                setFrameSize({
                    width,
                    height,
                })
            }
        }

        updateInitialSize()

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

    React.useEffect(() => {
        setActiveIndex((current) => clamp(current, 0, safeLocations.length - 1))
    }, [safeLocations.length])

    const frameWidth = styleWidth ?? frameSize.width
    const frameHeight = styleHeight ?? frameSize.height

    const isMobile = frameWidth < 640
    const isTablet = frameWidth >= 640 && frameWidth < 900
    const isDesktop = frameWidth >= 900

    const activeLocation =
        safeLocations[clamp(activeIndex, 0, safeLocations.length - 1)]

    const imageSrc = activeLocation.image?.src || FALLBACK_IMAGE

    const imageAlt = activeLocation.image?.alt || activeLocation.name

    const safeNavWidth = clamp(navWidth, 20, 38)

    const safeInfoWidth = clamp(infoWidth, 22, 40)

    const imageWidth = Math.max(22, 100 - safeNavWidth - safeInfoWidth)

    const navPadding = isMobile
        ? 20
        : isTablet
          ? 26
          : clamp(frameWidth * 0.032, 30, 48)

    const infoPadding = isMobile
        ? 22
        : isTablet
          ? 26
          : clamp(frameWidth * 0.033, 32, 50)

    const responsiveLocationFont: React.CSSProperties = {
        ...locationFont,

        ...(isMobile
            ? {
                  fontSize: "17px",

                  lineHeight: "1.1em",
              }
            : {}),
    }

    const responsiveHeadlineFont: React.CSSProperties = {
        ...headlineFont,

        ...(isMobile
            ? {
                  fontSize: clamp(frameWidth * 0.072, 24, 30),

                  lineHeight: "1.02em",

                  letterSpacing: "-0.04em",
              }
            : isTablet
              ? {
                    fontSize: "32px",
                }
              : {}),
    }

    const responsiveBodyFont: React.CSSProperties = {
        ...bodyFont,

        ...(isMobile
            ? {
                  fontSize: "13px",

                  lineHeight: "1.45em",
              }
            : {}),
    }

    const responsiveDetailFont: React.CSSProperties = {
        ...detailFont,

        ...(isMobile
            ? {
                  fontSize: "12px",

                  lineHeight: "1.4em",
              }
            : {}),
    }

    const goTo = React.useCallback(
        (index: number) => {
            setActiveIndex(clamp(index, 0, safeLocations.length - 1))
        },
        [safeLocations.length]
    )

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent, index: number) => {
            if (event.key !== "Enter" && event.key !== " ") return

            event.preventDefault()

            goTo(index)
        },
        [goTo]
    )

    const navPanel = (
        <div
            style={{
                width: "100%",
                height: "100%",

                boxSizing: "border-box",

                display: "flex",
                flexDirection: "column",

                padding: navPadding,

                backgroundColor: navBackground,

                color: navTextColor,

                overflow: "hidden",
            }}
        >
            <div
                style={{
                    color: navInactiveColor,

                    textTransform: "uppercase",

                    marginBottom: isMobile ? 18 : 38,

                    ...eyebrowFont,
                }}
            >
                {eyebrow}
            </div>

            {isMobile ? (
                <div
                    style={{
                        display: "flex",

                        alignItems: "center",

                        gap: 24,

                        overflowX: "auto",

                        overflowY: "hidden",

                        paddingBottom: 3,

                        WebkitOverflowScrolling: "touch",

                        scrollbarWidth: "none",
                    }}
                >
                    {safeLocations.map((location, index) => {
                        const active = index === activeIndex

                        return (
                            <button
                                key={`${location.name}-${index}`}
                                type="button"
                                onClick={
                                    isStatic ? undefined : () => goTo(index)
                                }
                                onKeyDown={
                                    isStatic
                                        ? undefined
                                        : (event) => handleKeyDown(event, index)
                                }
                                style={{
                                    appearance: "none",

                                    border: "none",

                                    borderBottom: active
                                        ? `1px solid ${navTextColor}`
                                        : "1px solid transparent",

                                    background: "transparent",

                                    padding: "0 0 8px",

                                    margin: 0,

                                    color: active
                                        ? navTextColor
                                        : navInactiveColor,

                                    cursor: isStatic ? "default" : "pointer",

                                    whiteSpace: "nowrap",

                                    outline: "none",

                                    ...responsiveLocationFont,
                                }}
                            >
                                {location.name}
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div
                    style={{
                        width: "100%",

                        display: "flex",

                        flexDirection: "column",
                    }}
                >
                    {safeLocations.map((location, index) => {
                        const active = index === activeIndex

                        const hovered = index === hoveredIndex

                        return (
                            <button
                                key={`${location.name}-${index}`}
                                type="button"
                                aria-pressed={active}
                                aria-label={`Show ${location.name}`}
                                onClick={
                                    isStatic ? undefined : () => goTo(index)
                                }
                                onKeyDown={
                                    isStatic
                                        ? undefined
                                        : (event) => handleKeyDown(event, index)
                                }
                                onMouseEnter={
                                    isStatic
                                        ? undefined
                                        : () => setHoveredIndex(index)
                                }
                                onMouseLeave={
                                    isStatic
                                        ? undefined
                                        : () => setHoveredIndex(null)
                                }
                                style={{
                                    appearance: "none",

                                    width: "100%",

                                    border: "none",

                                    borderBottom: `1px solid ${dividerColor}`,

                                    background: "transparent",

                                    padding:
                                        index === 0 ? "0 0 20px" : "20px 0",

                                    display: "grid",

                                    gridTemplateColumns: showNumbers
                                        ? "34px 1fr 18px"
                                        : "1fr 18px",

                                    alignItems: "center",

                                    gap: 8,

                                    color: active
                                        ? navTextColor
                                        : hovered
                                          ? navTextColor
                                          : navInactiveColor,

                                    textAlign: "left",

                                    cursor: isStatic ? "default" : "pointer",

                                    outline: "none",

                                    transition: isStatic
                                        ? "none"
                                        : `color ${
                                              animationSpeed * 0.45
                                          }s ease`,
                                }}
                            >
                                {showNumbers && (
                                    <span
                                        style={{
                                            opacity: active ? 1 : 0.58,

                                            fontSize: 10,

                                            lineHeight: 1,

                                            fontFamily: "Inter, sans-serif",

                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {formatNumber(index)}
                                    </span>
                                )}

                                <div
                                    style={{
                                        display: "flex",

                                        flexDirection: "column",

                                        gap: 4,

                                        minWidth: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            ...responsiveLocationFont,
                                        }}
                                    >
                                        {location.name}
                                    </span>

                                    {showRegion && (
                                        <span
                                            style={{
                                                opacity: 0.62,

                                                fontSize: 10,

                                                lineHeight: "1.2em",

                                                letterSpacing: "0.02em",

                                                fontFamily: "Inter, sans-serif",
                                            }}
                                        >
                                            {location.region}
                                        </span>
                                    )}
                                </div>

                                <span
                                    style={{
                                        display: "flex",

                                        alignItems: "center",

                                        justifyContent: "flex-end",

                                        opacity: active || hovered ? 1 : 0,

                                        transform:
                                            active || hovered
                                                ? "translateX(0px)"
                                                : "translateX(-5px)",

                                        transition: isStatic
                                            ? "none"
                                            : `opacity ${
                                                  animationSpeed * 0.45
                                              }s ease, transform ${
                                                  animationSpeed * 0.45
                                              }s ease`,
                                    }}
                                >
                                    <ArrowIcon size={14} />
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )

    const imageContent = (
        <div
            style={{
                width: "100%",
                height: "100%",

                position: "relative",

                overflow: "hidden",

                backgroundColor: "#C8C4BC",
            }}
        >
            {isStatic ? (
                <img
                    src={imageSrc}
                    srcSet={activeLocation.image?.srcSet}
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

                        opacity: 1,

                        transform: "scale(1)",
                    }}
                />
            ) : (
                <AnimatePresence initial={false} mode="sync">
                    <motion.img
                        key={`${activeIndex}-${imageSrc}`}
                        src={imageSrc}
                        srcSet={activeLocation.image?.srcSet}
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

            <div
                style={{
                    position: "absolute",

                    inset: 0,

                    backgroundColor: imageOverlayColor,

                    opacity: imageOverlayOpacity,

                    pointerEvents: "none",
                }}
            />

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

                        zIndex: 2,
                    }}
                />
            )}

            {isMobile && (
                <div
                    style={{
                        position: "absolute",

                        left: 20,

                        bottom: 20,

                        color: "#FFFFFF",

                        zIndex: 3,
                    }}
                >
                    <div
                        style={{
                            marginBottom: 5,

                            fontSize: 10,

                            lineHeight: 1,

                            letterSpacing: "0.06em",

                            textTransform: "uppercase",

                            opacity: 0.7,

                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        {activeLocation.region}
                    </div>

                    <div
                        style={{
                            fontSize: 26,

                            lineHeight: "1em",

                            letterSpacing: "-0.04em",

                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        {activeLocation.name}
                    </div>
                </div>
            )}
        </div>
    )

    const infoInner = (
        <InfoContent
            location={activeLocation}
            showRegion={showRegion}
            showSecondaryButton={showSecondaryButton}
            textColor={textColor}
            mutedTextColor={mutedTextColor}
            buttonBackground={buttonBackground}
            buttonTextColor={buttonTextColor}
            headlineFont={responsiveHeadlineFont}
            bodyFont={responsiveBodyFont}
            detailFont={responsiveDetailFont}
            buttonFont={buttonFont}
            isMobile={isMobile}
            isTablet={isTablet}
            isStatic={isStatic}
        />
    )

    const infoPanel = (
        <div
            style={{
                width: "100%",
                height: "100%",

                padding: infoPadding,

                boxSizing: "border-box",

                backgroundColor: infoBackground,

                color: textColor,

                display: "flex",

                flexDirection: "column",

                overflow: "hidden",
            }}
        >
            {isStatic ? (
                infoInner
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
                            duration: animationSpeed * 0.7,

                            ease: [0.4, 0, 0.2, 1],
                        }}
                        style={{
                            width: "100%",

                            height: "100%",
                        }}
                    >
                        {infoInner}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,

                width: style?.width ?? 1200,

                height: style?.height ?? 760,

                minWidth: 1,

                minHeight: 1,

                position: "relative",

                overflow: "hidden",

                boxSizing: "border-box",

                borderRadius,

                backgroundColor,
            }}
        >
            {isDesktop && (
                <div
                    style={{
                        width: "100%",

                        height: "100%",

                        display: "grid",

                        gridTemplateColumns: `${safeNavWidth}% ${imageWidth}% ${safeInfoWidth}%`,
                    }}
                >
                    {navPanel}

                    {imageContent}

                    {infoPanel}
                </div>
            )}

            {isTablet && (
                <div
                    style={{
                        width: "100%",

                        height: "100%",

                        display: "grid",

                        gridTemplateColumns: "31% 69%",
                    }}
                >
                    {navPanel}

                    <div
                        style={{
                            width: "100%",

                            height: "100%",

                            minWidth: 0,

                            display: "grid",

                            gridTemplateRows: "45% 55%",
                        }}
                    >
                        {imageContent}

                        {infoPanel}
                    </div>
                </div>
            )}

            {isMobile && (
                <div
                    style={{
                        width: "100%",

                        height: "100%",

                        display: "grid",

                        gridTemplateRows: "auto minmax(190px, 34%) 1fr",

                        overflow: "hidden",
                    }}
                >
                    {navPanel}

                    {imageContent}

                    {infoPanel}
                </div>
            )}
        </div>
    )
}

function InfoContent({
    location,

    showRegion,
    showSecondaryButton,

    textColor,
    mutedTextColor,

    buttonBackground,
    buttonTextColor,

    headlineFont,
    bodyFont,
    detailFont,
    buttonFont,

    isMobile,
    isTablet,
    isStatic,
}: {
    location: LocationItem

    showRegion: boolean
    showSecondaryButton: boolean

    textColor: string
    mutedTextColor: string

    buttonBackground: string
    buttonTextColor: string

    headlineFont: React.CSSProperties
    bodyFont: React.CSSProperties
    detailFont: React.CSSProperties
    buttonFont: React.CSSProperties

    isMobile: boolean
    isTablet: boolean
    isStatic: boolean
}) {
    const sectionGap = isMobile ? 22 : isTablet ? 26 : 34

    const detailGap = isMobile ? 15 : 18

    const ctaMarginTop = isMobile ? 28 : isTablet ? 34 : 38

    const secondaryGap = isMobile ? 16 : 18

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100%",

                display: "flex",

                flexDirection: "column",

                boxSizing: "border-box",
            }}
        >
            <div>
                {showRegion && (
                    <div
                        style={{
                            marginBottom: isMobile ? 11 : 18,

                            color: mutedTextColor,

                            textTransform: "uppercase",

                            fontFamily: "Inter, sans-serif",

                            fontSize: 10,

                            lineHeight: "1.1em",

                            letterSpacing: "0.07em",
                        }}
                    >
                        {location.name}, {location.region}
                    </div>
                )}

                <h2
                    style={{
                        margin: 0,

                        color: textColor,

                        maxWidth: "95%",

                        ...headlineFont,
                    }}
                >
                    {location.headline}
                </h2>

                {location.description && (
                    <p
                        style={{
                            margin: isMobile ? "14px 0 0" : "20px 0 0",

                            color: mutedTextColor,

                            maxWidth: "95%",

                            ...bodyFont,
                        }}
                    >
                        {location.description}
                    </p>
                )}
            </div>

            <div
                style={{
                    display: "flex",

                    flexDirection: "column",

                    gap: detailGap,

                    marginTop: sectionGap,
                }}
            >
                <InfoRow
                    icon={<PinIcon />}
                    text={location.address}
                    color={textColor}
                    mutedColor={mutedTextColor}
                    font={detailFont}
                    isStatic={isStatic}
                />

                <InfoRow
                    icon={<ClockIcon />}
                    text={location.openingHours}
                    color={textColor}
                    mutedColor={mutedTextColor}
                    font={detailFont}
                    isStatic={isStatic}
                />

                <InfoRow
                    icon={<PhoneIcon />}
                    text={location.phone}
                    href={getPhoneHref(location.phone)}
                    color={textColor}
                    mutedColor={mutedTextColor}
                    font={detailFont}
                    isStatic={isStatic}
                />
            </div>

            <div
                style={{
                    display: "flex",

                    flexDirection: "column",

                    alignItems: "flex-start",

                    gap: secondaryGap,

                    marginTop: ctaMarginTop,

                    paddingBottom: isMobile ? 6 : 0,

                    flexShrink: 0,
                }}
            >
                {location.primaryLabel && (
                    <a
                        href={location.primaryLink || "#"}
                        target={location.primaryNewTab ? "_blank" : undefined}
                        rel={
                            location.primaryNewTab
                                ? "noopener noreferrer"
                                : undefined
                        }
                        onClick={(event) => {
                            if (isStatic) {
                                event.preventDefault()
                            }
                        }}
                        style={{
                            display: "inline-flex",

                            alignItems: "center",

                            justifyContent: "space-between",

                            gap: isMobile ? 24 : 28,

                            padding: "8px 8px 8px 18px",

                            minHeight: 46,

                            boxSizing: "border-box",

                            borderRadius: 999,

                            backgroundColor: buttonBackground,

                            color: buttonTextColor,

                            textDecoration: "none",

                            whiteSpace: "nowrap",

                            flexShrink: 0,

                            ...buttonFont,
                        }}
                    >
                        <span>{location.primaryLabel}</span>

                        <span
                            style={{
                                width: 30,

                                height: 30,

                                borderRadius: 999,

                                display: "flex",

                                alignItems: "center",

                                justifyContent: "center",

                                background: "rgba(0,0,0,0.07)",
                            }}
                        >
                            <ArrowIcon size={13} />
                        </span>
                    </a>
                )}

                {showSecondaryButton && location.secondaryLabel && (
                    <a
                        href={location.secondaryLink || "#"}
                        target={location.secondaryNewTab ? "_blank" : undefined}
                        rel={
                            location.secondaryNewTab
                                ? "noopener noreferrer"
                                : undefined
                        }
                        onClick={(event) => {
                            if (isStatic) {
                                event.preventDefault()
                            }
                        }}
                        style={{
                            display: "inline-flex",

                            alignItems: "center",

                            gap: 12,

                            paddingBottom: 5,

                            color: textColor,

                            textDecoration: "none",

                            borderBottom: `1px solid ${mutedTextColor}`,

                            flexShrink: 0,

                            ...buttonFont,
                        }}
                    >
                        <span>{location.secondaryLabel}</span>

                        <ArrowIcon size={13} />
                    </a>
                )}
            </div>
        </div>
    )
}

function InfoRow({
    icon,
    text,
    href,
    color,
    mutedColor,
    font,
    isStatic = false,
}: {
    icon: React.ReactNode

    text: string
    href?: string

    color: string
    mutedColor: string

    font: React.CSSProperties

    isStatic?: boolean
}) {
    if (!text) return null

    const content = (
        <>
            <div
                style={{
                    color: mutedColor,

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    marginTop: 1,
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    color,

                    whiteSpace: "pre-line",

                    ...font,
                }}
            >
                {text}
            </div>
        </>
    )

    if (href) {
        return (
            <a
                href={href}
                onClick={(event) => {
                    if (isStatic) {
                        event.preventDefault()
                    }
                }}
                style={{
                    display: "grid",

                    gridTemplateColumns: "18px 1fr",

                    gap: 12,

                    alignItems: "start",

                    width: "fit-content",

                    color,

                    textDecoration: "none",

                    cursor: isStatic ? "default" : "pointer",
                }}
            >
                {content}
            </a>
        )
    }

    return (
        <div
            style={{
                display: "grid",

                gridTemplateColumns: "18px 1fr",

                gap: 12,

                alignItems: "start",
            }}
        >
            {content}
        </div>
    )
}

addPropertyControls(Locations, {
    locations: {
        type: ControlType.Array,

        title: "Locations",

        control: {
            type: ControlType.Object,

            controls: {
                name: {
                    type: ControlType.String,
                    title: "Location",
                    defaultValue: "New York",
                },

                region: {
                    type: ControlType.String,
                    title: "Region",
                    defaultValue: "USA",
                },

                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },

                headline: {
                    type: ControlType.String,
                    title: "Headline",
                    defaultValue: "A place to feel at home.",
                },

                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue:
                        "Good coffee, thoughtful spaces and a place made for slowing down.",
                    displayTextArea: true,
                },

                address: {
                    type: ControlType.String,
                    title: "Address",
                    defaultValue: "123 Mulberry Street\nNew York, NY 10013",
                    displayTextArea: true,
                },

                openingHours: {
                    type: ControlType.String,
                    title: "Hours",
                    defaultValue: "Mon – Sun\n8:00 – 18:00",
                    displayTextArea: true,
                },

                phone: {
                    type: ControlType.String,
                    title: "Phone",
                    defaultValue: "+1 212 555 0187",
                },

                primaryLabel: {
                    type: ControlType.String,
                    title: "Primary CTA",
                    defaultValue: "Book a Table",
                },

                primaryLink: {
                    type: ControlType.Link,
                    title: "Primary Link",
                    defaultValue: "#",
                },

                primaryNewTab: {
                    type: ControlType.Boolean,
                    title: "Open Primary",
                    defaultValue: true,
                    enabledTitle: "New Tab",
                    disabledTitle: "Same Tab",
                },

                secondaryLabel: {
                    type: ControlType.String,
                    title: "Secondary CTA",
                    defaultValue: "View Menu",
                },

                secondaryLink: {
                    type: ControlType.Link,
                    title: "Secondary Link",
                    defaultValue: "#",
                },

                secondaryNewTab: {
                    type: ControlType.Boolean,
                    title: "Open Secondary",
                    defaultValue: true,
                    enabledTitle: "New Tab",
                    disabledTitle: "Same Tab",
                },
            },
        },

        defaultValue: DEFAULT_LOCATIONS,
    },

    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "Our Locations",
    },

    showNumbers: {
        type: ControlType.Boolean,
        title: "Numbers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    showRegion: {
        type: ControlType.Boolean,
        title: "Region",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    showSecondaryButton: {
        type: ControlType.Boolean,
        title: "Second CTA",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#EEEAE4",
    },

    navBackground: {
        type: ControlType.Color,
        title: "Nav BG",
        defaultValue: "#EEEAE4",
    },

    infoBackground: {
        type: ControlType.Color,
        title: "Info BG",
        defaultValue: "#171715",
    },

    navTextColor: {
        type: ControlType.Color,
        title: "Nav Text",
        defaultValue: "#111111",
    },

    navInactiveColor: {
        type: ControlType.Color,
        title: "Nav Inactive",
        defaultValue: "rgba(17,17,17,0.38)",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },

    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "rgba(255,255,255,0.62)",
    },

    dividerColor: {
        type: ControlType.Color,
        title: "Divider",
        defaultValue: "rgba(17,17,17,0.14)",
    },

    buttonBackground: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#FFFFFF",
    },

    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#111111",
    },

    imageOverlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "#000000",
    },

    imageOverlayOpacity: {
        type: ControlType.Number,
        title: "Overlay",
        defaultValue: 0.06,
        min: 0,
        max: 0.8,
        step: 0.01,
    },

    grainOpacity: {
        type: ControlType.Number,
        title: "Grain",
        defaultValue: 0.1,
        min: 0,
        max: 0.35,
        step: 0.01,
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },

    navWidth: {
        type: ControlType.Number,
        title: "Nav Width",
        defaultValue: 27,
        min: 20,
        max: 38,
        step: 1,
        unit: "%",
    },

    infoWidth: {
        type: ControlType.Number,
        title: "Info Width",
        defaultValue: 29,
        min: 22,
        max: 40,
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
            fontSize: "10px",
            variant: "Medium",
            letterSpacing: "0.08em",
            lineHeight: "1.1em",
        },
    },

    locationFont: {
        type: ControlType.Font,
        title: "Location Font",
        controls: "extended",
        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "22px",
            variant: "Regular",
            letterSpacing: "-0.035em",
            lineHeight: "1.05em",
        },
    },

    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "42px",
            variant: "Regular",
            letterSpacing: "-0.045em",
            lineHeight: "1.02em",
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
            letterSpacing: "-0.005em",
            lineHeight: "1.5em",
        },
    },

    detailFont: {
        type: ControlType.Font,
        title: "Detail Font",
        controls: "extended",
        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "12px",
            variant: "Regular",
            letterSpacing: "-0.005em",
            lineHeight: "1.45em",
        },
    },

    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",

        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
