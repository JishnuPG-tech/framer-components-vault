import {
    useEffect,
    useRef,
    useState,
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

import { motion, useMotionValue, useSpring } from "framer-motion"

const XS = [
    1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.4, 3.8, 4.2, 4.6, 5.0, 5.4, 5.8, 6.2, 6.6,
    7.0, 7.4, 7.8, 8.2, 8.6, 9.0,
]
const CENTER_Y = 5

function waveY(x: number, t: number) {
    return Math.sin(((x - 1) / 8) * Math.PI * 2 + t * 1.4) * 1.8
}

function smoothPath(points: [number, number][]): string {
    if (points.length < 2) return ""
    let d = `M${points[0][0].toFixed(3)},${points[0][1].toFixed(3)}`
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[i + 2] || p2
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6
        d += ` C${cp1x.toFixed(3)},${cp1y.toFixed(3)} ${cp2x.toFixed(3)},${cp2y.toFixed(3)} ${p2[0].toFixed(3)},${p2[1].toFixed(3)}`
    }
    return d
}

function applyWave(path: SVGPathElement, t: number, amp: number) {
    const pts: [number, number][] = XS.map((x) => [
        x,
        CENTER_Y + waveY(x, t) * amp,
    ])
    path.setAttribute("d", smoothPath(pts))
}

const DEFAULT_VIDEO_URL =
    "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"

interface VideoPlayerProps {
    videoSource: string
    videoUrl: string
    useUrl: boolean
    autoplay: boolean
    loop: boolean
    videoDelay: number
    audioSource: string
    audioUrl: string
    useAudioUrl: boolean
    audioVolume: number
    previewImage?: string
    defaultSoundOn: boolean
    soundButton?: {
        bgColor?: string
        iconColor?: string
        borderRadius?: number
        iconSize?: number
        padding?: string
        bottomOffset?: number
        rightOffset?: number
    }
    style?: React.CSSProperties
}

function isValidHttpsUrl(url: string): boolean {
    if (!url) return false
    try {
        return new URL(url).protocol === "https:"
    } catch {
        return false
    }
}

/**
 * Video with Sound
 *
 * A video player with separate audio track support, animated sound wave button,
 * parallax mouse effect, and automatic pause/resume on scroll.
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VideoWithSound(props: VideoPlayerProps) {
    const {
        videoSource = DEFAULT_VIDEO_URL,
        videoUrl = DEFAULT_VIDEO_URL,
        useUrl = false,
        autoplay = true,
        loop = true,
        videoDelay = 0,
        audioSource = "",
        audioUrl = "",
        useAudioUrl = false,
        audioVolume = 0.5,
        previewImage,
        defaultSoundOn = false,
        soundButton,
        style,
    } = props

    const {
        bgColor: soundButtonBgColor = "#FCFCFC",
        iconColor: soundButtonColor = "#3D3D3D",
        borderRadius: soundButtonBorderRadius = 50,
        iconSize: soundIconSize = 12,
        padding: soundButtonPadding = "8px",
        bottomOffset: soundButtonBottomOffset = 20,
        rightOffset: soundButtonRightOffset = 20,
    } = soundButton ?? {}

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()

    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isInView, setIsInView] = useState(false)
    const [isMuted, setIsMuted] = useState(!defaultSoundOn)
    const [hasUserInteracted, setHasUserInteracted] = useState(false)
    const delayTimeoutRef = useRef<number | null>(null)
    const hasDelayBeenAppliedRef = useRef(false)
    const [isMobile, setIsMobile] = useState(false)

    // Wave animation refs
    const wavePathRef = useRef<SVGPathElement>(null)
    const waveTimeRef = useRef(0)
    const waveAmpRef = useRef(0)
    const waveTargetAmpRef = useRef(0)
    const waveRafRef = useRef<number>(0)
    const waveLastFrameRef = useRef<number>(0)

    // Parallax motion values for video (intensity 3)
    const videoX = useMotionValue(0)
    const videoY = useMotionValue(0)
    const videoSpringX = useSpring(videoX, { damping: 40, stiffness: 200 })
    const videoSpringY = useSpring(videoY, { damping: 40, stiffness: 200 })

    // Parallax motion values for sound button (intensity 1)
    const soundButtonX = useMotionValue(0)
    const soundButtonY = useMotionValue(0)
    const soundButtonSpringX = useSpring(soundButtonX, {
        damping: 40,
        stiffness: 200,
    })
    const soundButtonSpringY = useSpring(soundButtonY, {
        damping: 40,
        stiffness: 200,
    })

    const rawVideoUrl = useUrl ? videoUrl : videoSource
    const finalVideoUrl =
        isValidHttpsUrl(rawVideoUrl) ? rawVideoUrl : DEFAULT_VIDEO_URL
    const rawAudioUrl = useAudioUrl ? audioUrl : audioSource
    const finalAudioUrl = isValidHttpsUrl(rawAudioUrl) ? rawAudioUrl : ""
    const hasAudio = finalAudioUrl.length > 0

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                startTransition(() => setIsInView(entry.isIntersecting))
            },
            { threshold: 0.1 }
        )

        observer.observe(container)
        return () => observer.disconnect()
    }, [])

    // Detect mobile device
    useEffect(() => {
        let timeoutId: number | null = null
        const checkMobile = () => {
            if (timeoutId !== null) clearTimeout(timeoutId)
            timeoutId = window.setTimeout(() => {
                const isTouchDevice =
                    "ontouchstart" in window || navigator.maxTouchPoints > 0
                const isSmallScreen = window.innerWidth <= 768
                startTransition(() => setIsMobile(isTouchDevice || isSmallScreen))
            }, 150)
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => {
            window.removeEventListener("resize", checkMobile)
            if (timeoutId !== null) clearTimeout(timeoutId)
        }
    }, [])

    // Parallax effect for video (intensity 3) and sound button (intensity 1)
    useEffect(() => {
        if (!isInView || isMobile || isStatic) return

        let rafId: number | null = null
        const calculateDistance = (e: MouseEvent) => {
            if (rafId !== null) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                if (!containerRef.current) return

                const rect = containerRef.current.getBoundingClientRect()
                const centerX = rect.left + rect.width / 2
                const centerY = rect.top + rect.height / 2
                const distanceX = e.clientX - centerX
                const distanceY = e.clientY - centerY

                // Video parallax - intensity 3
                videoX.set(distanceX * 0.03)
                videoY.set(distanceY * 0.03)

                // Sound button parallax - intensity 1
                soundButtonX.set(distanceX * 0.01)
                soundButtonY.set(distanceY * 0.01)
            })
        }

        document.addEventListener("mousemove", calculateDistance)

        return () => {
            document.removeEventListener("mousemove", calculateDistance)
            if (rafId !== null) cancelAnimationFrame(rafId)
        }
    }, [isInView, isMobile, isStatic, videoX, videoY, soundButtonX, soundButtonY])

    // Reset parallax when out of view
    useEffect(() => {
        if (!isInView) {
            videoX.set(0)
            videoY.set(0)
            soundButtonX.set(0)
            soundButtonY.set(0)
        }
    }, [isInView, videoX, videoY, soundButtonX, soundButtonY])

    useEffect(() => {
        const video = videoRef.current
        const audio = audioRef.current
        if (!video) return
        // Clear any existing delay timeout
        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current)
            delayTimeoutRef.current = null
        }

        if (isInView) {
            if (autoplay && video.paused) {
                if (videoDelay > 0 && !hasDelayBeenAppliedRef.current) {
                    hasDelayBeenAppliedRef.current = true
                    delayTimeoutRef.current = window.setTimeout(() => {
                        video.play().catch(() => {})
                        if (
                            hasAudio &&
                            audio &&
                            audio.paused &&
                            !isCanvas &&
                            hasUserInteracted
                        ) {
                            audio.play().catch(() => {})
                        }
                    }, videoDelay * 1000)
                } else {
                    video.play().catch(() => {})
                    if (
                        hasAudio &&
                        audio &&
                        audio.paused &&
                        !isCanvas &&
                        hasUserInteracted
                    ) {
                        audio.play().catch(() => {})
                    }
                }
            }
            // Audio catch-up: if video is playing but audio hasn't started yet
            if (
                autoplay &&
                hasAudio &&
                audio &&
                audio.paused &&
                !isCanvas &&
                hasUserInteracted
            ) {
                audio.play().catch(() => {})
            }
        } else {
            if (!video.paused) {
                video.pause()
            }
            if (hasAudio && audio && !audio.paused) {
                audio.pause()
            }
        }

        return () => {
            if (delayTimeoutRef.current) {
                clearTimeout(delayTimeoutRef.current)
            }
        }
    }, [
        isInView,
        autoplay,
        hasAudio,
        isCanvas,
        hasUserInteracted,
        videoDelay,
    ])

    useEffect(() => {
        const audio = audioRef.current
        if (audio) {
            if (isCanvas) {
                audio.volume = 0
                audio.muted = true
            } else {
                audio.muted = isMuted
                audio.volume = isMuted ? 0 : audioVolume
            }
        }
    }, [audioVolume, isMuted, isCanvas])

    // Wave animation loop — paused when out of view for performance
    useEffect(() => {
        if (isStatic || !isInView) return
        function loop(now: number) {
            const dt = waveLastFrameRef.current
                ? (now - waveLastFrameRef.current) / 1000
                : 0
            waveLastFrameRef.current = now
            waveTimeRef.current += dt
            const factor = Math.min(1, dt * 5)
            waveAmpRef.current += (waveTargetAmpRef.current - waveAmpRef.current) * factor
            const path = wavePathRef.current
            if (path) applyWave(path, waveTimeRef.current, waveAmpRef.current)
            waveRafRef.current = requestAnimationFrame(loop)
        }
        waveLastFrameRef.current = 0
        waveRafRef.current = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(waveRafRef.current)
    }, [isStatic, isInView])

    // Sync isMuted when defaultSoundOn prop changes (e.g. canvas property panel)
    useEffect(() => {
        setIsMuted(!defaultSoundOn)
    }, [defaultSoundOn])

    // Sync target amplitude — muted when no audio or when isMuted
    useEffect(() => {
        waveTargetAmpRef.current = (isMuted || !hasAudio) ? 0.25 : 1.0
    }, [isMuted, hasAudio])

    const toggleMute = useCallback(() => {
        const newMuted = !isMuted
        setIsMuted(newMuted)
        setHasUserInteracted(true)
        const audio = audioRef.current
        if (audio) {
            audio.muted = newMuted
            audio.volume = newMuted ? 0 : audioVolume
            if (!newMuted && audio.paused) {
                audio.play().catch(() => {})
            }
        }
    }, [isMuted, audioVolume])

    if (isCanvas) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#111",
                    ...style,
                }}
            >
                {previewImage ? (
                    <img
                        src={previewImage}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : null}
                <div
                    style={{
                        position: "absolute",
                        bottom: soundButtonBottomOffset,
                        right: soundButtonRightOffset,
                        zIndex: 9999,
                    }}
                >
                    <button
                        type="button"
                        tabIndex={-1}
                        style={{
                            backgroundColor: soundButtonBgColor,
                            border: "none",
                            padding: soundButtonPadding,
                            cursor: "default",
                            borderRadius: soundButtonBorderRadius,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-hidden="true"
                    >
                        <svg
                            width={soundIconSize}
                            height={soundIconSize}
                            viewBox="0 0 10 10"
                            fill="none"
                            stroke={soundButtonColor}
                            strokeWidth={0.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d={smoothPath(XS.map((x) => [x, CENTER_Y]))} />
                        </svg>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#000",
                    ...style,
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        top: -20,
                        left: -20,
                        right: -20,
                        bottom: -20,
                        x: videoSpringX,
                        y: videoSpringY,
                    }}
                >
                    <video
                        ref={videoRef}
                        src={finalVideoUrl}
                        muted
                        loop={loop}
                        playsInline
                        preload="metadata"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                </motion.div>
                {hasAudio && (
                    <audio
                        ref={audioRef}
                        src={finalAudioUrl}
                        loop={loop}
                        preload="metadata"
                        style={{ display: "none" }}
                    />
                )}
            </div>
            {isInView && (
                <motion.div
                    style={{
                        position: isMobile ? "fixed" : "absolute",
                        bottom: isMobile ? 40 : soundButtonBottomOffset,
                        right: isMobile ? 12 : soundButtonRightOffset,
                        top: isMobile ? "auto" : undefined,
                        left: isMobile ? "auto" : undefined,
                        zIndex: 9999,
                        x: isMobile ? 0 : soundButtonSpringX,
                        y: isMobile ? 0 : soundButtonSpringY,
                    }}
                >
                    <button
                        type="button"
                        onClick={hasAudio ? toggleMute : undefined}
                        style={{
                            backgroundColor: soundButtonBgColor,
                            border: "none",
                            padding: soundButtonPadding,
                            cursor: hasAudio ? "pointer" : "default",
                            borderRadius: soundButtonBorderRadius,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        <svg
                            aria-hidden="true"
                            width={soundIconSize}
                            height={soundIconSize}
                            viewBox="0 0 10 10"
                            fill="none"
                            stroke={soundButtonColor}
                            strokeWidth={0.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path
                                ref={wavePathRef}
                                d={smoothPath(XS.map((x) => [x, CENTER_Y]))}
                            />
                        </svg>
                    </button>
                </motion.div>
            )}
        </>
    )
}

addPropertyControls(VideoWithSound, {
    useUrl: {
        type: ControlType.Boolean,
        title: "Source Type",
        defaultValue: false,
        enabledTitle: "URL",
        disabledTitle: "File",
    },
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        placeholder: "https://...",
        defaultValue: DEFAULT_VIDEO_URL,
        hidden: ({ useUrl = false }) => !useUrl,
    },
    videoSource: {
        type: ControlType.File,
        title: "Video File",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ useUrl = false }) => useUrl,
    },
    previewImage: {
        type: ControlType.Image,
        title: "Preview Image",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    videoDelay: {
        type: ControlType.Number,
        title: "Video Delay",
        description: "Wait before playing after the video enters the viewport.",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    useAudioUrl: {
        type: ControlType.Boolean,
        title: "Audio Source",
        defaultValue: false,
        enabledTitle: "URL",
        disabledTitle: "File",
    },
    audioUrl: {
        type: ControlType.String,
        title: "Audio URL",
        placeholder: "https://...",
        defaultValue: "",
        hidden: ({ useAudioUrl = false }) => !useAudioUrl,
    },
    audioSource: {
        type: ControlType.File,
        title: "Audio File",
        allowedFileTypes: ["mp3", "wav", "ogg", "aac", "m4a"],
        hidden: ({ useAudioUrl = false }) => useAudioUrl,
    },
    audioVolume: {
        type: ControlType.Number,
        title: "Audio Volume",
        description: "Volume of the separate audio track. Only applies when an audio file is set.",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
    },
    defaultSoundOn: {
        type: ControlType.Boolean,
        title: "Default Sound",
        description: "Sets the initial sound state. When set to On, sound will play as soon as the user interacts with the page — browsers require a user gesture before audio can start.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    soundButton: {
        type: ControlType.Object,
        title: "Sound Button",
        description: "Customize the mute/unmute button appearance and position.",
        controls: {
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FCFCFC",
            },
            iconColor: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#3D3D3D",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 50,
                min: 0,
                max: 500,
                step: 1,
                unit: "px",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                defaultValue: 12,
                min: 8,
                max: 64,
                step: 1,
                unit: "px",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "8px",
            },
            bottomOffset: {
                type: ControlType.Number,
                title: "Bottom Offset",
                defaultValue: 20,
                min: 0,
                max: 500,
                step: 1,
                unit: "px",
            },
            rightOffset: {
                type: ControlType.Number,
                title: "Right Offset",
                defaultValue: 20,
                min: 0,
                max: 500,
                step: 1,
                unit: "px",
            },
        },
    },
})