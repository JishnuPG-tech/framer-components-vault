// User request: add end-of-video behavior control for Hover Play mode (Stop / Loop / Play Backwards) while preserving existing props/controls and scrub behavior.
// Framer Code Component — Scrubbable
// Paste into Framer: Assets panel → Code → New Code File, then drop
// "Scrubbable" onto the canvas and set it to Fill / Relative sizing.
// Move the cursor (or drag a finger) horizontally or vertically over the
// component to scrub through an uploaded video.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"

interface ScrubbableProps {
    videoFile?: string
    webmSrc?: string
    mp4Src?: string
    interactionMode?: "Scrub" | "Hover" | "Hover Play"
    hoverLeaveBehavior?: "Pause" | "Reset"
    endBehavior?: "Stop" | "Loop" | "Play Backwards"
    smoothing?: number
    startAt?: number
    scrubDirection?: "Horizontal" | "Vertical"
    resetOnLeave?: boolean
    objectFit?: "cover" | "contain" | "fill"
    borderRadius?: number
    backgroundColor?: string
    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 320
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function Scrubbable(props: ScrubbableProps) {
    const {
        videoFile = "",
        webmSrc = "",
        mp4Src = "",
        interactionMode = "Scrub",
        hoverLeaveBehavior = "Pause",
        endBehavior = "Stop",
        smoothing = 0.16,
        startAt = 0.35,
        scrubDirection = "Horizontal",
        resetOnLeave = false,
        objectFit = "cover",
        borderRadius = 0,
        backgroundColor = "#000000",
        style,
    } = props
    const hasExplicitWidth = style?.width !== undefined
    const hasExplicitHeight = style?.height !== undefined

    const sectionRef = React.useRef<HTMLElement | null>(null)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const targetRef = React.useRef(0)
    const currentRef = React.useRef(0)
    const durationRef = React.useRef(0)
    const rafRef = React.useRef<number | null>(null)
    const easeRef = React.useRef(smoothing)
    const isSeekingRef = React.useRef(false)
    const queuedSeekRef = React.useRef<number | null>(null)
    const lastAppliedTimeRef = React.useRef(-1)
    const isHoveredRef = React.useRef(false)
    const backwardRafRef = React.useRef<number | null>(null)
    const backwardLastTimestampRef = React.useRef<number | null>(null)
    const stopReachedEndRef = React.useRef(false)
    easeRef.current = smoothing

    const [hasError, setHasError] = React.useState(false)
    const isStaticRenderer = useIsStaticRenderer()
    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas
    const normalizedInteractionMode =
        interactionMode === "Hover Play" ? "Hover" : interactionMode
    const isScrubMode = normalizedInteractionMode === "Scrub"

    const clampTime = React.useCallback((time: number, duration: number) => {
        if (duration <= 0) return 0
        return Math.min(Math.max(time, 0), Math.max(duration - 0.001, 0))
    }, [])

    const applySeek = React.useCallback(
        (time: number) => {
            const video = videoRef.current
            const duration = durationRef.current
            if (!video || !duration) return
            const nextTime = clampTime(time, duration)
            if (Math.abs(nextTime - lastAppliedTimeRef.current) < 0.0015) return
            try {
                video.currentTime = nextTime
                lastAppliedTimeRef.current = nextTime
            } catch (_error) {
                // Ignore failed seeks while media is not fully seekable yet.
            }
        },
        [clampTime]
    )

    const initializeFromDuration = React.useCallback(
        (duration: number) => {
            const safeDuration =
                Number.isFinite(duration) && duration > 0 ? duration : 0
            durationRef.current = safeDuration
            const initialTime = safeDuration * startAt
            targetRef.current = initialTime
            currentRef.current = initialTime
            queuedSeekRef.current = null
            lastAppliedTimeRef.current = -1
            if (safeDuration > 0) applySeek(initialTime)
        },
        [applySeek, startAt]
    )

    const safePause = React.useCallback(() => {
        const video = videoRef.current
        if (!video) return
        video.pause()
    }, [])

    const safePlay = React.useCallback(() => {
        const video = videoRef.current
        if (!video) return
        const playPromise = video.play()
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                // Ignore autoplay-blocking errors in environments that restrict play().
            })
        }
    }, [])

    const stopBackwardRaf = React.useCallback(() => {
        if (backwardRafRef.current !== null) {
            cancelAnimationFrame(backwardRafRef.current)
            backwardRafRef.current = null
        }
        backwardLastTimestampRef.current = null
    }, [])

    const startBackwardPlayback = React.useCallback(() => {
        const video = videoRef.current
        if (!video) return
        stopBackwardRaf()
        safePause()
        backwardLastTimestampRef.current = null
        const step = (timestamp: number) => {
            const currentVideo = videoRef.current
            if (!currentVideo) return
            if (!isHoveredRef.current) return
            if (isScrubMode || endBehavior !== "Play Backwards") return
            const duration = durationRef.current || currentVideo.duration || 0
            if (!Number.isFinite(duration) || duration <= 0) return
            const previousTimestamp = backwardLastTimestampRef.current
            backwardLastTimestampRef.current = timestamp
            const deltaSeconds =
                previousTimestamp === null
                    ? 0
                    : (timestamp - previousTimestamp) / 1000
            const next = clampTime(currentVideo.currentTime - deltaSeconds, duration)
            try {
                currentVideo.currentTime = next
            } catch (_error) {
                // Ignore transient seek errors while browser catches up.
            }
            if (next <= 0.0005) {
                stopBackwardRaf()
                if (isHoveredRef.current && !isScrubMode) safePlay()
                return
            }
            backwardRafRef.current = requestAnimationFrame(step)
        }
        backwardRafRef.current = requestAnimationFrame(step)
    }, [clampTime, endBehavior, isScrubMode, safePause, safePlay, stopBackwardRaf])

    const uploadedVideo = React.useMemo(() => {
        const trimmed = videoFile.trim()
        return trimmed.length > 0 ? trimmed : ""
    }, [videoFile])

    const hasSource = Boolean(uploadedVideo || webmSrc || mp4Src)
    const staticPreviewStyle = React.useMemo<React.CSSProperties>(() => {
        const backgroundSize =
            objectFit === "fill"
                ? "100% 100%"
                : objectFit === "contain"
                  ? "contain"
                  : "cover"
        return {
            position: "absolute",
            inset: 0,
            zIndex: -2,
            backgroundColor,
            backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 42%, rgba(0,0,0,0.18) 100%)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize,
            pointerEvents: "none",
        }
    }, [backgroundColor, objectFit])

    React.useEffect(() => {
        const video = videoRef.current
        durationRef.current = 0
        targetRef.current = 0
        currentRef.current = 0
        isSeekingRef.current = false
        queuedSeekRef.current = null
        lastAppliedTimeRef.current = -1
        isHoveredRef.current = false
        stopReachedEndRef.current = false
        React.startTransition(() => setHasError(false))
        if (isStaticRenderer) {
            stopBackwardRaf()
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            return
        }
        stopBackwardRaf()
        safePause()
        if (!video) return
        video.load()
    }, [isStaticRenderer, uploadedVideo, webmSrc, mp4Src, safePause, stopBackwardRaf])

    React.useEffect(() => {
        if (isStaticRenderer) {
            stopBackwardRaf()
            return
        }
        const video = videoRef.current
        if (!video) return
        if (isScrubMode) {
            stopBackwardRaf()
            safePause()
            if (durationRef.current > 0) {
                const clampedTime = clampTime(video.currentTime, durationRef.current)
                targetRef.current = clampedTime
                currentRef.current = clampedTime
            }
        } else {
            isSeekingRef.current = false
            queuedSeekRef.current = null
        }
        stopReachedEndRef.current = false
    }, [clampTime, isScrubMode, isStaticRenderer, safePause, stopBackwardRaf])

    React.useEffect(() => {
        if (isStaticRenderer) {
            stopBackwardRaf()
            return
        }
        if (isScrubMode || endBehavior !== "Play Backwards") {
            stopBackwardRaf()
        }
    }, [endBehavior, isScrubMode, isStaticRenderer, stopBackwardRaf])

    React.useEffect(() => {
        return () => {
            stopBackwardRaf()
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [stopBackwardRaf])

    React.useEffect(() => {
        if (isStaticRenderer || !isScrubMode) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            return
        }
        const tick = () => {
            const video = videoRef.current
            if (video) {
                if (
                    !durationRef.current &&
                    Number.isFinite(video.duration) &&
                    video.duration > 0
                ) {
                    initializeFromDuration(video.duration)
                }
                const duration = durationRef.current
                if (duration > 0) {
                    const next =
                        currentRef.current +
                        (targetRef.current - currentRef.current) *
                            easeRef.current
                    const clampedNext = clampTime(next, duration)
                    currentRef.current = clampedNext
                    if (Math.abs(clampedNext - video.currentTime) > 0.003) {
                        if (isSeekingRef.current) {
                            queuedSeekRef.current = clampedNext
                        } else {
                            applySeek(clampedNext)
                        }
                    }
                }
            }
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [applySeek, clampTime, initializeFromDuration, isScrubMode, isStaticRenderer])

    const setFromClientPosition = (clientX: number, clientY: number) => {
        const el = sectionRef.current
        const duration = durationRef.current
        if (!el || !duration) return
        const rect = el.getBoundingClientRect()
        const ratioX = Math.min(
            Math.max((clientX - rect.left) / rect.width, 0),
            1
        )
        const ratioY = Math.min(
            Math.max((clientY - rect.top) / rect.height, 0),
            1
        )
        const ratio = scrubDirection === "Vertical" ? ratioY : ratioX
        targetRef.current = ratio * duration
    }

    const handlePointerLeave = () => {
        isHoveredRef.current = false
        stopBackwardRaf()
        if (!isScrubMode) {
            safePause()
            if (hoverLeaveBehavior === "Reset") {
                stopReachedEndRef.current = false
                targetRef.current = 0
                currentRef.current = 0
                queuedSeekRef.current = null
                lastAppliedTimeRef.current = -1
                applySeek(0)
            }
            return
        }
        if (!resetOnLeave) return
        const duration = durationRef.current
        if (duration > 0) targetRef.current = duration * startAt
    }

    return (
        <section
            ref={sectionRef}
            aria-label="Scrubbable video"
            onPointerEnter={
                isStaticRenderer
                    ? undefined
                    : () => {
                          isHoveredRef.current = true
                          if (!isScrubMode) {
                              stopBackwardRaf()
                              const video = videoRef.current
                              const duration =
                                  durationRef.current ||
                                  (video?.duration ? video.duration : 0)
                              if (
                                  video &&
                                  duration > 0 &&
                                  (stopReachedEndRef.current ||
                                      video.currentTime >=
                                          Math.max(duration - 0.02, 0))
                              ) {
                                  try {
                                      video.currentTime = 0
                                  } catch (_error) {
                                      // Ignore transient seek errors.
                                  }
                                  stopReachedEndRef.current = false
                              }
                              safePlay()
                          }
                      }
            }
            onPointerMove={
                isStaticRenderer
                    ? undefined
                    : (e) => {
                          if (!isScrubMode) return
                          setFromClientPosition(e.clientX, e.clientY)
                      }
            }
            onPointerLeave={isStaticRenderer ? undefined : handlePointerLeave}
            onTouchMove={
                isStaticRenderer
                    ? undefined
                    : (e) => {
                          if (!isScrubMode) return
                          const touch = e.touches[0]
                          if (touch) setFromClientPosition(touch.clientX, touch.clientY)
                      }
            }
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                minWidth: hasExplicitWidth ? undefined : 480,
                minHeight: hasExplicitHeight ? undefined : 320,
                overflow: "hidden",
                isolation: "isolate",
                cursor: "default",
                touchAction: isStaticRenderer ? "auto" : "none",
                backgroundColor,
                borderRadius,
                ...style,
            }}
        >
            {isStaticRenderer && hasSource ? (
                <div aria-hidden style={staticPreviewStyle} />
            ) : null}
            {!isStaticRenderer && hasSource ? (
                <video
                    key={`${uploadedVideo || ""}|${webmSrc || ""}|${mp4Src || ""}`}
                    ref={videoRef}
                    src={uploadedVideo || undefined}
                    muted
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    onLoadedMetadata={(e) => {
                        initializeFromDuration(e.currentTarget.duration || 0)
                    }}
                    onError={() => {
                        React.startTransition(() => setHasError(true))
                    }}
                    onSeeking={() => {
                        isSeekingRef.current = true
                    }}
                    onSeeked={() => {
                        isSeekingRef.current = false
                        if (queuedSeekRef.current === null) return
                        const nextQueued = queuedSeekRef.current
                        queuedSeekRef.current = null
                        applySeek(nextQueued)
                    }}
                    onEnded={() => {
                        if (isStaticRenderer) return
                        if (isScrubMode || !isHoveredRef.current) return
                        if (endBehavior === "Stop") {
                            stopReachedEndRef.current = true
                            safePause()
                            return
                        }
                        if (endBehavior === "Play Backwards") {
                            startBackwardPlayback()
                        }
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: -2,
                        width: "100%",
                        height: "100%",
                        objectFit,
                    }}
                    loop={!isScrubMode && endBehavior === "Loop"}
                >
                    {!uploadedVideo && webmSrc ? (
                        <source src={webmSrc} type="video/webm" />
                    ) : null}
                    {!uploadedVideo && mp4Src ? (
                        <source src={mp4Src} type="video/mp4" />
                    ) : null}
                </video>
            ) : null}
            {isOnCanvas && !hasSource ? (
                <div style={placeholderStyle}>
                    <span>Upload a video, or add a WebM / MP4 URL</span>
                </div>
            ) : null}
            {isOnCanvas && hasError ? (
                <div style={{ ...placeholderStyle, color: "#ff6b6b" }}>
                    <span>Video failed to load — check the source</span>
                </div>
            ) : null}
        </section>
    )
}

const placeholderStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 24,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    border: "1px dashed rgba(255,255,255,0.3)",
    borderRadius: "inherit",
    pointerEvents: "none",
}

addPropertyControls(Scrubbable, {
    videoFile: {
        type: ControlType.File,
        title: "Upload Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    webmSrc: {
        type: ControlType.String,
        title: "WebM URL",
        defaultValue: "",
        hidden: (props) => Boolean(props.videoFile),
    },
    mp4Src: {
        type: ControlType.String,
        title: "MP4 URL",
        defaultValue: "",
        hidden: (props) => Boolean(props.videoFile),
    },
    interactionMode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["Scrub", "Hover"],
        optionTitles: ["Scrub", "Hover"],
        defaultValue: "Scrub",
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
    },
    hoverLeaveBehavior: {
        type: ControlType.Enum,
        title: "On Leave",
        options: ["Pause", "Reset"],
        optionTitles: ["Pause", "Reset"],
        defaultValue: "Pause",
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
        hidden: (props) =>
            props.interactionMode !== "Hover" &&
            props.interactionMode !== "Hover Play",
    },
    endBehavior: {
        type: ControlType.Enum,
        title: "End Behavior",
        options: ["Stop", "Loop", "Play Backwards"],
        optionTitles: ["Stop", "Loop", "Play Backwards"],
        defaultValue: "Stop",
        displaySegmentedControl: false,
        hidden: (props) =>
            props.interactionMode !== "Hover" &&
            props.interactionMode !== "Hover Play",
    },
    scrubDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Horizontal", "Vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "Horizontal",
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
        hidden: (props) => props.interactionMode !== "Scrub",
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0.02,
        max: 1,
        step: 0.02,
        defaultValue: 0.16,
        hidden: (props) => props.interactionMode !== "Scrub",
    },
    startAt: {
        type: ControlType.Number,
        title: "Start at",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
    },
    resetOnLeave: {
        type: ControlType.Boolean,
        title: "Reset on Leave",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => props.interactionMode !== "Scrub",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 0,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
})
