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

import {
    AnimatePresence,
    motion,
    useReducedMotion,
    type PanInfo,
} from "framer-motion"

type Slide = {
    image?: {
        src?: string
        srcSet?: string
        alt?: string
    }
    title?: string
    buttonText?: string
    link?: string
    newTab?: boolean
}

type Props = {
    slides: Slide[]
    startSlide: number
    bands: number
    gap: number
    radius: number
    duration: number
    stagger: number
    background: string
    controlsBackground: string
    controlsColor: string
    showTitle: boolean
    showCounter: boolean
    titleColor: string
    titleFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_SLIDES: Slide[] = [
    {
        image: {
            src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2000&q=85",
            alt: "Ocean waves and an open horizon",
        },
        title: "Open water",
        buttonText: "Explore",
        link: "",
        newTab: false,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2000&q=85",
            alt: "Green landscape in soft natural light",
        },
        title: "Somewhere slower",
        buttonText: "Discover",
        link: "",
        newTab: false,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85",
            alt: "Dramatic mountain peaks",
        },
        title: "Higher ground",
        buttonText: "View more",
        link: "",
        newTab: false,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2000&q=85",
            alt: "Warm light falling over a quiet landscape",
        },
        title: "Last light",
        buttonText: "Explore",
        link: "",
        newTab: false,
    },
]

const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1]

const useSafeLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function wrap(value: number, length: number) {
    return ((value % length) + length) % length
}

function Arrow({ left = false }: { left?: boolean }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{
                display: "block",
                transform: left ? "rotate(180deg)" : undefined,
            }}
        >
            <path
                d="M4 12H20M13 5L20 12L13 19"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

const hiddenStyle: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 680
 */
export default function LoomCarousel(props: Props) {
    const {
        slides = DEFAULT_SLIDES,
        startSlide = 1,
        bands = 5,
        gap = 4,
        radius = 24,
        duration = 0.95,
        stagger = 0.065,
        background = "#161714",
        controlsBackground = "#F4F3ED",
        controlsColor = "#20221D",
        showTitle = false,
        showCounter = true,
        titleColor = "#FFFFFF",
        titleFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const instant = isStatic || Boolean(reducedMotion)

    const items = slides?.length ? slides : DEFAULT_SLIDES
    const count = items.length
    const initialIndex = clamp(Math.round(startSlide) - 1, 0, count - 1)

    const [state, setState] = React.useState({
        index: initialIndex,
        direction: 1,
    })

    const rootRef = React.useRef<HTMLDivElement>(null)
    const lockedUntil = React.useRef(0)
    const suppressClickUntil = React.useRef(0)

    const [size, setSize] = React.useState({
        width: typeof style?.width === "number" ? style.width : 1100,
        height: typeof style?.height === "number" ? style.height : 680,
    })

    const uniqueId = React.useId().replace(/:/g, "")
    const scope = `loom-${uniqueId}`

    useSafeLayoutEffect(() => {
        const element = rootRef.current
        if (!element) return

        const measure = () => {
            const width = element.clientWidth
            const height = element.clientHeight

            if (width <= 0 || height <= 0) return

            setSize((previous) => {
                if (previous.width === width && previous.height === height) {
                    return previous
                }

                return { width, height }
            })
        }

        measure()

        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(measure)
        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        setState({ index: initialIndex, direction: 1 })
        lockedUntil.current = 0
    }, [initialIndex, count])

    const activeIndex = isStatic
        ? initialIndex
        : clamp(state.index, 0, count - 1)

    const activeSlide = items[activeIndex]
    const mobile = size.width < 600
    const narrow = size.width < 380

    const bandCount = clamp(Math.round(bands), 2, 8)

    const effectiveGap = Math.min(
        mobile ? gap * 0.65 : gap,
        size.width / (bandCount * 4)
    )

    const bandWidth = (size.width - effectiveGap * (bandCount - 1)) / bandCount

    const inset = mobile ? 16 : 24
    const controlSize = mobile ? 42 : 46
    const totalDuration = instant ? 0 : duration + stagger * (bandCount - 1)

    const changeSlide = React.useCallback(
        (direction: number) => {
            if (isStatic || count < 2 || Date.now() < lockedUntil.current) {
                return
            }

            lockedUntil.current = Date.now() + totalDuration * 1000 + 30

            setState((previous) => ({
                index: wrap(previous.index + direction, count),
                direction,
            }))
        },
        [isStatic, count, totalDuration]
    )

    const handlePanEnd = (
        _: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        const horizontal = Math.abs(info.offset.x)
        const vertical = Math.abs(info.offset.y)

        if (horizontal > 8 || vertical > 8) {
            suppressClickUntil.current = Date.now() + 350
        }

        if (horizontal < vertical) return

        const passedDistance = horizontal > (mobile ? 36 : 55)
        const passedVelocity =
            horizontal > 12 && Math.abs(info.velocity.x) > 500

        if (passedDistance || passedVelocity) {
            changeSlide(info.offset.x < 0 ? 1 : -1)
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (isStatic || event.altKey || event.ctrlKey || event.metaKey) {
            return
        }

        const target = event.target as HTMLElement

        if (
            target.isContentEditable ||
            /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
        ) {
            return
        }

        if (event.key === "ArrowRight") {
            event.preventDefault()
            changeSlide(1)
        } else if (event.key === "ArrowLeft") {
            event.preventDefault()
            changeSlide(-1)
        }
    }

    const preventUnavailableLink = (
        event: React.MouseEvent<HTMLAnchorElement>
    ) => {
        if (
            isStatic ||
            !activeSlide.link ||
            Date.now() < lockedUntil.current ||
            Date.now() < suppressClickUntil.current
        ) {
            event.preventDefault()
        }
    }

    const buttonStyle: React.CSSProperties = {
        width: controlSize,
        height: controlSize,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        border: 0,
        borderRadius: "50%",
        background: "transparent",
        color: controlsColor,
        cursor: isStatic ? "default" : "pointer",
        WebkitTapHighlightColor: "transparent",
    }

    return (
        <motion.div
            ref={rootRef}
            className={scope}
            role="region"
            aria-roledescription="carousel"
            aria-label="Image carousel"
            tabIndex={isStatic ? -1 : 0}
            onKeyDown={handleKeyDown}
            onPanEnd={isStatic ? undefined : handlePanEnd}
            onClickCapture={(event) => {
                if (Date.now() < suppressClickUntil.current) {
                    event.preventDefault()
                    event.stopPropagation()
                }
            }}
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
                minWidth: 1,
                minHeight: 180,
                overflow: "hidden",
                isolation: "isolate",
                borderRadius: radius,
                background,
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <style>{`
                .${scope}:focus-visible {
                    outline: 2px solid ${controlsBackground};
                    outline-offset: -5px;
                }

                .${scope} button:focus-visible {
                    outline: 2px solid ${controlsColor};
                    outline-offset: -4px;
                }

                .${scope} a:focus-visible {
                    outline: 2px solid ${controlsBackground};
                    outline-offset: -6px;
                }

                .${scope} .loom-slide-button:focus-visible {
                    outline: 2px solid ${controlsColor};
                    outline-offset: -4px;
                }
            `}</style>

            {/* Image bands */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            >
                {Array.from({ length: bandCount }, (_, band) => {
                    const left = band * (bandWidth + effectiveGap)
                    const polarity = band % 2 === 0 ? 1 : -1

                    const variants = {
                        enter: (direction: number) => ({
                            y: instant
                                ? "0%"
                                : `${direction * polarity * 100}%`,
                        }),
                        visible: {
                            y: "0%",
                        },
                        exit: (direction: number) => ({
                            y: instant
                                ? "0%"
                                : `${direction * polarity * -100}%`,
                        }),
                    }

                    const delay = instant
                        ? 0
                        : (state.direction > 0 ? band : bandCount - 1 - band) *
                          stagger

                    return (
                        <div
                            key={band}
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left,
                                width: bandWidth,
                                overflow: "hidden",
                            }}
                        >
                            <AnimatePresence
                                initial={false}
                                custom={state.direction}
                                mode="sync"
                            >
                                <motion.div
                                    key={activeIndex}
                                    custom={state.direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="visible"
                                    exit="exit"
                                    transition={{
                                        duration: instant ? 0 : duration,
                                        delay,
                                        ease: EASE,
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background,
                                        backfaceVisibility: "hidden",
                                    }}
                                >
                                    {activeSlide.image?.src ? (
                                        <img
                                            src={activeSlide.image.src}
                                            srcSet={activeSlide.image.srcSet}
                                            sizes={`${Math.ceil(size.width)}px`}
                                            alt=""
                                            draggable={false}
                                            loading="eager"
                                            decoding="async"
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: -left,
                                                width: size.width,
                                                height: size.height,
                                                maxWidth: "none",
                                                display: "block",
                                                objectFit: "cover",
                                                objectPosition: "center",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: -left,
                                                width: size.width,
                                                height: size.height,
                                                background:
                                                    "linear-gradient(135deg, #AAA795, #3F4C44)",
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>

            {/* Preload images */}
            {!isStatic && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        opacity: 0,
                        pointerEvents: "none",
                    }}
                >
                    {items.map((slide, index) =>
                        slide.image?.src ? (
                            <img
                                key={index}
                                src={slide.image.src}
                                srcSet={slide.image.srcSet}
                                sizes={`${Math.ceil(size.width)}px`}
                                alt=""
                                loading="eager"
                                decoding="async"
                                width={1}
                                height={1}
                            />
                        ) : null
                    )}
                </div>
            )}

            {/* Full-image link */}
            {activeSlide.link && !isStatic && (
                <a
                    href={activeSlide.link}
                    target={activeSlide.newTab ? "_blank" : undefined}
                    rel={activeSlide.newTab ? "noopener noreferrer" : undefined}
                    aria-label={`Open ${
                        activeSlide.title || `image ${activeIndex + 1}`
                    }${activeSlide.newTab ? " (opens in a new tab)" : ""}`}
                    draggable={false}
                    onClick={preventUnavailableLink}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        borderRadius: "inherit",
                    }}
                />
            )}

            {/* Optional title */}
            {showTitle && activeSlide.title && (
                <>
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 1,
                            background:
                                "linear-gradient(180deg, rgba(0,0,0,.3), transparent 35%)",
                            pointerEvents: "none",
                        }}
                    />

                    <div
                        style={{
                            position: "absolute",
                            top: inset,
                            left: inset,
                            right: inset,
                            zIndex: 3,
                            pointerEvents: "none",
                            overflow: "hidden",
                        }}
                    >
                        <motion.div
                            key={activeIndex}
                            initial={instant ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: instant ? 0 : 0.35,
                                delay: instant ? 0 : duration * 0.45,
                            }}
                            style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: mobile ? 20 : 28,
                                fontWeight: 500,
                                lineHeight: 1.15,
                                letterSpacing: "-0.04em",
                                ...titleFont,
                                color: titleColor,
                            }}
                        >
                            {activeSlide.title}
                        </motion.div>
                    </div>
                </>
            )}

            {/* Slide button and navigation */}
            <div
                style={{
                    position: "absolute",
                    left: inset,
                    right: inset,
                    bottom: inset,
                    zIndex: 4,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: narrow ? "wrap" : "nowrap",
                    pointerEvents: "none",
                }}
            >
                {/* Individual button for each slide */}
                <motion.a
                    className="loom-slide-button"
                    href={isStatic ? undefined : activeSlide.link || undefined}
                    target={activeSlide.newTab ? "_blank" : undefined}
                    rel={activeSlide.newTab ? "noopener noreferrer" : undefined}
                    role={!activeSlide.link ? "link" : undefined}
                    aria-label={`${activeSlide.buttonText || "Explore"}${
                        activeSlide.newTab ? " (opens in a new tab)" : ""
                    }`}
                    aria-disabled={!activeSlide.link || isStatic || undefined}
                    tabIndex={isStatic || !activeSlide.link ? -1 : 0}
                    draggable={false}
                    onClick={preventUnavailableLink}
                    whileHover={
                        instant || !activeSlide.link ? undefined : { y: -2 }
                    }
                    whileTap={
                        instant || !activeSlide.link
                            ? undefined
                            : { scale: 0.97 }
                    }
                    transition={{
                        duration: instant ? 0 : 0.2,
                    }}
                    style={{
                        minWidth: 0,
                        maxWidth: "100%",
                        flex: "0 1 auto",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: mobile ? 8 : 14,
                        height: controlSize + 8,
                        boxSizing: "border-box",
                        padding: mobile ? "0 16px" : "0 22px",
                        borderRadius: 999,
                        background: controlsBackground,
                        color: controlsColor,
                        boxShadow: "0 4px 20px rgba(0,0,0,.08)",
                        textDecoration: "none",
                        fontFamily: "Inter, sans-serif",
                        fontSize: mobile ? 12 : 13,
                        fontWeight: 500,
                        lineHeight: 1,
                        cursor:
                            isStatic || !activeSlide.link
                                ? "default"
                                : "pointer",
                        pointerEvents: "auto",
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    <span
                        style={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {activeSlide.buttonText || "Explore"}
                    </span>

                    <span
                        style={{
                            display: "flex",
                            flexShrink: 0,
                        }}
                    >
                        <Arrow />
                    </span>
                </motion.a>

                {(count > 1 || showCounter) && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                            gap: 2,
                            padding: 4,
                            marginLeft: "auto",
                            borderRadius: 999,
                            background: controlsBackground,
                            color: controlsColor,
                            boxShadow: "0 4px 20px rgba(0,0,0,.08)",
                            pointerEvents: "auto",
                        }}
                    >
                        {count > 1 && (
                            <motion.button
                                type="button"
                                aria-label="Previous image"
                                tabIndex={isStatic ? -1 : 0}
                                onClick={() => changeSlide(-1)}
                                whileHover={instant ? undefined : { x: -2 }}
                                whileTap={instant ? undefined : { scale: 0.9 }}
                                style={buttonStyle}
                            >
                                <Arrow left />
                            </motion.button>
                        )}

                        {showCounter && (
                            <div
                                aria-hidden="true"
                                style={{
                                    minWidth: 56,
                                    boxSizing: "border-box",
                                    padding: "0 8px",
                                    textAlign: "center",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: 11,
                                    fontWeight: 500,
                                    fontVariantNumeric: "tabular-nums",
                                    letterSpacing: "0.02em",
                                    lineHeight: `${controlSize}px`,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {String(activeIndex + 1).padStart(2, "0")}
                                <span
                                    style={{
                                        opacity: 0.35,
                                        margin: "0 7px",
                                    }}
                                >
                                    /
                                </span>
                                {String(count).padStart(2, "0")}
                            </div>
                        )}

                        {count > 1 && (
                            <motion.button
                                type="button"
                                aria-label="Next image"
                                tabIndex={isStatic ? -1 : 0}
                                onClick={() => changeSlide(1)}
                                whileHover={instant ? undefined : { x: 2 }}
                                whileTap={instant ? undefined : { scale: 0.9 }}
                                style={buttonStyle}
                            >
                                <Arrow />
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            <div
                aria-live={isStatic ? "off" : "polite"}
                aria-atomic="true"
                style={hiddenStyle}
            >
                {`${activeIndex + 1} of ${count}. ${
                    activeSlide.image?.alt || activeSlide.title || "Image"
                }`}
            </div>
        </motion.div>
    )
}

addPropertyControls(LoomCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 15,
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
                    defaultValue: "A new perspective",
                },
                buttonText: {
                    type: ControlType.String,
                    title: "Button Text",
                    defaultValue: "Explore",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
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
        max: 15,
        step: 1,
        displayStepper: true,
    },

    bands: {
        type: ControlType.Number,
        title: "Bands",
        defaultValue: 5,
        min: 2,
        max: 8,
        step: 1,
        displayStepper: true,
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.95,
        min: 0.3,
        max: 2,
        step: 0.05,
        unit: "s",
    },

    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.065,
        min: 0,
        max: 0.15,
        step: 0.005,
        unit: "s",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#161714",
    },

    controlsBackground: {
        type: ControlType.Color,
        title: "Controls",
        defaultValue: "#F4F3ED",
    },

    controlsColor: {
        type: ControlType.Color,
        title: "Arrows & Text",
        defaultValue: "#20221D",
    },

    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
    },

    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: false,
    },

    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showTitle,
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: (props) => !props.showTitle,
    },
})
