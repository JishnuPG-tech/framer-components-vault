// User request: Create a Framer-native "VideoCard" futuristic HUD-style video player card with video state syncing, segmented seek bar, keyboard seek, hover tilt, HUD badges, accent-driven styling, static canvas preview behavior, accessibility labels, and full property controls.
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

import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion"

interface MyComponentProps {
    src?: string
    poster?: {
        src?: string
        srcSet?: string
        alt?: string
    }
    autoPlay: boolean
    loop: boolean
    muted: boolean
    enableTilt: boolean
    tiltMax: number
    showControls: boolean
    segments: number
    secondsPerTick: number
    accentColor: string
    cardBgColor: string
    cardShadow: string
    ariaLabel: string
    style?: React.CSSProperties
}

function hexToRgb(value: string): string {
    if (!value || typeof value !== "string") return "126, 172, 181"
    const normalized = value.trim().replace("#", "")
    if (!/^[\da-fA-F]{3,8}$/.test(normalized)) return "126, 172, 181"
    const short = normalized.length === 3 || normalized.length === 4
    const hex = short
        ? normalized
              .split("")
              .map((c) => c + c)
              .join("")
        : normalized
    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)
    if ([r, g, b].some((n) => Number.isNaN(n))) return "126, 172, 181"
    return `${r}, ${g}, ${b}`
}

function formatHudTime(seconds: number): string {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
    const mins = Math.floor(safe / 60)
    const secs = Math.floor(safe % 60)
    const centis = Math.floor((safe % 1) * 100)
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(centis).padStart(2, "0")}`
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VideoCard(props: MyComponentProps) {
    const {
        src = "",
        poster,
        autoPlay,
        loop,
        muted,
        enableTilt,
        tiltMax,
        showControls,
        segments,
        secondsPerTick = 0,
        accentColor,
        cardBgColor,
        cardShadow = "0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(var(--videocard-accent-rgb), 0.06)",
        ariaLabel,
        style,
    } = props

    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const cardRef = React.useRef<HTMLDivElement | null>(null)
    const seekRef = React.useRef<HTMLDivElement | null>(null)

    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const disableInteractivePlayback = isStaticRenderer || isCanvas
    const reducedMotion = useReducedMotion()
    const isInView = useInView(cardRef, { once: false, amount: 0.2 })

    const [isHovered, setIsHovered] = React.useState(false)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [isMuted, setIsMuted] = React.useState(muted)
    const [volume, setVolume] = React.useState(muted ? 0 : 0.8)
    const [progress, setProgress] = React.useState(0)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [seekFocused, setSeekFocused] = React.useState(false)
    const [seekWidth, setSeekWidth] = React.useState(320)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springX = useSpring(mouseX, { stiffness: 200, damping: 30, mass: 0.5 })
    const springY = useSpring(mouseY, { stiffness: 200, damping: 30, mass: 0.5 })

    React.useEffect(() => {
        const node = videoRef.current
        if (!node) return

        node.muted = muted
        if (!muted) node.volume = volume
    }, [muted, volume])

    React.useEffect(() => {
        if (disableInteractivePlayback) return
        if (typeof window === "undefined") return
        const node = seekRef.current
        if (!node) return
        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect?.width ?? 0
            React.startTransition(() => {
                setSeekWidth(width > 0 ? width : 320)
            })
        })

        observer.observe(node)
        return () => {
            observer.disconnect()
        }
    }, [disableInteractivePlayback])

    React.useEffect(() => {
        const node = videoRef.current
        if (!node) return

        const onTimeUpdate = () => {
            const d = Number.isFinite(node.duration) ? node.duration : 0
            const ct = Number.isFinite(node.currentTime) ? node.currentTime : 0
            const nextProgress = d > 0 ? (ct / d) * 100 : 0
            React.startTransition(() => {
                setCurrentTime(ct)
                setProgress(nextProgress)
            })
        }

        const onDurationChange = () => {
            const d = Number.isFinite(node.duration) ? node.duration : 0
            React.startTransition(() => {
                setDuration(d)
            })
        }

        const onPlay = () => {
            React.startTransition(() => {
                setIsPlaying(true)
            })
        }

        const onPause = () => {
            React.startTransition(() => {
                setIsPlaying(false)
            })
        }

        const onVolumeChange = () => {
            React.startTransition(() => {
                setIsMuted(node.muted)
                setVolume(node.volume)
            })
        }

        node.addEventListener("timeupdate", onTimeUpdate)
        node.addEventListener("durationchange", onDurationChange)
        node.addEventListener("play", onPlay)
        node.addEventListener("pause", onPause)
        node.addEventListener("volumechange", onVolumeChange)

        onDurationChange()
        onTimeUpdate()
        onVolumeChange()

        return () => {
            node.removeEventListener("timeupdate", onTimeUpdate)
            node.removeEventListener("durationchange", onDurationChange)
            node.removeEventListener("play", onPlay)
            node.removeEventListener("pause", onPause)
            node.removeEventListener("volumechange", onVolumeChange)
        }
    }, [])

    React.useEffect(() => {
        if (disableInteractivePlayback) return
        const node = videoRef.current
        if (!node) return

        if (!isInView) {
            if (isPlaying) {
                node.pause()
                node.dataset.wasPlaying = "true"
            }
        } else {
            if (node.dataset.wasPlaying === "true") {
                node.dataset.wasPlaying = "false"
                void node.play().catch(() => {})
            }
        }
    }, [isInView, isPlaying, disableInteractivePlayback])

    const onTogglePlayback = React.useCallback(() => {
        if (disableInteractivePlayback) return
        const node = videoRef.current
        if (!node) return
        if (node.paused) {
            void node.play().catch(() => {})
        } else {
            node.pause()
        }
    }, [disableInteractivePlayback])

    const onToggleMute = React.useCallback((event: React.MouseEvent) => {
        event.stopPropagation()
        const node = videoRef.current
        if (!node) return
        node.muted = !node.muted
        if (!node.muted && node.volume === 0) node.volume = 0.8
    }, [])

    const onVolumeInput = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        event.stopPropagation()
        const node = videoRef.current
        if (!node) return
        const next = Number.parseFloat(event.target.value)
        node.volume = next
        node.muted = next === 0
    }, [])

    const seekToRatio = React.useCallback((ratio: number) => {
        const node = videoRef.current
        if (!node || !Number.isFinite(node.duration) || node.duration <= 0) return
        const clamped = Math.min(1, Math.max(0, ratio))
        node.currentTime = clamped * node.duration
    }, [])

    const onSeekClick = React.useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation()
            const rect = seekRef.current?.getBoundingClientRect()
            if (!rect) return
            const ratio = (event.clientX - rect.left) / rect.width
            seekToRatio(ratio)
        },
        [seekToRatio]
    )

    const onSeekKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            const node = videoRef.current
            if (!node || duration <= 0) return
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
            event.preventDefault()
            event.stopPropagation()
            const delta = duration * 0.05
            const target = event.key === "ArrowRight" ? node.currentTime + delta : node.currentTime - delta
            seekToRatio(target / duration)
        },
        [duration, seekToRatio]
    )

    const onCardMouseMove = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (disableInteractivePlayback || !enableTilt || reducedMotion || !isInView) return
            const rect = cardRef.current?.getBoundingClientRect()
            if (!rect) return
            const px = (event.clientX - rect.left) / rect.width
            const py = (event.clientY - rect.top) / rect.height
            const rx = (0.5 - py) * tiltMax * 2
            const ry = (px - 0.5) * tiltMax * 2
            mouseX.set(Math.max(-tiltMax, Math.min(tiltMax, rx)))
            mouseY.set(Math.max(-tiltMax, Math.min(tiltMax, ry)))
        },
        [disableInteractivePlayback, enableTilt, isInView, mouseX, mouseY, reducedMotion, tiltMax]
    )

    const onCardMouseLeave = React.useCallback(() => {
        mouseX.set(0)
        mouseY.set(0)
        React.startTransition(() => {
            setIsHovered(false)
        })
    }, [mouseX, mouseY])

    const segmentedBars = React.useMemo(() => {
        const fallbackDuration = disableInteractivePlayback ? 120 : 0
        const effectiveDuration = duration > 0 ? duration : fallbackDuration
        const gap = 4
        const minPitch = 7
        const maxTicksBySpace = Math.max(8, Math.floor((seekWidth + gap) / minPitch))
        const autoSteps = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300]
        const overrideStep = secondsPerTick > 0 ? secondsPerTick : 0
        const resolvedStep =
            overrideStep > 0
                ? overrideStep
                : autoSteps.find((step) => Math.ceil(effectiveDuration / step) + 1 <= maxTicksBySpace) ?? autoSteps[autoSteps.length - 1]
        const countFromDuration =
            effectiveDuration > 0 ? Math.ceil(effectiveDuration / Math.max(0.01, resolvedStep)) + 1 : Math.max(8, Math.round(segments))
        const count = Math.max(8, Math.min(240, countFromDuration))
        const playedCount = Math.round((progress / 100) * (count - 1)) + 1
        return Array.from({ length: count }, (_, index) => index < playedCount)
    }, [disableInteractivePlayback, duration, progress, secondsPerTick, seekWidth, segments])

    const accentRgb = React.useMemo(() => hexToRgb(accentColor), [accentColor])
    const showPoster = !src
    const canAnimateTilt = !disableInteractivePlayback && enableTilt && !reducedMotion && isInView
    const cardWidth = style?.width === undefined ? 448 : style.width

    return (
        <motion.div
            ref={cardRef}
            onClick={onTogglePlayback}
            onMouseMove={onCardMouseMove}
            onMouseEnter={() => React.startTransition(() => setIsHovered(true))}
            onMouseLeave={onCardMouseLeave}
            whileHover={disableInteractivePlayback ? undefined : { scale: 1.02 }}
            style={{
                position: "relative",
                ["--videocard-accent" as string]: accentColor,
                ["--videocard-accent-rgb" as string]: accentRgb,
                width: cardWidth,
                maxWidth: "100%",
                borderRadius: 28,
                padding: 11,
                background: cardBgColor,
                backdropFilter: "blur(14px)",
                border: `1px solid ${isHovered ? `rgba(${accentRgb}, 0.25)` : "rgba(255,255,255,0.12)"}`,
                boxShadow: cardShadow,
                transformPerspective: 1500,
                transformStyle: "preserve-3d",
                rotateX: canAnimateTilt ? springX : 0,
                rotateY: canAnimateTilt ? springY : 0,
                cursor: disableInteractivePlayback ? "default" : "pointer",
                ...style,
            }}
            role="group"
            aria-label={ariaLabel}
        >
            <div
                style={{
                    pointerEvents: "none",
                    position: "absolute",
                    inset: 0,
                    borderRadius: 28,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
                    opacity: 0.45,
                    transition: "opacity 220ms ease",
                }}
            />

            {[
                { top: -6, left: -6, right: "auto", bottom: "auto", topEdge: true, leftEdge: true, rightEdge: false, bottomEdge: false, r: "10px 0 0 0", tx: -8, ty: -8 },
                { top: -6, right: -6, left: "auto", bottom: "auto", topEdge: true, leftEdge: false, rightEdge: true, bottomEdge: false, r: "0 10px 0 0", tx: 8, ty: -8 },
                { bottom: -6, left: -6, top: "auto", right: "auto", topEdge: false, leftEdge: true, rightEdge: false, bottomEdge: true, r: "0 0 0 10px", tx: -8, ty: 8 },
                { bottom: -6, right: -6, top: "auto", left: "auto", topEdge: false, leftEdge: false, rightEdge: true, bottomEdge: true, r: "0 0 10px 0", tx: 8, ty: 8 },
            ].map((corner, i) => (
                <motion.div
                    key={i}
                    animate={{
                        x: isHovered ? corner.tx : 0,
                        y: isHovered ? corner.ty : 0,
                        borderColor: isHovered ? accentColor : "rgba(255,255,255,0.25)"
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    style={{
                        position: "absolute",
                        width: 26,
                        height: 26,
                        top: corner.top as React.CSSProperties["top"],
                        left: corner.left as React.CSSProperties["left"],
                        right: corner.right as React.CSSProperties["right"],
                        bottom: corner.bottom as React.CSSProperties["bottom"],
                        borderRadius: corner.r,
                        borderTopStyle: corner.topEdge ? "solid" : "none",
                        borderRightStyle: corner.rightEdge ? "solid" : "none",
                        borderBottomStyle: corner.bottomEdge ? "solid" : "none",
                        borderLeftStyle: corner.leftEdge ? "solid" : "none",
                        borderTopWidth: corner.topEdge ? 2.5 : 0,
                        borderRightWidth: corner.rightEdge ? 2.5 : 0,
                        borderBottomWidth: corner.bottomEdge ? 2.5 : 0,
                        borderLeftWidth: corner.leftEdge ? 2.5 : 0,
                        pointerEvents: "none",
                    }}
                />
            ))}

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    borderRadius: 20,
                    overflow: "hidden",
                    background: "#050505",
                    boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)",
                }}
            >
                <video
                    ref={videoRef}
                    src={src || undefined}
                    poster={poster?.src}
                    autoPlay={!disableInteractivePlayback && autoPlay && !!src}
                    loop={loop}
                    muted={muted}
                    playsInline
                    preload="metadata"
                    aria-label={ariaLabel}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: isHovered ? 0.95 : 0.75,
                        transform: isHovered ? "scale(1.05)" : "scale(1)",
                        transition: "opacity 250ms ease, transform 250ms ease",
                        background: showPoster ? "#060606" : "transparent",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: "radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "rgba(0,0,0,0.65)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        color: "rgba(235,235,235,0.9)",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                >
                    <motion.span
                        animate={isPlaying ? { opacity: [0.5, 1, 0.5], scale: [0.9, 1, 0.9] } : { opacity: 1, scale: 1 }}
                        transition={isPlaying ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                        style={{
                            width: 8,
                            height: 7,
                            borderRadius: 1,
                            background: isPlaying ? "#3BE374" : "rgba(230,230,230,0.85)",
                            boxShadow: isPlaying ? "0 0 8px rgba(59,227,116,0.65)" : "none",
                            flexShrink: 0,
                        }}
                    />
                    {isPlaying ? "ACTIVE" : "PAUSED"}
                </div>

                <div
                    style={{
                        position: "absolute",
                        right: 10,
                        bottom: 10,
                        padding: "5px 8px",
                        borderRadius: 6,
                        background: "rgba(20,20,20,0.85)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "rgba(240,240,240,0.95)",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 10,
                        lineHeight: 1,
                        letterSpacing: "0.05em",
                    }}
                >
                    ■ {formatHudTime(currentTime)} / {formatHudTime(duration)}
                </div>
            </div>

            {showControls && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        marginTop: 10,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "0 2px 2px",
                        background: "transparent",
                    }}
                >
                    <motion.button
                        type="button"
                        aria-label={isPlaying ? "Pause" : "Play"}
                        className="videocard-focus videocard-control-button"
                        onClick={(event) => {
                            event.stopPropagation()
                            onTogglePlayback()
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(255,255,255,0.06)",
                            color: "white",
                            cursor: "pointer",
                            outline: "none",
                            position: "relative",
                            padding: 0,
                            marginRight: 8,
                        }}
                    >
                        <motion.div
                            aria-hidden="true"
                            animate={{ rotate: isHovered ? 180 : 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                position: "absolute",
                                inset: -8,
                                pointerEvents: "none",
                                opacity: 0.55,
                            }}
                        >
                            <svg width="100%" height="100%" viewBox="0 0 56 56">
                                <circle
                                    cx="28"
                                    cy="28"
                                    r="25"
                                    stroke="rgba(255,255,255,0.45)"
                                    strokeWidth="1.5"
                                    strokeDasharray="2 3"
                                    fill="none"
                                />
                            </svg>
                        </motion.div>
                        <span style={{ position: "relative", zIndex: 1, display: "inline-flex" }}>
                            {isPlaying ? (
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="white" aria-hidden="true">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="white" aria-hidden="true" style={{ marginLeft: 1 }}>
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </span>
                    </motion.button>

                    <motion.button
                        type="button"
                        aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                        className="videocard-focus videocard-control-button"
                        onClick={onToggleMute}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(255,255,255,0.06)",
                            color: "white",
                            cursor: "pointer",
                            outline: "none",
                            position: "relative",
                            padding: 0,
                        }}
                    >
                        <motion.div
                            aria-hidden="true"
                            animate={{ rotate: isHovered ? 180 : 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                position: "absolute",
                                inset: -8,
                                pointerEvents: "none",
                                opacity: 0.55,
                            }}
                        >
                            <svg width="100%" height="100%" viewBox="0 0 46 46">
                                <circle
                                    cx="23"
                                    cy="23"
                                    r="20"
                                    stroke="rgba(255,255,255,0.45)"
                                    strokeWidth="1.5"
                                    strokeDasharray="2 3"
                                    fill="none"
                                />
                            </svg>
                        </motion.div>
                        <span style={{ position: "relative", zIndex: 1, display: "inline-flex" }}>
                            {isMuted || volume === 0 ? (
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            )}
                        </span>
                    </motion.button>

                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        aria-label="Volume"
                        onClick={(event) => event.stopPropagation()}
                        onChange={onVolumeInput}
                        className="videocard-range videocard-focus"
                        style={
                            {
                                width: 86,
                                ["--videocard-accent" as string]: accentColor,
                                ["--videocard-accent-rgb" as string]: accentRgb,
                                ["--volume-percent" as string]: `${(isMuted ? 0 : volume) * 100}%`,
                            } as React.CSSProperties
                        }
                    />

                    <div
                        ref={seekRef}
                        role="slider"
                        tabIndex={0}
                        className="videocard-focus"
                        aria-label="Seek slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress)}
                        onClick={onSeekClick}
                        onKeyDown={onSeekKeyDown}
                        onFocus={() => React.startTransition(() => setSeekFocused(true))}
                        onBlur={() => React.startTransition(() => setSeekFocused(false))}
                        style={{
                            flex: 1,
                            minWidth: 90,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            height: 16,
                            borderRadius: 8,
                            cursor: "pointer",
                            outline: "none",
                            boxShadow: seekFocused ? `0 0 0 2px rgba(${accentRgb}, 0.5)` : "none",
                        }}
                    >
                        {segmentedBars.map((active, index) => (
                            <span
                                key={index}
                                style={{
                                    width: 3,
                                    height: 14,
                                    borderRadius: 999,
                                    background: active ? "var(--videocard-accent)" : "rgba(255,255,255,0.16)",
                                    boxShadow: active ? `0 0 8px var(--videocard-accent), 0 0 2px var(--videocard-accent)` : "none",
                                    transition: "background 160ms ease, box-shadow 160ms ease",
                                    flexShrink: 0,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .videocard-range {
                    -webkit-appearance: none;
                    appearance: none;
                    background: linear-gradient(90deg, var(--videocard-accent) 0%, var(--videocard-accent) var(--volume-percent), rgba(255,255,255,0.12) var(--volume-percent), rgba(255,255,255,0.12) 100%);
                    height: 3px;
                    border-radius: 999px;
                    border: 1px solid rgba(255,255,255,0.14);
                    outline: none;
                }
                .videocard-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--videocard-accent);
                    box-shadow: 0 0 6px var(--videocard-accent);
                    border: 1px solid rgba(255,255,255,0.85);
                    cursor: pointer;
                }
                .videocard-range::-moz-range-thumb {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--videocard-accent);
                    box-shadow: 0 0 6px var(--videocard-accent);
                    border: 1px solid rgba(255,255,255,0.85);
                    cursor: pointer;
                }
                .videocard-focus:focus-visible {
                    box-shadow: 0 0 0 2px rgba(var(--videocard-accent-rgb), 0.65);
                }
                .videocard-control-button:hover {
                    border-color: rgba(var(--videocard-accent-rgb), 0.55) !important;
                    background: rgba(var(--videocard-accent-rgb), 0.15) !important;
                }
            `}</style>
        </motion.div>
    )
}

addPropertyControls(VideoCard, {
    src: {
        type: ControlType.File,
        title: "Source",
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    poster: {
        type: ControlType.ResponsiveImage,
        title: "Poster",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
    },
    enableTilt: {
        type: ControlType.Boolean,
        title: "Tilt",
        defaultValue: true,
    },
    tiltMax: {
        type: ControlType.Number,
        title: "Tilt Max",
        defaultValue: 12,
        min: 0,
        max: 30,
        step: 1,
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
    },
    segments: {
        type: ControlType.Number,
        title: "Segments",
        defaultValue: 40,
        min: 4,
        max: 80,
        step: 1,
    },
    secondsPerTick: {
        type: ControlType.Number,
        title: "Sec/Tick",
        defaultValue: 0,
        min: 0,
        max: 120,
        step: 1,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#7EACB5",
    },
    cardBgColor: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgba(0,0,0,0.4)",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Video player",
    },
    cardShadow: {
        type: ControlType.String,
        title: "Card Shadow",
        defaultValue: "0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(var(--videocard-accent-rgb), 0.06)",
    },
})