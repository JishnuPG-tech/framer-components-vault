import {
    useState,
    useRef,
    useEffect,
    useCallback,
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

import { motion } from "framer-motion"

interface AudioPlayerProps {
    audioSource: "file" | "spotify"
    audioUrl: string
    spotifyUrl: string
    avatarImage: {
        src: string
        alt: string
    }
    title: string
    subtitle: string
    primaryColor: string
    backgroundColor: string
    textColor: string
    subtitleColor: string
    buttonSize: number
    showWaveform: boolean
    waveformColor: string
    font: any
    subtitleFont: any
    borderRadius: number
    style?: React.CSSProperties
}

/**
 * Audio Player with Circular Progress
 *
 * A simple audio player with a circular play/pause button that shows
 * a thin progress ring indicating remaining playback time.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 80
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AudioPlayer(props: AudioPlayerProps) {
    const {
        audioSource = "file",
        audioUrl = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3",
        spotifyUrl = "",
        avatarImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Avatar",
        },
        title = "Voice Sample",
        subtitle = "Audio Track",
        primaryColor = "#C4B5A0",
        backgroundColor = "#F5F0EB",
        textColor = "#1A1A1A",
        subtitleColor = "#888888",
        buttonSize = 48,
        showWaveform = true,
        waveformColor = "rgba(255,255,255,0.6)",
        font,
        subtitleFont,
        borderRadius = 40,
    } = props

    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return

        let audioSrc = audioUrl
        if (audioSource === "spotify" && spotifyUrl) {
            // Extract track ID from Spotify URL or use as-is if it's a direct MP3
            const trackMatch = spotifyUrl.match(/track\/(\w+)/)
            if (trackMatch) {
                // For demo purposes, fallback to default audio since we can't directly play Spotify URLs
                // In production, you'd integrate with Spotify Web API or SDK
                audioSrc = audioUrl
            } else if (spotifyUrl.endsWith(".mp3")) {
                audioSrc = spotifyUrl
            }
        }

        audioRef.current = new Audio(audioSrc)
        const audio = audioRef.current

        audio.addEventListener("loadedmetadata", () => {
            setDuration(audio.duration)
        })

        audio.addEventListener("ended", () => {
            startTransition(() => {
                setIsPlaying(false)
                setProgress(0)
                setCurrentTime(0)
            })
        })

        return () => {
            audio.pause()
            audio.src = ""
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [audioUrl, spotifyUrl, audioSource, isStatic])

    const updateProgress = useCallback(() => {
        if (!audioRef.current) return

        const current = audioRef.current.currentTime
        const total = audioRef.current.duration || 1
        const newProgress = (current / total) * 100

        startTransition(() => {
            setCurrentTime(current)
            setProgress(newProgress)
        })

        if (isPlaying) {
            animationFrameRef.current = requestAnimationFrame(updateProgress)
        }
    }, [isPlaying])

    useEffect(() => {
        if (isPlaying && !isStatic) {
            animationFrameRef.current = requestAnimationFrame(updateProgress)
        } else if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isPlaying, updateProgress, isStatic])

    const togglePlay = useCallback(() => {
        if (!audioRef.current || isStatic) return

        if (isPlaying) {
            audioRef.current.pause()
            startTransition(() => setIsPlaying(false))
        } else {
            audioRef.current.play()
            startTransition(() => setIsPlaying(true))
        }
    }, [isPlaying, isStatic])

    // SVG circle calculations
    const strokeWidth = 2
    const radius = (buttonSize - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    // Generate waveform bars
    const waveformBars = 20
    const bars = Array.from({ length: waveformBars }, (_, i) => {
        const heightVariation =
            Math.sin((i / waveformBars) * Math.PI * 2 + currentTime * 3) * 0.5 +
            0.5
        return isPlaying ? 0.3 + heightVariation * 0.7 : 0.3
    })

    return (
        <div
            style={{
                ...props.style,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "12px 16px",
                backgroundColor,
                borderRadius,
                minWidth: "max-content",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            {/* Avatar */}
            <div
                style={{
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: primaryColor,
                }}
            >
                <img
                    src={avatarImage.src}
                    alt={avatarImage.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>

            {/* Waveform (when playing) */}
            {showWaveform && isPlaying && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        height: 32,
                        flex: 1,
                    }}
                >
                    {bars.map((height, i) => (
                        <motion.div
                            key={i}
                            style={{
                                width: 3,
                                backgroundColor: waveformColor,
                                borderRadius: 2,
                            }}
                            animate={{
                                height: `${height * 100}%`,
                            }}
                            transition={{
                                duration: 0.15,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Text Content */}
            {!isPlaying || !showWaveform ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            color: textColor,
                            fontSize: font?.fontSize || "15px",
                            fontWeight: font?.fontWeight || 600,
                            fontFamily: font?.fontFamily,
                            letterSpacing: font?.letterSpacing,
                            lineHeight: font?.lineHeight || "1.2em",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {title}
                    </span>
                    <span
                        style={{
                            color: subtitleColor,
                            fontSize: subtitleFont?.fontSize || "13px",
                            fontWeight: subtitleFont?.fontWeight || 400,
                            fontFamily: subtitleFont?.fontFamily,
                            letterSpacing: subtitleFont?.letterSpacing,
                            lineHeight: subtitleFont?.lineHeight || "1.2em",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {subtitle}
                    </span>
                </div>
            ) : null}

            {/* Play/Pause Button with Progress Ring */}
            <button
                onClick={togglePlay}
                style={{
                    position: "relative",
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    border: "none",
                    cursor: isStatic ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    padding: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {/* Progress Ring SVG */}
                <svg
                    width={buttonSize}
                    height={buttonSize}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transform: "rotate(-90deg)",
                        pointerEvents: "none",
                    }}
                >
                    {/* Background circle */}
                    <circle
                        cx={buttonSize / 2}
                        cy={buttonSize / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={buttonSize / 2}
                        cy={buttonSize / 2}
                        r={radius}
                        fill="none"
                        stroke={primaryColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={
                            isPlaying ? strokeDashoffset : circumference
                        }
                        strokeLinecap="round"
                        style={{
                            transition: isPlaying
                                ? "none"
                                : "stroke-dashoffset 0.3s ease",
                        }}
                    />
                </svg>

                {/* Play/Pause Icon */}
                <div style={{ position: "relative", zIndex: 1 }}>
                    {isPlaying ? (
                        // Pause Icon
                        <svg
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                            fill={primaryColor}
                        >
                            <rect x={6} y={4} width={4} height={16} rx={1} />
                            <rect x={14} y={4} width={4} height={16} rx={1} />
                        </svg>
                    ) : (
                        // Play Icon
                        <svg
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                            fill={primaryColor}
                            style={{ marginLeft: 2 }}
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </div>
            </button>
        </div>
    )
}

addPropertyControls(AudioPlayer, {
    audioSource: {
        type: ControlType.Enum,
        title: "Audio Source",
        options: ["file", "spotify"],
        optionTitles: ["File Upload", "Spotify URL"],
        defaultValue: "file",
        displaySegmentedControl: true,
    },
    audioUrl: {
        type: ControlType.File,
        title: "Audio File",
        allowedFileTypes: ["mp3", "wav", "ogg", "m4a"],
        hidden: ({ audioSource }) => audioSource !== "file",
    },
    spotifyUrl: {
        type: ControlType.String,
        title: "Spotify URL",
        placeholder: "https://open.spotify.com/track/...",
        defaultValue: "",
        hidden: ({ audioSource }) => audioSource !== "spotify",
    },
    avatarImage: {
        type: ControlType.ResponsiveImage,
        title: "Avatar Image",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Voice Sample",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Audio Track",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#C4B5A0",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F0EB",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1A1A1A",
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "#888888",
    },
    buttonSize: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 48,
        min: 32,
        max: 80,
        step: 1,
        unit: "px",
    },
    showWaveform: {
        type: ControlType.Boolean,
        title: "Show Waveform",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    waveformColor: {
        type: ControlType.Color,
        title: "Waveform Color",
        defaultValue: "rgba(255,255,255,0.6)",
        hidden: ({ showWaveform }) => !showWaveform,
    },
    font: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "0",
            lineHeight: "1.2em",
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
})
