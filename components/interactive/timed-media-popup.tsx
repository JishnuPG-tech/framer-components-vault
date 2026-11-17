import * as React from "react"
import * as ReactDOM from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Detect if we're on the Framer canvas vs a published site
function useIsOnCanvas() {
    const [isCanvas, setIsCanvas] = React.useState(false)
    React.useEffect(() => {
        try {
            const inFramerCanvas =
                window.location.href.includes("framercanvas.com") ||
                window.location.href.includes("framer.com/projects") ||
                document.querySelector("[data-framer-component-type]") !== null
            setIsCanvas(inFramerCanvas)
        } catch {
            setIsCanvas(false)
        }
    }, [])
    return isCanvas
}

// Parse a URL and return embed info if it's YouTube/Vimeo, otherwise treat as direct video
function getVideoSource(url) {
    if (!url) return { type: "none", src: "" }

    // YouTube
    const ytMatch = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|.*&v=))([^#&?]{11})/
    )
    if (ytMatch) {
        const id = ytMatch[1]
        const params = new URLSearchParams({
            mute: "1",
            loop: "1",
            playlist: id,
            controls: "0",
            modestbranding: "1",
            rel: "0",
            playsinline: "1",
            iv_load_policy: "3",
            autoplay: "1",
        })
        return {
            type: "embed",
            src: `https://www.youtube.com/embed/${id}?${params.toString()}`,
        }
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/)
    if (vimeoMatch) {
        const id = vimeoMatch[1]
        const params = new URLSearchParams({
            muted: "1",
            loop: "1",
            background: "1",
            autoplay: "1",
        })
        return {
            type: "embed",
            src: `https://player.vimeo.com/video/${id}?${params.toString()}`,
        }
    }

    // Direct video URL (MP4, WebM, etc.)
    return { type: "direct", src: url }
}

/**
 * @framerSupported
 * @framerDisableUnusedStyles
 */

export default function SmartVideoBubble({
    previewType = "video",
    videoLink = "",
    imageFile = "",
    linkUrl = "",
    autoplay = true,
    position = "left",
    aspect = "square",
    sizePreset = "medium",
    borderRadius = 22,
    padding = 24,
    delay = 1,
    showDismiss = true,
    videoBg = "#000000",
    triggerId,
    style,
    ...rest
}) {
    const isCanvas = useIsOnCanvas()
    const [isVisible, setIsVisible] = React.useState(true)
    const [hasAppeared, setHasAppeared] = React.useState(false)
    const [isDismissing, setIsDismissing] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    // Configuration constants
    const SIZE_MAP = { small: 100, medium: 150, large: 220 }
    const currentSize = SIZE_MAP[sizePreset] || 150
    const height = aspect === "wide" ? (currentSize * 9) / 16 : currentSize
    const resolvedBorderRadius = aspect === "circle" ? "50%" : borderRadius

    // Resolve video source
    const videoSource = React.useMemo(
        () => getVideoSource(videoLink),
        [videoLink]
    )

    // Effect: Handle Entrance Trigger (Section ID or Timer)
    React.useEffect(() => {
        let timer
        let observer

        const activate = () => {
            timer = setTimeout(() => setHasAppeared(true), delay * 1000)
        }

        if (triggerId && typeof document !== "undefined") {
            const target = document.getElementById(triggerId)
            if (target) {
                observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            activate()
                            observer.disconnect()
                        }
                    },
                    { threshold: 0.1 }
                )
                observer.observe(target)
            } else {
                activate()
            }
        } else {
            activate()
        }

        return () => {
            if (timer) clearTimeout(timer)
            if (observer) observer.disconnect()
        }
    }, [triggerId, delay])

    const handleDismiss = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDismissing(true)
        setTimeout(() => setIsVisible(false), 500)
    }

    const handleOpen = () => {
        const url = previewType === "image" ? linkUrl : videoLink
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer")
        }
    }

    if (!isVisible) return null

    // Render the video/image media
    const renderMedia = () => {
        if (previewType === "video") {
            if (videoSource.type === "embed") {
                return (
                    <iframe
                        src={videoSource.src}
                        title="Video preview"
                        style={{
                            width: "180%",
                            height: "180%",
                            position: "absolute",
                            top: "-40%",
                            left: "-40%",
                            border: "none",
                            pointerEvents: "none",
                        }}
                        allow="autoplay"
                    />
                )
            }
            if (videoSource.type === "direct") {
                return (
                    <video
                        src={videoSource.src}
                        muted
                        loop
                        autoPlay={autoplay}
                        playsInline
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                )
            }
            return null
        }

        return (
            <img
                src={imageFile}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                }}
                alt="Preview thumbnail"
            />
        )
    }

    // Shared inner content (used in both canvas and portal modes)
    const bubbleContent = (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleOpen()
            }}
            style={{
                width: currentSize,
                height: height,
                borderRadius: resolvedBorderRadius,
                backgroundColor: videoBg,
                cursor: "pointer",
                position: "relative",
                pointerEvents: "auto",
                boxShadow: isHovered
                    ? "0 15px 35px rgba(0,0,0,0.3)"
                    : "0 8px 20px rgba(0,0,0,0.2)",
                transform: isHovered ? "scale(1.05)" : "scale(1)",
                transition: "all 0.3s ease-in-out",
                flexShrink: 0,
            }}
        >
            {showDismiss && (
                <button
                    onClick={handleDismiss}
                    aria-label="Dismiss video bubble"
                    style={{
                        position: "absolute",
                        top: -10,
                        right: -10,
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "white",
                        border: "1px solid rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        zIndex: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                        color: "#000",
                        padding: 0,
                        lineHeight: 1,
                    }}
                >
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M1 1L9 9M9 1L1 9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            )}

            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: resolvedBorderRadius,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 255, 255, 0.25)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(255,255,255,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                        pointerEvents: "none",
                        opacity: isHovered && autoplay ? 0 : 1,
                        transition: "opacity 0.3s ease",
                    }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="white"
                        style={{ width: 16, height: 16, marginLeft: 2 }}
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>

                {renderMedia()}
            </div>
        </div>
    )

    // Live wrapper styles (used for portal on published site)
    const liveWrapperStyle = {
        position: "fixed",
        bottom: padding,
        [position === "center" ? "left" : position]:
            position === "center" ? "50%" : padding,
        transform:
            position === "center"
                ? `translateX(-50%) ${hasAppeared && !isDismissing ? "translateY(0) scale(1)" : "translateY(40px) scale(0.8)"}`
                : hasAppeared && !isDismissing
                  ? "translateY(0) scale(1)"
                  : "translateY(40px) scale(0.8)",
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
        zIndex: 99999,
        pointerEvents: "none",
        opacity: hasAppeared && !isDismissing ? 1 : 0,
        transition:
            "opacity 1s cubic-bezier(0.22, 1, 0.36, 1), transform 1s cubic-bezier(0.22, 1, 0.36, 1)",
    }

    // On the Framer canvas: render inline, positioned to match the live layout
    if (isCanvas) {
        const canvasTransformParts = []
        if (position === "center") canvasTransformParts.push("translateX(-50%)")
        canvasTransformParts.push(
            hasAppeared && !isDismissing
                ? "translateY(0) scale(1)"
                : "translateY(40px) scale(0.8)"
        )

        return (
            <div
                {...rest}
                style={{
                    ...style,
                    position: "fixed",
                    bottom: padding,
                    left:
                        position === "left"
                            ? padding
                            : position === "center"
                              ? "50%"
                              : "auto",
                    right: position === "right" ? padding : "auto",
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 12,
                    zIndex: 99999,
                    pointerEvents: "none",
                    opacity: hasAppeared && !isDismissing ? 1 : 0,
                    transform: canvasTransformParts.join(" "),
                    transition:
                        "opacity 1s cubic-bezier(0.22, 1, 0.36, 1), transform 1s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
            >
                {bubbleContent}
            </div>
        )
    }

    // On the published site: use a portal to escape Framer's transform container
    return ReactDOM.createPortal(
        <div style={liveWrapperStyle}>{bubbleContent}</div>,
        document.body
    )
}

addPropertyControls(SmartVideoBubble, {
    // --- Preview Source ---
    previewType: {
        type: ControlType.Enum,
        title: "Preview",
        options: ["video", "image"],
        optionTitles: ["Video", "Image"],
        displayControls: "segmented-control",
    },
    videoLink: {
        type: ControlType.String,
        title: "Video URL",
        description:
            "Supports YouTube links, Vimeo links, or direct video URLs (MP4, WebM, etc.)",
        hidden: (props) => props.previewType !== "video",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay Video",
        hidden: (props) => props.previewType !== "video",
    },
    imageFile: {
        type: ControlType.Image,
        title: "Upload Image",
        hidden: (props) => props.previewType !== "image",
    },
    linkUrl: {
        type: ControlType.String,
        title: "Link URL",
        description: "URL to open when the bubble is clicked.",
        hidden: (props) => props.previewType !== "image",
    },

    // --- Size & Shape ---
    aspect: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["square", "wide", "circle"],
        optionTitles: ["Square", "Wide", "Circle"],
        displayControls: "segmented-control",
    },
    sizePreset: {
        type: ControlType.Enum,
        title: "Size",
        options: ["small", "medium", "large"],
        optionTitles: ["S", "M", "L"],
        displayControls: "segmented-control",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 100,
        hidden: (props) => props.aspect === "circle",
    },

    // --- Layout & Position ---
    position: {
        type: ControlType.Enum,
        title: "Widget Placement",
        options: ["left", "right", "center"],
        displayControls: "segmented-control",
    },
    padding: {
        type: ControlType.Number,
        title: "Screen Offset",
        min: 0,
        max: 100,
    },

    // --- Colors ---
    videoBg: {
        type: ControlType.Color,
        title: "Video Background",
    },

    // --- Behavior ---
    triggerId: {
        type: ControlType.String,
        title: "Section Trigger ID",
        description:
            "Enter the ID of a section on the page. The bubble will appear when that section scrolls into view. If left empty or the ID is not found, the bubble appears after the delay timer instead.",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay (seconds)",
        min: 0,
        max: 10,
    },
    showDismiss: {
        type: ControlType.Boolean,
        title: "Dismiss Button",
    },
})
