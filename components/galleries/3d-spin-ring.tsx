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


/*
 * Orbit Media | Original implementation, React and Framer only.
 * Paste this entire file into a new Framer Code Component.
 * Media files must be direct image/video URLs or Framer uploads.
 */

type ImageAsset = { src: string; srcSet?: string; alt?: string }
type MediaItem = {
    type?: "image" | "video"
    image?: ImageAsset | string
    video?: string
    poster?: ImageAsset | string
    title?: string
}
type Props = {
    items?: MediaItem[]
    layout?: "horizontal" | "vertical"
    axes?: "both" | "horizontal" | "vertical"
    cardWidth?: number
    cardHeight?: number
    radius?: number
    gap?: number
    cornerRadius?: number
    perspective?: number
    zoom?: number
    background?: string
    cardBackground?: string
    borderColor?: string
    borderWidth?: number
    fit?: "cover" | "contain"
    back?: "media" | "solid" | "hidden"
    autoRotate?: boolean
    autoSpeed?: number
    followCursor?: boolean
    followSpeed?: number
    response?: number
    draggable?: boolean
    dragSensitivity?: number
    initialX?: number
    initialY?: number
    videoAutoplay?: boolean
    videoLoop?: boolean
    showControls?: boolean
    label?: string
    style?: React.CSSProperties
}

const DEMO: MediaItem[] = [
    { title: "STUDIO / 01" },
    { title: "FORM / 02" },
    { title: "MOTION / 03" },
    { title: "OBJECT / 04" },
    { title: "SPACE / 05" },
    { title: "INDEX / 06" },
    { title: "DEPTH / 07" },
    { title: "FRAME / 08" },
]
const PALETTE = [
    "#b8c8f0",
    "#daecb5",
    "#fc7447",
    "#d2c1ed",
    "#e9e6df",
    "#b9d9d9",
    "#f1c8cf",
    "#c8d5e0",
]
const DEFAULTS = {
    items: DEMO,
    layout: "horizontal",
    axes: "both",
    cardWidth: 220,
    cardHeight: 300,
    radius: 300,
    gap: 20,
    cornerRadius: 8,
    perspective: 1200,
    zoom: 1,
    background: "#080808",
    cardBackground: "#202020",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    fit: "cover",
    back: "media",
    autoRotate: true,
    autoSpeed: 12,
    followCursor: true,
    followSpeed: 90,
    response: 10,
    draggable: true,
    dragSensitivity: 0.35,
    initialX: -8,
    initialY: 0,
    videoAutoplay: true,
    videoLoop: true,
    showControls: true,
    label: "Interactive 3D media carousel",
} satisfies Omit<Props, "style">

function imageSource(asset?: ImageAsset | string) {
    return typeof asset === "string" ? asset : asset?.src
}
function imageSet(asset?: ImageAsset | string) {
    return typeof asset === "object" ? asset.srcSet : undefined
}
const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v))

function PanelMedia({
    item,
    index,
    fit,
    autoplay,
    loop,
    active,
    background,
}: {
    item: MediaItem
    index: number
    fit: "cover" | "contain"
    autoplay: boolean
    loop: boolean
    active: boolean
    background: string
}) {
    const video = React.useRef<HTMLVideoElement>(null)
    const [failed, setFailed] = React.useState(false)
    const src = item.type === "video" ? item.video : imageSource(item.image)
    React.useEffect(() => {
        setFailed(false)
    }, [src])
    React.useEffect(() => {
        const el = video.current
        if (!el) return
        if (active && autoplay) el.play().catch(() => {})
        else el.pause()
    }, [active, autoplay, src, failed])
    const mediaStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: fit,
        pointerEvents: "none",
        background,
    }
    if (src && !failed) {
        if (item.type === "video")
            return (
                <video
                    ref={video}
                    src={src}
                    poster={imageSource(item.poster)}
                    muted
                    playsInline
                    loop={loop}
                    preload="metadata"
                    aria-label={item.title || `Video ${index + 1}`}
                    draggable={false}
                    style={mediaStyle}
                    onError={() => setFailed(true)}
                />
            )
        return (
            <img
                src={src}
                srcSet={imageSet(item.image)}
                sizes="(max-width: 600px) 160px, 320px"
                alt={
                    typeof item.image === "object"
                        ? item.image.alt || item.title || `Image ${index + 1}`
                        : item.title || `Image ${index + 1}`
                }
                draggable={false}
                decoding="async"
                style={mediaStyle}
                onError={() => setFailed(true)}
            />
        )
    }
    // Original local artwork. No third-party images or borrowed reel assets.
    return (
        <div
            style={{
                ...mediaStyle,
                background: PALETTE[index % PALETTE.length],
                color: "#151515",
                padding: "8%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                fontFamily: "Arial, Helvetica, sans-serif",
            }}
        >
            <span style={{ fontSize: 11, letterSpacing: "0.12em" }}>
                {failed ? "MEDIA UNAVAILABLE" : "ORBIT / EXPERIMENTS"}
            </span>
            <div
                style={{
                    width: "76%",
                    aspectRatio: "1",
                    borderRadius: index % 2 ? "50%" : "5%",
                    alignSelf: "center",
                    background: "linear-gradient(140deg, #ffffff99, #000000)",
                    transform: `rotate(${index * 17 - 25}deg)`,
                    boxShadow: "12px 16px 28px #00000025",
                }}
            />
            <span
                style={{
                    fontSize: 24,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                }}
            >
                {item.title ||
                    `UNTITLED / ${String(index + 1).padStart(2, "0")}`}
            </span>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 650
 */
export default function OrbitMedia(props: Props) {
    const p = { ...DEFAULTS, ...props }
    const root = React.useRef<HTMLDivElement>(null)
    const rotor = React.useRef<HTMLDivElement>(null)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [size, setSize] = React.useState({ w: 1000, h: 650 })
    const [visible, setVisible] = React.useState(false)
    const [pageVisible, setPageVisible] = React.useState(true)
    const [reduced, setReduced] = React.useState(true)
    const [paused, setPaused] = React.useState(false)
    const [dragging, setDragging] = React.useState(false)
    const [focusWithin, setFocusWithin] = React.useState(false)
    const motion = React.useRef({
        x: p.initialX,
        y: p.initialY,
        tx: p.initialX,
        ty: p.initialY,
        vx: 0,
        vy: 0,
        nx: 0,
        ny: 0,
        hover: false,
        pointer: -1,
        px: 0,
        py: 0,
    })
    const items = (p.items || []).filter(Boolean).slice(0, 24)
    const count = items.length
    const vertical = p.layout === "vertical"
    const allowX = p.axes !== "horizontal"
    const allowY = p.axes !== "vertical"
    const cw = Math.max(40, p.cardWidth)
    const ch = Math.max(40, p.cardHeight)
    // Prevent neighboring cards intersecting, including with large media lists.
    const minimumRadius =
        count > 2
            ? ((vertical ? ch : cw) + p.gap) / (2 * Math.tan(Math.PI / count))
            : 0
    const radius = count > 1 ? Math.max(p.radius, minimumRadius) : 0
    const extent = radius * 2 + Math.max(cw, ch)
    const scale =
        Math.max(
            0.01,
            Math.min((size.w - 32) / extent, (size.h - 32) / extent, 1)
        ) * p.zoom
    const active = visible && pageVisible && !isCanvas
    const idleEnabled = active && !paused && !reduced
    const buttonStyle: React.CSSProperties = {
        appearance: "none",
        border: "1px solid #ffffff38",
        borderRadius: 100,
        padding: "8px 12px",
        color: "white",
        background: "#171717",
        font: "12px Arial, sans-serif",
        cursor: "pointer",
        minHeight: 36,
    }

    React.useEffect(() => {
        const el = root.current
        if (!el) return
        const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        const intersection = new IntersectionObserver(
            ([entry]) => {
                setVisible(entry.isIntersecting)
            },
            { threshold: 0.01 }
        )
        intersection.observe(el)
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const updateReduced = () => setReduced(mq.matches)
        const updateVisibility = () => setPageVisible(!document.hidden)
        updateReduced()
        updateVisibility()
        mq.addEventListener("change", updateReduced)
        document.addEventListener("visibilitychange", updateVisibility)
        return () => {
            observer.disconnect()
            intersection.disconnect()
            mq.removeEventListener("change", updateReduced)
            document.removeEventListener("visibilitychange", updateVisibility)
        }
    }, [])

    React.useEffect(() => {
        const m = motion.current
        m.x = m.tx = p.initialX
        m.y = m.ty = p.initialY
        m.vx = m.vy = 0
    }, [p.initialX, p.initialY, p.layout])

    React.useEffect(() => {
        let frame = 0
        let previous = 0
        const tick = (now: number) => {
            const dt = Math.min(
                previous ? (now - previous) / 1000 : 1 / 60,
                0.05
            )
            previous = now
            const m = motion.current
            const isDragging = m.pointer !== -1
            const follow =
                idleEnabled && p.followCursor && m.hover && !isDragging
            const auto =
                idleEnabled && p.autoRotate && !isDragging && !focusWithin
            const autoX =
                p.axes === "vertical" || (p.axes === "both" && vertical)
            const autoY =
                p.axes === "horizontal" || (p.axes === "both" && !vertical)
            const targetVX = allowX
                ? (follow ? -m.ny * p.followSpeed : 0) +
                  (auto && autoX ? p.autoSpeed : 0)
                : 0
            const targetVY = allowY
                ? (follow ? m.nx * p.followSpeed : 0) +
                  (auto && autoY ? p.autoSpeed : 0)
                : 0
            const damping = 1 - Math.exp(-Math.max(1, p.response) * dt)
            m.vx += (targetVX - m.vx) * damping
            m.vy += (targetVY - m.vy) * damping
            if (!isDragging && idleEnabled) {
                m.tx += m.vx * dt
                m.ty += m.vy * dt
            }
            m.x += (m.tx - m.x) * damping
            m.y += (m.ty - m.y) * damping
            // Preserve continuity but avoid precision loss during long sessions.
            if (Math.abs(m.x) > 3600) {
                const turns = Math.trunc(m.x / 360) * 360
                m.x -= turns
                m.tx -= turns
            }
            if (Math.abs(m.y) > 3600) {
                const turns = Math.trunc(m.y / 360) * 360
                m.y -= turns
                m.ty -= turns
            }
            if (rotor.current) {
                rotor.current.style.transform = vertical
                    ? `rotateY(${m.y}deg) rotateX(${m.x}deg)`
                    : `rotateX(${m.x}deg) rotateY(${m.y}deg)`
            }
            if (active) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [
        active,
        idleEnabled,
        focusWithin,
        allowX,
        allowY,
        vertical,
        p.axes,
        p.followCursor,
        p.autoRotate,
        p.autoSpeed,
        p.followSpeed,
        p.response,
    ])

    const step = (direction: number) => {
        const m = motion.current
        const amount = (direction * 360) / Math.max(1, count)
        if (vertical) m.tx += amount
        else m.ty += amount
        m.vx = m.vy = 0
    }
    const reset = () => {
        const m = motion.current
        m.tx = m.x + ((((p.initialX - m.x) % 360) + 540) % 360) - 180
        m.ty = m.y + ((((p.initialY - m.y) % 360) + 540) % 360) - 180
        m.vx = m.vy = 0
    }
    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const m = motion.current
        if (m.pointer !== event.pointerId) return
        m.pointer = -1
        m.vx = m.vy = 0
        m.hover = false
        setDragging(false)
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
    }

    return (
        <div
            ref={root}
            role="region"
            aria-roledescription="carousel"
            aria-label={p.label}
            tabIndex={0}
            onFocusCapture={() => setFocusWithin(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node))
                    setFocusWithin(false)
            }}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                motion.current.hover = false
                if (event.key.startsWith("Arrow")) {
                    event.preventDefault()
                    const m = motion.current
                    if (event.key === "ArrowLeft")
                        m.ty -= 360 / Math.max(1, count)
                    if (event.key === "ArrowRight")
                        m.ty += 360 / Math.max(1, count)
                    if (event.key === "ArrowUp")
                        m.tx -= 360 / Math.max(1, count)
                    if (event.key === "ArrowDown")
                        m.tx += 360 / Math.max(1, count)
                } else if (event.key === " ") {
                    event.preventDefault()
                    setPaused((value) => !value)
                } else if (event.key === "Home") {
                    event.preventDefault()
                    reset()
                }
            }}
            onPointerDown={(event) => {
                if (
                    !p.draggable ||
                    isCanvas ||
                    event.button !== 0 ||
                    (event.target as HTMLElement).closest("button")
                )
                    return
                const m = motion.current
                if (m.pointer !== -1) return
                m.pointer = event.pointerId
                m.px = event.clientX
                m.py = event.clientY
                m.vx = m.vy = 0
                event.currentTarget.setPointerCapture(event.pointerId)
                setDragging(true)
            }}
            onPointerMove={(event) => {
                if (isCanvas) return
                const m = motion.current
                if (m.pointer === event.pointerId) {
                    if (allowY)
                        m.ty += (event.clientX - m.px) * p.dragSensitivity
                    if (allowX)
                        m.tx -= (event.clientY - m.py) * p.dragSensitivity
                    m.px = event.clientX
                    m.py = event.clientY
                } else if (event.pointerType === "mouse" && m.pointer === -1) {
                    const bounds = event.currentTarget.getBoundingClientRect()
                    m.nx = clamp(
                        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
                        -1,
                        1
                    )
                    m.ny = clamp(
                        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
                        -1,
                        1
                    )
                    m.hover = !(event.target as HTMLElement).closest("button")
                }
            }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onPointerLeave={() => {
                motion.current.hover = false
            }}
            style={{
                width: "100%",
                height: "100%",
                ...p.style,
                position: "relative",
                overflow: "hidden",
                isolation: "isolate",
                background: p.background,
                touchAction: p.draggable
                    ? p.axes === "horizontal"
                        ? "pan-y"
                        : "none"
                    : "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: p.draggable
                    ? dragging
                        ? "grabbing"
                        : "grab"
                    : "default",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: Math.max(300, p.perspective),
                    perspectiveOrigin: "50% 50%",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 0,
                        height: 0,
                        transformStyle: "preserve-3d",
                        transform: `scale(${scale})`,
                    }}
                >
                    <div
                        style={{
                            transformStyle: "preserve-3d",
                            transform: `translateZ(${-radius}px)`,
                        }}
                    >
                        <div
                            ref={rotor}
                            style={{
                                transformStyle: "preserve-3d",
                                transform: vertical
                                    ? `rotateY(${p.initialY}deg) rotateX(${p.initialX}deg)`
                                    : `rotateX(${p.initialX}deg) rotateY(${p.initialY}deg)`,
                                willChange: active ? "transform" : "auto",
                            }}
                        >
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    role="group"
                                    aria-roledescription="slide"
                                    aria-label={`${index + 1} of ${count}: ${item.title || item.type || "Media"}`}
                                    style={{
                                        position: "absolute",
                                        left: -cw / 2,
                                        top: -ch / 2,
                                        width: cw,
                                        height: ch,
                                        transformStyle: "preserve-3d",
                                        transform: `${vertical ? "rotateX" : "rotateY"}(${(index * 360) / count}deg) translateZ(${radius}px)`,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            overflow: "hidden",
                                            borderRadius: p.cornerRadius,
                                            outline: `${p.borderWidth}px solid ${p.borderColor}`,
                                            outlineOffset: -p.borderWidth,
                                            background: p.cardBackground,
                                            backfaceVisibility:
                                                p.back === "media"
                                                    ? "visible"
                                                    : "hidden",
                                            WebkitBackfaceVisibility:
                                                p.back === "media"
                                                    ? "visible"
                                                    : "hidden",
                                        }}
                                    >
                                        <PanelMedia
                                            item={item}
                                            index={index}
                                            fit={p.fit}
                                            autoplay={p.videoAutoplay}
                                            loop={p.videoLoop}
                                            active={
                                                active && !paused && !reduced
                                            }
                                            background={p.cardBackground}
                                        />
                                    </div>
                                    {p.back === "solid" && (
                                        <div
                                            aria-hidden
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background: p.cardBackground,
                                                borderRadius: p.cornerRadius,
                                                transform:
                                                    "rotateY(180deg) translateZ(0.1px)",
                                                backfaceVisibility: "hidden",
                                                WebkitBackfaceVisibility:
                                                    "hidden",
                                                outline: `${p.borderWidth}px solid ${p.borderColor}`,
                                                outlineOffset: -p.borderWidth,
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {count === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        color: "#888",
                        font: "14px Arial, sans-serif",
                    }}
                >
                    Add images or videos in the Media control.
                </div>
            )}
            {p.showControls && count > 0 && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 16,
                        left: 16,
                        right: 16,
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                    }}
                >
                    <button
                        type="button"
                        aria-label="Previous panel"
                        onClick={() => step(-1)}
                        style={buttonStyle}
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        aria-label={paused ? "Resume motion" : "Pause motion"}
                        aria-pressed={paused}
                        onClick={() => setPaused((value) => !value)}
                        style={buttonStyle}
                    >
                        {paused ? "Resume" : "Pause"}
                    </button>
                    <button
                        type="button"
                        aria-label="Next panel"
                        onClick={() => step(1)}
                        style={buttonStyle}
                    >
                        Next
                    </button>
                    <button
                        type="button"
                        aria-label="Reset rotation"
                        onClick={reset}
                        style={buttonStyle}
                    >
                        Reset
                    </button>
                </div>
            )}
        </div>
    )
}

OrbitMedia.defaultProps = DEFAULTS

addPropertyControls(OrbitMedia, {
    items: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 24,
        defaultValue: DEMO,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Project",
                },
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
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
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (item: MediaItem) => item.type !== "video",
                },
            },
        },
    },
    layout: {
        type: ControlType.Enum,
        title: "Ring",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    axes: {
        type: ControlType.Enum,
        title: "Spin Axes",
        options: ["both", "horizontal", "vertical"],
        optionTitles: ["Both", "Horizontal", "Vertical"],
        defaultValue: "both",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 220,
        min: 40,
        max: 800,
        step: 1,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 300,
        min: 40,
        max: 1000,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 300,
        min: 0,
        max: 1500,
        step: 1,
        unit: "px",
        description:
            "Minimum radius. Expands automatically to keep panels apart.",
    },
    gap: {
        type: ControlType.Number,
        title: "Min Gap",
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    zoom: {
        type: ControlType.Number,
        title: "Zoom",
        defaultValue: 1,
        min: 0.25,
        max: 3,
        step: 0.05,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 300,
        max: 4000,
        step: 50,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corners",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#080808",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Color",
        defaultValue: "#202020",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255,255,255,0.18)",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Size",
        defaultValue: 1,
        min: 0,
        max: 8,
        step: 0.5,
    },
    fit: {
        type: ControlType.Enum,
        title: "Media Fit",
        options: ["cover", "contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    back: {
        type: ControlType.Enum,
        title: "Card Back",
        options: ["media", "solid", "hidden"],
        optionTitles: ["Show Media", "Solid", "Hidden"],
        defaultValue: "media",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Spin",
        defaultValue: true,
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        defaultValue: 12,
        min: -90,
        max: 90,
        step: 1,
        description: "Degrees per second. Negative reverses direction.",
        hidden: (p: Props) => !p.autoRotate,
    },
    followCursor: {
        type: ControlType.Boolean,
        title: "Follow Cursor",
        defaultValue: true,
    },
    followSpeed: {
        type: ControlType.Number,
        title: "Cursor Speed",
        defaultValue: 90,
        min: 5,
        max: 360,
        step: 5,
        description:
            "Move toward an edge to spin. Center slows cursor-driven rotation.",
        hidden: (p: Props) => !p.followCursor,
    },
    response: {
        type: ControlType.Number,
        title: "Response",
        defaultValue: 10,
        min: 1,
        max: 30,
        step: 1,
        description: "Higher values feel tighter; lower values feel floatier.",
    },
    draggable: { type: ControlType.Boolean, title: "Drag", defaultValue: true },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Speed",
        defaultValue: 0.35,
        min: 0.05,
        max: 2,
        step: 0.05,
        hidden: (p: Props) => !p.draggable,
    },
    initialX: {
        type: ControlType.Number,
        title: "Start X",
        defaultValue: -8,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    initialY: {
        type: ControlType.Number,
        title: "Start Y",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    videoAutoplay: {
        type: ControlType.Boolean,
        title: "Video Auto",
        defaultValue: true,
        description:
            "Videos are always muted. Reduced-motion preference disables autoplay.",
    },
    videoLoop: {
        type: ControlType.Boolean,
        title: "Video Loop",
        defaultValue: true,
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
        description:
            "Recommended: visible pause, previous, next, and reset buttons.",
    },
    label: {
        type: ControlType.String,
        title: "Accessible Name",
        defaultValue: "Interactive 3D media carousel",
    },
})
