// @framerDisableUnlink
/**
 * Video Ring — BuiltByKern Marketplace
 * Hero video + floating play/pause FAB with radial timeline ring.
 * Accent `#F5B942` · surface `#0B0907`.
 * Object prop groups · static renderer · reduced-motion ·
 * offscreen/visibility pause · ref-driven ring (no per-frame setState).
 */
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion } from "framer-motion"
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type FocusEvent,
} from "react"

type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left"
type ObjectFit = "cover" | "contain" | "fill"

type FramerImage = {
    src: string
    srcSet?: string
    alt?: string
}

interface MediaCtrl {
    videoSrc: string
    poster: FramerImage | undefined
    objectFit: ObjectFit
}

interface PlaybackCtrl {
    autoplay: boolean
    loop: boolean
    muted: boolean
    pauseOffscreen: boolean
}

interface AppearanceCtrl {
    ringColor: string
    trackColor: string
    iconColor: string
    buttonBackground: string
    focusColor: string
    ringWidth: number
    blur: number
    showVeil: boolean
}

interface ControlCtrl {
    size: number
    corner: Corner
    inset: number
    staticProgress: number
    playLabel: string
    pauseLabel: string
}

interface VideoRingProps {
    media?: Partial<MediaCtrl>
    playback?: Partial<PlaybackCtrl>
    appearance?: Partial<AppearanceCtrl>
    control?: Partial<ControlCtrl>
    onPlay?: () => void
    onPause?: () => void
    style?: CSSProperties
}

const DEFAULT_VIDEO =
    "https://framerusercontent.com/assets/jRDH374DhcxtMZXITaopa8wHq0.mp4"
/** BuiltByKern product accent */
const DEFAULT_ACCENT = "#F5B942"
const DEFAULT_SURFACE = "#0B0907"
/** Default poster for the bundled hero clip */
const DEFAULT_POSTER: FramerImage = {
    src: "https://framerusercontent.com/images/tRbRj3DYxGJTuC9ySF0fzRV32Kw.jpg",
    alt: "Aerial lake landscape at sunset",
}

const DEFAULT_MEDIA: MediaCtrl = {
    videoSrc: DEFAULT_VIDEO,
    poster: DEFAULT_POSTER,
    objectFit: "cover",
}

const DEFAULT_PLAYBACK: PlaybackCtrl = {
    autoplay: true,
    loop: true,
    muted: true,
    pauseOffscreen: true,
}

const DEFAULT_APPEARANCE: AppearanceCtrl = {
    ringColor: DEFAULT_ACCENT,
    trackColor: "rgba(245,185,66,0.28)",
    iconColor: "#FFF6E8",
    buttonBackground: "rgba(18,12,6,0.55)",
    focusColor: DEFAULT_ACCENT,
    ringWidth: 1.75,
    blur: 14,
    showVeil: true,
}

const DEFAULT_CONTROL: ControlCtrl = {
    size: 48,
    corner: "bottom-right",
    inset: 28,
    staticProgress: 0.34,
    playLabel: "Play video",
    pauseLabel: "Pause video",
}

function PlayIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            aria-hidden="true"
            focusable="false"
        >
            <path d="M9 6.8v10.4L18.2 12 9 6.8z" />
        </svg>
    )
}

function PauseIcon({ color, size }: { color: string; size: number }) {
    const w = 2
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            aria-hidden="true"
            focusable="false"
        >
            <rect x={7.5} y={6.5} width={w} height={11} rx={0.6} />
            <rect x={14.5} y={6.5} width={w} height={11} rx={0.6} />
        </svg>
    )
}

function readProgress(video: HTMLVideoElement | null): number {
    if (!video) return 0
    const { currentTime, duration } = video
    if (!duration || !Number.isFinite(duration) || duration <= 0) return 0
    return Math.max(0, Math.min(1, currentTime / duration))
}

function cornerStyle(corner: Corner, inset: number): CSSProperties {
    switch (corner) {
        case "bottom-right":
            return { right: inset, bottom: inset, left: "auto", top: "auto" }
        case "bottom-left":
            return { left: inset, bottom: inset, right: "auto", top: "auto" }
        case "top-right":
            return { right: inset, top: inset, left: "auto", bottom: "auto" }
        case "top-left":
            return { left: inset, top: inset, right: "auto", bottom: "auto" }
        default: {
            const _exhaustive: never = corner
            void _exhaustive
            return { right: inset, bottom: inset, left: "auto", top: "auto" }
        }
    }
}

/**
 * Video Ring
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 450
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VideoRing(props: VideoRingProps) {
    const mediaIn = props.media
    const media: MediaCtrl = {
        ...DEFAULT_MEDIA,
        ...mediaIn,
        videoSrc:
            typeof mediaIn?.videoSrc === "string" && mediaIn.videoSrc.length > 0
                ? mediaIn.videoSrc
                : DEFAULT_VIDEO,
        poster: mediaIn?.poster ?? DEFAULT_POSTER,
        objectFit: mediaIn?.objectFit ?? DEFAULT_MEDIA.objectFit,
    }
    const playback: PlaybackCtrl = { ...DEFAULT_PLAYBACK, ...props.playback }
    const appearance: AppearanceCtrl = {
        ...DEFAULT_APPEARANCE,
        ...props.appearance,
    }
    const control: ControlCtrl = { ...DEFAULT_CONTROL, ...props.control }
    const { onPlay, onPause, style } = props

    const {
        videoSrc,
        poster,
        objectFit,
    } = media
    const { autoplay, loop, muted, pauseOffscreen } = playback
    const {
        ringColor,
        trackColor,
        iconColor,
        buttonBackground,
        focusColor,
        ringWidth,
        blur,
        showVeil,
    } = appearance
    const {
        size,
        corner,
        inset,
        staticProgress,
        playLabel,
        pauseLabel,
    } = control

    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion() ?? false

    const rootRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const progressCircleRef = useRef<SVGCircleElement>(null)
    const labelRef = useRef<HTMLButtonElement>(null)
    const circumferenceRef = useRef(1)
    const rafRef = useRef(0)
    const onScreenRef = useRef(true)
    const pageVisibleRef = useRef(true)
    const wasPlayingOffscreen = useRef(false)
    const playingRef = useRef(false)

    const [playing, setPlaying] = useState(false)
    /** Keyboard-only focus chrome (`:focus-visible`); pointer clicks stay clean. */
    const [focused, setFocused] = useState(false)

    const applyRingProgress = useCallback((value: number) => {
        const circle = progressCircleRef.current
        if (!circle) return
        const c = circumferenceRef.current
        const t = Math.max(0, Math.min(1, value))
        circle.style.strokeDashoffset = String(c * (1 - t))
        const btn = labelRef.current
        if (btn) {
            const label = playingRef.current ? pauseLabel : playLabel
            btn.setAttribute(
                "aria-label",
                `${label}, ${Math.round(t * 100)}% played`,
            )
        }
    }, [pauseLabel, playLabel])

    const syncProgress = useCallback(() => {
        applyRingProgress(readProgress(videoRef.current))
    }, [applyRingProgress])

    // Keep circumference in sync with size / stroke
    useEffect(() => {
        const radius = Math.max(1, size / 2 - ringWidth / 2 - 0.5)
        circumferenceRef.current = 2 * Math.PI * radius
        const circle = progressCircleRef.current
        if (circle) {
            circle.style.strokeDasharray = String(circumferenceRef.current)
        }
        if (isStatic) {
            applyRingProgress(staticProgress)
        } else {
            syncProgress()
        }
    }, [size, ringWidth, isStatic, staticProgress, applyRingProgress, syncProgress])

    // Reset when source changes
    useEffect(() => {
        playingRef.current = false
        startTransition(() => setPlaying(false))
        wasPlayingOffscreen.current = false
        applyRingProgress(0)
    }, [videoSrc, applyRingProgress])

    // Video events + autoplay (never on canvas/export)
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const video = videoRef.current
        if (!video) return

        const handlePlay = () => {
            playingRef.current = true
            startTransition(() => setPlaying(true))
            onPlay?.()
        }
        const handlePause = () => {
            playingRef.current = false
            startTransition(() => setPlaying(false))
            syncProgress()
            onPause?.()
        }

        video.addEventListener("play", handlePlay)
        video.addEventListener("pause", handlePause)
        video.addEventListener("timeupdate", syncProgress)
        video.addEventListener("loadedmetadata", syncProgress)
        video.addEventListener("ended", handlePause)

        syncProgress()

        const shouldAutoplay = autoplay && !prefersReduced
        if (shouldAutoplay) {
            const attempt = video.play()
            if (attempt && typeof attempt.catch === "function") {
                attempt.catch(() => {
                    playingRef.current = false
                    startTransition(() => setPlaying(false))
                })
            }
        }

        return () => {
            video.removeEventListener("play", handlePlay)
            video.removeEventListener("pause", handlePause)
            video.removeEventListener("timeupdate", syncProgress)
            video.removeEventListener("loadedmetadata", syncProgress)
            video.removeEventListener("ended", handlePause)
        }
    }, [
        isStatic,
        videoSrc,
        autoplay,
        prefersReduced,
        syncProgress,
        onPlay,
        onPause,
    ])

    // Offscreen + tab visibility pause
    useEffect(() => {
        if (isStatic || !pauseOffscreen) return
        if (typeof window === "undefined") return

        const root = rootRef.current
        const video = videoRef.current
        if (!root || !video) return

        const pauseForBackground = () => {
            if (!video.paused) {
                wasPlayingOffscreen.current = true
                video.pause()
            }
        }

        const resumeIfNeeded = () => {
            if (
                wasPlayingOffscreen.current &&
                onScreenRef.current &&
                pageVisibleRef.current
            ) {
                wasPlayingOffscreen.current = false
                const attempt = video.play()
                if (attempt && typeof attempt.catch === "function") {
                    attempt.catch(() => {
                        /* ignore */
                    })
                }
            }
        }

        const io =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      (entries) => {
                          const entry = entries[0]
                          onScreenRef.current = Boolean(
                              entry && entry.isIntersecting,
                          )
                          if (!onScreenRef.current) pauseForBackground()
                          else resumeIfNeeded()
                      },
                      { threshold: 0.15 },
                  )
                : null
        if (io) io.observe(root)

        const onVisibility = () => {
            pageVisibleRef.current = document.visibilityState !== "hidden"
            if (!pageVisibleRef.current) pauseForBackground()
            else resumeIfNeeded()
        }
        pageVisibleRef.current = document.visibilityState !== "hidden"
        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onVisibility)
        }
    }, [isStatic, pauseOffscreen, videoSrc])

    // Smooth ring via rAF → DOM refs only
    useEffect(() => {
        if (isStatic || !playing || prefersReduced) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = 0
            }
            return
        }
        if (typeof window === "undefined") return

        const tick = () => {
            syncProgress()
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = 0
            }
        }
    }, [isStatic, playing, prefersReduced, syncProgress])

    const togglePlayback = useCallback(() => {
        if (isStatic) return
        const video = videoRef.current
        if (!video) return

        wasPlayingOffscreen.current = false

        if (video.paused) {
            const attempt = video.play()
            if (attempt && typeof attempt.catch === "function") {
                attempt.catch(() => {
                    playingRef.current = false
                    startTransition(() => setPlaying(false))
                })
            }
        } else {
            video.pause()
        }
    }, [isStatic])

    const onFocus = useCallback((e: FocusEvent<HTMLButtonElement>) => {
        if (e.currentTarget.matches(":focus-visible")) {
            startTransition(() => setFocused(true))
        }
    }, [])
    const onBlur = useCallback((_e: FocusEvent<HTMLButtonElement>) => {
        startTransition(() => setFocused(false))
    }, [])

    const showPause = isStatic ? true : playing
    const accessibleName = `${showPause ? pauseLabel : playLabel}, ${Math.round((isStatic ? staticProgress : 0) * 100)}% played`

    const svgSize = size
    const center = svgSize / 2
    const radius = Math.max(1, center - ringWidth / 2 - 0.5)
    const circumference = 2 * Math.PI * radius
    const iconSize = Math.round(size * 0.34)
    const posterSrc = poster?.src
    const initialDash =
        circumference *
        (1 - (isStatic ? Math.max(0, Math.min(1, staticProgress)) : 0))

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: DEFAULT_SURFACE,
            }}
        >
            <video
                ref={videoRef}
                src={videoSrc}
                poster={posterSrc}
                muted={muted}
                playsInline
                loop={loop}
                preload={posterSrc ? "none" : "metadata"}
                controls={false}
                aria-hidden="true"
                tabIndex={-1}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit,
                    objectPosition: "center",
                    display: "block",
                    pointerEvents: "none",
                }}
            />

            {showVeil ? (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "28%",
                        pointerEvents: "none",
                        background:
                            "linear-gradient(to top, rgba(11,9,7,0.72) 0%, rgba(11,9,7,0) 100%)",
                        zIndex: 1,
                    }}
                />
            ) : null}

            <div
                style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    zIndex: 2,
                    ...cornerStyle(corner, inset),
                }}
            >
                <button
                    ref={labelRef}
                    type="button"
                    aria-label={accessibleName}
                    aria-pressed={showPause}
                    onClick={togglePlayback}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    style={{
                        position: "relative",
                        width: size,
                        height: size,
                        padding: 0,
                        margin: 0,
                        border: "none",
                        borderRadius: "50%",
                        background: buttonBackground,
                        cursor: isStatic ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        WebkitBackdropFilter: `blur(${blur}px) saturate(1.1)`,
                        backdropFilter: `blur(${blur}px) saturate(1.1)`,
                        boxShadow: focused
                            ? `0 0 0 2px ${focusColor}, 0 8px 32px rgba(245,185,66,0.18), inset 0 0 0 0.5px rgba(255,246,232,0.1)`
                            : "0 8px 32px rgba(0,0,0,0.45), inset 0 0 0 0.5px rgba(255,246,232,0.08)",
                        WebkitTapHighlightColor: "transparent",
                        outline: "none",
                    }}
                >
                    <svg
                        width={svgSize}
                        height={svgSize}
                        viewBox={`0 0 ${svgSize} ${svgSize}`}
                        style={{
                            position: "absolute",
                            inset: 0,
                            transform: "rotate(-90deg)",
                            pointerEvents: "none",
                            overflow: "visible",
                        }}
                        aria-hidden="true"
                        focusable="false"
                    >
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={trackColor}
                            strokeWidth={ringWidth}
                        />
                        <circle
                            ref={progressCircleRef}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth={ringWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={initialDash}
                            style={{
                                filter: `drop-shadow(0 0 1px ${ringColor})`,
                            }}
                        />
                    </svg>

                    <span
                        style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 0,
                            transform: showPause
                                ? undefined
                                : "translateX(1px)",
                        }}
                    >
                        {showPause ? (
                            <PauseIcon color={iconColor} size={iconSize} />
                        ) : (
                            <PlayIcon color={iconColor} size={iconSize} />
                        )}
                    </span>
                </button>
            </div>
        </div>
    )
}

VideoRing.displayName = "Video Ring"

addPropertyControls(VideoRing, {
    media: {
        type: ControlType.Object,
        title: "Media",
        icon: "object",
        description: "Video source, poster, and fit.",
        controls: {
            videoSrc: {
                type: ControlType.File,
                title: "Video",
                allowedFileTypes: ["mp4", "webm", "mov"],
            },
            poster: {
                type: ControlType.ResponsiveImage,
                title: "Poster",
            },
            objectFit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["cover", "contain", "fill"],
                optionTitles: ["Cover", "Contain", "Fill"],
                defaultValue: DEFAULT_MEDIA.objectFit,
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
        },
        defaultValue: { ...DEFAULT_MEDIA },
    },
    playback: {
        type: ControlType.Object,
        title: "Playback",
        icon: "interaction",
        description: "Autoplay, loop, mute, offscreen pause.",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: DEFAULT_PLAYBACK.autoplay,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: DEFAULT_PLAYBACK.loop,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            muted: {
                type: ControlType.Boolean,
                title: "Muted",
                defaultValue: DEFAULT_PLAYBACK.muted,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Browsers block autoplay unless muted.",
            },
            pauseOffscreen: {
                type: ControlType.Boolean,
                title: "Pause Offscreen",
                defaultValue: DEFAULT_PLAYBACK.pauseOffscreen,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Pause when scrolled away or tab hidden.",
            },
        },
        defaultValue: { ...DEFAULT_PLAYBACK },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "color",
        description: "Ring, glass, veil, and focus accent.",
        controls: {
            ringColor: {
                type: ControlType.Color,
                title: "Ring",
                defaultValue: DEFAULT_APPEARANCE.ringColor,
            },
            trackColor: {
                type: ControlType.Color,
                title: "Track",
                defaultValue: DEFAULT_APPEARANCE.trackColor,
            },
            iconColor: {
                type: ControlType.Color,
                title: "Icon",
                defaultValue: DEFAULT_APPEARANCE.iconColor,
            },
            buttonBackground: {
                type: ControlType.Color,
                title: "Button BG",
                defaultValue: DEFAULT_APPEARANCE.buttonBackground,
            },
            focusColor: {
                type: ControlType.Color,
                title: "Focus",
                defaultValue: DEFAULT_APPEARANCE.focusColor,
                description: "Keyboard focus ring.",
            },
            ringWidth: {
                type: ControlType.Number,
                title: "Ring Width",
                defaultValue: DEFAULT_APPEARANCE.ringWidth,
                min: 1,
                max: 6,
                step: 0.25,
                unit: "px",
            },
            blur: {
                type: ControlType.Number,
                title: "Glass Blur",
                defaultValue: DEFAULT_APPEARANCE.blur,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
            showVeil: {
                type: ControlType.Boolean,
                title: "Bottom Veil",
                defaultValue: DEFAULT_APPEARANCE.showVeil,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
        defaultValue: { ...DEFAULT_APPEARANCE },
    },
    control: {
        type: ControlType.Object,
        title: "Control",
        icon: "effect",
        description:
            "FAB size, corner, labels, canvas ring preview.\n\nBuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: DEFAULT_CONTROL.size,
                min: 36,
                max: 96,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            corner: {
                type: ControlType.Enum,
                title: "Corner",
                options: [
                    "bottom-right",
                    "bottom-left",
                    "top-right",
                    "top-left",
                ],
                optionTitles: [
                    "Bottom Right",
                    "Bottom Left",
                    "Top Right",
                    "Top Left",
                ],
                defaultValue: DEFAULT_CONTROL.corner,
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                defaultValue: DEFAULT_CONTROL.inset,
                min: 8,
                max: 80,
                step: 1,
                unit: "px",
            },
            staticProgress: {
                type: ControlType.Number,
                title: "Canvas Ring",
                defaultValue: DEFAULT_CONTROL.staticProgress,
                min: 0,
                max: 1,
                step: 0.01,
                description: "Ring fill on Canvas / Export only.",
            },
            playLabel: {
                type: ControlType.String,
                title: "Play Label",
                defaultValue: DEFAULT_CONTROL.playLabel,
            },
            pauseLabel: {
                type: ControlType.String,
                title: "Pause Label",
                defaultValue: DEFAULT_CONTROL.pauseLabel,
            },
        },
        defaultValue: { ...DEFAULT_CONTROL },
    },
    onPlay: {
        type: ControlType.EventHandler,
    },
    onPause: {
        type: ControlType.EventHandler,
    },
})
