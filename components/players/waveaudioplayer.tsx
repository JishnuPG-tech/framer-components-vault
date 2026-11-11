/**
 * Wave Audio Player
 * Made with care by [Vizualogy Studio](https://x.com/vizualogy)
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
import React, { useRef, useState, useEffect, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface FontProps {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
}

interface TrackDef {
    trackUrl: string
    trackTitle: string
    trackArtist: string
    coverImage: string
    coverAltText?: string
}

export default function WaveAudioPlayer({
    tracks = [],
    preLoadTitle = "Initialize Audio",

    coverSize = 64,
    coverBorderRadius = 8,
    playButtonSize = 40,
    accentColor = "#FF5C00",
    backgroundColor = "rgba(12,12,12,0.85)",

    // Collapsed State Controls
    collapsedSize = 64,
    collapsedIcon = "music",
    collapsedIconColor = "#FFFFFF",
    collapsedWaveColor = "#FF5C00",

    // Explicit Color Controls
    textColor = "#FFFFFF",
    artistColor = "rgba(255,255,255,0.6)",
    ctaTextColor = "rgba(255,255,255,0.8)",
    timerColor = "rgba(255,255,255,0.4)",

    // Bubble & Slide Controls
    bubbleColor = "rgba(0,0,0,0.6)",
    bubbleIconColor = "#FFFFFF",
    bubbleSize = 24,
    bubbleRadius = 100,
    slideTabColor = "rgba(255,255,255,0.15)",

    // Font Variables
    titleFont = { fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 },
    artistFont = { fontFamily: "Space Grotesk, sans-serif", fontWeight: 500 },
    ctaFont = { fontFamily: "Space Grotesk, sans-serif", fontWeight: 500 },
    timerFont = { fontFamily: "Space Grotesk, sans-serif", fontWeight: 400 },

    blurAmount = 24,
    borderRadius = 16,
    showWaveform = true,
    tapToListenLabel = "Initialize Audio",
    expandedWidth = 340,
    expandedHeight = 95,
}: {
    tracks?: TrackDef[]
    preLoadTitle?: string
    coverSize?: number
    coverBorderRadius?: number
    playButtonSize?: number
    accentColor?: string
    backgroundColor?: string

    collapsedSize?: number
    collapsedIcon?: "music" | "disc" | "headphones"
    collapsedIconColor?: string
    collapsedWaveColor?: string

    textColor?: string
    artistColor?: string
    ctaTextColor?: string
    timerColor?: string

    bubbleColor?: string
    bubbleIconColor?: string
    bubbleSize?: number
    bubbleRadius?: number
    slideTabColor?: string

    titleFont?: FontProps
    artistFont?: FontProps
    ctaFont?: FontProps
    timerFont?: FontProps
    blurAmount?: number
    borderRadius?: number
    showWaveform?: boolean
    tapToListenLabel?: string
    expandedWidth?: number
    expandedHeight?: number
}) {
    const isStatic = useIsStaticRenderer()

    const audioRef = useRef<HTMLAudioElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)
    const animRef = useRef<number>()
    const analyserRef = useRef<AnalyserNode>()
    const audioCtxRef = useRef<AudioContext>()
    const sourceRef = useRef<MediaElementAudioSourceNode>()
    const hoverTimeoutRef = useRef<number | null>(null) // Added for smooth hover

    const [isExpanded, setIsExpanded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isHidden, setIsHidden] = useState(false)
    const [isTabHovered, setIsTabHovered] = useState(false)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [loaded, setLoaded] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [volume, setVolume] = useState(1)
    const [muted, setMuted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [bars, setBars] = useState<number[]>(Array(32).fill(2))

    const activeTrack = tracks[currentTrackIndex] || {
        trackUrl: "",
        trackTitle: "No Track Loaded",
        trackArtist: "Unknown",
        coverImage: "",
        coverAltText: "Album cover",
    }

    const formatTime = (s: number) => {
        if (isNaN(s)) return "0:00"
        const m = Math.floor(s / 60)
        const sec = Math.floor(s % 60)
        return `${m}:${sec.toString().padStart(2, "0")}`
    }

    const animateBars = useCallback(() => {
        if (isStatic || !analyserRef.current) return
        const data = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(data)
        const newBars = Array.from(data)
            .slice(0, 32)
            .map((v) => Math.max(2, v / 4))
        setBars(newBars)
        animRef.current = requestAnimationFrame(animateBars)
    }, [isStatic])

    const loadAndPlayTrack = async (
        audio: HTMLAudioElement,
        url: string,
        forcePlay: boolean
    ) => {
        setLoading(true)
        audio.src = url
        audio.crossOrigin = "anonymous"
        audio.load()

        if (forcePlay && !isStatic) {
            try {
                await audio.play()
                setPlaying(true)
                animateBars()
            } catch (err) {
                console.warn("CORS block, falling back", err)
                audio.crossOrigin = null
                audio.load()
                try {
                    await audio.play()
                    setPlaying(true)
                    setBars(Array(32).fill(6))
                } catch (fallbackErr) {
                    console.error("Playback failed", fallbackErr)
                }
            } finally {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }

    const handleTapToListen = useCallback(async () => {
        if (isStatic || !activeTrack.trackUrl || loaded) return
        const audio = audioRef.current
        if (!audio) return

        try {
            if (!audioCtxRef.current) {
                const AudioContextClass =
                    window.AudioContext || (window as any).webkitAudioContext
                audioCtxRef.current = new AudioContextClass()
            }
            if (audioCtxRef.current.state === "suspended") {
                await audioCtxRef.current.resume()
            }

            if (!sourceRef.current) {
                analyserRef.current = audioCtxRef.current.createAnalyser()
                analyserRef.current.fftSize = 64
                sourceRef.current =
                    audioCtxRef.current.createMediaElementSource(audio)
                sourceRef.current.connect(analyserRef.current)
                analyserRef.current.connect(audioCtxRef.current.destination)
            }

            setLoaded(true)
            await loadAndPlayTrack(audio, activeTrack.trackUrl, true)
        } catch (error) {
            console.error("Engine Init Failed", error)
        }
    }, [activeTrack.trackUrl, loaded, animateBars, isStatic])

    const togglePlay = useCallback(async () => {
        if (isStatic) return
        const audio = audioRef.current
        if (!audio || !loaded) return
        if (playing) {
            audio.pause()
            setPlaying(false)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        } else {
            if (audioCtxRef.current?.state === "suspended") {
                await audioCtxRef.current.resume()
            }
            try {
                await audio.play()
                setPlaying(true)
                if (audio.crossOrigin === "anonymous") animateBars()
            } catch (error) {
                console.error("Playback interrupted:", error)
            }
        }
    }, [playing, loaded, animateBars, isStatic])

    const skipTrack = useCallback(
        async (direction: "next" | "prev") => {
            if (!loaded || tracks.length <= 1) return
            let newIndex = currentTrackIndex

            if (direction === "next") {
                newIndex =
                    currentTrackIndex >= tracks.length - 1
                        ? 0
                        : currentTrackIndex + 1
            } else {
                newIndex =
                    currentTrackIndex <= 0
                        ? tracks.length - 1
                        : currentTrackIndex - 1
            }

            setCurrentTrackIndex(newIndex)

            const audio = audioRef.current
            if (audio) {
                audio.pause()
                setProgress(0)
                setCurrentTime(0)
                if (animRef.current) cancelAnimationFrame(animRef.current)
                await loadAndPlayTrack(
                    audio,
                    tracks[newIndex].trackUrl,
                    playing
                )
            }
        },
        [currentTrackIndex, tracks, loaded, playing]
    )

    const handleTimeUpdate = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return
        setCurrentTime(audio.currentTime)
        setProgress((audio.currentTime / audio.duration) * 100 || 0)
    }, [])

    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) setDuration(audioRef.current.duration)
    }, [])

    const handleProgressClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const audio = audioRef.current
            if (!audio || !loaded) return
            const rect = e.currentTarget.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            audio.currentTime = ratio * audio.duration
        },
        [loaded]
    )

    const handleVolumeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = parseFloat(e.target.value)
            setVolume(v)
            if (audioRef.current) {
                audioRef.current.volume = v
                if (v === 0) {
                    setMuted(true)
                    audioRef.current.muted = true
                } else if (muted) {
                    setMuted(false)
                    audioRef.current.muted = false
                }
            }
        },
        [muted]
    )

    const toggleMute = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.muted = !muted
            setMuted(!muted)
            if (muted && volume === 0) setVolume(0.5)
        }
    }, [muted, volume])

    // Smooth Hover Handlers to prevent gap drop-off
    const handleMouseEnter = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
        setIsHovered(true)
    }, [])

    const handleMouseLeave = useCallback(() => {
        hoverTimeoutRef.current = window.setTimeout(() => {
            setIsHovered(false)
        }, 150)
    }, [])

    useEffect(() => {
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current)
            audioCtxRef.current?.close()
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        }
    }, [])

    // Dynamic Sizing
    const dynamicTitleSize = Math.max(12, Math.min(expandedWidth * 0.045, 14))
    const dynamicArtistSize = Math.max(10, Math.min(expandedWidth * 0.035, 11))
    const dynamicCtaSize = Math.max(10, Math.min(expandedWidth * 0.035, 12))
    const iconSize = Math.max(12, Math.round(playButtonSize * 0.35))
    const skipBtnSize = Math.round(playButtonSize * 0.7)

    const hoverWidth = Math.min(260, expandedWidth * 0.8)
    const currentWidth = isExpanded
        ? expandedWidth
        : isHovered && playing
          ? hoverWidth
          : collapsedSize
    const currentHeight = isExpanded ? expandedHeight : collapsedSize
    const currentRadius = isExpanded ? borderRadius : 0

    const renderCollapsedIcon = () => {
        const size = collapsedSize * 0.4
        if (playing) {
            if (isStatic) {
                return (
                    <svg
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill={collapsedWaveColor}
                    >
                        <rect x="4" y="8" width="4" height="8" rx="1" />
                        <rect x="10" y="4" width="4" height="16" rx="1" />
                        <rect x="16" y="10" width="4" height="4" rx="1" />
                    </svg>
                )
            }
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill={collapsedWaveColor}
                >
                    <rect x="4" y="8" width="4" height="8" rx="1">
                        <animate
                            attributeName="height"
                            values="8;16;8"
                            dur="0.8s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="y"
                            values="8;4;8"
                            dur="0.8s"
                            repeatCount="indefinite"
                        />
                    </rect>
                    <rect x="10" y="4" width="4" height="16" rx="1">
                        <animate
                            attributeName="height"
                            values="16;4;16"
                            dur="0.8s"
                            begin="0.2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="y"
                            values="4;10;4"
                            dur="0.8s"
                            begin="0.2s"
                            repeatCount="indefinite"
                        />
                    </rect>
                    <rect x="16" y="10" width="4" height="4" rx="1">
                        <animate
                            attributeName="height"
                            values="4;12;4"
                            dur="0.8s"
                            begin="0.4s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="y"
                            values="10;6;10"
                            dur="0.8s"
                            begin="0.4s"
                            repeatCount="indefinite"
                        />
                    </rect>
                </svg>
            )
        }
        switch (collapsedIcon) {
            case "disc":
                return (
                    <svg
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={collapsedIconColor}
                        strokeWidth="1.5"
                        strokeLinecap="square"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                        <circle
                            cx="12"
                            cy="12"
                            r="1"
                            fill={collapsedIconColor}
                        />
                    </svg>
                )
            case "headphones":
                return (
                    <svg
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={collapsedIconColor}
                        strokeWidth="1.5"
                        strokeLinecap="square"
                    >
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3v4zM3 19a2 2 0 0 0 2 2h1v-6H3v4z" />
                    </svg>
                )
            case "music":
            default:
                return (
                    <svg
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill={collapsedIconColor}
                    >
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                )
        }
    }

    const renderSkipButton = (direction: "next" | "prev") => (
        <button
            onClick={(e) => {
                e.stopPropagation()
                skipTrack(direction)
            }}
            aria-label={direction === "next" ? "Next Track" : "Previous Track"}
            style={{
                width: skipBtnSize,
                height: skipBtnSize,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                padding: 0,
                transition: "opacity 0.15s ease",
                opacity: 0.6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
            <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill={textColor}
                style={{
                    transform: direction === "prev" ? "rotate(180deg)" : "none",
                }}
            >
                <path d="M1 2L8 6L1 10V2Z" />
                <rect x="9" y="2" width="2" height="8" />
            </svg>
        </button>
    )

    const PlayButtonNode = (
        <button
            onClick={(e) => {
                e.stopPropagation()
                !loaded ? handleTapToListen() : togglePlay()
            }}
            aria-label={
                playing ? "Pause" : !loaded ? "Initialize Audio" : "Play"
            }
            style={{
                width: playButtonSize,
                height: playButtonSize,
                borderRadius: "50%",
                background: accentColor,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                padding: 0,
                transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
            onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
            {loading ? (
                <div
                    style={{
                        display: "flex",
                        gap: "3px",
                        alignItems: "center",
                        height: iconSize,
                    }}
                >
                    <div
                        style={{
                            width: 2,
                            height: "4px",
                            background: "white",
                            borderRadius: 1,
                            animation: isStatic
                                ? "none"
                                : "loadWave 0.8s ease-in-out infinite",
                        }}
                    />
                    <div
                        style={{
                            width: 2,
                            height: `${iconSize}px`,
                            background: "white",
                            borderRadius: 1,
                            animation: isStatic
                                ? "none"
                                : "loadWave 0.8s ease-in-out 0.2s infinite",
                        }}
                    />
                    <div
                        style={{
                            width: 2,
                            height: "4px",
                            background: "white",
                            borderRadius: 1,
                            animation: isStatic
                                ? "none"
                                : "loadWave 0.8s ease-in-out 0.4s infinite",
                        }}
                    />
                </div>
            ) : !loaded ? (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 14 14"
                    fill="white"
                >
                    <path d="M4 2L12 7L4 12V2Z" />
                </svg>
            ) : playing ? (
                <svg
                    width={iconSize * 0.8}
                    height={iconSize}
                    viewBox="0 0 12 14"
                    fill="white"
                >
                    <rect x="0" y="0" width="3" height="14" rx="1" />
                    <rect x="7" y="0" width="3" height="14" rx="1" />
                </svg>
            ) : (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 14 14"
                    fill="white"
                >
                    <path d="M4 2L12 7L4 12V2Z" />
                </svg>
            )}
        </button>
    )

    // --- HIDDEN STATE: Side restore tab ---
    if (isHidden) {
        return (
            <div
                onMouseEnter={() => setIsTabHovered(true)}
                onMouseLeave={() => setIsTabHovered(false)}
                onClick={() => setIsHidden(false)}
                role="button"
                aria-label="Restore Audio Player"
                style={{
                    width: isTabHovered ? 28 : 4,
                    height: collapsedSize,
                    borderRadius: "0 6px 6px 0",
                    background: isTabHovered
                        ? backgroundColor
                        : playing
                          ? accentColor
                          : slideTabColor,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    border: isTabHovered
                        ? `0.5px solid rgba(255,255,255,0.12)`
                        : "none",
                    boxShadow: isTabHovered
                        ? "0 8px 16px rgba(0,0,0,0.2)"
                        : "none",
                    animation:
                        playing && !isTabHovered && !isStatic
                            ? "tabPulse 2s ease-in-out infinite"
                            : "none",
                }}
            >
                {isTabHovered && (
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill={accentColor}
                        style={{ flexShrink: 0 }}
                    >
                        <path d="M2 1L8 5L2 9V1Z" />
                    </svg>
                )}
            </div>
        )
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                width: currentWidth,
                height: currentHeight,
                position: "relative",
                fontFamily: "Space Grotesk, sans-serif",
                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                ["--astral-accent" as any]: accentColor,
            }}
        >
            {/* INNER WRAPPER: Handles the overflow & mask logic so external elements remain visible */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: currentRadius,
                    overflow: "hidden",
                    boxShadow: isExpanded
                        ? "0 24px 48px rgba(0,0,0,0.4)"
                        : "0 8px 16px rgba(0,0,0,0.2)",
                    transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    zIndex: 1,
                }}
            >
                {activeTrack.coverImage && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: -20,
                            backgroundImage: `url(${activeTrack.coverImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: `blur(${blurAmount}px)`,
                            transform: "translateZ(0) scale(1.1)",
                            willChange: "transform, filter",
                            zIndex: 0,
                            transition: "background-image 0.4s ease",
                        }}
                    />
                )}

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: backgroundColor,
                        zIndex: 1,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: currentRadius,
                        border: `0.5px solid rgba(255,255,255,0.12)`,
                        zIndex: 4,
                        pointerEvents: "none",
                        transition: "border-radius 0.5s ease",
                    }}
                />

                {/* --- STATE 1: COLLAPSED & HOVER --- */}
                <div
                    role="button"
                    aria-label="Expand Player"
                    onClick={() => setIsExpanded(true)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 5,
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        opacity: isExpanded ? 0 : 1,
                        pointerEvents: isExpanded ? "none" : "auto",
                        transition: "opacity 0.2s ease",
                    }}
                >
                    <div
                        style={{
                            width: collapsedSize,
                            display: "flex",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {renderCollapsedIcon()}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                            paddingRight: 16,
                            opacity: isHovered && playing ? 1 : 0,
                            transform:
                                isHovered && playing
                                    ? "translateX(0)"
                                    : "translateX(-10px)",
                            transition:
                                "opacity 0.3s ease, transform 0.3s ease",
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                ...titleFont,
                                width: "100%",
                                fontSize: dynamicTitleSize * 0.95,
                                color: textColor,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1.2,
                            }}
                        >
                            {activeTrack.trackTitle}
                        </div>
                        <div
                            style={{
                                ...artistFont,
                                width: "100%",
                                fontSize: dynamicArtistSize * 0.9,
                                color: artistColor,
                                marginTop: 2,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {activeTrack.trackArtist}
                        </div>
                    </div>
                </div>

                {/* --- STATE 2: EXPANDED DASHBOARD --- */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: expandedWidth,
                        height: expandedHeight,
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: `clamp(8px, 4%, 16px)`,
                        padding: `clamp(12px, 5%, 16px)`,
                        boxSizing: "border-box",
                        opacity: isExpanded ? 1 : 0,
                        pointerEvents: isExpanded ? "auto" : "none",
                        transition: "opacity 0.3s ease 0.1s",
                    }}
                >
                    {activeTrack.coverImage && (
                        <div
                            style={{
                                width: coverSize,
                                height: coverSize,
                                flexShrink: 0,
                                borderRadius: coverBorderRadius,
                                overflow: "hidden",
                                border: `0.5px solid rgba(255,255,255,0.15)`,
                            }}
                        >
                            <img
                                src={activeTrack.coverImage}
                                alt={
                                    activeTrack.coverAltText ||
                                    activeTrack.trackTitle ||
                                    "Album Cover"
                                }
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transition: "opacity 0.3s ease",
                                }}
                            />
                        </div>
                    )}

                    <div
                        style={{
                            flex: "1 1 0px",
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            height: "100%",
                        }}
                    >
                        <div
                            style={{
                                ...titleFont,
                                width: "100%",
                                fontSize: dynamicTitleSize,
                                color: textColor,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1.2,
                            }}
                        >
                            {loaded ? activeTrack.trackTitle : preLoadTitle}
                        </div>

                        {!loaded && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginTop: 8,
                                }}
                            >
                                {PlayButtonNode}
                                <div
                                    style={{
                                        ...ctaFont,
                                        flex: 1,
                                        minWidth: 0,
                                        fontSize: dynamicCtaSize,
                                        color: ctaTextColor,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {tapToListenLabel}
                                </div>
                            </div>
                        )}

                        {loaded && (
                            <>
                                <div
                                    style={{
                                        ...artistFont,
                                        width: "100%",
                                        fontSize: dynamicArtistSize,
                                        color: artistColor,
                                        marginTop: 4,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {activeTrack.trackArtist}
                                </div>

                                {showWaveform && expandedHeight > 85 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                            height: 12,
                                            marginTop: 6,
                                            width: "100%",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {bars.map((h, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    width: 2,
                                                    height: `${Math.min(h, 12)}px`,
                                                    background: accentColor,
                                                    borderRadius: 1,
                                                    opacity: playing
                                                        ? 0.9
                                                        : 0.3,
                                                    transition:
                                                        "height 0.05s ease",
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div style={{ width: "100%", marginTop: 6 }}>
                                    <div
                                        ref={progressRef}
                                        onClick={handleProgressClick}
                                        style={{
                                            width: "100%",
                                            height: 3,
                                            background: "rgba(255,255,255,0.2)",
                                            borderRadius: 2,
                                            cursor: "pointer",
                                            position: "relative",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${progress}%`,
                                                height: "100%",
                                                background: accentColor,
                                                borderRadius: 2,
                                                transition: "width 0.1s linear",
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            ...timerFont,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            marginTop: 4,
                                            fontSize: dynamicArtistSize * 0.9,
                                            color: timerColor,
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div
                        style={{
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 10,
                            paddingRight: 8,
                        }}
                    >
                        {loaded && (
                            <>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    <button
                                        onClick={toggleMute}
                                        aria-label={
                                            muted
                                                ? "Unmute Volume"
                                                : "Mute Volume"
                                        }
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            color: textColor,
                                            opacity: 0.6,
                                            fontSize: 12,
                                            width: 12,
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {muted ? "✕" : "♪"}
                                    </button>
                                    <input
                                        className="astral-vol-slider"
                                        type="range"
                                        aria-label="Volume Control"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        style={{
                                            width: Math.max(
                                                30,
                                                expandedWidth * 0.1
                                            ),
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    {tracks.length > 1 &&
                                        renderSkipButton("prev")}
                                    {PlayButtonNode}
                                    {tracks.length > 1 &&
                                        renderSkipButton("next")}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- EXTERNAL CONTROLS (THE BUBBLE LAYER) --- */}

            {/* HOVER BRIDGE: Prevents gap drop-off so the menu stays open */}
            {!isExpanded && isHovered && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: -(bubbleSize + 8),
                        width: bubbleSize + 8,
                        height: bubbleSize,
                        zIndex: 9, // Sits under the bubble, acts as a physical bridge
                    }}
                />
            )}

            {/* HIDE BUTTON: appears on hover of collapsed state only */}
            {!isExpanded && isHovered && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsHidden(true)
                        setIsHovered(false)
                        setIsExpanded(false)
                    }}
                    aria-label="Hide Player"
                    style={{
                        position: "absolute",
                        top: 0,
                        right: -(bubbleSize + 8),
                        zIndex: 10,
                        width: bubbleSize,
                        height: bubbleSize,
                        background: bubbleColor,
                        border: "none",
                        borderRadius: bubbleRadius,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        transition: "opacity 0.15s ease",
                        opacity: 0.9,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.9")
                    }
                >
                    <svg
                        width={Math.max(6, bubbleSize * 0.4)}
                        height={Math.max(6, bubbleSize * 0.4)}
                        viewBox="0 0 8 8"
                        fill="none"
                        stroke={bubbleIconColor}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    >
                        <line x1="1" y1="1" x2="7" y2="7" />
                        <line x1="7" y1="1" x2="1" y2="7" />
                    </svg>
                </button>
            )}

            {/* MODAL MINIMIZE BUTTON */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(false)
                    setIsHovered(false)
                }}
                aria-label="Minimize Player"
                style={{
                    position: "absolute",
                    top: 0,
                    right: -(bubbleSize + 8),
                    zIndex: 10,
                    background: bubbleColor,
                    border: "none",
                    color: bubbleIconColor,
                    width: bubbleSize,
                    height: bubbleSize,
                    display: isExpanded ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    borderRadius: bubbleRadius,
                    opacity: 0.8,
                    transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1"
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.8"
                }}
            >
                <svg
                    width={Math.max(8, bubbleSize * 0.45)}
                    height={Math.max(8, bubbleSize * 0.45)}
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                >
                    <line x1="2" y1="6" x2="10" y2="6" />
                </svg>
            </button>

            <audio
                ref={audioRef}
                preload="none"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                    if (tracks.length > 1) {
                        skipTrack("next")
                    } else {
                        setPlaying(false)
                        setProgress(0)
                        setBars(Array(32).fill(2))
                        if (animRef.current)
                            cancelAnimationFrame(animRef.current)
                    }
                }}
            />

            <style>{`
                @keyframes loadWave { 0%, 100% { height: 4px; } 50% { height: 100%; } }
                @keyframes tabPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .astral-vol-slider { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; margin: 0; height: 12px; }
                .astral-vol-slider::-webkit-slider-runnable-track { width: 100%; height: 3px; background: rgba(255,255,255,0.2); border-radius: 2px; }
                .astral-vol-slider::-moz-range-track { width: 100%; height: 3px; background: rgba(255,255,255,0.2); border-radius: 2px; }
                .astral-vol-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 9px; width: 9px; border-radius: 50%; background: var(--astral-accent, #FF5C00); margin-top: -3px; transition: transform 0.1s ease; }
                .astral-vol-slider::-moz-range-thumb { border: none; height: 9px; width: 9px; border-radius: 50%; background: var(--astral-accent, #FF5C00); transition: transform 0.1s ease; }
                .astral-vol-slider:hover::-webkit-slider-thumb { transform: scale(1.2); }
                .astral-vol-slider:hover::-moz-range-thumb { transform: scale(1.2); }
                .astral-vol-slider:focus { outline: none; }
            `}</style>
        </div>
    )
}

addPropertyControls(WaveAudioPlayer, {
    expandedWidth: {
        type: ControlType.Number,
        title: "Exp. Width",
        defaultValue: 340,
        min: 280,
        max: 600,
        step: 1,
        displayStepper: true,
    },
    expandedHeight: {
        type: ControlType.Number,
        title: "Exp. Height",
        defaultValue: 95,
        min: 64,
        max: 120,
        step: 1,
        displayStepper: true,
    },
    collapsedSize: {
        type: ControlType.Number,
        title: "Closed Size",
        defaultValue: 64,
        min: 40,
        max: 120,
        step: 1,
        displayStepper: true,
    },
    collapsedIcon: {
        type: ControlType.Enum,
        title: "Closed Icon",
        options: ["music", "disc", "headphones"],
        optionTitles: ["Music Note", "Vinyl Disc", "Headphones"],
        defaultValue: "music",
    },
    collapsedIconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFFFFF",
    },
    collapsedWaveColor: {
        type: ControlType.Color,
        title: "Wave Color",
        defaultValue: "#FF5C00",
    },

    tracks: {
        type: ControlType.Array,
        title: "Playlist",
        control: {
            type: ControlType.Object,
            controls: {
                trackUrl: {
                    type: ControlType.File,
                    title: "Audio",
                    allowedFileTypes: ["mp3", "wav", "ogg", "aac", "m4a"],
                },
                trackTitle: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "ASTRAL Audio",
                },
                trackArtist: {
                    type: ControlType.String,
                    title: "Artist",
                    defaultValue: "ASTRAL Sound Eng.",
                },
                coverImage: { type: ControlType.Image, title: "Cover Image" },
                coverAltText: {
                    type: ControlType.String,
                    title: "Cover Alt",
                    defaultValue: "Album Cover",
                },
            },
        },
        defaultValue: [
            {
                trackUrl: "",
                trackTitle: "All The Love (feat. Andre Troutman)",
                trackArtist: "KANYE WEST, YE",
                coverImage: "",
                coverAltText: "Album cover featuring Kanye West",
            },
        ],
    },

    preLoadTitle: {
        type: ControlType.String,
        title: "Pre-load Title",
        defaultValue: "Initialize Audio",
    },
    coverSize: {
        type: ControlType.Number,
        title: "Cover Size",
        defaultValue: 64,
        min: 24,
        max: 200,
        step: 1,
    },
    coverBorderRadius: {
        type: ControlType.Number,
        title: "Cover Radius",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
    },
    playButtonSize: {
        type: ControlType.Number,
        title: "Play Btn Size",
        defaultValue: 40,
        min: 24,
        max: 80,
        step: 1,
    },

    // @ts-ignore
    titleFont: { type: ControlType.Font, title: "Title Font" },
    // @ts-ignore
    artistFont: { type: ControlType.Font, title: "Artist Font" },
    // @ts-ignore
    ctaFont: { type: ControlType.Font, title: "CTA Font" },
    // @ts-ignore
    timerFont: { type: ControlType.Font, title: "Timer Font" },

    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#FF5C00",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(12,12,12,0.85)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    artistColor: {
        type: ControlType.Color,
        title: "Artist Color",
        defaultValue: "rgba(255,255,255,0.6)",
    },
    ctaTextColor: {
        type: ControlType.Color,
        title: "CTA Color",
        defaultValue: "rgba(255,255,255,0.8)",
    },
    timerColor: {
        type: ControlType.Color,
        title: "Timer Color",
        defaultValue: "rgba(255,255,255,0.4)",
    },

    // NEW BUBBLE CONTROLS
    bubbleColor: {
        type: ControlType.Color,
        title: "Bubble BG",
        defaultValue: "rgba(0,0,0,0.6)",
    },
    bubbleIconColor: {
        type: ControlType.Color,
        title: "Bubble Icon",
        defaultValue: "#FFFFFF",
    },
    bubbleSize: {
        type: ControlType.Number,
        title: "Bubble Size",
        defaultValue: 24,
        min: 16,
        max: 48,
        step: 1,
    },
    bubbleRadius: {
        type: ControlType.Number,
        title: "Bubble Radius",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
    },
    slideTabColor: {
        type: ControlType.Color,
        title: "Slide Tab",
        defaultValue: "rgba(255,255,255,0.15)",
    },

    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 24,
        min: 0,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    showWaveform: {
        type: ControlType.Boolean,
        title: "Show Waveform",
        defaultValue: true,
    },
    tapToListenLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Initialize Audio",
    },
})
