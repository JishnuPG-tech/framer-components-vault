import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useScroll, useTransform } from "framer-motion"

// User request: Update the pinned 3×3 grid animation so the center image grows to exactly fill the inset grid area by progress 1, while surrounding images move fully off-screen and fade.

interface GalleryImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface GridMetrics {
    width: number
    height: number
    cellWidth: number
    cellHeight: number
}

interface MyComponentProps {
    images: GalleryImage[]
    video?: string
    poster?: GalleryImage
    playThreshold: number
    stagger: number
    easing: "Linear" | "Ease Out" | "Ease In-Out"
    enableSound: boolean
    restartOnReplay: boolean
    gap: number
    padding: number
    radius: number
    pinDistance: number
    backgroundColor: string
    style?: CSSProperties
}

const defaultImages: GalleryImage[] = [
    {
        src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "Modern luxury villa exterior",
    },
    {
        src: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "Contemporary house under blue sky",
    },
    {
        src: "https://images.unsplash.com/photo-1613977257363-707ba9348227?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "Villa swimming pool",
    },
    {
        src: "https://images.unsplash.com/photo-1780257562963-3389a4105371?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "Spacious modern living room",
    },
    {
        src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "Luxury home with pool at dusk",
    },
    {
        src: "https://images.unsplash.com/photo-1776362355123-ca966d36e29c?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "Luxurious living room with large windows",
    },
    {
        src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "White modern villa",
    },
    {
        src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "Elegant beige interior",
    },
    {
        src: "https://images.unsplash.com/photo-1706808849780-7a04fbac83ef?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600",
        alt: "Modern house with pool and lounge chairs",
    },
]

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollGallery(props: MyComponentProps) {
    const {
        images = defaultImages,
        video,
        poster,
        playThreshold = 0.75,
        stagger = 0,
        easing = "Linear",
        enableSound = false,
        restartOnReplay = false,
        gap = 30,
        padding = 30,
        radius = 16,
        pinDistance = 300,
        backgroundColor = "#0a0a0a",
        style,
    } = props

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const gridRef = useRef<HTMLDivElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const playbackRafRef = useRef<number | null>(null)
    const playbackTokenRef = useRef(0)
    const lastAboveThresholdRef = useRef<boolean | null>(null)
    const isStatic = useIsStaticRenderer()
    const { scrollYProgress } = useScroll({
        target: wrapperRef,
        offset: ["start start", "end end"],
    })
    const transformedProgress = useTransform(scrollYProgress, [0, 1], [0, 1])
    const [progress, setProgress] = useState(0)
    const [gridMetrics, setGridMetrics] = useState<GridMetrics>({
        width: 0,
        height: 0,
        cellWidth: 0,
        cellHeight: 0,
    })
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [isMuted, setIsMuted] = useState(true)

    const galleryImages = useMemo(() => {
        if (!images || images.length === 0) return defaultImages
        return images
    }, [images])

    useEffect(() => {
        if (isStatic) return
        const unsubscribe = transformedProgress.on("change", (latest) => {
            startTransition(() => setProgress(latest))
        })
        return () => unsubscribe()
    }, [isStatic, transformedProgress])

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const updatePreference = () => {
            startTransition(() => setPrefersReducedMotion(mediaQuery.matches))
        }
        updatePreference()
        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", updatePreference)
            return () => mediaQuery.removeEventListener("change", updatePreference)
        }
        mediaQuery.addListener(updatePreference)
        return () => mediaQuery.removeListener(updatePreference)
    }, [])

    const measureGrid = useCallback(() => {
        const element = gridRef.current
        if (!element) return

        const rect = element.getBoundingClientRect()
        const nextWidth = rect.width
        const nextHeight = rect.height
        const nextCellWidth = Math.max(0, (nextWidth - 2 * gap) / 3)
        const nextCellHeight = Math.max(0, (nextHeight - 2 * gap) / 3)
        startTransition(() => {
            setGridMetrics((prev) => {
                if (
                    prev.width === nextWidth &&
                    prev.height === nextHeight &&
                    prev.cellWidth === nextCellWidth &&
                    prev.cellHeight === nextCellHeight
                ) {
                    return prev
                }
                return {
                    width: nextWidth,
                    height: nextHeight,
                    cellWidth: nextCellWidth,
                    cellHeight: nextCellHeight,
                }
            })
            setProgress(transformedProgress.get())
        })
    }, [gap, transformedProgress])

    useLayoutEffect(() => {
        measureGrid()
    }, [measureGrid])

    useEffect(() => {
        const element = gridRef.current
        if (!element) return

        let resizeRaf = 0
        const scheduleMeasure = () => {
            if (typeof window === "undefined") return
            if (resizeRaf) {
                window.cancelAnimationFrame(resizeRaf)
            }
            resizeRaf = window.requestAnimationFrame(() => {
                resizeRaf = 0
                measureGrid()
            })
        }

        scheduleMeasure()

        if (typeof window !== "undefined" && typeof ResizeObserver !== "undefined") {
            const resizeObserver = new ResizeObserver(() => {
                scheduleMeasure()
            })
            resizeObserver.observe(element)
            window.addEventListener("resize", scheduleMeasure)
            window.addEventListener("orientationchange", scheduleMeasure)
            if (window.visualViewport) {
                window.visualViewport.addEventListener("resize", scheduleMeasure)
            }
            return () => {
                if (resizeRaf) window.cancelAnimationFrame(resizeRaf)
                resizeObserver.disconnect()
                window.removeEventListener("resize", scheduleMeasure)
                window.removeEventListener("orientationchange", scheduleMeasure)
                if (window.visualViewport) {
                    window.visualViewport.removeEventListener("resize", scheduleMeasure)
                }
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("resize", scheduleMeasure)
            window.addEventListener("orientationchange", scheduleMeasure)
            if (window.visualViewport) {
                window.visualViewport.addEventListener("resize", scheduleMeasure)
            }
            return () => {
                if (resizeRaf) window.cancelAnimationFrame(resizeRaf)
                window.removeEventListener("resize", scheduleMeasure)
                window.removeEventListener("orientationchange", scheduleMeasure)
                if (window.visualViewport) {
                    window.visualViewport.removeEventListener("resize", scheduleMeasure)
                }
            }
        }
    }, [measureGrid, padding])

    const renderImages = useMemo(() => galleryImages.slice(0, 9), [galleryImages])
    const centerIndex = useMemo(() => Math.floor(renderImages.length / 2), [renderImages.length])
    const centerRow = useMemo(() => Math.floor(centerIndex / 3), [centerIndex])
    const centerCol = useMemo(() => centerIndex % 3, [centerIndex])
    const clampedProgress = useMemo(() => Math.max(0, Math.min(1, isStatic ? 0 : progress)), [isStatic, progress])
    const animationProgress = useMemo(() => {
        if (easing === "Ease Out") return 1 - Math.pow(1 - clampedProgress, 3)
        if (easing === "Ease In-Out") {
            if (clampedProgress < 0.5) return 4 * clampedProgress * clampedProgress * clampedProgress
            return 1 - Math.pow(-2 * clampedProgress + 2, 3) / 2
        }
        return clampedProgress
    }, [clampedProgress, easing])

    const getImageStyle = useCallback(
        (index: number): CSSProperties => {
            const row = Math.floor(index / 3)
            const col = index % 3
            const deltaRow = row - centerRow
            const deltaCol = col - centerCol

            if (index === centerIndex) {
                return {
                    opacity: 0,
                    zIndex: 1,
                }
            }

            const distance = Math.abs(deltaRow) + Math.abs(deltaCol)
            const delay = Math.max(0, Math.min(stagger * Math.max(distance - 1, 0), 0.95))
            const localProgress = delay >= 1 ? 1 : Math.max(0, Math.min(1, (animationProgress - delay) / (1 - delay)))
            const startLeft = col * (gridMetrics.cellWidth + gap)
            const startTop = row * (gridMetrics.cellHeight + gap)
            const safeCellWidth = gridMetrics.cellWidth || 1
            const safeCellHeight = gridMetrics.cellHeight || 1
            const scaleXTarget = gridMetrics.width / safeCellWidth
            const scaleYTarget = gridMetrics.height / safeCellHeight
            const currentScaleX = 1 + (scaleXTarget - 1) * localProgress
            const currentScaleY = 1 + (scaleYTarget - 1) * localProgress

            const finalLeft = deltaCol * (gridMetrics.width + gap)
            const finalTop = deltaRow * (gridMetrics.height + gap)
            const moveX = (finalLeft - startLeft) * localProgress
            const moveY = (finalTop - startTop) * localProgress

            return {
                transformOrigin: "top left",
                transform: `translate3d(${moveX}px, ${moveY}px, 0px) scale(${currentScaleX}, ${currentScaleY})`,
                opacity: 1 - localProgress,
                zIndex: 10,
            }
        },
        [animationProgress, centerCol, centerIndex, centerRow, gap, gridMetrics.cellHeight, gridMetrics.cellWidth, gridMetrics.height, gridMetrics.width, stagger]
    )

    const centerOverlayStyle = useMemo((): CSSProperties => {
        if (renderImages.length === 0) return { display: "none" }

        const startLeft = centerCol * (gridMetrics.cellWidth + gap)
        const startTop = centerRow * (gridMetrics.cellHeight + gap)
        const startWidth = gridMetrics.cellWidth
        const startHeight = gridMetrics.cellHeight
        const targetLeft = 0
        const targetTop = 0
        const targetWidth = gridMetrics.width
        const targetHeight = gridMetrics.height
        const currentLeft = startLeft + (targetLeft - startLeft) * animationProgress
        const currentTop = startTop + (targetTop - startTop) * animationProgress
        const currentWidth = startWidth + (targetWidth - startWidth) * animationProgress
        const currentHeight = startHeight + (targetHeight - startHeight) * animationProgress

        return {
            position: "absolute",
            left: currentLeft,
            top: currentTop,
            width: currentWidth,
            height: currentHeight,
            borderRadius: radius,
            overflow: "hidden",
            zIndex: 40,
            opacity: 1,
            willChange: "left, top, width, height",
            pointerEvents: "none",
        }
    }, [animationProgress, centerCol, centerRow, gap, gridMetrics.cellHeight, gridMetrics.cellWidth, gridMetrics.height, gridMetrics.width, radius, renderImages.length])

    const centerImage = renderImages[centerIndex]
    const hasVideo = typeof video === "string" && video.trim().length > 0
    const posterSrc = poster?.src
    const overlayLeft = (centerOverlayStyle.left as number) || 0
    const overlayTop = (centerOverlayStyle.top as number) || 0
    const soundButtonOpacity = useMemo(() => {
        if (!enableSound || !hasVideo || isStatic) return 0
        return Math.max(0, Math.min(1, (clampedProgress - playThreshold) / 0.1))
    }, [clampedProgress, enableSound, hasVideo, isStatic, playThreshold])

    const cancelPlaybackRamp = useCallback(() => {
        if (playbackRafRef.current !== null && typeof window !== "undefined") {
            window.cancelAnimationFrame(playbackRafRef.current)
        }
        playbackRafRef.current = null
        playbackTokenRef.current += 1
    }, [])

    const rampPlaybackRate = useCallback(
        (targetRate: number, durationMs: number, onComplete?: () => void) => {
            const videoElement = videoRef.current
            if (!videoElement || typeof window === "undefined") {
                onComplete?.()
                return
            }

            cancelPlaybackRamp()
            const localToken = playbackTokenRef.current
            const startRate = Number.isFinite(videoElement.playbackRate) ? videoElement.playbackRate : 1
            const startTime = window.performance.now()

            const step = (now: number) => {
                if (localToken !== playbackTokenRef.current) return
                const elapsed = now - startTime
                const t = Math.min(1, elapsed / durationMs)
                videoElement.playbackRate = startRate + (targetRate - startRate) * t

                if (t < 1) {
                    playbackRafRef.current = window.requestAnimationFrame(step)
                } else {
                    playbackRafRef.current = null
                    onComplete?.()
                }
            }

            playbackRafRef.current = window.requestAnimationFrame(step)
        },
        [cancelPlaybackRamp]
    )

    useEffect(() => {
        return () => {
            cancelPlaybackRamp()
        }
    }, [cancelPlaybackRamp])

    useEffect(() => {
        const videoElement = videoRef.current
        if (!videoElement) return
        videoElement.muted = isMuted
    }, [isMuted])

    useEffect(() => {
        if (!enableSound) {
            startTransition(() => setIsMuted(true))
        }
    }, [enableSound])

    useEffect(() => {
        const videoElement = videoRef.current
        if (!videoElement) {
            lastAboveThresholdRef.current = null
            return
        }

        if (!hasVideo) {
            cancelPlaybackRamp()
            videoElement.pause()
            videoElement.playbackRate = 1
            lastAboveThresholdRef.current = null
            return
        }

        if (isStatic) {
            cancelPlaybackRamp()
            videoElement.pause()
            videoElement.playbackRate = 1
            if (videoElement.currentTime !== 0) {
                videoElement.currentTime = 0
            }
            lastAboveThresholdRef.current = null
            return
        }

        const handleThresholdChange = (rawProgress: number) => {
            const boundedProgress = Math.max(0, Math.min(1, rawProgress))
            const isAbove = boundedProgress >= playThreshold

            if (lastAboveThresholdRef.current === isAbove) return
            lastAboveThresholdRef.current = isAbove

            if (isAbove) {
                cancelPlaybackRamp()
                if (videoElement.paused) {
                    videoElement.playbackRate = 0.25
                }
                const playPromise = videoElement.play()
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(() => {})
                }
                if (prefersReducedMotion) {
                    videoElement.playbackRate = 1
                } else {
                    rampPlaybackRate(1, 600)
                }
            } else {
                cancelPlaybackRamp()
                videoElement.pause()
                videoElement.playbackRate = 1
                if (restartOnReplay) {
                    videoElement.currentTime = 0
                }
            }
        }

        handleThresholdChange(transformedProgress.get())
        const unsubscribe = transformedProgress.on("change", handleThresholdChange)
        return () => unsubscribe()
    }, [cancelPlaybackRamp, hasVideo, isStatic, playThreshold, prefersReducedMotion, rampPlaybackRate, restartOnReplay, transformedProgress])

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                width: "100%",
                height: `${pinDistance}vh`,
                ...style,
            }}
        >
            <section
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    height: "100svh",
                    minHeight: "100vh",
                    overflow: "hidden",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    ref={gridRef}
                    style={{
                        display: "grid",
                        position: "absolute",
                        inset: padding,
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gridTemplateRows: "repeat(3, 1fr)",
                        gap,
                    }}
                >
                    {renderImages.map((image, index) => (
                        <motion.div
                            key={`${image?.src ?? "image"}-${index}`}
                            style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                borderRadius: radius,
                                overflow: "hidden",
                                willChange: "transform, opacity",
                                ...getImageStyle(index),
                            }}
                        >
                            <img
                                {...image}
                                alt={image?.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </motion.div>
                    ))}
                    {centerImage ? (
                        <motion.div style={centerOverlayStyle}>
                            <img
                                {...centerImage}
                                alt={centerImage?.alt || ""}
                                style={{
                                    position: "absolute",
                                    left: -overlayLeft,
                                    top: -overlayTop,
                                    width: gridMetrics.width,
                                    height: gridMetrics.height,
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                            {!isStatic && hasVideo ? (
                                <video
                                    ref={videoRef}
                                    src={video}
                                    muted={isMuted}
                                    loop
                                    playsInline
                                    preload="metadata"
                                    poster={posterSrc}
                                    style={{
                                        position: "absolute",
                                        left: -overlayLeft,
                                        top: -overlayTop,
                                        width: gridMetrics.width,
                                        height: gridMetrics.height,
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : null}
                        </motion.div>
                    ) : null}
                </div>
                {enableSound && hasVideo && !isStatic ? (
                    <button
                        type="button"
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                        onClick={() => {
                            startTransition(() => setIsMuted((prev) => !prev))
                        }}
                        style={{
                            position: "absolute",
                            right: 24,
                            bottom: 24,
                            width: 44,
                            height: 44,
                            border: "none",
                            borderRadius: "999px",
                            background: "rgba(0, 0, 0, 0.55)",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            opacity: soundButtonOpacity,
                            transition: "opacity 200ms ease",
                            pointerEvents: soundButtonOpacity > 0 ? "auto" : "none",
                            zIndex: 60,
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M4 10v4h4l5 4V6L8 10H4Z"
                                fill="currentColor"
                            />
                            {isMuted ? (
                                <>
                                    <path d="M16 9l5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </>
                            ) : (
                                <>
                                    <path d="M16 8c1.5 1.2 2.5 2.5 2.5 4s-1 2.8-2.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M18.5 5.5c2.3 1.9 3.5 4.1 3.5 6.5s-1.2 4.6-3.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </>
                            )}
                        </svg>
                    </button>
                ) : null}
            </section>
        </div>
    )
}

addPropertyControls(ScrollGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        defaultValue: defaultImages,
        control: {
            type: ControlType.ResponsiveImage,
        },
    },
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    poster: {
        type: ControlType.ResponsiveImage,
        title: "Poster",
    },
    playThreshold: {
        type: ControlType.Number,
        title: "Play Threshold",
        defaultValue: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "Linear",
        options: ["Linear", "Ease Out", "Ease In-Out"],
        optionTitles: ["Linear", "Ease Out", "Ease In-Out"],
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0,
        min: 0,
        max: 0.3,
        step: 0.01,
    },
    enableSound: {
        type: ControlType.Boolean,
        title: "Enable Sound",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    restartOnReplay: {
        type: ControlType.Boolean,
        title: "Restart Replay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 30,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 30,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    pinDistance: {
        type: ControlType.Number,
        title: "Pin Distance",
        defaultValue: 300,
        min: 150,
        max: 600,
        step: 1,
        unit: "vh",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
    },
})