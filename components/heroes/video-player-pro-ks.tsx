/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 506
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

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


interface KarimSaifVideoPlayerProps {
    video: string
    poster: string

    autoplay: boolean
    muted: boolean
    loop: boolean

    controlsOnHover: boolean
    hoverFadeDuration: number

    showControls: boolean
    showProgress: boolean
    showTime: boolean
    showVolume: boolean
    showSpeed: boolean
    showFullscreen: boolean

    speedOptions: string
    defaultSpeed: number

    radius: number
    controlsRadius: number
    controlsOpacity: number
    controlsBlur: number

    controlColor: string
    accentColor: string

    progressHeight: number
    controlPadding: number
    controlGap: number

    objectFit: "cover" | "contain" | "fill"
    backgroundColor: string
}

function formatTime(value: number) {
    if (!Number.isFinite(value) || value < 0) {
        return "0:00"
    }

    const hours = Math.floor(value / 3600)
    const minutes = Math.floor((value % 3600) / 60)
    const seconds = Math.floor(value % 60)

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function PlayIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path d="M8 5.5L19 12L8 18.5V5.5Z" fill="currentColor" />
        </svg>
    )
}

function PauseIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path d="M7 5H10V19H7V5ZM14 5H17V19H14V5Z" fill="currentColor" />
        </svg>
    )
}

function VolumeIcon({ muted, size = 18 }: { muted: boolean; size?: number }) {
    if (muted) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M4 9V15H8L13 19V5L8 9H4ZM17 9L21 13M21 9L17 13"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path d="M4 9V15H8L13 19V5L8 9H4Z" fill="currentColor" />
            <path
                d="M16 9C17.7 10.7 17.7 13.3 16 15M18.5 6.5C22 10 22 14 18.5 17.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    )
}

function FullscreenIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M8 4H4V8M16 4H20V8M20 16V20H16M4 16V20H8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export default function KarimSaifVideoPlayer(props: KarimSaifVideoPlayerProps) {
    const {
        video,
        poster,
        autoplay,
        muted,
        loop,
        controlsOnHover,
        hoverFadeDuration,
        showControls,
        showProgress,
        showTime,
        showVolume,
        showSpeed,
        showFullscreen,
        speedOptions,
        defaultSpeed,
        radius,
        controlsRadius,
        controlsOpacity,
        controlsBlur,
        controlColor,
        accentColor,
        progressHeight,
        controlPadding,
        controlGap,
        objectFit,
        backgroundColor,
    } = props

    const videoRef = React.useRef<HTMLVideoElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const [playing, setPlaying] = React.useState(false)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)

    const [volume, setVolume] = React.useState(muted ? 0 : 1)

    const [isMuted, setIsMuted] = React.useState(muted)
    const [speed, setSpeed] = React.useState(defaultSpeed)
    const [fullscreen, setFullscreen] = React.useState(false)

    const parsedSpeeds = React.useMemo(() => {
        const values = speedOptions
            .split(",")
            .map((value) => Number(value.trim()))
            .filter(
                (value) => Number.isFinite(value) && value >= 0.25 && value <= 4
            )

        const unique = Array.from(new Set(values))

        return unique.length ? unique : [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    }, [speedOptions])

    const safeDefaultSpeed = React.useMemo(() => {
        if (parsedSpeeds.includes(defaultSpeed)) {
            return defaultSpeed
        }

        return parsedSpeeds.reduce((closest, value) => {
            return Math.abs(value - defaultSpeed) <
                Math.abs(closest - defaultSpeed)
                ? value
                : closest
        }, parsedSpeeds[0])
    }, [defaultSpeed, parsedSpeeds])

    const progress =
        duration > 0
            ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
            : 0

    const togglePlay = React.useCallback(() => {
        const element = videoRef.current

        if (!element || isStatic) {
            return
        }

        if (element.paused || element.ended) {
            if (element.ended) {
                element.currentTime = 0
            }

            element
                .play()
                .then(() => {
                    setPlaying(true)
                })
                .catch(() => {
                    setPlaying(false)
                })
        } else {
            element.pause()
            setPlaying(false)
        }
    }, [isStatic])

    const toggleMute = React.useCallback(() => {
        const element = videoRef.current

        if (!element || isStatic) {
            return
        }

        if (element.muted || element.volume === 0) {
            const nextVolume = volume > 0 ? volume : 1

            element.volume = nextVolume
            element.muted = false

            setVolume(nextVolume)
            setIsMuted(false)
        } else {
            element.muted = true
            setIsMuted(true)
        }
    }, [isStatic, volume])

    const changeVolume = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const element = videoRef.current

            if (!element || isStatic) {
                return
            }

            const nextVolume = Math.min(
                1,
                Math.max(0, Number(event.target.value))
            )

            element.volume = nextVolume
            element.muted = nextVolume === 0

            setVolume(nextVolume)
            setIsMuted(nextVolume === 0)
        },
        [isStatic]
    )

    const seek = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const element = videoRef.current

            if (!element || isStatic) {
                return
            }

            const nextTime = Number(event.target.value)

            if (!Number.isFinite(nextTime)) {
                return
            }

            element.currentTime = nextTime
            setCurrentTime(nextTime)
        },
        [isStatic]
    )

    const changeSpeed = React.useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            const element = videoRef.current

            if (!element || isStatic) {
                return
            }

            const nextSpeed = Number(event.target.value)

            if (!Number.isFinite(nextSpeed)) {
                return
            }

            element.playbackRate = nextSpeed
            setSpeed(nextSpeed)
        },
        [isStatic]
    )

    const toggleFullscreen = React.useCallback(() => {
        const element = containerRef.current

        if (!element || isStatic) {
            return
        }

        if (!document.fullscreenElement) {
            const request = element.requestFullscreen?.()

            if (request) {
                request.catch(() => {})
            }
        } else {
            const exit = document.exitFullscreen?.()

            if (exit) {
                exit.catch(() => {})
            }
        }
    }, [isStatic])

    const handleTimeUpdate = React.useCallback(() => {
        const element = videoRef.current

        if (!element) {
            return
        }

        setCurrentTime(element.currentTime)

        if (Number.isFinite(element.duration)) {
            setDuration(element.duration)
        }
    }, [])

    const handleLoadedMetadata = React.useCallback(() => {
        const element = videoRef.current

        if (!element) {
            return
        }

        if (Number.isFinite(element.duration)) {
            setDuration(element.duration)
        }

        element.playbackRate = safeDefaultSpeed
    }, [safeDefaultSpeed])

    React.useEffect(() => {
        const element = videoRef.current

        if (!element) {
            return
        }

        element.muted = muted

        if (muted) {
            element.volume = 0
            setVolume(0)
            setIsMuted(true)
        } else {
            const nextVolume = volume > 0 ? volume : 1

            element.volume = nextVolume
            element.muted = false

            setVolume(nextVolume)
            setIsMuted(false)
        }

        element.playbackRate = safeDefaultSpeed
        setSpeed(safeDefaultSpeed)
    }, [video, muted, safeDefaultSpeed])

    React.useEffect(() => {
        const element = videoRef.current

        if (!element || isStatic || !autoplay) {
            return
        }

        element
            .play()
            .then(() => {
                setPlaying(true)
            })
            .catch(() => {
                setPlaying(false)
            })
    }, [autoplay, isStatic, video])

    React.useEffect(() => {
        const element = videoRef.current

        if (!element) {
            return
        }

        const handlePlay = () => setPlaying(true)
        const handlePause = () => setPlaying(false)

        const handleEnded = () => {
            if (!loop) {
                setPlaying(false)
            }
        }

        element.addEventListener("play", handlePlay)

        element.addEventListener("pause", handlePause)

        element.addEventListener("ended", handleEnded)

        return () => {
            element.removeEventListener("play", handlePlay)

            element.removeEventListener("pause", handlePause)

            element.removeEventListener("ended", handleEnded)
        }
    }, [loop])

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setFullscreen(document.fullscreenElement === containerRef.current)
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            )
        }
    }, [])

    React.useEffect(() => {
        if (isStatic) {
            return
        }

        const handleKeyboard = (event: KeyboardEvent) => {
            const container = containerRef.current

            if (!container) {
                return
            }

            if (!container.contains(document.activeElement)) {
                return
            }

            const target = event.target as HTMLElement | null

            if (
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "SELECT" ||
                    target.tagName === "BUTTON")
            ) {
                return
            }

            if (event.key === " " || event.code === "Space") {
                event.preventDefault()
                togglePlay()
            }

            if (event.key.toLowerCase() === "m") {
                event.preventDefault()
                toggleMute()
            }

            if (event.key.toLowerCase() === "f") {
                event.preventDefault()
                toggleFullscreen()
            }

            const element = videoRef.current

            if (!element) {
                return
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault()

                element.currentTime = Math.max(0, element.currentTime - 5)

                setCurrentTime(element.currentTime)
            }

            if (event.key === "ArrowRight") {
                event.preventDefault()

                element.currentTime = Math.min(
                    element.duration || Infinity,
                    element.currentTime + 5
                )

                setCurrentTime(element.currentTime)
            }
        }

        document.addEventListener("keydown", handleKeyboard)

        return () => {
            document.removeEventListener("keydown", handleKeyboard)
        }
    }, [isStatic, toggleFullscreen, toggleMute, togglePlay])

    const controlsClass = controlsOnHover
        ? "ksvp-controls ksvp-hover-controls"
        : "ksvp-controls"

    const transitionDuration = reducedMotion
        ? 0
        : Math.max(0, hoverFadeDuration)

    return (
        <div
            ref={containerRef}
            className={
                controlsOnHover
                    ? "ksvp-player ksvp-hover-enabled"
                    : "ksvp-player"
            }
            tabIndex={0}
            role="region"
            aria-label="Video player"
            style={
                {
                    "--ksvp-fade": `${transitionDuration}ms`,
                    "--ksvp-control-bg": `rgba(0, 0, 0, ${Math.min(
                        1,
                        Math.max(0, controlsOpacity)
                    )})`,
                    "--ksvp-control-color": controlColor,
                    "--ksvp-accent": accentColor,
                    "--ksvp-blur": `${Math.max(0, controlsBlur)}px`,
                } as React.CSSProperties
            }
        >
            <video
                ref={videoRef}
                src={video}
                poster={poster || undefined}
                autoPlay={autoplay && !isStatic}
                muted={muted}
                loop={loop}
                playsInline
                preload="metadata"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit,
                    background: backgroundColor,
                    cursor: isStatic ? "default" : "pointer",
                }}
            />

            {!isStatic && !playing && showControls && (
                <button
                    type="button"
                    aria-label="Play video"
                    className="ksvp-center-play"
                    onClick={togglePlay}
                >
                    <PlayIcon size={28} />
                </button>
            )}

            {showControls && (
                <div className={controlsClass}>
                    {showProgress && (
                        <div className="ksvp-progress-wrap">
                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                step={0.01}
                                value={Math.min(currentTime, duration || 0)}
                                onChange={seek}
                                disabled={isStatic || !duration}
                                aria-label="Video progress"
                                className="ksvp-range ksvp-progress"
                                style={{
                                    background: `linear-gradient(to right, ${accentColor} ${progress}%, rgba(255,255,255,0.24) ${progress}%)`,
                                }}
                            />
                        </div>
                    )}

                    <div className="ksvp-row">
                        <div className="ksvp-left">
                            <button
                                type="button"
                                className="ksvp-button"
                                aria-label={
                                    playing ? "Pause video" : "Play video"
                                }
                                onClick={togglePlay}
                                disabled={isStatic}
                            >
                                {playing ? <PauseIcon /> : <PlayIcon />}
                            </button>

                            {showVolume && (
                                <div className="ksvp-volume">
                                    <button
                                        type="button"
                                        className="ksvp-button"
                                        aria-label={
                                            isMuted
                                                ? "Unmute video"
                                                : "Mute video"
                                        }
                                        onClick={toggleMute}
                                        disabled={isStatic}
                                    >
                                        <VolumeIcon muted={isMuted} />
                                    </button>

                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={isMuted ? 0 : volume}
                                        onChange={changeVolume}
                                        disabled={isStatic}
                                        aria-label="Volume"
                                        className="ksvp-volume-range"
                                        style={{
                                            background: `linear-gradient(to right, ${accentColor} ${
                                                (isMuted ? 0 : volume) * 100
                                            }%, rgba(255,255,255,0.25) ${
                                                (isMuted ? 0 : volume) * 100
                                            }%)`,
                                        }}
                                    />
                                </div>
                            )}

                            {showTime && (
                                <span className="ksvp-time">
                                    {formatTime(currentTime)} /{" "}
                                    {formatTime(duration)}
                                </span>
                            )}
                        </div>

                        <div className="ksvp-right">
                            {showSpeed && (
                                <select
                                    className="ksvp-speed"
                                    value={speed}
                                    onChange={changeSpeed}
                                    disabled={isStatic}
                                    aria-label="Playback speed"
                                >
                                    {parsedSpeeds.map((value) => (
                                        <option key={value} value={value}>
                                            {value}x
                                        </option>
                                    ))}
                                </select>
                            )}

                            {showFullscreen && (
                                <button
                                    type="button"
                                    className="ksvp-button"
                                    aria-label={
                                        fullscreen
                                            ? "Exit fullscreen"
                                            : "Enter fullscreen"
                                    }
                                    onClick={toggleFullscreen}
                                    disabled={isStatic}
                                >
                                    <FullscreenIcon />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .ksvp-player {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-width: 1px;
                    min-height: 1px;
                    overflow: hidden;
                    border-radius: ${Math.max(0, radius)}px;
                    background: ${backgroundColor};
                    isolation: isolate;
                    outline: none;
                }

                .ksvp-player:focus-visible {
                    outline: 2px solid ${accentColor};
                    outline-offset: 2px;
                }

                .ksvp-controls {
                    position: absolute;
                    left: 12px;
                    right: 12px;
                    bottom: 12px;
                    z-index: 20;
                    display: flex;
                    flex-direction: column;
                    gap: ${Math.max(0, controlGap)}px;
                    padding: ${Math.max(0, controlPadding)}px;
                    border-radius: ${Math.max(0, controlsRadius)}px;
                    color: var(--ksvp-control-color);
                    background: var(--ksvp-control-bg);
                    backdrop-filter: blur(
                        var(--ksvp-blur)
                    );
                    -webkit-backdrop-filter: blur(
                        var(--ksvp-blur)
                    );
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                    transition:
                        opacity var(--ksvp-fade) ease,
                        transform var(--ksvp-fade) ease,
                        visibility 0s linear 0s;
                }

                .ksvp-hover-enabled
                    .ksvp-hover-controls {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                    transform: translateY(8px);
                    transition:
                        opacity var(--ksvp-fade) ease,
                        transform var(--ksvp-fade) ease,
                        visibility 0s linear var(--ksvp-fade);
                }

                .ksvp-hover-enabled:hover
                    .ksvp-hover-controls,
                .ksvp-hover-enabled:focus-within
                    .ksvp-hover-controls {
                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;
                    transform: translateY(0);
                    transition:
                        opacity var(--ksvp-fade) ease,
                        transform var(--ksvp-fade) ease,
                        visibility 0s linear 0s;
                }

                .ksvp-center-play {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    z-index: 15;
                    width: 64px;
                    height: 64px;
                    padding: 0;
                    transform: translate(-50%, -50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 50%;
                    color: ${controlColor};
                    background: var(--ksvp-control-bg);
                    backdrop-filter: blur(
                        var(--ksvp-blur)
                    );
                    -webkit-backdrop-filter: blur(
                        var(--ksvp-blur)
                    );
                    cursor: pointer;
                }

                .ksvp-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: ${Math.max(0, controlGap)}px;
                    min-height: 30px;
                }

                .ksvp-left,
                .ksvp-right,
                .ksvp-volume {
                    display: flex;
                    align-items: center;
                }

                .ksvp-left,
                .ksvp-right {
                    gap: 4px;
                }

                .ksvp-volume {
                    gap: 3px;
                }

                .ksvp-button {
                    width: 30px;
                    height: 30px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 8px;
                    color: var(--ksvp-control-color);
                    background: transparent;
                    cursor: pointer;
                }

                .ksvp-button:hover {
                    background: rgba(
                        255,
                        255,
                        255,
                        0.1
                    );
                }

                .ksvp-button:disabled {
                    cursor: default;
                    opacity: 0.6;
                }

                .ksvp-time {
                    margin-left: 4px;
                    font-size: 12px;
                    line-height: 1;
                    white-space: nowrap;
                    font-variant-numeric: tabular-nums;
                    opacity: 0.9;
                    user-select: none;
                }

                .ksvp-progress-wrap {
                    width: 100%;
                    height: ${Math.max(2, progressHeight)}px;
                }

                .ksvp-range,
                .ksvp-volume-range {
                    appearance: none;
                    -webkit-appearance: none;
                    border: 0;
                    outline: 0;
                    padding: 0;
                    margin: 0;
                    border-radius: 999px;
                }

                .ksvp-progress {
                    width: 100%;
                    height: ${Math.max(2, progressHeight)}px;
                    cursor: pointer;
                }

                .ksvp-volume-range {
                    width: 60px;
                    height: 4px;
                    cursor: pointer;
                }

                .ksvp-range::-webkit-slider-thumb,
                .ksvp-volume-range::-webkit-slider-thumb {
                    appearance: none;
                    -webkit-appearance: none;
                    width: 10px;
                    height: 10px;
                    border: 0;
                    border-radius: 50%;
                    background: var(--ksvp-accent);
                    cursor: pointer;
                }

                .ksvp-range::-moz-range-thumb,
                .ksvp-volume-range::-moz-range-thumb {
                    width: 10px;
                    height: 10px;
                    border: 0;
                    border-radius: 50%;
                    background: var(--ksvp-accent);
                    cursor: pointer;
                }

                .ksvp-speed {
                    height: 30px;
                    min-width: 54px;
                    padding: 0 5px;
                    border: 0;
                    border-radius: 8px;
                    outline: none;
                    color: var(--ksvp-control-color);
                    background: transparent;
                    font-size: 12px;
                    cursor: pointer;
                    text-align: center;
                }

                .ksvp-speed:hover {
                    background: rgba(
                        255,
                        255,
                        255,
                        0.1
                    );
                }

                .ksvp-speed option {
                    color: #111111;
                    background: #ffffff;
                }

                @media (hover: none) {
                    .ksvp-hover-enabled
                        .ksvp-hover-controls {
                        opacity: 1;
                        visibility: visible;
                        pointer-events: auto;
                        transform: translateY(0);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .ksvp-controls {
                        transition: none !important;
                    }
                }
            `}</style>
        </div>
    )
}

KarimSaifVideoPlayer.defaultProps = {
    video: "",
    poster: "",

    autoplay: false,
    muted: false,
    loop: false,

    controlsOnHover: true,
    hoverFadeDuration: 180,

    showControls: true,
    showProgress: true,
    showTime: true,
    showVolume: true,
    showSpeed: true,
    showFullscreen: true,

    speedOptions: "0.5, 0.75, 1, 1.25, 1.5, 1.75, 2",
    defaultSpeed: 1,

    radius: 16,
    controlsRadius: 14,
    controlsOpacity: 0.72,
    controlsBlur: 18,

    controlColor: "#FFFFFF",
    accentColor: "#FFFFFF",

    progressHeight: 4,
    controlPadding: 10,
    controlGap: 8,

    objectFit: "cover",
    backgroundColor: "#000000",
}

addPropertyControls(KarimSaifVideoPlayer, {
    video: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov", "m4v"],
        title: "Video",
        description: "Upload an MP4, WebM, MOV, or M4V video file.",
    },

    poster: {
        type: ControlType.Image,
        title: "Poster",
        description: "Optional image displayed before the video starts.",
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        description: "Automatically starts the video when the component loads.",
    },

    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: false,
        description: "Starts the video without sound.",
    },

    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        description: "Restarts the video automatically after it ends.",
    },

    controlsOnHover: {
        type: ControlType.Boolean,
        title: "Hover Controls",
        defaultValue: true,
        description:
            "When enabled, video controls appear when the pointer enters the player and disappear when the pointer leaves.",
    },

    hoverFadeDuration: {
        type: ControlType.Number,
        title: "Hover Fade",
        defaultValue: 180,
        min: 0,
        max: 1000,
        step: 10,
        unit: "ms",
        displayStepper: true,
        description:
            "Controls how quickly the video controls appear and disappear when hovering.",
    },

    showControls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
        description: "Shows or hides the custom video controls.",
    },

    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
        description: "Shows the video progress and seek bar.",
    },

    showTime: {
        type: ControlType.Boolean,
        title: "Time",
        defaultValue: true,
        description: "Shows the current playback time and total duration.",
    },

    showVolume: {
        type: ControlType.Boolean,
        title: "Volume",
        defaultValue: true,
        description: "Shows the mute button and volume slider.",
    },

    showSpeed: {
        type: ControlType.Boolean,
        title: "Speed",
        defaultValue: true,
        description: "Shows the playback speed selector.",
    },

    showFullscreen: {
        type: ControlType.Boolean,
        title: "Fullscreen",
        defaultValue: true,
        description: "Shows the fullscreen button.",
    },

    speedOptions: {
        type: ControlType.String,
        title: "Speeds",
        defaultValue: "0.5, 0.75, 1, 1.25, 1.5, 1.75, 2",
        description: "Comma-separated playback speeds between 0.25x and 4x.",
    },

    defaultSpeed: {
        type: ControlType.Number,
        title: "Default Speed",
        defaultValue: 1,
        min: 0.25,
        max: 4,
        step: 0.25,
        displayStepper: true,
        description: "Sets the playback speed when the video starts.",
    },

    radius: {
        type: ControlType.Number,
        title: "Video Radius",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        description: "Controls the corner radius of the video.",
    },

    controlsRadius: {
        type: ControlType.Number,
        title: "Controls Radius",
        defaultValue: 14,
        min: 0,
        max: 50,
        step: 1,
        displayStepper: true,
        description: "Controls the corner radius of the control panel.",
    },

    controlsOpacity: {
        type: ControlType.Number,
        title: "Controls Opacity",
        defaultValue: 0.72,
        min: 0,
        max: 1,
        step: 0.01,
        description: "Controls the opacity of the control panel background.",
    },

    controlsBlur: {
        type: ControlType.Number,
        title: "Controls Blur",
        defaultValue: 18,
        min: 0,
        max: 50,
        step: 1,
        displayStepper: true,
        description: "Controls the backdrop blur behind the controls.",
    },

    controlColor: {
        type: ControlType.Color,
        title: "Control Color",
        defaultValue: "#FFFFFF",
        description: "Sets the color of the video controls.",
    },

    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#FFFFFF",
        description: "Sets the color of progress and volume indicators.",
    },

    progressHeight: {
        type: ControlType.Number,
        title: "Progress Height",
        defaultValue: 4,
        min: 2,
        max: 12,
        step: 1,
        displayStepper: true,
        description: "Controls the thickness of the progress bar.",
    },

    controlPadding: {
        type: ControlType.Number,
        title: "Control Padding",
        defaultValue: 10,
        min: 4,
        max: 30,
        step: 1,
        displayStepper: true,
        description: "Controls the internal padding of the control panel.",
    },

    controlGap: {
        type: ControlType.Number,
        title: "Control Gap",
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 1,
        displayStepper: true,
        description: "Controls the spacing between control elements.",
    },

    objectFit: {
        type: ControlType.Enum,
        title: "Object Fit",
        defaultValue: "cover",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        description: "Controls how the video fits inside the player.",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
