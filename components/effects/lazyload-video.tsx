/**
 * LazyLoad Video — Framer Component
 *
 * Providers  : YouTube · Vimeo · CDN URL · Upload (via side panel, ≤25 MB)
 * Controls   : Custom glassmorphism bar for CDN / Upload providers
 *              (YouTube & Vimeo are cross-origin — native controls only)
 * Features   : Lazy loading, custom thumbnail, hide play button,
 *              adjustable play-button radius, auto-play-on-activate for iframes
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


// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = "youtube" | "vimeo" | "cdn" | "upload"
type LoadMode = "onViewOrClick" | "onView" | "onClick"
type Aspect = "16:9" | "9:16" | "1:1" | "4:3"
type ThumbQ = "hqdefault" | "mqdefault" | "maxresdefault"

interface LoadSettings {
    loadMode: LoadMode
    eagerMargin: number
    aspect: Aspect
    thumbnailQuality: ThumbQ
}
interface Appearance {
    rounded: number
    borderWidth: number
    borderColor: string
    shadow: number
    overlayOpacity: number
    overlayColor: string
}
interface PlayButton {
    showPlayButton: boolean
    playSize: number
    playRadius: number
    playGlassOpacity: number
    playGlassBlur: number
    playBorderOpacity: number
    playIconColor: string
    playIconOpacity: number
}
interface VideoOptions {
    autoplay: boolean
    mute: boolean
    loop: boolean
    showControls: boolean
    captions: boolean
    nocookie: boolean
}
interface CustomThumb {
    enabled: boolean
    image: string
}
interface Props {
    provider: Provider
    videoLink: string
    uploadedVideo: string // ControlType.File → resolved URL from Framer asset pipeline
    customThumb: CustomThumb
    loadSettings: LoadSettings
    appearance: Appearance
    playButton: PlayButton
    videoOptions: VideoOptions
    showTitleOnHover: boolean
}

// ─── Utils ────────────────────────────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n))

function withAlpha(color: string, alpha: number): string {
    const a = clamp(alpha, 0, 1)
    if (!color) return `rgba(0,0,0,${a})`
    const c = color.trim()
    if (c.startsWith("rgba(")) return c.replace(/,\s*[\d.]+\)$/, `,${a})`)
    if (c.startsWith("rgb("))
        return c.replace("rgb(", "rgba(").replace(")", `,${a})`)
    const h = c.replace("#", "")
    const short = h.length === 3
    const r = parseInt(short ? h[0] + h[0] : h.slice(0, 2), 16)
    const g = parseInt(short ? h[1] + h[1] : h.slice(2, 4), 16)
    const b = parseInt(short ? h[2] + h[2] : h.slice(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${a})`
    return `rgba(${r},${g},${b},${a})`
}

function parseYouTubeId(raw: string): string | null {
    if (!raw) return null
    raw = raw.trim()
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw
    try {
        const u = new URL(raw)
        if (u.hostname.includes("youtu.be")) {
            const id = u.pathname.slice(1).split("?")[0]
            if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id
        }
        const v = u.searchParams.get("v")
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
        const parts = u.pathname.split("/").filter(Boolean)
        for (const k of ["embed", "shorts", "live"]) {
            const i = parts.indexOf(k)
            if (i >= 0) {
                const id = parts[i + 1]?.split("?")[0]
                if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
            }
        }
    } catch {}
    return (
        raw.match(
            /(?:v=|\/embed\/|youtu\.be\/|\/shorts\/|\/live\/)([a-zA-Z0-9_-]{11})/
        )?.[1] ?? null
    )
}

function parseVimeoId(raw: string): string | null {
    if (!raw) return null
    raw = raw.trim()
    if (/^\d+$/.test(raw)) return raw
    try {
        const u = new URL(raw)
        const parts = u.pathname.split("/").filter(Boolean)
        for (let i = parts.length - 1; i >= 0; i--) {
            if (/^\d+$/.test(parts[i])) return parts[i]
        }
    } catch {}
    return raw.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] ?? null
}

function aspectPad(a: Aspect) {
    return (
        (
            { "16:9": 56.25, "9:16": 177.78, "1:1": 100, "4:3": 75 } as Record<
                Aspect,
                number
            >
        )[a] ?? 56.25
    )
}

function fmt(s: number) {
    if (!isFinite(s) || s < 0) return "0:00"
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IPlay = () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M8.5 6.5v11c0 .83.94 1.3 1.6.8l8-5.5c.57-.39.57-1.21 0-1.6l-8-5.5c-.66-.5-1.6-.03-1.6.8Z" />
    </svg>
)
const IPause = () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M7 5h3v14H7zm7 0h3v14h-3z" />
    </svg>
)
const IVol = () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
)
const IMute = () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
    </svg>
)
const ILoop = ({ on }: { on: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="currentColor"
        opacity={on ? 1 : 0.4}
    >
        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
)
const IFS = () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
)

// ─── Ctrl button ──────────────────────────────────────────────────────────────

function Btn({
    onClick,
    children,
    style,
    title,
}: {
    onClick: () => void
    children: React.ReactNode
    style?: React.CSSProperties
    title?: string
}) {
    return (
        <button
            title={title}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                color: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                lineHeight: 1,
                flexShrink: 0,
                ...style,
            }}
        >
            {children}
        </button>
    )
}

// ─── Glassmorphism control bar ────────────────────────────────────────────────

interface ControlBarProps {
    videoRef: React.RefObject<HTMLVideoElement>
    containerRef: React.RefObject<HTMLElement>
    visible: boolean
    title: string
    showTitle: boolean
}

function ControlBar({
    videoRef,
    containerRef,
    visible,
    title,
    showTitle,
}: ControlBarProps) {
    const [playing, setPlaying] = React.useState(false)
    const [muted, setMuted] = React.useState(false)
    const [loop, setLoop] = React.useState(false)
    const [cur, setCur] = React.useState(0)
    const [dur, setDur] = React.useState(0)
    const [speed, setSpeed] = React.useState(1)
    const [seeking, setSeeking] = React.useState(false)
    const [speedOpen, setSpeedOpen] = React.useState(false)
    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const pct = dur > 0 ? (cur / dur) * 100 : 0

    React.useEffect(() => {
        const v = videoRef.current
        if (!v) return
        const onPlay = () => setPlaying(true)
        const onPause = () => setPlaying(false)
        const onTime = () => {
            if (!seeking) setCur(v.currentTime)
        }
        const onMeta = () => {
            setDur(v.duration)
            setMuted(v.muted)
            setLoop(v.loop)
        }
        v.addEventListener("play", onPlay)
        v.addEventListener("pause", onPause)
        v.addEventListener("timeupdate", onTime)
        v.addEventListener("loadedmetadata", onMeta)
        return () => {
            v.removeEventListener("play", onPlay)
            v.removeEventListener("pause", onPause)
            v.removeEventListener("timeupdate", onTime)
            v.removeEventListener("loadedmetadata", onMeta)
        }
    }, [videoRef, seeking])

    const togglePlay = () => {
        const v = videoRef.current
        if (!v) return
        v.paused ? v.play() : v.pause()
    }
    const toggleMute = () => {
        const v = videoRef.current
        if (!v) return
        v.muted = !v.muted
        setMuted(v.muted)
    }
    const toggleLoop = () => {
        const v = videoRef.current
        if (!v) return
        v.loop = !v.loop
        setLoop(v.loop)
    }
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = videoRef.current
        if (!v) return
        const t = Number(e.target.value)
        v.currentTime = t
        setCur(t)
    }
    const setPs = (s: number) => {
        const v = videoRef.current
        if (v) v.playbackRate = s
        setSpeed(s)
        setSpeedOpen(false)
    }
    const goFS = () => {
        const el = containerRef.current as HTMLElement | null
        if (!el) return
        document.fullscreenElement
            ? document.exitFullscreen()
            : el.requestFullscreen?.()
    }

    return (
        <div
            style={{
                position: "absolute",
                left: 10,
                right: 10,
                bottom: 10,
                borderRadius: 14,
                background: "rgba(10,10,10,0.42)",
                backdropFilter: "blur(24px) saturate(1.5)",
                WebkitBackdropFilter: "blur(24px) saturate(1.5)",
                border: "1px solid rgba(255,255,255,0.13)",
                boxShadow:
                    "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
                padding: "10px 12px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 9,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transition:
                    "opacity 200ms ease, transform 220ms cubic-bezier(0.22,1,0.36,1)",
                pointerEvents: visible ? "all" : "none",
                userSelect: "none",
            }}
        >
            {/* Progress bar */}
            <div style={{ position: "relative", height: 4, cursor: "pointer" }}>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 99,
                        background: "rgba(255,255,255,0.18)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${pct}%`,
                        borderRadius: 99,
                        background: "rgba(255,255,255,0.9)",
                        transition: seeking ? "none" : "width 150ms linear",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: `${pct}%`,
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        background: "#fff",
                        transform: "translate(-50%,-50%)",
                        boxShadow: "0 1px 5px rgba(0,0,0,0.5)",
                        transition: seeking ? "none" : "left 150ms linear",
                    }}
                />
                <input
                    type="range"
                    min={0}
                    max={dur || 100}
                    step={0.05}
                    value={cur}
                    onMouseDown={() => setSeeking(true)}
                    onMouseUp={() => setSeeking(false)}
                    onChange={handleSeek}
                    style={{
                        position: "absolute",
                        inset: "-10px 0",
                        width: "100%",
                        opacity: 0,
                        cursor: "pointer",
                        margin: 0,
                    }}
                />
            </div>

            {/* Controls row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "rgba(255,255,255,0.9)",
                }}
            >
                <Btn onClick={togglePlay} title={playing ? "Pause" : "Play"}>
                    <div style={{ width: 16, height: 16 }}>
                        {playing ? <IPause /> : <IPlay />}
                    </div>
                </Btn>
                <Btn onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
                    <div style={{ width: 18, height: 18 }}>
                        {muted ? <IMute /> : <IVol />}
                    </div>
                </Btn>
                <span
                    style={{
                        fontSize: 11,
                        fontVariantNumeric: "tabular-nums",
                        fontFamily: "ui-monospace,monospace",
                        color: "rgba(255,255,255,0.65)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {fmt(cur)}&nbsp;/&nbsp;{fmt(dur)}
                </span>

                <div style={{ flex: 1, minWidth: 0 }} />

                {showTitle && title && (
                    <span
                        style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.55)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 130,
                            flexShrink: 1,
                        }}
                    >
                        {title}
                    </span>
                )}

                {/* Speed picker */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                    {speedOpen && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "calc(100% + 8px)",
                                right: 0,
                                background: "rgba(16,16,16,0.96)",
                                backdropFilter: "blur(18px)",
                                WebkitBackdropFilter: "blur(18px)",
                                border: "1px solid rgba(255,255,255,0.11)",
                                borderRadius: 11,
                                overflow: "hidden",
                                minWidth: 72,
                                boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
                            }}
                        >
                            {SPEEDS.map((s) => (
                                <div
                                    key={s}
                                    onClick={() => setPs(s)}
                                    style={{
                                        padding: "7px 16px",
                                        fontSize: 12,
                                        textAlign: "center",
                                        color:
                                            s === speed
                                                ? "#fff"
                                                : "rgba(255,255,255,0.45)",
                                        background:
                                            s === speed
                                                ? "rgba(255,255,255,0.1)"
                                                : "transparent",
                                        cursor: "pointer",
                                    }}
                                >
                                    {s}×
                                </div>
                            ))}
                        </div>
                    )}
                    <Btn
                        onClick={() => setSpeedOpen((o) => !o)}
                        style={{
                            padding: "3px 9px",
                            borderRadius: 7,
                            background: speedOpen
                                ? "rgba(255,255,255,0.2)"
                                : "rgba(255,255,255,0.1)",
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        {speed}×
                    </Btn>
                </div>

                <Btn onClick={toggleLoop} title="Loop">
                    <div style={{ width: 18, height: 18 }}>
                        <ILoop on={loop} />
                    </div>
                </Btn>
                <Btn onClick={goFS} title="Fullscreen">
                    <div style={{ width: 18, height: 18 }}>
                        <IFS />
                    </div>
                </Btn>
            </div>
        </div>
    )
}

// ─── Native video player (CDN / Upload) ──────────────────────────────────────

interface NativePlayerProps {
    src: string
    autoplay: boolean
    initMuted: boolean
    initLoop: boolean
    showControls: boolean
    title: string
    showTitle: boolean
}

function NativePlayer({
    src,
    autoplay,
    initMuted,
    initLoop,
    showControls,
    title,
    showTitle,
}: NativePlayerProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const [ctrlVis, setCtrlVis] = React.useState(false)
    const [playing, setPlaying] = React.useState(autoplay)

    const showCtrl = React.useCallback(() => {
        setCtrlVis(true)
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => setCtrlVis(false), 2600)
    }, [])
    const hideCtrl = React.useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        setCtrlVis(false)
    }, [])
    const pauseHide = React.useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
    }, [])
    const resumeHide = React.useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => setCtrlVis(false), 2600)
    }, [])

    const togglePlay = React.useCallback(() => {
        const v = videoRef.current
        if (!v) return
        v.paused ? v.play() : v.pause()
    }, [])

    return (
        <div
            ref={wrapRef}
            style={{ position: "absolute", inset: 0, background: "#000" }}
            onMouseMove={showCtrl}
            onMouseLeave={hideCtrl}
        >
            <video
                ref={videoRef}
                src={src}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    cursor: "pointer",
                }}
                autoPlay={autoplay}
                muted={initMuted}
                loop={initLoop}
                playsInline
                controls={false}
                onClick={togglePlay}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
            />

            {/* Centre pause indicator */}
            {!playing && (
                <div
                    onClick={togglePlay}
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                    }}
                >
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: 16,
                            background: "rgba(255,255,255,0.14)",
                            backdropFilter: "blur(18px)",
                            WebkitBackdropFilter: "blur(18px)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            display: "grid",
                            placeItems: "center",
                            boxShadow: "0 8px 36px rgba(0,0,0,0.4)",
                            color: "#fff",
                        }}
                    >
                        <div style={{ width: 24, height: 24, marginLeft: 0 }}>
                            <IPlay />
                        </div>
                    </div>
                </div>
            )}

            {/* Glassy control bar */}
            {showControls && (
                <div
                    onMouseEnter={pauseHide}
                    onMouseLeave={resumeHide}
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                >
                    <ControlBar
                        videoRef={videoRef}
                        containerRef={wrapRef as React.RefObject<HTMLElement>}
                        visible={ctrlVis}
                        title={title}
                        showTitle={showTitle}
                    />
                </div>
            )}
        </div>
    )
}

// ─── Poster ───────────────────────────────────────────────────────────────────

interface PosterProps {
    thumbSrc: string
    overlayColor: string
    showPlayButton: boolean
    playSize: number
    playRadius: number
    glassOpacity: number
    glassBlur: number
    borderOpacity: number
    iconColor: string
    iconOpacity: number
    title: string
    clickable: boolean
    onActivate: () => void
}

function Poster(p: PosterProps) {
    const [hov, setHov] = React.useState(false)
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                cursor: p.clickable ? "pointer" : "default",
                userSelect: "none",
            }}
            role={p.clickable ? "button" : undefined}
            tabIndex={p.clickable ? 0 : undefined}
            onClick={p.clickable ? p.onActivate : undefined}
            onKeyDown={(e) => {
                if (p.clickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    p.onActivate()
                }
            }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            aria-label={p.clickable ? "Play video" : undefined}
        >
            {p.thumbSrc ? (
                <img
                    src={p.thumbSrc}
                    alt=""
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "#181818",
                    }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: p.overlayColor,
                }}
            />

            {p.showPlayButton && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            width: p.playSize,
                            height: p.playSize,
                            borderRadius: p.playRadius,
                            background: `rgba(255,255,255,${clamp(p.glassOpacity, 0, 1)})`,
                            backdropFilter: `blur(${p.glassBlur}px)`,
                            WebkitBackdropFilter: `blur(${p.glassBlur}px)`,
                            border: `1px solid rgba(255,255,255,${clamp(p.borderOpacity, 0, 1)})`,
                            display: "grid",
                            placeItems: "center",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                            transform: hov ? "scale(1.1)" : "scale(1)",
                            transition:
                                "transform 180ms cubic-bezier(0.34,1.56,0.64,1)",
                            color: p.iconColor,
                        }}
                    >
                        <div
                            style={{
                                width: Math.round(p.playSize * 0.44),
                                height: Math.round(p.playSize * 0.44),
                                opacity: clamp(p.iconOpacity, 0, 1),
                                marginLeft: -Math.round(p.playSize * 0.02),
                            }}
                        >
                            <IPlay />
                        </div>
                    </div>
                </div>
            )}

            {p.title && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 10,
                        right: 10,
                        bottom: 10,
                        padding: "8px 12px",
                        borderRadius: 10,
                        background: "rgba(0,0,0,0.48)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 12,
                        lineHeight: "16px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        opacity: hov ? 1 : 0,
                        transform: hov ? "translateY(0)" : "translateY(6px)",
                        transition: "opacity 180ms ease, transform 180ms ease",
                        pointerEvents: "none",
                    }}
                >
                    {p.title}
                </div>
            )}
        </div>
    )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const HINTS: Record<Provider, string> = {
    youtube: "Paste a YouTube link or video ID in the side panel",
    vimeo: "Paste a Vimeo link or video ID in the side panel",
    cdn: "Paste a direct video URL in the side panel",
    upload: "Upload a video file in the side panel",
}

function EmptyState({ provider }: { provider: Provider }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                padding: 20,
                textAlign: "center",
                color: "rgba(255,255,255,0.35)",
                fontSize: 12,
                lineHeight: "20px",
                background: "rgba(255,255,255,0.03)",
            }}
        >
            {HINTS[provider]}
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LazyLoadVideo(props: Props) {
    const {
        provider,
        videoLink,
        uploadedVideo,
        customThumb,
        loadSettings,
        appearance,
        playButton,
        videoOptions,
        showTitleOnHover,
    } = props

    const {
        loadMode = "onViewOrClick",
        eagerMargin = 300,
        aspect = "16:9",
        thumbnailQuality = "hqdefault",
    } = loadSettings ?? {}
    const {
        rounded = 18,
        borderWidth = 1,
        borderColor = "rgba(255,255,255,0.15)",
        shadow = 18,
        overlayOpacity = 0.2,
        overlayColor = "#000000",
    } = appearance ?? {}
    const {
        showPlayButton = true,
        playSize = 78,
        playRadius = 22,
        playGlassOpacity = 0.18,
        playGlassBlur = 16,
        playBorderOpacity = 0.32,
        playIconColor = "#ffffff",
        playIconOpacity = 0.95,
    } = playButton ?? {}
    const {
        autoplay = false,
        mute = true,
        loop = false,
        showControls = true,
        captions = false,
        nocookie = true,
    } = videoOptions ?? {}

    const containerRef = React.useRef<HTMLDivElement>(null)
    const [inView, setInView] = React.useState(false)
    const [activated, setActivated] = React.useState(false)
    const [clickActivated, setClickActivated] = React.useState(false)
    const [autoThumb, setAutoThumb] = React.useState("")
    const [title, setTitle] = React.useState("")

    // Resolve video source
    const videoId = React.useMemo(() => {
        if (provider === "upload") return uploadedVideo?.trim() || null
        if (!videoLink?.trim()) return null
        if (provider === "youtube") return parseYouTubeId(videoLink)
        if (provider === "vimeo") return parseVimeoId(videoLink)
        return videoLink.trim()
    }, [provider, videoLink, uploadedVideo])

    const hasVideo = Boolean(videoId)
    const isCDNlike = provider === "cdn" || provider === "upload"
    const thumbSrc =
        customThumb?.enabled && customThumb?.image
            ? customThumb.image
            : autoThumb

    const shouldLoad = React.useMemo(() => {
        if (!hasVideo) return false
        if (loadMode === "onClick") return activated
        if (loadMode === "onView") return inView
        return inView || activated
    }, [hasVideo, loadMode, inView, activated])

    // Build iframe src — autoplay when user clicked (they have a gesture)
    const playerSrc = React.useMemo(() => {
        if (!videoId || isCDNlike) return ""
        if (provider === "youtube") {
            const base = nocookie
                ? "https://www.youtube-nocookie.com/embed/"
                : "https://www.youtube.com/embed/"
            const p = new URLSearchParams({
                playsinline: "1",
                rel: "0",
                controls: showControls ? "1" : "0",
            })
            if (autoplay || clickActivated) p.set("autoplay", "1")
            if (mute) p.set("mute", "1")
            if (loop) {
                p.set("loop", "1")
                p.set("playlist", videoId)
            }
            if (captions) p.set("cc_load_policy", "1")
            return `${base}${videoId}?${p}`
        }
        if (provider === "vimeo") {
            const p = new URLSearchParams({
                playsinline: "1",
                controls: showControls ? "1" : "0",
            })
            if (autoplay || clickActivated) p.set("autoplay", "1")
            if (mute) p.set("muted", "1")
            if (loop) p.set("loop", "1")
            if (captions) p.set("texttrack", "en")
            return `https://player.vimeo.com/video/${videoId}?${p}`
        }
        return ""
    }, [
        videoId,
        provider,
        autoplay,
        mute,
        loop,
        showControls,
        captions,
        nocookie,
        clickActivated,
        isCDNlike,
    ])

    // IntersectionObserver
    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const margin = Math.max(0, eagerMargin)
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e?.isIntersecting) setInView(true)
            },
            { threshold: 0.1, rootMargin: `${margin}px 0px ${margin}px 0px` }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [eagerMargin])

    // First-frame thumbnail for uploaded / CDN videos
    React.useEffect(() => {
        if (!hasVideo || !isCDNlike) return
        if (customThumb?.enabled && customThumb?.image) return
        if (autoThumb) return

        const vid = document.createElement("video")
        vid.src = videoId!
        vid.muted = true
        vid.playsInline = true
        vid.preload = "metadata"
        vid.crossOrigin = "anonymous"

        const onSeeked = () => {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = vid.videoWidth || 640
                canvas.height = vid.videoHeight || 360
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height)
                    const url = canvas.toDataURL("image/jpeg", 0.85)
                    if (url && url !== "data:,") setAutoThumb(url)
                }
            } catch {}
            vid.src = ""
        }
        const onMeta = () => {
            vid.currentTime = 0.001
        }

        vid.addEventListener("loadedmetadata", onMeta)
        vid.addEventListener("seeked", onSeeked)
        vid.load()

        return () => {
            vid.removeEventListener("loadedmetadata", onMeta)
            vid.removeEventListener("seeked", onSeeked)
            vid.src = ""
        }
    }, [hasVideo, isCDNlike, videoId, customThumb, autoThumb])

    // Metadata fetch (YouTube / Vimeo only)
    React.useEffect(() => {
        if (!hasVideo || !inView || isCDNlike) return
        if (customThumb?.enabled && customThumb?.image) return
        const ctrl = new AbortController()
        ;(async () => {
            try {
                if (provider === "youtube" && videoId) {
                    setAutoThumb(
                        `https://i.ytimg.com/vi/${videoId}/${thumbnailQuality}.jpg`
                    )
                    if (showTitleOnHover) {
                        const r = await fetch(
                            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
                            { signal: ctrl.signal }
                        )
                        if (r.ok) {
                            const d = await r.json()
                            if (d?.title) setTitle(d.title)
                        }
                    }
                }
                if (provider === "vimeo" && videoId) {
                    const r = await fetch(
                        `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`,
                        { signal: ctrl.signal }
                    )
                    if (r.ok) {
                        const d = await r.json()
                        if (d?.thumbnail_url) setAutoThumb(d.thumbnail_url)
                        if (showTitleOnHover && d?.title) setTitle(d.title)
                    }
                }
            } catch {}
        })()
        return () => ctrl.abort()
    }, [
        hasVideo,
        inView,
        provider,
        videoId,
        thumbnailQuality,
        showTitleOnHover,
        customThumb,
        isCDNlike,
    ])

    const handleActivate = React.useCallback(
        (byClick = false) => {
            if (!hasVideo) return
            if (byClick) setClickActivated(true)
            setActivated(true)
        },
        [hasVideo]
    )

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 240,
                minHeight: 135,
                borderRadius: rounded,
                overflow: "hidden",
                border:
                    borderWidth > 0
                        ? `${borderWidth}px solid ${borderColor}`
                        : "none",
                boxShadow:
                    shadow > 0
                        ? `0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.22)`
                        : "none",
                background: "#0d0d0d",
                WebkitTapHighlightColor: "transparent",
            }}
            aria-label="Lazy loaded video"
        >
            <div
                style={{ position: "relative", width: "100%", height: "100%" }}
            >
                <div style={{ position: "absolute", inset: 0 }}>
                    {!hasVideo ? (
                        <EmptyState provider={provider} />
                    ) : shouldLoad ? (
                        isCDNlike ? (
                            <NativePlayer
                                key={videoId!}
                                src={videoId!}
                                autoplay={autoplay || clickActivated}
                                initMuted={mute}
                                initLoop={loop}
                                showControls={showControls}
                                title={showTitleOnHover ? title : ""}
                                showTitle={showTitleOnHover}
                            />
                        ) : (
                            <iframe
                                key={playerSrc}
                                src={playerSrc}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    display: "block",
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                loading="lazy"
                                title="Video player"
                            />
                        )
                    ) : (
                        <Poster
                            thumbSrc={thumbSrc}
                            overlayColor={withAlpha(
                                overlayColor,
                                overlayOpacity
                            )}
                            showPlayButton={showPlayButton}
                            playSize={playSize}
                            playRadius={playRadius}
                            glassOpacity={playGlassOpacity}
                            glassBlur={playGlassBlur}
                            borderOpacity={playBorderOpacity}
                            iconColor={playIconColor}
                            iconOpacity={playIconOpacity}
                            title={showTitleOnHover ? title : ""}
                            clickable={loadMode !== "onView" && hasVideo}
                            onActivate={() => handleActivate(true)}
                        />
                    )}
                </div>

                {/* Aspect spacer */}
                <div
                    aria-hidden="true"
                    style={{
                        width: "100%",
                        paddingTop: `${aspectPad(aspect)}%`,
                        opacity: 0,
                        pointerEvents: "none",
                    }}
                />
            </div>
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

LazyLoadVideo.defaultProps = {
    provider: "youtube",
    videoLink: "",
    uploadedVideo: "",
    customThumb: { enabled: false, image: "" },
    loadSettings: {
        loadMode: "onViewOrClick",
        eagerMargin: 300,
        aspect: "16:9",
        thumbnailQuality: "hqdefault",
    },
    appearance: {
        rounded: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        shadow: 18,
        overlayOpacity: 0.2,
        overlayColor: "#000000",
    },
    playButton: {
        showPlayButton: true,
        playSize: 78,
        playRadius: 22,
        playGlassOpacity: 0.18,
        playGlassBlur: 16,
        playBorderOpacity: 0.32,
        playIconColor: "#ffffff",
        playIconOpacity: 0.95,
    },
    videoOptions: {
        autoplay: false,
        mute: true,
        loop: false,
        showControls: true,
        captions: false,
        nocookie: true,
    },
    showTitleOnHover: true,
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(LazyLoadVideo, {
    provider: {
        type: ControlType.Enum,
        title: "Provider",
        options: ["youtube", "vimeo", "cdn", "upload"],
        optionTitles: ["YouTube", "Vimeo", "CDN / URL", "Upload"],
    },

    videoLink: {
        type: ControlType.String,
        title: "Video URL",
        placeholder: "Paste link or ID",
        hidden: (p: Props) => p.provider === "upload",
    },

    // ← This is the file picker that lives in the side panel
    uploadedVideo: {
        type: ControlType.File,
        title: "Video File",
        allowedFileTypes: ["mp4", "webm", "mov", "m4v", "ogg"],
        hidden: (p: Props) => p.provider !== "upload",
    },

    customThumb: {
        type: ControlType.Object,
        title: "Thumbnail",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Custom Image",
                defaultValue: false,
            },
            image: {
                type: ControlType.Image,
                title: "Image",
                hidden: (p: CustomThumb) => !p.enabled,
            },
        },
    },

    loadSettings: {
        type: ControlType.Object,
        title: "Loading",
        controls: {
            loadMode: {
                type: ControlType.Enum,
                title: "Trigger",
                options: ["onViewOrClick", "onView", "onClick"],
                optionTitles: ["View or Click", "On View", "On Click"],
                defaultValue: "onViewOrClick",
            },
            eagerMargin: {
                type: ControlType.Number,
                title: "Eager px",
                min: 0,
                max: 1200,
                step: 25,
                displayStepper: true,
                defaultValue: 300,
            },
            aspect: {
                type: ControlType.Enum,
                title: "Aspect",
                options: ["16:9", "9:16", "1:1", "4:3"],
                displaySegmentedControl: true,
                defaultValue: "16:9",
            },
            thumbnailQuality: {
                type: ControlType.Enum,
                title: "Thumb",
                options: ["hqdefault", "mqdefault", "maxresdefault"],
                optionTitles: ["HQ", "MQ", "Max"],
                defaultValue: "hqdefault",
                hidden: (p: LoadSettings) => false, // always show; CDN/upload just won't use it
            },
        },
    },

    videoOptions: {
        type: ControlType.Object,
        title: "Video Options",
        controls: {
            showControls: {
                type: ControlType.Boolean,
                title: "Controls",
                defaultValue: true,
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
            },
            mute: {
                type: ControlType.Boolean,
                title: "Mute",
                defaultValue: true,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: false,
            },
            captions: {
                type: ControlType.Boolean,
                title: "Captions",
                defaultValue: false,
            },
            nocookie: {
                type: ControlType.Boolean,
                title: "No Cookie",
                defaultValue: true,
            },
        },
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            rounded: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 64,
                step: 1,
                defaultValue: 18,
            },
            shadow: {
                type: ControlType.Number,
                title: "Shadow",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 18,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border W",
                min: 0,
                max: 6,
                step: 1,
                defaultValue: 1,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border C",
                defaultValue: "rgba(255,255,255,0.15)",
            },
            overlayOpacity: {
                type: ControlType.Number,
                title: "Overlay",
                min: 0,
                max: 0.9,
                step: 0.01,
                defaultValue: 0.2,
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Overlay C",
                defaultValue: "#000000",
            },
        },
    },

    playButton: {
        type: ControlType.Object,
        title: "Play Button",
        controls: {
            showPlayButton: {
                type: ControlType.Boolean,
                title: "Show Button",
                defaultValue: true,
            },
            playSize: {
                type: ControlType.Number,
                title: "Size",
                min: 44,
                max: 140,
                step: 1,
                defaultValue: 78,
            },
            playRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 22,
            },
            playGlassOpacity: {
                type: ControlType.Number,
                title: "Glass Fill",
                min: 0,
                max: 0.6,
                step: 0.01,
                defaultValue: 0.18,
            },
            playGlassBlur: {
                type: ControlType.Number,
                title: "Glass Blur",
                min: 0,
                max: 30,
                step: 1,
                defaultValue: 16,
            },
            playBorderOpacity: {
                type: ControlType.Number,
                title: "Glass Border",
                min: 0,
                max: 0.9,
                step: 0.01,
                defaultValue: 0.32,
            },
            playIconColor: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#ffffff",
            },
            playIconOpacity: {
                type: ControlType.Number,
                title: "Icon Alpha",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.95,
            },
        },
    },

    showTitleOnHover: {
        type: ControlType.Boolean,
        title: "Title on Hover",
        defaultValue: true,
    },
    _contact: {
        type: ControlType.Link,
        title: "Need help?",
        defaultValue: "zlatkomarjanovic.zm@gmail.com",
    },
})
