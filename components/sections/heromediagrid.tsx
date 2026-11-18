import * as React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
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

/**
 * Meech213-style Hero — fullscreen editorial media mosaic
 * 1:1 interaction rebuild: image-flash preloader → staggered
 * grid reveal, inline autoplaying muted videos, subtle hover
 * zoom + sibling dim, smooth lerp scrolling, fixed UI labels.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */

type MediaItem = {
    image?: { src?: string }
    videoUrl?: string
    link?: string
    wide?: boolean
    alt?: string
}

const FALLBACKS = [
    "https://picsum.photos/id/1011/800/1000",
    "https://picsum.photos/id/1012/800/1100",
    "https://picsum.photos/id/1027/800/1200",
    "https://picsum.photos/id/1035/800/950",
    "https://picsum.photos/id/1062/800/1150",
    "https://picsum.photos/id/1074/800/1050",
    "https://picsum.photos/id/338/800/1000",
    "https://picsum.photos/id/64/800/980",
    "https://picsum.photos/id/65/800/1180",
    "https://picsum.photos/id/91/800/1020",
    "https://picsum.photos/id/103/800/1090",
    "https://picsum.photos/id/129/800/990",
    "https://picsum.photos/id/177/800/1120",
    "https://picsum.photos/id/203/800/1010",
    "https://picsum.photos/id/219/800/1060",
    "https://picsum.photos/id/237/800/970",
    "https://picsum.photos/id/250/800/1130",
    "https://picsum.photos/id/275/800/1040",
    "https://picsum.photos/id/287/800/1000",
    "https://picsum.photos/id/301/800/1080",
]

const EASE_EXPO: any = [0.16, 1, 0.3, 1]

// ── responsive column hook ────────────────────────────────
function useColumns(
    ref: React.RefObject<HTMLDivElement>,
    desktop: number,
    tablet: number,
    mobile: number,
    isStatic: boolean
) {
    const [cols, setCols] = useState(desktop)
    useEffect(() => {
        if (isStatic) return
        const el = ref.current
        if (!el) return
        const update = () => {
            const w = el.getBoundingClientRect().width
            setCols(Math.max(1, w < 640 ? mobile : w < 1024 ? tablet : desktop))
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [ref, desktop, tablet, mobile, isStatic])
    return cols
}

// ── smooth lerp scrolling (inertia) ───────────────────────
function useSmoothScroll(
    ref: React.RefObject<HTMLDivElement>,
    enabled: boolean,
    ease: number
) {
    useEffect(() => {
        if (!enabled) return
        const el = ref.current
        if (!el) return
        let target = el.scrollTop
        let current = target
        let raf = 0
        let running = true

        const clamp = (v: number) =>
            Math.max(0, Math.min(el.scrollHeight - el.clientHeight, v))

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            target = clamp(target + e.deltaY)
        }
        const loop = () => {
            if (!running) return
            current += (target - current) * ease
            if (Math.abs(target - current) < 0.1) current = target
            el.scrollTop = current
            raf = requestAnimationFrame(loop)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        raf = requestAnimationFrame(loop)
        return () => {
            running = false
            cancelAnimationFrame(raf)
            el.removeEventListener("wheel", onWheel)
        }
    }, [ref, enabled, ease])
}

// ── preloader: rapid image flash sequence ─────────────────
function Preloader(props: {
    images: string[]
    flashMs: number
    durationMs: number
    background: string
    onDone: () => void
}) {
    const isStatic = useIsStaticRenderer()
    const { images, flashMs, durationMs, background, onDone } = props
    const [idx, setIdx] = useState(0)

    useEffect(() => {
        if (isStatic) return
        const flash = setInterval(
            () => setIdx((i) => (i + 1) % Math.max(1, images.length)),
            flashMs
        )
        const done = setTimeout(onDone, durationMs)
        return () => {
            clearInterval(flash)
            clearTimeout(done)
        }
    }, [images.length, flashMs, durationMs, onDone, isStatic])

    if (isStatic) return null

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE_EXPO } }}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 50,
                background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "min(38vh, 60vw)",
                    aspectRatio: "3 / 4",
                    overflow: "hidden",
                }}
            >
                {images.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt=""
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: i === idx ? 1 : 0,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    )
}

// ── single grid cell ──────────────────────────────────────
function Cell(props: {
    item: MediaItem
    index: number
    revealed: boolean
    hoveredIndex: number | null
    setHoveredIndex: (i: number | null) => void
    p: any
}) {
    const { item, index, revealed, hoveredIndex, setHoveredIndex, p } = props
    const isStaticCell = useIsStaticRenderer()
    const {
        hoverScale,
        dimOthers,
        dimOpacity,
        staggerMs,
        durationS,
        videoMode,
        radius,
        objectFit,
        isStatic,
    } = p

    const cellRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [inView, setInView] = useState(false)
    const isVideo = !!item.videoUrl
    const hovered = hoveredIndex === index
    const dimmed = dimOthers && hoveredIndex !== null && !hovered
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    useEffect(() => {
        if (isCanvas || isStatic || isStaticCell) return
        const el = cellRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                setInView(!!entry?.isIntersecting)
            },
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isCanvas, isStatic, isStaticCell])

    useEffect(() => {
        const v = videoRef.current
        if (!v || isCanvas || isStatic || isStaticCell) return
        if (!inView) {
            v.pause()
            return
        }
        if (videoMode === "always" && revealed) v.play().catch(() => {})
        else if (videoMode === "hover") {
            if (hovered) v.play().catch(() => {})
            else v.pause()
        } else if (videoMode === "off") v.pause()
    }, [hovered, videoMode, revealed, isCanvas, isStatic, isStaticCell, inView])

    const Tag: any = item.link ? "a" : "div"

    if (isStatic) {
        return (
            <div
                ref={cellRef}
                style={{
                    gridColumn: item.wide ? "span 2" : "span 1",
                    position: "relative",
                    opacity: 1,
                }}
            >
                <Tag
                    href={item.link || undefined}
                    style={{
                        position: "relative",
                        display: "block",
                        width: "100%",
                        aspectRatio: item.wide ? "16 / 10" : "3 / 4",
                        overflow: "hidden",
                        borderRadius: radius,
                        cursor: item.link ? "pointer" : "default",
                        background: "#e8e8e8",
                    }}
                >
                    {isVideo ? (
                        <video
                            ref={videoRef}
                            src={item.videoUrl}
                            muted
                            loop
                            playsInline
                            autoPlay={false}
                            preload="metadata"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit,
                                display: "block",
                            }}
                        />
                    ) : (
                        <img
                            src={
                                item.image?.src ||
                                FALLBACKS[index % FALLBACKS.length]
                            }
                            alt={item.alt || ""}
                            loading="lazy"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit,
                                display: "block",
                            }}
                        />
                    )}
                </Tag>
            </div>
        )
    }

    return (
        <motion.div
            ref={cellRef}
            initial={false}
            animate={
                revealed
                    ? {
                          opacity: dimmed ? dimOpacity : 1,
                          y: 0,
                          scale: 1,
                      }
                    : { opacity: 0, y: 40, scale: 0.96 }
            }
            transition={
                revealed
                    ? {
                          opacity: { duration: 0.4 },
                          y: {
                              duration: durationS,
                              delay: (index * staggerMs) / 1000,
                              ease: EASE_EXPO,
                          },
                          scale: {
                              duration: durationS,
                              delay: (index * staggerMs) / 1000,
                              ease: EASE_EXPO,
                          },
                      }
                    : { duration: 0 }
            }
            style={{
                gridColumn: item.wide ? "span 2" : "span 1",
                position: "relative",
            }}
        >
            <Tag
                href={item.link || undefined}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                    position: "relative",
                    display: "block",
                    width: "100%",
                    aspectRatio: item.wide ? "16 / 10" : "3 / 4",
                    overflow: "hidden",
                    borderRadius: radius,
                    cursor: item.link ? "pointer" : "default",
                    background: "#e8e8e8",
                }}
            >
                {isVideo ? (
                    <video
                        ref={videoRef}
                        src={item.videoUrl}
                        muted
                        loop
                        playsInline
                        autoPlay={videoMode === "always" && !isCanvas}
                        preload="metadata"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit,
                            display: "block",
                            transform: hovered
                                ? `scale(${hoverScale})`
                                : "scale(1)",
                            transition:
                                "transform 1s cubic-bezier(0.16,1,0.3,1)",
                        }}
                    />
                ) : (
                    <img
                        src={
                            item.image?.src ||
                            FALLBACKS[index % FALLBACKS.length]
                        }
                        alt={item.alt || ""}
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit,
                            display: "block",
                            transform: hovered
                                ? `scale(${hoverScale})`
                                : "scale(1)",
                            transition:
                                "transform 1s cubic-bezier(0.16,1,0.3,1)",
                        }}
                    />
                )}
            </Tag>
        </motion.div>
    )
}

// ── main component ────────────────────────────────────────
export default function Meech213Hero(props: any) {
    const {
        items,
        background,
        columnsDesktop,
        columnsTablet,
        columnsMobile,
        gap,
        padding,
        wideEvery,
        showPreloader,
        preloaderMs,
        flashMs,
        smoothScroll,
        scrollEase,
        showUI,
        showMenu,
        menuLabel,
        copyrightText,
        objectFit,
        uiColor,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const containerRef = useRef<HTMLDivElement>(null)
    const cols = useColumns(
        containerRef,
        columnsDesktop,
        columnsTablet,
        columnsMobile,
        isStatic
    )

    const [loading, setLoading] = useState(showPreloader && !isCanvas && !isStatic)
    const revealed = !loading
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    useEffect(() => {
        setLoading(showPreloader && !isCanvas && !isStatic)
    }, [showPreloader, isCanvas, isStatic])

    useSmoothScroll(
        containerRef,
        smoothScroll && !isCanvas && !isStatic && revealed,
        scrollEase
    )

    const list: MediaItem[] = useMemo(() => {
        const base: MediaItem[] =
            items && items.length > 0
                ? items
                : FALLBACKS.map((f) => ({ image: { src: f } }))
        return base.map((it, i) => ({
            ...it,
            wide:
                it.wide !== undefined
                    ? it.wide
                    : wideEvery > 0 && (i + 1) % wideEvery === 0,
        }))
    }, [items, wideEvery])

    const preloaderImages = useMemo(
        () =>
            list
                .filter((it) => it.image?.src)
                .slice(0, 6)
                .map((it) => it.image!.src as string),
        [list]
    )

    const font =
        "'Helvetica Neue', Helvetica, Arial, sans-serif"

    if (isStatic) {
        const staticItems = list.slice(0, 6)
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background,
                    overflow: "hidden",
                    position: "relative",
                    ...style,
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${columnsDesktop}, 1fr)`,
                        gap,
                        padding,
                        alignItems: "start",
                    }}
                >
                    {staticItems.map((item, i) => (
                        <div
                            key={i}
                            style={{
                                aspectRatio: "3 / 4",
                                overflow: "hidden",
                                borderRadius: props.radius,
                                background: "#e8e8e8",
                            }}
                        >
                            <img
                                src={
                                    item.image?.src ||
                                    FALLBACKS[i % FALLBACKS.length]
                                }
                                alt={item.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: objectFit,
                                    display: "block",
                                }}
                            />
                        </div>
                    ))}
                </div>
                {showUI && (
                    <>
                        <div
                            style={{
                                position: "absolute",
                                left: 16,
                                bottom: 14,
                                zIndex: 20,
                                fontFamily: font,
                                fontSize: 11,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: uiColor,
                                pointerEvents: "none",
                            }}
                        >
                            {copyrightText}
                        </div>
                        {showMenu && (
                            <div
                                style={{
                                    position: "absolute",
                                    right: 16,
                                    bottom: 14,
                                    zIndex: 20,
                                    fontFamily: font,
                                    fontSize: 11,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    color: uiColor,
                                    cursor: "pointer",
                                }}
                            >
                                {menuLabel}
                            </div>
                        )}
                    </>
                )}
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                ...style,
            }}
        >
            {/* scrollable mosaic */}
            <div
                ref={containerRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gridAutoFlow: "dense",
                        gap,
                        padding,
                        alignItems: "start",
                    }}
                >
                    {list.map((item, i) => (
                        <Cell
                            key={i}
                            item={item}
                            index={i}
                            revealed={revealed || isCanvas}
                            hoveredIndex={hoveredIndex}
                            setHoveredIndex={setHoveredIndex}
                            p={{ ...props, isStatic }}
                        />
                    ))}
                </div>
            </div>

            {/* fixed UI labels */}
            {showUI && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: revealed || isCanvas ? 1 : 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        style={{
                            position: "absolute",
                            left: 16,
                            bottom: 14,
                            zIndex: 20,
                            fontFamily: font,
                            fontSize: 11,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: uiColor,
                            pointerEvents: "none",
                        }}
                    >
                        {copyrightText}
                    </motion.div>
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: revealed || isCanvas ? 1 : 0 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            style={{
                                position: "absolute",
                                right: 16,
                                bottom: 14,
                                zIndex: 20,
                                fontFamily: font,
                                fontSize: 11,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: uiColor,
                                cursor: "pointer",
                            }}
                        >
                            {menuLabel}
                        </motion.div>
                    )}
                </>
            )}

            {/* preloader */}
            {!isStatic && (
                <AnimatePresence>
                    {loading && (
                        <Preloader
                            images={preloaderImages}
                            flashMs={flashMs}
                            durationMs={preloaderMs}
                            background={background}
                            onDone={() => setLoading(false)}
                        />
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

Meech213Hero.defaultProps = {
    background: "#ffffff",
    columnsDesktop: 5,
    columnsTablet: 3,
    columnsMobile: 2,
    gap: 10,
    padding: 10,
    radius: 0,
    objectFit: "cover",
    wideEvery: 7,
    hoverScale: 1.05,
    dimOthers: true,
    dimOpacity: 0.5,
    staggerMs: 45,
    durationS: 1.1,
    videoMode: "always",
    showPreloader: true,
    preloaderMs: 2200,
    flashMs: 140,
    smoothScroll: true,
    scrollEase: 0.08,
    showUI: true,
    showMenu: true,
    menuLabel: "Menu",
    copyrightText: "© All rights reserved. 2026",
    uiColor: "#111111",
}

addPropertyControls(Meech213Hero, {
    items: {
        type: ControlType.Array,
        title: "Media Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                },
                link: { type: ControlType.Link, title: "Link" },
                wide: { type: ControlType.Boolean, title: "Wide Cell" },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    placeholder: "Describe the image…",
                },
            },
        },
    },
    background: { type: ControlType.Color, title: "Background" },
    columnsDesktop: {
        type: ControlType.Number,
        title: "Cols·Desktop",
        min: 1, max: 8, step: 1,
    },
    columnsTablet: {
        type: ControlType.Number,
        title: "Cols·Tablet",
        min: 1, max: 6, step: 1,
    },
    columnsMobile: {
        type: ControlType.Number,
        title: "Cols·Mobile",
        min: 1, max: 4, step: 1,
    },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 60 },
    padding: { type: ControlType.Number, title: "Padding", min: 0, max: 100 },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 32 },
    objectFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
    },
    wideEvery: {
        type: ControlType.Number,
        title: "Wide Every Nth",
        min: 0, max: 12, step: 1,
    },
    showPreloader: { type: ControlType.Boolean, title: "Preloader" },
    preloaderMs: {
        type: ControlType.Number,
        title: "Load Time (ms)",
        min: 500, max: 6000, step: 100,
        hidden: (p: any) => !p.showPreloader,
    },
    flashMs: {
        type: ControlType.Number,
        title: "Flash Speed (ms)",
        min: 60, max: 500, step: 10,
        hidden: (p: any) => !p.showPreloader,
    },
    staggerMs: {
        type: ControlType.Number,
        title: "Stagger (ms)",
        min: 0, max: 200,
    },
    durationS: {
        type: ControlType.Number,
        title: "Reveal Dur (s)",
        min: 0.3, max: 3, step: 0.1,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Zoom",
        min: 1, max: 1.25, step: 0.01,
    },
    dimOthers: { type: ControlType.Boolean, title: "Dim Siblings" },
    dimOpacity: {
        type: ControlType.Number,
        title: "Dim Opacity",
        min: 0.1, max: 0.9, step: 0.05,
        hidden: (p: any) => !p.dimOthers,
    },
    videoMode: {
        type: ControlType.Enum,
        title: "Video Play",
        options: ["always", "hover", "off"],
        optionTitles: ["Autoplay (site)", "On Hover", "Paused"],
    },
    smoothScroll: { type: ControlType.Boolean, title: "Smooth Scroll" },
    scrollEase: {
        type: ControlType.Number,
        title: "Scroll Ease",
        min: 0.02, max: 0.3, step: 0.01,
        hidden: (p: any) => !p.smoothScroll,
    },
    showUI: { type: ControlType.Boolean, title: "Fixed UI" },
    menuLabel: {
        type: ControlType.String,
        title: "Menu Label",
        hidden: (p: any) => !p.showUI,
    },
    showMenu: {
        type: ControlType.Boolean,
        title: "Show Menu",
        hidden: (p: any) => !p.showUI,
    },
    copyrightText: {
        type: ControlType.String,
        title: "Copyright",
        hidden: (p: any) => !p.showUI,
    },
    uiColor: {
        type: ControlType.Color,
        title: "UI Color",
        hidden: (p: any) => !p.showUI,
    },
})
