// 360 Product Viewer with drag/swipe, autoplay, zoom, looping, controls, loader, responsive aspect ratio
import {
    useState,
    useRef,
    useEffect,
    useCallback,
    startTransition,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const defaultImages = []

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val))
}

/**
 * 360 Product Viewer
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ProductViewer360(props) {
    const {
        images = defaultImages.map((img) => img.src),
        autoplay,
        autoplaySpeed,
        loop,
        dragSensitivity,
        showControls,
        showZoom,
        minZoom,
        maxZoom,
        aspectRatio,
        style,
        loaderColor,
        loaderSize,
    } = props

    const [frame, setFrame] = useState(0)
    const [isPlaying, setIsPlaying] = useState(autoplay)
    const [zoom, setZoom] = useState(1)
    const [isZoomed, setIsZoomed] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [imagesLoaded, setImagesLoaded] = useState(0)
    const [allImagesLoaded, setAllImagesLoaded] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [startFrame, setStartFrame] = useState(0)
    const [startZoom, setStartZoom] = useState(1)
    const containerRef = useRef(null)
    const isStatic = useIsStaticRenderer()
    const totalFrames = images.length

    // Responsive aspect ratio
    const paddingBottom = aspectRatio > 0 ? `${100 / aspectRatio}%` : "100%"

    // Ensure minimum size 5x5
    const minWidth = 5
    const minHeight = 5

    // Loader
    const handleImageLoad = useCallback(() => {
        setImagesLoaded((count) => {
            const next = count + 1
            if (next >= totalFrames) setAllImagesLoaded(true)
            return next
        })
        if (!isLoaded) setIsLoaded(true)
    }, [totalFrames, isLoaded])

    // Preload all images
    useEffect(() => {
        if (!images || images.length === 0) return
        let loaded = 0
        images.forEach((src) => {
            const url = Array.isArray(src) ? src[0] : src
            const img = new window.Image()
            img.onload = () => {
                loaded++
                if (loaded === images.length) {
                    setAllImagesLoaded(true)
                }
            }
            img.onerror = () => {
                loaded++
                if (loaded === images.length) {
                    setAllImagesLoaded(true)
                }
            }
            img.src = url
        })
    }, [images])

    // Autoplay
    useEffect(() => {
        if (!isPlaying || isStatic || totalFrames < 2 || !allImagesLoaded)
            return
        const interval = setInterval(() => {
            startTransition(() => {
                setFrame((f) => {
                    if (f + 1 >= totalFrames) return loop ? 0 : f
                    return f + 1
                })
            })
        }, autoplaySpeed)
        return () => clearInterval(interval)
    }, [isPlaying, autoplaySpeed, totalFrames, loop, isStatic, allImagesLoaded])

    // Drag/Swipe
    const handlePointerDown = (e) => {
        if (isStatic || !allImagesLoaded) return
        setDragging(true)
        setStartX(e.touches ? e.touches[0].clientX : e.clientX)
        setStartFrame(frame)
        // Pause autoplay if it's on
        if (isPlaying) setIsPlaying(false)
    }
    const handlePointerMove = (e) => {
        if (!dragging || !allImagesLoaded) return
        const x = e.touches ? e.touches[0].clientX : e.clientX
        const dx = x - startX
        // Drag to rotate
        const deltaFrames = dx / dragSensitivity
        let newFrame = Math.round((startFrame - deltaFrames) % totalFrames)
        if (newFrame < 0) newFrame += totalFrames
        setFrame(newFrame)
    }
    const handlePointerUp = () => {
        setDragging(false)
        // Resume autoplay if autoplay prop is on
        if (autoplay) setIsPlaying(true)
    }

    // Touch events for mobile
    useEffect(() => {
        if (!dragging) return
        const move = (e) => handlePointerMove(e)
        const up = () => handlePointerUp()
        window.addEventListener("mousemove", move)
        window.addEventListener("mouseup", up)
        window.addEventListener("touchmove", move)
        window.addEventListener("touchend", up)
        return () => {
            window.removeEventListener("mousemove", move)
            window.removeEventListener("mouseup", up)
            window.removeEventListener("touchmove", move)
            window.removeEventListener("touchend", up)
        }
    }, [dragging, handlePointerMove])

    // Controls
    const handlePlayPause = () => {
        setIsPlaying((p) => !p)
    }

    // Keyboard accessibility
    const handleKeyDown = (e) => {
        if (e.key === "ArrowRight") setFrame((f) => (f + 1) % totalFrames)
        if (e.key === "ArrowLeft")
            setFrame((f) => (f - 1 + totalFrames) % totalFrames)
    }

    // Loader spinner
    const loader = (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.7)",
                zIndex: 2,
                flexDirection: "column",
                gap: 16,
            }}
        >
            <svg
                width={loaderSize}
                height={loaderSize}
                viewBox={`0 0 ${loaderSize} ${loaderSize}`}
                style={{ display: "block" }}
            >
                <circle
                    cx={loaderSize / 2}
                    cy={loaderSize / 2}
                    r={loaderSize / 2 - 6}
                    fill="none"
                    stroke="#e5e5e5"
                    strokeWidth={6}
                />
                <circle
                    cx={loaderSize / 2}
                    cy={loaderSize / 2}
                    r={loaderSize / 2 - 6}
                    fill="none"
                    stroke={loaderColor}
                    strokeWidth={6}
                    strokeDasharray={Math.PI * (loaderSize - 12)}
                    strokeDashoffset={
                        Math.PI *
                        (loaderSize - 12) *
                        (1 - imagesLoaded / Math.max(1, totalFrames))
                    }
                    style={{
                        transition:
                            "stroke-dashoffset 0.4s cubic-bezier(.4,1,.4,1)",
                        transform: `rotate(-90deg)`,
                        transformOrigin: "center",
                    }}
                />
            </svg>
            <div
                style={{
                    marginTop: 8,
                    fontSize: 16,
                    color: loaderColor,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    letterSpacing: "0.01em",
                    textShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
            >
                {Math.round((imagesLoaded / Math.max(1, totalFrames)) * 100)}%
            </div>
        </div>
    )

    // Responsive container
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: style?.width || "100%",
                minWidth,
                minHeight,
                overflow: "hidden",
                touchAction: "pan-y",
                userSelect: dragging ? "none" : "auto",
                background: "none",
            }}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="360 Product Viewer"
            role="region"
        >
            {/* Main image */}
            <img
                src={
                    Array.isArray(images[frame])
                        ? images[frame][0]
                        : images[frame]
                }
                alt=""
                style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    transition: dragging
                        ? "none"
                        : "transform 0.2s cubic-bezier(.4,1,.4,1)",
                    cursor: dragging ? "grabbing" : "grab",
                    pointerEvents: "auto",
                    display: "block",
                    background: "none",
                }}
                draggable={false}
                onLoad={handleImageLoad}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                aria-live="polite"
            />
            {!allImagesLoaded && loader}
            {/* Controls */}
            {showControls && (
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        display: "flex",
                        gap: 8,
                        zIndex: 3,
                    }}
                >
                    <button
                        aria-label={isPlaying ? "Pause" : "Play"}
                        onClick={handlePlayPause}
                        style={controlBtnStyle}
                        disabled={!allImagesLoaded}
                    >
                        {isPlaying ? (
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <rect
                                    x="4"
                                    y="4"
                                    width="4"
                                    height="12"
                                    rx="2"
                                    fill="#222"
                                />
                                <rect
                                    x="12"
                                    y="4"
                                    width="4"
                                    height="12"
                                    rx="2"
                                    fill="#222"
                                />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <polygon points="5,4 16,10 5,16" fill="#222" />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

const controlBtnStyle = {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    padding: 6,
    cursor: "pointer",
    outline: "none",
    minWidth: 28,
    minHeight: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

addPropertyControls(ProductViewer360, {
    images: {
        type: ControlType.Array,
        title: "Frames",
        control: {
            type: ControlType.File,
            title: "Image",
            allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        },
        defaultValue: defaultImages.map((img) => img.src),
        maxCount: 72,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplaySpeed: {
        type: ControlType.Number,
        title: "Autoplay Speed",
        defaultValue: 60,
        min: 20,
        max: 1000,
        step: 10,
        unit: "ms",
        hidden: ({ autoplay }) => !autoplay,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ autoplay }) => !autoplay,
    },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Sensitivity",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
        unit: "px/frame",
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Show Play/Pause",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showZoom: {
        type: ControlType.Boolean,
        title: "Zoom Controls",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: true,
    },
    minZoom: {
        type: ControlType.Number,
        title: "Min Zoom",
        defaultValue: 1,
        min: 1,
        max: 2,
        step: 0.05,
        hidden: true,
    },
    maxZoom: {
        type: ControlType.Number,
        title: "Max Zoom",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 0.05,
        hidden: true,
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Aspect Ratio",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.01,
    },
    loaderColor: {
        type: ControlType.Color,
        title: "Loader Color",
        defaultValue: "#222",
    },
    loaderSize: {
        type: ControlType.Number,
        title: "Loader Size",
        description: "by [FramerGeeks](https://www.framergeeks.com)",
        defaultValue: 36,
        min: 16,
        max: 80,
        step: 2,
    },
})
