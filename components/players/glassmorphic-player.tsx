// Skeumorphic audio player component with full customization and controls
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

import { motion } from "framer-motion"

interface AudioPlayerProps {
    audioFile: string
    style: {
        backgroundColor: string
        blurSize: number
        accentColor: string
        playIconColor: string
        textColor: string
        progressColor: string
        trackColor: string
    }
    autoPlay: boolean
    loop: boolean
    title: string
    artist: string
    titleFont: CSSProperties
    artistFont: CSSProperties
}

/**
 * Skeumorphic Audio Player
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function AudioPlayer(props: AudioPlayerProps) {
    const {
        audioFile = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3",
        style: {
            backgroundColor = "rgba(255, 255, 255, 0)",
            blurSize = 20,
            accentColor = "#FFFFFF",
            playIconColor = "#000000",
            textColor = "#FFFFFF",
            progressColor = "#000000",
            trackColor = "rgba(204, 204, 204, 0)",
        } = {},
        autoPlay = false,
        loop = false,
        title = "Audio Track",
        artist = "Artist Name",
        titleFont,
        artistFont,
    } = props

    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isSeeking, setIsSeeking] = useState(false)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateTime = () => {
            if (!isSeeking) {
                startTransition(() => setCurrentTime(audio.currentTime))
            }
        }

        const updateDuration = () => {
            startTransition(() => setDuration(audio.duration))
        }

        const handleEnded = () => {
            startTransition(() => setIsPlaying(false))
        }

        audio.addEventListener("timeupdate", updateTime)
        audio.addEventListener("loadedmetadata", updateDuration)
        audio.addEventListener("ended", handleEnded)

        return () => {
            audio.removeEventListener("timeupdate", updateTime)
            audio.removeEventListener("loadedmetadata", updateDuration)
            audio.removeEventListener("ended", handleEnded)
        }
    }, [isSeeking])

    const togglePlay = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        startTransition(() => setIsPlaying(!isPlaying))
    }, [isPlaying])

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current
        if (!audio) return

        const newTime = parseFloat(e.target.value)
        audio.currentTime = newTime
        startTransition(() => setCurrentTime(newTime))
    }, [])

    const handleSeekStart = useCallback(() => {
        startTransition(() => setIsSeeking(true))
    }, [])

    const handleSeekEnd = useCallback(() => {
        startTransition(() => setIsSeeking(false))
    }, [])

    const skipBackward = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return
        audio.currentTime = Math.max(0, audio.currentTime - 10)
    }, [])

    const skipForward = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return
        audio.currentTime = Math.min(duration, audio.currentTime + 10)
    }, [duration])

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00"
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor: backgroundColor,
                backdropFilter: `blur(${blurSize}px)`,
                WebkitBackdropFilter: `blur(${blurSize}px)`,
                borderRadius: 16,
                padding: 24,
                boxShadow: "inset 0 0.5px 0.5px rgba(255,255,255,0.1), 0 1px 4px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
            }}
        >
            <audio ref={audioRef} src={audioFile} autoPlay={autoPlay} loop={loop} />

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                    style={{
                        ...titleFont,
                        color: textColor,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        ...artistFont,
                        color: textColor,
                        opacity: 0.7,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {artist}
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    onMouseDown={handleSeekStart}
                    onMouseUp={handleSeekEnd}
                    onTouchStart={handleSeekStart}
                    onTouchEnd={handleSeekEnd}
                    style={{
                        width: "100%",
                        height: 8,
                        borderRadius: 4,
                        outline: "none",
                        background: `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${(currentTime / duration) * 100}%, ${trackColor} ${(currentTime / duration) * 100}%, ${trackColor} 100%)`,
                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
                        cursor: isSeeking ? "grabbing" : "grab",
                        WebkitAppearance: "none",
                    }}
                />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: textColor,
                        opacity: 0.7,
                    }}
                >
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                <motion.button
                    onClick={skipBackward}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: `2px solid ${accentColor}`,
                        backgroundColor: "transparent",
                        color: accentColor,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                    aria-label="Skip backward 10 seconds"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </motion.button>

                <motion.button
                    onClick={togglePlay}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: accentColor,
                        color: playIconColor,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </motion.button>

                <motion.button
                    onClick={skipForward}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: `2px solid ${accentColor}`,
                        backgroundColor: "transparent",
                        color: accentColor,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                    aria-label="Skip forward 10 seconds"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 19l7-7-7-7M5 19l7-7-7-7" />
                    </svg>
                </motion.button>
            </div>

            <style>
                {`
                    input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: ${accentColor};
                        cursor: grab;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    }
                    input[type="range"]::-moz-range-thumb {
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: ${accentColor};
                        cursor: grab;
                        border: none;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    }
                    input[type="range"]:active::-webkit-slider-thumb {
                        cursor: grabbing;
                    }
                    input[type="range"]:active::-moz-range-thumb {
                        cursor: grabbing;
                    }
                `}
            </style>
        </div>
    )
}

addPropertyControls(AudioPlayer, {
    audioFile: {
        type: ControlType.File,
        allowedFileTypes: ["mp3", "wav", "ogg"],
    },
    title: {
        type: ControlType.String,
        defaultValue: "Audio Track",
    },
    artist: {
        type: ControlType.String,
        defaultValue: "Artist Name",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    artistFont: {
        type: ControlType.Font,
        title: "Artist Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background Color",
                defaultValue: "rgba(255, 255, 255, 0)",
            },
            blurSize: {
                type: ControlType.Number,
                title: "Blur Size",
                defaultValue: 20,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Button Color",
                defaultValue: "#FFFFFF",
            },
            playIconColor: {
                type: ControlType.Color,
                title: "Play Icon Color",
                defaultValue: "#000000",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
            },
            progressColor: {
                type: ControlType.Color,
                title: "Progress Color",
                description: "Color of the filled portion of the progress bar",
                defaultValue: "#000000",
            },
            trackColor: {
                type: ControlType.Color,
                title: "Track Color",
                description: "Color of the unfilled portion of the progress bar",
                defaultValue: "rgba(204, 204, 204, 0)",
            },
        },
    },
    autoPlay: {
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})