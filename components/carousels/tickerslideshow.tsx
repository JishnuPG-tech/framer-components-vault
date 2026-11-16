// Instructions from user: Can you review the code, and see it not meets markeplace guidlines
import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    startTransition,
    type ReactNode,
    type CSSProperties,
    type KeyboardEvent,
    type TransitionEvent,
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


// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
    items?: ReactNode[]
    tickerSpeed?: number
    tickerDirection?: "left" | "right"
    slideshowInterval?: number
    pauseOnHover?: boolean
    gap?: number
    breakpoint?: number
    dotActiveColor?: string
    mobileItemWidth?: "fill" | "fixed" | "fit"
    slideGap?: number
    pauseOnCanvas?: boolean
    style?: CSSProperties
}

// Assumed render width of each ticker card (desktop only).
const TICKER_ITEM_WIDTH = 260

// CSS transition used for snap animations and dot navigation
const SLIDE_TRANSITION = "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)"

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Instructions from user:
 * Can you check the whole component, and see it fully meets the componnet submission guidlines to framer marketplace
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 200
 */
export default function TickerSlideshow({
    items = [],
    tickerSpeed = 40,
    tickerDirection = "left",
    slideshowInterval = 3000,
    pauseOnHover = true,
    gap = 20,
    breakpoint = 640,
    dotActiveColor = "#E8501A",
    mobileItemWidth = "fill",
    slideGap = 16,
    pauseOnCanvas = false,
    style,
}: Props) {
    const safeItems = useMemo(() => items.filter((n) => n != null), [items])

    // Normalize potentially invalid values (e.g. negative numbers)
    const safeTickerSpeed = useMemo(
        () => Math.max(1, tickerSpeed),
        [tickerSpeed]
    )
    const safeGap = useMemo(() => Math.max(0, gap), [gap])
    const safeSlideGap = useMemo(() => Math.max(0, slideGap), [slideGap])
    const safeSlideshowInterval = useMemo(
        () => Math.max(250, slideshowInterval),
        [slideshowInterval]
    )
    const safeBreakpoint = useMemo(() => Math.max(0, breakpoint), [breakpoint])

    const [activeIndex, setActiveIndex] = useState(0)
    const [containerWidth, setContainerWidth] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)

    const [isDragging, setIsDragging] = useState(false)
    const isDraggingRef = useRef(false)

    const [isPaused, setIsPaused] = useState(false)

    // Memoized desktop ticker helpers (safe to compute for all layouts)
    const totalWidth = useMemo(
        () => safeItems.length * (TICKER_ITEM_WIDTH + safeGap),
        [safeItems.length, safeGap]
    )
    const duplicated = useMemo(() => [...safeItems, ...safeItems], [safeItems])

    // Check if we're in a static render context (thumbnail/export)
    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail

    // Check if we're in export mode
    const isExport = RenderTarget.current() === RenderTarget.export

    // Static render context used for thumbnails only.
    // Note: exports should still be able to measure width to decide between ticker/slideshow.
    const isStatic = isThumbnail

    // Check if we're in canvas mode
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Detect reduced motion preference
    const prefersReducedMotion =
        typeof window !== "undefined" &&
        typeof window.matchMedia !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Always-fresh ref for activeIndex — lets handleTransitionEnd read the
    // live value without depending on a potentially-stale closure, and without
    // any boolean flag that can get out of sync.
    const activeIndexRef = useRef(activeIndex)
    activeIndexRef.current = activeIndex

    const isMobile = containerWidth > 0 && containerWidth <= safeBreakpoint
    const canLoop = safeItems.length > 1

    const touchStartX = useRef<number | null>(null)
    const touchStartY = useRef<number | null>(null)
    const touchStartTime = useRef<number>(0)
    const intervalRef = useRef<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const containerWidthRef = useRef(containerWidth)
    containerWidthRef.current = containerWidth

    // ── Inject global styles once ────────────────────────────────────────────
    useEffect(() => {
        if (isThumbnail || isExport) return
        if (typeof document === "undefined") return
        const ID = "ticker-slideshow-styles"
        if (document.getElementById(ID)) return
        try {
            const el = document.createElement("style")
            el.id = ID
            el.textContent = `
                @keyframes ticker-scroll {
                    from { transform: translateX(0); }
                    to   { transform: translateX(var(--ticker-offset)); }
                }
                .ts-item-fill > * {
                    width: 100% !important;
                    max-width: 100% !important;
                    min-width: 0 !important;
                    box-sizing: border-box !important;
                }
                .ts-item-fit > * {
                    width: fit-content !important;
                }
            `
            document.head.appendChild(el)
        } catch (error) {
            if (typeof console !== "undefined") {
                console.error("Failed to inject ticker styles:", error)
            }
        }
    }, [isThumbnail, isExport])

    // ── Measure container width ──────────────────────────────────────────────
    useEffect(() => {
        if (isThumbnail) return
        const el = containerRef.current
        if (!el) return

        // ResizeObserver may not exist in some static/export environments.
        if (typeof ResizeObserver === "undefined") {
            startTransition(() =>
                setContainerWidth(el.getBoundingClientRect().width)
            )
            return
        }

        const ro = new ResizeObserver(([entry]) => {
            if (entry?.contentRect) {
                startTransition(() =>
                    setContainerWidth(entry.contentRect.width)
                )
            }
        })
        ro.observe(el)
        return () => {
            if (ro) ro.disconnect()
        }
    }, [isThumbnail])

    // ── Navigation ───────────────────────────────────────────────────────────
    const goNext = useCallback(() => {
        if (!canLoop) return
        startTransition(() => {
            setIsTransitioning(true)
            setActiveIndex((i) => i + 1)
        })
    }, [canLoop])

    const goPrev = useCallback(() => {
        if (!canLoop) return
        startTransition(() => {
            setIsTransitioning(true)
            setActiveIndex((i) => i - 1)
        })
    }, [canLoop])

    const resetAutoplay = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }

        // Never restart autoplay while paused in Canvas
        if (isCanvas && pauseOnCanvas) return

        if (typeof window === "undefined") return

        if (canLoop && isMobile) {
            intervalRef.current = window.setInterval(
                goNext,
                safeSlideshowInterval
            )
        }
    }, [
        goNext,
        safeSlideshowInterval,
        canLoop,
        isMobile,
        isCanvas,
        pauseOnCanvas,
    ])

    // ── Keyboard navigation ──────────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") {
                goNext()
                resetAutoplay()
            }
            if (e.key === "ArrowLeft") {
                goPrev()
                resetAutoplay()
            }
        },
        [goNext, goPrev, resetAutoplay]
    )

    // ── Auto-play ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isStatic || isExport || prefersReducedMotion) return
        if (typeof window === "undefined") return
        if (!isMobile || !canLoop) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }
        // Pause slideshow when pauseOnCanvas is enabled and we're in canvas mode
        if (isCanvas && pauseOnCanvas) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }
        intervalRef.current = window.setInterval(goNext, safeSlideshowInterval)
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [
        isMobile,
        canLoop,
        goNext,
        safeSlideshowInterval,
        isStatic,
        isExport,
        prefersReducedMotion,
        isCanvas,
        pauseOnCanvas,
    ])

    // ── Infinite-loop jump ───────────────────────────────────────────────────
    //
    // Previous attempts used a `shouldHandleTransitionEnd` boolean ref as a
    // "handshake" between endDrag and this handler. That approach has two
    // failure modes that accumulate over cycles:
    //
    //   1. Snap-back with no transform change: if the user barely drags and
    //      releases, dragOffset snaps back to 0 but the transform value didn't
    //      actually change, so the browser never fires `transitionend`. The flag
    //      stays true and then misaligns future transitions.
    //
    //   2. Autoplay transitions: goNext/goPrev never set the flag, so any
    //      autoplay-triggered transitionend is ignored and isTransitioning stays
    //      permanently true, eventually corrupting the clone-position math.
    //
    // FIX: remove the flag entirely. Instead:
    //   • Use activeIndexRef (updated every render) so the handler always reads
    //     the latest activeIndex without stale-closure issues.
    //   • Guard with e.target === e.currentTarget to block transitionend events
    //     that bubble up from child elements (e.g. Framer cards with their own
    //     CSS transitions).
    //   • Use >= / < boundary checks instead of === to safely handle any
    //     out-of-bounds drift caused by rapid swipes or autoplay overlap.
    //
    // Every transitionend that reaches the track itself (not a child) is now
    // handled unconditionally — isTransitioning is always cleared, and any
    // boundary overrun is corrected immediately.
    const handleTransitionEnd = useCallback(
        (e: TransitionEvent<HTMLDivElement>) => {
            // Ignore events that bubbled up from child elements.
            if (e.target !== e.currentTarget) return

            const idx = activeIndexRef.current

            if (idx >= safeItems.length) {
                // Past the end clone → jump to first real item.
                startTransition(() => setActiveIndex(0))
            } else if (idx < 0) {
                // Before the start clone → jump to last real item.
                startTransition(() => setActiveIndex(safeItems.length - 1))
            }

            // Always clear the transition flag so subsequent slides work.
            startTransition(() => setIsTransitioning(false))
        },
        [safeItems.length]
        // activeIndex intentionally omitted — we use activeIndexRef instead,
        // which is always current without requiring the callback to be
        // recreated on every index change.
    )

    // ── Drag helpers ─────────────────────────────────────────────────────────

    const startDrag = useCallback((clientX: number, clientY: number) => {
        isDraggingRef.current = true
        startTransition(() => setIsDragging(true))
        touchStartX.current = clientX
        touchStartY.current = clientY
        touchStartTime.current = Date.now()
        startTransition(() => setIsTransitioning(false))
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const moveDrag = useCallback((clientX: number) => {
        if (!isDraggingRef.current || touchStartX.current === null) return
        startTransition(() => setDragOffset(clientX - touchStartX.current))
    }, [])

    const endDrag = useCallback(
        (clientX: number) => {
            if (!isDraggingRef.current) return
            isDraggingRef.current = false
            startTransition(() => setIsDragging(false))
            startTransition(() => setDragOffset(0))
            touchStartY.current = null

            if (touchStartX.current === null) return
            const dx = touchStartX.current - clientX
            touchStartX.current = null

            const elapsed = Date.now() - touchStartTime.current
            const velocity = Math.abs(dx) / Math.max(elapsed, 1)
            const threshold = containerWidthRef.current * 0.25
            const isFastFlick = velocity > 0.3

            // Always set isTransitioning=true so the snap-back animation (or
            // slide navigation) plays. handleTransitionEnd will clear it once
            // the CSS transition fires — no separate flag needed.
            startTransition(() => setIsTransitioning(true))

            if (dx > threshold || (isFastFlick && dx > 8)) {
                goNext()
            } else if (dx < -threshold || (isFastFlick && dx < -8)) {
                goPrev()
            }
            // else: snap back to resting position — transition already armed.

            resetAutoplay()
        },
        [goNext, goPrev, resetAutoplay]
    )

    const cancelDrag = useCallback(() => {
        isDraggingRef.current = false
        startTransition(() => setIsDragging(false))
        startTransition(() => setDragOffset(0))
        startTransition(() => setIsTransitioning(true))
        touchStartX.current = null
        touchStartY.current = null
        resetAutoplay()
    }, [resetAutoplay])

    // ── Non-passive touchmove ─────────────────────────────────────────────────
    useEffect(() => {
        if (isStatic || isExport) return
        const el = trackRef.current
        if (!el) return
        const onTouchMove = (e: TouchEvent) => {
            if (
                !isDraggingRef.current ||
                touchStartX.current === null ||
                touchStartY.current === null
            )
                return
            const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current)
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)
            if (deltaX > deltaY) {
                e.preventDefault()
                moveDrag(e.touches[0].clientX)
            } else {
                cancelDrag()
            }
        }
        el.addEventListener("touchmove", onTouchMove, { passive: false })
        return () => {
            if (el) el.removeEventListener("touchmove", onTouchMove)
        }
    }, [moveDrag, cancelDrag, isStatic, isExport])

    // ── Global mouseup ───────────────────────────────────────────────────────
    useEffect(() => {
        if (isStatic || isExport) return
        const onMouseUp = (e: MouseEvent) => {
            if (isDraggingRef.current) endDrag(e.clientX)
        }
        if (typeof window !== "undefined") {
            window.addEventListener("mouseup", onMouseUp)
        }
        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("mouseup", onMouseUp)
            }
        }
    }, [endDrag, isStatic, isExport])

    // ── Cleanup ───────────────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [])

    // ── Slide item class ─────────────────────────────────────────────────────
    const itemClass =
        mobileItemWidth === "fill"
            ? "ts-item-fill"
            : mobileItemWidth === "fit"
              ? "ts-item-fit"
              : ""

    // ── Empty state ──────────────────────────────────────────────────────────
    if (safeItems.length === 0) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px dashed #ccc",
                    borderRadius: 12,
                    color: "#aaa",
                    fontSize: 14,
                    boxSizing: "border-box",
                }}
            >
                Connect items in the property panel →
            </div>
        )
    }

    // ── Mobile: Slideshow ────────────────────────────────────────────────────
    if (isMobile) {
        const slideWidth = containerWidth
        const extendedItems = canLoop
            ? [safeItems[safeItems.length - 1], ...safeItems, safeItems[0]]
            : safeItems
        const displayIndex = canLoop ? activeIndex + 1 : activeIndex
        const translateX = -displayIndex * slideWidth + dragOffset

        const realActiveIndex =
            activeIndex === -1
                ? safeItems.length - 1
                : activeIndex === safeItems.length
                  ? 0
                  : activeIndex

        return (
            <div
                ref={containerRef}
                role="region"
                aria-roledescription="carousel"
                aria-label="Carousel"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    overflowX: "clip",
                    overflowY: "visible",
                    boxSizing: "border-box",
                    userSelect: "none",
                    cursor: isDragging ? "grabbing" : "grab",
                    outline: "none",
                }}
            >
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    style={{
                        position: "absolute",
                        left: "-10000px",
                        width: "1px",
                        height: "1px",
                        overflow: "hidden",
                    }}
                >
                    Slide {realActiveIndex + 1} of {safeItems.length}
                </div>

                {/* Sliding track */}
                <div
                    ref={trackRef}
                    onTouchStart={
                        isStatic || isExport
                            ? undefined
                            : (e) =>
                                  startDrag(
                                      e.touches[0].clientX,
                                      e.touches[0].clientY
                                  )
                    }
                    onTouchEnd={
                        isStatic || isExport
                            ? undefined
                            : (e) => endDrag(e.changedTouches[0].clientX)
                    }
                    onTouchCancel={
                        isStatic || isExport ? undefined : cancelDrag
                    }
                    onMouseDown={
                        isStatic || isExport
                            ? undefined
                            : (e) => startDrag(e.clientX, e.clientY)
                    }
                    onMouseMove={
                        isStatic || isExport
                            ? undefined
                            : (e) => moveDrag(e.clientX)
                    }
                    onTransitionEnd={handleTransitionEnd}
                    style={{
                        display: "flex",
                        width: slideWidth || "100%",
                        transition:
                            !isDragging &&
                            isTransitioning &&
                            !prefersReducedMotion &&
                            !(isCanvas && pauseOnCanvas)
                                ? SLIDE_TRANSITION
                                : "none",
                        transform: `translateX(${translateX}px)`,
                        willChange:
                            isDragging || isTransitioning
                                ? "transform"
                                : "auto",
                    }}
                >
                    {extendedItems.map((item, i) => (
                        <div
                            key={i}
                            className={itemClass}
                            style={{
                                width: slideWidth || "100%",
                                minWidth: slideWidth || "100%",
                                flexShrink: 0,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                boxSizing: "border-box",
                                padding: `0 ${safeSlideGap}px`,
                                pointerEvents: isDragging ? "none" : "auto",
                            }}
                        >
                            {item}
                        </div>
                    ))}
                </div>

                {/* Pill dots */}
                {canLoop && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 6,
                            paddingTop: 12,
                        }}
                        role="tablist"
                        aria-label="Slides"
                    >
                        {safeItems.map((_, i) => {
                            const isActive =
                                activeIndex === i ||
                                (activeIndex === -1 &&
                                    i === safeItems.length - 1) ||
                                (activeIndex === safeItems.length && i === 0)
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-label={`Go to slide ${i + 1}`}
                                    onClick={() => {
                                        startTransition(() => {
                                            setActiveIndex(i)
                                            setIsTransitioning(true)
                                        })
                                        resetAutoplay()
                                    }}
                                    style={{
                                        width: isActive ? 22 : 8,
                                        height: 8,
                                        borderRadius: 4,
                                        border: "none",
                                        background: isActive
                                            ? dotActiveColor
                                            : "#e0e0e0",
                                        cursor: "pointer",
                                        padding: 0,
                                        transition: "all 0.3s ease",
                                        flexShrink: 0,
                                    }}
                                />
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    // ── Desktop: Ticker ──────────────────────────────────────────────────────
    // Static preview: show first few items without animation
    if (isThumbnail || isExport) {
        return (
            <div
                ref={containerRef}
                role="region"
                aria-label="Ticker"
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflowX: "clip",
                    overflowY: "visible",
                    display: "flex",
                    alignItems: "center",
                    boxSizing: "border-box",
                    userSelect: "none",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        width: "max-content",
                    }}
                >
                    {safeItems
                        .slice(0, Math.min(safeItems.length, 5))
                        .map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    minWidth: TICKER_ITEM_WIDTH,
                                    marginRight: safeGap,
                                    flexShrink: 0,
                                }}
                            >
                                {item}
                            </div>
                        ))}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label="Ticker"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflowX: "clip",
                overflowY: "visible",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
                userSelect: "none",
            }}
            onMouseEnter={() =>
                pauseOnHover && startTransition(() => setIsPaused(true))
            }
            onMouseLeave={() =>
                pauseOnHover && startTransition(() => setIsPaused(false))
            }
        >
            <div
                style={
                    {
                        display: "flex",
                        alignItems: "center",
                        width: "max-content",
                        animation:
                            isPaused ||
                            prefersReducedMotion ||
                            (isCanvas && pauseOnCanvas) ||
                            isExport
                                ? "none"
                                : `ticker-scroll ${safeTickerSpeed}s linear infinite`,
                        animationDirection:
                            tickerDirection === "right" ? "reverse" : "normal",
                        ["--ticker-offset" as string]: `-${totalWidth}px`,
                    } as CSSProperties
                }
            >
                {duplicated.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            minWidth: TICKER_ITEM_WIDTH,
                            marginRight: safeGap,
                            flexShrink: 0,
                            pointerEvents: "auto",
                        }}
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(TickerSlideshow, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: { type: ControlType.ComponentInstance, title: "Element" },
        maxCount: 20,
        defaultValue: [null],
        description:
            "Add component instances to display in the ticker/slideshow",
    },
    pauseOnCanvas: {
        type: ControlType.Boolean,
        title: "Pause on Canvas",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "Pause ticker and slideshow autoplay/animations in the canvas for easier editing",
    },
    tickerDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["← Left", "Right →"],
        defaultValue: "left",
        displaySegmentedControl: true,
        description: "Scroll direction for ticker mode (desktop)",
    },
    tickerSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 40,
        min: 5,
        max: 120,
        step: 1,
        unit: "s",
        displayStepper: true,
        description: "Seconds for one full scroll loop",
    },
    gap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 20,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "Space between cards in ticker mode",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Pause ticker animation when hovering (desktop only)",
    },
    mobileItemWidth: {
        type: ControlType.Enum,
        title: "Item Width",
        options: ["fill", "fixed", "fit"],
        optionTitles: ["Fill", "Fixed", "Fit"],
        defaultValue: "fill",
        displaySegmentedControl: true,
        description:
            "Slideshow only · Fill: stretch to frame · Fixed: canvas size · Fit: shrink to content",
    },
    slideGap: {
        type: ControlType.Number,
        title: "Slide Gap",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "Horizontal padding on each side of the card",
    },
    slideshowInterval: {
        type: ControlType.Number,
        title: "Slide Interval",
        defaultValue: 3000,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
        displayStepper: true,
        description: "Time between automatic slide transitions",
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Active Dot",
        defaultValue: "#E8501A",
        description: "Color of the active dot indicator",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        defaultValue: 640,
        min: 320,
        max: 1440,
        step: 1,
        unit: "px",
        displayStepper: true,
        description:
            "Ticker on tablet/desktop, slideshow on mobile (below this width)",
    },
})

TickerSlideshow.displayName = "Ticker Slideshow"
