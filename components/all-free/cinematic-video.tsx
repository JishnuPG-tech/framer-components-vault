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

import { motion, AnimatePresence } from "framer-motion"

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 400
 * @framerDisableUnlink
 *
 * @framerComponentTitle Cinematic Video
 */
export default function CinematicVideo(props) {
    const [isPlaying, setIsPlaying] = React.useState(false)
    const videoRef = React.useRef(null)

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return

        if (isPlaying) {
            video.pause()
            setIsPlaying(false)
        } else {
            video.play()
            setIsPlaying(true)
        }
    }

    const videoSource = props.videoFile || props.videoUrl
    const defaultThumbnail =
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop"
    const posterSrc = props.thumbnail?.src || defaultThumbnail
    const currentText = isPlaying ? props.pauseText : props.playText
    const shouldHideText = isPlaying && props.hideTextOnPlay

    return (
        <div
            style={{
                width: "100%", // Changed to 100% to fill Framer's container
                height: "100%", // Changed to 100% to fill Framer's container
                ...containerStyle,
                ...props.style, // Let Framer's canvas override the sizes
                borderRadius: props.radius,
            }}
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={videoSource}
                poster={posterSrc}
                style={videoStyle}
                playsInline
                loop={props.loop}
                muted={props.muted}
            />

            <motion.div
                style={overlayContainerStyle}
                animate={{ opacity: shouldHideText ? 0 : 1 }}
                transition={{
                    duration: props.fadeDuration,
                    delay: shouldHideText ? props.fadeDelay : 0,
                    ease: "easeInOut",
                }}
            >
                <div style={gradientStyle} />

                <AnimatePresence mode="wait">
                    <motion.h1
                        key={currentText}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            ...props.font,
                            ...textStyle,
                            color: props.textColor,
                        }}
                    >
                        {currentText}
                    </motion.h1>
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

// --- Styles ---

const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#000",
    cursor: "pointer",
    transform: "translateZ(0)",
}

const videoStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
}

const overlayContainerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    zIndex: 10,
    pointerEvents: "none",
}

const gradientStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "60%",
    background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)",
    zIndex: -1,
}

const textStyle: React.CSSProperties = {
    margin: 0,
    padding: "20px 30px",
    fontSize: "clamp(40px, 12vw, 120px)",
    lineHeight: 1,
}

// --- Framer Controls ---

addPropertyControls(CinematicVideo, {
    videoFile: {
        type: ControlType.File,
        title: "Upload",
        allowedFileTypes: ["mp4", "webm"],
    },
    videoUrl: {
        type: ControlType.String,
        title: "URL",
        defaultValue:
            "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4",
        placeholder: "https://example.com/video.mp4",
    },
    thumbnail: {
        type: ControlType.ResponsiveImage,
        title: "Thumbnail",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: 80,
            variant: "Medium",
        },
        defaultFontType: "sans-serif",
        controls: "extended",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    playText: {
        type: ControlType.String,
        title: "Play Text",
        defaultValue: "Play",
    },
    pauseText: {
        type: ControlType.String,
        title: "Pause Text",
        defaultValue: "Pause",
    },
    hideTextOnPlay: {
        type: ControlType.Boolean,
        title: "Hide on Play",
        defaultValue: true,
    },
    fadeDelay: {
        type: ControlType.Number,
        title: "Fade Delay (s)",
        defaultValue: 1.5,
        min: 0,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade Duration (s)",
        defaultValue: 0.8,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 30,
        min: 0,
        max: 100,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
    },
})
