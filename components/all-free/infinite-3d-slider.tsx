// Infinite3DCardDragSlider.tsx

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 810
 */

import * as React from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type CardImage =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
      }

interface CardData {
    image: CardImage
}

interface Props {
    cards: CardData[]
    visibleCount: number
    cardWidth: number
    cardHeight: number
    stackSpacing: number
    perspective: number
    borderRadius: number
    cardAngle: number
    enableLightbox: boolean
    lightboxBackdrop: string
    lightboxBlur: number
}

const DEFAULT_CARDS: CardData[] = [
    { image: { src: "", alt: "Image Placeholder 1" } },
]

const sameCard = (a: CardData, b: CardData) => {
    const aImg = typeof a.image === "string" ? a.image : a.image?.src
    const bImg = typeof b.image === "string" ? b.image : b.image?.src
    return aImg === bImg
}

interface MemoizedCardProps {
    card: CardData
    virtualIndex: number
    virtualPos: number
    dataIndex: number
    isFocused: boolean
    isBehindFocused: boolean
    isDragging: boolean
    isStaticRenderer: boolean
    borderRadius: number
    cardWidth: number
    cardHeight: number
    layoutValues: any
    smartFocusScale: number
    springConfig: any
    focusedIndex: number | null
    setFocusedIndex: (i: number | null) => void
    enableLightbox: boolean
    onOpenLightbox: (src: string, alt: string) => void
}

function ImagePlaceholder({ borderRadius }: { borderRadius: number }) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #F2F2F2 0%, #E6E6E6 100%)",
                borderRadius,
                border: "1px dashed rgba(0,0,0,0.14)",
                color: "rgba(0,0,0,0.45)",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            Image Placeholder
        </div>
    )
}

function Card({
    card,
    virtualIndex,
    virtualPos,
    dataIndex,
    isFocused,
    isBehindFocused,
    isDragging,
    isStaticRenderer,
    borderRadius,
    cardWidth,
    cardHeight,
    layoutValues,
    smartFocusScale,
    springConfig,
    focusedIndex,
    setFocusedIndex,
    enableLightbox,
    onOpenLightbox,
}: MemoizedCardProps) {
    const [isHovered, setIsHovered] = React.useState(false)

    const baseXScreen = virtualPos * layoutValues.spacing
    const baseZ = -virtualPos * layoutValues.stackDepth

    const p = Math.max(1, layoutValues.perspective)
    const depthComp = (p - baseZ) / p

    const finalScale = isFocused ? smartFocusScale : 1
    const hoverXScreen =
        !isStaticRenderer && !isFocused && !isDragging && isHovered ? 100 : 0
    const finalX = isFocused ? 0 : baseXScreen * depthComp
    const finalY = 0
    const finalZ = isFocused ? 200 : baseZ
    const finalRotateY = isFocused ? 0 : layoutValues.cardTilt
    const finalRotateX = isFocused ? -layoutValues.viewAngle : 0
    const finalOpacity = isBehindFocused ? 0.4 : 1

    const imageSrc =
        typeof card.image === "string" ? card.image : card.image?.src || ""
    const imageAlt =
        typeof card.image === "string"
            ? `Card ${dataIndex + 1}`
            : card.image?.alt || `Card ${dataIndex + 1}`

    const hasImage = Boolean(imageSrc)

    const outerStyle: React.CSSProperties = {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: cardWidth,
        height: cardHeight,
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
        zIndex: isFocused ? 1000 : 800 - dataIndex,
        cursor: isStaticRenderer || !hasImage ? "default" : "pointer",
        pointerEvents: "auto",
        willChange: isStaticRenderer ? "auto" : "transform, opacity",
        userSelect: "none",
        WebkitUserSelect: "none",
    }

    const innerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        transform: "translateZ(0)",
        pointerEvents: "none",
        willChange: isStaticRenderer ? "auto" : "transform",
    }

    const frameStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        borderRadius,
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(135deg, #F2F2F2 0%, #E6E6E6 100%)",
        backfaceVisibility: "hidden",
        willChange: isStaticRenderer ? "auto" : "transform",
        pointerEvents: "none",
        transform: "translateZ(0)",
        boxShadow: "none",
        filter: "none",
        backdropFilter: "none",
    }

    if (isStaticRenderer) {
        return (
            <div
                style={{
                    ...outerStyle,
                    opacity: finalOpacity,
                    transform: `translate3d(${finalX - cardWidth / 2}px, ${
                        finalY - cardHeight / 2
                    }px, ${finalZ}px) rotateX(${finalRotateX}deg) rotateY(${finalRotateY}deg) scale(${finalScale})`,
                }}
            >
                <div
                    style={{
                        ...innerStyle,
                        transform: `translateX(${hoverXScreen}px) scale(1)`,
                    }}
                >
                    <div style={frameStyle}>
                        {hasImage ? (
                            <img
                                src={imageSrc}
                                alt={imageAlt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                    display: "block",
                                }}
                                draggable={false}
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <ImagePlaceholder borderRadius={borderRadius} />
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            style={outerStyle}
            initial={false}
            animate={{
                x: finalX - cardWidth / 2,
                y: finalY - cardHeight / 2,
                z: finalZ,
                rotateY: finalRotateY,
                rotateX: finalRotateX,
                scale: finalScale,
                opacity: finalOpacity,
            }}
            transition={springConfig}
            onPointerEnter={() =>
                React.startTransition(() => setIsHovered(true))
            }
            onPointerLeave={() =>
                React.startTransition(() => setIsHovered(false))
            }
            onClick={(e) => {
                e.stopPropagation()
                if (isDragging) return
                if (!hasImage) return
                if (enableLightbox && imageSrc) {
                    onOpenLightbox(imageSrc, imageAlt)
                    return
                }
                if (!isFocused && focusedIndex === null) {
                    setFocusedIndex(virtualIndex)
                } else if (isFocused) {
                    setFocusedIndex(null)
                }
            }}
        >
            <motion.div
                initial={false}
                animate={{
                    x: hoverXScreen,
                    scale: !isFocused && !isDragging && isHovered ? 1.03 : 1,
                }}
                transition={{
                    type: "tween",
                    duration: 0.4,
                    ease: "easeInOut",
                }}
                style={innerStyle}
            >
                <div style={frameStyle}>
                    {hasImage ? (
                        <img
                            src={imageSrc}
                            alt={imageAlt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                pointerEvents: "none",
                                userSelect: "none",
                                display: "block",
                            }}
                            draggable={false}
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <ImagePlaceholder borderRadius={borderRadius} />
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

const MemoizedCard = React.memo(
    Card,
    (p, n) =>
        p.virtualIndex === n.virtualIndex &&
        p.dataIndex === n.dataIndex &&
        p.isFocused === n.isFocused &&
        p.isBehindFocused === n.isBehindFocused &&
        p.isDragging === n.isDragging &&
        p.isStaticRenderer === n.isStaticRenderer &&
        p.borderRadius === n.borderRadius &&
        p.smartFocusScale === n.smartFocusScale &&
        p.springConfig === n.springConfig &&
        p.cardWidth === n.cardWidth &&
        p.cardHeight === n.cardHeight &&
        p.layoutValues === n.layoutValues &&
        p.focusedIndex === n.focusedIndex &&
        sameCard(p.card, n.card)
)

export default function Infinite3DCardDragSlider(props: Partial<Props>) {
    const isStaticRenderer = useIsStaticRenderer()

    const {
        cards = DEFAULT_CARDS,
        visibleCount = 30,
        cardWidth = 400,
        cardHeight = 400,
        stackSpacing = 200,
        perspective = 3000,
        borderRadius = 12,
        cardAngle = -45,
        enableLightbox = true,
        lightboxBackdrop = "rgba(255, 255, 255, 0.7)",
        lightboxBlur = 5,
    } = props

    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const [basePosition, setBasePosition] = React.useState(0)
    const [dragOffset, setDragOffset] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const [container, setContainer] = React.useState({ w: 1200, h: 810 })
    const [isInView, setIsInView] = React.useState(true)

    const [lightbox, setLightbox] = React.useState<{
        src: string
        alt: string
    } | null>(null)

    const dragOffsetTarget = React.useRef(0)
    const dragRAF = React.useRef<number | null>(null)
    const lastDragFrame = React.useRef<number>(0)

    const DRAG_SENSITIVITY = 2.25

    const setFocusedIndexT = React.useCallback((i: number | null) => {
        React.startTransition(() => setFocusedIndex(i))
    }, [])

    const containerRef = React.useRef<HTMLDivElement>(null)
    const lastScrollTime = React.useRef(0)
    const resizeTO = React.useRef<number | null>(null)

    const dragRef = React.useRef({
        active: false,
        pointerId: -1,
        startX: 0,
        startBasePosition: 0,
        moved: false,
        lastX: 0,
        lastT: 0,
        velocity: 0,
    })

    const isMobile = container.w > 0 && container.w <= 768
    const cardW = cardWidth
    const cardH = isMobile ? cardWidth * (cardHeight / cardWidth) : cardHeight

    const spacing = isMobile ? stackSpacing * 0.65 : stackSpacing
    const stackDepth = isMobile ? 96 : 120

    const cardCount = cards.length
    const safeVisibleCount = Math.max(1, Math.min(visibleCount, 50))
    const focusAnchor = Math.floor(safeVisibleCount / 2)

    const mod = React.useCallback(
        (n: number, m: number) => ((n % m) + m) % m,
        []
    )

    const layoutValues = React.useMemo(
        () => ({
            spacing,
            viewAngle: -30,
            cardTilt: cardAngle,
            hoverLift: 0,
            hoverSlide: 50,
            stackDepth,
            perspective,
        }),
        [spacing, cardAngle, stackDepth, perspective]
    )

    const smartFocusScale = React.useMemo(() => {
        const focusScale = 1.4
        const maxW = (container.w * 0.75) / cardW
        const maxH = (container.h * 0.75) / cardH
        return Math.min(focusScale, maxW, maxH, 2.0)
    }, [container.w, container.h, cardW, cardH])

    const handleResize = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        if (resizeTO.current) window.clearTimeout(resizeTO.current)

        resizeTO.current = window.setTimeout(() => {
            if (!containerRef.current) return
            const r = containerRef.current.getBoundingClientRect()
            if (
                r.width &&
                r.height &&
                (Math.abs(r.width - container.w) > 2 ||
                    Math.abs(r.height - container.h) > 2)
            ) {
                React.startTransition(() =>
                    setContainer({ w: r.width, h: r.height })
                )
            }
        }, 120)
    }, [container.w, container.h])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (typeof (window as any).ResizeObserver === "undefined") {
            handleResize()
            return
        }

        const ro = new ResizeObserver(handleResize)
        if (containerRef.current) {
            handleResize()
            ro.observe(containerRef.current)
        }

        return () => ro.disconnect()
    }, [handleResize])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!containerRef.current) return
        if (typeof IntersectionObserver === "undefined") {
            setIsInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)
            },
            { root: null, threshold: 0.01 }
        )

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        if (typeof document === "undefined" || isStaticRenderer) return
        const handler = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setFocusedIndexT(null)
            }
        }
        document.addEventListener("click", handler, { passive: true })
        return () => document.removeEventListener("click", handler)
    }, [setFocusedIndexT, isStaticRenderer])

    const offsetX = 0
    const offsetY = 0
    const dragStepPx = React.useMemo(() => Math.max(1, spacing), [spacing])

    const handleWheel = React.useCallback(
        (e: WheelEvent) => {
            if (isStaticRenderer) return
            if (focusedIndex === null || cardCount <= 1) return
            e.preventDefault()

            const now = Date.now()
            const dt = Math.min(
                48,
                Math.max(1, now - (lastScrollTime.current || now - 16))
            )
            lastScrollTime.current = now

            const wheelPx = e.deltaY * (dt / 16)
            const wheelToCards = 0.85

            React.startTransition(() => {
                setBasePosition(
                    (p) => p + (wheelPx / dragStepPx) * wheelToCards
                )
            })
        },
        [focusedIndex, cardCount, dragStepPx, isStaticRenderer]
    )

    React.useEffect(() => {
        if (typeof window === "undefined" || isStaticRenderer) return
        const el = containerRef.current
        if (!el) return
        el.addEventListener("wheel", handleWheel, { passive: false })
        return () => el.removeEventListener("wheel", handleWheel)
    }, [handleWheel, isStaticRenderer])

    const openLightbox = React.useCallback(
        (src: string, alt: string) => {
            if (isStaticRenderer) return
            React.startTransition(() => {
                setLightbox({ src, alt })
                setFocusedIndex(null)
            })
        },
        [isStaticRenderer]
    )

    const closeLightbox = React.useCallback(() => {
        React.startTransition(() => setLightbox(null))
    }, [])

    const baseFloat = React.useMemo(() => {
        if (cardCount <= 0) return 0
        return basePosition + -dragOffset / dragStepPx
    }, [basePosition, dragOffset, dragStepPx, cardCount])

    const baseInt = React.useMemo(() => Math.floor(baseFloat), [baseFloat])
    const baseFrac = React.useMemo(
        () => baseFloat - baseInt,
        [baseFloat, baseInt]
    )

    const windowed = React.useMemo(() => {
        if (cardCount <= 0) {
            return [] as Array<{
                slot: number
                virtualIndex: number
                cellIndex: number
                dataIndex: number
            }>
        }

        const overscan = 14
        const renderCount = safeVisibleCount + overscan * 2

        return Array.from({ length: renderCount }, (_, slot) => {
            const virtualIndex = slot - overscan
            const cellIndex = baseInt + virtualIndex
            return {
                slot,
                virtualIndex,
                cellIndex,
                dataIndex: mod(cellIndex, cardCount),
            }
        })
    }, [baseInt, cardCount, mod, safeVisibleCount])

    const reversed = React.useMemo(
        () => windowed.map((_, i) => windowed.length - 1 - i),
        [windowed]
    )

    const focusSpring = React.useMemo(
        () => ({
            type: "spring" as const,
            stiffness: 250,
            damping: 35,
            mass: 0.8,
        }),
        []
    )

    const hoverSpring = React.useMemo(
        () => ({
            type: "spring" as const,
            stiffness: 140,
            damping: 40,
            mass: 1.1,
        }),
        []
    )

    const endDrag = React.useCallback(() => {
        if (!dragRef.current.active) return

        dragRef.current.active = false
        dragRef.current.moved = false

        React.startTransition(() => setIsDragging(false))

        if (cardCount > 0) {
            const committedBase =
                basePosition + -dragOffsetTarget.current / dragStepPx
            dragOffsetTarget.current = 0
            React.startTransition(() => {
                setBasePosition(committedBase)
                setDragOffset(0)
            })
        } else {
            dragOffsetTarget.current = 0
            React.startTransition(() => setDragOffset(0))
        }
    }, [cardCount, basePosition, dragStepPx])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStaticRenderer || !isInView) {
            if (dragRAF.current != null) {
                window.cancelAnimationFrame(dragRAF.current)
                dragRAF.current = null
            }
            return
        }

        const tick = (t: number) => {
            const dt = Math.min(
                32,
                Math.max(1, t - (lastDragFrame.current || t))
            )
            lastDragFrame.current = t

            const target = dragOffsetTarget.current
            const k = isDragging ? 0.24 : 0.16
            const minStep = (Math.abs(target) > 0.001 ? 0.05 : 0.02) * (dt / 16)

            React.startTransition(() => {
                setDragOffset((v) => {
                    const diff = target - v
                    if (Math.abs(diff) < minStep) return target
                    return v + diff * k
                })
            })

            const shouldKeepRunning =
                isDragging ||
                Math.abs(dragOffsetTarget.current - target) > 0.01 ||
                Math.abs(target - dragOffset) > 0.01

            if (shouldKeepRunning && isInView) {
                dragRAF.current = window.requestAnimationFrame(tick)
                return
            }

            dragRAF.current = null
        }

        if (dragRAF.current == null) {
            dragRAF.current = window.requestAnimationFrame(tick)
        }

        return () => {
            if (dragRAF.current != null) {
                window.cancelAnimationFrame(dragRAF.current)
            }
            dragRAF.current = null
        }
    }, [isDragging, isStaticRenderer, isInView, dragOffset])

    const handlePointerDown = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStaticRenderer) return
            if (cardCount <= 1) return
            if (typeof e.button === "number" && e.button !== 0) return

            dragRef.current.active = true
            dragRef.current.pointerId = e.pointerId
            dragOffsetTarget.current = dragOffset
            dragRef.current.startX =
                e.clientX - dragOffsetTarget.current / DRAG_SENSITIVITY
            dragRef.current.startBasePosition = basePosition
            dragRef.current.moved = false
            dragRef.current.lastX = e.clientX
            dragRef.current.lastT =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
            dragRef.current.velocity = 0

            React.startTransition(() => setIsDragging(false))
        },
        [cardCount, basePosition, dragOffset, isStaticRenderer]
    )

    const handlePointerMove = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStaticRenderer) return
            if (!dragRef.current.active) return
            if (cardCount <= 1) return

            e.preventDefault()

            const now =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
            const dx = (e.clientX - dragRef.current.startX) * DRAG_SENSITIVITY

            if (Math.abs(dx) > 3 && !dragRef.current.moved) {
                dragRef.current.moved = true
                React.startTransition(() => setIsDragging(true))
                try {
                    e.currentTarget.setPointerCapture(dragRef.current.pointerId)
                } catch {}
            }

            const dt = Math.max(1, now - dragRef.current.lastT)
            const vx = (e.clientX - dragRef.current.lastX) / dt
            dragRef.current.velocity = vx * 1000
            dragRef.current.lastX = e.clientX
            dragRef.current.lastT = now

            dragOffsetTarget.current = dx

            if (dragRAF.current == null && isInView) {
                dragRAF.current = window.requestAnimationFrame(() => {})
            }
        },
        [cardCount, isStaticRenderer, isInView]
    )

    const handlePointerUp = React.useCallback(
        (e?: React.PointerEvent<HTMLDivElement>) => {
            if (isStaticRenderer) return
            if (e?.currentTarget && dragRef.current.pointerId >= 0) {
                try {
                    e.currentTarget.releasePointerCapture(
                        dragRef.current.pointerId
                    )
                } catch {}
            }
            dragRef.current.pointerId = -1
            endDrag()
        },
        [endDrag, isStaticRenderer]
    )

    React.useEffect(() => {
        if (typeof window === "undefined") return
        return () => {
            dragRef.current.active = false
            if (dragRAF.current != null) {
                window.cancelAnimationFrame(dragRAF.current)
                dragRAF.current = null
            }
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 1200,
                minHeight: 810,
                position: "relative",
                overflow: "hidden",
                perspective: `${perspective}px`,
                perspectiveOrigin: "50% 50%",
                filter: "none",
                boxShadow: "none",
                backdropFilter: "none",
                cursor:
                    isStaticRenderer || cardCount <= 1
                        ? "default"
                        : isDragging
                          ? "grabbing"
                          : "grab",
                touchAction:
                    isStaticRenderer || cardCount <= 1 ? "auto" : "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                background: "transparent",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {!isStaticRenderer && lightbox && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "tween", duration: 0.18 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 3000,
                        background: lightboxBackdrop,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                        cursor: "zoom-out",
                        pointerEvents: "auto",
                    }}
                    onClick={(e) => {
                        e.stopPropagation()
                        closeLightbox()
                    }}
                >
                    <motion.div
                        initial={{
                            scale: 0.98,
                            opacity: 0,
                            rotateY: -45,
                            transformPerspective: 3000,
                        }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            rotateY: 0,
                            transformPerspective: 3000,
                        }}
                        transition={{
                            type: "tween",
                            duration: 0.5,
                            ease: "easeInOut",
                        }}
                        style={{
                            width: (() => {
                                const maxW = Math.max(1, container.w - 48)
                                const maxH = Math.max(1, container.h - 48)
                                const desiredW = cardW
                                const desiredH = cardH
                                const scale = Math.min(
                                    maxW / desiredW,
                                    maxH / desiredH,
                                    1
                                )
                                return Math.max(1, Math.floor(desiredW * scale))
                            })(),
                            height: (() => {
                                const maxW = Math.max(1, container.w - 48)
                                const maxH = Math.max(1, container.h - 48)
                                const desiredW = cardW
                                const desiredH = cardH
                                const scale = Math.min(
                                    maxW / desiredW,
                                    maxH / desiredH,
                                    1
                                )
                                return Math.max(1, Math.floor(desiredH * scale))
                            })(),
                            borderRadius: Math.max(0, borderRadius),
                            overflow: "hidden",
                            background: "#000",
                            cursor: "auto",
                            position: "relative",
                            transformStyle: "preserve-3d",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={lightbox.alt}
                    >
                        <img
                            src={lightbox.src}
                            alt={lightbox.alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                            }}
                            draggable={false}
                            decoding="async"
                        />
                    </motion.div>
                </motion.div>
            )}

            {!isStaticRenderer && lightbox && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2500,
                        pointerEvents: "none",
                        backdropFilter: `blur(${Math.max(
                            0,
                            Math.min(30, lightboxBlur)
                        )}px)`,
                        WebkitBackdropFilter: `blur(${Math.max(
                            0,
                            Math.min(30, lightboxBlur)
                        )}px)`,
                    }}
                />
            )}

            {!isStaticRenderer && focusedIndex !== null && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1500,
                        cursor: "pointer",
                    }}
                    onClick={(e) => {
                        e.stopPropagation()
                        setFocusedIndex(null)
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) translate3d(${offsetX}px, ${offsetY}px, 0) rotateX(-30deg)`,
                    transformStyle: "preserve-3d",
                    pointerEvents: lightbox ? "none" : "auto",
                    filter: "none",
                    boxShadow: "none",
                    backdropFilter: "none",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        transformStyle: "preserve-3d",
                        pointerEvents: "auto",
                    }}
                >
                    {reversed.map((i) => {
                        const { slot, virtualIndex, cellIndex, dataIndex } =
                            windowed[i]

                        const focusAnchorSlot = focusAnchor + 2
                        const isFocused = focusedIndex === slot
                        const isBehindFocused =
                            focusedIndex !== null && slot < focusedIndex

                        const springConfig =
                            isFocused || focusedIndex !== null
                                ? focusSpring
                                : hoverSpring

                        return (
                            <MemoizedCard
                                key={`cell-${cellIndex}`}
                                card={cards[dataIndex]}
                                virtualIndex={slot}
                                virtualPos={
                                    virtualIndex - baseFrac - focusAnchor
                                }
                                dataIndex={dataIndex}
                                isFocused={isFocused}
                                isBehindFocused={isBehindFocused}
                                isDragging={isDragging || dragRef.current.moved}
                                isStaticRenderer={isStaticRenderer}
                                borderRadius={borderRadius}
                                cardWidth={cardW}
                                cardHeight={cardH}
                                layoutValues={layoutValues}
                                smartFocusScale={smartFocusScale}
                                springConfig={springConfig}
                                focusedIndex={focusedIndex}
                                enableLightbox={enableLightbox}
                                onOpenLightbox={openLightbox}
                                setFocusedIndex={(v) => {
                                    if (isStaticRenderer) return
                                    if (cardCount <= 0) return

                                    if (v === null) {
                                        setFocusedIndexT(null)
                                        return
                                    }

                                    const clickedSlot = v
                                    const clickedVirtual = clickedSlot - 2
                                    const clickedData = mod(
                                        baseInt + clickedVirtual,
                                        cardCount
                                    )

                                    React.startTransition(() => {
                                        setBasePosition(
                                            clickedData - focusAnchor
                                        )
                                        setDragOffset(0)
                                        setFocusedIndex(focusAnchorSlot)
                                    })
                                }}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

Infinite3DCardDragSlider.defaultProps = {
    width: 1200,
    height: 810,
    visibleCount: 30,
    cardWidth: 400,
    cardHeight: 400,
    stackSpacing: 200,
    perspective: 3000,
    borderRadius: 12,
    cardAngle: -45,
    enableLightbox: true,
    lightboxBackdrop: "rgba(255, 255, 255, 0.7)",
    lightboxBlur: 5,
    cards: DEFAULT_CARDS,
}

addPropertyControls(Infinite3DCardDragSlider, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        description: "Add images for your card stack",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: DEFAULT_CARDS,
    },

    visibleCount: {
        type: ControlType.Number,
        title: "Visible Cards",
        description: "Total number of cards rendered on screen",
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 30,
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        description: "Base width in pixels (panel-locked)",
        min: 200,
        max: 500,
        defaultValue: 400,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        description: "Base height in pixels (panel-locked)",
        min: 150,
        max: 500,
        defaultValue: 400,
    },
    stackSpacing: {
        type: ControlType.Number,
        title: "Stack Spacing",
        description: "Distance between stacked cards",
        min: 80,
        max: 300,
        defaultValue: 200,
    },

    perspective: {
        type: ControlType.Number,
        title: "3D Perspective",
        description: "3D depth intensity",
        min: 800,
        max: 3000,
        defaultValue: 3000,
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        description: "Card corner roundness",
        min: 0,
        max: 30,
        defaultValue: 12,
    },

    cardAngle: {
        type: ControlType.Number,
        title: "Card Angle",
        description: "The tilt angle of the cards in the stack",
        min: -180,
        max: 180,
        step: 1,
        defaultValue: -45,
    },

    enableLightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        description: "Click a card to open its image in a centered lightbox",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lightboxBackdrop: {
        type: ControlType.Color,
        title: "Lightbox Colour",
        defaultValue: "rgba(255, 255, 255, 0.7)",
        hidden: ({ enableLightbox }) => !enableLightbox,
    },
    lightboxBlur: {
        type: ControlType.Number,
        title: "Lightbox Blur",
        description: "Blur applied to the cards behind the lightbox",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 5,
        hidden: ({ enableLightbox }) => !enableLightbox,
    },
})
