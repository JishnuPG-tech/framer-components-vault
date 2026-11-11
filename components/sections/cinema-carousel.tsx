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

import { motion, useReducedMotion } from "framer-motion"

type Slide = {
    image?: {
        src?: string
        srcSet?: string
        alt?: string
    }
    title: string
    category: string
    description: string
    buttonText: string
    link: string
    newTab: boolean
}

type Props = {
    slides: Slide[]
    startSlide: number
    background: string
    textColor: string
    accent: string
    radius: number
    gap: number
    padding: number
    stripWidth: number
    overlay: number
    duration: number
    showButton: boolean
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    style?: React.CSSProperties
}

const IMAGES = [
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
]

const DEFAULT_SLIDES: Slide[] = [
    {
        title: "Beyond ordinary.",
        category: "Art direction",
        description:
            "A different perspective on the shapes, colours and details around us.",
        image: { src: IMAGES[0], alt: "Beyond ordinary" },
        buttonText: "Explore project",
        link: "#",
        newTab: false,
    },
    {
        title: "Soft encounters.",
        category: "Visual identity",
        description:
            "Organic forms meet a clear visual language. Made to feel a little different.",
        image: { src: IMAGES[1], alt: "Soft encounters" },
        buttonText: "View project",
        link: "#",
        newTab: false,
    },
    {
        title: "New dimensions.",
        category: "Creative exploration",
        description:
            "An exploration of depth, movement and unexpected combinations.",
        image: { src: IMAGES[2], alt: "New dimensions" },
        buttonText: "Discover more",
        link: "#",
        newTab: false,
    },
    {
        title: "In good shape.",
        category: "Selected work",
        description:
            "Simple ideas brought to life through thoughtful design and playful details.",
        image: { src: IMAGES[3], alt: "In good shape" },
        buttonText: "Take a look",
        link: "#",
        newTab: false,
    },
]

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))

const useSafeLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function Arrow({ left = false }: { left?: boolean }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{
                transform: left ? "rotate(180deg)" : undefined,
            }}
        >
            <path
                d="M4 12h15M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 */
export default function CinemaCarousel(props: Props) {
    const {
        slides = DEFAULT_SLIDES,
        startSlide = 1,
        background = "#141414",
        textColor = "#FFFFFF",
        accent = "#D9FF85",
        radius = 20,
        gap = 10,
        padding = 24,
        stripWidth = 92,
        overlay = 0.78,
        duration = 0.8,
        showButton = true,
        headingFont,
        bodyFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const instant = isStatic || !!reducedMotion

    const items = slides?.length ? slides : DEFAULT_SLIDES
    const count = items.length

    const [selected, setSelected] = React.useState(
        clamp(startSlide - 1, 0, count - 1)
    )

    const active = isStatic
        ? clamp(startSlide - 1, 0, count - 1)
        : clamp(selected, 0, count - 1)

    const rootRef = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(
        typeof style?.width === "number" ? style.width : 1200
    )

    const gesture = React.useRef<{
        x: number
        y: number
        id: number
        horizontal: boolean
    } | null>(null)

    const suppressClick = React.useRef(0)
    const scope = `cinema-${React.useId().replace(/:/g, "")}`

    React.useEffect(() => {
        setSelected(clamp(startSlide - 1, 0, count - 1))
    }, [startSlide, count])

    useSafeLayoutEffect(() => {
        const element = rootRef.current
        if (!element) return

        const measure = () => {
            if (element.clientWidth > 0) {
                setWidth(element.clientWidth)
            }
        }

        measure()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }

        const observer = new ResizeObserver(measure)
        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const mobile = width < 640
    const compact = width < 900
    const inset = mobile ? Math.min(padding, 12) : padding
    const cardGap = mobile ? Math.min(gap, 6) : gap
    const innerWidth = Math.max(1, width - inset * 2)

    // On mobile, neighbouring slides become narrow visual previews.
    const collapsedWidth =
        count <= 1
            ? 0
            : Math.max(
                  0,
                  Math.min(
                      mobile ? 12 : stripWidth,
                      (innerWidth * (mobile ? 0.2 : 0.42)) / (count - 1)
                  )
              )

    const actualGap =
        count <= 1 ? 0 : Math.min(cardGap, (innerWidth * 0.08) / (count - 1))

    const expandedWidth = Math.max(
        1,
        innerWidth - (count - 1) * (collapsedWidth + actualGap)
    )

    const contentPadding = mobile ? 20 : compact ? 28 : 42

    const transition = {
        duration: instant ? 0 : duration,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    }

    const goTo = (index: number) => {
        if (!isStatic) {
            setSelected(clamp(index, 0, count - 1))
        }
    }

    const step = (direction: number) => {
        if (!isStatic) {
            setSelected((current) => (current + direction + count) % count)
        }
    }

    const navStyle: React.CSSProperties = {
        width: 44,
        height: 44,
        padding: 0,
        border: "1px solid rgba(255,255,255,0.22)",
        borderRadius: "50%",
        background: "transparent",
        color: textColor,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
    }

    return (
        <div
            ref={rootRef}
            className={scope}
            role="region"
            aria-roledescription="carousel"
            aria-label="Selected projects"
            onKeyDown={(event) => {
                const target = event.target as HTMLElement

                if (
                    target.isContentEditable ||
                    /INPUT|TEXTAREA|SELECT/.test(target.tagName)
                ) {
                    return
                }

                if (event.key === "ArrowRight") {
                    event.preventDefault()
                    step(1)
                }

                if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    step(-1)
                }

                if (event.key === "Home") {
                    event.preventDefault()
                    goTo(0)
                }

                if (event.key === "End") {
                    event.preventDefault()
                    goTo(count - 1)
                }
            }}
            style={{
                width: "100%",
                height: "100%",
                ...style,
                minWidth: 0,
                boxSizing: "border-box",
                padding: inset,
                background,
                color: textColor,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "Inter, sans-serif",
            }}
        >
            <style>{`
                .${scope} button,
                .${scope} a {
                    -webkit-tap-highlight-color: transparent;
                }

                .${scope} button:focus-visible,
                .${scope} a:focus-visible {
                    outline: 2px solid ${accent};
                    outline-offset: -5px;
                }

                .${scope} button:disabled {
                    cursor: default;
                }
            `}</style>

            <div
                onPointerDown={(event) => {
                    if (
                        isStatic ||
                        count <= 1 ||
                        !event.isPrimary ||
                        event.button !== 0
                    ) {
                        return
                    }

                    gesture.current = {
                        x: event.clientX,
                        y: event.clientY,
                        id: event.pointerId,
                        horizontal: false,
                    }
                }}
                onPointerMove={(event) => {
                    const start = gesture.current

                    if (!start || start.id !== event.pointerId) {
                        return
                    }

                    const dx = event.clientX - start.x
                    const dy = event.clientY - start.y

                    if (
                        !start.horizontal &&
                        Math.abs(dy) > 12 &&
                        Math.abs(dy) > Math.abs(dx)
                    ) {
                        gesture.current = null
                        return
                    }

                    if (
                        !start.horizontal &&
                        Math.abs(dx) > 10 &&
                        Math.abs(dx) > Math.abs(dy)
                    ) {
                        start.horizontal = true
                        event.currentTarget.setPointerCapture(event.pointerId)
                    }

                    if (start.horizontal) {
                        suppressClick.current = Date.now() + 300
                    }
                }}
                onPointerUp={(event) => {
                    const start = gesture.current
                    gesture.current = null

                    if (!start || start.id !== event.pointerId) {
                        return
                    }

                    const dx = event.clientX - start.x

                    if (start.horizontal) {
                        suppressClick.current = Date.now() + 300

                        if (Math.abs(dx) > 36) {
                            step(dx < 0 ? 1 : -1)
                        }
                    }

                    if (
                        event.currentTarget.hasPointerCapture(event.pointerId)
                    ) {
                        event.currentTarget.releasePointerCapture(
                            event.pointerId
                        )
                    }
                }}
                onPointerCancel={() => {
                    gesture.current = null
                }}
                onClickCapture={(event) => {
                    if (Date.now() < suppressClick.current) {
                        event.preventDefault()
                        event.stopPropagation()
                    }
                }}
                style={{
                    display: "flex",
                    gap: actualGap,
                    flex: "1 1 0",
                    minHeight: 0,
                    width: "100%",
                    touchAction: "pan-y",
                }}
            >
                {items.map((slide, index) => {
                    const isActive = index === active

                    return (
                        <motion.div
                            key={index}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${index + 1} of ${count}: ${slide.title}`}
                            initial={false}
                            animate={{
                                width: isActive
                                    ? expandedWidth
                                    : collapsedWidth,
                            }}
                            transition={transition}
                            style={{
                                position: "relative",
                                flexShrink: 0,
                                height: "100%",
                                minWidth: 0,
                                overflow: "hidden",
                                borderRadius: mobile
                                    ? Math.min(radius, 14)
                                    : radius,
                                background: "#292929",
                                isolation: "isolate",
                            }}
                        >
                            {/* Keep the image at a stable width while
                                the surrounding panel opens and closes. */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1 : 1.08,
                                    x: isActive ? 0 : -expandedWidth * 0.12,
                                }}
                                transition={transition}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: expandedWidth,
                                    height: "100%",
                                }}
                            >
                                <img
                                    src={
                                        slide.image?.src ||
                                        IMAGES[index % IMAGES.length]
                                    }
                                    srcSet={slide.image?.srcSet}
                                    sizes={`${Math.ceil(expandedWidth)}px`}
                                    alt={slide.image?.alt ?? slide.title}
                                    draggable={false}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        objectPosition: "center",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                    }}
                                />
                            </motion.div>

                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: `linear-gradient(
                                        180deg,
                                        rgba(0,0,0,0.18) 0%,
                                        rgba(0,0,0,0) 32%,
                                        rgba(0,0,0,${overlay * 0.42}) 62%,
                                        rgba(0,0,0,${overlay}) 100%
                                    )`,
                                    pointerEvents: "none",
                                }}
                            />

                            <motion.div
                                initial={false}
                                animate={{
                                    opacity: isActive ? 0 : 0.35,
                                }}
                                transition={transition}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "#000",
                                    pointerEvents: "none",
                                }}
                            />

                            {/* Active panel content */}
                            <motion.a
                                href={
                                    isActive && !isStatic && slide.link
                                        ? slide.link
                                        : undefined
                                }
                                target={slide.newTab ? "_blank" : undefined}
                                rel={
                                    slide.newTab
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                tabIndex={
                                    isActive && !isStatic && slide.link ? 0 : -1
                                }
                                draggable={false}
                                onDragStart={(event) => event.preventDefault()}
                                initial={false}
                                animate={{
                                    opacity: isActive ? 1 : 0,
                                    y: isActive || instant ? 0 : 12,
                                }}
                                transition={{
                                    duration: instant ? 0 : duration * 0.55,
                                    delay:
                                        isActive && !instant
                                            ? duration * 0.18
                                            : 0,
                                }}
                                aria-hidden={!isActive}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: expandedWidth,
                                    boxSizing: "border-box",
                                    padding: contentPadding,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    pointerEvents: isActive ? "auto" : "none",
                                    overflowY: isActive ? "auto" : "hidden",
                                    color: textColor,
                                    textDecoration: "none",
                                    borderRadius: "inherit",
                                    cursor:
                                        isActive && !isStatic && slide.link
                                            ? "pointer"
                                            : "default",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                            fontSize: 10,
                                            fontWeight: 500,
                                            letterSpacing: ".1em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: accent,
                                                flexShrink: 0,
                                            }}
                                        />
                                        {slide.category}
                                    </span>

                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontVariantNumeric: "tabular-nums",
                                            opacity: 0.75,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        paddingTop: 40,
                                        maxWidth: 650,
                                    }}
                                >
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: mobile
                                                ? 38
                                                : compact
                                                  ? 52
                                                  : 76,
                                            lineHeight: 0.98,
                                            fontWeight: 500,
                                            letterSpacing: "-.055em",
                                            textWrap: "balance",
                                            ...headingFont,
                                            color: textColor,
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {slide.title}
                                    </h2>

                                    {slide.description && (
                                        <p
                                            style={{
                                                margin: "18px 0 0",
                                                maxWidth: 340,
                                                fontSize: mobile ? 13 : 14,
                                                lineHeight: 1.55,
                                                ...bodyFont,
                                                color: textColor,
                                                opacity: 0.78,
                                            }}
                                        >
                                            {slide.description}
                                        </p>
                                    )}

                                    {showButton &&
                                        slide.buttonText &&
                                        slide.link && (
                                            <motion.span
                                                whileHover={
                                                    instant
                                                        ? undefined
                                                        : { x: 4 }
                                                }
                                                style={{
                                                    marginTop: 25,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 18,
                                                    color: textColor,
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    padding: "5px 0",
                                                }}
                                            >
                                                {slide.buttonText}

                                                <span
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        display: "grid",
                                                        placeItems: "center",
                                                        borderRadius: "50%",
                                                        background: accent,
                                                        color: "#141414",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Arrow />
                                                </span>
                                            </motion.span>
                                        )}
                                </div>
                            </motion.a>

                            {/* Collapsed strip labels */}
                            <motion.div
                                initial={false}
                                animate={{
                                    opacity:
                                        !isActive &&
                                        !mobile &&
                                        collapsedWidth >= 38
                                            ? 1
                                            : 0,
                                }}
                                transition={{
                                    duration: instant ? 0 : duration * 0.3,
                                }}
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "24px 0",
                                    pointerEvents: "none",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        opacity: 0.7,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {String(index + 1).padStart(2, "0")}
                                </span>

                                <span
                                    style={{
                                        writingMode: "vertical-rl",
                                        transform: "rotate(180deg)",
                                        fontSize: 16,
                                        fontWeight: 500,
                                        letterSpacing: "-.02em",
                                        whiteSpace: "nowrap",
                                        maxHeight: "70%",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {slide.title}
                                </span>
                            </motion.div>

                            {!isActive && (
                                <button
                                    type="button"
                                    aria-label={`Show ${slide.title}`}
                                    tabIndex={isStatic ? -1 : 0}
                                    onClick={() => goTo(index)}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        padding: 0,
                                        border: 0,
                                        background: "transparent",
                                        cursor: "pointer",
                                        borderRadius: "inherit",
                                    }}
                                />
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Bottom navigation */}
            <div
                style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 20,
                    paddingTop: mobile ? 16 : 22,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: mobile ? 12 : 22,
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            whiteSpace: "nowrap",
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: ".05em",
                        }}
                    >
                        {String(active + 1).padStart(2, "0")}
                        <span style={{ opacity: 0.35 }}>
                            {" / "}
                            {String(count).padStart(2, "0")}
                        </span>
                    </span>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            width: mobile ? 100 : 180,
                            maxWidth: "100%",
                        }}
                    >
                        {items.map((slide, index) => (
                            <button
                                key={index}
                                type="button"
                                aria-label={`Go to ${slide.title}`}
                                aria-current={
                                    index === active ? "true" : undefined
                                }
                                tabIndex={isStatic ? -1 : 0}
                                onClick={() => goTo(index)}
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    height: 32,
                                    border: 0,
                                    padding: 0,
                                    background: "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                }}
                            >
                                <motion.span
                                    initial={false}
                                    animate={{
                                        opacity: index === active ? 1 : 0.2,
                                        backgroundColor:
                                            index === active
                                                ? accent
                                                : textColor,
                                    }}
                                    transition={transition}
                                    style={{
                                        width: "100%",
                                        height: 2,
                                        display: "block",
                                        borderRadius: 2,
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {count > 1 && (
                    <div style={{ display: "flex", gap: 8 }}>
                        <motion.button
                            type="button"
                            aria-label="Previous slide"
                            disabled={isStatic}
                            onClick={() => step(-1)}
                            whileHover={
                                instant
                                    ? undefined
                                    : {
                                          backgroundColor:
                                              "rgba(255,255,255,0.1)",
                                      }
                            }
                            whileTap={instant ? undefined : { scale: 0.94 }}
                            style={navStyle}
                        >
                            <Arrow left />
                        </motion.button>

                        <motion.button
                            type="button"
                            aria-label="Next slide"
                            disabled={isStatic}
                            onClick={() => step(1)}
                            whileHover={
                                instant
                                    ? undefined
                                    : {
                                          backgroundColor:
                                              "rgba(255,255,255,0.1)",
                                      }
                            }
                            whileTap={instant ? undefined : { scale: 0.94 }}
                            style={navStyle}
                        >
                            <Arrow />
                        </motion.button>
                    </div>
                )}
            </div>

            <span
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clipPath: "inset(50%)",
                    whiteSpace: "nowrap",
                }}
            >
                {active + 1} of {count}: {items[active].title}
            </span>
        </div>
    )
}

addPropertyControls(CinemaCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 8,
        defaultValue: DEFAULT_SLIDES,
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
                    defaultValue: "Something new.",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Selected project",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "A fresh perspective on familiar forms.",
                },
                buttonText: {
                    type: ControlType.String,
                    title: "Button",
                    defaultValue: "Explore project",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
            },
        },
    },

    startSlide: {
        type: ControlType.Number,
        title: "Start Slide",
        defaultValue: 1,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#141414",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#D9FF85",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 24,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    stripWidth: {
        type: ControlType.Number,
        title: "Strip Width",
        defaultValue: 92,
        min: 40,
        max: 160,
        step: 1,
        unit: "px",
    },
    overlay: {
        type: ControlType.Number,
        title: "Image Shade",
        defaultValue: 0.78,
        min: 0,
        max: 1,
        step: 0.05,
    },
    duration: {
        type: ControlType.Number,
        title: "Transition",
        defaultValue: 0.8,
        min: 0.2,
        max: 1.8,
        step: 0.05,
        unit: "s",
    },
    showButton: {
        type: ControlType.Boolean,
        title: "Show Button",
        defaultValue: true,
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
