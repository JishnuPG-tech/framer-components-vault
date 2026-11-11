// TikTok-style vertical video feed with snap scrolling, infinite loop, auto-scroll, and video playback control
import { useEffect, useRef, useState, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation } from "framer-motion"

interface Video {
    videoFile: string
    username: string
    profileImage: { src: string; alt: string }
    caption: string
    hashtags: string
    musicImage: { src: string; alt: string }
    likeCount: string
    commentCount: string
    shareCount: string
    bookmarkCount: string
}

interface TikTokFeedProps {
    videoSettings: {
        videos: Video[]
        enableInfiniteLoop: boolean
        enableAutoScroll: boolean
        autoScrollDelay: number
    }
    colorSettings: {
        iconColor: string
        textColor: string
        captionHashtagColor: string
        overlayColor: string
        timelineColor: string
        timelineBackground: string
        muteButtonColor: string
    }
    typographySettings: {
        usernameFont: any
        captionFont: any
        numberFont: any
        moreLessFont: any
    }
    layoutSettings: {
        cardPadding: number
        cardBorderRadius: string
        iconSize: number
        iconGap: number
        timelineHeight: number
        muteButtonSize: number
    }
    timelineSettings: {
        showTimeline: boolean
    }
    style?: CSSProperties
}

/**
 * TikTok-style vertical video feed with snap scrolling, infinite loop, and auto-scroll
 *
 * @framerIntrinsicWidth 375
 * @framerIntrinsicHeight 667
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TikTokFeed(props: TikTokFeedProps) {
    const {
        videoSettings = {
            videos: [
                {
                    videoFile: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                    username: "Gaga005",
                    profileImage: {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Profile",
                    },
                    caption: "Can you do it like me?🤔",
                    hashtags: "#yoga #beginneryoga #fyp #funny",
                    musicImage: {
                        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                        alt: "Music",
                    },
                    likeCount: "191.2K",
                    commentCount: "2,248",
                    shareCount: "8,840",
                    bookmarkCount: "141.8K",
                },
            ],
            enableInfiniteLoop: true,
            enableAutoScroll: false,
            autoScrollDelay: 5,
        },
        colorSettings = {
            iconColor: "#FFFFFF",
            textColor: "#FFFFFF",
            captionHashtagColor: "#FFFFFF",
            overlayColor: "#000000",
            timelineColor: "#FFFFFF",
            timelineBackground: "rgba(255, 255, 255, 0.3)",
            muteButtonColor: "#FFFFFF",
        },
        typographySettings = {
            usernameFont: {
                fontSize: "16px",
                variant: "Bold",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
            },
            captionFont: {
                fontSize: "14px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.3em",
            },
            numberFont: {
                fontSize: "12px",
                variant: "Semibold",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            moreLessFont: {
                fontSize: "14px",
                variant: "Bold",
                letterSpacing: "-0.01em",
                lineHeight: "1.3em",
            },
        },
        layoutSettings = {
            cardPadding: "20px",
            cardBorderRadius: "0px",
            iconSize: 32,
            iconGap: 20,
            timelineHeight: 3,
            muteButtonSize: 32,
        },
        timelineSettings = {
            showTimeline: true,
        },
    } = props

    const { videos, enableInfiniteLoop, enableAutoScroll, autoScrollDelay } = videoSettings
    const { iconColor, textColor, captionHashtagColor, overlayColor, timelineColor, timelineBackground, muteButtonColor } = colorSettings
    const { usernameFont, captionFont, numberFont, moreLessFont } = typographySettings
    const { cardPadding, cardBorderRadius, iconSize, iconGap, timelineHeight, muteButtonSize } = layoutSettings
    const { showTimeline } = timelineSettings

    const containerRef = useRef<HTMLDivElement>(null)
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isScrolling, setIsScrolling] = useState(false)
    const scrollTimeoutRef = useRef<number | null>(null)
    const autoScrollTimeoutRef = useRef<number | null>(null)
    const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set())
    const [isMuted, setIsMuted] = useState(true)

    const displayVideos = enableInfiniteLoop ? [...videos, ...videos, ...videos] : videos
    const startIndex = enableInfiniteLoop ? videos.length : 0

    // Parse cardPadding to number
    const paddingValue = typeof cardPadding === 'string' ? parseFloat(cardPadding) : cardPadding

    // Helper function to convert any color to rgba
    const hexToRgba = useCallback((color: string, alpha: number) => {
        // If already rgba, extract rgb and apply new alpha
        if (color.startsWith('rgba')) {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
            if (match) {
                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`
            }
        }
        
        // If rgb, convert to rgba
        if (color.startsWith('rgb')) {
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/)
            if (match) {
                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`
            }
        }
        
        // If hsl, convert to rgb first (approximate)
        if (color.startsWith('hsl')) {
            // For simplicity, just return a fallback
            return `rgba(0, 0, 0, ${alpha})`
        }
        
        // Handle hex colors
        let hex = color.replace('#', '')
        
        // Handle shorthand hex
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('')
        }
        
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }, [])

    // Initialize scroll position
    useEffect(() => {
        if (containerRef.current && enableInfiniteLoop) {
            const scrollPosition = startIndex * (containerRef.current.clientHeight || 0)
            containerRef.current.scrollTop = scrollPosition
            setCurrentIndex(startIndex)
        }
    }, [enableInfiniteLoop, startIndex])

    // Handle video playback based on current index
    useEffect(() => {
        videoRefs.current.forEach((video, index) => {
            if (video) {
                if (index === currentIndex) {
                    video.play().catch(() => {})
                } else {
                    video.pause()
                }
            }
        })
    }, [currentIndex])

    // Auto-scroll functionality
    useEffect(() => {
        if (!enableAutoScroll) return

        const startAutoScroll = () => {
            if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current)
            }

            autoScrollTimeoutRef.current = window.setTimeout(() => {
                if (containerRef.current) {
                    const nextIndex = currentIndex + 1
                    const maxIndex = displayVideos.length - 1

                    if (nextIndex > maxIndex) {
                        if (enableInfiniteLoop) {
                            containerRef.current.scrollTop = startIndex * containerRef.current.clientHeight
                            setCurrentIndex(startIndex)
                        }
                    } else {
                        containerRef.current.scrollTo({
                            top: nextIndex * containerRef.current.clientHeight,
                            behavior: "smooth",
                        })
                    }
                }
            }, autoScrollDelay * 1000)
        }

        startAutoScroll()

        return () => {
            if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current)
            }
        }
    }, [enableAutoScroll, autoScrollDelay, currentIndex, displayVideos.length, enableInfiniteLoop, startIndex])

    // Handle scroll events
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
        }

        setIsScrolling(true)

        scrollTimeoutRef.current = window.setTimeout(() => {
            setIsScrolling(false)

            if (!containerRef.current) return

            const scrollTop = containerRef.current.scrollTop
            const clientHeight = containerRef.current.clientHeight
            const newIndex = Math.round(scrollTop / clientHeight)

            startTransition(() => {
                setCurrentIndex(newIndex)
            })

            // Handle infinite loop repositioning
            if (enableInfiniteLoop) {
                if (newIndex <= 0) {
                    containerRef.current.scrollTop = startIndex * clientHeight
                    setCurrentIndex(startIndex)
                } else if (newIndex >= displayVideos.length - 1) {
                    containerRef.current.scrollTop = (startIndex + videos.length - 1) * clientHeight
                    setCurrentIndex(startIndex + videos.length - 1)
                }
            }
        }, 150)
    }, [displayVideos.length, enableInfiniteLoop, startIndex, videos.length])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener("scroll", handleScroll)
        return () => {
            container.removeEventListener("scroll", handleScroll)
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [handleScroll])

    const handleLike = useCallback((index: number) => {
        startTransition(() => {
            setLikedVideos((prev) => {
                const newSet = new Set(prev)
                if (newSet.has(index)) {
                    newSet.delete(index)
                } else {
                    newSet.add(index)
                }
                return newSet
            })
        })
    }, [])

    const toggleMute = useCallback(() => {
        startTransition(() => {
            setIsMuted((prev) => !prev)
        })
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                scrollSnapType: "y mandatory",
                position: "relative",
                backgroundColor: "#000000",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                borderRadius: cardBorderRadius,
            }}
        >
            <style>
                {`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}
            </style>
            {displayVideos.map((video, index) => (
                <VideoScreen
                    key={index}
                    video={video}
                    index={index}
                    videoRef={(el) => (videoRefs.current[index] = el)}
                    iconColor={iconColor}
                    textColor={textColor}
                    textContentColor={captionHashtagColor}
                    overlayColor={overlayColor}
                    usernameFont={usernameFont}
                    captionFont={captionFont}
                    numberFont={numberFont}
                    moreTextFont={moreLessFont}
                    cardPadding={paddingValue}
                    iconSize={iconSize}
                    iconGap={iconGap}
                    isLiked={likedVideos.has(index)}
                    onLike={() => handleLike(index)}
                    hexToRgba={hexToRgba}
                    showTimeline={showTimeline}
                    timelineColor={timelineColor}
                    timelineHeight={timelineHeight}
                    timelineBackgroundColor={timelineBackground}
                    isMuted={isMuted}
                    onToggleMute={toggleMute}
                    muteButtonColor={muteButtonColor}
                    muteButtonSize={muteButtonSize}
                />
            ))}
        </div>
    )
}

interface VideoScreenProps {
    video: Video
    index: number
    videoRef: (el: HTMLVideoElement | null) => void
    iconColor: string
    textColor: string
    textContentColor: string
    overlayColor: string
    usernameFont: any
    captionFont: any
    numberFont: any
    moreTextFont: any
    cardPadding: number
    iconSize: number
    iconGap: number
    isLiked: boolean
    onLike: () => void
    hexToRgba: (hex: string, alpha: number) => string
    showTimeline: boolean
    timelineColor: string
    timelineHeight: number
    timelineBackgroundColor: string
    isMuted: boolean
    onToggleMute: () => void
    muteButtonColor: string
    muteButtonSize: number
}

function VideoScreen({
    video,
    index,
    videoRef,
    iconColor,
    textColor,
    textContentColor,
    overlayColor,
    usernameFont,
    captionFont,
    numberFont,
    moreTextFont,
    cardPadding,
    iconSize,
    iconGap,
    isLiked,
    onLike,
    hexToRgba,
    showTimeline,
    timelineColor,
    timelineHeight,
    timelineBackgroundColor,
    isMuted,
    onToggleMute,
    muteButtonColor,
    muteButtonSize,
}: VideoScreenProps) {
    const likeControls = useAnimation()
    const [showHeart, setShowHeart] = useState(false)
    const [isCaptionExpanded, setIsCaptionExpanded] = useState(false)
    const [videoProgress, setVideoProgress] = useState(0)
    const videoElementRef = useRef<HTMLVideoElement | null>(null)

    const handleLikeClick = async () => {
        onLike()
        await likeControls.start({
            scale: [1, 1.3, 1],
            transition: { duration: 0.3 },
        })

        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 1000)
    }

    // Update video progress
    useEffect(() => {
        const videoElement = videoElementRef.current
        if (!videoElement) return

        const updateProgress = () => {
            const progress = (videoElement.currentTime / videoElement.duration) * 100
            setVideoProgress(progress || 0)
        }

        videoElement.addEventListener("timeupdate", updateProgress)
        return () => {
            videoElement.removeEventListener("timeupdate", updateProgress)
        }
    }, [])

    // Ensure profileImage has default values
    const profileImage = video.profileImage || {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Profile",
    }

    // Ensure musicImage has default values
    const musicImage = video.musicImage || {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Music",
    }

    // Caption truncation logic
    const CAPTION_TRUNCATE_LENGTH = 60
    const shouldTruncate = video.caption.length > CAPTION_TRUNCATE_LENGTH
    const displayCaption = shouldTruncate && !isCaptionExpanded 
        ? video.caption.slice(0, CAPTION_TRUNCATE_LENGTH) 
        : video.caption

    // Limit hashtags to 5
    const limitedHashtags = video.hashtags
        .split(/[\s#]+/)
        .filter(tag => tag.trim().length > 0)
        .slice(0, 5)
        .map(tag => `#${tag}`)
        .join(' ')

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                scrollSnapAlign: "start",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Video */}
            <video
                ref={(el) => {
                    videoRef(el)
                    videoElementRef.current = el
                }}
                src={video.videoFile}
                loop
                playsInline
                muted={isMuted}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                }}
            />

            {/* Overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(to bottom, transparent 0%, ${overlayColor} 100%)`,
                    pointerEvents: "none",
                }}
            />

            {/* Floating Heart Animation */}
            {showHeart && (
                <motion.div
                    initial={{ opacity: 1, scale: 0, y: 0 }}
                    animate={{ opacity: 0, scale: 1.5, y: -100 }}
                    transition={{ duration: 1 }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        zIndex: 100,
                    }}
                >
                    <svg width={80} height={80} viewBox="0 0 24 24" fill={iconColor}>
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </motion.div>
            )}

            {/* Right Action Bar */}
            <div
                style={{
                    position: "absolute",
                    right: cardPadding,
                    bottom: cardPadding,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: iconGap,
                    zIndex: 10,
                }}
            >
                {/* Profile */}
                <div style={{ position: "relative" }}>
                    <img
                        src={profileImage.src}
                        alt={profileImage.alt}
                        style={{
                            width: iconSize + 8,
                            height: iconSize + 8,
                            borderRadius: "50%",
                            border: `2px solid ${iconColor}`,
                            objectFit: "cover",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: -6,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            backgroundColor: "#FE2C55",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            color: "#FFFFFF",
                            fontWeight: "bold",
                        }}
                    >
                        +
                    </div>
                </div>

                {/* Like */}
                <motion.div
                    animate={likeControls}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                    }}
                    onClick={handleLikeClick}
                >
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={isLiked ? "#FE2C55" : iconColor}>
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span style={{ color: textColor, fontSize: 12, ...numberFont }}>{video.likeCount}</span>
                </motion.div>

                {/* Comment */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                    }}
                >
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={iconColor}>
                        <path d="M20 2H4c-1.1 0-2 .9-2 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                    <span style={{ color: textColor, fontSize: 12, ...numberFont }}>{video.commentCount}</span>
                </div>

                {/* Bookmark */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                    }}
                >
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={iconColor}>
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                    </svg>
                    <span style={{ color: textColor, fontSize: 12, ...numberFont }}>{video.bookmarkCount}</span>
                </div>

                {/* Share */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                    }}
                >
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={iconColor}>
                        <path d="M21 12l-7-7v4C7 10 4 15 3 20c2.5-3.5 6-5.1 11-5.1V19l7-7z" />
                    </svg>
                    <span style={{ color: textColor, fontSize: 12, ...numberFont }}>{video.shareCount}</span>
                </div>

                {/* Music Icon */}
                <div
                    style={{
                        width: iconSize,
                        height: iconSize,
                        borderRadius: "50%",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <img
                        src={musicImage.src}
                        alt={musicImage.alt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>
            </div>

            {/* Bottom Left Info */}
            <div
                style={{
                    position: "absolute",
                    left: cardPadding,
                    bottom: cardPadding,
                    right: cardPadding + iconSize + 40,
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                }}
            >
                <div style={{ marginBottom: 8 }}>
                    <span style={{ color: textColor, fontWeight: "bold", ...usernameFont }}>{video.username}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ color: textContentColor, ...captionFont }}>
                                {displayCaption}
                                {shouldTruncate && !isCaptionExpanded && (
                                    <span 
                                        style={{ cursor: "pointer", ...moreTextFont }}
                                        onClick={() => setIsCaptionExpanded(true)}
                                    >
                                        ...more
                                    </span>
                                )}
                            </span>
                            {shouldTruncate && isCaptionExpanded && (
                                <div style={{ marginTop: 4 }}>
                                    <span 
                                        style={{ color: textContentColor, cursor: "pointer", ...moreTextFont }}
                                        onClick={() => setIsCaptionExpanded(false)}
                                    >
                                        less
                                    </span>
                                </div>
                            )}
                        </div>
                        <div>
                            <span style={{ color: textContentColor, ...captionFont }}>{limitedHashtags}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mute/Unmute Button */}
            <div
                style={{
                    position: "absolute",
                    top: cardPadding,
                    right: cardPadding,
                    zIndex: 10,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: muteButtonSize,
                    height: muteButtonSize,
                }}
                onClick={onToggleMute}
            >
                {isMuted ? (
                    <svg width={muteButtonSize} height={muteButtonSize} viewBox="0 0 24 24" fill="none" stroke={muteButtonColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                ) : (
                    <svg width={muteButtonSize} height={muteButtonSize} viewBox="0 0 24 24" fill="none" stroke={muteButtonColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                )}
            </div>

            {/* Timeline Progress Bar */}
            {showTimeline && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: timelineHeight,
                        backgroundColor: timelineBackgroundColor,
                        zIndex: 15,
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${videoProgress}%`,
                            backgroundColor: timelineColor,
                            transition: "width 0.1s linear",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

addPropertyControls(TikTokFeed, {
    videoSettings: {
        type: ControlType.Object,
        title: "Video Settings",
        controls: {
            videos: {
                type: ControlType.Array,
                title: "Videos",
                description: "Manage your feed items and edit video content.",
                control: {
                    type: ControlType.Object,
                    controls: {
                        videoFile: {
                            type: ControlType.File,
                            title: "Video File",
                            allowedFileTypes: ["mp4", "webm", "mov"],
                        },
                        username: {
                            type: ControlType.String,
                            title: "Username",
                            defaultValue: "Gaga005",
                        },
                        profileImage: {
                            type: ControlType.ResponsiveImage,
                            title: "Profile Image",
                        },
                        caption: {
                            type: ControlType.String,
                            title: "Caption",
                            defaultValue: "Can you do it like me?🤔",
                            displayTextArea: true,
                        },
                        hashtags: {
                            type: ControlType.String,
                            title: "Hashtags",
                            defaultValue: "#yoga #beginneryoga #fyp #funny",
                        },
                        musicImage: {
                            type: ControlType.ResponsiveImage,
                            title: "Music Image",
                        },
                        likeCount: {
                            type: ControlType.String,
                            title: "Like Count",
                            defaultValue: "191.2K",
                        },
                        commentCount: {
                            type: ControlType.String,
                            title: "Comment Count",
                            defaultValue: "2,248",
                        },
                        shareCount: {
                            type: ControlType.String,
                            title: "Share Count",
                            defaultValue: "8,840",
                        },
                        bookmarkCount: {
                            type: ControlType.String,
                            title: "Bookmark Count",
                            defaultValue: "141.8K",
                        },
                    },
                },
                defaultValue: [
                    {
                        videoFile: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                        username: "Gaga005",
                        profileImage: {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: "Profile",
                        },
                        caption: "Can you do it like me?🤔",
                        hashtags: "#yoga #beginneryoga #fyp #funny",
                        musicImage: {
                            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                            alt: "Music",
                        },
                        likeCount: "191.2K",
                        commentCount: "2,248",
                        shareCount: "8,840",
                        bookmarkCount: "141.8K",
                    },
                ],
            },
            enableInfiniteLoop: {
                type: ControlType.Boolean,
                title: "Enable Infinite Loop",
                description: "Loop from the last video back to the first.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            enableAutoScroll: {
                type: ControlType.Boolean,
                title: "Enable Auto Scroll",
                description: "Automatically scroll to the next video.",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            autoScrollDelay: {
                type: ControlType.Number,
                title: "Auto Scroll Delay (s)",
                description: "Time in seconds before scrolling to the next video.",
                defaultValue: 5,
                min: 1,
                max: 30,
                step: 0.5,
                hidden: ({ enableAutoScroll }) => !enableAutoScroll,
            },
        },
        defaultValue: {
            videos: [
                {
                    videoFile: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                    username: "Gaga005",
                    profileImage: {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Profile",
                    },
                    caption: "Can you do it like me?🤔",
                    hashtags: "#yoga #beginneryoga #fyp #funny",
                    musicImage: {
                        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                        alt: "Music",
                    },
                    likeCount: "191.2K",
                    commentCount: "2,248",
                    shareCount: "8,840",
                    bookmarkCount: "141.8K",
                },
            ],
            enableInfiniteLoop: true,
            enableAutoScroll: false,
            autoScrollDelay: 5,
        },
    },
    colorSettings: {
        type: ControlType.Object,
        title: "Color Settings",
        controls: {
            iconColor: {
                type: ControlType.Color,
                title: "Icon Color",
                description: "Color of the action icons.",
                defaultValue: "#FFFFFF",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                description: "Color for usernames and text elements.",
                defaultValue: "#FFFFFF",
            },
            captionHashtagColor: {
                type: ControlType.Color,
                title: "Caption & Hashtag Color",
                description: "Color for captions and hashtags.",
                defaultValue: "#FFFFFF",
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Overlay Color",
                description: "Background overlay color for readability.",
                defaultValue: "#000000",
            },
            timelineColor: {
                type: ControlType.Color,
                title: "Timeline Color",
                description: "Color of the video timeline.",
                defaultValue: "#FFFFFF",
            },
            timelineBackground: {
                type: ControlType.Color,
                title: "Timeline Background",
                description: "Background color for the timeline.",
                defaultValue: "rgba(255, 255, 255, 0.3)",
            },
            muteButtonColor: {
                type: ControlType.Color,
                title: "Mute Button Color",
                description: "Color of the mute/unmute button.",
                defaultValue: "#FFFFFF",
            },
        },
        defaultValue: {
            iconColor: "#FFFFFF",
            textColor: "#FFFFFF",
            captionHashtagColor: "#FFFFFF",
            overlayColor: "#000000",
            timelineColor: "#FFFFFF",
            timelineBackground: "rgba(255, 255, 255, 0.3)",
            muteButtonColor: "#FFFFFF",
        },
    },
    typographySettings: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            usernameFont: {
                type: ControlType.Font,
                title: "Username Font",
                description: "Font for the username text.",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Bold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
            captionFont: {
                type: ControlType.Font,
                title: "Caption Font",
                description: "Font for captions and hashtags.",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
            },
            numberFont: {
                type: ControlType.Font,
                title: "Number Font",
                description: "Font for likes, comments, and shares.",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
            moreLessFont: {
                type: ControlType.Font,
                title: "More/Less Font",
                description: "Font for the See More / See Less text.",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Bold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
            },
        },
        defaultValue: {
            usernameFont: {
                fontSize: "16px",
                variant: "Bold",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
            },
            captionFont: {
                fontSize: "14px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.3em",
            },
            numberFont: {
                fontSize: "12px",
                variant: "Semibold",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            moreLessFont: {
                fontSize: "14px",
                variant: "Bold",
                letterSpacing: "-0.01em",
                lineHeight: "1.3em",
            },
        },
    },
    layoutSettings: {
        type: ControlType.Object,
        title: "Layout & Spacing",
        controls: {
            cardPadding: {
                type: ControlType.Padding,
                title: "Card Padding",
                description: "Spacing around text elements inside each screen.",
                defaultValue: "20px",
            },
            cardBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Card Border Radius",
                description: "Corner radius for the text container.",
                defaultValue: "0px",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                description: "Size of the action icons.",
                defaultValue: 32,
                min: 20,
                max: 60,
                step: 2,
                unit: "px",
            },
            iconGap: {
                type: ControlType.Number,
                title: "Icon Gap",
                description: "Spacing between action icons.",
                defaultValue: 20,
                min: 0,
                max: 60,
                step: 2,
                unit: "px",
            },
            timelineHeight: {
                type: ControlType.Number,
                title: "Timeline Height",
                description: "Thickness of the video timeline.",
                defaultValue: 3,
                min: 1,
                max: 10,
                step: 1,
                unit: "px",
            },
            muteButtonSize: {
                type: ControlType.Number,
                title: "Mute Button Size",
                description: "Size of the mute/unmute icon.",
                defaultValue: 32,
                min: 20,
                max: 60,
                step: 2,
                unit: "px",
            },
        },
        defaultValue: {
            cardPadding: "20px",
            cardBorderRadius: "0px",
            iconSize: 32,
            iconGap: 20,
            timelineHeight: 3,
            muteButtonSize: 32,
        },
    },
    timelineSettings: {
        type: ControlType.Object,
        title: "Timeline Controls",
        controls: {
            showTimeline: {
                type: ControlType.Boolean,
                title: "Show Timeline",
                description: "Show or hide the video playback timeline.",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
        },
        defaultValue: {
            showTimeline: true,
        },
    },
})