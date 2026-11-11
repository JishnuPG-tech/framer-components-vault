// User instructions: Create a video-only 3D carousel with depth/perspective, horizontal/vertical toggle, scroll/drag/wheel/dot/button navigation, auto-play active video and auto-pause inactive, poster support, in-view detection, customizable card size/spacing/radius/border/shadow, hover zoom + blur-to-clear transitions, counter + dots, support uploaded videos and external URLs, sound on hover + sound toggle icon.

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

import { motion, useInView, useReducedMotion } from "framer-motion"

type Orientation = "horizontal" | "vertical"
type MediaKind = "empty" | "native" | "youtube" | "vimeo" | "unsupported"

type CarouselItem = {
    sourceType: "url" | "upload"
    url: string
    upload: string
    poster?: { src: string; srcSet?: string; alt?: string }
}

interface Props {
    items: CarouselItem[]
    orientation: Orientation

    cardWidth: number
    cardHeight: number
    spacing: number
    depth: number
    perspective: number

    radius: string
    cardBackground: string

    showDots: boolean
    showButtons: boolean

    dotSize: number
    dotGap: number

    arrowSize: number
    arrowIconSize: number
    arrowStrokeWidth: number
    arrowInset: number

    autoAdvance: boolean
    autoAdvanceSeconds: number
    loop: boolean

    mutedDefault: boolean

    uiColor: string
    uiBackground: string

    inactiveBlur: number
    inactiveScale: number
    hoverZoom: number
    inactiveOpacity: number

    transition: any

    style?: React.CSSProperties
}

function clampIndex(i: number, count: number) {
    if (count <= 0) return 0
    return Math.max(0, Math.min(count - 1, i))
}

function wrapIndex(i: number, count: number) {
    if (count <= 0) return 0
    return ((i % count) + count) % count
}

function getItemSrc(item: CarouselItem) {
    if (!item) return ""
    if (item.sourceType === "upload") return item.upload || ""
    return item.url || ""
}

function isTruthyUrl(s: string) {
    return typeof s === "string" && s.trim().length > 0
}

type ResolvedMedia = {
    kind: MediaKind
    src: string
    embedSrc?: string
    providerTitle?: string
}

type ProviderKind = "youtube" | "vimeo"

function safeParseUrl(input: string): URL | null {
    if (!isTruthyUrl(input)) return null
    const trimmed = input.trim()
    try {
        return new URL(trimmed)
    } catch {
        try {
            return new URL(`https://${trimmed}`)
        } catch {
            return null
        }
    }
}

function extractYouTubeId(url: URL): string | null {
    const host = url.hostname.replace(/^www\./i, "").toLowerCase()
    const path = url.pathname
    const parts = path.split("/").filter(Boolean)

    if (host === "youtu.be" && parts[0]) return parts[0]

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
        const v = url.searchParams.get("v")
        if (v) return v

        if (parts[0] === "shorts" && parts[1]) return parts[1]
        if (parts[0] === "embed" && parts[1]) return parts[1]
        if (parts[0] === "live" && parts[1]) return parts[1]
        if (parts[0] === "watch" && parts[1]) return parts[1]
    }

    return null
}

function extractVimeoId(url: URL): string | null {
    const host = url.hostname.replace(/^www\./i, "").toLowerCase()
    const parts = url.pathname.split("/").filter(Boolean)
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null

    for (let i = parts.length - 1; i >= 0; i--) {
        if (/^\d+$/.test(parts[i])) return parts[i]
    }
    return null
}

function looksLikeDirectVideoFile(url: URL): boolean {
    const fullPath = `${url.pathname}${url.search}`.toLowerCase()
    return /\.(mp4|m4v|webm|mov|ogv|ogg)(?:$|[?#&])/i.test(fullPath)
}

function resolveItemMedia(item: CarouselItem): ResolvedMedia {
    const src = getItemSrc(item).trim()
    if (!isTruthyUrl(src)) {
        return { kind: "empty", src: "" }
    }

    if (item.sourceType === "upload") {
        return { kind: "native", src }
    }

    const parsed = safeParseUrl(src)
    if (!parsed) {
        return { kind: "unsupported", src }
    }

    const youtubeId = extractYouTubeId(parsed)
    if (youtubeId) {
        return {
            kind: "youtube",
            src,
            embedSrc: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`,
            providerTitle: "YouTube video",
        }
    }

    const vimeoId = extractVimeoId(parsed)
    if (vimeoId) {
        return {
            kind: "vimeo",
            src,
            embedSrc: `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`,
            providerTitle: "Vimeo video",
        }
    }

    if (looksLikeDirectVideoFile(parsed)) {
        return { kind: "native", src }
    }

    return { kind: "unsupported", src }
}

function toRgba(color: string, alpha: number) {
    const a = Math.max(0, Math.min(1, alpha))
    const c = String(color || "").trim()

    // Handle rgba()/rgb()
    const m = c.match(/^rgba?\(([^)]+)\)$/i)
    if (m) {
        const parts = m[1].split(",").map((p) => p.trim())
        const r = Number(parts[0])
        const g = Number(parts[1])
        const b = Number(parts[2])
        if ([r, g, b].some((n) => Number.isNaN(n))) return c
        return `rgba(${r}, ${g}, ${b}, ${a})`
    }

    // Handle hex
    const hex = c.replace(/^#/, "")
    if (hex.length === 3 || hex.length === 6) {
        const full = hex.length === 3 ? hex.split("").map((ch) => ch + ch).join("") : hex
        const r = parseInt(full.slice(0, 2), 16)
        const g = parseInt(full.slice(2, 4), 16)
        const b = parseInt(full.slice(4, 6), 16)
        if ([r, g, b].some((n) => Number.isNaN(n))) return c
        return `rgba(${r}, ${g}, ${b}, ${a})`
    }

    return c
}

/**
 * Video Carousel
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VideoCarousel(props: Props) {
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const {
        items = [
            {
                sourceType: "url",
                url: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                upload: "",
                poster: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Poster",
                },
            },
            {
                sourceType: "url",
                url: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                upload: "",
                poster: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Poster",
                },
            },
        ],
        orientation = "horizontal",
        cardWidth = 420,
        cardHeight = 260,
        spacing = 74,
        depth = 260,
        perspective = 1000,
        radius = "16px",
        cardBackground = "#000000",
        showDots = true,
        showButtons = true,
        dotSize = 8,
        dotGap = 8,
        arrowSize = 36,
        arrowIconSize = 18,
        arrowStrokeWidth = 2,
        arrowInset = 12,
        autoAdvance = false,
        autoAdvanceSeconds = 4,
        loop = true,
        mutedDefault = true,
        uiColor = "#000000",
        uiBackground = "#FFFFFF",
        inactiveBlur = 10,
        inactiveScale = 0.92,
        hoverZoom = 1.03,
        inactiveOpacity = 1,
        transition,
        style,
    } = props

    const count = items?.length ?? 0

    const containerRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { amount: 0.35 })

    const [active, setActive] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const [muted, setMuted] = React.useState(!!mutedDefault)
    const [nativePlayPrompt, setNativePlayPrompt] = React.useState<Record<number, boolean>>({})
    const [nativeErrors, setNativeErrors] = React.useState<Record<number, string>>({})

    const dragStart = React.useRef<{ x: number; y: number; active: number } | null>(null)

    const videoEls = React.useRef<Array<HTMLVideoElement | null>>([])
    const iframeEls = React.useRef<Array<HTMLIFrameElement | null>>([])
    const activeNativePlayToken = React.useRef(0)
    const resolvedItems = React.useMemo(() => items.map((item) => resolveItemMedia(item)), [items])

    const axis = orientation === "horizontal" ? "x" : "y"

    const setPromptFor = React.useCallback((index: number, value: boolean) => {
        React.startTransition(() => {
            setNativePlayPrompt((prev) => {
                if (prev[index] === value) return prev
                return { ...prev, [index]: value }
            })
        })
    }, [])

    const setErrorFor = React.useCallback((index: number, message: string) => {
        React.startTransition(() => {
            setNativeErrors((prev) => {
                if (prev[index] === message) return prev
                return { ...prev, [index]: message }
            })
        })
    }, [])

    const clearErrorFor = React.useCallback((index: number) => {
        React.startTransition(() => {
            setNativeErrors((prev) => {
                if (!prev[index]) return prev
                const next = { ...prev }
                delete next[index]
                return next
            })
        })
    }, [])

    const postPauseToProvider = React.useCallback(
        (index: number, provider: ProviderKind) => {
            const frame = iframeEls.current[index]
            if (!frame) return
            if (typeof window === "undefined") return
            const win = frame.contentWindow
            if (!win) return
            try {
                if (provider === "youtube") {
                    win.postMessage(
                        JSON.stringify({
                            event: "command",
                            func: "pauseVideo",
                            args: [],
                        }),
                        "*"
                    )
                } else {
                    win.postMessage(
                        JSON.stringify({
                            method: "pause",
                        }),
                        "*"
                    )
                }
            } catch {}
        },
        []
    )

    const goTo = React.useCallback(
        (nextRaw: number) => {
            if (count <= 0) return
            const next = loop ? wrapIndex(nextRaw, count) : clampIndex(nextRaw, count)
            React.startTransition(() => setActive(next))
        },
        [count, loop]
    )

    const next = React.useCallback(() => goTo(active + 1), [active, goTo])
    const prev = React.useCallback(() => goTo(active - 1), [active, goTo])

    // Auto advance
    React.useEffect(() => {
        if (isStatic) return
        if (!autoAdvance) return
        if (!inView) return
        if (count <= 1) return
        if (isDragging) return

        const ms = Math.max(0.5, autoAdvanceSeconds) * 1000
        const id = window.setInterval(() => {
            next()
        }, ms)
        return () => window.clearInterval(id)
    }, [autoAdvance, autoAdvanceSeconds, count, inView, isDragging, isStatic, next])

    // Ensure active is in bounds when items change
    React.useEffect(() => {
        if (count <= 0) return
        if (active > count - 1) {
            React.startTransition(() => setActive(0))
        }
    }, [count, active])

    // Play/pause management
    React.useEffect(() => {
        if (isStatic) return
        const token = activeNativePlayToken.current + 1
        activeNativePlayToken.current = token
        // If not in view, pause everything.
        if (!inView) {
            videoEls.current.forEach((v) => {
                if (!v) return
                try {
                    v.pause()
                    v.muted = true
                } catch {}
            })
            resolvedItems.forEach((resolved, i) => {
                if (resolved.kind === "youtube" || resolved.kind === "vimeo") {
                    postPauseToProvider(i, resolved.kind)
                }
            })
            return
        }

        videoEls.current.forEach((v, i) => {
            if (!v) return
            const resolved = resolvedItems[i]
            if (!resolved || resolved.kind !== "native") {
                try {
                    v.pause()
                } catch {}
                return
            }
            const isActive = i === active
            try {
                if (!isActive) {
                    v.pause()
                    v.muted = true
                    setPromptFor(i, false)
                } else {
                    v.muted = muted
                    v.playsInline = true
                    v.loop = true
                    const p = v.play()
                    if (p && typeof p.catch === "function") {
                        p.then(() => {
                            if (activeNativePlayToken.current !== token) return
                            setPromptFor(i, false)
                        }).catch(() => {
                            if (activeNativePlayToken.current !== token) return
                            setPromptFor(i, true)
                        })
                    }
                }
            } catch {}
        })
        resolvedItems.forEach((resolved, i) => {
            if (resolved.kind !== "youtube" && resolved.kind !== "vimeo") return
            const isActiveProvider = i === active && inView
            if (!isActiveProvider) {
                postPauseToProvider(i, resolved.kind)
            }
        })
    }, [active, inView, isStatic, muted, postPauseToProvider, resolvedItems, setPromptFor])

    React.useEffect(() => {
        return () => {
            resolvedItems.forEach((resolved, i) => {
                if (resolved.kind === "youtube" || resolved.kind === "vimeo") {
                    postPauseToProvider(i, resolved.kind)
                }
            })
            videoEls.current.forEach((v) => {
                if (!v) return
                try {
                    v.pause()
                    v.muted = true
                } catch {}
            })
        }
    }, [postPauseToProvider, resolvedItems])

    // Update muted state on active video
    React.useEffect(() => {
        if (isStatic) return
        const v = videoEls.current[active]
        if (!v) return
        try {
            v.muted = muted
        } catch {}
    }, [active, isStatic, muted])

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent) => {
            if (count <= 1) return
            ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
            React.startTransition(() => setIsDragging(true))
            dragStart.current = { x: e.clientX, y: e.clientY, active }
        },
        [active, count]
    )

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (!dragStart.current) return
            // We only decide on release; avoid per-move state updates for perf.
        },
        []
    )

    const onPointerUp = React.useCallback(
        (e: React.PointerEvent) => {
            if (!dragStart.current) return
            const start = dragStart.current
            dragStart.current = null
            React.startTransition(() => setIsDragging(false))

            const dx = e.clientX - start.x
            const dy = e.clientY - start.y
            const delta = axis === "x" ? dx : dy
            const threshold = 24
            if (Math.abs(delta) < threshold) return
            if (delta < 0) {
                // Swiping left/up goes forward
                goTo(start.active + 1)
            } else {
                goTo(start.active - 1)
            }
        },
        [axis, goTo]
    )

    const stackStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "pan-x pan-y",
            userSelect: "none",
            WebkitUserSelect: "none",
            perspective: `${perspective}px`,
        }),
        [perspective]
    )

    const isFixedW = !!style && style.width === "100%"
    const isFixedH = !!style && style.height === "100%"

    const stageSizeStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: isFixedW ? "100%" : cardWidth + depth + spacing * 2,
            height: isFixedH ? "100%" : cardHeight + depth + spacing * 2,
            transformStyle: "preserve-3d",
        }),
        [cardWidth, cardHeight, depth, isFixedH, isFixedW, spacing]
    )

    const buttonStyle: React.CSSProperties = {
        appearance: "none",
        border: "none",
        background: uiBackground,
        color: uiColor,
        borderRadius: 999,
        width: arrowSize,
        height: arrowSize,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    }

    const overlayPillStyle: React.CSSProperties = {
        background: uiBackground,
        color: uiColor,
        borderRadius: 999,
        padding: "8px 10px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        pointerEvents: "auto",
    }

    const resolvedDotActive = uiColor
    const resolvedDotInactive = toRgba(uiColor, 0.25)

    const retryPlay = React.useCallback((index: number) => {
        const v = videoEls.current[index]
        if (!v) return
        try {
            const p = v.play()
            if (p && typeof p.catch === "function") {
                p.then(() => {
                    setPromptFor(index, false)
                    clearErrorFor(index)
                }).catch(() => {
                    setPromptFor(index, true)
                    setErrorFor(index, "Playback was blocked. Tap Play video to try again.")
                })
            } else {
                setPromptFor(index, false)
                clearErrorFor(index)
            }
        } catch {
            setPromptFor(index, true)
            setErrorFor(index, "Playback was blocked. Tap Play video to try again.")
        }
    }, [clearErrorFor, setErrorFor, setPromptFor])

    const cards = React.useMemo(() => {
        const half = Math.floor(count / 2)

        return items.map((item, i) => {
            const rel = i - active
            // Use shortest path if looping
            const relLooped = loop && count > 2 ? (() => {
                let r = rel
                if (r > half) r -= count
                if (r < -half) r += count
                return r
            })() : rel

            const abs = Math.abs(relLooped)
            const sign = relLooped === 0 ? 0 : relLooped > 0 ? 1 : -1

            // Layout
            const translate = relLooped * spacing
            const z = -abs * depth * 0.35
            const rotate = relLooped * -18

            const baseTransform =
                orientation === "horizontal"
                    ? `translateX(${translate}px) translateZ(${z}px) rotateY(${rotate}deg)`
                    : `translateY(${translate}px) translateZ(${z}px) rotateX(${-rotate}deg)`

            const isActive = relLooped === 0
            const resolved = resolvedItems[i] ?? { kind: "empty", src: "" as string }
            const src = resolved.src

            const filterBlur = isActive ? 0 : inactiveBlur
            const scale = isActive ? 1 : inactiveScale

            const baseOpacity = abs > 3 ? 0 : 1 - Math.min(0.75, abs * 0.18)
            const targetOpacity = Math.max(
                0,
                Math.min(1, isActive ? baseOpacity : baseOpacity * Math.max(0, Math.min(1, inactiveOpacity)))
            )

            return (
                <motion.div
                    key={i}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: cardWidth,
                        height: cardHeight,
                        marginLeft: -cardWidth / 2,
                        marginTop: -cardHeight / 2,
                        borderRadius: radius,
                        overflow: "hidden",
                        background: cardBackground,
                        transformStyle: "preserve-3d",
                        pointerEvents: isActive ? "auto" : "none",
                    }}
                    initial={false}
                    animate={
                        reducedMotion
                            ? {
                                  opacity: targetOpacity,
                              }
                            : {
                                  opacity: targetOpacity,
                                  transform: `${baseTransform} scale(${scale})`,
                                  filter: `blur(${filterBlur}px)`,
                              }
                    }
                    transition={transition}
                    whileHover={
                        !reducedMotion && isActive
                            ? {
                                  transform: `${baseTransform} scale(${hoverZoom})`,
                                  filter: "blur(0px)",
                              }
                            : undefined
                    }
                >
                    {resolved.kind === "native" ? (
                        <>
                            <video
                                ref={(el) => {
                                    videoEls.current[i] = el
                                }}
                                src={src}
                                poster={item.poster?.src}
                                muted={i === active ? muted : true}
                                playsInline
                                preload="metadata"
                                loop
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                                aria-label={item.poster?.alt || `Video ${i + 1}`}
                                onError={() => {
                                    setErrorFor(i, "This video could not be loaded. Use a direct video-file link or upload a supported file.")
                                }}
                                onCanPlay={() => {
                                    clearErrorFor(i)
                                }}
                                onPlay={() => {
                                    setPromptFor(i, false)
                                }}
                            />
                            {/* subtle overlay to enhance blur-to-clear on inactive */}
                            {!isActive && (
                                <div
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                            sign === 0
                                                ? "transparent"
                                                : "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.20))",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </>
                    ) : resolved.kind === "youtube" || resolved.kind === "vimeo" ? (
                        isActive && inView && !isStatic ? (
                            <iframe
                                ref={(el) => {
                                    iframeEls.current[i] = el
                                }}
                                src={
                                    resolved.kind === "youtube"
                                        ? `${resolved.embedSrc}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1`
                                        : `${resolved.embedSrc}?autoplay=1&muted=1&api=1&dnt=1`
                                }
                                title={resolved.providerTitle || `Video ${i + 1}`}
                                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "0",
                                    display: "block",
                                    background: cardBackground,
                                }}
                            />
                        ) : item.poster?.src ? (
                            <img
                                src={item.poster.src}
                                srcSet={item.poster.srcSet}
                                alt={item.poster.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <div
                                role="img"
                                aria-label={`${resolved.providerTitle || "Provider video"} placeholder`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: toRgba(uiBackground, 0.92),
                                    background: "rgba(0,0,0,0.25)",
                                    fontSize: 13,
                                    lineHeight: "1.3em",
                                    textAlign: "center",
                                    padding: 14,
                                }}
                            >
                                {resolved.providerTitle || "Video"} ready on active slide
                            </div>
                        )
                    ) : resolved.kind === "unsupported" ? (
                        <div
                            role="status"
                            aria-live="polite"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 14,
                            }}
                        >
                            <div
                                style={{
                                    background: uiBackground,
                                    color: uiColor,
                                    borderRadius: 12,
                                    padding: "10px 12px",
                                    maxWidth: "92%",
                                    fontSize: 13,
                                    lineHeight: "1.35em",
                                    textAlign: "center",
                                }}
                            >
                                Unsupported link. Use a YouTube, Vimeo, or direct video-file URL.
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "rgba(255,255,255,0.85)",
                                padding: 16,
                                textAlign: "center",
                                fontSize: 14,
                                lineHeight: "1.3em",
                            }}
                        >
                            Add a video URL or upload a video.
                        </div>
                    )}

                    {resolved.kind === "native" && (nativePlayPrompt[i] || nativeErrors[i]) && (
                        <div
                            role="status"
                            aria-live="polite"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 14,
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                style={{
                                    background: uiBackground,
                                    color: uiColor,
                                    borderRadius: 12,
                                    padding: "10px 12px",
                                    maxWidth: "92%",
                                    fontSize: 13,
                                    lineHeight: "1.35em",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    pointerEvents: "auto",
                                }}
                            >
                                <div>
                                    {nativeErrors[i] ||
                                        "Playback was blocked by browser settings. Press Play video to continue."}
                                </div>
                                {isActive && (
                                    <button
                                        type="button"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onPointerUp={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            retryPlay(i)
                                        }}
                                        style={{
                                            ...buttonStyle,
                                            width: "auto",
                                            minWidth: 94,
                                            height: 30,
                                            padding: "0 10px",
                                            alignSelf: "center",
                                        }}
                                    >
                                        Play video
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {isActive && resolved.kind === "native" && (
                        <button
                            type="button"
                            aria-label={muted ? "Unmute video" : "Mute video"}
                            onPointerDown={(e) => {
                                // Prevent carousel drag handlers from capturing this pointer
                                e.stopPropagation()
                            }}
                            onPointerUp={(e) => {
                                e.stopPropagation()
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                React.startTransition(() => setMuted((m) => !m))
                            }}
                            style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                ...buttonStyle,
                                width: 34,
                                height: 34,
                                pointerEvents: "auto",
                            }}
                        >
                            <MuteIcon muted={muted} />
                        </button>
                    )}
                </motion.div>
            )
        })
    }, [
        active,
        buttonStyle,
        cardBackground,
        cardHeight,
        cardWidth,
        count,
        depth,
        inactiveBlur,
        inactiveScale,
        isStatic,
        items,
        resolvedItems,
        loop,
        muted,
        nativeErrors,
        nativePlayPrompt,
        orientation,
        radius,
        reducedMotion,
        spacing,
        retryPlay,
        transition,
        uiBackground,
        uiColor,
        inView,
        setPromptFor,
        setErrorFor,
        clearErrorFor,
        hoverZoom,
        inactiveOpacity,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                background: "transparent",
            }}
        >
            <div
                style={stackStyle}
                onPointerDown={isStatic ? undefined : onPointerDown}
                onPointerMove={isStatic ? undefined : onPointerMove}
                onPointerUp={isStatic ? undefined : onPointerUp}
                onPointerCancel={isStatic ? undefined : onPointerUp}
                role="region"
                aria-label="Video carousel"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev()
                    if (e.key === "ArrowRight" || e.key === "ArrowDown") next()
                }}
            >
                <div style={stageSizeStyle}>{cards}</div>

                {showButtons && count > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous"
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation()
                                prev()
                            }}
                            style={{
                                position: "absolute",
                                left: arrowInset,
                                top: "50%",
                                transform: "translateY(-50%)",
                                ...buttonStyle,
                                pointerEvents: "auto",
                            }}
                        >
                            <ChevronIcon dir="prev" size={arrowIconSize} strokeWidth={arrowStrokeWidth} />
                        </button>
                        <button
                            type="button"
                            aria-label="Next"
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation()
                                next()
                            }}
                            style={{
                                position: "absolute",
                                right: arrowInset,
                                top: "50%",
                                transform: "translateY(-50%)",
                                ...buttonStyle,
                                pointerEvents: "auto",
                            }}
                        >
                            <ChevronIcon dir="next" size={arrowIconSize} strokeWidth={arrowStrokeWidth} />
                        </button>
                    </>
                )}

                {showDots && count > 1 && (
                    <div
                        style={{
                            position: "absolute",
                            left: 12,
                            right: 12,
                            bottom: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            pointerEvents: "none",
                        }}
                    >
                        {showDots ? (
                            <div style={{ ...overlayPillStyle, pointerEvents: "auto" }}>
                                <div
                                    role="tablist"
                                    aria-label="Carousel navigation"
                                    style={{
                                        display: "flex",
                                        gap: dotGap,
                                        alignItems: "center",
                                    }}
                                >
                                    {items.map((_, i) => {
                                        const isOn = i === active
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                role="tab"
                                                aria-selected={isOn}
                                                aria-label={`Go to item ${i + 1}`}
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onPointerUp={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    goTo(i)
                                                }}
                                                style={{
                                                    width: dotSize,
                                                    height: dotSize,
                                                    borderRadius: 999,
                                                    border: "none",
                                                    background: isOn ? resolvedDotActive : resolvedDotInactive,
                                                    cursor: "pointer",
                                                    padding: 0,
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}

function ChevronIcon({
    dir,
    size = 18,
    strokeWidth = 2,
}: {
    dir: "prev" | "next"
    size?: number
    strokeWidth?: number
}) {
    const rot = dir === "prev" ? 180 : 0
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden
            style={{ transform: `rotate(${rot}deg)` }}
        >
            <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function MuteIcon({ muted }: { muted: boolean }) {
    return muted ? (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M11 5L6 9H2v6h4l5 4V5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M16.5 9.5l5 5m0-5l-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M11 5L6 9H2v6h4l5 4V5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M15.5 8.5a5 5 0 010 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M18.5 5.5a9 9 0 010 13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
            />
        </svg>
    )
}

addPropertyControls(VideoCarousel, {
    // Content
    items: {
        type: ControlType.Array,
        title: "Videos",
        maxCount: 12,
        defaultValue: [
            {
                sourceType: "url",
                url: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                upload: "",
                poster: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Poster",
                },
            },
            {
                sourceType: "url",
                url: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                upload: "",
                poster: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Poster",
                },
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                sourceType: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["url", "upload"],
                    optionTitles: ["URL", "Upload"],
                    defaultValue: "url",
                    displaySegmentedControl: true,
                },
                url: {
                    type: ControlType.String,
                    title: "Video URL",
                    defaultValue: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                    hidden: (p: any) => p.sourceType !== "url",
                },
                upload: {
                    type: ControlType.File,
                    title: "Upload",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.sourceType !== "upload",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                },
            },
        },
    },

    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },

    // Layout
    cardWidth: {
        type: ControlType.Number,
        title: "Card W",
        defaultValue: 420,
        min: 160,
        max: 900,
        step: 1,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card H",
        defaultValue: 260,
        min: 120,
        max: 700,
        step: 1,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 74,
        min: 20,
        max: 220,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },

    // Appearance
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#000000",
    },

    // Motion
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { type: "spring", stiffness: 520, damping: 44 },
    },
    depth: {
        type: ControlType.Number,
        title: "Depth",
        defaultValue: 260,
        min: 0,
        max: 900,
        step: 1,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 200,
        max: 2200,
        step: 10,
        unit: "px",
    },
    hoverZoom: {
        type: ControlType.Number,
        title: "Hover Zoom",
        defaultValue: 1.03,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Scale",
        defaultValue: 0.92,
        min: 0.5,
        max: 1,
        step: 0.01,
    },
    inactiveBlur: {
        type: ControlType.Number,
        title: "Inactive Blur",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },

    // Playback
    mutedDefault: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    autoAdvance: {
        type: ControlType.Boolean,
        title: "Auto",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoAdvanceSeconds: {
        type: ControlType.Number,
        title: "Auto Sec",
        defaultValue: 4,
        min: 1,
        max: 30,
        step: 0.5,
        unit: "s",
        hidden: (p: any) => !p.autoAdvance,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // Navigation
    uiColor: {
        type: ControlType.Color,
        title: "UI colour",
        defaultValue: "#000000",
    },
    uiBackground: {
        type: ControlType.Color,
        title: "UI Background",
        defaultValue: "#FFFFFF",
    },

    // Arrows
    showButtons: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 36,
        min: 24,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.showButtons,
    },
    arrowIconSize: {
        type: ControlType.Number,
        title: "Arrow Icon",
        defaultValue: 18,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.showButtons,
    },
    arrowStrokeWidth: {
        type: ControlType.Number,
        title: "Arrow Stroke",
        defaultValue: 2,
        min: 1,
        max: 5,
        step: 0.5,
        hidden: (p: any) => !p.showButtons,
    },
    arrowInset: {
        type: ControlType.Number,
        title: "Arrow Inset",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.showButtons,
    },

    // Dots
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 8,
        min: 4,
        max: 20,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.showDots,
    },
    dotGap: {
        type: ControlType.Number,
        title: "Dot Gap",
        defaultValue: 8,
        min: 2,
        max: 30,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.showDots,
    },
})
