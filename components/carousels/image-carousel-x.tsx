import { useState, useEffect, useRef, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageItem {
    src: string
    alt: string
    title: string
    subtitle: string
}

interface DemoState {
    visibleCount: 3 | 5
    gap: number
    arcMode: "convex" | "concave" | "flat"
    arcStrength: number
    borderRadius: number
    showCaption: boolean
    showOverlay: boolean
    overlayOpacity: number
    hoverScale: number
    parallaxStrength: number
    showThumbnails: boolean
    showDots: boolean
    showArrows: boolean
    loop: boolean
    autoplay: boolean
}

interface Props {
    images: ImageItem[]
    visibleCount: 3 | 5
    gap: number
    centerWidth: number
    centerHeight: number
    sideWidth: number
    sideHeight: number
    borderRadius: number
    showDots: boolean
    showArrows: boolean
    background: string
    arcMode: "convex" | "concave" | "flat"
    arcStrength: number
    showCaption: boolean
    captionColor: string
    showOverlay: boolean
    overlayColor: string
    overlayOpacity: number
    hoverScale: number
    autoplay: boolean
    autoplayInterval: number
    pauseOnHover: boolean
    parallaxStrength: number
    showThumbnails: boolean
    thumbnailSize: number
    thumbnailGap: number
    thumbnailRadius: number
    loop: boolean
    swipeThreshold: number
    demoMode: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVisibleIndices(
    center: number,
    total: number,
    count: 3 | 5
): number[] {
    const offsets = count === 3 ? [-1, 0, 1] : [-2, -1, 0, 1, 2]
    return offsets.map((o) => (center + o + total) % total)
}

const CONFIGS_5 = (gap: number, nearY: number, farY: number) => [
    {
        xOffset: -gap * 1.9,
        yOffset: farY,
        zOffset: -280,
        rotateY: 55,
        scale: 0.72,
        opacity: 0.55,
        zIndex: 1,
    },
    {
        xOffset: -gap,
        yOffset: nearY,
        zOffset: -80,
        rotateY: 22,
        scale: 0.86,
        opacity: 0.78,
        zIndex: 2,
    },
    {
        xOffset: 0,
        yOffset: 0,
        zOffset: 80,
        rotateY: 0,
        scale: 1.0,
        opacity: 1.0,
        zIndex: 3,
    },
    {
        xOffset: gap,
        yOffset: nearY,
        zOffset: -80,
        rotateY: -22,
        scale: 0.86,
        opacity: 0.78,
        zIndex: 2,
    },
    {
        xOffset: gap * 1.9,
        yOffset: farY,
        zOffset: -280,
        rotateY: -55,
        scale: 0.72,
        opacity: 0.55,
        zIndex: 1,
    },
]

const CONFIGS_3 = (gap: number, nearY: number) => [
    {
        xOffset: -gap,
        yOffset: nearY,
        zOffset: -80,
        rotateY: 22,
        scale: 0.86,
        opacity: 0.78,
        zIndex: 2,
    },
    {
        xOffset: 0,
        yOffset: 0,
        zOffset: 80,
        rotateY: 0,
        scale: 1.0,
        opacity: 1.0,
        zIndex: 3,
    },
    {
        xOffset: gap,
        yOffset: nearY,
        zOffset: -80,
        rotateY: -22,
        scale: 0.86,
        opacity: 0.78,
        zIndex: 2,
    },
]

function buildCardConfig(
    gap: number,
    arcMode: string,
    arcStrength: number,
    count: 3 | 5
) {
    const nearY =
        arcMode === "flat"
            ? 0
            : arcMode === "convex"
              ? arcStrength * 0.5
              : -arcStrength * 0.5
    const farY =
        arcMode === "flat"
            ? 0
            : arcMode === "convex"
              ? arcStrength
              : -arcStrength
    return count === 3 ? CONFIGS_3(gap, nearY) : CONFIGS_5(gap, nearY, farY)
}

const BASE_TRANSITION =
    "transform 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)"

// ── Lazy Image ────────────────────────────────────────────────────────────────
function LazyImage({
    src,
    alt,
    style,
}: {
    src: string
    alt: string
    style: React.CSSProperties
}) {
    const ref = useRef<HTMLImageElement>(null)
    const [loaded, setLoaded] = useState(false)
    useEffect(() => {
        if (!ref.current) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (ref.current) ref.current.src = src
                    observer.disconnect()
                }
            },
            { rootMargin: "200px" }
        )
        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [src])
    return (
        <img
            ref={ref}
            alt={alt}
            draggable={false}
            onLoad={() => setLoaded(true)}
            style={{
                ...style,
                opacity: loaded ? 1 : 0,
                transition: "opacity 400ms ease",
            }}
        />
    )
}

// ── Demo Panel UI atoms ───────────────────────────────────────────────────────
function DemoToggle({
    label,
    value,
    onChange,
}: {
    label: string
    value: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
            }}
        >
            <div
                onClick={() => onChange(!value)}
                style={{
                    width: 34,
                    height: 20,
                    borderRadius: 10,
                    background: value
                        ? "rgba(255,255,255,0.88)"
                        : "rgba(255,255,255,0.13)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 2,
                        left: value ? 16 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: value
                            ? "#1a1a1a"
                            : "rgba(255,255,255,0.55)",
                        transition: "left 0.2s ease, background 0.2s ease",
                    }}
                />
            </div>
            <span
                style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui",
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </span>
        </div>
    )
}

function DemoSegment<T extends string | number>({
    label,
    options,
    value,
    onChange,
}: {
    label: string
    options: { label: string; value: T }[]
    value: T
    onChange: (v: T) => void
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
            }}
        >
            <span
                style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui",
                }}
            >
                {label}
            </span>
            <div style={{ display: "flex", gap: 2 }}>
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "none",
                            background:
                                opt.value === value
                                    ? "rgba(255,255,255,0.92)"
                                    : "rgba(255,255,255,0.09)",
                            color:
                                opt.value === value
                                    ? "#1a1a1a"
                                    : "rgba(255,255,255,0.7)",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "system-ui",
                            letterSpacing: "0.03em",
                            transition:
                                "background 0.15s ease, color 0.15s ease",
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

function DemoSlider({
    label,
    value,
    onChange,
    min,
    max,
    step,
}: {
    label: string
    value: number
    onChange: (v: number) => void
    min: number
    max: number
    step: number
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
            }}
        >
            <span
                style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui",
                }}
            >
                {label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{
                        width: 76,
                        accentColor: "white",
                        cursor: "pointer",
                    }}
                />
                <span
                    style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 10,
                        fontFamily: "system-ui",
                        minWidth: 20,
                        textAlign: "right",
                    }}
                >
                    {value}
                </span>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ImageCarouselX({
    images = [],
    visibleCount: visibleCountProp = 5,
    gap: gapProp = 280,
    centerWidth: centerWidthProp = 340,
    centerHeight: centerHeightProp = 460,
    sideWidth: sideWidthProp = 200,
    sideHeight: sideHeightProp = 380,
    borderRadius: borderRadiusProp = 20,
    showDots: showDotsProp = true,
    showArrows: showArrowsProp = true,
    background = "#ebebeb",
    arcMode: arcModeProp = "convex",
    arcStrength: arcStrengthProp = 200,
    showCaption: showCaptionProp = true,
    captionColor = "#ffffff",
    showOverlay: showOverlayProp = true,
    overlayColor = "#000000",
    overlayOpacity: overlayOpacityProp = 0.35,
    hoverScale: hoverScaleProp = 1.03,
    autoplay: autoplayProp = false,
    autoplayInterval: autoplayIntervalProp = 3000,
    pauseOnHover = true,
    parallaxStrength: parallaxStrengthProp = 20,
    showThumbnails: showThumbnailsProp = false,
    thumbnailSize = 56,
    thumbnailGap = 8,
    thumbnailRadius = 8,
    loop: loopProp = true,
    swipeThreshold = 50,
    demoMode = false,
}: Props) {
    const isStatic = useIsStaticRenderer()

    // ── Demo overrides ────────────────────────────────────────────────────────
    const [demoState, setDemoState] = useState<DemoState>({
        visibleCount: visibleCountProp,
        gap: 280,
        arcMode: arcModeProp,
        arcStrength: 200,
        borderRadius: 20,
        showCaption: showCaptionProp,
        showOverlay: showOverlayProp,
        overlayOpacity: overlayOpacityProp,
        hoverScale: hoverScaleProp,
        parallaxStrength: 20,
        showThumbnails: showThumbnailsProp,
        showDots: showDotsProp,
        showArrows: showArrowsProp,
        loop: loopProp,
        autoplay: autoplayProp,
    })

    const setDemo = <K extends keyof DemoState>(key: K, val: DemoState[K]) =>
        setDemoState((p) => ({ ...p, [key]: val }))

    // Active values: demo overrides props when demoMode is on
    const visibleCount = demoMode
        ? (demoState.visibleCount as 3 | 5)
        : visibleCountProp
    const gap = demoMode ? demoState.gap : gapProp
    const arcMode = demoMode ? demoState.arcMode : arcModeProp
    const arcStrength = demoMode ? demoState.arcStrength : arcStrengthProp
    const borderRadius = demoMode ? demoState.borderRadius : borderRadiusProp
    const showCaption = demoMode ? demoState.showCaption : showCaptionProp
    const showOverlay = demoMode ? demoState.showOverlay : showOverlayProp
    const overlayOpacity = demoMode
        ? demoState.overlayOpacity
        : overlayOpacityProp
    const hoverScale = demoMode ? demoState.hoverScale : hoverScaleProp
    const parallaxStrength = demoMode
        ? demoState.parallaxStrength
        : parallaxStrengthProp
    const showThumbnails = demoMode
        ? demoState.showThumbnails
        : showThumbnailsProp
    const showDots = demoMode ? demoState.showDots : showDotsProp
    const showArrows = demoMode ? demoState.showArrows : showArrowsProp
    const loop = demoMode ? demoState.loop : loopProp
    const autoplay = demoMode ? demoState.autoplay : autoplayProp

    // ── Carousel state ────────────────────────────────────────────────────────
    const [current, setCurrent] = useState(0)
    const [hoveredCenter, setHoveredCenter] = useState(false)
    const [parallax, setParallax] = useState({ x: 0, y: 0 })
    const [containerWidth, setContainerWidth] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const isPaused = useRef(false)
    const total = images.length
    const touchStartX = useRef(0)
    const dragStartX = useRef(0)
    const isDragging = useRef(false)
    const dragMoved = useRef(false)
    const [dragging, setDragging] = useState(false)

    useEffect(() => {
        if (total > 0 && current >= total) setCurrent(0)
    }, [total, current])
    const touchStartY = useRef(0)
    const isSwiping = useRef(false)

    // ── Responsive sizing ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return
        const obs = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width)
        })
        obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [])

    // Responsive breakpoints
    const measured = containerWidth > 0
    const isMobile = measured && containerWidth < 480

    // On mobile force 3 cards, otherwise respect user selection
    const rVisibleCount: 3 | 5 = isMobile ? 3 : visibleCount

    // Scale card sizes to container — designed for 1000px
    const w = measured ? containerWidth : 1000
    const referenceW = rVisibleCount === 5 ? 1000 : 700
    const scaleFactor = Math.min(1, Math.max(0.25, w / referenceW))

    const rCenterWidth = Math.round(centerWidthProp * scaleFactor)
    const rCenterHeight = Math.round(centerHeightProp * scaleFactor)
    const rSideWidth = Math.round(sideWidthProp * scaleFactor)
    const rSideHeight = Math.round(sideHeightProp * scaleFactor)
    const rGap = Math.round(gap * Math.min(1, Math.max(0.4, w / referenceW)))

    const CARD_CONFIG = useMemo(
        () => buildCardConfig(rGap, arcMode, arcStrength, rVisibleCount),
        [rGap, arcMode, arcStrength, rVisibleCount]
    )
    const centerSlot = rVisibleCount === 3 ? 1 : 2

    const navigate = useCallback(
        (dir: number) => {
            if (total === 0) return
            setCurrent((prev) => {
                if (!loop) {
                    if (dir > 0 && prev === total - 1) return prev
                    if (dir < 0 && prev === 0) return prev
                }
                return (prev + dir + total) % total
            })
        },
        [total, loop]
    )

    useEffect(() => {
        if (isStatic || !autoplay) return
        const tick = setInterval(() => {
            if (!isPaused.current) navigate(1)
        }, autoplayIntervalProp)
        return () => clearInterval(tick)
    }, [isStatic, autoplay, autoplayIntervalProp, navigate])

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        dragStartX.current = e.clientX
        isDragging.current = true
        dragMoved.current = false
        setDragging(true)
    }, [])

    const onMouseUp = useCallback(
        (e: React.MouseEvent) => {
            if (isDragging.current && dragMoved.current) {
                const dx = e.clientX - dragStartX.current
                if (Math.abs(dx) >= swipeThreshold) navigate(dx < 0 ? 1 : -1)
            }
            isDragging.current = false
            setDragging(false)
        },
        [navigate, swipeThreshold]
    )

    const onMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isDragging.current) {
                const dx = e.clientX - dragStartX.current
                if (Math.abs(dx) > 5) dragMoved.current = true
            }
            if (!hoveredCenter || isDragging.current) return
            const rect = e.currentTarget.getBoundingClientRect()
            const nx =
                (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
            const ny =
                (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
            setParallax({ x: nx * parallaxStrength, y: ny * parallaxStrength })
        },
        [hoveredCenter, parallaxStrength]
    )

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "ArrowLeft") navigate(-1)
            if (e.key === "ArrowRight") navigate(1)
        },
        [navigate]
    )

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        isSwiping.current = false
    }, [])

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        const dx = e.touches[0].clientX - touchStartX.current
        const dy = e.touches[0].clientY - touchStartY.current
        if (!isSwiping.current && Math.abs(dx) > Math.abs(dy))
            isSwiping.current = true
        if (isSwiping.current) e.preventDefault()
    }, [])

    const onTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current
            if (isSwiping.current && Math.abs(dx) >= swipeThreshold)
                navigate(dx < 0 ? 1 : -1)
        },
        [navigate, swipeThreshold]
    )

    if (total === 0)
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background,
                    color: "#999",
                    fontFamily: "sans-serif",
                    fontSize: 14,
                }}
            >
                No images — add some via Property Controls
            </div>
        )

    const visibleIndices = getVisibleIndices(current, total, rVisibleCount)
    const canPrev = loop || current > 0
    const canNext = loop || current < total - 1

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label="Image carousel"
            tabIndex={0}
            style={{
                width: "100%",
                height: "100%",
                background,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                userSelect: "none",
                position: "relative",
                outline: "none",
                cursor: dragging ? "grabbing" : "grab",
            }}
            onKeyDown={onKeyDown}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseEnter={() => {
                if (pauseOnHover) isPaused.current = true
            }}
            onMouseLeave={() => {
                setParallax({ x: 0, y: 0 })
                isPaused.current = false
                isDragging.current = false
                setDragging(false)
            }}
            onMouseMove={onMouseMove}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                }}
            >
                {images[current]?.title || `Image ${current + 1} of ${total}`}
            </div>

            {/* 3D Scene */}
            <div
                key={`scene-${rVisibleCount}`}
                style={{
                    position: "relative",
                    width: "100%",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: "1200px",
                }}
            >
                {visibleIndices.map((imgIdx, slot) => {
                    const cfg = CARD_CONFIG[slot]
                    const img = images[imgIdx]
                    const isCenter = slot === centerSlot
                    const activeScale =
                        isCenter && hoveredCenter
                            ? cfg.scale * hoverScale
                            : cfg.scale
                    const px = isCenter ? parallax.x : 0
                    const py = isCenter ? parallax.y : 0

                    return (
                        <div
                            key={imgIdx}
                            role={isCenter ? "img" : "button"}
                            aria-label={
                                isCenter
                                    ? img.alt ||
                                      img.title ||
                                      `Image ${imgIdx + 1}`
                                    : slot < centerSlot
                                      ? "Previous image"
                                      : "Next image"
                            }
                            tabIndex={isCenter ? -1 : 0}
                            onClick={() => {
                                if (dragMoved.current) return
                                if (slot < centerSlot) navigate(-1)
                                else if (slot > centerSlot) navigate(1)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    if (slot < centerSlot) navigate(-1)
                                    else if (slot > centerSlot) navigate(1)
                                }
                            }}
                            onMouseEnter={() => {
                                if (isCenter) setHoveredCenter(true)
                            }}
                            onMouseLeave={() => {
                                if (isCenter) setHoveredCenter(false)
                            }}
                            style={{
                                position: "absolute",
                                width: isCenter ? rCenterWidth : rSideWidth,
                                height: isCenter ? rCenterHeight : rSideHeight,
                                borderRadius,
                                overflow: "hidden",
                                cursor: isCenter ? "default" : "pointer",
                                transform: `translateX(${cfg.xOffset + px}px) translateY(${cfg.yOffset + py}px) translateZ(${cfg.zOffset}px) rotateY(${cfg.rotateY}deg) scale(${activeScale})`,
                                opacity: cfg.opacity,
                                zIndex: cfg.zIndex,
                                boxShadow: "none",
                                transition:
                                    isCenter && hoveredCenter
                                        ? "transform 120ms ease-out, opacity 700ms cubic-bezier(0.16,1,0.3,1)"
                                        : BASE_TRANSITION,
                                transformStyle: "preserve-3d",
                                willChange: "transform, opacity",
                                outline: "none",
                            }}
                        >
                            <LazyImage
                                src={img.src}
                                alt={img.alt || img.title || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    pointerEvents: "none",
                                }}
                            />

                            {isCenter && showOverlay && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: `linear-gradient(to top, ${overlayColor} 0%, transparent 60%)`,
                                        opacity: overlayOpacity,
                                        pointerEvents: "none",
                                    }}
                                />
                            )}

                            {isCenter &&
                                showCaption &&
                                (img.title || img.subtitle) && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: "24px 20px 20px",
                                            background:
                                                "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {img.title && (
                                            <div
                                                style={{
                                                    color: captionColor,
                                                    fontSize: 18,
                                                    fontWeight: 600,
                                                    fontFamily: "sans-serif",
                                                    lineHeight: 1.2,
                                                    marginBottom: img.subtitle
                                                        ? 4
                                                        : 0,
                                                    textShadow:
                                                        "0 1px 4px rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                {img.title}
                                            </div>
                                        )}
                                        {img.subtitle && (
                                            <div
                                                style={{
                                                    color: captionColor,
                                                    fontSize: 13,
                                                    opacity: 0.8,
                                                    fontFamily: "sans-serif",
                                                    lineHeight: 1.4,
                                                    textShadow:
                                                        "0 1px 4px rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                {img.subtitle}
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    )
                })}

                {showArrows && canPrev && (
                    <div
                        onClick={() => navigate(-1)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") navigate(-1)
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label="Previous image"
                        style={{
                            position: "absolute",
                            left: 24,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 100,
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        <DefaultArrow direction="left" />
                    </div>
                )}
                {showArrows && canNext && (
                    <div
                        onClick={() => navigate(1)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") navigate(1)
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label="Next image"
                        style={{
                            position: "absolute",
                            right: 24,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 100,
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        <DefaultArrow direction="right" />
                    </div>
                )}
            </div>

            {showDots && (
                <div
                    role="tablist"
                    aria-label="Carousel navigation"
                    style={{
                        display: "flex",
                        gap: 8,
                        paddingBottom: showThumbnails ? 8 : 28,
                    }}
                >
                    {images.map((_, i) => (
                        <button
                            key={i}
                            role="tab"
                            aria-selected={i === current}
                            aria-label={`Go to image ${i + 1}`}
                            onClick={() => setCurrent(i)}
                            style={{
                                width: i === current ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                border: "none",
                                background:
                                    i === current ? "#1a1a1a" : "#b0b0b0",
                                cursor: "pointer",
                                padding: 0,
                                transition:
                                    "width 0.2s ease, background 0.2s ease",
                                outline: "none",
                            }}
                        />
                    ))}
                </div>
            )}

            {showThumbnails && (
                <div
                    role="tablist"
                    aria-label="Image thumbnails"
                    style={{
                        display: "flex",
                        gap: thumbnailGap,
                        paddingBottom: 20,
                        paddingTop: 4,
                        overflowX: "auto",
                        maxWidth: "100%",
                        paddingLeft: 16,
                        paddingRight: 16,
                    }}
                >
                    {images.map((img, i) => (
                        <button
                            key={i}
                            role="tab"
                            aria-selected={i === current}
                            aria-label={img.title || `Image ${i + 1}`}
                            onClick={() => setCurrent(i)}
                            style={{
                                flexShrink: 0,
                                width: thumbnailSize,
                                height: thumbnailSize,
                                borderRadius: thumbnailRadius,
                                overflow: "hidden",
                                border:
                                    i === current
                                        ? "2px solid #1a1a1a"
                                        : "2px solid transparent",
                                padding: 0,
                                cursor: "pointer",
                                opacity: i === current ? 1 : 0.5,
                                transition:
                                    "opacity 0.2s ease, border-color 0.2s ease",
                                outline: "none",
                            }}
                        >
                            <LazyImage
                                src={img.src}
                                alt={img.alt || img.title || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* ── Demo Panel ────────────────────────────────────────────────── */}
            {demoMode && (
                <div
                    style={{
                        position: "absolute",
                        ...(isMobile ? { bottom: 16 } : { top: 16 }),
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 999,
                        background: "rgba(22,22,24,0.88)",
                        backdropFilter: "blur(28px)",
                        WebkitBackdropFilter: "blur(28px)",
                        borderRadius: 16,
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 10,
                        rowGap: 8,
                        boxShadow:
                            "0 8px 48px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
                        border: "1px solid rgba(255,255,255,0.07)",
                        justifyContent: "center",
                        maxWidth: "calc(100% - 32px)",
                        pointerEvents: "all",
                        minHeight: 0,
                        fontSize: isMobile ? 10 : 11,
                    }}
                >
                    <DemoSegment
                        label="Cards"
                        value={demoState.visibleCount}
                        onChange={(v) => setDemo("visibleCount", v)}
                        options={[
                            { label: "3", value: 3 as const },
                            { label: "5", value: 5 as const },
                        ]}
                    />
                    <DemoSegment
                        label="Arc"
                        value={demoState.arcMode}
                        onChange={(v) => setDemo("arcMode", v)}
                        options={[
                            { label: "Convex", value: "convex" as const },
                            { label: "Concave", value: "concave" as const },
                            { label: "Flat", value: "flat" as const },
                        ]}
                    />
                    <DemoSlider
                        label="Gap"
                        value={demoState.gap}
                        onChange={(v) => setDemo("gap", v)}
                        min={100}
                        max={500}
                        step={10}
                    />
                    <DemoSlider
                        label="Arc Str."
                        value={demoState.arcStrength}
                        onChange={(v) => setDemo("arcStrength", v)}
                        min={0}
                        max={200}
                        step={5}
                    />
                    <DemoSegment
                        label="Radius"
                        value={demoState.borderRadius}
                        onChange={(v) => setDemo("borderRadius", v)}
                        options={[
                            { label: "0", value: 0 },
                            { label: "S", value: 10 },
                            { label: "M", value: 20 },
                            { label: "L", value: 36 },
                        ]}
                    />
                    <DemoToggle
                        label="Caption"
                        value={demoState.showCaption}
                        onChange={(v) => setDemo("showCaption", v)}
                    />
                    <DemoToggle
                        label="Thumbs"
                        value={demoState.showThumbnails}
                        onChange={(v) => setDemo("showThumbnails", v)}
                    />
                </div>
            )}
        </div>
    )
}

// ── Default Arrow ─────────────────────────────────────────────────────────────
function DefaultArrow({ direction }: { direction: "left" | "right" }) {
    const isLeft = direction === "left"
    const [hovered, setHovered] = useState(false)
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                boxShadow: hovered
                    ? "0 6px 24px rgba(0,0,0,0.22)"
                    : "0 4px 18px rgba(0,0,0,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: hovered ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
        >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                {isLeft ? (
                    <path
                        d="M11 4L6 9L11 14"
                        stroke="#1a1a1a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ) : (
                    <path
                        d="M7 4L12 9L7 14"
                        stroke="#1a1a1a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
            </svg>
        </div>
    )
}

// ── Property Controls ─────────────────────────────────────────────────────────
addPropertyControls(ImageCarouselX, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.Image, title: "Image" },
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
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
            },
        },
    },
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
    },
    visibleCount: {
        type: ControlType.Enum,
        title: "Visible Cards",
        options: [3, 5],
        optionTitles: ["3 Cards", "5 Cards"],
        defaultValue: 5,
        hidden: (props) => !!props.demoMode,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        hidden: (props) => !!props.demoMode,
    },
    arcMode: {
        type: ControlType.Enum,
        title: "Arc Mode",
        options: ["convex", "concave", "flat"],
        optionTitles: ["Convex", "Concave", "Flat"],
        defaultValue: "convex",
        hidden: (props) => !!props.demoMode,
    },
    arcStrength: {
        type: ControlType.Number,
        title: "Arc Strength",
        defaultValue: 200,
        min: 0,
        max: 300,
        step: 10,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    gap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 280,
        min: 100,
        max: 600,
        step: 10,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    centerWidth: {
        type: ControlType.Number,
        title: "Center W",
        defaultValue: 340,
        min: 100,
        max: 600,
        step: 10,
        displayStepper: true,
    },
    centerHeight: {
        type: ControlType.Number,
        title: "Center H",
        defaultValue: 460,
        min: 100,
        max: 800,
        step: 10,
        displayStepper: true,
    },
    sideWidth: {
        type: ControlType.Number,
        title: "Side W",
        defaultValue: 200,
        min: 80,
        max: 400,
        step: 10,
        displayStepper: true,
    },
    sideHeight: {
        type: ControlType.Number,
        title: "Side H",
        defaultValue: 380,
        min: 80,
        max: 700,
        step: 10,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    showCaption: {
        type: ControlType.Boolean,
        title: "Show Caption",
        defaultValue: true,
        hidden: (props) => !!props.demoMode,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#ffffff",
        hidden: (props) => !props.showCaption || !!props.demoMode,
    },
    showOverlay: {
        type: ControlType.Boolean,
        title: "Show Overlay",
        defaultValue: true,
        hidden: (props) => !!props.demoMode,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
        hidden: (props) => !props.showOverlay || !!props.demoMode,
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
        hidden: (props) => !props.showOverlay || !!props.demoMode,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.03,
        min: 1,
        max: 1.15,
        step: 0.01,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        hidden: (props) => !!props.demoMode,
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Interval (ms)",
        defaultValue: 3000,
        min: 500,
        max: 10000,
        step: 500,
        displayStepper: true,
        hidden: (props) => !props.autoplay || !!props.demoMode,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        hidden: (props) => !props.autoplay || !!props.demoMode,
    },
    swipeThreshold: {
        type: ControlType.Number,
        title: "Swipe Threshold",
        defaultValue: 50,
        min: 20,
        max: 150,
        step: 5,
        displayStepper: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        hidden: (props) => !!props.demoMode,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: true,
        hidden: (props) => !!props.demoMode,
    },
    showThumbnails: {
        type: ControlType.Boolean,
        title: "Show Thumbnails",
        defaultValue: false,
        hidden: (props) => !!props.demoMode,
    },
    thumbnailSize: {
        type: ControlType.Number,
        title: "Thumbnail Size",
        defaultValue: 56,
        min: 32,
        max: 120,
        step: 4,
        displayStepper: true,
        hidden: (props) => !props.showThumbnails,
    },
    thumbnailGap: {
        type: ControlType.Number,
        title: "Thumbnail Gap",
        defaultValue: 8,
        min: 2,
        max: 24,
        step: 2,
        displayStepper: true,
        hidden: (props) => !props.showThumbnails,
    },
    thumbnailRadius: {
        type: ControlType.Number,
        title: "Thumbnail Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 2,
        displayStepper: true,
        hidden: (props) => !props.showThumbnails,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ebebeb",
    },
})
