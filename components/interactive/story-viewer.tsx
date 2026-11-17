// Instagram Stories Emulator
// Replica delle stories di Instagram: cerchi con immagini profilo, tap per overlay con contenuti, swipe/tap per scorrere da dx a sx
import {
    useState,
    useRef,
    useCallback,
    useEffect,
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


/**
 * StoryViewer
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 120
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
// Animazione keyframes per play icon
const playPulseKeyframes = `@keyframes playPulse { 0% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.13); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }`
if (
    typeof window !== "undefined" &&
    !document.getElementById("playPulseKeyframes")
) {
    const style = document.createElement("style")
    style.id = "playPulseKeyframes"
    style.innerHTML = playPulseKeyframes
    document.head.appendChild(style)
}

// Animazione keyframes per ring animations
const ringAnimationKeyframes = `
@keyframes story-spin { 
    0% { transform: rotate(0deg); } 
    100% { transform: rotate(360deg); } 
}
@keyframes story-pulse { 
    0% { transform: scale(1); } 
    50% { transform: scale(1.05); } 
    100% { transform: scale(1); } 
}
@keyframes playPulse { 
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 
    50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.13); } 
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 
}`
if (
    typeof window !== "undefined" &&
    !document.getElementById("ringAnimationKeyframes")
) {
    const style = document.createElement("style")
    style.id = "ringAnimationKeyframes"
    style.innerHTML = ringAnimationKeyframes
    document.head.appendChild(style)
}

export default function StoryViewer(props) {
    const {
        stories,
        ringGradient,
        usernameFont,
        usernameColor,
        overlayBg,
        overlayTextColor,
        overlayFont,
        overlayAnimation,
        style,
    } = props
    const [openIndex, setOpenIndex] = useState(null)
    const [storyIndex, setStoryIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [overlayVisible, setOverlayVisible] = useState(false)
    const isStatic = useIsStaticRenderer()
    const overlayRef = useRef(null)
    const videoRef = useRef(null)

    // Close overlay on ESC e blocca scroll
    useEffect(() => {
        if (openIndex === null) return
        function onKey(e) {
            if (e.key === "Escape") startTransition(() => setOpenIndex(null))
        }
        window.addEventListener("keydown", onKey)
        // Blocca scroll
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = originalOverflow
        }
    }, [openIndex])

    // Tap/click to next story
    const handleOverlayClick = useCallback(
        (e) => {
            if (!overlayRef.current) return
            const rect = overlayRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            if (x > rect.width / 2) {
                // Next
                startTransition(() => {
                    if (storyIndex < stories[openIndex].items.length - 1) {
                        setStoryIndex(storyIndex + 1)
                    } else {
                        setOpenIndex(null)
                        setStoryIndex(0)
                    }
                })
            } else {
                // Prev
                startTransition(() => {
                    if (storyIndex > 0) {
                        setStoryIndex(storyIndex - 1)
                    } else {
                        setOpenIndex(null)
                        setStoryIndex(0)
                    }
                })
            }
        },
        [storyIndex, openIndex, stories]
    )

    // Open overlay with animation
    const handleOpen = (idx) => {
        startTransition(() => {
            setOpenIndex(idx)
            setStoryIndex(0)
            setOverlayVisible(false)
        })
    }

    // Helper function to get avatar source
    const getAvatarSrc = (avatar) => {
        if (!avatar)
            return "https://framerusercontent.com/assets/MFmOCFlEnwFAS9IP2HbUEH68axo.jpg"
        if (typeof avatar === "string") return avatar
        if (avatar.src) return avatar.src
        if (avatar.file) return avatar.file
        if (avatar.url) return avatar.url
        return "https://framerusercontent.com/assets/MFmOCFlEnwFAS9IP2HbUEH68axo.jpg"
    }

    // Helper function to get story item source
    const getItemSrc = (item) => {
        if (item.type === "image") {
            return (
                item.src ||
                item.src_file ||
                "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
            )
        }
        if (item.type === "video") {
            return item.videoFile || item.src || ""
        }
        return ""
    }

    // Animation trigger for overlay
    useEffect(() => {
        if (openIndex !== null) {
            setOverlayVisible(false)
            const timer = setTimeout(() => {
                startTransition(() => setOverlayVisible(true))
            }, 50)
            return () => clearTimeout(timer)
        } else {
            setOverlayVisible(false)
        }
    }, [openIndex])

    // Reset progress when story changes
    useEffect(() => {
        setProgress(0)
    }, [openIndex, storyIndex])

    // Progress bar timer for image/text
    useEffect(() => {
        if (openIndex === null) return

        const story = stories[openIndex]
        if (!story || !story.items || !story.items[storyIndex]) return

        const item = story.items[storyIndex]

        if (item.type === "image" || item.type === "text") {
            // Reset progress immediately
            setProgress(0)

            let animationId = null
            let isActive = true
            const startTime = performance.now()
            const duration = (item.duration || 10) * 1000 // Use custom duration or default 10s

            const updateProgress = (currentTime) => {
                if (!isActive) return

                const elapsed = currentTime - startTime
                const progressValue = Math.min(1, elapsed / duration)

                if (isActive) {
                    startTransition(() => setProgress(progressValue))
                }

                if (progressValue >= 1 && isActive) {
                    // Story completed, move to next
                    startTransition(() => {
                        if (storyIndex < story.items.length - 1) {
                            setStoryIndex(storyIndex + 1)
                        } else {
                            setOpenIndex(null)
                            setStoryIndex(0)
                        }
                    })
                } else if (isActive) {
                    animationId = requestAnimationFrame(updateProgress)
                }
            }

            // Start the animation
            animationId = requestAnimationFrame(updateProgress)

            return () => {
                isActive = false
                if (animationId) {
                    cancelAnimationFrame(animationId)
                }
            }
        }
    }, [openIndex, storyIndex, stories])

    // Progress bar for video
    useEffect(() => {
        if (openIndex === null) return
        const story = stories[openIndex]
        const item = story.items[storyIndex]
        if (item.type === "video" && videoRef.current) {
            const video = videoRef.current
            function update() {
                if (!video.duration) return
                startTransition(() =>
                    setProgress(video.currentTime / video.duration)
                )
            }
            function ended() {
                if (storyIndex < story.items.length - 1)
                    setStoryIndex(storyIndex + 1)
                else setOpenIndex(null)
            }
            video.addEventListener("timeupdate", update)
            video.addEventListener("ended", ended)
            return () => {
                video.removeEventListener("timeupdate", update)
                video.removeEventListener("ended", ended)
            }
        }
    }, [openIndex, storyIndex])

    const renderOverlay = () => {
        if (openIndex === null) return null
        const story = stories[openIndex]
        const item = story.items[storyIndex]

        const avatarSrc = getAvatarSrc(story.avatar)

        // Get animation style based on selection
        const getAnimationStyle = () => {
            const baseStyle = {
                transition: overlayVisible ? "all 0.3s ease-out" : "none",
            }

            if (!overlayVisible) {
                // Start state for animation
                switch (overlayAnimation) {
                    case "fade":
                        return { ...baseStyle, opacity: 0 }
                    case "zoom":
                        return {
                            ...baseStyle,
                            opacity: 0,
                            transform: "scale(0.8)",
                        }
                    case "slideUp":
                        return {
                            ...baseStyle,
                            opacity: 0,
                            transform: "translateY(50px)",
                        }
                    case "slideDown":
                        return {
                            ...baseStyle,
                            opacity: 0,
                            transform: "translateY(-50px)",
                        }
                    default:
                        return { ...baseStyle, opacity: 1 }
                }
            }

            // End state - visible with animation
            switch (overlayAnimation) {
                case "fade":
                    return { ...baseStyle, opacity: 1 }
                case "zoom":
                    return { ...baseStyle, opacity: 1, transform: "scale(1)" }
                case "slideUp":
                    return {
                        ...baseStyle,
                        opacity: 1,
                        transform: "translateY(0)",
                        transition: "all 0.3s cubic-bezier(.4,1.2,.4,1)",
                    }
                case "slideDown":
                    return {
                        ...baseStyle,
                        opacity: 1,
                        transform: "translateY(0)",
                        transition: "all 0.3s cubic-bezier(.4,1.2,.4,1)",
                    }
                default:
                    return { ...baseStyle, opacity: 1 }
            }
        }

        // Overlay background animation style
        const getOverlayBgStyle = () => {
            return {
                opacity: overlayVisible ? 1 : 0,
                transition: "opacity 0.3s ease-out",
            }
        }

        return (
            <div
                ref={overlayRef}
                style={{
                    position: "fixed",
                    zIndex: 9999,
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: overlayBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    ...getOverlayBgStyle(),
                }}
                onClick={isStatic ? undefined : handleOverlayClick}
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
            >
                {/* Top bar */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    {/* Progress bars */}
                    <div
                        style={{
                            display: "flex",
                            gap: 4,
                            width: 360,
                            maxWidth: "95vw",
                            marginTop: 12,
                        }}
                    >
                        {story.items.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    height: 3,
                                    borderRadius: 2,
                                    background:
                                        i < storyIndex
                                            ? "#fff"
                                            : "rgba(255,255,255,0.3)",
                                    overflow: "hidden",
                                    position: "relative",
                                }}
                            >
                                {i === storyIndex && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            height: "100%",
                                            width: `${progress * 100}%`,
                                            background: "#fff",
                                            borderRadius: 2,
                                            transition:
                                                item.type === "video"
                                                    ? "width 0.1s linear"
                                                    : "width 0.2s linear",
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    {/* User info */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginTop: 12,
                            gap: 10,
                            width: 360,
                            maxWidth: "95vw",
                        }}
                    >
                        <img
                            src={avatarSrc}
                            alt=""
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: `2px solid #fff`,
                            }}
                        />
                        <span
                            style={{
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: 16,
                                ...overlayFont,
                            }}
                        >
                            {story.username}
                        </span>
                    </div>
                </div>
                {/* Story content */}
                <div
                    style={{
                        width: 360,
                        height: 640,
                        maxWidth: "95vw",
                        maxHeight: "80vh",
                        borderRadius: props.overlayRadius || 24,
                        overflow: "hidden",
                        boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
                        background: "#000",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        ...getAnimationStyle(),
                    }}
                >
                    {item.type === "image" && (
                        <img
                            src={getItemSrc(item)}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    )}
                    {item.type === "video" && (
                        <video
                            ref={videoRef}
                            src={getItemSrc(item)}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                background: "#000",
                            }}
                            autoPlay
                            playsInline
                            controls={false}
                            muted={false}
                            onLoadedMetadata={() => {
                                if (videoRef.current) {
                                    videoRef.current.muted = false
                                    videoRef.current.volume = 1
                                    videoRef.current.play()
                                }
                            }}
                        />
                    )}
                    {item.type === "text" && (
                        <div
                            style={{
                                color: overlayTextColor,
                                ...overlayFont,
                                padding: 32,
                                fontSize: 32,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                            }}
                        >
                            {item.text}
                        </div>
                    )}
                </div>
                {/* Close area */}
                <button
                    style={{
                        position: "fixed",
                        top: 36,
                        right: 48,
                        background: "rgba(0,0,0,0.45)",
                        border: "none",
                        color: "#fff",
                        fontSize: 28,
                        borderRadius: "50%",
                        width: 44,
                        height: 44,
                        cursor: "pointer",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                        transition: "background 0.15s",
                    }}
                    onClick={
                        isStatic
                            ? undefined
                            : (e) => {
                                  e.stopPropagation()
                                  setOpenIndex(null)
                                  setStoryIndex(0)
                              }
                    }
                    aria-label="Close"
                >
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M6 6L16 16M16 6L6 16"
                            stroke="white"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>
        )
    }

    return (
        <div
            style={{
                display: "flex",
                gap: props.gap || 36,
                alignItems: "flex-start",
                justifyContent: "flex-start",
                width: style && style.width ? style.width : "100%",
                height: 120,
                ...style,
            }}
        >
            {stories.map((story, idx) => {
                const avatarSrc = getAvatarSrc(story.avatar)
                // Calculate container width based on gap - when gap is 0, use minimal width
                const containerWidth = (props.gap || 36) === 0 ? 90 : 140
                return (
                    <div
                        key={idx}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                            width: containerWidth, // Dynamic width based on gap
                        }}
                    >
                        {/* Ring */}
                        <div
                            style={{
                                background: "none",
                                border: `${props.ringStroke || 5}px solid ${props.ringColor || "#FF0080"}`,
                                borderRadius: "50%",
                                padding: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                                animation:
                                    props.ringAnimation === "spin"
                                        ? "story-spin 1.2s linear infinite"
                                        : props.ringAnimation === "pulse"
                                          ? "story-pulse 1.2s ease-in-out infinite"
                                          : undefined,
                            }}
                            onClick={
                                isStatic ? undefined : () => handleOpen(idx)
                            }
                            tabIndex={0}
                            aria-label={`Open story of ${story.username}`}
                        >
                            <img
                                src={avatarSrc}
                                alt=""
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    background: "#fff",
                                    border: "3px solid #fff",
                                    transition:
                                        "transform 0.18s cubic-bezier(.4,1.2,.4,1)",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                        "scale(1.05)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                        "scale(1)")
                                }
                            />
                            {/* Play icon if any video in story */}
                            {story.items.some(
                                (item) => item.type === "video"
                            ) &&
                                props.showPlayIcon && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: "50%",
                                            transform: "translate(-50%, -50%)",
                                            borderRadius: "8px",
                                            width: props.playIconSize || 28,
                                            height: props.playIconSize || 28,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "none",
                                            pointerEvents: "none",
                                            animation:
                                                "playPulse 1.2s ease-in-out infinite",
                                        }}
                                    >
                                        <svg
                                            width={
                                                props.playIconSize
                                                    ? props.playIconSize * 0.57
                                                    : 16
                                            }
                                            height={
                                                props.playIconSize
                                                    ? props.playIconSize * 0.57
                                                    : 16
                                            }
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <polygon
                                                points="6,4.5 12,8 6,11.5"
                                                fill="#fff"
                                                stroke="#fff"
                                                strokeLinejoin="round"
                                                strokeWidth="1.2"
                                                style={{
                                                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.12))",
                                                }}
                                            />
                                        </svg>
                                    </span>
                                )}
                        </div>
                        {/* Username */}
                        <span
                            style={{
                                marginTop: 10,
                                color: usernameColor,
                                ...usernameFont,
                                textAlign: "center",
                                display: "block",
                                wordBreak: "break-word",
                                whiteSpace: "normal",
                                maxWidth: 140,
                            }}
                        >
                            {story.username}
                        </span>
                    </div>
                )
            })}
            {renderOverlay()}
        </div>
    )
}

addPropertyControls(StoryViewer, {
    stories: {
        type: ControlType.Array,
        title: "Stories",
        description:
            "Collection of user stories with profile images and content items (images, videos, or text)",
        control: {
            type: ControlType.Object,
            controls: {
                username: { type: ControlType.String, defaultValue: "@framer" },
                avatar: {
                    type: ControlType.Object,
                    controls: {
                        src: {
                            type: ControlType.String,
                            title: "Avatar URL",
                            defaultValue:
                                "https://framerusercontent.com/assets/MFmOCFlEnwFAS9IP2HbUEH68axo.jpg",
                            hidden: (p, _, rootProps) =>
                                rootProps.__index !== 0,
                        },
                        file: {
                            type: ControlType.File,
                            allowedFileTypes: [
                                "jpg",
                                "jpeg",
                                "png",
                                "gif",
                                "webp",
                                "svg",
                            ],
                            hidden: (p, _, rootProps) =>
                                rootProps.__index === 0,
                        },
                    },
                },
                items: {
                    type: ControlType.Array,
                    control: {
                        type: ControlType.Object,
                        controls: {
                            type: {
                                type: ControlType.Enum,
                                options: ["image", "text", "video"],
                                optionTitles: ["Image", "Text", "Video"],
                                defaultValue: "image",
                            },
                            src: {
                                type: ControlType.String,
                                placeholder: "Image URL",
                                hidden: (p, _, rootProps) => {
                                    // Only allow link input for default story (index 0), else use file upload
                                    if (!rootProps || !rootProps.stories)
                                        return true
                                    const storyIdx =
                                        rootProps.stories.findIndex(
                                            (s) => s === rootProps
                                        )
                                    return (
                                        p.type !== "image" ||
                                        rootProps.__index !== 0
                                    )
                                },
                                defaultValue:
                                    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            },
                            src_file: {
                                type: ControlType.File,
                                allowedFileTypes: [
                                    "jpg",
                                    "jpeg",
                                    "png",
                                    "gif",
                                    "webp",
                                    "svg",
                                ],
                                hidden: (p, _, rootProps) => {
                                    // Only show file upload for non-default stories
                                    return (
                                        p.type !== "image" ||
                                        rootProps.__index === 0
                                    )
                                },
                            },
                            videoFile: {
                                type: ControlType.File,
                                allowedFileTypes: ["mp4", "webm", "mov"],
                                hidden: (p) => p.type !== "video",
                            },
                            text: {
                                type: ControlType.String,
                                defaultValue: "",
                                hidden: (p) => p.type !== "text",
                            },
                            textBg: {
                                type: ControlType.Color,
                                defaultValue: "#000",
                                hidden: (p) => p.type !== "text",
                            },
                            textColor: {
                                type: ControlType.Color,
                                defaultValue: "#fff",
                                hidden: (p) => p.type !== "text",
                            },
                            duration: {
                                type: ControlType.Number,
                                title: "Duration (sec)",
                                defaultValue: 10,
                                min: 1,
                                max: 30,
                                step: 1,
                                unit: "s",
                                hidden: (p) => p.type === "video",
                            },
                        },
                    },
                    defaultValue: [
                        {
                            type: "image",
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        },
                    ],
                },
            },
        },
        defaultValue: [
            {
                username: "@framer",
                avatar: {
                    src: "https://framerusercontent.com/assets/MFmOCFlEnwFAS9IP2HbUEH68axo.jpg",
                },
                items: [
                    {
                        type: "image",
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    },
                ],
            },
        ],
    },
    ringColor: {
        type: ControlType.Color,
        title: "Ring Color",
        defaultValue: "#FF0080",
    },
    ringStroke: {
        type: ControlType.Number,
        title: "Ring Stroke",
        defaultValue: 5,
        min: 1,
        max: 16,
        step: 1,
        unit: "px",
    },
    usernameFont: {
        type: ControlType.Font,
        title: "Username Font",
        description:
            "Typography settings for usernames displayed below profile pictures",
        defaultValue: {
            fontSize: 18,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    usernameColor: {
        type: ControlType.Color,
        title: "Username Color",
        defaultValue: "#000",
    },
    overlayBg: {
        type: ControlType.Color,
        title: "Overlay BG",
        defaultValue: "#181818",
    },
    overlayTextColor: {
        type: ControlType.Color,
        title: "Overlay Text",
        defaultValue: "#fff",
    },
    overlayFont: {
        type: ControlType.Font,
        title: "Overlay Font",
        description:
            "Typography settings for text content displayed in story overlay and user information",
        defaultValue: {
            fontSize: 18,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        description: "Controls the spacing between story profile circles",
        defaultValue: 36,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    playIconSize: {
        type: ControlType.Number,
        title: "Play Icon Size",
        description: "Size of the play icon that appears on video stories",
        defaultValue: 28,
        min: 16,
        max: 48,
        step: 2,
        unit: "px",
    },
    ringAnimation: {
        type: ControlType.Enum,
        title: "Ring Animation",
        description: "Animation effect for the story ring border",
        options: ["none", "spin", "pulse"],
        optionTitles: ["None", "Spin", "Pulse"],
        defaultValue: "none",
    },
    showPlayIcon: {
        type: ControlType.Boolean,
        title: "Show Play Icon",
        description: "Toggle the visibility of the play icon on video stories",
        defaultValue: true,
    },
    overlayAnimation: {
        type: ControlType.Enum,
        title: "Overlay Animation",
        description: "Animation effect when the story overlay appears",
        options: ["none", "fade", "zoom", "slideUp", "slideDown"],
        optionTitles: ["None", "Fade In", "Zoom In", "Slide Up", "Slide Down"],
        defaultValue: "fade",
    },
    overlayRadius: {
        type: ControlType.Number,
        title: "Overlay Radius",
        description: "Border radius for the overlay story content",
        defaultValue: 24,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
})
