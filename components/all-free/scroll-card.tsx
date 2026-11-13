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
    motion,
    useMotionValue,
    useTransform,
    useInView,
    useReducedMotion,
} from "framer-motion"

interface Picture {
    src: string
    srcSet?: string
    alt?: string
}
interface Slide {
    title?: string
    description?: string
    background?: string
    textColor?: string
    media?: "image" | "video"
    image?: Picture
    video?: string
    videoURL?: string
    poster?: Picture
    mediaBackground?: string
    fit?: "cover" | "contain"
    positionX?: number
    positionY?: number
    link?: string
    linkLabel?: string
}
interface Layout {
    split?: number
    mediaSide?: "right" | "left"
    padding?: number
    mobilePadding?: number
    gap?: number
    radius?: number
    descriptionWidth?: number
}
interface Interaction {
    distance?: number
    snap?: boolean
    direction?: "up" | "down"
    navigation?: boolean
    wheelEscape?: boolean
    videoPlay?: boolean
    videoLoop?: boolean
    videoControls?: boolean
}
interface OppositeScrollProps {
    slides?: Slide[]
    layout?: Layout
    interaction?: Interaction
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    linkFont?: React.CSSProperties
    navigationColor?: string
    navigationBackground?: string
    previewSlide?: number
    label?: string
    onSlideChange?: () => void
    style?: React.CSSProperties
}
const defaults: Slide[] = [
    {
        title: "Objects of tomorrow",
        description:
            "A study in form, texture, and everyday possibility. Scroll to explore the collection.",
        background: "#111111",
        textColor: "#FFFFFF",
        media: "image",
    },
    {
        title: "A different perspective",
        description:
            "Give every story its own space. Pair your words with an image or a moving moment.",
        background: "#F0EDE8",
        textColor: "#171717",
        media: "image",
    },
    {
        title: "Made to move",
        description:
            "Thoughtful details. Unexpected combinations. Add as many chapters as your story needs.",
        background: "#252C26",
        textColor: "#FFFFFF",
        media: "image",
    },
    {
        title: "Keep exploring",
        description:
            "Your next idea starts here. Edit every slide directly in the Framer properties panel.",
        background: "#E7DEEF",
        textColor: "#23182C",
        media: "image",
    },
]
const fallbackImages = [
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
]
const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

function SlideMedia({
    slide,
    index,
    playing,
    loop,
    controls,
}: {
    slide: Slide
    index: number
    playing: boolean
    loop: boolean
    controls: boolean
}) {
    const video = React.useRef<HTMLVideoElement>(null)
    const [failed, setFailed] = React.useState(false)
    const src = slide.video || slide.videoURL || ""
    React.useEffect(() => {
        setFailed(false)
    }, [src, slide.image?.src])
    React.useEffect(() => {
        const element = video.current
        if (!element) return
        if (playing) {
            element.play().catch(() => {})
        } else {
            element.pause()
        }
        return () => element.pause()
    }, [playing, src, failed])
    const image = slide.image || {
        src: fallbackImages[index % fallbackImages.length],
        alt: "Abstract color gradient",
    }
    const style: React.CSSProperties = {
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: slide.fit || "cover",
        objectPosition: `${slide.positionX ?? 50}% ${slide.positionY ?? 50}%`,
    }
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: slide.mediaBackground || "#E6E6E6",
            }}
        >
            {failed || (slide.media === "video" && !src) ? (
                <div
                    style={{
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        padding: 24,
                        boxSizing: "border-box",
                        color: "#333",
                        font: "14px/1.4 sans-serif",
                        textAlign: "center",
                    }}
                >
                    {slide.media === "video"
                        ? "Add a video file or direct video URL"
                        : "Image unavailable"}
                </div>
            ) : slide.media === "video" ? (
                <video
                    ref={video}
                    src={src}
                    poster={slide.poster?.src}
                    muted
                    playsInline
                    loop={loop}
                    controls={controls}
                    preload="metadata"
                    aria-label={slide.title || `Slide ${index + 1} video`}
                    style={style}
                    onError={() => setFailed(true)}
                />
            ) : (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={image.alt || ""}
                    sizes="(max-width: 600px) 50vw, 60vw"
                    draggable={false}
                    style={style}
                    onError={() => setFailed(true)}
                />
            )}
        </div>
    )
}

/**
 * Opposite Scroll — text and media travel in opposite directions.
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 640
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function OppositeScroll(props: OppositeScrollProps) {
    const {
        slides = defaults,
        layout = {},
        interaction = {},
        titleFont = {
            fontFamily: "sans-serif",
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
        bodyFont = {
            fontFamily: "sans-serif",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        linkFont = {
            fontFamily: "sans-serif",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        navigationColor = "#FFFFFF",
        navigationBackground = "#171717",
        previewSlide = 1,
        label = "Opposite scroll gallery",
        onSlideChange,
        style,
    } = props
    const {
        split = 50,
        mediaSide = "right",
        padding = 32,
        mobilePadding = 16,
        gap = 0,
        radius = 0,
        descriptionWidth = 330,
    } = layout
    const {
        distance = 100,
        snap = false,
        direction = "up",
        navigation = true,
        wheelEscape = true,
        videoPlay = true,
        videoLoop = true,
        videoControls = false,
    } = interaction
    const root = React.useRef<HTMLDivElement>(null)
    const scroller = React.useRef<HTMLDivElement>(null)
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const inView = useInView(root, { amount: 0.05 })
    const [visible, setVisible] = React.useState(true)
    const [size, setSize] = React.useState({ width: 1000, height: 640 })
    const [active, setActive] = React.useState(0)
    const [focused, setFocused] = React.useState(false)
    const progress = useMotionValue(0)
    const count = slides.length
    const last = Math.max(0, count - 1)
    const initial = clamp(Math.round(previewSlide) - 1, 0, last)
    const stride = (size.height * clamp(distance, 25, 300)) / 100
    const textY = useTransform(
        progress,
        (p) => -(direction === "up" ? p : last - p) * size.height
    )
    const mediaY = useTransform(
        progress,
        (p) => -(direction === "up" ? last - p : p) * size.height
    )
    const callback = React.useRef(onSlideChange)
    callback.current = onSlideChange
    const activeRef = React.useRef(initial)
    const items = direction === "up" ? slides : [...slides].reverse()
    const mediaItems = [...items].reverse()
    const pad = size.width < 600 ? mobilePadding : padding
    const id = React.useId()

    React.useEffect(() => {
        const element = root.current
        if (!element || typeof ResizeObserver === "undefined") return
        const measure = () => {
            const width = element.clientWidth
            const height = element.clientHeight
            if (width && height)
                setSize((old) =>
                    old.width === width && old.height === height
                        ? old
                        : { width, height }
                )
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [])
    React.useEffect(() => {
        if (typeof document === "undefined") return
        const update = () => setVisible(!document.hidden)
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])
    // Preserve the selected slide on resize; reset only when the preview selection or slide count changes.
    React.useEffect(() => {
        activeRef.current = initial
        setActive(initial)
        progress.set(initial)
        if (scroller.current) scroller.current.scrollTop = initial * stride
    }, [initial, count])
    React.useEffect(() => {
        if (scroller.current)
            scroller.current.scrollTop = activeRef.current * stride
        progress.set(activeRef.current)
    }, [stride, direction, progress])

    function goTo(index: number) {
        if (staticRenderer) return
        scroller.current?.scrollTo({
            top: clamp(index, 0, last) * stride,
            behavior: reducedMotion ? "auto" : "smooth",
        })
    }
    function handleScroll() {
        const p = clamp(
            (scroller.current?.scrollTop || 0) / Math.max(1, stride),
            0,
            last
        )
        const selected = clamp(Math.round(p), 0, last)
        progress.set(reducedMotion ? selected : p)
        if (selected !== activeRef.current) {
            activeRef.current = selected
            React.startTransition(() => setActive(selected))
            callback.current?.()
        }
    }
    const displayActive = staticRenderer ? initial : active
    const panelStyle: React.CSSProperties = {
        width: "100%",
        height: size.height,
        flexShrink: 0,
        boxSizing: "border-box",
    }
    const textTrackStyle = staticRenderer
        ? { y: -(direction === "up" ? initial : last - initial) * size.height }
        : { y: textY }
    const mediaTrackStyle = staticRenderer
        ? { y: -(direction === "up" ? last - initial : initial) * size.height }
        : { y: mediaY }
    const navButton: React.CSSProperties = {
        border: 0,
        width: 36,
        height: 36,
        borderRadius: 100,
        background: navigationBackground,
        color: navigationColor,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        padding: 0,
    }
    return (
        <section
            ref={root}
            aria-label={label}
            aria-roledescription="carousel"
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
                overflow: "hidden",
                borderRadius: radius,
                background: slides[displayActive]?.background || "#111",
            }}
        >
            {count === 0 ? (
                <div
                    style={{
                        padding: 24,
                        color: "white",
                        font: "15px sans-serif",
                    }}
                >
                    Add slides in the properties panel.
                </div>
            ) : (
                <>
                    <div
                        ref={scroller}
                        role="region"
                        aria-label="Slides. Scroll or use arrow keys to explore."
                        tabIndex={staticRenderer ? -1 : 0}
                        onScroll={staticRenderer ? undefined : handleScroll}
                        onFocusCapture={() => setFocused(true)}
                        onBlurCapture={(e) => {
                            if (
                                !e.currentTarget.contains(
                                    e.relatedTarget as Node
                                )
                            )
                                setFocused(false)
                        }}
                        onKeyDown={(e) => {
                            if (e.target !== e.currentTarget) return
                            const next =
                                e.key === "ArrowDown" || e.key === "PageDown"
                                    ? activeRef.current + 1
                                    : e.key === "ArrowUp" || e.key === "PageUp"
                                      ? activeRef.current - 1
                                      : e.key === "Home"
                                        ? 0
                                        : e.key === "End"
                                          ? last
                                          : null
                            if (next !== null) {
                                e.preventDefault()
                                goTo(next)
                            }
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflowX: "hidden",
                            overflowY: staticRenderer ? "hidden" : "auto",
                            scrollbarWidth: "none",
                            overscrollBehaviorY: wheelEscape
                                ? "auto"
                                : "contain",
                            scrollSnapType: snap ? "y mandatory" : "none",
                            outline: focused
                                ? `2px solid ${navigationColor}`
                                : "none",
                            outlineOffset: -2,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                height: size.height + last * stride,
                            }}
                        >
                            <div
                                style={{
                                    position: "sticky",
                                    top: 0,
                                    height: size.height,
                                    display: "flex",
                                    flexDirection:
                                        mediaSide === "right"
                                            ? "row"
                                            : "row-reverse",
                                    gap,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `calc((100% - ${gap}px) * ${clamp(split, 20, 80) / 100})`,
                                        height: "100%",
                                        overflow: "hidden",
                                        flexShrink: 0,
                                    }}
                                >
                                    <motion.div style={textTrackStyle}>
                                        {items.map((slide, i) => {
                                            const original =
                                                direction === "up"
                                                    ? i
                                                    : last - i
                                            const selected =
                                                original === displayActive
                                            return (
                                                <article
                                                    key={i}
                                                    aria-hidden={!selected}
                                                    aria-label={`${original + 1} of ${count}`}
                                                    aria-roledescription="slide"
                                                    style={{
                                                        ...panelStyle,
                                                        background:
                                                            slide.background ||
                                                            "#111111",
                                                        color:
                                                            slide.textColor ||
                                                            "#FFFFFF",
                                                        padding: pad,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent:
                                                            "space-between",
                                                        gap: 24,
                                                        overflowY: "auto",
                                                    }}
                                                >
                                                    <h2
                                                        style={{
                                                            margin: 0,
                                                            overflowWrap:
                                                                "anywhere",
                                                            ...titleFont,
                                                        }}
                                                    >
                                                        {slide.title}
                                                    </h2>
                                                    <div
                                                        style={{
                                                            maxWidth:
                                                                descriptionWidth,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                margin: 0,
                                                                whiteSpace:
                                                                    "pre-wrap",
                                                                overflowWrap:
                                                                    "anywhere",
                                                                ...bodyFont,
                                                            }}
                                                        >
                                                            {slide.description}
                                                        </p>
                                                        {slide.link && (
                                                            <a
                                                                href={
                                                                    slide.link
                                                                }
                                                                tabIndex={
                                                                    selected
                                                                        ? 0
                                                                        : -1
                                                                }
                                                                style={{
                                                                    display:
                                                                        "inline-block",
                                                                    marginTop: 20,
                                                                    color: "inherit",
                                                                    textUnderlineOffset: 4,
                                                                    ...linkFont,
                                                                }}
                                                            >
                                                                {slide.linkLabel ||
                                                                    "Explore"}{" "}
                                                                ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                </article>
                                            )
                                        })}
                                    </motion.div>
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        height: "100%",
                                        overflow: "hidden",
                                    }}
                                >
                                    <motion.div style={mediaTrackStyle}>
                                        {mediaItems.map((slide, i) => {
                                            const original =
                                                direction === "up"
                                                    ? last - i
                                                    : i
                                            return (
                                                <div
                                                    key={i}
                                                    aria-hidden={
                                                        original !==
                                                        displayActive
                                                    }
                                                    style={panelStyle}
                                                >
                                                    <SlideMedia
                                                        slide={slide}
                                                        index={original}
                                                        playing={
                                                            !staticRenderer &&
                                                            !reducedMotion &&
                                                            inView &&
                                                            visible &&
                                                            videoPlay &&
                                                            original === active
                                                        }
                                                        loop={videoLoop}
                                                        controls={
                                                            original ===
                                                                displayActive &&
                                                            (videoControls ||
                                                                !!reducedMotion ||
                                                                !videoPlay)
                                                        }
                                                    />
                                                </div>
                                            )
                                        })}
                                    </motion.div>
                                </div>
                            </div>
                            {Array.from({ length: count }, (_, i) => (
                                <div
                                    key={i}
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        top: i * stride,
                                        width: 1,
                                        height: 1,
                                        pointerEvents: "none",
                                        scrollSnapAlign: "start",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    {navigation && count > 1 && (
                        <nav
                            aria-label="Slide navigation"
                            style={{
                                position: "absolute",
                                right: 14,
                                bottom: 14,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: 5,
                                borderRadius: 100,
                                background: navigationBackground,
                                color: navigationColor,
                            }}
                        >
                            <button
                                type="button"
                                aria-label="Previous slide"
                                disabled={displayActive === 0 || staticRenderer}
                                onClick={() => goTo(activeRef.current - 1)}
                                style={{
                                    ...navButton,
                                    opacity: displayActive === 0 ? 0.35 : 1,
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    aria-hidden="true"
                                >
                                    <path d="m6 14 6-6 6 6" />
                                </svg>
                            </button>
                            <span
                                id={id}
                                style={{
                                    ...linkFont,
                                    minWidth: 38,
                                    textAlign: "center",
                                }}
                            >
                                {displayActive + 1} / {count}
                            </span>
                            <button
                                type="button"
                                aria-label="Next slide"
                                disabled={
                                    displayActive === last || staticRenderer
                                }
                                onClick={() => goTo(activeRef.current + 1)}
                                style={{
                                    ...navButton,
                                    opacity: displayActive === last ? 0.35 : 1,
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    aria-hidden="true"
                                >
                                    <path d="m6 10 6 6 6-6" />
                                </svg>
                            </button>
                        </nav>
                    )}
                    <span
                        aria-live="polite"
                        aria-atomic="true"
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            overflow: "hidden",
                            clipPath: "inset(50%)",
                        }}
                    >{`Slide ${displayActive + 1} of ${count}: ${slides[displayActive]?.title || ""}`}</span>
                </>
            )}
        </section>
    )
}

addPropertyControls(OppositeScroll, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        defaultValue: defaults,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New chapter",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Tell your story here.",
                },
                background: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#111111",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text",
                    defaultValue: "#FFFFFF",
                },
                media: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p) => p.media === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video File",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p) => p.media !== "video",
                },
                videoURL: {
                    type: ControlType.String,
                    title: "Video URL",
                    defaultValue: "",
                    placeholder: "https://…/video.mp4",
                    description:
                        "Direct video URL. Uploaded files take priority. Use MP4 or WebM for broad browser support.",
                    hidden: (p) => p.media !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (p) => p.media !== "video",
                },
                mediaBackground: {
                    type: ControlType.Color,
                    title: "Media BG",
                    defaultValue: "#E6E6E6",
                },
                fit: {
                    type: ControlType.Enum,
                    title: "Media Fit",
                    options: ["cover", "contain"],
                    defaultValue: "cover",
                },
                positionX: {
                    type: ControlType.Number,
                    title: "Focal X",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    unit: "%",
                },
                positionY: {
                    type: ControlType.Number,
                    title: "Focal Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    unit: "%",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                },
                linkLabel: {
                    type: ControlType.String,
                    title: "Link Label",
                    defaultValue: "Explore",
                    hidden: (p) => !p.link,
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            split: {
                type: ControlType.Number,
                title: "Text Width",
                min: 20,
                max: 80,
                defaultValue: 50,
                unit: "%",
            },
            mediaSide: {
                type: ControlType.Enum,
                title: "Media Side",
                options: ["left", "right"],
                defaultValue: "right",
                displaySegmentedControl: true,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 120,
                defaultValue: 32,
                unit: "px",
            },
            mobilePadding: {
                type: ControlType.Number,
                title: "Small Padding",
                min: 0,
                max: 48,
                defaultValue: 16,
                unit: "px",
                description: "Used when the component is narrower than 600px.",
            },
            gap: {
                type: ControlType.Number,
                title: "Column Gap",
                min: 0,
                max: 48,
                defaultValue: 0,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                defaultValue: 0,
                unit: "px",
            },
            descriptionWidth: {
                type: ControlType.Number,
                title: "Body Width",
                min: 80,
                max: 800,
                defaultValue: 330,
                unit: "px",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        icon: "interaction",
        controls: {
            distance: {
                type: ControlType.Number,
                title: "Scroll Distance",
                min: 25,
                max: 300,
                defaultValue: 100,
                unit: "%",
                description:
                    "Scroll needed per slide. Larger values move the panels more slowly.",
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap to Slide",
                defaultValue: false,
            },
            direction: {
                type: ControlType.Enum,
                title: "Text Direction",
                options: ["up", "down"],
                optionTitles: ["Up", "Down"],
                defaultValue: "up",
            },
            navigation: {
                type: ControlType.Boolean,
                title: "Navigation",
                defaultValue: true,
            },
            wheelEscape: {
                type: ControlType.Boolean,
                title: "Continue Page",
                defaultValue: true,
                description:
                    "Allow page scrolling when the gallery reaches either end.",
            },
            videoPlay: {
                type: ControlType.Boolean,
                title: "Play Videos",
                defaultValue: true,
                description:
                    "Muted playback on the active slide in Preview. Pauses offscreen. Reduced-motion preferences disable autoplay.",
            },
            videoLoop: {
                type: ControlType.Boolean,
                title: "Loop Videos",
                defaultValue: true,
            },
            videoControls: {
                type: ControlType.Boolean,
                title: "Video Controls",
                defaultValue: false,
                description:
                    "Playback controls also appear when autoplay is disabled or reduced motion is preferred.",
            },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link / Nav Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    navigationColor: {
        type: ControlType.Color,
        title: "Nav Text",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.interaction?.navigation === false,
    },
    navigationBackground: {
        type: ControlType.Color,
        title: "Nav Background",
        defaultValue: "#171717",
        hidden: (p) => p.interaction?.navigation === false,
    },
    previewSlide: {
        type: ControlType.Number,
        title: "Start Slide",
        defaultValue: 1,
        min: 1,
        step: 1,
        displayStepper: true,
        description:
            "Sets the canvas preview and initial slide. Clamped to your slide count.",
    },
    label: {
        type: ControlType.String,
        title: "Accessible Name",
        defaultValue: "Opposite scroll gallery",
    },
    onSlideChange: { type: ControlType.EventHandler, title: "Slide Changed" },
})
