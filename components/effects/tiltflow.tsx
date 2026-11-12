// User instructions: Create a fully customizable 3D tilt parallax image and video gallery for Framer with interactive tilt, depth motion, and smooth animations for modern portfolios and creative websites. Name should be unique and modern: TiltFlow.

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

import {
    AnimatePresence,
    motion,
    useInView,
    useMotionValue,
    useSpring,
    type MotionValue,
} from "framer-motion"

type MediaKind = "image" | "video"

type GalleryLayout = "grid" | "masonry"

type CaptionsMode = "show" | "hide"

type InteractionMode = "show" | "hide"

interface MediaItem {
    kind: MediaKind
    title: string
    subtitle: string
    image?: { src?: string; srcSet?: string; alt?: string }
    videoUrl?: string
    aspectRatio: number
}

interface TiltFlowProps {
    items: MediaItem[]
    layout: GalleryLayout
    columns: number
    gap: number
    tiltStrength: number
    parallaxDepth: number
    hoverScale: number
    shadows: boolean
    shadowColor: string
    shadowBlur: number
    borderRadius: number
    lightbox: boolean
    captions: CaptionsMode
    captionFont: any
    captionColor: string
    captionBackground: string
    interactionButton: InteractionMode
    autoplay: boolean
    autoplayInterval: number
    backgroundColor: string
}

const fallbackImages = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2 - Purple",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
]

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function useTiltMotion(
    tiltStrength: number,
    parallaxDepth: number
): {
    rx: MotionValue<number>
    ry: MotionValue<number>
    px: MotionValue<number>
    py: MotionValue<number>
    onMove: (e: React.PointerEvent) => void
    onLeave: () => void
} {
    const rxRaw = useMotionValue(0)
    const ryRaw = useMotionValue(0)
    const pxRaw = useMotionValue(0)
    const pyRaw = useMotionValue(0)

    const rx = useSpring(rxRaw, { stiffness: 220, damping: 24, mass: 0.7 })
    const ry = useSpring(ryRaw, { stiffness: 220, damping: 24, mass: 0.7 })
    const px = useSpring(pxRaw, { stiffness: 220, damping: 28, mass: 0.7 })
    const py = useSpring(pyRaw, { stiffness: 220, damping: 28, mass: 0.7 })

    const onMove = React.useCallback(
        (e: React.PointerEvent) => {
            const el = e.currentTarget as HTMLElement
            const rect = el.getBoundingClientRect()
            const nx = (e.clientX - rect.left) / rect.width // 0..1
            const ny = (e.clientY - rect.top) / rect.height // 0..1
            const dx = clamp(nx * 2 - 1, -1, 1)
            const dy = clamp(ny * 2 - 1, -1, 1)

            // rotateX: invert Y so moving down tilts towards viewer
            rxRaw.set(-dy * tiltStrength)
            ryRaw.set(dx * tiltStrength)
            pxRaw.set(-dx * parallaxDepth)
            pyRaw.set(-dy * parallaxDepth)
        },
        [tiltStrength, parallaxDepth, rxRaw, ryRaw, pxRaw, pyRaw]
    )

    const onLeave = React.useCallback(() => {
        rxRaw.set(0)
        ryRaw.set(0)
        pxRaw.set(0)
        pyRaw.set(0)
    }, [rxRaw, ryRaw, pxRaw, pyRaw])

    return { rx, ry, px, py, onMove, onLeave }
}

function getItemImage(item: MediaItem, index: number) {
    const fallback = fallbackImages[index % fallbackImages.length]
    const src = item.image?.src || fallback.src
    const alt = item.image?.alt ?? (item.title || fallback.alt)
    const srcSet = item.image?.srcSet
    return { src, alt, srcSet }
}

/**
 * TiltFlow — 3D Tilt Parallax Image & Video Gallery
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TiltFlow(props: TiltFlowProps) {
    const {
        items,
        layout,
        columns,
        gap,
        tiltStrength,
        parallaxDepth,
        hoverScale,
        shadows,
        shadowColor,
        shadowBlur,
        borderRadius,
        lightbox,
        captions,
        captionFont,
        captionColor,
        captionBackground,
        interactionButton,
        autoplay,
        autoplayInterval,
        backgroundColor,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const inView = useInView(containerRef, { margin: "200px 0px 200px 0px" })
    const shouldAnimate = !isStatic && inView

    const [openIndex, setOpenIndex] = React.useState<number | null>(null)
    const open = lightbox && openIndex !== null

    const safeItems = React.useMemo(() => {
        const base = Array.isArray(items) ? items : []
        return base.length ? base : []
    }, [items])

    const currentItem = React.useMemo(() => {
        if (!open || openIndex === null) return null
        return safeItems[clamp(openIndex, 0, Math.max(0, safeItems.length - 1))] || null
    }, [open, openIndex, safeItems])

    const canInteract = interactionButton === "show" && safeItems.length > 1

    const close = React.useCallback(() => {
        React.startTransition(() => setOpenIndex(null))
    }, [])

    const go = React.useCallback(
        (dir: -1 | 1) => {
            if (!safeItems.length) return
            React.startTransition(() => {
                setOpenIndex((prev) => {
                    const now = prev === null ? 0 : prev
                    const next = (now + dir + safeItems.length) % safeItems.length
                    return next
                })
            })
        },
        [safeItems.length]
    )

    React.useEffect(() => {
        if (!open) return
        if (typeof window === "undefined") return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
            if (!canInteract) return
            if (e.key === "ArrowRight") go(1)
            if (e.key === "ArrowLeft") go(-1)
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [open, close, go, canInteract])

    React.useEffect(() => {
        if (!open) return
        if (!autoplay) return
        if (!canInteract) return
        if (typeof window === "undefined") return

        const id = window.setInterval(() => {
            go(1)
        }, Math.max(400, autoplayInterval))

        return () => window.clearInterval(id)
    }, [open, autoplay, autoplayInterval, go, canInteract])

    const containerStyle: React.CSSProperties = React.useMemo(() => {
        const base: React.CSSProperties = {
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: backgroundColor,
        }

        if (layout === "masonry") {
            return {
                ...base,
                padding: gap,
                columnCount: clamp(columns, 1, 12),
                columnGap: gap,
            }
        }

        // grid
        return {
            ...base,
            display: "grid",
            gridTemplateColumns: `repeat(${clamp(columns, 1, 12)}, minmax(0, 1fr))`,
            gap,
            padding: gap,
            alignContent: "start",
        }
    }, [layout, columns, gap, backgroundColor])

    const cardShadow = React.useMemo(() => {
        if (!shadows) return "none"
        const blur = clamp(shadowBlur, 0, 200)
        return `0 ${Math.round(blur * 0.4)}px ${blur}px rgba(0,0,0,0.22), 0 ${Math.round(
            blur * 0.15
        )}px ${Math.round(blur * 0.45)}px ${shadowColor}`
    }, [shadows, shadowBlur, shadowColor])

    return (
        <div ref={containerRef} style={containerStyle} aria-label="TiltFlow media gallery">
            {safeItems.map((item, index) => {
                const aspect = clamp(item.aspectRatio || 1, 0.35, 2.2)
                const isMasonry = layout === "masonry"
                const wrapperStyle: React.CSSProperties = {
                    position: "relative",
                    width: "100%",
                    breakInside: "avoid",
                    marginBottom: isMasonry ? gap : 0,
                }

                return (
                    <div key={index} style={wrapperStyle}>
                        <TiltCard
                            item={item}
                            index={index}
                            aspectRatio={aspect}
                            borderRadius={borderRadius}
                            shadow={cardShadow}
                            tiltStrength={tiltStrength}
                            parallaxDepth={parallaxDepth}
                            hoverScale={hoverScale}
                            captions={captions}
                            captionFont={captionFont}
                            captionColor={captionColor}
                            captionBackground={captionBackground}
                            enabled={shouldAnimate}
                            onOpen={
                                lightbox
                                    ? () => {
                                          React.startTransition(() => setOpenIndex(index))
                                      }
                                    : undefined
                            }
                        />
                    </div>
                )
            })}

            <AnimatePresence>
                {open && currentItem && (
                    <Lightbox
                        key="tiltflow-lightbox"
                        item={currentItem}
                        index={openIndex ?? 0}
                        total={safeItems.length}
                        onClose={close}
                        onPrev={canInteract ? () => go(-1) : undefined}
                        onNext={canInteract ? () => go(1) : undefined}
                        showControls={canInteract}
                        captionFont={captionFont}
                        captionColor={captionColor}
                        captionBackground={captionBackground}
                        captions={captions}
                        borderRadius={borderRadius}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function TiltCard(props: {
    item: MediaItem
    index: number
    aspectRatio: number
    borderRadius: number
    shadow: string
    tiltStrength: number
    parallaxDepth: number
    hoverScale: number
    captions: CaptionsMode
    captionFont: any
    captionColor: string
    captionBackground: string
    enabled: boolean
    onOpen?: () => void
}) {
    const {
        item,
        index,
        aspectRatio,
        borderRadius,
        shadow,
        tiltStrength,
        parallaxDepth,
        hoverScale,
        captions,
        captionFont,
        captionColor,
        captionBackground,
        enabled,
        onOpen,
    } = props

    const { rx, ry, px, py, onMove, onLeave } = useTiltMotion(tiltStrength, parallaxDepth)

    const showCaptions = captions === "show"
    const clickable = Boolean(onOpen)

    const media = React.useMemo(() => {
        if (item.kind === "video") {
            const url =
                item.videoUrl || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"
            return (
                <video
                    src={url}
                    muted
                    playsInline
                    loop
                    autoPlay={enabled}
                    preload="metadata"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            )
        }

        const img = getItemImage(item, index)
        return (
            <img
                src={img.src}
                srcSet={img.srcSet}
                alt={img.alt}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
                draggable={false}
            />
        )
    }, [item, index, enabled])

    const title = item.title || ""
    const subtitle = item.subtitle || ""

    return (
        <motion.div
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : -1}
            aria-label={clickable ? `Open ${title || "media"}` : undefined}
            onClick={clickable ? onOpen : undefined}
            onKeyDown={
                clickable
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              onOpen?.()
                          }
                      }
                    : undefined
            }
            onPointerMove={enabled ? onMove : undefined}
            onPointerLeave={enabled ? onLeave : undefined}
            whileHover={enabled ? { scale: clamp(hoverScale, 1, 1.2) } : undefined}
            style={{
                position: "relative",
                width: "100%",
                aspectRatio: String(aspectRatio),
                borderRadius,
                overflow: "hidden",
                boxShadow: shadow,
                cursor: clickable ? "pointer" : "default",
                transformStyle: "preserve-3d",
                perspective: 900,
                background: "#111",
                outline: "none",
                rotateX: enabled ? rx : 0,
                rotateY: enabled ? ry : 0,
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    translateX: enabled ? px : 0,
                    translateY: enabled ? py : 0,
                    scale: 1.08,
                    willChange: enabled ? "transform" : undefined,
                }}
            >
                {media}
            </motion.div>

            {showCaptions && (title || subtitle) && (
                <div
                    style={{
                        position: "absolute",
                        left: 10,
                        right: 10,
                        bottom: 10,
                        borderRadius: 10,
                        padding: "10px 12px",
                        background: captionBackground,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: captionColor,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        ...captionFont,
                    }}
                >
                    {title && (
                        <div
                            style={{
                                width: "100%",
                                lineHeight: "1.15em",
                                fontSize: (captionFont?.fontSize as any) || "14px",
                                fontWeight: 700,
                            }}
                        >
                            {title}
                        </div>
                    )}
                    {subtitle && (
                        <div
                            style={{
                                width: "100%",
                                opacity: 0.85,
                                lineHeight: "1.15em",
                                fontSize: "12px",
                                fontWeight: 500,
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
}

function Lightbox(props: {
    item: MediaItem
    index: number
    total: number
    onClose: () => void
    onPrev?: () => void
    onNext?: () => void
    showControls: boolean
    captionFont: any
    captionColor: string
    captionBackground: string
    captions: CaptionsMode
    borderRadius: number
}) {
    const {
        item,
        index,
        total,
        onClose,
        onPrev,
        onNext,
        showControls,
        captionFont,
        captionColor,
        captionBackground,
        captions,
        borderRadius,
    } = props

    const img = React.useMemo(() => getItemImage(item, index), [item, index])
    const showCaptions = captions === "show"

    const mediaNode = React.useMemo(() => {
        if (item.kind === "video") {
            const url =
                item.videoUrl || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"
            return (
                <video
                    src={url}
                    controls
                    autoPlay
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
            )
        }
        return (
            <img
                src={img.src}
                srcSet={img.srcSet}
                alt={img.alt}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                draggable={false}
            />
        )
    }, [item, img.src, img.srcSet, img.alt])

    const captionTitle = item.title || ""
    const captionSubtitle = item.subtitle || ""

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.72)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 18,
                zIndex: 20,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="TiltFlow lightbox"
            onMouseDown={(e) => {
                // close if clicking backdrop
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <motion.div
                initial={{ y: 10, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 10, scale: 0.985, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.8 }}
                style={{
                    position: "relative",
                    width: "min(1100px, 100%)",
                    height: "min(720px, 100%)",
                    borderRadius: Math.max(10, borderRadius),
                    overflow: "hidden",
                    background: "rgba(10,10,10,0.92)",
                    boxShadow: "0 25px 80px rgba(0,0,0,0.55)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 2,
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.35)",
                        color: "white",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                    }}
                >
                    <span style={{ fontSize: 18, lineHeight: "18px" }}>×</span>
                </button>

                {showControls && (
                    <>
                        <button
                            onClick={onPrev}
                            aria-label="Previous"
                            style={{
                                position: "absolute",
                                left: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                zIndex: 2,
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(0,0,0,0.35)",
                                color: "white",
                                cursor: "pointer",
                                display: "grid",
                                placeItems: "center",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                            }}
                        >
                            ‹
                        </button>
                        <button
                            onClick={onNext}
                            aria-label="Next"
                            style={{
                                position: "absolute",
                                right: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                zIndex: 2,
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(0,0,0,0.35)",
                                color: "white",
                                cursor: "pointer",
                                display: "grid",
                                placeItems: "center",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                            }}
                        >
                            ›
                        </button>
                    </>
                )}

                <div
                    style={{
                        position: "relative",
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 18,
                    }}
                >
                    {mediaNode}
                </div>

                {(showCaptions && (captionTitle || captionSubtitle)) || showControls ? (
                    <div
                        style={{
                            position: "relative",
                            padding: 14,
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                        }}
                    >
                        {showCaptions && (captionTitle || captionSubtitle) ? (
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    borderRadius: 12,
                                    padding: "10px 12px",
                                    background: captionBackground,
                                    color: captionColor,
                                    ...captionFont,
                                }}
                            >
                                {captionTitle && (
                                    <div
                                        style={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {captionTitle}
                                    </div>
                                )}
                                {captionSubtitle && (
                                    <div style={{ opacity: 0.8, fontSize: "12px" }}>{captionSubtitle}</div>
                                )}
                            </div>
                        ) : (
                            <div style={{ flex: 1 }} />
                        )}

                        {showControls && (
                            <div
                                aria-label="Position"
                                style={{
                                    color: "rgba(255,255,255,0.82)",
                                    fontSize: 12,
                                    fontFamily:
                                        captionFont?.fontFamily ||
                                        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
                                    userSelect: "none",
                                }}
                            >
                                {index + 1} / {total}
                            </div>
                        )}
                    </div>
                ) : null}
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(TiltFlow, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 20,
        defaultValue: [
            {
                kind: "image",
                title: "Vibrant Orange Fashion",
                subtitle: "Image",
                aspectRatio: 1.25,
            },
            {
                kind: "video",
                title: "Portrait Motion",
                subtitle: "Video",
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                aspectRatio: 0.78,
            },
            {
                kind: "image",
                title: "Trendy Portrait",
                subtitle: "Image",
                aspectRatio: 0.84,
            },
            {
                kind: "image",
                title: "Cozy Knitwear",
                subtitle: "Image",
                aspectRatio: 1.05,
            },
            {
                kind: "image",
                title: "Urban Fashion",
                subtitle: "Image",
                aspectRatio: 1.45,
            },
            {
                kind: "image",
                title: "Thoughtful Portrait",
                subtitle: "Image",
                aspectRatio: 0.92,
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => p.kind !== "image",
                },
                videoUrl: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.kind !== "video",
                },
                aspectRatio: {
                    type: ControlType.Number,
                    title: "Aspect",
                    defaultValue: 1,
                    min: 0.35,
                    max: 2.2,
                    step: 0.01,
                },
            },
        },
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["grid", "masonry"],
        optionTitles: ["Grid", "Masonry"],
        defaultValue: "masonry",
        displaySegmentedControl: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 4,
        min: 1,
        max: 8,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt Strength",
        defaultValue: 25,
        min: 0,
        max: 60,
        step: 1,
        unit: "deg",
    },
    parallaxDepth: {
        type: ControlType.Number,
        title: "Parallax Depth",
        defaultValue: 30,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    shadows: {
        type: ControlType.Boolean,
        title: "Shadows",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#000000",
        hidden: (p) => !p.shadows,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 40,
        min: 0,
        max: 140,
        step: 1,
        unit: "px",
        hidden: (p) => !p.shadows,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    lightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    captions: {
        type: ControlType.Enum,
        title: "Captions",
        options: ["show", "hide"],
        optionTitles: ["Show", "Hide"],
        defaultValue: "show",
        displaySegmentedControl: true,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: (p) => p.captions !== "show",
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.captions !== "show",
    },
    captionBackground: {
        type: ControlType.Color,
        title: "Caption BG",
        defaultValue: "rgba(0, 0, 0, 0.45)",
        hidden: (p) => p.captions !== "show",
    },
    interactionButton: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["show", "hide"],
        optionTitles: ["Show", "Hide"],
        defaultValue: "show",
        displaySegmentedControl: true,
        hidden: (p) => !p.lightbox,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.lightbox,
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Autoplay Interval",
        defaultValue: 3000,
        min: 400,
        max: 15000,
        step: 100,
        unit: "ms",
        hidden: (p) => !p.lightbox || !p.autoplay,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
})
