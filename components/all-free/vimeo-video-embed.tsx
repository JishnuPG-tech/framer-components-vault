// @ts-nocheck
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


interface VimeoBackgroundProps {
    vimeoUrl: string
    thumbnail?: string | { src?: string }
    radius: number
    autoplay: boolean
    fadeIn: boolean
    loop: boolean
    muted: boolean
    style?: React.CSSProperties
}

function extractVimeoId(input: string): string | null {
    if (!input) return null
    const match = input.match(
        /vimeo\.com\/(?:.*\/)?(?:video\/)?(\d+)(?:$|\?|#|\/)/i
    )
    if (match && match[1]) return match[1]
    const fallback = input.match(/(\d{6,})/)
    if (fallback && fallback[1]) return fallback[1]
    return null
}

function buildVimeoBackgroundSrc(
    vimeoUrl: string,
    options: {
        autoplay: boolean
        loop: boolean
        muted: boolean
        playerId: string
    }
): string | null {
    const id = extractVimeoId(vimeoUrl)
    if (!id) return null

    const params = new URLSearchParams({
        background: "1",
        autoplay: options.autoplay ? "1" : "0",
        loop: options.loop ? "1" : "0",
        muted: options.autoplay ? "1" : options.muted ? "1" : "0",
        controls: "0",
        title: "0",
        byline: "0",
        portrait: "0",
        playsinline: "1",
        autopause: "0",
        player_id: options.playerId,
    })

    return `https://player.vimeo.com/video/${id}?${params.toString()}`
}

// Shared style object reused across all thumbnail renders (avoids re-allocating
// the same object tree on every render of every image).
const IMG_BASE_STYLE: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
    transform: "translateZ(0)",
    willChange: "opacity",
}

/**
 * Renders the poster image. Handles the Zalo-in-app-webview edge case where a
 * small vumbnail is shown immediately while a larger one loads progressively,
 * without duplicating this JSX in three different places.
 */
function Thumbnail({
    useProgressive,
    standardSrc,
    largeSrc,
    fallbackSrc,
    largeLoaded,
    largeFailed,
    fade,
}: {
    useProgressive: boolean
    standardSrc: string
    largeSrc: string
    fallbackSrc: string
    largeLoaded: boolean
    largeFailed: boolean
    fade: number // target opacity (0 or 1)
}) {
    if (useProgressive) {
        return (
            <>
                {standardSrc && (
                    <img
                        src={standardSrc}
                        alt=""
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        style={{
                            ...IMG_BASE_STYLE,
                            opacity: fade,
                            transition: "opacity 0.2s ease",
                        }}
                    />
                )}
                {largeSrc && (
                    <img
                        src={largeSrc}
                        alt=""
                        loading="eager"
                        fetchPriority="auto"
                        decoding="async"
                        style={{
                            ...IMG_BASE_STYLE,
                            opacity:
                                fade === 0
                                    ? 0
                                    : largeLoaded && !largeFailed
                                      ? 1
                                      : 0,
                            transition: "opacity 0.2s ease",
                        }}
                    />
                )}
            </>
        )
    }

    if (!fallbackSrc) return null
    return (
        <img
            src={fallbackSrc}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            style={{
                ...IMG_BASE_STYLE,
                opacity: fade,
                transition: "opacity 0.2s ease",
            }}
        />
    )
}

/**
 * Vimeo Background
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VimeoVideo(props: VimeoBackgroundProps) {
    const isStaticRenderer = useIsStaticRenderer()
    const placeholderBackground = "#F5F5F5"
    const renderTarget = RenderTarget.current()
    const {
        vimeoUrl,
        thumbnail,
        radius,
        autoplay = true,
        fadeIn = true,
        loop = true,
        muted = true,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null)
    const posterFallbackTimeoutRef = React.useRef<number | null>(null)
    const iframeRevealTimeoutRef = React.useRef<number | null>(null)
    const viewportExitTimeoutRef = React.useRef<number | null>(null)
    const retryTimeoutsRef = React.useRef<number[]>([])
    const rawId = React.useId()
    const playerId = React.useMemo(
        () => rawId.replace(/[^a-zA-Z0-9_-]/g, ""),
        [rawId]
    )
    const [containerAspect, setContainerAspect] = React.useState<number>(
        600 / 400
    )
    const [videoAspect, setVideoAspect] = React.useState<number>(16 / 9)
    const [oEmbedThumbnail, setOEmbedThumbnail] = React.useState<string>("")
    const [videoStarted, setVideoStarted] = React.useState<boolean>(false)
    const [iframeVisible, setIframeVisible] = React.useState<boolean>(false)
    const [showDelayedPoster, setShowDelayedPoster] =
        React.useState<boolean>(false)
    const [iframeErrored, setIframeErrored] = React.useState<boolean>(false)
    const [isNearViewport, setIsNearViewport] = React.useState<boolean>(false)
    const [zaloLargeLoaded, setZaloLargeLoaded] = React.useState<boolean>(false)
    const [zaloLargeFailed, setZaloLargeFailed] = React.useState<boolean>(false)
    const videoStartedRef = React.useRef<boolean>(false)

    const iframeSrc = React.useMemo(
        () =>
            buildVimeoBackgroundSrc(vimeoUrl, {
                autoplay,
                loop,
                muted,
                playerId,
            }),
        [vimeoUrl, autoplay, loop, muted, playerId]
    )
    const videoId = React.useMemo(() => extractVimeoId(vimeoUrl), [vimeoUrl])
    const idThumbnailFallback = React.useMemo(() => {
        if (!videoId) return ""
        return `https://vumbnail.com/${videoId}_large.jpg`
    }, [videoId])
    const idThumbnailFallbackStandard = React.useMemo(() => {
        if (!videoId) return ""
        return `https://vumbnail.com/${videoId}.jpg`
    }, [videoId])
    const thumbnailSrc = React.useMemo(() => {
        if (typeof thumbnail === "string") return thumbnail
        if (
            thumbnail &&
            typeof thumbnail === "object" &&
            typeof thumbnail.src === "string"
        ) {
            return thumbnail.src
        }
        return ""
    }, [thumbnail])

    // Container aspect ratio, used to size the iframe like object-fit: cover.
    React.useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return
        const el = containerRef.current

        const ro = new window.ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const cr = entry.contentRect
            if (cr.height > 0) setContainerAspect(cr.width / cr.height)
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Warm up connections so Vimeo player resources start loading earlier.
    React.useEffect(() => {
        if (typeof document === "undefined" || isStaticRenderer) return

        const hints = [
            { rel: "preconnect", href: "https://player.vimeo.com" },
            { rel: "dns-prefetch", href: "https://player.vimeo.com" },
            { rel: "preconnect", href: "https://i.vimeocdn.com" },
            { rel: "dns-prefetch", href: "https://i.vimeocdn.com" },
            { rel: "preconnect", href: "https://f.vimeocdn.com" },
            { rel: "dns-prefetch", href: "https://f.vimeocdn.com" },
            { rel: "preconnect", href: "https://vumbnail.com" },
            { rel: "dns-prefetch", href: "https://vumbnail.com" },
        ]

        const appended: HTMLLinkElement[] = []
        for (const hint of hints) {
            const selector = `link[rel="${hint.rel}"][href="${hint.href}"]`
            if (document.head.querySelector(selector)) continue
            const link = document.createElement("link")
            link.rel = hint.rel
            link.href = hint.href
            link.crossOrigin = "anonymous"
            document.head.appendChild(link)
            appended.push(link)
        }

        return () => appended.forEach((l) => l.parentNode?.removeChild(l))
    }, [isStaticRenderer])

    React.useEffect(() => setOEmbedThumbnail(""), [vimeoUrl])

    // Detect real video aspect ratio + poster via Vimeo oEmbed (avoids letterboxing).
    React.useEffect(() => {
        const isCanvasLikePreview =
            renderTarget === RenderTarget.thumbnail ||
            renderTarget === RenderTarget.canvas
        const shouldFetchOEmbed =
            isCanvasLikePreview ||
            !autoplay ||
            videoStarted ||
            (!thumbnailSrc && (showDelayedPoster || iframeErrored))

        if (!shouldFetchOEmbed || typeof window === "undefined" || !vimeoUrl) {
            return
        }

        const controller = new AbortController()

        async function run() {
            try {
                const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}&width=1280`
                const res = await fetch(oembedUrl, {
                    signal: controller.signal,
                })
                if (!res.ok) return
                const data = await res.json()
                const w = Number(data?.width)
                const h = Number(data?.height)
                if (
                    typeof data?.thumbnail_url === "string" &&
                    data.thumbnail_url
                ) {
                    setOEmbedThumbnail(data.thumbnail_url)
                }
                if (isFinite(w) && isFinite(h) && w > 0 && h > 0) {
                    setVideoAspect(w / h)
                }
            } catch (_) {
                // ignore
            }
        }

        run()
        return () => controller.abort()
    }, [
        vimeoUrl,
        renderTarget,
        autoplay,
        videoStarted,
        showDelayedPoster,
        iframeErrored,
        thumbnailSrc,
    ])

    // Size the iframe to visually behave like object-fit: cover.
    const coverSize = React.useMemo(() => {
        if (
            !containerAspect ||
            !isFinite(containerAspect) ||
            containerAspect <= 0
        ) {
            return { width: "100%", height: "100%" }
        }
        if (containerAspect > videoAspect) {
            return {
                width: "100%",
                height: `${(containerAspect / videoAspect) * 100}%`,
            }
        }
        return {
            width: `${(videoAspect / containerAspect) * 100}%`,
            height: "100%",
        }
    }, [containerAspect, videoAspect])

    const shouldShowPreview =
        isStaticRenderer ||
        renderTarget === RenderTarget.thumbnail ||
        renderTarget === RenderTarget.canvas
    const shouldShowIdlePreview = !shouldShowPreview && !!iframeSrc && !autoplay
    const shouldMountLiveIframe =
        !shouldShowPreview && !!iframeSrc && autoplay && isNearViewport

    const isZaloWebView = React.useMemo(() => {
        if (typeof navigator === "undefined") return false
        return /zalo|zalotheme|zaloapp/i.test(navigator.userAgent || "")
    }, [])
    const useZaloProgressiveVumbnail = React.useMemo(
        () => isZaloWebView && !thumbnailSrc && !oEmbedThumbnail,
        [isZaloWebView, thumbnailSrc, oEmbedThumbnail]
    )
    const resolvedVumbnailSrc = React.useMemo(() => {
        if (!useZaloProgressiveVumbnail) return idThumbnailFallback
        if (zaloLargeLoaded && !zaloLargeFailed) return idThumbnailFallback
        return idThumbnailFallbackStandard || idThumbnailFallback
    }, [
        useZaloProgressiveVumbnail,
        zaloLargeLoaded,
        zaloLargeFailed,
        idThumbnailFallback,
        idThumbnailFallbackStandard,
    ])
    const previewImageSrc =
        thumbnailSrc || oEmbedThumbnail || resolvedVumbnailSrc

    const isIOSOrInAppWebView = React.useMemo(() => {
        if (typeof navigator === "undefined") return false
        const ua = navigator.userAgent || ""
        return /iPhone|iPad|iPod/i.test(ua) || /FBAN|FBAV|Messenger/i.test(ua)
    }, [])
    const canGestureRecover =
        (isIOSOrInAppWebView || isZaloWebView) && autoplay && !videoStarted

    // Mount the iframe only when the container is near/within the viewport.
    React.useEffect(() => {
        if (typeof window === "undefined" || shouldShowPreview) return
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const initialNear =
            rect.bottom >= -400 && rect.top <= window.innerHeight + 400
        if (initialNear) setIsNearViewport(true)

        if (!("IntersectionObserver" in window)) {
            if (!initialNear) setIsNearViewport(true)
            return
        }

        const observer = new window.IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                if (entry.isIntersecting) {
                    if (viewportExitTimeoutRef.current !== null) {
                        window.clearTimeout(viewportExitTimeoutRef.current)
                        viewportExitTimeoutRef.current = null
                    }
                    setIsNearViewport(true)
                } else {
                    if (viewportExitTimeoutRef.current !== null) {
                        window.clearTimeout(viewportExitTimeoutRef.current)
                    }
                    viewportExitTimeoutRef.current = window.setTimeout(() => {
                        setIsNearViewport(false)
                        viewportExitTimeoutRef.current = null
                    }, 500)
                }
            },
            { root: null, rootMargin: "400px", threshold: 0.01 }
        )
        observer.observe(el)
        return () => {
            observer.disconnect()
            if (viewportExitTimeoutRef.current !== null) {
                window.clearTimeout(viewportExitTimeoutRef.current)
                viewportExitTimeoutRef.current = null
            }
        }
    }, [shouldShowPreview])

    // Progressive large-vumbnail preload for Zalo in-app webview.
    React.useEffect(() => {
        if (!useZaloProgressiveVumbnail) {
            setZaloLargeLoaded(false)
            setZaloLargeFailed(false)
            return
        }
        if (typeof window === "undefined" || !idThumbnailFallback) return

        let canceled = false
        setZaloLargeLoaded(false)
        setZaloLargeFailed(false)
        const img = new window.Image()
        img.onload = () => !canceled && setZaloLargeLoaded(true)
        img.onerror = () => !canceled && setZaloLargeFailed(true)
        img.src = idThumbnailFallback

        return () => {
            canceled = true
        }
    }, [useZaloProgressiveVumbnail, idThumbnailFallback])

    // Preload the poster image so it's ready to paint immediately.
    React.useEffect(() => {
        if (typeof document === "undefined" || isStaticRenderer) return
        const entries: Array<{ href: string; priority: "high" | "auto" }> = []
        if (thumbnailSrc) {
            entries.push({ href: thumbnailSrc, priority: "high" })
        } else if (isZaloWebView) {
            if (idThumbnailFallbackStandard)
                entries.push({
                    href: idThumbnailFallbackStandard,
                    priority: "high",
                })
            if (idThumbnailFallback)
                entries.push({ href: idThumbnailFallback, priority: "auto" })
        } else if (idThumbnailFallback) {
            entries.push({ href: idThumbnailFallback, priority: "high" })
        }
        if (entries.length === 0) return

        const appended: HTMLLinkElement[] = []
        for (const entry of entries) {
            const selector = `link[rel="preload"][as="image"][href="${entry.href}"]`
            if (document.head.querySelector(selector)) continue
            const preload = document.createElement("link")
            preload.rel = "preload"
            preload.as = "image"
            preload.href = entry.href
            preload.setAttribute("fetchpriority", entry.priority)
            document.head.appendChild(preload)
            appended.push(preload)
        }

        return () => appended.forEach((p) => p.parentNode?.removeChild(p))
    }, [
        thumbnailSrc,
        idThumbnailFallback,
        idThumbnailFallbackStandard,
        isZaloWebView,
        isStaticRenderer,
    ])

    // Reset all playback state whenever the source or mount condition changes.
    React.useEffect(() => {
        setVideoStarted(false)
        setIframeVisible(false)
        setShowDelayedPoster(false)
        setIframeErrored(false)
        if (typeof window === "undefined") return
        ;[posterFallbackTimeoutRef, iframeRevealTimeoutRef].forEach((ref) => {
            if (ref.current !== null) {
                window.clearTimeout(ref.current)
                ref.current = null
            }
        })
        retryTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
        retryTimeoutsRef.current = []
    }, [iframeSrc, autoplay, shouldMountLiveIframe])

    // Cleanup all timers on unmount.
    React.useEffect(() => {
        return () => {
            if (typeof window === "undefined") return
            ;[
                posterFallbackTimeoutRef,
                iframeRevealTimeoutRef,
                viewportExitTimeoutRef,
            ].forEach((ref) => {
                if (ref.current !== null) window.clearTimeout(ref.current)
            })
            retryTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
        }
    }, [])

    React.useEffect(() => {
        if (!videoStarted || typeof window === "undefined") return
        if (posterFallbackTimeoutRef.current !== null) {
            window.clearTimeout(posterFallbackTimeoutRef.current)
            posterFallbackTimeoutRef.current = null
        }
        if (iframeRevealTimeoutRef.current !== null) {
            window.clearTimeout(iframeRevealTimeoutRef.current)
            iframeRevealTimeoutRef.current = null
        }
    }, [videoStarted])

    // Listen for Vimeo player postMessage events.
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== "https://player.vimeo.com") return
            const iframeWindow = iframeRef.current?.contentWindow
            if (!iframeWindow || event.source !== iframeWindow) return

            let payload: any = event.data
            if (typeof payload === "string") {
                try {
                    payload = JSON.parse(payload)
                } catch (_) {
                    return
                }
            }
            if (!payload || typeof payload !== "object") return
            if (
                payload.player_id &&
                String(payload.player_id) !== String(playerId)
            )
                return

            const eventName = payload.event
            const seconds =
                typeof payload?.data?.seconds === "number"
                    ? payload.data.seconds
                    : 0

            if (
                eventName === "play" ||
                eventName === "playing" ||
                eventName === "bufferend" ||
                (eventName === "timeupdate" && seconds > 0)
            ) {
                setVideoStarted(true)
                setIframeVisible(true)
                setShowDelayedPoster(false)
                setIframeErrored(false)
            }

            if (eventName === "error") {
                setIframeErrored(true)
                setShowDelayedPoster(true)
            }
        }

        window.addEventListener("message", onMessage)
        return () => window.removeEventListener("message", onMessage)
    }, [playerId])

    const sendVimeoHandshake = React.useCallback(
        (scheduleTimers: boolean) => {
            if (typeof window === "undefined" || !autoplay) return
            const targetWindow = iframeRef.current?.contentWindow
            if (!targetWindow) return

            const post = (payload: Record<string, any>) =>
                targetWindow.postMessage(
                    JSON.stringify(payload),
                    "https://player.vimeo.com"
                )

            const setup = () => {
                post({ method: "addEventListener", value: "play" })
                post({ method: "addEventListener", value: "playing" })
                post({ method: "addEventListener", value: "bufferend" })
                post({ method: "addEventListener", value: "timeupdate" })
                post({ method: "play" })
            }

            setup()
            for (const delay of [60, 180, 360]) {
                retryTimeoutsRef.current.push(window.setTimeout(setup, delay))
            }

            if (scheduleTimers) {
                if (iframeRevealTimeoutRef.current !== null)
                    window.clearTimeout(iframeRevealTimeoutRef.current)
                if (posterFallbackTimeoutRef.current !== null)
                    window.clearTimeout(posterFallbackTimeoutRef.current)

                iframeRevealTimeoutRef.current = window.setTimeout(
                    () => setIframeVisible(true),
                    800
                )
                posterFallbackTimeoutRef.current = window.setTimeout(
                    () => setShowDelayedPoster(true),
                    5000
                )
            }
        },
        [autoplay]
    )

    // Retry playback if the tab was backgrounded/restored (mobile browsers
    // frequently pause background iframes).
    React.useEffect(() => {
        if (typeof document === "undefined" || typeof window === "undefined")
            return
        const retryPlayback = () => {
            if (shouldMountLiveIframe && autoplay) sendVimeoHandshake(false)
        }
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") retryPlayback()
        }
        document.addEventListener("visibilitychange", onVisibilityChange)
        window.addEventListener("pageshow", retryPlayback)
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange)
            window.removeEventListener("pageshow", retryPlayback)
        }
    }, [sendVimeoHandshake, shouldMountLiveIframe, autoplay])

    const handleGestureRecovery = React.useCallback(() => {
        if (
            typeof window === "undefined" ||
            !shouldMountLiveIframe ||
            !autoplay
        )
            return
        const targetWindow = iframeRef.current?.contentWindow
        if (!targetWindow) return

        const post = (payload: Record<string, any>) =>
            targetWindow.postMessage(
                JSON.stringify(payload),
                "https://player.vimeo.com"
            )

        post({ method: "setMuted", value: true })
        post({ method: "play" })

        if (iframeRevealTimeoutRef.current !== null) {
            window.clearTimeout(iframeRevealTimeoutRef.current)
            iframeRevealTimeoutRef.current = null
        }
        iframeRevealTimeoutRef.current = window.setTimeout(
            () => setIframeVisible(true),
            300
        )
    }, [autoplay, shouldMountLiveIframe])

    const posterVisible = !videoStarted
    const iframeOpacity = videoStarted || iframeVisible ? 1 : 0
    // Honor the Fade In toggle for the initial poster → video reveal.
    const iframeTransition = fadeIn
        ? "opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)"
        : "opacity 0s"

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: radius,
                background: "transparent",
            }}
            aria-label="Vimeo background video"
        >
            {shouldMountLiveIframe && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: coverSize.width,
                        height: coverSize.height,
                        transform: "translate(-50%, -50%) translateZ(0)",
                        willChange: "width, height",
                    }}
                >
                    {isZaloWebView && posterVisible && previewImageSrc && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 0,
                                pointerEvents: "none",
                            }}
                        >
                            <Thumbnail
                                useProgressive={useZaloProgressiveVumbnail}
                                standardSrc={idThumbnailFallbackStandard}
                                largeSrc={idThumbnailFallback}
                                fallbackSrc={previewImageSrc}
                                largeLoaded={zaloLargeLoaded}
                                largeFailed={zaloLargeFailed}
                                fade={1}
                            />
                        </div>
                    )}

                    <iframe
                        ref={iframeRef}
                        src={iframeSrc}
                        title="Vimeo background"
                        loading="eager"
                        fetchPriority="high"
                        onLoad={() => sendVimeoHandshake(true)}
                        onError={() => {
                            setIframeErrored(true)
                            setShowDelayedPoster(true)
                        }}
                        frameBorder={0}
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                        allowFullScreen
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            border: 0,
                            pointerEvents: "none",
                            opacity: iframeOpacity,
                            transform: "translateZ(0)",
                            willChange: "opacity",
                            transition: iframeTransition,
                            zIndex: 1,
                        }}
                    />

                    {(showDelayedPoster || iframeErrored) &&
                        previewImageSrc && (
                            <button
                                type="button"
                                disabled={!canGestureRecover}
                                aria-label={
                                    canGestureRecover
                                        ? "Play background video"
                                        : undefined
                                }
                                onClick={
                                    canGestureRecover
                                        ? handleGestureRecovery
                                        : undefined
                                }
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    border: "none",
                                    background: "transparent",
                                    padding: 0,
                                    margin: 0,
                                    cursor: canGestureRecover
                                        ? "pointer"
                                        : "default",
                                    pointerEvents: canGestureRecover
                                        ? "auto"
                                        : "none",
                                    touchAction: canGestureRecover
                                        ? "manipulation"
                                        : "auto",
                                    zIndex: 2,
                                }}
                            >
                                <Thumbnail
                                    useProgressive={useZaloProgressiveVumbnail}
                                    standardSrc={idThumbnailFallbackStandard}
                                    largeSrc={idThumbnailFallback}
                                    fallbackSrc={previewImageSrc}
                                    largeLoaded={zaloLargeLoaded}
                                    largeFailed={zaloLargeFailed}
                                    fade={videoStarted ? 0 : 1}
                                />
                            </button>
                        )}
                </div>
            )}

            {(shouldShowPreview || !iframeSrc || shouldShowIdlePreview) && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: placeholderBackground,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        color: "rgba(0,0,0,0.55)",
                        textAlign: "center",
                        fontSize: 13,
                        fontFamily:
                            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                        lineHeight: "1.35em",
                    }}
                >
                    {previewImageSrc ? (
                        <Thumbnail
                            useProgressive={useZaloProgressiveVumbnail}
                            standardSrc={idThumbnailFallbackStandard}
                            largeSrc={idThumbnailFallback}
                            fallbackSrc={previewImageSrc}
                            largeLoaded={zaloLargeLoaded}
                            largeFailed={zaloLargeFailed}
                            fade={1}
                        />
                    ) : (
                        <span>
                            {iframeSrc
                                ? "Vimeo Video"
                                : "Enter a Vimeo link to display the video"}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

addPropertyControls(VimeoVideo, {
    vimeoUrl: {
        type: ControlType.String,
        title: "URL",
        defaultValue: "https://vimeo.com/1202041540",
        placeholder: "https://vimeo.com/123456789",
    },
    thumbnail: {
        type: ControlType.Image,
        title: "Thumbnail",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        unit: "px",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fadeIn: {
        type: ControlType.Boolean,
        title: "Fade In",
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
    muted: {
        type: ControlType.Boolean,
        title: "Mute",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
