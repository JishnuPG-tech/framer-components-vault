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

type MediaKind = "image" | "video"

type ResponsiveImg = { src: string; srcSet?: string; alt?: string }

type StoryItem = {
    kind: MediaKind
    image?: ResponsiveImg
    videoFile?: string
    durationMs: number
    caption?: string
}

type Story = {
    id: string
    title: string
    time: string
    image?: ResponsiveImg
    items: StoryItem[]
    ctaLabel?: string
    ctaLink?: string
}

interface Props {
    stories: Story[]

    animation: {
        enabled: boolean
        overlayDuration: number
        cardDuration: number
        mediaDuration: number
        preset: "smooth" | "snappy" | "linear"
    }

    background: string
    nameSeenText: string
    nameUnseenText: string
    ringSeen: string
    ringUnseenA: string
    ringUnseenB: string
    ringUnseenC: string
    overlayBg: string

    progressTrack: string
    progressFill: string

    thumbShadow: string

    controlIcon: string

    likeActive: string

    usernameFont: any
    timeFont: any
    storyNameFont: any
    ctaFont: any
    captionFont: any

    thumbSize: number
    stripPadding: number
    thumbGap: number

    storyCardRadius: number

    holdToPauseMs: number
    fallbackImageDurationMs: number
    fallbackVideoDurationMs: number

    enableKeyboard: boolean
    enableAutoplayVideo: boolean
    zoomEnabled: boolean
}

/**
 * Instructions:
 * Create a Framer component that follows the Framer component rules and achieves the user's goal.
 * Goal: Create a “Framer Story” component by using this code.
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function FramerStory(props: Props) {
    const isStatic = useIsStaticRenderer()

    const {
        stories: storiesProp,
        background,
        nameSeenText,
        nameUnseenText,
        ringSeen,
        ringUnseenA,
        ringUnseenB,
        ringUnseenC,
        overlayBg,
        progressTrack,
        progressFill,
        thumbShadow,
        controlIcon,
        likeActive,
        usernameFont,
        timeFont,
        storyNameFont,
        ctaFont,
        captionFont,
        thumbSize,
        stripPadding,
        thumbGap,
        storyCardRadius,
        holdToPauseMs,
        fallbackImageDurationMs,
        fallbackVideoDurationMs,
        enableKeyboard,
        enableAutoplayVideo,
        zoomEnabled,
        animation,
    } = props

    const [stories, setStories] = React.useState<Story[]>(() => normalizeStories(storiesProp, fallbackImageDurationMs, fallbackVideoDurationMs))

    const animationPreset = animation?.preset ?? "smooth"
    const animationEnabled = animation?.enabled ?? true

    const easing = React.useMemo(() => {
        if (animationPreset === "linear") return [0, 0, 1, 1] as [number, number, number, number]
        if (animationPreset === "snappy") return [0.34, 1.56, 0.64, 1] as [number, number, number, number]
        return [0.16, 1, 0.3, 1] as [number, number, number, number]
    }, [animationPreset])

    const overlayDuration = Math.max(0, animation?.overlayDuration ?? 1.2)
    const cardDuration = Math.max(0, animation?.cardDuration ?? 1.2)
    const mediaDuration = Math.max(0, animation?.mediaDuration ?? 1.2)

    React.useEffect(() => {
        // keep "seen" state locally; only replace if ids changed
        const next = normalizeStories(storiesProp, fallbackImageDurationMs, fallbackVideoDurationMs)
        const prevById = new Map(stories.map((s) => [s.id, s]))
        const merged = next.map((s) => {
            const prev = prevById.get(s.id)
            return prev ? { ...s, items: s.items, image: s.image, title: s.title, time: s.time } : s
        })
        React.startTransition(() => setStories(merged))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storiesProp, fallbackImageDurationMs, fallbackVideoDurationMs])

    const [isOpen, setIsOpen] = React.useState(false)
    const [storyIdx, setStoryIdx] = React.useState(0)
    const [itemIdx, setItemIdx] = React.useState(0)
    const [isManualPaused, setIsManualPaused] = React.useState(false)
    const [liked, setLiked] = React.useState(false)
    const [mediaLoaded, setMediaLoaded] = React.useState(false)
    const [bgLoaded, setBgLoaded] = React.useState(false)

    // Keep a ref in sync so RAF loop can read the latest value without stale closures
    const isManualPausedRef = React.useRef(false)
    React.useEffect(() => {
        isManualPausedRef.current = isManualPaused
    }, [isManualPaused])

    React.useEffect(() => {
        // Reset fade-in state on story/item change
        React.startTransition(() => setMediaLoaded(false))
    }, [storyIdx, itemIdx])

    const overlayRef = React.useRef<HTMLDivElement | null>(null)
    const cardRef = React.useRef<HTMLDivElement | null>(null)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)

    const barsRef = React.useRef<Array<HTMLDivElement | null>>([])
    const rafRef = React.useRef<number | null>(null)
    const startTimeRef = React.useRef<number>(0)
    const pausedAtRef = React.useRef<number>(0)
    const currentDurationRef = React.useRef<number>(fallbackImageDurationMs)

    const holdTimeoutRef = React.useRef<number | null>(null)
    const isHoldingRef = React.useRef(false)
    const holdActivatedRef = React.useRef(false)

    const [isHolding, setIsHolding] = React.useState(false)

    const currentStory = stories[Math.max(0, Math.min(stories.length - 1, storyIdx))]
    const currentItem = currentStory?.items?.[Math.max(0, Math.min((currentStory?.items?.length ?? 1) - 1, itemIdx))]

    const activeCaption = currentItem?.caption

    const stopRaf = React.useCallback(() => {
        if (rafRef.current != null && typeof window !== "undefined") {
            window.cancelAnimationFrame(rafRef.current)
        }
        rafRef.current = null
    }, [])

    const pauseVideo = React.useCallback(() => {
        const v = videoRef.current
        if (v) v.pause()
    }, [])

    const resumeVideo = React.useCallback(() => {
        const v = videoRef.current
        if (!v) return
        const p = v.play()
        if (p && typeof (p as any).catch === "function") {
            ;(p as any).catch(() => {
                try {
                    v.muted = true
                    v.play()
                } catch {}
            })
        }
    }, [])

    const resetLike = React.useCallback(() => {
        React.startTransition(() => setLiked(false))
    }, [])

    const setSeenForStory = React.useCallback((id: string) => {
        React.startTransition(() => {
            setStories((prev) => prev.map((s) => (s.id === id ? { ...s, seen: true } : s)) as any)
        })
    }, [])

    const updateBarsImmediate = React.useCallback((progress01: number) => {
        const s = currentStory
        if (!s) return
        for (let i = 0; i < s.items.length; i++) {
            const el = barsRef.current[i]
            if (!el) continue
            let width = 0
            if (i < itemIdx) width = 100
            else if (i === itemIdx) width = Math.max(0, Math.min(100, progress01 * 100))
            else width = 0
            el.style.width = `${width}%`
        }
    }, [currentStory, itemIdx])

    const startTimer = React.useCallback((durationMs: number) => {
        if (isStatic) return
        stopRaf()

        currentDurationRef.current = Math.max(250, durationMs || fallbackImageDurationMs)
        startTimeRef.current = Date.now()
        pausedAtRef.current = 0
        updateBarsImmediate(0)

        const loop = () => {
            const holding = isHoldingRef.current
            const manualPaused = isManualPausedRef.current

            if (holding || manualPaused) {
                if (pausedAtRef.current === 0) pausedAtRef.current = Date.now()
                rafRef.current = requestAnimationFrame(loop)
                return
            }

            if (pausedAtRef.current > 0) {
                startTimeRef.current += Date.now() - pausedAtRef.current
                pausedAtRef.current = 0
            }

            const elapsed = Date.now() - startTimeRef.current
            const progress = Math.min(1, elapsed / currentDurationRef.current)
            updateBarsImmediate(progress)

            if (progress >= 1) {
                // next slide without rerenders for timer
                nextSlide()
                return
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
    }, [fallbackImageDurationMs, isStatic, stopRaf, updateBarsImmediate])

    const closeStory = React.useCallback(() => {
        stopRaf()
        pauseVideo()
        React.startTransition(() => {
            setIsOpen(false)
            setIsManualPaused(false)
        })
        resetLike()
    }, [pauseVideo, resetLike, stopRaf])

    const openStory = React.useCallback(
        (idx: number) => {
            if (isStatic) return
            const safeIdx = Math.max(0, Math.min(stories.length - 1, idx))
            const s = stories[safeIdx]
            if (!s) return

            stopRaf()

            React.startTransition(() => {
                setIsOpen(true)
                setStoryIdx(safeIdx)
                setItemIdx(0)
                setIsManualPaused(false)
            })

            setSeenForStory(s.id)
            resetLike()
        },
        [isStatic, resetLike, setSeenForStory, stopRaf, stories]
    )

    const loadCurrentItem = React.useCallback(() => {
        stopRaf()
        holdActivatedRef.current = false
        isHoldingRef.current = false
        pausedAtRef.current = 0

        if (!currentStory || !currentItem) return

        // reset bars to proper completed state for previous items, current to 0
        if (typeof window !== "undefined") {
            requestAnimationFrame(() => updateBarsImmediate(0))
        }

        // If image, start timer on load; if video, start on metadata, using duration if available
        if (currentItem.kind === "image") {
            const imageDurationSec = Math.max(0.8, (currentItem.durationMs || fallbackImageDurationMs) / 1000)
            startTimer(currentItem.durationMs || fallbackImageDurationMs)
        } else {
            // timer starts on metadata (or error fallback)
            // handled in <video> events
        }
    }, [currentItem, currentStory, fallbackImageDurationMs, startTimer, stopRaf, updateBarsImmediate])

    React.useEffect(() => {
        if (!isOpen) return
        loadCurrentItem()
    }, [isOpen, storyIdx, itemIdx, loadCurrentItem])

    const nextSlide = React.useCallback(() => {
        if (!currentStory) return

        // finish current bar
        const currentBar = barsRef.current[itemIdx]
        if (currentBar) currentBar.style.width = "100%"

        const isLastItem = itemIdx >= currentStory.items.length - 1
        const isLastStory = storyIdx >= stories.length - 1

        if (!isLastItem) {
            React.startTransition(() => setItemIdx((v) => v + 1))
            return
        }
        if (!isLastStory) {
            const nextStory = stories[storyIdx + 1]
            if (nextStory) setSeenForStory(nextStory.id)
            resetLike()
            React.startTransition(() => {
                setStoryIdx((v) => v + 1)
                setItemIdx(0)
            })
            return
        }

        closeStory()
    }, [closeStory, currentStory, itemIdx, resetLike, setSeenForStory, stories, storyIdx])

    const prevSlide = React.useCallback(() => {
        if (!currentStory) return

        // clear current bar
        const currentBar = barsRef.current[itemIdx]
        if (currentBar) currentBar.style.width = "0%"

        if (itemIdx > 0) {
            React.startTransition(() => setItemIdx((v) => Math.max(0, v - 1)))
            return
        }

        if (storyIdx > 0) {
            const prevStory = stories[storyIdx - 1]
            if (!prevStory) return
            resetLike()
            React.startTransition(() => {
                setStoryIdx((v) => Math.max(0, v - 1))
                setItemIdx(prevStory.items.length - 1)
            })
            return
        }

        React.startTransition(() => setItemIdx(0))
    }, [currentStory, itemIdx, resetLike, stories, storyIdx])

    const togglePlayPause = React.useCallback(() => {
        React.startTransition(() => setIsManualPaused((v) => !v))
    }, [])

    React.useEffect(() => {
        if (!isOpen) return
        if (isManualPaused) pauseVideo()
        else if (!isHoldingRef.current) resumeVideo()
    }, [isManualPaused, isOpen, pauseVideo, resumeVideo])

    React.useEffect(() => {
        if (!enableKeyboard) return
        if (isStatic) return
        if (typeof window === "undefined") return

        const onKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return
            if (e.key === "Escape") closeStory()
            if (e.key === "ArrowRight") nextSlide()
            if (e.key === "ArrowLeft") prevSlide()
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault()
                togglePlayPause()
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [closeStory, enableKeyboard, isOpen, isStatic, nextSlide, prevSlide, togglePlayPause])

    React.useEffect(() => {
        return () => {
            stopRaf()
            if (holdTimeoutRef.current != null && typeof window !== "undefined") {
                window.clearTimeout(holdTimeoutRef.current)
            }
        }
    }, [stopRaf])

    const handleHoldStart = React.useCallback(() => {
        if (isStatic) return
        if (!isOpen) return

        isHoldingRef.current = true
        holdActivatedRef.current = false
        React.startTransition(() => setIsHolding(true))

        if (holdTimeoutRef.current != null && typeof window !== "undefined") {
            window.clearTimeout(holdTimeoutRef.current)
        }

        if (typeof window !== "undefined") {
            holdTimeoutRef.current = window.setTimeout(() => {
                holdActivatedRef.current = true
                if (cardRef.current) {
                    cardRef.current.style.transition = "scale 0.18s cubic-bezier(0.16,1,0.3,1)"
                    ;(cardRef.current.style as any).scale = "0.98"
                }
                pauseVideo()
            }, Math.max(0, holdToPauseMs)) as unknown as number
        }
    }, [holdToPauseMs, isOpen, isStatic, pauseVideo])

    const handleHoldEnd = React.useCallback(
        (isRightSide: boolean) => {
            if (isStatic) return
            if (!isOpen) return

            if (holdTimeoutRef.current != null && typeof window !== "undefined") {
                window.clearTimeout(holdTimeoutRef.current)
                holdTimeoutRef.current = null
            }

            if (cardRef.current) {
                cardRef.current.style.transition = "scale 0.18s cubic-bezier(0.16,1,0.3,1)"
                ;(cardRef.current.style as any).scale = "1"
            }
            const activated = holdActivatedRef.current

            if (isHoldingRef.current && activated) {
                // release from hold: resume if not manually paused
                if (!isManualPaused) resumeVideo()
            } else {
                // treat as tap
                if (!isManualPaused) {
                    if (isRightSide) nextSlide()
                    else prevSlide()
                }
            }

            isHoldingRef.current = false
            holdActivatedRef.current = false
            React.startTransition(() => setIsHolding(false))
        },
        [isManualPaused, isOpen, isStatic, nextSlide, prevSlide, resumeVideo]
    )

    const ringBackground = React.useCallback(
        (seen?: boolean) => {
            if (seen) return ringSeen
            return `linear-gradient(135deg, ${ringUnseenA}, ${ringUnseenB}, ${ringUnseenC})`
        },
        [ringSeen, ringUnseenA, ringUnseenB, ringUnseenC]
    )

    const canShowOverlay = RenderTarget.current() !== RenderTarget.thumbnail

    const activeBgSrc = React.useMemo(() => {
        if (!currentItem) return ""
        if (currentItem.kind === "image") return currentItem.image?.src || defaultImages.image3.src
        return currentItem.image?.src || currentStory?.image?.src || defaultImages.image3.src
    }, [currentItem, currentStory])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!activeBgSrc) {
            React.startTransition(() => setBgLoaded(true))
            return
        }
        React.startTransition(() => setBgLoaded(false))
        try {
            const img = new Image()
            img.decoding = "async"
            img.onload = () => React.startTransition(() => setBgLoaded(true))
            img.onerror = () => React.startTransition(() => setBgLoaded(true))
            img.src = activeBgSrc
        } catch {
            React.startTransition(() => setBgLoaded(true))
        }
    }, [activeBgSrc])

    const mediaNode = React.useMemo(() => {
        if (!currentItem) return null

        const mediaKey = `media-${storyIdx}-${itemIdx}`

        if (currentItem.kind === "image") {
            const img = currentItem.image?.src ? currentItem.image : undefined
            const src = img?.src || defaultImages.image3.src
            const alt = img?.alt || "Story image"
            const srcSet = img?.srcSet

            const imageDurationSec = Math.max(0.8, (currentItem.durationMs || fallbackImageDurationMs) / 1000)

            return (
                <motion.div
                    key={mediaKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: mediaLoaded ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                    transition={animationEnabled ? { duration: 0.35, ease: easing } : { duration: 0 }}
                    style={{ width: "100%", height: "100%" }}
                >
                    <img
                        className="fs-media-img"
                        src={src}
                        srcSet={srcSet}
                        alt={alt}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: mediaLoaded ? 1 : 0,
                            transition: "opacity 0.35s ease",
                            transform: "translateZ(0)",
                            willChange: "transform",
                            ...(zoomEnabled
                                ? {
                                      animationDuration: `${imageDurationSec}s`,
                                      animationPlayState: isManualPaused || isHolding ? ("paused" as const) : ("running" as const),
                                  }
                                : {
                                      animationName: "none",
                                  }),
                            display: "block",
                        }}
                        onLoad={() => {
                            if (isStatic) return
                            React.startTransition(() => setMediaLoaded(true))
                            startTimer(currentItem.durationMs || fallbackImageDurationMs)
                        }}
                        onError={() => {
                            if (isStatic) return
                            React.startTransition(() => setMediaLoaded(true))
                        }}
                    />
                </motion.div>
            )
        }

        const vsrc = currentItem.videoFile || defaultVideo
        return (
            <motion.div
                key={mediaKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: mediaLoaded ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={animationEnabled ? { duration: 0.35, ease: easing } : { duration: 0 }}
                style={{ width: "100%", height: "100%" }}
            >
                <video
                    ref={(n) => {
                        videoRef.current = n
                    }}
                    src={vsrc}
                    preload="metadata"
                    playsInline
                    controls={false}
                    muted={!enableAutoplayVideo}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transform: "translateZ(0)",
                    }}
                    onLoadedMetadata={(e) => {
                        if (isStatic) return
                        React.startTransition(() => setMediaLoaded(true))
                        const el = e.currentTarget
                        const d = Number.isFinite(el.duration) && el.duration > 0 ? el.duration * 1000 : fallbackVideoDurationMs
                        startTimer(d)
                        if (!isManualPaused && !isHoldingRef.current && enableAutoplayVideo) {
                            const p = el.play()
                            if (p && typeof (p as any).catch === "function") {
                                ;(p as any).catch(() => {
                                    try {
                                        el.muted = true
                                        el.play()
                                    } catch {}
                                })
                            }
                        }
                    }}
                    onError={() => {
                        if (isStatic) return
                        nextSlide()
                    }}
                />
            </motion.div>
        )
    }, [
        currentItem,
        enableAutoplayVideo,
        fallbackImageDurationMs,
        fallbackVideoDurationMs,
        isManualPaused,
        isStatic,
        itemIdx,
        nextSlide,
        startTimer,
        storyIdx,
        animationEnabled,
        easing,
        mediaDuration,
        zoomEnabled,
        mediaLoaded,
    ])

    const onLike = React.useCallback(() => {
        React.startTransition(() => setLiked((v) => !v))
        if (!liked) {
            // burst via class
            if (typeof window !== "undefined") {
                const el = document.getElementById("framer-story-heart-wrap")
                if (el) {
                    el.classList.remove("fs-heart-burst")
                    // reflow
                    void (el as any).offsetWidth
                    el.classList.add("fs-heart-burst")
                    window.setTimeout(() => el.classList.remove("fs-heart-burst"), 350)
                }
            }
        }
    }, [liked])

    const activeCtaLabel = currentStory?.ctaLabel
    const activeCtaLink = currentStory?.ctaLink

    const prefetchImage = React.useCallback((src?: string) => {
        if (!src) return
        if (typeof window === "undefined") return
        try {
            const img = new Image()
            img.decoding = "async"
            img.loading = "eager"
            img.src = src
        } catch {}
    }, [])

    React.useEffect(() => {
        if (!isOpen) return
        if (!currentStory) return

        // Prefetch current + next media to reduce click/next lag
        prefetchImage(currentStory.image?.src)
        if (currentItem?.kind === "image") prefetchImage(currentItem.image?.src)
        else prefetchImage(currentItem?.image?.src)

        const nextItem = currentStory.items?.[itemIdx + 1]
        if (nextItem?.kind === "image") prefetchImage(nextItem.image?.src)
        else prefetchImage(nextItem?.image?.src)
    }, [currentItem, currentStory, isOpen, itemIdx, prefetchImage])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingTop: 0,
                overflow: "visible",
                WebkitFontSmoothing: "antialiased",
                userSelect: "none",
                fontFamily: "Inter Display, Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            }}
        >
            <style>{css}</style>

            <div
                className="fs-no-scrollbar"
                style={{
                    width: "100%",
                    maxWidth: 560,
                    paddingLeft: stripPadding,
                    paddingRight: stripPadding,
                    display: "flex",
                    gap: thumbGap,
                    overflow: "visible",
                    paddingBottom: 2,
                    alignItems: "flex-start",
                }}
                aria-label="Stories"
                role="list"
            >
                {stories.map((s, idx) => {
                    const image = s.image?.src ? s.image : defaultImages.image1
                    return (
                        <button
                            key={s.id || idx}
                            type="button"
                            onClick={() => openStory(idx)}
                            style={{
                                appearance: "none",
                                border: "none",
                                padding: 0,
                                background: "transparent",
                                cursor: isStatic ? "default" : "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 10,
                                flexShrink: 0,
                                pointerEvents: isStatic ? "none" : "auto",
                            }}
                            role="listitem"
                            aria-label={`Open story by ${s.title}`}
                        >
                            <div
                                className="fs-thumb-ring"
                                style={{
                                    width: thumbSize + 10,
                                    height: thumbSize + 10,
                                    padding: 3,
                                    borderRadius: 999,
                                    background: ringBackground((s as any).seen),
                                    boxShadow: thumbShadow,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        padding: 2,
                                        borderRadius: 999,
                                        background: "rgba(255,255,255,0.92)",
                                    }}
                                >
                                    <img
                                        src={image.src}
                                        srcSet={image.srcSet}
                                        alt={image.alt || `${s.title} image`}
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: 999,
                                            objectFit: "cover",
                                            display: "block",
                                            border: "1px solid rgba(0,0,0,0.05)",
                                        }}
                                    />
                                </div>
                            </div>
                            <div
                                title={s.title}
                                style={{
                                    ...storyNameFont,
                                    maxWidth: Math.max(72, thumbSize + 12),
                                    color: (s as any).seen ? nameSeenText : nameUnseenText,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {s.title}
                            </div>
                        </button>
                    )
                })}
            </div>

            {canShowOverlay && (
                <AnimatePresence>
                    {isOpen && currentStory && currentItem && (
                        <motion.div
                            ref={overlayRef}
                            className="fs-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={animationEnabled ? { duration: overlayDuration, ease: easing } : { duration: 0 }}
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 50,
                                background: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Story viewer"
                            onMouseDown={(e) => {
                                // click outside closes
                                if (e.target === overlayRef.current) closeStory()
                            }}
                        >
                            <motion.div
                                key={activeBgSrc || "bg"}
                                aria-hidden="true"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: bgLoaded ? 1 : 0 }}
                                exit={{ opacity: 0 }}
                                transition={animationEnabled ? { duration: overlayDuration, ease: easing } : { duration: 0 }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundImage: activeBgSrc ? `url(${activeBgSrc})` : undefined,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    filter: "blur(28px)",
                                    transform: "scale(1.1)",
                                    willChange: "opacity, transform",
                                }}
                            />
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0,0,0,0.5)",
                                    opacity: 0.5,
                                }}
                            />

                            <motion.div
                                ref={cardRef}
                                className="fs-card"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={animationEnabled ? { duration: cardDuration, ease: easing } : { duration: 0 }}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "95%",
                                    maxWidth: 400,
                                    maxHeight: "95%",
                                    borderRadius: storyCardRadius,
                                    overflow: "hidden",
                                    background: "#0b0b0c",
                                    boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
                                    outline: "1px solid rgba(255,255,255,0.10)",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "#0b0b0c",
                                    }}
                                >
                                    {mediaNode}
                                </div>

                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        height: 160,
                                        background: "linear-gradient(to bottom, rgba(0,0,0,0.60), rgba(0,0,0,0.18), rgba(0,0,0,0))",
                                        pointerEvents: "none",
                                        zIndex: 10,
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: 240,
                                        background: "linear-gradient(to top, rgba(0,0,0,0.80), rgba(0,0,0,0.35), rgba(0,0,0,0))",
                                        pointerEvents: "none",
                                        zIndex: 10,
                                    }}
                                />

                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 20,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        padding: 18,
                                        paddingTop: 14,
                                        paddingBottom: 18,
                                        pointerEvents: "none",
                                    }}
                                >
                                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20, pointerEvents: "auto", paddingLeft: 2, paddingRight: 2 }}>
                                        <div style={{ display: "flex", gap: 6, height: 4, width: "100%" }}>
                                            {currentStory.items.map((_, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        flex: 1,
                                                        background: progressTrack,
                                                        borderRadius: 999,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        ref={(n) => {
                                                            barsRef.current[i] = n
                                                        }}
                                                        style={{
                                                            height: "100%",
                                                            width: i < itemIdx ? "100%" : "0%",
                                                            background: progressFill,
                                                            borderRadius: 999,
                                                            boxShadow: "0 0 10px rgba(255,255,255,0.25)",
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 2, paddingRight: 2 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ position: "relative" }}>
                                                    <div
                                                        style={{
                                                            position: "absolute",
                                                            inset: 0,
                                                            borderRadius: 999,
                                                            background: "rgba(255,255,255,0.18)",
                                                            backdropFilter: "blur(8px)",
                                                        }}
                                                    />
                                                    <img
                                                        src={(currentStory.image?.src || defaultImages.image1.src) as string}
                                                        alt={currentStory.image?.alt || "User"}
                                                        loading="lazy"
                                                        decoding="async"
                                                        style={{
                                                            position: "relative",
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 999,
                                                            objectFit: "cover",
                                                            border: "1px solid rgba(255,255,255,0.15)",
                                                            display: "block",
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                                    <div style={{ ...usernameFont, color: "#fff", textShadow: "0 1px 10px rgba(0,0,0,0.25)" }}>
                                                        {currentStory.title}
                                                    </div>
                                                    <div style={{ ...timeFont, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>{currentStory.time}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        togglePlayPause()
                                                    }}
                                                    className="fs-icon-btn"
                                                    style={controlButtonStyle(controlIcon)}
                                                    aria-label={isManualPaused ? "Play" : "Pause"}
                                                >
                                                    {isManualPaused ? <IconPlay color={controlIcon} /> : <IconPause color={controlIcon} />}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        closeStory()
                                                    }}
                                                    className="fs-icon-btn"
                                                    style={controlButtonStyle(controlIcon)}
                                                    aria-label="Close story"
                                                >
                                                    <IconX color={controlIcon} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto", paddingLeft: 2, paddingRight: 2 }}>
                                        {activeCaption && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    left: 20,
                                                    right: 20,
                                                    bottom: activeCtaLink ? 90 : 20,
                                                    zIndex: 25,
                                                    pointerEvents: "none",
                                                    color: "rgba(255,255,255,0.92)",
                                                    textShadow: "0 1px 12px rgba(0,0,0,0.35)",
                                                    ...captionFont,
                                                    textWrap: "balance" as any,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {activeCaption}
                                                </div>
                                            </div>
                                        )}
                                        {activeCtaLink && (
                                            <a
                                                href={activeCtaLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    flex: 1,
                                                    height: 48,
                                                    borderRadius: 999,
                                                    background: "rgba(255,255,255,0.10)",
                                                    backdropFilter: "blur(14px)",
                                                    border: "1px solid rgba(255,255,255,0.10)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 10,
                                                    color: "#fff",
                                                    textDecoration: "none",
                                                    position: "relative",
                                                    overflow: "hidden",
                                                    transform: "translateZ(0)",
                                                }}
                                                aria-label="Visit link"
                                            >
                                                <div className="fs-cta-shimmer" />
                                                <span style={{ ...ctaFont, color: "#fff" }}>{activeCtaLabel || "Visit Link"}</span>
                                                <span style={{ opacity: 0.72, display: "inline-flex" }}>
                                                    <IconArrowUpRight color="currentColor" />
                                                </span>
                                            </a>
                                        )}

                                        <button
                                            type="button"
                                            id="like-btn"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onLike()
                                            }}
                                            className="fs-icon-btn"
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 999,
                                                background: liked ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.20)",
                                                backdropFilter: "blur(14px)",
                                                border: liked ? "1px solid rgba(239,68,68,0.22)" : "1px solid rgba(255,255,255,0.10)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: liked ? likeActive : "#fff",
                                                cursor: "pointer",
                                                transform: "translateZ(0)",
                                            }}
                                            aria-pressed={liked}
                                            aria-label={liked ? "Unlike" : "Like"}
                                        >
                                            <span id="framer-story-heart-wrap" style={{ display: "inline-flex", transformOrigin: "50% 50%" }}>
                                                <IconHeart color={liked ? likeActive : "#fff"} filled={liked} />
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 15,
                                        display: "flex",
                                    }}
                                    onPointerLeave={() => {
                                        if (!isHoldingRef.current) return
                                        isHoldingRef.current = false
                                        holdActivatedRef.current = false
                                        if (cardRef.current) {
                                            cardRef.current.style.transition = "scale 0.18s cubic-bezier(0.16, 1, 0.3, 1)"
                                            ;(cardRef.current.style as any).scale = "1"
                                        }
                                        if (!isManualPaused) resumeVideo()
                                    }}
                                >
                                    <div
                                        style={{ width: "33.333%", height: "100%" }}
                                        onPointerDown={(e) => {
                                            e.stopPropagation()
                                            ;(e.currentTarget as any).setPointerCapture?.((e as any).pointerId)
                                            handleHoldStart()
                                        }}
                                        onPointerUp={(e) => {
                                            e.stopPropagation()
                                            handleHoldEnd(false)
                                        }}
                                        onPointerCancel={(e) => {
                                            e.stopPropagation()
                                            handleHoldEnd(false)
                                        }}
                                        aria-label="Previous"
                                        role="button"
                                    />
                                    <div
                                        style={{ width: "66.666%", height: "100%" }}
                                        onPointerDown={(e) => {
                                            e.stopPropagation()
                                            ;(e.currentTarget as any).setPointerCapture?.((e as any).pointerId)
                                            handleHoldStart()
                                        }}
                                        onPointerUp={(e) => {
                                            e.stopPropagation()
                                            handleHoldEnd(true)
                                        }}
                                        onPointerCancel={(e) => {
                                            e.stopPropagation()
                                            handleHoldEnd(true)
                                        }}
                                        aria-label="Next"
                                        role="button"
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="fs-nav fs-nav-left"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        prevSlide()
                                    }}
                                    aria-label="Previous slide"
                                >
                                    <IconChevronLeft color="#fff" />
                                </button>

                                <button
                                    type="button"
                                    className="fs-nav fs-nav-right"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        nextSlide()
                                    }}
                                    aria-label="Next slide"
                                >
                                    <IconChevronRight color="#fff" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

function normalizeStories(input: Story[], fallbackImageDurationMs: number, fallbackVideoDurationMs: number): any[] {
    const safe = Array.isArray(input) ? input : []
    return safe
        .filter(Boolean)
        .map((s, si) => {
            const id = s.id || `story-${si + 1}`
            const items = (Array.isArray(s.items) ? s.items : []).map((it, ii) => {
                const kind: MediaKind = it.kind === "video" ? "video" : "image"
                const durationMs =
                    typeof it.durationMs === "number" && it.durationMs > 0
                        ? it.durationMs
                        : kind === "video"
                          ? fallbackVideoDurationMs
                          : fallbackImageDurationMs

                return {
                    kind,
                    image: it.image,
                    videoFile: it.videoFile,
                    durationMs,
                    caption: it.caption,
                }
            })
            return {
                id,
                title: (s as any).title || `user_${si + 1}`,
                time: (s as any).time || "1h",
                image: (s as any).image,
                items: items.length ? items : [{ kind: "image", image: defaultImages.image3, durationMs: fallbackImageDurationMs }],
                ctaLabel: s.ctaLabel,
                ctaLink: s.ctaLink,
                seen: (s as any).seen ?? false,
            }
        })
}

function controlButtonStyle(color: string): React.CSSProperties {
    return {
        width: 40,
        height: 40,
        borderRadius: 999,
        background: "rgba(255,255,255,0.20)",
        border: "1px solid rgba(255,255,255,0.10)",
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        pointerEvents: "auto",
        transform: "translateZ(0)",
    }
}

function IconPause({ color = "currentColor" }: { color?: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill={color} />
        </svg>
    )
}

function IconPlay({ color = "currentColor" }: { color?: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l10 6-10 6V6z" fill={color} />
        </svg>
    )
}

function IconX({ color = "currentColor" }: { color?: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    )
}

function IconChevronLeft({ color = "currentColor" }: { color?: string }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6V6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function IconChevronRight({ color = "currentColor" }: { color?: string }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function IconArrowUpRight({ color = "currentColor" }: { color?: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 17L17 7" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 7h7v7" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function IconHeart({ color = "currentColor", filled = false }: { color?: string; filled?: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                fill={filled ? color : "none"}
                stroke={color}
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    )
}

const defaultImages: Record<string, ResponsiveImg> = {
    image1: {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
    image2: {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2 - Purple",
    },
    image3: {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
    image4: {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    image5: {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
}

const defaultVideo = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Display:wght@400;500;600;700&display=swap');\n\n.fs-no-scrollbar::-webkit-scrollbar { display: none; }
.fs-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.fs-thumb-ring { transition: transform 0.28s cubic-bezier(0.16,1,0.3,1); }
.fs-thumb-ring:hover { transform: scale(1.05); }

+.fs-icon-btn {
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
  will-change: transform;
}

.fs-icon-btn:hover {
  background: rgba(255,255,255,0.26) !important;
  border-color: rgba(255,255,255,0.16) !important;
  transform: translateZ(0) scale(1.05);
}

.fs-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(255,255,255,0.20);
  border: 1px solid rgba(255,255,255,0.10);
  color: white;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  pointer-events: auto;
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, background 0.2s ease;
}
.fs-nav:hover { background: rgba(255,255,255,0.26); transform: translateY(-50%) scale(1.05); }
.fs-nav-left { left: 14px; }
.fs-nav-right { right: 14px; }

@media (min-width: 768px) {
  .fs-nav { display: inline-flex; }
}

.fs-cta-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.06), rgba(255,255,255,0));
  transform: translateX(-100%);
  transition: transform 0.7s ease;
  pointer-events: none;
}
a:hover .fs-cta-shimmer { transform: translateX(100%); }

@keyframes fs-heart-burst {
  0% { transform: scale(1); }
  50% { transform: scale(1.35); }
  100% { transform: scale(1); }
}
.fs-heart-burst { animation: fs-heart-burst 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }

@keyframes fs-media-zoom {
  0% { transform: scale(1) translateZ(0); }
  50% { transform: scale(1.06) translateZ(0); }
  100% { transform: scale(1) translateZ(0); }
}
.fs-media-img {
  animation-name: fs-media-zoom;
  animation-timing-function: ease-in-out;
  animation-fill-mode: both;
  animation-iteration-count: 1;
}

.fs-overlay { padding: 0; }

.fs-card {
  height: 95%;
  max-height: 95%;
  max-width: 400px;
}

@media (max-width: 767px) {
  .fs-card {
    max-width: 100% !important;
    max-height: 100% !important;
    width: 100% !important;
    height: 100% !important;
    border-radius: 0px !important;
  }
}

@media (min-width: 768px) {
  .fs-overlay { padding: 20px; }
}

.fs-heart-burst { animation: fs-heart-burst 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
`

addPropertyControls(FramerStory, {
    stories: {
        type: ControlType.Array,
        title: "Stories",
        maxCount: 12,
        defaultValue: [
            {
                id: "user1",
                title: "alex.design",
                time: "2h",
                image: defaultImages.image1,
                ctaLabel: "Visit Link",
                ctaLink: "https://example.com",
                items: [
                    { kind: "image", image: defaultImages.image4, durationMs: 5000, videoFile: defaultVideo, caption: "A quick look at our latest work." },
                    { kind: "video", videoFile: defaultVideo, durationMs: 0, image: defaultImages.image3, caption: "Behind the scenes — tap to pause." },
                    { kind: "image", image: defaultImages.image2, durationMs: 4000, videoFile: defaultVideo, caption: "Final result with details and texture." },
                ],
            },
            {
                id: "user2",
                title: "sarah_studio",
                time: "4h",
                image: defaultImages.image5,
                ctaLabel: "Visit Link",
                ctaLink: "https://example.com",
                items: [
                    { kind: "image", image: defaultImages.image1, durationMs: 5000, videoFile: defaultVideo, caption: "Moodboard inspiration." },
                    { kind: "video", videoFile: defaultVideo, durationMs: 0, image: defaultImages.image2, caption: "Process clip." },
                ],
            },
            {
                id: "user3",
                title: "urban_minimal",
                time: "6h",
                image: defaultImages.image2,
                ctaLabel: "Visit Link",
                ctaLink: "https://example.com",
                items: [{ kind: "image", image: defaultImages.image3, durationMs: 5000, videoFile: defaultVideo }],
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                // Removed manual userId option; story IDs are generated automatically.
                title: { type: ControlType.String, title: "Title", defaultValue: "alex.design" },
                time: { type: ControlType.String, title: "Time", defaultValue: "2h" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "Visit Link" },
                ctaLink: { type: ControlType.Link, title: "CTA Link", defaultValue: "https://example.com" },
                items: {
                    type: ControlType.Array,
                    title: "Items",
                    maxCount: 20,
                    defaultValue: [{ kind: "image", image: defaultImages.image3, durationMs: 5000, videoFile: defaultVideo, caption: "Add a caption for this story item…" }],
                    control: {
                        type: ControlType.Object,
                        controls: {
                            kind: {
                                type: ControlType.Enum,
                                title: "Kind",
                                options: ["image", "video"],
                                optionTitles: ["Image", "Video"],
                                defaultValue: "image",
                                displaySegmentedControl: true,
                            },
                            image: { type: ControlType.ResponsiveImage, title: "Image" },
                            videoFile: {
                                type: ControlType.File,
                                title: "Video",
                                allowedFileTypes: ["mp4", "webm", "mov"],
                            },
                            caption: {
                                type: ControlType.String,
                                title: "Caption",
                                defaultValue: "",
                                placeholder: "Optional caption…",
                                displayTextArea: true,
                            },
                            durationMs: {
                                type: ControlType.Number,
                                title: "Duration",
                                defaultValue: 5000,
                                min: 0,
                                max: 30000,
                                step: 250,
                                unit: "ms",
                            },
                        },
                    },
                },
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        icon: "interaction",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            preset: {
                type: ControlType.Enum,
                title: "Preset",
                options: ["smooth", "snappy", "linear"],
                optionTitles: ["Smooth", "Snappy", "Linear"],
                defaultValue: "smooth",
                hidden: ({ animation }) => animation?.enabled === false,
            },
            overlayDuration: {
                type: ControlType.Number,
                title: "Overlay",
                defaultValue: 1.2,
                min: 0,
                max: 1.5,
                step: 0.05,
                unit: "s",
                hidden: ({ animation }) => animation?.enabled === false,
            },
            cardDuration: {
                type: ControlType.Number,
                title: "Card",
                defaultValue: 1.2,
                min: 0,
                max: 1.5,
                step: 0.05,
                unit: "s",
                hidden: ({ animation }) => animation?.enabled === false,
            },
            mediaDuration: {
                type: ControlType.Number,
                title: "Media",
                defaultValue: 1.2,
                min: 0,
                max: 1.5,
                step: 0.05,
                unit: "s",
                hidden: ({ animation }) => animation?.enabled === false,
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },
    nameUnseenText: {
        type: ControlType.Color,
        title: "Unseen Text",
        defaultValue: "#000000",
    },
    nameSeenText: {
        type: ControlType.Color,
        title: "Seen Text",
        defaultValue: "#CCCCCC",
    },
    ringSeen: {
        type: ControlType.Color,
        title: "Ring Seen",
        defaultValue: "#CCCCCC",
    },
    ringUnseenA: {
        type: ControlType.Color,
        title: "Ring A",
        defaultValue: "#FF0099",
    },
    ringUnseenB: {
        type: ControlType.Color,
        title: "Ring B",
        defaultValue: "#FF00D4",
    },
    ringUnseenC: {
        type: ControlType.Color,
        title: "Ring C",
        defaultValue: "#FFB300",
    },
    overlayBg: {
        type: ControlType.Color,
        title: "Overlay Background",
        defaultValue: "#000000",
    },
    progressTrack: {
        type: ControlType.Color,
        title: "Progress Track",
        defaultValue: "#FFFFFF",
    },
    progressFill: {
        type: ControlType.Color,
        title: "Progress Fill",
        defaultValue: "#FFFFFF",
    },
    thumbShadow: {
        type: ControlType.BoxShadow,
        title: "Thumb Shadow",
        defaultValue: "0 1px 6px rgba(0,0,0,0.08)",
    },
    controlIcon: {
        type: ControlType.Color,
        title: "Control Icon",
        defaultValue: "#FFFFFF",
    },
    likeActive: {
        type: ControlType.Color,
        title: "Like Active Color",
        defaultValue: "#FF004D",
    },
    usernameFont: {
        type: ControlType.Font,
        title: "Username Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "16px", variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1.1em" },
    },
    timeFont: {
        type: ControlType.Font,
        title: "Time Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.1em" },
    },
    storyNameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.1em" },
    },
    ctaFont: {
        type: ControlType.Font,
        title: "CTA Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "16px", variant: "Semibold", letterSpacing: "-0.02em", lineHeight: "1em" },
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "16px", variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.3em" },
    },
    thumbSize: {
        type: ControlType.Number,
        title: "Thumb Size",
        defaultValue: 60,
        min: 36,
        max: 96,
        step: 1,
        unit: "px",
    },
    stripPadding: {
        type: ControlType.Number,
        title: "Strip Padding",
        defaultValue: 8,
        min: 8,
        max: 48,
        step: 1,
        unit: "px",
    },
    thumbGap: {
        type: ControlType.Number,
        title: "Thumb Gap",
        defaultValue: 20,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    storyCardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 32,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    holdToPauseMs: {
        type: ControlType.Number,
        title: "Hold Delay",
        defaultValue: 200,
        min: 0,
        max: 1000,
        step: 10,
        unit: "ms",
    },
    fallbackImageDurationMs: {
        type: ControlType.Number,
        title: "Image Fallback",
        defaultValue: 8000,
        min: 500,
        max: 30000,
        step: 250,
        unit: "ms",
    },
    fallbackVideoDurationMs: {
        type: ControlType.Number,
        title: "Video Fallback",
        defaultValue: 5000,
        min: 500,
        max: 30000,
        step: 250,
        unit: "ms",
    },
    enableKeyboard: {
        type: ControlType.Boolean,
        title: "Keyboard",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableAutoplayVideo: {
        type: ControlType.Boolean,
        title: "Autoplay Video",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    zoomEnabled: {
        type: ControlType.Boolean,
        title: "Auto Zoom",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})