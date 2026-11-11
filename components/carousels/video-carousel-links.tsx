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

import { motion, animate, useMotionValue } from "framer-motion"

type MotionFeel = "smooth" | "natural" | "snappy" | "bouncy"
type DotsStyle = {
    show: boolean; size: number; gap: number; inset: number
    fill: string; activeFill: string
}
type ArrowsStyle = {
    show: boolean; size: number; iconColor: string; background: string
    offset: number; fadeIn: boolean
}
type DesktopStyle = { items: number; gap: number; inactiveScale: number; inactiveOpacity: number; arrows: ArrowsStyle }
type MobileStyle = { breakpoint: number; items: number; gap: number; hideDots: boolean; showArrows: boolean }
type AspectRatioPreset = "9:16" | "1:1" | "4:5" | "16:9" | "4:3" | "custom"
type PlaybackStyle = {
    startMuted: boolean; startTime: number
    loop: boolean; autoPlay: boolean; interval: number; pauseOnHover: boolean
    privacy: boolean
}
type SoundCorner = "top-right" | "top-left" | "bottom-right" | "bottom-left"
type SoundStyle = {
    show: boolean; size: number; iconColor: string
    background: string; corner: SoundCorner; margin: number
}
type CardStyle = {
    loadingColor: string; radius: number
    borderShow: boolean; borderColor: string; borderWidth: number
}

type Props = {
    videos?: string[]
    aspectRatioPreset: AspectRatioPreset
    customWidth: number; customHeight: number
    desktop: DesktopStyle; mobile: MobileStyle
    playback: PlaybackStyle
    sound: SoundStyle
    card: CardStyle
    dots: DotsStyle
    motionFeel: MotionFeel
}

const FEEL_PRESETS: Record<MotionFeel, { stiffness: number; damping: number }> = {
    smooth: { stiffness: 200, damping: 40 }, natural: { stiffness: 500, damping: 40 },
    snappy: { stiffness: 800, damping: 55 }, bouncy: { stiffness: 400, damping: 15 },
}
const ASPECT_PRESETS: Record<Exclude<AspectRatioPreset, "custom">, [number, number]> = {
    "9:16": [9, 16], "1:1": [1, 1], "4:5": [4, 5], "16:9": [16, 9], "4:3": [4, 3],
}

// Cross-instance audio exclusivity: when one carousel unmutes, all others mute.
const SOUND_EVENT = "vcl-sound-on"

// ─── URL Parsers ──────────────────────────────────────────────────────────────

function getVimeoId(url: string): string | null {
    if (!url) return null
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    return m ? m[1] : null
}

function getYouTubeId(url: string): string | null {
    if (!url) return null
    const m = url.match(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    return m ? m[1] : null
}

function getYouTubeTimestamp(url: string): number {
    if (!url) return 0
    const m = url.match(/[?&#]t=(\d+)/)
    return m ? parseInt(m[1], 10) : 0
}

type Platform = "vimeo" | "youtube" | "unknown"

function detectPlatform(url: string): Platform {
    if (getYouTubeId(url)) return "youtube"
    if (getVimeoId(url)) return "vimeo"
    return "unknown"
}

// ─── Posters (video thumbnails) ───────────────────────────────────────────────
// Every slide shows its real video thumbnail instantly. The heavy player
// iframe is only mounted on the active slide, and the poster fades out once
// playback actually starts — so cards are never black.

// Cache values: a thumbnail URL, or "FAILED" when oEmbed has no thumbnail
// (private/embed-restricted videos) — then we fall back to vumbnail.com.
const vimeoThumbCache: Record<string, string> = {}

function useVimeoThumb(id: string | null): { url: string | null; failed: boolean } {
    const cached = id ? vimeoThumbCache[id] : undefined
    const [state, setState] = React.useState<{ url: string | null; failed: boolean }>(
        cached ? { url: cached === "FAILED" ? null : cached, failed: cached === "FAILED" } : { url: null, failed: false }
    )
    React.useEffect(() => {
        if (!id) return
        const hit = vimeoThumbCache[id]
        if (hit) { setState({ url: hit === "FAILED" ? null : hit, failed: hit === "FAILED" }); return }
        let alive = true
        fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                const raw: string | undefined = d?.thumbnail_url
                const big = raw ? raw.replace(/_\d+x\d+/, "_960x540") : null
                vimeoThumbCache[id] = big ?? "FAILED"
                if (alive) setState({ url: big, failed: !big })
            })
            .catch(() => { if (alive) setState({ url: null, failed: true }) })
        return () => { alive = false }
    }, [id])
    return state
}

function Poster({ platform, ytId, vmId, visible }: {
    platform: Platform; ytId: string | null; vmId: string | null; visible: boolean
}) {
    const vimeo = useVimeoThumb(platform === "vimeo" ? vmId : null)
    const [ytFallback, setYtFallback] = React.useState(false)
    const [imgDead, setImgDead] = React.useState(false)

    let src: string | null = null
    if (platform === "youtube" && ytId) {
        src = `https://i.ytimg.com/vi/${ytId}/${ytFallback ? "hqdefault" : "maxresdefault"}.jpg`
    } else if (platform === "vimeo" && vmId) {
        src = vimeo.url ?? (vimeo.failed ? `https://vumbnail.com/${vmId}.jpg` : null)
    }
    if (imgDead) src = null

    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                opacity: visible ? 1 : 0, transition: "opacity 0.35s ease",
            }}
        >
            {/* Neutral placeholder so a card is never an empty black void. */}
            <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: 54, height: 54, borderRadius: 999,
                    background: "rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5.5V18.5L19 12L8 5.5Z" fill="rgba(255,255,255,0.75)" />
                    </svg>
                </div>
            </div>
            {src && (
                <img
                    src={src} alt="" draggable={false}
                    onError={() => {
                        if (platform === "youtube" && !ytFallback) setYtFallback(true)
                        else setImgDead(true)
                    }}
                    onLoad={(e) => {
                        // YouTube serves a tiny gray placeholder when maxres is missing.
                        if (platform === "youtube" && !ytFallback && e.currentTarget.naturalWidth <= 120) setYtFallback(true)
                    }}
                    style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%",
                        objectFit: "cover",
                    }}
                />
            )}
        </div>
    )
}

// ─── Vimeo Player ─────────────────────────────────────────────────────────────

const VIMEO_ORIGIN = "https://player.vimeo.com"

function VimeoPlayer({ vimeoId, muted, startTime, onPlaying }: {
    vimeoId: string; muted: boolean; startTime: number; onPlaying: () => void
}) {
    const iframeRef = React.useRef<HTMLIFrameElement>(null)

    const src = `${VIMEO_ORIGIN}/video/${vimeoId}?autoplay=1&muted=1&loop=0&controls=1&byline=0&title=0&portrait=0&dnt=1&transparent=0&color=ffffff${startTime > 0 ? `#t=${startTime}s` : ""}`

    const post = React.useCallback((method: string, value?: any) => {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ method, value }), VIMEO_ORIGIN
        )
    }, [])

    React.useEffect(() => {
        const handler = (e: MessageEvent) => {
            // Only accept messages from this slide's own player.
            if (e.origin !== VIMEO_ORIGIN) return
            if (e.source !== iframeRef.current?.contentWindow) return
            try {
                const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
                if (data.event === "ready") {
                    post("addEventListener", "ended")
                    post("addEventListener", "play")
                    post("addEventListener", "error")
                    post("setVolume", muted ? 0 : 1)
                    if (startTime > 0) post("setCurrentTime", startTime)
                    post("play")
                }
                // "error" also reveals the player so its message isn't hidden
                // behind the poster.
                if (data.event === "play" || data.event === "error") onPlaying()
                if (data.event === "ended") { post("setCurrentTime", startTime || 0); post("play") }
            } catch {}
        }
        window.addEventListener("message", handler)
        return () => window.removeEventListener("message", handler)
    }, [post, muted, startTime, onPlaying])

    // React to the gallery mute toggle.
    React.useEffect(() => {
        post("setVolume", muted ? 0 : 1)
    }, [muted, post])

    return (
        <iframe
            ref={iframeRef} src={src}
            title="Vimeo video player"
            allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", display: "block" }}
        />
    )
}

// ─── YouTube Player ───────────────────────────────────────────────────────────

function YouTubePlayer({ youtubeId, muted, startTime, privacy, onPlaying }: {
    youtubeId: string; muted: boolean; startTime: number; privacy: boolean; onPlaying: () => void
}) {
    const iframeRef = React.useRef<HTMLIFrameElement>(null)

    const ytOrigin = privacy ? "https://www.youtube-nocookie.com" : "https://www.youtube.com"
    const src = `${ytOrigin}/embed/${youtubeId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${startTime > 0 ? `&start=${startTime}` : ""}`

    const postYT = React.useCallback((func: string, args: any[] = []) => {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func, args }),
            ytOrigin
        )
    }, [ytOrigin])

    // Handshake so the YT iframe starts emitting onReady/onStateChange events.
    const handleIframeLoad = React.useCallback(() => {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "listening", id: youtubeId }),
            ytOrigin
        )
    }, [youtubeId, ytOrigin])

    React.useEffect(() => {
        const handler = (e: MessageEvent) => {
            // Only accept messages from this slide's own player.
            if (e.origin !== ytOrigin) return
            if (e.source !== iframeRef.current?.contentWindow) return
            try {
                const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
                if (data.event === "onReady") {
                    postYT("playVideo")
                    postYT(muted ? "mute" : "unMute")
                }
                if (data.event === "onStateChange") {
                    if (data.info === 1) onPlaying()
                    if (data.info === 0) { postYT("seekTo", [startTime || 0, true]); postYT("playVideo") }
                }
                // Reveal the player on embed errors so the message isn't
                // hidden behind the poster.
                if (data.event === "onError") onPlaying()
            } catch {}
        }
        window.addEventListener("message", handler)
        return () => window.removeEventListener("message", handler)
    }, [postYT, muted, startTime, ytOrigin, onPlaying])

    // React to the gallery mute toggle.
    React.useEffect(() => {
        postYT(muted ? "mute" : "unMute")
    }, [muted, postYT])

    return (
        <iframe
            ref={iframeRef} src={src}
            onLoad={handleIframeLoad}
            title="YouTube video player"
            allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", display: "block" }}
        />
    )
}

// ─── Invalid Slide ────────────────────────────────────────────────────────────

function InvalidSlide({ url, backgroundColor, radius }: { url: string; backgroundColor: string; radius: number }) {
    return (
        <div style={{
            width: "100%", height: "100%", background: backgroundColor || "#111", borderRadius: radius,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif",
            fontSize: 13, padding: 16, boxSizing: "border-box", textAlign: "center",
        }}>
            <div style={{ fontSize: 24 }} aria-hidden="true">⚠️</div>
            <div style={{ fontWeight: 600 }}>Invalid URL</div>
            <div style={{ fontSize: 11, opacity: 0.6, maxWidth: 200 }}>Paste a YouTube or Vimeo link</div>
            <div style={{ fontSize: 10, opacity: 0.4, wordBreak: "break-all", maxWidth: 200 }}>{url}</div>
        </div>
    )
}

// ─── Slide (poster + on-demand player) ────────────────────────────────────────

function Slide({ url, mountPlayer, backgroundColor, radius, muted, startTime, privacy }: {
    url: string; mountPlayer: boolean; backgroundColor: string; radius: number
    muted: boolean; startTime: number; privacy: boolean
}) {
    const platform = detectPlatform(url)
    const ytId = getYouTubeId(url)
    const vmId = getVimeoId(url)
    const urlTimestamp = platform === "youtube" ? getYouTubeTimestamp(url) : 0
    const effectiveStartTime = urlTimestamp || startTime

    const [playing, setPlaying] = React.useState(false)
    const onPlaying = React.useCallback(() => setPlaying(true), [])
    React.useEffect(() => {
        if (!mountPlayer) setPlaying(false)
    }, [mountPlayer])

    if (platform === "unknown") {
        return <InvalidSlide url={url} backgroundColor={backgroundColor} radius={radius} />
    }

    return (
        <div style={{
            position: "relative", width: "100%", height: "100%",
            background: backgroundColor || "#000", overflow: "hidden", borderRadius: radius,
        }}>
            {mountPlayer && (platform === "youtube" && ytId ? (
                <YouTubePlayer
                    youtubeId={ytId} muted={muted}
                    startTime={effectiveStartTime} privacy={privacy} onPlaying={onPlaying}
                />
            ) : vmId ? (
                <VimeoPlayer
                    vimeoId={vmId} muted={muted}
                    startTime={effectiveStartTime} onPlaying={onPlaying}
                />
            ) : null)}
            <Poster platform={platform} ytId={ytId} vmId={vmId} visible={!(mountPlayer && playing)} />
        </div>
    )
}

// ─── Sound Icons ──────────────────────────────────────────────────────────────

function SpeakerIcon({ muted, color, size }: { muted: boolean; color: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 5L6.5 8.5H3.5C3.22 8.5 3 8.72 3 9V15C3 15.28 3.22 15.5 3.5 15.5H6.5L11 19V5Z" fill={color} />
            {muted ? (
                <path d="M15 9.5L20 14.5M20 9.5L15 14.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            ) : (
                <>
                    <path d="M14.5 9.2C15.4 10 15.9 11 15.9 12C15.9 13 15.4 14 14.5 14.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M16.8 7C18.3 8.3 19.2 10.1 19.2 12C19.2 13.9 18.3 15.7 16.8 17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
                </>
            )}
        </svg>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 400
 */
export default function VideoCarouselLinks(props: Props) {
    const { videos = [], aspectRatioPreset, customWidth, customHeight,
        desktop, mobile, playback, sound, card, dots, motionFeel } = props

    const startTime = playback?.startTime ?? 0
    const loop = playback?.loop ?? true
    const autoPlay = playback?.autoPlay ?? false
    const interval = playback?.interval ?? 5
    const pauseOnHover = playback?.pauseOnHover ?? true
    const privacy = playback?.privacy ?? true

    const backgroundColor = card?.loadingColor ?? "#0A0A0A"
    const radius = card?.radius ?? 0
    // Inside a border, corners must use a smaller radius (outer − border
    // width), otherwise the content corners pull away from the border and
    // leave a visible gap.
    const borderW = card?.borderShow ? (card?.borderWidth ?? 2) : 0
    const innerRadius = Math.max(0, radius - borderW)

    const itemsSafe = React.useMemo(
        () => (Array.isArray(videos) ? videos : []).filter(v => v && v.trim() !== ""), [videos]
    )
    const [ratioW, ratioH] = aspectRatioPreset === "custom"
        ? [Math.max(1, customWidth || 9), Math.max(1, customHeight || 16)]
        : (ASPECT_PRESETS[aspectRatioPreset] ?? [9, 16])
    const resolvedAspectRatio = `${ratioW} / ${ratioH}`

    const isStatic = useIsStaticRenderer()
    const carouselRef = React.useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const animating = React.useRef(false)
    const [width, setWidth] = React.useState(0)
    const [activeIndex, setActiveIndex] = React.useState(0)
    const [hovered, setHovered] = React.useState(false)
    const [inView, setInView] = React.useState(false)
    const [clickable, setClickable] = React.useState(true)
    const [pressedArrow, setPressedArrow] = React.useState<"left" | "right" | null>(null)

    // ── Global gallery sound state ──
    const [isMuted, setIsMuted] = React.useState<boolean>(() => playback?.startMuted ?? true)
    const instanceId = React.useRef(`vcl-${Math.random().toString(36).slice(2)}`).current

    // If another carousel instance on the page unmutes, this one mutes itself
    // so two audio tracks never overlap.
    React.useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail
            if (detail !== instanceId) setIsMuted(true)
        }
        window.addEventListener(SOUND_EVENT, handler)
        return () => window.removeEventListener(SOUND_EVENT, handler)
    }, [instanceId])

    const toggleMute = () => {
        setIsMuted((m) => {
            const next = !m
            if (!next) window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: instanceId }))
            return next
        })
    }

    React.useLayoutEffect(() => {
        if (!carouselRef.current) return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width
            if (w != null && w > 0) setWidth(w)
        })
        ro.observe(carouselRef.current)
        return () => ro.disconnect()
    }, [])

    React.useEffect(() => { if (width === 0) return; animating.current = false; x.set(0) }, [width])

    // A slide counts as "in view" when half the carousel is visible — or, for
    // carousels taller than the viewport (9:16 on mobile), when it fills at
    // least half the screen. A pure ratio test would never trigger there.
    React.useEffect(() => {
        if (!carouselRef.current) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                const viewportH = entry.rootBounds?.height ?? window.innerHeight
                setInView(
                    entry.intersectionRatio >= 0.5 ||
                    entry.intersectionRect.height >= viewportH * 0.5
                )
            },
            { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
        )
        observer.observe(carouselRef.current)
        return () => observer.disconnect()
    }, [])

    const mobileBreakpoint = mobile?.breakpoint ?? 640
    const isMobile = width > 0 && width < mobileBreakpoint
    // Never show more slots than there are videos — avoids duplicate slides.
    const requestedCount = Math.max(1, isMobile ? (mobile?.items ?? 1) : (desktop?.items ?? 1))
    const visibleCount = Math.max(1, Math.min(requestedCount, itemsSafe.length))
    const centerSlot = Math.floor(visibleCount / 2)
    const effectiveGap = isMobile ? (mobile?.gap ?? 0) : (desktop?.gap ?? 0)
    const inactiveScale = desktop?.inactiveScale ?? 0.9
    const inactiveOpacity = desktop?.inactiveOpacity ?? 0.4
    const arrows = desktop?.arrows
    const itemWidth = width > 0 ? (width - effectiveGap * (visibleCount - 1)) / visibleCount : 9999
    const slideHeight = width > 0 ? itemWidth * (ratioH / ratioW) : 0

    const offsetToCenter = width > 0
        ? (width / 2) - (centerSlot * (itemWidth + effectiveGap) + itemWidth / 2)
        : 0

    // Visible window plus one pre-mounted buffer slide on each side, so drag
    // gestures reveal real thumbnails. Rendered sorted by video index so
    // persisting slides never move in the DOM.
    const slots = React.useMemo(() => {
        const len = itemsSafe.length
        const seen = new Set<number>()
        const result: { real: number; slot: number; url: string }[] = []
        const push = (slot: number) => {
            let real = activeIndex + (slot - centerSlot)
            if (loop) real = ((real % len) + len) % len
            else if (real < 0 || real >= len) return
            if (seen.has(real)) return
            seen.add(real)
            result.push({ real, slot, url: itemsSafe[real] })
        }
        for (let s = 0; s < visibleCount; s++) push(s)
        push(-1)
        push(visibleCount)
        return result.sort((a, b) => a.real - b.real)
    }, [activeIndex, visibleCount, centerSlot, itemsSafe, loop])

    const feel: MotionFeel = FEEL_PRESETS[motionFeel] ? motionFeel : "natural"
    const motionOpts = {
        type: "spring" as const,
        stiffness: FEEL_PRESETS[feel].stiffness,
        damping: FEEL_PRESETS[feel].damping,
    }

    const slide = (delta: number) => {
        if (animating.current || delta === 0) return
        const len = itemsSafe.length
        let d = delta
        if (!loop) {
            // Clamp at the ends so the track never animates past the last slide.
            const target = Math.max(0, Math.min(activeIndex + delta, len - 1))
            d = target - activeIndex
            if (d === 0) return
        }
        animating.current = true
        animate(x, -(itemWidth + effectiveGap) * d, {
            ...motionOpts,
            onComplete: () => {
                x.set(0)
                setActiveIndex((i) => {
                    const next = i + d
                    return loop ? ((next % len) + len) % len : Math.max(0, Math.min(next, len - 1))
                })
                animating.current = false
            },
        })
    }

    const goNext = () => slide(1)
    const goPrev = () => slide(-1)
    const canPrev = itemsSafe.length > 1 && (loop || activeIndex > 0)
    const canNext = itemsSafe.length > 1 && (loop || activeIndex < itemsSafe.length - 1)
    const goTo = (index: number) => {
        const len = itemsSafe.length
        const raw = index - activeIndex
        const delta = loop ? ((raw + Math.round(len / 2)) % len) - Math.round(len / 2) : raw
        slide(delta)
    }
    const handleDragEnd = (_: any, info: any) => {
        // Larger threshold on mobile so tall 9:16 cards don't hijack vertical
        // page scroll; a fast flick (velocity) still advances the carousel.
        const thresholdRatio = isMobile ? 0.3 : 0.2
        const threshold = itemWidth * thresholdRatio
        const fastFlick = Math.abs(info.velocity.x) > 500
        const passed = Math.abs(info.offset.x) > threshold || (fastFlick && Math.abs(info.offset.x) > 20)
        if (passed) { setClickable(false); setTimeout(() => setClickable(true), 150) }
        if (passed && info.offset.x < 0) goNext()
        if (passed && info.offset.x > 0) goPrev()
    }

    // Auto-advance reads goNext through a ref so the interval never captures a
    // stale itemWidth after a resize.
    const goNextRef = React.useRef(goNext)
    React.useEffect(() => { goNextRef.current = goNext })
    React.useEffect(() => {
        if (!autoPlay || isStatic || !inView || itemsSafe.length < 2) return
        if (pauseOnHover && hovered) return
        const id = setInterval(() => goNextRef.current(), interval * 1000)
        return () => clearInterval(id)
    }, [autoPlay, pauseOnHover, hovered, interval, isStatic, inView, itemsSafe.length])

    if (itemsSafe.length === 0) {
        return (
            <div ref={carouselRef} style={{
                width: "100%", aspectRatio: resolvedAspectRatio,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.04)", borderRadius: radius || 12,
                border: "2px dashed rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.4)",
                fontFamily: "Inter, sans-serif", textAlign: "center",
                padding: 32, boxSizing: "border-box", gap: 12, userSelect: "none",
            }}>
                <div style={{ fontSize: 28 }} aria-hidden="true">🎬</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>No videos yet</div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", lineHeight: 1.8, maxWidth: 260 }}>
                    Open the right panel → click{" "}
                    <span style={{ background: "rgba(0,0,0,0.07)", padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>＋ Add Video URL</span><br />
                    Paste a YouTube or Vimeo link
                </div>
            </div>
        )
    }

    const showDots = dots?.show && itemsSafe.length > 1 && !(isMobile && mobile?.hideDots)
    // Mobile arrows have their own toggle, independent of the desktop one.
    const showArrows = width > 0 && itemsSafe.length > 1 &&
        (isMobile ? (mobile?.showArrows ?? false) : (arrows?.show ?? true))
    const arrowOffset = arrows?.offset ?? 10
    const arrowSize = arrows?.size ?? 44

    // ── Sound button ──
    // Default is top-right: the bottom edge is where YouTube/Vimeo native
    // control bars appear, so the button must stay clear of that zone.
    const soundShow = sound?.show ?? true
    const soundSize = sound?.size ?? 40
    const soundMargin = sound?.margin ?? 12
    const soundCorner: SoundCorner = sound?.corner ?? "top-right"
    const soundIsTop = soundCorner.startsWith("top")
    const soundIsRight = soundCorner.endsWith("right")
    const soundLeft = soundIsRight
        ? `calc(50% + ${itemWidth / 2 - soundSize - soundMargin}px)`
        : `calc(50% - ${itemWidth / 2 - soundMargin}px)`

    return (
        <div
            style={{ position: "relative", width: "100%" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* ── Carousel track ── */}
            <div
                ref={carouselRef}
                style={{
                    position: "relative", width: "100%", overflow: "hidden",
                    height: width > 0 ? slideHeight : undefined,
                    aspectRatio: width > 0 ? undefined : resolvedAspectRatio,
                    visibility: width > 0 ? "visible" : "hidden",
                }}
                role="region"
                aria-label="Video carousel"
            >
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                    style={{
                        position: "absolute", inset: 0, x,
                        // Keep vertical page scroll fluid on touch devices
                        touchAction: "pan-y",
                    }}
                >
                    {slots.map(({ url, real, slot }) => {
                        const active = slot === centerSlot
                        const isBuffer = slot < 0 || slot >= visibleCount
                        return (
                            <motion.div
                                key={String(real)}
                                aria-roledescription="slide"
                                aria-label={`Slide ${real + 1} of ${itemsSafe.length}`}
                                aria-current={active ? "true" : undefined}
                                aria-hidden={isBuffer ? "true" : undefined}
                                onClick={!active && !isBuffer ? () => { if (clickable) goTo(real) } : undefined}
                                style={{
                                    position: "absolute", top: 0,
                                    left: offsetToCenter + slot * (itemWidth + effectiveGap),
                                    width: itemWidth, aspectRatio: resolvedAspectRatio,
                                    scale: active ? 1 : isMobile ? 1 : inactiveScale,
                                    opacity: active ? 1 : isMobile ? 1 : inactiveOpacity,
                                    boxSizing: "border-box", overflow: "hidden", borderRadius: radius,
                                    border: card?.borderShow ? `${card.borderWidth ?? 2}px solid ${card.borderColor ?? "#1A1A1A"}` : undefined,
                                    backgroundColor, transition: "transform 0.25s ease, opacity 0.25s ease",
                                    pointerEvents: clickable && !isBuffer ? "auto" : "none",
                                    cursor: !active && !isBuffer ? "pointer" : undefined,
                                }}
                            >
                                <Slide
                                    url={url}
                                    mountPlayer={active && inView && !isStatic}
                                    backgroundColor={backgroundColor} radius={innerRadius}
                                    muted={isMuted} startTime={startTime} privacy={privacy}
                                />
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* ── Gallery sound toggle ── */}
                {soundShow && width > 0 && (
                    <button
                        aria-label={isMuted ? "Unmute videos" : "Mute videos"}
                        aria-pressed={!isMuted}
                        onClick={toggleMute}
                        style={{
                            position: "absolute",
                            left: soundLeft,
                            top: soundIsTop ? soundMargin : undefined,
                            bottom: soundIsTop ? undefined : soundMargin,
                            width: soundSize, height: soundSize,
                            borderRadius: 999,
                            background: sound?.background ?? "rgba(0,0,0,0.45)",
                            border: "none", cursor: "pointer", zIndex: 11,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: 0,
                            transition: "background 0.15s ease, transform 0.1s ease",
                        }}
                    >
                        <SpeakerIcon
                            muted={isMuted}
                            color={sound?.iconColor ?? "#FFFFFF"}
                            size={soundSize * 0.55}
                        />
                    </button>
                )}

                {/* ── Arrows ── */}
                {showArrows && (
                    <>{(["left", "right"] as const).map((side) => {
                        const enabled = side === "left" ? canPrev : canNext
                        const isPressed = pressedArrow === side && enabled
                        const action = side === "left" ? goPrev : goNext
                        const chevron = side === "left" ? "‹" : "›"
                        const iconColor = arrows?.iconColor ?? "#FFFFFF"
                        const arrowBg = arrows?.background ?? "rgba(0,0,0,0.35)"
                        // On mobile the card usually fills the width, so arrows sit
                        // inside the card edges instead of outside them.
                        const edgeInset = Math.max(arrowOffset, 6)
                        const leftPos = isMobile
                            ? (side === "left" ? `${edgeInset}px` : `calc(100% - ${arrowSize + edgeInset}px)`)
                            : (side === "left"
                                ? `calc(50% - ${itemWidth / 2}px - ${arrowSize + arrowOffset}px)`
                                : `calc(50% + ${itemWidth / 2}px + ${arrowOffset}px)`)
                        return (
                            <button
                                key={side}
                                aria-label={side === "left" ? "Previous slide" : "Next slide"}
                                disabled={!enabled}
                                onClick={action}
                                onMouseDown={() => setPressedArrow(side)}
                                onMouseUp={() => setPressedArrow(null)}
                                onMouseLeave={() => setPressedArrow(null)}
                                onTouchStart={() => setPressedArrow(side)}
                                onTouchEnd={() => { setPressedArrow(null); if (enabled) action() }}
                                style={{
                                    position: "absolute", top: "50%", left: leftPos,
                                    transform: `translateY(-50%) scale(${isPressed ? 0.88 : 1})`,
                                    width: arrowSize, height: arrowSize, borderRadius: 999,
                                    background: isPressed
                                        ? `color-mix(in srgb, ${arrowBg} 80%, #000 20%)`
                                        : arrowBg,
                                    opacity: !enabled ? 0.3
                                        : (arrows?.fadeIn && !hovered && !isMobile ? 0 : 1),
                                    transition: "opacity 0.25s ease, transform 0.1s ease, background 0.1s ease",
                                    border: "none", cursor: enabled ? "pointer" : "default", zIndex: 10,
                                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                }}
                            >
                                <span aria-hidden="true" style={{ color: iconColor, fontSize: arrowSize * 0.45, lineHeight: 1, userSelect: "none", display: "block" }}>{chevron}</span>
                            </button>
                        )
                    })}</>
                )}
            </div>

            {/* ── Dots ── */}
            {showDots && (
                <div
                    aria-label="Video slides"
                    style={{
                        marginTop: dots?.inset ?? 16, display: "flex", gap: dots?.gap ?? 8,
                        justifyContent: "center", flexWrap: "wrap", maxWidth: "100%",
                        alignItems: "center",
                    }}
                >
                    {itemsSafe.map((_, i) => {
                        const isActive = i === activeIndex
                        const dotSize = dots?.size ?? 8
                        return (
                            <button
                                key={i}
                                aria-label={`Go to slide ${i + 1}`}
                                aria-current={isActive ? "true" : undefined}
                                onClick={() => goTo(i)}
                                style={{
                                    height: dotSize,
                                    width: isActive ? dotSize * 2.5 : dotSize,
                                    borderRadius: dotSize / 2,
                                    background: isActive ? (dots?.activeFill ?? "#FFFFFF") : (dots?.fill ?? "#FFFFFF"),
                                    opacity: isActive ? 1 : 0.4,
                                    cursor: "pointer",
                                    border: "none",
                                    padding: 0,
                                    transition: "width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, opacity 0.3s ease",
                                    flexShrink: 0,
                                }}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(VideoCarouselLinks, {
    videos: {
        type: ControlType.Array,
        title: "Video URLs",
        description: "Paste YouTube or Vimeo links. Both platforms can be mixed freely.",
        control: {
            type: ControlType.String,
            placeholder: "https://youtube.com/watch?v=…",
        },
        defaultValue: [],
    },
    aspectRatioPreset: {
        type: ControlType.Enum, title: "Aspect Ratio",
        options: ["9:16", "1:1", "4:5", "16:9", "4:3", "custom"],
        optionTitles: ["9:16 — Vertical", "1:1 — Square", "4:5 — Portrait", "16:9 — Landscape", "4:3 — Classic", "Custom…"],
        defaultValue: "9:16",
    },
    customWidth: { type: ControlType.Number, title: "Ratio W", defaultValue: 9, min: 1, max: 100, step: 1, hidden: (props) => props.aspectRatioPreset !== "custom" },
    customHeight: { type: ControlType.Number, title: "Ratio H", defaultValue: 16, min: 1, max: 100, step: 1, hidden: (props) => props.aspectRatioPreset !== "custom" },
    desktop: {
        type: ControlType.Object, title: "🖥 Desktop",
        controls: {
            items: { type: ControlType.Number, title: "Videos shown", defaultValue: 1, min: 1, max: 7, step: 1, displayStepper: true, description: "Capped at the number of videos added." },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: 30, min: 0, max: 100, unit: "px", hidden: (props) => props.items <= 1 },
            inactiveScale: { type: ControlType.Number, title: "Side scale", defaultValue: 0.9, min: 0.5, max: 1, step: 0.01, hidden: (props) => props.items <= 1 },
            inactiveOpacity: { type: ControlType.Number, title: "Side opacity", defaultValue: 0.4, min: 0, max: 1, step: 0.05, hidden: (props) => props.items <= 1 },
            arrows: {
                type: ControlType.Object, title: "Arrows",
                controls: {
                    show: { type: ControlType.Boolean, title: "Show", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
                    iconColor: { type: ControlType.Color, title: "Icon color", defaultValue: "#FFFFFF", hidden: (props) => !props.show },
                    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0,0,0,0.35)", hidden: (props) => !props.show },
                    size: { type: ControlType.Number, title: "Button size", defaultValue: 44, min: 24, max: 120, unit: "px", hidden: (props) => !props.show },
                    offset: { type: ControlType.Number, title: "Offset", defaultValue: 10, min: -100, max: 200, unit: "px", hidden: (props) => !props.show },
                    fadeIn: { type: ControlType.Boolean, title: "Show on hover", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No", hidden: (props) => !props.show },
                },
            },
        },
    },
    mobile: {
        type: ControlType.Object, title: "📱 Mobile",
        controls: {
            breakpoint: { type: ControlType.Number, title: "Breakpoint", defaultValue: 640, min: 320, max: 1024, step: 10, unit: "px" },
            items: { type: ControlType.Number, title: "Videos shown", defaultValue: 1, min: 1, max: 5, step: 1, displayStepper: true },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: 12, min: 0, max: 60, unit: "px", hidden: (props) => props.items <= 1 },
            hideDots: { type: ControlType.Boolean, title: "Hide dots", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            showArrows: {
                type: ControlType.Boolean, title: "Show arrows", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No",
                description: "Arrows sit inside the card edges on mobile, as an alternative to swiping. Uses the desktop arrow styling.",
            },
        },
    },
    playback: {
        type: ControlType.Object, title: "▶ Playback",
        controls: {
            startMuted: {
                type: ControlType.Boolean, title: "Start muted",
                defaultValue: true, enabledTitle: "Yes", disabledTitle: "No",
                description: "Browsers require muted for autoplay. Visitors can unmute with the sound button.",
            },
            startTime: {
                type: ControlType.Number, title: "Start time",
                defaultValue: 0, min: 0, step: 1, unit: "s",
                description: "YouTube URLs with ?t= override this per video.",
            },
            loop: { type: ControlType.Boolean, title: "Loop carousel", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
            autoPlay: { type: ControlType.Boolean, title: "Auto-advance", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
            interval: { type: ControlType.Number, title: "Interval", defaultValue: 5, min: 1, max: 30, unit: "s", hidden: (props) => !props.autoPlay },
            pauseOnHover: { type: ControlType.Boolean, title: "Pause on hover", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No", hidden: (props) => !props.autoPlay },
            privacy: {
                type: ControlType.Boolean, title: "Privacy mode",
                defaultValue: true, enabledTitle: "On", disabledTitle: "Off",
                description: "Uses youtube-nocookie.com so YouTube sets no tracking cookies before play. Vimeo always loads with Do Not Track.",
            },
        },
    },
    sound: {
        type: ControlType.Object, title: "🔊 Sound button",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
            corner: {
                type: ControlType.Enum, title: "Position",
                options: ["top-right", "top-left", "bottom-right", "bottom-left"],
                optionTitles: ["Top right", "Top left", "Bottom right", "Bottom left"],
                defaultValue: "top-right",
                description: "Top corners avoid overlapping the YouTube/Vimeo control bars.",
                hidden: (props) => !props.show,
            },
            size: { type: ControlType.Number, title: "Size", defaultValue: 40, min: 24, max: 80, unit: "px", hidden: (props) => !props.show },
            margin: { type: ControlType.Number, title: "Margin", defaultValue: 12, min: 0, max: 60, unit: "px", hidden: (props) => !props.show },
            iconColor: { type: ControlType.Color, title: "Icon color", defaultValue: "#FFFFFF", hidden: (props) => !props.show },
            background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0,0,0,0.45)", hidden: (props) => !props.show },
        },
    },
    card: {
        type: ControlType.Object, title: "Style",
        controls: {
            radius: { type: ControlType.Number, title: "Corner radius", defaultValue: 0, min: 0, max: 60, unit: "px" },
            loadingColor: { type: ControlType.Color, title: "Loading color", defaultValue: "#0A0A0A" },
            borderShow: { type: ControlType.Boolean, title: "Border", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            borderColor: { type: ControlType.Color, title: "Border color", defaultValue: "#1A1A1A", hidden: (props) => !props.borderShow },
            borderWidth: { type: ControlType.Number, title: "Border width", defaultValue: 2, min: 1, max: 10, unit: "px", hidden: (props) => !props.borderShow },
        },
    },
    dots: {
        type: ControlType.Object, title: "Dots",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
            activeFill: { type: ControlType.Color, title: "Active color", defaultValue: "#FFFFFF", hidden: (props) => !props.show },
            fill: { type: ControlType.Color, title: "Inactive color", defaultValue: "#FFFFFF", hidden: (props) => !props.show },
            size: { type: ControlType.Number, title: "Dot size", defaultValue: 8, min: 4, max: 30, unit: "px", hidden: (props) => !props.show },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: 8, min: 2, max: 40, unit: "px", hidden: (props) => !props.show },
            inset: { type: ControlType.Number, title: "Space below videos", defaultValue: 16, min: 0, max: 60, unit: "px", hidden: (props) => !props.show },
        },
    },
    motionFeel: {
        type: ControlType.Enum, title: "Motion",
        options: ["smooth", "natural", "snappy", "bouncy"],
        optionTitles: ["😌 Smooth", "✨ Natural", "⚡ Snappy", "🏀 Bouncy"],
        defaultValue: "natural",
    },
})
