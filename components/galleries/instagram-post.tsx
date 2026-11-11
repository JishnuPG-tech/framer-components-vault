// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"
import { useState, useCallback, useRef, useEffect } from "react"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 470
 * @framerIntrinsicHeight 760
 */
export default function InstagramPost(props) {
    const {
        mediaType,
        image,
        video,
        userAvatar,
        username,
        location,
        caption,
        likes,
        timeAgo,
        isVerified,
        isLiked: initialLiked,
        isSaved: initialSaved,
        showComments,
        commentsCount,
        objectFit,
        mediaHeight,
        theme,
        style,
    } = props

    const [isLiked, setIsLiked] = useState(initialLiked)
    const [isSaved, setIsSaved] = useState(initialSaved)
    const [likesCount, setLikesCount] = useState(likes)
    const [isPlaying, setIsPlaying] = useState(false)
    const [showHeartAnimation, setShowHeartAnimation] = useState(false)
    const videoRef = useRef(null)

    // Theme colors
    const colors =
        theme === "dark"
            ? {
                  background: "#000",
                  text: "#fff",
                  secondaryText: "#a8a8a8",
                  border: "#262626",
              }
            : {
                  background: "#fff",
                  text: "#262626",
                  secondaryText: "#8e8e8e",
                  border: "#dbdbdb",
              }

    // Initialize state from props
    useEffect(() => {
        setIsLiked(initialLiked)
        setIsSaved(initialSaved)
        setLikesCount(likes)
    }, [initialLiked, initialSaved, likes])

    const handleLike = useCallback(() => {
        const newLikedState = !isLiked
        setIsLiked(newLikedState)
        setLikesCount((current) => (newLikedState ? current + 1 : current - 1))

        if (newLikedState) {
            setShowHeartAnimation(true)
            setTimeout(() => setShowHeartAnimation(false), 1000)
        }
    }, [isLiked])

    const handleDoubleTap = useCallback(() => {
        if (!isLiked) {
            setIsLiked(true)
            setLikesCount((current) => current + 1)
            setShowHeartAnimation(true)
            setTimeout(() => setShowHeartAnimation(false), 1000)
        }
    }, [isLiked])

    const handleSave = useCallback(() => {
        setIsSaved((prev) => !prev)
    }, [])

    const handleVideoToggle = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }, [isPlaying])

    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.pause()
            }
        }
    }, [])

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K"
        }
        return num.toString()
    }

    const imageSource =
        image?.src ||
        image ||
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
    const videoSource = video?.src || video || ""
    const avatarSource = userAvatar?.src || userAvatar || ""

    return (
        <motion.div
            style={{
                ...style,
                width: "100%",
                maxWidth: "470px",
                backgroundColor: colors.background,
                borderRadius: "8px",
                overflow: "hidden",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                border:
                    theme === "light" ? `1px solid ${colors.border}` : "none",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: colors.background,
                    borderBottom:
                        theme === "light"
                            ? `1px solid ${colors.border}`
                            : "none",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: avatarSource
                                ? `url(${avatarSource}) center/cover`
                                : "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                            border: `2px solid ${colors.background}`,
                        }}
                    />
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                marginBottom: "2px",
                            }}
                        >
                            <span
                                style={{
                                    color: colors.text,
                                    fontSize: "14px",
                                    fontWeight: "600",
                                }}
                            >
                                {username}
                            </span>
                            {isVerified && (
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 40 40"
                                    fill="none"
                                >
                                    <path
                                        d="M19.9998 1.66675L25.2915 13.8334L38.3332 16.0417L29.8332 25.2084L31.2498 38.3334L19.9998 32.7084L8.74984 38.3334L10.1665 25.2084L1.6665 16.0417L14.7082 13.8334L19.9998 1.66675Z"
                                        fill="#0095F6"
                                    />
                                    <path
                                        d="M14.1665 20.0001L17.9165 23.7501L26.6665 15.0001"
                                        stroke="white"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </div>
                        {location && (
                            <span
                                style={{ color: colors.text, fontSize: "11px" }}
                            >
                                {location}
                            </span>
                        )}
                    </div>
                </div>
                <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
                    <circle cx="2" cy="2" r="2" fill={colors.text} />
                    <circle cx="8" cy="2" r="2" fill={colors.text} />
                    <circle cx="14" cy="2" r="2" fill={colors.text} />
                </svg>
            </div>

            <div
                style={{
                    width: "100%",
                    height: `${mediaHeight}px`,
                    backgroundColor: theme === "light" ? "#fafafa" : "#000",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {mediaType === "image" ? (
                    <motion.img
                        src={imageSource}
                        alt="Instagram post"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: objectFit,
                            display: "block",
                        }}
                        onDoubleClick={handleDoubleTap}
                    />
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            src={videoSource}
                            loop
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: objectFit,
                                display: "block",
                            }}
                            onDoubleClick={handleDoubleTap}
                            onClick={handleVideoToggle}
                        />
                        {!isPlaying && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: "64px",
                                    height: "64px",
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    zIndex: 5,
                                }}
                                onClick={handleVideoToggle}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="white"
                                    style={{ marginLeft: "3px" }}
                                >
                                    <path d="M5 3.5v13l11-6.5z" />
                                </svg>
                            </motion.div>
                        )}
                    </>
                )}

                <AnimatePresence>
                    {showHeartAnimation && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                scale: [0, 1.1, 1.2, 0],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 1,
                                times: [0, 0.15, 0.85, 1],
                                ease: "easeOut",
                            }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                pointerEvents: "none",
                                zIndex: 10,
                            }}
                        >
                            <svg
                                width="120"
                                height="120"
                                viewBox="0 0 24 24"
                                fill="white"
                            >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div
                style={{
                    padding: "12px 16px",
                    backgroundColor: colors.background,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                    }}
                >
                    <div style={{ display: "flex", gap: "16px" }}>
                        <motion.div
                            whileTap={{ scale: 0.85 }}
                            onClick={handleLike}
                            style={{ cursor: "pointer" }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.svg
                                    key={isLiked ? "liked" : "unliked"}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    transition={{ duration: 0.15 }}
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill={isLiked ? "#ff3040" : "none"}
                                    stroke={isLiked ? "#ff3040" : colors.text}
                                    strokeWidth="2"
                                >
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </motion.svg>
                            </AnimatePresence>
                        </motion.div>

                        <motion.div
                            whileTap={{ scale: 0.85 }}
                            style={{ cursor: "pointer" }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={colors.text}
                                strokeWidth="2"
                            >
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                        </motion.div>

                        <motion.div
                            whileTap={{ scale: 0.85 }}
                            style={{ cursor: "pointer" }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={colors.text}
                                strokeWidth="2"
                            >
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </motion.div>
                    </div>

                    <motion.div
                        whileTap={{ scale: 0.85 }}
                        onClick={handleSave}
                        style={{ cursor: "pointer" }}
                    >
                        {isSaved ? (
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill={colors.text}
                            >
                                <polygon points="19 21 12 16 5 21 5 3 19 3 19 21" />
                            </svg>
                        ) : (
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={colors.text}
                                strokeWidth="2"
                            >
                                <polygon points="19 21 12 16 5 21 5 3 19 3 19 21" />
                            </svg>
                        )}
                    </motion.div>
                </div>

                <div
                    style={{
                        color: colors.text,
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "8px",
                    }}
                >
                    {formatNumber(likesCount)} likes
                </div>

                {caption && (
                    <div
                        style={{
                            color: colors.text,
                            fontSize: "14px",
                            marginBottom: "4px",
                            lineHeight: "18px",
                        }}
                    >
                        <span style={{ fontWeight: "600", marginRight: "6px" }}>
                            {username}
                        </span>
                        <span>{caption}</span>
                    </div>
                )}

                {showComments && commentsCount > 0 && (
                    <div
                        style={{
                            color: colors.secondaryText,
                            fontSize: "14px",
                            marginBottom: "4px",
                            cursor: "pointer",
                        }}
                    >
                        View all {commentsCount} comments
                    </div>
                )}

                <div
                    style={{
                        color: colors.secondaryText,
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.2px",
                    }}
                >
                    {timeAgo}
                </div>
            </div>
        </motion.div>
    )
}

InstagramPost.defaultProps = {
    mediaType: "image",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    video: "",
    userAvatar: "",
    username: "username",
    location: "",
    caption: "Beautiful view! 🌅",
    likes: 1234,
    timeAgo: "2 hours ago",
    isVerified: false,
    isLiked: false,
    isSaved: false,
    showComments: true,
    commentsCount: 42,
    objectFit: "cover",
    mediaHeight: 600,
    theme: "dark",
}

addPropertyControls(InstagramPost, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    mediaType: {
        type: ControlType.Enum,
        title: "Media Type",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: (props) => props.mediaType !== "image",
    },
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["video/*"],
        hidden: (props) => props.mediaType !== "video",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Object Fit",
        options: ["cover", "contain", "fill", "none", "scale-down"],
        optionTitles: ["Cover", "Contain", "Fill", "None", "Scale Down"],
        defaultValue: "cover",
    },
    mediaHeight: {
        type: ControlType.Number,
        title: "Media Height",
        min: 200,
        max: 2000,
        step: 10,
        unit: "px",
        defaultValue: 600,
    },
    username: {
        type: ControlType.String,
        title: "Username",
        defaultValue: "username",
    },
    userAvatar: {
        type: ControlType.ResponsiveImage,
        title: "Avatar",
    },
    location: {
        type: ControlType.String,
        title: "Location",
    },
    isVerified: {
        type: ControlType.Boolean,
        title: "Verified",
        defaultValue: false,
    },
    caption: {
        type: ControlType.String,
        title: "Caption",
        displayTextArea: true,
    },
    likes: {
        type: ControlType.Number,
        title: "Initial Likes",
        min: 0,
        step: 1,
        defaultValue: 1234,
    },
    isLiked: {
        type: ControlType.Boolean,
        title: "Initially Liked",
        defaultValue: false,
    },
    isSaved: {
        type: ControlType.Boolean,
        title: "Initially Saved",
        defaultValue: false,
    },
    showComments: {
        type: ControlType.Boolean,
        title: "Show Comments",
        defaultValue: true,
    },
    commentsCount: {
        type: ControlType.Number,
        title: "Comments Count",
        min: 0,
        step: 1,
        defaultValue: 42,
        hidden: (props) => !props.showComments,
    },
    timeAgo: {
        type: ControlType.String,
        title: "Time Ago",
        defaultValue: "2 hours ago",
    },
})
