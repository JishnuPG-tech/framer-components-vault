// Framer Carousel — transform-based animation (same as HTML carousel)
// Uses CSS transform: translateX() with cubic-bezier easing instead of scrollLeft
// This runs on the GPU compositor thread = butter-smooth, zero jank

import * as React from "react"
import { type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

type CarouselSizing = {
    width: "auto" | "stretch"
    height: "auto" | "stretch"
    itemHeight: number
}

type CarouselFading = {
    enabled: boolean
    color: string
}

type CarouselProgress = {
    showBar: boolean
    showDots: boolean
    barWidth: number
    barHeight: number
    dotWidth: number
    dotHeight: number
}

type CarouselArrows = {
    show: boolean
    position: "center" | "top" | "bottom"
    alignH: "apart" | "left" | "center" | "right"
    gap: number
    fill: string
    prevIconFile: string
    nextIconFile: string
    size: number
    radius: number
    inset: number
}

type CarouselProps = {
    items?: React.ReactNode[]
    prevArrow?: React.ReactNode
    nextArrow?: React.ReactNode
    align?: "left" | "center" | "right"
    layout?: "single" | "multi"
    visibleCount?: number
    autoPlay?: boolean
    autoPlaySeconds?: number
    gap?: number
    itemGap?: number
    padding?: number
    borderRadius?: number
    textColor?: string
    progressTrackColor?: string
    progressActiveDotColor?: string
    progressInactiveDotColor?: string
    ariaLabel?: string
    sizing?: CarouselSizing
    fading?: CarouselFading
    progress?: CarouselProgress
    arrows?: CarouselArrows
    style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

// ─── Easing identical to the HTML carousel ───────────────────────────────────
// cubic-bezier(0.25, 0.46, 0.45, 0.94)  duration 420ms
const DURATION = 420

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

/**
 * Carousel
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 240
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SmoothCarousel(props: CarouselProps) {
    const {
        items = [],
        prevArrow,
        nextArrow,
        align = "left",
        layout = "single",
        visibleCount = 2,
        autoPlay = false,
        autoPlaySeconds = 4,
        gap = 10,
        itemGap = 10,
        padding = 10,
        borderRadius = 0,
        textColor = "#000000",
        progressTrackColor = "hsla(0,0%,0%,0.12)",
        progressActiveDotColor = "#000000",
        progressInactiveDotColor = "hsla(0,0%,0%,0.18)",
        ariaLabel = "Carousel",
        sizing = {
            width: "auto",
            height: "stretch",
            itemHeight: 240,
        },
        fading = { enabled: false, color: "#000000" },
        progress = {
            showBar: false,
            showDots: true,
            barWidth: 100,
            barHeight: 3,
            dotWidth: 8,
            dotHeight: 8,
        },
        arrows = {
            show: true,
            position: "center",
            alignH: "apart",
            gap: 8,
            fill: "#000000",
            prevIconFile: "",
            nextIconFile: "",
            size: 42,
            radius: 40,
            inset: 32,
        },
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const safeItems = React.useMemo(
        () => (Array.isArray(items) ? items.filter((n) => n != null) : []),
        [items]
    )
    const count = safeItems.length

    const rootRef = React.useRef<HTMLElement | null>(null)
    const isInView = useInView(rootRef as React.RefObject<Element>, {
        amount: 0.2,
    })
    const [rootWidth, setRootWidth] = React.useState(0)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const el = rootRef.current
        if (!el) return

        const update = () => {
            React.startTransition(() => setRootWidth(el.clientWidth || 0))
        }

        update()

        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(() => update())
            ro.observe(el)
            return () => ro.disconnect()
        }

        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [])

    // ── Index state ────────────────────────────────────────────────────────────
    const [index, setIndex] = React.useState(0)

    // ── Drag state (declared early because effects depend on it) ───────────────
    const [isDragging, setIsDragging] = React.useState(false)

    const resolvedVisibleCount = React.useMemo(() => {
        if (layout !== "multi") return 1
        return clamp(
            Math.round(Number.isFinite(visibleCount) ? visibleCount : 1),
            1,
            12
        )
    }, [layout, visibleCount])

    const maxIndex = React.useMemo(() => {
        if (count <= 0) return 0
        if (layout === "multi") return Math.max(0, count - resolvedVisibleCount)
        return count - 1
    }, [count, layout, resolvedVisibleCount])

    const clampIndex = React.useCallback(
        (i: number) => clamp(i, 0, maxIndex),
        [maxIndex]
    )

    // Keep index in bounds when items change
    React.useEffect(() => {
        if (index > maxIndex) {
            React.startTransition(() => setIndex(clampIndex(index)))
        }
    }, [clampIndex, index, maxIndex])

    // ── Transform-based translation ────────────────────────────────────────────
    // trackRef holds the flex track; we animate its translateX
    const trackRef = React.useRef<HTMLDivElement | null>(null)
    const itemRefs = React.useRef<Array<HTMLDivElement | null>>([])

    // current live translateX during drag (bypasses animation)
    const liveTranslateRef = React.useRef(0)

    // Imperative transform animation (avoids per-frame React state updates)
    const animRafRef = React.useRef<number | null>(null)
    const animRef = React.useRef({
        from: 0,
        to: 0,
        startTime: 0,
        running: false,
    })

    const getTargetX = React.useCallback(
        (i: number): number => {
            const el = itemRefs.current[clamp(i, 0, maxIndex)]
            if (el) return el.offsetLeft
            // fallback: estimate from index (used before first render)
            const track = trackRef.current
            if (!track || !track.parentElement) return 0
            const parentW = track.parentElement.clientWidth
            const itemW =
                layout === "multi"
                    ? (parentW - itemGap * (resolvedVisibleCount - 1)) /
                      resolvedVisibleCount
                    : parentW // single: each item is full viewport width
            return i * (itemW + itemGap)
        },
        [itemGap, layout, maxIndex, resolvedVisibleCount]
    )

    const animateToX = React.useCallback(
        (target: number, instant = false) => {
            if (isStatic) {
                const track = trackRef.current
                if (track) {
                    liveTranslateRef.current = target
                    track.style.transform = `translateX(${-target}px)`
                }
                animRef.current = {
                    from: target,
                    to: target,
                    startTime: 0,
                    running: false,
                }
                return
            }

            if (animRafRef.current !== null) {
                cancelAnimationFrame(animRafRef.current)
                animRafRef.current = null
            }

            if (instant) {
                animRef.current = {
                    from: target,
                    to: target,
                    startTime: 0,
                    running: false,
                }
                const track = trackRef.current
                if (track) {
                    liveTranslateRef.current = target
                    track.style.transform = `translateX(${-target}px)`
                }
                return
            }

            const from = animRef.current.to
            animRef.current = {
                from,
                to: target,
                startTime:
                    typeof performance !== "undefined"
                        ? performance.now()
                        : Date.now(),
                running: true,
            }

            const tick = (now: number) => {
                const track = trackRef.current
                if (!track) {
                    animRafRef.current = null
                    animRef.current.running = false
                    return
                }
                const elapsed = now - animRef.current.startTime
                const t = clamp(elapsed / DURATION, 0, 1)
                const eased = easeOutCubic(t)
                const current =
                    animRef.current.from +
                    (animRef.current.to - animRef.current.from) * eased
                liveTranslateRef.current = current
                track.style.transform = `translateX(${-current}px)`

                if (t < 1) {
                    animRafRef.current = requestAnimationFrame(tick)
                } else {
                    animRafRef.current = null
                    animRef.current.running = false
                    liveTranslateRef.current = animRef.current.to
                    track.style.transform = `translateX(${-animRef.current.to}px)`
                }
            }

            animRafRef.current = requestAnimationFrame(tick)
        },
        [isStatic]
    )

    React.useEffect(() => {
        return () => {
            if (animRafRef.current !== null)
                cancelAnimationFrame(animRafRef.current)
            if (dragRafRef.current !== null)
                cancelAnimationFrame(dragRafRef.current)
        }
    }, [])

    const pendingInstantRef = React.useRef<boolean>(true)

    const goTo = React.useCallback(
        (i: number, instant = false) => {
            const clamped = clampIndex(i)
            pendingInstantRef.current = instant
            React.startTransition(() => setIndex(clamped))
        },
        [clampIndex]
    )

    // Sync translateX whenever index changes (autoplay, keyboard, dots — both layouts)
    React.useEffect(() => {
        if (isDragging) return
        if (count <= 0) return

        const instant = pendingInstantRef.current
        pendingInstantRef.current = false
        animateToX(getTargetX(index), instant)
    }, [animateToX, count, getTargetX, index, isDragging])

    // ── Dots ───────────────────────────────────────────────────────────────────
    const dotsCount = React.useMemo(() => {
        if (count <= 0) return 0
        if (layout !== "multi") return count
        return Math.max(1, count - resolvedVisibleCount + 1)
    }, [count, layout, resolvedVisibleCount])

    const activeDotIndex = React.useMemo(() => {
        return clamp(index, 0, Math.max(0, dotsCount - 1))
    }, [dotsCount, index])

    // ── Progress bar ───────────────────────────────────────────────────────────
    const progressBarPercent = React.useMemo(() => {
        if (count <= 1) return 0
        return (clampIndex(index) / Math.max(1, maxIndex)) * 100
    }, [clampIndex, count, index, maxIndex])

    // ── Arrow enable/disable ───────────────────────────────────────────────────
    const canGoPrev = count > 1 && index > 0
    const canGoNext = count > 1 && index < maxIndex

    const handlePrev = React.useCallback(() => {
        if (canGoPrev) goTo(index - 1)
    }, [canGoPrev, goTo, index])
    const handleNext = React.useCallback(() => {
        if (canGoNext) goTo(index + 1)
    }, [canGoNext, goTo, index])

    // ── AutoPlay (single + multi) ──────────────────────────────────────────────
    React.useEffect(() => {
        if (isStatic) return
        if (!isInView) return
        if (!autoPlay || count <= 1) return
        const ms = Math.max(500, autoPlaySeconds * 1000)
        const id = setInterval(() => {
            const next = index >= maxIndex ? 0 : index + 1
            goTo(next)
        }, ms)
        return () => clearInterval(id)
    }, [
        autoPlay,
        autoPlaySeconds,
        count,
        goTo,
        index,
        isInView,
        isStatic,
        maxIndex,
    ])

    // ── Drag (multi) ───────────────────────────────────────────────────────────
    const dragRef = React.useRef({
        active: false,
        startX: 0,
        startTranslate: 0,
    })
    const dragRafRef = React.useRef<number | null>(null)

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (layout !== "multi") return
            e.preventDefault()
            ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
            dragRef.current = {
                active: true,
                startX: e.clientX,
                startTranslate: liveTranslateRef.current,
            }
            React.startTransition(() => setIsDragging(true))
        },
        [isStatic, layout]
    )

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (layout !== "multi" || !dragRef.current.active) return
            const dx = e.clientX - dragRef.current.startX
            const next = dragRef.current.startTranslate - dx

            if (dragRafRef.current) return
            dragRafRef.current = requestAnimationFrame(() => {
                dragRafRef.current = null
                const track = trackRef.current
                if (track) {
                    liveTranslateRef.current = next
                    track.style.transform = `translateX(${-next}px)`
                }
            })
        },
        [layout]
    )

    // Needs goTo/getNearestIndex — define getNearestIndex first
    const getNearestIndex = React.useCallback((): number => {
        const track = trackRef.current
        if (!track) return index
        // liveTranslateRef holds the signed translate position (incl. over-scroll)
        const currentX = liveTranslateRef.current

        let best = 0
        let bestDist = Infinity
        itemRefs.current.forEach((el, i) => {
            if (!el || i > maxIndex) return
            const d = Math.abs(el.offsetLeft - currentX)
            if (d < bestDist) {
                bestDist = d
                best = i
            }
        })
        return best
    }, [index, maxIndex])

    const onPointerUp = React.useCallback(() => {
        if (isStatic) return
        if (!dragRef.current.active) return
        dragRef.current.active = false
        React.startTransition(() => setIsDragging(false))
        if (dragRafRef.current) {
            cancelAnimationFrame(dragRafRef.current)
            dragRafRef.current = null
        }
        // Snap to nearest
        const nearest = getNearestIndex()
        goTo(nearest)
    }, [getNearestIndex, goTo, isStatic])

    // Sync animated translateX → liveTranslateRef and track style
    // (only when NOT dragging, so drag's rAF stays in control)
    // NOTE: This component uses imperative transform updates (animateToX / drag rAF).
    // If you re-introduce a React state value like `translateX`, wire it here.

    // ── Filled items (stretch to fill slot) ───────────────────────────────────
    const filledItems = React.useMemo(() => {
        return safeItems.map((item) => {
            if (!item || !React.isValidElement(item)) return item
            const existingStyle =
                (item.props as { style?: CSSProperties })?.style || {}
            return React.cloneElement(item as React.ReactElement, {
                style: {
                    ...existingStyle,
                    width: "100%",
                    height: "100%",
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                },
            })
        })
    }, [safeItems])

    // ── Arrow styles ───────────────────────────────────────────────────────────
    const arrowBase: CSSProperties = {
        pointerEvents: "auto",
        width: `${arrows.size}px`,
        height: `${arrows.size}px`,
        minWidth: `${arrows.size}px`,
        minHeight: `${arrows.size}px`,
        borderRadius: `${arrows.radius}px`,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        color: arrows.fill || "#000000",
        border: "none",
        padding: 0,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
    }

    const arrowsJustify: CSSProperties["justifyContent"] =
        arrows.alignH === "left"
            ? "flex-start"
            : arrows.alignH === "center"
              ? "center"
              : arrows.alignH === "right"
                ? "flex-end"
                : "space-between"

    const hasRenderableNode = (node: any): boolean => {
        if (node == null || node === false) return false
        if (Array.isArray(node))
            return node.some((n) => n != null && n !== false)
        return true
    }

    const renderPrevIcon = () => {
        if (hasRenderableNode(prevArrow))
            return (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    {prevArrow}
                </div>
            )
        if (arrows.prevIconFile)
            return (
                <img
                    src={arrows.prevIconFile}
                    alt=""
                    style={{
                        width: "70%",
                        height: "70%",
                        objectFit: "contain",
                    }}
                    draggable={false}
                />
            )
        return <Arrow direction="left" />
    }

    const renderNextIcon = () => {
        if (hasRenderableNode(nextArrow))
            return (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    {nextArrow}
                </div>
            )
        if (arrows.nextIconFile)
            return (
                <img
                    src={arrows.nextIconFile}
                    alt=""
                    style={{
                        width: "70%",
                        height: "70%",
                        objectFit: "contain",
                    }}
                    draggable={false}
                />
            )
        return <Arrow direction="right" />
    }

    const ArrowBtn = ({
        onClick,
        disabled,
        label,
        children,
    }: {
        onClick: () => void
        disabled: boolean
        label: string
        children: React.ReactNode
    }) => (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            aria-disabled={disabled}
            style={{
                ...arrowBase,
                ...(disabled ? { opacity: 0.35, cursor: "not-allowed" } : {}),
            }}
        >
            {children}
        </button>
    )

    const ArrowRow = () => (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: arrowsJustify,
                alignItems: "center",
                width: "100%",
                minHeight: `${arrows.size}px`,
                paddingLeft: `${arrows.inset}px`,
                paddingRight: `${arrows.inset}px`,
                boxSizing: "border-box",
                gap: `${Math.max(arrows.gap ?? 8, 0)}px`,
                flexShrink: 0,
            }}
        >
            <ArrowBtn
                onClick={handlePrev}
                disabled={!canGoPrev}
                label="Previous slide"
            >
                {renderPrevIcon()}
            </ArrowBtn>
            <ArrowBtn
                onClick={handleNext}
                disabled={!canGoNext}
                label="Next slide"
            >
                {renderNextIcon()}
            </ArrowBtn>
        </div>
    )

    const hasProgress = count > 1 && (progress.showBar || progress.showDots)
    const progressWithArrows =
        hasProgress &&
        arrows.show &&
        count > 1 &&
        (arrows.position === "top" || arrows.position === "bottom")

    const inlineBarWidthPx = React.useMemo(() => {
        if (!progressWithArrows || !progress.showBar) return 0
        const usable = Math.max(
            0,
            rootWidth - arrows.inset * 2 - arrows.size * 2 - 24
        )
        return Math.max(
            0,
            (clamp(progress.barWidth ?? 100, 0, 100) / 100) * usable
        )
    }, [
        arrows.inset,
        arrows.size,
        progress.barWidth,
        progress.showBar,
        progressWithArrows,
        rootWidth,
    ])

    const ProgressBar = ({
        textColor,
        widthPx,
    }: {
        textColor?: string
        widthPx?: number
    }) => {
        const resolvedWidth =
            typeof widthPx === "number" && widthPx > 0
                ? `${widthPx}px`
                : `${clamp(progress.barWidth ?? 100, 0, 100)}%`

        return (
            <div
                aria-hidden="true"
                style={{
                    width: resolvedWidth,
                    minWidth: 40,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: clamp(progress.barHeight ?? 3, 1, 32),
                        borderRadius: 99,
                        background: progressTrackColor,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${progressBarPercent}%`,
                            background: textColor || "currentColor",
                            opacity: 0.6,
                            transition:
                                "width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        }}
                    />
                </div>
            </div>
        )
    }

    const Dots = () => (
        <div
            style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
            }}
            aria-label="Carousel pagination"
            role="tablist"
        >
            {Array.from({ length: dotsCount }).map((_, i) => {
                const active = i === activeDotIndex
                return (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Go to slide ${i + 1}`}
                        aria-selected={active}
                        role="tab"
                        onClick={() => goTo(i)}
                        style={{
                            width: clamp(progress.dotWidth ?? 8, 2, 64),
                            height: clamp(progress.dotHeight ?? 8, 2, 64),
                            borderRadius: 99,
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            background: active
                                ? progressActiveDotColor
                                : progressInactiveDotColor,
                            opacity: active ? 1 : 0.6,
                            transition:
                                "background 0.2s, transform 0.2s, opacity 0.2s",
                            transform: active ? "scale(1.25)" : "scale(1)",
                        }}
                    />
                )
            })}
        </div>
    )

    const ProgressElements = ({ inline }: { inline: boolean }) => {
        if (!hasProgress) return null

        const contents = (
            <>
                {progress.showDots && <Dots />}
                {progress.showBar && (
                    <ProgressBar
                        textColor={textColor}
                        widthPx={inline ? inlineBarWidthPx : undefined}
                    />
                )}
            </>
        )

        if (inline) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        minWidth: 0,
                        flex: 1,
                    }}
                >
                    {contents}
                </div>
            )
        }

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    width: "100%",
                }}
            >
                {contents}
            </div>
        )
    }

    const ArrowRowWithProgress = () => {
        if (!progressWithArrows) return <ArrowRow />

        if (arrows.alignH === "center") {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    <ArrowRow />
                    <ProgressElements inline={false} />
                </div>
            )
        }

        if (arrows.alignH === "apart") {
            return (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        minHeight: `${arrows.size}px`,
                        paddingLeft: `${arrows.inset}px`,
                        paddingRight: `${arrows.inset}px`,
                        boxSizing: "border-box",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <ArrowBtn
                            onClick={handlePrev}
                            disabled={!canGoPrev}
                            label="Previous slide"
                        >
                            {renderPrevIcon()}
                        </ArrowBtn>
                        <ArrowBtn
                            onClick={handleNext}
                            disabled={!canGoNext}
                            label="Next slide"
                        >
                            {renderNextIcon()}
                        </ArrowBtn>
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <ProgressElements inline={true} />
                    </div>
                </div>
            )
        }

        const progressNode = <ProgressElements inline={true} />
        const arrowsNode = <ArrowRow />

        return (
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                }}
            >
                {arrows.alignH === "right" ? (
                    <>
                        {progressNode}
                        <div style={{ marginLeft: "auto", width: "100%" }}>
                            {arrowsNode}
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ width: "100%" }}>{arrowsNode}</div>
                        {progressNode}
                    </>
                )}
            </div>
        )
    }

    // ── Multi item flex ────────────────────────────────────────────────────────
    const multiItemFlex =
        layout === "multi"
            ? `0 0 calc((100% - ${(resolvedVisibleCount - 1) * itemGap}px) / ${resolvedVisibleCount})`
            : undefined

    // ── Resolved dimensions ────────────────────────────────────────────────────
    const resolvedWidth =
        !count || style?.width === "100%"
            ? "100%"
            : sizing.width === "auto"
              ? "fit-content"
              : "100%"
    const resolvedHeight =
        !count || style?.height === "100%"
            ? "100%"
            : sizing.height === "auto"
              ? "fit-content"
              : "100%"

    return (
        <section
            ref={(el) => {
                rootRef.current = el
            }}
            style={{
                ...style,
                position: "relative",
                width: resolvedWidth,
                height: resolvedHeight,
                overflow: "hidden",
                background: "transparent",
                color: textColor,
                borderRadius: `${borderRadius}px`,
                padding: `${padding}px`,
                display: "flex",
                flexDirection: "column",
                gap: `${gap}px`,
                outline: "none",
                cursor: isDragging ? "grabbing" : "default",
            }}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel || "Carousel"}
            onKeyDown={(e) => {
                if (count <= 1) return
                if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    handlePrev()
                } else if (e.key === "ArrowRight") {
                    e.preventDefault()
                    handleNext()
                } else if (e.key === "Home") {
                    e.preventDefault()
                    goTo(0)
                } else if (e.key === "End") {
                    e.preventDefault()
                    goTo(maxIndex)
                }
            }}
        >
            {arrows.show && count > 1 && arrows.position === "top" && (
                <ArrowRowWithProgress />
            )}

            {/* ── Main slide area ── */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    flex: 1,
                    overflow: "hidden",
                    borderRadius: `${Math.max(borderRadius - 2, 0)}px`,
                }}
            >
                {count > 0 ? (
                    // ── SINGLE + MULTI: same transform-translated flex track ────
                    // Single: each item is flex "0 0 100%", track slides one full width per step
                    // Multi:  each item is (viewport - gaps) / visibleCount wide
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            cursor:
                                layout === "multi"
                                    ? isDragging
                                        ? "grabbing"
                                        : "grab"
                                    : "default",
                        }}
                        onPointerDown={
                            !isStatic && layout === "multi"
                                ? onPointerDown
                                : undefined
                        }
                        onPointerMove={
                            !isStatic && layout === "multi"
                                ? onPointerMove
                                : undefined
                        }
                        onPointerUp={
                            !isStatic && layout === "multi"
                                ? onPointerUp
                                : undefined
                        }
                        onPointerCancel={
                            !isStatic && layout === "multi"
                                ? onPointerUp
                                : undefined
                        }
                        onPointerLeave={
                            !isStatic && layout === "multi"
                                ? onPointerUp
                                : undefined
                        }
                    >
                        <div
                            ref={trackRef}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                gap: `${itemGap}px`,
                                transition: isDragging
                                    ? "none"
                                    : `transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                                willChange: "transform",
                                transform: "translateX(0px)", // overwritten by effect/rAF
                            }}
                        >
                            {filledItems.map((item, i) => (
                                <div
                                    key={i}
                                    ref={(el) => {
                                        itemRefs.current[i] = el
                                    }}
                                    style={{
                                        flex:
                                            layout === "multi"
                                                ? multiItemFlex
                                                : "0 0 100%",
                                        height:
                                            sizing.height === "auto"
                                                ? `${sizing.itemHeight}px`
                                                : "100%",
                                        minWidth: 0,
                                        minHeight: 0,
                                        display: "flex",
                                        alignItems: "stretch",
                                        justifyContent:
                                            layout === "single"
                                                ? align === "center"
                                                    ? "center"
                                                    : align === "right"
                                                      ? "flex-end"
                                                      : "flex-start"
                                                : "flex-start",
                                    }}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div
                        aria-label="Connect items to carousel"
                        role="note"
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "hsla(250, 85%, 97%, 1)",
                            borderRadius: `${Math.max(borderRadius - 2, 0)}px`,
                            padding: 16,
                            boxSizing: "border-box",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <SparklesIcon color={"hsla(270, 75%, 60%, 1)"} />
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    letterSpacing: "-0.01em",
                                    lineHeight: "1.2em",
                                    color: "hsla(270, 75%, 35%, 1)",
                                    marginTop: 2,
                                }}
                            >
                                {"Connect to Content"}
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 400,
                                    letterSpacing: "-0.01em",
                                    lineHeight: "1.3em",
                                    color: "hsla(270, 25%, 55%, 1)",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {"Add layers or components\n to swipe between"}
                            </div>
                        </div>
                    </div>
                )}

                {/* Fading edges */}
                {fading.enabled && (
                    <>
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: 80,
                                height: "100%",
                                pointerEvents: "none",
                                background: `linear-gradient(90deg,${fading.color} 0%,rgba(0,0,0,0) 100%)`,
                                opacity: 0.35,
                                zIndex: 1,
                            }}
                        />
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: 80,
                                height: "100%",
                                pointerEvents: "none",
                                background: `linear-gradient(270deg,${fading.color} 0%,rgba(0,0,0,0) 100%)`,
                                opacity: 0.35,
                                zIndex: 1,
                            }}
                        />
                    </>
                )}

                {/* Center arrows overlay */}
                {arrows.show && count > 1 && arrows.position === "center" && (
                    <>
                        <div
                            style={{
                                position: "absolute",
                                left: `${arrows.inset}px`,
                                top: "50%",
                                transform: "translateY(-50%)",
                                zIndex: 2,
                                pointerEvents: "auto",
                            }}
                        >
                            <ArrowBtn
                                onClick={handlePrev}
                                disabled={!canGoPrev}
                                label="Previous slide"
                            >
                                {renderPrevIcon()}
                            </ArrowBtn>
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                right: `${arrows.inset}px`,
                                top: "50%",
                                transform: "translateY(-50%)",
                                zIndex: 2,
                                pointerEvents: "auto",
                            }}
                        >
                            <ArrowBtn
                                onClick={handleNext}
                                disabled={!canGoNext}
                                label="Next slide"
                            >
                                {renderNextIcon()}
                            </ArrowBtn>
                        </div>
                    </>
                )}
            </div>

            {arrows.show && count > 1 && arrows.position === "bottom" && (
                <ArrowRowWithProgress />
            )}

            {/* Progress bar */}
            {count > 1 && progress.showBar && !progressWithArrows && (
                <div
                    aria-hidden="true"
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            width: `${clamp(progress.barWidth ?? 100, 0, 100)}%`,
                            height: clamp(progress.barHeight ?? 3, 1, 32),
                            borderRadius: 99,
                            background: progressTrackColor,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${progressBarPercent}%`,
                                background: "currentColor",
                                opacity: 0.6,
                                transition:
                                    "width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Dots */}
            {count > 1 && progress.showDots && !progressWithArrows && (
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    aria-label="Carousel pagination"
                    role="tablist"
                >
                    {Array.from({ length: dotsCount }).map((_, i) => {
                        const active = i === activeDotIndex
                        return (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Go to slide ${i + 1}`}
                                aria-selected={active}
                                role="tab"
                                onClick={() => goTo(i)}
                                style={{
                                    width: clamp(progress.dotWidth ?? 8, 2, 64),
                                    height: clamp(
                                        progress.dotHeight ?? 8,
                                        2,
                                        64
                                    ),
                                    borderRadius: 99,
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    background: active
                                        ? progressActiveDotColor
                                        : progressInactiveDotColor,
                                    opacity: active ? 1 : 0.6,
                                    transition:
                                        "background 0.2s, transform 0.2s, opacity 0.2s",
                                    transform: active
                                        ? "scale(1.25)"
                                        : "scale(1)",
                                }}
                            />
                        )
                    })}
                </div>
            )}
        </section>
    )
}

function SparklesIcon({ color }: { color: string }) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ display: "block", color }}
        >
            <path
                d="M12 2l1.3 4.2L18 7.5l-4.7 1.3L12 13l-1.3-4.2L6 7.5l4.7-1.3L12 2z"
                fill="currentColor"
                opacity="0.9"
            />
            <path
                d="M19 13l.8 2.6 2.7.8-2.7.8L19 20l-.8-2.6-2.7-.8 2.7-.8L19 13z"
                fill="currentColor"
                opacity="0.55"
            />
        </svg>
    )
}

function Arrow({ direction }: { direction: "left" | "right" }) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {direction === "left" ? (
                <path
                    d="M14.5 6.5L8.5 12l6 5.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : (
                <path
                    d="M9.5 6.5l6 5.5-6 5.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
        </svg>
    )
}

addPropertyControls(SmoothCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: { type: ControlType.ComponentInstance },
        defaultValue: [null],
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["single", "multi"],
        optionTitles: ["Single", "Multi"],
        defaultValue: "single",
        displaySegmentedControl: true,
    },
    visibleCount: {
        type: ControlType.Number,
        title: "Visible",
        defaultValue: 2,
        min: 1,
        max: 12,
        step: 1,
        hidden: (p: any) => (p?.layout ?? "single") !== "multi",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: (p: any) => (p?.layout ?? "single") === "multi",
    },
    gap: {
        type: ControlType.Number,
        title: "Layout Gap",
        defaultValue: 10,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    itemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        defaultValue: 10,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 10,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    textColor: {
        type: ControlType.Color,
        title: "Progress Active",
        defaultValue: "#000000",
        hidden: (_v: any, r: any) => !(r?.progress?.showBar ?? false),
    },
    progressTrackColor: {
        type: ControlType.Color,
        title: "Progress Track",
        defaultValue: "hsla(0,0%,0%,0.12)",
        hidden: (_v: any, r: any) => !(r?.progress?.showBar ?? false),
    },
    progressActiveDotColor: {
        type: ControlType.Color,
        title: "Dot Active",
        defaultValue: "#000000",
        hidden: (_v: any, r: any) => !(r?.progress?.showDots ?? true),
    },
    progressInactiveDotColor: {
        type: ControlType.Color,
        title: "Dot Inactive",
        defaultValue: "hsla(0,0%,0%,0.18)",
        hidden: (_v: any, r: any) => !(r?.progress?.showDots ?? true),
    },
    sizing: {
        type: ControlType.Object,
        title: "Sizing",
        icon: "object",
        controls: {
            width: {
                type: ControlType.Enum,
                title: "Width",
                options: ["auto", "stretch"],
                optionTitles: ["Auto", "Stretch"],
                defaultValue: "auto",
            },
            height: {
                type: ControlType.Enum,
                title: "Height",
                options: ["auto", "stretch"],
                optionTitles: ["Auto", "Stretch"],
                defaultValue: "stretch",
            },
            itemHeight: {
                type: ControlType.Number,
                title: "Item Height",
                defaultValue: 240,
                min: 1,
                max: 2000,
                step: 1,
                unit: "px",
                hidden: (_v: any, r: any) =>
                    (r?.sizing?.height ?? "auto") !== "auto",
            },
        },
        defaultValue: {
            width: "auto",
            height: "stretch",
            itemHeight: 240,
        },
    },
    fading: {
        type: ControlType.Object,
        title: "Fading",
        icon: "object",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Fading",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#000000",
                hidden: (_v: any, r: any) => !(r?.fading?.enabled ?? false),
            },
        },
        defaultValue: { enabled: false, color: "#000000" },
    },
    progress: {
        type: ControlType.Object,
        title: "Progress",
        icon: "object",
        controls: {
            showBar: {
                type: ControlType.Boolean,
                title: "Progress Bar",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            showDots: {
                type: ControlType.Boolean,
                title: "Dots",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            barWidth: {
                type: ControlType.Number,
                title: "Bar Width",
                defaultValue: 100,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (_v: any, r: any) => !(r?.progress?.showBar ?? false),
            },
            barHeight: {
                type: ControlType.Number,
                title: "Bar Height",
                defaultValue: 3,
                min: 1,
                max: 32,
                step: 1,
                unit: "px",
                hidden: (_v: any, r: any) => !(r?.progress?.showBar ?? false),
            },
            dotWidth: {
                type: ControlType.Number,
                title: "Dot Width",
                defaultValue: 8,
                min: 2,
                max: 64,
                step: 1,
                unit: "px",
                hidden: (_v: any, r: any) => !(r?.progress?.showDots ?? true),
            },
            dotHeight: {
                type: ControlType.Number,
                title: "Dot Height",
                defaultValue: 8,
                min: 2,
                max: 64,
                step: 1,
                unit: "px",
                hidden: (_v: any, r: any) => !(r?.progress?.showDots ?? true),
            },
        },
        defaultValue: {
            showBar: false,
            showDots: true,
            barWidth: 100,
            barHeight: 3,
            dotWidth: 8,
            dotHeight: 8,
        },
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        icon: "object",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["top", "center", "bottom"],
                optionTitles: ["Top", "Center", "Bottom"], // @ts-ignore - Framer native icon names
                defaultValue: "center",
                displaySegmentedControl: true,
                hidden: (_v: any, r: any) => !(r?.arrows?.show ?? true),
            },
            alignH: {
                type: ControlType.Enum,
                title: "Align H",
                options: ["apart", "left", "center", "right"],
                optionTitles: ["Apart", "Left", "Center", "Right"],
                defaultValue: "apart",
                hidden: (_v: any, r: any) =>
                    !(r?.arrows?.show ?? true) ||
                    (r?.arrows?.position ?? "center") === "center",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                hidden: (_v: any, r: any) =>
                    !(r?.arrows?.show ?? true) ||
                    (r?.arrows?.position ?? "center") === "center" ||
                    (r?.arrows?.alignH ?? "apart") === "apart",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 42,
                min: 24,
                max: 96,
                step: 1,
                unit: "px",
                hidden: (_v: any, r: any) => !(r?.arrows?.show ?? true),
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 40,
                min: 0,
                max: 200,
                step: 1,
                hidden: (_v: any, r: any) => !(r?.arrows?.show ?? true),
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                defaultValue: 32,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                hidden: (_v: any, r: any) => !(r?.arrows?.show ?? true),
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#000000",
                hidden: (_v: any, r: any) => !(r?.arrows?.show ?? true),
            },
            prevIconFile: {
                type: ControlType.File,
                title: "Prev Icon",
                allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
                hidden: (_v: any, r: any) => !(r?.arrows?.show ?? true),
            },
            nextIconFile: {
                type: ControlType.File,
                title: "Next Icon",
                allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
                hidden: (_v: any, r: any) => !(r?.arrows?.show ?? true),
            },
        },
        defaultValue: {
            show: true,
            position: "center",
            alignH: "apart",
            gap: 8,
            fill: "#000000",
            size: 42,
            radius: 40,
            inset: 32,
        },
    },
    prevArrow: { type: ControlType.ComponentInstance, title: "Back Arrow" },
    nextArrow: { type: ControlType.ComponentInstance, title: "Next Arrow" },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlaySeconds: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 4,
        min: 0.5,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (p: any) => !(p?.autoPlay ?? false),
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Carousel",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
})
