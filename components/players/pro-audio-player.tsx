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

import ReactPlayer from "react-player"

interface ProAudioPlayerProps {
    media?: {
        sourceType?: "url" | "file"
        audioUrl?: string
        audioFile?: string
    }
    content?: {
        title?: string
        author?: string
        coverImage?: string
    }
    design?: {
        backgroundColor?: string
        accentColor?: string
        textColor?: string
        radius?: number
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ProAudioPlayer(props: ProAudioPlayerProps) {
    const { media = {}, content = {}, design = {} } = props

    const {
        sourceType = "url",
        audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        audioFile = "",
    } = media

    const {
        title = "Episode 42: The Future of SaaS",
        author = "Design & Engineering Podcast",
        coverImage = "",
    } = content

    const {
        backgroundColor = "#111111",
        accentColor = "#ffffff",
        textColor = "#ffffff",
        radius = 20,
    } = design

    const isStatic = useIsStaticRenderer()

    const [isMounted, setIsMounted] = React.useState(false)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [playedRatio, setPlayedRatio] = React.useState(0)
    const [playedSeconds, setPlayedSeconds] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [playbackRate, setPlaybackRate] = React.useState(1.0)
    const [isSeeking, setIsSeeking] = React.useState(false)

    const [volume, setVolume] = React.useState(0.8)
    const [muted, setMuted] = React.useState(false)
    const [isHoveringVolume, setIsHoveringVolume] = React.useState(false)

    const playerRef = React.useRef<ReactPlayer>(null)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    // Determine which audio source to feed to the player
    const activeAudioSource = React.useMemo(() => {
        return sourceType === "file" && audioFile ? audioFile : audioUrl
    }, [sourceType, audioFile, audioUrl])

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00"
        const date = new Date(seconds * 1000)
        const hh = date.getUTCHours()
        const mm = date.getUTCMinutes()
        const ss = date.getUTCSeconds().toString().padStart(2, "0")
        if (hh) return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`
        return `${mm}:${ss}`
    }

    const handleProgress = (state: {
        played: number
        playedSeconds: number
    }) => {
        if (!isSeeking) {
            setPlayedRatio(state.played)
            setPlayedSeconds(state.playedSeconds)
        }
    }

    const handleDuration = (dur: number) => setDuration(dur)

    const togglePlay = () => {
        if (!isStatic) setIsPlaying(!isPlaying)
    }

    const handleSpeedToggle = () => {
        const speeds = [1, 1.5, 2]
        const currentIndex = speeds.indexOf(playbackRate)
        const nextIndex = (currentIndex + 1) % speeds.length
        setPlaybackRate(speeds[nextIndex])
    }

    const skipForward = () => {
        if (playerRef.current && !isStatic) {
            const newTime = Math.min(playedSeconds + 15, duration)
            playerRef.current.seekTo(newTime, "seconds")
        }
    }

    const skipBackward = () => {
        if (playerRef.current && !isStatic) {
            const newTime = Math.max(playedSeconds - 15, 0)
            playerRef.current.seekTo(newTime, "seconds")
        }
    }

    const handleSeekMouseDown = () => setIsSeeking(true)
    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value)
        setPlayedRatio(newValue)
        setPlayedSeconds(newValue * duration)
    }
    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
        setIsSeeking(false)
        if (playerRef.current && !isStatic) {
            playerRef.current.seekTo(
                parseFloat((e.target as HTMLInputElement).value)
            )
        }
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value))
        if (muted) setMuted(false)
    }
    const toggleMute = () => setMuted(!muted)

    if (!isMounted) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: backgroundColor,
                    borderRadius: radius,
                }}
            />
        )
    }

    return (
        <div
            style={{
                width: "100%",
                background: `linear-gradient(145deg, ${backgroundColor} 0%, #050505 100%)`,
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: radius,
                padding: "24px",
                boxShadow:
                    "0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            }}
        >
            {!isStatic && activeAudioSource && (
                <div style={{ display: "none" }}>
                    <ReactPlayer
                        ref={playerRef}
                        url={activeAudioSource}
                        playing={isPlaying}
                        playbackRate={playbackRate}
                        volume={volume}
                        muted={muted}
                        onProgress={handleProgress}
                        onDuration={handleDuration}
                        onEnded={() => setIsPlaying(false)}
                        width="0"
                        height="0"
                    />
                </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                    style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "12px",
                        background: coverImage
                            ? `url(${coverImage}) center/cover no-repeat`
                            : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "white",
                        flexShrink: 0,
                    }}
                >
                    {!coverImage && (
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 2v20M17 5v14M7 5v14M22 9v6M2 9v6" />
                        </svg>
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            color: textColor,
                            fontSize: "16px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "14px",
                            fontWeight: 400,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {author}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        height: "6px",
                        width: "100%",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "3px",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: `${playedRatio * 100}%`,
                            background: accentColor,
                            borderRadius: "3px",
                            pointerEvents: "none",
                        }}
                    />
                    <input
                        type="range"
                        min={0}
                        max={0.999999}
                        step="any"
                        value={playedRatio}
                        onMouseDown={handleSeekMouseDown}
                        onChange={handleSeekChange}
                        onMouseUp={handleSeekMouseUp}
                        onTouchStart={handleSeekMouseDown}
                        onTouchEnd={handleSeekMouseUp}
                        style={{
                            position: "absolute",
                            top: "-4px",
                            left: 0,
                            width: "100%",
                            height: "14px",
                            opacity: 0,
                            cursor: "pointer",
                            margin: 0,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: "-4px",
                            left: `calc(${playedRatio * 100}% - 7px)`,
                            width: "14px",
                            height: "14px",
                            background: accentColor,
                            borderRadius: "50%",
                            pointerEvents: "none",
                            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                        }}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "12px",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    <span>{formatTime(playedSeconds)}</span>
                    <span>{isStatic ? "0:00" : formatTime(duration)}</span>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "80px",
                    }}
                    onMouseEnter={() => setIsHoveringVolume(true)}
                    onMouseLeave={() => setIsHoveringVolume(false)}
                >
                    <button
                        onClick={toggleMute}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                        }}
                    >
                        {muted || volume === 0 ? (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <line x1="23" y1="9" x2="17" y2="15"></line>
                                <line x1="17" y1="9" x2="23" y2="15"></line>
                            </svg>
                        ) : volume < 0.5 ? (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                        ) : (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                        )}
                    </button>

                    <div
                        style={{
                            position: "relative",
                            height: "4px",
                            width: isHoveringVolume ? "50px" : "0px",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: "2px",
                            transition: "width 0.2s ease",
                            overflow: isHoveringVolume ? "visible" : "hidden",
                            opacity: isHoveringVolume ? 1 : 0,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: "100%",
                                width: `${muted ? 0 : volume * 100}%`,
                                background: accentColor,
                                borderRadius: "2px",
                                pointerEvents: "none",
                            }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={muted ? 0 : volume}
                            onChange={handleVolumeChange}
                            style={{
                                position: "absolute",
                                top: "-5px",
                                left: 0,
                                width: "100%",
                                height: "14px",
                                opacity: 0,
                                cursor: "pointer",
                                margin: 0,
                            }}
                        />
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "20px",
                    }}
                >
                    <button
                        onClick={skipBackward}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                        }}
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                        </svg>
                    </button>

                    <button
                        onClick={togglePlay}
                        style={{
                            width: "52px",
                            height: "52px",
                            background: accentColor,
                            color: backgroundColor,
                            border: "none",
                            borderRadius: "50%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                            transition: "transform 0.1s ease",
                        }}
                        onMouseDown={(e) =>
                            !isStatic &&
                            (e.currentTarget.style.transform = "scale(0.95)")
                        }
                        onMouseUp={(e) =>
                            !isStatic &&
                            (e.currentTarget.style.transform = "scale(1)")
                        }
                        onMouseLeave={(e) =>
                            !isStatic &&
                            (e.currentTarget.style.transform = "scale(1)")
                        }
                    >
                        {isPlaying ? (
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                        ) : (
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                style={{ marginLeft: "4px" }}
                            >
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={skipForward}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                        }}
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                        </svg>
                    </button>
                </div>

                <div
                    style={{
                        width: "80px",
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={handleSpeedToggle}
                        style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.6)",
                            background: "rgba(255, 255, 255, 0.05)",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            cursor: "pointer",
                            width: "45px",
                            textAlign: "center",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                                "rgba(255,255,255,0.1)"
                            e.currentTarget.style.color = "#ffffff"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                                "rgba(255,255,255,0.05)"
                            e.currentTarget.style.color =
                                "rgba(255,255,255,0.6)"
                        }}
                    >
                        {playbackRate}x
                    </button>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ProAudioPlayer, {
    media: {
        type: ControlType.Object,
        title: "Media File",
        controls: {
            sourceType: {
                type: ControlType.Enum,
                title: "Source",
                options: ["url", "file"],
                optionTitles: ["URL Link", "Upload File"],
                defaultValue: "url",
            },
            audioUrl: {
                type: ControlType.String,
                title: "Audio URL",
                defaultValue:
                    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                placeholder: "Link to .mp3 or .wav",
                hidden: (props) => props.sourceType !== "url",
            },
            audioFile: {
                type: ControlType.File,
                title: "Upload Audio",
                allowedFileTypes: ["mp3", "wav", "ogg", "m4a"],
                hidden: (props) => props.sourceType !== "file",
            },
        },
        defaultValue: {
            sourceType: "url",
            audioUrl:
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        },
    },
    content: {
        type: ControlType.Object,
        title: "Track Details",
        controls: {
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Episode 42: The Future of SaaS",
            },
            author: {
                type: ControlType.String,
                title: "Author / Show",
                defaultValue: "Design & Engineering Podcast",
            },
            coverImage: {
                type: ControlType.Image,
                title: "Cover Artwork",
            },
        },
        defaultValue: {
            title: "Episode 42: The Future of SaaS",
            author: "Design & Engineering Podcast",
            coverImage: "",
        },
    },
    design: {
        type: ControlType.Object,
        title: "Design Setup",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#161618",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent Color",
                defaultValue: "#ffffff",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#ffffff",
            },
            radius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: 20,
            },
        },
        defaultValue: {
            backgroundColor: "#161618",
            accentColor: "#ffffff",
            textColor: "#ffffff",
            radius: 20,
        },
    },
})
