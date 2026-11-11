// iPhone mockup component with realistic body and video upload features, fully customizable
import { useState, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface IPhoneMockupProps {
    deviceColor: string
    screenBackgroundColor: string
    videoSourceType: "file" | "url"
    videoFile: string
    videoUrl: string
    posterImage: { src: string; alt: string }
    showControls: boolean
    autoplay: boolean
    loop: boolean
    muted: boolean
    borderRadius: number
    screenPadding: number
    notchColor: string
    showReflection: boolean
    style?: CSSProperties
}

/**
 * iPhone Mockup with Video Upload
 * 
 * A realistic iPhone mockup component with customizable video upload and playback features
 * 
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 600
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function IPhoneMockup(props: IPhoneMockupProps) {
    const {
        deviceColor = "#1a1a1a",
        screenBackgroundColor = "#000000",
        videoSourceType = "file",
        videoFile = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        videoUrl = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        posterImage = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Video poster" },
        showControls = true,
        autoplay = false,
        loop = true,
        muted = true,
        borderRadius = 45,
        screenPadding = 8,
        notchColor = "#000000",
        showReflection = true,
        style
    } = props

    const [isPlaying, setIsPlaying] = useState(autoplay)
    const videoRef = useRef<HTMLVideoElement>(null)

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            startTransition(() => setIsPlaying(!isPlaying))
        }
    }

    const deviceWidth = style?.width === "100%" ? "100%" : "300px"
    const deviceHeight = style?.height === "100%" ? "100%" : "600px"

    // Get the correct video source based on type
    const videoSource = videoSourceType === "file" ? videoFile : videoUrl

    // Helper function to detect and convert Vimeo URLs
    const getVimeoEmbedUrl = (url: string): string | null => {
        const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/
        const match = url.match(vimeoRegex)
        if (match && match[1]) {
            const videoId = match[1]
            const params = new URLSearchParams()
            if (autoplay) params.append("autoplay", "1")
            if (loop) params.append("loop", "1")
            if (muted) params.append("muted", "1")
            params.append("controls", showControls ? "1" : "0")
            return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
        }
        return null
    }

    const isVimeo = videoSourceType === "url" && getVimeoEmbedUrl(videoUrl) !== null
    const vimeoEmbedUrl = isVimeo ? getVimeoEmbedUrl(videoUrl) : null

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: deviceWidth,
                height: deviceHeight,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {/* iPhone Body */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: deviceColor,
                    borderRadius: borderRadius,
                    padding: `${screenPadding}px`,
                    boxShadow: showReflection 
                        ? `0 25px 50px rgba(0, 0, 0, 0.25), 0 12px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                        : `0 8px 32px rgba(0, 0, 0, 0.3)`,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Dynamic Island / Notch */}
                <div
                    style={{
                        position: "absolute",
                        top: screenPadding + 12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "120px",
                        height: "30px",
                        backgroundColor: notchColor,
                        borderRadius: "15px",
                        zIndex: 10,
                    }}
                />

                {/* Screen */}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: screenBackgroundColor,
                        borderRadius: borderRadius - screenPadding,
                        overflow: "hidden",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {/* Video Container */}
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {isVimeo ? (
                            <iframe
                                src={vimeoEmbedUrl || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    borderRadius: borderRadius - screenPadding - 2,
                                }}
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    src={videoSource}
                                    poster={posterImage.src}
                                    autoPlay={autoplay}
                                    loop={loop}
                                    muted={muted}
                                    controls={showControls}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: borderRadius - screenPadding - 2,
                                    }}
                                    onPlay={() => startTransition(() => setIsPlaying(true))}
                                    onPause={() => startTransition(() => setIsPlaying(false))}
                                />

                                {/* Custom Play/Pause Overlay (when controls are hidden) */}
                                {!showControls && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                                            opacity: isPlaying ? 0 : 1,
                                            transition: "opacity 0.3s ease",
                                        }}
                                        onClick={handlePlayPause}
                                    >
                                        <div
                                            style={{
                                                width: "60px",
                                                height: "60px",
                                                borderRadius: "50%",
                                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                                                backdropFilter: "blur(10px)",
                                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0.4px rgba(255, 255, 255, 1)",
                                            }}
                                        >
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                style={{ marginLeft: isPlaying ? "0" : "2px" }}
                                            >
                                                {isPlaying ? (
                                                    <>
                                                        <rect x="6" y="4" width="4" height="16" fill="#000" />
                                                        <rect x="14" y="4" width="4" height="16" fill="#000" />
                                                    </>
                                                ) : (
                                                    <polygon points="8,5 19,12 8,19" fill="#000" />
                                                )}
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Home Indicator */}
                <div
                    style={{
                        position: "absolute",
                        bottom: screenPadding + 8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "134px",
                        height: "5px",
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                        borderRadius: "2.5px",
                    }}
                />
            </div>
        </div>
    )
}

addPropertyControls(IPhoneMockup, {
    videoSourceType: {
        type: ControlType.Enum,
        title: "Video Source",
        options: ["file", "url"],
        optionTitles: ["File", "URL"],
        defaultValue: "file",
        displaySegmentedControl: true,
    },
    videoFile: {
        type: ControlType.File,
        title: "Video File",
        allowedFileTypes: ["mp4", "webm", "mov", "avi"],
        hidden: ({ videoSourceType }) => videoSourceType !== "file",
    },
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        defaultValue: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        placeholder: "Enter video URL...",
        hidden: ({ videoSourceType }) => videoSourceType !== "url",
    },
    posterImage: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description: "We recommend adding a poster image",
    },
    deviceColor: {
        type: ControlType.Color,
        title: "Device Color",
        defaultValue: "#1a1a1a",
    },
    screenBackgroundColor: {
        type: ControlType.Color,
        title: "Screen Background",
        defaultValue: "#000000",
    },
    notchColor: {
        type: ControlType.Color,
        title: "Notch Color",
        defaultValue: "#000000",
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop Video",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 45,
        min: 20,
        max: 60,
        step: 1,
        unit: "px",
    },
    screenPadding: {
        type: ControlType.Number,
        title: "Screen Padding",
        defaultValue: 8,
        min: 4,
        max: 20,
        step: 1,
        unit: "px",
    },
    showReflection: {
        type: ControlType.Boolean,
        title: "Reflection",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})