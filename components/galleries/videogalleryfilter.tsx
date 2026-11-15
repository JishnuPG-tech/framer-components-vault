// CMS-driven video gallery with masonry layout and motion effects
import { useEffect, useState, useRef, useCallback, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useInView } from "framer-motion"

interface VideoItem {
    id: string
    title: string
    videoUrl: string
    videoFile?: string
    category?: string
    height?: "small" | "medium" | "large"
}

interface VideoGalleryProps {
    videos: VideoItem[]
    columns: number
    tabletColumns: number
    mobileColumns: number
    gap: number
    padding: number
    enableFiltering: boolean
    categories: string[]
    hoverScale: number
    animationDelay: number
    backgroundColor: string
    cardBackground: string
    overlayColor: string
    titleColor: string
    categoryColor: string
    titleFont: any
    categoryFont: any
    borderRadius: number
    showCategories: boolean
}

/**
 * CMS Video Gallery
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VideoGallery(props: VideoGalleryProps) {
    const {
        videos = [],
        columns = 3,
        tabletColumns = 2,
        mobileColumns = 1,
        gap = 20,
        padding = 20,
        enableFiltering = true,
        categories = [],
        hoverScale = 1.05,
        animationDelay = 0.1,
        backgroundColor = "#000000",
        cardBackground = "#1a1a1a",
        overlayColor = "rgba(0, 0, 0, 0.7)",
        titleColor = "#FFFFFF",
        categoryColor = "#CCCCCC",
        titleFont,
        categoryFont,
        borderRadius = 12,
        showCategories = true,
    } = props

    const [selectedCategory, setSelectedCategory] = useState<string>("All")
    const [lightboxVideo, setLightboxVideo] = useState<VideoItem | null>(null)
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [currentColumns, setCurrentColumns] = useState(columns)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // Responsive column handling
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const handleResize = () => {
            const width = containerRef.current?.offsetWidth || window.innerWidth
            if (width < 768) {
                startTransition(() => setCurrentColumns(mobileColumns))
            } else if (width < 1024) {
                startTransition(() => setCurrentColumns(tabletColumns))
            } else {
                startTransition(() => setCurrentColumns(columns))
            }
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        
        // Use ResizeObserver for container-based responsiveness
        const resizeObserver = new ResizeObserver(handleResize)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }
        
        return () => {
            window.removeEventListener("resize", handleResize)
            resizeObserver.disconnect()
        }
    }, [columns, tabletColumns, mobileColumns, isStatic])

    // Filter videos
    const filteredVideos = useMemo(() => {
        if (!enableFiltering || selectedCategory === "All") {
            return videos
        }
        return videos.filter(video => video.category === selectedCategory)
    }, [videos, selectedCategory, enableFiltering])

    // Organize videos into columns for masonry layout
    const columnizedVideos = useMemo(() => {
        const cols: VideoItem[][] = Array.from({ length: currentColumns }, () => [])
        const columnHeights = Array(currentColumns).fill(0)

        filteredVideos.forEach((video) => {
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
            cols[shortestColumnIndex].push(video)
            
            // Simulate height based on video height property
            const heightMultiplier = video.height === "small" ? 1 : video.height === "large" ? 1.5 : 1.2
            columnHeights[shortestColumnIndex] += heightMultiplier
        })

        return cols
    }, [filteredVideos, currentColumns])

    const allCategories = useMemo(() => {
        return ["All", ...categories]
    }, [categories])

    const openLightbox = useCallback((video: VideoItem) => {
        startTransition(() => setLightboxVideo(video))
    }, [])

    const closeLightbox = useCallback(() => {
        startTransition(() => setLightboxVideo(null))
    }, [])

    if (isStatic) {
        return (
            <div style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: titleColor,
                ...titleFont,
            }}>
                Video Gallery Preview
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "auto",
                padding,
            }}
        >
            {/* Category Filter */}
            {enableFiltering && categories.length > 0 && (
                <div style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: gap,
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}>
                    {allCategories.map((category) => (
                        <button
                            key={category}
                            onClick={() => startTransition(() => setSelectedCategory(category))}
                            style={{
                                padding: "8px 20px",
                                borderRadius: borderRadius / 2,
                                border: "none",
                                backgroundColor: selectedCategory === category ? titleColor : cardBackground,
                                color: selectedCategory === category ? backgroundColor : categoryColor,
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                ...categoryFont,
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {/* Masonry Grid */}
            <div style={{
                display: "flex",
                gap,
                alignItems: "flex-start",
            }}>
                {columnizedVideos.map((column, columnIndex) => (
                    <div
                        key={columnIndex}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap,
                        }}
                    >
                        {column.map((video, index) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                index={columnIndex * column.length + index}
                                animationDelay={animationDelay}
                                hoverScale={hoverScale}
                                cardBackground={cardBackground}
                                overlayColor={overlayColor}
                                titleColor={titleColor}
                                categoryColor={categoryColor}
                                titleFont={titleFont}
                                categoryFont={categoryFont}
                                borderRadius={borderRadius}
                                showCategories={showCategories}
                                onHover={setHoveredId}
                                hoveredId={hoveredId}
                                onClick={openLightbox}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxVideo && (
                    <Lightbox
                        video={lightboxVideo}
                        onClose={closeLightbox}
                        overlayColor={overlayColor}
                        titleColor={titleColor}
                        titleFont={titleFont}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

interface VideoCardProps {
    video: VideoItem
    index: number
    animationDelay: number
    hoverScale: number
    cardBackground: string
    overlayColor: string
    titleColor: string
    categoryColor: string
    titleFont: any
    categoryFont: any
    borderRadius: number
    showCategories: boolean
    onHover: (id: string | null) => void
    hoveredId: string | null
    onClick: (video: VideoItem) => void
}

function VideoCard({
    video,
    index,
    animationDelay,
    hoverScale,
    cardBackground,
    overlayColor,
    titleColor,
    categoryColor,
    titleFont,
    categoryFont,
    borderRadius,
    showCategories,
    onHover,
    hoveredId,
    onClick,
}: VideoCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const isInView = useInView(cardRef, { once: true, margin: "100px" })
    const isHovered = hoveredId === video.id
    
    const videoSource = video.videoFile || video.videoUrl

    useEffect(() => {
        if (!videoRef.current) return

        if (isHovered) {
            videoRef.current.play().catch(() => {})
        } else {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }, [isHovered])

    const heightMultiplier = video.height === "small" ? 250 : video.height === "large" ? 450 : 350

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: index * animationDelay }}
            whileHover={{ scale: hoverScale }}
            style={{
                position: "relative",
                backgroundColor: cardBackground,
                borderRadius,
                overflow: "hidden",
                cursor: "pointer",
                height: heightMultiplier,
            }}
            onMouseEnter={() => onHover(video.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(video)}
        >
            {/* Video Preview (always visible; hover-to-play) */}
            <video
                ref={videoRef}
                src={videoSource}
                muted
                loop
                playsInline
                preload="metadata"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />

            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: overlayColor,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: 20,
                    pointerEvents: "none",
                }}
            >
                {showCategories && video.category && (
                    <div style={{
                        color: categoryColor,
                        marginBottom: 8,
                        ...categoryFont,
                    }}>
                        {video.category}
                    </div>
                )}
                <div style={{
                    color: titleColor,
                    ...titleFont,
                }}>
                    {video.title}
                </div>
            </motion.div>

            {/* Play Icon */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: isHovered ? 0 : 1 }}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7L8 5z" fill="#000" />
                </svg>
            </motion.div>
        </motion.div>
    )
}

interface LightboxProps {
    video: VideoItem
    onClose: () => void
    overlayColor: string
    titleColor: string
    titleFont: any
}

function Lightbox({ video, onClose, overlayColor, titleColor, titleFont }: LightboxProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    
    const videoSource = video.videoFile || video.videoUrl

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play()
        }
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: overlayColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                style={{
                    position: "relative",
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <video
                    ref={videoRef}
                    src={videoSource}
                    controls
                    style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "calc(90vh - 80px)",
                        borderRadius: 12,
                        objectFit: "contain",
                    }}
                />
                <div style={{
                    marginTop: 20,
                    color: titleColor,
                    textAlign: "center",
                    maxWidth: "100%",
                    padding: "0 20px",
                    ...titleFont,
                }}>
                    {video.title}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: -10,
                        right: -10,
                        background: titleColor,
                        border: "none",
                        color: overlayColor,
                        fontSize: 24,
                        cursor: "pointer",
                        padding: 0,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                    }}
                    aria-label="Close lightbox"
                >
                    ×
                </button>
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(VideoGallery, {
    videos: {
        type: ControlType.Array,
        title: "Videos",
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    defaultValue: "video-1",
                },
                title: {
                    type: ControlType.String,
                    defaultValue: "Video Title",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Upload Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Or Video URL",
                    defaultValue: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                },
                category: {
                    type: ControlType.String,
                    defaultValue: "Motion",
                },
                height: {
                    type: ControlType.Enum,
                    options: ["small", "medium", "large"],
                    defaultValue: "medium",
                },
            },
        },
        defaultValue: [
            {
                id: "1",
                title: "Creative Reel 2024",
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                category: "Motion",
                height: "large",
            },
            {
                id: "2",
                title: "Brand Story",
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                category: "Brand",
                height: "small",
            },
            {
                id: "3",
                title: "Product Launch",
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                category: "Commercial",
                height: "medium",
            },
            {
                id: "4",
                title: "Behind the Scenes",
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                category: "Motion",
                height: "medium",
            },
            {
                id: "5",
                title: "Client Testimonial",
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                category: "Brand",
                height: "large",
            },
        ],
    },
    columns: {
        type: ControlType.Number,
        title: "Columns (Desktop)",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    tabletColumns: {
        type: ControlType.Number,
        title: "Columns (Tablet)",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    mobileColumns: {
        type: ControlType.Number,
        title: "Columns (Mobile)",
        defaultValue: 1,
        min: 1,
        max: 2,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 4,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 4,
        unit: "px",
    },
    enableFiltering: {
        type: ControlType.Boolean,
        title: "Enable Filtering",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    categories: {
        type: ControlType.Array,
        title: "Categories",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["Motion", "Brand", "Commercial"],
        hidden: ({ enableFiltering }) => !enableFiltering,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    animationDelay: {
        type: ControlType.Number,
        title: "Animation Delay",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.05,
        unit: "s",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#1a1a1a",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "rgba(0, 0, 0, 0.7)",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    categoryColor: {
        type: ControlType.Color,
        title: "Category Color",
        defaultValue: "#CCCCCC",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    categoryFont: {
        type: ControlType.Font,
        title: "Category Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0.05em",
            lineHeight: "1em",
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
    },
    showCategories: {
        type: ControlType.Boolean,
        title: "Show Categories",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
