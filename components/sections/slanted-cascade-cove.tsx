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

import { motion, useReducedMotion, AnimatePresence } from "framer-motion"

// Made with 💛 by Karim Saif

type Artwork = {
    image?: string
    title?: string
    subtitle?: string
    description?: string
    link?: string
}

interface Props {
    artworks: Artwork[]
    heading: string
    description: string
    initialIndex: number
    cardWidth: number
    cardHeight: number
    cascadeX: number
    cascadeY: number
    depthScale: number
    visibleCards: number
    entranceX: number
    entranceY: number
    entranceScale: number
    cardRotation: number
    duration: number
    easing: string
    autoplay: boolean
    autoplayDelay: number
    pauseOnHover: boolean
    pauseOffscreen: boolean
    infinite: boolean
    enableSwipe: boolean
    swipeThreshold: number
    enableKeyboard: boolean
    enableWheel: boolean
    clickableCards: boolean
    cursorParallax: boolean
    parallaxStrength: number
    backgroundColor: string
    textColor: string
    secondaryColor: string
    accentColor: string
    cardRadius: number
    cardShadow: boolean
    shadowStrength: number
    rearOpacity: number
    columnGap: number
    contentWidth: number
    mobileBreakpoint: number
    headingSize: number
    headingLineHeight: number
    headingLetterSpacing: number
    descriptionSize: number
    projectTitleSize: number
    subtitleSize: number
    headingFont: any
    bodyFont: any
    projectFont: any
    showArrows: boolean
    showPagination: boolean
    showProgress: boolean
    showCounter: boolean
    showProjectDescription: boolean
    style?: React.CSSProperties
}

const defaultArtworks: Artwork[] = [
    {
        image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1000&q=85",
        title: "Deep Facet",
        subtitle: "01 — Abstract Art",
        description: "Exploring form, depth, and visual expression.",
    },
    {
        image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&q=85",
        title: "Night Silk",
        subtitle: "02 — Digital Art",
        description: "A visual study of texture and atmosphere.",
    },
    {
        image: "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=1000&q=85",
        title: "Prism Loop",
        subtitle: "03 — Visual Identity",
        description: "An experimental exploration of color and rhythm.",
    },
    {
        image: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1000&q=85",
        title: "Green Knot",
        subtitle: "04 — Creative Direction",
        description: "Organic structures and unexpected visual connections.",
    },
    {
        image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1000&q=85",
        title: "Light Rail",
        subtitle: "05 — Motion Design",
        description: "Movement, light, and contemporary composition.",
    },
]

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

const wrap = (v: number, n: number) => ((v % n) + n) % n

const easeMap: Record<string, number[]> = {
    smooth: [0.22, 1, 0.36, 1],
    cinematic: [0.76, 0, 0.24, 1],
    gentle: [0.25, 0.1, 0.25, 1],
    sharp: [0.7, 0, 0.2, 1],
}

function ArrowIcon({ right = false }: { right?: boolean }) {
    return (
        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {right ? (
                <path d="M4 12h16m-7-7 7 7-7 7" />
            ) : (
                <path d="M20 12H4m7-7-7 7 7 7" />
            )}
        </svg>
    )
}

function useMeasuredWidth(ref: React.RefObject<HTMLDivElement>) {
    const [width, setWidth] = React.useState(0)

    React.useEffect(() => {
        const element = ref.current
        if (!element) return

        const measure = () => {
            const rect = element.getBoundingClientRect()
            setWidth(rect.width)
        }

        measure()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }

        const observer = new ResizeObserver(measure)
        observer.observe(element)

        return () => observer.disconnect()
    }, [ref])

    return width
}

function ArtworkImage({
    image,
    title,
    eager,
}: {
    image?: string
    title?: string
    eager?: boolean
}) {
    const [failed, setFailed] = React.useState(false)

    React.useEffect(() => {
        setFailed(false)
    }, [image])

    if (!image || failed) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background:
                        "linear-gradient(145deg,#D6D1CA 0%,#A9A5A0 50%,#777B82 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                    boxSizing: "border-box",
                    color: "#FFFFFF",
                    fontSize: 17,
                    fontWeight: 600,
                    textAlign: "center",
                }}
            >
                {title || "Artwork"}
            </div>
        )
    }

    return (
        <img
            src={image}
            alt={title || "Gallery artwork"}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                pointerEvents: "none",
                userSelect: "none",
            }}
        />
    )
}

export default function SlantedCascadeCoverFlow(props: Props) {
    const {
        artworks,
        heading,
        description,
        initialIndex,
        cardWidth,
        cardHeight,
        cascadeX,
        cascadeY,
        depthScale,
        visibleCards,
        entranceX,
        entranceY,
        entranceScale,
        cardRotation,
        duration,
        easing,
        autoplay,
        autoplayDelay,
        pauseOnHover,
        pauseOffscreen,
        infinite,
        enableSwipe,
        swipeThreshold,
        enableKeyboard,
        enableWheel,
        clickableCards,
        cursorParallax,
        parallaxStrength,
        backgroundColor,
        textColor,
        secondaryColor,
        accentColor,
        cardRadius,
        cardShadow,
        shadowStrength,
        rearOpacity,
        columnGap,
        contentWidth,
        mobileBreakpoint,
        headingSize,
        headingLineHeight,
        headingLetterSpacing,
        descriptionSize,
        projectTitleSize,
        subtitleSize,
        headingFont,
        bodyFont,
        projectFont,
        showArrows,
        showPagination,
        showProgress,
        showCounter,
        showProjectDescription,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const reduceMotion = isStatic || !!prefersReducedMotion

    const items = artworks && artworks.length > 0 ? artworks : defaultArtworks

    const count = items.length

    const rootRef = React.useRef<HTMLDivElement>(null)
    const galleryRef = React.useRef<HTMLDivElement>(null)

    const rootWidth = useMeasuredWidth(rootRef)

    const [position, setPosition] = React.useState(() =>
        clamp(Math.round(initialIndex), 0, count - 1)
    )

    const positionRef = React.useRef(position)
    const [hovered, setHovered] = React.useState(false)
    const [inView, setInView] = React.useState(true)
    const [pageVisible, setPageVisible] = React.useState(true)
    const [parallax, setParallax] = React.useState({
        x: 0,
        y: 0,
    })

    const gestureRef = React.useRef<{
        x: number
        y: number
    } | null>(null)

    const suppressClickRef = React.useRef(false)
    const wheelTimeRef = React.useRef(0)
    const lastDirectionRef = React.useRef(1)
    const lastIndexRef = React.useRef(0)

    const index = wrap(position, count)
    const activeArtwork = items[index]

    React.useEffect(() => {
        positionRef.current = position
    }, [position])

    React.useEffect(() => {
        const next = clamp(Math.round(initialIndex || 0), 0, count - 1)

        positionRef.current = next
        setPosition(next)
    }, [initialIndex, count])

    React.useEffect(() => {
        if (isStatic || !pauseOffscreen) {
            setInView(true)
            return
        }

        const element = rootRef.current
        if (!element) return

        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setInView(entry.isIntersecting)
            },
            { threshold: 0.05 }
        )

        observer.observe(element)

        return () => observer.disconnect()
    }, [isStatic, pauseOffscreen])

    React.useEffect(() => {
        if (isStatic) return

        const update = () => {
            setPageVisible(!document.hidden)
        }

        document.addEventListener("visibilitychange", update)
        update()

        return () => {
            document.removeEventListener("visibilitychange", update)
        }
    }, [isStatic])

    const navigate = React.useCallback(
        (direction: number) => {
            if (count <= 1) return

            const current = positionRef.current
            const currentIndex = wrap(current, count)

            if (!infinite) {
                const nextIndex = clamp(currentIndex + direction, 0, count - 1)

                if (nextIndex === currentIndex) return

                lastDirectionRef.current = direction
                lastIndexRef.current = currentIndex

                positionRef.current = nextIndex
                setPosition(nextIndex)
                return
            }

            const next = current + direction

            lastDirectionRef.current = direction
            lastIndexRef.current = currentIndex

            positionRef.current = next
            setPosition(next)
        },
        [count, infinite]
    )

    const goTo = React.useCallback(
        (target: number) => {
            if (count <= 1) return

            const current = positionRef.current
            const currentIndex = wrap(current, count)
            const destination = clamp(target, 0, count - 1)

            if (destination === currentIndex) return

            if (!infinite) {
                positionRef.current = destination
                setPosition(destination)
                return
            }

            const forward = wrap(destination - currentIndex, count)
            const backward = forward - count

            const delta =
                Math.abs(forward) <= Math.abs(backward) ? forward : backward

            lastDirectionRef.current = Math.sign(delta) || 1
            lastIndexRef.current = currentIndex

            positionRef.current = current + delta
            setPosition(current + delta)
        },
        [count, infinite]
    )

    React.useEffect(() => {
        if (
            !autoplay ||
            reduceMotion ||
            count <= 1 ||
            !pageVisible ||
            (pauseOffscreen && !inView) ||
            (pauseOnHover && hovered) ||
            (!infinite && index === count - 1)
        ) {
            return
        }

        const timer = window.setInterval(
            () => navigate(1),
            Math.max(1000, autoplayDelay * 1000)
        )

        return () => window.clearInterval(timer)
    }, [
        autoplay,
        reduceMotion,
        count,
        pageVisible,
        pauseOffscreen,
        inView,
        pauseOnHover,
        hovered,
        autoplayDelay,
        navigate,
        infinite,
        index,
    ])

    const mobile = rootWidth > 0 && rootWidth < mobileBreakpoint

    const width = rootWidth || 1100

    const padding = mobile ? 18 : 36

    const availableGalleryWidth = mobile
        ? Math.max(200, width - padding * 2)
        : Math.max(200, (width - padding * 2 - columnGap) * 0.56)

    const visible = Math.min(count, Math.max(1, Math.round(visibleCards)))

    const depthCount = Math.max(0, visible - 1)

    const totalDesignWidth = cardWidth + depthCount * cascadeX

    const responsiveScale = Math.min(
        1,
        availableGalleryWidth / Math.max(1, totalDesignWidth)
    )

    const cw = cardWidth * responsiveScale
    const ch = cardHeight * responsiveScale
    const dx = cascadeX * responsiveScale
    const dy = cascadeY * responsiveScale

    const galleryWidth = cw + depthCount * dx
    const galleryHeight = ch + depthCount * dy + 20 * responsiveScale

    const transition = reduceMotion
        ? { duration: 0 }
        : {
              type: "tween" as const,
              duration,
              ease: easeMap[easing] || easeMap.smooth,
          }

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!enableSwipe || count <= 1) return

        if ((event.target as HTMLElement).closest("button,a")) {
            return
        }

        gestureRef.current = {
            x: event.clientX,
            y: event.clientY,
        }

        suppressClickRef.current = false
    }

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const start = gestureRef.current
        gestureRef.current = null

        if (!enableSwipe || !start) return

        const horizontal = event.clientX - start.x
        const vertical = event.clientY - start.y

        if (
            Math.abs(horizontal) < swipeThreshold ||
            Math.abs(horizontal) <= Math.abs(vertical) * 1.2
        ) {
            return
        }

        suppressClickRef.current = true
        navigate(horizontal < 0 ? 1 : -1)
    }

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        if (!enableWheel || count <= 1) return

        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.2) {
            return
        }

        const now = Date.now()

        if (now - wheelTimeRef.current < 450) return

        wheelTimeRef.current = now
        navigate(event.deltaX > 0 ? 1 : -1)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!enableKeyboard) return

        if (event.key === "ArrowRight") {
            event.preventDefault()
            navigate(1)
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault()
            navigate(-1)
        }
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!cursorParallax || reduceMotion || event.pointerType === "touch") {
            return
        }

        const rect = event.currentTarget.getBoundingClientRect()

        const x = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5

        const y = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5

        setParallax({
            x: x * parallaxStrength,
            y: y * parallaxStrength,
        })
    }

    const buttonStyle: React.CSSProperties = {
        width: 42,
        height: 42,
        borderRadius: "50%",
        border: `1px solid ${secondaryColor}35`,
        background: "transparent",
        color: textColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
    }

    const renderedCards: React.ReactNode[] = []

    const before = 2
    const after = visible + 1

    for (
        let absolute = position - before;
        absolute <= position + after;
        absolute++
    ) {
        if (!infinite && (absolute < 0 || absolute >= count)) {
            continue
        }

        const artworkIndex = wrap(absolute, count)
        const artwork = items[artworkIndex]

        const depth = absolute - position

        const entering = depth < 0
        const exiting = depth >= visible

        const scale =
            depth < 0
                ? entranceScale
                : Math.max(0.3, 1 - Math.max(0, depth) * depthScale)

        const x =
            depth < 0 ? entranceX * responsiveScale + depth * dx : depth * dx

        const y =
            depth < 0 ? entranceY * responsiveScale + depth * dy : depth * dy

        const opacity =
            entering || exiting ? 0 : Math.max(rearOpacity, 1 - depth * 0.07)

        const rotation =
            depth < 0
                ? cardRotation
                : cardRotation * Math.min(depth, visible) * 0.15

        const zIndex = entering ? 200 : Math.max(1, 100 - depth)

        renderedCards.push(
            <motion.div
                key={`artwork-${absolute}`}
                initial={
                    reduceMotion
                        ? false
                        : {
                              x:
                                  x -
                                  (lastDirectionRef.current > 0
                                      ? dx * 0.5
                                      : -dx * 0.5),
                              y,
                              scale,
                              opacity: 0,
                              rotate: rotation,
                          }
                }
                animate={{
                    x:
                        x +
                        (cursorParallax && !reduceMotion
                            ? parallax.x * (1 + depth * 0.15)
                            : 0),
                    y:
                        y +
                        (cursorParallax && !reduceMotion
                            ? parallax.y * (1 + depth * 0.15)
                            : 0),
                    scale,
                    opacity,
                    rotate: rotation,
                }}
                exit={{
                    opacity: 0,
                    x: x + (lastDirectionRef.current > 0 ? dx * 2 : -dx * 2),
                    scale: scale * 0.9,
                    transition: {
                        duration: reduceMotion ? 0 : duration * 0.6,
                    },
                }}
                transition={transition}
                aria-hidden={entering || exiting}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cw,
                    height: ch,
                    borderRadius: cardRadius,
                    overflow: "hidden",
                    background: "#E5E5E5",
                    transformOrigin: "top left",
                    zIndex,
                    boxShadow: cardShadow
                        ? `0 ${8 + depth * 2}px ${
                              18 + shadowStrength * 3
                          }px rgba(0,0,0,${0.06 + shadowStrength * 0.008})`
                        : "none",
                    cursor:
                        clickableCards && depth >= 0 && depth < visible
                            ? "pointer"
                            : "default",
                    pointerEvents:
                        depth >= 0 && depth < visible ? "auto" : "none",
                    backfaceVisibility: "hidden",
                    willChange: reduceMotion ? "auto" : "transform, opacity",
                }}
                onClick={() => {
                    if (!clickableCards) return

                    if (suppressClickRef.current) {
                        suppressClickRef.current = false
                        return
                    }

                    if (depth > 0 && depth < visible) {
                        goTo(artworkIndex)
                    } else if (depth === 0 && artwork.link) {
                        window.open(
                            artwork.link,
                            "_blank",
                            "noopener,noreferrer"
                        )
                    }
                }}
            >
                <ArtworkImage
                    image={artwork.image}
                    title={artwork.title}
                    eager={depth === 0}
                />
            </motion.div>
        )
    }

    return (
        <div
            ref={rootRef}
            tabIndex={enableKeyboard ? 0 : undefined}
            role="region"
            aria-roledescription="carousel"
            aria-label={heading || "Artwork gallery"}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
                gestureRef.current = null
            }}
            onWheel={handleWheel}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
                setParallax({ x: 0, y: 0 })
            }}
            style={{
                width: "100%",
                height: "100%",
                minHeight: mobile ? 620 : 470,
                boxSizing: "border-box",
                padding: mobile ? "24px 18px" : "32px 36px",
                background: backgroundColor,
                color: textColor,
                display: "flex",
                flexDirection: mobile ? "column" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: mobile ? 28 : columnGap,
                overflow: "hidden",
                position: "relative",
                touchAction: "pan-y",
                outlineOffset: -3,
                fontFamily: "Inter, Arial, sans-serif",
                ...style,
            }}
        >
            <div
                ref={galleryRef}
                onPointerMove={handlePointerMove}
                style={{
                    position: "relative",
                    width: mobile ? "100%" : "56%",
                    height: galleryHeight,
                    minHeight: galleryHeight,
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    userSelect: "none",
                }}
            >
                <div
                    style={{
                        width: galleryWidth,
                        height: galleryHeight,
                        position: "relative",
                        flexShrink: 0,
                    }}
                >
                    <AnimatePresence initial={false}>
                        {renderedCards}
                    </AnimatePresence>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    width: mobile ? "100%" : "auto",
                    maxWidth: mobile ? "100%" : contentWidth,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    gap: mobile ? 24 : 34,
                    position: "relative",
                    zIndex: 2,
                }}
            >
                <div style={{ width: "100%" }}>
                    <h2
                        style={{
                            ...headingFont,
                            margin: 0,
                            color: textColor,
                            fontSize: mobile
                                ? Math.min(headingSize, 40)
                                : headingSize,
                            lineHeight: headingLineHeight,
                            letterSpacing: headingLetterSpacing,
                            fontWeight: headingFont?.fontWeight || 700,
                            whiteSpace: "pre-line",
                            overflowWrap: "break-word",
                        }}
                    >
                        {heading}
                    </h2>

                    <p
                        style={{
                            ...bodyFont,
                            margin: "18px 0 0",
                            color: secondaryColor,
                            fontSize: descriptionSize,
                            lineHeight: 1.7,
                            maxWidth: 430,
                        }}
                    >
                        {description}
                    </p>
                </div>

                <div
                    style={{
                        width: "100%",
                        minHeight: 100,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={index}
                            initial={
                                reduceMotion
                                    ? false
                                    : {
                                          opacity: 0,
                                          y: 12,
                                      }
                            }
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                y: reduceMotion ? 0 : -8,
                            }}
                            transition={{
                                duration: reduceMotion
                                    ? 0
                                    : Math.min(duration * 0.5, 0.35),
                                ease: "easeOut",
                            }}
                        >
                            <div
                                style={{
                                    ...bodyFont,
                                    fontSize: subtitleSize,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: secondaryColor,
                                    marginBottom: 10,
                                }}
                            >
                                {activeArtwork.subtitle}
                            </div>

                            <h3
                                style={{
                                    ...projectFont,
                                    margin: 0,
                                    color: textColor,
                                    fontSize: projectTitleSize,
                                    fontWeight: projectFont?.fontWeight || 600,
                                    lineHeight: 1.2,
                                    overflowWrap: "break-word",
                                }}
                            >
                                {activeArtwork.title || "Untitled Artwork"}
                            </h3>

                            {showProjectDescription &&
                                activeArtwork.description && (
                                    <p
                                        style={{
                                            ...bodyFont,
                                            margin: "10px 0 0",
                                            fontSize: descriptionSize,
                                            lineHeight: 1.6,
                                            color: secondaryColor,
                                        }}
                                    >
                                        {activeArtwork.description}
                                    </p>
                                )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        {showArrows && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                }}
                            >
                                <button
                                    type="button"
                                    aria-label="Previous artwork"
                                    onClick={() => navigate(-1)}
                                    disabled={
                                        count <= 1 || (!infinite && index === 0)
                                    }
                                    style={{
                                        ...buttonStyle,
                                        opacity:
                                            count <= 1 ||
                                            (!infinite && index === 0)
                                                ? 0.35
                                                : 1,
                                    }}
                                >
                                    <ArrowIcon />
                                </button>

                                <button
                                    type="button"
                                    aria-label="Next artwork"
                                    onClick={() => navigate(1)}
                                    disabled={
                                        count <= 1 ||
                                        (!infinite && index === count - 1)
                                    }
                                    style={{
                                        ...buttonStyle,
                                        opacity:
                                            count <= 1 ||
                                            (!infinite && index === count - 1)
                                                ? 0.35
                                                : 1,
                                    }}
                                >
                                    <ArrowIcon right />
                                </button>
                            </div>
                        )}

                        {showCounter && (
                            <div
                                style={{
                                    ...bodyFont,
                                    fontSize: 12,
                                    color: secondaryColor,
                                    letterSpacing: "0.1em",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {String(index + 1).padStart(2, "0")}
                                {" / "}
                                {String(count).padStart(2, "0")}
                            </div>
                        )}
                    </div>

                    {showPagination && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`Go to artwork ${i + 1}`}
                                    aria-current={
                                        index === i ? "true" : undefined
                                    }
                                    onClick={() => goTo(i)}
                                    style={{
                                        width: index === i ? 24 : 6,
                                        height: 6,
                                        padding: 0,
                                        border: "none",
                                        borderRadius: 20,
                                        background:
                                            index === i
                                                ? accentColor
                                                : `${secondaryColor}65`,
                                        cursor: "pointer",
                                        transition: reduceMotion
                                            ? "none"
                                            : "width 250ms ease",
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {showProgress && (
                        <div
                            style={{
                                width: "100%",
                                height: 1,
                                background: `${secondaryColor}35`,
                                overflow: "hidden",
                            }}
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    width: `${((index + 1) / count) * 100}%`,
                                }}
                                transition={transition}
                                style={{
                                    height: "100%",
                                    background: accentColor,
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

SlantedCascadeCoverFlow.displayName = "Karim Saif — Slanted Cascade Cover Flow"

SlantedCascadeCoverFlow.defaultProps = {
    artworks: defaultArtworks,
    heading: "Slanted Cascade\nCover Flow",
    description:
        "A collection of experimental visual stories exploring art, movement, and perspective.",
    initialIndex: 0,
    cardWidth: 270,
    cardHeight: 365,
    cascadeX: 38,
    cascadeY: 24,
    depthScale: 0.085,
    visibleCards: 5,
    entranceX: -130,
    entranceY: -45,
    entranceScale: 1.12,
    cardRotation: 0,
    duration: 0.8,
    easing: "cinematic",
    autoplay: false,
    autoplayDelay: 4,
    pauseOnHover: true,
    pauseOffscreen: true,
    infinite: true,
    enableSwipe: true,
    swipeThreshold: 45,
    enableKeyboard: true,
    enableWheel: false,
    clickableCards: true,
    cursorParallax: false,
    parallaxStrength: 8,
    backgroundColor: "#FFFFFF",
    textColor: "#111111",
    secondaryColor: "#777777",
    accentColor: "#111111",
    cardRadius: 4,
    cardShadow: true,
    shadowStrength: 5,
    rearOpacity: 0.7,
    columnGap: 50,
    contentWidth: 440,
    mobileBreakpoint: 720,
    headingSize: 52,
    headingLineHeight: 1.05,
    headingLetterSpacing: -1.7,
    descriptionSize: 14,
    projectTitleSize: 28,
    subtitleSize: 11,
    showArrows: true,
    showPagination: true,
    showProgress: true,
    showCounter: true,
    showProjectDescription: true,
}

addPropertyControls(SlantedCascadeCoverFlow, {
    artworks: {
        type: ControlType.Array,
        title: "Artworks",
        description:
            "Add, remove, and reorder artwork projects in the cascading gallery.",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    description:
                        "Artwork image displayed on the corresponding gallery card.",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    description:
                        "Name of the artwork displayed when this project is active.",
                    defaultValue: "New Artwork",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    description:
                        "Small category or identifier displayed above the project title.",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    description:
                        "Supporting text displayed for the active artwork.",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description:
                        "Optional destination opened when the active artwork is clicked.",
                },
            },
        },
        defaultValue: defaultArtworks,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        description:
            "Main editorial headline displayed beside the cascading artwork.",
        defaultValue: "Slanted Cascade\nCover Flow",
        displayTextArea: true,
    },
    description: {
        type: ControlType.String,
        title: "Intro Text",
        description:
            "Supporting paragraph displayed beneath the main headline.",
        defaultValue:
            "A collection of experimental visual stories exploring art, movement, and perspective.",
        displayTextArea: true,
    },
    initialIndex: {
        type: ControlType.Number,
        title: "Start Index",
        description:
            "Zero-based index of the artwork selected when the component loads.",
        defaultValue: 0,
        min: 0,
        max: 29,
        step: 1,
        displayStepper: true,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        description: "Base width of artwork cards before responsive scaling.",
        defaultValue: 270,
        min: 100,
        max: 650,
        step: 5,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        description: "Base height of artwork cards before responsive scaling.",
        defaultValue: 365,
        min: 120,
        max: 850,
        step: 5,
        unit: "px",
    },
    cascadeX: {
        type: ControlType.Number,
        title: "Cascade X",
        description:
            "Horizontal distance between consecutive artwork depth positions.",
        defaultValue: 38,
        min: 0,
        max: 180,
        step: 1,
        unit: "px",
    },
    cascadeY: {
        type: ControlType.Number,
        title: "Cascade Y",
        description:
            "Vertical distance between consecutive artwork depth positions.",
        defaultValue: 24,
        min: 0,
        max: 180,
        step: 1,
        unit: "px",
    },
    depthScale: {
        type: ControlType.Number,
        title: "Depth Scale",
        description: "Amount by which each deeper artwork decreases in size.",
        defaultValue: 0.085,
        min: 0,
        max: 0.25,
        step: 0.005,
    },
    visibleCards: {
        type: ControlType.Number,
        title: "Visible Cards",
        description:
            "Maximum number of artworks visible in the diagonal cascade.",
        defaultValue: 5,
        min: 1,
        max: 15,
        step: 1,
        displayStepper: true,
    },
    entranceX: {
        type: ControlType.Number,
        title: "Entrance X",
        description:
            "Horizontal position of the incoming artwork before it enters the front of the stack.",
        defaultValue: -130,
        min: -500,
        max: 500,
        unit: "px",
    },
    entranceY: {
        type: ControlType.Number,
        title: "Entrance Y",
        description:
            "Vertical position of the incoming artwork before it enters the front of the stack.",
        defaultValue: -45,
        min: -400,
        max: 400,
        unit: "px",
    },
    entranceScale: {
        type: ControlType.Number,
        title: "Entrance Scale",
        description:
            "Relative size of artwork immediately before entering the active position.",
        defaultValue: 1.12,
        min: 0.5,
        max: 1.8,
        step: 0.01,
    },
    cardRotation: {
        type: ControlType.Number,
        title: "Card Rotation",
        description: "Rotation applied to incoming and deeper artwork cards.",
        defaultValue: 0,
        min: -30,
        max: 30,
        step: 1,
        unit: "deg",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        description: "Duration of each artwork transition in seconds.",
        defaultValue: 0.8,
        min: 0.1,
        max: 2.5,
        step: 0.05,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        description:
            "Animation easing curve used when artwork moves through the cascade.",
        options: ["smooth", "cinematic", "gentle", "sharp"],
        optionTitles: ["Smooth", "Cinematic", "Gentle", "Sharp"],
        defaultValue: "cinematic",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        description: "Automatically advance the artwork gallery.",
        defaultValue: false,
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Auto Delay",
        description: "Seconds between automatic artwork changes.",
        defaultValue: 4,
        min: 1,
        max: 30,
        step: 0.5,
        unit: "s",
        hidden: (p) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        description:
            "Pause automatic navigation while the pointer is over the component.",
        defaultValue: true,
        hidden: (p) => !p.autoplay,
    },
    pauseOffscreen: {
        type: ControlType.Boolean,
        title: "Pause Offscreen",
        description:
            "Pause autoplay while the component is outside the viewport.",
        defaultValue: true,
    },
    infinite: {
        type: ControlType.Boolean,
        title: "Infinite",
        description:
            "Allow the gallery to wrap continuously between the first and last artworks.",
        defaultValue: true,
    },
    enableSwipe: {
        type: ControlType.Boolean,
        title: "Swipe",
        description:
            "Enable horizontal mouse and touch gestures for navigation.",
        defaultValue: true,
    },
    swipeThreshold: {
        type: ControlType.Number,
        title: "Swipe Distance",
        description:
            "Minimum horizontal gesture distance required to navigate.",
        defaultValue: 45,
        min: 10,
        max: 150,
        unit: "px",
        hidden: (p) => !p.enableSwipe,
    },
    enableKeyboard: {
        type: ControlType.Boolean,
        title: "Keyboard",
        description:
            "Allow left and right arrow keys to navigate when the gallery has focus.",
        defaultValue: true,
    },
    enableWheel: {
        type: ControlType.Boolean,
        title: "Trackpad",
        description:
            "Allow horizontal trackpad wheel gestures to navigate artworks.",
        defaultValue: false,
    },
    clickableCards: {
        type: ControlType.Boolean,
        title: "Card Click",
        description:
            "Allow visible cards to be selected and active artwork links to open.",
        defaultValue: true,
    },
    cursorParallax: {
        type: ControlType.Boolean,
        title: "Cursor Parallax",
        description:
            "Enable subtle depth movement in response to pointer position.",
        defaultValue: false,
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax Amount",
        description: "Intensity of the cursor-based artwork movement.",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        hidden: (p) => !p.cursorParallax,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color of the complete gallery section.",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Color of the main heading and active artwork title.",
        defaultValue: "#111111",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        description:
            "Color of descriptions, subtitles, and inactive navigation details.",
        defaultValue: "#777777",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        description:
            "Color of the active pagination indicator and progress line.",
        defaultValue: "#111111",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        description: "Corner radius of each artwork card.",
        defaultValue: 4,
        min: 0,
        max: 60,
        unit: "px",
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Card Shadow",
        description:
            "Enable shadows to create separation between overlapping artwork cards.",
        defaultValue: true,
    },
    shadowStrength: {
        type: ControlType.Number,
        title: "Shadow Amount",
        description: "Controls the intensity and softness of artwork shadows.",
        defaultValue: 5,
        min: 0,
        max: 20,
        hidden: (p) => !p.cardShadow,
    },
    rearOpacity: {
        type: ControlType.Number,
        title: "Rear Opacity",
        description: "Minimum opacity of deeper artwork cards.",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
    },
    columnGap: {
        type: ControlType.Number,
        title: "Column Gap",
        description:
            "Spacing between the cascading gallery and editorial content.",
        defaultValue: 50,
        min: 0,
        max: 200,
        unit: "px",
    },
    contentWidth: {
        type: ControlType.Number,
        title: "Content Width",
        description: "Maximum width of the text and navigation column.",
        defaultValue: 440,
        min: 200,
        max: 900,
        unit: "px",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        description:
            "Component width below which artwork and text stack vertically.",
        defaultValue: 720,
        min: 400,
        max: 1200,
        unit: "px",
    },
    headingSize: {
        type: ControlType.Number,
        title: "Heading Size",
        description: "Desktop font size of the main editorial heading.",
        defaultValue: 52,
        min: 16,
        max: 120,
        unit: "px",
    },
    headingLineHeight: {
        type: ControlType.Number,
        title: "Heading Line",
        description: "Line-height multiplier for the main editorial heading.",
        defaultValue: 1.05,
        min: 0.8,
        max: 2,
        step: 0.05,
    },
    headingLetterSpacing: {
        type: ControlType.Number,
        title: "Heading Tracking",
        description: "Letter spacing of the main heading in pixels.",
        defaultValue: -1.7,
        min: -8,
        max: 12,
        step: 0.1,
        unit: "px",
    },
    descriptionSize: {
        type: ControlType.Number,
        title: "Body Size",
        description: "Font size of the introductory and project descriptions.",
        defaultValue: 14,
        min: 10,
        max: 30,
        unit: "px",
    },
    projectTitleSize: {
        type: ControlType.Number,
        title: "Project Size",
        description: "Font size of the selected artwork title.",
        defaultValue: 28,
        min: 12,
        max: 70,
        unit: "px",
    },
    subtitleSize: {
        type: ControlType.Number,
        title: "Subtitle Size",
        description: "Font size of project category labels.",
        defaultValue: 11,
        min: 8,
        max: 28,
        unit: "px",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        description: "Font family, weight, and styling for the main heading.",
        controls: "extended",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        description:
            "Font family, weight, and styling for descriptions and subtitles.",
        controls: "extended",
    },
    projectFont: {
        type: ControlType.Font,
        title: "Project Font",
        description:
            "Font family, weight, and styling for active artwork titles.",
        controls: "extended",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        description: "Display previous and next navigation buttons.",
        defaultValue: true,
    },
    showPagination: {
        type: ControlType.Boolean,
        title: "Pagination",
        description:
            "Display interactive pagination indicators for every artwork.",
        defaultValue: true,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress Line",
        description:
            "Display a thin progress line reflecting the selected artwork.",
        defaultValue: true,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Slide Counter",
        description:
            "Display the selected artwork number and total artwork count.",
        defaultValue: true,
    },
    showProjectDescription: {
        type: ControlType.Boolean,
        title: "Project Details",
        description:
            "Made with 💛 by [@karimsaif](https://x.com/karimsaif0) · Built with [Framer](https://framer.link/karimsaif0)",
        defaultValue: true,
    },
})
