// User instructions: Create a centered image carousel where the active/focused card lifts upward with an elevation effect. The center card should be visually elevated above the surrounding cards, with its full content (title, subtitle, optional tag, and CTA button) visible below it. Non-active cards should be scaled down slightly and have reduced opacity. Requirements include horizontal scrolling with center-focus, spring animation, configurable sizing/spacing/radius/elevation, prev/next buttons on mobile, responsive behavior, typography controls, color customization, and configurable spring timing. Added mouse drag and wheel scrolling, configurable arrow visibility, pagination dots with styling controls, responsive sizing controls for card width/height/spacing across breakpoints, infinite loop scrolling, and content spacing controls (tag-title, title-subtitle, button gaps). Property controls organized into cleaner categories.

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

import { motion } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type CarouselItem = {
    image?: ResponsiveImage
    title: string
    subtitle: string
    tag: string
    ctaLabel: string
    link: string
}

type SpringTransition = any

export interface CenterLiftCarouselProps {
    items: CarouselItem[]

    // Desktop sizing
    cardWidth: number
    cardHeight: number
    spacing: number

    // Responsive sizing
    responsiveSizing: boolean
    tabletBreakpoint: number
    tabletCardWidth: number
    tabletCardHeight: number
    tabletSpacing: number
    mobileBreakpoint: number
    mobileCardWidth: number
    mobileCardHeight: number
    mobileSpacing: number

    // Card style
    borderRadius: string
    elevation: number
    inactiveScale: number
    inactiveOpacity: number

    // Content spacing
    tagTitleGap: number
    titleSubtitleGap: number
    buttonTopGap: number

    // Colors
    backgroundColor: string
    cardBackgroundColor: string
    textColor: string
    subtitleColor: string
    tagBackgroundColor: string
    tagTextColor: string
    buttonBackgroundColor: string
    buttonTextColor: string

    // Typography
    titleFont: any
    subtitleFont: any
    tagFont: any
    buttonFont: any

    // Animation
    spring: SpringTransition

    // Navigation
    showArrows: boolean
    arrowsVisibility: "mobile" | "always"

    // Interaction
    enableDragScroll: boolean
    enableWheelScroll: boolean

    // Pagination
    showDots: boolean
    dotsColor: string
    dotsActiveColor: string
    dotsSize: number
    dotsGap: number
    dotsBottomOffset: number

    style?: React.CSSProperties
}

const defaultImages: ResponsiveImage[] = [
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2 - Purple",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
]

function getNearestIndex(container: HTMLDivElement, cardCenters: number[]) {
    const cx = container.scrollLeft + container.clientWidth / 2
    let best = 0
    let bestDist = Number.POSITIVE_INFINITY
    for (let i = 0; i < cardCenters.length; i++) {
        const d = Math.abs(cardCenters[i] - cx)
        if (d < bestDist) {
            bestDist = d
            best = i
        }
    }
    return best
}

/**
 * Center Lift Carousel
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CenterLiftCarousel(props: CenterLiftCarouselProps) {
    const {
        items = [
            {
                title: "Featured Project",
                subtitle: "A short description goes here.",
                tag: "Case Study",
                ctaLabel: "View",
                link: "",
            },
            {
                title: "Second Highlight",
                subtitle: "Another example item.",
                tag: "New",
                ctaLabel: "Open",
                link: "",
            },
            {
                title: "Third Item",
                subtitle: "Perfect for portfolios and products.",
                tag: "",
                ctaLabel: "Explore",
                link: "",
            },
        ],

        cardWidth = 320,
        cardHeight = 320,
        spacing = 24,

        responsiveSizing = true,
        tabletBreakpoint = 980,
        tabletCardWidth = 280,
        tabletCardHeight = 280,
        tabletSpacing = 18,
        mobileBreakpoint = 640,
        mobileCardWidth = 240,
        mobileCardHeight = 240,
        mobileSpacing = 14,

        borderRadius = "16px",
        elevation = 22,
        inactiveScale = 0.92,
        inactiveOpacity = 0.62,

        tagTitleGap = 8,
        titleSubtitleGap = 4,
        buttonTopGap = 12,

        backgroundColor = "#FFFFFF",
        cardBackgroundColor = "#FFFFFF",
        textColor = "#000000",
        subtitleColor = "#CCCCCC",
        tagBackgroundColor = "#F5F5F5",
        tagTextColor = "#000000",
        buttonBackgroundColor = "#000000",
        buttonTextColor = "#FFFFFF",

        titleFont,
        subtitleFont,
        tagFont,
        buttonFont,

        spring,

        showArrows = true,
        arrowsVisibility = "mobile",

        enableDragScroll = true,
        enableWheelScroll = true,

        showDots = true,
        dotsColor = "rgba(0,0,0,0.25)",
        dotsActiveColor = "#000000",
        dotsSize = 7,
        dotsGap = 8,
        dotsBottomOffset = 14,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const cardRefs = React.useRef<Array<HTMLDivElement | null>>([])

    const [activeIndex, setActiveIndex] = React.useState(0)
    const [isMobile, setIsMobile] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const [containerWidth, setContainerWidth] = React.useState(0)

    const dragStartXRef = React.useRef(0)
    const dragScrollLeftRef = React.useRef(0)

    const safeItems = React.useMemo(() => {
        const list = Array.isArray(items) ? items : []
        return list.map((it, i) => {
            const fallback = defaultImages[i % defaultImages.length]
            const image: ResponsiveImage = it?.image?.src ? it.image! : fallback

            return {
                image,
                title: it?.title ?? "",
                subtitle: it?.subtitle ?? "",
                tag: it?.tag ?? "",
                ctaLabel: it?.ctaLabel ?? "",
                link: it?.link ?? "",
            }
        })
    }, [items])

    // Triplicate items for infinite loop
    const loopedItems = React.useMemo(() => {
        if (safeItems.length === 0) return []
        return [...safeItems, ...safeItems, ...safeItems]
    }, [safeItems])

    // Keep refs array length in sync
    React.useEffect(() => {
        cardRefs.current = cardRefs.current.slice(0, loopedItems.length)
    }, [loopedItems.length])

    // Responsive detection
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const el = containerRef.current
        if (!el) return

        const update = () => {
            const w = el.clientWidth || window.innerWidth
            const next = w <= mobileBreakpoint
            React.startTransition(() => {
                setIsMobile(next)
                setContainerWidth(w)
            })
        }

        update()

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => update())
            ro.observe(el)
        } else {
            window.addEventListener("resize", update)
        }

        return () => {
            if (ro) ro.disconnect()
            else window.removeEventListener("resize", update)
        }
    }, [mobileBreakpoint])

    const layoutMode = React.useMemo(() => {
        if (!responsiveSizing) return "desktop" as const
        const w = containerWidth || containerRef.current?.clientWidth || 0
        if (w && w <= mobileBreakpoint) return "mobile" as const
        if (w && w <= tabletBreakpoint) return "tablet" as const
        return "desktop" as const
    }, [containerWidth, mobileBreakpoint, responsiveSizing, tabletBreakpoint])

    const effectiveCardWidth =
        layoutMode === "mobile" ? mobileCardWidth : layoutMode === "tablet" ? tabletCardWidth : cardWidth
    const effectiveCardHeight =
        layoutMode === "mobile" ? mobileCardHeight : layoutMode === "tablet" ? tabletCardHeight : cardHeight
    const effectiveSpacing = layoutMode === "mobile" ? mobileSpacing : layoutMode === "tablet" ? tabletSpacing : spacing

    const computeCenters = React.useCallback(() => {
        const container = containerRef.current
        if (!container) return [] as number[]
        const containerRect = container.getBoundingClientRect()
        return cardRefs.current.map((node) => {
            if (!node) return 0
            const r = node.getBoundingClientRect()
            const x = r.left - containerRect.left + container.scrollLeft + r.width / 2
            return x
        })
    }, [])

    const rafRef = React.useRef<number | null>(null)
    const isRepositioningRef = React.useRef(false)

    const updateActiveFromScroll = React.useCallback(() => {
        const container = containerRef.current
        if (!container || isRepositioningRef.current) return

        const centers = computeCenters()
        if (!centers.length) return

        const idx = getNearestIndex(container, centers)
        React.startTransition(() => setActiveIndex((prev) => (prev === idx ? prev : idx)))

        // Handle infinite loop repositioning
        if (safeItems.length > 0) {
            const originalLength = safeItems.length
            // If we're in the first set, jump to middle set
            if (idx < originalLength) {
                isRepositioningRef.current = true
                const targetIdx = idx + originalLength
                const targetCenter = centers[targetIdx]
                const newScrollLeft = targetCenter - container.clientWidth / 2
                container.scrollLeft = newScrollLeft
                React.startTransition(() => setActiveIndex(targetIdx))
                requestAnimationFrame(() => {
                    isRepositioningRef.current = false
                })
            }
            // If we're in the third set, jump to middle set
            else if (idx >= 2 * originalLength) {
                isRepositioningRef.current = true
                const targetIdx = idx - originalLength
                const targetCenter = centers[targetIdx]
                const newScrollLeft = targetCenter - container.clientWidth / 2
                container.scrollLeft = newScrollLeft
                React.startTransition(() => setActiveIndex(targetIdx))
                requestAnimationFrame(() => {
                    isRepositioningRef.current = false
                })
            }
        }
    }, [computeCenters, safeItems.length])

    const onScroll = React.useCallback(() => {
        if (isStatic) return
        if (rafRef.current != null) return
        if (typeof window === "undefined") return

        rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null
            updateActiveFromScroll()
        })
    }, [isStatic, updateActiveFromScroll])

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        const container = containerRef.current
        if (!container) return

        const handle = () => onScroll()
        container.addEventListener("scroll", handle, { passive: true })

        // Initial measurement - start at middle set
        if (safeItems.length > 0) {
            const originalLength = safeItems.length
            const middleStartIdx = originalLength
            requestAnimationFrame(() => {
                scrollToIndex(middleStartIdx)
            })
        }

        return () => {
            container.removeEventListener("scroll", handle)
            if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current)
        }
    }, [isStatic, onScroll, safeItems.length])

    const scrollToIndex = React.useCallback((index: number) => {
        const container = containerRef.current
        const node = cardRefs.current[index]
        if (!container || !node) return

        const cRect = container.getBoundingClientRect()
        const nRect = node.getBoundingClientRect()

        const nodeCenter = nRect.left - cRect.left + container.scrollLeft + nRect.width / 2
        const target = nodeCenter - container.clientWidth / 2

        container.scrollTo({ left: target, behavior: "smooth" })
    }, [])

    const goPrev = React.useCallback(() => {
        if (safeItems.length === 0) return
        let next = activeIndex - 1
        if (next < 0) {
            next = loopedItems.length - 1
        }
        scrollToIndex(next)
    }, [activeIndex, safeItems.length, loopedItems.length, scrollToIndex])

    const goNext = React.useCallback(() => {
        if (safeItems.length === 0) return
        let next = activeIndex + 1
        if (next >= loopedItems.length) {
            next = 0
        }
        scrollToIndex(next)
    }, [activeIndex, safeItems.length, loopedItems.length, scrollToIndex])

    const showNav = showArrows && safeItems.length > 1 && (arrowsVisibility === "always" ? true : isMobile)

    const sidePadding = React.useMemo(() => {
        const w = containerWidth || containerRef.current?.clientWidth || 0
        return Math.max(0, w / 2 - effectiveCardWidth / 2)
    }, [containerWidth, effectiveCardWidth])

    const contentGap = 10

    const showDotsUI = showDots && safeItems.length > 1

    const isFixedWidth = Boolean(props?.style && (props.style as React.CSSProperties).width === "100%")
    const isFixedHeight = Boolean(props?.style && (props.style as React.CSSProperties).height === "100%")

    React.useEffect(() => {
        if (isStatic) return
        if (!enableDragScroll) return
        if (typeof window === "undefined") return

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            const el = containerRef.current
            if (!el) return
            const dx = e.clientX - dragStartXRef.current
            el.scrollLeft = dragScrollLeftRef.current - dx
        }

        const handleMouseUp = () => {
            React.startTransition(() => setIsDragging(false))
        }

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDragging, enableDragScroll, isStatic])

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                ...(isFixedWidth ? {} : { minWidth: "max-content" }),
                ...(isFixedHeight ? {} : { minHeight: "max-content" }),
            }}
        >
            <style>{`.clc-scrollbar-hide{scrollbar-width:none;-ms-overflow-style:none;} .clc-scrollbar-hide::-webkit-scrollbar{width:0;height:0;}`}</style>
            <div
                ref={containerRef}
                className="clc-scrollbar-hide"
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    WebkitOverflowScrolling: "touch",
                    scrollSnapType: "x mandatory",
                    display: "flex",
                    alignItems: "center",
                    gap: `${effectiveSpacing}px`,
                    paddingLeft: `${sidePadding}px`,
                    paddingRight: `${sidePadding}px`,
                    paddingTop: `${Math.max(0, elevation)}px`,
                    paddingBottom: `${24}px`,
                    boxSizing: "border-box",
                    cursor: isDragging ? "grabbing" : enableDragScroll ? "grab" : "auto",
                    userSelect: isDragging ? "none" : "auto",
                }}
                onScroll={onScroll}
                onWheel={(e) => {
                    if (isStatic) return
                    if (!enableWheelScroll) return
                    const el = containerRef.current
                    if (!el) return
                    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                        e.preventDefault()
                        el.scrollLeft += e.deltaY
                    }
                }}
                onMouseDown={(e) => {
                    if (isStatic) return
                    if (!enableDragScroll) return
                    const el = containerRef.current
                    if (!el) return
                    dragStartXRef.current = e.clientX
                    dragScrollLeftRef.current = el.scrollLeft
                    React.startTransition(() => setIsDragging(true))
                }}
                aria-label="Carousel"
                role="region"
            >
                {safeItems.length === 0 ? (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: textColor,
                            ...subtitleFont,
                        }}
                    >
                        Add items to the carousel.
                    </div>
                ) : (
                    loopedItems.map((item, i) => {
                        const isActive = (isStatic ? 0 : activeIndex) === i
                        const y = isActive ? -elevation : 0
                        const scale = isActive ? 1 : inactiveScale
                        const opacity = isActive ? 1 : inactiveOpacity

                        return (
                            <motion.div
                                key={i}
                                ref={(el) => {
                                    cardRefs.current[i] = el
                                }}
                                style={{
                                    scrollSnapAlign: "center",
                                    flex: "0 0 auto",
                                    width: `${effectiveCardWidth}px`,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: `${contentGap}px`,
                                    color: textColor,
                                }}
                                animate={
                                    isStatic
                                        ? undefined
                                        : {
                                              y,
                                              scale,
                                              opacity,
                                          }
                                }
                                transition={spring}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: `${effectiveCardHeight}px`,
                                        borderRadius,
                                        overflow: "hidden",
                                        background: cardBackgroundColor,
                                        boxShadow: isActive
                                            ? "0 16px 40px rgba(0,0,0,0.18)"
                                            : "0 8px 24px rgba(0,0,0,0.10)",
                                        position: "relative",
                                    }}
                                >
                                    <img
                                        src={item.image?.src}
                                        srcSet={item.image?.srcSet || undefined}
                                        alt={item.image?.alt || ""}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }}
                                >
                                    {item.tag ? (
                                        <div
                                            style={{
                                                width: "max-content",
                                                maxWidth: "100%",
                                                padding: "6px 10px",
                                                borderRadius: "999px",
                                                background: tagBackgroundColor,
                                                color: tagTextColor,
                                                ...tagFont,
                                                marginBottom: `${tagTitleGap}px`,
                                            }}
                                            aria-label={item.tag}
                                        >
                                            {item.tag}
                                        </div>
                                    ) : null}

                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: `${titleSubtitleGap}px`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "100%",
                                                margin: 0,
                                                ...titleFont,
                                            }}
                                        >
                                            {item.title}
                                        </div>
                                        <div
                                            style={{
                                                width: "100%",
                                                margin: 0,
                                                color: subtitleColor,
                                                ...subtitleFont,
                                            }}
                                        >
                                            {item.subtitle}
                                        </div>
                                    </div>

                                    {item.ctaLabel ? (
                                        <a
                                            href={item.link || undefined}
                                            target={item.link ? "_blank" : undefined}
                                            rel={item.link ? "noreferrer" : undefined}
                                            style={{
                                                width: "max-content",
                                                textDecoration: "none",
                                                padding: "10px 14px",
                                                borderRadius: "999px",
                                                background: buttonBackgroundColor,
                                                color: buttonTextColor,
                                                marginTop: `${buttonTopGap}px`,
                                                ...buttonFont,
                                            }}
                                            aria-label={item.ctaLabel}
                                            onClick={(e) => {
                                                if (!item.link) e.preventDefault()
                                            }}
                                        >
                                            {item.ctaLabel}
                                        </a>
                                    ) : null}
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>

            {showNav ? (
                <>
                    <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Previous"
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 42,
                            height: 42,
                            borderRadius: 999,
                            border: "1px solid rgba(0,0,0,0.10)",
                            background: "rgba(255,255,255,0.90)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#000",
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M15 18l-6-6 6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next"
                        style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 42,
                            height: 42,
                            borderRadius: 999,
                            border: "1px solid rgba(0,0,0,0.10)",
                            background: "rgba(255,255,255,0.90)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#000",
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M9 6l6 6-6 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </>
            ) : null}

            {showDotsUI ? (
                <div
                    role="tablist"
                    aria-label="Carousel pagination"
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: dotsBottomOffset,
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: `${dotsGap}px`,
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "auto",
                    }}
                >
                    {safeItems.map((_, i) => {
                        const originalLength = safeItems.length
                        const normalizedActiveIndex = activeIndex % originalLength
                        const active = (isStatic ? 0 : normalizedActiveIndex) === i
                        return (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-label={`Go to slide ${i + 1}`}
                                aria-selected={active}
                                onClick={() => {
                                    const targetIdx = originalLength + i
                                    scrollToIndex(targetIdx)
                                }}
                                style={{
                                    width: dotsSize,
                                    height: dotsSize,
                                    borderRadius: 999,
                                    border: "none",
                                    padding: 0,
                                    background: active ? dotsActiveColor : dotsColor,
                                    cursor: "pointer",
                                    opacity: active ? 1 : 0.9,
                                }}
                            />
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}

addPropertyControls(CenterLiftCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Project Title" },
                subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "Short subheadline" },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "" },
                ctaLabel: { type: ControlType.String, title: "CTA", defaultValue: "View" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
        defaultValue: [
            {
                title: "Featured Project",
                subtitle: "A short description goes here.",
                tag: "Case Study",
                ctaLabel: "View",
                link: "",
            },
            {
                title: "Second Highlight",
                subtitle: "Another example item.",
                tag: "New",
                ctaLabel: "Open",
                link: "",
            },
            {
                title: "Third Item",
                subtitle: "Perfect for portfolios and products.",
                tag: "",
                ctaLabel: "Explore",
                link: "",
            },
        ],
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 320,
        min: 180,
        max: 520,
        step: 1,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 320,
        min: 160,
        max: 520,
        step: 1,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },

    responsiveSizing: {
        type: ControlType.Boolean,
        title: "Responsive Sizing",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Breakpoint",
        defaultValue: 980,
        min: 480,
        max: 1400,
        step: 1,
        unit: "px",
        hidden: ({ responsiveSizing }) => !responsiveSizing,
    },
    tabletCardWidth: {
        type: ControlType.Number,
        title: "Tablet Width",
        defaultValue: 280,
        min: 160,
        max: 520,
        step: 1,
        unit: "px",
        hidden: ({ responsiveSizing }) => !responsiveSizing,
    },
    tabletCardHeight: {
        type: ControlType.Number,
        title: "Tablet Height",
        defaultValue: 280,
        min: 160,
        max: 520,
        step: 1,
        unit: "px",
        hidden: ({ responsiveSizing }) => !responsiveSizing,
    },
    tabletSpacing: {
        type: ControlType.Number,
        title: "Tablet Gap",
        defaultValue: 18,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ responsiveSizing }) => !responsiveSizing,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 640,
        min: 320,
        max: 1024,
        step: 1,
        unit: "px",
        hidden: ({ responsiveSizing }) => !responsiveSizing,
    },
    mobileCardWidth: {
        type: ControlType.Number,
        title: "Mobile Width",
        defaultValue: 240,
        min: 140,
        max: 520,
        step: 1,
        unit: "px",
        hidden: ({ responsiveSizing }) => !responsiveSizing,
    },
    mobileCardHeight: {
        type: ControlType.Number,
        title: "Mobile Height",
        defaultValue: 240,
        min: 140,
        max: 520,
        step: 1,
        unit: "px",
        hidden: ({ responsiveSizing }) => !responsiveSizing,
    },
    mobileSpacing: {
        type: ControlType.Number,
        title: "Mobile Gap",
        defaultValue: 14,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ responsiveSizing }) => !responsiveSizing,
    },

    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Border Radius",
        defaultValue: "16px",
    },
    elevation: {
        type: ControlType.Number,
        title: "Lift Height",
        defaultValue: 22,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Scale",
        defaultValue: 0.92,
        min: 0.7,
        max: 1,
        step: 0.01,
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        defaultValue: 0.62,
        min: 0.1,
        max: 1,
        step: 0.01,
    },

    tagTitleGap: {
        type: ControlType.Number,
        title: "Tag → Title Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    titleSubtitleGap: {
        type: ControlType.Number,
        title: "Title → Subtitle Gap",
        defaultValue: 4,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    buttonTopGap: {
        type: ControlType.Number,
        title: "Text → Button Gap",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },

    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    cardBackgroundColor: { type: ControlType.Color, title: "Card Background", defaultValue: "#FFFFFF" },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#000000" },
    subtitleColor: { type: ControlType.Color, title: "Subtitle Color", defaultValue: "#CCCCCC" },
    tagBackgroundColor: { type: ControlType.Color, title: "Tag Background", defaultValue: "#F5F5F5" },
    tagTextColor: { type: ControlType.Color, title: "Tag Text", defaultValue: "#000000" },
    buttonBackgroundColor: { type: ControlType.Color, title: "Button Background", defaultValue: "#000000" },
    buttonTextColor: { type: ControlType.Color, title: "Button Text", defaultValue: "#FFFFFF" },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
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
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },

    spring: {
        type: ControlType.Transition,
        title: "Spring Animation",
        defaultValue: {
            type: "spring",
            stiffness: 340,
            damping: 32,
            mass: 0.9,
        },
    },

    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowsVisibility: {
        type: ControlType.Enum,
        title: "Arrows Visibility",
        options: ["mobile", "always"],
        optionTitles: ["Mobile Only", "Always"],
        defaultValue: "mobile",
        displaySegmentedControl: true,
        hidden: ({ showArrows }) => !showArrows,
    },

    enableDragScroll: {
        type: ControlType.Boolean,
        title: "Drag to Scroll",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableWheelScroll: {
        type: ControlType.Boolean,
        title: "Wheel Scroll",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    showDots: {
        type: ControlType.Boolean,
        title: "Show Pagination",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dotsColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "rgba(0,0,0,0.25)",
        hidden: ({ showDots }) => !showDots,
    },
    dotsActiveColor: {
        type: ControlType.Color,
        title: "Active Dot Color",
        defaultValue: "#000000",
        hidden: ({ showDots }) => !showDots,
    },
    dotsSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 7,
        min: 4,
        max: 16,
        step: 1,
        unit: "px",
        hidden: ({ showDots }) => !showDots,
    },
    dotsGap: {
        type: ControlType.Number,
        title: "Dot Gap",
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        hidden: ({ showDots }) => !showDots,
    },
    dotsBottomOffset: {
        type: ControlType.Number,
        title: "Dots Bottom Offset",
        defaultValue: 14,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ showDots }) => !showDots,
    },
})
