/**
 * 360 SPIN CAROUSEL — Framer component.
 *
 * 3D circular image carousel with CSS perspective transforms.
 * Drag to orbit — horizontal spins the wheel, vertical tilts the
 * camera. Arrow keys / nav dots animate smoothly to the target.
 *
 * Drag warp: grabbing the wheel zooms the whole scene out, and the
 * faster you drag the more it shrinks. Release and it settles back
 * to full scale while the inertia spin decays.
 *
 * Built by PONCE DE LEON STUDIO — https://linktr.ee/poncedeleon.studio
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

import React, { useCallback, useEffect, useRef, useState } from "react"

const DEFAULT_MEDIA = [
    {
        image: "https://picsum.photos/seed/fw1/400/500",
        alt: "Abstract landscape 1",
    },
    {
        image: "https://picsum.photos/seed/fw2/400/500",
        alt: "Abstract landscape 2",
    },
    {
        image: "https://picsum.photos/seed/fw3/400/500",
        alt: "Abstract landscape 3",
    },
    {
        image: "https://picsum.photos/seed/fw4/400/500",
        alt: "Abstract landscape 4",
    },
    {
        image: "https://picsum.photos/seed/fw5/400/500",
        alt: "Abstract landscape 5",
    },
    {
        image: "https://picsum.photos/seed/fw6/400/500",
        alt: "Abstract landscape 6",
    },
    {
        image: "https://picsum.photos/seed/fw7/400/500",
        alt: "Abstract landscape 7",
    },
    {
        image: "https://picsum.photos/seed/fw8/400/500",
        alt: "Abstract landscape 8",
    },
]

// Drag speed (deg/s) that produces full speed-shrink influence
const SPEED_NORM = 600
const MIN_ZOOM = 0.25
const IDLE_VEL_DECAY_MS = 80
const TILT_MIN = -90
const TILT_MAX = 90

function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function clampNum(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
}

function activeIndexFromAngle(a: number, n: number) {
    return ((Math.round((((-a % 360) + 360) % 360) / (360 / n)) % n) + n) % n
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */
export default function SpinCarousel(props: any) {
    const { media, style } = props
    const g = props.ferris || {}
    const gCard = props.card || {}
    const gMorph = props.morph || {}
    const gWarp = props.warp || {}
    const gNav = props.nav || {}
    const gVideo = props.video || {}
    const gColors = props.colors || {}

    const radius = g.radius ?? 280
    const perspective = g.perspective ?? 900
    const defaultTilt = g.tilt ?? 10
    const autoRotate = g.autoRotate ?? true
    const rotationSpeed = g.speed ?? 0.4
    const direction = g.direction ?? 1
    const showRing = g.ring ?? false
    const showHub = g.hub ?? false
    const orbitTilt = g.orbitTilt ?? true

    const cardW = gCard.width ?? 160
    const cardH = gCard.height ?? 200
    const cardRadius = gCard.radius ?? 12
    const showReflection = gCard.reflection ?? true
    const borderWidth = gCard.border ?? 0
    const borderColor = gCard.borderColor ?? "#ffffff20"
    const glowFront = gCard.glowFront ?? true

    const morphEnabled = gMorph.enabled ?? true
    const morphScale = gMorph.scale ?? 0.15
    const morphOpacity = gMorph.opacity ?? 0.6
    const morphBlur = gMorph.blur ?? 0

    const warpEnabled = gWarp.enabled ?? true
    const warpZoomOut = gWarp.zoomOut ?? 0.7
    const warpSpeedShrink = gWarp.speedShrink ?? 0.15
    const warpEase = gWarp.ease ?? 0.12

    const navStyle = gNav.style ?? "dots"
    const navGap = gNav.gap ?? 8
    const navOffset = gNav.offset ?? 24
    const navShowPrevNext = gNav.showPrevNext ?? false
    const animDuration = gNav.animDuration ?? 0.6

    const showPlayPause = gVideo.playPause ?? true

    const background = gColors.background ?? "#0a0a0c"

    const isStatic = useIsStaticRenderer()
    const items = (media && media.length ? media : DEFAULT_MEDIA).map(
        (m: any) => ({
            src: m.image || m.video || "",
            type: m.video ? "video" : "image",
            alt: m.alt || "",
            poster: m.poster || "",
            captions: m.captions || "",
        })
    )
    const n = Math.max(items.length, 1)
    const hasVideo = items.some((m: any) => m.type === "video")

    // React-driven view: the RAF loop pushes these once per frame and the
    // JSX below computes every transform from them — no DOM mutation.
    const [view, setView] = useState({ angle: 0, tilt: defaultTilt, zoom: 1 })
    const [activeIdx, setActiveIdx] = useState(0)
    const [dragging, setDragging] = useState(false)
    const [videosPlaying, setVideosPlaying] = useState(true)
    const userPausedRef = useRef(false)

    const rootRef = useRef<HTMLDivElement>(null)
    const videoEls = useRef<Array<HTMLVideoElement | null>>([])

    // Physics simulation state (plain refs, never touches the DOM)
    const S = useRef({
        angle: 0,
        tilt: defaultTilt,
        vel: 0,
        zoom: 1,
        dragging: false,
        lastX: 0,
        lastY: 0,
        lastT: 0,
        raf: 0,
        targetAngle: null as number | null,
        animStartAngle: 0,
        animProgress: 1,
    })
    // Live config mirror so the loop always reads current props
    const cfg = useRef<any>({})
    cfg.current = {
        auto: autoRotate,
        speed: rotationSpeed,
        dir: direction,
        radius,
        morph: {
            on: morphEnabled,
            scale: morphScale,
            opacity: morphOpacity,
            blur: morphBlur,
        },
        warp: {
            on: warpEnabled,
            zoomOut: warpZoomOut,
            speedShrink: warpSpeedShrink,
            ease: warpEase,
        },
        n,
        animDur: animDuration,
        orbit: orbitTilt,
    }
    // Last values synced to React state, to skip re-renders when idle
    const syncedRef = useRef({ angle: NaN, tilt: NaN, zoom: NaN, idx: -1 })

    const goTo = useCallback((i: number) => {
        const s = S.current
        s.targetAngle = -i * (360 / cfg.current.n)
        s.animStartAngle = s.angle
        s.animProgress = 0
        s.vel = 0
    }, [])

    const applyVideos = useCallback((play: boolean) => {
        videoEls.current.forEach((v) => {
            if (!v) return
            if (play) v.play().catch(() => {})
            else v.pause()
        })
    }, [])

    // Pointer drag — React handlers, state-driven cursor
    const onPointerDown = useCallback((e: React.PointerEvent) => {
        const s = S.current
        try {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        } catch {}
        s.dragging = true
        setDragging(true)
        s.lastX = e.clientX
        s.lastY = e.clientY
        s.lastT = performance.now()
        s.vel = 0
        if (s.targetAngle !== null) {
            s.targetAngle = null
            s.animProgress = 1
        }
    }, [])

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        const s = S.current
        if (!s.dragging) return
        const now = performance.now()
        const dx = e.clientX - s.lastX
        const dy = e.clientY - s.lastY
        s.lastX = e.clientX
        s.lastY = e.clientY
        const dt = Math.max(1, now - s.lastT)

        const angleDelta = -dx * 0.3
        s.angle += angleDelta
        s.vel = (angleDelta / dt) * 1000

        if (cfg.current.orbit) {
            s.tilt = clampNum(s.tilt + dy * 0.25, TILT_MIN, TILT_MAX)
        }
        s.lastT = now
    }, [])

    const onPointerUp = useCallback(() => {
        const s = S.current
        if (!s.dragging) return
        s.dragging = false
        setDragging(false)
    }, [])

    // Keyboard scoped to the carousel — arrow keys only act when it has focus
    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const c = cfg.current
            if (e.key === "ArrowRight") {
                e.preventDefault()
                goTo((activeIndexFromAngle(S.current.angle, c.n) + 1) % c.n)
            } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                goTo(
                    (activeIndexFromAngle(S.current.angle, c.n) - 1 + c.n) % c.n
                )
            }
        },
        [goTo]
    )

    // Animation loop, gated by viewport visibility. Advances the physics
    // refs, then syncs to React state only when something actually changed.
    useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return

        let running = false
        let last = performance.now()

        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now
            const s = S.current
            const c = cfg.current

            if (s.animProgress < 1 && s.targetAngle !== null) {
                s.animProgress = Math.min(s.animProgress + dt / c.animDur, 1)
                const eased = easeInOutCubic(s.animProgress)
                s.angle =
                    s.animStartAngle +
                    (s.targetAngle - s.animStartAngle) * eased
                if (s.animProgress >= 1) {
                    s.angle = s.targetAngle
                    s.targetAngle = null
                    s.vel = 0
                }
            } else if (c.auto && !s.dragging && Math.abs(s.vel) < 0.01) {
                s.angle += c.speed * c.dir * dt * 60
            }

            if (
                s.targetAngle === null &&
                !s.dragging &&
                Math.abs(s.vel) > 0.001
            ) {
                s.angle += s.vel * dt * 60
                s.vel *= Math.pow(0.92, dt * 60)
                if (Math.abs(s.vel) < 0.01) s.vel = 0
            }

            // While pressed but not moving, bleed off stale velocity so the
            // warp relaxes and releasing from a hold doesn't throw the wheel
            if (s.dragging && now - s.lastT > IDLE_VEL_DECAY_MS) {
                s.vel *= Math.pow(0.85, dt * 60)
            }

            // Drag warp: zoom out on grab, shrink more with drag speed,
            // settle back to 1 as the inertia spin decays
            let zoomTarget = 1
            if (c.warp.on) {
                const speedInfluence = Math.min(
                    1,
                    Math.abs(s.vel * 60) / SPEED_NORM
                )
                zoomTarget = s.dragging
                    ? c.warp.zoomOut - c.warp.speedShrink * speedInfluence
                    : 1 - c.warp.speedShrink * speedInfluence * 0.6
                zoomTarget = Math.max(MIN_ZOOM, zoomTarget)
            }
            s.zoom +=
                (zoomTarget - s.zoom) * (1 - Math.pow(1 - c.warp.ease, dt * 60))
            if (Math.abs(s.zoom - zoomTarget) < 0.0005) s.zoom = zoomTarget

            // Sync physics → React state, skipping no-op frames
            const idx = activeIndexFromAngle(s.angle, c.n)
            const sy = syncedRef.current
            if (
                Math.abs(s.angle - sy.angle) > 1e-3 ||
                Math.abs(s.tilt - sy.tilt) > 1e-3 ||
                Math.abs(s.zoom - sy.zoom) > 1e-4
            ) {
                sy.angle = s.angle
                sy.tilt = s.tilt
                sy.zoom = s.zoom
                setView({ angle: s.angle, tilt: s.tilt, zoom: s.zoom })
            }
            if (idx !== sy.idx) {
                sy.idx = idx
                setActiveIdx(idx)
            }

            if (running) s.raf = requestAnimationFrame(loop)
        }

        const startLoop = () => {
            if (running) return
            running = true
            last = performance.now()
            S.current.raf = requestAnimationFrame(loop)
        }
        const stopLoop = () => {
            running = false
            cancelAnimationFrame(S.current.raf)
        }

        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                startLoop()
                if (!userPausedRef.current) applyVideos(true)
            } else {
                stopLoop()
                applyVideos(false)
            }
        })
        io.observe(root)

        return () => {
            io.disconnect()
            stopLoop()
        }
    }, [isStatic, applyVideos])

    // Wheel-to-spin while dragging needs a non-passive listener (preventDefault)
    useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        const onWheel = (e: WheelEvent) => {
            const s = S.current
            if (s.dragging) {
                e.preventDefault()
                s.angle += (e.deltaY + e.deltaX) * 0.2
            }
        }
        root.addEventListener("wheel", onWheel, { passive: false })
        return () => root.removeEventListener("wheel", onWheel)
    }, [isStatic])

    const mediaCss: any = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
    }

    // Static (canvas / export) shows the resting frame from current props;
    // live rendering uses the animated state.
    const effView = isStatic ? { angle: 0, tilt: defaultTilt, zoom: 1 } : view
    const effIdx = isStatic ? 0 : activeIdx

    return (
        <div
            ref={rootRef}
            role="group"
            aria-label="360 spin carousel"
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
            onKeyDown={onKeyDown}
            style={{
                position: "relative",
                overflow: "hidden",
                background,
                cursor: dragging ? "grabbing" : "grab",
                perspective: `${perspective}px`,
                touchAction: "none",
                ...style,
                width: style?.width && style.width !== 0 ? style.width : "100%",
                height:
                    style?.height && style.height !== 0 ? style.height : "100%",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 0,
                    height: 0,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    transform: `scale(${effView.zoom}) rotateX(${effView.tilt}deg) rotateY(${effView.angle}deg)`,
                }}
            >
                {items.map((m: any, i: number) => {
                    const baseAngle = (360 / n) * i
                    const baseT = `rotateY(${baseAngle}deg) translateZ(${radius}px)`
                    const frontness =
                        (Math.cos(
                            (((((baseAngle + effView.angle) % 360) + 360) %
                                360) *
                                Math.PI) /
                                180
                        ) +
                            1) /
                        2
                    const isFront = i === effIdx

                    let cardTransform = baseT
                    let cardOpacity = 1
                    let cardFilter = "none"
                    if (morphEnabled) {
                        const sc = 1 - morphScale + morphScale * frontness
                        cardTransform = `${baseT} scale(${sc})`
                        cardOpacity =
                            1 - morphOpacity + morphOpacity * frontness
                        const bl = morphBlur * (1 - frontness)
                        cardFilter = bl > 0 ? `blur(${bl}px)` : "none"
                    }
                    const cardShadow =
                        glowFront && isFront
                            ? "0 0 30px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.5)"
                            : "0 8px 32px rgba(0,0,0,0.5)"

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: -cardW / 2,
                                top: -cardH / 2,
                                width: cardW,
                                height: cardH,
                                borderRadius: cardRadius,
                                overflow: "hidden",
                                backfaceVisibility: "hidden",
                                transform: cardTransform,
                                opacity: cardOpacity,
                                filter: cardFilter,
                                border:
                                    borderWidth > 0
                                        ? `${borderWidth}px solid ${borderColor}`
                                        : "none",
                                background: "#1a1a1f",
                                boxShadow: cardShadow,
                                willChange: "transform, opacity",
                            }}
                        >
                            {m.type === "video" ? (
                                <video
                                    ref={(el) => {
                                        videoEls.current[i] = el
                                    }}
                                    src={m.src}
                                    poster={m.poster || undefined}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    aria-label={m.alt || undefined}
                                    style={mediaCss}
                                >
                                    {m.captions ? (
                                        <track
                                            kind="captions"
                                            src={m.captions}
                                            label="Captions"
                                            default
                                        />
                                    ) : null}
                                </video>
                            ) : (
                                <img
                                    src={m.src}
                                    draggable={false}
                                    alt={m.alt}
                                    style={mediaCss}
                                />
                            )}
                            {showReflection && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                            "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%)",
                                        pointerEvents: "none",
                                        borderRadius: cardRadius,
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {showRing && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: radius * 2,
                        height: radius * 2,
                        transform: `translate(-50%, -50%) rotateX(${effView.tilt}deg)`,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.06)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}

            {showHub && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 12,
                        height: 12,
                        transform: `translate(-50%, -50%) rotateX(${effView.tilt}deg)`,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.12)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}

            {navStyle !== "none" && n > 1 && (
                <div
                    role="group"
                    aria-label="Carousel navigation"
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: `calc(50% + ${radius + cardH / 2 + navOffset}px)`,
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: navGap,
                        zIndex: 10,
                        alignItems: "center",
                    }}
                >
                    {navShowPrevNext && (
                        <button
                            type="button"
                            aria-label="Previous slide"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() =>
                                goTo(
                                    (activeIndexFromAngle(S.current.angle, n) -
                                        1 +
                                        n) %
                                        n
                                )
                            }
                            style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                fontSize: 13,
                                padding: "4px 8px",
                            }}
                        >
                            Prev
                        </button>
                    )}
                    {items.map((_: any, i: number) => {
                        const active = i === effIdx
                        let btnStyle: any
                        if (navStyle === "dots") {
                            btnStyle = {
                                width: active ? 28 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: active
                                    ? "#fff"
                                    : "rgba(255,255,255,0.19)",
                            }
                        } else if (navStyle === "arrows") {
                            btnStyle = {
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: "none",
                                color: active
                                    ? "#fff"
                                    : "rgba(255,255,255,0.3)",
                                border: "1px solid",
                                borderColor: active
                                    ? "rgba(255,255,255,0.5)"
                                    : "transparent",
                                fontSize: 11,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }
                        } else {
                            btnStyle = {
                                height: 3,
                                width: active ? 28 : 12,
                                borderRadius: 2,
                                background: active
                                    ? "#fff"
                                    : "rgba(255,255,255,0.19)",
                            }
                        }
                        return (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Go to slide ${i + 1}`}
                                aria-current={active ? "true" : "false"}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => goTo(i)}
                                style={{
                                    border:
                                        navStyle === "arrows"
                                            ? undefined
                                            : "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    transition: "all 0.3s ease",
                                    ...btnStyle,
                                }}
                            >
                                {navStyle === "arrows" ? "→" : ""}
                            </button>
                        )
                    })}
                    {navShowPrevNext && (
                        <button
                            type="button"
                            aria-label="Next slide"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() =>
                                goTo(
                                    (activeIndexFromAngle(S.current.angle, n) +
                                        1) %
                                        n
                                )
                            }
                            style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                fontSize: 13,
                                padding: "4px 8px",
                            }}
                        >
                            Next
                        </button>
                    )}
                </div>
            )}

            {showPlayPause && hasVideo && !isStatic && (
                <button
                    type="button"
                    aria-label={videosPlaying ? "Pause videos" : "Play videos"}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => {
                        const next = !videosPlaying
                        setVideosPlaying(next)
                        userPausedRef.current = !next
                        applyVideos(next)
                    }}
                    style={{
                        position: "absolute",
                        right: 12,
                        bottom: 12,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.55)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        color: "#fff",
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                    }}
                >
                    {videosPlaying ? "❚❚" : "▶"}
                </button>
            )}
        </div>
    )
}

SpinCarousel.displayName = "360 Spin Carousel"

SpinCarousel.defaultProps = {
    media: DEFAULT_MEDIA,
    ferris: {
        radius: 280,
        perspective: 900,
        tilt: 10,
        autoRotate: true,
        speed: 0.4,
        direction: 1,
        ring: false,
        hub: false,
        orbitTilt: true,
    },
    card: {
        width: 160,
        height: 200,
        radius: 12,
        reflection: true,
        glowFront: true,
        border: 0,
        borderColor: "#ffffff20",
    },
    morph: { enabled: true, scale: 0.15, opacity: 0.6, blur: 0 },
    warp: { enabled: true, zoomOut: 0.7, speedShrink: 0.15, ease: 0.12 },
    nav: {
        style: "dots",
        gap: 8,
        offset: 24,
        showPrevNext: false,
        animDuration: 0.6,
    },
    video: { playPause: true },
    colors: { background: "#0a0a0c" },
}

addPropertyControls(SpinCarousel, {
    media: {
        type: ControlType.Array,
        title: "Media",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt text",
                    defaultValue: "",
                },
                poster: {
                    type: ControlType.Image,
                    title: "Poster",
                    hidden: (p: any) => !p.video,
                },
                captions: {
                    type: ControlType.File,
                    title: "Captions",
                    allowedFileTypes: ["vtt"],
                    hidden: (p: any) => !p.video,
                },
            },
        },
        defaultValue: DEFAULT_MEDIA,
    },
    ferris: {
        type: ControlType.Object,
        title: "360 Spin",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.05,
                max: 3,
                step: 0.05,
                defaultValue: 0.4,
                hidden: (p: any) => !p.autoRotate,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: [1, -1],
                optionTitles: ["Clockwise", "Counter-clockwise"],
                defaultValue: 1,
                displaySegmentedControl: true,
                hidden: (p: any) => !p.autoRotate,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 80,
                max: 800,
                step: 10,
                defaultValue: 280,
                unit: "px",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                min: 200,
                max: 3000,
                step: 50,
                defaultValue: 900,
                unit: "px",
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: -90,
                max: 90,
                step: 1,
                defaultValue: 10,
                unit: "deg",
                description:
                    "Initial camera angle. Vertical drag overrides this.",
            },
            orbitTilt: {
                type: ControlType.Boolean,
                title: "Orbit Tilt",
                defaultValue: true,
                description: "Drag vertically to change camera angle",
            },
            ring: {
                type: ControlType.Boolean,
                title: "Ring",
                defaultValue: false,
                description: "Show outer ring",
            },
            hub: {
                type: ControlType.Boolean,
                title: "Hub",
                defaultValue: false,
                description: "Show center hub dot",
            },
        },
    },
    warp: {
        type: ControlType.Object,
        title: "Drag Warp",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                description: "Zoom the scene out while dragging",
            },
            zoomOut: {
                type: ControlType.Number,
                title: "Zoom Out",
                min: 0.3,
                max: 1,
                step: 0.01,
                defaultValue: 0.7,
                description: "Scale of the wheel while grabbed (1 = no zoom)",
                hidden: (p: any) => !p.enabled,
            },
            speedShrink: {
                type: ControlType.Number,
                title: "Speed Shrink",
                min: 0,
                max: 0.4,
                step: 0.01,
                defaultValue: 0.15,
                description: "Extra shrink added by drag speed",
                hidden: (p: any) => !p.enabled,
            },
            ease: {
                type: ControlType.Number,
                title: "Ease",
                min: 0.03,
                max: 0.4,
                step: 0.01,
                defaultValue: 0.12,
                description: "How fast the zoom follows (lower = softer)",
                hidden: (p: any) => !p.enabled,
            },
        },
    },
    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                min: 40,
                max: 600,
                step: 5,
                defaultValue: 160,
                unit: "px",
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                min: 40,
                max: 800,
                step: 5,
                defaultValue: 200,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 100,
                step: 2,
                defaultValue: 12,
                unit: "px",
            },
            reflection: {
                type: ControlType.Boolean,
                title: "Reflection",
                defaultValue: true,
            },
            glowFront: {
                type: ControlType.Boolean,
                title: "Glow Front",
                defaultValue: true,
            },
            border: {
                type: ControlType.Number,
                title: "Border",
                min: 0,
                max: 8,
                step: 1,
                defaultValue: 0,
                unit: "px",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#ffffff20",
                hidden: (p: any) => !p.border || p.border === 0,
            },
        },
    },
    morph: {
        type: ControlType.Object,
        title: "Morphing",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                description: "Smooth scale/opacity as items ride the wheel",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale Boost",
                min: 0,
                max: 0.5,
                step: 0.01,
                defaultValue: 0.15,
                description: "Extra scale for front items",
                hidden: (p: any) => !p.enabled,
            },
            opacity: {
                type: ControlType.Number,
                title: "Fade Back",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.6,
                description:
                    "How much to fade items at the back (0=fully faded, 1=no fade)",
                hidden: (p: any) => !p.enabled,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur Back",
                min: 0,
                max: 8,
                step: 0.5,
                defaultValue: 0,
                unit: "px",
                description: "Blur on back items",
                hidden: (p: any) => !p.enabled,
            },
        },
    },
    nav: {
        type: ControlType.Object,
        title: "Nav Buttons",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["dots", "arrows", "lines", "none"],
                optionTitles: ["Dots", "Arrows", "Lines", "None"],
                defaultValue: "dots",
                displaySegmentedControl: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Icon Gap",
                min: 2,
                max: 40,
                step: 1,
                defaultValue: 8,
                unit: "px",
                hidden: (p: any) => p.style === "none",
            },
            offset: {
                type: ControlType.Number,
                title: "Wheel Gap",
                min: 0,
                max: 120,
                step: 2,
                defaultValue: 24,
                unit: "px",
                hidden: (p: any) => p.style === "none",
            },
            showPrevNext: {
                type: ControlType.Boolean,
                title: "Prev / Next",
                defaultValue: false,
                hidden: (p: any) => p.style === "none",
            },
            animDuration: {
                type: ControlType.Number,
                title: "Anim Duration",
                min: 0.1,
                max: 2,
                step: 0.05,
                defaultValue: 0.6,
                unit: "s",
                hidden: (p: any) => p.style === "none",
            },
        },
    },
    video: {
        type: ControlType.Object,
        title: "Video",
        controls: {
            playPause: {
                type: ControlType.Boolean,
                title: "Play / Pause",
                defaultValue: true,
                description: "Show a pause button when videos are present",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0a0a0c",
            },
        },
    },
})
