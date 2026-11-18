/**
 * iPhone Swipe Carousel
 * ------------------------------------------------------------
 * An iPhone Pro Max–style mockup (thin bezels, Dynamic Island,
 * no side buttons) with a vertical swipe carousel inside.
 *
 * - Supports images AND videos (upload a file or paste a URL)
 * - Swipe / drag up and down, mouse wheel / trackpad, arrow keys
 * - Minimal "1/5" counter bottom-left with a rolling number
 * - Bouncing swipe-up cue bottom-right that fades after first use
 * - Only the active video plays, and only while the component is
 *   visible in the viewport
 * - Phone scales to fit whatever size you give the component
 *
 * No external libraries required.
 */
import * as React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type MediaItem = {
    type?: "image" | "video"
    image?: { src: string; srcSet?: string; alt?: string }
    video?: string
    videoUrl?: string
    poster?: { src: string; srcSet?: string; alt?: string }
    alt?: string
}

type Props = {
    items: MediaItem[]
    fit: "cover" | "contain"
    autoplayVideos: boolean
    muteVideos: boolean
    loopVideos: boolean
    restartVideos: boolean
    showCounter: boolean
    counterColor: string
    counterFont: React.CSSProperties
    counterSize: number
    showHint: boolean
    hintColor: string
    hideHintAfterSwipe: boolean
    swipeThreshold: number
    transitionDuration: number
    frameColor: string
    bezelColor: string
    bezelWidth: number
    showIsland: boolean
    screenColor: string
    background: string
    onSlideChange?: () => void
    style?: React.CSSProperties
}

// Base phone size (in "units"). Everything scales from this.
const BASE_W = 268
const BASE_H = 530
const u = (n: number) => `calc(var(--ipc-u) * ${n})`

const PLACEHOLDERS: [string, string][] = [
    ["#CECBF6", "#26215C"],
    ["#9FE1CB", "#04342C"],
    ["#F5C4B3", "#4A1B0C"],
    ["#F4C0D1", "#4B1528"],
    ["#B5D4F4", "#042C53"],
]

const KEYFRAMES = `
@keyframes ipc-roll-up{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
@keyframes ipc-roll-down{from{transform:translateY(-100%);opacity:0}to{transform:none;opacity:1}}
@keyframes ipc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
`

const EASE = "cubic-bezier(.22,.8,.3,1)"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function IPhoneSwipeCarousel(props: Props) {
    const {
        items = [],
        fit,
        autoplayVideos,
        muteVideos,
        loopVideos,
        restartVideos,
        showCounter,
        counterColor,
        counterFont,
        counterSize,
        showHint,
        hintColor,
        hideHintAfterSwipe,
        swipeThreshold,
        transitionDuration,
        frameColor,
        bezelColor,
        bezelWidth,
        showIsland,
        screenColor,
        background,
        onSlideChange,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const screenRef = useRef<HTMLDivElement>(null)
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

    const [inView, setInView] = useState(false)
    const [idx, setIdx] = useState(0)
    const [dir, setDir] = useState<"up" | "down" | null>(null)
    const [dy, setDy] = useState(0)
    const [dragging, setDragging] = useState(false)
    const [interacted, setInteracted] = useState(false)

    const idxRef = useRef(0)
    const startY = useRef(0)
    const dyRef = useRef(0)
    const draggingRef = useRef(false)
    const wheelLock = useRef(false)

    const count = Math.max(items.length, 1)
    const slides: MediaItem[] = items.length ? items : [{ type: "image" }]

    // --- Viewport detection ---
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    // Keep index valid if items change
    useEffect(() => {
        if (idx > count - 1) {
            setIdx(count - 1)
            idxRef.current = count - 1
        }
    }, [count, idx])

    const go = useCallback(
        (next: number) => {
            const clamped = Math.max(0, Math.min(count - 1, next))
            const prev = idxRef.current
            dyRef.current = 0
            setDy(0)
            if (clamped === prev) return
            setDir(clamped > prev ? "up" : "down")
            idxRef.current = clamped
            setIdx(clamped)
            onSlideChange?.()
        },
        [count, onSlideChange]
    )

    const markInteracted = useCallback(() => {
        if (hideHintAfterSwipe) setInteracted(true)
    }, [hideHintAfterSwipe])

    // --- Video playback: only the active slide, only while in view ---
    useEffect(() => {
        if (isStatic) return
        videoRefs.current.forEach((v, i) => {
            if (!v) return
            if (i === idx && inView && autoplayVideos) {
                v.muted = muteVideos
                const p = v.play()
                if (p && typeof p.catch === "function") p.catch(() => {})
            } else {
                v.pause()
                if (restartVideos && i !== idx) v.currentTime = 0
            }
        })
    }, [
        idx,
        inView,
        autoplayVideos,
        muteVideos,
        restartVideos,
        isStatic,
        items,
    ])

    // --- Wheel / trackpad (non-passive so we can preventDefault) ---
    useEffect(() => {
        if (isStatic || !inView) return
        const el = screenRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            const i = idxRef.current
            const atStart = i === 0 && e.deltaY < 0
            const atEnd = i === count - 1 && e.deltaY > 0
            if (atStart || atEnd) return // let the page scroll
            e.preventDefault()
            if (wheelLock.current || Math.abs(e.deltaY) < 12) return
            wheelLock.current = true
            markInteracted()
            go(i + (e.deltaY > 0 ? 1 : -1))
            window.setTimeout(
                () => {
                    wheelLock.current = false
                },
                transitionDuration * 1000 + 200
            )
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [isStatic, inView, count, go, markInteracted, transitionDuration])

    // --- Pointer drag ---
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        markInteracted()
        draggingRef.current = true
        setDragging(true)
        startY.current = e.clientY
        dyRef.current = 0
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return
        let d = e.clientY - startY.current
        const i = idxRef.current
        if ((i === 0 && d > 0) || (i === count - 1 && d < 0)) d *= 0.35
        dyRef.current = d
        setDy(d)
    }
    const onPointerEnd = () => {
        if (!draggingRef.current) return
        draggingRef.current = false
        setDragging(false)
        const h = screenRef.current?.clientHeight || 1
        const t = h * (swipeThreshold / 100)
        const d = dyRef.current
        if (d < -t) go(idxRef.current + 1)
        else if (d > t) go(idxRef.current - 1)
        else go(idxRef.current)
    }
    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowDown" || e.key === "PageDown") {
            e.preventDefault()
            markInteracted()
            go(idxRef.current + 1)
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
            e.preventDefault()
            markInteracted()
            go(idxRef.current - 1)
        }
    }

    // --- Renderers ---
    const renderPlaceholder = (i: number, label: string) => {
        const [bg, fg] = PLACEHOLDERS[i % PLACEHOLDERS.length]
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: bg,
                    color: fg,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: u(10),
                    fontFamily:
                        "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                }}
            >
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: u(40), height: u(40) }}
                    aria-hidden="true"
                >
                    {label === "Video" ? (
                        <>
                            <rect x="3" y="5" width="13" height="14" rx="2" />
                            <path d="M16 10l5-3v10l-5-3z" />
                        </>
                    ) : (
                        <>
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </>
                    )}
                </svg>
                <div style={{ fontSize: u(15), fontWeight: 500 }}>
                    {label} {i + 1}
                </div>
                <div style={{ fontSize: u(12), opacity: 0.8 }}>Placeholder</div>
            </div>
        )
    }

    const mediaStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: fit,
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
    }

    const renderSlide = (item: MediaItem, i: number, live: boolean) => {
        const isVideo = item.type === "video"
        const videoSrc = item.video || item.videoUrl
        let content: React.ReactNode

        if (isVideo && videoSrc) {
            content = live ? (
                <video
                    ref={(el) => {
                        videoRefs.current[i] = el
                    }}
                    src={videoSrc}
                    poster={item.poster?.src}
                    muted={muteVideos}
                    loop={loopVideos}
                    playsInline
                    preload="metadata"
                    style={mediaStyle}
                    aria-label={item.alt}
                />
            ) : item.poster?.src ? (
                <img
                    src={item.poster.src}
                    alt={item.alt || ""}
                    style={mediaStyle}
                />
            ) : (
                renderPlaceholder(i, "Video")
            )
        } else if (!isVideo && item.image?.src) {
            content = (
                <img
                    src={item.image.src}
                    srcSet={item.image.srcSet}
                    alt={item.alt || item.image.alt || ""}
                    draggable={false}
                    style={mediaStyle}
                />
            )
        } else {
            content = renderPlaceholder(i, isVideo ? "Video" : "Image")
        }

        return (
            <div
                key={i}
                style={{
                    width: "100%",
                    height: "100%",
                    flexShrink: 0,
                    overflow: "hidden",
                    background: screenColor,
                }}
            >
                {content}
            </div>
        )
    }

    const renderPhone = (live: boolean) => {
        const current = live ? idx : 0
        const offset = live ? dy : 0
        const anim = live && inView ? "running" : "paused"
        const hintVisible = showHint && !(live && interacted)

        return (
            <div
                ref={containerRef}
                style={
                    {
                        ...style,
                        width: "100%",
                        height: "100%",
                        background,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        containerType: "size",
                        overflow: "hidden",
                    } as React.CSSProperties
                }
            >
                <style>{KEYFRAMES}</style>
                {/* Titanium frame */}
                <div
                    style={
                        {
                            ["--ipc-u" as any]: `min(calc(100cqw / ${BASE_W + 4}), calc(100cqh / ${BASE_H + 4}))`,
                            width: u(BASE_W),
                            height: u(BASE_H),
                            borderRadius: u(44),
                            background: frameColor,
                            padding: u(2),
                            boxSizing: "border-box",
                            flexShrink: 0,
                        } as React.CSSProperties
                    }
                >
                    {/* Bezel */}
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: u(42),
                            background: bezelColor,
                            padding: u(bezelWidth),
                            boxSizing: "border-box",
                        }}
                    >
                        {/* Screen */}
                        <div
                            ref={screenRef}
                            tabIndex={live ? 0 : -1}
                            role="region"
                            aria-roledescription="carousel"
                            aria-label={`Slide ${current + 1} of ${count}`}
                            onPointerDown={live ? onPointerDown : undefined}
                            onPointerMove={live ? onPointerMove : undefined}
                            onPointerUp={live ? onPointerEnd : undefined}
                            onPointerCancel={live ? onPointerEnd : undefined}
                            onKeyDown={live ? onKeyDown : undefined}
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: u(Math.max(42 - bezelWidth, 8)),
                                overflow: "hidden",
                                position: "relative",
                                background: screenColor,
                                touchAction: "none",
                                cursor: live
                                    ? dragging
                                        ? "grabbing"
                                        : "grab"
                                    : "default",
                                userSelect: "none",
                                outline: "none",
                                isolation: "isolate",
                            }}
                        >
                            {/* Track */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    transform: `translateY(calc(${-current * 100}% + ${offset}px))`,
                                    transition: dragging
                                        ? "none"
                                        : `transform ${transitionDuration}s ${EASE}`,
                                    willChange: "transform",
                                }}
                            >
                                {slides.map((item, i) =>
                                    renderSlide(item, i, live)
                                )}
                            </div>

                            {/* Dynamic Island */}
                            {showIsland && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: u(9),
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: u(78),
                                        height: u(22),
                                        borderRadius: u(12),
                                        background: "#000",
                                        zIndex: 5,
                                    }}
                                />
                            )}

                            {/* Swipe-up cue */}
                            {showHint && count > 1 && (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        right: u(22),
                                        bottom: u(20),
                                        zIndex: 4,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        color: hintColor,
                                        pointerEvents: "none",
                                        opacity: hintVisible ? 1 : 0,
                                        transition: "opacity .4s ease",
                                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,.2))",
                                    }}
                                >
                                    {[0, 1].map((k) => (
                                        <svg
                                            key={k}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{
                                                width: u(20),
                                                height: u(20),
                                                marginTop: k ? u(-10) : 0,
                                                opacity: k ? 0.5 : 1,
                                                animation: `ipc-bob 1.6s ease-in-out ${k ? ".12s" : "0s"} infinite`,
                                                animationPlayState: anim,
                                            }}
                                        >
                                            <path d="M6 15l6-6 6 6" />
                                        </svg>
                                    ))}
                                </div>
                            )}

                            {/* 1/5 counter */}
                            {showCounter && (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        left: u(24),
                                        bottom: u(24),
                                        zIndex: 4,
                                        display: "flex",
                                        alignItems: "center",
                                        color: counterColor,
                                        letterSpacing: "0.06em",
                                        fontVariantNumeric: "tabular-nums",
                                        textShadow: "0 1px 2px rgba(0,0,0,.2)",
                                        pointerEvents: "none",
                                        ...counterFont,
                                        fontSize: u(counterSize),
                                        lineHeight: u(counterSize * 1.3),
                                    }}
                                >
                                    <div
                                        style={{
                                            height: u(counterSize * 1.3),
                                            overflow: "hidden",
                                        }}
                                    >
                                        <span
                                            key={current}
                                            style={{
                                                display: "block",
                                                animation:
                                                    live && dir
                                                        ? `ipc-roll-${dir} .4s ${EASE}`
                                                        : "none",
                                            }}
                                        >
                                            {current + 1}
                                        </span>
                                    </div>
                                    <span
                                        style={{
                                            margin: `0 ${u(3)}`,
                                            opacity: 0.55,
                                        }}
                                    >
                                        /
                                    </span>
                                    <span style={{ opacity: 0.7 }}>
                                        {count}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- Static canvas fallback: first slide, no motion, no listeners ---
    if (isStatic) return renderPhone(false)

    // --- Live component ---
    return renderPhone(true)
}

IPhoneSwipeCarousel.defaultProps = {
    width: 1000,
    height: 800,
    items: [
        { type: "image" },
        { type: "image" },
        { type: "image" },
        { type: "image" },
        { type: "image" },
    ],
    fit: "cover",
    autoplayVideos: true,
    muteVideos: true,
    loopVideos: true,
    restartVideos: true,
    showCounter: true,
    counterColor: "#FFFFFF",
    counterFont: { fontFamily: "Inter", fontWeight: 500 },
    counterSize: 14,
    showHint: true,
    hintColor: "#FFFFFF",
    hideHintAfterSwipe: true,
    swipeThreshold: 18,
    transitionDuration: 0.42,
    frameColor: "#8F8A84",
    bezelColor: "#0A0A0A",
    bezelWidth: 5,
    showIsland: true,
    screenColor: "#000000",
    background: "rgba(0,0,0,0)",
}

addPropertyControls(IPhoneSwipeCarousel, {
    items: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 20,
        defaultValue: IPhoneSwipeCarousel.defaultProps.items,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.type !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    description: "Used if no file is uploaded.",
                    hidden: (p: any) => p.type !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (p: any) => p.type !== "video",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt text",
                    placeholder: "Describe the slide",
                },
            },
        },
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        displaySegmentedControl: true,
        defaultValue: "cover",
    },

    autoplayVideos: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        description: "Videos",
    },
    muteVideos: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
    },
    loopVideos: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    restartVideos: {
        type: ControlType.Boolean,
        title: "Restart",
        defaultValue: true,
        description: "Restart a video when you swipe back to it.",
    },

    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
    },
    counterColor: {
        type: ControlType.Color,
        title: "Counter color",
        defaultValue: "#FFFFFF",
        hidden: (p: any) => !p.showCounter,
    },
    counterFont: {
        type: ControlType.Font,
        title: "Counter font",
        controls: "basic",
        defaultValue: { fontFamily: "Inter", fontWeight: 500 } as any,
        hidden: (p: any) => !p.showCounter,
    },
    counterSize: {
        type: ControlType.Number,
        title: "Counter size",
        min: 8,
        max: 40,
        step: 1,
        defaultValue: 14,
        description: "Relative to the phone size.",
        hidden: (p: any) => !p.showCounter,
    },

    showHint: {
        type: ControlType.Boolean,
        title: "Swipe cue",
        defaultValue: true,
    },
    hintColor: {
        type: ControlType.Color,
        title: "Cue color",
        defaultValue: "#FFFFFF",
        hidden: (p: any) => !p.showHint,
    },
    hideHintAfterSwipe: {
        type: ControlType.Boolean,
        title: "Hide after use",
        defaultValue: true,
        hidden: (p: any) => !p.showHint,
    },

    swipeThreshold: {
        type: ControlType.Number,
        title: "Threshold",
        min: 5,
        max: 50,
        step: 1,
        unit: "%",
        defaultValue: 18,
        description: "How far to drag before it snaps to the next slide.",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 1.5,
        step: 0.02,
        unit: "s",
        defaultValue: 0.42,
    },

    frameColor: {
        type: ControlType.Color,
        title: "Frame",
        defaultValue: "#8F8A84",
    },
    bezelColor: {
        type: ControlType.Color,
        title: "Bezel",
        defaultValue: "#0A0A0A",
    },
    bezelWidth: {
        type: ControlType.Number,
        title: "Bezel width",
        min: 0,
        max: 16,
        step: 0.5,
        defaultValue: 5,
    },
    showIsland: {
        type: ControlType.Boolean,
        title: "Island",
        defaultValue: true,
    },
    screenColor: {
        type: ControlType.Color,
        title: "Screen",
        defaultValue: "#000000",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },

    onSlideChange: { type: ControlType.EventHandler },
})
