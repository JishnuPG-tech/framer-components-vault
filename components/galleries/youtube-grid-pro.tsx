import { useMemo, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Video {
    id: string
    title: string
    thumbnail: string
    publishedAt: string
    viewCount: string
    duration: string
}

interface VideoEntry {
    video: string
    title: string
    date: string
    thumbnail?: { src?: string; srcSet?: string; alt?: string }
}

interface YoutubeShowcaseProps {
    videos: VideoEntry[]
    maxVideos: number
    columns: number
    titleColor: string
    metaColor: string
    backgroundColor: string
    hoverScale: boolean
    borderRadius: number
    spacing: number
    autoplay: boolean
    modalMaxWidth: number
    modalMaxHeight: number
    showDate: boolean
    playButton: {
        color: string
        size: number
        opacity: number
        iconColor: string
        borderWidth: number
        shadowIntensity: number
    }
    closeButton: {
        size: number
        color: string
        backgroundColor: string
        hoverColor: string
        hoverBackgroundColor: string
        borderRadius: number
        showBackground: boolean
        position:
            | "top-right"
            | "top-left"
            | "inside-top-right"
            | "inside-top-left"
    }
    titleFont: CSSProperties
    metaFont: CSSProperties
    style?: CSSProperties
}

const ID_PATTERN = /^[\w-]{11}$/

function extractVideoId(value: string): string | null {
    const raw = (value || "").trim()
    if (!raw) return null
    if (ID_PATTERN.test(raw)) return raw
    const match = raw.match(
        /(?:v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/
    )
    return match ? match[1] : null
}

function formatDate(raw: string): string {
    if (!raw) return ""
    const date = new Date(raw)
    if (isNaN(date.getTime())) return raw
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

function thumbFor(id: string): string {
    return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

const DEFAULT_VIDEOS: VideoEntry[] = [
    {
        video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        title: "A Quiet Morning in the Meadow",
        date: "2025-03-14",
    },
    {
        video: "https://www.youtube.com/watch?v=eRsGyueVLvQ",
        title: "Searching for an Old Friend",
        date: "2025-02-02",
    },
    {
        video: "https://www.youtube.com/watch?v=R6MlUcmOul8",
        title: "Rewriting the Last Chapter",
        date: "2025-01-18",
    },
    {
        video: "https://www.youtube.com/watch?v=WhWc3b3KhnY",
        title: "When the Season Turns",
        date: "2024-12-07",
    },
    {
        video: "https://www.youtube.com/watch?v=Y-rmzh0PI3c",
        title: "A Long Way Through the Dunes",
        date: "2024-11-21",
    },
    {
        video: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        title: "Notes From the Studio Floor",
        date: "2024-10-30",
    },
]

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
function YoutubeShowcase(props: YoutubeShowcaseProps) {
    const {
        videos: videoEntries = DEFAULT_VIDEOS,
        maxVideos = 6,
        columns = 3,
        titleColor = "#000000",
        metaColor = "#666666",
        backgroundColor = "#FFFFFF",
        hoverScale = true,
        borderRadius = 12,
        spacing = 16,
        autoplay = false,
        modalMaxWidth = 1200,
        modalMaxHeight = 90,
        showDate = true,
        playButton = {
            color: "#FF0000",
            size: 64,
            opacity: 0.9,
            iconColor: "#FFFFFF",
            borderWidth: 4,
            shadowIntensity: 0.4,
        },
        closeButton = {
            size: 48,
            color: "#FFFFFF",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            hoverColor: "#FFFFFF",
            hoverBackgroundColor: "#FF0000",
            borderRadius: 50,
            showBackground: true,
            position: "top-right",
        },
        titleFont,
        metaFont,
    } = props

    const isStatic = useIsStaticRenderer()
    const enableAnimations = !isStatic

    const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
    const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)
    const [closeButtonHovered, setCloseButtonHovered] = useState(false)

    const listVideos = useMemo<Video[]>(() => {
        const list = Array.isArray(videoEntries) ? videoEntries : []
        const out: Video[] = []
        list.forEach((entry, index) => {
            const id = extractVideoId(entry?.video || "")
            if (!id) return
            out.push({
                id: `${id}::${index}`,
                title: entry.title || "Untitled",
                thumbnail: entry.thumbnail?.src || thumbFor(id),
                publishedAt: formatDate(entry.date || ""),
                viewCount: "",
                duration: "",
            })
        })
        return out.slice(0, maxVideos)
    }, [videoEntries, maxVideos])

    const videos = listVideos
    const error =
        listVideos.length === 0
            ? "Add YouTube videos in the component settings."
            : null

    const handleVideoClick = (key: string) => {
        if (isStatic) return
        const videoId = key.split("::")[0]
        if (autoplay) {
            startTransition(() => setSelectedVideo(videoId))
        } else {
            if (typeof window !== "undefined") {
                window.open(
                    `https://www.youtube.com/watch?v=${videoId}`,
                    "_blank"
                )
            }
        }
    }

    const closeModal = () => {
        startTransition(() => setSelectedVideo(null))
    }

    if (error) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor,
                    ...titleFont,
                    color: metaColor,
                    padding: spacing,
                    textAlign: "center",
                }}
            >
                {error}
            </div>
        )
    }

    return (
        <>
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    padding: spacing,
                    overflow: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
                className="youtube-grid-container"
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: spacing,
                        width: "100%",
                        overflow: "visible",
                    }}
                >
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            onClick={() => handleVideoClick(video.id)}
                            style={{
                                cursor: "pointer",
                                perspective: "1000px",
                            }}
                            onMouseEnter={() => {
                                if (!enableAnimations) return
                                startTransition(() => setHoveredVideo(video.id))
                            }}
                            onMouseLeave={() => {
                                if (!enableAnimations) return
                                startTransition(() => setHoveredVideo(null))
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    paddingBottom: "56.25%",
                                    backgroundColor: "#000",
                                    borderRadius,
                                    overflow: "hidden",
                                    boxShadow:
                                        hoveredVideo === video.id
                                            ? "0 20px 40px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)"
                                            : "0 2px 8px rgba(0, 0, 0, 0.1)",
                                    transition: enableAnimations
                                        ? "box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                        : "none",
                                }}
                            >
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    loading="lazy"
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        transition: enableAnimations
                                            ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                            : "none",
                                        transform:
                                            hoverScale &&
                                            hoveredVideo === video.id
                                                ? "scale(1.1)"
                                                : "scale(1)",
                                    }}
                                />
                                {enableAnimations && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            background:
                                                "linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%)",
                                            opacity:
                                                hoveredVideo === video.id
                                                    ? 1
                                                    : 0,
                                            transition:
                                                "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                                {enableAnimations && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            background:
                                                "linear-gradient(45deg, rgba(255, 0, 150, 0.3), rgba(0, 204, 255, 0.3))",
                                            opacity:
                                                hoveredVideo === video.id
                                                    ? 0.15
                                                    : 0,
                                            transition:
                                                "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            pointerEvents: "none",
                                            mixBlendMode: "overlay",
                                        }}
                                    />
                                )}
                                {enableAnimations && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "50%",
                                            left: "50%",
                                            transform:
                                                hoveredVideo === video.id
                                                    ? "translate(-50%, -50%) scale(1.2)"
                                                    : "translate(-50%, -50%) scale(1)",
                                            width: playButton.size,
                                            height: playButton.size,
                                            backgroundColor: playButton.color,
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity:
                                                hoveredVideo === video.id
                                                    ? playButton.opacity
                                                    : 0,
                                            transition:
                                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            boxShadow:
                                                hoveredVideo === video.id
                                                    ? `0 8px 24px rgba(255, 0, 0, ${playButton.shadowIntensity}), 0 0 0 ${playButton.borderWidth}px rgba(255, 255, 255, 0.3)`
                                                    : "none",
                                        }}
                                    >
                                        <svg
                                            width={playButton.size * 0.44}
                                            height={playButton.size * 0.44}
                                            viewBox="0 0 24 24"
                                            fill={playButton.iconColor}
                                            style={{ marginLeft: 3 }}
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <h3
                                    style={{
                                        margin: 0,
                                        color: titleColor,
                                        ...titleFont,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {video.title}
                                </h3>
                                {showDate && (
                                    <p
                                        style={{
                                            margin: "8px 0 0 0",
                                            color: metaColor,
                                            ...metaFont,
                                        }}
                                    >
                                        {video.publishedAt}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedVideo && autoplay && enableAnimations && (
                <div
                    onClick={closeModal}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: 20,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            width: "100%",
                            maxWidth: modalMaxWidth,
                            maxHeight: `${modalMaxHeight}vh`,
                            aspectRatio: "16/9",
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                closeModal()
                            }}
                            onMouseEnter={() =>
                                startTransition(() =>
                                    setCloseButtonHovered(true)
                                )
                            }
                            onMouseLeave={() =>
                                startTransition(() =>
                                    setCloseButtonHovered(false)
                                )
                            }
                            style={{
                                position: "absolute",
                                top: closeButton.position.includes("inside")
                                    ? 16
                                    : -56,
                                right: closeButton.position.includes("left")
                                    ? "auto"
                                    : 0,
                                left: closeButton.position.includes("left")
                                    ? 0
                                    : "auto",
                                width: closeButton.size,
                                height: closeButton.size,
                                background: closeButton.showBackground
                                    ? closeButtonHovered
                                        ? closeButton.hoverBackgroundColor
                                        : closeButton.backgroundColor
                                    : "transparent",
                                border: "none",
                                borderRadius: closeButton.borderRadius,
                                color: closeButtonHovered
                                    ? closeButton.hoverColor
                                    : closeButton.color,
                                fontSize: closeButton.size * 0.6,
                                fontWeight: "300",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                transform: closeButtonHovered
                                    ? "scale(1.1) rotate(90deg)"
                                    : "scale(1) rotate(0deg)",
                                boxShadow: closeButton.showBackground
                                    ? closeButtonHovered
                                        ? "0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.2)"
                                        : "0 4px 12px rgba(0, 0, 0, 0.2)"
                                    : "none",
                                backdropFilter: closeButton.showBackground
                                    ? "blur(10px)"
                                    : "none",
                                zIndex: 10000,
                                pointerEvents: "auto",
                                outline: "none",
                            }}
                            aria-label="Close video"
                        >
                            <svg
                                width={closeButton.size * 0.5}
                                height={closeButton.size * 0.5}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="YouTube video player"
                        />
                    </div>
                </div>
            )}
            <style>
                {`
                    .youtube-grid-container::-webkit-scrollbar {
                        display: none;
                    }
                `}
            </style>
        </>
    )
}

export default YoutubeShowcase

addPropertyControls(YoutubeShowcase, {
    videos: {
        type: ControlType.Array,
        title: "Videos",
        control: {
            type: ControlType.Object,
            controls: {
                video: {
                    type: ControlType.String,
                    title: "Video",
                    defaultValue: "",
                    placeholder: "YouTube URL or ID",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New Video",
                },
                date: {
                    type: ControlType.String,
                    title: "Date",
                    defaultValue: "",
                    placeholder: "2025-01-31",
                },
                thumbnail: {
                    type: ControlType.ResponsiveImage,
                    title: "Thumbnail",
                },
            },
        },
        defaultValue: DEFAULT_VIDEOS,
    },
    maxVideos: {
        type: ControlType.Number,
        title: "Max Videos",
        defaultValue: 6,
        min: 1,
        max: 50,
        step: 1,
        description: "Maximum number of videos to display",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        description: "Number of columns in the video grid layout",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
        description: "Gap between video cards and padding around the grid",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
        description: "Roundness of the video card corners",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
        description: "Background color of the entire component",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
        description: "Color of the video title text",
    },
    metaColor: {
        type: ControlType.Color,
        title: "Meta Color",
        defaultValue: "#666666",
        description: "Color of the video metadata (publish date)",
    },
    showDate: {
        type: ControlType.Boolean,
        title: "Show Date",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Toggle the visibility of video publish dates",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        description: "Font styling for video titles",
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
        description: "Font styling for video metadata",
    },
    hoverScale: {
        type: ControlType.Boolean,
        title: "Hover Scale",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Enable zoom effect on video thumbnails when hovering",
    },
    playButton: {
        type: ControlType.Object,
        title: "Play Button",
        description: "Customize the play button that appears on hover",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FF0000",
                description: "Background color of the play button",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 64,
                min: 32,
                max: 128,
                step: 4,
                unit: "px",
                description: "Size of the play button circle",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.9,
                min: 0,
                max: 1,
                step: 0.1,
                description:
                    "Transparency of the play button (0 = transparent, 1 = solid)",
            },
            iconColor: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#FFFFFF",
                description: "Color of the play icon inside the button",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 4,
                min: 0,
                max: 10,
                step: 1,
                unit: "px",
                description: "Width of the white border around the play button",
            },
            shadowIntensity: {
                type: ControlType.Number,
                title: "Shadow Intensity",
                defaultValue: 0.4,
                min: 0,
                max: 1,
                step: 0.1,
                description:
                    "Intensity of the shadow effect (0 = no shadow, 1 = maximum)",
            },
        },
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "VideoTheater Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Open videos in an immersive theater popup instead of a new tab",
    },
    modalMaxWidth: {
        type: ControlType.Number,
        title: "Theater Max Width",
        defaultValue: 1200,
        min: 400,
        max: 2000,
        step: 50,
        unit: "px",
        hidden: ({ autoplay }) => !autoplay,
        description: "Maximum width of the VideoTheater popup",
    },
    modalMaxHeight: {
        type: ControlType.Number,
        title: "Theater Max Height",
        defaultValue: 90,
        min: 50,
        max: 95,
        step: 5,
        unit: "vh",
        hidden: ({ autoplay }) => !autoplay,
        description:
            "Maximum height of the VideoTheater as percentage of viewport height",
    },
    closeButton: {
        type: ControlType.Object,
        title: "Close Button",
        description: "Customize the close button for the VideoTheater",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 48,
                min: 32,
                max: 80,
                step: 4,
                unit: "px",
                description: "Size of the close button",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                description: "Color of the close icon",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0, 0, 0, 0.5)",
                description: "Background color of the close button",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover Color",
                defaultValue: "#FFFFFF",
                description: "Color of the close icon when hovering",
            },
            hoverBackgroundColor: {
                type: ControlType.Color,
                title: "Hover Background",
                defaultValue: "#FF0000",
                description:
                    "Background color when hovering over the close button",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 50,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                description: "Roundness of the close button (50% = circle)",
            },
            showBackground: {
                type: ControlType.Boolean,
                title: "Show Background",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Toggle the background circle behind the close icon",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: [
                    "top-right",
                    "top-left",
                    "inside-top-right",
                    "inside-top-left",
                ],
                optionTitles: [
                    "Top Right",
                    "Top Left",
                    "Inside Top Right",
                    "Inside Top Left",
                ],
                defaultValue: "top-right",
                description:
                    "Position of the close button relative to the VideoTheater",
            },
        },
        hidden: ({ autoplay }) => !autoplay,
    },
})
