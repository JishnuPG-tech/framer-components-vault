import * as React from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

interface MinimalVideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
    sourceType: "url" | "upload"
    videoUrl: string
    videoFile?: string
    playing: boolean
    posterEnabled: boolean
    posterImage?: { src: string; alt?: string }
    videoBackground: string
    startTime: number
    loop: boolean
    objectFit: "cover" | "contain" | "fill"
    muted: boolean

    playerBackground: string
    lightShadowColor: string
    darkShadowColor: string
    progressFillType: "solid" | "gradient"
    progressSolidColor: string
    progressStart: string
    progressEnd: string
    iconColor: string
    stopIconColor: string
    containerRadius: number
    videoRadius: number
    buttonRadius: number
    disableAnimation: boolean
    style?: CSSProperties
}

/**
 * Minimalist Elegant Video Player
 * A beautifully styled, custom HTML5 video player with soft neumorphic controls.
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MinimalVideoPlayer(props: MinimalVideoPlayerProps) {
    const {
        sourceType = "url",
        videoUrl = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        videoFile,
        playing = false,
        posterEnabled = false,
        posterImage,
        videoBackground = "#000000",
        startTime = 0,
        loop = true,
        objectFit = "cover",
        muted = false,

        playerBackground = "#ffffff",
        lightShadowColor = "rgba(255, 255, 255, 0.4)",
        darkShadowColor = "rgba(203, 213, 225, 0.6)",
        progressFillType = "gradient",
        progressSolidColor = "#b0e8ea",
        progressStart = "#b0e8ea",
        progressEnd = "#66cbd8",
        iconColor = "#758496",
        stopIconColor = "#66cbd8",
        containerRadius = 28,
        videoRadius = 16,
        buttonRadius = 50,
        disableAnimation = false,
        style,
        ...rest
    } = props

    const src = sourceType === "url" ? videoUrl : videoFile

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas || isStatic

    const videoRef = React.useRef<HTMLVideoElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)

    // Manage play state locally so we can toggle it, but initialize based on 'playing' prop
    const [isPlaying, setIsPlaying] = React.useState(playing && !isCanvas)
    const [progress, setProgress] = React.useState(startTime)
    const [isDragging, setIsDragging] = React.useState(false)

    // Sync isPlaying with the video element correctly on mount/prop change
    React.useEffect(() => {
        if (!videoRef.current || isCanvas) return

        if (playing) {
            videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false))
        } else {
            videoRef.current.pause()
            setIsPlaying(false)
        }
    }, [playing, isCanvas, src])

    // Handle smooth progress updates
    React.useEffect(() => {
        let animationFrameId: number

        const updateSmoothProgress = () => {
            if (videoRef.current && !videoRef.current.paused && !isDragging) {
                const percentage =
                    (videoRef.current.currentTime / videoRef.current.duration) *
                        100 || 0
                React.startTransition(() => {
                    setProgress(percentage)
                })
            }
            animationFrameId = requestAnimationFrame(updateSmoothProgress)
        }

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(updateSmoothProgress)
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [isPlaying, isDragging])

    const handleLoadedMetadata = () => {
        if (videoRef.current && startTime > 0) {
            const startSec = (startTime / 100) * videoRef.current.duration
            videoRef.current.currentTime = startSec
            setProgress(startTime)
        }
    }

    const togglePlay = () => {
        if (isCanvas) return // Do not play in the canvas editor
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play()
                setIsPlaying(true)
            } else {
                videoRef.current.pause()
                setIsPlaying(false)
            }
        }
    }

    const handleVideoEnded = () => {
        if (!loop) {
            setIsPlaying(false)
            setProgress(0)
            if (videoRef.current) {
                videoRef.current.currentTime = 0
            }
        }
    }

    // Draggable Thumb Logic
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!trackRef.current || !videoRef.current || isCanvas) return
        setIsDragging(true)
        updateProgressFromEvent(e.clientX)
        trackRef.current.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || !trackRef.current || !videoRef.current || isCanvas)
            return
        updateProgressFromEvent(e.clientX)
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || !trackRef.current || isCanvas) return
        setIsDragging(false)
        trackRef.current.releasePointerCapture(e.pointerId)
    }

    const updateProgressFromEvent = (clientX: number) => {
        if (!trackRef.current || !videoRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        const clickPos = clientX - rect.left
        const percentage = Math.max(0, Math.min(1, clickPos / rect.width))

        videoRef.current.currentTime = percentage * videoRef.current.duration
        setProgress(percentage * 100)
    }

    // Determine transitioning shadows based on animation settings and play state
    const buttonShadow =
        !disableAnimation && isPlaying
            ? `inset 3px 3px 6px ${darkShadowColor}, inset -2px -2px 4px ${lightShadowColor}`
            : `4px 4px 12px ${darkShadowColor}, -2px -2px 6px ${lightShadowColor}`

    const transitionStyles = disableAnimation ? "none" : "all 0.3s ease"
    const svgTransition = disableAnimation
        ? "none"
        : "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"

    return (
        <div
            {...rest}
            style={{
                ...style,
                width: "100%",
                background: playerBackground,
                borderRadius: containerRadius,
                boxShadow: `8px 8px 20px ${darkShadowColor}, -3px -3px 10px ${lightShadowColor}`,
                padding: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                transition: transitionStyles,
            }}
        >
            {/* Video Wrapper */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    borderRadius: videoRadius,
                    overflow: "hidden",
                    background: videoBackground,
                    border: `1px solid ${darkShadowColor}`,
                    boxShadow: `4px 4px 12px ${darkShadowColor}, -2px -2px 6px ${lightShadowColor}`,
                }}
            >
                <video
                    ref={videoRef}
                    src={src}
                    playsInline
                    loop={loop}
                    muted={muted}
                    poster={
                        posterEnabled && posterImage
                            ? posterImage.src
                            : undefined
                    }
                    onEnded={handleVideoEnded}
                    onLoadedMetadata={handleLoadedMetadata}
                    style={{
                        width: "100%",
                        display: "block",
                        objectFit: objectFit,
                        background: videoBackground,
                    }}
                />
            </div>

            {/* Timeline Area */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    height: "16px",
                    padding: "0 5px",
                }}
            >
                <div
                    ref={trackRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "6px",
                        background: playerBackground,
                        borderRadius: "6px",
                        boxShadow: `inset 1px 1px 3px ${darkShadowColor}, inset -1px -1px 2px ${lightShadowColor}`,
                        cursor: isCanvas ? "default" : "pointer",
                        touchAction: "none", // Prevent scroll interference when dragging on touch devices
                    }}
                >
                    {/* Progress Bar */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: `${progress}%`,
                            background:
                                progressFillType === "solid"
                                    ? progressSolidColor
                                    : `linear-gradient(90deg, ${progressStart}, ${progressEnd})`,
                            borderRadius: "6px",
                            pointerEvents: "none",
                            transition:
                                isDragging || isPlaying
                                    ? "none"
                                    : disableAnimation
                                      ? "none"
                                      : "width 0.2s linear",
                        }}
                    />
                    {/* Thumb */}
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: `${progress}%`,
                            transform: "translate(-50%, -50%)",
                            width: "14px",
                            height: "14px",
                            background: playerBackground,
                            borderRadius: "50%",
                            boxShadow: `2px 2px 4px ${darkShadowColor}, -1px -1px 2px ${lightShadowColor}`,
                            pointerEvents: "none", // Let the track container handle the pointer events
                            transition:
                                isDragging || isPlaying
                                    ? "none"
                                    : disableAnimation
                                      ? "none"
                                      : "left 0.2s linear",
                        }}
                    />
                </div>
            </div>

            {/* Controls Area */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingBottom: "5px",
                }}
            >
                <button
                    onClick={togglePlay}
                    style={{
                        position: "relative",
                        width: "60px",
                        height: "60px",
                        borderRadius: `${buttonRadius}%`,
                        background: "transparent",
                        border: "none",
                        boxShadow: buttonShadow,
                        cursor: isCanvas ? "default" : "pointer",
                        transition: disableAnimation
                            ? "none"
                            : "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
                        outline: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Play Icon */}
                    <svg
                        viewBox="0 0 24 24"
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "20px",
                            height: "20px",
                            fill: iconColor,
                            transition: svgTransition,
                            opacity: isPlaying ? 0 : 1,
                            transform: isPlaying
                                ? "translate(calc(-50% + 2px), -50%) scale(0.5) rotate(45deg)"
                                : "translate(calc(-50% + 2px), -50%) scale(1) rotate(0deg)",
                        }}
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>

                    {/* Stop Icon */}
                    <svg
                        viewBox="0 0 24 24"
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "20px",
                            height: "20px",
                            fill: isPlaying ? stopIconColor : iconColor,
                            transition: svgTransition,
                            opacity: isPlaying ? 1 : 0,
                            transform: isPlaying
                                ? "translate(-50%, -50%) scale(1) rotate(0deg)"
                                : "translate(-50%, -50%) scale(0.5) rotate(-45deg)",
                        }}
                    >
                        <path d="M6 6h12v12H6z" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

// Define the property controls for the Framer UI
addPropertyControls(MinimalVideoPlayer, {
    sourceType: {
        type: ControlType.Enum,
        title: "Source",
        options: ["url", "upload"],
        optionTitles: ["URL", "Upload"],
        defaultValue: "url",
    },
    videoUrl: {
        type: ControlType.String,
        title: "URL",
        defaultValue:
            "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        hidden(props) {
            return props.sourceType !== "url"
        },
    },
    videoFile: {
        type: ControlType.File,
        title: "File",
        allowedFileTypes: ["mp4", "webm", "ogg"],
        hidden(props) {
            return props.sourceType !== "upload"
        },
    },
    playing: {
        type: ControlType.Boolean,
        title: "Playing",
        defaultValue: false,
    },
    posterEnabled: {
        type: ControlType.Boolean,
        title: "Poster",
        defaultValue: false,
    },
    posterImage: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden(props) {
            return !props.posterEnabled
        },
    },
    videoBackground: {
        type: ControlType.Color,
        title: "Vid Bg",
        defaultValue: "#000000",
    },
    startTime: {
        type: ControlType.Number,
        title: "Start %",
        description: "Initial start time percentage",
        min: 0,
        max: 100,
        defaultValue: 0,
        displayStepper: false,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: false,
    },
    playerBackground: {
        type: ControlType.Color,
        title: "Card Bg",
        defaultValue: "#ffffff",
    },
    lightShadowColor: {
        type: ControlType.Color,
        title: "L. Shadow",
        defaultValue: "rgba(255, 255, 255, 0.4)",
    },
    darkShadowColor: {
        type: ControlType.Color,
        title: "D. Shadow",
        defaultValue: "rgba(203, 213, 225, 0.6)",
    },
    progressFillType: {
        type: ControlType.Enum,
        title: "Prog Fill",
        options: ["solid", "gradient"],
        optionTitles: ["Solid", "Gradient"],
        defaultValue: "gradient",
    },
    progressSolidColor: {
        type: ControlType.Color,
        title: "Prog Color",
        defaultValue: "#b0e8ea",
        hidden(props) {
            return props.progressFillType !== "solid"
        },
    },
    progressStart: {
        type: ControlType.Color,
        title: "Prog Start",
        defaultValue: "#b0e8ea",
        hidden(props) {
            return props.progressFillType !== "gradient"
        },
    },
    progressEnd: {
        type: ControlType.Color,
        title: "Prog End",
        defaultValue: "#66cbd8",
        hidden(props) {
            return props.progressFillType !== "gradient"
        },
    },
    iconColor: {
        type: ControlType.Color,
        title: "Play Icon",
        defaultValue: "#758496",
    },
    stopIconColor: {
        type: ControlType.Color,
        title: "Stop Icon",
        defaultValue: "#66cbd8",
    },
    containerRadius: {
        type: ControlType.Number,
        title: "Radius",
        description: "Outer container border radius",
        min: 0,
        max: 100,
        defaultValue: 28,
        displayStepper: true,
    },
    videoRadius: {
        type: ControlType.Number,
        title: "Vid Radius",
        description: "Inner video border radius",
        min: 0,
        max: 100,
        defaultValue: 16,
        displayStepper: true,
    },
    buttonRadius: {
        type: ControlType.Number,
        title: "Btn Radius",
        description: "Play/Stop button border radius",
        min: 0,
        max: 100,
        defaultValue: 50,
        displayStepper: true,
    },
    disableAnimation: {
        type: ControlType.Boolean,
        title: "No Anim",
        description: "Disable micro-interactions",
        defaultValue: false,
    },
})
