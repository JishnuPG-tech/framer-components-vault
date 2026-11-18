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


interface FramerImage {
    src?: string
    srcSet?: string
    alt?: string
    positionX?: string
    positionY?: string
}

interface MetaItem {
    label: string
    value: string
}

interface CoverflowSlide {
    image?: FramerImage | string
    alt?: string
    title?: string
    subtitle?: string
    meta?: MetaItem[]
}

interface CoverflowCarouselProps {
    slides?: CoverflowSlide[]
    rotate?: number
    depth?: number
    perspective?: number
    falloff?: number
    fade?: number
    cardWidth?: string
    gap?: number
    radius?: number
    loop?: boolean
    showCaption?: boolean
    showPagination?: boolean
    showNavigation?: boolean
    label?: string
    font?: React.CSSProperties
    captionFont?: React.CSSProperties
    textColor?: string
    mutedColor?: string
    cardColor?: string
    controlColor?: string
    controlIconColor?: string
    ringColor?: string
    style?: React.CSSProperties
}

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&h=900&fit=crop&q=80&auto=format"

const DEFAULT_SLIDES: CoverflowSlide[] = [
    {
        image: FALLBACK_IMAGE,
        alt: "Fog rolling through a forested valley",
        title: "Low Country",
        subtitle: "Long Player",
        meta: [
            { label: "Year", value: "2017" },
            { label: "Producer", value: "Sim Oyo" },
            { label: "Length", value: "5:20" },
        ],
    },
    {
        image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&h=900&fit=crop&q=80&auto=format",
        alt: "Sunlit dune ridge",
        title: "Dry Season",
        subtitle: "EP",
        meta: [
            { label: "Year", value: "2016" },
            { label: "Producer", value: "Juno Vale" },
            { label: "Length", value: "2:44" },
        ],
    },
    {
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&h=900&fit=crop&q=80&auto=format",
        alt: "Sunlight through trees",
        title: "Understory",
        subtitle: "Single",
        meta: [
            { label: "Year", value: "2023" },
            { label: "Producer", value: "Kell Mora" },
            { label: "Length", value: "3:38" },
        ],
    },
    {
        image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900&h=900&fit=crop&q=80&auto=format",
        alt: "Abstract coloured landscape",
        title: "Paper Lantern",
        subtitle: "Single",
        meta: [
            { label: "Year", value: "2021" },
            { label: "Producer", value: "Rue Alcott" },
            { label: "Length", value: "2:19" },
        ],
    },
    {
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&h=900&fit=crop&q=80&auto=format",
        alt: "Mountain lake at dusk",
        title: "Still Water",
        subtitle: "Long Player",
        meta: [
            { label: "Year", value: "2015" },
            { label: "Producer", value: "Ada Ferrow" },
            { label: "Length", value: "4:51" },
        ],
    },
    {
        image: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=900&h=900&fit=crop&q=80&auto=format",
        alt: "Light trails over a landscape",
        title: "Third Rail",
        subtitle: "EP",
        meta: [
            { label: "Year", value: "2024" },
            { label: "Producer", value: "Sim Oyo" },
            { label: "Length", value: "3:07" },
        ],
    },
    {
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&h=900&fit=crop&q=80&auto=format",
        alt: "Snow covered mountain",
        title: "Undertow",
        subtitle: "Single",
        meta: [
            { label: "Year", value: "2020" },
            { label: "Producer", value: "Juno Vale" },
            { label: "Length", value: "3:29" },
        ],
    },
    {
        image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=900&h=900&fit=crop&q=80&auto=format",
        alt: "Forest path",
        title: "Green Room",
        subtitle: "Long Player",
        meta: [
            { label: "Year", value: "2019" },
            { label: "Producer", value: "Ada Ferrow" },
            { label: "Length", value: "3:42" },
        ],
    },
]

function Chevron({
    direction,
    color,
}: {
    direction: "left" | "right"
    color: string
}) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path
                d={direction === "left" ? "M15 18L9 12l6-6" : "M9 18l6-6-6-6"}
            />
        </svg>
    )
}

function getImage(image?: FramerImage | string): FramerImage {
    if (typeof image === "string") {
        return { src: image }
    }

    return image || {}
}

function StaticPreview({
    slide,
    cardWidth,
    radius,
    cardColor,
    showCaption,
    textColor,
    mutedColor,
    captionFont,
    font,
    style,
    label,
}: {
    slide: CoverflowSlide
    cardWidth: string
    radius: number
    cardColor: string
    showCaption: boolean
    textColor: string
    mutedColor: string
    captionFont?: React.CSSProperties
    font?: React.CSSProperties
    style?: React.CSSProperties
    label: string
}) {
    const image = getImage(slide.image)
    const source = image.src || FALLBACK_IMAGE

    return (
        <div
            role="region"
            aria-label={label}
            style={{
                ...style,
                width: "100%",
                fontFamily: "Inter, system-ui, sans-serif",
                ...font,
            }}
        >
            <div
                style={{
                    padding: "40px 20px",
                    display: "flex",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: cardWidth,
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        borderRadius: radius,
                        background: cardColor,
                        boxShadow:
                            "0 20px 25px -5px rgba(0,0,0,0.18), 0 8px 10px -6px rgba(0,0,0,0.14)",
                    }}
                >
                    <img
                        src={source}
                        srcSet={image.srcSet}
                        alt={slide.alt || image.alt || ""}
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "cover",
                            objectPosition: `${image.positionX || "center"} ${image.positionY || "center"}`,
                        }}
                    />
                </div>
            </div>

            {showCaption && slide.title && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "0 24px",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 600,
                            color: textColor,
                            ...captionFont,
                        }}
                    >
                        {slide.title}
                    </p>

                    {slide.subtitle && (
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: 13,
                                color: mutedColor,
                            }}
                        >
                            {slide.subtitle}
                        </p>
                    )}

                    {slide.meta && slide.meta.length > 0 && (
                        <div
                            style={{
                                marginTop: 24,
                                width: "100%",
                                maxWidth: 230,
                            }}
                        >
                            {slide.meta.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "5px 0",
                                        fontSize: 12,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: mutedColor,
                                        }}
                                    >
                                        {item.label}
                                    </span>

                                    <span
                                        style={{
                                            color: textColor,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function CoverflowCarousel(
    props: Partial<CoverflowCarouselProps>
) {
    const isStaticRenderer = useIsStaticRenderer()

    const {
        slides = DEFAULT_SLIDES,
        rotate = 44,
        depth = 0.6,
        perspective = 3,
        falloff = 0.56,
        fade = 0.1,
        cardWidth = "clamp(148px, 22vw, 260px)",
        gap = 0.05,
        radius = 16,
        loop = true,
        showCaption = true,
        showPagination = false,
        showNavigation = false,
        label = "Cover carousel",
        font,
        captionFont,
        textColor = "#0A0A0A",
        mutedColor = "#71717A",
        cardColor = "#F4F4F5",
        controlColor = "rgba(255,255,255,0.7)",
        controlIconColor = "#0A0A0A",
        ringColor = "#A1A1AA",
        style,
    } = props

    const safeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES

    const count = safeSlides.length

    /*
     * Static renderer:
     *
     * No RAF.
     * No ResizeObserver.
     * No drag.
     * No animation.
     */
    if (isStaticRenderer) {
        return (
            <StaticPreview
                slide={safeSlides[0]}
                cardWidth={cardWidth}
                radius={radius}
                cardColor={cardColor}
                showCaption={showCaption}
                textColor={textColor}
                mutedColor={mutedColor}
                captionFont={captionFont}
                font={font}
                style={style}
                label={label}
            />
        )
    }

    const frameRef = React.useRef<HTMLDivElement>(null)

    const cardRefs = React.useRef<(HTMLDivElement | null)[]>([])

    const positionRef = React.useRef(0)

    const targetRef = React.useRef(0)

    const widthRef = React.useRef(0)

    const rafRef = React.useRef<number | null>(null)

    const dragRef = React.useRef<{
        pointerId: number
        startX: number
        startPosition: number
        velocity: number
        time: number
    } | null>(null)

    const [selected, setSelected] = React.useState(0)

    const indexAt = React.useCallback(
        (position: number) => {
            if (!count) return 0

            return ((Math.round(position) % count) + count) % count
        },
        [count]
    )

    const paint = React.useCallback(() => {
        const width = widthRef.current

        if (!width || !count) return

        const pitch = width * (1 + gap)

        const position = positionRef.current

        cardRefs.current.forEach((card, index) => {
            if (!card) return

            let offset = index - position

            if (loop) {
                offset = ((offset % count) + count) % count

                if (offset > count / 2) {
                    offset -= count
                }
            }

            const distance = Math.abs(offset)

            const ramp = Math.pow(distance, falloff)

            const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset)

            card.style.transform = `translateX(calc(-50% + ${offset * pitch}px)) translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`

            const edge = loop
                ? Math.min(1, Math.max(0, count / 2 - distance))
                : 1

            card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge)

            card.style.zIndex = String(100 - Math.round(distance))
        })
    }, [count, depth, fade, falloff, gap, loop, rotate])

    const clamp = React.useCallback(
        (position: number) => {
            if (loop) return position

            return Math.max(0, Math.min(count - 1, position))
        },
        [count, loop]
    )

    const settle = React.useCallback(
        (target: number) => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
            }

            targetRef.current = target
            setSelected(indexAt(target))

            const tick = () => {
                const remaining = target - positionRef.current

                if (Math.abs(remaining) < 0.0004) {
                    positionRef.current = target

                    paint()

                    rafRef.current = null

                    return
                }

                positionRef.current += remaining * 0.16

                paint()

                rafRef.current = requestAnimationFrame(tick)
            }

            rafRef.current = requestAnimationFrame(tick)
        },
        [indexAt, paint]
    )

    const nudge = React.useCallback(
        (amount: number) => {
            settle(clamp(Math.round(targetRef.current) + amount))
        },
        [clamp, settle]
    )

    const goTo = React.useCallback(
        (index: number) => {
            const target = loop
                ? index +
                  Math.round((targetRef.current - index) / count) * count
                : index

            settle(clamp(target))
        },
        [clamp, count, loop, settle]
    )

    React.useLayoutEffect(() => {
        const frame = frameRef.current

        if (!frame) return

        const measure = () => {
            const card = cardRefs.current[0]

            if (!card) return

            widthRef.current = card.offsetWidth

            paint()
        }

        measure()

        const observer = new ResizeObserver(measure)

        observer.observe(frame)

        return () => {
            observer.disconnect()
        }
    }, [paint])

    React.useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [])

    React.useEffect(() => {
        if (selected >= count) {
            setSelected(0)
            positionRef.current = 0
            targetRef.current = 0
            paint()
        }
    }, [count, paint, selected])

    const active = safeSlides[Math.min(selected, count - 1)]

    return (
        <div
            style={{
                ...style,
                width: "100%",
                fontFamily: "Inter, system-ui, sans-serif",
                ...font,
            }}
            role="region"
            aria-roledescription="carousel"
            aria-label={label}
        >
            <style>{`
                .cf-frame {
                    cursor: grab;
                    outline: none;
                }

                .cf-frame:active {
                    cursor: grabbing;
                }

                .cf-frame:focus-visible {
                    outline: 2px solid ${ringColor};
                    outline-offset: -2px;
                }

                .cf-nav {
                    transition:
                        opacity 160ms ease,
                        transform 160ms ease;
                }

                .cf-nav:hover {
                    opacity: 1 !important;
                }

                .cf-dot {
                    transition: opacity 200ms ease;
                }

                @media (prefers-reduced-motion: reduce) {
                    .cf-nav,
                    .cf-dot {
                        transition: none;
                    }
                }
            `}</style>

            <div
                style={{
                    position: "relative",
                }}
            >
                <div
                    ref={frameRef}
                    className="cf-frame"
                    tabIndex={0}
                    onPointerDown={(event) => {
                        if (rafRef.current !== null) {
                            cancelAnimationFrame(rafRef.current)

                            rafRef.current = null
                        }

                        event.currentTarget.setPointerCapture(event.pointerId)

                        targetRef.current = positionRef.current

                        dragRef.current = {
                            pointerId: event.pointerId,
                            startX: event.clientX,
                            startPosition: positionRef.current,
                            velocity: 0,
                            time: performance.now(),
                        }
                    }}
                    onPointerMove={(event) => {
                        const drag = dragRef.current

                        if (!drag || drag.pointerId !== event.pointerId) {
                            return
                        }

                        const pitch = widthRef.current * (1 + gap)

                        if (!pitch) return

                        const now = performance.now()

                        const previous = positionRef.current

                        positionRef.current = clamp(
                            drag.startPosition -
                                (event.clientX - drag.startX) / pitch
                        )

                        drag.velocity =
                            ((positionRef.current - previous) /
                                Math.max(now - drag.time, 1)) *
                            1000

                        drag.time = now

                        const nextIndex = indexAt(positionRef.current)

                        if (nextIndex !== selected) {
                            setSelected(nextIndex)
                        }

                        paint()
                    }}
                    onPointerUp={(event) => {
                        const drag = dragRef.current

                        if (!drag || drag.pointerId !== event.pointerId) {
                            return
                        }

                        dragRef.current = null

                        const momentum = Math.max(
                            -2,
                            Math.min(2, drag.velocity * 0.18)
                        )

                        settle(
                            clamp(Math.round(positionRef.current + momentum))
                        )
                    }}
                    onPointerCancel={() => {
                        dragRef.current = null

                        settle(clamp(Math.round(positionRef.current)))
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") {
                            event.preventDefault()
                            nudge(-1)
                        }

                        if (event.key === "ArrowRight") {
                            event.preventDefault()
                            nudge(1)
                        }
                    }}
                    style={{
                        overflow: "hidden",
                        paddingTop: 40,
                        paddingBottom: 40,
                        perspective: `${perspective * 300}px`,
                        touchAction: "pan-y",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            height: cardWidth,
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {safeSlides.map((slide, index) => {
                            const image = getImage(slide.image)

                            return (
                                <div
                                    key={index}
                                    ref={(node) => {
                                        cardRefs.current[index] = node
                                    }}
                                    role="group"
                                    aria-roledescription="slide"
                                    aria-label={`${index + 1} of ${count}`}
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: 0,
                                        width: cardWidth,
                                        aspectRatio: "1 / 1",
                                        overflow: "hidden",
                                        borderRadius: radius,
                                        background: cardColor,
                                        boxShadow:
                                            "0 20px 25px -5px rgba(0,0,0,0.18), 0 8px 10px -6px rgba(0,0,0,0.14)",
                                        backfaceVisibility: "hidden",
                                        willChange: "transform",
                                    }}
                                >
                                    <img
                                        src={image.src || FALLBACK_IMAGE}
                                        srcSet={image.srcSet}
                                        alt={slide.alt || image.alt || ""}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            objectFit: "cover",
                                            objectPosition: `${image.positionX || "center"} ${image.positionY || "center"}`,
                                            pointerEvents: "none",
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {showNavigation && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous slide"
                            className="cf-nav"
                            onClick={() => nudge(-1)}
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                zIndex: 200,
                                width: 40,
                                height: 40,
                                padding: 8,
                                border: "none",
                                borderRadius: 999,
                                background: controlColor,
                                backdropFilter: "blur(8px)",
                                opacity: 0.85,
                                cursor: "pointer",
                            }}
                        >
                            <Chevron
                                direction="left"
                                color={controlIconColor}
                            />
                        </button>

                        <button
                            type="button"
                            aria-label="Next slide"
                            className="cf-nav"
                            onClick={() => nudge(1)}
                            style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                zIndex: 200,
                                width: 40,
                                height: 40,
                                padding: 8,
                                border: "none",
                                borderRadius: 999,
                                background: controlColor,
                                backdropFilter: "blur(8px)",
                                opacity: 0.85,
                                cursor: "pointer",
                            }}
                        >
                            <Chevron
                                direction="right"
                                color={controlIconColor}
                            />
                        </button>
                    </>
                )}
            </div>

            {showCaption && active?.title && (
                <div
                    style={{
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "0 24px",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 600,
                            color: textColor,
                            ...captionFont,
                        }}
                    >
                        {active.title}
                    </p>

                    {active.subtitle && (
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: 13,
                                color: mutedColor,
                            }}
                        >
                            {active.subtitle}
                        </p>
                    )}

                    {active.meta && active.meta.length > 0 && (
                        <div
                            style={{
                                marginTop: 24,
                                width: "100%",
                                maxWidth: 230,
                            }}
                        >
                            {active.meta.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "5px 0",
                                        fontSize: 12,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: mutedColor,
                                        }}
                                    >
                                        {item.label}
                                    </span>

                                    <span
                                        style={{
                                            color: textColor,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showPagination && (
                <div
                    style={{
                        marginTop: 24,
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                    }}
                >
                    {safeSlides.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === selected}
                            onClick={() => goTo(index)}
                            className="cf-dot"
                            style={{
                                width: 8,
                                height: 8,
                                padding: 0,
                                border: "none",
                                borderRadius: 999,
                                background: textColor,
                                opacity: index === selected ? 1 : 0.3,
                                cursor: "pointer",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

addPropertyControls(CoverflowCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                },
                meta: {
                    type: ControlType.Array,
                    title: "Meta",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            label: {
                                type: ControlType.String,
                                title: "Label",
                                defaultValue: "Year",
                            },
                            value: {
                                type: ControlType.String,
                                title: "Value",
                                defaultValue: "2024",
                            },
                        },
                    },
                    defaultValue: [
                        {
                            label: "Year",
                            value: "2024",
                        },
                        {
                            label: "Producer",
                            value: "Artist",
                        },
                        {
                            label: "Length",
                            value: "3:20",
                        },
                    ],
                },
            },
        },
        defaultValue: DEFAULT_SLIDES,
    },

    cardWidth: {
        type: ControlType.String,
        title: "Card size",
        defaultValue: "clamp(148px, 22vw, 260px)",
    },

    rotate: {
        type: ControlType.Number,
        title: "Rotate",
        min: 0,
        max: 80,
        step: 1,
        unit: "°",
        defaultValue: 44,
    },

    depth: {
        type: ControlType.Number,
        title: "Depth",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.6,
    },

    perspective: {
        type: ControlType.Number,
        title: "Lens",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 3,
    },

    falloff: {
        type: ControlType.Number,
        title: "Falloff",
        min: 0.2,
        max: 1.5,
        step: 0.02,
        defaultValue: 0.56,
    },

    fade: {
        type: ControlType.Number,
        title: "Fade",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: -0.3,
        max: 0.6,
        step: 0.01,
        defaultValue: 0.05,
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },

    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },

    showCaption: {
        type: ControlType.Boolean,
        title: "Caption",
        defaultValue: true,
    },

    showPagination: {
        type: ControlType.Boolean,
        title: "Dots",
        defaultValue: false,
    },

    showNavigation: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: false,
    },

    font: {
        type: ControlType.Font,
        title: "Body font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },

    captionFont: {
        type: ControlType.Font,
        title: "Title font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            fontWeight: 600,
        },
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#0A0A0A",
    },

    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#71717A",
    },

    cardColor: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "#F4F4F5",
    },

    controlColor: {
        type: ControlType.Color,
        title: "Arrow bg",
        defaultValue: "rgba(255,255,255,0.7)",
        hidden: (props) => !props.showNavigation,
    },

    controlIconColor: {
        type: ControlType.Color,
        title: "Arrow icon",
        defaultValue: "#0A0A0A",
        hidden: (props) => !props.showNavigation,
    },

    ringColor: {
        type: ControlType.Color,
        title: "Focus ring",
        defaultValue: "#A1A1AA",
    },

    label: {
        type: ControlType.String,
        title: "ARIA label",
        defaultValue: "Cover carousel",
    },
})
