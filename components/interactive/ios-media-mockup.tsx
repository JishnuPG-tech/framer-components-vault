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

import { useInView } from "framer-motion"

function extractYouTubeId(url: string): string | null {
    if (!url) return null
    try {
        // Support: https://youtu.be/ID, https://www.youtube.com/watch?v=ID, https://www.youtube.com/embed/ID, https://www.youtube.com/shorts/ID
        const u = new URL(url)
        const host = u.hostname.replace(/^www\./, "")

        if (host === "youtu.be") {
            const id = u.pathname.split("/").filter(Boolean)[0]
            return id || null
        }

        if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
            const v = u.searchParams.get("v")
            if (v) return v

            const parts = u.pathname.split("/").filter(Boolean)
            const embedIndex = parts.indexOf("embed")
            if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1]

            const shortsIndex = parts.indexOf("shorts")
            if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1]
        }
    } catch {
        return null
    }

    return null
}

function getYouTubeEmbedUrl(id: string, opts: { autoplay: boolean; loop: boolean; muted: boolean }): string {
    const params = new URLSearchParams()
    params.set("playsinline", "1")
    params.set("controls", "0")
    params.set("rel", "0")
    params.set("modestbranding", "1")
    params.set("autoplay", opts.autoplay ? "1" : "0")
    params.set("mute", opts.muted ? "1" : "0")

    if (opts.loop) {
        params.set("loop", "1")
        // YouTube requires playlist for looping a single video
        params.set("playlist", id)
    } else {
        params.set("loop", "0")
    }

    return `https://www.youtube.com/embed/${id}?${params.toString()}`
}

type MediaType = "image" | "video"
type FitMode = "cover" | "contain"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type Props = {
    mediaType: MediaType
    image?: ResponsiveImage
    thumbnail?: ResponsiveImage
    videoFile: string

    fit: FitMode

    borderRadius: number
    borderThickness: number

    deviceColor: string
    screenColor: string

    showNotch: boolean
    notchHeight: number
    notchWidth: number

    autoplay: boolean
    loop: boolean
    muted: boolean

    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 740
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MinimalIPhoneMockup(props: Props) {
    const {
        mediaType = "video",
        image: imageProp,
        thumbnail: thumbnailProp,
        videoFile = "volcano.mp4",

        fit = "cover",

        borderRadius = 60,
        borderThickness = 12,

        deviceColor = "#000000",
        screenColor = "#000000",

        showNotch = true,
        notchHeight = 34,
        notchWidth = 150,

        autoplay = false,
        loop = true,
        muted = true,

        style,
    } = props

    const videoSrc = mediaType === "video" ? videoFile : videoFile
    const youTubeId = React.useMemo(() => extractYouTubeId(videoSrc), [videoSrc])

    const image: ResponsiveImage | null =
        (mediaType === "video" ? thumbnailProp ?? imageProp : imageProp) ?? null

    const hasUploadedImage = !!imageProp?.src
    const hasUploadedThumbnail = !!thumbnailProp?.src

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const isInView = useInView(containerRef, { amount: 0.2 })

    const [videoPoster, setVideoPoster] = React.useState<string | null>(null)
    const [isVideoReady, setIsVideoReady] = React.useState(false)
    const [isPausedByUser, setIsPausedByUser] = React.useState(!autoplay)

    const videoRef = React.useRef<HTMLVideoElement | null>(null)

    React.useEffect(() => {
        if (mediaType !== "video") return
        if (isStatic) return
        // If autoplay is turned off, start (and remain) in paused mode until the user clicks.
        if (!autoplay) {
            React.startTransition(() => setIsPausedByUser(true))
            return
        }
        // If autoplay is turned on, ensure the video can start playing.
        React.startTransition(() => setIsPausedByUser(false))
    }, [autoplay, isStatic, mediaType])

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (mediaType !== "video") return
        if (!videoSrc) return
        if (youTubeId) return

        // Reset user pause state when changing source/type
        if (autoplay) {
            React.startTransition(() => setIsPausedByUser(false))
        }

        let cancelled = false

        React.startTransition(() => {
            setVideoPoster(null)
            setIsVideoReady(false)
        })

        const video = document.createElement("video")
        video.muted = true
        video.playsInline = true
        video.preload = "metadata"
        ;(video as any).crossOrigin = "anonymous"
        video.src = videoSrc

        const cleanup = () => {
            try {
                video.pause()
                video.src = ""
                video.load()
            } catch {}
        }

        const onLoadedData = async () => {
            try {
                const seekTo = Math.min(0.01, Number.isFinite(video.duration) ? Math.max(0, video.duration / 1000) : 0.01)
                video.currentTime = seekTo
            } catch {
                // ignore
            }
        }

        const onSeeked = () => {
            try {
                const w = video.videoWidth
                const h = video.videoHeight
                if (!w || !h) return

                const canvas = document.createElement("canvas")
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext("2d")
                if (!ctx) return
                ctx.drawImage(video, 0, 0, w, h)
                const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
                if (cancelled) return
                React.startTransition(() => setVideoPoster(dataUrl))
            } catch {
                // Likely CORS; fallback to provided image
            } finally {
                cleanup()
            }
        }

        video.addEventListener("loadeddata", onLoadedData)
        video.addEventListener("seeked", onSeeked)
        video.addEventListener("error", cleanup)

        return () => {
            cancelled = true
            video.removeEventListener("loadeddata", onLoadedData)
            video.removeEventListener("seeked", onSeeked)
            video.removeEventListener("error", cleanup)
            cleanup()
        }
    }, [autoplay, isStatic, mediaType, videoSrc])

    const isFixedWidth = !!style && style.width === "100%"
    const isFixedHeight = !!style && style.height === "100%"

    const BASE_W = 360
    const BASE_H = 740

    const [fitSize, setFitSize] = React.useState<{ w: number; h: number } | null>(null)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        const el = containerRef.current
        const update = () => {
            const rect = el.getBoundingClientRect()
            const cw = rect.width
            const ch = rect.height
            if (!cw || !ch) return

            React.startTransition(() => setFitSize({ w: cw, h: ch }))
        }

        update()

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => update())
            ro.observe(el)
        } else {
            window.addEventListener("resize", update)
        }

        return () => {
            if (ro) ro.disconnect()
            else window.removeEventListener("resize", update)
        }
    }, [])

    const scale = React.useMemo(() => {
        if (!fitSize) return 1
        const sx = fitSize.w / BASE_W
        const sy = fitSize.h / BASE_H
        const s = Math.min(sx, sy)
        return Number.isFinite(s) && s > 0 ? s : 1
    }, [fitSize])

    const scaledBorderRadius = Math.max(0, borderRadius * scale)
    const scaledBorderThickness = Math.max(0, borderThickness * scale)
    const scaledNotchHeight = Math.max(0, notchHeight * scale)
    const scaledNotchWidth = Math.max(0, notchWidth * scale)

    const outerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        boxSizing: "border-box",
        padding: 0,
        ...(isFixedWidth ? null : { minWidth: 240 }),
        ...(isFixedHeight ? null : { minHeight: 480 }),
        ...style,
    }

    const deviceStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: scaledBorderRadius,
        background: deviceColor,
        overflow: "hidden",
    }

    const deviceOuterStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: scaledBorderRadius,
        background: "transparent",
        filter: "none",
        willChange: undefined,
        overflow: "visible",
    }

    const screenInset = scaledBorderThickness
    const screenStyle: React.CSSProperties = {
        position: "absolute",
        left: screenInset,
        right: screenInset,
        top: screenInset,
        bottom: screenInset,
        borderRadius: Math.max(0, scaledBorderRadius - screenInset),
        background: screenColor,
        overflow: "hidden",
    }

    const mediaCommon: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit,
        display: "block",
    }

    const shouldPlayVideo = !isStatic && isInView && !isPausedByUser

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (mediaType !== "video") return
        if (!videoSrc) return
        if (youTubeId) return

        const el = videoRef.current
        if (!el) return

        if (shouldPlayVideo) {
            window.requestAnimationFrame(() => {
                try {
                    el.muted = muted
                    el.playsInline = true
                    const p = el.play()
                    if (p && typeof (p as any).catch === "function") {
                        ;(p as any).catch(() => {})
                    }
                } catch {}
            })
        } else {
            // Pause when leaving view or when user paused
            if (!isPausedByUser) {
                try {
                    el.pause()
                } catch {}
            }
        }
    }, [autoplay, isInView, isPausedByUser, isStatic, mediaType, muted, videoSrc, shouldPlayVideo])

    return (
        <div ref={containerRef} style={outerStyle} aria-label="iPhone mockup">
            <div style={deviceOuterStyle}>
                <div style={deviceStyle}>
                    <div style={screenStyle} role="img" aria-label={image?.alt || "Screen"}>
                        {mediaType === "image" && image?.src && (
                            <img
                                src={image.src}
                                srcSet={image.srcSet}
                                alt={image.alt || "Screen media"}
                                style={mediaCommon}
                                draggable={false}
                            />
                        )}

                        {mediaType === "video" && (
                            <>
                                {!isStatic && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            zIndex: 5,
                                            cursor: "pointer",
                                        }}
                                        role="button"
                                        aria-label={isPausedByUser ? "Play video" : "Pause video"}
                                        tabIndex={0}
                                        onClick={() => {
                                            const el = videoRef.current
                                            if (!el) return

                                            if (isPausedByUser) {
                                                el.play().catch(() => {})
                                                React.startTransition(() => setIsPausedByUser(false))
                                            } else {
                                                el.pause()
                                                React.startTransition(() => setIsPausedByUser(true))
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return
                                            e.preventDefault()
                                            const el = videoRef.current
                                            if (!el) return

                                            if (isPausedByUser) {
                                                el.play().catch(() => {})
                                                React.startTransition(() => setIsPausedByUser(false))
                                            } else {
                                                el.pause()
                                                React.startTransition(() => setIsPausedByUser(true))
                                            }
                                        }}
                                    />
                                )}

                                {!isStatic && isPausedByUser && (
                                    <div
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 6,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 74,
                                                height: 74,
                                                borderRadius: 999,
                                                background: "rgba(255,255,255,0.8)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <svg
                                                width="40"
                                                height="40"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path d="M9 7.5V16.5L16.5 12L9 7.5Z" fill="#000000" />
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                {isStatic ? (
                                    hasUploadedThumbnail ? (
                                        <img
                                            src={image?.src}
                                            srcSet={image?.srcSet}
                                            alt={image?.alt || "Video preview"}
                                            style={mediaCommon}
                                            draggable={false}
                                        />
                                    ) : (
                                        <video
                                            key={videoSrc}
                                            src={videoSrc}
                                            style={mediaCommon}
                                            muted={muted}
                                            playsInline
                                            loop={loop}
                                            controls={false}
                                            autoPlay={false}
                                            preload="metadata"
                                            aria-label={image?.alt || "Video"}
                                        />
                                    )
                                ) : (
                                    <>
                                        {!isVideoReady && (videoPoster || ((hasUploadedThumbnail || hasUploadedImage) ? image?.src : null)) && (
                                            <img
                                                src={videoPoster || image?.src}
                                                srcSet={image?.srcSet}
                                                alt={image?.alt || "Video preview"}
                                                style={mediaCommon}
                                                draggable={false}
                                            />
                                        )}
                                        <video
                                            ref={videoRef}
                                            key={videoSrc}
                                            src={videoSrc}
                                            poster={videoPoster || ((hasUploadedThumbnail || hasUploadedImage) ? image?.src : undefined)}
                                            style={mediaCommon}
                                            muted={muted}
                                            playsInline
                                            loop={loop}
                                            controls={false}
                                            autoPlay={shouldPlayVideo}
                                            preload="metadata"
                                            aria-label={image?.alt || "Video"}
                                            onLoadedData={() => {
                                                React.startTransition(() => setIsVideoReady(true))
                                            }}
                                            onPlay={() => {
                                                if (isPausedByUser) React.startTransition(() => setIsPausedByUser(false))
                                            }}
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {showNotch && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: 20,
                                width: scaledNotchWidth,
                                height: scaledNotchHeight,
                                transform: "translateX(-50%)",
                                background: deviceColor,
                                borderRadius: Math.max(0, 16 * scale),
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(MinimalIPhoneMockup, {
    mediaType: {
        type: ControlType.Enum,
        title: "Media",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "video",
        displaySegmentedControl: true,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: ({ mediaType }) => mediaType !== "image",
    },
    videoFile: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ mediaType }) => mediaType !== "video",
    },
    thumbnail: {
        type: ControlType.ResponsiveImage,
        title: "Thumbnail",
        hidden: ({ mediaType }) => mediaType !== "video",
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ mediaType }) => mediaType !== "video",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ mediaType }) => mediaType !== "video",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ mediaType }) => mediaType !== "video",
    },

    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },

    deviceColor: {
        type: ControlType.Color,
        title: "Device",
        defaultValue: "#000000",
    },

    screenColor: {
        type: ControlType.Color,
        title: "Screen",
        defaultValue: "#000000",
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 60,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },

    borderThickness: {
        type: ControlType.Number,
        title: "Border Thickness",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    showNotch: {
        type: ControlType.Boolean,
        title: "Notch",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    notchHeight: {
        type: ControlType.Number,
        title: "Notch Height",
        defaultValue: 34,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ showNotch }) => !showNotch,
    },
    notchWidth: {
        type: ControlType.Number,
        title: "Notch Width",
        defaultValue: 150,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        hidden: ({ showNotch }) => !showNotch,
    },
})