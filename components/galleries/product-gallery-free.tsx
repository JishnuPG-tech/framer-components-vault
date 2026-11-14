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
 * Product Gallery Free v1.3.1 Static Safe
 * Free gallery for images and uploaded local videos with thumbnails, swipe, dots, and mobile controls
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

type MediaItem = {
    type?: "image" | "video"
    image?: string
    video?: string
    poster?: string
    alt?: string
    caption?: string
}
type Ratio = "1 / 1" | "4 / 5" | "3 / 4" | "4 / 3" | "16 / 9"
type Position = "left" | "right" | "top" | "bottom"

type Props = {
    media: MediaItem[]
    startingItem: number
    thumbnailPosition: Position
    autoMobileLayout: boolean
    mobileBreakpoint: number
    mobileThumbnailPosition: "top" | "bottom"
    mobileShowThumbnails: boolean
    mobileShowArrows: boolean
    mobileShowCounter: boolean
    mobileShowDots: boolean
    thumbnailSize: number
    thumbnailGap: number
    galleryGap: number
    aspectRatio: Ratio
    mobileAspectRatio: Ratio
    imageFit: "cover" | "contain"
    showArrows: boolean
    showCounter: boolean
    showCaptions: boolean
    showDots: boolean
    loopNavigation: boolean
    keyboardNavigation: boolean
    enableSwipe: boolean
    swipeThreshold: number
    dotSize: number
    dotGap: number
    mainRadius: number
    thumbnailRadius: number
    borderWidth: number
    mediaBackground: string
    borderColor: string
    activeBorderColor: string
    arrowBackground: string
    arrowColor: string
    counterBackground: string
    counterColor: string
    captionBackground: string
    captionColor: string
    dotColor: string
    activeDotColor: string
    autoplayVideo: boolean
    mutedVideo: boolean
    loopVideo: boolean
    showVideoControls: boolean
    restartVideo: boolean
    transitionDuration: number
    style?: React.CSSProperties
}

const demo: MediaItem[] = [
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85",
        alt: "Product front view",
        caption: "Front view",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
        alt: "Product detail view",
        caption: "Detail view",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=1200&q=85",
        alt: "Product side view",
        caption: "Side view",
    },
]

export default function ProProductGallery(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()
    const items =
        Array.isArray(props.media) && props.media.length ? props.media : demo
    const initial = Math.min(
        Math.max(Math.round(props.startingItem) - 1, 0),
        items.length - 1
    )
    const [active, setActive] = React.useState(initial)
    const [width, setWidth] = React.useState(0)
    const [reduceMotion, setReduceMotion] = React.useState(false)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const thumbRefs = React.useRef<Array<HTMLButtonElement | null>>([])
    const pointerRef = React.useRef<{ x: number; y: number } | null>(null)

    React.useEffect(() => setActive(initial), [initial])
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduceMotion(query.matches)
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [])
    React.useEffect(
        () => setActive((i) => Math.min(i, Math.max(items.length - 1, 0))),
        [items.length]
    )
    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => setWidth(el.getBoundingClientRect().width)
        measure()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const mobile =
        props.autoMobileLayout && width > 0 && width <= props.mobileBreakpoint
    const position: Position = mobile
        ? props.mobileThumbnailPosition
        : props.thumbnailPosition
    const horizontal = position === "top" || position === "bottom"
    const current = items[active] || items[0]
    const ratio = mobile ? props.mobileAspectRatio : props.aspectRatio
    const arrows = mobile ? props.mobileShowArrows : props.showArrows
    const counter = mobile ? props.mobileShowCounter : props.showCounter
    const dots = props.showDots && (!mobile || props.mobileShowDots)
    const thumbnails = !mobile || props.mobileShowThumbnails
    const motionDuration =
        isStaticRenderer || reduceMotion ? 0 : props.transitionDuration

    function select(index: number) {
        if (index < 0 || index >= items.length || index === active) return
        setActive(index)
    }
    function previous() {
        if (items.length <= 1) return
        if (active > 0) select(active - 1)
        else if (props.loopNavigation) select(items.length - 1)
    }
    function next() {
        if (items.length <= 1) return
        if (active < items.length - 1) select(active + 1)
        else if (props.loopNavigation) select(0)
    }
    function keyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (!props.keyboardNavigation) return
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            previous()
        }
        if (e.key === "ArrowRight") {
            e.preventDefault()
            next()
        }
        if (e.key === "Home") {
            e.preventDefault()
            select(0)
        }
        if (e.key === "End") {
            e.preventDefault()
            select(items.length - 1)
        }
    }
    function pointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (props.enableSwipe)
            pointerRef.current = { x: e.clientX, y: e.clientY }
    }
    function pointerUp(e: React.PointerEvent<HTMLDivElement>) {
        const start = pointerRef.current
        pointerRef.current = null
        if (!props.enableSwipe || !start) return
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        if (Math.abs(dx) < props.swipeThreshold || Math.abs(dx) <= Math.abs(dy))
            return
        dx < 0 ? next() : previous()
    }

    const thumbs = (
        <div
            role="tablist"
            aria-label="Product media"
            style={{
                display: "flex",
                flexDirection: horizontal ? "row" : "column",
                gap: props.thumbnailGap,
                width: horizontal ? "100%" : props.thumbnailSize,
                height: horizontal ? props.thumbnailSize : "auto",
                minWidth: horizontal ? 0 : props.thumbnailSize,
                minHeight: horizontal ? props.thumbnailSize : 0,
                overflowX: horizontal ? "auto" : "hidden",
                overflowY: horizontal ? "hidden" : "auto",
                overscrollBehavior: "contain",
                scrollbarWidth: "none",
            }}
        >
            {items.map((item, i) => {
                const selected = i === active
                return (
                    <button
                        key={`${item.image || "empty"}-${i}`}
                        ref={(el) => {
                            thumbRefs.current[i] = el
                        }}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-label={`Show image ${i + 1}`}
                        onClick={() => select(i)}
                        style={{
                            position: "relative",
                            flex: `0 0 ${props.thumbnailSize}px`,
                            width: props.thumbnailSize,
                            height: props.thumbnailSize,
                            padding: 0,
                            margin: 0,
                            overflow: "hidden",
                            cursor: "pointer",
                            borderRadius: props.thumbnailRadius,
                            border: `${props.borderWidth}px solid ${selected ? props.activeBorderColor : props.borderColor}`,
                            background: props.mediaBackground,
                            opacity: isStaticRenderer ? 1 : selected ? 1 : 0.72,
                            transform: isStaticRenderer
                                ? "none"
                                : selected
                                  ? "scale(1)"
                                  : "scale(.985)",
                            transition: isStaticRenderer
                                ? "none"
                                : "opacity 180ms ease, border-color 180ms ease, transform 180ms ease",
                            outlineOffset: 2,
                        }}
                    >
                        {item.type === "video" ? (
                            <>
                                {item.poster ? (
                                    <img
                                        src={item.poster}
                                        alt={
                                            item.alt || `Video poster ${i + 1}`
                                        }
                                        draggable={false}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            objectFit: props.imageFit,
                                            userSelect: "none",
                                        }}
                                    />
                                ) : (
                                    <VideoPlaceholder />
                                )}
                                <PlayBadge />
                            </>
                        ) : item.image ? (
                            <img
                                src={item.image}
                                alt={item.alt || `Product image ${i + 1}`}
                                draggable={false}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: props.imageFit,
                                    userSelect: "none",
                                }}
                            />
                        ) : (
                            <Empty />
                        )}
                    </button>
                )
            })}
        </div>
    )

    const media = (
        <div
            onPointerDown={pointerDown}
            onPointerUp={pointerUp}
            onPointerCancel={() => {
                pointerRef.current = null
            }}
            style={{
                position: "relative",
                flex: horizontal ? "0 0 auto" : "1 1 0",
                width: "100%",
                minWidth: 0,
                aspectRatio: ratio,
                overflow: "hidden",
                touchAction: props.enableSwipe ? "pan-y" : "auto",
                borderRadius: props.mainRadius,
                border: `${props.borderWidth}px solid ${props.borderColor}`,
                background: props.mediaBackground,
            }}
        >
            {current?.type === "video" && isStaticRenderer ? (
                current.poster ? (
                    <div
                        role="img"
                        aria-label={
                            current.alt || `Product video poster ${active + 1}`
                        }
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            background: props.mediaBackground,
                        }}
                    >
                        <img
                            src={current.poster}
                            alt={
                                current.alt ||
                                `Product video poster ${active + 1}`
                            }
                            draggable={false}
                            style={{
                                display: "block",
                                width: "100%",
                                height: "100%",
                                objectFit: props.imageFit,
                                userSelect: "none",
                            }}
                        />
                        <PlayBadge />
                    </div>
                ) : (
                    <VideoPlaceholder large />
                )
            ) : current?.type === "video" && current.video ? (
                <video
                    key={`video-${active}-${current.video}`}
                    src={current.video}
                    poster={current.poster}
                    aria-label={current.alt || `Product video ${active + 1}`}
                    muted={props.mutedVideo}
                    loop={isStaticRenderer ? false : props.loopVideo}
                    controls={props.showVideoControls}
                    autoPlay={isStaticRenderer ? false : props.autoplayVideo}
                    playsInline
                    preload={isStaticRenderer ? "none" : "metadata"}
                    disablePictureInPicture={!props.showVideoControls}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: props.imageFit,
                        opacity: 1,
                        background: props.mediaBackground,
                    }}
                />
            ) : current?.type === "video" ? (
                <VideoPlaceholder large />
            ) : current?.image ? (
                <img
                    key={`image-${active}-${current.image}`}
                    src={current.image}
                    alt={current.alt || `Product image ${active + 1}`}
                    draggable={false}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: props.imageFit,
                        opacity: 1,
                        transform: "scale(1)",
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                />
            ) : (
                <Empty />
            )}
            {arrows && items.length > 1 && (
                <>
                    <Arrow
                        previous
                        disabled={!props.loopNavigation && active === 0}
                        bg={props.arrowBackground}
                        color={props.arrowColor}
                        click={previous}
                    />
                    <Arrow
                        previous={false}
                        disabled={
                            !props.loopNavigation && active === items.length - 1
                        }
                        bg={props.arrowBackground}
                        color={props.arrowColor}
                        click={next}
                    />
                </>
            )}
            {counter && items.length > 1 && (
                <div
                    aria-live="polite"
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        minWidth: 48,
                        height: 30,
                        padding: "0 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 999,
                        background: props.counterBackground,
                        color: props.counterColor,
                        font: "600 12px Inter, system-ui, sans-serif",
                        pointerEvents: "none",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    {active + 1} / {items.length}
                </div>
            )}
            {dots && items.length > 1 && (
                <div
                    role="tablist"
                    aria-label="Choose product image"
                    style={{
                        position: "absolute",
                        zIndex: 3,
                        left: "50%",
                        bottom:
                            props.showCaptions && current?.caption ? 54 : 14,
                        display: "flex",
                        gap: props.dotGap,
                        transform: "translateX(-50%)",
                    }}
                >
                    {items.map((_, i) => (
                        <button
                            key={`dot-${i}`}
                            type="button"
                            role="tab"
                            aria-selected={i === active}
                            aria-label={`Show image ${i + 1}`}
                            onClick={() => select(i)}
                            style={{
                                width: props.dotSize,
                                height: props.dotSize,
                                padding: 0,
                                border: 0,
                                borderRadius: 999,
                                background:
                                    i === active
                                        ? props.activeDotColor
                                        : props.dotColor,
                                cursor: "pointer",
                                transform: isStaticRenderer
                                    ? "none"
                                    : i === active
                                      ? "scale(1.15)"
                                      : "scale(1)",
                                transition: isStaticRenderer
                                    ? "none"
                                    : "background 160ms ease, transform 160ms ease",
                            }}
                        />
                    ))}
                </div>
            )}
            {props.showCaptions && current?.caption && (
                <div
                    style={{
                        position: "absolute",
                        left: 14,
                        bottom: 14,
                        maxWidth: "calc(100% - 28px)",
                        padding: "8px 11px",
                        borderRadius: 8,
                        background: props.captionBackground,
                        color: props.captionColor,
                        font: "12px/1.35 Inter, system-ui, sans-serif",
                        pointerEvents: "none",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    {current.caption}
                </div>
            )}
        </div>
    )

    return (
        <div
            ref={rootRef}
            tabIndex={props.keyboardNavigation ? 0 : -1}
            onKeyDown={keyDown}
            aria-label="Product gallery"
            style={{
                ...props.style,
                display: "flex",
                flexDirection:
                    position === "left"
                        ? "row"
                        : position === "right"
                          ? "row-reverse"
                          : position === "top"
                            ? "column"
                            : "column-reverse",
                alignItems: "stretch",
                width: "100%",
                height: "auto",
                minWidth: 0,
                gap: props.galleryGap,
                position: "relative",
                outline: "none",
            }}
        >
            {thumbnails && thumbs}
            {media}
        </div>
    )
}

function Arrow({
    previous = true,
    disabled,
    bg,
    color,
    click,
}: {
    previous?: boolean
    disabled: boolean
    bg: string
    color: string
    click: () => void
}) {
    return (
        <button
            type="button"
            aria-label={previous ? "Previous image" : "Next image"}
            disabled={disabled}
            onClick={click}
            style={{
                position: "absolute",
                zIndex: 2,
                top: "50%",
                left: previous ? 12 : undefined,
                right: previous ? undefined : 12,
                width: 42,
                height: 42,
                padding: 0,
                border: 0,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: bg,
                color,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.3 : 1,
                transform: "translateY(-50%)",
                boxShadow: "0 6px 24px rgba(0,0,0,.14)",
                backdropFilter: "blur(10px)",
            }}
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d={previous ? "M15 18L9 12L15 6" : "M9 6L15 12L9 18"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
}
function PlayBadge() {
    return (
        <span
            aria-hidden="true"
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%,-50%)",
                width: 28,
                height: 28,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                background: "rgba(0,0,0,.58)",
                boxShadow: "0 3px 12px rgba(0,0,0,.2)",
                pointerEvents: "none",
            }}
        >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 2.1v7.8L9.5 6 3 2.1Z" />
            </svg>
        </span>
    )
}
function VideoPlaceholder({ large = false }: { large?: boolean }) {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: large ? 160 : 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg,#252525,#111)",
                color: "#fff",
                font: "12px Inter,system-ui,sans-serif",
            }}
        >
            <span>{large ? "Add video file" : "Video"}</span>
            <PlayBadge />
        </div>
    )
}
function Empty() {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg,#f3f3f3,#e8e8e8)",
                color: "#777",
                font: "12px Inter,system-ui,sans-serif",
            }}
        >
            Add image
        </div>
    )
}

ProProductGallery.defaultProps = {
    media: demo,
    startingItem: 1,
    thumbnailPosition: "left",
    autoMobileLayout: false,
    mobileBreakpoint: 600,
    mobileThumbnailPosition: "bottom",
    mobileShowThumbnails: true,
    mobileShowArrows: false,
    mobileShowCounter: true,
    mobileShowDots: true,
    thumbnailSize: 72,
    thumbnailGap: 8,
    galleryGap: 12,
    aspectRatio: "4 / 5",
    mobileAspectRatio: "1 / 1",
    imageFit: "cover",
    showArrows: true,
    showCounter: true,
    showCaptions: true,
    showDots: false,
    loopNavigation: true,
    keyboardNavigation: true,
    enableSwipe: true,
    swipeThreshold: 45,
    dotSize: 7,
    dotGap: 7,
    mainRadius: 16,
    thumbnailRadius: 10,
    borderWidth: 1,
    mediaBackground: "#f3f3f3",
    borderColor: "rgba(0,0,0,.10)",
    activeBorderColor: "#111",
    arrowBackground: "rgba(255,255,255,.90)",
    arrowColor: "#111",
    counterBackground: "rgba(0,0,0,.60)",
    counterColor: "#fff",
    captionBackground: "rgba(0,0,0,.58)",
    captionColor: "#fff",
    dotColor: "rgba(255,255,255,.55)",
    activeDotColor: "#fff",
    autoplayVideo: false,
    mutedVideo: true,
    loopVideo: false,
    showVideoControls: true,
    restartVideo: true,
    transitionDuration: 260,
}

const ratios = ["1 / 1", "4 / 5", "3 / 4", "4 / 3", "16 / 9"]
const ratioNames = ["Square", "Portrait", "Tall", "Landscape", "Wide"]
addPropertyControls(ProProductGallery, {
    media: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (item: MediaItem) => item.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (item: MediaItem) => item.type !== "video",
                },
                poster: {
                    type: ControlType.Image,
                    title: "Poster",
                    hidden: (item: MediaItem) => item.type !== "video",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Product media",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                },
            },
        },
        defaultValue: demo,
    },
    startingItem: {
        type: ControlType.Number,
        title: "Start Item",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 1,
        displayStepper: true,
    },
    thumbnailPosition: {
        type: ControlType.Enum,
        title: "Thumbnails",
        options: ["left", "right", "top", "bottom"],
        optionTitles: ["Left", "Right", "Top", "Bottom"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    autoMobileLayout: {
        type: ControlType.Boolean,
        title: "Auto Mobile",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile At",
        min: 240,
        max: 1000,
        step: 10,
        defaultValue: 600,
        unit: "px",
        hidden: (p) => !p.autoMobileLayout,
    },
    mobileThumbnailPosition: {
        type: ControlType.Enum,
        title: "Mobile Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
        hidden: (p) => !p.autoMobileLayout,
    },
    mobileShowThumbnails: {
        type: ControlType.Boolean,
        title: "Mobile Thumbs",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
        hidden: (p) => !p.autoMobileLayout,
    },
    mobileShowArrows: {
        type: ControlType.Boolean,
        title: "Mobile Arrows",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: false,
        hidden: (p) => !p.autoMobileLayout,
    },
    mobileShowCounter: {
        type: ControlType.Boolean,
        title: "Mobile Count",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
        hidden: (p) => !p.autoMobileLayout,
    },
    mobileShowDots: {
        type: ControlType.Boolean,
        title: "Mobile Dots",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
        hidden: (p) => !p.autoMobileLayout || !p.showDots,
    },
    thumbnailSize: {
        type: ControlType.Number,
        title: "Thumb Size",
        min: 40,
        max: 160,
        step: 1,
        defaultValue: 72,
        unit: "px",
    },
    thumbnailGap: {
        type: ControlType.Number,
        title: "Thumb Gap",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 8,
        unit: "px",
    },
    galleryGap: {
        type: ControlType.Number,
        title: "Gallery Gap",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 12,
        unit: "px",
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Ratio",
        options: ratios,
        optionTitles: ratioNames,
        defaultValue: "4 / 5",
    },
    mobileAspectRatio: {
        type: ControlType.Enum,
        title: "Mobile Ratio",
        options: ratios,
        optionTitles: ratioNames,
        defaultValue: "1 / 1",
        hidden: (p) => !p.autoMobileLayout,
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Media Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    showCaptions: {
        type: ControlType.Boolean,
        title: "Captions",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: false,
    },
    enableSwipe: {
        type: ControlType.Boolean,
        title: "Swipe",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    swipeThreshold: {
        type: ControlType.Number,
        title: "Swipe Min",
        min: 20,
        max: 120,
        step: 5,
        defaultValue: 45,
        unit: "px",
        hidden: (p) => !p.enableSwipe,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 4,
        max: 18,
        step: 1,
        defaultValue: 7,
        unit: "px",
        hidden: (p) => !p.showDots,
    },
    dotGap: {
        type: ControlType.Number,
        title: "Dot Gap",
        min: 2,
        max: 20,
        step: 1,
        defaultValue: 7,
        unit: "px",
        hidden: (p) => !p.showDots,
    },
    loopNavigation: {
        type: ControlType.Boolean,
        title: "Loop",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },
    keyboardNavigation: {
        type: ControlType.Boolean,
        title: "Keyboard",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    mainRadius: {
        type: ControlType.Number,
        title: "Main Radius",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 16,
        unit: "px",
    },
    thumbnailRadius: {
        type: ControlType.Number,
        title: "Thumb Radius",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 10,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        min: 0,
        max: 8,
        step: 1,
        defaultValue: 1,
        unit: "px",
    },
    mediaBackground: {
        type: ControlType.Color,
        title: "Media BG",
        defaultValue: "#f3f3f3",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(0,0,0,.10)",
    },
    activeBorderColor: {
        type: ControlType.Color,
        title: "Active Border",
        defaultValue: "#111",
    },
    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow BG",
        defaultValue: "rgba(255,255,255,.90)",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#111",
    },
    counterBackground: {
        type: ControlType.Color,
        title: "Counter BG",
        defaultValue: "rgba(0,0,0,.60)",
    },
    counterColor: {
        type: ControlType.Color,
        title: "Counter Text",
        defaultValue: "#fff",
    },
    captionBackground: {
        type: ControlType.Color,
        title: "Caption BG",
        defaultValue: "rgba(0,0,0,.58)",
        hidden: (p) => !p.showCaptions,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Text",
        defaultValue: "#fff",
        hidden: (p) => !p.showCaptions,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "rgba(255,255,255,.55)",
        hidden: (p) => !p.showDots,
    },
    activeDotColor: {
        type: ControlType.Color,
        title: "Active Dot",
        defaultValue: "#fff",
        hidden: (p) => !p.showDots,
    },
    autoplayVideo: {
        type: ControlType.Boolean,
        title: "Video Autoplay",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    mutedVideo: {
        type: ControlType.Boolean,
        title: "Video Muted",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },
    loopVideo: {
        type: ControlType.Boolean,
        title: "Video Loop",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
    },
    showVideoControls: {
        type: ControlType.Boolean,
        title: "Video Controls",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    restartVideo: {
        type: ControlType.Boolean,
        title: "Restart Video",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition",
        min: 0,
        max: 1000,
        step: 10,
        defaultValue: 260,
        unit: "ms",
    },
})
