import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 */

type FrameItem = {
    id: number
    video: string
    image?: string
    title?: string
}

type LayoutSettings = {
    rows: number
    columns: number
    gap: number
    expandSize: number
    transition: number
}

type MediaSettings = {
    fit: "cover" | "contain"
    scale: number
    playOnHover: boolean
    unhoverMode: "freeze" | "reset"
    previewPrime: boolean
    thumbnailTime: number
}

type OverlaySettings = {
    overlay: number
    dimOthers: number
    vignette: boolean
    vignetteOpacity: number
}

type TextSettings = {
    show: boolean
    color: string
    otherOpacity: number
    lift: number
    font: any
}

type MotionSettings = {
    quality: "off" | "subtle" | "ultra"
    magneticAmount: number
    parallaxAmount: number
    glow: boolean
    glowOpacity: number
}

type Props = {
    style?: React.CSSProperties
    frames: FrameItem[]
    layout: LayoutSettings
    media: MediaSettings
    overlay: OverlaySettings
    text: TextSettings
    motion: MotionSettings
}

const defaultLayout: LayoutSettings = {
    rows: 2,
    columns: 4,
    gap: 6,
    expandSize: 6,
    transition: 460,
}

const defaultMedia: MediaSettings = {
    fit: "cover",
    scale: 1.14,
    playOnHover: true,
    unhoverMode: "freeze",
    previewPrime: true,
    thumbnailTime: 0.01,
}

const defaultOverlay: OverlaySettings = {
    overlay: 0.58,
    dimOthers: 0.34,
    vignette: true,
    vignetteOpacity: 0.62,
}

const defaultText: TextSettings = {
    show: true,
    color: "#FFFFFF",
    otherOpacity: 0.72,
    lift: 22,
    font: {
        fontFamily: "Times New Roman",
        fontSize: 56,
        fontWeight: 400,
        fontStyle: "italic",
        lineHeight: "1em",
        letterSpacing: "-0.02em",
        textAlign: "center",
    },
}

const defaultMotion: MotionSettings = {
    quality: "subtle",
    magneticAmount: 4,
    parallaxAmount: 8,
    glow: false,
    glowOpacity: 0.12,
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n))
}

function defaultFrames(count = 8): FrameItem[] {
    return Array.from({ length: count }).map((_, i) => ({
        id: i + 1,
        video: "",
        image: "",
        title: `Item ${i + 1}`,
    }))
}

function ease() {
    return "cubic-bezier(0.22, 1, 0.36, 1)"
}

function normalizeFont(font: any): React.CSSProperties {
    if (!font) return {}

    return {
        fontFamily: font.fontFamily ?? font.family,
        fontSize: font.fontSize ?? font.size,
        fontWeight: font.fontWeight ?? font.weight,
        fontStyle: font.fontStyle ?? font.style,
        lineHeight: font.lineHeight,
        letterSpacing: font.letterSpacing,
        textAlign: font.textAlign ?? font.align,
        textTransform: font.textTransform,
    }
}

function Tile({
    frame,
    isActive,
    anyActive,
    media,
    overlay,
    text,
    motion,
    transition,
}: {
    frame: FrameItem
    isActive: boolean
    anyActive: boolean
    media: MediaSettings
    overlay: OverlaySettings
    text: TextSettings
    motion: MotionSettings
    transition: number
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const rootRef = useRef<HTMLDivElement | null>(null)
    const mediaRef = useRef<HTMLVideoElement | HTMLDivElement | null>(null)
    const glowRef = useRef<HTMLDivElement | null>(null)

    const target = useRef({ x: 0.5, y: 0.5 })
    const current = useRef({ x: 0.5, y: 0.5 })
    const raf = useRef<number | null>(null)
    const primedRef = useRef(false)

    const [videoReady, setVideoReady] = useState(false)

    const timing = `${transition}ms ${ease()}`
    const motionEnabled = motion.quality !== "off"
    const isUltra = motion.quality === "ultra"

    const baseScale = isActive ? media.scale : 1
    const edgeSafeScale =
        motionEnabled && isActive ? baseScale + 0.035 : baseScale

    useEffect(() => {
        setVideoReady(false)
        primedRef.current = false
    }, [frame.video])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (isActive && media.playOnHover) {
            video.play().catch(() => {})
            return
        }

        video.pause()

        if (media.unhoverMode === "reset") {
            try {
                video.currentTime = 0
            } catch {}
        }
    }, [isActive, media.playOnHover, media.unhoverMode])

    const handleLoadedMetadata = () => {
        const video = videoRef.current
        if (!video || primedRef.current || !media.previewPrime) return

        primedRef.current = true

        try {
            const duration = Number.isFinite(video.duration)
                ? video.duration
                : 0
            const targetTime =
                duration > 0
                    ? clamp(
                          media.thumbnailTime,
                          0,
                          Math.max(0, duration - 0.05)
                      )
                    : Math.max(0, media.thumbnailTime)

            if (!isActive) {
                video.currentTime = targetTime
            }
        } catch {}
    }

    const handleLoadedData = () => {
        setVideoReady(true)
    }

    const handleSeeked = () => {
        setVideoReady(true)
    }

    useEffect(() => {
        const root = rootRef.current
        const mediaEl = mediaRef.current
        const glow = glowRef.current

        if (!root || !mediaEl) return

        if (!isActive || !motionEnabled) {
            if (raf.current) cancelAnimationFrame(raf.current)
            raf.current = null

            target.current = { x: 0.5, y: 0.5 }
            current.current = { x: 0.5, y: 0.5 }

            root.style.transform = "translateZ(0)"
            mediaEl.style.transform = `scale(${isActive ? edgeSafeScale : 1}) translate3d(0px, 0px, 0)`

            if (glow) {
                glow.style.background =
                    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0), transparent 60%)"
            }

            return
        }

        const speed = isUltra ? 0.11 : 0.16
        const magnetic = isUltra
            ? motion.magneticAmount
            : motion.magneticAmount * 0.55
        const parallax = isUltra
            ? motion.parallaxAmount
            : motion.parallaxAmount * 0.55

        const animate = () => {
            current.current.x += (target.current.x - current.current.x) * speed
            current.current.y += (target.current.y - current.current.y) * speed

            const x = current.current.x
            const y = current.current.y

            const tiltX = (y - 0.5) * magnetic * -1
            const tiltY = (x - 0.5) * magnetic
            const moveX = (x - 0.5) * parallax
            const moveY = (y - 0.5) * parallax

            root.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0)`
            mediaEl.style.transform = `scale(${edgeSafeScale}) translate3d(${moveX}px, ${moveY}px, 0)`

            if (glow) {
                glow.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,${motion.glowOpacity}), transparent 58%)`
            }

            raf.current = requestAnimationFrame(animate)
        }

        raf.current = requestAnimationFrame(animate)

        return () => {
            if (raf.current) cancelAnimationFrame(raf.current)
            raf.current = null
        }
    }, [
        isActive,
        motionEnabled,
        isUltra,
        motion.magneticAmount,
        motion.parallaxAmount,
        motion.glowOpacity,
        media.scale,
        edgeSafeScale,
    ])

    const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isActive || !motionEnabled) return

        const rect = rootRef.current?.getBoundingClientRect()
        if (!rect) return

        target.current = {
            x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
            y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
        }
    }

    const handleLeave = () => {
        target.current = { x: 0.5, y: 0.5 }
    }

    const showPosterFallback = Boolean(
        frame.image && frame.video && !videoReady
    )

    return (
        <div
            ref={rootRef}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                background: "#000",
                border: "none",
                outline: "none",
                boxShadow: "none",
                clipPath: "inset(0px)",
                transform: "translateZ(0)",
                transition: `transform 220ms ${ease()}`,
                willChange: isActive && motionEnabled ? "transform" : "auto",
                contain: "layout paint size",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {frame.image && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "#000",
                        backgroundImage: `url(${frame.image})`,
                        backgroundSize: media.fit,
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        opacity: showPosterFallback || !frame.video ? 1 : 0,
                        transition: `opacity ${timing}`,
                        pointerEvents: "none",
                    }}
                />
            )}

            {frame.video ? (
                <video
                    ref={(node) => {
                        videoRef.current = node
                        mediaRef.current = node
                    }}
                    src={frame.video || undefined}
                    poster={frame.image || undefined}
                    muted
                    loop
                    playsInline
                    preload={media.previewPrime ? "auto" : "metadata"}
                    autoPlay={false}
                    onLoadedMetadata={handleLoadedMetadata}
                    onLoadedData={handleLoadedData}
                    onSeeked={handleSeeked}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: media.fit,
                        background: "#000",
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        opacity: showPosterFallback ? 0 : 1,
                        transform: `scale(${isActive ? edgeSafeScale : 1}) translate3d(0px, 0px, 0)`,
                        transition: `opacity ${timing}, transform ${timing}`,
                        willChange: isActive ? "transform" : "auto",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                />
            ) : !frame.image ? (
                <div
                    ref={mediaRef as React.RefObject<HTMLDivElement>}
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#000",
                        transform: `scale(${isActive ? edgeSafeScale : 1}) translate3d(0px, 0px, 0)`,
                        transition: `transform ${timing}`,
                        willChange: isActive ? "transform" : "auto",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                />
            ) : (
                <div
                    ref={mediaRef as React.RefObject<HTMLDivElement>}
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "#000",
                        backgroundImage: `url(${frame.image})`,
                        backgroundSize: media.fit,
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        transform: `scale(${isActive ? edgeSafeScale : 1}) translate3d(0px, 0px, 0)`,
                        transition: `transform ${timing}`,
                        willChange: isActive ? "transform" : "auto",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                />
            )}

            {motion.glow && (
                <div
                    ref={glowRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        opacity: isActive ? 1 : 0,
                        transition: `opacity ${timing}`,
                        mixBlendMode: "overlay",
                        background:
                            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0), transparent 60%)",
                        willChange: isActive ? "opacity, background" : "auto",
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,1)",
                    opacity: anyActive && !isActive ? overlay.dimOthers : 0,
                    transition: `opacity ${timing}`,
                    pointerEvents: "none",
                    willChange: "opacity",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.82))",
                    opacity: isActive ? 0 : overlay.overlay,
                    transition: `opacity ${timing}`,
                    pointerEvents: "none",
                    willChange: "opacity",
                }}
            />

            {overlay.vignette && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                            "radial-gradient(120% 120% at 50% 35%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 82%, rgba(0,0,0,0.95) 100%)",
                        opacity: isActive ? 0 : overlay.vignetteOpacity,
                        transition: `opacity ${timing}`,
                        willChange: "opacity",
                    }}
                />
            )}

            {text.show && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: text.color,
                        opacity: isActive
                            ? 0
                            : anyActive
                              ? text.otherOpacity
                              : 1,
                        transform: isActive
                            ? `translate3d(0, ${text.lift}px, 0) scale(1.06)`
                            : "translate3d(0, 0px, 0) scale(1)",
                        transition: `opacity ${timing}, transform ${timing}`,
                        pointerEvents: "none",
                        textAlign: "center",
                        padding: 16,
                        filter: "drop-shadow(0 1px 18px rgba(0,0,0,0.5))",
                        willChange: "opacity, transform",
                        ...normalizeFont(text.font),
                    }}
                >
                    {frame.title}
                </div>
            )}
        </div>
    )
}

export default function DynamicFrameGrid(props: Partial<Props>) {
    const {
        style,
        frames: inputFrames = defaultFrames(8),
        layout = defaultLayout,
        media = defaultMedia,
        overlay = defaultOverlay,
        text = defaultText,
        motion = defaultMotion,
    } = props as Partial<Props> & {
        layout?: LayoutSettings
        media?: MediaSettings
        overlay?: OverlaySettings
        text?: TextSettings
        motion?: MotionSettings
    }

    const safeRows = clamp(Math.round(layout.rows), 1, 8)
    const safeColumns = clamp(Math.round(layout.columns), 1, 8)
    const total = safeRows * safeColumns

    const frames = useMemo(() => {
        const list =
            Array.isArray(inputFrames) && inputFrames.length
                ? [...inputFrames]
                : defaultFrames(total)

        while (list.length < total) {
            list.push({
                id: list.length + 1,
                video: "",
                image: "",
                title: `Item ${list.length + 1}`,
            })
        }

        return list.slice(0, total)
    }, [inputFrames, total])

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const activeCell =
        hoveredIndex !== null
            ? {
                  row: Math.floor(hoveredIndex / safeColumns),
                  col: hoveredIndex % safeColumns,
              }
            : null

    const getRows = () => {
        if (!activeCell || safeRows <= 1) {
            return Array(safeRows).fill("1fr").join(" ")
        }

        const totalFr = safeRows * 4
        const active = clamp(layout.expandSize, 2, totalFr - 1)
        const other = (totalFr - active) / (safeRows - 1)

        return Array.from({ length: safeRows })
            .map((_, row) =>
                row === activeCell.row ? `${active}fr` : `${other}fr`
            )
            .join(" ")
    }

    const getColumns = () => {
        if (!activeCell || safeColumns <= 1) {
            return Array(safeColumns).fill("1fr").join(" ")
        }

        const totalFr = safeColumns * 4
        const active = clamp(layout.expandSize, 2, totalFr - 1)
        const other = (totalFr - active) / (safeColumns - 1)

        return Array.from({ length: safeColumns })
            .map((_, col) =>
                col === activeCell.col ? `${active}fr` : `${other}fr`
            )
            .join(" ")
    }

    const timing = `${layout.transition}ms ${ease()}`

    return (
        <div
            style={{
                ...style,
                width: style?.width ?? "100%",
                height: style?.height ?? "100%",
                display: "grid",
                gridTemplateRows: getRows(),
                gridTemplateColumns: getColumns(),
                gap: layout.gap,
                overflow: "hidden",
                background: "#000",
                outline: "none",
                border: "none",
                boxShadow: "none",
                transition: `grid-template-rows ${timing}, grid-template-columns ${timing}`,
                contain: "layout paint size",
                isolation: "isolate",
                WebkitTapHighlightColor: "transparent",
            }}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            {frames.map((frame, index) => {
                const isActive = hoveredIndex === index
                const anyActive = hoveredIndex !== null

                return (
                    <div
                        key={frame.id ?? index}
                        onMouseEnter={() => setHoveredIndex(index)}
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            minWidth: 1,
                            minHeight: 1,
                            overflow: "hidden",
                            background: "#000",
                            cursor: "pointer",
                            border: "none",
                            outline: "none",
                            boxShadow: "none",
                            transformStyle: "preserve-3d",
                            contain: "layout paint size",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        <Tile
                            frame={frame}
                            isActive={isActive}
                            anyActive={anyActive}
                            media={media}
                            overlay={overlay}
                            text={text}
                            motion={motion}
                            transition={layout.transition}
                        />
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(DynamicFrameGrid, {
    frames: {
        title: "Frames",
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    title: "ID",
                    type: ControlType.Number,
                    defaultValue: 1,
                    min: 1,
                    step: 1,
                },
                video: {
                    title: "Video",
                    type: ControlType.File,
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                image: {
                    title: "Poster / Image",
                    type: ControlType.Image,
                },
                title: {
                    title: "Title",
                    type: ControlType.String,
                    defaultValue: "Item",
                },
            },
        },
        defaultValue: defaultFrames(8),
    },

    layout: {
        title: "Layout",
        type: ControlType.Object,
        controls: {
            rows: {
                title: "Rows",
                type: ControlType.Number,
                defaultValue: 2,
                min: 1,
                max: 8,
                step: 1,
                displayStepper: true,
            },
            columns: {
                title: "Columns",
                type: ControlType.Number,
                defaultValue: 4,
                min: 1,
                max: 8,
                step: 1,
                displayStepper: true,
            },
            gap: {
                title: "Gap",
                type: ControlType.Number,
                defaultValue: 6,
                min: 0,
                max: 40,
                step: 1,
            },
            expandSize: {
                title: "Expand",
                type: ControlType.Number,
                defaultValue: 6,
                min: 2,
                max: 20,
                step: 0.5,
            },
            transition: {
                title: "Speed",
                type: ControlType.Number,
                defaultValue: 460,
                min: 120,
                max: 1200,
                step: 10,
            },
        },
        defaultValue: defaultLayout,
    },

    media: {
        title: "Media",
        type: ControlType.Object,
        controls: {
            fit: {
                title: "Fit",
                type: ControlType.Enum,
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                defaultValue: "cover",
            },
            scale: {
                title: "Hover Scale",
                type: ControlType.Number,
                defaultValue: 1.14,
                min: 1,
                max: 2,
                step: 0.01,
            },
            playOnHover: {
                title: "Play Hover",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            unhoverMode: {
                title: "Unhover",
                type: ControlType.Enum,
                options: ["freeze", "reset"],
                optionTitles: ["Freeze Frame", "Reset Start"],
                defaultValue: "freeze",
            },
            previewPrime: {
                title: "Preview Prime",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            thumbnailTime: {
                title: "Thumb Time",
                type: ControlType.Number,
                defaultValue: 0.01,
                min: 0,
                max: 60,
                step: 0.01,
                hidden: (p) => !p.media?.previewPrime,
            },
        },
        defaultValue: defaultMedia,
    },

    overlay: {
        title: "Overlay",
        type: ControlType.Object,
        controls: {
            overlay: {
                title: "Base",
                type: ControlType.Number,
                defaultValue: 0.58,
                min: 0,
                max: 1,
                step: 0.01,
            },
            dimOthers: {
                title: "Dim Others",
                type: ControlType.Number,
                defaultValue: 0.34,
                min: 0,
                max: 1,
                step: 0.01,
            },
            vignette: {
                title: "Vignette",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            vignetteOpacity: {
                title: "Vignette Amt",
                type: ControlType.Number,
                defaultValue: 0.62,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
        defaultValue: defaultOverlay,
    },

    text: {
        title: "Text",
        type: ControlType.Object,
        controls: {
            show: {
                title: "Show",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            color: {
                title: "Color",
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
            },
            otherOpacity: {
                title: "Other Opacity",
                type: ControlType.Number,
                defaultValue: 0.72,
                min: 0,
                max: 1,
                step: 0.01,
            },
            lift: {
                title: "Lift",
                type: ControlType.Number,
                defaultValue: 22,
                min: -80,
                max: 80,
                step: 1,
            },
            font: {
                title: "Font",
                type: ControlType.Font,
                controls: "extended",
                defaultValue: defaultText.font,
            },
        },
        defaultValue: defaultText,
    },

    motion: {
        title: "Motion FX",
        type: ControlType.Object,
        controls: {
            quality: {
                title: "Quality",
                type: ControlType.Enum,
                options: ["off", "subtle", "ultra"],
                optionTitles: ["Off", "Subtle", "Ultra"],
                defaultValue: "subtle",
            },
            magneticAmount: {
                title: "Tilt",
                type: ControlType.Number,
                defaultValue: 4,
                min: 0,
                max: 24,
                step: 1,
                hidden: (p) => p.motion?.quality === "off",
            },
            parallaxAmount: {
                title: "Move",
                type: ControlType.Number,
                defaultValue: 8,
                min: 0,
                max: 60,
                step: 1,
                hidden: (p) => p.motion?.quality === "off",
            },
            glow: {
                title: "Glow",
                type: ControlType.Boolean,
                defaultValue: false,
            },
            glowOpacity: {
                title: "Glow Amt",
                type: ControlType.Number,
                defaultValue: 0.12,
                min: 0,
                max: 0.6,
                step: 0.01,
                hidden: (p) => !p.motion?.glow,
            },
        },
        defaultValue: defaultMotion,
    },
})
