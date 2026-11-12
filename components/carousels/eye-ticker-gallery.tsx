/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 920
 * @framerIntrinsicHeight 560
 * @framerDisableUnusedStyles
 */

// Eye Gallery — karim saif
// Props set in the preview:
//   cardWidth: 100
//   cardHeight: 150
//   rowGap: 120

"use client"

import * as React from "react"
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Direction = "left" | "right"
type Fit = "cover" | "contain"
type LightboxAnimation = "scale" | "fade" | "none"

type ImageInput = {
    image?: { src?: string; srcSet?: string; alt?: string } | string
    focusY?: number
}

interface RowSettings {
    direction: Direction
    gap: number
    arc: number
}

interface Props {
    topImages?: ImageInput[]
    bottomImages?: ImageInput[]
    topRow?: RowSettings
    bottomRow?: RowSettings
    speed?: number
    scrollSpeedMultiplier?: number
    rowGap?: number
    fit?: Fit
    cardWidth?: number
    cardHeight?: number
    rounded?: number
    fade?: boolean
    fadeIntensity?: number

    // Hover & Interaction Controls
    hoverScale?: number
    hoverRotate?: number
    pauseOnHover?: boolean

    // Border & Shadow Controls
    borderWidth?: number
    borderColor?: string
    shadowBlur?: number
    shadowOffsetY?: number
    shadowColor?: string

    // Offsets
    randomStart?: boolean

    // Lightbox Controls
    enableLightbox?: boolean
    overlayOpacity?: number
    backdropBlur?: number
    lightboxAnimation?: LightboxAnimation
    showCloseButton?: boolean
    closeOnBgClick?: boolean

    // Image Filters
    grayscale?: number
    brightness?: number
    contrast?: number
    saturation?: number

    style?: React.CSSProperties
}

const DEFAULTS = {
    topRow: {
        direction: "right" as Direction,
        gap: 32,
        arc: 63,
    },
    bottomRow: {
        direction: "left" as Direction,
        gap: 32,
        arc: 63,
    },
    speed: 20,
    scrollSpeedMultiplier: 2.5,
    rowGap: 120,
    fit: "cover" as Fit,
    focusY: 50,
    cardWidth: 100,
    cardHeight: 150,
    rounded: 2,
    fade: true,
    fadeIntensity: 100,
    hoverScale: 1.03,
    hoverRotate: 0,
    pauseOnHover: true,
    borderWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowBlur: 42,
    shadowOffsetY: 18,
    shadowColor: "rgba(22, 24, 29, 0.14)",
    randomStart: false,
    enableLightbox: true,
    overlayOpacity: 75,
    backdropBlur: 8,
    lightboxAnimation: "scale" as LightboxAnimation,
    showCloseButton: true,
    closeOnBgClick: true,
    grayscale: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
}

const FALLBACK_TOP: ImageInput[] = [
    {
        image: {
            src: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
            alt: "Mountain landscape at starry night",
        },
        focusY: 50,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
            alt: "Ocean wave under dusk sunlight",
        },
        focusY: 50,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
            alt: "Tropical sandy beach shore",
        },
        focusY: 50,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
            alt: "Snow covered mountain peaks",
        },
        focusY: 50,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
            alt: "Alpine mountain range sunset",
        },
        focusY: 50,
    },
]

const FALLBACK_BOTTOM: ImageInput[] = [
    {
        image: {
            src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
            alt: "Yosemite Valley river reflection",
        },
        focusY: 50,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&q=80",
            alt: "Northern lights over forest",
        },
        focusY: 50,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
            alt: "Mist rising over green hilltops",
        },
        focusY: 50,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
            alt: "Forest landscape aerial shot",
        },
        focusY: 50,
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
            alt: "Lake shore surrounded by hills",
        },
        focusY: 50,
    },
]

const MAX_FADE = 40
const PX_PER_SPEED = 14

function resolveImageSrc(item: unknown): string | undefined {
    const image = (item as ImageInput)?.image
    if (!image) return undefined
    if (typeof image === "string") return image.trim() || undefined
    return image.src || undefined
}

function resolveSrcSet(item: unknown): string | undefined {
    const image = (item as ImageInput)?.image
    if (!image || typeof image === "string") return undefined
    return image.srcSet || undefined
}

function resolveAltText(item: unknown): string {
    const image = (item as ImageInput)?.image
    if (!image || typeof image === "string") return ""
    return image.alt || ""
}

function focusOf(item: unknown): number {
    const value = (item as ImageInput)?.focusY
    const n = typeof value === "number" ? value : DEFAULTS.focusY
    return Math.min(100, Math.max(0, n))
}

const roundedPx = (rounded: number, width: number, height: number) =>
    (Math.min(width, height) / 2) * (Math.min(20, Math.max(0, rounded)) / 20)

function repeatToFill<T>(items: T[], step: number, pathWidth: number): T[] {
    if (items.length === 0) return items
    const setWidth = Math.max(1, items.length * step)
    const copies = Math.max(2, Math.ceil((pathWidth + setWidth) / setWidth) + 2)
    return Array.from({ length: copies }).flatMap(() => items)
}

function TickerRow({
    images,
    row,
    side,
    speed,
    scrollSpeedMultiplier,
    width,
    height,
    rowGap,
    fit,
    cardWidth,
    cardHeight,
    radius,
    hoverScale,
    hoverRotate,
    pauseOnHover,
    borderWidth,
    borderColor,
    boxShadowStyle,
    imageFilterStyle,
    randomStart,
    enableLightbox,
    onCardClick,
    isStatic,
}: {
    images: ImageInput[]
    row: RowSettings
    side: "top" | "bottom"
    speed: number
    scrollSpeedMultiplier: number
    width: number
    height: number
    rowGap: number
    fit: Fit
    cardWidth: number
    cardHeight: number
    radius: number
    hoverScale: number
    hoverRotate: number
    pauseOnHover: boolean
    borderWidth: number
    borderColor: string
    boxShadowStyle: string
    imageFilterStyle: string
    randomStart: boolean
    enableLightbox: boolean
    onCardClick: (src: string, alt: string) => void
    isStatic: boolean
}) {
    const itemRefs = useRef<Array<HTMLDivElement | null>>([])
    const scrollVelocityRef = useRef(0)
    const lastScrollYRef = useRef(0)
    const isHoveredRef = useRef(false)

    // Extended outside margins to prevent premature pop-in
    const outside = Math.max(cardWidth * 2, width * 0.2)
    const pathWidth = Math.max(1, width - cardWidth + outside * 2)
    const step = Math.max(cardWidth * 0.25, cardWidth + row.gap)

    const cards = useMemo(
        () => repeatToFill(images, step, pathWidth),
        [images, step, pathWidth]
    )
    const loopLength = Math.max(1, cards.length * step)

    const initialOffset = useMemo(() => {
        if (!randomStart) return 0
        return side === "bottom" ? loopLength * 0.45 : 0
    }, [randomStart, side, loopLength])

    const bow = side === "top" ? -1 : 1
    const baseline = height / 2 + (bow * rowGap) / 2
    const headroom = Math.max(0, height / 2 - cardHeight / 2)
    const amplitude = headroom * (Math.min(100, Math.max(0, row.arc)) / 100)

    useEffect(() => {
        if (isStatic) return

        let timeoutId: number
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            const delta = Math.abs(currentScrollY - lastScrollYRef.current)
            lastScrollYRef.current = currentScrollY

            scrollVelocityRef.current = delta * scrollSpeedMultiplier

            clearTimeout(timeoutId)
            timeoutId = window.setTimeout(() => {
                scrollVelocityRef.current = 0
            }, 100)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", handleScroll)
            clearTimeout(timeoutId)
        }
    }, [scrollSpeedMultiplier, isStatic])

    const placeAt = (index: number, travel: number) => {
        const raw = index * step + travel + initialOffset
        const wrapped = ((raw % loopLength) + loopLength) % loopLength
        const progress = Math.max(0, Math.min(1, wrapped / pathWidth))
        const x = wrapped - outside
        const y =
            baseline +
            bow * amplitude * Math.sin(Math.PI * progress) -
            cardHeight / 2
        const visible = x > -cardWidth * 1.5 && x < width + cardWidth * 0.5
        // Consistent, stable zIndex based on array index to eliminate jumping
        const z = index + 1
        return { x, y, visible, z }
    }

    useEffect(() => {
        if (isStatic || width <= 0 || height <= 0 || cards.length === 0) return

        let frame = 0
        let lastTime = performance.now()
        let totalTravel = 0
        const sign = row.direction === "left" ? -1 : 1

        const tick = (now: number) => {
            const dt = (now - lastTime) / 1000
            lastTime = now

            if (!pauseOnHover || !isHoveredRef.current) {
                const basePace = Math.max(1, speed) * PX_PER_SPEED
                const currentPace =
                    basePace + scrollVelocityRef.current * PX_PER_SPEED
                totalTravel += dt * currentPace * sign
            }

            for (let i = 0; i < cards.length; i++) {
                const el = itemRefs.current[i]
                if (!el) continue
                const { x, y, visible, z } = placeAt(i, totalTravel)
                el.style.transform = `translate3d(${x}px, ${y}px, 0)`
                el.style.opacity = visible ? "1" : "0"
                el.style.pointerEvents = visible
                    ? enableLightbox
                        ? "auto"
                        : "none"
                    : "none"
                el.style.zIndex = String(z)
            }

            frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [
        cards.length,
        step,
        loopLength,
        pathWidth,
        outside,
        speed,
        row.direction,
        side,
        width,
        height,
        rowGap,
        cardWidth,
        cardHeight,
        initialOffset,
        pauseOnHover,
        enableLightbox,
        isStatic,
    ])

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "visible",
            }}
            onMouseEnter={() => {
                isHoveredRef.current = true
            }}
            onMouseLeave={() => {
                isHoveredRef.current = false
            }}
        >
            {cards.map((image, index) => {
                const src = resolveImageSrc(image)
                const alt = resolveAltText(image)
                const at = placeAt(index, 0)

                const handleKeyDown = (e: React.KeyboardEvent) => {
                    if (!enableLightbox || !src) return
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onCardClick(src, alt)
                    }
                }

                return (
                    <div
                        key={`${index}-${src}`}
                        ref={(el) => {
                            itemRefs.current[index] = el
                        }}
                        tabIndex={enableLightbox && src ? 0 : -1}
                        role={enableLightbox && src ? "button" : undefined}
                        aria-label={alt || "Gallery image"}
                        onClick={() =>
                            enableLightbox && src && onCardClick(src, alt)
                        }
                        onKeyDown={handleKeyDown}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: cardWidth,
                            height: cardHeight,
                            borderRadius: radius,
                            border:
                                borderWidth > 0
                                    ? `${borderWidth}px solid ${borderColor}`
                                    : "none",
                            boxShadow: boxShadowStyle,
                            overflow: "hidden",
                            willChange: "transform",
                            transform: `translate3d(${at.x}px, ${at.y}px, 0)`,
                            opacity: at.visible ? 1 : 0,
                            zIndex: at.z,
                            cursor: enableLightbox ? "pointer" : "default",
                            pointerEvents: at.visible
                                ? enableLightbox
                                    ? "auto"
                                    : "none"
                                : "none",
                            transition:
                                "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                        onMouseEnter={(e) => {
                            if (
                                !isStatic &&
                                (hoverScale !== 1 || hoverRotate !== 0)
                            ) {
                                e.currentTarget.style.transform += ` scale(${hoverScale}) rotate(${hoverRotate}deg)`
                                e.currentTarget.style.zIndex = "9999"
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (
                                !isStatic &&
                                (hoverScale !== 1 || hoverRotate !== 0)
                            ) {
                                const currentTransform =
                                    e.currentTarget.style.transform
                                const cleaned = currentTransform
                                    .replace(` scale(${hoverScale})`, "")
                                    .replace(` rotate(${hoverRotate}deg)`, "")
                                e.currentTarget.style.transform = cleaned
                                e.currentTarget.style.zIndex = String(at.z)
                            }
                        }}
                    >
                        {src ? (
                            <img
                                src={src}
                                srcSet={resolveSrcSet(image)}
                                alt={alt}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: fit,
                                    objectPosition:
                                        fit === "cover"
                                            ? `center ${focusOf(image)}%`
                                            : "center",
                                    filter: imageFilterStyle,
                                    display: "block",
                                }}
                            />
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

export default function EyeTicker({
    topImages = FALLBACK_TOP,
    bottomImages = FALLBACK_BOTTOM,
    topRow = DEFAULTS.topRow,
    bottomRow = DEFAULTS.bottomRow,
    speed = DEFAULTS.speed,
    scrollSpeedMultiplier = DEFAULTS.scrollSpeedMultiplier,
    rowGap = DEFAULTS.rowGap,
    fit = DEFAULTS.fit,
    cardWidth = DEFAULTS.cardWidth,
    cardHeight = DEFAULTS.cardHeight,
    rounded = DEFAULTS.rounded,
    fade = DEFAULTS.fade,
    fadeIntensity = DEFAULTS.fadeIntensity,
    hoverScale = DEFAULTS.hoverScale,
    hoverRotate = DEFAULTS.hoverRotate,
    pauseOnHover = DEFAULTS.pauseOnHover,
    borderWidth = DEFAULTS.borderWidth,
    borderColor = DEFAULTS.borderColor,
    shadowBlur = DEFAULTS.shadowBlur,
    shadowOffsetY = DEFAULTS.shadowOffsetY,
    shadowColor = DEFAULTS.shadowColor,
    randomStart = DEFAULTS.randomStart,
    enableLightbox = DEFAULTS.enableLightbox,
    overlayOpacity = DEFAULTS.overlayOpacity,
    backdropBlur = DEFAULTS.backdropBlur,
    lightboxAnimation = DEFAULTS.lightboxAnimation,
    showCloseButton = DEFAULTS.showCloseButton,
    closeOnBgClick = DEFAULTS.closeOnBgClick,
    grayscale = DEFAULTS.grayscale,
    brightness = DEFAULTS.brightness,
    contrast = DEFAULTS.contrast,
    saturation = DEFAULTS.saturation,
    style,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [size, setSize] = useState({ width: 920, height: 560 })
    const [activeModal, setActiveModal] = useState<{
        src: string
        alt: string
    } | null>(null)

    useLayoutEffect(() => {
        const node = containerRef.current
        if (!node) return
        const measure = () => {
            const width = node.clientWidth
            const height = node.clientHeight
            if (width && height) setSize({ width, height })
        }
        measure()
        const observer =
            typeof ResizeObserver === "undefined"
                ? null
                : new ResizeObserver(measure)
        observer?.observe(node)
        return () => observer?.disconnect()
    }, [])

    const scale = Math.max(0.42, Math.min(1, size.width / 920))
    const width = cardWidth * scale
    const height = cardHeight * scale
    const radius = roundedPx(rounded, width, height)

    const top = { ...DEFAULTS.topRow, ...topRow }
    const bottom = { ...DEFAULTS.bottomRow, ...bottomRow }

    const edge = (Math.min(100, Math.max(0, fadeIntensity)) / 100) * MAX_FADE
    const fadeMask =
        fade && edge > 0
            ? `linear-gradient(to right, transparent 0%, black ${edge}%, black ${
                  100 - edge
              }%, transparent 100%)`
            : undefined

    const topList = useMemo(() => {
        const list =
            topImages && topImages.length > 0 ? topImages : FALLBACK_TOP
        return list.filter(resolveImageSrc)
    }, [topImages])

    const bottomList = useMemo(() => {
        const list =
            bottomImages && bottomImages.length > 0
                ? bottomImages
                : FALLBACK_BOTTOM
        return list.filter(resolveImageSrc)
    }, [bottomImages])

    const handleCardClick = useCallback((src: string, alt: string) => {
        setActiveModal({ src, alt })
    }, [])

    const handleCloseModal = useCallback(() => {
        setActiveModal(null)
    }, [])

    useEffect(() => {
        if (!activeModal) return

        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleCloseModal()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => {
            document.body.style.overflow = originalOverflow
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [activeModal, handleCloseModal])

    const boxShadowStyle = useMemo(() => {
        if (shadowBlur === 0 && shadowOffsetY === 0) return "none"
        return `0px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`
    }, [shadowBlur, shadowOffsetY, shadowColor])

    const imageFilterStyle = useMemo(() => {
        const filters: string[] = []
        if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`)
        if (brightness !== 100) filters.push(`brightness(${brightness}%)`)
        if (contrast !== 100) filters.push(`contrast(${contrast}%)`)
        if (saturation !== 100) filters.push(`saturate(${saturation}%)`)
        return filters.length > 0 ? filters.join(" ") : "none"
    }, [grayscale, brightness, contrast, saturation])

    const getLightboxAnimStyles = () => {
        if (lightboxAnimation === "none") return {}
        if (lightboxAnimation === "fade") {
            return {
                animation:
                    "framerEyeGalleryFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }
        }
        return {
            animation:
                "framerEyeGalleryScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }
    }

    const isEmptyState = topList.length === 0 && bottomList.length === 0

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                minWidth: 180,
                position: "relative",
                overflow: "hidden",
                isolation: "isolate",
                boxSizing: "border-box",
                maskImage: fadeMask,
                WebkitMaskImage: fadeMask,
            }}
        >
            <style>{`
                @keyframes framerEyeGalleryScaleIn {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes framerEyeGalleryFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>

            {isEmptyState ? (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        color: "rgba(0, 0, 0, 0.4)",
                        fontSize: 14,
                        fontFamily: "sans-serif",
                    }}
                >
                    Add images in property controls →
                </div>
            ) : (
                <>
                    <TickerRow
                        images={topList}
                        row={top}
                        side="top"
                        speed={speed}
                        scrollSpeedMultiplier={scrollSpeedMultiplier}
                        width={size.width}
                        height={size.height}
                        rowGap={rowGap}
                        fit={fit}
                        cardWidth={width}
                        cardHeight={height}
                        radius={radius}
                        hoverScale={hoverScale}
                        hoverRotate={hoverRotate}
                        pauseOnHover={pauseOnHover}
                        borderWidth={borderWidth}
                        borderColor={borderColor}
                        boxShadowStyle={boxShadowStyle}
                        imageFilterStyle={imageFilterStyle}
                        randomStart={randomStart}
                        enableLightbox={enableLightbox}
                        onCardClick={handleCardClick}
                        isStatic={isStatic}
                    />
                    <TickerRow
                        images={bottomList}
                        row={bottom}
                        side="bottom"
                        speed={speed}
                        scrollSpeedMultiplier={scrollSpeedMultiplier}
                        width={size.width}
                        height={size.height}
                        rowGap={rowGap}
                        fit={fit}
                        cardWidth={width}
                        cardHeight={height}
                        radius={radius}
                        hoverScale={hoverScale}
                        hoverRotate={hoverRotate}
                        pauseOnHover={pauseOnHover}
                        borderWidth={borderWidth}
                        borderColor={borderColor}
                        boxShadowStyle={boxShadowStyle}
                        imageFilterStyle={imageFilterStyle}
                        randomStart={randomStart}
                        enableLightbox={enableLightbox}
                        onCardClick={handleCardClick}
                        isStatic={isStatic}
                    />
                </>
            )}

            {/* Lightbox Modal */}
            {activeModal && enableLightbox ? (
                <div
                    onClick={() => closeOnBgClick && handleCloseModal()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image lightbox preview"
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 999999,
                        backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})`,
                        backdropFilter: `blur(${backdropBlur}px)`,
                        WebkitBackdropFilter: `blur(${backdropBlur}px)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                        cursor: closeOnBgClick ? "pointer" : "default",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            maxWidth: "90vw",
                            maxHeight: "85vh",
                            borderRadius: 16,
                            overflow: "hidden",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                            backgroundColor: "#000",
                            cursor: "default",
                            ...getLightboxAnimStyles(),
                        }}
                    >
                        {showCloseButton && (
                            <button
                                onClick={handleCloseModal}
                                aria-label="Close modal"
                                style={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    border: "none",
                                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                                    color: "#fff",
                                    fontSize: 18,
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 10,
                                    backdropFilter: "blur(4px)",
                                }}
                            >
                                ✕
                            </button>
                        )}
                        <img
                            src={activeModal.src}
                            alt={activeModal.alt || "Lightbox image preview"}
                            decoding="async"
                            style={{
                                width: "100%",
                                height: "100%",
                                maxHeight: "85vh",
                                objectFit: "contain",
                                display: "block",
                                filter: imageFilterStyle,
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

addPropertyControls(EyeTicker, {
    topImages: {
        type: ControlType.Array,
        title: "Top Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                focusY: {
                    type: ControlType.Number,
                    title: "Focus Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    unit: "%",
                },
            },
        },
    },
    bottomImages: {
        type: ControlType.Array,
        title: "Bottom Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                focusY: {
                    type: ControlType.Number,
                    title: "Focus Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    unit: "%",
                },
            },
        },
    },
    topRow: {
        type: ControlType.Object,
        title: "Top Row",
        controls: {
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "right",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 32,
                min: 0,
                max: 200,
            },
            arc: {
                type: ControlType.Number,
                title: "Arc Curve",
                defaultValue: 63,
                min: 0,
                max: 100,
                unit: "%",
            },
        },
    },
    bottomRow: {
        type: ControlType.Object,
        title: "Bottom Row",
        controls: {
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "left",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 32,
                min: 0,
                max: 200,
            },
            arc: {
                type: ControlType.Number,
                title: "Arc Curve",
                defaultValue: 63,
                min: 0,
                max: 100,
                unit: "%",
            },
        },
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 20,
        min: 1,
        max: 100,
    },
    scrollSpeedMultiplier: {
        type: ControlType.Number,
        title: "Scroll Boost",
        defaultValue: 2.5,
        min: 0,
        max: 10,
        step: 0.1,
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 120,
        min: 0,
        max: 300,
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 100,
        min: 20,
        max: 500,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 150,
        min: 20,
        max: 500,
    },
    rounded: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 2,
        min: 0,
        max: 20,
    },
    randomStart: {
        type: ControlType.Boolean,
        title: "Random Start",
        defaultValue: false,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.03,
        min: 1.0,
        max: 1.15,
        step: 0.01,
    },
    hoverRotate: {
        type: ControlType.Number,
        title: "Hover Rotate",
        defaultValue: 0,
        min: -10,
        max: 10,
        unit: "°",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 10,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255, 255, 255, 0.2)",
        hidden(props) {
            return !props.borderWidth
        },
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 42,
        min: 0,
        max: 100,
    },
    shadowOffsetY: {
        type: ControlType.Number,
        title: "Shadow Offset Y",
        defaultValue: 18,
        min: 0,
        max: 50,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(22, 24, 29, 0.14)",
    },
    fade: {
        type: ControlType.Boolean,
        title: "Fade Edges",
        defaultValue: true,
    },
    fadeIntensity: {
        type: ControlType.Number,
        title: "Fade Intensity",
        defaultValue: 100,
        min: 0,
        max: 100,
        hidden(props) {
            return !props.fade
        },
    },
    enableLightbox: {
        type: ControlType.Boolean,
        title: "Enable Lightbox",
        defaultValue: true,
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 75,
        min: 0,
        max: 100,
        unit: "%",
        hidden(props) {
            return !props.enableLightbox
        },
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 8,
        min: 0,
        max: 30,
        unit: "px",
        hidden(props) {
            return !props.enableLightbox
        },
    },
    lightboxAnimation: {
        type: ControlType.Enum,
        title: "Modal Anim",
        options: ["scale", "fade", "none"],
        optionTitles: ["Scale", "Fade", "None"],
        defaultValue: "scale",
        hidden(props) {
            return !props.enableLightbox
        },
    },
    showCloseButton: {
        type: ControlType.Boolean,
        title: "Close Button",
        defaultValue: true,
        hidden(props) {
            return !props.enableLightbox
        },
    },
    closeOnBgClick: {
        type: ControlType.Boolean,
        title: "Click Outside",
        defaultValue: true,
        hidden(props) {
            return !props.enableLightbox
        },
    },
    grayscale: {
        type: ControlType.Number,
        title: "Grayscale",
        defaultValue: 0,
        min: 0,
        max: 100,
        unit: "%",
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        defaultValue: 100,
        min: 0,
        max: 200,
        unit: "%",
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        defaultValue: 100,
        min: 0,
        max: 200,
        unit: "%",
    },
    saturation: {
        type: ControlType.Number,
        title: "Saturate",
        defaultValue: 100,
        min: 0,
        max: 200,
        unit: "%",
    },
    // Panel Footer Credit
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Eye Gallery",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
