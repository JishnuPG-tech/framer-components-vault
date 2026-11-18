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


/**
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 360
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

type Props = {
    eyebrow: string
    title: string
    testimonials: string

    autoplay: boolean
    interval: number
    transitionDuration: number
    pauseOnHover: boolean

    background: string
    eyebrowColor: string
    titleColor: string
    textColor: string
    nameColor: string
    metaColor: string
    cardBackground: string
    ghostCardBackground: string
    activeDotColor: string
    inactiveDotColor: string

    sectionPadding: number
    mobilePadding: number
    columnGap: number
    cardRadius: number
    cardPadding: number
    mobileCardPadding: number
    cardShadow: string
    minCardHeight: number
    mobileMinCardHeight: number

    titleFontFamily: string
    textFontFamily: string
    eyebrowFont: React.CSSProperties
    titleFont: React.CSSProperties
    bodyFont: React.CSSProperties
    nameFont: React.CSSProperties
    metaFont: React.CSSProperties

    tabletBreakpoint: number
    mobileBreakpoint: number

    style?: React.CSSProperties
}

type Testimonial = {
    quote: string
    name: string
    meta: string
}

const defaultTestimonials: Testimonial[] = [
    {
        quote: "The itinerary felt personal without becoming complicated. We booked the whole Portugal route in one evening and finally stopped arguing with 27 browser tabs.",
        name: "Mike Taylor",
        meta: "Lahore, Pakistan",
    },
    {
        quote: "It felt like someone quietly removed all the stressful parts of planning. The route, timing, and hotel choices finally made sense together.",
        name: "Amelia Carter",
        meta: "Brighton, United Kingdom",
    },
    {
        quote: "We wanted something flexible, beautiful, and not painfully overplanned. This gave us exactly that — enough structure to relax, enough room to wander.",
        name: "Nora Jensen",
        meta: "Copenhagen, Denmark",
    },
]

function parseTestimonials(value: string): Testimonial[] {
    const parsed = value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split("|").map((part) => part.trim())

            return {
                quote: parts[0] || "",
                name: parts[1] || "Anonymous",
                meta: parts[2] || "",
            }
        })
        .filter((item) => item.quote.length > 0)

    return parsed.length > 0 ? parsed : defaultTestimonials
}

function useElementWidth(isStatic: boolean) {
    const ref = React.useRef<HTMLElement | null>(null)
    const [width, setWidth] = React.useState(1100)

    React.useEffect(() => {
        if (isStatic) return
        if (!ref.current) return

        const element = ref.current

        const update = () => {
            setWidth(element.getBoundingClientRect().width || 1100)
        }

        update()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", update)
            return () => window.removeEventListener("resize", update)
        }

        const observer = new ResizeObserver(update)
        observer.observe(element)

        return () => observer.disconnect()
    }, [isStatic])

    return { ref, width }
}

function getFontSize(font: React.CSSProperties, fallback: number) {
    const value = font.fontSize

    if (typeof value === "number") return value

    if (typeof value === "string") {
        const parsed = parseFloat(value)
        return Number.isFinite(parsed) ? parsed : fallback
    }

    return fallback
}

export default function LiveTestimonials(props: Props) {
    const {
        eyebrow,
        title,
        testimonials,

        autoplay,
        interval,
        transitionDuration,
        pauseOnHover,

        background,
        eyebrowColor,
        titleColor,
        textColor,
        nameColor,
        metaColor,
        cardBackground,
        ghostCardBackground,
        activeDotColor,
        inactiveDotColor,

        sectionPadding,
        mobilePadding,
        columnGap,
        cardRadius,
        cardPadding,
        mobileCardPadding,
        cardShadow,
        minCardHeight,
        mobileMinCardHeight,

        titleFontFamily,
        textFontFamily,
        eyebrowFont,
        titleFont,
        bodyFont,
        nameFont,
        metaFont,

        tabletBreakpoint,
        mobileBreakpoint,

        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const { ref, width } = useElementWidth(isStatic)

    const isMobile = width <= mobileBreakpoint
    const isTablet = width > mobileBreakpoint && width <= tabletBreakpoint

    const items = React.useMemo(
        () => parseTestimonials(testimonials),
        [testimonials]
    )

    const [activeIndex, setActiveIndex] = React.useState(0)
    const [isPaused, setIsPaused] = React.useState(false)

    const safeActiveIndex = isStatic
        ? 0
        : Math.min(Math.max(activeIndex, 0), items.length - 1)

    React.useEffect(() => {
        if (isStatic) return
        if (!autoplay || isPaused || items.length <= 1) return

        const timer = window.setInterval(
            () => {
                setActiveIndex((current) => (current + 1) % items.length)
            },
            Math.max(1200, interval)
        )

        return () => window.clearInterval(timer)
    }, [isStatic, autoplay, isPaused, items.length, interval])

    React.useEffect(() => {
        if (isStatic) return

        if (activeIndex > items.length - 1) {
            setActiveIndex(0)
        }
    }, [isStatic, items.length, activeIndex])

    const computedPadding = isMobile
        ? mobilePadding
        : isTablet
          ? Math.min(sectionPadding, 36)
          : sectionPadding

    const computedGap = isMobile ? 30 : isTablet ? 46 : columnGap

    const computedCardPadding = isMobile
        ? mobileCardPadding
        : isTablet
          ? Math.min(cardPadding, 34)
          : cardPadding

    const computedMinCardHeight = isMobile ? mobileMinCardHeight : minCardHeight

    const desktopTitleSize = getFontSize(titleFont, 56)
    const desktopBodySize = getFontSize(bodyFont, 16)
    const desktopNameSize = getFontSize(nameFont, 16)
    const desktopMetaSize = getFontSize(metaFont, 14)
    const desktopEyebrowSize = getFontSize(eyebrowFont, 14)

    const responsiveTitleFont: React.CSSProperties = {
        ...titleFont,
        fontSize: isMobile
            ? Math.min(desktopTitleSize, 40)
            : isTablet
              ? Math.min(desktopTitleSize, 48)
              : desktopTitleSize,
        lineHeight: isMobile ? "1em" : titleFont.lineHeight,
    }

    const responsiveBodyFont: React.CSSProperties = {
        ...bodyFont,
        fontSize: isMobile ? Math.min(desktopBodySize, 15) : desktopBodySize,
        lineHeight: isMobile ? "1.55em" : bodyFont.lineHeight,
    }

    const responsiveNameFont: React.CSSProperties = {
        ...nameFont,
        fontSize: isMobile ? Math.min(desktopNameSize, 15) : desktopNameSize,
    }

    const responsiveMetaFont: React.CSSProperties = {
        ...metaFont,
        fontSize: isMobile ? Math.min(desktopMetaSize, 13) : desktopMetaSize,
    }

    const responsiveEyebrowFont: React.CSSProperties = {
        ...eyebrowFont,
        fontSize: isMobile
            ? Math.min(desktopEyebrowSize, 12)
            : desktopEyebrowSize,
    }

    return (
        <section
            ref={ref as React.RefObject<HTMLElement>}
            style={{
                ...style,
                width: "100%",
                height: "auto",
                minHeight: isMobile ? "auto" : "100%",
                background,
                overflow: "visible",
                boxSizing: "border-box",
                padding: computedPadding,
                position: "relative",
            }}
            onMouseEnter={() => {
                if (!isStatic && pauseOnHover) setIsPaused(true)
            }}
            onMouseLeave={() => {
                if (!isStatic && pauseOnHover) setIsPaused(false)
            }}
        >
            {!isStatic && (
                <style>{`
                    .live-testimonials-dot {
                        border: 0;
                        padding: 0;
                        cursor: pointer;
                        transition:
                            transform 180ms ease,
                            background 180ms ease,
                            opacity 180ms ease,
                            width 180ms ease;
                    }

                    .live-testimonials-dot:hover {
                        transform: scale(1.15);
                    }
                `}</style>
            )}

            <div
                style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: isMobile
                        ? "1fr"
                        : "minmax(260px, 0.86fr) minmax(320px, 1.14fr)",
                    gap: computedGap,
                    alignItems: "start",
                }}
            >
                <div>
                    <div
                        style={{
                            color: eyebrowColor,
                            fontFamily: textFontFamily,
                            textTransform: "uppercase",
                            marginBottom: isMobile ? 14 : 18,
                            ...responsiveEyebrowFont,
                        }}
                    >
                        {eyebrow}
                    </div>

                    <h2
                        style={{
                            margin: 0,
                            color: titleColor,
                            fontFamily: titleFontFamily,
                            maxWidth: isMobile ? 340 : 520,
                            whiteSpace: "pre-line",
                            ...responsiveTitleFont,
                        }}
                    >
                        {title}
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: isMobile ? 12 : 18,
                            marginTop: isMobile ? 26 : 72,
                        }}
                    >
                        {items.map((_, index) => {
                            const isActive = index === safeActiveIndex

                            return (
                                <button
                                    key={index}
                                    className={
                                        isStatic
                                            ? undefined
                                            : "live-testimonials-dot"
                                    }
                                    aria-label={`Show testimonial ${index + 1}`}
                                    onClick={() => {
                                        if (!isStatic) setActiveIndex(index)
                                    }}
                                    style={{
                                        width: isActive && isMobile ? 22 : 10,
                                        height: 10,
                                        borderRadius: 999,
                                        background: isActive
                                            ? activeDotColor
                                            : inactiveDotColor,
                                        opacity: isActive ? 1 : 0.75,
                                        border: 0,
                                        padding: 0,
                                        cursor: isStatic
                                            ? "default"
                                            : "pointer",
                                    }}
                                />
                            )
                        })}
                    </div>
                </div>

                <div
                    style={{
                        position: "relative",
                        paddingBottom: isMobile ? 0 : 30,
                    }}
                >
                    {!isMobile && (
                        <div
                            style={{
                                position: "absolute",
                                zIndex: 1,
                                left: "14%",
                                right: "-7%",
                                top: 30,
                                bottom: 0,
                                borderRadius: cardRadius,
                                opacity: 0.55,
                                pointerEvents: "none",
                                background: ghostCardBackground,
                                border: `1px solid ${inactiveDotColor}`,
                            }}
                        />
                    )}

                    <div
                        style={{
                            position: "relative",
                            zIndex: 2,
                            display: "grid",
                            width: "100%",
                            minHeight:
                                computedMinCardHeight > 0
                                    ? computedMinCardHeight
                                    : undefined,
                        }}
                    >
                        {items.map((item, index) => {
                            const isActive = index === safeActiveIndex

                            return (
                                <article
                                    key={index}
                                    style={{
                                        gridArea: "1 / 1",
                                        width: "100%",
                                        boxSizing: "border-box",
                                        background: cardBackground,
                                        borderRadius: isMobile
                                            ? Math.min(cardRadius, 18)
                                            : cardRadius,
                                        padding: computedCardPadding,
                                        boxShadow: isMobile
                                            ? "0 16px 44px rgba(24, 29, 74, 0.07)"
                                            : cardShadow,

                                        opacity: isActive ? 1 : 0,
                                        visibility: isActive
                                            ? "visible"
                                            : "hidden",
                                        transform: isActive
                                            ? "translateY(0)"
                                            : isStatic
                                              ? "translateY(0)"
                                              : "translateY(12px)",
                                        pointerEvents:
                                            !isStatic && isActive
                                                ? "auto"
                                                : "none",
                                        transition: isStatic
                                            ? undefined
                                            : `
                                                opacity ${transitionDuration}ms ease,
                                                transform ${transitionDuration}ms ease,
                                                visibility 0ms linear ${
                                                    isActive
                                                        ? "0ms"
                                                        : `${transitionDuration}ms`
                                                }
                                            `,
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: 0,
                                            color: textColor,
                                            fontFamily: textFontFamily,
                                            ...responsiveBodyFont,
                                        }}
                                    >
                                        “{item.quote}”
                                    </p>

                                    <div
                                        style={{
                                            marginTop: isMobile ? 22 : 28,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: nameColor,
                                                fontFamily: textFontFamily,
                                                ...responsiveNameFont,
                                            }}
                                        >
                                            {item.name}
                                        </div>

                                        {item.meta && (
                                            <div
                                                style={{
                                                    color: metaColor,
                                                    fontFamily: textFontFamily,
                                                    marginTop: 6,
                                                    ...responsiveMetaFont,
                                                }}
                                            >
                                                {item.meta}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(LiveTestimonials, {
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "Testimonials",
    },

    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "What People Say\nAbout Us.",
        displayTextArea: true,
    },

    testimonials: {
        type: ControlType.String,
        title: "Items",
        displayTextArea: true,
        defaultValue:
            "The itinerary felt personal without becoming complicated. We booked the whole Portugal route in one evening and finally stopped arguing with 27 browser tabs. | Mike Taylor | Lahore, Pakistan\nIt felt like someone quietly removed all the stressful parts of planning. The route, timing, and hotel choices finally made sense together. | Amelia Carter | Brighton, United Kingdom\nWe wanted something flexible, beautiful, and not painfully overplanned. This gave us exactly that — enough structure to relax, enough room to wander. | Nora Jensen | Copenhagen, Denmark",
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 4200,
        min: 1200,
        max: 12000,
        step: 100,
        unit: "ms",
        hidden: (props) => !props.autoplay,
    },

    transitionDuration: {
        type: ControlType.Number,
        title: "Transition",
        defaultValue: 520,
        min: 120,
        max: 1600,
        step: 20,
        unit: "ms",
    },

    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => !props.autoplay,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },

    eyebrowColor: {
        type: ControlType.Color,
        title: "Eyebrow",
        defaultValue: "#5A5E7D",
    },

    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#181D4A",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#59607F",
    },

    nameColor: {
        type: ControlType.Color,
        title: "Name",
        defaultValue: "#555B7B",
    },

    metaColor: {
        type: ControlType.Color,
        title: "Meta",
        defaultValue: "#5F6687",
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "#FFFFFF",
    },

    ghostCardBackground: {
        type: ControlType.Color,
        title: "Ghost Card",
        defaultValue: "#FBFBFD",
    },

    activeDotColor: {
        type: ControlType.Color,
        title: "Active Dot",
        defaultValue: "#181D4A",
    },

    inactiveDotColor: {
        type: ControlType.Color,
        title: "Inactive Dot",
        defaultValue: "#DFE1E8",
    },

    sectionPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 32,
        min: 0,
        max: 120,
        step: 1,
    },

    mobilePadding: {
        type: ControlType.Number,
        title: "Mobile Pad",
        defaultValue: 22,
        min: 0,
        max: 80,
        step: 1,
    },

    columnGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 80,
        min: 20,
        max: 180,
        step: 1,
    },

    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
    },

    cardPadding: {
        type: ControlType.Number,
        title: "Card Pad",
        defaultValue: 42,
        min: 20,
        max: 90,
        step: 1,
    },

    mobileCardPadding: {
        type: ControlType.Number,
        title: "Mobile Card",
        defaultValue: 24,
        min: 16,
        max: 60,
        step: 1,
    },

    minCardHeight: {
        type: ControlType.Number,
        title: "Min Card H",
        defaultValue: 0,
        min: 0,
        max: 500,
        step: 1,
    },

    mobileMinCardHeight: {
        type: ControlType.Number,
        title: "Mobile Min H",
        defaultValue: 0,
        min: 0,
        max: 500,
        step: 1,
    },

    cardShadow: {
        type: ControlType.String,
        title: "Shadow",
        defaultValue: "0 24px 70px rgba(24, 29, 74, 0.08)",
    },

    titleFontFamily: {
        type: ControlType.String,
        title: "Title Font",
        defaultValue: "Instrument Serif, Georgia, serif",
    },

    textFontFamily: {
        type: ControlType.String,
        title: "Text Font",
        defaultValue: "Inter, sans-serif",
    },

    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",
        defaultValue: {
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.02em",
            lineHeight: "1.1em",
        },
        controls: "extended",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font Style",
        defaultValue: {
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: "0.94em",
        },
        controls: "extended",
    },

    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        defaultValue: {
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: "1.75em",
        },
        controls: "extended",
    },

    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        defaultValue: {
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.015em",
            lineHeight: "1.2em",
        },
        controls: "extended",
    },

    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        defaultValue: {
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
    },

    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet BP",
        defaultValue: 900,
        min: 650,
        max: 1200,
        step: 10,
    },

    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile BP",
        defaultValue: 620,
        min: 320,
        max: 760,
        step: 10,
    },
})
